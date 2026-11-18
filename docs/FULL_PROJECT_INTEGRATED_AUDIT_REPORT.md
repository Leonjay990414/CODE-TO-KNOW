# 碼上學｜CODE TO KNOW
# 全專案整合式稽核、修復與五層架構驗收總報告

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件編號：** `DOC-AUD-20261118-FINAL`  
**稽核日期：** 2026 年 11 月 18 日  
**專案版本：** v1.0.0-rc.2 (Pre-Phase 5 Integration Baseline)  
**目前 Git 分支：** `develop` (HEAD: `502ccbc`)  
**稽核原則：** 實機程式碼盤點、零過度宣告、誠實標註展示版／PARTIAL／BLOCKED、零破壞性操作  

---

## 一、專案概述與波次執行基準

### 1.1 品牌與核心定位
- **中文名稱：** 碼上學
- **英文名稱：** CODE TO KNOW
- **完整全銜：** 碼上學 AI 智慧學習與教育科技平台
- **品牌標語：** 碼上學，學無止境。（Learn Beyond Limits.）
- **專案屬性：** 具備完全獨立性之現代化 AI 教育科技平台，專注於資訊科技檢定（網頁設計丙級 10400）、實作技能養成、AI 啟發式學習與多角色（學生、教師、管理員、系統營運者）教學協作。

### 1.2 波次進度基線與當前狀態
專案依據 20 階段、226 個唯一 UID 之進度管理系統推進：
- **第 1 波（P01～P08）：** 基礎規格、品牌視覺與架構骨幹 —— **已結案完成（完成率 84.35%）**。
- **第 2 波（P09～P13）：** 核心平台、離線題庫與自主學習 —— **已實作收斂（完成率 54.41%）**。
- **第 3 波（P14～P20）：** 遊戲化學習、教師端、管理運營與正式部署 —— **部分就緒（完成率 10.51%）**。
- **第 4 波：** 全站 P1 / P2 問題修正與視覺無障礙體驗優化 —— **本輪全數收斂驗證完畢**。
- **第 5 波（P11, P14, P17 共 37 UID）：** 規格與架構已定稿於 `docs/PHASE_5_IMPLEMENTATION_PLAN.md`，處於**準備啟動狀態 (READY TO COMMENCE)**。

---

## 二、全站五層架構與頁面／路由深度對齊盤點

### 2.1 實體頁面（27 檔）vs 頂層路由（23 條）深度稽核
先前稽核報告曾指出「21 個頁面與 23 條路由」之數字落差，經本次實機程式碼全盤深度掃描，確認核心原因為：**未計入 `pages/student/practical/` 下的 5 個術科子頁面與 `pages/system-ops/` 獨立模組**。

#### 全站 27 個實體 `.tsx` 頁面元件檔案對齊矩陣：

| 編號 | 實體檔案路徑 | 對應頂層路由 / 存取方式 | 架構層級 | 權限要求 | 狀態備註 |
| :---: | :--- | :--- | :---: | :---: | :--- |
| 1 | `frontend/src/pages/public/HomePage.tsx` | `#home` (`/`) | L1 宣傳網站 | 公開訪客 | 展示版數據誠實標示 |
| 2 | `frontend/src/pages/public/TheoryPracticePage.tsx` | `#theory` | L2 學生學習 | 學生/訪客 | 114 題官方檢定學科庫 |
| 3 | `frontend/src/pages/public/MockExamPage.tsx` | `#mock-exam` | L2 學生學習 | 學生/訪客 | 80 題正式配比模擬測驗 |
| 4 | `frontend/src/pages/public/PracticalLearningPage.tsx` | `#practical` | L2 學生學習 | 學生/訪客 | 舊版術科入口 (相容保留) |
| 5 | `frontend/src/pages/public/CodeEditorPage.tsx` | `#editor` | L2 學生學習 | 學生/訪客 | iframe 沙箱程式碼編輯器 |
| 6 | `frontend/src/pages/public/LearningProgressPage.tsx` | `#progress` | L2 學生學習 | 學生/訪客 | 多題組進度與學習歷程 |
| 7 | `frontend/src/pages/public/StudentDashboardPage.tsx` | `#student` | L2 學生學習 | 學生 | 學習儀表板與班級加入 |
| 8 | `frontend/src/pages/public/TeacherDashboardPage.tsx` | `#teacher` | L3 教師教學 | 教師 | 班級管理與學生成績檢視 |
| 9 | `frontend/src/pages/public/AdminDashboardPage.tsx` | `#admin` | L4 平台管理 | 平台管理員 | 純化為帳號/班級/內容審核 |
| 10 | `frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx` | `#system-ops` | L5 系統營運 | 系統維運者 | 獨立自 Admin，健康度監控 |
| 11 | `frontend/src/pages/public/AICoachPage.tsx` | `#ai-coach` | L2 學生學習 | 學生/訪客 | 清楚標示展示版示範模型 |
| 12 | `frontend/src/pages/public/GameCenterPage.tsx` | `#games` | L2 學生學習 | 學生/訪客 | 五大遊戲大廳入口 |
| 13 | `frontend/src/pages/public/CodePuzzlePage.tsx` | `#game/puzzle` | L2 學生學習 | 學生/訪客 | 程式碼拼圖闖關遊戲 |
| 14 | `frontend/src/pages/public/CSSDesignerPage.tsx` | `#game/css` | L2 學生學習 | 學生/訪客 | CSS 樣式大師互動遊戲 |
| 15 | `frontend/src/pages/public/BugHunterPage.tsx` | `#game/bug-hunter`| L2 學生學習 | 學生/訪客 | 除錯特工視覺挑戰遊戲 |
| 16 | `frontend/src/pages/public/QuizRushPage.tsx` | `#game/quiz-rush` | L2 學生學習 | 學生/訪客 | 競速問答積分挑戰賽 |
| 17 | `frontend/src/pages/public/WebBuilderPage.tsx` | `#game/web-builder`| L2 學生學習 | 學生/訪客 | 積木組裝網頁遊戲 |
| 18 | `frontend/src/pages/public/ProfilePage.tsx` | `#profile` | 通用個人 | 已登入會員 | 個人資料與偏好設定 |
| 19 | `frontend/src/pages/public/SettingsPage.tsx` | `#settings` | 通用設定 | 已登入會員 | 系統設定與快取重置 |
| 20 | `frontend/src/pages/public/HelpCenterPage.tsx` | `#help` | L1 宣傳網站 | 公開訪客 | 常見問題與操作手冊 |
| 21 | `frontend/src/pages/public/LegalNoticePage.tsx` | `#legal` | L1 宣傳網站 | 公開訪客 | 服務條款與隱私權宣告 |
| 22 | `frontend/src/pages/public/NotFoundPage.tsx` | 404 容錯 | 通用例外 | 公開訪客 | 路由不存在時的優雅降級 |
| 23 | `frontend/src/pages/student/practical/StudentPracticalHubPage.tsx`| `#student/practical`| L2 學生學習 | 學生/訪客 | **P1-03 註冊頂層路由** |
| 24 | `frontend/src/pages/student/practical/PracticalHomePage.tsx` | 動態子視圖 | L2 學生學習 | 學生/訪客 | 由 HubPage 依參數渲染 |
| 25 | `frontend/src/pages/student/practical/PracticalDetailPage.tsx` | 動態子視圖 | L2 學生學習 | 學生/訪客 | 由 HubPage 依參數渲染 |
| 26 | `frontend/src/pages/student/practical/PracticalLessonPage.tsx` | 動態子視圖 | L2 學生學習 | 學生/訪客 | 由 HubPage 依參數渲染 |
| 27 | `frontend/src/pages/student/practical/PracticalSandboxPage.tsx`| 動態子視圖 | L2 學生學習 | 學生/訪客 | 由 HubPage 依參數渲染 |

- **結論：** 實體頁面共 **27 個**，頂層註冊路由共 **23 條**，未註冊實體頁面為 **0**（4 個子頁面作為 `StudentPracticalHubPage` 內部的狀態子視圖運作）。所有頁面均有明確掛載與測試覆蓋。

### 2.2 目錄結構整頓與遷移評估
目前專案已建立階層式架構目錄（含 README 規範），但考量到全站有超過 **29 個核心元件與測試檔案** 深度依賴 `pages/public/` 的匯入路徑：
- **安全決策：** 遵循「不為盲目提升完成率而破壞既有架構穩定」之原則，目前維持 `pages/public/` 作為匯出基準，同時在新目錄建立規範性索引。此項標記為 **PARTIAL（架構定位明確，路徑平滑過渡中）**。

---

## 三、RBAC 權限體系與 L4／L5 架構分離狀態

### 3.1 現況真相與資料庫限制
- **資料庫 Prisma 結構：**
  資料庫角色透過關聯資料表 `model Role` 實現，目前種子資料庫中合法註冊之角色僅有：
  1. `STUDENT`（學生）
  2. `TEACHER`（教師）
  3. `ADMIN`（管理員）
- **安全防線限制：**
  受限於使用者明確指示之安全紅線（`AUTH-03`：嚴禁未授權執行 Prisma Migration 或更動正式資料庫 Schema），**目前資料庫無法新增 `PLATFORM_ADMIN` 與 `SYSTEM_OPERATOR` 實體 Enum／Table 紀錄**。

### 3.2 程式碼層級的職責純化與向下相容（P1-02）
1. **後端中介軟體 (`backend/src/middleware/authorize.ts`)：**
   - 實作相容映射：`expandCompatibleRoles`，將 `ADMIN` 與 `PLATFORM_ADMIN` 視為同等管理授權。
   - **安全阻斷：** 明確禁止自動擴展 `SYSTEM_OPERATOR`，確保高風險維運端點具備最高阻絕性。
2. **前端介面純化：**
   - `AdminDashboardPage.tsx`（L4 平台管理）：完全移除 CPU/RAM 偽監控數據與伺服器日誌，專注於「使用者審核」、「班級總覽」、「內容監管」、「系統廣播公告」。
   - `SystemOpsDashboardPage.tsx`（L5 系統營運）：獨立為新頁面（路由 `#system-ops`），負責「後端 API 連線檢測」、「資料庫延遲 PING」、「系統審核日誌 (Audit Logs)」與「快取重置維護」。
3. **判定結果：** 前端介面與路由已完成純化與實體拆分，正式角色分割標記為 **BLOCKED（等待下一階段獲准執行 DB Migration）**。

---

## 四、核心學習模組完整性驗收

### 4.1 學科練習 (Theory Practice)
- **資料庫與題庫：** 包含勞動部勞動力發展署官方 10400 網頁設計丙級完整 114 題單選題庫。
- **作答功能：** 支援循序作答、即時解析、分類篩選、自動記錄本機錯題本（`ctk_wrong_questions`）。
- **驗收結果：** **PASS (100% 離線可用)**。

### 4.2 模擬測驗 (Mock Exam)
- **正式檢定配比：** 嚴格遵循勞動部規定，隨機抽選 80 題單選題（每題 1.25 分，總分 100 分，60 分及格）。
- **計時交卷機制：** 100 分鐘倒數計時、提前交卷確認、即時成績計算與雷達弱點圖分析。
- **驗收結果：** **PASS**。

### 4.3 術科實作 (Practical Learning)
- **官方題組確認：** 嚴格保留勞動部正式五大題組：
  - `104301`：校園社團介紹網
  - `104302`：運動廣場
  - `104303`：國家公園介紹
  - `104304`：流行音樂資訊網
  - `104305`：網路購物商城
- **影音教學：** 已嵌入官方 YouTube 播放清單（ID: `PLvb3m203I-S9Taljh638W8AddxiHS9h1D`）。
- **非官方題組保護：** 早期示範題「台灣美食精緻巡禮」已安全封存於 `NON_OFFICIAL_ARCHIVED_TASKS`，絕無污染檢定內容。
- **驗收結果：** **PASS**。

### 4.4 程式碼編輯器 (Code Editor)
- **沙箱安全機制：** 輸出預覽之 `<iframe>` 嚴格配置 `sandbox="allow-scripts"`，禁止 `allow-top-navigation` 與 `allow-same-origin`，有效防範 DOM 穿越與 Session 劫持。
- **即時預覽：** 支援 HTML/CSS/JS 即時編譯渲染、語法重置、下載原始碼。
- **驗收結果：** **PASS**。

### 4.5 學習歷程追蹤 (Learning Progress)
- **向下相容防護：** `learningStorage.ts` 具備雙向相容邏輯，優先讀取 `ctk_practical_progress:`，若為空自動回退相容讀取舊版 `practical_progress:`，並於儲存時安全升級，絕不遺失使用者過往進度。
- **驗收結果：** **PASS**。

---

## 五、P1／P2 問題整合修復與驗收成果

| 編號 | 項目說明 | 修復前狀態 | 修復後狀態與實踐細節 | 驗收證據 |
| :---: | :--- | :--- | :--- | :--- |
| **P1-01** | Footer 連結與聯絡郵箱 | 連結指向未註冊路徑，郵箱真實性存疑 | 1. 修正全站連結至合規 Anchor 路由。<br>2. 標註 `contact@codetoknow.edu.tw` 需待 MX 紀錄配置 (PARTIAL)。 | `Footer.tsx`、P1 測試 |
| **P1-02** | L4/L5 後台混合 | AdminDashboardPage 混雜維運資訊 | 拆分為獨立 `SystemOpsDashboardPage.tsx`，純化各自權責與前端導航。 | 兩大獨立頁面原始碼 |
| **P1-03** | 新版術科頁面未註冊 | 4 個子頁面無正式入口路由 | 建立 `StudentPracticalHubPage.tsx` 並註冊 `#student/practical` 頂層路由。 | `NavigationContext.tsx` |
| **P1-04** | AI Coach 示範標示 | 易使使用者誤認為真實雲端 LLM | 頁面顯著處加註「*展示版示範模型／評估指標」，揭露其為啟發式原型。 | `AICoachPage.tsx` |
| **P2-01** | 香檳金文字對比度 | `#BDA77E` 在淺色背景對比度僅 2.3:1 (未達 WCAG AA) | 建立 Token `--color-brand-gold-text: #7C663D`，淺色底對比度升至 5.1:1；深色底保留 `#BDA77E` (5.5:1)。 | `tokens.css`、全站 20+ 元件替換 |
| **P2-02** | 觸控目標尺寸不足 | 關閉按鈕、星星評分、Tag 小於 44x44px | 全面擴充 `min-width: 44px; min-height: 44px` 與點擊熱區，符合行動無障礙。 | Modal、Navbar、Game 元件 |
| **P2-03** | 首頁數據真實性 | 呈現固定統計數字，未加註解 | 首頁數據卡片顯著加註「*展示版示範模型／評估指標」。 | `Hero.tsx`、`StudentTeacherDual.tsx` |
| **P2-04** | 21 vs 23 頁面落差 | 盤點數量與路由表無法對齊 | 完成 27 個實體檔案與 23 條路由之對應矩陣，確認 0 孤立檔案。 | 詳見本報告第二節 |

---

## 六、測試套件與建置驗證結果

### 6.1 前端測試套件 (Vitest + Testing Library)
- **測試檔案總數：** 59 個
- **測試案例總數：** 546 個
- **測試結果：** **546 passed (100%)**
- **涵蓋範圍：** P1 修復驗證、P2 視覺與無障礙、學科題庫、模擬測驗、五大教育遊戲、API 彈性降級、防抄襲機制等。

### 6.2 後端測試套件 (Vitest Offline Suite)
- **測試檔案總數：** 17 個
- **測試案例總數：** 221 個
- **測試結果：** **221 passed (100%)**
- **涵蓋範圍：** RBAC 權限工作流、班級防重複機制、IDOR 物件層級防護、CSRF 驗證、安全錯誤日誌脫敏（Redaction）、密碼雜湊生命週期等。

### 6.3 總計測試成果
- **全案測試檔案：** **76 個測試檔**
- **全案測試總數：** **767 項測試**
- **測試總通過率：** **100.0% PASS**

### 6.4 生產環境建置 (Vite Production Build)
- **建置指令：** `npm run build --prefix frontend` (`tsc && vite build`)
- **建置耗時：** 2.29 秒
- **建置輸出：** `dist/` 目錄完整產生，0 TypeScript 類型錯誤，0 編譯警告。

---

## 七、狀態分類總評 (Status Categorization)

1. **PASS（已完成並具備全自動化測試佐證）：**
   - 官方學科 114 題庫與 80 題模擬測驗系統。
   - 官方術科五大題組（104301~104305）學習架構與教學清單。
   - 程式碼編輯器 iframe 沙箱隔離機制。
   - P1-03 術科學習頂層路由註冊。
   - P1-04 / P2-03 展示版示範標籤加註。
   - P2-01 香檳金色系 WCAG AA 對比度強化。
   - P2-02 44x44px 觸控點擊目標擴充。
   - 學習進度存儲向下相容（Fallback）。
   - 前端 546 項測試與後端 221 項測試（共 767 項測試）。
   - 前端 Production Build 成功編譯。

2. **PARTIAL（具備本機實作與介面，但依賴後續配置）：**
   - 官方聯絡信箱 `contact@codetoknow.edu.tw`（需配置網域名稱 MX/SPF/DKIM 紀錄）。
   - 五層實體檔案目錄遷移（架構已確立，維持現有路徑避免破壞 29 處匯入）。
   - System Ops 系統維運數據（`/api/health` 與 DB 延遲為真，主機 CPU/RAM 標註尚未介接 APM）。

3. **BLOCKED（受限於安全紅線或等待使用者授權）：**
   - 資料庫 `Role` 表正式新增 `PLATFORM_ADMIN` 與 `SYSTEM_OPERATOR`（需 Prisma Migration 與資料庫寫入授權）。
   - 雲端 Supabase 連線寫入與真實真實使用者資料持久化（需解除 `AUTH-03` 隔離）。
   - 雲端 LLM API 即時對話串流（需伺服器環境變數安全注入 `GEMINI_API_KEY`）。

4. **NOT STARTED（依專案排程屬於後續波次）：**
   - 第 5 波正式 37 UID 實作（已完成架構規劃）。
   - CI/CD 自動化發布流水線（依排程待發布審核通過）。

---

## 八、發布前風險與阻擋清單 (Release Blockers)

在使用者決定執行 `git push origin main` 與 Render Production 部署前，以下項目必須保持清醒認知：
1. **網域郵件未就緒：** 使用者若發送郵件至 `contact@codetoknow.edu.tw` 將會退信，目前已於前端標註說明。
2. **L5 營運權限仍共用 ADMIN Token：** 在未執行 DB Migration 前，維運人員仍需以管理員身分登入。
3. **無伺服器金鑰外洩防護：** 目前前端完全未放置任何 AI Key 或資料庫連線字串，確保極致安全。
4. **雲端部署設定需同步：** Render 服務名稱 `code-to-know-web`，Root Directory 為 `frontend`，Build Command 為 `npm ci && npm run build`，Publish Directory 為 `dist`。

---

## 九、結論與下一步交付文件索引
本次全專案整合式工程任務已徹底完成全盤盤點、程式碼修復、視覺優化與雙端測試驗證。

**後續交付文件列表：**
1. [FULL_PROJECT_REPAIR_CHANGELOG.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/FULL_PROJECT_REPAIR_CHANGELOG.md) - 38 個檔案逐一修復履歷
2. [PHASE_5_IMPLEMENTATION_PLAN.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/PHASE_5_IMPLEMENTATION_PLAN.md) - 第 5 波 37 UID 完整工程規劃書
3. [RELEASE_READINESS_CHECKLIST.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/RELEASE_READINESS_CHECKLIST.md) - 發布前最後防線檢核表
