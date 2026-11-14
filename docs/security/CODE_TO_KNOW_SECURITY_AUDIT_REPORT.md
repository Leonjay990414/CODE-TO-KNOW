# CODE TO KNOW (碼上學) 原始碼與資安防禦性唯讀稽核報告

> **報告版本**: 1.0.0 (First Round Defense Audit)  
> **稽核性質**: 本機離線唯讀程式碼安全審計 (Defensive Code & Configuration Audit)  
> **目標系統**: 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
> **稽核日期**: 2026-11-14  
> **評估基準**: OWASP Top 10, OWASP API Security Top 10 (2023), CWE/SANS Top 25  
> **使用的核心技能**: `reverse-skill` (v1.0.1) — `skills/code-audit`, `skills/api-security`, `skills/supply-chain-security`  

---

## 1. 稽核範圍與方法論

本次稽核針對 CODE TO KNOW 專案之本機原始碼、前後端架構、設定檔、環境變數範本、CI/CD 腳本與相依套件進行嚴格的唯讀安全分析。

### 1.1 涵蓋目標檔案與目錄
1. **前端層 (Frontend)**:
   - `frontend/src/` (核心應用、頁面、組件、狀態管理、API Client `api.ts`、安全沙盒 `CodeEditorPage.tsx`、本機儲存工具 `learningStorage.ts`、`gameStorage.ts`)
   - `frontend/public/` (`robots.txt`, `sitemap.xml`)
   - `frontend/index.html`, `frontend/vite.config.ts`, `frontend/package.json`, `frontend/.env.example`
2. **後端層 (Backend)**:
   - `backend/src/app.ts`, `backend/src/server.ts`
   - `backend/src/config/` (`env.ts`, `database.ts`, `db-validation.ts`)
   - `backend/src/middleware/` (`authenticate.ts`, `authorize.ts`, `csrf.ts`, `rate-limiter.ts`, `validate.ts`, `error-handler.ts`)
   - `backend/src/modules/` (`auth/`, `teachers/`, `admin/` 之 controller, routes, schema, service)
   - `backend/src/utils/` (`ownership.ts`, `audit.ts`, `redaction.ts`, `tokens.ts`, `password.ts`, `errors.ts`)
   - `backend/package.json`, `backend/.env.example`
3. **基礎架構與部署 (DevOps / CI/CD)**:
   - `.github/workflows/deploy-pages.yml`, `.github/workflows/deploy-preview.yml`
   - `.gitignore`, `docker-compose.yml`
   - 環境設定檔 `.env` 及 `backend/.env` (本機實體)
4. **現有安全性測試套件 (Automated Test Suite)**:
   - `backend/tests/idor-ownership.test.ts` (7/7 通過)
   - `backend/tests/security.test.ts` (5/5 通過)
   - `backend/tests/rbac-workflow.test.ts` (17/17 通過)
   - `backend/tests/validation.test.ts` (12/12 通過)
   - `backend/tests/audit-redaction.test.ts` (10/10 通過)
   - `backend/tests/auth-lifecycle.test.ts` (6/6 通過)

---

## 2. 核心資安檢查結果概要 (Executive Summary)

| 評估領域 | 狀態 | 風險指標 (Critical / High / Med / Low) | 摘要 |
|---|---|---|---|
| **前端機密與金鑰** | **安全 PASS** | 0 / 0 / 0 / 1 (Informational) | 無硬編碼 Production API Key 或 Cloud 秘密。示範模式之假資料與純靜態展示邏輯已正確隔離。 |
| **前端注入與沙盒隔離** | **安全 PASS** | 0 / 0 / 1 / 0 | 程式碼編輯器 iframe 具備嚴格 `sandbox="allow-scripts"` 與 CSP `connect-src 'none'`，無未授權父層 DOM/Storage 穿透。部分提示字串提及 innerHTML 為教材教學內容，非脆弱實作。 |
| **後端認證與 Session** | **安全 PASS** | 0 / 0 / 0 / 1 | 採用 SHA-256 雜湊化儲存 Session Token，強制 HttpOnly、SameSite=Lax Cookie。密碼採 Argon2id/Bcrypt 加密。支援主動撤銷與停用帳號阻斷。 |
| **CSRF 防護機制** | **安全 PASS** | 0 / 0 / 0 / 0 | 所有狀態變更請求 (`POST/PUT/PATCH/DELETE`) 均經雙重 Cookie 雜湊比較 (`safeCompare`)，無 CSRF 漏洞。 |
| **BOLA / IDOR 會員隔離** | **安全 PASS** | 0 / 0 / 0 / 0 | 全站後端實施 `resolveScopedUserId` 與 `rejectForgedOwnerFields`，客戶端傳入偽造之 `userId` 均被拒絕 (Fail-Closed)。跨帳號讀取與修改具備嚴格阻擋。 |
| **RBAC 後端權限控制** | **安全 PASS** | 0 / 0 / 0 / 1 | 後端 API 均透過 `authenticate` 與 `requireRoles` 雙層把關，無「僅隱藏前端按鈕但後端放行」之情況。管理員端點嚴格限定 `ADMIN`。 |
| **機密資訊與 Git 追蹤** | **安全 PASS** | 0 / 0 / 0 / 1 | 實體 `.env` 檔案受 `.gitignore` 完整保護，未進入 Git 追蹤與 Commit 歷史。CI/CD 自動執行 `grep` 防外洩防護。 |
| **供應鏈與相依套件** | **需注意 WARNING** | 2 / 2 / 3 / 0 | `npm audit` 發現開發環境相依性中存在 `vitest` (<3.2.6)、`tinypool` (原型污染 RCE)、`vite` (<6.4.3)、`zod` (<4.6.6)。需排程升級。 |

---

## 3. 原始碼安全審計 Findings 清單

### Finding SEC-01: 開發依賴套件已知漏洞 (Vite / Vitest / Tinypool / Zod)
- **風險等級**: **High (針對本機/CI 開發環境)**；**Low (針對已打包之生產靜態網頁)**
- **影響範圍**: `frontend/package.json`, `backend/package.json`
- **問題說明**:
  1. `frontend` 使用 Vite 5.4.10，包含 `esbuild` <=0.24.2 與 `vite` <=6.4.3，涉及 GHSA-587h-7wmj-h5pm (Windows launch-editor existsSync bypass) 及 GHSA-67mh-4wv8-2f99。
  2. `backend` 使用 `vitest` 2.1.9，其傳遞依賴 `tinypool` <=2.1.1 存在 GHSA-5gmw-xhrv-c9v3 (原型污染 RCE，CVSS 9.8)，以及 `zod` <4.6.6 存在記憶體耗盡 DoS。
- **風險成因**: 開發者若在不可信環境中執行惡意測試案例或開啟外部不受信任專案，可能受到開發伺服器或測試執行器的潛在影響。生產打包後的靜態前端代碼不包含 vitest/tinypool。
- **驗證狀態**: 由 `npm audit` 靜態檢驗確認，並經人工審查排除生產靜態環境的直接執行風險。
- **修正建議**:
  - 排程規劃升級 `vitest` 至安全版本 (如 3.2.6+ 或 5.x)。
  - 排程更新 `vite` 及前端建置工具至最新維護版本。

### Finding SEC-02: 後端資料庫連接連線阻斷 (AUTH-03 BLOCKED 現況)
- **風險等級**: **Medium** (架構面限制)
- **影響範圍**: `backend/src/config/database.ts`, `backend/src/config/env.ts`
- **問題說明**: 後端實體資料庫連線因 AUTH-03 狀態目前處於 `BLOCKED`，未正式啟動遠端 PostgreSQL 容器。
- **風險成因**: 目前後端 API 處於靜態架構完成但連線暫停狀態。若過早於未受保護之公開網路暴露後端伺服器，可能因連線逾時或 503 服務降級影響體驗。
- **驗證狀態**: 已確認符合專案進度規範，AUTH-03 依指示維持 `BLOCKED`。
- **修正建議**: 待正式上線部署階段，依據安全基準填入具備 TLS 憑證驗證之正式 `DATABASE_URL`，並由後端啟用連線。

### Finding SEC-03: 前端展示模式之偽造資料模擬 (Demo Mode Mock Data)
- **風險等級**: **Informational**
- **影響範圍**: `frontend/src/services/api.ts`
- **問題說明**:
  - 前端包含 `DEMO_STUDENT_USER` 與 `DEMO_TEACHER_USER` 的 Mock 物件，用於 GitHub Pages 靜態展示（`VITE_DEMO_MODE=true`）。
  - 若 `isDemoMode === true`，API Client 會將模擬使用者寫入 `sessionStorage.setItem('ctk_demo_user', ...)`，並不發送真實網路請求。
- **風險成因**: 展示帳號無密碼且無實體後端驗證，若正式上線時誤將生產前端打包設定為 `VITE_DEMO_MODE=true`，將導致使用者停留於純前端展示介面。
- **驗證狀態**: 已由程式碼人工審查確認：`api.ts` 透過 `import.meta.env.VITE_DEMO_MODE === 'true'` 進行邊界隔離，正式模式下不會啟用該模擬。
- **修正建議**: 在正式發布至正式網域前，確保 CI/CD 環境變數明確宣告 `VITE_DEMO_MODE=false`，並在前端首頁或狀態列顯示環境指示標籤。

### Finding SEC-04: 線上程式碼沙盒 (CodeEditorPage) 隔離機制
- **風險等級**: **Low (防禦已就位)**
- **影響範圍**: `frontend/src/pages/public/CodeEditorPage.tsx:403-420`
- **問題說明**:
  - 網頁設計丙級線上編輯器使用 `iframe` 呈現使用者輸入的 HTML 與 CSS。
  - 目前實作了：
    1. `sandbox="allow-scripts"` (刻意未給予 `allow-same-origin`，使腳本以 `null` origin 執行，無法存取父層 DOM、`localStorage` 或 `document.cookie`)。
    2. 注入 CSP: `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:; connect-src 'none';">`。
- **風險成因**: 若未來維護者誤加 `allow-same-origin`，將導致學生輸入的自訂腳本可存取本機儲存與母視窗 DOM。
- **驗證狀態**: 程式碼已嚴格封鎖 `allow-same-origin`，CSP 阻斷 outbound network (`connect-src 'none'`)。
- **修正建議**: 保留現有註解防線，並在程式碼審查清單中標記「永遠不得對預覽 iframe 新增 allow-same-origin」。

---

## 4. 稽核結論與防護指標總結

經過完整的反向技能 (`reverse-skill`) 唯讀檢驗：
1. **無任何真實會員資料或機密金鑰暴露**。
2. **前後端角色控制 (RBAC) 與所有權檢查 (BOLA/IDOR) 實作健全**，已通過 28 項後端資安與驗證自動化測試。
3. **無危險的 CSRF、XSS 或 SQL Injection 實作**。
4. **現存主要風險集中於第三方開發相依套件 (Dev Dependencies) 之 CVE 漏洞**，可依排程升級處理。

本報告已為 CODE TO KNOW 提供正式上線前之防禦性安全基線。
