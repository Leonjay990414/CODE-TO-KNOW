# CODE TO KNOW（碼上學）
# PHASE 3B：業務資料模型完整架構設計規格書
# (Business Domain Data Model Specification)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3 Business Schema Design)
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_PHASE3B_BUSINESS_SCHEMA_DESIGN.md`
- **設計團隊**：資深 PostgreSQL DBA、Prisma 7 資料庫架構師、教育科技平台系統分析師、資料庫資安工程師
- **管理狀態**：資料模型規格設計（READ-ONLY DESIGN SPECIFICATION，尚未寫入資料庫）

---

## 一、設計原則與既有 9 大核心模型繼承

### 1. 核心設計原則
1. **五層架構對齊**：依據平台五層架構進行業務資料劃分，公開層保持輕量，學習與教學層具備高擴充性。
2. **高度正規化（Normalized）**：杜絕「把整個使用者進度塞進單一大 JSON」的脆弱設計，關鍵狀態（如完成標記、步驟時間戳、錯題、書籤）皆採正規化關聯表。
3. **版本與快照隔離（Snapshot Isolation）**：
   - 模擬測驗作答記錄必須保存**題目內容與計分快照**，題庫更新時歷史測驗成績與題目文字絕不受影響。
   - 術科系統 Version A（官方教材版）與 Version B（影音教學版）**進度完全獨立**，不共用完成狀態。
4. **外鍵級聯安全**：業務主檔刪除時從屬紀錄適當級聯，資安與審核軌跡永久保留（`SetNull`）。
5. **最小權限與個資隔離**：嚴格劃分學生自主存取範圍、班級教師查看邊界與管理員審核權限。

### 2. 既有 9 大核心模型（Group A，已於 Phase 1B/2 建置完畢）
新設計模型將完全以此 9 大模型為基石進行擴充，嚴禁重複建立或破壞：
1. `User`（使用者帳號主表）
2. `Role`（系統角色表）
3. `UserRole`（使用者多角色關聯表）
4. `UserProfile`（個人檔案與語系偏好表）
5. `Session`（登入會話管理表）
6. `TeacherApplication`（教師資格審查申請表）
7. `EmailVerificationToken`（信箱驗證權杖表）
8. `PasswordResetToken`（密碼重設權杖表）
9. `AuditLog`（全域資安稽核日誌表）

---

## 二、第一層：公開網站與宣傳管理 (Public & Announcements)

> **輕量化原則**：首頁宣傳、特色介紹、定價方案皆為靜態內容，不建立多餘資料表以降低資料庫負擔。僅針對具動態發布需求之全站公告與公開資源進行建模。

### 1. `Announcement`（全站公告主表）
- **中文用途**：維護全平台或特定受眾（全部、學生、教師）之系統公告、考情快訊與維護通知。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 公告主鍵 (PK) |
  | `title` | String(200) | 是 | — | 公告標題 |
  | `content` | Text | 是 | — | 公告內容（支援 Markdown） |
  | `category` | String(50) | 是 | `'GENERAL'` | 分類：`GENERAL`, `EXAM_NEWS`, `MAINTENANCE` |
  | `targetRole` | String(50) | 是 | `'ALL'` | 受眾範圍：`ALL`, `STUDENT`, `TEACHER` |
  | `isPinned` | Boolean | 是 | `false` | 是否置頂顯示 |
  | `publishedAt` | DateTime | 否 | NULL | 正式發布時間（支援預約排程） |
  | `expiresAt` | DateTime | 否 | NULL | 公告下架時間 |
  | `authorId` | String (UUID) | 是 | — | 發布者 ID (FK: `User.id`) |
  | `createdAt` | DateTime | 是 | `now()` | 建立時間 |
  | `updatedAt` | DateTime | 是 | `@updatedAt` | 更新時間 |
- **約束與索引**：
  - FK: `authorId` -> `User.id` ON DELETE RESTRICT。
  - Index: `[publishedAt]`, `[targetRole]`, `[isPinned]`, `[category]`。
- **保留策略**：永久保存，過期公告透過 `expiresAt` 於前端查詢時過濾。

### 2. `AnnouncementRead`（公告已讀紀錄表）
- **中文用途**：記錄使用者是否已點閱/關閉重要置頂公告。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 記錄主鍵 (PK) |
  | `announcementId`| String (UUID) | 是 | — | 公告 ID (FK: `Announcement.id`) |
  | `userId` | String (UUID) | 是 | — | 使用者 ID (FK: `User.id`) |
  | `readAt` | DateTime | 是 | `now()` | 已讀時間戳記 |
- **約束與索引**：
  - 唯一鍵：`@@unique([announcementId, userId])`（防重複寫入）。
  - FK: `announcementId` -> `Announcement.id` ON DELETE CASCADE。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
- **保留策略**：公告物理刪除時連帶清理；歷史紀錄保留 1 年。

---

## 三、第二層：學生個人學習系統 (Student Learning System)

> **多證照與正規化原則**：學生可同時報名並準備多張證照（如網頁設計丙級、電腦軟體應用乙級）。各科學習進度、錯題、書籤與筆記嚴格依據證照與單元正規化。

### 1. `CertificationEnrollment`（學生證照學習登記表）
- **中文用途**：記錄學生所選修或正在準備之檢定證照與個人目標。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `certificationId`| String (UUID) | 是 | — | 證照 ID (FK: `Certification.id`) |
  | `targetExamDate` | DateTime | 否 | NULL | 預計應檢日期（個人目標） |
  | `targetScore` | Int | 是 | `80` | 目標分數（預設及格標準 60，建議 80） |
  | `status` | String(30) | 是 | `'IN_PROGRESS'`| 狀態：`IN_PROGRESS`, `COMPLETED`, `PAUSED` |
  | `enrolledAt` | DateTime | 是 | `now()` | 加入學習時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, certificationId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `certificationId` -> `Certification.id` ON DELETE RESTRICT。
  - Index: `[userId]`, `[certificationId]`, `[status]`。

### 2. `UnitProgress`（單元知識點學習進度表）
- **中文用途**：記錄學生在各證照科目之章節/單元完成狀態與熟練度。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `subjectId` | String (UUID) | 是 | — | 科目/單元 ID (FK: `Subject.id`) |
  | `status` | String(30) | 是 | `'NOT_STARTED'`| 狀態：`NOT_STARTED`, `IN_PROGRESS`, `MASTERED` |
  | `completedQuestions` | Int | 是 | `0` | 已練習題數 |
  | `accuracyRate` | Float | 是 | `0.0` | 該單元正確率 (0.00 ~ 1.00) |
  | `lastStudiedAt`| DateTime | 是 | `now()` | 最後學習時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, subjectId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `subjectId` -> `Subject.id` ON DELETE CASCADE。

### 3. `WrongQuestionRecord`（錯題筆記本紀錄表）
- **中文用途**：集中管理學生答錯之題目，提供「錯題重練」、「弱點消除」功能。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `questionId` | String (UUID) | 是 | — | 題目 ID (FK: `Question.id`) |
  | `wrongCount` | Int | 是 | `1` | 累計答錯次數 |
  | `lastUserAnswer`| String(20) | 是 | — | 最後一次選取之錯誤選項 (如 'A') |
  | `isResolved` | Boolean | 是 | `false` | 是否已掌握（連續答對 N 次標記已克服） |
  | `resolvedAt` | DateTime | 否 | NULL | 克服時間 |
  | `updatedAt` | DateTime | 是 | `@updatedAt` | 最後答錯時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, questionId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `questionId` -> `Question.id` ON DELETE CASCADE。
  - Index: `[userId, isResolved]`。

### 4. `QuestionBookmark`（題目收藏夾）
- **中文用途**：學生手動加入星號收藏之重要題型或難題。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `questionId` | String (UUID) | 是 | — | 題目 ID (FK: `Question.id`) |
  | `note` | String(500) | 否 | NULL | 學生個人速記標註 |
  | `createdAt` | DateTime | 是 | `now()` | 收藏時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, questionId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `questionId` -> `Question.id` ON DELETE CASCADE。

### 5. `StudyTimeLog`（學習時長聚合統計表）
- **中文用途**：追蹤學生每日在各學習模組（學科測驗、術科實戰、AI 諮詢）之停留與練習時長。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `studyDate` | String(10) | 是 | — | 日期字串 (格式: `YYYY-MM-DD`) |
  | `moduleType` | String(30) | 是 | — | 模組：`THEORY`, `PRACTICAL`, `MOCK_EXAM`, `AI_COACH` |
  | `durationSeconds`| Int | 是 | `0` | 當日累計學習秒數 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, studyDate, moduleType])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - Index: `[userId, studyDate]`。

---

## 四、第三層：教師教學管理系統 (Teacher Teaching System)

> **安全與審查原則**：教師身分必須經由 `TeacherApplication` 經管理者審批後方可取得 `TEACHER` 角色。班級權限受嚴格隔離，學生無法透過篡改前端資料加入班級或提升教師權限。

### 1. `TeacherProfile`（教師專用檔案表）
- **中文用途**：維護已認證教師之學校、科系、職稱與教學簡介。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 使用者 ID (FK: `User.id`, 需具備 TEACHER 角色) |
  | `schoolName` | String(150) | 是 | — | 任教學校名稱 |
  | `department` | String(100) | 是 | — | 任教科系/處室 |
  | `title` | String(50) | 否 | NULL | 職稱 (如：專任教師、兼任講師) |
  | `isVerified` | Boolean | 是 | `true` | 是否已完成審核 |
  | `createdAt` | DateTime | 是 | `now()` | 建立時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。

### 2. `Class`（班級主表）
- **中文用途**：教師建立之教學班級（如「高三甲班 網頁設計衝刺班」），具備專屬班級邀請碼。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 班級主鍵 (PK) |
  | `name` | String(100) | 是 | — | 班級名稱 |
  | `joinCode` | String(20) | 是 | — | 學生加入邀請碼 (大寫英數 8 碼，UNIQUE) |
  | `description` | Text | 否 | NULL | 班級簡介與課程目標 |
  | `certificationId`| String (UUID) | 是 | — | 目標檢定證照 (FK: `Certification.id`) |
  | `creatorId` | String (UUID) | 是 | — | 建立教師 ID (FK: `User.id`) |
  | `status` | String(30) | 是 | `'ACTIVE'` | 狀態：`ACTIVE`, `ARCHIVED` |
  | `createdAt` | DateTime | 是 | `now()` | 建立時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([joinCode])`。
  - FK: `creatorId` -> `User.id` ON DELETE RESTRICT。
  - FK: `certificationId` -> `Certification.id` ON DELETE RESTRICT。
  - Index: `[creatorId]`, `[joinCode]`, `[status]`。

### 3. `ClassEnrollment`（班級學員名冊表）
- **中文用途**：維護學生與班級之多對多入班關係。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `classId` | String (UUID) | 是 | — | 班級 ID (FK: `Class.id`) |
  | `studentId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `seatNumber` | String(20) | 否 | NULL | 班級座號/學號 |
  | `status` | String(30) | 是 | `'JOINED'` | 狀態：`JOINED`, `DROPPED` |
  | `joinedAt` | DateTime | 是 | `now()` | 加入時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([classId, studentId])`。
  - FK: `classId` -> `Class.id` ON DELETE CASCADE。
  - FK: `studentId` -> `User.id` ON DELETE CASCADE。

### 4. `ClassAssignment`（班級指派作業/測驗表）
- **中文用途**：教師對班級派發之學科或術科練習作業。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `classId` | String (UUID) | 是 | — | 班級 ID (FK: `Class.id`) |
  | `title` | String(150) | 是 | — | 作業標題 |
  | `type` | String(30) | 是 | — | 類型：`MOCK_EXAM` (學科), `PRACTICAL_TASK` (術科) |
  | `targetId` | String (UUID) | 是 | — | 關聯目標 ID (ExamPaper.id 或 PracticalTask.id) |
  | `deadline` | DateTime | 是 | — | 截止繳交時間 |
  | `passingScore` | Int | 是 | `60` | 及格標準 |
  | `createdAt` | DateTime | 是 | `now()` | 派發時間 |
- **約束與索引**：
  - FK: `classId` -> `Class.id` ON DELETE CASCADE。
  - Index: `[classId]`, `[deadline]`。

---

## 五、第四層：題庫與教材管理系統 (Question Bank & Assets)

> **考綱權威與版權規範**：嚴格劃分檢定官方真題與自編模擬題，支援題型分類、選項結構、版權來源追蹤與版本凍結。

### 1. `Certification`（檢定證照主表）
- **中文用途**：維護國家技能檢定與國際證照主檔（如：17300 網頁設計丙級）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 證照主鍵 (PK) |
  | `code` | String(50) | 是 | — | 職類代碼 (如: `17300`, `web-design-c`, UNIQUE) |
  | `name` | String(150) | 是 | — | 證照全名 (例: 勞動部技能檢定 17300 網頁設計丙級) |
  | `level` | String(20) | 是 | — | 等級：`LEVEL_C` (丙級), `LEVEL_B` (乙級), `LEVEL_A` |
  | `category` | String(50) | 是 | — | 領域：`WEB_DESIGN`, `COMPUTER_APPLICATIONS`, `PROGRAMMING` |
  | `officialVersion`| String(50) | 是 | — | 當前最新適用考綱版本 (如: 113/114年版) |
  | `status` | String(30) | 是 | `'ACTIVE'` | 狀態：`ACTIVE`, `PREVIEW` |
- **約束與索引**：
  - 唯一鍵：`@@unique([code])`。

### 2. `Subject`（科目與工作項目表）
- **中文用途**：證照所涵蓋之工作項目或子領域（如工作項目 01：作業準備、工作項目 02：HTML 語法）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 科目主鍵 (PK) |
  | `certificationId`| String (UUID) | 是 | — | 所屬證照 (FK: `Certification.id`) |
  | `code` | String(50) | 是 | — | 項目代號 (如: `17300-01`, `17300-02`) |
  | `title` | String(150) | 是 | — | 工作項目名稱 |
  | `examType` | String(30) | 是 | `'THEORY'` | 考試類別：`THEORY` (學科), `PRACTICAL` (術科) |
  | `displayOrder` | Int | 是 | `0` | 前端排列順序 |
- **約束與索引**：
  - 唯一鍵：`@@unique([certificationId, code])`。
  - FK: `certificationId` -> `Certification.id` ON DELETE CASCADE。

### 3. `Question`（題庫題目主表）
- **中文用途**：學科單選題、複選題之主檔，保存題幹、正確解答、詳細解析與版權來源。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 題目主鍵 (PK) |
  | `subjectId` | String (UUID) | 是 | — | 所屬工作項目 (FK: `Subject.id`) |
  | `officialNumber`| Int | 否 | NULL | 官方考卷題號 (如: 24, 58) |
  | `questionText` | Text | 是 | — | 題幹文字（支援 Markdown 與代碼段） |
  | `codeSnippet` | Text | 否 | NULL | 題幹程式碼片段 |
  | `questionType` | String(30) | 是 | `'SINGLE_CHOICE'` | 題型：`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE` |
  | `difficulty` | String(20) | 是 | `'MEDIUM'` | 難度：`EASY`, `MEDIUM`, `HARD` |
  | `correctAnswer` | String(20) | 是 | — | 正確答案標識 (如 `'B'`，或複選 `'A,C'`) |
  | `explanation` | Text | 是 | — | 解題說明與核心觀念解析 |
  | `sourceName` | String(150) | 是 | — | 來源全稱 (如：勞動部技能檢定中心 173003A17 測試參考資料) |
  | `sourceUrl` | String(500) | 否 | NULL | 官方或來源出處 URL |
  | `sourceVersion` | String(50) | 是 | — | 來源版本年次 (如：113/114年版) |
  | `status` | String(30) | 是 | `'ACTIVE'` | 狀態：`ACTIVE`, `DEPRECATED` (過期停用) |
  | `createdAt` | DateTime | 是 | `now()` | 建立時間 |
  | `updatedAt` | DateTime | 是 | `@updatedAt` | 更新時間 |
- **約束與索引**：
  - FK: `subjectId` -> `Subject.id` ON DELETE RESTRICT。
  - Index: `[subjectId, status]`, `[difficulty]`, `[sourceVersion]`。

### 4. `QuestionOption`（題目選項表）
- **中文用途**：正規化儲存題目的各個選項內容（A、B、C、D）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `questionId` | String (UUID) | 是 | — | 題目 ID (FK: `Question.id`) |
  | `key` | String(10) | 是 | — | 選項代號 (如: `'A'`, `'B'`, `'C'`, `'D'`) |
  | `text` | Text | 是 | — | 選項文字內容 |
  | `displayOrder` | Int | 是 | `0` | 排列序號 (1~4) |
- **約束與索引**：
  - 唯一鍵：`@@unique([questionId, key])`。
  - FK: `questionId` -> `Question.id` ON DELETE CASCADE。

### 5. `QuestionTag` 與 `QuestionTagRelation`（題目標籤與關聯表）
- **中文用途**：支援多維度靈活標籤（如：`CSS盒模型`、`HTML5語意標籤`、`高頻考點`）。
- **欄位規格**：
  - `QuestionTag`：`id` (PK), `name` (UNIQUE), `color`。
  - `QuestionTagRelation`：`questionId`, `tagId`，複合唯一主鍵 `@@id([questionId, tagId])`。

---

## 六、術科系統：五大官方題組與雙版本獨立架構 (Practical Exam System)

> **核心準則**：
> 1. 正式題組嚴格鎖定**五大官方題組**（104301 ~ 104305），不包含「台灣美食精緻巡禮」。
> 2. 嚴格區分 **Version A（官方教材版）** 與 **Version B（影音教學版）**。
> 3. 進度獨立追蹤，概念實裝為：`@@unique([userId, taskId, version])`，保證 A、B 兩版進度完全隔離。

### 1. 官方五大題組代號與正式名稱規範
| 題號代碼 | 試題代碼 | 官方正式題組名稱 | 涵蓋影音影片編號 | 影片總數 |
| :---: | :---: | :--- | :---: | :---: |
| **1** | `17300-104301` | **校園社團介紹網** | 第 1 ～ 5 支 | 5 |
| **2** | `17300-104302` | **運動廣場連結網** | 第 6 ～ 11 支 | 6 |
| **3** | `17300-104303` | **國家公園介紹網** | 第 12 ～ 13 支 | 2 |
| **4** | `17300-104304` | **網路行銷購物網** | 第 14 ～ 16 支 | 3 |
| **5** | `17300-104305` | **書曼的旅遊相簿** | 第 17 ～ 19 支 | 3 |

### 2. `PracticalTask`（術科題組主表）
- **中文用途**：五大術科題組之規格主檔，定義版面尺寸、主題與官方要求。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 題組主鍵 (PK) |
  | `taskCode` | String(50) | 是 | — | 試題代號 (如: `17300-104301`, UNIQUE) |
  | `taskNumber` | Int | 是 | — | 題組序號 (1 ~ 5) |
  | `title` | String(150) | 是 | — | 官方正式試題名稱 |
  | `theme` | String(255) | 是 | — | 試題主軸與核心技能 |
  | `canvasWidth` | String(30) | 是 | `'1024px'` | 標準版面寬度 |
  | `estimatedMinutes`| Int | 是 | `120` | 檢定建議限時 (120 分鐘) |
  | `materialPath` | String(255) | 是 | — | 官方原始素材目錄路徑 |
  | `defaultHtmlCode`| Text | 是 | — | 沙盒預載 HTML 初始骨架 |
  | `defaultCssCode` | Text | 是 | — | 沙盒預載 CSS 初始樣式 |
  | `status` | String(30) | 是 | `'AVAILABLE'` | 狀態：`AVAILABLE`, `MAINTENANCE` |
- **約束與索引**：
  - 唯一鍵：`@@unique([taskCode])`。
  - 唯一鍵：`@@unique([taskNumber])`。

### 3. `PracticalStep`（題組教學步驟表 — 支援 Version A 與 Version B）
- **中文用途**：解構題組之操作步驟。透過 `version` 欄位區分官方教材或 YouTube 影音版。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 步驟主鍵 (PK) |
  | `taskId` | String (UUID) | 是 | — | 所屬題組 (FK: `PracticalTask.id`) |
  | `version` | String(20) | 是 | — | 教材版本：`VERSION_A` (官方教材), `VERSION_B` (影音教學) |
  | `stepNumber` | Int | 是 | — | 步驟序號 (1, 2, 3...) |
  | `title` | String(150) | 是 | — | 步驟標題 (如：製作標題圖片合成) |
  | `description` | Text | 是 | — | 詳細操作指引與排版指示 |
  | `videoUrl` | String(500) | 否 | NULL | YouTube 影片連結（僅 Version B） |
  | `videoStartSeconds`| Int | 否 | NULL | 影片跳轉秒數（Version B，未逐秒核實時為 NULL） |
  | `pitfallWarning` | Text | 否 | NULL | 考場常見扣分地雷與防呆提醒 |
- **約束與索引**：
  - 唯一鍵：`@@unique([taskId, version, stepNumber])`。
  - FK: `taskId` -> `PracticalTask.id` ON DELETE CASCADE。

### 4. `PracticalProgress`（題組整體學習進度表 — 核心獨立進度）
- **中文用途**：保存學生在特定題組、特定版本（Version A 或 B）之獨立進度。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `taskId` | String (UUID) | 是 | — | 題組 ID (FK: `PracticalTask.id`) |
  | `version` | String(20) | 是 | — | 版本：`VERSION_A`, `VERSION_B` |
  | `status` | String(30) | 是 | `'NOT_STARTED'`| 狀態：`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED` |
  | `practiceCount` | Int | 是 | `1` | 重新練習次數（支援重練） |
  | `savedHtmlCode` | Text | 否 | NULL | 學生個人儲存之 HTML 程式碼 |
  | `savedCssCode` | Text | 否 | NULL | 學生個人儲存之 CSS 程式碼 |
  | `lastPracticedAt`| DateTime | 是 | `now()` | 最後練習時間 |
  | `completedAt` | DateTime | 否 | NULL | 首次通關完成時間 |
- **約束與索引**：
  - **核心唯一約束**：`@@unique([userId, taskId, version])`（**保證 Version A 與 Version B 進度絕對隔離**）。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `taskId` -> `PracticalTask.id` ON DELETE CASCADE。
  - Index: `[userId, taskId]`, `[status]`。

### 5. `PracticalStepProgress`（步驟細部打勾檢核紀錄表）
- **中文用途**：正規化記錄學生在各步驟之檢查清單完成狀態與時間戳。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `progressId` | String (UUID) | 是 | — | 所屬題組進度 (FK: `PracticalProgress.id`) |
  | `stepId` | String (UUID) | 是 | — | 步驟 ID (FK: `PracticalStep.id`) |
  | `isCompleted` | Boolean | 是 | `false` | 該步驟是否完成 |
  | `completedAt` | DateTime | 否 | NULL | 該步驟打勾完成時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([progressId, stepId])`。
  - FK: `progressId` -> `PracticalProgress.id` ON DELETE CASCADE。
  - FK: `stepId` -> `PracticalStep.id` ON DELETE CASCADE。

---

## 七、模擬測驗系統：題組設定與成績快照 (Mock Exam System)

> **歷史成績不可竄改原則（Snapshot Freezing）**：學生考完並繳卷後，系統必須**固化（Snapshot）當時的題目文字、選項與配分**。即便未來題庫修改題幹或停用題目，歷史考卷依舊保留真實考查軌跡。

### 1. `ExamPaper`（測驗試卷樣板表）
- **中文用途**：自組卷或官方歷屆試卷樣板（如：113 年網頁設計丙級學科全真模擬卷）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 試卷主鍵 (PK) |
  | `title` | String(150) | 是 | — | 試卷名稱 |
  | `certificationId`| String (UUID) | 是 | — | 所屬證照 (FK: `Certification.id`) |
  | `timeLimitMinutes`| Int | 是 | `60` | 測驗限時 (預設 60 分鐘) |
  | `totalQuestions` | Int | 是 | `80` | 總題數 (丙級學科標準為 80 題) |
  | `passingScore` | Int | 是 | `60` | 及格門檻分數 |
  | `version` | String(20) | 是 | `'1.0'` | 試卷版本 |
  | `status` | String(30) | 是 | `'ACTIVE'` | 狀態：`ACTIVE`, `ARCHIVED` |
- **約束與索引**：
  - FK: `certificationId` -> `Certification.id` ON DELETE RESTRICT。

### 2. `ExamAttempt`（測驗應試作答紀錄表）
- **中文用途**：記錄學生每一次參加測驗的開始時間、繳交時間、最終成績與及格判定。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 考試紀錄主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 應試學生 ID (FK: `User.id`) |
  | `examPaperId` | String (UUID) | 是 | — | 試卷 ID (FK: `ExamPaper.id`) |
  | `startedAt` | DateTime | 是 | `now()` | 測驗開始時間 |
  | `submittedAt` | DateTime | 否 | NULL | 測驗繳交時間 |
  | `durationSeconds`| Int | 否 | NULL | 實際作答耗時（秒） |
  | `score` | Float | 否 | NULL | 最終總分 (0.0 ~ 100.0) |
  | `isPassed` | Boolean | 否 | NULL | 是否通過及格標準 |
  | `correctCount` | Int | 否 | NULL | 答對題數 |
  | `wrongCount` | Int | 否 | NULL | 答錯題數 |
  | `status` | String(30) | 是 | `'IN_PROGRESS'`| 狀態：`IN_PROGRESS`, `SUBMITTED`, `ABANDONED` |
- **約束與索引**：
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `examPaperId` -> `ExamPaper.id` ON DELETE RESTRICT。
  - Index: `[userId, startedAt]`, `[examPaperId]`, `[status]`。

### 3. `ExamAnswerSnapshot`（作答題目快照與明細表 — 關鍵歷史快照）
- **中文用途**：固化每一題的題幹快照、選項快照、學生選取答案、正確答案與單題耗時。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 明細主鍵 (PK) |
  | `attemptId` | String (UUID) | 是 | — | 所屬考試 (FK: `ExamAttempt.id`) |
  | `questionId` | String (UUID) | 是 | — | 關聯題目 (FK: `Question.id`, ON DELETE RESTRICT) |
  | `questionOrder` | Int | 是 | — | 題號順序 (1 ~ 80) |
  | `questionTextSnapshot`| Text | 是 | — | **交卷當下之題幹文字快照** |
  | `optionsSnapshot` | Text (JSON) | 是 | — | **交卷當下之選項集合快照** |
  | `correctAnswerSnapshot`| String(20)| 是 | — | **交卷當下之正確答案快照** |
  | `userAnswer` | String(20) | 否 | NULL | 學生選填之答案 (如 `'B'`，未作答為 NULL) |
  | `isCorrect` | Boolean | 是 | — | 此題是否答對 |
  | `timeSpentSeconds` | Int | 是 | `0` | 學生在此題停留思考秒數 |
- **約束與索引**：
  - 唯一鍵：`@@unique([attemptId, questionOrder])`。
  - FK: `attemptId` -> `ExamAttempt.id` ON DELETE CASCADE。
  - FK: `questionId` -> `Question.id` ON DELETE RESTRICT。
  - Index: `[attemptId, isCorrect]`。

---

## 八、第五層：AI 學習與智慧分析系統 (AI Coach & Scaffolding)

> **教育理念與隱私保護**：
> 1. AI 的使命為「階梯式引導思考（Scaffolding）」，絕非直接代寫程式碼或輸出考卷答案。
> 2. 嚴格控管對話日誌保留期限（如 90 天自動清理對話文字，聚合學習弱點轉為統計標籤）。
> 3. 追蹤 Token 消耗量以控管營運成本。

### 1. `AIChatSession`（AI 學習教練對話會話表）
- **中文用途**：學生針對特定題目、實戰步驟或概念發起之諮詢工作階段。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 會話主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 提問學生 ID (FK: `User.id`) |
  | `contextType` | String(30) | 是 | — | 情境：`THEORY_QUESTION`, `PRACTICAL_STEP`, `CODE_DEBUG` |
  | `contextId` | String(100) | 否 | NULL | 關聯之題目 ID 或步驟 ID |
  | `title` | String(150) | 是 | `'新學習對話'` | 對話主題 |
  | `totalTokensUsed`| Int | 是 | `0` | 累計消耗之 Tokens |
  | `createdAt` | DateTime | 是 | `now()` | 開始時間 |
  | `updatedAt` | DateTime | 是 | `@updatedAt` | 最後互動時間 |
- **約束與索引**：
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - Index: `[userId, createdAt]`。

### 2. `AIChatMessage`（AI 對話內容紀錄表）
- **中文用途**：保存使用者輸入提問與 AI 教練之引導回應訊息。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 訊息主鍵 (PK) |
  | `sessionId` | String (UUID) | 是 | — | 所屬會話 (FK: `AIChatSession.id`) |
  | `role` | String(20) | 是 | — | 角色：`USER`, `ASSISTANT`, `SYSTEM` |
  | `content` | Text | 是 | — | 訊息內容 |
  | `scaffoldingStage`| Int | 否 | NULL | 鷹架階段 (1:觀念聚焦, 2:破題思路, 3:邊界提示, 4:架構解構) |
  | `tokensUsed` | Int | 是 | `0` | 單則訊息花費之 Tokens |
  | `createdAt` | DateTime | 是 | `now()` | 訊息發送時間 |
- **約束與索引**：
  - FK: `sessionId` -> `AIChatSession.id` ON DELETE CASCADE。
  - Index: `[sessionId, createdAt]`。
- **保留期限**：保存 90 天，期滿進行歷史封存或清理。

### 3. `StudentWeaknessAnalysis`（學生弱點分析聚合表）
- **中文用途**：記錄 AI 分析引擎對學生在各工作項目或技能弱點之畫像評級。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 預設值 | 說明 |
  | :--- | :--- | :---: | :--- | :--- |
  | `id` | String (UUID) | 是 | `uuid()` | 主鍵 (PK) |
  | `userId` | String (UUID) | 是 | — | 學生 ID (FK: `User.id`) |
  | `subjectId` | String (UUID) | 是 | — | 科目/工作項目 ID (FK: `Subject.id`) |
  | `masteryLevel` | Float | 是 | `0.0` | 掌握程度 (0.00 ~ 1.00) |
  | `weaknessTags` | Text (JSON) | 否 | NULL | 診斷出的主要盲點標籤清單 |
  | `suggestedAction`| Text | 否 | NULL | AI 推薦之下一步強化學習指引 |
  | `updatedAt` | DateTime | 是 | `@updatedAt` | 最後分析更新時間 |
- **約束與索引**：
  - 唯一鍵：`@@unique([userId, subjectId])`。
  - FK: `userId` -> `User.id` ON DELETE CASCADE。
  - FK: `subjectId` -> `Subject.id` ON DELETE CASCADE。

---

## 九、資料生命週期與保留策略總覽 (Retention Policy)

| 資料類別 | 包含資料表 | 儲存生命週期 | 清理/封存機制 |
| :--- | :--- | :--- | :--- |
| **帳號與權限** | `User`, `Role`, `UserRole`, `UserProfile` | 帳號存續期間永久保存 | 帳號註銷採軟刪除（`deletedAt` 標記） |
| **安全稽核日誌** | `AuditLog` | **至少 3 年**（符合法規要求） | `User` 刪除時採 `SetNull`，日誌本身永久保存 |
| **認證會話與權杖** | `Session`, `EmailVerificationToken`, `PasswordResetToken` | 1 小時 ~ 7 天 | 過期且已使用紀錄由背景排程每週清理 |
| **證照與題庫主檔** | `Certification`, `Subject`, `Question`, `PracticalTask` | 永久保存 | 過期考綱或舊題目標記 `DEPRECATED`，不進行物理刪除 |
| **學習進度與錯題** | `UnitProgress`, `WrongQuestionRecord`, `PracticalProgress` | 帳號存續期間永久保存 | 使用者註銷時隨帳號 Cascade 清除 |
| **模擬測驗作答快照** | `ExamAttempt`, `ExamAnswerSnapshot` | 至少保留 2 年 | 保持完整考試軌跡與成績證明 |
| **AI 對話內容日誌** | `AIChatSession`, `AIChatMessage` | **保留 90 天** | 90 天後自動清除對話本文，僅保留弱點統計結果 |

---

## 十、設計審核總結

1. **模組邊界清晰**：五層系統分工明確，核心與次要模型邊界分明。
2. **術科五大題組與雙版本落實**：以正規化複合鍵徹底隔離 Version A 與 Version B 進度。
3. **測驗快照防竄改**：透過 `ExamAnswerSnapshot` 固化作答當下題型與內容，確保歷史成績客觀可信。
4. **準備就緒**：本規格書提供完整欄位、型別、預設值、約束與索引，可無縫轉譯為下一階段之 Prisma Schema 擴充定義。
