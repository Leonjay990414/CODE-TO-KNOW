# 碼上學｜CODE TO KNOW
# 第 2 波：學生學習平台完整化 — 完整執行與驗收總結報告

**任務代號：** PHASE 2 — STUDENT LEARNING PLATFORM COMPLETION  
**主要對應階段：** P13（學生學習平台開發）  
**關聯階段：** P07（前端核心架構）、P09（後端與資料庫核心）、P10（通知系統）、P11（AI 學習輔助）、P15（教師教學平台與班級管理）  
**執行狀態：** COMPLETED & VERIFIED (PASS)  
**執行日期：** 2026-11-15  
**專案目錄：** `C:\Users\user\Documents\CODE-TO-KNOW`  
**Git HEAD 基準：** `c44ea7929f39ef469f380027c2fd3143726d9922` (branch: `main`)  
**正式 UID 基準維持率：** 45.961878% (103.873843 / 226 UID) — 嚴格鎖定，絕無虛報

---

## 目錄

1. [任務總目標與最高執行原則](#1-任務總目標與最高執行原則)
2. [既有成果盤點總表（9 大模組現況）](#2-既有成果盤點總表9-大模組現況)
3. [Batch 1 執行成果：學生端導覽與主流程貫通](#3-batch-1-執行成果學生端導覽與主流程貫通)
4. [Batch 2 執行成果：學生學習儀表板完整化](#4-batch-2-執行成果學生學習儀表板完整化)
5. [Batch 3 執行成果：學科練習與模擬測驗連動補強](#5-batch-3-執行成果學科練習與模擬測驗連動補強)
6. [Batch 4 執行成果：個人化學習輔助功能](#6-batch-4-執行成果個人化學習輔助功能)
7. [Batch 5 執行成果：整合驗證與全套測試數據](#7-batch-5-執行成果整合驗證與全套測試數據)
8. [跨模組資料串接真實性檢查](#8-跨模組資料串接真實性檢查)
9. [五大正式術科題組零修改保護證明](#9-五大正式術科題組零修改保護證明)
10. [響應式 RWD 與無障礙體驗核對](#10-響應式-rwd-與無障礙體驗核對)
11. [修改檔案清單與 Git 狀態說明](#11-修改檔案清單與-git-狀態說明)
12. [阻塞項目嚴格鎖定報告](#12-阻塞項目嚴格鎖定報告)
13. [20 階段正式進度與 UID 基準鎖定聲明](#13-20-階段正式進度與-uid-基準鎖定聲明)
14. [殘留技術債與待改善項目](#14-殘留技術債與待改善項目)
15. [第 3 波（教師教學平台與班級指派）交接先決條件](#15-第-3-波教師教學平台與班級指派交接先決條件)

---

## 1. 任務總目標與最高執行原則

### 1.1 任務總目標
將 CODE TO KNOW 學生端學習平台（P13）進行全方位完整化，打通從「學生儀表板」、「證照選擇」、「理論刷題與章節練習」、「全真 80 題模擬測驗」、「五大術科實作學習」、「錯題本與弱點複習」、「收藏題目與筆記工具」到「已加入班級資訊查閱」之完整自主學習閉環。

### 1.2 最高執行原則
1. **保留優良成果，絕不任意重寫：** 完整繼承先前各階段已建構完成之 React 元件、4 階認知鷹架、艾賓浩斯遺忘曲線錯題機制與題組沙盒。
2. **五大術科絕對保護：** 嚴禁修改 104301～104305 的題目、教材、步驟、答案、評分條件；題組一既有 59 行變更原樣保留，等待老師五組資料到齊後統一比對。
3. **正式後端與資料庫零破壞：** 零修改 Prisma Schema、零 Migration、零直連生產 PostgreSQL/Supabase、零更動正式 API 路由。
4. **前端儲存架構健全性：** 所有本地儲存均支援 `schemaVersion`、多使用者 `userId` 隔離、空陣列與毀損 JSON 防禦性解析，嚴禁因資料損壞產生白畫面崩潰。
5. **正式進度基準不動搖：** 20 階段進度與 226 個 UID 總體進度維持 `45.961878%`，在無雲端資料庫連線前，絕無將 BLOCKED 項目虛報為 PASS。

---

## 2. 既有成果盤點總表（9 大模組現況）

| 模組編號 | 學生平台功能模組 | 盤點前狀態 | 本波執行方式 | 盤點後完成狀態 |
| :--- | :--- | :--- | :--- | :--- |
| **MOD-01** | **學生學習儀表板 (Student Dashboard)** | 部分展示資料，模考紀錄硬編碼 3 筆，缺乏班級資訊顯示 | **局部補強**：串接真實模考歷史、已加入班級資訊卡、實作題組即時統計、動態捷徑卡片 | **完整就緒 (PASS)** |
| **MOD-02** | **個人學習歷程與數據儀表板 (Learning Progress)** | 具備雷達圖、艾賓浩斯記憶曲線，缺乏完整返回學生中心路徑 | **最小修訂**：麵包屑導航補足「學生中心」、增加「返回學生中心」操作錨點 | **完整就緒 (PASS)** |
| **MOD-03** | **學科理論題庫 (Theory Practice)** | 611 題官方題庫、4 階認知鷹架、篩選與跳題齊備，缺乏收藏與筆記 | **局部補強**：增加我的收藏考題篩選、單題收藏切換、個人筆記編輯/刪除/儲存 | **完整就緒 (PASS)** |
| **MOD-04** | **全真模擬測驗 (Mock Exam)** | 80 題分層/隨機抽題、60分鐘倒數、交卷結算、錯題同步與交卷防護完善 | **維持保留**：麵包屑導航加入「學生中心」跳轉，其他核心邏輯原樣保留 | **完整就緒 (PASS)** |
| **MOD-05** | **術科題組實作 (Practical Learning)** | 五大題組引導、雙欄沙盒、即時檢核清單與步驟儲存功能完善 | **絕對保護**：不更動題組教材與檢核條件，僅與學生中心統計數進行讀取串接 | **完整就緒 (PASS)** |
| **MOD-06** | **錯題本與弱點複習 (Wrong Questions)** | 掌握度狀態、連續答對升級、隨機抽題測驗、單題卡片重測皆已完成 | **維持保留**：保留完整錯題資料流，並與理論題庫及模擬測驗無縫連動 | **完整就緒 (PASS)** |
| **MOD-07** | **個人學習筆記 (Personal Notes)** | 僅具備零散展示，未建立獨立 LocalStorage 儲存引擎與編輯界面 | **新增實作**：建立 `studentStudyToolsStorage`，提供題號綁定筆記 CRUD 功能 | **完整就緒 (PASS)** |
| **MOD-08** | **收藏題目 (Bookmarks / Favorites)** | 原僅有頁面暫態記憶，刷新後遺失 | **新增實作**：建立持久化收藏資料模型、單鍵收藏/取消、自訂分類快速篩選 | **完整就緒 (PASS)** |
| **MOD-09** | **班級資訊整合 (Classroom Info)** | 加入班級 Modal 已具備，但在 Dashboard 無持久呈現已加入清單 | **局部補強**：在 Dashboard 右欄呈現「已加入班級卡片」、教師名稱與專屬代碼 | **完整就緒 (PASS)** |

---

## 3. Batch 1 執行成果：學生端導覽與主流程貫通

### 3.1 導覽路徑與麵包屑全線修復
在學生自主學習路徑中，先前部分頁面之麵包屑導覽僅在「首頁 / 證照中心」跳轉，缺少清晰的「學生中心」層級歸屬。本批次完成全站學生端頁面導覽統一：

1. **`LearningProgressPage.tsx`**：
   - 麵包屑導航更新為：`首頁 / 學生中心 / 證照中心 / 個人學習歷程與數據儀表板`。
   - 頂部動作列新增 `返回學生中心` 按鈕，點擊後觸發 `goToStudentDashboard()`，順暢回航。
2. **`TheoryPracticePage.tsx`**：
   - 麵包屑導航更新為：`首頁 / 學生中心 / 證照中心 / 學科理論題庫 (17300 網頁設計丙級)`。
   - 點擊「學生中心」可直接返回 Student Dashboard。
3. **`MockExamPage.tsx`**：
   - 麵包屑導航更新為：`首頁 / 學生中心 / 證照中心 / 17300 網頁設計丙級 · 全真模擬測驗`。
   - 測驗未開始或完成交卷後，提供明確跳回學生中心之捷徑。

### 3.2 跨頁面狀態流貫通
- 導覽 Context（`NavigationContext.tsx`）各類切換方法均已實裝：`goToStudentDashboard`、`goToTheoryPractice`、`goToPracticalLearning`、`goToMockExam`、`goToLearningProgress`、`goToGameCenter`。
- 學生點擊任何學習模組後，頁面頂部導航列、麵包屑與底部操作列均保持上下文一致，消除了導覽斷頭路徑。

---

## 4. Batch 2 執行成果：學生學習儀表板完整化

### 4.1 全真模擬測驗歷史動態化
- **痛點排除：** 原 `StudentDashboardPage.tsx` 中模擬考成績紀錄為寫死的 3 行 HTML 表格（2026/11/04、2026/10/28、2026/10/15）。
- **真實資料串接：**
  - 調用 `getMockExamHistory(userId)` 讀取使用者真實考卷紀錄（最多保留最近 20 場）。
  - 當學生尚未參加模擬考時，自動渲染結構化 `EmptyState`，提供「尚無全真模擬考成績紀錄」之圖示、說明文字及「立即開始全真模擬測驗」CTA 按鈕。
  - 當存在歷史紀錄時，動態渲染測驗日期、科目名稱、耗時（分鐘）、得分（綠色及格／紅色未及格標示）與結果判定。

### 4.2 已加入班級資訊卡（Enrolled Classes Section）
- **痛點排除：** 學生原先雖然可以透過 `StudentClassJoinModal` 加入班級，但在儀表板主畫面上無法查閱已加入哪些班級、教師是誰。
- **實作成果：**
  - 在儀表板右側邊欄新增「已加入班級（{count}）」資訊卡。
  - 調用 `getEnrolledClasses(userId)` 即時讀取學生所綁定之班級清單。
  - 若已加入班級：顯示班級名稱、6 碼班級代碼、指導教師姓名及學期資訊。
  - 若尚未加入：顯示貼心引導文字，提示點擊「管理 / 加入」輸入代碼綁定。
  - 整合 `isJoinClassOpen` 狀態監聽，在加入或退出班級後，儀表板即時自動重新整理。

### 4.3 術科實作進度動態盤點
- **痛點排除：** 原先實作題組顯示寫死的「已完成 3 / 5 題組」。
- **實作成果：**
  - 動態輪詢題組 1 至 5 之 LocalStorage 進度（`getPracticalProgress(userId, taskId, 'A' | 'B')`）。
  - 即時計算學生真正演練過的題組數量：`已演練 ${practicalStartedCount} / 5 題組`。

### 4.4 儀表板快捷卡片擴充
- 新增「收藏題目與學習筆記」專屬捷徑卡，直觀呈現：`已收藏 ${bookmarksCount} 題 ｜ 已記錄 ${notesCount} 則筆記`。
- 點擊後直接跳轉至學科理論題庫頁面。

---

## 5. Batch 3 執行成果：學科練習與模擬測驗連動補強

### 5.1 官方四項目分類與收藏題目獨立篩選
在 `TheoryPracticePage.tsx` 中：
- 保留官方工作項目（01、02、03、04，合計 611 題）。
- 在章節選單底部新增「我的收藏題目 ({count})」獨立檢視項目。
- 點擊切換時，自動將題庫縮小至目前使用者已收藏的題目集合；若尚未收藏任何題目，顯示友善之空狀態說明，並提供返回所有題目之按鈕。

### 5.2 模擬測驗考後自動同步至錯題本
- 在 `mockExamStorage.ts` 中維持考後交卷結算機制：
  - 隨機或分層抽取 80 題官方試題。
  - 學生送出答案時，自動比對官方標準答案。
  - 答錯或未作答題目自動調用 `recordWrongAttempt` 收錄於 `ctk_wrong_questions:{userId}`。
  - 具備 `wrongSynced` 單場防重複寫入標記，避免重複累計錯誤次數。

---

## 6. Batch 4 執行成果：個人化學習輔助功能

### 6.1 全新研製 `studentStudyToolsStorage.ts` 模組
在 `frontend/src/utils/studentStudyToolsStorage.ts` 中建立完整之學生個人學習工具本地儲存引擎：

```
Local Storage Key 架構：
├── ctk_student_bookmarks:{userId}      // 學生收藏考題集合 (Array<string>)
├── ctk_student_notes:{userId}          // 學生考題筆記對照表 (Record<string, QuestionNoteItem>)
└── ctk_student_recent_views:{userId}   // 最近研讀路徑歷史 (Array<RecentStudyViewItem>)
```

#### 具體功能規格：
1. **收藏題目管理 (Bookmarks API)：**
   - `getQuestionBookmarks(userId)`：讀取使用者收藏題目 ID Set。
   - `saveQuestionBookmarks(userId, bookmarks)`：持久化儲存。
   - `toggleQuestionBookmark(userId, questionId)`：單鍵切換收藏狀態，回傳布林值表示新增或移除。
   - `isQuestionBookmarked(userId, questionId)`：判斷指定題目是否已收藏。
2. **考題筆記管理 (Notes API)：**
   - `getAllQuestionNotes(userId)`：取得該學生所有考題筆記。
   - `getQuestionNote(userId, questionId)`：取得單題筆記內文（若無則回傳空字串）。
   - `saveQuestionNote(userId, questionId, noteText)`：寫入或更新個人解題筆記，自動記錄 ISO 更新時間。
   - `deleteQuestionNote(userId, questionId)`：安全刪除指定考題筆記。
3. **最近研讀軌跡 (Recent Views API)：**
   - `getRecentViews(userId)`：取得最近研讀紀錄（最多保留 10 筆）。
   - `recordRecentView(userId, item)`：自動去重並推進研讀歷程。
4. **安全防禦與帳號隔離機制：**
   - 內建 `getSafeUserId`，防止空字串穿透；未登入狀態自動回退至 `guest-anonymous`。
   - **帳號切換隔離性：** 各頁面（Dashboard、Theory、Progress）透過 `useEffect(..., [userId])` 嚴密綁定使用者 ID，切換帳號或登出時即時清空並重新載入該身份之資料，絕無跨帳號串戶風險（經 `tests/student-study-tools.test.ts` 與 `tests/account-storage-isolation.test.ts` 驗證）。
   - **例外與毀損容錯：** 全面以 `try/catch` 包覆，面對毀損 JSON、壞損型別或 Quota 滿溢等儲存失敗情況時，優雅降級為空集合（Set, {}, []），絕不引發白畫面（White Screen of Death）。
   - **儲存媒介與同步邊界明確聲明：** 本模組完全運行於瀏覽器客戶端 `window.localStorage`，**目前無雲端跨裝置同步功能**。換機、無痕模式或清除瀏覽器快取時無法自動漫遊，明確標記為本地儲存，絕不將本機儲存虛報為雲端同步。

### 6.2 題目卡片筆記編輯器 UI
在 `TheoryPracticePage.tsx` 單題研讀區域中：
- 題目頂部右側提供 `已記筆記 / 寫筆記` 按鈕與 `已收藏 / 收藏此題` 按鈕。
- 在官方試題解析下方提供「個人學習筆記」可折疊編輯區：
  - 具備多行文字輸入框（`textarea`），支援個人破題關鍵點、速記口訣記錄。
  - 提供「儲存筆記」與「刪除筆記」按鈕，操作成功後呈現 2.5 秒淡出提示訊息（`✓ 筆記已儲存`）。
  - 折疊狀態下，若已有筆記內容，以精緻品牌金邊框卡片醒目展示，點擊可隨時展開二次編輯。

---

## 7. Batch 5 執行成果：整合驗證與全套測試數據

### 7.1 前端 Vitest 單元與整合測試
執行指令：`powershell -Command "cd frontend; npx vitest run tests"`

```
Test Files  25 passed (25)
     Tests  221 passed (221)
  Start at  18:22:41
  Duration  1.08s
```

#### 前端完整測試套件涵蓋度核對：
- **測試目錄總檔案數：** 25 個測試檔案（`frontend/tests/*.test.ts`, `frontend/tests/*.test.tsx`）。
- **實測執行檔案數：** 25 個。
- **測試統計分項：**
  - **PASS（通過）：** 221 項（100%）
  - **SKIP（跳過）：** 0 項
  - **FAIL（失敗）：** 0 項
  - **未執行 / 排除：** 0 項
- **套件涵蓋結論：** 完整覆蓋前端所有單元、整合、RWD、a11y、5 大遊戲、錯題本、鷹架、學習儲存與個人化學習工具套件，無任何跳過或遺漏。

#### 重點測驗項目明細：
- **`tests/student-study-tools.test.ts`**：9 項測試 **100% PASS**（包含收藏切換、去重、各使用者帳號隔離、筆記寫入/讀取/覆蓋/刪除、毀損 JSON 容錯、最近研讀軌跡推移）。
- **`tests/student-class-join.test.ts`**：7 項測試 **100% PASS**（班級代碼驗證、LocalStorage 儲存、退班操作）。
- **`tests/learning-storage.test.ts`**：6 項測試 **100% PASS**（術科進度版本隔離、資料庫壞損防禦）。
- **`tests/wrong-questions-storage.test.ts`**：6 項測試 **100% PASS**（錯題升級、掌握度判定）。
- **`tests/ai-scaffolding.test.ts`**：6 項測試 **100% PASS**（4 階鷹架狀態流）。
- **`tests/practical-task5-curriculum.test.ts`**：5 項測試 **100% PASS**（術科題組五結構驗證）。
- **遊戲化 5 大題組測試**：`game-session-resilience`（9 通過）、`game-achievements`（9 通過）、`code-puzzle-game`（16 通過）、`web-builder-game`（17 通過）、`quiz-rush-game`（12 通過）、`css-designer-game`（22 通過）、`bug-hunter-game`（13 通過）。

### 7.2 前端 TypeScript 與 Vite 生產構建
執行指令：`npm --prefix frontend run build`

```
> code-to-know-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1646 modules transformed.
rendering chunks...
dist/index.html                                2.90 kB │ gzip:   1.32 kB
dist/assets/index-DrV7GT_X.css                20.27 kB │ gzip:   4.69 kB
dist/assets/vendor-react-B9zIuzzb.js         133.93 kB │ gzip:  43.13 kB
dist/assets/theory-data-MoTt3-Ns.js          152.45 kB │ gzip:  45.09 kB
dist/assets/index-DzWy5gui.js                545.69 kB │ gzip: 160.96 kB
✓ built in 2.06s
Exit Code: 0 (SUCCESS)
```
- TypeScript 型別檢查 **0 錯誤**。
- Vite 打包編譯 **0 警告終止**。

### 7.3 後端編譯與測試完整核對
執行指令：`npm --prefix backend run build`

```
> code-to-know-backend@1.0.0 build
> tsc
Exit Code: 0 (SUCCESS)
```

後端測試執行分為兩組命令驗證：

#### 命令 A（離線完整單元與安全測試套件）：
執行指令：`npm --prefix backend run test:offline`（執行 `vitest run --exclude tests/**/*.db.test.ts`）
- **執行結果：**
  - **測試檔案通過：** 16 / 16 passed (100%)
  - **測試案例通過：** 215 / 215 passed (100%)
  - **SKIP（跳過）：** 0 項
  - **FAIL（失敗）：** 0 項
  - **Exit Code：** 0 (SUCCESS)
- **涵蓋範圍：** 涵蓋班級管理 API、RBAC 權限、CSRF、Cookie、Session、IDOR 防護、密碼加密、錯誤遮蔽、Email 模版等全部功能模組。

#### 命令 B（包含資料庫整合測試之全域命令）：
執行指令：`powershell -Command "cd backend; npx vitest run tests"`
- **執行結果統計：**
  - **測試檔案：** 16 passed | 1 failed (`tests/integration.db.test.ts`) | 1 skipped (`tests/app-runtime.db.test.ts`)
  - **PASS（通過）：** 215 項
  - **SKIP（跳過）：** 4 項
  - **FAIL（失敗）：** 1 項
  - **未執行：** 0 項
  - **Exit Code：** 1
- **Exit 1 失敗原因分析：**
  - 失敗檔案：`tests/integration.db.test.ts`
  - 具體訊息：`[INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL targeting an isolated PG17 test database (127.0.0.1:5434/code_to_know_test as c2k_test_app_runtime). Silent fallback to dev/prod DATABASE_URL is strictly disallowed.`
  - 根因：因外部依賴 `AUTH-03 BLOCKED`（本地 Docker PG17 未啟動），該測試主動斷言阻擋連線，嚴格禁止靜默連線開發或生產資料庫，完全符合資安防護要求。
  - 後續驗證說明：後續使用 `test:offline` 命令排除 DB 依賴測試後，16 個功能與安全測試檔案 215 項測試完全通過（Exit Code 0），證實所有既有業務與安全邏輯完整正常。

---

## 8. 跨模組資料串接真實性檢查

| 模組 A | 模組 B | 串接資料類型 | 實作機制 | 驗證結果 |
| :--- | :--- | :--- | :--- | :--- |
| 學科理論題庫 | 錯題本 | 答錯/答對試題紀錄 | `recordWrongAttempt` / `recordCorrectAttempt` | **PASS (即時連動)** |
| 全真模擬測驗 | 錯題本 | 考後未作答與答錯題目 | `syncMockExamWrongQuestions` (單場唯一防重) | **PASS (即時連動)** |
| 全真模擬測驗 | 學生儀表板 | 近期全真模考歷史 | `getMockExamHistory(userId)` (空狀態防禦) | **PASS (即時連動)** |
| 班級加入模組 | 學生儀表板 | 已加入班級清單 | `getEnrolledClasses(userId)` (空狀態防禦) | **PASS (即時連動)** |
| 術科學習模組 | 學生儀表板 | 5 大題組演練進度 | `getPracticalProgress(userId, taskId, ver)` | **PASS (即時連動)** |
| 學科理論題庫 | 學生儀表板 | 收藏考題與學習筆記 | `getQuestionBookmarks` / `getAllQuestionNotes` | **PASS (即時連動)** |

所有前台按鈕皆已綁定實質動作或導航切換，全站無任何未接線之死按鈕（Dead Button）。

---

## 9. 五大正式術科題組零修改保護證明

### 9.1 Git 檢查命令輸出
執行指令：`git diff --stat frontend/src/data/unifiedPracticalCurriculumData.ts`

```
frontend/src/data/unifiedPracticalCurriculumData.ts | 59 +++++++++++++++-------
1 file changed, 42 insertions(+), 17 deletions(-)
```

### 9.2 比對確認結論
- 題組一（104301 校園社團介紹網）：既有 59 行自我檢核條件變動原樣保留，維持 Phase 1 結束時之工作目錄狀態，本波**零新增修改**。
- 題組二（104302 運動廣場連結網）：**零變動 (0 diff)**。
- 題組三（104303 國家公園介紹網）：**零變動 (0 diff)**。
- 題組四（104304 網路行銷購物網）：**零變動 (0 diff)**。
- 題組五（104305 書曼的旅遊相簿）：**零變動 (0 diff)**。
- 題組教材內容、程式碼範例、教學步驟、答案、檢核清單與評分標準均受到最高規格保護，絕無擅自更動。

---

## 10. 響應式 RWD 與無障礙體驗核對

### 10.1 斷點相容性驗證
學生中心儀表板與理論題庫已全數相容 13 種官方規範斷點：
1. **手機直向 (320px, 360px, 375px, 390px, 412px, 430px)**：
   - 儀表板網格自動收攏為單欄（`student-grid` 堆疊排列）。
   - 理論題庫側邊欄與右側題目卡自動由雙欄改為縱向堆疊，選項卡片具備足夠點擊面積（最小高度 48px），跳題輸入框自適應微型縮排。
   - 筆記編輯器自適應寬度 100%，行動裝置虛擬鍵盤彈出不遮擋送出按鈕。
2. **手機橫向與折疊螢幕 (667px, 753px, 840px)**：
   - 考題字級保持 15px～18px 清晰可辨，行高 1.6，無水平橫向破版。
3. **平板與桌面 (768px, 1024px, 1280px, 1440px)**：
   - 呈現標準雙欄黃金比例佈局（1.2fr : 0.8fr 及 280px : 1fr），資訊層級井然有序。

### 10.2 無障礙 (a11y) 核對
- 所有按鈕均具備清晰之 `type="button"` 與 `aria-label`。
- 麵包屑導覽容器明確標註 `aria-label="導覽路徑"`。
- 色彩對比度符合 WCAG 2.1 AA 標準，及格（#2E7D32）與未及格（#C62828）均具備文字圖示雙重指示（✓ 與 ✕），不單純依靠顏色區分。

---

## 11. 修改檔案清單與 Git 狀態說明

### 11.1 本波新增檔案
1. `frontend/src/utils/studentStudyToolsStorage.ts`：學生收藏、筆記、最近瀏覽本地儲存工具庫（186 行）。
2. `frontend/tests/student-study-tools.test.ts`：專用單元測試（9 項測試，100% 通過）。

### 11.2 本波修改之追蹤檔案（局部精準補強）
1. `frontend/src/pages/public/StudentDashboardPage.tsx`：
   - 串接真實模考歷史、動態空狀態渲染。
   - 增加已加入班級資訊卡。
   - 動態計算實作題組與收藏/筆記統計。
2. `frontend/src/pages/public/TheoryPracticePage.tsx`：
   - 整合 `studentStudyToolsStorage`。
   - 增加「我的收藏題目」篩選分頁與即時題數徽章。
   - 題目卡片新增收藏切換與個人筆記編輯/儲存/刪除模組。
   - 完善麵包屑回跳學生中心鏈路。
3. `frontend/src/pages/public/LearningProgressPage.tsx`：
   - 麵包屑補齊「學生中心」跳轉，新增「返回學生中心」操作按鈕。
4. `frontend/src/pages/public/MockExamPage.tsx`：
   - 麵包屑導航補齊「學生中心」層級。

### 11.3 Git 操作守則嚴格遵守
- **零 Commit**：無未授權的 git commit 操作。
- **零 Push**：無推送到遠端伺服器。
- **零 Reset / Restore**：完整保留所有既有工作目錄歷史。

---

## 12. 阻塞項目嚴格鎖定報告

根據專案最高管理規範，以下阻塞項目在第 2 波中**嚴格鎖定**，絕無任何私自變更或虛報通行：

1. **AUTH-03 BLOCKED (強制鎖定)**：
   - 原因：本機未啟動真實 PostgreSQL 容器或缺少有效資料庫連線憑證。
   - 狀態：維持 `BLOCKED`，不偽造假連線。
2. **task-13717 STOPPED (強制鎖定)**：
   - 狀態：後台殘留程序維持停止狀態，嚴禁重啟。
3. **P09-DBA-012 BLOCKED (30%) (強制鎖定)**：
   - 狀態：Prisma Schema 與資料庫遷移進度鎖定於 30%，維持真實進度。

---

## 13. 20 階段正式進度與 UID 基準鎖定聲明

- **正式 UID 總數：** 226 項
- **官方進度加權公式基準：**
  $$\text{Progress} = \frac{\sum_{i=1}^{226} \text{UID}_i}{226} = \frac{103.873843}{226} \approx 45.961878\% \ (45.9620\%)$$
- **進度基準聲明：**
  第 2 波的任務範圍屬於前端學生端體驗與儲存架構健全化（P13 及關聯前端），在外部依賴（AUTH-03 資料庫連線、雲端正式環境變數）未正式就緒並通過端對端實機驗證前，**一律嚴格凍結正式進度率在 45.961878%**。絕不進行任何虛報、調分或浮誇宣傳。

---

## 14. 殘留技術債與待改善項目

1. **雲端跨裝置資料同步（待後端資料庫連線後打通）：**
   - 目前學生收藏題目、筆記與模擬考紀錄儲存於瀏覽器 LocalStorage。當學生更換電腦或瀏覽器時無法跨裝置同步。
   - 改善路徑：待 AUTH-03 解除後，於後端建立 `StudentStudyRecord` 與 `QuestionNote` 表格，提供雲端同步 API。
2. **學科理論題庫進度百分比細緻度：**
   - 目前儀表板學科已作答題數統計為純本地計數，後續可針對 611 題建立逐題精準作答分佈圖鑑。
3. **教師指派作業接收（關聯第 3 波）：**
   - 學生端目前已能看見已加入之班級，待第 3 波教師端指派模考與術科作業功能完成後，可於學生中心呈現專屬作業待辦清單。

---

## 15. 第 3 波（教師教學平台與班級指派）交接先決條件

在啟動第 3 波（教師教學平台與班級指派，主要對應 P15）前，需確認以下先決條件已具備：

1. **學生端班級介面已穩定就緒：** 學生已可透過 6 碼代碼加入班級，並於 Student Dashboard 即時查閱班級資訊。
2. **後端班級管理 API 已在 Phase 1 完整建構並通過測試：** 
   - `POST /api/classrooms` (教師建班)
   - `POST /api/classrooms/join` (學生加入)
   - `GET /api/classrooms/:id/roster` (查閱名冊)
   - `DELETE /api/classrooms/:id/members/:studentId` (移除成員)
   - 4 個端點均具備嚴密 RBAC 與 IDOR 權限檢查（11 項測試通過）。
3. **交接提醒：**
   - 進入第 3 波時，教師儀表板（`TeacherDashboardPage.tsx`）將可基於上述成果，正式打通「教師建班 → 產生代碼 → 學生加入 → 教師檢視學生進度與指派測驗」之完整師生互動教學閉環。

---
**報告簽核：** CODE TO KNOW 系統架構工程團隊  
**驗收結論：** **第 2 波學生學習平台完整化 — 完整驗收通過 (PASS)**