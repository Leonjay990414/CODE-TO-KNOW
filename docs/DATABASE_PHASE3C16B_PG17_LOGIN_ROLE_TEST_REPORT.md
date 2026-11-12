# CODE TO KNOW｜Phase 3-C-16B：獨立 PG17.11 LOGIN 認證與角色權限實測報告

- **實測階段**：Phase 3-C-16B：獨立 PG17.11 LOGIN 認證與角色權限實測
- **實測日期**：2026-11-11（UTC+8）
- **授權範圍**：僅限本機新建獨立暫時 Docker 容器（`127.0.0.1:5434`）執行 `SCRAM-SHA-256` 真實 `LOGIN` 認證與角色權限實測；未觸碰原有 PG17、PG16、原始 `.dump`/`.c2kb`、KeePassXC、Supabase 或 Render。
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **安全性聲明**：本報告及測試過程未將任何測試密碼、SCRAM Hash、金鑰、Token 或完整連線字串寫入命令列參數、PowerShell 歷史紀錄、Git、測試報告或一般輸出日誌（所有測試密碼於記憶體以 CSPRNG 產生，測試結束立即銷毀）。

> **實測與判定總結**：
> - **Phase 3-C-16B 本機獨立 `LOGIN` 實測驗收**：**`PASS`**（獨立容器、SCRAM-SHA-256 正誤密碼、Runtime 正/負向、Migration Admin 權限、Event Trigger 相容性、保護既有環境與測試後清理均具備實測證據）。
> - **對後續階段判定**：對下一階段本地「應用程式安全缺口修補與整合測試」為 **`CONDITIONAL GO`**；對 **正式 Supabase 角色切換與 Render 上線仍維持嚴格 `NO-GO`**。

---

## 1. 獨立容器資訊

| 項目 | 實測記錄 |
|---|---|
| **暫時容器名稱** | `code_to_know_pg17_login_test` |
| **容器完整 ID** | `502ed5c1a492094b84ec966ae4cd36b7b513a702825b6e4950af5e30e0f2904d`（Short ID: `502ed5c1a492`） |
| **綁定連接埠** | `127.0.0.1:5434->5432/tcp`（僅綁定本機 IPv4 Loopback） |
| **測試資料庫名稱** | `code_to_know_c2k_login_test`（純測試複本，非正式資料庫） |
| **暫時測試角色** | `c2k_test_migration_admin`、`c2k_test_app_runtime`（未在原有 PG17 或 Supabase 建立任何正式名稱角色） |

---

## 2. PostgreSQL 版本與 Image Digest

與既有 PG17 還原沙盒容器（`code_to_know_pg17_restore_sandbox`）完全對齊：

- **Image ID**：`sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
- **Image RepoDigest**：`postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`（`postgres:17-alpine`）
- **資料庫內 `SELECT version();` 實測**：`PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit`

---

## 3. Volume 隔離證據

透過 `docker inspect` 與 `docker volume ls` 確認三套實例資料磁碟區完全獨立、零共用：

| 容器名稱 | 資料磁碟區（Volume Name） | 掛載目的路徑 | 角色定位 |
|---|---|---|---|
| **`code_to_know_pg17_login_test`** *(本階段新建／測畢已清除)* | **`code_to_know_pg17_login_test_data`** | `/var/lib/postgresql/data` | 本階段獨立暫時測試實例 |
| `code_to_know_pg17_restore_sandbox` *(既有)* | `code_to_know_pg17_restore_sandbox_data` | `/var/lib/postgresql/data` | 原 PG17 還原沙盒（完全未動） |
| `code_to_know_postgres` *(既有)* | `code-to-know_postgres_data` | `/var/lib/postgresql/data` | 原 PG16 本機開發庫（完全未動） |

---

## 4. 測試資料庫結構核對

以唯讀 `pg_dump --format=custom --no-owner --no-acl` 自 `code_to_know_c2kb_prod_restore_clean_v2` 串流匯出（`410,776` bytes，未對原庫執行任何寫入），透過容器內暫時 `PGPASSFILE`（以標準輸入建立並於還原後立即 `rm -f`）執行 `pg_restore` 匯入 `code_to_know_c2k_login_test`（`Exit Code = 0`，`stderr` 無錯誤訊息）。

還原後結構實測對比如下：

| 結構項目 | 原 PG17 基準庫 (`clean_v2`) | 本次獨立測試庫 (`c2k_login_test`) | 核對結果 |
|---|---:|---:|---|
| `public` 資料表（`BASE TABLE`） | `37` | **`37`** | **完全一致** |
| Primary Key | `37` | **`37`** | **完全一致** |
| Foreign Key（已驗證） | `47`（`47` valid） | **`47`**（`47` valid） | **完全一致** |
| `public` 索引 | `133` | **`133`** | **完全一致** |
| RLS 啟用表 (`relrowsecurity = t`) | `37` | **`37`**（Policies = `0`） | **完全一致** |
| `public` 自訂 Enum (`AnnouncementStatus`) | `DRAFT, PUBLISHED, ARCHIVED` | **`DRAFT, PUBLISHED, ARCHIVED`** | **完全一致** |
| `AuditLog` 與 `_prisma_migrations` | 結構存在 / `2` 筆遷移 | 結構存在 / **`2`** 筆遷移 | **完全一致** |
| 擴充與非 `public` Schema | `4` 擴充 / `7` Schema | **`4`** 擴充 / **`7`** Schema | **完全一致** |
| Event Triggers (`pg_event_trigger`) | `7` 個 | **`7`** 個 | **完全一致** |

---

## 5. SCRAM 認證設定（Section 四.A）

新容器以 `POSTGRES_HOST_AUTH_METHOD=scram-sha-256` 與 `POSTGRES_INITDB_ARGS=--auth=scram-sha-256 --auth-host=scram-sha-256 --auth-local=scram-sha-256` 初始化（且以唯讀 `POSTGRES_PASSWORD_FILE` 注入，避免任何密碼進入命令列參數）。實測組態如下：

- **`SHOW password_encryption;`** = **`scram-sha-256`**
- **`pg_hba_file_rules` 全表（0 條 `trust` / `md5` 規則）**：

| Line | Type | Database | User | Address / Netmask | Auth Method |
|---:|---|---|---|---|---|
| 113 | `local` | `{all}` | `{all}` | *(Unix socket)* | `scram-sha-256` |
| 115 | `host` | `{all}` | `{all}` | `127.0.0.1` (`255.255.255.255`) | `scram-sha-256` |
| 117 | `host` | `{all}` | `{all}` | `::1` (`ffff:...`) | `scram-sha-256` |
| 120 | `local` | `{replication}` | `{all}` | *(Unix socket)* | `scram-sha-256` |
| 121 | `host` | `{replication}` | `{all}` | `127.0.0.1` (`255.255.255.255`) | `scram-sha-256` |
| 122 | `host` | `{replication}` | `{all}` | `::1` (`ffff:...`) | `scram-sha-256` |
| 124 | `host` | `{all}` | `{all}` | `all` | `scram-sha-256` |

- **認證雜湊格式檢查（僅查詢布林式 `rolpassword LIKE 'SCRAM-SHA-256$%'`，未輸出任何雜湊字串）**：
  - `postgres`：`true`
  - `c2k_test_migration_admin`：`true`
  - `c2k_test_app_runtime`：`true`
- **實際命中規則確認**：宿主機 Node `pg` Client 經 `127.0.0.1:5434` 轉送至容器內介面時，`inet_client_addr()` 為 Docker 閘道 IP `172.17.0.1/32`（`inet_server_addr() = 172.17.0.3/32:5432`），精確命中第 **124 行** `host all all all scram-sha-256`；且第 113–122 行 `local`/`127.0.0.1`/`::1` 亦全部設為 `scram-sha-256`，無任何寬鬆規則排於 SCRAM 之前。註：因宿主機依安全規定僅綁定 IPv4 `127.0.0.1:5434`，直連 IPv6 `::1:5434` 呈現預期 `ECONNREFUSED`，IPv6 規則已於 `pg_hba_file_rules` 第 117/122 行核對為 `scram-sha-256`。

---

## 6. 正確密碼登入測試（Section 四.C）

透過 TCP Loopback（`127.0.0.1:5434`，Node `pg.Client` SASL/SCRAM-SHA-256）實測（**全程無 `SET ROLE`**）：

| 測試角色 | 實際結果 | 資料庫回傳身分驗證 | 判定 |
|---|---|---|---|
| `c2k_test_migration_admin` | 連線成功 | `current_user = c2k_test_migration_admin`、`session_user = c2k_test_migration_admin` | **`PASS`** |
| `c2k_test_app_runtime` | 連線成功 | `current_user = c2k_test_app_runtime`、`session_user = c2k_test_app_runtime` | **`PASS`** |

---

## 7. 錯誤密碼與無效認證登入測試（Section 四.C）

同樣透過 TCP Loopback（`127.0.0.1:5434`）實測：

| 測試案例 | 實測結果與錯誤碼 | 判定 |
|---|---|---|
| `c2k_test_migration_admin` + 錯誤密碼 | 遭拒｜SQLSTATE **`28P01`** (`password authentication failed for user "c2k_test_migration_admin"`) | **`PASS`** |
| `c2k_test_app_runtime` + 錯誤密碼 | 遭拒｜SQLSTATE **`28P01`** (`password authentication failed for user "c2k_test_app_runtime"`) | **`PASS`** |
| `c2k_test_migration_admin` + 空字串密碼 `""` | 遭拒｜SASL/SCRAM 握手拒絕空密碼（無法匿名登入） | **`PASS`** |
| `c2k_test_app_runtime` + 未提供密碼（`undefined`） | 遭拒｜SASL/SCRAM 拒絕缺漏密碼（無 `trust` 放行） | **`PASS`** |
| 不存在的角色 `c2k_nonexistent_role` | 遭拒｜SQLSTATE **`28P01`** (`password authentication failed for user "c2k_nonexistent_role"`) | **`PASS`** |

---

## 8. Runtime 權限正向測試（Section 五、六.A）

依 Phase 3-C-15 設計設定 `c2k_test_app_runtime` 屬性：`LOGIN=t`、`SUPERUSER=f`、`CREATEDB=f`、`CREATEROLE=f`、`BYPASSRLS=t`（對齊現況 37 表全開 RLS 且 0 Policy 下之方案 B 實測需求）、`INHERIT=f`、`REPLICATION=f`、`memberships = []`；權限為 `USAGE ON SCHEMA public`（顯式 `REVOKE CREATE`）、35 張一般業務表 DML、`AuditLog` 僅 `SELECT, INSERT`、`_prisma_migrations` `REVOKE ALL`、Sequences `USAGE, SELECT`（不含 `UPDATE`）、`AnnouncementStatus` `USAGE`。

因原表為空資料表，以下操作均在單一 `BEGIN ... ROLLBACK` 交易內執行並於回滾後複驗原表維持 `0` 筆資料：

| 正向測試項目 | 實測結果 | 判定 |
|---|---|---|
| 連線至 `code_to_know_c2k_login_test` 並查詢 `public."User"` | 回傳 `0` rows（無 RLS 阻擋） | **`PASS`** |
| `INSERT INTO public."Announcement"`（含 Enum `DRAFT`） | 成功寫入（搭配交易內暫時 `"User"` 滿足 FK） | **`PASS`** |
| `UPDATE public."Announcement"`（Enum 更新為 `PUBLISHED`） | 成功更新 | **`PASS`** |
| `DELETE FROM public."Announcement"` | 成功刪除 `1` 筆 | **`PASS`** |
| `INSERT INTO public."AuditLog"` | 成功寫入 | **`PASS`** |
| `SELECT` 新寫入之 `public."AuditLog"` 資料 | 成功讀回 `action = 'TEST_ACTION'` | **`PASS`** |
| `ROLLBACK` 後檢查 `"User"` / `"AuditLog"` | 兩表皆維持 `0` rows（原始還原資料未變動） | **`PASS`** |

---

## 9. Runtime 權限負向測試（Section 六.B、六.D）

以 `c2k_test_app_runtime` 直接執行各項越權／高危操作，全數精確命中 `42501`（`insufficient_privilege`）遭拒：

| 負向測試項目 | 預期 | 實測 SQLSTATE 與錯誤訊息摘要 | 判定 |
|---|---|---|---|
| `CREATE TABLE public.c2k_illegal_tbl` | 拒絕 | `42501`: `permission denied for schema public` | **`PASS`** |
| `ALTER TABLE public."User"` | 拒絕 | `42501`: `must be owner of table User` | **`PASS`** |
| `DROP TABLE public."Announcement"` | 拒絕 | `42501`: `must be owner of table Announcement` | **`PASS`** |
| `SELECT COUNT(*) FROM public."_prisma_migrations"` | 拒絕 | `42501`: `permission denied for table _prisma_migrations` | **`PASS`** |
| `UPDATE public."AuditLog"` | 拒絕 | `42501`: `permission denied for table AuditLog` | **`PASS`** |
| `DELETE FROM public."AuditLog"` | 拒絕 | `42501`: `permission denied for table AuditLog` | **`PASS`** |
| `TRUNCATE TABLE public."AuditLog"` | 拒絕 | `42501`: `permission denied for table AuditLog` | **`PASS`** |
| `ALTER TYPE public."AnnouncementStatus" ADD VALUE ...` | 拒絕 | `42501`: `must be owner of type "AnnouncementStatus"` | **`PASS`** |
| `CREATE ROLE c2k_backdoor WITH LOGIN` | 拒絕 | `42501`: `permission denied to create role` | **`PASS`** |
| `SET ROLE c2k_test_migration_admin` | 拒絕 | `42501`: `permission denied to set role "c2k_test_migration_admin"` | **`PASS`** |
| `SET ROLE postgres` | 拒絕 | `42501`: `permission denied to set role "postgres"` | **`PASS`** |
| `ALTER SYSTEM SET work_mem = '16MB'` | 拒絕 | `42501`: `permission denied to set parameter "work_mem"` | **`PASS`** |
| `SELECT COUNT(*) FROM auth.users`（系統 Schema 隔離） | 拒絕 | `42501`: `permission denied for schema auth` | **`PASS`** |
| `CONNECT` 至非目標 `postgres` 資料庫 | 拒絕 | `42501`: `permission denied for database "postgres"` | **`PASS`** |
| Runtime 嘗試 `DROP` Migration Admin 新建測試表 | 拒絕 | `42501`: `must be owner of table c2k_mig_ddl_probe` | **`PASS`** |
| Runtime 嘗試 `setval()` 修改新建測試表 Sequence | 拒絕 | `42501`: `permission denied for sequence c2k_mig_ddl_probe_id_seq` | **`PASS`** |

---

## 10. Migration Admin 權限測試、隔離與連線中斷回復（Section 五、六.C、六.D）

設定 `c2k_test_migration_admin` 屬性：`LOGIN=t`、`SUPERUSER=f`、`CREATEDB=f`、`CREATEROLE=f`、`BYPASSRLS=f`、`INHERIT=f`、`REPLICATION=f`，持有 `public` Schema、37 張表與 `AnnouncementStatus` Owner 身分（`ALTER DEFAULT PRIVILEGES` 指定授予 `c2k_test_app_runtime` 表 DML、Sequence 僅 `USAGE, SELECT`、Type `USAGE`）：

| 測試項目 | 實測結果 | 判定 |
|---|---|---|
| 讀取 `public."_prisma_migrations"` | 成功讀取 **`2`** 筆紀錄 | **`PASS`** |
| `pg_try_advisory_lock(727001)` / `pg_advisory_unlock(727001)` | `locked = true`、`unlocked = true` | **`PASS`** |
| 建立測試表 `public.c2k_mig_ddl_probe (id serial PRIMARY KEY, ...)` | 成功建表（含全部 7 個 Event Triggers 處於啟用狀態） | **`PASS`** |
| `ALTER TABLE public.c2k_mig_ddl_probe ADD COLUMN note text` | 成功執行 | **`PASS`** |
| 驗證 `DEFAULT PRIVILEGES` 自動授權 | `app_runtime` 對新表具 `SELECT/INSERT/UPDATE/DELETE`；對新 Sequence `USAGE=t, SELECT=t, UPDATE=f` | **`PASS`** |
| `DROP TABLE public.c2k_mig_ddl_probe` | 成功卸除（含 `sql_drop` Event Triggers 啟用） | **`PASS`** |
| `CREATE DATABASE` / `CREATE ROLE` / `SET ROLE postgres` | 全數遭拒（SQLSTATE **`42501`**） | **`PASS`** |
| `SELECT COUNT(*) FROM auth.users` / `CONNECT` 至 `postgres` 庫 | 全數遭拒（SQLSTATE **`42501`**，嚴格隔離非 `public` 資源） | **`PASS`** |
| 連線中斷與回復（`pg_terminate_backend` 強制終止 `app_runtime` 活躍交易連線後重連） | 舊連線正確中斷失敗，重新登入 `c2k_test_app_runtime` 成功無鎖定殘留 | **`PASS`** |

---

## 11. Event Trigger 相容性（Section 七）

未停用、未修改任何 Event Trigger，完整實測新容器內所有 7 個由備份還原而來的 Event Trigger：

| Event Trigger 名稱 | Event | 狀態 (`evtenabled`) | 觸發 Tag (`evttags`) | 呼叫函式 | 函式 Owner / 安全模式 | `c2k_test_migration_admin` 執行 DDL 實測表現 |
|---|---|---|---|---|---|---|
| **`ensure_rls`** | `ddl_command_end` | `O`（啟用） | `CREATE TABLE`, `CREATE TABLE AS`, `SELECT INTO` | `public.rls_auto_enable` | `postgres` / **`SECURITY DEFINER`** | **正常觸發並無錯完成**：自動對新建 `c2k_mig_ddl_probe` 開啟 **`relrowsecurity = true`**（`relforcerowsecurity = false`） |
| `issue_graphql_placeholder` | `sql_drop` | `O`（啟用） | `DROP EXTENSION` | `extensions.set_graphql_placeholder` | `postgres` / `SECURITY INVOKER` | 未觸發（僅限 `DROP EXTENSION`） |
| `issue_pg_cron_access` | `ddl_command_end` | `O`（啟用） | `CREATE EXTENSION` | `extensions.grant_pg_cron_access` | `postgres` / `SECURITY INVOKER` | 未觸發（僅限 `CREATE EXTENSION`） |
| `issue_pg_graphql_access` | `ddl_command_end` | `O`（啟用） | `CREATE EXTENSION` | `extensions.grant_pg_graphql_access` | `postgres` / `SECURITY INVOKER` | 未觸發（僅限 `CREATE EXTENSION`） |
| `issue_pg_net_access` | `ddl_command_end` | `O`（啟用） | `CREATE EXTENSION` | `extensions.grant_pg_net_access` | `postgres` / `SECURITY INVOKER` | 未觸發（僅限 `CREATE EXTENSION`） |
| **`pgrst_ddl_watch`** | `ddl_command_end` | `O`（啟用） | `NULL`（全 DDL） | `extensions.pgrst_ddl_watch` | `postgres` / **`SECURITY INVOKER`** | **正常觸發並無錯完成**（`CREATE TABLE` 與 `ALTER TABLE` 皆未報錯） |
| **`pgrst_drop_watch`** | `sql_drop` | `O`（啟用） | `NULL`（全 Drop） | `extensions.pgrst_drop_watch` | `postgres` / **`SECURITY INVOKER`** | **正常觸發並無錯完成**（`DROP TABLE` 未報錯） |

- **Section 七第 6、8 項結論**：
  - Runtime（`c2k_test_app_runtime`）執行 DDL 先於權限檢查被拒絕（`42501`），不會進入 Event Trigger 執行階段。
  - `ensure_rls` 自動為 `c2k_mig_ddl_probe` 開啟了 `ENABLE ROW LEVEL SECURITY`（0 Policy）。在本次實測下 `c2k_test_app_runtime` 因具備 **`BYPASSRLS`** 與 `DEFAULT PRIVILEGES`，仍可正常對新表執行 `INSERT`/`SELECT`（寫入 `id=1`、讀回 `1` 筆，並同時受 `DROP TABLE` 與 `setval` `42501` 拒絕保護）；**若未來改用 `NOBYPASSRLS`（方案 A）而 Migration 未同步建立 Policy，`ensure_rls` 就會立刻對新表形成預設拒絕（阻斷應用讀寫）**。

---

## 12. Extensions Schema 權限影響

Phase 3-C-16A 曾擔憂 `--no-acl` 還原使 `extensions` Schema `nspacl` 為 `NULL`，恐導致 `SECURITY INVOKER` 函式（如 `pgrst_ddl_watch`）在非 Superuser 執行 `CREATE/ALTER/DROP TABLE` 時噴出 `permission denied for schema extensions`。

**本次實機驗證結果已釐清原因**：
1. PostgreSQL 核心在觸發 Event Trigger 時是直接透過目錄 **OID** 呼叫觸發函式，不經過 Caller 的 `search_path` / Schema `USAGE` 解析，且 `fn_acl` 為預設允許。
2. `pgrst_ddl_watch` 與 `pgrst_drop_watch` 內部僅讀取 `pg_catalog` 的事件函式並發出 `NOTIFY pgrst`，未存取 `extensions` Schema 下受限資料表；而另外 4 個會執行授權 DDL 的 `extensions.*` 觸發器僅綁定在 `CREATE/DROP EXTENSION` Tag 上，不會被一般業務表 Migration 觸發。
3. 本次同時於實作 DDL 迴圈時額外發現一項重要技術細節：在轉移 `public` Schema 內使用者自訂 Type Owner 時，查詢條件**不可只寫 `typtype IN ('e', 'c')`**，因為 PostgreSQL 會為每張表產生 `typtype = 'c'` 的複合列型別（本次即曾遇 `"AIChatSession" is a table's row type` 拒絕錯誤）；正確篩選條件必須加上 **`typrelid = 0`**（`t.typtype = 'e' OR (t.typtype = 'c' AND t.typrelid = 0)`），未來編寫正式移轉/回滾腳本模板時須強制採用。

---

## 13. 清理結果（Section 八）

1. **測試庫內受控角色回滾驗證（無 `DROP OWNED BY`）**：
   - 先檢查 `pg_stat_activity` 確認無未完成交易與殘留連線（`0` 筆）。
   - 依 Phase 3-C-15 7 階段反向撤銷 Default Privileges、撤銷物件與資料庫 GRANT、顯式迴圈將 37 表 / `AnnouncementStatus` / `public` Schema Owner 歸還 `postgres`，驗證 `pg_shdepend` 依賴數 = **`0`** 後執行 `DROP ROLE c2k_test_app_runtime; DROP ROLE c2k_test_migration_admin;`。回滾後原 37 張表完整存在、測試角色數為 **`0`**。
2. **暫時基礎設施與暫存檔清除**：
   - 已移除暫時容器 `code_to_know_pg17_login_test`（`docker rm -f`）。
   - 已移除暫時資料卷 `code_to_know_pg17_login_test_data`（`docker volume rm`）。
   - 已移除暫存腳本、暫存 `.dump`、暫存結果檔與初始化密碼暫存目錄（本機 `5434` 埠無 `Listen` 程序）。

---

## 14. 原有 PG17 / PG16 保護確認

清理完成後實測複檢確認完全未受影響：

- **`code_to_know_pg17_restore_sandbox`**（`127.0.0.1:5433` `Listen`）：
  - 容器運作正常，Volume 維持 `code_to_know_pg17_restore_sandbox_data`。
  - 角色清單僅為 `codetoknow_restore` 與 `postgres`（**無**任何 `c2k_test_*`、`migration_admin` 或 `app_runtime`）。
  - 資料庫清單 6 庫完整保留：`code_to_know_c2kb_prod_restore_clean_v2`（`12 MB`, `37` 表）、`code_to_know_c2kb_prod_restore_test`（`12 MB`）、`code_to_know_cloud_restore_test`（`12 MB`）皆完好未動。
- **`code_to_know_postgres`**（PG16 `16.15`，`127.0.0.1:5432` `Listen`）：狀態 `healthy`，Volume 維持 `code-to-know_postgres_data`，`pg_isready` 回應 `accepting connections`。
- 原始 `.dump`、`.c2kb`、KeePassXC 與雲端正式環境均未讀取或異動。

---

## 15. Git 狀態確認

- Branch：`main`
- HEAD：`86a0f1116693bcce476b8747a446900d54b29a4a`
- `git status --short`：僅確認新增本階段報告 [`docs/DATABASE_PHASE3C16B_PG17_LOGIN_ROLE_TEST_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C16B_PG17_LOGIN_ROLE_TEST_REPORT.md)，未修改任何現有程式碼、SQL、Prisma、PowerShell、Docker 或環境設定檔，無任何暫存檔或密碼外流進專案目錄。

---

## 16. 未解決問題

1. **Supavisor Pooler 雲端相容性尚未驗證**：本機 Docker 直連通過 SCRAM-SHA-256，但尚未證明 Supabase AWS Sydney Pooler（`aws-0-ap-southeast-2.pooler.supabase.com:5432/6543`）允許 `app_runtime.<project_ref>` / `migration_admin.<project_ref>` 自訂 PG 角色登入，亦未實測雲端 `postgres` 對 `ALTER SCHEMA public OWNER TO migration_admin` 之實際權限。
2. **TLS `verify-full` 實機驗證待補**：本次為本機 Loopback TCP 測試，尚未以 [`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts) 搭配 `prod-supabase-ca.crt` 實測遠端 TLS 握手與 Prepared Statements 行為。
3. **應用程式 7 項授權與安全缺口尚未修補**：Phase 3-C-15 第 7 節列管之 P0/P1 缺口（`admin.routes.ts` UUID 參數驗證、`audit-logs` 分頁上限、`verifyEmail`/`resetPassword` 帳號狀態檢查、`App.tsx` `#sources` 路由守衛、通用所有權 Helper、`app_runtime` HTTP 負向 IDOR 測試等）與 27/36 未實作模型仍維持原狀。
4. **表擁有權轉移腳本細節校正**：未來撰寫正式轉移腳本時，自訂型別篩選必須強制加上 `typrelid = 0`（已於第 12 節記明）。

---

## 17. 最終判定（Section 九 & 十）

- **Phase 3-C-16B 本機獨立 `LOGIN` 實測驗收**：**`PASS`**（獨立容器與 Volume 隔離、SCRAM-SHA-256 強制生效、正/錯誤與空白密碼與不存在角色皆精確通過、Runtime 正向與全部 16 項負向邊界拒絕 `42501` 通過、Migration Admin 權限與 `DEFAULT PRIVILEGES` 通過、7 個 Event Triggers 與 `extensions` Schema 影響釐清、原有 PG17/PG16 完整無損、暫時資源 100% 清理完畢）。
- **整體推進判定**：**`CONDITIONAL GO`（僅限授權進入下一階段「本機應用程式 P0/P1 安全缺口修補與 `app_runtime` HTTP/DB 整合測試」，或未來單獨授權一項最小化 Supabase 唯讀相容性檢查）；對正式 Supabase 角色切換與 Render 上線則仍維持嚴格 `NO-GO`**。

---

*本階段已完成獨立 PG17.11 LOGIN 認證與角色權限實測及全部暫時資源清理並立即停止；未連線或變更任何正式 Supabase／Render 環境，等待使用者審閱本報告。*
