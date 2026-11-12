/**
 * CODE TO KNOW (碼上學) - PowerShell BOM 與專案編碼防護規則離線驗證
 * File: scripts/database/ps-encoding-guard.test.cjs
 *
 * Strictly read-only: verifies workspace encoding configuration and `.ps1` BOM
 * headers without modifying or re-saving any official scripts.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '../..');

/**
 * Parse simple INI sections from `.editorconfig`.
 * @param {string} rawText
 * @returns {Record<string, Record<string, string>>}
 */
function parseEditorConfigSections(rawText) {
  const sections = {};
  let current = '__global__';
  sections[current] = {};

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const secMatch = line.match(/^\[(.+)\]$/);
    if (secMatch) {
      current = secMatch[1];
      if (!sections[current]) sections[current] = {};
      continue;
    }
    const kv = line.match(/^([^=]+?)\s*=\s*(.+)$/);
    if (kv) {
      sections[current][kv[1].trim().toLowerCase()] = kv[2].trim().toLowerCase();
    }
  }
  return sections;
}

function runEncodingGuardTests() {
  let passed = 0;
  let total = 0;

  function check(name, fn) {
    total += 1;
    fn();
    passed += 1;
    console.log(`[PASS] ${name}`);
  }

  const vscodeSettingsPath = path.join(ROOT, '.vscode', 'settings.json');
  const editorConfigPath = path.join(ROOT, '.editorconfig');

  check('1. .vscode/settings.json 存在且 [powershell] 強制鎖定 utf8bom 與 LF', () => {
    assert.strictEqual(fs.existsSync(vscodeSettingsPath), true, 'Missing .vscode/settings.json');
    const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
    assert.ok(settings['[powershell]'], 'Missing [powershell] section in .vscode/settings.json');
    assert.strictEqual(settings['[powershell]']['files.encoding'], 'utf8bom');
    assert.strictEqual(settings['[powershell]']['files.eol'], '\n');
  });

  check('2. .vscode/settings.json 未覆寫全域或 TypeScript/TSX/JSON/HTML/CSS 編碼設定', () => {
    const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
    assert.strictEqual(settings['files.encoding'], undefined, 'Global files.encoding must remain untouched');
    assert.strictEqual(settings['files.eol'], undefined, 'Global files.eol must remain untouched');
    for (const lang of ['[typescript]', '[typescriptreact]', '[javascript]', '[json]', '[html]', '[css]']) {
      assert.strictEqual(settings[lang], undefined, `${lang} must not be modified`);
    }
  });

  check('3. .editorconfig 存在且 [*.ps1] 宣告 charset=utf-8-bom 與 end_of_line=lf', () => {
    assert.strictEqual(fs.existsSync(editorConfigPath), true, 'Missing .editorconfig');
    const sections = parseEditorConfigSections(fs.readFileSync(editorConfigPath, 'utf8'));
    assert.ok(sections['*.ps1'], 'Missing [*.ps1] section in .editorconfig');
    assert.strictEqual(sections['*.ps1'].charset, 'utf-8-bom');
    assert.strictEqual(sections['*.ps1'].end_of_line, 'lf');
  });

  check('4. .editorconfig 未加入全域 [*] 規則改變 TypeScript 等其他檔案設定', () => {
    const sections = parseEditorConfigSections(fs.readFileSync(editorConfigPath, 'utf8'));
    assert.strictEqual(sections['*'], undefined, 'Wildcard [*] section must not be set unexpectedly');
    for (const tsPattern of ['*.ts', '*.tsx', '*.{ts,tsx}', '*.js', '*.json', '*.html', '*.css']) {
      assert.strictEqual(sections[tsPattern], undefined, `${tsPattern} must not be altered`);
    }
  });

  check('5. 三支 PowerShell 正式與測試腳本皆具備 EF BB BF BOM 且無 CRLF（唯讀讀取）', () => {
    for (const rel of [
      'scripts/database/restore_pg17_sandbox.ps1',
      'scripts/database/restore_pg17_sandbox.test.ps1',
      'scripts/database/run_supabase_backup.ps1',
    ]) {
      const buf = fs.readFileSync(path.join(ROOT, rel));
      const hasBom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
      const hasCr = buf.includes(0x0d);
      assert.strictEqual(hasBom, true, `${rel} missing UTF-8 BOM (EF BB BF)`);
      assert.strictEqual(hasCr, false, `${rel} unexpectedly contains CR bytes`);
    }
  });

  console.log(`\n結果：${passed}/${total} 通過`);
}

try {
  runEncodingGuardTests();
} catch (err) {
  console.error('[FAIL]', err && err.message ? err.message : err);
  process.exit(1);
}
