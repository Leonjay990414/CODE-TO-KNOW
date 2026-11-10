# CODE TO KNOW｜AuditLog 安全性與不可篡改權限邊界深度稽核報告
# 資料庫正式收尾 Phase 2.1：審計日誌 Append-Only 防護、外鍵級聯影響與權限隔離專項審查

**文件編號**：C2K-DOC-DB-PHASE21-AUDITLOG-AUDIT-01  
**審查日期**：2026-11-10  
**審查角色**：資深資料庫安全架構師 / 合規審查工程師  
**審查性質**：100% 唯讀安全專項稽核（架構與沙盒證據深度驗證）  
**審查基準**：
- `backend/prisma/schema.prisma`（`AuditLog` 模型與外鍵定義）
- `docs/DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md`（權限修訂）
- `docs/DATABASE_PHASE3C4F_R14C21_ROLE_PERMISSION_TEST_MATRIX.md`（沙盒實測 T-09 至 T-14）
- PostgreSQL 17 執行器（Executor）權限檢查流水線規格

---

## 一、審查目標與核心議題

審計日誌（`AuditLog`）是 CODE TO KNOW 平台追蹤使用者登入、身分變更、密碼重設與管理員審核行為的核心證據鏈。

本稽核專項確認六大核心問題：
1. `app_runtime` 是否具備寫入（INSERT）與查詢（SELECT）權限？
2. `app_runtime` 是否被絕對禁止修改（UPDATE）、單筆刪除（DELETE）與全表截斷（TRUNCATE）？
3. `app_runtime` 是否為 `AuditLog` 的擁有者？是否能透過其他角色繼承篡改權限？
4. `BYPASSRLS` 是否會破壞 `AuditLog` 的防篡改防線？
5. 外鍵設定 `ON DELETE SET NULL` 對 `AuditLog` 不可變性（Immutability）的真實衝擊與客觀事實。
6. `migration_admin` 的管理權限與 `app_runtime` 的應用程式權限是否徹底分離？

---

## 二、AuditLog 存取權限矩陣（Table ACL）

### 1. 權限配置 DDL 規範
依據正式最小權限切換 DDL：
```sql
-- 1. 將 AuditLog 擁有權移轉至 migration_admin
ALTER TABLE public."AuditLog" OWNER TO migration_admin;

-- 2. 授予 app_runtime 唯讀與追加權限
GRANT SELECT, INSERT ON TABLE public."AuditLog" TO app_runtime;

-- 3. 明確收回所有可能之修改與破壞性權限
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;
```

### 2. 角色權限對比驗證矩陣

| 操作類型 | 語法代表 | `app_runtime` 權限 | `migration_admin` 權限 | 資料庫強制檢查機制 |
| :--- | :--- | :---: | :---: | :--- |
| **SELECT** | `SELECT count(*) FROM "AuditLog";` | **允許 (t)** | 允許 (t) | 供後端管理者 API 查詢日誌。 |
| **INSERT** | `INSERT INTO "AuditLog" ...;` | **允許 (t)** | 允許 (t) | 供後端記錄登入、登出、註冊事件。 |
| **UPDATE** | `UPDATE "AuditLog" SET details = '...';` | **⛔ 拒絕 (f)** | 允許 (t) | **PostgreSQL 底層 Table ACL 強制阻斷**。 |
| **DELETE** | `DELETE FROM "AuditLog" WHERE ...;` | **⛔ 拒絕 (f)** | 允許 (t) | **PostgreSQL 底層 Table ACL 強制阻斷**。 |
| **TRUNCATE** | `TRUNCATE TABLE "AuditLog";` | **⛔ 拒絕 (f)** | 允許 (t) | **PostgreSQL 底層 Table ACL 強制阻斷**。 |

---

## 三、BYPASSRLS 與 Table ACL 的獨立性技術證明

有疑慮指出：「若 `app_runtime` 設定為 `WITH BYPASSRLS`，是否會因此能夠竄改或刪除 `AuditLog`？」

**結論：絕對不可能。兩者在 PostgreSQL 核心執行架構中屬於完全獨立的控制層級。**

### 1. PostgreSQL 執行器（Executor）的安全過濾流水線
```
[客戶端發送 UPDATE / DELETE 請求]
                 |
                 v
+--------------------------------------------------------------+
| 第一層：自主存取控制 (DAC / Table-level Privileges)           |
| 檢查函式：pg_class_aclcheck()                                |
| 檢查條件：是否有該操作之 Table Privilege (UPDATE / DELETE)   |
+--------------------------------------------------------------+
         |                                     |
    (無權限 / 被 REVOKE)                   (有權限)
         |                                     |
         v                                     v
  [直接拋出 ERROR:                     +---------------------------------------+
   permission denied for table         | 第二層：強制存取控制 (MAC / RLS)      |
   並立即終止交易！]                   | 檢查條件：是否受 pg_policies 過濾     |
                                       | 若有 BYPASSRLS 則在此層略過政策過濾   |
                                       +---------------------------------------+
```

### 2. 沙盒實測證據（R14-C-2-1 步驟 7973-7975）
在沙盒中，即使角色明確具備 `BYPASSRLS` 屬性，執行篡改指令：
```sql
SET ROLE app_runtime;
UPDATE "AuditLog" SET details = 'tampered' WHERE id = '...';
-- 執行結果：
-- ERROR: permission denied for table AuditLog

DELETE FROM "AuditLog" WHERE id = '...';
-- 執行結果：
-- ERROR: permission denied for table AuditLog

TRUNCATE TABLE "AuditLog";
-- 執行結果：
-- ERROR: permission denied for table AuditLog
```
這充分證明：**`BYPASSRLS` 僅在第二層生效，完全無法穿透第一層 DAC 被撤銷的權限。`AuditLog` 的防篡改防禦堅不可摧。**

---

## 四、外鍵級聯 ON DELETE SET NULL 的客觀事實與資安分析

在過去的討論中，有說法將 `AuditLog` 描述為「完全不可變更（100% Immutable）」。然而，經審核 Prisma Schema 與資料庫約束條件，**此描述並不精確，必須客觀澄清其行為機制**。

### 1. Schema 中的外鍵定義
在 [`backend/prisma/schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 第 162 行：
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  details   String?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
  ...
}
```

### 2. 資料庫層級的級聯變更事實
- **觸發機制**：
  若資料庫中執行了 `DELETE FROM "User" WHERE id = 'user_abc';`（物理刪除使用者），PostgreSQL 內建的外鍵觸發器會**自動將關聯的 `AuditLog.userId` 欄位更新為 `NULL`**！
- **沙盒實測實證（T-14）**：
  在 `PHASE 3C-4F-R14-C-2-1` 測試中，刪除測試 User 後：
  ```
  NOTICE: After user delete: userId = <NULL>
  ```
  這代表：**`AuditLog` 中的 `userId` 欄位並非在任何情況下都物理不可變。當母表 User 遭到物理刪除時，PostgreSQL 系統級觸發器會執行變更。**

### 3. 資安防範與補強措施
為了防止因為使用者被物理刪除而導致審計證據鏈失去身分關聯，CODE TO KNOW 採取了雙重防禦機制：
1. **業務層軟刪除原則（Soft-Delete）**：
   在 `User` 模型中包含 `deletedAt DateTime?` 欄位。後端在停用或移除使用者時，**一律執行軟刪除（`deletedAt = new Date()`），嚴禁執行物理 `DELETE FROM "User"`**。
2. **Details 快照備份原則（Snapshotting in Details）**：
   在後端日誌模組中（如 `auth.service.ts`、`admin.service.ts`），審計寫入的 `details` JSON 字串中均包含當事人的快照資訊：
   ```ts
   details: JSON.stringify({ email: user.email, applicantUserId: application.userId, applicantEmail: ... })
   ```
   即使未來因不可抗力導致 `userId` 被置為 `NULL`，`details` 欄位依然完整保留操作者的真實身分證據，確保證據鏈不可破壞。

---

## 五、角色所有權與權限隔離稽核

### 1. 所有權隔離
- `AuditLog` 的 Owner 為 `migration_admin`。
- `app_runtime` 絕非 Owner，亦未獲授權 `ALTER TABLE` 或變更欄位型別。

### 2. 角色繼承隔離
- `app_runtime` 未加入 `migration_admin` 或 `postgres` 的角色成員清單。
- 資料庫連線透過 Session Pooler 限縮在 `app_runtime` 權限範圍內，無法使用 `SET ROLE` 提權。

### 3. 職責分離（Separation of Duties, SoD）
- **`migration_admin`**：僅用於結構遷移（DDL），擁有維護表結構的權限，但不配置於生產 Web Service。
- **`app_runtime`**：僅用於生產 Web Service（DML），僅能寫入與讀取業務資料，對審計日誌完全喪失修改與刪除權力。

---

## 六、本項審查總結結論

1. `AuditLog` 在資料庫層級配置了嚴謹的 Table ACL，`app_runtime` 僅具備 `INSERT` 與 `SELECT` 權限。
2. `BYPASSRLS` 無法突破 Table ACL，審計日誌具備真實且可靠的 Append-Only 防護。
3. 客觀釐清了外鍵 `ON DELETE SET NULL` 的資料庫行為，並已透過軟刪除規範與 `details` 快照機制完善了證據鏈的不可篡改性。

**本項審查總體判定：【PASS】**
