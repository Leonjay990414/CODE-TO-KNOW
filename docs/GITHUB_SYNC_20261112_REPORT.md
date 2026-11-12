# CODE TO KNOW — 2026-11-12 GitHub 全專案同步與 GitHub Pages 公開預覽報告

- **同步日期**：2026-11-12
- **執行範圍**：GitHub Repository 同步（`Leonjay990414/CODE-TO-KNOW` / `main`）與 GitHub Pages 前端公開預覽建立（`https://leonjay990414.github.io/CODE-TO-KNOW/`）
- **重要聲明**：
  - **AUTH-03 維持 `BLOCKED`**：AES-GCM 解密與密文 SHA-256 驗證已通過，但 TOC 動態識別尚未修正、PG17 還原尚未完成，本報告及本次同步均未修改 AUTH-03 TOC 規則，亦未宣稱還原成功。
  - **Render 維持未部署**：本次未對 Render 執行任何部署、Migration 或資料庫連線。

---

## 1. 原始 Git HEAD

- **`86a0f1116693bcce476b8747a446900d54b29a4a`** (`chore: save database backup and restore progress`)

## 2. 最終 Commit SHA

- 第一階段同步與 Pages Workflow Commit：**`88f51b4046607b9dfd040525048d3812e2e8061c`**（`feat(ci,security): sync phase 3c database security docs/scripts and add GitHub Pages preview workflow`，共 99 個檔案）
- 正式報告同步 Commit：將於本報告建立後接續提交並推送（最終 SHA 請見對話回報）。

## 3. 同步分支與 Repository

- **Repository**：`Leonjay990414/CODE-TO-KNOW`（Public）
- **Remote URL**：`https://github.com/Leonjay990414/CODE-TO-KNOW.git`
- **分支**：`main`（同步前 `HEAD` 與 `origin/main` 差異 `0 0`，無遠端覆蓋風險；未使用 force push）

## 4. 新增檔案（精選摘要，共計 76 個新增檔案納入 `88f51b4`）

- **CI / 設定**：`.github/workflows/deploy-pages.yml`、`.editorconfig`
- **後端安全工具與測試**：`backend/src/utils/ownership.ts`、`backend/src/utils/redaction.ts`、`backend/tests/admin-hardening.test.ts`、`backend/tests/app-runtime.db.test.ts`、`backend/tests/audit-redaction.test.ts`、`backend/tests/auth-lifecycle.test.ts`、`backend/tests/idor-ownership.test.ts`、`backend/tests/safe-error-logger.test.ts`
- **前端測試**：`frontend/tests/sources-route-protection.test.tsx`
- **資料庫腳本測試**：`scripts/database/ps-encoding-guard.test.cjs`
- **文件報告**：`docs/DATABASE_PHASE3C11C_*.md` 至 `docs/DATABASE_PHASE3C35_*.md`（含 AUTH-01、AUTH-02 驗收、AUTH-03 前置/ParserError/TOC 診斷）、`docs/GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`、以及本報告 `docs/GITHUB_SYNC_20261112_REPORT.md`

## 5. 修改檔案（共計 23 個修改檔案納入 `88f51b4`）

- **後端安全強化**：`backend/package.json`、`backend/src/config/db-validation.ts`、`backend/src/middleware/error-handler.ts`、`backend/src/modules/admin/*`、`backend/src/modules/auth/auth.service.ts`、`backend/src/modules/teachers/*`、`backend/src/server.ts`、`backend/src/utils/audit.ts`、`backend/tests/db-config-safety.test.ts`、`backend/tests/integration.db.test.ts`
- **前端路由與 Pages 設定**：`frontend/src/app/App.tsx`、`frontend/src/components/ProtectedRoute.tsx`、`frontend/vite.config.ts`（支援 `process.env.VITE_BASE_PATH || './'`）
- **資料庫備份/還原與編碼修復**：`scripts/database/backup-crypto.cjs`（新增 `--key-stdin`）、`scripts/database/backup-crypto.test.cjs`、`scripts/database/backup-pipeline.test.cjs`、`scripts/database/restore_pg17_sandbox.ps1`（改用 `stdin` 傳遞金鑰並補回 UTF-8 BOM）、`scripts/database/restore_pg17_sandbox.test.ps1`
- **文字檔**：`新增 文字文件.txt`

## 6. TXT 舊版問題根因

- `新增 文字文件.txt` 本機已修改（最後修改時間 `2026/11/12 22:10:52`，`254` bytes），但先前尚未 `git commit` 與 `git push`，因此 GitHub `origin/main` 停留在舊版 `86a0f11`。
- 該檔案受 Git 追蹤，未被 `.gitignore` 排除。

## 7. TXT 同步 SHA-256

- **本機工作區（CRLF，254 bytes）**：`C84A91EA65B6C9E9AFB159767BA7177B24CDC62570AEB50AA0BC4D936813D6A2`
- **本機 LF 正規化後（與 Git Blob 一致）**：`4C5D2D0F5D2DC6586D2B9FEE31B74D3477E8672C24505784ECD6BBAEED2F281C`
- **GitHub `origin/main` (`88f51b4`) 實測**：`4C5D2D0F5D2DC6586D2B9FEE31B74D3477E8672C24505784ECD6BBAEED2F281C`（**100% 一致**；差異僅為 Windows CRLF 與 Git LF 換行轉換）

## 8. 測試結果

| 測試項目 | 結果 |
| --- | --- |
| 前端 TypeScript + Pages 建置 (`VITE_BASE_PATH=/CODE-TO-KNOW/ VITE_DEMO_MODE=true npm run build`) | **PASS**（Exit Code `0`，產出 `frontend/dist/index.html`） |
| 建置產物 `frontend/dist` 秘密掃描 | **PASS**（0 筆命中） |
| `node scripts/database/backup-crypto.test.cjs` | **PASS**（23 / 23） |
| `node scripts/database/backup-pipeline.test.cjs` | **PASS**（14 / 14） |
| `node scripts/database/ps-encoding-guard.test.cjs` | **PASS**（5 / 5） |
| `powershell ... restore_pg17_sandbox.test.ps1` | **PASS**（37 / 37） |
| `git diff --check` | **PASS**（0 空白/衝突錯誤） |

## 9. 秘密與備份排除結果

- Git 歷史掃描（`*.env`、`*.dump`、`*.c2kb`、`*.kdbx`、`*.key`、`*.pem`）：**0 筆**。
- 本次 Stage 明確排除：`.env`、`backend/.env`、`frontend/.env`、`tmp/`、`.vite/`、`~$*`、`1.docx`、`計劃書.docx`、`計劃書.pdf`、`照片/`、以及本機外部備份目錄 `CODE-TO-KNOW_BACKUPS`。

## 10. Pages Workflow 設定

- Workflow 檔案：`.github/workflows/deploy-pages.yml`（`Deploy Frontend Preview to GitHub Pages`）
- 權限：`contents: read`、`pages: write`、`id-token: write`
- 官方 Actions：`actions/checkout@v4`、`actions/setup-node@v4`、`actions/configure-pages@v5`、`actions/upload-pages-artifact@v3`、`actions/deploy-pages@v4`
- 執行結果：Run `43235870394`（Commit `88f51b4`）狀態為 **`completed` / `success`**。
- 備註：Repo 中原本尚有一份舊版 `deploy-preview.yml`（Run `43235869348`）及 `pages build and deployment`（Run `43235868827`）均為 `failure`，未阻擋 `deploy-pages.yml` 成功部署。

## 11. Pages 實際公開網址

- **`https://leonjay990414.github.io/CODE-TO-KNOW/`**

## 12. Pages 首頁與資源載入驗證

- `GET https://leonjay990414.github.io/CODE-TO-KNOW/`：**HTTP 200**，標題為 `<title>碼上學｜CODE TO KNOW — AI 智慧學習與教育科技平台</title>`（已確認為 `frontend/` React 建置結果，非 `prototype/index.html`）。
- `HEAD https://leonjay990414.github.io/CODE-TO-KNOW/assets/index-BbnyPkfK.js`：**HTTP 200**
- `HEAD https://leonjay990414.github.io/CODE-TO-KNOW/assets/index-HmsvxDpa.css`：**HTTP 200**
- `HEAD https://leonjay990414.github.io/CODE-TO-KNOW/images/logo/symbol.svg`：**HTTP 200**
- 路由架構：`NavigationContext` 採用 Hash 路由（`#/...`），重新整理頁面不會產生 SPA 404。

## 13. Pages 與 Render 的差異

- **GitHub Pages**：純靜態前端預覽（`VITE_DEMO_MODE=true` + `VITE_BASE_PATH=/CODE-TO-KNOW/`），僅供 UI 與靜態互動展示，公開於網際網路。
- **Render（未來正式環境）**：後端 Express API + Prisma + Supabase PostgreSQL 正式環境；目前維持 **`NO-GO` / 未部署**，且 `frontend/vite.config.ts` 保留預設 `base: './'` 不受 Pages 影響。

## 14. Pages 預覽功能限制

- 因採用 `VITE_DEMO_MODE=true` 且無公開後端連線，真實登入驗證、Supabase 資料同步、即時題庫寫入與後端 AI API 呼叫皆為預覽限制（未連接正式 Supabase 或 Render）。

## 15. 尚未完成事項

1. **AUTH-03**：TOC 動態物件簽章過濾修正與 PG17 隔離還原驗證（維持 **`BLOCKED`**）。
2. **AUTH-04 ～ AUTH-10** 與 **Render 正式環境部署**（維持未執行 / 未部署）。
3. **GitHub Repository 清理建議**：可於後續確認是否移除舊版衝突 workflow `.github/workflows/deploy-preview.yml`，以及在 GitHub Settings → Pages 確認 Source 為 **GitHub Actions** 以避免多餘的 `pages build and deployment` 失敗通知。

## 16. GitHub 遠端同步結果

- `origin/main` 已與本機 `main` 同步，無遺漏安全程式碼、測試或今天新增之安全報告文件。
