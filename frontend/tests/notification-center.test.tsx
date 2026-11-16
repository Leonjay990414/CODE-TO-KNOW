import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Polyfill in-memory localStorage & window for Node test runner
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
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
}
// @ts-expect-error Mocking window.localStorage
globalThis.window.localStorage = mockLocalStorage;

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearReadNotifications,
  addNotification,
} from '../src/utils/notificationStorage';
import { NotificationCenterModal } from '../src/components/NotificationCenterModal';

describe('Wave 6 Batch 1: In-App Notification Center (P10-EML-007)', () => {
  const TEST_USER = 'test-student-w6';

  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. notificationStorage Logic & User Isolation', () => {
    it('seeds default notifications on initial access with categories and routes', () => {
      const list = getNotifications(TEST_USER);
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(list[0]).toHaveProperty('id');
      expect(list[0]).toHaveProperty('title');
      expect(list[0].isRead).toBe(false);
      expect(getUnreadCount(TEST_USER)).toBe(list.length);

      const categories = list.map((n) => n.category);
      expect(categories).toContain('system');
      expect(categories).toContain('exam');
      expect(categories).toContain('classroom');
      expect(categories).toContain('achievement');
    });

    it('marks a single notification as read and updates unread count', () => {
      const list = getNotifications(TEST_USER);
      const targetId = list[0].id;
      const updated = markAsRead(TEST_USER, targetId);
      const target = updated.find((n) => n.id === targetId);
      expect(target?.isRead).toBe(true);
      expect(getUnreadCount(TEST_USER)).toBe(list.length - 1);
    });

    it('marks all notifications as read', () => {
      getNotifications(TEST_USER);
      const updated = markAllAsRead(TEST_USER);
      expect(updated.every((n) => n.isRead)).toBe(true);
      expect(getUnreadCount(TEST_USER)).toBe(0);
    });

    it('clears read notifications while preserving unread ones', () => {
      const list = getNotifications(TEST_USER);
      markAsRead(TEST_USER, list[0].id);
      const remaining = clearReadNotifications(TEST_USER);
      expect(remaining.length).toBe(list.length - 1);
      expect(remaining.every((n) => !n.isRead)).toBe(true);
    });

    it('adds a new notification and places it at the top', () => {
      const newNotif = addNotification(TEST_USER, {
        category: 'exam',
        title: '明日模擬考提醒',
        content: '請於 09:00 前進入系統進行模擬測驗',
        actionRoute: '#mock-exam',
        actionLabel: '前往測驗',
      });
      const list = getNotifications(TEST_USER);
      expect(list[0].id).toBe(newNotif.id);
      expect(list[0].title).toBe('明日模擬考提醒');
      expect(list[0].isRead).toBe(false);
    });

    it('guarantees user-scoped isolation in localStorage', () => {
      const userA = 'student-alice';
      const userB = 'student-bob';

      addNotification(userA, {
        category: 'classroom',
        title: 'Alice 班級邀請',
        content: '班級 8 碼邀請碼已核發',
      });

      const listA = getNotifications(userA);
      const listB = getNotifications(userB);

      const hasAliceInB = listB.some((n) => n.title === 'Alice 班級邀請');
      expect(hasAliceInB).toBe(false);
      const hasAliceInA = listA.some((n) => n.title === 'Alice 班級邀請');
      expect(hasAliceInA).toBe(true);
    });

    it('handles corrupted JSON in localStorage gracefully without throwing', () => {
      mockLocalStorage.setItem(`ctk_notifications:${TEST_USER}`, 'INVALID_CORRUPT{JSON');
      const list = getNotifications(TEST_USER);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(0);
    });
  });

  describe('2. NotificationCenterModal Component & Accessibility', () => {
    it('does not render when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <NotificationCenterModal
          isOpen={false}
          onClose={() => {}}
          userId={TEST_USER}
        />
      );
      expect(html).toBe('');
    });

    it('renders with role="dialog", aria-modal="true", and aria-label', () => {
      const html = renderToStaticMarkup(
        <NotificationCenterModal
          isOpen={true}
          onClose={() => {}}
          userId={TEST_USER}
        />
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-label="站內通知中心"');
      expect(html).toContain('站內通知中心');
      expect(html).toContain('系統公告');
      expect(html).toContain('測驗提醒');
      expect(html).toContain('班級通知');
      expect(html).toContain('學習成就');
      expect(html).toContain('通知紀錄保存於當前瀏覽器本機');
    });

    it('renders category filter buttons and action buttons', () => {
      const html = renderToStaticMarkup(
        <NotificationCenterModal
          isOpen={true}
          onClose={() => {}}
          userId={TEST_USER}
        />
      );

      expect(html).toContain('全部');
      expect(html).toContain('系統公告');
      expect(html).toContain('關閉通知中心');
    });
  });
});
