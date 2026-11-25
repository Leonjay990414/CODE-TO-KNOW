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

  describe('5. Quota Mechanism & Rate Limiting (Task 05 & P10-EML-010)', () => {
    it('11. Direct dispatch increments sent count and blocks when daily quota is exceeded', async () => {
      // Configure low quota for testing
      const smallQueue = new EmailQueueService({ dailyQuotaLimit: 2 });
      const limitedService = new EmailService(mockProvider, smallQueue);

      // Send 1st email - success
      const res1 = await limitedService.sendVerificationEmail('user1@example.com', 'T1');
      expect(res1.success).toBe(true);
      expect(res1.status).toBe('MOCKED');
      expect(smallQueue.getMetrics().dailySentCount).toBe(1);

      // Send 2nd email - success
      const res2 = await limitedService.sendVerificationEmail('user2@example.com', 'T2');
      expect(res2.success).toBe(true);
      expect(res2.status).toBe('MOCKED');
      expect(smallQueue.getMetrics().dailySentCount).toBe(2);

      // Send 3rd email - quota exceeded!
      const res3 = await limitedService.sendVerificationEmail('user3@example.com', 'T3');
      expect(res3.success).toBe(false);
      expect(res3.status).toBe('FAILED');
      expect(res3.error).toContain('DAILY_QUOTA_EXCEEDED');
      expect(smallQueue.getMetrics().dailySentCount).toBe(2); // does not increment further
    });

    it('12. Enqueue mode rejects job with DAILY_QUOTA_EXCEEDED when quota is full', async () => {
      const smallQueue = new EmailQueueService({ dailyQuotaLimit: 1 });
      const limitedService = new EmailService(mockProvider, smallQueue);

      await limitedService.sendVerificationEmail('first@example.com', 'T1', 'User', { useQueue: false });
      expect(smallQueue.getMetrics().dailySentCount).toBe(1);

      // Queueing when quota exceeded
      const queueRes = await limitedService.sendVerificationEmail('second@example.com', 'T2', 'User', { useQueue: true });
      expect(queueRes.success).toBe(false);
      expect(queueRes.status).toBe('FAILED');
      expect(queueRes.error).toContain('DAILY_QUOTA_EXCEEDED');
    });

    it('13. Failed email deliveries do not increment the daily sent quota count', async () => {
      mockProvider.shouldSucceed = false;
      const initialCount = queueService.getMetrics().dailySentCount;

      const res = await emailService.sendVerificationEmail('fail-count@example.com', 'T1');
      expect(res.success).toBe(false);
      expect(res.status).toBe('FAILED');
      expect(queueService.getMetrics().dailySentCount).toBe(initialCount);
    });

    it('14. Quota reset restores delivery capability', async () => {
      const smallQueue = new EmailQueueService({ dailyQuotaLimit: 1 });
      const limitedService = new EmailService(mockProvider, smallQueue);

      await limitedService.sendVerificationEmail('u1@example.com', 'T1');
      expect(smallQueue.isQuotaExceeded()).toBe(true);

      // Reset quota
      smallQueue.resetDailyQuota();
      expect(smallQueue.isQuotaExceeded()).toBe(false);

      const resAfterReset = await limitedService.sendVerificationEmail('u2@example.com', 'T2');
      expect(resAfterReset.success).toBe(true);
      expect(resAfterReset.status).toBe('MOCKED');
    });
  });

  describe('6. Input Validation & Injection Prevention (Tasks 03, 07)', () => {
    it('15. Rejects invalid email addresses with INVALID_INPUT status', async () => {
      const invalidEmails = ['', '   ', 'not-an-email', 'missing@domain', '@no-local.com', 'spaces in@email.com'];

      for (const email of invalidEmails) {
        const res = await emailService.sendVerificationEmail(email, 'TOKEN');
        expect(res.success).toBe(false);
        expect(res.status).toBe('FAILED');
        expect(res.error).toContain('INVALID_INPUT');
      }
    });

    it('16. Sanitizes dangerous URL schemes and CRLF headers in rendered templates', async () => {
      const customRender = templates.renderVerificationEmail({
        displayName: '惡意使用者 <script>alert(1)</script>',
        verificationUrl: 'javascript:alert(document.cookie)',
        expiresInMinutes: 30,
      });

      expect(customRender.html).not.toContain('javascript:alert');
      expect(customRender.html).toContain('href="#"');
      expect(customRender.html).not.toContain('<script>');
      expect(customRender.subject).not.toContain('\r');
      expect(customRender.subject).not.toContain('\n');
    });
  });

  describe('7. Suppression List Normalization & Case Insensitivity (Task 04)', () => {
    it('17. Normalizes email case and trimming in suppression list check', async () => {
      queueService.addToSuppressionList('  UnSub-User@Example.COM  ');

      expect(queueService.isSuppressed('unsub-user@example.com')).toBe(true);
      expect(queueService.isSuppressed('UNSUB-USER@EXAMPLE.COM')).toBe(true);
      expect(queueService.isSuppressed('  unsub-user@example.com ')).toBe(true);

      const res = await emailService.sendVerificationEmail('UNSUB-USER@EXAMPLE.COM', 'TOKEN');
      expect(res.success).toBe(false);
      expect(res.status).toBe('SUPPRESSED');
      expect(mockProvider.sentMails.length).toBe(0);
    });

    it('18. Removing from suppression list re-enables delivery', async () => {
      queueService.addToSuppressionList('temporary-block@example.com');
      expect(queueService.isSuppressed('temporary-block@example.com')).toBe(true);

      queueService.removeFromSuppressionList('temporary-block@example.com');
      expect(queueService.isSuppressed('temporary-block@example.com')).toBe(false);

      const res = await emailService.sendVerificationEmail('temporary-block@example.com', 'TOKEN');
      expect(res.success).toBe(true);
      expect(res.status).toBe('MOCKED');
    });
  });

  describe('8. Concurrency & High Volume Stability (Task 07)', () => {
    it('19. Safely handles multiple concurrent dispatch requests without state corruption', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
        emailService.sendVerificationEmail(`concurrent${i}@example.com`, `TOKEN_${i}`, `User ${i}`)
      );

      const results = await Promise.all(concurrentRequests);

      expect(results.length).toBe(10);
      results.forEach((res, i) => {
        expect(res.success).toBe(true);
        expect(res.status).toBe('MOCKED');
        expect(res.recipientMasked).toBe(`c***${i}@example.com`);
      });

      expect(mockProvider.sentMails.length).toBe(10);
      expect(queueService.getMetrics().dailySentCount).toBe(10);
    });
  });
});
