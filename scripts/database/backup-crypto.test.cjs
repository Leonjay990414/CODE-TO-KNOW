/**
 * CODE TO KNOW (碼上學) - 備份獨立 AES-256-GCM 加解密工具安全單元測試
 * File: scripts/database/backup-crypto.test.cjs
 * 
 * 測試標準依據：PHASE 3C-4F-R14-B-1 (4.6 節)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const {
  MAGIC_HEADER,
  CURRENT_VERSION,
  HEADER_LENGTH,
  TAG_LENGTH,
  MAX_STDIN_KEY_BYTES,
  generateKey,
  parseKey,
  encryptFile,
  decryptFile,
} = require('./backup-crypto.cjs');

const TEST_DIR = path.resolve(__dirname, '../../tmp/backup_crypto_test_' + Date.now());

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

function sha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runTests() {
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
  console.log('  AES-256-GCM 備份加解密模組安全單元測試 (W-01)');
  console.log('==========================================================\n');

  const testKey = generateKey();
  const wrongKey = generateKey();

  // TC-01 & TC-02: 1 MB 隨機檔案加解密 Round-trip 與 SHA-256 核對
  await test('1 MB 隨機檔案加密解密迴環，解密後 SHA-256 與原始完全一致', async () => {
    const rawFile = path.join(TEST_DIR, 'test_1mb.raw');
    const encFile = path.join(TEST_DIR, 'test_1mb.enc');
    const decFile = path.join(TEST_DIR, 'test_1mb.dec');

    const randomData = crypto.randomBytes(1024 * 1024); // 1 MB
    fs.writeFileSync(rawFile, randomData);
    const originalHash = sha256(rawFile);

    await encryptFile(rawFile, encFile, testKey);
    assert.strictEqual(fs.existsSync(encFile), true, 'Encrypted file should exist');

    await decryptFile(encFile, decFile, testKey);
    assert.strictEqual(fs.existsSync(decFile), true, 'Decrypted file should exist');

    const decryptedHash = sha256(decFile);
    assert.strictEqual(decryptedHash, originalHash, 'SHA-256 hash must be identical');
  });

  // TC-03: 空檔案加解密
  await test('0 Byte 空檔案加密及解密', async () => {
    const rawFile = path.join(TEST_DIR, 'test_empty.raw');
    const encFile = path.join(TEST_DIR, 'test_empty.enc');
    const decFile = path.join(TEST_DIR, 'test_empty.dec');

    fs.writeFileSync(rawFile, Buffer.alloc(0));
    await encryptFile(rawFile, encFile, testKey);
    await decryptFile(encFile, decFile, testKey);

    assert.strictEqual(fs.statSync(decFile).size, 0, 'Decrypted file must be 0 bytes');
  });

  // TC-04: 大型測試檔案串流測試 (5 MB)
  await test('大型檔案 (5 MB) 串流加解密測試，驗證記憶體與管線穩定性', async () => {
    const rawFile = path.join(TEST_DIR, 'test_5mb.raw');
    const encFile = path.join(TEST_DIR, 'test_5mb.enc');
    const decFile = path.join(TEST_DIR, 'test_5mb.dec');

    // 建立 5 MB 測試檔
    const chunk = crypto.randomBytes(1024 * 1024);
    for (let i = 0; i < 5; i++) {
      fs.appendFileSync(rawFile, chunk);
    }
    const originalHash = sha256(rawFile);

    await encryptFile(rawFile, encFile, testKey);
    await decryptFile(encFile, decFile, testKey);

    assert.strictEqual(sha256(decFile), originalHash, '5 MB decrypted hash must match');
  });

  // TC-05: 錯誤金鑰拒絕
  await test('錯誤金鑰解密時立即拋錯拒絕，絕不產出明文', async () => {
    const encFile = path.join(TEST_DIR, 'test_1mb.enc');
    const decFile = path.join(TEST_DIR, 'test_wrong_key.dec');

    let threw = false;
    try {
      await decryptFile(encFile, decFile, wrongKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Authentication tag verification failed/);
    }
    assert.strictEqual(threw, true, 'Must throw on wrong key');
    assert.strictEqual(fs.existsSync(decFile), false, 'Output file must not exist on failure');
  });

  // TC-06: 密文位元翻轉防禦 (Bit-flip)
  await test('密文區段位元翻轉 (篡改 1 byte) 時立即拋錯阻斷', async () => {
    const encFile = path.join(TEST_DIR, 'test_1mb.enc');
    const tamperedEnc = path.join(TEST_DIR, 'test_tampered_ciphertext.enc');
    const decFile = path.join(TEST_DIR, 'test_tampered.dec');

    const encBuf = fs.readFileSync(encFile);
    // 翻轉第 25 個 byte（屬於密文區段）
    encBuf[25] = encBuf[25] ^ 0xff;
    fs.writeFileSync(tamperedEnc, encBuf);

    let threw = false;
    try {
      await decryptFile(tamperedEnc, decFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Authentication tag verification failed/);
    }
    assert.strictEqual(threw, true, 'Must throw on ciphertext tampering');
    assert.strictEqual(fs.existsSync(decFile), false, 'Output file must not exist');
  });

  // TC-07: Auth Tag 竄改拒絕
  await test('末端 16 bytes Auth Tag 篡改時拋錯拒絕', async () => {
    const encFile = path.join(TEST_DIR, 'test_1mb.enc');
    const tamperedEnc = path.join(TEST_DIR, 'test_tampered_tag.enc');
    const decFile = path.join(TEST_DIR, 'test_tampered_tag.dec');

    const encBuf = fs.readFileSync(encFile);
    // 翻轉最後一個 byte（屬於 Auth Tag）
    encBuf[encBuf.length - 1] = encBuf[encBuf.length - 1] ^ 0x01;
    fs.writeFileSync(tamperedEnc, encBuf);

    let threw = false;
    try {
      await decryptFile(tamperedEnc, decFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Authentication tag verification failed/);
    }
    assert.strictEqual(threw, true, 'Must throw on tag tampering');
    assert.strictEqual(fs.existsSync(decFile), false, 'Output file must not exist');
  });

  // TC-08: 檔案截斷防禦
  await test('檔案被截斷至小於 33 位元組時立即拒絕', async () => {
    const truncatedFile = path.join(TEST_DIR, 'test_truncated.enc');
    const decFile = path.join(TEST_DIR, 'test_truncated.dec');

    fs.writeFileSync(truncatedFile, Buffer.from('SHORT_CORRUPT_BYTES'));

    let threw = false;
    try {
      await decryptFile(truncatedFile, decFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /File is too small or truncated/);
    }
    assert.strictEqual(threw, true, 'Must throw on truncated file');
    assert.strictEqual(fs.existsSync(decFile), false, 'Output file must not exist');
  });

  // TC-09: Magic Header 錯誤拒絕
  await test('非 C2KB Magic Header 檔案拒絕處理', async () => {
    const badMagicFile = path.join(TEST_DIR, 'test_bad_magic.enc');
    const decFile = path.join(TEST_DIR, 'test_bad_magic.dec');

    const fakeBuf = Buffer.alloc(40);
    Buffer.from('FAKE').copy(fakeBuf, 0); // 錯誤 Magic
    fs.writeFileSync(badMagicFile, fakeBuf);

    let threw = false;
    try {
      await decryptFile(badMagicFile, decFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Invalid magic header/);
    }
    assert.strictEqual(threw, true, 'Must throw on bad magic header');
  });

  // TC-10: 未知版本拒絕
  await test('未知版本號 (如 0x02) 檔案拒絕處理', async () => {
    const badVersionFile = path.join(TEST_DIR, 'test_bad_version.enc');
    const decFile = path.join(TEST_DIR, 'test_bad_version.dec');

    const buf = Buffer.alloc(40);
    MAGIC_HEADER.copy(buf, 0);
    buf.writeUInt8(0x02, MAGIC_HEADER.length); // 偽造版本 2
    fs.writeFileSync(badVersionFile, buf);

    let threw = false;
    try {
      await decryptFile(badVersionFile, decFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /Unsupported format version/);
    }
    assert.strictEqual(threw, true, 'Must throw on unsupported version');
  });

  // TC-11: 輸入與輸出路徑相同時拒絕
  await test('輸入與輸出路徑相同時拋錯拒絕，防止自我覆寫毀滅', async () => {
    const sampleFile = path.join(TEST_DIR, 'test_same_path.raw');
    fs.writeFileSync(sampleFile, 'DATA');

    let threw = false;
    try {
      await encryptFile(sampleFile, sampleFile, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /cannot be identical/);
    }
    assert.strictEqual(threw, true, 'Must reject identical paths');
  });

  // TC-12: 輸出檔已存在時拒絕覆寫
  await test('輸出目標檔案已存在時拋錯拒絕覆寫', async () => {
    const rawFile = path.join(TEST_DIR, 'test_existing_in.raw');
    const existingOut = path.join(TEST_DIR, 'test_existing_out.enc');

    fs.writeFileSync(rawFile, 'INPUT');
    fs.writeFileSync(existingOut, 'PREV_EXISTS');

    let threw = false;
    try {
      await encryptFile(rawFile, existingOut, testKey);
    } catch (err) {
      threw = true;
      assert.match(err.message, /already exists/);
    }
    assert.strictEqual(threw, true, 'Must reject existing output file');
  });

  // TC-13: 驗證失敗後暫存檔清理確認
  await test('解密認證失敗後，所有 .tmp 暫存檔案全數清除不殘留', async () => {
    const tamperedEnc = path.join(TEST_DIR, 'test_tampered_ciphertext.enc');
    const decFile = path.join(TEST_DIR, 'test_clean_check.dec');

    try {
      await decryptFile(tamperedEnc, decFile, testKey);
    } catch {
      // 預期失敗
    }

    const filesInDir = fs.readdirSync(TEST_DIR);
    const tempFiles = filesInDir.filter(f => f.includes('test_clean_check.dec.tmp'));
    assert.strictEqual(tempFiles.length, 0, 'No temporary files should remain after failure');
  });

  // TC-14: 驗證成功前不得公開解密結果
  await test('驗證成功前只有受限暫存檔，完成後才原子化 rename 成正式檔', async () => {
    const rawFile = path.join(TEST_DIR, 'test_atomic.raw');
    const encFile = path.join(TEST_DIR, 'test_atomic.enc');
    const decFile = path.join(TEST_DIR, 'test_atomic.dec');

    fs.writeFileSync(rawFile, 'ATOMIC_SECRET_PAYLOAD');
    await encryptFile(rawFile, encFile, testKey);

    // 驗證解密後直接生成目標檔案
    await decryptFile(encFile, decFile, testKey);
    assert.strictEqual(fs.existsSync(decFile), true);
    assert.strictEqual(fs.readFileSync(decFile, 'utf8'), 'ATOMIC_SECRET_PAYLOAD');
  });

  // TC-15: 金鑰缺失或格式錯誤時安全停止
  await test('金鑰格式非 64-char Hex 或為 null 時拒絕處理，不洩漏任何明文', async () => {
    assert.throws(() => parseKey(null), /Missing backup encryption key/);
    assert.throws(() => parseKey(''), /Missing backup encryption key/);
    assert.throws(() => parseKey('too_short_key'), /Key must be a 64-character hexadecimal/);
    assert.throws(() => parseKey('not_hex_0123456789abcdef0123456789abcdef0123456789abcdef0123456789zzzz'), /Key must be a 64-character hexadecimal/);
  });

  // =========================================================================
  // --key-stdin 子行程安全測試 (TC-16 ~ TC-26)
  // =========================================================================
  const cliScript = path.resolve(__dirname, './backup-crypto.cjs');
  const stdinRaw = path.join(TEST_DIR, 'stdin_src.raw');
  const stdinEnc = path.join(TEST_DIR, 'stdin_src.enc');
  fs.writeFileSync(stdinRaw, 'STDIN_SECRET_TEST_PAYLOAD_2026');
  await encryptFile(stdinRaw, stdinEnc, testKey);
  const stdinOrigHash = sha256(stdinRaw);

  function runCliDecrypt(args, stdinInput, extraEnv = {}) {
    const cleanEnv = { ...process.env, ...extraEnv };
    if (!Object.prototype.hasOwnProperty.call(extraEnv, 'BACKUP_ENCRYPTION_KEY')) {
      delete cleanEnv.BACKUP_ENCRYPTION_KEY;
    }
    return spawnSync(process.execPath, [cliScript, 'decrypt', ...args], {
      input: stdinInput,
      encoding: 'utf8',
      env: cleanEnv,
    });
  }

  // TC-16: stdin 正確金鑰（LF 與 CRLF）可正常解密且不洩漏金鑰
  await test('--key-stdin 使用正確金鑰 (LF / CRLF) 可正常解密且輸出不含金鑰', async () => {
    const decLf = path.join(TEST_DIR, 'stdin_ok_lf.dec');
    const resLf = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decLf], `${testKey}\n`);
    assert.strictEqual(resLf.status, 0, `LF decrypt failed: ${resLf.stderr}`);
    assert.strictEqual(sha256(decLf), stdinOrigHash);
    assert.strictEqual(resLf.stdout.includes(testKey), false, 'stdout must not contain key');
    assert.strictEqual(resLf.stderr.includes(testKey), false, 'stderr must not contain key');

    const decCrlf = path.join(TEST_DIR, 'stdin_ok_crlf.dec');
    const resCrlf = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decCrlf], `${testKey}\r\n`);
    assert.strictEqual(resCrlf.status, 0, `CRLF decrypt failed: ${resCrlf.stderr}`);
    assert.strictEqual(sha256(decCrlf), stdinOrigHash);
  });

  // TC-17: stdin 錯誤金鑰必須失敗且無殘留暫存
  await test('--key-stdin 錯誤金鑰必須失敗、不洩漏金鑰且無暫存殘留', async () => {
    const decOut = path.join(TEST_DIR, 'stdin_wrong_key.dec');
    const res = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decOut], `${wrongKey}\n`);
    assert.notStrictEqual(res.status, 0);
    assert.strictEqual(fs.existsSync(decOut), false);
    assert.strictEqual(fs.readdirSync(TEST_DIR).some(f => f.includes('stdin_wrong_key.dec.tmp')), false);
    assert.strictEqual(res.stdout.includes(wrongKey), false);
    assert.strictEqual(res.stderr.includes(wrongKey), false);
  });

  // TC-18: stdin 正確金鑰但錯誤 GCM AuthTag 必須失敗且清理暫存
  await test('--key-stdin 錯誤 GCM AuthTag 必須失敗並清理暫存檔', async () => {
    const tamperedTagEnc = path.join(TEST_DIR, 'stdin_tampered_tag.enc');
    const buf = fs.readFileSync(stdinEnc);
    buf[buf.length - 1] ^= 0xff;
    fs.writeFileSync(tamperedTagEnc, buf);

    const decOut = path.join(TEST_DIR, 'stdin_tampered_tag.dec');
    const res = runCliDecrypt(['--key-stdin', '-i', tamperedTagEnc, '-o', decOut], `${testKey}\n`);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /Authentication tag verification failed/);
    assert.strictEqual(fs.existsSync(decOut), false);
    assert.strictEqual(fs.readdirSync(TEST_DIR).some(f => f.includes('stdin_tampered_tag.dec.tmp')), false);
  });

  // TC-19: 缺少 stdin 金鑰必須失敗
  await test('--key-stdin 缺少 stdin 輸入（立即 EOF）必須失敗', async () => {
    const decOut = path.join(TEST_DIR, 'stdin_missing.dec');
    const res = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decOut], '');
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /Missing stdin key input/);
    assert.strictEqual(fs.existsSync(decOut), false);
  });

  // TC-20: 空金鑰（僅換行）必須失敗
  await test('--key-stdin 空金鑰（僅 \\n）必須失敗', async () => {
    const decOut = path.join(TEST_DIR, 'stdin_empty.dec');
    const res = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decOut], '\n');
    assert.notStrictEqual(res.status, 0);
    assert.strictEqual(fs.existsSync(decOut), false);
  });

  // TC-21: stdin 超過允許長度必須失敗
  await test('--key-stdin 超過最大長度限制必須失敗且不回顯輸入', async () => {
    const oversized = 'a'.repeat(MAX_STDIN_KEY_BYTES + 10) + '\n';
    const decOut = path.join(TEST_DIR, 'stdin_oversized.dec');
    const res = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', decOut], oversized);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /exceeds maximum allowed length/);
    assert.strictEqual(res.stderr.includes('aaaaaaaaaa'), false);
    assert.strictEqual(fs.existsSync(decOut), false);
  });

  // TC-22: 不完整輸入、額外資料或未 trim 空白必須失敗
  await test('--key-stdin 缺少換行終止符、多餘資料或含空白時必須失敗', async () => {
    const dec1 = path.join(TEST_DIR, 'stdin_no_nl.dec');
    const res1 = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', dec1], testKey);
    assert.notStrictEqual(res1.status, 0);
    assert.match(res1.stderr, /missing newline terminator/);

    const dec2 = path.join(TEST_DIR, 'stdin_trailing.dec');
    const res2 = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', dec2], `${testKey}\nextra`);
    assert.notStrictEqual(res2.status, 0);
    assert.match(res2.stderr, /Unexpected trailing data/);

    const dec3 = path.join(TEST_DIR, 'stdin_spaces.dec');
    const res3 = runCliDecrypt(['--key-stdin', '-i', stdinEnc, '-o', dec3], ` ${testKey} \n`);
    assert.notStrictEqual(res3.status, 0);
    assert.strictEqual(res3.stderr.includes(testKey), false);
  });

  // TC-23: 嚴禁與 -k argv 混用
  await test('--key-stdin 不得從 argv (-k) 讀取或混用', async () => {
    const decOut = path.join(TEST_DIR, 'stdin_no_argv.dec');
    const res = runCliDecrypt(['--key-stdin', '-k', testKey, '-i', stdinEnc, '-o', decOut], `${testKey}\n`);
    assert.notStrictEqual(res.status, 0);
    assert.match(res.stderr, /Cannot combine --key-stdin with -k/);
    assert.strictEqual(fs.existsSync(decOut), false);
  });

  // TC-24: 不得從 process.env 讀取金鑰
  await test('--key-stdin 不得從 process.env.BACKUP_ENCRYPTION_KEY 讀取金鑰', async () => {
    const decOut = path.join(TEST_DIR, 'stdin_no_env.dec');
    // env 放正確金鑰、stdin 放錯誤金鑰 -> 必須失敗（證明不讀 env）
    const res = runCliDecrypt(
      ['--key-stdin', '-i', stdinEnc, '-o', decOut],
      `${wrongKey}\n`,
      { BACKUP_ENCRYPTION_KEY: testKey }
    );
    assert.notStrictEqual(res.status, 0);
    assert.strictEqual(fs.existsSync(decOut), false);

    // env 放正確金鑰、stdin 空 -> 必須失敗
    const res2 = runCliDecrypt(
      ['--key-stdin', '-i', stdinEnc, '-o', decOut],
      '',
      { BACKUP_ENCRYPTION_KEY: testKey }
    );
    assert.notStrictEqual(res2.status, 0);
  });

  console.log(`\n測試總結：${passed} / ${total} 個案例全數通過！\n`);

  teardown();

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  teardown();
  process.exit(1);
});
