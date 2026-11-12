# CODE TO KNOW｜Phase 3-C-11K：BOM 修復後 PG17 最終唯讀前置驗證報告

- **檢查階段**：Phase 3-C-11K：BOM 修復後 PG17 最終唯讀前置驗證
- **檢查日期**：2026-11-11 18:52~18:55 (+08:00)（UTC `2026-11-11T10:52Z~10:55Z`）
- **檢查性質**：**100% 實機唯讀前置驗證**（未連線 Supabase、未執行 `pg_restore` 實際還原、未建立/修改/刪除任何資料庫或角色、未執行 SQL 寫入、未修改任何程式碼或設定、未讀取 `.env`/KeePassXC/金鑰、未執行 Git 寫入操作）
- **最終判定**：**`PASS`（已具備申請下一階段 PG17 實際還原授權之條件；本階段依規範停機未執行還原）**

---

## 1. Git 與檔案狀態驗證（判定：**`PASS`**）

- **Git 分支**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（與預期基準完全一致）
- **核心腳本與報告實測**：

| 檔案路徑 | 大小 (`Bytes`) | `UTF-8 BOM` | PowerShell 5.1 AST | 實測 `SHA-256` | 判定 |
|---|---:| :---: | :---: |---| :---: |
| [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) | **`40,841`** | **True** (`EF BB BF`) | **`0` 錯誤** | `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440` | **PASS**（完全吻合預期） |
| [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) | **`39,671`** | **True** (`EF BB BF`) | **`0` 錯誤** | `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4` | **PASS**（完全吻合預期） |
| [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1) | `19,749` | **True** (`EF BB BF`) | `0` 錯誤 | `AF9D470DE6691383138CBB7ED85171DA60E298F7922326A7D7F7A8E1A9534CDE` | **PASS** |
| [`docs/DATABASE_PHASE3C11J_BOM_PERMANENT_FIX.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11J_BOM_PERMANENT_FIX.md) | `12,690` | False | N/A | `C51AE43F2A99B494C9A1964C5DE2FB5A9C96A4CF2C9D3D71CE798BB6DACDA97B` | **PASS**（11 節完整留存） |

- **編碼防護設定檔與 `.gitignore` 狀態**：
  - [`.editorconfig`](file:///c:/Users/user/Documents/CODE-TO-KNOW/.editorconfig)（`45` bytes，SHA-256 `75EA3DA0296098F94261E888939EAB66DEE246F044FC628C4716A116E382C081`）：包含 `[*.ps1]` → `charset = utf-8-bom`、`end_of_line = lf`；未受 `.gitignore` 忽略。
  - [`.vscode/settings.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/.vscode/settings.json)（`83` bytes，SHA-256 `DB56499DAE7CD03BA8107D4B13E7197BE703DA5A8DFDD08EBBB4A0E8FC0DE268`）：包含 `"[powershell]"` → `"files.encoding": "utf8bom"`、`"files.eol": "\n"`；`git check-ignore -v` 確認受 `.gitignore` 第 10 行規則 `.vscode/` 忽略（存在於本機工作區生效，未入 git status 未追蹤列表）。
- **`git status --short` 摘要**：
  - `M scripts/database/backup-pipeline.test.cjs`（原有 2-byte 空白格式差異）、`M scripts/database/restore_pg17_sandbox.ps1`、`M scripts/database/restore_pg17_sandbox.test.ps1`、`?? .editorconfig`、`?? scripts/database/ps-encoding-guard.test.cjs`、各期 `?? docs/DATABASE_PHASE3C11*.md`、`docs/GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`，以及既有個人檔案（`D "~$DE_TO_KNOW_20..."`、`M "新增 文字文件.txt"`、`?? 1.docx`、`?? tmp/`、`?? 照片/`）皆維持原樣。

---

## 2. Docker 與 PostgreSQL 雙實例隔離驗證（判定：**`PASS`**）

- **Docker Engine**：`Client=29.9.2 | Server=29.9.2 | OS=linux`（正常連線）。
- **容器與實例比對**：

| 實例 | 容器名稱與狀態 | PostgreSQL 版本實測 | Docker Port Mapping | TCP Listen (`Get-NetTCPConnection`) | 連線就緒檢查 |
|---|---|---|---|---|---|
| **PG17（還原沙盒）** | `code_to_know_pg17_restore_sandbox` (`3540c0362c80`, `Up About an hour`) | **`PostgreSQL 17.11`** (`pg_restore (PostgreSQL) 17.11`) | `127.0.0.1:5433->5432/tcp` | `127.0.0.1:5433` (`Listen`, PID `23940`) | `psql` 與 `pg_restore` 正常執行 |
| **PG16（本機開發）** | `code_to_know_postgres` (`postgres:16-alpine`, `Up About an hour (healthy)`) | **`PostgreSQL 16.15`** | `127.0.0.1:5432->5432/tcp` | `127.0.0.1:5432` (`Listen`, PID `23940`) | `pg_isready`：`127.0.0.1:5432 - accepting connections` |

- PG16 與 PG17 使用獨立容器、獨立資料卷與獨立宿主機綁定埠（`5432` vs `5433`），完全隔離。

---

## 3. 備份完整性驗證（判定：**`PASS`**）

目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`（未讀取任何金鑰）：

| 檔案名稱 | 實測大小 (`Bytes`) | 實測 `SHA-256` | 與預期基準比對 |
|---|---:|---| :---: |
| `code_to_know_supabase_prod.dump` | **`505,249`** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | **完全一致 (`PASS`)** |
| `code_to_know_supabase_prod.dump.c2kb` | **`505,282`** | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` | **完全一致 (`PASS`)** |

---

## 4. 目標資料庫與既有資料庫狀態驗證（判定：**`PASS`**）

於 `code_to_know_pg17_restore_sandbox`（PG17.11）唯讀查詢 `pg_database`：

- `SELECT count(*) FROM pg_database WHERE datname = 'code_to_know_c2kb_prod_restore_clean_v2';` 實測回傳：**`0`**（目標資料庫 **確實不存在**）。
- PG17 現存資料庫清單：
  1. `code_to_know_c2kb_prod_restore_test`（Owner: `codetoknow_restore` — **既有部分還原資料庫完整保留未動**）
  2. `code_to_know_cloud_restore_test`（Owner: `codetoknow_restore`）
  3. `postgres`（Owner: `postgres`）
  4. `template0`（Owner: `postgres`）
  5. `template1`（Owner: `postgres`）

---

## 5. PG17.11 真實 `pg_restore --list` TOC 唯讀驗證（判定：**`PASS`**）

透過標準輸入串流至 PG17.11 容器唯讀執行 `pg_restore --list`（Exit Code `0`，未建立/寫入任何暫存或資料庫）：

- **清單統計**：總行數 `934` 行（含 `15` 行 `;` 註解檔頭），**有效 TOC 項目：`919` 項**。
- **精確排除之 10 個 Vault 項目**（`10 / 10` 全數吻合，名單外非預期 Vault 提及 `UNEXPECTED_VAULT = 0`）：
  1. `5; 3079 16604 EXTENSION - supabase_vault `
  2. `13; 2615 16603 SCHEMA - vault supabase_admin`
  3. `3777; 0 16608 TABLE DATA vault secrets supabase_admin`
  4. `4791; 0 0 ACL - SCHEMA vault supabase_admin`
  5. `4794; 0 0 COMMENT - EXTENSION supabase_vault `
  6. `4888; 0 0 ACL vault FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) supabase_admin`
  7. `4889; 0 0 ACL vault FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) supabase_admin`
  8. `4890; 0 0 ACL vault FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) supabase_admin`
  9. `4997; 0 0 ACL vault TABLE secrets supabase_admin`
  10. `4998; 0 0 ACL vault TABLE decrypted_secrets supabase_admin`
- **預定保留項目數**：`919 - 10 = 909` 項。
- **`public` 核心物件**：依 [`Test-IsPublicCoreTocBody`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L124-L129) 規則（`^[A-Z]+(?: [A-Z]+)*\s+public\s+`）實測保留 **`337 / 337`** 項（另加 `4788; 0 0 ACL - SCHEMA public pg_database_owner` 亦一併保留）。
- **必要通用擴充套件保留確認**：
  - `2; 3079 16389 EXTENSION - pg_stat_statements `
  - `3; 3079 16432 EXTENSION - uuid-ossp `
  - `4; 3079 16443 EXTENSION - pgcrypto `
- **`#4698 PUBLICATION supabase_realtime` 處理方式與實際風險**：
  - 真實 TOC 確實存在：`4698; 6104 16426 PUBLICATION - supabase_realtime postgres`。
  - PG17.11 沙盒容器目前 `SHOW wal_level;` 實測為 **`replica`**（非 `logical`）。
  - **腳本處理方式**（[`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L575-L604)）：**不預先排除 `#4698`**，保留於 `-L` 過濾後之 `909` 項清單內執行 `pg_restore`，且**嚴格要求 `$pgRestoreExitCode -eq 0`**。
  - **實際風險提示**：因沙盒目前 `wal_level = replica`，下一階段若獲授權執行實際 `pg_restore` 時，PostgreSQL 17 建立或處理 `PUBLICATION supabase_realtime` 時**有可能產生警告或錯誤並使 `pg_restore` Exit Code 非 `0`**；若發生該情況，腳本設計會依安全原則**直接中止並保留該半成品測試庫供調查，絕不將 Exit Code 1 誤判為 PASS**（此風險已識別並可控，正式還原時應記錄 `pg_restore` 實際退出碼與輸出）。

---

## 6. 全套離線測試與測試後 BOM／SHA-256 複驗（判定：**`PASS`**）

| 測試／檢查項目 | 執行指令或對象 | 實測結果 | Exit Code |
|---|---| :---: | :---: |
| AES-256-GCM 加密測試 | `node scripts/database/backup-crypto.test.cjs` | **`14 / 14` PASS** | `0` |
| 備份整合測試 | `node scripts/database/backup-pipeline.test.cjs` | **`14 / 14` PASS** | `0` |
| PG17 還原離線測試 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\database\restore_pg17_sandbox.test.ps1` | **`37 / 37` PASS** | `0` |
| 永久編碼防護驗證 | `node scripts/database/ps-encoding-guard.test.cjs` | **`5 / 5` PASS** | `0` |
| PowerShell 5.1 AST（測試前／後） | `restore_pg17_sandbox.ps1` & `restore_pg17_sandbox.test.ps1` | **`0` 錯誤 / `0` 錯誤** | `0` |

### 測試完成後再次檢查 BOM 與 SHA-256（防回彈驗證）

- `scripts/database/restore_pg17_sandbox.ps1`：`40,841` bytes、`BOM=True`、`AST_ERRORS=0`、`SHA-256` 維持 **`6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440`**（完全不變）。
- `scripts/database/restore_pg17_sandbox.test.ps1`：`39,671` bytes、`BOM=True`、`AST_ERRORS=0`、`SHA-256` 維持 **`FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4`**（完全不變）。

---

## 7. 最終判定與是否可申請下一階段實際還原

- **最終判定**：**`PASS`**
- **是否具備申請下一階段實際還原的條件**：**是（READY FOR AUTHORIZATION REVIEW）**
  - Git 狀態、BOM／AST、編碼防護設定、PG17.11 與 PG16.15 雙實例隔離、備份 SHA-256、新目標庫 `code_to_know_c2kb_prod_restore_clean_v2` 不存在、舊庫完整保留、PG17.11 真實 TOC（`919 -> 909`、10 Vault 全數命中、`337` `public` 核心保留）、以及 `14/14`、`14/14`、`37/37`、`5/5` 全數測試均已通過；且測試完成後 BOM 與 SHA-256 皆未回彈。
  - **後續授權前注意項目**：實際執行 PG17 還原時，仍須由授權指令提供/讀取加密金鑰，並觀察 `#4698 PUBLICATION supabase_realtime` 在 `wal_level = replica` 下的實際 `pg_restore` 行為與 Exit Code（依腳本規則嚴格要求 Exit Code 必須為 `0`）。

---

*本階段已完成 Phase 3-C-11K 最終唯讀前置驗證報告並立即停止，未執行 PG17 實際還原或任何寫入操作，等待使用者審查與另行授權。*
