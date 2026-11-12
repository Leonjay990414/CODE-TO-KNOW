# CODE TO KNOW — Phase 3-C-35 AUTH-03 加密備份解密與隔離還原唯讀前置檢查報告

- **階段名稱**：AUTH-03 — Encrypted Backup Decryption & Isolated Restore Readiness
- **檢查日期**：2026-11-12
- **執行性質**：100% 唯讀前置檢查與計畫評估（未執行解密、未執行 `pg_restore`、未啟動新容器、未連線 Supabase/Render、未執行 SQL、未讀取 `.env`/Secrets/KeePassXC、未修改任何檔案或 Git）
- **前置授權狀態**：**AUTH-03 尚未獲授權執行**；本報告完成後即停止，等待使用者獨立明確授權。

---

## 一、總覽：前置檢查項目狀態

| 項目 | 名稱 | 狀態 | 摘要結論 |
| --- | --- | --- | --- |
| A | 備份檔案完整性檢查結果 | **PASS** | `code_to_know_supabase_prod.dump.c2kb` 存在，大小 `506,889` bytes，重新計算 SHA-256 與預期值完全一致 |
| B | PG17 隔離環境現況 | **PASS** | `code_to_know_pg17_restore_sandbox` 運行中，映像 `postgres@sha256:3540c036...` (PG 17.11)，僅綁定 `127.0.0.1:5433->5432/tcp` |
| C | C2KB 解密工具安全性評估 | **PASS** | `scripts/database/backup-crypto.cjs` 具 16-byte GCM AuthTag 驗證、防覆寫與原子重命名機制，不寫入明文金鑰至磁碟 |
| D | 還原流程及資料庫隔離設計 | **PASS（附 1 項執行前腳本適配條件）** | `restore_pg17_sandbox.ps1` 強制目標庫名稱白名單、存在即 fail-closed 中止、不覆寫既有庫；但第 429 行檢查 `$OriginalDumpPath` 須存在（AUTH-02 已清除明文 `.dump`），執行 AUTH-03 前須決定腳本適配方式 |
| E | 明文暫存檔安全處理計畫 | **PASS** | 採用動態唯一檔名 (`c2k_restore_verify_<pid>_<ts>.dump`、`tmp/restore_verify_<pid>_<ts>.dump`)，防覆寫並於 `finally` 雙端清理與驗證 |
| F | 失敗停止及清理策略 | **PASS** | 全程 `$ErrorActionPreference = "Stop"` + `$LASTEXITCODE` 檢查，失敗立即中止、保留原始 `.c2kb`、清除明文暫存並標註部分還原狀態 |
| G | 正式環境隔離證據 | **PASS** | 還原指令僅透過 `docker exec -i code_to_know_pg17_restore_sandbox` 作用於本機隔離容器，無任何 Supabase/Render 連線參數 |
| H | AUTH-03 執行前置條件及風險 | **PASS（條件明確）** | 須取得明確授權、使用者互動提供 AES 金鑰、指定全新 `-TargetDatabase` 名稱，並先決定 `OriginalDumpPath` 檢查之處理方式 |
| I | Git 狀態 | **PASS** | `HEAD` 為 `86a0f1116693bcce476b8747a446900d54b29a4a`，`git status --short` 共 98 筆，未執行任何 Git 寫入 |

---

## 二、各項詳細檢查結果

### A. 備份檔案完整性檢查結果 — **PASS**

- **目標檔案**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261112_211508\code_to_know_supabase_prod.dump.c2kb`
- **檔案存在與大小**：存在，大小為 `506,889` bytes（原始傾印 `506,856` bytes + C2KB 標頭與驗證標籤 `33` bytes）。
- **密文 SHA-256 重新計算（`Get-FileHash -Algorithm SHA256`）**：
  - 實測值：`570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`
  - 預期值：`570F859A13DB58CCF86AD6F3357343D52BF46E5A12774E8F9C74FC80931DC3D9`
  - 比對結果：完全一致。

### B. PG17 隔離環境現況 — **PASS**

透過唯讀 `docker ps -a` 與 `docker inspect` 檢查既有本機容器：

| 容器名稱 | 映像 / Digest | 狀態 | 連接埠綁定 | 網路模式 | 用途隔離 |
| --- | --- | --- | --- | --- | --- |
| `code_to_know_pg17_restore_sandbox` | `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`（與 AUTH-02 備份 `backup_info.json` 記錄之 PG 17.11 映像一致） | `Up` (`Running=true`) | `127.0.0.1:5433->5432/tcp` | `bridge` | **AUTH-03 專用還原 Sandbox** |
| `code_to_know_pg17_phase3c18_audit` | `postgres:17-alpine` | `Up` | `127.0.0.1:5434->5432/tcp` | `bridge` | 權限/角色稽核 Sandbox（AUTH-01 用，AUTH-03 不碰觸） |
| `code_to_know_postgres` | `postgres:16-alpine` | `Up (healthy)` | `127.0.0.1:5432->5432/tcp` | `bridge` | 本機 PG16 開發容器（AUTH-03 不碰觸） |

### C. C2KB 解密工具安全性評估 — **PASS**

唯讀檢查 `scripts/database/backup-crypto.cjs`（346 行）：

1. **容器結構與驗證**：嚴格檢查 `Magic: "C2KB"` (4B)、`Version: 0x01` (1B)、`Nonce` (12B)、`Auth Tag` (16B)，最小長度 `33` bytes。
2. **金鑰格式檢查**：`parseKey` 強制要求 64 位元 Hex 字串（256-bit）。
3. **防覆寫與原子寫入**：
   - 禁止輸入與輸出路徑相同；若輸出檔已存在立即拒絕覆寫。
   - 解密寫入帶隨機後綴的暫存檔（`.tmp.<timestamp>.<random>`），僅在 `pipeline(inStream, decipher, outStream)` 與 16-byte GCM `AuthTag` 驗證完全成功後，才以 `fs.renameSync` 交付輸出檔；任何驗證失敗均立即刪除暫存檔並拋錯。
4. **CLI 輸入輸出**：支援 `node backup-crypto.cjs decrypt -i <inputFile> -o <outputFile>` 並從環境變數 `BACKUP_ENCRYPTION_KEY` 讀取金鑰（由呼叫端在記憶體範圍內暫時設定並於 `finally` 復原）。

### D. 還原流程及資料庫隔離設計 — **PASS（附 1 項執行前腳本適配條件）**

唯讀檢查 `scripts/database/restore_pg17_sandbox.ps1`（808 行）：

1. **目標資料庫名稱防護（`Assert-SafeTargetDatabaseName`）**：
   - 僅允許 `^[a-z][a-z0-9_]{2,62}$`。
   - 明確封鎖 `code_to_know`、`postgres`、`template0`、`template1` 以及舊版部分還原庫（`code_to_know_c2kb_prod_restore_test`、`code_to_know_cloud_restore_test`）。
2. **防覆寫現有資料庫（`Assert-TargetDatabaseAbsentResult`）**：
   - 執行前查詢 `pg_database`，若目標庫已存在（`1`）或查詢異常，採 fail-closed 原則立即中止，絕不覆寫或刪除既有資料庫。
   - 註：腳本預設 `$TargetDatabase = "code_to_know_c2kb_prod_restore_clean_v2"`，AUTH-03 執行時應明確傳入全新獨立名稱（例如 `code_to_know_auth03_restore_20261112`），避免與過去測試庫衝突。
3. **TOC 精準過濾與原生 `pg_restore`**：
   - 產生原始 TOC 清單並精準排除 10 項 Supabase `vault` 項目，以 UTF-8 無 BOM、LF 換行輸出 `-L` 清單檔並重讀驗證，再執行 `pg_restore --no-owner --no-acl -L <toc_list>`，嚴格要求 Exit Code 為 `0`。
4. **重要發現（執行前須知）**：
   - `restore_pg17_sandbox.ps1` 第 429–431 行目前檢查 `if (-not (Test-Path $OriginalDumpPath)) { throw "[PATH ERROR] 找不到指定原始明文 Dump 檔案：$OriginalDumpPath" }`；但在後續步驟 4（第 518–528 行）實際上只將解密檔的 SHA-256 與 `$ExpectedSha256` 比對，並未讀取 `$OriginalDumpPath`。
   - 由於 AUTH-02 已依安全規範刪除明文 `.dump`（`plaintext_retained: false`，僅保留 `.dump.sha256`），若直接以預設邏輯執行 `restore_pg17_sandbox.ps1`，將會在第 429 行因找不到 `$OriginalDumpPath` 而中止。AUTH-03 授權後需先決定以「將檢查改為讀取 `.sha256` 檔或允許無明文檔時僅驗證 `$ExpectedSha256`」的方式安全適配腳本（已先記錄於本報告，本次不修改程式碼）。

### E. 明文暫存檔安全處理計畫 — **PASS**

依據 `restore_pg17_sandbox.ps1` 既有設計（TMP-01 / FIX-05）：

- **動態唯一路徑**：本地暫存檔使用 `<backupDir>\c2k_restore_verify_<PID>_<UnixTs>.dump`（及對應 `.toc`、`.list`）；容器內使用 `/tmp/restore_verify_<PID>_<UnixTs>.dump` 與 `/tmp/restore_toc_<PID>_<UnixTs>.list`。
- **事前碰撞檢查**：解密前確認所有暫存路徑皆不存在，且絕不與 `.c2kb` 同名。
- **事後強制清理與驗證**：無論成功或失敗，皆於 `finally` 區塊分別刪除容器內暫存檔（`docker exec ... rm -f`）與本機暫存檔（`Remove-Item -Force`），並獨立檢查兩端清理結果；若任一端清理失敗即回傳非 0 退出碼並發出明文殘留警示。

### F. 失敗停止及清理策略 — **PASS**

- **Fail-Closed 中止**：`$ErrorActionPreference = "Stop"`，所有 `docker`、`node`、`pg_restore`、`psql` 外部命令皆檢查 `$LASTEXITCODE`。
- **金鑰環境變數保護（SEC-01）**：呼叫前備份原本的 `BACKUP_ENCRYPTION_KEY` 環境變數狀態，結束時於 `finally` 精準還原或移除。
- **原始備份零變更**：失敗時絕對保留原始 `.c2kb` 與 `.sha256` 檔案不動。
- **失敗後資料庫處置（FIX-06）**：若在 `CREATE DATABASE` 之後發生還原或斷言失敗，腳本明確標註該新建測試庫為部分還原狀態並保留現場供人工檢查，絕不自動誤刪既有資料庫。

### G. 正式環境隔離證據 — **PASS**

- `restore_pg17_sandbox.ps1` 全程僅透過 `docker exec -i $SandboxContainer`（`code_to_know_pg17_restore_sandbox`）執行 `psql` 與 `pg_restore`。
- 腳本內部不含任何 `supabase.com`、`pooler.supabase.com`、`render.com`、`.env` 讀取或外部網路連線邏輯；容器本身僅綁定 `127.0.0.1:5433`。

### H. AUTH-03 執行前置條件及風險 — **PASS（條件明確）**

1. **必要前置條件**：
   - 使用者明確授權執行 AUTH-03 解密與隔離還原。
   - 使用者於執行時透過安全互動式輸入（`Read-Host -AsSecureString`）提供 64 字元 Hex `BACKUP_ENCRYPTION_KEY`。
   - 指定全新未使用的 `-TargetDatabase`（例如 `code_to_know_auth03_restore_20261112`）。
   - 核准處理 `restore_pg17_sandbox.ps1` 第 429 行對 `$OriginalDumpPath` 必須存在於磁碟的檢查（改以 `.sha256` 校驗檔與 `$ExpectedSha256 = "96230FED4E9037D063BB0BA85474EE57D1DC824717CC13097D9C196F41B9E73E"` 驗證）。
2. **已知風險與注意事項**：
   - `restore_pg17_sandbox.ps1` 預設斷言 `public` 資料表為 `37`、外鍵 `47`、索引 `133`、遷移紀錄 `2`；若 Supabase 正式環境在 2026-11-10 至 2026-11-12 之間有過資料表或遷移變動，該斷言會如實回報不符並停止（屬預期的完整性保護機制）。
   - `wal_level=replica` 下 `PUBLICATION supabase_realtime` 可能產生警告或非 0 退出碼，腳本依設計不會忽略任何非 0 退出碼。

### I. Git 狀態 — **PASS**

- **`git rev-parse HEAD`**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **`git status --short` 行數**：98 筆（包含先前階段未提交變更與唯讀報告檔案；本階段未修改任何程式碼、設定或既有備份，未執行 Commit/Push）。
