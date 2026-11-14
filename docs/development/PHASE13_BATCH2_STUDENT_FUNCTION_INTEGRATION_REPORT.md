# CODE TO KNOW｜Phase 13 學生學習平台第二批功能完善與網站正式入口查核報告

- **報告日期**：2026-11-14
- **專案名稱**：CODE TO KNOW 碼上學 AI 智慧學習與教育科技平台
- **工作範圍**：PART A 正式網站入口獨立查核 ＋ PART B Phase 13 學生學習平台功能全面整合
- **正式全專案進度基準**：45.961878%（顯示 45.96%）
- **AUTH-03 狀態**：BLOCKED（嚴格維持）
- **Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`（分支：`main`，未提交任何 Commit，保留所有本機修改）

---

## 第一部分｜PART A：正式網站專案與 HTML 入口獨立查核結論

依據使用者的嚴格要求，已對全專案及上層目錄進行詳盡查核，確認專案唯一性與正式入口：

### 1. Antigravity IDE 目前開啟的 Workspace 完整絕對路徑
- **絕對路徑**：`C:\Users\user\Documents\CODE-TO-KNOW`
- **Git Repository 根目錄**：`C:/Users/user/Documents/CODE-TO-KNOW`
- **目前分支**：`main`
- **目前 Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`
- **副本排查**：在 `C:\Users\user\Documents` 下僅有唯一開發本體 `CODE-TO-KNOW`，其餘為冷備份 `CODE-TO-KNOW_BACKUPS` 與金鑰儲存庫 `CODE-TO-KNOW_SECRETS`，不存在多個混淆的開發工作區。

### 2. 專案內所有 index.html 檔案清冊與定位
專案內共有三個 `index.html`，職責涇渭分明：

| 檔案路徑 | 大小 | 檔案類型與用途 | 是否為 React/Vite 正式網站原始碼入口 |
| :--- | :--- | :--- | :--- |
| `frontend/index.html` | 1,034 bytes | **React/Vite 唯一正式原始碼進入點**。包含 `<div id="root"></div>` 與 `<script type="module" src="/src/main.tsx"></script>`。 | **是（唯一正式原始碼入口）** |
| `frontend/dist/index.html` | 1,010 bytes | **Vite 建置產物（Build Output）**。由 `npm run build` 自動編譯打包生成，供靜態伺服器託管，**嚴禁手動修改**。 | 否（編譯產物） |
| `prototype/index.html` | 64,463 bytes | **早期純靜態 HTML 原型**。純原生 JS/CSS 單檔，支援以 `file:///` 直接雙擊開啟預覽，與現代 React 架構完全隔離。 | 否（舊版原型參考檔） |

### 3. React 專案真正的載入鏈條
1. 瀏覽器請求首頁 `/` 或靜態資源。
2. 載入 `frontend/index.html`。
3. 執行 `<script type="module" src="/src/main.tsx"></script>`。
4. `frontend/src/main.tsx` 建立 React Root：`ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`。
5. `frontend/src/app/App.tsx` 包覆 `AuthProvider` 與 `NavigationProvider`。
6. `NavigationContext` 監聽瀏覽器 URL Hash（例如 `#/student-dashboard`、`#/theory-practice`、`#/practical-learning`）並渲染對應頁面組件。

### 4. 為何在檔案總管雙擊 `frontend/index.html` 會呈現空白頁？
- **原因一（瀏覽器 CORS 與 ES Module 安全限制）**：`frontend/index.html` 內包含 `<script type="module" src="/src/main.tsx">`。現代瀏覽器基於同源策略（Same-Origin Policy），在 `file:///` 協定下會強制阻斷 ES Module 的載入。
- **原因二（瀏覽器無法直接執行 TypeScript/JSX）**：`.tsx` 語法必須透過 Vite/esbuild 進行即時編譯或打包轉換為純 JavaScript。
- **原因三（DOM 掛載機制）**：原始檔案中的 `<div id="root"></div>` 本身為空，若未透過本機伺服器（`npm run dev` 或 `npm run preview`）啟動服務，React 虛擬 DOM 無法掛載至實體節點。

---

## 第二部分｜PART B：Phase 13 學生學習平台功能整合進度

### 1. 對應之 226 項 UID 狀態與進度說明
本次整合嚴格遵循 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` 清冊：

| UID | 原清冊工作項目名稱 | 原狀態 | 整合後成果說明 |
| :--- | :--- | :---: | :--- |
| **P13-STU-001** | 學生登入後主儀表板畫面 | PARTIAL | 首頁儀表板已完整對接學科章節練習（`goToTheoryPractice('web-design-c')`）與術科學習（`goToPracticalLearning('web-design-c')`），並具備待複習題數統計提醒。 |
| **P13-STU-002** | 報考職類與學習進度概覽 | PARTIAL | 支援網頁設計丙級學習路徑，即時顯示 4 大工作項目掌握度與 5 大題組完成狀況。 |
| **P13-STU-003** | 依章節/單元之學科題目練習介面 | PARTIAL | **重大突破**：透過 `questionBankAdapter.ts` 成功將全部 **605 題官方真實學科題庫** 無縫接入章節練習介面，支援工作項目篩選與快速跳題。 |
| **P13-STU-004** | 即時答案核對、解析與觀念提示 | PARTIAL | 官方題庫即時核對正確解答，支援保留 4 階層式 Socratic AI 提示導引架構（觀念聚焦、思考破題、邊界提點、完整解構）。 |
| **P13-STU-006** | 收藏題目與個人專屬錯題本 | PARTIAL | 整合本機錯題本機制（`wrongQuestionsStorage`），作答錯誤自動入本、累計錯誤次數、再測答對標記攻克。 |
| **P13-STU-007** | 五大術科題組逐步操作指引 | PARTIAL | **重大突破**：透過 `unifiedPracticalCurriculumData.ts` 完整整合題組一至題組五之實體教材、評分規範與素材索引。 |
| **P13-STU-008** | 術科重點提醒、評分標準與常見錯誤 | PARTIAL | 題組五完整納入「雙版本實作（A版：原生三件套標準解法 / B版：Vite+React 現代解法）」，提供扣分防禦清單與版面排版規範。 |
| **P13-STU-010** | 學習歷程本機備份與同步機制 | PARTIAL | 實作多使用者安全隔離（`getPracticalStorageKey`、`getWrongStorageKey`），登出或更換帳號時自動隔離數據，防範 JSON 損毀與惡意注入。 |
| **P13-STU-011** | 學習平台響應式佈局與可用性 | PARTIAL | 完成桌面版（雙欄）、平板及手機版（單欄折疊）響應式配置，通過各項自動化路由保護與可用性檢驗。 |

*註：依據專案規範，全專案進度基準維持 45.961878%（45.96%），待後續完整端到端驗收通過後再行整體校正。*

---

## 第三部分｜核心實作與技術細節

### 1. 官方 605 題題庫適配器 (`frontend/src/data/questionBankAdapter.ts`)
- **資料來源**：`officialTheoryQuestionBank.json`（由勞動部官方規範 `173003A17.pdf` 萃取，共 605 題有效題目）。
- **分類架構**：
  - 工作項目 01：作業準備（236 題）
  - 工作項目 02：應用軟體使用（233 題）
  - 工作項目 03：系統軟體使用（71 題）
  - 工作項目 04：資訊安全（65 題）
- **雙向適配相容性**：
  - 具備完整詳解之示範題目保留 4 階層 AI 鷹架引導。
  - 官方題庫其餘題目自動適配題目序號、勞動部官方頁碼標籤（如 `頁碼: 3`）、正確解答對應，保證 TypeScript 型別安全（`TheoryQuestionModel`）。

### 2. 學科練習介面升級 (`frontend/src/pages/public/TheoryPracticePage.tsx`)
- **題庫規模**：由原先 5 題樣式展示，正式升級為全量 605 題真實題庫切換練習。
- **章節篩選器**：提供「全部題目 (605)」及 4 大工作項目快速篩選。
- **題號跳轉功能**：新增輸入框與 Enter 鍵跳題功能，方便學生快速定位至特定題號。
- **錯題本連動**：作答錯誤立即同步至本機錯題本（`recordWrongAttempt`），並在答對時累計正確作答（`recordCorrectAttempt`）。

### 3. 五大術科題組統一架構 (`frontend/src/data/unifiedPracticalCurriculumData.ts`)
- 將原先分散的題組資料統合成單一權威資料字典 `UNIFIED_PRACTICAL_CURRICULUM_MAP`：
  - 題組一：莫扎特音樂網（Mozart Music Website）
  - 題組二：電子商務購物網（E-Commerce Web）
  - 題組三：國家公園介紹網（National Parks）
  - 題組四：流行影音資訊網（Pop Media News）
  - 題組五：網路即時通（Web Chat Messenger）
- 每個題組皆具備完整的章節學習指引、常見陷阱防禦、素材索引（MaterialAssetIndex）及版本管理介面。

---

## 第四部分｜測試驗證與建置結果

### 1. 單元與整合測試執行（Vitest）
- **執行指令**：`npx vitest run frontend/tests`
- **測試結果**：**8 個測試套件全數通過，共 48 項測試 PASS，耗時 582ms**。
  - `account-storage-isolation.test.ts` (7 tests) - 多帳號隔離、毀損恢復安全
  - `learning-storage.test.ts` (6 tests) - 術科進度存取與版本隔離
  - `wrong-questions-storage.test.ts` (6 tests) - 錯題本增刪修查與統計
  - `official-theory-question-bank.test.ts` (5 tests) - 605 題官方題庫結構驗證
  - `unified-practical-curriculum.test.ts` (7 tests) - 五大術科教材完整性驗證
  - `practical-task5-curriculum.test.ts` (5 tests) - 題組五雙版本指引驗證
  - `legal-routes.test.tsx` (5 tests) - 法律條款與隱私權路由驗證
  - `sources-route-protection.test.tsx` (7 tests) - 敏感路由隔離與保護

### 2. 生產環境編譯建置（Vite Build）
- **執行指令**：`npm --prefix frontend run build` (`tsc && vite build`)
- **建置產物**：
  - `dist/index.html` (1.01 kB)
  - `dist/assets/index-HmsvxDpa.css` (14.22 kB)
  - `dist/assets/index-ByG_e67M.js` (729.80 kB)
- **編譯狀態**：**0 個 TypeScript 錯誤，編譯成功（built in 2.75s）**。

---

## 第五部分｜變更檔案清冊與工作目錄狀態

### 1. 本批次修改檔案
- `frontend/src/data/questionBankAdapter.ts`（新增：官方 605 題庫與 AI 詳解適配器）
- `frontend/src/data/unifiedPracticalCurriculumData.ts`（新增：五大術科題組整合教材資料庫）
- `frontend/src/pages/public/TheoryPracticePage.tsx`（修改：接入 605 題、分類篩選、跳題功能、錯題本連動）
- `frontend/src/pages/public/PracticalLearningPage.tsx`（修改：整合五大題組與雙版本切換）
- `frontend/tests/unified-practical-curriculum.test.ts`（新增：五大術科題組完整性測試）
- `frontend/tests/official-theory-question-bank.test.ts`（新增：605 題題庫格式與答案檢驗測試）
- `docs/development/ACTIVE_WEBSITE_ENTRYPOINT_AUDIT.md`（新增：正式網站入口獨立稽核報告）
- `docs/development/PHASE13_BATCH2_STUDENT_FUNCTION_INTEGRATION_REPORT.md`（本報告）

### 2. Git 狀態確認
- **Commit / Push 操作**：**未執行任何 git commit、未執行任何 git push**。
- **資料保護**：無任何檔案遺失或遭覆蓋，所有既有修改與新增檔案完整保留於本機工作目錄中。
- **AUTH-03 狀態**：維持 `BLOCKED`，未擅自引入 Supabase 遠端資料庫連線或破壞後端隔離。

---

## 第六部分｜後續工作建議

1. **Phase 13 第三批次**：
   - 繼續針對 `P13-STU-005`（全真模擬考 80 題隨機抽題與 100 分制倒數計時考場環境）進行前端實作與測試。
   - 擴充五大題組的素材下載模擬與扣分檢查清單互動體驗。
2. **端到端驗收準備**：
   - 在完成模擬考與五大題組全量互動後，撰寫 Phase 13 綜合驗收清單，準備推進整體專案進度校正。
