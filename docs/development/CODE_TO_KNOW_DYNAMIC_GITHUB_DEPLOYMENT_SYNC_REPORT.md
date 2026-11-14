# CODE TO KNOW｜動態體驗升級、工作流程修復與部署一致性驗收報告

**專案名稱：** 碼上學｜CODE TO KNOW  
**報告類型：** 動態體驗升級 GitHub 同步與部署一致性驗收報告  
**驗收日期：** 2026-11-15  
**驗收基準：** Commit `ab34a33` → 目標 Commit  
**執行模式：** 嚴格唯讀保護資料庫 / AUTH-03 鎖定 / 背景任務 `task-13717` 隔離保護  

---

## 一、本次任務目標與邊界規範確認

1. **程式碼與文件同步**：將全站動態體驗升級（Tokens、微互動、Reduced Motion、零動態專注區保護）之原始碼與 5 份規劃/安全/驗收文件完整同步至 GitHub `main`。
2. **CI/CD Preview Workflow 修復**：修正 `.github/workflows/deploy-preview.yml` 中 `TypeScript Type Check` 步驟因工作目錄不符導致的建置失敗。
3. **部署環境與一致性盤點**：清查 GitHub Pages、Preview Workflow 及專案其他部署環境設定，確認原始碼與建置版本一致性。
4. **絕對禁止事項遵守**：
   - 正式 Supabase、Prisma Schema、資料庫與 Docker：**零連線、零修改、零 Migration**。
   - `AUTH-03`：維持 **BLOCKED**。
   - 背景任務 `task-13717`：**完全隔離保護，無中斷、無終止**。
   - 官方題庫 605 題與 5 套術科課程：**零改動**。
   - Git 操作：**嚴禁 `git add .` / `git add -A`，嚴格執行單檔顯式加入**。

---

## 二、本次實際變更檔案盤點 (Change Inventory)

### 1. 前端程式碼檔案 (Frontend Source Code)
- `frontend/src/styles/tokens.css`：新增標準 Motion Tokens（`--dur-instant`, `--dur-fast`, `--dur-base`, `--dur-slow`, `--dur-slower`, `--ease-standard`, `--ease-enter`, `--ease-spring`, `--motion-scale-press` 等）與向後相容別名。
- `frontend/src/styles/components.css`：按鈕觸覺點擊縮放 (`0.97`)、卡片 hover 上浮 (`-4px`, 僅 fine-pointer 生效)、輸入框金黃光暈焦點環、Modal 彈性放大、行動端 Bottom-sheet、瀑布流進場 (`.stagger-item`)、AI 思考脈衝點 (`.pulse-dot`)，以及嚴格 `@media (prefers-reduced-motion: reduce)` 無位移、零動畫 WCAG AAA 回退。
- `frontend/src/components/Hero.tsx`：首頁主要區塊平滑揭示進場標籤。
- `frontend/src/pages/public/CertificationsPage.tsx`：證照清單卡片階梯進場 (`.stagger-item`)。
- `frontend/src/pages/public/AICoachPage.tsx`：對話氣泡進場淡入。
- `frontend/src/pages/public/GameCenterPage.tsx`：遊戲卡片添加互動與階梯進場類別。

### 2. CI/CD 工作流程修復 (CI/CD Workflow)
- `.github/workflows/deploy-preview.yml`：
  - 原設定：`npx --prefix frontend tsc --noEmit`（在專案根目錄執行，找不到根目錄 tsconfig 導致退出碼 2）。
  - 修復為：指定 `working-directory: frontend` 並執行 `npx tsc --noEmit`，直接使用 `frontend/tsconfig.json`。

### 3. 正式規劃、安全與驗收文件 (Documentation)
- `docs/planning/DYNAMIC_EXPERIENCE_IMPLEMENTATION_AUDIT.md` (6,968 bytes)
- `docs/planning/DYNAMIC_EXPERIENCE_COMPONENT_INVENTORY.md` (2,623 bytes)
- `docs/planning/DYNAMIC_EXPERIENCE_IMPLEMENTATION_REPORT.md` (3,556 bytes)
- `docs/planning/DYNAMIC_EXPERIENCE_TEST_REPORT.md` (2,424 bytes)
- `docs/security/CODE_TO_KNOW_FIFTH_ROUND_SUPPLEMENTARY_AUDIT.md` (7,931 bytes)
- `docs/development/CODE_TO_KNOW_DYNAMIC_GITHUB_DEPLOYMENT_SYNC_REPORT.md` (本驗收報告)

---

## 三、程式碼品質與自動化驗證結果

### 1. 前端 TypeScript 檢查與生產建置 (Build Verification)
- **命令**：`cd frontend; npx tsc --noEmit`
- **結果**：`EXIT: 0`（完全通過，0 型別錯誤）。
- **命令**：`npm --prefix frontend run build`
- **結果**：`✓ 1643 modules transformed.`，`✓ built in 1.98s`，無警告與錯誤。

### 2. Vitest 單元與整合測試套件 (Test Suite)
- **命令**：`npx --prefix frontend vitest run frontend/tests`
- **結果**：
  - 測試檔案：**20 passed (20)**
  - 測試案例：**187 passed (187)**
  - 測試通過率：**100.0%**

### 3. RWD 154 場景全矩陣無溢位驗證 (RWD Matrix Audit)
- **命令**：啟動 `npm --prefix frontend run preview -- --port 5173`，執行 `node tmp/verify-154-matrix.mjs`
- **驗證矩陣**：14 個核心路由 × 11 種螢幕解析度（320px 至 1920px）= 154 場景
- **結果**：
  - `Total Scenarios Executed: 154`
  - `Passed Scenarios: 154`
  - `Failed Scenarios: 0`
  - **100% 通過，全場景 horizontal overflow = 0px**。

---

## 四、部署環境與一致性檢查報告

| 部署目標 | 設定檔路徑 | 原始碼分支 | 建置指令 | 目標環境與狀態 | 一致性確認 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **GitHub Pages (正式展示環境)** | `.github/workflows/deploy-pages.yml` | `main` | `npm run build` (帶 `VITE_BASE_PATH=/CODE-TO-KNOW/`, `VITE_DEMO_MODE=true`) | 公開網址 `https://leonjay990414.github.io/CODE-TO-KNOW/` | **一致** (使用相同前端程式碼) |
| **Preview Workflow (預覽隔離)** | `.github/workflows/deploy-preview.yml` | `main` | `npm run build:demo` | 外部儲存庫 `Leonjay990414/CODE-TO-KNOW-PREVIEW` | **受阻 (BLOCKED)**：該外部儲存庫為 404 或未授權，保留原定義並回報 |
| **Vercel / Render / Fly.io / Netlify** | 經全專案盤點無設定檔 | N/A | N/A | **未設定**：本專案未配置第三方雲端部署設定 | **無衝突** |

> [!NOTE]
> 專案內已嚴格執行機密掃描與防洩漏過濾，無任何 `.env`、資料庫連線字串或 Supabase 密鑰暴露於前端產物中。

---

## 五、部署驗收狀態清單 (Formal Deployment Matrix)

- `PUSHED`：**SUCCESS**（已顯式指定路徑加入並推送至 GitHub `main`）
- `WORKFLOW_TRIGGERED`：**TRIGGERED**（`Deploy Frontend Preview to GitHub Pages` 與 `Deploy Preview to GitHub Pages` 已於 GitHub Actions 觸發）
- `BUILD_PASSED`：**PASSED**（本機與 CI 建置指令 `tsc && vite build` 均以 Exit 0 成功建置）
- `DEPLOY_SUCCEEDED`：**VERIFIED**（GitHub Pages 部署環境驗證通過）
- `PUBLIC_SITE_VERIFIED`：**VERIFIED**（GitHub Pages 公開站點回應 HTTP 200 OK，包含最新靜態資產）
- `SERVER_SHA_MATCHED`：**MATCHED**（GitHub 遠端 HEAD SHA 與本機提交 SHA 完全一致）

---

## 六、待解問題與系統約束狀態

1. **AUTH-03 狀態**：
   - 維持 **BLOCKED**（正式 Supabase 整合未解鎖，資料庫隔離機制已就緒）。
2. **背景任務 `task-13717` 狀態**：
   - 狀態：**RUNNING**（`node tmp/browser-e2e-suite.mjs`，自 13:11:01 UTC 持續平穩運行，未受任何干擾）。
3. **Preview Workflow 外部儲存庫**：
   - `Leonjay990414/CODE-TO-KNOW-PREVIEW` 在 GitHub API 上回傳 404 Not Found。雖然已修正 TypeScript 步驟的工作目錄錯誤，但該外部部署步驟仍可能因權限或儲存庫不存在而阻擋，遵循規範不自行更改目標儲存庫，維持原狀供管理員評估。
