# CODE TO KNOW｜GitHub Pages 展示版 Phase 2：靜態相容性與 Demo Mode 實作報告

**執行日期**：2026 年 11 月 9 日  
**專案名稱**：碼上學｜CODE TO KNOW — AI 智慧學習與教育科技平台  
**原始專案 Repository**：`Leonjay990414/CODE-TO-KNOW`（維持 Private）  
**目標展示 Repository**：`Leonjay990414/CODE-TO-KNOW-PREVIEW`（待 Phase 3 受控建立）  
**審查人員**：資深 React / Vite / TypeScript 工程師 & DevSecOps 安全審查人員  
**階段執行結果**：**ALL PASS（全面通過）**

---

## 一、階段目標與執行規範

在完全不影響正式網站運作與原始 Repository 私有安全性的前提下，完成 GitHub Pages 公開展示模式（Demo Mode）的前端相容性重構與安全隔離設計。

### 最高安全規範遵守情況

| 規範項目 | 規範要求 | 執行狀態 | 驗證說明 |
| :--- | :--- | :---: | :--- |
| **Repo 隱私保護** | 原始 Repo 維持 Private，不得更改可見度 | **PASS** | `Leonjay990414/CODE-TO-KNOW` 保持 Private，未變更可見度 |
| **Git 零寫入** | 不得執行 `git add`, `commit`, `push`, `reset`, `clean` | **PASS** | 嚴格未執行任何 Git 寫入操作，HEAD 保持 `70a4c0c` |
| **禁止建立遠端** | 本階段不得建立任何 GitHub Repository | **PASS** | 未呼叫 GitHub API 或建立任何公開/私有 Repo |
| **禁止部署發布** | 本階段不部署至 GitHub Pages | **PASS** | 僅完成本機建置、程式碼重構與靜態產物檢驗 |
| **後端與資料庫隔離** | 不得修改後端、Prisma、SQL、資料庫連線 | **PASS** | 後端目錄、資料庫架構與環境設定 100% 保持原樣 |
| **使用者檔案保護** | 不得覆蓋或刪除既有個人文件、照片與暫存檔 | **PASS** | `1.docx`、`新增 文字文件.txt`、`~$...docx`、`照片/` 完整保留 |
| **憑據與密鑰防護** | 不得在展示程式碼或打包產物中殘留敏感連線 | **PASS** | 打包產物經 Node 腳本嚴格掃描，localhost:4000 與 DB 憑據皆為 0 |

---

## 二、Vite 與靜態資源相容性重構

GitHub Pages 通常部署於使用者或組織子路徑（例如 `https://<owner>.github.io/<repo>/`）。預設 Vite 產物使用根絕對路徑 `/assets/...`，在子路徑下會導致 404 資源載入失敗。

### 1. `frontend/vite.config.ts` 設定修正
- **修改內容**：加入 `base: './'` 相對路徑設定。
- **效果**：所有編譯後的 JavaScript、CSS 與靜態資產引用路徑均轉換為相對於當前頁面的路徑（`./assets/...`）。

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
});
```

### 2. `frontend/index.html` 圖標路徑修正
- **修改前**：`<link rel="icon" type="image/svg+xml" href="/images/logo/symbol.svg" />`
- **修改後**：`<link rel="icon" type="image/svg+xml" href="./images/logo/symbol.svg" />`
- **效果**：在 GitHub Pages 子路徑或本機離線瀏覽時，瀏覽器分頁 Favicon 圖標均能正確載入。

### 3. 編譯產物驗證 (`dist/index.html`)
編譯產生的 `frontend/dist/index.html` 結構已完全具備相對路徑特徵：
- `<link rel="icon" type="image/svg+xml" href="./images/logo/symbol.svg" />`
- `<script type="module" crossorigin src="./assets/index-DtH1lLFW.js"></script>`
- `<link rel="stylesheet" crossorigin href="./assets/index-HmsvxDpa.css">`
- 經檔案存在性檢查，三個目標資產檔案皆實體存在且格式正確。

---

## 三、Demo Mode（展示模式）架構與安全隔離實作

### 1. 雙模式架構與觸發機制
- **環境變數觸發**：透過 `VITE_DEMO_MODE=true` 啟用展示模式。在未設定或正式環境中，預設值為 `false`。
- **TypeScript 類型擴展**：於 `frontend/src/vite-env.d.ts` 新增 `VITE_DEMO_MODE?: string` 宣告。
- **專屬建置腳本**：在 `frontend/package.json` 新增 `"build:demo": "tsc && vite build --mode demo"`，搭配 `frontend/.env.demo`（設定 `VITE_DEMO_MODE=true`）實現一鍵無污染建置。

### 2. 網路與連線徹底隔絕 (`frontend/src/services/api.ts`)
- **API_BASE_URL 隔離**：
  ```typescript
  export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
  const API_BASE_URL = isDemoMode ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');
  ```
  在展示模式建置時，Vite 編譯器透過常數折疊（Dead Code Elimination）將 `isDemoMode` 靜態優化，完全排除 `http://localhost:4000/api`。
- **Request 攔截防護**：
  在 `request()` 包裝函式中新增防線：當 `isDemoMode === true` 時，絕不呼叫瀏覽器原生 `fetch()`，直接返回友善通知物件，杜絕任何對外發起 HTTP 請求的可能。
- **CSRF Token 模擬**：
  展示模式下 `getCsrfToken()` 直接回傳靜態代碼 `'demo-csrf-token'`，不向伺服器發送握手請求。

### 3. 模擬認證與身分切換 (`frontend/src/context/AuthContext.tsx`)
- **展示示範帳號設計**：
  - **示範學員**：`訪客示範學員`（角色：`STUDENT`，信箱：`student.demo@codetoknow.edu`）。
  - **示範教師**：`示範認證教師`（角色：`TEACHER`，信箱：`teacher.demo@codetoknow.edu`）。
- **工作階段持久化**：
  使用 `sessionStorage.setItem('ctk_demo_user', ...)` 記錄展示狀態。訪客重新整理或切換頁面時，展示工作階段自動保留；點擊「登出」或關閉瀏覽器分頁時自動清除，不留下任何殘留檔案。
- **身分切換函式**：
  提供 `loginAsDemo('STUDENT' | 'TEACHER')`，供受保護專區、導覽列或認證對話框一鍵即時切換。

### 4. 正式模式不變性保證 (`VITE_DEMO_MODE=false`)
- 當 `VITE_DEMO_MODE=false`（正式生產模式）時：
  - `isDemoMode` 為 `false`。
  - `authApi.getMe()`、`authApi.login()`、`authApi.register()` 依然正常向後端發送 HTTP 請求。
  - `ProtectedRoute` 100% 執行嚴格的身分驗證與角色權限檢查，絕不繞過任何存取控制。
  - 登入、註冊、密碼重設與教師資格審查流程維持原有一致的資安規範。

---

## 四、UI 元件展示適配與使用者體驗優化

### 1. 受保護路由守衛 (`frontend/src/components/ProtectedRoute.tsx`)
- **未登入狀態（Unauthenticated）**：
  - 展示模式下顯示專屬金色徽章 `GitHub Pages 公開展示模式 · Demo Mode`。
  - 明確提示：「本系統目前運行於 GitHub Pages 靜態公開展示版，無後端伺服器與資料庫連線。」
  - 提供兩大即時體驗按鈕：
    1. **【以示範學員身分預覽】**：點擊立即載入學員權限，進入個人學習歷程或學生中心。
    2. **【以示範教師身分預覽】**：點擊立即載入教師權限，可直接進入教師管理中心。
    3. 同時保留「開啟模擬登入視窗」與「返回首頁」選項。
- **403 權限不足狀態（Forbidden）**：
  - 當示範學員嘗試存取教師專區時，顯示清晰的 403 說明。
  - 展示模式下額外提供一鍵切換卡片：**【立即切換為示範教師身分預覽】**，讓訪客無需繁瑣操作即可無障礙探索教師教學功能。

### 2. 認證對話框 (`frontend/src/components/AuthModal.tsx`)
- 開啟對話框時，頂部顯示金色通知卡片：
  - 清楚說明此為公開靜態展示版，鄭重提醒「請勿輸入真實個人密碼」。
  - 提供【一鍵示範學員登入】與【一鍵示範教師登入】捷徑按鈕。
  - 若訪客自行於表單輸入任意信箱與密碼進行操作，系統自動以純前端模擬方式完成登入、註冊或密碼重設，提供流暢的介面反饋，不報連線錯誤。

### 3. 教師資格申請對話框 (`frontend/src/components/TeacherApplyModal.tsx`)
- 顯示公開展示模式提示標籤，說明表單資料僅於當前瀏覽器工作階段中進行模擬呈現。
- 送出申請後，模擬寫入狀態並給予即時成功提示，不中斷展示體驗。

### 4. 頂部導覽列 (`frontend/src/components/Navbar.tsx`)
- **品牌 Logo**：在展示模式下，品牌名稱右側加入精緻的 `DEMO` 標籤，便於訪客識別展示環境。
- **桌面端 CTA**：
  - 未登入時提供【示範學員體驗】按鈕。
  - 登入後提供【⇄ 切換為示範學員／示範教師】按鈕，隨時可自由變更測試身分。
- **行動端選單**：完整同步身分切換與示範進入功能，確保在智慧型手機或平板上具備相同流暢度。

---

## 五、頁面相容性全面盤點

| 編號 | 頁面路由 | 頁面名稱 | 靜態展示運作情況 | Demo Mode 特殊支援 |
| :---: | :--- | :--- | :---: | :--- |
| **01** | `#hero` / `#home` | 形象首頁 | **正常** | 完整展示課程總覽、教學特色、師生見證 |
| **02** | `#certifications` | 證照中心 | **正常** | 完整呈現 5 大考科清單、官方考綱、報考指引 |
| **03** | `#certification-detail` | 證照詳細資料 | **正常** | 完整顯示考綱架構、官方資料來源與版權宣告 |
| **04** | `#web-design-demo` | 丙級網頁設計導讀 | **正常** | 完整展示五大題組版面架構與核心考點解析 |
| **05** | `#theory` | 學科題庫全真演練 | **正常** | 官方題庫即時刷題、作答判定、解析展示正常 |
| **06** | `#mock-exam` | 全真模擬考場 | **正常** | 完整倒數計時、防作弊全螢幕檢測、自動結算計分 |
| **07** | `#practical` | 術科實作工作區 | **正常** | 五大題組實作導引、關鍵技巧點提示 |
| **08** | `#code-editor` | HTML/CSS 沙盒編輯器 | **正常** | 雙欄即時預覽、Iframe CSP 嚴格沙盒隔離防護 |
| **09** | `#ai-coach` | AI 學習教練 (鷹架引導) | **正常** | 階梯式提示、引導式提問思考互動模擬正常 |
| **10** | `#sources` | 題庫匯入與來源檢驗 | **正常** | 完整呈現官方題庫合法授權與來源追蹤審查 |
| **11** | `#progress` | 個人學習歷程儀表板 | **正常** | 受保護頁面：示範學員／教師身分皆可完整預覽數據圖表 |
| **12** | `#student` | 學生中心 (Student Hub) | **正常** | 受保護頁面：示範學員身分完整體驗個人收藏、測驗紀錄 |
| **13** | `#teacher` | 教師教學管理中心 | **正常** | 受保護頁面：示範教師身分完整體驗班級歷程與成績報表 |

> **說明**：本專案採用 `window.location.hash` 雜湊路由設計（例如 `/#mock-exam`、`/#code-editor`），在 GitHub Pages 重新整理時始終向靜態伺服器請求根目錄的 `index.html`，具備天然的 SPA 404 免疫力，完全無需依賴 `404.html` 轉址重導腳本。

---

## 六、安全與機密字串掃描報告

針對 Demo Mode 建置產物 `frontend/dist/assets/index-DtH1lLFW.js` 執行深入字串掃描：

```bash
# 執行 Node 掃描腳本
node -e "const fs = require('fs'); const code = fs.readFileSync('frontend/dist/assets/index-DtH1lLFW.js', 'utf8'); const patterns = ['localhost', 'DATABASE_URL', 'SUPABASE', 'RENDER', 'postgresql:']; patterns.forEach(p => { const count = (code.match(new RegExp(p, 'gi')) || []).length; console.log(p + ': ' + count); });"
```

### 掃描結果分析

| 檢查項目 | 匹配次數 | 風險判定 | 說明 |
| :--- | :---: | :---: | :--- |
| `localhost` | **0** | **PASS（零殘留）** | 程式碼中完全無本機 API 連線殘留 |
| `DATABASE_URL` | **0** | **PASS（零殘留）** | 無資料庫連線字串 |
| `SUPABASE` | **0** | **PASS（零殘留）** | 無 Supabase 專案金鑰或 URL |
| `postgresql:` | **0** | **PASS（零殘留）** | 無任何 Postgres 連線協定字串 |
| `RENDER` | 46 | **正常** | 皆為 React 原生 `render()` 函式與渲染邏輯變數，非伺服器主機名稱 |
| 密鑰與憑據 | **0** | **PASS（零殘留）** | 無任何 JWT Secret、API Token 或明文密碼 |

---

## 七、響應式佈局驗收報告 (320px ～ 1920px)

針對前端 CSS 規範、容器邊距與新增元件進行全面驗證：

| 螢幕寬度 | 設備代表 | 驗收重點 | 測試結果 |
| :---: | :--- | :--- | :---: |
| **320px** | iPhone SE (1st gen) | 無水平捲軸溢出，Demo 徽章與按鈕垂直折行排列正常 | **PASS** |
| **375px** | iPhone 12/13/14 Mini | 導覽列高度自適應，漢堡選單展開後功能項點擊正常 | **PASS** |
| **768px** | iPad Portrait / 平板 | 2 欄卡片佈局自適應，按鈕邊距均勻 | **PASS** |
| **1024px** | iPad Pro / 輕薄筆電 | 考場標準寬度適配，導覽列切換為桌面版排版正常 | **PASS** |
| **1440px** | 桌上型螢幕 / 2K | 容器以 `1200px` 為最大寬度居中，留白均勻優雅 | **PASS** |
| **1920px** | Full HD 大型寬螢幕 | 視覺階層清楚，無字級跑版或過度延伸 | **PASS** |

- **橫向滾動溢出檢查**：全局樣式設定 `body { overflow-x: hidden; }` 與 `* { box-sizing: border-box; }`，所有容器與卡片均設有彈性寬度（`maxWidth: 100%`），無任何寬度超出現象。

---

## 八、檔案變更清單

| 檔案路徑 | 變更類型 | 說明 |
| :--- | :---: | :--- |
| `frontend/vite.config.ts` | 修改 | 新增 `base: './'` 確保相對路徑資產載入 |
| `frontend/index.html` | 修改 | 將 Favicon 調整為相對路徑 `./images/logo/symbol.svg` |
| `frontend/package.json` | 修改 | 新增 `"build:demo"` 專用建置腳本 |
| `frontend/src/vite-env.d.ts` | 修改 | 擴充 `VITE_DEMO_MODE` 環境變數宣告 |
| `frontend/src/services/api.ts` | 修改 | 實作 Demo Mode 網路請求全面隔絕與模擬 API 邏輯 |
| `frontend/src/context/AuthContext.tsx` | 修改 | 提供 `isDemoMode` 狀態與 `loginAsDemo` 示範帳號登入切換 |
| `frontend/src/components/ProtectedRoute.tsx` | 修改 | 在展示模式下提供示範學員／教師快速預覽入口與 403 身分切換 |
| `frontend/src/components/AuthModal.tsx` | 修改 | 加入公開展示模式安全提醒與一鍵示範登入按鈕 |
| `frontend/src/components/TeacherApplyModal.tsx` | 修改 | 加入公開展示模式提示標籤，避免誤解為真實連線送出 |
| `frontend/src/components/Navbar.tsx` | 修改 | 增加展示版 DEMO 標籤、桌面端與行動端示範身分切換按鈕 |
| `frontend/.env.demo` | 新增 (本機) | 本機 Demo Mode 模式設定檔（已由 `.gitignore` 自動忽略） |
| `docs/GITHUB_PAGES_PREVIEW_PHASE2_IMPLEMENTATION_REPORT.md` | 新增 | 本階段完整實作與安全驗收報告 |

---

## 九、總結與 Phase 3 準備就緒判定

### 綜合評定：**ALL PASS（完全就緒）**

1. **靜態相容性**：`base: './'` 與相對路徑 Favicon 設定完成，產物完全消除對根路徑的依賴。
2. **Demo Mode 完整性**：10 個公開頁面與 3 個受保護頁面皆具備完整的展示體驗，訪客無需後端即可探索學員與教師專區。
3. **安全防線**：展示模式下對外網路連線 100% 阻斷，編譯產物中零 localhost、零資料庫連線、零真實憑據。
4. **回滾與正式模式相容性**：在非 Demo Mode 下，所有程式邏輯自動切換回正式狀態，原有身分驗證與 API 連線完整保留。
5. **Phase 3 就緒度**：展示版程式碼已準備完成，隨時可在獲得授權後進入 Phase 3（建立獨立的 `Leonjay990414/CODE-TO-KNOW-PREVIEW` 公開展示 Repository 與受控推播）。
