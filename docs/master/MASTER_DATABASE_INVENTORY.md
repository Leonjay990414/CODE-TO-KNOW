# CODE TO KNOW｜第 0 波・第一批：全專案資料庫盤點與資料來源對照表
# (MASTER_DATABASE_INVENTORY.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-DATABASE-INVENTORY  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**盤點範圍**：PostgreSQL 17, Supabase, `backend/prisma/schema.prisma`, `backend/src/config/db-validation.ts`, 前端儲存機制。

---

## 1. 資料庫連線環境與 AUTH-03 安全隔離現況 (Section G 審查)

| 資料庫環境 | 連線主機 (Host) | 連線埠號 | 目標資料庫名 | 執行角色 (Role) | 目前安全隔離狀態 | 驗證證據與安全限制 |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **本機開發庫 (DEV)** | `localhost` / `127.0.0.1` | 5432 / 5433 | `code_to_know` | `postgres` | **隔離受控 (可離線使用)** | 僅供本機 Docker PostgreSQL 17 開發測試，無生產個資 |
| **離線測試庫 (TEST)** | `localhost` / `127.0.0.1` | 5432 / 5434 | `code_to_know_test` | `c2k_test_app_runtime` | **隔離受控 (測試專用)** | 供自動化測試隔離執行，測試完成即重設 |
| **雲端正式庫 (PROD)** | `aws-0-ap-southeast-2.pooler.supabase.com` | 5432 / 6543 | `postgres` | `app_runtime` (執行期)<br>`migration_admin` (遷移期) | **嚴格封鎖 (BLOCKED / NOT VERIFIED)** | **AUTH-03 策略保護**：未經使用者明確授權前，禁止任何寫入、連線或 Migration 操作 |

> **最高安全守則**：
> 1. 嚴禁在 Production Runtime 程式碼中使用超級使用者身分 (`postgres`)。
> 2. `migration_admin` 角色僅限於 Prisma Migration 管線，嚴禁流入 Web API。
> 3. 目前雲端 Supabase 連線處於未連線之安全隔離狀態，標示為 **BLOCKED / NOT VERIFIED**。

---

## 2. 全系統資料來源對照矩陣 (Data Source Mapping Table)

系統為確保離線展示與正式雲端營運之相容性，目前各功能資料來源分類如下：

| 功能業務領域 | 實際資料來源 | 儲存載體與 Key | 是否已串接後端 DB | 離線展示模式降級行為 | 狀態判定 |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **使用者認證與身分** | **PostgreSQL (Local) / 後端 API** | `User`, `Role`, `UserRole`, `Session` 表 | 是 (後端完整) | `api.ts` 自動切換至 `ctk_demo_user` (SessionStorage) | **PASS** |
| **教師身分審核** | **PostgreSQL (Local) / 後端 API** | `TeacherApplication`, `TeacherProfile` 表 | 是 (後端完整) | `api.ts` 自動切換至 `ctk_demo_teacher_app` | **PASS** |
| **班級與學員名冊** | **PostgreSQL (Local) / 後端 API** | `Class`, `ClassEnrollment` 表 | 是 (後端完整) | `api.ts` 自動切換至 `ctk_demo_enrollments` | **PASS** |
| **系統審計日誌** | **PostgreSQL (Local) / 後端 API** | `AuditLog` 表 (去識別化脫敏) | 是 (後端完整) | 降級為模擬日誌陣列 | **PASS** |
| **學科 674 題題庫** | **靜態 JSON (Static JSON)** | `officialTheoryQuestionBank.json` | 否 (前端直接加載) | 離線直接載入官方全真題庫 | **PASS** |
| **術科 104301~05 題組** | **靜態程式碼/資料庫 (Code/Static)** | `unifiedPracticalCurriculumData.ts`, `data/` | 否 (前端直接加載) | 完整 5 大題組單元與沙盒步驟 | **PASS** |
| **學生刷題與模擬考** | **本地儲存 (localStorage)** | `code_to_know_learning_progress`, `mock_exam_*` | 否 (後端有 Schema, 待接 API) | 本地持久化保存 | **PROTOTYPE** |
| **錯題本與題目收藏** | **本地儲存 (localStorage)** | `code_to_know_wrong_questions`, `study_tools_*`| 否 (後端有 Schema, 待接 API) | 本地持久化保存 | **PROTOTYPE** |
| **五大遊戲進度星級** | **本地儲存 (localStorage)** | `code_to_know_game_progress`, `game_achievements`| 否 (待接 API) | 本地結算通關星級與積分 | **PASS (本地)** |
| **教師遊戲作業派發** | **本地儲存原型 (localStorage)** | `code_to_know_teacher_game_tasks` (具班級隔離) | 否 (後端有 ClassAssignment, 待接)| 依據目前班級儲存指派作業 | **PARTIAL (70%)** |
| **管理員遊戲全域配置** | **本地儲存原型 (localStorage)** | `code_to_know_admin_game_configs` (全域開關) | 否 (待後端系統配置表) | 本地覆寫遊戲難度與關卡開關 | **PARTIAL (70%)** |
| **AI 助教對話歷史** | **記憶體/擬真兜底 (Fallback Engine)**| `aiFallbackEngine.ts` 擬真生成 | 否 (後端有 AIChatSession, 待接 LLM)| 離線自動依學術科關鍵字生成提示 | **PROTOTYPE** |
| **系統公告與通知** | **本地儲存/待接 (localStorage)** | `code_to_know_notifications` | 否 (後端有 Announcement, 待接 API) | 本地預載通知 | **PARTIAL** |

---

## 3. Prisma 實體模型完整盤點 (36 Models & 1 Enum)

經讀取 `backend/prisma/schema.prisma`，全系統模型定義完整，依 7 大業務領域分類：

### 1. 認證、使用者與授權核心 (7 Models)
- `User`: 核心使用者帳號，含 email, passwordHash, status, emailVerifiedAt。
- `Role`: 角色主表 (STUDENT, TEACHER, ADMIN)。
- `UserRole`: 使用者與角色多對多關聯表。
- `UserProfile`: 個人資料表 (學號、暱稱、頭像、手機、偏好設定)。
- `Session`: 使用者登入 Session 與 Refresh Token 追蹤。
- `EmailVerificationToken`: 信箱驗證專用一次性 Token。
- `PasswordResetToken`: 忘記密碼專用一次性 Token。

### 2. 審查、稽核與系統公告 (5 Models & 1 Enum)
- `TeacherApplication`: 教師資格申請表 (學校、科目、證書、審查狀態)。
- `TeacherProfile`: 經核准之合格教師個人設定檔。
- `AuditLog`: 系統安全性與高權限操作審計追蹤紀錄。
- `Announcement`: 平台全域公告通知 (含列舉狀態 `AnnouncementStatus`)。
- `AnnouncementRead`: 使用者閱讀公告記錄。
- `enum AnnouncementStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`。

### 3. 班級教學與作業管理 (3 Models)
- `Class`: 教師建立之班級實體 (含唯一 6 碼 high-entropy joinCode)。
- `ClassEnrollment`: 學生選課加入班級關聯表。
- `ClassAssignment`: 班級作業派發 (含截止日、關卡代碼與星級目標)。

### 4. 學科題庫、檢定科目與標籤 (6 Models)
- `Certification`: 檢定證照代碼 (如 17300 網頁設計丙級)。
- `Subject`: 檢定科目/工作項目模組。
- `Question`: 學科題庫題目實體 (代碼、題幹、單選/複選題型)。
- `QuestionOption`: 題目選項實體 (1~4 選項內容與正確性)。
- `QuestionTag`: 題目知識點標籤 (HTML, CSS, JS 等)。
- `QuestionTagRelation`: 題目與標籤多對多對應表。

### 5. 學習進度、錯題與模擬測驗 (8 Models)
- `CertificationEnrollment`: 學生報考/選修證照紀錄。
- `UnitProgress`: 學生各單元完成度與正確率統計。
- `WrongQuestionRecord`: 個人錯題本 (記錄錯誤次數與重練狀態)。
- `QuestionBookmark`: 題目重點收藏標記。
- `StudyTimeLog`: 每日學習時長與活躍時段分析。
- `ExamPaper`: 模擬試卷實體 (80 題隨機抽卷模組)。
- `ExamAttempt`: 學生測驗歷程 (總分、耗時、成績)。
- `ExamAnswerSnapshot`: 測驗作答快照 (學生答案與正確答案對比)。

### 6. 術科題組學習與沙盒 (4 Models)
- `PracticalTask`: 官方術科題組實體 (104301~104305 五大官方題組)。
- `PracticalStep`: 題組步進單元與驗證指標。
- `PracticalProgress`: 學生術科題組進度與最新代碼快照。
- `PracticalStepProgress`: 各步驟檢查點完成狀態。

### 7. AI 智慧輔助與弱點分析 (3 Models)
- `AIChatSession`: AI 家教對話 Session。
- `AIChatMessage`: 對話訊息記錄 (發問、提示、安全評分)。
- `StudentWeaknessAnalysis`: 學生能力雷達弱點分佈與補強推薦。

---

## 4. 資料庫遷移歷程 (Migration History)

| 遷移目錄名稱 | 建立時間 | 核心遷移內容 | 套用狀態 |
| :--- | :--- | :--- | :--- |
| `20261103000000_init` | 2026-11-03 | 建立 User, Role, UserRole, UserProfile, Session, TeacherApplication 等核心認證表 | 本機已套用 / 正式庫隔離保留 |
| `20261108000000_add_business_models` | 2026-11-08 | 建立題庫、班級、作業、測驗、術科題組、AI 對話等業務實體模型 | 本機已套用 / 正式庫隔離保留 |
