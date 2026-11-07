# 碼上學 CODE TO KNOW｜HTML Prototype 正式展示與交付版本

歡迎使用「碼上學｜CODE TO KNOW」獨立 HTML 原型系統（Showcase Version）。

本原型系統旨在提供一個無需部署、無需啟動伺服器或後端服務，即可直接在瀏覽器雙擊開啟並完整體驗的互動原型。已通過五個階段的官方資料校正、全站響應式流動排版升級、全維度視覺審核、P2/P3 細節精修與 99 次自動化無頭回歸測試，正式列為 **【正式展示通過】（Approved for Official Showcase）**。

---

## 一、系統特色與核心理念

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

---

## 二、檔案目錄結構

```text
prototype/
├── index.html                           # 官方首頁原型 (Hero、特色、4 階 AI 導引、雙軌學習、師生雙端)
├── README.md                            # 本文檔：原型使用說明、技術規範與展示入口
├── SHOWCASE_GUIDE.md                    # 正式展示操作指南與 5～8 分鐘比賽展示流程手冊
├── SHOWCASE_FEATURE_INVENTORY.md        # 全站功能真實性分類盤點清單 (已運作 / 模擬 / 待開發)
├── PHASE5_FINAL_ACCEPTANCE_REPORT.md    # 第五階段最終回歸驗收報告 (99 次自動化測試成果)
├── CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip  # 正式展示版本完整封裝壓縮包
├── pages/
│   ├── certifications.html              # 證照智慧學習中心總覽 (150ms 防抖搜尋、多維度篩選、Coming Soon)
│   ├── certification-detail.html        # 證照大綱與學習地圖 (URL 參數動態載入、開放 vs 籌備視圖)
│   ├── theory-learning.html             # 學科全真題庫練習 (互動單選刷題、考點詳解展開、防爆題號網格)
│   ├── mock-exam.html                   # 全真模擬考試考場 (60分鐘即時計時器、淡入評分結算 Modal)
│   ├── practical-learning.html          # 術科題組版型實作 (官方四大題組動態切換、自適應線稿、地雷清單)
│   ├── code-editor.html                 # 線上雙欄即時代碼編輯器 (原生沙盒即時編譯、手機端 0.2s 雙頁籤)
│   ├── ai-coach.html                    # 4 階 AI 思考鷹架助教 (無滾動條橫向滑動 Chips、漸進提示對話)
│   └── learning-progress.html           # 個人學習歷程與弱點診斷 (320px 緊湊 2x2 指標網格、雙進度條)
└── assets/
    ├── css/
    │   ├── tokens.css                   # 品牌色彩、流動文字階層 clamp()、間距、圓角與 Safe Area 變數
    │   ├── global.css                   # CSS Reset、零溢出保護 min-width:0、繁體中文平衡斷行 text-wrap
    │   ├── components.css               # 按鈕、卡片、緊湊導覽列(48px)、標籤、進度條、淡入Modal元件
    │   └── pages.css                    # 響應式雙欄系統 (.subpage-split-grid)、代碼工作台與線稿樣式
    ├── js/
    │   ├── prototype-data.js            # 官方四大題組、證照清單、4 階鷹架模擬題目之 Mock Data
    │   ├── navigation.js                # 導覽列當前頁高亮、毛玻璃滾動監聽、手機版漢堡選單抽屜
    │   └── interactions.js              # 證照即時防抖搜尋、類別篩選、AI 步驟切換、浮動 Toast 提示
    └── images/                          # 包含官方 Folio Monogram SVG 標誌與品牌圖形資產
```

---

## 三、快速啟動與預覽方式

### 方式一：直接以瀏覽器雙擊開啟（最推薦，無任何環境依賴）
1. 在檔案總管中開啟 `C:\Users\user\Documents\CODE-TO-KNOW\prototype`。
2. 直接雙擊 `index.html`。
3. 系統將以預設瀏覽器（Chrome, Edge, Firefox, Safari 等）直接開啟，所有樣式、圖示、搜尋與互動皆能即時運作。

### 方式二：使用 VS Code Live Server 擴充套件（開發預覽）
1. 在 VS Code 中以右鍵點擊 `prototype/index.html`。
2. 選擇 **Open with Live Server**。
3. 預設將開啟於 `http://127.0.0.1:5500/prototype/index.html`。

---

## 四、九大頁面功能完成度與真實性狀態

| 頁面 / 模組 | 主要互動與特色 | 真實性分類 | 展示備註 |
| :--- | :--- | :---: | :--- |
| **首頁 (`index.html`)** | 品牌導覽、Hero 主視覺、3 大精選證照卡、4 階 AI 思考鷹架互動 Tab 模擬、師生雙端切換 | **A. 已實際運作** | 教師端演示為 Toast 原型模擬。 |
| **證照智慧學習中心 (`certifications.html`)** | 關鍵字 150ms 防抖搜尋、考核面向/專業領域複合篩選、一鍵重設、6+1 證照卡狀態管理 | **A. 已實際運作** | 網頁設計丙級標註開放，其餘五項嚴格標註 COMING SOON。 |
| **證照檢定大綱 (`certification-detail.html`)** | URL 參數解析（`?id=web-design-c` 與 `?id=software-design-c`）、考點分佈、四大題組指引、籌備期提示 | **A. 已實際運作** | 動態切換開放與籌備視圖。 |
| **學科全真題庫 (`theory-learning.html`)** | 單選題選項選取、答案提交即時批改反饋、W3C 考點詳解動態展開、防爆題號導覽快選卡 | **B. 原型模擬** | 題目為示範題型，未串接後端題庫 API。 |
| **全真模擬測驗 (`mock-exam.html`)** | 60 分鐘自動倒數計時、提前交卷 0.25s 淡入結算 Modal（88.75 分）、遮罩/ESC 多重關閉 | **A. 計時/彈窗已運作<br>B. 分數為模擬** | 分數為標準示範資料，未寫入後端。 |
| **術科題組實作 (`practical-learning.html`)** | 官方四大題組即時切換、自適應線稿示意圖（1024x65 header、menu、iframe main）、評分地雷檢核 | **A. 已實際運作** | 100% 依循官方四大題組，徹底排除虛構題組五。 |
| **線上代碼工作台 (`code-editor.html`)** | 左欄 HTML/CSS 代碼輸入、右欄即時編譯預覽、Ctrl+Enter 快捷鍵、範例重設、手機端 0.2s 雙頁籤 | **A. 已實際運作** | 原生沙盒真正可自由改寫程式碼並即時渲染。 |
| **4 階 AI 助教 (`ai-coach.html`)** | 無原生滾動條橫向滑動 Chips、四階思考鷹架漸進引導對話串（觀念聚焦→破題思路→邊界提點→架構解構） | **B. 原型模擬** | 展示鷹架教育流程，**尚未串接** 外部 LLM API。 |
| **個人學習歷程 (`learning-progress.html`)** | 320px 緊湊 2×2 指標網格、考照準備度預估、進行中證照雙軌進度條、高頻錯誤盲點診斷 | **B. 原型模擬** | 展現儀表板規格，數據為代表性原型資料。 |

---

## 五、重要展示文件與報告連結

- [正式展示操作指南與 5～8 分鐘比賽流程手冊 (SHOWCASE_GUIDE.md)](SHOWCASE_GUIDE.md)
- [功能真實性盤點清單 (SHOWCASE_FEATURE_INVENTORY.md)](SHOWCASE_FEATURE_INVENTORY.md)
- [第五階段最終回歸驗收報告 (PHASE5_FINAL_ACCEPTANCE_REPORT.md)](PHASE5_FINAL_ACCEPTANCE_REPORT.md)

---

## 六、與正式 React + TypeScript 專案的隔離說明

- **獨立性保證**：本目錄下之檔案皆獨立於 `frontend/` 與 `backend/` 之外。
- **不干擾正式系統**：未修改任何資料庫、Prisma 設定、`.env` 或正式身分驗證邏輯。
- **未來移植路徑**：成熟的組件結構可參照 `frontend/src/components/` 規範改寫為 React Function Component 並接入真實 API。
