/**
 * Phase 14 Batch 1: Interactive Gaming System & Code Puzzle Test Suite
 * UIDs: P14-GAM-001, P14-GAM-002, P14-GAM-003, P14-GAM-004, P14-GAM-009, P14-GAM-010, P14-GAM-012
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CODE_PUZZLE_LEVELS,
  CodePuzzleLevel,
} from '../src/data/codePuzzleData';
import {
  getUserGameRecord,
  saveLevelCompletion,
  resetGameProgress,
  getOverallGameStats,
  createInitialGameRecord,
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

describe('Phase 14 Batch 1: Code Puzzle & Game System Test Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('1. Code Puzzle Level Definitions Integrity (P14-GAM-004, P14-GAM-009)', () => {
    it('contains at least 3 high-quality educational levels', () => {
      expect(CODE_PUZZLE_LEVELS.length).toBeGreaterThanOrEqual(3);
    });

    it('verifies every level has valid metadata, blocks, and correctOrder parity', () => {
      CODE_PUZZLE_LEVELS.forEach((level: CodePuzzleLevel) => {
        expect(level.levelId).toBeGreaterThan(0);
        expect(level.title.length).toBeGreaterThan(0);
        expect(level.blocks.length).toBeGreaterThanOrEqual(4);
        expect(level.correctOrder.length).toBe(level.blocks.length);
        expect(level.hints.length).toBeGreaterThanOrEqual(2);
        expect(level.explanation.length).toBeGreaterThan(20);
        expect(level.targetCode.length).toBeGreaterThan(20);

        const blockIds = new Set(level.blocks.map((b) => b.id));
        level.correctOrder.forEach((id) => {
          expect(blockIds.has(id)).toBe(true);
        });
      });
    });

    it('ensures initial block order is scrambled compared to correct order', () => {
      CODE_PUZZLE_LEVELS.forEach((level) => {
        const initialIds = level.blocks.map((b) => b.id);
        const isIdentical = initialIds.every((id, idx) => id === level.correctOrder[idx]);
        expect(isIdentical).toBe(false);
      });
    });
  });

  describe('2. User-Isolated Game Storage & Rating Rules (P14-GAM-002, P14-GAM-010, P14-GAM-012)', () => {
    it('returns clean initial record for fresh users', () => {
      const record = getUserGameRecord('new-student-001', 'code-puzzle');
      expect(record.totalScore).toBe(0);
      expect(record.totalStars).toBe(0);
      expect(record.completedLevelsCount).toBe(0);
      expect(Object.keys(record.levels).length).toBe(0);
    });

    it('saves level completion and awards correct stars and score', () => {
      const user = 'student-test-alpha';
      const record = saveLevelCompletion(user, 'code-puzzle', 1, 3, 250, 0, 45);

      expect(record.completedLevelsCount).toBe(1);
      expect(record.totalStars).toBe(3);
      expect(record.totalScore).toBe(250);
      expect(record.levels[1].completed).toBe(true);
      expect(record.levels[1].stars).toBe(3);
      expect(record.levels[1].highScore).toBe(250);
      expect(record.levels[1].hintsUsed).toBe(0);
      expect(record.levels[1].bestTimeSeconds).toBe(45);
    });

    it('preserves higher stars and scores across multiple replays of a level', () => {
      const user = 'student-replayer';
      // First attempt: 1 star with 2 hints used
      saveLevelCompletion(user, 'code-puzzle', 1, 1, 150, 2, 90);
      // Second attempt: 3 stars with 0 hints used, faster time
      const updated = saveLevelCompletion(user, 'code-puzzle', 1, 3, 250, 0, 35);

      expect(updated.levels[1].stars).toBe(3);
      expect(updated.levels[1].highScore).toBe(250);
      expect(updated.levels[1].attempts).toBe(2);
      expect(updated.levels[1].bestTimeSeconds).toBe(35);

      // Third attempt with lower score should not overwrite high score or stars
      const third = saveLevelCompletion(user, 'code-puzzle', 1, 1, 120, 2, 60);
      expect(third.levels[1].stars).toBe(3);
      expect(third.levels[1].highScore).toBe(250);
      expect(third.levels[1].attempts).toBe(3);
      expect(third.levels[1].bestTimeSeconds).toBe(35);
    });

    it('strictly isolates game data between different users', () => {
      saveLevelCompletion('user-alice', 'code-puzzle', 1, 3, 250);
      saveLevelCompletion('user-alice', 'code-puzzle', 2, 2, 200);

      const aliceRecord = getUserGameRecord('user-alice', 'code-puzzle');
      const bobRecord = getUserGameRecord('user-bob', 'code-puzzle');

      expect(aliceRecord.totalStars).toBe(5);
      expect(aliceRecord.totalScore).toBe(450);
      expect(aliceRecord.completedLevelsCount).toBe(2);

      // Bob should have zero progress
      expect(bobRecord.totalStars).toBe(0);
      expect(bobRecord.totalScore).toBe(0);
      expect(bobRecord.completedLevelsCount).toBe(0);
    });

    it('aggregates overall statistics across games accurately', () => {
      const user = 'player-multi-game';
      saveLevelCompletion(user, 'code-puzzle', 1, 3, 250);
      saveLevelCompletion(user, 'code-puzzle', 2, 3, 250);
      saveLevelCompletion(user, 'css-designer', 1, 2, 200);

      const stats = getOverallGameStats(user);
      expect(stats.totalGamesPlayed).toBe(2);
      expect(stats.totalLevelsCompleted).toBe(3);
      expect(stats.totalStars).toBe(8);
      expect(stats.totalScore).toBe(700);
    });

    it('safely recovers from corrupted localStorage data without crashing', () => {
      window.localStorage.setItem('ctk_game_progress:corrupt-player:code-puzzle', 'MALFORMED{JSON###');
      const recovered = getUserGameRecord('corrupt-player', 'code-puzzle');

      expect(recovered.totalScore).toBe(0);
      expect(recovered.totalStars).toBe(0);
      expect(recovered.completedLevelsCount).toBe(0);
      expect(typeof recovered.levels).toBe('object');
    });

    it('resets progress cleanly when requested', () => {
      const user = 'reset-player';
      saveLevelCompletion(user, 'code-puzzle', 1, 3, 250);
      expect(getUserGameRecord(user, 'code-puzzle').totalScore).toBe(250);

      const reset = resetGameProgress(user, 'code-puzzle');
      expect(reset.totalScore).toBe(0);
      expect(reset.totalStars).toBe(0);
      expect(getUserGameRecord(user, 'code-puzzle').totalScore).toBe(0);
    });
  });

  describe('3. Navigation Route Integration (P14-GAM-001)', () => {
    it('parses #games into game-center route state', () => {
      const parsed = parseHash('#games');
      expect(parsed.page).toBe('game-center');
    });

    it('parses #game-center into game-center route state', () => {
      const parsed = parseHash('#game-center');
      expect(parsed.page).toBe('game-center');
    });

    it('parses #games/code-puzzle into code-puzzle route state', () => {
      const parsed = parseHash('#games/code-puzzle');
      expect(parsed.page).toBe('code-puzzle');
    });

    it('parses #code-puzzle into code-puzzle route state', () => {
      const parsed = parseHash('#code-puzzle');
      expect(parsed.page).toBe('code-puzzle');
    });
  });
});
