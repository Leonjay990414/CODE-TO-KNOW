import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  recordWrongAttempt,
  recordCorrectAttempt,
  getWrongQuestionsList,
  getWrongQuestionsStats,
  removeWrongQuestion,
  clearAllWrongQuestions,
  drawReviewQuestions,
  getWrongQuestionsCollection,
  MASTERY_CONSECUTIVE_THRESHOLD,
} from '../src/utils/wrongQuestionsStorage';
import {
  createMockExamSession,
  evaluateMockExam,
  syncMockExamWrongQuestions,
} from '../src/utils/mockExamStorage';

// Setup Mock LocalStorage for Node test environment
const memoryStore: Record<string, string> = {};
const mockStorage = {
  getItem: (key: string) => (key in memoryStore ? memoryStore[key] : null),
  setItem: (key: string, val: string) => {
    memoryStore[key] = String(val);
  },
  removeItem: (key: string) => {
    delete memoryStore[key];
  },
  clear: () => {
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
  },
};

// @ts-expect-error Node environment polyfill
globalThis.window = { localStorage: mockStorage } as unknown as Window & typeof globalThis;
// @ts-expect-error Node environment polyfill
globalThis.localStorage = mockStorage;

describe('Phase 13 Batch 4: Wrong Questions Notebook & Review System (P13-STU-010, P13-STU-004)', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.restoreAllMocks();
  });

  const baseQuestion = {
    questionId: '173003-01-005',
    certificationId: 'web-design-c',
    officialSection: '01' as const,
    officialNumber: 5,
    officialPage: 2,
    chapterId: 1,
    topic: '工作項目 01：作業準備',
    question: '在網頁色彩標準中，#FFFFFF 代表何種顏色？',
    options: { A: '黑色', B: '白色', C: '紅色', D: '藍色' },
    userSelectedAnswer: 'A',
    correctAnswer: 'B',
    explanation: '依據色彩學，RGB 全滿 #FFFFFF 為純白色。',
    source: 'theory_practice' as const,
  };

  // 1. 學科答錯自動收錄
  it('1. automatically collects wrong question from theory chapter practice', () => {
    const userId = 'student-theory-err';
    const item = recordWrongAttempt(userId, baseQuestion);

    expect(item.questionId).toBe('173003-01-005');
    expect(item.wrongCount).toBe(1);
    expect(item.consecutiveCorrect).toBe(0);
    expect(item.masteryStatus).toBe('unmastered');
    expect(item.resolved).toBe(false);

    const stats = getWrongQuestionsStats(userId);
    expect(stats.totalRecorded).toBe(1);
    expect(stats.unmasteredCount).toBe(1);
  });

  // 2. 模擬考答錯自動收錄
  it('2. automatically collects wrong question from submitted mock exam', () => {
    const userId = 'student-mock-err';
    const session = createMockExamSession(userId, 'practice_60', 'stratified');

    // Answer first question wrong
    const firstQ = session.questions[0];
    session.answers[firstQ.id] = firstQ.correctAnswer === 'A' ? 'B' : 'A';

    const evaluated = evaluateMockExam(session);
    const synced = syncMockExamWrongQuestions(userId, evaluated);

    expect(synced).toBeGreaterThanOrEqual(1);

    const collection = getWrongQuestionsCollection(userId);
    expect(collection.items[firstQ.id]).toBeDefined();
    expect(collection.items[firstQ.id].source).toBe('mock_exam');
    expect(collection.items[firstQ.id].wrongCount).toBe(1);
    expect(collection.items[firstQ.id].masteryStatus).toBe('unmastered');
  });

  // 3. 模擬考未作答的處理
  it('3. properly collects unanswered mock exam questions as items needing review', () => {
    const userId = 'student-mock-unanswered';
    const session = createMockExamSession(userId, 'practice_60', 'stratified');

    // Submit with all 80 questions unanswered
    const evaluated = evaluateMockExam(session);
    syncMockExamWrongQuestions(userId, evaluated);

    const stats = getWrongQuestionsStats(userId);
    expect(stats.totalRecorded).toBe(80);
    expect(stats.unresolvedCount).toBe(80);

    const firstItem = getWrongQuestionsList(userId, { status: 'all' })[0];
    expect(firstItem.userSelectedAnswer).toBe('未作答');
    expect(firstItem.masteryStatus).toBe('unmastered');
  });

  // 4. 同一題跨來源去重
  it('4. deduplicates the same question across theory practice and mock exam', () => {
    const userId = 'student-dedup';

    // First failed in theory practice
    recordWrongAttempt(userId, baseQuestion);
    // Then failed again in mock exam
    recordWrongAttempt(userId, {
      ...baseQuestion,
      source: 'mock_exam',
      userSelectedAnswer: 'C',
    });

    const collection = getWrongQuestionsCollection(userId);
    expect(Object.keys(collection.items).length).toBe(1);
    expect(collection.items['173003-01-005'].wrongCount).toBe(2);
    expect(collection.items['173003-01-005'].userSelectedAnswer).toBe('C');
  });

  // 5. 錯誤次數正確累計
  it('5. increments wrongCount correctly upon multiple repeated failures', () => {
    const userId = 'student-wrong-count';

    recordWrongAttempt(userId, baseQuestion);
    recordWrongAttempt(userId, baseQuestion);
    const item3 = recordWrongAttempt(userId, baseQuestion);

    expect(item3.wrongCount).toBe(3);
    const stats = getWrongQuestionsStats(userId);
    expect(stats.totalRecorded).toBe(1);
  });

  // 6. 最近錯誤時間正確更新
  it('6. updates lastAttemptAt while preserving firstFailedAt timestamp', () => {
    const userId = 'student-timestamps';
    const item1 = recordWrongAttempt(userId, baseQuestion);
    const originalFirstFailed = item1.firstFailedAt;

    // Simulate later attempt
    const item2 = recordWrongAttempt(userId, {
      ...baseQuestion,
      userSelectedAnswer: 'D',
    });

    expect(item2.firstFailedAt).toBe(originalFirstFailed);
    expect(new Date(item2.lastAttemptAt).getTime()).toBeGreaterThanOrEqual(new Date(originalFirstFailed).getTime());
  });

  // 7. 答對後掌握狀態更新
  it('7. updates masteryStatus to reviewing upon first correct attempt and mastered upon 2 consecutive', () => {
    const userId = 'student-mastery';
    recordWrongAttempt(userId, baseQuestion);

    // Attempt 1: Correct -> 'reviewing' (consecutiveCorrect = 1)
    recordCorrectAttempt(userId, baseQuestion.questionId);
    let item = getWrongQuestionsCollection(userId).items[baseQuestion.questionId];
    expect(item.consecutiveCorrect).toBe(1);
    expect(item.masteryStatus).toBe('reviewing');
    expect(item.resolved).toBe(false);

    // Attempt 2: Correct again -> 'mastered' (consecutiveCorrect = 2)
    recordCorrectAttempt(userId, baseQuestion.questionId);
    item = getWrongQuestionsCollection(userId).items[baseQuestion.questionId];
    expect(item.consecutiveCorrect).toBe(2);
    expect(item.masteryStatus).toBe('mastered');
    expect(item.resolved).toBe(true);
  });

  // 8. 連續答對判定正確 (若中途答錯則重置連續答對次數)
  it('8. resets consecutiveCorrect to 0 and drops status back to unmastered if answered wrong again', () => {
    const userId = 'student-consecutive-reset';
    recordWrongAttempt(userId, baseQuestion);

    // Correct once (reviewing)
    recordCorrectAttempt(userId, baseQuestion.questionId);
    expect(getWrongQuestionsCollection(userId).items[baseQuestion.questionId].masteryStatus).toBe('reviewing');

    // Failed again -> must drop back to unmastered and reset consecutiveCorrect to 0!
    const failedAgain = recordWrongAttempt(userId, {
      ...baseQuestion,
      userSelectedAnswer: 'D',
    });
    expect(failedAgain.consecutiveCorrect).toBe(0);
    expect(failedAgain.masteryStatus).toBe('unmastered');
    expect(failedAgain.resolved).toBe(false);
    expect(failedAgain.wrongCount).toBe(2);
  });

  // 9. 同場次重複事件不會重複計算 (模擬考 sync 旗標防重複)
  it('9. prevents duplicate wrongCount increments when re-syncing the same mock exam session', () => {
    const userId = 'student-dup-event';
    const session = createMockExamSession(userId, 'practice_60', 'stratified');
    session.answers[session.questions[0].id] = 'D'; // wrong

    const evaluated = evaluateMockExam(session);

    const sync1 = syncMockExamWrongQuestions(userId, evaluated);
    expect(sync1).toBeGreaterThanOrEqual(1);

    const countBefore = getWrongQuestionsCollection(userId).items[session.questions[0].id]?.wrongCount;

    // Second sync call on same session
    const sync2 = syncMockExamWrongQuestions(userId, evaluated);
    expect(sync2).toBe(0);

    const countAfter = getWrongQuestionsCollection(userId).items[session.questions[0].id]?.wrongCount;
    expect(countAfter).toBe(countBefore);
  });

  // 10. 工作項目篩選正確
  it('10. filters wrong questions accurately by official work item (01, 02, 03, 04)', () => {
    const userId = 'student-section-filter';

    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q-sec-01', officialSection: '01' });
    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q-sec-02', officialSection: '02' });
    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q-sec-03', officialSection: '03' });

    const sec01List = getWrongQuestionsList(userId, { section: '01', status: 'all' });
    const sec02List = getWrongQuestionsList(userId, { section: '02', status: 'all' });
    const sec04List = getWrongQuestionsList(userId, { section: '04', status: 'all' });

    expect(sec01List).toHaveLength(1);
    expect(sec01List[0].questionId).toBe('q-sec-01');

    expect(sec02List).toHaveLength(1);
    expect(sec02List[0].questionId).toBe('q-sec-02');

    expect(sec04List).toHaveLength(0);
  });

  // 11. 隨機複習不重複抽題
  it('11. draws randomized unique review questions without duplicates from current wrong pool', () => {
    const userId = 'student-draw-review';

    for (let i = 1; i <= 15; i++) {
      recordWrongAttempt(userId, {
        ...baseQuestion,
        questionId: `q-review-${i}`,
        officialNumber: i,
      });
    }

    const drawn = drawReviewQuestions(userId, 10, 'all', false);
    expect(drawn).toHaveLength(10);

    const idSet = new Set(drawn.map((q) => q.questionId));
    expect(idSet.size).toBe(10);
  });

  // 12. 帳號切換後資料隔離
  it('12. isolates wrong questions collections between different users', () => {
    const userA = 'student-alice';
    const userB = 'student-bob';

    recordWrongAttempt(userA, { ...baseQuestion, questionId: 'q-alice-only' });
    recordWrongAttempt(userB, { ...baseQuestion, questionId: 'q-bob-only' });

    const listA = getWrongQuestionsList(userA, { status: 'all' });
    const listB = getWrongQuestionsList(userB, { status: 'all' });

    expect(listA.some((q) => q.questionId === 'q-alice-only')).toBe(true);
    expect(listA.some((q) => q.questionId === 'q-bob-only')).toBe(false);

    expect(listB.some((q) => q.questionId === 'q-bob-only')).toBe(true);
    expect(listB.some((q) => q.questionId === 'q-alice-only')).toBe(false);
  });

  // 13. LocalStorage 損毀容錯
  it('13. handles malformed JSON in storage safely with fallback defaults without crashing', () => {
    const userId = 'student-corrupt';
    const key = `ctk_wrong_questions:${userId}`;
    mockStorage.setItem(key, 'MALFORMED{NOT_JSON');

    const collection = getWrongQuestionsCollection(userId);
    expect(collection).toBeDefined();
    expect(collection.items).toEqual({});

    const stats = getWrongQuestionsStats(userId);
    expect(stats.totalRecorded).toBe(0);
    expect(stats.unresolvedCount).toBe(0);
  });

  // 14. 空錯題本顯示正常
  it('14. returns zero counts and empty arrays when user has no wrong questions recorded', () => {
    const userId = 'student-fresh';
    const list = getWrongQuestionsList(userId, { status: 'all' });
    const stats = getWrongQuestionsStats(userId);

    expect(list).toEqual([]);
    expect(stats.totalRecorded).toBe(0);
    expect(stats.unresolvedCount).toBe(0);
    expect(stats.masteredCount).toBe(0);
  });

  // 15. 頁面整合資料一致 (getWrongQuestionsStats aligns with list length)
  it('15. ensures stats summary numbers match the exact counts of filtered question lists', () => {
    const userId = 'student-consistency';

    // 2 unmastered, 1 reviewing, 1 mastered
    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q1' });
    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q2' });

    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q3' });
    recordCorrectAttempt(userId, 'q3'); // reviewing (consecutive 1)

    recordWrongAttempt(userId, { ...baseQuestion, questionId: 'q4' });
    recordCorrectAttempt(userId, 'q4');
    recordCorrectAttempt(userId, 'q4'); // mastered (consecutive 2)

    const stats = getWrongQuestionsStats(userId);
    const unmasteredList = getWrongQuestionsList(userId, { status: 'unmastered' });
    const reviewingList = getWrongQuestionsList(userId, { status: 'reviewing' });
    const masteredList = getWrongQuestionsList(userId, { status: 'mastered' });
    const unresolvedList = getWrongQuestionsList(userId, { status: 'unresolved' });
    const allList = getWrongQuestionsList(userId, { status: 'all' });

    expect(stats.totalRecorded).toBe(4);
    expect(allList.length).toBe(stats.totalRecorded);

    expect(stats.unmasteredCount).toBe(2);
    expect(unmasteredList.length).toBe(stats.unmasteredCount);

    expect(stats.reviewingCount).toBe(1);
    expect(reviewingList.length).toBe(stats.reviewingCount);

    expect(stats.masteredCount).toBe(1);
    expect(masteredList.length).toBe(stats.masteredCount);

    expect(stats.unresolvedCount).toBe(3);
    expect(unresolvedList.length).toBe(stats.unresolvedCount);
  });
});
