# CODE TO KNOW 碼上學｜Phase 14 第二份計畫第 1 批：五款遊戲新手引導與操作一致性報告

- **專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）
- **開發階段**：Phase 14｜互動遊戲與遊戲化學習系統（第二輪品質深化批次 1）
- **核心工作項目**：`P14-GAM-003` 每款遊戲開始前顯示玩法、操作方式、計分規則、時間及注意事項
- **關聯工作項目**：`P14-GAM-001`、`P14-GAM-009`、`P14-GAM-010`、`P14-GAM-012`
- **報告產出時間**：2026-11-14 20:44
- **Git 分支 / HEAD**：`main` / `47c8ba4b176fb19478a8330598ef86a9039f78eb`
- **正式進度基準**：45.961878%（嚴格鎖定）
- **AUTH-03 狀態**：`BLOCKED`（嚴格保持，零後端/資料庫連線）

---

## 一、修改前的問題盤點

經由第一份計畫獨立驗收與程式碼查核發現：
1. **遊戲開始前缺乏統一說明介面**：五款遊戲進入後直接進入關卡，未統一提示學習目標、操作方式、星級判定標準與時間機制，違反 `P14-GAM-003` 規格。
2. **非計時遊戲虛構計時疑慮**：部分提示或說明若模糊使用「倒數」字眼，易讓學生誤以為全部遊戲皆為急迫性倒數限制。
3. **平台遊戲規則與官方檢定容易混淆**：平台自訂的 Combo 連擊、星級（1~3★）與積分制度若未主動宣告，可能使初學者誤認為勞動部正式檢定標準。
4. **結果畫面本次表現與歷史最佳紀錄混淆**：舊版通關結算時僅展示本次分數或覆蓋歷史最佳紀錄，缺乏「本次表現」與「歷史最佳（HighScore / BestStars）」的清晰雙軌對比。
5. **教學提示品質未分層**：部分遊戲直接給出答案，缺乏循序漸進的階層提示。

---

## 二、新增及修改檔案清單

### 1. 新增檔案
- `frontend/src/components/GameBriefingModal.tsx`：五大遊戲共用新手教學與計分說明彈窗組件。
- `frontend/src/data/gameBriefingConfigs.ts`：五大遊戲的新手導引、目標、操作方式、星級規則與防混淆免責宣告規格字典。
- `frontend/tests/game-onboarding-ux.test.ts`：新手引導規格、非計時遊戲無倒數宣稱、分層提示品質單元測試。

### 2. 修改檔案
- `frontend/src/pages/public/CodePuzzlePage.tsx`：整合頂部說明按鈕、掛載說明彈窗，結果畫面分開呈現本次成績與歷史最佳紀錄。
- `frontend/src/pages/public/CSSDesignerPage.tsx`：整合頂部說明按鈕、掛載說明彈窗，結果畫面分開呈現本次成績與歷史最佳紀錄。
- `frontend/src/pages/public/BugHunterPage.tsx`：整合頂部說明按鈕、掛載說明彈窗，結果畫面分開呈現本次成績與歷史最佳紀錄。
- `frontend/src/pages/public/QuizRushPage.tsx`：整合頂部說明按鈕、掛載說明彈窗，結算看板獨立呈現「本局得分」與「歷史最佳得分 / 累積星星」。
- `frontend/src/pages/public/WebBuilderPage.tsx`：整合頂部說明按鈕、掛載說明彈窗，通關彈窗分開呈現本次耗時得分與歷史最佳紀錄。

---

## 三、五款遊戲各自完成的項目

| 遊戲名稱 | 遊戲 ID | 新手引導與規則 | 操作一致性與按鈕標準 | 本次 vs 歷史紀錄分開呈現 |
| :--- | :--- | :--- | :--- | :--- |
| **Code Puzzle** | `code-puzzle` | 說明積木上下順序重組、正向計時、60s/120s 星級 | 提交驗證排序、挑戰下一關、返回遊戲中心 | **已落實**：分開標示「本次通關評級」與「歷史最高得分/最佳星級」 |
| **CSS Designer** | `css-designer` | 說明屬性滑桿與選單、無時間限制、95%/80%/60% 吻合度 | 提交驗證目標、挑戰下一關、重置參數 | **已落實**：分開標示「本次設計評級」與「歷史最高得分/最佳星級」 |
| **Bug Hunter** | `bug-hunter` | 說明代碼行點選與選單修復、正向計時、90s 星級 | 提交檢驗漏洞、挑戰下一關、返回遊戲中心 | **已落實**：分開標示「本次獵蟲評級」與「歷史最高得分/最佳星級」 |
| **Quiz Rush** | `quiz-rush` | 說明 3 模式（15s/20s倒數與精熟無倒數）、Combo 加乘 | 開始測驗、下一題、再次挑戰、返回遊戲中心 | **已落實**：結算看板同時並列「本局得分」與「歷史最佳：X 分」 |
| **Web Builder** | `web-builder` | 說明 HTML5 語意積木、正向計時、120s/240s 星級 | 加入、移除、上移、下移、重設、再次挑戰、下一關 | **已落實**：通關彈窗分開標示「本關得分」與「歷史最高：X 分」 |

---

## 四、教學元件設計（GameBriefingModal）

1. **視覺層次與無障礙**：
   - 包含挑戰目標（Target）、操作手勢（MousePointer）、計時規格（Clock）、關卡規模、星級標準（Star ★★★/★★☆/★☆☆）、漸進提示（Lightbulb）與免責宣告（AlertCircle）。
   - 支援 ESC 鍵與點選遮罩關閉，提供明確的關閉圖示與底部行動按鈕（「我瞭解了，開始挑戰」）。
2. **手機版防裁切保證**：
   - 彈窗採用 `max-height: 90vh` 與 `overflow-y: auto`，寬度設定 `max-width: 560px; width: 100%`，在 320px/375px 小螢幕下平滑滾動，文字不被截斷。
3. **教育平台免責宣告**：
   - 明確標示遊戲計時、Combo、星級與積分為「碼上學」平台專屬之自主學習引導機制，並非勞動部技術士技能檢定正式評分規則（正式檢定為 80 題單選、滿分 100 分、60 分及格），避免觀念混淆。

---

## 五、分層教學提示品質

1. **第一層（思考方向）**：提供整體觀察重點（如：「請重點檢查導覽項目的閉合標籤」、「注意標籤前後的父子包覆關係」），不透露具體代碼。
2. **第二層（具體線索）**：縮小錯誤範圍（如：「第 2 行的無障礙替代文字屬性拼寫可能有誤」）。
3. **第三層（通關詳解與解析）**：在通關結算後完整展開「通關語法解析與規範回顧」或「語意化核心觀念」，詳細解釋標準寫法與規範背景，不得提前暴露答案。

---

## 六、測試案例與建置結果

### 1. 專屬單元測試套件
- 測試檔案：`frontend/tests/game-onboarding-ux.test.ts`
  1. `verifies all five games have standardized briefing configurations` (PASS)
  2. `verifies untimed games do NOT claim fictitious countdown timers` (PASS)
  3. `verifies educational disclaimer is present and does not claim official exam rules` (PASS)
  4. `verifies multi-level hints across Code Puzzle, CSS Designer, Bug Hunter and Web Builder` (PASS)

### 2. 全套回歸測試結果
- 執行指令：`npx --prefix frontend vitest run frontend/tests`
- 執行結果：**19 個測試檔案全數通過，共 178 項測試 100% PASS**（Exit Code 0，耗時 881ms）。

### 3. TypeScript 與 Vite 生產建置結果
- 執行指令：`npm --prefix frontend run build` (`tsc && vite build`)
- 執行結果：**0 errors, 0 warnings**（Exit Code 0，產出 `dist/assets/index-CynBNCe5.js` 922.56 kB）。

---

## 七、UID 對照與待歸屬工作

- `P14-GAM-003`（每款遊戲開始前顯示玩法、操作方式、計分規則、時間及注意事項）：**前端已 100% 達成**。
- `P14-GAM-009`（關卡、難度、提示、重試及通關條件）：**前端已 100% 達成**。
- `P14-GAM-010`（建立分數、時間、星星、點數與獎勵計算規則）：**前端已 100% 達成**。
- 待歸屬工作：後續批次 2 處理中斷恢復（Session State Resilience）與防重複刷分 API，批次 3 進行題庫行號與邊界深入稽核。

---

## 八、Git 狀態

- **分支**：`main`
- **HEAD Commit**：`47c8ba4b176fb19478a8330598ef86a9039f78eb`
- **未暫存變更**：集中於 `frontend/src/` 與 `frontend/tests/`，未執行任何 Git Commit、Push 或部署操作，符合全部安全限制。
