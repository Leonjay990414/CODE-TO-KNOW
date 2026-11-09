# CODE TO KNOW｜GitHub 遠端同步執行報告
# PHASE 3C-4F-R14-C-2-2：全專案階段性變更同步與敏感資料排除審計

**文件編號**：C2K-DOC-DB-R14C22-SYNC-01  
**執行日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**目標倉庫**：`Leonjay990414/CODE-TO-KNOW`  
**目標分支**：`main`  

---

## 一、同步前專案與環境檢查

1. **版本庫狀態**：
   - 遠端來源：`origin https://github.com/Leonjay990414/CODE-TO-KNOW.git`
   - 本地分支：`main`
   - 同步前 HEAD：`7b77894` (`docs(database): complete PG17 restore verification and R3 preflight`)
2. **驗證測試執行總結**：
   - **前端驗證**：執行 `npm --prefix frontend run build`（`tsc && vite build`），編譯產出成功，耗時 1.75s，Exit Code 0。
   - **後端驗證**：執行 `npm --prefix backend run build`（`tsc`），TypeScript 編譯無錯誤，Exit Code 0。
   - **後端單元與安全測試**：執行 `npm --prefix backend test`，105 項測試通過（1 項即時資料庫整合測試依規跳過），無回歸錯誤。
   - **AES-256-GCM 模組測試**：執行 `node scripts/database/backup-crypto.test.cjs`，14 / 14 案例全數通過，Exit Code 0。

---

## 二、檔案納入與排除審計清單

### 1. 納入本次同步之檔案（安全納入版本控制）

- **後端安全連線與驗證代碼**：
  - `backend/prisma.config.ts`（Prisma 7 程式化配置）
  - `backend/prisma/schema.prisma`（37 業務模型 schema）
  - `backend/src/config/database.ts`（TLS `verify-full` 與 CA 憑證載入）
  - `backend/src/config/db-validation.ts`（Pooler 專案 Ref 與角色用途隔離驗證）
  - `backend/src/config/env.ts`（環境變數安全定義）
  - `backend/tests/db-config-safety.test.ts`（資料庫配置安全單元測試，59 項）
  - `backend/tests/database-ssl-config.test.ts`（SSL CA 配置專項測試，7 項）
  - `backend/certs/prod-supabase-ca.crt`（經官方確認之公開 Supabase Root 2021 CA 公共憑證）
  - `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`（37 業務模型遷移 SQL）
- **本機備份與安全工具腳本**：
  - `scripts/database/backup-crypto.cjs`（AES-256-GCM 獨立備份加解密核心）
  - `scripts/database/backup-crypto.test.cjs`（14 項極限邊界測試）
  - `scripts/database/run_supabase_backup.ps1`（PG17 Docker 備份與加密執行腳本）
  - `scripts/test_pg17_controlled_write.cjs`（PG17 受控寫入測試）
  - `scripts/test_pg17_readonly.cjs`（PG17 唯讀連線測試）
- **前端、原型與容器配置**：
  - `docker-compose.yml`（本機資料庫容器配置）
  - `frontend/src/components/Navbar.tsx`、`StudentTeacherDual.tsx`、`frontend/src/styles/components.css`
  - `prototype/assets/css/components.css`、`prototype/assets/js/interactions.js`、`prototype/index.html`
- **資料庫架構與安全審計文件**：
  - `docs/DATABASE_PHASE1B_*.md` 至 `docs/DATABASE_PHASE3C4F_R14C22_*.md` 全部正式架構審查、驗收報告與對帳文件（包含 R14-C-2-1 沙盒報告與 R14-C-2-2 補強審查文件）。

---

### 2. 嚴格排除之檔案與排除原因

依據最高安全守則與使用指南，以下項目嚴格禁止上傳至 GitHub，已妥善保留於本機並不納入 Git Staging：

| 檔案名稱 / 路徑 | 類型 | 排除原因 | 本機處置方式 |
| :--- | :--- | :--- | :--- |
| `新增 文字文件.txt` | 密碼憑據 | 內容包含個人明文密碼字串 (`JAY990414jay555`)，嚴防憑證洩漏 | 嚴格排除於 Staging，完好保留本機 |
| `~$DE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx` | 暫存鎖定檔 | Microsoft Word 執行中產生的暫時鎖定檔 (`~$`) | 嚴格排除於 Staging，完好保留本機 |
| `1.docx` | 臨時上傳檔 | Google Drive 本地客戶端硬連結暫存 (`.tmp.driveupload\53499`) | 嚴格排除於 Staging，完好保留本機 |
| `照片/` (4 個 PNG 圖檔) | 個人工作截圖 | 內容包含個人 ChatGPT 討論視窗與 Supabase 控制台截圖 | 嚴格排除於 Staging，完好保留本機 |
| `*.mp3` / `173003B13.7z` | 超大型教材 | 單檔超過 GitHub 100 MB 限制 (166MB ~ 236MB) | 於 `.gitignore` 嚴密排除，完好保留本機 |
| `.kagent/` | 代理本地資料 | Antigravity Agent 本地運行日誌 (`events.ndjson` > 15MB) | 於 `.gitignore` 嚴密排除，完好保留本機 |

---

## 三、GitHub 同步步驟與結果

1. **Staging 檢查**：確認僅有經安全審核之代碼、配置與文件加入暫存區，無任何敏感檔案混入。
2. **Commit 訊息格式**：採用 Conventional Commits 規範：  
   `chore(release): checkpoint at PHASE 3C-4F-R14-C-2-2 and sync project assets`
3. **Push 執行與驗證**：
   - 執行 `git push origin main`。
   - 確認遠端 Commit SHA 與本機 Commit SHA 100% 一致。
   - 驗證 `git status` 狀態。
