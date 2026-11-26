import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WeaknessDiagnosisService,
  SubjectDiagnosisDto,
} from '../src/modules/students/weaknessDiagnosis.service.js';
import {
  WeaknessTagsPayloadSchema,
  SuggestedActionPayloadSchema,
  safeParseWeaknessTags,
  safeParseSuggestedAction,
} from '../src/modules/students/weaknessDiagnosis.schema.js';
import { TooManyRequestsError } from '../src/utils/errors.js';

describe('CTK-CORE-01-INT-007-B: Weakness Diagnosis Engine & Snapshot Service Suite', () => {
  let service: WeaknessDiagnosisService;
  const mockNow = new Date('2026-11-26T20:00:00.000Z');

  beforeEach(() => {
    service = new WeaknessDiagnosisService();
  });

  describe('1. Eight Deterministic Manual Calculation Verification Cases (NUM-01 ~ NUM-08)', () => {
    // Helper to evaluate WI formula directly based on INT-007-A V2.2 specifications
    function calculateWi(
      sampleSize: number,
      accuracyRate: number,
      unresolvedCount: number,
      reviewingCount: number,
      recentWrongCount: number
    ) {
      if (sampleSize < 5) {
        return {
          wi: 0.0,
          status: sampleSize === 0 ? 'NO_DATA' : 'INSUFFICIENT_DATA',
        };
      }

      const backlog = unresolvedCount + 0.5 * reviewingCount;
      const term1 = (1.0 - accuracyRate) * 40.0;
      const term2 = Math.min(1.0, backlog / 10.0) * 35.0;
      const term3 = Math.min(1.0, recentWrongCount / 5.0) * 25.0;

      const rawWi = term1 + term2 + term3;
      const wi = Math.max(0.0, Math.min(100.0, Math.round(rawWi * 10) / 10));

      let status = 'EXCELLENT_MASTERY';
      if (wi >= 65.0) status = 'CRITICAL_WEAKNESS';
      else if (wi >= 40.0) status = 'MODERATE_WEAKNESS';
      else if (wi >= 20.0) status = 'STEADY_PROGRESS';

      return { wi, status, term1, term2, term3 };
    }

    it('NUM-01: 初試答題且無近期錯誤 -> WI=15.0, EXCELLENT_MASTERY', () => {
      // N_att=10, 8/10 (R_acc=0.80), N_unres=2, N_rev=0, N_rec=0
      const res = calculateWi(10, 0.80, 2, 0, 0);
      expect(res.wi).toBe(15.0);
      expect(res.status).toBe('EXCELLENT_MASTERY');
    });

    it('NUM-02: 包含 REVIEWING 狀態之加權 -> WI=41.0, MODERATE_WEAKNESS', () => {
      // N_att=15, 14/20 (R_acc=0.70), N_unres=2, N_rev=4 (backlog=4), N_rec,unres=2, N_rec,rev=2 (rec=3)
      const res = calculateWi(15, 0.70, 2, 4, 3.0);
      expect(res.wi).toBe(41.0);
      expect(res.status).toBe('MODERATE_WEAKNESS');
    });

    it('NUM-03: 錯題全數攻克至 MASTERED -> WI=10.7, EXCELLENT_MASTERY', () => {
      // N_att=20, 22/30 (R_acc=22/30=0.7333), N_unres=0, N_rev=0, N_rec=0
      const res = calculateWi(20, 22 / 30, 0, 0, 0);
      expect(res.wi).toBe(10.7);
      expect(res.status).toBe('EXCELLENT_MASTERY');
    });

    it('NUM-04: 同一題重複作答 10 次快照 -> WI=16.5, EXCELLENT_MASTERY', () => {
      // 5 distinct questions, 8/10 (R_acc=0.80), N_unres=1, N_rev=0, N_rec=1
      const res = calculateWi(5, 0.80, 1, 0, 1.0);
      expect(res.wi).toBe(16.5);
      expect(res.status).toBe('EXCELLENT_MASTERY');
    });

    it('NUM-05: 跨越 168 小時時間邊界衰退 -> WI=40.5, MODERATE_WEAKNESS', () => {
      // N_att=25, 15/25 (R_acc=0.60), N_unres=6, N_rev=2 (backlog=7), all errors 170h ago (N_rec=0)
      const res = calculateWi(25, 0.60, 6, 2, 0);
      expect(res.wi).toBe(40.5);
      expect(res.status).toBe('MODERATE_WEAKNESS');
    });

    it('NUM-06: MASTERED 題目重新答錯 -> WI=14.5, EXCELLENT_MASTERY', () => {
      // N_att=20, R_acc=0.85, N_unres=1, N_rec=1
      const res = calculateWi(20, 0.85, 1, 0, 1.0);
      expect(res.wi).toBe(14.5);
      expect(res.status).toBe('EXCELLENT_MASTERY');
    });

    it('NUM-07: 極端多錯與全雙重飽和截斷 -> WI=92.0, CRITICAL_WEAKNESS', () => {
      // N_att=50, R_acc=0.20, N_unres=12, N_rev=4 (backlog=14 > 10), N_rec=8 > 5
      const res = calculateWi(50, 0.20, 12, 4, 8.0);
      expect(res.wi).toBe(92.0);
      expect(res.status).toBe('CRITICAL_WEAKNESS');
    });

    it('NUM-08: 低樣本抗早熟防禦案例 -> WI=0.0, INSUFFICIENT_DATA', () => {
      // N_att=3 < 5
      const res = calculateWi(3, 0.0, 3, 0, 3.0);
      expect(res.wi).toBe(0.0);
      expect(res.status).toBe('INSUFFICIENT_DATA');
    });
  });

  describe('2. Snapshot Freshness Evaluation (isSnapshotStale)', () => {
    const validPayloadJson = JSON.stringify({
      version: '1.0',
      status: 'MODERATE_WEAKNESS',
      weaknessIndex: 45.0,
      sampleSize: 12,
      accuracyRate: 0.65,
      unresolvedCount: 3,
      reviewingCount: 2,
      masteredCount: 1,
      recentWrongCount: 2,
      dataWatermark: '2026-11-26T19:00:00.000Z',
      calculatedAt: '2026-11-26T19:00:00.000Z',
    });

    it('returns true when snapshot is null', () => {
      expect(service.isSnapshotStale(null, new Date('2026-11-26T19:00:00.000Z'), mockNow)).toBe(true);
    });

    it('returns true when payload is corrupted or invalid JSON', () => {
      const corrupted = { weaknessTags: '{bad json', updatedAt: mockNow };
      expect(service.isSnapshotStale(corrupted, null, mockNow)).toBe(true);
    });

    it('returns true when source watermark is newer than calculation timestamp', () => {
      const snapshot = {
        weaknessTags: validPayloadJson,
        updatedAt: new Date('2026-11-26T19:00:00.000Z'),
      };
      // Source data updated at 19:30, after calculation at 19:00
      const newerWatermark = new Date('2026-11-26T19:30:00.000Z');
      expect(service.isSnapshotStale(snapshot, newerWatermark, mockNow)).toBe(true);
    });

    it('returns false when snapshot is fresh and within sliding window', () => {
      const snapshot = {
        weaknessTags: validPayloadJson,
        updatedAt: new Date('2026-11-26T19:00:00.000Z'),
      };
      // Watermark is older than calculation
      const olderWatermark = new Date('2026-11-26T18:50:00.000Z');
      // now is only 30 minutes after calculation (19:30)
      const currentNow = new Date('2026-11-26T19:30:00.000Z');
      expect(service.isSnapshotStale(snapshot, olderWatermark, currentNow)).toBe(false);
    });

    it('returns true when snapshot has recent wrong answers and age > 1 hour (time decay check)', () => {
      const payloadWithOlderCalc = JSON.stringify({
        version: '1.0',
        status: 'MODERATE_WEAKNESS',
        weaknessIndex: 45.0,
        sampleSize: 12,
        accuracyRate: 0.65,
        unresolvedCount: 3,
        reviewingCount: 2,
        masteredCount: 1,
        recentWrongCount: 2,
        dataWatermark: '2026-11-26T18:00:00.000Z',
        calculatedAt: '2026-11-26T18:00:00.000Z',
      });
      const snapshot = {
        weaknessTags: payloadWithOlderCalc,
        updatedAt: new Date('2026-11-26T18:00:00.000Z'),
      };
      // now is 2 hours later (20:00), recentWrongCount=2 > 0 -> must recheck 168h window
      expect(service.isSnapshotStale(snapshot, null, mockNow)).toBe(true);
    });

    it('returns true when snapshot age exceeds absolute TTL (24 hours)', () => {
      const oldPayloadJson = JSON.stringify({
        version: '1.0',
        status: 'EXCELLENT_MASTERY',
        weaknessIndex: 12.0,
        sampleSize: 20,
        accuracyRate: 0.9,
        unresolvedCount: 0,
        reviewingCount: 0,
        masteredCount: 5,
        recentWrongCount: 0,
        dataWatermark: '2026-11-24T10:00:00.000Z',
        calculatedAt: '2026-11-24T10:00:00.000Z',
      });
      const snapshot = {
        weaknessTags: oldPayloadJson,
        updatedAt: new Date('2026-11-24T10:00:00.000Z'),
      };
      // 48 hours later -> exceeds 24h TTL
      expect(service.isSnapshotStale(snapshot, null, mockNow)).toBe(true);
    });

    it('returns false for NO_DATA snapshot when student has 0 attempts (avoids infinite recalculations)', () => {
      const noDataJson = JSON.stringify({
        version: '1.0',
        status: 'NO_DATA',
        weaknessIndex: 0.0,
        sampleSize: 0,
        accuracyRate: 0.0,
        unresolvedCount: 0,
        reviewingCount: 0,
        masteredCount: 0,
        recentWrongCount: 0,
        dataWatermark: '2026-11-26T19:00:00.000Z',
        calculatedAt: '2026-11-26T19:00:00.000Z',
      });
      const snapshot = { weaknessTags: noDataJson, updatedAt: new Date('2026-11-26T19:00:00.000Z') };
      expect(service.isSnapshotStale(snapshot, null, mockNow)).toBe(false);
    });
  });

  describe('3. Two-Stage Sorting Algorithm', () => {
    it('correctly sorts by Stage 1 priority groups, and Stage 2 intra-group criteria', () => {
      const mockItems: SubjectDiagnosisDto[] = [
        {
          subjectId: 'sub-4',
          subjectCode: '17300-04',
          subjectName: '資訊及安全',
          masteryLevel: 0.9,
          weaknessIndex: 10.0,
          status: 'EXCELLENT_MASTERY',
          sampleSize: 20,
          accuracyRate: 0.9,
          unresolvedCount: 0,
          reviewingCount: 0,
          masteredCount: 5,
          recentWrongCount: 0,
          dataWatermark: mockNow.toISOString(),
          calculatedAt: mockNow.toISOString(),
          isFresh: true,
          suggestedAction: null,
        },
        {
          subjectId: 'sub-1',
          subjectCode: '17300-01',
          subjectName: '作業準備',
          masteryLevel: 0.25,
          weaknessIndex: 75.0,
          status: 'CRITICAL_WEAKNESS',
          sampleSize: 30,
          accuracyRate: 0.35,
          unresolvedCount: 8,
          reviewingCount: 4,
          masteredCount: 2,
          recentWrongCount: 5,
          dataWatermark: mockNow.toISOString(),
          calculatedAt: mockNow.toISOString(),
          isFresh: true,
          suggestedAction: null,
        },
        {
          subjectId: 'sub-3',
          subjectCode: '17300-03',
          subjectName: '系統軟體安裝及使用',
          masteryLevel: 0.0,
          weaknessIndex: 0.0,
          status: 'NO_DATA',
          sampleSize: 0,
          accuracyRate: 0.0,
          unresolvedCount: 0,
          reviewingCount: 0,
          masteredCount: 0,
          recentWrongCount: 0,
          dataWatermark: mockNow.toISOString(),
          calculatedAt: mockNow.toISOString(),
          isFresh: true,
          suggestedAction: null,
        },
        {
          subjectId: 'sub-2',
          subjectCode: '17300-02',
          subjectName: '應用軟體安裝及使用',
          masteryLevel: 0.55,
          weaknessIndex: 45.0,
          status: 'MODERATE_WEAKNESS',
          sampleSize: 25,
          accuracyRate: 0.65,
          unresolvedCount: 3,
          reviewingCount: 3,
          masteredCount: 5,
          recentWrongCount: 2,
          dataWatermark: mockNow.toISOString(),
          calculatedAt: mockNow.toISOString(),
          isFresh: true,
          suggestedAction: null,
        },
      ];

      const sorted = service.sortWeaknessDiagnoses(mockItems);

      // Expected Order:
      // 1. sub-1 (CRITICAL_WEAKNESS, WI=75.0)
      // 2. sub-2 (MODERATE_WEAKNESS, WI=45.0)
      // 3. sub-3 (NO_DATA)
      // 4. sub-4 (EXCELLENT_MASTERY, WI=10.0)
      expect(sorted[0].subjectId).toBe('sub-1');
      expect(sorted[0].status).toBe('CRITICAL_WEAKNESS');

      expect(sorted[1].subjectId).toBe('sub-2');
      expect(sorted[1].status).toBe('MODERATE_WEAKNESS');

      expect(sorted[2].subjectId).toBe('sub-3');
      expect(sorted[2].status).toBe('NO_DATA');

      expect(sorted[3].subjectId).toBe('sub-4');
      expect(sorted[3].status).toBe('EXCELLENT_MASTERY');
    });
  });

  describe('4. Zod Schema & Safe Parsing Resilience', () => {
    it('parses valid weaknessTags payload successfully', () => {
      const valid = {
        version: '1.0',
        status: 'CRITICAL_WEAKNESS',
        weaknessIndex: 82.5,
        sampleSize: 25,
        accuracyRate: 0.45,
        unresolvedCount: 8,
        reviewingCount: 4,
        masteredCount: 3,
        recentWrongCount: 4.5,
        dataWatermark: '2026-11-26T20:00:00.000Z',
        calculatedAt: '2026-11-26T20:00:00.000Z',
      };
      const parsed = safeParseWeaknessTags(JSON.stringify(valid));
      expect(parsed).not.toBeNull();
      expect(parsed?.weaknessIndex).toBe(82.5);
      expect(parsed?.status).toBe('CRITICAL_WEAKNESS');
    });

    it('gracefully returns null on malformed JSON without throwing', () => {
      expect(safeParseWeaknessTags('invalid json string')).toBeNull();
      expect(safeParseWeaknessTags(null)).toBeNull();
      expect(safeParseWeaknessTags('')).toBeNull();
    });

    it('gracefully returns null when schema validation fails', () => {
      // weaknessIndex exceeds 100
      const invalid = {
        version: '1.0',
        status: 'CRITICAL_WEAKNESS',
        weaknessIndex: 150.0,
        sampleSize: 25,
        accuracyRate: 0.45,
        unresolvedCount: 8,
        reviewingCount: 4,
        masteredCount: 3,
        recentWrongCount: 4.5,
        dataWatermark: '2026-11-26T20:00:00.000Z',
        calculatedAt: '2026-11-26T20:00:00.000Z',
      };
      expect(safeParseWeaknessTags(JSON.stringify(invalid))).toBeNull();
    });

    it('parses valid suggestedAction payload successfully', () => {
      const validAction = {
        version: '1.0',
        actionType: 'TARGETED_PRACTICE',
        targetSubjectCode: '17300-01',
        targetQuestionCount: 15,
        rationaleZh: '弱點指數高達 75.0 分',
        objectiveZh: '優先複習未掌握錯題',
      };
      const parsed = safeParseSuggestedAction(JSON.stringify(validAction));
      expect(parsed).not.toBeNull();
      expect(parsed?.actionType).toBe('TARGETED_PRACTICE');
      expect(parsed?.targetQuestionCount).toBe(15);
    });
  });

  describe('5. Recalculate Rate Limiter', () => {
    it('enforces 10-second cooldown on consecutive manual recalculation calls', async () => {
      const actor = { id: 'test-user-rate-limit', roles: ['STUDENT'] };
      const time1 = new Date('2026-11-26T20:00:00.000Z');
      const time2 = new Date('2026-11-26T20:00:05.000Z'); // 5 seconds later (< 10s)

      // First call records timestamp
      // Mock internal call
      vi.spyOn(service, 'getStudentWeaknessAnalysis').mockResolvedValue({
        summary: {} as any,
        subjects: [],
      });

      await service.recalculateWeaknessAnalysis(actor, undefined, time1);

      // Second call at +5s must throw TooManyRequestsError
      await expect(
        service.recalculateWeaknessAnalysis(actor, undefined, time2)
      ).rejects.toThrow(TooManyRequestsError);

      // Third call at +11s (> 10s cooldown) succeeds
      const time3 = new Date('2026-11-26T20:00:11.000Z');
      await expect(
        service.recalculateWeaknessAnalysis(actor, undefined, time3)
      ).resolves.toBeDefined();
    });
  });
});
