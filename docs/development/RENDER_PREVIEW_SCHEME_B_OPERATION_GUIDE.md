# 碼上學｜CODE TO KNOW
# Render Preview（方案 B）GitHub 遠端 main 版本操作指南

**文件識別：** `RENDER_PREVIEW_SCHEME_B_OPERATION_GUIDE.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**方案代號：** 方案 B（使用 GitHub 遠端 `main` 分支既有 Commit 建立獨立預覽）  
**指定 GitHub 倉庫：** `Leonjay990414/CODE-TO-KNOW`  
**指定分支：** `main`  
**指定 Commit SHA：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**預計 Render 服務名稱：** `code-to-know-preview`  
**預計 Render 服務類型：** `Static Site`  
**任務性質：** 部署操作指南、安全隔離規範、環境變數與儀表板設定手冊（本文件僅供操作參考，無任何自動部署動作）  

---

## 一、方案 B 核心目標與版本鎖定原則

### 1. 方案 B 核心目標
本方案旨在以 **GitHub 遠端既有且已驗證的穩定版本**，在雲端平台 **Render** 建立首個獨立前端靜態測試站（`code-to-know-preview`）：
- **完全不影響本機工作目錄**：本機目前保留的 15 個已修改檔案、五大術科題組差異與未追蹤之後台成果 100% 原樣凍結，不執行任何 Commit、Push 或 Reset。
- **完全不干擾既有 GitHub Pages**：官方展示站（`https://leonjay990414.github.io/CODE-TO-KNOW/`）維持獨立運作。
- **驗證 Render 靜態託管管道**：建立穩定的 CI/CD 靜態網站分發、CDN 邊緣快取與 SPA 路由重寫機制。

### 2. 嚴格鎖定之遠端版本
- **遠端 Commit**：`c44ea7929f39ef469f380027c2fd3143726d9922`
- **Commit 訊息**：`feat(frontend): implement dynamic experience and synchronize deployment workflows`
- **核對結果**：經 `git ls-remote origin refs/heads/main` 查核，遠端 `origin/main` 目前精確指向此 Commit，兩者完全一致。

---

## 二、遠端版本前端獨立建置驗證成果

為了確保 Render 在抓取遠端 Commit `c44ea79` 時能 100% 成功建置，本團隊透過 `git archive` 將該 Commit 的 `frontend/` 完整匯出至隔離暫存區（`scratch/build_test_c44ea79/frontend`），並於完全隔離的環境執行完整安裝與編譯驗證：

```text
================================================================================
隔離環境建置驗證指標 (Commit: c44ea7929f39ef469f380027c2fd3143726d9922)
================================================================================
建置環境 Node.js 版本    : v24.19.0 (本地) / 建議 Render 使用 Node 20 LTS
建置環境 npm 版本        : 11.17.0
套件安裝指令             : npm ci
安裝耗時與狀態           : 15s (added 69 packages, 0 vulnerabilities)
TypeScript 檢查 (tsc)    : 0 errors (100% 通過)
Vite Production Build    : vite v5.4.21 building for production...
轉換模組總數             : 1,643 modules transformed
建置總耗時               : 2.21 秒
產出目錄                 : dist/ (存在且結構完整)
產出檔案清單             :
  ├── index.html                                (2.96 kB, gzip: 1.33 kB)
  ├── assets/index-CMuA-u8S.css                 (20.19 kB, gzip: 4.68 kB)
  ├── assets/vendor-react-BqYbU4D3.js          (133.93 kB, gzip: 43.13 kB)
  ├── assets/vendor-icons-BIDyy1NQ.js           (42.24 kB, gzip: 10.04 kB)
  ├── assets/theory-data-MoTt3-Ns.js           (152.45 kB, gzip: 45.09 kB)
  ├── assets/index-BFaVfMEU.js                 (470.86 kB, gzip: 142.12 kB)
  └── assets/[五大遊戲獨立 Code-Split Chunks]    (17 kB ~ 29 kB)
DevSecOps 資安掃描       : 18 個產出檔案掃描完成，0 項違規 (Zero Violations)
================================================================================
```

> **建置結論：**  
> 遠端 Commit `c44ea79` 的前端代碼結構完全健全，依賴套件無衝突，TypeScript 編譯零錯誤，主程式碼 Bundle 大小低於 500 kB 警示門檻，已完全具備在 Render 雲端環境一次性建置成功的條件。

---

## 三、Render Static Site 完整設定規格表

請使用者在 Render 控制台建立服務時，依據下表輸入各項參數：

| 設定項目 | 推薦輸入值 | 設定層級 | 說明與原因 |
| :--- | :--- | :---: | :--- |
| **Service Name** | `code-to-know-preview` | 必要 | 專屬預覽服務名稱，對應網址為 `code-to-know-preview.onrender.com`。 |
| **Service Type** | `Static Site` | 必要 | 選擇靜態網站（免費、無伺服器開銷、全站 CDN）。 |
| **Repository** | `Leonjay990414/CODE-TO-KNOW` | 必要 | 連接您的 GitHub 專案倉庫。 |
| **Branch** | `main` | 必要 | 部署來源分支（目前指向 `c44ea79`）。 |
| **Root Directory** | `frontend` | 必要 | 告知 Render 前端專案位於根目錄下的 `frontend` 資料夾。 |
| **Build Command** | `npm ci && npm run build` | 必要 | 使用 `npm ci` 依 lockfile 嚴格還原套件，再執行編譯。 |
| **Publish Directory**| `dist` | 必要 | Vite 建置完成後的靜態輸出目錄。 |
| **Auto-Deploy** | **`No`（停用自動部署）** | **關鍵** | **避免後續 main 分支被 push 時自動觸發非預期部署，鎖定在指定版本。** |

---

## 四、環境變數詳細設定表

請在 Render 建立頁面的 **"Advanced" $\to$ "Environment Variables"** 區塊新增以下 3 項變數：

| 環境變數名稱 | 設定值 | 作用說明與必要性 |
| :--- | :---: | :--- |
| **`VITE_DEMO_MODE`** | `true` | **【極度重要】** 啟用純前端展示模式。代碼中 `api.ts` 會切斷向 `localhost:4000` 請求，轉為 LocalStorage 與模擬資料展示，避免公網存取失敗。 |
| **`VITE_BASE_PATH`** | `/` | **【強烈建議】** 指定靜態資源以網站根路徑引用，確保 SPA 所有子路徑均能正確載入 CSS/JS。 |
| **`NODE_VERSION`** | `20` | **【強烈建議】** 指定 Render 使用 Node.js 20 LTS 構建環境，與 GitHub Actions 完全一致。 |

> **資安宣告：**  
> 本專案為純前端靜態站，**嚴禁將以下任何機密填入環境變數**：
> - 資料庫連線字串 (`DATABASE_URL` / `postgresql://`)
> - Supabase Service Role Key
> - 伺服器 JWT Secret / Session Secret
> - 第三方服務私鑰

---

## 五、SPA 路由重寫 (Redirects/Rewrites) 設定

Render 預設會將非 `/index.html` 的路徑視為尋找伺服器檔案，若未設定重寫，當使用者於非根目錄重新整理頁面時可能出現 404。

請於服務建立完成後，於 Render 儀表板左側點選 **"Redirects/Rewrites"**，新增以下規則：

```text
Type        : Rewrite
Source      : /*
Destination : /index.html
```

- **重寫效果**：所有發往該網址的子路徑請求，伺服器均內部回傳 `index.html`（HTTP 200），交由前端 `NavigationContext.tsx` 進行 Hash 路由解析，徹底杜絕 404 錯誤。

---

## 六、使用者操作全流程指南 (Step-by-Step Walkthrough)

以下步驟需由專案負責人自行於瀏覽器操作，團隊無法且絕不代替執行：

### 步驟 1：登入 Render 控制台
1. 開啟瀏覽器造訪 [https://dashboard.render.com](https://dashboard.render.com)。
2. 使用您的帳號（建議直接使用與 GitHub 綁定之帳號）登入。

### 步驟 2：授權 Render 存取 GitHub 倉庫
1. 若初次使用，點選右上角 **"New +"** $\to$ 選擇 **"Static Site"**。
2. 在 "Connect a repository" 畫面中，若尚未連接 GitHub，點選 **"Connect account"**。
3. 頁面將跳轉至 GitHub 的 **"Install & Authorize Render"** 授權頁：
   - 建議選擇 **"Only select repositories"**。
   - 在下拉選單中搜尋並勾選 `Leonjay990414/CODE-TO-KNOW`。
   - 點擊綠色按鈕 **"Install & Authorize"**。
4. 授權完成後，頁面將自動返回 Render 控制台，並顯示 `Leonjay990414/CODE-TO-KNOW` 倉庫。

### 步驟 3：配置 Static Site 參數
1. 在倉庫列表旁點選 **"Connect"**。
2. 進入服務設定表單，依據上述規格填寫：
   - **Name**：輸入 `code-to-know-preview`
   - **Branch**：確認為 `main`
   - **Root Directory**：輸入 `frontend`
   - **Build Command**：輸入 `npm ci && npm run build`
   - **Publish Directory**：輸入 `dist`
3. 滾動至下方，點擊展開 **"Advanced"**：
   - **Auto-Deploy**：點選切換為 **"No"**（重要！關閉自動部署以鎖定版本）。
   - **Add Environment Variable**：依序新增以下三項：
     - `VITE_DEMO_MODE` = `true`
     - `VITE_BASE_PATH` = `/`
     - `NODE_VERSION` = `20`

### 步驟 4：建立服務並啟動首次建置
1. 確認上述資料無誤後，點擊最下方藍色按鈕 **"Create Static Site"**。
2. 系統將進入服務詳情頁，並自動開始首次建置（Logs 畫面滾動）。
3. 建置過程預計耗時約 45～60 秒（套件下載約 15 秒，編譯約 3 秒）。
4. 當日誌最下方出現 `==> Your service is live 🎉` 時，表示建置與部署成功。

### 步驟 5：配置 SPA Rewrite 規則
1. 建置成功後，點選左側選單的 **"Redirects/Rewrites"**。
2. 點選 **"Add Rule"**：
   - **Type**：選擇 `Rewrite`
   - **Source**：填入 `/*`
   - **Destination**：填入 `/index.html`
3. 點選 **"Save Changes"**。

### 步驟 6：驗收測試網站
1. 點選服務標題下方的公開網址（例如：`https://code-to-know-preview.onrender.com`）。
2. 驗證以下頁面能否正常開啟：
   - 首頁 Hero 區塊與特點介紹
   - 模擬測驗題庫（`/#mock-exam`）
   - 理論與實作頁面（`/#theory-practice`）
   - 遊戲中心大廳與五款互動遊戲（`/#game-center`）
   - 示範快速登入（點選右上角登入，應能一鍵切換訪客學員身分）

---

## 七、Demo Mode 功能邊界與版本落差明確宣告

在預覽此測試站時，請特別理解以下功能邊界與版本落差：

### 1. 方案 B（遠端 Commit c44ea79）可正常使用之功能
- 官方首頁展示與檢定認證說明。
- 五大正式術科題組（104301～104305）的檢定題綱、單元導航與程式碼實作展示。
- 題庫模擬測驗：隨機抽題、單選題作答、計時器、即時閱卷評分。
- 五大遊戲化學習原型：程式碼拼圖、CSS 樣式設計師、除錯獵人、問答競速、網頁架構師。
- 本機儲存學習紀錄：利用瀏覽器 LocalStorage 暫存練習進度。

### 2. 方案 B「不包含」之本機近期成果（因尚未 Push）
由於方案 B 係採用遠端 Commit `c44ea79`，**本機工作目錄中的以下最新成果將不會呈現在此次 Preview 中**：
- **第 4 波平台管理員後台**（`AdminDashboardPage.tsx`，含系統狀態監控、操作稽核日誌與維護模式）。
- **第 3 波學生加入班級彈窗**（`StudentClassJoinModal.tsx`，輸入 6 碼加入代碼）。
- **第 2 波學生自修工具引擎**（`studentStudyToolsStorage.ts`，錯題本、書籤、自訂筆記進階功能）。
- **五大術科題組 Task 1 擴充之 59 行教學說明**（遠端為 Task 1 原始版本）。

> **說明：** 本次為方案 B 之基礎驗證。待日後專案負責人核准將本機最新成果提交至遠端分支時，Preview 站點即可透過重新部署呈現最新後台功能。

---

## 八、常見問題與故障排除 (Troubleshooting)

1. **問題：存取網站時，瀏覽器 Console 出現 `net::ERR_CONNECTION_REFUSED http://localhost:4000/api/...`**
   - **原因**：未成功注入 `VITE_DEMO_MODE=true` 環境變數，導致前端嘗試連線 localhost 後端。
   - **解法**：進入 Render 控制台 $\to$ "Environment" $\to$ 確認 `VITE_DEMO_MODE` 值為 `true`，點選 "Save Changes" 並手動執行 "Manual Deploy" $\to$ "Deploy latest commit"。

2. **問題：在子路徑重新整理頁面出現 Render 預設 404 頁面**
   - **原因**：尚未設定 SPA 重寫規則。
   - **解法**：進入 Render 控制台 $\to$ "Redirects/Rewrites" $\to$ 新增 `/*` 到 `/index.html` 的 `Rewrite` 規則。

3. **問題：日誌顯示 Node 版本不符或 build failed**
   - **解法**：確認環境變數 `NODE_VERSION` 已設定為 `20`。

---

## 九、Render 官方方案費用與配額查核

依據 Render 官方定價（Render Pricing & Docs，2026 年最新查核）：
- **Static Site 方案費用**：**$0 USD / 免費**。
- **出站流量頻寬 (Bandwidth)**：每月 **100 GB**（靜態網頁與壓縮資源平均僅數十 kB，100 GB 相當於數萬次完整瀏覽）。
- **建置時間 (Build Minutes)**：每月 **500 分鐘**（單次建置約 45 秒，每月可支援 600 次以上部署）。
- **休眠機制 (Sleep)**：**無休眠！** Static Site 透過全球 CDN 快取分發，隨時存取皆為即時秒開，不會像動態 Web Service 產生冷啟動延遲。
- **超額處置**：若達到 100 GB 流量上限，網站會暫時停用直至下個帳單週期，或由使用者手動綁定信用卡加購（$0.10/GB），絕不會在未經同意下自動扣款。

---

## 十、安全紅線與隔離承諾

本指南所規劃之所有操作，完全遵循專案最高安全標準：
- **GitHub Pages 公開站點** 100% 獨立，設定零改動。
- **`AUTH-03`** 維持阻斷，無任何資料庫連線。
- **五大正式術科題組** 內容與解答 100% 凍結。
- **本機 Git 工作目錄** 保持現況，零破壞、零覆蓋。
