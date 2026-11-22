# 碼上學 CODE TO KNOW｜HTML Prototype 歷史原型與展示歸檔
# (prototype/README.md)

> [!IMPORTANT]
> **【歷史原型與展示歸檔宣告（Historical Showcase & Archive Notice）】**  
> 1. **歷史定位**：本目錄（`prototype/`）為 CODE TO KNOW 專案早期（2026 年中）之原生 HTML/CSS/JS 靜態概念驗證與競賽展示版本（Showcase Version）。  
> 2. **非正式生產來源**：本目錄**並非**正式 React 生產系統的唯一或權威來源。正式系統全數由 `frontend/src/`（React 18 + TypeScript + Vite）與 `backend/src/`（Node.js + Express + Prisma）接管。  
> 3. **禁止虛假宣稱**：嚴禁將本目錄中的靜態展示頁面、模擬資料（`prototype-data.js`）或前端互動直接宣稱為已完成之正式雲端系統。  
> 4. **官方題組保護**：勞動部技檢中心 17300 網頁設計丙級試題之五大官方題組（104301～104305）在正式生產系統中受最高層級保護，絕不可被本歷史原型中的示範題組或舊版內容覆蓋或取代。  
> 5. **完整保留不刪除**：本文件僅提供歷史定位導覽與對照，嚴格遵循「不刪除、不移動、不修改任何原型既有檔案」原則。

---

## 歷史原型與現代 React 生產系統映射對照表 (Prototype-to-Production Mapping)

依據第 0 波第二批 [W0B2_PROTOTYPE_TO_PRODUCTION_MAPPING.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/master/wave0/batch2/W0B2_PROTOTYPE_TO_PRODUCTION_MAPPING.md) 實體驗證，本目錄 8 份靜態頁面與正式生產代碼之對照關係如下：

| 原型檔案路徑 | 歷史用途與代表功能 | 正式 React 模組路徑 | 現代生產系統狀態 (Production Status) | 原型與正式版主要功能差異 |
| :--- | :--- | :--- | :--- | :--- |
| `index.html` | 首頁品牌主視覺、四階 AI 導引、雙端切換展示 | `frontend/src/pages/public/HomePage.tsx` | **PRODUCTION VERIFIED** | 正式版具備完整 RWD 流動排版、首頁統計明確標示為【展示版】、完整接入 React Router / NavigationContext。 |
| `pages/certifications.html` | 證照智慧學習中心總覽、防抖搜尋與類別篩選 | `frontend/src/pages/public/CertificationsPage.tsx` | **PRODUCTION VERIFIED** | 正式版具備 TypeScript 嚴格型別、動態搜尋篩選與清晰的 COMING SOON 狀態標記。 |
| `pages/certification-detail.html` | 證照大綱、學習地圖、考點分佈與籌備期提示 | `frontend/src/pages/public/CertificationDetailPage.tsx` | **PRODUCTION VERIFIED** | 正式版透過 URL 狀態與 NavigationContext 動態渲染，無跨頁重新載入白屏。 |
| `pages/theory-learning.html` | 學科全真題庫練習、互動單選、考點詳解展開 | `frontend/src/pages/public/TheoryPracticePage.tsx` | **PRODUCTION VERIFIED** | 正式版載入官方 567 題學科題庫，支援隨機抽題與分卷練習。 |
| `pages/mock-exam.html` | 全真模擬考試考場、60分鐘計時器、結算 Modal | `frontend/src/pages/public/MockExamPage.tsx` | **PRODUCTION VERIFIED (前端)<br>PARTIAL (後端成績同步待 Wave 2)** | 正式版已具備計時、自動交卷、成績算分機制，但歷次成績單目前暫存於 LocalStorage，待第 2 波接入 Prisma `ExamAttempt`。 |
| `pages/practical-learning.html` | 術科題組版型實作、四大題組動態切換、線稿示意 | `frontend/src/pages/public/PracticalLearningPage.tsx`<br>`frontend/src/pages/student/practical/*` | **PRODUCTION VERIFIED** | 正式版已擴充為五大題組（104301～104305），並提供大廳 `StudentPracticalHubPage.tsx` 與多題組雙軌導覽。 |
| `pages/code-editor.html` | 線上雙欄即時代碼編輯器、HTML/CSS 即時編譯 | `frontend/src/pages/public/CodeEditorPage.tsx`<br>`PracticalSandboxPage.tsx` | **PRODUCTION VERIFIED** | 正式版具備防 XSS 安全沙盒、獨立編譯、重設樣板與快捷鍵支援。 |
| `pages/ai-coach.html` | 4 階 AI 思考鷹架助教、橫向滑動對話流程 | `frontend/src/pages/public/AICoachPage.tsx` | **PROTOTYPE / DEMO (前端完成，未串接外部 LLM)** | 正式版已明確標註【展示版】免責聲明，採用 `aiFallbackEngine.ts` 擬真輸出，待第 5 波開闢真實 API 串接。 |
| `pages/learning-progress.html` | 個人學習歷程與弱點診斷、2x2 指標網格 | `frontend/src/pages/public/LearningProgressPage.tsx` | **PARTIAL (本地持久化完成，未跨裝置同步)** | 正式版具備 `learningStorage.ts` 多帳號隔離，但尚未接入後端資料庫。 |

---

## 原始展示版本說明文件（保留作為歷史紀錄）

以下為歷史展示版本原始之完整說明，予以完整封存保留：

---

### 原使用說明（Original Showcase Overview）

歡迎使用「碼上學｜CODE TO KNOW」獨立 HTML 原型系統（Showcase Version）。

本原型系統旨在提供一個無需部署、無需啟動伺服器或後端服務，即可直接在瀏覽器雙擊開啟並完整體驗的互動原型。已通過五個階段的官方資料校正、全站響應式流動排版升級、全維度視覺審核、P2/P3 細節精修與 99 次自動化無頭回歸測試，正式列為 **【正式展示通過】（Approved for Official Showcase）**。

#### 一、系統特色與核心理念
1. **直接開啟相容性 (`file://`)**：
   - 全面採用純原生 Vanilla JavaScript、CSS3 與相對路徑。
   - 不依賴必須經由 HTTP 運行的 ES Module (`type="module"`）。
   - 不依賴本機 `fetch()` JSON，Mock Data 完整封裝於 `prototype-data.js`。
   - 不依賴外部 CDN 函式庫或第三方 API Key，**100% 離線可行**。
2. **共用品牌設計系統**：
   - 延續 CODE TO KNOW 核心色系：暖象牙白 (`#F5F2EA`)、深岩灰 (`#526B7B`)、柔霧藍 (`#8FA9B8`)、淺藍灰 (`#D9E2EA`)、香檳金 (`#BDA77E`)、高對比香檳金文字色 (`#7C663D`)。
   - 採用 Editorial Minimalism、軟性微毛玻璃 (Soft Glassmorphism) 與高級教育科技質感。
3. **全裝置流動響應式（Fluid Responsive）**：
   - 採用 `clamp()` 流動字級與 Safe Area Inset 邊距保護。
   - 完美適配 320px 摺疊手機外螢幕至 1920px 寬螢幕，以及 200% 瀏覽器縮放，**零水平溢出、零文字裁切**。
4. **功能模組獨立性與可移植性**：
   - 每個頁面均為獨立 `.html` 檔案，頁面間 226 個導覽連結無死角、無 404。
   - 經回歸驗證之 UI 架構可平滑映射移植回正式版 React + TypeScript 專案。

#### 二、檔案目錄結構
```text
prototype/
├── index.html                           # 官方首頁原型 (Hero、特色、4 階 AI 導引、雙軌學習、師生雙端)
├── README.md                            # 本文檔：原型使用說明、技術規範與展示入口
├── SHOWCASE_GUIDE.md                    # 正式展示操作指南與 5～8 分鐘比賽展示流程手冊
├── SHOWCASE_FEATURE_INVENTORY.md        # 全站功能真實性分類盤點清單 (已運作 / 模擬 / 待開發)
├── PHASE5_FINAL_ACCEPTANCE_REPORT.md    # 第五階段最終回歸驗收報告 (99 次自動化測試成果)
├── CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip  # 正式展示版本完整封裝壓縮包
├── pages/
│   ├── certifications.html              # 證照智慧學習中心總覽
│   ├── certification-detail.html        # 證照大綱與學習地圖
│   ├── theory-learning.html             # 學科全真題庫練習
│   ├── mock-exam.html                   # 全真模擬考試考場
│   ├── practical-learning.html          # 術科題組版型實作
│   ├── code-editor.html                 # 線上雙欄即時代碼編輯器
│   ├── ai-coach.html                    # 4 階 AI 思考鷹架助教
│   └── learning-progress.html           # 個人學習歷程與弱點診斷
└── assets/
    ├── css/ (tokens.css, global.css, components.css, pages.css)
    ├── js/ (prototype-data.js, navigation.js, interactions.js)
    └── images/
```

#### 三、重要展示文件與報告連結
- [正式展示操作指南與 5～8 分鐘比賽流程手冊 (SHOWCASE_GUIDE.md)](SHOWCASE_GUIDE.md)
- [功能真實性盤點清單 (SHOWCASE_FEATURE_INVENTORY.md)](SHOWCASE_FEATURE_INVENTORY.md)
- [第五階段最終回歸驗收報告 (PHASE5_FINAL_ACCEPTANCE_REPORT.md)](PHASE5_FINAL_ACCEPTANCE_REPORT.md)
