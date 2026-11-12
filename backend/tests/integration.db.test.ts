import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type pg from 'pg';
import type { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';
import { validateIsolatedPg17TestUrl } from '../src/config/db-validation.js';

const { isolatedTestUrl } = vi.hoisted(() => ({
  isolatedTestUrl: process.env.TEST_DATABASE_URL,
}));

vi.mock('../src/config/database.js', async () => {
  const { default: pgMod } = await import('pg');
  const { PrismaPg: PgAdapter } = await import('@prisma/adapter-pg');
  const { PrismaClient: Client } = await import('@prisma/client');
  const { validateIsolatedPg17TestUrl: validateUrl } = await import('../src/config/db-validation.js');

  let pool: pg.Pool | null = null;
  let prismaClient: PrismaClient | null = null;

  if (isolatedTestUrl && isolatedTestUrl.trim()) {
    const safeUrl = validateUrl(isolatedTestUrl);
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
import { authService } from '../src/modules/auth/auth.service.js';
import { teacherService } from '../src/modules/teachers/teacher.service.js';
import { adminService } from '../src/modules/admin/admin.service.js';

describe('PostgreSQL Live Database Integration Tests', () => {
  const createdUserIds: string[] = [];
  let poolInstance: pg.Pool | null = null;
  let prismaInstance: PrismaClient | null = null;

  beforeAll(async () => {
    // Ensure TEST_DATABASE_URL is explicitly set (captured before dotenv.config()) and passes isolated PG17 whitelist
    if (!isolatedTestUrl || !isolatedTestUrl.trim()) {
      throw new Error(
        '[INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL targeting an isolated PG17 test database (127.0.0.1:5434/code_to_know_test as c2k_test_app_runtime). Silent fallback to dev/prod DATABASE_URL is strictly disallowed.'
      );
    }

    try {
      validateIsolatedPg17TestUrl(isolatedTestUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid connection URL format';
      throw new Error(`[INTEGRATION TEST CONFIG ERROR] ${msg}`);
    }

    prismaInstance = prisma;
    poolInstance = createDatabasePool();
    if (!prismaInstance || !poolInstance) {
      throw new Error('[INTEGRATION TEST CONFIG ERROR] Isolated test database pool failed to initialize.');
    }

    // Ensure live PostgreSQL connection is active
    await prismaInstance.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    // Clean up only data created in this test suite in foreign-key safe order.
    // Note: AuditLog is intentionally NOT deleted because c2k_test_app_runtime enforces append-only AuditLog permissions.
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
          console.error('Failed to clean up test data:', err instanceof Error ? err.message : 'unknown');
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

  it('runs full authentication, teacher application, and admin approval flow against live PostgreSQL', async () => {
    const testTimestamp = Date.now();

    // 1. Ensure ADMIN and STUDENT roles exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: '系統管理員：全系統管理與權限配置' },
    });

    const studentRole = await prisma.role.upsert({
      where: { name: 'STUDENT' },
      update: {},
      create: { name: 'STUDENT', description: '學生身分' },
    });

    // 2. Create a real ADMIN user in database
    const adminEmail = `test_admin_${testTimestamp}@codetoknow.edu`;
    const adminPasswordHash = await hashPassword('AdminPassword123');

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        displayName: '整合測試管理員',
        status: 'ACTIVE',
        roles: {
          create: [
            { roleId: adminRole.id },
            { roleId: studentRole.id },
          ],
        },
        profile: {
          create: {
            nickname: '整合測試管理員',
          },
        },
      },
    });
    createdUserIds.push(adminUser.id);

    // 3. Register a student user via AuthService
    const studentEmail = `test_student_${testTimestamp}@codetoknow.edu`;
    const regResult = await authService.register({
      email: studentEmail,
      password: 'SecurePassword123',
      displayName: '整合測試學生',
    });
    createdUserIds.push(regResult.user.id);

    expect(regResult.user.id).toBeDefined();
    expect(regResult.user.roles).toContain('STUDENT');
    expect(regResult.user.roles).not.toContain('TEACHER');

    // 4. Submit teacher application as student
    const application = await teacherService.submitApplication(regResult.user.id, {
      schoolName: '國立臺灣大學資訊工程學系',
      subject: '機器學習與深度學習',
      reason: '希望能為大一學生建立 AI 程式練習題庫並監測學習進度。',
      proofUrl: 'https://www.csie.ntu.edu.tw/faculty/sample',
    });
    expect(application.status).toBe('PENDING');
    expect(application.userId).toBe(regResult.user.id);

    // 5. Approve teacher application using real adminUser.id
    const approved = await adminService.approveTeacherApplication(
      application.id,
      adminUser.id,
      { reviewNote: '資料完整，准予開通教師權限' }
    );
    expect(approved.status).toBe('APPROVED');
    expect(approved.reviewedBy).toBe(adminUser.id);

    // 6. Verify applicant now has TEACHER role in database
    const updatedStudent = await authService.getCurrentUser(regResult.user.id);
    expect(updatedStudent.roles).toContain('TEACHER');
    expect(updatedStudent.roles).toContain('STUDENT');

    // 7. Verify AuditLog has recorded the approval with real adminUser.id
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        userId: adminUser.id,
        action: 'TEACHER_APPLICATION_APPROVED',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditRecord).toBeDefined();
    expect(auditRecord?.userId).toBe(adminUser.id);
  });
});
