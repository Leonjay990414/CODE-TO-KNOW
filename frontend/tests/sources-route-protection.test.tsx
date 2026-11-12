import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseHash } from '../src/context/NavigationContext';
import { expandCompatibleFrontendRoles } from '../src/components/ProtectedRoute';

const mockAuthState: any = {
  user: null,
  isLoading: false,
  authStatus: 'unauthenticated',
  authError: null,
  authModalOpen: false,
  authModalMode: 'login',
  isDemoMode: false,
  openAuth: vi.fn(),
  closeAuth: vi.fn(),
  login: vi.fn(),
  loginAsDemo: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refreshUser: vi.fn(),
  setUser: vi.fn(),
};

const mockNavState: any = {
  route: { page: 'import-system', hash: '#sources' },
  navigate: vi.fn(),
  goToHome: vi.fn(),
  goToCertifications: vi.fn(),
  goToCertificationDetail: vi.fn(),
  goToWebDesignDemo: vi.fn(),
  goToTheoryPractice: vi.fn(),
  goToMockExam: vi.fn(),
  goToPracticalLearning: vi.fn(),
  goToCodeEditor: vi.fn(),
  goToAICoach: vi.fn(),
  goToLearningProgress: vi.fn(),
  goToStudentDashboard: vi.fn(),
  goToTeacherDashboard: vi.fn(),
  goToImportSystem: vi.fn(),
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

vi.mock('../src/context/NavigationContext', async () => {
  const actual = await vi.importActual<typeof import('../src/context/NavigationContext')>(
    '../src/context/NavigationContext'
  );
  return {
    ...actual,
    useNavigation: () => mockNavState,
  };
});

import { AppContent } from '../src/app/App';

describe('Frontend #sources / import-system Route Protection', () => {
  beforeEach(() => {
    mockNavState.route = parseHash('#sources');
    mockAuthState.user = null;
    mockAuthState.authStatus = 'unauthenticated';
    mockAuthState.authError = null;
    mockAuthState.isDemoMode = false;
  });

  it('parses #sources, #import-system, and #question-bank to import-system page', () => {
    expect(parseHash('#sources').page).toBe('import-system');
    expect(parseHash('#import-system').page).toBe('import-system');
    expect(parseHash('#question-bank').page).toBe('import-system');
  });

  it('expands ADMIN/PLATFORM_ADMIN compatibility while excluding SYSTEM_OPERATOR', () => {
    expect(expandCompatibleFrontendRoles(['ADMIN'])).toEqual(['ADMIN', 'PLATFORM_ADMIN']);
    expect(expandCompatibleFrontendRoles(['ADMIN'])).not.toContain('SYSTEM_OPERATOR');
  });

  it('blocks unauthenticated users from rendering QuestionBankImportSystemPage', () => {
    mockAuthState.authStatus = 'unauthenticated';
    mockAuthState.user = null;

    const html = renderToStaticMarkup(<AppContent />);
    expect(html).toContain('管理員專區');
    expect(html).toContain('請先登入帳號以繼續使用');
    expect(html).not.toContain('官方題庫管理引擎');
  });

  it('returns 403 Access Denied view for authenticated STUDENT on #sources', () => {
    mockAuthState.authStatus = 'authenticated';
    mockAuthState.user = {
      id: 'student-1',
      email: 'student@codetoknow.edu',
      displayName: '測試學員',
      roles: ['STUDENT'],
    };

    const html = renderToStaticMarkup(<AppContent />);
    expect(html).toContain('403 Forbidden');
    expect(html).toContain('權限受限 · 403 Access Denied');
    expect(html).toContain('平台管理員');
    expect(html).not.toContain('官方題庫管理引擎');
  });

  it('returns 403 Access Denied view for authenticated TEACHER on #sources', () => {
    mockAuthState.authStatus = 'authenticated';
    mockAuthState.user = {
      id: 'teacher-1',
      email: 'teacher@codetoknow.edu',
      displayName: '測試教師',
      roles: ['TEACHER', 'STUDENT'],
    };

    const html = renderToStaticMarkup(<AppContent />);
    expect(html).toContain('權限受限 · 403 Access Denied');
    expect(html).not.toContain('官方題庫管理引擎');
  });

  it('returns 403 Access Denied view for SYSTEM_OPERATOR on #sources', () => {
    mockAuthState.authStatus = 'authenticated';
    mockAuthState.user = {
      id: 'ops-1',
      email: 'ops@codetoknow.edu',
      displayName: '維運人員',
      roles: ['SYSTEM_OPERATOR'],
    };

    const html = renderToStaticMarkup(<AppContent />);
    expect(html).toContain('權限受限 · 403 Access Denied');
    expect(html).not.toContain('官方題庫管理引擎');
  });

  it('allows authenticated ADMIN and PLATFORM_ADMIN to access QuestionBankImportSystemPage', () => {
    for (const roles of [['ADMIN'], ['PLATFORM_ADMIN']]) {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = {
        id: 'admin-1',
        email: 'admin@codetoknow.edu',
        displayName: '系統管理員',
        roles,
      };

      const html = renderToStaticMarkup(<AppContent />);
      expect(html).toContain('官方題庫管理引擎');
      expect(html).toContain('官方證照題庫匯入與解析管理系統');
      expect(html).not.toContain('權限受限 · 403 Access Denied');
    }
  });
});
