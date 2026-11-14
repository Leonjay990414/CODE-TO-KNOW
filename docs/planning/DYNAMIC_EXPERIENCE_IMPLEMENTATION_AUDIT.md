# CODE TO KNOW (碼上學) 全站動態體驗升級實施盤點表 (Dynamic Experience Implementation Audit)

> **專案**: 碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
> **基準依據**: 《CODE TO KNOW 動態體驗設定與規劃書 v0.1》  
> **盤點日期**: 2026-11-14  
> **技術環境**: React 18.3.1, TypeScript 5.6.3, Vite 5.4.21, Vanilla CSS Design System  

---

## 一、盤點目標與範圍

全面盤點現有 20 個核心路由頁面、16 個全站組件、CSS 動態 Token 及互動狀態，分類記錄已符合規格、尚未實作、需調整項目，並標定絕對禁止動態介入之安靜區域。

---

## 二、實際頁面與元件動態現況矩陣

| 序號 | 模組 / 頁面 / 元件 | 對應檔案路徑 | 現有動態效果 | 規範符合度評估 | 改善與重構方向 (Batch 規劃) |
|---|---|---|---|---|---|
| 1 | **動態基礎 Tokens** | `frontend/src/styles/tokens.css` | 僅有基礎 duration (fast, normal, slow) | **部分符合 (需擴充)** | 擴充 5 級持續時間 (`dur-instant` 至 `dur-slower`)、4 種專用貝茲曲線 (`standard`, `enter`, `exit`, `spring`) 與標準位移尺寸 (8px, 16px, 24px)。[Batch 1] |
| 2 | **導覽列 Navbar** | `frontend/src/components/Navbar.tsx` | 靜態固定頂部，手機漢堡選單展開 | **待升級** | 加入捲動時高度平順微縮 (64px → 56px)、背景毛玻璃邊界平滑過渡、手機抽屜選單 Enter/Exit 曲線。[Batch 1] |
| 3 | **按鈕 Button** | `frontend/src/styles/components.css` | `:active scale(0.98)` | **良好，需微調** | 按下縮放統一為 `scale(0.97)`，加入 Loading 旋轉不換行/不跳寬防線，Disabled 態徹底移除過渡。[Batch 1] |
| 4 | **卡片 Card** | `frontend/src/styles/components.css` | `:hover translateY(-2px)` | **良好，需微調** | 桌面懸停位移統一為 -4px，陰影加深，觸控裝置禁用 hover 效果；支援鍵盤 focus-visible 輪廓。[Batch 1] |
| 5 | **Modal 彈窗** | `AuthModal.tsx`, `GameBriefingModal.tsx` | 基本淡入，已支援 Escape 關閉 | **良好，需微調** | 彈窗主體進場縮放由 `0.96 -> 1`，手機版優化為由下而上底部抽屜 (Bottom Sheet) 模式。[Batch 1] |
| 6 | **表單 Form** | `AuthModal.tsx`, `TeacherApplyModal.tsx` | 原生 focus 狀態 | **待升級** | 輸入框 focus 邊框平滑放大、密碼切換無跳動、錯誤訊息垂直平順展開與紅字警告。[Batch 1] |
| 7 | **首頁第一屏** | `frontend/src/components/Hero.tsx` | 靜態排版、按鈕 | **待升級** | 標題、副標題與 CTA 依序淡入 (Stagger 50ms)，保持 LCP < 2.5s，無重度 3D 卡頓。[Batch 2] |
| 8 | **首頁五幕敘事** | `BrandStory.tsx`, `LearningExperience.tsx` | 傳統垂直網格佈局 | **待深化** | 依序呈現「程式學習、證照搜尋、測驗回饋、AI教練、學習進度」，不鎖定滾動，自然進場。[Batch 4] |
| 9 | **證照搜尋中心** | `frontend/src/pages/public/CertificationsPage.tsx` | 靜態卡片列表 | **待升級** | 搜尋與類別篩選切換時卡片柔和淡入淡出，空搜尋結果狀態流暢顯現。[Batch 2] |
| 10 | **證照詳情與路徑** | `frontend/src/pages/public/CertificationDetailPage.tsx` | 靜態排版 | **待升級** | 證照核心指標、章節目錄與能力節點順序展開。[Batch 2] |
| 11 | **學科理論學習** | `frontend/src/pages/public/TheoryPracticePage.tsx` | 長文閱讀、題目選單 | **規範保護區** | **內文絕對禁止浮動與視差**；僅章節選單焦點平滑切換、折疊解析平順展開。[Batch 2] |
| 12 | **模擬測驗中心** | `frontend/src/pages/public/MockExamPage.tsx` | 答題選取、交卷計分 | **需謹慎處理** | **作答中保持完全靜態**，計時器無閃爍；換題簡短過場 (100ms)，結算頁分數圓環/進度平滑長條。[Batch 2] |
| 13 | **術科實作工作區** | `frontend/src/pages/public/PracticalLearningPage.tsx` | 步驟指引、題組切換 | **待升級** | 步驟完成打勾動畫 (Checkmark fill)、提示摺疊平滑展開。[Batch 3] |
| 14 | **程式編輯器** | `frontend/src/pages/public/CodeEditorPage.tsx` | 雙欄編輯器、iframe 預覽 | **規範保護區** | **編輯器文字與游標絕對禁止動畫**；僅分頁切換與全螢幕縮放提供平滑反饋。[Batch 3] |
| 15 | **AI 學習教練** | `frontend/src/pages/public/AICoachPage.tsx` | 階梯式鷹架提示按鈕 | **待升級** | 提示展開柔和淡入，思考中低干擾脈動點點 (Pulsing dots)，串流文字直接呈現不逐字打字。[Batch 3] |
| 16 | **學習進度與歷程** | `frontend/src/pages/public/LearningProgressPage.tsx` | 靜態進度條與統計卡片 | **待升級** | 圓環進度條初次掛載平滑生長，徽章展示卡片適度 Stagger。[Batch 2] |
| 17 | **遊戲中心** | `frontend/src/pages/public/GameCenterPage.tsx` | 5 款遊戲卡片、徽章按鈕 | **待深化** | 遊戲卡片懸停微翹、成就按鈕金光呼吸效果 (Gold spark pulse)。[Batch 4] |
| 18 | **後台與管理功能** | `StudentDashboardPage.tsx`, `TeacherDashboardPage.tsx` | 表格、統計、審核 | **專業安靜區** | 維持最高操作效率，僅保留必要的數據切換微淡入，禁止浮誇進場。[Batch 5] |
| 19 | **空狀態與錯誤頁** | `frontend/src/components/common/EmptyState.tsx` | 靜態圖示與文字 | **待升級** | 圖示微浮動 (Gentle float 4px)，按鈕清晰引導。[Batch 5] |

---

## 三、禁止動態介入之安靜區規範 (Strict Zero-Motion Zones)

1. **學科理論閱讀內文 (`TheoryPracticePage`)**: 嚴禁文字隨捲動位移、逐行打字或背景浮動粒子，保護學生閱讀專注力。
2. **測驗作答中畫面 (`MockExamPage`)**: 題目與選項在思考期間完全靜止，計時器數字嚴禁跳動縮放或警告閃爍。
3. **程式碼編輯器輸入區 (`CodeEditorPage`)**: 嚴禁游標拖尾、字元粒子打字動畫或背景霓虹光暈，保持專業 IDE 的高響應與低延遲。
4. **管理端數據報表與表格 (`TeacherDashboardPage`, `QuestionBankImportSystemPage`)**: 數據表格禁止骨牌式大量翻轉或延遲渲染，追求即時資訊反饋。

---

## 四、實作批次規劃表

- **Batch 1**: 全站動態 Tokens、無障礙 `prefers-reduced-motion` 完整降級機制、Navbar、Button、Card、Modal、Toast、Form 基礎動態。
- **Batch 2**: 核心學習體驗動態（首頁 Hero、證照搜尋列表 Stagger、學習進度條/圓環生長、測驗結算反饋）。
- **Batch 3**: 實作與 AI 互動動態（術科步驟完成、AI 教練思考指示器、程式編輯器面板平順切換）。
- **Batch 4**: 成就與品牌深化（遊戲中心徽章解鎖特效、金光微動態、首頁敘事卡片）。
- **Batch 5**: 後台效率微動態、登入註冊過渡、空狀態與提示反饋。
- **Batch 6**: 全站整合驗收（TypeScript、Vite Build、Vitest、154 RWD 矩陣、Reduced Motion 驗證）。
