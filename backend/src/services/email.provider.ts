export interface EmailProvider {
  sendVerificationEmail(email: string, token: string): Promise<boolean>;
  sendPasswordResetEmail(email: string, token: string): Promise<boolean>;
}

/**
 * Development-only mock provider.
 * Never logs email addresses, verification links, or raw tokens.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendVerificationEmail(
    _email: string,
    _token: string
  ): Promise<boolean> {
    console.info('[EMAIL MOCK] Verification email is not actually sent.');
    return false;
  }

  async sendPasswordResetEmail(
    _email: string,
    _token: string
  ): Promise<boolean> {
    console.info('[EMAIL MOCK] Password reset email is not actually sent.');
    return false;
  }
}

/**
 * Production provider.
 * Email delivery remains disabled until a real provider is implemented.
 */
export class DisabledEmailProvider implements EmailProvider {
  async sendVerificationEmail(
    _email: string,
    _token: string
  ): Promise<boolean> {
    console.warn('[EMAIL DISABLED] Verification email service is unavailable.');
    return false;
  }

  async sendPasswordResetEmail(
    _email: string,
    _token: string
  ): Promise<boolean> {
    console.warn('[EMAIL DISABLED] Password reset email service is unavailable.');
    return false;
  }
}

/**
 * Test & isolated mock provider.
 * Allows simulating success, failures, rejections and tracking dispatched mock emails.
 * Never connects to external network.
 */
export class MockEmailProvider implements EmailProvider {
  public sentMails: { email: string; token: string; type: 'verification' | 'password_reset' }[] = [];
  public shouldSucceed: boolean = true;
  public simulateDelayMs: number = 0;
  public failureError?: Error;

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    if (this.simulateDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.simulateDelayMs));
    }
    if (this.failureError) {
      throw this.failureError;
    }
    if (!this.shouldSucceed) {
      return false;
    }
    this.sentMails.push({ email, token, type: 'verification' });
    return true;
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    if (this.simulateDelayMs > 0) {
      await new Promise((r) => setTimeout(r, this.simulateDelayMs));
    }
    if (this.failureError) {
      throw this.failureError;
    }
    if (!this.shouldSucceed) {
      return false;
    }
    this.sentMails.push({ email, token, type: 'password_reset' });
    return true;
  }

  clear(): void {
    this.sentMails = [];
    this.shouldSucceed = true;
    this.simulateDelayMs = 0;
    this.failureError = undefined;
  }
}

import { env } from '../config/env.js';

export const emailProvider: EmailProvider =
  env.NODE_ENV === 'production'
    ? new DisabledEmailProvider()
    : new ConsoleEmailProvider();
