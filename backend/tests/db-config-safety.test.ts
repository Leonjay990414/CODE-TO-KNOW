import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveDatasourceUrl,
  validateTestDatabaseUrl,
  validateIsolatedPg17TestUrl,
  validateMigrationDatabaseUrl,
  validateDevelopmentDatabaseUrl,
  validateCloudRuntimeDatabaseUrl,
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
      const validDirectUrl = 'postgresql://postgres:secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres';
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
      process.env.DIRECT_URL = 'postgresql://postgres:direct_secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres';
      process.env.MIGRATION_DATABASE_URL = 'postgresql://postgres:mig_secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres';

      expect(resolveDatasourceUrl()).toBe(process.env.DIRECT_URL);
    });

    it('[4.4.11] MIGRATION_DATABASE_URL 作為備援選擇', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.DIRECT_URL;
      process.env.MIGRATION_DATABASE_URL = 'postgresql://postgres:mig_secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres';

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

    it('[4.3.7] BLOCK: Development 連線埠非 5432 時拋出錯誤', () => {
      expect(() =>
        validateDevelopmentDatabaseUrl('postgresql://codetoknow:secret@127.0.0.1:5433/code_to_know')
      ).toThrowError(/not an approved development database port/);
    });

    it('[4.3.8] BLOCK: Development 資料庫名稱非 code_to_know 時拋出錯誤', () => {
      expect(() =>
        validateDevelopmentDatabaseUrl('postgresql://codetoknow:secret@127.0.0.1:5432/other_db')
      ).toThrowError(/not an approved development database/);
    });

    it('[4.3.9] BLOCK: Development 主機非 localhost 或 127.0.0.1 時拋出錯誤', () => {
      expect(() =>
        validateDevelopmentDatabaseUrl('postgresql://codetoknow:secret@192.168.1.100:5432/code_to_know')
      ).toThrowError(/not in the allowed development hosts whitelist/);
    });
  });

  // =========================================================================
  // Section 4.5: Cloud Runtime Safety Checks (Supabase Whitelist & Ports 5432/6543)
  // =========================================================================
  describe('validateCloudRuntimeDatabaseUrl() Cloud Runtime Checks', () => {
    it('[4.5.1] PASS: 合法 Supabase Session Pooler (埠位 5432 + app_runtime + sslmode=require)', () => {
      const url = 'postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require';
      expect(validateCloudRuntimeDatabaseUrl(url)).toBe(url);
    });

    it('[4.5.2] PASS: 合法 Supabase Transaction Pooler (埠位 6543 + app_runtime + sslmode=require)', () => {
      const url = 'postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require';
      expect(validateCloudRuntimeDatabaseUrl(url)).toBe(url);
    });

    it('[4.5.3] PASS: 合法 Supabase Direct Host (埠位 5432 + app_runtime + sslmode=require)', () => {
      const url = 'postgresql://app_runtime:secret@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres?sslmode=require';
      expect(validateCloudRuntimeDatabaseUrl(url)).toBe(url);
    });

    it('[4.5.4] BLOCK: Cloud Runtime 嚴禁指向本機主機 (localhost / 127.0.0.1)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@localhost:5432/postgres?sslmode=require')
      ).toThrowError(/Cloud runtime cannot target local hostnames/);

      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@127.0.0.1:5432/postgres?sslmode=require')
      ).toThrowError(/Cloud runtime cannot target local hostnames/);
    });

    it('[4.5.5] BLOCK: Cloud Runtime 嚴禁非核准之任意遠端主機', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@unapproved.evil.com:5432/postgres?sslmode=require')
      ).toThrowError(/not an approved Supabase domain/);
    });

    it('[4.5.6] BLOCK: Cloud Runtime 未強制 SSL 時拋出錯誤 (缺少 sslmode=require)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
      ).toThrowError(/must explicitly enable SSL/);
    });

    it('[4.5.7] BLOCK: Cloud Runtime 埠位非 5432 或 6543 時拋出錯誤', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:3306/postgres?sslmode=require')
      ).toThrowError(/not an approved port/);
    });

    it('[4.5.8] BLOCK: 缺少 DATABASE_URL 時拋出錯誤', () => {
      expect(() => validateCloudRuntimeDatabaseUrl(undefined)).toThrowError(/DATABASE_URL must be provided/);
      expect(() => validateCloudRuntimeDatabaseUrl('')).toThrowError(/DATABASE_URL must be provided/);
    });

    // 惡意相似網域與專案白名單驗證 (Check A 要求)
    it('[4.5.9] BLOCK: 相似偽造網域 supabase.com.attacker.example', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@supabase.com.attacker.example:5432/postgres?sslmode=require')
      ).toThrowError(/not an approved Supabase domain/);
    });

    it('[4.5.10] BLOCK: 相似偽造網域 fake-supabase.com', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@fake-supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/not an approved Supabase domain/);
    });

    it('[4.5.11] BLOCK: 相似偽造網域 project.supabase.co.attacker.example', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://user:pass@project.supabase.co.attacker.example:5432/postgres?sslmode=require')
      ).toThrowError(/not an approved Supabase domain/);
    });

    it('[4.5.12] BLOCK: 未核准之其他 Supabase 專案 (其他 Project Ref)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://app_runtime:pass@db.otherunapprovedproject.supabase.co:5432/postgres?sslmode=require')
      ).toThrowError(/not the approved pooler/);
    });

    it('[4.5.13] BLOCK: Pooler 連線時 username 包含其他未核准專案參照碼', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://app_runtime.other_foreign_ref:pass@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/does not match expected project ref/);
    });

    it('[4.5.14] BLOCK: 非核准之資料庫名稱 (非 postgres)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/other_database?sslmode=require')
      ).toThrowError(/not an approved database/);
    });

    // 最小權限與角色用途隔離驗證 (W-03 要求)
    it('[4.5.15] BLOCK: Cloud Runtime 嚴格拒絕 postgres (超級使用者)，落實最小權限', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://postgres.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/Role 'postgres' \(superuser\) is strictly prohibited in runtime/);
    });

    it('[4.5.16] BLOCK: Cloud Runtime 嚴格拒絕 migration_admin (遷移專用帳號)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://migration_admin.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/Role 'migration_admin' is strictly reserved for schema migrations and disallowed in runtime/);
    });

    it('[4.5.17] BLOCK: Cloud Runtime 嚴格拒絕未授權之任意角色 (如 admin, root)', () => {
      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://admin.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/is not an approved runtime role/);

      expect(() =>
        validateCloudRuntimeDatabaseUrl('postgresql://root.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require')
      ).toThrowError(/is not an approved runtime role/);
    });

    it('[4.5.18] PASS: Migration 接受合法 migration_admin Pooler 帳號', () => {
      const migUrl = 'postgresql://migration_admin.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres';
      expect(validateMigrationDatabaseUrl(migUrl)).toBe(migUrl);
    });

    it('[4.5.19] BLOCK: Migration 嚴格拒絕 app_runtime 帳號 (因缺少 DDL 權限)', () => {
      expect(() =>
        validateMigrationDatabaseUrl('postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
      ).toThrowError(/Role 'app_runtime' is strictly disallowed for migrations because it lacks DDL privileges/);
    });

    it('[4.5.20] BLOCK: Migration 拒絕錯誤專案參照碼', () => {
      expect(() =>
        validateMigrationDatabaseUrl('postgresql://migration_admin.wrong_ref:secret@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres')
      ).toThrowError(/does not match expected project ref/);
    });
  });

  // =========================================================================
  // Section 5: Isolated PG17 Test URL Quadruple Whitelist (Phase 3-C-27)
  // =========================================================================
  describe('validateIsolatedPg17TestUrl() Strict Quadruple Whitelist (FC-01 ~ FC-10)', () => {
    it('[FC-01] PASS: 允許正確的隔離測試 URL (127.0.0.1 / localhost + 5434 + code_to_know_test + c2k_test_app_runtime)', () => {
      const url1 = 'postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5434/code_to_know_test';
      const url2 = 'postgres://c2k_test_app_runtime:dummy_pw@localhost:5434/code_to_know_test';
      expect(validateIsolatedPg17TestUrl(url1)).toBe(url1);
      expect(validateIsolatedPg17TestUrl(url2)).toBe(url2);
    });

    it('[FC-02] BLOCK: 拒絕 Port 5432 (PG16 同埠)', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5432/code_to_know_test')
      ).toThrowError(/Port '5432' is not an approved isolated PG17 test port/);
    });

    it('[FC-03] BLOCK: 拒絕 Port 5433 (PG17 還原庫埠) 與其他非 5434 埠', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5433/code_to_know_test')
      ).toThrowError(/Port '5433' is not an approved isolated PG17 test port/);

      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:6543/code_to_know_test')
      ).toThrowError(/Port '6543' is not an approved isolated PG17 test port/);
    });

    it('[FC-04] BLOCK: 拒絕錯誤資料庫名稱 (code_to_know / postgres / code-to-know-prod)', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5434/code_to_know')
      ).toThrowError(/not an approved isolated test database/);

      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5434/postgres')
      ).toThrowError(/not an approved isolated test database/);

      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5434/code-to-know-prod')
      ).toThrowError(/not an approved isolated test database/);
    });

    it('[FC-05] BLOCK: 拒絕錯誤角色 (postgres / codetoknow / migration_admin / app_runtime)', () => {
      for (const badRole of ['postgres', 'codetoknow', 'migration_admin', 'app_runtime']) {
        expect(() =>
          validateIsolatedPg17TestUrl(`postgresql://${badRole}:dummy_pw@127.0.0.1:5434/code_to_know_test`)
        ).toThrowError(/not an approved isolated test role/);
      }
    });

    it('[FC-06] BLOCK: 拒絕雲端與遠端 Host (Supabase / 任意遠端網域)', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@aws-0-ap-southeast-2.pooler.supabase.com:5434/code_to_know_test')
      ).toThrowError(/not in the allowed isolated test hosts whitelist/);

      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@db.ypibmyfxfhsyfdwxprpi.supabase.co:5434/code_to_know_test')
      ).toThrowError(/not in the allowed isolated test hosts whitelist/);
    });

    it('[FC-07] BLOCK: 拒絕省略 Port (防止隱性預設連線至 5432)', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://c2k_test_app_runtime:dummy_pw@127.0.0.1/code_to_know_test')
      ).toThrowError(/Port must be explicitly specified as 5434/);
    });

    it('[FC-08] BLOCK: 拒絕省略角色 (防止隱性使用系統預設角色)', () => {
      expect(() =>
        validateIsolatedPg17TestUrl('postgresql://127.0.0.1:5434/code_to_know_test')
      ).toThrowError(/Role \(username\) must be explicitly specified/);
    });

    it('[FC-09] BLOCK: 拒絕錯誤 Protocol、空值與無效 URL 格式', () => {
      expect(() => validateIsolatedPg17TestUrl(undefined)).toThrowError(/must be explicitly provided/);
      expect(() => validateIsolatedPg17TestUrl('')).toThrowError(/must be explicitly provided/);
      expect(() => validateIsolatedPg17TestUrl('   ')).toThrowError(/must be explicitly provided/);
      expect(() =>
        validateIsolatedPg17TestUrl('mysql://c2k_test_app_runtime:dummy_pw@127.0.0.1:5434/code_to_know_test')
      ).toThrowError(/must use postgresql: or postgres: protocol/);
      expect(() => validateIsolatedPg17TestUrl('not-a-url')).toThrowError(/Invalid connection URL format/);
    });

    it('[FC-10] BLOCK: 錯誤訊息不得包含密碼、Query String 或完整連線字串', () => {
      const secretPw = 'FakeIsolatedTestSecret!987654';
      const malformed = `postgresql://c2k_test_app_runtime:${secretPw}@bad host:5434/code_to_know_test?sslmode=disable`;
      const wrongPort = `postgresql://c2k_test_app_runtime:${secretPw}@127.0.0.1:5432/code_to_know_test?sslmode=disable`;

      for (const candidate of [malformed, wrongPort]) {
        try {
          validateIsolatedPg17TestUrl(candidate);
          expect.unreachable('Should have thrown');
        } catch (err: unknown) {
          const msg = (err as Error).message;
          expect(msg).not.toContain(secretPw);
          expect(msg).not.toContain('sslmode=disable');
          expect(msg).not.toContain('postgresql://');
          expect(msg).toContain('[ISOLATED TEST DB CONFIG ERROR]');
        }
      }
    });
  });
});
