import { NextFunction, Request, Response } from 'express';
import { expandCompatibleRoles } from '../middleware/authorize.js';
import { ForbiddenError, UnauthorizedError } from './errors.js';

export interface OwnershipActor {
  id: string;
  roles: string[];
}

export interface OwnershipScopeOptions {
  /**
   * Explicitly allow ADMIN / PLATFORM_ADMIN override on this operation.
   * Defaults to false so routes remain fail-closed unless an override is explicitly intended.
   * Note: SYSTEM_OPERATOR is intentionally excluded from user-data ownership overrides.
   */
  allowAdminOverride?: boolean;
  /** Human-readable resource label for error messages (never includes internal IDs). */
  resourceName?: string;
}

export type ModelOwnershipStrategy =
  | 'USER_SELF'
  | 'DIRECT_USER_ID'
  | 'NESTED_PARENT'
  | 'TEACHER_OR_ENROLLED'
  | 'ADMIN_ONLY'
  | 'ADMIN_MANAGED_CATALOG';

export interface ModelOwnershipEntry {
  model: string;
  strategy: ModelOwnershipStrategy;
  ownerFieldOrPath: string;
  adminOverride: string;
  apiStatus: 'IMPLEMENTED' | 'NOT_IMPLEMENTED';
  notes: string;
}

/**
 * Exhaustive ownership & access-scope inventory for all 36 Prisma models in backend/prisma/schema.prisma.
 * Avoids assuming every table has a direct `userId` column and records explicit API implementation state.
 */
export const PRISMA_MODEL_OWNERSHIP_INVENTORY: readonly ModelOwnershipEntry[] = [
  // 1. Core Identity & Security (9 Models)
  { model: 'User', strategy: 'USER_SELF', ownerFieldOrPath: 'id', adminOverride: 'ADMIN / PLATFORM_ADMIN (read/moderate only)', apiStatus: 'IMPLEMENTED', notes: 'Auth endpoints resolve actor strictly via req.user.id' },
  { model: 'Role', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'N/A (catalog)', adminOverride: 'ADMIN / PLATFORM_ADMIN manage; System assign-on-register', apiStatus: 'IMPLEMENTED', notes: 'Static RBAC lookup table; no user owner' },
  { model: 'UserRole', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN / PLATFORM_ADMIN approve TEACHER role', apiStatus: 'IMPLEMENTED', notes: 'Read own via /api/auth/me; client body role ignored' },
  { model: 'UserProfile', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN read support', apiStatus: 'IMPLEMENTED', notes: 'Created during registration; future edit routes must bind req.user.id' },
  { model: 'Session', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN revoke/audit only', apiStatus: 'IMPLEMENTED', notes: 'Token hash verified server-side; logout/reset revokes req.user.id sessions' },
  { model: 'TeacherApplication', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN / PLATFORM_ADMIN list & review (/api/admin/teacher-applications)', apiStatus: 'IMPLEMENTED', notes: 'Users submit/read own via /api/teachers/*; admin reviews by UUID :id' },
  { model: 'EmailVerificationToken', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'None (token-possession + active account status check)', apiStatus: 'IMPLEMENTED', notes: 'AuthService.verifyEmail verifies token hash + user deletedAt/status' },
  { model: 'PasswordResetToken', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'None (token-possession + ACTIVE account status check)', apiStatus: 'IMPLEMENTED', notes: 'AuthService.resetPassword verifies token hash + user deletedAt/status' },
  { model: 'AuditLog', strategy: 'ADMIN_ONLY', ownerFieldOrPath: 'userId (nullable actor ref)', adminOverride: 'ADMIN / PLATFORM_ADMIN read-only via /api/admin/audit-logs', apiStatus: 'IMPLEMENTED', notes: 'Append-only (app_runtime SELECT+INSERT only); details redacted' },

  // 2. Announcements (2 Models)
  { model: 'Announcement', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'authorId (for management)', adminOverride: 'ADMIN / PLATFORM_ADMIN publish/manage; public/auth read PUBLISHED', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'AnnouncementRead', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN read aggregate', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },

  // 3. Certifications & Question Bank (6 Models)
  { model: 'Certification', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'N/A (public catalog)', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'Subject', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'certificationId -> Certification', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'Question', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'subjectId -> Subject', adminOverride: 'ADMIN / PLATFORM_ADMIN write; hide correctAnswer during live exam', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'QuestionOption', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'questionId -> Question', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'QuestionTag', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'N/A (catalog)', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'QuestionTagRelation', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'questionId -> Question', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },

  // 4. Student Learning Progress (5 Models)
  { model: 'CertificationEnrollment', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'UnitProgress', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'WrongQuestionRecord', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'QuestionBookmark', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'StudyTimeLog', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },

  // 5. Teacher & Class Management (4 Models)
  { model: 'TeacherProfile', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN / PLATFORM_ADMIN moderate', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'Class', strategy: 'TEACHER_OR_ENROLLED', ownerFieldOrPath: 'creatorId (write) / enrollments[].studentId (read)', adminOverride: 'ADMIN / PLATFORM_ADMIN full override', apiStatus: 'NOT_IMPLEMENTED', notes: 'Uses creatorId instead of userId; no HTTP module implemented yet' },
  { model: 'ClassEnrollment', strategy: 'TEACHER_OR_ENROLLED', ownerFieldOrPath: 'studentId OR class.creatorId', adminOverride: 'ADMIN / PLATFORM_ADMIN full override', apiStatus: 'NOT_IMPLEMENTED', notes: 'Uses studentId & parent Class.creatorId; no HTTP module implemented yet' },
  { model: 'ClassAssignment', strategy: 'NESTED_PARENT', ownerFieldOrPath: 'class.creatorId (write) / class.enrollments[].studentId (read)', adminOverride: 'ADMIN / PLATFORM_ADMIN full override', apiStatus: 'NOT_IMPLEMENTED', notes: 'No direct userId; scoped via Class; no HTTP module implemented yet' },

  // 6. Practical Exam System (4 Models)
  { model: 'PracticalTask', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'N/A (public catalog)', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'PracticalStep', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'taskId -> PracticalTask', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'PracticalProgress', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN / class teacher read-only view if enrolled', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'PracticalStepProgress', strategy: 'NESTED_PARENT', ownerFieldOrPath: 'progress.userId (via PracticalProgress)', adminOverride: 'Optional ADMIN support read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No direct userId; owned via progressId -> PracticalProgress.userId' },

  // 7. Mock Exam System (3 Models)
  { model: 'ExamPaper', strategy: 'ADMIN_MANAGED_CATALOG', ownerFieldOrPath: 'N/A (catalog)', adminOverride: 'ADMIN / PLATFORM_ADMIN write', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'ExamAttempt', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN / class teacher read-only review', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'ExamAnswerSnapshot', strategy: 'NESTED_PARENT', ownerFieldOrPath: 'attempt.userId (via ExamAttempt)', adminOverride: 'Optional ADMIN / class teacher read-only review', apiStatus: 'NOT_IMPLEMENTED', notes: 'No direct userId; owned via attemptId -> ExamAttempt.userId' },

  // 8. AI Coach & Scaffolding (3 Models)
  { model: 'AIChatSession', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'Optional ADMIN moderation read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
  { model: 'AIChatMessage', strategy: 'NESTED_PARENT', ownerFieldOrPath: 'session.userId (via AIChatSession)', adminOverride: 'Optional ADMIN moderation read', apiStatus: 'NOT_IMPLEMENTED', notes: 'No direct userId; owned via sessionId -> AIChatSession.userId' },
  { model: 'StudentWeaknessAnalysis', strategy: 'DIRECT_USER_ID', ownerFieldOrPath: 'userId', adminOverride: 'ADMIN / class teacher authorized analytics', apiStatus: 'NOT_IMPLEMENTED', notes: 'No HTTP module implemented yet' },
] as const;

const ADMIN_OVERRIDE_ROLES = expandCompatibleRoles(['ADMIN']);

/**
 * Checks whether the actor has an administrative override role (ADMIN or PLATFORM_ADMIN).
 * SYSTEM_OPERATOR is intentionally excluded from educational/student data overrides.
 */
export function hasAdminOverrideRole(roles: readonly string[] = []): boolean {
  return roles.some((role) => ADMIN_OVERRIDE_ROLES.includes(role));
}

/**
 * Extracts authenticated actor identity from Express Request or fails closed with 401.
 */
export function requireActor(req: Request): OwnershipActor {
  if (!req.user?.id) {
    throw new UnauthorizedError('請先登入以存取此資源', 'UNAUTHENTICATED');
  }
  return {
    id: req.user.id,
    roles: Array.isArray(req.user.roles) ? req.user.roles : [],
  };
}

/**
 * Resolves the authoritative owner userId for an operation.
 * Client-supplied `requestedTargetUserId` (body/query) is NEVER trusted as authorization:
 * if provided and different from `actor.id`, it is rejected with 403 unless `allowAdminOverride`
 * is explicitly enabled AND the actor holds an ADMIN / PLATFORM_ADMIN role.
 */
export function resolveScopedUserId(
  actor: OwnershipActor,
  requestedTargetUserId?: unknown,
  options: OwnershipScopeOptions = {}
): string {
  const { allowAdminOverride = false, resourceName = '資源' } = options;

  if (requestedTargetUserId === undefined || requestedTargetUserId === null || requestedTargetUserId === '') {
    return actor.id;
  }

  if (typeof requestedTargetUserId !== 'string' || !requestedTargetUserId.trim()) {
    throw new ForbiddenError(`無權以無效識別碼存取${resourceName}`, 'OWNERSHIP_FORBIDDEN');
  }

  const normalizedTarget = requestedTargetUserId.trim();
  if (normalizedTarget === actor.id) {
    return actor.id;
  }

  if (allowAdminOverride && hasAdminOverrideRole(actor.roles)) {
    return normalizedTarget;
  }

  throw new ForbiddenError(
    `禁止跨帳號指定或存取其他使用者的${resourceName}`,
    'OWNERSHIP_FORBIDDEN'
  );
}

/**
 * Verifies ownership of a loaded record against `actor.id` (or explicit admin override).
 * Fail-closed when `ownerUserId` is null or undefined.
 */
export function assertResourceOwnership(
  actor: OwnershipActor,
  ownerUserId: string | null | undefined,
  options: OwnershipScopeOptions = {}
): void {
  const { allowAdminOverride = false, resourceName = '資源' } = options;

  if (!ownerUserId) {
    throw new ForbiddenError(`無權存取未歸屬或受限的${resourceName}`, 'OWNERSHIP_FORBIDDEN');
  }

  if (ownerUserId === actor.id) {
    return;
  }

  if (allowAdminOverride && hasAdminOverrideRole(actor.roles)) {
    return;
  }

  throw new ForbiddenError(`無權存取或操作其他使用者的${resourceName}`, 'OWNERSHIP_FORBIDDEN');
}

/**
 * Verifies ownership for nested/parent-scoped models without a direct `userId` column
 * (e.g., ExamAnswerSnapshot -> ExamAttempt.userId, ClassAssignment -> Class.creatorId).
 */
export async function assertNestedOwnership(
  actor: OwnershipActor,
  resolvePermittedOwnerIds: () => Promise<string | readonly string[] | null | undefined>,
  options: OwnershipScopeOptions = {}
): Promise<void> {
  const { allowAdminOverride = false, resourceName = '關聯資源' } = options;

  if (allowAdminOverride && hasAdminOverrideRole(actor.roles)) {
    const resolved = await resolvePermittedOwnerIds();
    const list = Array.isArray(resolved) ? resolved : resolved ? [resolved] : [];
    if (list.length > 0) {
      return;
    }
    throw new ForbiddenError(`無權存取未歸屬或不存在的${resourceName}`, 'OWNERSHIP_FORBIDDEN');
  }

  const resolved = await resolvePermittedOwnerIds();
  const permittedIds = Array.isArray(resolved)
    ? resolved
    : typeof resolved === 'string' && resolved
      ? [resolved]
      : [];

  if (!permittedIds.includes(actor.id)) {
    throw new ForbiddenError(`無權存取或操作其他使用者的${resourceName}`, 'OWNERSHIP_FORBIDDEN');
  }
}

/**
 * Builds a Prisma `where` clause enforcing ownership via `[ownerField] = actor.id`,
 * unless explicit admin override is enabled and held by the actor.
 */
export function buildOwnedWhere<
  TWhere extends Record<string, unknown>,
  TField extends string = 'userId',
>(
  actor: OwnershipActor,
  baseWhere: TWhere,
  ownerField: TField = 'userId' as TField,
  options: OwnershipScopeOptions = {}
): TWhere & Record<string, unknown> {
  const { allowAdminOverride = false, resourceName = '資源' } = options;
  const requestedOwner = baseWhere[ownerField];

  if (requestedOwner !== undefined) {
    const targetOwnerId = resolveScopedUserId(actor, requestedOwner, {
      allowAdminOverride,
      resourceName,
    });
    return {
      ...baseWhere,
      [ownerField]: targetOwnerId,
    };
  }

  if (allowAdminOverride && hasAdminOverrideRole(actor.roles)) {
    return { ...baseWhere };
  }

  return {
    ...baseWhere,
    [ownerField]: actor.id,
  };
}

/**
 * Express middleware that blocks IDOR attempts supplying mismatched owner fields
 * (such as `userId`, `creatorId`, `studentId`, `authorId`) in request body or query.
 */
export function rejectForgedOwnerFields(
  fields: readonly string[] = ['userId'],
  options: OwnershipScopeOptions = {}
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const actor = requireActor(req);
      const sources: Array<Record<string, unknown> | undefined> = [
        req.body && typeof req.body === 'object' ? (req.body as Record<string, unknown>) : undefined,
        req.query && typeof req.query === 'object' ? (req.query as Record<string, unknown>) : undefined,
      ];

      for (const source of sources) {
        if (!source) continue;
        for (const field of fields) {
          if (Object.prototype.hasOwnProperty.call(source, field) && source[field] !== undefined) {
            resolveScopedUserId(actor, source[field], options);
          }
        }
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
