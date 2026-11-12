/**
 * CODE TO KNOW (碼上學) - 備份獨立 AES-256-GCM 串流加解密工具
 * File: scripts/database/backup-crypto.cjs
 * 
 * 安全規範依據：
 * - DOC-DB-PHASE3C4F-R13-AUDIT (R13-02)
 * - DOC-DB-PHASE3C4F-R14B-SPEC (W-01)
 * 
 * 容器格式 (C2KB Binary Container):
 * [Magic: 4B "C2KB"] + [Version: 1B (0x01)] + [Nonce: 12B] + [Ciphertext Stream] + [Auth Tag: 16B]
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pipeline } = require('node:stream');

const MAGIC_HEADER = Buffer.from('C2KB', 'ascii'); // 0x43, 0x32, 0x4B, 0x42
const CURRENT_VERSION = 0x01;
const NONCE_LENGTH = 12; // 96-bit IV for AES-GCM
const TAG_LENGTH = 16;   // 128-bit Authentication Tag
const HEADER_LENGTH = MAGIC_HEADER.length + 1 + NONCE_LENGTH; // 4 + 1 + 12 = 17 bytes
const MIN_CONTAINER_SIZE = HEADER_LENGTH + TAG_LENGTH;        // 17 + 16 = 33 bytes
const MAX_STDIN_KEY_BYTES = 128;

/**
 * 從 stdin 安全讀取 256-bit Hex 金鑰（單行協定，必須以 \n 或 \r\n 結尾，不進行 trim）
 */
function readKeyFromStdin(stdinStream = process.stdin) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    let settled = false;

    const zeroChunks = () => {
      for (let i = 0; i < chunks.length; i++) {
        if (Buffer.isBuffer(chunks[i])) {
          chunks[i].fill(0);
        }
        chunks[i] = null;
      }
      chunks.length = 0;
    };

    const fail = (message) => {
      if (settled) return;
      settled = true;
      cleanupListeners();
      zeroChunks();
      reject(new Error(message));
    };

    const onData = (chunk) => {
      if (settled) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8');
      totalBytes += buf.length;
      if (totalBytes > MAX_STDIN_KEY_BYTES) {
        buf.fill(0);
        return fail(`[CRYPTO CONFIG ERROR] Stdin key input exceeds maximum allowed length (${MAX_STDIN_KEY_BYTES} bytes).`);
      }
      chunks.push(buf);
    };

    const onEnd = () => {
      if (settled) return;
      cleanupListeners();

      let combined = null;
      let keyBuf = null;
      try {
        if (chunks.length === 0 || totalBytes === 0) {
          return fail('[CRYPTO CONFIG ERROR] Missing stdin key input.');
        }

        combined = Buffer.concat(chunks, totalBytes);
        zeroChunks();

        const lfIndex = combined.indexOf(0x0a); // '\n'
        if (lfIndex === -1) {
          return fail('[CRYPTO CONFIG ERROR] Incomplete stdin key input: missing newline terminator.');
        }
        if (lfIndex !== combined.length - 1) {
          return fail('[CRYPTO CONFIG ERROR] Unexpected trailing data after stdin key terminator.');
        }

        const endOffset = (lfIndex > 0 && combined[lfIndex - 1] === 0x0d) ? lfIndex - 1 : lfIndex;
        keyBuf = combined.subarray(0, endOffset);
        const keyStr = keyBuf.toString('utf8');

        if (!/^[0-9a-fA-F]{64}$/.test(keyStr)) {
          return fail('[CRYPTO CONFIG ERROR] Stdin key must be an exact 64-character hexadecimal string (256-bit).');
        }

        settled = true;
        resolve(keyStr);
      } finally {
        if (keyBuf) keyBuf.fill(0);
        if (combined) combined.fill(0);
        zeroChunks();
      }
    };

    const onError = (err) => {
      fail(`[CRYPTO CONFIG ERROR] Stdin read error: ${err.message}`);
    };

    const cleanupListeners = () => {
      stdinStream.removeListener('data', onData);
      stdinStream.removeListener('end', onEnd);
      stdinStream.removeListener('error', onError);
    };

    stdinStream.on('data', onData);
    stdinStream.on('end', onEnd);
    stdinStream.on('error', onError);
  });
}

/**
 * 驗證並解析 256-bit 金鑰（64 位元 Hex 字串）
 */
function parseKey(rawKey) {
  if (!rawKey || typeof rawKey !== 'string') {
    throw new Error('[CRYPTO CONFIG ERROR] Missing backup encryption key. Set BACKUP_ENCRYPTION_KEY or use --key.');
  }

  const trimmed = rawKey.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    throw new Error('[CRYPTO CONFIG ERROR] Key must be a 64-character hexadecimal string (256-bit).');
  }

  return Buffer.from(trimmed, 'hex');
}

/**
 * 產生安全的隨機 256-bit 金鑰
 */
function generateKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * AES-256-GCM 串流加密
 */
function encryptFile(inputPath, outputPath, keyHex) {
  return new Promise((resolve, reject) => {
    try {
      const resolvedInput = path.resolve(inputPath);
      const resolvedOutput = path.resolve(outputPath);

      if (!fs.existsSync(resolvedInput)) {
        throw new Error(`[CRYPTO ENCRYPT ERROR] Input file does not exist: ${resolvedInput}`);
      }

      if (resolvedInput === resolvedOutput) {
        throw new Error('[CRYPTO ENCRYPT ERROR] Input and output paths cannot be identical.');
      }

      if (fs.existsSync(resolvedOutput)) {
        throw new Error(`[CRYPTO ENCRYPT ERROR] Output file already exists: ${resolvedOutput}. Overwrite is disallowed.`);
      }

      const key = parseKey(keyHex);
      const nonce = crypto.randomBytes(NONCE_LENGTH);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);

      // 安全暫存檔（帶唯一隨機後綴）
      const tempOutput = `${resolvedOutput}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
      const outputDir = path.dirname(resolvedOutput);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outStream = fs.createWriteStream(tempOutput);
      const inStream = fs.createReadStream(resolvedInput);

      // 1. 寫入 Magic Header (4B) + Version (1B) + Nonce (12B)
      const headerBuf = Buffer.alloc(HEADER_LENGTH);
      MAGIC_HEADER.copy(headerBuf, 0);
      headerBuf.writeUInt8(CURRENT_VERSION, MAGIC_HEADER.length);
      nonce.copy(headerBuf, MAGIC_HEADER.length + 1);

      outStream.write(headerBuf);

      // 2. 串流加密輸入資料
      pipeline(inStream, cipher, (err) => {
        if (err) {
          cleanupTemp(tempOutput);
          return reject(new Error(`[CRYPTO ENCRYPT ERROR] Encryption stream pipeline failed: ${err.message}`));
        }

        try {
          // 3. 取得 16-byte Auth Tag 並寫入檔案尾端
          const authTag = cipher.getAuthTag();
          outStream.write(authTag, () => {
            outStream.end(() => {
              // 4. 原子化重新命名為正式輸出檔
              try {
                fs.renameSync(tempOutput, resolvedOutput);
                resolve({
                  success: true,
                  outputPath: resolvedOutput,
                  bytesWritten: fs.statSync(resolvedOutput).size,
                });
              } catch (renameErr) {
                cleanupTemp(tempOutput);
                reject(new Error(`[CRYPTO ENCRYPT ERROR] Failed to finalize output file: ${renameErr.message}`));
              }
            });
          });
        } catch (tagErr) {
          cleanupTemp(tempOutput);
          reject(new Error(`[CRYPTO ENCRYPT ERROR] Failed to write auth tag: ${tagErr.message}`));
        }
      });

      cipher.pipe(outStream, { end: false });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * AES-256-GCM 串流解密
 */
function decryptFile(inputPath, outputPath, keyHex) {
  return new Promise((resolve, reject) => {
    try {
      const resolvedInput = path.resolve(inputPath);
      const resolvedOutput = path.resolve(outputPath);

      if (!fs.existsSync(resolvedInput)) {
        throw new Error(`[CRYPTO DECRYPT ERROR] Input file does not exist: ${resolvedInput}`);
      }

      if (resolvedInput === resolvedOutput) {
        throw new Error('[CRYPTO DECRYPT ERROR] Input and output paths cannot be identical.');
      }

      if (fs.existsSync(resolvedOutput)) {
        throw new Error(`[CRYPTO DECRYPT ERROR] Output file already exists: ${resolvedOutput}. Overwrite is disallowed.`);
      }

      const inputStat = fs.statSync(resolvedInput);
      const fileSize = inputStat.size;

      if (fileSize < MIN_CONTAINER_SIZE) {
        throw new Error(`[CRYPTO DECRYPT ERROR] File is too small or truncated (${fileSize} bytes). Minimum container size is ${MIN_CONTAINER_SIZE} bytes.`);
      }

      // 1. 同步讀取頭部 17 位元組 (Header)
      const fd = fs.openSync(resolvedInput, 'r');
      const headerBuf = Buffer.alloc(HEADER_LENGTH);
      fs.readSync(fd, headerBuf, 0, HEADER_LENGTH, 0);

      // 2. 同步讀取尾部 16 位元組 (Auth Tag)
      const authTag = Buffer.alloc(TAG_LENGTH);
      fs.readSync(fd, authTag, 0, TAG_LENGTH, fileSize - TAG_LENGTH);
      fs.closeSync(fd);

      // 3. 驗證 Magic Header
      if (!headerBuf.subarray(0, MAGIC_HEADER.length).equals(MAGIC_HEADER)) {
        throw new Error('[CRYPTO DECRYPT ERROR] Invalid magic header. File is not a valid C2KB backup container.');
      }

      // 4. 驗證 Version
      const version = headerBuf.readUInt8(MAGIC_HEADER.length);
      if (version !== CURRENT_VERSION) {
        throw new Error(`[CRYPTO DECRYPT ERROR] Unsupported format version (${version}). Current supported version is ${CURRENT_VERSION}.`);
      }

      // 5. 擷取 Nonce
      const nonce = headerBuf.subarray(MAGIC_HEADER.length + 1, HEADER_LENGTH);

      const key = parseKey(keyHex);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
      decipher.setAuthTag(authTag);

      // 安全暫存檔（未驗證前絕不覆寫或交付正式輸出）
      const tempOutput = `${resolvedOutput}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
      const outputDir = path.dirname(resolvedOutput);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const outStream = fs.createWriteStream(tempOutput);

      // 6. 串流解密密文區段 (Offset: HEADER_LENGTH 至 fileSize - TAG_LENGTH - 1)
      const ciphertextLength = fileSize - HEADER_LENGTH - TAG_LENGTH;
      
      if (ciphertextLength === 0) {
        // 邊界情況：空檔案加密
        try {
          decipher.final();
          outStream.end(() => {
            fs.renameSync(tempOutput, resolvedOutput);
            resolve({
              success: true,
              outputPath: resolvedOutput,
              bytesWritten: 0,
            });
          });
        } catch (finalErr) {
          cleanupTemp(tempOutput);
          return reject(new Error('[CRYPTO DECRYPT ERROR] Authentication tag verification failed. File is corrupt, tampered with, or invalid key.'));
        }
        return;
      }

      const inStream = fs.createReadStream(resolvedInput, {
        start: HEADER_LENGTH,
        end: fileSize - TAG_LENGTH - 1, // inclusive
      });

      pipeline(inStream, decipher, outStream, (err) => {
        if (err) {
          // GCM 驗證失敗、位元翻轉、金鑰錯誤均觸發此處
          cleanupTemp(tempOutput);
          return reject(new Error('[CRYPTO DECRYPT ERROR] Authentication tag verification failed. File is corrupt, tampered with, or invalid key.'));
        }

        // 7. 驗證成功後，原子化移至最終輸出位置
        try {
          fs.renameSync(tempOutput, resolvedOutput);
          resolve({
            success: true,
            outputPath: resolvedOutput,
            bytesWritten: fs.statSync(resolvedOutput).size,
          });
        } catch (renameErr) {
          cleanupTemp(tempOutput);
          reject(new Error(`[CRYPTO DECRYPT ERROR] Failed to finalize decrypted file: ${renameErr.message}`));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function cleanupTemp(tempPath) {
  try {
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch {
    // 忽略清理失敗
  }
}

// ============================================================================
// CLI 命令行處理
// ============================================================================
function printHelp() {
  console.log(`
CODE TO KNOW (碼上學) - 備份獨立 AES-256-GCM 加解密工具

使用說明：
  node backup-crypto.cjs encrypt -i <inputFile> -o <outputFile> [-k <keyHex> | --key-stdin]
  node backup-crypto.cjs decrypt -i <inputFile> -o <outputFile> [-k <keyHex> | --key-stdin]
  node backup-crypto.cjs genkey
  node backup-crypto.cjs help

環境變數：
  BACKUP_ENCRYPTION_KEY    32-byte (64 hex characters) AES-GCM 金鑰（未使用 --key-stdin 時）
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    process.exit(0);
  }

  if (command === 'genkey') {
    const key = generateKey();
    console.log(key);
    process.exit(0);
  }

  if (command !== 'encrypt' && command !== 'decrypt') {
    console.error(`[ERROR] Unknown command: '${command}'. Use 'help' for usage.`);
    process.exit(1);
  }

  let inputFile = null;
  let outputFile = null;
  let useKeyStdin = false;
  let cliKeyArg = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '-i' || args[i] === '--input') {
      inputFile = args[++i];
    } else if (args[i] === '-o' || args[i] === '--output') {
      outputFile = args[++i];
    } else if (args[i] === '-k' || args[i] === '--key') {
      cliKeyArg = args[++i];
    } else if (args[i] === '--key-stdin') {
      useKeyStdin = true;
    }
  }

  if (!inputFile || !outputFile) {
    console.error('[ERROR] Both -i <inputFile> and -o <outputFile> are required.');
    process.exit(1);
  }

  if (useKeyStdin && cliKeyArg !== null) {
    console.error('[CRYPTO CONFIG ERROR] Cannot combine --key-stdin with -k/--key.');
    process.exit(1);
  }

  let keyHex = null;
  try {
    if (useKeyStdin) {
      // 安全模式：僅從 stdin 讀取，不讀取 argv 或 process.env
      keyHex = await readKeyFromStdin(process.stdin);
    } else {
      keyHex = cliKeyArg || process.env.BACKUP_ENCRYPTION_KEY || null;
    }

    if (command === 'encrypt') {
      const res = await encryptFile(inputFile, outputFile, keyHex);
      console.log(`[SUCCESS] Encrypted: ${res.outputPath} (${res.bytesWritten} bytes)`);
    } else {
      const res = await decryptFile(inputFile, outputFile, keyHex);
      console.log(`[SUCCESS] Decrypted: ${res.outputPath} (${res.bytesWritten} bytes)`);
    }
    keyHex = null;
    cliKeyArg = null;
    process.exit(0);
  } catch (err) {
    keyHex = null;
    cliKeyArg = null;
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  MAGIC_HEADER,
  CURRENT_VERSION,
  HEADER_LENGTH,
  TAG_LENGTH,
  MIN_CONTAINER_SIZE,
  MAX_STDIN_KEY_BYTES,
  generateKey,
  parseKey,
  readKeyFromStdin,
  encryptFile,
  decryptFile,
};
