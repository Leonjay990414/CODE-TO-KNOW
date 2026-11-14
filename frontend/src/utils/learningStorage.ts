/**
 * CODE TO KNOW (碼上學) - 術科學習進度本機儲存管理模組 (LocalStorage)
 * 嚴格遵循 schemaVersion 控制、安全 try/catch、無效 JSON 容錯，以及 Version A / B 隔離
 */

export interface PracticalTaskProgress {
  schemaVersion: number;
  userId: string;
  taskId: number;
  version: 'A' | 'B';
  completedSteps: number[];
  completedChecklist: string[];
  lastStudiedAt: string;
  notes?: string;
}

const STORAGE_PREFIX = 'ctk_practical_progress';
const CURRENT_SCHEMA_VERSION = 1;

/**
 * 產生儲存鍵值：ctk_practical_progress:{userId}:{taskId}:{version}
 */
export function getStorageKey(userId: string, taskId: number, version: 'A' | 'B'): string {
  const safeUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  return `${STORAGE_PREFIX}:${safeUserId}:${taskId}:${version}`;
}

/**
 * 讀取特定題組與版本之學習進度（若不存在或損壞則返回乾淨初始值）
 */
export function getPracticalProgress(
  userId: string,
  taskId: number,
  version: 'A' | 'B'
): PracticalTaskProgress {
  const key = getStorageKey(userId, taskId, version);
  const effectiveUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  const defaultProgress: PracticalTaskProgress = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    userId: effectiveUserId,
    taskId,
    version,
    completedSteps: [],
    completedChecklist: [],
    lastStudiedAt: new Date().toISOString(),
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultProgress;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return defaultProgress;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return defaultProgress;
    }

    // 檢查 schemaVersion 容錯遷移或重設
    return {
      schemaVersion: parsed.schemaVersion || CURRENT_SCHEMA_VERSION,
      userId: parsed.userId || effectiveUserId,
      taskId: typeof parsed.taskId === 'number' ? parsed.taskId : taskId,
      version: parsed.version === 'B' ? 'B' : 'A',
      completedSteps: Array.isArray(parsed.completedSteps)
        ? parsed.completedSteps.filter((n: unknown) => typeof n === 'number')
        : [],
      completedChecklist: Array.isArray(parsed.completedChecklist)
        ? parsed.completedChecklist.filter((s: unknown) => typeof s === 'string')
        : [],
      lastStudiedAt: typeof parsed.lastStudiedAt === 'string' ? parsed.lastStudiedAt : new Date().toISOString(),
      notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
    };
  } catch (err) {
    console.warn(`[LearningStorage] 無法讀取儲存紀錄 (${key})，使用初始狀態:`, err);
    return defaultProgress;
  }
}

/**
 * 寫入學習進度
 */
export function savePracticalProgress(progress: PracticalTaskProgress): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const key = getStorageKey(progress.userId, progress.taskId, progress.version);
    const dataToSave: PracticalTaskProgress = {
      ...progress,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      lastStudiedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(key, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.warn('[LearningStorage] 寫入 LocalStorage 失敗 (可能超過配額或被禁用):', err);
    return false;
  }
}

/**
 * 切換單一步驟之完成狀態
 */
export function toggleStepCompletion(
  userId: string,
  taskId: number,
  version: 'A' | 'B',
  stepNumber: number
): PracticalTaskProgress {
  const current = getPracticalProgress(userId, taskId, version);
  const exists = current.completedSteps.includes(stepNumber);
  const updatedSteps = exists
    ? current.completedSteps.filter((s) => s !== stepNumber)
    : [...current.completedSteps, stepNumber].sort((a, b) => a - b);

  const updated: PracticalTaskProgress = {
    ...current,
    completedSteps: updatedSteps,
  };

  savePracticalProgress(updated);
  return updated;
}

/**
 * 切換自我查核表項目之完成狀態
 */
export function toggleChecklistItem(
  userId: string,
  taskId: number,
  version: 'A' | 'B',
  itemText: string
): PracticalTaskProgress {
  const current = getPracticalProgress(userId, taskId, version);
  const exists = current.completedChecklist.includes(itemText);
  const updatedChecklist = exists
    ? current.completedChecklist.filter((t) => t !== itemText)
    : [...current.completedChecklist, itemText];

  const updated: PracticalTaskProgress = {
    ...current,
    completedChecklist: updatedChecklist,
  };

  savePracticalProgress(updated);
  return updated;
}

/**
 * 重設特定題組與版本之學習進度
 */
export function resetPracticalProgress(
  userId: string,
  taskId: number,
  version: 'A' | 'B'
): PracticalTaskProgress {
  const key = getStorageKey(userId, taskId, version);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[LearningStorage] 清除 LocalStorage 失敗:', err);
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    userId: userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous',
    taskId,
    version,
    completedSteps: [],
    completedChecklist: [],
    lastStudiedAt: new Date().toISOString(),
  };
}
