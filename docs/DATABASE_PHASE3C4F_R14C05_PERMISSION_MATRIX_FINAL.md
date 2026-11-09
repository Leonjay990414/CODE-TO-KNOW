# CODE TO KNOW｜Supabase 正式庫最終角色與權限矩陣規範 (Phase 3C-4F-R14-C-0.5)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14C05-MATRIX`  
**建立時間**：2026-11-09  
**版次**：v1.0.0  
**主導角色**：獨立資安審查員 / PostgreSQL DBA / 後端安全架構師  
**審查性質**：100% 唯讀最終權限規格確認（零雲端連線、零角色建立、零代碼異動）  
**前置基準**：`docs/DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md`

---

## 一、概述與核心設計原則

本矩陣為 CODE TO KNOW 生產環境 PostgreSQL 資料庫的**最終權限架構標準**。
本規範依據 R14-C-0.5 複核結果，將 `migration_admin` 移除過度寬鬆之 `CREATEDB`，補齊 `AnnouncementStatus` 自訂 Enum 類型所有權，並將 `AuditLog` 設為不可篡改之 Append-Only 模式。

### 核心原則：
1. **最小權限原則 (Least Privilege)**：僅授予各角色完成本職工作所需的絕對最小權限。
2. **職責分離原則 (Separation of Duties)**：
   - `app_runtime`：僅負責線上業務查詢與寫入，**0 DDL 權限**，禁止修改遷移記錄表與審計表記錄。
   - `migration_admin`：僅負責 CI/CD 結構變更與所有權管理，日常 API 嚴禁使用。
   - `postgres`：雲端最高管理員，僅作為災害復原與應急維運備援。

---

## 二、三角色屬性與連線通道最終定義

| 角色名稱 | 登入屬性 (Attributes) | 密碼管理規範 | 允許連線通道 | 角色用途定位 | 證據層級 |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **`postgres`** | `SUPERUSER` 等級<br>(Supabase 管理者) | 獨立安全密碼庫保存，切換後從應用伺服器完全撤除 | Session Pooler (5432) / 應急維運 | 災害復原、應急排障、手動維運 | **[已由專案代碼證實]** |
| **`migration_admin`** | `LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS` | 高強度隨機密鑰，僅注入 CI/CD 遷移管線 | Session Pooler (5432) / Direct (5432) | Prisma Migration 結構部署專用 | **[已由架構審查證實]** |
| **`app_runtime`** | `LOGIN, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOBYPASSRLS` | 高強度隨機密鑰，僅注入 Render 生產後端服務 | Session Pooler (5432) | Express 後端 API 日常查詢與交易專用 | **[已由代碼與測試證實]** |

---

## 三、Schema 與資料庫物件最終權限矩陣

| 資料庫物件 / 資源 | `postgres` (管理備援) | `migration_admin` (結構遷移) | `app_runtime` (線上運行) | 備註與安全防護 | 證據層級 |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **`postgres` 資料庫** | `CONNECT` | `CONNECT` | `CONNECT` | 允許連線 | **[已由代碼證實]** |
| **`public` Schema** | Owner (所有者) | `USAGE, CREATE` | `USAGE` (零 CREATE) | 阻斷 app_runtime 建立任意物件 | **[已由代碼證實]** |
| **系統 Schemas**<br>(`auth`, `storage`, `vault` 等) | 管理者 | **禁止存取** | **禁止存取** | 手術式隔離，絕不跨 Schema 授權 | **[平台官方規範]** |
| **36 張業務資料表**<br>(`User`, `Course` 等) | 管理者 | **Table Owner (所有者)** | `SELECT, INSERT, UPDATE, DELETE` | 支援線上學習平台所有業務功能 | **[已由代碼與測試證實]** |
| **`AuditLog` 表**<br>(系統審計日誌) | 管理者 | **Table Owner (所有者)** | **`SELECT, INSERT`**<br>*(禁止 UPDATE/DELETE/TRUNCATE)* | **Append-Only 不可篡改防禦**，杜絕日誌銷毀 | **[資安規範要求]** |
| **`_prisma_migrations` 表**<br>(遷移歷程記錄) | 管理者 | **Table Owner (所有者)** | **完全禁止訪問**<br>*(零權限)* | 防止線上運行時期竄改遷移校驗雜湊 | **[已由代碼與測試證實]** |
| **自增 Sequence 序列** | 管理者 | **Sequence Owner (所有者)** | `USAGE, SELECT, UPDATE` | 供 ID 自增與 setval 調用 | **[已由代碼證實]** |
| **自訂 Enum 類型**<br>(`AnnouncementStatus`) | 管理者 | **Type Owner (所有者)** | `USAGE` | 允許讀取與寫入對應列舉值 | **[已由遷移 SQL 證實]** |
| **Advisory Locks**<br>(`pg_advisory_lock`) | 允許 | **允許 (Migration 必要)** | 依客戶端需要允許 | 遷移並發保護（需 Session 模式） | **[已由專案決策證實]** |
| **DDL 變更權限**<br>(CREATE/ALTER/DROP) | 允許 | **允許 (僅限 public 物件)** | **嚴格禁止 (0 DDL)** | 徹底阻斷線上 SQL 注入毀滅資料庫 | **[已由代碼與測試證實]** |

---

## 四、細部資料表權限劃分清單 (37 張表全量查核)

| 資料表類別 | 資料表名稱清單 | `app_runtime` 允許操作 | `migration_admin` 角色地位 |
| :--- | :--- | :---: | :---: |
| **認證與使用者 (8 表)** | `User`, `Role`, `UserRole`, `UserProfile`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `TeacherApplication` | `SELECT, INSERT, UPDATE, DELETE` | Table Owner |
| **審計與安全 (1 表)** | **`AuditLog`** | **`SELECT, INSERT` (嚴格禁止 UPDATE / DELETE)** | Table Owner |
| **遷移核心 (1 表)** | **`_prisma_migrations`** | **無任何權限 (REVOKE ALL)** | Table Owner |
| **課程與學習 (7 表)** | `Course`, `Category`, `Lesson`, `LessonResource`, `Enrollment`, `LearningProgress`, `Note` | `SELECT, INSERT, UPDATE, DELETE` | Table Owner |
| **測驗與題庫 (7 表)** | `QuestionBank`, `Question`, `QuestionOption`, `MockExam`, `ExamSection`, `ExamQuestion`, `ExamRecord`, `ExamAnswer` | `SELECT, INSERT, UPDATE, DELETE` | Table Owner |
| **遊戲與社群 (6 表)** | `LearningPath`, `PathStage`, `Achievement`, `UserAchievement`, `DailyChallenge`, `UserChallenge` | `SELECT, INSERT, UPDATE, DELETE` | Table Owner |
| **排行榜與 AI (4 表)** | `LeaderboardEntry`, `EducationalGame`, `GameScore`, `AICoachSession`, `AICoachMessage`, `SystemSetting` | `SELECT, INSERT, UPDATE, DELETE` | Table Owner |

---

## 五、執行前狀態確認聲明

1. **已由程式碼與測試證實**：
   - 後端代碼（`db-validation.ts`）已於 R14-B-1 完成修訂並通過測試，強制要求 Runtime 僅能使用 `app_runtime`，阻斷 `postgres` 與 `migration_admin`。
2. **必須在正式資料庫確認**：
   - 上述權限矩陣目前為**技術規範標準**。在專案負責人授權執行 R14-C 正式 DDL 前，Supabase 雲端資料庫尚未建立此二角色，現有物件仍由 `postgres` 擁有。
