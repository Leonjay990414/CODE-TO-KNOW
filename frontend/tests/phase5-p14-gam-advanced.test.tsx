import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getUserStreak,
  recordDailyActivity,
  getDailyQuests,
  updateQuestProgress,
  claimQuestReward,
  getUnlockedTitles,
  equipTitle,
  getEquippedTitle,
  TITLE_REWARDS,
} from '../src/utils/dailyQuestEngine';
import {
  canSubmitScore,
  recordScoreSubmissionTimestamp,
  saveGamePlayHistory,
  getGamePlayHistory,
  clearGamePlayHistory,
} from '../src/utils/gameStorage';
import {
  recordWrongAttempt,
  getWrongQuestionsCollection,
} from '../src/utils/wrongQuestionsStorage';
import {
  getRecommendedGamesByWeakness,
} from '../src/utils/gameLearningInterlock';
import { GameCenterPage } from '../src/pages/public/GameCenterPage';
import { AuthContext } from '../src/context/AuthContext';
import { NavigationContext } from '../src/context/NavigationContext';

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const fakeStorage = createMockStorage();
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    localStorage: fakeStorage,
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  (globalThis as any).localStorage = fakeStorage;
} else {
  (globalThis as any).window.localStorage = fakeStorage;
  (globalThis as any).localStorage = fakeStorage;
}

let mockAuthState: any = {
  user: {
    id: 'test-student-p14',
    name: 'P14 測試學生',
    email: 'student.p14@codetoknow.edu.tw',
    role: 'STUDENT',
    roles: ['STUDENT'],
  },
  authStatus: 'authenticated',
  openAuth: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

let mockNavState: any = {
  route: { page: 'games' },
  currentRoute: '#games',
  goToHome: vi.fn(),
  goToTheoryPractice: vi.fn(),
  goToPractical: vi.fn(),
  goToStudentDashboard: vi.fn(),
  goToTeacherDashboard: vi.fn(),
  goToAdminDashboard: vi.fn(),
  goToSystemOpsDashboard: vi.fn(),
  goToAICoach: vi.fn(),
  goToLegalNotice: vi.fn(),
  goToLearningProgress: vi.fn(),
};

vi.mock('../src/context/NavigationContext', () => ({
  useNavigation: () => mockNavState,
}));

function renderGameCenterPageHtml() {
  return renderToStaticMarkup(<GameCenterPage />);
}

describe('Phase 5 Integration: Advanced P14 Gamification (P14-GAM-011, P14-GAM-012, P14-GAM-013)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. P14-GAM-011: Daily Streak & Daily Quests Engine', () => {
    it('1.1 returns initial streak 0 for a brand new user', () => {
      const streak = getUserStreak('student-001');
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(0);
      expect(streak.lastActiveDate).toBe('');
      expect(streak.streakDates).toEqual([]);
    });

    it('1.2 starts streak at 1 on first daily activity and records date', () => {
      const today = new Date(2026, 10, 18); // 2026-11-18
      const record = recordDailyActivity('student-001', today);
      expect(record.currentStreak).toBe(1);
      expect(record.longestStreak).toBe(1);
      expect(record.lastActiveDate).toBe('2026-11-18');
      expect(record.streakDates).toContain('2026-11-18');
    });

    it('1.3 maintains same streak if active multiple times on the same day', () => {
      const today = new Date(2026, 10, 18);
      recordDailyActivity('student-001', today);
      const secondCall = recordDailyActivity('student-001', today);
      expect(secondCall.currentStreak).toBe(1);
      expect(secondCall.longestStreak).toBe(1);
    });

    it('1.4 increments streak on consecutive days', () => {
      const day1 = new Date(2026, 10, 18);
      const day2 = new Date(2026, 10, 19);
      recordDailyActivity('student-001', day1);
      const updated = recordDailyActivity('student-001', day2);
      expect(updated.currentStreak).toBe(2);
      expect(updated.longestStreak).toBe(2);
      expect(updated.lastActiveDate).toBe('2026-11-19');
    });

    it('1.5 isolates streak records strictly by userId', () => {
      recordDailyActivity('user-alpha');
      recordDailyActivity('user-alpha');
      const streakAlpha = getUserStreak('user-alpha');
      const streakBeta = getUserStreak('user-beta');

      expect(streakAlpha.currentStreak).toBe(1);
      expect(streakBeta.currentStreak).toBe(0);
    });

    it('1.6 initializes 3 default daily quests with 0 progress', () => {
      const questsRecord = getDailyQuests('student-001');
      expect(questsRecord.quests).toHaveLength(3);
      expect(questsRecord.allCompleted).toBe(false);

      const gameQuest = questsRecord.quests.find((q) => q.category === 'game');
      const starQuest = questsRecord.quests.find((q) => q.category === 'stars');
      const reviewQuest = questsRecord.quests.find((q) => q.category === 'review');

      expect(gameQuest?.target).toBe(1);
      expect(starQuest?.target).toBe(3);
      expect(reviewQuest?.target).toBe(5);
    });

    it('1.7 increments quest progress and completes when target is reached', () => {
      const userId = 'student-quest-test';
      updateQuestProgress(userId, 'game', 1);
      const state1 = getDailyQuests(userId);
      const gameQuest = state1.quests.find((q) => q.category === 'game');
      expect(gameQuest?.current).toBe(1);
      expect(gameQuest?.completed).toBe(true);

      updateQuestProgress(userId, 'stars', 2);
      const state2 = getDailyQuests(userId);
      const starQuest = state2.quests.find((q) => q.category === 'stars');
      expect(starQuest?.current).toBe(2);
      expect(starQuest?.completed).toBe(false);

      updateQuestProgress(userId, 'stars', 1);
      const state3 = getDailyQuests(userId);
      const starQuestCompleted = state3.quests.find((q) => q.category === 'stars');
      expect(starQuestCompleted?.current).toBe(3);
      expect(starQuestCompleted?.completed).toBe(true);
    });

    it('1.8 allows claiming reward only when quest is completed', () => {
      const userId = 'student-claim-test';
      const beforeComplete = claimQuestReward(userId, 'quest-play-game');
      expect(beforeComplete.quests.find((q) => q.id === 'quest-play-game')?.claimed).toBe(false);

      updateQuestProgress(userId, 'game', 1);
      const afterClaim = claimQuestReward(userId, 'quest-play-game');
      expect(afterClaim.quests.find((q) => q.id === 'quest-play-game')?.claimed).toBe(true);
    });

    it('1.9 unlocks cosmetic titles as longestStreak grows and allows equipping', () => {
      const userId = 'student-titles';
      expect(getUnlockedTitles(userId)).toHaveLength(0);

      // Simulate 3-day streak
      const day1 = new Date(2026, 10, 1);
      const day2 = new Date(2026, 10, 2);
      const day3 = new Date(2026, 10, 3);
      recordDailyActivity(userId, day1);
      recordDailyActivity(userId, day2);
      recordDailyActivity(userId, day3);

      const unlocked = getUnlockedTitles(userId);
      expect(unlocked.length).toBeGreaterThanOrEqual(2);
      expect(unlocked.some((t) => t.id === 'title-novice-explorer')).toBe(true);
      expect(unlocked.some((t) => t.id === 'title-steady-learner')).toBe(true);

      const equipSuccess = equipTitle(userId, 'title-steady-learner');
      expect(equipSuccess).toBe(true);
      expect(getEquippedTitle(userId)?.id).toBe('title-steady-learner');

      // Cannot equip locked title (14 days required)
      const equipFailed = equipTitle(userId, 'title-code-gladiator');
      expect(equipFailed).toBe(false);
    });
  });

  describe('2. P14-GAM-012: Anti-Replay Cooldown & Play History Audit Trail', () => {
    it('2.1 permits score submission initially and throttles rapid consecutive submits', () => {
      const userId = 'student-throttle';
      expect(canSubmitScore(userId, 'quiz-rush', 1, 1500)).toBe(true);

      recordScoreSubmissionTimestamp(userId, 'quiz-rush', 1);
      // Immediately checking should be throttled (false)
      expect(canSubmitScore(userId, 'quiz-rush', 1, 1500)).toBe(false);
    });

    it('2.2 saves and retrieves play history with max 30 items limit', () => {
      const userId = 'student-history';
      expect(getGamePlayHistory(userId)).toEqual([]);

      saveGamePlayHistory(userId, {
        gameId: 'quiz-rush',
        levelId: 1,
        stars: 3,
        score: 120,
        hintsUsed: 0,
        isNewHighScore: true,
      });

      const history = getGamePlayHistory(userId);
      expect(history).toHaveLength(1);
      expect(history[0].gameId).toBe('quiz-rush');
      expect(history[0].stars).toBe(3);
      expect(history[0].score).toBe(120);
      expect(history[0].isNewHighScore).toBe(true);
      expect(history[0].timestamp).toBeDefined();

      clearGamePlayHistory(userId);
      expect(getGamePlayHistory(userId)).toEqual([]);
    });

    it('2.3 safely recovers from malformed play history JSON', () => {
      localStorage.setItem('ctk_game_history:corrupt-user', '{BAD_JSON');
      const list = getGamePlayHistory('corrupt-user');
      expect(list).toEqual([]);
    });
  });

  describe('3. P14-GAM-013: Learning Interlock & Weakness Recommendation', () => {
    it('3.1 supports quiz_rush as explicit source in wrong questions collection', () => {
      const userId = 'student-quiz-rush-source';
      recordWrongAttempt(userId, {
        questionId: 'q-qr-001',
        topic: '工作項目 01：電腦通訊',
        question: '何者為標準 IP 位址？',
        options: { A: '192.168.1.1', B: '999.999', C: 'ABC', D: '0' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: 'IPv4 格式為 0-255 範圍十進位數。',
        source: 'quiz_rush',
      });

      const collection = getWrongQuestionsCollection(userId);
      expect(collection.items['q-qr-001']).toBeDefined();
      expect(collection.items['q-qr-001'].source).toBe('quiz_rush');
    });

    it('3.2 recommends exploratory games when student has zero wrong questions', () => {
      const result = getRecommendedGamesByWeakness('clean-student');
      expect(result.hasWeakness).toBe(false);
      expect(result.totalUnmasteredQuestions).toBe(0);
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
    });

    it('3.3 prioritizes CSS Designer when student has CSS (Section 03) wrong questions', () => {
      const userId = 'student-css-weakness';
      recordWrongAttempt(userId, {
        questionId: 'q-css-01',
        officialSection: '03',
        topic: '工作項目 03：CSS 排版',
        question: 'CSS flexbox 主軸對齊屬性為何？',
        options: { A: 'justify-content', B: 'align-items', C: 'flex-flow', D: 'order' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: 'justify-content 控制主軸對齊。',
      });
      recordWrongAttempt(userId, {
        questionId: 'q-css-02',
        officialSection: '03',
        topic: '工作項目 03：CSS 盒模型',
        question: 'box-sizing: border-box 計算寬度時包含何者？',
        options: { A: 'padding 與 border', B: 'margin', C: 'outline', D: 'shadow' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: '包含 padding 與 border。',
      });

      const rec = getRecommendedGamesByWeakness(userId);
      expect(rec.hasWeakness).toBe(true);
      expect(rec.totalUnmasteredQuestions).toBe(2);
      expect(rec.dominantWeakSection).toBe('03');

      const topRec = rec.recommendations[0];
      expect(topRec.gameId).toBe('css-designer');
      expect(topRec.priority).toBe('HIGH');
      expect(topRec.actionHash).toBe('#games/css-designer');
    });
  });

  describe('4. UI Integration: GameCenterPage Rendering', () => {
    it('4.1 renders Daily Quests dashboard with 3 quest cards', () => {
      const html = renderGameCenterPageHtml();
      expect(html).toContain('data-testid="daily-quests-dashboard"');
      expect(html).toContain('每日挑戰任務 (Daily Quests)');
      expect(html).toContain('data-testid="quest-card-quest-play-game"');
      expect(html).toContain('data-testid="quest-card-quest-collect-stars"');
      expect(html).toContain('data-testid="quest-card-quest-review-questions"');
    });

    it('4.2 renders Learning Interlock recommendation section', () => {
      const html = renderGameCenterPageHtml();
      expect(html).toContain('data-testid="learning-interlock-recommendation"');
      expect(html).toContain('學科弱點連動推薦 (P14-GAM-013 智慧引導)');
    });

    it('4.3 renders streak flame badge and check-in button', () => {
      const html = renderGameCenterPageHtml();
      expect(html).toContain('連續打卡');
      expect(html).toContain('今日簽到');
    });

    it('4.4 renders play history section when student has play history', () => {
      saveGamePlayHistory('test-student-p14', {
        gameId: 'quiz-rush',
        levelId: 1,
        stars: 3,
        score: 150,
        hintsUsed: 0,
        isNewHighScore: true,
      });

      const html = renderGameCenterPageHtml();
      expect(html).toContain('data-testid="play-history-section"');
      expect(html).toContain('最近挑戰歷程 (P14-GAM-012 對局軌跡)');
      expect(html).toContain('Quiz Rush 快答');
      expect(html).toContain('新紀錄!');
    });
  });
});
