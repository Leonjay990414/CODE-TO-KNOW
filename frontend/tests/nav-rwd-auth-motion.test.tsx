import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../src/components/Navbar';
import { LearningExperience } from '../src/components/LearningExperience';
import { StudentTeacherDual } from '../src/components/StudentTeacherDual';
import { AuthLoadingView } from '../src/components/AuthLoadingView';
import { AuthModal } from '../src/components/AuthModal';
import { AuthProvider } from '../src/context/AuthContext';
import { NavigationProvider } from '../src/context/NavigationContext';

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
    getComputedStyle: () => ({ overflow: 'auto' }),
    document: { body: { style: {} } },
  };
}

describe('CODE TO KNOW｜RWD 導覽列、版面對齊、登入註冊與動態互動全面驗收 (CTK-VERIFY-20261117)', () => {
  // 1. Navbar & Morphing Hamburger
  it('renders desktop navbar with single-line lockup and morphing hamburger button', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <NavigationProvider>
          <Navbar />
        </NavigationProvider>
      </AuthProvider>
    );

    // Desktop nav container & links
    expect(html).toContain('desktop-only-nav');
    expect(html).toContain('brand-logo-lockup');
    expect(html).toContain('碼上學');
    expect(html).toContain('CODE TO KNOW');

    // All 9 nav items present
    expect(html).toContain('首頁');
    expect(html).toContain('證照中心');
    expect(html).toContain('學科題庫');
    expect(html).toContain('術科實作');
    expect(html).toContain('全真模考');
    expect(html).toContain('程式沙盒');
    expect(html).toContain('AI 教練');
    expect(html).toContain('遊戲中心');
    expect(html).toContain('學習進度');

    // Animated 3-line hamburger toggle button & bars
    expect(html).toContain('hamburger-toggle-btn');
    expect(html).toContain('hamburger-lines-box');
    expect(html).toContain('hamburger-bar-top');
    expect(html).toContain('hamburger-bar-mid');
    expect(html).toContain('hamburger-bar-bot');
  });

  // 2. Left-Right Height Alignment (Stage 4)
  it('aligns LearningExperience 4-card column and right showcase card with stretch grid layout', () => {
    const html = renderToStaticMarkup(<LearningExperience />);

    // Grid container uses alignItems: stretch
    expect(html).toContain('align-items:stretch');
    expect(html).toContain('experience-grid');

    // Right-hand preview card uses 100% height
    expect(html).toContain('experience-showcase-card');
    expect(html).toContain('height:100%');
  });

  it('aligns StudentTeacherDual dual-grid layout with stretch alignment and full-height mockup', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <StudentTeacherDual onOpenTeacherApply={vi.fn()} />
      </AuthProvider>
    );

    // Dual grid uses alignItems: stretch
    expect(html).toContain('align-items:stretch');
    expect(html).toContain('dual-grid');
    expect(html).toContain('height:100%');
  });

  // 3. AuthLoadingView (Stage 6)
  it('renders AuthLoadingView with branded logo, dual-color orbital spinner and status text', () => {
    const html = renderToStaticMarkup(<AuthLoadingView mode="login" onCancel={vi.fn()} />);

    // Accessibility attributes
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('auth-loading-container');

    // Brand elements
    expect(html).toContain('auth-loading-logo-box');
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain('碼上學 Logo');

    // Brand colors in spinner and flowing shimmer bar
    expect(html).toContain('#5A7D6C'); // Sage Green
    expect(html).toContain('#BDA77E'); // Champagne Gold
    expect(html).toContain('#26343D'); // Charcoal
    expect(html).toContain('auth-shimmer-bar');
    expect(html).toContain('auth-spinner-head');

    // Cancel button available
    expect(html).toContain('取消操作');
  });

  it('provides mode-specific status descriptions for registration, reset, and login', () => {
    const registerHtml = renderToStaticMarkup(<AuthLoadingView mode="register" />);
    expect(registerHtml).toContain('正在準備註冊學習帳號');

    const resetHtml = renderToStaticMarkup(<AuthLoadingView mode="reset-password" />);
    expect(resetHtml).toContain('正在確認重設代碼有效性');

    const loginHtml = renderToStaticMarkup(<AuthLoadingView mode="login" />);
    expect(loginHtml).toContain('正在準備登入');
  });

  it('AuthModal displays form correctly and supports accessible modal dialog', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={true} mode="login" onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-labelledby="auth-modal-title"');
    expect(html).toContain('會員登入');
    expect(html).toContain('電子郵件');
    expect(html).toContain('密碼');
  });
});
