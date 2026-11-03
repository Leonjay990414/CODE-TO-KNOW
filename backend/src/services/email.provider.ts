import { env } from '../config/env.js';

export interface EmailProvider {
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
}

export class ConsoleEmailProvider implements EmailProvider {
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const link = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    console.log(`\n📧 [EMAIL MOCK / DEV] 驗證信發送給: ${email}`);
    console.log(`🔗 驗證連結: ${link}`);
    console.log(`🔑 驗證 Token: ${token}\n`);
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log(`\n📧 [EMAIL MOCK / DEV] 密碼重設信發送給: ${email}`);
    console.log(`🔗 重設連結: ${link}`);
    console.log(`🔑 重設 Token: ${token}\n`);
    return true;
  }
}

export class ProductionEmailProvider implements EmailProvider {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn(`⚠️ [SMTP NOT CONFIGURED] 未配置正式 SMTP 伺服器，略過實際信件寄送 (${email})。`);
      return false;
    }
    // Future: Nodemailer or AWS SES integration
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn(`⚠️ [SMTP NOT CONFIGURED] 未配置正式 SMTP 伺服器，略過實際信件寄送 (${email})。`);
      return false;
    }
    // Future: Nodemailer or AWS SES integration
    return true;
  }
}

export const emailProvider: EmailProvider =
  env.NODE_ENV === 'production' && process.env.SMTP_HOST
    ? new ProductionEmailProvider()
    : new ConsoleEmailProvider();
