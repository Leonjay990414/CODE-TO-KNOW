import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

describe('CODE TO KNOW System Error Resilience Suite (CTK-QUAL-001)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Normal Rendering Lifecycle', () => {
    it('renders children tree without disruption when no exception occurs', () => {
      const html = renderToStaticMarkup(
        <ErrorBoundary level="global">
          <div data-testid="healthy-child">
            <h1>碼上學 系統正常運行</h1>
            <p>獨立思考引導環境運作中</p>
          </div>
        </ErrorBoundary>
      );

      expect(html).toContain('data-testid="healthy-child"');
      expect(html).toContain('碼上學 系統正常運行');
      expect(html).toContain('獨立思考引導環境運作中');
      expect(html).not.toContain('role="alert"');
    });
  });

  describe('2. Global Error Boundary Fallback Specifications', () => {
    it('renders full-page branded fallback with WCAG AA compliance when error is caught', () => {
      const boundary = new ErrorBoundary({
        level: 'global',
        children: <div>Safe Child</div>,
      });

      // Simulate React catching an error
      boundary.state = {
        hasError: true,
        error: new Error('Critical database connection timeout'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

      // Accessibility & ARIA semantics
      expect(html).toContain('role="alert"');
      expect(html).toContain('aria-live="assertive"');
      expect(html).toContain('id="c2k-error-title"');
      expect(html).toContain('id="c2k-error-desc"');

      // Academic Brand Identity & Status
      expect(html).toContain('學習環境遇到非預期狀況');
      expect(html).toContain('系統環境安全防護中');
      expect(html).toContain('碼上學，學無止境。｜Learn Beyond Limits.');

      // Global Recovery Action Buttons
      expect(html).toContain('重新嘗試');
      expect(html).toContain('重新整理');
      expect(html).toContain('返回首頁');

      // Sensitive Data Sanitization Guarantee: Stack trace or internal DB details must NOT leak
      expect(html).not.toContain('Critical database connection timeout');
      expect(html).not.toContain('stack trace');
      expect(html).not.toContain('node_modules');
    });
  });

  describe('3. Route-level Error Boundary Fallback Specifications', () => {
    it('renders route-level fallback with safe navigation header', () => {
      const boundary = new ErrorBoundary({
        level: 'route',
        resetKey: 'theory-practice',
        children: <div>Theory Page</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('JSON parse error in question bank'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

      // Route-level heading and reassurance
      expect(html).toContain('本頁面載入遇到非預期狀況');
      expect(html).toContain('學習狀態安全保存中');
      expect(html).toContain('本頁面因元件例外暫時中斷，您的資料不受影響');

      // Route-level Safe Navigation Header
      expect(html).toContain('碼上學');
      expect(html).toContain('CODE TO KNOW');
      expect(html).toContain('返回平台首頁');

      // Buttons
      expect(html).toContain('重新嘗試');
      expect(html).toContain('返回首頁');
      // Global reload button is omitted in route level to avoid unnecessary full-page refresh
      expect(html).not.toContain('重新整理整個網頁');
    });
  });

  describe('4. Component-level Fallback Specifications', () => {
    it('renders compact alert fallback for local isolated components', () => {
      const boundary = new ErrorBoundary({
        level: 'component',
        children: <div>Component</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('Widget render fault'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);

      expect(html).toContain('模組載入異常');
      expect(html).toContain('此學習區塊暫時無法正常顯示');
      expect(html).toContain('重新嘗試');
    });
  });

  describe('5. Error Recovery & Remount Key Mechanism (Condition 1)', () => {
    it('increments remountKey and clears error state upon handleReset()', () => {
      const onResetMock = vi.fn();
      const boundary = new ErrorBoundary({
        level: 'route',
        onReset: onResetMock,
        children: <div>Content</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('Runtime error'),
        remountKey: 3,
      };

      // Spy on setState to verify state transition
      let newState: any = null;
      boundary.setState = vi.fn((updater: any) => {
        newState = typeof updater === 'function' ? updater(boundary.state) : updater;
        boundary.state = { ...boundary.state, ...newState };
      }) as any;

      boundary.handleReset();

      expect(boundary.setState).toHaveBeenCalled();
      expect(newState.hasError).toBe(false);
      expect(newState.error).toBeNull();
      expect(newState.remountKey).toBe(4); // Incremented from 3 to 4
      expect(onResetMock).toHaveBeenCalledTimes(1);
    });

    it('automatically resets and increments remountKey when external resetKey changes (Route change)', () => {
      const boundary = new ErrorBoundary({
        level: 'route',
        resetKey: 'mock-exam',
        children: <div>Exam</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('Exam question load failure'),
        remountKey: 1,
      };

      let resetTriggered = false;
      boundary.setState = vi.fn((updater: any) => {
        resetTriggered = true;
        const newState = typeof updater === 'function' ? updater(boundary.state) : updater;
        boundary.state = { ...boundary.state, ...newState };
      }) as any;

      // Simulate prop update: user navigated from 'mock-exam' to 'home'
      boundary.componentDidUpdate({
        level: 'route',
        resetKey: 'home',
        children: <div>Exam</div>,
      });

      expect(resetTriggered).toBe(true);
      expect(boundary.state.hasError).toBe(false);
      expect(boundary.state.remountKey).toBe(2);
    });
  });

  describe('6. Error Logging and Privacy Protection', () => {
    it('componentDidCatch safely records minimal error information and triggers onError callback', () => {
      const onErrorMock = vi.fn();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const boundary = new ErrorBoundary({
        level: 'global',
        onError: onErrorMock,
        children: <div>App</div>,
      });

      const testError = new TypeError('Cannot read property of undefined');
      const testErrorInfo = { componentStack: '\n    in FaultyComponent\n    in App' };

      boundary.componentDidCatch(testError, testErrorInfo);

      expect(onErrorMock).toHaveBeenCalledWith(testError, testErrorInfo);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[CODE TO KNOW ErrorBoundary] Render exception intercepted safely:',
        'TypeError',
        'Cannot read property of undefined'
      );

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('7. Custom Fallback Extensibility', () => {
    it('supports custom ReactNode fallback', () => {
      const boundary = new ErrorBoundary({
        level: 'component',
        fallback: <div data-testid="custom-fallback">自訂專案降級畫面</div>,
        children: <div>Child</div>,
      });

      boundary.state = {
        hasError: true,
        error: new Error('Boom'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('data-testid="custom-fallback"');
      expect(html).toContain('自訂專案降級畫面');
    });

    it('supports custom function fallback with reset callback', () => {
      const boundary = new ErrorBoundary({
        level: 'component',
        fallback: (error, reset) => (
          <div data-testid="functional-fallback">
            <span>錯誤：{error?.name}</span>
            <button onClick={reset}>自訂重試</button>
          </div>
        ),
        children: <div>Child</div>,
      });

      boundary.state = {
        hasError: true,
        error: new RangeError('Index out of bounds'),
        remountKey: 0,
      };

      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('data-testid="functional-fallback"');
      expect(html).toContain('RangeError');
      expect(html).toContain('自訂重試');
    });
  });
});
