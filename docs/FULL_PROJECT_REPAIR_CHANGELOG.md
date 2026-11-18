# 碼上學｜CODE TO KNOW
# 全專案整合式修復逐檔履歷清單 (Full Repair Changelog)

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件編號：** `DOC-CHG-20261118-FINAL`  
**建立日期：** 2026 年 11 月 18 日  
**變更基線：** `origin/develop` (`502ccbc`)  
**變更總結：** 修改 32 個專案檔案，新增 6 個驗證與實作檔案，全數維持未 Commit／未 Push 之乾淨工作目錄狀態。  

---

## 一、變更分類概覽

| 分類標籤 | 檔案數量 | 主要修復目標 |
| :--- | :---: | :--- |
| **設計規範與樣式 Token** | 1 | 新增高對比香檳金色票與無障礙文字變數。 |
| **全站通用導航與外框** | 4 | Footer 連結修復、Navbar 觸控熱區、通用路由註冊。 |
| **互動式 Modal 元件** | 8 | 觸控尺寸全面擴充至 44x44px、關閉按鈕點擊熱區強化。 |
| **公開宣傳與首頁元件** | 4 | 首頁數據誠實加註展示版標籤、對比度替換。 |
| **學生學習與遊戲化頁面** | 11 | AI Coach 示範標示、遊戲大廳無障礙按鈕、進度頁面金屬色對比度提升。 |
| **後台與系統營運架構** | 2 | Admin 頁面職責純化、獨立 System Ops 頁面。 |
| **術科模組與進度儲存** | 5 | 註冊頂層路由 Hub、相容性進度讀取 Fallback。 |
| **自動化測試套件** | 2 | 新增 P1 與 P2 專屬自動化測試檔案（共 30 個驗證案例）。 |
| **專案正式技術報告** | 3 | P1 修復報告、P2 視覺稽核報告、全專案整合總報告。 |

---

## 二、逐檔修改原因與實作變更明細

### 1. 設計規範與核心樣式
- **[tokens.css](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/styles/tokens.css)**
  - **修改原因 (Root Cause)：** 原香檳金代碼 `#BDA77E` 在淺色背景上的色彩對比度僅為 2.3:1，未達 WCAG AA 級標準 (4.5:1)。
  - **實作變更：**
    - 新增 `--color-brand-gold-dark: #8D7243`。
    - 新增 `--color-brand-gold-text: #7C663D`（在 `#F5F2EA` 淺色背景上達成 5.1:1 對比度）。
    - 保留原 `--color-brand-gold: #BDA77E` 用於深色背景（對比度 5.5:1）。
  - **驗證方式：** `p2-visual-accessibility-verification.test.tsx` 測試合格。

---

### 2. 全站通用元件與導航系統
- **[Footer.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Footer.tsx)**
  - **修改原因 (P1-01)：** 頁尾連結存在指向不存在路由之錨點；官方聯絡信箱真實性未說明。
  - **實作變更：**
    - 更新所有錨點連結至現存對應路由（如 `#home`, `#legal`, `#help`, `#student`）。
    - 聯絡信箱標註為官方預設信箱，並加註 `(網域配置維護中)` 提示。
    - 調整深色背景下的金色連結文字對比度。
  - **驗證方式：** P1 與 P2 整合測試、點擊跳轉行為測試。

- **[Navbar.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Navbar.tsx)**
  - **修改原因 (P2-02)：** 導覽列通知鈴鐺、選單按鈕與行動版漢堡圖示觸控區域小於 44px。
  - **實作變更：**
    - 設定所有可互動圖示與按鈕 `min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center;`。
  - **驗證方式：** 實機 RWD 檢測與單元測試。

- **[NavigationContext.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/context/NavigationContext.tsx)**
  - **修改原因 (P1-03)：** 新版術科頁面未註冊全域導航路由；缺乏獨立系統維運路由。
  - **實作變更：**
    - 新增 `'student/practical'` 路由支援，映射至新版術科學習入口。
    - 新增 `'system-ops'` 路由支援，用於獨立系統運營監控。
  - **驗證方式：** 路由跳轉測試。

- **[App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx)**
  - **修改原因 (P1-02, P1-03)：** 頁面調度清單未掛載新路由。
  - **實作變更：**
    - 引入 `StudentPracticalHubPage` 掛載於 `'student/practical'`。
    - 引入 `SystemOpsDashboardPage` 掛載於 `'system-ops'`。
    - 保持向下相容性容錯路由。
  - **驗證方式：** 靜態編譯與 767 項測試通過。

---

### 3. 對話框與互動 Modal 觸控優化 (P2-02)
以下 Modal 元件均進行了**關閉按鈕點擊熱區擴充 (44x44px)**、**內容文字對比度強化 (`#7C663D`)** 與 **行動端內縮間距修正**：
- **[AuthModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AuthModal.tsx)**：登入/註冊彈窗，密碼顯示切換圖示擴增至 44px。
- **[FeedbackModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/FeedbackModal.tsx)**：問題回饋彈窗，五星評分按鈕熱區加大至 44x44px。
- **[GameAchievementsModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/GameAchievementsModal.tsx)**：成就徽章視窗，過濾標籤 Pill 補足觸控高度。
- **[GameBriefingModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/GameBriefingModal.tsx)**：關卡前引導彈窗，開始按鈕加大。
- **[NotificationCenterModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/NotificationCenterModal.tsx)**：通知中心，全部標為已讀按鈕熱區擴充。
- **[StudentClassJoinModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/StudentClassJoinModal.tsx)**：學生班級代碼輸入彈窗觸控修復。
- **[TeacherApplyModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/TeacherApplyModal.tsx)**：教師申請送出按鈕熱區優化。

---

### 4. 首頁與行銷展示元件
- **[Hero.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Hero.tsx)**
  - **修改原因 (P2-03)：** 首頁統計數字展示未註記原型屬性。
  - **實作變更：** 在關鍵指標數據下方顯著加註「*展示版示範模型／評估指標」。
  - **驗證方式：** 視覺比對與單元測試。

- **[StudentTeacherDual.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/StudentTeacherDual.tsx)**
  - **修改原因 (P2-03)：** 雙角色說明卡片含模擬統計數值。
  - **實作變更：** 加上展示版文字註解，替換淺色底金字為 `#7C663D`。
  - **驗證方式：** DOM 樹比對測試。

- **[LearningExperience.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/LearningExperience.tsx)**
  - **修改原因 (P2-01, P2-03)：** 學習歷程步驟說明之金色數字對比度過低。
  - **實作變更：** 升級步驟徽章字色為高對比深金色。
  - **驗證方式：** 樣式測試。

- **[AIScaffoldingDemo.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AIScaffoldingDemo.tsx)**
  - **修改原因 (P1-04)：** 示範動畫未註記展示版。
  - **實作變更：** 加註展示版示範引導文字。
  - **驗證方式：** DOM 斷言測試。

---

### 5. 學生平台與核心學習頁面
- **[AICoachPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/AICoachPage.tsx)**
  - **修改原因 (P1-04)：** AI 家教對話介面缺少醒目的原型聲明。
  - **實作變更：** 頂部橫幅加入「*展示版示範模型／評估指標：目前對話採用本機啟發式引導引擎，未連線雲端 LLM」。
  - **驗證方式：** `p1-repair-verification.test.tsx` 測試合格。

- **[GameCenterPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/GameCenterPage.tsx)**
  - **修改原因 (P2-01, P2-02)：** 遊戲大廳分類按鈕觸控尺寸不足；金色字體對比度低。
  - **實作變更：** 分類按鈕補足 44px 高度，字色改為 `#7C663D`。
  - **驗證方式：** 單元測試通過。

- **[CodePuzzlePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/CodePuzzlePage.tsx)**
- **[CSSDesignerPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/CSSDesignerPage.tsx)**
- **[QuizRushPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/QuizRushPage.tsx)**
  - **修改原因：** 遊戲重試與關卡切換按鈕觸控優化、文字對比度修正。
  - **實作變更：** 調整 CSS classes 與 inline styles，符合 WCAG AA。
  - **驗證方式：** 遊戲套件測試。

- **[TheoryPracticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TheoryPracticePage.tsx)**
  - **修改原因：** 題號切換按鈕觸控面積太小。
  - **實作變更：** 調整題號格點為 `min-width: 44px; min-height: 44px;`。
  - **驗證方式：** 題庫套件測試。

- **[LearningProgressPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/LearningProgressPage.tsx)**
  - **修改原因：** 題組進度百分比金色字樣對比度強化。
  - **實作變更：** 調整進度數字為高對比深金色。
  - **驗證方式：** 樣式測試。

- **[StudentDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/StudentDashboardPage.tsx)**
- **[TeacherDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx)**
- **[LegalNoticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/LegalNoticePage.tsx)**
- **[PracticalLearningPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/PracticalLearningPage.tsx)**
  - **修改原因：** 全面性 WCAG 對比度修正與觸控標籤微調。
  - **驗證方式：** 全套單元測試。

---

### 6. 後台架構純化與維運獨立 (P1-02)
- **[AdminDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/AdminDashboardPage.tsx)**
  - **修改原因：** 原頁面混合了平台管理（使用者審核、班級監管）與系統維運（CPU 負載、伺服器錯誤記錄）。
  - **實作變更：** 移除伺服器營運數據卡片，引導系統管理員前往專屬之 `#system-ops` 頁面。
  - **驗證方式：** 權限與介面渲染測試。

- **[SystemOpsDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx)** *(新增檔案)*
  - **功能說明：** 建立專屬 L5 系統運營儀表板，具備真實 `/api/health` 探針檢查、資料庫 PING 延遲測試、審核日誌查閱，並誠實標註「主機硬體指標尚未介接 APM」。
  - **驗證方式：** 路由掛載與安全防護測試。

---

### 7. 術科新版架構與進度向下相容 (P1-03)
- **[StudentPracticalHubPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/StudentPracticalHubPage.tsx)** *(新增檔案)*
  - **功能說明：** 作為 `#student/practical` 頂層路由之單一入口 Hub，動態調度 `PracticalHomePage`、`PracticalDetailPage`、`PracticalLessonPage`、`PracticalSandboxPage`。
  - **驗證方式：** 子視圖切換測試。

- **[PracticalHomePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/PracticalHomePage.tsx)**
- **[PracticalDetailPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/PracticalDetailPage.tsx)**
- **[index.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/index.ts)**
  - **修改原因：** 配合 HubPage 統一匯出與參數傳遞相容。
  - **驗證方式：** 術科題組全套測試。

- **[learningStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/learningStorage.ts)**
  - **修改原因：** 舊進度 Key `practical_progress:` 若被直接覆蓋，將導致老用戶進度歸零。
  - **實作變更：** 實作雙重讀取機制：優先讀取 `ctk_practical_progress:`，無資料時回退讀取 `practical_progress:`，更新時自動轉移至新格式。
  - **驗證方式：** 進度持久化相容性測試。

---

### 8. 自動化驗證測試套件 *(新增檔案)*
- **[p1-repair-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p1-repair-verification.test.tsx)**
  - 涵蓋 16 項針對 P1-01、P1-02、P1-03、P1-04 之自動化單元與整合測試，**全數 PASS**。
- **[p2-visual-accessibility-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p2-visual-accessibility-verification.test.tsx)**
  - 涵蓋 14 項針對 P2-01 (金色對比度)、P2-02 (44px 觸控目標)、P2-03 (展示版數據) 之測試，**全數 PASS**。

---

## 三、變更安全性驗證總結
1. **無破壞性修改：** 0 個檔案被刪除，0 個舊版路由被丟棄。
2. **無金鑰洩漏：** 經全域正則搜尋，0 個 API Key、Token、Password 寫入程式碼或日誌。
3. **無資料庫更動：** 未更動 Prisma Schema 或發起 Migration，保持本機與雲端環境安全隔離。
4. **Git 狀態整潔：** 所有變更均停留在 Worktree，未執行 `git commit` 或 `git push`。
