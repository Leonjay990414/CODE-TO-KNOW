import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStorageKey,
  getPracticalProgress,
  savePracticalProgress,
  toggleStepCompletion,
  resetPracticalProgress,
} from '../src/utils/learningStorage';
import {
  getWrongQuestionsStorageKey,
  getWrongQuestionsCollection,
  recordWrongAttempt,
  recordCorrectAttempt,
  getWrongQuestionsList,
  getWrongQuestionsStats,
  clearAllWrongQuestions,
} from '../src/utils/wrongQuestionsStorage';

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

// @ts-expect-error Mocking global window
if (typeof globalThis.window === 'undefined') {
  // @ts-expect-error Mocking window
  globalThis.window = {};
}
// @ts-expect-error Mocking window.localStorage
globalThis.window.localStorage = mockLocalStorage;

describe('Multi-User LocalStorage Isolation & Account Switching Test Suite', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('1. Key Generation & Distinct Identification', () => {
    it('generates distinct keys for User A, User B, Demo, and Guest', () => {
      const userAKey = getStorageKey('user-alice-123', 5, 'A');
      const userBKey = getStorageKey('user-bob-456', 5, 'A');
      const demoStudentKey = getStorageKey('demo-student', 5, 'A');
      const demoTeacherKey = getStorageKey('demo-teacher', 5, 'A');
      const guestKey = getStorageKey('', 5, 'A');

      expect(userAKey).toBe('ctk_practical_progress:user-alice-123:5:A');
      expect(userBKey).toBe('ctk_practical_progress:user-bob-456:5:A');
      expect(demoStudentKey).toBe('ctk_practical_progress:demo-student:5:A');
      expect(demoTeacherKey).toBe('ctk_practical_progress:demo-teacher:5:A');
      expect(guestKey).toBe('ctk_practical_progress:guest-anonymous:5:A');

      // None of the keys overlap
      const keys = new Set([userAKey, userBKey, demoStudentKey, demoTeacherKey, guestKey]);
      expect(keys.size).toBe(5);
    });

    it('generates distinct wrong-question keys for User A, User B, and Demo', () => {
      const wA = getWrongQuestionsStorageKey('user-alice-123');
      const wB = getWrongQuestionsStorageKey('user-bob-456');
      const wDemo = getWrongQuestionsStorageKey('demo-student');
      const wGuest = getWrongQuestionsStorageKey('');

      expect(wA).toBe('ctk_wrong_questions:user-alice-123');
      expect(wB).toBe('ctk_wrong_questions:user-bob-456');
      expect(wDemo).toBe('ctk_wrong_questions:demo-student');
      expect(wGuest).toBe('ctk_wrong_questions:guest-anonymous');
    });
  });

  describe('2. Account Switching Scenario (User A -> Logout -> User B)', () => {
    it('ensures User B cannot see User A practical progress after switching accounts', () => {
      const userA = 'user-alice-123';
      const userB = 'user-bob-456';

      // 1. User A logs in and completes Step 1, 2, 3 in Task 5 Version A
      toggleStepCompletion(userA, 5, 'A', 1);
      toggleStepCompletion(userA, 5, 'A', 2);
      toggleStepCompletion(userA, 5, 'A', 3);

      const progressA = getPracticalProgress(userA, 5, 'A');
      expect(progressA.completedSteps).toEqual([1, 2, 3]);

      // 2. User A logs out (User is now null -> guest-anonymous)
      const guestProgress = getPracticalProgress('guest-anonymous', 5, 'A');
      expect(guestProgress.completedSteps).toEqual([]); // Guest has empty progress

      // 3. User B logs in
      const progressB = getPracticalProgress(userB, 5, 'A');
      expect(progressB.completedSteps).toEqual([]); // User B has clean slate

      // 4. User B completes Step 5
      toggleStepCompletion(userB, 5, 'A', 5);
      const updatedB = getPracticalProgress(userB, 5, 'A');
      expect(updatedB.completedSteps).toEqual([5]);

      // 5. Verify User A progress was untouched and unaffected by User B's actions
      const recheckedA = getPracticalProgress(userA, 5, 'A');
      expect(recheckedA.completedSteps).toEqual([1, 2, 3]);
    });

    it('ensures User B cannot see User A wrong questions after switching accounts', () => {
      const userA = 'user-alice-123';
      const userB = 'user-bob-456';

      // 1. User A records a wrong answer
      recordWrongAttempt(userA, {
        questionId: 'q17300-001',
        certificationId: 'web-design-c',
        topic: 'HTML5 語意標籤',
        question: 'HTML5 中何者為正確的主要導覽元素？',
        options: { A: '<nav>', B: '<navigation>', C: '<menu>', D: '<navigate>' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: '<nav> 為標準導覽容器。',
      });

      const statsA = getWrongQuestionsStats(userA);
      expect(statsA.totalRecorded).toBe(1);
      expect(statsA.unresolvedCount).toBe(1);

      // 2. User B logs in and checks stats
      const statsB = getWrongQuestionsStats(userB);
      expect(statsB.totalRecorded).toBe(0);
      expect(statsB.unresolvedCount).toBe(0);
      expect(getWrongQuestionsList(userB, false)).toEqual([]);

      // 3. User B records a different wrong answer
      recordWrongAttempt(userB, {
        questionId: 'q17300-002',
        certificationId: 'web-design-c',
        topic: 'CSS 盒模型',
        question: 'box-sizing: border-box 計算寬度時包含何者？',
        options: { A: '僅 content', B: 'content + padding + border', C: 'margin', D: 'outline' },
        userSelectedAnswer: 'A',
        correctAnswer: 'B',
        explanation: 'border-box 包含 padding 與 border。',
      });

      const updatedStatsB = getWrongQuestionsStats(userB);
      expect(updatedStatsB.totalRecorded).toBe(1);
      const listB = getWrongQuestionsList(userB, false);
      expect(listB[0].questionId).toBe('q17300-002');

      // 4. Verify User A still only has their own question (q17300-001)
      const recheckedListA = getWrongQuestionsList(userA, false);
      expect(recheckedListA.length).toBe(1);
      expect(recheckedListA[0].questionId).toBe('q17300-001');
    });
  });

  describe('3. Demo Account Isolation & Accidental Deletion Prevention', () => {
    it('isolates demo-student data from real user data and guest-anonymous', () => {
      // Demo student has progress
      toggleStepCompletion('demo-student', 5, 'A', 1);

      // Real user has progress
      toggleStepCompletion('real-student-789', 5, 'A', 2);

      // Anonymous guest has progress
      toggleStepCompletion('guest-anonymous', 5, 'A', 3);

      expect(getPracticalProgress('demo-student', 5, 'A').completedSteps).toEqual([1]);
      expect(getPracticalProgress('real-student-789', 5, 'A').completedSteps).toEqual([2]);
      expect(getPracticalProgress('guest-anonymous', 5, 'A').completedSteps).toEqual([3]);
    });

    it('clearing or resetting user A data does not touch user B or demo data', () => {
      const userA = 'user-alice-123';
      const userB = 'user-bob-456';

      // Both have practical progress & wrong questions
      toggleStepCompletion(userA, 5, 'A', 1);
      toggleStepCompletion(userB, 5, 'A', 2);

      recordWrongAttempt(userA, {
        questionId: 'qA',
        certificationId: 'web-design-c',
        topic: 'Topic A',
        question: 'Question A',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: 'Exp A',
      });

      recordWrongAttempt(userB, {
        questionId: 'qB',
        certificationId: 'web-design-c',
        topic: 'Topic B',
        question: 'Question B',
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        userSelectedAnswer: 'C',
        correctAnswer: 'B',
        explanation: 'Exp B',
      });

      // User A resets practical progress and clears wrong questions
      resetPracticalProgress(userA, 5, 'A');
      clearAllWrongQuestions(userA);

      // Verify User A is reset
      expect(getPracticalProgress(userA, 5, 'A').completedSteps).toEqual([]);
      expect(getWrongQuestionsStats(userA).totalRecorded).toBe(0);

      // Verify User B is completely intact
      expect(getPracticalProgress(userB, 5, 'A').completedSteps).toEqual([2]);
      expect(getWrongQuestionsStats(userB).totalRecorded).toBe(1);
      expect(getWrongQuestionsList(userB, false)[0].questionId).toBe('qB');
    });
  });

  describe('4. Corruption & Recovery Safety', () => {
    it('recovers safely with fallback defaults when storage contains malformed JSON or invalid schema', () => {
      const user = 'test-corrupt-user';
      const key = getStorageKey(user, 5, 'A');

      // Inject invalid JSON
      mockLocalStorage.setItem(key, 'MALFORMED{JSON');

      const progress = getPracticalProgress(user, 5, 'A');
      expect(progress.userId).toBe(user);
      expect(progress.taskId).toBe(5);
      expect(progress.version).toBe('A');
      expect(progress.completedSteps).toEqual([]);
      expect(progress.completedChecklist).toEqual([]);
    });
  });
});
