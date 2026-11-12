import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hashToken } from '../src/utils/tokens.js';
import { verifyPassword } from '../src/utils/password.js';

const mockStore = {
  users: new Map<string, any>(),
  emailTokens: new Map<string, any>(),
  resetTokens: new Map<string, any>(),
  sessions: new Map<string, any>(),
  auditLogs: [] as any[],
  emailsSent: [] as Array<{ type: string; to: string; token: string }>,
};

vi.mock('../src/services/email.provider.js', () => ({
  emailProvider: {
    sendVerificationEmail: vi.fn(async (to: string, token: string) => {
      mockStore.emailsSent.push({ type: 'verify', to, token });
    }),
    sendPasswordResetEmail: vi.fn(async (to: string, token: string) => {
      mockStore.emailsSent.push({ type: 'reset', to, token });
    }),
  },
}));

vi.mock('../src/config/database.js', () => {
  const txClient: any = {
    user: {
      update: vi.fn(async ({ where, data }: any) => {
        const user = mockStore.users.get(where.id);
        const updated = { ...user, ...data };
        mockStore.users.set(where.id, updated);
        return updated;
      }),
    },
    emailVerificationToken: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const record = Array.from(mockStore.emailTokens.values()).find(
          (r) => r.id === where.id && r.usedAt === where.usedAt
        );
        if (!record) return { count: 0 };
        Object.assign(record, data);
        return { count: 1 };
      }),
    },
    passwordResetToken: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        const record = Array.from(mockStore.resetTokens.values()).find(
          (r) => r.id === where.id && r.usedAt === where.usedAt
        );
        if (!record) return { count: 0 };
        Object.assign(record, data);
        return { count: 1 };
      }),
    },
    session: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const s of mockStore.sessions.values()) {
          if (s.userId === where.userId && s.revokedAt === where.revokedAt) {
            Object.assign(s, data);
            count++;
          }
        }
        return { count };
      }),
    },
    auditLog: {
      create: vi.fn(async ({ data }: any) => {
        mockStore.auditLogs.push(data);
        return data;
      }),
    },
  };

  const prismaMock = {
    ...txClient,
    $transaction: vi.fn(async (cb: any) => cb(txClient)),
    user: {
      ...txClient.user,
      findUnique: vi.fn(async ({ where }: any) => {
        for (const u of mockStore.users.values()) {
          if ((where.id && u.id === where.id) || (where.email && u.email === where.email)) {
            return u;
          }
        }
        return null;
      }),
    },
    emailVerificationToken: {
      ...txClient.emailVerificationToken,
      findUnique: vi.fn(async ({ where }: any) => {
        const rec = mockStore.emailTokens.get(where.tokenHash);
        if (!rec) return null;
        return { ...rec, user: mockStore.users.get(rec.userId) ?? null };
      }),
    },
    passwordResetToken: {
      ...txClient.passwordResetToken,
      findUnique: vi.fn(async ({ where }: any) => {
        const rec = mockStore.resetTokens.get(where.tokenHash);
        if (!rec) return null;
        return { ...rec, user: mockStore.users.get(rec.userId) ?? null };
      }),
      create: vi.fn(async ({ data }: any) => {
        const rec = { id: `rst-${mockStore.resetTokens.size + 1}`, usedAt: null, ...data };
        mockStore.resetTokens.set(data.tokenHash, rec);
        return rec;
      }),
    },
  };

  return {
    prisma: prismaMock,
    createDatabasePool: vi.fn(),
    resolveProductionSslConfig: vi.fn(),
  };
});

import { authService } from '../src/modules/auth/auth.service.js';

function seedUserAndTokens(
  userId: string,
  status: string,
  deletedAt: Date | null = null,
  rawVerifyToken = `verify-${userId}`,
  rawResetToken = `reset-${userId}`
) {
  mockStore.users.set(userId, {
    id: userId,
    email: `${userId}@codetoknow.edu`,
    passwordHash: 'old-hash',
    displayName: userId,
    status,
    deletedAt,
    emailVerifiedAt: null,
  });

  mockStore.emailTokens.set(hashToken(rawVerifyToken), {
    id: `ev-${userId}`,
    userId,
    tokenHash: hashToken(rawVerifyToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
  });

  mockStore.resetTokens.set(hashToken(rawResetToken), {
    id: `pr-${userId}`,
    userId,
    tokenHash: hashToken(rawResetToken),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
  });

  mockStore.sessions.set(`sess-${userId}`, {
    id: `sess-${userId}`,
    userId,
    revokedAt: null,
  });
}

describe('AuthService Account Status & Soft-Delete Enforcement', () => {
  beforeEach(() => {
    mockStore.users.clear();
    mockStore.emailTokens.clear();
    mockStore.resetTokens.clear();
    mockStore.sessions.clear();
    mockStore.auditLogs = [];
    mockStore.emailsSent = [];
  });

  it('allows ACTIVE user to verify email once and records audit without leaking raw token', async () => {
    seedUserAndTokens('user-active', 'ACTIVE', null, 'VerifySecretTok123', 'ResetSecretTok123');

    const result = await authService.verifyEmail('VerifySecretTok123', '127.0.0.1', 'Vitest');
    expect(result.success).toBe(true);
    expect(mockStore.users.get('user-active').emailVerifiedAt).toBeInstanceOf(Date);
    expect(mockStore.emailTokens.get(hashToken('VerifySecretTok123')).usedAt).toBeInstanceOf(Date);

    // Replay with the same token must fail
    await expect(authService.verifyEmail('VerifySecretTok123')).rejects.toThrow();

    const auditSerialized = JSON.stringify(mockStore.auditLogs);
    expect(auditSerialized).not.toContain('VerifySecretTok123');
  });

  it('activates PENDING_VERIFICATION account on verifyEmail while still blocking SUSPENDED/DISABLED', async () => {
    seedUserAndTokens('user-pending', 'PENDING_VERIFICATION', null, 'PendingVerifyTok');
    const result = await authService.verifyEmail('PendingVerifyTok');
    expect(result.success).toBe(true);
    expect(mockStore.users.get('user-pending').status).toBe('ACTIVE');
  });

  it('blocks verifyEmail for SUSPENDED, DISABLED, and soft-deleted accounts and leaves tokens unused', async () => {
    seedUserAndTokens('user-suspended', 'SUSPENDED', null, 'TokSuspended');
    seedUserAndTokens('user-disabled', 'DISABLED', null, 'TokDisabled');
    seedUserAndTokens('user-deleted', 'ACTIVE', new Date(), 'TokDeleted');

    for (const [uid, tok] of [
      ['user-suspended', 'TokSuspended'],
      ['user-disabled', 'TokDisabled'],
      ['user-deleted', 'TokDeleted'],
    ] as const) {
      await expect(authService.verifyEmail(tok)).rejects.toMatchObject({
        statusCode: 403,
        code: 'ACCOUNT_DISABLED',
      });
      expect(mockStore.users.get(uid).emailVerifiedAt).toBeNull();
      expect(mockStore.emailTokens.get(hashToken(tok)).usedAt).toBeNull();
    }
  });

  it('allows ACTIVE user to reset password, revokes sessions, and does not log password or token', async () => {
    seedUserAndTokens('user-reset-ok', 'ACTIVE', null, 'vtok', 'ResetSecretToken999');

    const res = await authService.resetPassword({
      token: 'ResetSecretToken999',
      newPassword: 'BrandNewPassword123',
    });

    expect(res.success).toBe(true);
    const updatedUser = mockStore.users.get('user-reset-ok');
    expect(await verifyPassword('BrandNewPassword123', updatedUser.passwordHash)).toBe(true);
    expect(mockStore.sessions.get('sess-user-reset-ok').revokedAt).toBeInstanceOf(Date);
    expect(mockStore.resetTokens.get(hashToken('ResetSecretToken999')).usedAt).toBeInstanceOf(Date);

    // Replay must fail
    await expect(
      authService.resetPassword({ token: 'ResetSecretToken999', newPassword: 'AnotherPassword123' })
    ).rejects.toThrow();

    const logs = JSON.stringify(mockStore.auditLogs);
    expect(logs).not.toContain('ResetSecretToken999');
    expect(logs).not.toContain('BrandNewPassword123');
  });

  it('blocks resetPassword for SUSPENDED, DISABLED, soft-deleted, and PENDING_VERIFICATION accounts', async () => {
    seedUserAndTokens('u-susp', 'SUSPENDED', null, 'v1', 'RstSuspSecret');
    seedUserAndTokens('u-dis', 'DISABLED', null, 'v2', 'RstDisSecret');
    seedUserAndTokens('u-del', 'ACTIVE', new Date(), 'v3', 'RstDelSecret');
    seedUserAndTokens('u-pend', 'PENDING_VERIFICATION', null, 'v4', 'RstPendSecret');

    for (const [uid, tok] of [
      ['u-susp', 'RstSuspSecret'],
      ['u-dis', 'RstDisSecret'],
      ['u-del', 'RstDelSecret'],
      ['u-pend', 'RstPendSecret'],
    ] as const) {
      let caught: any = null;
      try {
        await authService.resetPassword({ token: tok, newPassword: 'AttackerPassword123' });
      } catch (err) {
        caught = err;
      }
      expect(caught).toBeTruthy();
      expect(caught.statusCode).toBe(403);
      expect(caught.message).not.toContain(tok);
      expect(caught.message).not.toContain('AttackerPassword123');
      expect(mockStore.users.get(uid).passwordHash).toBe('old-hash');
      expect(mockStore.resetTokens.get(hashToken(tok)).usedAt).toBeNull();
      expect(mockStore.sessions.get(`sess-${uid}`).revokedAt).toBeNull();
    }
  });

  it('silently ignores requestPasswordReset for SUSPENDED, DISABLED, and soft-deleted accounts without issuing tokens', async () => {
    seedUserAndTokens('u-s1', 'SUSPENDED');
    seedUserAndTokens('u-s2', 'DISABLED');
    seedUserAndTokens('u-s3', 'ACTIVE', new Date());

    const initialTokenCount = mockStore.resetTokens.size;
    for (const email of ['u-s1@codetoknow.edu', 'u-s2@codetoknow.edu', 'u-s3@codetoknow.edu']) {
      const res = await authService.requestPasswordReset(email);
      expect(res.success).toBe(true);
    }
    expect(mockStore.resetTokens.size).toBe(initialTokenCount);
    expect(mockStore.emailsSent).toHaveLength(0);
  });
});
