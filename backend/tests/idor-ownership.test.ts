import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { hashToken } from '../src/utils/tokens.js';
import {
  PRISMA_MODEL_OWNERSHIP_INVENTORY,
  assertNestedOwnership,
  assertResourceOwnership,
  buildOwnedWhere,
  resolveScopedUserId,
} from '../src/utils/ownership.js';

const USER_A_ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const USER_B_ID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const ADMIN_ID = 'cccccccc-3333-4333-8333-cccccccccccc';
const OPS_ID = 'dddddddd-4444-4444-8444-dddddddddddd';

const TOKENS = {
  USER_A: 'user-a-session-token',
  USER_B: 'user-b-session-token',
  ADMIN: 'admin-idor-session-token',
};

const inMemoryStore = {
  teacherApps: new Map<string, any>(),
  examAttempts: new Map<string, any>(),
  examSnapshots: new Map<string, any>(),
  classes: new Map<string, any>(),
  classAssignments: new Map<string, any>(),
  auditLogs: [] as any[],
};

function buildMockSession(tokenHash: string) {
  const users: Record<string, { id: string; email: string; displayName: string; roles: string[] }> = {
    [hashToken(TOKENS.USER_A)]: {
      id: USER_A_ID,
      email: 'usera@codetoknow.edu',
      displayName: 'User A',
      roles: ['STUDENT'],
    },
    [hashToken(TOKENS.USER_B)]: {
      id: USER_B_ID,
      email: 'userb@codetoknow.edu',
      displayName: 'User B',
      roles: ['STUDENT'],
    },
    [hashToken(TOKENS.ADMIN)]: {
      id: ADMIN_ID,
      email: 'admin@codetoknow.edu',
      displayName: 'Admin',
      roles: ['ADMIN'],
    },
  };

  const u = users[tokenHash];
  if (!u) return null;
  return {
    id: `sess-${u.id}`,
    userId: u.id,
    tokenHash,
    expiresAt: new Date(Date.now() + 3600_000),
    revokedAt: null,
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      status: 'ACTIVE',
      deletedAt: null,
      roles: u.roles.map((name) => ({ role: { name } })),
    },
  };
}

vi.mock('../src/config/database.js', () => {
  const prismaMock = {
    $queryRaw: vi.fn(async () => [{ '?column?': 1 }]),
    session: {
      findUnique: vi.fn(async ({ where }: any) => buildMockSession(where.tokenHash)),
    },
    userRole: {
      findMany: vi.fn(async () => [{ role: { name: 'STUDENT' } }]),
    },
    teacherApplication: {
      findFirst: vi.fn(async ({ where }: any) => {
        for (const item of inMemoryStore.teacherApps.values()) {
          if (item.userId === where.userId && (!where.status || item.status === where.status)) {
            return item;
          }
        }
        return null;
      }),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `app-${inMemoryStore.teacherApps.size + 1}`, ...data };
        inMemoryStore.teacherApps.set(created.id, created);
        return created;
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        inMemoryStore.auditLogs.push(data);
        return data;
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

describe('Ownership Inventory & IDOR Protection', () => {
  beforeEach(() => {
    inMemoryStore.teacherApps.clear();
    inMemoryStore.examAttempts.clear();
    inMemoryStore.examSnapshots.clear();
    inMemoryStore.classes.clear();
    inMemoryStore.classAssignments.clear();
    inMemoryStore.auditLogs = [];

    inMemoryStore.teacherApps.set('app-a-1', {
      id: 'app-a-1',
      userId: USER_A_ID,
      schoolName: 'A 學校',
      subject: 'Web',
      reason: '教學需求說明文字足夠長度測試',
      status: 'PENDING',
    });

    inMemoryStore.examAttempts.set('attempt-a-1', {
      id: 'attempt-a-1',
      userId: USER_A_ID,
      score: 90,
      status: 'SUBMITTED',
    });

    inMemoryStore.examSnapshots.set('snap-a-1', {
      id: 'snap-a-1',
      attemptId: 'attempt-a-1',
      userAnswer: 'B',
    });

    inMemoryStore.classes.set('class-teacher-a', {
      id: 'class-teacher-a',
      name: '網頁丙級專班',
      creatorId: USER_A_ID,
      enrolledStudentIds: [USER_B_ID],
    });

    inMemoryStore.classAssignments.set('assign-a-1', {
      id: 'assign-a-1',
      classId: 'class-teacher-a',
      title: '第一次模考作業',
    });
  });

  it('covers every single model in backend/prisma/schema.prisma (36 models) accurately', () => {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
    const schemaText = fs.readFileSync(schemaPath, 'utf8');
    const schemaModels = Array.from(schemaText.matchAll(/^model\s+(\w+)\s+\{/gm)).map((m) => m[1]);

    expect(schemaModels).toHaveLength(36);
    expect(PRISMA_MODEL_OWNERSHIP_INVENTORY).toHaveLength(36);

    const inventoryModels = PRISMA_MODEL_OWNERSHIP_INVENTORY.map((entry) => entry.model);
    expect(new Set(inventoryModels)).toEqual(new Set(schemaModels));
  });

  describe('HTTP Route IDOR Defenses (/api/teachers/*)', () => {
    it('blocks unauthenticated access with 401', async () => {
      const res = await request(app).get('/api/teachers/my-application');
      expect(res.status).toBe(401);
    });

    it('User A reads own teacher application; User B cannot forge query userId to read User A', async () => {
      const ownRes = await request(app)
        .get('/api/teachers/my-application')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TOKENS.USER_A}`]);
      expect(ownRes.status).toBe(200);
      expect(ownRes.body.data.application.id).toBe('app-a-1');

      const forgedQueryRes = await request(app)
        .get(`/api/teachers/my-application?userId=${USER_A_ID}`)
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TOKENS.USER_B}`]);
      expect(forgedQueryRes.status).toBe(403);
      expect(forgedQueryRes.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
    });

    it('rejects forged body.userId when submitting application and leaves User A data intact', async () => {
      const csrf = 'csrf-idor-1';
      const forgedRes = await request(app)
        .post('/api/teachers/applications')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TOKENS.USER_B}`, `XSRF-TOKEN=${csrf}`])
        .set('x-csrf-token', csrf)
        .send({
          userId: USER_A_ID,
          schoolName: '偽造學校',
          subject: '資訊',
          reason: '嘗試以他人 userId 送出教師申請',
        });

      expect(forgedRes.status).toBe(403);
      expect(forgedRes.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
      expect(inMemoryStore.teacherApps.size).toBe(1);
      expect(inMemoryStore.teacherApps.get('app-a-1').userId).toBe(USER_A_ID);
    });
  });

  describe('User A / User B Ownership Helper End-to-End CRUD & Override Semantics', () => {
    const actorA = { id: USER_A_ID, roles: ['STUDENT'] };
    const actorB = { id: USER_B_ID, roles: ['STUDENT'] };
    const adminActor = { id: ADMIN_ID, roles: ['ADMIN'] };
    const platformAdminActor = { id: 'padmin-1', roles: ['PLATFORM_ADMIN'] };
    const opsActor = { id: OPS_ID, roles: ['SYSTEM_OPERATOR'] };

    it('allows owner User A read/update/delete on own ExamAttempt, denies User B cross-access without mutating DB', () => {
      const attempt = inMemoryStore.examAttempts.get('attempt-a-1');

      // User A own read & update
      expect(() =>
        assertResourceOwnership(actorA, attempt.userId, { resourceName: '測驗紀錄' })
      ).not.toThrow();
      const scopedWhere = buildOwnedWhere(actorA, { id: attempt.id }, 'userId');
      expect(scopedWhere.userId).toBe(USER_A_ID);

      // User B cross-read denial (URL :id swap)
      expect(() =>
        assertResourceOwnership(actorB, attempt.userId, { resourceName: '測驗紀錄' })
      ).toThrow();

      // User B cross-update denial
      expect(() => {
        assertResourceOwnership(actorB, attempt.userId, { resourceName: '測驗紀錄' });
        attempt.score = 100;
      }).toThrow();
      expect(inMemoryStore.examAttempts.get('attempt-a-1').score).toBe(90);

      // User B cross-delete denial
      expect(() => {
        assertResourceOwnership(actorB, attempt.userId, { resourceName: '測驗紀錄' });
        inMemoryStore.examAttempts.delete('attempt-a-1');
      }).toThrow();
      expect(inMemoryStore.examAttempts.has('attempt-a-1')).toBe(true);
    });

    it('enforces nested parent ownership for models without userId (ExamAnswerSnapshot & ClassAssignment)', async () => {
      const snapshot = inMemoryStore.examSnapshots.get('snap-a-1');
      const resolveSnapshotOwner = async () =>
        inMemoryStore.examAttempts.get(snapshot.attemptId)?.userId ?? null;

      await expect(assertNestedOwnership(actorA, resolveSnapshotOwner)).resolves.toBeUndefined();
      await expect(assertNestedOwnership(actorB, resolveSnapshotOwner)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_FORBIDDEN',
      });

      const assignment = inMemoryStore.classAssignments.get('assign-a-1');
      const resolveAssignmentManageOwner = async () =>
        inMemoryStore.classes.get(assignment.classId)?.creatorId ?? null;
      const resolveAssignmentReaders = async () => {
        const cls = inMemoryStore.classes.get(assignment.classId);
        return cls ? [cls.creatorId, ...cls.enrolledStudentIds] : [];
      };

      // Enrolled User B can read ClassAssignment, but CANNOT mutate it (creatorId !== User B)
      await expect(assertNestedOwnership(actorB, resolveAssignmentReaders)).resolves.toBeUndefined();
      await expect(assertNestedOwnership(actorB, resolveAssignmentManageOwner)).rejects.toMatchObject({
        statusCode: 403,
        code: 'OWNERSHIP_FORBIDDEN',
      });
    });

    it('rejects client-forged userId in query/where even for non-admin actors, and enforces explicit-only admin override', () => {
      // Non-admin forging User A's userId
      expect(() =>
        resolveScopedUserId(actorB, USER_A_ID, { allowAdminOverride: false })
      ).toThrow();
      expect(() =>
        buildOwnedWhere(actorB, { userId: USER_A_ID }, 'userId', { allowAdminOverride: true })
      ).toThrow();

      // ADMIN fails closed unless allowAdminOverride: true
      expect(() =>
        assertResourceOwnership(adminActor, USER_A_ID)
      ).toThrow();

      // ADMIN / PLATFORM_ADMIN succeed ONLY when allowAdminOverride is true
      expect(() =>
        assertResourceOwnership(adminActor, USER_A_ID, { allowAdminOverride: true })
      ).not.toThrow();
      expect(() =>
        assertResourceOwnership(platformAdminActor, USER_A_ID, { allowAdminOverride: true })
      ).not.toThrow();

      // SYSTEM_OPERATOR is NEVER permitted educational data override
      expect(() =>
        assertResourceOwnership(opsActor, USER_A_ID, { allowAdminOverride: true })
      ).toThrow();
    });
  });
});
