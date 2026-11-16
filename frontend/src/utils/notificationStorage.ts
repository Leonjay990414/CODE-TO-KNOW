/**
 * CODE TO KNOW - In-App Notification Center Storage Utility
 * Supports P10-EML-007 (站內通知中心與已讀／未讀狀態管理)
 * User-scoped LocalStorage isolation, category filtering, unread counting
 */

export type NotificationCategory = 'system' | 'exam' | 'classroom' | 'achievement';

export interface InAppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  content: string;
  timestamp: number;
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

const STORAGE_PREFIX = 'ctk_notifications:';

export const INITIAL_NOTIFICATIONS: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>[] = [
  {
    category: 'system',
    title: '歡迎加入碼上學學習平台',
    content: '全站 605 題勞動部網頁設計丙級學科題庫與五大術科題組已全面開放自主練習。',
    actionRoute: '#theory',
    actionLabel: '前往學科題庫',
  },
  {
    category: 'exam',
    title: '全真模擬測驗功能開放',
    content: '系統內建考場標準 100 分鐘倒數、隨機抽題與自動閱卷功能，助您提前適應檢定節奏。',
    actionRoute: '#mock-exam',
    actionLabel: '前往模擬測驗',
  },
  {
    category: 'classroom',
    title: '班級邀請碼機制上線',
    content: '學生可於學生中心點擊「加入班級」並輸入教師提供的 8 碼專屬代碼。',
    actionRoute: '#student',
    actionLabel: '前往學生中心',
  },
  {
    category: 'achievement',
    title: '遊戲化學習大廳熱烈開放',
    content: '包含程式碼拼圖、CSS 設計師、除錯獵人等五大教育遊戲，挑戰闖關即可解鎖星等成就！',
    actionRoute: '#games',
    actionLabel: '進入遊戲大廳',
  },
];

function getStorageKey(userId: string): string {
  const safeId = userId && userId.trim() ? userId.trim() : 'guest';
  return `${STORAGE_PREFIX}${safeId}`;
}

export function getNotifications(userId: string): InAppNotification[] {
  const key = getStorageKey(userId);
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    if (!raw) {
      // Seed with initial notifications
      const now = Date.now();
      const seeded: InAppNotification[] = INITIAL_NOTIFICATIONS.map((item, index) => ({
        ...item,
        id: `notif-init-${index + 1}-${now}`,
        timestamp: now - (INITIAL_NOTIFICATIONS.length - index) * 3600000, // spread hours
        isRead: false,
      }));
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(seeded));
      }
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('[NotificationStorage] Failed to parse notifications, returning empty fallback:', err);
    return [];
  }
}

export function getUnreadCount(userId: string): number {
  const list = getNotifications(userId);
  return list.filter((n) => !n.isRead).length;
}

export function markAsRead(userId: string, notificationId: string): InAppNotification[] {
  const key = getStorageKey(userId);
  const current = getNotifications(userId);
  const updated = current.map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item
  );
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[NotificationStorage] Failed to save marked notification:', err);
  }
  return updated;
}

export function markAllAsRead(userId: string): InAppNotification[] {
  const key = getStorageKey(userId);
  const current = getNotifications(userId);
  const updated = current.map((item) => ({ ...item, isRead: true }));
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[NotificationStorage] Failed to mark all as read:', err);
  }
  return updated;
}

export function addNotification(
  userId: string,
  notification: Omit<InAppNotification, 'id' | 'timestamp' | 'isRead'>
): InAppNotification {
  const key = getStorageKey(userId);
  const current = getNotifications(userId);
  const newEntry: InAppNotification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    isRead: false,
  };
  const updated = [newEntry, ...current];
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[NotificationStorage] Failed to add notification:', err);
  }
  return newEntry;
}

export function clearReadNotifications(userId: string): InAppNotification[] {
  const key = getStorageKey(userId);
  const current = getNotifications(userId);
  const updated = current.filter((item) => !item.isRead);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[NotificationStorage] Failed to clear read notifications:', err);
  }
  return updated;
}
