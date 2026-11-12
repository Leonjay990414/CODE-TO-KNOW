# CODE TO KNOW｜Phase 3-C-31：Supabase Supavisor 與 TLS 驗證計畫

- **文件階段**：Phase 3-C-31（純驗證計畫設計；**本階段不得連線 Supabase，也不得測試正式密碼**）
- **建立日期**：2026-11-12
- **前置依據**：[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)、[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`database-ssl-config.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/database-ssl-config.test.ts)

---

## 一、驗證目標與基本參數

本計畫旨在於未來獲明確授權之維護時窗內，驗證正式 Supabase Supavisor Pooler 對自建角色 `app_runtime` 與 `migration_admin` 之**連線相容性、SCRAM 認證與 TLS `verify-full` 加密握手**，消除 `Phase 3-C-15` 與 `Phase 3-C-30` 所列之 `HIGH` 阻斷項。

### 1. Session Pooler Host / Port
- **Pooler Host**：`aws-0-ap-southeast-2.pooler.supabase.com`（對應 [`db-validation.ts:19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L19) `APPROVED_PROD_POOLER_HOST`）
- **Port**：`5432`（Session Mode，支援 IPv4 出網、`pg_advisory_lock` 與 Prepared Statements；Migration 嚴格禁用 `6543`）
- **Database Name**：`postgres`（對應 `APPROVED_CLOUD_DB_NAME`）

### 2. PostgreSQL TLS `verify-full`
- 連線字串 Query String 規範統一使用 **`?sslmode=verify-full`**。
- **現況差異備註**：[`db-validation.ts:531-536`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L531-L536) 目前放行 `require`、`verify-full`、`verify-ca`，而 [`database.ts:54-57`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L54-L57) 於 `production` 強制設定 `rejectUnauthorized: true` 與 `ca`。實機測試時必須確認 Node `pg.Pool` 與 `psql` 在 `?sslmode=verify-full` 下皆能順利完成憑證鏈驗證，不會被 `pg-connection-string` 參數解析覆寫。

### 3. 官方 CA 憑證指紋核對
- 本機倉庫存放之官方憑證檔案：[`backend/certs/prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)
- 唯讀 X.509 核對資訊（已於本階段實測讀取檔案）：
  - **Subject / Issuer**：`C=US, ST=Delware, L=New Castle, O=Supabase Inc, CN=Supabase Root 2021 CA`
  - **Validity**：`Apr 28 10:56:53 2021 GMT` ～ `Apr 26 10:56:53 2031 GMT`
  - **SHA-256 Fingerprint**：`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`
- 實測時應比對遠端伺服器呈現之憑證鏈確實由上述 Root CA 簽發（或將之作為唯一信任錨點 `sslrootcert`）。

### 4. 主機名稱驗證（Hostname Verification）
- **Node.js `pg.Pool`**：[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L54-L57) 不得覆寫 `checkServerIdentity` 為 `() => undefined`，維持 Node 原生 RFC 6125 主機名稱比對。
- **驗證項目**：確認遠端憑證 SAN 包含 `*.pooler.supabase.com` 或 `aws-0-ap-southeast-2.pooler.supabase.com`，且使用錯誤主機名或自簽憑證時會被立即拒絕連線。

### 5. 自訂角色登入格式
- **Runtime**：`app_runtime.ypibmyfxfhsyfdwxprpi`
- **Migration**：`migration_admin.ypibmyfxfhsyfdwxprpi`
- 須驗證 Supavisor 多租戶名稱路由是否能正確辨識 `CREATE ROLE` 自建角色，而非僅限原廠 `postgres.ypibmyfxfhsyfdwxprpi`。

### 6. SCRAM 認證
- 驗證新建角色密碼於 PostgreSQL 內儲存為 `scram-sha-256`（確認 `SHOW password_encryption` 與 `pg_authid` 雜湊格式，**不輸出雜湊值本身**）。
- 驗證 `psql`（libpq）與 Node `pg` 驅動程式透過 Supavisor 進行 SCRAM-SHA-256 交握皆可通過。

---

## 二、實機測試案例矩陣（未來授權後執行）

### 7. 正確與錯誤密碼測試

| 測試編號 | 測試目標 | 預期結果 | 失敗意義 |
|---|---|---|---|
| **SUP-01** | `app_runtime.ypibmyfxfhsyfdwxprpi` + 正確密碼 + `verify-full` + CA 檔 | **PASS**：成功建立連線並回傳 `current_user = 'app_runtime'` | Supavisor 不支援自建 `LOGIN` 角色或 CA/主機名不相符 |
| **SUP-02** | `migration_admin.ypibmyfxfhsyfdwxprpi` + 正確密碼 + `verify-full` + CA 檔 | **PASS**：成功建立連線並回傳 `current_user = 'migration_admin'` | 同上 |
| **SUP-03** | `app_runtime.ypibmyfxfhsyfdwxprpi` + **故意錯誤密碼** | **PASS（預期拒絕）**：回傳認證失敗（`28P01`），且無密碼外洩 | 認證設定異常或帳號未鎖密 |
| **SUP-04** | 使用不符之假 CA 憑證連線 `aws-0-ap-southeast-2.pooler.supabase.com:5432` | **PASS（預期拒絕）**：TLS 握手失敗中斷 | `rejectUnauthorized` 未生效 |
| **SUP-05** | `app_runtime` 執行 `SELECT` 業務表、`INSERT/UPDATE AuditLog`、`SELECT _prisma_migrations`、`CREATE TABLE` | 業務表成功；`AuditLog UPDATE` / `_prisma_migrations` / `CREATE TABLE` 皆遭 **`42501` 拒絕** | 權限矩陣未生效或殘留 `PUBLIC` 權限 |

---

## 三、安全防護與維運紀律

### 8. 連線失敗時的安全處理
- 任何連線或認證失敗，必須遵守 [`redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts) 與 [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 的遮罩規範，**絕不在錯誤訊息、Console、HTTP 回應或稽核紀錄輸出密碼、Query String 或完整連線字串**。
- 在切換驗證階段，Render 正式服務尚未更換 `DATABASE_URL`，若 SUP-01～SUP-05 任一項失敗，正式網站可維持零中斷並直接啟動 7 步受控回滾。

### 9. 密碼不進入 Log、文件或命令歷史
- **禁止**在 Shell 命令列直接傳入含密碼之 `postgresql://...` 連線字串（避免寫入 PowerShell `ConsoleHost_history.txt` 或 Bash `.bash_history`）。
- 建議作法：使用 `PGPASSFILE`（權限嚴格限制僅當前使用者可讀，用畢立即安全刪除）或互動式密碼輸入 / 暫時性處理程序環境變數（且不寫入 `.env` 與 Git 檔案）。
- 任何報告與文件僅記錄脫敏格式（如 `postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:***@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=verify-full`）。

### 10. 正式環境驗證所需授權與停止條件（Stop Conditions）

- **必要授權條件**：
  1. 使用者明確書面授權執行「切換前最新正式加密備份」。
  2. 使用者明確書面授權於維護時窗執行「正式 Supabase 角色建立與權限切換」。
  3. 使用者明確提供/核准新角色強密碼存放於安全密碼庫之作業流程。
- **立即停止條件（觸發任一項即中止並回滾）**：
  - Supavisor 拒絕 `app_runtime.<ref>` 或 `migration_admin.<ref>` 登入。
  - `postgres` 無法執行 `ALTER SCHEMA public OWNER TO migration_admin`。
  - TLS `verify-full` 與 `prod-supabase-ca.crt` 握手失敗。
  - `app_runtime` 對 `AuditLog` `UPDATE/DELETE` 或 `_prisma_migrations` `SELECT` 未遭 `42501` 拒絕。
  - `migration_admin` 執行沙盒式遷移檢查時因 `rls_auto_enable` 失敗。
