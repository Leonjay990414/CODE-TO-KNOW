# CODE TO KNOW — Phase 3-C-35 AUTH-02 資料庫密碼相依性唯讀檢查報告

- **文件階段**：Phase 3-C-35（AUTH-02 連線失敗衍生之唯讀相依性稽核）
- **檢查日期**：2026-11-12
- **執行性質**：100% 唯讀檢查（未讀取任何 `.env`、Secrets、KeePassXC；未連線 Supabase 或 Render；未修改任何程式碼、設定或資料庫）
- **背景原因**：AUTH-02 執行正式備份連線 `aws-0-ap-southeast-2.pooler.supabase.com:5432` 時，連續兩次出現 `FATAL: password authentication failed for user "postgres"`。本報告盤點若需重設 Supabase `postgres` 資料庫密碼時，對 CODE TO KNOW 各環境與服務的影響範圍。

---

## 1. 資料庫連線架構

依據專案實際程式碼與架構決策文件（`backend/src/config/database.ts`、`backend/src/config/db-validation.ts`、`backend/prisma.config.ts`、`docs/DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md`）：

| 用途 / 模組 | 連線驗證 / 設定程式 | 核准端點與連接埠 | 允許之角色 | TLS / CA 驗證 |
| --- | --- | --- | --- | --- |
| **Backend Express API (Production Runtime)** | `backend/src/config/database.ts` (`createDatabasePool`) + `db-validation.ts` (`validateCloudRuntimeDatabaseUrl`) | `aws-0-ap-southeast-2.pooler.supabase.com`（Port `5432` Session Pooler 或 `6543` Transaction Pooler）或 `db.ypibmyfxfhsyfdwxprpi.supabase.co` | 僅允許 **`app_runtime`**（嚴格阻斷 `postgres` 與 `migration_admin`） | 強制 SSL (`rejectUnauthorized: true`)，讀取 `prod-supabase-ca.crt` 或 `SUPABASE_CA_CERT_PATH` |
| **Prisma CLI / Migration (`production` 或 `MIGRATION_ENV=cloud`)** | `backend/prisma.config.ts` + `db-validation.ts` (`resolveDatasourceUrl` / `validateMigrationDatabaseUrl`) | `aws-0-ap-southeast-2.pooler.supabase.com:5432`（Session Pooler）或 `db.ypibmyfxfhsyfdwxprpi.supabase.co:5432`（IPv6 環境）；**禁止 Port `6543`** | 允許 **`migration_admin`** 或 **`postgres`**（禁止 `app_runtime`） | 依連線字串 TLS 參數 |
| **正式資料庫唯讀邏輯備份** | `scripts/database/run_supabase_backup.ps1` | `aws-0-ap-southeast-2.pooler.supabase.com:5432`（Session Pooler，IPv4 相容） | **`postgres.ypibmyfxfhsyfdwxprpi`** | `PGSSLMODE=verify-full`，`PGSSLROOTCERT=/certs/supabase-root.crt` |
| **本機開發 / 測試環境** | `backend/src/config/database.ts`、`backend/tests/*.db.test.ts` | 本機 PostgreSQL（如 PG16 / PG17 Sandbox） | 本機測試角色（與 Supabase 正式密碼無關） | 本機設定 |

> **Direct Connection vs Session Pooler 說明**：
> - `db.ypibmyfxfhsyfdwxprpi.supabase.co` 在 Supabase 免費方案僅提供 IPv6 解析，多數本機 IPv4 環境與 IPv4 託管環境無法直連。
> - 因此，本機備份腳本與雲端 Runtime/Migration 實務上皆以 **Session Pooler**（`aws-0-ap-southeast-2.pooler.supabase.com:5432`）作為主要 IPv4 相容端點，且使用者名稱須帶 Project Reference 後綴（`<role>.ypibmyfxfhsyfdwxprpi`）。

---

## 2. 使用的環境變數名稱（僅列名稱，不列任何值）

### 2.1 Backend Runtime 與環境驗證（`backend/src/config/env.ts`、`backend/src/config/database.ts`）
- `NODE_ENV`
- `DATABASE_URL`
- `SUPABASE_CA_CERT_PATH`（選填，未設定時預設尋找 `prod-supabase-ca.crt`）

### 2.2 Prisma Migration / CLI（`backend/prisma.config.ts`、`backend/src/config/db-validation.ts`）
- `MIGRATION_ENV`
- `DIRECT_URL`
- `MIGRATION_DATABASE_URL`
- `DATABASE_URL`（僅非 `production` 且非 `MIGRATION_ENV=cloud` 時作為 fallback）

### 2.3 範本與本機測試環境（`.env.example`、`backend/.env.example`、`backend/tests/`）
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`
- `TEST_DATABASE_URL`
- `TEST_APP_RUNTIME_URL`

### 2.4 Supabase 備份腳本（`scripts/database/run_supabase_backup.ps1`）
- 容器內傳遞：`PGUSER`、`PGPASSWORD`（由主機互動式 `Read-Host -AsSecureString` 經 stdin 傳入，不寫入命令列參數或磁碟）、`PGSSLMODE`、`PGSSLROOTCERT`
- 本機加密金鑰：`BACKUP_ENCRYPTION_KEY`（AES-256-GCM 備份加密金鑰，**與 Supabase `postgres` 資料庫密碼完全獨立**）

---

## 3. 可能受密碼重設影響的服務清單

若在 Supabase Dashboard 重設 **`postgres`** 角色密碼，各服務與環境受影響評估如下：

| 服務 / 元件 | 是否受 `postgres` 密碼重設影響 | 原因說明 |
| --- | --- | --- |
| **Supabase Dashboard / 既有備份腳本 (`run_supabase_backup.ps1`)** | **直接影響（受惠/需同步更新）** | 腳本以 `postgres.ypibmyfxfhsyfdwxprpi` 連線 `aws-0-ap-southeast-2.pooler.supabase.com:5432`，重設後須同步更新 KeePassXC 紀錄並於執行時輸入新密碼。 |
| **本地端 `.env`（若曾設定 `DIRECT_URL` / `MIGRATION_DATABASE_URL` 使用 `postgres`）** | **可能影響** | 若開發者本機曾以 `postgres` 角色設定 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL` 連線雲端，重設後該連線字串會失效，須同步更新（但不得使用於一般開發）。 |
| **Supabase Supavisor Pooler 認證快取** | **短暫影響（數秒至數十秒）** | 重設密碼後，Supavisor 可能需要短時間同步新憑證；既有以 `postgres` 建立的閒置連線若存在會失效或需重連。 |
| **未來將建立的 `app_runtime` / `migration_admin` 角色** | **不受影響** | 獨立 PostgreSQL 角色各有獨立密碼，不共用 `postgres` 密碼（且目前尚未於 Supabase 正式環境建立）。 |
| **Backend Production Runtime（透過 `app_runtime`）** | **不受影響** | `db-validation.ts` 已在程式碼層強制阻斷 `production` 使用 `postgres` 作為 `DATABASE_URL`，未來上線僅使用 `app_runtime`。 |
| **本機 PG16 / PG17 Docker Sandbox** | **不受影響** | 完全隔離於本機 Docker，使用 `.env.example` / 本機設定之獨立密碼。 |
| **既有的 `.c2kb` AES-256-GCM 加密備份檔** | **不受影響** | 加密備份使用 `BACKUP_ENCRYPTION_KEY`，與資料庫登入密碼無關。 |

---

## 4. Render 正式環境影響評估

依據專案文件與現有儲存庫檔案檢查結果：

1. **目前不存在 `render.yaml`**：專案根目錄與子目錄中均無 `render.yaml` 部署設定檔。
2. **Render 目前尚未正式上線（`NO-GO` 狀態）**：
   - `docs/architecture/DEPLOYMENT_OPERATIONS_ARCHITECTURE.md` 明確標示為「架構規劃」，僅將 Render 列為後端託管候選方案。
   - `docs/DATABASE_PHASE3C35_FINAL_READINESS_REPORT.md` 明確紀錄：「正式環境角色建立、權限切換與 Render 上線：維持 `NO-GO（嚴格阻斷）`」。
3. **程式碼保護機制**：
   - `backend/src/config/db-validation.ts` 的 `validateCloudRuntimeDatabaseUrl` 明確禁止 `production` 環境的 `DATABASE_URL` 使用 `postgres` 角色，只允許 `app_runtime`。
4. **結論**：
   - 若 Render 尚未建立服務或尚未配置任何連線字串，重設 Supabase `postgres` 密碼**對 Render 無任何現有運作中斷風險**。
   - 惟一例外狀況：若人員先前曾在 Render Dashboard 手動建立過測試服務並於環境變數 `DATABASE_URL`、`DIRECT_URL` 或 `MIGRATION_DATABASE_URL` 填入舊的 `postgres` 密碼，則重設前應先在 Render Dashboard 確認該環境變數是否存在；若有使用 `postgres`，須於重設後同步更新或改為未來切換後的 `app_runtime` / `migration_admin`。

---

## 5. 備份腳本相依性

檢查 `scripts/database/run_supabase_backup.ps1`：

- **端點與 Port**：`aws-0-ap-southeast-2.pooler.supabase.com:5432`（Session Pooler）。
- **使用者名稱格式**：腳本組合為 `postgres.$ProjectRef`，即 `postgres.ypibmyfxfhsyfdwxprpi`，完全符合 Supabase Session Pooler 官方格式。
- **TLS 驗證**：`PGSSLMODE=verify-full` 與 `/certs/supabase-root.crt`（已驗證 CA SHA-256 一致）。
- **密碼傳遞方式**：主機透過 `Read-Host -AsSecureString` 讀取後轉為 UTF-8 經 Stdin 傳入 Docker 容器內部的 `PGPASSWORD`，不透過環境變數檔案或命令列明文傳遞，亦不進行 URL encoding（`PGPASSWORD` 由 libpq 直接讀取原始密碼字串）。
- **相依結論**：備份腳本本身無格式錯誤或硬編碼密碼問題，直接相依於 Supabase 正式資料庫中 **`postgres`** 角色的實際有效密碼。一旦於 Supabase Dashboard 更新 `postgres` 密碼並於 KeePassXC 同步更新，即可立即重新執行 AUTH-02。

---

## 6. 建議的安全密碼更新順序

若使用者決定重設 Supabase `postgres` 資料庫密碼，建議依下列順序執行以確保零遺漏與安全性：

1. **事前盤點（人工確認 Dashboard）**：
   - 登入 Render Dashboard（若已建立任何預備/測試服務），確認環境變數 `DATABASE_URL`、`DIRECT_URL`、`MIGRATION_DATABASE_URL` 是否存在以及目前是否已停用或未使用 `postgres`。
   - 確認本機未保留以 `postgres` 連向雲端的常駐背景程式。
2. **於 KeePassXC 預先產生高強度新密碼**：
   - 建議使用高熵隨機密碼（避免可能影響舊版 shell/工具解析的極端跳脫字元，建議以大小寫英數與安全符號如 `-_!@#%^&*` 為主，並先記錄於 KeePassXC 條目備份舊紀錄）。
3. **於 Supabase Dashboard 更新 `postgres` 密碼**：
   - 至 `code-to-know-prod` (`ypibmyfxfhsyfdwxprpi`) Project Settings → Database → Reset Database Password，套用新密碼並儲存。
   - 等待約 30–60 秒讓 Supavisor Pooler 同步憑證。
4. **同步更新外部受影響處（若有）**：
   - 若 Render 或本機暫存環境變數中有任何使用 `postgres` 的 `DIRECT_URL` / `MIGRATION_DATABASE_URL`，同步更新之（注意：切勿將 `.env` 或新密碼提交至 Git）。
5. **重新執行 AUTH-02 唯讀驗證**：
   - 重新授權並執行 `scripts/database/run_supabase_backup.ps1`，於提示輸入時貼上 KeePassXC 中的新密碼，確認可成功完成唯讀 `pg_dump`、AES-256-GCM 加密與 SHA-256 校驗。

---

## 7. Git 狀態

- **目前 `HEAD` Commit**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **工作區狀態 (`git status --short`)**：共 96 筆未提交變更（包含先前階段之程式碼與 `docs/` 文件調整、新增檔案），本次唯讀稽核未修改任何程式碼或設定檔，僅新增本報告 `docs/DATABASE_PHASE3C35_AUTH02_PASSWORD_DEPENDENCY_AUDIT.md`。
