# CODE TO KNOW｜Phase 3-C-16A：PG17 LOGIN 角色測試唯讀前置查核報告

- **查核階段**：Phase 3-C-16A：PG17 LOGIN 角色測試唯讀前置查核
- **查核日期**：2026-11-11（UTC+8）
- **查核性質**：**100% 唯讀前置查核**（未連線 Supabase、未建立/修改/刪除 PostgreSQL 角色、未執行 `CREATE`/`ALTER`/`DROP`/`GRANT`/`REVOKE` 等任何 SQL 寫入、未修改任何資料庫資料或結構、未修改程式碼/SQL/Prisma/PowerShell/Docker/環境設定、未讀取或輸出任何密碼/金鑰/Token/連線字串、未執行 Git 寫入操作、未自動進入實際 `LOGIN` 角色建立階段）
- **查核依據**：[`DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md)、[`DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md)
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`

> **最終判定**：**`CONDITIONAL PASS`（部分條件待補；本機 PG17.11 沙盒與備份主體就緒，惟須先補足 4 項前置條件後方可於下一階段授權執行真實 `LOGIN` 測試，本階段嚴格停機未做任何變更）**

---

## 1. PG17 / PG16 環境狀態（Section 三.A）

### 1.1 Docker Engine 與容器隔離檢查

- **Docker Engine 版本**：Server `29.9.2`（正常運作）。
- **本機容器與埠號實測**：

| 項目 | PG17 還原測試沙盒 | PG16 本機開發環境 |
|---|---|---|
| **容器名稱** | `code_to_know_pg17_restore_sandbox` | `code_to_know_postgres` |
| **映像 / Image** | `3540c0362c80` | `postgres:16-alpine` |
| **容器狀態** | `Up 2 hours` | `Up 2 hours (healthy)` |
| **PostgreSQL 版本** | **`PostgreSQL 17.11`**（`x86_64-pc-linux-musl`, `gcc 15.2.0`, 64-bit） | **`PostgreSQL 16.15`** |
| **Docker 埠映射** | `127.0.0.1:5433->5432/tcp` | `127.0.0.1:5432->5432/tcp` |
| **宿主機 TCP 監聽** | `127.0.0.1:5433`（`Listen`, PID `23940`） | `127.0.0.1:5432`（`Listen`, PID `23940`） |
| **就緒檢查（`pg_isready`）** | 容器內部埠 `127.0.0.1:5432 - accepting connections` | `127.0.0.1:5432 - accepting connections` |
| **目標連線身分區隔** | 預設超級使用者 `postgres` + `codetoknow_restore` | 依 [`docker-compose.yml`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docker-compose.yml#L9-L11) 使用 `codetoknow` / `code_to_know`（容器內實測無 `postgres` 角色，確認雙實例無混淆） |

### 1.2 PG17 實例資料庫清單與保留狀態

於 `code_to_know_pg17_restore_sandbox` 唯讀查詢 `pg_database`（共 6 個資料庫）：

| 資料庫名稱 | 大小 | 擁有者（`datdba`） | 狀態說明 |
|---|---:|---|---|
| **`code_to_know_c2kb_prod_restore_clean_v2`** | `12 MB` | `codetoknow_restore` | **目標驗收資料庫存在且完整**（37 張 `public` 表）。 |
| **`code_to_know_c2kb_prod_restore_test`** | `12 MB` | `codetoknow_restore` | **既有部分還原資料庫完整保留未動**（37 張 `public` 表）。 |
| `code_to_know_cloud_restore_test` | `12 MB` | `codetoknow_restore` | 既有測試資料庫完整保留未動（37 張 `public` 表）。 |
| `postgres` / `template1` / `template0` | `7686 kB` / `7433 kB` / `7361 kB` | `postgres` | PostgreSQL 預設系統資料庫。 |

### 1.3 PG17 關鍵伺服器參數與 `pg_hba` 認證規則（唯讀實測）

- **`password_encryption`**：`scram-sha-256`
- **`wal_level`**：`replica`（註：不支援 Logical Replication CDC，維持現狀未改）
- **`listen_addresses`**：`*`
- **`pg_hba_file_rules` 實測**：

| Line | Type | Database | User | Address | Auth Method | Preflight 影響判斷 |
|---:|---|---|---|---|---|---|
| 117 | `local` | `{all}` | `{all}` | *(socket)* | **`trust`** | 容器內 `psql` 不驗證密碼 |
| 119 | `host` | `{all}` | `{all}` | `127.0.0.1` | **`trust`** | **重要發現：本機 IPv4 連 `127.0.0.1:5433` 會跳過密碼驗證** |
| 121 | `host` | `{all}` | `{all}` | `::1` | **`trust`** | 本機 IPv6 loopback 亦跳過密碼驗證 |
| 124–126 | `local`/`host` replication | `{all}` | `{all}` | loopback | `trust` | Replication 連線規則 |
| 128 | `host` | `{all}` | `{all}` | `all` | **`scram-sha-256`** | 僅非 loopback 來源（例如跨 Docker 橋接網段 IP）才強制驗證密碼 |

---

## 2. 目前角色狀態（Section 三.B）

於 PG17 唯讀查詢 `pg_roles`（不查詢任何密碼雜湊）與 `pg_auth_members`：

| 目標角色 | 是否存在 | `LOGIN` | `SUPERUSER` | `CREATEDB` | `CREATEROLE` | `BYPASSRLS` | `INHERIT` | `REPLICATION` | `connlimit` | 角色會員關係與物件擁有權（目標庫 `clean_v2`） |
|---|---|---|---|---|---|---|---|---|---:|---|
| **`postgres`** | **存在** | `t` | `t` | `t` | `t` | `t` | `t` | `t` | `-1` | 僅包含系統監控角色預設關係（`pg_monitor` 成員於系統表）。擁有 `public` 全部 **37 張表**、`AnnouncementStatus`、`rls_auto_enable`、7 個 Event Triggers、6 個 `extensions.*` 函式、`supabase_realtime` Publication，以及 6 個非 `public` Schema（`auth`/`extensions`/`graphql`/`graphql_public`/`realtime`/`storage`）。 |
| **`migration_admin`** | **不存在** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | 無角色、`pg_shdepend` 依賴數 = `0`、物件擁有權數 = `0`。 |
| **`app_runtime`** | **不存在** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | 無角色、`pg_shdepend` 依賴數 = `0`、物件擁有權數 = `0`。 |
| `codetoknow_restore` *(既有)* | **存在** | `t` | `f` | `f` | `f` | `f` | `t` | `f` | `-1` | 為 `code_to_know_c2kb_prod_restore_clean_v2` 之 `db_owner`，因此透過 `pg_database_owner` 成為 **`public` Schema 的實際 Owner**（但擁有 `0` 張表與 `0` 個 Type）。 |

---

## 3. 測試資料庫結構（Section 三.C）

於 `code_to_know_c2kb_prod_restore_clean_v2` 執行唯讀查詢，實測結果如下：

| 查核項目 | 預期規格（Phase 3-C-13/15） | 本次唯讀實測值 | 核對結果 |
|---|---:|---:|---|
| `public` 資料表（`BASE TABLE`） | `37` | **`37`** | 符合 |
| Primary Key（`PRIMARY KEY`） | `37` | **`37`** | 符合 |
| Foreign Key（`contype = 'f'`） | `47`（0 未驗證） | **`47`**（`47` valid / `0` invalid） | 符合 |
| `public` 索引（`pg_index`） | `133`（0 invalid） | **`133`**（`133` valid） | 符合 |
| `public` RLS 啟用表（`relrowsecurity = true`） | `37` | **`37`**（`relforcerowsecurity = t` 為 **`0`**） | 符合（僅表級 RLS 旗標開啟，未強制 Owner/BYPASSRLS） |
| 目前 Policy 數量（`pg_policies`） | `0` | **`0`**（`public = 0`，全庫 `0`） | 符合 |
| `public."AuditLog"` 權限狀態 | 僅 `postgres` 擁有，未對應用角色限權 | `relacl = NULL`、`owner = postgres`；`PUBLIC` 與 `codetoknow_restore` 之 `SELECT/INSERT/UPDATE/DELETE` 皆 **`false`** | 符合沙盒 `--no-acl` 現狀（正式 Runtime Append-only ACL 尚未部署） |
| `public."_prisma_migrations"` 權限狀態 | 僅 `postgres` 擁有，共 2 筆遷移 | `relacl = NULL`、`owner = postgres`；`PUBLIC` 與 `codetoknow_restore` 全權限 **`false`**；實測 **`2`** 筆資料列 | 符合 |
| 使用者 Schema（`pg_namespace`） | `7` 個（含 `public`） | **`7`** 個：`auth`、`extensions`、`graphql`、`graphql_public`、`public`、`realtime`、`storage`（無 `vault`） | 符合（注意：`public` Owner 為 `pg_database_owner`、`nspacl` 為 `{pg_database_owner=UC/pg_database_owner,=U/pg_database_owner}`；`extensions` `nspacl` 為 **`NULL`**） |
| `public` 自訂 Enum 與 Sequences | `AnnouncementStatus` / `0` Sequences | `AnnouncementStatus`（`{DRAFT,PUBLISHED,ARCHIVED}`, `owner = postgres`）；Sequences = **`0`** | 符合 |
| 擴充套件（`pg_extension`） | `4` 個 | **`4`** 個：`pg_stat_statements (1.11)`、`pgcrypto (1.3)`、`uuid-ossp (1.1)`（皆在 `extensions`）與 `plpgsql (1.0)`（`pg_catalog`） | 符合 |
| Event Triggers 與 Publication | `ensure_rls` 等觸發器 + `supabase_realtime` | **7 個 Event Triggers**（`ensure_rls` 呼叫 `SECURITY DEFINER` 函式 `public.rls_auto_enable`；其餘 6 個呼叫 `SECURITY INVOKER` 函式 `extensions.*`）與 **`1` 個 Publication**（`supabase_realtime`, `puballtables = f`） | 符合結構（見第 7 節潛在測試影響提示） |
| 預設權限（`pg_default_acl`） | `0`（尚未配置 `migration_admin` 規則） | **`0`** | 符合現狀 |

---

## 4. LOGIN 測試前置條件（對應 Section 三.D 與實機查核）

若下一階段獲使用者明確授權進入實際 `LOGIN` 測試（暫稱 Phase 3-C-16B），必須滿足以下前置條件（本階段均**未執行**）：

1. **測試資料庫隔離（保護基準庫與部分還原庫）**：
   - 不建議直接在 `code_to_know_c2kb_prod_restore_clean_v2`（Phase 3-C-12/13 驗收基準）上執行角色切換與 DDL 測試，亦不得觸碰 `code_to_know_c2kb_prod_restore_test`。應以基準備份還原或克隆建立獨立沙盒測試庫（例如 `code_to_know_c2kb_login_test`）。
2. **密碼驗證閘門必須啟用（解決 `pg_hba.conf` loopback `trust` 問題）**：
   - 因 PG17 容器目前在 `local`、`127.0.0.1` 與 `::1` 規則為 **`trust`**，下一階段授權測試前必須確定「如何觸發真實 `scram-sha-256` 密碼檢查」（例如在測試期間針對目標測試角色或測試設定調整 PG17 `pg_hba.conf` 為 `scram-sha-256` 並重載，或從獨立 Docker 容器網段觸及行 128 規則），否則無法驗證「錯誤密碼登入失敗」。
3. **沙盒測試專用密碼隔離**：
   - `migration_admin` 與 `app_runtime` 的測試密碼必須為沙盒專用隨機密碼、僅於記憶體／安全程序傳遞、絕不寫入 `.env`、專案程式碼或 Git，且不得與任何正式環境金鑰混用。
4. **沙盒中繼權限差異對齊**：
   - 因基準庫為 `--no-owner --no-acl` 還原，`public` Schema 目前由 `pg_database_owner`（`codetoknow_restore`）擁有，且 `extensions` Schema 無 `PUBLIC USAGE` 授權。在依 Phase 3-C-15 步驟切換測試時，須記錄轉移 `public` Owner 及 `migration_admin` 觸發 `extensions.*` Event Trigger 的實際行為（見第 7 節）。

---

## 5. 權限測試清單（Section 三.D 未來驗證計畫，本階段僅規劃未執行）

根據 Phase 3-C-15 設計與 Section 三.D 要求，下一階段獲授權後須逐項實測以下 10 項（**全程不依賴 `SET ROLE`，皆以真實角色與連線實測**）：

| # | 驗證項目 | 未來執行方式（純計畫設計） | 嚴格通過準則 |
|---:|---|---|---|
| **1** | **`migration_admin` 真實 `LOGIN`** | 使用 `postgresql://migration_admin:<test_pw>@127.0.0.1:5433/<login_test_db>` 由 `psql` / Node `pg` / `prisma migrate status` 直接建立連線（啟用密碼驗證）。 | 登入成功；`SELECT current_user, session_user;` 皆回傳 `migration_admin`；無 `SUPERUSER` 旗標。 |
| **2** | **`app_runtime` 真實 `LOGIN`** | 使用 `postgresql://app_runtime:<test_pw>@127.0.0.1:5433/<login_test_db>` 由 Node `pg.Pool` / Prisma `@prisma/adapter-pg` 直接建立連線（啟用密碼驗證）。 | 登入成功；`SELECT current_user, session_user;` 皆回傳 `app_runtime`；一般業務表 `SELECT/INSERT/UPDATE/DELETE` 正常。 |
| **3** | **錯誤密碼登入失敗** | 分別以錯誤密碼嘗試連線 `migration_admin` 與 `app_runtime`（須於已啟用 `scram-sha-256` 驗證路徑下實測）。 | PostgreSQL 必明確回傳密碼認證失敗錯誤（SQLSTATE `28P01`），連線遭拒（不可因 `trust` 放行）。 |
| **4** | **Runtime 無法執行 DDL** | 以 `app_runtime` 連線執行 `CREATE TABLE ...`、`ALTER TABLE "User" ...`、`CREATE TYPE ...`、`DROP TABLE ...`、`TRUNCATE TABLE "User"`。 | 全部必回傳 `permission denied`（SQLSTATE `42501`），`public` Schema 與資料表結構無任何變動。 |
| **5** | **Runtime 無法讀取 `_prisma_migrations`** | 以 `app_runtime` 連線執行 `SELECT * FROM public."_prisma_migrations";` 及 `INSERT`/`UPDATE`/`DELETE`。 | 全數必回傳 `permission denied for table _prisma_migrations`（`42501`）。 |
| **6** | **Runtime 無法修改 `AuditLog`** | 以 `app_runtime` 連線先驗證 `INSERT`/`SELECT` `"AuditLog"` 成功，再執行 `UPDATE`、`DELETE`、`TRUNCATE` `"AuditLog"`。 | `INSERT` 與 `SELECT` 成功；`UPDATE`/`DELETE`/`TRUNCATE` 必全部回傳 `permission denied for table AuditLog`（`42501`）。 |
| **7** | **`migration_admin` 可執行必要 Migration 操作** | 以 `migration_admin` 連線取得 `pg_advisory_lock`、對現有表評估相容 DDL、建立含 Enum/FK/Sequence（可測試用）之暫時遷移表、驗證 `rls_auto_enable` 觸發與卸除清理，並檢驗 `DEFAULT PRIVILEGES` 是否自動將新表與新 Sequence（僅 `USAGE, SELECT`，無 `UPDATE`）授權給 `app_runtime`。 | 無 `permission denied`（並同步實測檢查 6 個 `extensions.*` Event Triggers 在非 Superuser 下是否需額外授權）；新物件自動依 Phase 3-C-15 授權正確且不外洩 `UPDATE` Sequence 權限。 |
| **8** | **Runtime 與 Migration 權限彼此隔離** | 以 `app_runtime` 嘗試 `SET ROLE migration_admin;`；以 `migration_admin` 檢查無 `app_runtime` 成員關係且無權讀取/寫入非 `public` 系統 Schema（`auth`/`storage`/`realtime` 表）與不可跨過系統限制篡改角色屬性（`ALTER ROLE ... SUPERUSER` / `CREATE ROLE`）。 | `SET ROLE`、`CREATE ROLE`、`ALTER ROLE` 與系統 Schema 存取皆遭拒絕（`42501`），兩角色於 `pg_auth_members` 零彼此繼承。 |
| **9** | **角色無法取得不應有的高權限** | 以 `app_runtime` 與 `migration_admin` 分別嘗試 `SET ROLE postgres`、`CREATE DATABASE`、`ALTER SYSTEM`、`COPY ... TO PROGRAM`、`CREATE EXTENSION`。 | 全部必回傳權限不足（`42501`），`pg_roles` 核對 `rolsuper/rolcreatedb/rolcreaterole/rolinherit/rolreplication` 皆為 `false`。 |
| **10** | **連線中斷及失敗回復** | 模擬「切換中途失敗／強制終止殘留會話 + 執行 7 階段受控回滾 + 刻意漏轉 1 張表測試 `DROP ROLE` 報錯阻斷（確認未誤用 `DROP OWNED BY`）」，最後歸還全部物件擁有權並完成乾淨回滾與重套冪等測試。 | 漏轉情境 `DROP ROLE` 安全報錯且資料表無損；完整回滾後 `pg_shdepend = 0`、兩角色清除、原 37 張表與遷移資料 100% 完整。 |

---

## 6. 備份及回滾準備（Section 三.E）

1. **最新加密與明文備份核對**（目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`，**未讀取或輸出任何金鑰**）：
   - `code_to_know_supabase_prod.dump`：實測大小 **`505,249`** bytes，實測 `SHA-256` 為 `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`（與同目錄 `code_to_know_supabase_prod.dump.sha256` 及 Phase 3-C-13 紀錄完全一致）。
   - `code_to_know_supabase_prod.dump.c2kb`：實測大小 **`505,282`** bytes，實測 `SHA-256` 為 `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`（與 Phase 3-C-13 紀錄完全一致）。
2. **PG17 還原資料庫完整度**：
   - 目標基準庫 `code_to_know_c2kb_prod_restore_clean_v2` 之 37 表、37 PK、47 FK（0 未驗證）、133 索引、37 RLS 旗標與 2 筆 `_prisma_migrations` 全數完整；且 `code_to_know_c2kb_prod_restore_test` 完整保留未動。
3. **回滾依賴檢查與資料誤刪風險防範**：
   - [`DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md#L188-L225) 已明確規範 7 階段受控回滾、步驟 11 雙重依賴斷言（`pg_shdepend` = 0 + 多系統目錄擁有權計數 = 0）與步驟 12 **明文全面禁用 `DROP OWNED BY` / `REASSIGN OWNED BY postgres`**。
   - **當前剩餘誤刪風險點**：若下一階段未複製獨立測試庫而直接在 `code_to_know_c2kb_prod_restore_clean_v2` 操作、或在測試過程中誤用 `DROP OWNED BY`，將有破壞 Phase 3-C-12/13 驗收基準或誤刪表物件之風險；因此下一階段必須採用「獨立測試複本庫 + 嚴禁 `DROP OWNED BY`」雙重防護。

---

## 7. 未解決問題與查核新發現（須於實際 LOGIN 測試前正視）

1. **`pg_hba.conf` 本機 `trust` 認證規則會掩蓋錯誤密碼測試**：
   - 實測 PG17 `pg_hba_file_rules` 第 117、119、121 行對 `local`、`127.0.0.1`、`::1` 全設為 `trust`；若直接從 Windows 宿主機打 `127.0.0.1:5433`，錯誤密碼不會被拒絕。測試第 1、2、3 項前必須納入 `scram-sha-256` 密碼驗證手段。
2. **沙盒 `--no-acl` 造成 `extensions` Schema 權限與 `public` Owner (`pg_database_owner`) 差異**：
   - 實測基準庫有 **6 個來自 Supabase 的 Event Triggers 呼叫 `extensions.*` 且屬性為 `SECURITY INVOKER` (`prosecdef = f`)**，但目前 `extensions` Schema 之 `nspacl` 為空（未授 `PUBLIC USAGE`）。這代表以非 Superuser 的 `migration_admin` 測試 `CREATE TABLE`/`DROP TABLE`（第 7 項）時，**極可能觸發對 `extensions` Schema 的 `permission denied`**（需於沙盒測試驗證這究竟是沙盒 `--no-acl` 現象，還是須於切換前處理的前置條件）。
   - 另基準庫 `public` Schema Owner 為 `pg_database_owner`（解析為 `codetoknow_restore`），不同於正式庫的 `postgres`，未來在沙盒建立獨立測試庫或執行步驟 2 轉移 `public` Owner 時須注意此背景差異。
3. **本機沙盒仍無法代表 Supabase 正式環境行為**：
   - 即使 PG17.11 沙盒 10 項 `LOGIN` 測試全數通過，**仍不代表** Supabase Supavisor Pooler 支援自訂 `LOGIN` 角色（`app_runtime.ypibmyfxfhsyfdwxprpi`）或正式庫 `postgres` 角色有權對 `public` Schema 執行 `ALTER SCHEMA ... OWNER TO migration_admin`；雲端行為仍需依 Phase 3-C-15 規範另外單獨授權唯讀實測。
4. **應用程式 P0/P1 安全缺口尚未修補**：
   - Phase 3-C-15 第 7 節列管之 7 項應用程式授權／檢驗缺口仍維持原狀（本階段依禁令未修改任何程式碼），不得因完成 PG17 `LOGIN` 測試即誤判可進入正式環境切換。

---

## 8. Git 狀態確認（Section 三.F）與進入實際 LOGIN 測試條件評估

### 8.1 Git 唯讀狀態確認

- **Branch**：`main`
- **HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **Working tree（`git status --short`）**：
  - 既有未提交修改（非本階段異動，完整維持原樣）：`scripts/database/backup-pipeline.test.cjs`、`scripts/database/restore_pg17_sandbox.ps1`、`scripts/database/restore_pg17_sandbox.test.ps1`、既有個人檔案（`D "~$DE_TO_KNOW_20..."`、`M "新增 文字文件.txt"`）。
  - 既有未追蹤檔案（非本階段異動，完整維持原樣）：`.editorconfig`、`.vite/`、`1.docx`、`scripts/database/ps-encoding-guard.test.cjs`、`docs/DATABASE_PHASE3C11*.md`、`docs/DATABASE_PHASE3C13_*.md`、`docs/DATABASE_PHASE3C14_*.md`、`docs/DATABASE_PHASE3C15_*.md`、`docs/GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`、`tmp/`、`照片/`。
  - **本階段唯一新增檔案**：`docs/DATABASE_PHASE3C16A_PG17_LOGIN_PREFLIGHT.md`。未執行任何 Git 寫入操作，亦未觸及任何既有檔案。

### 8.2 是否具備進入實際 LOGIN 測試的條件與最終判定

- **具備條件面**：Docker (`29.9.2`)、PG17.11 沙盒 (`127.0.0.1:5433`) 與 PG16.15 (`127.0.0.1:5432`) 完全隔離運行、目標資料庫 `code_to_know_c2kb_prod_restore_clean_v2` 與既有部分還原庫完整、最新加密備份 `.c2kb` 與明文 `.dump` SHA-256 100% 吻合、安全回滾規範完備。
- **待補前置面**：（1）PG17 `pg_hba.conf` loopback `trust` 規則須調整或繞過以確保真實 `scram-sha-256` 密碼驗證有效；（2）建議建立獨立測試複本庫以免污染 `code_to_know_c2kb_prod_restore_clean_v2`；（3）需釐清沙盒 `--no-acl` 後 `extensions` Schema 對 `SECURITY INVOKER` Event Triggers 的測試處置；（4）尚未獲使用者授權建立 `migration_admin` 與 `app_runtime`。

#### 最終判定（Section 五）：**`CONDITIONAL PASS`**

- 意義：**核心沙盒環境與備份狀態正常，無需 `NO-GO` 阻斷本機測試；但在取得使用者授權進入實際 `LOGIN` 測試時，須優先落實上述前置條件（獨立測試複本庫與真實 `scram-sha-256` 密碼驗證），方能產出有效可信的 10 項權限實測結論。**

---

*本階段已完成 Phase 3-C-16A PG17 LOGIN 角色測試唯讀前置查核並立即停止；未建立任何角色、未執行任何 SQL 寫入、未連線 Supabase，等待使用者審閱本報告並決定是否另外授權下一階段測試。*
