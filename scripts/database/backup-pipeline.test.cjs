/**
 * CODE TO KNOW (碼上學) - 資料庫備份與加密整合管線安全自動化測試
 * File: scripts/database/backup-pipeline.test.cjs
 * 
 * 測試標準依據：PHASE 3-C-1 授權規格 (10 大離線整合測試)
 * 核心保證：
 * 1. 100% 離線測試，絕不連線 Supabase 或任何正式雲端資料庫。
 * 2. 僅使用合成測試資料與記憶體生成之專屬測試金鑰，絕不使用正式金鑰。
 * 3. 測試完成後自動清理測試專用暫存目錄，不殘留檔案。
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert');
const { execSync, spawnSync } = require('node:child_process');

const {
  MAGIC_HEADER,
  CURRENT_VERSION,
  generateKey,
  parseKey,
  encryptFile,
  decryptFile,
} = require('./backup-crypto.cjs');

const {
  calculateFileSha256,
  verifyContainerFormat,
  executeBackupEncryptionPipeline,
} = require('./backup-pipeline.cjs');

const TEST_DIR = path.resolve(__dirname, '../../tmp/backup_pipeline_integration_test_' + Date.now());

function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}

function teardown() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

/**
 * 建立模擬的 PostgreSQL Custom Format 測試備份檔 (包含 PGDMP 魔術位元組)
 */
function createSyntheticDump(filePath, sizeKb = 64) {
  const resolved = path.resolve(filePath);
  const magicPgDump = Buffer.from('PGDMP\x01\x0f\x00', 'binary'); // PostgreSQL 17 Custom dump header
  const payload = crypto.randomBytes(sizeKb * 1024 - magicPgDump.length);
  const fullDump = Buffer.concat([magicPgDump, payload]);
  fs.writeFileSync(resolved, fullDump);
  return resolved;
}

async function runAllPipelineTests() {
  setup();
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  ✓ [TC-${String(total).padStart(2, '0')}] PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ [TC-${String(total).padStart(2, '0')}] FAIL: ${name}`);
      console.error(`    Error: ${err.message}`);
    }
  }

  console.log('\n==========================================================');
  console.log('  CODE TO KNOW 備份與加密管線 14 大離線整合測試 (Phase 3-C-1 ~ 3-C-3)');
  console.log('==========================================================\n');

  const testKey = generateKey();
  const wrongKey = generateKey();

  // TC-01: 正常備份與加密流程
  await test('正常備份與加密流程：合成 Dump 成功封裝至 .c2kb 容器', async () => {
    const rawDump = path.join(TEST_DIR, 'tc01_normal.dump');
    const encFile = path.join(TEST_DIR, 'tc01_normal.dump.c2kb');
    createSyntheticDump(rawDump, 128);

    const result = await executeBackupEncryptionPipeline({
      dumpPath: rawDump,
      encPath: encFile,
      keyHex: testKey,
      keepPlaintext: true,
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(fs.existsSync(encFile), true);

    const containerInfo = verifyContainerFormat(encFile);
    assert.strictEqual(containerInfo.valid, true);
    assert.strictEqual(containerInfo.version, CURRENT_VERSION);
    assert.ok(containerInfo.fileSize > 128 * 1024);
  });

  // TC-02: 正常解密及內容比對
  await test('正常解密及內容比對：解密後 SHA-256 與原始合成 Dump 完全一致', async () => {
    const rawDump = path.join(TEST_DIR, 'tc02_roundtrip.dump');
    const encFile = path.join(TEST_DIR, 'tc02_roundtrip.dump.c2kb');
    const decFile = path.join(TEST_DIR, 'tc02_roundtrip.dec.dump');
    createSyntheticDump(rawDump, 256);

    const originalHash = calculateFileSha256(rawDump);

    await executeBackupEncryptionPipeline({
      dumpPath: rawDump,
      encPath: encFile,
      keyHex: testKey,
      keepPlaintext: true,
    });

    await decryptFile(encFile, decFile, testKey);
    const decryptedHash = calculateFileSha256(decFile);

    assert.strictEqual(decryptedHash, originalHash, 'Decrypted SHA-256 must match original');
  });

  // TC-03: 加密失敗時的處理
  await test('加密失敗時的處理：輸入檔案不存在時安全拋錯，不交付任何不完整檔案', async () => {
    const nonExistent = path.join(TEST_DIR, 'not_found.dump');
    const encFile = path.join(TEST_DIR, 'not_found.dump.c2kb');

    await assert.rejects(
      async () => {
        await executeBackupEncryptionPipeline({
          dumpPath: nonExistent,
          encPath: encFile,
          keyHex: testKey,
        });
      },
      /Plaintext dump file does not exist/
    );

    assert.strictEqual(fs.existsSync(encFile), false, 'Target encrypted file must not be created');
  });

  // TC-04: 金鑰錯誤時的處理
  await test('金鑰錯誤時的處理：使用錯誤金鑰解密立即被 GCM Auth Tag 阻斷', async () => {
    const rawDump = path.join(TEST_DIR, 'tc04_wrongkey.dump');
    const encFile = path.join(TEST_DIR, 'tc04_wrongkey.dump.c2kb');
    const decFile = path.join(TEST_DIR, 'tc04_wrongkey.dec.dump');
    createSyntheticDump(rawDump, 64);

    await executeBackupEncryptionPipeline({
      dumpPath: rawDump,
      encPath: encFile,
      keyHex: testKey,
      keepPlaintext: true,
    });

    await assert.rejects(
      async () => {
        await decryptFile(encFile, decFile, wrongKey);
      },
      /Authentication tag verification failed/
    );

    assert.strictEqual(fs.existsSync(decFile), false, 'Plaintext output must not exist on auth failure');
  });

  // TC-05: 加密檔案遭到篡改時的處理
  await test('加密檔案遭到篡改時的處理：翻轉 1 byte 密文即刻拋錯拒絕解密', async () => {
    const rawDump = path.join(TEST_DIR, 'tc05_tamper.dump');
    const encFile = path.join(TEST_DIR, 'tc05_tamper.dump.c2kb');
    const decFile = path.join(TEST_DIR, 'tc05_tamper.dec.dump');
    createSyntheticDump(rawDump, 64);

    await executeBackupEncryptionPipeline({
      dumpPath: rawDump,
      encPath: encFile,
      keyHex: testKey,
      keepPlaintext: true,
    });

    // 篡改檔案中間第 50 個位元組
    const buf = fs.readFileSync(encFile);
    buf[50] = buf[50] ^ 0xFF; // 位元翻轉
    fs.writeFileSync(encFile, buf);

    await assert.rejects(
      async () => {
        await decryptFile(encFile, decFile, testKey);
      },
      /Authentication tag verification failed/
    );

    assert.strictEqual(fs.existsSync(decFile), false, 'Tampered file must not produce decrypted plaintext');
  });

  // TC-06: 輸出檔案已存在時不得覆蓋
  await test('輸出檔案已存在時不得覆蓋：目標 .c2kb 存在時拒絕覆寫並保護既有檔案', async () => {
    const rawDump = path.join(TEST_DIR, 'tc06_exist.dump');
    const encFile = path.join(TEST_DIR, 'tc06_exist.dump.c2kb');
    createSyntheticDump(rawDump, 64);
    fs.writeFileSync(encFile, Buffer.from('PRE_EXISTING_CONTAINER'));

    await assert.rejects(
      async () => {
        await executeBackupEncryptionPipeline({
          dumpPath: rawDump,
          encPath: encFile,
          keyHex: testKey,
        });
      },
      /Target encrypted file already exists/
    );

    const content = fs.readFileSync(encFile, 'utf8');
    assert.strictEqual(content, 'PRE_EXISTING_CONTAINER', 'Pre-existing file must not be overwritten');
  });

  // TC-07: 暫存檔清理是否只作用於本次建立的檔案
  await test('暫存檔清理精確性：清理機制絕不影響目錄中既有無關之 .tmp 檔案', async () => {
    const rawDump = path.join(TEST_DIR, 'tc07_clean.dump');
    const encFile = path.join(TEST_DIR, 'tc07_clean.dump.c2kb');
    const unrelatedTmp = path.join(TEST_DIR, 'unrelated_user_file.tmp');
    createSyntheticDump(rawDump, 64);
    fs.writeFileSync(unrelatedTmp, 'DO_NOT_DELETE_ME');

    // 故意提供錯誤金鑰長度觸發中途失敗
    await assert.rejects(
      async () => {
        await executeBackupEncryptionPipeline({
          dumpPath: rawDump,
          encPath: encFile,
          keyHex: 'INVALID_SHORT_KEY',
        });
      },
      /Key must be a 64-character/
    );

    assert.strictEqual(fs.existsSync(unrelatedTmp), true, 'Unrelated tmp file must be preserved');
    assert.strictEqual(fs.readFileSync(unrelatedTmp, 'utf8'), 'DO_NOT_DELETE_ME');
  });

  // TC-08: 中途失敗時是否保留必要的原始資料
  await test('中途失敗時保護原始明文：驗證失敗或異常時絕不刪除原始明文備份', async () => {
    const rawDump = path.join(TEST_DIR, 'tc08_preserve.dump');
    const encFile = path.join(TEST_DIR, 'tc08_preserve.dump.c2kb');
    createSyntheticDump(rawDump, 64);

    // 傳入無效金鑰格式觸發管線失敗
    try {
      await executeBackupEncryptionPipeline({
        dumpPath: rawDump,
        encPath: encFile,
        keyHex: 'BAD_KEY',
        keepPlaintext: false, // 即使指定不保留，失敗時亦絕不可刪除
      });
    } catch {}

    assert.strictEqual(fs.existsSync(rawDump), true, 'Original dump must be preserved on pipeline failure');
  });

  // TC-09: 金鑰與敏感資訊是否可能出現在 Log
  await test('敏感資訊日誌防護：全流程 Console/Error 輸出中絕不包含 64 位元金鑰字串', async () => {
    const rawDump = path.join(TEST_DIR, 'tc09_nolog.dump');
    const encFile = path.join(TEST_DIR, 'tc09_nolog.dump.c2kb');
    createSyntheticDump(rawDump, 32);

    let loggedOutput = '';
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => { loggedOutput += args.join(' ') + '\n'; };
    console.error = (...args) => { loggedOutput += args.join(' ') + '\n'; };

    try {
      await executeBackupEncryptionPipeline({
        dumpPath: rawDump,
        encPath: encFile,
        keyHex: testKey,
        keepPlaintext: true,
      });
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    assert.strictEqual(loggedOutput.includes(testKey), false, 'Key string must NEVER appear in console logs');
  });

  // TC-10: Windows PowerShell 執行流程是否正常
  await test('Windows PowerShell 離線整合執行：run_supabase_backup.ps1 -MockDumpPath 與 -DryRun 驗證通過', async () => {
    const mockDump = path.join(TEST_DIR, 'tc10_mock_supabase.dump');
    createSyntheticDump(mockDump, 64);

    const scriptPath = path.resolve(__dirname, 'run_supabase_backup.ps1');

    // 1. 測試 -DryRun 模式
    const dryRunResult = spawnSync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-DryRun'
    ], { encoding: 'utf8' });

    assert.strictEqual(dryRunResult.status, 0, 'DryRun exit code must be 0');
    assert.ok(dryRunResult.stdout.includes('DryRun 測試通過，安全退出'), 'DryRun output verification');

    // 2. 測試 -MockDumpPath 與 -Encrypt 模式 (使用合成 dump，絕不連線 Supabase)
    const mockPipelineResult = spawnSync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-MockDumpPath', mockDump,
      '-Encrypt',
      '-EncryptionKey', testKey,
      '-KeepPlaintext'
    ], { encoding: 'utf8' });

    assert.strictEqual(mockPipelineResult.status, 0, `PowerShell mock pipeline failed: ${mockPipelineResult.stderr}`);
    assert.ok(mockPipelineResult.stdout.includes('解密迴環驗證：PASS'), 'PowerShell output must show verification PASS');

    // 清理本次測試於 CODE-TO-KNOW_BACKUPS 產出之合成資料夾
    const dirMatch = mockPipelineResult.stdout.match(/目錄：(C:\\Users\\user\\Documents\\CODE-TO-KNOW_BACKUPS\\CODE_TO_KNOW_SUPABASE_[0-9_]+)/);
    if (dirMatch && dirMatch[1] && fs.existsSync(dirMatch[1])) {
      fs.rmSync(dirMatch[1], { recursive: true, force: true });
    }
  });

  // TC-11 (SEC-01): 金鑰環境變數生命週期管理
  await test('SEC-01 金鑰生命週期管理：PowerShell 執行後環境變數絕不殘留 BACKUP_ENCRYPTION_KEY', async () => {
    const mockDump = path.join(TEST_DIR, 'tc11_sec01.dump');
    createSyntheticDump(mockDump, 32);
    const scriptPath = path.resolve(__dirname, 'run_supabase_backup.ps1');

    // 啟動 PowerShell 執行並在腳本結束後立即檢查 $env:BACKUP_ENCRYPTION_KEY
    const psCmd = `& '${scriptPath}' -MockDumpPath '${mockDump}' -Encrypt -EncryptionKey '${testKey}' -KeepPlaintext | Out-Null; if ([string]::IsNullOrEmpty($env:BACKUP_ENCRYPTION_KEY)) { exit 0 } else { exit 42 }`;
    const checkResult = spawnSync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-Command', psCmd
    ], { encoding: 'utf8' });

    assert.strictEqual(checkResult.status, 0, 'BACKUP_ENCRYPTION_KEY must be null/empty after execution');

    // 清理產出目錄
    const backupDir = path.resolve('C:/Users/user/Documents/CODE-TO-KNOW_BACKUPS');
    if (fs.existsSync(backupDir)) {
      const subdirs = fs.readdirSync(backupDir).filter(d => d.startsWith('CODE_TO_KNOW_SUPABASE_'));
      for (const d of subdirs) {
        const full = path.join(backupDir, d);
        const infoFile = path.join(full, 'backup_info.json');
        if (fs.existsSync(infoFile)) {
          const info = JSON.parse(fs.readFileSync(infoFile, 'utf8').replace(/^\uFEFF/, ''));
          if (info.mock_mode) {
            fs.rmSync(full, { recursive: true, force: true });
          }
        }
      }
    }
  });

  // TC-12 (SEC-02): Mock 備份來源明確標記
  await test('SEC-02 Mock 備份標記：-MockDumpPath 產出之 backup_info.json 明確標記 mock_mode: true 與 MOCK_DUMP 來源', async () => {
    const mockDump = path.join(TEST_DIR, 'tc12_sec02.dump');
    createSyntheticDump(mockDump, 32);
    const scriptPath = path.resolve(__dirname, 'run_supabase_backup.ps1');

    const runResult = spawnSync('powershell', [
      '-ExecutionPolicy', 'Bypass',
      '-File', scriptPath,
      '-MockDumpPath', mockDump,
      '-Encrypt',
      '-EncryptionKey', testKey,
      '-KeepPlaintext'
    ], { encoding: 'utf8' });

    assert.strictEqual(runResult.status, 0);
    const dirMatch = runResult.stdout.match(/目錄：(C:\\Users\\user\\Documents\\CODE-TO-KNOW_BACKUPS\\CODE_TO_KNOW_SUPABASE_[0-9_]+)/);
    assert.ok(dirMatch && dirMatch[1], 'Must match backup directory path');

    const targetDir = dirMatch[1];
    const infoFile = path.join(targetDir, 'backup_info.json');
    assert.strictEqual(fs.existsSync(infoFile), true, 'backup_info.json must exist');

    const meta = JSON.parse(fs.readFileSync(infoFile, 'utf8').replace(/^\uFEFF/, ''));
    assert.strictEqual(meta.mock_mode, true, 'meta.mock_mode must be strictly true');
    assert.strictEqual(meta.source, 'MOCK_DUMP', 'meta.source must be strictly fixed string "MOCK_DUMP"');
    assert.strictEqual(meta.mock_dump_path, mockDump, 'meta.mock_dump_path must store the mock file path');
    assert.strictEqual(meta.project, 'code-to-know-mock-test');
    assert.strictEqual(meta.database, 'mock_postgres');

    // 清理
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  // TC-13 (SEC-03): 明文清理受阻處理 (核心函式級別)
  await test('SEC-03 明文清理受阻處理：明文刪除失敗時，保留合格之 .c2kb 容器並標記 cleanupSuccess: false', async () => {
    const rawDump = path.join(TEST_DIR, 'tc13_sec03.dump');
    const encFile = path.join(TEST_DIR, 'tc13_sec03.dump.c2kb');
    createSyntheticDump(rawDump, 32);

    const origUnlink = fs.unlinkSync;
    try {
      // 模擬 Windows 檔案被其他行程佔用或無刪除權限拋出 EPERM
      fs.unlinkSync = () => {
        const err = new Error('EPERM: operation not permitted, unlink');
        err.code = 'EPERM';
        throw err;
      };

      const result = await executeBackupEncryptionPipeline({
        dumpPath: rawDump,
        encPath: encFile,
        keyHex: testKey,
        keepPlaintext: false,
      });

      assert.strictEqual(result.success, true, 'Overall encryption & roundtrip verification must succeed');
      assert.strictEqual(result.cleanupSuccess, false, 'cleanupSuccess must be false on unlink failure');
      assert.strictEqual(result.verifiedRoundTrip, true, 'Round-trip must be verified');
      assert.strictEqual(fs.existsSync(encFile), true, 'Valid encrypted container must be preserved');
      assert.strictEqual(fs.existsSync(rawDump), true, 'Plaintext file still exists because unlink failed');
      assert.ok(result.plaintextCleanupError.includes('EPERM'), 'Error message must record the cause');
    } finally {
      fs.unlinkSync = origUnlink;
      if (fs.existsSync(rawDump)) fs.unlinkSync(rawDump);
      if (fs.existsSync(encFile)) fs.unlinkSync(encFile);
    }
  });

  // TC-14 (SEC-03): CLI 退出碼規範 (Exit Code 2)
  await test('SEC-03 CLI 退出碼規範：明文清理受阻時，CLI 以退出碼 2 結束並將診斷路徑輸出至 stderr', async () => {
    const rawDump = path.join(TEST_DIR, 'tc14_sec03_cli.dump');
    const encFile = path.join(TEST_DIR, 'tc14_sec03_cli.dump.c2kb');
    createSyntheticDump(rawDump, 32);

    // 建立包裝腳本以模擬在子程序中 unlinkSync 失敗情境
    const harnessScript = path.join(TEST_DIR, 'tc14_harness.js');
    const harnessCode = `
      const fs = require('node:fs');
      fs.unlinkSync = () => { throw new Error('EPERM: simulated permission denied'); };
      const { main } = require('${path.resolve(__dirname, 'backup-pipeline.cjs').replace(/\\/g, '/')}');
      main();
    `;
    fs.writeFileSync(harnessScript, harnessCode);

    const cliResult = spawnSync('node', [
      harnessScript,
      '-i', rawDump,
      '-o', encFile,
      '-k', testKey
    ], { encoding: 'utf8' });

    assert.strictEqual(cliResult.status, 2, 'Exit code must be 2 when encryption passes but cleanup fails');
    assert.ok(cliResult.stderr.includes('[PIPELINE NOTICE]'), 'Stderr must contain PIPELINE NOTICE');
    assert.ok(cliResult.stderr.includes(rawDump), 'Stderr must inform about exact plaintext dump path');
    assert.strictEqual(cliResult.stderr.includes(testKey), false, 'Stderr must never leak key');
    assert.strictEqual(fs.existsSync(encFile), true, 'Valid encrypted archive must exist');

    fs.unlinkSync(rawDump);
    fs.unlinkSync(encFile);
    fs.unlinkSync(harnessScript);
  });

  console.log(`\n==========================================================`);
  console.log(`  整合測試總結：${passed} / ${total} 個案例全數通過！`);
  console.log(`==========================================================\n`);

  teardown();

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllPipelineTests().catch((err) => {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  });
}

module.exports = {
  runAllPipelineTests,
};
