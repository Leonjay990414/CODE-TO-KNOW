# CODE TO KNOW｜Phase 3-C-33：正式資料庫角色切換 SQL 修正版草案

- **文件階段**：Phase 3-C-33（設計修正版；**純文件草案，未執行任何 SQL，未連線 Supabase / PG16 / PG17**）
- **建立日期**：2026-11-12
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **修正依據**：針對 [`DATABASE_PHASE3C32_SQL_SECURITY_INDEPENDENT_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C32_SQL_SECURITY_INDEPENDENT_AUDIT.md) 與 [`DATABASE_PHASE3C32_FINAL_GO_NO_GO_MATRIX.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C32_FINAL_GO_NO_GO_MATRIX.md) 識別之 `F32-02`、`F32-07` 進行順序重排與執行角色分離。

> **核心修正原則**：
> 1. **承認 Supabase `postgres` 非完整 `SUPERUSER`**：不得假設 `postgres` 在將物件 Owner 轉交給 `migration_admin` 之後，仍能替 `migration_admin` 執行 `GRANT`/`REVOKE` 或 `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin`（極可能觸發 `42501`）。
> 2. **執行角色與順序重排**：
>    - **先授權、再轉 Owner**：在 `postgres` 仍擁有全部物件時，先於同一原子交易內完成 `app_runtime` 的 Table / Sequence / Type 授權與 `AuditLog` / `_prisma_migrations` 收斂（或由取得 Owner 後之 `migration_admin` 執行）；本修正版採「`postgres` 同交易先授權收斂 → 再轉移 Owner 給 `migration_admin` → 再由 `migration_admin` 親自連線設定 Default Privileges」。
>    - **明確區分執行身分**：每段 SQL 均標註 `postgres`、`migration_admin` 或 `app_runtime`。
>    - **未經實機證實之託管行為**：凡涉及 Supabase 平台限制（如 `ALTER SCHEMA public OWNER`、`NOREPLICATION`、Supavisor 自建角色登入），均明確標記 **`待實機驗證`**。

---

## 一、11 段正式切換 SQL 修正版草案

### 段落 1：切換前唯讀檢查

- **執行角色**：`postgres`
- **必要權限**：系統目錄讀取權（Supabase 預設具備）
- **前置條件**：已完成切換前最新正式加密備份並通過 PG17 Sandbox 還原驗證。
- **成功驗證**：確認目標兩角色尚未存在、`public` Schema 與 37 張表目前由 `postgres` 擁有。
- **失敗處理**：若查詢異常或角色已殘留存在，立即中止並盤點殘留狀態。
- **回復方式**：無需回復（100% 唯讀）。

```sql
-- [REVISED Step 1 | Role: postgres] 切換前唯讀檢查
SELECT current_database(), current_user, version();

SELECT rolname, rolsuper, rolcanlogin, rolcreatedb, rolcreaterole, rolbypassrls, rolinherit
FROM pg_roles
WHERE rolname IN ('postgres', 'migration_admin', 'app_runtime');

SELECT nspname, pg_get_userbyid(nspowner) AS schema_owner
FROM pg_namespace
WHERE nspname = 'public';

SELECT COUNT(*) AS public_table_count, pg_get_userbyid(relowner) AS owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
GROUP BY pg_get_userbyid(relowner);
```

---

### 段落 2：建立正式角色（`migration_admin` 與 `app_runtime`）

- **執行角色**：`postgres`
- **必要權限**：`CREATEROLE`（Supabase `postgres` 預設具備；`NOREPLICATION` 屬性**`待實機驗證`**）
- **前置條件**：段落 1 確認兩角色不存在；強密碼已安全保存於 KeePassXC（嚴禁進版控或 Shell 歷史）。
- **成功驗證**：`pg_roles` 出現兩角色且屬性完全吻合矩陣、`pg_auth_members` 無多餘繼承。
- **失敗處理**：若 Supabase 拒絕 `NOREPLICATION` 或語法報錯，**立即中止**，不可自行放寬為 `SUPERUSER`/`CREATEROLE`/`INHERIT`。
- **回復方式**：`REVOKE CONNECT ON DATABASE postgres FROM app_runtime, migration_admin; DROP ROLE IF EXISTS app_runtime, migration_admin;`。

```sql
-- [REVISED Step 2 | Role: postgres] 建立最小權限登入角色（單一交易）
BEGIN;

CREATE ROLE migration_admin WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOBYPASSRLS
  NOINHERIT
  NOREPLICATION
  PASSWORD '<STRONG_PASSWORD_FOR_MIGRATION_ADMIN>';

CREATE ROLE app_runtime WITH
  LOGIN
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  BYPASSRLS
  NOINHERIT
  NOREPLICATION
  PASSWORD '<STRONG_PASSWORD_FOR_APP_RUNTIME>';

GRANT CONNECT ON DATABASE postgres TO migration_admin;
GRANT CONNECT ON DATABASE postgres TO app_runtime;

COMMIT;
```

---

### 段落 3：Schema 與 TABLE 基礎權限（於 `postgres` 仍為 Owner 時執行）

- **執行角色**：`postgres`
- **必要權限**：`public` Schema 與全數 37 張表之現任 Owner
- **前置條件**：段落 2 成功；與段落 4、5、6、7、8 合併於**同一原子交易**執行，避免出現先轉 Owner 後 `postgres` 喪失授權權限，或 `AuditLog` 權限暫時過寬的空窗。
- **成功驗證**：提交後 `has_table_privilege('app_runtime', ...)` 精確符合 35 表 DML、`AuditLog` 唯增、`_prisma_migrations` 全無。
- **失敗處理**：交易自動 `ROLLBACK`，不留下半套授權。
- **回復方式**：`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_runtime; REVOKE USAGE ON SCHEMA public FROM app_runtime;`。

```sql
-- [REVISED Step 3-8 Atomic Block | Role: postgres]
-- 在 postgres 仍為物件 Owner 時完成授權與收斂，避免轉 Owner 後發生 42501
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- [段落 3] Schema 與 TABLE 基礎授權
GRANT USAGE, CREATE ON SCHEMA public TO migration_admin;
REVOKE CREATE ON SCHEMA public FROM app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO app_runtime;
```

---

### 段落 4：SEQUENCE 權限（嚴格排除 `UPDATE`）

- **執行角色**：`postgres`（延續段落 3 同一交易）
- **必要權限**：`public` Sequences 現任 Owner（目前專案為 `0` 個，保留前瞻相容）
- **前置條件**：位於段落 3 交易內。
- **成功驗證**：`has_sequence_privilege('app_runtime', ..., 'UPDATE')` 為 `false`。
- **失敗處理**：整體交易 `ROLLBACK`。
- **回復方式**：`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;`。

```sql
-- [段落 4] SEQUENCE 最小權限（嚴禁 UPDATE）
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

---

### 段落 5：TYPE（Enum）權限

- **執行角色**：`postgres`（延續段落 3 同一交易）
- **必要權限**：`AnnouncementStatus` 等自訂型別現任 Owner
- **前置條件**：位於段落 3 交易內。
- **成功驗證**：`has_type_privilege('app_runtime', 'public."AnnouncementStatus"', 'USAGE')` 為 `true`。
- **失敗處理**：整體交易 `ROLLBACK`。
- **回復方式**：`REVOKE USAGE ON TYPE public."AnnouncementStatus" FROM app_runtime;`。

```sql
-- [段落 5] TYPE 權限（Enum USAGE）
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
    EXECUTE format('GRANT USAGE ON TYPE public.%I TO app_runtime;', r.typname);
  END LOOP;
END
$$;
```

---

### 段落 6：`AuditLog` Runtime Append-only 收斂

- **執行角色**：`postgres`（延續段落 3 同一交易）
- **必要權限**：`public."AuditLog"` 現任 Owner
- **前置條件**：緊接段落 3 同一交易內，無時間空窗。
- **成功驗證**：`app_runtime` 對 `AuditLog` 僅 `SELECT`/`INSERT` 為 `true`，`UPDATE`/`DELETE`/`TRUNCATE` 皆為 `false`。
- **失敗處理**：整體交易 `ROLLBACK`。
- **回復方式**：與段落 3 一併收回 `app_runtime` 表權限。

```sql
-- [段落 6] AuditLog Runtime Append-only 收斂
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public."AuditLog"
  FROM app_runtime;
REVOKE ALL ON TABLE public."AuditLog" FROM PUBLIC;
```

---

### 段落 7：`_prisma_migrations` 零權限保護

- **執行角色**：`postgres`（延續段落 3 同一交易）
- **必要權限**：`public."_prisma_migrations"` 現任 Owner
- **前置條件**：緊接段落 6 同一交易內。
- **成功驗證**：`has_table_privilege('app_runtime', 'public."_prisma_migrations"', 'SELECT')` 為 `false`。
- **失敗處理**：整體交易 `ROLLBACK`。
- **回復方式**：與段落 3 一併收回。

```sql
-- [段落 7] _prisma_migrations 零權限隔離
REVOKE ALL ON TABLE public."_prisma_migrations" FROM app_runtime;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM PUBLIC;

COMMIT;
```

---

### 段落 8：Schema 與物件所有權轉移至 `migration_admin`（**含 `VIEW`/`MATERIALIZED VIEW`，標記 `待實機驗證`**）

- **執行角色**：`postgres`
- **必要權限**：Supabase 託管下 `postgres` 對 `public` Schema 與其內業務物件之所有權移轉權（**`待實機驗證`**：非真 `SUPERUSER` 執行 `OWNER TO migration_admin` 是否需先驗證平台相容性）。
- **重要安全邊界**：**僅移轉業務表、Sequences、Views/MViews 與使用者自訂 Enum/Composite Types**；**絕不**移轉 `public` 內由 Supabase 管理之函式/觸發器（如 `rls_auto_enable`）。
- **前置條件**：段落 3～7 已 `COMMIT`；無長事務鎖表。
- **成功驗證**：`pg_tables`、`pg_sequences`、`pg_type`（`e`,`c`）與 `pg_namespace` (`public`) Owner 全數為 `migration_admin`。
- **失敗處理**：交易自動 `ROLLBACK`；若確認 Supabase 託管環境禁止非 `SUPERUSER` 執行 `ALTER SCHEMA public OWNER`，立即停止並執行回滾方案（不得強行放寬 `migration_admin` 權限）。
- **回復方式**：執行修正版回滾方案步驟 5，將 Owner 歸還 `postgres`。

```sql
-- [REVISED Step 8 | Role: postgres] 物件與 Schema 所有權轉移（待實機驗證）
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. 轉移資料表（含業務 36 表與 _prisma_migrations）
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO migration_admin;', r.tablename);
  END LOOP;

  -- 2. 轉移 Sequences
  FOR r IN
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO migration_admin;', r.sequencename);
  END LOOP;

  -- 3. 轉移 Views / Materialized Views（補齊 C32 F32-07 缺口）
  FOR r IN
    SELECT c.relname, c.relkind
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('v', 'm')
  LOOP
    IF r.relkind = 'v' THEN
      EXECUTE format('ALTER VIEW public.%I OWNER TO migration_admin;', r.relname);
    ELSE
      EXECUTE format('ALTER MATERIALIZED VIEW public.%I OWNER TO migration_admin;', r.relname);
    END IF;
  END LOOP;

  -- 4. 轉移自訂 Enum / Composite Types
  FOR r IN
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c')
      AND t.typname NOT LIKE '\_%' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO migration_admin;', r.typname);
  END LOOP;
END
$$;

-- 注意：此行於 Supabase 託管環境之相容性標記為 [待實機驗證]
ALTER SCHEMA public OWNER TO migration_admin;

COMMIT;
```

---

### 段落 9：Default Privileges（**改由 `migration_admin` 親自連線執行**）

- **執行角色**：**`migration_admin`**（透過 `migration_admin.ypibmyfxfhsyfdwxprpi` @ Pooler 5432 連線）
- **必要權限**：對自己未來新建物件設定 `ALTER DEFAULT PRIVILEGES IN SCHEMA public`（無須 `SUPERUSER`，也無須把 `migration_admin` 授予 `postgres`！）
- **前置條件**：段落 2～8 完成，且 `migration_admin` 已通過 Supavisor + TLS 連線驗證。
- **成功驗證**：查詢 `pg_default_acl` 確認 `defaclrole` 為 `migration_admin` 且無 `SEQUENCE UPDATE` 權限。
- **失敗處理**：整體交易 `ROLLBACK`；若 `migration_admin` 無法透過 Supavisor 登入，停止切換並啟動回滾。
- **回復方式**：以 `migration_admin` 執行 `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ... FROM app_runtime;`。

```sql
-- [REVISED Step 9 | Role: migration_admin] 由 migration_admin 親自設定 Default Privileges
BEGIN;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE ON TYPES TO app_runtime;

COMMIT;
```

---

### 段落 10：切換後唯讀驗證 SQL

- **執行角色**：`postgres`
- **必要權限**：唯讀系統目錄查詢
- **前置條件**：段落 1～9 全部完成。
- **成功驗證**：所有非預期計數皆為 `0`，`AuditLog` 與 `_prisma_migrations` 與 `SEQUENCE UPDATE` 權限旗標完全符合預期。
- **失敗處理**：禁止更新 Render 環境變數，立即依 7 步回滾方案回復。
- **回復方式**：無需回復（唯讀）。

```sql
-- [REVISED Step 10 | Role: postgres] 切換後完整唯讀斷言
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolinherit, rolreplication
FROM pg_roles
WHERE rolname IN ('migration_admin', 'app_runtime');

SELECT r.rolname AS role_name, m.rolname AS member_name
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname IN ('postgres', 'migration_admin', 'app_runtime')
   OR m.rolname IN ('migration_admin', 'app_runtime');

SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tableowner <> 'migration_admin';

SELECT
  has_table_privilege('app_runtime', 'public."AuditLog"', 'SELECT') AS audit_select,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'INSERT') AS audit_insert,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'UPDATE') AS audit_update,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'DELETE') AS audit_delete,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'TRUNCATE') AS audit_truncate,
  has_table_privilege('app_runtime', 'public."_prisma_migrations"', 'SELECT') AS mig_select,
  has_table_privilege('app_runtime', 'public."_prisma_migrations"', 'INSERT') AS mig_insert;

SELECT pg_get_userbyid(defaclrole) AS defacl_owner, defaclobjtype, defaclacl
FROM pg_default_acl
WHERE defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'migration_admin');
```

---

### 段落 11：切換後正負向實機行為驗收對照

- **執行角色**：`app_runtime`（負向與業務讀寫測試）＋ `migration_admin`（`prisma migrate status` 唯讀遷移狀態檢查）
- **預期成功**：`app_runtime` 可執行 `SELECT 1` 與業務表查詢；`migration_admin` 可正常執行 `prisma migrate status`。
- **預期失敗（安全阻斷）**：`app_runtime` 執行 `CREATE TABLE`、`SELECT * FROM public."_prisma_migrations"`、`UPDATE/DELETE/TRUNCATE public."AuditLog"`、`SET ROLE postgres` 或 `SET ROLE migration_admin` 皆必須以 **`42501`** 拒絕。
- **失敗處理**：任一負向測試未遭拒絕，立即啟動 7 步受控回滾。
