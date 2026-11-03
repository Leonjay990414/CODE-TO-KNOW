import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/config/database.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { teacherService } from '../src/modules/teachers/teacher.service.js';
import { adminService } from '../src/modules/admin/admin.service.js';
import { hashPassword } from '../src/utils/password.js';

describe('PostgreSQL Live Database Integration Tests', () => {
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Ensure live PostgreSQL connection is active
    await prisma.$queryRaw`SELECT 1`;
  });

  afterAll(async () => {
    // Clean up all data created in this test suite in foreign-key safe order
    if (createdUserIds.length > 0) {
      try {
        await prisma.auditLog.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.teacherApplication.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.emailVerificationToken.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.passwordResetToken.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.session.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.userProfile.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.userRole.deleteMany({
          where: { userId: { in: createdUserIds } },
        });
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      } catch (err) {
        console.error('Failed to clean up test data:', err);
      }
    }

    await prisma.$disconnect();
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
