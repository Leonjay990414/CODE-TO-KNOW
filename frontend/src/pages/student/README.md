# Student｜學生學習平台 (Level 2)

## 一、層級定位
- **架構層級**：第二層（Level 2）- 學生學習平台（Web Pages - Student Hub）
- **主要對象**：學生、自學者、考證學員。
- **技術規範**：React + TypeScript + Vite 元件（`.tsx`）。

## 二、層級職責
1. **個人學習中心**：學習儀表板、考科進度追蹤、班級加入與班級通知。
2. **學科練習與模擬考**：官方歷屆題庫練習、即時智能評分、計時模擬測驗。
3. **術科實作與線上編譯**：五大術科題組實作引導、即時線上程式編輯器與多視圖即時預覽。
4. **AI 智慧導師與錯題管理**：AI 題目解析引導、個人化錯題筆記本與弱點強化自測。
5. **遊戲化學習體驗**：五大程式學習遊戲（語法拼圖、CSS 挑戰、除錯特工、題庫競速、網頁組裝）。

## 三、預計收納頁面清冊（待後續搬移階段執行）
- `StudentDashboardPage.tsx`：學生學習中心主控台。
- `TheoryPracticePage.tsx`：學科題庫練習系統。
- `MockExamPage.tsx`：官方模擬測驗與成果檢視系統。
- `PracticalLearningPage.tsx`：術科題組逐步學習系統。
- `CodeEditorPage.tsx`：線上程式碼編輯與成果預覽環境。
- `AICoachPage.tsx`：AI 智慧學習教練互動諮詢中心。
- `LearningProgressPage.tsx`：個人學習歷程與數據儀表板。
- `GameCenterPage.tsx`：遊戲學習中心大廳。
- `CodePuzzlePage.tsx`：遊戲化學習 - 語法積木重組。
- `CSSDesignerPage.tsx`：遊戲化學習 - CSS 視覺樣式挑戰。
- `BugHunterPage.tsx`：遊戲化學習 - 程式碼除錯特工。
- `QuizRushPage.tsx`：遊戲化學習 - 檢定題庫極速挑戰。
- `WebBuilderPage.tsx`：遊戲化學習 - 視覺化網頁積木組裝。

## 四、權限與存取控制
- **學生身分保護（Protected）**：需登入具備 `STUDENT` 角色（或在展示模式以示範學生身分存取），受 `ProtectedRoute` 保護。
