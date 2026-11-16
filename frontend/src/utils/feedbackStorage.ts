/**
 * CODE TO KNOW (碼上學) User Feedback Storage Utility
 * (P20-OPS-005: 建立教師與學生回饋收集、分類、排程及回覆機制)
 *
 * NOTE: This is client-side local storage buffering and offline fallback.
 * It is NOT a live cloud telemetry or remote analytics database.
 */

export type FeedbackCategory = 'bug' | 'content' | 'feature' | 'exam' | 'general';
export type FeedbackStatus = 'NEW' | 'REVIEWED' | 'SCHEDULED' | 'RESOLVED';

export interface FeedbackItem {
  id: string;
  userId?: string;
  userRole?: string;
  category: FeedbackCategory;
  rating: number; // 1 to 5
  title: string;
  content: string;
  contactEmail?: string;
  createdAt: string;
  status: FeedbackStatus;
}

export const FEEDBACK_STORAGE_KEY = 'ctk_user_feedbacks';

/**
 * Get all stored feedback items safely
 */
export function getFeedbacks(): FeedbackItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[FeedbackStorage] Failed to parse stored feedback, returning empty array:', err);
    return [];
  }
}

/**
 * Submit and save a new user feedback item
 */
export function submitFeedback(input: {
  userId?: string;
  userRole?: string;
  category: FeedbackCategory;
  rating: number;
  title: string;
  content: string;
  contactEmail?: string;
}): FeedbackItem {
  const newFeedback: FeedbackItem = {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    userId: input.userId || 'anonymous',
    userRole: input.userRole || 'GUEST',
    category: input.category,
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    title: input.title.trim(),
    content: input.content.trim(),
    contactEmail: input.contactEmail?.trim(),
    createdAt: new Date().toISOString(),
    status: 'NEW',
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const list = getFeedbacks();
      list.unshift(newFeedback);
      // Keep up to 100 local buffered feedback items
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
    } catch (err) {
      console.error('[FeedbackStorage] Failed to save feedback item:', err);
    }
  }

  return newFeedback;
}

/**
 * Filter feedback items by category
 */
export function getFeedbacksByCategory(category: FeedbackCategory): FeedbackItem[] {
  return getFeedbacks().filter((item) => item.category === category);
}

/**
 * Clear buffered feedbacks (for testing or administrative cleanups)
 */
export function clearFeedbacks(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
