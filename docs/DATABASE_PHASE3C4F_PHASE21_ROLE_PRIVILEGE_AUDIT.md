# CODE TO KNOW｜PostgreSQL 角色權限邊界審查報告
# 資料庫正式收尾 Phase 2.1：角色權限、物件所有權與系統特權獨立稽核

**文件編號**：C2K-DOC-DB-PHASE21-ROLE-AUDIT-01  
**審查日期**：2026-11-10  
**審查角色**：資深 PostgreSQL DBA / 資料庫資安架構師  
**審查性質**：100% 唯讀靜態架構與 DDL 規範稽核（未連線雲端、未修改資料庫、零寫入操作）  
**審查基準**：
- `docs/DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md`
- `docs/DATABASE_PHASE3C4F_R14C05_PERMISSION_MATRIX_FINAL.md`
- `docs/DATABASE_PHASE3C4F_R14C06_RUNTIME_PERMISSION_FINAL_AUDIT.md`
- `docs/DATABASE_PHASE3C4F_R14C21_ROLE_PERMISSION_TEST_MATRIX.md`
- `docs/DATABASE_PHASE3C4F_R14C22_SEQUENCE_PRIVILEGE_REVIEW.md`
- PostgreSQL 17 核心安全性規格手冊

---

## 一、審查範疇與重要原則聲明

本文件針對 CODE TO KNOW 規劃於 Supabase 正式庫實施的最小權限角色體系進行深層安全稽核，特別審查執行期角色 `app_runtime` 與遷移管理角色 `migration_admin` 的權限邊界。

> [!IMPORTANT]
> **環境邊界嚴格聲明**：
> 先前在 `PHASE 3C-4F-R14-C-2-1` 取得的測試成果，**僅代表本機 Docker PG17.11 隔離沙盒容器中的驗證證據**。
> 目前 Supabase 正式雲端資料庫**尚未建立任何自訂角色、尚未轉移物件擁有權、亦尚未執行任何 GRANT/REVOKE**。本報告基於正式 DDL 腳本與沙盒複核結果進行架構級稽核。

---

## 二、執行期角色（app_runtime）權限深度稽核

### 1. 物件所有權（Object Ownership）檢查
- **稽核項目**：`app_runtime` 是否為資料表、Schema、Enum、Sequence 或任何資料庫物件的 Owner？
- **審查證據**：
  在所有權移轉 DDL 中（`R14C05_FINAL_SQL_SECURITY_REVIEW.md` 第 99-130 行）：
  ```sql
  -- 所有 37 張資料表轉移至 migration_admin
  ALTER TABLE public."<TableName>" OWNER TO migration_admin;
  -- 所有自訂 Enum 類型轉移至 migration_admin
  ALTER TYPE public."AnnouncementStatus" OWNER TO migration_admin;
  ```
  `app_runtime` 從未被指派為任何資料庫物件的擁有者。
- **安全意涵**：
  在 PostgreSQL 中，資料表的 Owner 擁有超越一般權限的最高控制權（如強制略過 RLS、執行 `DROP TABLE`、`ALTER TABLE`、變更約束條件等）。`app_runtime` 絕非 Owner，因此受制於所有 DAC（自主存取控制）與結構約束。
- **判定結果**：**PASS**

---

### 2. 系統級特權（Superuser & Administrative Privileges）檢查
- **稽核項目**：`app_runtime` 是否具備 `SUPERUSER`、`CREATEROLE`、`CREATEDB`、`REPLICATION` 等系統級特權？
- **審查證據**：
  角色建立 DDL 明確宣告：
  ```sql
  CREATE ROLE app_runtime WITH 
      NOLOGIN 
      NOSUPERUSER 
      NOCREATEDB 
      NOCREATEROLE 
      NOINHERIT        -- (或透過特定登入帳號繼承最小權限)
      BYPASSRLS;
  ```
  沙盒實測中（`T-05`, `T-17`, `T-18`）：
  - 嘗試建表：`ERROR: permission denied for schema public`
  - 嘗試建庫：`ERROR: permission denied to create database`
  - 嘗試建角色：`ERROR: permission denied to create role`
- **安全意涵**：完全不具備任何管理員或超級使用者特權，無法提升權限，亦無法在資料庫內建立後門帳號。
- **判定結果**：**PASS**

---

### 3. BYPASSRLS 屬性專項檢查
- **稽核項目**：`app_runtime` 配置 `BYPASSRLS` 是否會造成無法挽回的特權擴張？
- **審查證據**：
  - PostgreSQL 核心規範第 5.8 節明訂：`BYPASSRLS` 僅使角色在執行查詢時免於經過 Row-Level Security 政策過濾。
  - `BYPASSRLS` **完全不影響自主存取控制（DAC / Table ACL）**。如果資料表被 `REVOKE UPDATE`，即使擁有 `BYPASSRLS`，發出 `UPDATE` 依然會被資料庫核心立即拋出 `permission denied` 拒絕。
  - 沙盒實測步驟 7973-7975 中，對設定了 `BYPASSRLS` 的 `app_runtime` 執行 `UPDATE "AuditLog"`，回傳：
    `ERROR: permission denied for table AuditLog`。
- **安全意涵**：`BYPASSRLS` 僅消除了 Supabase `ensure_rls` Event Trigger 造成的「空 Policy 預設阻斷全表（DEFAULT DENY ALL）」死結，並未賦予任何額外的 DDL、Schema 或未授權表的存取能力。
- **判定結果**：**PASS**

---

### 4. 角色繼承與 SET ROLE 提權檢查
- **稽核項目**：`app_runtime` 是否可能透過角色繼承取得額外高權限？是否能執行 `SET ROLE` 切換至 `migration_admin` 或 `postgres`？
- **審查證據**：
  - PostgreSQL 角色切換規範：角色 A 僅能在被明確授予角色 B 的成員資格（`GRANT B TO A`）時，才能執行 `SET ROLE B`。
  - 經檢查全套 DDL，**從未執行 `GRANT migration_admin TO app_runtime`，亦未執行 `GRANT postgres TO app_runtime`**。
  - 當 `app_runtime` 嘗試執行：
    ```sql
    SET ROLE migration_admin;
    -- 或
    SET ROLE postgres;
    ```
    PostgreSQL 核心將拋出：`ERROR: permission denied to set role "migration_admin"`。
- **判定結果**：**PASS**

---

## 三、遷移管理角色（migration_admin）權限邊界稽核

### 1. 權限精確化狀態
- **`NOSUPERUSER`**：**PASS**（非超級使用者，受限於 public schema）。
- **`NOCREATEDB`**：**PASS**（在 R14-C-0.5 中正式移除 `CREATEDB`，杜絕任意建庫風險）。
- **`NOCREATEROLE`**：**PASS**（無法自行建立或竄改角色）。
- **`NOBYPASSRLS`**：**PASS**（身為 Table Owner 自動對自身物件擁有完全權限，不需亦不具備全域 BYPASSRLS）。
- **`CREATE ON SCHEMA public`**：**PASS**（允許執行 Prisma Migration 建表、加索引、改欄位所必須之權限）。
- **Advisory Lock 權限**：**PASS**（允許執行 `pg_advisory_lock`，避免多個 migration 同步執行發生競爭）。

### 2. 與執行期隔離
- `migration_admin` 僅在 CI/CD 部署或維運人員執行 `prisma migrate deploy` 時使用，其連線字串**嚴禁配置於 Render 執行期 Web Service 的環境變數中**。
- 判定結果：**PASS**

---

## 四、物件層級權限（Table-Level ACL）深度稽核

| 資料庫物件 / 標的 | `app_runtime` 規劃權限 | `migration_admin` 規劃權限 | 安全隔離機制與驗證狀態 | 判定 |
| :--- | :---: | :---: | :--- | :---: |
| **一般業務表（36 張）** | `SELECT, INSERT, UPDATE, DELETE` | `ALL (Owner)` | 滿足後端業務 CRUD 需求；無 DDL 權限。 | **PASS** |
| **審計日誌 (`AuditLog`)** | `SELECT, INSERT`<br>*(嚴格收回 UPDATE, DELETE, TRUNCATE)* | `ALL (Owner)` | 資料庫第一層 DAC 硬性保證 Append-Only 不可篡改。 | **PASS** |
| **遷移歷史 (`_prisma_migrations`)** | **無權限（REVOKE ALL）** | `ALL (Owner)` | 防止執行期後端洩漏或竄改遷移歷史。 | **PASS** |
| **公共綱要 (`public` Schema)** | `USAGE`<br>*(嚴格收回 CREATE)* | `USAGE, CREATE` | `app_runtime` 無法新建任何物件；僅管理者可 DDL。 | **PASS** |
| **序列物件 (`Sequences`)** | `USAGE, SELECT`<br>*(嚴格排除 UPDATE)* | `ALL (Owner)` | 消除 `setval()` 碰撞 DoS 風險。 | **PASS** |
| **自訂 Enum (`AnnouncementStatus`)** | `USAGE` | `Owner` | 支援欄位讀寫，無權修改 Enum 定義。 | **PASS** |

---

## 五、沙盒驗證 vs 正式環境狀態核對

| 項目 | 本機 Docker PG17 沙盒狀態 | Supabase 正式雲端現況 | 說明與後續動作 |
| :--- | :---: | :---: | :--- |
| **角色存在狀態** | `app_runtime`, `migration_admin` 已建置測試完畢並受控刪除 | **尚未建立** | 待本階段審查通過並取得正式授權後執行。 |
| **物件 Owner 移轉** | 曾在測試庫中完成轉移並驗證成功 | **目前仍為 postgres** | 待執行切換 DDL。 |
| **AuditLog 權限** | 實測證實 UPDATE/DELETE 被嚴格拒絕 | **目前尚未配置 ACL** | 待執行切換 DDL。 |
| **RLS 啟用狀態** | 37 張表全開，0 Policies | **37 張表全開，0 Policies** | 由 Supabase 內建 Event Trigger 觸發。 |

---

## 六、本項審查總結結論

經全量比對角色屬性、系統特權、物件擁有權與 DAC 存取清單：
1. `app_runtime` 權限嚴格限制在業務表 DML，無任何 DDL、建庫、建角色或提權途徑。
2. `BYPASSRLS` 僅具備繞過列安全政策功能，無法擴張至任何被 `REVOKE` 的操作。
3. `migration_admin` 與 `app_runtime` 具備清楚的職責分離（SoD）。

**本項審查總體判定：【PASS】**
