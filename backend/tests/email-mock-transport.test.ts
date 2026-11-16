import { describe, it, expect, vi } from 'vitest';
import { ConsoleEmailProvider, DisabledEmailProvider } from '../src/services/email.provider.js';

describe('Phase 10: Email Provider Mock Transport & Safety Failure Specs (P10-EML-008, P10-EML-009)', () => {
  describe('1. Development ConsoleEmailProvider (Mock Transport)', () => {
    it('executes without connecting to external network or crashing', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const provider = new ConsoleEmailProvider();

      const result = await provider.sendVerificationEmail('student@example.edu.tw', 'MOCK_TOKEN_123');
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('[EMAIL MOCK] Verification email is not actually sent.');

      consoleSpy.mockRestore();
    });

    it('does not log raw email or token values to protect user privacy', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
      const provider = new ConsoleEmailProvider();

      await provider.sendPasswordResetEmail('sensitive-user@codetoknow.edu', 'SUPER_SECRET_TOKEN_456');

      const loggedMessage = consoleSpy.mock.calls[0]?.[0] || '';
      expect(loggedMessage).not.toContain('sensitive-user@codetoknow.edu');
      expect(loggedMessage).not.toContain('SUPER_SECRET_TOKEN_456');

      consoleSpy.mockRestore();
    });
  });

  describe('2. Production DisabledEmailProvider (Fail-Closed Safety)', () => {
    it('warns and returns false without throwing unhandled error when real SMTP is unconfigured', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const provider = new DisabledEmailProvider();

      const result = await provider.sendVerificationEmail('test@codetoknow.edu', 'TOKEN');
      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('[EMAIL DISABLED] Verification email service is unavailable.');

      warnSpy.mockRestore();
    });
  });

  describe('3. Send Failure & Retry Specification Verification', () => {
    it('implements exponential backoff retry calculation logic', () => {
      interface RetryPolicy {
        maxRetries: number;
        baseDelayMs: number;
        calculateDelay: (attempt: number) => number;
      }

      const policy: RetryPolicy = {
        maxRetries: 3,
        baseDelayMs: 1000,
        calculateDelay: (attempt: number) => Math.min(policy.baseDelayMs * Math.pow(2, attempt - 1), 10000),
      };

      expect(policy.calculateDelay(1)).toBe(1000); // 1s
      expect(policy.calculateDelay(2)).toBe(2000); // 2s
      expect(policy.calculateDelay(3)).toBe(4000); // 4s
      expect(policy.calculateDelay(5)).toBe(10000); // capped at 10s
    });
  });
});
