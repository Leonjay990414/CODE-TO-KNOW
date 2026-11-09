# CODE TO KNOW｜PHASE 3C-4F-R14-C-0.6
# 執行期權限邊界、AuditLog 不可竄改性與 Migration 相容性最終審查報告

**文件編號**：`DATABASE_PHASE3C4F_R14C06_RUNTIME_PERMISSION_FINAL_AUDIT`  
**審查日期**：2026-11-09  
**審查性質**：原始碼靜態審查與本地 PG17.11 沙盒實測（嚴禁連線正式資料庫）  
**對應階段**：PHASE 3C-4F-R14-C-0.6 (W-04, W-05)

---

## 一、AuditLog 存取限制與不可竄改性邊界驗證 (W-04)

### 1.1 【已由原始碼確認】後端業務程式碼呼叫分析

對 `backend/src/` 全部 TypeScript 程式碼進行全域檢索：

1. **是否有 UPDATE 操作？**
   - 檢索 `auditLog.update`、`auditLog.updateMany`、`auditLog.upsert`：**0 筆相符**。後端所有業務邏輯均無任何修改稽核紀錄之程式碼。
2. **是否有 DELETE 操作？**
   - 檢索 `backend/src/` 中 `auditLog.delete`、`auditLog.deleteMany`：**0 筆相符**。
   - **例外記錄**：僅在測試套件 `backend/tests/integration.db.test.ts:36` 的測試後清理區塊（`afterAll`）呼叫了 `deleteMany`。該測試套件在獨立測試環境下執行，由測試管理員連線，並非生產環境 `app_runtime` 的業務執行邏輯。
3. **必要的 INSERT 與 SELECT 操作**：
   - **寫入 (INSERT)**：
     - `backend/src/utils/audit.ts:18` (`logAuditEvent`)
     - `backend/src/modules/auth/auth.service.ts`（註冊、登入成功/失敗、登出、驗證 Token、重設密碼）
     - `backend/src/modules/admin/admin.service.ts`（管理員封鎖、審核教師、系統設定更新）
     - `backend/src/modules/teachers/teacher.service.ts`（教師申請提交）
   - **讀取 (SELECT)**：
     - `backend/src/modules/admin/admin.service.ts:185, 195` (`listAuditLogs`: `findMany` 與 `count` 分頁查詢)。

---

### 1.2 【已實際測試】PostgreSQL 權限層級防護實測

在本地 PG17.11 沙盒中，針對 `app_runtime` 僅授予 `SELECT, INSERT` 並顯式 `REVOKE UPDATE, DELETE, TRUNCATE` 進行行為驗證：

```sql
GRANT SELECT, INSERT ON test_audit_log TO test_app_runtime;
REVOKE UPDATE, DELETE, TRUNCATE ON test_audit_log FROM test_app_runtime;

SET ROLE test_app_runtime;
-- 嘗試寫入與讀取
INSERT INTO test_audit_log VALUES ('a1', 'valid entry'); -- 成功 (INSERT 0 1)
SELECT * FROM test_audit_log;                           -- 成功 (1 row)

-- 嘗試直接竄改與刪除
UPDATE test_audit_log SET details = 'tampered';         -- 失敗：ERROR: permission denied
DELETE FROM test_audit_log WHERE id = 'a1';             -- 失敗：ERROR: permission denied
TRUNCATE test_audit_log;                                -- 失敗：ERROR: permission denied
```

- **實測結論**：在資料庫引擎層面，`app_runtime` 即使遭受 SQL Injection，也**絕對無法修改、刪除或清空 `AuditLog` 表**。

---

### 1.3 【已實際測試】外鍵約束觸發更新之技術邊界（重要例外說明）

在 `backend/prisma/schema.prisma` 中：
```prisma
model AuditLog {
  userId String?
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```
- **關聯行為分析**：當關聯的 `User` 紀錄被刪除時，PostgreSQL 外鍵約束會自動執行 `ON DELETE SET NULL`，將 `AuditLog.userId` 設為 `NULL`。
- **沙盒實測結果**：
  在 PG17 沙盒中實測證明，外鍵觸發的 `ON DELETE SET NULL` 係由 PostgreSQL 系統約束引擎內部驅動，**即使 `app_runtime` 無 `UPDATE` 權限，刪除 `User` 時仍會成功將對應 `AuditLog.userId` 更新為 NULL**。
- **非絕對不可竄改之邊界宣告**：
  1. **不能宣稱跨全角色的絕對不可竄改**：資料庫超級使用者（`postgres`）與資料表擁有者（`migration_admin`）仍具備 DDL 與資料管理權限。
  2. **刪除使用者會連帶異動 AuditLog 的 userId**：此為外鍵設定的正常行為，非未授權竄改，但若需追求極致審計不可變性，未來架構可考慮將外鍵設定為 `onDelete: NoAction` 或 `onDelete: Restrict`。
  3. **精準定性**：`AuditLog` 對生產應用程式執行期角色（`app_runtime`）為**嚴格的「只增只讀（Append-Only）」防護**。

---

## 二、權限矩陣與 Migration 相容性最終複核 (W-05)

### 2.1 【已由原始碼確認】`app_runtime` 權限邊界
- **DDL 絕對隔離**：
  - `REVOKE CREATE ON SCHEMA public FROM app_runtime;`
  - 資料表 Owner 為 `migration_admin`。PostgreSQL 規定只有 Owner 或 Superuser 能執行 `ALTER TABLE`、`DROP TABLE`、`CREATE INDEX`，因此 `app_runtime` 無法變更資料庫結構。
- **Prisma 歷史表隔離**：
  - `REVOKE ALL ON TABLE public._prisma_migrations FROM app_runtime;`
  - 應用程式執行期無權讀取或竄改遷移歷史。

---

### 2.2 【已由原始碼與規範確認】`migration_admin` 最小權限適法性
- **過度授權剝除**：
  - `NOCREATEDB`：Prisma Migrate Deploy 不需要建立新資料庫。
  - `NOCREATEROLE`：不需要建立或管理其他角色。
  - `NOBYPASSRLS`：預設遵循行級安全策略。
- **滿足 Migration 所需權限**：
  - **Schema CREATE**：具備 `GRANT CREATE ON SCHEMA public TO migration_admin;`，可建立新表與新 Type。
  - **物件所有權 (Ownership)**：`migration_admin` 作為 37 張表、所有 Sequence 與 Enum Type 的 Owner，具備完整的 `ALTER TABLE`、`ADD COLUMN`、`DROP COLUMN` 等 DDL 權限（**PostgreSQL 規定僅 GRANT ALL 並不等於 Owner，DDL 必須由 Owner 發起**）。
  - **Advisory Lock**：PostgreSQL 內建函式 `pg_advisory_lock` 允許任何連線角色調用，Prisma 遷移併發鎖無權限障礙。
  - **遷移紀錄管理**：`migration_admin` 為 `_prisma_migrations` 之 Owner，能正常讀取與寫入遷移歷史記錄。

---

## 三、檢核結論標記

| 檢核項目 | 判定結果 | 驗證依據標記 |
| :--- | :--- | :--- |
| 後端業務程式碼無 AuditLog UPDATE / DELETE | **完全無竄改或刪除邏輯** | 【已由原始碼確認】（`backend/src` 全域檢查） |
| `app_runtime` 遭阻斷 AuditLog UPDATE / DELETE / TRUNCATE | **資料庫層級 100% 阻斷** | 【已實際測試】（PG17.11 沙盒驗證） |
| 外鍵刪除使用者會將 AuditLog.userId 設為 NULL | **已確認外鍵約束觸發行為** | 【已實際測試】（PG17.11 沙盒驗證） |
| `app_runtime` 無法執行 DDL 或存取遷移表 | **完全隔離** | 【已由原始碼確認】（權限矩陣定義） |
| `migration_admin` 剝除 CREATEDB 且滿足 Migration DDL | **最小權限且功能相容** | 【已由原始碼確認】（Prisma 官方規範） |
