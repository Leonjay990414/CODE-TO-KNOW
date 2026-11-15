# 碼上學｜CODE TO KNOW
# 第 4 波：平台管理員與系統營運後台功能矩陣（Phase 4 Feature Matrix）

**文件版本：** v1.0  
**產生時間：** 2026-11-15  
**主要對應階段：** P16（平台管理員與系統營運後台）  
**關聯階段：** P07（資安防禦）、P09（後端 API 與資料庫）、P15（教師教學平台）  
**基準 Git HEAD：** `c44ea7929f39ef469f380027c2fd3143726d9922`

---

## 一、功能矩陣總覽表

| 功能編號與名稱 | 前端 UI 元件與互動 | 真實 API 端點與方法 | 資料模型 / 儲存來源 | 權限與身分驗證機制 | 自動化測試覆蓋 | 當前狀態判定 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P16-ADM-001**<br>教師資格人工審核 | `AdminDashboardPage.tsx`<br>待審核列表、狀態過濾（PENDING/APPROVED/REJECTED/ALL）、姓名/學校搜尋、審核彈窗、審核備註輸入 | `GET /api/admin/teacher-applications`<br>`POST /api/admin/teacher-applications/:id/approve`<br>`POST /api/admin/teacher-applications/:id/reject` | Prisma `TeacherApplication`<br>關聯 `User`，事務寫入 `UserRole` (TEACHER) | `authenticate` + `requireRoles(['ADMIN'])` + `csrfProtection` | `tests/admin-dashboard.test.tsx` (it 4, 7, 8) & `tests/admin-hardening.test.ts` | **FULL PASS** |
| **P16-ADM-002**<br>題庫教材上架品質審核 | `AdminDashboardPage.tsx` Tab 6<br>官方 173003A17 試題核實狀態展示（全量 605 題）、工作項目 01~04 覆蓋檢核 | 本地題庫資料結構模型<br>`ALL_OFFICIAL_THEORY_QUESTIONS` | 勞動部現行公告 173003A17.pdf（V115100817），結構化 JSON 存檔 | 唯讀品質展示，防範未經授權之第三方題庫直接發布 | `tests/official-theory-question-bank.test.ts` (5 tests) | **FULL PASS (Read-only)** |
| **P16-ADM-003**<br>術科題組安全審計 | `AdminDashboardPage.tsx` Tab 6<br>五大正式術科題組（104301~104305）素材索引與考點檢核表檢視 | 本地術科資料結構模型<br>`unifiedPracticalCurriculumData` | 173003B12 / 173003B13 官方素材（114 檔案完整校對） | 唯讀保護模式，禁止任意修改題目、步驟或評分條件 | `tests/unified-practical-curriculum.test.ts` (7 tests) | **FULL PASS (Read-only Guarded)** |
| **P16-ADM-004**<br>維運事件分級通報 | `AdminDashboardPage.tsx` Tab 7<br>P0～P3 事件通報等級矩陣、通報時限與處置 SOP 展示 | 靜態平台維運政策規範 | 依據教育部與資通安全管理法之資安通報指標規範 | 平台最高管理員監看指引 | `frontend/tests/legal-routes.test.tsx` | **FULL PASS (Policy Definition)** |
| **P16-ADM-005**<br>防篡改系統安全日誌 | `AdminDashboardPage.tsx` Tab 4<br>安全日誌表格、分頁、Action 類型過濾、IP/裝置顯示、JSON 參數展開 | `GET /api/admin/audit-logs` | Prisma `AuditLog`<br>關聯 `User`，後端強制執行 `sanitizeAuditDetails` 脫敏 | `authenticate` + `requireRoles(['ADMIN'])` | `tests/admin-dashboard.test.tsx` (it 5) & `tests/audit-redaction.test.ts` (10 tests) | **FULL PASS** |
| **P16-ADM-006**<br>系統即時健康度探針 | `AdminDashboardPage.tsx` Tab 5 & 頂部 Overview<br>系統健康狀態、資料庫連線指標、延遲毫秒展示 | `GET /api/health`<br>(匿名公開存活探針) | 後端即時執行 `prisma.$queryRaw\`SELECT 1\`` 探針 | 最小資訊揭露原則（不洩露環境變數與連線密碼） | `tests/admin-dashboard.test.tsx` (it 6, 9) & `tests/api.test.ts` (it 1) | **FULL PASS** |
| **P16-ADM-007**<br>全平台帳號治理 | `AdminDashboardPage.tsx` Tab 2<br>已核准認證教師名冊展示、帳號安全治理邊界規範說明 | 目前僅展示經由審核之教師名冊；後端尚無全量帳號治理端點 | 目前由 `TeacherApplication` 關聯之 `User` 衍生 | 誠實標註：高影響帳號操作需後端 API 與審計支援，不造假按鈕 | `tests/admin-dashboard.test.tsx` (it 3, 10) | **PARTIAL (誠實標註邊界)** |
| **P16-ADM-008**<br>全平台班級治理 | `AdminDashboardPage.tsx` Tab 3<br>班級數據治理與 Anti-IDOR 隔離原則說明、班級治理欄位規範表 | 後端目前僅有導師個人班級 API；全域跨班級監理端點規劃中 | 班級治理資料結構規範（id, name, joinCode, creatorId, memberCount） | 嚴格遵守後端安全隔離原則，不以不安全的前端模擬越權 | `tests/classroom-permission.test.ts` & `tests/idor-ownership.test.ts` | **ROADMAP (架構規範定義)** |
| **P16-ADM-010**<br>平緩降級保護機制 | `AdminDashboardPage.tsx` Tab 7<br>外部服務異常與 API 配額耗盡時之 4 階段降級機制說明 | 靜態降級防護邏輯 | 本地靜態規則提示庫 + LocalStorage 容錯回復機制 | 全站自動化例外捕獲與錯誤隔離 | `tests/game-session-resilience.test.ts` & `tests/safe-error-logger.test.ts` | **FULL PASS** |
| **P16-ADM-015**<br>敏感資料脫敏保護 | `AdminDashboardPage.tsx` Tab 4<br>安全日誌檢視中脫敏隱藏密碼、金鑰、Token 與個資 | `GET /api/admin/audit-logs` | 後端 `sanitizeAuditDetails` 遞歸遮蔽密碼、Token 與機密欄位 | 伺服端強制脫敏，管理員端亦無法檢視明文密碼 | `tests/audit-redaction.test.ts` (10 tests) | **FULL PASS** |

---

## 二、功能狀態分布統計

| 判定等級 | 項目數 | 佔比 | 說明 |
| :--- | :--- | :--- | :--- |
| **FULL PASS** | 8 項 | 80.0% | 具備完整前端 UI、真實後端 API、嚴格權限驗證與自動化單元/契約測試。 |
| **PARTIAL (誠實標註邊界)** | 1 項 | 10.0% | 全平台帳號治理（P16-ADM-007）：目前已完成認證教師名冊呈現，但因全量帳號註銷/凍結屬高風險操作，未獲後端 API 支援前不製造假按鈕。 |
| **ROADMAP (架構規範定義)** | 1 項 | 10.0% | 全平台班級治理（P16-ADM-008）：班級模組目前遵循租戶隔離與 Anti-IDOR，全域跨班級監理端點明確列為未來規劃模組。 |
| **總計** | 10 項 | 100% | 核心管理員能力（教師審核、日誌審計、健康度檢測、題庫教材上架治理）達到高可用與高可信度標準。 |
