import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitFeedback,
  getFeedbacks,
  getFeedbacksByCategory,
  clearFeedbacks,
  FEEDBACK_STORAGE_KEY,
} from '../src/utils/feedbackStorage';
import {
  trackEvent,
  getBufferedEvents,
  getEventsByType,
  clearTelemetryEvents,
} from '../src/utils/learningTelemetry';

// In-memory mock storage
const createMockStorage = () => {
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
const mockLocalStorage = createMockStorage();
const mockSessionStorage = createMockStorage();
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window.localStorage = mockLocalStorage;
(globalThis as any).sessionStorage = mockSessionStorage;
(globalThis as any).window.sessionStorage = mockSessionStorage;

describe('P20 Operations: User Feedback & Learning Telemetry Suite (P20-OPS-005, P20-OPS-006)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFeedbacks();
    clearTelemetryEvents();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
  });

  describe('1. User Feedback Storage & Categorization (P20-OPS-005)', () => {
    it('submits a feedback item and persists it in local buffer with status NEW', () => {
      const item = submitFeedback({
        userId: 'student-001',
        userRole: 'STUDENT',
        category: 'exam',
        rating: 5,
        title: '題庫解析非常清晰',
        content: '模擬考的雷達圖分析幫助很大，希望能加入更多題組。',
        contactEmail: 'student@example.com',
      });

      expect(item.id).toMatch(/^fb-/);
      expect(item.status).toBe('NEW');
      expect(item.rating).toBe(5);
      expect(item.category).toBe('exam');

      const all = getFeedbacks();
      expect(all.length).toBe(1);
      expect(all[0].title).toBe('題庫解析非常清晰');
    });

    it('clamps ratings between 1 and 5', () => {
      const low = submitFeedback({
        category: 'bug',
        rating: -2,
        title: '錯誤評分',
        content: '測試低於 1 的評分',
      });
      expect(low.rating).toBe(1);

      const high = submitFeedback({
        category: 'feature',
        rating: 99,
        title: '高評分',
        content: '測試高於 5 的評分',
      });
      expect(high.rating).toBe(5);
    });

    it('filters feedbacks correctly by category', () => {
      submitFeedback({ category: 'bug', rating: 3, title: 'Bug 1', content: '內容' });
      submitFeedback({ category: 'content', rating: 4, title: 'Content 1', content: '內容' });
      submitFeedback({ category: 'bug', rating: 2, title: 'Bug 2', content: '內容' });

      const bugList = getFeedbacksByCategory('bug');
      const contentList = getFeedbacksByCategory('content');

      expect(bugList.length).toBe(2);
      expect(contentList.length).toBe(1);
    });

    it('handles corrupted JSON in feedback storage gracefully without throwing', () => {
      mockLocalStorage.setItem(FEEDBACK_STORAGE_KEY, 'INVALID{JSON');
      const items = getFeedbacks();
      expect(items).toEqual([]);
    });
  });

  describe('2. Learning Telemetry Event Buffering (P20-OPS-006)', () => {
    it('records telemetry events and retrieves them by event type', () => {
      trackEvent('PAGE_VIEW', { page: 'mock-exam' }, 'student-001');
      trackEvent('EXAM_START', { examId: '17300-mock-1' }, 'student-001');
      trackEvent('EXAM_SUBMIT', { score: 95, durationSeconds: 1200 }, 'student-001');

      const allEvents = getBufferedEvents();
      expect(allEvents.length).toBe(3);

      const submitEvents = getEventsByType('EXAM_SUBMIT');
      expect(submitEvents.length).toBe(1);
      expect(submitEvents[0].metadata?.score).toBe(95);
    });

    it('redacts sensitive keywords from telemetry metadata automatically', () => {
      const event = trackEvent('PAGE_VIEW', {
        page: 'login',
        passwordAttempt: 'secret123',
        authToken: 'token_abc',
        legitimateMetric: 42,
      });

      expect(event.metadata?.legitimateMetric).toBe(42);
      expect(event.metadata?.passwordAttempt).toBeUndefined();
      expect(event.metadata?.authToken).toBeUndefined();
    });

    it('clears buffered telemetry events cleanly', () => {
      trackEvent('GAME_START', { gameId: 'bug-hunter' });
      expect(getBufferedEvents().length).toBe(1);

      clearTelemetryEvents();
      expect(getBufferedEvents().length).toBe(0);
    });
  });
});
