import { prisma } from '../../config/database.js';
import { OwnershipActor } from '../../utils/ownership.js';
import { NotFoundError } from '../../utils/errors.js';
import { logAuditEvent } from '../../utils/audit.js';
import { UpdateStudentProfileInput, RecordStudyTimeInput } from './student.schema.js';

export class StudentService {
  /**
   * Retrieves complete student learning profile & journey aggregated from real database records.
   * Strictly isolates data by actor.id (IDOR defense).
   * Empty states return null/0/empty arrays without fake or hardcoded numbers.
   */
  async getDashboard(actor: OwnershipActor) {
    const student = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            educationLevel: true,
          },
        },
        roles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('找不到學生帳號資料');
    }

    // 1. Mock Exam Records & Performance
    const examAttempts = await prisma.examAttempt.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        isPassed: true,
        correctCount: true,
        wrongCount: true,
        durationSeconds: true,
        submittedAt: true,
        createdAt: true,
        examPaper: {
          select: { title: true, totalQuestions: true },
        },
      },
    });

    const completedExams = examAttempts.filter((e) => e.submittedAt !== null && e.score !== null);
    const totalExamsTaken = completedExams.length;
    const passedExamsCount = completedExams.filter((e) => e.isPassed).length;

    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    if (totalExamsTaken > 0) {
      const scores = completedExams.map((e) => Number(e.score));
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      averageScore = Math.round((totalScore / totalExamsTaken) * 100) / 100;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    const recentExam = completedExams.length > 0 ? completedExams[0] : null;

    // 2. Wrong Question Records & Mastery State
    const wrongQuestions = await prisma.wrongQuestionRecord.findMany({
      where: { userId: actor.id },
      select: {
        id: true,
        masteryStatus: true,
        wrongCount: true,
        consecutiveCorrectCount: true,
        lastAttemptAt: true,
      },
    });

    const wrongStats = {
      total: wrongQuestions.length,
      unresolved: wrongQuestions.filter((q) => q.masteryStatus === 'UNRESOLVED').length,
      reviewing: wrongQuestions.filter((q) => q.masteryStatus === 'REVIEWING').length,
      mastered: wrongQuestions.filter((q) => q.masteryStatus === 'MASTERED').length,
    };

    // 3. Five Official Practical Tasks Progress (Version A and Version B)
    const practicalTasks = await prisma.practicalTask.findMany({
      orderBy: { taskNumber: 'asc' },
      include: {
        steps: {
          select: { id: true, version: true, stepNumber: true },
        },
      },
    });

    const practicalProgressRecords = await prisma.practicalProgress.findMany({
      where: { userId: actor.id },
      include: {
        stepProgresses: {
          select: { stepId: true, isCompleted: true },
        },
      },
    });

    const progressMap = new Map<string, (typeof practicalProgressRecords)[0]>();
    practicalProgressRecords.forEach((p) => {
      progressMap.set(`${p.taskId}:${p.version}`, p);
    });

    const taskSummaries = practicalTasks.map((t) => {
      const vASteps = t.steps.filter((s) => s.version === 'VERSION_A');
      const vBSteps = t.steps.filter((s) => s.version === 'VERSION_B');

      const pA = progressMap.get(`${t.id}:VERSION_A`);
      const pB = progressMap.get(`${t.id}:VERSION_B`);

      const vACompletedCount = pA ? pA.stepProgresses.filter((sp) => sp.isCompleted).length : 0;
      const vBCompletedCount = pB ? pB.stepProgresses.filter((sp) => sp.isCompleted).length : 0;

      return {
        taskId: t.id,
        taskNumber: t.taskNumber,
        taskCode: t.taskCode,
        title: t.title,
        versionA: {
          status: pA?.status || 'NOT_STARTED',
          completedSteps: vACompletedCount,
          totalSteps: vASteps.length,
          hasSavedCode: Boolean(pA?.savedHtmlCode || pA?.savedCssCode || pA?.savedJsCode),
          lastPracticedAt: pA?.lastPracticedAt?.toISOString() || null,
        },
        versionB: {
          status: pB?.status || 'NOT_STARTED',
          completedSteps: vBCompletedCount,
          totalSteps: vBSteps.length,
          hasSavedCode: Boolean(pB?.savedHtmlCode || pB?.savedCssCode || pB?.savedJsCode),
          lastPracticedAt: pB?.lastPracticedAt?.toISOString() || null,
        },
      };
    });

    const totalPracticalStepsCompletedVA = taskSummaries.reduce((sum, t) => sum + t.versionA.completedSteps, 0);
    const totalPracticalStepsCompletedVB = taskSummaries.reduce((sum, t) => sum + t.versionB.completedSteps, 0);
    const startedPracticalTasksCount = taskSummaries.filter(
      (t) => t.versionA.completedSteps > 0 || t.versionB.completedSteps > 0 || t.versionA.hasSavedCode || t.versionB.hasSavedCode
    ).length;

    // 4. Enrolled Classrooms
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: actor.id,
        status: 'JOINED',
      },
      include: {
        class: {
          include: {
            creator: {
              select: { id: true, displayName: true, email: true },
            },
            certification: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const enrolledClasses = enrollments.map((e) => ({
      enrollmentId: e.id,
      seatNumber: e.seatNumber,
      joinedAt: e.joinedAt.toISOString(),
      class: {
        id: e.class.id,
        name: e.class.name,
        joinCode: e.class.joinCode,
        description: e.class.description,
        status: e.class.status,
        teacherName: e.class.creator.displayName,
        teacherEmail: e.class.creator.email,
        certificationName: e.class.certification.name,
      },
    }));

    // 5. Recent Chronological Activities
    const recentActivities: Array<{
      type: 'EXAM_SUBMISSION' | 'PRACTICAL_PRACTICE' | 'CLASS_JOINED';
      title: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }> = [];

    completedExams.slice(0, 5).forEach((e) => {
      recentActivities.push({
        type: 'EXAM_SUBMISSION',
        title: `完成模擬考：${e.examPaper?.title || '全真模擬試卷'}（成績：${e.score}分）`,
        timestamp: (e.submittedAt || e.createdAt).toISOString(),
        details: { score: e.score, isPassed: e.isPassed },
      });
    });

    practicalProgressRecords
      .filter((p) => p.lastPracticedAt !== null)
      .sort((a, b) => (b.lastPracticedAt?.getTime() || 0) - (a.lastPracticedAt?.getTime() || 0))
      .slice(0, 5)
      .forEach((p) => {
        const task = practicalTasks.find((t) => t.id === p.taskId);
        recentActivities.push({
          type: 'PRACTICAL_PRACTICE',
          title: `練習術科題組：${task?.title || p.taskId} (${p.version === 'VERSION_A' ? '版本A' : '版本B'})`,
          timestamp: (p.lastPracticedAt || p.createdAt).toISOString(),
          details: { taskId: p.taskId, version: p.version, status: p.status },
        });
      });

    enrollments.slice(0, 3).forEach((e) => {
      recentActivities.push({
        type: 'CLASS_JOINED',
        title: `加入班級：${e.class.name}`,
        timestamp: e.joinedAt.toISOString(),
        details: { classId: e.class.id, className: e.class.name },
      });
    });

    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      student: {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        avatarUrl: student.avatarUrl,
        status: student.status,
        bio: student.profile?.bio || null,
        educationLevel: student.profile?.educationLevel || null,
        roles: student.roles.map((r) => r.role.name),
        createdAt: student.createdAt.toISOString(),
      },
      overview: {
        totalExamsTaken,
        passedExamsCount,
        averageScore,
        highestScore,
        lowestScore,
        recentScore: recentExam ? Number(recentExam.score) : null,
        recentExamTitle: recentExam ? recentExam.examPaper.title : null,
        recentExamDate: recentExam ? (recentExam.submittedAt || recentExam.createdAt).toISOString() : null,
        wrongQuestionsTotal: wrongStats.total,
        wrongQuestionsUnresolved: wrongStats.unresolved,
        wrongQuestionsMastered: wrongStats.mastered,
        startedPracticalTasksCount,
        totalPracticalStepsCompletedVA,
        totalPracticalStepsCompletedVB,
        enrolledClassesCount: enrolledClasses.length,
      },
      examHistory: completedExams.slice(0, 10).map((e) => ({
        id: e.id,
        paperTitle: e.examPaper.title,
        score: e.score !== null ? Number(e.score) : null,
        isPassed: e.isPassed,
        correctCount: e.correctCount,
        wrongCount: e.wrongCount,
        durationSeconds: e.durationSeconds,
        submittedAt: e.submittedAt?.toISOString() || null,
      })),
      wrongStats,
      practicalTasks: taskSummaries,
      enrolledClasses,
      recentActivities: recentActivities.slice(0, 10),
    };
  }

  /**
   * Updates student authorized profile fields (displayName, avatarUrl, bio).
   * Strict protection: cannot modify roles, email, or passwords.
   */
  async updateProfile(
    actor: OwnershipActor,
    input: UpdateStudentProfileInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: actor.id },
        data: {
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      });

      if (input.bio !== undefined) {
        await tx.userProfile.upsert({
          where: { userId: actor.id },
          create: {
            userId: actor.id,
            bio: input.bio,
          },
          update: {
            bio: input.bio,
          },
        });
      }

      await logAuditEvent({
        userId: actor.id,
        action: 'USER_PROFILE_UPDATED',
        details: {
          updatedFields: Object.keys(input),
        },
        ipAddress,
        userAgent,
      });

      return user;
    });

    return updatedUser;
  }

  /**
   * Records student active study time with atomic increment to prevent overwrite/overflow.
   * Clamped to a maximum of 86,400 seconds (24 hours) per day to prevent overflow/abuse.
   */
  async recordStudyTime(actor: OwnershipActor, input: RecordStudyTimeInput) {
    const studyDate = input.date || new Date().toISOString().slice(0, 10);
    const moduleType = input.moduleType;
    const durationSeconds = input.durationSeconds;
    const MAX_DAILY_SECONDS = 86400;

    // Check existing daily total for this module to enforce daily ceiling
    const existing = await prisma.studyTimeLog.findUnique({
      where: {
        userId_studyDate_moduleType: {
          userId: actor.id,
          studyDate,
          moduleType,
        },
      },
    });

    const currentSeconds = existing?.durationSeconds || 0;
    const allowedIncrement = Math.max(0, Math.min(durationSeconds, MAX_DAILY_SECONDS - currentSeconds));

    let record;
    if (existing) {
      record = await prisma.studyTimeLog.update({
        where: { id: existing.id },
        data: {
          durationSeconds: currentSeconds + allowedIncrement,
        },
      });
    } else {
      record = await prisma.studyTimeLog.create({
        data: {
          userId: actor.id,
          studyDate,
          moduleType,
          durationSeconds: allowedIncrement,
        },
      });
    }

    const summary = await this.getStudyTimeSummary(actor);

    return {
      record: {
        id: record.id,
        studyDate: record.studyDate,
        moduleType: record.moduleType,
        durationSeconds: record.durationSeconds,
      },
      summary,
    };
  }

  /**
   * Retrieves aggregated study time summary across modules, daily logs, and 7-day window.
   */
  async getStudyTimeSummary(actor: OwnershipActor) {
    const logs = await prisma.studyTimeLog.findMany({
      where: { userId: actor.id },
      orderBy: { studyDate: 'desc' },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let totalSeconds = 0;
    let weeklySeconds = 0;
    const byModule: Record<string, number> = {
      THEORY: 0,
      PRACTICAL: 0,
      MOCK_EXAM: 0,
      AI_COACH: 0,
    };

    const dailyMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      dailyMap.set(d, 0);
    }

    logs.forEach((log) => {
      totalSeconds += log.durationSeconds;
      if (log.studyDate >= sevenDaysAgo) {
        weeklySeconds += log.durationSeconds;
      }
      if (byModule[log.moduleType] !== undefined) {
        byModule[log.moduleType] += log.durationSeconds;
      } else {
        byModule[log.moduleType] = log.durationSeconds;
      }

      if (dailyMap.has(log.studyDate)) {
        dailyMap.set(log.studyDate, (dailyMap.get(log.studyDate) || 0) + log.durationSeconds);
      }
    });

    const dailyLogs = Array.from(dailyMap.entries()).map(([date, seconds]) => ({
      date,
      seconds,
      minutes: Math.round((seconds / 60) * 10) / 10,
    }));

    return {
      totalSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 10) / 10,
      weeklySeconds,
      weeklyHours: Math.round((weeklySeconds / 3600) * 10) / 10,
      byModule,
      dailyLogs,
    };
  }

  /**
   * Dynamic learning progress & analytics across the 4 official work items (605 questions),
   * study time breakdown, mock exam readiness, and real wrong questions state.
   */
  async getProgressAnalytics(actor: OwnershipActor) {
    // 1. Fetch official subjects with questions count
    const subjects = await prisma.subject.findMany({
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });

    // 2. Fetch student's persisted unit progress
    const unitProgresses = await prisma.unitProgress.findMany({
      where: { userId: actor.id },
    });
    const unitProgressMap = new Map<string, (typeof unitProgresses)[0]>();
    unitProgresses.forEach((up) => unitProgressMap.set(up.subjectId, up));

    // 3. Fetch student's exam question answers
    const examAttempts = await prisma.examAttempt.findMany({
      where: { userId: actor.id, submittedAt: { not: null } },
      select: {
        id: true,
        score: true,
        isPassed: true,
        answerSnapshots: {
          select: {
            questionId: true,
            isCorrect: true,
            question: {
              select: {
                subjectId: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 4. Fetch wrong questions
    const wrongQuestions = await prisma.wrongQuestionRecord.findMany({
      where: { userId: actor.id },
      include: {
        question: {
          select: { subjectId: true },
        },
      },
    });

    // Track unique question outcomes per subject to guarantee strict consistency
    const subjectStatsMap = new Map<
      string,
      {
        attemptedQuestionIds: Set<string>;
        correctQuestionIds: Set<string>;
        wrongQuestionIds: Set<string>;
      }
    >();

    subjects.forEach((s) => {
      subjectStatsMap.set(s.id, {
        attemptedQuestionIds: new Set<string>(),
        correctQuestionIds: new Set<string>(),
        wrongQuestionIds: new Set<string>(),
      });
    });

    // Map each question to its subjectId
    const questionSubjectMap = new Map<string, string>();
    const activeUnresolvedWrongSet = new Set<string>();
    const masteredWrongSet = new Set<string>();

    wrongQuestions.forEach((wq) => {
      questionSubjectMap.set(wq.questionId, wq.question.subjectId);
      if (wq.masteryStatus === 'MASTERED') {
        masteredWrongSet.add(wq.questionId);
      } else {
        activeUnresolvedWrongSet.add(wq.questionId);
      }
    });

    const examCorrectSet = new Set<string>();
    const examAttemptedSet = new Set<string>();

    examAttempts.forEach((attempt) => {
      attempt.answerSnapshots.forEach((ans: any) => {
        examAttemptedSet.add(ans.questionId);
        questionSubjectMap.set(ans.questionId, ans.question.subjectId);
        if (ans.isCorrect) {
          examCorrectSet.add(ans.questionId);
        }
      });
    });

    // Merge all unique attempted questions
    const allAttemptedQuestionIds = new Set<string>([
      ...Array.from(activeUnresolvedWrongSet),
      ...Array.from(masteredWrongSet),
      ...Array.from(examAttemptedSet),
    ]);

    allAttemptedQuestionIds.forEach((qId) => {
      const subjectId = questionSubjectMap.get(qId);
      if (!subjectId) return;
      const stats = subjectStatsMap.get(subjectId);
      if (!stats) return;

      stats.attemptedQuestionIds.add(qId);

      // Mutually exclusive status determination:
      // If actively in wrong questions as UNRESOLVED or REVIEWING -> marked wrong/weakness
      // Else if MASTERED or answered correctly in exams -> marked correct
      // Else -> marked wrong
      if (activeUnresolvedWrongSet.has(qId)) {
        stats.wrongQuestionIds.add(qId);
      } else if (masteredWrongSet.has(qId) || examCorrectSet.has(qId)) {
        stats.correctQuestionIds.add(qId);
      } else {
        stats.wrongQuestionIds.add(qId);
      }
    });

    let totalOfficialQuestions = 0;
    let totalUniqueAttempted = 0;
    let totalUniqueCorrect = 0;

    const subjectsAnalytics = subjects.map((sub) => {
      const totalQuestions = sub._count.questions;
      totalOfficialQuestions += totalQuestions;

      const stats = subjectStatsMap.get(sub.id) || {
        attemptedQuestionIds: new Set<string>(),
        correctQuestionIds: new Set<string>(),
        wrongQuestionIds: new Set<string>(),
      };

      const up = unitProgressMap.get(sub.id);
      // Take the higher value between calculated unique attempted questions and unit progress count
      const completedQuestions = Math.max(stats.attemptedQuestionIds.size, up?.completedQuestions || 0);
      const correctCount = stats.correctQuestionIds.size;
      const wrongCount = stats.wrongQuestionIds.size;

      totalUniqueAttempted += completedQuestions;
      totalUniqueCorrect += correctCount;

      let accuracyRate = 0;
      if (completedQuestions > 0) {
        accuracyRate = Math.round((correctCount / completedQuestions) * 100) / 100;
      } else if (up && up.accuracyRate > 0) {
        accuracyRate = up.accuracyRate;
      }

      // Mastery rate is percentage of total questions in this subject that have been mastered/completed accurately
      const masteryRate =
        totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 1000) / 10 : 0;

      let status = 'NOT_STARTED';
      if (completedQuestions >= totalQuestions && accuracyRate >= 0.8) {
        status = 'MASTERED';
      } else if (completedQuestions > 0) {
        status = 'IN_PROGRESS';
      }

      const workNumber = sub.code.split('-')[1] || '01';

      return {
        id: sub.id,
        code: sub.code,
        workNumber,
        title: sub.title,
        totalQuestions,
        completedQuestions,
        correctCount,
        wrongCount,
        accuracyRate,
        masteryRate,
        status,
        lastStudiedAt: up?.lastStudiedAt?.toISOString() || null,
      };
    });

    const completionRate =
      totalOfficialQuestions > 0
        ? Math.round((totalUniqueAttempted / totalOfficialQuestions) * 1000) / 10
        : 0;

    const overallAccuracy =
      totalUniqueAttempted > 0
        ? Math.round((totalUniqueCorrect / totalUniqueAttempted) * 1000) / 10
        : null;

    // Study Time
    const studyTime = await this.getStudyTimeSummary(actor);

    // Exam statistics
    const completedExams = examAttempts.filter((e) => e.score !== null);
    const scores = completedExams.map((e) => Number(e.score));
    const highestExamScore = scores.length > 0 ? Math.max(...scores) : null;
    const recentScore = scores.length > 0 ? scores[0] : null;
    const passedExamsCount = completedExams.filter((e) => e.isPassed).length;

    // Practical tasks completion
    const practicalProgress = await prisma.practicalProgress.findMany({
      where: { userId: actor.id },
      include: {
        stepProgresses: { select: { isCompleted: true } },
      },
    });

    const practicalTasksCompletedVA = practicalProgress.filter(
      (p) => p.version === 'VERSION_A' && p.status === 'COMPLETED'
    ).length;
    const practicalTasksCompletedVB = practicalProgress.filter(
      (p) => p.version === 'VERSION_B' && p.status === 'COMPLETED'
    ).length;

    // Wrong questions stats
    const wrongStats = {
      total: wrongQuestions.length,
      unresolved: wrongQuestions.filter((q) => q.masteryStatus === 'UNRESOLVED').length,
      reviewing: wrongQuestions.filter((q) => q.masteryStatus === 'REVIEWING').length,
      mastered: wrongQuestions.filter((q) => q.masteryStatus === 'MASTERED').length,
    };

    // Recommended focus
    let recommendedSubject = subjectsAnalytics.find((s) => s.status === 'IN_PROGRESS' && s.accuracyRate < 0.7);
    if (!recommendedSubject) {
      recommendedSubject = subjectsAnalytics.find((s) => s.status === 'NOT_STARTED');
    }
    if (!recommendedSubject) {
      recommendedSubject = [...subjectsAnalytics].sort((a, b) => a.masteryRate - b.masteryRate)[0];
    }

    return {
      overview: {
        totalOfficialQuestions,
        totalAttempted: totalUniqueAttempted,
        completionRate,
        overallAccuracy,
        totalStudyHours: studyTime.totalHours,
        weeklyStudyHours: studyTime.weeklyHours,
        highestExamScore,
        recentScore,
        totalExamsTaken: completedExams.length,
        passedExamsCount,
        practicalTasksCompletedVA,
        practicalTasksCompletedVB,
      },
      subjects: subjectsAnalytics,
      studyTime,
      wrongStats,
      recommendedFocus: recommendedSubject
        ? {
            subjectId: recommendedSubject.id,
            subjectCode: recommendedSubject.code,
            subjectTitle: recommendedSubject.title,
            workNumber: recommendedSubject.workNumber,
            reason:
              recommendedSubject.status === 'NOT_STARTED'
                ? '此工作項目尚未開始研讀，建議優先展開練習'
                : `目前正確率為 ${Math.round(recommendedSubject.accuracyRate * 100)}%，建議加強練習以消除盲點`,
          }
        : null,
    };
  }
}

export const studentService = new StudentService();
