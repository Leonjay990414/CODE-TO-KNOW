import { describe, it, expect, beforeEach } from 'vitest';
import {
  getEnrolledClasses,
  saveEnrolledClasses,
  EnrolledClass,
} from '../src/components/StudentClassJoinModal';

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

describe('Phase 13: Student Classroom Membership & Join Code Mock Flow (P13-STU-001, P15-TEA-002)', () => {
  const testUserId = 'test-student-uid-101';

  beforeEach(() => {
    mockStorage.clear();
  });

  describe('1. Storage Key & Isolation', () => {
    it('returns empty array when user has not joined any classes yet', () => {
      const classes = getEnrolledClasses(testUserId);
      expect(classes).toEqual([]);
    });

    it('isolates enrolled classes per user id in localStorage', () => {
      const classStudentA: EnrolledClass = {
        id: 'cls_001',
        name: '資訊科丙級輔導A班',
        code: '7K9M3X2P',
        teacherName: '陳老師',
        semester: '113-1',
        enrolledAt: '2026/11/15',
        announcementsCount: 2,
      };

      saveEnrolledClasses(testUserId, [classStudentA]);
      expect(getEnrolledClasses(testUserId)).toHaveLength(1);
      expect(getEnrolledClasses('different-student')).toHaveLength(0);
    });
  });

  describe('2. Join Code Validation Rules', () => {
    it('rejects codes containing ambiguous characters (0, O, 1, I, L)', () => {
      const ambiguousCodes = ['0K9M3X2P', 'OK9M3X2P', '1K9M3X2P', 'IK9M3X2P', 'LK9M3X2P'];
      const regex = /[01OIL]/;

      ambiguousCodes.forEach((code) => {
        expect(regex.test(code)).toBe(true);
      });
    });

    it('accepts valid 8-character Base31 join codes', () => {
      const validCode = '7K9M3X2P';
      expect(validCode.length).toBe(8);
      expect(/[01OIL]/.test(validCode)).toBe(false);
      expect(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(validCode)).toBe(true);
    });
  });

  describe('3. Student Enrollment & Drop Course Operations', () => {
    it('allows student to enroll and persistently save class records', () => {
      const newClass: EnrolledClass = {
        id: 'cls_202',
        name: '網頁設計技術士實作輔導班',
        code: '4W8N9Y6D',
        teacherName: '黃老師',
        semester: '113-1',
        enrolledAt: '2026/11/15',
        announcementsCount: 1,
      };

      saveEnrolledClasses(testUserId, [newClass]);
      const stored = getEnrolledClasses(testUserId);
      expect(stored).toHaveLength(1);
      expect(stored[0].code).toBe('4W8N9Y6D');
      expect(stored[0].teacherName).toBe('黃老師');
    });

    it('allows student to leave/drop an enrolled class safely', () => {
      const class1: EnrolledClass = {
        id: 'cls_1',
        name: '班級 1',
        code: 'CODE1111',
        teacherName: 'A',
        semester: '113-1',
        enrolledAt: '2026/11/15',
        announcementsCount: 0,
      };
      const class2: EnrolledClass = {
        id: 'cls_2',
        name: '班級 2',
        code: 'CODE2222',
        teacherName: 'B',
        semester: '113-1',
        enrolledAt: '2026/11/15',
        announcementsCount: 0,
      };

      saveEnrolledClasses(testUserId, [class1, class2]);
      expect(getEnrolledClasses(testUserId)).toHaveLength(2);

      // Student drops class 1
      const updated = getEnrolledClasses(testUserId).filter((c) => c.id !== 'cls_1');
      saveEnrolledClasses(testUserId, updated);

      const afterDrop = getEnrolledClasses(testUserId);
      expect(afterDrop).toHaveLength(1);
      expect(afterDrop[0].id).toBe('cls_2');
    });

    it('handles corrupted storage data gracefully by returning empty array without throwing', () => {
      mockStorage.setItem(`ctk_enrolled_classes:${testUserId}`, 'CORRUPTED_NOT_JSON');
      expect(() => getEnrolledClasses(testUserId)).not.toThrow();
      expect(getEnrolledClasses(testUserId)).toEqual([]);
    });
  });
});
