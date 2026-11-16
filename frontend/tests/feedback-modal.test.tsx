import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackModal } from '../src/components/FeedbackModal';
import { Footer } from '../src/components/Footer';
import { NavigationProvider } from '../src/context/NavigationContext';

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
  };
}

describe('P20 Operations: FeedbackModal UI Component Suite (P20-OPS-005)', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <FeedbackModal isOpen={false} onClose={vi.fn()} />
    );
    expect(html).toBe('');
  });

  it('renders accessible dialog container with title and form elements when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <FeedbackModal isOpen={true} onClose={vi.fn()} userId="student-001" userRole="STUDENT" />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-label="使用者回饋與問題回報"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('使用者回饋與意見反應');
    expect(html).toContain('回饋類型');
    expect(html).toContain('整體滿意度評分');
    expect(html).toContain('主旨摘要');
    expect(html).toContain('詳細說明');
    expect(html).toContain('送出回饋');
  });

  it('includes all 4 category options in rendered modal', () => {
    const html = renderToStaticMarkup(
      <FeedbackModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('一般意見');
    expect(html).toContain('測驗題庫');
    expect(html).toContain('功能建議');
    expect(html).toContain('問題回報');
  });

  it('renders Feedback entry link in Footer legal links section', () => {
    const html = renderToStaticMarkup(
      <NavigationProvider>
        <Footer />
      </NavigationProvider>
    );

    expect(html).toContain('意見回饋');
    expect(html).toContain('href="#feedback"');
    expect(html).toContain('footer-legal-link');
  });
});
