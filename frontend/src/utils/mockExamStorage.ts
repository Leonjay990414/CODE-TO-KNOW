/**
 * CODE TO KNOW (碼上學) - 勞動部 17300 網頁設計丙級 全真學科模擬測驗管理模組
 * 負責：隨機/分層抽題 (80 題)、倒數計時計算、作答暫存、本機考試歷程、成績結算與錯題本連動
 * 嚴格遵守：帳號隔離、毀損容錯、不侵入清空他人 LocalStorage、防重複累計
 */

import { ALL_OFFICIAL_THEORY_QUESTIONS, TheoryQuestionModel } from '../data/questionBankAdapter';
import { recordWrongAttempt, recordCorrectAttempt } from './wrongQuestionsStorage';

export interface SectionBreakdownItem {
  sectionId: string;
  sectionName: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface MockExamSession {
  schemaVersion: number;
  sessionId: string;
  userId: string;
  mode: 'official_100' | 'practice_60';
  strategy: 'stratified' | 'random';
  durationMinutes: number;
  startedAt: string; // ISO String
  expiresAt: string; // ISO String
  questions: TheoryQuestionModel[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  markedForReview: Record<string, boolean>;
  isSubmitted: boolean;
  submittedAt?: string;
  score?: number; // 0 - 100
  correctCount?: number;
  wrongCount?: number;
  unansweredCount?: number;
  isPassed?: boolean;
  sectionBreakdown?: Record<string, SectionBreakdownItem>;
  wrongSynced?: boolean;
}

const STORAGE_ACTIVE_PREFIX = 'ctk_mock_exam_active';
const STORAGE_HISTORY_PREFIX = 'ctk_mock_exam_history';
const CURRENT_SCHEMA_VERSION = 1;

export function getActiveMockExamKey(userId: string): string {
  const safeUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  return `${STORAGE_ACTIVE_PREFIX}:${safeUserId}`;
}

export function getMockExamHistoryKey(userId: string): string {
  const safeUserId = userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
  return `${STORAGE_HISTORY_PREFIX}:${safeUserId}`;
}

/**
 * Fisher-Yates 洗牌演算法（純函式，不修改來源陣列）
 */
function shuffleArray<T>(array: readonly T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * 依策略抽取 80 題不重複之官方試題
 * @param strategy 'stratified' (依 4 大工作項目比例 31/31/9/9 抽題) | 'random' (全庫隨機抽取 80 題)
 */
export function drawMockExamQuestions(strategy: 'stratified' | 'random' = 'stratified'): TheoryQuestionModel[] {
  const totalAvailable = ALL_OFFICIAL_THEORY_QUESTIONS.length;
  if (totalAvailable < 80) {
    throw new Error(`題庫總題數不足 80 題 (目前僅 ${totalAvailable} 題)，無法建立正式模擬測驗`);
  }

  if (strategy === 'random') {
    const shuffled = shuffleArray(ALL_OFFICIAL_THEORY_QUESTIONS);
    return shuffled.slice(0, 80);
  }

  // 分層抽題 (工作項目 01: 31題, 02: 31題, 03: 9題, 04: 9題 = 共 80 題)
  const sec01 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '01');
  const sec02 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '02');
  const sec03 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '03');
  const sec04 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '04');

  if (sec01.length < 31 || sec02.length < 31 || sec03.length < 9 || sec04.length < 9) {
    // 若特定章節題數異常，降級為安全全庫隨機
    return shuffleArray(ALL_OFFICIAL_THEORY_QUESTIONS).slice(0, 80);
  }

  const picked01 = shuffleArray(sec01).slice(0, 31);
  const picked02 = shuffleArray(sec02).slice(0, 31);
  const picked03 = shuffleArray(sec03).slice(0, 9);
  const picked04 = shuffleArray(sec04).slice(0, 9);

  // 合併後再次打散順序，符合全真考場隨機出題體驗
  const combined = [...picked01, ...picked02, ...picked03, ...picked04];
  return shuffleArray(combined);
}

/**
 * 計算剩餘秒數（依伺服器/本機真實時間差計算，不受元件重複渲染影響）
 */
export function calculateRemainingSeconds(session: MockExamSession): number {
  if (session.isSubmitted) return 0;
  const expiresMs = new Date(session.expiresAt).getTime();
  const nowMs = Date.now();
  const diffSecs = Math.floor((expiresMs - nowMs) / 1000);
  return Math.max(0, diffSecs);
}

/**
 * 建立全新模擬測驗 Session
 */
export function createMockExamSession(
  userId: string,
  mode: 'official_100' | 'practice_60' = 'official_100',
  strategy: 'stratified' | 'random' = 'stratified'
): MockExamSession {
  const durationMinutes = mode === 'official_100' ? 100 : 60;
  const now = new Date();
  const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);
  const questions = drawMockExamQuestions(strategy);

  const session: MockExamSession = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    sessionId: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    userId: userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous',
    mode,
    strategy,
    durationMinutes,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    questions,
    answers: {},
    markedForReview: {},
    isSubmitted: false,
  };

  saveActiveMockExam(session);
  return session;
}

/**
 * 讀取目前正在進行或最新完成的 MockExamSession
 */
export function getActiveMockExam(userId: string): MockExamSession | null {
  const key = getActiveMockExamKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MockExamSession;
    if (!parsed || !parsed.sessionId || !Array.isArray(parsed.questions)) {
      return null;
    }

    // 若未提交且時間已逾時，自動在讀取時結算
    if (!parsed.isSubmitted && calculateRemainingSeconds(parsed) <= 0) {
      return evaluateMockExam(parsed);
    }

    return parsed;
  } catch (err) {
    console.warn(`[MockExam] 讀取進行中測驗失敗 (${key}):`, err);
    return null;
  }
}

/**
 * 儲存目前正在進行中的 MockExamSession
 */
export function saveActiveMockExam(session: MockExamSession): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const key = getActiveMockExamKey(session.userId);
    window.localStorage.setItem(key, JSON.stringify(session));
    return true;
  } catch (err) {
    console.warn('[MockExam] 寫入進行中測驗失敗:', err);
    return false;
  }
}

/**
 * 清除目前進行中之暫存（例如考完點選離開回到儀表板）
 */
export function clearActiveMockExam(userId: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const key = getActiveMockExamKey(userId);
    window.localStorage.removeItem(key);
  } catch (err) {
    console.warn('[MockExam] 清除進行中暫存失敗:', err);
  }
}

/**
 * 結算成績與評分邏輯
 * 80 題單選，每題 1.25 分，滿分 100 分，及格標準 60.00 分
 */
export function evaluateMockExam(session: MockExamSession): MockExamSession {
  if (session.isSubmitted && session.score !== undefined) {
    return session; // 已結算過，直接回傳，防止重複計分
  }

  const questions = session.questions;
  const answers = session.answers;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const sectionStats: Record<string, { name: string; total: number; correct: number }> = {
    '01': { name: '工作項目 01：作業準備', total: 0, correct: 0 },
    '02': { name: '工作項目 02：應用軟體安裝及使用', total: 0, correct: 0 },
    '03': { name: '工作項目 03：系統軟體安裝及使用', total: 0, correct: 0 },
    '04': { name: '工作項目 04：資訊及安全', total: 0, correct: 0 },
  };

  questions.forEach((q) => {
    const sec = q.officialSection;
    if (sectionStats[sec]) {
      sectionStats[sec].total += 1;
    }

    const userAns = answers[q.id];
    if (!userAns) {
      unansweredCount += 1;
    } else if (userAns === q.correctAnswer) {
      correctCount += 1;
      if (sectionStats[sec]) {
        sectionStats[sec].correct += 1;
      }
    } else {
      wrongCount += 1;
    }
  });

  // 80 題，每題 1.25 分
  const score = Math.round(correctCount * 1.25 * 100) / 100;
  const isPassed = score >= 60;

  const sectionBreakdown: Record<string, SectionBreakdownItem> = {};
  Object.keys(sectionStats).forEach((key) => {
    const st = sectionStats[key];
    sectionBreakdown[key] = {
      sectionId: key,
      sectionName: st.name,
      total: st.total,
      correct: st.correct,
      percentage: st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0,
    };
  });

  const updatedSession: MockExamSession = {
    ...session,
    isSubmitted: true,
    submittedAt: new Date().toISOString(),
    score,
    correctCount,
    wrongCount,
    unansweredCount,
    isPassed,
    sectionBreakdown,
  };

  saveActiveMockExam(updatedSession);
  saveMockExamToHistory(updatedSession);

  return updatedSession;
}

/**
 * 讀取本機測驗歷史紀錄
 */
export function getMockExamHistory(userId: string): MockExamSession[] {
  const key = getMockExamHistoryKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[MockExam] 讀取測驗歷史紀錄失敗:', err);
    return [];
  }
}

/**
 * 寫入測驗歷史紀錄（最多保留最近 20 場）
 */
export function saveMockExamToHistory(session: MockExamSession): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const key = getMockExamHistoryKey(session.userId);
    const existing = getMockExamHistory(session.userId);

    // 依 sessionId 去重，避免重複寫入
    const filtered = existing.filter((item) => item.sessionId !== session.sessionId);
    const newList = [session, ...filtered].slice(0, 20);

    window.localStorage.setItem(key, JSON.stringify(newList));
  } catch (err) {
    console.warn('[MockExam] 儲存測驗歷史紀錄失敗:', err);
  }
}

/**
 * 考後同步錯題至錯題本 (wrongQuestionsStorage)
 * 防重複機制：單場測驗只同步一次 (wrongSynced 旗標)
 */
export function syncMockExamWrongQuestions(userId: string, session: MockExamSession): number {
  if (!session.isSubmitted || session.wrongSynced) {
    return 0; // 避免重複增加錯誤計數
  }

  let newlySyncedCount = 0;
  const questions = session.questions;
  const answers = session.answers;

  questions.forEach((q) => {
    const userAns = answers[q.id];
    // 使用者有作答且答錯，或者未作答，皆視為需要複習之錯題
    if (!userAns || userAns !== q.correctAnswer) {
      const optMap = {
        A: q.options.find((o) => o.key === 'A')?.text || '',
        B: q.options.find((o) => o.key === 'B')?.text || '',
        C: q.options.find((o) => o.key === 'C')?.text || '',
        D: q.options.find((o) => o.key === 'D')?.text || '',
      };

      recordWrongAttempt(userId, {
        questionId: q.id,
        certificationId: 'web-design-c',
        officialSection: q.officialSection,
        officialNumber: q.officialNumber,
        officialPage: q.officialPage,
        chapterId: parseInt(q.officialSection, 10),
        topic: q.sectionName,
        question: q.question,
        options: optMap,
        userSelectedAnswer: userAns || '未作答',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        source: 'mock_exam',
      });
      newlySyncedCount += 1;
    } else if (userAns === q.correctAnswer) {
      // 若曾答錯但在模擬考答對，增加連續答對並判定是否掌握
      recordCorrectAttempt(userId, q.id);
    }
  });

  // 更新 session 狀態為已同步
  session.wrongSynced = true;
  saveActiveMockExam(session);
  return newlySyncedCount;
}
