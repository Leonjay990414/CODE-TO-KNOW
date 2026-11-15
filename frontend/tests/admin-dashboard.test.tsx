import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseHash } from '../src/context/NavigationContext';
import { expandCompatibleFrontendRoles } from '../src/components/ProtectedRoute';
import { adminApi } from '../src/services/api';

describe('Admin Dashboard & Operations Module (P15-TCH-001, P16-ADM-001, P16-ADM-005, P16-ADM-006)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('1. Route Hash Resolution & Navigation', () => {
    it('parses #admin correctly to admin-dashboard page', () => {
      const state = parseHash('#admin');
      expect(state.page).toBe('admin-dashboard');
      expect(state.hash).toBe('#admin');
    });

    it('parses #admin-dashboard correctly to admin-dashboard page', () => {
      const state = parseHash('#admin-dashboard');
      expect(state.page).toBe('admin-dashboard');
    });

    it('requires ADMIN role in role hierarchy expansion without unauthorized escalation', () => {
      const studentRoles = expandCompatibleFrontendRoles(['STUDENT']);
      expect(studentRoles).not.toContain('ADMIN');
      expect(studentRoles).not.toContain('PLATFORM_ADMIN');

      const teacherRoles = expandCompatibleFrontendRoles(['TEACHER']);
      expect(teacherRoles).not.toContain('ADMIN');
      expect(teacherRoles).not.toContain('PLATFORM_ADMIN');

      const adminRoles = expandCompatibleFrontendRoles(['ADMIN']);
      expect(adminRoles).toContain('ADMIN');
      expect(adminRoles).toContain('PLATFORM_ADMIN');
      expect(adminRoles).not.toContain('STUDENT');
    });
  });

  describe('2. Admin API Client Contracts (P16-ADM-001, P16-ADM-005)', () => {
    it('lists teacher applications with query parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            applications: [
              {
                id: 'app-001',
                userId: 'user-001',
                schoolName: '國立大安高級工業職業學校',
                subject: '網頁設計',
                reason: '授課輔導',
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await adminApi.listTeacherApplications('PENDING', 1, 10);
      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/admin/teacher-applications');
      expect(calledUrl).toContain('status=PENDING');
      expect(calledUrl).toContain('page=1');
      expect(res.success).toBe(true);
      expect(res.data?.applications.length).toBe(1);
    });

    it('lists immutable security audit logs with operator and action', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            logs: [
              {
                id: 'log-001',
                userId: 'admin-001',
                action: 'TEACHER_APPLICATION_APPROVED',
                details: { school: '國立大安高級工業職業學校' },
                ipAddress: '127.0.0.1',
                userAgent: 'Vitest/Test',
                createdAt: new Date().toISOString(),
                user: { id: 'admin-001', email: 'admin@codetoknow.edu', displayName: '平台管理員' },
              },
            ],
            pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
          },
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await adminApi.listAuditLogs(1, 20);
      expect(mockFetch).toHaveBeenCalled();
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/admin/audit-logs');
      expect(res.success).toBe(true);
      expect(res.data?.logs[0].action).toBe('TEACHER_APPLICATION_APPROVED');
    });

    it('checks system health indicator endpoint contract', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'healthy',
          service: 'CODE TO KNOW API',
          timestamp: new Date().toISOString(),
          database: { status: 'connected', latencyMs: 5 },
        }),
      });
      globalThis.fetch = mockFetch;

      const res = await adminApi.getHealth();
      expect(mockFetch).toHaveBeenCalled();
      expect(res.success).toBe(true);
      expect(res.data?.status).toBe('healthy');
      expect(res.data?.database.status).toBe('connected');
    });

    it('submits teacher application approval decision with CSRF protection header', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/auth/csrf-token')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { csrfToken: 'test-csrf-token-123' },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              message: '教師身分審核已核准，該使用者已獲得 TEACHER 權限',
            },
          }),
        };
      });
      globalThis.fetch = mockFetch;

      const res = await adminApi.approveTeacherApplication('demo-app-01', '文件審核通過');
      expect(mockFetch).toHaveBeenCalled();

      // Find the mutation call
      const postCall = mockFetch.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('/approve')
      );
      expect(postCall).toBeDefined();
      expect(postCall[1].method).toBe('POST');
      expect(postCall[1].headers['x-csrf-token']).toBe('test-csrf-token-123');
      expect(postCall[1].body).toContain('文件審核通過');
      expect(res.success).toBe(true);
      expect(res.data?.message).toContain('核准');
    });

    it('submits teacher application rejection decision with rejection reason', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string) => {
        if (typeof url === 'string' && url.includes('/auth/csrf-token')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: { csrfToken: 'test-csrf-token-123' },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              message: '教師身分審核已退回',
            },
          }),
        };
      });
      globalThis.fetch = mockFetch;

      const res = await adminApi.rejectTeacherApplication('demo-app-01', '請補齊在職證明');
      expect(mockFetch).toHaveBeenCalled();

      const postCall = mockFetch.mock.calls.find(
        (call: any[]) => typeof call[0] === 'string' && call[0].includes('/reject')
      );
      expect(postCall).toBeDefined();
      expect(postCall[1].method).toBe('POST');
      expect(postCall[1].headers['x-csrf-token']).toBe('test-csrf-token-123');
      expect(postCall[1].body).toContain('請補齊在職證明');
      expect(res.success).toBe(true);
      expect(res.data?.message).toContain('退回');
    });
  });

  describe('3. Admin Governance & Security Isolation Guardrails (P16-ADM-007, P16-ADM-008)', () => {
    it('handles health check failures gracefully with structured error without throwing', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network connection failed'));
      globalThis.fetch = mockFetch;

      const res = await adminApi.getHealth();
      expect(mockFetch).toHaveBeenCalled();
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe('HEALTH_CHECK_FAILED');
      expect(res.error?.message).toContain('無法連線');
    });

    it('ensures student role cannot access teacher or admin restricted routes', () => {
      const permittedAdminRoles = expandCompatibleFrontendRoles(['ADMIN']);
      const studentRoles = ['STUDENT'];

      const hasAdminAccess = studentRoles.some((r) => permittedAdminRoles.includes(r));
      expect(hasAdminAccess).toBe(false);

      const permittedTeacherRoles = expandCompatibleFrontendRoles(['TEACHER']);
      const hasTeacherAccess = studentRoles.some((r) => permittedTeacherRoles.includes(r));
      expect(hasTeacherAccess).toBe(false);
    });
  });
});
