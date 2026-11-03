import { z } from 'zod';

export const reviewApplicationSchema = z.object({
  reviewNote: z.string().max(500, '審核備註長度不得超過 500 個字元').optional(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
});

export const applicationIdParamSchema = z.object({
  id: z.string().uuid('申請識別碼格式不正確'),
});

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
