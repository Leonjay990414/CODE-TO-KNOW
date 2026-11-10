# CODE TO KNOW｜GitHub Pages 公開展示版第一階段：部署前唯讀檢查報告
# GITHUB_PAGES_PREVIEW_PHASE1_PREFLIGHT

**文件編號**：C2K-DOC-GHPAGES-P1-01  
**審查日期**：2026-11-09  
**主責角色**：資深前端工程師、DevSecOps 稽核架構師  
**審查性質**：**100% 唯讀安全檢查**（無雲端連線、無部署、無推送、無公開 Repository 建立）  
**目標原始 Repository**：`Leonjay990414/CODE-TO-KNOW`（**維持 Private 狀態，嚴禁公開**）  

---

## 一、本機專案實際狀態

1. **本機專案路徑**：`C:\Users\user\Documents\CODE-TO-KNOW`
2. **Git 分支與 HEAD**：
   - 當前分支：`main`
   - 當前 HEAD Commit：[`70a4c0cadd40300a9b92c74e570310e72b563891`](https://github.com/Leonjay990414/CODE-TO-KNOW/commit/70a4c0cadd40300a9b92c74e570310e72b563891)
   - 遠端同步狀態：`Your branch is up to date with 'origin/main'.`
3. **未提交之本機修改保留確認**：
   經 `git status` 核驗，本機以下 4 項檔案已完整保留，未執行任何覆蓋、還原或刪除：
   - `modified: "~$DE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx"`（Office 執行中暫存鎖定檔，完整保留）
   - `modified: "新增 文字文件.txt"`（包含使用者個人憑據，完整保留，嚴禁公開）
   - `untracked: "1.docx"`（Google Drive 暫存硬連結，完整保留）
   - `untracked: "照片/"`（包含 4 張個人討論與控制台截圖，完整保留）

---

## 二、Vite 建置結果與產物分析

### 1. 前端套件依賴與腳本檢查 (`frontend/package.json`)
- **套件名稱**：`code-to-know-frontend` (v1.0.0, private: true)
- **核心相依套件 (Dependencies)**：
  - `react`: `^18.3.1`
  - `react-dom`: `^18.3.1`
  - `lucide-react`: `^0.460.0`
- **開發相依套件 (DevDependencies)**：
  - `typescript`: `^5.6.3`
  - `vite`: `^5.4.10`
  - `@vitejs/plugin-react`: `^4.3.3`
- **建置腳本**：`"build": "tsc && vite build"`

### 2. 本機建置執行結果 (`npm --prefix frontend run build`)
- **執行狀態**：**100% 成功通過 (Exit Code 0)**
- **模組轉換**：`✓ 1612 modules transformed.`
- **建置耗時**：`1.75s`
- **TypeScript 靜態型別檢查**：零錯誤（Zero TypeScript Errors）

### 3. 建置產物分析 (`frontend/dist/`)
```
frontend/dist/
├── index.html                   (1,131 bytes)
├── assets/
│   ├── index-DitPEgO1.js        (544,287 bytes, gzip: 141.83 kB)
│   └── index-HmsvxDpa.css       (14,219 bytes, gzip: 3.50 kB)
└── images/
    └── logo/
        ├── lockup-dark.svg      (1,880 bytes)
        ├── lockup-light.svg     (1,845 bytes)
        ├── symbol-mono.svg      (903 bytes)
        └── symbol.svg           (1,217 bytes)
```
- **產物特點**：JS bundle 僅 ~544 kB（gzip 後 141 kB），CSS 僅 14 kB，完全無龐大肥大依賴，具備極佳的網頁首頁載入速度。

---

## 三、靜態資源與 Base 路徑重大問題檢驗

### 1. Vite `base` 路徑重大隱患（必須修正項）
- **目前設定 (`frontend/vite.config.ts`)**：
  ```typescript
  export default defineConfig({
    plugins: [react()],
    server: { port: 3000, open: false },
  });
  ```
- **分析**：目前未設定 `base` 參數，Vite 預設採用絕對根路徑 `base: '/'`。
- **影響評估**：
  建置出的 `frontend/dist/index.html` 產生以下標籤：
  ```html
  <link rel="icon" type="image/svg+xml" href="/images/logo/symbol.svg" />
  <script type="module" crossorigin src="/assets/index-DitPEgO1.js"></script>
  <link rel="stylesheet" crossorigin href="/assets/index-HmsvxDpa.css">
  ```
  若部署至 GitHub Pages 專案頁面（例如 `https://<username>.github.io/<repo-name>/`）：
  - 瀏覽器將向 `https://<username>.github.io/assets/...` 請求資源。
  - **這將導致 JS、CSS 與 Favicon 全數 404 Not Found，頁面呈現完全空白！**
- **建議修正**：
  必須於 `vite.config.ts` 設定相對基底路徑：
  ```typescript
  base: './', // 確保在任何子目錄下均能正確相對於 index.html 載入資源
  ```
  並同步將 `frontend/index.html` 中的 Favicon 改為相對路徑 `./images/logo/symbol.svg`。

### 2. 靜態資源、圖片與字型路徑
- **Logo 渲染**：`Navbar.tsx` 中的「碼上學 Folio Monogram」標誌採用純內嵌向量 SVG（`viewBox="0 0 256 256"`），**完全無外部圖檔依賴**，永遠不會破圖。
- **字型資源**：Google Fonts（`Noto Sans TC`, `Inter`, `JetBrains Mono`）均透過 `https://fonts.googleapis.com` 官方 CDN 載入，零本地字型檔案相依性。
- **試題素材圖片**：實作題庫中的 `<img src="images/logo.png">` 為程式編輯器內的模擬考題 HTML 字串，非系統介面破圖來源。

---

## 四、React 路由機制與 GitHub Pages 404 分析

### 1. 目前路由架構
清查 `frontend/src/context/NavigationContext.tsx`：
```typescript
export function parseHash(rawHash: string): RouteState {
  const hash = rawHash.replace(/^#\/?/, '').trim();
  // 依據 window.location.hash 解析當前頁面
}
```
- **路由技術**：**純客戶端 Hash 路由 (`window.location.hash`)**，如 `#hero`、`#certifications`、`#mock-exam`、`#ai-coach`、`#code-editor` 等。

### 2. 子頁面重新整理是否會出現 404？
- **結論**：**絕對不會出現 404！具備天生的 GitHub Pages 免疫力**。
- **理由**：
  - 一般採用 HTML5 `BrowserRouter`（`history.pushState`）的單頁應用在 GitHub Pages 上重新整理 `/certifications` 時，GitHub Pages 靜態伺服器會因為找不到該實體資料夾而回傳 404。
  - **CODE TO KNOW 目前採用 Hash 路由**，瀏覽器只會向 GitHub Pages 伺服器請求 `index.html`（回傳 200 OK），`#` 後方的路徑完全由瀏覽器端 React 的 `NavigationProvider` 監聽 `hashchange` 事件解析並無縫切換。
  - **無需任何 SPA 404 重定向黑客腳本（無需 `404.html` hack）**即可完美運作。

---

## 五、公開展示版安全檢查結果（零機密洩漏）

經全面掃描前端程式碼庫與建置產物：

| 檢查項目 | 檢查範圍 | 掃描結果 | 安全判定 |
| :--- | :--- | :--- | :--- |
| **Supabase 憑據** | `frontend/src/`, `frontend/dist/` | 零 `supabase.co`、零 `anon`、零 `service_role` | **PASS** |
| **資料庫連線字串** | `frontend/src/`, `frontend/dist/` | 零 `postgresql://`、零 `DATABASE_URL` | **PASS** |
| **後端私鑰與密碼** | `frontend/src/`, `frontend/dist/` | 零 `JWT_SECRET`、零 `passwordHash`、零私人密鑰 | **PASS** |
| **環境變數檔案** | `frontend/.env`, `frontend/.env.example` | 僅含 `VITE_API_URL="http://localhost:4000/api"` | **PASS** |
| **個人身分資料** | 靜態資料集 (`data/`) | 全數為公開技術題庫、範例試題與虛構教材 | **PASS** |

**審查結論**：前端程式碼架構與建置產物達到極高純度，**未包含任何不應公開的敏感憑據、密鑰或正式資料庫設定**。

---

## 六、公開展示功能盤點（可展示 vs 需停用/需展示標註）

### 1. 具備 100% 獨立離線運作能力之「公開展示頁面」（10 個頁面）

以下頁面皆由前端自帶的豐富結構化資料庫（`data/*.ts`）與本地狀態機驅動，**完全不需要後端伺服器**即可完整互動展示：

1. **首頁 (`HomePage`)**：
   - 品牌精神展示、五層網站架構、AI 分階段引導互動演示、核心認證亮點、雙受眾引流卡片。
2. **證照中心總覽 (`CertificationsPage`)**：
   - 6 大技術認證檢定卡片、難度指標、學術科比重、核心能力標籤。
3. **證照詳細資訊 (`CertificationDetailPage`)**：
   - 完整考科大綱、評分標準、試題規範、準備指引。
4. **網頁設計丙級專題展示 (`WebDesignCDemoPage`)**：
   - 專門針對 17300 網頁設計技術士之術科五大題型全貌與考場攻略解析。
5. **學科題庫全真演練 (`TheoryPracticePage`)**：
   - 單選題/複選題互動式作答、立即計分、官方標準解析、分階段概念探討。
6. **全真模擬測驗系統 (`MockExamPage`)**：
   - 倒數計時器、題號導航跳轉、交卷評分雷達、答題紀錄檢視。
7. **術科實作拆解教學 (`PracticalLearningPage`)**：
   - 試題版面切割規範、素材處理步驟、評分扣分點防禦指南。
8. **線上程式碼編輯器沙盒 (`CodeEditorPage`)**：
   - 雙欄即時 HTML / CSS 編輯器、即時 iframe 沙盒渲染、語法驗證、重置還原。
9. **AI 教練分階段引導互動 (`AICoachPage`)**：
   - 第一階段「觀念提示」、第二階段「邏輯拆解」、第三階段「範例除錯」的漸進式互動引導。
10. **題庫結構與來源管理展示 (`QuestionBankImportSystemPage`)**：
    - 多題庫來源管理架構、JSON 格式規範檢視。

---

### 2. 需暫時標示「展示模式說明」或停用之功能

以下功能因依賴後端 API 伺服器與資料庫連線，在純靜態 GitHub Pages 上會因無法連接 `localhost:4000` 而觸發錯誤提示：

1. **使用者登入 / 註冊彈窗 (`AuthModal`)**：
   - *現狀*：點擊登入會嘗試 `fetch /api/auth/login`，在 GitHub Pages 上將回傳網路失敗。
   - *處置方案*：在公開展示版中，可增加「**展示帳號體驗**」按鈕，直接在前端 Context 寫入 Mock 使用者狀態；或提示「展示模式：帳號系統連線離線維護中」。
2. **個人學習歷程儀表板 (`LearningProgressPage`)**：
   - *現狀*：目前受 `ProtectedRoute` 保護，未登入狀態會顯示「認證服務暫時無法連線」或「請先登入帳號」。
   - *處置方案*：提供「以訪客/示範學生身份預覽」按鈕，載入預設的學習歷程圖表數據。
3. **學生中心 (`StudentDashboardPage`)**：
   - *現狀*：受 `ProtectedRoute` 保護。
   - *處置方案*：提供「學生示範數據預覽」。
4. **教師教學管理中心 (`TeacherDashboardPage`)**：
   - *現狀*：受 `ProtectedRoute`（需 `TEACHER` 角色）保護。
   - *處置方案*：提供「教師後台功能預覽視圖」。
5. **教師身分線上認證申請 (`TeacherApplyModal`)**：
   - *現狀*：提交表單會呼叫後端 API。
   - *處置方案*：送出後模擬「申請已送出（展示模式），審核需 1-2 工作天」之成功提示反饋。

---

## 七、GitHub Pages 部署架構與安全策略建議

### 1. 原始 Repository 之 Private 權限邊界（最高鐵律）
- **約束**：`Leonjay990414/CODE-TO-KNOW` 為核心資產庫，目前為 Private，**絕對必須維持 Private**，不得為展示目的變更為 Public。

### 2. 建議部署架構方案比較

| 方案 | 部署架構 | 優點 | 限制與注意事項 | 建議度 |
| :--- | :--- | :--- | :--- | :--- |
| **方案 A<br>(獨立公開展示庫)** | 建立專屬公開倉庫：<br>`Leonjay990414/code-to-know-preview`<br>僅推送前端 `frontend/dist` 靜態檔案 | 1. 核心代碼庫 100% 維持 Private 隔離。<br>2. 展示倉庫僅有編譯後 HTML/CSS/JS，完全不含後端或審查文件。<br>3. GitHub Free 方案即可啟用 GitHub Pages。 | 需要維護第二個純靜態發布庫。 | **★★★★★<br>(強烈推薦)** |
| **方案 B<br>(Private Pages)** | 在現有 Private 倉庫直接啟用 GitHub Pages | 1. 單一倉庫管理。<br>2. 自動透過 GitHub Actions 部署。 | **僅限 GitHub Enterprise / GitHub Pro 付費帳戶**支援；且若未設定身分存取控制，可能需要受權限保護。 | **★★★☆☆<br>(受限方案)** |
| **方案 C<br>(Vercel / Cloudflare Pages)** | 將前端連結至 Vercel 或 Cloudflare Pages 免費託管 | 1. 原倉庫可維持 Private。<br>2. 自動化 CI/CD 建置。<br>3. 自帶 CDN 與自訂網域。 | 非純 GitHub 體系（若限定使用 GitHub Pages 則不適用）。 | **★★★★☆<br>(備選推薦)** |

---

## 八、尚未解決的問題與下一步行動清單

1. **尚未解決的問題**：
   - `frontend/vite.config.ts` 中的 `base: './'` 尚未修訂（本階段為唯讀檢查，未擅自修改）。
   - `frontend/index.html` 中的 Favicon `<link>` 尚帶有絕對根斜線 `/images/...`。
   - `AuthModal` 與 `ProtectedRoute` 在離線展示狀態下會跳出「連線異常」，尚未加入「展示模式（Demo Mode）訪客一鍵預覽」開關。
2. **下一步建議工作**：
   - **第一步**：修訂 `frontend/vite.config.ts` 加入 `base: './'`，並在 `index.html` 修正相對路徑。
   - **第二步**：於 `AuthContext` 增加 `isDemoMode` 模擬訪客開關，讓體驗者無需後端即可自由切換學生/教師視角瀏覽儀表板。
   - **第三步**：建立專屬的獨立公開展示庫（如 `code-to-know-preview`）或配置 GitHub Actions 靜態部署工作流。

---

**檢查結論**：
CODE TO KNOW 前端應用程式在架構上高度成熟，**採用 Hash 路由完全避開 GitHub Pages 404 問題**，核心 10 大公開學習頁面具備完整的獨立離線運作能力，且前端產物無任何敏感憑據。只要在下一步修訂 `base: './'` 與加入訪客展示模式，即可安全、無瑕疵地發布為高質感的公開展示版本！
