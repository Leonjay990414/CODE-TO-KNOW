import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getPracticalProgress, savePracticalProgress, PracticalTaskProgress } from '../src/utils/learningStorage';
import { FeedbackModal } from '../src/components/FeedbackModal';
import { NotificationCenterModal } from '../src/components/NotificationCenterModal';
import { StudentClassJoinModal } from '../src/components/StudentClassJoinModal';
import { TeacherApplyModal } from '../src/components/TeacherApplyModal';
import { GameAchievementsModal } from '../src/components/GameAchievementsModal';
import { GameBriefingModal } from '../src/components/GameBriefingModal';

// Mock AuthContext
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-01', email: 'test@school.edu', displayName: '測試學員', roles: ['STUDENT'] },
    token: 'fake-token',
    isAuthenticated: true,
    loginAsDemo: vi.fn(),
    logout: vi.fn(),
    openAuth: vi.fn(),
    closeAuth: vi.fn(),
    authModalOpen: false,
    authModalMode: 'login',
  }),
}));

// Mock NavigationContext
vi.mock('../src/context/NavigationContext', () => ({
  useNavigation: () => ({
    route: { page: 'home' },
    currentPage: 'home',
    goToHome: vi.fn(),
    goToTheoryPractice: vi.fn(),
    goToAdminDashboard: vi.fn(),
    goToStudentPractical: vi.fn(),
    goToSystemOps: vi.fn(),
  }),
}));

// Helper for WCAG Relative Luminance and Contrast Calculation
function relativeLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const f = (val: number) => (val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function calculateContrast(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

describe('CODE TO KNOW｜P2 全站視覺與操作體驗驗證套件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('P2-01: 色彩對比度與金色 Token 規範', () => {
    it('高對比金色 Token (#7C663D) 在純白 (#FFFFFF) 底色對比度應大於 4.5:1 (符合 WCAG AA)', () => {
      const cr = calculateContrast('#7C663D', '#FFFFFF');
      expect(cr).toBeGreaterThanOrEqual(4.5);
      expect(Number(cr.toFixed(2))).toBe(5.49);
    });

    it('高對比金色 Token (#7C663D) 在暖象牙白 (#F5F2EA) 底色對比度應大於 4.5:1 (符合 WCAG AA)', () => {
      const cr = calculateContrast('#7C663D', '#F5F2EA');
      expect(cr).toBeGreaterThanOrEqual(4.5);
      expect(Number(cr.toFixed(2))).toBe(4.91);
    });

    it('深香檳金 (#8D7243) 在純白底色對比度應大於 4.5:1', () => {
      const cr = calculateContrast('#8D7243', '#FFFFFF');
      expect(cr).toBeGreaterThanOrEqual(4.5);
      expect(Number(cr.toFixed(2))).toBe(4.54);
    });

    it('原始香檳金 (#BDA77E) 在深石墨灰 (#26343D) 底色對比度應大於 4.5:1 (深色模式保護)', () => {
      const cr = calculateContrast('#BDA77E', '#26343D');
      expect(cr).toBeGreaterThanOrEqual(4.5);
      expect(Number(cr.toFixed(2))).toBe(5.48);
    });

    it('原始香檳金 (#BDA77E) 在暗色編輯器 (#1E293B) 底色對比度應大於 4.5:1', () => {
      const cr = calculateContrast('#BDA77E', '#1E293B');
      expect(cr).toBeGreaterThanOrEqual(4.5);
      expect(Number(cr.toFixed(2))).toBe(6.26);
    });
  });

  describe('P2-02: 互動觸控尺寸 (>= 44x44 CSS px) 驗證', () => {
    it('FeedbackModal 關閉按鈕與滿意度星號觸控區域應滿足 44x44px', () => {
      const html = renderToStaticMarkup(<FeedbackModal isOpen={true} onClose={vi.fn()} />);
      expect(html).toContain('min-width:44px');
      expect(html).toContain('min-height:44px');
      expect(html).toContain('關閉回饋彈窗');
    });

    it('NotificationCenterModal 關閉按鈕與分頁標籤觸控尺寸應滿足 44x44px', () => {
      const html = renderToStaticMarkup(<NotificationCenterModal isOpen={true} onClose={vi.fn()} />);
      expect(html).toContain('關閉通知中心');
      expect(html).toContain('min-width:44px');
      expect(html).toContain('min-height:44px');
    });

    it('StudentClassJoinModal 關閉按鈕觸控區域應滿足 44x44px', () => {
      const html = renderToStaticMarkup(<StudentClassJoinModal isOpen={true} onClose={vi.fn()} onJoined={vi.fn()} />);
      expect(html).toContain('min-width:44px');
      expect(html).toContain('min-height:44px');
    });

    it('TeacherApplyModal 關閉按鈕尺寸應滿足 44x44px', () => {
      const html = renderToStaticMarkup(<TeacherApplyModal isOpen={true} onClose={vi.fn()} />);
      expect(html).toContain('width:44px');
      expect(html).toContain('height:44px');
    });

    it('GameAchievementsModal 與 GameBriefingModal 關閉按鈕應滿足 44x44px', () => {
      const htmlAchievements = renderToStaticMarkup(<GameAchievementsModal isOpen={true} onClose={vi.fn()} />);
      expect(htmlAchievements).toContain('min-width:44px');
      expect(htmlAchievements).toContain('min-height:44px');

      const mockConfig = {
        gameId: 'code-puzzle',
        gameTitle: '語法積木挑戰',
        gameSubtitle: '重組語法結構',
        objective: '將積木依序拖曳至目標區',
        rules: ['拖曳積木', '點擊執行'],
        starRules: ['答對 90%', '答對 70%', '答對 50%'],
        scoring: '依完成時間計分',
        targetCertification: '網頁設計丙級',
        estimatedMinutes: 5,
        totalLevels: 5,
      };
      const htmlBriefing = renderToStaticMarkup(
        <GameBriefingModal isOpen={true} onClose={vi.fn()} onStart={vi.fn()} config={mockConfig} />
      );
      expect(htmlBriefing).toContain('min-width:44px');
      expect(htmlBriefing).toContain('min-height:44px');
    });
  });

  describe('P2-03: 首頁統計真實性與展示版標示驗證', () => {
    it('首頁不得含有偽造之全站線上統計 (如 98.4% 通過率、1,280+ 學員)', async () => {
      const { HomePage } = await import('../src/pages/public/HomePage');
      const html = renderToStaticMarkup(<HomePage />);
      expect(html).not.toContain('98.4%');
      expect(html).not.toContain('1,280+');
      expect(html).not.toContain('1280+');
    });

    it('模擬預覽數據需清楚標註示範／展示指標', async () => {
      const { LearningExperience } = await import('../src/components/LearningExperience');
      const html = renderToStaticMarkup(<LearningExperience />);
      expect(html).toContain('展示評估模型');
      expect(html).toContain('展示說明');
    });

    it('師生雙端概覽模擬需清楚標註展示模型', async () => {
      const { StudentTeacherDual } = await import('../src/components/StudentTeacherDual');
      const html = renderToStaticMarkup(<StudentTeacherDual />);
      expect(html).toContain('學生端工作區介面預覽');
    });
  });

  describe('補充檢查 B: 術科進度 Key 舊資料相容性', () => {
    it('當新前綴無資料時，應能平緩安全讀取舊版 practical_progress 資料', () => {
      const mockStorage: Record<string, string> = {};
      const legacyKey = 'practical_progress:student-99:1:A';
      const legacyData: PracticalTaskProgress = {
        schemaVersion: 1,
        userId: 'student-99',
        taskId: 1,
        version: 'A',
        completedSteps: [1, 2, 3],
        completedChecklist: ['check-1', 'check-2'],
        lastStudiedAt: '2026-11-10T08:00:00.000Z',
      };
      mockStorage[legacyKey] = JSON.stringify(legacyData);

      // Mock localStorage on globalThis.window
      const fakeLocalStorage = {
        getItem: (k: string) => mockStorage[k] || null,
        setItem: (k: string, v: string) => { mockStorage[k] = v; },
        removeItem: (k: string) => { delete mockStorage[k]; },
        clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
        length: Object.keys(mockStorage).length,
        key: (idx: number) => Object.keys(mockStorage)[idx] || null,
      };

      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = { localStorage: fakeLocalStorage };

      try {
        // Read via getPracticalProgress
        const progress = getPracticalProgress('student-99', 1, 'A');
        expect(progress.completedSteps).toEqual([1, 2, 3]);
        expect(progress.completedChecklist).toEqual(['check-1', 'check-2']);

        // Save new progress
        const updated: PracticalTaskProgress = {
          ...progress,
          completedSteps: [1, 2, 3, 4],
        };
        savePracticalProgress(updated);

        // Verify written to new prefix
        const newKey = 'ctk_practical_progress:student-99:1:A';
        expect(mockStorage[newKey]).toBeDefined();
        expect(JSON.parse(mockStorage[newKey]).completedSteps).toEqual([1, 2, 3, 4]);

        // Verify legacy key was NEVER deleted or emptied
        expect(mockStorage[legacyKey]).toBeDefined();
      } finally {
        (globalThis as any).window = originalWindow;
      }
    });
  });
});
