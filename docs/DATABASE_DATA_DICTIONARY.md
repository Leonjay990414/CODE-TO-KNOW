# CODE TO KNOW（碼上學）
# 系統五層架構資料字典規格書 (DATABASE DATA DICTIONARY)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Pre-Database Implementation)
- **建立日期**：2026-11-07
- **資料庫引擎**：PostgreSQL 16 / Prisma ORM
- **文件路徑**：`docs/DATABASE_DATA_DICTIONARY.md`
- **資料隱私分級標準**：
  - `L1 - Public`：公開資料（如證照介紹、題庫題目、公開公告）
  - `L2 - Internal`：平台內部運作資料（如題型分類、系統組態、代碼表）
  - `L3 - Confidential`：使用者業務資料（如學習進度、作業成績、班級作業、錯題本）
  - `L4 - Restricted (PII)`：高度敏感個資（如使用者真實姓名、電子信箱、密碼雜湊、學號、手機、教師證件）

---

## 一、實體關聯圖架構 (ER Diagram Overview)

```mermaid
erDiagram
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : assigned_to
    User ||--o| UserProfile : profile
    User ||--o{ Session : maintains
    User ||--o{ TeacherApplication : submits
    User ||--o{ Enrollment : joins
    User ||--o{ ClassTeacher : teaches
    User ||--o{ ExamAttempt : takes
    User ||--o{ UserProgress : tracks
    User ||--o{ WrongQuestion : records
    User ||--o{ Bookmark : saves
    User ||--o{ LearningNote : writes
    User ||--o{ UserPoints : earns
    User ||--o{ UserAchievement : unlocks

    Class ||--o{ Enrollment : contains
    Class ||--o{ ClassTeacher : assigned_to
    Class ||--o{ AssignedExam : delivers

    User ||--o{ Announcement : publishes
    Announcement ||--o{ AnnouncementTarget : targets
    Announcement ||--o{ AnnouncementRead : read_by
    Announcement ||--o{ AnnouncementAttachment : attaches
    Announcement ||--o| AnnouncementModeration : moderated_by
    Announcement ||--o{ Notification : triggers
    Announcement ||--o{ EmailQueue : schedules

    User ||--o{ AnnouncementRead : acknowledges
    User ||--o{ Notification : receives
    EmailQueue ||--o{ EmailDeliveryLog : tracks

    Certification ||--o{ Subject : divides
    Subject ||--o{ Question : groups
    Question ||--o{ QuestionOption : has
    Question ||--o{ WrongQuestion : referenced_by
    Question ||--o{ Bookmark : marked_by
    Question ||--o{ LearningNote : noted_on

    Certification ||--o{ PracticalTask : offers
    PracticalTask ||--o{ PracticalAsset : supplies
    PracticalTask ||--o{ PracticalSubmission : receives

    Exam ||--o{ ExamAttempt : instantiates
    AssignedExam ||--o{ ExamAttempt : schedules
    ExamAttempt ||--o{ ExamAnswer : records
    ExamAttempt ||--o| ExamResult : calculates

    Game ||--o{ GameSession : logs
    Achievement ||--o{ UserAchievement : defines
```

---

## 二、Layer 1：公開宣傳與會員認證層 (Public Marketing & Authentication)

### 1. `User`（使用者帳號主表）*現存*
- **用途**：全平台使用者統一帳號主檔，維護登入憑證與帳號安全狀態。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 外鍵關聯 | 說明 |
  |---|---|:---:|:---:|---|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | — | 帳號唯一識別碼 (PK) |
  | `email` | VarChar(255) | 是 | 是 | — | — | 登入電子郵件，全小寫規範 |
  | `passwordHash` | VarChar(255) | 是 | 否 | — | — | bcrypt 加密字串 (成本 12) |
  | `displayName` | VarChar(100) | 是 | 否 | — | — | 平台顯示暱稱/真實姓名 |
  | `avatarUrl` | Text | 否 | 否 | NULL | — | 大頭照 CDN 儲存路徑 |
  | `status` | VarChar(30) | 是 | 否 | `'ACTIVE'` | — | `ACTIVE`, `SUSPENDED`, `PENDING_VERIFY` |
  | `emailVerifiedAt` | Timestamp(3) | 否 | 否 | NULL | — | 信箱驗證完成時間 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | — | 建立時間 |
  | `updatedAt` | Timestamp(3) | 是 | 否 | `NOW()` | — | 最後異動時間 |
  | `deletedAt` | Timestamp(3) | 否 | 否 | NULL | — | 軟刪除標記時間 |
- **刪除策略**：不執行物理刪除（採用軟刪除 `deletedAt` 標記）。
- **隱私等級**：`L4 - Restricted (PII)`。
- **稽核需求**：密碼變更、狀態變更、軟刪除需寫入 `AuditLog`。

### 2. `Role`（系統角色主表）*現存*
- **用途**：定義系統 RBAC 角色名稱與權責。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 角色代碼 (PK) |
  | `name` | VarChar(50) | 是 | 是 | — | `STUDENT`, `TEACHER`, `ADMIN`, `SYSTEM_OPERATOR` |
  | `description` | Text | 否 | 否 | NULL | 角色權限說明 |
- **隱私等級**：`L1 - Public`。

### 3. `UserRole`（使用者與角色對照表）*現存*
- **用途**：支援一人多角色（例如同一個帳號既是學生亦是認證教師）。
- **外鍵與約束**：`userId` -> `User.id` (Cascade), `roleId` -> `Role.id` (Cascade), 複合唯一鍵 `@@unique([userId, roleId])`。

### 4. `Session`（安全連線階段表）*現存*
- **用途**：後端 Stateful Session 管理，配合 HttpOnly Cookie 杜絕 XSS 竊取 Token。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 連線 ID (PK) |
  | `userId` | UUID / String | 是 | 否 | — | FK -> `User.id` (Cascade) |
  | `tokenHash` | VarChar(64) | 是 | 是 | — | SHA-256 雜湊後的 Session Token |
  | `ipAddress` | VarChar(45) | 否 | 否 | NULL | 登入來源 IP (支援 IPv6) |
  | `userAgent` | Text | 否 | 否 | NULL | 瀏覽器代理字串 |
  | `expiresAt` | Timestamp(3) | 是 | 否 | — | Session 逾期失效時間 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 建立時間 |
  | `revokedAt` | Timestamp(3) | 否 | 否 | NULL | 提前撤銷/登出時間 |
- **隱私等級**：`L3 - Confidential`。

### 5. `TermsAgreement`（條款與隱私同意紀錄）*新需求*
- **用途**：符合個人資料保護法，記錄使用者同意服務條款與隱私權政策之法律佐證。
- **欄位規格**：`id`, `userId` (FK), `termsVersion` (VarChar 20), `privacyVersion` (VarChar 20), `agreedAt` (Timestamp), `ipAddress` (VarChar 45)。
- **隱私等級**：`L3 - Confidential`。

---

## 三、Layer 2：學生學習平台層 (Student Learning Platform)

### 6. `Certification`（專業證照主表）*新需求*
- **用途**：集中管理勞動部國家檢定、APCS 與國際原廠檢定主數據。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | VarChar(50) | 是 | 是 | — | 證照代碼 (PK)，如 `web-design-c` |
  | `code` | VarChar(30) | 是 | 是 | — | 官方代碼，如 `17300` |
  | `name` | VarChar(100) | 是 | 否 | — | 證照中文名稱（網頁設計丙級） |
  | `englishName`| VarChar(150) | 否 | 否 | NULL | 英文官方名稱 |
  | `category` | VarChar(50) | 是 | 否 | — | `web`, `software`, `network`, `ai` |
  | `level` | VarChar(20) | 是 | 否 | — | `C` (丙級), `B` (乙級), `A` (甲級), `SPECIAL` |
  | `passingScore` | Integer | 是 | 否 | 60 | 及格基準分數 (預設 60 分) |
  | `timeLimitMinutes`| Integer | 是 | 否 | 100 | 測驗建議時限 (分鐘) |
  | `status` | VarChar(20) | 是 | 否 | `'ACTIVE'` | `'ACTIVE'`, `'MAINTENANCE'`, `'ARCHIVED'` |
- **隱私等級**：`L1 - Public`。

### 7. `Subject`（考試科目表）*新需求*
- **用途**：分類證照考科（例如：共同科目「90006職業安全衛生」、專業學科科目）。
- **外鍵**：`certId` -> `Certification.id` (Cascade)。
- **隱私等級**：`L1 - Public`。

### 8. `Question`（學科題庫主表）*新需求*
- **用途**：取代現有前端靜態題庫陣列，正式納入後端資料庫管理。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 題目唯一序號 (PK) |
  | `subjectId` | UUID / String | 是 | 否 | — | FK -> `Subject.id` (Restrict) |
  | `questionNumber` | Integer | 是 | 否 | — | 官方卷面題號 |
  | `questionText` | Text | 是 | 否 | — | 題目主幹內文 (支援 Markdown/圖表標籤) |
  | `questionType` | VarChar(20) | 是 | 否 | `'SINGLE_CHOICE'` | `'SINGLE_CHOICE'`, `'MULTIPLE_CHOICE'`, `'TRUE_FALSE'` |
  | `difficulty` | VarChar(20) | 是 | 否 | `'MEDIUM'` | `'EASY'`, `'MEDIUM'`, `'HARD'` |
  | `explanation` | Text | 否 | 否 | NULL | 官方或 AI 詳解指引 |
  | `correctAnswer` | VarChar(20) | 是 | 否 | — | 正確答案識別碼（如 `'2'` 或 `'1,3'`） |
  | `sourceRef` | VarChar(100) | 否 | 否 | NULL | 官方題庫版次標記 (如 `173003B12`) |
  | `status` | VarChar(20) | 是 | 否 | `'ACTIVE'` | `'ACTIVE'`, `'REVIEWING'`, `'DISABLED'` |
- **隱私等級**：`L1 - Public`。

### 9. `QuestionOption`（學科選項表）*新需求*
- **用途**：一對多儲存題目選項（1、2、3、4）。
- **外鍵**：`questionId` -> `Question.id` (Cascade Delete)。
- **欄位**：`id`, `questionId`, `optionKey` (VarChar 5), `optionText` (Text), `isCorrect` (Boolean)。

### 10. `ExamAttempt`（測驗作答記錄主表）*新需求*
- **用途**：記錄學生進行全真模考或學科練習之作答歷程。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 測驗卷作答 ID (PK) |
  | `userId` | UUID / String | 是 | 否 | — | FK -> `User.id` (Cascade) |
  | `certId` | VarChar(50) | 是 | 否 | — | FK -> `Certification.id` |
  | `assignedExamId`| UUID / String | 否 | 否 | NULL | FK -> `AssignedExam.id` (若為班級作業) |
  | `mode` | VarChar(20) | 是 | 否 | `'PRACTICE'` | `'MOCK_EXAM'`, `'PRACTICE'`, `'ASSIGNED_HOMEWORK'` |
  | `score` | Decimal(5,2) | 否 | 否 | NULL | 測驗結算總分 |
  | `isPassed` | Boolean | 否 | 否 | NULL | 是否達到及格門檻 |
  | `totalQuestions` | Integer | 是 | 否 | 0 | 總題數 |
  | `correctQuestions` | Integer | 是 | 否 | 0 | 答對題數 |
  | `startedAt` | Timestamp(3) | 是 | 否 | `NOW()` | 開考時間 |
  | `submittedAt` | Timestamp(3) | 否 | 否 | NULL | 完卷交卷時間 |
  | `durationSeconds`| Integer | 否 | 否 | NULL | 實際作答耗時 (秒) |
  | `status` | VarChar(20) | 是 | 否 | `'IN_PROGRESS'` | `'IN_PROGRESS'`, `'SUBMITTED'`, `'TIMEOUT'`, `'ABANDONED'` |
- **隱私等級**：`L3 - Confidential`（個人學習紀錄）。

### 11. `ExamAnswer`（單題作答細項表）*新需求*
- **用途**：記錄使用者在每題的作答選擇與耗時。
- **外鍵**：`attemptId` -> `ExamAttempt.id` (Cascade), `questionId` -> `Question.id` (Restrict)。
- **欄位**：`id`, `attemptId`, `questionId`, `userChoice`, `isCorrect`, `spentMs`。

### 12. `UserProgress`（學生個人進度累計表）*新需求*
- **用途**：儲存個人學習儀表板之累計數據與遺忘曲線指標。
- **約束**：複合唯一鍵 `@@unique([userId, certId])`。
- **欄位**：`id`, `userId`, `certId`, `totalAttempted`, `totalCorrect`, `accuracyRate`, `lastStudiedAt`, `streakDays`。

### 13. `WrongQuestion`（錯題本）*新需求*
- **用途**：智能錯題集中營，支援個人化複習與消滅錯題演算法。
- **約束**：複合唯一鍵 `@@unique([userId, questionId])`。
- **欄位**：`id`, `userId`, `questionId`, `failCount`, `lastFailedAt`, `isMastered` (Boolean)。

### 14. `Bookmark`（題目收藏）與 `LearningNote`（個人學習筆記）*新需求*
- **用途**：收藏特定題目與註記解題心得，支援跨裝置雲端同步。
- **外鍵**：皆串接 `User.id` (Cascade) 與 `Question.id` (Cascade)。

### 15. `PracticalTask`（術科正式題組表）*新需求*
- **用途**：收錄網頁設計丙級五大題組（17300-104301~104305）之解題指引與規範。
- **欄位**：`id`, `certId`, `taskCode`, `taskName`, `description`, `layoutRulesJson`, `status`。

### 16. `PracticalAsset`（術科素材索引表）*新需求*
- **用途**：收錄題組所附 85 個素材檔之元數據、雜湊與官方路徑。
- **外鍵**：`taskId` -> `PracticalTask.id` (Cascade)。

---

## 四、Layer 3：教師教學管理層 (Educator Platform)

### 17. `TeacherProfile`（教師擴充資料表）*新需求*
- **用途**：維護已通過資格認證之教師教學機構、專長領域與審核紀錄。
- **外鍵**：`userId` -> `User.id` (Unique, Cascade)。
- **欄位**：`id`, `userId`, `schoolName`, `department`, `title`, `verifiedAt`, `verifiedBy`。
- **隱私等級**：`L4 - Restricted (PII)`。

### 18. `Class`（班級主表）*新需求*
- **用途**：教師所建立之教學班級或培訓梯次。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 班級識別碼 (PK) |
  | `name` | VarChar(100) | 是 | 否 | — | 班級名稱（如：資訊科三年甲班） |
  | `code` | VarChar(20) | 是 | 是 | — | 系統班級代碼 |
  | `inviteCode` | VarChar(12) | 是 | 是 | — | 學生自主加入邀請碼 (大寫英數 8 碼) |
  | `schoolYear` | VarChar(10) | 是 | 否 | — | 學年度（如 `114-1`） |
  | `createdById` | UUID / String | 是 | 否 | — | 建立該班之導師 FK -> `User.id` |
  | `status` | VarChar(20) | 是 | 否 | `'ACTIVE'` | `'ACTIVE'`, `'ARCHIVED'`, `'DISABLED'` |
- **隱私等級**：`L3 - Confidential`。

### 19. `ClassTeacher`（班級教師指派表）*新需求*
- **用途**：解決協同教學與助教指派，支援一班多位任課老師。
- **約束**：複合唯一鍵 `@@unique([classId, teacherId])`。
- **外鍵**：`classId` -> `Class.id` (Cascade), `teacherId` -> `User.id` (Cascade)。
- **欄位**：`roleInClass` (`HEAD_TEACHER`, `SUBJECT_TEACHER`, `TEACHING_ASSISTANT`)。

### 20. `Enrollment`（學生入班名冊表）*新需求*
- **用途**：管理學生加入班級之學籍關聯與座號。
- **約束**：複合唯一鍵 `@@unique([classId, studentId])`。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 入班紀錄 ID (PK) |
  | `classId` | UUID / String | 是 | 否 | — | FK -> `Class.id` (Cascade) |
  | `studentId` | UUID / String | 是 | 否 | — | FK -> `User.id` (Cascade) |
  | `seatNumber` | Integer | 否 | 否 | NULL | 班級座號 |
  | `joinedAt` | Timestamp(3) | 是 | 否 | `NOW()` | 入班時間 |
  | `status` | VarChar(20) | 是 | 否 | `'ENROLLED'` | `'ENROLLED'`, `'SUSPENDED'`, `'DROPPED'` |
- **隱私等級**：`L4 - Restricted (PII)`（涉及學籍與師生歸屬）。

### 21. `AssignedExam`（班級指派作業/測驗表）*新需求*
- **用途**：任課教師為特定班級排定之測驗或課後作業。
- **外鍵**：`classId` -> `Class.id`, `certId` -> `Certification.id`, `assignedById` -> `User.id`。
- **欄位**：`title`, `dueAt` (截止時間), `maxAttempts` (最大作答次數), `passingScore`。

---

## 五、Layer 4：平台管理層 (Platform Administration)

### 22. `TeacherApplication`（教師身分認證審核表）*現存*
- **用途**：記錄一般使用者申請成為認證教師之證明文件與平台審核流。
- **欄位**：`id`, `userId` (FK), `schoolName`, `subject`, `reason`, `proofUrl`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `reviewedBy` (FK), `reviewedAt`, `reviewNote`。
- **隱私等級**：`L4 - Restricted (PII)`。

### 23. `AdminAuditLog`（管理員高風險操作稽核表）*新需求 (擴充現有 AuditLog)*
- **用途**：落實 ISO 27001 與資安要求，不可竄改記錄管理員所有審核、封鎖與提權操作。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 稽核日誌 ID (PK) |
  | `operatorId` | UUID / String | 否 | 否 | NULL | 操作者 FK -> `User.id` (SetNull) |
  | `targetType` | VarChar(50) | 是 | 否 | — | 被操作對象（`USER`, `TEACHER_APP`, `QUESTION`） |
  | `targetId` | VarChar(100) | 是 | 否 | — | 被操作實體 ID |
  | `action` | VarChar(50) | 是 | 否 | — | `APPROVE_TEACHER`, `SUSPEND_USER`, `MODIFY_QUESTION` |
  | `beforeData` | JSONB | 否 | 否 | NULL | 異動前資料快照 (遮蔽密碼) |
  | `afterData` | JSONB | 否 | 否 | NULL | 異動後資料快照 |
  | `ipAddress` | VarChar(45) | 是 | 否 | — | 操作來源 IP |
  | `userAgent` | Text | 否 | 否 | NULL | 瀏覽器標頭 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 操作時間戳 |
- **刪除策略**：**嚴禁刪除（WORM 策略：Write Once, Read Many）**。
- **隱私等級**：`L3 - Confidential`。

---

## 六、Layer 5：系統維運與監控層 (Operations & Telemetry)

### 24. `AIUsageLog`（AI 教練呼叫成本與用量日誌）*新需求*
- **用途**：記錄學生/教師呼叫 Gemini AI 鷹架引導之 Token 消耗與延遲，避免 API 配額爆量。
- **欄位**：`id`, `userId` (FK), `promptType` (`EXPLANATION`, `HINT_SCAFFOLD`, `DEBUG_HELP`), `inputTokens`, `outputTokens`, `latencyMs`, `status`, `createdAt`。

### 25. `SystemAlert` 與 `APIHealthLog`（系統健康與異常警報）*新需求*
- **用途**：儲存後端資料庫連線失敗、伺服器 500 異常與主機重啟事件。

---

## 七、跨層服務：公告、通知與非同步郵件傳遞系統 (Announcements & Notification Service)

### 26. `Announcement`（全平台與教學綜合公告主表）*新增規格*
- **用途**：集中儲存平台官方公告（Category A）與使用者教學公告（Category B）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 公告主鍵 ID (PK) |
  | `category` | Enum | 是 | 否 | — | `PLATFORM`（平台官方）或 `EDUCATIONAL`（教學與互動） |
  | `type` | Enum | 是 | 否 | — | 公告子類型：`FEATURE_UPDATE`, `NEW_CERTIFICATION`, `NEW_FEATURE`, `PLATFORM_EVENT`, `PLATFORM_POLICY`, `SYSTEM_MAINTENANCE`, `SYSTEM_INCIDENT`, `RELEASE_NOTE`, `CLASS`, `PERSONAL`, `EXAM`, `ASSIGNMENT`, `LEARNING_SHARE`, `DISCUSSION` |
  | `title` | VarChar(200) | 是 | 否 | — | 公告主標題 |
  | `summary` | VarChar(500) | 否 | 否 | NULL | 摘要簡介（用於前台預覽與通知卡片） |
  | `content` | Text | 是 | 否 | — | 完整內容（支援安全過濾之 Markdown / HTML） |
  | `priority` | Enum | 是 | 否 | `NORMAL` | 重要度：`LOW`, `NORMAL`, `HIGH`, `URGENT` |
  | `status` | Enum | 是 | 否 | `DRAFT` | 狀態：`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `WITHDRAWN`, `ARCHIVED` |
  | `authorId` | UUID / String | 是 | 否 | — | 發布者 FK -> `User.id` |
  | `publishedAt` | Timestamp(3) | 否 | 否 | NULL | 正式公開上架時間 |
  | `expiresAt` | Timestamp(3) | 否 | 否 | NULL | 下架過期時間（可為空，表示長期有效） |
  | `isPinned` | Boolean | 是 | 否 | `false` | 是否置頂 |
  | `pinnedUntil` | Timestamp(3) | 否 | 否 | NULL | 置頂結束時間 |
  | `sendEmail` | Boolean | 是 | 否 | `false` | 是否觸發非同步郵件發送 |
  | `viewCount` | Integer | 是 | 否 | 0 | 瀏覽次數計數器 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 建立時間 |
  | `updatedAt` | Timestamp(3) | 是 | 否 | `NOW()` | 更新時間 |
- **隱私與安全等級**：`L1 - Public`（公開公告）或 `L2 - Internal`（班級/個人通知）。

### 27. `AnnouncementTarget`（受眾定位與發布範圍表）*新增規格*
- **用途**：支援靈活的多重目標派送（全站、特定角色、特定班級、指定個別使用者）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 目標關聯 ID (PK) |
  | `announcementId`| UUID / String | 是 | 否 | — | 所屬公告 FK -> `Announcement.id` |
  | `targetType` | Enum | 是 | 否 | — | 目標類型：`ALL`（所有人）, `ROLE`（指定角色）, `CLASS`（指定班級）, `USER`（指定使用者） |
  | `targetValue` | VarChar(100) | 是 | 否 | — | 目標值：`ALL`、`STUDENT`、`TEACHER`、班級 ID 或 使用者 ID |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 建立時間 |
- **索引**：`@@index([announcementId])`, `@@index([targetType, targetValue])`。

### 28. `AnnouncementRead`（閱讀狀態與已讀回條記錄表）*新增規格*
- **用途**：記錄個別使用者對指定公告的首次與最後閱讀時間（避免重複標註，支援學生已讀追蹤）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 記錄主鍵 (PK) |
  | `announcementId`| UUID / String | 是 | 否 | — | 公告 FK -> `Announcement.id` |
  | `userId` | UUID / String | 是 | 否 | — | 讀者 FK -> `User.id` |
  | `firstReadAt` | Timestamp(3) | 是 | 否 | `NOW()` | 首次閱讀時間戳 |
  | `lastReadAt` | Timestamp(3) | 是 | 否 | `NOW()` | 最近閱讀時間戳 |
- **約束**：`@@unique([announcementId, userId])`。

### 29. `AnnouncementAttachment`（公告附件與資源清單表）*新增規格*
- **用途**：關聯教學範例、作業規範、考試說明或更新簡報等儲存於物件儲存之檔案。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 附件 ID (PK) |
  | `announcementId`| UUID / String | 是 | 否 | — | 公告 FK -> `Announcement.id` |
  | `fileName` | VarChar(255) | 是 | 否 | — | 原始檔名 |
  | `fileUrl` | Text | 是 | 否 | — | 安全下載 URL / GCS 儲存路徑 |
  | `fileSize` | Integer | 是 | 否 | — | 檔案位元組大小 (Bytes) |
  | `mimeType` | VarChar(100) | 是 | 否 | — | MIME 類型（限制安全型別） |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 建立時間 |

### 30. `AnnouncementModeration`（學生分享檢舉與審核紀錄表）*新增規格*
- **用途**：確保學生自主發布之「學習心得分享」與「互助討論」符合校園安全守則，提供教師與管理員審核下架紀錄。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 審核紀錄 ID (PK) |
  | `announcementId`| UUID / String | 是 | 否 | — | 被檢舉公告 FK -> `Announcement.id` |
  | `reporterId` | UUID / String | 否 | 否 | NULL | 檢舉人 FK -> `User.id` |
  | `moderatorId` | UUID / String | 否 | 否 | NULL | 處理者 FK -> `User.id` (教師或管理員) |
  | `action` | Enum | 是 | 否 | — | `FLAGGED`, `APPROVED`, `REJECTED`, `TAKEN_DOWN` |
  | `reason` | VarChar(255) | 是 | 否 | — | 檢舉或處分原因（如不當言語、版權侵權） |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 處理時間 |

### 31. `Notification`（使用者個人即時站內通知表）*新增規格*
- **用途**：由公告、作業指派、考試完成等事件觸發產生的個人即時通知（支援鈴鐺紅點計數）。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 通知 ID (PK) |
  | `userId` | UUID / String | 是 | 否 | — | 受訊者 FK -> `User.id` |
  | `type` | Enum | 是 | 否 | — | `ANNOUNCEMENT`, `EXAM_ASSIGNED`, `EXAM_GRADED`, `SYSTEM` |
  | `title` | VarChar(200) | 是 | 否 | — | 通知短標題 |
  | `message` | Text | 是 | 否 | — | 通知短摘要 |
  | `linkUrl` | VarChar(500) | 否 | 否 | NULL | 點擊跳轉目標路徑 |
  | `isRead` | Boolean | 是 | 否 | `false` | 是否已讀 |
  | `readAt` | Timestamp(3) | 否 | 否 | NULL | 已讀時間 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 產生時間 |
- **索引**：`@@index([userId, isRead, createdAt])`。

### 32. `EmailQueue`（非同步郵件排程與傳遞佇列）*新增規格*
- **用途**：非同步解耦儲存待寄送郵件，防止 SMTP/SendGrid 延遲阻塞 API 主執行緒；嚴禁重複儲存大 HTML，僅參照公告 ID 與範本參數。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 佇列 ID (PK) |
  | `recipientEmail`| VarChar(255) | 是 | 否 | — | 收件者 Email (加密遮蔽儲存或遵守個資政策) |
  | `recipientName` | VarChar(100) | 否 | 否 | NULL | 收件者稱謂 |
  | `subject` | VarChar(255) | 是 | 否 | — | 郵件標題 |
  | `templateKey` | VarChar(50) | 是 | 否 | — | 範本鍵名（如 `ANNOUNCEMENT_NOTIFY`） |
  | `templateData` | JSONB | 否 | 否 | NULL | 動態變數（如公告標題、摘要、連結、收件人稱呼） |
  | `announcementId`| UUID / String | 否 | 否 | NULL | 關聯公告 FK -> `Announcement.id` (可為空) |
  | `status` | Enum | 是 | 否 | `PENDING` | 狀態：`PENDING`, `PROCESSING`, `SENT`, `FAILED` |
  | `retryCount` | Integer | 是 | 否 | 0 | 重試次數（上限 3 次） |
  | `lastError` | Text | 否 | 否 | NULL | 最近一次發送失敗原因 |
  | `scheduledAt` | Timestamp(3) | 是 | 否 | `NOW()` | 預計寄送時間 |
  | `processedAt` | Timestamp(3) | 否 | 否 | NULL | 實際處理時間 |
  | `createdAt` | Timestamp(3) | 是 | 否 | `NOW()` | 排入佇列時間 |
- **索引**：`@@index([status, scheduledAt])`。

### 33. `EmailDeliveryLog`（郵件寄送日誌與投遞審計表）*新增規格*
- **用途**：記錄每封郵件的真實投遞紀錄與供應商訊息識別碼（Message ID），提供排錯與反垃圾郵件審計。
- **欄位規格**：
  | 欄位名稱 | 型別 | 必填 | 唯一 | 預設值 | 說明 |
  |---|---|:---:|:---:|---|---|
  | `id` | UUID / String | 是 | 是 | `gen_random_uuid()` | 日誌 ID (PK) |
  | `queueId` | UUID / String | 否 | 否 | NULL | 來源佇列 ID |
  | `recipientEmail`| VarChar(255) | 是 | 否 | — | 收信信箱 |
  | `status` | VarChar(30) | 是 | 否 | — | `SUCCESS`, `BOUNCED`, `DROPPED`, `MOCK_CONSOLE_LOGGED` |
  | `providerMsgId`| VarChar(100) | 否 | 否 | NULL | 郵件服務商回傳之 Message ID |
  | `deliveredAt` | Timestamp(3) | 是 | 否 | `NOW()` | 投遞紀錄時間戳 |

---

## 八、資料庫關聯完整性與外鍵級聯矩陣

| 主資料表 (Parent) | 子資料表 (Child) | 外鍵欄位 | 級聯刪除策略 (On Delete) | 業務考量與保護機制 |
|---|---|---|:---:|---|
| `User` | `Session` | `userId` | **CASCADE** | 使用者帳號註銷時，自動使所有連線階段失效。 |
| `User` | `UserProfile` | `userId` | **CASCADE** | 個人檔案隨使用者帳號同步移除。 |
| `User` | `UserRole` | `userId` | **CASCADE** | 移除帳號自動解除角色關聯。 |
| `User` | `ExamAttempt` | `userId` | **RESTRICT** | 具備正式作答紀錄之學生帳號禁止直接物理刪除（需採軟刪除）。 |
| `Class` | `Enrollment` | `classId` | **CASCADE** | 班級解散或刪除時，連帶解除入班名冊。 |
| `Class` | `AssignedExam` | `classId` | **CASCADE** | 班級刪除時連帶清理指派作業。 |
| `Question` | `QuestionOption` | `questionId` | **CASCADE** | 題目刪除時連帶清理選項。 |
| `Question` | `ExamAnswer` | `questionId` | **RESTRICT** | 已有人作答過的題目嚴禁直接刪除，避免歷史成績資料損壞。 |
| `Certification` | `Subject` | `certId` | **RESTRICT** | 證照下尚有考科與題庫時禁止刪除。 |
| `Announcement` | `AnnouncementTarget` | `announcementId` | **CASCADE** | 公告物理刪除時，連帶清理受眾關聯記錄。 |
| `Announcement` | `AnnouncementRead` | `announcementId` | **CASCADE** | 公告刪除時連帶清理已讀回條記錄。 |
| `Announcement` | `AnnouncementAttachment` | `announcementId` | **CASCADE** | 公告刪除時連帶清理附件記錄（實體檔案需額外非同步清理）。 |
| `Announcement` | `AnnouncementModeration` | `announcementId` | **CASCADE** | 公告刪除時連帶清理審核紀錄。 |
| `Announcement` | `Notification` | `announcementId` | **CASCADE** | 公告撤回或刪除時，對應之站內通知關聯清除。 |
| `Announcement` | `EmailQueue` | `announcementId` | **SET NULL** | 公告刪除後，郵件傳遞佇列保留歷史寄件審計，外鍵設為 NULL。 |
| `User` | `Announcement` | `authorId` | **RESTRICT** | 使用者帳號若有發布公告歷史，嚴禁直接實體刪除（避免公告斷頭，需採用軟刪除或轉移發布者）。 |
| `User` | `AnnouncementRead` | `userId` | **CASCADE** | 使用者帳號註銷時，清理其個人已讀記錄。 |
| `User` | `Notification` | `userId` | **CASCADE** | 使用者帳號註銷時，清理其所有站內通知。 |
