# CODE TO KNOW｜Phase 3-C-31：Supabase 正式角色切換 SQL 草案與一致性設計

- **文件階段**：Phase 3-C-31（純設計與 SQL 草案整合；**未執行任何 SQL，未連線 Supabase / PG16 / PG17**）
- **建立日期**：2026-11-12
- **適用目標**：Supabase Production（Project Ref: `ypibmyfxfhsyfdwxprpi`，Pooler Host: `aws-0-ap-southeast-2.pooler.supabase.com`，Database: `postgres`）
- **前置依據**：[`DATABASE_PHASE3C14_ROLE_RLS_REALTIME_FINAL_DESIGN_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C14_ROLE_RLS_REALTIME_FINAL_DESIGN_AUDIT.md)、[`DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C15_ROLE_CUTOVER_ROLLBACK_DESIGN_REVIEW.md)、[`DATABASE_PHASE3C30_INDEPENDENT_SECURITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C30_INDEPENDENT_SECURITY_AUDIT.md)

> **重要聲明**：本文件內所有 SQL 均為**待審查草案（Draft Only）**。在取得使用者明確授權、完成切換前最新正式備份、並通過 [`DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md) 驗證前，**禁止於任何正式環境執行**。

---

## 一、歷史設計一致性檢查（Phase 3-C-14 / 3-C-15 / 3-C-30 與程式碼比對）

經唯讀比對歷史文件與 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)、[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)、[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)，確認以下 **10 項潛在矛盾與統一裁定**：

| 檢查項目 | 歷史文件／程式碼衝突處 | 本階段統一裁定 | 狀態 |
|---|---|---|---|
| **1. `LOGIN` / `NOLOGIN`** | `R14C21`/`R14C22` 沿用沙盒 `SET ROLE` 寫成 `NOLOGIN`；`R14C20`、`database.ts`、`prisma.config.ts`、`db-validation.ts` 要求直接以角色連線 | **`migration_admin` 與 `app_runtime` 皆必須為 `LOGIN`**（設定獨立高強度密碼，SCRAM-SHA-256） | **已統一（待 Supavisor 實測）** |
| **2. `BYPASSRLS` / `NOBYPASSRLS`** | `public` Schema 全 37 表啟用 `ENABLE ROW LEVEL SECURITY` 且 `0` 條 Policy；若無 `BYPASSRLS` 查詢全拒 | `migration_admin` 設 **`NOBYPASSRLS`**（身為物件 Owner 天然可遷移）；`app_runtime` 暫定 **`BYPASSRLS`**，但受應用層授權與 27 個未實作模型之強制門檻約束 | **已統一（帶風險條件，上線維持 NO-GO）** |
| **3. `NOINHERIT` / `INHERIT`** | `R14C20` 未顯式寫出 `NOINHERIT`；`Phase 21` / `R14C22` / `3-C-15` 建議加上 `NOINHERIT` | **兩角色皆顯式設定 `NOINHERIT`**，且嚴禁 `GRANT postgres` 或兩角色互相 `GRANT` 成員關係 | **已統一** |
| **4. `TABLE` 權限** | `R14C05_PERMISSION_MATRIX_FINAL.md` 靜態表名含陳舊錯誤（如 `Course`, `Lesson`），實際 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 為 **36 個業務模型 + `_prisma_migrations` = 37 表** | **禁止寫死靜態表名清單**；一律以 `pg_tables WHERE schemaname = 'public'` 動態迴圈賦權，再針對 `AuditLog` 與 `_prisma_migrations` 顯式收斂 | **已統一** |
| **5. `SEQUENCE` 權限** | `R14C05` 曾列 `USAGE, SELECT, UPDATE`；`R14C22` 與 `3-C-15` 修正為排除 `UPDATE`；目前 `schema.prisma` 全採 UUIDv4（`0` 個 Sequence） | **僅授予 `USAGE, SELECT`（嚴禁 `UPDATE`）**，防止 `setval()` 碰撞攻擊；保留動態迴圈以相容未來新增自增序列 | **已統一（`0` Sequence 實測待未來補充）** |
| **6. `ENUM / TYPE` 權限** | `schema.prisma:173` 定義 `enum AnnouncementStatus`（衍生 `_AnnouncementStatus` 陣列型別） | Owner 轉移給 `migration_admin`；`app_runtime` 透過 `USAGE ON SCHEMA public` 與 `USAGE ON TYPE` 讀取/寫入列舉值，無 `ALTER TYPE` 權限 | **已統一** |
| **7. Schema 與物件所有權** | Supabase 原廠物件全屬 `postgres`；不可用 `REASSIGN OWNED BY postgres`（會波及系統 Schema） | **嚴格限定 `schemaname = 'public'`** 迴圈轉移表、Sequence、使用者定義 Type 與 `public` Schema Owner 至 `migration_admin`；**不觸碰 `auth`/`storage`/`realtime`/`extensions`** | **已統一（待確認 Supabase `postgres` 是否有權轉移 `public` Owner）** |
| **8. `AuditLog` Append-only** | 早期部分敘述易被誤解為絕對不可變；`3-C-14` 與 `3-C-30` 修正 | 精確定義為 **「Runtime 角色級 Table ACL Append-only」**：`app_runtime` 僅 `SELECT, INSERT`，顯式 `REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`；`postgres`/`migration_admin` 仍具 Owner 權限，且 `User` `ON DELETE SET NULL` 僅靠應用層軟刪除防護 | **已統一** |
| **9. `_prisma_migrations` 保護** | 屬於 Prisma 遷移系統表，不應被 Runtime 讀取或修改 | `migration_admin` 擁有完整所有權；對 `app_runtime` 與 `PUBLIC` 執行 **`REVOKE ALL ON TABLE public."_prisma_migrations"`** | **已統一** |
| **10. Supavisor 連線與 `sslmode`** | `db-validation.ts:532` 接受 `require`/`verify-full`/`verify-ca`；`database.ts:54-57` 強制 `rejectUnauthorized: true` + `prod-supabase-ca.crt`；`validateMigrationDatabaseUrl` 未強制檢查 `sslmode` | Runtime 與 Migration **優先皆使用 Session Pooler (`aws-0-ap-southeast-2.pooler.supabase.com:5432`)**，使用者名稱為 `<role>.ypibmyfxfhsyfdwxprpi`；URL 規範統一要求 **`sslmode=verify-full`**（程式碼收緊列為待決策選配） | **已統一（Supavisor 自訂角色認證 `NOT TESTED`）** |

---

## 二、正式角色設計統一規格

### 2.1 `migration_admin`（DDL 與結構遷移專用角色）

| 屬性／權限項目 | 統一規格 | 依據與備註 |
|---|---|---|
| `LOGIN` | **`LOGIN`**（獨立強密碼） | `prisma.config.ts` / `DIRECT_URL` 需直接登入 |
| `SUPERUSER` | **`NOSUPERUSER`** | 最小權限，不具備系統級權限 |
| `CREATEDB` | **`NOCREATEDB`** | 僅在既定 `postgres` 庫套用 `prisma migrate deploy` |
| `CREATEROLE` | **`NOCREATEROLE`** | 禁止遷移腳本動態建號或改密碼 |
| `BYPASSRLS` | **`NOBYPASSRLS`** | 身為 `public` 物件 Owner，未開 `FORCE ROW LEVEL SECURITY` 時天然免受阻擋 |
| `INHERIT` | **`NOINHERIT`** | 防止隱式繼承其他角色權限 |
| `REPLICATION` | **`NOREPLICATION`** | 不需邏輯複製權限（若 Supabase 託管限制無法設定需記錄） |
| Schema / 物件所有權 | `public` Schema、全部 37 張表、Sequences、自訂 Enum (`AnnouncementStatus`) 之 **Owner** | PostgreSQL 規定 `ALTER TABLE` / `DROP` 必須為物件 Owner；**待實測**：Supabase `postgres` 是否允許 `ALTER SCHEMA public OWNER TO migration_admin` |
| `rls_auto_enable` Event Trigger | **待實測（標記為未證實）** | 需於維護時窗實測 `NOSUPERUSER` 的 `migration_admin` 建表時是否正常觸發 Supabase 內建事件觸發器 |

### 2.2 `app_runtime`（Express / Prisma Client 執行期唯一角色）

| 屬性／權限項目 | 統一規格 | 依據與備註 |
|---|---|---|
| `LOGIN` | **`LOGIN`**（獨立強密碼） | `database.ts` `pg.Pool` 直接認證；**Supavisor 自訂角色相容性尚待實測** |
| `SUPERUSER` | **`NOSUPERUSER`** | 最小權限核心防線 |
| `CREATEDB` | **`NOCREATEDB`** | 禁止建庫 |
| `CREATEROLE` | **`NOCREATEROLE`** | 阻絕 SQL 注入建立後門帳號 |
| `BYPASSRLS` | **`BYPASSRLS`（暫定，帶風險條件）** | `public` 37 表全開 RLS 且 `0` Policy；但必須配合後端所有權守衛與測試門檻方可上線 |
| `INHERIT` | **`NOINHERIT`** | 禁止繼承 `postgres` / `migration_admin` |
| `REPLICATION` | **`NOREPLICATION`** | 應用程式不需複製權限 |
| Schema 權限 | 僅 `USAGE ON SCHEMA public`；顯式 `REVOKE CREATE ON SCHEMA public` | 阻絕自建表、View、Function |
| 35 張一般業務表 DML | `SELECT, INSERT, UPDATE, DELETE`（不含 `TRUNCATE`, `REFERENCES`, `TRIGGER`） | 對應 36 業務模型扣除 `AuditLog` |
| `AuditLog` 權限 | 僅 **`SELECT, INSERT`**；顯式 `REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` | Runtime 角色級 Append-only |
| `_prisma_migrations` 權限 | **`REVOKE ALL`**（零權限） | 禁止應用程式讀寫遷移紀錄 |
| Sequence 權限 | 僅 **`USAGE, SELECT`**（嚴禁 `UPDATE`） | 防止 `setval()` 製造主鍵碰撞 DoS |

> **未證實權限標記（不可自行放寬）**：
> 1. Supavisor Pooler 對 SQL 自建 `LOGIN` 角色（`app_runtime.<ref>` / `migration_admin.<ref>`）之 SCRAM 認證相容性：**待實測**。
> 2. Supabase 託管下 `postgres` 將 `public` Schema Owner 移轉予 `migration_admin` 是否受雲端保留權限限制：**待實測**。
> 3. `migration_admin` 執行 `CREATE TABLE` 時與 Supabase `rls_auto_enable` 事件觸發器相容性：**待實測**。

---

## 三、正式切換 SQL 草案（共 11 段，僅供審查，嚴禁未授權執行）

### 步驟 1：切換前唯讀檢查

- **執行目的**：確認目前資料庫物件數量、Owner 分布與目標角色是否尚未存在，避免覆寫或誤判。
- **權限影響**：無（100% 唯讀查詢）。
- **前置條件**：以 `postgres` 唯讀連線至正式庫 `postgres`，且已完成切換前最新加密備份。
- **可能失敗原因**：連線逾時、TLS 驗證失敗。
- **回復方式**：無需回復（唯讀）。

```sql
-- [DRAFT Step 1] 切換前唯讀檢查
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

SELECT typname, pg_get_userbyid(typowner) AS type_owner
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public' AND t.typtype = 'e';
```

---

### 步驟 2：正式角色建立草案

- **執行目的**：建立符合最小權限與直接連線需求之 `migration_admin` 與 `app_runtime`。
- **權限影響**：新增兩個 `LOGIN` 角色，並授予 `postgres` 資料庫 `CONNECT` 權限；不授予任何超級使用者或角色繼承權。
- **前置條件**：步驟 1 確認兩角色不存在；兩組強密碼已產生並安全保存於密碼庫（**禁止寫入檔案或終端歷史**）。
- **可能失敗原因**：角色名稱已存在；Supabase 託管環境拒絕部分屬性（如 `NOREPLICATION` 或特定旗標）。
- **回復方式**：若尚未轉移任何物件，直接 `REVOKE CONNECT ON DATABASE postgres FROM app_runtime, migration_admin; DROP ROLE IF EXISTS app_runtime, migration_admin;`。

```sql
-- [DRAFT Step 2] 建立正式角色（<PLACEHOLDER> 須於安全互動環境替換，嚴禁進版控）
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
```

---

### 步驟 3：Schema 與物件所有權調整草案

- **執行目的**：將 `public` Schema 及其內部既有 37 張表、Sequences 與自訂 Enum Owner 移轉給 `migration_admin`（絕不觸碰系統 Schema）。
- **權限影響**：`postgres` 不再直接擁有 `public` 業務物件；`migration_admin` 成為唯一業務 DDL Owner。
- **前置條件**：步驟 2 成功；無活躍長事務持有 `public` 資料表鎖。
- **可能失敗原因**：Supabase 託管環境若禁止 `postgres` 執行 `ALTER SCHEMA public OWNER TO migration_admin`（**未經雲端實測之關鍵風險**）；或遇鎖表逾時。
- **回復方式**：立即中止後續步驟，執行反向迴圈將 `public` 物件與 Schema Owner 歸還 `postgres`（見回滾草案步驟 5）。

```sql
-- [DRAFT Step 3] Schema 與物件所有權調整（僅限 public Schema）
BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

GRANT USAGE, CREATE ON SCHEMA public TO migration_admin;
ALTER SCHEMA public OWNER TO migration_admin;

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. 轉移 public Schema 所有資料表（含業務 36 表與 _prisma_migrations）
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO migration_admin;', r.tablename);
  END LOOP;

  -- 2. 轉移 public Schema 所有 Sequences（目前 0 個，保留前瞻相容）
  FOR r IN
    SELECT sequencename
    FROM pg_sequences
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO migration_admin;', r.sequencename);
  END LOOP;

  -- 3. 轉移 public Schema 所有自訂 Enum / Composite Types（如 AnnouncementStatus）
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

COMMIT;
```

---

### 步驟 4：TABLE 權限草案（含步驟 7 `AuditLog` 與步驟 8 `_prisma_migrations` 同交易收斂）

- **執行目的**：確保 `app_runtime` 僅具備 `public` Schema `USAGE`（無 `CREATE`）與 35 張一般業務表之 DML（`SELECT, INSERT, UPDATE, DELETE`），並於**同一交易內無空窗**收斂 `AuditLog` 與 `_prisma_migrations`。
- **權限影響**：`app_runtime` 獲得業務表讀寫刪改權，同時 `PUBLIC` 若有殘留建表權將一併檢視。
- **前置條件**：步驟 3 完成。
- **可能失敗原因**：資料表被鎖定；物件名稱大小寫未加雙引號引用（本草案使用 `%I` 與顯式雙引號）。
- **回復方式**：`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_runtime; REVOKE USAGE ON SCHEMA public FROM app_runtime;`。

*(註：為遵守「步驟 4 TABLE 權限、步驟 7 `AuditLog` 權限、步驟 8 `_prisma_migrations` 保護不可分開造成時間空窗」之安全鐵律，以下將步驟 4、5、6、7、8 合併於同一原子授權單元或依序於單一 `BEGIN ... COMMIT` 交易區塊內執行；文件中仍分段說明其職責。)*

```sql
-- [DRAFT Step 4] Schema 與一般業務表 DML 授權
BEGIN;

REVOKE CREATE ON SCHEMA public FROM app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public
  TO app_runtime;
```

---

### 步驟 5：SEQUENCE 權限草案

- **執行目的**：為未來或既有 `public` Sequences 授予 `app_runtime` 最小必要權限（`USAGE, SELECT`），**嚴格禁止 `UPDATE`**。
- **權限影響**：允許讀取與推進自增序列（`nextval`），阻絕 `setval()` 竄改序列值之 DoS 風險。
- **前置條件**：位於步驟 4 同一交易內。
- **可能失敗原因**：Sequence Owner 非當前執行者（若已轉為 `migration_admin`，需確保 `postgres` 具管理授權或由 `migration_admin` 執行）。
- **回復方式**：`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;`。

```sql
-- [DRAFT Step 5] SEQUENCE 最小權限（嚴格排除 UPDATE）
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

---

### 步驟 6：TYPE 權限草案

- **執行目的**：確保 `app_runtime` 可在 `Announcement` 等資料表正常讀寫 `AnnouncementStatus` Enum 欄位，但不可 `ALTER TYPE`。
- **權限影響**：僅授予型別 `USAGE` 權限，無所有權與修改權。
- **前置條件**：步驟 3 已轉移 Type Owner 且已授予 `USAGE ON SCHEMA public`。
- **可能失敗原因**：自訂 Type 名稱大小寫或未在 `public` Schema。
- **回復方式**：`REVOKE USAGE ON TYPE public."AnnouncementStatus" FROM app_runtime;`。

```sql
-- [DRAFT Step 6] TYPE 權限（Enum USAGE）
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

### 步驟 7：`AuditLog` 權限草案（Runtime Append-only）

- **執行目的**：與步驟 4 同交易緊接執行，收回 `app_runtime` 對 `public."AuditLog"` 的修改、刪除與截斷權限，僅保留 `SELECT, INSERT`。
- **權限影響**：`app_runtime` 無法對 `AuditLog` 執行 `UPDATE`、`DELETE`、`TRUNCATE`、`REFERENCES`、`TRIGGER`。
- **前置條件**：必須與步驟 4 處於同一個 `BEGIN ... COMMIT` 交易中，消除授權空窗。
- **可能失敗原因**：表名拼寫錯誤；若 `PUBLIC` 群組原本被授予權限需額外檢查。
- **回復方式**：依回滾草案步驟 4 全數收回 `app_runtime` 資料表權限。

```sql
-- [DRAFT Step 7] AuditLog Runtime Append-only 強制收斂
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public."AuditLog"
  FROM app_runtime;

REVOKE ALL ON TABLE public."AuditLog" FROM PUBLIC;
```

---

### 步驟 8：`_prisma_migrations` 保護

- **執行目的**：徹底阻斷 `app_runtime` 與 `PUBLIC` 對遷移歷史表 `public."_prisma_migrations"` 的任何存取。
- **權限影響**：`app_runtime` 無法讀取、寫入或竄改 Prisma 遷移紀錄。
- **前置條件**：與步驟 4～7 處於同一交易中。
- **可能失敗原因**：表不存在（應於切換前檢查步驟 1 確認存在）。
- **回復方式**：依回滾草案收回 `app_runtime` 權限，Owner 歸還 `postgres`。

```sql
-- [DRAFT Step 8] _prisma_migrations 零權限隔離
REVOKE ALL ON TABLE public."_prisma_migrations" FROM app_runtime;
REVOKE ALL ON TABLE public."_prisma_migrations" FROM PUBLIC;

COMMIT;
```

---

### 步驟 9：Default Privileges（以 `migration_admin` 身分定義未來物件預設權限）

- **執行目的**：確保未來 `migration_admin` 執行 `prisma migrate deploy` 建立新表、新 Sequence 或新 Enum 時，`app_runtime` 自動獲得對應最小權限（且 Sequence 絕不含 `UPDATE`）。
- **權限影響**：僅影響未來由 `migration_admin` 在 `public` Schema 新建之物件（不自動套用 `AuditLog` 類特例，未來若新增不可變稽核表須於該 Migration 結尾手動 `REVOKE`）。
- **前置條件**：步驟 2～8 已完成；執行者須具備 `FOR ROLE migration_admin` 之設定權（`postgres` 或由 `migration_admin` 親自連線執行）。
- **可能失敗原因**：遺漏 `FOR ROLE migration_admin`，導致規則誤綁在 `postgres` 名下而對未來遷移無效。
- **回復方式**：執行回滾草案步驟 3（`ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public REVOKE ALL ...`）。

```sql
-- [DRAFT Step 9] Default Privileges（必須顯式綁定 FOR ROLE migration_admin）
BEGIN;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE ON TYPES TO app_runtime;

COMMIT;
```

---

### 步驟 10：切換後驗證 SQL（唯讀斷言）

- **執行目的**：透過 PostgreSQL 系統目錄與權限函式驗證上述 1～9 步結果是否完全符合矩陣規格。
- **權限影響**：無（唯讀檢查）。
- **前置條件**：步驟 1～9 完成。
- **可能失敗原因**：權限未正確收回（如 `PUBLIC` 殘留權限）或 Default Privileges 綁錯角色。
- **回復方式**：針對未通過斷言項目修正或觸發 7 步受控回滾。

```sql
-- [DRAFT Step 10] 切換後唯讀驗證矩陣
-- 1. 驗證角色屬性
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls, rolinherit, rolreplication
FROM pg_roles
WHERE rolname IN ('migration_admin', 'app_runtime');

-- 2. 驗證無多餘成員繼承（預期 0 rows）
SELECT r.rolname AS role_name, m.rolname AS member_name
FROM pg_auth_members am
JOIN pg_roles r ON r.oid = am.roleid
JOIN pg_roles m ON m.oid = am.member
WHERE r.rolname IN ('postgres', 'migration_admin', 'app_runtime')
   OR m.rolname IN ('migration_admin', 'app_runtime');

-- 3. 驗證 public 下非 migration_admin 擁有之表（預期 0 rows）
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tableowner <> 'migration_admin';

-- 4. 驗證 AuditLog 與 _prisma_migrations 權限矩陣
SELECT
  has_table_privilege('app_runtime', 'public."AuditLog"', 'SELECT') AS audit_select,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'INSERT') AS audit_insert,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'UPDATE') AS audit_update,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'DELETE') AS audit_delete,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'TRUNCATE') AS audit_truncate,
  has_table_privilege('app_runtime', 'public."_prisma_migrations"', 'SELECT') AS mig_select,
  has_table_privilege('app_runtime', 'public."_prisma_migrations"', 'INSERT') AS mig_insert;

-- 5. 驗證 Default Privileges 筆數（預期存在對應 migration_admin 之 TABLES/SEQUENCES/TYPES 規則）
SELECT pg_get_userbyid(defaclrole) AS defacl_owner, defaclobjtype, defaclacl
FROM pg_default_acl
WHERE defaclrole = (SELECT oid FROM pg_roles WHERE rolname = 'migration_admin');
```

---

### 步驟 11：預期成功與失敗結果對照表

| 驗證項目 | 執行身分 | 預期結果 | 失敗時之處理 |
|---|---|---|---|
| 角色屬性查詢 | `postgres` | `migration_admin` (`LOGIN=t`, `BYPASSRLS=f`, `INHERIT=f`)；`app_runtime` (`LOGIN=t`, `BYPASSRLS=t`, `INHERIT=f`)；兩者皆 `SUPER/CREATEDB/CREATEROLE=f` | 中止切換並回滾 |
| `pg_auth_members` 查詢 | `postgres` | **0 rows**（無繼承關係） | 立即 `REVOKE` 多餘成員資格 |
| `public` 非 `migration_admin` Owner 表 | `postgres` | **0 rows**（全數 37 表皆屬 `migration_admin`） | 補轉遺漏表或中止回滾 |
| `AuditLog` `has_table_privilege` | `postgres` | `SELECT=true`, `INSERT=true`, `UPDATE=false`, `DELETE=false`, `TRUNCATE=false` | 禁止啟用 Runtime，追查 `PUBLIC`/群組權限 |
| `_prisma_migrations` `has_table_privilege` | `postgres` | `SELECT=false`, `INSERT=false`（全 `false`） | 立即 `REVOKE ALL` |
| 負向 DDL 測試（`CREATE TABLE`） | `app_runtime` | **失敗**，回傳 PostgreSQL `42501 permission denied for schema public` | 收回 `CREATE ON SCHEMA public` |
| 負向 `AuditLog` 測試（`DELETE`/`UPDATE`） | `app_runtime` | **失敗**，回傳 PostgreSQL `42501 permission denied for table AuditLog` | 立即中止上線 |
| 負向提權測試（`SET ROLE postgres`） | `app_runtime` | **失敗**，回傳 PostgreSQL `42501 permission denied to set role "postgres"` | 立即中止並檢查 `pg_auth_members` |
