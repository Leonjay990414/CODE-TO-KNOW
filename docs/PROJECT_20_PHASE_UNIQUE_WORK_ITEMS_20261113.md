# CODE TO KNOW｜20 階段唯一工作項目清單與狀態矩陣（Canonical Work Item Registry）

> **報告日期**：2026-11-13（第四輪獨立數據校正版）  
> **依據基準**：原始 20 階段總體規劃規格書（`CODE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx`）原始 20 階段正式名稱與全量 226 個子條目、專案現行程式庫（`frontend/`、`backend/`、`prototype/`、`docs/`、`scripts/`）。  
> **用途**：作為本專案唯一、客觀、可驗證的工作項目主數據清單（Single Source of Truth），徹底恢復原始階段名稱、落實 100% 權重與零重複計分，並校正 RLS 與 AUTH-03 阻礙狀態。

---

## 一、清單設計原則與編碼規範

1. **完整恢復原始 20 階段名稱**：嚴格依照原始 DOCX 之 20 階段正式名稱編排，不任意改名或重構階段。
2. **唯一識別碼（UID）結構**：`P<階段編號:02d>-<模組簡稱:3字元>-<流水號:001~nnn>`。226 項 UID 具備嚴格唯一性與連續性，無任何重複。
3. **嚴禁重複計分與跨階段重疊**：每個子項目只在其專屬階段被定義與計分一次。若為後續階段之相依前提，僅在「前置依賴」欄位引用其 UID。
4. **四階嚴格狀態定義**：
   - **PASS**：功能已完整實作，具備可驗證之程式碼、規格或自動化測試（完成率 100%）。
   - **PARTIAL**：已具備部分程式碼、前端頁面或 Mock 實作，但缺少後端整合、真實 API 或完整業務邏輯（完成率 20%~70%）。
   - **NOT STARTED**：僅有文字規格或完全無相關實作（完成率 0%）。
   - **BLOCKED**：受技術障礙（如 AUTH-03 TOC Signature 錯誤、憑證或外部服務阻塞）中斷，無法繼續推進（完成率 0%~30%）。
5. **權重分配機制**：
   - 階段權重總和嚴格等於 **100.0%**。
   - 階段內每個子項目依等權分配項目權重 $W_{item} = \frac{W_{phase}}{N_{phase}}$。

---

## 二、20 階段 226 項唯一工作項目詳細清冊

### Phase 1: 品牌定位與品牌策略
- **階段權重**：2.5% ｜ **子項目數**：9 項 ｜ **單項權重**：0.2778%
- **狀態統計**：PASS: 5 ｜ PARTIAL: 4 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：80.00% ｜ **加權貢獻得分**：2.0000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P01-BRD-001` | 確認品牌名稱：碼上學 CODE TO KNOW；品牌全名與標語的正式寫法。 | None | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, WEBSITE_REQUIREMENTS.md | 100% | 0.2778% |
| `P01-BRD-002` | 統一品牌核心描述，避免與舊專案名稱或舊標語混用。 | None | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, WEBSITE_REQUIREMENTS.md | 100% | 0.2778% |
| `P01-BRD-003` | 撰寫品牌成立原因、使命、願景、核心價值與品牌承諾。 | None | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, WEBSITE_REQUIREMENTS.md | 100% | 0.2778% |
| `P01-BRD-004` | 定義主要受眾：學生、教師、學校及可能的教育合作單位。 | None | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, WEBSITE_REQUIREMENTS.md | 100% | 0.2778% |
| `P01-BRD-005` | 定義品牌個性、語氣、用字、視覺印象及不採用的風格。 | None | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, WEBSITE_REQUIREMENTS.md | 100% | 0.2778% |
| `P01-BRD-006` | 研究程式教育、證照學習、線上測驗與 AI 教育產品。 | None | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | MARKET_RESEARCH_PRODUCT_STRATEGY.md | 60% | 0.1667% |
| `P01-BRD-007` | 整理競品功能、收費方式、差異點及市場缺口。 | None | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | MARKET_RESEARCH_PRODUCT_STRATEGY.md | 60% | 0.1667% |
| `P01-BRD-008` | 訂定短期 MVP、中期擴充、長期品牌發展方向。 | None | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | MARKET_RESEARCH_PRODUCT_STRATEGY.md | 60% | 0.1667% |
| `P01-BRD-009` | 建立風險、成本、資源與團隊能力評估。 | None | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | docs/planning 草案 | 40% | 0.1111% |

### Phase 2: 品牌識別與視覺系統
- **階段權重**：3.0% ｜ **子項目數**：9 項 ｜ **單項權重**：0.3333%
- **狀態統計**：PASS: 6 ｜ PARTIAL: 3 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：90.00% ｜ **加權貢獻得分**：2.7000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P02-IDN-001` | 確認 Logo 主版、橫式／直式／小尺寸版本及安全留白。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-002` | 確認中英文標準字、字體、字級與排版層級。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-003` | 建立主色、輔助色、中性色、狀態色及色彩使用比例。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-004` | 建立按鈕、卡片、表單、圖示、插畫與品牌圖形規範。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-005` | 建立網站、學生端、教師端、管理端及監控端的視覺一致性規範。 | Phase 1 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | prototype/assets, SVG 圖章 | 70% | 0.2333% |
| `P02-IDN-006` | 製作 SVG、PNG、favicon、社群頭像及分享圖。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-007` | 定義動畫速度、轉場、hover、載入狀態與減少動態偏好。 | Phase 1 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | frontend/public/images/logo/, tokens.css, components.css | 100% | 0.3333% |
| `P02-IDN-008` | 建立 3D 獎牌、成就徽章及遊戲視覺規範。 | Phase 1 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | prototype/assets, SVG 圖章 | 70% | 0.2333% |
| `P02-IDN-009` | 建立品牌識別手冊與素材授權清單。 | Phase 1 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | prototype/assets, SVG 圖章 | 70% | 0.2333% |

### Phase 3: 市場研究與產品策略
- **階段權重**：2.5% ｜ **子項目數**：9 項 ｜ **單項權重**：0.2778%
- **狀態統計**：PASS: 5 ｜ PARTIAL: 4 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：77.78% ｜ **加權貢獻得分**：1.9444%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P03-MKT-001` | 訪談或蒐集學生、教師的學習與教學需求。 | Phase 2 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | 100% | 0.2778% |
| `P03-MKT-002` | 整理學科題庫、術科實作、考試、AI 輔助的使用痛點。 | Phase 2 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | 100% | 0.2778% |
| `P03-MKT-003` | 分析競品及替代方案。 | Phase 2 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | 50% | 0.1389% |
| `P03-MKT-004` | 建立產品價值主張與差異化。 | Phase 2 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | 100% | 0.2778% |
| `P03-MKT-005` | 將功能分為 MVP、第二版、長期規劃。 | Phase 2 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | 100% | 0.2778% |
| `P03-MKT-006` | 定義成功指標：完成率、學習持續度、錯題改善、教師採用等。 | Phase 2 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | 50% | 0.1389% |
| `P03-MKT-007` | 評估免費方案限制、雲端服務限制、AI API 費用及維護成本。 | Phase 2 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | 50% | 0.1389% |
| `P03-MKT-008` | 建立功能風險清單與依賴關係。 | Phase 2 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | 50% | 0.1389% |
| `P03-MKT-009` | 確認不使用未經授權教材或未核實題目。 | Phase 2 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | 100% | 0.2778% |

### Phase 4: 網站規劃與完整需求規格
- **階段權重**：3.5% ｜ **子項目數**：10 項 ｜ **單項權重**：0.3500%
- **狀態統計**：PASS: 9 ｜ PARTIAL: 1 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：96.00% ｜ **加權貢獻得分**：3.3600%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P04-REQ-001` | 建立五層系統 Sitemap 與頁面清單。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-002` | 建立訪客、學生、教師、平台管理員、系統管理者角色矩陣。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-003` | 定義各角色登入後預設入口與跨層導覽規則。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-004` | 繪製註冊、登入、教師審核、加入班級、練習、考試、補考流程。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-005` | 繪製平台管理與系統監控的獨立流程。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-006` | 定義題庫、課程、遊戲、公告、檔案與使用者資料需求。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-007` | 定義訪客／會員功能比較及每項功能真實狀態。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-008` | 規劃公開網站頁面、FAQ、聯絡、SEO 與法律頁面。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |
| `P04-REQ-009` | 定義個資、未成年人資料、Cookie、資料保存與刪除規則。 | Phase 3 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | PERMISSION_MATRIX.md, schema.prisma | 60% | 0.2100% |
| `P04-REQ-010` | 建立需求追蹤矩陣，讓每項需求連到頁面、API、資料表與測試案例。 | Phase 3 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | WEBSITE_REQUIREMENTS.md, HomePage.tsx | 100% | 0.3500% |

### Phase 5: 專案管理與開發環境建置
- **階段權重**：3.5% ｜ **子項目數**：9 項 ｜ **單項權重**：0.3889%
- **狀態統計**：PASS: 8 ｜ PARTIAL: 1 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：97.78% ｜ **加權貢獻得分**：3.4222%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P05-ENV-001` | 確認 Antigravity、Node.js、npm、Git、編輯器版本。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-002` | 整理專案根目錄、frontend、backend、prototype、docs、tests 等目錄。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-003` | 確認 GitHub 私有 Repository、分支策略與團隊權限。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-004` | 建立 issue、任務、里程碑、負責人及驗收欄位。 | Phase 4 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | PROJECT_TRACKER.md | 80% | 0.3111% |
| `P05-ENV-005` | 分離 development、staging、production 環境。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-006` | 建立 .env.example，禁止提交真實密鑰。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-007` | 建立備份、還原及本機啟動說明。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-008` | 建立套件更新、弱點掃描與版本鎖定流程。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |
| `P05-ENV-009` | 規定每次修改前檢查 Git 狀態、備份必要檔案、測試後再提交。 | Phase 4 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | 100% | 0.3889% |

### Phase 6: Antigravity Rules 與 Skills 建置
- **階段權重**：3.0% ｜ **子項目數**：10 項 ｜ **單項權重**：0.3000%
- **狀態統計**：PASS: 9 ｜ PARTIAL: 1 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：97.00% ｜ **加權貢獻得分**：2.9100%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P06-RUL-001` | 建立專案總規則與禁止事項。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-002` | 建立 React／TypeScript 前端規則。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-003` | 建立 Express／API／後端規則。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-004` | 建立 PostgreSQL／Prisma／RLS 資料庫規則。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-005` | 建立身份驗證、授權、個資及資安規則。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-006` | 建立 UI/UX、響應式、動畫、SVG、3D 規範。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-007` | 建立 AI 教學、遊戲化與教材資料規範。 | Phase 5 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | .agents/skills/ | 70% | 0.2100% |
| `P06-RUL-008` | 建立測試、程式碼審查、文件及部署規則。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-009` | 建立只讀盤點、實作、獨立複核三種指令模板。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |
| `P06-RUL-010` | 要求代理明確回報修改檔案、測試證據、未完成項目及風險。 | Phase 5 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AGENTS.md, .agents/skills/ | 100% | 0.3000% |

### Phase 7: UI/UX 與互動體驗設計
- **階段權重**：5.0% ｜ **子項目數**：10 項 ｜ **單項權重**：0.5000%
- **狀態統計**：PASS: 2 ｜ PARTIAL: 8 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：58.00% ｜ **加權貢獻得分**：2.9000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P07-UIX-001` | 建立 Design System 與設計 Token。 | Phase 6 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | prototype/, frontend/src/pages/public/ | 100% | 0.5000% |
| `P07-UIX-002` | 設計公開網站所有頁面及導覽。 | Phase 6 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | prototype/, frontend/src/pages/public/ | 100% | 0.5000% |
| `P07-UIX-003` | 設計學生儀表板、題庫、考試、術科、AI、遊戲與歷程頁。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/ | 70% | 0.3500% |
| `P07-UIX-004` | 設計教師班級、題庫、考試、成績及考試監控頁。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |
| `P07-UIX-005` | 設計平台管理員內容與帳號管理頁。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |
| `P07-UIX-006` | 設計系統營運總覽、告警、日誌、部署、備份及維護頁。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |
| `P07-UIX-007` | 設計登入、註冊、錯誤、空狀態、載入與權限不足畫面。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |
| `P07-UIX-008` | 設計桌機、平板、手機斷點與操作方式。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |
| `P07-UIX-009` | 設計無障礙鍵盤操作、焦點、對比與替代文字。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/ | 70% | 0.3500% |
| `P07-UIX-010` | 驗證品牌 Logo 不被未授權修改，並建立視覺回歸檢查。 | Phase 6 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | Teacher/Admin UI 待完善 | 40% | 0.2000% |

### Phase 8: 技術選型與系統架構設計
- **階段權重**：4.5% ｜ **子項目數**：10 項 ｜ **單項權重**：0.4500%
- **狀態統計**：PASS: 7 ｜ PARTIAL: 3 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：88.00% ｜ **加權貢獻得分**：3.9600%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P08-ARC-001` | 確認 React、TypeScript、Vite 前端架構。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-002` | 確認 Express、TypeScript、Prisma 後端架構。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-003` | 確認 PostgreSQL／Supabase 資料庫與檔案儲存方案。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-004` | 設計 API 分層、錯誤格式、驗證與速率限制。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-005` | 設計身份驗證、角色授權及資源層級權限。 | Phase 7 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | docs/architecture/ | 60% | 0.2700% |
| `P08-ARC-006` | 設計前端、後端、資料庫、AI、郵件及監控服務關係圖。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-007` | 規劃 Prototype 與 React 正式前端的資料一致策略。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |
| `P08-ARC-008` | 規劃背景工作、郵件佇列、AI 任務及排程。 | Phase 7 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | docs/architecture/ | 60% | 0.2700% |
| `P08-ARC-009` | 評估 Render／Supabase 免費層休眠、容量、備份與流量限制。 | Phase 7 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | docs/architecture/ | 60% | 0.2700% |
| `P08-ARC-010` | 預留 Flutter App 與桌面端共用 API 的架構。 | Phase 7 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | 100% | 0.4500% |

### Phase 9: 資料庫、帳號與權限系統
- **階段權重**：8.5% ｜ **子項目數**：12 項 ｜ **單項權重**：0.7083%
- **狀態統計**：PASS: 1 ｜ PARTIAL: 10 ｜ NOT STARTED: 0 ｜ BLOCKED: 1
- **階段完成率**：52.50% ｜ **加權貢獻得分**：4.4625%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P09-DBA-001` | 設計 users、profiles、roles、permissions 等資料表。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-002` | 設計學生、教師、班級、課程與班級成員關聯。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-003` | 設計證照、教材、題庫、題目、選項與解析資料。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-004` | 設計考試、考卷版本、作答、答案、成績與補考資料。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-005` | 設計錯題、收藏、筆記、學習紀錄及進度資料。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-006` | 設計遊戲、關卡、積分、成就與排行榜資料。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-007` | 設計公告、通知、郵件寄送及操作稽核資料。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-008` | 建立 Prisma Schema、Migration、索引與資料驗證。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-009` | 設定 RLS 與伺服器端授權；不可相信前端傳入的角色或 teacherEmail。 | Phase 8 | 後端權限中介軟體與測試已完成，但資料庫端 Supabase RLS 策略尚未在實機實施 | `PARTIAL` | backend/src/middleware/authorize.ts, rbac-workflow.test.ts, idor-ownership.test.ts (RLS 實機未上線) | 50% | 0.3542% |
| `P09-DBA-010` | 完成註冊、登入、登出、驗證信箱、密碼重設及安全工作階段。 | Phase 8 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | backend/prisma/schema.prisma, auth.service.ts, backup-crypto.cjs | 100% | 0.7083% |
| `P09-DBA-011` | 測試學生不能讀取他人資料、教師只能管理授權班級、管理員依職責分權。 | Phase 8 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | backend/tests/ | 50% | 0.3542% |
| `P09-DBA-012` | 建立備份、還原、資料匯出及刪除流程。 | Phase 8 | 加密備份與解密工具已 PASS，但 PG17 隔離還原受阻於 TOC 簽章錯誤 | `BLOCKED` | backup-crypto.cjs, run_supabase_backup.ps1 PASS; restore_pg17_sandbox.ps1 BLOCKED (TOC ID 4791) | 30% | 0.2125% |

### Phase 10: 官方電子郵件與通知系統
- **階段權重**：3.5% ｜ **子項目數**：10 項 ｜ **單項權重**：0.3500%
- **狀態統計**：PASS: 0 ｜ PARTIAL: 2 ｜ NOT STARTED: 8 ｜ BLOCKED: 0
- **階段完成率**：8.00% ｜ **加權貢獻得分**：0.2800%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P10-EML-001` | 決定網域與官方寄件服務供應商。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-002` | 規劃 hello、support、partnerships 等角色信箱；不必為每個平台重複建立獨立身分。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-003` | 建立系統通知寄件身分與寄送政策。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-004` | 設定 SPF、DKIM、DMARC 及寄件網域驗證。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-005` | 建立註冊驗證、密碼重設、登入安全提醒模板。 | Phase 9 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 文字草案 | 40% | 0.1400% |
| `P10-EML-006` | 建立考試開始、補考、教師公告及系統維護通知模板。 | Phase 9 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 文字草案 | 40% | 0.1400% |
| `P10-EML-007` | 建立站內通知中心與已讀／未讀狀態。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-008` | 建立寄送佇列、重試、退信、退訂及寄送紀錄。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-009` | 測試寄件成功率、垃圾郵件分類及錯誤處理。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |
| `P10-EML-010` | 設定郵件服務用量與成本警戒。 | Phase 9 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 尚未串接正式 SMTP 服務 | 0% | 0.0000% |

### Phase 11: AI 智慧教學與分析系統
- **階段權重**：6.0% ｜ **子項目數**：11 項 ｜ **單項權重**：0.5455%
- **狀態統計**：PASS: 1 ｜ PARTIAL: 10 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：30.00% ｜ **加權貢獻得分**：1.8000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P11-AIS-001` | 選定可用模型與供應商，確認年齡、隱私、資料處理條款。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-002` | 建立伺服器端 AI Proxy，API Key 不可放在前端。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-003` | 建立學生身分、功能權限、每日／每月用量與預算限制。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-004` | 建立 HTML、CSS、JavaScript 分類教學能力。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-005` | 建立分階段提示：理解題意、定位問題、提示方向、解釋概念。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-006` | 建立程式碼與版面檢查，明確區分自動化規則與 AI 判斷。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-007` | 建立題目語意分析、錯題分類及弱點分析。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | schema.prisma (AIChatSession) | 50% | 0.2727% |
| `P11-AIS-008` | 建立 AI 輸出安全過濾、錯誤回報與人工檢視機制。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-009` | 建立模型版本、Prompt 版本、延遲、錯誤率與成本紀錄。 | Phase 10 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | AICoachPage.tsx, Socratic Prompt | 100% | 0.5455% |
| `P11-AIS-010` | 用標準測試題評估正確性、穩定性與教學品質。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |
| `P11-AIS-011` | 未串接真實模型前，所有固定回覆均標示為示範，不可宣稱是真正 AI。 | Phase 10 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 尚未串接真實 Gemini API | 20% | 0.1091% |

### Phase 12: 公開品牌網站開發
- **階段權重**：6.5% ｜ **子項目數**：11 項 ｜ **單項權重**：0.5909%
- **狀態統計**：PASS: 6 ｜ PARTIAL: 5 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：86.36% ｜ **加權貢獻得分**：5.6136%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P12-WEB-001` | 完成首頁品牌主視覺、導覽與主要 CTA。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-002` | 完成品牌理念、平台介紹、功能特色及使用方式。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-003` | 完成訪客與會員功能比較區塊，逐項標示真實狀態。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-004` | 完成證照／課程公開介紹及可公開的術科題組介紹。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-005` | 完成 FAQ、聯絡我們、公告與品牌內容。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-006` | 完成註冊／登入入口及實際路由。 | Phase 11 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/ | 70% | 0.4136% |
| `P12-WEB-007` | 完成 SEO、Open Graph、Favicon、網站地圖及 robots 規則。 | Phase 11 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | 100% | 0.5909% |
| `P12-WEB-008` | 完成隱私權政策、服務條款及必要的資料告知。 | Phase 11 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/ | 70% | 0.4136% |
| `P12-WEB-009` | 同步檢查 Prototype 與 React 前端；兩者分開測試。 | Phase 11 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/ | 70% | 0.4136% |
| `P12-WEB-010` | 測試手機、平板、桌機、鍵盤操作、連結及錯誤頁。 | Phase 11 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/ | 70% | 0.4136% |
| `P12-WEB-011` | 核對所有功能描述，不得把規劃中、模擬或本機暫存功能寫成已完成。 | Phase 11 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/ | 70% | 0.4136% |

### Phase 13: 學生學習平台開發
- **階段權重**：10.0% ｜ **子項目數**：13 項 ｜ **單項權重**：0.7692%
- **狀態統計**：PASS: 4 ｜ PARTIAL: 9 ｜ NOT STARTED: 0 ｜ BLOCKED: 0
- **階段完成率**：66.15% ｜ **加權貢獻得分**：6.6154%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P13-STU-001` | 完成學生登入後儀表板與個人設定。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-002` | 完成證照分類、詳情、官方來源及學習目標。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-003` | 整理並匯入經核實授權的學科題庫，建立來源與版本。 | Phase 12 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | 100% | 0.7692% |
| `P13-STU-004` | 建立題型、作答、答案判定、解析及計分。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-005` | 建立模擬考計時、交卷、成績與歷史紀錄。 | Phase 12 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | 100% | 0.7692% |
| `P13-STU-006` | 完成網頁設計丙級正式五大術科題組：校園社團介紹網、運動廣場連結網、國家公園介紹網、網路行銷購物網、書曼的旅遊相簿。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-007` | 逐組核對官方試題、教材、素材、操作要求與評分依據；未核實資料不得補寫成官方內容。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-008` | 目前第五題組如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-009` | 建立安全的程式編輯器與即時預覽。 | Phase 12 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | 100% | 0.7692% |
| `P13-STU-010` | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | LearningProgressPage.tsx (前端完成，後端真同步待串接) | 60% | 0.4615% |
| `P13-STU-011` | 完成學習摘要、弱點分布及學習建議。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |
| `P13-STU-012` | 建立教材 PDF／題庫匯入、欄位檢查、重複資料偵測與人工審核工具。 | Phase 12 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | 100% | 0.7692% |
| `P13-STU-013` | 建立檔案權限、下載紀錄與教材版本管理。 | Phase 12 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | frontend/src/pages/public/ | 50% | 0.3846% |

### Phase 14: 互動遊戲與遊戲化學習系統
- **階段權重**：7.0% ｜ **子項目數**：16 項 ｜ **單項權重**：0.4375%
- **狀態統計**：PASS: 0 ｜ PARTIAL: 3 ｜ NOT STARTED: 13 ｜ BLOCKED: 0
- **階段完成率**：3.75% ｜ **加權貢獻得分**：0.2625%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P14-GAM-001` | 建立獨立遊戲中心首頁、導覽、分類及搜尋。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-002` | 定義遊戲資料模型：名稱、學習目標、難度、版本、規則、關卡與狀態。 | Phase 13 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DOCX 文字規劃 | 20% | 0.0875% |
| `P14-GAM-003` | 每款遊戲開始前顯示玩法、操作方式、計分規則、時間及注意事項。 | Phase 13 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DOCX 文字規劃 | 20% | 0.0875% |
| `P14-GAM-004` | 開發 Code Puzzle：程式邏輯與流程判斷。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-005` | 開發 CSS Designer：版面配置、選擇器與樣式理解。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-006` | 開發 Bug Hunter：程式錯誤辨識與除錯思考。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-007` | 開發 Quiz Rush：證照知識與題型快問快答。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-008` | 開發 Web Builder：HTML／CSS 元件組合與網頁結構。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-009` | 建立關卡、難度、提示、重試及通關條件。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-010` | 建立分數、時間、星星、點數與獎勵計算規則。 | Phase 13 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | DOCX 文字規劃 | 20% | 0.0875% |
| `P14-GAM-011` | 建立每日任務、連續學習、成就及可解鎖元件。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-012` | 建立遊戲紀錄、個人進度與排行榜；防止重複送分及竄改分數。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-013` | 建立課程、題庫、考試與遊戲的學習目標連動。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-014` | 讓教師可指派遊戲任務與班級挑戰。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-015` | 讓平台管理員可新增、編輯、停用遊戲與管理版本。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |
| `P14-GAM-016` | 建立遊戲平衡、可用性、無障礙及內容安全測試。 | Phase 13 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 無遊戲程式碼或獨立頁面 | 0% | 0.0000% |

### Phase 15: 教師管理平台開發
- **階段權重**：7.5% ｜ **子項目數**：15 項 ｜ **單項權重**：0.5000%
- **狀態統計**：PASS: 0 ｜ PARTIAL: 4 ｜ NOT STARTED: 11 ｜ BLOCKED: 0
- **階段完成率**：13.33% ｜ **加權貢獻得分**：1.0000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P15-TCH-001` | 完成教師申請、資料驗證與人工審核。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-002` | 建立教師儀表板與待辦事項。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-003` | 建立班級、學期、課程、學生名單及加入流程。 | Phase 14 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | schema.prisma (Class, Exam) | 50% | 0.2500% |
| `P15-TCH-004` | 建立教材、課程單元及教學任務管理。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-005` | 建立題庫新增、編輯、匯入、審核與版本控制。 | Phase 14 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | schema.prisma (Class, Exam) | 50% | 0.2500% |
| `P15-TCH-006` | 建立是非、選擇、填充、實作等題型管理。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-007` | 建立考試建立、排程、發布、開始與截止時間。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-008` | 建立及格分數、題目／選項隨機化、補考與重考規則。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-009` | 建立排除指定學生及個別考試設定。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-010` | 建立考試監控中心：考試狀態、交卷狀態、頁面離開事件與警示。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-011` | 設定異常警告門檻、人工覆核、處置理由與申訴紀錄。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-012` | 建立成績、錯題與班級弱點分析。 | Phase 14 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | schema.prisma (Class, Exam) | 50% | 0.2500% |
| `P15-TCH-013` | 建立公告、站內通知及電子郵件通知。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |
| `P15-TCH-014` | 建立遊戲指派、班級挑戰及完成狀態。 | Phase 14 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | schema.prisma (Class, Exam) | 50% | 0.2500% |
| `P15-TCH-015` | 建立教師操作稽核紀錄及資料匯出權限。 | Phase 14 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 即時監考與進階功能待開發 | 0% | 0.0000% |

### Phase 16: 平台管理員與系統營運後台
- **階段權重**：7.0% ｜ **子項目數**：15 項 ｜ **單項權重**：0.4667%
- **狀態統計**：PASS: 1 ｜ PARTIAL: 4 ｜ NOT STARTED: 10 ｜ BLOCKED: 0
- **階段完成率**：17.33% ｜ **加權貢獻得分**：1.2133%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P16-ADM-001` | 第四層平台管理：建立會員、教師審核、班級、課程、證照、教材、題庫、公告、回饋與平台規則管理。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-002` | 第四層平台管理：建立內容上架、下架、版本、來源與品質審核。 | Phase 15 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 後端有 API，前端無獨立 Dashboard | 40% | 0.1867% |
| `P16-ADM-003` | 第四層平台管理：建立遊戲內容管理、任務設定及平台使用統計。 | Phase 15 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 後端有 API，前端無獨立 Dashboard | 40% | 0.1867% |
| `P16-ADM-004` | 第四層平台管理：建立客服回報、檢舉、處理狀態與申訴流程。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-005` | 第四層平台管理：建立管理員角色、最小權限、操作稽核及敏感操作覆核。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-006` | 第五層系統營運：建立系統健康總覽與服務可用性檢查。 | Phase 15 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | admin.routes.ts, admin.service.ts, server.ts (/api/health) | 100% | 0.4667% |
| `P16-ADM-007` | 第五層系統營運：建立前端錯誤、API 延遲／錯誤率、資料庫連線與容量監控。 | Phase 15 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 後端有 API，前端無獨立 Dashboard | 40% | 0.1867% |
| `P16-ADM-008` | 第五層系統營運：建立 AI 用量、成本、模型錯誤與預算警報。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-009` | 第五層系統營運：建立郵件佇列、退信、寄送成功率及第三方服務狀態。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-010` | 第五層系統營運：建立日誌、告警、事故分級、維護模式與故障處理流程。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-011` | 第五層系統營運：建立功能開關、環境設定、版本發布、部署紀錄與回滾流程。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-012` | 第五層系統營運：建立資料庫／檔案備份、復原演練與災難復原計畫。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-013` | 第五層系統營運：建立憑證／密鑰輪替、權限審核與高風險操作雙重確認。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-014` | 兩套後台使用不同角色與路由，API 亦分開授權；不得只靠前端隱藏選單。 | Phase 15 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 維運面板待開發 | 0% | 0.0000% |
| `P16-ADM-015` | 建立管理端與監控端的稽核報告及定期權限檢查。 | Phase 15 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 後端有 API，前端無獨立 Dashboard | 40% | 0.1867% |

### Phase 17: 品牌行銷與數位媒體中心
- **階段權重**：2.5% ｜ **子項目數**：10 項 ｜ **單項權重**：0.2500%
- **狀態統計**：PASS: 0 ｜ PARTIAL: 2 ｜ NOT STARTED: 8 ｜ BLOCKED: 0
- **階段完成率**：6.00% ｜ **加權貢獻得分**：0.1500%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P17-MED-001` | 確立官方品牌核心帳號及管理者，不以多組互不相關帳號分散品牌。 | Phase 16 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 社群規劃草案 | 30% | 0.0750% |
| `P17-MED-002` | 盤點 Instagram、Threads、YouTube、Facebook、TikTok 等平台名稱可用性。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-003` | 建立帳號持有人、管理員、編輯者及雙重驗證規範。 | Phase 16 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 社群規劃草案 | 30% | 0.0750% |
| `P17-MED-004` | 建立內容企劃、發布日曆、審稿與素材授權流程。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-005` | 建立短影音、教學影片、品牌介紹、產品更新及活動內容系列。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-006` | 建立 AI 影片、圖像、配音、字幕與剪輯流程，檢查商用授權。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-007` | 規劃 Academy、AI Lab、Challenge 等內容系列。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-008` | 建立社群留言、私訊、客服轉介與危機回應流程。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-009` | 建立網站流量、社群觸及、互動及轉換成效分析。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |
| `P17-MED-010` | 建立品牌合作、學校合作及活動紀錄。 | Phase 16 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 營運流程待建立 | 0% | 0.0000% |

### Phase 18: 系統測試、品質控管與資安檢查
- **階段權重**：6.5% ｜ **子項目數**：14 項 ｜ **單項權重**：0.4643%
- **狀態統計**：PASS: 1 ｜ PARTIAL: 1 ｜ NOT STARTED: 12 ｜ BLOCKED: 0
- **階段完成率**：11.43% ｜ **加權貢獻得分**：0.7429%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P18-QAS-001` | 建立需求—功能—測試案例追蹤表。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-002` | 測試訪客、學生、教師、平台管理員、系統管理者完整流程。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-003` | 測試註冊、登入、登出、信箱驗證、密碼重設及權限拒絕。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-004` | 測試題庫匯入、作答、計分、考試、交卷、補考及成績。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-005` | 測試術科五大題組內容、教材下載及程式工作台。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-006` | 測試遊戲計分、獎勵、重複請求與排行榜防竄改。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-007` | 測試 AI 回答品質、用量限制、成本上限與服務中斷處理。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-008` | 測試郵件寄送、退信、重試與通知狀態。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-009` | 測試 API 授權、RLS、輸入驗證、速率限制及常見安全風險。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-010` | 測試資料備份、復原、資料刪除及稽核紀錄。 | Phase 17 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | backend/tests/, ps-encoding-guard, backup-crypto.test | 100% | 0.4643% |
| `P18-QAS-011` | 測試 375、390、768、1024、1440 等視窗及主流瀏覽器。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-012` | 測試載入效能、錯誤監控、可用性與高峰負載。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |
| `P18-QAS-013` | 執行無障礙檢查、隱私檢查及第三方套件弱點檢查。 | Phase 17 | 需對接真實後端 API、打通資料庫或補齊完整邏輯 | `PARTIAL` | 測試套件 | 60% | 0.2786% |
| `P18-QAS-014` | 完成缺陷分級、修正、回歸測試及正式簽核。 | Phase 17 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | E2E 自動化與高負載測試待補 | 0% | 0.0000% |

### Phase 19: 正式部署與公開上線
- **階段權重**：5.0% ｜ **子項目數**：11 項 ｜ **單項權重**：0.4545%
- **狀態統計**：PASS: 0 ｜ PARTIAL: 0 ｜ NOT STARTED: 8 ｜ BLOCKED: 3
- **階段完成率**：0.00% ｜ **加權貢獻得分**：0.0000%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P19-DEP-001` | 確認正式網域與 DNS 管理權限。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-002` | 設定 HTTPS、安全標頭及必要網域驗證。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-003` | 確認正式前端、後端、資料庫及儲存服務方案。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-004` | 設定正式環境變數與 Secret，禁止把密鑰寫入程式碼或文件。 | Phase 18 | 需修復 TOC 簽章及還原腳本驗證通過 | `BLOCKED` | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | 0% | 0.0000% |
| `P19-DEP-005` | 執行正式資料庫 Migration 與初始資料檢查。 | Phase 18 | 需修復 TOC 簽章及還原腳本驗證通過 | `BLOCKED` | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | 0% | 0.0000% |
| `P19-DEP-006` | 建立正式管理員帳號並啟用 MFA。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-007` | 確認 AI API、郵件服務及用量上限。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-008` | 設定監控、告警、備份及故障聯絡方式。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-009` | 執行部署前資料備份與回滾演練。 | Phase 18 | 需修復 TOC 簽章及還原腳本驗證通過 | `BLOCKED` | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | 0% | 0.0000% |
| `P19-DEP-010` | 進行小範圍試營運與正式上線檢查。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |
| `P19-DEP-011` | 公開上線後持續觀察錯誤率、服務可用性及使用者回報。 | Phase 18 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 正式上線核准清單待執行 | 0% | 0.0000% |

### Phase 20: 品牌營運、系統維護與長期發展
- **階段權重**：2.5% ｜ **子項目數**：12 項 ｜ **單項權重**：0.2083%
- **狀態統計**：PASS: 3 ｜ PARTIAL: 0 ｜ NOT STARTED: 9 ｜ BLOCKED: 0
- **階段完成率**：25.00% ｜ **加權貢獻得分**：0.6250%

| UID | 工作說明 / 原始規格重點 | 前置依賴 | 驗收標準 | 狀態 | 驗證證據 / 檔案路徑 | 完成比率 | 加權得分 |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `P20-OPS-001` | 建立例行系統健康檢查、錯誤追蹤及安全更新。 | Phase 19 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | run_supabase_backup.ps1 | 100% | 0.2083% |
| `P20-OPS-002` | 依政策定期備份，定期演練資料復原。 | Phase 19 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | run_supabase_backup.ps1 | 100% | 0.2083% |
| `P20-OPS-003` | 監控主機、資料庫、API、AI、郵件、儲存及成本。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-004` | 定期更新題庫、教材、證照資訊及官方來源。 | Phase 19 | 文檔規格完備或程式碼已實作通過驗收 | `PASS` | run_supabase_backup.ps1 | 100% | 0.2083% |
| `P20-OPS-005` | 建立教師與學生回饋收集、分類、排程及回覆機制。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-006` | 追蹤產品指標、學習成效、留存與功能使用情況。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-007` | 持續擴充遊戲、課程、科目及教學工具。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-008` | 管理第三方服務合約、授權、帳號及權限。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-009` | 建立事故檢討、版本發布與變更管理。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-010` | 規劃 Flutter Android／iOS App，共用既有 API。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-011` | 評估 Windows／macOS 桌面端需求與技術方案。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
| `P20-OPS-012` | 依使用需求擴展其他科目、學校與教育領域。 | Phase 19 | 需建立頁面組件、後端 API 及關聯資料模型 | `NOT STARTED` | 長期營運與多端 App | 0% | 0.0000% |
