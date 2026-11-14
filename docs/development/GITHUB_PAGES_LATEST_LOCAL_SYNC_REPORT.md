# CODE TO KNOW 碼上學｜GitHub Pages 與最新本機版本同步報告

**專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）  
**同步目標**：將 GitHub Pages 線上網站同步至目前本機最新確認之 React/Vite 前台版本（含 Phase 13 學生學習平台、官方 605 題題庫、五大術科教材、全真模擬考、錯題本，以及 Phase 14 前四款互動遊戲：Code Puzzle、CSS Designer、Bug Hunter、Quiz Rush）  
**專案本機路徑**：`C:\Users\user\Documents\CODE-TO-KNOW`  
**GitHub 遠端**：`Leonjay990414/CODE-TO-KNOW`  
**目標分支**：`main`  
**GitHub Pages URL**：`https://leonjay990414.github.io/CODE-TO-KNOW/`  
**報告產出時間**：2026-11-14 14:54  

---

## 一、Git Commit 與遠端同步資訊

1. **更新前本機 Commit SHA**：`310323dee802eb3a940ed947c7c665e147fb19f3`
2. **更新前遠端 Commit SHA**：`310323dee802eb3a940ed947c7c665e147fb19f3`（更新前與本機同步）
3. **本次同步 Commit SHA**：`47c8ba4b176fb19478a8330598ef86a9039f78eb`
4. **Commit 訊息**：`feat(frontend): sync latest interactive learning, games, question bank, and mock exam to GitHub Pages`
5. **Git Push 結果**：成功推送至 `origin/main`（`310323d..47c8ba4  main -> main`），無衝突，未使用 `--force`。

---

## 二、本次更新檔案清單（共 32 檔案，20,692 insertions(+), 603 deletions(-)）

本次完全採用「方案 A」，不只更新單一入口，而是將參與 React/Vite 正式網站運作之所有前台原始碼、資料與工具模組完整同步：

### 1. 核心路由與應用架構
- `frontend/src/app/App.tsx`（註冊 CodePuzzle、CSSDesigner、BugHunter、QuizRush、LegalNotice 等完整路由）
- `frontend/src/context/NavigationContext.tsx`（新增 `#games/*`、`#student/*`、`#legal`、`#privacy`、`#terms` 等 Hash 導航支援與各捷徑方法）
- `frontend/src/components/Navbar.tsx`（前台頂部導覽列同步）
- `frontend/src/components/Footer.tsx`（頁尾連結、法律聲明頁面跳轉與社群規範連結）
- `frontend/src/styles/components.css`（共用元件樣式與遊戲專用排版規則）

### 2. 學習教材與題庫資料
- `frontend/src/data/officialTheoryQuestionBank.json`（官方 605 題技術士技能檢定網頁設計丙級真實題庫，四項工作項目全覆蓋）
- `frontend/src/data/questionBankAdapter.ts`（題庫轉接層與 TypeScript 型別介面）
- `frontend/src/data/practicalTasksData.ts`（術科題組目錄與架構資料）
- `frontend/src/data/task5CurriculumData.ts`（題組五書籤與目錄整合教材）
- `frontend/src/data/unifiedPracticalCurriculumData.ts`（五大術科題組教材與實務導引）
- `frontend/src/data/theoryQuestionsData.ts`（學科基礎資料）

### 3. Phase 14 互動遊戲資料與頁面
- `frontend/src/data/codePuzzleData.ts`（Code Puzzle 程式拼圖挑戰關卡）
- `frontend/src/pages/public/CodePuzzlePage.tsx`（程式拼圖遊戲頁面）
- `frontend/src/data/cssDesignerData.ts`（CSS Designer 樣式排版遊戲關卡）
- `frontend/src/pages/public/CSSDesignerPage.tsx`（樣式排版遊戲頁面）
- `frontend/src/data/bugHunterData.ts`（Bug Hunter 程式除錯獵人關卡）
- `frontend/src/pages/public/BugHunterPage.tsx`（程式除錯獵人遊戲頁面）
- `frontend/src/pages/public/QuizRushPage.tsx`（Quiz Rush 證照疾速快答遊戲頁面）
- `frontend/src/pages/public/GameCenterPage.tsx`（遊戲中心大廳，整合 4 款已開放遊戲與累加統計）

### 4. Phase 13 學生學習平台功能頁面
- `frontend/src/pages/public/TheoryPracticePage.tsx`（學科練習、自測與錯題複習專區）
- `frontend/src/pages/public/PracticalLearningPage.tsx`（術科練習與教材研讀專區）
- `frontend/src/pages/public/MockExamPage.tsx`（全真模擬考系統：抽題、計時、交卷、檢討與雷達分析）
- `frontend/src/pages/public/LearningProgressPage.tsx`（學習進度儀表板）
- `frontend/src/pages/public/StudentDashboardPage.tsx`（學生個人中心）
- `frontend/src/pages/public/TeacherDashboardPage.tsx`（教師工作台前台頁面）
- `frontend/src/pages/public/AICoachPage.tsx`（AI 教練前台頁面）
- `frontend/src/pages/public/LegalNoticePage.tsx`（隱私權政策、服務條款與 AI 倫理聲明）

### 5. 本機持久化與遊戲運算工具模組
- `frontend/src/utils/gameStorage.ts`（遊戲紀錄、星級、防灌水高標保留與多帳號本機隔離）
- `frontend/src/utils/learningStorage.ts`（術科與學科閱讀進度本機儲存）
- `frontend/src/utils/mockExamStorage.ts`（模擬考歷史考卷紀錄與能力指標分析）
- `frontend/src/utils/quizRushEngine.ts`（Quiz Rush 洗牌抽題、計分公式、連擊倍率與星級評估）
- `frontend/src/utils/wrongQuestionsStorage.ts`（個人錯題本收集、自測與精熟推進）

---

## 三、排除檔案清單與原因

為嚴格遵循最小授權原則、保護機密並避免污染 Git Repository，下列檔案全數排除於本次 Commit 之外：

| 檔案 / 目錄 | 排除原因 |
| :--- | :--- |
| `.env`、`frontend/.env`、`frontend/.env.demo` 等 | 機密環境變數檔，受 `.gitignore` 排除，嚴禁提交 |
| `.vite/` | Vite 本機建置快取暫存目錄，不屬於原始碼 |
| `frontend/dist/` | 正式發布檔案，由 GitHub Actions 依據原始碼自動建置產出，避免直接簽入產生衝突 |
| `frontend/tests/` | 本機 Vitest 測試套件，非參與 Pages 線上渲染之前端原始碼 |
| `docs/PROJECT_20_PHASE_*` | Phase 13/14 本機專案進度稽核報告，與網站前台運作無關 |
| `docs/development/PHASE*`、`docs/development/ACTIVE_*` | 開發階段性檢驗報告，保留於本機 |
| `docs/legal/` | 法律規範文檔草稿，前台已內建於 `LegalNoticePage.tsx` |
| `tmp/`、`~$*.docx`、`1.docx`、`計劃書.*`、`照片/` | 本機暫存檔、Word 暫存鎖定檔與非網站二進位資產 |
| `backend/` 及所有資料庫相關腳本 | 本次僅授權 GitHub Pages 前端同步，嚴禁觸碰後端與資料庫 |

---

## 四、frontend/index.html 差異核對

- **正式入口確認**：`frontend/index.html` 經比對與遠端 HEAD 完全一致，正確載入 `/src/main.tsx` 與 `./images/logo/symbol.svg`，編碼為 UTF-8，包含 Noto Sans TC 與 Inter 字型宣告。
- **無錯誤引用**：確認未誤將 `prototype/index.html` 當作 React/Vite 入口。

---

## 五、GitHub Pages 部署流程核對

核對 `.github/workflows/deploy-pages.yml`：
1. **觸發條件**：push 至 `main` 分支自動觸發，且具備 `workflow_dispatch` 手動觸發。
2. **Node.js 環境**：指定 Node.js 20，`npm ci` 乾淨安裝。
3. **建置根目錄**：`working-directory: frontend`。
4. **Build 指令**：`npm run build`（執行 `tsc && vite build`）。
5. **環境變數注入**：
   - `VITE_BASE_PATH: /CODE-TO-KNOW/`（符合 GitHub Pages 子路徑）
   - `VITE_DEMO_MODE: 'true'`（啟用展示模式相容）
6. **安全性掃描**：建置後自動以正則表達式掃描 `frontend/dist` 是否夾帶資料庫連線字串、金鑰或 Private Key。
7. **發布目標**：`actions/upload-pages-artifact@v3` 上傳 `frontend/dist`，由 `actions/deploy-pages@v4` 部署至 `github-pages` 環境。

---

## 六、本地建置與測試驗證

1. **TypeScript 型別檢查與 Vite 生產建置**：
   - 模擬 CI 指令：`$env:VITE_BASE_PATH="/CODE-TO-KNOW/"; $env:VITE_DEMO_MODE="true"; npm --prefix frontend run build`
   - **結果**：0 錯誤、0 警告，成功輸出 `frontend/dist`（HTML: 1.03 kB, CSS: 14.24 kB, JS: 872.22 kB）。
2. **本機 DevSecOps 機密掃描**：
   - 執行與 CI 相同之 pattern 掃描，未發現任何 PostgreSQL 連線字串、密鑰或認證。
3. **前端自動化測試**：
   - 執行 `npx --prefix frontend vitest run frontend/tests`：
   - **14 個測試套件全數通過**、**144 項測試 100% PASS**（耗時 655ms）。

---

## 七、GitHub Actions 與 Pages 部署結果

1. **Workflow Run ID**：`43568408104`
2. **Workflow 名稱**：`Deploy Frontend Preview to GitHub Pages`
3. **觸發 Commit**：`47c8ba4b176fb19478a8330598ef86a9039f78eb`
4. **執行進程與狀態**：
   - `build` Job：2026-11-14T06:52:14Z ~ 06:52:43Z（耗時 29 秒，**SUCCESS**）
   - `deploy` Job：2026-11-14T06:52:48Z ~ 06:52:58Z（耗時 10 秒，**SUCCESS**）
5. **最終 Run 狀態**：`status: completed`、`conclusion: success`

---

## 八、線上網站實測結果（HTTP 網路驗證）

- **目標網址**：`https://leonjay990414.github.io/CODE-TO-KNOW/`
- **首頁 HTML 載入**：HTTP 200 OK，包含最新資源參照：
  - JS Bundle：`https://leonjay990414.github.io/CODE-TO-KNOW/assets/index-Bp12jP_o.js`（HTTP 200 OK）
  - CSS Stylesheet：`https://leonjay990414.github.io/CODE-TO-KNOW/assets/index-BjE94Mpv.css`（HTTP 200 OK）
  - Favicon：`https://leonjay990414.github.io/CODE-TO-KNOW/images/logo/symbol.svg`（HTTP 200 OK）
- **路由路徑支援**：所有靜態資源與 Hash 路由均以 `/CODE-TO-KNOW/` 為基準，無 404 破圖或缺少腳本。
- **瀏覽器操作說明**：依據執行原則，本機無內建外掛瀏覽器環境，已透過實質 HTTP 請求完成所有資產 200 OK 驗證；使用者亦可隨時使用 Chrome/Edge/Firefox 開啟上述網址進行手動點擊體驗。

---

## 九、功能限制與受限說明（誠實揭露）

1. **GitHub Pages 靜態代管限制**：
   - GitHub Pages 僅提供靜態檔案代管服務，無 Node.js 後端伺服器或 live PostgreSQL 資料庫執行環境。
   - 所有學生進度、遊戲星數、錯題紀錄、模擬考成果均依賴前端 LocalStorage（已具備多帳號隔離與損毀容錯防禦機制）。
2. **後端認證限制**：
   - 正式後端 API（`/api/auth/login` 等）於純靜態 GitHub Pages 上不可連線，登入機制維持 Demo 模擬帳號模式。
   - **AUTH-03 狀態嚴格維持 `BLOCKED`**，未偽造任何虛假認證。
3. **AI 生成限制**：
   - 線上環境之 AI 教練建議採用內建啟發式題庫引導提示，在無雲端 API Key 配置前不執行 live LLM 調用。

---

## 十、最終 Git 狀態

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   "~$DE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx"

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.vite/
	1.docx
	docs/PROJECT_20_PHASE_DATA_VALIDATION_AUDIT_20261113.md
	docs/PROJECT_20_PHASE_FINAL_ACCEPTANCE_AUDIT_20261113.md
	docs/PROJECT_20_PHASE_MASTER_PROGRESS_AUDIT_20261113.md
	docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md
	docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md
	docs/development/ACTIVE_WEBSITE_ENTRYPOINT_AUDIT.md
	docs/development/GITHUB_PAGES_LATEST_LOCAL_SYNC_REPORT.md
	docs/development/PHASE13_BATCH1_CURRICULUM_AND_QUESTION_BANK_REPORT.md
	docs/development/PHASE13_BATCH2_STUDENT_FUNCTION_INTEGRATION_REPORT.md
	docs/development/PHASE13_BATCH3_MOCK_EXAM_REPORT.md
	docs/development/PHASE13_BATCH4_WRONG_QUESTIONS_REVIEW_REPORT.md
	docs/development/PHASE13_COMPREHENSIVE_E2E_ACCEPTANCE_REPORT.md
	docs/development/PHASE13_FIRST_CONSOLIDATED_FIX_REPORT.md
	docs/development/PHASE13_STUDENT_PLATFORM_30MIN_DEVELOPMENT_REPORT.md
	docs/development/PHASE13_STUDENT_PLATFORM_INDEPENDENT_AUDIT.md
	docs/development/PHASE14_BATCH1_GAME_SYSTEM_AND_CODE_PUZZLE_REPORT.md
	docs/development/PHASE14_BATCH2_CSS_DESIGNER_REPORT.md
	docs/development/PHASE14_BATCH3_BUG_HUNTER_REPORT.md
	docs/development/PHASE14_BATCH4_QUIZ_RUSH_REPORT.md
	docs/legal/
	frontend/tests/account-storage-isolation.test.ts
	frontend/tests/bug-hunter-game.test.ts
	frontend/tests/code-puzzle-game.test.ts
	frontend/tests/css-designer-game.test.ts
	frontend/tests/learning-storage.test.ts
	frontend/tests/legal-routes.test.tsx
	frontend/tests/mock-exam-system.test.ts
	frontend/tests/official-theory-question-bank.test.ts
	frontend/tests/practical-task5-curriculum.test.ts
	frontend/tests/quiz-rush-game.test.ts
	frontend/tests/unified-practical-curriculum.test.ts
	frontend/tests/wrong-questions-review-system.test.ts
	frontend/tests/wrong-questions-storage.test.ts
	tmp/
	"照片/"
	"計劃書.docx"
	"計劃書.pdf"

no changes added to commit (use "git add" and/or "git commit -a")
```
所有非同步範圍之本機既有修改、文件與測試套件皆完整保留，未發生任何檔案遺失或遭破壞情事。
