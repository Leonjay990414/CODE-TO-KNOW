# 碼上學｜CODE TO KNOW
# 第五波 37 項法定 UID 雙向溯源與工程驗收矩陣 (Phase 5 UID Traceability Matrix)

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件編號：** `DOC-TRC-20261118-P5-37UID`  
**建立日期：** 2026 年 11 月 18 日  
**涵蓋階段：**  
- **Phase 11：AI 智慧教學與分析系統**（11 項 UID）
- **Phase 14：互動遊戲與遊戲化學習系統**（16 項 UID）
- **Phase 17：品牌行銷與數位媒體中心**（10 項 UID，全數使用 `P17-MED-`）
**總項目數：** **37 個唯一 UID**  
**目前狀態分佈：** **PASS: 15 項**｜**PARTIAL: 19 項**｜**NOT STARTED: 3 項**｜**BLOCKED: 0 項**  

---

## 一、Phase 11：AI 智慧教學與分析系統 (11 項 UID)

### 1. P11-AIS-001：可用模型與隱私條款評估
- **目前狀態：** PARTIAL (30%)
- **尚缺功能：** 尚未簽署正式商用 LLM (Gemini 1.5 Pro/Flash) 服務協議，缺少正式版年齡驗證與資料處理合規條款。
- **涉及前端：** `frontend/src/pages/public/AICoachPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 是（商用 LLM 服務）
- **前置依賴：** 專案負責人簽署資料合約
- **具體實作內容：** 在 UI 顯著展示本機啟發式免責宣告、學生學習隱私保護提醒及家長同意說明。
- **自動化測試：** `frontend/tests/p1-repair-verification.test.tsx`
- **驗收標準：** 包含顯著的「*展示版示範模型／評估指標」標註，無假冒雲端 AI 連線宣稱。
- **風險與回復：** 無破壞性風險；若文案需微調直接編輯靜態字串。

### 2. P11-AIS-002：伺服器端 AI 安全代理中繼
- **目前狀態：** PARTIAL (30%)
- **尚缺功能：** 後端 Express 尚未實裝 `/api/ai/chat` 代理中繼轉發控制器。
- **涉及前端：** `frontend/src/utils/aiStreamClient.ts`
- **涉及後端：** `backend/src/routes/ai.routes.ts`, `backend/src/controllers/ai.controller.ts`
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 是（Google Gemini API）
- **前置依賴：** 伺服器端環境變數 `GEMINI_API_KEY` 授權配置
- **具體實作內容：** 建立安全的後端 Express 路由，由後端向 Google API 發起請求，**API Key 嚴禁透傳給前端**。
- **自動化測試：** `backend/tests/ai-proxy.test.ts`（規劃中）
- **驗收標準：** 前端原始碼與網路請求中完全無任何金鑰洩漏。
- **風險與回復：** 網路超時或金鑰失效時自動回退至本機規則引擎。

### 3. P11-AIS-003：身分權限、用量與預算限制
- **目前狀態：** PARTIAL (25%)
- **尚缺功能：** 缺少後端 Token 計量中介軟體、每日每人請求次數上限檢查與資料庫用量扣減。
- **涉及前端：** `frontend/src/pages/public/AICoachPage.tsx`
- **涉及後端：** `backend/src/middleware/rateLimiter.ts`
- **涉及 DB / Prisma：** 是（`UserUsage` 表扣減，需授權）
- **涉及外部 API：** 否
- **前置依賴：** P11-AIS-002 後端代理
- **具體實作內容：** 前端限制訪客每分鐘 3 次提問；後端實作 IP / UserID 雙層 Rate Limiting。
- **自動化測試：** `backend/tests/security.test.ts`
- **驗收標準：** 超額提問時回傳 HTTP 429 Too Many Requests 並提供友善倒數提示。
- **風險與回復：** 本機測試環境使用記憶體 Rate-Limiter，不影響實體資料庫。

### 4. P11-AIS-004：HTML / CSS / JavaScript 分類教學能力
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無（前端已完備技術分類器）
- **涉及前端：** `frontend/src/utils/aiFallbackEngine.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** `classifyTechnology` 函式精準判斷 HTML 標籤語法、CSS 排版選擇器、JavaScript 邏輯與 GENERAL 通用概念。
- **自動化測試：** `frontend/tests/ai-scaffolding.test.ts` (11-38 行)
- **驗收標準：** 輸入各領域關鍵字時，100% 精準對應至正確領域分類。
- **風險與回復：** 純函式無風險。

### 5. P11-AIS-005：分階段提示（理解題意、破題思路、邊界提示、架構解構）
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無（四階段蘇格拉底鷹架已落地）
- **涉及前端：** `frontend/src/utils/aiFallbackEngine.ts`, `frontend/src/components/AIScaffoldingDemo.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 依循四階段認知鷹架（`CONCEPT_FOCUS` → `PROBLEM_SOLVING` → `BOUNDARY_HINT` → `ARCHITECTURE`），強制禁止直接給予完整代碼。
- **自動化測試：** `frontend/tests/ai-scaffolding.test.ts` (40-56 行)
- **驗收標準：** 點擊不同階段提示時，呈現漸進式引導問題，無解答透漏。
- **風險與回復：** 純前端組件無風險。

### 6. P11-AIS-006：程式碼與版面檢查（規則與 AI 判斷分離）
- **目前狀態：** PARTIAL (60%)
- **尚缺功能：** 缺少進階 AST 抽象語法樹解析引擎與複雜版面 DOM 比對。
- **涉及前端：** `frontend/src/utils/aiFallbackEngine.ts`, `frontend/src/pages/public/CodeEditorPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 內建 4 組常見考場錯誤模式（如 float 未清除、未加 doctype、標籤未閉合），標註「離線語法規則」。
- **自動化測試：** `frontend/tests/ai-scaffolding.test.ts` (58-86 行)
- **驗收標準：** 常見語法錯誤在編輯器中呈現標記，清楚區分「語法規則」與「AI 建議」。
- **風險與回復：** 正則匹配在前端執行，設有長度防護避免 ReDoS。

### 7. P11-AIS-007：題目語意分析、錯題分類與弱點分析
- **目前狀態：** PARTIAL (50%)
- **尚缺功能：** 缺乏向量 Embedding 資料庫與語意聚類模型。
- **涉及前端：** `frontend/src/utils/wrongQuestionsStorage.ts`, `frontend/src/pages/public/LearningProgressPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 本機錯題本儲存
- **具體實作內容：** 本機統計 10400 五大單元答錯率，動態產生能力分析百分比。
- **自動化測試：** `frontend/tests/wrong-questions-storage.test.ts`
- **驗收標準：** 學生完成測驗後，錯題即時歸入對應知識點單元。
- **風險與回復：** 格式異常時自動回退預設空陣列。

### 8. P11-AIS-008：AI 輸出安全過濾與檢視機制
- **目前狀態：** PARTIAL (20%)
- **尚缺功能：** 缺少即時 LLM 輸出敏感詞過濾管線與教師檢舉管理佇列。
- **涉及前端：** `frontend/src/pages/public/AICoachPage.tsx`
- **涉及後端：** `backend/src/middleware/contentModeration.ts`（規劃中）
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 敏感詞辭典建置
- **具體實作內容：** 本機離線規則庫採用預先審核字串，UI 提供不當回報按鈕。
- **自動化測試：** 前端回報 Modal 測試
- **驗收標準：** 包含考場作弊防範提示與回報互動彈窗。
- **風險與回復：** 本地狀態安全重置。

### 9. P11-AIS-009：模型版本、Prompt 版本與成本紀錄
- **目前狀態：** **PASS (100% 歷史保護基準)**
- **尚缺功能：** 無（靜態 Prompt 元資料已完備）
- **涉及前端：** `frontend/src/utils/aiFallbackEngine.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 保留 `AIS_009_PROMPT_METADATA` (`v1.4.0-socratic-offline`) 常數與版本紀錄。
- **自動化測試：** `frontend/tests/ai-scaffolding.test.ts` (107-118 行)
- **驗收標準：** 版本號、作者、更新日期與啟發式規則清冊完整落盤。
- **風險與回復：** 歷史基準，凍結保護。

### 10. P11-AIS-010：標準測試題品質評估
- **目前狀態：** PARTIAL (60%)
- **尚缺功能：** 尚未對接線上即時 LLM 進行全量 114 題之語義品質迴歸矩陣。
- **涉及前端：** `frontend/tests/ai-scaffolding.test.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 題庫建立
- **具體實作內容：** 使用標準考場真實問題進行前端引導回應之正確性斷言測試。
- **自動化測試：** `frontend/tests/ai-scaffolding.test.ts`
- **驗收標準：** 單元測試 15 項全數 PASS。
- **風險與回復：** 無破壞性風險。

### 11. P11-AIS-011：未串接真實模型前全數標示示範
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無（透明度防偽已 100% 落地）
- **涉及前端：** `frontend/src/pages/public/AICoachPage.tsx`, `frontend/src/components/AIScaffoldingDemo.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 全站標註「*展示版示範模型／評估指標」，禁止任何虛假即時 AI 宣稱。
- **自動化測試：** `frontend/tests/p1-repair-verification.test.tsx`
- **驗收標準：** 包含顯著橫幅與文字說明，符合教育誠信。
- **風險與回復：** 純 UI 標註，無回退風險。

---

## 二、Phase 14：互動遊戲與遊戲化學習系統 (16 項 UID)

### 12. P14-GAM-001：獨立遊戲中心首頁、導覽、分類與搜尋
- **目前狀態：** **PARTIAL (70% - 前端全功能完備上限)**
- **尚缺功能：** 缺少全站動態活動橫幅 API。
- **涉及前端：** `frontend/src/pages/public/GameCenterPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 整合 `#games` 路由、關鍵字即時搜尋框、5 大遊戲分類篩選按鈕、無符合搜尋結果之空狀態。
- **自動化測試：** `frontend/tests/game-onboarding-ux.test.ts`
- **驗收標準：** 搜尋關鍵字或點擊分類時，遊戲卡片即時過濾，觸控目標 ≥ 44px。
- **風險與回復：** 本地狀態篩選，無破壞性。

### 13. P14-GAM-002：定義遊戲資料模型（關卡、規則、版本、狀態）
- **目前狀態：** **PARTIAL (70%)**
- **尚缺功能：** 後端 Prisma `GameSession` 模型與 RESTful API 未建。
- **涉及前端：** `frontend/src/utils/gameStorage.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 是（後續雲端同步需授權）
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** TypeScript 完整定義 `GameLevelProgress`, `GameScoreDetail`, `GameType`，支援 LocalStorage 前綴隔離與損毀回退。
- **自動化測試：** `frontend/tests/game-session-resilience.test.ts`
- **驗收標準：** JSON 損毀時安全降級為乾淨狀態，無白屏崩潰。
- **風險與回復：** 雙重儲存容錯機制。

### 14. P14-GAM-003：關卡開始前規則、計分與注意事項簡報
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/components/GameBriefingModal.tsx`, `frontend/src/data/games/gameBriefingConfigs.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 5 款遊戲均有專屬目標、計分、星級條件與操作提示簡報，支援 Esc 關閉與無障礙焦點管理。
- **自動化測試：** `frontend/tests/game-onboarding-ux.test.ts`
- **驗收標準：** 進入遊戲前自動彈出，點擊開始進入關卡。
- **風險與回復：** 純前端組件無風險。

### 15. P14-GAM-004：Code Puzzle 程式邏輯與流程拼圖
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/pages/public/CodePuzzlePage.tsx`, `frontend/src/data/games/codePuzzleData.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 4 大關卡語法結構重組、鍵盤上/下方向鍵移動積木、語法巢狀多解比對、三星評分結算。
- **自動化測試：** `frontend/tests/code-puzzle-game.test.ts`
- **驗收標準：** 積木組裝順序正確即判定通關，支援鍵盤無障礙。
- **風險與回復：** 純前端無副作用。

### 16. P14-GAM-005：CSS Designer 樣式理解與視覺微調
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/pages/public/CSSDesignerPage.tsx`, `frontend/src/data/games/cssDesignerData.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 4 大關卡視覺化數值滑桿調整（Flexbox, Grid, Margin, Color），實時容差比對公式。
- **自動化測試：** `frontend/tests/css-designer-game.test.ts` (22 項測試 PASS)
- **驗收標準：** 容差範圍內即時判定通關，星級正確點亮。
- **風險與回復：** 樣式沙箱無副作用。

### 17. P14-GAM-006：Bug Hunter 程式錯誤辨識與除錯特工
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/pages/public/BugHunterPage.tsx`, `frontend/src/data/games/bugHunterData.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 4 大關卡行級診斷挑戰，雷達標註常見 HTML/CSS 陷阱，點擊修復並校驗結果。
- **自動化測試：** `frontend/tests/bug-hunter-game.test.ts` (13 項測試 PASS)
- **驗收標準：** 修復全部語法錯誤即判定過關。
- **風險與回復：** 純前端無副作用。

### 18. P14-GAM-007：Quiz Rush 證照知識快問快答
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/pages/public/QuizRushPage.tsx`, `frontend/src/utils/quizRushEngine.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 題庫資料
- **具體實作內容：** 倒數計時急速答題、Combo 連擊加分動效、隨機抽選題型、錯題即時寫入錯題本。
- **自動化測試：** `frontend/tests/quiz-rush-game.test.ts` (17 項測試 PASS)
- **驗收標準：** 計時結束或作答完畢結算成績，錯題自動加入 `ctk_wrong_questions`。
- **風險與回復：** 本地狀態管理。

### 19. P14-GAM-008：Web Builder 元件組合與網頁搭建
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/pages/public/WebBuilderPage.tsx`, `frontend/src/data/games/webBuilderData.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 4 大關卡語意化積木拼裝完整頁面、雙欄即時預覽、語法樹校驗與輸出代碼。
- **自動化測試：** `frontend/tests/web-builder-game.test.ts`
- **驗收標準：** 拼裝完成後在沙箱中正常渲染出完整版面。
- **風險與回復：** 沙箱隔離防止 XSS。

### 20. P14-GAM-009：關卡、難度、提示與重試機制
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** 各遊戲資料檔與頁面元件
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 5 款遊戲均配置 4 個漸進難度關卡、使用提示扣減得分/星等、一鍵重置重試。
- **自動化測試：** `frontend/tests/game-content-quality-audit.test.ts`
- **驗收標準：** 通關條件明確，重試無殘留狀態。
- **風險與回復：** 純前端無副作用。

### 21. P14-GAM-010：分數、星星、點數與防作弊計算規則
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `frontend/src/utils/gameStorage.ts`, `frontend/src/utils/quizRushEngine.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 1~3 星評分計算、時間係數加權、數值有限性（`isFinite`）檢驗與防竄改雜湊保護。
- **自動化測試：** `frontend/tests/game-session-resilience.test.ts`
- **驗收標準：** 異常負數或非法高分自動修正為安全邊界。
- **風險與回復：** 本地狀態安全檢驗。

### 22. P14-GAM-011：每日任務、連續學習與成就系統
- **目前狀態：** **PARTIAL (70%)**
- **尚缺功能：** 缺少可解鎖之外觀裝扮與客製化元件商店。
- **涉及前端：** `frontend/src/utils/gameAchievementEngine.ts`, `frontend/src/components/GameAchievementsModal.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 9 項核心成就（如急速先鋒、除錯專家、樣式大師）條件監聽與解鎖進度條展示。
- **自動化測試：** `frontend/tests/game-session-resilience.test.ts`
- **驗收標準：** 符合條件時彈出成就解鎖通知。
- **風險與回復：** 本地存儲隔離。

### 23. P14-GAM-012：遊戲紀錄、個人進度與防重複送分
- **目前狀態：** **PARTIAL (50%)**
- **尚缺功能：** 缺少全站雲端即時排行榜後端 API 與資料庫同步。
- **涉及前端：** `frontend/src/utils/gameStorage.ts`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 是（雲端存檔需授權）
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 本地進度依 `ctk_game_progress:${userId}` 嚴格隔離，具備時間戳防刷保護。
- **自動化測試：** `frontend/tests/game-session-resilience.test.ts`
- **驗收標準：** 重新整理網頁後進度不遺失。
- **風險與回復：** 雙重相容回退。

### 24. P14-GAM-013：課程、題庫、考試與遊戲學習目標連動
- **目前狀態：** **PARTIAL (60%)**
- **尚缺功能：** 尚未完成課程章節與遊戲關卡的雙向互鎖解鎖機制。
- **涉及前端：** `frontend/src/pages/public/QuizRushPage.tsx`, `frontend/src/pages/public/LearningProgressPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 錯題本機制
- **具體實作內容：** Quiz Rush 答錯即時單向寫入錯題本，供學習歷程頁面分析。
- **自動化測試：** `frontend/tests/quiz-rush-game.test.ts`
- **驗收標準：** 遊戲錯題在錯題本中正確出現並標註來源。
- **風險與回復：** 本機錯題本安全更新。

### 25. P14-GAM-014：教師指派遊戲任務與班級挑戰
- **目前狀態：** **NOT STARTED (0%)**
- **尚缺功能：** 教師後台完全無指派遊戲關卡與班級通關統計功能。
- **涉及前端：** `frontend/src/pages/public/TeacherDashboardPage.tsx`
- **涉及後端：** `backend/src/modules/classroom/`（規劃中）
- **涉及 DB / Prisma：** 否（第一階段採用本機原型儲存）
- **涉及外部 API：** 否
- **前置依賴：** 教師後台元件
- **具體實作內容：** 在教師端增設「遊戲作業指派」面板，教師勾選遊戲與關卡產生指派代碼，存於 `ctk_teacher_game_tasks`。
- **自動化測試：** `frontend/tests/teacher-dashboard-classroom.test.tsx`
- **驗收標準：** 教師可新增遊戲作業，學生端可看見被指派之關卡。
- **風險與回復：** 本地原型儲存，零資料庫風險。

### 26. P14-GAM-015：管理員新增、編輯、停用遊戲與參數管理
- **目前狀態：** **NOT STARTED (0%)**
- **尚缺功能：** 管理員後台無動態遊戲參數調整介面。
- **涉及前端：** `frontend/src/pages/public/AdminDashboardPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否（第一階段採用本機原型設定）
- **涉及外部 API：** 否
- **前置依賴：** 管理員後台元件
- **具體實作內容：** 在管理員後台增設「遊戲參數設定」頁籤，支援調整各遊戲倒數時間、容差標準與開關狀態，存於 `ctk_admin_game_configs`。
- **自動化測試：** `frontend/tests/admin-hardening.test.ts`
- **驗收標準：** 調整參數後，遊戲啟動時優先讀取客製化設定。
- **風險與回復：** 設有重置為預設值按鈕。

### 27. P14-GAM-016：遊戲平衡、可用性、無障礙與內容安全
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** 全體遊戲頁面
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 支援全鍵盤 Tab/Enter/方向鍵操作，具備計時器 unmount 自動釋放、防記憶體洩漏與 WAI-ARIA 宣告。
- **自動化測試：** `frontend/tests/game-performance-stability.test.ts`, `frontend/tests/a11y-keyboard-navigation.test.tsx`
- **驗收標準：** 鍵盤全功能可用，組件卸載後無背景計時器運作。
- **風險與回復：** 純前端無副作用。

---

## 三、Phase 17：品牌行銷與數位媒體中心 (10 項 UID，全數使用 `P17-MED-`)

### 28. P17-MED-001：官方品牌核心帳號與管理規範
- **目前狀態：** PARTIAL (50%)
- **尚缺功能：** 外部社群官方帳號尚未正式開通並完成實名認證。
- **涉及前端：** `frontend/src/components/Footer.tsx`, `docs/BRAND_GUIDELINES.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 品牌註冊與域名確認
- **具體實作內容：** 制定單一核心品牌原則與外部社群對齊規範。
- **自動化測試：** 文件稽核
- **驗收標準：** 規範文件完整落盤。
- **風險與回復：** 純文件無風險。

### 29. P17-MED-002：社群平台名稱可用性盤點
- **目前狀態：** PARTIAL (20%)
- **尚缺功能：** 缺少各大平台實名帳號名稱註冊清查清單。
- **涉及前端：** `docs/marketing/MARKETING_SOP.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 完成 Instagram, Threads, YouTube, Facebook 等渠道名稱佔位與權益分析。
- **自動化測試：** 文件稽核
- **驗收標準：** 列出優先推薦 ID。
- **風險與回復：** 無風險。

### 30. P17-MED-003：帳號持有人、管理員與雙重驗證 (2FA) 規範
- **目前狀態：** PARTIAL (40%)
- **尚缺功能：** 外部生產帳號 2FA 實體綁定尚未實施。
- **涉及前端：** `docs/marketing/MARKETING_SOP.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 核心帳號開通
- **具體實作內容：** 明訂管理權限分層、緊急移轉與 2FA 密鑰備份流程。
- **自動化測試：** 文件檢核
- **驗收標準：** 安全標準作業程序完備。
- **風險與回復：** 無風險。

### 31. P17-MED-004：內容企劃、發布日曆、審稿與授權流程
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `docs/marketing/MARKETING_SOP.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 建立 5 步驟標準作業流程（企劃 → 實測 → 審查 → 分發 → 追蹤）與審稿檢核表。
- **自動化測試：** 流程檢核
- **驗收標準：** 流程明確並納入專案文件。
- **風險與回復：** 無風險。

### 32. P17-MED-005：短影音、教學影片、品牌介紹系列
- **目前狀態：** **NOT STARTED (0%)**
- **尚缺功能：** 尚未實際產出短影音或宣傳影片實體素材檔案。
- **涉及前端：** `frontend/src/pages/public/MediaCenterPage.tsx`（規劃中）
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 宣傳腳本設計
- **具體實作內容：** 建立媒體中心展示頁，內嵌官方 YouTube 播放清單與靜態宣傳海報。
- **自動化測試：** 頁面渲染測試
- **驗收標準：** 具有可播放或預覽之宣傳模組。
- **風險與回復：** 靜態資產無風險。

### 33. P17-MED-006：AI 影音、圖像與商用授權檢驗
- **目前狀態：** PARTIAL (20%)
- **尚缺功能：** 尚未建立自動化 AI 剪輯與配音發布工具鏈。
- **涉及前端：** `docs/marketing/MARKETING_SOP.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** SOP 規範第三方素材與 AI 生成圖文之商業授權核實流程。
- **自動化測試：** 文件稽核
- **驗收標準：** 規範落盤。
- **風險與回復：** 無風險。

### 34. P17-MED-007：Academy、AI Lab、Challenge 推廣系列
- **目前狀態：** PARTIAL (40%)
- **尚缺功能：** 社群推廣系列內容尚未正式排程分發。
- **涉及前端：** 官網首頁、題庫頁、遊戲中心頁
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 平台已實體具備 Academy（題庫）、AI Lab（鷹架教練）與 Challenge（五大遊戲）產品內容。
- **自動化測試：** 整合測試
- **驗收標準：** 官網具備清晰的功能入口與價值訴求。
- **風險與回復：** 無風險。

### 35. P17-MED-008：社群留言、私訊、客服轉介與危機回應流程
- **目前狀態：** **PASS (100%)**
- **尚缺功能：** 無
- **涉及前端：** `docs/marketing/MARKETING_SOP.md`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** SOP 完整訂立技術錯誤回饋轉介、客訴層級劃分與重大資安危機回應原則。
- **自動化測試：** 文件檢核
- **驗收標準：** 流程明確包含在專案規範中。
- **風險與回復：** 無風險。

### 36. P17-MED-009：網站流量、社群觸及與轉換成效分析
- **目前狀態：** PARTIAL (30%)
- **尚缺功能：** 前端尚未載入真實 GA4 或 PostHog 追蹤 SDK。
- **涉及前端：** `index.html`, `frontend/src/pages/public/AdminDashboardPage.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 是（Google Analytics）
- **前置依賴：** 隱私政策與 Cookie 同意橫幅
- **具體實作內容：** 定義標準 UTM 渠道命名規範與模擬分析儀表板。
- **自動化測試：** 標籤解析測試
- **驗收標準：** 符合隱私保護，不侵犯學員個人個資。
- **風險與回復：** 本地狀態安全。

### 37. P17-MED-010：品牌合作、學校合作及活動紀錄
- **目前狀態：** PARTIAL (30%)
- **尚缺功能：** 缺少專屬的合作夥伴紀錄清冊。
- **涉及前端：** `frontend/src/components/TeacherApplyModal.tsx`
- **涉及後端：** 無
- **涉及 DB / Prisma：** 否
- **涉及外部 API：** 否
- **前置依賴：** 無
- **具體實作內容：** 首頁常設「學校教師申請合作」彈窗，引導校方聯繫。
- **自動化測試：** `frontend/tests/cross-role-integration.test.tsx`
- **驗收標準：** 申請表單驗證健全，提交成功提示明確。
- **風險與回復：** 本地暫存。
