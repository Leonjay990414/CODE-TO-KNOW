import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { GameLoadingFallback } from '../src/app/App';

describe('CODE TO KNOW Dynamic Loading Experience Suite', () => {
  it('renders accessible loading container with role="status" and polite aria-live', () => {
    const html = renderToStaticMarkup(<GameLoadingFallback />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="頁面與學習模組載入中"');
    expect(html).toContain('c2k-loading-screen');
  });

  it('renders full brand identity: Logo, Chinese/English Brand, and Tagline', () => {
    const html = renderToStaticMarkup(<GameLoadingFallback />);

    // Brand Name
    expect(html).toContain('碼上學');
    expect(html).toContain('CODE TO KNOW');

    // Brand Logo SVG
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).toContain('aria-label="碼上學 Logo"');

    // Brand Tagline
    expect(html).toContain('碼上學，學無止境。｜Learn Beyond Limits.');

    // Status message
    expect(html).toContain('模組載入中，正在準備智慧學習環境...');
  });

  it('includes brand color palette elements and dynamic indicators', () => {
    const html = renderToStaticMarkup(<GameLoadingFallback />);

    // Dual-ring spinner and center dot
    expect(html).toContain('c2k-spinner-head');
    expect(html).toContain('c2k-spinner-center');
    expect(html).toContain('c2k-shimmer-bar');

    // Brand colors in inline styles / SVG paths
    expect(html).toContain('#BDA77E'); // Champagne Gold
    expect(html).toContain('#8FA9B8'); // Muted Blue Gray
    expect(html).toContain('#526B7B'); // Deep Slate
    expect(html).toContain('#26343D'); // Charcoal
    expect(html).toContain('#5A7D6C'); // Sage Green
    expect(html).toContain('#EBE5D8'); // Oat
    expect(html).toContain('#FAF8F2'); // Cream
  });

  it('guarantees WCAG AA text contrast: Champagne Gold is reserved for decorative accents only', () => {
    const html = renderToStaticMarkup(<GameLoadingFallback />);

    // 1. Text elements MUST NOT use Champagne Gold (#BDA77E) due to insufficient contrast on light background
    // Subtitle "CODE TO KNOW" uses Deep Slate #526B7B (contrast ratio > 5.2:1 against #FFFFFF)
    expect(html).toMatch(/color:\s*#526B7B[^>]*>CODE TO KNOW/);

    // Primary status message uses Charcoal #26343D (contrast ratio > 12:1 against #FFFFFF)
    expect(html).toMatch(/color:\s*#26343D[^>]*>模組載入中/);

    // Slogan tagline uses Deep Slate #526B7B (contrast ratio > 5.2:1 against #FFFFFF)
    expect(html).toMatch(/color:\s*#526B7B[^>]*>碼上學，學無止境。/);

    // 2. Champagne Gold (#BDA77E) is reserved strictly for decorative elements
    expect(html).toContain('border-top-color:#BDA77E');
    expect(html).toContain('background-color:#BDA77E');
    expect(html).toContain('linear-gradient(90deg, transparent, #BDA77E, transparent)');
  });

  it('includes accessibility reduced-motion media queries and scoped animations', () => {
    const html = renderToStaticMarkup(<GameLoadingFallback />);

    // Scoped CSS animations
    expect(html).toContain('@keyframes c2k-spin');
    expect(html).toContain('@keyframes c2k-fade-in');
    expect(html).toContain('@keyframes c2k-shimmer');
    expect(html).toContain('@keyframes c2k-center-pulse');

    // Accessibility prefers-reduced-motion
    expect(html).toContain('@media (prefers-reduced-motion: reduce)');
    expect(html).toContain('animation: none !important');

    // Mobile responsive styles
    expect(html).toContain('@media (max-width: 380px)');
  });
});
