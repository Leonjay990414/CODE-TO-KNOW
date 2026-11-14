# CODE TO KNOW｜Phase 13 學生學習平台本批成果獨立稽核與問題盤點報告

> **稽核時間**：2026-11-13  
> **稽核性質**：唯讀獨立覆核（Read-Only Independent Audit）  
> **核心原則**：嚴格禁止未經授權的修改、提交與推送；保留所有既有成果；不修改資料庫；不變更 AUTH-03 狀態。  
> **全專案正式進度基準**：`45.961878%`（顯示 `45.96%`）維持不變。  
> **AUTH-03 狀態**：`BLOCKED`（維持阻斷）。  

---

## 一、Git 工作目錄狀態與安全核對

### 1.1 Git HEAD 與遠端同步查核
- **目前本機 Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`。
- **遠端分支關聯**：
  - `origin/main` 指向 `310323dee802eb3a940ed947c7c665e147fb19f3`。
  - 本機 HEAD 與 `origin/main` 完全同步，未超前亦未落後（`0 commits ahead`）。
- **遠端推送審查**：
  - **確認無任何未經許可的遠端推送（`git push`）行為**。
  - **確認無任何新建立的本機 commit**。

### 1.2 本機工作目錄變更清冊（全數保留未覆蓋）
工作目錄中存在本輪及上一輪為驗收與修復累積之本機修改與新增檔案，經查證均完好保留，未執行任何 `git reset`、`git clean` 或覆蓋指令：

1. **已修改檔案（Modified, 10 項）**：
   - `frontend/src/app/App.tsx`（法律入口路由、頁面匯入與路由分派）
   - `frontend/src/components/Footer.tsx`（頁尾法律資訊及隱私權政策連結）
   - `frontend/src/context/NavigationContext.tsx`（新增法律聲明頁面路由定義）
   - `frontend/src/data/practicalTasksData.ts`（題組五狀態與標籤修正）
   - `frontend/src/pages/public/AICoachPage.tsx`（AI 誠實免責宣告與靜態引導提示）
   - `frontend/src/pages/public/LearningProgressPage.tsx`（錯題本數據動態讀取與進度統計整合）
   - `frontend/src/pages/public/PracticalLearningPage.tsx`（題組五雙版本教材切換、檢查清單與素材清單展示）
   - `frontend/src/pages/public/StudentDashboardPage.tsx`（學生儀表板引導與錯題入口連結）
   - `frontend/src/pages/public/TeacherDashboardPage.tsx`（教師端儀表板免責與防護）
   - `frontend/src/pages/public/TheoryPracticePage.tsx`（學科刷題錯題本自動記錄與蘇格拉底提示機制）

2. **新增檔案（Untracked, 8 項核心原始碼與文件）**：
   - `docs/development/PHASE13_STUDENT_PLATFORM_30MIN_DEVELOPMENT_REPORT.md`
   - `docs/legal/PRIVACY_POLICY.md`、`docs/legal/TERMS_OF_SERVICE.md`、`docs/legal/AI_ETHICS_DISCLOSURE.md`
   - `frontend/src/data/task5CurriculumData.ts`（題組五官方 25 項素材索引、版本 A 與版本 B 雙版教材資料架構）
   - `frontend/src/pages/public/LegalNoticePage.tsx`（法律聲明展示頁）
   - `frontend/src/utils/learningStorage.ts`（術科學習進度本機持久化與版本隔離工具模組）
   - `frontend/src/utils/wrongQuestionsStorage.ts`（學科錯題本本機儲存、複習統計與解答判定工具模組）
   - 測試套件：
     - `frontend/tests/learning-storage.test.ts`
     - `frontend/tests/wrong-questions-storage.test.ts`
     - `frontend/tests/practical-task5-curriculum.test.ts`
     - `frontend/tests/legal-routes.test.tsx`

---

## 二、正式 UID、原始範圍與驗收條件核對

依據第五輪正式驗收文件 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，本次稽核所涉 4 項正式 UID 之定義如下：

| UID | 正式名稱 | 正式工作說明 | 前置依賴 | 正式驗收條件 | 基準狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P13-STU-007** | 逐組核對官方試題、教材、素材、操作要求與評分依據 | 逐一對照 17300 網頁設計丙級官方 5 個題組，將素材清單、試題需求、版面配置、操作流程與評分陷阱建立完整結構化資料與教學內容。 | P08-ARCH-002, P13-STU-006 | 5 個題組之試題說明、素材索引、評分規準完整結構化，無缺漏錯漏。 | PARTIAL (50%) |
| **P13-STU-008** | 題組五教材狀態與雙版架構 | 正式盤點題組五官方素材與目前教材完成狀態；如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成；保留舊版基礎並規劃升級新版，建立雙版本過渡架構與清楚版本標示。 | P13-STU-007 | 題組五教材狀態標示誠實明確；雙版本架構與版本差異說明清楚。 | PARTIAL (50%) |
| **P13-STU-004** | 建立題型、作答、答案判定、解析及計分 | 建立單選、複選等題型之作答互動、提交答案、即時判定對錯、顯示解析與計分邏輯。 | P08-ARCH-002, P13-STU-003 | 作答體驗流暢，答案判定與計分準確，解析顯示正確。 | PARTIAL (50%) |
| **P13-STU-010** | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄 | 建立錯題本自動記錄、收藏題目、筆記紀錄、學習時長累計與進度同步功能。 | P08-ARCH-002, P13-STU-004, P13-STU-005 | 錯題可複習重測，收藏與筆記正常儲存，學習時間記錄準確。 | PARTIAL (60%) |

---

## 三、五輪稽核逐項查核結果

### 第一輪：題組五教材與 25 項官方素材物理查核（P13-STU-007、P13-STU-008）
1. **磁碟實體檔案比對**：
   - 盤點路徑：`173003B13/173003B13_附屬檔案/17300-104305/`。
   - **實體檔案總數：25 項檔案**，無任何遺漏。
   - 包含：`0501.gif`～`0506.gif`、`0507.jpg`、`0509.jpg`、`0512.gif`、`0513.jpg`、`0514.jpg`、`0515.gif`～`0520.gif`、`0521.txt`、`0522.txt`、`0523.txt`、`0524.txt`、`0525.txt`、`0526.txt`、`範例0508.gif`。
2. **教材索引精確度審查**：
   - `frontend/src/data/task5CurriculumData.ts` 中的 `TASK_5_ASSETS_INDEX` 完整收錄 25 筆素材，檔名、格式與功能用途完全對應。
   - **特別查核點 1（`0508.gif`）**：磁碟實體檔名為 `範例0508.gif`（官方隨題附贈之文字色彩變換動畫範例檔）。教材在步驟 4 明確註記「官方光碟提供之檔案名稱為『範例0508.gif』，應依題意建立跑馬燈或使用範例圖片」，解說嚴謹誠實。
   - **特別查核點 2（`0510a.gif`）**：官方光碟並無單獨 `0510a.gif` 靜態圖，依題意須由考生以 `0509.jpg` 合成五張活動花絮圖片。教材步驟 9 清楚說明此為動態合成輸出，不混淆素材來源。
3. **版本架構核實**：
   - **版本 A（純 HTML5 / CSS3 / 基礎 JS 模式）**：包含 10 個完整步驟，全數具備詳細實作說明、技術要點及評分扣分防範提示。
   - **版本 B（串流影音外掛與進階多媒體教學）**：包含 7 個大綱步驟，明確標註 `isVerified: false`（待連網串流驗證），誠實標示待確認 YouTube 與影音嵌入細節，無虛報完成度情況。

### 第二輪：雙版架構與進度儲存隔離查核（P13-STU-008、P13-STU-010）
1. **本機儲存機制**：
   - 實作於 `frontend/src/utils/learningStorage.ts`。
   - 鍵值規範：`ctk_practical_progress:{userId}:{taskId}:{version}`。
2. **版本隔離測試**：
   - 當使用者切換版本 A 與版本 B 時，步驟勾選完成狀態獨立存在不同的 LocalStorage Key 中，互不干擾。
   - 經單元測試驗證，切換版本時百分比與步驟計數完全隔離。
3. **儲存防護與容錯機制**：
   - 當本機儲存空間損毀或出現非標準 JSON 時，捕捉錯誤並安全回退至預設空進度，避免畫面崩潰。
   - 清楚在 UI 與註解中揭露此為「瀏覽器本機儲存」，未偽裝具備雲端同步功能。

### 第三輪：學科刷題判定、錯題本與複習機制查核（P13-STU-004、P13-STU-010）
1. **答案判定與作答體驗**：
   - `TheoryPracticePage.tsx` 正確提供單選作答、即時判斷對錯（綠色正確提示、紅色錯誤警告）。
   - 支援蘇格拉底式引導提示（層次一核心概念、層次二排除方向、層次三試題解析），文字均為靜態教材設計，未宣稱連線即時 AI 模型。
2. **錯題本自動記錄與狀態流轉**：
   - 實作於 `frontend/src/utils/wrongQuestionsStorage.ts`。
   - 當作答錯誤時，觸發 `recordWrongAttempt`，若為新錯題則新增項目，若已存在則遞增 `wrongCount` 並將 `resolved` 設為 `false`。
   - 當後續重新作答正確時，觸發 `recordCorrectAttempt`，將 `resolved` 標記為 `true`，但保留歷史答錯次數以供複習弱點分析。
3. **學習進度頁（LearningProgressPage）統計連動**：
   - 移除原先寫死的 mock 錯題統計，改由 `getWrongQuestionsStats(userId)` 動態計算目前本機待複習題數與已掌握題數，呈現真實學習進度。

### 第四輪：跨頁面整合、回歸分析與路由完整性查核
1. **公開導覽與頁尾（Navigation & Footer）**：
   - `NavigationContext.tsx`、`App.tsx`、`Footer.tsx` 整合完好，支援法律聲明彈窗及直接路由跳轉。
2. **學生與教師儀表板（Student & Teacher Dashboards）**：
   - 學生儀表板明確連結至「術科實作學習」與「學科模擬練習」，引導流程自然。
   - 登入／未登入邊界清晰，未授權或訪客狀態下均能安全使用本機練習功能。
3. **回歸測試結果**：
   - Vitest 5 個測試檔案（29 個測試案例）全部通過（100% PASS）。
   - Vite 生產打包建置通過（`tsc && vite build`，0 警告阻礙）。

### 第五輪：程式碼品質、RWD 響應式與安全性查核
1. **響應式佈局（RWD）**：
   - 針對 320px、375px、768px 與 1024px+ 設計彈性排版，題組五雙版本切換按鈕、步驟卡片與 25 素材格線在小螢幕上均能自動折行。
2. **安全性與資料邊界**：
   - LocalStorage 存取均有 `try...catch` 包覆，無跨站腳本注入風險。
   - 無任何資料庫操作、無 API Key 洩漏。
   - AUTH-03 維持 `BLOCKED`，未混淆或破壞既有驗證保護。

---

## 四、確認正確項目（Verified Items）

1. **官方素材與試題完全一致**：
   - 題組五實體磁碟 25 項檔案皆已正確對應至系統資料結構，檔名、格式與說明無誤。
2. **雙版架構誠實清晰**：
   - 版本 A（正式推薦版）步驟完整；版本 B 誠實標示待連網驗證，無虛假造假。
3. **進度隔離與持久化正常**：
   - 題組五不同版本進度儲存互不干擾，支援進度重設與百分比即時計算。
4. **錯題紀錄邏輯正確**：
   - 答錯即時收錄、重複答錯累計次數、答對標記掌握，數據儲存結構具備拓展性。
5. **程式碼編譯與自動化測試通過**：
   - TypeScript 型別檢查無誤，Vite 打包順暢，29 項自動化測試全數通過。

---

## 五、發現問題與嚴重等級評估（Discovered Issues）

本次稽核未發現任何 Critical 或 High 等級之系統阻礙，共發現 1 項中度問題與 3 項輕度改進建議：

| 編號 | 項目說明 | 嚴重等級 | 影響檔案 | 問題描述與影響分析 |
| :---: | :--- | :---: | :--- | :--- |
| **ISSUE-01** | 題組五狀態標籤用詞一致性 | **MEDIUM** | `frontend/src/data/practicalTasksData.ts`<br>`frontend/src/pages/public/PracticalLearningPage.tsx` | 在 `practicalTasksData.ts` 中，題組五之狀態由原本的 `in_preparation` 改為 `partially_completed`。雖然反映了雙版教材已建立的現狀，但根據 P13-STU-008 驗收準則「如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成」，建議維持狀態或在 UI 徽章更嚴謹地顯示「教材整理中（雙版架構就緒）」，避免語意歧異。 |
| **ISSUE-02** | 測試環境 LocalStorage 依賴全域 Mock | **LOW** | `frontend/tests/learning-storage.test.ts`<br>`frontend/tests/wrong-questions-storage.test.ts` | Vitest 預設在 Node 環境執行，不具備瀏覽器 `window.localStorage`。目前是在各個測試檔案內部自建 `mockStorage`，未來可抽取至共用測試設定檔（如 `setupTests.ts`），提升測試架構整潔度。 |
| **ISSUE-03** | 題組 1 至 4 之互動進度尚未套用本機持久化 | **LOW** | `frontend/src/pages/public/PracticalLearningPage.tsx` | 目前僅題組五實作了基於 `learningStorage` 的互動勾選與持久化儲存，題組 1～4 的步驟清單仍為唯讀展示。未來擴充時應將同套機制套用至題組 1～4。 |
| **ISSUE-04** | 學科題庫涵蓋範圍尚限於示範題目 | **LOW** | `frontend/src/pages/public/TheoryPracticePage.tsx` | 目前學科刷題與錯題紀錄在範例題庫（5 題）運作良好，但尚未連接至官方 611 題完整題庫之本機資料檔。待後續題庫資料載入模組完成後方能全面發揮。 |

---

## 六、測試結果與客觀實體證據

1. **Vitest 單元測試套件執行結果**：
   ```text
   RUN  v5.1.0 C:/Users/user/Documents/CODE-TO-KNOW
   ✓ frontend/tests/learning-storage.test.ts (6 tests)
   ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests)
   ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests)
   ✓ frontend/tests/legal-routes.test.tsx (5 tests)
   ✓ frontend/tests/sources-route-protection.test.tsx (7 tests)

   Test Files  5 passed (5)
        Tests  29 passed (29)
     Duration  390ms
   ```
2. **生產環境打包（Frontend Production Build）**：
   ```text
   > tsc && vite build
   ✓ 1616 modules transformed.
   dist/index.html                   1.01 kB
   dist/assets/index-HmsvxDpa.css   14.22 kB
   dist/assets/index-Bs7lBBx8.js   543.34 kB
   ✓ built in 1.68s
   ```
3. **磁碟素材實際清點紀錄**：
   - 查驗指令：`Get-ChildItem -Path 173003B13/.../17300-104305 | Measure-Object`
   - 實體回傳：`Count: 25`。

---

## 七、必要修正項目與建議執行順序

若獲授權進行後續修正，建議優先順序如下：

1. **優先修正 ISSUE-01（狀態用詞嚴謹化）**：
   - 微調 `practicalTasksData.ts` 與 `PracticalLearningPage.tsx`，將題組五標籤明確顯示為「教材整理中（雙版架構與 25 素材就緒）」，同時在內部保留 `in_preparation` 或 `partially_completed`，文字說明無可挑剔。
2. **次要優化 ISSUE-02（測試設定共用化）**：
   - 在 `frontend/tests/` 建立共用 LocalStorage Mock，減少各測試檔重複代碼。
3. **後續規劃（待未來輪次推進）**：
   - 擴充題組 1～4 的 LocalStorage 勾選功能（ISSUE-03）。
   - 整合官方 611 題學科完整題庫（ISSUE-04）。

---

## 八、待外部驗證項目清單（Pending Verification）

1. **YouTube 外部串流嵌入與時間戳記**：
   - 題組五版本 B 所提及之外部 YouTube 影片（如影音播放器嵌入）需待外部網路連線或實體網址提供後，進行時間戳記與內容完整核對。
2. **雲端跨裝置同步（Cloud Sync）**：
   - 目前錯題本與術科進度僅限於瀏覽器本機 LocalStorage，跨裝置同步需等待後端驗證服務與使用者資料庫（AUTH-03 解除後）上線方能驗證。

---

## 九、正式 UID 狀態評估（維持基準不逕自竄改）

依據本專案核心原則，在未獲指示前，**不得擅自修改官方清冊之進度百分比與狀態**。以下提供客觀評估建議：

| UID | 目前基準狀態 | 本批成果完成度評估 | 建議是否變更官方清冊 | 評估理由 |
| :--- | :---: | :---: | :---: | :--- |
| **P13-STU-007** | PARTIAL (50%) | **60%** | **維持 PARTIAL** | 題組五 25 項素材與流程已完全結構化，但題組 1～4 仍需比照題組五建立同樣深度的細節資料。 |
| **P13-STU-008** | PARTIAL (50%) | **85%** | **維持 PARTIAL** | 雙版架構、版本切換與 25 素材對照皆已完成，待版本 B 影片時間戳記完成驗證後方達 100%。 |
| **P13-STU-004** | PARTIAL (50%) | **60%** | **維持 PARTIAL** | 答題判定、計分與蘇格拉底提示互動已實作，待全量 611 題完整題庫匯入。 |
| **P13-STU-010** | PARTIAL (60%) | **75%** | **維持 PARTIAL** | 錯題本本機記錄、重測狀態更新與進度統計已完成，待跨裝置雲端同步。 |

- **全專案整體進度維持**：`45.961878%`（顯示 `45.96%`）。
- **AUTH-03 維持**：`BLOCKED`。
