/**
 * CODE TO KNOW (碼上學) - Database Backup & Restore Automated Test Suite
 * File: backend/tests/db-backup-restore.test.ts
 * Task: CTK-CORE-01-DB-003
 *
 * Covers 12 required verification scenarios from Section 七:
 * 1. Backup filename generation
 * 2. Manifest format & schema validation
 * 3. SHA-256 calculation correctness
 * 4. SHA-256 mismatch rejection
 * 5. Missing backup file rejection
 * 6. Incomplete/invalid Manifest rejection
 * 7. Production & Supabase target rejection
 * 8. Non-scratch database target rejection
 * 9. Dry Run guarantee (0 live restore execution)
 * 10. Backup failure error handling
 * 11. Non-overwrite policy on existing dump
 * 12. Retention policy preview (0 files deleted)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  generateBackupFilename,
  formatFilenameTimestamp,
  createBackupManifest,
  readAndValidateManifest,
  calculateFileSha256,
  verifyPostgresCustomDumpHeader,
  validateTargetIsolation,
  runRestorePreflight,
  previewRetentionPolicy,
  ManifestSchema,
  PG_CUSTOM_FORMAT_MAGIC,
} from '../src/utils/databaseBackupRestore.js';

describe('CTK-CORE-01-DB-003: Database Backup & Restore Automation Suite', () => {
  const testDir = path.resolve(process.cwd(), 'tmp/test_backup_restore_' + Date.now());

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // Helper to create a valid mock PostgreSQL custom format dump
  function createMockPostgresDump(filePath: string, customPayload = 'MOCK_DATA'): string {
    const header = Buffer.concat([
      PG_CUSTOM_FORMAT_MAGIC, // 5 bytes: PGDMP
      Buffer.from([1, 14, 0]), // version 1.14
    ]);
    const payload = Buffer.from(customPayload, 'utf-8');
    const fullBuffer = Buffer.concat([header, payload]);
    fs.writeFileSync(filePath, fullBuffer, { flag: 'w' });
    return filePath;
  }

  // --------------------------------------------------------------------------
  // Test 1: Backup filename generation
  // --------------------------------------------------------------------------
  it('1. should generate unique timestamped backup filenames containing database name and entropy', () => {
    const fixedDate = new Date('2026-11-25T14:30:00.000Z');
    const filename1 = generateBackupFilename('ctk_core01_db001_scratch', 'ctk_backup', fixedDate);
    const filename2 = generateBackupFilename('ctk_core01_db001_scratch', 'ctk_backup', fixedDate);

    expect(filename1).toMatch(/^ctk_backup_ctk_core01_db001_scratch_20261125_143000_[a-f0-9]{6}\.dump$/);
    expect(filename2).toMatch(/^ctk_backup_ctk_core01_db001_scratch_20261125_143000_[a-f0-9]{6}\.dump$/);
    // Filenames must be unique due to random entropy
    expect(filename1).not.toBe(filename2);
  });

  // --------------------------------------------------------------------------
  // Test 2: Manifest format & schema validation
  // --------------------------------------------------------------------------
  it('2. should enforce strict Manifest schema with zero secret leakage', () => {
    const dumpPath = path.join(testDir, 'test.dump');
    createMockPostgresDump(dumpPath);

    const { manifest, manifestPath } = createBackupManifest({
      database: 'ctk_core01_db001_scratch',
      host: '127.0.0.1',
      port: 5433,
      engineVersion: 'PostgreSQL 17.11',
      dumpPath,
      environment: 'local-sandbox',
    });

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(manifest.manifestVersion).toBe('1.0.0');
    expect(manifest.database).toBe('ctk_core01_db001_scratch');
    expect(manifest.engineVersion).toBe('PostgreSQL 17.11');
    expect(manifest.dumpFileSha256).toMatch(/^[A-F0-9]{64}$/);

    // Verify zero secret fields exist in manifest
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const secretKeys = ['password', 'secret', 'token', 'connectionString', 'key'];
    for (const key of secretKeys) {
      expect(manifestJson).not.toHaveProperty(key);
    }
  });

  // --------------------------------------------------------------------------
  // Test 3: SHA-256 calculation correctness
  // --------------------------------------------------------------------------
  it('3. should accurately calculate SHA-256 checksum matching cryptographic digest', () => {
    const dumpPath = path.join(testDir, 'sha_test.dump');
    const content = Buffer.from('TEST_PAYLOAD_FOR_HASH_VERIFICATION', 'utf-8');
    fs.writeFileSync(dumpPath, content);

    const expectedHash = crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
    const actualHash = calculateFileSha256(dumpPath);

    expect(actualHash).toBe(expectedHash);
    expect(actualHash.length).toBe(64);
  });

  // --------------------------------------------------------------------------
  // Test 4: SHA-256 mismatch rejection
  // --------------------------------------------------------------------------
  it('4. should reject preflight when SHA-256 hash does not match Manifest', () => {
    const dumpPath = path.join(testDir, 'tampered.dump');
    createMockPostgresDump(dumpPath, 'ORIGINAL_CONTENT');

    const { manifestPath } = createBackupManifest({
      database: 'ctk_core01_db001_scratch',
      host: '127.0.0.1',
      port: 5433,
      engineVersion: 'PostgreSQL 17.11',
      dumpPath,
    });

    // Tamper with the dump file content after manifest creation (preserving exact file size)
    const tamperedContent = Buffer.concat([
      PG_CUSTOM_FORMAT_MAGIC,
      Buffer.from([1, 14, 0]),
      Buffer.from('TAMPERED_DATA', 'utf-8'),
    ]);
    // Pad to match original file size so only hash differs
    const originalSize = fs.statSync(dumpPath).size;
    const padded = Buffer.alloc(originalSize);
    tamperedContent.copy(padded, 0);
    fs.writeFileSync(dumpPath, padded);

    const result = runRestorePreflight({
      dumpPath,
      manifestPath,
      target: {
        host: '127.0.0.1',
        port: 5433,
        database: 'ctk_core01_db001_restore_scratch',
      },
    });

    expect(result.status).toBe('PREFLIGHT_FAILED');
    expect(result.errorSummary).toContain('SHA256 mismatch');
    const failedCheck = result.checks.find((c) => c.name === 'Cryptographic SHA-256 Checksum Match');
    expect(failedCheck?.status).toBe('FAIL');
  });

  // --------------------------------------------------------------------------
  // Test 5: Missing backup file rejection
  // --------------------------------------------------------------------------
  it('5. should reject preflight immediately when backup dump file is missing', () => {
    const nonExistentPath = path.join(testDir, 'non_existent.dump');

    const result = runRestorePreflight({
      dumpPath: nonExistentPath,
      target: {
        host: '127.0.0.1',
        port: 5433,
        database: 'ctk_core01_db001_restore_scratch',
      },
    });

    expect(result.status).toBe('PREFLIGHT_FAILED');
    expect(result.errorSummary).toContain('Dump file missing');
    const fileCheck = result.checks.find((c) => c.name === 'Dump File Existence');
    expect(fileCheck?.status).toBe('FAIL');
  });

  // --------------------------------------------------------------------------
  // Test 6: Incomplete / invalid Manifest rejection
  // --------------------------------------------------------------------------
  it('6. should reject preflight when Manifest is corrupted, incomplete, or invalid JSON', () => {
    const dumpPath = path.join(testDir, 'corrupt_manifest.dump');
    createMockPostgresDump(dumpPath);
    const manifestPath = `${dumpPath}.manifest.json`;

    // Write incomplete JSON missing required fields
    fs.writeFileSync(manifestPath, JSON.stringify({ manifestVersion: '1.0.0', database: 'incomplete' }));

    const result = runRestorePreflight({
      dumpPath,
      manifestPath,
      target: {
        host: '127.0.0.1',
        port: 5433,
        database: 'ctk_core01_db001_restore_scratch',
      },
    });

    expect(result.status).toBe('PREFLIGHT_FAILED');
    expect(result.errorSummary).toContain('Manifest failed schema validation');
  });

  // --------------------------------------------------------------------------
  // Test 7: Production & Supabase target rejection
  // --------------------------------------------------------------------------
  it('7. should strictly reject any Cloud, Production, or Supabase host targets', () => {
    const forbiddenHosts = [
      'db.xyz.supabase.co',
      'api.supabase.com',
      'production-db.internal',
      'rds.amazonaws.com',
      'postgres.render.com',
    ];

    for (const host of forbiddenHosts) {
      const check = validateTargetIsolation({
        host,
        port: 5432,
        database: 'ctk_core01_db001_scratch',
      });
      expect(check.isValid).toBe(false);
      expect(check.error).toMatch(/CLOUD REJECTED|UNAPPROVED HOST/);
    }
  });

  // --------------------------------------------------------------------------
  // Test 8: Non-scratch database target rejection
  // --------------------------------------------------------------------------
  it('8. should strictly reject non-scratch, main, system, and production database names', () => {
    const forbiddenDbs = [
      'code_to_know',
      'postgres',
      'template0',
      'template1',
      'production',
      'main',
      'master',
      'ctk_core01_production',
      'my_custom_db',
    ];

    for (const database of forbiddenDbs) {
      const check = validateTargetIsolation({
        host: '127.0.0.1',
        port: 5433,
        database,
      });
      expect(check.isValid).toBe(false);
      expect(check.error).toMatch(/PROTECTED DATABASE|NON-SCRATCH REJECTED/);
    }

    // Approved scratch database must pass
    const approvedCheck = validateTargetIsolation({
      host: '127.0.0.1',
      port: 5433,
      database: 'ctk_core01_db001_restore_scratch',
    });
    expect(approvedCheck.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 9: Dry Run guarantee (0 live restore execution)
  // --------------------------------------------------------------------------
  it('9. should guarantee Dry-Run execution with zero database write operations', () => {
    const dumpPath = path.join(testDir, 'dryrun_valid.dump');
    createMockPostgresDump(dumpPath);

    const { manifestPath } = createBackupManifest({
      database: 'ctk_core01_db001_scratch',
      host: '127.0.0.1',
      port: 5433,
      engineVersion: 'PostgreSQL 17.11',
      dumpPath,
    });

    const result = runRestorePreflight({
      dumpPath,
      manifestPath,
      target: {
        host: '127.0.0.1',
        port: 5433,
        database: 'ctk_core01_db001_restore_scratch',
      },
    });

    expect(result.status).toBe('READY_FOR_RESTORE_DRY_RUN_PASS');
    expect(result.dryRun).toBe(true);
    expect(result.liveRestoreExecuted).toBe(false);
    expect(result.checks.every((c) => c.status === 'PASS')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Test 10: Backup failure error handling
  // --------------------------------------------------------------------------
  it('10. should handle missing or empty dump files during manifest creation gracefully', () => {
    const nonExistent = path.join(testDir, 'ghost.dump');

    expect(() => {
      createBackupManifest({
        database: 'ctk_core01_db001_scratch',
        host: '127.0.0.1',
        port: 5433,
        engineVersion: 'PostgreSQL 17.11',
        dumpPath: nonExistent,
      });
    }).toThrow(/Dump file does not exist/);

    const emptyDump = path.join(testDir, 'empty.dump');
    fs.writeFileSync(emptyDump, Buffer.alloc(0));

    expect(() => {
      createBackupManifest({
        database: 'ctk_core01_db001_scratch',
        host: '127.0.0.1',
        port: 5433,
        engineVersion: 'PostgreSQL 17.11',
        dumpPath: emptyDump,
      });
    }).toThrow(/Dump file size is 0 bytes/);
  });

  // --------------------------------------------------------------------------
  // Test 11: Non-overwrite policy on existing dump & manifest
  // --------------------------------------------------------------------------
  it('11. should refuse to overwrite an existing manifest file', () => {
    const dumpPath = path.join(testDir, 'no_overwrite.dump');
    createMockPostgresDump(dumpPath);

    // First creation
    createBackupManifest({
      database: 'ctk_core01_db001_scratch',
      host: '127.0.0.1',
      port: 5433,
      engineVersion: 'PostgreSQL 17.11',
      dumpPath,
    });

    // Second creation must throw to prevent overwrite
    expect(() => {
      createBackupManifest({
        database: 'ctk_core01_db001_scratch',
        host: '127.0.0.1',
        port: 5433,
        engineVersion: 'PostgreSQL 17.11',
        dumpPath,
      });
    }).toThrow(/Manifest file already exists and overwrite is forbidden/);
  });

  // --------------------------------------------------------------------------
  // Test 12: Retention policy preview (0 files deleted)
  // --------------------------------------------------------------------------
  it('12. should preview retention candidates without deleting any files (0 deletions guaranteed)', () => {
    const backupDir = path.join(testDir, 'retention_test');
    fs.mkdirSync(backupDir, { recursive: true });

    // Create 7 mock dumps
    const createdFiles: string[] = [];
    for (let i = 1; i <= 7; i++) {
      const fileName = `ctk_backup_scratch_2026112${i}_000000_abcde${i}.dump`;
      const fullPath = path.join(backupDir, fileName);
      createMockPostgresDump(fullPath);
      // Stagger mtime so they have predictable ordering
      const time = new Date(2026, 10, i).getTime() / 1000;
      fs.utimesSync(fullPath, time, time);
      createdFiles.push(fileName);
    }

    const preview = previewRetentionPolicy({
      backupDir,
      keepCount: 4,
      keepDays: 3,
    });

    expect(preview.totalBackups).toBe(7);
    expect(preview.retainedCount).toBe(4);
    expect(preview.candidateExpiredCount).toBe(3);
    expect(preview.deletedCount).toBe(0);

    // Verify all 7 files still exist on disk (strict 0 deletion)
    const remainingFiles = fs.readdirSync(backupDir);
    expect(remainingFiles.length).toBe(7);
    for (const f of createdFiles) {
      expect(remainingFiles).toContain(f);
    }
  });
});
