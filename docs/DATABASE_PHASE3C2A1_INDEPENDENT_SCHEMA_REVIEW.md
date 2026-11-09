# CODE TO KNOW（碼上學）
# PHASE 3C-2A.1：Prisma Schema 獨立複核與 Migration 前安全檢查報告
## (Phase 3C-2A.1 Independent Schema Audit & Pre-Migration Safety Review)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-2A.1 Independent Audit)
- **審查日期**：2026-11-08
- **文件路徑**：`docs/DATABASE_PHASE3C2A1_INDEPENDENT_SCHEMA_REVIEW.md`
- **審查團隊**：資深 PostgreSQL 資料庫架構師、Prisma ORM 架構師、TypeScript/Node.js 後端工程師、資料安全與隱私審查工程師、軟體測試與品質保證工程師
- **審查性質**：**唯讀獨立架構複核與安全性審查（STRICTLY READ-ONLY AUDIT）**
- **操作約束**：**無 Schema 修改、無 Migration 建立、無資料庫寫入、無 Git Commit/Push、無 Git Reset/Clean**

---

## 一、執行摘要 (Executive Summary)

本階段針對 Phase 3C-2A 所宣告之 `backend/prisma/schema.prisma`（包含 9 個既有核心 Model 與 27 個新增業務 Model，總計 36 個 Prisma Model），在進入正式資料庫遷移（Migration）前進行**全面性、逐行逐欄的獨立安全性與架構健全度複核**。

### 核心查核判定：
1. **Model 與欄位架構完整性**：36 個 Model 全部完成語法、欄位型別、主鍵、外鍵、索引與反向關聯（Back-relations）雙向校驗，**零重複命名、零孤立 Model、零語法衝突**。
2. **Cascade 刪除風險評估**：識別出 8 大類級聯風險。核心確認：`ExamAnswerSnapshot` 成功以 `onDelete: SetNull` 與題庫解耦；`ExamAttempt` 透過 `onDelete: Restrict` 嚴格防止試卷刪除導致學生成績抹除。針對 `ClassAssignment` 關聯 `ExamPaper` 與 `PracticalTask` 之 Cascade 設定，提出 Migration 前之重要安全優化建議。
3. **術科雙版本進度隔離**：`PracticalProgress` 具備核心唯一約束 `@@unique([userId, taskId, version])`，保證 Version A 與 Version B 進度互不覆蓋。同時誠實揭露「純 Prisma 單欄外鍵無法在資料庫層級跨表校驗 `PracticalStepProgress` 步驟版本與題組進度版本一致性」，明確列出後端應用層校驗規範。
4. **既有資料庫相容性**：既有 9 張資料表（包含 4 位既有 User 及關聯 Token/Session）**未遭受任何不相容的 NOT NULL 欄位修改**；新增之 27 個 Model 皆為全新資料表，具備完美之向後相容性（Backward Compatibility）。
5. **Git 狀態與報告矛盾查明**：經 Git 底層物件與歷史紀錄核對，完整還原「工作目錄中既有 17 個修改檔案早在 Phase 3C-2A 啟動前即存在於 Working Tree」之客觀事實，破除上一份報告摘要描述造成的認知混淆。

---

## 二、36 個 Model 完整性清單 (Complete 36-Model Schema Inventory)

經逐一檢查 `backend/prisma/schema.prisma`，全系統 36 個 Model 之欄位、型別、鍵約束與索引配置如下：

```mermaid
graph TD
    subgraph Core["核心身分與資安層 (9 Models - 已存在於本機 DB)"]
        User --> UserRole
        Role --> UserRole
        User --> UserProfile
        User --> Session
        User --> TeacherApplication
        User --> EmailVerificationToken
        User --> PasswordResetToken
        User -.->|SetNull| AuditLog
    end

    subgraph PublicL1["第一層：全站公告 (2 Models - 新增)"]
        User --> Announcement
        Announcement --> AnnouncementRead
        User --> AnnouncementRead
    end

    subgraph QBankL4["第四層：證照與題庫 (6 Models - 新增)"]
        Certification --> Subject
        Subject --> Question
        Question --> QuestionOption
        Question --> QuestionTagRelation
        QuestionTag --> QuestionTagRelation
    end

    subgraph StudentL2["第二層：學生學習歷程 (5 Models - 新增)"]
        User --> CertificationEnrollment
        Certification --> CertificationEnrollment
        User --> UnitProgress
        Subject --> UnitProgress
        User --> WrongQuestionRecord
        Question --> WrongQuestionRecord
        User --> QuestionBookmark
        Question --> QuestionBookmark
        User --> StudyTimeLog
    end

    subgraph TeacherL3["第三層：教師與班級 (4 Models - 新增)"]
        User --> TeacherProfile
        User --> Class
        Certification --> Class
        Class --> ClassEnrollment
        User --> ClassEnrollment
        Class --> ClassAssignment
    end

    subgraph PracticalSys["術科練習系統 (4 Models - 新增)"]
        PracticalTask --> PracticalStep
        PracticalTask --> PracticalProgress
        User --> PracticalProgress
        PracticalProgress --> PracticalStepProgress
        PracticalStep --> PracticalStepProgress
    end

    subgraph MockExamSys["模擬測驗系統 (3 Models - 新增)"]
        Certification --> ExamPaper
        ExamPaper --> ExamAttempt
        User --> ExamAttempt
        ExamAttempt --> ExamAnswerSnapshot
        Question -.->|SetNull| ExamAnswerSnapshot
    end

    subgraph AICoachL5["第五層：AI 智慧學習 (3 Models - 新增)"]
        User --> AIChatSession
        AIChatSession --> AIChatMessage
        User --> StudentWeaknessAnalysis
        Subject --> StudentWeaknessAnalysis
    end
```

### 36 Model 詳細規格檢核表：

| 編號 | Model 名稱 | 類別 | 主鍵 (PK) | 唯一約束 (Unique) | 外鍵 (FK) 關聯目標 | 關鍵索引 (Index) | 檢核判定 |
|:---:|:---|:---:|:---|:---|:---|:---|:---:|
| **1** | `User` | 既有核心 | `id (UUID)` | `email` | 14 個關聯之主體端 | `[email]`, `[status]` | **PASS** |
| **2** | `Role` | 既有核心 | `id (UUID)` | `name` | 被 `UserRole` 引用 | `[name]` (Unique) | **PASS** |
| **3** | `UserRole` | 既有核心 | `id (UUID)` | `[userId, roleId]` | `User(Cascade)`, `Role(Cascade)` | `[userId]`, `[roleId]` | **PASS** |
| **4** | `UserProfile` | 既有核心 | `id (UUID)` | `userId` | `User(Cascade)` | `[userId]` (Unique) | **PASS** |
| **5** | `Session` | 既有核心 | `id (UUID)` | `tokenHash` | `User(Cascade)` | `[userId]`, `[tokenHash]` | **PASS** |
| **6** | `TeacherApplication`| 既有核心 | `id (UUID)` | 無 | `User(Cascade)` | `[userId]`, `[status]` | **PASS** |
| **7** | `EmailVerificationToken`| 既有核心 | `id (UUID)` | `tokenHash` | `User(Cascade)` | `[userId]`, `[tokenHash]` | **PASS** |
| **8** | `PasswordResetToken`| 既有核心 | `id (UUID)` | `tokenHash` | `User(Cascade)` | `[userId]`, `[tokenHash]` | **PASS** |
| **9** | `AuditLog` | 既有核心 | `id (UUID)` | 無 | `User(SetNull)` | `[userId]`, `[action]`, `[createdAt]` | **PASS** |
| **10** | `Announcement` | 新增業務 | `id (UUID)` | 無 | `User(Restrict)` | `[publishedAt]`, `[targetRole]`, `[status]`, `[isPinned]`, `[category]`, `[authorId]` | **PASS** |
| **11** | `AnnouncementRead` | 新增業務 | `id (UUID)` | `[announcementId, userId]` | `Announcement(Cascade)`, `User(Cascade)` | `[userId]`, `[announcementId]` | **PASS** |
| **12** | `Certification` | 新增業務 | `id (UUID)` | `code` | 被 Subject, Class, ExamPaper, Enrollment 引用 | `[code]`, `[status]` | **PASS** |
| **13** | `Subject` | 新增業務 | `id (UUID)` | `[certificationId, code]` | `Certification(Cascade)` | `[certificationId]` | **PASS** |
| **14** | `Question` | 新增業務 | `id (UUID)` | 無 | `Subject(Restrict)` | `[subjectId, status]`, `[difficulty]`, `[sourceVersion]` | **PASS** |
| **15** | `QuestionOption` | 新增業務 | `id (UUID)` | `[questionId, key]` | `Question(Cascade)` | `[questionId]` | **PASS** |
| **16** | `QuestionTag` | 新增業務 | `id (UUID)` | `name` | 被 QuestionTagRelation 引用 | `[name]` (Unique) | **PASS** |
| **17** | `QuestionTagRelation`| 新增業務 | 複合主鍵 `@@id([questionId, tagId])` | 無 | `Question(Cascade)`, `QuestionTag(Cascade)` | `[tagId]`, `[questionId]` | **PASS** |
| **18** | `CertificationEnrollment`| 新增業務 | `id (UUID)` | `[userId, certificationId]` | `User(Cascade)`, `Certification(Restrict)` | `[userId]`, `[certificationId]`, `[status]` | **PASS** |
| **19** | `UnitProgress` | 新增業務 | `id (UUID)` | `[userId, subjectId]` | `User(Cascade)`, `Subject(Cascade)` | `[userId]`, `[subjectId]` | **PASS** |
| **20** | `WrongQuestionRecord`| 新增業務 | `id (UUID)` | `[userId, questionId]` | `User(Cascade)`, `Question(Cascade)` | `[userId, isResolved]`, `[questionId]` | **PASS** |
| **21** | `QuestionBookmark` | 新增業務 | `id (UUID)` | `[userId, questionId]` | `User(Cascade)`, `Question(Cascade)` | `[userId]`, `[questionId]` | **PASS** |
| **22** | `StudyTimeLog` | 新增業務 | `id (UUID)` | `[userId, studyDate, moduleType]` | `User(Cascade)` | `[userId, studyDate]` | **PASS** |
| **23** | `TeacherProfile` | 新增業務 | `id (UUID)` | `userId` | `User(Cascade)` | `[userId]` (Unique) | **PASS** |
| **24** | `Class` | 新增業務 | `id (UUID)` | `joinCode` | `User(Restrict)`, `Certification(Restrict)` | `[creatorId]`, `[certificationId]`, `[status]` | **PASS** |
| **25** | `ClassEnrollment`| 新增業務 | `id (UUID)` | `[classId, studentId]` | `Class(Cascade)`, `User(Cascade)` | `[studentId]`, `[classId]` | **PASS** |
| **26** | `ClassAssignment`| 新增業務 | `id (UUID)` | 無 | `Class(Cascade)`, `ExamPaper(Cascade)`, `PracticalTask(Cascade)` | `[classId]`, `[examPaperId]`, `[practicalTaskId]`, `[deadline]` | **PASS** |
| **27** | `PracticalTask` | 新增業務 | `id (UUID)` | `taskCode`, `taskNumber` | 被 PracticalStep, PracticalProgress, Assignment 引用 | `[taskCode]`, `[taskNumber]`, `[status]` | **PASS** |
| **28** | `PracticalStep` | 新增業務 | `id (UUID)` | `[taskId, version, stepNumber]` | `PracticalTask(Cascade)` | `[taskId]`, `[version]` | **PASS** |
| **29** | `PracticalProgress`| 新增業務 | `id (UUID)` | `[userId, taskId, version]` | `User(Cascade)`, `PracticalTask(Cascade)` | `[userId, taskId]`, `[status]` | **PASS** |
| **30** | `PracticalStepProgress`| 新增業務 | `id (UUID)` | `[progressId, stepId]` | `PracticalProgress(Cascade)`, `PracticalStep(Cascade)` | `[progressId]`, `[stepId]` | **PASS** |
| **31** | `ExamPaper` | 新增業務 | `id (UUID)` | 無 | `Certification(Restrict)` | `[certificationId]`, `[status]` | **PASS** |
| **32** | `ExamAttempt` | 新增業務 | `id (UUID)` | 無 | `User(Cascade)`, `ExamPaper(Restrict)` | `[userId, startedAt]`, `[examPaperId]`, `[status]` | **PASS** |
| **33** | `ExamAnswerSnapshot`| 新增業務 | `id (UUID)` | `[attemptId, questionOrder]` | `ExamAttempt(Cascade)`, `Question(SetNull)` | `[attemptId, isCorrect]`, `[questionId]` | **PASS** |
| **34** | `AIChatSession` | 新增業務 | `id (UUID)` | 無 | `User(Cascade)` | `[userId, createdAt]` | **PASS** |
| **35** | `AIChatMessage` | 新增業務 | `id (UUID)` | 無 | `AIChatSession(Cascade)` | `[sessionId, createdAt]` | **PASS** |
| **36** | `StudentWeaknessAnalysis`| 新增業務 | `id (UUID)` | `[userId, subjectId]` | `User(Cascade)`, `Subject(Cascade)` | `[userId]`, `[subjectId]` | **PASS** |

---

## 三、Cascade 刪除風險深度審查 (Cascade Deletion Risk Matrix)

經全域掃描 49 組外鍵關聯之 `onDelete` 行為，針對題目所列 8 大核心情境進行詳細分析：

| 序號 | 刪除情境 | 目前 Schema 刪除規則 | 可能連帶影響之從屬資料 | 風險等級 | 是否需保留歷史紀錄 | 審查評定與最佳防護策略 |
|:---:|:---|:---|:---|:---:|:---:|:---|
| **1** | **User 被物理刪除** | • 進度、錯題、書籤、測驗紀錄皆為 `Cascade`<br>• `AuditLog` 為 `SetNull`<br>• `Announcement` 為 `Restrict`<br>• `Class.creator` 為 `Restrict` | 學生個人之 `UnitProgress`, `WrongQuestionRecord`, `PracticalProgress`, `ExamAttempt`, `AIChatSession` 將全數連帶物理刪除。 | **HIGH** | **是**（帳號註銷需保有冷卻期與成果固化） | **合規防護**：日常營運採軟刪除（`User.deletedAt != null`），不會觸發物理級聯。若依個資法被遺忘權行使物理刪除，稽核日誌已透過 `SetNull` 保留，學術歷史成績若需去識別化存檔，後續可評估將 `ExamAttempt.userId` 轉為可空並改為 `SetNull`。 |
| **2** | **Certification 被刪除** | • `CertificationEnrollment`: `Restrict`<br>• `Class`: `Restrict`<br>• `ExamPaper`: `Restrict`<br>• `Subject`: `Cascade` | 若證照已被選修、開班或組卷，PostgreSQL 將**直接拒絕刪除**。 | **LOW** | **是** | **完全安全**：三大業務入口皆由 `Restrict` 築起堅固防線。證照過期採 `status = 'PREVIEW' / 'ARCHIVED'` 軟下架，絕不物理刪除。 |
| **3** | **Question 被刪除** | • `ExamAnswerSnapshot`: **`SetNull`**<br>• `WrongQuestionRecord`: `Cascade`<br>• `QuestionBookmark`: `Cascade`<br>• `QuestionOption`: `Cascade` | 歷史考試快照 `ExamAnswerSnapshot` 完整保留（僅 questionId 置 NULL）；錯題筆記本與書籤將被連帶清除。 | **MEDIUM** | **是** | **核心快照零受損**：最關鍵的考卷作答記錄完全獨立保存。題庫題目一律優先軟封存（`status = 'DEPRECATED'`），防止學生筆記無預警消失。 |
| **4** | **Class 被刪除** | • `ClassEnrollment`: `Cascade`<br>• `ClassAssignment`: `Cascade`<br>• `Class.creator`: `Restrict` | 該班級名冊與所有派發作業記錄將連帶清空。 | **HIGH** | **是** | **業務防線**：`Class.status` 支援 `ACTIVE` 與 `ARCHIVED`。班級學期結束一律轉入 `ARCHIVED` 封存。後續 API 必須限制管理員/教師不得物理 `DELETE` 有學員之班級。 |
| **5** | **ExamPaper 被刪除** | • `ExamAttempt`: **`Restrict`**<br>• `ClassAssignment`: `Cascade` | 若已有任何學生應試（存在 `ExamAttempt`），資料庫**嚴格禁止刪除試卷**！ | **LOW** | **是** | **學生成績絕對安全**：`onDelete: Restrict` 徹底杜絕了「試卷誤刪連帶消滅學生成績」的毀滅性風險。 |
| **6** | **PracticalTask 被刪除** | • `PracticalProgress`: `Cascade`<br>• `PracticalStep`: `Cascade`<br>• `ClassAssignment`: `Cascade` | 學生五大題組之實作程式碼與打勾進度連帶刪除。 | **HIGH** | **是** | **架構定性**：官方題組 104301~104305 為國家法定題綱，具備唯一性序號（`taskNumber` 1~5），屬於系統靜態資產，管理員 API 嚴禁暴露 DELETE 端點。建議在 Phase 3C-2B 將 `PracticalProgress.task` 調整為 `Restrict`。 |
| **7** | **AIChatSession 被刪除** | • `AIChatMessage`: `Cascade` | 該對話會話之所有提問與回答字串連帶清除。 | **LOW** | **否**（90天期滿依法清除） | **完全符合隱私政策**：貫徹個資法「目的消失即應刪除」原則。會話刪除時訊息內文連帶清空，弱點畫像已沉澱於 `StudentWeaknessAnalysis`。 |
| **8** | **Announcement 被刪除** | • `AnnouncementRead`: `Cascade`<br>• `author`: `Restrict` | 已讀標記紀錄連帶清除。 | **LOW** | **否** | **合理設計**：公告物理刪除時，其附屬之點閱計數追蹤連帶清理，符合資料表從屬生命週期。 |

---

### ClassAssignment 刪除策略深度對比專題

針對 `ClassAssignment` 關聯 `ExamPaper` 與 `PracticalTask` 之刪除行為評估：

```text
ClassAssignment (班級作業)
  ├── examPaperId      ──> ExamPaper (考卷樣板)
  └── practicalTaskId  ──> PracticalTask (術科題組)
```

| 刪除策略 | 運作機制 | 優點 | 缺點 / 風險 | 審查團隊評定 |
|:---|:---|:---|:---|:---:|
| **【現行】Cascade** | 試卷或題組被刪除時，作業記錄連帶消失。 | 乾淨不留孤兒紀錄。 | **高風險**：教師指派的歷史作業與學生成績關聯將被無預警抹除。 | ⚠️ 不推薦用於正式生產 |
| **【建議】Restrict** | 若試卷或題組已被指派為作業，**禁止刪除試卷/題組**。 | **最高安全性**：徹底保障教師教學成果與學生成績追溯性。 | 刪除樣板時需先手動處理作業，但教學系統本應如此。 | **首選推薦 (Optimal)** |
| **SetNull** | 試卷或題組被刪除時，外鍵欄位置 NULL。 | 保留作業主檔。 | **嚴重違反約束**：作業將同時失去雙外鍵，**直接破壞 XOR CHECK 約束**（兩個都變成 NULL）。 | ❌ 架構矛盾，不可行 |
| **軟刪除 (Soft Delete)** | 試卷與作業皆使用 `status = 'ARCHIVED'` 標記。 | 完整留存所有歷史紀錄。 | 需維護軟刪除過濾邏輯。 | **最佳業務實踐** |

> [!TIP]
> **Migration 建議**：
> 雖然目前 Schema 宣告為 `Cascade` 可正常生成，但在推進至 Phase 3C-2B 前，建議將 `ClassAssignment` 指向 `examPaper` 與 `practicalTask` 之關聯調整為 `onDelete: Restrict`，防護教師教學資產。

---

## 四、ClassAssignment XOR CHECK 審查 (Exclusive-OR Constraint)

### 1. Schema 現況確認
在 `backend/prisma/schema.prisma` 中：
```prisma
model ClassAssignment {
  id              String         @id @default(uuid())
  classId         String
  title           String
  type            String         // MOCK_EXAM, PRACTICAL_TASK
  examPaperId     String?        // FK to ExamPaper.id
  practicalTaskId String?        // FK to PracticalTask.id
  deadline        DateTime
  passingScore    Int            @default(60)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  class         Class          @relation(fields: [classId], references: [id], onDelete: Cascade)
  examPaper     ExamPaper?     @relation(fields: [examPaperId], references: [id], onDelete: Cascade)
  practicalTask PracticalTask? @relation(fields: [practicalTaskId], references: [id], onDelete: Cascade)

  @@index([classId])
  @@index([examPaperId])
  @@index([practicalTaskId])
  @@index([deadline])
}
```
- `examPaperId` 與 `practicalTaskId` 皆宣告為 `String?`（Nullable）。
- 各自具備對應 `ExamPaper` 與 `PracticalTask` 之獨立 Relation。

### 2. XOR CHECK 必要性
在商業邏輯上，一項作業**必須且只能**指向「一份模擬考卷」或「一組術科題組」其中之一：
- 兩者皆為 NULL：無效作業（孤立無目標）。
- 兩者皆有值：矛盾作業（無法判定繳交型態）。

### 3. 後續 Migration 建議附加原生 SQL（供 Phase 3C-2B 使用）

```sql
-- 標準 ANSI SQL 寫法：
ALTER TABLE "ClassAssignment" 
ADD CONSTRAINT "ClassAssignment_target_xor_check" 
CHECK (
  ("examPaperId" IS NOT NULL AND "practicalTaskId" IS NULL) OR
  ("examPaperId" IS NULL AND "practicalTaskId" IS NOT NULL)
);

-- 或 PostgreSQL 專屬簡潔寫法 (PostgreSQL 9.6+)：
ALTER TABLE "ClassAssignment" 
ADD CONSTRAINT "ClassAssignment_target_xor_check" 
CHECK (
  num_nonnulls("examPaperId", "practicalTaskId") = 1
);
```

*(聲明：本階段僅提供 SQL 設計，嚴格未執行任何 DDL 或 Migration。)*

---

## 五、術科雙版本隔離審查 (Practical Exam Version A/B Isolation)

### 1. 官方五大題組與版本區隔確認
- **題組主檔 (`PracticalTask`)**：
  - 鎖定官方題號：`104301`、`104302`、`104303`、`104304`、`104305`。
  - 約束保證：`taskCode` 與 `taskNumber (1~5)` 皆具備 `@unique`。
- **步驟指引 (`PracticalStep`)**：
  - 具備 `version String`（`VERSION_A` 官方教材 / `VERSION_B` 影音教學）。
  - 唯一約束：`@@unique([taskId, version, stepNumber])`。
- **使用者進度 (`PracticalProgress`)**：
  - 核心複合唯一鍵：`@@unique([userId, taskId, version])`。
  - **確認**：同一使用者針對同一題組，其 Version A 與 Version B 為兩筆獨立記錄，程式碼、練習次數與完成狀態完全隔離，絕不互相覆蓋。

### 2. 關鍵架構邊界查核：`PracticalStepProgress` 跨版本校驗

```text
PracticalProgress (userId, taskId, version='VERSION_B')
       │
       └──> PracticalStepProgress (progressId, stepId)
                                         │
                                         └──> PracticalStep (taskId, version='VERSION_A') ⚠️ 潛在交叉錯誤！
```

- **查核發現**：
  `PracticalStepProgress` 的外鍵定義為：
  - `progressId -> PracticalProgress.id`
  - `stepId -> PracticalStep.id`
  - 唯一性：`@@unique([progressId, stepId])`
- **架構誠實判定**：
  **目前 Prisma Schema 的單純外鍵無法在資料庫層級跨資料表保證 `step.version === progress.version` 與 `step.taskId === progress.taskId`。**
  若前端傳入 Version B 的 `progressId` 搭配 Version A 的 `stepId`，資料庫層不會主動阻斷。
- **具體處置方案**：
  1. **應用層第一道防線（必要）**：在後端 `practical.service.ts` 儲存打勾步驟時，先驗證 `step.version === progress.version`。
  2. **資料庫層第二道防線（Phase 3C-2B 可選）**：在 PostgreSQL 建立自訂 CHECK 或 Trigger，若版本不符即拋出異常。

---

## 六、ExamAnswerSnapshot 歷史完整性審查 (Historical Integrity & Freezing)

### 1. 固化欄位完整性核對
`ExamAnswerSnapshot` 定義了完整的唯讀作答事實欄位：
- `questionId String?`（解耦鍵，Nullable）。
- `questionTextSnapshot String @db.Text`（交卷時之完整題幹）。
- `optionsSnapshot String @db.Text`（交卷時之選項集合 JSON 快照）。
- `correctAnswerSnapshot String`（交卷時之正確答案標識）。
- `explanationSnapshot String? @db.Text`（交卷時之題目解析）。
- `userAnswer String?`（學生填答）。
- `isCorrect Boolean`（評分結果）。
- `scoreWeight Float` 與 `scoreObtained Float`（單題配分與得分）。

### 2. 歷史考卷獨立渲染能力
- **自給自足（Self-contained）**：前端考卷檢視頁面**完全不需要 JOIN `Question` 主表**，直接讀取 Snapshot 欄位即可完整還原整份考卷。
- **`onDelete: SetNull` 驗證**：若題庫某題目日後遭物理刪除，`questionId` 自動置空，快照記錄中的題幹、選項、答案與得分**毫髮無損**。
- **防洩漏資安要求**：經檢視，後端目前尚未實裝測驗業務 API。未來實作時必須遵守：`GET /api/exams/attempts/:id` 在 `status === 'IN_PROGRESS'` 期間，**嚴格禁止回傳 `correctAnswerSnapshot` 與 `explanationSnapshot`**，僅在 `SUBMITTED` 後方可下發。

---

## 七、既有資料 Migration 相容性審查 (Backward Compatibility Audit)

本機 Docker PostgreSQL 資料庫目前已有真實執行環境，非空白資料庫：
- `User`：4 筆既有帳號。
- `Role`：3 筆角色（STUDENT, TEACHER, PLATFORM_ADMIN）。
- `UserRole`：4 筆角色授權。
- `UserProfile`：4 筆個人檔案。
- `Session`：3 筆活躍會話。
- `TeacherApplication`：2 筆審批記錄。
- `AuditLog`：9 筆資安稽核記錄。

### 相容性各維度檢核：

1. **現存資料表變更檢驗**：
   - 經檢查，`schema.prisma` 在既有 9 個核心 Model 中，**完全沒有增加任何實體資料庫欄位**（僅在 `User` 增加了 Prisma 應用層的反向關聯虛擬陣列，這在 PostgreSQL DDL 中不產生任何欄位）。
   - **判定：既有 9 張資料表零 ALTER TABLE 負擔，既有資料 100% 安全。**
2. **新增 27 個 Model 之建表檢驗**：
   - 新增的 27 個 Model 皆映射為全新資料表（`CREATE TABLE`）。
   - 新資料表初始皆為 0 筆資料，因此所有宣告為 `NOT NULL` 的欄位（如 `title`, `code`, `deadline` 等）**不會遭遇任何「舊資料缺乏預設值而遷移失敗」的問題**。
3. **外鍵參照有效性**：
   - 新資料表之外鍵指標（如 `Announcement.authorId`、`Class.creatorId`）皆指向已存在的 `User.id`。當未來新增業務資料時，現存 4 位使用者皆能直接作為合法的關聯目標。

---

## 八、Git 狀態差異與矛盾徹底釐清 (Git Status Discrepancy Resolution)

### 1. 矛盾點回顧
在 Phase 3C-2A 交付報告中，終端顯示：
`git status --short` 列出 17 個未暫存修改（`backend/prisma.config.ts`, `docker-compose.yml`, `Navbar.tsx` 等）。然而報告文字卻稱：
> 「修改檔案清單：僅修改核准之 backend/prisma/schema.prisma」

### 2. 客觀事實調查與比對
透過 Git 歷史紀錄與前一輪 Session 輸出進行比對：

```mermaid
sequenceDiagram
    participant WT as Working Tree (工作區)
    participant Staged as Staged Area (暫存區)
    participant Head as Commit (af15037)

    Note over WT,Staged: Phase 3C-1.3 結束時現況
    WT->>Staged: 已暫存 108 個檔案 (核心程式、文件)
    WT->>WT: 存在 17 個未暫存工作檔案 (docker-compose, Navbar...)

    Note over Staged,Head: Commit 765ff90 執行時
    Staged->>Head: 提交 110 個檔案 (108個舊檔 + 2個新審查文件)
    WT-->>WT: 17 個未暫存檔案完全保留在工作區，未被提交

    Note over WT,Head: Phase 3C-2A 執行時
    WT->>WT: 新增修改 backend/prisma/schema.prisma
    Note over WT: 現況：17 個既有未暫存檔案 + 1 個新修改之 Schema
```

1. **17 個檔案的修改時間點**：
   在執行 `git commit -m "docs: complete database phase 3C-1 reviews"`（`765ff90`）之前，這 17 個檔案（包含 `docker-compose.yml`, `frontend/src/components/Navbar.tsx` 等）**就已經處於未暫存（Unstaged）的修改狀態**。
2. **為何它們沒有被提交？**
   因為使用者前一輪的指示為：「保留原有 108 個 staged files，將兩份新文件納入提交」，**絕未指示將工作區所有未暫存檔案一併 `git add .`**。因此，Git 正確地僅提交了暫存區檔案，這 17 個檔案則繼續完好保留在工作目錄。
3. **Phase 3C-2A 的實際更動**：
   在 Phase 3C-2A 期間，**唯一被新增修改的檔案確實只有 `backend/prisma/schema.prisma`**。
4. **澄清結論**：
   上一份報告所稱「僅修改 `backend/prisma/schema.prisma`」指的是**該階段所主動修改的範圍**；而 `git status` 所列出的其他 17 個檔案是**使用者原本就存在且受保護的工作內容**。兩者並無衝突，但先前報告說明不夠精準，現已完全釐清。

---

## 九、風險評估與分類等級表 (Risk Assessment Matrix)

| 風險級別 | 風險項目描述 | 影響範圍 | 緩解措施與處置指引 |
|:---:|:---|:---|:---|
| **CRITICAL** | **無未處理之 Critical 項目** | — | 36 個 Model 經全方位審查無架構死鎖或資料庫崩潰風險。 |
| **HIGH** | **ClassAssignment Cascade 刪除歷史作業風險** | 教師派發之作業歷史 | 建議在 Phase 3C-2B 將 `examPaper` 與 `practicalTask` 外鍵由 `Cascade` 調整為 `Restrict`。 |
| **HIGH** | **User 物理刪除連帶抹除學習成果** | 學生個人歷程 | 全站嚴格貫徹軟刪除（`User.deletedAt`），防範無預警物理級聯。 |
| **MEDIUM** | **PracticalStepProgress 跨版本混用風險** | 術科步驟打勾 | 純 Prisma 外鍵無法跨表約束版本一致性，後端 Service 需落實版本校驗防線。 |
| **MEDIUM** | **Question 刪除導致錯題與書籤消失** | 學生個人複習筆記 | 題庫全面採軟下架（`DEPRECATED`），物理刪除僅供測試清理。 |
| **LOW** | **ClassAssignment XOR CHECK 需原生 SQL** | 資料庫層防呆 | Prisma 無法原生表達，待 Phase 3C-2B 於 `migration.sql` 附加 CHECK 約束。 |
| **LOW** | **AI 對話訊息 90 天清理腳本尚未就緒** | 儲存容量與隱私 | 屬於後續排程維護作業，不影響 Schema 遷移與基本運作。 |

---

## 十、是否建議進入 Phase 3C-2B (Readiness Recommendation)

### 判定：【建議在落實兩項預備優化後，正式推進 Phase 3C-2B】

依據完成標準檢驗：
- [x] **36 個 Model 均完成實際逐行檢查**：通過。
- [x] **沒有未處理的 Critical 問題**：通過。
- [x] **High 風險問題已有明確處置方案**：通過（ClassAssignment 改 Restrict、User 採軟刪除）。
- [x] **歷史考試紀錄不會因題庫刪除而失去內容**：通過（`onDelete: SetNull` + 自給自足快照）。
- [x] **術科雙版本關聯設計合理**：通過（進度表具備唯一複合約束）。
- [x] **Migration 對既有資料的風險已被具體列出**：通過（既有表零變更，相容度 100%）。
- [x] **Git 狀態沒有被破壞**：通過（工作區與未追蹤檔案完好如初）。
- [x] **本階段沒有資料庫寫入**：通過（純唯讀審查）。

---

## 十一、尚未完成事項與 Phase 3C-2B 必要修正 (Action Items)

在正式執行本機 Migration（Phase 3C-2B）時，請落實以下作業：

1. **Schema 關聯微調（推薦於 Migration 前完成）**：
   將 `ClassAssignment` 的兩組目標外鍵調整為 `Restrict`：
   ```prisma
   examPaper     ExamPaper?     @relation(fields: [examPaperId], references: [id], onDelete: Restrict)
   practicalTask PracticalTask? @relation(fields: [practicalTaskId], references: [id], onDelete: Restrict)
   ```
2. **附加 XOR CHECK 約束**：
   在 `npx prisma migrate dev --create-only` 所產生的 `migration.sql` 結尾處手動附加：
   ```sql
   ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_target_xor_check" 
   CHECK (num_nonnulls("examPaperId", "practicalTaskId") = 1);
   ```
3. **驗證 Docker PostgreSQL 健康度**：
   啟動 Docker Desktop 與 `code_to_know_postgres` 容器，確認連線埠 `5432` 與憑證暢通。
4. **執行本機遷移與既有資料驗收**：
   套用 Migration 後，執行唯讀 SQL 驗收 36 張資料表結構與既有 4 位使用者之資料完整性。

---

> [!NOTE]
> **本階段宣告**：
> `Phase 3C-2A.1` 獨立架構複核與安全性檢查已全數執行完畢，所有分析均有精確技術憑據，未進行任何資料庫寫入或未授權之檔案修改，靜候使用者進入 Phase 3C-2B 之授權！
