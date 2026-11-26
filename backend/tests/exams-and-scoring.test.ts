import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

// Mock prisma queries to test routes without requiring live DB mutations
vi.mock('../src/config/database.js', () => ({
  prisma: {
    certification: {
      findUnique: vi.fn(),
    },
    examPaper: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    question: {
      findMany: vi.fn(),
    },
    examAttempt: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    examAnswerSnapshot: {
      createMany: vi.fn(),
    },
    wrongQuestionRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe('CTK-CORE-01-INT-002: Mock Exam, Scoring & Wrong Question Notebook API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockQuestions = Array.from({ length: 80 }, (_, i) => ({
    id: `q-${i + 1}`,
    officialNumber: i + 1,
    questionText: `這是第 ${i + 1} 題題目內容`,
    codeSnippet: null,
    questionType: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    correctAnswer: 'B',
    explanation: `第 ${i + 1} 題官方詳細解析說明`,
    subject: {
      code: i < 31 ? '17300-01' : i < 62 ? '17300-02' : i < 71 ? '17300-03' : '17300-04',
      title: i < 31 ? '工作項目 01：作業準備' : i < 62 ? '工作項目 02：應用軟體' : i < 71 ? '工作項目 03：系統軟體' : '工作項目 04：資訊安全',
    },
    options: [
      { key: 'A', text: '選項 A 說明', displayOrder: 1 },
      { key: 'B', text: '選項 B 說明', displayOrder: 2 },
      { key: 'C', text: '選項 C 說明', displayOrder: 3 },
      { key: 'D', text: '選項 D 說明', displayOrder: 4 },
    ],
  }));

  describe('POST /api/exams/generate', () => {
    it('should generate 80-question paper and NEVER leak answers or explanations', async () => {
      (prisma.certification.findUnique as any).mockResolvedValue({
        id: 'cert-1',
        code: '17300',
        name: '勞動部技能檢定 17300 網頁設計丙級',
        officialVersion: '113/114年版',
        subjects: [
          { id: 'sub-1', code: '17300-01', title: '作業準備' },
          { id: 'sub-2', code: '17300-02', title: '應用軟體' },
          { id: 'sub-3', code: '17300-03', title: '系統軟體' },
          { id: 'sub-4', code: '17300-04', title: '資訊安全' },
        ],
      });

      (prisma.examPaper.findFirst as any).mockResolvedValue({
        id: 'paper-1',
        title: '網頁設計丙級 學科全真模擬試卷',
        timeLimitMinutes: 100,
        totalQuestions: 80,
        passingScore: 60,
      });

      (prisma.question.findMany as any)
        .mockResolvedValueOnce(mockQuestions.filter((q) => q.subject.code === '17300-01'))
        .mockResolvedValueOnce(mockQuestions.filter((q) => q.subject.code === '17300-02'))
        .mockResolvedValueOnce(mockQuestions.filter((q) => q.subject.code === '17300-03'))
        .mockResolvedValueOnce(mockQuestions.filter((q) => q.subject.code === '17300-04'));

      (prisma.examAttempt.create as any).mockResolvedValue({
        id: 'attempt-123',
        userId: 'demo-student',
        examPaperId: 'paper-1',
        status: 'IN_PROGRESS',
        startedAt: new Date('2026-11-25T10:00:00Z'),
      });

      const res = await request(app)
        .post('/api/exams/generate')
        .set('x-skip-csrf', 'true')
        .send({ mode: 'official_100', strategy: 'stratified' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBe('attempt-123');
      expect(res.body.data.totalQuestions).toBe(80);
      expect(res.body.data.questions).toHaveLength(80);

      // CRITICAL ANTI-CHEAT ASSERTIONS:
      res.body.data.questions.forEach((q: any) => {
        expect(q.correctAnswer).toBeUndefined();
        expect(q.explanation).toBeUndefined();
        expect(q.options).toHaveLength(4);
        expect(q.options[0]).toHaveProperty('key');
        expect(q.options[0]).toHaveProperty('text');
      });
    });
  });

  describe('POST /api/exams/:id/submit', () => {
    it('should accurately calculate score (1.25 pts/question), record snapshots and upsert wrong questions', async () => {
      const assignedIds = mockQuestions.map((q) => q.id);

      (prisma.examAttempt.findUnique as any).mockResolvedValue({
        id: 'attempt-123',
        userId: 'demo-student',
        status: 'IN_PROGRESS',
        startedAt: new Date(Date.now() - 3600 * 1000),
        assignedQuestionIds: JSON.stringify(assignedIds),
        examPaper: { id: 'paper-1', title: '全真模擬試卷' },
      });

      (prisma.question.findMany as any).mockResolvedValue(mockQuestions);
      (prisma.examAttempt.update as any).mockResolvedValue({});
      (prisma.examAnswerSnapshot.createMany as any).mockResolvedValue({});
      (prisma.wrongQuestionRecord.upsert as any).mockResolvedValue({});

      // Provide answers: 60 correct ('B') and 20 wrong ('A') -> 60 * 1.25 = 75.0 points (PASS >= 60)
      const answers: Record<string, string> = {};
      assignedIds.forEach((id, i) => {
        answers[id] = i < 60 ? 'B' : 'A';
      });

      const res = await request(app)
        .post('/api/exams/attempt-123/submit')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({ answers, durationSeconds: 2400 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(75.0);
      expect(res.body.data.isPassed).toBe(true);
      expect(res.body.data.correctCount).toBe(60);
      expect(res.body.data.wrongCount).toBe(20);
      expect(res.body.data.snapshots).toHaveLength(80);
      expect(res.body.data.sectionBreakdown).toBeDefined();

      // Verify transaction actions
      expect(prisma.examAttempt.update).toHaveBeenCalled();
      expect(prisma.examAnswerSnapshot.createMany).toHaveBeenCalled();
      expect(prisma.wrongQuestionRecord.upsert).toHaveBeenCalledTimes(20);
    });

    it('should reject double submissions to prevent score manipulation (idempotency)', async () => {
      (prisma.examAttempt.findUnique as any).mockResolvedValue({
        id: 'attempt-123',
        userId: 'demo-student',
        status: 'SUBMITTED', // already submitted
        startedAt: new Date(),
        assignedQuestionIds: JSON.stringify(['q-1']),
      });

      const res = await request(app)
        .post('/api/exams/attempt-123/submit')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({ answers: { 'q-1': 'B' } });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('EXAM_ALREADY_SUBMITTED');
    });

    it('should deny unauthorized user from submitting another user attempt (IDOR Defense)', async () => {
      (prisma.examAttempt.findUnique as any).mockResolvedValue({
        id: 'attempt-123',
        userId: 'student-victim',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        assignedQuestionIds: JSON.stringify(['q-1']),
      });

      const res = await request(app)
        .post('/api/exams/attempt-123/submit')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'student-attacker')
        .send({ answers: { 'q-1': 'B' } });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
    });
  });

  describe('GET /api/wrong-questions', () => {
    it('should return wrong question list and section statistics', async () => {
      const mockRecords = [
        {
          id: 'rec-1',
          userId: 'demo-student',
          questionId: 'q-1',
          wrongCount: 2,
          consecutiveCorrectCount: 1,
          masteryStatus: 'REVIEWING',
          lastUserAnswer: 'A',
          isResolved: false,
          firstWrongAt: new Date(),
          lastAttemptAt: new Date(),
          resolvedAt: null,
          question: {
            id: 'q-1',
            officialNumber: 1,
            questionText: '題目 1',
            codeSnippet: null,
            correctAnswer: 'B',
            explanation: '解析 1',
            subject: { code: '17300-01', title: '作業準備' },
            options: [
              { key: 'A', text: '選項 A' },
              { key: 'B', text: '選項 B' },
            ],
          },
        },
      ];

      (prisma.wrongQuestionRecord.findMany as any)
        .mockResolvedValueOnce(mockRecords) // for statistics
        .mockResolvedValueOnce(mockRecords); // for paginated list
      (prisma.wrongQuestionRecord.count as any).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/wrong-questions')
        .set('x-user-id', 'demo-student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalRecorded).toBe(1);
      expect(res.body.data.stats.reviewingCount).toBe(1);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].questionId).toBe('q-1');
      expect(res.body.data.items[0].masteryStatus).toBe('REVIEWING');
    });
  });

  describe('POST /api/wrong-questions/:id/practice', () => {
    it('should transition to MASTERED when consecutive correct reaches 2', async () => {
      (prisma.wrongQuestionRecord.findUnique as any).mockResolvedValue({
        id: 'rec-1',
        userId: 'demo-student',
        questionId: 'q-1',
        wrongCount: 2,
        consecutiveCorrectCount: 1, // Already answered correctly once
        masteryStatus: 'REVIEWING',
        isResolved: false,
        resolvedAt: null,
        question: {
          id: 'q-1',
          correctAnswer: 'B',
          explanation: '正確解析說明',
          options: [{ key: 'B', text: '答案' }],
          subject: { code: '17300-01', title: '作業準備' },
        },
      });

      (prisma.wrongQuestionRecord.update as any).mockImplementation(({ data }: any) => ({
        id: 'rec-1',
        questionId: 'q-1',
        wrongCount: 2,
        consecutiveCorrectCount: data.consecutiveCorrectCount,
        masteryStatus: data.masteryStatus,
        isResolved: data.isResolved,
        resolvedAt: data.resolvedAt,
        lastAttemptAt: data.lastAttemptAt,
        question: {
          correctAnswer: 'B',
          explanation: '正確解析說明',
        },
      }));

      // Answer correctly second time ('B')
      const res = await request(app)
        .post('/api/wrong-questions/rec-1/practice')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({ answer: 'B' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCorrect).toBe(true);
      expect(res.body.data.consecutiveCorrectCount).toBe(2);
      expect(res.body.data.masteryStatus).toBe('MASTERED');
      expect(res.body.data.isResolved).toBe(true);
    });

    it('should reset consecutive count to 0 and set UNRESOLVED on incorrect answer', async () => {
      (prisma.wrongQuestionRecord.findUnique as any).mockResolvedValue({
        id: 'rec-1',
        userId: 'demo-student',
        questionId: 'q-1',
        wrongCount: 2,
        consecutiveCorrectCount: 1,
        masteryStatus: 'REVIEWING',
        isResolved: false,
        resolvedAt: null,
        question: {
          id: 'q-1',
          correctAnswer: 'B',
          explanation: '正確解析說明',
          options: [{ key: 'B', text: '答案' }],
          subject: { code: '17300-01', title: '作業準備' },
        },
      });

      (prisma.wrongQuestionRecord.update as any).mockImplementation(({ data }: any) => ({
        id: 'rec-1',
        questionId: 'q-1',
        wrongCount: 3,
        consecutiveCorrectCount: data.consecutiveCorrectCount,
        masteryStatus: data.masteryStatus,
        isResolved: data.isResolved,
        resolvedAt: null,
        lastAttemptAt: data.lastAttemptAt,
        question: {
          correctAnswer: 'B',
          explanation: '正確解析說明',
        },
      }));

      // Answer incorrectly ('C')
      const res = await request(app)
        .post('/api/wrong-questions/rec-1/practice')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({ answer: 'C' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isCorrect).toBe(false);
      expect(res.body.data.consecutiveCorrectCount).toBe(0);
      expect(res.body.data.masteryStatus).toBe('UNRESOLVED');
      expect(res.body.data.isResolved).toBe(false);
    });

    it('should prevent IDOR tampering on another user wrong question record', async () => {
      (prisma.wrongQuestionRecord.findUnique as any).mockResolvedValue({
        id: 'rec-victim',
        userId: 'student-victim',
        questionId: 'q-1',
        question: { correctAnswer: 'B' },
      });

      const res = await request(app)
        .post('/api/wrong-questions/rec-victim/practice')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'student-attacker')
        .send({ answer: 'B' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('OWNERSHIP_FORBIDDEN');
    });
  });
});
