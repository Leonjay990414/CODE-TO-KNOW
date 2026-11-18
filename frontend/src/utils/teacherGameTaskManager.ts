/**
 * 碼上學｜CODE TO KNOW
 * 教師遊戲關卡作業指派管理工具 (Phase 14: P14-GAM-014 - 本地原型)
 *
 * 聲明：本模組為本機展示與互動原型，資料隔離存於 LocalStorage，
 * 尚未介接雲端資料庫與後端作業派送 API。
 */

export type GameTypeKey = 'puzzle' | 'css' | 'bug-hunter' | 'quiz-rush' | 'web-builder';

export interface TeacherGameTask {
  id: string;
  teacherId?: string;
  classroomId: string;
  gameType: GameTypeKey;
  gameTitle: string;
  levelId: number;
  targetStars: number;
  assignedAt: string;
  dueDate: string;
  description?: string;
  isActive: boolean;
  updatedAt?: string;
}

const STORAGE_PREFIX = 'ctk_teacher_game_tasks:';

export const GAME_TYPE_METADATA: Record<GameTypeKey, { name: string; maxLevel: number }> = {
  puzzle: { name: 'Code Puzzle 程式邏輯拼圖', maxLevel: 4 },
  css: { name: 'CSS Designer 樣式調校大師', maxLevel: 4 },
  'bug-hunter': { name: 'Bug Hunter 除錯特工隊', maxLevel: 4 },
  'quiz-rush': { name: 'Quiz Rush 證照競速快問快答', maxLevel: 5 },
  'web-builder': { name: 'Web Builder 網頁架構拼裝', maxLevel: 4 },
};

/**
 * 依教師與班級建構存儲 Key（具備隔離性）
 */
function buildStorageKey(classroomId: string, teacherId?: string): string {
  if (teacherId) {
    return `${STORAGE_PREFIX}${teacherId}:${classroomId}`;
  }
  return `${STORAGE_PREFIX}${classroomId}`;
}

/**
 * 檢查是否具備指派作業之教師權限
 */
export function hasTeacherAssignmentPermission(userRole?: string, applicationStatus?: string): boolean {
  if (!userRole) return false;
  const upperRole = userRole.toUpperCase();
  if (upperRole === 'ADMIN' || upperRole === 'PLATFORM_ADMIN') return true;
  if (upperRole === 'TEACHER') {
    return applicationStatus === undefined || applicationStatus === 'APPROVED';
  }
  return false;
}

/**
 * 取得指定班級指派的所有遊戲作業（具備新舊格式雙向相容）
 */
export function getAssignedGameTasks(classroomId: string, teacherId?: string): TeacherGameTask[] {
  if (!classroomId || typeof window === 'undefined') return [];
  try {
    const primaryKey = buildStorageKey(classroomId, teacherId);
    let raw = window.localStorage.getItem(primaryKey);

    // 舊版資料相容 Fallback：若指定 teacherId 之 Key 為空，嘗試讀取無 teacherId 的舊版 Key
    if (!raw && teacherId) {
      const legacyKey = `${STORAGE_PREFIX}${classroomId}`;
      raw = window.localStorage.getItem(legacyKey);
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((t) => t && typeof t === 'object' && typeof t.id === 'string' && t.isActive !== false)
      .map((t) => ({
        id: String(t.id),
        teacherId: t.teacherId ? String(t.teacherId) : teacherId,
        classroomId: String(t.classroomId || classroomId),
        gameType: (GAME_TYPE_METADATA[t.gameType as GameTypeKey] ? t.gameType : 'puzzle') as GameTypeKey,
        gameTitle: t.gameTitle || GAME_TYPE_METADATA[(t.gameType as GameTypeKey) || 'puzzle']?.name || '遊戲作業',
        levelId: Math.max(1, Math.min(5, Number(t.levelId) || 1)),
        targetStars: Math.max(1, Math.min(3, Number(t.targetStars) || 2)),
        assignedAt: t.assignedAt || new Date().toISOString(),
        dueDate: t.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        description: typeof t.description === 'string' ? t.description : '',
        isActive: t.isActive !== false,
        updatedAt: t.updatedAt,
      }));
  } catch (err) {
    console.warn(`[GameTaskManager] 讀取班級 ${classroomId} 遊戲任務失敗，回退空陣列:`, err);
    return [];
  }
}

/**
 * 指派新遊戲作業
 */
export function assignGameTask(
  classroomId: string,
  params: {
    gameType: GameTypeKey;
    levelId: number;
    targetStars?: number;
    dueDate?: string;
    description?: string;
    teacherId?: string;
  }
): TeacherGameTask {
  if (!classroomId) throw new Error('缺少必要之 classroomId');
  const meta = GAME_TYPE_METADATA[params.gameType] || { name: '未知遊戲', maxLevel: 4 };
  const safeLevel = Math.max(1, Math.min(meta.maxLevel, Number(params.levelId) || 1));
  const safeStars = Math.max(1, Math.min(3, Number(params.targetStars) || 2));

  const newTask: TeacherGameTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    teacherId: params.teacherId,
    classroomId,
    gameType: params.gameType,
    gameTitle: meta.name,
    levelId: safeLevel,
    targetStars: safeStars,
    assignedAt: new Date().toISOString(),
    dueDate: params.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: params.description || '',
    isActive: true,
  };

  const current = getAssignedGameTasks(classroomId, params.teacherId);
  const updated = [newTask, ...current];
  const storageKey = buildStorageKey(classroomId, params.teacherId);

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
  } catch (err) {
    console.error('[GameTaskManager] 儲存指派任務失敗:', err);
  }
  return newTask;
}

/**
 * 修改既有遊戲作業
 */
export function updateGameTask(
  classroomId: string,
  taskId: string,
  updates: {
    levelId?: number;
    targetStars?: number;
    dueDate?: string;
    description?: string;
  },
  teacherId?: string
): TeacherGameTask | null {
  if (!classroomId || !taskId || typeof window === 'undefined') return null;
  const current = getAssignedGameTasks(classroomId, teacherId);
  const index = current.findIndex((t) => t.id === taskId);
  if (index === -1) return null;

  const target = current[index];
  const meta = GAME_TYPE_METADATA[target.gameType] || { name: '未知遊戲', maxLevel: 4 };

  const updatedTask: TeacherGameTask = {
    ...target,
    levelId: updates.levelId !== undefined ? Math.max(1, Math.min(meta.maxLevel, Number(updates.levelId) || 1)) : target.levelId,
    targetStars: updates.targetStars !== undefined ? Math.max(1, Math.min(3, Number(updates.targetStars) || 1)) : target.targetStars,
    dueDate: updates.dueDate || target.dueDate,
    description: updates.description !== undefined ? updates.description : target.description,
    updatedAt: new Date().toISOString(),
  };

  current[index] = updatedTask;
  const storageKey = buildStorageKey(classroomId, teacherId);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(current));
    return updatedTask;
  } catch (err) {
    console.error('[GameTaskManager] 更新指派任務失敗:', err);
    return null;
  }
}

/**
 * 撤銷 / 刪除遊戲作業
 */
export function revokeGameTask(classroomId: string, taskId: string, teacherId?: string): boolean {
  if (!classroomId || !taskId || typeof window === 'undefined') return false;
  try {
    const current = getAssignedGameTasks(classroomId, teacherId);
    const updated = current.filter((t) => t.id !== taskId);
    const storageKey = buildStorageKey(classroomId, teacherId);
    window.localStorage.setItem(storageKey, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('[GameTaskManager] 撤銷任務失敗:', err);
    return false;
  }
}
