# CODE TO KNOW｜第 0 波・第一批：Git 狀態與開發環境盤點清冊
# (MASTER_GIT_AND_ENVIRONMENT_STATUS.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-GIT-ENV-STATUS  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**安全原則**：**零 Git 寫入操作**，禁止執行 git commit、push、merge、rebase 或 deploy。

---

## 1. 執行期環境與依賴版本實際檢測 (Section C 審查)

經實際終端機指令即時偵測（非抄寫舊報告），專案環境與核心套件版本如下：

| 元件 / 套件名稱 | 實際運行版本 | 所在設定檔 / 檢測指令 | 狀態與相容性說明 |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v24.19.0` | `node -v` (Windows 執行期) | 最新 LTS 相容環境 |
| **npm** | `11.17.0` | `npm -v` | 依賴管理工具正常 |
| **React** | `18.3.1` | `frontend/package.json` | 穩定版 React 運行期 |
| **React DOM** | `18.3.1` | `frontend/package.json` | 渲染器相容一致 |
| **TypeScript (Frontend)** | `5.6.3` | `frontend/package.json` | 編譯 0 錯誤 |
| **TypeScript (Backend)** | `5.6.3` | `backend/package.json` | 編譯 0 錯誤 |
| **Vite** | `5.4.10` | `frontend/package.json` | 建置耗時 2.46 秒，打包完成 |
| **Express** | `4.21.1` | `backend/package.json` | 輕量化後端 RESTful API 骨幹 |
| **Prisma ORM** | `7.10.1` | `backend/package.json` (`@prisma/client`) | ORM 資料模型管理 |
| **Vitest** | `2.1.4` (Backend) | `backend/package.json` | 離線 221 個測試全數綠燈通過 |
| **Lucide React** | `0.460.0` | `frontend/package.json` | 現代化全站圖示庫 |
| **bcryptjs** | `2.4.3` | `backend/package.json` | 密碼安全雜湊 (Round 12) |
| **jsonwebtoken** | `9.0.2` | `backend/package.json` | JWT Session 簽章管理 |

---

## 2. Git 儲存庫狀態完整檢驗 (Git Status Audit)

- **專案根目錄**：`c:\Users\user\Documents\CODE-TO-KNOW`
- **當前工作分支**：`develop`
- **發布目標分支**：`main`
- **當前 HEAD Commit Hash**：`502ccbc641c09ab1598fa105f5a6d98cc685dcd8`
  - Commit 訊息：`docs: add production release and GitHub sync final report`
- **遠端倉庫 (Remote)**：
  - `origin` -> `https://github.com/Leonjay990414/CODE-TO-KNOW.git` (Fetch & Push)
- **分支差異比較**：
  - 本地 `develop` 與 `main` 皆位於 Commit `502ccbc`，無本地分支落後或分歧。

### 完整 `git status --short` 實況輸出：

```
 M docs/marketing/MARKETING_SOP.md
 M frontend/src/app/App.tsx
 M frontend/src/components/AIScaffoldingDemo.tsx
 M frontend/src/components/AuthModal.tsx
 M frontend/src/components/FeedbackModal.tsx
 M frontend/src/components/Footer.tsx
 M frontend/src/components/GameAchievementsModal.tsx
 M frontend/src/components/GameBriefingModal.tsx
 M frontend/src/components/Hero.tsx
 M frontend/src/components/LearningExperience.tsx
 M frontend/src/components/Navbar.tsx
 M frontend/src/components/NotificationCenterModal.tsx
 M frontend/src/components/StudentClassJoinModal.tsx
 M frontend/src/components/StudentTeacherDual.tsx
 M frontend/src/components/TeacherApplyModal.tsx
 M frontend/src/context/NavigationContext.tsx
 M frontend/src/pages/public/AICoachPage.tsx
 M frontend/src/pages/public/AdminDashboardPage.tsx
 M frontend/src/pages/public/CSSDesignerPage.tsx
 M frontend/src/pages/public/CodePuzzlePage.tsx
 M frontend/src/pages/public/GameCenterPage.tsx
 M frontend/src/pages/public/LearningProgressPage.tsx
 M frontend/src/pages/public/LegalNoticePage.tsx
 M frontend/src/pages/public/PracticalLearningPage.tsx
 M frontend/src/pages/public/QuizRushPage.tsx
 M frontend/src/pages/public/StudentDashboardPage.tsx
 M frontend/src/pages/public/TeacherDashboardPage.tsx
 M frontend/src/pages/public/TheoryPracticePage.tsx
 M frontend/src/pages/student/practical/PracticalDetailPage.tsx
 M frontend/src/pages/student/practical/PracticalHomePage.tsx
 M frontend/src/pages/student/practical/index.ts
 M frontend/src/styles/tokens.css
 M frontend/src/utils/gameStorage.ts
 M frontend/src/utils/learningStorage.ts
 M frontend/src/utils/wrongQuestionsStorage.ts
?? docs/FULL_PROJECT_INTEGRATED_AUDIT_REPORT.md
?? docs/FULL_PROJECT_REMAINING_WORK_REGISTER.md
?? docs/FULL_PROJECT_REPAIR_CHANGELOG.md
?? docs/MASTER_20_PHASE_REORGANIZATION_PLAN.md
?? docs/MASTER_API_INVENTORY.md
?? docs/MASTER_CROSS_PHASE_DEPENDENCY_MAP.md
?? docs/MASTER_DATABASE_INVENTORY.md
?? docs/MASTER_EXISTING_WORK_AND_DUPLICATION_AUDIT.md
?? docs/MASTER_FEATURE_STATUS_REGISTER.md
?? docs/MASTER_FOLDER_FILE_CATALOG.md
?? docs/MASTER_GIT_AND_ENVIRONMENT_STATUS.md
?? docs/MASTER_MCP_RULES_SKILLS_INVENTORY.md
?? docs/MASTER_PROJECT_INVENTORY.md
?? docs/P1_RELEASE_READINESS_REPAIR_REPORT.md
?? docs/P2_VISUAL_ACCESSIBILITY_AND_P1_RECHECK_REPORT.md
?? docs/PHASE_5_GAME_MODULE_INTEGRATION_VERIFICATION.md
?? docs/PHASE_5_IMPLEMENTATION_PLAN.md
?? docs/PHASE_5_MASTER_EXECUTION_PLAN.md
?? docs/PHASE_5_REMAINING_UID_EXECUTION_REPORT.md
?? docs/PHASE_5_UID_TRACEABILITY_MATRIX.md
?? docs/RELEASE_BLOCKERS_AND_DEPENDENCIES.md
?? docs/RELEASE_READINESS_CHECKLIST.md
?? docs/master/
?? frontend/src/pages/student/practical/StudentPracticalHubPage.tsx
?? frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx
?? frontend/src/utils/adminGameConfigManager.ts
?? frontend/src/utils/aiSafetyFilter.ts
?? frontend/src/utils/codeLintRuleEngine.ts
?? frontend/src/utils/dailyQuestEngine.ts
?? frontend/src/utils/gameLearningInterlock.ts
?? frontend/src/utils/marketingUtils.ts
?? frontend/src/utils/teacherGameTaskManager.ts
?? frontend/tests/p1-repair-verification.test.tsx
?? frontend/tests/p2-visual-accessibility-verification.test.tsx
?? frontend/tests/phase5-p11-ai-safety-lint.test.ts
?? frontend/tests/phase5-p14-gam-advanced.test.tsx
?? frontend/tests/phase5-p17-media-brand.test.ts
?? frontend/tests/phase5-teacher-admin-game-integration.test.tsx
```

---

## 3. 部署與容器化設定盤點 (Docker & Render & Supabase)

1. **本機 Docker 基礎設施 (`docker-compose.yml`)**：
   - 使用官方 `postgres:16-alpine` 映像檔。
   - 服務綁定 `127.0.0.1:5432:5432`，嚴格限制本機存取。
   - 具備自動健全檢查 (`pg_isready`) 與本機持久化資料卷。
2. **Render 正式站點部署現況**：
   - 服務代稱：`code-to-know-web`
   - 原始碼根目錄：`frontend`
   - 建置指令：`npm ci && npm run build`
   - 發布目錄：`dist`
   - 正式營運網址：`https://code-to-know-web.onrender.com/` (正常連線運作中)
3. **Supabase 雲端資料庫設定**：
   - 專案 Ref：`ypibmyfxfhsyfdwxprpi` (區域：`aws-0-ap-southeast-2`)
   - 連線策略：受 `backend/src/config/db-validation.ts` 之 **AUTH-03 政策嚴格隔離**，本批次未進行任何網路寫入或 Migration。
