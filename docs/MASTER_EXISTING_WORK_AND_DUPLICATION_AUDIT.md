# CODE TO KNOW｜既有成果與重複開發稽核報告 (Master Existing Work & Duplication Audit)

版本：MASTER-DUPLICATION-AUDIT-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
目的：鎖定專案既有成果防止重複重寫；識別冗餘與重複資源；提供去重與整編安全建議。

---

## 一、嚴禁重複開發與推翻之既有成果清單 (Frozen Assets & Completed Features)

以下 10 大核心資產與模組已經過完整驗證、測試或官方校驗，後續代理人與開發者**嚴格禁止重複開發、推翻或擅自重構**：

| 編號 | 既有核心成果項目 | 涉及檔案與路徑 | 驗證證據與保護理由 | 禁制準則 |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **官方術科五大題組學習系統** | `frontend/src/pages/student/practical/*`<br>`data/unifiedPracticalCurriculumData.ts` | 嚴格對齊 104301~104305 (社團介紹網、運動廣場、國家公園、網路行銷、旅遊相簿) | **嚴禁竄改題組名稱**；嚴禁發明「台灣美食」等非官方題組 |
| **02** | **官方學科 674 題題庫與測驗** | `frontend/src/data/officialTheoryQuestionBank.json`<br>`frontend/src/pages/public/TheoryPracticePage.tsx` | 17300 網頁設計丙級官方全真題庫，已實作單選/複選與倒數模擬測驗 | 嚴禁重寫題庫結構；保持題目編號與選項對齊官方簡章 |
| **03** | **後端安全與驗證授權架構** | `backend/src/middleware/*`<br>`backend/src/modules/auth/*` | 雙重 Cookie CSRF、JWT Session、Rate-limiting、IDOR 越權防護，221 測試全綠 | 嚴禁破壞現有中介軟體管線；嚴禁移除 Zod 輸入校驗 |
| **04** | **班級管理與教學支援 API** | `backend/src/modules/classrooms/*`<br>`backend/src/modules/teachers/*` | 6 支班級 API、6 碼 high-entropy joinCode、教師審查機制全數實作就緒 | 嚴禁重複開發重複的班級加入或成員管理路由 |
| **05** | **全站五層導覽與路由架構** | `frontend/src/context/NavigationContext.tsx`<br>`frontend/src/app/App.tsx` | 完整註冊 27 個功能頁面，支援麵包屑與 L1~L5 權限過濾 | 嚴禁回到舊版扁平路由；嚴禁重複註冊已存在的 Page Key |
| **06** | **香檳金無障礙色彩對比修復** | `frontend/src/styles/tokens.css` | `--c2k-primary-gold` 調整為深香檳金 `#9B7E4B` (對比度 4.5:1，符合 WCAG AA) | 嚴禁回退至原始低對比度 `#BDA77E`，確保閱讀無障礙 |
| **07** | **全站觸控區域與 RWD 尺寸修復** | `frontend/src/components/*`<br>`frontend/src/styles/components.css` | 漢堡選單、按鈕、Modal 關閉圖示皆達到 44x44px 最低觸控標準 | 嚴禁縮小按鈕 hit target；維持 320px~1920px 響應式相容 |
| **08** | **L4 平台管理與 L5 營運監控分離** | `frontend/src/pages/public/AdminDashboardPage.tsx`<br>`frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx` | 將伺服器延遲與資料庫健康檢查自 AdminDashboard 移至獨立 L5 營運監控 | 嚴禁將系統營運代碼重新塞回管理員業務頁面 |
| **09** | **五大教育遊戲關卡** | `frontend/src/pages/public/CodePuzzlePage.tsx` 等 5 頁面 | CodePuzzle, CSSDesigner, BugHunter, QuizRush, WebBuilder 已具備完整邏輯 | 嚴禁砍掉重練；僅允許在其基礎上進行難度擴充與排行榜接軌 |
| **10** | **官方信箱與法律規範聲明** | `frontend/src/components/Footer.tsx`<br>`frontend/src/pages/public/LegalNoticePage.tsx` | 確立四組正式信箱 (`official`, `academic`, `support`, `business@codetoknow.edu`) | 嚴禁隨意更換為假信箱或個人網址 |

---

## 二、專案現存重複性與冗餘資源盤點 (Redundancy & Duplication Audit)

經全面代碼與資產掃描，專案目前存在以下幾類冗餘或重複現象：

### 1. 試題壓縮檔與解壓縮目錄重複
- **現象**：根目錄同時存在 `173003B13.7z` (91MB)、`題組二_五.7z` (23MB) 與解壓縮後的 `173003B13/`、`題組一~五答案/`、`照片/`。
- **評估**：解壓縮目錄為專案核心靜態素材來源；`.7z` 壓縮檔為原始官方封存包。
- **處置建議**：兩者皆具備保存價值，但 `.7z` 體積龐大，建議在正式 Git 儲存庫中透過 Git LFS 或 `.gitignore` 排除，避免倉庫膨脹。

### 2. 獨立原型目錄與前端正式頁面重複
- **現象**：`games/` 目錄與 `prototype/` 目錄下包含舊版 HTML/JS 程式碼（如 `games/BugHunter/index.html`）。
- **評估**：這些遊戲邏輯已經全數移植並重構成現代 React 組件，置於 `frontend/src/pages/public/` 中。
- **處置建議**：保留 `games/` 與 `prototype/` 作為「歷史原型存檔（Archive）」，但在文件與目錄中標記為 `DEPRECATED_ARCHIVE`，避免新進工程師誤讀。

### 3. 多代理人工具產生之小數點隱藏目錄
- **現象**：根目錄存在 50+ 個外部代理人目錄（如 `.adal`, `.aider-desk`, `.claude`, `.devin`, `.openhands` 等）。
- **評估**：為多代理人切換時自動生成的暫存配置或快取，內部多為空檔或暫存日誌。
- **處置建議**：確認均已被 `.gitignore` 排除，禁止提交至 Git。可在後續維護階段進行安全清理。

### 4. 歷史稽核與進度文件命名版本分散
- **現象**：`docs/` 目錄存在多份歷史命名之報告（如 `PROJECT_20_PHASE_PROGRESS_FINAL_20261115.md` vs `PROJECT_20_PHASE_MASTER_PROGRESS_AUDIT_20261113.md`）。
- **評估**：造成 AI 在檢索時產生進度判定漂移。
- **處置建議**：自本次「第 0 波盤點」起，統一以 10 份 `MASTER_*` 文件作為單一事實來源（Single Source of Truth），歷史文件僅作封存參考。

---

## 三、去重複化與整編具體執行建議 (Deduplication Roadmap)

| 優先等級 | 建議處置標的 | 具體執行方式 | 安全防護原則 |
| :--- | :--- | :--- | :--- |
| **高 (P1)** | 固化 10 份 `MASTER_*` 文件 | 在專案根目錄指引中將 10 份 Master 文件列為最高事實來源 | 不刪除歷史檔案，僅建立權威索引 |
| **中 (P2)** | 標註 `games/` 與 `prototype/` | 在兩資料夾下新增 `README.md` 標註為【歷史原型封存，請參照 frontend】 | 零代碼刪除，防止遺失原始演算法細節 |
| **中 (P2)** | 統一試題素材引用路徑 | 前端統一透過 `data/` 或 `frontend/src/data/` 引用題庫，避免多頭維護 | 保持 104301~104305 題組完整性 |
| **低 (P3)** | 清理未追蹤之外部代理人暫存 | 審查並清理 `.aider-desk`、`.claude` 等純暫存目錄 | 確保不誤刪 `.agents/` 專案專屬規則 |
