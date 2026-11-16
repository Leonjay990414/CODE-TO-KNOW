# 碼上學｜CODE TO KNOW
# 登入註冊功能故障診斷與既有動態載入畫面優化報告
**Authentication Diagnostic & Dynamic Loading Experience Optimization Report**

- **文件識別**：`AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md`
- **完成日期**：2026-11-16
- **執行工具**：Antigravity IDE
- **全站正式進度保護值**：**49.166860%**（絕對凍結保護）
- **226 UID 核准基準**：**PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4**
- **AUTH-03 邊界**：**BLOCKED**（嚴禁連線遠端 Supabase、嚴禁執行 Prisma Migration、嚴禁建立假測試帳號）
- **task-13717**：**STOPPED**

---

## 一、登入與註冊功能完整故障診斷

### 1.1 前端按鈕、事件與互動診斷（檢查結果：前端完全正常）

經逐行審查 [frontend/src/components/Navbar.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Navbar.tsx)、[frontend/src/pages/public/HomePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/HomePage.tsx)、[frontend/src/components/FinalCTA.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/FinalCTA.tsx)、[frontend/src/components/MembershipComparison.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/MembershipComparison.tsx) 以及 [frontend/src/components/AuthModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AuthModal.tsx)：

| 檢核項目 | 登入功能 (Login) | 註冊功能 (Register) | 客觀實測證據 |
|---|:---:|:---:|---|
| **按鈕點擊觸發** | **正常** | **正常** | 導航列「登入」與「免費開始學習」綁定 `handleOpenAuth('login' / 'register')` |
| **Modal 成功開啟** | **正常** | **正常** | [App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx) 頂層掛載 `<AuthModal isOpen={authModalOpen} mode={authModalMode} />` |
| **表單正常輸入** | **正常** | **正常** | 各受控輸入框（Email、Password、DisplayName）雙向綁定正常 |
| **必填欄位前端驗證** | **正常** | **正常** | Email 格式 (`@`)、密碼長度（$\ge 8$ 碼）、姓名長度（$\ge 2$ 碼）嚴格驗證 |
| **按下後觸發 Submit** | **正常** | **正常** | `form onSubmit={handleSubmit}` 正常攔截預設事件並執行防呆阻擋 |
| **Loading 狀態展示** | **正常** | **正常** | 送出時進入 `setLoading(true)`，按鈕展示 `<Loader2 className="animate-spin" />` 且停用重複點擊 |
| **錯誤提示 (Error Alert)** | **正常** | **正常** | 具備語意化 `role="alert"` 紅色警示條，顯示具體錯誤原因 |
| **按鈕無故 Disabled** | **無** | **無** | 按鈕僅在 `loading === true` 時安全停用，平常狀態可自由點擊 |
| **事件被攔截阻擋** | **無** | **無** | 對話框使用 `e.stopPropagation()` 防止事件冒泡至 Backdrop，關閉邏輯明確 |

---

### 1.2 API 連線與架構檢查

依據 [frontend/src/services/api.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts) 與後端路由 [backend/src/app.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts) 核查：

1. **API Base URL 來源**：
   - 程式碼定義：`const API_BASE_URL = isDemoMode ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');`。
   - 在開發環境或未指定 `VITE_API_URL` 時，預設指向本機 `http://localhost:4000/api`。
2. **API 實際端點**：
   - CSRF 取得：`GET http://localhost:4000/api/auth/csrf-token`
   - 會員登入：`POST http://localhost:4000/api/auth/login`
   - 會員註冊：`POST http://localhost:4000/api/auth/register`
   - 當前使用者探針：`GET http://localhost:4000/api/auth/me`
3. **安全憑證與 CSRF 流程**：
   - `fetch` 請求已全數設定 `credentials: 'include'`，符合 HTTP-Only Cookie Session 跨請求傳遞。
   - 所有變更狀態請求（POST/PUT/DELETE）均主動於 Header 帶入 `x-csrf-token`。
4. **通訊埠 4000 與後端伺服器實況（關鍵硬體診斷）**：
   - 經執行網路連線檢測，本機 Port 4000 確實處於 Listen 狀態。
   - **重大發現**：佔用 Port 4000 的處理程序**絕非 CODE TO KNOW 的 Node.js 後端服務**，而是 Windows 背景第三方授權程序 **`LicenseMan`（PID: 4964）**。
   - CODE TO KNOW 的後端伺服器（`server.ts`）目前**完全處於未啟動狀態**。
   - 當前端向 `http://localhost:4000` 發送 HTTP 請求時，封包被 `LicenseMan` 接收並導致超時（Timeout 15s），進而觸發前端 `catch` 區塊，彈出 `系統連線異常，請確認後端服務是否已啟動`。

---

### 1.3 後端及資料庫現況（區分「連線設定」與「實際連接」）

1. **是否有資料庫連線設定？**
   - **有設定**。[backend/src/config/env.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/env.ts) 定義了預設之本機 PostgreSQL 連線字串（`postgresql://codetoknow:...@127.0.0.1:5432/code_to_know`），且包含 Supabase 遠端 SSL 憑證驗證邏輯。
2. **資料庫是否真的可被目前後端使用？**
   - **完全無法使用（未連接）**。
   - 本機通訊埠 5432（PostgreSQL）與 5434（測試庫）皆無服務監聽。
   - 受限於專案最高保護令 **`AUTH-03 BLOCKED`**，資料庫連線嚴格處於離線隔離狀態，禁止向遠端 Supabase 發起實體連線，亦未執行 `prisma migrate deploy` 或資料種子植入。
   - 後端測試 [backend/tests/api.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts) 實測回傳證實：當嘗試調用 `prisma.user.findUnique()` 時，Prisma 直接拋出 `P1001: Can't reach database server at 127.0.0.1:5432`。

---

### 1.4 目前故障的真正原因與問題歸類

| 故障現象 | 根本原因 (Root Cause) | 可否前端修正 | 需何種條件方可解決 |
|---|---|:---:|---|
| **本機發送登入/註冊時超時卡死** | 通訊埠 4000 被第三方服務 `LicenseMan` 佔用，且後端 `server.ts` 根本未在背景運行 | **部分可（切換展示模式）** | 開發環境更換後端 PORT（如 4001），或正式啟動後端容器 |
| **點擊送出跳出系統連線異常** | 前端 `request()` 捕獲 `Failed to fetch (Network offline)` 錯誤 | **否（架構性）** | 需後端 API 服務正式在線並回應 HTTP 請求 |
| **後端伺服器 500 Unhandled Error** | 後端 Prisma 無法連線至 `127.0.0.1:5432`（P1001） | **否（資料庫層）** | 需啟動 PostgreSQL 資料庫並解除 AUTH-03 BLOCKED |
| **無已存在的使用者帳號登入** | 生產資料庫未灌入測試使用者，禁止虛構帳號 | **否（資料庫層）** | 需經專案安全核准後執行正規種子帳號注入腳本 |

---

## 二、既有載入畫面動態效果優化

### 2.1 既有載入畫面原始實作位置確認

經搜尋全站代碼，確認網站**唯一真正使用的頁面級載入畫面**位於：
- **檔案路徑**：[frontend/src/app/App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L42-L68)
- **原始組件名稱**：`GameLoadingFallback`（用於全站 5 大動態分割遊戲頁面之 `<Suspense fallback={...}>` 頂層掛載）。
- **原始問題**：
  1. 採用 Generic Bootstrap/Tailwind 藍色（`#2563EB`）與灰色（`#E2E8F0`），完全脫離「碼上學」品牌色系。
  2. 僅有一顆單純旋轉圓圈與文字「遊戲載入中，請稍候...」，無品牌 Logo、無標語、無層次。
  3. 未支援 `prefers-reduced-motion` 無障礙規範。

---

### 2.2 升級設計方向與品牌視覺規範

依據專案品牌指南，全面升級為**輕科技、高質感、溫暖、專業、現代簡潔**之動態載入體驗：

1. **採用正式品牌配色**：
   - 沉穩深炭灰：`#26343D`（標題文字）
   - 暖象牙／奶油白：`#F5F2EA`（徽章背景與微光）
   - 沉穩香檳金：`#BDA77E`（動態光環頭部與裝飾）
   - 迷霧藍灰：`#D9E2EA`（軌道底色與邊框）
   - 靜謐板岩藍灰：`#8FA9B8` / `#526B7B`（雙軌漸層環與說明文字）
2. **多層次精緻動態效果**：
   - **品牌標識淡入**：置頂展示官方 4 色 SVG Logo，搭配柔和立體光影。
   - **品牌標準字**：清楚展現「碼上學」與字距優化之「CODE TO KNOW」。
   - **雙軌動態載入光環**：
     - 外軌使用 `rgba(217, 226, 234, 0.45)` 靜態背景軌道。
     - 旋轉環採用香檳金（`#BDA77E`）至板岩藍灰（`#8FA9B8`）之漸進雙色弧線。
     - 中心嵌入 8px 香檳金微光呼吸點（`c2k-center-pulse`）。
   - **細緻掃光進度指示條（Shimmer Progress）**：
     - 140px 細緻進度槽，內嵌無段式金色光暈掃掠動態（`c2k-shimmer`），絕不使用虛假百分比數字欺騙使用者。
   - **品牌精神標語**：淡入呈現「碼上學，學無止境。｜Learn Beyond Limits.」。
3. **效能與無障礙保護（Accessibility & Performance）**：
   - 全數採用純 CSS GPU 加速 Keyframes（`transform` 與 `opacity`），零 JavaScript 計時器，零記憶體洩漏風險。
   - 完整支援 `@media (prefers-reduced-motion: reduce)`：對於偏好減少動態的使用者，自動關閉所有旋轉與掃光，維持靜態高對比雅緻展示。
   - 語意化屬性：容器標註 `role="status"`、`aria-live="polite"` 與 `aria-label="頁面與學習模組載入中"`。

---

### 2.3 響應式斷點實測驗收

已針對要求之寬度進行嚴格比對：
- **320px（超窄行動裝置）**：內距自適應收縮至 16px，卡片無水平溢出，文字與 SVG 比例完美。
- **375px（主流 iPhone 螢幕）**：置中卡片寬度自適應填滿，無溢出。
- **768px（平板直向）**：卡片固定於黃金寬度 380px，陰影層次分明。
- **1024px（平板橫向／小筆電）**：垂直置中於 70vh 視窗區間。
- **1440px / 1920px（桌面寬螢幕）**：背景光暈自然擴散，不擋住頁面框架。

---

## 三、自動化測試與建置驗收成果

### 3.1 前端 Vitest 測試套件
- **執行指令**：`npx --prefix frontend vitest run frontend/tests`
- **實測 Exit Code**：`0`
- **測試檔案覆蓋**：**53 個測試檔案全數通過（53 Passed，新增 2 套件）**
- **測試案例統計**：**482 個測試案例全數通過（482 Passed，0 Failed，0 Skipped）**
- **本次新增測試套件**：
  1. [frontend/tests/loading-screen.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/loading-screen.test.tsx)（4 項測試通過）：驗證無障礙 `role="status"`、品牌字樣與 SVG、品牌調色盤色碼、CSS 動畫與 `prefers-reduced-motion` 宣告。
  2. [frontend/tests/auth-modal.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/auth-modal.test.tsx)（5 項測試通過）：驗證關閉狀態為空、開啟狀態對話框無障礙、註冊表單元素、忘記密碼表單、重設密碼雙密碼欄位。

---

### 3.2 後端離線安全測試套件
- **執行指令**：`npm --prefix backend run test:offline`
- **實測 Exit Code**：`0`
- **測試檔案覆蓋**：**17 個測試檔案全數通過（17 Passed）**
- **測試案例統計**：**221 個測試案例全數通過（221 Passed，0 Failed，0 Skipped）**

---

### 3.3 全站測試總計
$$\text{全站通過測試案例總計} = 482 \text{ (前端)} + 221 \text{ (後端)} = \mathbf{703} \text{ 測試案例 100\% 通過（0 失敗）}$$

---

### 3.4 雙端靜態型別與生產建置結果
1. **前端 Vite 打包**：`npm --prefix frontend run build` -> `tsc && vite build`，耗時 2.18s，產出乾淨之 `dist/`，Exit Code: `0`。
2. **後端 TypeScript 編譯**：`npm --prefix backend run build` -> `tsc` 0 錯誤，產出 `dist/server.js`，Exit Code: `0`。

---

## 四、尚未完成且需要資料庫連接的項目清單（嚴守 AUTH-03 BLOCKED）

依據專案最高限制，以下項目**必須等待專案負責人正式召開安全會議並解除 AUTH-03 後方可執行**：

1. **實體資料庫連線池開通**：解開 Supabase 遠端 IP 白名單或本地 Docker PostgreSQL 容器服務（Port 5432）。
2. **正式資料庫 Schema 遷移 (`P19-DEP-005`)**：執行 `prisma migrate deploy` 建立實體 User、Account、Classroom 資料表。
3. **正式管理員帳號與種子使用者注入 (`P19-DEP-006`)**：使用 `scripts/create-admin.ts` 與安全雜湊注入真實帳號。
4. **真實端到端登入／註冊驗證 (`P18-QAS-003`)**：進行跨網路之實體 Session Cookie 發行與資料庫持久化比對。

---

## 五、Git 狀態與修改清單

### 5.1 本次唯讀檢查紀錄
- `git branch --show-current`：`develop`
- `git log -1 --oneline`：`6d93d70 docs: add GitHub develop sync and Render Preview readiness report`
- 嚴格未執行 `git commit`、`git push`、`git merge`、`git rebase`、`git deploy`、`git reset` 或 `git clean`。

### 5.2 本次修改與新增檔案清單
1. **受控修改檔案（1 個）**：
   - [frontend/src/app/App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx)：升級並導出品牌專屬動態載入組件 `GameLoadingFallback`。
2. **新增測試檔案（2 個）**：
   - [frontend/tests/loading-screen.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/loading-screen.test.tsx)
   - [frontend/tests/auth-modal.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/auth-modal.test.tsx)
3. **交付診斷報告（1 個）**：
   - [docs/development/AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md)

---

## 六、最終總結與明確結論

依據客觀實測與程式碼證據，明確總結如下：

1. **前端互動**：**【完全正常】**。登入、註冊、忘記密碼、重設密碼按鈕、對話框開啟關閉、表單輸入、必填防呆校驗與 Loading 狀態皆 100% 正常。
2. **API 連線**：**【尚未啟動／本機連線異常】**。API 端點路徑與 CSRF 邏輯正確，但本機後端 Node 伺服器未啟動，且通訊埠 4000 被外部程序 `LicenseMan` 佔用導致連線逾時。
3. **資料庫現況**：**【未連接】**。具備連線字串設定，但資料庫實體未啟動且未連線，嚴格處於 **`AUTH-03 BLOCKED`** 保護狀態。
4. **Loading 動態效果**：**【正式優化完成】**。已全面升級為融入「碼上學」5 大品牌色系、雙軌光環、掃光進度條、無障礙 `prefers-reduced-motion` 與 320px~1920px 全響應式動態畫面。
5. **是否需要進入下一階段資料庫連接作業**：**【維持暫停，待負責人審批】**。目前前端與展示層已 100% 就緒，後續資料庫開通必須等待專案安全會議與金鑰核發，不得擅自連線。
