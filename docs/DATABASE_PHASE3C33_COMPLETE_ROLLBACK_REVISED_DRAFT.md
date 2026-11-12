# CODE TO KNOW｜Phase 3-C-33：完整七步受控回滾方案修正版

- **文件階段**：Phase 3-C-33（回滾方案修正版；**純文件草案，未執行任何 SQL**）
- **建立日期**：2026-11-12
- **修正依據**：針對 [`DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md) 與 [`DATABASE_PHASE3C32_ROLLBACK_SAFETY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C32_ROLLBACK_SAFETY_REVIEW.md) 識別之 **`pg_proc`（Function / Procedure）Owner 歸還缺口** 與 Default Privileges 執行身分進行補強。

> **嚴格禁止事項**：
> - **絕對禁止將 `DROP OWNED BY` 當成一般回滾方式**（會永久刪除未移轉 Owner 之資料表與業務資料）。
> - **絕對禁止未通過 `pg_shdepend` 零依賴檢查即執行 `DROP ROLE`**。

---

## 一、七步受控回滾原子性與使用者影響標示

| 步驟 | 操作項目 | 執行身分 | 是否可單一交易原子回滾 | 對正常使用者的影響 |
|---|---|---|---|---|
| **步驟 1** | 應用層切流／停用新連線 | Render / CI | **否（外部基礎設施操作）** | 若 Render 已切換至 `app_runtime`，切回舊連線或維護頁期間會有短暫重啟視窗 |
| **步驟 2** | 終止殘留會話（`pg_terminate_backend`） | `postgres` | **否（即時強制斷線，不可逆）** | 進行中的 `app_runtime` 請求會立即斷線並自動回滾未提交交易，使用者端可能短暫看到 `503` |
| **步驟 3** | 撤銷 Default Privileges | `migration_admin`（或具權限之 `postgres`） | **是** | 無（僅影響未來新建物件規則） |
| **步驟 4** | 收回既有物件與資料庫 GRANT（含 `AuditLog` 與 `_prisma_migrations` 權限清理回復） | `migration_admin` / `postgres` | **是** | 執行時確保無步驟 1 流量依賴 `app_runtime` |
| **步驟 5** | 全物件所有權歸還 `postgres`（**補齊 Table、Sequence、View/MView、Type/Enum、`pg_proc` Function/Procedure、Schema**） | `postgres` / `migration_admin` | **是** | 無（僅改中繼資料 Owner，**0 資料遺失風險**） |
| **步驟 6** | `pg_shdepend` 與本庫全物件零依賴斷言檢查 | `postgres` | **唯讀檢查** | 無 |
| **步驟 7** | 安全 `DROP ROLE` 與回滾後完整性驗證 | `postgres` | **是（依賴為 0 方可成功）** | 無 |

---

## 二、修正版七步回滾 SQL 草案

### 步驟 1：應用層先行切流／降載（非 SQL）
- 將 Render Web Service 與 CI/CD 切回切換前核准狀態，確保不再使用 `app_runtime` 或 `migration_admin` 發起新連線。

### 步驟 2：舊連線處理（**非原子，會中斷進行中請求**）
```sql
-- [REVISED Rollback Step 2 | Role: postgres] 檢視並終止殘留連線
SELECT pid, usename, application_name, state
FROM pg_stat_activity
WHERE usename IN ('app_runtime', 'migration_admin')
  AND pid <> pg_backend_pid();

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename IN ('app_runtime', 'migration_admin')
  AND pid <> pg_backend_pid();
```

### 步驟 3：Default Privileges 撤銷與恢復
- **執行身分說明**：因修正版切換草案由 `migration_admin` 設定 Default Privileges，回滾時應先以 `migration_admin`（在步驟 2 前或暫留單一管理連線）執行撤銷，或於確認 `postgres` 具授權時執行：
```sql
-- [REVISED Rollback Step 3 | Role: migration_admin] 撤銷 Default Privileges
BEGIN;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TYPES FROM app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM app_runtime;

COMMIT;
```

### 步驟 4：收回既有物件與資料庫 GRANT（含 `AuditLog` 與 `_prisma_migrations` 權限歸位）
- 收回 `app_runtime` 與 `migration_admin` 在 `public` 下全部資料表（含 `AuditLog` 與 `_prisma_migrations`）、Sequences、Functions、Types、Schema 與資料庫層級授權，恢復為切換前僅 `postgres` 掌控之狀態（註：`PUBLIC` 維持最小安全，不重新開放給 `PUBLIC`）。
```sql
-- [REVISED Rollback Step 4 | Role: migration_admin / postgres] 收回所有物件與資料庫授權
BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_runtime, migration_admin;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_runtime, migration_admin;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM app_runtime, migration_admin;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c')
      AND t.typname NOT LIKE '\_%' ESCAPE '\'
  LOOP
    EXECUTE format('REVOKE ALL ON TYPE public.%I FROM app_runtime, migration_admin;', r.typname);
  END LOOP;
END
$$;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM app_runtime, migration_admin;
REVOKE ALL PRIVILEGES ON DATABASE postgres FROM app_runtime, migration_admin;

COMMIT;
```

### 步驟 5：全物件所有權安全歸還至 `postgres`（**補齊 `pg_proc` 迴圈**）
```sql
-- [REVISED Rollback Step 5 | Role: postgres / migration_admin]
-- 嚴格限定 schemaname = 'public'，只歸還 Owner 為 migration_admin 或 app_runtime 之物件
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. 資料表（含 AuditLog 與 _prisma_migrations）
  FOR r IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tableowner IN ('migration_admin', 'app_runtime')
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres;', r.tablename);
  END LOOP;

  -- 2. Sequences
  FOR r IN
    SELECT sequencename FROM pg_sequences
    WHERE schemaname = 'public' AND sequenceowner IN ('migration_admin', 'app_runtime')
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO postgres;', r.sequencename);
  END LOOP;

  -- 3. Views / Materialized Views
  FOR r IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('v', 'm')
      AND pg_get_userbyid(c.relowner) IN ('migration_admin', 'app_runtime')
  LOOP
    IF r.relkind = 'v' THEN
      EXECUTE format('ALTER VIEW public.%I OWNER TO postgres;', r.relname);
    ELSE
      EXECUTE format('ALTER MATERIALIZED VIEW public.%I OWNER TO postgres;', r.relname);
    END IF;
  END LOOP;

  -- 4. Functions / Procedures（補齊 C32 審查發現之 pg_proc 缺口）
  FOR r IN
    SELECT p.proname, p.prokind, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND pg_get_userbyid(p.proowner) IN ('migration_admin', 'app_runtime')
  LOOP
    IF r.prokind = 'p' THEN
      EXECUTE format('ALTER PROCEDURE public.%I(%s) OWNER TO postgres;', r.proname, r.args);
    ELSE
      EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO postgres;', r.proname, r.args);
    END IF;
  END LOOP;

  -- 5. 自訂 Types（含 Enum）
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c')
      AND t.typname NOT LIKE '\_%' ESCAPE '\'
      AND pg_get_userbyid(t.typowner) IN ('migration_admin', 'app_runtime')
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO postgres;', r.typname);
  END LOOP;
END
$$;

ALTER SCHEMA public OWNER TO postgres;

COMMIT;
```

### 步驟 6：`DROP ROLE` 前置依賴檢查（`pg_shdepend` + 全物件計數必須為 `0`）
```sql
-- [REVISED Rollback Step 6 | Role: postgres] 依賴檢查（必須全部為 0）
SELECT r.rolname, d.dbid, d.classid::regclass AS obj_class, d.objid, d.deptype
FROM pg_shdepend d
JOIN pg_roles r ON r.oid = d.refobjid
WHERE r.rolname IN ('app_runtime', 'migration_admin');

SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tableowner IN ('app_runtime', 'migration_admin')) AS remaining_tables,
  (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner IN ('app_runtime', 'migration_admin')) AS remaining_sequences,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND pg_get_userbyid(p.proowner) IN ('app_runtime', 'migration_admin')) AS remaining_procs,
  (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND pg_get_userbyid(t.typowner) IN ('app_runtime', 'migration_admin')) AS remaining_types,
  (SELECT COUNT(*) FROM pg_namespace WHERE nspname = 'public' AND pg_get_userbyid(nspowner) IN ('app_runtime', 'migration_admin')) AS remaining_schemas,
  (SELECT COUNT(*) FROM pg_default_acl WHERE defaclrole IN (SELECT oid FROM pg_roles WHERE rolname IN ('app_runtime', 'migration_admin'))) AS remaining_default_acls;
```

### 步驟 7：安全 `DROP ROLE` 與回滾後完整性驗證
```sql
-- [REVISED Rollback Step 7 | Role: postgres] 確認步驟 6 全為 0 後執行
DROP ROLE IF EXISTS app_runtime;
DROP ROLE IF EXISTS migration_admin;

SELECT rolname FROM pg_roles WHERE rolname IN ('app_runtime', 'migration_admin');
SELECT COUNT(*) AS public_table_count FROM pg_tables WHERE schemaname = 'public';
SELECT
  (SELECT COUNT(*) FROM public."User") AS user_count,
  (SELECT COUNT(*) FROM public."TeacherApplication") AS teacher_app_count,
  (SELECT COUNT(*) FROM public."AuditLog") AS audit_log_count,
  (SELECT COUNT(*) FROM public."_prisma_migrations") AS migration_count;
```
