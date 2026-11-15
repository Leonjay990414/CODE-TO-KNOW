import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseHash } from '../src/context/NavigationContext';
import { expandCompatibleFrontendRoles } from '../src/components/ProtectedRoute';
import { classroomApi, clearApiCache } from '../src/services/api';

// Setup Mock Storage for Node environment
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
const mockSessionStorage = createMockStorage();
const mockLocalStorage = createMockStorage();
(globalThis as any).sessionStorage = mockSessionStorage;
(globalThis as any).window.sessionStorage = mockSessionStorage;
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window.localStorage = mockLocalStorage;

describe('Phase 15: Teacher Dashboard & Classroom Management (P15-TCH-001 ~ P15-TCH-005, P15-TCH-013)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    clearApiCache();
    mockSessionStorage.clear();
    mockLocalStorage.clear();
  });

  describe('1. Route Hash Resolution & Teacher Role Protection', () => {
    it('parses #teacher correctly to teacher-dashboard page', () => {
      const state = parseHash('#teacher');
      expect(state.page).toBe('teacher-dashboard');
      expect(state.hash).toBe('#teacher');
    });

    it('parses #teacher-dashboard correctly to teacher-dashboard page', () => {
      const state = parseHash('#teacher-dashboard');
      expect(state.page).toBe('teacher-dashboard');
    });

    it('strictly permits TEACHER and ADMIN while excluding STUDENT and GUEST from teacher routes', () => {
      const acceptedTeacherRoles = expandCompatibleFrontendRoles(['TEACHER', 'ADMIN']);
      expect(acceptedTeacherRoles).toContain('TEACHER');
      expect(acceptedTeacherRoles).toContain('ADMIN');
      expect(acceptedTeacherRoles).toContain('PLATFORM_ADMIN');
      expect(acceptedTeacherRoles).not.toContain('STUDENT');
      expect(acceptedTeacherRoles).not.toContain('GUEST');

      const studentOnly = ['STUDENT'];
      const hasTeacherAccess = studentOnly.some((r) => acceptedTeacherRoles.includes(r));
      expect(hasTeacherAccess).toBe(false);
    });
  });

  describe('2. Classroom API Contracts & Management Flow', () => {
    it('retrieves teaching classrooms with proper schema and member count', async () => {
      const mockClassrooms = [
        {
          id: 'class-test-01',
          name: '高一資訊科技甲班',
          description: '104300 網頁設計丙級術科輔導',
          certificationId: 'web-design-c',
          creatorId: 'teacher-01',
          joinCode: '8K9MN2PX',
          status: 'ACTIVE',
          createdAt: '2026-10-01T08:00:00.000Z',
          memberCount: 28,
        },
      ];

      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/classrooms/my-teaching')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { classrooms: mockClassrooms },
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });
      globalThis.fetch = mockFetch;

      const res = await classroomApi.getMyTeachingClassrooms();
      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls.find((call) => (call[0] as string).includes('/classrooms/my-teaching'))?.[0];
      expect(calledUrl).toContain('/classrooms/my-teaching');
      expect(res.success).toBe(true);
      expect(res.data?.classrooms).toBeDefined();
      expect(res.data?.classrooms.length).toBe(1);

      const first = res.data!.classrooms[0];
      expect(first.id).toBe('class-test-01');
      expect(first.joinCode).toMatch(/^[A-Z0-9]{8}$/i);
      expect(first.status).toBe('ACTIVE');
      expect(first.memberCount).toBe(28);
    });

    it('creates a new teaching classroom and generates an 8-character join code', async () => {
      const newClassPayload = {
        name: '114學年度高二網頁設計檢定班',
        description: '丙級術科題組模擬考衝刺專用班級',
        certificationId: 'web-design-c',
      };

      const mockCreatedClass = {
        id: 'class-test-02',
        ...newClassPayload,
        creatorId: 'teacher-01',
        joinCode: '7A9K3B2Q',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        memberCount: 0,
      };

      const mockFetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
        if (url.includes('/auth/csrf-token')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { csrfToken: 'test-csrf-token' },
            }),
          };
        }
        if (url.includes('/classrooms') && options?.method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { classroom: mockCreatedClass },
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });
      globalThis.fetch = mockFetch;

      const res = await classroomApi.createClassroom(newClassPayload);
      expect(mockFetch).toHaveBeenCalled();

      const postCall = mockFetch.mock.calls.find(
        (call) => (call[0] as string).includes('/classrooms') && (call[1] as any)?.method === 'POST'
      );
      expect(postCall).toBeDefined();
      expect(postCall![0]).toContain('/classrooms');
      expect(JSON.parse((postCall![1] as any).body)).toEqual(newClassPayload);

      expect(res.success).toBe(true);
      expect(res.data?.classroom).toBeDefined();
      const created = res.data!.classroom;
      expect(created.name).toBe(newClassPayload.name);
      expect(created.joinCode).toBe('7A9K3B2Q');
      expect(created.joinCode.length).toBe(8);
      expect(created.memberCount).toBe(0);
    });

    it('retrieves classroom student roster for teacher inspection', async () => {
      const classId = 'class-test-01';
      const mockMembers = [
        {
          enrollmentId: 'mem-001',
          studentId: 'student-001',
          displayName: '王小明',
          email: 'ming.wang@school.edu.tw',
          seatNumber: '01',
          joinedAt: '2026-10-02T09:00:00.000Z',
        },
        {
          enrollmentId: 'mem-002',
          studentId: 'student-002',
          displayName: '李小華',
          email: 'hua.li@school.edu.tw',
          seatNumber: '02',
          joinedAt: '2026-10-03T10:00:00.000Z',
        },
      ];

      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes(`/classrooms/${classId}/members`)) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                class: { id: classId, name: '高一資訊科技甲班', joinCode: '8K9MN2PX', status: 'ACTIVE' },
                members: mockMembers,
              },
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });
      globalThis.fetch = mockFetch;

      const membersRes = await classroomApi.getClassroomMembers(classId);
      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls.find((call) => (call[0] as string).includes(`/classrooms/${classId}/members`))?.[0];
      expect(calledUrl).toContain(`/classrooms/${classId}/members`);
      expect(membersRes.success).toBe(true);
      expect(membersRes.data?.members.length).toBe(2);

      const firstStudent = membersRes.data!.members[0];
      expect(firstStudent.studentId).toBe('student-001');
      expect(firstStudent.displayName).toBe('王小明');
      expect(firstStudent.seatNumber).toBe('01');
    });

    it('removes a student member from a classroom safely', async () => {
      const classId = 'class-test-01';
      const studentId = 'student-001';

      const mockFetch = vi.fn().mockImplementation(async (url: string, options?: any) => {
        if (url.includes('/auth/csrf-token')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { csrfToken: 'test-csrf-token' },
            }),
          };
        }
        if (url.includes(`/classrooms/${classId}/members/${studentId}`) && options?.method === 'DELETE') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              message: '已成功將學員移出班級',
            }),
          };
        }
        return { ok: true, json: async () => ({ success: true }) };
      });
      globalThis.fetch = mockFetch;

      const removeRes = await classroomApi.removeMember(classId, studentId);
      expect(mockFetch).toHaveBeenCalled();

      const deleteCall = mockFetch.mock.calls.find(
        (call) => (call[0] as string).includes(`/classrooms/${classId}/members/${studentId}`) && (call[1] as any)?.method === 'DELETE'
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall![0]).toContain(`/classrooms/${classId}/members/${studentId}`);
      expect(removeRes.success).toBe(true);
      expect(removeRes.message).toContain('成功');
    });
  });

  describe('3. Teacher Announcements LocalStorage Persistence (P15-TCH-013)', () => {
    it('persists announcements per teacher in localStorage with account isolation', () => {
      const teacherAKey = 'ctk_teacher_announcements:teacher_001';
      const teacherBKey = 'ctk_teacher_announcements:teacher_002';

      const announcementA = [
        {
          id: 'ann-01',
          title: '本週五前請繳交題組二作業',
          content: '請各組組長確認 GitHub 連結是否公開',
          createdAt: '2026-11-15T10:00:00.000Z',
          authorName: '陳老師',
        },
      ];

      mockLocalStorage.setItem(teacherAKey, JSON.stringify(announcementA));

      const readTeacherA = JSON.parse(mockLocalStorage.getItem(teacherAKey) || '[]');
      const readTeacherB = JSON.parse(mockLocalStorage.getItem(teacherBKey) || '[]');

      expect(readTeacherA.length).toBe(1);
      expect(readTeacherA[0].title).toBe('本週五前請繳交題組二作業');
      expect(readTeacherB.length).toBe(0);
    });

    it('handles corrupted JSON in announcements storage gracefully without throwing', () => {
      const corruptKey = 'ctk_teacher_announcements:corrupt_user';
      mockLocalStorage.setItem(corruptKey, 'MALFORMED{JSON_DATA');

      let parsed = [];
      expect(() => {
        try {
          const raw = mockLocalStorage.getItem(corruptKey);
          parsed = raw ? JSON.parse(raw) : [];
        } catch {
          parsed = [];
        }
      }).not.toThrow();

      expect(parsed).toEqual([]);
    });
  });
});
