/**
 * Phase 14 Batch 3: Bug Hunter Game & Error Diagnosis Test Suite
 * UIDs: P14-GAM-001, P14-GAM-002, P14-GAM-003, P14-GAM-006, P14-GAM-009, P14-GAM-010, P14-GAM-012
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BUG_HUNTER_LEVELS,
  BugHunterLevel,
} from '../src/data/bugHunterData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  resetGameProgress,
  getOverallGameStats,
} from '../src/utils/gameStorage';
import { parseHash } from '../src/context/NavigationContext';

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

describe('Phase 14 Batch 3: Bug Hunter Game & Multi-Game Integration Test Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('1. Bug Hunter Level Definitions & Pedagogical Integrity (P14-GAM-006, P14-GAM-009)', () => {
    it('contains at least 4 progressive error-hunting levels', () => {
      expect(BUG_HUNTER_LEVELS.length).toBeGreaterThanOrEqual(4);
    });

    it('ensures all levels have valid initial code, buggy lines, 3-tier hints, and in-depth explanations', () => {
      BUG_HUNTER_LEVELS.forEach((level: BugHunterLevel) => {
        expect(level.levelId).toBeGreaterThan(0);
        expect(level.title.length).toBeGreaterThan(0);
        expect(level.initialCode.length).toBeGreaterThan(20);
        expect(level.buggyLines.length).toBeGreaterThanOrEqual(2);
        expect(level.hints.length).toBeGreaterThanOrEqual(3);
        expect(level.explanation.overview.length).toBeGreaterThan(20);
        expect(level.explanation.bugsAnalyzed.length).toBe(level.buggyLines.length);
        expect(level.explanation.examTips.length).toBeGreaterThan(10);
        expect(level.explanation.bestPractices.length).toBeGreaterThan(10);

        // Verify each buggy line has at least 1 correct option and at least 1 incorrect option
        level.buggyLines.forEach((b) => {
          expect(b.lineNum).toBeGreaterThan(0);
          expect(b.fixOptions.length).toBeGreaterThanOrEqual(2);
          const hasCorrect = b.fixOptions.some((opt) => opt.isCorrect);
          const hasIncorrect = b.fixOptions.some((opt) => !opt.isCorrect);
          expect(hasCorrect).toBe(true);
          expect(hasIncorrect).toBe(true);
        });
      });
    });

    it('verifies that buggy line numbers exist within the initialCode line count', () => {
      BUG_HUNTER_LEVELS.forEach((level) => {
        const totalLines = level.initialCode.split('\n').length;
        level.buggyLines.forEach((b) => {
          expect(b.lineNum).toBeLessThanOrEqual(totalLines);
          expect(b.lineNum).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('2. Bug Verification & Diagnostic Mechanics (P14-GAM-006)', () => {
    it('verifies Level 1: HTML structure errors (atr typo and mismatched </p>)', () => {
      const lvl1 = BUG_HUNTER_LEVELS.find((l) => l.levelId === 1);
      expect(lvl1).toBeDefined();

      const b1 = lvl1?.buggyLines.find((b) => b.lineNum === 2);
      expect(b1?.bugType).toContain('HTML 屬性');
      expect(b1?.expectedText).toContain('alt="碼上學 Logo"');

      const b2 = lvl1?.buggyLines.find((b) => b.lineNum === 5);
      expect(b2?.bugType).toContain('標籤閉合');
      expect(b2?.expectedText).toContain('</li>');
    });

    it('verifies Level 2: CSS errors (justify-content: middle and backgroud-color)', () => {
      const lvl2 = BUG_HUNTER_LEVELS.find((l) => l.levelId === 2);
      expect(lvl2).toBeDefined();

      const b1 = lvl2?.buggyLines.find((b) => b.lineNum === 3);
      expect(b1?.expectedText).toBe('  justify-content: center;');

      const b2 = lvl2?.buggyLines.find((b) => b.lineNum === 6);
      expect(b2?.expectedText).toBe('  background-color: #FFFFFF;');
    });

    it('verifies Level 3: JavaScript errors (preventdefault and score = 100)', () => {
      const lvl3 = BUG_HUNTER_LEVELS.find((l) => l.levelId === 3);
      expect(lvl3).toBeDefined();

      const b1 = lvl3?.buggyLines.find((b) => b.lineNum === 4);
      expect(b1?.expectedText).toBe('  event.preventDefault();');

      const b2 = lvl3?.buggyLines.find((b) => b.lineNum === 6);
      expect(b2?.expectedText).toBe('  if (score === 100) {');
    });

    it('verifies Level 4: Comprehensive Multi-domain errors (h2/h3, colour, innerHtml)', () => {
      const lvl4 = BUG_HUNTER_LEVELS.find((l) => l.levelId === 4);
      expect(lvl4).toBeDefined();
      expect(lvl4?.buggyLines.length).toBe(3);

      const b3 = lvl4?.buggyLines.find((b) => b.lineNum === 14);
      expect(b3?.expectedText).toContain('target.innerHTML');
    });
  });

  describe('3. Game Storage, Scoring, Star Rating & Multi-User Isolation (P14-GAM-002, P14-GAM-010, P14-GAM-012)', () => {
    it('saves bug hunter completion and correctly awards stars based on hints', () => {
      const user = 'hunter-student-alpha';
      // 0 hints -> 3 stars, 250 score
      const rec = saveLevelCompletion(user, 'bug-hunter', 1, 3, 250, 0);
      expect(rec.levels[1].stars).toBe(3);
      expect(rec.levels[1].highScore).toBe(250);
      expect(rec.totalStars).toBe(3);
      expect(rec.totalScore).toBe(250);

      // Level 2 with 2 hints -> 1 star, 150 score
      const rec2 = saveLevelCompletion(user, 'bug-hunter', 2, 1, 150, 2);
      expect(rec2.levels[2].stars).toBe(1);
      expect(rec2.totalStars).toBe(4);
      expect(rec2.totalScore).toBe(400);
      expect(rec2.completedLevelsCount).toBe(2);
    });

    it('preserves historical high scores on replays without inflating stars', () => {
      const user = 'hunter-replayer';
      saveLevelCompletion(user, 'bug-hunter', 1, 3, 250, 0);
      expect(getUserGameRecord(user, 'bug-hunter').totalStars).toBe(3);

      // Replaying with lower score should NOT overwrite higher score or increase stars
      saveLevelCompletion(user, 'bug-hunter', 1, 1, 150, 2);
      const after = getUserGameRecord(user, 'bug-hunter');
      expect(after.totalStars).toBe(3);
      expect(after.totalScore).toBe(250);
      expect(after.levels[1].attempts).toBe(2);
    });

    it('isolates bug hunter progress between different user accounts', () => {
      saveLevelCompletion('user-alice-hunter', 'bug-hunter', 1, 3, 250);
      saveLevelCompletion('user-alice-hunter', 'bug-hunter', 2, 3, 250);

      const alice = getUserGameRecord('user-alice-hunter', 'bug-hunter');
      const bob = getUserGameRecord('user-bob-hunter', 'bug-hunter');

      expect(alice.totalStars).toBe(6);
      expect(alice.completedLevelsCount).toBe(2);
      expect(bob.totalStars).toBe(0);
      expect(bob.completedLevelsCount).toBe(0);
    });

    it('aggregates across Code Puzzle, CSS Designer, and Bug Hunter in overall statistics', () => {
      const user = 'tri-game-master';
      saveLevelCompletion(user, 'code-puzzle', 1, 3, 250);
      saveLevelCompletion(user, 'css-designer', 1, 3, 250);
      saveLevelCompletion(user, 'bug-hunter', 1, 3, 250);

      const stats = getOverallGameStats(user);
      expect(stats.totalGamesPlayed).toBe(3);
      expect(stats.totalLevelsCompleted).toBe(3);
      expect(stats.totalStars).toBe(9);
      expect(stats.totalScore).toBe(750);
    });
  });

  describe('4. Navigation Routing Integration (P14-GAM-001)', () => {
    it('parses #games/bug-hunter to bug-hunter page state', () => {
      const parsed = parseHash('#games/bug-hunter');
      expect(parsed.page).toBe('bug-hunter');
    });

    it('parses #bug-hunter to bug-hunter page state', () => {
      const parsed = parseHash('#bug-hunter');
      expect(parsed.page).toBe('bug-hunter');
    });
  });
});
