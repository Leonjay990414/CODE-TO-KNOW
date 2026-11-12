# CODE TO KNOW｜Phase 3-C-11H：PG17 實機唯讀前置驗證報告

- **檢查階段**：Phase 3-C-11H：PG17 實機唯讀前置驗證
- **檢查日期**：2026-11-11 18:12~18:13 (+08:00)
- **檢查性質**：100% 實機唯讀前置驗證（未執行 `pg_restore` 還原、未建立/修改/刪除任何資料庫或角色、未連線 Supabase、未修改 `.env` 或 KeePassXC、未修復或改動任何既有腳本檔案、未執行 Git 寫入操作）
- **總體檢查判定**：**`FAIL`（目前尚不具備申請下一階段實際還原的條件）**
  - **關鍵發現**：PG17.11 實機環境、PG16/PG17 埠口隔離、備份 SHA-256、`code_to_know_c2kb_prod_restore_clean_v2` 不存在、以及 PG17.11 原生 `pg_restore --list` 真實 TOC（919 項保留 909 項、10 項 Vault 簽章全中、337 `public` 核心保留）**全部實測 PASS**；**惟兩支 `.ps1` 腳本於 `2026-11-11T10:11:26Z`（`18:11:26+08:00`）再度遺失 3-byte UTF-8 BOM，現況在 PowerShell 5.1 分別發生 `21` 與 `72` 個 AST 語法錯誤而無法執行**。依規範本階段不得自行修復程式，故判定 **`FAIL`** 並立即停機回報。

---

## 1. 本次檢查日期

- **2026-11-11 18:12 ~ 18:13 (+08:00)**（UTC `2026-11-11T10:12Z` ~ `10:13Z`）

---

## 2. Docker 與 PG17 實際狀態（判定：**`PASS`**）

- **Docker Engine**：`Client=29.9.2 | Server=29.9.2 | OS=linux`（正常連線運作）。
- **PG17 沙盒容器**：
  - 容器名稱：`code_to_know_pg17_restore_sandbox`
  - 映像檔 ID：`3540c0362c80`
  - 狀態：`Up 30 minutes`
  - `pg_restore --version` 實測：`pg_restore (PostgreSQL) 17.11`
  - `psql -U postgres -d postgres -tAc "SELECT version();"` 實測：`PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit`
  - `SHOW wal_level;` 實測：`replica`

---

## 3. PG16 ／ PG17 隔離結果（判定：**`PASS`**）

| 實例 | 容器名稱與狀態 | PostgreSQL 版本實測 | Docker Port Mapping | 宿主機 TCP Listen (`Get-NetTCPConnection`) | 連線就緒檢查 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PG17（還原沙盒）** | `code_to_know_pg17_restore_sandbox` (`Up 30 minutes`) | **PostgreSQL 17.11** | `5432/tcp -> 127.0.0.1:5433` | `127.0.0.1:5433` (`Listen`, PID `23940`) | `psql` 查詢通過 |
| **PG16（本機開發）** | `code_to_know_postgres` (`postgres:16-alpine`, `Up 30 minutes (healthy)`) | **PostgreSQL 16.15** | `5432/tcp -> 127.0.0.1:5432` | `127.0.0.1:5432` (`Listen`, PID `23940`) | `pg_isready`：`127.0.0.1:5432 - accepting connections` |

- 兩容器映像、Port Mapping（`5432` vs `5433`）及資料庫執行實例完全區隔。（備註：PG16 容器未設 `postgres` 角色故直接以 `-U postgres` 查詢未連入，改以容器內 `postgres --version` 與 `pg_isready` 完成唯讀確認，未讀取或輸出任何容器環境變數密碼。）

---

## 4. 備份檔案雜湊驗證（判定：**`PASS`**）

檢查目錄 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`（未讀取或輸出任何金鑰與密碼）：

| 檔案名稱 | 實測大小 (`Bytes`) | 實測 `SHA-256` | 與基準比較 |
| :--- |---:|---| :---: |
| `code_to_know_supabase_prod.dump` | **505,249** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | **完全一致 (`PASS`)** |
| `code_to_know_supabase_prod.dump.c2kb` | **505,282** | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` | **完全一致 (`PASS`)** |

---

## 5. 目標資料庫存在性確認（判定：**`PASS`**）

於 `code_to_know_pg17_restore_sandbox`（PG17.11）唯讀執行 `pg_database` 查詢：

- `SELECT count(*) FROM pg_database WHERE datname = 'code_to_know_c2kb_prod_restore_clean_v2';` 實測回傳：**`0`**（目標資料庫 **確實不存在**）。
- PG17 現存全部資料庫（`SELECT datname, pg_get_userbyid(datdba) ...`）：
  1. `code_to_know_c2kb_prod_restore_test`（Owner: `codetoknow_restore` — **既有部分還原庫完整保留**）
  2. `code_to_know_cloud_restore_test`（Owner: `codetoknow_restore`）
  3. `postgres`（Owner: `postgres`）
  4. `template0`（Owner: `postgres`）
  5. `template1`（Owner: `postgres`）

---

## 6. 真實 TOC 清單檢查結果（判定：**`PASS`**）

以 PG17.11 容器原生 `pg_restore --list` 透過標準輸入串流唯讀讀取 `code_to_know_supabase_prod.dump`（Exit Code `0`，未建立或修改任何檔案與資料庫）：

- **原始 TOC 清單統計**：
  - 總輸出行數：`934` 行（含 `15` 行 `;` 註解檔頭）
  - **有效 TOC 項目數**：**`919` 項**（與離線預期 `pg_restore --list` 模式 `919` 完全相符；其餘 7 項為 `PGDMP` 二進位 DB/Session 標頭）
- **10 個 Vault 項目實測全數吻合**（`MATCHED_10_VAULT = 10`；預期名單外 `OTHER_VAULT_MENTIONS = 0`）：
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
- **預定保留項目數**：`919 - 10 = 909` 項有效 TOC 項目（亦在 [`Parse-AndVerifyFilteredToc`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L140-L256) 允許配對 `(919 -> 909)` / `(926 -> 916)` 內）。
- **`public` 核心物件**：實測完整保留 **`337 / 337`** 項。
- **必要通用擴充套件保留**：實測均存在並保留於非排除項目中：
  - `2; 3079 16389 EXTENSION - pg_stat_statements `
  - `3; 3079 16432 EXTENSION - uuid-ossp `
  - `4; 3079 16443 EXTENSION - pgcrypto `

---

## 7. `#4698`（`PUBLICATION supabase_realtime`）處理結果（判定：**`PASS`** — 原則確認，實際警告行為待授權還原觀察）

- 真實 TOC 中確實存在：`4698; 6104 16426 PUBLICATION - supabase_realtime postgres`。
- 實測 PG17.11 實機目前 `SHOW wal_level;` 為 **`replica`**。
- **腳本處理原則**（[`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L575-L604)）：**不預先將 `#4698` 排除**，在步驟 7 明確記錄提示後執行 `pg_restore -L`，且**嚴格要求 `$pgRestoreExitCode -eq 0`**；若實機因 `wal_level=replica` 產生 warning 而令 ExitCode 不為 `0`，腳本仍會判定為失敗而非 PASS（真實退出碼須待正式授權執行時實機確認）。

---

## 8. Restore 腳本安全性檢查（邏輯 **`PASS`**，磁碟可執行性 **`FAIL`**）

唯讀檢視 [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1)：

| 安全要求 | 程式碼檢查依據 | 判定 |
| :--- | :--- | :---: |
| 預設目標資料庫是否正確 | `L37`：`$TargetDatabase = "code_to_know_c2kb_prod_restore_clean_v2"` | **PASS** |
| 資料庫存在即停止的保護 | `L455-L476` + [`Assert-TargetDatabaseAbsentResult`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L79-L100)（解密、建庫前檢查） | **PASS** |
| `psql` 執行失敗時是否 fail-closed | `try/catch` (`L466-L474`) + `$PsqlExitCode -ne 0` / 非 `"","0","1"` 立即 `throw` (`L86-L99`) | **PASS** |
| TOC 過濾是否使用精確 ID 與簽章 | `L269-L282`, `L183-L247`（ID + 正規式雙重驗證，不用 `-N vault`） | **PASS** |
| 是否禁止覆蓋既有資料庫 | [`Assert-SafeTargetDatabaseName`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L51-L77) 封鎖舊庫與系統庫；全檔無 `DROP DATABASE` | **PASS** |
| 還原失敗是否保留部分資料庫供調查 | `L746-L752`（保留並輸出明確警告） | **PASS** |
| 是否嚴格檢查 `pg_restore` ExitCode | `L602-L604`（`$pgRestoreExitCode -ne 0` 立即 `throw`） | **PASS** |
| **PowerShell 5.1 編碼與語法可執行性** | **實測 `BOM=False`、`AST_ERRORS=21`**（於 `10:11:26Z` 再次遺失 UTF-8 BOM） | **FAIL** |

---

## 9. Git HEAD 與工作目錄狀態（檔案狀態判定：**`FAIL`**）

- **Git Branch**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（維持不變，無任何 Git 寫入操作）
- **Phase 3-C-11G 三個檔案目前磁碟實測（唯讀）**：

| 檔案路徑 | 存在 | 大小 (`Bytes`) | UTF-8 BOM | PowerShell 5.1 AST | 最後修改 (`UTC`) | `SHA-256` |
| :--- | :---: |---:| :---: | :---: |---|---|
| `scripts/database/restore_pg17_sandbox.ps1` | 是 | **40,838** *(較 11G `40,841` 少 3B)* | **False** | **`21` 錯誤** | `2026-11-11T10:11:26.2741244Z` | `E1441384A9AD6CB635C5956372277721B7FFC998B9F2C3E49D31CE8E7E46528A` |
| `scripts/database/restore_pg17_sandbox.test.ps1` | 是 | **39,668** *(較 11G `39,671` 少 3B)* | **False** | **`72` 錯誤** | `2026-11-11T10:11:26.6923682Z` | `FF1A235C1B832E239F7F592885EE4A7A9DBCCDAE32BECFBC4B0145D0ED24AE8A` |
| `docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md` | 是 | 16,440 | False | N/A | `2026-11-11T10:02:28.1669501Z` | `C8E55447357BF610F5D4364F942A3C1A4AD9CD6835CC5B299ED45F75E3C3996A` |

- **其餘工作目錄狀態**：維持原有 `M scripts/database/backup-pipeline.test.cjs`、各前期 `docs/DATABASE_PHASE3C11*.md`、`GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`、`tmp/`、`1.docx`、`新增 文字文件.txt`、`照片/`、`D "~$DE_TO_KNOW_20..."`。

---

## 10. 總體檢查判定（`PASS` ／ `PARTIAL PASS` ／ `FAIL`）

- **總體判定**：**`FAIL`**
  - 環境、埠口隔離、備份雜湊、目標庫不存在與 PG17.11 真實 `pg_restore --list` TOC 全數 **`PASS`**；
  - **但 `scripts/database/restore_pg17_sandbox.ps1` 與 `scripts/database/restore_pg17_sandbox.test.ps1` 於 `2026-11-11T10:11:26Z` 遭不明外部存檔／格式化工具移除 3-byte UTF-8 BOM，導致目前 PowerShell 5.1 解析分別報出 `21` 與 `72` 個語法錯誤，SHA-256 與 11G 定版紀錄不符，實機腳本現況無法直接啟動。**

---

## 11. 是否具備申請下一階段實際還原的條件

- **否（NOT READY — 現階段不可申請 PG17 實際還原授權）**。
- **前置解決事項**：
  1. 必須先查明並停止於 `10:11:26Z` 自動剝除 `.ps1` UTF-8 BOM 的編輯器或格式化程序（例如為 `.ps1` 設定 `"files.encoding": "utf8bom"`，或關閉自動格式化存檔）。
  2. 為 `restore_pg17_sandbox.ps1` 與 `restore_pg17_sandbox.test.ps1` 重新補回 UTF-8 BOM (`0xEF 0xBB 0xBF`)，確認 PowerShell 5.1 AST 兩者均為 `0` 錯誤並重跑 `37/37` 離線測試通過（記錄新定版 SHA-256）後，始可重新提出 PG17 實機還原授權申請。

---

*本階段已完成 PG17 實機唯讀前置驗證報告並立即停止，未執行任何腳本修改、資料庫還原或 Supabase 連線。*
