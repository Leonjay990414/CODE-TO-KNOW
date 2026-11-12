/**
 * 資料庫連線安全校驗模組 (Database Connection Safety & URL Validation)
 * 供 Prisma CLI Config、Runtime Database Config 及整合測試共同遵守
 */

export const ALLOWED_TEST_HOSTS = ['localhost', '127.0.0.1'] as const;
export const ALLOWED_TEST_DB_NAMES = ['code_to_know_test'] as const;
export const ALLOWED_ISOLATED_TEST_PORTS = ['5434'] as const;
export const ALLOWED_ISOLATED_TEST_ROLES = ['c2k_test_app_runtime'] as const;
export const ALLOWED_DEV_HOSTS = ['localhost', '127.0.0.1'] as const;
export const ALLOWED_DEV_DB_NAMES = ['code_to_know'] as const;

/**
 * Supabase 雲端專案白名單定義：
 * 針對 CODE TO KNOW 專案 (Project Ref: ypibmyfxfhsyfdwxprpi, 區域: aws-0-ap-southeast-2)
 * 嚴禁使用任意 *.supabase.co 或 *.supabase.com，杜絕類似網域攻擊或跨專案資料串接
 */
export const APPROVED_PROD_PROJECT_REF = 'ypibmyfxfhsyfdwxprpi';
export const APPROVED_PROD_POOLER_HOST = 'aws-0-ap-southeast-2.pooler.supabase.com';
export const APPROVED_CLOUD_DB_NAME = 'postgres';
export const APPROVED_PROD_RUNTIME_ROLE = 'app_runtime';
export const APPROVED_PROD_MIGRATION_ROLE = 'migration_admin';

/**
 * 驗證是否為合法之 Supabase 官方主機名稱（嚴防 fake-supabase.com 或 supabase.com.attacker.example）
 */
function isSupabaseDomain(hostname: string): boolean {
  return (
    hostname.endsWith('.supabase.co') ||
    hostname.endsWith('.supabase.com')
  );
}

/**
 * 驗證測試資料庫連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定 (postgres: 或 postgresql:)
 * 3. 必須具有有效 Host，且 Host 必須在白名單內 (localhost, 127.0.0.1)
 * 4. 必須具有有效 Database Name，且資料庫名稱必須嚴格在白名單內 (code_to_know_test)
 * 5. 連線埠必須為 5432 或未指定（預設 5432）
 * 6. 支援 URL 編碼名稱解碼比對
 * 7. 絕不在錯誤訊息輸出密碼、憑證或 Query String
 */
export function validateTestDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error(
      '[TEST DB CONFIG ERROR] TEST_DATABASE_URL must be explicitly provided in test mode.'
    );
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('[TEST DB CONFIG ERROR] Invalid connection URL format.');
  }

  // 1. 協定驗證
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('[TEST DB CONFIG ERROR] TEST_DATABASE_URL must use postgresql: or postgres: protocol.');
  }

  // 2. 主機驗證
  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('[TEST DB CONFIG ERROR] Host is missing in connection URL.');
  }

  if (!(ALLOWED_TEST_HOSTS as readonly string[]).includes(hostname)) {
    throw new Error(
      `[TEST DB CONFIG ERROR] Host '${hostname}' is not in the allowed test hosts whitelist (localhost, 127.0.0.1).`
    );
  }

  // 3. 連線埠驗證 (預設 5432 或顯式 5432)
  if (parsed.port && parsed.port !== '5432') {
    throw new Error(
      `[TEST DB CONFIG ERROR] Port '${parsed.port}' is not an approved test database port (allowed: 5432).`
    );
  }

  // 4. 資料庫名稱驗證 (支援 URL 解碼)
  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[TEST DB CONFIG ERROR] Database name is missing in connection URL.');
  }

  let dbName: string;
  try {
    dbName = decodeURIComponent(rawDbName).trim().toLowerCase();
  } catch {
    throw new Error('[TEST DB CONFIG ERROR] Invalid URL-encoded database name.');
  }

  if (!(ALLOWED_TEST_DB_NAMES as readonly string[]).includes(dbName)) {
    throw new Error(
      `[TEST DB CONFIG ERROR] Database name '${dbName}' is not an approved test database (allowed: code_to_know_test).`
    );
  }

  return trimmed;
}

/**
 * 驗證獨立隔離 PG17 測試資料庫連線字串（供 .db.test.ts 共用）：
 * 1. 必須提供非空字串
 * 2. 必須為 postgres: 或 postgresql: 協定
 * 3. Host 必須為 localhost 或 127.0.0.1（拒絕所有雲端與遠端主機）
 * 4. Port 必須顯式指定為 5434（禁止省略 Port，亦拒絕 5432 PG16、5433 PG17 還原庫與 6543）
 * 5. Database Name 必須為 code_to_know_test
 * 6. Role (username) 必須顯式指定且嚴格為 c2k_test_app_runtime
 * 7. 絕不在錯誤訊息輸出密碼、憑證、Query String 或完整連線字串
 */
export function validateIsolatedPg17TestUrl(rawUrl: string | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error(
      '[ISOLATED TEST DB CONFIG ERROR] Isolated PG17 test database URL must be explicitly provided.'
    );
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('[ISOLATED TEST DB CONFIG ERROR] Invalid connection URL format.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error(
      '[ISOLATED TEST DB CONFIG ERROR] Isolated test database URL must use postgresql: or postgres: protocol.'
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('[ISOLATED TEST DB CONFIG ERROR] Host is missing in connection URL.');
  }

  if (!(ALLOWED_TEST_HOSTS as readonly string[]).includes(hostname)) {
    throw new Error(
      `[ISOLATED TEST DB CONFIG ERROR] Host '${hostname}' is not in the allowed isolated test hosts whitelist (localhost, 127.0.0.1).`
    );
  }

  if (!parsed.port) {
    throw new Error(
      '[ISOLATED TEST DB CONFIG ERROR] Port must be explicitly specified as 5434 (omitting port is disallowed).'
    );
  }

  if (!(ALLOWED_ISOLATED_TEST_PORTS as readonly string[]).includes(parsed.port)) {
    throw new Error(
      `[ISOLATED TEST DB CONFIG ERROR] Port '${parsed.port}' is not an approved isolated PG17 test port (allowed: 5434).`
    );
  }

  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[ISOLATED TEST DB CONFIG ERROR] Database name is missing in connection URL.');
  }

  let dbName: string;
  try {
    dbName = decodeURIComponent(rawDbName).trim().toLowerCase();
  } catch {
    throw new Error('[ISOLATED TEST DB CONFIG ERROR] Invalid URL-encoded database name.');
  }

  if (!(ALLOWED_TEST_DB_NAMES as readonly string[]).includes(dbName)) {
    throw new Error(
      `[ISOLATED TEST DB CONFIG ERROR] Database name '${dbName}' is not an approved isolated test database (allowed: code_to_know_test).`
    );
  }

  if (!parsed.username || !parsed.username.trim()) {
    throw new Error(
      '[ISOLATED TEST DB CONFIG ERROR] Role (username) must be explicitly specified (allowed: c2k_test_app_runtime).'
    );
  }

  let role: string;
  try {
    role = decodeURIComponent(parsed.username).trim();
  } catch {
    throw new Error('[ISOLATED TEST DB CONFIG ERROR] Invalid URL-encoded role name.');
  }

  if (!(ALLOWED_ISOLATED_TEST_ROLES as readonly string[]).includes(role)) {
    throw new Error(
      `[ISOLATED TEST DB CONFIG ERROR] Role '${role}' is not an approved isolated test role (allowed: c2k_test_app_runtime).`
    );
  }

  return trimmed;
}

/**
 * 驗證雲端結構遷移 (Cloud Migration) 連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定
 * 3. 必須具有有效 Host 與 Database Name
 * 4. 嚴禁使用 Transaction Pooler Port 6543 作為遷移連線
 * 5. 連線埠必須為 5432 或未指定（預設 5432）
 * 6. 主機必須為 Supabase 官方主機，且若包含專案參照碼必須比對 APPROVED_PROD_PROJECT_REF 或 db.<project_ref>.supabase.co
 * 7. 絕不在錯誤訊息輸出密碼或憑證
 */
export function validateMigrationDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error(
      '[MIGRATION CONFIG ERROR] Cloud migration requires an explicit DIRECT_URL or MIGRATION_DATABASE_URL.'
    );
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('[MIGRATION CONFIG ERROR] Invalid migration connection URL format.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('[MIGRATION CONFIG ERROR] Migration connection URL must use postgresql: or postgres: protocol.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('[MIGRATION CONFIG ERROR] Migration connection URL missing host.');
  }

  // 1. 資料庫名稱比對 (優先檢查以提供精確錯誤訊息)
  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[MIGRATION CONFIG ERROR] Migration connection URL missing database name.');
  }

  let dbName: string;
  try {
    dbName = decodeURIComponent(rawDbName).trim().toLowerCase();
  } catch {
    throw new Error('[MIGRATION CONFIG ERROR] Invalid URL-encoded database name.');
  }

  if (dbName !== APPROVED_CLOUD_DB_NAME) {
    throw new Error(
      `[MIGRATION CONFIG ERROR] Cloud database name '${dbName}' is not an approved database (allowed: ${APPROVED_CLOUD_DB_NAME}).`
    );
  }

  // 2. 阻斷本機主機
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('[MIGRATION CONFIG ERROR] Migration connection cannot target local hostnames.');
  }

  // 3. 阻斷惡意相似網域 (如 attacker.example 或 fake-supabase)
  if (!isSupabaseDomain(hostname)) {
    throw new Error(
      `[MIGRATION CONFIG ERROR] Migration host '${hostname}' is not an approved Supabase domain (*.supabase.co, *.supabase.com).`
    );
  }

  // 4. 專案參照驗證：若為 db.<ref>.supabase.co 直連格式，必須比對核准之專案代碼
  if (hostname.endsWith('.supabase.co')) {
    const expectedDirectHost = `db.${APPROVED_PROD_PROJECT_REF}.supabase.co`;
    if (hostname !== expectedDirectHost) {
      throw new Error(
        `[MIGRATION CONFIG ERROR] Migration direct host '${hostname}' does not match the approved project ref '${APPROVED_PROD_PROJECT_REF}'.`
      );
    }
  }

  if (parsed.port === '6543') {
    throw new Error(
      '[MIGRATION CONFIG ERROR] Prisma Migration cannot use Transaction Pooler (port 6543) as migration connection because transaction pooling does not support session advisory locks.'
    );
  }

  if (parsed.port && parsed.port !== '5432') {
    throw new Error(
      `[MIGRATION CONFIG ERROR] Direct migration connection must use port 5432 (received port: ${parsed.port}).`
    );
  }

  // 5. 角色用途隔離驗證：禁止 app_runtime 用於 Migration
  if (parsed.username) {
    const rawUser = decodeURIComponent(parsed.username);
    if (hostname === APPROVED_PROD_POOLER_HOST) {
      const parts = rawUser.split('.');
      if (parts.length !== 2) {
        throw new Error(
          `[MIGRATION CONFIG ERROR] Cloud migration pooler username '${rawUser}' must be in '<role>.<project_ref>' format.`
        );
      }
      const [role, projectRef] = parts;
      if (role === 'app_runtime') {
        throw new Error(
          `[MIGRATION CONFIG ERROR] Role 'app_runtime' is strictly disallowed for migrations because it lacks DDL privileges. Migration requires 'migration_admin'.`
        );
      }
      if (role !== 'migration_admin' && role !== 'postgres') {
        throw new Error(
          `[MIGRATION CONFIG ERROR] Cloud migration pooler role '${role}' is not an approved migration role (allowed: migration_admin).`
        );
      }
      if (projectRef !== APPROVED_PROD_PROJECT_REF) {
        throw new Error(
          `[MIGRATION CONFIG ERROR] Cloud migration pooler username project ref '${projectRef}' does not match expected project ref '${APPROVED_PROD_PROJECT_REF}'.`
        );
      }
    } else {
      const role = rawUser.split('.')[0];
      if (role === 'app_runtime') {
        throw new Error(
          `[MIGRATION CONFIG ERROR] Role 'app_runtime' is strictly disallowed for migrations because it lacks DDL privileges. Migration requires 'migration_admin'.`
        );
      }
    }
  }

  return trimmed;
}

/**
 * 驗證本機開發連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定
 * 3. 主機必須嚴格在白名單內 (localhost, 127.0.0.1)
 * 4. 資料庫名稱必須為 code_to_know
 * 5. 連線埠必須為 5432 或未指定（預設 5432）
 * 6. 嚴禁指向遠端雲端連線池 (supabase.co / pooler.supabase.com)
 */
export function validateDevelopmentDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('[DEV CONFIG ERROR] DATABASE_URL must be provided in development mode.');
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('[DEV CONFIG ERROR] Invalid development connection URL format.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('[DEV CONFIG ERROR] Development connection URL must use postgresql: or postgres: protocol.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('[DEV CONFIG ERROR] Host is missing in development connection URL.');
  }

  if (hostname.includes('supabase.co') || hostname.includes('pooler.supabase.com')) {
    throw new Error(
      '[DEV CONFIG ERROR] Development mode cannot target cloud databases (supabase.co / pooler.supabase.com). Please use local PostgreSQL (127.0.0.1:5432) for development.'
    );
  }

  if (!(ALLOWED_DEV_HOSTS as readonly string[]).includes(hostname)) {
    throw new Error(
      `[DEV CONFIG ERROR] Host '${hostname}' is not in the allowed development hosts whitelist (localhost, 127.0.0.1).`
    );
  }

  if (parsed.port && parsed.port !== '5432') {
    throw new Error(
      `[DEV CONFIG ERROR] Port '${parsed.port}' is not an approved development database port (allowed: 5432).`
    );
  }

  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[DEV CONFIG ERROR] Database name is missing in development connection URL.');
  }

  let dbName: string;
  try {
    dbName = decodeURIComponent(rawDbName).trim().toLowerCase();
  } catch {
    throw new Error('[DEV CONFIG ERROR] Invalid URL-encoded database name.');
  }

  if (!(ALLOWED_DEV_DB_NAMES as readonly string[]).includes(dbName)) {
    throw new Error(
      `[DEV CONFIG ERROR] Database name '${dbName}' is not an approved development database (allowed: code_to_know).`
    );
  }

  return trimmed;
}

/**
 * 驗證雲端正式運行時期 (Cloud Runtime) 連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定
 * 3. 嚴禁指向本機主機 (localhost, 127.0.0.1, ::1)
 * 4. 主機必須為 Supabase 核准之 Pooler 主機 (APPROVED_PROD_POOLER_HOST) 或直連主機
 * 5. 使用者名稱若使用 Pooler，必須包含專案參照碼 (postgres.<project_ref>)
 * 6. 連線埠可為 5432 (Session Pooler / Direct) 或 6543 (Transaction Pooler，供無狀態高併發 Runtime)
 * 7. 資料庫名稱必須為 postgres
 * 8. 必須強制啟用 SSL (sslmode=require 或 verify-full)
 * 9. 絕不在錯誤訊息輸出密碼或憑證
 */
export function validateCloudRuntimeDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('[RUNTIME CONFIG ERROR] DATABASE_URL must be provided in production/cloud mode.');
  }

  const trimmed = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('[RUNTIME CONFIG ERROR] Invalid cloud runtime connection URL format.');
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error('[RUNTIME CONFIG ERROR] Cloud runtime connection URL must use postgresql: or postgres: protocol.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new Error('[RUNTIME CONFIG ERROR] Host is missing in cloud runtime connection URL.');
  }

  // 阻斷本機主機
  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) {
    throw new Error('[RUNTIME CONFIG ERROR] Cloud runtime cannot target local hostnames.');
  }

  // 阻斷惡意相似網域 (如 attacker.example 或 fake-supabase)
  if (!isSupabaseDomain(hostname)) {
    throw new Error(
      `[RUNTIME CONFIG ERROR] Cloud runtime host '${hostname}' is not an approved Supabase domain (*.supabase.co, *.supabase.com).`
    );
  }

  // 嚴格主機白名單：若使用 Pooler，必須比對 APPROVED_PROD_POOLER_HOST；若使用直連，必須比對 db.<ref>.supabase.co
  const expectedDirectHost = `db.${APPROVED_PROD_PROJECT_REF}.supabase.co`;
  if (hostname !== APPROVED_PROD_POOLER_HOST && hostname !== expectedDirectHost) {
    throw new Error(
      `[RUNTIME CONFIG ERROR] Cloud runtime host '${hostname}' is not the approved pooler (${APPROVED_PROD_POOLER_HOST}) or direct host (${expectedDirectHost}).`
    );
  }

  // 嚴格角色用途隔離：Runtime 僅允許 app_runtime，禁止 postgres (超級使用者) 與 migration_admin (遷移專用)
  if (parsed.username) {
    const rawUser = decodeURIComponent(parsed.username);
    if (hostname === APPROVED_PROD_POOLER_HOST) {
      const parts = rawUser.split('.');
      if (parts.length !== 2) {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Cloud runtime pooler username '${rawUser}' must be in '<role>.<project_ref>' format.`
        );
      }
      const [role, projectRef] = parts;

      if (role === 'postgres') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Role 'postgres' (superuser) is strictly prohibited in runtime. Production runtime must use 'app_runtime'.`
        );
      }

      if (role === 'migration_admin') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Role 'migration_admin' is strictly reserved for schema migrations and disallowed in runtime.`
        );
      }

      if (role !== 'app_runtime') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Cloud runtime pooler role '${role}' is not an approved runtime role (allowed: app_runtime).`
        );
      }

      if (projectRef !== APPROVED_PROD_PROJECT_REF) {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Cloud runtime pooler username project ref '${projectRef}' does not match expected project ref '${APPROVED_PROD_PROJECT_REF}'.`
        );
      }
    } else {
      const role = rawUser.split('.')[0];
      if (role === 'postgres') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Role 'postgres' (superuser) is strictly prohibited in runtime. Production runtime must use 'app_runtime'.`
        );
      }
      if (role === 'migration_admin') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Role 'migration_admin' is strictly reserved for schema migrations and disallowed in runtime.`
        );
      }
      if (role !== 'app_runtime') {
        throw new Error(
          `[RUNTIME CONFIG ERROR] Cloud runtime role '${role}' is not an approved runtime role (allowed: app_runtime).`
        );
      }
    }
  }

  // 資料庫名稱比對 (postgres)
  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[RUNTIME CONFIG ERROR] Database name is missing in cloud runtime connection URL.');
  }

  let dbName: string;
  try {
    dbName = decodeURIComponent(rawDbName).trim().toLowerCase();
  } catch {
    throw new Error('[RUNTIME CONFIG ERROR] Invalid URL-encoded database name.');
  }

  if (dbName !== APPROVED_CLOUD_DB_NAME) {
    throw new Error(
      `[RUNTIME CONFIG ERROR] Cloud database name '${dbName}' is not an approved database (allowed: ${APPROVED_CLOUD_DB_NAME}).`
    );
  }

  // 連線埠驗證 (允許 5432 或 6543)
  if (parsed.port && !['5432', '6543'].includes(parsed.port)) {
    throw new Error(
      `[RUNTIME CONFIG ERROR] Cloud runtime port '${parsed.port}' is not an approved port (allowed: 5432 for Session Pooler / Direct, 6543 for Transaction Pooler).`
    );
  }

  // SSL 驗證
  const sslmode = parsed.searchParams.get('sslmode')?.toLowerCase();
  if (!sslmode || !['require', 'verify-full', 'verify-ca'].includes(sslmode)) {
    throw new Error(
      '[RUNTIME CONFIG ERROR] Cloud runtime connection must explicitly enable SSL (sslmode=require).'
    );
  }

  return trimmed;
}

/**
 * 純函式：依據環境變數動態解析各環境之 Migration / Datasource URL
 * 可傳入 getEnv 適配器（預設為 process.env 讀取，Prisma 設定時可傳入 prisma/config 的 env() 封裝）
 */
export function resolveDatasourceUrl(getEnv: (key: string) => string = (key) => process.env[key] || ''): string {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'test') {
    const testUrl = process.env.TEST_DATABASE_URL;
    if (!testUrl || !testUrl.trim()) {
      throw new Error(
        '[PRISMA TEST CONFIG ERROR] In test mode (NODE_ENV=test), TEST_DATABASE_URL must be explicitly provided. Silent fallback to dev/prod DATABASE_URL is strictly disallowed.'
      );
    }
    validateTestDatabaseUrl(testUrl);
    return getEnv('TEST_DATABASE_URL') || testUrl;
  }

  if (nodeEnv === 'production' || process.env.MIGRATION_ENV === 'cloud') {
    const directUrl = process.env.DIRECT_URL?.trim();
    const migrationUrl = process.env.MIGRATION_DATABASE_URL?.trim();

    if (!directUrl && !migrationUrl) {
      throw new Error(
        '[PRISMA MIGRATION CONFIG ERROR] In production/cloud mode, Prisma Migration requires an explicit DIRECT_URL or MIGRATION_DATABASE_URL. Silent fallback to runtime DATABASE_URL is strictly disallowed.'
      );
    }

    const selectedUrl = directUrl || migrationUrl!;
    validateMigrationDatabaseUrl(selectedUrl);
    return directUrl
      ? (getEnv('DIRECT_URL') || directUrl)
      : (getEnv('MIGRATION_DATABASE_URL') || migrationUrl!);
  }

  // Development mode
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl || !devUrl.trim()) {
    throw new Error('[PRISMA DEV CONFIG ERROR] DATABASE_URL must be provided in development mode.');
  }
  validateDevelopmentDatabaseUrl(devUrl);

  return getEnv('DATABASE_URL') || devUrl;
}
