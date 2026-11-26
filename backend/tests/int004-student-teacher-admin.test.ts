import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { hashToken } from '../src/utils/tokens.js';
import { SESSION_COOKIE_NAME } from '../src/middleware/authenticate.js';

const USER_IDS = {
  ADMIN: '11111111-1111-4111-8111-111111111111',
  TEACHER_1: '44444444-4444-4444-8444-444444444444',
  TEACHER_2: '66666666-6666-4666-8666-666666666666',
  STUDENT_1: '33333333-3333-4333-8333-333333333333',
  STUDENT_2: '77777777-7777-4777-8777-777777777777',
};

const TOKENS = {
  ADMIN: 'admin-session-token',
  TEACHER_1: 'teacher-1-session-token',
  TEACHER_2: 'teacher-2-session-token',
  STUDENT_1: 'student-1-session-token',
  STUDENT_2: 'student-2-session-token',
};

function authCookie(token: string, csrf = 'csrf-int004-token') {
  return [`${SESSION_COOKIE_NAME}=${token}`, `XSRF-TOKEN=${csrf}`];
}

function makeSessionUser(tokenHash: string) {
  const users: Record<string, { id: string; email: string; displayName: string; roles: string[]; status: string }> = {
    [hashToken(TOKENS.ADMIN)]: {
      id: USER_IDS.ADMIN,
      email: 'admin@codetoknow.edu',
      displayName: 'Platform Admin',
      roles: ['ADMIN'],
      status: 'ACTIVE',
    },
    [hashToken(TOKENS.TEACHER_1)]: {
      id: USER_IDS.TEACHER_1,
      email: 'teacher1@codetoknow.edu',
      displayName: 'Teacher Chen',
      roles: ['TEACHER'],
      status: 'ACTIVE',
    },
    [hashToken(TOKENS.TEACHER_2)]: {
      id: USER_IDS.TEACHER_2,
      email: 'teacher2@codetoknow.edu',
      displayName: 'Teacher Lin',
      roles: ['TEACHER'],
      status: 'ACTIVE',
    },
    [hashToken(TOKENS.STUDENT_1)]: {
      id: USER_IDS.STUDENT_1,
      email: 'student1@codetoknow.edu',
      displayName: 'Student Alice',
      roles: ['STUDENT'],
      status: 'ACTIVE',
    },
    [hashToken(TOKENS.STUDENT_2)]: {
      id: USER_IDS.STUDENT_2,
      email: 'student2@codetoknow.edu',
      displayName: 'Student Bob',
      roles: ['STUDENT'],
      status: 'ACTIVE',
    },
  };

  const u = users[tokenHash];
  if (!u) return null;

  return {
    id: `sess-${u.id}`,
    userId: u.id,
    tokenHash,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 86400 * 1000),
    user: {
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      status: u.status,
      deletedAt: null,
      roles: u.roles.map((name) => ({ role: { name } })),
    },
  };
}

vi.mock('../src/config/database.js', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      update: vi.fn(),
      upsert: vi.fn(),
    },
    userRole: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn().mockResolvedValue(5),
    },
    role: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    examAttempt: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    wrongQuestionRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    practicalTask: {
      findMany: vi.fn(),
    },
    practicalProgress: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    class: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    classEnrollment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    question: {
      count: vi.fn(),
    },
    teacherApplication: {
      count: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe('CTK-CORE-01-INT-004: Student, Teacher & Admin Vertical Slice Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.session.findUnique as any).mockImplementation(({ where }: any) => {
      return Promise.resolve(makeSessionUser(where.tokenHash));
    });
  });

  // ==========================================================================
  // 1. Student Domain
  // ==========================================================================
  describe('Student Dashboard & Profile', () => {
    it('rejects unauthenticated requests to student dashboard', async () => {
      const res = await request(app).get('/api/student/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns empty stats cleanly when a new student has no records', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: USER_IDS.STUDENT_1,
        email: 'student1@codetoknow.edu',
        displayName: 'Student Alice',
        avatarUrl: null,
        status: 'ACTIVE',
        profile: null,
        roles: [{ role: { name: 'STUDENT' } }],
        createdAt: new Date(),
      });

      (prisma.examAttempt.findMany as any).mockResolvedValue([]);
      (prisma.wrongQuestionRecord.findMany as any).mockResolvedValue([]);
      (prisma.practicalTask.findMany as any).mockResolvedValue([]);
      (prisma.practicalProgress.findMany as any).mockResolvedValue([]);
      (prisma.classEnrollment.findMany as any).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Cookie', authCookie(TOKENS.STUDENT_1))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.email).toBe('student1@codetoknow.edu');
      expect(res.body.data.overview.totalExamsTaken).toBe(0);
      expect(res.body.data.overview.averageScore).toBeNull();
      expect(res.body.data.overview.wrongQuestionsTotal).toBe(0);
      expect(res.body.data.overview.startedPracticalTasksCount).toBe(0);
      expect(res.body.data.examHistory).toEqual([]);
      expect(res.body.data.enrolledClasses).toEqual([]);
    });

    it('rejects forged owner and security fields on profile update (403 forbidden)', async () => {
      const res = await request(app)
        .patch('/api/student/profile')
        .set('Cookie', authCookie(TOKENS.STUDENT_1))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({
          displayName: 'Alice Updated',
          // Malicious attempt to forge roles or email
          roles: ['ADMIN'],
          email: 'hacked@admin.com',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
    });

    it('successfully updates legitimate student profile fields', async () => {
      (prisma.user.update as any).mockResolvedValue({
        id: USER_IDS.STUDENT_1,
        email: 'student1@codetoknow.edu',
        displayName: 'Alice Legit',
        avatarUrl: 'https://example.com/avatar.png',
      });
      (prisma.userProfile.upsert as any).mockResolvedValue({});
      (prisma.auditLog.create as any).mockResolvedValue({});

      const res = await request(app)
        .patch('/api/student/profile')
        .set('Cookie', authCookie(TOKENS.STUDENT_1))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({
          displayName: 'Alice Legit',
          avatarUrl: 'https://example.com/avatar.png',
          bio: 'Aspiring web developer',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: USER_IDS.STUDENT_1 },
          data: expect.objectContaining({
            displayName: 'Alice Legit',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // 2. Teacher Domain
  // ==========================================================================
  describe('Teacher Classroom Analytics & Student Progress', () => {
    const classId = 'class-101';

    it('rejects student attempting to access teacher classroom analytics (403)', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${classId}/analytics`)
        .set('Cookie', authCookie(TOKENS.STUDENT_1))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(403);
    });

    it('rejects teacher inspecting another teacher classroom (isolation)', async () => {
      // Classroom owned by TEACHER_1
      (prisma.class.findUnique as any).mockResolvedValue({
        id: classId,
        creatorId: USER_IDS.TEACHER_1,
        name: 'Web Design Class A',
      });

      // TEACHER_2 attempts access
      const res = await request(app)
        .get(`/api/classrooms/${classId}/analytics`)
        .set('Cookie', authCookie(TOKENS.TEACHER_2))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows class teacher to retrieve classroom analytics calculated from DB', async () => {
      (prisma.class.findUnique as any).mockResolvedValue({
        id: classId,
        creatorId: USER_IDS.TEACHER_1,
        name: 'Web Design Class A',
        certification: { name: '17300 網頁設計丙級' },
      });

      (prisma.classEnrollment.findMany as any).mockResolvedValue([
        { studentId: USER_IDS.STUDENT_1 },
        { studentId: USER_IDS.STUDENT_2 },
      ]);

      (prisma.examAttempt.findMany as any).mockResolvedValue([
        { score: 80, isPassed: true },
        { score: 70, isPassed: true },
      ]);

      (prisma.practicalProgress.findMany as any).mockResolvedValue([
        { userId: USER_IDS.STUDENT_1, version: 'VERSION_A', completedStepNumbers: '[1,2,3]' },
      ]);

      (prisma.wrongQuestionRecord.findMany as any).mockResolvedValue([
        { state: 'UNRESOLVED' },
        { state: 'MASTERED' },
      ]);

      const res = await request(app)
        .get(`/api/classrooms/${classId}/analytics`)
        .set('Cookie', authCookie(TOKENS.TEACHER_1))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalStudents).toBe(2);
      expect(res.body.data.examStats.totalExamsTaken).toBe(2);
      expect(res.body.data.examStats.averageScore).toBe(75);
      expect(res.body.data.examStats.passRate).toBe(100);
      expect(res.body.data.practicalStats.studentsWithPracticalRecords).toBe(1);
    });

    it('rejects teacher requesting progress of a student NOT enrolled in class (403 forbidden boundary)', async () => {
      (prisma.class.findUnique as any).mockResolvedValue({
        id: classId,
        creatorId: USER_IDS.TEACHER_1,
        name: 'Web Design Class A',
      });

      // Enrollment not found for STUDENT_2 in this class
      (prisma.classEnrollment.findFirst as any).mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/classrooms/${classId}/students/${USER_IDS.STUDENT_2}/progress`)
        .set('Cookie', authCookie(TOKENS.TEACHER_1))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ==========================================================================
  // 3. Admin Domain
  // ==========================================================================
  describe('Admin Platform Governance', () => {
    it('rejects non-admin from accessing platform overview (403)', async () => {
      const res = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', authCookie(TOKENS.TEACHER_1))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(403);
    });

    it('returns dynamic database counts for platform overview', async () => {
      (prisma.user.count as any).mockResolvedValue(15);
      (prisma.class.count as any).mockResolvedValue(3);
      (prisma.question.count as any).mockResolvedValue(605);
      (prisma.examAttempt.count as any).mockResolvedValue(28);
      (prisma.practicalProgress.count as any).mockResolvedValue(12);
      (prisma.teacherApplication.count as any).mockResolvedValue(2);
      (prisma.auditLog.count as any).mockResolvedValue(45);

      const res = await request(app)
        .get('/api/admin/overview')
        .set('Cookie', authCookie(TOKENS.ADMIN))
        .set('x-csrf-token', 'csrf-int004-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content.officialQuestionsCount).toBe(605);
      expect(res.body.data.classrooms.total).toBe(3);
      expect(res.body.data.governance.pendingTeacherApplications).toBe(2);
    });

    it('prevents admin from suspending their own account (self-lockout defense)', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${USER_IDS.ADMIN}/status`)
        .set('Cookie', authCookie(TOKENS.ADMIN))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('管理員無法修改自己的帳號狀態');
    });

    it('allows admin to suspend a student account with audit logging', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: USER_IDS.STUDENT_1,
        email: 'student1@codetoknow.edu',
        status: 'ACTIVE',
        roles: [{ role: { name: 'STUDENT' } }],
      });
      (prisma.user.update as any).mockResolvedValue({
        id: USER_IDS.STUDENT_1,
        email: 'student1@codetoknow.edu',
        status: 'SUSPENDED',
      });
      (prisma.auditLog.create as any).mockResolvedValue({});

      const res = await request(app)
        .patch(`/api/admin/users/${USER_IDS.STUDENT_1}/status`)
        .set('Cookie', authCookie(TOKENS.ADMIN))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({ status: 'SUSPENDED', reason: '違反使用條款' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_STATUS_UPDATED',
          }),
        })
      );
    });

    it('prevents admin from revoking their own ADMIN role', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${USER_IDS.ADMIN}/role`)
        .set('Cookie', authCookie(TOKENS.ADMIN))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({ role: 'ADMIN', action: 'revoke' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('BAD_REQUEST');
      expect(res.body.error.message).toContain('管理員無法撤銷自己的管理員權限');
    });

    it('allows admin to grant TEACHER role to a student with audit logging', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: USER_IDS.STUDENT_1,
        email: 'student1@codetoknow.edu',
        displayName: 'Student Alice',
        status: 'ACTIVE',
        createdAt: new Date(),
        roles: [{ role: { name: 'TEACHER' } }],
      });
      (prisma.role.findUnique as any).mockResolvedValue({
        id: 'role-teacher-id',
        name: 'TEACHER',
      });
      (prisma.userRole.upsert as any).mockResolvedValue({});
      (prisma.auditLog.create as any).mockResolvedValue({});

      const res = await request(app)
        .patch(`/api/admin/users/${USER_IDS.STUDENT_1}/role`)
        .set('Cookie', authCookie(TOKENS.ADMIN))
        .set('x-csrf-token', 'csrf-int004-token')
        .send({ role: 'TEACHER', action: 'grant' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(prisma.userRole.upsert).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'USER_ROLE_GRANTED',
          }),
        })
      );
    });
  });
});
