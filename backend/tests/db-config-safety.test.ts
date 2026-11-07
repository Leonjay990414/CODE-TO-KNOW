import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveDatasourceUrl,
  validateTestDatabaseUrl,
  validateMigrationDatabaseUrl,
  validateDevelopmentDatabaseUrl,
} from '../src/config/db-validation.js';

describe('Database Configuration & Connection Safety Gate (Phase 3.3)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =========================================================================
  // Section 3: TEST_DATABASE_URL Host & DB Name Dual Validation (3.5 Whitelist)
  // =========================================================================
  describe('validateTestDatabaseUrl() Strict Whitelist Validation', () => {
    it('[3.5.1] PASS: localhost + code_to_know_test', () => {
      const url = 'postgresql://test_user:test_secret@localhost:5432/code_to_know_test';
      expect(validateTestDatabaseUrl(url)).toBe(url);
    });

    it('[3.5.2] PASS: 127.0.0.1 + code_to_know_test', () => {
      const url = 'postgresql://test_user:test_secret@127.0.0.1:5432/code_to_know_test';
      expect(validateTestDatabaseUrl(url)).toBe(url);
    });

    it('[3.5.3] BLOCK: localhost + code_to_know (development database)', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://dev:secret@localhost:5432/code_to_know')
      ).toThrowError(/not an approved test database/);
    });

    it('[3.5.4] BLOCK: localhost + code-to-know-prod (production database)', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://prod:secret@localhost:5432/code-to-know-prod')
      ).toThrowError(/not an approved test database/);
    });

    it('[3.5.5] BLOCK: localhost + postgres (system default database)', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://admin:secret@localhost:5432/postgres')
      ).toThrowError(/not an approved test database/);
    });

    it('[3.5.6] BLOCK: Supabase 主機 + code_to_know_test', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://postgres.ref:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/code_to_know_test')
      ).toThrowError(/not in the allowed test hosts whitelist/);
    });

    it('[3.5.7] BLOCK: 未核准遠端主機 + code_to_know_test', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://user:secret@remote.database.internal:5432/code_to_know_test')
      ).toThrowError(/not in the allowed test hosts whitelist/);
    });

    it('[3.5.8] BLOCK: 未核准 Docker 主機名稱', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://user:secret@custom_unapproved_postgres:5432/code_to_know_test')
      ).toThrowError(/not in the allowed test hosts whitelist/);
    });

    it('[3.5.9] BLOCK: 錯誤 PostgreSQL 協定 (mysql:, http:)', () => {
      expect(() =>
        validateTestDatabaseUrl('mysql://user:pass@127.0.0.1:3306/code_to_know_test')
      ).toThrowError(/must use postgresql: or postgres: protocol/);
    });

    it('[3.5.10] BLOCK: 無效 URL 格式', () => {
      expect(() =>
        validateTestDatabaseUrl('not-a-valid-url-format')
      ).toThrowError(/Invalid connection URL format/);
    });

    it('[3.5.11] BLOCK: 缺少 Host', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql:///code_to_know_test')
      ).toThrowError(/Host is missing/);
    });

    it('[3.5.12] BLOCK: 缺少資料庫名稱', () => {
      expect(() =>
        validateTestDatabaseUrl('postgresql://user:pass@127.0.0.1:5432/')
      ).toThrowError(/Database name is missing/);
    });

    it('[3.5.13] BLOCK: 缺少 TEST_DATABASE_URL (undefined 或空字串)', () => {
      expect(() => validateTestDatabaseUrl(undefined)).toThrowError(/must be explicitly provided/);
      expect(() => validateTestDatabaseUrl('')).toThrowError(/must be explicitly provided/);
      expect(() => validateTestDatabaseUrl('   ')).toThrowError(/must be explicitly provided/);
    });

    it('[3.5.14] BLOCK: URL 含敏感密碼但格式錯誤時，錯誤訊息不得洩漏密碼', () => {
      const secretPassword = 'MySuperSensitiveDbPassword!#@9876';
      const malformedUrl = `postgresql://user:${secretPassword}@invalid host:5432/code_to_know_test`;

      try {
        validateTestDatabaseUrl(malformedUrl);
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const errorMsg = (err as Error).message;
        expect(errorMsg).not.toContain(secretPassword);
        expect(errorMsg).not.toContain('MySuperSensitiveDbPassword');
        expect(errorMsg).toContain('[TEST DB CONFIG ERROR]');
      }
    });

    it('[3.5.15] PASS: URL 編碼之合規資料庫名稱正確解碼比對', () => {
      const url = 'postgresql://test_user:test_secret@localhost:5432/code_to_know_test';
      expect(validateTestDatabaseUrl(url)).toBe(url);
    });
  });

  // =========================================================================
  // Section 3 & 7: resolveDatasourceUrl() in Test Mode
  // =========================================================================
  describe('resolveDatasourceUrl() in Test Mode', () => {
    it('throws immediately when NODE_ENV=test and TEST_DATABASE_URL is missing', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.TEST_DATABASE_URL;

      expect(() => resolveDatasourceUrl()).toThrowError(
        /In test mode \(NODE_ENV=test\), TEST_DATABASE_URL must be explicitly provided/
      );
    });

    it('strictly forbids fallback to DATABASE_URL in test mode', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.TEST_DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know';

      expect(() => resolveDatasourceUrl()).toThrowError(
        /Silent fallback to dev\/prod DATABASE_URL is strictly disallowed/
      );
    });

    it('resolves successfully when TEST_DATABASE_URL matches whitelist', () => {
      process.env.NODE_ENV = 'test';
      process.env.TEST_DATABASE_URL = 'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know_test';

      expect(resolveDatasourceUrl()).toBe(
        'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know_test'
      );
    });
  });

  // =========================================================================
  // Section 4: Cloud Migration URL Safety Validation (4.4 Requirements)
  // =========================================================================
  describe('validateMigrationDatabaseUrl() Safety Checks', () => {
    it('[4.4.1] BLOCK: 缺少 DIRECT_URL 與 MIGRATION_DATABASE_URL (undefined / 空字串)', () => {
      expect(() => validateMigrationDatabaseUrl(undefined)).toThrowError(/requires an explicit DIRECT_URL/);
      expect(() => validateMigrationDatabaseUrl('')).toThrowError(/requires an explicit DIRECT_URL/);
      expect(() => validateMigrationDatabaseUrl('   ')).toThrowError(/requires an explicit DIRECT_URL/);
    });

    it('[4.4.2] BLOCK: URL 格式錯誤', () => {
      expect(() => validateMigrationDatabaseUrl('malformed-migration-string')).toThrowError(
        /Invalid migration connection URL format/
      );
    });

    it('[4.4.3] BLOCK: 錯誤協定', () => {
      expect(() =>
        validateMigrationDatabaseUrl('mysql://admin:secret@db.supabase.co:3306/postgres')
      ).toThrowError(/must use postgresql: or postgres: protocol/);
    });

    it('[4.4.4] BLOCK: 缺少 Host', () => {
      expect(() =>
        validateMigrationDatabaseUrl('postgresql:///postgres')
      ).toThrowError(/missing host/);
    });

    it('[4.4.5] BLOCK: 缺少資料庫名稱', () => {
      expect(() =>
        validateMigrationDatabaseUrl('postgresql://admin:secret@db.supabase.co:5432/')
      ).toThrowError(/missing database name/);
    });

    it('[4.4.6] BLOCK: 嚴禁使用 Transaction Pooler Port 6543 作為遷移連線', () => {
      expect(() =>
        validateMigrationDatabaseUrl('postgresql://postgres.ref:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres')
      ).toThrowError(/cannot use Transaction Pooler \(port 6543\)/);
    });

    it('[4.4.7] PASS: 合法格式之 PostgreSQL Direct Migration 連線', () => {
      const validDirectUrl = 'postgresql://postgres:secret@db.projectref.supabase.co:5432/postgres';
      expect(validateMigrationDatabaseUrl(validDirectUrl)).toBe(validDirectUrl);
    });

    it('[4.4.8] BLOCK: 錯誤訊息不得洩漏敏感密碼', () => {
      const secret = 'CloudMigrationSecretKey9988!';
      const malformed = `postgresql://postgres:${secret}@invalid migration host:5432/postgres`;

      try {
        validateMigrationDatabaseUrl(malformed);
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const errorMsg = (err as Error).message;
        expect(errorMsg).not.toContain(secret);
        expect(errorMsg).toContain('[MIGRATION CONFIG ERROR]');
      }
    });
  });

  describe('resolveDatasourceUrl() in Production / Cloud Mode', () => {
    it('[4.4.9] throws error when both DIRECT_URL and MIGRATION_DATABASE_URL are missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DIRECT_URL;
      delete process.env.MIGRATION_DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://pooler:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

      expect(() => resolveDatasourceUrl()).toThrowError(
        /In production\/cloud mode, Prisma Migration requires an explicit DIRECT_URL or MIGRATION_DATABASE_URL/
      );
    });

    it('[4.4.10] DIRECT_URL 具有優先順序', () => {
      process.env.NODE_ENV = 'production';
      process.env.DIRECT_URL = 'postgresql://postgres:direct_secret@db.direct.supabase.co:5432/postgres';
      process.env.MIGRATION_DATABASE_URL = 'postgresql://postgres:mig_secret@db.fallback.supabase.co:5432/postgres';

      expect(resolveDatasourceUrl()).toBe(process.env.DIRECT_URL);
    });

    it('[4.4.11] MIGRATION_DATABASE_URL 作為備援選擇', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DIRECT_URL;
      process.env.MIGRATION_DATABASE_URL = 'postgresql://postgres:mig_secret@db.fallback.supabase.co:5432/postgres';

      expect(resolveDatasourceUrl()).toBe(process.env.MIGRATION_DATABASE_URL);
    });

    it('[4.4.12] 嚴格禁止在缺少 DIRECT_URL 時 fallback 到 DATABASE_URL', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DIRECT_URL;
      delete process.env.MIGRATION_DATABASE_URL;
      process.env.DATABASE_URL = 'postgresql://runtime:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

      expect(() => resolveDatasourceUrl()).toThrowError(
        /Silent fallback to runtime DATABASE_URL is strictly disallowed/
      );
    });
  });

  // =========================================================================
  // Section 4.3: Development Environment Safety Checks
  // =========================================================================
  describe('validateDevelopmentDatabaseUrl() & resolveDatasourceUrl() in Dev Mode', () => {
    it('[4.3.1] PASS: 合法本機 DATABASE_URL', () => {
      const localUrl = 'postgresql://codetoknow:dev_pass@127.0.0.1:5432/code_to_know?schema=public';
      expect(validateDevelopmentDatabaseUrl(localUrl)).toBe(localUrl);
    });

    it('[4.3.2] BLOCK: Development 模式嚴禁誤連 Supabase Cloud (supabase.co / pooler.supabase.com)', () => {
      expect(() =>
        validateDevelopmentDatabaseUrl('postgresql://postgres.ref:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
      ).toThrowError(/Development mode cannot target cloud databases/);

      expect(() =>
        validateDevelopmentDatabaseUrl('postgresql://postgres:secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres')
      ).toThrowError(/Development mode cannot target cloud databases/);
    });

    it('[4.3.3] BLOCK: 缺少 DATABASE_URL', () => {
      expect(() => validateDevelopmentDatabaseUrl(undefined)).toThrowError(
        /DATABASE_URL must be provided in development mode/
      );
      expect(() => validateDevelopmentDatabaseUrl('')).toThrowError(
        /DATABASE_URL must be provided in development mode/
      );
    });

    it('[4.3.4] BLOCK: 錯誤協定', () => {
      expect(() =>
        validateDevelopmentDatabaseUrl('mysql://codetoknow:dev_pass@127.0.0.1:3306/code_to_know')
      ).toThrowError(/must use postgresql: or postgres: protocol/);
    });

    it('[4.3.5] resolveDatasourceUrl() in development resolves local DATABASE_URL', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know?schema=public';

      expect(resolveDatasourceUrl()).toBe(
        'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know?schema=public'
      );
    });

    it('[4.3.6] resolveDatasourceUrl() in development blocks cloud database URL', () => {
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'postgresql://postgres.ref:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';

      expect(() => resolveDatasourceUrl()).toThrowError(
        /Development mode cannot target cloud databases/
      );
    });
  });
});
