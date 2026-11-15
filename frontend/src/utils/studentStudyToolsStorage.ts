/**
 * CODE TO KNOW (碼上學) - 學生個人學習工具本機儲存模組 (LocalStorage)
 * 負責：題庫題目收藏 (Bookmarks)、題目個人筆記 (Personal Notes)、最近瀏覽歷史 (Recent Views)
 * 嚴格遵循：帳號隔離、schemaVersion 控制、毀損自動防護、無效 JSON 容錯
 */

export interface QuestionNoteItem {
  questionId: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecentStudyViewItem {
  id: string;
  title: string;
  type: 'theory' | 'practical' | 'mock-exam' | 'game';
  path: string;
  viewedAt: string;
}

const STORAGE_BOOKMARKS_PREFIX = 'ctk_student_bookmarks';
const STORAGE_NOTES_PREFIX = 'ctk_student_notes';
const STORAGE_RECENT_PREFIX = 'ctk_student_recent_views';
export const CURRENT_SCHEMA_VERSION = 1;

function getSafeUserId(userId?: string): string {
  return userId && userId.trim() !== '' ? userId.trim() : 'guest-anonymous';
}

// =============================================================================
// 1. 題目收藏 (Bookmarks / Favorites)
// =============================================================================

export function getBookmarksStorageKey(userId?: string): string {
  return `${STORAGE_BOOKMARKS_PREFIX}:${getSafeUserId(userId)}`;
}

export function getQuestionBookmarks(userId?: string): Set<string> {
  const key = getBookmarksStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return new Set();
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id: unknown) => typeof id === 'string'));
    }
    return new Set();
  } catch (err) {
    console.warn(`[StudentStudyTools] 無法讀取收藏紀錄 (${key}):`, err);
    return new Set();
  }
}

export function saveQuestionBookmarks(userId: string | undefined, bookmarks: Set<string>): boolean {
  const key = getBookmarksStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const arr = Array.from(bookmarks);
    window.localStorage.setItem(key, JSON.stringify(arr));
    return true;
  } catch (err) {
    console.warn(`[StudentStudyTools] 儲存收藏紀錄失敗:`, err);
    return false;
  }
}

export function toggleQuestionBookmark(userId: string | undefined, questionId: string): boolean {
  if (!questionId) return false;
  const current = getQuestionBookmarks(userId);
  const isBookmarked = current.has(questionId);
  if (isBookmarked) {
    current.delete(questionId);
  } else {
    current.add(questionId);
  }
  saveQuestionBookmarks(userId, current);
  return !isBookmarked; // returns new bookmarked state
}

export function isQuestionBookmarked(userId: string | undefined, questionId: string): boolean {
  if (!questionId) return false;
  return getQuestionBookmarks(userId).has(questionId);
}

// =============================================================================
// 2. 個人筆記 (Personal Notes)
// =============================================================================

export function getNotesStorageKey(userId?: string): string {
  return `${STORAGE_NOTES_PREFIX}:${getSafeUserId(userId)}`;
}

export function getAllQuestionNotes(userId?: string): Record<string, QuestionNoteItem> {
  const key = getNotesStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {};
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Record<string, QuestionNoteItem> = {};
      for (const [qId, item] of Object.entries(parsed)) {
        if (item && typeof item === 'object' && 'noteText' in item) {
          result[qId] = item as QuestionNoteItem;
        }
      }
      return result;
    }
    return {};
  } catch (err) {
    console.warn(`[StudentStudyTools] 無法讀取個人筆記 (${key}):`, err);
    return {};
  }
}

export function getQuestionNote(userId: string | undefined, questionId: string): string {
  if (!questionId) return '';
  const notes = getAllQuestionNotes(userId);
  return notes[questionId]?.noteText || '';
}

export function saveQuestionNote(userId: string | undefined, questionId: string, noteText: string): boolean {
  if (!questionId) return false;
  const key = getNotesStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const notes = getAllQuestionNotes(userId);
    const trimmed = noteText.trim();

    if (!trimmed) {
      // Empty note: delete
      delete notes[questionId];
    } else {
      const now = new Date().toISOString();
      const existing = notes[questionId];
      notes[questionId] = {
        questionId,
        noteText: trimmed,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
    }

    window.localStorage.setItem(key, JSON.stringify(notes));
    return true;
  } catch (err) {
    console.warn(`[StudentStudyTools] 儲存個人筆記失敗:`, err);
    return false;
  }
}

export function deleteQuestionNote(userId: string | undefined, questionId: string): boolean {
  return saveQuestionNote(userId, questionId, '');
}

// =============================================================================
// 3. 最近瀏覽學習歷史 (Recent Views)
// =============================================================================

export function getRecentViewsStorageKey(userId?: string): string {
  return `${STORAGE_RECENT_PREFIX}:${getSafeUserId(userId)}`;
}

export function getRecentViews(userId?: string, limit: number = 10): RecentStudyViewItem[] {
  const key = getRecentViewsStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, limit);
    }
    return [];
  } catch (err) {
    console.warn(`[StudentStudyTools] 無法讀取最近瀏覽紀錄 (${key}):`, err);
    return [];
  }
}

export function recordRecentView(
  userId: string | undefined,
  item: Omit<RecentStudyViewItem, 'viewedAt'>
): void {
  const key = getRecentViewsStorageKey(userId);
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    const list = getRecentViews(userId, 20);
    const newEntry: RecentStudyViewItem = {
      ...item,
      viewedAt: new Date().toISOString(),
    };

    // Filter out item with same id to place newest at front
    const filtered = list.filter((v) => v.id !== item.id);
    const updated = [newEntry, ...filtered].slice(0, 10);
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn(`[StudentStudyTools] 寫入最近瀏覽紀錄失敗:`, err);
  }
}
