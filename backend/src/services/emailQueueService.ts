/**
 * CODE TO KNOW - Email Dispatch Queue & Resilience Service
 * Fulfills P10-EML-008 (寄送佇列、重試、退信、退訂及寄送紀錄)
 * Fulfills P10-EML-010 (郵件服務用量與成本警戒防護)
 * Fulfills P10-EML-003 (寄件身分與政策檢查)
 */

export interface EmailJob {
  id: string;
  to: string;
  subject: string;
  category: 'verification' | 'password_reset' | 'security_alert' | 'exam' | 'announcement' | 'maintenance';
  html: string;
  text: string;
  status: 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'DEAD_LETTER';
  retryCount: number;
  maxRetries: number;
  nextRetryTime: number;
  createdAt: number;
  sentAt?: number;
  error?: string;
}

export interface DispatchAuditRecord {
  id: string;
  maskedRecipient: string;
  category: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'SUPPRESSED' | 'DEAD_LETTER';
  attempts: number;
  timestamp: number;
  error?: string;
}

export interface QueueConfig {
  baseRetryDelayMs: number;
  backoffFactor: number;
  defaultMaxRetries: number;
  dailyQuotaLimit: number;
  alarmThresholdRate: number; // e.g. 0.8 = 80%
}

export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
  baseRetryDelayMs: 1000,
  backoffFactor: 2,
  defaultMaxRetries: 3,
  dailyQuotaLimit: 1000,
  alarmThresholdRate: 0.8,
};

export class EmailQueueService {
  private queue: EmailJob[] = [];
  private deadLetterQueue: EmailJob[] = [];
  private auditLogs: DispatchAuditRecord[] = [];
  private suppressionList: Set<string> = new Set();
  private config: QueueConfig;
  private dailySentCount = 0;
  private quotaAlarmTriggered = false;

  constructor(customConfig?: Partial<QueueConfig>) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...customConfig };
  }

  /**
   * Masks email address for privacy in audit logs.
   * e.g. student@example.com -> s***t@example.com
   */
  public maskEmail(email: string): string {
    const atIndex = email.indexOf('@');
    if (atIndex <= 1) return '***@' + (email.split('@')[1] || 'domain.com');
    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex + 1);
    if (name.length <= 2) {
      return `${name[0]}*@${domain}`;
    }
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }

  /**
   * Adds an email address to the unsubscribe / suppression list.
   */
  public addToSuppressionList(email: string): void {
    this.suppressionList.add(email.trim().toLowerCase());
  }

  /**
   * Removes an email from suppression list.
   */
  public removeFromSuppressionList(email: string): void {
    this.suppressionList.delete(email.trim().toLowerCase());
  }

  /**
   * Checks if an email is unsubscribed / suppressed.
   */
  public isSuppressed(email: string): boolean {
    return this.suppressionList.has(email.trim().toLowerCase());
  }

  /**
   * Checks if daily sent quota limit has been exceeded.
   */
  public isQuotaExceeded(): boolean {
    return this.dailySentCount >= this.config.dailyQuotaLimit;
  }

  /**
   * Manually record a sent email (e.g. from direct dispatch).
   */
  public recordSent(): void {
    this.dailySentCount++;
    const threshold = this.config.dailyQuotaLimit * this.config.alarmThresholdRate;
    if (this.dailySentCount >= threshold && !this.quotaAlarmTriggered) {
      this.quotaAlarmTriggered = true;
      console.warn(
        `[EMAIL QUOTA ALARM] Daily email volume reached ${this.dailySentCount}/${this.config.dailyQuotaLimit} (${(this.config.alarmThresholdRate * 100).toFixed(0)}% threshold).`
      );
    }
  }

  /**
   * Resets the daily quota counter (for daily scheduled reset or test isolation).
   */
  public resetDailyQuota(): void {
    this.dailySentCount = 0;
    this.quotaAlarmTriggered = false;
  }

  /**
   * Enqueues a new email job into the queue.
   */
  public enqueue(payload: {
    to: string;
    subject: string;
    category: EmailJob['category'];
    html: string;
    text: string;
    maxRetries?: number;
  }): { success: boolean; jobId?: string; error?: string } {
    const normalizedEmail = payload.to.trim().toLowerCase();

    // Check suppression list
    if (this.isSuppressed(normalizedEmail)) {
      this.auditLogs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        maskedRecipient: this.maskEmail(normalizedEmail),
        category: payload.category,
        subject: payload.subject,
        status: 'SUPPRESSED',
        attempts: 0,
        timestamp: Date.now(),
        error: 'Email recipient is in suppression list (unsubscribed).',
      });
      return {
        success: false,
        error: 'RECIPIENT_SUPPRESSED',
      };
    }

    // Check daily quota limit
    if (this.isQuotaExceeded()) {
      this.auditLogs.push({
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        maskedRecipient: this.maskEmail(normalizedEmail),
        category: payload.category,
        subject: payload.subject,
        status: 'FAILED',
        attempts: 0,
        timestamp: Date.now(),
        error: 'Daily email quota limit reached.',
      });
      return {
        success: false,
        error: 'DAILY_QUOTA_EXCEEDED',
      };
    }

    const job: EmailJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      to: normalizedEmail,
      subject: payload.subject,
      category: payload.category,
      html: payload.html,
      text: payload.text,
      status: 'QUEUED',
      retryCount: 0,
      maxRetries: payload.maxRetries ?? this.config.defaultMaxRetries,
      nextRetryTime: Date.now(),
      createdAt: Date.now(),
    };

    this.queue.push(job);
    return { success: true, jobId: job.id };
  }

  /**
   * Processes ready jobs in the queue.
   * Accepts a sender function to allow offline/mock/provider execution.
   */
  public async processQueue(
    sender: (job: EmailJob) => Promise<boolean>
  ): Promise<{ processed: number; sent: number; retried: number; deadLetter: number }> {
    const now = Date.now();
    let sent = 0;
    let retried = 0;
    let deadLetter = 0;
    let processed = 0;

    const remainingQueue: EmailJob[] = [];

    for (const job of this.queue) {
      if (job.status !== 'QUEUED' && job.status !== 'FAILED') {
        remainingQueue.push(job);
        continue;
      }

      if (job.nextRetryTime > now) {
        remainingQueue.push(job);
        continue;
      }

      if (this.isQuotaExceeded()) {
        job.retryCount++;
        job.error = 'Daily email quota limit reached.';
        job.status = 'FAILED';
        remainingQueue.push(job);
        continue;
      }

      processed++;
      job.status = 'PROCESSING';

      try {
        const isDelivered = await sender(job);
        if (isDelivered) {
          job.status = 'SENT';
          job.sentAt = Date.now();
          sent++;
          this.dailySentCount++;

          // Check daily quota alarm threshold (P10-EML-010)
          const threshold = this.config.dailyQuotaLimit * this.config.alarmThresholdRate;
          if (this.dailySentCount >= threshold && !this.quotaAlarmTriggered) {
            this.quotaAlarmTriggered = true;
            console.warn(
              `[EMAIL QUOTA ALARM] Daily email volume reached ${this.dailySentCount}/${this.config.dailyQuotaLimit} (${(this.config.alarmThresholdRate * 100).toFixed(0)}% threshold).`
            );
          }

          this.auditLogs.push({
            id: `audit-${job.id}`,
            maskedRecipient: this.maskEmail(job.to),
            category: job.category,
            subject: job.subject,
            status: 'SENT',
            attempts: job.retryCount + 1,
            timestamp: Date.now(),
          });
        } else {
          throw new Error('Provider returned delivery failure.');
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        job.retryCount++;
        job.error = errorMsg;

        if (job.retryCount >= job.maxRetries) {
          job.status = 'DEAD_LETTER';
          deadLetter++;
          this.deadLetterQueue.push(job);

          this.auditLogs.push({
            id: `audit-${job.id}`,
            maskedRecipient: this.maskEmail(job.to),
            category: job.category,
            subject: job.subject,
            status: 'DEAD_LETTER',
            attempts: job.retryCount,
            timestamp: Date.now(),
            error: errorMsg,
          });
        } else {
          job.status = 'FAILED';
          const delay = this.config.baseRetryDelayMs * Math.pow(this.config.backoffFactor, job.retryCount);
          job.nextRetryTime = Date.now() + delay;
          retried++;
          remainingQueue.push(job);
        }
      }
    }

    this.queue = remainingQueue;
    return { processed, sent, retried, deadLetter };
  }

  /**
   * Returns snapshot of the queue metrics.
   */
  public getMetrics(): {
    queuedCount: number;
    deadLetterCount: number;
    dailySentCount: number;
    dailyQuotaLimit: number;
    quotaAlarmTriggered: boolean;
    suppressionListCount: number;
  } {
    return {
      queuedCount: this.queue.length,
      deadLetterCount: this.deadLetterQueue.length,
      dailySentCount: this.dailySentCount,
      dailyQuotaLimit: this.config.dailyQuotaLimit,
      quotaAlarmTriggered: this.quotaAlarmTriggered,
      suppressionListCount: this.suppressionList.size,
    };
  }

  public getAuditLogs(): DispatchAuditRecord[] {
    return [...this.auditLogs];
  }

  public getDeadLetterQueue(): EmailJob[] {
    return [...this.deadLetterQueue];
  }

  public clearQueue(): void {
    this.queue = [];
    this.deadLetterQueue = [];
    this.auditLogs = [];
    this.dailySentCount = 0;
    this.quotaAlarmTriggered = false;
  }
}

export const emailQueueService = new EmailQueueService();
