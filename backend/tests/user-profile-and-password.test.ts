import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/utils/password.js';
import { hashToken } from '../src/utils/tokens.js';
import { SESSION_COOKIE_NAME } from '../src/middleware/authenticate.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../src/middleware/csrf.js';

// In-memory mock database store
const mockStore = {
  users: new Map<string, any>(),
  profiles: new Map<string, any>(),
  sessions: new Map<string, any>(),
  auditLogs: [] as any[],
};

vi.mock('../src/config/database.js', () => {
  const txClient: any = {
    user: {
      update: vi.fn(async ({ where, data }: any) => {
        const user = mockStore.users.get(where.id);
        if (!user) return null;
        const updated = { ...user, ...data };
        mockStore.users.set(where.id, updated);
        return updated;
      }),
    },
    userProfile: {
      upsert: vi.fn(async ({ where, create, update }: any) => {
        let profile = mockStore.profiles.get(where.userId);
        if (profile) {
          profile = { ...profile, ...update, updatedAt: new Date() };
        } else {
          profile = {
            id: 'mock-profile-' + where.userId,
            userId: where.userId,
            nickname: create.nickname ?? null,
            timezone: create.timezone ?? 'Asia/Taipei',
            language: create.language ?? 'zh-TW',
            educationLevel: create.educationLevel ?? null,
            bio: create.bio ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        mockStore.profiles.set(where.userId, profile);
        return profile;
      }),
    },
    session: {
      updateMany: vi.fn(async ({ where, data }: any) => {
        let count = 0;
        for (const s of mockStore.sessions.values()) {
          if (s.userId !== where.userId) continue;
          if (where.revokedAt !== undefined && s.revokedAt !== where.revokedAt) continue;
          if (where.id && where.id.not && s.id === where.id.not) continue;

          Object.assign(s, data);
          count++;
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
        if (where.id) {
          const user = mockStore.users.get(where.id);
          if (!user) return null;
          return {
            ...user,
            profile: mockStore.profiles.get(user.id) || null,
            teacherApplications: user.teacherApplications || [],
            roles: user.roles || [{ role: { name: 'STUDENT' } }],
          };
        }
        if (where.email) {
          for (const u of mockStore.users.values()) {
            if (u.email === where.email) {
              return {
                ...u,
                profile: mockStore.profiles.get(u.id) || null,
                teacherApplications: u.teacherApplications || [],
                roles: u.roles || [{ role: { name: 'STUDENT' } }],
              };
            }
          }
        }
        return null;
      }),
    },
    userProfile: {
      ...txClient.userProfile,
      findUnique: vi.fn(async ({ where }: any) => {
        return mockStore.profiles.get(where.userId) || null;
      }),
    },
    session: {
      ...txClient.session,
      findUnique: vi.fn(async ({ where }: any) => {
        const s = mockStore.sessions.get(where.tokenHash);
        if (!s) return null;
        const user = mockStore.users.get(s.userId);
        return {
          ...s,
          user: user
            ? {
                ...user,
                roles: user.roles || [{ role: { name: 'STUDENT' } }],
              }
            : null,
        };
      }),
    },
  };

  return { prisma: prismaMock };
});

describe('Phase P07: User Profile & Change Password Security Suite', () => {
  const app = createApp();

  const TEST_USER_ID = 'test-user-001';
  const OTHER_USER_ID = 'test-user-002';
  const TEST_SESSION_RAW = 'raw_session_token_1234567890abcdef1234567890abcdef';
  const OTHER_SESSION_RAW = 'raw_session_token_other_device_9876543210fedcba';
  const TEST_SESSION_ID = 'session-id-current-device';
  const OTHER_SESSION_ID = 'session-id-other-device';

  let currentPasswordHash: string;

  beforeEach(async () => {
    mockStore.users.clear();
    mockStore.profiles.clear();
    mockStore.sessions.clear();
    mockStore.auditLogs.length = 0;

    currentPasswordHash = await hashPassword('CurrentValid123');

    // Create main user
    mockStore.users.set(TEST_USER_ID, {
      id: TEST_USER_ID,
      email: 'student@codetoknow.edu',
      passwordHash: currentPasswordHash,
      displayName: '學員小明',
      status: 'ACTIVE',
      deletedAt: null,
      roles: [{ role: { name: 'STUDENT' } }],
    });

    // Create main user's existing profile
    mockStore.profiles.set(TEST_USER_ID, {
      id: 'profile-001',
      userId: TEST_USER_ID,
      nickname: '小明',
      timezone: 'Asia/Taipei',
      language: 'zh-TW',
      educationLevel: 'HighSchool',
      bio: '熱愛程式設計的初學者',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create active session for main user (current device)
    mockStore.sessions.set(hashToken(TEST_SESSION_RAW), {
      id: TEST_SESSION_ID,
      userId: TEST_USER_ID,
      tokenHash: hashToken(TEST_SESSION_RAW),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    // Create second active session for main user (other device)
    mockStore.sessions.set(hashToken(OTHER_SESSION_RAW), {
      id: OTHER_SESSION_ID,
      userId: TEST_USER_ID,
      tokenHash: hashToken(OTHER_SESSION_RAW),
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    // Create other user
    mockStore.users.set(OTHER_USER_ID, {
      id: OTHER_USER_ID,
      email: 'other@codetoknow.edu',
      passwordHash: currentPasswordHash,
      displayName: '另一位學員',
      status: 'ACTIVE',
      deletedAt: null,
      roles: [{ role: { name: 'STUDENT' } }],
    });
  });

  // Helper to obtain a valid CSRF token and cookie from the app
  async function getCsrfCredentials() {
    const res = await request(app).get('/api/auth/csrf-token');
    const setCookie = res.headers['set-cookie'] || [];
    const xsrfCookie = setCookie.find((c: string) => c.includes(CSRF_COOKIE_NAME));
    const token = res.body.data.csrfToken;
    return { token, cookie: xsrfCookie };
  }

  // =========================================================================
  // Part 1: User Profile Update (PATCH /api/auth/profile) - TC-PRF-01 ~ 06
  // =========================================================================
  describe('Part 1: User Profile Update (PATCH /api/auth/profile)', () => {
    it('TC-PRF-01: Profile 正常更新（合法更新 5 欄位，驗證回傳與持久化）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          nickname: '進階工程師明',
          timezone: 'Asia/Tokyo',
          language: 'ja-JP',
          educationLevel: 'University',
          bio: '已經學會了 TypeScript 與 React！',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.nickname).toBe('進階工程師明');
      expect(res.body.data.profile.timezone).toBe('Asia/Tokyo');
      expect(res.body.data.profile.language).toBe('ja-JP');
      expect(res.body.data.profile.educationLevel).toBe('University');
      expect(res.body.data.profile.bio).toBe('已經學會了 TypeScript 與 React！');

      // Verify in-memory persistence
      const saved = mockStore.profiles.get(TEST_USER_ID);
      expect(saved.nickname).toBe('進階工程師明');
      expect(saved.timezone).toBe('Asia/Tokyo');
    });

    it('TC-PRF-02: 未登入攔截（無 Session Cookie 時回傳 401 UNAUTHENTICATED）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({ nickname: '未登入嘗試' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('TC-PRF-03: 缺少或無效 CSRF Token 攔截（回傳 403 CSRF_TOKEN_INVALID）', async () => {
      // Send without CSRF header
      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`])
        .send({ nickname: '無CSRF' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('TC-PRF-04: 欄位長度與型別檢核（超過上限回傳 400 驗證錯誤）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          nickname: 'A'.repeat(51), // Max is 50
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('TC-PRF-05: 嘗試注入未定義或特權欄位（被安全過濾或忽略，不污染資料庫）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          nickname: '正常小明',
          school: '非法學校名稱',
          grade: '非法年級',
          studentId: '999999',
          preferences: { theme: 'dark' },
          roles: ['ADMIN'],
          userId: OTHER_USER_ID, // Attempted IDOR
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.nickname).toBe('正常小明');

      // Verify that other user was NOT affected and role was not escalated
      const currentUser = mockStore.users.get(TEST_USER_ID);
      expect(currentUser.roles).toEqual([{ role: { name: 'STUDENT' } }]);

      const otherUser = mockStore.users.get(OTHER_USER_ID);
      expect(otherUser.displayName).toBe('另一位學員');

      // Verify non-schema fields are not on profile
      const saved = mockStore.profiles.get(TEST_USER_ID);
      expect((saved as any).school).toBeUndefined();
      expect((saved as any).roles).toBeUndefined();
    });

    it('TC-PRF-06: 初次無 Profile 使用者更新防護（自動安全 Upsert / 建立）', async () => {
      const csrf = await getCsrfCredentials();

      // Delete existing profile to simulate user with no profile yet
      mockStore.profiles.delete(TEST_USER_ID);

      const res = await request(app)
        .patch('/api/auth/profile')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          nickname: '新建立之暱稱',
          bio: '初次建立檔案',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.nickname).toBe('新建立之暱稱');
      expect(res.body.data.profile.bio).toBe('初次建立檔案');

      const saved = mockStore.profiles.get(TEST_USER_ID);
      expect(saved).toBeDefined();
      expect(saved.nickname).toBe('新建立之暱稱');
    });
  });

  // =========================================================================
  // Part 2: Change Password (POST /api/auth/change-password) - TC-PWD-01 ~ 09
  // =========================================================================
  describe('Part 2: Change Password (POST /api/auth/change-password)', () => {
    it('TC-PWD-01: 密碼正常變更（驗證舊密碼成功、新密碼符合強度，更新雜湊）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('密碼已成功變更');

      // Verify that password hash was updated
      const updatedUser = mockStore.users.get(TEST_USER_ID);
      expect(updatedUser.passwordHash).not.toBe(currentPasswordHash);

      // Verify response does NOT expose password or hash
      expect(res.body.password).toBeUndefined();
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('TC-PWD-02: 目前密碼錯誤拒絕（回傳 400 錯誤，不更新密碼）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'WrongPassword999',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');

      // Verify password was NOT changed
      const user = mockStore.users.get(TEST_USER_ID);
      expect(user.passwordHash).toBe(currentPasswordHash);
    });

    it('TC-PWD-03: 新舊密碼相同拒絕（回傳 400 SAME_AS_CURRENT_PASSWORD）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'CurrentValid123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('SAME_AS_CURRENT_PASSWORD');
    });

    it('TC-PWD-04: 新密碼強度不足拒絕（少於 8 字元、純字母或純數字回傳 400）', async () => {
      const csrf = await getCsrfCredentials();

      // Test too short
      const resShort = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'Short1',
        });
      expect(resShort.status).toBe(400);

      // Test purely alpha
      const resAlpha = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'AllAlphabeticPassword',
        });
      expect(resAlpha.status).toBe(400);

      // Test purely numeric
      const resNum = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: '123456789012345',
        });
      expect(resNum.status).toBe(400);
    });

    it('TC-PWD-05: 未登入拒絕（無 Session Cookie 時回傳 401 UNAUTHENTICATED）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHENTICATED');
    });

    it('TC-PWD-06: 缺少或無效 CSRF Token 拒絕（回傳 403 CSRF_TOKEN_INVALID）', async () => {
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`])
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('TC-PWD-07: 其餘有效 Session 全面撤銷（其他裝置 Session revokedAt 設為當前時間）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(200);

      // Verify that other device session is revoked
      const otherSession = mockStore.sessions.get(hashToken(OTHER_SESSION_RAW));
      expect(otherSession.revokedAt).not.toBeNull();
    });

    it('TC-PWD-08: 當前操作 Session 維持有效（當前 Session 未撤銷，隨後依然認證成功）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(200);

      // Verify current session revokedAt is still null
      const currentSession = mockStore.sessions.get(hashToken(TEST_SESSION_RAW));
      expect(currentSession.revokedAt).toBeNull();

      // Subsequent authenticated call using current session cookie still succeeds
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`]);

      expect(meRes.status).toBe(200);
      expect(meRes.body.success).toBe(true);
      expect(meRes.body.data.user.id).toBe(TEST_USER_ID);
    });

    it('TC-PWD-09: AuditLog 審計日誌與脫敏驗證（記錄 USER_PASSWORD_CHANGED 且無密碼/Token 洩漏）', async () => {
      const csrf = await getCsrfCredentials();

      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=${TEST_SESSION_RAW}`, csrf.cookie])
        .set(CSRF_HEADER_NAME, csrf.token)
        .send({
          currentPassword: 'CurrentValid123',
          newPassword: 'BrandNewSecure456',
        });

      expect(res.status).toBe(200);

      const changeLog = mockStore.auditLogs.find(
        (log) => log.action === 'USER_PASSWORD_CHANGED'
      );
      expect(changeLog).toBeDefined();
      expect(changeLog.userId).toBe(TEST_USER_ID);

      const logJson = JSON.stringify(changeLog);
      expect(logJson).not.toContain('CurrentValid123');
      expect(logJson).not.toContain('BrandNewSecure456');
      expect(logJson).not.toContain(TEST_SESSION_RAW);
    });
  });
});
