import { z } from 'zod';
import { validateJoinCodeFormat, normalizeJoinCode } from '../../utils/joinCode.js';

export const createClassroomSchema = z.object({
  name: z.string().min(1, '班級名稱不能為空').max(100, '班級名稱長度上限 100 字元'),
  description: z.string().max(500, '班級說明長度上限 500 字元').optional().nullable(),
  certificationId: z.string().min(1, '證照科目代碼不能為空'),
});

export const joinClassroomSchema = z.object({
  joinCode: z
    .string()
    .min(1, '班級邀請碼不能為空')
    .refine((val) => validateJoinCodeFormat(normalizeJoinCode(val)), {
      message: '邀請碼格式不正確，應為 8 碼英數字（排除易混淆字元 0/O/1/I/L）',
    }),
  seatNumber: z.string().max(20, '座號上限 20 字元').optional().nullable(),
});

export const classroomIdParamSchema = z.object({
  id: z.string().min(1, '班級 ID 不能為空'),
});

export const removeMemberParamSchema = z.object({
  id: z.string().min(1, '班級 ID 不能為空'),
  studentId: z.string().min(1, '學生 ID 不能為空'),
});

export const studentProgressParamSchema = z.object({
  id: z.string().min(1, '班級 ID 不能為空'),
  studentId: z.string().min(1, '學生 ID 不能為空'),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type JoinClassroomInput = z.infer<typeof joinClassroomSchema>;
