# 碼上學｜CODE TO KNOW

# 資料庫架構設計文件（DATABASE ARCHITECTURE）

- 品牌名稱：碼上學｜CODE TO KNOW
- 文件版本：1.0
- 文件狀態：架構規劃
- 文件路徑：`docs/architecture/DATABASE_ARCHITECTURE.md`
- 主要資料庫：PostgreSQL
- ORM：Prisma
- 適用範圍：Web、Android、iOS、Windows、macOS

---

## 1. 文件目的

本文件定義「碼上學 AI 智慧學習與教育科技平台」的資料庫架構，作為後續資料庫建立、Prisma Schema 設計、API 開發及系統測試的依據。

資料庫必須支援：

1. 多角色使用者與權限管理。
2. 多科目、多課程及多種類型教材。
3. 題庫、練習、測驗及正式考試。
4. 學生作答紀錄與學習分析。
5. AI 助教對話、提示及使用紀錄。
6. 點數、徽章、遊戲及學習成就。
7. 教師班級管理、公告及作業。
8. 未來多學校、多語言及跨平台擴充。

本文件是資料庫規劃，不代表資料庫或相關功能已經完成實作。

## 2. 資料庫技術選擇

| 項目 | 技術 | 用途 |
| --- | --- | --- |
| 關聯式資料庫 | PostgreSQL | 儲存平台主要資料 |
| ORM | Prisma | 資料模型、查詢與資料庫遷移 |
| 主鍵 | UUID | 各資料表的唯一識別 |
| 時間格式 | UTC | 統一儲存時間 |
| API 資料格式 | JSON | 前後端資料交換 |
| 彈性資料 | JSONB | 儲存需要彈性擴充的設定或分析資料 |
| 快取（未來） | Redis | 快取、短期狀態及佇列支援 |

### 2.1 設計原則

- 使用 UUID 作為主要資料表的主鍵。
- 所有時間統一使用 UTC 儲存，顯示時再依使用者時區轉換。
- 重要資料使用外鍵建立關聯。
- 使用唯一限制避免重複帳號及重複資料。
- 使用索引改善常用查詢效能。
- 對重要資料保留建立時間及更新時間。
- 使用軟刪除處理需要保留歷史紀錄的資料。
- 不將密碼明文存入資料庫。
- 不將 AI API Key、JWT Secret 等機密存入一般資料表。
- 不以 JSONB 取代原本應具有明確關聯的核心資料表。

## 3. 資料庫整體分類

資料表分為以下十個主要模組：

| 模組 | 主要內容 |
| --- | --- |
| A. 使用者與權限 | 帳號、角色、個人資料、登入紀錄 |
| B. 學校與班級 | 學校、班級、師生關係 |
| C. 課程與教材 | 科目、課程、章節、教材 |
| D. 題庫系統 | 題目、選項、標籤、答案 |
| E. 考試與作答 | 考試、考卷、作答紀錄、成績 |
| F. 學習分析 | 學習紀錄、錯題、弱點分析 |
| G. AI 助教 | 對話、訊息、提示及使用量 |
| H. 遊戲與成就 | 點數、徽章、遊戲紀錄 |
| I. 教師管理 | 作業、公告、通知 |
| J. 系統管理 | 操作紀錄、檔案、系統設定 |

## 4. 使用者與權限模組

### 4.1 User（使用者）

用途：儲存所有使用者的基本帳號資料。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| email | VARCHAR(255) | 電子郵件，唯一 |
| passwordHash | VARCHAR(255) | 加密雜湊後的密碼 |
| displayName | VARCHAR(100) | 顯示名稱 |
| avatarUrl | TEXT | 頭像位置 |
| status | VARCHAR(30) | 帳號狀態 |
| emailVerifiedAt | TIMESTAMP | 電子郵件驗證時間 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |
| deletedAt | TIMESTAMP NULL | 軟刪除時間 |

帳號狀態建議：

- ACTIVE
- PENDING_VERIFICATION
- SUSPENDED
- DISABLED

### 4.2 Role（角色）

用途：定義平台使用者角色。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| name | VARCHAR(50) | 角色名稱 |
| description | TEXT | 角色說明 |

初期角色：

- STUDENT：學生
- TEACHER：教師
- ADMIN：系統管理員

未來可擴充 SCHOOL_ADMIN 等角色。

### 4.3 UserRole（使用者角色關聯）

用途：支援同一使用者具有多種角色。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| roleId | UUID | 角色 ID |
| createdAt | TIMESTAMP | 建立時間 |

限制：userId 與 roleId 組合必須唯一。

### 4.4 UserProfile（使用者個人資料）

用途：儲存非登入必要的個人資訊。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| nickname | VARCHAR(100) | 暱稱 |
| timezone | VARCHAR(50) | 使用者時區 |
| language | VARCHAR(20) | 使用語言 |
| educationLevel | VARCHAR(50) | 教育階段 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

個人資料應採取最小必要蒐集原則。

## 5. 學校與班級模組

### 5.1 School（學校）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| name | VARCHAR(200) | 學校名稱 |
| code | VARCHAR(50) | 學校代碼 |
| status | VARCHAR(30) | 學校狀態 |
| createdAt | TIMESTAMP | 建立時間 |

### 5.2 Class（班級）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| schoolId | UUID | 所屬學校 |
| name | VARCHAR(100) | 班級名稱 |
| academicYear | VARCHAR(20) | 學年度 |
| gradeLevel | VARCHAR(30) | 年級 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

### 5.3 ClassMember（班級成員）

用途：建立教師與學生的班級關係。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| classId | UUID | 班級 ID |
| userId | UUID | 使用者 ID |
| memberRole | VARCHAR(30) | TEACHER 或 STUDENT |
| joinedAt | TIMESTAMP | 加入時間 |
| status | VARCHAR(30) | 成員狀態 |

同一使用者可參與多個班級。

班級成員資格必須由後端驗證，不得只相信前端傳入的 userId 或教師電子郵件。

## 6. 課程與教材模組

### 6.1 Subject（科目）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 科目名稱 |
| code | VARCHAR(50) | 科目代碼 |
| description | TEXT | 科目介紹 |
| status | VARCHAR(30) | 狀態 |

### 6.2 Course（課程）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| subjectId | UUID | 所屬科目 |
| title | VARCHAR(200) | 課程名稱 |
| description | TEXT | 課程介紹 |
| difficulty | VARCHAR(30) | 難度 |
| status | VARCHAR(30) | 課程狀態 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

### 6.3 Chapter（章節）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| courseId | UUID | 所屬課程 |
| title | VARCHAR(200) | 章節名稱 |
| content | TEXT | 章節內容 |
| sortOrder | INTEGER | 排序 |
| createdAt | TIMESTAMP | 建立時間 |

### 6.4 LearningMaterial（教材）

用途：管理文字、圖片、PDF、影片及外部教材連結。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| chapterId | UUID | 所屬章節 |
| title | VARCHAR(200) | 教材名稱 |
| materialType | VARCHAR(30) | 教材類型 |
| fileId | UUID NULL | 檔案 ID |
| externalUrl | TEXT NULL | 外部連結 |
| content | TEXT NULL | 文字內容 |
| sortOrder | INTEGER | 排序 |
| createdAt | TIMESTAMP | 建立時間 |

教材類型：

- TEXT
- PDF
- IMAGE
- VIDEO
- LINK
- INTERACTIVE

## 7. 題庫模組

### 7.1 Question（題目）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| subjectId | UUID | 科目 ID |
| courseId | UUID NULL | 課程 ID |
| chapterId | UUID NULL | 章節 ID |
| title | VARCHAR(300) | 題目標題 |
| content | TEXT | 題目內容 |
| questionType | VARCHAR(30) | 題型 |
| difficulty | VARCHAR(30) | 難度 |
| explanation | TEXT | 解題說明 |
| points | INTEGER | 配分 |
| status | VARCHAR(30) | 題目狀態 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

題型：

- SINGLE_CHOICE
- MULTIPLE_CHOICE
- TRUE_FALSE
- FILL_IN
- SHORT_ANSWER
- PRACTICAL_TASK

### 7.2 QuestionOption（題目選項）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| questionId | UUID | 題目 ID |
| content | TEXT | 選項內容 |
| optionLabel | VARCHAR(20) | 選項標籤 |
| sortOrder | INTEGER | 排序 |
| isCorrect | BOOLEAN | 是否為正確答案 |

注意：正確答案只能透過授權後的後端流程提供，不可在學生考試頁面直接暴露答案欄位。

### 7.3 QuestionTag（題目標籤）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 標籤名稱 |
| category | VARCHAR(50) | 標籤分類 |

### 7.4 QuestionTagRelation（題目標籤關聯）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| questionId | UUID | 題目 ID |
| tagId | UUID | 標籤 ID |

用途：支援依知識點、難度、題型及技能分類搜尋題目。

## 8. 考試與作答模組

### 8.1 Exam（考試）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| classId | UUID NULL | 指定班級 |
| createdBy | UUID | 建立者 |
| title | VARCHAR(200) | 考試名稱 |
| description | TEXT | 考試說明 |
| startAt | TIMESTAMP | 開始時間 |
| endAt | TIMESTAMP | 結束時間 |
| durationMinutes | INTEGER | 考試時間 |
| passingScore | DECIMAL(6,2) | 及格分數 |
| shuffleQuestions | BOOLEAN | 題目隨機排序 |
| shuffleOptions | BOOLEAN | 選項隨機排序 |
| status | VARCHAR(30) | 考試狀態 |
| createdAt | TIMESTAMP | 建立時間 |

### 8.2 ExamQuestion（考試題目）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| examId | UUID | 考試 ID |
| questionId | UUID | 題目 ID |
| points | DECIMAL(6,2) | 該題配分 |
| sortOrder | INTEGER | 排序 |

### 8.3 ExamAttempt（考試作答場次）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| examId | UUID | 考試 ID |
| userId | UUID | 學生 ID |
| attemptNumber | INTEGER | 第幾次作答 |
| startedAt | TIMESTAMP | 開始時間 |
| submittedAt | TIMESTAMP NULL | 交卷時間 |
| score | DECIMAL(7,2) NULL | 成績 |
| status | VARCHAR(30) | 作答狀態 |
| isRetake | BOOLEAN | 是否為補考或重考 |

同一場考試的學生作答次數必須能被正確追蹤。

### 8.4 AnswerRecord（作答紀錄）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| attemptId | UUID | 作答場次 ID |
| questionId | UUID | 題目 ID |
| selectedOptionIds | JSONB | 選擇的選項 ID |
| answerText | TEXT NULL | 文字答案 |
| isCorrect | BOOLEAN NULL | 是否正確 |
| earnedPoints | DECIMAL(6,2) | 得分 |
| timeSpentSeconds | INTEGER | 作答秒數 |
| submittedAt | TIMESTAMP | 送出時間 |

JSONB 僅用於需要同時保存多個選項 ID 的答案內容；核心題目與作答關聯仍使用正式資料表。

### 8.5 ExamExclusion（考試排除名單）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| examId | UUID | 考試 ID |
| userId | UUID | 學生 ID |
| reason | TEXT | 排除原因 |
| createdAt | TIMESTAMP | 建立時間 |

## 9. 學習分析模組

### 9.1 LearningActivity（學習活動）

用途：記錄學生觀看教材、練習題目及參與課程的活動。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| courseId | UUID NULL | 課程 ID |
| activityType | VARCHAR(50) | 活動類型 |
| referenceId | UUID NULL | 關聯資料 ID |
| durationSeconds | INTEGER | 活動時間 |
| createdAt | TIMESTAMP | 建立時間 |

### 9.2 WrongQuestion（錯題紀錄）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 學生 ID |
| questionId | UUID | 題目 ID |
| lastWrongAt | TIMESTAMP | 最近答錯時間 |
| wrongCount | INTEGER | 答錯次數 |
| masteredAt | TIMESTAMP NULL | 確認已掌握時間 |
| updatedAt | TIMESTAMP | 更新時間 |

### 9.3 LearningAnalysis（學習分析）

用途：儲存定期或依需求產生的學習分析結果。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 學生 ID |
| subjectId | UUID NULL | 科目 ID |
| analysisType | VARCHAR(50) | 分析類型 |
| result | JSONB | 分析結果 |
| generatedAt | TIMESTAMP | 產生時間 |

分析結果可包含：

- 科目正確率
- 章節弱點
- 作答時間
- 常見錯誤類型
- 學習進步趨勢
- 建議複習內容

分析結果應標示產生時間及資料範圍，避免將過期分析當成即時狀態。

## 10. AI 助教模組

### 10.1 AIConversation（AI 對話）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| title | VARCHAR(200) | 對話名稱 |
| contextType | VARCHAR(50) | 對話情境 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

### 10.2 AIMessage（AI 訊息）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| conversationId | UUID | 對話 ID |
| senderType | VARCHAR(20) | USER 或 AI |
| content | TEXT | 訊息內容 |
| modelName | VARCHAR(100) | 使用模型 |
| tokenUsage | INTEGER NULL | Token 使用量 |
| createdAt | TIMESTAMP | 建立時間 |

### 10.3 AIHintRecord（AI 提示紀錄）

用途：記錄 AI 對題目的分階段提示。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| questionId | UUID | 題目 ID |
| hintLevel | INTEGER | 提示層級 |
| hintContent | TEXT | 提示內容 |
| createdAt | TIMESTAMP | 建立時間 |

提示層級：

1. 第一層：方向提示。
2. 第二層：觀念提示。
3. 第三層：步驟提示。
4. 第四層：完整解題說明。

AI 應以協助理解為主，不應預設直接代替學生完成所有思考。

### 10.4 AIUsageLog（AI 使用紀錄）

用途：統計 AI 服務使用量及成本。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| provider | VARCHAR(50) | AI 服務供應商 |
| modelName | VARCHAR(100) | 模型名稱 |
| inputTokens | INTEGER | 輸入 Token |
| outputTokens | INTEGER | 輸出 Token |
| estimatedCost | DECIMAL(12,6) | 預估成本 |
| status | VARCHAR(30) | 呼叫狀態 |
| createdAt | TIMESTAMP | 建立時間 |

API Key 必須放在伺服器端環境變數或安全機密管理服務中。

## 11. 遊戲與成就模組

### 11.1 PointTransaction（點數異動）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| amount | INTEGER | 點數增減 |
| transactionType | VARCHAR(50) | 異動類型 |
| referenceId | UUID NULL | 關聯活動 ID |
| description | TEXT | 異動說明 |
| createdAt | TIMESTAMP | 建立時間 |

點數異動必須保留紀錄，不應只直接覆寫使用者的點數總額。

### 11.2 Badge（徽章）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| name | VARCHAR(100) | 徽章名稱 |
| description | TEXT | 徽章說明 |
| imageUrl | TEXT | 徽章圖片 |
| condition | JSONB | 解鎖條件 |
| createdAt | TIMESTAMP | 建立時間 |

### 11.3 UserBadge（使用者徽章）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| badgeId | UUID | 徽章 ID |
| unlockedAt | TIMESTAMP | 解鎖時間 |

### 11.4 GameSession（遊戲場次）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 使用者 ID |
| gameType | VARCHAR(50) | 遊戲類型 |
| score | INTEGER | 遊戲分數 |
| durationSeconds | INTEGER | 遊戲時間 |
| completedAt | TIMESTAMP | 完成時間 |

## 12. 教師管理模組

### 12.1 Assignment（作業）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| classId | UUID | 班級 ID |
| createdBy | UUID | 教師 ID |
| title | VARCHAR(200) | 作業名稱 |
| description | TEXT | 作業說明 |
| dueAt | TIMESTAMP | 繳交期限 |
| createdAt | TIMESTAMP | 建立時間 |

### 12.2 AssignmentSubmission（作業繳交）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| assignmentId | UUID | 作業 ID |
| userId | UUID | 學生 ID |
| content | TEXT | 繳交內容 |
| fileId | UUID NULL | 附件 ID |
| score | DECIMAL(7,2) NULL | 成績 |
| feedback | TEXT NULL | 教師回饋 |
| submittedAt | TIMESTAMP | 繳交時間 |

### 12.3 Announcement（公告）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| createdBy | UUID | 發布者 |
| classId | UUID NULL | 指定班級 |
| title | VARCHAR(200) | 公告標題 |
| content | TEXT | 公告內容 |
| publishedAt | TIMESTAMP NULL | 發布時間 |
| createdAt | TIMESTAMP | 建立時間 |

### 12.4 Notification（通知）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| userId | UUID | 接收者 |
| title | VARCHAR(200) | 通知標題 |
| content | TEXT | 通知內容 |
| notificationType | VARCHAR(50) | 通知類型 |
| readAt | TIMESTAMP NULL | 已讀時間 |
| createdAt | TIMESTAMP | 建立時間 |

## 13. 系統管理模組

### 13.1 FileAsset（檔案資料）

用途：保存上傳檔案的中繼資料。

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| ownerId | UUID | 上傳者 |
| fileName | VARCHAR(255) | 原始檔名 |
| storageKey | TEXT | 儲存位置識別碼 |
| mimeType | VARCHAR(100) | 檔案類型 |
| fileSize | BIGINT | 檔案大小 |
| createdAt | TIMESTAMP | 上傳時間 |

實際檔案應儲存在受控的檔案儲存服務，不應直接將大型檔案內容存入一般資料表。

### 13.2 AuditLog（操作紀錄）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| actorId | UUID NULL | 操作者 |
| action | VARCHAR(100) | 操作類型 |
| targetType | VARCHAR(100) | 目標資料類型 |
| targetId | UUID NULL | 目標資料 ID |
| metadata | JSONB | 必要的操作資訊 |
| createdAt | TIMESTAMP | 操作時間 |

不得在操作紀錄中保存密碼、Token、API Key 等機密。

### 13.3 SystemSetting（系統設定）

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | UUID | 主鍵 |
| key | VARCHAR(100) | 設定名稱 |
| value | JSONB | 設定內容 |
| description | TEXT | 設定說明 |
| updatedAt | TIMESTAMP | 更新時間 |

機密資訊不得放入一般系統設定資料表。

## 14. 核心資料表關聯

主要關聯如下：

- User 與 UserRole：一對多。
- Role 與 UserRole：一對多。
- School 與 Class：一對多。
- Class 與 ClassMember：一對多。
- User 與 ClassMember：一對多。
- Subject 與 Course：一對多。
- Course 與 Chapter：一對多。
- Chapter 與 LearningMaterial：一對多。
- Subject 與 Question：一對多。
- Question 與 QuestionOption：一對多。
- Question 與 QuestionTag：多對多。
- Exam 與 ExamQuestion：一對多。
- Question 與 ExamQuestion：一對多。
- Exam 與 ExamAttempt：一對多。
- ExamAttempt 與 AnswerRecord：一對多。
- User 與 LearningActivity：一對多。
- User 與 WrongQuestion：一對多。
- User 與 AIConversation：一對多。
- AIConversation 與 AIMessage：一對多。
- User 與 PointTransaction：一對多。
- User 與 Badge：多對多。

## 15. 索引與查詢效能

初期建議建立以下索引：

| 資料表 | 索引欄位 | 用途 |
| --- | --- | --- |
| User | email | 登入及帳號查詢 |
| UserRole | userId、roleId | 角色查詢 |
| ClassMember | classId、userId | 班級成員查詢 |
| Course | subjectId | 科目課程查詢 |
| Chapter | courseId、sortOrder | 章節排序 |
| Question | subjectId、chapterId | 題目篩選 |
| Exam | classId、startAt | 考試查詢 |
| ExamAttempt | examId、userId | 作答紀錄查詢 |
| AnswerRecord | attemptId、questionId | 作答明細查詢 |
| LearningActivity | userId、createdAt | 學習歷程查詢 |
| AIMessage | conversationId、createdAt | 對話查詢 |
| Notification | userId、readAt | 未讀通知查詢 |

索引應依實際查詢頻率及效能測試調整，避免不必要的索引增加寫入成本。

## 16. 資料安全與權限

### 16.1 基本安全要求

1. 密碼使用安全的密碼雜湊演算法保存。
2. 登入驗證及角色授權必須由後端執行。
3. 學生只能讀取自己有權限的學習資料。
4. 教師只能管理自己被授權的班級及學生。
5. 管理員操作必須保留稽核紀錄。
6. 正確答案及評分規則不得直接暴露給未授權的學生端。
7. 所有 API 必須驗證使用者身分及資料存取權限。
8. 傳輸中的敏感資料必須使用 HTTPS。
9. 機密資訊使用環境變數或專用機密管理服務。
10. 定期檢查資料庫備份及還原結果。

### 16.2 個人資料保護

- 僅收集平台功能必要的個人資料。
- 提供合理的資料查詢及更正流程。
- 依適用法規與平台政策處理資料刪除及保存期限。
- AI 對話及學習紀錄應有清楚的使用說明。
- 不應將學生個人資料任意提供給第三方 AI 服務。
- 傳送 AI 服務前，應評估是否需要移除可識別個人身分的資訊。

## 17. 資料備份與復原

正式環境應規劃：

- 定期自動備份。
- 備份檔案與正式資料庫分開保存。
- 備份檔案存取權限控管。
- 定期執行資料還原測試。
- 重要資料變更前評估備份需求。
- 記錄備份時間、版本及執行結果。

備份頻率、保存期限及復原目標（RPO、RTO）須依實際營運規模與成本決定。

## 18. 資料庫遷移管理

使用 Prisma Migrate 管理資料庫結構變更。

開發原則：

1. 修改 Prisma Schema。
2. 在開發環境建立 Migration。
3. 檢查 Migration SQL。
4. 執行資料庫遷移。
5. 執行相關測試。
6. 確認既有資料不會因遷移而意外遺失。
7. 經審核後才部署至正式環境。

禁止直接在正式資料庫任意修改結構而不留下遷移紀錄。

## 19. 資料庫建置階段

### Phase 1：MVP 核心資料

- User
- Role
- UserRole
- UserProfile
- School
- Class
- ClassMember
- Subject
- Course
- Chapter
- LearningMaterial
- Question
- QuestionOption
- Exam
- ExamQuestion
- ExamAttempt
- AnswerRecord

### Phase 2：學習與 AI 功能

- QuestionTag
- QuestionTagRelation
- LearningActivity
- WrongQuestion
- LearningAnalysis
- AIConversation
- AIMessage
- AIHintRecord
- AIUsageLog

### Phase 3：遊戲與教師管理

- PointTransaction
- Badge
- UserBadge
- GameSession
- Assignment
- AssignmentSubmission
- Announcement
- Notification

### Phase 4：正式營運與擴充

- FileAsset
- AuditLog
- SystemSetting
- 備份及還原機制
- 效能監控
- 資料保存與清理政策
- 多學校及跨平台擴充

## 20. 待確認與實作注意事項

以下項目不得在尚未完成確認前視為已實作：

- PostgreSQL 尚待正式建立及設定。
- Prisma Schema 尚待依本文件建立。
- Migration 尚待實際執行及測試。
- 外部檔案儲存服務尚待選擇。
- AI 服務供應商及資料處理政策尚待確認。
- 學校及班級資料的實際來源尚待確認。
- 個人資料保存期限及刪除政策尚待制定。
- 備份頻率與復原目標尚待依部署環境決定。

本文件中的資料表及欄位為第一版架構規劃，實際實作時可依安全性、效能與產品需求調整，但必須同步更新文件。

---

## 文件完成標準

- [ ] 資料庫技術選擇明確。
- [ ] 核心資料表及欄位定義完成。
- [ ] 主要資料表關聯明確。
- [ ] 索引及查詢效能原則完成。
- [ ] 使用者權限與資料安全原則完成。
- [ ] 備份、復原及遷移原則完成。
- [ ] MVP 至正式營運的資料庫階段規劃完成。
- [ ] 尚未實作的項目已清楚標示。

**文件定位：資料庫架構規劃文件，不代表資料庫已建置完成。**
