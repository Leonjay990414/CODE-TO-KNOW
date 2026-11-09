# CODE TO KNOW｜RLS 與 BYPASSRLS 安全架構深度審查報告
# PHASE 3C-4F-R14-C-2-2：資料庫存取控制層級與權限隔離專項審查

**文件編號**：C2K-DOC-DB-R14C22-RLS-01  
**審查日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**審查性質**：本機唯讀架構與安全審查（未經授權禁止執行任何資料庫變更）  
**審查基準**：`schema.prisma`、全部 Migration SQL、R14-C-2-1 演練日誌、Supabase 官方規格  

---

## 一、審查背景與核心爭點

在 `PHASE 3C-4F-R14-C-2-1` 沙盒演練中，發現 Supabase 平台內建之 Event Trigger `ensure_rls` 會自動對所有新建資料表強制啟用 Row Level Security (`relrowsecurity = true`)。

演練中發現：當執行期角色 `app_runtime` 設定為 `NOBYPASSRLS` 時，即便已獲授權 Table 級別的 `SELECT` 權限，查詢結果亦為 0 筆，寫入操作則遭到拒絕。此現象引發以下重大架構問題：
1. `app_runtime` 是否必須授予 `BYPASSRLS`？
2. `BYPASSRLS` 是否會破壞最小權限原則？
3. `BYPASSRLS` 是否會導致 `AuditLog` 的不可篡改性（Append-Only）失效？
4. 是否能以明確的 RLS Policies 取代 `BYPASSRLS`？

本報告針對此八項關鍵問題進行嚴格的資料庫理論與實務審查。

---

## 二、八項核心審查問題逐項解答

### 1. 哪些資料表啟用了 RLS？
**審查結果**：**全數 37 張資料表皆啟用了 RLS**。
- **證據**：
  1. Supabase 雲端備份檔 `code_to_know_supabase_prod.dump` 內對所有 37 張業務資料表皆明確包含 `ALTER TABLE public."<TableName>" ENABLE ROW LEVEL SECURITY;`。
  2. 在 R14-C-2-1 沙盒還原後查詢 `pg_tables` 與 `pg_class.relrowsecurity`，37 張表（含 `User`、`AuditLog`、`Announcement`、`_prisma_migrations` 等）之 `relrowsecurity` 欄位值全部為 `true`。
  3. 資料庫存在系統觸發器：
     ```sql
     SELECT evtname, evtevent, evtfoid::regproc FROM pg_event_trigger;
     -- 結果：ensure_rls | ddl_command_end | rls_auto_enable
     ```
     該觸發器會在任何 DDL 建表指令完成後，自動執行 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`。

---

### 2. 哪些資料表存在 RLS Policies？
**審查結果**：**0 張資料表存在 RLS Policies**。
- **證據**：
  在 R14-C-2-1 演練步驟 7931 中，執行系統表查詢：
  ```sql
  SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
  FROM pg_policies 
  WHERE schemaname = 'public';
  ```
  查詢結果為 `(0 rows)`。目前雲端資料庫與 Prisma 遷移中，皆未宣告任何 `CREATE POLICY`。

---

### 3. 哪些資料表沒有 Policies？
**審查結果**：**現有全數 37 張資料表皆無任何 Policies**。
- 包含所有核心業務表（`User`、`Session`、`Role`、`Class`、`Question`、`ExamAttempt` 等）以及系統表（`AuditLog`、`_prisma_migrations`）。

---

### 4. 沒有 Policies 的資料表是否會阻擋 `app_runtime`？
**審查結果**：**是，必定遭到 PostgreSQL 核心完全阻斷（DEFAULT DENY ALL）**。
- **底層行為機制**：
  依照 PostgreSQL 官方規範（第 5.8 節 Row Security Policies）：
  > 當資料表啟用 RLS，但該表上未定義任何政策時，PostgreSQL 採取**預設拒絕（Default Deny）**原則。
  > - 對於 `SELECT` 操作：過濾所有資料列，查詢結果為 0 筆（靜默空集）。
  > - 對於 `INSERT`、`UPDATE`、`DELETE` 操作：拋出錯誤 `ERROR: new row violates row-level security policy for table "..."`。
  - **唯一例外**：資料表擁有者（Owner）、超級使用者（Superuser）或具備 `BYPASSRLS` 屬性之角色。
- **實測證據**：
  在 R14-C-2-1 步驟 7933 中，以 `postgres` 身分插入 1 筆 `User` 資料後：
  - `postgres` 查詢 `SELECT count(*) FROM "User";` -> 回傳 `1`。
  - 切換為 `SET ROLE app_runtime;`（當時具備 `NOBYPASSRLS`）後查詢：
    `SELECT count(*) FROM "User";` -> 回傳 `0`！
  - 證實未設定 Policies 之資料表會直接導致後端無法讀取或寫入任何資料。

---

### 5. 正式後端是否確實需要 `BYPASSRLS`？
**審查結果**：**是，在目前的應用程式架構下，後端連線角色確實需要 `BYPASSRLS`**。
- **架構原因**：
  1. **認證架構邊界**：CODE TO KNOW 的後端是基於 Node.js + Express + Prisma ORM 建構的獨立 API 伺服器，所有使用者身分驗證（JWT 驗證、RBAC 角色判定、多租戶資料隔離）皆在 Express 中間件（Middleware）與服務層（Service Layer）中完成。
  2. **Supabase 原生模式對照**：
     - Supabase 前端透過 PostgREST 直連資料庫時，使用的是 `anon` 或 `authenticated` 角色，依賴 JWT 中的 `auth.uid()` 配合 RLS Policy。
     - Supabase 官方提供給後端伺服器（Node.js / Python）存取資料庫的 `service_role`，其在資料庫層級的定義即為 `BYPASSRLS`。
  3. 若 `app_runtime` 設定為 `NOBYPASSRLS`，後端 API 伺服器一啟動，所有透過 Prisma 發出的資料庫查詢將全數回傳空陣列或寫入失敗，導致系統完全停擺。

---

### 6. 能否透過明確 RLS Policies 取代 `BYPASSRLS`？
**審查結果**：**理論上可行，但實務上具備嚴重隱患與架構缺陷，強烈不建議**。
- **替代方案評估**：
  若要維持 `NOBYPASSRLS`，唯一的做法是為 37 張表分別建立允許 `app_runtime` 的全通政策：
  ```sql
  CREATE POLICY "app_runtime_all" ON public."User" TO app_runtime USING (true) WITH CHECK (true);
  ```
- **缺點與隱患**：
  1. **效能損耗 (Performance Overhead)**：PostgreSQL 查詢規劃器（Planner）在處理啟用 RLS 的表時，即便條件為 `USING (true)`，仍會對每個子查詢與 JOIN 節點附加額外的 RLS 過濾子樹，增加查詢規劃與執行延遲。
  2. **遷移脆弱性 (Migration Fragility)**：未來 Prisma Migration 新增資料表時，Supabase 的 `ensure_rls` Event Trigger 會自動啟用新表的 RLS，但**不會**自動為 `app_runtime` 建立 Policy。這將導致每一次線上 Migration 套用後，後端在新表上立刻發生 RLS 存取阻斷，直到手動執行 SQL 補上 Policy 為止，極易造成維運中斷。
  3. **功能等價性**：針對 `app_runtime` 建立 `USING (true)` 的 Policy，其在安全授權上的實質效果與 `BYPASSRLS` 完全相同，卻帶來維護負擔與效能劣化。

---

### 7. `BYPASSRLS` 是否會影響既有 `AuditLog` 權限保護？
**審查結果**：**絕對不會！兩者屬於不同的安全控制層，互不干擾**。
- **資料庫安全控制層級切分**：
  ```
  +--------------------------------------------------------------+
  | 第一層：自主存取控制 (DAC / Table-level Privileges)           |
  | 檢查項目：GRANT SELECT, INSERT / REVOKE UPDATE, DELETE, TRUNCATE |
  | -> 若此層拒絕，直接中斷執行，根本不會進入第二層！            |
  +--------------------------------------------------------------+
                                | (通過 Table 權限檢查後)
                                v
  +--------------------------------------------------------------+
  | 第二層：強制存取控制 (MAC / Row Level Security Policies)      |
  | 檢查項目：BYPASSRLS 屬性 / pg_policies 規則                    |
  | -> 僅負責「哪些列 (Rows)」可見，無法越權執行被 REVOKE 的操作！ |
  +--------------------------------------------------------------+
  ```
- **實務驗證證據**：
  在 R14-C-2-1 步驟 7973-7975 中，對 `app_runtime` 設定 `BYPASSRLS` 後進行負向安全測試：
  - `UPDATE "AuditLog" SET details = 'hacked';`
  - 執行結果：`ERROR: permission denied for table AuditLog`
  - 理由：`REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM app_runtime;` 屬於第一層（Table ACL），PostgreSQL 核心在此層即判定無權限並直接中斷，`BYPASSRLS` 根本無法繞過 Table 級別的權限拒絕。
  - 同理，`REVOKE ALL ON "_prisma_migrations" FROM app_runtime;` 亦受到第一層絕對保護。

---

### 8. 如何避免過度授權（Privilege Escalation）？
**審查結果**：
透過嚴格的權限邊界配置，確保 `app_runtime` 即便具備 `BYPASSRLS`，依然處於最小權限約束中：
1. **系統級權限剝奪**：
   `NOCREATEDB`, `NOCREATEROLE`, `NOSUPERUSER`，且不具備 `REPLICATION`。
2. **DDL 權限剝奪**：
   `REVOKE CREATE ON SCHEMA public FROM app_runtime;`，確保無法建立、修改、刪除任何資料表或索引。
3. **敏感系統表完全隔離**：
   `REVOKE ALL ON TABLE public."_prisma_migrations" FROM app_runtime;`。
4. **審計日誌只寫防護**：
   `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;`。
5. **連線隔離**：
   僅透過 Transaction Pooler / Session Pooler 以特定受控帳號登入。

---

## 三、正式環境建議方案

針對未來正式環境切換（R14-C-3），提出以下修訂架構：

1. **角色屬性定義**：
   ```sql
   -- 遷移管理角色：擁有 DDL 權限，但不需 BYPASSRLS（身為 owner 自動具備完全存取）
   CREATE ROLE migration_admin WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;

   -- 應用執行期角色：擁有業務表 DML，配置 BYPASSRLS 避開 Supabase 自動空 Policy 阻斷
   CREATE ROLE app_runtime WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER BYPASSRLS;
   ```
2. **切換腳本備註**：
   在正式切換 SQL 中明確標記注釋，說明 `BYPASSRLS` 係針對 Supabase `ensure_rls` 特性之架構必要配置，並已於 R14-C-2-1 實測證明不影響 Table ACL 及 `AuditLog` 不可篡改性。
