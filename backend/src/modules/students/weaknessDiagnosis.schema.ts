import { z } from 'zod';

export const WeaknessStatusEnum = z.enum([
  'CRITICAL_WEAKNESS',
  'MODERATE_WEAKNESS',
  'STEADY_PROGRESS',
  'EXCELLENT_MASTERY',
  'INSUFFICIENT_DATA',
  'NO_DATA',
]);
export type WeaknessStatus = z.infer<typeof WeaknessStatusEnum>;

export const ActionTypeEnum = z.enum([
  'TARGETED_PRACTICE',
  'EXPLORE_CHAPTER',
  'GENERAL_REVIEW',
  'MOCK_EXAM_SPRINT',
]);
export type ActionType = z.infer<typeof ActionTypeEnum>;

export const WeaknessTagsPayloadSchema = z.object({
  version: z.literal('1.0'),
  status: WeaknessStatusEnum,
  weaknessIndex: z.number().min(0).max(100),
  sampleSize: z.number().int().nonnegative(),
  accuracyRate: z.number().min(0).max(1),
  unresolvedCount: z.number().int().nonnegative(),
  reviewingCount: z.number().int().nonnegative(),
  masteredCount: z.number().int().nonnegative(),
  recentWrongCount: z.number().nonnegative(),
  dataWatermark: z.string().datetime(),
  calculatedAt: z.string().datetime(),
  recalcFailureCount: z.number().int().nonnegative().optional(),
  lastFailedAt: z.string().datetime().nullable().optional(),
});
export type WeaknessTagsPayload = z.infer<typeof WeaknessTagsPayloadSchema>;

export const SuggestedActionPayloadSchema = z.object({
  version: z.literal('1.0'),
  actionType: ActionTypeEnum,
  targetSubjectCode: z.string(),
  targetQuestionCount: z.number().int().positive(),
  rationaleZh: z.string(),
  objectiveZh: z.string(),
});
export type SuggestedActionPayload = z.infer<typeof SuggestedActionPayloadSchema>;

export const RecalculateWeaknessQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
});
export type RecalculateWeaknessQuery = z.infer<typeof RecalculateWeaknessQuerySchema>;

/**
 * Safely parses weaknessTags JSON text into a typed WeaknessTagsPayload.
 * Returns null if parsing fails or payload does not conform to schema.
 */
export function safeParseWeaknessTags(raw: string | null | undefined): WeaknessTagsPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = WeaknessTagsPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Safely parses suggestedAction JSON text into a typed SuggestedActionPayload.
 * Returns null if parsing fails or payload does not conform to schema.
 */
export function safeParseSuggestedAction(raw: string | null | undefined): SuggestedActionPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const result = SuggestedActionPayloadSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
