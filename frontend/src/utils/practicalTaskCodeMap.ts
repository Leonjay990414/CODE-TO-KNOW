/**
 * CODE TO KNOW (碼上學) - 官方術科題組代碼對照與規範模組
 * 解決 ISS-INC-003：題號 1~5 與檢定代碼 104301~104305 / 17300-10430x 碎片化問題
 * 提供唯一可信的集中式對照表、安全轉換函式、非官方題組過濾器及本機儲存鍵值相容轉接器。
 */

export type OfficialPracticalTaskNumber = 1 | 2 | 3 | 4 | 5;
export type OfficialPracticalExamCode = '104301' | '104302' | '104303' | '104304' | '104305';

export interface OfficialTaskMeta {
  taskNumber: OfficialPracticalTaskNumber;
  examCode: OfficialPracticalExamCode;
  fullExamCode: string; // 例如 "17300-104301"
  slug: string; // 例如 "task-1" 或 "104301"
  title: string;
  category: string;
  recommendedTimeMinutes: number;
  officialYear: string;
  isOfficial: true;
}

export const OFFICIAL_PRACTICAL_TASKS: Record<OfficialPracticalTaskNumber, OfficialTaskMeta> = {
  1: {
    taskNumber: 1,
    examCode: '104301',
    fullExamCode: '17300-104301',
    slug: 'task-1',
    title: '校園社團介紹網',
    category: '網頁設計丙級術科',
    recommendedTimeMinutes: 120,
    officialYear: '112/113/114 官方現行規範',
    isOfficial: true,
  },
  2: {
    taskNumber: 2,
    examCode: '104302',
    fullExamCode: '17300-104302',
    slug: 'task-2',
    title: '運動休閒廣場',
    category: '網頁設計丙級術科',
    recommendedTimeMinutes: 120,
    officialYear: '112/113/114 官方現行規範',
    isOfficial: true,
  },
  3: {
    taskNumber: 3,
    examCode: '104303',
    fullExamCode: '17300-104303',
    slug: 'task-3',
    title: '線上資訊展',
    category: '網頁設計丙級術科',
    recommendedTimeMinutes: 120,
    officialYear: '112/113/114 官方現行規範',
    isOfficial: true,
  },
  4: {
    taskNumber: 4,
    examCode: '104304',
    fullExamCode: '17300-104304',
    slug: 'task-4',
    title: '國家公園介紹',
    category: '網頁設計丙級術科',
    recommendedTimeMinutes: 120,
    officialYear: '112/113/114 官方現行規範',
    isOfficial: true,
  },
  5: {
    taskNumber: 5,
    examCode: '104305',
    fullExamCode: '17300-104305',
    slug: 'task-5',
    title: '樂活日照中心',
    category: '網頁設計丙級術科',
    recommendedTimeMinutes: 120,
    officialYear: '112/113/114 官方現行規範',
    isOfficial: true,
  },
};

/**
 * 非官方/展示型題組關鍵字清單（例如社群展示範例「台灣美食」不得誤計為正式檢定題組）
 */
const NON_OFFICIAL_KEYWORDS = ['台灣美食', 'taiwan food', 'demo-custom', 'custom-task'];

/**
 * 安全將各類輸入（數字 1~5、字串 "1"~"5"、"104301"~"104305"、"17300-104301"、"task-1"）轉換為標準題號 1~5
 */
export function toTaskNumber(input: number | string | null | undefined): OfficialPracticalTaskNumber | null {
  if (input === null || input === undefined) return null;

  if (typeof input === 'number') {
    if (input >= 1 && input <= 5 && Number.isInteger(input)) {
      return input as OfficialPracticalTaskNumber;
    }
    return null;
  }

  const str = String(input).trim().toLowerCase();

  // 直接數字字串 "1" ~ "5"
  if (/^[1-5]$/.test(str)) {
    return parseInt(str, 10) as OfficialPracticalTaskNumber;
  }

  // 檢定代碼 "104301" ~ "104305"
  const examMatch = str.match(/10430([1-5])/);
  if (examMatch) {
    return parseInt(examMatch[1], 10) as OfficialPracticalTaskNumber;
  }

  // slug 形式 "task-1" ~ "task-5", "task 1", "task1"
  const slugMatch = str.match(/^task[-\s]?([1-5])$/);
  if (slugMatch) {
    return parseInt(slugMatch[1], 10) as OfficialPracticalTaskNumber;
  }

  return null;
}

/**
 * 依題號取得官方檢定 6 碼代號（例如 1 -> "104301"）
 */
export function toExamCode(taskNumber: OfficialPracticalTaskNumber): OfficialPracticalExamCode {
  const meta = OFFICIAL_PRACTICAL_TASKS[taskNumber];
  return meta.examCode;
}

/**
 * 依題號取得官方全碼（例如 1 -> "17300-104301"）
 */
export function toFullCode(taskNumber: OfficialPracticalTaskNumber): string {
  const meta = OFFICIAL_PRACTICAL_TASKS[taskNumber];
  return meta.fullExamCode;
}

/**
 * 取得官方題組完整元資料
 */
export function getOfficialTaskMeta(idOrCode: number | string | null | undefined): OfficialTaskMeta | null {
  const taskNumber = toTaskNumber(idOrCode);
  if (!taskNumber) return null;
  return OFFICIAL_PRACTICAL_TASKS[taskNumber];
}

/**
 * 驗證是否為官方認可的 5 大題組之一
 */
export function isOfficialPracticalTask(id: unknown): boolean {
  if (typeof id === 'number' || typeof id === 'string') {
    return toTaskNumber(id) !== null;
  }
  return false;
}

/**
 * 判定是否為非官方/展示型標題或代碼（如「台灣美食」）
 */
export function isNonOfficialTopic(titleOrCode: string | null | undefined): boolean {
  if (!titleOrCode) return false;
  const lower = String(titleOrCode).trim().toLowerCase();
  return NON_OFFICIAL_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * 產生與既有 learningStorage.ts 嚴格 100% 相容的標準儲存鍵值
 * 格式：ctk_practical_progress:{safeUserId}:{taskNumber}:{version}
 */
export function getCanonicalStorageKey(
  userId: string,
  taskId: number | string,
  version: 'A' | 'B'
): string {
  const taskNumber = toTaskNumber(taskId) ?? taskId;
  const safeUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  return `ctk_practical_progress:${safeUserId}:${taskNumber}:${version}`;
}

/**
 * 產生與既有 practicalSandboxEngine.ts 嚴格 100% 相容的沙盒工作區儲存鍵值
 * 格式：c2k_student_sandbox_workspace_{taskNumber}
 */
export function getCanonicalSandboxStorageKey(taskId: number | string): string {
  const taskNumber = toTaskNumber(taskId) ?? taskId;
  return `c2k_student_sandbox_workspace_${taskNumber}`;
}

