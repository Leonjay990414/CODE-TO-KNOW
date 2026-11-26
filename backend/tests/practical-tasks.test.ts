import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/database.js';

vi.mock('../src/config/database.js', () => ({
  prisma: {
    practicalTask: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    practicalStep: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    practicalProgress: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    practicalStepProgress: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
  },
}));

describe('CTK-CORE-01-INT-003: Practical Learning & Code Persistence API Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTasks = [
    {
      id: 'task-1',
      taskNumber: 1,
      taskCode: '17300-104301',
      title: '題組一：校園社團介紹網',
      theme: '頁框佈局結構與跑馬燈廣告',
      canvasWidth: '1024px',
      estimatedMinutes: 90,
      materialPath: '173003B13/.../17300-104301',
      defaultHtmlCode: '<h1>校園社團介紹網</h1>',
      defaultCssCode: 'body { width: 1024px; }',
      defaultJsCode: '',
      status: 'AVAILABLE',
      steps: [
        { id: 's-1-a-1', version: 'VERSION_A', stepNumber: 1 },
        { id: 's-1-a-2', version: 'VERSION_A', stepNumber: 2 },
        { id: 's-1-b-1', version: 'VERSION_B', stepNumber: 1 },
      ],
    },
    {
      id: 'task-2',
      taskNumber: 2,
      taskCode: '17300-104302',
      title: '題組二：運動廣場連結網',
      theme: '左右框架連動與表格排版',
      canvasWidth: '1024px',
      estimatedMinutes: 95,
      materialPath: '173003B13/.../17300-104302',
      defaultHtmlCode: '<h1>運動廣場連結網</h1>',
      defaultCssCode: '',
      defaultJsCode: '',
      status: 'AVAILABLE',
      steps: [],
    },
    {
      id: 'task-3',
      taskNumber: 3,
      taskCode: '17300-104303',
      title: '題組三：國家公園介紹網',
      theme: '多邊形影像地圖與音訊嵌入',
      canvasWidth: '1024px',
      estimatedMinutes: 95,
      materialPath: '173003B13/.../17300-104303',
      defaultHtmlCode: '<h1>國家公園介紹網</h1>',
      defaultCssCode: '',
      defaultJsCode: '',
      status: 'AVAILABLE',
      steps: [],
    },
    {
      id: 'task-4',
      taskNumber: 4,
      taskCode: '17300-104304',
      title: '題組四：網路行銷購物網',
      theme: '電子商務購物車商品陳列與表單驗證',
      canvasWidth: '1024px',
      estimatedMinutes: 100,
      materialPath: '173003B13/.../17300-104304',
      defaultHtmlCode: '<h1>網路行銷購物網</h1>',
      defaultCssCode: '',
      defaultJsCode: '',
      status: 'AVAILABLE',
      steps: [],
    },
    {
      id: 'task-5',
      taskNumber: 5,
      taskCode: '17300-104305',
      title: '題組五：書曼的旅遊相簿',
      theme: '旅遊相簿展示與幻燈片播放',
      canvasWidth: '1024px',
      estimatedMinutes: 105,
      materialPath: '173003B13/.../17300-104305',
      defaultHtmlCode: '<h1>書曼的旅遊相簿</h1>',
      defaultCssCode: '',
      defaultJsCode: '',
      status: 'AVAILABLE',
      steps: [],
    },
  ];

  describe('GET /api/practical-tasks', () => {
    it('should return exactly 5 official tasks with dual version progress summaries', async () => {
      (prisma.practicalTask.findMany as any).mockResolvedValue(mockTasks);
      (prisma.practicalProgress.findMany as any).mockResolvedValue([
        {
          id: 'prog-1-a',
          userId: 'demo-student',
          taskId: 'task-1',
          version: 'VERSION_A',
          status: 'IN_PROGRESS',
          practiceCount: 2,
          lastPracticedAt: new Date('2026-11-25T11:00:00Z'),
          stepProgresses: [{ stepId: 's-1-a-1', isCompleted: true }],
        },
      ]);

      const res = await request(app)
        .get('/api/practical-tasks')
        .set('x-user-id', 'demo-student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(5);

      // Verify task codes
      const taskCodes = res.body.data.map((t: any) => t.taskCode);
      expect(taskCodes).toEqual([
        '17300-104301',
        '17300-104302',
        '17300-104303',
        '17300-104304',
        '17300-104305',
      ]);

      // Verify NO illegal task (like Taiwan food tour)
      const hasFoodTask = res.body.data.some((t: any) => t.title.includes('美食'));
      expect(hasFoodTask).toBe(false);

      // Check task-1 dual version progress isolation
      const task1 = res.body.data[0];
      expect(task1.progress.versionA.completedSteps).toBe(1);
      expect(task1.progress.versionA.totalSteps).toBe(2);
      expect(task1.progress.versionA.status).toBe('IN_PROGRESS');
      expect(task1.progress.versionB.completedSteps).toBe(0);
      expect(task1.progress.versionB.status).toBe('NOT_STARTED');
    });
  });

  describe('GET /api/practical-tasks/:taskId', () => {
    it('should return Version A details and steps by default', async () => {
      (prisma.practicalTask.findFirst as any).mockResolvedValue(mockTasks[0]);
      (prisma.practicalStep.findMany as any).mockResolvedValue([
        {
          id: 's-1-a-1',
          taskId: 'task-1',
          version: 'VERSION_A',
          stepNumber: 1,
          title: '環境建置與 webXX 目錄規範',
          description: '考場硬性規定主目錄為 C:\\webXX...',
          videoUrl: null,
          videoStartSeconds: null,
          pitfallWarning: '未建立 images/ 資料夾不予計分',
        },
      ]);
      (prisma.practicalProgress.findUnique as any).mockResolvedValue({
        id: 'prog-1-a',
        userId: 'demo-student',
        taskId: 'task-1',
        version: 'VERSION_A',
        status: 'IN_PROGRESS',
        practiceCount: 1,
        savedHtmlCode: '<html><body>自訂已存代碼</body></html>',
        savedCssCode: 'body { margin: 0; }',
        savedJsCode: '',
        lastPracticedAt: new Date('2026-11-25T11:00:00Z'),
        stepProgresses: [{ stepId: 's-1-a-1', isCompleted: true }],
      });

      const res = await request(app)
        .get('/api/practical-tasks/17300-104301?version=VERSION_A')
        .set('x-user-id', 'demo-student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.task.taskCode).toBe('17300-104301');
      expect(res.body.data.version).toBe('VERSION_A');
      expect(res.body.data.steps).toHaveLength(1);
      expect(res.body.data.steps[0].isCompleted).toBe(true);
      expect(res.body.data.progress.savedHtmlCode).toContain('自訂已存代碼');
    });

    it('should return Version B details with playlist video info', async () => {
      (prisma.practicalTask.findFirst as any).mockResolvedValue(mockTasks[0]);
      (prisma.practicalStep.findMany as any).mockResolvedValue([
        {
          id: 's-1-b-1',
          taskId: 'task-1',
          version: 'VERSION_B',
          stepNumber: 1,
          title: '題組一版面影音分解',
          description: '影音分解教學...',
          videoUrl: 'https://www.youtube.com/watch?v=TZ5EJatWres',
          videoStartSeconds: 0,
          pitfallWarning: '待連網串流驗證',
        },
      ]);
      (prisma.practicalProgress.findUnique as any).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/practical-tasks/task-1?version=VERSION_B')
        .set('x-user-id', 'demo-student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('VERSION_B');
      expect(res.body.data.steps[0].videoUrl).toContain('TZ5EJatWres');
      expect(res.body.data.progress.status).toBe('NOT_STARTED');
    });
  });

  describe('POST /api/practical-tasks/:taskId/progress', () => {
    it('should save code and toggle step completion with version isolation', async () => {
      (prisma.practicalTask.findFirst as any).mockResolvedValue(mockTasks[0]);

      const mockProgress = {
        id: 'prog-1-a',
        userId: 'demo-student',
        taskId: 'task-1',
        version: 'VERSION_A',
        status: 'IN_PROGRESS',
        practiceCount: 2,
        savedHtmlCode: '<main>Updated HTML</main>',
        savedCssCode: 'main { display: block; }',
        savedJsCode: 'console.log("ready");',
        lastPracticedAt: new Date(),
      };

      (prisma.practicalProgress.findUnique as any).mockResolvedValue(mockProgress);
      (prisma.practicalProgress.update as any).mockResolvedValue(mockProgress);
      (prisma.practicalStep.findUnique as any).mockResolvedValue({
        id: 's-1-a-1',
        taskId: 'task-1',
        version: 'VERSION_A',
      });
      (prisma.practicalStepProgress.upsert as any).mockResolvedValue({});
      (prisma.practicalStep.findMany as any).mockResolvedValue([
        { id: 's-1-a-1' },
        { id: 's-1-a-2' },
      ]);
      (prisma.practicalStepProgress.findMany as any).mockResolvedValue([
        { stepId: 's-1-a-1', isCompleted: true },
      ]);

      const res = await request(app)
        .post('/api/practical-tasks/104301/progress')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({
          version: 'VERSION_A',
          stepId: 's-1-a-1',
          isStepCompleted: true,
          savedHtmlCode: '<main>Updated HTML</main>',
          savedCssCode: 'main { display: block; }',
          savedJsCode: 'console.log("ready");',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskId).toBe('task-1');
      expect(res.body.data.version).toBe('VERSION_A');
      expect(res.body.data.completedStepsCount).toBe(1);
      expect(res.body.data.totalStepsCount).toBe(2);
      expect(res.body.data.isCompleted).toBe(false);
    });

    it('should mark task as COMPLETED when all steps are completed', async () => {
      (prisma.practicalTask.findFirst as any).mockResolvedValue(mockTasks[0]);

      const mockProgress = {
        id: 'prog-1-a',
        userId: 'demo-student',
        taskId: 'task-1',
        version: 'VERSION_A',
        status: 'IN_PROGRESS',
        lastPracticedAt: new Date(),
      };

      (prisma.practicalProgress.findUnique as any).mockResolvedValue(mockProgress);
      (prisma.practicalProgress.update as any).mockResolvedValue({
        ...mockProgress,
        status: 'COMPLETED',
      });
      (prisma.practicalStep.findMany as any).mockResolvedValue([{ id: 's-1-a-1' }]);
      (prisma.practicalStepProgress.findMany as any).mockResolvedValue([
        { stepId: 's-1-a-1', isCompleted: true },
      ]);

      const res = await request(app)
        .post('/api/practical-tasks/1/progress')
        .set('x-skip-csrf', 'true')
        .set('x-user-id', 'demo-student')
        .send({
          version: 'VERSION_A',
          completedStepNumbers: [1],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.isCompleted).toBe(true);
    });
  });

  describe('GET /api/practical-tasks/:taskId/code', () => {
    it('should retrieve latest saved code for given version', async () => {
      (prisma.practicalTask.findFirst as any).mockResolvedValue(mockTasks[0]);
      (prisma.practicalProgress.findUnique as any).mockResolvedValue({
        savedHtmlCode: '<div>恢復上次儲存代碼</div>',
        savedCssCode: 'div { color: blue; }',
        savedJsCode: 'let a = 1;',
        lastPracticedAt: new Date('2026-11-25T11:30:00Z'),
      });

      const res = await request(app)
        .get('/api/practical-tasks/104301/code?version=VERSION_A')
        .set('x-user-id', 'demo-student');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hasSavedCode).toBe(true);
      expect(res.body.data.savedHtmlCode).toContain('恢復上次儲存代碼');
      expect(res.body.data.savedJsCode).toBe('let a = 1;');
    });
  });
});
