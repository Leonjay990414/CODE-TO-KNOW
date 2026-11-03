import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../src/utils/password.js';
import { generateSecureToken, hashToken, safeCompare } from '../src/utils/tokens.js';

describe('Security Utilities', () => {
  describe('Password Hashing & Strength', () => {
    it('should hash a password and verify it correctly', async () => {
      const raw = 'LearnBeyondLimits2026';
      const hashed = await hashPassword(raw);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(raw);
      expect(hashed.startsWith('$2')).toBe(true);

      const isMatch = await verifyPassword(raw, hashed);
      expect(isMatch).toBe(true);

      const isWrongMatch = await verifyPassword('WrongPassword123', hashed);
      expect(isWrongMatch).toBe(false);
    });

    it('should validate password complexity correctly', () => {
      // Too short (< 8 chars)
      expect(validatePasswordStrength('Abc1').valid).toBe(false);

      // No numbers
      expect(validatePasswordStrength('Abcdefghijk').valid).toBe(false);

      // No letters
      expect(validatePasswordStrength('1234567890').valid).toBe(false);

      // Valid
      expect(validatePasswordStrength('LearnCode2026').valid).toBe(true);
    });
  });

  describe('Secure Tokens', () => {
    it('should generate secure random tokens of requested length', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);

      expect(token1).toHaveLength(64); // 32 bytes in hex = 64 characters
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    it('should create deterministic SHA-256 hashes', () => {
      const token = 'sample_secret_token_12345';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toHaveLength(64);
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(token);
    });

    it('should compare strings in constant time safely', () => {
      expect(safeCompare('token-abc-123', 'token-abc-123')).toBe(true);
      expect(safeCompare('token-abc-123', 'token-abc-999')).toBe(false);
      expect(safeCompare('token-abc-123', 'different-length')).toBe(false);
    });
  });
});
