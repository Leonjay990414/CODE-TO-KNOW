import { z } from 'zod';

export const applyTeacherSchema = z.object({
  schoolName: z
    .string()
    .min(2, '任教學校/機構名稱至少需 2 個字元')
    .max(100, '學校名稱長度不得超過 100 個字元')
    .trim(),
  subject: z
    .string()
    .min(2, '任教學科或專長至少需 2 個字元')
    .max(100, '學科名稱長度不得超過 100 個字元')
    .trim(),
  reason: z
    .string()
    .min(10, '申請說明至少需 10 個字元，請簡要說明您的教學背景與平台使用目的')
    .max(1000, '申請說明不得超過 1000 個字元')
    .trim(),
  proofUrl: z.string().url('證明連結格式不正確').optional().or(z.literal('')),
});

export type ApplyTeacherInput = z.infer<typeof applyTeacherSchema>;
