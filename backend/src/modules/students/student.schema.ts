import { z } from 'zod';

export const updateStudentProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, '暱稱長度至少 2 個字元')
      .max(50, '暱稱長度不得超過 50 個字元')
      .optional(),
    avatarUrl: z
      .string()
      .url('請輸入有效的頭像網址')
      .max(500, '網址長度過長')
      .nullable()
      .optional(),
    bio: z
      .string()
      .trim()
      .max(500, '自我介紹長度不得超過 500 個字元')
      .nullable()
      .optional(),
  })
  .strict();

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

export const recordStudyTimeSchema = z
  .object({
    durationSeconds: z
      .number()
      .int('研讀秒數必須為整數')
      .min(1, '研讀秒數至少為 1 秒')
      .max(7200, '單次研讀回報秒數不得超過 7200 秒 (2小時)'),
    moduleType: z.enum(['THEORY', 'PRACTICAL', 'MOCK_EXAM', 'AI_COACH']).default('THEORY'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, '研讀日期格式必須為 YYYY-MM-DD')
      .optional(),
  })
  .strict();

export type RecordStudyTimeInput = z.infer<typeof recordStudyTimeSchema>;

