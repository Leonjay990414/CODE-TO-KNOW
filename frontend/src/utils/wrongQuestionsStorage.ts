/**
 * CODE TO KNOW (碼上學) - 學科本機錯題本與個人化複習管理模組 (LocalStorage)
 * 遵循 schemaVersion 控制、多來源去重、掌握度狀態機 (尚未掌握 / 複習中 / 已掌握) 與容錯安全設計
 */

export type MasteryStatus = 'unmastered' | 'reviewing' | 'mastered';

export type WrongQuestionSource = 'theory_practice' | 'mock_exam' | 'manual_review' | 'quiz_rush' | 'game_challenge';

export interface WrongQuestionItem {
  questionId: string;
  certificationId: string;
  officialSection?: '01' | '02' | '03' | '04';
  officialNumber?: number;
  officialPage?: number;
  chapterId?: number;
  topic: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userSelectedAnswer: string; // e.g. 'B', '未作答'
  correctAnswer: string;
  explanation: string;
  wrongCount: number;
  consecutiveCorrect: number; // 連續答對次數 (門檻：2 次判定為已掌握)
  masteryStatus: MasteryStatus; // 'unmastered' | 'reviewing' | 'mastered'
  source?: WrongQuestionSource;
  firstFailedAt: string;
  lastAttemptAt: string;
  resolved: boolean; // 相容舊版欄位 (masteryStatus === 'mastered')
}

export interface WrongQuestionsCollection {
  schemaVersion: number;
  userId: string;
  items: Record<string, WrongQuestionItem>;
  updatedAt: string;
}

export interface WrongQuestionsStats {
  totalRecorded: number;
  unresolvedCount: number; // 尚未掌握 + 複習中
  resolvedCount: number;   // 已掌握
  unmasteredCount: number;
  reviewingCount: number;
  masteredCount: number;
  bySection: Record<string, { total: number; unresolved: number; mastered: number }>;
}

const STORAGE_PREFIX = 'ctk_wrong_questions';
const CURRENT_SCHEMA_VERSION = 2;

// 掌握標準：連續答對 2 次判定為已掌握
export const MASTERY_CONSECUTIVE_THRESHOLD = 2;

export function getWrongQuestionsStorageKey(userId: string): string {
  const safeUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  return `${STORAGE_PREFIX}:${safeUserId}`;
}

/**
 * 讀取錯題本全部資料 (具備 Schema 升級與欄位缺少容錯)
 */
export function getWrongQuestionsCollection(userId: string): WrongQuestionsCollection {
  const key = getWrongQuestionsStorageKey(userId);
  const effectiveUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  const defaultCollection: WrongQuestionsCollection = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    userId: effectiveUserId,
    items: {},
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultCollection;
    }

    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultCollection;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.items) {
      return defaultCollection;
    }

    // 容錯補齊缺少的欄位
    const sanitizedItems: Record<string, WrongQuestionItem> = {};
    Object.keys(parsed.items).forEach((qId) => {
      const it = parsed.items[qId];
      if (!it || typeof it !== 'object' || !it.questionId) return;

      const consecutive = typeof it.consecutiveCorrect === 'number' ? it.consecutiveCorrect : (it.resolved ? 2 : 0);
      let status: MasteryStatus = it.masteryStatus;
      if (!status) {
        if (it.resolved || consecutive >= MASTERY_CONSECUTIVE_THRESHOLD) {
          status = 'mastered';
        } else if (consecutive === 1) {
          status = 'reviewing';
        } else {
          status = 'unmastered';
        }
      }

      sanitizedItems[qId] = {
        questionId: it.questionId,
        certificationId: it.certificationId || 'web-design-c',
        officialSection: it.officialSection || (it.chapterId ? `0${it.chapterId}`.slice(-2) as '01' | '02' | '03' | '04' : '01'),
        officialNumber: typeof it.officialNumber === 'number' ? it.officialNumber : 1,
        officialPage: typeof it.officialPage === 'number' ? it.officialPage : 1,
        chapterId: it.chapterId || 1,
        topic: it.topic || '網頁設計丙級學科',
        question: it.question || '',
        options: it.options || { A: '', B: '', C: '', D: '' },
        userSelectedAnswer: it.userSelectedAnswer || '未作答',
        correctAnswer: it.correctAnswer || 'A',
        explanation: it.explanation || '',
        wrongCount: typeof it.wrongCount === 'number' ? it.wrongCount : 1,
        consecutiveCorrect: consecutive,
        masteryStatus: status,
        source: it.source || 'theory_practice',
        firstFailedAt: typeof it.firstFailedAt === 'string' ? it.firstFailedAt : new Date().toISOString(),
        lastAttemptAt: typeof it.lastAttemptAt === 'string' ? it.lastAttemptAt : new Date().toISOString(),
        resolved: status === 'mastered',
      };
    });

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      userId: parsed.userId || effectiveUserId,
      items: sanitizedItems,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`[WrongQuestions] 讀取本機錯題本失敗 (${key})，使用乾淨狀態:`, err);
    return defaultCollection;
  }
}

/**
 * 儲存錯題本
 */
export function saveWrongQuestionsCollection(collection: WrongQuestionsCollection): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const key = getWrongQuestionsStorageKey(collection.userId);
    const dataToSave: WrongQuestionsCollection = {
      ...collection,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(key, JSON.stringify(dataToSave));
    return true;
  } catch (err) {
    console.warn('[WrongQuestions] 寫入 LocalStorage 失敗:', err);
    return false;
  }
}

/**
 * 記錄一筆答錯之題目
 * 規則：
 * 1. 若題目已在錯題本中，wrongCount 累加 (+1)，consecutiveCorrect 重設為 0，masteryStatus 設為 'unmastered'，resolved=false。
 * 2. 若為新題，wrongCount=1，consecutiveCorrect=0，masteryStatus='unmastered'。
 * 3. 跨來源去重（依據 questionId）。
 */
export function recordWrongAttempt(
  userId: string,
  data: {
    questionId: string;
    certificationId?: string;
    officialSection?: '01' | '02' | '03' | '04';
    officialNumber?: number;
    officialPage?: number;
    chapterId?: number;
    topic: string;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    userSelectedAnswer: string;
    correctAnswer: string;
    explanation: string;
    source?: WrongQuestionSource;
  }
): WrongQuestionItem {
  const collection = getWrongQuestionsCollection(userId);
  const now = new Date().toISOString();
  const existing = collection.items[data.questionId];

  const updatedItem: WrongQuestionItem = {
    questionId: data.questionId,
    certificationId: data.certificationId || 'web-design-c',
    officialSection: data.officialSection || (data.chapterId ? `0${data.chapterId}`.slice(-2) as '01' | '02' | '03' | '04' : '01'),
    officialNumber: data.officialNumber || existing?.officialNumber || 1,
    officialPage: data.officialPage || existing?.officialPage || 1,
    chapterId: data.chapterId || existing?.chapterId || 1,
    topic: data.topic,
    question: data.question,
    options: data.options,
    userSelectedAnswer: data.userSelectedAnswer,
    correctAnswer: data.correctAnswer,
    explanation: data.explanation,
    wrongCount: existing ? existing.wrongCount + 1 : 1,
    consecutiveCorrect: 0, // 答錯重置連續答對次數
    masteryStatus: 'unmastered',
    source: data.source || existing?.source || 'theory_practice',
    firstFailedAt: existing ? existing.firstFailedAt : now,
    lastAttemptAt: now,
    resolved: false,
  };

  collection.items[data.questionId] = updatedItem;
  saveWrongQuestionsCollection(collection);
  return updatedItem;
}

/**
 * 記錄答對一筆題目（複習或模擬考中答對）
 * 掌握度規則：
 * 1. 若題目不在錯題本中，代表從未答錯，不加入錯題本（回傳 false）。
 * 2. 若在錯題本中，consecutiveCorrect 累加 (+1)。
 * 3. 若 consecutiveCorrect >= 2，判定為 'mastered' (已掌握，resolved=true)。
 * 4. 若 consecutiveCorrect === 1，判定為 'reviewing' (複習中，resolved=false)。
 */
export function recordCorrectAttempt(userId: string, questionId: string): boolean {
  const collection = getWrongQuestionsCollection(userId);
  const existing = collection.items[questionId];

  if (!existing) {
    return false; // 從未答錯的題目不需記錄
  }

  const newConsecutive = (existing.consecutiveCorrect || 0) + 1;
  const isMastered = newConsecutive >= MASTERY_CONSECUTIVE_THRESHOLD;

  existing.consecutiveCorrect = newConsecutive;
  existing.masteryStatus = isMastered ? 'mastered' : 'reviewing';
  existing.resolved = isMastered;
  existing.lastAttemptAt = new Date().toISOString();

  saveWrongQuestionsCollection(collection);
  return true;
}

/**
 * 取得待複習或全部錯題清單
 * 相容舊呼叫：`getWrongQuestionsList(userId, true)`
 * 支援進階篩選與排序
 */
export function getWrongQuestionsList(
  userId: string,
  filterOrOptions?: boolean | {
    status?: 'all' | 'unresolved' | 'unmastered' | 'reviewing' | 'mastered';
    section?: string;
    sortBy?: 'lastAttemptAt' | 'wrongCount' | 'officialNumber';
    sortOrder?: 'asc' | 'desc';
  }
): WrongQuestionItem[] {
  const collection = getWrongQuestionsCollection(userId);
  let list = Object.values(collection.items);

  // 判斷是否為舊版 boolean 參數
  if (typeof filterOrOptions === 'boolean') {
    if (filterOrOptions) {
      list = list.filter((item) => item.masteryStatus !== 'mastered');
    }
    return list.sort((a, b) => new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime());
  }

  const options = filterOrOptions || {};
  const statusFilter = options.status || 'unresolved';
  const sectionFilter = options.section || 'all';
  const sortBy = options.sortBy || 'lastAttemptAt';
  const sortOrder = options.sortOrder || 'desc';

  // 1. 掌握度篩選
  if (statusFilter === 'unresolved') {
    list = list.filter((item) => item.masteryStatus !== 'mastered');
  } else if (statusFilter === 'unmastered') {
    list = list.filter((item) => item.masteryStatus === 'unmastered');
  } else if (statusFilter === 'reviewing') {
    list = list.filter((item) => item.masteryStatus === 'reviewing');
  } else if (statusFilter === 'mastered') {
    list = list.filter((item) => item.masteryStatus === 'mastered');
  }

  // 2. 工作項目分類篩選
  if (sectionFilter !== 'all') {
    list = list.filter((item) => item.officialSection === sectionFilter);
  }

  // 3. 排序
  list.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'wrongCount') {
      comp = b.wrongCount - a.wrongCount;
    } else if (sortBy === 'officialNumber') {
      comp = (a.officialNumber || 0) - (b.officialNumber || 0);
    } else {
      comp = new Date(b.lastAttemptAt).getTime() - new Date(a.lastAttemptAt).getTime();
    }
    return sortOrder === 'asc' ? -comp : comp;
  });

  return list;
}

/**
 * 抽取指定數量之錯題進行隨機複習練習
 */
export function drawReviewQuestions(
  userId: string,
  count: number = 10,
  filterSection: string = 'all',
  onlyUnmastered: boolean = false
): WrongQuestionItem[] {
  const items = getWrongQuestionsList(userId, {
    status: onlyUnmastered ? 'unmastered' : 'unresolved',
    section: filterSection,
  });

  if (items.length === 0) return [];

  // Fisher-Yates 隨機洗牌
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy.slice(0, count);
}

/**
 * 移除單一題目紀錄
 */
export function removeWrongQuestion(userId: string, questionId: string): boolean {
  const collection = getWrongQuestionsCollection(userId);
  if (collection.items[questionId]) {
    delete collection.items[questionId];
    saveWrongQuestionsCollection(collection);
    return true;
  }
  return false;
}

/**
 * 清空該使用者的全部錯題紀錄
 */
export function clearAllWrongQuestions(userId: string): void {
  const key = getWrongQuestionsStorageKey(userId);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn('[WrongQuestions] 清除 LocalStorage 失敗:', err);
  }
}

/**
 * 統計錯題摘要與四大工作項目弱點落點
 */
export function getWrongQuestionsStats(userId: string): WrongQuestionsStats {
  const collection = getWrongQuestionsCollection(userId);
  const all = Object.values(collection.items);

  let unmasteredCount = 0;
  let reviewingCount = 0;
  let masteredCount = 0;

  const bySection: Record<string, { total: number; unresolved: number; mastered: number }> = {
    '01': { total: 0, unresolved: 0, mastered: 0 },
    '02': { total: 0, unresolved: 0, mastered: 0 },
    '03': { total: 0, unresolved: 0, mastered: 0 },
    '04': { total: 0, unresolved: 0, mastered: 0 },
  };

  all.forEach((item) => {
    const sec = item.officialSection || '01';
    if (!bySection[sec]) {
      bySection[sec] = { total: 0, unresolved: 0, mastered: 0 };
    }

    bySection[sec].total += 1;

    if (item.masteryStatus === 'mastered') {
      masteredCount += 1;
      bySection[sec].mastered += 1;
    } else if (item.masteryStatus === 'reviewing') {
      reviewingCount += 1;
      bySection[sec].unresolved += 1;
    } else {
      unmasteredCount += 1;
      bySection[sec].unresolved += 1;
    }
  });

  return {
    totalRecorded: all.length,
    unresolvedCount: unmasteredCount + reviewingCount,
    resolvedCount: masteredCount,
    unmasteredCount,
    reviewingCount,
    masteredCount,
    bySection,
  };
}

/**
 * P11-AIS-007: 錯題弱點深度診斷報告 (Weakness Diagnostic Report)
 */
export interface WeaknessDiagnosticReport {
  userId: string;
  totalWrongQuestions: number;
  unmasteredCount: number;
  reviewingCount: number;
  masteredCount: number;
  masteryPercentage: number;
  overallGrade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  weakestSection: {
    sectionId: '01' | '02' | '03' | '04';
    sectionName: string;
    unmasteredCount: number;
    recommendedActionZh: string;
  } | null;
  sectionBreakdown: Record<string, {
    total: number;
    unmastered: number;
    mastered: number;
    masteryRate: number;
  }>;
  generatedAt: string;
}

const SECTION_TITLE_MAP: Record<string, string> = {
  '01': '工作項目 01：電腦與網路通訊基礎',
  '02': '工作項目 02：網頁語法 HTML 與語意地標',
  '03': '工作項目 03：CSS 樣式設計與盒模型排版',
  '04': '工作項目 04：網頁應用技術與考場除錯實務',
};

const SECTION_REMEDY_MAP: Record<string, string> = {
  '01': '建議加強記憶電腦硬體規範、色彩三原色與通訊協定，搭配 Quiz Rush 快答強化反應。',
  '02': '建議複習 HTML5 語意地標階層結構，透過 Code Puzzle 重新熟悉語法積木。',
  '03': '建議重點攻克 Flexbox 與盒模型邊界計算，使用 CSS Designer 滑桿進行實時比對。',
  '04': '建議著重排查未閉合標籤與非法 CSS 屬性陷阱，進入 Bug Hunter 進行特訓。',
};

export function getWeaknessDiagnosticReport(userId: string): WeaknessDiagnosticReport {
  const stats = getWrongQuestionsStats(userId);
  const total = stats.totalRecorded;
  const mastered = stats.masteredCount;
  const unmastered = stats.unmasteredCount;
  const reviewing = stats.reviewingCount;

  const masteryPercentage = total > 0 ? Math.round((mastered / total) * 100) : 100;

  let overallGrade: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'EXCELLENT';
  if (total === 0 || masteryPercentage >= 85) {
    overallGrade = 'EXCELLENT';
  } else if (masteryPercentage >= 70) {
    overallGrade = 'GOOD';
  } else if (masteryPercentage >= 50) {
    overallGrade = 'NEEDS_IMPROVEMENT';
  } else {
    overallGrade = 'CRITICAL';
  }

  const sectionBreakdown: Record<string, {
    total: number;
    unmastered: number;
    mastered: number;
    masteryRate: number;
  }> = {};

  let weakestSecId: '01' | '02' | '03' | '04' | null = null;
  let maxUnmastered = 0;

  (['01', '02', '03', '04'] as const).forEach((sec) => {
    const data = stats.bySection[sec] || { total: 0, unresolved: 0, mastered: 0 };
    const secTotal = data.total;
    const secMastered = data.mastered;
    const secUnresolved = data.unresolved;
    const rate = secTotal > 0 ? Math.round((secMastered / secTotal) * 100) : 100;

    sectionBreakdown[sec] = {
      total: secTotal,
      unmastered: secUnresolved,
      mastered: secMastered,
      masteryRate: rate,
    };

    if (secUnresolved > maxUnmastered) {
      maxUnmastered = secUnresolved;
      weakestSecId = sec;
    }
  });

  const weakestSection = weakestSecId
    ? {
        sectionId: weakestSecId,
        sectionName: SECTION_TITLE_MAP[weakestSecId] || `單元 ${weakestSecId}`,
        unmasteredCount: maxUnmastered,
        recommendedActionZh: SECTION_REMEDY_MAP[weakestSecId] || '加強該單元之核心概念複習。',
      }
    : null;

  return {
    userId,
    totalWrongQuestions: total,
    unmasteredCount: unmastered,
    reviewingCount: reviewing,
    masteredCount: mastered,
    masteryPercentage,
    overallGrade,
    weakestSection,
    sectionBreakdown,
    generatedAt: new Date().toISOString(),
  };
}

