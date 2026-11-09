# CODE TO KNOW｜資料庫最小權限與回滾演練執行報告
# PHASE 3C-4F-R14-C-2-1：PG17 本機沙盒最小權限切換與受控回滾實際演練

**文件編號**：C2K-DOC-DB-R14C21-EXEC-01  
**執行日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**執行環境**：本機 Docker PostgreSQL 17.11 獨立沙盒容器 (`code_to_know_pg17_restore_sandbox`)  
**演練資料庫**：`c2k_dryrun_sandbox` (OID: 24698，演練結束後已受控銷毀)  
**雲端連線狀態**：零連線（嚴格隔離，未接觸 Supabase 正式資料庫）  

---

## 一、執行背景與演練目標

本演練依據 `PHASE 3C-4F-R14-C-2-0` 審查通過之安全規範，在本機 Docker PG17.11 隔離環境中，以真實雲端基準備份進行還原，完整演練：

1. **角色建立**：建立 `app_runtime` 與 `migration_admin` 最小權限角色（NOLOGIN）。
2. **所有權移轉**：將 37 張業務資料表、自訂 Enum Type 及 `public` Schema 移轉給 `migration_admin`。
3. **預設權限配置**：設定 `ALTER DEFAULT PRIVILEGES` 確保未來遷移建立之物件自動繼承權限。
4. **執行期權限授予**：授予 `app_runtime` 業務表 DML 權限，隔離 `_prisma_migrations`。
5. **安全防護驗證**：驗證 `AuditLog` Append-Only 防護（禁止 UPDATE/DELETE/TRUNCATE）。
6. **重大架構發現（RLS 與 Event Trigger）**：驗證 Supabase 內建 `ensure_rls` Event Trigger 對非 owner 角色的存取行為。
7. **受控回滾程序**：演練完整權限收回、所有權歸還 `postgres`、依賴斷言（Assertion Query）與角色刪除。

---

## 二、沙盒環境識別與基準備份核驗

### 1. 容器環境獨立性

| 檢查項目 | 實際狀態 | 安全判定 |
| :--- | :--- | :--- |
| **容器名稱** | `code_to_know_pg17_restore_sandbox` | 通過（隔離測試容器） |
| **容器 ID** | `08df84db262b` | 通過 |
| **映射埠位** | `5433:5432`（本機 5433） | 通過（與本機 PG16 埠位 5432 實體隔離） |
| **資料庫版本** | PostgreSQL 17.11 on x86_64-pc-linux-musl | 通過（與正式環境 PG17 相容） |
| **演練前狀態** | `c2k_dryrun_sandbox` 不存在，無殘留測試角色 | 通過 |
| **保護物件** | `code_to_know_cloud_restore_test` 存在且嚴格未受干擾 | 通過 |

### 2. 基準備份完整性

- **備份路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758\code_to_know_supabase_prod.dump`
- **檔案大小**：505,249 bytes
- **SHA-256 雜湊值**：`08202de9d9ab35083fc0a54a78563a498ea26cb35320976210bfcd7bfa2feda3`
- **容器複製驗證**：複製至容器 `/tmp/`，雜湊比對一致。

---

## 三、沙盒資料庫還原與結構基線

### 1. 建立測試資料庫
```sql
CREATE DATABASE c2k_dryrun_sandbox OWNER postgres ENCODING 'UTF8';
```
- **建立後 Database OID**：`24698`

### 2. 還原與物件統計
透過 `pg_restore -d c2k_dryrun_sandbox` 還原基準備份，還原後結構統計：
- **業務資料表 (Base Tables)**：37 張（包含 `_prisma_migrations` 與 `AuditLog`）。
- **自訂 Enum Type**：1 個 (`AnnouncementStatus`)。
- **外鍵約束 (Foreign Keys)**：47 組。
- **索引數量 (Indexes)**：133 組。
- **Prisma 遷移紀錄**：2 筆已套用記錄。

---

## 四、最小權限角色建立與所有權移轉

### 1. 角色建立
```sql
CREATE ROLE migration_admin WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;
CREATE ROLE app_runtime WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;
```
*註：後續驗證確認，在 Supabase 具備 `ensure_rls` 之環境下，後端 API 執行期角色需評估 `BYPASSRLS` 配置（詳見本報告第六節）。*

### 2. 物件所有權移轉
- **Schema 所有權**：`ALTER SCHEMA public OWNER TO migration_admin;`
- **Enum Type 所有權**：`ALTER TYPE public."AnnouncementStatus" OWNER TO migration_admin;`
  - **PostgreSQL 17 特性驗證**：轉移 `AnnouncementStatus` 時，系統自動陣列型別 `_AnnouncementStatus` 亦同步自動轉移至 `migration_admin`。
- **37 張資料表所有權**：透過 PL/pgSQL 迴圈動態移轉，全部變更為 `migration_admin`。

---

## 五、權限配置與 Append-Only 防護

### 1. Default Privileges 配置
由 `migration_admin` 在 `public` Schema 內宣告未來物件權限：
```sql
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE ON TYPES TO app_runtime;
```
查詢 `pg_default_acl` 確實驗證 3 筆 default ACL 註冊成功。

### 2. 現有物件授權與隔離
```sql
-- Schema 與現有表授權
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

-- 隔離 Prisma 遷移歷史表
REVOKE ALL ON TABLE public."_prisma_migrations" FROM app_runtime;

-- AuditLog Append-Only 嚴格防護
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;
```

---

## 六、演練核心發現與架構評估

### 1. 發現 Supabase 內建 Event Trigger (`ensure_rls`)
在沙盒資料庫中發現以下系統觸發器：
```sql
SELECT evtname, evtevent, evtfoid::regproc FROM pg_event_trigger;
-- 結果：ensure_rls | ddl_command_end | rls_auto_enable
```
- **機制**：Supabase 在任何 DDL 建立資料表時，自動強制啟用 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`。
- **影響分析**：
  - 現有 37 張資料表的 `relrowsecurity` 全部為 `true`。
  - 由於目前業務表上未定義任何細部 `pg_policies`（業務邏輯權限均由 Node.js Express 中間件控管），PostgreSQL 預設行為為 **DEFAULT DENY ALL**。
  - 當以 `app_runtime`（若設定 `NOBYPASSRLS`）執行查詢時，即使擁有 Table 級別的 `SELECT` 權限，查詢結果亦為 0 筆或報出 `new row violates row-level security policy`。
- **架構決策**：
  - 正式環境中，Node.js 後端（Prisma）連線角色 `app_runtime` 必須具備 `BYPASSRLS`（與 Supabase 原生 `service_role` 相同模式），以便直接存取資料表。
  - **安全性驗證**：即使具備 `BYPASSRLS`，Table 級別的 `REVOKE UPDATE, DELETE ON "AuditLog"` 與 `REVOKE ALL ON "_prisma_migrations"` 仍由 PostgreSQL 核心嚴格強制執行，完全不受 RLS bypass 影響。

### 2. AuditLog Append-Only 與外鍵行為
- **權限檢查**：
  ```sql
  SELECT has_table_privilege('app_runtime', 'public."AuditLog"', 'select');   -- t
  SELECT has_table_privilege('app_runtime', 'public."AuditLog"', 'insert');   -- t
  SELECT has_table_privilege('app_runtime', 'public."AuditLog"', 'update');   -- f
  SELECT has_table_privilege('app_runtime', 'public."AuditLog"', 'delete');   -- f
  SELECT has_table_privilege('app_runtime', 'public."AuditLog"', 'truncate'); -- f
  ```
- **執行測試**：
  - `app_runtime` 執行 `UPDATE "AuditLog"` -> `ERROR: permission denied for table AuditLog`
  - `app_runtime` 執行 `DELETE FROM "AuditLog"` -> `ERROR: permission denied for table AuditLog`
  - `app_runtime` 執行 `TRUNCATE "AuditLog"` -> `ERROR: permission denied for table AuditLog`
- **外鍵 `ON DELETE SET NULL` 驗證**：
  - 當關聯的使用者被刪除時，`AuditLog.userId` 觸發器正確將欄位設置為 `NULL`，日誌紀錄本體完好保存。

---

## 七、受控回滾演練（Controlled Rollback Procedure）

演練依規範完整執行反向回滾：
1. **連線清理**：確認無殘留背景連線。
2. **權限收回**：收回 `migration_admin` 的 Default Privileges 與所有物件 Grants。
3. **所有權歸還**：透過動態 PL/pgSQL 迴圈將 37 張資料表、`AnnouncementStatus` Enum、`public` Schema 歸還給 `postgres`。
4. **依賴斷言（Assertion Query）**：
   - 查詢 `pg_shdepend`、`pg_tables`、`pg_type`、`pg_class`、`pg_namespace`。
   - 確認 `app_runtime` 與 `migration_admin` 名下物件數量 **嚴格為 0**。
5. **角色刪除**：成功執行 `DROP ROLE app_runtime; DROP ROLE migration_admin;`，無任何依賴性報錯。
6. **資料庫完整性檢驗**：確認 `c2k_dryrun_sandbox` 內 37 張資料表依然完整存在且 owner 均為 `postgres`。
7. **沙盒銷毀與清理**：
   - 執行 `DROP DATABASE c2k_dryrun_sandbox;`。
   - 刪除容器內 `/tmp/code_to_know_supabase_prod.dump`。
   - 原容器與 `code_to_know_cloud_restore_test` 完好如初。

---

## 八、演練結論與後續建議

本機 PG17 沙盒演練結果為 **PASS**。演練證實：
1. 最小權限角色切換 SQL 語法在 PostgreSQL 17.11 隔離環境中 100% 正確可行。
2. `AuditLog` Append-Only 與 `_prisma_migrations` 隔離防護精確生效。
3. 受控回滾程序設計完善，可在不破壞任何現有業務結構的前提下乾淨撤除。
4. 正式資料庫切換前，須將 `ensure_rls` 特性納入授權考量，將 `app_runtime` 授予 `BYPASSRLS`。
5. 雲端正式執行（R14-C-3）目前仍維持 **BLOCKED**，待正式備份完成後方可申請授權。
