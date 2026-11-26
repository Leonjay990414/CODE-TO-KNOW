import { z } from 'zod';

export const GetWrongQuestionsQuerySchema = z.object({
  status: z.enum(['UNRESOLVED', 'REVIEWING', 'MASTERED', 'ALL']).optional().default('ALL'),
  section: z.enum(['01', '02', '03', '04']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type GetWrongQuestionsQuery = z.infer<typeof GetWrongQuestionsQuerySchema>;

export const PracticeWrongQuestionInputSchema = z.object({
  answer: z.string().min(1, '作答答案不可為空').max(10),
});

export type PracticeWrongQuestionInput = z.infer<typeof PracticeWrongQuestionInputSchema>;

export const WrongQuestionIdParamSchema = z.object({
  id: z.string().min(1, '錯題紀錄識別碼不可為空'),
});

export type WrongQuestionIdParam = z.infer<typeof WrongQuestionIdParamSchema>;

export const RecordWrongQuestionInputSchema = z
  .object({
    questionId: z.string().uuid('題目 ID 必須為有效的 UUID'),
    selectedAnswer: z.string().trim().max(10).optional(),
    source: z.enum(['THEORY_PRACTICE', 'MOCK_EXAM', 'MANUAL']).default('THEORY_PRACTICE'),
  })
  .strict();

export type RecordWrongQuestionInput = z.infer<typeof RecordWrongQuestionInputSchema>;

