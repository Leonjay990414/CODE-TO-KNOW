import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearApiCache, classroomApi, adminApi, authApi } from '../src/services/api';
import { getNotifications, addNotification, clearReadNotifications } from '../src/utils/notificationStorage';

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
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window.localStorage = mockLocalStorage;

describe('P18 Batch 3: API Integration, Error Resilience & Empty States Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearApiCache();
    mockLocalStorage.clear();
  });

  describe('1. API Error Statuses & Graceful Degradation', () => {
    it('handles 400 Bad Request with field validation details', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '輸入欄位格式不符合規範',
            details: { email: ['無效的信箱格式'] },
          },
        }),
      });
      (globalThis as any).fetch = mockFetch;

      const res = await authApi.login('invalid-email', '123');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('VALIDATION_ERROR');
      expect(res.error?.details).toHaveProperty('email');
    });

    it('handles 403 Forbidden with permission error response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '您的帳號未具備管理員權限',
          },
        }),
      });
      (globalThis as any).fetch = mockFetch;

      const res = await adminApi.listTeacherApplications();
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('FORBIDDEN');
      expect(res.error?.message).toContain('未具備管理員權限');
    });

    it('handles 500 Internal Server Error without leaking internal server details', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '系統發生非預期錯誤，請稍後再試',
          },
        }),
      });
      (globalThis as any).fetch = mockFetch;

      const res = await classroomApi.getMyTeachingClassrooms();
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('INTERNAL_SERVER_ERROR');
      expect((res.error as any)?.stack).toBeUndefined();
    });

    it('handles Network Offline / Fetch Failure safely without crashing the UI thread', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (Network offline)'));
      (globalThis as any).fetch = mockFetch;

      const res = await classroomApi.joinClassroom('ABCDEFGH');
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('NETWORK_ERROR');
      expect(res.error?.message).toContain('無法連線至伺服器');
    });
  });

  describe('2. Empty State Resilience & Handling', () => {
    it('handles empty classroom list gracefully without runtime exceptions', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          data: { classrooms: [] },
        }),
      });
      (globalThis as any).fetch = mockFetch;

      const res = await classroomApi.getMyTeachingClassrooms();
      expect(res.success).toBe(true);
      expect(res.data?.classrooms).toEqual([]);
    });

    it('handles empty notification center cleanly', () => {
      mockLocalStorage.setItem('ctk_notifications:empty-user', JSON.stringify([]));
      const notifs = getNotifications('empty-user');
      expect(notifs).toEqual([]);
    });
  });

  describe('3. Storage Error Recovery & Resilience', () => {
    it('handles corrupted malformed JSON in storage safely with fallback empty array without throwing', () => {
      mockLocalStorage.setItem('ctk_notifications:corrupt-user', '{not_valid_json_at_all!!');
      const notifs = getNotifications('corrupt-user');
      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs).toEqual([]);
    });

    it('supports addNotification and clearReadNotifications cycle safely', () => {
      const userId = 'cycle-user';
      addNotification(userId, {
        title: '測試通知',
        message: '這是一則測試通知',
        category: 'system',
      });

      let current = getNotifications(userId);
      const targetId = current[0].id;

      // Clear read notifications when all are unread keeps the unread ones
      clearReadNotifications(userId);
      current = getNotifications(userId);
      expect(current.some((n) => n.id === targetId)).toBe(true);
    });
  });
});
