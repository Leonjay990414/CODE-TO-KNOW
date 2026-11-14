/**
 * Phase 14 Batch 2: CSS Designer Game & Educational Validation Test Suite
 * UIDs: P14-GAM-001, P14-GAM-002, P14-GAM-003, P14-GAM-005, P14-GAM-009, P14-GAM-010, P14-GAM-012
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CSS_DESIGNER_LEVELS,
  CSSDesignerLevel,
  validateCSSDesignerLevel,
} from '../src/data/cssDesignerData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  resetGameProgress,
  getOverallGameStats,
} from '../src/utils/gameStorage';
import { parseHash } from '../src/context/NavigationContext';
import { CODE_PUZZLE_LEVELS } from '../src/data/codePuzzleData';

// Polyfill in-memory localStorage for Node test runner
const memoryStorage: Record<string, string> = {};

if (typeof window === 'undefined' || !window.localStorage) {
  const localStorageMock = {
    getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
    setItem: (key: string, value: string) => {
      memoryStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
  // @ts-ignore
  global.window = { localStorage: localStorageMock };
  // @ts-ignore
  global.localStorage = localStorageMock;
}

describe('Phase 14 Batch 2: CSS Designer Game & System Integration Test Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('1. CSS Designer Level Definitions & Educational Depth (P14-GAM-005, P14-GAM-009)', () => {
    it('contains at least 4 progressive design levels', () => {
      expect(CSS_DESIGNER_LEVELS.length).toBeGreaterThanOrEqual(4);
    });

    it('verifies all levels have valid controls, targets, 3 tiers of hints, and explanations', () => {
      CSS_DESIGNER_LEVELS.forEach((level: CSSDesignerLevel) => {
        expect(level.levelId).toBeGreaterThan(0);
        expect(level.title.length).toBeGreaterThan(0);
        expect(level.instructions.length).toBeGreaterThan(10);
        expect(level.targetDescription.length).toBeGreaterThan(10);
        expect(level.controls.length).toBeGreaterThanOrEqual(3);
        expect(level.hints.length).toBeGreaterThanOrEqual(3);
        expect(level.explanation.overview.length).toBeGreaterThan(20);
        expect(level.explanation.propertiesUsed.length).toBeGreaterThanOrEqual(2);
        expect(level.explanation.alternatives.length).toBeGreaterThan(5);
        expect(level.explanation.commonMistakes.length).toBeGreaterThan(5);

        // Control properties should be unique per level
        const propSet = new Set(level.controls.map((c) => c.property));
        expect(propSet.size).toBe(level.controls.length);
      });
    });
  });

  describe('2. Semantic CSS Validation Engine & Equivalence (P14-GAM-005)', () => {
    describe('Level 1: Color, Background & Border Radius', () => {
      it('accepts exact target values', () => {
        const result = validateCSSDesignerLevel(1, {
          color: '#FFFFFF',
          backgroundColor: '#2563EB',
          borderRadius: 8,
        });
        expect(result.isCorrect).toBe(true);
      });

      it('accepts semantically equivalent color and near-target radius (tolerance 6-10px)', () => {
        const result1 = validateCSSDesignerLevel(1, {
          color: 'white',
          backgroundColor: '#2563eb',
          borderRadius: 7,
        });
        expect(result1.isCorrect).toBe(true);

        const result2 = validateCSSDesignerLevel(1, {
          color: 'RGB(255, 255, 255)',
          backgroundColor: '#2563EB',
          borderRadius: 10,
        });
        expect(result2.isCorrect).toBe(true);
      });

      it('rejects low-contrast or incorrect values with instructive feedback', () => {
        const result = validateCSSDesignerLevel(1, {
          color: '#1E293B',
          backgroundColor: '#2563EB',
          borderRadius: 8,
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('文字顏色尚未符合高對比度目標');
      });
    });

    describe('Level 2: Box Model (Width, Padding, Margin, Border)', () => {
      it('accepts valid box model dimensions within reasonable tolerance', () => {
        const result = validateCSSDesignerLevel(2, {
          width: 280,
          padding: 16,
          margin: 20,
          borderWidth: 2,
          borderColor: '#BDA77E',
        });
        expect(result.isCorrect).toBe(true);
      });

      it('accepts slight variations within target margins and paddings', () => {
        const result = validateCSSDesignerLevel(2, {
          width: 270,
          padding: 15,
          margin: 18,
          borderWidth: 2,
          borderColor: '#bda77e',
        });
        expect(result.isCorrect).toBe(true);
      });

      it('rejects out-of-range width or missing gold border', () => {
        const result = validateCSSDesignerLevel(2, {
          width: 200,
          padding: 16,
          margin: 20,
          borderWidth: 2,
          borderColor: '#E2E8F0',
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('容器寬度為 200px');
      });
    });

    describe('Level 3: Flexbox Alignment & Gap', () => {
      it('accepts proper display: flex with centered axes and appropriate gap', () => {
        const result = validateCSSDesignerLevel(3, {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        });
        expect(result.isCorrect).toBe(true);
      });

      it('rejects when display is not flex', () => {
        const result = validateCSSDesignerLevel(3, {
          display: 'block',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('尚未啟用「彈性盒模型');
      });

      it('rejects when main axis is off center', () => {
        const result = validateCSSDesignerLevel(3, {
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: 16,
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('主軸尚未水平置中');
      });
    });

    describe('Level 4: Modern Product Card Layout', () => {
      it('accepts complete card styling (max-width, column, padding, radius, shadow, gap)', () => {
        const result = validateCSSDesignerLevel(4, {
          maxWidth: 320,
          flexDirection: 'column',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
          gap: 12,
        });
        expect(result.isCorrect).toBe(true);
      });

      it('rejects horizontal row direction on card content', () => {
        const result = validateCSSDesignerLevel(4, {
          maxWidth: 320,
          flexDirection: 'row',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
          gap: 12,
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('垂直單欄堆疊');
      });

      it('rejects cards with no shadow depth', () => {
        const result = validateCSSDesignerLevel(4, {
          maxWidth: 320,
          flexDirection: 'column',
          padding: 24,
          borderRadius: 12,
          boxShadow: 'none',
          gap: 12,
        });
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toContain('輕柔浮起');
      });
    });
  });

  describe('3. Game Storage, Scoring & Anti-Inflation Rules (P14-GAM-002, P14-GAM-010, P14-GAM-012)', () => {
    it('correctly saves CSS Designer progress and calculates 1~3 stars based on hints', () => {
      const user = 'css-learner-01';
      // 0 hints -> 3 stars, 250 score
      const rec1 = saveLevelCompletion(user, 'css-designer', 1, 3, 250, 0);
      expect(rec1.levels[1].stars).toBe(3);
      expect(rec1.totalStars).toBe(3);
      expect(rec1.totalScore).toBe(250);

      // Level 2 with 1 hint -> 2 stars, 200 score
      const rec2 = saveLevelCompletion(user, 'css-designer', 2, 2, 200, 1);
      expect(rec2.levels[2].stars).toBe(2);
      expect(rec2.totalStars).toBe(5);
      expect(rec2.totalScore).toBe(450);
    });

    it('prevents infinite star accumulation on replays and preserves high score', () => {
      const user = 'css-replayer';
      saveLevelCompletion(user, 'css-designer', 1, 3, 250, 0);
      expect(getUserGameRecord(user, 'css-designer').totalStars).toBe(3);

      // Replaying same level should NOT increase total stars beyond 3
      saveLevelCompletion(user, 'css-designer', 1, 3, 250, 0);
      saveLevelCompletion(user, 'css-designer', 1, 2, 200, 1);
      const afterReplay = getUserGameRecord(user, 'css-designer');
      expect(afterReplay.totalStars).toBe(3);
      expect(afterReplay.totalScore).toBe(250);
      expect(afterReplay.levels[1].attempts).toBe(3);
    });

    it('strictly isolates CSS Designer records between different users', () => {
      saveLevelCompletion('user-css-alice', 'css-designer', 1, 3, 250);
      saveLevelCompletion('user-css-alice', 'css-designer', 2, 3, 250);

      const alice = getUserGameRecord('user-css-alice', 'css-designer');
      const bob = getUserGameRecord('user-css-bob', 'css-designer');

      expect(alice.totalStars).toBe(6);
      expect(alice.completedLevelsCount).toBe(2);
      expect(bob.totalStars).toBe(0);
      expect(bob.completedLevelsCount).toBe(0);
    });

    it('aggregates across Code Puzzle and CSS Designer in overall stats', () => {
      const user = 'dual-gamer';
      saveLevelCompletion(user, 'code-puzzle', 1, 3, 250);
      saveLevelCompletion(user, 'css-designer', 1, 3, 250);
      saveLevelCompletion(user, 'css-designer', 2, 2, 200);

      const stats = getOverallGameStats(user);
      expect(stats.totalGamesPlayed).toBe(2);
      expect(stats.totalLevelsCompleted).toBe(3);
      expect(stats.totalStars).toBe(8);
      expect(stats.totalScore).toBe(700);
    });
  });

  describe('4. Navigation Routing Integration (P14-GAM-001)', () => {
    it('parses #games/css-designer to css-designer page state', () => {
      const parsed = parseHash('#games/css-designer');
      expect(parsed.page).toBe('css-designer');
    });

    it('parses #css-designer to css-designer page state', () => {
      const parsed = parseHash('#css-designer');
      expect(parsed.page).toBe('css-designer');
    });
  });

  describe('5. Code Puzzle Batch 1 Semantic Equivalence Supplementary Verification (P14-GAM-004)', () => {
    it('verifies Code Puzzle Level 2 accepts semantically equivalent CSS property orders', () => {
      const lvl2 = CODE_PUZZLE_LEVELS.find((l) => l.levelId === 2);
      expect(lvl2).toBeDefined();
      expect(lvl2?.acceptableOrders).toBeDefined();
      expect(lvl2?.acceptableOrders?.length).toBeGreaterThan(1);

      // An alternative valid CSS declaration sequence (e.g. align before justify)
      const altOrder = ['c_selector', 'c_display', 'c_align', 'c_justify', 'c_height', 'c_close'];
      const isAccepted = lvl2?.acceptableOrders?.some(
        (alt) => alt.length === altOrder.length && alt.every((id, idx) => id === altOrder[idx])
      );
      expect(isAccepted).toBe(true);
    });

    it('verifies Code Puzzle Level 3 accepts swapped list items in semantic navbar', () => {
      const lvl3 = CODE_PUZZLE_LEVELS.find((l) => l.levelId === 3);
      expect(lvl3).toBeDefined();
      expect(lvl3?.acceptableOrders).toBeDefined();

      const swappedNavItems = [
        'n_nav_open',
        'n_ul_open',
        'n_item_2',
        'n_item_1',
        'n_ul_close',
        'n_nav_close',
      ];
      const isAccepted = lvl3?.acceptableOrders?.some(
        (alt) => alt.length === swappedNavItems.length && alt.every((id, idx) => id === swappedNavItems[idx])
      );
      expect(isAccepted).toBe(true);
    });
  });
});
