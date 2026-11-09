# CODE TO KNOW｜PHASE 3C-4F-R14-C-2-0
# 資料庫最小權限與回滾 SQL 靜態安全審查報告

**文件編號**：`DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW`  
**審查日期**：2026-11-09  
**審查性質**：本機靜態程式碼與 SQL 語法審查（嚴禁連線正式資料庫、不執行任何資料庫寫入）  
**對應階段**：PHASE 3C-4F-R14-C-2-0 (SQL 靜態審查)  
**審查檔案**：  
- `backend/prisma/schema.prisma`  
- `backend/prisma/migrations/20261103000000_init/migration.sql`  
- `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`  
- `docs/DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md`  
- `docs/DATABASE_PHASE3C4F_R14C06_FINAL_ROLLBACK_SAFETY_AUDIT.md`

---

## 一、審查目標與執行原則

本審查旨在為即將進行的「本機 PG17 沙盒最小權限切換演練」提供完整的靜態代碼與 SQL 邏輯把關。  
所有檢查均基於原始碼靜態語法與 PostgreSQL 官方規範，**本階段不連線 Supabase，不連線本地 PG16/PG17 執行任何 DDL/DML**。

---

## 二、角色權限設計靜態審查 (Role Security Audit)

### 2.1 管理角色：`postgres`
- **定位**：Supabase 預設之超級管理員／維運角色。
- **審查結論**：
  - 現況：目前後端開發環境使用 `postgres` 帳號進行連線，存在過度授權風險。
  - 修正：正式環境中，`postgres` 應僅限於執行一次性架構切換、災難復原與重大維護，**嚴禁作為後端應用程式 Runtime 的日常連線帳號**。

---

### 2.2 執行期角色：`app_runtime`
- **定位**：Node.js 後端 Express API / Prisma Client 日常連線角色。
- **權限設計分析**：
  ```sql
  CREATE ROLE app_runtime WITH LOGIN PASSWORD '...';
  GRANT CONNECT ON DATABASE postgres TO app_runtime;
  GRANT USAGE ON SCHEMA public TO app_runtime;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
  REVOKE CREATE ON SCHEMA public FROM app_runtime;
  REVOKE ALL ON TABLE public._prisma_migrations FROM app_runtime;
  REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;
  ```
- **審查要點與防禦深度**：
  1. **無 DDL 權限**：`REVOKE CREATE ON SCHEMA public` 阻斷建立新表；非資料表 Owner，阻斷 `ALTER TABLE`、`DROP TABLE`、`CREATE INDEX`。
  2. **無遷移竄改權**：`REVOKE ALL ON TABLE public._prisma_migrations` 確保遷移狀態不可被後端代碼觸碰。
  3. **AuditLog Append-Only 嚴格時序性**：
     - **關鍵發現**：`GRANT ... ON ALL TABLES` 會將 `AuditLog` 的 UPDATE/DELETE 一併賦予 `app_runtime`。
     - **防護措施**：必須在 `GRANT ALL TABLES` 之後，**顯式且立即執行** `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;`，以落實審計日誌只增只讀。
  4. **RLS 行級安全**：預設賦予 `NOBYPASSRLS`，未來啟用 RLS 時受策略嚴密約束。

---

### 2.3 遷移管理角色：`migration_admin`
- **定位**：CI/CD 部署管線專用角色，專責執行 `prisma migrate deploy`。
- **權限設計分析**：
  ```sql
  CREATE ROLE migration_admin WITH LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD '...';
  GRANT CONNECT ON DATABASE postgres TO migration_admin;
  GRANT USAGE, CREATE ON SCHEMA public TO migration_admin;
  ```
- **審查要點與最小權限合規性**：
  1. **徹底剝除過度授權**：
     - `NOCREATEDB`：Prisma Migrate Deploy 不需要建立資料庫（已由 R14-C-0.5 修正）。
     - `NOCREATEROLE`：不需要管理角色。
     - `NOBYPASSRLS`：預設遵循行級安全。
  2. **保留必要管理權限**：
     - `CREATE ON SCHEMA public`：允許建立新資料表、Sequence 與 Enum 類型。
     - **物件所有權 (Ownership)**：必須成為 `public` 下所有資料表、Sequence 與 Enum 的 Owner（PostgreSQL 規定僅有 Owner 能執行 DDL 結構修改）。
     - **Advisory Lock 存取**：調用 `pg_advisory_lock`，PostgreSQL 內建授權所有連線帳號，相容性良好。

---

## 三、所有權移轉 SQL 靜態審查 (Ownership Transfer Audit)

### 3.1 移轉標的涵蓋範圍與語法
審查 R14-C-0.5 設計之 PL/pgSQL 移轉迴圈：

```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. 資料表與檢視表移轉
    FOR r IN (
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' AND tableowner <> 'migration_admin'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I OWNER TO migration_admin;', r.tablename);
    END LOOP;

    -- 2. Sequence 移轉
    FOR r IN (
        SELECT sequence_name FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    ) LOOP
        EXECUTE format('ALTER SEQUENCE public.%I OWNER TO migration_admin;', r.sequence_name);
    END LOOP;

    -- 3. 自訂 Enum 類型移轉 (排除系統衍生陣列類型)
    FOR r IN (
        SELECT t.typname FROM pg_type t 
        JOIN pg_namespace n ON n.oid = t.typnamespace 
        WHERE n.nspname = 'public' AND t.typtype = 'e'
    ) LOOP
        EXECUTE format('ALTER TYPE public.%I OWNER TO migration_admin;', r.typname);
    END LOOP;

    -- 4. public Schema 本身移轉
    ALTER SCHEMA public OWNER TO migration_admin;
END $$;
```

### 3.2 靜態審查發現與安全評估
1. **Schema 隔離安全性（通過）**：
   嚴格指定 `schemaname = 'public'` 與 `n.nspname = 'public'`，**絕不觸碰 Supabase 內部 schema (`auth`, `storage`, `vault`, `extensions`)**。
2. **SQL 注入防護（通過）**：
   全面採用 `format('... %I ...', r.tablename)` 之動態識別字包裹，具備自動跳脫（Escaping）能力，防範大小寫混合或特殊符號引起的解析錯誤。
3. **Enum 陣列自動連動驗證（通過）**：
   Prisma 遷移建立了 `AnnouncementStatus`（`typtype = 'e'`）。PostgreSQL 官方行為已證實，當變更主 Enum 之 Owner 時，底層自動衍生的 `_AnnouncementStatus`（`typtype = 'b'`）會由資料庫核心自動連動轉移，不可直接對陣列類型執行 ALTER OWNER。
4. **禁忌語法排除（通過）**：
   未包含危險的全域 `REASSIGN OWNED BY postgres`，未包含毀滅性的 `DROP OWNED BY`。

---

## 四、Default Privileges 靜態審查 (Default Privileges Audit)

### 4.1 語法與規則設定
```sql
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
GRANT USAGE ON TYPES TO app_runtime;
```

### 4.2 靜態時序與行為分析
1. **建立者指定性**：`FOR ROLE migration_admin`。只有當 `migration_admin` 未來新建物件時，此規則才會被觸發套用。
2. **時序不回溯性**：Default Privileges **絕不影響既有物件**，僅作用於未來執行 Migration 產生的新表、新 Sequence 或新 Enum。
3. **撤銷不傷既有**：未來若執行 `ALTER DEFAULT PRIVILEGES ... REVOKE ALL`，僅會清除未來的自動授權規則，既有物件上的現存權限完全不受影響。

---

## 五、受控回滾程序靜態審查 (Rollback Procedure Audit)

### 5.1 術語與原則規範
- **嚴格術語要求**：本專案嚴禁使用「零風險回滾」等誇大用詞，正式命名為**「受控回滾程序 (Controlled Rollback Procedure)」**。
- **核心安全防護**：
  1. **徹底排除 `DROP OWNED BY`**（該指令會在漏移轉時直接 DROP 表，屬不可逆毀滅操作）。
  2. **引入前置斷言查詢 (Assertion Query)**：在刪除角色前，透過 `SELECT count(*)` 驗證目標角色名下擁有的物件數是否精確為 0。
  3. **引擎原廠保護**：僅使用 `DROP ROLE IF EXISTS`。若仍有任何殘留依賴，PostgreSQL 引擎會主動拋出例外並中斷交易，保證資料表 100% 留存。

---

## 六、檢核結論標記

| 審查維度 | 審查判定 | 驗證層級標記 |
| :--- | :--- | :--- |
| **app_runtime 最小權限** | 合理且隔離完整，具備 AuditLog 封鎖 | 【已由原始碼確認】 |
| **migration_admin 最小權限** | 移除 CREATEDB，權限恰如其分 | 【已由原始碼確認】 |
| **所有權移轉安全性** | 範圍鎖定 public，包含 Enum，無全域 REASSIGN | 【已由原始碼確認】 |
| **Default Privileges 語法** | 涵蓋 TABLES/SEQUENCES/TYPES，時序明確 | 【已由原始碼確認】 |
| **回滾程序無毀損設計** | 排除 DROP OWNED BY，採斷言受控回滾 | 【已由原始碼確認】 |
