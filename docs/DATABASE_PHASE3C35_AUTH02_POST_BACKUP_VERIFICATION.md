# CODE TO KNOW — Phase 3-C-35 AUTH-02 備份後唯讀檔案驗收報告

- **文件階段**：Phase 3-C-35（AUTH-02 成功備份後之唯讀檔案驗收）
- **驗收日期**：2026-11-12
- **目標目錄**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261112_211508`
- **執行性質**：100% 唯讀檔案與 Git 狀態驗收（未連線 Supabase/Render、未執行 SQL/pg_dump/加解密/還原、未讀取 `.env`/Secrets/KeePassXC、未修改任何備份檔或 Git）
- **整體結論**：**PASS（7/7 項驗收全數通過）**

---

## 一、逐項驗收結果總表

| # | 驗收項目 | 狀態 | 實際檢查結果摘要 |
| --- | --- | --- | --- |
| 1 | 確認 `.c2kb` 加密備份檔存在且檔案大小合理 | **PASS** | `code_to_know_supabase_prod.dump.c2kb` 存在，大小 `506,889` bytes（較原始 `.dump` 的 `506,856` bytes 多 `33` bytes，符合 C2KB 標頭結構） |
| 2 | 重新計算 `.c2kb` 密文 SHA-256 並核對 | **PASS** | PowerShell `Get-FileHash -Algorithm SHA256` 實測值為 `570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`，與預期值及 `.c2kb.sha256` 完全一致 |
| 3 | 檢查 `.sha256` 檔案內容與原始傾印 SHA-256 一致 | **PASS** | `code_to_know_supabase_prod.dump.sha256` 內容為 `96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E  code_to_know_supabase_prod.dump`，與預期值完全一致 |
| 4 | 唯讀檢查 `backup_info.json` 欄位 | **PASS** | `created_at_utc`、`mock_mode: false`、`tls_mode: verify-full`、`verified_round_trip: true`、`plaintext_retained: false`、`cleanup_status: CLEANED_SUCCESSFULLY` 等欄位皆正確完整 |
| 5 | 確認目標目錄無殘留 `.dump` 明文備份檔 | **PASS** | `Get-ChildItem -Force` 顯示目錄內僅 4 個檔案，無任何 `.dump` 明文檔 |
| 6 | 確認先前既有備份未被覆寫 | **PASS** | 父目錄內先前 5 個時間戳資料夾（`2026/11/8`～`2026/11/11`）皆完整保留，未被覆寫或修改 |
| 7 | 記錄 Git HEAD 與工作目錄狀態（不修改 Git） | **PASS** | `HEAD` 為 `86a0f1116693bcce476b8747a446900d54b29a4a`，`git status --short` 共 97 筆，未執行任何 Git 寫入操作 |

---

## 二、詳細驗收證據

### 1. 目標目錄檔案清單與大小檢查（項目 1、5）

執行 `Get-ChildItem -LiteralPath 'C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261112_211508' -Force` 結果：

| 檔案名稱 | 大小 (Bytes) | 最後修改時間 (UTC+8) | 說明 |
| --- | ---: | --- | --- |
| `backup_info.json` | 1,184 | 2026/11/12 21:16:51 | 備份中繼資料與驗證紀錄 |
| `code_to_know_supabase_prod.dump.c2kb` | 506,889 | 2026/11/12 21:16:49 | AES-256-GCM 加密備份檔 |
| `code_to_know_supabase_prod.dump.c2kb.sha256` | 107 | 2026/11/12 21:16:50 | 密文 SHA-256 校驗檔 |
| `code_to_know_supabase_prod.dump.sha256` | 102 | 2026/11/12 21:16:38 | 原始 `.dump` SHA-256 校驗檔 |

- **大小合理性**：原始 `.dump`（`file_size_bytes: 506856`）加上 C2KB 格式標頭與驗證標籤（Magic `4B` + Version `1B` + Nonce `12B` + Tag `16B` = `33` bytes）恰好等於 `506,889` bytes。
- **明文殘留確認**：目錄內無任何 `.dump` 明文備份檔。

### 2. SHA-256 雜湊核對（項目 2、3）

- **`.c2kb` 密文重新計算（`Get-FileHash -Algorithm SHA256`）**：
  - 實測值：`570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`
  - 預期值：`570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`
  - `code_to_know_supabase_prod.dump.c2kb.sha256` 內容：`570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9  code_to_know_supabase_prod.dump.c2kb`
  - 比對結果：**完全一致（PASS）**

- **原始傾印 `.sha256` 內容檢查**：
  - `code_to_know_supabase_prod.dump.sha256` 內容：`96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E  code_to_know_supabase_prod.dump`
  - 預期值：`96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E`
  - 比對結果：**完全一致（PASS）**

### 3. `backup_info.json` 唯讀檢查（項目 4）

`backup_info.json` 關鍵欄位檢查結果：

- **來源與連線**：`project = "code-to-know-prod"`、`project_ref = "ypibmyfxfhsyfdwxprpi"`、`target_host = "aws-0-ap-southeast-2.pooler.supabase.com:5432"`、`source = "SUPABASE_PRODUCTION_DATABASE"`、`mock_mode = false`
- **工具與映像**：`tool_version = "pg_dump (PostgreSQL) 17.11"`、`format = "PostgreSQL Custom Format (-Fc)"`、`docker_image = "postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac"`
- **時間與 TLS**：`created_at_utc = "2026-11-12T13:16:38Z"`、`tls_mode = "verify-full (Strict Root CA & Hostname SAN)"`
- **加密與驗證欄位**：
  - `encrypted = true`
  - `encrypted_file = "code_to_know_supabase_prod.dump.c2kb"`
  - `encrypted_size_bytes = 506889`
  - `encrypted_sha256 = "570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9"`
  - `file_size_bytes = 506856`
  - `sha256 = "96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E"`
  - `verified_round_trip = true`
  - `plaintext_retained = false`
  - `cleanup_status = "CLEANED_SUCCESSFULLY"`

### 4. 先前既有備份保留檢查（項目 6）

檢查 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS` 目錄清單：

| 資料夾名稱 | 最後修改時間 (UTC+8) | 狀態 |
| --- | --- | --- |
| `CODE_TO_KNOW_PRE_MIGRATION_20261108_114016` | 2026/11/8 11:40:33 | 保留未變動 |
| `CODE_TO_KNOW_SUPABASE_20261108_205853` | 2026/11/8 20:59:00 | 保留未變動 |
| `CODE_TO_KNOW_SUPABASE_20261108_215758` | 2026/11/8 21:59:26 | 保留未變動 |
| `CODE_TO_KNOW_SUPABASE_20261110_202836` | 2026/11/10 20:29:58 | 保留未變動 |
| `CODE_TO_KNOW_SUPABASE_20261110_204519` | 2026/11/11 19:01:34 | 保留未變動 |
| `CODE_TO_KNOW_SUPABASE_20261112_211508` | 2026/11/12 21:16:51 | **本次新增（AUTH-02）** |

### 5. Git HEAD 與工作目錄狀態（項目 7）

- **`git rev-parse HEAD`**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **`git status --short` 行數**：97 筆（包含先前階段未提交變更與剛建立之唯讀報告，本階段未對任何程式碼或備份執行寫入/提交操作）
