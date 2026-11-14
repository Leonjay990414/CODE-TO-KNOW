# CODE TO KNOW｜Phase 14 第 2 批：CSS Designer 視覺化設計遊戲開發報告

**專案名稱**：碼上學｜CODE TO KNOW  
**報告日期**：2026-11-14  
**執行階段**：Phase 14｜互動遊戲與遊戲化學習系統（第 2 批）  
**正式全專案進度基準**：45.961878%（呈現 45.96%）  
**AUTH-03 狀態**：BLOCKED（嚴格維持）  
**Git HEAD 錨點**：`310323dee802eb3a940ed947c7c665e147fb19f3`  

---

## 一、執行摘要與前置基準確認

本批次為原始 20 階段規劃中 **Phase 14：互動遊戲與遊戲化學習系統** 第 2 批連續開發任務。
本批次重點成果包括：
1. **完成第二款學習微遊戲：CSS Designer（樣式排版設計師，UID：P14-GAM-005）**，包含 4 大難度遞進的實戰關卡、即時預覽、屬性調校面板、動態 CSS 代碼生成、目標畫面與實際效果視覺對照。
2. **建立「語意等價與容錯」的 CSS 判定引擎**：拒絕死板字串比對，支援顏色格式轉換（HEX / RGB / 顏色名稱）、數值寬容度判定（Tolerance）與 Flexbox 軸線複合屬性驗證。
3. **高安全性樣式隔離設計**：採用 React inline style 作用於受控元件內部，零全域 CSS 污染，無須外部 style 標籤或危險 HTML 注入。
4. **與現有遊戲中心及儲存系統無縫整合**：共用 `gameStorage.ts`，多學員/訪客沙盒儲存隔離（`ctk_game_progress:${userId}:css-designer`），重玩不重複洗分，歷史最高成績與星級完整保留。
5. **Code Puzzle 補充檢查與向下相容升級**：實作 `acceptableOrders` 判定，使 Code Puzzle 第 2 關 CSS 屬性順序與第 3 關導覽項目對調等語意等價寫法順利通過。
6. **落實自動化回歸與型別建置**：全站 12 份測試檔案共 114 項測試 **100% 全數通過**；TypeScript 與 Vite 生產建置 **0 錯誤**。
7. **嚴格禁止破壞性指令**：全程未執行 `git commit`、`git push`、`git reset` 或 `git clean`，所有既有工作目錄成果 100% 完整保留。

---

## 二、Phase 14 原始 UID 清冊與本批次對照

依據 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，Phase 14 總權重 7.0%（16 項 UID）：

| UID | 原始工作項目名稱 | 原始工作範疇與驗收條件 | 本批次成果狀態 | 本批次進展說明 |
| :--- | :--- | :--- | :--- | :--- |
| **P14-GAM-001** | 遊戲中心首頁與分類導覽 | 獨立遊戲中心頁面、導覽路徑、五大遊戲分類、推薦與遊戲搜尋 | **PARTIAL (85%)** | 更新 `GameCenterPage.tsx`，CSS Designer 狀態切換為「已開放遊玩」，正確統計雙遊戲星星與總分。 |
| **P14-GAM-002** | 遊戲資料模型 | 關卡、難度、題型、獎勵、限制條件等資料結構 | **PARTIAL (80%)** | 建立 `cssDesignerData.ts`（CSSDesignerLevel、CSSControlDef）並擴充 `gameStorage.ts`。 |
| **P14-GAM-003** | 玩法與計分規則 | 玩法、操作方式、計分規則、時間及注意事項說明 | **PARTIAL (75%)** | 實作 1~3 星星評級公式、使用提示扣星引導與高分保留防洗分邏輯。 |
| **P14-GAM-004** | Code Puzzle 遊戲實作 | 程式邏輯與流程判斷遊戲，程式區塊拼接、排序或條件判斷 | **PARTIAL (90%)** | 依指引補充語意等價檢查，支援 CSS 屬性順序交換與導覽項目順序等價。 |
| **P14-GAM-005** | CSS Designer 遊戲實作 | 版面配置、選擇器與樣式理解，視覺化調整與即時預覽 | **PARTIAL (85%)** | **本批次核心交付**：完成 `CSSDesignerPage.tsx` 4 大關卡可遊玩實作。 |
| **P14-GAM-009** | 關卡難度與提示機制 | 關卡、難度、提示、重試及通關條件 | **PARTIAL (70%)** | 提供每關三層式漸進提示（概念方向 -> 屬性提示 -> 具體操作）與一鍵重置。 |
| **P14-GAM-010** | 遊戲獎勵與成就計算 | 分數、時間、星星、點數與獎勵計算規則 | **PARTIAL (60%)** | 實作單關得分結算（100 基礎分 + 50×星數）、全域星數累計與通關統計。 |
| **P14-GAM-012** | 遊戲紀錄與數據統計 | 遊戲紀錄、個人進度與排行榜 | **PARTIAL (60%)** | 雙遊戲（Code Puzzle + CSS Designer）資料獨立隔離，彙總統計正常。 |
| **P14-GAM-016** | 遊戲平衡與測試驗證 | 遊戲平衡、可用性、無障礙與安全測試 | **PARTIAL (55%)** | 新增 22 項測試，涵蓋關卡完整性、語意等價、容錯範圍與帳號隔離。 |

---

## 三、CSS Designer 四大實戰關卡設計 (`cssDesignerData.ts`)

針對網頁設計技能檢定與現代前端最常考之版面設計重點，規劃四大難度漸進關卡：

### 1. 第 1 關：CSS 基礎顏色、背景與圓角（入門）
- **核心目標**：掌握文字前景色彩 (`color`)、背景填色 (`background-color`) 與邊框圓角 (`border-radius`)。
- **目標規格**：深藍底 (`#2563EB`)、純白高對比文字 (`#FFFFFF`)、平滑圓角 (`8px`)。
- **學習引導**：理解 WCAG 4.5:1 色彩對比標準，避免淺底配白字或深底配黑字等考場大忌。

### 2. 第 2 關：CSS 盒模型 (Box Model: Width, Padding, Margin, Border)（基礎）
- **核心目標**：理解盒模型四層結構（Content, Padding, Border, Margin），掌握內容與邊框之呼吸留白。
- **目標規格**：內容寬度 `280px`、內部留白 `16px`、外部間距 `20px`、外框 `2px 實線香檳金 (#BDA77E)`。
- **學習引導**：清楚區分 Padding（文字與框線間隔）與 Margin（元素與鄰近物件間距），掌握 `box-sizing: border-box` 理念。

### 3. 第 3 關：CSS Flexbox 彈性軸線與項目間距（基礎）
- **核心目標**：解決傳統浮動排版痛點，達成主軸置中對齊、交叉軸對齊與均勻間隔。
- **目標規格**：容器宣告 `display: flex`、主軸置中 `justify-content: center`、交叉軸置中 `align-items: center`、間距 `gap: 16px`。
- **學習引導**：強調必須先宣告 `display: flex` 才能使各項對齊屬性生效；使用 `gap` 取代過時的複雜 margin 計算。

### 4. 第 4 關：現代產品卡片排版 (Card Layout: Max-width, Shadow, Flex-col)（進階）
- **核心目標**：打造現代教育產品卡片，結合最大寬度限制、柔和立體陰影、圓角與垂直彈性流向。
- **目標規格**：最大寬度 `max-width: 320px`、垂直單欄 `flex-direction: column`、內距 `24px`、圓角 `12px`、立體陰影 `0 4px 14px rgba(0,0,0,0.1)`、間距 `12px`。
- **學習引導**：善用 `max-width` 適配各級螢幕；使用透明度 RGBA 建立自然視覺層次（Elevation）。

---

## 四、CSS 判定方式與語意等價設計 (`validateCSSDesignerLevel`)

本遊戲堅決揚棄死板的「純字串全等比對」，採用進階語意判定：

1. **色彩格式等價支援**：
   - 純白文字支援 `#FFFFFF`、`#FFF`、`white`、`rgb(255, 255, 255)`。
   - 品牌深藍支援 `#2563EB`、`#2563eb`、`rgb(37, 99, 235)`。
2. **數值寬容度容錯（Tolerance Range）**：
   - 第 1 關圓角：目標 8px，允許 6px ~ 10px 之微幅差異。
   - 第 2 關寬度：目標 280px，允許 260px ~ 300px；padding 目標 16px，允許 14px ~ 18px；margin 目標 20px，允許 16px ~ 24px。
   - 第 3 關間隔：目標 16px，允許 12px ~ 20px。
   - 第 4 關最大寬度：目標 320px，允許 300px ~ 340px；內距 20px ~ 28px；圓角 10px ~ 14px。
3. **教育導向之失敗提示**：
   - 判定未通過時，精確點出「哪一項屬性偏離目標」（例如：「佈局模式尚未啟用彈性盒模型 (display: flex)」、「邊框顏色尚未選用專案香檳金」），引導學員有方向性地思考。

---

## 五、安全性架構設計

為防止學員設定的 CSS 或惡意字串外洩破壞整個「碼上學」正式網站介面：
1. **完全放棄危險的 `<style>` 標籤動態注入**：不使用 `document.createElement('style')` 或直接插入主 DOM。
2. **採用 React Scoped Inline Styles**：所有滑桿與選單產生的 CSS 樣式均轉譯為標準 React `CSSProperties` 物件，**嚴格綁定於專屬預覽容器與預覽節點**。
3. **預覽容器實施邊界保護**：預覽區塊設定 `overflow: hidden`、`box-sizing: border-box` 與外層固定尺寸，即便設定超大尺寸或負 margin 亦不會破壞外側頁面流。
4. **絕對零 XSS 風險**：數值與屬性均經過型別驗證與枚舉篩選，杜絕 script 注入或任意 URL 資源加載。

---

## 六、與共用遊戲架構整合成果

1. **資料持久化與帳號隔離**：
   - 儲存鍵值：`ctk_game_progress:${userId}:css-designer`。
   - 訪客（未登入）與不同註冊學員各自擁有獨立沙盒，登入登出互不覆蓋。
2. **防重複刷分機制**：
   - 同一關卡若已獲得 3 顆星，後續重玩獲得 1 顆星時，系統自動保留 3 星與歷史最高分，僅累加遊玩嘗試次數 (`attempts`)。
3. **遊戲中心儀表板彙總連動 (`GameCenterPage.tsx`)**：
   - 「總星星數」與「遊戲總積分」能正確加總 Code Puzzle 與 CSS Designer 之累計成就。
   - CSS Designer 卡片正式展示「已開放遊玩」徽章、關卡進度與「進入遊戲挑戰」按鈕。
   - 尚未完成的 Bug Hunter、Quiz Rush、Web Builder 嚴格標示為「即將推出 (規劃中)」，按鈕禁用。

---

## 七、Code Puzzle 第 1 批補充檢查與改進結果

依本批次任務指引第 6 條要求，完成全面體檢：
1. **CSS 屬性順序等價支援**：
   - 在 [codePuzzleData.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/data/codePuzzleData.ts) 與 [CodePuzzlePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/CodePuzzlePage.tsx) 擴充 `acceptableOrders` 機制。
   - 第 2 關中，`.hero-container {` 內部之 `display: flex;`、`align-items: center;`、`justify-content: center;`、`min-height: 100vh;` 交換順序均能順利通過。
2. **HTML 結構語意等價支援**：
   - 第 3 關導覽列中，清單項目 `n_item_1` 與 `n_item_2` 順序互調亦判定為合法通過。
3. **星級與積分累積檢查**：
   - 經測試驗證，多次通關同一關卡不會無限制膨脹星星與積分。
4. **回歸測試通過**：
   - [code-puzzle-game.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/code-puzzle-game.test.ts) 14 項測試持續 100% PASS。

---

## 八、品質驗證與自動化測試報告

### 1. 自動化測試套件（12 份測試檔，114 項測試 100% 通過）
新增專屬測試檔：[css-designer-game.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/css-designer-game.test.ts)（共 22 項測試）：
- **4 大關卡資料完整性**（標題、目標說明、至少 3 層提示、解析物件）。
- **語意判定引擎測試**（Level 1 顏色/圓角、Level 2 盒模型尺寸、Level 3 Flexbox 雙軸置中、Level 4 複合卡片）。
- **顏色與容錯等價性測試**（white、RGB、6~10px 圓角）。
- **失敗回饋測試**（針對性提示）。
- **儲存與防刷分測試**（星級計算、重玩高分保留、多帳號隔離、跨遊戲統計彙整）。
- **導覽路由解析測試**（`#games/css-designer`、`#css-designer`）。
- **Code Puzzle 補充等價測試**。

```bash
$ npx vitest run frontend/tests

 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests)
 ✓ frontend/tests/learning-storage.test.ts (6 tests)
 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests)
 ✓ frontend/tests/unified-practical-curriculum.test.ts (7 tests)
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests)
 ✓ frontend/tests/mock-exam-system.test.ts (15 tests)
 ✓ frontend/tests/code-puzzle-game.test.ts (14 tests)
 ✓ frontend/tests/legal-routes.test.tsx (5 tests)
 ✓ frontend/tests/official-theory-question-bank.test.ts (5 tests)
 ✓ frontend/tests/css-designer-game.test.ts (22 tests)
 ✓ frontend/tests/wrong-questions-review-system.test.ts (15 tests)
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests)

 Test Files  12 passed (12)
      Tests  114 passed (114)
   Duration  707ms
```

### 2. 生產建置與型別安全檢驗（Vite Build）
```bash
$ npm --prefix frontend run build
> tsc && vite build

vite v5.4.21 building for production...
✓ 1626 modules transformed.
dist/index.html                   1.01 kB │ gzip:   0.71 kB
dist/assets/index-BjE94Mpv.css   14.24 kB │ gzip:   3.51 kB
dist/assets/index-De5gA0mC.js   825.29 kB │ gzip: 245.64 kB
✓ built in 2.41s
```
**編譯結果**：TypeScript 0 警告、0 錯誤，Vite 生產打包順暢通過。

---

## 九、響應式佈局 (RWD) 實測驗證

針對主要視窗斷點進行全面審查：
- **320px / 375px（超小與標準手機端）**：
  - 控制項採用垂直單欄排列，滑桿具備合適之觸控操作半徑，邊界預留充足留白。
  - 即時 CSS 程式碼預覽區塊設定 `overflow-x: auto`，代碼不超出螢幕。
  - 目標畫面與即時預覽上下垂直陳列，清晰可辨。
- **768px（平板與小筆電）**：
  - 關卡分頁切換按鈕自適應換行。
  - 控制項與比較區垂直堆疊，比例平衡。
- **1024px / 1440px / 1920px（桌面與大螢幕）**：
  - 控制項位於左側、視覺預覽與深度解析位於右側，兩欄式佈局一目了然。
  - 操作滑桿時右側預覽即時絲滑變更，毫無卡頓。

---

## 十、基準與版本控制狀態

1. **未執行破壞性指令**：完全遵守指引，未執行 `git commit`、`git push`、`git reset` 或 `git clean`。
2. **工作目錄完整性**：所有 Phase 12、13 及 Phase 14 Batch 1 之既有修改與未追蹤檔案完好無損。
3. **HTML 正式入口**：維持 [frontend/index.html](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/index.html)，未變更任何入口檔案。
4. **進度維持**：正式基準進度維持 **`45.961878%`（45.96%）**，`AUTH-03` 維持 **`BLOCKED`**。

---

## 十一、後續批次建議 (Next Steps)

建議接續推進 **Phase 14 第 3 批 (Batch 3)**：
- 開發第三款遊戲：**Bug Hunter（程式除錯獵人，UID：P14-GAM-006）**。
- 設計考場高頻失分除錯靶場（標籤未閉合、語意元素嵌套錯誤、CSS 屬性拼錯）。
- 整合程式碼行號點選除錯與即時修復驗證。
