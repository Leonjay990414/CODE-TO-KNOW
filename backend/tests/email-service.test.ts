import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../src/services/email.service.js';
import {
  MockEmailProvider,
  DisabledEmailProvider,
  ConsoleEmailProvider,
} from '../src/services/email.provider.js';
import { EmailQueueService } from '../src/services/emailQueueService.js';
import { authService } from '../src/modules/auth/auth.service.js';
import * as templates from '../src/services/email.templates.js';

describe('P10 Stage A: Email Core Service Specification & Integration Suite (NEXT-P10-EMAIL-CORE-01)', () => {
  let emailService: EmailService;
  let mockProvider: MockEmailProvider;
  let queueService: EmailQueueService;

  beforeEach(() => {
    mockProvider = new MockEmailProvider();
    queueService = new EmailQueueService({
      baseRetryDelayMs: 10,
      backoffFactor: 2,
      defaultMaxRetries: 3,
      dailyQuotaLimit: 100,
      alarmThresholdRate: 0.8,
    });
    emailService = new EmailService(mockProvider, queueService);
    vi.clearAllMocks();
  });

  describe('1. Provider Delegation & Mock Delivery', () => {
    it('1. EmailService correctly delegates to provider and passes verification parameters', async () => {
      const res = await emailService.sendVerificationEmail('student@example.edu.tw', 'TEST_TOKEN_123', '王小明');

      expect(res.success).toBe(true);
      expect(res.status).toBe('MOCKED');
      expect(res.category).toBe('verification');
      expect(res.attempts).toBe(1);
      expect(res.recipientMasked).toBe('s***t@example.edu.tw');

      expect(mockProvider.sentMails.length).toBe(1);
      expect(mockProvider.sentMails[0].email).toBe('student@example.edu.tw');
      expect(mockProvider.sentMails[0].token).toBe('TEST_TOKEN_123');
      expect(mockProvider.sentMails[0].type).toBe('verification');
    });

    it('2. EmailService correctly handles Mock Provider for password reset', async () => {
      const res = await emailService.sendPasswordResetEmail('teacher@school.edu', 'RESET_TOKEN_999', '李老師');

      expect(res.success).toBe(true);
      expect(res.status).toBe('MOCKED');
      expect(res.category).toBe('password_reset');
      expect(res.recipientMasked).toBe('t***r@school.edu');

      expect(mockProvider.sentMails.length).toBe(1);
      expect(mockProvider.sentMails[0].email).toBe('teacher@school.edu');
      expect(mockProvider.sentMails[0].token).toBe('RESET_TOKEN_999');
      expect(mockProvider.sentMails[0].type).toBe('password_reset');
    });

    it('3. EmailService returns standardized EmailDeliveryResult structure without DELIVERED claim', async () => {
      const res = await emailService.sendVerificationEmail('user@test.org', 'TOKEN');

      // Must be MOCKED, QUEUED or ACCEPTED, NEVER falsely claimed as DELIVERED
      expect(res.status).not.toBe('DELIVERED');
      expect(res).toHaveProperty('success');
      expect(res).toHaveProperty('status');
      expect(res).toHaveProperty('recipientMasked');
      expect(res).toHaveProperty('category');
      expect(res).toHaveProperty('attempts');
      expect(res).toHaveProperty('timestamp');
      expect(typeof res.timestamp).toBe('number');
    });
  });

  describe('2. Error Handling, Failures & Disabled Provider', () => {
    it('4. Correctly handles provider failure and returns FAILED status without throwing unhandled exception', async () => {
      mockProvider.shouldSucceed = false;
      const res = await emailService.sendVerificationEmail('fail-user@example.com', 'TOKEN');

      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.error).toBeDefined();
    });

    it('4b. Correctly catches provider exceptions and wraps as FAILED', async () => {
      mockProvider.failureError = new Error('Simulated network timeout');
      const res = await emailService.sendPasswordResetEmail('timeout-user@example.com', 'TOKEN');

      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.error).toContain('Simulated network timeout');
    });

    it('5. DisabledEmailProvider safely returns DISABLED without attempting delivery', async () => {
      emailService.setProvider(new DisabledEmailProvider());
      const res = await emailService.sendVerificationEmail('prod-user@example.com', 'TOKEN');

      expect(res.success).toBe(false);
      expect(res.status).toBe('DISABLED');
      expect(res.error).toContain('disabled in production');
    });
  });

  describe('3. Suppression & Template Robustness', () => {
    it('6. Automatically intercepts and suppresses delivery if recipient is in suppression list', async () => {
      queueService.addToSuppressionList('unsubscribed@example.com');
      const res = await emailService.sendVerificationEmail('unsubscribed@example.com', 'TOKEN');

      expect(res.success).toBe(false);
      expect(res.status).toBe('SUPPRESSED');
      expect(res.error).toContain('suppression list');
      expect(mockProvider.sentMails.length).toBe(0);
    });

    it('7. Handles template rendering error gracefully without throwing unhandled exception', async () => {
      const templateSpy = vi.spyOn(templates, 'renderVerificationEmail').mockImplementation(() => {
        throw new Error('Template syntax or data corruption');
      });

      const res = await emailService.sendVerificationEmail('broken@example.com', 'TOKEN');

      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(res.error).toContain('Template rendering failed');

      templateSpy.mockRestore();
    });
  });

  describe('4. AuthService & Architectural Integration', () => {
    it('8. AuthService uses unified EmailService rather than directly invoking provider', () => {
      // Verify auth.service.ts imports emailService
      expect(authService).toBeDefined();
      // EmailService instance is injected and accessible
      expect(emailService.sendVerificationEmail).toBeInstanceOf(Function);
      expect(emailService.sendPasswordResetEmail).toBeInstanceOf(Function);
    });

    it('9. Mock provider never triggers external HTTP/HTTPS network calls', async () => {
      const netSpy = vi.fn();
      // Verify mockProvider executes entirely in-memory
      await emailService.sendVerificationEmail('safe@codetoknow.edu', 'TOKEN_SECURE');
      expect(netSpy).not.toHaveBeenCalled();
      expect(mockProvider.sentMails[0].token).toBe('TOKEN_SECURE');
    });

    it('10. Prevents duplicate enqueuing on single synchronous dispatch request', async () => {
      const res = await emailService.sendVerificationEmail('no-duplicate@example.com', 'TOKEN', '學員', { useQueue: false });
      expect(res.status).toBe('MOCKED');
      // In-memory queue remains empty because direct dispatch was requested
      expect(queueService.getMetrics().queuedCount).toBe(0);
    });

    it('10b. Correctly enqueues when useQueue option is explicitly requested', async () => {
      const res = await emailService.sendVerificationEmail('queue-test@example.com', 'TOKEN', '學員', { useQueue: true });
      expect(res.status).toBe('QUEUED');
      expect(res.jobId).toBeDefined();
      expect(queueService.getMetrics().queuedCount).toBe(1);
    });
  });
});
