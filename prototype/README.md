# 碼上學 CODE TO KNOW｜第一階段 HTML Prototype 原型系統

歡迎使用「碼上學｜CODE TO KNOW」第一階段獨立 HTML 原型系統。

本原型系統旨在提供一個無需部署、無需啟動伺服器或後端服務，即可直接在瀏覽器雙擊開啟並完整體驗的互動原型。

---

## 一、系統特色

1. **直接開啟相容性 (`file://`)**：
   - 全面採用純原生 Vanilla JavaScript 與相對路徑。
   - 不依賴必須經由 HTTP 運行的 ES Module (`type="module"`）。
   - 不依賴本機 `fetch()` JSON，Mock Data 完整封裝於 `prototype-data.js`。
   - 不依賴外部 CDN 函式庫或第三方 API Key。
2. **共用品牌設計系統**：
   - 延續 CODE TO KNOW 核心色系：暖象牙白 (`#F5F2EA`)、深霧藍灰 (`#526B7B`)、柔霧藍 (`#8FA9B8`)、淺藍灰 (`#D9E2EA`)、香檳金 (`#BDA77E`)、高對比香檳金文字色 (`#7C663D`)。
   - 採用 Editorial Minimalism、軟性微毛玻璃 (Soft Glassmorphism) 與高級教育科技質感。
3. **功能模組獨立性**：
   - 每個頁面均為獨立 `.html` 檔案，頁面間導覽無死角，無 404 或空白連結。
   - 原型成熟的 UI 與互動邏輯可平滑移植回正式版 React + TypeScript 專案。

---

## 二、檔案目錄結構

```text
prototype/
├── index.html                    # 官方首頁原型 (Hero、特色、4 階 AI 導引、師生雙端、快速連結)
├── README.md                     # 本文檔：原型使用說明與技術規範
├── pages/
│   ├── certifications.html       # 證照智慧學習中心總覽 (含即時搜尋與多維度篩選)
│   ├── certification-detail.html # 證照大綱與學習地圖 (以網頁設計丙級 17300 為核心示範)
│   ├── theory-learning.html      # 學科全真題庫練習 (互動單選刷題、考點解析、錯題追蹤)
│   ├── mock-exam.html            # 全真模擬考試考場 (倒數計時、80 題單選、及格落點分析)
│   ├── practical-learning.html   # 術科題組版型實作 (題組一至五拆解、考場核對清單)
│   ├── code-editor.html          # 線上雙欄即時代碼編輯器 (左欄 HTML/CSS，右欄即時預覽)
│   ├── ai-coach.html             # 4 階 AI 思考鷹架助教專區 (按需啟發對話情境)
│   └── learning-progress.html    # 個人學習歷程與弱點診斷 (考照準備度、雷達圖、推播)
└── assets/
    ├── css/
    │   ├── tokens.css            # 品牌核心色彩、文字階層、間距、圓角與陰影變數
    │   ├── global.css            # CSS Reset、通用排版階層、Container 與無障礙 focus-visible
    │   ├── components.css        # 按鈕、卡片、玻璃導覽列、標籤、進度條、Toast 提示元件
    │   └── pages.css             # 首頁、證照中心網格、代碼編輯器等各頁專屬版面樣式
    ├── js/
    │   ├── prototype-data.js     # 證照庫、4 階鷹架模擬題目、統計指標 Mock Data
    │   ├── navigation.js         # 導覽列當前頁高亮、毛玻璃滾動監聽、手機版漢堡選單抽屜
    │   └── interactions.js       # 證照即時關鍵字搜尋、類別篩選、AI 步驟切換、浮動 Toast 提示
    └── images/                   # 包含官方 Folio Monogram SVG 標誌與品牌圖形資產
```

---

## 三、快速啟動與預覽方式

### 方式一：直接以瀏覽器雙擊開啟（最簡便，無任何環境依賴）
1. 在檔案總管中開啟 `C:\Users\user\Documents\CODE-TO-KNOW\prototype`。
2. 直接雙擊 `index.html`。
3. 系統將以預設瀏覽器（Chrome, Edge, Firefox, Safari 等）直接開啟，所有樣式、圖示、搜尋與互動皆能即時運作。

### 方式二：使用 VS Code Live Server 擴充套件（開發預覽）
1. 在 VS Code 中以右鍵點擊 `prototype/index.html`。
2. 選擇 **Open with Live Server**。
3. 預設將開啟於 `http://127.0.0.1:5500/prototype/index.html`。

---

## 四、第一階段完成功能驗收清單

| 頁面 / 模組 | 主要互動與特色 | 完成度 |
| :--- | :--- | :---: |
| **首頁 (`index.html`)** | 品牌導覽、Hero 主視覺、示範證照工作台預覽、3 大學習路徑卡、4 階 AI 思考鷹架互動 Tab 模擬、師生雙端切換、頁尾導覽 | 100% |
| **證照智慧學習中心 (`certifications.html`)** | 關鍵字即時搜尋 (名稱/代碼/標籤)、考核面向篩選 (學科/術科)、專業領域類別篩選、空狀態處理、未來檢定許願卡 | 100% |
| **證照檢定大綱 (`certification-detail.html`)** | 網頁設計丙級 17300 考點分佈、五大題組版型實作指引、學習完成度追蹤 | 100% |
| **學科全真題庫 (`theory-learning.html`)** | 互動單選題作答、即時自動批改反饋、標準解答與考點詳解展開、題目導覽快選卡 | 100% |
| **全真模擬測驗 (`mock-exam.html`)** | 60 分鐘倒數計時器、80 題單選考場防弊模擬、作答卡抽屜、交卷成績單與及格落點彈窗 | 100% |
| **術科題組實作 (`practical-learning.html`)** | 題組一至五切換、1024px 版型線框示意圖、實作分解步驟、考場扣分核對清單 | 100% |
| **線上代碼工作台 (`code-editor.html`)** | 左欄 HTML/CSS 代碼輸入、右欄即時預覽、執行代碼快捷鍵 (Ctrl+Enter)、範例代碼一鍵重設 | 100% |
| **4 階 AI 助教 (`ai-coach.html`)** | 思考鷹架引導對話模擬、熱門考點提問標籤、AI 觀念聚焦助推、自訂問題輸入互動 | 100% |
| **個人學習歷程 (`learning-progress.html`)** | 累計刷題量統計、考照準備度預估、進行中證照雙進度條、高頻錯誤盲點診斷與推播 | 100% |

---

## 五、互動體驗原則

- **杜絕無效假按鈕**：所有按鈕皆具備實質效果（跳轉相關頁面、篩選切換、代碼執行、或跳出專屬 `prototype-toast` 原型展示提示）。
- **無障礙支援**：所有主要導航與標籤皆具備 `:focus-visible` 鍵盤聚焦高亮、ARIA 標籤（`role="tab"`, `aria-selected` 等）。
- **響應式相容 (RWD)**：支援桌機、平板與手機版漢堡選單抽屜。

---

## 六、與正式 React + TypeScript 專案的隔離說明

- **獨立性保證**：本目錄下之檔案皆獨立於 `frontend/` 與 `backend/` 之外。
- **不干擾正式系統**：未修改任何資料庫、Prisma 設定、`.env` 或正式身分驗證邏輯。
- **未來移植路徑**：成熟的組件結構可參照 `frontend/src/components/` 規範改寫為 React Function Component 並接入真實 API。

