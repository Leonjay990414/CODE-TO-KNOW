# CODE TO KNOW｜角色權限測試矩陣報告
# PHASE 3C-4F-R14-C-2-1：PG17 本機沙盒最小權限切換與受控回滾測試矩陣

**文件編號**：C2K-DOC-DB-R14C21-MATRIX-01  
**執行日期**：2026-11-09  
**環境規格**：Docker PostgreSQL 17.11 (`code_to_know_pg17_restore_sandbox`)  
**資料庫實例**：`c2k_dryrun_sandbox` (OID: 24698)  

---

## 一、測試概述與執行方法

本矩陣詳列在 `c2k_dryrun_sandbox` 隔離測試資料庫中，針對角色 `app_runtime` 與 `migration_admin` 執行的所有正向（Positive）與負向（Negative）安全權限測試。

測試涵蓋：
- 一般業務表 DML / DDL 權限隔離。
- 敏感資料表 (`_prisma_migrations`) 隔離保護。
- 審計日誌 (`AuditLog`) Append-Only 嚴格防護。
- 管理角色 (`migration_admin`) 遷移權限與系統權限邊界。
- 預設權限 (`Default Privileges`) 未來繼承性測試。
- Supabase Row Level Security (RLS) 行為實測。

---

## 二、角色權限完整測試矩陣

| 測試編號 | 測試對象角色 | 測試目標物件 / 操作 | 操作語法範例 | 預期結果 | 實際測試結果 | 狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T-01** | `app_runtime` | 一般業務表讀取 | `SELECT count(*) FROM "Subject";` | 允許讀取 (2 筆) | 成功讀取 2 筆 | **PASS** |
| **T-02** | `app_runtime` | 一般業務表寫入 | `INSERT INTO "Subject" ...;` | 允許新增 | 成功新增測試資料 | **PASS** |
| **T-03** | `app_runtime` | 一般業務表更新 | `UPDATE "Subject" SET "name" = ...;` | 允許更新 | 成功更新指定資料 | **PASS** |
| **T-04** | `app_runtime` | 一般業務表刪除 | `DELETE FROM "Subject" WHERE ...;` | 允許刪除 | 成功刪除測試資料 | **PASS** |
| **T-05** | `app_runtime` | 建立資料表 (DDL) | `CREATE TABLE test_tab (id int);` | 拒絕 (Permission Denied) | `ERROR: permission denied for schema public` | **PASS** |
| **T-06** | `app_runtime` | 修改資料表結構 (DDL) | `ALTER TABLE "Subject" ADD COLUMN c int;` | 拒絕 (Must be owner) | `ERROR: must be owner of table Subject` | **PASS** |
| **T-07** | `app_runtime` | 刪除資料表 (DDL) | `DROP TABLE "Subject";` | 拒絕 (Must be owner) | `ERROR: must be owner of table Subject` | **PASS** |
| **T-08** | `app_runtime` | 存取遷移歷史表 | `SELECT * FROM "_prisma_migrations";` | 拒絕 (Permission Denied) | `ERROR: permission denied for table _prisma_migrations` | **PASS** |
| **T-09** | `app_runtime` | 審計日誌查詢 | `SELECT count(*) FROM "AuditLog";` | 允許讀取 | `has_table_privilege: true`，成功查詢 | **PASS** |
| **T-10** | `app_runtime` | 審計日誌新增 | `INSERT INTO "AuditLog" ...;` | 允許新增 | `has_table_privilege: true`，成功插入日誌 | **PASS** |
| **T-11** | `app_runtime` | 審計日誌篡改 (UPDATE) | `UPDATE "AuditLog" SET details = 'x';` | 拒絕 (Permission Denied) | `ERROR: permission denied for table AuditLog` | **PASS** |
| **T-12** | `app_runtime` | 審計日誌刪除 (DELETE) | `DELETE FROM "AuditLog";` | 拒絕 (Permission Denied) | `ERROR: permission denied for table AuditLog` | **PASS** |
| **T-13** | `app_runtime` | 審計日誌清空 (TRUNCATE)| `TRUNCATE TABLE "AuditLog";` | 拒絕 (Permission Denied) | `ERROR: permission denied for table AuditLog` | **PASS** |
| **T-14** | `(System FK)` | 關聯使用者刪除外鍵連動 | `DELETE FROM "User" WHERE id = '...';` | AuditLog.userId 變為 NULL | NOTICE: After user delete: userId = \<NULL> | **PASS** |
| **T-15** | `migration_admin`| 遷移歷史表存取 | `SELECT count(*) FROM "_prisma_migrations";`| 允許存取 (2 筆) | 成功回傳 2 筆 | **PASS** |
| **T-16** | `migration_admin`| 遷移 DDL 執行 | `CREATE TABLE dryrun_test_future_tab ...;` | 允許建立 | 成功建立新資料表 | **PASS** |
| **T-17** | `migration_admin`| 建立資料庫 (CREATEDB) | `CREATE DATABASE illegal_db;` | 拒絕 (Permission Denied) | `ERROR: permission denied to create database` | **PASS** |
| **T-18** | `migration_admin`| 建立角色 (CREATEROLE) | `CREATE ROLE illegal_role;` | 拒絕 (Permission Denied) | `ERROR: permission denied to create role` | **PASS** |
| **T-19** | `(Default ACL)`| 新建資料表權限自動繼承 | `migration_admin` 建表後由 `app_runtime` 查詢 | 自動繼承 DML 權限 | `app_runtime` 成功 SELECT 與 INSERT 新表 | **PASS** |
| **T-20** | `(PG17 Sync)` | 自訂 Enum 陣列型別同步 | `ALTER TYPE "AnnouncementStatus" OWNER ...;` | `_AnnouncementStatus` 同步變更 | 查詢 `pg_type` 兩者 owner 均為 `migration_admin` | **PASS** |

---

## 三、AuditLog Append-Only 專項安全性驗證

透過 PostgreSQL 內建權限函數驗證：
```sql
SELECT 
  has_table_privilege('app_runtime', 'public."AuditLog"', 'select')   AS can_select,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'insert')   AS can_insert,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'update')   AS can_update,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'delete')   AS can_delete,
  has_table_privilege('app_runtime', 'public."AuditLog"', 'truncate') AS can_truncate;
```

**驗證輸出結果**：
```
 can_select | can_insert | can_update | can_delete | can_truncate 
------------+------------+------------+------------+--------------
 t          | t          | f          | f          | f
```

**結論**：
`app_runtime` 對 `AuditLog` 僅具備讀取與新增權限，所有修改、單筆刪除與全表截斷操作均在資料庫底層被嚴格阻斷，達到最高安全等級的 Append-Only 不可篡改防護。

---

## 四、Supabase Row Level Security (RLS) 整合結論

在實測中確認：
1. Supabase 的 `ensure_rls` Event Trigger 會自動對所有新建立的資料表開啟 RLS (`relrowsecurity = true`)。
2. 在缺乏明確 RLS Policy 的情況下，無 `BYPASSRLS` 的非 owner 角色會遭到 DEFAULT DENY ALL 阻斷。
3. 為確保現有 Node.js 後端 API（依賴 Express 中間件認證）能夠正常運作，執行期角色 `app_runtime` 必須具備 `BYPASSRLS` 屬性。
4. 本矩陣實測證實：**即便具備 `BYPASSRLS`，資料表層級的權限控制（如 `REVOKE UPDATE, DELETE ON "AuditLog"` 與 `REVOKE ALL ON "_prisma_migrations"`）依舊 100% 強制生效，不會因 RLS bypass 而被繞過。**
