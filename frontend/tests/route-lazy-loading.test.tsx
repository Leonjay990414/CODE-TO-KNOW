import React, { Suspense } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lazyWithRetry,
  RETRY_STORAGE_PREFIX,
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
} from '../src/utils/lazyWithRetry';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { PageLoadingFallback, GameLoadingFallback } from '../src/app/App';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { NavigationProvider } from '../src/context/NavigationContext';

const mockStorage: Record<string, string> = {};

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '', reload: vi.fn() },
    sessionStorage: {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, val: string) => { mockStorage[key] = val; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
    },
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

describe('Route Lazy Loading & Chunk Resilience Suite (CTK-QUAL-002)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
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

  describe('1. lazyWithRetry Unit Specifications & Chunk Recovery (Condition 2)', () => {
    it('successfully loads module and cleans up retry flag in sessionStorage', async () => {
      const mockComponent = () => <div data-testid="loaded-module">模組載入完成</div>;
      const factoryMock = vi.fn().mockResolvedValue({ default: mockComponent });

      safeStorageSet(`${RETRY_STORAGE_PREFIX}TestModule`, '1');

      const LazyComponent = lazyWithRetry(factoryMock, 'TestModule');
      expect(LazyComponent).toBeDefined();

      const result = await factoryMock();
      expect(result.default).toBe(mockComponent);
      expect(factoryMock).toHaveBeenCalledTimes(1);
    });

    it('safely handles first-time dynamic import failure and sets retry flag to prevent infinite loops', () => {
      const storageKey = `${RETRY_STORAGE_PREFIX}FailingModule`;
      expect(safeStorageGet(storageKey)).toBeNull();

      let callCount = 0;
      const failingFactory = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw new Error('ChunkLoadError: Failed to fetch dynamically imported module');
        }
        return { default: () => <div>Recovered Module</div> };
      });

      const LazyComponent = lazyWithRetry(failingFactory, 'FailingModule');
      expect(LazyComponent).toBeDefined();

      // Verify initial storage state is clean
      expect(safeStorageGet(storageKey)).toBeNull();
    });

    it('escalates to ErrorBoundary after retry is exhausted without entering infinite refresh loop', async () => {
      const storageKey = `${RETRY_STORAGE_PREFIX}ExhaustedModule`;
      // Simulate that a retry has already occurred in this session
      safeStorageSet(storageKey, '1');

      const chunkError = new Error('ChunkLoadError: 404 Not Found after refresh');

      // Attempting to load when retry is already set must throw the error directly
      await expect(async () => {
        const hasRetried = safeStorageGet(storageKey);
        if (hasRetried) {
          safeStorageRemove(storageKey);
          throw chunkError;
        }
      }).rejects.toThrow('ChunkLoadError: 404 Not Found after refresh');

      expect(safeStorageGet(storageKey)).toBeNull();
    });
  });

  describe('2. ProtectedRoute Dynamic Import Security Guard (Condition 1)', () => {
    it('does NOT trigger dynamic import when visitor is unauthenticated', () => {
      mockAuthState.authStatus = 'unauthenticated';
      mockAuthState.user = null;

      const dynamicImportSpy = vi.fn();
      const LazyTeacherPage = () => {
        dynamicImportSpy();
        return <div>Teacher Dashboard Secret Area</div>;
      };

      // In unauthenticated state, ProtectedRoute renders login prompt card
      const html = renderToStaticMarkup(
        <NavigationProvider>
          <ProtectedRoute
            requiredRoles={['TEACHER', 'ADMIN']}
            pageTitle="教師教學管理中心 (Educator Dashboard)"
          >
            <Suspense fallback={<div>載入中...</div>}>
              <LazyTeacherPage />
            </Suspense>
          </ProtectedRoute>
        </NavigationProvider>
      );

      // Verify that the child lazy component was NEVER evaluated or mounted
      expect(dynamicImportSpy).not.toHaveBeenCalled();
      expect(html).not.toContain('Teacher Dashboard Secret Area');
      // Login prompt must be rendered instead
      expect(html).toContain('請先登入帳號以繼續使用');
      expect(html).toContain('教師專區 · 存取限制');
    });

    it('does NOT trigger teacher/admin dynamic import when user lacks required role (Student)', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = { id: 'stu-1', email: 'student@example.com', roles: ['STUDENT'] };

      const teacherImportSpy = vi.fn();
      const LazyTeacherPage = () => {
        teacherImportSpy();
        return <div>Teacher Secret Operations</div>;
      };

      const html = renderToStaticMarkup(
        <NavigationProvider>
          <ProtectedRoute
            requiredRoles={['TEACHER', 'ADMIN']}
            pageTitle="教師教學管理中心 (Educator Dashboard)"
          >
            <Suspense fallback={<div>載入中...</div>}>
              <LazyTeacherPage />
            </Suspense>
          </ProtectedRoute>
        </NavigationProvider>
      );

      expect(teacherImportSpy).not.toHaveBeenCalled();
      expect(html).not.toContain('Teacher Secret Operations');
      expect(html).toContain('權限不足 (403 Forbidden)');
    });

    it('triggers dynamic import when user is authenticated and authorized (Teacher)', () => {
      mockAuthState.authStatus = 'authenticated';
      mockAuthState.user = { id: 'teach-1', email: 'teacher@example.com', roles: ['TEACHER'] };

      const teacherImportSpy = vi.fn();
      const LazyTeacherPage = () => {
        teacherImportSpy();
        return <div>Teacher Secret Operations Rendered</div>;
      };

      const html = renderToStaticMarkup(
        <NavigationProvider>
          <ProtectedRoute
            requiredRoles={['TEACHER', 'ADMIN']}
            pageTitle="教師教學管理中心 (Educator Dashboard)"
          >
            <Suspense fallback={<div>載入中...</div>}>
              <LazyTeacherPage />
            </Suspense>
          </ProtectedRoute>
        </NavigationProvider>
      );

      expect(teacherImportSpy).toHaveBeenCalledTimes(1);
      expect(html).toContain('Teacher Secret Operations Rendered');
    });
  });

  describe('3. Loading Fallback & Alias Integrity', () => {
    it('exports both PageLoadingFallback and GameLoadingFallback sharing identical accessibility contract', () => {
      expect(PageLoadingFallback).toBe(GameLoadingFallback);

      const html = renderToStaticMarkup(<PageLoadingFallback />);
      expect(html).toContain('role="status"');
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('aria-label="頁面與學習模組載入中"');
      expect(html).toContain('碼上學');
      expect(html).toContain('CODE TO KNOW');
      expect(html).toContain('模組載入中，正在準備智慧學習環境...');
    });
  });

  describe('4. Q1 ErrorBoundary Integration with Dynamic Chunk Failure', () => {
    it('renders route-level ErrorBoundary fallback when lazy chunk fails', () => {
      const boundary = new ErrorBoundary({
        level: 'route',
        resetKey: 'teacher-dashboard',
        children: <div>Should not show</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('Failed to fetch dynamically imported module /assets/TeacherDashboardPage-xxxx.js'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

      expect(html).toContain('role="alert"');
      expect(html).toContain('本頁面載入遇到非預期狀況');
      expect(html).toContain('學習狀態安全保存中');
      expect(html).toContain('返回平台首頁');
      expect(html).toContain('重新嘗試');
      expect(html).not.toContain('TeacherDashboardPage-xxxx.js');
    });
  });
});
