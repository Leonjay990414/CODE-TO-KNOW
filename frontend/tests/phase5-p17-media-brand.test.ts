import { describe, it, expect } from 'vitest';
import {
  parseUtmParameters,
  buildMarketingUrl,
  OFFICIAL_BRAND_METADATA,
} from '../src/utils/marketingUtils';

describe('Phase 5 Integration: Brand Marketing & UTM Traffic Tracking (P17-MED-001, P17-MED-009)', () => {
  describe('1. P17-MED-001: Brand Identity & Metadata Integrity', () => {
    it('1.1 verifies authentic brand name and slogans align with AGENTS.md', () => {
      expect(OFFICIAL_BRAND_METADATA.brandNameZh).toBe('碼上學');
      expect(OFFICIAL_BRAND_METADATA.brandNameEn).toBe('CODE TO KNOW');
      expect(OFFICIAL_BRAND_METADATA.sloganZh).toBe('碼上學，學無止境。');
      expect(OFFICIAL_BRAND_METADATA.taglineEn).toBe('Learn Beyond Limits.');
    });

    it('1.2 verifies official community channel handles', () => {
      const handles = OFFICIAL_BRAND_METADATA.officialHandles;
      expect(handles.youtube).toBe('@codetoknow_tw');
      expect(handles.instagram).toBe('@codetoknow.tw');
      expect(handles.threads).toBe('@codetoknow.tw');
      expect(handles.github).toBe('Leonjay990414/CODE-TO-KNOW');
    });
  });

  describe('2. P17-MED-009: UTM Parameter Parsing & Campaign URL Builder', () => {
    it('2.1 accurately parses standard UTM parameters from query string', () => {
      const query = '?utm_source=instagram&utm_medium=social&utm_campaign=p5_game_center&utm_content=card_cta';
      const parsed = parseUtmParameters(query);

      expect(parsed.utm_source).toBe('instagram');
      expect(parsed.utm_medium).toBe('social');
      expect(parsed.utm_campaign).toBe('p5_game_center');
      expect(parsed.utm_content).toBe('card_cta');
      expect(parsed.utm_term).toBeUndefined();
    });

    it('2.2 returns empty object for query string without UTM parameters', () => {
      expect(parseUtmParameters('')).toEqual({});
      expect(parseUtmParameters('?ref=homepage&tab=games')).toEqual({});
    });

    it('2.3 builds standard marketing URLs preserving path and attaching UTM queries', () => {
      const built = buildMarketingUrl('/#games', {
        utm_source: 'threads',
        utm_medium: 'bio_link',
        utm_campaign: 'phase5_launch',
      });

      expect(built).toContain('utm_source=threads');
      expect(built).toContain('utm_medium=bio_link');
      expect(built).toContain('utm_campaign=phase5_launch');
    });
  });
});
