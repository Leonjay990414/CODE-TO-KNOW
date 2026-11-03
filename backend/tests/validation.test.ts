import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.schema.js';
import { applyTeacherSchema } from '../src/modules/teachers/teacher.schema.js';

describe('Validation Schemas (Zod)', () => {
  describe('User Registration Schema', () => {
    it('should accept valid registration inputs', () => {
      const valid = {
        email: 'student@example.edu',
        password: 'Password123',
        displayName: '測試學生',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email formats', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'Password123',
        displayName: '測試學生',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('請提供有效的電子郵件地址');
      }
    });

    it('should reject passwords that lack numbers', () => {
      const invalid = {
        email: 'student@example.edu',
        password: 'NoNumbersHere',
        displayName: '測試學生',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('至少一個數字'))).toBe(true);
      }
    });

    it('should reject passwords that lack letters', () => {
      const invalid = {
        email: 'student@example.edu',
        password: '1234567890',
        displayName: '測試學生',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('至少一個英文字母'))).toBe(true);
      }
    });

    it('should reject passwords shorter than 8 characters', () => {
      const invalid = {
        email: 'student@example.edu',
        password: 'P123',
        displayName: '測試學生',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should defend against role=ADMIN privilege escalation attack by ignoring unmodeled role field', () => {
      const malicious = {
        email: 'attacker@example.edu',
        password: 'Password123',
        displayName: '攻擊者',
        role: 'ADMIN',
      };
      const result = registerSchema.safeParse(malicious);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).role).toBeUndefined();
      }
    });

    it('should defend against role=TEACHER privilege escalation attack by ignoring unmodeled role field', () => {
      const malicious = {
        email: 'attacker@example.edu',
        password: 'Password123',
        displayName: '偽裝教師',
        role: 'TEACHER',
        isTeacher: true,
      };
      const result = registerSchema.safeParse(malicious);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).role).toBeUndefined();
        expect((result.data as Record<string, unknown>).isTeacher).toBeUndefined();
      }
    });

    it('should defend against isAdmin boolean flag injection', () => {
      const malicious = {
        email: 'attacker@example.edu',
        password: 'Password123',
        displayName: '攻擊者',
        isAdmin: true,
      };
      const result = registerSchema.safeParse(malicious);
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as Record<string, unknown>).isAdmin).toBeUndefined();
      }
    });
  });

  describe('User Login Schema', () => {
    it('should validate email and password presence', () => {
      expect(loginSchema.safeParse({ email: 'valid@edu.tw', password: 'Password123' }).success).toBe(true);
      expect(loginSchema.safeParse({ email: 'bad-email', password: 'Password123' }).success).toBe(false);
      expect(loginSchema.safeParse({ email: 'valid@edu.tw', password: '' }).success).toBe(false);
    });
  });

  describe('Teacher Application Schema', () => {
    it('should accept valid teacher applications', () => {
      const valid = {
        schoolName: '台北市立資訊科技高中',
        subject: '人工智慧與資訊科學',
        reason: '申請於課堂上導入碼上學平台，帶領高二學生進行 Python 與演算法實作教學。',
        proofUrl: 'https://school.edu.tw/faculty/teacher1',
      };
      expect(applyTeacherSchema.safeParse(valid).success).toBe(true);
    });

    it('should reject reasons that are too brief (< 10 chars)', () => {
      const invalid = {
        schoolName: '中學',
        subject: '資訊',
        reason: '想當老師',
      };
      const result = applyTeacherSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('至少需 10 個字元'))).toBe(true);
      }
    });

    it('should reject invalid proof URL', () => {
      const invalid = {
        schoolName: '資訊高中',
        subject: '程式設計',
        reason: '需要課堂題庫進行測驗與追蹤學習狀況。',
        proofUrl: 'not-a-valid-url',
      };
      const result = applyTeacherSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.message.includes('證明連結格式不正確'))).toBe(true);
      }
    });
  });
});
