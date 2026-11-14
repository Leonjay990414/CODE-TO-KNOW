/**
 * CODE TO KNOW 碼上學｜成就與徽章計算引擎
 * 對應原始 UID：P14-GAM-011（每日任務、連續學習、成就及可解鎖元件）
 * 特色：真實遊戲紀錄推導、防重複發放、多帳號隔離、向前相容
 */

import {
  GameId,
  getUserGameRecord,
  getOverallGameStats,
  UserGameRecord,
} from './gameStorage';
import {
  GAME_ACHIEVEMENTS,
  AchievementDefinition,
  AchievementEvaluationContext,
} from '../data/gameAchievementsData';

export const ACHIEVEMENT_STORAGE_PREFIX = 'ctk_game_achievements';

export interface UnlockedEntry {
  unlockedAt: string;
}

export interface UserAchievementRecord {
  userId: string;
  unlockedAchievements: Record<string, UnlockedEntry>;
  lastEvaluatedAt: string;
}

export function buildAchievementKey(userId: string): string {
  const sanitized = (userId || 'anonymous').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${ACHIEVEMENT_STORAGE_PREFIX}:${sanitized}`;
}

export function getUnlockedAchievements(userId: string): UserAchievementRecord {
  const key = buildAchievementKey(userId);
  const fallback: UserAchievementRecord = {
    userId,
    unlockedAchievements: {},
    lastEvaluatedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;

    return {
      userId: parsed.userId || userId,
      unlockedAchievements: parsed.unlockedAchievements || {},
      lastEvaluatedAt: parsed.lastEvaluatedAt || new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[AchievementEngine] Failed to read ${key}, using empty:`, err);
    return fallback;
  }
}

export function saveUserAchievements(
  userId: string,
  record: UserAchievementRecord
): void {
  if (typeof window === 'undefined') return;
  const key = buildAchievementKey(userId);
  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch (err) {
    console.error(`[AchievementEngine] Failed to save achievements to ${key}:`, err);
  }
}

/**
 * Evaluates all achievements based on authentic game records.
 * Returns updated record and list of newly unlocked achievements.
 */
export function evaluateAndSyncAchievements(userId: string): {
  record: UserAchievementRecord;
  newlyUnlocked: AchievementDefinition[];
} {
  const currentRecord = getUnlockedAchievements(userId);
  const newlyUnlocked: AchievementDefinition[] = [];

  // Build evaluation context from authentic game data
  const records: Record<GameId, UserGameRecord> = {
    'code-puzzle': getUserGameRecord(userId, 'code-puzzle'),
    'css-designer': getUserGameRecord(userId, 'css-designer'),
    'bug-hunter': getUserGameRecord(userId, 'bug-hunter'),
    'quiz-rush': getUserGameRecord(userId, 'quiz-rush'),
    'web-builder': getUserGameRecord(userId, 'web-builder'),
  };

  const overall = getOverallGameStats(userId);

  const ctx: AchievementEvaluationContext = {
    userId,
    records,
    totalStars: overall.totalStars,
    totalScore: overall.totalScore,
    totalGamesPlayed: overall.totalGamesPlayed,
    totalLevelsCompleted: overall.totalLevelsCompleted,
  };

  // Evaluate each achievement definition
  const updatedUnlocked = { ...currentRecord.unlockedAchievements };
  let hasNew = false;

  GAME_ACHIEVEMENTS.forEach((ach) => {
    // If not yet unlocked, check condition
    if (!updatedUnlocked[ach.id]) {
      try {
        if (ach.evaluate(ctx)) {
          updatedUnlocked[ach.id] = {
            unlockedAt: new Date().toISOString(),
          };
          newlyUnlocked.push(ach);
          hasNew = true;
        }
      } catch (err) {
        console.warn(`[AchievementEngine] Error evaluating ${ach.id}:`, err);
      }
    }
  });

  const updatedRecord: UserAchievementRecord = {
    userId,
    unlockedAchievements: updatedUnlocked,
    lastEvaluatedAt: new Date().toISOString(),
  };

  if (hasNew || !currentRecord.lastEvaluatedAt) {
    saveUserAchievements(userId, updatedRecord);
  }

  return {
    record: updatedRecord,
    newlyUnlocked,
  };
}

export interface DetailedAchievementItem extends AchievementDefinition {
  isUnlocked: boolean;
  unlockedAt?: string;
}

export function getDetailedAchievements(userId: string): {
  totalCount: number;
  unlockedCount: number;
  unlockedPercentage: number;
  achievements: DetailedAchievementItem[];
} {
  const { record } = evaluateAndSyncAchievements(userId);
  const totalCount = GAME_ACHIEVEMENTS.length;
  let unlockedCount = 0;

  const achievements: DetailedAchievementItem[] = GAME_ACHIEVEMENTS.map((ach) => {
    const entry = record.unlockedAchievements[ach.id];
    const isUnlocked = !!entry;
    if (isUnlocked) unlockedCount += 1;

    return {
      ...ach,
      isUnlocked,
      unlockedAt: entry?.unlockedAt,
    };
  });

  const unlockedPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return {
    totalCount,
    unlockedCount,
    unlockedPercentage,
    achievements,
  };
}
