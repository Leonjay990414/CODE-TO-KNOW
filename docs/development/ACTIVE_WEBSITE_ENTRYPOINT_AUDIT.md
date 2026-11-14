# CODE TO KNOW｜正式網站入口與載入鏈查核報告

> **查核時間**：2026-11-14  
> **查核性質**：唯讀環境與架構獨立審查（Read-Only Architecture & Entrypoint Audit）  
> **目的**：徹底確認 Antigravity IDE 正在編輯的正式網站專案、唯一 HTML 入口、React 載入鏈與不同 HTML 檔案的職責邊界，防止修改錯誤檔案。  

---

## 一、直接回答七大核心問題

### 1. 你目前正在編輯哪一個正式網站專案？
- **編輯專案**：`CODE TO KNOW`（中文品牌：碼上學）。
- **專案本機完整絕對路徑**：`C:\Users\user\Documents\CODE-TO-KNOW`。
- **Git 根目錄**：`C:/Users/user/Documents/CODE-TO-KNOW`。
- **目前分支與 HEAD**：`main` 分支，HEAD 指向 `310323dee802eb3a940ed947c7c665e147fb19f3`。
- **多副本檢查**：經磁碟全面盤查，本機同層僅有本專案主目錄 `CODE-TO-KNOW`、備份目錄 `CODE-TO-KNOW_BACKUPS` 與金鑰目錄 `CODE-TO-KNOW_SECRETS`，**不存在混淆開發的第二個同名專案副本**。

### 2. 正式網站使用哪一個 `index.html`？
- **正式網站原始開發入口**：`frontend/index.html`。
- 這是 Vite 現代前端專案唯一的原始 HTML 模板入口。

### 3. 該檔案的完整絕對路徑是什麼？
- `C:\Users\user\Documents\CODE-TO-KNOW\frontend\index.html`。

### 4. 真正承載網站畫面的 React 入口是哪個檔案？
- 真正載入畫面、掛載 React DOM 的入口檔案為：
  `C:\Users\user\Documents\CODE-TO-KNOW\frontend\src\main.tsx`。
- 其掛載標籤為 `frontend/index.html` 中的 `<div id="root"></div>`，並渲染根組件 `frontend/src/app/App.tsx`。

### 5. 為什麼使用者直接雙擊開啟該 HTML 可能只看到空白？
- **原因 1（ES Module 機制）**：`frontend/index.html` 第 17 行包含 `<script type="module" src="/src/main.tsx"></script>`。瀏覽器若以 `file:///` 本機協議直接開啟 HTML，因瀏覽器 CORS 安全策略限制，禁止載入本機檔案系統上的 ES Module 模組，會直接拋出安全性錯誤。
- **原因 2（JSX/TypeScript 未經編譯）**：瀏覽器原生無法解析 `.tsx`（TypeScript + JSX）語法，必須透過 Vite 伺服器即時轉換（Transpile）為原生 JavaScript。
- **原因 3（Root 初始為空）**：HTML 原始檔中的 `<div id="root"></div>` 沒有任何靜態 HTML 標籤，所有的導覽列、頁面內容、卡片皆是由 React 在執行時期動態渲染注入。

### 6. 正確啟動正式網站的方式是什麼？
- **開發模式（本地熱重載開發）**：
  在終端機切換至前端目錄並執行 Vite 開發伺服器：
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  啟動後於瀏覽器造訪本機伺服器網址：`http://localhost:3000`。
- **生產預覽模式（驗證打包結果）**：
  ```bash
  cd frontend
  npm run build
  npm run preview
  ```

### 7. 是否存在 Antigravity 編輯了錯誤專案副本或錯誤 HTML 的風險？
- **風險評估：無風險，已百分之百排除。**
- 實體查證證實：
  1. Antigravity IDE 的工作目錄與 Git 根目錄完全鎖定於 `C:\Users\user\Documents\CODE-TO-KNOW`。
  2. 專案中所有的 React 頁面、組件與樣式皆座落於 `frontend/src/`，建置設定由 `frontend/vite.config.ts` 與 `frontend/package.json` 精確控管。
  3. GitHub Actions CI/CD（`deploy-preview.yml` 與 `deploy-pages.yml`）建置流程亦完全指定以 `frontend` 目錄執行 `npm run build`，產出至 `frontend/dist` 發布，與本機開發入口完全一致。

---

## 二、專案內所有 index.html 檔案清冊與職責劃分

全專案經磁碟搜尋，共存在 3 個 `index.html`，各自職責如下：

| 相對路徑 | 完整絕對路徑 | 檔案大小 | 檔案用途與角色 | 是否為正式網站開發原始檔 |
| :--- | :--- | :---: | :--- | :---: |
| **`frontend/index.html`** | `C:\Users\user\Documents\CODE-TO-KNOW\frontend\index.html` | 1,034 bytes | **【唯一正式原始入口】**<br>Vite 前端 Single Page Application (SPA) 模板，內含 `<div id="root"></div>` 與 `<script type="module" src="/src/main.tsx">`。 | **是 (正式來源)** |
| **`frontend/dist/index.html`** | `C:\Users\user\Documents\CODE-TO-KNOW\frontend\dist\index.html` | 1,134 bytes | **【生產打包產物】**<br>執行 `npm run build` (即 `tsc && vite build`) 後由 Vite 自動壓縮產出之發布成品。禁止手動編輯，每次 build 會自動覆寫。 | 否 (編譯產物) |
| **`prototype/index.html`** | `C:\Users\user\Documents\CODE-TO-KNOW\prototype\index.html` | 64,463 bytes | **【早期純 HTML 靜態原型】**<br>初期無前端框架時設計之靜態頁面原型，供直接以 `file:///` 瀏覽介面版型，不依賴 Node.js/React，與現代 React 正式網站完全獨立。 | 否 (歷史靜態原型) |

---

## 三、正式網站完整載入鏈驗證

完整架構呼叫鏈經追蹤核實如下：

```mermaid
flowchart TD
    A["frontend/index.html<br>(Vite HTML Entry)"] -->|載入 script type=module| B["frontend/src/main.tsx<br>(DOM 渲染入口)"]
    B -->|掛載至 #root| C["frontend/src/app/App.tsx<br>(主應用組件)"]
    C -->|全域狀態包覆| D1["AuthProvider (AuthContext.tsx)"]
    C -->|全域狀態包覆| D2["NavigationProvider (NavigationContext.tsx)"]
    D2 -->|路由分派 (hash 監聽與切換)| E["各功能頁面組件 (src/pages/public/...)"]
    E --> F1["StudentDashboardPage (學生儀表板)"]
    E --> F2["TheoryPracticePage (學科刷題與題庫)"]
    E --> F3["PracticalLearningPage (五大術科題組教材)"]
    E --> F4["LearningProgressPage (學習進度與錯題本)"]
    E --> F5["AICoachPage (AI 學習教練)"]
    E --> F6["LegalNoticePage (法律與政策聲明)"]
```

### 3.1 驗證點清單
1. **HTML Script 標記**：`frontend/index.html` 第 17 行包含 `<script type="module" src="/src/main.tsx"></script>`。
2. **React 掛載**：`frontend/src/main.tsx` 存在且完整引入 `ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(...)`。
3. **App 路由與組件**：`frontend/src/app/App.tsx` 引入 `NavigationProvider`，透過 URL Hash（如 `#practice`、`#theory`、`#progress` 等）動態切換各頁面。
4. **CI/CD 自動化與發布**：
   `.github/workflows/deploy-preview.yml` 明確指定：
   ```yaml
   working-directory: frontend
   run: npm run build
   ```
   並將編譯完成之 `frontend/dist` 部署至預覽站點，證明本機開發與線上部署完全同源。

---

## 四、結論與開發準則

1. **嚴格禁止修改 `frontend/dist/` 下的任何檔案**（該目錄為建置產物）。
2. **嚴格禁止修改 `prototype/` 下的檔案**（該目錄為獨立靜態原型）。
3. **所有正式網站功能開發與修改，必須且僅能在 `frontend/src/` 與 `frontend/index.html` 進行**。
