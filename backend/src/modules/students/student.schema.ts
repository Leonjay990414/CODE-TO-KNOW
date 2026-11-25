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
