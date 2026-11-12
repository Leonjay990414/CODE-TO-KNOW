# CODE TO KNOW｜階段暫停與 GitHub 備份報告

**備份日期**：2026-11-10  
**執行狀態**：**成功完成 (SUCCESS)**  
**操作目標**：暫停所有資料庫開發工作，將目前已完成且應保存的專案變更（涵蓋 Phase 3-C-1 至 Phase 3-C-11B 備份加密與還原工具、測試套件、安全性稽核報告及前端預覽展示更新）完整且安全地上傳至 GitHub 遠端儲存庫。

---

## 一、Git 提交與推送成果核對

| 項目 | 詳細資訊 |
|---|---|
| **Commit Hash** | `86a0f1116693bcce476b8747a446900d54b29a4a` (短碼: `86a0f11`) |
| **Commit Message** | `chore: save database backup and restore progress` |
| **推送目標分支** | `main` -> `origin/main` |
| **遠端同步狀態** | **100% 同步** (`local HEAD == origin/main`) |
| **變更統計** | 45 個檔案變更，新增 7,988 行 (+)，刪除 174 行 (-) |

---

## 二、本次上傳之專案檔案清單（共 45 檔）

### 1. 核心自動化腳本與測試套件（5 檔）
- `scripts/database/backup-pipeline.cjs`（串流加密、雜湊校驗、C2KB 容器封裝、解密迴環驗證）
- `scripts/database/backup-pipeline.test.cjs`（14 項離線加密管線回歸測試）
- `scripts/database/restore_pg17_sandbox.ps1`（具備 FIX-01~06 嚴格錯誤攔截與環境變數生命週期保護之 PG17 還原腳本）
- `scripts/database/restore_pg17_sandbox.test.ps1`（18 項離線還原安全整合測試）
- `scripts/database/run_supabase_backup.ps1`（增強型受控備份與加密管線串接腳本）

### 2. CI/CD 工作流程與前端展示更新（11 檔）
- `.github/workflows/deploy-preview.yml`（GitHub Pages 自動化靜態展示部署工作流）
- `frontend/index.html`（修正相對路徑資源引導）
- `frontend/package.json`（新增 `build:demo` 腳本）
- `frontend/vite.config.ts`（配置 base 為 `./`）
- `frontend/src/vite-env.d.ts`（宣告 `VITE_DEMO_MODE` 環境型別）
- `frontend/src/context/AuthContext.tsx`（展示模式登入/登出狀態管理）
- `frontend/src/services/api.ts`（展示模式本機 SessionStorage 模擬 API）
- `frontend/src/components/AuthModal.tsx`（展示模式快速角色體驗切換）
- `frontend/src/components/Navbar.tsx`（導航列展示模式橫幅提示）
- `frontend/src/components/ProtectedRoute.tsx`（路由守衛展示支援）
- `frontend/src/components/TeacherApplyModal.tsx`（教育者申請展示支援）

### 3. 資料庫安全審查與驗收文件（29 檔）
- `docs/DATABASE_PHASE3A_KEEPASSXC_ENVIRONMENT_CHECK.md`
- `docs/DATABASE_PHASE3C1_LOCAL_BACKUP_ENCRYPTION_INTEGRATION.md`
- `docs/DATABASE_PHASE3C2_BACKUP_PIPELINE_SECURITY_AUDIT.md`
- `docs/DATABASE_PHASE3C3_BACKUP_PIPELINE_SECURITY_FIX.md`
- `docs/DATABASE_PHASE3C4_BACKUP_PIPELINE_FINAL_SECURITY_AUDIT.md`
- `docs/DATABASE_PHASE3C5_BACKUP_PIPELINE_FINAL_FIX.md`
- `docs/DATABASE_PHASE3C6_FORMAL_SUPABASE_BACKUP_PREFLIGHT.md`
- `docs/DATABASE_PHASE3C7_AES_KEY_INPUT_DIAGNOSTIC.md`
- `docs/DATABASE_PHASE3C8_EXISTING_DUMP_ENCRYPTION_READINESS.md`
- `docs/DATABASE_PHASE3C9_PG17_RESTORE_PREFLIGHT.md`
- `docs/DATABASE_PHASE3C10_C2KB_PG17_RESTORE_ACCEPTANCE.md`
- `docs/DATABASE_PHASE3C10A_RESTORE_SCRIPT_SAFETY_REVIEW.md`
- `docs/DATABASE_PHASE3C10B_RESTORE_SCRIPT_FINAL_HARDENING.md`
- `docs/DATABASE_PHASE3C10C_INDEPENDENT_RESTORE_AUDIT.md`
- `docs/DATABASE_PHASE3C10D_PG17_RESTORE_ACCEPTANCE.md`
- `docs/DATABASE_PHASE3C11A_RESTORE_ERROR_ANALYSIS.md`
- `docs/DATABASE_PHASE3C11B_CORE_DATA_AND_TOC_VALIDATION.md`
- `docs/DATABASE_PHASE3C_BACKUP_ENCRYPTION_INTEGRATION_READINESS.md`
- `docs/DATABASE_PHASE3C4F_FINAL_COMPLETION_INVENTORY.md`
- `docs/DATABASE_PHASE3C4F_PHASE21_AUDITLOG_SECURITY_AUDIT.md`
- `docs/DATABASE_PHASE3C4F_PHASE21_FINAL_ARCHITECTURE_DECISION.md`
- `docs/DATABASE_PHASE3C4F_PHASE21_PRISMA_DATA_ISOLATION_AUDIT.md`
- `docs/DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md`
- `docs/DATABASE_PHASE3C4F_PHASE2_RLS_FINAL_DESIGN_REVIEW.md`
- `docs/GITHUB_PAGES_PREVIEW_PHASE1_PREFLIGHT.md`
- `docs/GITHUB_PAGES_PREVIEW_PHASE2_IMPLEMENTATION_REPORT.md`
- `docs/GITHUB_PAGES_PREVIEW_PHASE2_TO_PHASE7_FINAL_REPORT.md`
- `docs/GITHUB_PAGES_PREVIEW_PHASE3A_SECURITY_REVIEW.md`
- `docs/GITHUB_PAGES_PREVIEW_SETUP_GUIDE.md`

---

## 三、排除未上傳之檔案與原因說明

| 檔案 / 路徑 | 排除原因 |
|---|---|
| `.env`, `backend/.env`, `frontend/.env*` | **嚴格機敏防護**：本機環境變數與連線密碼，已受 `.gitignore` 隔離保護。 |
| `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\*` | **真實備份隔離**：正式 `.dump` 與 `.c2kb` 實體備份存放於專案外部目錄，嚴禁納入 Git。 |
| `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\*` | **正式金鑰與憑證庫**：KeePassXC `.kdbx` 與 Root CA 實體檔案存放於專案外部目錄。 |
| `1.docx`, `照片/`, `新增 文字文件.txt`, `~$...docx` | **使用者個人私有資料**：非專案程式碼資產，嚴禁觸碰、刪除或上傳。 |
| `tmp/` | 本機暫存快取目錄，不屬於版本控制範圍。 |

---

## 四、安全與防護規範驗證結論

1. **零金鑰外洩**：經由自動化規則與手動抽檢，確認無任何 Supabase 密碼、KeePassXC 主金鑰、JWT Token、私鑰或敏感連線字串被寫入或提交。
2. **零大檔衝突**：所有提交檔案皆為輕量程式碼與 Markdown 文檔，無超過 GitHub 100MB 限制之檔案。
3. **工作區狀態安全**：
   - 本機與 GitHub 遠端完全同步於 `86a0f11`。
   - 使用者私有檔案（照片、個人文件等）100% 完好無缺，未被修改或刪除。
   - 資料庫開發工作已正式安全暫停。
