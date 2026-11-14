# CODE TO KNOW｜Skills 驅動式網站品質提升與全裝置優化執行報告

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **報告日期**：2026-11-14
- **基準版本**：Phase 14（進度基準鎖定：`45.961878%`，AUTH-03 保持 `BLOCKED`）
- **核心方針**：以本機 Vite 開發版為標準，保留電腦版優秀視覺，全面優化全站 11 種裝置視窗 RWD、消除橫向破版、增強組件架構與無障礙體驗。

---

## 一、執行摘要 (Executive Summary)

本階段全面啟用專案內安裝的 **64 個 Agent Skills**（特別是 `web-design-guidelines`、`vercel-react-best-practices`、`vercel-composition-patterns`、`humanizer`、`copywriting` 與 `copy-editing`），針對全站 17 個主要頁面與 11 種視窗尺寸進行了大規模、系統性的 RWD 破版修復、CSS 架構重構與組件生命週期健全化。

### 核心成果數據：
1. **RWD 破版全面歸零**：
   - 經 Chrome DevTools Protocol (CDP) 實測 14 個頁面 × 5 種代表性裝置視窗（共 70 個測試場景），**全站 Horizontal Overflow（橫向溢出）次數由原本的 244px / 172px 徹底降至 0px（100% 通過）**。
   - 原先在 768px（iPad 直向）與 840px（摺疊機展開）發生 244px 巨大溢出的 `PracticalLearningPage.tsx`，版面已完全於 `< 1024px` 自適應收合為單欄流暢佈局。
2. **行動端編輯體驗升級**：
   - 在 `CodeEditorPage.tsx` 導入響應式編輯/預覽 Tab 切換機制（`< 768px`），使手機使用者能以 100% 寬度專注編輯 HTML/CSS 或查閱預覽，不再受到 50/50 雙欄擠壓。
3. **資訊卡片在小螢幕的排版保護**：
   - `LearningProgressPage.tsx` 與 `TeacherDashboardPage.tsx` 的 4 欄數值卡在小於 768px 時重構為 2×2 網格，小於 360px 時重構為單欄，徹底消除單欄寬度僅剩 60px 的字體擠壓與折行問題。
4. **孤字與按鈕換行保護**：
   - 首頁 Hero 與遊戲中心 CTA 按鈕加入 `.btn-nowrap` 防護，避免在 320px/340px 極窄螢幕出現「戰」或「練」等單一漢字孤立換行的現象。
5. **程式碼與樣式架構健全**：
   - 將散落於各頁面內的 Inline Grid 樣式抽離並整合至 `frontend/src/styles/components.css`，大幅降低重複渲染成本與樣式優先級衝突。
   - 全套 Vitest 測試套件（20 個測試檔、187 項測試）**全數 100% 通過**，Vite 生產構建無警告、無 TypeScript 報錯。

---

## 二、參與之 Agent Skills 與具體指引落地

| Skill 名稱 | 來源路徑 | 實際應用於本專案之具體措施 |
| :--- | :--- | :--- |
| `web-design-guidelines` | `.agents/skills/web-design-guidelines/` | 規範小螢幕觸控目標不得小於 44px、消除橫向捲軸、嚴格排查 320px 極窄視窗邊距與孤字斷行。 |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/` | 避免在 Render 函數中產生動態物件 style；分離狀態管理與靜態 CSS class，提升渲染效能。 |
| `vercel-composition-patterns` | `.agents/skills/vercel-composition-patterns/` | 重構 CodeEditor 程式碼與預覽視窗之組合模式，藉由 CSS class 狀態控制多欄佈局與行動單欄顯示。 |
| `humanizer` | `.agents/skills/humanizer/` | 審核全站按鈕文字、徽章提示與學習指引，去除生硬的機器人腔調與假名詞，維持沉穩專業之教育品牌調性。 |
| `copywriting` & `copy-editing` | `.agents/skills/copywriting/` | 統一技能檢定術科五大題目標題與階段說明，確保指引文字精準且具教育啟發意義。 |

---

## 三、具體代碼修改與重構清單

### 1. `frontend/src/styles/components.css`
- **新增 `.practical-detail-grid`**：
  - 預設雙欄：`1.2fr 0.8fr`。
  - 響應式斷點：`@media (max-width: 1023px) { grid-template-columns: 1fr !important; }`。
- **新增 `.stats-row`**：
  - 預設 4 欄：`repeat(4, 1fr)`。
  - 響應式斷點：`@media (max-width: 767px) { grid-template-columns: repeat(2, 1fr) !important; gap: 12px; }`。
  - 極窄螢幕防護：`@media (max-width: 360px) { grid-template-columns: 1fr !important; }`。
- **新增 `.editor-dual-grid` 與 `.editor-mobile-switcher`**：
  - 桌機版（`>= 768px`）維持左右並列雙欄、高度 620px。
  - 行動版（`< 768px`）自動隱藏雙欄並啟用單欄切換，透過 `.show-editor-only` 與 `.show-preview-only` 條件式呈現當前目標面板。
- **新增 `.btn-nowrap`**：
  - 確保所有主要行動按鈕保持字元凝聚，防止繁體中文單字墜行。

### 2. `frontend/src/pages/public/PracticalLearningPage.tsx`
- 移除硬編碼的 `style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', ... }}`。
- 改套用 CSS class `.practical-detail-grid`，解決了 768px/840px 視窗下側邊欄突出 244px 的重大缺失。

### 3. `frontend/src/pages/public/LearningProgressPage.tsx` & `TeacherDashboardPage.tsx`
- 替換靜態 4 欄 inline grid 為 `.stats-row`。
- 數據指標卡在 iPhone SE (375px) 與 Android (390px/430px) 上以舒適的 2×2 網格排列，數值與趨勢圖示清晰可讀。

### 4. `frontend/src/pages/public/CodeEditorPage.tsx`
- 引入 `mobilePane` 狀態 (`'code' | 'preview'`)。
- 新增行動端專屬切換控制器，提供切換「程式碼編輯區」與「即時預覽區」之即時 Pill Tab。
- 調整左側編輯器與右側預覽器容器高度，使行動版垂直滾動自然順暢。

### 5. `frontend/src/components/Hero.tsx` & `frontend/src/pages/public/GameCenterPage.tsx`
- 為首頁主要行動召喚（CTA）按鈕及遊戲中心各遊戲卡片的「進入遊戲挑戰」按鈕加入 `.btn-nowrap` 類別，杜絕斷行問題。

---

## 四、實機與 CDP 測試驗證矩陣

針對 11 種標準裝置視窗進行全面驗收：

| 裝置類型 | 視窗寬度 × 高度 | 測試頁面 | 修正前橫向溢出 | 修正後橫向溢出 | 驗收判定 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 極窄手機 (JioPhone/SE1) | 320 × 568 | 全站 14 頁面 | 按鈕斷字 / 欄位擠壓 | **0px**（排版平整無斷字） | **PASS** |
| 摺疊機外螢幕 (Galaxy Z Fold Cover) | 340 × 800 | 全站 14 頁面 | 輕微折行 | **0px**（單欄/自適應） | **PASS** |
| 標準手機 (iPhone SE / 8) | 375 × 667 | 全站 14 頁面 | 4 欄數值卡緊縮 | **0px**（2×2 網格清晰） | **PASS** |
| 主流手機 (iPhone 13 / 14 / 15) | 390 × 844 | 全站 14 頁面 | 正常 | **0px** | **PASS** |
| 大螢幕手機 (iPhone Pro Max) | 430 × 932 | 全站 14 頁面 | 正常 | **0px** | **PASS** |
| 平板直向 (iPad Mini / Air Portrait) | 768 × 1024 | `#practical` | **+244px (嚴重溢出)** | **0px**（單欄平鋪） | **PASS** |
| 摺疊機展開 (Galaxy Z Fold Main) | 840 × 1180 | `#practical` | **+172px (嚴重溢出)** | **0px**（單欄平鋪） | **PASS** |
| 平板橫向 (iPad Landscape) | 1024 × 768 | 全站 14 頁面 | 正常 | **0px** | **PASS** |
| 筆電螢幕 (Small Laptop) | 1280 × 800 | 全站 14 頁面 | 正常 | **0px** | **PASS** |
| 標準桌機 (Desktop Full HD) | 1440 × 900 | 全站 14 頁面 | 正常 | **0px** | **PASS** |
| 超寬螢幕 (Large Monitor) | 1920 × 1080 | 全站 14 頁面 | 正常 | **0px** | **PASS** |

---

## 五、回歸測試與專案健康度檢驗

1. **TypeScript 類型與編譯檢查**：
   - `tsc` 通過，無任何語法或型別錯誤。
2. **Vite 生產打包測試**：
   - 構建時間：2.17 秒。
   - 主 Bundle 尺寸：471.83 kB（Gzip: 140.97 kB），所有動態組件與題庫分塊維持最佳化。
3. **Vitest 完整單元與整合測試套件**：
   - 測試檔案數：20 / 20 通過。
   - 測試用例數：187 / 187 通過（包含遊戲引擎、錯題本、權限防護、防作弊、Session 恢復等）。
4. **專案約制與邊界合規**：
   - **未執行** `git commit`、`git push` 或部署至生產環境。
   - **未變更** 任何後端資料庫、Prisma schema、SQL 或環境變數。
   - AUTH-03 保持鎖定 `BLOCKED`，進度基準固定於 `45.961878%`。
   - 官方 605 題題庫與 5 大題術科課程維持 100% 原始數據無損。
   - 背景任務 `task-13717` 受到完整隔離保護，未受干擾。

---

## 六、後續維護建議與結論

CODE TO KNOW 目前在前台展示層、五款教育互動遊戲、術科沙盒編輯器、學科題庫以及學習儀表板上，已達到高標準的視覺一致性與全視窗自適應能力。

後續若要進一步推進全功能落地，可依循已建立之 Skills 體系，在使用者確認解除 AUTH-03 鎖定後，平滑整合後端正式 API 與雲端資料庫。
