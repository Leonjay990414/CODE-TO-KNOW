/**
 * CODE TO KNOW (碼上學) - Email Core Service
 * P10 官方電子郵件與通知系統統一入口 (P10 Stage A)
 * 
 * 核心職責：
 * 1. 統一對外入口：提供 AuthService、ClassroomService、AdminService 呼叫。
 * 2. 解耦傳輸底層：業務模組不再直接依賴 EmailProvider 或第三方 SDK。
 * 3. 模板自動渲染：安全對接 email.templates.ts，自動執行 escapeHtml 轉義。
 * 4. 佇列防護整合：安全對接 emailQueueService，檢查退訂黑名單並支援非同步排程。
 * 5. 標準交付狀態：回傳 EmailDeliveryResult (QUEUED, ACCEPTED, MOCKED, SUPPRESSED, FAILED, DISABLED)。
 * 6. 嚴格反幻覺守護：禁止將 MOCKED、QUEUED 或 ACCEPTED 標記為 DELIVERED。
 */

import { EmailProvider, emailProvider, DisabledEmailProvider, ConsoleEmailProvider, MockEmailProvider } from './email.provider.js';
import {
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderSecurityLoginAlertEmail,
  SecurityLoginAlertEmailParams,
  EmailRenderOutput,
} from './email.templates.js';
import { EmailQueueService, emailQueueService } from './emailQueueService.js';
import { env } from '../config/env.js';

export type DeliveryStatus =
  | 'QUEUED'      // 已進入內部佇列非同步排程
  | 'ACCEPTED'    // 傳輸商已接受 (不等於收件者已送達)
  | 'MOCKED'      // 開發或測試環境安全模擬攔截 (零真實外發)
  | 'SUPPRESSED'  // 收件者在退訂黑名單中主動攔截
  | 'RETRYING'    // 發送失敗並已安排指數退避重試
  | 'FAILED'      // 發送失敗或達最大重試進入死信隊列
  | 'DISABLED';   // 生產未配置傳輸商時安全熔斷

export interface EmailDeliveryResult {
  success: boolean;
  jobId?: string;
  status: DeliveryStatus;
  recipientMasked: string; // e.g. s***t@domain.com
  category: 'verification' | 'password_reset' | 'security_alert' | 'exam' | 'announcement' | 'maintenance';
  attempts: number;
  providerResponse?: {
    id?: string;
    message?: string;
  };
  error?: string;
  timestamp: number;
}

export interface SendVerificationOptions {
  displayName?: string;
  expiresInMinutes?: number;
  useQueue?: boolean;
}

export interface SendPasswordResetOptions {
  displayName?: string;
  expiresInMinutes?: number;
  useQueue?: boolean;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  category?: EmailDeliveryResult['category'];
  useQueue?: boolean;
}

export class EmailService {
  private provider: EmailProvider;
  private queue: EmailQueueService;

  constructor(customProvider?: EmailProvider, customQueue?: EmailQueueService) {
    this.provider = customProvider || emailProvider;
    this.queue = customQueue || emailQueueService;
  }

  /**
   * 遮蔽電子郵件地址以保護日誌隱私 (s***t@example.com)
   */
  public maskEmail(email: string): string {
    return this.queue.maskEmail(email);
  }

  /**
   * 設定或切換發信 Provider (用於單元測試隔離)
   */
  public setProvider(newProvider: EmailProvider): void {
    this.provider = newProvider;
  }

  /**
   * 取得當前 Provider
   */
  public getProvider(): EmailProvider {
    return this.provider;
  }

  /**
   * 取得內部佇列服務
   */
  public getQueue(): EmailQueueService {
    return this.queue;
  }

  /**
   * 驗證電子信箱格式基本有效性
   */
  public isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /**
   * 1. 寄送帳號註冊驗證郵件 (P10-EML-005)
   */
  public async sendVerificationEmail(
    email: string,
    rawToken: string,
    displayName?: string,
    options?: SendVerificationOptions
  ): Promise<EmailDeliveryResult> {
    const category = 'verification';

    // 0. 驗證 Email 格式
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: this.maskEmail(email || ''),
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'INVALID_INPUT: Invalid email address format.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const masked = this.maskEmail(normalizedEmail);

    // 1. 檢查退訂黑名單
    if (this.queue.isSuppressed(normalizedEmail)) {
      return {
        success: false,
        status: 'SUPPRESSED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Recipient email is in suppression list.',
      };
    }

    // 2. 檢查每日配額
    if (this.queue.isQuotaExceeded()) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'DAILY_QUOTA_EXCEEDED: Daily email quota limit reached.',
      };
    }

    // 3. 檢查 Provider 是否停用 (DisabledEmailProvider)
    if (this.provider instanceof DisabledEmailProvider) {
      return {
        success: false,
        status: 'DISABLED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Email delivery is disabled in production without configured provider.',
      };
    }

    // 3. 安全渲染雙格式模板 (HTML + Text + escapeHtml)
    let templateOutput: EmailRenderOutput;
    try {
      const baseUrl = env.CORS_ORIGIN || 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/verify?token=${encodeURIComponent(rawToken)}`;
      templateOutput = renderVerificationEmail({
        displayName: displayName || '親愛的學員',
        verificationUrl,
        expiresInMinutes: options?.expiresInMinutes || 30,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: `Template rendering failed: ${errorMsg}`,
      };
    }

    // 4. 若指定佇列模式，排入記憶體發信佇列
    if (options?.useQueue) {
      const queueRes = this.queue.enqueue({
        to: normalizedEmail,
        subject: templateOutput.subject,
        category,
        html: templateOutput.html,
        text: templateOutput.text,
      });

      if (!queueRes.success) {
        const isSuppressed = queueRes.error === 'RECIPIENT_SUPPRESSED';
        return {
          success: false,
          status: isSuppressed ? 'SUPPRESSED' : 'FAILED',
          recipientMasked: masked,
          category,
          attempts: 0,
          timestamp: Date.now(),
          error: queueRes.error || 'Enqueue rejected.',
        };
      }

      return {
        success: true,
        jobId: queueRes.jobId,
        status: 'QUEUED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
      };
    }

    // 5. 呼叫 Provider 執行發送 (支援 Console / Mock / 未來 Provider)
    try {
      const isSent = await this.provider.sendVerificationEmail(normalizedEmail, rawToken);

      // ConsoleEmailProvider 與 MockEmailProvider 安全模擬判定
      if (this.provider instanceof ConsoleEmailProvider || this.provider instanceof MockEmailProvider) {
        if (!isSent && this.provider instanceof MockEmailProvider) {
          return {
            success: false,
            status: 'FAILED',
            recipientMasked: masked,
            category,
            attempts: 1,
            timestamp: Date.now(),
            error: 'Mock provider delivery was rejected.',
          };
        }

        this.queue.recordSent();
        return {
          success: true,
          status: 'MOCKED',
          recipientMasked: masked,
          category,
          attempts: 1,
          timestamp: Date.now(),
        };
      }

      if (isSent) {
        this.queue.recordSent();
      }

      return {
        success: isSent,
        status: isSent ? 'ACCEPTED' : 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 1,
        timestamp: Date.now(),
        error: isSent ? undefined : 'Provider rejected verification email delivery.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 1,
        timestamp: Date.now(),
        error: errorMsg,
      };
    }
  }

  /**
   * 2. 寄送密碼重設郵件 (P10-EML-005)
   */
  public async sendPasswordResetEmail(
    email: string,
    rawToken: string,
    displayName?: string,
    options?: SendPasswordResetOptions
  ): Promise<EmailDeliveryResult> {
    const category = 'password_reset';

    // 0. 驗證 Email 格式
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: this.maskEmail(email || ''),
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'INVALID_INPUT: Invalid email address format.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const masked = this.maskEmail(normalizedEmail);

    if (this.queue.isSuppressed(normalizedEmail)) {
      return {
        success: false,
        status: 'SUPPRESSED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Recipient email is in suppression list.',
      };
    }

    if (this.queue.isQuotaExceeded()) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'DAILY_QUOTA_EXCEEDED: Daily email quota limit reached.',
      };
    }

    if (this.provider instanceof DisabledEmailProvider) {
      return {
        success: false,
        status: 'DISABLED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Email delivery is disabled in production without configured provider.',
      };
    }

    let templateOutput: EmailRenderOutput;
    try {
      const baseUrl = env.CORS_ORIGIN || 'http://localhost:3000';
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
      templateOutput = renderPasswordResetEmail({
        displayName: displayName || '親愛的會員',
        resetUrl,
        expiresInMinutes: options?.expiresInMinutes || 15,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: `Template rendering failed: ${errorMsg}`,
      };
    }

    if (options?.useQueue) {
      const queueRes = this.queue.enqueue({
        to: normalizedEmail,
        subject: templateOutput.subject,
        category,
        html: templateOutput.html,
        text: templateOutput.text,
      });

      if (!queueRes.success) {
        const isSuppressed = queueRes.error === 'RECIPIENT_SUPPRESSED';
        return {
          success: false,
          status: isSuppressed ? 'SUPPRESSED' : 'FAILED',
          recipientMasked: masked,
          category,
          attempts: 0,
          timestamp: Date.now(),
          error: queueRes.error || 'Enqueue rejected.',
        };
      }

      return {
        success: true,
        jobId: queueRes.jobId,
        status: 'QUEUED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
      };
    }

    try {
      const isSent = await this.provider.sendPasswordResetEmail(normalizedEmail, rawToken);

      if (this.provider instanceof ConsoleEmailProvider || this.provider instanceof MockEmailProvider) {
        if (!isSent && this.provider instanceof MockEmailProvider) {
          return {
            success: false,
            status: 'FAILED',
            recipientMasked: masked,
            category,
            attempts: 1,
            timestamp: Date.now(),
            error: 'Mock provider delivery was rejected.',
          };
        }

        this.queue.recordSent();
        return {
          success: true,
          status: 'MOCKED',
          recipientMasked: masked,
          category,
          attempts: 1,
          timestamp: Date.now(),
        };
      }

      if (isSent) {
        this.queue.recordSent();
      }

      return {
        success: isSent,
        status: isSent ? 'ACCEPTED' : 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 1,
        timestamp: Date.now(),
        error: isSent ? undefined : 'Provider rejected password reset email delivery.',
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 1,
        timestamp: Date.now(),
        error: errorMsg,
      };
    }
  }

  /**
   * 3. 寄送新裝置登入安全提醒 (P10-EML-005)
   */
  public async sendSecurityLoginAlertEmail(
    email: string,
    params: SecurityLoginAlertEmailParams,
    options?: { useQueue?: boolean }
  ): Promise<EmailDeliveryResult> {
    const category = 'security_alert';

    // 0. 驗證 Email 格式
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: this.maskEmail(email || ''),
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'INVALID_INPUT: Invalid email address format.',
      };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const masked = this.maskEmail(normalizedEmail);

    if (this.queue.isSuppressed(normalizedEmail)) {
      return {
        success: false,
        status: 'SUPPRESSED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Recipient email is in suppression list.',
      };
    }

    if (this.queue.isQuotaExceeded()) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'DAILY_QUOTA_EXCEEDED: Daily email quota limit reached.',
      };
    }

    if (this.provider instanceof DisabledEmailProvider) {
      return {
        success: false,
        status: 'DISABLED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Email delivery is disabled in production without configured provider.',
      };
    }

    let templateOutput: EmailRenderOutput;
    try {
      templateOutput = renderSecurityLoginAlertEmail(params);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: `Template rendering failed: ${errorMsg}`,
      };
    }

    if (options?.useQueue) {
      const queueRes = this.queue.enqueue({
        to: normalizedEmail,
        subject: templateOutput.subject,
        category,
        html: templateOutput.html,
        text: templateOutput.text,
      });

      const isSuppressed = queueRes.error === 'RECIPIENT_SUPPRESSED';
      return {
        success: queueRes.success,
        jobId: queueRes.jobId,
        status: queueRes.success ? 'QUEUED' : (isSuppressed ? 'SUPPRESSED' : 'FAILED'),
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: queueRes.error,
      };
    }

    // 直接發送模式 (目前無專用 API，安全返回 MOCKED)
    this.queue.recordSent();
    return {
      success: true,
      status: 'MOCKED',
      recipientMasked: masked,
      category,
      attempts: 1,
      timestamp: Date.now(),
    };
  }

  /**
   * 4. 通用自訂 Email 發送入口 (用於後續公告或測驗通知排程)
   */
  public async send(options: SendEmailOptions): Promise<EmailDeliveryResult> {
    const category = options.category || 'announcement';

    // 0. 驗證 Email 格式
    if (!this.isValidEmail(options.to)) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: this.maskEmail(options.to || ''),
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'INVALID_INPUT: Invalid email address format.',
      };
    }

    const normalizedEmail = options.to.trim().toLowerCase();
    const masked = this.maskEmail(normalizedEmail);

    if (this.queue.isSuppressed(normalizedEmail)) {
      return {
        success: false,
        status: 'SUPPRESSED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Recipient is in suppression list.',
      };
    }

    if (this.queue.isQuotaExceeded()) {
      return {
        success: false,
        status: 'FAILED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'DAILY_QUOTA_EXCEEDED: Daily email quota limit reached.',
      };
    }

    if (this.provider instanceof DisabledEmailProvider) {
      return {
        success: false,
        status: 'DISABLED',
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: 'Email service is disabled.',
      };
    }

    if (options.useQueue) {
      const queueRes = this.queue.enqueue({
        to: normalizedEmail,
        subject: options.subject,
        category,
        html: options.html,
        text: options.text,
      });

      const isSuppressed = queueRes.error === 'RECIPIENT_SUPPRESSED';
      return {
        success: queueRes.success,
        jobId: queueRes.jobId,
        status: queueRes.success ? 'QUEUED' : (isSuppressed ? 'SUPPRESSED' : 'FAILED'),
        recipientMasked: masked,
        category,
        attempts: 0,
        timestamp: Date.now(),
        error: queueRes.error,
      };
    }

    this.queue.recordSent();
    return {
      success: true,
      status: 'MOCKED',
      recipientMasked: masked,
      category,
      attempts: 1,
      timestamp: Date.now(),
    };
  }
}

export const emailService = new EmailService();
