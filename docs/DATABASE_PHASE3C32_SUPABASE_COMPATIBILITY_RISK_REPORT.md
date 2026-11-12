# CODE TO KNOW｜Phase 3-C-32：Supabase 平台相容性與 TLS 風險審查報告

- **審查階段**：Phase 3-C-32（第二輪 100% 唯讀獨立安全審查）
- **審查日期**：2026-11-12
- **審查原則**：**未連線 Supabase、未執行任何 Event Trigger 或 Schema 修改**。所有結論嚴格區分「已有本機證據」、「官方文件可確認」、「需要 Supabase 實機驗證」、「目前無法確認」。

---

## 一、Supabase Schema Owner 與 `rls_auto_enable` Event Trigger 相容性分析（Section 五）

| 檢查項目 | 審查分析與結論 | 證據等級標記 |
|---|---|---|
| **1. Supabase 託管環境是否允許將 `public` Schema Owner 轉移給自訂角色？** | Supabase 託管資料庫的 `postgres` 角色**並非**完整 PostgreSQL `SUPERUSER`（受託管平台限制，以保護系統內部設定）；雖然 `public` Schema 通常由 `postgres` 擁有，但 `postgres` 執行 `ALTER SCHEMA public OWNER TO migration_admin` 是否會因非 `SUPERUSER` 或未具備目標角色成員資格（`must be member of role "migration_admin"`）而遭拒，存在高度實作不確定性。 | **官方文件可確認**（`postgres` 非真 `SUPERUSER`）／**需要 Supabase 實機驗證**（`ALTER SCHEMA public OWNER` 是否成功） |
| **2. `rls_auto_enable` Event Trigger 的觸發條件？** | 依 Supabase 官方推薦實作模式，`ensure_rls` 事件觸發器綁定於 `ddl_command_end`，當執行 `CREATE TABLE`、`CREATE TABLE AS` 或 `SELECT INTO` 且物件位於 `public` Schema 時，觸發 `public.rls_auto_enable()`（`SECURITY DEFINER` 函式）自動執行 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`。 | **官方文件可確認**（觸發條件與 `SECURITY DEFINER` 機制）；本機還原庫（`Phase 3-C-13`）亦證實現有 37 張表已啟用 RLS（**已有本機證據**）。 |
| **3. 新資料表建立後 RLS 是否會自動啟用？** | 若正式庫已啟用 `ensure_rls` Event Trigger，則未來 `migration_admin` 執行 `prisma migrate deploy` 建立任何 `public` 新表時，預期將自動啟用 RLS（`ENABLE ROW LEVEL SECURITY`）。 | **官方文件可確認**／**需要 Supabase 實機驗證**（確認本專案正式庫實際掛載狀態與執行結果） |
| **4. `migration_admin` 是否具備建立資料表及管理物件所需權限？** | 設計上授予 `migration_admin` `USAGE, CREATE ON SCHEMA public` 與全體既有表/Sequence/Enum 之 Owner。在本機 PG17 已驗證結構相容，但於 Supabase 託管下，`NOSUPERUSER` 角色建立新表並觸發由 `postgres`/`supabase_admin` 擁有的 `ensure_rls` Event Trigger 是否無權限衝突，仍須實機驗證。 | **已有本機證據**（PG17 概念驗證）／**需要 Supabase 實機驗證** |
| **5. 新表若沒有 RLS Policy，Runtime 是否會被拒絕存取？** | 兩極化風險：（a）若 `app_runtime` 採 **`NOBYPASSRLS`**，新表啟用空 RLS（0 Policy）會使 `app_runtime` **立刻遭預設拒絕存取**（造成新功能停機）；（b）若 `app_runtime` 採 **`BYPASSRLS`**，新表雖可被查詢，但 **0 Policy 無法提供任何列級資料隔離**。 | **已有本機證據**（PG17 實證 `BYPASSRLS` 可繞過空 RLS，而無 `BYPASSRLS` 會被 0 Policy 拒絕） |
| **6. Schema Owner 與物件 Owner 是否可能產生不一致？** | **極可能發生！**例如：（a）若在 Supabase Dashboard SQL Editor 以 `postgres` 手動建表，新表 Owner 會是 `postgres` 而非 `migration_admin`；（b）若切換腳本步驟 3 遺漏 `VIEW`/`FUNCTION`，或步驟 9 `ALTER DEFAULT PRIVILEGES` 綁錯角色，皆會造成 Owner 與權限分裂，導致日後 `migration_admin` `ALTER TABLE` 失敗。 | **已有本機證據**（PostgreSQL 原生所有權規則）／**目前無法確認**（未來維運是否嚴格禁絕 Dashboard `postgres` 建表） |
| **7. Supabase 內部 Schema、Extension、Function、Trigger 是否可能受到影響？** | 切換與回滾草案已嚴格限定 `schemaname = 'public'`，**絕不使用 `REASSIGN OWNED BY postgres`** 與 `DROP OWNED BY`，因此不會修改 `auth`、`storage`、`realtime`、`extensions`、`vault`。唯一潛在交互點在於 `public` 內由 Supabase 管理的系統函式/觸發器（如 `rls_auto_enable`）若位於 `public` Schema 中，步驟 3 迴圈不應（亦未）將該系統函式轉移 Owner。 | **文件已審查**（草案未修改函式 Owner）／**需要 Supabase 實機驗證** |

---

## 二、Supavisor 與 TLS 安全審查（Section 五 / 第五部分）

| 檢查項目 | 審查事實與證據 | 風險與結論 |
|---|---|---|
| **Session Pooler Host / Port** | [`db-validation.ts:19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L19) 鎖定 `aws-0-ap-southeast-2.pooler.supabase.com`，Migration 強制 Port `5432`（禁用 `6543`），Runtime 允許 `5432`（Session）或 `6543`（Transaction）。 | **PASS（程式碼與官方文件一致）**；6543 高併發與 Prisma Prepared Statements 相容性待實測。 |
| **自訂角色登入格式** | [`db-validation.ts:453-483`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L453-L483) 強制 Pooler 用戶名為 `<role>.ypibmyfxfhsyfdwxprpi`。Supabase 官方文件亦確認 Supavisor 需以 `[ROLE_NAME].[PROJECT_REF]` 路由，且角色須以 SQL `CREATE ROLE ... WITH LOGIN` 建立。 | **官方文件可確認格式**／**本專案自建帳號實際登入 `NOT TESTED`**（須於維護時窗執行 `SUP-01`/`SUP-02`）。 |
| **`SCRAM-SHA-256` 與密碼編碼** | 須確認 Supabase PostgreSQL `password_encryption` 為 `scram-sha-256`，且若強密碼含 `#`、`=`、`@`、`%` 等特殊字元，放入 URI 時必須正確 URL-encode（否則易出現 `28P01` 認證失敗）。 | **官方文件可確認**／**需要 Supabase 實機驗證**。 |
| **`sslmode=verify-full` 與 Node.js TLS** | [`database.ts:54-57`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L54-L57) 在 `production` 強制設定 `rejectUnauthorized: true` 並讀取 [`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)，且未覆寫 `checkServerIdentity`（保留 RFC 6125 主機名稱驗證）。<br>**殘留程式碼缺口**：（1）[`db-validation.ts:532`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L532) 仍接受 `sslmode=require` 與 `verify-ca`（未收緊至僅 `verify-full`）；（2）`validateMigrationDatabaseUrl`（L209-323）未顯式要求 `?sslmode=verify-full`。 | **MEDIUM / LOW 程式碼改善項**（須確認 `pg-connection-string` 解析 `sslmode=require` 時是否覆寫 `PoolConfig.ssl`）。 |
| **CA 憑證指紋與官方來源核對** | 本機 [`backend/certs/prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt) 經離線 X.509 檢查為 `CN=Supabase Root 2021 CA`（`O=Supabase Inc`、`SHA-256: 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`）。<br>**重要聲明**：讀取本地 `.crt` 檔案中繼資料**絕不等同於**已完成遠端 TLS 握手驗證；在實際連線前，使用者須於 **Supabase Dashboard > Database Settings > SSL Configuration** 下載並比對官方 `prod-ca-2021.crt` 指紋是否與倉庫檔案完全一致。 | **本地檔案已檢查**／**官方 Dashboard 指紋比對與遠端 TLS 握手 `NOT TESTED`**。 |
| **密碼傳遞、清除與錯誤紀錄** | [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 所有驗證錯誤均不輸出密碼與 Query String；[`redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts) 與 [`error-handler.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/error-handler.ts) 遮蔽連線字串。驗證計畫亦禁用 Shell 歷史紀錄帶入明文密碼。 | **已有本機證據**（離線安全測試覆蓋）。 |
