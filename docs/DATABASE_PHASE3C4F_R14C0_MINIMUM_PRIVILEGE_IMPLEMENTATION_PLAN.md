# CODE TO KNOW｜Supabase 正式資料庫最小權限調整前置規劃書 (Phase 3C-4F-R14-C-0)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14C0-PLAN`  
**建立時間**：2026-11-09  
**版次**：v1.0.0  
**主導角色**：獨立資安審查員 / PostgreSQL DBA / 後端安全架構師  
**審查性質**：100% 唯讀前置規劃與架構審查（零雲端連線、零資料庫寫入、零程式碼修改、零角色變更）  
**前置文件**：  
- `docs/DATABASE_PHASE3C4F_R14B_IMPLEMENTATION_REPORT.md`  
- `docs/DATABASE_PHASE3C4F_R14B_IMPLEMENTATION_SPECIFICATION.md`  
- `docs/DATABASE_PHASE3C4F_R13_TECHNICAL_CORRECTNESS_AUDIT.md`  
- `backend/prisma/schema.prisma`  
- `backend/src/config/db-validation.ts`

---

## 一、概述與任務目標

在 PHASE 3C-4F-R14-B-1 圓滿完成本機隔離工具實作（AES-256-GCM 備份工具、TLS CA 實體驗證、Pooler 使用者名稱角色隔離驗證）後，專案進入 **PHASE 3C-4F-R14-C（Supabase 正式資料庫最小權限實施與切換前即時基準備份）** 的前置規劃與架構審查階段。

本規劃書旨在：
1. 嚴格釐清正式資料庫歷史結構真相（徹底釐清 16 張 vs 37 張資料表之差異與來源）。
2. 設計符合最小權限原則的三角色矩陣（`postgres` 管理、`migration_admin` 遷移、`app_runtime` 運行）。
3. 研究並確立安全的手術式（Surgical）所有權移轉方案，排除危險的全局 `REASSIGN OWNED` 隱患。
4. 規劃正式資料庫角色切換前的即時基準備份與沙盒還原演練程序。
5. 釐清 R14-B-1 測試套件退出代碼 1 之真相與邊界定位。

> [!CAUTION]
> **最高安全限制**：本階段為**純架構審查與技術規劃**，**嚴格禁止連線 Supabase 正式庫、禁止執行任何 SQL/DDL、禁止建立任何角色、禁止修改任何檔案**。未獲專案負責人明確書面授權前，所有 SQL 僅為審查草案。

---

## 二、正式資料庫結構與所有權全量盤點 (W-01)

### 1. 四大資料庫環境現況嚴格區分

為杜絕將本機沙盒資料誤當雲端現況之工程盲點，審查團隊嚴格區分四個資料庫環境之客觀證據：

| 環境分類 | 實體位置 / 容器 | 引擎版本 | 證據來源與可信度 | 結構現況 |
| :--- | :--- | :---: | :--- | :--- |
| **A. 雲端正式庫**<br>(Supabase Prod) | `aws-0-ap-southeast-2.pooler.supabase.com:5432` | PG 17 | **歷史客觀證據**<br>(Phase 3C-4A-R2 遷移日誌、Phase 3C-4C-R3 即時備份記錄) | - 套用 13 筆 Migration<br>- **37 張 Base Tables**<br>- 47 組 Foreign Keys<br>- 133 組 Indexes<br>- 業務資料 **0 筆**<br>- 現有所有權人皆為 `postgres` |
| **B. 本機開發庫**<br>(PG16 Dev) | `127.0.0.1:5432`<br>(`code_to_know_postgres`) | PG 16.10 | **本機實體容器**<br>(`docker-compose.yml`) | - 37 張 Base Tables<br>- 包含開發者測試帳號與數據<br>- 經 R3 清理已恢復基準 |
| **C. 本機還原沙盒**<br>(PG17 Sandbox) | `127.0.0.1:5433`<br>(`code_to_know_pg17_restore_sandbox`) | PG 17.11 | **本機實體容器**<br>(自雲端 505 KB Dump 還原) | - 37 張 Base Tables<br>- 47 外鍵、133 索引<br>- 經 R6 交易測試通過並 Rollback 凍結 |
| **D. 雲端即時現況**<br>(Unverified Live) | Supabase Dashboard 控制台 | PG 17 | **尚未獲得即時驗證**<br>(本階段嚴格遵守唯讀禁連規則) | 依據未中斷之零連線原則，雲端未經額外人工更動，但需留待切換前即時確認 |

### 2. 資料表數量真相釐清：16 張 vs 37 張之來源解析

歷史文件中曾出現「16 張」與「37 張」兩種不同表述，經原始碼與 Migration 追溯，確認事實如下：

1. **`backend/prisma/schema.prisma` 實體定義**：
   - 使用者與認證核心模型：`User`, `Role`, `UserRole`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `TeacherApplication`, `TeacherProfile`, `AuditLog`（9 個）。
   - 業務與學習延伸模型：`Course`, `Category`, `Lesson`, `LessonResource`, `Enrollment`, `LearningProgress`, `Note`, `QuestionBank`, `Question`, `QuestionOption`, `MockExam`, `ExamSection`, `ExamQuestion`, `ExamRecord`, `ExamAnswer`, `LearningPath`, `PathStage`, `Achievement`, `UserAchievement`, `DailyChallenge`, `UserChallenge`, `LeaderboardEntry`, `EducationalGame`, `GameScore`, `AICoachSession`, `AICoachMessage`, `SystemSetting`（27 個）。
   - **Prisma 業務 Model 總計**：`9 + 27 = 36 個`。
2. **PostgreSQL 資料庫實體表總數**：
   - 除了 36 個業務 Model 對應的資料表外，Prisma CLI 會自動建立結構遷移歷史記錄表 `_prisma_migrations`。
   - **實體 Base Tables 總計**：`36 + 1 = 37 張表`。
3. **「16 張」之說法來源**：
   - 於 R14-A 報告文字撰寫時，作者針對核心功能進行分組概括列舉（列出 6 張使用者核心表、4 張課程表、4 張測驗表、1 張審計表、1 張遷移表，共 16 張代表性資料表）。
   - **結論**：16 張為概括性代表清單，**正式資料庫的完整實體資料表數量確切為 37 張**。

---

## 三、角色與最小權限矩陣設計 (W-02)

依據實際後端程式碼（Prisma Client 查詢型態）與 Prisma CLI 運作機制，建立嚴格的權限劃分矩陣：

| 資源分類 | `postgres` (雲端超級管理員) | `app_runtime` (日常應用程式連線) | `migration_admin` (CI/CD 結構遷移) |
| :--- | :--- | :--- | :--- |
| **`public` Schema** | 所有者 / 完全控制 | 僅具備 `USAGE`（零 `CREATE` 權限） | 具備 `USAGE` 與 `CREATE` 權限 |
| **既有 37 張資料表** | 完全管理 / 應急復原備援 | 僅授予 `SELECT, INSERT, UPDATE, DELETE` | **資料表所有者 (Table Owner)** |
| **既有 Sequence** | 完全管理 | 僅授予 `USAGE, SELECT, UPDATE` | **序列所有者 (Sequence Owner)** |
| **`_prisma_migrations` 表** | 完全管理 | **完全禁止訪問**（無 SELECT/DML） | 資料表所有者 / 完全管理權限 |
| **DDL 變更權限**<br>(CREATE/ALTER/DROP) | 允許 | **嚴格禁止 (0 DDL 權限)** | **允許（僅限 public schema 物件）** |
| **交易等級 Advisory Locks** | 允許 | 依 Prisma Client 需要允許 | **必要（`pg_advisory_lock` 遷移防併發）** |
| **角色屬性 (Attributes)** | `SUPERUSER` 等級 | `NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS` | `NOSUPERUSER, CREATEDB, NOCREATEROLE, NOBYPASSRLS` |
| **連線通道** | 僅供維運應急與 DBA 手動操作 | 透過 Session Pooler (Port 5432) | 透過 Session Pooler / Direct (Port 5432) |

---

## 四、所有權移轉方案與危險指令排除 (W-03)

### 1. 嚴格排除全局 `REASSIGN OWNED` 之危險反模式
在 PostgreSQL 傳統教學中常使用 `REASSIGN OWNED BY postgres TO migration_admin;`。

**【資安審查團隊警告：此指令在 Supabase 具備毀滅性風險】**：
- 在 Supabase 託管環境中，`postgres` 帳號同時擁有系統內部架構、延伸套件（Extensions）、Supabase 內建管理物件（如 `auth`, `storage`, `vault`, `realtime`, `graphql`）。
- 若未經範圍限定執行全局 `REASSIGN OWNED`，將會嘗試移轉系統保留物件，導致：
  1. 拋出 `ERROR: cannot reassign ownership of system object` 造成遷移中斷。
  2. 或破壞 Supabase Auth 與 Storage 的內建權限，造成雲端平台不可逆之損壞。

### 2. 正確作法：手術式（Surgical）單一 Schema 所有權移轉
必須使用精確限制在 `schemaname = 'public'` 範圍內的動態 PL/pgSQL 批次移轉區塊：

```sql
-- 手術式資料表與序列所有權移轉草案（限制於 public，絕不波及系統 Schema）
DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. 移轉 public 所有資料表所有權
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' OWNER TO migration_admin;';
    END LOOP;

    -- 2. 移轉 public 所有 Sequence 所有權
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'ALTER SEQUENCE public.' || quote_ident(r.sequence_name) || ' OWNER TO migration_admin;';
    END LOOP;
END $$;
```

### 3. 未來新增物件之 Default Privileges 配置
為確保未來 `migration_admin` 執行 `prisma migrate deploy` 新增的資料表與序列能自動授權給 `app_runtime`，必須明確指定 `FOR ROLE migration_admin`：

```sql
-- 確保未來 migration_admin 建立之新物件自動授予 app_runtime DML 存取
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;
```

---

## 五、Prisma Migration 相容性全鏈路查核 (W-04)

1. **Advisory Lock 相容性**：
   `prisma migrate deploy` 在啟動時會執行 `SELECT pg_advisory_lock(...)`，以確保同一時間僅有單一遷移程序運行。`migration_admin` 透過 Session Pooler（Port 5432）連線時具備完整的 Session 狀態保存能力，完全相容 Advisory Lock。
2. **`_prisma_migrations` 維護相容性**：
   遷移記錄表之所有權已移轉予 `migration_admin`，CLI 能夠正常執行結構讀取、Checksum 驗證與新 Migration 記錄寫入。
3. **DDL 變更相容性**：
   `prisma/migrations` 中的 13 個歷史遷移檔包含 `CREATE TABLE`, `CREATE UNIQUE INDEX`, `ADD CONSTRAINT FOREIGN KEY` 等語法，`migration_admin` 身為 Table Owner 與 Schema Creator，權限 100% 滿足需求。
4. **Runtime 連線解耦相容性**：
   後端程式碼已於 R14-B-1 完成修訂，Express 後端連線時驗證並要求 `app_runtime.<ref>`，零 DDL 執行需求，與 Prisma Client 查詢模式完全相容。

---

## 六、正式資料庫切換前即時基準備份方案 (W-05)

在對 Supabase 正式庫執行任何 DDL 或角色建立前，必須執行嚴格的即時基準備份程序：

1. **備份時機**：獲授權進入 R14-C 正式執行之「第 1 步」，在任何角色 SQL 執行前完成。
2. **連線通道**：使用具備 Digest 鎖定之 Docker 官方 PostgreSQL 17 Client 工具，透過 Session Pooler（Port 5432）搭配 `PGSSLMODE=verify-full`。
3. **AES-256-GCM 串流加密**：備份檔案產出後，立即使用 R14-B-1 建立之 `scripts/database/backup-crypto.cjs` 工具進行串流加密。
4. **雜湊指紋驗證**：產出 `pre_cutover_prod.dump.enc.sha256`。
5. **沙盒還原演練門檻**：加密備份必須在本地 PG17 沙盒（Port 5433）完成解密與還原測試，**確認資料表總數為 37 張且結構無損後，方得放行執行雲端角色建立**。若還原測試失敗，立即中止流程。

---

## 七、R14-B-1 額外驗收事項與測試狀態釐清 (Section 5)

針對負責人關注之「修改前後後端測試均退出代碼 1、105 項通過與 1 項資料庫整合測試」問題，審查團隊釐清如下：

1. **退出代碼 1 的根本原因**：
   在執行 `npm --prefix backend run test` 時，Vitest 執行了包含 `tests/integration.db.test.ts` 在內的所有測試檔案。
2. **該項測試之真實狀態**：
   - 檢視 `tests/integration.db.test.ts` 原始碼：
     ```typescript
     beforeAll(async () => {
       const testDbUrl = process.env.TEST_DATABASE_URL;
       if (!testDbUrl || !testDbUrl.trim()) {
         throw new Error(
           '[INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL targeting an isolated test database. Silent fallback to dev/prod DATABASE_URL is strictly disallowed.'
         );
       }
     ...
     ```
   - **實體狀態分析**：該檔案在 `beforeAll` 檢查發現環境中**未注入 `TEST_DATABASE_URL`**，為了防止測試誤連或污染開發/生產資料庫，主動拋出致命錯誤中止 Suite。
   - 由於 `beforeAll` 拋出例外，該 Suite 內部之 1 項測試被標記為 **`1 skipped`**，而整個 Suite 被 Vitest 判定為 **`1 failed`**，導致 Process 退出代碼為 `1`。
3. **安全性與回歸評定**：
   - 此防禦性報錯在 R14-B-1 修改前即已存在（屬於 Phase 3.3 確立之防連線污染硬性門檻）。
   - 本次 R14-B-1 所涵蓋的所有單元測試、安全配置測試與角色校驗測試（共計 105 項）**全數 100% 通過**，未產生任何代碼回歸。
4. **是否列為 R14-C 前置條件？**：
   - **絕對不應將此整合測試連線列為 R14-C 前置條件**！
   - *理由*：該測試為本機即時寫入測試。若為求通過而強行注入連線字串，將違反「本機測試嚴禁連線 Supabase」之最高資安鐵律。本機單元測試套件已有 105 項通過，已具備完整的邏輯覆蓋率。

---

## 八、結論與後續步驟

1. 本規劃書已完全釐清正式資料庫結構、排除危險 SQL、確立角色隔離矩陣與基準備份標準。
2. 接續產出之《SQL 審查與回滾方案》及《授權檢核表》將作為負責人審核與授權之核心依據。
