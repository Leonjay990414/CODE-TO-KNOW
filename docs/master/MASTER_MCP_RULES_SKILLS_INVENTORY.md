# CODE TO KNOW｜第 0 波・第一批：全專案 MCP、Rules 與 Skills 清冊
# (MASTER_MCP_RULES_SKILLS_INVENTORY.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-MCP-RULES-SKILLS  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**盤點範圍**：`c:\Users\user\.gemini\config\mcp_config.json`, `.agents/rules/*`, `.agents/skills/*`。

---

## 1. MCP 伺服器完整規格與連線清冊 (Section H 審查)

依據 `c:\Users\user\.gemini\config\mcp_config.json` 實際註冊之 14 組 MCP 伺服器進行盤點（絕不輸出任何 Secrets 或私密金鑰）：

| MCP Server 名稱 | 實際用途 | 設定檔與指令/路徑 | 支援工具數量與代表工具 | 讀取/寫入能力 | 外部認證要求 | 測試紀錄與目前狀態 | 所屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `google-developer-knowledge` | 查詢 Google 開發者知識庫 | `https://developerknowledge.googleapis.com/mcp` | 3 tools (`search_documents`, `answer_query`, `get_documents`) | 唯讀 (Read-only) | `google_credentials` | **PASS (可用)**：可查詢文檔與 API 規範 | P06 / P06-MCP-002 |
| `notebooks` | IDE 內部互動筆記本操作 | 本機 Extension bundle: `notebooks-antigravityide` | 8 tools (`read_cell`, `insert_cell`, `execute_cell` 等) | 讀寫 (Read/Write) | 本機延伸模組 | **PASS (可用)**：IDE 原生支援 | P06 / P06-MCP-012 |
| `data-agent-kit` | Google Cloud 資料代理工具箱 | 本機 Extension bundle: `dataAgentKit-antigravityide` | 多項 DAK 輔助工具 | 唯讀/操作 | 本機延伸模組 | **PASS (可用)**：本機指令碼調用成功 | P06 / P06-MCP-013 |
| `cloud-sql` | Cloud SQL 實例檢視 | `https://sqladmin.googleapis.com/mcp` | 15 tools (`list_instances`, `get_instance` 等) | 受限唯讀 | `google_credentials` | **PARTIAL (受限)**：僅可查詢實例狀態，禁執行 DDL | P06 / P06-MCP-003 |
| `datacloud_cloud-sql_remote`| 遠端 Cloud SQL 代理通道 | `https://sqladmin.googleapis.com/mcp` | 15 tools | 受限唯讀 | `google_credentials` | **PARTIAL (受限)**：受限於唯讀查詢 | P06 / P06-MCP-004 |
| `datacloud_bigquery_remote` | BigQuery 資料集檢視 | `https://bigquery.googleapis.com/mcp` | 9 tools (`list_dataset_ids`, `get_dataset_info` 等) | 唯讀查詢 | `google_credentials` | **PARTIAL (受限)**：禁執行付費 Query Job | P06 / P06-MCP-005 |
| `datacloud_gcs_remote` | Google Cloud Storage 檢視 | `https://storage.googleapis.com/storage/mcp` | 10 tools (`list_buckets`, `get_bucket_metadata` 等) | 唯讀檢視 | `google_credentials` | **PARTIAL (受限)**：禁止刪除或覆寫桶內檔案 | P06 / P06-MCP-006 |
| `datacloud_alloydb_remote` | AlloyDB 叢集管理 | `https://alloydb.googleapis.com/mcp` | 17 tools | 未開通 | `google_credentials` | **BLOCKED**：無 AlloyDB 實例，避免付費計費 | P06 / P06-MCP-007 |
| `datacloud_dataproc_remote` | Dataproc 叢集與 Spark 批次 | `https://dataproc.googleapis.com/mcp` | 17 tools | 未開通 | `google_credentials` | **BLOCKED**：專案無 Dataproc 叢集，嚴禁建立 | P06 / P06-MCP-008 |
| `datacloud_knowledge_catalog_remote` | Dataplex 知識目錄 | `https://dataplex.googleapis.com/mcp` | 13 tools | 未開通 | `google_credentials` | **BLOCKED**：目錄未綁定專案資源 | P06 / P06-MCP-009 |
| `datacloud_spanner_remote` | Cloud Spanner 分散式資料庫 | `https://spanner.googleapis.com/mcp` | 15 tools | 未開通 | `google_credentials` | **BLOCKED**：專案無 Spanner 實例，禁止啟用 | P06 / P06-MCP-010 |
| `android-management-api` | Android 企業裝置管理 | `https://androidmanagement.googleapis.com/mcp` | 9 tools | 未授權 | `google_credentials` | **BLOCKED**：需要 Enterprise 授權，專案不適用 | P06 / P06-MCP-011 |
| `gitlab-orbit` | GitLab 遠端倉庫代理 | `npx -y mcp-remote .../orbit/mcp` | 未知 | 未連線 | GitLab Token | **BLOCKED**：缺少存取 Token，遠端握手失敗 | P06 / P06-MCP-014 |
| `astrocade` | Astrocade 外部代理 | `https://mcp.astrocade.com/mcp` | 未知 | 無回應 | API Key | **BLOCKED**：遠端端點無回應，禁止連線 | P06 / P06-MCP-015 |

---

## 2. 專案行為規範清冊 (`.agents/rules/` 共 8 份)

| 規則檔名 | 檔案路徑 | 生效情境與規範範圍 | 嚴格禁止行為 | 所屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- |
| `01-brand-and-ui.md` | `.agents/rules/01-brand-and-ui.md` | 前端視覺樣式、調色板、字型、排版設計 | 禁止使用低對比金色；小字禁止使用低於 4.5:1 對比度；禁止破壞五層架構 | P01 / P01-BRD-004 |
| `02-frontend-development.md` | `.agents/rules/02-frontend-development.md` | React/Vite 程式碼撰寫、路由註冊、組件開發 | 禁止略過 TypeScript 型別檢查；禁止破壞 320px~1920px 響應式斷點 | P02 / P02-WEB-006 |
| `03-backend-and-api.md` | `.agents/rules/03-backend-and-api.md` | Express API 實作、控制器、中介軟體 | 禁止略過 Zod 驗證；禁止外洩未脫敏日誌；禁止未經簽章的 CSRF 變更 | P04 / P04-API-001 |
| `04-database-and-security.md`| `.agents/rules/04-database-and-security.md` | 資料庫連線、Prisma 操作、安全存取 | 嚴禁執行破壞性 DDL/DML；嚴禁在 Runtime 使用 `postgres` 超級使用者；嚴守 AUTH-03 | P05 / P05-SEC-013 |
| `05-ai-features.md` | `.agents/rules/05-ai-features.md` | AI 助教、解題提示、模擬引擎 | 嚴禁將未連線之本機原型宣稱為正式雲端 AI；必須具備離線兜底與安全過濾 | P11 / P11-AI-007 |
| `06-testing-and-quality.md` | `.agents/rules/06-testing-and-quality.md` | 單元測試、整合測試、品質檢驗 | 嚴禁修改測試以迎合錯誤代碼；整合測試不得依賴外部網路；保持 100% 綠燈 | P19 / P19-TST-003 |
| `07-git-and-collaboration.md`| `.agents/rules/07-git-and-collaboration.md` | Git 版本控制、Commit、分支合併 | 嚴禁 `git push --force`；未獲授權嚴禁 Commit/Push/Merge；嚴禁提交 Secrets | P01 / P01-ENG-005 |
| `graphify.md` | `.agents/rules/graphify.md` | 代碼架構檢索與知識圖譜維護 | 修改代碼後必須更新知識圖譜；架構問題優先查閱圖譜而非盲目 grep | 跨階段架構 |

---

## 3. 專案 Skills 技能庫總覽 (`.agents/skills/` 75 組)

- **核心工程類** (8 組)：`feature-development`, `bug-fixing`, `release-check`, `graphify`, `supabase-postgres-best-practices`, `vercel-react-best-practices`, `vercel-composition-patterns`, `managing-python-dependencies`。
- **介面與前端設計類** (7 組)：`ui-ux-pro-max`, `frontend-design`, `web-design-guidelines`, `web-design-engineer`, `emil-design-eng`, `design-taste-frontend`, `impeccable`。
- **教育行銷與增長類** (15 組)：`product-marketing`, `ai-seo`, `seo-audit`, `analytics`, `conversion-tracking`, `content-strategy`, `marketing-ideas`, `marketing-plan`, `marketing-psychology`, `copywriting`, `lead-magnets`, `launch`, `onboarding`, `cro`, `ab-testing`。
- **多媒體與動效類** (4 組)：`motion-showreel`, `video`, `image`, `gpt-image-2`。
- **其餘專業技能** (41 組)：涵蓋 PR、客戶研究、社群運營、反向工程等專案輔助模組。
