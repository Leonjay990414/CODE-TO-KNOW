import type { Prisma } from '@prisma/client';
import { Request } from 'express';
import { prisma } from '../config/database.js';
import {
  MAX_AUDIT_COLLECTION_ITEMS,
  MAX_AUDIT_SANITIZE_DEPTH,
  MAX_AUDIT_STRING_LENGTH,
  REDACTION_FALLBACK_JSON,
  logSafeError,
  redactStringSecrets,
  sanitizeAuditDetails,
  sanitizeAuditValue,
} from './redaction.js';

export {
  MAX_AUDIT_COLLECTION_ITEMS,
  MAX_AUDIT_SANITIZE_DEPTH,
  MAX_AUDIT_STRING_LENGTH,
  redactStringSecrets,
  sanitizeAuditDetails,
  sanitizeAuditValue,
};

export interface AuditLogClient {
  auditLog: {
    create: (args: { data: Prisma.AuditLogUncheckedCreateInput }) => any;
  };
}

export interface AuditEventInput {
  action: string;
  userId?: string | null;
  details?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  req?: Request | null;
}

function serializeAuditDetails(details: unknown): string | null {
  if (details === null || details === undefined || details === '') {
    return null;
  }

  try {
    if (typeof details === 'string') {
      return sanitizeAuditDetails(details);
    }
    const sanitized = sanitizeAuditValue(details);
    if (sanitized === '[REDACTION_ERROR]') {
      return REDACTION_FALLBACK_JSON;
    }
    const json = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
    return json ?? REDACTION_FALLBACK_JSON;
  } catch {
    return REDACTION_FALLBACK_JSON;
  }
}

function buildAuditLogCreateData(input: AuditEventInput): Prisma.AuditLogUncheckedCreateInput {
  const rawIp =
    input.ipAddress ??
    (input.req
      ? (input.req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      input.req.socket?.remoteAddress ||
      null
      : null);
  const rawUserAgent =
    input.userAgent ?? (input.req ? input.req.headers['user-agent'] || null : null);

  return {
    userId: input.userId || null,
    action: input.action,
    details: serializeAuditDetails(input.details),
    ipAddress: rawIp ? redactStringSecrets(rawIp) : null,
    userAgent: rawUserAgent ? redactStringSecrets(rawUserAgent) : null,
  };
}

/**
 * Shared AuditLog write entry point enforcing fail-closed sanitization before persistence.
 *
 * - When called with a structured `AuditEventInput` (and optional Prisma transaction client),
 *   returns the underlying `PrismaPromise` directly so callers can either `await` it in standalone
 *   or interactive transactions, or include it inside batch `prisma.$transaction([...])`.
 * - Preserves legacy `(req, action, userId, details)` best-effort call signature.
 */
export function logAuditEvent(
  payload: AuditEventInput,
  client?: AuditLogClient
): Prisma.Prisma__AuditLogClient<any>;
export function logAuditEvent(
  req: Request | null,
  action: string,
  userId?: string | null,
  details?: Record<string, unknown> | string
): Promise<void>;
export function logAuditEvent(
  reqOrPayload: Request | null | AuditEventInput,
  actionOrClient?: string | AuditLogClient,
  userId?: string | null,
  details?: Record<string, unknown> | string
): Prisma.Prisma__AuditLogClient<any> | Promise<void> {
  if (
    reqOrPayload !== null &&
    typeof reqOrPayload === 'object' &&
    'action' in reqOrPayload &&
    typeof reqOrPayload.action === 'string' &&
    typeof actionOrClient !== 'string'
  ) {
    const data = buildAuditLogCreateData(reqOrPayload);
    const dbClient = actionOrClient ?? prisma;
    return dbClient.auditLog.create({ data });
  }

  const req = reqOrPayload as Request | null;
  const action = actionOrClient as string;

  return (async () => {
    try {
      const data = buildAuditLogCreateData({ req, action, userId, details });
      await prisma.auditLog.create({ data });
    } catch (error) {
      logSafeError('Failed to record audit log:', error, { action });
    }
  })();
}
