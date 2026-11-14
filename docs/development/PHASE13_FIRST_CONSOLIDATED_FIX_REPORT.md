# CODE TO KNOW｜Phase 13 學生學習平台第一輪集中修正與回歸測試報告

> **報告日期**：2026-11-14  
> **專案工作目錄**：`C:\Users\user\Documents\CODE-TO-KNOW`  
> **執行性質**：經使用者授權之第一輪集中修正、帳號隔離強化與回歸驗證  
> **全專案正式進度基準**：`45.961878%`（顯示 `45.96%`）嚴格維持，未經整體驗收不逕自竄改  
> **AUTH-03 狀態**：`BLOCKED`（維持阻斷）  
> **Git 操作邊界**：未執行任何 commit、push、reset 或 clean 指令；本機所有成果完整保留；0 遠端同步  

---

## 一、本批執行範圍與流程

本次依據使用者授權指令，落實「先確認 UID → 盤點問題 → 集中修正 → 多輪檢查 → 回歸測試 → 產出報告」標準流程，具體執行包含：
1. **執行前檢查**：確認 Git HEAD、分支狀態、未提交檔案與 UID 原始清冊。
2. **第一項**：修正題組五教材狀態標籤，統一資料層與 UI 顯示為「教材整理中（雙版架構就緒）」，確保不誇大完成度且不影響其他 4 個正式題組。
3. **第二項**：LocalStorage 帳號隔離檢查與深度修正，防範使用者 A/B 切換、訪客匿名態與示範帳號（`demo-student` / `demo-teacher`）混用，補充完整單元測試。
4. **第三項**：題組 1～4 進度功能差距與官方素材物理盤點。
5. **第四項**：611 題正式學科題庫現狀與來源真偽盤點。
6. **第五項**：跨頁面整合與回歸狀態檢查。
7. **第六項**：全套自動化測試與生產打包驗證。

---

## 二、原始 UID 與工作內容核對

依據正式基準文件 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` 逐項核實本次所涉 UID 原始工作範圍與驗收準則：

| UID | 正式名稱 | 正式工作說明 | 前置依賴 | 基準狀態 | 本次關聯度 |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **P13-STU-007** | 逐組核對官方試題、教材、素材、操作要求與評分依據 | 逐一對照 17300 網頁設計丙級官方 5 個題組，將素材清單、試題需求、版面配置、操作流程與評分陷阱建立完整結構化資料與教學內容；未核實資料不得補寫成官方內容。 | P08-ARCH-002, P13-STU-006 | `PARTIAL` (50%) | 盤點題組 1～4 與題組 5 素材與教材結構差距 |
| **P13-STU-008** | 題組五教材狀態與雙版架構 | 正式盤點題組五官方素材與目前教材完成狀態；如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成；保留舊版基礎並規劃升級新版，建立雙版本過渡架構與清楚版本標示。 | P13-STU-007 | `PARTIAL` (50%) | **本輪核心修正**：修正標籤與徽章用詞，嚴守「教材整理中（雙版架構就緒）」 |
| **P13-STU-004** | 建立題型、作答、答案判定、解析及計分 | 建立單選、複選等題型之作答互動、提交答案、即時判定對錯、顯示解析與計分邏輯。 | P08-ARCH-002, P13-STU-003 | `PARTIAL` (50%) | 強化刷題紀錄與錯題本答案判定，確保無混淆 |
| **P13-STU-010** | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄 | 建立錯題本自動記錄、收藏題目、筆記紀錄、學習時長累計與進度同步功能。 | P08-ARCH-002, P13-STU-004, P13-STU-005 | `PARTIAL` (60%) | **本輪核心修正**：多帳號 LocalStorage 命名空間徹底隔離與切換防護 |
| **P13-STU-001** | 完成學生登入後儀表板與個人設定 | 建立學生個人中心、學習歷程摘要、近期練習與個人設定頁面。 | Phase 12 | `PARTIAL` (50%) | 核對訪客與示範帳號在儀表板之呈現與進度連結 |
| **P13-STU-002** | 完成證照分類、詳情、官方來源及學習目標 | 整理各證照之級別、報考資格、測驗科目、官方考綱連結與能力指標。 | Phase 12 | `PARTIAL` (50%) | 盤點官方檢定代碼（17300）與考綱規範連結 |
| **P13-STU-011** | 完成學習摘要、弱點分布及學習建議 | 依據學生練習成果統計答對率、錯題分布、章節弱點與實作進度。 | Phase 12 | `PARTIAL` (50%) | 驗證 `LearningProgressPage` 弱點統計與錯題本動態聯動 |

---

## 三、修改前 Git 狀態與安全審查

- **Git 分支**：`main`。
- **Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`。
- **遠端關聯**：`origin/main` 保持完全同步（0 commits ahead, 0 behind）。
- **安全邊界審查**：
  - 本輪**未執行**任何 `git commit`、`git push`、`git reset` 或 `git clean`。
  - 所有未提交修改與 untracked 檔案完好保留於工作目錄。

---

## 四、修改檔案與新增檔案清單

### 4.1 經由本輪授權修改之檔案 (6 項)
1. `frontend/src/data/practicalTasksData.ts`：
   - 題組五之 `teachingStatusText` 修正為：`教材整理中（雙版架構就緒 · 官方 10 步驟解構與 25 份素材索引）`。
2. `frontend/src/pages/public/PracticalLearningPage.tsx`：
   - 題組五側邊導覽按鈕標籤明確顯示為：`◐ 教材整理中（雙版架構就緒）`，色澤維持警告金黃色（`#B8860B`），絕不冒充「完整就緒」。
   - `userId` 匿名回退值由 `'demo'` 修正為具體明確的 `'guest-anonymous'`。
3. `frontend/src/pages/public/TheoryPracticePage.tsx`：
   - 訪客使用者回退由 `'demo'` 修正為 `'guest-anonymous'`，避免訪客未登入資料與示範帳號（`demo-student`）產生混淆。
4. `frontend/src/pages/public/LearningProgressPage.tsx`：
   - 訪客使用者回退由 `'demo'` 修正為 `'guest-anonymous'`。
5. `frontend/src/utils/learningStorage.ts`：
   - `getStorageKey`、`getPracticalProgress`、`resetPracticalProgress` 之安全回退嚴格綁定 `guest-anonymous`。
6. `frontend/src/utils/wrongQuestionsStorage.ts`：
   - `getWrongQuestionsStorageKey`、`getWrongQuestionsCollection` 安全回退綁定 `guest-anonymous`。
   - 測試案例相容性維護。

### 4.2 本輪新增檔案 (1 項)
1. `frontend/tests/account-storage-isolation.test.ts`：
   - 多帳號切換、訪客匿名隔離、示範帳號獨立性、防止意外清空他人資料、資料損毀自動恢復之專屬驗證測試套件（7 項測試全數 PASS）。

---

## 五、各問題原始狀態與具體修正

### 5.1 ISSUE-01：題組五教材狀態標籤用詞一致性修正
- **原始問題**：上一輪建立雙版教材後，題組五狀態欄位被改為 `partially_completed`，UI 顯示為 `◐ 規格雙版就緒`，容易使人誤解為官方教學已全部就緒，未完全吻合 UID P13-STU-008「應維持教材整理中，不得假裝完整教學已完成」之嚴謹要求。
- **具體修正**：
  - 資料層（`practicalTasksData.ts`）：維持 `status: 'partially_completed'`（不降為完全未動工，但也不升為 available），`teachingStatusText` 精準改為「教材整理中（雙版架構就緒 · 官方 10 步驟解構與 25 份素材索引）」。
  - UI 顯示層（`PracticalLearningPage.tsx`）：在題組按鈕清單中，針對 `task.id === 5` 獨立給出 `◐ 教材整理中（雙版架構就緒）` 徽章，徹底消除歧異。

### 5.2 ISSUE-02：LocalStorage 帳號隔離與切換防護
- **原始問題**：原先 `learningStorage.ts` 與 `wrongQuestionsStorage.ts` 在使用者未登入時預設使用 `'demo'` 作為鍵值識別碼。然而系統的示範學員登入（`DEMO_STUDENT_USER`）ID 為 `'demo-student'`，若使用者在登入前操作，其紀錄儲存於 `demo`，登入示範學員後又讀取 `demo-student`，造成資料看似遺失；或反過來被誤解為訪客資料冒充示範帳號。
- **具體修正**：
  1. 將未登入訪客識別碼統一命名為 `'guest-anonymous'`。
  2. 示範學員嚴格使用 `'demo-student'`，示範教師使用 `'demo-teacher'`，正式登入使用者則採用真實 `user.id`。
  3. 各使用者金鑰完全隔離：
     - 訪客術科：`ctk_practical_progress:guest-anonymous:{taskId}:{version}`
     - 訪客錯題：`ctk_wrong_questions:guest-anonymous`
     - 示範學員：`ctk_practical_progress:demo-student:{taskId}:{version}`
     - 示範學員錯題：`ctk_wrong_questions:demo-student`
     - 正式帳號：`ctk_practical_progress:{userId}:{taskId}:{version}`
  4. 驗證登出行為：登出時將 React State 清空，頁面切換回訪客身分，立即重新讀取 `guest-anonymous` 之資料，決不將使用者 A 的學習進度或錯題外洩給使用者 B。
  5. 驗證清除行為：呼叫 `clearAllWrongQuestions(userId)` 或 `resetPracticalProgress(userId, ...)` 僅會移除該特定使用者的 LocalStorage 項目，絕不呼叫 `localStorage.clear()`，其他使用者資料完全不受波及。

---

## 六、題組 1～4 進度功能差距與官方素材物理盤點

對照 17300 網頁設計丙級官方素材目錄（`173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材`）與系統現狀進行物理盤點：

| 題組代碼與名稱 | 官方素材目錄檔案數 | 官方關鍵素材核實狀況 | 目前系統支援狀態 | 具備教材步驟？ | 具備本機進度追蹤？ | 能否直接套用雙版本架構？ |
| :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **104301 校園社團介紹網** | **11 個** | `0101.jpg`～`0103.jpg`、`logo1.png`～`logo3.jpg`、`menu1.png`、`menu2.png` 完整核實 | 完整版型解構、沙盒骨架與考場陷阱已就緒 | 暫無交互步驟 (展示型) | 否 (目前僅題組五實作) | 可直接套用（待補充步驟資料模型） |
| **104302 運動廣場連結網** | **21 個** | 包含大圖/小圖、文字檔、`jquery-2.1.4.min.js`、`logo.png` 完整核實 | 題組規格解構、切版骨架就緒 | 暫無交互步驟 (展示型) | 否 | 可直接套用（需規劃 jQuery vs 原生 JS 雙版本） |
| **104303 國家公園介紹網** | **16 個** | `national_park.jpg`、`park.mp3`、`park0301.jpg`～`park0313.jpg` 完整核實 | 題組規格解構、切版骨架就緒 | 暫無交互步驟 (展示型) | 否 | 可直接套用（需規劃影像地圖 Image Map 雙版本） |
| **104304 網路行銷購物網** | **12 個** | `0401.jpg`～`0409.jpg`、`0401.mp3` 完整核實 | 題組規格解構、切版骨架就緒 | 暫無交互步驟 (展示型) | 否 | 可直接套用（需規劃購買確認彈窗雙版本） |
| **104305 書曼的旅遊相簿** | **25 個** | 25 項素材全數完整（含 `0501.mp3`、`範例0508.gif` 等） | **雙版本架構、10 步驟解構、自我查核表、本機儲存與隔離就緒** | **是 (版本 A: 10 步 / B: 7 步)** | **是 (完整支援)** | **已實作上線** |

### 盤點總結與誠實原則
- 題組 1 至 4 之官方原始素材均已 100% 存在於本機專案目錄中，檔案總數無誤。
- 目前僅題組五完成深入的「雙版本 10 步驟教案＋素材索引＋LocalStorage 互動核取」。
- **不得為了介面整齊而直接拷貝或假造題組 1～4 的步驟**；未來擴充題組 1～4 時，必須比照題組五，逐一翻閱 `173003B12.pdf` 規範，精確定義每個題組的 HTML/CSS/JS 拆解步驟與評分陷阱，再行實作。

---

## 七、611 題正式學科題庫來源與資料結構盤點

經過磁碟搜尋、專案代碼盤查與 PDF 檔案驗證，盤點結果如下：

1. **官方考綱依據檔案（已找到且確認來源）**：
   - 檔案路徑：根目錄 `173003A17.pdf`（長度 1,378,075 bytes，修改日期 2026/10/23）。
   - 此為勞動部技能檢定中心官方公布之 **17300 網頁設計丙級學科試題本**。正式總題數即為考綱規範之 **611 題**。
2. **目前系統已結構化之題目（示範題庫）**：
   - `frontend/src/data/theoryQuestionsData.ts`：包含 5 題高頻核心考題，完整具備題號、考綱分類、題目、選項、正確答案、詳細解析與蘇格拉底提示。
   - `frontend/src/data/unifiedQuestionBankData.ts`：包含 32 題結構化題目（涵蓋單選、程式題等題型）。
3. **未取得／尚未轉換之資料**：
   - 官方 PDF（`173003A17.pdf`）所包含之剩餘 579 題尚未被批次解析並轉換為系統之 TypeScript 結構化資料。
4. **誠實原則承諾**：
   - **本專案嚴格禁止使用 AI 或隨機產生假題目來灌水湊足 611 題**。
   - 目前系統介面明確註記「依勞動部 173003A17 官方考綱，正式學科題庫約 611 題。本示範模組提供高頻核心題示範」，向使用者保持最高誠實度。

---

## 八、跨頁面整合與回歸狀態檢查

1. **學習進度與錯題本統計連動**：
   - 在 `TheoryPracticePage` 答錯題目後，即時觸發 `recordWrongAttempt`，錯題立即被加入至該使用者（或訪客）之專屬本機紀錄中。
   - 跳轉至 `LearningProgressPage`，頁面透過 `useEffect` 與 `useAuth` 動態調用 `getWrongQuestionsStats(userId)`，即時同步顯示未掌握錯題數量，不再呈現寫死之假數據。
2. **頁面重整與復原**：
   - 重新整理網頁後，資料自 `localStorage` 依金鑰解析還原；若遇到金鑰內容損毀，自動降級為預設空狀態，保證頁面不白屏。
3. **既有法律頁面與防護測試**：
   - `frontend/tests/legal-routes.test.tsx`（5 tests）與 `frontend/tests/sources-route-protection.test.tsx`（7 tests）全數通過，保證隱私政策、服務條款與考題來源標示完全正常。

---

## 九、集中測試結果與實體數據

### 9.1 Vitest 自動化測試執行結果
全專案 6 個測試套件、共 36 項測試案例**全數通過（100% PASS）**：

```text
 RUN  v5.1.0 C:/Users/user/Documents/CODE-TO-KNOW

 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests) 9ms
 ✓ frontend/tests/learning-storage.test.ts (6 tests) 13ms
 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests) 14ms
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests) 8ms
 ✓ frontend/tests/legal-routes.test.tsx (5 tests) 5ms
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests) 32ms

 Test Files  6 passed (6)
      Tests  36 passed (36)
   Start at  12:40:43
   Duration  461ms
```

### 9.2 TypeScript 型別檢查與 Vite 生產打包
```text
> code-to-know-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1616 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.71 kB
dist/assets/index-HmsvxDpa.css   14.22 kB │ gzip:   3.50 kB
dist/assets/index-BEKanFB1.js   543.59 kB │ gzip: 161.13 kB
✓ built in 1.76s
```
**編譯結果**：0 Errors，0 Failures。

---

## 十、尚未解決問題與技術限制

1. **AUTH-03 限制**：
   - 由於 AUTH-03 依然維持 `BLOCKED`，目前學習進度與錯題本僅能支援「瀏覽器本機 LocalStorage」儲存與帳號隔離，尚未連接後端資料庫實現跨裝置即時雲端同步。
2. **題組 1～4 的深入步驟編製**：
   - 題組 1～4 的官方素材雖已齊備，但尚未建立如題組五深度的「10 步驟圖文解說、排版防呆與自我查核清單」。
3. **611 題題庫自動化剖析器**：
   - 目前尚待撰寫離線腳本將 `173003A17.pdf` 批次轉換為結構化 JSON/TS 資料。

---

## 十一、正式 UID 完成度評估與建議

依據本次修正成果與客觀測試數據，建議之 UID 評估完成度如下（**未經使用者指示前，正式清冊與整體進度嚴格不變**）：

| UID | 目前基準狀態 | 建議狀態 | 本批成果完成度評估 | 具體證據 |
| :--- | :---: | :---: | :---: | :--- |
| **P13-STU-007** | `PARTIAL` (50%) | `PARTIAL` | **60%** | 完成題組 1～5 全部 85 個官方素材之物理盤點；題組五完成 25 素材深度索引。 |
| **P13-STU-008** | `PARTIAL` (50%) | `PARTIAL` | **90%** | 題組五雙版本架構就緒、標籤用詞誠實嚴謹、10 步驟與防呆指引就緒；僅剩版本 B 外部連網影片驗證。 |
| **P13-STU-004** | `PARTIAL` (50%) | `PARTIAL` | **65%** | 題型作答、答案判定、蘇格拉底提示與錯題收錄機制全部正常運作且通過測試。 |
| **P13-STU-010** | `PARTIAL` (60%) | `PARTIAL` | **80%** | 完成錯題本自動記錄、答對翻轉掌握、統計分析、重設防護與多帳號 LocalStorage 嚴密隔離。 |
| **P13-STU-001** | `PARTIAL` (50%) | `PARTIAL` | **55%** | 學生儀表板與錯題本、術科練習之導覽與訪客隔離已打通。 |
| **P13-STU-011** | `PARTIAL` (50%) | `PARTIAL` | **60%** | 學習進度頁已動態整合錯題弱點分佈與待複習清單。 |

- **全專案整體基準進度**：`45.961878%`（顯示 `45.96%`）維持不變。
- **AUTH-03**：`BLOCKED`（維持阻斷）。

---

## 十二、下一批建議工作規劃

1. **規劃 173003A17.pdf 官方 611 題解析管線**：
   - 建立安全離線腳本，解析官方 PDF 題庫並驗證答案正確性，批次轉換為系統標準題庫格式。
2. **題組 1（104301 校園社團介紹網）步驟深化**：
   - 參考題組五模式，依據 `173003B12.pdf` 規範將題組一的 11 個素材與頁框佈局拆解為標準操作步驟與自我查核表。
3. **測試共用環境配置（Vitest Setup）**：
   - 將 LocalStorage Mock 移至 Vitest 全域設定檔，進一步精簡個別測試檔案代碼。

---

報告產出路徑：[PHASE13_FIRST_CONSOLIDATED_FIX_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PHASE13_FIRST_CONSOLIDATED_FIX_REPORT.md)
工作已全部完成並就緒，請指示下一步安排。
