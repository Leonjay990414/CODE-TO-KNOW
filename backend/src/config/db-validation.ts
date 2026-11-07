/**
 * 資料庫連線安全校驗模組 (Database Connection Safety & URL Validation)
 * 供 Prisma CLI Config、Runtime Database Config 及整合測試共同遵守
 */

export const ALLOWED_TEST_HOSTS = ['localhost', '127.0.0.1'] as const;
export const ALLOWED_TEST_DB_NAMES = ['code_to_know_test'] as const;

/**
 * 驗證測試資料庫連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定 (postgres: 或 postgresql:)
 * 3. 必須具有有效 Host，且 Host 必須在白名單內 (localhost, 127.0.0.1)
 * 4. 必須具有有效 Database Name，且資料庫名稱必須嚴格在白名單內 (code_to_know_test)
 * 5. 支援 URL 編碼名稱解碼比對
 * 6. 絕不在錯誤訊息輸出密碼、憑證或 Query String
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

  // 3. 資料庫名稱驗證 (支援 URL 解碼)
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
 * 驗證雲端結構遷移 (Cloud Migration) 連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定
 * 3. 必須具有有效 Host 與 Database Name
 * 4. 嚴禁使用 Transaction Pooler Port 6543 作為遷移連線
 * 5. 絕不在錯誤訊息輸出密碼或憑證
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

  const rawDbName = parsed.pathname.replace(/^\//, '');
  if (!rawDbName || !rawDbName.trim()) {
    throw new Error('[MIGRATION CONFIG ERROR] Migration connection URL missing database name.');
  }

  if (parsed.port === '6543') {
    throw new Error(
      '[MIGRATION CONFIG ERROR] Prisma Migration cannot use Transaction Pooler (port 6543) as migration connection because transaction pooling does not support session advisory locks.'
    );
  }

  return trimmed;
}

/**
 * 驗證本機開發連線字串安全規則：
 * 1. 必須提供非空字串
 * 2. 必須為合法 PostgreSQL 協定
 * 3. 嚴禁指向遠端雲端連線池 (supabase.co / pooler.supabase.com)
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
  if (hostname.includes('supabase.co') || hostname.includes('pooler.supabase.com')) {
    throw new Error(
      '[DEV CONFIG ERROR] Development mode cannot target cloud databases (supabase.co / pooler.supabase.com). Please use local PostgreSQL (127.0.0.1:5432) for development.'
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
