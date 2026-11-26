/**
 * CODE TO KNOW (碼上學) - Database Backup & Restore Automation Module
 * File: backend/src/utils/databaseBackupRestore.ts
 * Task: CTK-CORE-01-DB-003
 *
 * Core principles:
 * - Deterministic, verified PostgreSQL Custom Format (-Fc) backups.
 * - Cryptographic integrity validation (SHA-256 checksums).
 * - Metadata Manifest generation with zero secret leakage.
 * - Strict target isolation guard: rejects cloud, production, and non-scratch databases.
 * - Dry-Run by default: zero live restore execution in preflight.
 * - Retention policy preview with zero unauthorized file deletions.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { z } from 'zod';

// ============================================================================
// Types & Schemas
// ============================================================================

export const PG_CUSTOM_FORMAT_MAGIC = Buffer.from([0x50, 0x47, 0x44, 0x4d, 0x50]); // 'PGDMP'

export const ManifestSchema = z.object({
  manifestVersion: z.literal('1.0.0'),
  createdAt: z.string().datetime({ offset: true }),
  database: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  engineVersion: z.string().min(1),
  format: z.literal('custom'),
  dumpFileName: z.string().min(1),
  dumpFileSize: z.number().int().positive(),
  dumpFileSha256: z.string().regex(/^[A-F0-9]{64}$/),
  environment: z.enum(['local-sandbox', 'development', 'staging', 'production']),
  notes: z.string().optional(),
});

export type BackupManifest = z.infer<typeof ManifestSchema>;

export interface TargetIsolationConfig {
  host: string;
  port: number;
  database: string;
}

export interface BackupOptions {
  database: string;
  host?: string;
  port?: number;
  engineVersion?: string;
  outputDir: string;
  customPrefix?: string;
  environment?: 'local-sandbox' | 'development';
  notes?: string;
}

export interface BackupResult {
  dumpPath: string;
  manifestPath: string;
  dumpFileName: string;
  fileSize: number;
  sha256: string;
  manifest: BackupManifest;
}

export interface PreflightCheckItem {
  name: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

export interface RestorePreflightOptions {
  dumpPath: string;
  manifestPath?: string;
  target: TargetIsolationConfig;
  dryRun?: boolean;
  expectedEngineVersion?: string;
}

export interface RestorePreflightResult {
  status: 'READY_FOR_RESTORE_DRY_RUN_PASS' | 'PREFLIGHT_FAILED';
  dryRun: true;
  liveRestoreExecuted: false;
  checks: PreflightCheckItem[];
  target: {
    host: string;
    port: number;
    database: string;
  };
  dumpInfo?: {
    path: string;
    size: number;
    sha256: string;
    format: string;
  };
  errorSummary?: string;
}

export interface RetentionPolicyOptions {
  backupDir: string;
  keepCount?: number;
  keepDays?: number;
}

export interface RetentionPreviewResult {
  totalBackups: number;
  retainedCount: number;
  candidateExpiredCount: number;
  retainedFiles: string[];
  candidateExpiredFiles: string[];
  deletedCount: 0; // Strictly 0: preview only
  message: string;
}

// ============================================================================
// Security & Isolation Guards
// ============================================================================

/** Blocked keywords and domain patterns for target hosts */
const BLOCKED_HOST_PATTERNS = [
  /supabase\.co/i,
  /supabase\.com/i,
  /aws\.com/i,
  /neon\.tech/i,
  /render\.com/i,
  /production/i,
  /prod-/i,
  /rds\.amazonaws\.com/i,
];

/** Allowed target hosts for local development / sandbox */
const ALLOWED_LOCAL_HOSTS = [
  '127.0.0.1',
  'localhost',
  'code_to_know_pg17_restore_sandbox',
  'code_to_know_postgres',
];

/** Blocked database names that must NEVER be used as restore targets */
const BLOCKED_DATABASE_NAMES = [
  'code_to_know',
  'postgres',
  'template0',
  'template1',
  'main',
  'master',
  'production',
  'prod',
  'supabase',
  'code_to_know_c2kb_prod_restore_test',
  'code_to_know_cloud_restore_test',
];

/** Whitelist regex pattern for allowable scratch test databases */
const ALLOWED_SCRATCH_DATABASE_REGEX = /^ctk_core\d{2}_db\d{3}_.*scratch$/i;

/** Specific explicit scratch databases allowed */
const EXPLICIT_ALLOWED_SCRATCH_DBS = [
  'ctk_core01_db001_scratch',
  'ctk_core01_db001_restore_scratch',
  'ctk_core01_db003_scratch',
  'ctk_core01_db003_restore_scratch',
  'ctk_core01_int005_restore_verify',
];

/**
 * Validates that the target database and host conform to isolation guidelines.
 * Fails closed on any cloud, production, system, or non-scratch target.
 */
export function validateTargetIsolation(target: TargetIsolationConfig): { isValid: boolean; error?: string } {
  if (!target.host || typeof target.host !== 'string') {
    return { isValid: false, error: '[ISOLATION GUARD] Target host must be specified.' };
  }

  // 1. Host check - strictly reject cloud hosts
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(target.host)) {
      return {
        isValid: false,
        error: `[ISOLATION GUARD: CLOUD REJECTED] Target host '${target.host}' matches cloud/production blocklist: ${pattern}.`,
      };
    }
  }

  // Verify host is in allowed local hosts list
  const isAllowedHost = ALLOWED_LOCAL_HOSTS.some(
    (allowed) => target.host.toLowerCase() === allowed.toLowerCase()
  );
  if (!isAllowedHost) {
    return {
      isValid: false,
      error: `[ISOLATION GUARD: UNAPPROVED HOST] Host '${target.host}' is not in allowed local sandbox hosts: ${ALLOWED_LOCAL_HOSTS.join(', ')}.`,
    };
  }

  // 2. Database check
  if (!target.database || typeof target.database !== 'string') {
    return { isValid: false, error: '[ISOLATION GUARD] Target database name must be specified.' };
  }

  const dbLower = target.database.toLowerCase().trim();

  // Reject blocked database names
  if (BLOCKED_DATABASE_NAMES.includes(dbLower)) {
    return {
      isValid: false,
      error: `[ISOLATION GUARD: PROTECTED DATABASE] Database '${target.database}' is a protected system/production database name. Modification forbidden.`,
    };
  }

  // Must match scratch pattern or explicit whitelist
  const isScratchPattern = ALLOWED_SCRATCH_DATABASE_REGEX.test(dbLower);
  const isExplicitScratch = EXPLICIT_ALLOWED_SCRATCH_DBS.includes(dbLower);

  if (!isScratchPattern && !isExplicitScratch) {
    return {
      isValid: false,
      error: `[ISOLATION GUARD: NON-SCRATCH REJECTED] Target database '${target.database}' does not match scratch database naming rule (^ctk_core\\d{2}_db\\d{3}_.*scratch$).`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// Cryptographic & File Utility Functions
// ============================================================================

/**
 * Computes SHA-256 uppercase hexadecimal digest for a file.
 */
export function calculateFileSha256(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`[SHA256 ERROR] File not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved);
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

/**
 * Generates an ISO-like UTC timestamp safe for filenames (YYYYMMDD_HHMMSS).
 */
export function formatFilenameTimestamp(date: Date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const min = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}_${h}${min}${s}`;
}

/**
 * Generates a unique, non-colliding backup filename for a database.
 */
export function generateBackupFilename(database: string, customPrefix = 'ctk_backup', date: Date = new Date()): string {
  const sanitizedDb = database.replace(/[^a-zA-Z0-9_]/g, '_');
  const timestamp = formatFilenameTimestamp(date);
  const entropy = crypto.randomBytes(3).toString('hex');
  return `${customPrefix}_${sanitizedDb}_${timestamp}_${entropy}.dump`;
}

/**
 * Verifies that a file begins with PostgreSQL Custom Format header (PGDMP).
 */
export function verifyPostgresCustomDumpHeader(filePath: string): {
  isValid: boolean;
  magic?: string;
  version?: { major: number; minor: number };
  error?: string;
} {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return { isValid: false, error: `File not found: ${resolved}` };
  }

  const stat = fs.statSync(resolved);
  if (stat.size < 5) {
    return { isValid: false, error: `File too small to be PostgreSQL dump (${stat.size} bytes)` };
  }

  const fd = fs.openSync(resolved, 'r');
  try {
    const buffer = Buffer.alloc(10);
    fs.readSync(fd, buffer, 0, 10, 0);

    const magic = buffer.subarray(0, 5);
    if (!magic.equals(PG_CUSTOM_FORMAT_MAGIC)) {
      return {
        isValid: false,
        error: `Invalid magic header. Expected 'PGDMP' (0x5047444D50), got: ${magic.toString('hex')}`,
      };
    }

    const major = buffer[5];
    const minor = buffer[6];

    return {
      isValid: true,
      magic: 'PGDMP',
      version: { major, minor },
    };
  } finally {
    fs.closeSync(fd);
  }
}

// ============================================================================
// Manifest Operations (Zero Secrets Enforced)
// ============================================================================

/**
 * Creates and writes a backup manifest file.
 * Guaranteed zero secret exposure: all fields are validated against strict Zod schema.
 */
export function createBackupManifest(params: {
  database: string;
  host: string;
  port: number;
  engineVersion: string;
  dumpPath: string;
  environment?: 'local-sandbox' | 'development';
  notes?: string;
}): { manifest: BackupManifest; manifestPath: string } {
  const resolvedDump = path.resolve(params.dumpPath);
  if (!fs.existsSync(resolvedDump)) {
    throw new Error(`[MANIFEST ERROR] Dump file does not exist: ${resolvedDump}`);
  }

  const stat = fs.statSync(resolvedDump);
  if (stat.size === 0) {
    throw new Error(`[MANIFEST ERROR] Dump file size is 0 bytes: ${resolvedDump}`);
  }

  const sha256 = calculateFileSha256(resolvedDump);
  const dumpFileName = path.basename(resolvedDump);
  const manifestPath = `${resolvedDump}.manifest.json`;

  if (fs.existsSync(manifestPath)) {
    throw new Error(`[MANIFEST ERROR] Manifest file already exists and overwrite is forbidden: ${manifestPath}`);
  }

  const rawManifest: BackupManifest = {
    manifestVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    database: params.database,
    host: params.host,
    port: params.port,
    engineVersion: params.engineVersion,
    format: 'custom',
    dumpFileName,
    dumpFileSize: stat.size,
    dumpFileSha256: sha256,
    environment: params.environment || 'local-sandbox',
    notes: params.notes || 'Automated CTK PostgreSQL 17 Custom Format Backup',
  };

  const parsed = ManifestSchema.parse(rawManifest);

  // Write with wx flag to prevent accidental overwrite
  fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2), { encoding: 'utf-8', flag: 'wx' });

  return {
    manifest: parsed,
    manifestPath,
  };
}

/**
 * Reads, parses, and validates a backup manifest file.
 */
export function readAndValidateManifest(manifestPath: string): BackupManifest {
  const resolved = path.resolve(manifestPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`[MANIFEST ERROR] Manifest file not found: ${resolved}`);
  }

  let content: string;
  try {
    content = fs.readFileSync(resolved, 'utf-8');
  } catch (err) {
    throw new Error(`[MANIFEST ERROR] Failed to read manifest file: ${(err as Error).message}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch (err) {
    throw new Error(`[MANIFEST ERROR] Manifest is not valid JSON: ${(err as Error).message}`);
  }

  const result = ManifestSchema.safeParse(json);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`[MANIFEST ERROR] Manifest failed schema validation: ${errorDetails}`);
  }

  return result.data;
}

// ============================================================================
// Restore Preflight Tool (Dry-Run by Default)
// ============================================================================

/**
 * Evaluates dump file, manifest, cryptographic checksum, and target database isolation.
 * Strictly DRY-RUN: Never executes actual restore.
 */
export function runRestorePreflight(options: RestorePreflightOptions): RestorePreflightResult {
  const checks: PreflightCheckItem[] = [];
  const resolvedDump = path.resolve(options.dumpPath);
  const manifestPath = options.manifestPath || `${resolvedDump}.manifest.json`;

  // 1. Dump file existence
  if (!fs.existsSync(resolvedDump)) {
    checks.push({
      name: 'Dump File Existence',
      status: 'FAIL',
      detail: `Dump file not found at: ${resolvedDump}`,
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: `Dump file missing: ${resolvedDump}`,
    };
  }
  checks.push({
    name: 'Dump File Existence',
    status: 'PASS',
    detail: `Dump file located: ${resolvedDump}`,
  });

  const dumpStat = fs.statSync(resolvedDump);
  if (dumpStat.size === 0) {
    checks.push({
      name: 'Dump File Non-Empty Check',
      status: 'FAIL',
      detail: 'Dump file is 0 bytes (empty file).',
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: 'Dump file is empty.',
    };
  }
  checks.push({
    name: 'Dump File Non-Empty Check',
    status: 'PASS',
    detail: `Dump file size: ${dumpStat.size} bytes`,
  });

  // 2. PostgreSQL Custom Format header verification
  const formatHeader = verifyPostgresCustomDumpHeader(resolvedDump);
  if (!formatHeader.isValid) {
    checks.push({
      name: 'PostgreSQL Custom Format Header Check',
      status: 'FAIL',
      detail: formatHeader.error || 'Invalid header',
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: formatHeader.error,
    };
  }
  checks.push({
    name: 'PostgreSQL Custom Format Header Check',
    status: 'PASS',
    detail: `Valid PGDMP header detected (Version ${formatHeader.version?.major}.${formatHeader.version?.minor})`,
  });

  // 3. Manifest existence and validation
  let manifest: BackupManifest;
  try {
    manifest = readAndValidateManifest(manifestPath);
    checks.push({
      name: 'Manifest Schema & Integrity Check',
      status: 'PASS',
      detail: `Manifest verified (Version ${manifest.manifestVersion}, Source DB: ${manifest.database})`,
    });
  } catch (err) {
    checks.push({
      name: 'Manifest Schema & Integrity Check',
      status: 'FAIL',
      detail: (err as Error).message,
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: (err as Error).message,
    };
  }

  // 4. File size check against manifest
  if (dumpStat.size !== manifest.dumpFileSize) {
    checks.push({
      name: 'Dump File Size Consistency',
      status: 'FAIL',
      detail: `File size mismatch. Disk: ${dumpStat.size} bytes, Manifest: ${manifest.dumpFileSize} bytes`,
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: `Size mismatch: disk=${dumpStat.size}, manifest=${manifest.dumpFileSize}`,
    };
  }
  checks.push({
    name: 'Dump File Size Consistency',
    status: 'PASS',
    detail: `File size matches manifest (${dumpStat.size} bytes)`,
  });

  // 5. SHA-256 verification
  const computedSha256 = calculateFileSha256(resolvedDump);
  if (computedSha256 !== manifest.dumpFileSha256) {
    checks.push({
      name: 'Cryptographic SHA-256 Checksum Match',
      status: 'FAIL',
      detail: `Hash mismatch. Computed: ${computedSha256}, Manifest: ${manifest.dumpFileSha256}`,
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: `SHA256 mismatch: computed=${computedSha256}, manifest=${manifest.dumpFileSha256}`,
    };
  }
  checks.push({
    name: 'Cryptographic SHA-256 Checksum Match',
    status: 'PASS',
    detail: `SHA-256 matched: ${computedSha256}`,
  });

  // 6. Engine Version compatibility check
  const expectedEngine = options.expectedEngineVersion || 'PostgreSQL 17';
  if (!manifest.engineVersion.includes('17')) {
    checks.push({
      name: 'PostgreSQL Engine Version Compatibility',
      status: 'FAIL',
      detail: `Manifest engine version '${manifest.engineVersion}' is not compatible with expected '${expectedEngine}'`,
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: `Engine version incompatibility: ${manifest.engineVersion}`,
    };
  }
  checks.push({
    name: 'PostgreSQL Engine Version Compatibility',
    status: 'PASS',
    detail: `Engine version compatible: ${manifest.engineVersion}`,
  });

  // 7. Target Isolation & Security Check
  const isolation = validateTargetIsolation(options.target);
  if (!isolation.isValid) {
    checks.push({
      name: 'Target Database Isolation Guard',
      status: 'FAIL',
      detail: isolation.error || 'Target rejected by security guard',
    });
    return {
      status: 'PREFLIGHT_FAILED',
      dryRun: true,
      liveRestoreExecuted: false,
      checks,
      target: options.target,
      errorSummary: isolation.error,
    };
  }
  checks.push({
    name: 'Target Database Isolation Guard',
    status: 'PASS',
    detail: `Target '${options.target.database}' on '${options.target.host}:${options.target.port}' approved as safe scratch environment`,
  });

  // 8. Dry-run Guarantee Check
  checks.push({
    name: 'Dry-Run Enforced Guarantee',
    status: 'PASS',
    detail: 'Dry-Run mode active. Zero database modifications or restore commands issued.',
  });

  return {
    status: 'READY_FOR_RESTORE_DRY_RUN_PASS',
    dryRun: true,
    liveRestoreExecuted: false,
    checks,
    target: options.target,
    dumpInfo: {
      path: resolvedDump,
      size: dumpStat.size,
      sha256: computedSha256,
      format: 'PostgreSQL Custom (-Fc)',
    },
  };
}

// ============================================================================
// Retention Policy Preview (Zero File Deletions)
// ============================================================================

/**
 * Previews retention policy candidates without deleting any files.
 * Returns lists of files to keep vs candidates for future pruning.
 */
export function previewRetentionPolicy(options: RetentionPolicyOptions): RetentionPreviewResult {
  const resolvedDir = path.resolve(options.backupDir);
  if (!fs.existsSync(resolvedDir)) {
    return {
      totalBackups: 0,
      retainedCount: 0,
      candidateExpiredCount: 0,
      retainedFiles: [],
      candidateExpiredFiles: [],
      deletedCount: 0,
      message: `Directory does not exist: ${resolvedDir}`,
    };
  }

  const entries = fs.readdirSync(resolvedDir);
  const dumpFiles = entries.filter((f) => f.endsWith('.dump'));

  const keepCount = options.keepCount ?? 5;
  const keepDays = options.keepDays ?? 7;
  const now = Date.now();
  const maxAgeMs = keepDays * 24 * 60 * 60 * 1000;

  // Gather stats for all dump files
  const backups = dumpFiles.map((name) => {
    const fullPath = path.join(resolvedDir, name);
    const stat = fs.statSync(fullPath);
    return {
      name,
      fullPath,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
    };
  });

  // Sort descending by modified time (newest first)
  backups.sort((a, b) => b.mtimeMs - a.mtimeMs);

  const retainedFiles: string[] = [];
  const candidateExpiredFiles: string[] = [];

  backups.forEach((backup, index) => {
    const isWithinKeepCount = index < keepCount;
    const isWithinKeepDays = now - backup.mtimeMs < maxAgeMs;

    // Retained if within keep count OR within keep days
    if (isWithinKeepCount || isWithinKeepDays) {
      retainedFiles.push(backup.name);
    } else {
      candidateExpiredFiles.push(backup.name);
    }
  });

  return {
    totalBackups: backups.length,
    retainedCount: retainedFiles.length,
    candidateExpiredCount: candidateExpiredFiles.length,
    retainedFiles,
    candidateExpiredFiles,
    deletedCount: 0, // Enforced zero deletions
    message: `Retention policy preview complete. Total: ${backups.length}, Retained: ${retainedFiles.length}, Candidates for expiration: ${candidateExpiredFiles.length}. ZERO files deleted.`,
  };
}
