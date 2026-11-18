# CODE TO KNOW｜GitHub 全面同步與版本發布清冊 (GitHub Sync Manifest)

**文件識別碼**：GITHUB-SYNC-MANIFEST-20261118  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**更新日期**：2026-11-18  
**GitHub 儲存庫**：`Leonjay990414/CODE-TO-KNOW`  
**來源分支**：`develop`  
**目標分支**：`origin/develop` (正式部署分支：`origin/main` 待使用者明確授權合併)  
**當前基準 HEAD Commit**：`502ccbc641c09ab1598fa105f5a6d98cc685dcd8`  
**本次更新性質**：P1/P2 視覺無障礙與路由修復、第五波模組接軌、第 0 波 Master 清冊固化。

---

## 一、本次同步檔案白名單 (Sync Whitelist)

### 1. 已修改檔案 (35 份 Modified Files)
- **文件規範**：
  - `docs/marketing/MARKETING_SOP.md`
- **前端核心與版面組件 (14 份)**：
  - `frontend/src/app/App.tsx`
  - `frontend/src/components/AIScaffoldingDemo.tsx`
  - `frontend/src/components/AuthModal.tsx`
  - `frontend/src/components/FeedbackModal.tsx`
  - `frontend/src/components/Footer.tsx`
  - `frontend/src/components/GameAchievementsModal.tsx`
  - `frontend/src/components/GameBriefingModal.tsx`
  - `frontend/src/components/Hero.tsx`
  - `frontend/src/components/LearningExperience.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/NotificationCenterModal.tsx`
  - `frontend/src/components/StudentClassJoinModal.tsx`
  - `frontend/src/components/StudentTeacherDual.tsx`
  - `frontend/src/components/TeacherApplyModal.tsx`
- **前端上下文與樣式 (2 份)**：
  - `frontend/src/context/NavigationContext.tsx`
  - `frontend/src/styles/tokens.css`
- **前端頁面層 (15 份)**：
  - `frontend/src/pages/public/AICoachPage.tsx`
  - `frontend/src/pages/public/AdminDashboardPage.tsx`
  - `frontend/src/pages/public/CSSDesignerPage.tsx`
  - `frontend/src/pages/public/CodePuzzlePage.tsx`
  - `frontend/src/pages/public/GameCenterPage.tsx`
  - `frontend/src/pages/public/LearningProgressPage.tsx`
  - `frontend/src/pages/public/LegalNoticePage.tsx`
  - `frontend/src/pages/public/PracticalLearningPage.tsx`
  - `frontend/src/pages/public/QuizRushPage.tsx`
  - `frontend/src/pages/public/StudentDashboardPage.tsx`
  - `frontend/src/pages/public/TeacherDashboardPage.tsx`
  - `frontend/src/pages/public/TheoryPracticePage.tsx`
  - `frontend/src/pages/student/practical/PracticalDetailPage.tsx`
  - `frontend/src/pages/student/practical/PracticalHomePage.tsx`
  - `frontend/src/pages/student/practical/index.ts`
- **前端工具引擎 (3 份)**：
  - `frontend/src/utils/gameStorage.ts`
  - `frontend/src/utils/learningStorage.ts`
  - `frontend/src/utils/wrongQuestionsStorage.ts`

### 2. 新增功能與工具檔案 (9 份 New Feature Files)
- `frontend/src/pages/student/practical/StudentPracticalHubPage.tsx` (現代化術科大廳)
- `frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx` (獨立 L5 營運監控頁)
- `frontend/src/utils/adminGameConfigManager.ts` (管理員遊戲全域配置)
- `frontend/src/utils/aiSafetyFilter.ts` (AI 提示詞教育安全過濾)
- `frontend/src/utils/codeLintRuleEngine.ts` (HTML/CSS 語法規則檢查)
- `frontend/src/utils/dailyQuestEngine.ts` (學生每日任務引擎)
- `frontend/src/utils/gameLearningInterlock.ts` (遊戲與教學關卡互鎖)
- `frontend/src/utils/marketingUtils.ts` (SEO 與社群分享輔助)
- `frontend/src/utils/teacherGameTaskManager.ts` (教師班級遊戲作業派發)

### 3. 新增驗證測試檔案 (6 份 New Test Files)
- `frontend/tests/p1-repair-verification.test.tsx`
- `frontend/tests/p2-visual-accessibility-verification.test.tsx`
- `frontend/tests/phase5-p11-ai-safety-lint.test.ts`
- `frontend/tests/phase5-p14-gam-advanced.test.tsx`
- `frontend/tests/phase5-p17-media-brand.test.ts`
- `frontend/tests/phase5-teacher-admin-game-integration.test.tsx`

### 4. 第 0 波 Master 清冊與專案文件 (23 份 Master & Audit Docs)
- `docs/master/MASTER_PROJECT_INVENTORY.md`
- `docs/master/MASTER_FOLDER_FILE_CATALOG.md`
- `docs/master/MASTER_DATABASE_INVENTORY.md`
- `docs/master/MASTER_API_INVENTORY.md`
- `docs/master/MASTER_MCP_RULES_SKILLS_INVENTORY.md`
- `docs/master/MASTER_FEATURE_STATUS_REGISTER.md`
- `docs/master/MASTER_GIT_AND_ENVIRONMENT_STATUS.md`
- `docs/master/MASTER_20_PHASE_REORGANIZATION_PLAN.md`
- `docs/master/MASTER_CROSS_PHASE_DEPENDENCY_MAP.md`
- `docs/master/MASTER_EXISTING_WORK_AND_DUPLICATION_AUDIT.md`
- `docs/FULL_PROJECT_INTEGRATED_AUDIT_REPORT.md`
- `docs/FULL_PROJECT_REMAINING_WORK_REGISTER.md`
- `docs/FULL_PROJECT_REPAIR_CHANGELOG.md`
- `docs/MASTER_20_PHASE_REORGANIZATION_PLAN.md`
- `docs/MASTER_API_INVENTORY.md`
- `docs/MASTER_CROSS_PHASE_DEPENDENCY_MAP.md`
- `docs/MASTER_DATABASE_INVENTORY.md`
- `docs/MASTER_EXISTING_WORK_AND_DUPLICATION_AUDIT.md`
- `docs/MASTER_FEATURE_STATUS_REGISTER.md`
- `docs/MASTER_FOLDER_FILE_CATALOG.md`
- `docs/MASTER_GIT_AND_ENVIRONMENT_STATUS.md`
- `docs/MASTER_MCP_RULES_SKILLS_INVENTORY.md`
- `docs/MASTER_PROJECT_INVENTORY.md`
- `docs/P1_RELEASE_READINESS_REPAIR_REPORT.md`
- `docs/P2_VISUAL_ACCESSIBILITY_AND_P1_RECHECK_REPORT.md`
- `docs/PHASE_5_GAME_MODULE_INTEGRATION_VERIFICATION.md`
- `docs/PHASE_5_IMPLEMENTATION_PLAN.md`
- `docs/PHASE_5_MASTER_EXECUTION_PLAN.md`
- `docs/PHASE_5_REMAINING_UID_EXECUTION_REPORT.md`
- `docs/PHASE_5_UID_TRACEABILITY_MATRIX.md`
- `docs/RELEASE_BLOCKERS_AND_DEPENDENCIES.md`
- `docs/RELEASE_READINESS_CHECKLIST.md`
- `docs/release/GITHUB_SYNC_MANIFEST.md` (本清冊)

---

## 二、排除檔案與排除理由 (Exclusion List)

| 排除標的 | 所在路徑 | 排除理由 |
| :--- | :--- | :--- |
| **本機環境變數與金鑰** | `.env`, `backend/.env` | 含有本機密鑰與環境設定，由 `.gitignore` 強制排除 |
| **大型試題原始封存包** | `173003B13.7z` (91MB), `題組二_五.7z` (23MB) | 原始大檔案壓縮包，為避免 Git 儲存庫急遽膨脹，靜態資源已由解壓目錄提供 |
| **外部多代理人快取目錄** | 根目錄 `.adal/`, `.aider-desk/` 等 50+ 個目錄 | 外部 IDE/工具臨時產物，由 `.gitignore` 強制排除 |
| **依賴與編譯產物** | `node_modules/`, `frontend/dist/`, `backend/dist/` | 透過 CI/CD 流程構建，不追蹤於原始碼倉庫 |
| **本機 MCP 私密設定檔** | `c:\Users\user\.gemini\config\mcp_config.json` | 位於使用者個人目錄，絕不納入專案 Git 倉庫 |

---

## 三、安全掃描與術科完整性查驗 (Security & Topic Integrity)

1. **敏感資訊掃描結果**：**100% CLEAN**。所有準備同步之檔案均通過正規表示式掃描，無密碼、API Key、Token 或個人敏感資訊。
2. **官方術科 104301~104305 保護**：**100% INTACT**。官方題組素材包（`173003B13/`、`題組一~五答案/`、`照片/`）完全未變更、無刪除、無改動。非官方題組「台灣美食」已被確認杜絕。
3. **無預期刪除**：本次更新檔案刪除數量為 **0**。

---

## 四、自動化測試與建置結果 (Test & Build Verification)

- **後端 TypeScript 編譯 (`npx tsc --noEmit`)**：**0 錯誤**
- **後端離線安全測試 (`npm run test:offline`)**：**17 個測試檔案、221 個測試案例 100% 綠燈通過**
- **後端建置 (`npm run build`)**：**成功** (`dist/` 產生)
- **前端 TypeScript 編譯 (`npx tsc --noEmit`)**：**0 錯誤**
- **前端單元與整合測試 (`npx vitest run frontend/tests`)**：**43 個測試檔案、416 個測試案例 100% 綠燈通過**
- **前端生產建置 (`npm run build`)**：**成功** (耗時 2.72s，打包 1,665 個模組)

---

## 五、部署目標與決策阻斷 (Deployment Target & Blocker Gate)

- **Render 正式服務**：`code-to-know-web`
- **正式部署分支**：`main` (當前工作分支為 `develop`)
- **決策安全門禁**：
  > 依據任務第三部分與第八部分最高原則：  
  > **「禁止自行將 develop 合併至 main。若正式部署分支與目前分支不同，先停止正式部署並回報。」**  
  > 本次 GitHub 更新將嚴格限定同步至目標分支 **`origin/develop`**，未經使用者明確授權前，**停止向 `main` 合併與 Render Production 正式部署**。
