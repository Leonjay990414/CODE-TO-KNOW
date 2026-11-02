# 後端 API 與服務架構（BACKEND API ARCHITECTURE）

**專案名稱：** 碼上學｜CODE TO KNOW  
**文件路徑：** `docs/architecture/BACKEND_API_ARCHITECTURE.md`  
**文件用途：** 定義後端服務分層、API 路由、業務模組、資料驗證、權限檢查及錯誤處理規範。

---

## 1. 後端架構目標

後端採用 Node.js + TypeScript + Express，負責平台的核心業務邏輯及資料存取。

主要目標：

1. 統一處理前端 API 請求。
2. 管理使用者身分、角色及權限。
3. 提供課程、教材、題庫及考試服務。
4. 管理學習紀錄、成績及分析資料。
5. 安全地串接外部 AI 服務。
6. 支援教師及管理員的管理功能。
7. 建立一致的錯誤處理及日誌機制。
8. 保持模組化，方便後續擴充。

## 2. 後端技術基準

| 技術 | 用途 |
| --- | --- |
| Node.js | 後端執行環境 |
| TypeScript | 後端程式語言 |
| Express | HTTP API 框架 |
| Prisma | ORM 與資料存取 |
| PostgreSQL | 正式資料庫 |
| Zod | 輸入資料驗證 |
| JWT | 身分授權資訊 |
| HttpOnly Cookie | 登入狀態保存 |
| bcrypt | 密碼雜湊 |
| Helmet | HTTP 安全標頭 |
| Rate Limiting | 請求頻率限制 |
| Pino 或同類工具 | 結構化日誌 |

實際套件及版本需在安裝時確認相容性。

## 3. 後端資料夾結構

建議後端程式集中於 `backend/`。

```text
backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── security.ts
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   ├── authorize.ts
│   │   ├── validate.ts
│   │   ├── error-handler.ts
│   │   └── rate-limit.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── students/
│   │   ├── teachers/
│   │   ├── admins/
│   │   ├── classes/
│   │   ├── courses/
│   │   ├── materials/
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── attempts/
│   │   ├── learning-records/
│   │   ├── analytics/
│   │   ├── ai/
│   │   ├── games/
│   │   └── announcements/
│   │
│   ├── services/
│   ├── repositories/
│   ├── integrations/
│   │   ├── ai-providers/
│   │   ├── email/
│   │   └── storage/
│   │
│   ├── utils/
│   ├── types/
│   └── tests/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── package.json
└── tsconfig.json
```

## 4. 後端分層架構

每個 API 請求應依照明確流程處理。

### 4.1 Routes

負責：

- 定義 API 路徑。
- 指定 HTTP 方法。
- 連接 Middleware 及 Controller。
- 不直接撰寫複雜業務邏輯。

### 4.2 Middleware

負責：

- 登入驗證。
- 角色及權限檢查。
- 輸入驗證。
- 請求頻率限制。
- 錯誤處理。

### 4.3 Controllers

負責：

- 接收已驗證的請求資料。
- 呼叫對應 Service。
- 決定 HTTP 狀態碼。
- 回傳統一格式的結果。

### 4.4 Services

負責：

- 執行業務規則。
- 協調不同功能模組。
- 控制資料修改流程。
- 執行必要交易。
- 呼叫外部服務。

### 4.5 Repositories

負責：

- 與 Prisma 互動。
- 讀取及寫入資料。
- 將資料庫操作集中管理。
- 避免 Controller 直接存取資料庫。

## 5. API 基本規範

### 5.1 API 前綴

所有 API 使用：

```text
/api/v1/
```

版本化的目的，是讓未來調整 API 時，能降低對既有前端的影響。

### 5.2 HTTP 方法

| 方法 | 用途 |
| --- | --- |
| GET | 讀取資料 |
| POST | 建立資料或執行動作 |
| PUT | 完整更新資料 |
| PATCH | 部分更新資料 |
| DELETE | 刪除資料 |

### 5.3 命名規則

- 使用小寫英文。
- 多個單字使用連字號。
- 資源名稱盡量使用複數形式。
- URL 不使用資料庫欄位名稱代替資源名稱。
- API 路徑保持一致。

例如：

```text
GET    /api/v1/courses
GET    /api/v1/courses/:courseId
POST   /api/v1/courses
PATCH  /api/v1/courses/:courseId
DELETE /api/v1/courses/:courseId
```

## 6. API 模組規劃

以下為第一版 API 路由目錄，實際端點應依功能實作逐步啟用。

### 6.1 身分驗證

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| POST | `/api/v1/auth/register` | 註冊 |
| POST | `/api/v1/auth/login` | 登入 |
| POST | `/api/v1/auth/logout` | 登出 |
| GET | `/api/v1/auth/me` | 取得目前使用者 |
| POST | `/api/v1/auth/forgot-password` | 忘記密碼 |
| POST | `/api/v1/auth/reset-password` | 重設密碼 |
| POST | `/api/v1/auth/google` | Google 登入 |

### 6.2 使用者

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/users/me` | 個人資料 |
| PATCH | `/api/v1/users/me` | 修改個人資料 |
| PATCH | `/api/v1/users/me/password` | 修改密碼 |

### 6.3 課程與教材

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/courses` | 課程列表 |
| GET | `/api/v1/courses/:courseId` | 課程詳細資料 |
| POST | `/api/v1/courses` | 建立課程 |
| PATCH | `/api/v1/courses/:courseId` | 修改課程 |
| GET | `/api/v1/courses/:courseId/materials` | 課程教材 |
| POST | `/api/v1/materials` | 建立教材 |
| GET | `/api/v1/materials/:materialId` | 教材詳細資料 |

### 6.4 題庫

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/questions` | 題目列表 |
| GET | `/api/v1/questions/:questionId` | 題目資料 |
| POST | `/api/v1/questions` | 建立題目 |
| PATCH | `/api/v1/questions/:questionId` | 修改題目 |
| DELETE | `/api/v1/questions/:questionId` | 刪除題目 |

題庫管理端點需依教師或管理員權限限制。學生練習端不得取得不必要的標準答案或內部解析資料。

### 6.5 練習與作答

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| POST | `/api/v1/practice-sessions` | 建立練習 |
| GET | `/api/v1/practice-sessions/:sessionId` | 取得練習 |
| POST | `/api/v1/practice-sessions/:sessionId/answers` | 提交答案 |
| POST | `/api/v1/practice-sessions/:sessionId/complete` | 完成練習 |
| GET | `/api/v1/practice-sessions/:sessionId/results` | 練習結果 |

### 6.6 考試

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/exams` | 考試列表 |
| GET | `/api/v1/exams/:examId` | 考試資訊 |
| POST | `/api/v1/exams` | 建立考試 |
| PATCH | `/api/v1/exams/:examId` | 修改考試 |
| POST | `/api/v1/exams/:examId/publish` | 發布考試 |
| POST | `/api/v1/exams/:examId/attempts` | 開始作答 |
| POST | `/api/v1/attempts/:attemptId/answers` | 儲存答案 |
| POST | `/api/v1/attempts/:attemptId/submit` | 提交考卷 |
| GET | `/api/v1/attempts/:attemptId/results` | 查看結果 |

考試建立及發布需驗證教師權限與班級歸屬。考試提交、成績計算及時間判斷必須由伺服器負責。

### 6.7 學習紀錄及分析

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/learning-records` | 學習紀錄 |
| GET | `/api/v1/learning-records/summary` | 學習摘要 |
| GET | `/api/v1/analytics/overview` | 學習總覽 |
| GET | `/api/v1/analytics/weaknesses` | 弱點分析 |
| GET | `/api/v1/analytics/progress` | 學習進度 |

學生只能查看允許存取的個人資料；教師只能查看授權班級內的資料。

### 6.8 AI 學習助理

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| POST | `/api/v1/ai/hints` | 取得分層提示 |
| POST | `/api/v1/ai/explanations` | 取得概念解釋 |
| POST | `/api/v1/ai/analysis` | 取得錯題分析 |
| GET | `/api/v1/ai/usage` | 查看可公開的使用量資訊 |

AI 請求必須由後端驗證使用者權限及請求內容，再透過 AI Provider Layer 呼叫模型。

### 6.9 班級及公告

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/classes` | 班級列表 |
| POST | `/api/v1/classes` | 建立班級 |
| GET | `/api/v1/classes/:classId` | 班級詳細資料 |
| GET | `/api/v1/classes/:classId/students` | 班級學生 |
| POST | `/api/v1/classes/:classId/students` | 加入學生 |
| GET | `/api/v1/announcements` | 公告列表 |
| POST | `/api/v1/announcements` | 建立公告 |
| PATCH | `/api/v1/announcements/:announcementId` | 修改公告 |

### 6.10 遊戲及成就

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| GET | `/api/v1/games` | 遊戲列表 |
| POST | `/api/v1/games/:gameId/sessions` | 開始遊戲 |
| POST | `/api/v1/games/:gameId/sessions/:sessionId/complete` | 完成遊戲 |
| GET | `/api/v1/achievements` | 成就列表 |
| GET | `/api/v1/points/summary` | 點數摘要 |

遊戲結果及點數必須由後端驗證，不得直接採信前端提交的獎勵數值。

## 7. API 權限矩陣

| 功能 | 訪客 | 學生 | 教師 | 管理員 |
| --- | --- | --- | --- | --- |
| 公開網站 | 可 | 可 | 可 | 可 |
| 個人學習資料 | 不可 | 僅本人 | 依授權 | 依管理職責 |
| 課程瀏覽 | 公開課程 | 依權限 | 可管理授權課程 | 可管理 |
| 題庫練習 | 不可 | 可 | 可測試或管理 | 可管理 |
| 建立考試 | 不可 | 不可 | 依班級權限 | 可管理 |
| 查看班級成績 | 不可 | 僅本人 | 授權班級 | 依管理職責 |
| AI 助理 | 不可 | 可 | 依功能設定 | 可管理設定 |
| 使用者管理 | 不可 | 不可 | 不可 | 依管理權限 |

實際權限應細分至資源及操作層級，不能只用角色名稱判斷。

## 8. 資料驗證

所有外部請求都必須經過驗證。

驗證內容：

- 必填欄位。
- 資料型別。
- 字串長度。
- 數值範圍。
- 日期及時間格式。
- 識別碼格式。
- 權限及資源歸屬。
- 檔案類型及大小。

使用 Zod 建立共用 Schema，前後端可依需要共享型別或驗證定義，但後端仍須自行執行可信任的驗證。

## 9. 統一回應格式

### 9.1 成功

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 9.2 錯誤

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入資料不正確"
  }
}
```

### 9.3 分頁

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

回應內容不得包含密碼雜湊、Token、API Key 或其他不應公開的內部資料。

## 10. 錯誤代碼

建議統一錯誤代碼：

| 錯誤代碼 | 說明 |
| --- | --- |
| VALIDATION_ERROR | 輸入資料錯誤 |
| UNAUTHENTICATED | 尚未登入 |
| FORBIDDEN | 權限不足 |
| NOT_FOUND | 資料不存在 |
| CONFLICT | 資料衝突 |
| RATE_LIMITED | 請求過於頻繁 |
| AI_PROVIDER_ERROR | AI 服務異常 |
| DATABASE_ERROR | 資料庫錯誤 |
| INTERNAL_ERROR | 系統內部錯誤 |

對外錯誤訊息不得洩漏資料庫結構、伺服器路徑、堆疊追蹤或金鑰。

## 11. 身分驗證與 Cookie

- 登入成功後由後端設定 HttpOnly Cookie。
- Cookie 應設定適當的 Secure、SameSite 及 Path 屬性。
- 正式環境必須使用 HTTPS。
- 修改資料等請求應依實際 Cookie 策略防範 CSRF。
- 登出時應使登入狀態失效。
- Token 應有合理期限及撤銷策略。
- 角色及權限必須由後端資料來源確認。

## 12. 安全與防濫用

- 設定登入及註冊請求限制。
- 對 AI 請求設定額度。
- 驗證所有輸入資料。
- 使用 Prisma 參數化資料存取。
- 防止 XSS、CSRF 及其他常見攻擊。
- 設定 CORS 允許來源。
- 保護管理員端點。
- 記錄重要操作。
- 避免在日誌中寫入密碼、Token 及敏感個資。
- 對檔案上傳執行安全檢查。

## 13. 日誌與監控

應記錄：

- API 請求及回應狀態。
- 錯誤事件。
- 登入及登出事件。
- 權限拒絕事件。
- 管理員重要操作。
- AI 使用量及服務異常。
- 資料庫錯誤。

日誌應具備請求識別碼，方便追蹤問題。正式環境應避免記錄不必要的個人資料。

## 14. API 文件與測試

使用 OpenAPI 描述 API。

每個端點至少定義：

- HTTP 方法。
- URL。
- 請求參數。
- Request Body。
- 回應格式。
- 權限需求。
- 錯誤代碼。

測試使用 Vitest 及適合的 API 整合測試工具。

測試項目：

- 正常請求。
- 無效輸入。
- 未登入請求。
- 不同角色權限。
- 跨班級資料存取。
- 不存在的資料。
- 重複提交。
- 外部 AI 服務異常。
- 資料庫錯誤。

## 15. 開發順序

1. 建立 Express + TypeScript 基礎服務。
2. 建立環境變數及資料庫連線。
3. 建立統一錯誤處理。
4. 建立驗證及權限 Middleware。
5. 建立 Auth API。
6. 建立 Users API。
7. 建立課程及教材 API。
8. 建立題庫及練習 API。
9. 建立考試及作答 API。
10. 建立學習紀錄 API。
11. 建立 AI API。
12. 建立教師及管理 API。
13. 建立遊戲及成就 API。
14. 完成 OpenAPI 文件及自動化測試。

## 16. 驗收標準

- [ ] 後端資料夾結構清楚。
- [ ] Routes、Middleware、Controllers、Services 及 Repositories 分工明確。
- [ ] API 路徑採用版本管理。
- [ ] 核心模組具備 API 規劃。
- [ ] 使用者身分及權限由後端驗證。
- [ ] 輸入資料有完整驗證。
- [ ] API 回應格式統一。
- [ ] 錯誤處理及日誌機制完整。
- [ ] AI API Key 不會暴露於前端。
- [ ] 具備 API 文件及測試規劃。

---

**文件狀態：** 後端 API 架構初版，待實際端點、資料模型及權限測試驗證。  
**重要說明：** 本文件是後端設計規範，不代表所有 API 已經實作或正式可用。
