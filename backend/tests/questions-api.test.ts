import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

// Mock prisma queries to test routes without requiring live DB mutations
vi.mock('../src/config/database.js', () => ({
  prisma: {
    certification: {
      findMany: vi.fn(),
    },
    question: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe('CTK-CORE-01-INT-001: Question & Certification API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/certifications', () => {
    it('should return 200 and list of active certifications with subject statistics', async () => {
      const mockCertifications = [
        {
          id: 'cert-1',
          code: '17300',
          name: '勞動部技能檢定 17300 網頁設計丙級',
          level: 'LEVEL_C',
          category: 'WEB_DESIGN',
          officialVersion: '113/114年版',
          subjects: [
            {
              id: 'sub-1',
              code: '17300-01',
              title: '工作項目 01：作業準備',
              examType: 'THEORY',
              displayOrder: 1,
              _count: { questions: 120 },
            },
          ],
        },
      ];

      (prisma.certification.findMany as any).mockResolvedValue(mockCertifications);

      const res = await request(app).get('/api/certifications');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].code).toBe('17300');
      expect(res.body.data[0].subjects[0].questionCount).toBe(120);
    });
  });

  describe('GET /api/questions', () => {
    it('should return 200 and paginated list of questions', async () => {
      const mockQuestions = [
        {
          id: 'q-1',
          officialNumber: 1,
          questionText: 'HTML5 中哪一個元素代表網頁主體內容？',
          codeSnippet: null,
          questionType: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          correctAnswer: 'A',
          explanation: 'main 代表主體',
          sourceName: '勞動部官方題庫',
          sourceVersion: '113/114年版',
          subject: {
            id: 'sub-1',
            code: '17300-01',
            title: '工作項目 01：作業準備',
          },
          options: [
            { id: 'opt-1', key: 'A', text: '<main>' },
            { id: 'opt-2', key: 'B', text: '<header>' },
            { id: 'opt-3', key: 'C', text: '<footer>' },
            { id: 'opt-4', key: 'D', text: '<aside>' },
          ],
        },
      ];

      (prisma.question.count as any).mockResolvedValue(1);
      (prisma.question.findMany as any).mockResolvedValue(mockQuestions);

      const res = await request(app).get('/api/questions?certificationCode=17300&workItem=01');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.questions).toHaveLength(1);
      expect(res.body.data.questions[0].officialSection).toBe('01');
      expect(res.body.data.questions[0].options).toHaveLength(4);
    });

    it('should validate query parameters and reject invalid workItem', async () => {
      const res = await request(app).get('/api/questions?workItem=99');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/questions/:id', () => {
    it('should return 400 when question ID is not a valid UUID', async () => {
      const res = await request(app).get('/api/questions/invalid-uuid');

      expect(res.status).toBe(400);
    });

    it('should return 200 and question details for valid UUID', async () => {
      const validUuid = '11111111-1111-1111-1111-111111111111';
      const mockQuestion = {
        id: validUuid,
        officialNumber: 15,
        questionText: 'CSS 的優先權最高者為？',
        codeSnippet: null,
        questionType: 'SINGLE_CHOICE',
        difficulty: 'MEDIUM',
        correctAnswer: 'D',
        explanation: '!important 或行內樣式優先權最高',
        sourceName: '勞動部官方題庫',
        sourceVersion: '113/114年版',
        status: 'ACTIVE',
        subject: {
          id: 'sub-2',
          code: '17300-02',
          title: '工作項目 02：應用軟體安裝及使用',
          certification: {
            id: 'cert-1',
            code: '17300',
            name: '網頁設計丙級',
          },
        },
        options: [
          { id: 'opt-1', key: 'A', text: '元素選取器' },
          { id: 'opt-2', key: 'B', text: '類別選取器' },
          { id: 'opt-3', key: 'C', text: 'ID 選取器' },
          { id: 'opt-4', key: 'D', text: '!important 行內樣式' },
        ],
      };

      (prisma.question.findUnique as any).mockResolvedValue(mockQuestion);

      const res = await request(app).get(`/api/questions/${validUuid}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(validUuid);
      expect(res.body.data.officialSection).toBe('02');
      expect(res.body.data.correctAnswer).toBe('D');
    });

    it('should return 404 when question does not exist', async () => {
      const validUuid = '22222222-2222-2222-2222-222222222222';
      (prisma.question.findUnique as any).mockResolvedValue(null);

      const res = await request(app).get(`/api/questions/${validUuid}`);

      expect(res.status).toBe(404);
    });
  });
});
