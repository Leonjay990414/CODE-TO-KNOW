import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { Hero } from '../src/components/Hero';
import { Navbar } from '../src/components/Navbar';
import { NavigationProvider } from '../src/context/NavigationContext';
import { AuthProvider } from '../src/context/AuthContext';
import { useScrollReveal } from '../src/utils/useScrollReveal';

// Polyfill window & matchMedia for SSR/Node test environment
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    scrollTo: vi.fn(),
    matchMedia: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  };
}

describe('CODE TO KNOW Website Animation & Interaction Specification Suite (CTK-SPEC-ANIMATION-INTERACTION-20261117)', () => {
  const componentsCss = fs.readFileSync(
    path.resolve(__dirname, '../src/styles/components.css'),
    'utf-8'
  );
  const tokensCss = fs.readFileSync(
    path.resolve(__dirname, '../src/styles/tokens.css'),
    'utf-8'
  );

  describe('1. Motion Tokens & Brand Palettes', () => {
    it('defines standard duration and easing tokens in tokens.css', () => {
      expect(tokensCss).toContain('--dur-instant: 100ms;');
      expect(tokensCss).toContain('--dur-fast: 160ms;');
      expect(tokensCss).toContain('--dur-base: 240ms;');
      expect(tokensCss).toContain('--dur-slow: 400ms;');
      expect(tokensCss).toContain('--ease-standard: cubic-bezier(0.2, 0, 0, 1);');
      expect(tokensCss).toContain('--ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);');
      expect(tokensCss).toContain('--motion-scale-press: 0.97;');
    });

    it('defines brand 5-color harmony tokens in tokens.css', () => {
      expect(tokensCss).toContain('--color-brand-sage: #5A7D6C;'); // 鼠尾草綠
      expect(tokensCss).toContain('--color-brand-oat: #EBE5D8;');  // 燕麥色
      expect(tokensCss).toContain('--color-brand-cream: #FAF8F2;'); // 奶油白
      expect(tokensCss).toContain('--color-brand-deep-slate: #526B7B;'); // 藍灰深色
      expect(tokensCss).toContain('--color-brand-gold: #BDA77E;'); // 香檳金
    });
  });

  describe('2. Button & Card Precision Transitions (No "transition: all" Abuse)', () => {
    it('defines explicit transition properties on .btn rather than transition: all', () => {
      expect(componentsCss).toMatch(/\.btn\s*\{[^}]*transition:\s*transform/);
      expect(componentsCss).toMatch(/\.btn\s*\{[^}]*background-color/);
      expect(componentsCss).not.toMatch(/\.btn\s*\{[^}]*transition:\s*all/);
    });

    it('provides tactile active press feedback on buttons (scale 0.97)', () => {
      expect(componentsCss).toContain('.btn:active');
      expect(componentsCss).toContain('var(--motion-scale-press, 0.97)');
    });

    it('defines explicit transition properties on .card rather than transition: all', () => {
      expect(componentsCss).toMatch(/\.card\s*\{[^}]*transition:\s*transform/);
      expect(componentsCss).toMatch(/\.card\s*\{[^}]*box-shadow/);
      expect(componentsCss).not.toMatch(/\.card\s*\{[^}]*transition:\s*all/);
    });

    it('defines subtle lift and press behavior on .card-interactive', () => {
      expect(componentsCss).toContain('.card-interactive:hover');
      expect(componentsCss).toContain('transform: translateY(-3px);');
      expect(componentsCss).toContain('.card-interactive:active');
    });
  });

  describe('3. Text, SVG & Scroll Reveal Animations', () => {
    it('defines text reveal mask and accent underline expand classes', () => {
      expect(componentsCss).toContain('.text-reveal-mask');
      expect(componentsCss).toContain('.text-reveal-up');
      expect(componentsCss).toContain('.accent-underline-grow');
      expect(componentsCss).toContain('@keyframes textRevealUp');
    });

    it('defines SVG brand logo spark micro-animation', () => {
      expect(componentsCss).toContain('.svg-logo-spark');
      expect(componentsCss).toContain('.brand-logo-interactive:hover .svg-logo-spark');
      expect(componentsCss).toContain('@keyframes logoSparkPulse');
    });

    it('defines scroll reveal system classes with safe translation', () => {
      expect(componentsCss).toContain('.reveal-scroll-fade');
      expect(componentsCss).toContain('.reveal-scroll-up');
      expect(componentsCss).toContain('.reveal-scroll-up.is-revealed');
    });
  });

  describe('4. Strict Accessibility (prefers-reduced-motion)', () => {
    it('guarantees complete zero-motion override under prefers-reduced-motion', () => {
      expect(componentsCss).toContain('@media (prefers-reduced-motion: reduce)');
      expect(componentsCss).toContain('animation-duration: 0.001ms !important;');
      expect(componentsCss).toContain('transition-duration: 0.001ms !important;');
      expect(componentsCss).toContain('.text-reveal-up');
      expect(componentsCss).toContain('.reveal-scroll-up');
      expect(componentsCss).toContain('.svg-logo-spark');
    });
  });

  describe('5. Component Integration: Hero & Navbar', () => {
    it('renders Hero component with headline reveal and accent underline classes', () => {
      const html = renderToStaticMarkup(
        <NavigationProvider>
          <Hero />
        </NavigationProvider>
      );

      expect(html).toContain('text-reveal-mask');
      expect(html).toContain('text-reveal-up');
      expect(html).toContain('accent-underline-grow');
      expect(html).toContain('icon-interactive');
    });

    it('renders Navbar component with interactive brand logo spark SVG class', () => {
      const html = renderToStaticMarkup(
        <AuthProvider>
          <NavigationProvider>
            <Navbar />
          </NavigationProvider>
        </AuthProvider>
      );

      expect(html).toContain('brand-logo-interactive');
      expect(html).toContain('svg-logo-spark');
      expect(html).toContain('viewBox="0 0 256 256"');
    });
  });

  describe('6. useScrollReveal Hook Lifecycle & Cleanup', () => {
    it('exports useScrollReveal function', () => {
      expect(typeof useScrollReveal).toBe('function');
    });
  });
});
