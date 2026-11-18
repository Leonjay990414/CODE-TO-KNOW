# CODE TO KNOW｜全專案資料夾與檔案總目錄 (Master Folder & File Catalog)

版本：MASTER-CATALOG-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
基準分支：develop (HEAD: 502ccbc641c09ab1598fa105f5a6d98cc685dcd8)  
性質：第 0 波全專案重新盤點與 20 階段歸檔核心清冊

---

## 一、根目錄一級資料夾總覽

| 資料夾名稱 | 性質與角色 | 主要內容與職責 | 主要歸屬階段 | 狀態 | 重複與風險標記 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/` | 後端核心 (Express 4 + TS) | API、認證、RBAC、中介軟體、資料庫連線、離線與整合測試 | P04, P05, P06, P07, P08, P10 | 正式使用 | 無重複；嚴守 AUTH-03 資料庫隔離 |
| `frontend/` | 前端核心 (React 19 + Vite 6) | 27 個功能頁面、元件庫、5層導覽架構、狀態管理、前端測試 | P01, P02, P03, P09, P11, P12, P13, P14, P15, P16, P18 | 正式使用 | 包含 21 個既有頁面與 5 個子目錄頁面，待路徑收整 |
| `docs/` | 正式專案文件庫 | 20 階段總規劃、五層架構規範、稽核報告、修復紀錄、UID 矩陣 | 跨階段架構 | 正式使用 | 存在歷史階段命名重複報告，已在本清冊統整 |
| `database/` | 資料庫設定與輔助指令碼 | Docker PostgreSQL 17 設定、初始化腳本 | P04 | 正式使用 | 輔助環境，無正式生產資料 |
| `scripts/` | 專案自動化與檢測腳本 | 題庫匯入、相依性檢查、代碼稽核工具 | P09, P19 | 正式使用 | 獨立工具腳本 |
| `data/` | 題庫與教學原始資料 | 技能檢定官方學術科題目、JSON/Excel 原始素材 | P09, P10 | 正式使用 | 核心資產，受最高保護禁止竄改 |
| `games/` | 遊戲原型與獨立模組 | 早期 HTML5/JS 遊戲原型 (BugHunter 等) | P14 | 原型待收整 | 部分邏輯已遷移至 frontend/src/pages/public/，保留作參照 |
| `prototype/` | 互動與功能原型展示 | 早期概念原型、互動展示檔案 | P01, P02 | 原型待收整 | 供設計與互動對照使用，不參與生產構建 |
| `branding/` | 品牌視覺識別資產 | Logo 設計向量圖、字型規格、品牌調色板指南 | P01 | 正式使用 | 官方視覺基準資產 |
| `173003B13/` | 術科試題 104301~104305 原始包 | 勞動部技檢中心官方術科素材、範例圖檔、文字檔案 | P10 | 正式使用 | 核心保護資產（嚴禁更名為台灣美食等非官方題目） |
| `題組一~五答案/` | 官方術科題組參考答案檔 | 104301 至 104305 官方術科標準答案檔與切版樣式 | P10 | 正式使用 | 核心比對資產（嚴禁刪改） |
| `照片/` | 檢定素材圖片庫 | 歷屆術科試題要求之專用圖片檔案 | P10 | 正式使用 | 核心靜態資產 |
| `.agents/` | AI 代理人規則與客製 Skills | 專案專屬 rules (8 個) 與 skills (60+ 個) | P06, P11 | 正式使用 | 規範 Antigravity 與開發生態行為 |
| `graphify-out/` | 知識圖譜分析輸出目錄 | 代碼架構關聯圖譜與維基文件 | 跨階段架構 | 正式使用 | 依賴規則 AST 自動更新 |
| `vendor agent 目錄` | 第三方代理人工作目錄 | 包含 `.adal`, `.aider-desk`, `.claude`, `.devin` 等 50+ 個外部暫存資料夾 | 外部工具暫存 | 廢棄/保留待確認 | 為外部工具產生之暫存目錄，不納入版本控制與生產部署 |

---

## 二、根目錄關鍵檔案清冊

| 檔案相對路徑 | 角色 | 依賴關係 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 是否重複 | 敏感資訊 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AGENTS.md` | 規則文件 | 全專案核心行為準則 | 跨階段架構 | P01-ENG-001 | 正式使用 | 否 | 否 |
| `PROJECT_RULES.md` | 規則文件 | 專案開發、Git 與安全規範 | 跨階段架構 | P01-ENG-002 | 正式使用 | 否 | 否 |
| `DESIGN.md` | 設計系統 | 品牌色系、排版、響應式斷點規範 | P01 | P01-BRD-001 | 正式使用 | 否 | 否 |
| `docker-compose.yml` | 基礎設施 | Docker Engine, PostgreSQL 17 | P04 | P04-INF-001 | 正式使用 | 否 | 否 (使用預設本機設定) |
| `.env.example` | 環境設定 | 系統環境變數範例 | P04 | P04-INF-002 | 正式使用 | 否 | 否 |
| `.gitignore` | 版本控制 | Git 排除設定 | 跨階段架構 | P01-ENG-003 | 正式使用 | 否 | 否 |
| `skills-lock.json` | 依賴鎖定 | Agent Skills 鎖定清單 | P06 | P06-MCP-001 | 正式使用 | 否 | 否 |
| `173003B13.7z` | 原始試題壓縮包 | 勞動部技檢中心官方發布封存包 | P10 | P10-PRC-001 | 正式使用 | 否 | 否 |
| `題組二_五.7z` | 試題壓縮包 | 官方題組 2~5 備用資產包 | P10 | P10-PRC-002 | 正式使用 | 與解壓縮目錄內容重複，供備份用 | 否 |
| `碼上學品牌識別展示板.png` | 視覺資產 | 品牌 CI 展示看板圖檔 | P01 | P01-BRD-002 | 正式使用 | 否 | 否 |
| `計劃書.pdf` / `計劃書.docx` | 專案競賽計畫 | 新北市自主學習競賽申報計畫書 | 跨階段企劃 | P01-BRD-003 | 正式使用 | 格式雙軌 (docx/pdf) | 否 |

---

## 三、後端檔案清冊 (`backend/src/`, `backend/prisma/`, `backend/tests/`)

### 1. 後端架構與進入點 (`backend/src/`)

| 檔案相對路徑 | 角色 | 依賴關係 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 敏感資訊 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/src/server.ts` | 後端伺服器啟動 | `app.ts`, `env.ts`, `database.ts` | P04 | P04-INF-003 | 正式使用 | 否 |
| `backend/src/app.ts` | Express 應用裝配 | 路由、中介軟體、CSRF、錯誤處理 | P04 | P04-INF-004 | 正式使用 | 否 |
| `backend/src/config/env.ts` | 環境變數安全驗證 | `zod` | P04 | P04-INF-005 | 正式使用 | 否 (僅定義 Schema) |
| `backend/src/config/database.ts` | Prisma Client 實例與連線池 | `@prisma/client`, `env.ts` | P04 | P04-DB-001 | 正式使用 | 否 |
| `backend/src/config/db-validation.ts`| 資料庫隔離驗證防護 | `database.ts` (AUTH-03 守門員) | P04 | P04-DB-002 | 正式使用 | 否 |
| `backend/src/middleware/authenticate.ts`| JWT 身份驗證中介軟體 | `tokens.ts`, `errors.ts` | P05 | P05-SEC-001 | 正式使用 | 否 |
| `backend/src/middleware/authorize.ts`   | RBAC 角色授權中介軟體 | `errors.ts` | P05 | P05-SEC-002 | 正式使用 | 否 |
| `backend/src/middleware/csrf.ts`        | 雙重 Cookie CSRF 防禦 | `tokens.ts`, `errors.ts` | P05 | P05-SEC-003 | 正式使用 | 否 |
| `backend/src/middleware/error-handler.ts`| 全域錯誤捕捉與遮罩 | `errors.ts`, `redaction.ts` | P05 | P05-SEC-004 | 正式使用 | 否 |
| `backend/src/middleware/rate-limiter.ts`| 請求速率限流保護 | `express-rate-limit` | P05 | P05-SEC-005 | 正式使用 | 否 |
| `backend/src/middleware/validate.ts`    | Zod 請求本體/參數驗證器 | `zod`, `errors.ts` | P05 | P05-SEC-006 | 正式使用 | 否 |

### 2. 後端商業邏輯模組 (`backend/src/modules/`)

| 檔案相對路徑 | 角色 | 職責與對應 API 路由 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 敏感資訊 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/src/modules/auth/auth.controller.ts` | 控制器 | 註冊、登入、登出、驗證、密碼重設 | P07 | P07-USR-001 | 正式使用 | 否 |
| `backend/src/modules/auth/auth.service.ts`    | 服務層 | 使用者密碼雜湊、Token 簽發、註冊邏輯 | P07 | P07-USR-002 | 正式使用 | 否 |
| `backend/src/modules/auth/auth.routes.ts`     | 路由定義 | `/api/auth/*` 路由映射 | P07 | P07-USR-003 | 正式使用 | 否 |
| `backend/src/modules/auth/auth.schema.ts`     | 驗證綱要 | 登入/註冊/重設密碼之 Zod 規格 | P07 | P07-USR-004 | 正式使用 | 否 |
| `backend/src/modules/teachers/teacher.controller.ts` | 控制器 | 教師資格申請提交、申請進度查詢 | P08 | P08-TCH-001 | 正式使用 | 否 |
| `backend/src/modules/teachers/teacher.service.ts`    | 服務層 | 教師申請查核、資格資料儲存 | P08 | P08-TCH-002 | 正式使用 | 否 |
| `backend/src/modules/teachers/teacher.routes.ts`     | 路由定義 | `/api/teachers/*` 路由映射 | P08 | P08-TCH-003 | 正式使用 | 否 |
| `backend/src/modules/teachers/teacher.schema.ts`     | 驗證綱要 | 教師申請表單 Zod 驗證規格 | P08 | P08-TCH-004 | 正式使用 | 否 |
| `backend/src/modules/admin/admin.controller.ts` | 控制器 | 管理員審核教師、日誌查詢 | P16 | P16-ADM-001 | 正式使用 | 否 |
| `backend/src/modules/admin/admin.service.ts`    | 服務層 | 申請審核核准/駁回、審計日誌寫入 | P16 | P16-ADM-002 | 正式使用 | 否 |
| `backend/src/modules/admin/admin.routes.ts`     | 路由定義 | `/api/admin/*` 路由映射 | P16 | P16-ADM-003 | 正式使用 | 否 |
| `backend/src/modules/admin/admin.schema.ts`     | 驗證綱要 | 審核操作與分頁查詢 Zod 規格 | P16 | P16-ADM-004 | 正式使用 | 否 |
| `backend/src/modules/classrooms/classroom.controller.ts` | 控制器 | 班級建立、加入、成員管理、退出 | P08 | P08-CLS-001 | 正式使用 | 否 |
| `backend/src/modules/classrooms/classroom.service.ts`    | 服務層 | 邀請碼校驗、成員歸屬檢查、班級隔離 | P08 | P08-CLS-002 | 正式使用 | 否 |
| `backend/src/modules/classrooms/classroom.routes.ts`     | 路由定義 | `/api/classrooms/*` 路由映射 | P08 | P08-CLS-003 | 正式使用 | 否 |
| `backend/src/modules/classrooms/classroom.schema.ts`     | 驗證綱要 | 班級建立與加入代碼 Zod 規格 | P08 | P08-CLS-004 | 正式使用 | 否 |

### 3. 後端工具與服務 (`backend/src/services/`, `backend/src/utils/`)

| 檔案相對路徑 | 角色 | 職責描述 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 敏感資訊 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/src/services/email.provider.ts` | 電子郵件發送器 | Resend / SMTP / 模擬發信驅動 | P07 | P07-EML-001 | 正式使用 (本機為 Mock) | 否 |
| `backend/src/services/email.templates.ts`| 信件範本庫 | 驗證信、重設密碼信、審核通知信 | P07 | P07-EML-002 | 正式使用 | 否 |
| `backend/src/services/emailQueueService.ts`| 信件非同步佇列 | 記憶體非同步重試佇列機制 | P07 | P07-EML-003 | 正式使用 | 否 |
| `backend/src/utils/audit.ts`      | 審計日誌記錄器 | 操作軌跡與系統日誌輸出 | P16 | P16-AUD-001 | 正式使用 | 否 |
| `backend/src/utils/errors.ts`     | 自訂例外類別 | AppError、NotFoundError、AuthError | P05 | P05-ERR-001 | 正式使用 | 否 |
| `backend/src/utils/joinCode.ts`   | 班級代碼產生器 | 6 碼高熵不可預測隨機碼產生 | P08 | P08-CLS-005 | 正式使用 | 否 |
| `backend/src/utils/ownership.ts`  | 物件所有權查核 | IDOR 越權防護驗證器 | P05 | P05-SEC-007 | 正式使用 | 否 |
| `backend/src/utils/password.ts`   | 密碼雜湊工具 | bcrypt 安全鹽值雜湊 | P05 | P05-SEC-008 | 正式使用 | 否 |
| `backend/src/utils/redaction.ts`  | 敏感資料脫敏器 | 日誌與錯誤訊息個資去識別化 | P05 | P05-SEC-009 | 正式使用 | 否 |
| `backend/src/utils/tokens.ts`     | Token 簽章工具 | JWT 與 CSRF Token 簽發與校驗 | P05 | P05-SEC-010 | 正式使用 | 否 |

### 4. 資料庫定義與測試 (`backend/prisma/`, `backend/tests/`)

| 檔案相對路徑 | 角色 | 職責描述 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 敏感資訊 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/prisma/schema.prisma` | ORM 綱要 | 33 個實體模型、1 個列舉型別、關聯與索引 | P04 | P04-DB-003 | 正式使用 | 否 |
| `backend/prisma/seed.ts`       | 資料庫種子檔 | 預設管理員、初始角色、測試題目資料 | P04 | P04-DB-004 | 正式使用 | 否 (預設開發密碼) |
| `backend/prisma/migrations/*`  | 遷移歷程 | 20261103000000_init, 20261108000000_add_business_models | P04 | P04-DB-005 | 正式使用 | 否 |
| `backend/tests/*.test.ts` (17支) | 離線單元測試 | 認證、授權、RBAC、CSRF、IDOR、驗證等 221 個測試案例 | P19 | P19-TST-001 | 正式使用 | 否 |
| `backend/tests/*.db.test.ts` (2支)| 資料庫整合測試 | 連線池、即時資料庫讀寫測試（預設隔離略過） | P19 | P19-TST-002 | 隔離待命 | 否 |

---

## 四、前端檔案清冊 (`frontend/src/`)

### 1. 前端頁面層 (27 個頁面，劃分五層架構)

| 頁面檔案路徑 | 頁面名稱 / 路由 Key | 網站架構層次 | 主要歸屬階段 | 主要歸屬 UID | 狀態 | 說明與依賴 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `pages/public/HomePage.tsx` | 首頁 (`home`) | L1 訪客層 | P02 | P02-WEB-001 | 正式使用 | 整合 Hero, FinalCTA, 品牌故事 |
| `pages/public/LegalNoticePage.tsx` | 法律規範 (`legal`) | L1 訪客層 | P02 | P02-WEB-002 | 正式使用 | 服務條款、隱私權政策與版權說明 |
| `pages/public/CertificationsPage.tsx` | 認證總覽 (`certifications`) | L1 訪客層 | P02 | P02-WEB-003 | 正式使用 | 檢定科目導覽、歷屆考情分析 |
| `pages/public/CertificationDetailPage.tsx`| 認證細節 (`certification-detail`) | L1 訪客層 | P02 | P02-WEB-004 | 正式使用 | 網頁設計丙級詳細試題大綱 |
| `pages/public/WebDesignCDemoPage.tsx`| 題組展示 (`web-design-c-demo`)| L1 訪客層 | P02 | P02-WEB-005 | 正式使用 | 104301~104305 切版實機展示 |
| `pages/public/AICoachPage.tsx` | AI 家教 (`ai-coach`) | L1 訪客層 | P11 | P11-AI-001 | 正式使用 | 標記為【展示版/原型模擬】 |
| `pages/public/StudentDashboardPage.tsx`| 學生儀表板 (`student-dashboard`)| L2 學生學習層| P03 | P03-STD-001 | 正式使用 | 個人儀表板、雷達圖、學習待辦 |
| `pages/public/TheoryPracticePage.tsx`| 學科題庫 (`theory-practice`) | L2 學生學習層| P09 | P09-THY-001 | 正式使用 | 17300 網頁設計丙級學科 674 題刷題 |
| `pages/public/MockExamPage.tsx` | 模擬測驗 (`mock-exam`) | L2 學生學習層| P09 | P09-EXM-001 | 正式使用 | 80 題 100 分倒數計時模擬考 |
| `pages/public/PracticalLearningPage.tsx`| 術科學習舊版 (`practical-learning`)| L2 學生學習層| P10 | P10-PRC-003 | 正式使用 | 題組一至五步進教學（已整併新路由引流）|
| `pages/public/CodeEditorPage.tsx` | 雲端程式碼編輯器 (`code-editor`)| L2 學生學習層| P12 | P12-IDE-001 | 正式使用 | HTML/CSS/JS 即時沙盒編輯器 |
| `pages/public/LearningProgressPage.tsx`| 學習進度與報表 (`learning-progress`)| L2 學生學習層| P03 | P03-STD-002 | 正式使用 | 本機進度統計、錯題本、歷史成績 |
| `pages/public/GameCenterPage.tsx` | 遊戲學習中心 (`game-center`) | L2 學生學習層| P14 | P14-GAM-001 | 正式使用 | 五大遊戲關卡大廳入口 |
| `pages/public/CodePuzzlePage.tsx` | 程式拼圖遊戲 (`code-puzzle`) | L2 學生學習層| P14 | P14-GAM-002 | 正式使用 | HTML 結構語意拖曳拼圖遊戲 |
| `pages/public/CSSDesignerPage.tsx` | CSS 樣式大師 (`css-designer`) | L2 學生學習層| P14 | P14-GAM-003 | 正式使用 | Flexbox/Grid 視覺化版面解題遊戲 |
| `pages/public/BugHunterPage.tsx` | 除錯獵人遊戲 (`bug-hunter`) | L2 學生學習層| P14 | P14-GAM-004 | 正式使用 | 語法錯誤抓漏挑戰遊戲 |
| `pages/public/QuizRushPage.tsx` | 競速問答遊戲 (`quiz-rush`) | L2 學生學習層| P14 | P14-GAM-005 | 正式使用 | 60 秒限時學科快速搶答遊戲 |
| `pages/public/WebBuilderPage.tsx` | 網頁冒險家 (`web-builder`) | L2 學生學習層| P14 | P14-GAM-006 | 正式使用 | 術科題型積木式闖關組合遊戲 |
| `pages/public/QuestionBankImportSystemPage.tsx`| 題庫匯入 (`question-bank-import`)| L2/L4 雙用 | P09 | P09-IMP-001 | 正式使用 | JSON/Excel/CSV 題目檢驗匯入器 |
| `pages/student/practical/StudentPracticalHubPage.tsx`| 術科學習大廳 (`practical-hub`)| L2 學生學習層| P10 | P10-PRC-004 | 正式使用 | 現代化 5 大題組切入核心 |
| `pages/student/practical/PracticalHomePage.tsx`| 題組總覽首頁 (`practical-home`)| L2 學生學習層| P10 | P10-PRC-005 | 正式使用 | 題組卡片、考點地圖 |
| `pages/student/practical/PracticalDetailPage.tsx`| 題組細節說明 (`practical-detail`)| L2 學生學習層| P10 | P10-PRC-006 | 正式使用 | 題目規格說明與評分規準手冊 |
| `pages/student/practical/PracticalLessonPage.tsx`| 步進式單元學習 (`practical-lesson`)| L2 學生學習層| P10 | P10-PRC-007 | 正式使用 | Step-by-step 代碼教學與驗收 |
| `pages/student/practical/PracticalSandboxPage.tsx`| 題組專用沙盒 (`practical-sandbox`)| L2 學生學習層| P10 | P10-PRC-008 | 正式使用 | 雙欄即時切版與即時檢核環境 |
| `pages/public/TeacherDashboardPage.tsx`| 教師儀表板 (`teacher-dashboard`)| L3 教師教學層| P08 | P08-TCH-005 | 正式使用 | 班級管理、作業指派、學生進度檢視 |
| `pages/public/AdminDashboardPage.tsx`| 平台管理後台 (`admin-dashboard`)| L4 平台管理層| P16 | P16-ADM-005 | 正式使用 | 平台維運、教師審核、題庫監控 |
| `pages/system-ops/SystemOpsDashboardPage.tsx`| 系統營運監控 (`system-ops`)| L5 系統營運層| P16 | P16-OPS-001 | 正式使用 | 伺服器健康度、資料庫延遲、審計日誌 |

### 2. 前端核心組件與上下文 (`frontend/src/components/`, `frontend/src/context/`)

| 檔案相對路徑 | 角色 | 職責描述 | 主要歸屬階段 | 主要歸屬 UID | 狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `frontend/src/context/NavigationContext.tsx`| 導覽上下文 | 全站 27 個頁面路徑註冊、麵包屑、頁面切換 | P02 | P02-NAV-001 | 正式使用 |
| `frontend/src/context/AuthContext.tsx`      | 認證上下文 | 登入狀態、角色切換、LocalStorage 與 API 雙模 | P07 | P07-CTX-001 | 正式使用 |
| `frontend/src/components/Navbar.tsx`        | 頂部導航列 | 5 層權限選單、通知鈴鐺、頭像與身分標記 | P02 | P02-NAV-002 | 正式使用 |
| `frontend/src/components/Footer.tsx`        | 頁尾區域   | 品牌標語、版權宣告、四聯絡信箱、功能連結 | P02 | P02-NAV-003 | 正式使用 |
| `frontend/src/components/AuthModal.tsx`     | 登入註冊彈窗| 登入、註冊、忘記密碼雙向驗證表單 | P07 | P07-UI-001 | 正式使用 |
| `frontend/src/components/TeacherApplyModal.tsx`| 教師申請彈窗| 提出教師身分審核表單 | P08 | P08-UI-001 | 正式使用 |
| `frontend/src/components/StudentClassJoinModal.tsx`| 學生加入班級| 輸入 6 碼代碼加入班級彈窗 | P08 | P08-UI-002 | 正式使用 |
| `frontend/src/components/NotificationCenterModal.tsx`| 通知中心彈窗| 系統公告、班級作業、成就通知 | P03 | P03-UI-001 | 正式使用 |
| `frontend/src/components/FeedbackModal.tsx` | 使用者回饋  | 意見反映與錯誤回報收集器 | P03 | P03-UI-002 | 正式使用 |
| `frontend/src/components/GameBriefingModal.tsx`| 遊戲任務簡報| 進入遊戲前的關卡說明與星級目標 | P14 | P14-UI-001 | 正式使用 |
| `frontend/src/components/GameAchievementsModal.tsx`| 成就展示彈窗| 解鎖徽章與歷程統計 | P14 | P14-UI-002 | 正式使用 |

### 3. 前端工具類別 (`frontend/src/utils/`)

| 檔案相對路徑 | 角色 | 職責與資料儲存 Key | 主要歸屬階段 | 主要歸屬 UID | 狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `learningStorage.ts`          | 儲存工具 | 學生學習歷程、進度儲存 (`code_to_know_learning_progress`) | P03 | P03-UTL-001 | 正式使用 (Local) |
| `mockExamStorage.ts`          | 儲存工具 | 模擬考試歷史記錄與題卷狀態 | P09 | P09-UTL-001 | 正式使用 (Local) |
| `wrongQuestionsStorage.ts`    | 儲存工具 | 錯題本儲存與重練機制 | P09 | P09-UTL-002 | 正式使用 (Local) |
| `gameStorage.ts`              | 儲存工具 | 五大遊戲通關星級與積分資料 | P14 | P14-UTL-001 | 正式使用 (Local) |
| `gameAchievementEngine.ts`    | 引擎工具 | 遊戲成就判定與徽章核發計算 | P14 | P14-UTL-002 | 正式使用 |
| `teacherGameTaskManager.ts`   | 管理工具 | 教師遊戲作業指派與資料隔離 (`code_to_know_teacher_game_tasks`) | P14 | P14-GAM-014 | 原型待雲端接軌 |
| `adminGameConfigManager.ts`   | 設定工具 | 管理員全域遊戲關卡設定與開關 (`code_to_know_admin_game_configs`) | P14 | P14-GAM-015 | 原型待雲端接軌 |
| `aiFallbackEngine.ts`         | 引擎工具 | 離線狀態下學術科 AI 擬真輔助生成器 | P11 | P11-AI-002 | 正式使用 (展示版) |
| `aiSafetyFilter.ts`           | 安全過濾 | AI 提示詞敏感詞與教育規範防護網 | P11 | P11-AI-003 | 正式使用 |
| `practicalSandboxEngine.ts`   | 引擎工具 | 術科沙盒程式碼執行與即時預覽防護 | P10 | P10-IDE-001 | 正式使用 |
| `quizRushEngine.ts`           | 遊戲引擎 | 60秒競速問答倒數與計分邏輯 | P14 | P14-GAM-007 | 正式使用 |
| `dailyQuestEngine.ts`         | 任務引擎 | 每日任務生成與獎勵判定計算 | P03 | P03-UTL-002 | 正式使用 |
| `studentStudyToolsStorage.ts` | 儲存工具 | 學生筆記、書籤與學習工具暫存 | P03 | P03-UTL-003 | 正式使用 (Local) |
| `notificationStorage.ts`      | 儲存工具 | 通知訊息已讀與儲存狀態管理 | P03 | P03-UTL-004 | 正式使用 (Local) |
| `feedbackStorage.ts`          | 儲存工具 | 本機反饋儲存與匯出器 | P03 | P03-UTL-005 | 正式使用 (Local) |
| `codeLintRuleEngine.ts`       | 檢核引擎 | 學生術科 HTML/CSS 語法規則檢查器 | P12 | P12-IDE-002 | 正式使用 |
| `learningTelemetry.ts`        | 遙測工具 | 學習行為停留時間與事件軌跡記錄 | P03 | P03-UTL-006 | 正式使用 |
| `marketingUtils.ts`           | 行銷工具 | SEO Meta Tag 與社群分享輔助工具 | P18 | P18-MKT-001 | 正式使用 |
| `useScrollReveal.ts`          | 動畫 Hook | 視窗滾動淡入動畫控制 | P01 | P01-UI-001 | 正式使用 |

---

## 五、各目錄狀態分類總結與遷移重構建議

1. **正式使用目錄 (Production Ready / Active)**:
   - `backend/src/`, `backend/prisma/`, `backend/tests/` (結構高度模組化，型別完整，620 測試全數綠燈通過)。
   - `frontend/src/` (具備完整 27 頁面、元件與 19 個功能引擎)。
   - `docs/` (正式規格手冊與進度稽核報告)。
   - `database/`, `scripts/`, `data/`。

2. **原型收整與遷移評估目錄 (Refactor / Merge Candidate)**:
   - `games/`: 舊版原型的邏輯（如 BugHunter、CodePuzzle）均已成功重構成 React 組件置於 `frontend/src/pages/public/`。建議未來可標記為歷史參照存檔，避免混淆。
   - `prototype/`: 舊版靜態切版展示頁面，生產環境已由 `frontend/src/pages/public/WebDesignCDemoPage.tsx` 承接。
   - `frontend/src/pages/public/` 與 `frontend/src/pages/student/practical/`: 目前有 21 個頁面扁平置於 public，建議未來正式遷移至 5 層架構對應的子目錄 (`pages/public/`, `pages/student/`, `pages/teacher/`, `pages/platform-admin/`, `pages/system-ops/`)。

3. **第三方與暫存目錄 (Third-party & Stale Directories)**:
   - 根目錄下 50+ 個以小數點開頭的外部代理人臨時目錄（如 `.adal`, `.aider-desk`, `.codeartsdoer` 等）為歷史多代理人工具所產生，皆已在 `.gitignore` 排除，絕不包含正式專案程式碼與 Secrets。
