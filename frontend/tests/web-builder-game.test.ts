import { describe, it, expect, beforeEach } from 'vitest';
import {
  WEB_BUILDER_LEVELS,
  WEB_BUILDER_BLOCKS,
} from '../src/data/webBuilderData';
import {
  getUserGameRecord,
  saveLevelCompletion,
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

describe('Phase 14 Batch 5: Web Builder Game Engine & Integration (P14-GAM-008, P14-GAM-009, P14-GAM-010)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('1. verifies that all 4 progressive levels are defined with complete pedagogical metadata', () => {
    expect(WEB_BUILDER_LEVELS).toHaveLength(4);

    WEB_BUILDER_LEVELS.forEach((level, idx) => {
      expect(level.levelNumber).toBe(idx + 1);
      expect(level.id).toBe(`wb-0${idx + 1}`);
      expect(level.title).toBeTruthy();
      expect(level.targetDescription).toBeTruthy();
      expect(level.hints).toHaveLength(2);
      expect(level.pedagogicalNotes).toBeTruthy();
      expect(level.starterBlockIds.length).toBeGreaterThan(0);
      expect(level.targetBlockSequence.length).toBeGreaterThan(0);
      expect(level.blockPool.length).toBeGreaterThanOrEqual(level.targetBlockSequence.length);
    });
  });

  it('2. verifies that all essential HTML5 structural blocks exist in library with safe properties', () => {
    const requiredBlockIds = [
      'doctype',
      'html',
      'head',
      'title',
      'body',
      'header',
      'nav',
      'main',
      'section-course',
      'section-interactive',
      'footer',
      'h1',
      'h2',
      'p',
      'ul-li',
      'img',
      'a-button',
    ];

    requiredBlockIds.forEach((id) => {
      const block = WEB_BUILDER_BLOCKS[id];
      expect(block).toBeDefined();
      expect(block.id).toBe(id);
      expect(block.tag).toBeTruthy();
      expect(block.label).toBeTruthy();
      expect(block.category).toMatch(/^(root|structure|semantic|content)$/);
      expect(block.semanticRole).toBeTruthy();
    });
  });

  it('3. verifies Level 1 (Document Skeleton) sequence matching and error detection', () => {
    const lvl1 = WEB_BUILDER_LEVELS[0];
    expect(lvl1.targetBlockSequence).toEqual(['doctype', 'html', 'head', 'body']);

    // Valid sequence
    const validSequence = ['doctype', 'html', 'head', 'body'];
    const isValid = validSequence.length === lvl1.targetBlockSequence.length &&
      validSequence.every((val, i) => val === lvl1.targetBlockSequence[i]);
    expect(isValid).toBe(true);

    // Inverted sequence
    const invalidSequence = ['html', 'doctype', 'body', 'head'];
    const isInvalid = invalidSequence.every((val, i) => val === lvl1.targetBlockSequence[i]);
    expect(isInvalid).toBe(false);

    // Missing element
    const shortSequence = ['doctype', 'html', 'head'];
    expect(shortSequence.length === lvl1.targetBlockSequence.length).toBe(false);
  });

  it('4. verifies Level 2 (Semantic Landmarks) sequence matching', () => {
    const lvl2 = WEB_BUILDER_LEVELS[1];
    expect(lvl2.targetBlockSequence).toEqual(['header', 'nav', 'main', 'footer']);

    const validSequence = ['header', 'nav', 'main', 'footer'];
    expect(validSequence).toEqual(lvl2.targetBlockSequence);
  });

  it('5. verifies Level 3 (Article Content Hierarchy) sequence matching', () => {
    const lvl3 = WEB_BUILDER_LEVELS[2];
    expect(lvl3.targetBlockSequence).toEqual(['h1', 'p', 'h2', 'ul-li', 'img']);

    const validSequence = ['h1', 'p', 'h2', 'ul-li', 'img'];
    expect(validSequence).toEqual(lvl3.targetBlockSequence);
  });

  it('6. verifies Level 4 (Full Platform Homepage) sequence matching', () => {
    const lvl4 = WEB_BUILDER_LEVELS[3];
    expect(lvl4.targetBlockSequence).toEqual([
      'header',
      'nav',
      'section-course',
      'section-interactive',
      'a-button',
      'footer',
    ]);

    const validSequence = [
      'header',
      'nav',
      'section-course',
      'section-interactive',
      'a-button',
      'footer',
    ];
    expect(validSequence).toEqual(lvl4.targetBlockSequence);
  });

  it('7. saves level completion with anti-inflation star and score retention in gameStorage', () => {
    const userId = 'student-web-builder-01';

    // First completion: 2 stars, 250 points (levelId, stars, score)
    const record1 = saveLevelCompletion(userId, 'web-builder', 1, 2, 250);
    expect(record1.levels[1].highScore).toBe(250);
    expect(record1.levels[1].stars).toBe(2);
    expect(record1.levels[1].attempts).toBe(1);
    expect(record1.totalStars).toBe(2);
    expect(record1.totalScore).toBe(250);

    // Replay with worse score: 1 star, 120 points
    const record2 = saveLevelCompletion(userId, 'web-builder', 1, 1, 120);
    expect(record2.levels[1].highScore).toBe(250); // Preserved best score
    expect(record2.levels[1].stars).toBe(2); // Preserved best stars
    expect(record2.levels[1].attempts).toBe(2);
    expect(record2.totalStars).toBe(2);
    expect(record2.totalScore).toBe(250);

    // Replay with better score: 3 stars, 380 points
    const record3 = saveLevelCompletion(userId, 'web-builder', 1, 3, 380);
    expect(record3.levels[1].highScore).toBe(380);
    expect(record3.levels[1].stars).toBe(3);
    expect(record3.levels[1].attempts).toBe(3);
    expect(record3.totalStars).toBe(3);
    expect(record3.totalScore).toBe(380);
  });

  it('8. isolates Web Builder progress between different student accounts', () => {
    saveLevelCompletion('user-alice', 'web-builder', 1, 3, 300);
    saveLevelCompletion('user-bob', 'web-builder', 1, 2, 200);
    saveLevelCompletion('user-bob', 'web-builder', 2, 3, 260);

    const aliceRecord = getUserGameRecord('user-alice', 'web-builder');
    const bobRecord = getUserGameRecord('user-bob', 'web-builder');

    expect(aliceRecord.completedLevelsCount).toBe(1);
    expect(aliceRecord.totalStars).toBe(3);
    expect(aliceRecord.totalScore).toBe(300);

    expect(bobRecord.completedLevelsCount).toBe(2);
    expect(bobRecord.totalStars).toBe(5);
    expect(bobRecord.totalScore).toBe(460);
  });

  it('9. aggregates Web Builder data in getOverallGameStats', () => {
    const userId = 'student-overall-test';

    // Before any completions
    const stats0 = getOverallGameStats(userId);
    expect(stats0.totalStars).toBe(0);
    expect(stats0.totalScore).toBe(0);

    // Play code puzzle and web builder
    saveLevelCompletion(userId, 'code-puzzle', 1, 3, 350);
    saveLevelCompletion(userId, 'web-builder', 1, 3, 320);
    saveLevelCompletion(userId, 'web-builder', 2, 2, 280);

    const stats1 = getOverallGameStats(userId);
    expect(stats1.totalGamesPlayed).toBe(2);
    expect(stats1.totalLevelsCompleted).toBe(3);
    expect(stats1.totalStars).toBe(8); // 3 + 3 + 2
    expect(stats1.totalScore).toBe(950); // 350 + 320 + 280
  });

  it('10. verifies route navigation for Web Builder in NavigationContext', () => {
    const r1 = parseHash('#games/web-builder');
    expect(r1.page).toBe('web-builder');

    const r2 = parseHash('games/web-builder');
    expect(r2.page).toBe('web-builder');

    const r3 = parseHash('#web-builder');
    expect(r3.page).toBe('web-builder');
  });
});
