# CODE TO KNOW｜Phase 3-C-33：正式切換前最終 GO / NO-GO 清單

- **文件階段**：Phase 3-C-33（設計修正定版；**停止於此，未進行任何正式環境操作**）
- **建立日期**：2026-11-12
- **Git 基準**：
  - Branch：`main`
  - `HEAD`：`86a0f1116693bcce476b8747a446900d54b29a4a`
  - Working Tree：保留既有未提交開發變更與 Phase 3-C-11～3-C-33 報告檔案（本階段未修改任何程式碼、資料庫、環境設定或備份）。
- **既有正式備份 SHA-256 紀錄（`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`）**：
  - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 一、正式切換前 15 項檢查矩陣（Section 八）

> 狀態定義僅使用：`PASS`｜`PARTIAL`｜`NOT TESTED`｜`BLOCKED`｜`NOT AUTHORIZED`

| # | 檢查項目 | 目前狀態 | 具體依據與尚未滿足之條件 |
|---|---|---|---|
| **1** | **正式最新備份** | **`BLOCKED`** | 僅有 2026-11-10 舊備份，尚未執行切換當下最新正式備份（須先授權）。 |
| **2** | **備份還原成功** | **`PARTIAL`** | 2026-11-10 備份已於 PG17 Sandbox 還原驗收（`PASS`）；**切換前新備份尚未產生與還原**。 |
| **3** | **KeePassXC 金鑰保管** | **`NOT TESTED`** | 規格已備妥，本階段嚴禁讀取金鑰，切換前須依規格驗證新備份可由 KeePassXC 金鑰解密並比對 SHA-256。 |
| **4** | **官方 CA 憑證核對** | **`PARTIAL`** | 已核對本地 [`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt) 檔案 SHA-256（`70072358...`）與 X.509 指紋（`80:70:25:AD:...`）；**尚未從 Supabase Dashboard 下載官方 `prod-ca-2021.crt` 實測比對**。 |
| **5** | **Supavisor 自訂角色登入** | **`NOT TESTED`** | `app_runtime.ypibmyfxfhsyfdwxprpi` 與 `migration_admin.ypibmyfxfhsyfdwxprpi` 尚未於正式環境建立與實機登入測試。 |
| **6** | **TLS 主機名稱驗證** | **`PARTIAL`** | 離線 `database-ssl-config.test.ts` 已測 `rejectUnauthorized: true` 與 `checkServerIdentity`；**正式 Supavisor 遠端 TLS `verify-full` 握手 `NOT TESTED`**。 |
| **7** | **Migration Admin 權限** | **`NOT TESTED`** | 修正版切換 SQL 已避開 `postgres` 非真 `SUPERUSER` 陷阱，但 Supabase 託管下 `ALTER SCHEMA public OWNER` 與建表實權**尚未實機驗證**。 |
| **8** | **Runtime 權限** | **`PARTIAL`** | 本機 PG17 `c2k_test_app_runtime` 已驗證（`Phase 3-C-29`）；**正式 Supabase `app_runtime` 尚未建立與實測**。 |
| **9** | **`BYPASSRLS` 風險接受與隔離驗證** | **`PARTIAL`** | 36 模型僅 **9 個**有 API 並完成隔離驗證；其餘 **27 個模型尚無 API**，須強制套用 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts) 與未來 IDOR 測試。 |
| **10** | **Event Trigger 相容性** | **`NOT TESTED`** | `ensure_rls` / `rls_auto_enable` 在 `migration_admin` 建表時之相容性尚未於正式庫實測。 |
| **11** | **`AuditLog` Append-only 權限** | **`PARTIAL`** | 統一寫入入口（`audit.ts`）+ 脫敏（`redaction.ts`）+ PG17 `42501` 已實測；**正式 Supabase 尚未執行 `REVOKE`**。 |
| **12** | **`_prisma_migrations` 隔離** | **`PARTIAL`** | PG17 已驗證 `app_runtime` 零權限；**正式 Supabase 尚未執行 `REVOKE ALL`**。 |
| **13** | **回滾完整性** | **`PARTIAL`** | [`DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md) 已補齊 `pg_proc` 並禁用 `DROP OWNED BY`；**正式 Supabase 尚未實測**。 |
| **14** | **Render 連線設定與切換計畫** | **`BLOCKED`** | Render 環境變數尚未注入新角色憑證，且須在項目 1～13 全數通過後始得切換。 |
| **15** | **使用者明確授權** | **`NOT AUTHORIZED`** | 尚未取得使用者對「正式加密備份」、「維護時窗建立角色與執行切換 SQL」、「Supavisor 實機驗證」與「Render 切換」之明確授權。 |

---

## 二、最終判定

- **Phase 3-C-33 修正版設計交付**：**`GO（六份設計／審查規格文件已完成）`**
- **立即進行正式 Supabase 角色建立、權限切換或 Render 上線**：**`NO-GO（維持嚴格阻斷）`**

已停止於 **Phase 3-C-33**，未修改任何程式碼、資料庫、`.env`、Docker 或備份檔案。
