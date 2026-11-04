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

import { env } from '../config/env.js';

export const emailProvider: EmailProvider =
  env.NODE_ENV === 'production'
    ? new DisabledEmailProvider()
    : new ConsoleEmailProvider();
