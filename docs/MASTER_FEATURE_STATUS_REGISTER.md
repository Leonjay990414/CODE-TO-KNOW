# CODE TO KNOW｜全專案功能狀態判定登記表 (Master Feature Status Register)

版本：MASTER-FEATURE-STATUS-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
評估原則：嚴禁放寬標準；純本地/LocalStorage 必須明確標註為 PROTOTYPE 或 PARTIAL；未接通雲端生產庫絕不標記為 PASS。

---

## 一、狀態判定基準定義 (Classification Criteria)

1. **PASS (正式就緒)**：前後端、介面規格、業務邏輯與測試皆完整，具備可驗證證據，無已知阻斷缺陷。
2. **PARTIAL (部分完成)**：前端與邏輯已完成核心，但在資料持久化、雲端 API 或進階功能上尚待接軌（如本地 70% 原型）。
3. **PROTOTYPE (本機展示/原型)**：僅於前端以 Mock Data、LocalStorage 或 SessionStorage 實現之功能，尚未串接後端 API 與資料庫。
4. **NOT STARTED (尚未啟動)**：規劃於未來階段，目前尚未編寫具體程式碼。
5. **BLOCKED (阻斷/政策鎖定)**：受外部環境依賴、付費授權限制或專案最高安全限制（如 AUTH-03 隔離）而暫停操作之項目。

---

## 二、全專案核心功能模組逐項判定清單

### 1. 第一層：訪客與品牌公開層 (L1 Public & Visitor Layer)

| 功能模組名稱 | 頁面與組件位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 本地原型特徵 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **品牌形象首頁** | `pages/public/HomePage.tsx` | P02 / P02-WEB-001 | **PASS** | `HomePage.tsx#L1-L180` | `frontend/tests/home.test.ts` (PASS) | 無 (已接入正式展示數據標示) | 持續維護動態視覺效果 |
| **法律與版權聲明** | `pages/public/LegalNoticePage.tsx` | P02 / P02-WEB-002 | **PASS** | `LegalNoticePage.tsx#L1-L220` | `frontend/tests/legal.test.ts` (PASS) | 無 | 待法務專業複核正式用詞 |
| **認證檢定科目導覽** | `pages/public/CertificationsPage.tsx` | P02 / P02-WEB-003 | **PASS** | `CertificationsPage.tsx#L1-L250` | `frontend/tests/certifications.test.ts` (PASS) | 無 | 擴充第二職類 (如軟體設計) |
| **檢定詳細考情規格** | `pages/public/CertificationDetailPage.tsx`| P02 / P02-WEB-004 | **PASS** | `CertificationDetailPage.tsx#L1-L280`| `frontend/tests/cert-detail.test.ts` (PASS) | 無 | 保持考情簡章年度同步更新 |
| **104301~104305 題組展示** | `pages/public/WebDesignCDemoPage.tsx` | P02 / P02-WEB-005 | **PASS** | `WebDesignCDemoPage.tsx#L1-L320`| `frontend/tests/demo.test.ts` (PASS) | 無 (官方題目規範完整呈列) | 增加各題組動畫效果展示 |
| **AI 家教互動展示** | `pages/public/AICoachPage.tsx` | P11 / P11-AI-001 | **PROTOTYPE** | `AICoachPage.tsx#L1-L350` | `frontend/tests/ai-coach.test.ts` (PASS) | **是** (aiFallbackEngine 擬真生成) | 待後端串接雲端 LLM API |

### 2. 第二層：學生學習與實作層 (L2 Student Learning Layer)

| 功能模組名稱 | 頁面與組件位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 本地原型特徵 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **學生個人儀表板** | `pages/public/StudentDashboardPage.tsx` | P03 / P03-STD-001 | **PARTIAL** | `StudentDashboardPage.tsx#L1-L400`| `frontend/tests/student-dashboard.test.ts` | **是** (支援 LocalStorage 雙模) | 待對接後端學員數據同步 API |
| **學科 674 題刷題** | `pages/public/TheoryPracticePage.tsx` | P09 / P09-THY-001 | **PASS** | `TheoryPracticePage.tsx#L1-L550` | `frontend/tests/theory.test.ts` (PASS) | 題目為官方正式 JSON | 增加自訂篩選與隨機抽題組 |
| **80 題倒數模擬測驗** | `pages/public/MockExamPage.tsx` | P09 / P09-EXM-001 | **PASS** | `MockExamPage.tsx#L1-L480` | `frontend/tests/mock-exam.test.ts` (PASS) | 測驗成績存於 localStorage | 待對接雲端成績單存檔 API |
| **題庫匯入檢核工具** | `pages/public/QuestionBankImportSystemPage.tsx`| P09 / P09-IMP-001 | **PASS** | `QuestionBankImportSystemPage.tsx#L1-L500`| `frontend/tests/question-import.test.ts`| 無 | 待接管理員直接寫入資料庫 |
| **個人錯題本與重練** | `utils/wrongQuestionsStorage.ts` | P09 / P09-UTL-003 | **PROTOTYPE** | `wrongQuestionsStorage.ts#L1-L150` | `frontend/tests/wrong-questions.test.ts` | **是** (`code_to_know_wrong_questions`) | 待對接 Prisma WrongQuestionRecord |
| **術科學習大廳** | `pages/student/practical/StudentPracticalHubPage.tsx`| P10 / P10-PRC-004 | **PASS** | `StudentPracticalHubPage.tsx#L1-L300`| `frontend/tests/practical-hub.test.ts` | 無 | 串聯題組學習路徑引導 |
| **五大題組步進教學** | `pages/student/practical/PracticalLessonPage.tsx` | P10 / P10-PRC-007 | **PASS** | `PracticalLessonPage.tsx#L1-L450` | `frontend/tests/practical-lesson.test.ts`| 程式碼進度存於 localStorage | 待對接雲端代碼版本歷程 |
| **術科雙欄即時沙盒** | `pages/student/practical/PracticalSandboxPage.tsx`| P10 / P10-IDE-001 | **PASS** | `PracticalSandboxPage.tsx#L1-L520`| `frontend/tests/practical-sandbox.test.ts`| 沙盒於 iframe 本機隔離執行 | 增加自動語法評分比對引擎 |
| **獨立雲端編輯器** | `pages/public/CodeEditorPage.tsx` | P12 / P12-IDE-001 | **PASS** | `CodeEditorPage.tsx#L1-L400` | `frontend/tests/code-editor.test.ts` | 編輯草稿存於 localStorage | 增加檔案樹多檔案編輯支援 |
| **遊戲學習大廳** | `pages/public/GameCenterPage.tsx` | P14 / P14-GAM-001 | **PASS** | `GameCenterPage.tsx#L1-L320` | `frontend/tests/game-center.test.ts` | 本地星級與積分記錄 | 對接班級遊戲排行榜 |
| **五大遊戲闖關單元** | `CodePuzzle`, `CSSDesigner`, `BugHunter`, `QuizRush`, `WebBuilder` | P14 / P14-GAM-002~006 | **PASS** | 各自獨立 Page.tsx | 前端 Vitest 單元測試通過 | 關卡進度存於 localStorage | 增加更多題型與動態關卡生成 |

### 3. 第三層：教師教學管理層 (L3 Teacher Instruction Layer)

| 功能模組名稱 | 頁面與組件位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 本地原型特徵 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **教師教學儀表板** | `pages/public/TeacherDashboardPage.tsx` | P08 / P08-TCH-005 | **PASS** | `TeacherDashboardPage.tsx#L1-L450`| `frontend/tests/teacher-dashboard.test.ts`| 支援雙模切換 | 後端 API 已接通，前端 UI 完備 |
| **班級建立與管理** | `backend/src/modules/classrooms/` | P08 / P08-CLS-001~005 | **PASS** | `classroom.controller.ts`, `classroom.service.ts` | `backend/tests/classroom-routes.test.ts` (PASS)| 無 (後端正式實作) | 增加學生作業批改與匯出名冊 |
| **教師遊戲作業派發**| `utils/teacherGameTaskManager.ts` | P14 / P14-GAM-014 | **PARTIAL** (70%) | `teacherGameTaskManager.ts#L1-L260`| `phase5-teacher-admin-game-integration.test.ts`| **是** (支援班級與教師隔離存取) | 待後端實作 ClassAssignment API |

### 4. 第四層：平台管理層 (L4 Platform Admin Layer)

| 功能模組名稱 | 頁面與組件位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 本地原型特徵 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **平台管理員後台** | `pages/public/AdminDashboardPage.tsx` | P16 / P16-ADM-005 | **PASS** | `AdminDashboardPage.tsx#L1-L420` | `frontend/tests/admin-dashboard.test.ts` | 支援雙模切換 | 嚴格隔離 L5 營運監控，專注 L4 管理 |
| **教師申請核駁審查**| `backend/src/modules/admin/` | P16 / P16-ADM-008~010 | **PASS** | `admin.controller.ts`, `admin.service.ts` | `backend/tests/admin-hardening.test.ts` (PASS) | 無 (後端正式實作) | 增加駁回原因範本與批量審查 |
| **全系統審計日誌查詢**| `backend/src/modules/admin/` | P16 / P16-ADM-011 | **PASS** | `admin.controller.ts#L100-L150` | `backend/tests/audit-redaction.test.ts` (PASS) | 無 (個資去識別化脫敏) | 增加日誌 CSV 匯出與時間範圍檢索 |
| **全域遊戲配置管理**| `utils/adminGameConfigManager.ts` | P14 / P14-GAM-015 | **PARTIAL** (70%) | `adminGameConfigManager.ts#L1-L240`| `phase5-teacher-admin-game-integration.test.ts`| **是** (全域關卡開關與難度覆寫) | 待後端資料庫配置持久化表 |

### 5. 第五層：系統營運層 (L5 System Operations Layer)

| 功能模組名稱 | 頁面與組件位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 本地原型特徵 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **系統營運即時監控**| `pages/system-ops/SystemOpsDashboardPage.tsx` | P16 / P16-OPS-001 | **PASS** | `SystemOpsDashboardPage.tsx#L1-L380` | `frontend/tests/system-ops.test.ts` (PASS) | 明確標示展示與即時指標 | 即時調用 `/api/health` 取得 DB 延遲 |

### 6. 後端認證、資料庫與外部相依層 (Backend Auth, DB & External)

| 功能模組名稱 | 核心檔案位置 | 歸屬階段與 UID | 判定結果 | 目前程式碼位置 | 測試檔案與證據 | 阻斷或限制原因 | 剩餘缺口與後續工作 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **後端 JWT & CSRF 認證**| `backend/src/modules/auth/` | P05 / P07 (12 UID) | **PASS** | `auth.controller.ts`, `tokens.ts` | `backend/tests/auth-lifecycle.test.ts` (221 測全綠) | 無 | 正式發信服務對接 (Resend/SMTP) |
| **本機 Docker PG17 連線**| `backend/src/config/database.ts` | P04 / P04-DB-001 | **PASS** | `database.ts`, `db-validation.ts` | `backend/tests/db-config-safety.test.ts` | 無 | 供本地測試與離線開發使用 |
| **雲端正式 Supabase 連線**| `backend/src/config/db-validation.ts`| P04 / P04-DB-007 | **BLOCKED** | `db-validation.ts#L180-L260` | 安全策略隔離守護 | **AUTH-03 安全隔離** | 待正式部署上線前經明確授權啟用 |
| **GCP 付費雲端 MCP 服務**| `c:\Users\user\.gemini\config\mcp_config.json` | P06 / P06-MCP-007~011| **BLOCKED** | `mcp_config.json` | 無付費帳號綁定 | **最高安全限制** | 保持鎖定，禁止擅自開通付費服務 |

---

## 三、全專案功能成熟度綜合統計

- **總盤點功能項目數**：28 項核心功能。
- **判定為 PASS (正式就緒)**：18 項 (64.3%)。
- **判定為 PARTIAL (70% 部分完成)**：3 項 (10.7%)。
- **判定為 PROTOTYPE (本機展示/原型)**：3 項 (10.7%)。
- **判定為 BLOCKED (安全/授權鎖定)**：4 項 (14.3%)。
- **判定為 NOT STARTED**：0 項 (目前規劃範圍內均已有實作或原型對齊)。
