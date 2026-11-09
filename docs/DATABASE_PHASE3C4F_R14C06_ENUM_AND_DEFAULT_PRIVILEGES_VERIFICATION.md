# CODE TO KNOW｜PHASE 3C-4F-R14-C-0.6
# 自訂 Enum 類型所有權移轉與 Default Privileges 實體行為深度驗證報告

**文件編號**：`DATABASE_PHASE3C4F_R14C06_ENUM_AND_DEFAULT_PRIVILEGES_VERIFICATION`  
**審查日期**：2026-11-09  
**審查性質**：本機 PG17.11 沙盒實測與原始碼語意分析（無連線正式資料庫）  
**對應階段**：PHASE 3C-4F-R14-C-0.6 (W-02, W-03)

---

## 一、自訂 Enum 類型所有權移轉驗證 (W-02)

### 1.1 【已由原始碼確認】`AnnouncementStatus` 存在性與定義
- **原始碼路徑**：`backend/prisma/migrations/20261108000000_add_business_models/migration.sql:2`
- **定義語句**：
  ```sql
  CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  ```
- **Prisma Schema 依賴**：在 `backend/prisma/schema.prisma` 中，`model Announcement` 的欄位 `status AnnouncementStatus @default(DRAFT)` 依賴於此 Enum。
- **資料庫實體狀態**：在 PG17 沙盒還原庫中確認，`AnnouncementStatus` 實體存在於 `public` schema，`typtype = 'e'`。

---

### 1.2 【已實際測試】Enum 與底層 Array Type 之引擎行為驗證

在 PostgreSQL 引擎內部，當建立一個 Enum 類型 `AnnouncementStatus` 時，系統會自動在 `pg_type` 建立兩個記錄：
1. **主 Enum 類型**：`AnnouncementStatus`，`typtype = 'e'`。
2. **自動衍生陣列類型**：`_AnnouncementStatus`，`typtype = 'b'`（Base type）。

我們在本地 PG17.11 沙盒中進行兩項關鍵實驗：

#### 實驗 A：直接對陣列類型執行 `ALTER TYPE`
```sql
ALTER TYPE "_TestEnum" OWNER TO test_migration_admin;
```
- **引擎輸出**：
  ```text
  ERROR: cannot alter array type "TestEnum"[]
  HINT: You can alter type "TestEnum", which will alter the array type as well.
  ```
- **結論**：PostgreSQL 嚴禁直接更改由系統生成的陣列類型所有權。

#### 實驗 B：對主 Enum 類型執行 `ALTER TYPE` 並觀察陣列類型
```sql
ALTER TYPE "TestEnum" OWNER TO test_migration_admin;
```
- **查詢驗證**：
  ```sql
  SELECT t.typname, t.typtype, r.rolname as owner
  FROM pg_type t JOIN pg_roles r ON r.oid = t.typowner
  WHERE t.typname IN ('TestEnum', '_TestEnum');
  ```
- **實測結果**：
  | typname | typtype | owner |
  | :--- | :--- | :--- |
  | `TestEnum` | `e` | `test_migration_admin` |
  | `_TestEnum` | `b` | `test_migration_admin` |
- **結論**：當且僅當更改 `typtype = 'e'` 之主 Enum 類型時，PostgreSQL 核心會**自動且原子化地**將其衍生陣列類型的所有權一併轉移給新 Owner。

---

### 1.3 【已實際測試】PL/pgSQL 移轉過濾條件精確性

移轉腳本中設計之過濾條件：
```sql
SELECT t.typname
FROM pg_type t
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typtype = 'e'
```
- **安全保障**：
  1. 嚴格鎖定 `n.nspname = 'public'`，杜絕碰觸 `auth`、`storage`、`extensions` 內部系統 Type。
  2. 嚴格限制 `t.typtype = 'e'`，**精準排除 `_AnnouncementStatus` 等陣列類型**，百分之百避免觸發 `ERROR: cannot alter array type`。
  3. 未來新增 Enum 的 Migration 只要在 `migration_admin` 執行，皆可順利擁有該 Type 並完成 DDL。

---

## 二、Default Privileges 語法與行為實測 (W-03)

### 2.1 【已實際測試】語法正確性與未來物件自動授權能力

在本地 PG17.11 沙盒中，以 `postgres` 身分執行以下三條標準語法：

```sql
-- 1. 未來資料表 DML 授權
ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO test_app_runtime;

-- 2. 未來 Sequence 讀取與使用授權
ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO test_app_runtime;

-- 3. 未來自訂 Type (含 Enum) 使用授權
ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public 
GRANT USAGE ON TYPES TO test_app_runtime;
```

#### 驗證測試步驟：
1. 切換角色為 `test_migration_admin`（模擬未來的 Prisma Migrate Deploy 執行）：
   ```sql
   SET ROLE test_migration_admin;
   CREATE TYPE "FutureEnum" AS ENUM ('ACTIVE', 'INACTIVE');
   CREATE TABLE "FutureTable" (id SERIAL PRIMARY KEY, status "FutureEnum" NOT NULL);
   RESET ROLE;
   ```
2. 切換角色為 `test_app_runtime`（模擬後端應用程式 Runtime 連線）：
   ```sql
   SET ROLE test_app_runtime;
   INSERT INTO "FutureTable" (status) VALUES ('ACTIVE');
   SELECT * FROM "FutureTable";
   RESET ROLE;
   ```
3. **實測輸出**：
   ```text
   INSERT 0 1
    id | status 
   ----+--------
     1 | ACTIVE
   (1 row)
   ```
- **結論**：`test_app_runtime` 在**無任何額外人工介入授權**的情況下，直接成功使用新建立的 Enum 類型並對新資料表進行寫入與查詢，完全滿足自動化 Migration 與持續運作的需求。

---

### 2.2 【已實際測試】Default Privileges 範圍限定與 REVOKE 清除驗證

1. **範圍限定確認**：
   檢查 `pg_default_acl` 系統目錄：
   ```sql
   SELECT pg_catalog.pg_get_userbyid(d.defaclrole) AS target_role,
          n.nspname AS schema_name,
          d.defaclobjtype,
          d.defaclacl
   FROM pg_catalog.pg_default_acl d
   LEFT JOIN pg_catalog.pg_namespace n ON n.oid = d.defaclnamespace;
   ```
   - **實測結果**：
     - `target_role`: `test_migration_admin`
     - `schema_name`: `public`
     - `defaclobjtype = 'r'` (Tables) ➔ `{test_app_runtime=arwd/test_migration_admin}`
     - `defaclobjtype = 'S'` (Sequences) ➔ `{test_app_runtime=rU/test_migration_admin}`
     - `defaclobjtype = 'T'` (Types) ➔ `{test_app_runtime=U/test_migration_admin}`
   - **確認**：該規則僅對由 `test_migration_admin` 建立的物件生效，不影響 `postgres` 自身建立的物件。

2. **REVOKE 反向清除測試**：
   執行以下回滾清理語句：
   ```sql
   ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public REVOKE ALL ON TABLES FROM test_app_runtime;
   ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public REVOKE ALL ON SEQUENCES FROM test_app_runtime;
   ALTER DEFAULT PRIVILEGES FOR ROLE test_migration_admin IN SCHEMA public REVOKE ALL ON TYPES FROM test_app_runtime;
   ```
   - **實測結果**：再次查詢 `pg_default_acl`，輸出為 **`0 rows`**。
   - **確認**：預設權限可被百分之百完全撤除，不殘留任何幽靈繼承規則。

---

## 三、檢核結論標記

| 檢核項目 | 判定結果 | 驗證依據標記 |
| :--- | :--- | :--- |
| `AnnouncementStatus` 存在於 Migration SQL | **確認存在** | 【已由原始碼確認】（`20261108000000_add_business_models:2`） |
| `typtype = 'e'` 精準排除陣列類型 | **確認排除且能自動同步衍生陣列** | 【已實際測試】（PG17.11 沙盒驗證） |
| Default Privileges TABLES / SEQUENCES / TYPES 語法 | **100% 正確有效** | 【已實際測試】（PG17.11 沙盒驗證） |
| `app_runtime` 對未來 Enum 與 Table 之存取 | **免人工介入自動獲得 USAGE / DML** | 【已實際測試】（PG17.11 沙盒驗證） |
| Default Privileges REVOKE 清理乾淨度 | **完全清除（0 rows 殘留）** | 【已實際測試】（PG17.11 沙盒驗證） |
