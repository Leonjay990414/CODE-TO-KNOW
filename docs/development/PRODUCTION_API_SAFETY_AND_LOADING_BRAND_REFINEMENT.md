# CODE TO KNOW (碼上學)｜正式網站 API 安全設定與 Loading 品牌一致性修正報告

**文件代號：** `PRODUCTION_API_SAFETY_AND_LOADING_BRAND_REFINEMENT.md`  
**建立日期：** 2026 年 11 月 16 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**執行分支：** `develop`  
**最新 HEAD Commit：** `6d93d703efddb781231dd4445db41b139234ac7d`  
**任務性質：** 正式網站 API 安全防護加固與動態載入（Loading）畫面 WCAG 對比度品牌修訂  
**正式進度基準狀態：** **49.166860%（全站凍結保護中，不因本修復更動進度數值）**  
**226 UID 核定狀態：** **PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4**  

---

## 一、API 設定改善說明（三種環境行為差異）

為避免前端靜態網站部署於雲端平台（如 Render Static Site 或 GitHub Pages Preview）且尚未配置正式後端 API 時，前端客戶端默默退回（fallback）至 `http://localhost:4000/api` 導致訪客瀏覽器嘗試連線使用者個人電腦本機連接埠之重大資安疑慮，本次在 [frontend/src/services/api.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts) 中重構了環境配置判斷引擎 `resolveApiConfiguration()`，明確定義並隔離以下三種環境行為：

| 環境模式 | 判定條件 | `API_BASE_URL` 解析結果 | 網路請求行為與安全防護 |
| :--- | :--- | :--- | :--- |
| **1. 靜態展示模式 (Demo Mode)** | `VITE_DEMO_MODE === 'true'` | `''` (空字串) | **純前端靜態模擬**：所有登入、註冊、登出、身分檢查及班級操作均於瀏覽器 `sessionStorage` 內模擬完成，`request()` 核心直接攔截並回傳 `DEMO_MODE_NOTICE`，絕不對外發送任何 HTTP 網路請求。 |
| **2. 本機開發模式 (Development Mode)** | `!isDemoMode && !import.meta.env.PROD` | 優先使用 `VITE_API_URL`；若未配置則安全退回 `http://localhost:4000/api` | **全端本機除錯支援**：工程師本機啟動 Vite 開發伺服器時，可直接與本機 4000 連接埠之后端 API 協同開發，維持開發敏捷度。 |
| **3. 雲端正式模式 (Production Mode)** | `!isDemoMode && import.meta.env.PROD` | 若有配置 `VITE_API_URL` 則採用該合法端點；**若未配置則為 `''` (嚴格禁止 fallback)** | **主動防護攔截機制**：若未注入正式 API 網址，系統標記 `isProductionApiMissing = true`，所有對外請求在前端發起前即被安全攔截，並提供明確診斷訊息。 |

---

## 二、正式環境缺少 API 設定時的防護與錯誤提示機制

### 1. 攔截點與錯誤結構
在正式環境（Production）構建中，若維運人員或雲端站台忘記設定 `VITE_API_URL` 且未啟用 `VITE_DEMO_MODE`，系統將在以下三個重要層級進行主動防護：

1. **核心請求層 (`request()`)**：
   ```ts
   if (isProductionApiMissing) {
     return {
       success: false,
       error: {
         code: 'PRODUCTION_API_NOT_CONFIGURED',
         message: '正式環境尚未設定後端 API 伺服器位址 (VITE_API_URL)。若為預覽站台，請開啟展示模式 (VITE_DEMO_MODE=true) 或聯絡系統管理員配置 API 端點。',
       },
     };
   }
   ```
2. **CSRF Token 防護層 (`getCsrfToken()`)**：
   在 `isProductionApiMissing || !API_BASE_URL` 成立時，不發起任何對外連線，直接回傳空字串，防止不必要的預檢網路請求失敗。
3. **系統健康度檢查 (`adminApi.getHealth()`)**：
   直接回傳標準化 `{ success: false, error: { code: 'PRODUCTION_API_NOT_CONFIGURED', ... } }`，避免觸發瀏覽器 Console 爆出紅色 Network Exception。

### 2. 使用者端錯誤呈現
- 訪客於 [frontend/src/components/AuthModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AuthModal.tsx) 嘗試點擊登入或註冊時，畫面將直接呈現易懂的提示訊息：
  > 「正式環境尚未設定後端 API 伺服器位址 (VITE_API_URL)。若為預覽站台，請開啟展示模式 (VITE_DEMO_MODE=true) 或聯絡系統管理員配置 API 端點。」
- 訪客可直接點擊「展示帳號一鍵登入」切換至展示模式體驗學習平台各項功能。

---

## 三、Loading 畫面色彩與對比度修正前後對比

針對前次診斷報告指出的「香檳金 (`#BDA77E`) 作為淺色背景上的小字或次標題時，WCAG AA 對比度不足」之問題，本次對 [frontend/src/app/App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx) 中的 `GameLoadingFallback` 進行了色彩與可讀性精確修正：

| UI 元素 | 修正前設定 | 修正後設定 | WCAG 對比度評估（對白色背景 #FFFFFF） | 改善效益 |
| :--- | :--- | :--- | :--- | :--- |
| **英文副標「CODE TO KNOW」** | `color: '#BDA77E'`<br>(10px, 600) | `color: '#526B7B'`<br>(10px, 600, letter-spacing: 2.5px) | 修正前：~2.33:1（**未達 WCAG AA 4.5:1**）<br>修正後：**~5.25:1（通過 WCAG AA）** | 消除模糊感，文字字體清晰，符合品牌深石板灰調性。 |
| **載入狀態提示「模組載入中...」** | `color: '#526B7B'`<br>(13px, 600) | `color: '#26343D'`<br>(13px, 600) | 修正前：~5.25:1（合規）<br>修正後：**~12.3:1（通過 WCAG AAA）** | 主視覺焦點強化，提示訊息清晰醒目。 |
| **品牌標語「碼上學，學無止境。」** | `color: '#8FA9B8'`<br>(11px) | `color: '#526B7B'`<br>(11px, 500, letter-spacing: 0.04em) | 修正前：~2.62:1（**未達 WCAG AA 4.5:1**）<br>修正後：**~5.25:1（通過 WCAG AA）** | 解決小字體在白底上對比過淺問題，提升行動端陽光下可讀性。 |
| **裝飾重點（轉環微光、中心脈動點）** | `#BDA77E` | **保留 `#BDA77E`** | 非純文字裝飾，保留品牌香檳金精緻流動質感。 | 保留原設計的高級感，嚴格恪守品牌設計規範。 |

### 保留之無障礙與響應式特性：
- `role="status"` 與 `aria-live="polite"`：螢幕報讀軟體能適時播報載入狀態。
- `aria-label="頁面與學習模組載入中"`：提供輔助技術專用識別。
- `@media (prefers-reduced-motion: reduce)`：遵守無障礙動態減速偏好，停用旋轉與微光位移。
- 320px～1920px 響應式佈局：在小於 380px 之極窄手機螢幕自動調整內距為 `24px 16px`。

---

## 四、測試執行結果與新增測試

本次共新增 1 份專用 API 安全測試套件，並擴充 Loading 畫面對比度單元測試：

### 1. 測試套件執行結果清單
1. **前端 Vitest 測試套件**：
   - 執行指令：`npx --prefix frontend vitest run frontend/tests`
   - 測試結果：**54 個測試檔案全部通過，491 項測試全數 PASS**（Exit Code 0）。
   - 新增/修訂亮點：
     - [frontend/tests/production-api-safety.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/production-api-safety.test.ts)：8 項測試，完整覆蓋 Demo 模式、本機開發模式、正式模式合法 URL 及正式模式缺少 API 網址之安全攔截（100% PASS）。
     - [frontend/tests/loading-screen.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/loading-screen.test.tsx)：5 項測試，包含新增之 WCAG AA 對比度檢驗（驗證 `#BDA77E` 僅用於裝飾，不作為純文字色彩）（100% PASS）。
2. **後端離線 Vitest 測試套件**：
   - 執行指令：`npm --prefix backend run test:offline`
   - 測試結果：**17 個測試檔案全部通過，221 項測試全數 PASS**（Exit Code 0）。
3. **全專案測試加總**：
   - **前端 491 項 + 後端離線 221 項 = 總計 712 項測試全數通過**（相較於先前 703 項，淨增加 9 項高品質安全防護測試）。
4. **前端 Vite 生產構建 (`npm --prefix frontend run build`)**：
   - TypeScript 型別檢查與 Vite 打包：**Exit Code 0**（產生 12 個模組區塊，包含 `vendor-react`, `theory-data` 等，無任何編譯錯誤）。
5. **後端 TypeScript 生產構建 (`npm --prefix backend run build`)**：
   - `tsc` 編譯：**Exit Code 0**（無任何型別錯誤）。

---

## 五、影響檔案清冊

本次作業嚴格遵從最小範圍變更原則，未建立多餘檔案，無多餘套件安裝：

| 檔案路徑 | 變更性質 | 變更說明 |
| :--- | :--- | :--- |
| [frontend/src/services/api.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts) | 核心邏輯改善 | 實作 `resolveApiConfiguration`，徹底隔離 Demo、開發與正式環境行為，杜絕正式環境默默 fallback 至 localhost:4000。 |
| [frontend/.env.example](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/.env.example) | 設定範本說明 | 新增詳細註解，列出本機開發、靜態預覽 Demo 與雲端正式部署三種情境之配置範例與資安注意事項。 |
| [frontend/src/app/App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx) | 視覺對比度優化 | 修訂 `GameLoadingFallback`，將文字調升至 `#26343D` 與 `#526B7B`，香檳金 `#BDA77E` 僅作為動態光環與點綴。 |
| [frontend/tests/loading-screen.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/loading-screen.test.tsx) | 測試更新 | 增加 WCAG AA 文字色彩驗證與裝飾色限定檢驗。 |
| [frontend/tests/production-api-safety.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/production-api-safety.test.ts) | 新增單元測試 | 8 項多環境安全防護測試，確保三種模式之行為與預期一致。 |

---

## 六、剩餘未解依賴與後續事項說明

1. **AUTH-03 外部資料庫安全界限維持**：
   - 遠端 Supabase / PostgreSQL 還原與遠端連線仍嚴格標記為 `BLOCKED`，未經專案負責人授權前，絕不發起任何遠端資料庫連線或執行遷移。
2. **外部 Render 後端服務部署**：
   - 目前本機 Node 後端尚未啟動（4000 連接埠由既有外部系統 LicenseMan 佔用），外部 Render 後端尚未由維運人員配置正式網址。
   - 本次改善已確保無論外部 Render 後端是否就緒，前端靜態網站部署後絕不會發生靜默向訪客本機 4000 發送連線之情形，具備最高規格之防禦韌性。
3. **task-13717 狀態**：
   - 外部背景常駐行程 `task-13717` 仍維持既有 `STOPPED` 終止狀態，不再重新喚醒。

---

## 七、正式進度維持 49.166860% 聲明

本文件明確聲明：
- 本次修正屬於**網站安全性強化（API 防護）與前端無障礙體驗優化（Loading 品牌與色彩對比）**之局部修補工作。
- 專案總體正式進度值**嚴格凍結維持在 49.166860%**。
- 正式 226 UID 統計結構維持 **PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4**。
- 五大術科正式題組核心資料保持百分之百凍結保護。
- 本工作未執行任何 `git commit`、`git push`、`git merge`、`git rebase` 或破壞性工作區清理操作。
