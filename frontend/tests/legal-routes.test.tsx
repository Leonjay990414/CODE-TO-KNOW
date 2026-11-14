import { describe, it, expect } from 'vitest';
import { parseHash } from '../src/context/NavigationContext';

describe('Legal Notices Route & Hash Parsing (P12-WEB-008)', () => {
  it('parses #privacy correctly into legal page with privacy tab', () => {
    const route = parseHash('#privacy');
    expect(route.page).toBe('legal');
    expect(route.hash).toBe('#privacy');
  });

  it('parses #terms correctly into legal page with terms tab', () => {
    const route = parseHash('#terms');
    expect(route.page).toBe('legal');
    expect(route.hash).toBe('#terms');
  });

  it('parses #legal correctly into legal page', () => {
    const route = parseHash('#legal');
    expect(route.page).toBe('legal');
    expect(route.hash).toBe('#legal');
  });

  it('parses #ethics correctly into legal page with ethics tab', () => {
    const route = parseHash('#ethics');
    expect(route.page).toBe('legal');
    expect(route.hash).toBe('#ethics');
  });

  it('falls back to default hash for unmapped hashes', () => {
    const route = parseHash('#unknown-hash-random');
    expect(route.page).toBe('home');
    expect(route.hash).toBe('#unknown-hash-random');
  });
});
