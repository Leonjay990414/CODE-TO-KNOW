import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { AuthModal } from '../src/components/AuthModal';
import { AuthProvider } from '../src/context/AuthContext';

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
    document: { body: { style: {} } },
  };
}

describe('AuthModal Diagnostic & Validation Suite (P08-SEC / P10-EML)', () => {
  it('renders null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={false} mode="login" onClose={vi.fn()} />
      </AuthProvider>
    );
    expect(html).toBe('');
  });

  it('renders accessible dialog container with role="dialog" and aria-labelledby when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={true} mode="login" onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="auth-modal-title"');
    expect(html).toContain('會員登入');
  });

  it('renders register mode form elements and role selectors', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={true} mode="register" onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(html).toContain('註冊加入碼上學');
    expect(html).toContain('您的姓名或暱稱');
    expect(html).toContain('電子郵件');
    expect(html).toContain('密碼');
    expect(html).toContain('我是學習者');
    expect(html).toContain('我是教育者');
    expect(html).toContain('確認建立帳號');
  });

  it('renders forgot password mode form elements', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={true} mode="forgot-password" onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(html).toContain('密碼求助');
    expect(html).toContain('發送重設密碼說明');
    expect(html).toContain('返回登入');
  });

  it('renders reset password mode form elements with token and confirmation fields', () => {
    const html = renderToStaticMarkup(
      <AuthProvider>
        <AuthModal isOpen={true} mode="reset-password" onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(html).toContain('安全重設');
    expect(html).toContain('重設代碼');
    expect(html).toContain('新密碼');
    expect(html).toContain('再次確認新密碼');
    expect(html).toContain('確認更新密碼');
  });
});
