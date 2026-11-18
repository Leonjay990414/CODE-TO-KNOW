# CODE TO KNOW｜全專案資料庫盤點與隔離狀態清冊 (Master Database Inventory)

版本：MASTER-DB-INVENTORY-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
受檢檔案：`backend/prisma/schema.prisma`, `backend/src/config/db-validation.ts`, `backend/prisma/migrations/`  
安全原則：只讀靜態稽核，零寫入、零 Migration、零 DDL/DML 操作。

---

## 一、資料庫環境與連線隔離狀態 (Connection & Isolation Status)

依據 `backend/src/config/db-validation.ts` 與專案 AUTH-03 隔離標準：

| 環境類型 | 目標資料庫 | 白名單主機 (Host) | 埠號 (Port) | 連線角色 (Role) | 目前安全隔離狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **本機開發 (DEV)** | `code_to_know` | `localhost`, `127.0.0.1` | 5432 / 5433 | `postgres` | **隔離受控**：僅供本機 Docker PostgreSQL 17 使用 |
| **離線測試 (TEST)** | `code_to_know_test` | `localhost`, `127.0.0.1` | 5432 / 5434 | `c2k_test_app_runtime` | **隔離受控**：自動化測試一律使用離線 Mock 或獨立測試庫 |
| **雲端正式 (PROD)** | `postgres` | `aws-0-ap-southeast-2.pooler.supabase.com` | 5432 (Session) / 6543 (Tx) | `app_runtime` (執行期)<br>`migration_admin` (遷移專用) | **嚴格封鎖 (BLOCKED/READ-ONLY)**：未經授權禁止一切寫入與連線操作 |

> **安全守則落實**：
> 1. 嚴禁在 Production Runtime 中使用 `postgres` 超級使用者身分。
> 2. `migration_admin` 角色僅限於正式遷移管線，嚴禁流入 Web API 執行期。
> 3. 所有整合測試檔（`*.db.test.ts`）在無本機專用 PG17 實例時自動跳過，絕不對 Supabase 雲端資料庫造成污染。

---

## 二、Prisma 綱要實體模型完整清單 (36 Models & 1 Enum)

目前 `backend/prisma/schema.prisma` 定義了 **36 個 Model** 與 **1 個 Enum** (`AnnouncementStatus`)，依功能模組劃分如下：

### 1. 認證、使用者與授權核心 (Authentication & User RBAC)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `User` | 9 | `id` (cuid), `email` (unique) | P05 | P05-SEC-001 | 正式使用 (API 已接通) | 系統核心使用者帳號，關聯 UserRole, UserProfile, Session |
| `Role` | 4 | `id` (cuid), `name` (unique) | P05 | P05-SEC-002 | 正式使用 (API 已接通) | 系統角色（STUDENT, TEACHER, ADMIN），種子檔內建 |
| `UserRole` | 4 | `id`, unique(`[userId, roleId]`) | P05 | P05-SEC-002 | 正式使用 (API 已接通) | 使用者與角色多對多對應表 |
| `UserProfile` | 11 | `id`, `userId` (unique) | P07 | P07-USR-005 | 正式使用 (API 已接通) | 個人資料、學號、暱稱、頭像、偏好設定 |
| `Session` | 6 | `id`, `token` (unique), `userId` | P05 | P05-SEC-011 | 正式使用 (API 已接通) | 使用者登入 Session 與 Refresh Token 追蹤 |
| `EmailVerificationToken` | 6 | `id`, `token` (unique), `userId` | P07 | P07-EML-004 | 正式使用 (API 已接通) | 電子郵件信箱驗證專用高熵一次性 Token |
| `PasswordResetToken` | 6 | `id`, `token` (unique), `userId` | P07 | P07-EML-005 | 正式使用 (API 已接通) | 忘記密碼重設專用一次性 Token（含逾期防護） |

### 2. 審查、稽核與系統公告 (Audit, Teachers & System Announcements)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TeacherApplication` | 10 | `id`, `userId` (unique) | P08 | P08-TCH-006 | 正式使用 (API 已接通) | 教師身分資格申請表，含學校、證件、審核狀態 |
| `TeacherProfile` | 8 | `id`, `userId` (unique) | P08 | P08-TCH-007 | 正式使用 (API 已接通) | 經審核通過之合格教師專屬設定檔 |
| `AuditLog` | 8 | `id`, `[userId, action, createdAt]` | P16 | P16-AUD-002 | 正式使用 (API 已接通) | 系統安全性與高權限操作審計追蹤紀錄 |
| `Announcement` | 8 | `id`, `status` (Enum) | P16 | P16-ADM-006 | Schema 就緒 (待接API) | 平台全域公告通知（DRAFT, PUBLISHED, ARCHIVED） |
| `AnnouncementRead` | 4 | `id`, unique(`[userId, announcementId]`) | P16 | P16-ADM-007 | Schema 就緒 (待接API) | 使用者閱讀公告狀態紀錄 |

> **Enum 定義**：
> `enum AnnouncementStatus`: `DRAFT`, `PUBLISHED`, `ARCHIVED`

### 3. 班級教學與作業管理 (Classrooms & Assignments)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Class` | 8 | `id`, `joinCode` (unique) | P08 | P08-CLS-006 | 正式使用 (API 已接通) | 教師建立之班級實體，含高熵 6 碼加入代碼 |
| `ClassEnrollment` | 5 | `id`, unique(`[classId, studentId]`) | P08 | P08-CLS-007 | 正式使用 (API 已接通) | 學生選課加入班級關聯表 |
| `ClassAssignment` | 10 | `id`, `classId` | P08 | P08-CLS-008 | Schema 就緒 (本機原型已對接)| 班級作業派發（含截止日、關卡代碼與星級目標） |

### 4. 學科題庫、檢定科目與標籤 (Theory Question Bank & Tags)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `Certification` | 6 | `id`, `code` (unique) | P09 | P09-THY-002 | Schema 就緒 (前端靜態已對接)| 檢定證照代碼（如 17300 網頁設計丙級） |
| `Subject` | 6 | `id`, `certificationId` | P09 | P09-THY-003 | Schema 就緒 (前端靜態已對接)| 檢定工作項目/專業科目模組 |
| `Question` | 12 | `id`, `subjectId`, `code` | P09 | P09-THY-004 | Schema 就緒 (前端已載入674題)| 學科單選/複選題庫題目實體 |
| `QuestionOption` | 5 | `id`, `questionId` | P09 | P09-THY-005 | Schema 就緒 (前端已載入674題)| 題目選項 (1~4 選項內容與正確性) |
| `QuestionTag` | 4 | `id`, `name` (unique) | P09 | P09-THY-006 | Schema 就緒 | 題目知識點標籤（如 HTML, CSS, JavaScript） |
| `QuestionTagRelation` | 4 | `id`, unique(`[questionId, tagId]`) | P09 | P09-THY-007 | Schema 就緒 | 題目與知識點標籤多對多關聯 |

### 5. 學習進度、錯題與模擬測驗 (Student Learning Progress & Exams)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CertificationEnrollment` | 5 | `id`, unique(`[userId, certificationId]`) | P03 | P03-STD-003 | Schema 就緒 (本機已接軌)| 學生報考/選修之證照科目紀錄 |
| `UnitProgress` | 8 | `id`, unique(`[userId, subjectId]`) | P03 | P03-STD-004 | Schema 就緒 (本機已接軌)| 學生各工作項目單元完成度與正確率 |
| `WrongQuestionRecord` | 7 | `id`, unique(`[userId, questionId]`) | P09 | P09-UTL-003 | Schema 就緒 (本機已接軌)| 學生個人錯題本，記錄錯誤次數與標記狀態 |
| `QuestionBookmark` | 5 | `id`, unique(`[userId, questionId]`) | P09 | P09-UTL-004 | Schema 就緒 (本機已接軌)| 題目收藏夾與重點標記 |
| `StudyTimeLog` | 6 | `id`, `userId`, `date` | P03 | P03-STD-005 | Schema 就緒 (本機已接軌)| 每日學習時長與活躍時段分析紀錄 |
| `ExamPaper` | 9 | `id` | P09 | P09-EXM-002 | Schema 就緒 (本機已接軌)| 模擬試卷定義（80 題隨機抽卷模組） |
| `ExamAttempt` | 10 | `id`, `userId`, `paperId` | P09 | P09-EXM-003 | Schema 就緒 (本機已接軌)| 學生模擬考測驗紀錄、總分與作答時間 |
| `ExamAnswerSnapshot` | 7 | `id`, `attemptId`, `questionId` | P09 | P09-EXM-004 | Schema 就緒 (本機已接軌)| 測驗詳細作答快照（學生答案與正確答案比對） |

### 6. 術科題組學習與沙盒 (Practical Exam 104301~104305)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PracticalTask` | 9 | `id`, `code` (unique) | P10 | P10-PRC-009 | Schema 就緒 (前端已完成5題組)| 術科題組實體 (104301~104305 五大官方題組) |
| `PracticalStep` | 8 | `id`, `taskId`, `stepNumber` | P10 | P10-PRC-010 | Schema 就緒 (前端已完成步進)| 題組逐步引導教學單元與驗證標準代碼 |
| `PracticalProgress` | 8 | `id`, unique(`[userId, taskId]`) | P10 | P10-PRC-011 | Schema 就緒 (本機已接軌)| 學生題組完成百分比與最新程式碼快照 |
| `PracticalStepProgress` | 6 | `id`, unique(`[progressId, stepId]`) | P10 | P10-PRC-012 | Schema 就緒 (本機已接軌)| 各步驟檢查點完成狀態 |

### 7. AI 智慧輔助與弱點分析 (AI Chat & Weakness Analysis)

| Model 名稱 | 欄位數 | 主鍵與核心索引 | 主要歸屬階段 | 主要歸屬 UID | 目前使用狀態 | 說明與關聯 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AIChatSession` | 6 | `id`, `userId` | P11 | P11-AI-004 | Schema 就緒 (前端為展示版)| AI 家教對話 Session（含上下文脈絡） |
| `AIChatMessage` | 7 | `id`, `sessionId` | P11 | P11-AI-005 | Schema 就緒 (前端為展示版)| 對話訊息記錄（含學生發問、AI 提示與回饋評分） |
| `StudentWeaknessAnalysis` | 8 | `id`, `userId`, `subjectId` | P11 | P11-AI-006 | Schema 就緒 (前端模擬運算)| AI 自動運算之學生能力雷達弱點分佈與補強建議 |

---

## 三、資料庫遷移歷程 (Migration History)

| 遷移目錄名稱 | 執行時間戳記 | 核心異動範圍 | 執行狀態 |
| :--- | :--- | :--- | :--- |
| `20261103000000_init` | 2026-11-03 | 建立 User, Role, UserRole, UserProfile, Session, TeacherApplication 等核心基礎表 | 本機已套用 / 正式庫隔離保留 |
| `20261108000000_add_business_models` | 2026-11-08 | 建立題庫、檢定科目、班級管理、作業、測驗、術科題組、AI 對話等業務實體模型 | 本機已套用 / 正式庫隔離保留 |

---

## 四、種子資料與預設帳號規範 (`backend/prisma/seed.ts`)

- **系統角色**: `STUDENT`, `TEACHER`, `ADMIN` (全數透過 `upsert` 防重入機制建立)。
- **帳號安全準則**: 
  - 種子腳本不包含任何硬編碼之真實使用者個人資料。
  - 本機測試與初始管理員帳號透過專用離線腳本 `backend/scripts/create-admin.ts` 產生，且使用安全的 bcrypt 雜湊，符合開發安全標準。
