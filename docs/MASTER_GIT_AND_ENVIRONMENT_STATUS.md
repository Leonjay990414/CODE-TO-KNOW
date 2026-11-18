# CODE TO KNOW｜Git 狀態、分支與環境配置盤點清冊 (Master Git & Environment Status)

版本：MASTER-GIT-ENV-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
工作區路徑：`c:\Users\user\Documents\CODE-TO-KNOW`  
安全原則：禁止執行 git commit、push、merge 或 deploy 操作；僅記錄現狀與阻斷因素。

---

## 一、Git 分支與工作目錄現況 (Branch & Worktree Status)

### 1. 分支指標與歷史追蹤
- **目前工作分支**：`develop`
- **正式發布分支**：`main`
- **當前 HEAD Commit**：`502ccbc641c09ab1598fa105f5a6d98cc685dcd8`
  - 訊息：`docs: add production release and GitHub sync final report`
- **分支分歧狀態**：
  - 本地 `develop` 與 `main` 指向相同 Commit (`502ccbc`)，無本地分歧。
  - 遠端追蹤倉庫：`Leonjay990414/CODE-TO-KNOW`。

### 2. 最近 5 次 Commit 歷程
1. `502ccbc` - `docs: add production release and GitHub sync final report`
2. `85f4fb2` - `feat: sync verified practical curriculum, RWD motion enhancements, audit reports and 5-tier architecture`
3. `e6edaa9` - `docs: add production release and GitHub sync final report`
4. `8d0bc72` - `feat(frontend,security): apply production API safety, refine loading brand consistency, and sync approved Wave 6 deliverables`
5. `6d93d70` - `docs: add GitHub develop sync and Render Preview readiness report`

---

## 二、工作區修改與未追蹤檔案清單 (Dirty Worktree Audit)

目前工作區共有 **35 個已修改檔案** 與 **27+ 個未追蹤檔案**，均源於前次 P1/P2 修補、第五波準備與本第 0 波盤點：

### 1. 已修改檔案 (35 份 Modified Files)
- **文件類 (1 份)**：
  - `docs/marketing/MARKETING_SOP.md`
- **前端核心與元件類 (14 份)**：
  - `frontend/src/app/App.tsx`
  - `frontend/src/components/AIScaffoldingDemo.tsx`
  - `frontend/src/components/AuthModal.tsx`
  - `frontend/src/components/FeedbackModal.tsx`
  - `frontend/src/components/Footer.tsx` (修復信箱格式與真實性)
  - `frontend/src/components/GameAchievementsModal.tsx`
  - `frontend/src/components/GameBriefingModal.tsx`
  - `frontend/src/components/Hero.tsx` (標註統計數據展示版)
  - `frontend/src/components/LearningExperience.tsx`
  - `frontend/src/components/Navbar.tsx`
  - `frontend/src/components/NotificationCenterModal.tsx`
  - `frontend/src/components/StudentClassJoinModal.tsx`
  - `frontend/src/components/StudentTeacherDual.tsx`
  - `frontend/src/components/TeacherApplyModal.tsx`
- **前端上下文與樣式 (2 份)**：
  - `frontend/src/context/NavigationContext.tsx` (5 層架構路由與麵包屑健全化)
  - `frontend/src/styles/tokens.css` (香檳金深色對比度提升 #9B7E4B)
- **前端頁面層 (15 份)**：
  - `frontend/src/pages/public/AICoachPage.tsx` (清晰標註【展示版/原型模擬】)
  - `frontend/src/pages/public/AdminDashboardPage.tsx` (移出 L5 營運監控，導流至專用頁面)
  - `frontend/src/pages/public/CSSDesignerPage.tsx`
  - `frontend/src/pages/public/CodePuzzlePage.tsx`
  - `frontend/src/pages/public/GameCenterPage.tsx`
  - `frontend/src/pages/public/LearningProgressPage.tsx`
  - `frontend/src/pages/public/LegalNoticePage.tsx`
  - `frontend/src/pages/public/PracticalLearningPage.tsx` (舊版術科引導至新大廳)
  - `frontend/src/pages/public/QuizRushPage.tsx`
  - `frontend/src/pages/public/StudentDashboardPage.tsx`
  - `frontend/src/pages/public/TeacherDashboardPage.tsx`
  - `frontend/src/pages/public/TheoryPracticePage.tsx`
  - `frontend/src/pages/student/practical/PracticalDetailPage.tsx`
  - `frontend/src/pages/student/practical/PracticalHomePage.tsx`
  - `frontend/src/pages/student/practical/index.ts`
- **前端工具庫 (3 份)**：
  - `frontend/src/utils/gameStorage.ts`
  - `frontend/src/utils/learningStorage.ts`
  - `frontend/src/utils/wrongQuestionsStorage.ts`

### 2. 未追蹤新增檔案 (Untracked Files)
- **第 0 波盤點文件庫 (10 份)**：
  - `docs/MASTER_PROJECT_INVENTORY.md`
  - `docs/MASTER_FOLDER_FILE_CATALOG.md`
  - `docs/MASTER_DATABASE_INVENTORY.md`
  - `docs/MASTER_API_INVENTORY.md`
  - `docs/MASTER_MCP_RULES_SKILLS_INVENTORY.md`
  - `docs/MASTER_FEATURE_STATUS_REGISTER.md`
  - `docs/MASTER_GIT_AND_ENVIRONMENT_STATUS.md` (本文件)
  - `docs/MASTER_20_PHASE_REORGANIZATION_PLAN.md` (待寫)
  - `docs/MASTER_CROSS_PHASE_DEPENDENCY_MAP.md` (待寫)
  - `docs/MASTER_EXISTING_WORK_AND_DUPLICATION_AUDIT.md` (待寫)
- **歷史稽核與規劃文件 (8 份)**：
  - `docs/FULL_PROJECT_INTEGRATED_AUDIT_REPORT.md`
  - `docs/FULL_PROJECT_REMAINING_WORK_REGISTER.md`
  - `docs/FULL_PROJECT_REPAIR_CHANGELOG.md`
  - `docs/P1_RELEASE_READINESS_REPAIR_REPORT.md`
  - `docs/P2_VISUAL_ACCESSIBILITY_AND_P1_RECHECK_REPORT.md`
  - `docs/PHASE_5_IMPLEMENTATION_PLAN.md`
  - `docs/PHASE_5_MASTER_EXECUTION_PLAN.md`
  - `docs/RELEASE_READINESS_CHECKLIST.md`
- **前端新增元件與工具 (9 份)**：
  - `frontend/src/pages/student/practical/StudentPracticalHubPage.tsx`
  - `frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx` (獨立 L5 營運監控頁)
  - `frontend/src/utils/adminGameConfigManager.ts`
  - `frontend/src/utils/aiSafetyFilter.ts`
  - `frontend/src/utils/codeLintRuleEngine.ts`
  - `frontend/src/utils/dailyQuestEngine.ts`
  - `frontend/src/utils/gameLearningInterlock.ts`
  - `frontend/src/utils/marketingUtils.ts`
  - `frontend/src/utils/teacherGameTaskManager.ts`
- **新增驗證測試套件 (6 份)**：
  - `frontend/tests/p1-repair-verification.test.tsx`
  - `frontend/tests/p2-visual-accessibility-verification.test.tsx`
  - `frontend/tests/phase5-p11-ai-safety-lint.test.ts`
  - `frontend/tests/phase5-p14-gam-advanced.test.tsx`
  - `frontend/tests/phase5-p17-media-brand.test.ts`
  - `frontend/tests/phase5-teacher-admin-game-integration.test.tsx`

---

## 三、環境變數與安全設定結構稽核 (Environment Architecture)

### 1. 根目錄 `.env.example`
規範全系統本地開發環境所需變數：
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` (Docker 資料庫設定)
- `PORT=4000`, `NODE_ENV=development`
- `DATABASE_URL` (本機連線字串)
- `FRONTEND_URL=http://localhost:3000`
- `SESSION_SECRET`, `COOKIE_SECRET`, `JWT_SECRET` (規範最少 32 碼高熵隨機字串)

### 2. 後端專屬 `backend/.env.example`
規範 Express 4 伺服器專屬設定：
- `PORT=4000`, `NODE_ENV=development`
- `DATABASE_URL` (PG16/17 連線)
- `SESSION_SECRET`, `COOKIE_SECRET`, `JWT_SECRET`, `BCRYPT_ROUNDS=12`
- `CORS_ORIGIN="http://localhost:3000"`, `COOKIE_DOMAIN="localhost"`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (郵件發送設定，本機預設留空使用 Mock)

> **安全稽核確認**：所有 `.env` 檔案皆在 `.gitignore` 排除清單中，無任何 Production 金鑰洩漏至 Git 追蹤檔案。

---

## 四、容器化與雲端部署現況 (Docker & Cloud Deployments)

1. **本機 Docker 基礎設施 (`docker-compose.yml`)**：
   - 定義 `postgres:16-alpine` 容器服務 `code_to_know_postgres`。
   - 綁定本機 Loopback 介面 `127.0.0.1:5432:5432`，防止外網直接存取。
   - 配置 `pg_isready` 自動健康檢查與持久化 Data Volume。
2. **Render Production 部署現況**：
   - 服務名稱：`code-to-know-web`
   - Root Directory：`frontend`
   - Build Command：`npm ci && npm run build`
   - Publish Directory：`dist`
   - 正式網址：`https://code-to-know-web.onrender.com/`
   - 目前運行狀態：前端靜態站點可正常存取，雙模 Client 自動降級為相容展示模式。

---

## 五、正式發布阻斷因子盤點 (Release Blockers Matrix)

| 阻斷因子 (Blocker) | 影響範圍 | 嚴重等級 | 解決條件與依賴 |
| :--- | :--- | :--- | :--- |
| **未暫存之修改與未追蹤測試檔** | Git 歷程一致性 | 中 | 待第 0 波盤點確認完成後，由使用者明確授權進行整批 Clean Commit |
| **AUTH-03 雲端 Supabase 連線隔離**| 正式資料庫讀寫 | 高 (安全鎖定) | 需取得正式專屬金鑰、執行 Supabase 連線測試，並獲使用者明確授權 |
| **L3/L4 遊戲管理 API 待接軌** | 教師/管理員雲端配置 | 中 | `teacherGameTaskManager` 與 `adminGameConfigManager` 需接軌後端 API |
| **正式郵件發信通道未設定** | 註冊驗證信與密碼重設 | 中 | 需在 Render 環境設定真實 SMTP / Resend API 金鑰 |
