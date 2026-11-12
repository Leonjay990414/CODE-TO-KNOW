# CODE TO KNOW｜AUTH-01：本機 PG17 隔離 Sandbox 正式角色切換設計驗證報告

- **執行日期**：2026-11-12
- **授權編號**：`AUTH-01`（僅限本機 PG17 隔離測試容器；未接觸 PG16 `5432`、PG17 還原庫 `5433`、Supabase 或 Render）
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **既有正式備份 SHA-256（2026-11-10，完整未動）**：
  - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 1. 執行前環境基線與容器資訊

| 檢查項目 | 實測確認值 | 狀態 |
|---|---|---|
| **Docker 容器名稱** | `code_to_know_pg17_phase3c18_audit` | **PASS** |
| **Container ID** | `16bea6ce523cc37e5e1dc9ee05e7eb2981cce4d1c56b3a7f4d54bb908e2c7f66` (`16bea6ce523c`) | **PASS** |
| **Image / PostgreSQL 版本** | `postgres:17-alpine` / `PostgreSQL 17.11 on x86_64-pc-linux-musl` | **PASS** |
| **Port Mapping / Volume** | `127.0.0.1:5434->5432/tcp`｜Volume `code_to_know_pg17_phase3c18_audit_data` | **PASS** |
| **非授權環境隔離** | PG16（`b7ec11c47db4`, `5432`）與 PG17 還原庫（`08df84db262b`, `5433`）及 Supabase 零接觸；`code_to_know_test`（OID `16384`）原有 `27` 筆 `AuditLog` 測試前後皆為 `27` 筆 | **PASS** |

---

## 2. 測試資料庫名稱與 OID

- **建立前資料庫清單**：`1|template1`, `4|template0`, `5|postgres`, `16384|code_to_know_test`
- **新建專用隔離測試資料庫**：**`c2k_auth01_sandbox`（OID `24628`）**
- **清理後資料庫清單**：`1|template1`, `4|template0`, `5|postgres`, `16384|code_to_know_test`（已完整刪除 `c2k_auth01_sandbox`）

---

## 3. 測試角色屬性與密碼處理

密碼由 Node.js `crypto.randomBytes(24).toString('base64url')` 於記憶體產生並透過 `stdin` 傳遞，測畢即清除變數，未輸出或寫入任何檔案。

| 角色名稱 | `rolcanlogin` | `rolsuper` | `rolcreatedb` | `rolcreaterole` | `rolbypassrls` | `rolinherit` | `rolreplication` | `pg_auth_members` | 判定 |
|---|---|---|---|---|---|---|---|---|---|
| `c2k_auth01_migration_admin` | `t` | `f` | `f` | `f` | `f` | `f` | `f` | `0` | **PASS** |
| `c2k_auth01_app_runtime` | `t` | `f` | `f` | `f` | `t`（暫定設計驗證） | `f` | `f` | `0` | **PASS** |

---

## 4. 物件建立與 Owner 驗證結果（C33 切換順序）

依 [`DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md) 執行「先授權收斂 → 再轉 Owner → `migration_admin` 親自設 Default Privileges」：

- **Schemas (`public`, `c2k_auth01_schema`)**：Owner 全數為 `c2k_auth01_migration_admin`（**PASS**）
- **Tables (`c2k_auth01_items`, `c2k_auth01_audit_log`, `c2k_auth01_prisma_migrations`)**：Owner 全數為 `c2k_auth01_migration_admin`（**PASS**）
- **Views / Materialized Views (`c2k_auth01_items_view`, `c2k_auth01_items_mview`)**：Owner 全數為 `c2k_auth01_migration_admin`（**PASS**）
- **Sequence (`c2k_auth01_seq`)**：Owner 為 `c2k_auth01_migration_admin`（**PASS**）
- **Enum (`c2k_auth01_status`)**：Owner 為 `c2k_auth01_migration_admin`（**PASS**）
- **Function / Procedure (`c2k_auth01_fn`, `c2k_auth01_proc`)**：`pg_proc` 查詢結果 Owner 皆為 `c2k_auth01_migration_admin`（**PASS**）

---

## 5. 正向與負向 DML / ACL 測試結果

### 正向測試（TCP `127.0.0.1:5434` 以 `c2k_auth01_app_runtime` 登入）
- `c2k_auth01_items` `INSERT` / `SELECT` / `UPDATE` / `DELETE`（含 `c2k_auth01_seq` `nextval`）：**PASS**
- `c2k_auth01_audit_log` `INSERT` + `SELECT`（寫入 `1` 筆並讀回）：**PASS**

### 負向測試（全部預期拒絕並紀錄實際 `SQLSTATE`）

| 測試項目 | 實測 `SQLSTATE` | 判定 |
|---|---|---|
| `CREATE TABLE` / `ALTER TABLE` / `DROP TABLE` | `42501` | **PASS** |
| `ALTER TYPE ... ADD VALUE` / `ALTER FUNCTION ... RENAME` | `42501` | **PASS** |
| `c2k_auth01_prisma_migrations` `SELECT` / `INSERT` / `UPDATE` / `DELETE` / `TRUNCATE` | `42501`（5/5 全拒） | **PASS** |
| `c2k_auth01_audit_log` `UPDATE` / `DELETE` / `TRUNCATE` | `42501`（3/3 全拒） | **PASS** |
| `setval('c2k_auth01_seq', 999)`（Sequence `UPDATE`） | `42501` | **PASS** |
| `SET ROLE postgres` / `SET ROLE c2k_auth01_migration_admin` | `42501` | **PASS** |

*(註：`AuditLog` 本項實測僅代表 Runtime 角色級 ACL Append-only 權限驗證，並非跨高權限角色的 WORM 不可竄改儲存。)*

---

## 6. Default Privileges 測試結果

由 `c2k_auth01_migration_admin` 親自連線設定 Default Privileges 後，新建 `c2k_auth01_future_items` 與 `c2k_auth01_future_seq`：
- `c2k_auth01_app_runtime` 自動取得 `INSERT`/`SELECT`（寫入並讀回 `id=100, label='auto_priv_ok'`）：**PASS**
- `c2k_auth01_app_runtime` 嘗試 `setval('public.c2k_auth01_future_seq', 999)` 遭拒（`SQLSTATE 42501`），且 `has_sequence_privilege(..., 'UPDATE')` = `false`：**PASS**
- `PUBLIC` 對新表 `SELECT`/`INSERT` 與新 Sequence `USAGE` 皆為 `false`，既有其他角色 `c2k_test_app_runtime` 亦為 `false`：**PASS**

---

## 7. RLS 與 Event Trigger 邊界結果

- **`pg_event_trigger` 查詢結果**：`0` 筆（社群版 Docker PG17 容器不含 Supabase `ensure_rls` / `rls_auto_enable`，未自行模擬假 Trigger）。
  - **Supabase Event Trigger 相容性**：維持 **`NOT TESTED`**。
- **`BYPASSRLS` vs `NOBYPASSRLS` 實測差異**（在 `c2k_auth01_rls_tbl` 啟用 RLS 且 `0` 條 Policy）：
  - `BYPASSRLS`：`SELECT COUNT(*)` 回傳 **`1`**（可讀取）。
  - 暫時改為 `NOBYPASSRLS`：`SELECT COUNT(*)` 回傳 **`0`**（遭預設過濾），`INSERT` 遭 **`SQLSTATE 42501`** 拒絕。

---

## 8. 七步回滾與清理結果

依 [`DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md) 執行完整回滾：
- Runtime 與 `migration_admin` 連線依序結束／終止、Default Privileges 撤銷、全部 GRANT 收回、Table/View/MView/Sequence/Enum/`pg_proc`/Schema Owner 全數歸還 `postgres`（**未使用 `DROP OWNED BY`**）。
- **`pg_shdepend` 剩餘依賴**：`0` rows；**本庫各類剩餘物件統計**：`0|0|0|0|0|0`；測試表 `c2k_auth01_audit_log`（1 筆）與 `c2k_auth01_prisma_migrations`（1 筆）資料完整未損：**PASS**。
- **清理狀態**：通過全部清理前安全檢查後，僅刪除 `c2k_auth01_sandbox`、`c2k_auth01_app_runtime` 與 `c2k_auth01_migration_admin`；`code_to_know_test` 與 `c2k_test_app_runtime` 完整保留：**PASS**。

---

## 9. 未解決問題、與 Supabase 差異及下一階段建議

1. **與 Supabase 實際行為的關鍵差異（仍為 `NOT TESTED`）**：
   - 本機 PG17 Docker 中 `postgres` 為完整 `SUPERUSER`，而 **Supabase 託管環境 `postgres` 非完整 `SUPERUSER`**；因此 `ALTER SCHEMA public OWNER TO migration_admin` 與 `NOREPLICATION` 屬性在雲端是否受限仍待實測。
   - 本機無法驗證 **Supavisor Pooler**（`<role>.ypibmyfxfhsyfdwxprpi` @ Port `5432`）SCRAM 認證與遠端 TLS `verify-full` 握手。
   - 本機不含 Supabase **`ensure_rls` / `rls_auto_enable`** Event Trigger。
2. **下一階段建議（須另行授權）**：
   - 依授權邊界依序申請 **`AUTH-02`（取得最新正式加密備份）**、**`AUTH-03`（KeePassXC 解密與 PG17 還原驗收）** 及 **`AUTH-04`（Supabase 唯讀檢查與官方 CA 指紋比對）**。
   - 本階段已停止於 **AUTH-01**，未進入 AUTH-02 或任何正式環境操作。
