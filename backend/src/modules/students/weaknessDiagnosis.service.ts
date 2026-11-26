import { prisma } from '../../config/database.js';
import { OwnershipActor } from '../../utils/ownership.js';
import { NotFoundError, TooManyRequestsError } from '../../utils/errors.js';
import {
  WeaknessStatus,
  WeaknessTagsPayload,
  SuggestedActionPayload,
  safeParseWeaknessTags,
  safeParseSuggestedAction,
} from './weaknessDiagnosis.schema.js';

export interface SubjectDiagnosisDto {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  masteryLevel: number;
  weaknessIndex: number;
  status: WeaknessStatus;
  sampleSize: number;
  accuracyRate: number;
  unresolvedCount: number;
  reviewingCount: number;
  masteredCount: number;
  recentWrongCount: number;
  dataWatermark: string;
  calculatedAt: string;
  isFresh: boolean;
  isDegraded?: boolean;
  suggestedAction: SuggestedActionPayload | null;
}

export interface StudentWeaknessSummaryDto {
  totalSubjects: number;
  evaluatedSubjects: number;
  criticalCount: number;
  moderateCount: number;
  steadyCount: number;
  masteryCount: number;
  insufficientCount: number;
  noDataCount: number;
  primaryFocusSubject: {
    id: string;
    code: string;
    name: string;
    status: WeaknessStatus;
    weaknessIndex: number;
    suggestedAction: SuggestedActionPayload | null;
  } | null;
  overallDiagnosisZh: string;
  lastAnalyzedAt: string;
}

export interface WeaknessAnalysisResponseDto {
  summary: StudentWeaknessSummaryDto;
  subjects: SubjectDiagnosisDto[];
}

export class WeaknessDiagnosisService {
  // In-memory Single-Flight concurrency map: key = `${userId}:${subjectId}`
  private inFlightMap = new Map<string, Promise<SubjectDiagnosisDto>>();

  // In-memory rate limiter for manual recalculations: key = userId, value = timestamp
  private recalculateRateLimitMap = new Map<string, number>();

  // In-memory circuit breaker failure counter: key = `${userId}:${subjectId}`
  private circuitBreakerMap = new Map<string, { count: number; lastFailedAt: number }>();

  /**
   * Retrieves comprehensive student weakness diagnosis across all 4 official work items.
   * Employs Read-Through caching with composite freshness watermark and two-stage sorting.
   */
  async getStudentWeaknessAnalysis(
    actor: OwnershipActor,
    forceRecalculate = false,
    now: Date = new Date()
  ): Promise<WeaknessAnalysisResponseDto> {
    const subjects = await prisma.subject.findMany({
      orderBy: { code: 'asc' },
    });

    if (subjects.length === 0) {
      throw new NotFoundError('系統尚未初始化官方考科目錄');
    }

    // Process each subject with Read-Through / Single-Flight
    const diagnosisPromises = subjects.map((subject) =>
      this.getSubjectWeaknessAnalysisInternal(actor.id, subject, forceRecalculate, now)
    );

    const subjectDiagnoses = await Promise.all(diagnosisPromises);

    // Apply Two-Stage Sorting Algorithm
    const sortedSubjects = this.sortWeaknessDiagnoses(subjectDiagnoses);

    // Build Executive Summary
    const summary = this.buildWeaknessSummary(sortedSubjects, now);

    return {
      summary,
      subjects: sortedSubjects,
    };
  }

  /**
   * Retrieves single subject weakness diagnosis for a student.
   */
  async getSubjectWeaknessAnalysis(
    actor: OwnershipActor,
    subjectId: string,
    forceRecalculate = false,
    now: Date = new Date()
  ): Promise<SubjectDiagnosisDto> {
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new NotFoundError(`找不到指定之科目 (${subjectId})`);
    }

    return this.getSubjectWeaknessAnalysisInternal(actor.id, subject, forceRecalculate, now);
  }

  /**
   * Manual recalculation endpoint with 10s cooldown to prevent DoS.
   */
  async recalculateWeaknessAnalysis(
    actor: OwnershipActor,
    subjectId?: string,
    now: Date = new Date()
  ): Promise<WeaknessAnalysisResponseDto | SubjectDiagnosisDto> {
    const lastRecalcTime = this.recalculateRateLimitMap.get(actor.id);
    const COOLDOWN_MS = 10 * 1000; // 10 seconds

    if (lastRecalcTime && now.getTime() - lastRecalcTime < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (now.getTime() - lastRecalcTime)) / 1000);
      throw new TooManyRequestsError(`請勿頻繁觸發弱點診斷重算，冷卻時間剩餘 ${waitSeconds} 秒`);
    }

    this.recalculateRateLimitMap.set(actor.id, now.getTime());

    if (subjectId) {
      return this.getSubjectWeaknessAnalysis(actor, subjectId, true, now);
    }

    return this.getStudentWeaknessAnalysis(actor, true, now);
  }

  /**
   * Internal Read-Through worker with Single-Flight and Self-Healing.
   */
  private async getSubjectWeaknessAnalysisInternal(
    userId: string,
    subject: { id: string; code: string; title: string },
    forceRecalculate: boolean,
    now: Date
  ): Promise<SubjectDiagnosisDto> {
    const flightKey = `${userId}:${subject.id}`;

    // Single-Flight check: if calculation is already running for this user & subject, merge and await
    if (this.inFlightMap.has(flightKey)) {
      return this.inFlightMap.get(flightKey)!;
    }

    const taskPromise = (async () => {
      // 1. Fetch current persisted snapshot
      const existingSnapshot = await prisma.studentWeaknessAnalysis.findUnique({
        where: {
          userId_subjectId: {
            userId,
            subjectId: subject.id,
          },
        },
      });

      // 2. Query source data watermark
      const sourceWatermark = await this.querySourceDataWatermark(userId, subject.id);

      // 3. Freshness evaluation
      const isStale = forceRecalculate || this.isSnapshotStale(existingSnapshot, sourceWatermark, now);

      if (!isStale && existingSnapshot) {
        const payload = safeParseWeaknessTags(existingSnapshot.weaknessTags);
        const action = safeParseSuggestedAction(existingSnapshot.suggestedAction);
        if (payload) {
          return this.formatDto(subject, existingSnapshot.masteryLevel, payload, action, true);
        }
      }

      // 4. Circuit breaker protection: if repeated recalculation failures occur, return fallback
      const breaker = this.circuitBreakerMap.get(flightKey);
      if (breaker && breaker.count >= 3 && now.getTime() - breaker.lastFailedAt < 5 * 60 * 1000) {
        if (existingSnapshot) {
          const fallbackPayload = safeParseWeaknessTags(existingSnapshot.weaknessTags);
          const fallbackAction = safeParseSuggestedAction(existingSnapshot.suggestedAction);
          if (fallbackPayload) {
            return this.formatDto(subject, existingSnapshot.masteryLevel, fallbackPayload, fallbackAction, false, true);
          }
        }
        // Fallback default
        return this.createSafeFallbackDto(subject, now);
      }

      // 5. Execute core calculation
      try {
        const computed = await this.computeAndPersistSubjectDiagnosis(userId, subject, sourceWatermark, now);
        // Reset breaker on success
        this.circuitBreakerMap.delete(flightKey);
        return computed;
      } catch (err) {
        // Record failure in circuit breaker
        const currentCount = breaker?.count || 0;
        this.circuitBreakerMap.set(flightKey, { count: currentCount + 1, lastFailedAt: now.getTime() });

        // Fallback to existing degraded snapshot if available
        if (existingSnapshot) {
          const fallbackPayload = safeParseWeaknessTags(existingSnapshot.weaknessTags);
          const fallbackAction = safeParseSuggestedAction(existingSnapshot.suggestedAction);
          if (fallbackPayload) {
            return this.formatDto(subject, existingSnapshot.masteryLevel, fallbackPayload, fallbackAction, false, true);
          }
        }

        throw err;
      }
    })();

    this.inFlightMap.set(flightKey, taskPromise);

    try {
      return await taskPromise;
    } finally {
      this.inFlightMap.delete(flightKey);
    }
  }

  /**
   * Evaluates snapshot freshness based on the INT-007-A V2.2 composite watermark algorithm.
   */
  public isSnapshotStale(
    snapshot: { weaknessTags: string | null; updatedAt: Date } | null,
    sourceWatermark: Date | null,
    now: Date = new Date()
  ): boolean {
    // Condition 1: No snapshot recorded
    if (!snapshot) return true;

    // Condition 2: Payload corrupted or invalid
    const payload = safeParseWeaknessTags(snapshot.weaknessTags);
    if (!payload) return true;

    // Condition 3: Source data watermark is newer than calculation timestamp
    if (sourceWatermark && sourceWatermark.getTime() > new Date(payload.calculatedAt).getTime()) {
      return true;
    }

    const calculatedTimeMs = new Date(payload.calculatedAt).getTime();
    const snapshotAgeMs = now.getTime() - calculatedTimeMs;

    // Condition 4: Time decay sliding window check (if has recent wrong answers and snapshot > 1 hour old)
    if (payload.recentWrongCount > 0 && snapshotAgeMs > 3600 * 1000) {
      return true;
    }

    // Condition 5: Absolute TTL (24 hours forced recalibration)
    if (snapshotAgeMs > 24 * 3600 * 1000) {
      return true;
    }

    // Edge Case: 0 attempts ever recorded, snapshot already says NO_DATA -> keep fresh
    if (sourceWatermark === null && payload.status === 'NO_DATA') {
      return false;
    }

    return false;
  }

  /**
   * Queries latest updated timestamp across the 3 physical source tables.
   */
  private async querySourceDataWatermark(userId: string, subjectId: string): Promise<Date | null> {
    // Source 1: Latest submitted exam attempt containing questions for this subject
    const latestExam = await prisma.examAttempt.findFirst({
      where: {
        userId,
        submittedAt: { not: null },
        answerSnapshots: {
          some: {
            question: { subjectId },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      select: { submittedAt: true },
    });

    // Source 2: Latest updated wrong question record for this subject
    const latestWrong = await prisma.wrongQuestionRecord.findFirst({
      where: {
        userId,
        question: { subjectId },
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    // Source 3: Latest unit progress update for this subject
    const latestProgress = await prisma.unitProgress.findFirst({
      where: {
        userId,
        subjectId,
      },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    const timestamps: number[] = [];
    if (latestExam?.submittedAt) timestamps.push(latestExam.submittedAt.getTime());
    if (latestWrong?.updatedAt) timestamps.push(latestWrong.updatedAt.getTime());
    if (latestProgress?.updatedAt) timestamps.push(latestProgress.updatedAt.getTime());

    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }

  /**
   * Core deterministic Weakness Index (WI) computation and persistence worker.
   */
  public async computeAndPersistSubjectDiagnosis(
    userId: string,
    subject: { id: string; code: string; title: string },
    sourceWatermark: Date | null,
    now: Date = new Date()
  ): Promise<SubjectDiagnosisDto> {
    // 1. Fetch all submitted exam answer snapshots for this subject
    const answerSnapshots = await prisma.examAnswerSnapshot.findMany({
      where: {
        attempt: {
          userId,
          submittedAt: { not: null },
        },
        question: {
          subjectId: subject.id,
        },
      },
      select: {
        questionId: true,
        isCorrect: true,
      },
    });

    // 2. Fetch all wrong question records for this subject
    const wrongRecords = await prisma.wrongQuestionRecord.findMany({
      where: {
        userId,
        question: {
          subjectId: subject.id,
        },
      },
      select: {
        questionId: true,
        masteryStatus: true,
        wrongCount: true,
        consecutiveCorrectCount: true,
        lastAttemptAt: true,
        updatedAt: true,
      },
    });

    // 3. Compute distinct attempted questions (SampleSize)
    const distinctAttemptedQuestionIds = new Set<string>();
    let correctResponsesCount = 0;
    const totalResponsesCount = answerSnapshots.length;

    answerSnapshots.forEach((snap) => {
      if (snap.questionId) {
        distinctAttemptedQuestionIds.add(snap.questionId);
      }
      if (snap.isCorrect) {
        correctResponsesCount++;
      }
    });

    // Also include questions attempted through wrong questions practice
    wrongRecords.forEach((wq) => {
      if (wq.questionId) {
        distinctAttemptedQuestionIds.add(wq.questionId);
      }
    });

    const sampleSize = distinctAttemptedQuestionIds.size;
    const accuracyRate = totalResponsesCount > 0 ? correctResponsesCount / totalResponsesCount : 0.0;

    // 4. Compute mastery status counts
    let unresolvedCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;

    const oneWeekAgoMs = now.getTime() - 168 * 3600 * 1000;
    let recentUnresCount = 0;
    let recentRevCount = 0;

    wrongRecords.forEach((wq) => {
      if (wq.masteryStatus === 'UNRESOLVED') {
        unresolvedCount++;
        const wrongTime = (wq.lastAttemptAt || wq.updatedAt).getTime();
        if (wrongTime >= oneWeekAgoMs) {
          recentUnresCount++;
        }
      } else if (wq.masteryStatus === 'REVIEWING') {
        reviewingCount++;
        const wrongTime = (wq.lastAttemptAt || wq.updatedAt).getTime();
        if (wrongTime >= oneWeekAgoMs) {
          recentRevCount++;
        }
      } else if (wq.masteryStatus === 'MASTERED') {
        masteredCount++;
        // MASTERED questions are strictly excluded from recent wrong penalty
      }
    });

    // Weighted recent wrong penalty: N_recent = N_rec,unres + 0.5 * N_rec,rev
    const recentWrongCount = recentUnresCount + 0.5 * recentRevCount;

    // 5. Evaluate Maturity & Status
    let status: WeaknessStatus;
    let weaknessIndex = 0.0;
    let masteryLevel = 0.0;
    let suggestedAction: SuggestedActionPayload;

    if (sampleSize === 0) {
      // 0 Attempted: NO_DATA
      status = 'NO_DATA';
      weaknessIndex = 0.0;
      masteryLevel = 0.0;
      suggestedAction = {
        version: '1.0',
        actionType: 'EXPLORE_CHAPTER',
        targetSubjectCode: subject.code,
        targetQuestionCount: 10,
        rationaleZh: `${subject.title} 尚未進行任何練習，建議從官方基礎題開始探索。`,
        objectiveZh: '完成首輪 10 道題練習建立學習基線。',
      };
    } else if (sampleSize < 5) {
      // 1 ~ 4 Attempted: INSUFFICIENT_DATA (Anti-premature threshold protection)
      status = 'INSUFFICIENT_DATA';
      weaknessIndex = 0.0;
      masteryLevel = Math.round(accuracyRate * 100) / 100;
      suggestedAction = {
        version: '1.0',
        actionType: 'TARGETED_PRACTICE',
        targetSubjectCode: subject.code,
        targetQuestionCount: Math.max(5 - sampleSize, 5),
        rationaleZh: `目前僅完成 ${sampleSize} 題，樣本不足 5 題，尚在抗早熟評估階段。`,
        objectiveZh: '累積至 5 題以上以啟用深度弱點指數診斷。',
      };
    } else {
      // SampleSize >= 5: Deterministic WI Calculation
      // Backlog N_bk = N_unres + 0.5 * N_rev
      const backlog = unresolvedCount + 0.5 * reviewingCount;

      const term1 = (1.0 - accuracyRate) * 40.0;
      const term2 = Math.min(1.0, backlog / 10.0) * 35.0;
      const term3 = Math.min(1.0, recentWrongCount / 5.0) * 25.0;

      const rawWi = term1 + term2 + term3;
      weaknessIndex = Math.round(rawWi * 10) / 10;
      weaknessIndex = Math.max(0.0, Math.min(100.0, weaknessIndex));

      masteryLevel = Math.max(0.0, Math.min(1.0, Math.round((1.0 - weaknessIndex / 100.0) * 100) / 100));

      if (weaknessIndex >= 65.0) {
        status = 'CRITICAL_WEAKNESS';
        suggestedAction = {
          version: '1.0',
          actionType: 'TARGETED_PRACTICE',
          targetSubjectCode: subject.code,
          targetQuestionCount: 15,
          rationaleZh: `弱點指數高達 ${weaknessIndex} 分，存在較多未攻克錯題或近期急性錯誤。`,
          objectiveZh: '優先複習該科未掌握錯題，消除高風險失分點。',
        };
      } else if (weaknessIndex >= 40.0) {
        status = 'MODERATE_WEAKNESS';
        suggestedAction = {
          version: '1.0',
          actionType: 'TARGETED_PRACTICE',
          targetSubjectCode: subject.code,
          targetQuestionCount: 10,
          rationaleZh: `弱點指數為 ${weaknessIndex} 分，建議針對複習中題組進行針對性強化。`,
          objectiveZh: `針對 ${unresolvedCount + reviewingCount} 題錯題進行二連對攻克演練。`,
        };
      } else if (weaknessIndex >= 20.0) {
        status = 'STEADY_PROGRESS';
        suggestedAction = {
          version: '1.0',
          actionType: 'GENERAL_REVIEW',
          targetSubjectCode: subject.code,
          targetQuestionCount: 10,
          rationaleZh: `弱點指數為 ${weaknessIndex} 分，整體掌握穩定，建議定期複習鞏固。`,
          objectiveZh: '進行綜合題組隨機抽題，防止遺忘。',
        };
      } else {
        status = 'EXCELLENT_MASTERY';
        suggestedAction = {
          version: '1.0',
          actionType: 'MOCK_EXAM_SPRINT',
          targetSubjectCode: subject.code,
          targetQuestionCount: 20,
          rationaleZh: `弱點指數僅 ${weaknessIndex} 分，掌握度極高，建議進入全真模擬考衝刺。`,
          objectiveZh: '挑戰 80 題全真計時模擬考檢驗實力。',
        };
      }
    }

    const calculatedAt = now.toISOString();
    const dataWatermark = (sourceWatermark || now).toISOString();

    const tagsPayload: WeaknessTagsPayload = {
      version: '1.0',
      status,
      weaknessIndex,
      sampleSize,
      accuracyRate: Math.round(accuracyRate * 1000) / 1000,
      unresolvedCount,
      reviewingCount,
      masteredCount,
      recentWrongCount,
      dataWatermark,
      calculatedAt,
    };

    // 6. Optimistic Watermark Guard before write
    const currentDbSnapshot = await prisma.studentWeaknessAnalysis.findUnique({
      where: {
        userId_subjectId: {
          userId,
          subjectId: subject.id,
        },
      },
    });

    if (currentDbSnapshot?.weaknessTags) {
      const existingPayload = safeParseWeaknessTags(currentDbSnapshot.weaknessTags);
      if (existingPayload?.dataWatermark) {
        if (new Date(existingPayload.dataWatermark).getTime() > new Date(dataWatermark).getTime()) {
          // Drop stale write! A newer calculation has already landed.
          const existingAction = safeParseSuggestedAction(currentDbSnapshot.suggestedAction);
          return this.formatDto(subject, currentDbSnapshot.masteryLevel, existingPayload, existingAction, true);
        }
      }
    }

    // 7. Atomic Upsert into StudentWeaknessAnalysis
    const savedRecord = await prisma.studentWeaknessAnalysis.upsert({
      where: {
        userId_subjectId: {
          userId,
          subjectId: subject.id,
        },
      },
      create: {
        userId,
        subjectId: subject.id,
        masteryLevel,
        weaknessTags: JSON.stringify(tagsPayload),
        suggestedAction: JSON.stringify(suggestedAction),
      },
      update: {
        masteryLevel,
        weaknessTags: JSON.stringify(tagsPayload),
        suggestedAction: JSON.stringify(suggestedAction),
      },
    });

    return this.formatDto(subject, savedRecord.masteryLevel, tagsPayload, suggestedAction, true);
  }

  /**
   * Two-Stage Sorting Algorithm specified in INT-007-A V2.2:
   * Stage 1: Group by status priority:
   *   Group 1: CRITICAL_WEAKNESS (WI >= 65)
   *   Group 2: MODERATE_WEAKNESS (40 <= WI < 65)
   *   Group 3: NO_DATA (0 attempts)
   *   Group 4: INSUFFICIENT_DATA (1 ~ 4 attempts)
   *   Group 5: STEADY_PROGRESS (20 <= WI < 40)
   *   Group 6: EXCELLENT_MASTERY (WI < 20)
   * Stage 2: Intra-group sorting:
   *   Group 1, 2, 5, 6: Descending by WI
   *   Group 3: Ascending by official code order (17300-01 -> 17300-04)
   *   Group 4: Descending by sampleSize (most attempted first)
   */
  public sortWeaknessDiagnoses(diagnoses: SubjectDiagnosisDto[]): SubjectDiagnosisDto[] {
    const getGroupPriority = (status: WeaknessStatus): number => {
      switch (status) {
        case 'CRITICAL_WEAKNESS':
          return 1;
        case 'MODERATE_WEAKNESS':
          return 2;
        case 'NO_DATA':
          return 3;
        case 'INSUFFICIENT_DATA':
          return 4;
        case 'STEADY_PROGRESS':
          return 5;
        case 'EXCELLENT_MASTERY':
          return 6;
        default:
          return 99;
      }
    };

    return [...diagnoses].sort((a, b) => {
      const priorityA = getGroupPriority(a.status);
      const priorityB = getGroupPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Intra-group ordering
      if (priorityA === 1 || priorityA === 2 || priorityA === 5 || priorityA === 6) {
        return b.weaknessIndex - a.weaknessIndex; // WI descending
      }

      if (priorityA === 3) {
        return a.subjectCode.localeCompare(b.subjectCode); // Code ascending
      }

      if (priorityA === 4) {
        return b.sampleSize - a.sampleSize; // Attempted descending
      }

      return 0;
    });
  }

  /**
   * Builds executive summary across all 4 subjects.
   */
  private buildWeaknessSummary(
    sortedSubjects: SubjectDiagnosisDto[],
    now: Date
  ): StudentWeaknessSummaryDto {
    const totalSubjects = sortedSubjects.length;
    let criticalCount = 0;
    let moderateCount = 0;
    let steadyCount = 0;
    let masteryCount = 0;
    let insufficientCount = 0;
    let noDataCount = 0;

    sortedSubjects.forEach((s) => {
      if (s.status === 'CRITICAL_WEAKNESS') criticalCount++;
      else if (s.status === 'MODERATE_WEAKNESS') moderateCount++;
      else if (s.status === 'STEADY_PROGRESS') steadyCount++;
      else if (s.status === 'EXCELLENT_MASTERY') masteryCount++;
      else if (s.status === 'INSUFFICIENT_DATA') insufficientCount++;
      else if (s.status === 'NO_DATA') noDataCount++;
    });

    const evaluatedSubjects = criticalCount + moderateCount + steadyCount + masteryCount;

    // Primary focus subject: top ranked item after two-stage sorting (if weakness exists or needs exploration)
    const primary = sortedSubjects.length > 0 ? sortedSubjects[0] : null;

    let overallDiagnosisZh = '';
    if (criticalCount > 0) {
      overallDiagnosisZh = `檢測到 ${criticalCount} 個重大弱點工作項目（首要關注：${primary?.subjectName}），建議立即啟動專項錯題突圍。`;
    } else if (moderateCount > 0) {
      overallDiagnosisZh = `各工作項目掌握度良好，但存在 ${moderateCount} 個中度弱點（關注：${primary?.subjectName}），建議進行針對性強化。`;
    } else if (insufficientCount > 0 || noDataCount > 0) {
      overallDiagnosisZh = `部分工作項目（${insufficientCount + noDataCount}科）尚在探索或樣本累積階段，建議持續完成測驗以獲取完整能力模型。`;
    } else {
      overallDiagnosisZh = '恭喜！四大工作項目掌握度均達優秀水平，建議全力衝刺 80 題全真模擬考試。';
    }

    return {
      totalSubjects,
      evaluatedSubjects,
      criticalCount,
      moderateCount,
      steadyCount,
      masteryCount,
      insufficientCount,
      noDataCount,
      primaryFocusSubject: primary
        ? {
            id: primary.subjectId,
            code: primary.subjectCode,
            name: primary.subjectName,
            status: primary.status,
            weaknessIndex: primary.weaknessIndex,
            suggestedAction: primary.suggestedAction,
          }
        : null,
      overallDiagnosisZh,
      lastAnalyzedAt: now.toISOString(),
    };
  }

  /**
   * Helper to format standardized DTO.
   */
  private formatDto(
    subject: { id: string; code: string; title: string },
    masteryLevel: number,
    tags: WeaknessTagsPayload,
    action: SuggestedActionPayload | null,
    isFresh: boolean,
    isDegraded = false
  ): SubjectDiagnosisDto {
    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.title,
      masteryLevel,
      weaknessIndex: tags.weaknessIndex,
      status: tags.status,
      sampleSize: tags.sampleSize,
      accuracyRate: tags.accuracyRate,
      unresolvedCount: tags.unresolvedCount,
      reviewingCount: tags.reviewingCount,
      masteredCount: tags.masteredCount,
      recentWrongCount: tags.recentWrongCount,
      dataWatermark: tags.dataWatermark,
      calculatedAt: tags.calculatedAt,
      isFresh,
      isDegraded,
      suggestedAction: action,
    };
  }

  /**
   * Helper for circuit breaker safe fallback DTO.
   */
  private createSafeFallbackDto(
    subject: { id: string; code: string; title: string },
    now: Date
  ): SubjectDiagnosisDto {
    return {
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.title,
      masteryLevel: 0.0,
      weaknessIndex: 0.0,
      status: 'INSUFFICIENT_DATA',
      sampleSize: 0,
      accuracyRate: 0.0,
      unresolvedCount: 0,
      reviewingCount: 0,
      masteredCount: 0,
      recentWrongCount: 0,
      dataWatermark: now.toISOString(),
      calculatedAt: now.toISOString(),
      isFresh: false,
      isDegraded: true,
      suggestedAction: {
        version: '1.0',
        actionType: 'EXPLORE_CHAPTER',
        targetSubjectCode: subject.code,
        targetQuestionCount: 5,
        rationaleZh: '系統分析處於防護降級狀態，建議先行自主演練。',
        objectiveZh: '維持基本練習進度。',
      },
    };
  }
}

export const weaknessDiagnosisService = new WeaknessDiagnosisService();
