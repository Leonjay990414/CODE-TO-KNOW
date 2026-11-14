/**
 * Phase 14 Batch 4: Quiz Rush Game & Theory Question Bank Integration Test Suite
 * UIDs: P14-GAM-001, P14-GAM-002, P14-GAM-003, P14-GAM-007, P14-GAM-010, P14-GAM-012, P13-STU-004, P13-STU-010
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ALL_OFFICIAL_THEORY_QUESTIONS,
  TheoryQuestionModel,
} from '../src/data/questionBankAdapter';
import {
  drawQuizQuestions,
  calculateQuestionPoints,
  calculateRoundStars,
  shuffleArray,
} from '../src/utils/quizRushEngine';
import {
  getUserGameRecord,
  saveLevelCompletion,
  getOverallGameStats,
} from '../src/utils/gameStorage';
import {
  recordWrongAttempt,
  recordCorrectAttempt,
  getWrongQuestionsCollection,
  getWrongQuestionsList,
  MASTERY_CONSECUTIVE_THRESHOLD,
} from '../src/utils/wrongQuestionsStorage';
import { parseHash } from '../src/context/NavigationContext';

// Polyfill in-memory localStorage for Node test runner
const memoryStorage: Record<string, string> = {};

if (typeof window === 'undefined' || !window.localStorage) {
  const localStorageMock = {
    getItem: (key: string) => (key in memoryStorage ? memoryStorage[key] : null),
    setItem: (key: string, value: string) => {
      memoryStorage[key] = String(value);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
  // @ts-ignore
  global.window = { localStorage: localStorageMock };
  // @ts-ignore
  global.localStorage = localStorageMock;
}

describe('Phase 14 Batch 4: Quiz Rush & Wrong Questions Integration Test Suite', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('1. 605 題官方有效題庫資料保真度與抽題機制 (P14-GAM-007)', () => {
    it('verifies exact count of 605 official theory questions', () => {
      expect(ALL_OFFICIAL_THEORY_QUESTIONS.length).toBe(605);
    });

    it('ensures all question IDs are unique and well-formed', () => {
      const idSet = new Set(ALL_OFFICIAL_THEORY_QUESTIONS.map((q) => q.id));
      expect(idSet.size).toBe(605);
    });

    it('ensures all questions have valid options and valid correctAnswer (A, B, C, D)', () => {
      ALL_OFFICIAL_THEORY_QUESTIONS.forEach((q) => {
        expect(['A', 'B', 'C', 'D'].includes(q.correctAnswer)).toBe(true);
        expect(q.options.length).toBe(4);
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.officialPage).toBeGreaterThan(0);
        expect(q.officialNumber).toBeGreaterThan(0);
      });
    });

    it('verifies correct distribution across four official work sections (01, 02, 03, 04)', () => {
      const s01 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '01');
      const s02 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '02');
      const s03 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '03');
      const s04 = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === '04');

      expect(s01.length).toBe(236);
      expect(s02.length).toBe(233);
      expect(s03.length).toBe(71);
      expect(s04.length).toBe(65);
      expect(s01.length + s02.length + s03.length + s04.length).toBe(605);
    });

    it('draws random questions without duplicate questions in a single round', () => {
      const drawn10 = drawQuizQuestions('all', 10);
      expect(drawn10.length).toBe(10);
      const set10 = new Set(drawn10.map((q) => q.id));
      expect(set10.size).toBe(10);

      const drawn30 = drawQuizQuestions('all', 30);
      expect(drawn30.length).toBe(30);
      const set30 = new Set(drawn30.map((q) => q.id));
      expect(set30.size).toBe(30);
    });

    it('draws questions filtered strictly by work section', () => {
      const sec02Questions = drawQuizQuestions('02', 15);
      expect(sec02Questions.length).toBe(15);
      sec02Questions.forEach((q) => {
        expect(q.officialSection).toBe('02');
      });
    });
  });

  describe('2. Quiz Rush 遊戲計分、連擊與星級公式 (P14-GAM-003, P14-GAM-010)', () => {
    it('awards base 100 points for correct answers and 0 for incorrect/timeout', () => {
      expect(calculateQuestionPoints(true, 0, 'timed-blitz')).toBe(100);
      expect(calculateQuestionPoints(false, 0, 'timed-blitz')).toBe(0);
      expect(calculateQuestionPoints(false, 5, 'combo-challenge')).toBe(0);
    });

    it('awards combo bonus in combo-challenge mode with safe cap (+60)', () => {
      expect(calculateQuestionPoints(true, 1, 'combo-challenge')).toBe(115);
      expect(calculateQuestionPoints(true, 2, 'combo-challenge')).toBe(130);
      expect(calculateQuestionPoints(true, 3, 'combo-challenge')).toBe(145);
      expect(calculateQuestionPoints(true, 4, 'combo-challenge')).toBe(160);
      // Capped at 160 (100 base + 60 combo bonus)
      expect(calculateQuestionPoints(true, 10, 'combo-challenge')).toBe(160);
    });

    it('calculates round stars based on accuracy percentage', () => {
      expect(calculateRoundStars(95)).toBe(3);
      expect(calculateRoundStars(90)).toBe(3);
      expect(calculateRoundStars(89)).toBe(2);
      expect(calculateRoundStars(70)).toBe(2);
      expect(calculateRoundStars(69)).toBe(1);
      expect(calculateRoundStars(20)).toBe(1);
    });
  });

  describe('3. 錯題本無縫同步與掌握度生命週期 (P13-STU-004, P13-STU-010)', () => {
    it('synchronizes failed question to wrong questions notebook with unmastered status', () => {
      const user = 'rush-student-wrong-test';
      const q = ALL_OFFICIAL_THEORY_QUESTIONS[0];

      const item = recordWrongAttempt(user, {
        questionId: q.id,
        certificationId: 'web-design-c',
        officialSection: q.officialSection,
        officialNumber: q.officialNumber,
        officialPage: q.officialPage,
        topic: q.sectionName,
        question: q.question,
        options: {
          A: q.options[0].text,
          B: q.options[1].text,
          C: q.options[2].text,
          D: q.options[3].text,
        },
        userSelectedAnswer: 'B',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        source: 'theory_practice',
      });

      expect(item.questionId).toBe(q.id);
      expect(item.wrongCount).toBe(1);
      expect(item.masteryStatus).toBe('unmastered');
      expect(item.resolved).toBe(false);

      const list = getWrongQuestionsList(user);
      expect(list.length).toBe(1);
      expect(list[0].questionId).toBe(q.id);
    });

    it('synchronizes timeout answer with userSelectedAnswer marked as 超時未作答', () => {
      const user = 'rush-student-timeout';
      const q = ALL_OFFICIAL_THEORY_QUESTIONS[5];

      const item = recordWrongAttempt(user, {
        questionId: q.id,
        certificationId: 'web-design-c',
        topic: q.sectionName,
        question: q.question,
        options: {
          A: q.options[0].text,
          B: q.options[1].text,
          C: q.options[2].text,
          D: q.options[3].text,
        },
        userSelectedAnswer: '超時未作答',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });

      expect(item.userSelectedAnswer).toBe('超時未作答');
      expect(item.masteryStatus).toBe('unmastered');
    });

    it('updates mastery to reviewing and mastered upon consecutive correct attempts in Quiz Rush', () => {
      const user = 'rush-student-mastery';
      const q = ALL_OFFICIAL_THEORY_QUESTIONS[10];

      // Step 1: User gets it wrong in Quiz Rush
      recordWrongAttempt(user, {
        questionId: q.id,
        topic: q.sectionName,
        question: q.question,
        options: { A: '1', B: '2', C: '3', D: '4' },
        userSelectedAnswer: 'D',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });

      // Step 2: Next attempt user gets it right -> consecutive=1, mastery='reviewing'
      const updatedFirstTime = recordCorrectAttempt(user, q.id);
      expect(updatedFirstTime).toBe(true);
      const colAfter1 = getWrongQuestionsCollection(user);
      expect(colAfter1.items[q.id].consecutiveCorrect).toBe(1);
      expect(colAfter1.items[q.id].masteryStatus).toBe('reviewing');
      expect(colAfter1.items[q.id].resolved).toBe(false);

      // Step 3: Next attempt user gets it right again -> consecutive=2 >= threshold -> mastery='mastered'
      const updatedSecondTime = recordCorrectAttempt(user, q.id);
      expect(updatedSecondTime).toBe(true);
      const colAfter2 = getWrongQuestionsCollection(user);
      expect(colAfter2.items[q.id].consecutiveCorrect).toBe(2);
      expect(colAfter2.items[q.id].masteryStatus).toBe('mastered');
      expect(colAfter2.items[q.id].resolved).toBe(true);
    });

    it('strictly isolates wrong questions between different student accounts', () => {
      const q = ALL_OFFICIAL_THEORY_QUESTIONS[12];
      recordWrongAttempt('user-rush-alice', {
        questionId: q.id,
        topic: q.sectionName,
        question: q.question,
        options: { A: '1', B: '2', C: '3', D: '4' },
        userSelectedAnswer: 'C',
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      });

      const aliceList = getWrongQuestionsList('user-rush-alice');
      const bobList = getWrongQuestionsList('user-rush-bob');

      expect(aliceList.length).toBe(1);
      expect(bobList.length).toBe(0);
    });
  });

  describe('4. Quiz Rush 遊戲儲存與四款遊戲整體統計彙總 (P14-GAM-002, P14-GAM-012)', () => {
    it('saves quiz rush round completion and preserves high scores', () => {
      const user = 'rush-gamer';
      // First round: score 900, 3 stars
      const rec = saveLevelCompletion(user, 'quiz-rush', 1, 3, 900);
      expect(rec.levels[1].stars).toBe(3);
      expect(rec.levels[1].highScore).toBe(900);
      expect(rec.totalStars).toBe(3);
      expect(rec.totalScore).toBe(900);

      // Replaying with lower score 500 should NOT overwrite 900 or inflate stars
      const after = saveLevelCompletion(user, 'quiz-rush', 1, 2, 500);
      expect(after.levels[1].stars).toBe(3);
      expect(after.levels[1].highScore).toBe(900);
      expect(after.totalStars).toBe(3);
      expect(after.levels[1].attempts).toBe(2);
    });

    it('aggregates statistics across all 4 educational games cleanly', () => {
      const user = 'grand-master-all-4-games';
      saveLevelCompletion(user, 'code-puzzle', 1, 3, 250);
      saveLevelCompletion(user, 'css-designer', 1, 3, 250);
      saveLevelCompletion(user, 'bug-hunter', 1, 3, 250);
      saveLevelCompletion(user, 'quiz-rush', 1, 3, 900);

      const stats = getOverallGameStats(user);
      expect(stats.totalGamesPlayed).toBe(4);
      expect(stats.totalLevelsCompleted).toBe(4);
      expect(stats.totalStars).toBe(12);
      expect(stats.totalScore).toBe(1650);
    });
  });

  describe('5. Navigation Context Routing (P14-GAM-001)', () => {
    it('parses #games/quiz-rush to quiz-rush page state', () => {
      const parsed = parseHash('#games/quiz-rush');
      expect(parsed.page).toBe('quiz-rush');
    });

    it('parses #quiz-rush to quiz-rush page state', () => {
      const parsed = parseHash('#quiz-rush');
      expect(parsed.page).toBe('quiz-rush');
    });
  });
});
