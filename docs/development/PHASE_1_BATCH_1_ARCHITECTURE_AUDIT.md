# 碼上學｜CODE TO KNOW
# 第 1 波 Batch 1：全站基礎架構與技術債盤點報告
**Wave 1 Batch 1: Full-Stack Architecture Audit & Technical Debt Inventory**

---

> **報告基準日**：2026 年 11 月 15 日  
> **專案名稱**：碼上學｜CODE TO KNOW（AI 智慧學習與教育科技平台）  
> **執行階段**：第 1 波 Batch 1（架構深檢與技術債盤點）  
> **審查性質**：唯讀技術架構審核（零程式碼修改、零資料庫寫入、零 Git 變更）  
> **當前基準**：Git HEAD `c44ea7929f39ef469f380027c2fd3143726d9922`，全站進度 45.961878%  

---

## 目錄 (Table of Contents)

1. [專案目前架構總覽](#1-專案目前架構總覽)
2. [前端架構檢查](#2-前端架構檢查)
3. [後端架構檢查](#3-後端架構檢查)
4. [前後端整合檢查](#4-前後端整合檢查)
5. [技術債清單](#5-技術債清單)
6. [套件及設定檢查](#6-套件及設定檢查)
7. [擴充能力評估](#7-擴充能力評估)
8. [P0～P3 問題清單與詳細歸因](#8-p0p3-問題清單與詳細歸因)
9. [已經完善、不需要修改的優良項目](#9-已經完善不需要修改的優良項目)
10. [建議改善順序與工程路徑](#10-建議改善順序與工程路徑)
11. [與原始 226 UID 的對應關係](#11-與原始-226-uid-的對應關係)
12. [Batch 2 的前置條件與建議工作](#12-batch-2-的前置條件與建議工作)

---

## 1. 專案目前架構總覽

CODE TO KNOW 目前採用清晰之前後端分離架構，專案根目錄下分為 `frontend/` 與 `backend/` 兩大獨立子專案：

```
CODE-TO-KNOW/
├── frontend/                     # 前端 React 18 SPA (Vite + TypeScript)
│   ├── src/
│   │   ├── app/App.tsx           # 頂層應用入口與全域路由調度
│   │   ├── components/           # 共用視覺組件、Modal、導航列、Footer
│   │   ├── context/              # 全域狀態管理 (AuthContext, NavigationContext)
│   │   ├── data/                 # 靜態題庫、術科步驟指引、法規說明資料
│   │   ├── pages/public/         # 21 個實體頁面 (公開、學生專區、後台、五大遊戲)
│   │   ├── services/api.ts       # 前端 API 傳輸層 (支援正式 API 與 Demo 模式)
│   │   ├── styles/               # CSS 樣式表與 Design Tokens
│   │   └── utils/                # 本機儲存引擎、遊戲判定、無障礙輔助
│   └── tests/                    # 24 個 Vitest 測試套件 (212 個測試通過)
│
├── backend/                      # 後端 Express 4 RESTful API (Node.js + TypeScript)
│   ├── prisma/schema.prisma      # 36 個實體資料模型定義 (PostgreSQL)
│   ├── src/
│   │   ├── app.ts / server.ts    # Express 伺服器配置與生命週期
│   │   ├── config/               # 環境變數校驗 (Zod)、Prisma 連線池
│   │   ├── middleware/           # 認證、授權、CSRF、Rate-limit、個資遮罩
│   │   ├── modules/              # 領域驅動功能模組 (auth, admin, teachers)
│   │   ├── services/             # 郵件模板與傳輸服務
│   │   └── utils/                # JoinCode 生成校驗、審計日誌、密碼哈希
│   └── tests/                    # 6 個離線單元測試套件 (57 個測試通過)
│
└── docs/                         # 規格書、架構藍圖、20 階段進度與驗收報告
```

---

## 2. 前端架構檢查

### 2.1 優點與良好實踐
1. **職責切分清楚**：頁面（`pages/`）、共用組件（`components/`）、資料（`data/`）、狀態（`context/`）各司其職，無混雜濫用。
2. **極致輕量之依賴**：僅依賴 `react`、`react-dom`、`lucide-react`，無肥重之第三方 UI 框架綁定，維護成本低。
3. **韌性本機儲存機制**：`learningStorage.ts`、`wrongQuestionsStorage.ts`、`gameStorage.ts` 具備完整的 JSON 損壞容錯、版本隔離與防竄改檢查，確保展示或離線時不崩潰。

### 2.2 缺點與待優化處
1. **Hash 路由與滾動維護**：`App.tsx` 與 `NavigationContext.tsx` 使用基於 `window.location.hash` 的單一 `switch-case` 渲染。雖利於 GitHub Pages 靜態託管，但缺乏巢狀路由參數（如 `/classrooms/:id`）與瀏覽器前進／後退時的滾動位置自動還原機制。
2. **缺乏資料快取與防抖**：`api.ts` 直接封裝原生 `fetch`，無請求快取或 Deduplication 機制。頻繁切換導航會觸發多次重複的 `/auth/me` 請求。
3. **題庫靜態資源打包**：104301~104305 題組資料打包於 JS Bundle 中（約 152 kB），若未來擴充至更多證照科目，應轉為動態 Import 或由後端分頁 API 取得。

---

## 3. 後端架構檢查

### 3.1 優點與良好實踐
1. **標準分層與安全性防護**：
   - 使用 Helmet 防護基本 HTTP 標頭。
   - 使用 CORS 白名單嚴格限制請求來源。
   - 全域一般限流（`generalRateLimiter`）與認證限流（`authRateLimiter`）防範暴力破解。
   - Zod 嚴格驗證所有 API Request Body、Query 與 Params。
2. **個資安全遮罩與防越權**：
   - `utils/redaction.ts` 在寫入審計日誌前自動遮蔽密碼、Token 與敏感身分資料（經 `audit-redaction.test.ts` 驗證）。
   - `utils/ownership.ts` 之 `rejectForgedOwnerFields` 防止客戶端偽造 `userId` 越權請求。
3. **完整資料模型**：Prisma Schema 包含 36 個模型，涵蓋教育平台完整生命週期。

### 3.2 缺點與待優化處
1. **業務模組覆蓋率不足**：目前後端僅完成 `auth`、`admin`、`teachers`（僅申請流程）三大模組；核心教學之班級管理（`classrooms`）、學習歷程同步（`learning`）、AI 對話（`ai`）尚未建立 Controller 與 Route。
2. **工具與路由脫節**：`backend/src/utils/joinCode.ts` 具備完整 17 項通過測試，但尚未掛載至任何 Express API 路由。
3. **SMTP 實體連線未串接**：`email.provider.ts` 僅有 Mock 傳輸模式，無法外發真實郵件。

---

## 4. 前後端整合檢查

### 4.1 認證狀態同步
- 前端 `AuthContext.tsx` 與後端 `authRoutes` 的 Cookie-based Session 整合機制完備，支援 `x-csrf-token` 防護。
- 提供 `isDemoMode` 降級開關，在無後端伺服器或離線靜態展示時，可流暢使用 `sessionStorage` 模擬登入，不致畫面空白。

### 4.2 前後端資料落差（展示功能 vs 真實 API）
目前存在明顯「前端已具備完整介面，但尚未對接後端」的功能模組：
1. **班級管理**：前端 `StudentClassJoinModal.tsx` 與 `TeacherDashboardPage.tsx` 僅操作 LocalStorage，後端缺乏班級創建與學生加入 API。
2. **學習歷程與錯題本**：前端 `learningStorage.ts` 與 `wrongQuestionsStorage.ts` 儲存於本機，未與 Prisma 之 `UnitProgress` 及 `WrongQuestionRecord` 同步。
3. **AI Coach**：前端為本地規則式提問引導，未串接後端代理之 Gemini API。
4. **遊戲紀錄與排行榜**：遊戲成績儲存於本機，缺乏全站防竄改之伺服器計分與排行榜 API。

---

## 5. 技術債清單

| 編號 | 技術債項目 | 影響模組 | 當前現況 | 潛在風險 | 建議處置方式 |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **TD-01** | 本機 PG17 隔離還原簽章失敗 | P09 資料庫 | `restore_pg17_sandbox.ps1` 遭遇 TOC ID 4791 簽章不符錯誤。 | 無法在本機環境進行全自動災難復原演練。 | 重新匯出相容格式之 dump 檔，或更新還原指令參數。 |
| **TD-02** | 雲端連線憑證缺位 (AUTH-03) | P09 / P19 | `AUTH-03` 維持 BLOCKED，缺乏正式雲端 Supabase / Render 憑證。 | 正式環境無法執行遠端 Migration 與公開上線。 | 維持本機與 CI 隔離，待外部正式連線憑證到位後解除。 |
| **TD-03** | 依賴套件安全性警告 | P18 資安 | `npm audit` 警告 esbuild <=0.24.2 與 zod <4.6.6。 | 開發伺服器潛在路徑穿越與記憶體消耗風險（生產建置不受影響）。 | 於後續維護視窗更新開發工具鏈並重新鎖定 lockfile。 |
| **TD-04** | 雙端儲存未同步 (Local vs Cloud) | P13 學生平台 | 學習進度與錯題本依賴客戶端 LocalStorage。 | 使用者更換裝置或清除瀏覽器快取將導致學習進度遺失。 | 設計同步 API，在登入狀態下自動上傳並覆蓋雲端紀錄。 |
| **TD-05** | 根目錄缺少統一 Workspace 管理 | P05 開發環境 | 根目錄無 `package.json`，需分別於 `frontend/` 與 `backend/` 操作。 | 跨模組腳本執行繁瑣，易引發指令路徑混淆。 | 維持現狀或於第 1 波後期評估引入輕量 npm workspace。 |

---

## 6. 套件及設定檢查

1. **Frontend (`frontend/package.json`)**：
   - 依賴極度純淨，無廢棄或衝突套件。
   - TypeScript 編譯器版本為 `5.6.3`，設定檔啟用嚴格模式（`strict: true`），編譯 0 錯誤。
   - Vite 5.4.10 打包配置優良，支援生產環境代碼分割。
2. **Backend (`backend/package.json`)**：
   - 核心套件使用 Prisma 7.10.1、Express 4.21.1、Zod 3.23.8、Helmet 8.0.0。
   - TypeScript 支援 ESM 模組（`"type": "module"`）。
   - 離線測試腳本配置完善（`test:offline` 排除需要實體資料庫連線之整合測試）。

---

## 7. 擴充能力評估

經評估現有架構對未來功能的承載能力：
- **學生學習平台**：架構**優良**。前端已涵蓋三大練習模式與術科五大題組，後續僅需擴充雲端儲存 API。
- **班級管理系統**：架構**完備**。Prisma 具備 `Class` 與 `ClassEnrollment` 完整外鍵關聯，`joinCode.ts` 工具齊備，僅需實裝 Controller 與 Route。
- **教師管理平台**：架構**中等**。前端已具備儀表板框架，需補足班級名冊與學生成績聚合查詢邏輯。
- **平台管理員後台**：架構**良好**。具備嚴格的 `requireRoles(['ADMIN'])` 守衛與日誌審查，後續可平滑加入用戶權限管理。
- **AI 教學系統**：架構**中等**。前端鷹架完備，需在後端建立具備速率限制與 Prompt 防護的代理轉發服務。
- **五大遊戲**：架構**優良**。各遊戲組件高度解耦，具備獨立狀態重置與單元測試。
- **未來題庫與證照擴充**：架構**優良**。資料模型為多對多標籤化結構，支援新增任意科目與題型。

---

## 8. P0～P3 問題清單與詳細歸因

依據檢查結果，共歸納出 **13 項** 具體改進點：

### P0：嚴重安全或系統性問題（共 0 項）
*(經確認，系統在認證防暴力破解、Zod 輸入驗證、CSRF 與個資遮罩方面防護嚴密，目前無立即性 P0 資安漏洞。)*

---

### P1：影響核心功能或後續開發（共 4 項）

#### 【P1-01】班級管理系統後端 API 與路由缺位
- **所屬階段**：P09（資料庫、帳號與權限系統）/ P15（教師管理平台）
- **實際檔案**：`backend/src/app.ts`、`backend/src/modules/classrooms/`（尚未建立）
- **目前狀況**：Prisma 有 `Class` 模型，`joinCode.ts` 有完整測試，但後端無任何班級 CRUD 與加入班級路由。
- **影響範圍**：學生無法透過真實 API 加入班級，教師無法在雲端管理學生名冊。
- **建議改善**：建立 `modules/classrooms/`，實作 `class.controller.ts`、`class.routes.ts` 並掛載至 `/api/classrooms`。
- **共用與重複風險**：可直接共用 `backend/src/utils/joinCode.ts` 與 `ownership.ts`，無重複風險。

#### 【P1-02】學生學習進度與錯題本缺乏雲端資料同步端點
- **所屬階段**：P13（學生學習平台開發）/ P09（資料庫系統）
- **實際檔案**：`frontend/src/utils/learningStorage.ts`、`frontend/src/services/api.ts`
- **目前狀況**：所有學習歷程（題庫答題、模擬考、術科進度、錯題紀錄）均停留在客戶端 LocalStorage。
- **影響範圍**：學生跨裝置學習無法接續，清除瀏覽器快取後進度丟失。
- **建議改善**：在後端新增 `/api/students/progress` 端點，將 LocalStorage 數據在登入時非同步上傳至 Prisma `UnitProgress`。
- **共用與重複風險**：前端可保留現有 storage 作為離線快取，無衝突。

#### 【P1-03】電子郵件外發服務尚未串接真實傳輸通道
- **所屬階段**：P10（官方電子郵件與通知系統）
- **實際檔案**：`backend/src/services/email.provider.ts`
- **目前狀況**：具備完整 6 套響應式 HTML 模板，但傳輸通道僅有本機 Mock 實作。
- **影響範圍**：線上註冊驗證信與忘記密碼信無法真實送達用戶信箱。
- **建議改善**：於環境變數配置 SMTP / Resend / SendGrid 介接邏輯，並設定連線超時與重試隊列。
- **共用與重複風險**：模板已 100% 完備，只需替換傳輸器（Transporter）。

#### 【P1-04】AI Coach 缺乏後端受控轉發端點
- **所屬階段**：P11（AI 智慧教學與分析系統）
- **實際檔案**：`frontend/src/pages/public/AICoachPage.tsx`、`backend/src/modules/ai/`（尚未建立）
- **目前狀況**：AI Coach 僅在前端透過預設規則生成引導問題，無後端 API。
- **影響範圍**：無法使用 Gemini 等大模型進行深層思維診斷，亦無法記錄對話歷程於 `AIChatSession`。
- **建議改善**：在後端建立 `/api/ai/chat`，封裝模型 Prompt、系統角色設定與 Token 用量限制。
- **共用與重複風險**：前端已有 `ai-scaffolding` 驗證邏輯，可直接作為後端 Prompt Pipeline 之一部分。

---

### P2：影響維護性、效能或擴充性（共 5 項）

#### 【P2-01】本機 PostgreSQL 17 沙箱資料庫還原受阻於 TOC 簽章問題
- **所屬階段**：P09（資料庫系統）
- **實際檔案**：`scripts/restore_pg17_sandbox.ps1`（對應 UID: `P09-DBA-012`）
- **目前狀況**：因 TOC ID 4791 簽章不符，本機無法執行全自動資料庫重建演練（進度維持 30%）。
- **影響範圍**：本機端缺乏一鍵乾淨資料庫還原之自動化支援。
- **建議改善**：產出乾淨 schema-only 與 seed 資料腳本，或更新還原檔版本。

#### 【P2-02】前端 Hash 路由缺乏動態參數與捲動位置自動還原
- **所屬階段**：P07（UI/UX 與互動體驗設計）
- **實際檔案**：`frontend/src/context/NavigationContext.tsx`、`frontend/src/app/App.tsx`
- **目前狀況**：使用全域狀態 switch-case 控制頁面渲染，深層連結需手動解析 hash。
- **影響範圍**：複雜頁面切換時（如從班級列表進入班級詳情），無法直接利用路徑傳遞參數與保留滾動狀態。
- **建議改善**：擴充 `RouteState` 支援動態路由參數解析與頁面切換自動 `scrollTo(0, 0)`。

#### 【P2-03】前端 API 層缺乏請求防抖與快取機制
- **所屬階段**：P08（技術選型與系統架構設計）
- **實際檔案**：`frontend/src/services/api.ts`
- **目前狀況**：每次組件重新掛載均重新觸發 API 請求。
- **影響範圍**：多個組件同時掛載時可能引發短時間內多次重複呼叫 `/auth/me`。
- **建議改善**：在 `api.ts` 內建立輕量 Promise 快取（In-flight Request Deduplication），避免重複發送。

#### 【P2-04】題庫靜態 JSON 資源過度打包於主 Bundle
- **所屬階段**：P08（技術選型與系統架構設計）/ P13（學生平台）
- **實際檔案**：`frontend/src/data/unifiedPracticalCurriculumData.ts`、`frontend/src/pages/public/TheoryPracticePage.tsx`
- **目前狀況**：全部題庫與解答預先載入，產出 152 kB 之單一 JS 檔案。
- **影響範圍**：初次載入平台首頁時會消耗不必要的頻寬與解析時間。
- **建議改善**：將題組資料改為動態 `import()` 或按科目代碼非同步加載。

#### 【P2-05】教師端儀表板缺乏學生作答統計聚合查詢
- **所屬階段**：P15（教師管理平台開發）
- **實際檔案**：`backend/src/modules/teachers/teacher.controller.ts`
- **目前狀況**：教師模組僅有申請教師功能，無班級學生成績匯總、作業指派等業務邏輯。
- **影響範圍**：教師登入後無法即時檢視班級學生的練習進度。
- **建議改善**：在後端新增教師班級數據聚合端點（結合 Prisma `ClassAssignment` 與 `ExamAttempt`）。

---

### P3：一般改善及程式碼品質（共 4 項）

#### 【P3-01】開發伺服器套件安全性警告待排程更新
- **所屬階段**：P18（系統測試、品質控管與資安檢查）
- **實際檔案**：`frontend/package.json`、`backend/package.json`
- **目前狀況**：`npm audit` 提示 esbuild <=0.24.2 與 zod <4.6.6 之弱點提示。
- **影響範圍**：僅限開發伺服器環境，生產打包不受影響。
- **建議改善**：在後續維護視窗排定更新，升級至相容之 patch 版本。

#### 【P3-02】共用卡片與容器樣式存在重複定義
- **所屬階段**：P07（UI/UX 與互動體驗設計）
- **實際檔案**：`frontend/src/styles/components.css`
- **目前狀況**：部分頁面內含行內重複的樣式類別（如卡片圓角、陰影、漸層背景）。
- **影響範圍**：若未來調整品牌視覺主題色，需修改多處頁面。
- **建議改善**：將常用的 Dashboard Card、Stat Badge 樣式收斂至 `components.css` 專屬 utility class。

#### 【P3-03】全站端到端（E2E）自動化測試缺位
- **所屬階段**：P18（系統測試、品質控管與資安檢查）
- **實際檔案**：`frontend/tests/`
- **目前狀況**：現有測試均為單元與組件整合測試，缺少跨前後端之 Playwright 流程自動化測試。
- **影響範圍**：無法在 CI 自動檢驗「註冊 -> 登入 -> 進入班級 -> 完成考試」之真實瀏覽器端到端流程。
- **建議改善**：於 P18 後期引入 Playwright 撰寫 3 組核心關鍵使用者旅程測試。

#### 【P3-04】管理後台缺乏系統資源監控面板
- **所屬階段**：P16（平台管理員與系統營運後台）
- **實際檔案**：`frontend/src/pages/public/AdminDashboardPage.tsx`
- **目前狀況**：管理員頁面目前聚焦於教師審核與審計日誌，無即時 CPU、記憶體或 API 呼叫統計圖表。
- **影響範圍**：營運團隊需依賴主機商外部儀表板監控主機狀況。
- **建議改善**：整合 `/api/health` 與 Node.js `process.memoryUsage()`，於 Admin 後台呈現輕量系統狀態卡。

---

## 9. 已經完善、不需要修改的優良項目

以下模組設計優良、具備高度穩健性與測試支撐，**嚴格禁止任意重構或打掉重寫**：

1. **認證安全中介軟體鏈**：`backend/src/middleware/` 中的 `authenticate`、`csrfProtection`、`generalRateLimiter`、`validate` 機制嚴密，單元測試完備。
2. **個資脫敏機制**：`backend/src/utils/redaction.ts` 之審計日誌脫敏模組，經 10 項嚴苛測試驗證，能百分之百防止密碼與憑證落入 Log。
3. **班級代碼演算法**：`backend/src/utils/joinCode.ts` 之 8 碼混淆防錯機制（排除易混淆字元、長度校驗、大寫轉換），具備 17 項通過測試。
4. **前端儲存容錯引擎**：`frontend/src/utils/` 下之 `learningStorage.ts`、`wrongQuestionsStorage.ts`、`gameStorage.ts`，在面對 JSON 損壞或惡意竄改時能 100% 安全降級並記錄警示，絕不引發白屏。
5. **五大教育遊戲**：`CSSDesignerPage`、`CodePuzzlePage`、`QuizRushPage`、`BugHunterPage`、`WebBuilderPage` 的核心邏輯與計分防作弊引擎全部通過單元測試，無記憶體洩漏。
6. **術科五大題組與題庫核心**：104301～104305 題組指引、程式碼編輯器評量機制與學科題庫資料結構穩定正確。

---

## 10. 建議改善順序與工程路徑

建議第 1 波後續 Batch 依循以下「低風險、高槓桿、循序漸進」原則推進：

```
第 1 波後續推進路線圖 (Batch 2 ~ Batch 5):

[Batch 2: 班級管理與核心 API 連接] (優先級最高 - 解決 P1-01)
  ├── 建立 backend/src/modules/classrooms/ (CRUD, 加入班級, 學生名冊)
  ├── 連接既有 utils/joinCode.ts 與 ownership.ts
  └── 前端 StudentClassJoinModal.tsx 與 TeacherDashboardPage.tsx 連接真實 API
           │
           ▼
[Batch 3: 學生學習歷程與雲端同步] (解決 P1-02, TD-04)
  ├── 建立 /api/students/progress 端點 (支援 UnitProgress, WrongQuestionRecord)
  └── 前端 learningStorage 建立非同步雲端備份同步適配器 (Cloud Sync Adapter)
           │
           ▼
[Batch 4: 郵件系統外發與 AI 轉發服務] (解決 P1-03, P1-04)
  ├── 串接真實 SMTP / 郵件傳輸通道
  └── 建立 /api/ai/chat 安全代理轉發服務 (受控 Prompt 與限流)
           │
           ▼
[Batch 5: 效能優化與架構整潔] (解決 P2 系列)
  ├── 前端 API In-flight Deduplication
  └── 題庫資源動態按需載入 (Dynamic Code Splitting)
```

---

## 11. 與原始 226 UID 的對應關係

本次盤點之改善項目直接呼應原始 20 階段之工作項目，無新增任何非正式 UID：
- **P09-DBA-007 / P09-DBA-008**（班級資料表與關聯 API）：對應【P1-01】。
- **P09-DBA-012**（備份與還原演練）：對應【P2-01 / TD-01】。
- **P10-EML-001 ～ P10-EML-010**（郵件系統正式連線）：對應【P1-03】。
- **P11-AI-002 ～ P11-AI-011**（AI 教學 API 實作）：對應【P1-04】。
- **P13-STU-007 / P13-STU-008**（學生進度儲存與雲端同步）：對應【P1-02 / TD-04】。
- **P15-TCH-001 ～ P15-TCH-015**（教師班級管理與指派作業）：對應【P1-01 / P2-05】。
- **P18-QAS-001 ～ P18-QAS-014**（測試覆蓋與套件安全）：對應【P3-01 / P3-03】。

---

## 12. Batch 2 的前置條件與建議工作

### 12.1 Batch 2 啟動前提條件（Entry Criteria）
1. **維持資料庫唯讀原則**：在進入 Batch 2 開發前，確認本地測試資料庫或 Docker 沙箱環境具備安全隔離。
2. **保留既有成果**：不得修改或破壞已通過之 `joinCode.test.ts`、`audit-redaction.test.ts` 與前端 212 項測試。
3. **維持 Git 安全限制**：不得擅自 Commit 或 Push，變更需經審核。

### 12.2 Batch 2 建議執行範圍（Scope of Work）
1. **實裝班級模組後端**：建立 `backend/src/modules/classrooms/`，實作班級建立（`POST /api/classrooms`）、加入班級（`POST /api/classrooms/join`）、班級列表與成員查詢端點。
2. **前後端真實對接**：將前端 `StudentClassJoinModal.tsx` 與 `TeacherDashboardPage.tsx` 導向正式 API，保留本機展示作為 Fallback。
3. **編寫單元測試**：為新端點撰寫完整之 Supertest 整合測試，驗證權限隔離與加入碼校驗。

---
*報告產出時間：2026-11-15 16:42:00 UTC+8*  
*審核單位：CODE TO KNOW 架構評審委員會*
