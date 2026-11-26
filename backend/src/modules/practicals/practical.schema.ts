import { z } from 'zod';

export const PracticalVersionEnum = z.enum(['VERSION_A', 'VERSION_B', 'A', 'B']);

export const GetPracticalTaskParamsSchema = z.object({
  taskId: z.string().min(1, '題組識別碼不可為空'),
});

export const GetPracticalTaskQuerySchema = z.object({
  version: PracticalVersionEnum.optional().default('VERSION_A'),
});

export const SavePracticalProgressBodySchema = z.object({
  version: PracticalVersionEnum.optional().default('VERSION_A'),
  stepId: z.string().optional(),
  isStepCompleted: z.boolean().optional(),
  completedStepNumbers: z.array(z.number().int().positive()).optional(),
  savedHtmlCode: z.string().optional(),
  savedCssCode: z.string().optional(),
  savedJsCode: z.string().optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

export type SavePracticalProgressBody = z.infer<typeof SavePracticalProgressBodySchema>;
