# 碼上學｜CODE TO KNOW
# Render Preview 獨立測試環境部署前完整檢查報告

**文件識別：** `RENDER_PREVIEW_PRE_DEPLOYMENT_AUDIT.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**預計服務名稱：** `code-to-know-preview`  
**預計平台：** Render (Static Site)  
**GitHub 倉庫：** `Leonjay990414/CODE-TO-KNOW`  
**分支：** `main`  
**本機 Git HEAD：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**遠端 origin/main：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**任務性質：** 部署前架構審查、相容性檢驗、資安掃描、環境隔離與可行性評估（純稽核，無任何部署或 Git 寫入動作）  
**總體驗收判定：** **【B. 有條件可以建立，但必須先處理列出的問題】**  

---

## 一、Render Preview 建置目標與環境隔離原則

### 1. 建置目標
本次規劃在雲端平台 **Render** 建立一個完全獨立的前端靜態測試網站：`code-to-know-preview`。其目的在於：
1. 提供跨裝置、跨瀏覽器的真實公網預覽（Preview）環境，便於檢驗 UI/UX、RWD 響應式佈局與靜態展示效能。
2. 驗證非 GitHub Pages 環境下的靜態網站建置與 CDN 分發能力。
3. 建立後續自動化預覽工作流程之技術可行性驗證。

### 2. 環境隔離原則與四重界線
為確保平台現行營運與未來雲端資產絕對安全，本 Render Preview 必須恪守「四重隔離」：
- **與 GitHub Pages 公開展示網站隔離**：
  - 現行 GitHub Pages 位於 `https://leonjay990414.github.io/CODE-TO-KNOW/`，具有專屬子路徑 `/CODE-TO-KNOW/`。
  - Render Preview 部署於獨立頂層域名（如 `https://code-to-know-preview.onrender.com/`），兩者互不干擾、互不覆蓋。
- **與未來 Render 正式營運網站隔離**：
  - 本次僅為 `preview` 服務，絕不配置正式生產網域名稱，亦不得套用正式營運之 SSL/DNS 設定。
- **與正式後端 API 服務隔離**：
  - Preview 環境不直接綁定未經身分驗證或未上線之正式後端 API，預設採用前端 Demo Mode / 本機儲存模式運行。
- **與正式雲端資料庫（Supabase / PostgreSQL）絕對隔離**：
  - 嚴格維持 `AUTH-03` 安全紅線，前端代碼或環境變數絕不包含任何資料庫連線字串或 Service Role 金鑰。

---

## 二、Git 與專案狀態檢查

經過執行標準 Git 唯讀指令，取得之專案狀態如下：

```text
================================================================================
Git 狀態檢驗紀錄 (2026-11-15 20:31:30)
================================================================================
目前分支 (Branch)         : main
本機 HEAD Commit Hash     : c44ea7929f39ef469f380027c2fd3143726d9922
遠端 origin/main Hash     : c44ea7929f39ef469f380027c2fd3143726d9922
Commit 訊息               : feat(frontend): implement dynamic experience and synchronize deployment workflows
遠端 Fetch/Push URL       : https://github.com/Leonjay990414/CODE-TO-KNOW.git
================================================================================
```

### 1. 本機與遠端 Commit 狀態
- 本機 `main` 分支之 HEAD 與遠端 `origin/main` 之 Commit Hash **完全一致**（均為 `c44ea79`）。
- **無尚未 Push 之本機 Commit**。

### 2. 未提交修改（Working Tree Modifications）
本機工作目錄中，存在 **15 個已追蹤被修改檔案**（涵蓋第 2～4 波成果）：
1. `backend/src/app.ts`（安全中介軟體整合）
2. `frontend/src/app/App.tsx`（路由配置與全域通知）
3. `frontend/src/components/GameAchievementsModal.tsx`（成就彈窗樣式）
4. `frontend/src/components/GameBriefingModal.tsx`（遊戲關卡前導引）
5. `frontend/src/components/Navbar.tsx`（動態角色導覽切換）
6. `frontend/src/context/NavigationContext.tsx`（Hash 導覽跳轉）
7. `frontend/src/data/unifiedPracticalCurriculumData.ts`（**五大術科題組核心資料，僅 Task 1 保留 59 行教學說明差異，Task 2~5 零異動**）
8. `frontend/src/pages/public/AICoachPage.tsx`（AI 智慧家教四階鷹架）
9. `frontend/src/pages/public/LearningProgressPage.tsx`（學生個人進度圖表）
10. `frontend/src/pages/public/MockExamPage.tsx`（模擬測驗閱卷介面）
11. `frontend/src/pages/public/StudentDashboardPage.tsx`（學生學習首頁）
12. `frontend/src/pages/public/TeacherDashboardPage.tsx`（教師班級管理後台）
13. `frontend/src/pages/public/TheoryPracticePage.tsx`（理論實作整合）
14. `frontend/src/services/api.ts`（前端 API 客戶端與 Demo 模式）
15. `frontend/src/styles/components.css`（共用視覺主題樣式）

### 3. 未追蹤檔案（Untracked Files）
包含第 4 波平台管理員後台頁面（`AdminDashboardPage.tsx`）、學生加入班級對話框（`StudentClassJoinModal.tsx`）、學生學習工具儲存引擎（`studentStudyToolsStorage.ts`）以及數個驗證測試檔。

### 4. 關鍵部署落差評估（CRITICAL GAP）
- **Render 的部署機制是直接透過 GitHub App / Webhook 自遠端倉庫拉取代碼，並非上傳本機檔案**。
- 若目前直接以 GitHub `main` 分支在 Render 建立 Static Site，**Render 所抓取的將是遠端 Commit `c44ea79` 的歷史快照，完全不包含本機上述 15 個已修改檔案與未追蹤之後台成果**！
- 若希望 Render Preview 呈現第 2～4 波的最新完整功能，必須在取得專案負責人明確授權後，透過安全方式將必要成果提交並 Push 至遠端（例如建立獨立測試分支 `preview/render` 或由負責人指派方式辦理）。

---

## 三、前端架構與建置設定檢查

### 1. 核心套件與技術堆疊
- **框架核心**：React 18.3.1 (`react`, `react-dom`)
- **語言支援**：TypeScript 5.6.3 (`typescript`, `@types/react`)
- **建置工具**：Vite 5.4.10 (`vite`, `@vitejs/plugin-react`)
- **圖示庫**：Lucide React 0.460.0 (`lucide-react`)
- **套件鎖定檔**：`frontend/package-lock.json`（健全存在，符合一致性安裝要求）

### 2. Vite 設定 (`frontend/vite.config.ts`) 審查
```typescript
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [react()],
  server: { port: 3000, open: false },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          'theory-data': ['./src/data/officialTheoryQuestionBank.json'],
        },
      },
    },
  },
});
```
- **Base 路徑相容性**：
  - 現行配置 `base: process.env.VITE_BASE_PATH || './'`。
  - GitHub Pages 部署時透過 Action 傳入 `VITE_BASE_PATH: /CODE-TO-KNOW/`。
  - Render Static Site 係掛載於根域名，**預設之相對路徑 `./` 或設定 `VITE_BASE_PATH: /` 均能完美相容**。
  - 為避免未來深層 URL 直接請求時相對路徑解析異常，建議在 Render 環境變數中明確指定 `VITE_BASE_PATH: /`。

### 3. 入口與 HTML 結構 (`frontend/index.html`)
- 包含 UTF-8 編碼、全套 OpenGraph、Twitter Cards、EducationalOrganization JSON-LD 結構化資料。
- 引入 Google Fonts（Noto Sans TC, Inter, JetBrains Mono）。
- 無任何本機絕對路徑（如 `C:\Users\...`）依賴。

---

## 四、本地建置驗證與產出分析 (Build Results)

在本地執行 `npm run build` 與 `npm run build:demo` 進行生產模式建置測試：

```text
================================================================================
本地建置執行指標 (Execution Log)
================================================================================
建置指令                 : npm run build / npm run build:demo
TypeScript 型別檢查      : tsc --noEmit (0 errors 通過)
模組轉換總數             : 1,646 modules transformed
建置總耗時               : 2.22s ~ 2.23s
產出目錄                 : frontend/dist
產出檔案清單             :
  ├── index.html                                (2.90 kB, gzip: 1.32 kB)
  ├── robots.txt                                (81 bytes)
  ├── sitemap.xml                               (1.45 kB)
  ├── assets/index-DrV7GT_X.css                 (20.27 kB, gzip: 4.69 kB)
  ├── assets/vendor-react-*.js                  (133.93 kB, gzip: 43.13 kB)
  ├── assets/vendor-icons-*.js                  (45.36 kB, gzip: 10.56 kB)
  ├── assets/theory-data-*.js                   (152.45 kB, gzip: 45.09 kB)
  ├── assets/index-*.js                         (566.76 kB, gzip: 167.64 kB)
  └── assets/[各遊戲 Code-Splitting 獨立 Chunk]  (17 kB ~ 29 kB)
================================================================================
```

### 產出驗證結論：
1. **TypeScript 靜態編譯 100% 通過**，零語法與型別錯誤。
2. **Rollup 程式碼分割（Code-Splitting）正常運作**，五大遊戲頁面均成功產出獨立 chunk，有效加速首頁載入。
3. **無遺漏資源或破圖風險**，Favicon 及 SVG 圖示正確打包。

---

## 五、Node 與套件管理器相容性 (Node.js & npm)

1. **Node.js 版本需求**：
   - 目前本機使用 Node.js v24.19.0。
   - 專案 CI/CD 流程使用 Node.js 20 LTS（`node-version: 20`）。
   - Render 預設支援 Node.js 18、20 與 22 LTS。
   - **建議相容設定**：在 Render 環境變數指定 `NODE_VERSION: 20.18.0`（或 20.x），與專案 GitHub Actions 環境完全保持一致。
2. **套件安裝指令評估 (`npm ci` vs `npm install`)**：
   - 預定值為 `npm install && npm run build`。
   - **強烈建議改用 `npm ci && npm run build`**：
     - `npm ci` 依據 `package-lock.json` 進行乾淨且嚴格的相依性安裝，保證構建環境與本地一致。
     - 避免 `npm install` 自動升級相依套件所引發的潛在破壞性變更（Breaking Changes）。

---

## 六、環境變數與安全檢查 (Environment Variables & DevSecOps)

### 1. 前端環境變數盤點表

| 變數名稱 | 預期作用 | 本機開發預設值 | GitHub Pages 預設值 | Render Preview 建議值 | 安全風險評估 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `VITE_DEMO_MODE` | 切換純前端離線/示範模式 | 未設定 (`false`) | `true` | **`true`** | **公開安全**：僅影響前端 API 路由行為。 |
| `VITE_API_URL` | 後端 API 根路徑 | `http://localhost:4000/api` | 無（Demo 模式不使用） | 空字串 `""` | **公開安全**：若未設且 Demo 未開，會誤連 localhost。 |
| `VITE_BASE_PATH` | Vite 靜態資源部署根路徑 | `./` (相對路徑) | `/CODE-TO-KNOW/` | **`/`** | **公開安全**：決定 HTML 資源引用前綴。 |
| `NODE_VERSION` | 建置伺服器 Node 版本 | 系統環境 | `20` | **`20`** | **建置參數**：無機密性。 |

### 2. 前端公開資安檢驗 (DevSecOps Security Scan)
依據專案 CI 安全腳本標準，對 `frontend/dist` 進行敏感字元深度掃描：
- **在 `npm run build`（未開啟 Demo 模式）下**：
  - 檢測到 `http://localhost:4000` 殘留於 `index.js`（因未開啟 Demo 模式時預設後端位址為 localhost）。
  - **風險**：公網使用者造訪時，瀏覽器會向使用者自己的電腦（`127.0.0.1:4000`）發送請求，導致 Mixed Content 或連線被拒錯誤。
- **在 `npm run build:demo` 或設定 `VITE_DEMO_MODE=true` 下**：
  - 掃描結果：**0 違規（Zero Violations）**。
  - 完全無 `postgresql://`、`DATABASE_URL`、`SUPABASE_SERVICE_ROLE`、私鑰或敏感環境變數殘留。
  - **結論**：只要在 Render 設定 `VITE_DEMO_MODE: true`，產出物資安檢查即處於 100% 綠燈安全狀態。

---

## 七、API 與 Demo Mode 評估

由於目前 Render 獨立測試僅規劃前端靜態站（Static Site），正式後端 API 尚未在公網上線，前端功能之連線策略如下：

1. **純前端獨立運作功能（100% 可用）**：
   - 官方網站首頁、課程介紹、法律聲明。
   - 五大正式術科題組（104301～104305）之課程閱讀、版型引導與教學大綱。
   - 五大遊戲化學習模組（程式碼拼圖、CSS 設計師、除錯獵人、問答競速、網頁架構師）。
   - 模擬測驗題庫隨機抽題、作答、倒數計時與自動閱卷評分。
2. **依賴 LocalStorage 身分隔離之功能（100% 可用，本機持久化）**：
   - 學生專屬學習筆記、考題書籤與錯題本（`studentStudyToolsStorage.ts`）。
   - 學生個人學習進度統計、單元達成率（`learningStorage.ts`）。
   - 教師端班級建立、班級代碼生成、班級學生名冊檢視。
   - 管理員儀表板系統監控、帳號狀態切換與操作稽核日誌。
3. **Demo Mode 與正式 API 切換機制**：
   - 當 `VITE_DEMO_MODE=true` 時，前端登入對話框自動切換為快速示範登入（可一鍵切換訪客學員、認證教師或平台管理員身分），無需任何後端 API 即可順暢演示各角色介面。
   - **此架構能徹底避免無後端時整頁崩潰或白屏，為 Render Preview 最理想之運行模式**。

---

## 八、SPA 路由與靜態資源重寫 (SPA Rewrite)

### 1. 路由機制審查
- 專案使用自研 `NavigationContext.tsx`，**核心採用 Hash-based Routing（如 `/#admin`、`/#games`、`/#mock-exam`）**。
- **Hash 路由特性**：
  - 瀏覽器在發送 HTTP 請求時，Hash 標籤不會發送給伺服器。
  - 因此無論在任何子頁面直接重新整理（F5），伺服器收到的均為 `/`，直接回傳 `index.html`，不會發生 404 錯誤。

### 2. Render SPA Rewrite 設定建議
雖然當前為 Hash 路由，但為防止使用者直接鍵入非 Hash 路徑（如 `/admin`），或未來切換至 HTML5 History 路由（Browser Routing），**在 Render 配置 SPA Rewrite 仍為必要之防禦措施**：
- **Render 重寫設定（Redirects/Rewrites）**：
  - **Type**：`Rewrite`（內部重寫，保持 HTTP 200，非 301 轉址）
  - **Source Path**：`/*`
  - **Destination Path**：`/index.html`
- 此設定可百分之百杜絕任何深層網址存取時發生「404 Not Found」之情況。

---

## 九、Render Static Site 建議設定與預定值核對

依據上述各階段分析，將使用者任務書預定值與實際最佳化建議核對如下：

| 設定項目 | 任務書預定值 | Render 實測最佳化建議值 | 調整原因與技術依據 |
| :--- | :--- | :--- | :--- |
| **Service Name** | `code-to-know-preview` | **`code-to-know-preview`** | 維持一致，專屬預覽識別。 |
| **Service Type** | `Static Site` | **`Static Site`** | 完全正確，免伺服器維護，全球 CDN 託管。 |
| **Repository** | `Leonjay990414/CODE-TO-KNOW` | **`Leonjay990414/CODE-TO-KNOW`** | 維持一致。 |
| **Branch** | `main` | **`main`**（或獨立分支） | 需注意遠端 main 目前未包含本地 15 modified 檔案。 |
| **Root Directory** | `frontend` | **`frontend`** | 正確，所有前端檔案集中於 `frontend/`。 |
| **Build Command** | `npm install && npm run build` | **`npm ci && npm run build`** | **建議改為 `npm ci`**，確保 package-lock 精準還原。 |
| **Publish Directory** | `dist` | **`dist`** | 正確，Vite 產出目錄即為 `dist`。 |
| **Environment Variables** | 未指定 | `VITE_DEMO_MODE=true`<br>`VITE_BASE_PATH=/`<br>`NODE_VERSION=20` | **必要設定**：關閉 localhost 依賴並啟用 Demo 模式。 |
| **Redirects/Rewrites** | 未指定 | `/*` $\to$ `/index.html` (Rewrite) | **必要設定**：確保 SPA 路由重新整理不報 404。 |

---

## 十、費用及平台限制評估 (Render Official Limits)

依據 Render 官方當前最新規範（Render Pricing & Documentation）：

1. **費用（Cost）**：
   - Render Static Site 為 **100% 免費（Free Forever）**。
   - 每月固定費用：**$0 USD**。
2. **流量頻寬（Bandwidth）**：
   - 免費方案包含 **100 GB / 月** 的出站頻寬（Outbound Bandwidth）。
   - 對於本平台 Preview 測試與日常演示，此額度極為充裕（預估可支撐數萬次完整存取）。
3. **建置時間（Build Minutes）**：
   - 免費帳號享有 **500 build minutes / 月**。
   - 本專案單次建置僅需約 2.5 秒（加上 npm ci 約 30～45 秒），500 分鐘可支援每月超過 600 次自動部署。
4. **休眠限制（Sleep / Spin-down）**：
   - **重要特性**：**Render Static Site 不會休眠！**
   - Render 的「15 分鐘無存取休眠」政策**僅適用於 Web Services（動態後端運算實例）**。
   - Static Site 是透過 Render 全球 CDN 邊緣快取提供服務，**隨時存取皆能秒開，無冷啟動延遲**。
5. **自訂域名與 SSL**：
   - 免費附帶 `onrender.com` 子網域與全自動 Let's Encrypt TLS/SSL 憑證。

---

## 十一、前四波成果保護與不變量查核

在本次檢查過程中，以下專案既有成果與安全防護紅線均受到 100% 嚴格維護：
1. **五大正式術科題組（104301～104305）技術內容零修改**：
   - `unifiedPracticalCurriculumData.ts` 之題目規格、評分要點與解答代碼完全凍結。
2. **既有四大波次功能未受干擾**：
   - 學生端（P13）、教師端（P15）、管理員端（P16）現有程式碼維持原狀。
3. **安全防護邊界維持生效**：
   - `AUTH-03` 維持阻斷（BLOCKED）。
   - `task-13717` 維持停止（STOPPED）。
   - `P09-DBA-012` 維持阻斷（BLOCKED at 30%）。
   - 未執行任何資料庫操作或後端 API 篡改。
4. **Git 工作目錄純淨性保護**：
   - 未執行任何 `git add`、`commit`、`push`、`reset` 或 `clean` 操作。

---

## 十二、目前阻塞事項與關鍵技術落差 (Blockers)

在正式建立 Render 服務前，存在以下 **2 項必須由專案負責人拍板之關鍵事項**：

1. **【核心阻塞】遠端 GitHub 與本地工作目錄版本不同步**：
   - 目前 GitHub 遠端 `main` 分支停留在 Commit `c44ea79`。
   - 本地工作目錄含有第 2～4 波之 **15 個已修改檔案** 與多個未追蹤元件（如管理員後台）。
   - **Render 僅能建置 GitHub 遠端已存在的代碼**。若現在直接部署遠端 `main`，部署出來的網站將是舊版快照，無法呈現近期的後台與優化成果。
2. **【環境變數依賴】必須在 Render 控制台手動配置變數**：
   - 由於 `.env` 與 `.env.demo` 均受 `.gitignore` 排除，Render 倉庫中無環境變數檔。
   - 建立服務時，必須在 Render 介面注入 `VITE_DEMO_MODE=true`，否則網站將因找不到後端而嘗試連線 localhost。

---

## 十三、是否可以進入下一步與授權清單

### 1. 總體驗收判定
依據任務書第十五條規定，本檢查給出明確判定：

$$\mathbf{判定結果：【B. 有條件可以建立，但必須先處理列出的問題】}$$

### 2. 下一步所需授權事項清單 (待使用者授權)
若專案負責人決定推進 Render 獨立測試環境建置，需先授權並確認以下事項：

1. **授權版本同步方式（二擇一）**：
   - **方案 A（推薦）**：授權建立獨立測試分支（如 `preview/render`），將包含第 2～4 波成果的工作目錄安全提交並 Push 至該分支，由 Render 綁定該分支進行預覽。此舉可完全保護 `main` 分支不受未核准 commit 干擾。
   - **方案 B**：維持遠端 `main` 分支現狀，暫不提交本機修改，先以 Commit `c44ea79` 建立 Render 基礎管道驗證，待未來波次結案統一 Push 後再自動更新。
2. **授權 Render 與 GitHub App 連接**：
   - 由負責人於 Render 控制台授權存取 `Leonjay990414/CODE-TO-KNOW` 倉庫。
3. **授權 Render 服務建立參數**：
   - 核准設定 Service Name 為 `code-to-know-preview`。
   - 核准設定 Build Command 為 `npm ci && npm run build`。
   - 核准配置環境變數 `VITE_DEMO_MODE=true`、`VITE_BASE_PATH=/`、`NODE_VERSION=20`。
   - 核准配置 SPA Rewrite 規則 `/*` $\to$ `/index.html`。
