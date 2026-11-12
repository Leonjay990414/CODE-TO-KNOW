# CODE TO KNOW｜Phase 3-C-35：正式資料庫實機驗證總計畫（Master Plan）

- **文件階段**：Phase 3-C-35（純驗證路線圖設計；**未連線 Supabase / PG16 / PG17，未執行 SQL，未取得/解密/還原備份**）
- **建立日期**：2026-11-12
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **前置依據**：[`DATABASE_PHASE3C29_PG17_INTEGRATION_TEST_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C29_PG17_INTEGRATION_TEST_REPORT.md)、[`DATABASE_PHASE3C30_INDEPENDENT_SECURITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C30_INDEPENDENT_SECURITY_AUDIT.md)、Phase 3-C-31 ～ 3-C-34 全系列設計與交叉審查文件。

---

## 一、目前可信任的測試基線表（嚴格區分實測與靜態審查）

> **原則**：絕不將「文件審查」或「靜態程式碼檢查」當成「實機測試結果」。

| 基線類別 | 具體項目與證據來源 | 涵蓋範圍與限制 |
|---|---|---|
| **1. 已完成的本機離線／單元測試** | - [`db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts)、[`database-ssl-config.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/database-ssl-config.test.ts)、`rbac-workflow.test.ts`、`security.test.ts`、`validation.test.ts`、`safe-error-logger.test.ts`、`audit-redaction.test.ts`<br>- `scripts/database/backup-crypto.test.cjs`、`backup-pipeline.test.cjs` | 驗證 URL 白名單、CA 檔 `rejectUnauthorized: true` 與 SAN 模擬、`redaction.ts` 脫敏、C2KB AES-256-GCM 串流加解密邏輯；**未連線真實 Supabase**。 |
| **2. 已完成的 PG17 隔離實機測試** | - [`DATABASE_PHASE3C29_PG17_INTEGRATION_TEST_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C29_PG17_INTEGRATION_TEST_REPORT.md)（`app-runtime.db.test.ts` `3/3` PASS、`integration.db.test.ts` `1/1` PASS）<br>- `Phase 3-C-13` PG17.11 還原庫完整性查核（37 表、47 FK、133 索引） | 僅於本機 Docker `code_to_know_pg17_phase3c18_audit`（Port `5434`, `code_to_know_test`, `c2k_test_app_runtime`）實證 SCRAM、`AuditLog` `42501` 與隔離測試流程；**非 Supabase 託管環境**。 |
| **3. 只有靜態程式碼與文件審查的項目** | - [`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)、[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)（36 業務模型）<br>- [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)（9 個已實作 / 27 個未實作模型）<br>- `Phase 3-C-31`～`3-C-34` 切換與 7 步回滾 SQL 草案 | SQL 順序與權限模型已通過雙輪交叉審查；**尚未在 PG17 Sandbox 全段演練修正版 SQL，亦未在 Supabase 實跑**。 |
| **4. 尚未執行的 Supabase 測試（`NOT TESTED`）** | - Supavisor 自訂角色（`app_runtime.<ref>` / `migration_admin.<ref>`）SCRAM 登入<br>- 遠端 TLS `verify-full` 握手與官方 `prod-ca-2021.crt` 比對<br>- 託管下 `ALTER SCHEMA public OWNER TO migration_admin`、`NOREPLICATION`、`ensure_rls` Event Trigger 相容性<br>- 切換前最新備份取得 | **0 次雲端新角色實測**，必須於未來獲授權後分步驗證。 |
| **5. 尚未執行的 Render 測試（`NOT TESTED`）** | - Render 注入 `app_runtime` `DATABASE_URL` 後之 `/api/health`、Session/CSRF、Auth 與跨區連線穩定度測試 | Render 目前維持未切換狀態，須待區域 A、B 全數通過後始得授權測試。 |

---

## 二、四項 HIGH 阻斷拆分驗證路線圖

### H-01：Supavisor 自訂角色與 TLS（共 8 項獨立測試）

| 編號 | 測試項目 | 區分（本機模擬 vs 真正 Supabase 遠端） | 通過標準 |
|---|---|---|---|
| **H01-1** | 自訂角色登入 | **真正 Supabase 遠端**（建立角色後測 `app_runtime.ypibmyfxfhsyfdwxprpi`、`migration_admin.ypibmyfxfhsyfdwxprpi`） | 回傳預期 `current_user`，無角色路由錯誤 |
| **H01-2** | SCRAM-SHA-256 認證 | 本機 PG17 已測 `c2k_test_app_runtime`；**須真正 Supabase 遠端驗證** | `pg` 驅動與 `psql` 透過 Supavisor 完成 SCRAM 交握 |
| **H01-3** | Session Pooler 連線 | **真正 Supabase 遠端**（`aws-0-ap-southeast-2.pooler.supabase.com:5432`） | `SELECT 1` 與 `pg_advisory_lock` 可用 |
| **H01-4** | TLS `verify-full` | **真正 Supabase 遠端**（連線字串強制 `?sslmode=verify-full`） | TLS 握手成功，無降級 |
| **H01-5** | CA 官方憑證比對 | **真正 Supabase 官方來源**（Dashboard `prod-ca-2021.crt` vs [`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)） | 檔案 SHA-256（`70072358...`）100% 吻合 |
| **H01-6** | Node.js 主機名稱驗證 | 本機離線已模擬 SAN 比對；**須真正 Supabase 遠端驗證** `pg.Pool`（`rejectUnauthorized: true`） | 遠端連線通過；改填錯誤 Host/假 CA 立即拒絕 |
| **H01-7** | 錯誤密碼拒絕 | 本機 PG17 已測 `28P01`；**須真正 Supabase 遠端驗證** | 回傳 `28P01` 且錯誤紀錄無密碼洩漏 |
| **H01-8** | 連線失敗後資源清理 | 本機已測 `try/finally pool.end()`；**須遠端驗證腳本確實釋放連線** | 行程正常結束、無殘留 Session 或明文密碼進 Log |

---

### H-02：Supabase 角色權限與 SQL 執行順序（共 8 項獨立測試）

> **強制規則**：所有 SQL 必須先於 **區域 A（本機 PG17 Sandbox）** 演練通過，並經人工審核後，始得於授權維護時窗進入 **區域 B（Supabase）**。

| 編號 | 測試項目 | 核心驗證內容 |
|---|---|---|
| **H02-1** | 角色建立前置檢查 | 確認 `migration_admin`、`app_runtime` 尚未存在，`public` 表數 = 37。 |
| **H02-2** | 角色屬性確認 | 驗證 `LOGIN`, `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOINHERIT`, `NOREPLICATION` 與預定 `BYPASSRLS` 旗標。 |
| **H02-3** | 物件 Owner 與 Schema Owner 檢查 | 驗證 `postgres` 能否執行業務表/Sequence/View/Type 與 `ALTER SCHEMA public OWNER TO migration_admin`（不碰 `rls_auto_enable`）。 |
| **H02-4** | DML 授權 | 確認在 Owner 轉移**前**同一交易完成 `app_runtime` 對 35 業務表 `SELECT, INSERT, UPDATE, DELETE`、Sequence 僅 `USAGE, SELECT`（無 `UPDATE`）、Type 僅 `USAGE`。 |
| **H02-5** | `AuditLog` Append-only ACL | `app_runtime` 僅 `SELECT, INSERT`；負向實測 `UPDATE`/`DELETE`/`TRUNCATE` 遭 `42501` 拒絕。 |
| **H02-6** | `_prisma_migrations` 零權限 | `app_runtime` 與 `PUBLIC` 均遭 `42501` 拒絕任何存取。 |
| **H02-7** | Default Privileges | 由 **`migration_admin` 親自連線**設定 `ALTER DEFAULT PRIVILEGES IN SCHEMA public` 並查核 `pg_default_acl`。 |
| **H02-8** | 轉移後權限驗證 | 檢查 `pg_auth_members` 為 0 繼承、`app_runtime` `SET ROLE` 遭拒、`migration_admin` `prisma migrate status` 正常。 |

---

### H-03：Supabase Event Trigger（共 6 項獨立測試，嚴禁停用或修改觸發器）

| 編號 | 測試項目 | 驗證方式與預期結果 |
|---|---|---|
| **H03-1** | Event Trigger 現況查詢 | 唯讀查詢 `pg_event_trigger`，確認 `ensure_rls` 狀態、事件與對應函式 `rls_auto_enable`。 |
| **H03-2** | 新增測試資料表後 RLS 狀態檢查 | 以 `migration_admin` 建立暫時性測試表（隨即 `DROP`），查詢 `pg_tables.rowsecurity` 是否自動為 `true`。 |
| **H03-3** | 沒有 Policy 時 Runtime 存取結果 | 確認新表無 Policy 時：`app_runtime`（`BYPASSRLS`）可存取、但 `anon`/`authenticated` 遭預設拒絕。 |
| **H03-4** | `migration_admin` 建表權限 | 確認 `NOSUPERUSER` 身分建表不會因觸發 `rls_auto_enable()` 而發生權限錯誤。 |
| **H03-5** | Default Privileges 是否套用 | 確認 `migration_admin` 新建的測試表自動讓 `app_runtime` 獲得 DML（無須手動再 `GRANT`）。 |
| **H03-6** | Migration 失敗後物件狀態確認 | 模擬/確認遷移回滾後無殘留孤兒測試表或錯誤觸發器狀態。 |

---

### H-04：最新備份與 CA 官方憑證（共 7 項獨立測試，嚴禁把 2026-11-10 備份當成最新備份）

| 編號 | 測試項目 | 驗證要求 |
|---|---|---|
| **H04-1** | 取得最新正式加密備份 | 執行 `run_supabase_backup.ps1` 取得切換當日最新 `.dump` 與 `.c2kb`。 |
| **H04-2** | 計算明文與密文 SHA-256 | 產出並核對最新 `.dump`、`c2kb` 與 `.sha256` 紀錄。 |
| **H04-3** | KeePassXC 金鑰解密驗證 | 使用離線 KeePassXC 金鑰解密 `.c2kb`，驗證 C2KB AES-256-GCM AuthTag 通過。 |
| **H04-4** | 比對解密前後 SHA-256 | 解密還原出的暫存 `.dump` SHA-256 必須與 H04-2 明文 SHA-256 100% 一致（測畢刪除暫存檔）。 |
| **H04-5** | 還原至獨立 PG17 Sandbox | 透過 `restore_pg17_sandbox.ps1` 還原至獨立 PG17 Sandbox。 |
| **H04-6** | 驗證結構與資料完整性 | 核對 37 表、PK、FK、Index、RLS、資料筆數與 `_prisma_migrations` 同步無誤。 |
| **H04-7** | 核對 Supabase 官方 CA 憑證 | 從 Supabase Dashboard 下載 `prod-ca-2021.crt`，比對與 [`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt) 檔案 SHA-256 一致。 |
