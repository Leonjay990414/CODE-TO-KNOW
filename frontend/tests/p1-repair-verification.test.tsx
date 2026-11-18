import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseHash } from '../src/context/NavigationContext';
import { Footer } from '../src/components/Footer';
import { AICoachPage } from '../src/pages/public/AICoachPage';
import { StudentPracticalHubPage } from '../src/pages/student/practical/StudentPracticalHubPage';
import { PracticalLearningPage } from '../src/pages/public/PracticalLearningPage';
import { SystemOpsDashboardPage } from '../src/pages/system-ops/SystemOpsDashboardPage';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { NavigationProvider } from '../src/context/NavigationContext';
import { getStorageKey } from '../src/utils/learningStorage';
import { expandCompatibleFrontendRoles } from '../src/components/ProtectedRoute';

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
  };
}

let mockAuthState: any = {
  user: null,
  authStatus: 'unauthenticated',
  authError: null,
  isDemoMode: false,
  authModalOpen: false,
  authModalMode: 'login',
  openAuth: vi.fn(),
  closeAuth: vi.fn(),
  loginAsDemo: vi.fn(),
  refreshUser: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
};

vi.mock('../src/context/AuthContext', async () => {
  const actual = await vi.importActual<typeof import('../src/context/AuthContext')>(
    '../src/context/AuthContext'
  );
  return {
    ...actual,
    useAuth: () => mockAuthState,
  };
});

const renderWithProviders = (ui: React.ReactElement) => {
  return renderToStaticMarkup(
    <NavigationProvider>{ui}</NavigationProvider>
  );
};

describe('CODE TO KNOW｜P1 Issue Repair & Full Verification Suite (P1-REPAIR-2026-11-18)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      authStatus: 'unauthenticated',
      authError: null,
      isDemoMode: false,
      authModalOpen: false,
      authModalMode: 'login',
      openAuth: vi.fn(),
      closeAuth: vi.fn(),
      loginAsDemo: vi.fn(),
      refreshUser: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
    };
  });

  describe('1. P1-01: Footer Links & Educational Service Status', () => {
    it('verifies that all educational services in Footer have active, valid href destinations without planning tags', () => {
      const html = renderWithProviders(<Footer />);

      // Check Educational Services Column Links
      expect(html).toContain('href="#theory"');
      expect(html).toContain('學科題庫與即時測驗');

      expect(html).toContain('href="#mock-exam"');
      expect(html).toContain('官方全真模擬考');

      expect(html).toContain('href="#practical"');
      expect(html).toContain('網頁設計術科實作 (五大題組)');

      expect(html).toContain('href="#code-editor"');
      expect(html).toContain('線上程式實戰工作區');

      expect(html).toContain('href="#games"');
      expect(html).toContain('互動教育遊戲中心');

      expect(html).toContain('href="#ai-coach"');
      expect(html).toContain('AI 鷹架教學教練 (展示版)');

      expect(html).toContain('href="#progress"');
      expect(html).toContain('個人學習歷程與弱點分析');

      expect(html).toContain('href="#teacher"');
      expect(html).toContain('教師班級教學後台');

      // Verify no broken spans claiming "(規劃中)" for these finished core features
      expect(html).not.toContain('學科題庫與模擬考（規劃中）');
      expect(html).not.toContain('程式實戰工作區（規劃中）');
      expect(html).not.toContain('教師班級數據後台（規劃中）');
      expect(html).not.toContain('教育遊戲闖關中心（規劃中）');
    });

    it('verifies legal notice links and contact mailto in Footer', () => {
      const html = renderWithProviders(<Footer />);

      expect(html).toContain('href="#privacy"');
      expect(html).toContain('隱私權政策');

      expect(html).toContain('href="#terms"');
      expect(html).toContain('服務條款');

      expect(html).toContain('href="#legal"');
      expect(html).toContain('AI 使用倫理聲明');

      expect(html).toContain('href="#feedback"');
      expect(html).toContain('意見回饋');

      expect(html).toContain('href="mailto:contact@codetoknow.edu"');
    });

    it('verifies footer responsive layout styling for mobile (max-width: 540px)', () => {
      const html = renderWithProviders(<Footer />);
      expect(html).toContain('@media (max-width: 540px)');
      expect(html).toContain('grid-template-columns: 1fr');
    });
  });

  describe('2. P1-04: AI Coach Demo Mode Transparency Notice', () => {
    it('displays prominent AI 鷹架教學展示版 label and official explanation notice', () => {
      const html = renderWithProviders(<AICoachPage />);

      // Verify Header Badge
      expect(html).toContain('AI 鷹架教學展示版');

      // Verify Mandatory Transparency Text
      expect(html).toContain('目前使用本機教學規則提供學習引導，雲端 AI 服務仍在整合中。');
      expect(html).toContain('展示版運行中');

      // Verify Stepper Status Indicator contains demo/rule-based indicator
      expect(html).toContain('示範題組展示版 (本機引導)');

      // Ensure no misleading "AI LIVE" or false cloud claims
      expect(html).not.toContain('AI LIVE');
    });

    it('verifies responsive design rules for AI Coach on mobile screens', () => {
      const html = renderWithProviders(<AICoachPage />);
      expect(html).toContain('class="coach-grid"');

      // Verify CSS has the 1-column mobile collapse rule for coach-grid
      const cssPath = path.resolve(__dirname, '../src/styles/components.css');
      const css = fs.readFileSync(cssPath, 'utf-8');
      expect(css).toContain('.coach-grid');
      expect(css).toContain('grid-template-columns: 1fr !important');
    });
  });

  describe('3. P1-03: Student Practical Hub Route & 6 Security Scenarios (Section 5.4)', () => {
    // Scenario 1: 未登入使用者存取受保護術科專區
    it('Scenario 1: intercepts unauthenticated users with ProtectedRoute login barrier', () => {
      mockAuthState.authStatus = 'unauthenticated';
      mockAuthState.user = null;

      const html = renderWithProviders(
        <ProtectedRoute pageTitle="學生五大術科實作工作區">
          <StudentPracticalHubPage />
        </ProtectedRoute>
      );

      // Must display authentication barrier rather than exposing inner student content
      expect(html).toContain('學生五大術科實作工作區');
      expect(html).toContain('會員功能 · 需先登入');
      expect(html).not.toContain('五大術科標準教學與多頁面編輯沙箱');
    });

    // Scenario 2: 已登入學生存取
    it('Scenario 2: allows authenticated STUDENT access to practical hub', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = {
        id: 'stu-101',
        email: 'student@example.com',
        displayName: '林小明',
        role: 'STUDENT',
        roles: ['STUDENT'],
        status: 'ACTIVE',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const html = renderWithProviders(
        <ProtectedRoute pageTitle="學生五大術科實作工作區">
          <StudentPracticalHubPage />
        </ProtectedRoute>
      );

      expect(html).toContain('學生專屬實作環境');
      expect(html).toContain('已登入學生：林小明');
      expect(html).toContain('五大術科標準教學與多頁面編輯沙箱');
    });

    // Scenario 3: 已登入教師存取
    it('Scenario 3: allows authenticated TEACHER access to practical hub for curriculum review', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = {
        id: 'tch-201',
        email: 'teacher@school.edu.tw',
        displayName: '張老師',
        role: 'TEACHER',
        roles: ['TEACHER'],
        status: 'ACTIVE',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const html = renderWithProviders(
        <ProtectedRoute pageTitle="學生五大術科實作工作區">
          <StudentPracticalHubPage />
        </ProtectedRoute>
      );

      expect(html).toContain('學生專屬實作環境');
      expect(html).toContain('已登入學生：張老師');
      expect(html).toContain('五大術科標準教學與多頁面編輯沙箱');
    });

    // Scenario 4: 已登入管理員存取
    it('Scenario 4: allows authenticated ADMIN access to practical hub', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = {
        id: 'adm-001',
        email: 'admin@codetoknow.edu',
        displayName: '全域管理員',
        role: 'ADMIN',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const html = renderWithProviders(
        <ProtectedRoute pageTitle="學生五大術科實作工作區">
          <StudentPracticalHubPage />
        </ProtectedRoute>
      );

      expect(html).toContain('學生專屬實作環境');
      expect(html).toContain('已登入學生：全域管理員');
      expect(html).toContain('五大術科標準教學與多頁面編輯沙箱');
    });

    // Scenario 5: 直接輸入新版術科網址（包含深層參數）
    it('Scenario 5: parses direct URLs with subviews, tasks and step numbers', () => {
      const stateHome = parseHash('#student/practical');
      expect(stateHome.page).toBe('student-practical');
      expect(stateHome.practicalView).toBe('home');

      const stateDetail = parseHash('#student/practical/detail?task=2');
      expect(stateDetail.page).toBe('student-practical');
      expect(stateDetail.practicalView).toBe('detail');
      expect(stateDetail.taskId).toBe(2);

      const stateLesson = parseHash('#student/practical/lesson?task=3&step=2');
      expect(stateLesson.page).toBe('student-practical');
      expect(stateLesson.practicalView).toBe('lesson');
      expect(stateLesson.taskId).toBe(3);
      expect(stateLesson.taskStep).toBe(2);

      const stateSandbox = parseHash('#student/practical/sandbox?task=4');
      expect(stateSandbox.page).toBe('student-practical');
      expect(stateSandbox.practicalView).toBe('sandbox');
      expect(stateSandbox.taskId).toBe(4);
    });

    // Scenario 6: 從舊版頁面返回或切換頁面
    it('Scenario 6: maintains 100% backward compatibility for public #practical and seamless cross-navigation', () => {
      const state = parseHash('#practical');
      expect(state.page).toBe('practical-learning');
      expect(state.certId).toBe('web-design-c');

      // Check public page renders the entry button to the protected student hub
      const html = renderWithProviders(<PracticalLearningPage />);
      expect(html).toContain('進入學生專屬實作環境');
      expect(html).toContain('線上程式編輯器');
    });

    it('maintains strict isolation between practical progress keys across users and versions', () => {
      const key1 = getStorageKey('student-01', 1, 'A');
      const key2 = getStorageKey('student-01', 1, 'B');
      const key3 = getStorageKey('student-02', 1, 'A');

      expect(key1).toBe('ctk_practical_progress:student-01:1:A');
      expect(key2).toBe('ctk_practical_progress:student-01:1:B');
      expect(key3).toBe('ctk_practical_progress:student-02:1:A');
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
    });
  });

  describe('4. P1-02: L4 Platform Admin & L5 System Ops Separation', () => {
    it('parses #ops and #system-ops correctly to system-ops page', () => {
      const state1 = parseHash('#ops');
      expect(state1.page).toBe('system-ops');

      const state2 = parseHash('#system-ops');
      expect(state2.page).toBe('system-ops');
    });

    it('retains #admin parsing for L4 platform admin console', () => {
      const state = parseHash('#admin');
      expect(state.page).toBe('admin-dashboard');
    });

    it('verifies that SystemOpsDashboardPage renders dedicated L5 telemetry headers', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = {
        id: 'adm-001',
        email: 'admin@codetoknow.edu',
        displayName: '系統管理員',
        role: 'ADMIN',
        roles: ['ADMIN'],
        status: 'ACTIVE',
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
      };

      const html = renderWithProviders(
        <ProtectedRoute requiredRoles={['ADMIN']} pageTitle="系統營運與維運後台">
          <SystemOpsDashboardPage />
        </ProtectedRoute>
      );

      expect(html).toContain('系統營運與維運主控台 (System Ops Console)');
      expect(html).toContain('維運最高隔離區 (Level 5)');
      expect(html).toContain('受 ADMIN / OPS 權限保護');
      expect(html).toContain('系統健康探針與平緩降級 (P16-ADM-006)');
      expect(html).toContain('不可竄改安全日誌 (P16-ADM-005)');
    });

    it('enforces ADMIN role requirement for administrative console access', () => {
      const adminRoles = expandCompatibleFrontendRoles(['ADMIN']);
      expect(adminRoles).toContain('ADMIN');
      expect(adminRoles).toContain('PLATFORM_ADMIN');
      expect(adminRoles).not.toContain('STUDENT');
      expect(adminRoles).not.toContain('TEACHER');
    });
  });

});
