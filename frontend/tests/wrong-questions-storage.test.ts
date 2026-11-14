import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordWrongAttempt,
  recordCorrectAttempt,
  getWrongQuestionsList,
  getWrongQuestionsStats,
  removeWrongQuestion,
  clearAllWrongQuestions,
  getWrongQuestionsStorageKey,
} from '../src/utils/wrongQuestionsStorage';

// Setup Mock LocalStorage for Node test environment
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}
const mockStorage = createMockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window.localStorage = mockStorage;

describe('Wrong Questions Notebook & Self-Test Persistence (P13-STU-004, P13-STU-010)', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  const sampleQuestion = {
    questionId: 'q-html-01',
    certificationId: 'web-design-c',
    chapterId: 2,
    topic: 'HTML5 語意標籤',
    question: '請問導覽選單應該使用哪種標籤？',
    options: { A: '<menu>', B: '<nav>', C: '<header>', D: '<aside>' },
    userSelectedAnswer: 'A',
    correctAnswer: 'B',
    explanation: '<nav> 標籤用於主要導覽列。',
  };

  it('records a wrong question attempt and sets resolved=false', () => {
    const item = recordWrongAttempt('test_student', sampleQuestion);
    expect(item.questionId).toBe('q-html-01');
    expect(item.wrongCount).toBe(1);
    expect(item.resolved).toBe(false);

    const list = getWrongQuestionsList('test_student', true);
    expect(list.length).toBe(1);
    expect(list[0].questionId).toBe('q-html-01');
  });

  it('increments wrongCount upon repeated failed attempts and updates lastAttemptAt', () => {
    recordWrongAttempt('test_student', sampleQuestion);
    const item2 = recordWrongAttempt('test_student', {
      ...sampleQuestion,
      userSelectedAnswer: 'C',
    });

    expect(item2.wrongCount).toBe(2);
    expect(item2.userSelectedAnswer).toBe('C');

    const stats = getWrongQuestionsStats('test_student');
    expect(stats.totalRecorded).toBe(1);
    expect(stats.unresolvedCount).toBe(1);
  });

  it('marks question as resolved when student answers correctly later', () => {
    recordWrongAttempt('test_student', sampleQuestion);

    // Later answers correctly (first correct -> reviewing)
    const updated1 = recordCorrectAttempt('test_student', 'q-html-01');
    expect(updated1).toBe(true);

    // Answers correctly second time -> achieves mastery (resolved = true)
    const updated2 = recordCorrectAttempt('test_student', 'q-html-01');
    expect(updated2).toBe(true);

    // Unresolved list should now be 0
    const unresolvedList = getWrongQuestionsList('test_student', true);
    expect(unresolvedList.length).toBe(0);

    // All list still includes it with resolved = true
    const allList = getWrongQuestionsList('test_student', false);
    expect(allList.length).toBe(1);
    expect(allList[0].resolved).toBe(true);

    const stats = getWrongQuestionsStats('test_student');
    expect(stats.resolvedCount).toBe(1);
    expect(stats.unresolvedCount).toBe(0);
  });

  it('removes a single question from the notebook', () => {
    recordWrongAttempt('test_student', sampleQuestion);
    removeWrongQuestion('test_student', 'q-html-01');

    const list = getWrongQuestionsList('test_student', false);
    expect(list.length).toBe(0);
  });

  it('clears all wrong questions cleanly', () => {
    recordWrongAttempt('test_student', sampleQuestion);
    recordWrongAttempt('test_student', {
      ...sampleQuestion,
      questionId: 'q-css-02',
    });

    clearAllWrongQuestions('test_student');
    const stats = getWrongQuestionsStats('test_student');
    expect(stats.totalRecorded).toBe(0);
  });

  it('handles corrupted storage data gracefully', () => {
    const key = getWrongQuestionsStorageKey('corrupted');
    mockStorage.setItem(key, '{ malformed: bad format');

    const stats = getWrongQuestionsStats('corrupted');
    expect(stats.totalRecorded).toBe(0);
    expect(stats.unresolvedCount).toBe(0);
  });
});
