# 碼上學｜CODE TO KNOW
# 第 5 波完整執行計畫與分批實施指南

**文件識別：** `PHASE_5_COMPLETE_EXECUTION_PLAN.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**目標階段：**  
- **P11：AI 輔助學習與弱點分析**（目標進度：30% $\to$ 80%）  
- **P14：遊戲化學習與互動體驗**（目標進度：3.75% $\to$ 85%）  
- **P17：品牌數位行銷與媒體傳播**（目標進度：6% $\to$ 80%）  
**總對應 UID 數：** **37 個 UID**  
**執行架構：** 8 大批次循序推進（Batch 0 至 Batch 7）、逐批驗證、逐批停頓確認  
**目前波次狀態：** **尚未啟動 (UNSTARTED) — 本文件為執行計畫，待使用者正式核准後始得執行**  

---

## 一、整體執行策略與安全準則

第 5 波旨在實現「AI 智慧家教、遊戲化互動、品牌數位行銷」三大前瞻教育體驗。  
為確保在「零非預期回歸、零資料庫破壞、零安全紅線違規」的前提下完成開發，本波次採行以下策略：

1. **嚴格分批、逐批停頓、禁止跳批**：
   - 劃分為 Batch 0～7 共 8 個批次。
   - 每批次完成後必須執行自動化測試與建置檢查，通過後始得進入下一批。
2. **前後端職責清晰分離與金鑰絕對安全**：
   - 前端絕不直接呼叫第三方 LLM（避免金鑰暴露），後端提供安全代理中介軟體。
   - 若未配置雲端金鑰，自動切換至「離線規則備援引擎」，確保體驗 100% 可用。
3. **資料持久化防護與 `AUTH-03` 隔離合約**：
   - 繼續維持 `AUTH-03` 安全紅線，不執行任何破壞性資料庫變更。
   - 所有使用者遊戲進度、AI 對話歷史、行銷素材均採用「使用者隔離之本機持久化技術（User-Scoped LocalStorage）」，並保留未來向雲端資料庫無縫平移之資料介面。
4. **五大正式術科題組（104301～104305）絕對保護**：
   - 核心題組檔案 `unifiedPracticalCurriculumData.ts` 之技術規格、評分要點與答案代碼 100% 凍結，絕不修改。
5. **無障礙體驗標準（WCAG 2.1 AA）全面落實**：
   - 遊戲化拖曳與點擊操作均必須提供等效的鍵盤操作替代方案。

---

## 二、8 大批次執行細部規格與實施路徑

```text
================================================================================
第 5 波 8 大批次實施路徑圖 (Batch 0 ~ 7)
================================================================================
[Batch 0] 基準環境稽核與測試工具鏈確認 (Baseline & Test Harness Audit)
   │
[Batch 1] P11 AI 智慧家教四階鷹架與離線備援引擎 (AI Coach & Scaffolding Engine)
   │
[Batch 2] P14 遊戲中心大廳整合、關卡進度與三星成就引擎 (Game Center & Achievements)
   │
[Batch 3] P14 五大互動學習遊戲深度打磨與無障礙操作 (5 Games Polish & A11y)
   │
[Batch 4] P17 品牌官方首頁質感重塑、媒體展示中心與 SEO 標記 (Brand & Media Center)
   │
[Batch 5] 跨模組體驗整合 (考題 AI 提示、教師派發遊戲、管理員設定) (Cross-Module Integration)
   │
[Batch 6] 全站自動化測試、RWD 跨螢幕驗收與效能檢驗 (Comprehensive QA & Testing)
   │
[Batch 7] 成果驗收交付、進度重新核算與結案報告 (Final Delivery & Closure)
================================================================================
```

---

### Batch 0：基準環境稽核與測試工具鏈確認

- **目標與範疇**：
  - 驗證目前 Git HEAD 為 `c44ea7929f39ef469f380027c2fd3143726d9922`。
  - 驗證工作目錄僅有核定之 15 個已修改檔案，五大術科題組無額外異動。
  - 執行前端 Vitest（232 測試全過）與後端 Jest（215 測試全過）。
  - 確認 TypeScript 編譯 0 錯誤。
- **允許操作範圍**：唯讀檢查指令，不得修改任何檔案。
- **驗證指令**：
  ```bash
  git status --short
  cd frontend && npm run test -- --run
  cd ../backend && npm test
  ```
- **通過標準**：測試 100% 通過，工作目錄乾淨無污染。

---

### Batch 1：P11 AI 智慧家教四階鷹架與離線備援引擎

- **目標與範疇**：
  - 完善 `AICoachPage.tsx`，落實「四階段引導」（觀念聚焦 $\to$ 破題思路 $\to$ 邊界提示 $\to$ 架構解構）。
  - 新增 `src/utils/aiFallbackEngine.ts`：針對網頁設計丙級 104301～104305 題組建立完整的離線啟發式引導知識庫。
  - 新增 `src/utils/aiPromptGuardrails.ts`：實施教育防護罩，過濾學生直接要求「寫出完整代碼」的指令，強制轉換為思考問句。
  - 建立對話工作階段管理（多對話切換、歷史對話儲存於 `ctk_ai_sessions:${userId}`）。
  - 實作對話評價機制（讚/倒讚與回饋彈窗）。
- **允許修改/新增檔案**：
  - `frontend/src/pages/public/AICoachPage.tsx`
  - `frontend/src/utils/aiFallbackEngine.ts` (新增)
  - `frontend/src/utils/aiPromptGuardrails.ts` (新增)
  - `frontend/src/components/AIFeedbackModal.tsx` (新增)
  - `frontend/tests/ai-scaffolding.test.ts` (擴充測試)
- **禁止修改檔案**：`unifiedPracticalCurriculumData.ts`、Prisma schema、資料庫。
- **通過標準**：離線狀態下輸入提問可順利取得四階鷹架提示；惡意索取代碼被成功攔截；自動化測試全數通過。

---

### Batch 2：P14 遊戲中心大廳整合、關卡進度與三星成就引擎

- **目標與範疇**：
  - 重塑 `GameCenterPage.tsx`，建立具備探索感的世界關卡地圖（Island Map）。
  - 升級 `frontend/src/utils/gameStorage.ts`：支援關卡前置條件解鎖、用時與分數累計、斷線接續作答。
  - 完善 `frontend/src/utils/gameAchievementEngine.ts`：定義 9 大主題成就勳章，實作事件監聽器。
  - 完善 `GameAchievementsModal.tsx` 與 `GameBriefingModal.tsx`：提供流暢的開關動畫與無障礙焦點控制。
  - 實作通關結算彈窗（`GameVictoryModal.tsx`），包含三星點亮動效與分數結算。
- **允許修改/新增檔案**：
  - `frontend/src/pages/public/GameCenterPage.tsx`
  - `frontend/src/utils/gameStorage.ts`
  - `frontend/src/utils/gameAchievementEngine.ts`
  - `frontend/src/components/GameVictoryModal.tsx` (新增)
  - `frontend/src/components/GameAchievementsModal.tsx`
  - `frontend/src/components/GameBriefingModal.tsx`
- **通過標準**：首頁進入遊戲大廳可正確讀取關卡鎖定狀態；通關後星數與成就正確寫入本機儲存並彈出結算動畫。

---

### Batch 3：P14 五大互動學習遊戲深度打磨與無障礙操作

- **目標與範疇**：
  - 打磨五大遊戲核心體驗：
    1. **程式碼拼圖 (`CodePuzzlePage.tsx`)**：支援 HTML 標籤積木排序，新增純鍵盤方向鍵移動支援。
    2. **CSS 樣式設計師 (`CSSDesignerPage.tsx`)**：提供 Flexbox、Grid、字型顏色即時調整，新增比對重合度演算法。
    3. **除錯獵人 (`BugHunterPage.tsx`)**：擴充至 5 大典型錯誤情境（標籤未閉合、拼字錯誤、語意錯誤），具備放大鏡雷達。
    4. **快速問答挑戰 (`QuizRushPage.tsx`)**：新增 Combo 連擊倍率計分與倒數計時急促警示。
    5. **網頁架構師 (`WebBuilderPage.tsx`)**：實作模組化積木拖曳搭建頁面，並可即時匯出乾淨的 HTML/CSS。
  - 全面導入 WAI-ARIA 屬性與焦點陷入管理，確保純鍵盤可順利通關。
- **允許修改檔案**：
  - `frontend/src/pages/public/CodePuzzlePage.tsx`
  - `frontend/src/pages/public/CSSDesignerPage.tsx`
  - `frontend/src/pages/public/BugHunterPage.tsx`
  - `frontend/src/pages/public/QuizRushPage.tsx`
  - `frontend/src/pages/public/WebBuilderPage.tsx`
  - `frontend/tests/game-*.test.ts`
- **通過標準**：五款遊戲皆能從頭至尾玩通；鍵盤操作無卡死；109+ 遊戲相關測試全數綠燈。

---

### Batch 4：P17 品牌官方首頁質感重塑、媒體展示中心與 SEO 標記

- **目標與範疇**：
  - 優化 `HomePage.tsx`：重塑 Hero 區塊、導入精緻排版、學員檢定通過心得見證輪播。
  - 新增 `BrandKitPage.tsx`：展示品牌理念、標準字、標準色盤與向量 Logo 下載。
  - 新增 `MediaCenterPage.tsx`：整合官方宣傳片、版本 B 影音課程連結、宣傳海報與社群文案庫（Asset Hub）。
  - 新增 `NewsPage.tsx`：展示平台最新消息、重要考試日程與研習公告。
  - 更新 `frontend/index.html`：注入 EducationalOrganization JSON-LD 結構化資料、OpenGraph 與 Twitter Cards。
- **允許修改/新增檔案**：
  - `frontend/src/pages/public/HomePage.tsx`
  - `frontend/src/pages/public/BrandKitPage.tsx` (新增)
  - `frontend/src/pages/public/MediaCenterPage.tsx` (新增)
  - `frontend/src/pages/public/NewsPage.tsx` (新增)
  - `frontend/src/app/App.tsx` (註冊公開路由)
  - `frontend/src/components/Navbar.tsx` (新增媒體中心連結)
  - `frontend/index.html`
- **通過標準**：首頁展現國際級 EdTech 風貌；SEO 結構化資料語法檢驗合格；新頁面響應式相容。

---

### Batch 5：跨模組體驗整合 (AI 提示、教師指派、管理員設定)

- **目標與範疇**：
  - **學生端打通**：在 `TheoryPracticePage.tsx` 與 `MockExamPage.tsx` 整合「AI 鷹架求助」按鈕，點擊後以側邊抽屜展開對應當前題目的四階提示。
  - **教師端打通**：在 `TeacherDashboardPage.tsx` 班級管理模組新增「指派遊戲作業」功能，教師可勾選指定關卡發布給全班。
  - **管理員端打通**：在 `AdminDashboardPage.tsx` 系統設定分頁新增「遊戲化參數調整」與「AI 速率限制開關」介面。
- **允許修改檔案**：
  - `frontend/src/pages/public/TheoryPracticePage.tsx`
  - `frontend/src/pages/public/MockExamPage.tsx`
  - `frontend/src/pages/public/TeacherDashboardPage.tsx`
  - `frontend/src/pages/public/AdminDashboardPage.tsx`
- **通過標準**：從練習題一鍵跳轉 AI 引導且題意上下文正確傳遞；教師端能順利指派遊戲關卡；管理員能切換設定。

---

### Batch 6：全站自動化測試、RWD 跨螢幕驗收與效能檢驗

- **目標與範疇**：
  - 新增 AI 離線備援與防抄襲單元測試。
  - 擴充五大遊戲通關與成就判定自動化測試。
  - 執行全站跨裝置響應式檢驗（320px、375px、768px、820px、1024px、1280px）。
  - 執行前後端 TypeScript 型別檢查（`tsc --noEmit`），確保 0 錯誤。
  - 執行前後端完整測試套件，確保 100% 通過且無回歸。
- **驗證指令**：
  ```bash
  cd frontend && npm run build
  cd ../backend && npm run build
  npm run test
  ```
- **通過標準**：前端測試數由 232 擴充並維持 100% 通過；TypeScript 編譯 0 錯誤；RWD 零水平溢位破版。

---

### Batch 7：成果驗收交付、進度重新核算與結案報告

- **目標與範疇**：
  - 彙整第 5 波實際產出證據與修改檔案清冊。
  - 重新核算 P11、P14、P17 及全專案 20 階段 226 UID 之加權完成率。
  - 撰寫第 5 波結案交付文檔：
    1. `PHASE_5_COMPLETE_EXECUTION_REPORT.md`
    2. `PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_5.md`
    3. `PHASE_5_REMAINING_ISSUES_AND_HANDOFF.md`
  - 進行最終獨立審查並提交專案負責人驗收。
- **通過標準**：交付文件齊全，進度核算精確至小數點後 6 位，責任邊界清楚。

---

## 三、中斷條件 (Stop Conditions) 與應變處置

在執行過程中，若觸發以下任何一項條件，必須**立即停止當前作業，不可擅自嘗試修復**，並立即回報專案負責人：

1. **破壞五大術科題組內容**：`unifiedPracticalCurriculumData.ts` 之題目答案或評分要點遭受非預期修改。
2. **資料庫連線或 Migration 誤觸**：誤執行 `prisma migrate` 或手動 SQL 語句。
3. **外部 API 金鑰外洩風險**：在前端代碼或公開提交中發現明文 API Key。
4. **既有測試回歸失敗**：第 1～4 波既有 232 項前端測試或 215 項後端測試出現任何 Red 失敗。
5. **未經授權的 Git 操作**：執行未授權的 `git commit`、`git push`、`git reset` 或 `git clean`。

---

## 四、波次結案預期成果指標

當第 5 波經正式授權並完整執行完畢後，預期專案進度將實現以下躍升：

- **P11 (AI 輔助學習)**：預期由 30% $\to$ **80%**（+50%）
- **P14 (遊戲化學習)**：預期由 3.75% $\to$ **85%**（+81.25%）
- **P17 (品牌數位行銷)**：預期由 6% $\to$ **80%**（+74%）
- **全站 20 階段總完成率**：
  $$\Delta = (50\% \times 0.05) + (81.25\% \times 0.05) + (74\% \times 0.05) = 2.5\% + 4.0625\% + 3.7\% = \mathbf{+10.2625\%}$$
  預期總完成率將由 **49.166860%** 提升至 **約 59.429360%**，正式突破 50% 與 55% 關鍵大關！
