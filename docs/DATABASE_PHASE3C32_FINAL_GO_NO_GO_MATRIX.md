# CODE TO KNOW｜Phase 3-C-32：最終問題分級與 GO / NO-GO 準備度矩陣

- **審查階段**：Phase 3-C-32（第二輪 100% 唯讀獨立安全審查終局報告）
- **審查日期**：2026-11-12
- **Git 基準**：
  - Branch：`main`
  - `HEAD`：`86a0f1116693bcce476b8747a446900d54b29a4a`
  - Working Tree：存在 Phase 3-C-11～3-C-32 之已驗證未提交修改與報告文件（本次審查**未改動**任何既有程式碼、設定或備份）。
- **既有正式備份 SHA-256 紀錄（唯讀核對 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`）**：
  - `code_to_know_supabase_prod.dump`（505,249 bytes）：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`（505,282 bytes）：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`
  - `code_to_know_supabase_prod.dump.sha256`（102 bytes）：`7B03356E297E3F72CB313EF1E397294D704448298890D5CC751793AB6B31E736`

---

## 一、已識別問題分級總表（Section 九）

*(註：本階段未發現 `CRITICAL` 級別可立即造成正式環境破壞的既成漏洞，因正式角色與切換 SQL 尚未於雲端執行，且後端防護已阻斷高權限誤用。)*

| 編號 | 級別 | 問題描述 | 證據來源 | 可能影響 | 修正方向 | 需實機驗證？ | 需使用者授權？ |
|---|---|---|---|---|---|---|---|
| **F32-01** | **`HIGH`** | **Supavisor 自建角色 (`app_runtime.<ref>` / `migration_admin.<ref>`) SCRAM 認證與遠端 TLS 握手尚未實測** | [`DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md)、`Phase 3-C-15` | 正式建立角色並切換後，可能出現 `28P01` 認證失敗或 Pooler 路由異常，導致服務無法連線 | 依驗證計畫於維護時窗先不切 Render，執行 `SUP-01`～`SUP-05` 實測 | **是** | **是** |
| **F32-02** | **`HIGH`** | **Supabase 託管 `postgres` 非真 `SUPERUSER`，切換 SQL 步驟 3/4/9 存在權限衝突風險** | 官方文件、`Phase 3-C-31 Cutover Draft` 步驟 3/4/9 | `ALTER SCHEMA public OWNER`、`postgres` 對 `migration_admin` 物件授權、及由 `postgres` 執行 `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin` 均可能觸發 `42501` 失敗 | 調整 SQL 順序（先對 `app_runtime` 賦權再轉 Owner，或由 `migration_admin` 親自連線執行 `ALTER DEFAULT PRIVILEGES`），並於維護時窗實測確認 | **是** | **是** |
| **F32-03** | **`HIGH`** | **Supabase `ensure_rls` (`rls_auto_enable`) Event Trigger 與 `migration_admin` 相容性未實測** | 官方文件、[`DATABASE_PHASE3C32_SUPABASE_COMPATIBILITY_RISK_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C32_SUPABASE_COMPATIBILITY_RISK_REPORT.md) | 未來 `migration_admin` 執行 `prisma migrate deploy` 建立新表時若觸發事件觸發器權限錯誤，將導致遷移失敗 | 切換後於維護時窗使用 `migration_admin` 執行沙盒建表＋卸除相容性驗證 | **是** | **是** |
| **F32-04** | **`HIGH`** | **切換前最新正式加密備份尚未執行，且本地 `prod-supabase-ca.crt` 尚未與 Supabase Dashboard 官方檔案指紋比對** | 備份目錄最新時間戳為 `2026-11-10`、[`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt) | 缺少切換當下最新還原點；CA 憑證來源未經雙重核對 | 切換前先取得最新 `.dump` + `.c2kb` + `.sha256`，並核對 Dashboard `prod-ca-2021.crt` 指紋 | **是** | **是** |
| **F32-05** | **`MEDIUM`** | **`BYPASSRLS` 單點防線高耦合：36 個業務模型仍有 27 個尚未實作 API 與隔離驗證** | [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L42-L94)、[`app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts) | 未來開發 27 個模型若任一端點漏接所有權守衛，DB 無法攔截跨使用者 IDOR | 未來開發強制套用 `ownership.ts` ＋ HTTP 負向 IDOR CI 測試，並評估方案 C2（分層 `NOBYPASSRLS`） | **否（開發與測試階段）** | **否（後續開發規範）** |
| **F32-06** | **`MEDIUM`** | **`db-validation.ts` 對 `sslmode` 驗證尚未收緊為唯一 `verify-full`（Migration 端亦未檢核 `sslmode`）** | [`db-validation.ts:209-323,531-536`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L531-L536) | 雖 `database.ts` 強制 `rejectUnauthorized: true`，但允許 `?sslmode=require` 易與 `pg-connection-string` 產生參數語意混淆 | 後續小改版收斂 `validateCloudRuntimeDatabaseUrl` 與 `validateMigrationDatabaseUrl` 強制要求 `sslmode=verify-full` | **否（離線測試可測）** | **是（需授權修改程式碼）** |
| **F32-07** | **`LOW`** | **切換草案步驟 3 未涵蓋 `VIEW`/`FUNCTION`，回滾草案步驟 5 未涵蓋 `pg_proc`（Function）Owner 歸還** | `Phase 3-C-31 Cutover/Rollback Draft` | 若未來建立自訂 View 或 Function，切換/回滾時可能遺漏導致 `pg_shdepend` 阻擋 | 更新設計草案補入 `VIEW`/`MATERIALIZED VIEW`/`pg_proc` 迴圈 | **否** | **否（文件修訂）** |
| **F32-08** | **`INFO`** | **`AuditLog` 屬 Runtime 角色級 ACL Append-only，且 `User` 物理刪除會觸發 `ON DELETE SET NULL`** | [`schema.prisma:162`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma#L162)、`Phase 3-C-30` | 屬於架構設計既定邊界，不可過度宣稱為全角色 WORM 不可變 | 維持應用層軟刪除規範與高權限帳號保管 | **否** | **否** |

---

## 二、最終六維度狀態矩陣（Section 十一）

| 類別 | 具體項目清單 |
|---|---|
| **1. 本機已驗證** | - PG17 隔離測試（`c2k_test_app_runtime`、`AuditLog` `42501`、`app-runtime.db.test.ts`、`integration.db.test.ts`、`db-config-safety.test.ts`）。<br>- [`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts) 載入 `prod-supabase-ca.crt` 離線 X.509 與 SAN 檢查。<br>- 全域錯誤脫敏（`error-handler.ts` + `redaction.ts`）與 `AuditLog` 統一入口（`audit.ts`）。<br>- 前端 `#sources`（`import-system`）已受 `<ProtectedRoute requiredRoles={['ADMIN']}>` 保護。 |
| **2. 文件已審查** | - Phase 3-C-31 四份整合設計文件（切換 SQL 草案、7 步回滾方案、Supavisor/TLS 驗證計畫、Readiness Matrix）。<br>- 確認 `DROP OWNED BY` 與 `REASSIGN OWNED BY postgres` 已完全禁用。 |
| **3. 官方文件已確認** | - Supabase `postgres` 角色非完整 `SUPERUSER`。<br>- Supavisor 自建角色需以 `[ROLE_NAME].[PROJECT_REF]` 格式登入，且須以 SQL `CREATE ROLE ... WITH LOGIN` 建立。<br>- `rls_auto_enable()` / `ensure_rls` Event Trigger 於 `public` schema `CREATE TABLE` 時自動啟用 RLS。 |
| **4. 正式環境尚未驗證** | - Supavisor 對 `app_runtime.ypibmyfxfhsyfdwxprpi` 與 `migration_admin.ypibmyfxfhsyfdwxprpi` 的 SCRAM-SHA-256 登入。<br>- `aws-0-ap-southeast-2.pooler.supabase.com:5432` 遠端 TLS `verify-full` 握手與官方 `prod-ca-2021.crt` 指紋比對。<br>- Supabase `postgres` 執行 `ALTER SCHEMA public OWNER TO migration_admin` 及 `migration_admin` 建表觸發 `rls_auto_enable`。<br>- `0` 筆真實 Sequence 環境下之未來自增序列驗證。 |
| **5. 必須先修正** | - 切換草案 SQL 步驟 9 `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin` 應改由 `migration_admin` 親自連線執行（避免 `postgres` 非 `SUPERUSER` 觸發 `42501`）；並調整步驟 3/4 順序避免 `postgres` 無權替 `migration_admin` 物件授權。<br>- 切換／回滾草案補齊 `VIEW`/`MATERIALIZED VIEW`/`pg_proc` Owner 迴圈。<br>- （建議）收斂 `db-validation.ts` 雲端 `sslmode=verify-full`。 |
| **6. 必須取得使用者授權** | 1. 授權修正切換/回滾草案與（若需要）`db-validation.ts` 程式碼。<br>2. 授權執行切換前最新正式加密備份。<br>3. 核准維護時窗，授權於正式 Supabase 建立 `migration_admin`/`app_runtime` 並執行 `SUP-01`～`SUP-05` 驗證。<br>4. 授權分階段更新 Render / CI 環境變數。 |

---

## 三、最終結論（GO / NO-GO）

- **Phase 3-C-32 獨立安全審查結論**：已完成五份審查報告，所有 `HIGH` 問題皆有明確處理方向與驗證步驟，無未揭露之隱匿假設。
- **正式環境角色切換與 Render 上線判定**：**`NO-GO（嚴格阻斷）`**

已停止於 **Phase 3-C-32**，未進行任何正式角色建立、Supabase 連線或 Render 切換。
