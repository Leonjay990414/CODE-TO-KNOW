# CODE TO KNOW — Phase 3-C-35 AUTH-03 執行報告（stdin 金鑰傳遞完成並通過測試；等待本機互動式執行）

- **階段名稱**：AUTH-03 — Encrypted Backup Decryption & Isolated Restore
- **更新日期**：2026-11-12
- **目標加密備份**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261112_211508\code_to_know_supabase_prod.dump.c2kb`
- **目標隔離容器**：`code_to_know_pg17_restore_sandbox`（`postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`，`127.0.0.1:5433->5432/tcp`）
- **目標隔離資料庫**：`code_to_know_auth03_restore_20261112`
- **目前狀態**：**`stdin` 安全金鑰傳遞實作與全部離線/單元/編碼測試均已 PASS；依規定於實際解密前停止，等待使用者於本機 PowerShell 終端機進行真實互動式遮罩輸入執行。**

---

## 一、A. `stdin` 設計及金鑰傳遞安全檢查 — **PASS**

1. **Node.js 端（`scripts/database/backup-crypto.cjs`）**：
   - 新增 `--key-stdin` CLI 旗標與 `readKeyFromStdin(stdinStream)`。
   - **嚴格隔離來源**：啟用 `--key-stdin` 時，只從 `process.stdin` 讀取金鑰，絕不讀取 `argv`（同時傳入 `-k/--key` 立即拒絕）或 `process.env.BACKUP_ENCRYPTION_KEY`。
   - **明確協定與長度上限**：`MAX_STDIN_KEY_BYTES = 128`，必須以單行 `\n`（或 `\r\n`）結尾且無後續多餘資料；僅移除協定定義的單一換行終止符，不進行 `.trim()`。
   - **零洩漏與記憶體清理**：不輸出任何金鑰或原始 `stdin` 內容至 `stdout`/`stderr`/錯誤訊息；於 `finally` 區塊將所有暫存 `Buffer` 以 `fill(0)` 歸零並清除引用（註：JavaScript 字串為不可變物件，不宣稱已達實體安全抹除）。
2. **PowerShell 端（`scripts/database/restore_pg17_sandbox.ps1`）**：
   - 移除從環境變數 `BACKUP_ENCRYPTION_KEY` 讀取或注入 `$env:BACKUP_ENCRYPTION_KEY` 之邏輯，金鑰完全不寫入環境變數、命令列參數、檔案、日誌或 PowerShell 歷史紀錄。
   - 互動執行時透過 `Read-Host -Prompt "Encryption Key" -AsSecureString` 取得遮罩輸入，立即透過 `Marshal.ZeroFreeBSTR` 釋放 BSTR，並以 `[System.Diagnostics.ProcessStartInfo]`（UTF-8 無 BOM `StreamWriter`、`NewLine = "\n"`）將金鑰經子行程 `StandardInput` 傳入 `node backup-crypto.cjs decrypt --key-stdin ...`。
   - 子行程結束後於 `finally` 清除 `$activeKey` 並呼叫 `Dispose()` 釋放 `StreamWriter` 與 `Process`。

---

## 二、B. 修改檔案與 diff 摘要 — **PASS**

| 檔案 | 修改重點 |
| --- | --- |
| `scripts/database/backup-crypto.cjs` | 新增 `MAX_STDIN_KEY_BYTES = 128`、`readKeyFromStdin()`、`--key-stdin` 參數與 `Buffer.fill(0)` 清理，禁用 `-k` 混用與 `process.env` 讀取 |
| `scripts/database/backup-crypto.test.cjs` | 新增 TC-16～TC-24（實際對齊後共 23 項測試）驗證 `stdin` 成功解密、錯誤金鑰、錯誤 AuthTag、缺輸入、空金鑰、超長、缺換行/多餘資料/空白、禁用 `-k`、禁用 `env`、無金鑰洩漏及暫存檔清理 |
| `scripts/database/restore_pg17_sandbox.ps1` | 保留 Part A（`-ExpectedCiphertextSha256` 與移除 `$OriginalDumpPath` 存在檢查），並將解密呼叫改為 `ProcessStartInfo` + `--key-stdin`，移除 `$env:BACKUP_ENCRYPTION_KEY` 注入與讀取 |

---

## 三、C. 測試結果 — **PASS（79 / 79 全數通過）**

| 測試套件 | 通過數 / 總數 | 狀態 |
| --- | :---: | :---: |
| `node scripts/database/backup-crypto.test.cjs` | 23 / 23 | **PASS** |
| `node scripts/database/backup-pipeline.test.cjs` | 14 / 14 | **PASS** |
| `node scripts/database/ps-encoding-guard.test.cjs` | 5 / 5 | **PASS** |
| `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/database/restore_pg17_sandbox.test.ps1` | 37 / 37 | **PASS** |

---

## 四、D ～ J. 正式 AUTH-03 執行與驗收狀態

- **D. 密文 SHA-256**：**PASS（前置已驗證）** — `570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`
- **E. GCM AuthTag**：**NOT VERIFIED** — 因 Antigravity 背景執行環境無法提供真實互動式遮罩輸入，依規定停止，待使用者於本機 PowerShell 終端機互動執行後驗證。
- **F. 解密後 SHA-256**：**NOT VERIFIED** — 預期值 `96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E`，待本機執行後驗證。
- **G. PG17 還原**：**NOT VERIFIED** — 已重驗容器映像 `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`、連接埠 `127.0.0.1:5433`、`code_to_know_auth03_restore_20261112` 尚未存在；待本機執行。
- **H. Schema、資料表、索引及外鍵檢查**：**NOT VERIFIED** — 待還原完成後執行唯讀檢查。
- **I. 正式環境隔離證據**：**PASS** — 全程無任何 Supabase、Render 或雲端連線。
- **J. 明文清理**：**NOT VERIFIED** — 尚未執行解密，未產生明文暫存檔。

---

## 五、K. Git 狀態 — **PASS**

- **`git rev-parse HEAD`**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **`git status --short` 行數**：102 筆（包含先前階段未提交變更、`scripts/database/` 下之 `backup-crypto.cjs`、`backup-crypto.test.cjs`、`backup-pipeline.test.cjs`、`restore_pg17_sandbox.ps1`、`restore_pg17_sandbox.test.ps1`、`ps-encoding-guard.test.cjs` 與報告檔；未執行 Commit/Push）。

---

## 六、L. PASS / FAIL / NOT VERIFIED 總表

| 項目 | 名稱 | 狀態 | 備註 |
| --- | --- | --- | --- |
| A | `stdin` 設計及金鑰傳遞安全檢查 | **PASS** | 不經 argv、不寫環境變數、不落盤、UTF-8 無 BOM `stdin` 單行協定 |
| B | 修改檔案與 diff | **PASS** | 僅修改 `backup-crypto.cjs`、`backup-crypto.test.cjs`、`restore_pg17_sandbox.ps1` |
| C | 測試結果 | **PASS** | 4 套測試共 79/79 全數通過 |
| D | 密文 SHA-256 | **PASS** | 實測與預期 `570F859A...1DC3D9` 一致 |
| E | GCM AuthTag | **NOT VERIFIED** | 待本機互動式執行 |
| F | 解密後 SHA-256 | **NOT VERIFIED** | 待本機互動式執行 |
| G | PG17 還原 | **NOT VERIFIED** | 執行前 5 項隔離條件皆已重驗 PASS |
| H | Schema、資料表、索引及外鍵檢查 | **NOT VERIFIED** | 待還原後唯讀驗收 |
| I | 正式環境隔離證據 | **PASS** | 全程隔離於本機 PG17 Sandbox |
| J | 明文清理 | **NOT VERIFIED** | 尚未執行解密 |
| K | Git 狀態 | **PASS** | `HEAD: 86a0f111...`，未 Commit/Push |
