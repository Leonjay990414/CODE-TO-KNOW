# CODE TO KNOW 碼上學｜Phase 14 第二份計畫 Batch 3 報告
# 五款遊戲內容正確性與判定品質稽核

- **專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）
- **開發階段**：Phase 14｜互動遊戲與遊戲化學習系統（第二輪品質深化 Batch 3）
- **核心工作項目**：`P14-GAM-004`、`P14-GAM-005`、`P14-GAM-006`、`P14-GAM-007`、`P14-GAM-008`、`P14-GAM-016`
- **報告產出時間**：2026-11-14 20:54
- **執行前環境狀態**：Git 分支 `main`，HEAD: `47c8ba4b176fb19478a8330598ef86a9039f78eb`
- **AUTH-03 狀態**：`BLOCKED`（嚴格保持，零資料庫/後端連線）
- **正式進度基準**：45.961878%（嚴格鎖定）

---

## 一、五款遊戲逐關內容與判定邏輯深度稽核

### 1. Code Puzzle（程式邏輯拼圖）
- **關卡 1（HTML 骨架）**：
  - 順序：`b_doctype` -> `b_html_open` -> `b_head_meta` -> `b_body_content` -> `b_html_close`。
  - 理由：標準規範宣告必須第一行，根標籤包含 `<head>` 與 `<body>`，單一標準答案具充分規範依據。
- **關卡 2（Flexbox 雙向置中）**：
  - 支援 `acceptableOrders` 多重等價順序！判定邏輯同時接受 `c_justify` 與 `c_align` 的先後調換，以及 `c_height` 在規則內的不同宣告位置，**絕無因宣告次序而錯誤拒絕正確 CSS 規則的情況**。
- **關卡 3（語意化導覽列）**：
  - `<nav>` 包裹 `<ul>`，內部清單項 `n_item_1` 與 `n_item_2` 順序皆透過 `acceptableOrders` 判定為通過，符合等價無序清單語意。
- **關卡 4（JavaScript 事件與驗證）**：
  - 先選取節點 `j_select` -> 綁定監聽器 `j_listener_open` -> 阻止刷新 `j_prevent` -> 執行邏輯 `j_logic` -> 閉合 `j_callback_end`。步驟順序與 JS 執行期依賴嚴格相符。

### 2. CSS Designer（樣式排版設計師）
- **Level 1（色彩與圓角）**：
  - 顏色容許支援 `#FFFFFF`、`#FFF`、`WHITE` 與 `RGB(255, 255, 255)`，大寫正規化處理，不因大小寫誤判。
  - 圓角設定目標為 8px，提供 6px ~ 10px 之容許區間，避免滑桿微調手感困難造成失分。
- **Level 2（Box Model 盒模型）**：
  - 分別檢查 `width` (260~300px)、`padding` (14~18px)、`margin` (16~24px)、`borderWidth` (1~3px) 與 `borderColor` (#BDA77E)。
  - 四層尺寸皆有適度彈性，未達標時提供精確數字引導回饋。
- **Level 3（Flexbox 雙向對齊）**：
  - 嚴格比對 `display: flex`、`justifyContent: center`、`alignItems: center` 與 `gap: 16px`。
- **Level 4（複合卡片）**：
  - 驗證 `maxWidth` (300~340px)、`flexDirection: column`、`boxShadow` 含 `rgba` 柔和陰影。

### 3. Bug Hunter（程式除錯獵人）與第 4 關行號偏移檢查
- **第 4 關行號精確定位證據**：
  - 原始字串分割檢驗：
    - Line 2: `  <h2 class="title">測驗成績結算</h3>` -> 錯誤類型：開閉不對稱（H2 vs H3） -> **Line 2 100% 匹配**。
    - Line 8: `    colour: #2563EB;` -> 錯誤類型：英式拼寫錯誤（colour -> color） -> **Line 8 100% 匹配**。
    - Line 14: `    target.innerHtml = "您的得分為：" + val;` -> 錯誤類型：大小寫拼寫錯誤（innerHtml -> innerHTML） -> **Line 14 100% 匹配**。
  - **實測證明**：在 `game-content-quality-audit.test.ts` 中比對 `BUG_HUNTER_LEVELS.forEach(lvl => lines[bug.lineNum - 1] === bug.originalText)`，全部 4 個關卡共 9 處錯誤行號與字串 **100% 嚴格一致**。
  - **修復獨立性**：修復某一行時僅替換該行文字，其他錯誤行仍保持未修復狀態，必須全部抓出並修正才能通過關卡，無過度寬鬆判定。

### 4. Quiz Rush（證照疾速快答）605 題題庫與計分稽核
- **題庫完整性確認**：
  - 試題總數：**確實驗證 605 題**（`officialTheoryQuestionBank.json` 中 `totalOfficialActiveQuestions: 605`）。
  - 四大工作項目題數嚴格吻合考綱：
    - 工作項目 01（作業準備）：**236 題**
    - 工作項目 02（應用軟體安裝及使用）：**233 題**
    - 工作項目 03（系統軟體安裝及使用）：**71 題**
    - 工作項目 04（資訊及安全）：**65 題**
  - **官方刪除試題排除**：6 題歷史刪除題（項目01: 94, 102, 166, 197, 232；項目02: 191）維持剔除，絕無誤放回。
  - 正確答案分佈：A: 144, B: 156, C: 159, D: 146，均勻分佈，無虛假單一解答。
  - 抽題演算法：`drawQuizQuestions` 採用 Fisher-Yates 洗牌後切片，保證單回合內**題目完全不重複**。
  - 連擊計分：答對累加 Combo 並加成，答錯或超時立刻重設 Combo 為 0；錯題自動同步至本機錯題本。

### 5. Web Builder（網頁架構拼裝工坊）
- **關卡判定嚴謹性**：
  - wb-01（目標長度 4）、wb-02（目標長度 4）、wb-03（目標長度 5）、wb-04（目標長度 6）。
  - 判定邏輯要求**積木數量完全一致**且**每一項位置的 tag id 均與 targetBlockSequence 完全相符**；缺漏或順序顛倒一律判定失敗，絕無「部分符合即可過關」的寬鬆漏洞。
  - 畫面預覽採用安全 React JSX 元件（`<header>`、`<nav>`、`<main>`、`<footer>` 等），杜絕任何 `eval` 或 `dangerouslySetInnerHTML`。

---

## 二、P0～P3 問題分級與處理狀態

| 分級 | 項目說明 | 影響評估 | 處理狀態 |
| :---: | :--- | :--- | :---: |
| **P0** | Bug Hunter 第 4 關錯誤行號登記為 Line 9 與 Line 16 | 會導致點擊行號與判定目標錯位 | **已修復**（全面校正為 Line 8 與 Line 14，已通過自動化字串斷言） |
| **P1** | 非計時遊戲在提示中若提及倒數字眼可能造成誤解 | 學生誤以為要急迫答題而影響學習 | **已修復**（CSS Designer 等統一修正為「無時間限制，著重視覺精度」） |
| **P2** | 平台自訂星級與官方檢定及格標準區別 | 需避免學生將遊戲 Combo 誤當成檢定規則 | **已修復**（GameBriefingModal 顯著加註官方檢定 80 題單選、60 分及格免責宣告） |
| **P3** | 手機小螢幕（320px）預覽視窗建議支援 Tab 切換 | 提升極窄螢幕操作便利性 | 列入後續體驗優化建議清單 |

---

## 三、測試驗收與建置結果

### 1. 專屬內容稽核測試（game-content-quality-audit.test.ts）
- 涵蓋 7 大驗證群組：
  1. `Code Puzzle Content & Permitted Orders` (PASS)
  2. `CSS Designer Styles & Controls` (PASS)
  3. `Bug Hunter Buggy Lines & Fix Options` (PASS)
  4. `Web Builder Starter & Target Blocks` (PASS)
  5. `Game Briefing Configurations Consistency` (PASS)
  6. `Quiz Rush 605 Questions Integrity & Uniqueness` (PASS)
  7. `Bug Hunter Line Position Precision Proof` (PASS)
- **Exit Code**：`0`（耗時 251ms）。

### 2. 全套回歸測試結果
- 執行指令：`npx --prefix frontend vitest run frontend/tests`
- **測試結果**：**19 個測試檔案全數通過，共 183 項測試 100% PASS**（Exit Code 0，耗時 828ms）。

### 3. TypeScript 與 Vite 生產建置
- 執行指令：`npm --prefix frontend run build` (`tsc && vite build`)
- **建置結果**：**0 errors, 0 warnings**（Exit Code 0，產出 `dist/assets/index-DSUsrzuT.js` 923.02 kB）。

---

## 四、合規與授權限制遵守情況

- **未修改原始 605 題正式題庫內容與正確答案**：遵守。
- **未重新加入已刪除的 6 題歷史無效題目**：遵守。
- **未執行 Git Commit、Push 或部署**：遵守。
- **未修改 Prisma、資料庫結構或後端 API**：遵守。
- **AUTH-03 狀態**：維持 **`BLOCKED`**。
- **正式進度基準**：維持 **`45.961878%`**。
- **危險代碼檢查**：搜尋 `eval()`, `new Function()`, `dangerouslySetInnerHTML`, `localStorage.clear()`：**0 匹配**。
- **真實測試標記**：目前所有題庫、行號與替代解法斷言標記為 `UNIT_TEST_PASS` / `STATIC_CHECK_ONLY`，絕無虛報為真實瀏覽器渲染。

已達成 Batch 3 停止條件，停止並等待下一步指令。
