import { z } from 'zod';

export const GetQuestionsQuerySchema = z.object({
  certificationCode: z.string().optional().default('17300'),
  subjectCode: z.string().optional(),
  workItem: z.enum(['01', '02', '03', '04']).optional(),
  section: z.enum(['01', '02', '03', '04']).optional(),
  questionType: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(700).optional().default(50),
  random: z.coerce.boolean().optional().default(false),
});

export type GetQuestionsQuery = z.infer<typeof GetQuestionsQuerySchema>;

export const QuestionIdParamSchema = z.object({
  id: z.string().uuid('Question ID must be a valid UUID'),
});

export type QuestionIdParam = z.infer<typeof QuestionIdParamSchema>;
