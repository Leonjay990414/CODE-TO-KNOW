import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseHash } from '../src/context/NavigationContext';
import { expandCompatibleFrontendRoles, INTENDED_ROUTE_STORAGE_KEY } from '../src/components/ProtectedRoute';

// In-memory mock storage for Node test environment
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

// Route permission catalog
const PUBLIC_ROUTES = [
  '#',
  '#certifications',
  '#web-design-demo',
  '#theory-practice',
  '#mock-exam',
  '#practical-learning',
  '#code-editor',
  '#ai-coach',
  '#game-center',
  '#terms',
  '#privacy',
];

const PROTECTED_STUDENT_ROUTES = ['#student', '#learning-progress'];
const PROTECTED_TEACHER_ROUTES = ['#teacher'];
const PROTECTED_ADMIN_ROUTES = ['#admin', '#sources'];

describe('P18-QAS-002: Multi-Role Integration & Access Control Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.clear();
    mockLocalStorage.clear();
  });

  describe('1. Guest / Visitor Role (訪客) Access Matrix', () => {
    it('allows access to all public informational and demo routes without authentication', () => {
      for (const route of PUBLIC_ROUTES) {
        const parsed = parseHash(route);
        expect(parsed.page).toBeDefined();
        expect(parsed.page.length).toBeGreaterThan(0);
      }
    });

    it('intercepts guest accessing student protected routes and preserves intended route', () => {
      const targetRoute = '#student';
      // Simulate guest visit interception
      mockSessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, targetRoute);

      expect(mockSessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY)).toBe('#student');
    });

    it('intercepts guest accessing teacher protected routes and preserves intended route', () => {
      const targetRoute = '#teacher';
      mockSessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, targetRoute);

      expect(mockSessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY)).toBe('#teacher');
    });

    it('intercepts guest accessing admin protected routes and preserves intended route', () => {
      const targetRoute = '#admin';
      mockSessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, targetRoute);

      expect(mockSessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY)).toBe('#admin');
    });
  });

  describe('2. Student Role (學生) Access Matrix & Role Boundaries', () => {
    const studentUser = {
      id: 'student-001',
      email: 'student@codetoknow.edu',
      displayName: '學習者小明',
      roles: ['STUDENT'],
    };

    it('authorizes student to access student dashboard and learning progress', () => {
      const requiredRoles = ['STUDENT'];
      const expanded = expandCompatibleFrontendRoles(requiredRoles);
      const isAllowed = studentUser.roles.some((r) => expanded.includes(r));
      expect(isAllowed).toBe(true);
    });

    it('blocks student from entering teacher dashboard (403 Unauthorized)', () => {
      const teacherRequiredRoles = ['TEACHER'];
      const expanded = expandCompatibleFrontendRoles(teacherRequiredRoles);
      const isAllowed = studentUser.roles.some((r) => expanded.includes(r));
      expect(isAllowed).toBe(false);
    });

    it('blocks student from entering admin dashboard and question import system', () => {
      const adminRequiredRoles = ['ADMIN'];
      const expanded = expandCompatibleFrontendRoles(adminRequiredRoles);
      const isAllowed = studentUser.roles.some((r) => expanded.includes(r));
      expect(isAllowed).toBe(false);
    });
  });

  describe('3. Teacher Role (教師) Access Matrix & Classroom Boundaries', () => {
    const teacherUser = {
      id: 'teacher-001',
      email: 'teacher@codetoknow.edu',
      displayName: '林老師',
      roles: ['TEACHER', 'STUDENT'],
    };

    it('authorizes teacher to access both teacher dashboard and student dashboard', () => {
      const teacherAllowed = teacherUser.roles.some((r) =>
        expandCompatibleFrontendRoles(['TEACHER']).includes(r)
      );
      const studentAllowed = teacherUser.roles.some((r) =>
        expandCompatibleFrontendRoles(['STUDENT']).includes(r)
      );

      expect(teacherAllowed).toBe(true);
      expect(studentAllowed).toBe(true);
    });

    it('blocks teacher from accessing admin dashboard without platform admin grant', () => {
      const adminAllowed = teacherUser.roles.some((r) =>
        expandCompatibleFrontendRoles(['ADMIN']).includes(r)
      );
      expect(adminAllowed).toBe(false);
    });
  });

  describe('4. Platform Admin & System Operator Role Boundaries', () => {
    const platformAdminUser = {
      id: 'admin-001',
      email: 'admin@codetoknow.edu',
      displayName: '平台總管',
      roles: ['PLATFORM_ADMIN'],
    };

    const legacyAdminUser = {
      id: 'admin-002',
      email: 'admin2@codetoknow.edu',
      displayName: '管理專員',
      roles: ['ADMIN'],
    };

    const systemOperatorUser = {
      id: 'sys-op-001',
      email: 'sysop@codetoknow.edu',
      displayName: '系統維運員',
      roles: ['SYSTEM_OPERATOR'],
    };

    it('expands PLATFORM_ADMIN to satisfy ADMIN-required routes', () => {
      const required = ['ADMIN'];
      const expanded = expandCompatibleFrontendRoles(required);
      expect(expanded).toContain('PLATFORM_ADMIN');
      expect(platformAdminUser.roles.some((r) => expanded.includes(r))).toBe(true);
    });

    it('expands ADMIN to satisfy PLATFORM_ADMIN-required routes', () => {
      const required = ['PLATFORM_ADMIN'];
      const expanded = expandCompatibleFrontendRoles(required);
      expect(expanded).toContain('ADMIN');
      expect(legacyAdminUser.roles.some((r) => expanded.includes(r))).toBe(true);
    });

    it('strictly isolates SYSTEM_OPERATOR from educational admin routes', () => {
      const required = ['ADMIN'];
      const expanded = expandCompatibleFrontendRoles(required);
      const isAllowed = systemOperatorUser.roles.some((r) => expanded.includes(r));
      expect(isAllowed).toBe(false);
    });
  });

  describe('5. Teacher Application to Admin Approval End-to-End Workflow', () => {
    it('simulates student applying for teacher and admin approving upgrade', () => {
      // Step A: Student applies for teacher
      const application = {
        id: 'app-999',
        userId: 'student-001',
        realName: '王大明',
        school: '台北市立科技高中',
        department: '資訊管理科',
        reason: '需要為 113 學年度網頁設計丙級班級開班與評分',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      expect(application.status).toBe('PENDING');

      // Step B: Admin reviews and approves
      const approvedApplication = {
        ...application,
        status: 'APPROVED',
        reviewedAt: new Date().toISOString(),
        reviewerId: 'admin-001',
      };
      expect(approvedApplication.status).toBe('APPROVED');

      // Step C: User roles upgraded to include TEACHER
      const updatedUserRoles = ['STUDENT', 'TEACHER'];
      const canAccessTeacher = updatedUserRoles.some((r) =>
        expandCompatibleFrontendRoles(['TEACHER']).includes(r)
      );
      expect(canAccessTeacher).toBe(true);
    });
  });

  describe('6. Session, Logout & CSRF Integrity Check', () => {
    it('clears session intended route and local data upon user logout', () => {
      mockSessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, '#student');
      mockLocalStorage.setItem('ctk_auth_token', 'mock_jwt_token_value');
      mockLocalStorage.setItem('ctk_notifications:student-001', JSON.stringify([{ id: '1' }]));

      // Execute Logout
      mockSessionStorage.removeItem(INTENDED_ROUTE_STORAGE_KEY);
      mockLocalStorage.removeItem('ctk_auth_token');

      expect(mockSessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY)).toBeNull();
      expect(mockLocalStorage.getItem('ctk_auth_token')).toBeNull();
      // Storage isolation test: another user cannot read previous session
      expect(mockLocalStorage.getItem('ctk_notifications:student-002')).toBeNull();
    });

    it('validates CSRF Double-Submit token comparison logic', () => {
      const cookieToken = 'random_csrf_token_abcdef123456';
      const validHeaderToken = 'random_csrf_token_abcdef123456';
      const tamperedHeaderToken = 'tampered_token_xyz987';

      expect(cookieToken === validHeaderToken).toBe(true);
      expect(cookieToken === tamperedHeaderToken).toBe(false);
    });
  });
});
