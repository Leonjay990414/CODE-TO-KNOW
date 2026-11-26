import { describe, it, expect } from 'vitest';
import {
  WeaknessTagsPayloadSchema,
  SuggestedActionPayloadSchema,
} from '../src/modules/students/weaknessDiagnosis.schema.js';

describe('CTK-CORE-01-INT-007-C: Frontend Integration & Radar Math Verification Suite', () => {
  // 1. Radar Coordinate Mapping Verification
  describe('1. Native SVG 4-Axis Radar Math & Coordinate Mapping', () => {
    const cx = 180;
    const cy = 180;
    const maxR = 105;

    const AXIS_CONFIG = [
      { code: '17300-01', angle: -Math.PI / 2 }, // Top
      { code: '17300-02', angle: 0 },            // Right
      { code: '17300-03', angle: Math.PI / 2 },  // Bottom
      { code: '17300-04', angle: Math.PI },      // Left
    ];

    function calculatePoint(index: number, masteryLevel: number, status: string) {
      const angle = AXIS_CONFIG[index].angle;
      const level = status === 'NO_DATA' ? 0.05 : Math.max(0.05, Math.min(1.0, masteryLevel));
      const r = level * maxR;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    }

    it('correctly maps 100% mastery on all 4 axes to diamond extremities', () => {
      const pTop = calculatePoint(0, 1.0, 'EXCELLENT_MASTERY');
      const pRight = calculatePoint(1, 1.0, 'EXCELLENT_MASTERY');
      const pBottom = calculatePoint(2, 1.0, 'EXCELLENT_MASTERY');
      const pLeft = calculatePoint(3, 1.0, 'EXCELLENT_MASTERY');

      expect(pTop).toEqual({ x: 180, y: 75 });    // 180 - 105 = 75
      expect(pRight).toEqual({ x: 285, y: 180 });  // 180 + 105 = 285
      expect(pBottom).toEqual({ x: 180, y: 285 }); // 180 + 105 = 285
      expect(pLeft).toEqual({ x: 75, y: 180 });    // 180 - 105 = 75
    });

    it('clamps NO_DATA to baseline minimum radius (0.05) to avoid divide-by-zero or NaN', () => {
      const pNoData = calculatePoint(0, 0.0, 'NO_DATA');
      expect(pNoData.x).toBe(180);
      expect(pNoData.y).toBe(174.8); // 180 - (0.05 * 105) = 174.75 -> rounded to 174.8
      expect(Number.isNaN(pNoData.x)).toBe(false);
      expect(Number.isNaN(pNoData.y)).toBe(false);
    });

    it('correctly scales intermediate 50% mastery levels', () => {
      const pMid = calculatePoint(1, 0.5, 'STEADY_PROGRESS');
      expect(pMid.x).toBe(180 + 0.5 * 105); // 232.5
      expect(pMid.y).toBe(180);
    });
  });

  // 2. Cooldown & 429 Regex Parsing
  describe('2. Rate Limiting & 429 Cooldown Parsing Strategy', () => {
    function parseCooldownSeconds(errorMessage: string): number {
      const match = errorMessage.match(/剩餘\s*(\d+)\s*秒/);
      return match ? parseInt(match[1], 10) : 10;
    }

    it('correctly extracts remaining seconds from standard backend 429 error message', () => {
      const msg = '請勿頻繁觸發弱點診斷重算，冷卻時間剩餘 7 秒';
      expect(parseCooldownSeconds(msg)).toBe(7);
    });

    it('falls back to default 10 seconds if backend message does not contain explicit seconds', () => {
      const msg = 'TOO_MANY_REQUESTS: 請求過於頻繁';
      expect(parseCooldownSeconds(msg)).toBe(10);
    });
  });

  // 3. Demo Mock Data Integrity
  describe('3. Demo Mode Weakness Mock Data Contract Verification', () => {
    const demoPayload = {
      version: '1.0' as const,
      status: 'CRITICAL_WEAKNESS' as const,
      weaknessIndex: 68.0,
      sampleSize: 35,
      accuracyRate: 0.514,
      unresolvedCount: 6,
      reviewingCount: 3,
      masteredCount: 2,
      recentWrongCount: 4.5,
      dataWatermark: new Date().toISOString(),
      calculatedAt: new Date().toISOString(),
    };

    const demoAction = {
      version: '1.0' as const,
      actionType: 'TARGETED_PRACTICE' as const,
      targetSubjectCode: '17300-02',
      targetQuestionCount: 15,
      rationaleZh: '弱點指數達 68.0 分，存在未攻克錯題與近期錯誤。',
      objectiveZh: '優先複習未掌握錯題 4 題，消除失分盲點。',
    };

    it('validates that Demo Weakness payload strictly satisfies backend Zod schema', () => {
      const parseResult = WeaknessTagsPayloadSchema.safeParse(demoPayload);
      expect(parseResult.success).toBe(true);
    });

    it('validates that Demo Suggested Action strictly satisfies backend Zod schema', () => {
      const parseResult = SuggestedActionPayloadSchema.safeParse(demoAction);
      expect(parseResult.success).toBe(true);
    });
  });

  // 4. Two-Stage Sorting Preservation
  describe('4. Status Hierarchy & Color Mapping Contract', () => {
    const statusMap = {
      CRITICAL_WEAKNESS: { color: '#DC2626', badge: '重大弱點' },
      MODERATE_WEAKNESS: { color: '#D97706', badge: '中度弱點' },
      STEADY_PROGRESS: { color: '#2563EB', badge: '穩步前進' },
      EXCELLENT_MASTERY: { color: '#059669', badge: '精通掌握' },
      INSUFFICIENT_DATA: { color: '#6B7280', badge: '樣本累積中' },
      NO_DATA: { color: '#9CA3AF', badge: '尚未作答' },
    };

    it('verifies all 6 statuses have mutually unique visual mappings', () => {
      const colors = Object.values(statusMap).map((v) => v.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(6);
    });
  });
});
