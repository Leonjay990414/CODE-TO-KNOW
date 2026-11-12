# CODE TO KNOW｜Phase 3-C-30：PG17 整合測試獨立安全稽核與正式環境前置審查報告

- 稽核日期：2026-11-12
- 稽核階段：Phase 3-C-30（針對 Phase 3-C-27～3-C-29 實作與實測成果之唯讀獨立安全稽核，以及正式 Supabase 角色切換前置審查）
- 稽核原則：全程 **100% 唯讀**；未連線 PG16、PG17 或 Supabase、未修改任何程式碼/資料庫/角色/Migration/`.env`/Docker/備份、未執行 Commit/Push/Deploy。

---

## 一、稽核範圍

本次唯讀審查涵蓋以下檔案與前序報告：
1. 資料庫連線與隔離驗證：[`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`backend/src/config/database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)、[`backend/src/config/env.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/env.ts)
2. 整合與安全測試：[`backend/tests/app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts)、[`backend/tests/integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts)、[`backend/tests/db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts)、[`backend/package.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json)
3. 後端權限與 AuditLog：[`backend/src/utils/audit.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts)、[`backend/src/utils/redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts)、[`backend/src/utils/ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)、[`backend/src/modules/teachers/teacher.routes.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.routes.ts)、[`backend/src/modules/admin/admin.routes.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts)、[`backend/src/modules/admin/admin.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.service.ts)
4. 相關階段文件：`Phase 3-C-14`～`3-C-29` 安全稽核、設計審查與測試報告。

---

## 二、測試隔離證據（`A. 測試隔離`）

| 檢查項目 | 靜態與實測證據 | 結論 |
|---|---|---|
| URL 五重白名單 | [`validateIsolatedPg17TestUrl`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L114-L195) 同時鎖定協定（`postgres:`/`postgresql:`）、Host（`localhost`/`127.0.0.1`）、顯式 Port（`5434`）、資料庫（`code_to_know_test`）與角色（`c2k_test_app_runtime`），且經 `FC-01`～`FC-10` 離線單元測試實證拒絕省略 Port、省略角色、`5432`、`5433`、`6543` 與 Supabase 主機。 | **PASS** |
| 防 `.env` 與正式設定污染 | `app-runtime.db.test.ts` 與 `integration.db.test.ts` 皆於 `vi.hoisted`（早於 `env.ts:4` `dotenv.config()`）擷取環境變數，並透過 `vi.mock('../src/config/database.js')` 建立獨立連線池。 | **PASS** |
| PG17 容器實體隔離 | Phase 3-C-29 實測目標確認為 `code_to_know_pg17_phase3c18_audit`（`16bea6ce523c`，`127.0.0.1:5434->5432/tcp`，Volume `code_to_know_pg17_phase3c18_audit_data`），與 PG16（`5432`）及 PG17 還原庫（`5433`）完全分離。 | **PASS** |

---

## 三、測試生命週期審查（`B. 測試生命週期`）

1. **`beforeAll`**：兩支測試皆檢查變數非空、執行 `validateIsolatedPg17TestUrl`、確認獨立 `prismaInstance` / `poolInstance` 已初始化並執行 `SELECT 1`。
2. **`afterAll` 與失敗清理**：皆採外層 `try / finally` 確保即便 `afterAll` 清理拋錯或測試中途失敗，仍一定執行 `prismaInstance.$disconnect()` 與 `poolInstance.end()`。
3. **清理邊界與 `AuditLog` 保護**：兩支測試的 `deleteMany` 皆嚴格限制 `where: { userId: { in: createdUserIds } }` / `where: { id: { in: createdUserIds } }`，且皆**不**執行 `auditLog.deleteMany`。Phase 3-C-29 實測前後 `User` 維持 `0 -> 0`、`TeacherApplication` `0 -> 0`、原有 `16` 筆 `AuditLog` 完整保留。
4. **極端中斷備註**：若發生 OS 層 `SIGKILL` 強制終止進程導致 `afterAll` 無法執行，該次合成測試帳號可能暫留於隔離庫 `code_to_know_test`（不影響其他環境）。

---

## 四、AuditLog 安全審查（`C. AuditLog 安全性`）

1. **統一入口與雙端脫敏**：所有業務 `AuditLog` 寫入皆經過 [`logAuditEvent`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L87-L126) 與 `redaction.ts` Fail-closed 脫敏；讀取端 [`listAuditLogs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.service.ts#L210-L248) 再次執行 `sanitizeAuditDetails`。
2. **PG17 實測權限**：`app-runtime.db.test.ts` 已實測 `c2k_test_app_runtime` 可正常 `SELECT`/`INSERT` `AuditLog`，且 `UPDATE`/`DELETE`/`TRUNCATE` 皆遭 PostgreSQL 以 **`42501`** 拒絕；`code_to_know_test` 原有 `16` 筆紀錄完好。
3. **精確安全定性（禁止過度宣稱）**：
   - `AuditLog` 的不可刪除/不可竄改目前係屬於 **「Runtime 角色級別的 Table ACL Append-only 保護」**（限制 `app_runtime` / `c2k_test_app_runtime`），**並非**對所有資料庫角色（如 `postgres` 或未來的物件擁有者 `migration_admin`）皆物理不可變之 WORM 儲存；此外若未來實作 `User` 物理刪除，外鍵 `ON DELETE SET NULL` 仍可能將 `AuditLog.userId` 置空（系統目前僅採 `deletedAt` 軟刪除設計）。

---

## 五、RLS／BYPASSRLS 風險審查（`D. RLS 與 BYPASSRLS`）

1. **為何暫時規劃 `BYPASSRLS`**：`public` Schema 全 37 張表（含 36 業務表）目前啟用 `ENABLE ROW LEVEL SECURITY` 但為 **`0` 條 Policy**，若不賦予 `BYPASSRLS` 將全面拒絕查詢；同時 Express 採自建 HttpOnly Cookie Session，未整合 Supabase GoTrue JWT，無法直接使用 `auth.uid()`。
2. **現行已實作端點防護確認**：
   - `teacher.routes.ts` 掛載 `authenticate` 與 `rejectForgedOwnerFields(['userId'])`。
   - `admin.routes.ts` 統一掛載 `authenticate, requireRoles(['ADMIN'])`、`validateParams(applicationIdParamSchema)` 與 `validateQuery(listAuditLogsQuerySchema)`（已修補 Phase 3-C-14 早期缺口）。
   - `app-runtime.db.test.ts` 已實測跨帳號申請/查詢 `403 OWNERSHIP_FORBIDDEN` 與非管理員核准 `403`。
3. **核心殘留風險（不得因 PG17 測試通過即認定正式 Supabase 安全）**：
   - **單點防線高耦合**：在 `BYPASSRLS` 下，PostgreSQL 不提供列級（Row-level）第二道防線。目前 36 個業務模型僅實作 **9 個**（見 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L42-L80)），其餘 **27 個模型**未來新增 API 時，只要任一路由漏接身分或所有權檢查，即直接構成跨使用者 IDOR。
   - **雲端行為未實測**：本機 PG17 Docker 測試通過**不等同**正式 Supabase + Supavisor 環境已完成驗證。

---

## 六、正式環境準備度檢查（`E. 正式環境前置條件`）

| 檢查項目 | 目前狀態 | 證據與判定 |
|---|---|---|
| **Supabase 正式角色設計** | 已於文件設計（`postgres` / `migration_admin` / `app_runtime`），**雲端尚未建立** | 需確保雙新建角色皆採 `LOGIN`（修正早期 R14-C-2-2 `NOLOGIN` 筆誤）並具備 `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION`。 |
| **Supavisor 自訂角色登入** | **`NOT TESTED`** | `app_runtime.<project_ref>` 與 `migration_admin.<project_ref>` 尚未於正式 Supabase Session Pooler（`5432`）或 Transaction Pooler（`6543`）實測認證相容性。 |
| **TLS `verify-full` 與 CA 憑證** | 程式碼已備妥，`sslmode` 驗證可再收緊，**雲端握手 `NOT TESTED`** | `database.ts:55` 強制載入 `prod-supabase-ca.crt` 並設 `rejectUnauthorized: true`；但 `db-validation.ts:436` 仍容許 `sslmode=require` 與 `verify-ca`（非僅限 `verify-full`）。 |
| **Migration 與 Runtime 權限分離** | 程式碼層面已分離並經離線測試；**正式憑證尚未建置** | `prisma.config.ts` 讀 `DIRECT_URL`/`MIGRATION_DATABASE_URL`（禁用 `6543` 與 `app_runtime`）；`database.ts` 讀 `DATABASE_URL`（禁用 `postgres` 與 `migration_admin`）。 |
| **密鑰管理與 Render 環境變數** | 規劃完整，**尚未切換** | 正式切換前須於安全密碼庫保存新角色密碼，再分階段更新 Render / CI 環境變數。 |
| **備份、還原與切換/回滾腳本** | 備份還原已演練（SHA-256 完整）；**正式 `.sql` 切換/回滾腳本尚未定版成獨立檔案** | 切換設計與 7 步受控回滾仍分散於 Phase 3-C-14/15 Markdown 文件中，尚未收斂為單一經審查之執行清單與 SQL。 |

---

## 七、已確認問題與風險分級

1. **`HIGH`（上線阻斷項）— Supabase Supavisor 自訂角色（`app_runtime` / `migration_admin`）實機認證與 TLS 握手尚未實測（`NOT TESTED`）**。
2. **`HIGH`（上線阻斷項）— 正式角色切換與 7 步回滾 SQL 尚未整併定版為單一核准腳本**（須排除早期文件 `NOLOGIN` 與 Sequence `UPDATE` 殘留矛盾）。
3. **`MEDIUM` — `BYPASSRLS` 單點依賴後端授權**：剩餘 27 個業務模型尚未實作 API，未來開發須強制搭配 `ownership.ts` 守衛與 HTTP 負向 IDOR 整合測試。
4. **`LOW` — [`db-validation.ts:436`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L436) 容許 `sslmode=require`/`verify-ca`**（雖 `database.ts` 已強制 `rejectUnauthorized: true` + CA 檔，仍建議於參數面收斂或顯式文件化 `verify-full` 規範）。
5. **`LOW` — [`backend/package.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json#L19) 的 `test:db` 腳本無法透過 `-- <檔名>` 單獨過濾單一 DB 測試檔**。

---

## 八、Phase 3-C-31 建議工作（待授權，不得自行執行）

1. **定版可審查之正式 Supabase 角色切換與受控回滾 SQL 規格**（統一 `LOGIN`、Sequence 僅 `USAGE, SELECT`、`AuditLog` append-only、`_prisma_migrations` `REVOKE ALL`）。
2. **於使用者明確授權與維護時窗下，先執行一次切換前最新正式備份**，再進行 `migration_admin` / `app_runtime` 建立與 Supavisor（`5432`）+ TLS 實機連線測試，最後再評估 Render 環境變數切換。
3. **（程式面選配）** 拆分 `package.json` 的 `test:db:app-runtime` / `test:db:integration`，並評估 `db-validation.ts` 是否將雲端 `sslmode` 收緊為 `verify-full`。

---

## 九、最終 GO / NO-GO 判定

- **本機 PG17 隔離測試與後端安全修補基線**：**`GO（PASS）`**
- **立即進行正式 Supabase 角色切換與 Render 正式環境切換**：**`NO-GO（維持阻斷）`**
  - **判定依據**：雖然本機 PG17 隔離實測（Phase 3-C-29）與前後端離線/安全修補均已通過驗證，但正式 Supabase Supavisor 自訂角色連線相容性、TLS 實機握手、定版切換/回滾 SQL 腳本與切換前新備份尚未完成實證；在相關項目完成驗證並獲明確授權前，不得進行正式資料庫角色切換。
