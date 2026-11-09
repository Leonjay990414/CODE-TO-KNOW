# CODE TO KNOW｜受控回滾程序演練報告
# PHASE 3C-4F-R14-C-2-1：PG17 本機沙盒最小權限受控回滾驗證

**文件編號**：C2K-DOC-DB-R14C21-ROLLBACK-01  
**執行日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**執行環境**：Docker PostgreSQL 17.11 隔離容器 (`code_to_know_pg17_restore_sandbox`)  
**回滾目標**：`c2k_dryrun_sandbox` (OID: 24698)  

---

## 一、回滾原則與名詞規範說明

> [!IMPORTANT]
> 依據專案最高安全原則，本專案嚴格拒絕使用「零風險回滾」等不切實際之宣稱。任何資料庫架構調整皆具備潛在風險（如長事務鎖定、連線中斷、依賴未清等）。本階段嚴格採用**「受控回滾程序（Controlled Rollback Procedure）」**，透過逐步斷開連線、明確收回授權、迴圈移轉所有權、跨系統表依賴斷言（Assertion Query）及最終角色銷毀，確保回滾過程在受控、可量測、可驗證之狀態下完成。

---

## 二、受控回滾七步執行流程與實測記錄

### 步驟 1：終止連線（Connection Termination）
在執行任何回滾 DDL 前，先從 `postgres` 系統庫斷開目標資料庫之所有非自身連線：
```sql
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'c2k_dryrun_sandbox' 
  AND pid <> pg_backend_pid();
```
**實測記錄**：成功終止 0 筆殘留連線，確保回滾作業無鎖衝突。

---

### 步驟 2：預設權限與 GRANT 權限收回（Privilege Revocation）
依序收回 `migration_admin` 宣告之 Default Privileges，以及兩角色之所有既有物件授權：
```sql
-- 1. 收回 Default Privileges
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public REVOKE ALL ON TABLES FROM app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public REVOKE ALL ON SEQUENCES FROM app_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public REVOKE ALL ON TYPES FROM app_runtime;

-- 2. 收回現有物件權限
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_runtime;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM app_runtime;
REVOKE ALL ON SCHEMA public FROM app_runtime;

REVOKE ALL ON SCHEMA public FROM migration_admin;

-- 3. 收回資料庫層級權限
REVOKE ALL ON DATABASE c2k_dryrun_sandbox FROM app_runtime, migration_admin;
REVOKE CONNECT ON DATABASE c2k_dryrun_sandbox FROM app_runtime, migration_admin;
```
**實測記錄**：全數語句回傳 `ALTER DEFAULT PRIVILEGES` 與 `REVOKE`，無錯誤發生。

---

### 步驟 3：所有權反向移轉（Ownership Reversion Loop）
執行動態 PL/pgSQL 腳本，將所有由 `migration_admin` 擁有的資料庫物件全數移轉回 `postgres`：
```sql
DO $$
DECLARE
  r RECORD;
BEGIN
  -- 移轉所有 public 資料表 (37 張)
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner = 'migration_admin') LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO postgres', r.tablename);
    RAISE NOTICE 'Reverted table public.% to postgres', r.tablename;
  END LOOP;

  -- 移轉序列 (若有)
  FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner = 'migration_admin') LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO postgres', r.sequencename);
    RAISE NOTICE 'Reverted sequence public.% to postgres', r.sequencename;
  END LOOP;

  -- 移轉自訂 Enum Type
  FOR r IN (
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    JOIN pg_roles r_owner ON r_owner.oid = t.typowner
    WHERE n.nspname = 'public'
      AND r_owner.rolname = 'migration_admin'
      AND t.typtype IN ('e', 'c')
      AND NOT t.typname LIKE '\_%'
  ) LOOP
    EXECUTE format('ALTER TYPE public.%I OWNER TO postgres', r.typname);
    RAISE NOTICE 'Reverted type public.% to postgres', r.typname;
  END LOOP;

  -- 移轉 public schema
  ALTER SCHEMA public OWNER TO postgres;
  RAISE NOTICE 'Reverted schema public to postgres';
END $$;
```
**實測記錄**：成功輸出 37 筆資料表移轉紀錄、1 筆 `AnnouncementStatus` 移轉紀錄及 1 筆 `public` schema 移轉紀錄。

---

### 步驟 4：依賴斷言（Assertion Query）
在嘗試刪除角色前，執行多維度斷言查詢，確保無任何物件仍由目標角色持有：

#### 斷言 1：共用依賴表查詢 (`pg_shdepend`)
```sql
SELECT 
  d.classid::regclass AS object_type,
  d.objid,
  r.rolname,
  d.deptype
FROM pg_shdepend d
JOIN pg_roles r ON r.oid = d.refobjid
WHERE r.rolname IN ('app_runtime', 'migration_admin');
```
**實測結果**：回傳 `(0 rows)`。

#### 斷言 2：物件持有統計查詢
```sql
SELECT 'tables' AS obj, count(*) FROM pg_tables WHERE tableowner IN ('app_runtime', 'migration_admin')
UNION ALL
SELECT 'types' AS obj, count(*) FROM pg_type t JOIN pg_roles r ON r.oid = t.typowner WHERE r.rolname IN ('app_runtime', 'migration_admin')
UNION ALL
SELECT 'classes' AS obj, count(*) FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner WHERE r.rolname IN ('app_runtime', 'migration_admin')
UNION ALL
SELECT 'namespaces' AS obj, count(*) FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner WHERE r.rolname IN ('app_runtime', 'migration_admin');
```
**實測結果**：
```
    obj     | count 
------------+-------
 tables     |     0
 types      |     0
 classes    |     0
 namespaces |     0
```
斷言判定：**通過（嚴格為 0）**。

---

### 步驟 5：測試角色刪除（Role Deletion）
在確認零依賴後，執行角色刪除：
```sql
DROP ROLE app_runtime;
DROP ROLE migration_admin;
```
**實測記錄**：回傳 `DROP ROLE` / `DROP ROLE`，無任何阻擋。

---

### 步驟 6：回滾後業務完整性驗證
在目標資料庫中驗證回滾後狀態：
- **資料表總數**：37 張。
- **所有權檢驗**：37 張資料表 owner 均全數恢復為 `postgres`。
- **自訂型別檢驗**：`AnnouncementStatus` owner 恢復為 `postgres`。
- **資料筆數**：基線業務資料完好無缺。

---

### 步驟 7：沙盒資料庫銷毀與清理（Teardown & Cleanup）
- 斷開連線並執行：`DROP DATABASE c2k_dryrun_sandbox;`
- 確認資料庫列表已無 `c2k_dryrun_sandbox`。
- 刪除容器內臨時備份檔案：`rm -f /tmp/code_to_know_supabase_prod.dump`。
- 確認主機備份檔案 `code_to_know_supabase_prod.dump`（SHA-256: `08202DE9...`）完好保存。
- 確認歷史測試資料庫 `code_to_know_cloud_restore_test` 完好未受干擾。

---

## 三、未來正式環境回滾實行可行性評估

1. **執行時間評估**：整體受控回滾程序在沙盒中執行時間小於 3 秒，若正式環境切換遇險，可於 10 秒內完全復原為原 `postgres` 擁有狀態。
2. **殘留風險與緩解**：正式環境最主要風險為長交易持鎖導致 `ALTER TABLE` 阻塞。緩解方案為在正式回滾腳本中先執行 `pg_terminate_backend`，並在必要時設定 `SET lock_timeout = '3s';`。
3. **驗收結論**：受控回滾腳本經實測驗證結構精確、流程嚴謹、可重複執行，完全具備未來正式環境部署之安全基準。
