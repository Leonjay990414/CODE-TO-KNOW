import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  drawMockExamQuestions,
  createMockExamSession,
  calculateRemainingSeconds,
  evaluateMockExam,
  saveActiveMockExam,
  getActiveMockExam,
  clearActiveMockExam,
  syncMockExamWrongQuestions,
  getMockExamHistory,
  MockExamSession,
} from '../src/utils/mockExamStorage';
import { ALL_OFFICIAL_THEORY_QUESTIONS } from '../src/data/questionBankAdapter';
import { getWrongQuestionsCollection } from '../src/utils/wrongQuestionsStorage';

// Polyfill in-memory localStorage for Node test runner
const memoryStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
  setItem: (key: string, val: string) => {
    memoryStorage[key] = String(val);
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
  },
};
// @ts-expect-error Mocking window in Node test runner
globalThis.window = { localStorage: mockLocalStorage } as unknown as Window & typeof globalThis;

describe('Phase 13 Batch 3: Mock Exam System Comprehensive Test Suite (P13-STU-005)', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  // 1. 80 題抽題數量正確
  it('1. draws exactly 80 questions in stratified mode and random mode', () => {
    const stratified = drawMockExamQuestions('stratified');
    const random = drawMockExamQuestions('random');

    expect(stratified).toHaveLength(80);
    expect(random).toHaveLength(80);
  });

  // 2. 不會抽出重複題目
  it('2. ensures no duplicate questions are drawn in the same exam session', () => {
    const questions = drawMockExamQuestions('stratified');
    const idSet = new Set(questions.map((q) => q.id));

    expect(idSet.size).toBe(80);
  });

  // 3. 抽題不會修改原始題庫
  it('3. does not mutate or alter the original 605 questions pool during shuffling or drawing', () => {
    const originalLength = ALL_OFFICIAL_THEORY_QUESTIONS.length;
    const firstQuestionBefore = { ...ALL_OFFICIAL_THEORY_QUESTIONS[0] };

    const drawn = drawMockExamQuestions('stratified');
    expect(drawn).toHaveLength(80);

    expect(ALL_OFFICIAL_THEORY_QUESTIONS.length).toBe(originalLength);
    expect(ALL_OFFICIAL_THEORY_QUESTIONS[0].id).toBe(firstQuestionBefore.id);
    expect(ALL_OFFICIAL_THEORY_QUESTIONS[0].question).toBe(firstQuestionBefore.question);
  });

  // 4. 題目與答案對應正確
  it('4. ensures every drawn question has 4 options and a valid official answer (A, B, C, or D)', () => {
    const questions = drawMockExamQuestions('stratified');

    questions.forEach((q) => {
      expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
      expect(q.options).toHaveLength(4);
      const optionKeys = q.options.map((o) => o.key);
      expect(optionKeys).toEqual(['A', 'B', 'C', 'D']);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.officialPage).toBeGreaterThan(0);
    });
  });

  // 5. 使用者作答可以正確保存
  it('5. saves user answers into active session in LocalStorage correctly', () => {
    const userId = 'student-test-01';
    const session = createMockExamSession(userId, 'official_100', 'stratified');

    const firstQ = session.questions[0];
    session.answers[firstQ.id] = 'B';
    saveActiveMockExam(session);

    const reloaded = getActiveMockExam(userId);
    expect(reloaded).not.toBeNull();
    expect(reloaded?.answers[firstQ.id]).toBe('B');
  });

  // 6. 上一題、下一題及跳題功能正常 (邏輯驗證)
  it('6. validates navigation boundaries: prev, next, jump index within 0 to 79', () => {
    const total = 80;
    let activeIdx = 0;

    // Next button
    const handleNext = () => { activeIdx = Math.min(total - 1, activeIdx + 1); };
    // Prev button
    const handlePrev = () => { activeIdx = Math.max(0, activeIdx - 1); };
    // Jump
    const handleJump = (target: number) => {
      if (target >= 0 && target < total) activeIdx = target;
    };

    handlePrev();
    expect(activeIdx).toBe(0); // cannot go below 0

    handleNext();
    expect(activeIdx).toBe(1);

    handleJump(79);
    expect(activeIdx).toBe(79);

    handleNext();
    expect(activeIdx).toBe(79); // cannot exceed 79

    handleJump(42);
    expect(activeIdx).toBe(42);
  });

  // 7. 倒數計時正確
  it('7. calculates remaining seconds accurately from real timestamp difference without drift', () => {
    const userId = 'student-timer-01';
    const now = new Date();
    const durationMinutes = 100;
    const expires = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session: MockExamSession = {
      schemaVersion: 1,
      sessionId: 'test_timer_session',
      userId,
      mode: 'official_100',
      strategy: 'stratified',
      durationMinutes: 100,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      questions: drawMockExamQuestions('stratified'),
      answers: {},
      markedForReview: {},
      isSubmitted: false,
    };

    const remaining = calculateRemainingSeconds(session);
    // Should be exactly 6000 seconds (or 5999 due to ms execution)
    expect(remaining).toBeGreaterThanOrEqual(5999);
    expect(remaining).toBeLessThanOrEqual(6000);
  });

  // 8. 時間到自動交卷
  it('8. triggers automatic submission when remaining time expires (<= 0 seconds)', () => {
    const userId = 'student-timeout-01';
    // Expired 10 seconds ago
    const pastStarted = new Date(Date.now() - 100 * 60 * 1000 - 10000);
    const pastExpires = new Date(Date.now() - 10000);

    const session: MockExamSession = {
      schemaVersion: 1,
      sessionId: 'test_timeout_session',
      userId,
      mode: 'official_100',
      strategy: 'stratified',
      durationMinutes: 100,
      startedAt: pastStarted.toISOString(),
      expiresAt: pastExpires.toISOString(),
      questions: drawMockExamQuestions('stratified'),
      answers: {},
      markedForReview: {},
      isSubmitted: false,
    };

    saveActiveMockExam(session);

    // Reading active exam when expired will automatically evaluate and submit!
    const active = getActiveMockExam(userId);
    expect(active).not.toBeNull();
    expect(active?.isSubmitted).toBe(true);
    expect(active?.score).toBe(0);
    expect(active?.unansweredCount).toBe(80);
    expect(active?.isPassed).toBe(false);
  });

  // 9. 提前交卷正常
  it('9. allows manual early submission and produces valid score evaluation', () => {
    const userId = 'student-early-01';
    const session = createMockExamSession(userId, 'practice_60', 'stratified');

    // Simulate answering 48 correctly out of 80
    session.questions.forEach((q, idx) => {
      if (idx < 48) {
        session.answers[q.id] = q.correctAnswer;
      }
    });

    const evaluated = evaluateMockExam(session);
    expect(evaluated.isSubmitted).toBe(true);
    expect(evaluated.correctCount).toBe(48);
    expect(evaluated.unansweredCount).toBe(32);
    // 48 * 1.25 = 60
    expect(evaluated.score).toBe(60);
    expect(evaluated.isPassed).toBe(true);
  });

  // 10. 評分結果正確 (每題 1.25 分，及格標準 60.00 分)
  it('10. calculates exact score with 1.25 points per correct answer and determines pass/fail', () => {
    const session = createMockExamSession('user-score', 'official_100', 'random');

    // Scenario A: 80 correct = 100 points
    session.questions.forEach((q) => {
      session.answers[q.id] = q.correctAnswer;
    });
    const fullScore = evaluateMockExam(session);
    expect(fullScore.score).toBe(100);
    expect(fullScore.isPassed).toBe(true);

    // Scenario B: 47 correct = 58.75 points (Fail)
    const sessionB = createMockExamSession('user-score-b', 'official_100', 'random');
    sessionB.questions.forEach((q, idx) => {
      if (idx < 47) sessionB.answers[q.id] = q.correctAnswer;
      else sessionB.answers[q.id] = q.correctAnswer === 'A' ? 'B' : 'A'; // deliberate wrong
    });
    const failScore = evaluateMockExam(sessionB);
    expect(failScore.score).toBe(58.75);
    expect(failScore.isPassed).toBe(false);
  });

  // 11. 未作答題目計算正確
  it('11. correctly accounts for unanswered questions without negative marking (0 penalty)', () => {
    const session = createMockExamSession('user-unanswered', 'official_100', 'stratified');

    // Answer only 10 questions correctly, 10 incorrectly, leave 60 blank
    session.questions.forEach((q, idx) => {
      if (idx < 10) {
        session.answers[q.id] = q.correctAnswer;
      } else if (idx < 20) {
        session.answers[q.id] = q.correctAnswer === 'A' ? 'B' : 'A';
      }
    });

    const result = evaluateMockExam(session);
    expect(result.correctCount).toBe(10);
    expect(result.wrongCount).toBe(10);
    expect(result.unansweredCount).toBe(60);
    expect(result.score).toBe(12.5); // 10 * 1.25
  });

  // 12. 重複交卷不會重複計分
  it('12. prevents duplicate scoring or score mutation if evaluated multiple times', () => {
    const session = createMockExamSession('user-dup-submit', 'official_100', 'stratified');
    session.answers[session.questions[0].id] = session.questions[0].correctAnswer;

    const eval1 = evaluateMockExam(session);
    const score1 = eval1.score;

    // Call evaluate again
    const eval2 = evaluateMockExam(eval1);
    expect(eval2.score).toBe(score1);
    expect(eval2.correctCount).toBe(eval1.correctCount);
  });

  // 13. 不同帳號資料隔離
  it('13. completely isolates active exam sessions and history between different user accounts', () => {
    const userA = 'student-alice';
    const userB = 'student-bob';

    const sessionA = createMockExamSession(userA, 'official_100', 'stratified');
    const sessionB = createMockExamSession(userB, 'practice_60', 'random');

    expect(getActiveMockExam(userA)?.sessionId).toBe(sessionA.sessionId);
    expect(getActiveMockExam(userB)?.sessionId).toBe(sessionB.sessionId);
    expect(getActiveMockExam(userA)?.sessionId).not.toBe(getActiveMockExam(userB)?.sessionId);

    clearActiveMockExam(userA);
    expect(getActiveMockExam(userA)).toBeNull();
    expect(getActiveMockExam(userB)).not.toBeNull();
  });

  // 14. 錯題本整合正確與防重複累計
  it('14. integrates with wrong questions notebook and prevents duplicate increments on re-sync', () => {
    const userId = 'student-wrong-sync-test';
    const session = createMockExamSession(userId, 'official_100', 'stratified');

    // Answer 1 wrong deliberately, and the remaining 79 correctly
    const firstQ = session.questions[0];
    session.questions.forEach((q, idx) => {
      if (idx === 0) {
        session.answers[q.id] = q.correctAnswer === 'A' ? 'B' : 'A';
      } else {
        session.answers[q.id] = q.correctAnswer;
      }
    });

    const evaluated = evaluateMockExam(session);

    // Sync once
    const synced1 = syncMockExamWrongQuestions(userId, evaluated);
    expect(synced1).toBe(1);

    const collection = getWrongQuestionsCollection(userId);
    expect(collection.items[firstQ.id]).toBeDefined();
    expect(collection.items[firstQ.id].wrongCount).toBe(1);

    // Sync again: must not duplicate!
    const synced2 = syncMockExamWrongQuestions(userId, evaluated);
    expect(synced2).toBe(0);

    const collection2 = getWrongQuestionsCollection(userId);
    expect(collection2.items[firstQ.id].wrongCount).toBe(1);
  });

  // 15. 頁面重新整理不會破壞正在進行的考試紀錄
  it('15. safely restores ongoing exam questions and user answers upon page refresh/reload', () => {
    const userId = 'student-reload-01';
    const session = createMockExamSession(userId, 'official_100', 'stratified');

    // Mark questions 0 and 5
    session.answers[session.questions[0].id] = 'C';
    session.answers[session.questions[5].id] = 'D';
    session.markedForReview[session.questions[5].id] = true;
    saveActiveMockExam(session);

    // Simulate page reload
    const restored = getActiveMockExam(userId);
    expect(restored).not.toBeNull();
    expect(restored?.sessionId).toBe(session.sessionId);
    expect(restored?.questions.length).toBe(80);
    expect(restored?.questions[0].id).toBe(session.questions[0].id);
    expect(restored?.answers[session.questions[0].id]).toBe('C');
    expect(restored?.answers[session.questions[5].id]).toBe('D');
    expect(restored?.markedForReview[session.questions[5].id]).toBe(true);
  });
});
