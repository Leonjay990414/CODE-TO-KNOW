import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type pg from 'pg';
import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { generateSecureToken, hashToken } from '../src/utils/tokens.js';
import { SESSION_COOKIE_NAME } from '../src/middleware/authenticate.js';
import { validateIsolatedPg17TestUrl } from '../src/config/db-validation.js';

const { runtimeUrl } = vi.hoisted(() => ({
  runtimeUrl: process.env.TEST_APP_RUNTIME_URL,
}));

let poolInstance: pg.Pool | null = null;
let prismaInstance: PrismaClient | null = null;

vi.mock('../src/config/database.js', async () => {
  const { default: pgMod } = await import('pg');
  const { PrismaPg: PgAdapter } = await import('@prisma/adapter-pg');
  const { PrismaClient: Client } = await import('@prisma/client');
  const { validateIsolatedPg17TestUrl: validateUrl } = await import('../src/config/db-validation.js');

  let pool: pg.Pool | null = null;
  let prismaClient: PrismaClient | null = null;

  if (runtimeUrl && runtimeUrl.trim()) {
    const safeUrl = validateUrl(runtimeUrl);
    pool = new pgMod.Pool({ connectionString: safeUrl });
    const adapter = new PgAdapter(pool);
    prismaClient = new Client({ adapter, log: ['error'] });
  }

  return {
    prisma: prismaClient,
    createDatabasePool: () => pool,
    resolveProductionSslConfig: () => ({ rejectUnauthorized: true }),
  };
});

import { prisma, createDatabasePool } from '../src/config/database.js';
import { app } from '../src/app.js';
import { authService } from '../src/modules/auth/auth.service.js';

describe.skipIf(!runtimeUrl || !runtimeUrl.trim())(
  'PG17 Isolated app_runtime Integration & Least-Privilege Security Tests',
  () => {
    const createdUserIds: string[] = [];

    beforeAll(async () => {
      validateIsolatedPg17TestUrl(runtimeUrl);
      prismaInstance = prisma;
      poolInstance = createDatabasePool();
      if (!prismaInstance || !poolInstance) {
        throw new Error('[APP_RUNTIME TEST] Isolated test database pool failed to initialize.');
      }
      await prismaInstance.$queryRaw`SELECT 1`;
    });

    afterAll(async () => {
      // Note: c2k_test_app_runtime cannot DELETE AuditLog (by design!), so only non-AuditLog rows need cleanup if reused
      try {
        if (prismaInstance && createdUserIds.length > 0) {
          try {
            await prismaInstance.teacherApplication.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.emailVerificationToken.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.passwordResetToken.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.session.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.userProfile.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.userRole.deleteMany({
              where: { userId: { in: createdUserIds } },
            });
            await prismaInstance.user.deleteMany({
              where: { id: { in: createdUserIds } },
            });
          } catch (err) {
            console.error('Cleanup warning:', err instanceof Error ? err.message : 'unknown');
          }
        }
      } finally {
        if (prismaInstance) {
          await prismaInstance.$disconnect();
        }
        if (poolInstance) {
          await poolInstance.end();
        }
      }
    });

    it('runs strictly as c2k_test_app_runtime with BYPASSRLS=true and no superuser/DDL privileges', async () => {
      const roleInfo = await poolInstance!.query<{
        current_user: string;
        rolsuper: boolean;
        rolcreatedb: boolean;
        rolcreaterole: boolean;
        rolbypassrls: boolean;
      }>(
        `SELECT current_user, r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolbypassrls
         FROM pg_roles r WHERE r.rolname = current_user`
      );

      expect(roleInfo.rows[0]).toMatchObject({
        current_user: 'c2k_test_app_runtime',
        rolsuper: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolbypassrls: true,
      });
    });

    it('denies DDL, _prisma_migrations access, and AuditLog UPDATE/DELETE/TRUNCATE without credential leaks', async () => {
      const blockedStatements = [
        'CREATE TABLE public.rogue_probe (id int)',
        'ALTER TABLE public."User" ADD COLUMN rogue_col text',
        'SELECT count(*) FROM public."_prisma_migrations"',
        'DELETE FROM public."_prisma_migrations"',
        'UPDATE public."AuditLog" SET action = \'TAMPERED\'',
        'DELETE FROM public."AuditLog"',
        'TRUNCATE TABLE public."AuditLog"',
      ];

      for (const sql of blockedStatements) {
        let errorCode = '';
        let errorMessage = '';
        try {
          await poolInstance!.query(sql);
        } catch (err: any) {
          errorCode = err?.code || '';
          errorMessage = err?.message || '';
        }
        expect(errorCode).toBe('42501'); // PostgreSQL insufficient_privilege
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('postgresql://');
      }
    });

    it('executes full auth lifecycle, IDOR defenses, admin hardening, and append-only AuditLog DML against live PG17', async () => {
      const suffix = Date.now();
      const adminRole = await prismaInstance!.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: { name: 'ADMIN', description: 'Platform Administrator' },
      });
      const studentRole = await prismaInstance!.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: { name: 'STUDENT', description: 'Student' },
      });

      // 1. Seed Admin user & Suspended user
      const adminUser = await prismaInstance!.user.create({
        data: {
          email: `rt_admin_${suffix}@codetoknow.edu`,
          passwordHash: await hashPassword('AdminPass123!'),
          displayName: 'Runtime Admin',
          status: 'ACTIVE',
          roles: { create: [{ roleId: adminRole.id }, { roleId: studentRole.id }] },
          profile: { create: { nickname: 'Admin' } },
        },
      });
      createdUserIds.push(adminUser.id);

      const suspendedRawToken = generateSecureToken(16);
      const suspendedUser = await prismaInstance!.user.create({
        data: {
          email: `rt_susp_${suffix}@codetoknow.edu`,
          passwordHash: await hashPassword('SuspPass123!'),
          displayName: 'Suspended User',
          status: 'SUSPENDED',
          roles: { create: [{ roleId: studentRole.id }] },
          emailVerificationTokens: {
            create: {
              tokenHash: hashToken(suspendedRawToken),
              expiresAt: new Date(Date.now() + 3600_000),
            },
          },
        },
      });
      createdUserIds.push(suspendedUser.id);

      // 2. Register Student A and Student B via AuthService
      const studentA = await authService.register({
        email: `rt_student_a_${suffix}@codetoknow.edu`,
        password: 'StudentAPass123',
        displayName: 'Student A',
      });
      createdUserIds.push(studentA.user.id);

      const studentB = await authService.register({
        email: `rt_student_b_${suffix}@codetoknow.edu`,
        password: 'StudentBPass123',
        displayName: 'Student B',
      });
      createdUserIds.push(studentB.user.id);

      // 3. Verify email for ACTIVE Student A, block SUSPENDED user
      const verifyOk = await authService.verifyEmail(studentA.verificationToken);
      expect(verifyOk.success).toBe(true);

      await expect(authService.verifyEmail(suspendedRawToken)).rejects.toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_DISABLED',
      });

      // 4. Create real sessions via login
      const studentASession = await authService.login({
        email: studentA.user.email,
        password: 'StudentAPass123',
      });
      const studentBSession = await authService.login({
        email: studentB.user.email,
        password: 'StudentBPass123',
      });
      const adminSession = await authService.login({
        email: adminUser.email,
        password: 'AdminPass123!',
      });

      // 5. Student A submits teacher application; Student B attempts forged userId IDOR
      const csrfA = 'csrf-rt-a';
      const applyRes = await request(app)
        .post('/api/teachers/applications')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${studentASession.sessionToken}`, `XSRF-TOKEN=${csrfA}`])
        .set('x-csrf-token', csrfA)
        .send({
          schoolName: '臺北科技大學',
          subject: '程式設計實務',
          reason: '申請開設班級並進行題庫練習管理。',
        });
      expect(applyRes.status).toBe(201);
      const appId = applyRes.body.data.application.id as string;

      const csrfB = 'csrf-rt-b';
      const forgedApplyRes = await request(app)
        .post('/api/teachers/applications')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${studentBSession.sessionToken}`, `XSRF-TOKEN=${csrfB}`])
        .set('x-csrf-token', csrfB)
        .send({
          userId: studentA.user.id,
          schoolName: '偽造學院',
          subject: 'Web',
          reason: '嘗試跨帳號送出教師身分申請。',
        });
      expect(forgedApplyRes.status).toBe(403);
      expect(forgedApplyRes.body.error.code).toBe('OWNERSHIP_FORBIDDEN');

      const forgedGetRes = await request(app)
        .get(`/api/teachers/my-application?userId=${studentA.user.id}`)
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${studentBSession.sessionToken}`]);
      expect(forgedGetRes.status).toBe(403);

      // 6. Non-admin approve blocked (403); invalid UUID rejected (400); valid Admin approve succeeds (200)
      const nonAdminApprove = await request(app)
        .post(`/api/admin/teacher-applications/${appId}/approve`)
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${studentBSession.sessionToken}`, `XSRF-TOKEN=${csrfB}`])
        .set('x-csrf-token', csrfB)
        .send({});
      expect(nonAdminApprove.status).toBe(403);

      const csrfAdmin = 'csrf-rt-admin';
      const badUuidApprove = await request(app)
        .post('/api/admin/teacher-applications/invalid-uuid-param/approve')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${adminSession.sessionToken}`, `XSRF-TOKEN=${csrfAdmin}`])
        .set('x-csrf-token', csrfAdmin)
        .send({});
      expect(badUuidApprove.status).toBe(400);
      expect(badUuidApprove.body.error.code).toBe('VALIDATION_ERROR');

      const okApprove = await request(app)
        .post(`/api/admin/teacher-applications/${appId}/approve`)
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${adminSession.sessionToken}`, `XSRF-TOKEN=${csrfAdmin}`])
        .set('x-csrf-token', csrfAdmin)
        .send({ reviewNote: 'Runtime 測試核准' });
      expect(okApprove.status).toBe(200);
      expect(okApprove.body.data.application.status).toBe('APPROVED');

      // 7. AuditLog pagination (valid vs invalid limit) via c2k_test_app_runtime
      const badAuditQuery = await request(app)
        .get('/api/admin/audit-logs?limit=500')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${adminSession.sessionToken}`]);
      expect(badAuditQuery.status).toBe(400);

      const okAuditQuery = await request(app)
        .get('/api/admin/audit-logs?page=1&limit=20')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${adminSession.sessionToken}`]);
      expect(okAuditQuery.status).toBe(200);
      expect(okAuditQuery.body.data.logs.length).toBeGreaterThanOrEqual(1);
    });
  }
);
