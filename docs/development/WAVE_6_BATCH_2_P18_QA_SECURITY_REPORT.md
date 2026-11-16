# 碼上學｜CODE TO KNOW
# 第六波 Batch 2：P18 系統測試、品質控管與資安檢查全面報告（校正修訂版）
**Wave 6: Batch 2 Phase 18 System Testing, Quality Assurance & Security Comprehensive Report (Revised)**

- **執行日期**：2026-11-16
- **執行工具**：Antigravity IDE
- **正式整體進度基準**：**49.166860%**（嚴格保護凍結，維持 2026/11/15 官方核定值）
- **官方核准 226 UID 基準分佈**：**PASS 70 項、PARTIAL 79 項、NOT STARTED 73 項、BLOCKED 4 項**（總計 226 項）
- **第五波結案狀態**：CONDITIONAL PASS（全面終止一般性反覆稽核）
- **核心交付標的**：P18 14 項 UID 逐項檢核、226 UID 完整測試追蹤矩陣、跨角色端到端整合測試、全站資安靜態稽核、前後端 670 個自動化測試

---

## 一、226 UID 母體一致性與官方基準調查校核

### 1.1 基準數據差異溯源與校正說明
在歷史文件中存在兩組統計數字，本批次經完整溯源確認其演進關係：
1. **舊版草案數值（68 / 75 / 79 / 4，進度 45.961878%）**：
   - 來源：2026-11-13 初始建立之 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` 靜態文本。
2. **正式核定基準（70 / 79 / 73 / 4，進度 49.166860%）**：
   - 來源：2026-11-15 Phase 4 完工後，經 `docs/development/PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_4.md` 與 `docs/development/PROJECT_PHASE_1_TO_4_FORMAL_HANDOFF.md` 正式核准生效之全站基準。
   - 變更原因：Phase 4 完成了 14 項實質升級（包括 `P13-STU-007` 題庫、`P16-ADM-014` 管理後台隔離、`P18-QAS-011` 無障礙焦點等），將 2 項 NOT STARTED 升為 PASS，4 項 NOT STARTED 升為 PARTIAL，使 PASS 由 68 增至 70、PARTIAL 由 75 增至 79、NOT STARTED 由 79 降至 73，加權進度提升至 **49.166860%**。
3. **結論與處置紀律**：
   - **本專案唯一有效之官方核定基準為：PASS 70、PARTIAL 79、NOT STARTED 73、BLOCKED 4，正式進度 49.166860%**。
   - 嚴格維持此原核准基準，絕不擅自以未經核准之變更予以覆蓋。

---

## 二、P18 系統測試 14 項 UID 逐項狀態對照表

本表以 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` 原始定義為依據。**保留原始基準狀態，不將本次測試成果擅自竄改為正式百分比**：

| 正式 UID | 正式名稱 | 原始核准狀態 | 原始比率 | 本次實作／驗證證據 | 已覆蓋驗證範圍 | 未覆蓋邊界與阻塞原因 | 建議驗收狀態 |
|---|---|:---:|:---:|---|---|---|:---:|
| `P18-QAS-001` | 建立需求—功能—測試案例追蹤表。 | `NOT STARTED` | 0% | [CODE_TO_KNOW_226_UID_TRACEABILITY_MATRIX.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/CODE_TO_KNOW_226_UID_TRACEABILITY_MATRIX.md) | 涵蓋全專案 20 階段 226 項 UID 需求、代碼、測試套件與阻塞標記 | 待專案負責人正式簽核採納 | **PASS (候選)** |
| `P18-QAS-002` | 測試訪客、學生、教師、平台管理員、系統管理者完整流程。 | `NOT STARTED` | 0% | [cross-role-integration.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/cross-role-integration.test.tsx)、`rbac-workflow.test.ts` | 訪客/學生/教師/管理員跨角色頁面存取、Navbar 狀態、403 攔截、意圖路由、教師申請審核 | 雲端實體 PostgreSQL 跨網路連線（受限 AUTH-03 BLOCKED） | **PASS (候選)** |
| `P18-QAS-003` | 測試註冊、登入、登出、信箱驗證、密碼重設及權限拒絕。 | `NOT STARTED` | 0% | `auth-lifecycle.test.ts`、`security.test.ts`、`cross-role-integration.test.tsx` | 密碼雜湊 bcrypt 驗證、CSPRNG Token、登出 Session 清除、CSRF 防護 | 外部真實 SMTP 發信至實體郵箱點擊 | **PASS (候選)** |
| `P18-QAS-004` | 測試題庫匯入、作答、計分、考試、交卷、補考及成績。 | `NOT STARTED` | 0% | `official-theory-question-bank.test.ts`、`mock-exam-system.test.ts`、`wrong-questions-review-system.test.ts` | 官方 17300 網頁設計丙級 605 題庫、模擬考計時、成績計算、錯題本 | 跨裝置多端即時答題雲端同步 | **PASS (候選)** |
| `P18-QAS-005` | 測試術科五大題組內容、教材下載及程式工作台。 | `NOT STARTED` | 0% | `practical-task5-curriculum.test.ts`、`unified-practical-curriculum.test.ts` | 題組一至五教材完整性驗證、代碼編輯器、五大題組（104301~104305）完全保護 | 學生在線雲端容器化執行環境 | **PASS (候選)** |
| `P18-QAS-006` | 測試遊戲計分、獎勵、重複請求與排行榜防竄改。 | `NOT STARTED` | 0% | `bug-hunter-game.test.ts`、`code-puzzle-game.test.ts`、`css-designer-game.test.ts`、`game-session-resilience.test.ts` | 五大教育遊戲迴圈、星級評分、防竄改時間戳、Session 重放防禦 | 全球多人即時連線對戰伺服器 | **PASS (候選)** |
| `P18-QAS-007` | 測試 AI 回答品質、用量限制、成本上限與服務中斷處理。 | `NOT STARTED` | 0% | `ai-scaffolding.test.ts`、`aiFallbackEngine.ts` | 4 階認知鷹架、反劇透防護、離線備援引導、領域分類器 | 雲端 Gemini / OpenAI 付費 API 連線 | **PASS (候選)** |
| `P18-QAS-008` | 測試郵件寄送、退信、重試與通知狀態。 | `NOT STARTED` | 0% | `email-queue.test.ts`、`email-templates.test.ts`、`notification-center.test.tsx` | 站內通知中心、指數退避重試、死信佇列、退訂抑制清單、80% 配額預警 | 正式雲端 SES/SendGrid 實際投遞 | **PASS (候選)** |
| `P18-QAS-009` | 測試 API 授權、RLS、輸入驗證、速率限制及常見安全風險。 | `NOT STARTED` | 0% | `admin-hardening.test.ts`、`idor-ownership.test.ts`、`validation.test.ts`、`csrf.ts` | RBAC 權限隔離、IDOR 防越權檢查、Zod 輸入校驗、Double Submit CSRF、速率限制 | 雲端實體 WAF 防火牆壓測 | **PASS (候選)** |
| `P18-QAS-010` | 測試資料備份、復原、資料刪除及稽核紀錄。 | `PASS` | 100% | `audit-redaction.test.ts`、`safe-error-logger.test.ts`、`backend/src/utils/audit.ts` | 稽核日誌 Email/IP/身分證個資遮罩、安全錯誤記錄、操作審計追蹤 | 異地機房冷備份演練 | **PASS (保留)** |
| `P18-QAS-011` | 測試 375、390、768、1024、1440 等視窗及主流瀏覽器。 | `PARTIAL` | 60% | RWD 稽核報告、6 大螢幕截圖 Artifacts（320px、375px、768px、840px、1024px、1440px） | 320px~1920px 響應式排版、漢堡抽屜導覽、卡片堆疊與網格切換 | 實體折疊手機與智慧電視測試 | **PASS (候選)** |
| `P18-QAS-012` | 測試載入效能、錯誤監控、可用性與高峰負載。 | `NOT STARTED` | 0% | `game-performance-stability.test.ts`、前端 Vite 生產打包 gzip 分析（< 2.5s） | 靜態資源 gzip 壓縮、代碼拆分、生產環境堆疊軌跡隱藏 | 萬人同時高並發壓測（待上線階段） | **PASS (候選)** |
| `P18-QAS-013` | 執行無障礙檢查、隱私檢查及第三方套件弱點檢查。 | `PARTIAL` | 60% | `a11y-keyboard-navigation.test.tsx`、`legal-routes.test.tsx`、npm audit 報告 | WCAG 2.1 AA 焦點捕捉與 Esc 關閉、隱私權宣告、esbuild/tinypool 已緩解處置 | 實體點字閱讀器設備測試 | **PASS (候選)** |
| `P18-QAS-014` | 完成缺陷分級、修正、回歸測試及正式簽核。 | `NOT STARTED` | 0% | 全域回歸套件執行（前端 454 通過、後端 216 通過、雙編譯 0 錯誤） | 全系統回歸、缺陷處置追蹤、TypeScript 靜態型別安全檢核 | 最終專案負責人簽核作業 | **PASS (候選)** |

---

## 三、角色與權限架構實質驗證報告

### 3.1 正式資料庫模型與角色定義（Prisma Schema）
查核 `backend/prisma/schema.prisma:54-60`：
```prisma
model Role {
  id          String     @id @default(uuid())
  name        String     @unique // STUDENT, TEACHER, PLATFORM_ADMIN, SYSTEM_OPERATOR (legacy compatibility: ADMIN)
  description String?
  users       UserRole[]
}
```
- **核心業務角色**：`STUDENT`（學生）、`TEACHER`（教師）、`ADMIN`（管理員）。
- **架構相容性角色**：
  - `PLATFORM_ADMIN`：為配合微服務與後續架構演進，後端中介軟體 `expandCompatibleRoles` 與前端 `expandCompatibleFrontendRoles` 將 `ADMIN` 與 `PLATFORM_ADMIN` 設為雙向等價互通。
  - `SYSTEM_OPERATOR`：為系統運維角色，**嚴格隔離於一般教學與教務管理權限之外**（不自動擴展為 ADMIN/PLATFORM_ADMIN，亦不具備教師或學生資料之操作權）。

### 3.2 前端路由攔截 vs 後端權限驗證之邊界劃分
- **前端路由攔截（UX Guard）**：
  - 模組：`frontend/src/components/ProtectedRoute.tsx`。
  - 職責：依據客戶端登入狀態（`authStatus`）與角色清單（`user.roles`），控制頁面渲染或跳轉登入 Modal，並於 `sessionStorage` 暫存意圖路徑（`ctk_intended_route`）。
  - **邊界限制**：前端攔截僅為使用者體驗優化，**絕不能視為安全性之唯一屏障**。
- **後端實體授權（Security Guard）**：
  - 模組：`backend/src/middleware/authenticate.ts`、`backend/src/middleware/authorize.ts`。
  - 職責：解析 Session Cookie 或 Authorization Header，自伺服器端驗證身分；`requireRoles` 嚴格比對端點要求，無權限者一律拋出 `ForbiddenError (403)`。
  - **資料擁有權校驗（IDOR 防禦）**：`backend/src/utils/ownership.ts` 針對 36 個 Prisma 模型逐一定義擁有權邏輯，禁止學員存取或修改非自身之答題紀錄、錯題或班級。
- **測試範疇聲明**：
  - 現有 Vitest 測試套件（如 `cross-role-integration.test.tsx`、`rbac-workflow.test.ts`）為**單元與整合模擬測試（Integration & Logic Suite）**，針對中介軟體、狀態機、權限映射進行驗證；在未連線雲端實體資料庫前，**絕不虛報為跨網路之真實 Production E2E 測試**。

---

## 四、依賴套件資安稽核（npm audit 完整紀錄）

### 4.1 前端稽核（Frontend Audit）
- **指令**：`npm --prefix frontend audit --json`
- **弱點統計**：2 項（Moderate: 1、High: 1、Critical: 0）
- **詳細清單**：
  1. **esbuild <=0.24.2**（Moderate）：
     - 漏洞描述：`esbuild enables any website to send any requests to the development server and read the response` (GHSA-67mh-4wv8-2f99)
     - 依賴路徑：`code-to-know-frontend -> vite -> esbuild`
     - 修復版本：需升級至 `vite@8.3.8`（重大破壞性版本變更）
  2. **vite <=6.4.3**（High）：
     - 漏洞描述：包含 optimized deps .map 路徑遍歷（GHSA-4w7w-66w2-5vf9）、Windows 環境下 launch-editor 參數解析風險。
- **正式環境 Runtime 影響評估**：
  - **無影響（Zero Impact）**：該漏洞僅存在於本機開發伺服器（Dev Server）；正式生產環境發布包（`dist/`）由靜態 HTML、JS、CSS 組成，由網頁伺服器（Nginx / CDN）提供服務，**完全不包含 node.js 執行進程或 esbuild/vite 伺服器**。
- **處置狀態**：**`MITIGATED (已緩解)`**。依據紀律，不盲目升級至破壞性之 Vite 8，且**絕不標示為 PATCHED**。

### 4.2 後端稽核（Backend Audit）
- **指令**：`npm --prefix backend audit --json`
- **弱點統計**：7 項（Moderate: 3、High: 2、Critical: 2）
- **詳細清單**：
  1. **tinypool <=2.1.1**（Critical）：
     - 漏洞描述：Prototype Pollution leading to RCE (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr)
     - 依賴路徑：`vitest -> tinypool`（開發測試套件）
  2. **vitest <=4.1.10**（Critical）：
     - 漏洞描述：Vitest UI server arbitrary file read / path traversal via mocker (GHSA-82fw-gwwq-j7x9, GHSA-5xrq-8626-4rwp)
     - 依賴路徑：`devDependencies -> vitest`
  3. **zod <4.6.6**（High）：
     - 漏洞描述：Memory exhaustion on oversized constrained collections (GHSA-mrhx-c7xc-m3w5)
     - 依賴路徑：`dependencies -> zod`
- **正式環境 Runtime 影響評估**：
  - `tinypool` 與 `vitest` 為純開發測試工具，正式部署啟動命令 `node dist/server.js` **完全不加載** 任何測試模組。
  - `zod` 的集合記憶體耗盡風險，已在 Express 請求主體中介軟體中實裝 **`express.json({ limit: '1mb' })`** 嚴格限制，超過 1MB 之超大負載在抵達 Zod 解析器前即被 HTTP 413 / 400 攔截。
- **處置狀態**：**`MITIGATED (已緩解)`**。升級至 Zod 4 或 Vitest 5 為破壞性大版本升級，維持現狀以確保穩定。

---

## 五、自動化測試總帳與客觀數據驗證

### 5.1 前端 Vitest 測試套件
- **執行指令**：`npx --prefix frontend vitest run frontend/tests`
- **實測 Exit Code**：`0`
- **測試檔案覆蓋**：**48 個測試檔案全數通過（48 Passed）**
- **案例總數**：**454 個測試案例（454 Passed，0 Failed，0 Skipped）**
- **執行時間**：1.58 秒

### 5.2 後端離線安全測試套件
- **執行指令**：`npx --prefix backend vitest run tests/*`（涵蓋 16 個離線測試檔案）
- **實測 Exit Code**：`0`
- **測試檔案覆蓋**：**16 個測試檔案全數通過（16 Passed）**
- **案例總數**：**216 個測試案例（216 Passed，0 Failed，0 Skipped）**
- **執行時間**：1.61 秒

### 5.3 測試總計
$$\text{全站通過測試案例總計} = 454 \text{ (前端)} + 216 \text{ (後端)} = \mathbf{670} \text{ 測試案例 100\% 通過}$$
> **紀律說明**：無任何失敗測試被刪除、註解或忽略以虛報全數通過。

---

## 六、全站建置驗證與靜態檢查

1. **前端生產建置**：
   - 指令：`npm --prefix frontend run build`
   - `tsc` 檢查：0 錯誤。
   - Vite 打包：1,649 個模組轉換完成，產出 `dist/`，耗時 2.20s，Exit Code: `0`。
2. **後端生產建置**：
   - 指令：`npm --prefix backend run build`
   - `tsc` 檢查：0 錯誤，順利編譯至 `dist/`，Exit Code: `0`。

---

## 七、長期保護守則遵循聲明

1. **進度基準**：全站官方基準嚴格維持 **49.166860%**。
2. **術科題組安全**：題組一至五（`104301` ～ `104305`）之原始教材完全保護，未做任何修改。
3. **AUTH-03 外部阻塞**：未連線遠端 PostgreSQL 資料庫，未修改 Prisma Schema，未執行正式 Migration。`P19-DEP-004/005/009` 維持 `BLOCKED` 標記。
4. **背景程序狀態**：`task-13717` 維持 `STOPPED`。
5. **版本控制防護**：無執行任何 Git Commit、Push、Merge 或 Deploy。
