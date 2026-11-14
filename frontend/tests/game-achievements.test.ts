import { describe, it, expect, beforeEach } from 'vitest';
import {
  GAME_ACHIEVEMENTS,
} from '../src/data/gameAchievementsData';
import {
  getUnlockedAchievements,
  evaluateAndSyncAchievements,
  getDetailedAchievements,
  buildAchievementKey,
} from '../src/utils/gameAchievementEngine';
import { saveLevelCompletion } from '../src/utils/gameStorage';

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

describe('Phase 14 Batch 6: Game Achievements & Badges System (P14-GAM-011, P14-GAM-002, P14-GAM-012)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('1. verifies all 10 achievements are defined with valid metadata and rules', () => {
    expect(GAME_ACHIEVEMENTS).toHaveLength(10);

    GAME_ACHIEVEMENTS.forEach((ach) => {
      expect(ach.id).toBeTruthy();
      expect(ach.title).toBeTruthy();
      expect(ach.description).toBeTruthy();
      expect(ach.badgeIcon).toBeTruthy();
      expect(ach.badgeColor).toBeTruthy();
      expect(ach.requirementDescription).toBeTruthy();
      expect(typeof ach.evaluate).toBe('function');
    });
  });

  it('2. returns zero unlocked achievements for a brand new user with no game history', () => {
    const userId = 'fresh-student';
    const result = evaluateAndSyncAchievements(userId);

    expect(Object.keys(result.record.unlockedAchievements)).toHaveLength(0);
    expect(result.newlyUnlocked).toHaveLength(0);

    const detailed = getDetailedAchievements(userId);
    expect(detailed.unlockedCount).toBe(0);
    expect(detailed.unlockedPercentage).toBe(0);
  });

  it('3. unlocks "First Step" (ach-first-step) upon completing any single level', () => {
    const userId = 'student-first-step';

    // Complete 1 level in Code Puzzle
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 300);

    const { record, newlyUnlocked } = evaluateAndSyncAchievements(userId);
    expect(record.unlockedAchievements['ach-first-step']).toBeDefined();
    expect(newlyUnlocked.some((a) => a.id === 'ach-first-step')).toBe(true);
  });

  it('4. unlocks game mastery badges only when specific thresholds are satisfied', () => {
    const userId = 'student-mastery';

    // 1 level in Code Puzzle is not enough for puzzle-master (requires >= 2)
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 300);
    let eval1 = evaluateAndSyncAchievements(userId);
    expect(eval1.record.unlockedAchievements['ach-puzzle-master']).toBeUndefined();

    // 2nd level in Code Puzzle triggers puzzle-master
    saveLevelCompletion(userId, 'code-puzzle', 2, 3, 300);
    let eval2 = evaluateAndSyncAchievements(userId);
    expect(eval2.record.unlockedAchievements['ach-puzzle-master']).toBeDefined();
    expect(eval2.newlyUnlocked.some((a) => a.id === 'ach-puzzle-master')).toBe(true);

    // CSS Artist requires >= 2 in css-designer
    saveLevelCompletion(userId, 'css-designer', 1, 3, 200);
    saveLevelCompletion(userId, 'css-designer', 2, 3, 250);
    let eval3 = evaluateAndSyncAchievements(userId);
    expect(eval3.record.unlockedAchievements['ach-css-artist']).toBeDefined();

    // Web Architect requires >= 2 in web-builder
    saveLevelCompletion(userId, 'web-builder', 1, 3, 300);
    saveLevelCompletion(userId, 'web-builder', 2, 3, 300);
    let eval4 = evaluateAndSyncAchievements(userId);
    expect(eval4.record.unlockedAchievements['ach-web-architect']).toBeDefined();
  });

  it('5. unlocks Omni-Player (ach-omni-player) only when all 5 games have at least 1 completed level', () => {
    const userId = 'student-omni';

    // Complete 4 games
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 300);
    saveLevelCompletion(userId, 'css-designer', 1, 3, 300);
    saveLevelCompletion(userId, 'bug-hunter', 1, 3, 300);
    saveLevelCompletion(userId, 'quiz-rush', 1, 3, 300);

    let res1 = evaluateAndSyncAchievements(userId);
    expect(res1.record.unlockedAchievements['ach-omni-player']).toBeUndefined();

    // Now complete 5th game (Web Builder)
    saveLevelCompletion(userId, 'web-builder', 1, 3, 300);
    let res2 = evaluateAndSyncAchievements(userId);
    expect(res2.record.unlockedAchievements['ach-omni-player']).toBeDefined();
    expect(res2.newlyUnlocked.some((a) => a.id === 'ach-omni-player')).toBe(true);
  });

  it('6. unlocks Star Milestones (10★ and 20★) correctly', () => {
    const userId = 'student-stars';

    // 3 games x 3 stars = 9 stars (not yet 10)
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 300);
    saveLevelCompletion(userId, 'code-puzzle', 2, 3, 300);
    saveLevelCompletion(userId, 'code-puzzle', 3, 3, 300);
    let eval1 = evaluateAndSyncAchievements(userId);
    expect(eval1.record.unlockedAchievements['ach-star-collector-10']).toBeUndefined();

    // Add 1 more level (3 stars) => 12 stars => ach-star-collector-10 unlocked!
    saveLevelCompletion(userId, 'code-puzzle', 4, 3, 300);
    let eval2 = evaluateAndSyncAchievements(userId);
    expect(eval2.record.unlockedAchievements['ach-star-collector-10']).toBeDefined();
    expect(eval2.record.unlockedAchievements['ach-star-collector-20']).toBeUndefined();

    // Add more stars across games to exceed 20 stars
    saveLevelCompletion(userId, 'css-designer', 1, 3, 300);
    saveLevelCompletion(userId, 'css-designer', 2, 3, 300);
    saveLevelCompletion(userId, 'css-designer', 3, 3, 300); // 12 + 9 = 21 stars
    let eval3 = evaluateAndSyncAchievements(userId);
    expect(eval3.record.unlockedAchievements['ach-star-collector-20']).toBeDefined();
  });

  it('7. is idempotent and never duplicates or re-unlocks existing achievements', () => {
    const userId = 'student-idempotent';
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 300);

    const firstRun = evaluateAndSyncAchievements(userId);
    expect(firstRun.newlyUnlocked).toHaveLength(1);
    const initialUnlockTime = firstRun.record.unlockedAchievements['ach-first-step'].unlockedAt;

    // Second evaluation without progress
    const secondRun = evaluateAndSyncAchievements(userId);
    expect(secondRun.newlyUnlocked).toHaveLength(0);
    expect(secondRun.record.unlockedAchievements['ach-first-step'].unlockedAt).toBe(initialUnlockTime);
  });

  it('8. strictly isolates achievements between multiple student accounts', () => {
    saveLevelCompletion('user-alice', 'code-puzzle', 1, 3, 300);
    saveLevelCompletion('user-alice', 'code-puzzle', 2, 3, 300);

    evaluateAndSyncAchievements('user-alice');
    evaluateAndSyncAchievements('user-bob');

    const aliceDetailed = getDetailedAchievements('user-alice');
    const bobDetailed = getDetailedAchievements('user-bob');

    expect(aliceDetailed.unlockedCount).toBeGreaterThan(0);
    expect(bobDetailed.unlockedCount).toBe(0);
  });

  it('9. recovers gracefully from corrupted JSON in achievement storage', () => {
    const userId = 'corrupt-ach-user';
    const key = buildAchievementKey(userId);
    window.localStorage.setItem(key, 'MALFORMED{NOT_VALID_JSON');

    const res = getUnlockedAchievements(userId);
    expect(res.userId).toBe(userId);
    expect(Object.keys(res.unlockedAchievements)).toHaveLength(0);
  });
});
