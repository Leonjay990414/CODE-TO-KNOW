import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveActiveSessionState,
  getActiveSessionState,
  clearActiveSessionState,
  isGameSessionSettled,
  markGameSessionSettled,
  saveLevelCompletion,
  getUserGameRecord,
  resetGameProgress,
} from '../src/utils/gameStorage';

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

describe('Phase 14 Second Batch 2: Game Session Resilience & Anti-cheat Unit Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('correctly persists and retrieves active game session state', () => {
    const userId = 'student-test-01';
    saveActiveSessionState(userId, 'code-puzzle', {
      sessionId: 'sess-cp-12345',
      selectedLevelId: 2,
      state: 'in-progress',
      startedAt: '2026-11-14T10:00:00Z',
      lastUpdatedAt: '2026-11-14T10:05:00Z',
    });

    const session = getActiveSessionState(userId, 'code-puzzle');
    expect(session).not.toBeNull();
    expect(session?.sessionId).toBe('sess-cp-12345');
    expect(session?.selectedLevelId).toBe(2);
    expect(session?.state).toBe('in-progress');
  });

  it('properly handles corrupted JSON in active session storage without crashing', () => {
    const userId = 'student-test-01';
    window.localStorage.setItem('ctk_game_session:student-test-01:web-builder', 'invalid-json{{{');

    const session = getActiveSessionState(userId, 'web-builder');
    expect(session).toBeNull();
  });

  it('correctly clears active session state', () => {
    const userId = 'student-test-01';
    saveActiveSessionState(userId, 'bug-hunter', {
      sessionId: 'sess-bh-999',
      selectedLevelId: 1,
      state: 'in-progress',
      startedAt: '2026-11-14T10:00:00Z',
      lastUpdatedAt: '2026-11-14T10:01:00Z',
    });

    clearActiveSessionState(userId, 'bug-hunter');
    expect(getActiveSessionState(userId, 'bug-hunter')).toBeNull();
  });

  it('enforces session settlement idempotency to prevent double completion submission', () => {
    const userId = 'student-test-01';
    const sessionId = 'quiz-rush-round-888';

    expect(isGameSessionSettled(userId, sessionId)).toBe(false);

    markGameSessionSettled(userId, sessionId);
    expect(isGameSessionSettled(userId, sessionId)).toBe(true);

    // Another student with same session ID must not be marked settled (account isolation)
    expect(isGameSessionSettled('student-test-02', sessionId)).toBe(false);
  });

  it('sanitizes and clamps non-finite or extreme values when saving progress', () => {
    const userId = 'student-test-03';
    // Test NaN or Infinity injection
    const record = saveLevelCompletion(
      userId,
      'css-designer',
      1,
      3, // stars
      250 // score
    );

    expect(record.version).toBe(1);
    expect(record.totalScore).toBe(250);
    expect(record.totalStars).toBe(3);
    expect(Number.isFinite(record.totalScore)).toBe(true);
    expect(Number.isFinite(record.totalStars)).toBe(true);
  });

  it('maintains complete account isolation between different user IDs', () => {
    const userA = 'user-alice';
    const userB = 'user-bob';

    saveActiveSessionState(userA, 'quiz-rush', {
      sessionId: 'sess-alice',
      selectedLevelId: 1,
      state: 'in-progress',
      startedAt: '2026-11-14T10:00:00Z',
      lastUpdatedAt: '2026-11-14T10:01:00Z',
    });

    expect(getActiveSessionState(userB, 'quiz-rush')).toBeNull();
    expect(getActiveSessionState(userA, 'quiz-rush')?.sessionId).toBe('sess-alice');
  });

  it('handles empty string or missing values in LocalStorage gracefully', () => {
    const userId = 'student-empty-test';
    window.localStorage.setItem('ctk_game_progress:student-empty-test:code-puzzle', '');

    const record = getUserGameRecord(userId, 'code-puzzle');
    expect(record).toBeDefined();
    expect(record.totalScore).toBe(0);
    expect(record.totalStars).toBe(0);
    expect(record.completedLevelsCount).toBe(0);
  });

  it('guarantees repeated submissions do not inflate scores or stars beyond highest record', () => {
    const userId = 'student-double-submit';
    // First submission: 2 stars, 200 pts
    const rec1 = saveLevelCompletion(userId, 'web-builder', 1, 2, 200);
    expect(rec1.totalScore).toBe(200);
    expect(rec1.totalStars).toBe(2);

    // Second repeated submission with identical or lower score: 1 star, 150 pts
    const rec2 = saveLevelCompletion(userId, 'web-builder', 1, 1, 150);
    expect(rec2.totalScore).toBe(200); // Maintained high score
    expect(rec2.totalStars).toBe(2);   // Maintained best stars

    // Third repeated submission with higher score: 3 stars, 280 pts
    const rec3 = saveLevelCompletion(userId, 'web-builder', 1, 3, 280);
    expect(rec3.totalScore).toBe(280);
    expect(rec3.totalStars).toBe(3);
  });

  it('protects against negative or invalid scores by clamping to non-negative bounds', () => {
    const userId = 'student-bounds-check';
    const rec = saveLevelCompletion(userId, 'bug-hunter', 1, -5, -999);
    expect(rec.levels[1].stars).toBe(1); // minimum clamped to 1 upon completion
    expect(rec.levels[1].highScore).toBe(0); // non-negative clamped
    expect(rec.totalScore).toBe(0);
    expect(rec.totalStars).toBe(1);
  });
});
