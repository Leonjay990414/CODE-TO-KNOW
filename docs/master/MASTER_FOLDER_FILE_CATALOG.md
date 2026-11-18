# CODE TO KNOW｜第 0 波・第一批：全專案資料夾與檔案清冊
# (MASTER_FOLDER_FILE_CATALOG.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-FOLDER-FILE-CATALOG  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**盤點範圍**：根目錄、`frontend/`、`backend/`、`docs/`、`database/`、`scripts/`、`prototype/`、`games/`、`data/`、`173003B13/`、`題組一~五答案/`、`照片/`、`.agents/`。

---

## 1. 根目錄一級資料夾總覽

| 資料夾路徑 | 實際用途 | 主要功能 | 所屬階段 | 引用/依賴關係 | 使用狀態 | 重複/過期評估 | 敏感資料 | 處置建議 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/` | 前端應用主目錄 | React 19 + Vite 6 客戶端應用程式 | P01, P02, P03, P09, P10, P11, P12, P14, P16 | 依賴後端 API；獨立運行雙模 | 正式使用 | 無重複；部分舊頁面路徑待收整 | 否 | **保留** |
| `backend/` | 後端服務主目錄 | Express 4 + Prisma ORM API 服務 | P04, P05, P07, P08, P16 | 提供前端 API；連接 PG17 資料庫 | 正式使用 | 無重複；離線 221 測試綠燈 | 否 | **保留** |
| `docs/` | 正式文件庫主目錄 | 20 階段總綱、五層架構規範、稽核報告 | 跨階段架構 | 被代理人與工程師查閱 | 正式使用 | 存在歷史命名版本，已由 master 收整 | 否 | **保留** |
| `database/` | 資料庫輔助目錄 | Docker PG17 初始化設定檔 | P04 | 供 docker-compose 引用 | 正式使用 | 無重複 | 否 | **保留** |
| `scripts/` | 工具腳本目錄 | 題庫匯入、相依性與環境檢查工具 | P09, P19 | 獨立 CLI 工具腳本 | 正式使用 | 無重複 | 否 | **保留** |
| `prototype/` | 靜態切版展示原型 | 早期網頁設計丙級靜態 HTML 切版概念 | P01, P02 | 供設計展示；被 WebDesignCDemoPage 參照 | 歷史展示 | 與前端 React 組件功能重疊 | 否 | **待整理** (標註存檔) |
| `games/` | 獨立遊戲原型目錄 | 早期 HTML5/JS 遊戲 (BugHunter 等) | P14 | 供前端 GameCenterPage 移植參照 | 歷史展示 | 邏輯已移植至 frontend/src/pages/ | 否 | **待整理** (標註存檔) |
| `data/` | 題庫與課綱原始資料 | 技能檢定官方題庫原始 JSON/Excel | P09, P10 | 被 scripts 與前端題庫模組引用 | 正式使用 | 無重複；官方核心資產 | 否 | **保留 (嚴禁改動)** |
| `173003B13/` | 官方術科題組素材包 | 勞動部 104301~104305 原始試題圖片/文字 | P10 | 被前端術科教學與沙盒引用 | 正式使用 | 核心保護資產 | 否 | **保留 (嚴禁改動)** |
| `題組一~五答案/`| 官方術科標準答案檔 | 104301~104305 官方標準答案與樣式 | P10 | 供沙盒比對引擎與教學模組參照 | 正式使用 | 核心比對資產 | 否 | **保留 (嚴禁改動)** |
| `照片/` | 檢定專用圖片素材庫 | 歷屆丙級試題指定圖片檔案 | P10 | 被術科步進單元引用 | 正式使用 | 核心靜態資產 | 否 | **保留 (嚴禁改動)** |
| `.agents/` | 代理人規則與技能庫 | 8 份 Rules、75 組 Skills | P01, P06, P11 | 規範 Antigravity 與開發生態行為 | 正式使用 | 專案專屬知識庫 | 否 | **保留** |
| `graphify-out/` | 架構關聯圖譜目錄 | 代碼 AST 相依性分析與架構維基 | 跨階段架構 | 供代理人架構查詢使用 | 正式使用 | 自動化產生 | 否 | **保留** |
| 外部代理人目錄 | 50+ 個小數點目錄 (`.adal`, `.aider-desk`等) | 第三方多代理人工具暫存快取 | 外部工具 | 外部工具暫存，專案代碼不依賴 | 暫存 | 歷史殘留快取 | 否 | **待整理** (已由 .gitignore 排除) |

---

## 2. 根目錄關鍵檔案詳細盤點

| 檔案相對路徑 | 檔案類型 | 實際用途 | 主要功能 | 所屬階段與 UID | 引用與依賴 | 狀態 | 敏感資訊 | 處置建議 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AGENTS.md` | Markdown | 專案代理人最高準則 | 定義品牌、禁令、架構、工作流程 | P01 / P01-ENG-001 | 全體代理人最高指引 | 正式使用 | 否 | **保留** |
| `PROJECT_RULES.md` | Markdown | 專案開發規範 | 定義 Git、環境、代碼規範 | P01 / P01-ENG-002 | 開發遵循規範 | 正式使用 | 否 | **保留** |
| `DESIGN.md` | Markdown | 視覺設計系統規範 | 規範色票、字型、斷點、按鈕 | P01 / P01-BRD-001 | 前端樣式依循依據 | 正式使用 | 否 | **保留** |
| `README.md` | Markdown | 專案快速入門指南 | 說明專案結構與啟動指令 | P01 / P01-ENG-003 | 開發者入門導覽 | 正式使用 | 否 | **保留** |
| `docker-compose.yml` | YAML | 本機資料庫容器設定 | 啟動 PostgreSQL 16/17 Docker | P04 / P04-INF-001 | 依賴本機 Docker Engine | 正式使用 | 否 (預設開發值) | **保留** |
| `.env.example` | Config | 環境變數設定範本 | 規範全系統變數命名格式 | P04 / P04-INF-002 | 供建立本地 .env 參照 | 正式使用 | 否 | **保留** |
| `.gitignore` | Config | Git 版本控制排除名單 | 排除 node_modules, .env, 暫存 | P01 / P01-ENG-004 | Git 工具核心設定 | 正式使用 | 否 | **保留** |
| `skills-lock.json` | JSON | Skills 相依性鎖定檔 | 記錄已載入之代理人技能 | P06 / P06-MCP-001 | Antigravity 技能系統 | 正式使用 | 否 | **保留** |
| `173003B13.7z` | 壓縮包 (91MB) | 官方試題原始封存包 | 官方發布原始壓縮檔案 | P10 / P10-PRC-001 | 與已解壓目錄重複備份 | 封存備用 | 否 | **建議排除於 Git** |
| `題組二_五.7z` | 壓縮包 (23MB) | 官方試題備用壓縮包 | 官方題組 2~5 備用素材 | P10 / P10-PRC-002 | 與已解壓目錄重複備份 | 封存備用 | 否 | **建議排除於 Git** |
| `碼上學品牌識別展示板.png` | PNG 圖片 | 品牌視覺看板資產 | 競賽與行銷展示品牌看板 | P01 / P01-BRD-002 | 行銷與展示使用 | 正式使用 | 否 | **保留** |
| `計劃書.pdf` / `計劃書.docx` | 文件檔案 | 新北市競賽計畫申報書 | 115學年度自主學習競賽企劃書 | 跨階段企劃 | 競賽申報正式文件 | 正式使用 | 否 | **保留** |

---

## 3. 後端關鍵檔案盤點 (`backend/`)

| 檔案相對路徑 | 檔案類型 | 實際用途 | 主要功能 | 所屬階段與 UID | 引用與依賴 | 狀態 | 敏感資訊 | 處置建議 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/src/server.ts` | TypeScript | 後端伺服器啟動進入點 | 監聽 Port 4000，啟動 HTTP 服務 | P04 / P04-INF-003 | 引用 app.ts, env.ts | 正式使用 | 否 | **保留** |
| `backend/src/app.ts` | TypeScript | Express 核心裝配 | 裝配 Helmet, CORS, CSRF, 路由 | P04 / P04-INF-004 | 引用各模組路由與中介軟體 | 正式使用 | 否 | **保留** |
| `backend/src/config/database.ts` | TypeScript | Prisma Client 實例池 | 提供全域 prisma 連線物件 | P04 / P04-DB-001 | 依賴 @prisma/client | 正式使用 | 否 | **保留** |
| `backend/src/config/db-validation.ts`| TypeScript | 資料庫隔離守門員 (AUTH-03)| 嚴格校驗 DEV/TEST/CLOUD URL | P04 / P04-DB-002 | 防範錯誤連線生產庫 | 正式使用 | 否 | **保留** |
| `backend/src/config/env.ts` | TypeScript | 環境變數 Zod 校驗器 | 確保啟動時環境變數格式合法 | P04 / P04-INF-005 | 依賴 zod | 正式使用 | 否 | **保留** |
| `backend/src/middleware/authenticate.ts`| TypeScript | JWT 身分驗證中介軟體 | 解析 Session Cookie，驗證身分 | P05 / P05-SEC-001 | 引用 tokens.ts, errors.ts | 正式使用 | 否 | **保留** |
| `backend/src/middleware/authorize.ts` | TypeScript | RBAC 角色授權中介軟體 | 檢查 STUDENT, TEACHER, ADMIN 權限 | P05 / P05-SEC-002 | 引用 errors.ts | 正式使用 | 否 | **保留** |
| `backend/src/middleware/csrf.ts` | TypeScript | 雙重 Cookie CSRF 防護 | 驗證 x-csrf-token 與 Cookie | P05 / P05-SEC-003 | 引用 tokens.ts, errors.ts | 正式使用 | 否 | **保留** |
| `backend/src/middleware/error-handler.ts`| TypeScript | 全域錯誤攔截與日誌脫敏 | 統一回傳格式，遮罩敏感堆疊 | P05 / P05-SEC-004 | 引用 errors.ts, redaction.ts | 正式使用 | 否 | **保留** |
| `backend/src/middleware/rate-limiter.ts` | TypeScript | 請求限流中介軟體 | 防止暴力破解與 DoS 攻擊 | P05 / P05-SEC-005 | 依賴 express-rate-limit | 正式使用 | 否 | **保留** |
| `backend/src/middleware/validate.ts` | TypeScript | Zod 請求欄位驗證中介軟體 | 驗證 Body, Query, Params 規格 | P05 / P05-SEC-006 | 依賴 zod | 正式使用 | 否 | **保留** |
| `backend/src/modules/auth/*` (4檔) | TypeScript | 認證模組 (Controller/Service/Routes/Schema) | 登入、註冊、登出、驗證信、重設密碼 | P07 / P07-USR-001~004 | 被 app.ts 掛載至 /api/auth | 正式使用 | 否 | **保留** |
| `backend/src/modules/teachers/*` (4檔) | TypeScript | 教師模組 (Controller/Service/Routes/Schema) | 教師資格申請、申請進度查詢 | P08 / P08-TCH-001~004 | 被 app.ts 掛載至 /api/teachers | 正式使用 | 否 | **保留** |
| `backend/src/modules/admin/*` (4檔) | TypeScript | 管理員模組 (Controller/Service/Routes/Schema) | 審核教師申請、檢視審計日誌 | P16 / P16-ADM-001~004 | 被 app.ts 掛載至 /api/admin | 正式使用 | 否 | **保留** |
| `backend/src/modules/classrooms/*` (4檔)| TypeScript | 班級模組 (Controller/Service/Routes/Schema) | 班級建立、加入代碼、成員維護 | P08 / P08-CLS-001~004 | 被 app.ts 掛載至 /api/classrooms | 正式使用 | 否 | **保留** |
| `backend/src/services/email*.ts` (3檔) | TypeScript | 電子郵件發送服務 | 提供註冊驗證、重設密碼信 (離線Mock) | P07 / P07-EML-001~003 | 被 auth.service.ts 引用 | 正式使用 | 否 | **保留** |
| `backend/src/utils/audit.ts` | TypeScript | 安全審計日誌記錄器 | 寫入高權限操作審計資料庫 | P16 / P16-AUD-001 | 被 admin 與 auth 模組引用 | 正式使用 | 否 | **保留** |
| `backend/src/utils/joinCode.ts` | TypeScript | 班級 6 碼加入代碼產生器 | 產生高熵、無混淆字母之班級碼 | P08 / P08-CLS-005 | 被 classroom.service.ts 引用 | 正式使用 | 否 | **保留** |
| `backend/src/utils/ownership.ts` | TypeScript | IDOR 越權防護工具 | 檢查物件所有權 (如班級成員刪除) | P05 / P05-SEC-007 | 被 classroom 控制器引用 | 正式使用 | 否 | **保留** |
| `backend/prisma/schema.prisma` | Prisma | 資料庫 ORM 定義檔 | 36 個實體模型、1 個列舉型別 | P04 / P04-DB-003 | 資料庫核心骨幹 | 正式使用 | 否 | **保留** |
| `backend/prisma/seed.ts` | TypeScript | 資料庫角色種子檔 | 初始化 STUDENT, TEACHER, ADMIN | P04 / P04-DB-004 | 依賴 database.ts | 正式使用 | 否 | **保留** |
| `backend/tests/*.test.ts` (17檔) | TypeScript | 後端離線單元測試套件 | 覆蓋認證、RBAC、CSRF、IDOR 221 個測試 | P19 / P19-TST-001 | 依賴 vitest, supertest | 正式使用 | 否 | **保留** |

---

## 4. 前端關鍵檔案盤點 (`frontend/`)

| 檔案相對路徑 | 檔案類型 | 實際用途 | 主要功能 | 所屬系統層級 | 所屬階段與 UID | 引用關係 | 狀態 | 處置建議 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/app/App.tsx` | React | 前端根組件與版面配置 | 串接 Navbar, 頁面切換, Footer | Shared | P02 / P02-WEB-001 | 引用 NavigationContext | 正式使用 | **保留** |
| `frontend/src/context/NavigationContext.tsx`| React Context | 全域導覽與路由狀態 | 管理 27 個頁面導引與麵包屑 | Shared | P02 / P02-NAV-001 | 被 App.tsx 與 Navbar 引用 | 正式使用 | **保留** |
| `frontend/src/context/AuthContext.tsx` | React Context | 全域身分認證狀態 | 管理登入登出、雙模模式切換 | Shared | P07 / P07-CTX-001 | 引用 api.ts | 正式使用 | **保留** |
| `frontend/src/services/api.ts` | TypeScript | 前端 API 客戶端 | 支援 Demo 模式與正式後端 API 雙模 | Shared | P07 / P07-API-001 | 被 AuthContext 與各後台頁面引用 | 正式使用 | **保留** |
| `frontend/src/components/Navbar.tsx` | React | 頂部全域導航列 | 提供 5 層導覽選單、身分識別 | Shared | P02 / P02-NAV-002 | 被 App.tsx 引用 | 正式使用 | **保留** |
| `frontend/src/components/Footer.tsx` | React | 頁尾資訊與連結 | 提供官方信箱、版權宣告、功能連結 | Shared | P02 / P02-NAV-003 | 被 App.tsx 引用 | 正式使用 | **保留** |
| `frontend/src/components/AuthModal.tsx` | React | 登入與註冊彈窗 | 學生/教師登入、註冊、忘記密碼 | Shared | P07 / P07-UI-001 | 引用 api.ts, AuthContext | 正式使用 | **保留** |
| `frontend/src/styles/tokens.css` | CSS | 設計系統 Design Tokens | 品牌調色板、深香檳金 (#9B7E4B) | Shared | P01 / P01-BRD-003 | 全站樣式基石 | 正式使用 | **保留** |
| `frontend/src/pages/public/HomePage.tsx` | React Page | 品牌首頁 | Hero 區塊、品牌故事、展示數據 | L1 訪客層 | P02 / P02-WEB-001 | 經 NavigationContext 載入 | 正式使用 | **保留** |
| `frontend/src/pages/public/AICoachPage.tsx` | React Page | AI 助教互動展示頁 | AI 擬真對話（明確標示【展示版】） | L1 訪客層 | P11 / P11-AI-001 | 引用 aiFallbackEngine | 正式使用 | **保留** |
| `frontend/src/pages/public/StudentDashboardPage.tsx`| React Page| 學生學習個人儀表板 | 雷達圖、學習待辦、統計數據 | L2 學生層 | P03 / P03-STD-001 | 引用 learningStorage.ts | 正式使用 | **保留** |
| `frontend/src/pages/public/TheoryPracticePage.tsx` | React Page| 學科題庫刷題系統 | 17300 網頁設計丙級 674 題刷題 | L2 學生層 | P09 / P09-THY-001 | 引用 officialTheoryQuestionBank.json | 正式使用 | **保留** |
| `frontend/src/pages/public/MockExamPage.tsx` | React Page| 模擬測驗考試系統 | 80 題 100 分倒數計時模擬測驗 | L2 學生層 | P09 / P09-EXM-001 | 引用 mockExamStorage.ts | 正式使用 | **保留** |
| `frontend/src/pages/public/CodeEditorPage.tsx` | React Page| 獨立線上程式碼編輯器 | HTML/CSS/JS 即時沙盒編輯器 | L2 學生層 | P12 / P12-IDE-001 | 引用 codeLintRuleEngine.ts | 正式使用 | **保留** |
| `frontend/src/pages/student/practical/StudentPracticalHubPage.tsx`| React Page | 現代化術科大廳 | 五大官方題組入口總覽 | L2 學生層 | P10 / P10-PRC-004 | 引用 unifiedPracticalCurriculumData | 正式使用 | **保留** |
| `frontend/src/pages/student/practical/PracticalSandboxPage.tsx`| React Page | 術科專用沙盒實作頁 | 雙欄即時切版與即時檢驗環境 | L2 學生層 | P10 / P10-IDE-001 | 引用 practicalSandboxEngine.ts | 正式使用 | **保留** |
| `frontend/src/pages/public/GameCenterPage.tsx` | React Page| 遊戲學習中心大廳 | 五大闖關遊戲入口、成就系統 | L2 學生層 | P14 / P14-GAM-001 | 引用 gameStorage.ts | 正式使用 | **保留** |
| `frontend/src/pages/public/TeacherDashboardPage.tsx`| React Page| 教師教學管理儀表板 | 班級建立、成員審查、作業派發 | L3 教師層 | P08 / P08-TCH-005 | 引用 api.ts, teacherGameTaskManager | 正式使用 | **保留** |
| `frontend/src/pages/public/AdminDashboardPage.tsx` | React Page| 平台業務管理後台 | 教師申請審核、題庫監控、審計 | L4 管理層 | P16 / P16-ADM-005 | 引用 api.ts, adminGameConfigManager | 正式使用 | **保留** |
| `frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx`| React Page| 系統營運監控後台 | 伺服器健康度、DB延遲、技術狀態 | L5 營運層 | P16 / P16-OPS-001 | 呼叫 /api/health 即時端點 | 正式使用 | **保留** |
