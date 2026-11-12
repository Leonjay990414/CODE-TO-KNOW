# CODE TO KNOW｜Phase 3-C-31：Supabase 正式角色 7 步受控回滾方案草案

- **文件階段**：Phase 3-C-31（純設計與 SQL 草案；**未執行任何 SQL，未連線 Supabase / PG16 / PG17**）
- **建立日期**：2026-11-12
- **前置依據**：[`DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md)、[`DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md)

---

## 一、回滾強制禁止事項（安全鐵律）

1. **禁止未檢查物件所有權與 `pg_shdepend` 就執行 `DROP ROLE`**：必須先確認目標角色在全叢集跨庫依賴為 `0`。
2. **嚴禁將 `DROP OWNED BY` 當成一般回滾指令**：PG17 沙盒已實證，若漏轉任一張資料表 Owner，`DROP OWNED BY` 將直接對該表執行永久 `DROP TABLE` 造成不可逆資料毀滅。
3. **禁止因回滾而刪除任何正式資料表或業務資料**：回滾目標僅為「將物件 Owner 歸還 `postgres` 並安全移除自建角色」。
4. **禁止在交易或執行順序不明時執行不可逆操作**。

---

## 二、7 步受控回滾方案總覽與原子性標示

> **原子性聲明（重要）**：PostgreSQL 不允許在單一交易內將「應用層 Render 環境變數切回」、「跨後端進程 `pg_terminate_backend()` 中斷連線」與所有權/角色清理完全綁為單一原子單元。下表明確標示各步驟之**原子性與不可逆邊界**：

| 步驟 | 步驟名稱 | 是否可於單一 SQL 交易保證原子 | 風險與回復特性 |
|---|---|---|---|
| **步驟 1** | 應用層先行降載／切回 | **否（外部基礎設施操作）** | 屬 Render / CI 設定變更，無法與 SQL 同一交易回滾 |
| **步驟 2** | 終止殘留會話（`pg_terminate_backend`） | **否（即時強制斷線，不可逆）** | 會立即中斷進行中的查詢與未提交交易（自動 ROLLBACK） |
| **步驟 3** | 收回 Default Privileges | **是（可納入 SQL 交易）** | 可重覆冪等執行 |
| **步驟 4** | 收回既有物件與資料庫層級 GRANT | **是（可納入 SQL 交易）** | 可重覆冪等執行 |
| **步驟 5** | 所有權安全反向歸還至 `postgres` | **是（可納入 SQL 交易）** | 僅修改中繼資料 Owner，不刪任何資料 |
| **步驟 6** | 角色刪除前跨庫與物件依賴檢查 | **唯讀斷言（無寫入）** | 非 `0` 則中止，保護不誤刪 |
| **步驟 7** | 安全刪除角色（`DROP ROLE`） | **是（依賴為 0 方可成功）** | 刪除後角色 OID 消失（密碼失效），需重新 `CREATE ROLE` 方可重建 |

---

## 三、逐項回滾步驟與 SQL 草案

### 步驟 1：應用層先行降載／切回（非 SQL，無法保證與 SQL 原子）

- **執行前條件**：確認需執行回滾，且 Render / CI 仍保有切換前核准之連線設定（若尚未切換 Render，此步為確認零流量使用 `app_runtime`）。
- **操作內容**：將 Render Web Service 與 CI/CD 切回切換前核准連線設定（或暫時進入維護模式），停止對 `app_runtime` 與 `migration_admin` 發起新連線。
- **若跳過此步之風險**：應用程式持續重連，導致步驟 2 終止連線後仍不斷產生新連線鎖住物件。

---

### 步驟 2：終止殘留會話（**無法保證原子性，即時強制斷線**）

- **執行前條件**：以 `postgres` 身分連線；步驟 1 已停止新流量進入。
- **角色依賴**：清除所有持有 `app_runtime` 或 `migration_admin` 身份之活躍後端連線，釋放 Table/Metadata Lock。
- **注意事項**：必須排除 `pid <> pg_backend_pid()`，避免誤斷自身維運連線。

```sql
-- [DRAFT Rollback Step 2] 檢視並終止殘留連線（排除自身連線）
SELECT pid, usename, application_name, state, query_start
FROM pg_stat_activity
WHERE usename IN ('app_runtime', 'migration_admin')
  AND pid <> pg_backend_pid();

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE usename IN ('app_runtime', 'migration_admin')
  AND pid <> pg_backend_pid();
```

---

### 步驟 3：收回 Default Privileges（可於交易內執行）

- **執行前條件**：步驟 2 已無殘留活躍連線。
- **Default Privileges 回復**：撤銷 `FOR ROLE migration_admin IN SCHEMA public` 授予 `app_runtime` 的全部預設權限，避免 `pg_default_acl` 殘留依賴阻擋後續 `DROP ROLE`。

```sql
-- [DRAFT Rollback Step 3] 收回 Default Privileges
BEGIN;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  REVOKE ALL ON TABLES FROM app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  REVOKE ALL ON TYPES FROM app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM app_runtime;

COMMIT;
```

---

### 步驟 4：收回既有物件與資料庫層級 GRANT（可於交易內執行）

- **執行前條件**：步驟 3 完成。
- **GRANT / REVOKE 回復**：依序收回 `app_runtime` 與 `migration_admin` 在 `public` Schema 內所有 Tables、Sequences、Types、Functions、Schema 及 `postgres` 資料庫上的所有授權。

```sql
-- [DRAFT Rollback Step 4] 收回所有物件與資料庫授權
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

---

### 步驟 5：所有權安全反向歸還（Ownership Reversion Loop，可於交易內執行）

- **執行前條件**：步驟 4 完成；嚴格限定 `schemaname = 'public'`。
- **物件所有權處理**：透過動態檢索，將目前由 `migration_admin` 或 `app_runtime` 擁有的 Tables、Sequences、Views、自訂 Types（含 Enum）與 `public` Schema 本體之 Owner 逐一改回 `postgres`（**絕不使用 `DROP OWNED BY`**）。

```sql
-- [DRAFT Rollback Step 5] 安全歸還 public 物件所有權至 postgres
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. 資料表
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tableowner IN ('migration_admin', 'app_runtime')
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres;', r.tablename);
  END LOOP;

  -- 2. Sequences
  FOR r IN
    SELECT sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
      AND sequenceowner IN ('migration_admin', 'app_runtime')
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO postgres;', r.sequencename);
  END LOOP;

  -- 3. Views / Materialized Views（防呆覆蓋）
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

  -- 4. 自訂 Types（含 Enum）
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

---

### 步驟 6：角色刪除前的依賴檢查（強制閘門，非 `0` 立即中止）

- **執行前條件**：步驟 1～5 完成。
- **依賴檢查標準**：以下所有查詢結果皆必須精確為 **`0`**。若任一項大於 `0`，代表仍有遺漏物件或跨庫依賴，**禁止執行步驟 7**，應依 `classid::regclass` 與 `objid` 逐一釐清並手動歸還後重測。

```sql
-- [DRAFT Rollback Step 6] 角色刪除前雙重依賴斷言（全部必須為 0）
-- 1. 跨庫全域依賴表 pg_shdepend（預期 0 rows）
SELECT r.rolname, d.dbid, d.classid::regclass AS obj_class, d.objid, d.deptype
FROM pg_shdepend d
JOIN pg_roles r ON r.oid = d.refobjid
WHERE r.rolname IN ('app_runtime', 'migration_admin');

-- 2. 本庫物件殘留統計（預期全部為 0）
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tableowner IN ('app_runtime', 'migration_admin')) AS remaining_tables,
  (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner IN ('app_runtime', 'migration_admin')) AS remaining_sequences,
  (SELECT COUNT(*) FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND pg_get_userbyid(t.typowner) IN ('app_runtime', 'migration_admin')) AS remaining_types,
  (SELECT COUNT(*) FROM pg_namespace WHERE nspname = 'public' AND pg_get_userbyid(nspowner) IN ('app_runtime', 'migration_admin')) AS remaining_schemas,
  (SELECT COUNT(*) FROM pg_default_acl WHERE defaclrole IN (SELECT oid FROM pg_roles WHERE rolname IN ('app_runtime', 'migration_admin'))) AS remaining_default_acls;
```

---

### 步驟 7：安全刪除角色與回滾後資料完整性驗證

- **執行前條件**：步驟 6 所有依賴計數皆嚴格等於 `0`。
- **失敗安全特性**：刻意依賴 PostgreSQL 原生 `DROP ROLE`（不帶任何強制刪除指令）；若仍有未知依賴，引擎將主動報錯拒絕刪除，確保資料 100% 安全。
- **回滾後資料完整性驗證**：確認兩角色已消失、`public` 資料表總數維持 `37`（含 `_prisma_migrations`）、核心業務表與 `AuditLog` 紀錄數完整未損。

```sql
-- [DRAFT Rollback Step 7] 安全刪除角色與完整性驗證
DROP ROLE IF EXISTS app_runtime;
DROP ROLE IF EXISTS migration_admin;

-- 驗證兩角色已移除（預期 0 rows）
SELECT rolname FROM pg_roles WHERE rolname IN ('app_runtime', 'migration_admin');

-- 驗證資料表與關鍵資料完整性（預期 public_table_count = 37，AuditLog 與 User 筆數與切換前一致）
SELECT COUNT(*) AS public_table_count
FROM pg_tables
WHERE schemaname = 'public';

SELECT
  (SELECT COUNT(*) FROM public."User") AS user_count,
  (SELECT COUNT(*) FROM public."TeacherApplication") AS teacher_app_count,
  (SELECT COUNT(*) FROM public."AuditLog") AS audit_log_count,
  (SELECT COUNT(*) FROM public."_prisma_migrations") AS migration_count;
```
