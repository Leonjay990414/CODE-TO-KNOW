# CODE TO KNOW（碼上學）
# 資料庫整合測試計畫與驗收規格書 (DATABASE TEST PLAN)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Pre-Database Implementation)
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_TEST_PLAN.md`
- **測試工具鏈**：Vitest 2.1、Supertest 7.0、Playwright / Headless Chrome CDP、Prisma Client

---

## 一、測試階段分流原則

依據專案建置進程，嚴格劃分兩類測試範疇：
1. **可先準備（Pre-Database Ready）**：不依賴即時資料庫連線的單元測試、Zod Schema 校驗、純記憶體 RBAC 邏輯測試、前端型別健全性、Mock API 介面測試。
2. **待資料庫施工後執行（Post-Database Required）**：需依賴真實 PostgreSQL 引擎執行事務、外鍵約束、唯一索引衝突、連線池滿載、跨班隔離與實際備份還原演練的整合測試。

---

## 二、測試案例矩陣與執行準備度清單

| 測試項目編號 | 測試模組與情境 | 預期通過條件 | 測試準備度標記 | 驗收指令 / 執行工具 |
|:---:|---|---|:---:|---|
| **TP-01** | **使用者註冊與密碼強度** | 弱密碼拒絕；合格密碼以 bcrypt 雜湊後入庫；預設賦予 `STUDENT` 角色。 | ✅ **可先準備** | `vitest run tests/validation.test.ts` |
| **TP-02** | **Session 建立、驗證與撤銷** | 登入發行 HttpOnly Cookie，資料庫記錄 Token 雜湊；登出後立即失效。 | ⏳ **待資料庫後** | `vitest run tests/integration.db.test.ts` |
| **TP-03** | **學生個人學習資料隔離** | 學生 A 無法查詢學生 B 之個人學習歷程、錯題本或測驗明細（回傳 403/404）。 | ⏳ **待資料庫後** | Supertest + 多帳號 Cookie |
| **TP-04** | **教師班級權限與防越權 (BOLA)** | 教師甲試圖調閱教師乙之班級名冊，後端攔截並回傳 403 `ACCESS_DENIED_NOT_CLASS_TEACHER`。 | ⏳ **待資料庫後** | Supertest 跨班攻擊模擬 |
| **TP-05** | **管理員角色授權與審核** | 僅 `ADMIN` 角色能調閱教師申請列表並核准；核准後自動將目標使用者升級為 `TEACHER`。 | ⏳ **待資料庫後** | `vitest run tests/rbac-workflow.test.ts` |
| **TP-06** | **題庫與選項級聯完整性** | 刪除題目時，關聯之選項同步刪除；若已有作答紀錄（`ExamAnswer`），資料庫應拒絕刪除（Restrict）。 | ⏳ **待資料庫後** | PostgreSQL 外鍵約束測試 |
| **TP-07** | **模擬考作答提交與自動計分** | 學生交卷後，後端比對 `Question.correctAnswer` 計算總分，原子更新 `ExamAttempt` 與 `ExamResult`。 | ⏳ **待資料庫後** | 後端 Service 單元與整合測試 |
| **TP-08** | **錯題本自動記錄與消滅邏輯** | 答錯自動 Upsert 至 `WrongQuestion`；後續若連續答對達門檻，自動標記 `isMastered = true`。 | ⏳ **待資料庫後** | 資料庫 Upsert 邏輯測試 |
| **TP-09** | **前端目標路由安全白名單** | 登入後還原之目標路由若包含未授權或外部惡意網址，一律強制重導向回 `#hero`。 | ✅ **可先準備** | 前端 Jest/Vitest 單元測試 |
| **TP-10** | **資料庫斷線優雅降級** | 當 PostgreSQL 停止服務時，API 健全檢查回傳 503 `degraded`，前端顯示連線異常重試卡片，不洩漏資料庫連線字串。 | ✅ **可先準備** | `vitest run tests/api.test.ts` |
| **TP-11** | **高併發連線池壓力測試** | 模擬 100 名學生同時提交模擬考卷，`pg.Pool` 連線池不發生崩潰或記憶體洩漏，逾時請求妥善排隊。 | ⏳ **待資料庫後** | k6 / autocannon 壓力測試 |
| **TP-12** | **全備份與冷還原演練** | 使用 `pg_dump` 導出備份後，於乾淨資料庫中成功導入，資料筆數與校驗碼完全相符。 | ⏳ **待資料庫後** | Bash / PowerShell 自動化腳本 |

---

## 三、自動化測試執行腳本規劃 (Test Automation Scripts)

正式施工時，將於 `backend/tests/` 建立下列專屬整合測試檔案：

1. `tests/integration/student-isolation.test.ts`：專責檢驗學生個人隱私邊界，確保跨帳號無法調閱錯題本與成績。
2. `tests/integration/teacher-class-rbac.test.ts`：專責檢驗多任課老師、班級邀請碼加入與跨班名冊阻絕。
3. `tests/integration/exam-scoring.test.ts`：專責檢驗官方題庫抽題、交卷計分與及格門檻判斷。
4. `tests/integration/audit-trail.test.ts`：專責檢驗所有管理操作皆同步落盤至不可竄改之 `AdminAuditLog`。

---

## 四、公告與通知系統專屬驗收測試矩陣 (12 項資安與業務測試案例)

依據系統補充規範，公告系統需通過下列 12 項高強度驗收情境：

| 測試編號 | 測試案例說明 | 測試輸入與操作 | 預期斷言結果 (Assertions) | 測試類型與階段 |
|:---:|---|---|---|:---:|
| **TP-ANN-01** | **Category A 官方公告發布權限** | `STUDENT` 或 `TEACHER` 試圖呼叫 `POST /api/admin/platform-announcements` | 後端攔截回傳 `403 Forbidden`；僅 `PLATFORM_ADMIN` 及具維護權限之 `SYSTEM_OPERATOR` 能成功建立。 | 單元/整合測試 (待資料庫後) |
| **TP-ANN-02** | **Category B 班級教學公告歸屬驗證** | 教師甲試圖對教師乙之班級發布 `POST /api/announcements` (`targetType='CLASS', targetValue=classB`) | 後端檢驗 `ClassTeacher` 授權失敗，回傳 `403 ACCESS_DENIED_NOT_CLASS_TEACHER`。 | 整合測試 (待資料庫後) |
| **TP-ANN-03** | **學生自主學習心得班級限定** | 學生發布 `LEARNING_SHARE`，目標設定為未加入之班級 ID 或設定 `ALL` | 後端驗證 `Enrollment` 失敗，拒絕建立；僅限對其有效在籍班級發文。 | 整合測試 (待資料庫後) |
| **TP-ANN-04** | **學生發布平台官方公告阻絕** | 學生送出 `category: 'PLATFORM'` 之請求 | 後端強制拋出 `403 Forbidden`，不允許非管理者建立官方公告。 | 單元/整合測試 (可先準備) |
| **TP-ANN-05** | **未登入訪客存取邊界隔離** | 訪客請求 `GET /api/announcements` 或班級公告詳情 | 未登入請求一律導向公開 API `GET /api/platform-announcements`，非公開內容拒絕 (401/403)。 | 單元/整合測試 (可先準備) |
| **TP-ANN-06** | **公告已讀狀態冪等性與計數防洗** | 學生對同一個公告連續呼叫 5 次 `POST /api/announcements/:id/read` | `AnnouncementRead` 僅存 1 筆紀錄，首次 `firstReadAt` 保持不變，`lastReadAt` 更新，已讀數不重複累加。 | 整合測試 (待資料庫後) |
| **TP-ANN-07** | **下架與逾期公告動態過濾** | 查詢公告列表，其中包含 `status='WITHDRAWN'` 或 `expiresAt < NOW()` 之紀錄 | 查詢結果一律排除撤回與過期之公告，對外不洩漏失效內容。 | 整合測試 (待資料庫後) |
| **TP-ANN-08** | **撤回公告關聯一致性維護** | 管理員執行撤回公告 `POST /api/admin/platform-announcements/:id/withdraw` | 公告狀態標記為 `WITHDRAWN`，前台即刻隱藏，關聯之已讀與通知維持軟刪除或隔離。 | 整合測試 (待資料庫後) |
| **TP-ANN-09** | **郵件外寄失敗重試與排程健全** | Mock SMTP 拋出逾時異常，Worker 處理 `EmailQueue` | 狀態轉為 `FAILED`，`retryCount` 由 0 遞增至 1，記錄 `lastError`，排入退避重試排程。 | 整合測試 (待資料庫後) |
| **TP-ANN-10** | **EmailQueue 儲存脫敏與範本解耦** | 檢查 `EmailQueue` 寫入之欄位內容 | 僅包含 `templateKey` 與參數 JSON，嚴禁重複儲存大段 HTML；Email 日誌脫敏。 | 單元測試 (可先準備) |
| **TP-ANN-11** | **跨班公告穿透攻擊阻絕** | 學生甲竄改 API 參數，嘗試調閱班級乙之專屬作業公告詳情 | 後端以 `req.user.id` 檢查受眾關聯，判定不屬該班成員，回傳 `404 Not Found` 或 `403 Forbidden`。 | 整合測試 (待資料庫後) |
| **TP-ANN-12** | **教師跨班個人通知越權阻絕** | 教師甲嘗試向非其班級之學生乙發送個人指導通知 | 後端檢驗學生乙是否處於教師甲任教之班級，若無則回傳 `403 Forbidden`。 | 整合測試 (待資料庫後) |
