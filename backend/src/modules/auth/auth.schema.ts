import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('請提供有效的電子郵件地址').max(255),
  password: z
    .string()
    .min(8, '密碼長度至少需 8 個字元')
    .max(100, '密碼長度不得超過 100 個字元')
    .regex(/[A-Za-z]/, '密碼必須包含至少一個英文字母')
    .regex(/[0-9]/, '密碼必須包含至少一個數字'),
  displayName: z
    .string()
    .min(2, '顯示名稱至少需 2 個字元')
    .max(50, '顯示名稱長度不得超過 50 個字元')
    .trim(),
});

export const loginSchema = z.object({
  email: z.string().email('請提供有效的電子郵件地址'),
  password: z.string().min(1, '請輸入密碼'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, '驗證 Token 不得為空'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('請提供有效的電子郵件地址'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, '重設 Token 不得為空'),
  newPassword: z
    .string()
    .min(8, '密碼長度至少需 8 個字元')
    .max(100, '密碼長度不得超過 100 個字元')
    .regex(/[A-Za-z]/, '密碼必須包含至少一個英文字母')
    .regex(/[0-9]/, '密碼必須包含至少一個數字'),
});

export const updateProfileSchema = z.object({
  nickname: z.string().trim().max(50, '暱稱長度不得超過 50 個字元').optional().nullable(),
  timezone: z.string().trim().max(50, '時區長度不得超過 50 個字元').optional().nullable(),
  language: z.string().trim().max(20, '語系長度不得超過 20 個字元').optional().nullable(),
  educationLevel: z.string().trim().max(50, '教育程度長度不得超過 50 個字元').optional().nullable(),
  bio: z.string().trim().max(500, '個人自介長度不得超過 500 個字元').optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '請輸入目前密碼'),
  newPassword: z
    .string()
    .min(8, '新密碼長度至少需 8 個字元')
    .max(100, '新密碼長度不得超過 100 個字元')
    .regex(/[A-Za-z]/, '新密碼必須包含至少一個英文字母')
    .regex(/[0-9]/, '新密碼必須包含至少一個數字'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
