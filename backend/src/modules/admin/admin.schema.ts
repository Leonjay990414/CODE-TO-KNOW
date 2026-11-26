import { z } from 'zod';

const MAX_PAGE = 10000;
export const MAX_ADMIN_PAGE_LIMIT = 100;

function createPositiveIntQuerySchema(
  defaultValue: number,
  maxValue: number,
  fieldLabel: string
) {
  return z
    .string({ invalid_type_error: `${fieldLabel} 參數格式不正確` })
    .regex(/^\d+$/, `${fieldLabel} 必須為正整數`)
    .transform((v) => parseInt(v, 10))
    .pipe(
      z
        .number()
        .int(`${fieldLabel} 必須為整數`)
        .min(1, `${fieldLabel} 不得小於 1`)
        .max(maxValue, `${fieldLabel} 不得超過 ${maxValue}`)
    )
    .optional()
    .transform((v) => v ?? defaultValue);
}

export const reviewApplicationSchema = z.object({
  reviewNote: z.string().max(500, '審核備註長度不得超過 500 個字元').optional(),
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: createPositiveIntQuerySchema(1, MAX_PAGE, 'page'),
  limit: createPositiveIntQuerySchema(20, MAX_ADMIN_PAGE_LIMIT, 'limit'),
});

export const listAuditLogsQuerySchema = z.object({
  page: createPositiveIntQuerySchema(1, MAX_PAGE, 'page'),
  limit: createPositiveIntQuerySchema(50, MAX_ADMIN_PAGE_LIMIT, 'limit'),
});

export const applicationIdParamSchema = z.object({
  id: z.string().uuid('申請識別碼格式不正確'),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, '使用者識別碼格式不正確'),
});

export const listUsersQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DISABLED']).optional(),
  page: createPositiveIntQuerySchema(1, MAX_PAGE, 'page'),
  limit: createPositiveIntQuerySchema(20, MAX_ADMIN_PAGE_LIMIT, 'limit'),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED'], {
    errorMap: () => ({ message: '帳號狀態值無效' }),
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'], {
    errorMap: () => ({ message: '角色名稱無效' }),
  }),
  action: z.enum(['grant', 'revoke'], {
    errorMap: () => ({ message: '操作必須為 grant 或 revoke' }),
  }),
});

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
