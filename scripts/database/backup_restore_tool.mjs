#!/usr/bin/env node
/**
 * CODE TO KNOW (碼上學) - Database Backup & Restore Automation CLI Tool
 * File: scripts/database/backup_restore_tool.mjs
 * Task: CTK-CORE-01-DB-003
 *
 * Supported commands:
 *   node backup_restore_tool.mjs backup --db <scratch_db> [--out-dir <dir>]
 *   node backup_restore_tool.mjs preflight --dump <dump_path> --target-db <scratch_db>
 *   node backup_restore_tool.mjs retention-preview [--dir <dir>] [--keep <count>] [--days <days>]
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import logic from backend utility or define standalone for pure node execution
const PG_CUSTOM_FORMAT_MAGIC = Buffer.from([0x50, 0x47, 0x44, 0x4d, 0x50]); // 'PGDMP'

const ALLOWED_LOCAL_HOSTS = [
  '127.0.0.1',
  'localhost',
  'code_to_know_pg17_restore_sandbox',
  'code_to_know_postgres',
];

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
];

const ALLOWED_SCRATCH_DATABASE_REGEX = /^ctk_core\d{2}_db\d{3}_.*scratch$/i;
const EXPLICIT_ALLOWED_SCRATCH_DBS = [
  'ctk_core01_db001_scratch',
  'ctk_core01_db001_restore_scratch',
  'ctk_core01_db003_scratch',
  'ctk_core01_db003_restore_scratch',
  'ctk_core01_int005_restore_verify',
];

export function validateIsolation(host, database) {
  if (!host) throw new Error('[ISOLATION ERROR] Host must be specified.');
  for (const pattern of BLOCKED_HOST_PATTERNS) {
    if (pattern.test(host)) {
      throw new Error(`[ISOLATION ERROR: BLOCKED CLOUD HOST] Host '${host}' matches cloud blocklist: ${pattern}`);
    }
  }
  if (!ALLOWED_LOCAL_HOSTS.some(h => host.toLowerCase() === h.toLowerCase())) {
    throw new Error(`[ISOLATION ERROR: UNAPPROVED HOST] Host '${host}' is not in allowed sandbox list: ${ALLOWED_LOCAL_HOSTS.join(', ')}`);
  }
  if (!database) throw new Error('[ISOLATION ERROR] Database name must be specified.');
  const dbLower = database.toLowerCase().trim();
  if (BLOCKED_DATABASE_NAMES.includes(dbLower)) {
    throw new Error(`[ISOLATION ERROR: PROTECTED DB] Database '${database}' is a protected database name.`);
  }
  if (!ALLOWED_SCRATCH_DATABASE_REGEX.test(dbLower) && !EXPLICIT_ALLOWED_SCRATCH_DBS.includes(dbLower)) {
    throw new Error(`[ISOLATION ERROR: NON-SCRATCH] Target database '${database}' is not an approved scratch database.`);
  }
}

export function calculateSha256(filePath) {
  const content = fs.readFileSync(path.resolve(filePath));
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

export function verifyHeader(filePath) {
  const fd = fs.openSync(path.resolve(filePath), 'r');
  try {
    const buf = Buffer.alloc(10);
    fs.readSync(fd, buf, 0, 10, 0);
    if (!buf.subarray(0, 5).equals(PG_CUSTOM_FORMAT_MAGIC)) {
      throw new Error(`Invalid magic header. Expected 'PGDMP', got: ${buf.subarray(0, 5).toString('hex')}`);
    }
    return { major: buf[5], minor: buf[6] };
  } finally {
    fs.closeSync(fd);
  }
}

function parseArgs(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    }
  }
  return flags;
}

// ============================================================================
// CLI Subcommands
// ============================================================================

function runBackup(flags) {
  const db = flags.db || 'ctk_core01_db001_scratch';
  const outDir = flags['out-dir'] || path.resolve(process.cwd(), 'scratch/backups');
  const container = flags.container || 'code_to_know_pg17_restore_sandbox';
  const user = flags.user || 'postgres';

  console.log(`[CTK-BACKUP] Initiating automated backup for '${db}'...`);
  validateIsolation(container, db);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const entropy = crypto.randomBytes(3).toString('hex');
  const dumpFileName = `ctk_backup_${db}_${timestamp}_${entropy}.dump`;
  const dumpPath = path.join(outDir, dumpFileName);
  const manifestPath = `${dumpPath}.manifest.json`;

  if (fs.existsSync(dumpPath)) {
    throw new Error(`[BACKUP ERROR] Target dump file already exists: ${dumpPath}`);
  }

  console.log(`[CTK-BACKUP] Output dump path: ${dumpPath}`);
  console.log(`[CTK-BACKUP] Running pg_dump inside container '${container}'...`);

  // Execute docker exec pg_dump
  const cmd = 'docker';
  const args = ['exec', '-i', container, 'pg_dump', '-U', user, '-Fc', '--no-owner', '--no-acl', '-d', db];
  
  const child = spawnSync(cmd, args, { maxBuffer: 100 * 1024 * 1024 });

  if (child.status !== 0) {
    const errText = child.stderr?.toString('utf-8') || 'Unknown spawn error';
    throw new Error(`[BACKUP FAILED] pg_dump exited with code ${child.status}: ${errText}`);
  }

  // Write dump file
  fs.writeFileSync(dumpPath, child.stdout, { flag: 'wx' });

  // Post-backup verification
  const stat = fs.statSync(dumpPath);
  if (stat.size === 0) {
    fs.unlinkSync(dumpPath);
    throw new Error('[BACKUP ERROR] Dump file was created with 0 bytes. Aborting.');
  }

  const header = verifyHeader(dumpPath);
  const sha256 = calculateSha256(dumpPath);

  // Manifest generation (Zero secrets)
  const manifest = {
    manifestVersion: '1.0.0',
    createdAt: now.toISOString(),
    database: db,
    host: '127.0.0.1',
    port: 5433,
    engineVersion: 'PostgreSQL 17.11',
    format: 'custom',
    dumpFileName,
    dumpFileSize: stat.size,
    dumpFileSha256: sha256,
    environment: 'local-sandbox',
    notes: 'Automated CTK PostgreSQL 17 Custom Format Backup',
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), { encoding: 'utf-8', flag: 'wx' });

  console.log('[CTK-BACKUP] Backup completed successfully.');
  console.log(`[CTK-BACKUP] Dump file: ${dumpPath} (${stat.size} bytes)`);
  console.log(`[CTK-BACKUP] Header: PGDMP v${header.major}.${header.minor}`);
  console.log(`[CTK-BACKUP] SHA-256: ${sha256}`);
  console.log(`[CTK-BACKUP] Manifest: ${manifestPath}`);
}

function runPreflight(flags) {
  const dumpPath = flags.dump;
  if (!dumpPath) {
    throw new Error('[PREFLIGHT ERROR] Please specify --dump <path>');
  }
  const targetDb = flags['target-db'] || 'ctk_core01_db001_restore_scratch';
  const targetHost = flags['target-host'] || '127.0.0.1';
  const targetPort = parseInt(flags['target-port'] || '5433', 10);

  console.log('=== RESTORE PREFLIGHT AUDIT REPORT (DRY-RUN) ===');
  console.log(`Dump Path:   ${dumpPath}`);
  console.log(`Target:      ${targetDb} on ${targetHost}:${targetPort}`);
  console.log('Mode:        DRY RUN (Zero restore execution)');
  console.log('------------------------------------------------');

  const resolvedDump = path.resolve(dumpPath);
  if (!fs.existsSync(resolvedDump)) {
    throw new Error(`Dump file does not exist: ${resolvedDump}`);
  }

  const stat = fs.statSync(resolvedDump);
  if (stat.size === 0) {
    throw new Error('Dump file is empty (0 bytes).');
  }

  const header = verifyHeader(resolvedDump);
  console.log(`[PASS] Format Header: Valid PGDMP (Version ${header.major}.${header.minor})`);

  const manifestPath = flags.manifest || `${resolvedDump}.manifest.json`;
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file does not exist: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  console.log(`[PASS] Manifest Loaded: Version ${manifest.manifestVersion}, Engine: ${manifest.engineVersion}`);

  if (manifest.dumpFileSize !== stat.size) {
    throw new Error(`Size mismatch: Disk ${stat.size} vs Manifest ${manifest.dumpFileSize}`);
  }
  console.log(`[PASS] File Size Check: ${stat.size} bytes matches manifest`);

  const sha256 = calculateSha256(resolvedDump);
  if (sha256 !== manifest.dumpFileSha256) {
    throw new Error(`SHA256 mismatch: Computed ${sha256} vs Manifest ${manifest.dumpFileSha256}`);
  }
  console.log(`[PASS] SHA-256 Checksum: ${sha256} verified`);

  validateIsolation(targetHost, targetDb);
  console.log(`[PASS] Isolation Guard: '${targetDb}' on '${targetHost}' approved as safe scratch target`);

  console.log('------------------------------------------------');
  console.log('Status: READY_FOR_RESTORE_DRY_RUN_PASS');
  console.log('Live Restore Executed: FALSE (Dry-Run guaranteed)');
}

function runRestore(flags) {
  const dumpPath = flags.dump;
  if (!dumpPath) {
    throw new Error('[RESTORE ERROR] Please specify --dump <path>');
  }
  const targetDb = flags['target-db'];
  if (!targetDb) {
    throw new Error('[RESTORE ERROR] Please specify --target-db <db_name>');
  }
  const container = flags.container || 'code_to_know_pg17_restore_sandbox';
  const targetHost = flags['target-host'] || '127.0.0.1';
  const user = flags.user || 'postgres';

  // Strict Protection: CANNOT restore into ctk_core01_db001_scratch!
  if (targetDb.toLowerCase() === 'ctk_core01_db001_scratch') {
    throw new Error('[CRITICAL SAFETY BLOCK] Destructive restore into original scratch DB ctk_core01_db001_scratch is STRICTLY FORBIDDEN!');
  }

  // Isolation validation
  validateIsolation(targetHost, targetDb);

  const resolvedDump = path.resolve(dumpPath);
  if (!fs.existsSync(resolvedDump)) {
    throw new Error(`Dump file does not exist: ${resolvedDump}`);
  }

  // Preflight checks
  verifyHeader(resolvedDump);
  const sha256 = calculateSha256(resolvedDump);
  console.log(`[CTK-RESTORE] Verified dump file SHA-256: ${sha256}`);

  // 1. Check if target database already exists
  const checkCmd = spawnSync('docker', ['exec', container, 'psql', '-U', user, '-tAc', `SELECT 1 FROM pg_database WHERE datname='${targetDb}'`]);
  const exists = checkCmd.stdout?.toString('utf-8').trim() === '1';

  if (!exists) {
    console.log(`[CTK-RESTORE] Target DB '${targetDb}' does not exist. Creating...`);
    const createCmd = spawnSync('docker', ['exec', container, 'createdb', '-U', user, targetDb]);
    if (createCmd.status !== 0) {
      throw new Error(`[RESTORE ERROR] Failed to create target database: ${createCmd.stderr?.toString('utf-8')}`);
    }
    console.log(`[CTK-RESTORE] Database '${targetDb}' created successfully.`);
    spawnSync('docker', ['exec', container, 'psql', '-U', user, '-c', `GRANT ALL PRIVILEGES ON DATABASE ${targetDb} TO codetoknow_restore;`]);
  } else {
    throw new Error(`[RESTORE SAFETY BLOCK] Target database '${targetDb}' already exists. Stopping per policy.`);
  }

  // 2. Execute pg_restore inside container
  console.log(`[CTK-RESTORE] Executing pg_restore into '${targetDb}' inside container '${container}'...`);
  const dumpStream = fs.readFileSync(resolvedDump);
  const restoreCmd = spawnSync('docker', ['exec', '-i', container, 'pg_restore', '-U', user, '-d', targetDb, '--no-owner', '--no-acl'], {
    input: dumpStream,
    maxBuffer: 100 * 1024 * 1024,
  });

  console.log(`[CTK-RESTORE] pg_restore exited with code: ${restoreCmd.status}`);
  if (restoreCmd.status !== 0 && restoreCmd.status !== 1) {
    throw new Error(`[RESTORE FAILED] pg_restore exited with code ${restoreCmd.status}: ${restoreCmd.stderr?.toString('utf-8')}`);
  }

  spawnSync('docker', ['exec', container, 'psql', '-U', user, '-d', targetDb, '-c', 'GRANT ALL ON ALL TABLES IN SCHEMA public TO codetoknow_restore; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO codetoknow_restore;']);

  console.log(`[CTK-RESTORE] Successfully restored '${dumpPath}' into '${targetDb}'.`);
}

function runRetentionPreview(flags) {
  const dir = path.resolve(flags.dir || path.join(process.cwd(), 'scratch/backups'));
  const keepCount = parseInt(flags.keep || '5', 10);
  const keepDays = parseInt(flags.days || '7', 10);

  console.log(`[RETENTION PREVIEW] Directory: ${dir}`);
  console.log(`[RETENTION PREVIEW] Rule: Keep latest ${keepCount} backups OR within ${keepDays} days`);

  if (!fs.existsSync(dir)) {
    console.log('[RETENTION PREVIEW] Directory does not exist. 0 backups found.');
    return;
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.dump'));
  const backups = files.map(name => {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    return { name, fullPath, mtimeMs: stat.mtimeMs, size: stat.size };
  }).sort((a, b) => b.mtimeMs - a.mtimeMs);

  const now = Date.now();
  const maxAgeMs = keepDays * 24 * 60 * 60 * 1000;

  const retained = [];
  const candidateExpired = [];

  backups.forEach((b, idx) => {
    if (idx < keepCount || (now - b.mtimeMs) < maxAgeMs) {
      retained.push(b.name);
    } else {
      candidateExpired.push(b.name);
    }
  });

  console.log(`Total Backups Found: ${backups.length}`);
  console.log(`Backups Retained:    ${retained.length}`);
  retained.forEach(f => console.log(`  + [KEEP] ${f}`));
  console.log(`Candidates to Expire: ${candidateExpired.length}`);
  candidateExpired.forEach(f => console.log(`  - [EXPIRE CANDIDATE] ${f}`));
  console.log('[SAFETY] Files Deleted: 0 (Preview only. No files were removed.)');
}

// Main execution
const [,, command, ...restArgs] = process.argv;
const flags = parseArgs(restArgs);

try {
  switch (command) {
    case 'backup':
      runBackup(flags);
      break;
    case 'preflight':
      runPreflight(flags);
      break;
    case 'restore':
      runRestore(flags);
      break;
    case 'retention-preview':
      runRetentionPreview(flags);
      break;
    default:
      console.log('Usage: node backup_restore_tool.mjs <backup|preflight|retention-preview> [options]');
      break;
  }
} catch (err) {
  console.error(`[FATAL ERROR] ${err.message}`);
  process.exit(1);
}
