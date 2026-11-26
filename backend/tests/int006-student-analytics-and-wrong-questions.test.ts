import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';
import { hashToken } from '../src/utils/tokens.js';
import { SESSION_COOKIE_NAME } from '../src/middleware/authenticate.js';

const TEST_USERS = {
  STUDENT_A: {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'student.alice@codetoknow.edu',
    displayName: 'Student Alice',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
  STUDENT_B: {
    id: '77777777-7777-4777-8777-777777777777',
    email: 'student.bob@codetoknow.edu',
    displayName: 'Student Bob',
    roles: ['STUDENT'],
    status: 'ACTIVE',
  },
};

const TOKENS = {
  STUDENT_A: 'student-alice-token',
  STUDENT_B: 'student-bob-token',
};

function authCookie(token: string, csrf = 'csrf-test-token') {
  return [`${SESSION_COOKIE_NAME}=${token}`, `XSRF-TOKEN=${csrf}`];
}

function makeSessionUser(tokenHash: string) {
  const users: Record<string, typeof TEST_USERS.STUDENT_A> = {
    [hashToken(TOKENS.STUDENT_A)]: TEST_USERS.STUDENT_A,
    [hashToken(TOKENS.STUDENT_B)]: TEST_USERS.STUDENT_B,
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

describe('CTK-CORE-01-INT-006: Student Analytics, Study Time Tracking & Wrong-Question Closed Loop', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(prisma.session, 'findUnique').mockImplementation(async ({ where }: any) => {
      const tokenHash = where?.tokenHash;
      if (!tokenHash) return null;
      return makeSessionUser(tokenHash) as any;
    });
  });

  describe('INT-006-A: Study Time Tracking (POST & GET /api/student/study-time)', () => {
    it('successfully records study time and increments atomically', async () => {
      let storedSeconds = 0;

      vi.spyOn(prisma.studyTimeLog, 'findUnique').mockImplementation(async () => {
        if (storedSeconds === 0) return null;
        return {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: storedSeconds,
        } as any;
      });

      vi.spyOn(prisma.studyTimeLog, 'create').mockImplementation(async ({ data }: any) => {
        storedSeconds = data.durationSeconds;
        return {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: storedSeconds,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });

      vi.spyOn(prisma.studyTimeLog, 'update').mockImplementation(async ({ data }: any) => {
        storedSeconds = data.durationSeconds;
        return {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: storedSeconds,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });

      vi.spyOn(prisma.studyTimeLog, 'findMany').mockResolvedValue([
        {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const res1 = await request(app)
        .post('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          durationSeconds: 120,
          moduleType: 'THEORY',
          date: '2026-11-26',
        });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.data.record.durationSeconds).toBe(120);
      expect(res1.body.data.summary.totalSeconds).toBe(120);
    });

    it('clamps study time to maximum daily ceiling of 86,400s (24 hours)', async () => {
      vi.spyOn(prisma.studyTimeLog, 'findUnique').mockResolvedValue({
        id: 'log-1',
        userId: TEST_USERS.STUDENT_A.id,
        studyDate: '2026-11-26',
        moduleType: 'THEORY',
        durationSeconds: 86350, // 50 seconds remaining to 24h
      } as any);

      vi.spyOn(prisma.studyTimeLog, 'update').mockImplementation(async ({ data }: any) => {
        return {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: data.durationSeconds,
        } as any;
      });

      vi.spyOn(prisma.studyTimeLog, 'findMany').mockResolvedValue([
        {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: 86400,
        },
      ] as any);

      // Student tries to add 120s when only 50s are left in the day
      const res = await request(app)
        .post('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          durationSeconds: 120,
          moduleType: 'THEORY',
          date: '2026-11-26',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.record.durationSeconds).toBe(86400); // clamped to 86,400
    });

    it('rejects duration overflow (> 7200s), negative values, and forged fields', async () => {
      // 1. Duration > 7200 seconds rejected
      const resOverflow = await request(app)
        .post('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          durationSeconds: 999999,
          moduleType: 'THEORY',
        });
      expect(resOverflow.status).toBe(400);

      // 2. Negative seconds rejected
      const resNegative = await request(app)
        .post('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          durationSeconds: -50,
          moduleType: 'THEORY',
        });
      expect(resNegative.status).toBe(400);

      // 3. Forged userId forbidden
      const resForged = await request(app)
        .post('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          userId: TEST_USERS.STUDENT_B.id,
          durationSeconds: 60,
          moduleType: 'THEORY',
        });
      expect(resForged.status).toBe(403);
    });

    it('returns aggregated summary across modules and 7-day daily logs', async () => {
      vi.spyOn(prisma.studyTimeLog, 'findMany').mockResolvedValue([
        {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: 3600,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'log-2',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'MOCK_EXAM',
          durationSeconds: 1800,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const res = await request(app)
        .get('/api/student/study-time')
        .set('Cookie', authCookie(TOKENS.STUDENT_A));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalSeconds).toBe(5400);
      expect(res.body.data.totalHours).toBe(1.5);
      expect(res.body.data.byModule.THEORY).toBe(3600);
      expect(res.body.data.byModule.MOCK_EXAM).toBe(1800);
      expect(Array.isArray(res.body.data.dailyLogs)).toBe(true);
      expect(res.body.data.dailyLogs.length).toBe(7);
    });
  });

  describe('INT-006-B: Progress Analytics & 4 Official Work Items (GET /api/student/progress-analytics)', () => {
    it('dynamically computes official work items progress (236, 233, 71, 65 questions)', async () => {
      const mockSubjects = [
        {
          id: 'sub-1',
          code: '17300-01',
          title: '工作項目 01：作業準備',
          _count: { questions: 236 },
        },
        {
          id: 'sub-2',
          code: '17300-02',
          title: '工作項目 02：應用軟體安裝及使用',
          _count: { questions: 233 },
        },
        {
          id: 'sub-3',
          code: '17300-03',
          title: '工作項目 03：系統軟體安裝及使用',
          _count: { questions: 71 },
        },
        {
          id: 'sub-4',
          code: '17300-04',
          title: '工作項目 04：資訊及安全',
          _count: { questions: 65 },
        },
      ];

      vi.spyOn(prisma.subject, 'findMany').mockResolvedValue(mockSubjects as any);
      vi.spyOn(prisma.unitProgress, 'findMany').mockResolvedValue([] as any);
      vi.spyOn(prisma.examAttempt, 'findMany').mockResolvedValue([
        {
          id: 'exam-1',
          score: 85,
          isPassed: true,
          answerSnapshots: [
            {
              questionId: 'q-101',
              isCorrect: true,
              question: { subjectId: 'sub-1' },
            },
            {
              questionId: 'q-102',
              isCorrect: false,
              question: { subjectId: 'sub-1' },
            },
            {
              questionId: 'q-201',
              isCorrect: true,
              question: { subjectId: 'sub-2' },
            },
          ],
        },
      ] as any);

      vi.spyOn(prisma.wrongQuestionRecord, 'findMany').mockResolvedValue([
        {
          id: 'wq-1',
          questionId: 'q-102',
          masteryStatus: 'UNRESOLVED',
          question: { subjectId: 'sub-1' },
        },
      ] as any);

      vi.spyOn(prisma.studyTimeLog, 'findMany').mockResolvedValue([
        {
          id: 'log-1',
          userId: TEST_USERS.STUDENT_A.id,
          studyDate: '2026-11-26',
          moduleType: 'THEORY',
          durationSeconds: 3600,
        },
      ] as any);

      vi.spyOn(prisma.practicalProgress, 'findMany').mockResolvedValue([
        { version: 'VERSION_A', status: 'COMPLETED' },
      ] as any);

      const res = await request(app)
        .get('/api/student/progress-analytics')
        .set('Cookie', authCookie(TOKENS.STUDENT_A));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const data = res.body.data;

      expect(data.overview.totalOfficialQuestions).toBe(605);
      expect(data.overview.totalAttempted).toBe(3); // q-101, q-102, q-201
      expect(data.overview.totalStudyHours).toBe(1.0);
      expect(data.overview.highestExamScore).toBe(85);
      expect(data.overview.practicalTasksCompletedVA).toBe(1);

      // Verify 4 subjects
      expect(data.subjects.length).toBe(4);
      const sub1 = data.subjects.find((s: any) => s.code === '17300-01');
      expect(sub1.totalQuestions).toBe(236);
      expect(sub1.completedQuestions).toBe(2);
      expect(sub1.status).toBe('IN_PROGRESS');

      const sub3 = data.subjects.find((s: any) => s.code === '17300-03');
      expect(sub3.totalQuestions).toBe(71);
      expect(sub3.completedQuestions).toBe(0);
      expect(sub3.status).toBe('NOT_STARTED');

      // Recommended focus points to unstarted or weakest subject
      expect(data.recommendedFocus).not.toBeNull();
    });
  });

  describe('INT-006-C: Wrong Questions Closed-Loop (POST /api/wrong-questions/record & practice)', () => {
    it('creates and records a wrong question from theory practice', async () => {
      const qId = '11111111-2222-3333-4444-555555555555';

      vi.spyOn(prisma.question, 'findUnique').mockResolvedValue({
        id: qId,
        officialNumber: 42,
        questionText: '下列哪種 HTML 標籤具備語意化特性？',
        correctAnswer: 'A',
        explanation: '<article> 是標準 HTML5 語意化標籤。',
        subject: { id: 'sub-2', code: '17300-02', title: '工作項目 02' },
        options: [{ key: 'A', text: '<article>' }, { key: 'B', text: '<div>' }],
      } as any);

      vi.spyOn(prisma.wrongQuestionRecord, 'upsert').mockResolvedValue({
        id: 'wq-rec-1',
        userId: TEST_USERS.STUDENT_A.id,
        questionId: qId,
        wrongCount: 1,
        consecutiveCorrectCount: 0,
        masteryStatus: 'UNRESOLVED',
        isResolved: false,
        lastUserAnswer: 'B',
        lastAttemptAt: new Date(),
      } as any);

      vi.spyOn(prisma.unitProgress, 'upsert').mockResolvedValue({} as any);

      const res = await request(app)
        .post('/api/wrong-questions/record')
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({
          questionId: qId,
          selectedAnswer: 'B',
          source: 'THEORY_PRACTICE',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.masteryStatus).toBe('UNRESOLVED');
      expect(res.body.data.wrongCount).toBe(1);
      expect(res.body.data.officialNumber).toBe(42);
    });

    it('advances state machine: UNRESOLVED -> REVIEWING -> MASTERED upon 2 consecutive correct answers', async () => {
      const recId = 'wq-rec-1';
      const qId = '11111111-2222-3333-4444-555555555555';

      const initialRecord = {
        id: recId,
        userId: TEST_USERS.STUDENT_A.id,
        questionId: qId,
        wrongCount: 2,
        consecutiveCorrectCount: 0,
        masteryStatus: 'UNRESOLVED',
        isResolved: false,
        resolvedAt: null,
        question: {
          id: qId,
          correctAnswer: 'A',
          explanation: '解析內容',
          options: [],
          subject: { code: '17300-02', title: '科目' },
        },
      };

      // 1st practice: student answers 'A' (correct) -> REVIEWING (consecutive = 1)
      vi.spyOn(prisma.wrongQuestionRecord, 'findUnique').mockResolvedValue(initialRecord as any);
      vi.spyOn(prisma.wrongQuestionRecord, 'update').mockResolvedValue({
        ...initialRecord,
        consecutiveCorrectCount: 1,
        masteryStatus: 'REVIEWING',
        isResolved: false,
        lastAttemptAt: new Date(),
      } as any);

      const res1 = await request(app)
        .post(`/api/wrong-questions/${recId}/practice`)
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({ answer: 'A' });

      expect(res1.status).toBe(200);
      expect(res1.body.data.isCorrect).toBe(true);
      expect(res1.body.data.consecutiveCorrectCount).toBe(1);
      expect(res1.body.data.masteryStatus).toBe('REVIEWING');
      expect(res1.body.data.isResolved).toBe(false);

      // 2nd practice: student answers 'A' (correct) -> MASTERED (consecutive = 2)
      vi.spyOn(prisma.wrongQuestionRecord, 'findUnique').mockResolvedValue({
        ...initialRecord,
        consecutiveCorrectCount: 1,
        masteryStatus: 'REVIEWING',
      } as any);
      vi.spyOn(prisma.wrongQuestionRecord, 'update').mockResolvedValue({
        ...initialRecord,
        consecutiveCorrectCount: 2,
        masteryStatus: 'MASTERED',
        isResolved: true,
        resolvedAt: new Date(),
        lastAttemptAt: new Date(),
      } as any);

      const res2 = await request(app)
        .post(`/api/wrong-questions/${recId}/practice`)
        .set('Cookie', authCookie(TOKENS.STUDENT_A))
        .set('x-csrf-token', 'csrf-test-token')
        .send({ answer: 'A' });

      expect(res2.status).toBe(200);
      expect(res2.body.data.isCorrect).toBe(true);
      expect(res2.body.data.consecutiveCorrectCount).toBe(2);
      expect(res2.body.data.masteryStatus).toBe('MASTERED');
      expect(res2.body.data.isResolved).toBe(true);
    });

    it('IDOR defense: Student B cannot review or modify Student A wrong question', async () => {
      const recId = 'wq-rec-1';
      vi.spyOn(prisma.wrongQuestionRecord, 'findUnique').mockResolvedValue({
        id: recId,
        userId: TEST_USERS.STUDENT_A.id, // Owned by Alice
        questionId: 'q-1',
        masteryStatus: 'UNRESOLVED',
        question: { correctAnswer: 'A', options: [], subject: { code: '17300-01' } },
      } as any);

      const res = await request(app)
        .post(`/api/wrong-questions/${recId}/practice`)
        .set('Cookie', authCookie(TOKENS.STUDENT_B)) // Bob tries to access
        .set('x-csrf-token', 'csrf-test-token')
        .send({ answer: 'A' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
