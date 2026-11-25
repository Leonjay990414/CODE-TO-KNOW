import { z } from 'zod';

export const GenerateExamInputSchema = z.object({
  mode: z.enum(['official_100', 'practice_60']).optional().default('official_100'),
  strategy: z.enum(['stratified', 'random']).optional().default('stratified'),
  certificationCode: z.string().optional().default('17300'),
});

export type GenerateExamInput = z.infer<typeof GenerateExamInputSchema>;

export const SubmitExamInputSchema = z.object({
  answers: z.record(z.string(), z.string().max(10)),
  durationSeconds: z.number().int().nonnegative().optional(),
});

export type SubmitExamInput = z.infer<typeof SubmitExamInputSchema>;

export const ExamAttemptIdParamSchema = z.object({
  id: z.string().min(1, '測驗識別碼不可為空'),
});

export type ExamAttemptIdParam = z.infer<typeof ExamAttemptIdParamSchema>;
