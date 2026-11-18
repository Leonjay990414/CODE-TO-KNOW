/**
 * 碼上學｜CODE TO KNOW
 * 管理員教育遊戲參數配置管理工具 (Phase 14: P14-GAM-015 - 本地原型)
 *
 * 聲明：本模組為本機展示與管理原型，所有調整儲存於 LocalStorage，
 * 尚未介接雲端管理後端 API 與即時規則廣播服務。
 */

import { GameTypeKey, GAME_TYPE_METADATA } from './teacherGameTaskManager';

export interface AdminGameSetting {
  gameType: GameTypeKey;
  gameName: string;
  isEnabled: boolean;
  timeLimitSeconds: number; // 倒數秒數 (0 代表無時間限制，上限 300)
  tolerancePercentage: number; // 樣式或語意比對容差 (0~50%)
  scoreMultiplier: number; // 計分倍率 (0.5 ~ 3.0x)
  updatedAt: string;
}

const STORAGE_KEY = 'ctk_admin_game_configs';

export const DEFAULT_ADMIN_GAME_SETTINGS: Record<GameTypeKey, AdminGameSetting> = {
  puzzle: {
    gameType: 'puzzle',
    gameName: 'Code Puzzle 程式邏輯拼圖',
    isEnabled: true,
    timeLimitSeconds: 0,
    tolerancePercentage: 0,
    scoreMultiplier: 1.0,
    updatedAt: '2026-11-18T00:00:00.000Z',
  },
  css: {
    gameType: 'css',
    gameName: 'CSS Designer 樣式調校大師',
    isEnabled: true,
    timeLimitSeconds: 0,
    tolerancePercentage: 5,
    scoreMultiplier: 1.0,
    updatedAt: '2026-11-18T00:00:00.000Z',
  },
  'bug-hunter': {
    gameType: 'bug-hunter',
    gameName: 'Bug Hunter 除錯特工隊',
    isEnabled: true,
    timeLimitSeconds: 0,
    tolerancePercentage: 0,
    scoreMultiplier: 1.0,
    updatedAt: '2026-11-18T00:00:00.000Z',
  },
  'quiz-rush': {
    gameType: 'quiz-rush',
    gameName: 'Quiz Rush 證照競速快問快答',
    isEnabled: true,
    timeLimitSeconds: 10,
    tolerancePercentage: 0,
    scoreMultiplier: 1.0,
    updatedAt: '2026-11-18T00:00:00.000Z',
  },
  'web-builder': {
    gameType: 'web-builder',
    gameName: 'Web Builder 網頁架構拼裝',
    isEnabled: true,
    timeLimitSeconds: 0,
    tolerancePercentage: 5,
    scoreMultiplier: 1.0,
    updatedAt: '2026-11-18T00:00:00.000Z',
  },
};

/**
 * 檢查是否具備管理員權限
 */
export function hasAdminConfigPermission(userRole?: string): boolean {
  if (!userRole) return false;
  const upper = userRole.toUpperCase();
  return upper === 'ADMIN' || upper === 'PLATFORM_ADMIN';
}

/**
 * 安全數值收斂輔助函式
 */
function clamp(val: unknown, min: number, max: number, defaultVal: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
}

/**
 * 取得全部遊戲之後台管理配置（具備損毀防禦與安全收斂）
 */
export function getAllGameSettings(): Record<GameTypeKey, AdminGameSetting> {
  if (typeof window === 'undefined') return { ...DEFAULT_ADMIN_GAME_SETTINGS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_GAME_SETTINGS };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_ADMIN_GAME_SETTINGS };

    const result = { ...DEFAULT_ADMIN_GAME_SETTINGS };
    (Object.keys(DEFAULT_ADMIN_GAME_SETTINGS) as GameTypeKey[]).forEach((key) => {
      const def = DEFAULT_ADMIN_GAME_SETTINGS[key];
      const item = parsed[key];
      if (item && typeof item === 'object') {
        result[key] = {
          gameType: key,
          gameName: GAME_TYPE_METADATA[key]?.name || def.gameName,
          isEnabled: typeof item.isEnabled === 'boolean' ? item.isEnabled : def.isEnabled,
          timeLimitSeconds: clamp(item.timeLimitSeconds, 0, 300, def.timeLimitSeconds),
          tolerancePercentage: clamp(item.tolerancePercentage, 0, 50, def.tolerancePercentage),
          scoreMultiplier: clamp(item.scoreMultiplier, 0.5, 3.0, def.scoreMultiplier),
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : def.updatedAt,
        };
      }
    });
    return result;
  } catch (err) {
    console.warn('[AdminGameConfig] 解析設定失敗，回退預設值:', err);
    return { ...DEFAULT_ADMIN_GAME_SETTINGS };
  }
}

/**
 * 更新指定遊戲之後台管理配置
 */
export function updateGameSetting(
  gameType: GameTypeKey,
  updates: Partial<Omit<AdminGameSetting, 'gameType' | 'gameName' | 'updatedAt'>>,
  userRole?: string
): AdminGameSetting {
  // 權限檢查：若傳入 userRole 且非管理員，拋出權限不足例外
  if (userRole && !hasAdminConfigPermission(userRole)) {
    throw new Error('權限不足：僅有平台管理員可變更遊戲參數設定');
  }

  const current = getAllGameSettings();
  const target = current[gameType] || DEFAULT_ADMIN_GAME_SETTINGS[gameType];

  const updated: AdminGameSetting = {
    ...target,
    isEnabled: typeof updates.isEnabled === 'boolean' ? updates.isEnabled : target.isEnabled,
    timeLimitSeconds: clamp(updates.timeLimitSeconds, 0, 300, target.timeLimitSeconds),
    tolerancePercentage: clamp(updates.tolerancePercentage, 0, 50, target.tolerancePercentage),
    scoreMultiplier: clamp(updates.scoreMultiplier, 0.5, 3.0, target.scoreMultiplier),
    updatedAt: new Date().toISOString(),
  };

  current[gameType] = updated;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('[AdminGameConfig] 儲存設定失敗:', err);
  }
  return updated;
}

/**
 * 重設全部遊戲設定為官方預設值
 */
export function resetAllGameSettings(userRole?: string): void {
  if (userRole && !hasAdminConfigPermission(userRole)) {
    throw new Error('權限不足：僅有平台管理員可重設遊戲參數');
  }
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[AdminGameConfig] 重設設定失敗:', err);
  }
}
