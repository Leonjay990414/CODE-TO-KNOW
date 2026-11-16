import { describe, it, expect } from 'vitest';
import {
  JOIN_CODE_CHARSET,
  DEFAULT_JOIN_CODE_LENGTH,
  generateSecureJoinCode,
  normalizeJoinCode,
  validateJoinCodeFormat,
} from '../src/utils/joinCode.js';

describe('Classroom Management: Join Code Algorithm & Validation Specification', () => {
  describe('Charset Constraints & Disambiguation', () => {
    it('uses a 31-character base alphanumeric charset', () => {
      expect(JOIN_CODE_CHARSET).toHaveLength(31);
    });

    it('strictly excludes visually ambiguous characters (0, O, 1, I, L)', () => {
      expect(JOIN_CODE_CHARSET).not.toContain('0');
      expect(JOIN_CODE_CHARSET).not.toContain('O');
      expect(JOIN_CODE_CHARSET).not.toContain('1');
      expect(JOIN_CODE_CHARSET).not.toContain('I');
      expect(JOIN_CODE_CHARSET).not.toContain('L');
    });

    it('contains only uppercase letters and digits', () => {
      expect(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/.test(JOIN_CODE_CHARSET)).toBe(true);
    });
  });

  describe('generateSecureJoinCode()', () => {
    it('generates an 8-character string by default', () => {
      const code = generateSecureJoinCode();
      expect(typeof code).toBe('string');
      expect(code).toHaveLength(DEFAULT_JOIN_CODE_LENGTH);
    });

    it('generates codes that only contain valid charset characters', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateSecureJoinCode();
        expect(validateJoinCodeFormat(code)).toBe(true);
      }
    });

    it('generates diverse and unique codes across multiple iterations (high entropy)', () => {
      const set = new Set<string>();
      const iterations = 500;
      for (let i = 0; i < iterations; i++) {
        set.add(generateSecureJoinCode());
      }
      expect(set.size).toBe(iterations);
    });

    it('supports custom positive code lengths', () => {
      const customCode = generateSecureJoinCode(6);
      expect(customCode).toHaveLength(6);
      expect(validateJoinCodeFormat(customCode, 6)).toBe(true);
    });

    it('throws error for invalid non-positive length', () => {
      expect(() => generateSecureJoinCode(0)).toThrow('Join code length must be greater than 0');
      expect(() => generateSecureJoinCode(-5)).toThrow('Join code length must be greater than 0');
    });
  });

  describe('normalizeJoinCode()', () => {
    it('trims leading and trailing whitespace', () => {
      expect(normalizeJoinCode('  7K9M3X2P  ')).toBe('7K9M3X2P');
    });

    it('converts lowercase characters to uppercase', () => {
      expect(normalizeJoinCode('7k9m3x2p')).toBe('7K9M3X2P');
    });

    it('handles non-string inputs safely by returning empty string', () => {
      expect(normalizeJoinCode(null)).toBe('');
      expect(normalizeJoinCode(undefined)).toBe('');
      expect(normalizeJoinCode(12345)).toBe('');
      expect(normalizeJoinCode({})).toBe('');
    });
  });

  describe('validateJoinCodeFormat()', () => {
    it('accepts valid 8-character uppercase codes', () => {
      expect(validateJoinCodeFormat('7K9M3X2P')).toBe(true);
      expect(validateJoinCodeFormat('4W8N9Y6D')).toBe(true);
    });

    it('accepts lowercase or un-trimmed codes after normalization', () => {
      expect(validateJoinCodeFormat(' 7k9m3x2p ')).toBe(true);
    });

    it('rejects codes containing ambiguous characters (0, O, 1, I, L)', () => {
      expect(validateJoinCodeFormat('0K9M3X2P')).toBe(false); // contains 0
      expect(validateJoinCodeFormat('OK9M3X2P')).toBe(false); // contains O
      expect(validateJoinCodeFormat('1K9M3X2P')).toBe(false); // contains 1
      expect(validateJoinCodeFormat('IK9M3X2P')).toBe(false); // contains I
      expect(validateJoinCodeFormat('LK9M3X2P')).toBe(false); // contains L
    });

    it('rejects codes of incorrect lengths', () => {
      expect(validateJoinCodeFormat('7K9M3X2')).toBe(false); // 7 chars
      expect(validateJoinCodeFormat('7K9M3X2PP')).toBe(false); // 9 chars
      expect(validateJoinCodeFormat('')).toBe(false);
    });

    it('rejects codes with special characters or symbols', () => {
      expect(validateJoinCodeFormat('7K9M-X2P')).toBe(false);
      expect(validateJoinCodeFormat('7K9M 3X2')).toBe(false);
      expect(validateJoinCodeFormat('7K9M_X2P')).toBe(false);
    });

    it('rejects non-string inputs safely', () => {
      expect(validateJoinCodeFormat(null)).toBe(false);
      expect(validateJoinCodeFormat(undefined)).toBe(false);
      expect(validateJoinCodeFormat(12345678)).toBe(false);
    });
  });
});
