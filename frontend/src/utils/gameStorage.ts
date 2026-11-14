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
  userId: string;
  gameId: GameId;
  totalScore: number;
  totalStars: number;
  completedLevelsCount: number;
  levels: Record<number, LevelProgress>;
  lastPlayedAt: string;
}

const STORAGE_PREFIX = 'ctk_game_progress';

function buildStorageKey(userId: string, gameId: GameId): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${STORAGE_PREFIX}:${safeUser}:${gameId}`;
}

export function createInitialGameRecord(userId: string, gameId: GameId): UserGameRecord {
  return {
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

  // Recalculate totals
  let totalScore = 0;
  let totalStars = 0;
  let completedLevelsCount = 0;

  Object.values(newLevels).forEach((lvl) => {
    if (lvl.completed) {
      completedLevelsCount += 1;
      totalStars += lvl.stars;
      totalScore += lvl.highScore;
    }
  });

  const updatedRecord: UserGameRecord = {
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
