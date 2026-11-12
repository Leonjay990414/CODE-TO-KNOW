# CODE TO KNOW｜Phase 3-C-11D：Docker 恢復與 PG17 還原環境唯讀驗證報告

**文件版本**：1.0.0  
**檢查日期**：2026-11-11  
**檢查性質**：100% 唯讀驗證（未執行 `pg_restore`、未建立或刪除資料庫、未執行 SQL 寫入、未連線 Supabase、未修改程式碼/腳本/設定/Docker、未讀取金鑰或秘密內容）  
**最終判定**：**CONDITIONAL PASS**（Docker Desktop Engine 目前仍未啟動，環境端尚未就緒；離線備份完整性與 TOC 過濾清單分析已全數通過驗證）

---

## 一、環境狀態檢查結果（實測現況）

| # | 檢查項目 | 實測結果 | 狀態 |
|:---:|---|---|---|
| 1 | **Docker Desktop Engine 連線** | 執行 `docker ps -a` 失敗：`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`（系統找不到指定檔案）；宿主機無 `docker` / `postgres` 執行緒；`wsl -l -v` 顯示 `docker-desktop` 為 **`Stopped`** | ❌ **未啟動（立即停止 DB 檢查）** |
| 2 | **PG17 容器 (`code_to_know_pg17_restore_sandbox`)** | 因 Docker Engine 未啟動，無法檢查容器存在性與運行狀態 | ⚠️ **無法驗證（待 Docker 啟動）** |
| 3 | **PG17 實際 PostgreSQL 版本 (17.11)** | 因 Docker Engine 未啟動，無法執行 `psql SELECT version();` | ⚠️ **無法驗證（待 Docker 啟動）** |
| 4 | **PG16 (`127.0.0.1:5432`) 與 PG17 (`127.0.0.1:5433`) 埠口隔離** | [`docker-compose.yml`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docker-compose.yml) 靜態設定 PG16 為 `127.0.0.1:5432:5432`；雙容器即時運行與埠口監聽無法實測 | ⚠️ **無法即時驗證（待 Docker 啟動）** |
| 5 | **既有資料庫清單** (`code_to_know_cloud_restore_test`, `c2k_dryrun_sandbox`, `code_to_know_c2kb_prod_restore_test`) | 因 PG17 容器未運行，無法查詢 `pg_database` | ⚠️ **無法驗證（待 Docker 啟動）** |
| 6 | **新目標庫名稱 `code_to_know_c2kb_prod_restore_clean_v2` 尚不存在** | 因 PG17 容器未運行，無法查詢確認未被佔用 | ⚠️ **無法驗證（待 Docker 啟動）** |
| 7 | **`pg_restore` 版本與 `--use-list` / `-N` 參數實機確認** | 宿主機本機 PATH 未安裝 PostgreSQL CLI 工具；容器版 `pg_restore` 因 Docker 未啟動無法實測 | ⚠️ **無法驗證（待 Docker 啟動）** |
| 8 | **既有部分還原資料庫未被修改或刪除** | 本階段未對 Docker 或資料庫執行任何操作，但尚無法連線實測庫內狀態 | ⚠️ **無法實測（待 Docker 啟動）** |

> [!CAUTION]
> **依指令立即中止資料庫檢查**：因 `dockerDesktopLinuxEngine` 尚未啟動，本階段未嘗試自行啟動、安裝、重設或修改 Docker Desktop，亦無任何容器連線操作。

---

## 二、原始備份檔案與 SHA-256 驗證（離線實測通過）

目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`

| 檔案名稱 | 實測大小 (Bytes) | 實測 SHA-256 | 核對結果 |
|---|---:|---|---|
| `code_to_know_supabase_prod.dump` | **505,249** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | **PASS**（與 `.sha256` 檔案完全吻合） |
| `code_to_know_supabase_prod.dump.c2kb` | **505,282** | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` | **PASS**（尺寸 +33B，無損未改動） |
| `code_to_know_supabase_prod.dump.sha256` | **102** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50  code_to_know_supabase_prod.dump` | **PASS** |

---

## 三、TOC 過濾清單預備分析（記憶體解析實測）

對 `code_to_know_supabase_prod.dump` 執行純記憶體 `PGDMP` v1.16.0 二進位 TOC 解析（總計 **926 筆項目**），逐一核對 Phase 3-C-11C 所列之 **10 個 TOC ID**：

### 1. 10 個目標排除 TOC ID 與實際項目一一對應表

| TOC ID | 實際對應 TOC 清單格式（`<id>; <tableOid> <oid> <desc> <ns> <tag> <owner>`） | 驗證狀態 |
|---:|---|---|
| **5** | `5; 3079 16604 EXTENSION - supabase_vault ` | ✅ 精確對應 |
| **13** | `13; 2615 16603 SCHEMA - vault supabase_admin` | ✅ 精確對應 |
| **3777** | `3777; 0 16608 TABLE DATA vault secrets supabase_admin` | ✅ 精確對應 |
| **4791** | `4791; 0 0 ACL - SCHEMA vault supabase_admin` | ✅ 精確對應 |
| **4794** | `4794; 0 0 COMMENT - EXTENSION supabase_vault ` | ✅ 精確對應 |
| **4888** | `4888; 0 0 ACL vault FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) supabase_admin` | ✅ 精確對應 |
| **4889** | `4889; 0 0 ACL vault FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) supabase_admin` | ✅ 精確對應 |
| **4890** | `4890; 0 0 ACL vault FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) supabase_admin` | ✅ 精確對應 |
| **4997** | `4997; 0 0 ACL vault TABLE secrets supabase_admin` | ✅ 精確對應 |
| **4998** | `4998; 0 0 ACL vault TABLE decrypted_secrets supabase_admin` | ✅ 精確對應 |

### 2. 過濾清單保留完整性驗證

- **排除數量**：`10 / 926` 筆（精確匹配 `10/10`）。
- **保留數量**：`916 / 926` 筆。
- **不誤刪其他 Extension**：以下 6 筆通用擴充及註解 100% 保留：
  - `2; 3079 16389 EXTENSION - pg_stat_statements` & `4792; ... COMMENT - EXTENSION pg_stat_statements`
  - `4; 3079 16443 EXTENSION - pgcrypto` & `4793; ... COMMENT - EXTENSION pgcrypto`
  - `3; 3079 16432 EXTENSION - uuid-ossp` & `4795; ... COMMENT - EXTENSION "uuid-ossp"`
- **不意外排除 `public` 核心物件**：`public` 全數 **337 / 337 筆**項目完整保留。
- **零懸空依賴**：其餘 916 筆保留項目中，依賴上述 10 個被排除 ID 的數量為 **`0`**。
- **無多行標籤斷行風險**：全部 926 筆項目的 `tag`、`desc`、`namespace` 欄位內含換行符號筆數為 **`0`**。

### 3. 安全產生 `--use-list` (`-L`) 過濾清單之規範設計

為避免文字比對誤傷或格式錯誤造成不完整還原，建議後續實作採以下設計：
1. **精準識別（結合 TOC ID / 物件簽章，非寬鬆關鍵字）**：
   - 使用 `pg_restore --list <dump>` 產生原始清單後，僅針對「以 `;` 註解或移除」明確屬於 `supabase_vault` / `vault` schema 的這 10 筆項目（比對項目行首 ID 屬於 `^(5|13|3777|4791|4794|4888|4889|4890|4997|4998);\s` 且同時檢查物件名稱符合 `vault` / `supabase_vault`，**或直接以結構簽章規則匹配** `EXTENSION - supabase_vault`、`COMMENT - EXTENSION supabase_vault`、`SCHEMA - vault`、`ACL - SCHEMA vault` 及 `namespace === vault` 之項目）。
2. **斷言防護（Fail-Closed）**：
   - 過濾前與過濾後的有效非註解項目差值**必須嚴格等於預期排除筆數**（本備份為 10 筆），且必須斷言所有 `public` 項目與其餘 `EXTENSION`（`pgcrypto`、`uuid-ossp`、`pg_stat_statements`）全數仍在清單中，否則立即中止。
3. **編碼與換行格式防護（避開 PowerShell UTF-8 BOM 陷阱）**：
   - PowerShell 5.1 若使用 `Set-Content -Encoding UTF8` 會寫入 **UTF-8 BOM (`0xEF 0xBB 0xBF`)**，容器內 Linux 版 `pg_restore -L` 若讀到檔頭 BOM 可能導致第一行解析異常或提示無效行。
   - **必須以 UTF-8 無 BOM（`[System.Text.UTF8Encoding]::new($false)`）與 LF (`\n`) 寫出清單檔**。

---

## 四、未解決問題與阻塞項目

1. **【阻塞項】Docker Desktop 尚未啟動**：目前無法連線 `dockerDesktopLinuxEngine`，導致 PG17 容器狀態、PG17.11 版本、5432/5433 埠口隔離、既有 3 個測試庫狀態（含 `c2k_dryrun_sandbox` 與 `code_to_know_c2kb_prod_restore_test`）、新庫 `code_to_know_c2kb_prod_restore_clean_v2` 不存在確認，以及容器內 `pg_restore --version` / `--use-list` / `-N` 支援性皆尚未實測。
2. **【待實機確認】`PUBLICATION supabase_realtime` (`#4698`)**：容器恢復後需實測將過濾後清單傳入 `pg_restore --use-list`（只分析參數支援與清單載入，不實際寫庫）或評估 `wal_level` 警告對 Exit Code 的影響。

---

## 五、最終判定

**最終判定**：**CONDITIONAL PASS**

**原因**：
- 離線層面（備份 `.dump`/`.c2kb`/`.sha256` 完整性、10 個 Vault TOC ID 精確對應與無副作用驗證、`-L` 過濾清單安全設計）**已 100% 就緒**，不存在備份損毀或資料遺失風險。
- 但 **Docker Desktop 尚未啟動**，環境與目標資料庫狀態（檢查項目 1~6、8、9）目前無法實機驗證，必須由使用者啟動 Docker Desktop 後補完現場環境唯讀核對，方可進入實際還原授權階段。

*本階段已完成檢查與報告產出並立即停止，未執行任何實際還原。*
