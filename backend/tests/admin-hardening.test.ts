import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { hashToken } from '../src/utils/tokens.js';
import { sanitizeAuditDetails } from '../src/utils/audit.js';

const USER_IDS = {
  ADMIN: '11111111-1111-4111-8111-111111111111',
  PLATFORM_ADMIN: '22222222-2222-4222-8222-222222222222',
  STUDENT: '33333333-3333-4333-8333-333333333333',
  TEACHER: '44444444-4444-4444-8444-444444444444',
  OPS: '55555555-5555-4555-8555-555555555555',
};

const APP_IDS = {
  PENDING: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  MISSING: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

const TOKENS = {
  ADMIN: 'admin-session-token',
  PLATFORM_ADMIN: 'platform-admin-session-token',
  STUDENT: 'student-session-token',
  TEACHER: 'teacher-session-token',
  OPS: 'ops-session-token',
};

const mockState = {
  applications: new Map<string, any>(),
  auditLogs: [] as any[],
  roleNames: new Set(['STUDENT', 'TEACHER', 'ADMIN']),
};

function makeSessionUser(tokenHash: string) {
  const map: Record<string, { id: string; email: string; displayName: string; roles: string[] }> = {
    [hashToken(TOKENS.ADMIN)]: {
      id: USER_IDS.ADMIN,
      email: 'admin@codetoknow.edu',
      displayName: 'Admin',
      roles: ['ADMIN', 'STUDENT'],
    },
    [hashToken(TOKENS.PLATFORM_ADMIN)]: {
      id: USER_IDS.PLATFORM_ADMIN,
      email: 'padmin@codetoknow.edu',
      displayName: 'Platform Admin',
      roles: ['PLATFORM_ADMIN'],
    },
    [hashToken(TOKENS.STUDENT)]: {
      id: USER_IDS.STUDENT,
      email: 'student@codetoknow.edu',
      displayName: 'Student',
      roles: ['STUDENT'],
    },
    [hashToken(TOKENS.TEACHER)]: {
      id: USER_IDS.TEACHER,
      email: 'teacher@codetoknow.edu',
      displayName: 'Teacher',
      roles: ['TEACHER', 'STUDENT'],
    },
    [hashToken(TOKENS.OPS)]: {
      id: USER_IDS.OPS,
      email: 'ops@codetoknow.edu',
      displayName: 'Ops',
      roles: ['SYSTEM_OPERATOR'],
    },
  };

  const user = map[tokenHash];
  if (!user) return null;

  return {
    id: `sess-${user.id}`,
    userId: user.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    revokedAt: null,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: 'ACTIVE',
      deletedAt: null,
      roles: user.roles.map((name) => ({ role: { name } })),
    },
  };
}

vi.mock('../src/config/database.js', () => {
  const prismaMock = {
    $queryRaw: vi.fn(async () => [{ '?column?': 1 }]),
    $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    session: {
      findUnique: vi.fn(async ({ where }: any) => makeSessionUser(where.tokenHash)),
    },
    role: {
      findUnique: vi.fn(async ({ where }: any) =>
        mockState.roleNames.has(where.name)
          ? { id: `role-${where.name}`, name: where.name }
          : null
      ),
      create: vi.fn(async ({ data }: any) => {
        mockState.roleNames.add(data.name);
        return { id: `role-${data.name}`, name: data.name };
      }),
    },
    userRole: {
      upsert: vi.fn(async ({ create }: any) => create),
    },
    teacherApplication: {
      findMany: vi.fn(async ({ skip = 0, take = 20 }: any) =>
        Array.from(mockState.applications.values()).slice(skip, skip + take)
      ),
      count: vi.fn(async () => mockState.applications.size),
      findUnique: vi.fn(async ({ where }: any) => mockState.applications.get(where.id) ?? null),
      update: vi.fn(async ({ where, data }: any) => {
        const existing = mockState.applications.get(where.id);
        const updated = { ...existing, ...data };
        mockState.applications.set(where.id, updated);
        return updated;
      }),
    },
    auditLog: {
      findMany: vi.fn(async ({ skip = 0, take = 50 }: any) =>
        mockState.auditLogs.slice(skip, skip + take)
      ),
      count: vi.fn(async () => mockState.auditLogs.length),
      create: vi.fn(async ({ data }: any) => {
        const created = {
          id: `audit-${mockState.auditLogs.length + 1}`,
          createdAt: new Date(),
          user: { id: data.userId, email: 'actor@codetoknow.edu', displayName: 'Actor' },
          ...data,
        };
        mockState.auditLogs.push(created);
        return created;
      }),
    },
  };

  return {
    prisma: prismaMock,
    createDatabasePool: vi.fn(),
    resolveProductionSslConfig: vi.fn(),
  };
});

import { app } from '../src/app.js';
import { SESSION_COOKIE_NAME } from '../src/middleware/authenticate.js';

function authCookies(sessionToken: string, csrf = 'csrf-test-token-123') {
  return [`${SESSION_COOKIE_NAME}=${sessionToken}`, `XSRF-TOKEN=${csrf}`];
}

describe('Admin API Security Hardening', () => {
  beforeEach(() => {
    mockState.applications.clear();
    mockState.applications.set(APP_IDS.PENDING, {
      id: APP_IDS.PENDING,
      userId: USER_IDS.STUDENT,
      schoolName: '國立示範高中',
      subject: '資訊科技',
      reason: '申請題庫與班級管理功能',
      proofUrl: null,
      status: 'PENDING',
      createdAt: new Date(),
      user: {
        id: USER_IDS.STUDENT,
        email: 'student@codetoknow.edu',
        displayName: 'Student',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    mockState.auditLogs = [
      {
        id: 'audit-seed-1',
        userId: USER_IDS.ADMIN,
        action: 'SENSITIVE_TEST_EVENT',
        details: JSON.stringify({
          applicationId: APP_IDS.PENDING,
          password: 'PlaintextPassword123!',
          token: 'raw-secret-token-value',
          apiKey: 'sk_live_should_never_leak',
          dbUrl: 'postgresql://postgres:supersecret@db.example:5432/postgres',
          note: '保留非敏感稽核說明',
        }),
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest',
        createdAt: new Date(),
        user: {
          id: USER_IDS.ADMIN,
          email: 'admin@codetoknow.edu',
          displayName: 'Admin',
        },
      },
    ];
  });

  describe('Teacher Application Approve / Reject :id Param & RBAC Validation', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const approveRes = await request(app)
        .post(`/api/admin/teacher-applications/${APP_IDS.PENDING}/approve`)
        .set('Cookie', ['XSRF-TOKEN=csrf-1'])
        .set('x-csrf-token', 'csrf-1')
        .send({});
      expect(approveRes.status).toBe(401);

      const rejectRes = await request(app)
        .post(`/api/admin/teacher-applications/${APP_IDS.PENDING}/reject`)
        .set('Cookie', ['XSRF-TOKEN=csrf-1'])
        .set('x-csrf-token', 'csrf-1')
        .send({});
      expect(rejectRes.status).toBe(401);
    });

    it('rejects non-ADMIN roles (STUDENT, TEACHER, SYSTEM_OPERATOR) with 403', async () => {
      for (const token of [TOKENS.STUDENT, TOKENS.TEACHER, TOKENS.OPS]) {
        const csrf = 'csrf-non-admin';
        const approveRes = await request(app)
          .post(`/api/admin/teacher-applications/${APP_IDS.PENDING}/approve`)
          .set('Cookie', authCookies(token, csrf))
          .set('x-csrf-token', csrf)
          .send({});
        expect(approveRes.status).toBe(403);
        expect(approveRes.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');

        const rejectRes = await request(app)
          .post(`/api/admin/teacher-applications/${APP_IDS.PENDING}/reject`)
          .set('Cookie', authCookies(token, csrf))
          .set('x-csrf-token', csrf)
          .send({});
        expect(rejectRes.status).toBe(403);
      }
    });

    it('rejects malformed :id params on approve and reject with 400 VALIDATION_ERROR', async () => {
      const csrf = 'csrf-bad-id';
      for (const badId of ['not-a-uuid', '12345', '%20', '0000-0000']) {
        const approveRes = await request(app)
          .post(`/api/admin/teacher-applications/${badId}/approve`)
          .set('Cookie', authCookies(TOKENS.ADMIN, csrf))
          .set('x-csrf-token', csrf)
          .send({});
        expect(approveRes.status).toBe(400);
        expect(approveRes.body.error.code).toBe('VALIDATION_ERROR');

        const rejectRes = await request(app)
          .post(`/api/admin/teacher-applications/${badId}/reject`)
          .set('Cookie', authCookies(TOKENS.ADMIN, csrf))
          .set('x-csrf-token', csrf)
          .send({});
        expect(rejectRes.status).toBe(400);
        expect(rejectRes.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('handles missing :id path cleanly (404 route not matched)', async () => {
      const csrf = 'csrf-missing-id';
      const approveRes = await request(app)
        .post('/api/admin/teacher-applications//approve')
        .set('Cookie', authCookies(TOKENS.ADMIN, csrf))
        .set('x-csrf-token', csrf)
        .send({});
      expect(approveRes.status).toBe(404);
    });

    it('returns 404 for non-existent UUID application id', async () => {
      const csrf = 'csrf-404-id';
      const res = await request(app)
        .post(`/api/admin/teacher-applications/${APP_IDS.MISSING}/approve`)
        .set('Cookie', authCookies(TOKENS.ADMIN, csrf))
        .set('x-csrf-token', csrf)
        .send({});
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('allows ADMIN and PLATFORM_ADMIN to approve/reject valid UUID applications', async () => {
      const csrf = 'csrf-valid';
      const approveRes = await request(app)
        .post(`/api/admin/teacher-applications/${APP_IDS.PENDING}/approve`)
        .set('Cookie', authCookies(TOKENS.PLATFORM_ADMIN, csrf))
        .set('x-csrf-token', csrf)
        .send({ reviewNote: '審核通過' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.application.status).toBe('APPROVED');
    });
  });

  describe('AuditLog & Pagination Hardening', () => {
    it('forbids unauthenticated and non-ADMIN users from /api/admin/audit-logs', async () => {
      const unauth = await request(app).get('/api/admin/audit-logs');
      expect(unauth.status).toBe(401);

      for (const token of [TOKENS.STUDENT, TOKENS.TEACHER, TOKENS.OPS]) {
        const res = await request(app)
          .get('/api/admin/audit-logs')
          .set('Cookie', authCookies(token));
        expect(res.status).toBe(403);
      }
    });

    it('rejects negative, zero, non-numeric, float, and oversized page/limit params with 400 VALIDATION_ERROR', async () => {
      const invalidQueries = [
        'page=0',
        'page=-1',
        'page=abc',
        'page=1.5',
        'limit=0',
        'limit=-10',
        'limit=abc',
        'limit=101',
        'limit=999999',
      ];

      for (const query of invalidQueries) {
        const auditRes = await request(app)
          .get(`/api/admin/audit-logs?${query}`)
          .set('Cookie', authCookies(TOKENS.ADMIN));
        expect(auditRes.status).toBe(400);
        expect(auditRes.body.error.code).toBe('VALIDATION_ERROR');

        const appsRes = await request(app)
          .get(`/api/admin/teacher-applications?${query}`)
          .set('Cookie', authCookies(TOKENS.ADMIN));
        expect(appsRes.status).toBe(400);
        expect(appsRes.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('accepts valid page & limit (up to 100) and scrubs sensitive fields from audit details', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs?page=1&limit=100')
        .set('Cookie', authCookies(TOKENS.ADMIN));

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 100 });
      const returnedDetails = res.body.data.logs[0].details as string;
      expect(returnedDetails).toContain(APP_IDS.PENDING);
      expect(returnedDetails).toContain('保留非敏感稽核說明');
      expect(returnedDetails).not.toContain('PlaintextPassword123!');
      expect(returnedDetails).not.toContain('raw-secret-token-value');
      expect(returnedDetails).not.toContain('sk_live_should_never_leak');
      expect(returnedDetails).not.toContain('supersecret');
      expect(returnedDetails).toContain('[REDACTED]');
    });

    it('sanitizes string-formatted Bearer/credential details safely', () => {
      const sanitized = sanitizeAuditDetails('Bearer abcdef123456 password=MySecretPass99');
      expect(sanitized).not.toContain('abcdef123456');
      expect(sanitized).not.toContain('MySecretPass99');
      expect(sanitized).toContain('[REDACTED]');
    });
  });
});
