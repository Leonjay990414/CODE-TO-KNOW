# CODE TO KNOW｜Phase 14 第 3 批：Bug Hunter 程式除錯獵人開發報告

**專案名稱**：碼上學｜CODE TO KNOW  
**報告日期**：2026-11-14  
**執行階段**：Phase 14｜互動遊戲與遊戲化學習系統（第 3 批）  
**正式全專案進度基準**：45.961878%（呈現 45.96%）  
**AUTH-03 狀態**：BLOCKED（嚴格維持）  
**Git HEAD 錨點**：`310323dee802eb3a940ed947c7c665e147fb19f3`  

---

## 一、執行摘要與前置基準查核

本批次為原始 20 階段規劃中 **Phase 14：互動遊戲與遊戲化學習系統** 第 3 批連續開發工作。
本批次核心交付重點包括：
1. **完成第三款學習微遊戲：Bug Hunter（程式除錯獵人，UID：P14-GAM-006）**：包含 4 大主題關卡、行號點選排查與受控編輯雙操作模式、診斷面板、即時修復、提交校驗、三段漸進提示、星星/積分結算與深度解析復盤。
2. **四大實戰考點關卡**：
   - 第 1 關：HTML 結構除錯（未閉合標籤、屬性名稱拼錯 `atr` -> `alt`、開閉不對稱 `<li>` -> `</p>`）。
   - 第 2 關：CSS 樣式除錯（非法屬性值 `justify-content: middle`、屬性名拼錯 `backgroud-color`）。
   - 第 3 關：JavaScript 基礎除錯（API 大小寫敏感 `preventdefault()`、條件式誤用單等號賦值 `score = 100`）。
   - 第 4 關：HTML、CSS、JS 綜合跨領域除錯（跨檔案多重 Bug 聯合排查）。
3. **最高規格安全性設計**：零 `eval()`、零 `new Function()`、無危險 DOM 注入，純靜態結構與正規化比對，無任何外部第三方套件依賴。
4. **遊戲中心與儲存系統三遊戲聯動**：
   - 整合 [gameStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/gameStorage.ts)，前綴隔離儲存 `ctk_game_progress:${userId}:bug-hunter`。
   - [GameCenterPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/GameCenterPage.tsx) 將 Bug Hunter 切換為「已開放遊玩」，即時加總 Code Puzzle、CSS Designer 與 Bug Hunter 三款遊戲之總星星數與總積分；Quiz Rush 與 Web Builder 保持「即將推出 (規劃中)」。
5. **完整自動化測試與生產打包驗證**：新增 13 項專屬測試，全站 13 份測試檔案共 127 項測試 **100% 全數通過**；TypeScript 與 Vite 生產建置 **0 錯誤**。
6. **嚴格遵守版本控制安全規範**：未執行 `git commit`、`git push`、`git reset` 或 `git clean`，所有既有工作目錄成果 100% 完整保留。

---

## 二、Phase 14 原始 UID 清冊與本批次對照

依據 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，Phase 14 總權重 7.0%（16 項 UID）：

| UID | 原始工作項目名稱 | 原始工作範疇與驗收條件 | 本批次成果狀態 | 本批次進展說明 |
| :--- | :--- | :--- | :--- | :--- |
| **P14-GAM-001** | 遊戲中心首頁與分類導覽 | 獨立遊戲中心頁面、導覽路徑、五大遊戲分類、推薦與遊戲搜尋 | **PARTIAL (90%)** | 更新 `GameCenterPage.tsx`，Bug Hunter 狀態轉為「已開放遊玩」，正確統計三款遊戲星星與總分。 |
| **P14-GAM-002** | 遊戲資料模型 | 關卡、難度、題型、獎勵、限制條件等資料結構 | **PARTIAL (85%)** | 建立 `bugHunterData.ts`（BugHunterLevel、BuggyLineInfo、FixOption）並擴充 `gameStorage.ts`。 |
| **P14-GAM-003** | 玩法與計分規則 | 玩法、操作方式、計分規則、時間及注意事項說明 | **PARTIAL (80%)** | 實作 1~3 星星評級公式、使用提示扣星引導與高分保留防洗分邏輯。 |
| **P14-GAM-004** | Code Puzzle 遊戲實作 | 程式邏輯與流程判斷遊戲，程式區塊拼接、排序或條件判斷 | **PARTIAL (90%)** | 保持 Batch 1 & 2 之語意等價完整成果，回歸測試 100% PASS。 |
| **P14-GAM-005** | CSS Designer 遊戲實作 | 版面配置、選擇器與樣式理解，視覺化調整與即時預覽 | **PARTIAL (90%)** | 保持 Batch 2 之成果，回歸測試 100% PASS。 |
| **P14-GAM-006** | Bug Hunter 遊戲實作 | 程式錯誤辨識與除錯思考，找出語法錯誤或邏輯漏洞 | **PARTIAL (85%)** | **本批次核心交付**：完成 `BugHunterPage.tsx` 4 大關卡可遊玩實作。 |
| **P14-GAM-009** | 關卡難度與提示機制 | 關卡、難度、提示、重試及通關條件 | **PARTIAL (75%)** | 提供每關三層式漸進提示（錯誤類型 -> 可能位置 -> 具體修正方向）與一鍵重置。 |
| **P14-GAM-010** | 遊戲獎勵與成就計算 | 分數、時間、星星、點數與獎勵計算規則 | **PARTIAL (70%)** | 實作單關得分結算（100 基礎分 + 50×星數）、全域星數累計與通關統計。 |
| **P14-GAM-012** | 遊戲紀錄與數據統計 | 遊戲紀錄、個人進度與排行榜 | **PARTIAL (70%)** | 三款遊戲（Code Puzzle + CSS Designer + Bug Hunter）資料獨立隔離，總體數據彙整正常。 |
| **P14-GAM-016** | 遊戲平衡與測試驗證 | 遊戲平衡、可用性、無障礙與安全測試 | **PARTIAL (65%)** | 新增 13 項測試，涵蓋關卡完整性、診斷機制、星級計算與跨遊戲總分。 |

---

## 三、Bug Hunter 四大實戰關卡設計 (`bugHunterData.ts`)

題型全數取材自真實考場高頻失分點與業界新手易犯陷阱，拒絕無語法問題的假錯誤：

### 1. 第 1 關：HTML 結構與標籤語意除錯（入門）
- **核心目標**：排查網頁導覽列中常見的標籤閉合不匹配與 HTML 屬性拼寫錯誤。
- **錯誤 1 (第 2 行)**：`<img src="images/logo.png" atr="碼上學 Logo">` ➔ `atr` 拼寫錯誤，修正為 `alt="碼上學 Logo"`。
- **錯誤 2 (第 5 行)**：`<li><a href="#home">首頁</a></p>` ➔ 開頭為 `<li>` 結尾卻為 `</p>`，修正為成對閉合 `</li>`。
- **學習引導**：理解 HTML 巢狀樹結構，體會無障礙 `alt` 屬性在檢定評分中的必要性。

### 2. 第 2 關：CSS 屬性名稱、非法值與 Flexbox 除錯（基礎）
- **核心目標**：排查 CSS 樣式宣告中常見的屬性拼寫單字錯誤與非法 Flexbox 軸線值。
- **錯誤 1 (第 3 行)**：`justify-content: middle;` ➔ Flexbox 主軸沒有 `middle`，修正為標準置中 `center`。
- **錯誤 2 (第 6 行)**：`backgroud-color: #FFFFFF;` ➔ 漏掉字母 `n`，修正為標準屬性 `background-color`。
- **學習引導**：體會 CSS 解析器「遇到無效宣告直接靜默丟棄」的特性，建立 F12 樣式審查直覺。

### 3. 第 3 關：JavaScript 大小寫與條件賦值除錯（進階）
- **核心目標**：排查前端最常見的 API 大小寫敏感報錯，以及在 `if` 條件式中誤用單等號賦值的重大邏輯漏洞。
- **錯誤 1 (第 4 行)**：`event.preventdefault();` ➔ 全小寫拋出 TypeError，修正為駝峰命名 `event.preventDefault();`。
- **錯誤 2 (第 6 行)**：`if (score = 100)` ➔ 單等號為賦值（條件恆為真），修正為嚴格相等 `if (score === 100)`（亦接受 `==`）。
- **學習引導**：掌握 JS 大小寫嚴格敏感性與賦值運算子造成幽靈 Bug 的深層原理。

### 4. 第 4 關：HTML、CSS、JavaScript 綜合除錯靶場（挑戰）
- **核心目標**：一段包含結構、樣式與 DOM 操作的複合組件，同時潛伏 3 處不同領域的致命錯誤。
- **錯誤 1 (第 2 行)**：`<h2 class="title">測驗成績結算</h3>` ➔ `<h2>` 誤以 `</h3>` 閉合，修正為 `</h2>`。
- **錯誤 2 (第 9 行)**：`colour: #2563EB;` ➔ 誤用英式拼寫，修正為 W3C 標準美式 `color`。
- **錯誤 3 (第 16 行)**：`target.innerHtml = "您的得分為：" + val;` ➔ DOM 屬性大小寫錯誤，修正為 `target.innerHTML` 或 `target.textContent`。
- **學習引導**：培養跨領域多維度排查大局觀，體會各技術層緊密相依的架構本質。

---

## 四、互動操作設計與雙模式體驗 (`BugHunterPage.tsx`)

為同時滿足手機端無鍵盤點選與桌面端進階改寫需求，本遊戲設計雙操作模式：

1. **模式一：點選行號排查 (Interactive Line Picker，推薦模式)**：
   - 畫面以專業深色 IDE 代碼視窗呈現，每行帶有清楚行號。
   - 點擊任一行即可鎖定檢查：
     - 若為**健全代碼**：診斷面板顯示綠色勾勾，提示無語法錯誤，引導繼續搜尋。
     - 若為**潛在漏洞行**：診斷面板亮起紅色警示，精準點出漏洞類型、排錯線索，並提供**具體修復方案選項**。
     - 點選正確修復選項後，左側代碼立即替換，行號標籤點亮綠色修復標記，直觀且 100% 觸控友善。
2. **模式二：受控編輯區手動改寫 (Controlled Code Editor，進階模式)**：
   - 學員可直接在受控文本區中打字修改，完全支援鍵盤快捷鍵。
   - 系統依據每行正規化代碼與修正選項進行結構比對驗證。
3. **驗證與結算流程**：
   - 點擊「提交除錯驗證」，系統逐一核對關卡所有漏洞是否修復。
   - 成功通關後展示星級（1~3 星）、獲得積分（150~250 分）及**「除錯復盤與知識點教學」**（含漏洞原理、考場奪分秘笈與業界最佳實務）。

---

## 五、安全性架構設計

嚴格落實專案安全性指引，杜絕任何惡意注入或環境污染：
1. **零 `eval()` 與零 `new Function()`**：驗證邏輯全數採用靜態字串正規化與正則結構分析，絕不將使用者輸入當作代碼執行。
2. **零 DOM 注入**：所有代碼展示均採用 React 內建文字節點或 `<pre><code>` 標籤，不使用 `dangerouslySetInnerHTML`。
3. **無外部相依性**：完全使用標準 React 18 與既有 `lucide-react` 圖示，未引入肥大外部套件。

---

## 六、與共用遊戲架構整合成果

1. **資料隔離與儲存結構**：
   - 命名空間：`ctk_game_progress:${userId}:bug-hunter`。
   - 訪客沙盒與學員帳號完全隔離，互不覆蓋。
2. **歷史最高分保護與防刷分機制**：
   - 經測試驗證，同一關卡重複遊玩時，系統始終保存歷史最高星級與最高積分，僅遞增嘗試次數 (`attempts`)，總星數不會重複疊加膨脹。
3. **遊戲中心儀表板連動 (`GameCenterPage.tsx`)**：
   - 總星星數與總積分正確匯總 Code Puzzle、CSS Designer 與 Bug Hunter 三款遊戲。
   - Bug Hunter 卡片正式展示「已開放遊玩」徽章、關卡進度與「進入遊戲挑戰」按鈕。
   - Quiz Rush 與 Web Builder 嚴格標示為「即將推出 (規劃中)」，按鈕禁用。

---

## 七、品質驗證與自動化測試報告

### 1. 自動化測試套件（13 份測試檔，127 項測試 100% 通過）
新增專屬測試檔：[bug-hunter-game.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/bug-hunter-game.test.ts)（共 13 項測試）：
- 4 大關卡資料與題目完整性。
- Buggy 行號範圍合法性。
- HTML、CSS、JS 與綜合關卡錯誤與修復邏輯。
- 儲存防刷分、歷史最高成績保留與多帳號隔離。
- 三款遊戲（Code Puzzle + CSS Designer + Bug Hunter）整體數據加總。
- 導覽路由解析（`#games/bug-hunter`、`#bug-hunter`）。

```bash
$ npx vitest run frontend/tests

 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests)
 ✓ frontend/tests/learning-storage.test.ts (6 tests)
 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests)
 ✓ frontend/tests/unified-practical-curriculum.test.ts (7 tests)
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests)
 ✓ frontend/tests/legal-routes.test.tsx (5 tests)
 ✓ frontend/tests/css-designer-game.test.ts (22 tests)
 ✓ frontend/tests/code-puzzle-game.test.ts (14 tests)
 ✓ frontend/tests/bug-hunter-game.test.ts (13 tests)
 ✓ frontend/tests/mock-exam-system.test.ts (15 tests)
 ✓ frontend/tests/official-theory-question-bank.test.ts (5 tests)
 ✓ frontend/tests/wrong-questions-review-system.test.ts (15 tests)
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests)

 Test Files  13 passed (13)
      Tests  127 passed (127)
   Duration  647ms
```

### 2. 生產建置與型別安全檢驗（Vite Build）
```bash
$ npm --prefix frontend run build
> tsc && vite build

vite v5.4.21 building for production...
✓ 1628 modules transformed.
dist/index.html                   1.01 kB │ gzip:   0.71 kB
dist/assets/index-BjE94Mpv.css   14.24 kB │ gzip:   3.51 kB
dist/assets/index-M61T2RMg.js   854.09 kB │ gzip: 254.65 kB
✓ built in 2.39s
```
**編譯結果**：TypeScript 0 警告、0 錯誤，Vite 生產打包順暢通過。

---

## 八、響應式佈局 (RWD) 實測驗證

- **320px / 375px（超小與標準手機端）**：
  - 代碼區域設定 `overflow-x: auto`，代碼過長時在局部容器內橫向滾動，絕不造成全頁水平溢出。
  - 行號點選區域具備合適之觸控操作面積，適合手指直接點選排查。
  - 診斷面板位於下方垂直堆疊，選項按鈕排版間距舒適。
- **768px（平板與小筆電）**：
  - 模式切換按鈕與關卡標籤自適應折行。
  - 代碼視窗與修復面板比例勻稱。
- **1024px / 1440px / 1920px（桌面端大螢幕）**：
  - 呈現左側代碼視窗、右側診斷修復面板之雙欄佈局，操作動線流暢自然。

---

## 九、基準與版本控制狀態

1. **未執行破壞性指令**：未執行 `git commit`、`git push`、`git reset` 或 `git clean`。
2. **工作目錄完整性**：所有 Phase 12、13 及 Phase 14 Batch 1、Batch 2 之既有修改與未追蹤檔案完好無損。
3. **HTML 正式入口**：維持 [frontend/index.html](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/index.html)，未變更任何入口檔案。
4. **進度維持**：正式基準進度維持 **`45.961878%`（45.96%）**，`AUTH-03` 維持 **`BLOCKED`**。

---

## 十、後續批次建議 (Next Steps)

建議下一批次推進 **Phase 14 第 4 批 (Batch 4)**：
- 開發第四款遊戲：**Quiz Rush（證照疾速快答，UID：`P14-GAM-007`）**。
- 整合 Phase 13 已完成之 605 題官方完整題庫。
- 設計連鎖倒數計時、Combo 連擊加分與錯題即時收錄至錯題本。
