# CODE TO KNOW｜Phase 14 第二份 2.5 小時計畫 批次 4 報告
# 前端效能優化與執行穩定性 (Performance, Lazy Loading & Execution Stability)

- **專案名稱**：碼上學｜CODE TO KNOW
- **執行環境**：Antigravity IDE (Windows PowerShell, React 18, Vite 5, TypeScript 5, Vitest 5)
- **報告日期**：2026-11-14
- **負責模組**：
  - `frontend/vite.config.ts` (Manual Chunking)
  - `frontend/src/app/App.tsx` (Route-level Lazy Loading & Suspense Fallback)
  - `frontend/src/pages/public/QuizRushPage.tsx` (Timer lifecycle, anti-drift, idempotent settlement)
  - `frontend/src/pages/public/CodePuzzlePage.tsx`, `CSSDesignerPage.tsx`, `BugHunterPage.tsx`, `WebBuilderPage.tsx`
  - `frontend/tests/game-performance-stability.test.ts`
- **狀態**：完成 (Completed)

---

## 一、本批次執行目標與範圍

接續 Phase 14 第二份 2.5 小時執行計畫 Batch 4，本批次聚焦於五款互動學習遊戲（Code Puzzle、CSS Designer、Bug Hunter、Quiz Rush、Web Builder）與遊戲中心的前端效能、React 執行效率、資源清理、記憶體使用與異常處理。

### 核心目標：
1. **降低初始載入負擔**：實施路由層級動態載入（Route-level Code Splitting），將五款非首頁必須的遊戲組件從主入口 bundle 剝離。
2. **手動分塊（Manual Chunks）**：於 `vite.config.ts` 配置分塊策略，將肥大的 React 框架核心、Lucide 圖標、以及 605 題官方學科題庫資料獨立分拆，消除 Vite 預設的 500 kB chunk 警報。
3. **計時器與事件資源釋放**：檢查並補強計時器（`setInterval` / `clearInterval`）、監聽器及非同步回調清理，杜絕組件卸載後的記憶體洩漏與背景不可見執行。
4. **過期回調與重複結算防禦**：落實結算冪等鎖（Idempotency Lock），防止切換題目、快速連擊或逾時交卷時舊回調修改已銷毀或已結算的狀態。
5. **資料讀寫強韌性**：保證 LocalStorage 在資料損毀或容量超限時安全降級，無未捕獲異常。
6. **嚴格不逾越規範**：不新增遊戲、不擴張未授權功能、不修改後端/Prisma/資料庫/環境變數、不捏造未實際量測之瀏覽器數值。

---

## 二、調整前後的 Bundle 大小比較

| 項目 | 調整前 (Baseline) | 調整後 (Optimized) | 差異 / 改善狀況 |
| :--- | :--- | :--- | :--- |
| **主入口檔案 (index.js)** | 923.02 kB (gzip 275.69 kB) | **470.96 kB** (gzip 140.76 kB) | **體積大幅縮減 49.0%**，低於 500 kB 警報閾值 |
| **Vite 500 kB 警報** | 出現 (Yellow Warning) | **完全消除 (0 警報)** | 建置輸出乾淨 |
| **官方學科題庫資料 (theory-data.js)** | 內嵌於 index.js (隱蔽成本) | **152.45 kB** (gzip 45.09 kB) | 獨立分塊，由快答/模擬考依需共用快取 |
| **React 核心框架 (vendor-react.js)** | 內嵌於 index.js | **133.93 kB** (gzip 43.13 kB) | 長期快取 (Long-term Cache) 效益提高 |
| **Icon 圖標庫 (vendor-icons.js)** | 內嵌於 index.js | **42.24 kB** (gzip 10.04 kB) | 獨立分塊 |
| **Code Puzzle 遊戲 chunk** | 內嵌於 index.js | **17.74 kB** (gzip 6.69 kB) | 進入遊戲時才按需下載 |
| **Quiz Rush 遊戲 chunk** | 內嵌於 index.js | **18.15 kB** (gzip 5.66 kB) | 進入遊戲時才按需下載 |
| **Web Builder 遊戲 chunk** | 內嵌於 index.js | **27.10 kB** (gzip 9.80 kB) | 進入遊戲時才按需下載 |
| **Bug Hunter 遊戲 chunk** | 內嵌於 index.js | **29.20 kB** (gzip 11.29 kB) | 進入遊戲時才按需下載 |
| **CSS Designer 遊戲 chunk** | 內嵌於 index.js | **29.67 kB** (gzip 10.98 kB) | 進入遊戲時才按需下載 |
| **遊戲新手說明設定 (gameBriefingConfigs.js)**| 內嵌於 index.js | **7.44 kB** (gzip 3.87 kB) | 獨立分塊 |

---

## 三、路由層級 Lazy Loading 與 Suspense Fallback 實作成果

### 1. 動態匯入設計
在 `frontend/src/app/App.tsx` 中，五款學習遊戲改以標準 `React.lazy()` 匯入：
```tsx
const CodePuzzlePage = React.lazy(() => import('../pages/public/CodePuzzlePage'));
const CSSDesignerPage = React.lazy(() => import('../pages/public/CSSDesignerPage'));
const BugHunterPage = React.lazy(() => import('../pages/public/BugHunterPage'));
const QuizRushPage = React.lazy(() => import('../pages/public/QuizRushPage'));
const WebBuilderPage = React.lazy(() => import('../pages/public/WebBuilderPage'));
```

### 2. 優雅的 Suspense Fallback
- 建立符合品牌視覺與無障礙標準的 `GameLoadingFallback` 組件。
- 具備 `role="status"`、`aria-live="polite"` 與 `aria-label="遊戲模組載入中"`。
- 配備微動態載入指示器與提示文案（「正在準備遊戲資源與關卡題目...」）。
- 路由切換時，未載入過遊戲的學生僅需承擔 ~18-30 kB 的輕量網路延遲，首頁與學習後台使用者則完全免去五款遊戲的代碼負擔。

---

## 四、605 題題庫載入成本與拆分狀況分析

1. **資料規模與載入成本**：
   - 官方學科 605 題 (`officialTheoryQuestionBank.ts`) 總計約 152 kB。
   - 原先與整個主應用程式強綁定，導致首頁或純看公告的訪客也必須下載所有考題資料。
2. **拆分處置**：
   - 於 `vite.config.ts` 中的 `manualChunks` 設定規則：
     ```typescript
     if (id.includes('officialTheoryQuestionBank') || id.includes('mockExamData')) {
       return 'theory-data';
     }
     ```
   - 成果：605 題成功打包為專屬 chunk `dist/assets/theory-data-MoTt3-Ns.js` (152.45 kB，gzip 45.09 kB)。
   - 效益：只有在學生存取「證照疾速快答 (Quiz Rush)」或「模擬測驗 (Mock Exam)」時，瀏覽器才會載入此 chunk，且受益於 HTTP 快取機制，後續造訪無需重新傳輸。

---

## 五、React 重複渲染與狀態管理檢視

1. **組件重渲染治理**：
   - **Quiz Rush**：
     - 秒數倒數改由純內部狀態 `timeLeft` 驅動，不觸發父層組件重繪。
     - 遊戲中題目清單（605 題中隨機抽取的 10 題）於發牌（`startRound`）時一次性確立，不在每個 tick 重新計算。
   - **CSS Designer**：
     - 樣式輸入由受控表單驅動，預覽區透過 CSS Property Parsing 單向渲染，無昂貴的 AST 分析。
   - **Bug Hunter & Web Builder**：
     - 關卡代碼與組件範本集中於靜態常數，切換關卡時以全量替換取代局部不可預期變異，避免閉包陳舊引用。
2. **無不可控之巨型 Context**：
   - 全域 Context（如 `NavigationContext`）僅負責路由狀態傳遞，不存放高頻跳動之遊戲秒數或動畫狀態。

---

## 六、計時器清理、事件監聽與非同步 Callback 處理結果

### 1. Quiz Rush 計時器防禦機制
- **絕對時間基準（Wall-clock Difference）**：
  - 使用 `timerEndTimeRef.current = Date.now() + 15000` 記錄結束絕對時間。
  - 每個 tick 以 `Math.max(0, Math.ceil((timerEndTimeRef.current - now) / 1000))` 計算剩餘秒數，徹底消除 `setInterval` 累積誤差飄移。
- **組件卸載自動清理**：
  ```tsx
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);
  ```
- **題目切換與交卷清理**：
  - 當點擊選項（`handleAnswer`）或時間歸零呼叫結算時，立即同步執行 `clearInterval`，杜絕下一個 tick 在題目結算後仍嘗試執行的情況。

### 2. 陳舊回調與雙擊併發防護（Idempotency Lock）
- 使用 `isRoundSettledRef.current` 與 `roundSessionIdRef.current` 鎖定局數會話。
- 當學生快速點擊答案、或在倒數剛好歸零的瞬間按下按鈕，系統會嚴格檢查 `if (isRoundSettledRef.current) return;`，保證每回合只扣一次秒數、只結算一次計分。

### 3. 事件監聽 Teardown
- 各遊戲內涉及之 `window.addEventListener('keydown')`、自訂 `ResizeObserver` 或全域監聽均在對應 `useEffect` 清理函式中明確調用 `removeEventListener` 或 `disconnect`。

---

## 七、LocalStorage 讀寫異常與邊界條件測試結果

1. **防禦機制覆蓋**：
   - 所有遊戲模組透過 `gameStorage.ts`、`wrongQuestionsStorage.ts` 與 `learningStorage.ts` 存取本機儲存。
   - 存取外層全數覆蓋 `try-catch`。
2. **容錯情境驗證**：
   - **JSON 語法損毀**（如儲存格被外部寫入非法字元 `MALFORMED{JSON`）：捕獲 `SyntaxError`，自動降級回乾淨預設值（`defaultGameRecord` 或空紀錄），不拋出未捕獲例外，終端用戶不受白屏影響。
   - **隱私模式禁用或配額超限**（`QuotaExceededError`）：系統安靜忽略或記錄錯誤，不中斷遊戲主流程運行。
   - **帳號隔離驗證**：不同登入身分（如 `student_user_A` vs `student_user_B`）各自擁有獨立前綴命名空間，互相不污染、不覆寫。

---

## 八、Vitest 自動化測試清單與執行結果

本批次針對前端效能、計時器生命週期與穩定性新增專屬測試檔案 `frontend/tests/game-performance-stability.test.ts`，並聯同全套測試套件進行全量驗證：

### 專屬測試套件驗證 (`game-performance-stability.test.ts`)
1. **計時器清理驗證**：驗證 `setInterval` 在倒數觸發或組件卸載時，能夠被 `clearInterval` 完全終止，不會有陳舊定時器殘留在事件迴圈中。
2. **動態載入 Chunk 解析**：驗證五款遊戲頁面模組皆為具備 `default` 匯出的標準動態模組，能夠被 `import()` 正常非同步解析。
3. **結算冪等鎖與過期回調阻絕**：模擬在結算標記生效後傳入之非同步回調，驗證不會重複提交分數或重複引發結算事件。
4. **事件監聽器 Teardown 驗證**：模擬鍵盤監聽事件綁定與釋放，確保卸載時 `removeEventListener` 被確實觸發。

### 全量回歸測試彙總
- **測試指令**：`npx --prefix frontend vitest run frontend/tests`
- **測試結果**：
  - **總測試檔案數**：**20 檔** (20 passed)
  - **總測試用例數**：**187 項** (187 passed)
  - **執行時間**：830 ms
  - **失敗項目**：0 項

---

## 九、Vite Build 成果與 Chunk 分析

- **建置指令**：`npm --prefix frontend run build` (`tsc && vite build`)
- **建置輸出清單**：
  ```
  dist/index.html                                1.26 kB │ gzip:   0.78 kB
  dist/assets/index-BjE94Mpv.css                14.24 kB │ gzip:   3.51 kB
  dist/assets/gameBriefingConfigs-DN8uItli.js    7.44 kB │ gzip:   3.87 kB
  dist/assets/CodePuzzlePage-CeSjPruS.js        17.74 kB │ gzip:   6.69 kB
  dist/assets/QuizRushPage-CJfpf7ma.js          18.15 kB │ gzip:   5.66 kB
  dist/assets/WebBuilderPage-CZ2AXgM8.js        27.10 kB │ gzip:   9.80 kB
  dist/assets/BugHunterPage-DYAzT1_E.js         29.20 kB │ gzip:  11.29 kB
  dist/assets/CSSDesignerPage-CuYwmhtY.js       29.67 kB │ gzip:  10.98 kB
  dist/assets/vendor-icons-BIDyy1NQ.js          42.24 kB │ gzip:  10.04 kB
  dist/assets/vendor-react-BqYbU4D3.js         133.93 kB │ gzip:  43.13 kB
  dist/assets/theory-data-MoTt3-Ns.js          152.45 kB │ gzip:  45.09 kB
  dist/assets/index-DCZ5bxQG.js                470.96 kB │ gzip: 140.76 kB
  ✓ built in 1.93s
  ```
- **評價**：
  - 成功將所有產物控制在綠色安全範圍內（無任何 chunk 超過 500 kB 警報）。
  - 各遊戲頁面獨立成 17 ~ 30 kB 的小 chunk，實現極致輕量化與按需載入。

---

## 十、各項效能指標的真實量測情況

為遵循實事求是原則，本專案嚴格區分「已實測驗收項目」與「非本環境所能偽造之真實瀏覽器線上指標」，絕不捏造虛假數據：

| 效能評估維度 | 評定狀態 | 說明與量測數據 |
| :--- | :--- | :--- |
| **靜態語法與型別檢查 (TypeScript)** | **BUILD_PASS** | `tsc` 編譯 0 錯誤、0 警告 |
| **生產建置與 Chunk 分拆 (Vite Build)** | **BUILD_PASS** | 建置時間 1.93s，首包由 923 kB 降至 470 kB，消除 500 kB 警報 |
| **計時器清理與防洩漏邏輯** | **UNIT_TEST_PASS** | 4 項專屬單元測試與 187 項回歸測試全數通過 |
| **陳舊 Callback 冪等鎖** | **UNIT_TEST_PASS** | 模擬併發與雙擊結算已由單元測試確認防禦成功 |
| **LocalStorage 異常容錯與隔離** | **UNIT_TEST_PASS** | 損毀 JSON 與多帳號邊界測試通過 |
| **React 重渲染靜態程式碼審查** | **STATIC_CHECK_ONLY** | 已靜態審查計時器 ref 與狀態流向，避免 tick 級重繪 |
| **真實使用者環境 LCP (Largest Contentful Paint)** | **NOT_MEASURED** | 需待線上真實使用者或專用無頭瀏覽器環境進行 RUM 收集，不捏造數值 |
| **真實使用者環境 FID / INP (Interaction to Next Paint)** | **NOT_MEASURED** | 需待真實瀏覽器使用者輸入延遲收集，不捏造數值 |
| **真實使用者環境 CLS (Cumulative Layout Shift)** | **NOT_MEASURED** | 需待各視窗版面實際互動量測，不捏造數值 |

---

## 十一、目前 Git 狀態與資安遵循

1. **Git 狀態確認**：
   - 當前分支：`main`
   - 本批次嚴格遵守「不進行未授權之 git commit、git push 或部署」原則。
   - 所有改動僅保留於本地工作目錄與檔案樹中。
2. **資安規範遵循**：
   - 無使用 `eval()`、`new Function()` 或 `dangerouslySetInnerHTML`。
   - 無寫入或洩漏任何 API Key、Token 或敏感憑證。
   - 資料庫、Prisma、Docker、後端 API 與 Supabase 保持零觸碰；AUTH-03 狀態嚴格維持 `BLOCKED`。
   - 專案整體進度維持現有法定基準 `45.961878%`，不虛報、不超前宣稱。

---

## 十二、結論與未完成項目

### 結論：
- Phase 14 第二份 2.5 小時計畫 Batch 4（前端效能優化與執行穩定性）已圓滿完成。
- 首包 Bundle 體積有效減半（923 kB -> 470 kB），消除了 Vite 預設警報。
- 五款遊戲成功實作按需動態加載（Lazy Loading）與親和友善的載入佔位元件（Suspense Fallback）。
- 計時器生命週期與冪等結算機制已全數補強，並通過 20 個測試檔案、187 項自動化測試的檢驗。

### 未完成項目（依序留待下一批次）：
- **Batch 5**：實際瀏覽器跨裝置操作驗證與端對端（E2E）體驗流暢度驗證。
