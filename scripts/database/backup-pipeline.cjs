/**
 * CODE TO KNOW (碼上學) - 資料庫備份與 AES-256-GCM 加密整合管線模組
 * File: scripts/database/backup-pipeline.cjs
 * 
 * 安全規範依據：
 * - PHASE 3C-1 授權規格
 * - C2KB Binary Container Format (Magic: 4B "C2KB", Version: 1B 0x01, Nonce: 12B, Tag: 16B)
 * 
 * 核心保證：
 * 1. 絕不覆寫既有加密檔。
 * 2. 加密完成後立即執行「解密迴環驗證 (Round-Trip Verification)」。
 * 3. 只有在解密 SHA-256 與原始明文 100% 完全相符時，才允許受控清理明文。
 * 4. 驗證或加密失敗時，絕對保留原始明文資料供診斷，並徹底清理暫存檔。
 * 5. 全程不向 Console、Log 或錯誤訊息輸出金鑰明文。
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  MAGIC_HEADER,
  CURRENT_VERSION,
  HEADER_LENGTH,
  TAG_LENGTH,
  MIN_CONTAINER_SIZE,
  parseKey,
  encryptFile,
  decryptFile,
} = require('./backup-crypto.cjs');

/**
 * 計算指定檔案之 SHA-256 雜湊值
 */
function calculateFileSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').toUpperCase();
}

/**
 * 快速驗證 C2KB 容器頭部與格式
 */
function verifyContainerFormat(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`[CONTAINER ERROR] File does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (stat.size < MIN_CONTAINER_SIZE) {
    throw new Error(`[CONTAINER ERROR] File size (${stat.size} bytes) is less than minimum container size (${MIN_CONTAINER_SIZE} bytes).`);
  }

  const fd = fs.openSync(resolved, 'r');
  try {
    const headerBuf = Buffer.alloc(HEADER_LENGTH);
    fs.readSync(fd, headerBuf, 0, HEADER_LENGTH, 0);

    const magic = headerBuf.subarray(0, MAGIC_HEADER.length);
    if (!magic.equals(MAGIC_HEADER)) {
      throw new Error('[CONTAINER ERROR] Invalid magic header. Not a valid C2KB container.');
    }

    const version = headerBuf.readUInt8(MAGIC_HEADER.length);
    if (version !== CURRENT_VERSION) {
      throw new Error(`[CONTAINER ERROR] Unsupported container version: ${version}. Expected: ${CURRENT_VERSION}.`);
    }

    return {
      valid: true,
      fileSize: stat.size,
      version,
      nonceHex: headerBuf.subarray(MAGIC_HEADER.length + 1, HEADER_LENGTH).toString('hex'),
    };
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * 執行備份加密與驗收完整管線 (Pipeline)
 * 
 * @param {Object} options
 * @param {string} options.dumpPath - 原始明文備份路徑 (.dump)
 * @param {string} [options.encPath] - 目標加密檔路徑 (預設為 ${dumpPath}.c2kb)
 * @param {string} [options.keyHex] - 64-char Hex 金鑰 (若未提供則自 process.env.BACKUP_ENCRYPTION_KEY 讀取)
 * @param {boolean} [options.keepPlaintext=false] - 是否保留原始明文 (預設為 false，驗證通過後安全刪除)
 * @returns {Promise<Object>} 執行成果元資料
 */
async function executeBackupEncryptionPipeline(options = {}) {
  const {
    dumpPath,
    encPath,
    keyHex = process.env.BACKUP_ENCRYPTION_KEY,
    keepPlaintext = false,
  } = options;

  if (!dumpPath) {
    throw new Error('[PIPELINE ERROR] Missing required argument: dumpPath');
  }

  const resolvedDump = path.resolve(dumpPath);
  if (!fs.existsSync(resolvedDump)) {
    throw new Error(`[PIPELINE ERROR] Plaintext dump file does not exist: ${resolvedDump}`);
  }

  const dumpStat = fs.statSync(resolvedDump);
  if (!dumpStat.isFile()) {
    throw new Error(`[PIPELINE ERROR] Specified dumpPath is not a regular file: ${resolvedDump}`);
  }

  // 1. 驗證金鑰格式 (不顯示金鑰)
  parseKey(keyHex);

  const resolvedEnc = encPath
    ? path.resolve(encPath)
    : `${resolvedDump}.c2kb`;

  if (fs.existsSync(resolvedEnc)) {
    throw new Error(`[PIPELINE ERROR] Target encrypted file already exists: ${resolvedEnc}. Overwrite is disallowed.`);
  }

  // 2. 計算原始明文 SHA-256
  const originalSha256 = calculateFileSha256(resolvedDump);

  // 3. 執行 AES-256-GCM 串流加密
  let encryptResult;
  try {
    encryptResult = await encryptFile(resolvedDump, resolvedEnc, keyHex);
  } catch (encErr) {
    throw new Error(`[PIPELINE ERROR] Encryption step failed: ${encErr.message}`);
  }

  // 4. 驗證 C2KB 容器結構
  try {
    verifyContainerFormat(resolvedEnc);
  } catch (formatErr) {
    // 容器格式異常，清理產出並報錯
    try { fs.unlinkSync(resolvedEnc); } catch {}
    throw new Error(`[PIPELINE ERROR] Container format verification failed: ${formatErr.message}`);
  }

  // 5. 執行解密迴環驗證 (Round-Trip Decryption Verification)
  const verifyTemp = `${resolvedEnc}.verify.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  let roundTripPassed = false;

  try {
    await decryptFile(resolvedEnc, verifyTemp, keyHex);
    const decryptedSha256 = calculateFileSha256(verifyTemp);

    if (decryptedSha256 !== originalSha256) {
      throw new Error(`[PIPELINE INTEGRITY ERROR] Decrypted hash (${decryptedSha256}) does not match original plaintext hash (${originalSha256})!`);
    }

    roundTripPassed = true;
  } catch (verifyErr) {
    // 迴環驗證失敗：嚴禁交付破損的加密檔案，但絕對保留原始明文以利除錯
    try { if (fs.existsSync(verifyTemp)) fs.unlinkSync(verifyTemp); } catch {}
    try { if (fs.existsSync(resolvedEnc)) fs.unlinkSync(resolvedEnc); } catch {}
    throw new Error(`[PIPELINE VERIFICATION FAILED] Round-trip verification failed: ${verifyErr.message}`);
  } finally {
    // 迴環驗證暫存檔必須清除
    try { if (fs.existsSync(verifyTemp)) fs.unlinkSync(verifyTemp); } catch {}
  }

  // 6. 計算密文檔案 SHA-256 指紋
  const encryptedSha256 = calculateFileSha256(resolvedEnc);

  // 7. 受控清理明文 (僅在 roundTripPassed 嚴格為 true 時執行)
  let plaintextDeleted = false;
  let plaintextCleanupError = null;

  if (!keepPlaintext && roundTripPassed) {
    try {
      // 嚴格核對為常規檔案且拒絕符號連結，杜絕路徑竄改
      const stat = fs.lstatSync(resolvedDump);
      if (stat.isSymbolicLink()) {
        throw new Error(`Refusing to unlink symbolic link at "${resolvedDump}". Target must be a regular file.`);
      }
      if (!stat.isFile()) {
        throw new Error(`Target is not a regular file at "${resolvedDump}".`);
      }
      fs.unlinkSync(resolvedDump);
      plaintextDeleted = true;
    } catch (cleanupErr) {
      plaintextCleanupError = cleanupErr.message;
      // 若明文刪除失敗，記錄告警但不破壞已完成之加密備份
      console.warn(`[PIPELINE WARNING] Encrypted backup verified and preserved, but failed to unlink plaintext dump at "${resolvedDump}": ${cleanupErr.message}`);
    }
  }

  return {
    success: true,
    cleanupSuccess: keepPlaintext || plaintextDeleted,
    originalFile: resolvedDump,
    originalSizeBytes: dumpStat.size,
    originalSha256,
    encryptedFile: resolvedEnc,
    encryptedSizeBytes: encryptResult.bytesWritten,
    encryptedSha256,
    verifiedRoundTrip: true,
    plaintextDeleted,
    plaintextCleanupError,
  };
}

// ============================================================================
// CLI 進入點
// ============================================================================
async function main() {
  const args = process.argv.slice(2);
  let dumpPath = null;
  let encPath = null;
  let keyHex = process.env.BACKUP_ENCRYPTION_KEY || null;
  let keepPlaintext = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-i' || args[i] === '--input') {
      dumpPath = args[++i];
    } else if (args[i] === '-o' || args[i] === '--output') {
      encPath = args[++i];
    } else if (args[i] === '-k' || args[i] === '--key') {
      keyHex = args[++i];
    } else if (args[i] === '--keep-plaintext') {
      keepPlaintext = true;
    }
  }

  if (!dumpPath) {
    console.error('使用方式: node backup-pipeline.cjs -i <dumpPath> [-o <encPath>] [-k <keyHex>] [--keep-plaintext]');
    process.exit(1);
  }

  try {
    const result = await executeBackupEncryptionPipeline({
      dumpPath,
      encPath,
      keyHex,
      keepPlaintext,
    });

    console.log(JSON.stringify(result, null, 2));

    if (!result.cleanupSuccess) {
      console.error(`[PIPELINE NOTICE] Encrypted backup was verified and preserved, but plaintext dump could not be removed at "${result.originalFile}": ${result.plaintextCleanupError}`);
      // 退出碼 2：加密與迴環驗證成功，但明文清理未達成
      process.exit(2);
    }

    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  calculateFileSha256,
  verifyContainerFormat,
  executeBackupEncryptionPipeline,
  main,
};
