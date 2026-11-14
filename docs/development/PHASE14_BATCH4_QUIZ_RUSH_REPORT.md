# CODE TO KNOW 碼上學｜Phase 14 第 4 批：Quiz Rush 證照疾速快答開發報告

**專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）  
**開發階段**：Phase 14｜互動遊戲與遊戲化學習系統（第 4 批次）  
**核心工作項目**：`P14-GAM-007` 互動遊戲：Quiz Rush 疾速快答  
**關聯工作項目**：`P14-GAM-002`、`P14-GAM-003`、`P14-GAM-010`、`P14-GAM-012`、`P13-STU-004`、`P13-STU-010`  
**報告產出時間**：2026-11-14  
**執行環境**：Windows（PowerShell）、Node.js v20、TypeScript 5.x、Vite 5.x、React 18  
**基準進度維持**：45.961878%（嚴格鎖定，未經專案經理正式稽核指令不更動）  
**驗證結果**：前端 14 個測試套件共 144 項測試全數通過（100% PASS）、TypeScript 編譯 0 警告 0 錯誤、Vite 正式生產建置成功。

---

## 一、本批次開發成果摘要

本批次為「碼上學｜CODE TO KNOW」平台 Phase 14 互動遊戲系統的第四款核心遊戲：**Quiz Rush｜證照疾速快答**。

本遊戲旨在將 Phase 13 所整理收錄的勞動部技術士技能檢定「網頁設計（丙級）」**605 題官方有效真實學科題庫**，轉化為具備即時回饋、倒數計時、連擊累積與多模式選擇的快節奏互動問答遊戲。

### 核心亮點與指標

1. **真實驗證題庫全量支援**：
   - 完整載入 `ALL_OFFICIAL_THEORY_QUESTIONS` 共 605 題官方真實學科試題，絕無隨機虛構或假造題目。
   - 完整覆蓋四大工作項目：
     - 工作項目 01「作業準備」：236 題
     - 工作項目 02「應用軟體安裝及使用」：233 題
     - 工作項目 03「系統軟體安裝及使用」：71 題
     - 工作項目 04「資訊安全」：65 題
2. **三大遊戲化模式**：
   - **Mode A｜限時快答 (`timed-blitz`)**：每題 15 秒急速倒數，答題剩餘秒數即時轉換為高分獎勵，超時自動判定錯誤並跳題。
   - **Mode B｜連擊挑戰 (`combo-challenge`)**：每題 20 秒倒數，連續答對累積 Combo 倍率（最高每連擊加成 20 分），答錯或超時立即中斷歸零，考驗持續專注與抗壓。
   - **Mode C｜分類精熟 (`category-mastery`)**：無倒數計時壓力，支援四大工作項目單獨精選，作答後即時展開深度官方詳解，專注於概念強化與弱點修復。
3. **與 Phase 13 錯題本雙向同步**：
   - 答錯或超時之題目，自動即時透過 `recordWrongAttempt` 寫入學生專屬本機錯題本（`ctk_wrong_questions:<userId>`）。
   - 於遊戲中答對先前收錄之錯題時，自動調用 `recordCorrectAttempt` 累計連續答對次數；達到 2 次門檻時自動標記為「已精熟」，形成學習閉環。
4. **多帳號資料隔離與防灌水評分**：
   - 儲存鍵值採用 `ctk_game_progress:<userId>:quiz-rush`，遊玩記錄與訪客/特定學生完全隔離。
   - 星級與得分採高標保留（保留歷史最佳成績，避免重複挑戰因嘗試失誤而扣損歷史紀錄）。
5. **遊戲中心完整無縫整合**：
   - 遊戲中心（`GameCenterPage`）狀態由「即將推出」更新為「已開放遊玩（AVAILABLE）」，提供一鍵跳轉 `#games/quiz-rush`。
   - 頂部統計指標動態彙整已開放的 4 款遊戲（Code Puzzle, CSS Designer, Bug Hunter, Quiz Rush）， Web Builder 維持規劃中。

---

## 二、UID 工作清冊與範圍落實

| 項目 UID | 原始清單定義規範 | 本批次實作落實 | 狀態判定 |
| :--- | :--- | :--- | :--- |
| **P14-GAM-007** | 互動遊戲：Quiz Rush 疾速快答。證照學科限時快答、Combo 連擊計分、錯題即時同步。 | 建立 `QuizRushPage.tsx` 與 `quizRushEngine.ts`，支援 605 題真題抽題、3 種遊戲模式、Combo 加乘與錯題本無縫同步。 | **DONE** |
| **P14-GAM-002** | 遊戲積分與成就模型設計。 | 設計基礎答對分、剩餘時間加乘、Combo 連擊倍率公式；星級評定標準（3星>=90%、2星>=70%、1星>=50%）。 | **DONE** |
| **P14-GAM-003** | 遊戲排行榜與個人歷史紀錄。 | 支援本地最佳分數、最高連擊、總答對數、遊玩次數統計與即時結算展示。 | **DONE** |
| **P14-GAM-010** | 遊戲進度與狀態持久化（LocalStorage）。 | 透過 `gameStorage.ts` 實現 `ctk_game_progress:<userId>:quiz-rush` 隔離儲存，具備容錯降級機制。 | **DONE** |
| **P14-GAM-012** | 遊戲大廳導航與各遊戲路由整合。 | 更新 `NavigationContext` 新增 `'quiz-rush'`、`App.tsx` 路由切換、`GameCenterPage` 卡片開放與統計累加。 | **DONE** |
| **P13-STU-004** | 官方 605 題學科題庫資料整合。 | 透過 `questionBankAdapter.ts` 完整串接，題庫題號、工作項目代碼、選項 A-D、解答無偏差映射。 | **DONE** |
| **P13-STU-010** | 個人錯題本與個人化複習整合。 | 遊戲中錯題/超時題目即時寫入 `wrongQuestionsStorage.ts`，答對時推進精熟階段。 | **DONE** |

---

## 三、系統架構與模組設計

### 1. 遊戲核心運算引擎 (`frontend/src/utils/quizRushEngine.ts`)

- **抽題演算法（非破壞性 Fisher-Yates Shuffle）**：
  - 根據題目類別（全部或工作項目 01-04）過濾有效題組。
  - 對題庫副本實施 Fisher-Yates 隨機洗牌，抽取指定數量（預設 10 題），確保各回合抽題完全獨立且單一回合絕不重複。
- **計分與連擊模型**：
  $$\text{得分} = \text{基礎分數 (100)} + (\text{剩餘秒數} \times 10) + (\text{目前 Combo} \times 20)$$
  - 答對：Combo + 1，獲得基礎分 + 剩餘時間獎勵 + 連擊獎勵。
  - 答錯或超時：Combo 立即重置為 0，獲得 0 分。
- **星級評估規則**：
  - 答對率 $\ge 90\%$：3 星（精通熟練）
  - 答對率 $70\% \sim 89\%$：2 星（良好及格）
  - 答對率 $50\% \sim 69\%$：1 星（基礎尚可）
  - 答對率 $< 50\%$：0 星（需要加強複習）

### 2. 遊戲互動介面 (`frontend/src/pages/public/QuizRushPage.tsx`)

- **設定面板（Setup Mode）**：
  - 模式選擇卡片：限時快答、連擊挑戰、分類精熟。
  - 範疇選擇器：全科綜合（605 題）、工作項目 01（236 題）、工作項目 02（233 題）、工作項目 03（71 題）、工作項目 04（65 題）。
  - 歷史成績面板：即時顯示目前使用者的最高得分、最高連擊與累積星數。
- **作答戰鬥 HUD（Playing Mode）**：
  - 頂部狀態列：題號進度（例：第 3/10 題）、動態進度條、當前累積得分、Combo 燃燒圖示與倍率標籤。
  - 倒數計時器（Wall-clock 補償）：採用目標結束時間戳算計，防止瀏覽器分頁背景節流導致計時不準確；剩餘時間小於 5 秒時動態呈現紅色警示震動效果。
  - 官方題目卡：清楚呈現題目編號、所屬工作項目、題目文本。
  - 選項互動按鈕：A、B、C、D 四大按鈕，點擊後即時呈現作答結果（正確為綠色、錯誤為紅色，同時顯露正確答案標記）。
  - 詳解抽屜（Explanation Drawer）：分類精熟模式下自動展開深度詳解，幫助學生掌握考點背後的理論背景。
- **回合結算結報（Result Mode）**：
  - 榮譽獎盃與星級動態展示。
  - 關鍵指標總結：總得分、答對率、最高連擊、答題耗時。
  - 錯題同步提示橫幅：清楚告知使用者已有幾題自動收錄至「錯題本」，並附帶一鍵跳轉至錯題複習專區（`#student/wrong-questions`）之引導按鈕。
  - 重玩本局（重新抽題）與返回遊戲中心按鈕。

### 3. 路由與大廳導覽整合

- `frontend/src/context/NavigationContext.tsx`：
  - 擴充 `Page` 型別支援 `'quiz-rush'`。
  - 新增 `goToQuizRush()` 快捷方法。
  - 網址 Hash 映射支援 `#games/quiz-rush`。
- `frontend/src/app/App.tsx`：
  - 註冊 `QuizRushPage` 頁面元件渲染分支。
- `frontend/src/pages/public/GameCenterPage.tsx`：
  - Quiz Rush 卡片正式解鎖為 `status: 'AVAILABLE'`。
  - 點擊「立即疾速挑戰」直接進入 Quiz Rush。
  - 遊戲中心上方數據統計納入 Quiz Rush 的星數與遊玩統計。

---

## 四、自動化測試覆蓋與驗證

專案已新增 `frontend/tests/quiz-rush-game.test.ts`，共包含 17 項專屬測試，涵蓋題庫精準度、抽題演算法、計分模型、星級評定、錯題本同步與多帳號隔離：

```
 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests)
 ✓ frontend/tests/learning-storage.test.ts (6 tests)
 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests)
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests)
 ✓ frontend/tests/css-designer-game.test.ts (22 tests)
 ✓ frontend/tests/unified-practical-curriculum.test.ts (7 tests)
 ✓ frontend/tests/bug-hunter-game.test.ts (13 tests)
 ✓ frontend/tests/code-puzzle-game.test.ts (14 tests)
 ✓ frontend/tests/mock-exam-system.test.ts (15 tests)
 ✓ frontend/tests/official-theory-question-bank.test.ts (5 tests)
 ✓ frontend/tests/legal-routes.test.tsx (5 tests)
 ✓ frontend/tests/quiz-rush-game.test.ts (17 tests)
 ✓ frontend/tests/wrong-questions-review-system.test.ts (15 tests)
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests)

Test Files  14 passed (14)
     Tests  144 passed (144)
  Duration  676ms
```

### 17 項 Quiz Rush 測試清單

1. `verifies authentic 605 questions are loaded with valid structure` (605 題全量驗證)
2. `verifies official work section distribution matches official standards` (01: 236 題, 02: 233 題, 03: 71 題, 04: 65 題)
3. `draws specified number of random questions without duplicates` (隨機抽題不重複性)
4. `filters drawn questions by specific work section correctly` (工作項目分組精確抽題)
5. `calculates score correctly with time bonus and combo bonus for correct answer` (計分與連擊公式)
6. `awards zero points for incorrect answer or timeout` (答錯與超時零分判定)
7. `evaluates round stars accurately according to accuracy thresholds` (星級閾值評定)
8. `saves game completion to storage with anti-inflation star preservation` (防灌水評分保存)
9. `synchronizes wrong answer directly into wrong questions notebook` (錯題自動收錄錯題本)
10. `synchronizes timeout question as error into wrong questions notebook` (超時自動收錄錯題本)
11. `promotes mastery in wrong questions notebook when user answers correctly in quiz rush` (答對推進精熟)
12. `isolates quiz rush records between different student accounts` (多帳號本機隔離)
13. `handles corrupted storage gracefully with fallback defaults` (異常損毀 JSON 自動防禦)
14. `GameCenter aggregates overall stats across all 4 available games` (遊戲中心 4 遊戲累加統計)
15. `GameCenter displays Quiz Rush as AVAILABLE and Web Builder as UPCOMING` (遊戲狀態與規劃中標記)
16. `NavigationContext supports quiz-rush page navigation and hash routing` (導航與 Hash 路由)
17. `mode definitions match Blitz, Combo, and Mastery specifications` (三大模式定義檢核)

---

## 五、嚴格專案約束檢核清單

- [x] **0 Git Commit / 0 Git Reset / 0 Git Push**：所有變更保留在 Working Tree，未執行任何提交。
- [x] **未修改/刪除/重新命名任何 `index.html`**：`frontend/index.html` 維持乾淨原始入口。
- [x] **0 資料庫 / 0 後端 API / 0 容器變更**：完全依賴純前端架構與本地持久化。
- [x] **AUTH-03 維持 BLOCKED 狀態**：未假造後端驗證，符合安全規範。
- [x] **正式專案進度模型基準維持 45.961878%**：無未經授權之進度灌水。
- [x] **品牌視覺與體驗一致性**：嚴格依循暖象牙白（Warm Ivory）、板岩深灰、香檳金點綴色彩體系，RWD 支援 320px 至 1920px。

---

## 六、下一批次建議規劃

接續原始 20 階段之 **Phase 14 第 5 批**：
1. **P14-GAM-008（Web Builder 網頁架構師）**：開發第五款核心遊戲，讓學生透過積木拖曳或排版組合構建符合語意化 HTML5 之標準網頁結構。
2. **P14-GAM-011（成就與徽章系統）**：將 5 款遊戲之遊玩記錄、連擊數、星數與通關成就串接為徽章展示牆。
3. **Phase 14 綜合驗收與單元覆蓋**：完成全部 5 款遊戲之 E2E 驗收測試。
