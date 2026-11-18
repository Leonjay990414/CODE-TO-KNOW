# CODE TO KNOW｜全專案 MCP、Rules 與 Skills 盤點清冊 (Master MCP, Rules & Skills Inventory)

版本：MASTER-MCP-RULES-SKILLS-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
受檢檔案：`c:\Users\user\.gemini\config\mcp_config.json`, `.agents/rules/*`, `.agents/skills/*`  
安全原則：禁止未授權開啟付費 GCP API、禁止在報告輸出 Secrets、明確區分 PASS / PARTIAL / BLOCKED 證據。

---

## 一、MCP 伺服器盤點清冊 (14 組 MCP Servers)

依據 `c:\Users\user\.gemini\config\mcp_config.json` 實際註冊之 14 組 MCP 伺服器，嚴格進行連線狀態與權限範圍評估：

| MCP Server 名稱 | 傳輸協定 / 伺服器指令或 URL | 認證類型 | 目前連線狀態 | 驗證證據與限制說明 | 主要歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `google-developer-knowledge` | `https://developerknowledge.googleapis.com/mcp` | `google_credentials` | **PASS (可用)** | 可成功查詢 Google 開發者知識庫與 API 文件，無副作用 | P06 / P06-MCP-002 |
| `cloud-sql` | `https://sqladmin.googleapis.com/mcp` | `google_credentials` | **PARTIAL (受限)** | 唯讀查詢實例狀態可用；禁止執行寫入、備份刪除或執行 DDL | P06 / P06-MCP-003 |
| `datacloud_cloud-sql_remote`| `https://sqladmin.googleapis.com/mcp` | `google_credentials` | **PARTIAL (受限)** | 具備 DataCloud 標頭之代理通道；受限於唯讀操作 | P06 / P06-MCP-004 |
| `datacloud_bigquery_remote` | `https://bigquery.googleapis.com/mcp` | `google_credentials` | **PARTIAL (受限)** | 唯讀查詢資料集與 Schema，禁止觸發大額付費查詢作業 | P06 / P06-MCP-005 |
| `datacloud_gcs_remote` | `https://storage.googleapis.com/storage/mcp` | `google_credentials` | **PARTIAL (受限)** | 唯讀列舉 Bucket，禁止執行刪除或覆寫重要檔案 | P06 / P06-MCP-006 |
| `datacloud_alloydb_remote` | `https://alloydb.googleapis.com/mcp` | `google_credentials` | **BLOCKED (未開通)** | 專案未開通 AlloyDB 實例或叢集，無可用資源 | P06 / P06-MCP-007 |
| `datacloud_dataproc_remote` | `https://dataproc.googleapis.com/mcp` | `google_credentials` | **BLOCKED (未開通)** | 專案未配置 Dataproc 叢集，嚴禁擅自建立付費叢集 | P06 / P06-MCP-008 |
| `datacloud_knowledge_catalog_remote` | `https://dataplex.googleapis.com/mcp` | `google_credentials` | **BLOCKED (未開通)** | Dataplex 知識目錄未綁定專案目錄 | P06 / P06-MCP-009 |
| `datacloud_spanner_remote` | `https://spanner.googleapis.com/mcp` | `google_credentials` | **BLOCKED (未開通)** | 專案無 Spanner 實例，避免巨額運算計費 | P06 / P06-MCP-010 |
| `android-management-api` | `https://androidmanagement.googleapis.com/mcp` | `google_credentials` | **BLOCKED (未授權)** | 需要 Android Enterprise 企業實體授權，本專案不適用 | P06 / P06-MCP-011 |
| `notebooks` | `node .../mcp_proxy_bundle.js notebooks-antigravityide` | 本機 Extension | **PASS (可用)** | 本機 Antigravity IDE 擴充套件驅動之 Notebook 操作通道 | P06 / P06-MCP-012 |
| `data-agent-kit` | `node .../mcp_proxy_bundle.js dataAgentKit-antigravityide` | 本機 Extension | **PASS (可用)** | 本機 DAK 擴充工具管線代理通道 | P06 / P06-MCP-013 |
| `gitlab-orbit` | `npx -y mcp-remote https://gitlab.com/api/v4/orbit/mcp` | 遠端代理 | **BLOCKED (缺 Token)**| 缺少 GitLab 存取 Token，遠端握手失敗 | P06 / P06-MCP-014 |
| `astrocade` | `https://mcp.astrocade.com/mcp` | 遠端代理 | **BLOCKED (無效端點)** | 遠端主機無回應或憑證不符 | P06 / P06-MCP-015 |

---

## 二、專案行為規範盤點清冊 (`.agents/rules/` 共 8 份規則)

專案嚴格由 8 份具體規則檔規範代理人行為，所有檔案均具備最高拘束力：

| 規則檔案名稱 | 完整路徑 | 核心生效情境 | 嚴格禁止事項 | 主要歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- |
| `01-brand-and-ui.md` | `.agents/rules/01-brand-and-ui.md` | 前端樣式、調色板、字型、元件設計 | 禁止隨意引入非標準顏色；香檳金對比度不足不得使用於小字；禁止混淆 5 層架構 | P01 / P01-BRD-004 |
| `02-frontend-development.md` | `.agents/rules/02-frontend-development.md` | 前端 React/Vite 程式碼撰寫與路由註冊 | 禁止跳過 TypeScript 型別檢查；禁止破壞響應式 RWD 斷點；禁止直接操作全域 DOM | P02 / P02-WEB-006 |
| `03-backend-and-api.md` | `.agents/rules/03-backend-and-api.md` | 後端 API 實作、中介軟體、控制器 | 禁止跳過 Zod 驗證；禁止暴露未脫敏日誌；禁止未經驗證的 CORS/CSRF 配置 | P04 / P04-API-001 |
| `04-database-and-security.md`| `.agents/rules/04-database-and-security.md` | 資料庫連線、Prisma 操作、安全驗證 | 嚴禁執行破壞性 DDL/DML；嚴禁在 Runtime 使用 `postgres` 超級使用者；落實 AUTH-03 隔離 | P05 / P05-SEC-013 |
| `05-ai-features.md` | `.agents/rules/05-ai-features.md` | AI 助教、解題提示、模擬引擎 | 嚴禁將未連線之本機原型宣稱為正式雲端 AI；必須具備離線兜底與安全性防護 | P11 / P11-AI-007 |
| `06-testing-and-quality.md` | `.agents/rules/06-testing-and-quality.md` | 單元測試、整合測試、效能稽核 | 嚴禁修改測試以迎合錯誤代碼；整合測試不得依賴外部網路；保持 100% 綠燈 | P19 / P19-TST-003 |
| `07-git-and-collaboration.md`| `.agents/rules/07-git-and-collaboration.md` | Git 版本控制、Commit、分支管理 | 嚴禁 `git push --force`；未獲明確授權嚴禁 Commit/Push/Merge；嚴禁提交 Secrets | P01 / P01-ENG-004 |
| `graphify.md` | `.agents/rules/graphify.md` | 代碼架構檢索與知識圖譜維護 | 修改代碼後必須更新圖譜；架構問題優先查閱知識圖譜而非盲目 grep | 跨階段架構 |

---

## 三、Agent Skills 專屬技能庫盤點清冊

專案 `.agents/skills/` 內建 75 組專業技能，涵蓋系統工程、前端設計、後端架構與教育行銷：

### 1. 核心工程與品質保證類 (Core Engineering & QA)

| Skill 名稱 | 完整路徑 | 觸發條件與功能描述 | 主要歸屬階段與 UID |
| :--- | :--- | :--- | :--- |
| `feature-development` | `.agents/skills/feature-development/SKILL.md` | 規劃、實作、測試新功能時使用 | P01 / P01-ENG-005 |
| `bug-fixing` | `.agents/skills/bug-fixing/SKILL.md` | 重現、診斷、修復軟體缺陷且無回歸時使用 | P19 / P19-QA-001 |
| `release-check` | `.agents/skills/release-check/SKILL.md` | 評估發布就緒狀態、安全檢查與回滾準備時使用 | P20 / P20-REL-001 |
| `supabase-postgres-best-practices` | `.agents/skills/supabase-postgres-best-practices/SKILL.md` | 設計 PostgreSQL Schema、索引優化與連線池時使用 | P04 / P04-DB-006 |
| `vercel-react-best-practices` | `.agents/skills/vercel-react-best-practices/SKILL.md` | React 19 效能優化、Bundle 縮減與組件渲染效能 | P02 / P02-WEB-007 |
| `vercel-composition-patterns` | `.agents/skills/vercel-composition-patterns/SKILL.md` | 複合組件架構、Context 重構與無效 Prop 消除 | P02 / P02-WEB-008 |
| `graphify` | `.agents/skills/graphify/SKILL.md` | 代碼相依性查詢、路徑追蹤與架構關聯分析 | P06 / P06-MCP-016 |

### 2. 前端介面與使用者體驗類 (UI/UX & Design Engineering)

| Skill 名稱 | 完整路徑 | 觸發條件與功能描述 | 主要歸屬階段與 UID |
| :--- | :--- | :--- | :--- |
| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/SKILL.md` | 80 種介面風格、調色板、字型配對與無障礙檢測 | P01 / P01-BRD-005 |
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` | 打造專屬非模板化現代教育平台視覺風格 | P01 / P01-BRD-006 |
| `web-design-guidelines` | `.agents/skills/web-design-guidelines/SKILL.md` | 網頁無障礙 WCAG 2.1 AA 檢測與觸控尺寸優化 | P02 / P02-WEB-009 |
| `emil-design-eng` | `.agents/skills/emil-design-eng/SKILL.md` | 互動微動畫、按鈕按壓回饋與過渡動畫打磨 | P01 / P01-BRD-007 |
| `motion-showreel` | `.agents/skills/motion-showreel/SKILL.md` | 產出展示性動畫程式碼與操作展示 | P17 / P17-MKT-001 |

### 3. 教育行銷、SEO 與推廣類 (Marketing, SEO & Growth)

| Skill 名稱 | 完整路徑 | 觸發條件與功能描述 | 主要歸屬階段與 UID |
| :--- | :--- | :--- | :--- |
| `product-marketing` | `.agents/skills/product-marketing/SKILL.md` | 建立與維護產品定位、受眾輪廓與教育價值觀 | P17 / P17-MKT-002 |
| `ai-seo` | `.agents/skills/ai-seo/SKILL.md` | AEO/GEO 優化、讓 AI 搜尋引擎精準引用專案 | P18 / P18-SEO-001 |
| `seo-audit` | `.agents/skills/seo-audit/SKILL.md` | 網頁 SEO 體檢、Sitemap、Meta Tags 完整性檢驗 | P18 / P18-SEO-002 |
| `analytics` | `.agents/skills/analytics/SKILL.md` | 學習事件追蹤計畫、埋點命名與數據分析規範 | P18 / P18-ANA-001 |
| `conversion-tracking` | `.agents/skills/conversion-tracking/SKILL.md` | 註冊、選課、通關等核心學習轉換事件追蹤 | P18 / P18-ANA-002 |

---

## 四、Skills 重複性與依賴檢核結論

1. **同名技能檢核**：
   - 經檢查，專案目錄中部分資料分析與 BigQuery 技能（如 `bigquery-bigframes`, `dataform-bigquery`, `dbt-bigquery`）在全域與外掛目錄中存在多份副本，但不影響專案工作區本機運行。
2. **本機專屬 Skills 調用穩定性**：
   - 本專案專屬之 `feature-development`, `bug-fixing`, `ui-ux-pro-max`, `graphify` 結構完備，均有明確的 YAML Frontmatter 與詳細執行步驟，完全支援 Antigravity 代理人生態。
