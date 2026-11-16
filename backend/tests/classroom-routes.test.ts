import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
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
  ADMIN: 'admin-token',
  TEACHER_1: 'teacher-1-token',
  TEACHER_2: 'teacher-2-token',
  STUDENT_1: 'student-1-token',
  STUDENT_2: 'student-2-token',
};

function authCookies(sessionToken: string, csrf = 'csrf-test-token-123') {
  return [`${SESSION_COOKIE_NAME}=${sessionToken}`, `XSRF-TOKEN=${csrf}`];
}

const mockState = {
  classes: new Map<string, any>(),
  enrollments: [] as any[],
  auditLogs: [] as any[],
};

function makeSessionUser(tokenHash: string) {
  const map: Record<string, { id: string; email: string; displayName: string; roles: string[] }> = {
    [hashToken(TOKENS.ADMIN)]: {
      id: USER_IDS.ADMIN,
      email: 'admin@codetoknow.edu',
      displayName: 'Platform Admin',
      roles: ['ADMIN'],
    },
    [hashToken(TOKENS.TEACHER_1)]: {
      id: USER_IDS.TEACHER_1,
      email: 'teacher1@codetoknow.edu',
      displayName: 'Teacher One',
      roles: ['TEACHER', 'STUDENT'],
    },
    [hashToken(TOKENS.TEACHER_2)]: {
      id: USER_IDS.TEACHER_2,
      email: 'teacher2@codetoknow.edu',
      displayName: 'Teacher Two',
      roles: ['TEACHER'],
    },
    [hashToken(TOKENS.STUDENT_1)]: {
      id: USER_IDS.STUDENT_1,
      email: 'student1@codetoknow.edu',
      displayName: 'Student One',
      roles: ['STUDENT'],
    },
    [hashToken(TOKENS.STUDENT_2)]: {
      id: USER_IDS.STUDENT_2,
      email: 'student2@codetoknow.edu',
      displayName: 'Student Two',
      roles: ['STUDENT'],
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
  return {
    prisma: {
      $queryRaw: vi.fn(async () => [{ '?column?': 1 }]),
      session: {
        findUnique: vi.fn(async ({ where }: any) => makeSessionUser(where.tokenHash)),
      },
      class: {
        findUnique: vi.fn(async ({ where }: any) => {
          if (where.id) return mockState.classes.get(where.id) || null;
          if (where.joinCode) {
            for (const c of mockState.classes.values()) {
              if (c.joinCode === where.joinCode) return c;
            }
          }
          return null;
        }),
        findMany: vi.fn(async ({ where }: any) => {
          const list = Array.from(mockState.classes.values()).filter((c) => {
            if (where.creatorId && c.creatorId !== where.creatorId) return false;
            return true;
          });
          return list.map((c) => ({
            ...c,
            _count: {
              enrollments: mockState.enrollments.filter((e) => e.classId === c.id && e.status === 'JOINED').length,
            },
          }));
        }),
        create: vi.fn(async ({ data }: any) => {
          const newClass = {
            id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
            creator: {
              id: data.creatorId,
              displayName: data.creatorId === USER_IDS.TEACHER_1 ? 'Teacher One' : 'Teacher Two',
            },
            certification: { id: data.certificationId, name: '網頁設計丙級', code: '104300' },
          };
          mockState.classes.set(newClass.id, newClass);
          return newClass;
        }),
      },
      classEnrollment: {
        findFirst: vi.fn(async ({ where }: any) => {
          return (
            mockState.enrollments.find(
              (e) =>
                e.classId === where.classId &&
                e.studentId === where.studentId &&
                (!where.status || e.status === where.status)
            ) || null
          );
        }),
        findMany: vi.fn(async ({ where }: any) => {
          return mockState.enrollments
            .filter((e) => {
              if (where.studentId && e.studentId !== where.studentId) return false;
              if (where.classId && e.classId !== where.classId) return false;
              if (where.status && e.status !== where.status) return false;
              return true;
            })
            .map((e) => ({
              ...e,
              class: mockState.classes.get(e.classId),
              student: {
                id: e.studentId,
                displayName: e.studentId === USER_IDS.STUDENT_1 ? 'Student One' : 'Student Two',
                email: `${e.studentId}@codetoknow.edu`,
                createdAt: new Date(),
              },
            }));
        }),
        create: vi.fn(async ({ data }: any) => {
          const enrollment = {
            id: `enroll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            ...data,
            joinedAt: new Date(),
          };
          mockState.enrollments.push(enrollment);
          return enrollment;
        }),
        deleteMany: vi.fn(async ({ where }: any) => {
          const before = mockState.enrollments.length;
          mockState.enrollments = mockState.enrollments.filter(
            (e) => !(e.classId === where.classId && e.studentId === where.studentId)
          );
          return { count: before - mockState.enrollments.length };
        }),
      },
      auditLog: {
        create: vi.fn(async ({ data }: any) => {
          mockState.auditLogs.push(data);
          return { id: 'audit-1', ...data, createdAt: new Date() };
        }),
      },
    },
  };
});

describe('Phase 9 Batch 3: Classroom Management API Endpoints & RBAC Security Suite', () => {
  let app: any;
  const CSRF = 'csrf-test-token-123';

  beforeEach(async () => {
    vi.clearAllMocks();
    mockState.classes.clear();
    mockState.enrollments = [];
    mockState.auditLogs = [];

    // Dynamically import app so mock takes effect
    const appModule = await import('../src/app.js');
    app = appModule.app;
  });

  describe('1. POST /api/classrooms (Teacher Classroom Creation)', () => {
    it('allows a TEACHER to create a classroom and returns an 8-character join code', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          name: '高一資訊科技甲班',
          description: '104300 網頁設計術科練習班',
          certificationId: 'cert-web-design-c',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classroom.name).toBe('高一資訊科技甲班');
      expect(res.body.data.classroom.joinCode).toHaveLength(8);
      expect(res.body.data.classroom.creatorId).toBe(USER_IDS.TEACHER_1);
    });

    it('rejects a STUDENT attempting to create a classroom with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          name: '學生自建班級',
          certificationId: 'cert-web-design-c',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects forged creatorId in request body with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          name: '越權班級',
          certificationId: 'cert-web-design-c',
          creatorId: USER_IDS.TEACHER_2, // Forged
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
    });
  });

  describe('2. POST /api/classrooms/join (Student Classroom Enrollment)', () => {
    let createdJoinCode: string;
    let createdClassId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          name: '網頁設計丙級班',
          certificationId: 'cert-web-design-c',
        });
      createdJoinCode = res.body.data.classroom.joinCode;
      createdClassId = res.body.data.classroom.id;
    });

    it('allows a STUDENT to join a class using a valid join code', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          joinCode: createdJoinCode.toLowerCase(), // Normalization test
          seatNumber: '05',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.classId).toBe(createdClassId);
      expect(res.body.data.teacherName).toBe('Teacher One');
    });

    it('rejects invalid join code format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          joinCode: 'INVALID-CODE-TOO-LONG',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate class enrollment with 409 Conflict', async () => {
      // First join
      await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({ joinCode: createdJoinCode });

      // Second join
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({ joinCode: createdJoinCode });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('prevents a teacher from joining their own class as a student with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({ joinCode: createdJoinCode });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('教師無法以學生身分加入自己創建的班級');
    });
  });

  describe('3. Roster Management & Multi-Tenant IDOR Guard', () => {
    let teacher1ClassId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/classrooms')
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({
          name: 'Teacher 1 Class',
          certificationId: 'cert-104300',
        });
      teacher1ClassId = res.body.data.classroom.id;

      // Student 1 joins
      await request(app)
        .post('/api/classrooms/join')
        .set('Cookie', authCookies(TOKENS.STUDENT_1, CSRF))
        .set('x-csrf-token', CSRF)
        .send({ joinCode: res.body.data.classroom.joinCode, seatNumber: '01' });
    });

    it('allows class owner (Teacher 1) to view student roster', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${teacher1ClassId}/members`)
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).toHaveLength(1);
      expect(res.body.data.members[0].studentId).toBe(USER_IDS.STUDENT_1);
    });

    it('rejects a different teacher (Teacher 2) from viewing roster with 403 Forbidden', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${teacher1ClassId}/members`)
        .set('Cookie', authCookies(TOKENS.TEACHER_2, CSRF));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('allows an ADMIN to view any class roster via administrative override', async () => {
      const res = await request(app)
        .get(`/api/classrooms/${teacher1ClassId}/members`)
        .set('Cookie', authCookies(TOKENS.ADMIN, CSRF));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).toHaveLength(1);
    });

    it('allows class owner to remove a student and rejects unauthorized removal', async () => {
      // Teacher 2 tries to remove student from Teacher 1's class
      const unauthorizedRes = await request(app)
        .delete(`/api/classrooms/${teacher1ClassId}/members/${USER_IDS.STUDENT_1}`)
        .set('Cookie', authCookies(TOKENS.TEACHER_2, CSRF))
        .set('x-csrf-token', CSRF);

      expect(unauthorizedRes.status).toBe(403);

      // Teacher 1 successfully removes student
      const authorizedRes = await request(app)
        .delete(`/api/classrooms/${teacher1ClassId}/members/${USER_IDS.STUDENT_1}`)
        .set('Cookie', authCookies(TOKENS.TEACHER_1, CSRF))
        .set('x-csrf-token', CSRF);

      expect(authorizedRes.status).toBe(200);
      expect(authorizedRes.body.success).toBe(true);
    });
  });
});
