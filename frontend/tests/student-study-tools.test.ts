import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBookmarksStorageKey,
  getQuestionBookmarks,
  toggleQuestionBookmark,
  isQuestionBookmarked,
  getNotesStorageKey,
  getAllQuestionNotes,
  getQuestionNote,
  saveQuestionNote,
  deleteQuestionNote,
  getRecentViewsStorageKey,
  getRecentViews,
  recordRecentView,
} from '../src/utils/studentStudyToolsStorage';

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

describe('Student Study Tools LocalStorage (P13-STU-001, P13-STU-010)', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('Bookmarks / Favorites Management', () => {
    it('isolates bookmarks by userId and falls back to guest-anonymous', () => {
      const userKey = getBookmarksStorageKey('student_001');
      const guestKey = getBookmarksStorageKey('');
      expect(userKey).toBe('ctk_student_bookmarks:student_001');
      expect(guestKey).toBe('ctk_student_bookmarks:guest-anonymous');
    });

    it('toggles bookmarks correctly and reports bookmark status', () => {
      expect(isQuestionBookmarked('user1', 'q_101')).toBe(false);

      const added = toggleQuestionBookmark('user1', 'q_101');
      expect(added).toBe(true);
      expect(isQuestionBookmarked('user1', 'q_101')).toBe(true);
      expect(getQuestionBookmarks('user1').has('q_101')).toBe(true);

      const removed = toggleQuestionBookmark('user1', 'q_101');
      expect(removed).toBe(false);
      expect(isQuestionBookmarked('user1', 'q_101')).toBe(false);
    });

    it('handles multiple questions and isolates between different users', () => {
      toggleQuestionBookmark('user1', 'q_1');
      toggleQuestionBookmark('user1', 'q_2');
      toggleQuestionBookmark('user2', 'q_3');

      const u1 = getQuestionBookmarks('user1');
      const u2 = getQuestionBookmarks('user2');

      expect(u1.size).toBe(2);
      expect(u1.has('q_1')).toBe(true);
      expect(u1.has('q_2')).toBe(true);
      expect(u2.size).toBe(1);
      expect(u2.has('q_3')).toBe(true);
      expect(u2.has('q_1')).toBe(false);
    });

    it('gracefully handles corrupted JSON in localStorage', () => {
      mockStorage.setItem(getBookmarksStorageKey('corruptUser'), '{invalid-json');
      const set = getQuestionBookmarks('corruptUser');
      expect(set.size).toBe(0);
    });
  });

  describe('Personal Notes Management', () => {
    it('saves, retrieves, updates and deletes question notes', () => {
      expect(getQuestionNote('user1', 'q_101')).toBe('');

      saveQuestionNote('user1', 'q_101', '重要：浮動元素排版需加上 clearfix');
      expect(getQuestionNote('user1', 'q_101')).toBe('重要：浮動元素排版需加上 clearfix');

      const all = getAllQuestionNotes('user1');
      expect(all['q_101']).toBeDefined();
      expect(all['q_101'].noteText).toBe('重要：浮動元素排版需加上 clearfix');

      // Update
      saveQuestionNote('user1', 'q_101', '更新：可用 display: flow-root 替代');
      expect(getQuestionNote('user1', 'q_101')).toBe('更新：可用 display: flow-root 替代');

      // Delete
      deleteQuestionNote('user1', 'q_101');
      expect(getQuestionNote('user1', 'q_101')).toBe('');
      expect(getAllQuestionNotes('user1')['q_101']).toBeUndefined();
    });

    it('isolates personal notes between users', () => {
      saveQuestionNote('userA', 'q_1', 'User A Note');
      saveQuestionNote('userB', 'q_1', 'User B Note');

      expect(getQuestionNote('userA', 'q_1')).toBe('User A Note');
      expect(getQuestionNote('userB', 'q_1')).toBe('User B Note');
    });

    it('handles corrupted JSON in notes storage without white screen', () => {
      mockStorage.setItem(getNotesStorageKey('badUser'), 'not_a_json');
      expect(getAllQuestionNotes('badUser')).toEqual({});
      expect(getQuestionNote('badUser', 'q_1')).toBe('');
    });
  });

  describe('Recent Study Views Management', () => {
    it('records recent study views with newest first and deduplicates', () => {
      recordRecentView('user1', {
        id: 'view_1',
        title: '工作項目 01 作業準備',
        type: 'theory',
        path: '#theory',
      });

      recordRecentView('user1', {
        id: 'view_2',
        title: '104301 校園社團介紹網',
        type: 'practical',
        path: '#practical',
      });

      const views = getRecentViews('user1');
      expect(views.length).toBe(2);
      expect(views[0].id).toBe('view_2');
      expect(views[1].id).toBe('view_1');

      // Re-viewing view_1 brings it to top
      recordRecentView('user1', {
        id: 'view_1',
        title: '工作項目 01 作業準備',
        type: 'theory',
        path: '#theory',
      });

      const updated = getRecentViews('user1');
      expect(updated.length).toBe(2);
      expect(updated[0].id).toBe('view_1');
      expect(updated[1].id).toBe('view_2');
    });

    it('limits recent views to 10 items max', () => {
      for (let i = 1; i <= 15; i++) {
        recordRecentView('user1', {
          id: `item_${i}`,
          title: `Item ${i}`,
          type: 'theory',
          path: `#theory?q=${i}`,
        });
      }

      const views = getRecentViews('user1');
      expect(views.length).toBe(10);
      expect(views[0].id).toBe('item_15');
      expect(views[9].id).toBe('item_6');
    });
  });
});
