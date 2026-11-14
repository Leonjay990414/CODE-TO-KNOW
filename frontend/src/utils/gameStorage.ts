/**
 * CODE TO KNOW — Game Storage & Gamified Learning Progress Utility
 * Phase 14: Interactive Gaming and Gamified Learning System (P14-GAM-002, P14-GAM-003, P14-GAM-010, P14-GAM-012)
 *
 * Implements user-isolated LocalStorage tracking for educational games:
 * - Code Puzzle (程式邏輯拼圖)
 * - CSS Designer (樣式排版設計師)
 * - Bug Hunter (程式除錯獵人)
 * - Quiz Rush (證照疾速快答)
 * - Web Builder (網頁架構拼裝工坊)
 */

export type GameId = 'code-puzzle' | 'css-designer' | 'bug-hunter' | 'quiz-rush' | 'web-builder';

export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number; // 0-3
  highScore: number;
  attempts: number;
  hintsUsed: number;
  bestTimeSeconds?: number;
  completedAt?: string;
}

export interface UserGameRecord {
  version?: number;
  userId: string;
  gameId: GameId;
  totalScore: number;
  totalStars: number;
  completedLevelsCount: number;
  levels: Record<number, LevelProgress>;
  lastPlayedAt: string;
}

export type GameSessionState =
  | 'idle'
  | 'in-progress'
  | 'completed'
  | 'abandoned'
  | 'timed-out'
  | 'error';

export interface ActiveSessionData {
  sessionId: string;
  selectedLevelId?: number;
  state: GameSessionState;
  startedAt: string;
  lastUpdatedAt: string;
}

const STORAGE_PREFIX = 'ctk_game_progress';
const SESSION_STORAGE_PREFIX = 'ctk_game_session';
const SETTLED_STORAGE_PREFIX = 'ctk_game_settled';

function buildStorageKey(userId: string, gameId: GameId): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${STORAGE_PREFIX}:${safeUser}:${gameId}`;
}

export function createInitialGameRecord(userId: string, gameId: GameId): UserGameRecord {
  return {
    version: 1,
    userId: userId || 'guest-anonymous',
    gameId,
    totalScore: 0,
    totalStars: 0,
    completedLevelsCount: 0,
    levels: {},
    lastPlayedAt: new Date().toISOString(),
  };
}

/**
 * Retrieve user progress for a specific game safely
 */
export function getUserGameRecord(userId: string, gameId: GameId): UserGameRecord {
  const key = buildStorageKey(userId, gameId);
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) {
      return createInitialGameRecord(userId, gameId);
    }
    const parsed = JSON.parse(raw) as UserGameRecord;
    if (!parsed || typeof parsed !== 'object' || !parsed.levels) {
      return createInitialGameRecord(userId, gameId);
    }
    return parsed;
  } catch (err) {
    console.warn(`[GameStorage] Failed to read ${key}, returning initial state:`, err);
    return createInitialGameRecord(userId, gameId);
  }
}

/**
 * Save user progress for a level completion
 */
export function saveLevelCompletion(
  userId: string,
  gameId: GameId,
  levelId: number,
  stars: number,
  score: number,
  hintsUsed: number = 0,
  timeSpentSeconds?: number
): UserGameRecord {
  const currentRecord = getUserGameRecord(userId, gameId);
  const existingLevel = currentRecord.levels[levelId] || {
    levelId,
    completed: false,
    stars: 0,
    highScore: 0,
    attempts: 0,
    hintsUsed: 0,
  };

  const updatedStars = Math.max(existingLevel.stars, Math.min(3, Math.max(1, stars)));
  const updatedHighScore = Math.max(existingLevel.highScore, score);
  const updatedAttempts = existingLevel.attempts + 1;
  const updatedBestTime = existingLevel.bestTimeSeconds
    ? timeSpentSeconds
      ? Math.min(existingLevel.bestTimeSeconds, timeSpentSeconds)
      : existingLevel.bestTimeSeconds
    : timeSpentSeconds;

  const updatedLevel: LevelProgress = {
    levelId,
    completed: true,
    stars: updatedStars,
    highScore: updatedHighScore,
    attempts: updatedAttempts,
    hintsUsed: Math.max(existingLevel.hintsUsed, hintsUsed),
    bestTimeSeconds: updatedBestTime,
    completedAt: new Date().toISOString(),
  };

  const newLevels = {
    ...currentRecord.levels,
    [levelId]: updatedLevel,
  };

  // Recalculate totals with finite clamping protection
  let totalScore = 0;
  let totalStars = 0;
  let completedLevelsCount = 0;

  Object.values(newLevels).forEach((lvl) => {
    if (lvl.completed) {
      completedLevelsCount += 1;
      const safeStars = Math.max(0, Math.min(3, Number.isFinite(lvl.stars) ? Math.floor(lvl.stars) : 0));
      const safeScore = Math.max(0, Math.min(100000, Number.isFinite(lvl.highScore) ? Math.floor(lvl.highScore) : 0));
      totalStars += safeStars;
      totalScore += safeScore;
    }
  });

  const updatedRecord: UserGameRecord = {
    version: 1,
    userId: currentRecord.userId,
    gameId,
    totalScore,
    totalStars,
    completedLevelsCount,
    levels: newLevels,
    lastPlayedAt: new Date().toISOString(),
  };

  const key = buildStorageKey(userId, gameId);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(updatedRecord));
    }
  } catch (err) {
    console.error(`[GameStorage] Failed to save game progress to ${key}:`, err);
  }

  return updatedRecord;
}

/**
 * Reset game progress for a specific user and game
 */
export function resetGameProgress(userId: string, gameId: GameId): UserGameRecord {
  const key = buildStorageKey(userId, gameId);
  const resetRecord = createInitialGameRecord(userId, gameId);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.error(`[GameStorage] Failed to clear game progress at ${key}:`, err);
  }
  return resetRecord;
}

/**
 * Active Session Resilience Functions
 */
function buildSessionKey(userId: string, gameId: GameId): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${SESSION_STORAGE_PREFIX}:${safeUser}:${gameId}`;
}

function buildSettledKey(userId: string, sessionId: string): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  const safeSession = (sessionId || 'anonymous-session').trim();
  return `${SETTLED_STORAGE_PREFIX}:${safeUser}:${safeSession}`;
}

export function saveActiveSessionState(userId: string, gameId: GameId, data: ActiveSessionData): void {
  const key = buildSessionKey(userId, gameId);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.error(`[GameStorage] Failed to save active session state to ${key}:`, err);
  }
}

export function getActiveSessionState(userId: string, gameId: GameId): ActiveSessionData | null {
  const key = buildSessionKey(userId, gameId);
  try {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.sessionId === 'string' && typeof parsed.state === 'string') {
        return parsed as ActiveSessionData;
      }
    }
  } catch (err) {
    console.warn(`[GameStorage] Failed to parse active session at ${key}:`, err);
  }
  return null;
}

export function clearActiveSessionState(userId: string, gameId: GameId): void {
  const key = buildSessionKey(userId, gameId);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.error(`[GameStorage] Failed to clear active session at ${key}:`, err);
  }
}

export function isGameSessionSettled(userId: string, sessionId: string): boolean {
  const key = buildSettledKey(userId, sessionId);
  try {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key) === 'settled';
    }
  } catch (err) {
    console.warn(`[GameStorage] Failed to check settled status at ${key}:`, err);
  }
  return false;
}

export function markGameSessionSettled(userId: string, sessionId: string): void {
  const key = buildSettledKey(userId, sessionId);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, 'settled');
    }
  } catch (err) {
    console.error(`[GameStorage] Failed to mark settled status at ${key}:`, err);
  }
}

/**
 * Get aggregate statistics across all educational games
 */
export function getOverallGameStats(userId: string): {
  totalStars: number;
  totalScore: number;
  totalGamesPlayed: number;
  totalLevelsCompleted: number;
} {
  const games: GameId[] = ['code-puzzle', 'css-designer', 'bug-hunter', 'quiz-rush', 'web-builder'];
  let totalStars = 0;
  let totalScore = 0;
  let totalGamesPlayed = 0;
  let totalLevelsCompleted = 0;

  games.forEach((g) => {
    const record = getUserGameRecord(userId, g);
    if (record.completedLevelsCount > 0) {
      totalGamesPlayed += 1;
      totalStars += record.totalStars;
      totalScore += record.totalScore;
      totalLevelsCompleted += record.completedLevelsCount;
    }
  });

  return {
    totalStars,
    totalScore,
    totalGamesPlayed,
    totalLevelsCompleted,
  };
}
