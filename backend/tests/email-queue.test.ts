import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailQueueService, EmailJob } from '../src/services/emailQueueService';

describe('Wave 6 Batch 1: Email Dispatch Queue & Resilience (P10-EML-008, P10-EML-010)', () => {
  let queueService: EmailQueueService;

  beforeEach(() => {
    queueService = new EmailQueueService({
      baseRetryDelayMs: 10, // fast for testing
      backoffFactor: 2,
      defaultMaxRetries: 3,
      dailyQuotaLimit: 10,
      alarmThresholdRate: 0.8, // alert at 8
    });
    vi.clearAllMocks();
  });

  describe('1. Enqueue & Dispatch Happy Path', () => {
    it('enqueues email job successfully', () => {
      const res = queueService.enqueue({
        to: 'student@example.com',
        subject: '驗證您的電子郵件',
        category: 'verification',
        html: '<p>驗證碼 123456</p>',
        text: '驗證碼 123456',
      });

      expect(res.success).toBe(true);
      expect(res.jobId).toBeDefined();

      const metrics = queueService.getMetrics();
      expect(metrics.queuedCount).toBe(1);
      expect(metrics.dailySentCount).toBe(0);
    });

    it('processes queued job successfully with custom sender', async () => {
      queueService.enqueue({
        to: 'student@example.com',
        subject: '密碼重設通知',
        category: 'password_reset',
        html: '<p>密碼重設</p>',
        text: '密碼重設',
      });

      const mockSender = vi.fn().mockResolvedValue(true);
      const result = await queueService.processQueue(mockSender);

      expect(result.processed).toBe(1);
      expect(result.sent).toBe(1);
      expect(result.retried).toBe(0);
      expect(result.deadLetter).toBe(0);
      expect(mockSender).toHaveBeenCalledTimes(1);

      const metrics = queueService.getMetrics();
      expect(metrics.queuedCount).toBe(0);
      expect(metrics.dailySentCount).toBe(1);

      const logs = queueService.getAuditLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('SENT');
      expect(logs[0].maskedRecipient).toBe('s***t@example.com');
    });
  });

  describe('2. Retry Logic & Dead Letter Queue (P10-EML-008)', () => {
    it('retries on failure with backoff delay up to maxRetries', async () => {
      queueService.enqueue({
        to: 'retry-test@example.com',
        subject: '系統通知',
        category: 'exam',
        html: '<p>測驗開始</p>',
        text: '測驗開始',
        maxRetries: 2,
      });

      // Attempt 1: Fail
      const failingSender = vi.fn().mockResolvedValue(false);
      const res1 = await queueService.processQueue(failingSender);
      expect(res1.processed).toBe(1);
      expect(res1.retried).toBe(1);
      expect(res1.deadLetter).toBe(0);

      // Attempt 2 before delay: Should skip
      const res2 = await queueService.processQueue(failingSender);
      expect(res2.processed).toBe(0);

      // Wait for backoff
      await new Promise((r) => setTimeout(r, 25));

      // Attempt 2 after delay: Fail again (maxRetries reached)
      const res3 = await queueService.processQueue(failingSender);
      expect(res3.processed).toBe(1);
      expect(res3.deadLetter).toBe(1);

      const metrics = queueService.getMetrics();
      expect(metrics.queuedCount).toBe(0);
      expect(metrics.deadLetterCount).toBe(1);

      const dlq = queueService.getDeadLetterQueue();
      expect(dlq.length).toBe(1);
      expect(dlq[0].status).toBe('DEAD_LETTER');
      expect(dlq[0].retryCount).toBe(2);
    });
  });

  describe('3. Unsubscribe Suppression & Privacy (P10-EML-008)', () => {
    it('blocks dispatch when recipient is in suppression list', () => {
      const email = 'optout@example.com';
      queueService.addToSuppressionList(email);
      expect(queueService.isSuppressed(email)).toBe(true);

      const res = queueService.enqueue({
        to: email,
        subject: '行銷公告',
        category: 'announcement',
        html: '<p>優惠內容</p>',
        text: '優惠內容',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('RECIPIENT_SUPPRESSED');

      const logs = queueService.getAuditLogs();
      expect(logs.length).toBe(1);
      expect(logs[0].status).toBe('SUPPRESSED');
      expect(logs[0].maskedRecipient).toBe('o***t@example.com');
    });

    it('masks email properly in privacy audit logs', () => {
      expect(queueService.maskEmail('user@test.org')).toBe('u***r@test.org');
      expect(queueService.maskEmail('al@domain.com')).toBe('a*@domain.com');
      expect(queueService.maskEmail('x@short.com')).toBe('***@short.com');
    });
  });

  describe('4. Daily Quota Limit & Cost Alarm (P10-EML-010)', () => {
    it('triggers alarm warning when sent volume reaches 80% threshold', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Send 8 emails to hit 80% of limit 10
      for (let i = 0; i < 8; i++) {
        queueService.enqueue({
          to: `student${i}@example.com`,
          subject: `通知 ${i}`,
          category: 'maintenance',
          html: '<p>維護</p>',
          text: '維護',
        });
      }

      const mockSender = vi.fn().mockResolvedValue(true);
      await queueService.processQueue(mockSender);

      const metrics = queueService.getMetrics();
      expect(metrics.dailySentCount).toBe(8);
      expect(metrics.quotaAlarmTriggered).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EMAIL QUOTA ALARM]')
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
