# CODE TO KNOW (碼上學) 軟體供應鏈與部署設定安全稽核

> **報告類型**: 供應鏈安全、依賴清單 (SBOM/SCA) 與 CI/CD 管道稽核  
> **稽核目標**: `frontend/`、`backend/`、`.github/workflows/`、`.gitignore`  
> **評估工具**: `reverse-skill` (v1.0.1) — `skills/supply-chain-security`  
> **基準規約**: SLSA (Supply-chain Levels for Software Artifacts), OWASP Dependency-Check  

---

## 1. 軟體依賴組成分析 (Software Composition Analysis - SCA)

### 1.1 前端依賴清單 (`frontend/package.json`)
- **生產依賴 (Production Dependencies)**: 7 個
  - `react`: `^18.3.1`
  - `react-dom`: `^18.3.1`
  - `lucide-react`: `^1.16.0`
  - `canvas-confetti`: `^1.9.4`
  - `@types/canvas-confetti`: `^1.9.0`
- **開發依賴 (Dev Dependencies)**: 111 個
  - `vite`: `^5.4.10`
  - `typescript`: `~5.6.2`
  - `@vitejs/plugin-react`: `^4.3.3`
  - `vitest`: `^5.1.0`
- **已知漏洞掃描結果 (`npm audit`)**:
  - 總漏洞數：2 個 (Moderate: 1, High: 1)。
  - 主要風險項目：
    - `vite` (<=6.4.3): 涉及 Windows 平台下 `launch-editor` 命令參數脫逸與存在性判斷繞過 (GHSA-587h-7wmj-h5pm, GHSA-698v-4r3x-3vcv)。
    - `esbuild` (<=0.24.2): 本機開發伺服器允許同機或特定網域讀取除錯回應 (GHSA-67mh-4wv8-2f99)。
  - **實際生產影響分析**:
    生產環境使用 `npm run build` 輸出為純靜態 HTML/CSS/JS 資源（託管於 GitHub Pages），不執行 `vite dev` 開發伺服器，因此此類漏洞在**正式線上靜態網頁環境中不可被遠端觸發**。

### 1.2 後端依賴清單 (`backend/package.json`)
- **生產依賴 (Production Dependencies)**: 245 個
  - `express`: `^4.21.1`
  - `helmet`: `^8.0.0`
  - `cors`: `^2.8.5`
  - `cookie-parser`: `^1.4.7`
  - `dotenv`: `^16.4.5`
  - `zod`: `^3.23.8`
  - `bcrypt`: `^5.1.1`
  - `argon2`: `^0.41.1`
  - `express-rate-limit`: `^7.4.1`
  - `@prisma/client`: `^5.22.0`
- **開發依賴 (Dev Dependencies)**: 163 個
  - `vitest`: `^2.1.9`
  - `prisma`: `^5.22.0`
  - `typescript`: `^5.6.3`
- **已知漏洞掃描結果 (`npm audit`)**:
  - 總漏洞數：7 個 (Moderate: 3, High: 2, Critical: 2)。
  - 主要風險項目：
    - `tinypool` (<=2.1.1): 透過 Vitest 引入，涉及原型污染可能導致 RCE (GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr) — **評級 Critical**。
    - `vitest` (<3.2.6): UI 伺服器存在路徑遍歷與任意檔案存取 (GHSA-5xrq-8626-4rwp)。
    - `zod` (<4.6.6): 大量集合約束校驗可能引起記憶體耗盡 (GHSA-mrhx-c7xc-m3w5) — **評級 High**。
  - **實際生產影響分析**:
    - `vitest` 與 `tinypool` 為測試用工具，不會打包入生產環境之 Node.js runtime。
    - 後端在正式 Docker 或雲端運行時，僅執行編譯後的 `dist/` 且只安裝 `dependencies` (`npm install --omit=dev`)，因此 `tinypool` 與 `vitest` 不會進入正式容器。
    - `zod` 則屬於生產依賴，建議在後續維護階段進行平滑升級，目前後端已有 `limit: '1mb'` 的 Body 限制可緩和記憶體耗盡風險。

---

## 2. Git 倉庫與機密資訊暴露檢驗

### 2.1 Git 追蹤與歷史紀錄稽核
- **檢驗項目**:
  - 檢查 `.gitignore` 是否涵蓋機密資訊與本機憑證。
  - 檢查是否意外將 `.env`、`.env.local`、`.env.production` 提交至 Git。
- **檢驗結果**:
  1. `.gitignore` 正確排除了：
     - `node_modules/`, `dist/`, `build/`
     - `.env`, `.env.*`, 但保留範本 `!.env.example`
     - `*.log`, `.vscode/`, `.kagent/`
  2. 執行 `git ls-files | grep .env`，結果確認 Git 僅追蹤範本檔：
     - `.env.example`
     - `backend/.env.example`
     - `frontend/.env.example`
     - 本機具備密碼與金鑰的實體 `.env` 與 `backend/.env` 均處於未追蹤狀態（Untracked），未被提交。
  3. 透過 `git log -S` 搜尋本機 PostgreSQL 密碼字串，確認 Git 歷程中**無任何密碼洩漏紀錄**。

### 2.2 範本檔安全性 (`.env.example`)
- `.env.example` 僅提供占位符與註解（如 `your_random_session_secret_min_32_characters_long`、`DATABASE_URL=postgresql://user:password@localhost:5432/...`）。
- 無任何真實雲端服務憑證或第三方 API Key。

---

## 3. 建置與 CI/CD 管道安全審計

### 3.1 GitHub Pages 部署流程 (`.github/workflows/deploy-pages.yml`)
- **觸發條件**: 僅限 `push` 至 `main` 分支或手動 `workflow_dispatch`。
- **權限最小化**:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
  - 未授權多餘的管理員或寫入權限。
- **內建機密安全掃描門禁 (Security Gate)**:
  在打包前端部署至 GitHub Pages 前，工作流包含強制性的 Grep 檢測：
  ```yaml
  - name: Scan build output for accidental secrets
    run: |
      if grep -rnE "postgresql://|postgres://|-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|BACKUP_ENCRYPTION_KEY|SESSION_SECRET|JWT_SECRET|ypibmyfxfhsyfdwxprpi" frontend/dist; then
        echo "ERROR: Potential secret or production credential detected in frontend/dist!"
        exit 1
      fi
  ```
  若構建產物意外夾帶任何資料庫連線字串或私鑰，CI 將立即中止並拒絕部署。

### 3.2 Source Map 與除錯資訊防護
- 檢查 `frontend/vite.config.ts`：
  - 預設生產建置關閉獨立 Source Map，避免暴露內部未混淆原始碼結構。
  - 主入口採用 Rollup Chunk 分離 (`vendor-react`, `vendor-icons`, `theory-data`)，降低單一檔案體積並優化載入。

---

## 4. 供應鏈安全總結與建議

1. **依賴隔離良好**: 生產環境與開發依賴有清晰的界線，前端打包為純靜態網站，後端運行不夾帶 DevDependencies。
2. **防外洩機制成熟**: CI/CD 具備自動化 Secret Grep 阻斷防護。
3. **建議行動**: 排程針對後端 `zod` 以及開發測試工具 `vitest` 進行版本平滑升級，以消除 `npm audit` 之警示。
