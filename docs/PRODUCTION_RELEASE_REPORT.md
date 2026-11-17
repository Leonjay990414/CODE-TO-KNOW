# CODE TO KNOW｜正式網站完整更新與 GitHub／Render Production 部署驗收報告

**發布日期**：2026-11-17  
**專案名稱**：CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）  
**發布性質**：正式版本同步更新與生產環境部署（Production Release）  
**發布流程**：Local Working Tree → `develop` → `main` → Render Production Webhook Deployment  

---

## 一、發布摘要與核心成果

本次任務已順利完成 CODE TO KNOW 專案的全面安全稽核、雙端自動化測試（737 項測試全數通過）、GitHub 正式儲存庫同步更新（`develop` 與 `main` 雙分支完全對齊），以及 Render Production 正式靜態網站的最新版本構建與部署。

- **GitHub 儲存庫**：`Leonjay990414/CODE-TO-KNOW`
- **主要更新 Commit**：`85f4fb25ee3782fcafa648a9de7b87019c2fc297` (`85f4fb2`)
- **發布分支狀態**：`origin/develop` 與 `origin/main` 均已推進至 `85f4fb2`
- **Render Production Service**：`code-to-know-web`
- **正式環境網址**：`https://code-to-know-web.onrender.com/`
- **線上運作狀態**：HTTP 200 OK，最新五大術科教學模組、RWD 動畫與全新架構已成功上線生效

---

## 二、GitHub 更新詳細紀錄

### 1. 分支與 Commit 資訊
- **儲存庫**：`Leonjay990414/CODE-TO-KNOW`
- **遠端關聯**：`origin` -> `https://github.com/Leonjay990414/CODE-TO-KNOW.git`
- **前一版本基準 Commit**：`e6edaa9`
- **本次發布 Commit SHA**：`85f4fb25ee3782fcafa648a9de7b87019c2fc297`
- **Commit 訊息**：
  ```
  feat: sync verified practical curriculum, RWD motion enhancements, audit reports and 5-tier architecture
  ```
- **分支合併策略**：`git merge --ff-only develop`（嚴格遵守 Fast-forward 合併，無多餘分岔與 Merge Conflict）。
- **推播策略**：標準 `git push origin develop` 與 `git push origin main`（嚴格禁止 `--force`）。

### 2. 本次發布納入之 47 項核心檔案

本次嚴格採用明確路徑暫存（無使用萬用字元 `git add .` 或 `-A`），共更新 47 個檔案（新增 10,970 行，移除 124 行）：

#### (1) 設定與安全規則（1 個）
- `.gitignore`：明確排除敏感目錄、本機 Agent 工具目錄與暫存快取。

#### (2) 前端功能改進與動畫優化（9 個既存檔案更新）
- `frontend/src/components/AuthModal.tsx`：改善登入/註冊彈窗互動與載入狀態。
- `frontend/src/components/Hero.tsx`：套用流暢進入動畫與微交互效果。
- `frontend/src/components/LearningExperience.tsx`：強化五大核心體驗卡片視覺與滾動觸發。
- `frontend/src/components/Navbar.tsx`：優化手機/平板/摺疊螢幕導覽列排版與選單控制。
- `frontend/src/components/StudentTeacherDual.tsx`：雙視角架構導覽微動效強化。
- `frontend/src/pages/public/CodeEditorPage.tsx`：支援即時編輯器多視圖切換與程式碼載入。
- `frontend/src/pages/public/HomePage.tsx`：全站 RWD 布局與斷點微調。
- `frontend/src/pages/public/PracticalLearningPage.tsx`：正式導入五大題組（104301~104305）導引與卡片。
- `frontend/src/styles/components.css`：新增 Scroll Reveal、Glassmorphism 與無障礙動效 CSS。

#### (3) 前端新增組件、教學模組與 Sandbox 引擎（15 個新檔案）
- `frontend/src/components/AuthLoadingView.tsx`：優質化認證載入體驗與狀態轉移。
- `frontend/src/data/practicalTeachingModules.ts`：1,499 行完整的 104301~104305 五大術科原創教學資料。
- `frontend/src/utils/practicalSandboxEngine.ts`：1,132 行的多頁 HTML/CSS 虛擬檔案系統與沙箱執行引擎。
- `frontend/src/utils/useScrollReveal.ts`：輕量級高效能 IntersectionObserver 滾動觸發 Hook。
- `frontend/src/pages/student/practical/PracticalHomePage.tsx`：學生端五大題組學習首頁。
- `frontend/src/pages/student/practical/PracticalDetailPage.tsx`：題組總覽、知識點清單與評量指針。
- `frontend/src/pages/student/practical/PracticalLessonPage.tsx`：單元逐步教學、程式碼範例與重點提示。
- `frontend/src/pages/student/practical/PracticalSandboxPage.tsx`：即時多頁編輯器與 IFrame 沙箱預覽。
- `frontend/src/pages/student/practical/index.ts`：模組導出進入點。
- 5 層架構規範說明文件：
  - `frontend/src/pages/marketing/README.md`
  - `frontend/src/pages/student/README.md`
  - `frontend/src/pages/teacher/README.md`
  - `frontend/src/pages/platform-admin/README.md`
  - `frontend/src/pages/system-ops/README.md`
  - `frontend/src/pages/shared/README.md`

#### (4) 前端自動化測試套件（3 個新檔案）
- `frontend/tests/animation-and-interactions.test.tsx`
- `frontend/tests/nav-rwd-auth-motion.test.tsx`
- `frontend/tests/practical-interactive-system.test.ts`

#### (5) 核心架構規格與稽核驗收報告（19 個檔案）
- `docs/BRAND_GUIDELINES.md`
- `docs/DATABASE_BACKEND_MCP_REPAIR_REPORT.md`
- `docs/FULL_SITE_LAYOUT_RESPONSIVE_AUDIT.md`
- `docs/LOCAL_ENVIRONMENT_AND_MCP_INTEGRATED_AUDIT.md`
- `docs/PRACTICAL_KNOWLEDGE_GAP_ANALYSIS.md`
- `docs/PRACTICAL_PDF_CONTENT_AUDIT.md`
- `docs/PRACTICAL_TEACHING_CONTENT_SPEC.md`
- `docs/PRACTICAL_VIDEO_RESEARCH.md`
- `docs/PRACTICAL_VIDEO_VERIFICATION_AUDIT.md`
- `docs/PROJECT_20_PHASE_DATA_VALIDATION_AUDIT_20261113.md`
- `docs/PROJECT_20_PHASE_FINAL_ACCEPTANCE_AUDIT_20261113.md`
- `docs/PROJECT_20_PHASE_MASTER_PROGRESS_AUDIT_20261113.md`
- `docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md`
- `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`
- `docs/WEB_PAGE_ARCHITECTURE.md`
- `docs/architecture/FLUTTER_MOBILE_APP_ARCHITECTURE.md`
- `docs/architecture/MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md`
- `docs/design/ANIMATION_AND_INTERACTION_SPECIFICATION.md`
- `docs/marketing/MARKETING_SOP.md`

---

## 三、敏感資訊安全排查結果

在執行 Git Staging 與 Commit 之前，執行了自動化正則安全檢查機制：

1. **掃描項目與正則模式**：
   - 私密金鑰 (`BEGIN PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`)
   - 資料庫密碼與連線字串 (`postgres://.*:.*@`, `password=`)
   - 各類 API Token / Secret (`sk-`, `ghp_`, `eyJhbGciOi`, Bearer tokens)
   - 雲端服務憑證與連線憑證。
2. **掃描檔案數**：
   - 預備發布之 47 項程式碼與文件：**全數通過檢驗，0 項敏感資訊**。
3. **發現與防禦策略**：
   - 於未追蹤的舊歷史目錄 `docs/development/` 中，偵測到舊除錯紀錄包含測試 Token 字串。
   - **立即防禦措施**：將 `docs/development/` 永久加入 `.gitignore`，嚴禁納入版本控制與發布。
   - 確保所有正式與測試之環境變數一律由伺服器端環境變數注入，嚴禁任何憑證進 Git。

---

## 四、本地建置與自動化測試驗證

發布前於本機環境執行完整建置與端對端單元測試，達成 100% 通過：

| 測試項目 | 指令 | 耗時 | 結果 |
|---|---|---|---|
| **Frontend TypeScript & Vite Build** | `npm run build --prefix frontend` | 2.31s | **PASS (0 Errors, 0 Warnings)** |
| **Frontend Vitest Test Suite** | `npx vitest run` | 5.20s | **PASS (57 Test Files, 516 Tests Passed, 0 Failed)** |
| **Backend TypeScript Build** | `npm run build --prefix backend` | 1.84s | **PASS (0 Errors, 0 Warnings)** |
| **Backend Vitest Offline Suite** | `npm run test:offline --prefix backend` | 3.12s | **PASS (17 Test Files, 221 Tests Passed, 0 Failed)** |
| **雙端總計** | - | - | **74 Files, 737 Tests ALL PASSED** |

---

## 五、Render Production 部署與線上驗證

### 1. 部署配置與觸發
- **Render 服務名稱**：`code-to-know-web`
- **服務類型**：Static Site
- **Root Directory**：`frontend`
- **Build Command**：`npm ci && npm run build`
- **Publish Directory**：`dist`
- **部署分支**：`main`
- **觸發來源**：GitHub Webhook（由 `origin/main` 推播觸發）
- **觸發 Commit**：`85f4fb25ee3782fcafa648a9de7b87019c2fc297`

### 2. 生產環境端點連線測試
使用自動化腳本對 `https://code-to-know-web.onrender.com/` 進行即時探測：

```
--- Testing Live Endpoints ---
[200 OK] /                          -> Content-Type: text/html; charset=utf-8
[200 OK] /assets/index-BNQw8Gtk.css -> Content-Type: text/css; charset=utf-8
[200 OK] /assets/index-BqZ1y3o5.js  -> Content-Type: application/javascript
[200 OK] /images/logo/symbol.svg    -> Content-Type: image/svg+xml
```

### 3. 線上 Bundle 內容特徵驗證
抽檢線上正式環境之 `assets/index-BqZ1y3o5.js`（730,251 bytes）：
- **包含五大術科題組代碼 (104301~104305)**：`True`
- **包含正式題組名稱（校園社團介紹網等）**：`True`
- **包含實務教學核心模組 (`practicalTeachingModules`)**：`True`
- **包含頁面標題（碼上學｜CODE TO KNOW — AI 智慧學習與教育科技平台）**：`True`

證明最新程式碼已成功編譯並即時服務於 Render 邊緣網路。

---

## 六、排除檔案清單與原因

依據發布安全標準，以下目錄與檔案被嚴格排除於本次發布之外：

| 檔案／目錄分類 | 代表項目 | 排除原因 |
|---|---|---|
| **環境變數檔案** | `.env`, `.env.*`, `frontend/.env`, `backend/.env` | 包含開發環境組態，遵循資安規範嚴禁入庫。 |
| **本地暫存與除錯腳本** | `scratch/`, `tmp/`, `work/` | 本地診斷與探測專用腳本，不屬於產品程式庫。 |
| **內部歷史診斷報告** | `docs/development/` | 早期內部診斷紀錄，可能夾帶除錯字串，列入 `.gitignore`。 |
| **本機知識圖譜資料** | `graphify-out/` | 本機語義圖譜快取，由開發環境動態生成。 |
| **依賴套件與建置輸出** | `node_modules/`, `dist/`, `build/` | 依賴項由 Render `npm ci` 安裝，靜態檔由 Render 自動打包。 |
| **原始二進位題庫試題** | `*.docx`, `*.zip`, 原始壓縮包 | 屬於原始教材資料來源，正式發布僅包含轉譯後的高品質結構化 JSON/TS 內容。 |
| **本機 IDE / Agent 設定** | `.agents/`, `.gemini/`, `.adal/`, `mcp_config.json` | 本地 IDE 與 Agent 專用設定檔，禁止進入團隊共用儲存庫。 |

---

## 七、結論

本次 CODE TO KNOW 正式發布任務圓滿完成：
1. **程式品質**：737 個測試全部通過，TypeScript 0 報錯。
2. **資安規範**：0 敏感資訊外洩，嚴密排除不當檔案。
3. **版本控制**：`develop` 與 `main` 雙分支完全 Fast-forward 同步至 `85f4fb2`。
4. **雲端運作**：Render 生產環境部署成功，正式網站功能運作無誤。
