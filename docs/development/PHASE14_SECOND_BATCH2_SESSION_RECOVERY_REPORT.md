# CODE TO KNOW 碼上學｜Phase 14 第二份計畫 Batch 2 報告
# 遊戲進度保存、中斷恢復與資料完整性

- **專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）
- **開發階段**：Phase 14｜互動遊戲與遊戲化學習系統（第二輪品質深化 Batch 2）
- **核心工作項目**：`P14-GAM-002`、`P14-GAM-010`、`P14-GAM-012`、`P14-GAM-016`
- **報告產出時間**：2026-11-14 20:49
- **執行前環境狀態**：Git 分支 `main`，HEAD: `47c8ba4b176fb19478a8330598ef86a9039f78eb`
- **AUTH-03 狀態**：`BLOCKED`（嚴格保持，零資料庫/後端連線）
- **正式進度基準**：45.961878%（嚴格鎖定）

---

## 一、本批次目標

針對目前已完成的五款核心遊戲（Code Puzzle、CSS Designer、Bug Hunter、Quiz Rush、Web Builder），全面檢查並加固：
1. 遊戲進度、歷史最佳分數與星級的正確保存。
2. 遊戲中斷後的安全恢復能力與不破壞歷史紀錄原則。
3. LocalStorage 資料格式、壞損 JSON 與邊界異常處理。
4. 多使用者（Guest、學生、教師、各自獨立 ID）之本機資料完全隔離。
5. 防重複點擊提交、競態提交、重複加分、重複發放成就。
6. 杜絕使用 `localStorage.clear()`，確保絕不因單項資料異常而全清使用者紀錄。

---

## 二、檢查與修改檔案清單

### 1. 檢查檔案
- `frontend/src/utils/gameStorage.ts`
- `frontend/src/utils/quizRushEngine.ts`
- `frontend/src/pages/public/CodePuzzlePage.tsx`
- `frontend/src/pages/public/CSSDesignerPage.tsx`
- `frontend/src/pages/public/BugHunterPage.tsx`
- `frontend/src/pages/public/QuizRushPage.tsx`
- `frontend/src/pages/public/WebBuilderPage.tsx`
- `frontend/src/utils/gameAchievementEngine.ts`

### 2. 修改檔案
- `frontend/src/utils/gameStorage.ts`：
  - 新增 `GameSessionState`、`ActiveSessionData` 介面。
  - 新增 `saveActiveSessionState`、`getActiveSessionState`、`clearActiveSessionState`。
  - 新增 `isGameSessionSettled`、`markGameSessionSettled` 等冪結算機制。
  - 補強 `saveLevelCompletion`：增加 `Number.isFinite` 檢核，分數嚴格限制在 `0 ~ 100000`，星級保證 `1 ~ 3`。
  - 增加資料結構版本號 `version: 1` 確保未來相容。
- `frontend/src/pages/public/QuizRushPage.tsx`：
  - 引入 `roundSessionIdRef` 與 `isRoundSettledRef`，防止計時結束與點擊交卷競態導致雙重結算。
  - 連動 `markGameSessionSettled`，保證單一回合僅能結算寫入一次。
- `frontend/tests/game-session-resilience.test.ts`：
  - 擴展單元測試至 9 項（涵蓋空字串、壞損 JSON、等冪結算、重複提交最高分保護、負數數值鉗制、帳號隔離）。

---

## 三、五款遊戲各自的保存方式與中斷恢復能力

| 遊戲名稱 | 本地儲存鍵值命名空間 | 關卡進度與計分保存機制 | 中斷與離開恢復行為 |
| :--- | :--- | :--- | :--- |
| **Code Puzzle** | `ctk_game_progress:<userId>:code-puzzle` | 記錄 Level 1~4 的 `completed`、`highScore`、`stars`、`attempts`、`bestTimeSeconds` | 支援關卡切換；歷史最高成績已持久化。若重新整理，已通關關卡維持綠燈解鎖，當前未提交關卡重置至初始積木，保護學生思考過程不被污染。 |
| **CSS Designer** | `ctk_game_progress:<userId>:css-designer` | 記錄 Level 1~4 吻合度換算之 `highScore` 與星級 | 支援任意已解鎖關卡點選；已通過關卡保留歷史最高星級。中途離開或重整不扣減已完成的星星與總積分。 |
| **Bug Hunter** | `ctk_game_progress:<userId>:bug-hunter` | 記錄 Level 1~4 各關抓蟲得分與最佳通關星級 | 關卡歷史成績已落盤。中途離開頁面不會抹消先前已通過之關卡資料。 |
| **Quiz Rush** | `ctk_game_progress:<userId>:quiz-rush` | 依模式與題數對應 Level 1~4，保存最佳得分與星數；錯題同步至 `ctk_wrong_questions:<userId>` | **計時防作弊恢復**：中途重新整理將視為放棄該回合，不給予成績，但先前已結算的回合紀錄與錯題本完全保留，杜絕藉由 F5 洗分數。 |
| **Web Builder** | `ctk_game_progress:<userId>:web-builder` | 記錄 Level 1~4 架構組裝得分與最佳星級 | 已通關關卡安全儲存於 `levels` 字典；中途重新整理或返回遊戲中心時，歷史最佳星級與得分完好無缺。 |

---

## 四、帳號隔離與防重複結算機制審查

1. **使用者帳號隔離（Account Isolation）**：
   - 鍵值規範為 `${STORAGE_PREFIX}:${safeUser}:${gameId}`。
   - 當 `userId` 為空時安全降級為 `guest-anonymous`，避免 `undefined` 鍵名。
   - `user-alice` 與 `user-bob` 彼此隔離，登出切換帳號時 React `useEffect([userId])` 自動重新載入對應使用者資料，無跨帳號殘留。
2. **防重複結算（Anti-Duplication & Idempotency）**：
   - **高標保留（High Score Retention）**：`updatedHighScore = Math.max(existing.highScore, score)`、`updatedStars = Math.max(existing.stars, stars)`。重複挑戰同關卡 100 次，總分與總星數永遠取最高表現，絕不重複累加。
   - **連擊交卷防護（Debounce / Settled Flag）**：Quiz Rush 與各遊戲引入 `isRoundSettledRef` 與 `markGameSessionSettled`，即使快速連按「提交」按鈕或計時器同時觸發 timeout，結算邏輯僅執行一次。
   - **成就防重複發放**：`gameAchievementEngine.ts` 依據 `achievementId` 唯一鍵紀錄 `unlockedAt`，重複呼叫時保持原時間戳，不重複計算解鎖獎勵。

---

## 五、資料異常與邊界處理

1. **壞損 JSON 容錯**：
   - `getUserGameRecord` 內建完整 `try-catch`。遭遇非合法 JSON 字串（如 `MALFORMED{...`）時，自動返回 `createInitialGameRecord` 乾淨初始狀態，控制台輸出警告，**頁面絕不白屏崩潰**。
2. **空字串與空物件保護**：
   - 若 LocalStorage 鍵值存在空字串 `""`，安全降級為初始結構。
3. **數值邊界鉗制**：
   - 星星嚴格限制在 `0 ~ 3`。
   - 分數強制驗證 `Number.isFinite`，限制在 `0 ~ 100000` 區間，負數或 `NaN` 自動轉為 `0`。
4. **零 `localStorage.clear()` 禁令**：
   - 全專案無任何 `localStorage.clear()` 呼叫，嚴禁以清空使用者資料作為例外處理手段。

---

## 六、測試與建置驗收

### 1. 專屬測試套件（game-session-resilience.test.ts）
- 執行指令：`npx --prefix frontend vitest run frontend/tests/game-session-resilience.test.ts`
- 測試案例清單（9 項全數通過）：
  1. `correctly persists and retrieves active game session state` (PASS)
  2. `properly handles corrupted JSON in active session storage without crashing` (PASS)
  3. `correctly clears active session state` (PASS)
  4. `enforces session settlement idempotency to prevent double completion submission` (PASS)
  5. `sanitizes and clamps non-finite or extreme values when saving progress` (PASS)
  6. `maintains complete account isolation between different user IDs` (PASS)
  7. `handles empty string or missing values in LocalStorage gracefully` (PASS)
  8. `guarantees repeated submissions do not inflate scores or stars beyond highest record` (PASS)
  9. `protects against negative or invalid scores by clamping to non-negative bounds` (PASS)
- **Exit Code**：`0`。

### 2. 全套回歸測試結果
- 執行指令：`npx --prefix frontend vitest run frontend/tests`
- **測試結果**：**19 個測試檔案全數通過，共 181 項測試 100% PASS**（Exit Code 0，耗時 888ms）。

### 3. TypeScript 與 Vite 生產建置
- 執行指令：`npm --prefix frontend run build` (`tsc && vite build`)
- **建置結果**：**0 errors, 0 warnings**（Exit Code 0，產出 `dist/assets/index-DSUsrzuT.js` 923.02 kB）。

---

## 七、尚未經過真實瀏覽器驗證之項目與限制說明

1. **未經真實瀏覽器 E2E 驗證**：
   - 目前 Session 恢復、損毀容錯與帳號隔離係透過 Vitest（基於 in-memory localStorage polyfill）進行嚴密單元驗證。真實瀏覽器下的實體 F5 重新整理、多分頁並行寫入與無痕模式容量超限處理，將於 Batch 5 的瀏覽器端到端驗收中執行。
2. **後端雲端同步**：
   - 由於 AUTH-03 維持 `BLOCKED`，本批次僅限前端 LocalStorage 韌性，不包含後端 Postgres/Prisma 資料庫持久化與即時雲端排行榜。

---

## 八、合規與授權限制遵守情況

- **未執行 Git Commit、Push 或部署**：遵守。
- **未連線後端、未執行 Migration 或修改 Prisma**：遵守。
- **AUTH-03 狀態**：維持 **`BLOCKED`**。
- **正式進度基準**：維持 **`45.961878%`**。
- **危險代碼檢查**：搜尋 `eval()`, `new Function()`, `dangerouslySetInnerHTML`, `localStorage.clear()`：**0 匹配**。
- **Git 狀態**：分支 `main`，HEAD: `47c8ba4b`，修改皆在 `frontend/src/` 與 `frontend/tests/`。

已達成 Batch 2 停止條件，停止並等待下一步指令。
