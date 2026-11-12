import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockAuditState = {
  users: new Map<string, any>(),
  applications: new Map<string, any>(),
  emailTokens: new Map<string, any>(),
  resetTokens: new Map<string, any>(),
  sessions: new Map<string, any>(),
  auditLogs: [] as any[],
  shouldFailNextAuditWrite: null as Error | null,
};

vi.mock('../src/services/email.provider.js', () => ({
  emailProvider: {
    sendVerificationEmail: vi.fn(async () => {}),
    sendPasswordResetEmail: vi.fn(async () => {}),
  },
}));

vi.mock('../src/config/database.js', () => {
  const txClient: any = {
    user: {
      update: vi.fn(async ({ where, data }: any) => {
        const u = mockAuditState.users.get(where.id) || { id: where.id };
        const updated = { ...u, ...data };
        mockAuditState.users.set(where.id, updated);
        return updated;
      }),
    },
    emailVerificationToken: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const rec = Array.from(mockAuditState.emailTokens.values()).find(
          (r) => r.id === where.id && r.usedAt === where.usedAt
        );
        if (!rec) return { count: 0 };
        Object.assign(rec, data);
        return { count: 1 };
      }),
    },
    passwordResetToken: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const rec = Array.from(mockAuditState.resetTokens.values()).find(
          (r) => r.id === where.id && r.usedAt === where.usedAt
        );
        if (!rec) return { count: 0 };
        Object.assign(rec, data);
        return { count: 1 };
      }),
    },
    session: {
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        if (mockAuditState.shouldFailNextAuditWrite) {
          const err = mockAuditState.shouldFailNextAuditWrite;
          mockAuditState.shouldFailNextAuditWrite = null;
          throw err;
        }
        const row = { id: `tx-audit-${mockAuditState.auditLogs.length + 1}`, ...data };
        mockAuditState.auditLogs.push(row);
        return row;
      }),
    },
  };

  const prismaMock: any = {
    ...txClient,
    $transaction: vi.fn(async (arg: any) => {
      if (typeof arg === 'function') {
        return arg(txClient);
      }
      return Promise.all(arg);
    }),
    role: {
      findUnique: vi.fn(async ({ where }: any) => ({ id: `role-${where.name}`, name: where.name })),
      create: vi.fn(async ({ data }: any) => ({ id: `role-${data.name}`, name: data.name })),
    },
    userRole: {
      findMany: vi.fn(async () => [{ role: { name: 'STUDENT' } }]),
      upsert: vi.fn(async ({ create }: any) => create),
    },
    teacherApplication: {
      findFirst: vi.fn(async () => null),
      findUnique: vi.fn(async ({ where }: any) => mockAuditState.applications.get(where.id) ?? null),
      create: vi.fn(async ({ data }: any) => {
        const app = { id: `app-${mockAuditState.applications.size + 1}`, ...data };
        mockAuditState.applications.set(app.id, app);
        return app;
      }),
      update: vi.fn(async ({ where, data }: any) => {
        const existing = mockAuditState.applications.get(where.id);
        const updated = { ...existing, ...data };
        mockAuditState.applications.set(where.id, updated);
        return updated;
      }),
    },
    emailVerificationToken: {
      ...txClient.emailVerificationToken,
      findUnique: vi.fn(async ({ where }: any) => {
        const rec = mockAuditState.emailTokens.get(where.tokenHash);
        if (!rec) return null;
        return { ...rec, user: mockAuditState.users.get(rec.userId) ?? null };
      }),
    },
    passwordResetToken: {
      ...txClient.passwordResetToken,
      findUnique: vi.fn(async ({ where }: any) => {
        const rec = mockAuditState.resetTokens.get(where.tokenHash);
        if (!rec) return null;
        return { ...rec, user: mockAuditState.users.get(rec.userId) ?? null };
      }),
    },
  };

  return {
    prisma: prismaMock,
    createDatabasePool: vi.fn(),
    resolveProductionSslConfig: vi.fn(),
  };
});

import {
  MAX_AUDIT_SANITIZE_DEPTH,
  logAuditEvent,
  redactStringSecrets,
  sanitizeAuditDetails,
  sanitizeAuditValue,
} from '../src/utils/audit.js';
import { prisma } from '../src/config/database.js';
import { hashToken } from '../src/utils/tokens.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { adminService } from '../src/modules/admin/admin.service.js';
import { teacherService } from '../src/modules/teachers/teacher.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AuditLog Unified Entry Point & Comprehensive Redaction Hardening (Phase 3-C-19)', () => {
  beforeEach(() => {
    mockAuditState.users.clear();
    mockAuditState.applications.clear();
    mockAuditState.emailTokens.clear();
    mockAuditState.resetTokens.clear();
    mockAuditState.sessions.clear();
    mockAuditState.auditLogs = [];
    mockAuditState.shouldFailNextAuditWrite = null;
    vi.clearAllMocks();
  });

  it('1. masks all sensitive field names regardless of case or separator', () => {
    const input = {
      password: 'dummy-pw-1',
      PASSWORD: 'dummy-pw-2',
      token: 'dummy-tok-1',
      access_token: 'dummy-access-1',
      refresh_token: 'dummy-refresh-1',
      secret: 'dummy-sec-1',
      client_secret: 'dummy-client-sec-1',
      apiKey: 'dummy-ak-camel',
      api_key: 'dummy-ak-snake',
      'x-api-key': 'dummy-ak-kebab',
      privateKey: 'dummy-pk-1',
      private_key: 'dummy-pk-2',
      authorization: 'Bearer dummy-auth-hdr',
      Cookie: 'sid=dummy-cookie',
      sessionToken: 'dummy-session-token',
      sessionSecret: 'dummy-session-secret',
      sessionKey: 'dummy-session-key',
      session: 'dummy-session-raw',
      credential: 'dummy-cred',
      passwordHash: 'dummy-hash',
    };

    const sanitized = sanitizeAuditValue(input) as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      expect(sanitized[key]).toBe('[REDACTED]');
    }
    const json = JSON.stringify(sanitized);
    expect(json).not.toContain('dummy-');

    const nonSecretPrecision = sanitizeAuditValue({
      sessionId: '550e8400-e29b-41d4-a716-446655440001',
      session_id: '550e8400-e29b-41d4-a716-446655440002',
      revokedExistingSessions: true,
      sessionCount: 3,
      sessionToken: 'dummy-session-tok-must-mask',
      session_secret: 'dummy-session-sec-must-mask',
    }) as Record<string, unknown>;
    expect(nonSecretPrecision.sessionId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(nonSecretPrecision.session_id).toBe('550e8400-e29b-41d4-a716-446655440002');
    expect(nonSecretPrecision.revokedExistingSessions).toBe(true);
    expect(nonSecretPrecision.sessionCount).toBe(3);
    expect(nonSecretPrecision.sessionToken).toBe('[REDACTED]');
    expect(nonSecretPrecision.session_secret).toBe('[REDACTED]');
  });

  it('2 & 3. sanitizes deep nested objects up to max depth and caps deeper objects with [MAX_DEPTH_REDACTED]', () => {
    const withinMax = {
      l1: {
        l2: {
          l3: {
            l4: {
              l5: {
                l6: {
                  password: 'dummy-depth6-password',
                  benign: 'still-safe-at-depth6',
                },
              },
            },
          },
        },
      },
    };
    const withinResult = sanitizeAuditValue(withinMax) as any;
    expect(withinResult.l1.l2.l3.l4.l5.l6.password).toBe('[REDACTED]');
    expect(withinResult.l1.l2.l3.l4.l5.l6.benign).toBe('still-safe-at-depth6');

    expect(MAX_AUDIT_SANITIZE_DEPTH).toBe(6);

    const overMax = {
      l1: {
        l2: {
          l3: {
            l4: {
              l5: {
                l6: {
                  l7_object: {
                    password: 'dummy-depth8-must-not-leak',
                    token: 'dummy-depth8-token',
                  },
                  l7_scalar: 'password=dummy-depth7-scalar',
                },
              },
            },
          },
        },
      },
    };
    const overJson = sanitizeAuditDetails(JSON.stringify(overMax))!;
    expect(overJson).not.toContain('dummy-depth8-must-not-leak');
    expect(overJson).not.toContain('dummy-depth8-token');
    expect(overJson).not.toContain('dummy-depth7-scalar');
    expect(overJson).toContain('[MAX_DEPTH_REDACTED]');
  });

  it('4. handles circular references safely without throwing or false-positives on sibling refs', () => {
    const sharedSibling = { school: '國立測試高中' };
    const circular: any = {
      name: 'root',
      first: sharedSibling,
      second: sharedSibling,
    };
    circular.self = circular;
    circular.nested = { backToRoot: circular };

    const sanitized = sanitizeAuditValue(circular) as any;
    expect(sanitized.name).toBe('root');
    expect(sanitized.first).toEqual({ school: '國立測試高中' });
    expect(sanitized.second).toEqual({ school: '國立測試高中' });
    expect(sanitized.self).toBe('[CIRCULAR]');
    expect(sanitized.nested.backToRoot).toBe('[CIRCULAR]');
  });

  it('5. masks passwords across PostgreSQL, Redis, Rediss, MySQL, and MongoDB DSNs', () => {
    const dsns = [
      'postgresql://app_user:dummy_pg_pw@127.0.0.1:5432/db',
      'postgres://app_user:dummy_pg2_pw@localhost:5432/db',
      'redis://default:dummy_redis_pw@10.0.0.2:6379/0',
      'redis://:dummy_redis_nopwuser@10.0.0.2:6379/0',
      'rediss://cache_user:dummy_rediss_pw@cache.internal:6380/0',
      'mysql://sql_user:dummy_mysql_pw@db.internal:3306/app',
      'mongodb://mongo_u:dummy_mongo_pw@db.internal:27017/app',
      'mongodb+srv://atlas_u:dummy_atlas_pw@cluster.example.net/app',
    ];

    for (const dsn of dsns) {
      const redacted = redactStringSecrets(dsn);
      expect(redacted).toContain('[REDACTED]@');
      expect(redacted).not.toContain('dummy_');
    }
  });

  it('6. masks inline key-value secrets including api_key=, access_token=, refresh_token=, client_secret=, Cookie, and Authorization', () => {
    const raw = [
      'api_key=dummy_inline_ak',
      'apiKey: "dummy_camel_ak"',
      'access_token=dummy_access_val',
      'refresh_token=dummy_refresh_val',
      'client_secret=dummy_client_secret',
      'password=dummy_inline_pw',
      'Authorization: Bearer dummy.jwt.sig',
      'Authorization: Basic ZHVtbXk6c2VjcmV0',
      'Cookie: sid=dummy_cookie_val; token=dummy_cookie_tok',
    ].join(' | ');

    const redacted = redactStringSecrets(raw);
    expect(redacted).not.toContain('dummy_inline_ak');
    expect(redacted).not.toContain('dummy_camel_ak');
    expect(redacted).not.toContain('dummy_access_val');
    expect(redacted).not.toContain('dummy_refresh_val');
    expect(redacted).not.toContain('dummy_client_secret');
    expect(redacted).not.toContain('dummy_inline_pw');
    expect(redacted).not.toContain('dummy.jwt.sig');
    expect(redacted).not.toContain('ZHVtbXk6c2VjcmV0');
    expect(redacted).not.toContain('dummy_cookie_val');
    expect(redacted).not.toContain('dummy_cookie_tok');
    expect(redacted).toContain('api_key=[REDACTED]');
    expect(redacted).toContain('access_token=[REDACTED]');
    expect(redacted).toContain('refresh_token=[REDACTED]');
    expect(redacted).toContain('client_secret=[REDACTED]');
  });

  it('7. preserves Error name and message while redacting secrets in message, stack, cause, and attached props', () => {
    const rootCause = new Error('Redis failed at redis://user:dummy_cause_pw@10.0.0.5:6379/0');
    const err: any = new Error(
      'DB auth failed: postgresql://svc:dummy_err_pw@host:5432/app with Bearer dummy_err_bearer'
    );
    err.name = 'DatabaseConnectionError';
    err.code = 'ECONNREFUSED';
    err.cause = rootCause;
    err.config = { api_key: 'dummy_attached_ak', region: 'ap-southeast-2' };

    const sanitized = sanitizeAuditValue({ error: err }) as any;
    expect(sanitized.error.name).toBe('DatabaseConnectionError');
    expect(sanitized.error.code).toBe('ECONNREFUSED');
    expect(sanitized.error.message).toContain('[REDACTED]');
    expect(sanitized.error.message).not.toContain('dummy_err_pw');
    expect(sanitized.error.message).not.toContain('dummy_err_bearer');
    expect(sanitized.error.stack).not.toContain('dummy_err_pw');
    expect(sanitized.error.cause.message).not.toContain('dummy_cause_pw');
    expect(sanitized.error.cause.message).toContain('[REDACTED]');
    expect(sanitized.error.config.api_key).toBe('[REDACTED]');
    expect(sanitized.error.config.region).toBe('ap-southeast-2');

    // Circular Error.cause handled without infinite recursion
    rootCause.cause = err;
    const circularErr = sanitizeAuditValue(err) as any;
    expect(circularErr.cause.cause).toBe('[CIRCULAR]');
  });

  it('8. preserves normal Traditional Chinese and English non-sensitive business metadata intact', () => {
    const businessPayload = {
      action: 'TEACHER_APPLICATION_APPROVED',
      applicationId: '550e8400-e29b-41d4-a716-446655440000',
      applicantUserId: 'usr-1001',
      schoolName: '國立臺灣科技大學',
      subject: 'Python 資料結構與演算法',
      reviewNote: '資料完整，核准教師資格申請。',
      approvedCount: 2,
      active: true,
      proofUrl: 'https://example.edu.tw/faculty/proof.pdf',
    };

    const sanitizedJson = sanitizeAuditDetails(JSON.stringify(businessPayload))!;
    const parsed = JSON.parse(sanitizedJson);
    expect(parsed).toEqual(businessPayload);
  });

  it('9 & 10. unifies Teacher, Admin (batch transaction), and Auth (interactive transaction) writes through fail-closed sanitization', async () => {
    // Teacher submitApplication: schoolName accidentally carries inline secret
    await teacherService.submitApplication(
      'stu-1',
      {
        schoolName: '國立大學 token=dummy_school_leak',
        subject: '資訊工程',
        reason: '開設課程管理',
      },
      '127.0.0.1',
      'Mozilla/5.0'
    );

    // Admin approveTeacherApplication inside batch $transaction([...]): reviewNote carries DSN secret
    mockAuditState.applications.set('app-pending-1', {
      id: 'app-pending-1',
      userId: 'stu-1',
      schoolName: '國立示範大學',
      status: 'PENDING',
      user: {
        id: 'stu-1',
        email: 'stu@codetoknow.edu',
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
    await adminService.approveTeacherApplication(
      'app-pending-1',
      'admin-1',
      { reviewNote: '核准通過 redis://u:dummy_admin_redis_pw@127.0.0.1:6379' },
      '127.0.0.1',
      'AdminUA'
    );

    // Auth verifyEmail & resetPassword inside interactive $transaction(async (tx) => ...)
    mockAuditState.users.set('usr-verify', {
      id: 'usr-verify',
      status: 'PENDING_VERIFICATION',
      deletedAt: null,
    });
    const rawVerifyTok = 'dummy_raw_verify_token_abc';
    mockAuditState.emailTokens.set(hashToken(rawVerifyTok), {
      id: 'vt-1',
      userId: 'usr-verify',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authService.verifyEmail(rawVerifyTok, '127.0.0.1', 'AuthUA');

    mockAuditState.users.set('usr-reset', {
      id: 'usr-reset',
      status: 'ACTIVE',
      deletedAt: null,
    });
    const rawResetTok = 'dummy_raw_reset_token_xyz';
    mockAuditState.resetTokens.set(hashToken(rawResetTok), {
      id: 'rt-1',
      userId: 'usr-reset',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authService.resetPassword(
      { token: rawResetTok, newPassword: 'NewSyntheticPassword123!' },
      '127.0.0.1',
      'AuthUA'
    );

    expect(mockAuditState.auditLogs).toHaveLength(4);
    const allStored = JSON.stringify(mockAuditState.auditLogs);
    expect(allStored).not.toContain('dummy_school_leak');
    expect(allStored).not.toContain('dummy_admin_redis_pw');
    expect(allStored).not.toContain(rawVerifyTok);
    expect(allStored).not.toContain(rawResetTok);
    expect(allStored).not.toContain('NewSyntheticPassword123!');
    expect(mockAuditState.auditLogs[0].details).toContain('token=[REDACTED]');
    expect(mockAuditState.auditLogs[1].details).toContain('redis://u:[REDACTED]@');
    expect(mockAuditState.auditLogs[2].action).toBe('EMAIL_VERIFIED');
    expect(mockAuditState.auditLogs[3].action).toBe('PASSWORD_RESET_COMPLETED');
    expect(JSON.parse(mockAuditState.auditLogs[3].details).revokedExistingSessions).toBe(true);

    // Interactive transaction rolls back / propagates when tx.auditLog.create fails
    mockAuditState.shouldFailNextAuditWrite = new Error('Simulated DB write failure');
    await expect(
      logAuditEvent({ userId: 'usr-1', action: 'TX_PROBE' }, prisma as any)
    ).rejects.toThrow('Simulated DB write failure');

    // Fail-closed fallback when serialization unexpectedly throws
    const poison = {
      secretNote: 'dummy_poison_secret_should_never_write',
      get boom() {
        throw new Error('getter threw');
      },
    };
    await logAuditEvent({ userId: 'usr-1', action: 'POISON_TEST', details: poison });
    const latest = mockAuditState.auditLogs[mockAuditState.auditLogs.length - 1];
    expect(latest.details).toBe('{"redactionFallback":"[REDACTION_ERROR]"}');
    expect(latest.details).not.toContain('dummy_poison_secret_should_never_write');
  });

  it('11. ensures zero direct prisma.auditLog.create or tx.auditLog.create calls exist outside backend/src/utils/audit.ts', () => {
    const srcRoot = path.resolve(__dirname, '../src');
    const directCreateMatches: string[] = [];

    function walk(dir: string) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
          const relPath = path.relative(srcRoot, fullPath).replace(/\\/g, '/');
          if (relPath === 'utils/audit.ts') continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          if (/auditLog\s*\.\s*(create|createMany|upsert|update|delete)/i.test(content)) {
            directCreateMatches.push(relPath);
          }
        }
      }
    }

    walk(srcRoot);
    expect(directCreateMatches).toEqual([]);
  });

  it('12. redacts sensitive secrets from console.error when legacy logAuditEvent encounters a DB failure', async () => {
    mockAuditState.shouldFailNextAuditWrite = new Error(
      'Connection failed: mongodb+srv://svc:dummy_errlog_secret@cluster.test/db'
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await logAuditEvent(null, 'LEGACY_ERR_PROBE', 'usr-1', { note: 'ok' });
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const loggedOutput = JSON.stringify(consoleSpy.mock.calls[0]);
      expect(loggedOutput).not.toContain('dummy_errlog_secret');
      expect(loggedOutput).toContain('[REDACTED]');
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
