# CODE TO KNOW（碼上學）
# 系統五層 API 契約規格書 (DATABASE API CONTRACTS)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Pre-Database Implementation)
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_API_CONTRACTS.md`
- **通訊協定規範**：
  - Base URL：`http://localhost:4000/api` (開發環境)
  - 格式標準：RESTful JSON、UTF-8 編碼
  - 身分傳遞：HttpOnly Cookie (`code_to_know_session`)，禁止於 Authorization Header 傳遞未經簽章之明文 Token。
  - 防偽標頭：所有具副作用請求（POST / PUT / PATCH / DELETE）必須於 Header 附加 `x-csrf-token`。

---

## 一、標準統一回應格式 (Unified Response Envelope)

### 1. 成功回應 (2xx Success)
```json
{
  "success": true,
  "message": "操作執行成功",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2026-11-07T12:00:00.000Z"
  }
}
```

### 2. 失敗回應 (4xx / 5xx Error)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_IDENTIFIER",
    "message": "人類可讀的錯誤提示文字",
    "details": []
  },
  "timestamp": "2026-11-07T12:00:00.000Z"
}
```

---

## 二、Layer 1：會員與身分認證 API (Authentication Endpoints)

### 1. `POST /api/auth/register` (會員註冊)
- **使用角色**：`GUEST`
- **現有實作狀態**：✅ **已實作 (依附現有 User 資料表)**
- **Request Body (Zod 驗證)**：
  ```json
  {
    "email": "student@example.com",
    "password": "Password123!",
    "displayName": "學習者小明"
  }
  ```
- **Response (201 Created)**：
  ```json
  {
    "success": true,
    "message": "註冊成功，已為您自動開通學習帳號",
    "data": {
      "user": {
        "id": "u-uuid-1",
        "email": "student@example.com",
        "displayName": "學習者小明",
        "roles": ["STUDENT"],
        "status": "ACTIVE"
      }
    }
  }
  ```
- **錯誤代碼**：`EMAIL_ALREADY_EXISTS` (409), `VALIDATION_ERROR` (400)。

### 2. `POST /api/auth/login` (會員登入)
- **使用角色**：`GUEST`
- **現有實作狀態**：✅ **已實作 (依附現有 User / Session 資料表)**
- **安全機制**：密碼比對透過 bcrypt；成功後設定 HttpOnly Cookie；失敗次數計入防暴力破解限制器。
- **Response (200 OK)**：回傳 `user` 物件與登入成功訊息。

### 3. `POST /api/auth/logout` (會員登出)
- **使用角色**：任何已登入使用者
- **現有實作狀態**：✅ **已實作**
- **行為**：從資料庫將 Session 撤銷，清除客戶端 Session Cookie。

### 4. `GET /api/auth/me` (當前登入者資訊)
- **使用角色**：任何已登入使用者
- **現有實作狀態**：✅ **已實作**
- **行為**：透過 Cookie 校驗 Session，若有效則回傳當前使用者資料與角色。

### 5. `POST /api/auth/forgot-password` (忘記密碼)
- **使用角色**：`GUEST`
- **現有實作狀態**：✅ **已實作 (產生 PasswordResetToken)**
- **備註**：目前郵件發送為 Console Mock，待外部郵件服務接入。

### 6. `POST /api/auth/reset-password` (重設密碼)
- **使用角色**：`GUEST`
- **現有實作狀態**：✅ **已實作**
- **行為**：校驗 Token 雜湊與效期，重設 `passwordHash` 並使所有舊 Session 一併失效。

---

## 三、Layer 2：學生學習平台 API (Student Learning Endpoints)

### 7. `GET /api/students/me` (學生個人學習主檔)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`User`, `UserProfile`, `StudentProfile`
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "profile": {
        "userId": "u-uuid-1",
        "displayName": "學習者小明",
        "targetCertId": "web-design-c",
        "targetExamDate": "2026-12-20",
        "dailyGoalMinutes": 45,
        "enrolledClasses": [
          { "classId": "c-uuid-1", "className": "資訊科三年甲班", "teacherName": "王老師" }
        ]
      }
    }
  }
  ```

### 8. `GET /api/students/progress` (個人學習進度與弱點診斷)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (現為前端 Mock Data)**
- **資料庫需求**：`UserProgress`, `ExamAttempt`
- **Query Parameters**：`certId=web-design-c`
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "overallProgressPercent": 68.5,
      "totalPracticedQuestions": 340,
      "totalQuestionBank": 500,
      "mockExamAverageScore": 84.5,
      "estimatedPassProbability": "HIGH",
      "weakSubjectAreas": [
        { "subjectCode": "90006", "subjectName": "職業安全衛生共同科目", "accuracyRate": 52.0 },
        { "subjectCode": "17300-2", "subjectName": "網頁語法與樣式設計", "accuracyRate": 88.0 }
      ]
    }
  }
  ```

### 9. `GET /api/students/exam-history` (歷史模擬考作答記錄)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`ExamAttempt` (WHERE userId = req.user.id)
- **Response (200 OK)**：分頁回傳歷史作答清單、交卷時間、分數、耗時與及格狀態。

### 10. `GET /api/students/wrong-questions` (個人專屬錯題本)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`WrongQuestion` JOIN `Question` (WHERE userId = req.user.id AND isMastered = false)
- **Response (200 OK)**：回傳答錯題目清單、錯誤次數、最後答錯時間與詳解。

### 11. `GET /api/students/bookmarks` (收藏題庫)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`Bookmark` JOIN `Question`

### 12. `GET /api/students/notes` (個人解題筆記清單)
- **使用角色**：`STUDENT`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`LearningNote`

---

## 四、Layer 3：教師教學管理 API (Teacher Endpoints)

### 13. `GET /api/teachers/classes` (教師授權班級列表)
- **使用角色**：`TEACHER`
- **目前實作狀態**：⚠️ **待資料庫施工 (目前前端 TeacherDashboardPage 寫死)**
- **資料庫需求**：`ClassTeacher` JOIN `Class` (WHERE teacherId = req.user.id)
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "classes": [
        {
          "classId": "c-uuid-1",
          "name": "資訊科三年甲班",
          "code": "INF-3A-114",
          "studentCount": 38,
          "roleInClass": "HEAD_TEACHER",
          "activeAssignedExamsCount": 2
        }
      ]
    }
  }
  ```

### 14. `GET /api/teachers/classes/:classId/students` (班級學生名冊與進度)
- **使用角色**：`TEACHER`
- **目前實作狀態**：⚠️ **待資料庫施工 (極高資安隱患：目前前端寫死 5 位學生個資)**
- **權限核心檢查**：後端強制校驗 `classTeacher.some(ct => ct.classId === classId && ct.teacherId === req.user.id)`。非本班任課教師一律回傳 403 `ACCESS_DENIED_NOT_CLASS_TEACHER`。
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "classId": "c-uuid-1",
      "className": "資訊科三年甲班",
      "students": [
        {
          "studentId": "s-uuid-1",
          "displayName": "陳*睿",
          "maskedEmail": "ch***r@school.edu",
          "progressPercent": 85,
          "latestMockScore": 92,
          "riskStatus": "SAFE",
          "lastActiveAt": "2026-11-07T10:30:00Z"
        }
      ]
    }
  }
  ```

### 15. `POST /api/teachers/classes` (建立新教學班級)
- **使用角色**：`TEACHER`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **Request Body**：`{ "name": "網頁設計丙級衝刺班", "schoolYear": "114-1" }`
- **行為**：自動生成 8 碼唯一入班邀請碼 (`inviteCode`)，並自動將建立者加入 `ClassTeacher` 擔任 `HEAD_TEACHER`。

### 16. `POST /api/teachers/exams` 與 `POST /api/teachers/exams/:examId/assign` (作業測驗派發)
- **使用角色**：`TEACHER`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **行為**：設定測驗截止時間、及格門檻、是否公布詳解，並派送給指定 `classId` 之所有已入班學生。

---

## 五、Layer 4：平台管理 API (Platform Admin Endpoints)

### 17. `GET /api/admin/users` (全站帳號管理列表)
- **使用角色**：`PLATFORM_ADMIN`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **查詢參數**：支援角色篩選 (`role=TEACHER`)、狀態 (`status=ACTIVE`)、分頁。

### 18. `GET /api/admin/teacher-applications` (教師認證申請審核列表)
- **使用角色**：`PLATFORM_ADMIN`
- **現有實作狀態**：✅ **已實作** (呼叫 `adminService.listTeacherApplications`)

### 19. `POST /api/admin/teacher-applications/:id/approve` (核准教師身分)
- **使用角色**：`PLATFORM_ADMIN`
- **現有實作狀態**：✅ **已實作** (事務賦予 `TEACHER` 角色並記錄 `AuditLog`)

### 20. `POST /api/admin/teacher-applications/:id/reject` (駁回教師身分)
- **使用角色**：`PLATFORM_ADMIN`
- **現有實作狀態**：✅ **已實作** (事務變更狀態為 `REJECTED` 並記錄原因)

### 21. `GET /api/admin/question-banks` (題庫審核與版本管理)
- **使用角色**：`PLATFORM_ADMIN`
- **目前實作狀態**：⚠️ **待資料庫施工 (現為未受保護之靜態前端 #sources 頁面)**
- **重大要求**：未來正式施工後，此 API 必須由後端限制 `requireRoles(['ADMIN'])`，前端路由以 `<ProtectedRoute requiredRoles={['ADMIN']}>` 阻絕。

---

## 六、Layer 5：系統營運監控 API (Ops Telemetry Endpoints)

### 22. `GET /api/ops/health` (系統健全度監控)
- **現有實作狀態**：✅ **已實作局部 (`/api/health`)**
- **行為**：探測資料庫連線、記憶體用量、回應延遲毫秒數。

### 23. `GET /api/ops/ai-usage` (AI 呼叫用量與成本統計)
- **使用角色**：`SYSTEM_OPERATOR`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **資料庫需求**：`AIUsageLog` (彙總每日 Token 數與費用預估)。

---

## 七、跨層服務：公告、通知與非同步郵件傳遞 API 契約 (Announcement & Notification APIs)

### 24. `GET /api/platform-announcements` (查詢平台官方公告列表)
- **使用角色**：公開存取 (`GUEST`, `STUDENT`, `TEACHER`, `ADMIN`)
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **查詢參數**：`type` (公告子類型), `priority` (`URGENT`/`HIGH`/`NORMAL`), `page`, `limit` (預設 10)。
- **安全約束**：後端嚴格限制只回傳 `category = 'PLATFORM'` 且 `status = 'PUBLISHED'` 且 `(expiresAt IS NULL OR expiresAt > NOW())` 的紀錄。
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "announcements": [
        {
          "id": "ann-uuid-1",
          "category": "PLATFORM",
          "type": "FEATURE_UPDATE",
          "priority": "HIGH",
          "isPinned": true,
          "title": "2026 網頁設計丙級全新題庫與 AI 引導功能正式上線",
          "summary": "全面支援五大術科技能評測，引導式 AI 教練協助自主排錯與全真模擬考。",
          "publishedAt": "2026-11-07T08:00:00Z",
          "viewCount": 1280
        }
      ],
      "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
    }
  }
  ```

### 25. `GET /api/platform-announcements/:id` (平台官方公告詳細內文)
- **使用角色**：公開存取
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **行為**：查詢單筆公開公告，後端非同步使 `viewCount = viewCount + 1`；回傳經過安全消毒之 Markdown/HTML 內文與附件列表。

### 26. `POST /api/admin/platform-announcements` (建立平台官方公告草稿)
- **使用角色**：`PLATFORM_ADMIN` 或授權之 `SYSTEM_OPERATOR` (限維護/異常類)
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **Request Body**：
  ```json
  {
    "category": "PLATFORM",
    "type": "SYSTEM_MAINTENANCE",
    "priority": "URGENT",
    "title": "2026/11/15 凌晨 02:00-04:00 資料庫硬體例行升級與維護公告",
    "summary": "升級期間模擬考與線上練習將暫停服務 2 小時。",
    "content": "## 維護說明\n本平台將於...",
    "isPinned": true,
    "pinnedUntil": "2026-11-15T05:00:00Z",
    "expiresAt": "2026-11-16T00:00:00Z",
    "sendEmail": false,
    "targetTypes": ["ALL"]
  }
  ```

### 27. `POST /api/admin/platform-announcements/:id/publish` (發布公告並觸發通知/郵件佇列)
- **使用角色**：`PLATFORM_ADMIN` 或授權之 `SYSTEM_OPERATOR`
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **行為**：
  1. 將 `status` 轉為 `PUBLISHED`，寫入 `publishedAt = NOW()`。
  2. 若目標包含特定角色或所有人，批次建立 `Notification` 記錄。
  3. 若 `sendEmail == true`，將收件者清單依範本排入 `EmailQueue`（非同步排程，絕不在 HTTP 執行緒阻塞寄信）。
  4. 寫入 `AdminAuditLog`。

### 28. `GET /api/announcements` (查詢使用者個人與班級教學公告)
- **使用角色**：`STUDENT` 或 `TEACHER` (需登入)
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **安全隔離防護**：
  - 由後端從 Session 提取 `req.user.id`。
  - 查詢該使用者已加入之班級清單 `userClassIds = [c1, c2]`。
  - 構造複合 SQL 查詢：
    ```sql
    WHERE status = 'PUBLISHED'
      AND (
        (category = 'PLATFORM')
        OR (targetType = 'ROLE' AND targetValue = req.user.role)
        OR (targetType = 'CLASS' AND targetValue IN (userClassIds))
        OR (targetType = 'USER' AND targetValue = req.user.id)
      )
    ```
  - 客戶端傳送之任何角色或使用者參數一律忽略，徹底杜絕 IDOR / BOLA 漏洞。

### 29. `POST /api/announcements` (發布教學公告或學生學習心得)
- **使用角色**：`TEACHER`（班級公告/個人通知）或 `STUDENT`（學習心得分享）
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **權限與業務校驗**：
  - 若發布者為 `TEACHER`，`targetType == 'CLASS'` 時，強制檢驗 `ClassTeacher` 授權，未任教班級拒絕並拋出 403。
  - 若發布者為 `STUDENT`：
    - `type` 僅限 `LEARNING_SHARE` 或 `DISCUSSION`。
    - `targetType` 僅限其已入班之單一班級 `CLASS`。
    - 學生嚴禁設定 `isPinned = true` 或 `sendEmail = true`。
    - 實施防洗版節流（每分鐘最多 1 篇，單日上限 5 篇）。

### 30. `POST /api/announcements/:id/read` (標記公告已讀 / 閱讀回條)
- **使用角色**：已登入會員 (`STUDENT`, `TEACHER`)
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **行為**：在 `AnnouncementRead` 執行 Upsert 操作（若無則寫入 `firstReadAt: NOW()`, 有則更新 `lastReadAt: NOW()`）。

### 31. `GET /api/notifications` (個人即時通知列表與未讀數)
- **使用角色**：已登入會員
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **Response (200 OK)**：
  ```json
  {
    "success": true,
    "data": {
      "unreadCount": 3,
      "notifications": [
        {
          "id": "notif-uuid-1",
          "type": "ANNOUNCEMENT",
          "title": "新指派作業：術科第三題組版型排版",
          "message": "王老師已指派新測驗作業，請於週五前繳交。",
          "linkUrl": "/#student-dashboard",
          "isRead": false,
          "createdAt": "2026-11-07T09:15:00Z"
        }
      ]
    }
  }
  ```

### 32. `POST /api/notifications/:id/read` 與 `POST /api/notifications/read-all` (標記通知已讀)
- **使用角色**：已登入會員
- **目前實作狀態**：⚠️ **待資料庫施工 (Pending DB)**
- **行為**：後端嚴格校驗 `WHERE userId = req.user.id`，防止竄改他人通知。

### 33. `GET /api/email/delivery-status/:id` (非同步郵件外寄狀態查詢)
- **使用角色**：`PLATFORM_ADMIN` 或排程發布之教師 (限本人觸發之作業通知)
- **目前實作狀態**：⚠️ **待資料庫施工 (目前為 Console Mock 虛擬輸出)**
- **行為**：查詢 `EmailQueue` 之 `status` (`PENDING`, `PROCESSING`, `SENT`, `FAILED`)、重試計數與失敗錯誤碼。
