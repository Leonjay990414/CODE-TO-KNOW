# CODE TO KNOW｜Sequence 權限與最小權限審查報告
# PHASE 3C-4F-R14-C-2-2：序列預設權限與 UPDATE 授權專項審查

**文件編號**：C2K-DOC-DB-R14C22-SEQ-01  
**審查日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**審查性質**：本機唯讀架構與安全審查（未經授權禁止執行任何資料庫變更）  
**審查基準**：`schema.prisma`、全部 Migration SQL、`backend/src/` 源碼、R14-C-2-1 演練日誌  

---

## 一、審查動機與問題陳述

在 `PHASE 3C-4F-R14-C-2-1` 的沙盒演練中，Default Privileges 與現有授權腳本出現了以下權限配置：
```sql
-- R14-C-2-1 演練腳本中的配置：
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

然而，回溯 `R14-C-0` 與 `R14-C-0.5` 的原始規劃文件，原始設計之最小權限僅要求：
```sql
-- R14-C-0 原始設計：
GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

此處出現了非預期的 **`UPDATE` 權限** 授予。本報告針對 PostgreSQL 序列權限模型、Prisma ORM 機制及全專案代碼進行深入清查，評估是否應將 `UPDATE` 權限剔除以符合最小權限原則。

---

## 二、六大分析項目審查結果

### 1. 專案目前有哪些 Sequence？
**審查結果**：**目前專案中不存在任何 Sequence（數量為 0）**。
- **證據**：
  1. **Prisma Schema 全面清查**：
     清查 `backend/prisma/schema.prisma` 中全部 37 個業務模型，所有主鍵皆明確定義為：
     ```prisma
     id String @id @default(uuid())
     ```
     專案內無任何 `@default(autoincrement())` 或整數自增 ID。
  2. **Migration SQL 清查**：
     清查 `backend/prisma/migrations/` 下之兩次既有遷移：
     - `20261103000000_init/migration.sql`
     - `20261108000000_add_business_models/migration.sql`
     兩份 SQL 均無 `CREATE SEQUENCE`、`SERIAL` 或 `BIGSERIAL` 語法。
  3. **沙盒系統表查詢**：
     在 R14-C-2-1 步驟 7900 中，查詢資料庫物件統計：
     ```sql
     SELECT count(*) AS total_sequences FROM pg_sequences WHERE schemaname = 'public';
     -- 結果：0
     ```

---

### 2. Prisma 使用方式是否需要 Sequence 的 `UPDATE` 權限？
**審查結果**：**完全不需要**。
- **PostgreSQL 序列權限定義**：
  - `USAGE`：允許調用 `nextval()` 與 `currval()`，這是獲取下一個自增值所必需的權限。
  - `SELECT`：允許調用 `currval()` 以及透過 `SELECT * FROM sequence_name` 查看序列內部狀態。
  - `UPDATE`：允許調用 `setval()` 函數，直接篡改序列當前的值與是否已調用狀態（`is_called`）。
- **Prisma 運作機制**：
  在 Prisma ORM 中，當執行包含自增欄位的 `prisma.model.create()` 時，資料庫底層觸發的是 `nextval()`，只需 `USAGE` 權限；Prisma 在一般的執行期 DML 操作中，**絕不會**調用 `setval()`。

---

### 3. 是否有程式碼使用 `setval()` 或 `nextval()`？
**審查結果**：**全專案完全沒有任何程式碼使用 `setval()` 或 `nextval()`**。
- **原始碼檢索**：
  檢索 `backend/src/` 與 `scripts/` 下的所有檔案：
  ```powershell
  Get-ChildItem -Path "backend\src" -Recurse -File | Select-String -Pattern "setval|nextval"
  Get-ChildItem -Path "scripts" -Recurse -File | Select-String -Pattern "setval|nextval"
  ```
  兩次檢索結果皆為 `0 results`。

---

### 4. 是否存在其他必要的 Sequence 操作？
**審查結果**：**對於應用程式執行期角色 (`app_runtime`)，不存在任何需要 `UPDATE` 權限的操作**。
- `setval()` 通常僅在以下極少數管理情境中使用：
  - 資料庫大量資料匯入（Data Import / Restore）後重置序列計數器。
  - 遷移腳本（Migration）手動校正自增起點。
- 這些管理工作應由具備 DDL 權限的 `migration_admin` 或 DBA 帳號執行，絕不應下放給後端 API 執行期角色 `app_runtime`。

---

### 5. 是否可以移除 `UPDATE` 權限？
**審查結果**：**可以，且強烈建議必須立即移除**。
- 若授予 `app_runtime` 序列的 `UPDATE` 權限，一旦未來有新增自增序列，將帶來以下安全風險：
  - 若後端遭 SQL 注入，攻擊者可調用 `setval()` 將序列計數重置，導致後續插入操作發生主鍵衝突（Primary Key Collision / Duplicate Key Error），造成人為拒絕服務（DoS）。
- 移除 `UPDATE` 權限是落實最小權限原則（PoLP）之必要修正。

---

### 6. 移除 `UPDATE` 後是否會影響 Prisma 自動產生 ID？
**審查結果**：**完全不會影響**。
- 目前系統 100% 採用 UUIDv4，根本不依賴 Sequence。
- 即便未來引進整數自增欄位，Prisma 插入時依賴的也是 `USAGE` 權限，因此移除 `UPDATE` 對 Prisma 的新增操作零副作用。

---

## 三、最小權限修訂建議

在進入正式切換（R14-C-3）之前，正式權限 SQL 應修訂如下：

### 1. Default Privileges 修正
```sql
-- 修正前（過度授權）：
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;

-- 修正後（嚴格最小權限）：
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;
```

### 2. 現有物件授權修正
```sql
-- 修正前：
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

-- 修正後：
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

### 3. 受控回滾腳本同步修正
回滾腳本中收回預設權限的語句亦相應調整，確保切換與回滾的對稱性與嚴謹性。
