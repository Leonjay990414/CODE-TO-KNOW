import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export async function hashPassword(plainText: string): Promise<string> {
  const rounds = env.NODE_ENV === 'test' ? 10 : env.BCRYPT_ROUNDS;
  return bcrypt.hash(plainText, rounds);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: '密碼長度至少需 8 個字元' };
  }
  if (!/[A-Za-z]/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個英文字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密碼必須包含至少一個數字' };
  }
  return { valid: true };
}
