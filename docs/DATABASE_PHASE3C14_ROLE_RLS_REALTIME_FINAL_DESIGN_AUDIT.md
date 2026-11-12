# CODE TO KNOW｜Phase 3-C-14：正式環境角色、RLS 與 Realtime 最終設計審查報告

- **審查階段**：Phase 3-C-14：正式環境角色、RLS、後端資料隔離與 Realtime 最終設計審查
- **審查日期**：2026-11-11（UTC+8）
- **審查性質**：**100% 唯讀獨立設計與安全審查**（僅讀取本機檔案、原始碼、文件與執行離線單元測試；未連線 Supabase、未修改 PostgreSQL/PG16/PG17/Docker/Render、未讀取或輸出任何密碼/金鑰/Token/連線字串、未修改業務程式碼或設定檔、未執行任何 Git 寫入操作）
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **基準依據**：Phase 3-C-13 還原完整性查核結果（[`DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md)）與專案現行程式碼及規格文件

> **核心結論預告**：針對「立即於 Supabase 正式環境建立角色、執行權限切換及切換 Render 正式連線」，本獨立審查最終判定為 **`NO-GO`（維持受控阻斷 `BLOCKED`）**。專案雖已具備良好安全方向與離線組態驗證，但目前存在**權限切換 DDL 檔案尚未定版且跨文件矛盾（`NOLOGIN` vs `LOGIN`）**、**Supavisor 自訂角色連線尚未於雲端實測**、**36 個業務模型僅 9 個具後端 API（其餘 27 個尚未實作且無通用所有權守衛與負向 IDOR 整合測試）** 等關鍵缺口。

---

## 1. 本次審查範圍與限制

### 1.1 審查範圍

本階段依 Phase 3-C-13 還原查核基準，全面獨立檢視以下範圍：

1. **資料庫結構與還原基準**：[`backend/prisma/schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)、[`backend/prisma/migrations/20261103000000_init/migration.sql`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/migrations/20261103000000_init/migration.sql)、[`backend/prisma/migrations/20261108000000_add_business_models/migration.sql`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/migrations/20261108000000_add_business_models/migration.sql)、[`backend/prisma/seed.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/seed.ts)。
2. **後端設定與安全守門程式**：[`backend/src/config/env.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/env.ts)、[`backend/src/config/database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)、[`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`backend/prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts)。
3. **Express API、中介軟體與管理腳本**：[`backend/src/app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts)、[`backend/src/middleware/authenticate.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts)、[`backend/src/middleware/authorize.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authorize.ts)、[`backend/src/middleware/csrf.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/csrf.ts)、[`backend/src/middleware/validate.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/validate.ts)、[`backend/src/modules/auth/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.routes.ts)、[`backend/src/modules/teachers/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.routes.ts)、[`backend/src/modules/admin/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts)、[`backend/src/utils/audit.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts)、[`backend/src/services/email.provider.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/services/email.provider.ts)、[`backend/scripts/create-admin.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/scripts/create-admin.ts)。
4. **前端受保護路由與頁面授權**：[`frontend/src/app/App.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx)、[`frontend/src/components/ProtectedRoute.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/ProtectedRoute.tsx)、[`frontend/src/context/NavigationContext.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/context/NavigationContext.tsx)、[`frontend/src/pages/public/TeacherDashboardPage.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx)、[`frontend/src/services/api.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts)。
5. **既有測試套件與設計審查文件**：[`backend/tests/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts) 及 `docs/DATABASE_PHASE3C4F_*`、`docs/POST_DATABASE_DEFERRED_TASKS.md`、`docs/DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md`。

### 1.2 執行限制與現場離線實測說明

- 本階段嚴格遵守不連線 Supabase、不寫入 PG16/PG17、不改動程式碼與設定檔原則。
- 本次審查另外重跑 **5 支完全離線單元測試**（不讀取 `.env` 連線資料庫、不觸及任何資料庫實例）：
  - `npx --prefix backend vitest run tests/db-config-safety.test.ts tests/database-ssl-config.test.ts tests/rbac-workflow.test.ts tests/security.test.ts tests/validation.test.ts`
  - **實測結果**：`5 passed (5)`、`100 passed (100)`，Exit Code `0`。
- 注意：[`api.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts) 與 [`integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts) 因會嘗試連線資料庫（或受 `TEST_DATABASE_URL` 閘門控制）未於本唯讀階段執行；一切需要實際修改資料庫或連線雲端才能驗證的項目，均明確標示為**「尚待授權」**或**「尚未測試」**。

---

## 2. 正式角色設計結果（`postgres`、`migration_admin`、`app_runtime`）

### 2.1 三角色規劃與目前實證狀態分類

| 角色 | 規劃定位 | 已有程式碼證據 | 只有文件規劃 | 尚未實作 / 尚待授權 | 尚未測試 |
|---|---|---|---|---|---|
| **`postgres`** | Supabase 原廠高權限/Owner 管理角色，僅用於災害復原與權限切換 | [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L365-L393) 嚴格禁止於雲端 Runtime 使用 `postgres`；允許作為遷移備援角色 | 切換後僅留作 DR/緊急維護，從 Render 移除 | 正式庫仍全面由 `postgres` 擁有 37 張表，尚未將 Owner 移轉出（**尚待授權**） | 尚未於 Supabase 正式環境測試切換後僅以 `postgres` 做 DR |
| **`migration_admin`** | CI/CD 與 `prisma migrate deploy` 專用 DDL 與物件 Owner | [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L19-L216) 鎖定 `APPROVED_PROD_MIGRATION_ROLE = 'migration_admin'`、拒絕 `port 6543` 與 `app_runtime`；[`prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) 強制讀 `DIRECT_URL` / `MIGRATION_DATABASE_URL` | 屬性規劃：`NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`；授予 `public` schema `USAGE, CREATE` 及現有 37 表、Sequence、Enum (`AnnouncementStatus`) 與 `public` schema Owner | **1. Supabase 尚未建立此角色（尚待授權）**<br>**2. Repo 中無可執行 `.sql` 腳本，且文件間存在 `LOGIN` vs `NOLOGIN` 矛盾** | 1. 尚未驗證於 Supabase 直接/Pooler(5432) 以 `migration_admin` 登入執行 `prisma migrate deploy`<br>2. 因專案實質 Sequence 為 0，含真實 Sequence 之遷移與擁有權移轉尚未實測 |
| **`app_runtime`** | Express / Prisma Client 執行期唯一允許帳號 | [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L19-L405) 鎖定 `APPROVED_PROD_RUNTIME_ROLE = 'app_runtime'`，拒絕 `postgres` 與 `migration_admin`；[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L67-L87) 於 `production` 強制載入 `prod-supabase-ca.crt` 與 `rejectUnauthorized: true` | 屬性規劃：`NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `BYPASSRLS`；對業務表授予 DML (`SELECT, INSERT, UPDATE, DELETE`)，對 `AuditLog` 僅 `SELECT, INSERT`，對 `_prisma_migrations` `REVOKE ALL`，對 `public` 僅 `USAGE` | **1. Supabase 尚未建立此角色（尚待授權）**<br>**2. R14-C-2-2 文件誤寫為 `NOLOGIN`（與 R14-C-2-0 的 `LOGIN` 衝突）**<br>**3. Production 目前仍無有效 `app_runtime` 憑證** | 1. **Supavisor Pooler 自訂角色登入相容性**（`app_runtime.ypibmyfxfhsyfdwxprpi` @ `aws-0-ap-southeast-2.pooler.supabase.com`）從未於 Supabase 實測<br>2. Node `pg.Pool` + Supabase 正式庫 TLS 實機握手尚未測試 |

### 2.2 六大核對問題逐項解答

1. **`app_runtime` 是否確實不是資料表、Schema 或物件擁有者？**
   - **只有文件規劃（PG17 沙盒曾演練，正式 Supabase 尚未存在此角色）**。
   - 文件設計中（[`DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md#L83-L115)、[`DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md#L34-L41)），所有 37 張表、`AnnouncementStatus` Enum、Sequences 與 `public` schema 的 Owner 皆規劃移轉給 `migration_admin`，絕不指派給 `app_runtime`。
   - 注意：Phase 3-C-12/13 本機 PG17 還原時依規範使用 `--no-owner --no-acl`，因此 `code_to_know_c2kb_prod_restore_clean_v2` 目前所有物件 Owner 為 `codetoknow_restore`，且無 `app_runtime`/`migration_admin`；**正式 Supabase 上所有物件目前仍由 `postgres` 擁有**（尚待授權切換）。

2. **是否具備 `NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`？**
   - **只有文件規劃**：[`DATABASE_PHASE3C4F_R14C22_FINAL_SECURITY_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C22_FINAL_SECURITY_DECISION.md#L35) 與 [`DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md#L152-L155) 均已明確定義兩者皆須具備 `NOSUPERUSER NOCREATEDB NOCREATEROLE`（另補充：應顯式加上 `NOREPLICATION` 並在 Supabase 測試相容性）。
   - **嚴重文件衝突（必須修正）**：上述兩份 R14-C-2-2 決策文件卻因延用 PG17 沙盒 `SET ROLE` 測法，寫成 **`WITH NOLOGIN`**；而 [`DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C05_FINAL_SQL_SECURITY_REVIEW.md#L51) 與 [`DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md#L38-L61) 則寫 **`WITH LOGIN PASSWORD '...'`**。由於後端與 Prisma 是分別以 `app_runtime` 及 `migration_admin` 連線字串登入，正式建立時若依 `NOLOGIN` 執行將直接無法連線！

3. **是否禁止繼承或切換至 `postgres`、`migration_admin`？**
   - **只有文件規劃**：DDL 規劃中未授予 `GRANT postgres TO app_runtime` 或 `GRANT migration_admin TO app_runtime`，且 [`DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md#L58-L94) 建議加上 `NOINHERIT` 並於 PG17 沙盒驗證過 `SET ROLE migration_admin` 被拒。
   - **備註**：Supabase 託管環境內建如 `authenticator`、`postgres` 等角色結構；未來在正式庫建立角色後，必須透過 `pg_auth_members` 實測斷言 `app_runtime` 不隸屬任何管理/擁有者群組。

4. **`migration_admin` 是否只負責 Migration 與資料庫結構管理？**
   - **已有程式碼與文件雙重依據（但未於雲端實裝）**：
     - 程式碼層面：[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L371-L398) 在 Runtime 嚴格阻擋 `migration_admin`（拋出 `Role 'migration_admin' is strictly reserved for schema migrations and disallowed in runtime`）；[`prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) 透過 `resolveDatasourceUrl` 在 `production` / `cloud` 模式強制要求 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL`。
     - 文件層面：`migration_admin` 為 37 表、Enum 與 `public` schema 的規劃 Owner，擁有 `USAGE, CREATE ON SCHEMA public`。
     - **風險補充**：[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L206) 在 Migration 驗證時同時允許 `migration_admin` 與 `postgres`，切換完成後應評估是否進一步收斂僅允許 `migration_admin`。

5. **Runtime 與 Migration 的連線設定是否確實分離？**
   - **已有程式碼證據（離線邏輯已測 `59/59`）**：
     - Runtime 由 [`resolveDatabaseConnectionString()`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L59-L101) 讀取 `env.DATABASE_URL` 並呼叫 `validateCloudRuntimeDatabaseUrl`（僅許 `app_runtime`，支援 port `5432`/`6543`，須含 `sslmode=require|verify-full|verify-ca`）。
     - Migration 由 [`prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) 呼叫 `resolveDatasourceUrl` 讀取 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL` 並呼叫 `validateMigrationDatabaseUrl`（禁用 `port 6543` 及 `app_runtime`）。
   - **實務缺口**：程式碼與環境變數規範已分離，但 Render 與 CI/CD **尚未實際注入 `app_runtime` / `migration_admin` 憑證**（目前屬「尚未實作於部署環境 / 尚未測試於雲端」）。

6. **正式環境的角色建立與權限授予是否有完整、可回復的操作計畫？**
   - **只有文件規劃，尚未收斂為單一可執行的版本控管 `.sql` 腳本**。
   - 經全面盤點工作區內所有 `*.sql` 檔案，目前**僅存在 2 支 Prisma Migration SQL**（`20261103000000_init/migration.sql` 與 `20261108000000_add_business_models/migration.sql`），`scripts/` 目錄下**沒有**任何正式角色切換 `.sql` 與回滾 `.sql` 檔案；相關 DDL 散落於多份 `DATABASE_PHASE3C4F_*` Markdown 報告中，且彼此存在 3 處明顯差異：
     1. **`NOLOGIN` vs `LOGIN`**：`R14C20` 用 `LOGIN PASSWORD`，`R14C22` 誤留沙盒寫法 `NOLOGIN`。
     2. **`SEQUENCES` 權限**：`R14C05_PERMISSION_MATRIX_FINAL.md`（L46）與 `R14C05_FINAL_SQL_SECURITY_REVIEW.md`（L116）仍列 `USAGE, SELECT, UPDATE`，而 `R14C22` 已修正剔除 `UPDATE`（僅 `USAGE, SELECT`）。
     3. **業務表清單陳舊錯誤**：[`DATABASE_PHASE3C4F_R14C05_PERMISSION_MATRIX_FINAL.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C05_PERMISSION_MATRIX_FINAL.md#L60-L63) 第 4 節列出的表名（`Course`, `Category`, `Lesson`, `QuestionBank`, `MockExam`, `LeaderboardEntry` 等）與實際 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 的 36 張業務表名稱**不符**（還好動態 PL/pgSQL 移轉迴圈依 `pg_tables` 遍歷，不靠靜態寫死表名）。
   - 回滾計畫在 [`DATABASE_PHASE3C4F_R14C21_CONTROLLED_ROLLBACK_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C21_CONTROLLED_ROLLBACK_REPORT.md) 已改為「7 步受控回滾（收回 Default Privileges → 收回物件授權 → 迴圈歸還 Owner 至 `postgres` → `pg_shdepend` 依賴斷言 → `DROP ROLE`）」，剔除了危險的 `DROP OWNED BY`，但同樣僅於 PG17 沙盒驗證過，尚未在 Supabase 正式環境與真實 `LOGIN` 角色下實測。

---

## 3. BYPASSRLS 安全風險評估

針對先前決議之 `app_runtime WITH BYPASSRLS` 方案，依「已有程式碼證據 / 只有文件規劃 / 尚未實作 / 尚未測試」四分法重新獨立評估七大必答問題：

1. **使用 `BYPASSRLS` 後，資料隔離是否完全依賴 Express 後端授權？**
   - **是（100% 事實，屬高耦合單點防線）**。
   - **機制證據**：`BYPASSRLS` 讓資料庫在檢索與更新任何 `public` 資料表時**完全略過 `pg_policies`**（目前本就為 `0` 條）。因此若 Express 層在任一新舊端點漏掉身份認證、角色檢查或 `where: { userId: req.user.id }` 條件，PostgreSQL RLS **不會**提供第二層阻擋。`Table ACL` 只擋得住整張表級別的操作（如禁止 `app_runtime` `UPDATE/DELETE "AuditLog"` 或存取 `_prisma_migrations`），無法阻擋同一張業務表內的**跨使用者越權（IDOR）**。

2. **所有使用者資料查詢是否都有正確的使用者 ID 限制？**
   - **對「目前僅存的 3 個後端模組」已有程式碼證據；對「其餘 27 個業務模型」則完全尚未實作**。
   - **既有程式碼實證**（見第 5 節全表）：
     - `GET /api/auth/me`（[`auth.controller.ts:104`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.controller.ts#L104)、[`auth.service.ts:212-214`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L212-L214)）僅使用信任的 `req.user.id`。
     - `POST /api/teachers/applications` 與 `GET /api/teachers/my-application`（[`teacher.controller.ts:8,28`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.controller.ts#L8-L28)、[`teacher.service.ts:9-67`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.service.ts#L9-L67)）均強制綁定 `req.user!.id`。
     - `POST /api/auth/logout`（[`auth.service.ts:190-193`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L190-L193)）僅更新取自 Session 表驗證後的 `req.sessionId`。
   - **重大範圍限制**：[`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 共計 **36 個業務模型**（對應 `public` Schema 中除 `_prisma_migrations` 外的 36 張業務表），現行 Express 伺服器僅觸及其中 **9 個模型**（`User`, `Role`, `UserRole`, `UserProfile`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `TeacherApplication`, `AuditLog`）。其餘 **27 個含敏感個人學習與班級資料之模型**（如 `ExamAttempt`, `ExamAnswerSnapshot`, `WrongQuestionRecord`, `PracticalProgress`, `Class`, `ClassEnrollment`, `AIChatSession`, `AIChatMessage`, `StudentWeaknessAnalysis` 等）目前**尚未實作任何後端 API**，無法在程式碼層面驗證其隔離實作！

3. **是否存在依照使用者傳入 ID 查詢、但未驗證資料所有權的風險？**
   - **現行 15 個後端端點中「暫無一般使用者 IDOR 路徑」，但存在一項管理員端點未校驗與參數防護缺失**：
     - 全後端目前僅有 2 個端點讀取 `req.params.id`：[`POST /api/admin/teacher-applications/:id/approve`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L21-L26) 與 [`POST /api/admin/teacher-applications/:id/reject`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L28-L33)，該路由受全域 `router.use(authenticate, requireRoles(['ADMIN']))` 保護，跨用戶審核為管理員職權設計；**然而**（1）路由未掛載已定義的 `validateParams(applicationIdParamSchema)`（[`admin.schema.ts:13-15`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.schema.ts#L13-L15)），非法 UUID 格式會直接進 Prisma 查詢；（2）[`admin.service.ts:49-124`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.service.ts#L49-L124) 未禁止管理員自我審核（若同時擁有 `ADMIN` 與待審申請，理論上可自審自己成 `TEACHER`）。
   - **前端路由守衛缺失（已有程式碼證據，對應 DEF-01）**：
     - [`frontend/src/app/App.tsx:81-82`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L81-L82) 的 `case 'import-system':`（對應 `#sources` / 題庫匯入管理頁）**仍未包裹 `<ProtectedRoute>`**，任何訪客直接輸入 `#sources` 即可進入該管理介面。
     - [`App.tsx:74`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L74) `teacher-dashboard` 仍允許 `requiredRoles={['TEACHER', 'ADMIN']}` 混用（對應 DEF-04），且 [`TeacherDashboardPage.tsx:25-32`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx#L25-L32) 仍含硬編碼學生假名冊（對應 DEF-03）。

4. **是否存在更新、刪除、讀取其他使用者資料的 IDOR 風險？**
   - **現行已實作後端 API 中「無跨使用者讀寫刪 IDOR」**（已有程式碼證據），因目前**完全沒有**個人檔案修改（`PATCH /users/me`）、使用者刪除、班級學生查詢、測驗作答查詢或 AI 對話查詢端點；**但未來開發 27 個業務模型時 IDOR 風險極高**：一旦加入 `GET /classes/:id`、`GET /exams/attempts/:id`、`GET /ai/sessions/:id` 等路由，在 `BYPASSRLS` 下全靠工程師手動補齊所有權校驗，沒有資料庫 RLS 兜底。

5. **管理員操作是否有明確的 `ADMIN` 權限檢查？**
   - **是（已有程式碼證據，且有離線單元測試覆蓋）**：[`admin.routes.ts:12`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L12) 統一掛載 `router.use(authenticate, requireRoles(['ADMIN']))`，[`authorize.ts:11-42`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authorize.ts#L11-L42) 僅相容轉換 `ADMIN` ↔ `PLATFORM_ADMIN`，明確將 `SYSTEM_OPERATOR`、`TEACHER`、`STUDENT` 擋下並回傳 `403 INSUFFICIENT_PERMISSIONS`（於 [`rbac-workflow.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts#L83-L186) 驗證）。
   - **未竟之處**：[`GET /api/admin/audit-logs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L36) 雖受 `ADMIN` 保護，但未經過 `validateQuery(...)`，[`admin.controller.ts:70-71`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.controller.ts#L70-L71) 直接 `parseInt` 傳給 `take: limit`，未設上限（`max(100)`）與非負整數防呆，可能遭單次超大查詢影響資料庫效能。

6. **新增業務資料模型時，是否有一致的資料所有權檢查規範？**
   - **只有文件規劃，尚未實作任何程式碼強制機制**：
     - 文件層面：[`DATABASE_PHASE3C4F_PHASE21_PRISMA_DATA_ISOLATION_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_PRISMA_DATA_ISOLATION_AUDIT.md#L139-L147) 與 [`FINAL_ARCHITECTURE_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_FINAL_ARCHITECTURE_DECISION.md#L62-L69) 列了人工開發準則（學生查 `where: { userId: req.user.id }`、教師核驗 `Class.creatorId === req.user.id`、AI 對話核驗 `AIChatSession.userId === req.user.id`）。
     - **程式碼現況（尚未實作）**：專案中**不存在**任何可複用的所有權中介軟體/Repository Helper（如 `assertOwnership` / `scopeByUser` / Prisma Client Extension 強制 Scope），亦無 CI Lint 規則能阻斷開發者漏寫 `where` 條件。

7. **是否有足夠的自動化測試防止未來開發造成資料越權？**
   - **目前明顯不足（尚未實作 / 尚未測試）**：
     - 現有測試中：[`rbac-workflow.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts) **僅為純記憶體 Mock 物件測試**（未經真實 Express HTTP 路由與真實 PostgreSQL）；[`integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts) 僅測試一個正向 `auth -> teacher apply -> admin approve` 流程，且未在 `app_runtime` 角色下運行。
     - **尚無**針對 Express 路由的「學生 A 存取學生 B 資源應回 403/404」、「教師 A 存取教師 B 班級應回 403/404」、「跨身份打 `/api/admin/*` 全路由」自動化 HTTP 負向 IDOR 整合測試與 CI 閘門。

---

## 4. AuditLog 權限評估

針對 `AuditLog` 資料表設計與存取邊界逐項核對六大問題：

| 核對項目 | 審查事實與證據 | 風險與狀態 |
|---|---|---|
| **1. `app_runtime` 是否只有 `SELECT`、`INSERT` 權限？** | **只有文件規劃（尚待授權於 Supabase 實施）**。[`R14C20`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md#L41-L45) 規劃先授予業務表 DML，再立即執行 `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;`。後端程式碼全局檢索顯示 `backend/src/` 僅在 6 個檔案呼叫 `prisma.auditLog.create` 及 `admin.service.ts:185,195` 呼叫 `findMany`/`count`，**0 處** `update`/`delete`/`upsert`（僅 [`integration.db.test.ts:36`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts#L36) 測試清理 `afterAll` 含 `deleteMany`）。 | 程式碼：`已有證據`<br>Supabase 權限：`尚未實作` |
| **2. `UPDATE`、`DELETE`、`TRUNCATE` 是否確實被禁止？** | 本機 PG17 沙盒（R14-C-2-1）曾以臨時測試角色實證 ACL `REVOKE UPDATE, DELETE, TRUNCATE` 優先於 `BYPASSRLS`，觸發 `permission denied for table AuditLog`；**但在 Supabase 正式環境目前尚未建立角色與執行 `REVOKE`，現階段不具資料庫引擎層面強制力**。 | PG17 沙盒：`已測`<br>Supabase 正式：`尚待授權` |
| **3. 是否存在其他角色可以修改 `AuditLog` 的情況？** | **存在！**（1）`postgres`（Supabase 管理員/Superuser 等級）可對 `AuditLog` 執行任意 `UPDATE`/`DELETE`/`TRUNCATE` 甚至修改 ACL；（2）`migration_admin`（規劃為 `"AuditLog"` 之 **Table Owner**）亦自動保有 `ALL`（含 `UPDATE`/`DELETE`/`TRUNCATE` 與 `DROP TABLE`）能力。 | 設計固有邊界（需配合高權限憑證保管與操作稽核） |
| **4. `User` 刪除時，`ON DELETE SET NULL` 是否可能改變 `AuditLog` 的關聯欄位？** | **會！**[`schema.prisma:162`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma#L162) 定義 `user User? @relation(fields: [userId], references: [id], onDelete: SetNull)`。PostgreSQL 外鍵級聯由核心引擎以系統權限執行，即使對 `app_runtime` 收回 `UPDATE` 權限，一旦有人對 `"User"` 執行物理 `DELETE`，關聯的 `"AuditLog"."userId"` **仍會被改寫為 `NULL`**（R14-C-0.6 / R14-C-2-1 沙盒已實測證實）。目前後端業務程式採 `deletedAt` 軟刪除理念（[`authenticate.ts:62`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts#L62)、[`auth.service.ts:127`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L127)），且無任何業務 API 執行 `user.delete`。 | 技術邊界明確：若未來需完全防止級聯改寫，應保留軟刪除機制並考慮評估將外鍵改為 `Restrict`/`NoAction`（或透過 `REVOKE DELETE ON "User"` 防禦） |
| **5. 是否有保存必要操作者資訊的設計？** | **部分完整，存在 3 處缺口**：`AuditLog` 具備 `userId`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`。`USER_REGISTER`、`USER_LOGIN`、`LOGIN_FAILED`、`USER_LOGOUT`、`TEACHER_APPLICATION_*` 均有寫入 `details`（如申請人/Email/SessionId）。**但 [`auth.service.ts:273,312,365`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L273-L372) 的 `EMAIL_VERIFIED`、`PASSWORD_RESET_REQUESTED`、`PASSWORD_RESET_COMPLETED` 未填入 `details` 操作者快照**，一旦發生極端情況導致 `userId` 被 `SET NULL`，這 3 類日誌將無法回溯當事人帳號摘要。 | 建議補上非敏感操作者識別快照（如帳號 ID/遮罩後識別資訊）於 `details`（**尚待後續修正實作**） |
| **6. 是否應將 `AuditLog` 描述為「Runtime Append-only」，而不是宣稱絕對不可變更？** | **是，必須嚴格更正為「Runtime Append-only（對 `app_runtime` 執行期角色唯增唯讀）」**。不得宣稱「任何人都絕對無法竄改」，因為：`postgres`、`migration_admin`（Owner）仍具修改權限、物理刪除 `User` 仍會觸發 `ON DELETE SET NULL`，且目前 Supabase 正式環境尚未套用該 `REVOKE`。 | 定性確認：**應採用「Runtime Append-only」** |

---

## 5. Prisma / Express 與 Protected Route 授權檢查結果

### 5.1 全量後端 API、前端受保護路由與 Prisma 模型授權盤查總表

經全量檢索 [`backend/src/app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts) 掛載的所有路由模組（共計 **15 個實作端點**）、[`backend/scripts/create-admin.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/scripts/create-admin.ts)、前端 [`App.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx) 路由及 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 36 個業務模型，完整核對結果如下：

| API / 功能 | 使用者身分驗證 | 角色授權 | 資料所有權檢查 | IDOR 風險 | 測試證據與驗證層級 |
|---|---|---|---|---|---|
| `GET /api/health` (`app.ts:49-65`) | **N/A**（公開健康探針） | **N/A** | **N/A**（僅執行 `$queryRaw\`SELECT 1\``） | **無** | [`api.test.ts:10-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts#L10-L19)（*註：未於本唯讀階段實跑；不回傳任何業務資料*） |
| `GET /api/auth/csrf-token` (`auth.routes.ts:18`) | **N/A**（公開簽發 CSRF Token） | **N/A** | **N/A** | **無** | [`api.test.ts:23-33`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts#L23-L33)（同上，待連庫測試環境執行） |
| `POST /api/auth/register` (`auth.routes.ts:21-27`) | **N/A**（公開註冊＋速率限制＋CSRF） | **PASS**（後端寫死指派 `'STUDENT'`，[`auth.service.ts:34-61`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L34-L61)） | **PASS**（Zod `registerSchema` 剝除自訂 `role`/`isAdmin` 等欄位） | **無** | `已有程式碼證據` ＋ [`validation.test.ts:66-100`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/validation.test.ts#L66-L100)（本次離線實測通過；*備註：`emailProvider` 正式版目前為 `DisabledEmailProvider`*） |
| `POST /api/auth/login` (`auth.routes.ts:29-35`) | **PASS**（Email + bcrypt 驗密、阻擋 `deletedAt`/`SUSPENDED`/`DISABLED`） | **PASS**（由 DB 查出角色寫入回應與 Session） | **PASS**（僅建立所屬 `user.id` 之 Session） | **無** | [`api.test.ts:35-63`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts#L35-L63) ＋ [`security.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/security.test.ts)（離線密碼驗證通過） |
| `POST /api/auth/verify-email` (`auth.routes.ts:37-43`) | **PASS**（SHA-256 Token 雜湊驗證、過期/重複檢查；*缺點：未檢查 `user.deletedAt`/`status`*） | **N/A**（依 Token 對應使用者） | **PASS**（僅更新 `record.userId`） | **無** | `已有程式碼證據`（[`auth.service.ts:248-284`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L248-L284)），無獨立整合測試覆蓋 |
| `POST /api/auth/forgot-password` (`auth.routes.ts:45-51`) | **PASS**（防帳號枚舉統一回應） | **N/A** | **PASS**（僅對目標 `user.id` 建 Token，檢查 `deletedAt`） | **無** | `已有程式碼證據`（[`auth.service.ts:289-328`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L289-L328)），正式發信仍停用 |
| `POST /api/auth/reset-password` (`auth.routes.ts:53-59`) | **PASS**（SHA-256 Token 驗證＋密碼強度檢查＋廢止全部舊 Session；*缺點：未檢查 `user.deletedAt`/`status`*） | **N/A** | **PASS**（僅更新 `record.userId` 密碼與撤銷其 Session） | **無** | `已有程式碼證據`（[`auth.service.ts:333-376`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L333-L376)） |
| `POST /api/auth/logout` (`auth.routes.ts:62-64`) | **PASS**（`authenticate` + `csrfProtection`） | **N/A**（任何已登入者可登出自己） | **PASS**（僅更新 `where: { id: req.sessionId }`） | **無** | [`rbac-workflow.test.ts:204-229`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts#L204-L229)（僅記憶體單元模擬，HTTP 端未於本階段實測） |
| `GET /api/auth/me` (`auth.routes.ts:66-68`) | **PASS**（`authenticate`） | **PASS**（回傳 `user.roles` 來自 DB） | **PASS**（無 `:id` 參數，強制查 `req.user.id`） | **無** | `已有程式碼證據`（[`auth.service.ts:212-243`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L212-L243)） |
| `POST /api/teachers/applications` (`teacher.routes.ts:12-17`) | **PASS**（`router.use(authenticate)` + `csrfProtection`） | **PASS**（檢查不可重複成為 `TEACHER`；*備註：未限制必須先驗證信箱或排除 `ADMIN`*） | **PASS**（`userId` 強制取 `req.user!.id`，Zod `applyTeacherSchema` 僅收業務欄位） | **無** | [`validation.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/validation.test.ts) ＋ [`integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts)（需實庫執行） |
| `GET /api/teachers/my-application` (`teacher.routes.ts:19-21`) | **PASS**（`router.use(authenticate)`） | **N/A**（申請者皆為已登入使用者） | **PASS**（無 `:id` 參數，查詢條件為 `where: { userId: req.user!.id }`） | **無** | `已有程式碼證據`（[`teacher.service.ts:60-67`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.service.ts#L60-L67)） |
| `GET /api/admin/teacher-applications` (`admin.routes.ts:15-19`) | **PASS**（`authenticate`） | **PASS**（`requireRoles(['ADMIN'])`，相容 `PLATFORM_ADMIN`、阻擋 `SYSTEM_OPERATOR`/`TEACHER`/`STUDENT`） | **N/A**（管理員合法檢視全平台申請清單；*註：分頁未設 `limit` 最大值上限*） | **無**（非 ADMIN 全數 403） | [`rbac-workflow.test.ts:28-202`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts#L28-L202)（離線中介軟體測試通過） |
| `POST /api/admin/teacher-applications/:id/approve` (`admin.routes.ts:21-26`) | **PASS**（`authenticate` + `csrfProtection`） | **PASS**（`requireRoles(['ADMIN'])`） | **N/A**（管理員跨用戶授權核准；*缺點：未掛 `validateParams(applicationIdParamSchema)`、未禁止自審*） | **無**（限 ADMIN，但建議補齊 UUID 與防自審驗證） | [`rbac-workflow.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts) ＋ [`integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts)（需實庫） |
| `POST /api/admin/teacher-applications/:id/reject` (`admin.routes.ts:28-33`) | **PASS**（`authenticate` + `csrfProtection`） | **PASS**（`requireRoles(['ADMIN'])`） | **N/A**（管理員跨用戶退件；*缺點：未掛 `validateParams(applicationIdParamSchema)`*） | **無**（同上） | [`admin.service.ts:129-176`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.service.ts#L129-L176) |
| `GET /api/admin/audit-logs` (`admin.routes.ts:36-38`) | **PASS**（`authenticate`） | **PASS**（`requireRoles(['ADMIN'])`） | **N/A**（管理員全庫稽核讀取；*缺點：缺 `validateQuery` 與 `limit` 上限/負數防呆*） | **無**（但無分頁上限有大查詢 DoS 風險） | [`admin.controller.ts:68-82`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.controller.ts#L68-L82) |
| CLI：`create-admin.ts` (`backend/scripts/create-admin.ts`) | **N/A**（本機維運 CLI 工具） | **PASS**（本機手動執行授權建立） | **PASS** | **無** | `已有程式碼證據`（僅限授權管理維運環境） |
| 前端路由：`#learning-progress`、`#student-dashboard` (`App.tsx:53-70`) | **PASS**（包裹 `<ProtectedRoute>`） | **N/A**（所有登入角色） | **FAIL / 尚未實作**（前端僅為介面與示範資料，尚無對應後端個人學習數據 API） | **未確認**（待後端 API 開發） | [`App.tsx:53-70`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L53-L70) |
| 前端路由：`#teacher-dashboard` (`App.tsx:71-80`) | **PASS**（包裹 `<ProtectedRoute>`） | **PARTIAL / 設計缺陷**（`requiredRoles={['TEACHER', 'ADMIN']}` 混用角色，且未區分任課班級權限：DEF-04） | **FAIL**（[`TeacherDashboardPage.tsx:25-32`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx#L25-L32) 仍含硬編碼假學生名冊：DEF-03） | **未確認**（尚無班級後端 API） | [`POST_DATABASE_DEFERRED_TASKS.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/POST_DATABASE_DEFERRED_TASKS.md#L18-L19) |
| 前端路由：`#sources` / `import-system` (`App.tsx:81-82`) | **FAIL**（**無 `<ProtectedRoute>`**） | **FAIL**（無任何角色限制：DEF-01，任何人直連 `#sources` 可進入題庫管理系統頁） | **N/A**（目前為前端靜態清單） | **有（UI/路由越權暴露）** | `已有程式碼證據`（[`App.tsx:81-82`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L81-L82) 與 [`DEF-01`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/POST_DATABASE_DEFERRED_TASKS.md#L16) 一致） |
| 使用者資料 CRUD 完整性（`User` / `UserProfile` / `TeacherProfile` 更新與軟刪除） | **尚未實作**（僅註冊建立與 `getMe` 讀取） | **尚未實作** | **尚未實作** | **未確認**（未來新增時未實裝通用所有權守衛） | [`backend/src/modules/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts#L72-L76) 無 `/users` 模組 |
| 其餘 **27 個已建表業務模型**（班級、作業、公告、測驗、作答、術科、錯題、收藏、學習紀錄、AI 助教、弱點分析） | **尚未實作** | **尚未實作** | **尚未實作** | **未確認**（若上線給 `app_runtime BYPASSRLS` 後直接開發，極易產生 IDOR） | [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 已建 36 業務表（Phase 3-C-13 均為 0 rows），後端 API 為 **0 個** |

---

## 6. Realtime 設計與限制

綜合檢視 `frontend/`、`backend/src/`、Prisma Migrations 及 Phase 3-C-13 實測結果：

1. **正式環境目前是否真的需要 Realtime？**
   - **目前完全不需要（0 程式碼相依）**。全專案 `frontend/src/` 與 `backend/src/` 檢索 `realtime` 與 `@supabase/supabase-js` 結果皆為 **0 筆業務使用**。前端 [`api.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts) 完全透過 Express HTTP REST API + `credentials: 'include'`（HttpOnly Cookie）與後端通訊，不直連 Supabase PostgREST/Realtime。

2. **哪些資料表未來可能需要訂閱？**
   - 依 36 張業務表用途推估，未來若有即時互動需求，最可能涉及：**`Announcement` / `AnnouncementRead`**（即時公告通知）、**`ClassAssignment`**（派發新作業通知）、**`AIChatSession` / `AIChatMessage`**（AI 對話串流或跨裝置同步，但通常透過後端 SSE/WebSocket 更安全）、**`ExamAttempt`**（考試計時或監考事件，亦強烈建議由後端控制）。目前均為**尚未實作**。

3. **Publication 是否需要明確指定資料表？**
   - Phase 3-C-13 實測顯示 `PUBLICATION supabase_realtime` 屬性為 `puballtables = f`、`explicit_table_count = 0`（僅是 Supabase 新建專案時自動產生的空 Publication 殼）。若未來真的啟用 Supabase Realtime Postgres Changes，**必須明確白名單加入個別所需資料表**（禁止 `FOR ALL TABLES`，避免把 `Session`、`EmailVerificationToken`、`PasswordResetToken`、`AuditLog`、`User.passwordHash` 納入邏輯解碼發布流）。

4. **RLS 與 Realtime 訂閱的權限設計是否一致？**
   - **存在根本架構衝突，現階段完全不相容**！
   - Supabase Realtime Postgres Changes 的前端直連訂閱模型依賴 **Supabase JWT (`authenticated` / `anon` 角色) ＋ PostgreSQL RLS Policy** 來決定使用者能訂閱哪些資料列；然而本專案選擇的「Express 獨立認證（自建 HttpOnly Cookie Session，不走 Supabase Auth / GoTrue JWT）＋ **`app_runtime WITH BYPASSRLS` ＋ `0` 條 RLS Policies**」架構下，若前端未來想直接訂閱 Supabase Realtime，將因 **0 條 RLS Policies 且無 Supabase Auth JWT** 而被預設拒絕（收不到資料），或因倉促補開寬鬆 Policy 而造成嚴重資安外洩！因此若未來需要即時功能，應優先考慮由 **Express 後端驗證權限後透過後端 SSE / WebSocket 推送**，而非直接暴露資料庫 Realtime 給前端。

5. **`wal_level = replica` 是本機沙盒限制，還是有正式環境證據支持的設定？**
   - **`wal_level = replica` 是 Phase 3-C-13 本機 Docker PG17.11 沙盒容器的預設參數限制，並不代表 Supabase 正式環境的設定**。在沙盒中因 `wal_level = replica` 無法建立 Logical Replication Slot 實測 CDC；而**正式環境 Supabase 的實際 `wal_level`、Publication 運作及連線限制在本階段屬於「尚未連線驗證（禁止連線）」**，不可將沙盒數值推論為正式環境現況。

6. **是否有必要延後 Realtime，先完成一般資料庫功能？**
   - **強烈建議立即定案：全面延後 Realtime**。應先完成一般核心業務（27 張業務表之後端 API、應用層所有權檢查與負向 IDOR 自動化測試、角色與最小權限驗證），未來若有即時需求再於 Phase 4+ 獨立進行安全架構評審（並評估採後端 SSE/WebSocket 取代前端直連 Realtime）。

---

## 7. 已完成項目（Strictly Verified）

以下僅列出確實有程式碼、檔案、PG17 沙盒實證或本機測試輸出支撐的成果（**不含任何假想或未驗證的 Supabase 雲端狀態**）：

1. **資料庫結構與本機還原驗證**：
   - [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 與 2 支 Migration 完成 36 張業務表 ＋ `_prisma_migrations` 定義；Phase 3-C-13 證實已成功加密備份並還原至本機 PG17.11 沙盒 `code_to_know_c2kb_prod_restore_clean_v2`（37 表、37 PK、47 已驗證 FK、133 有效索引、1 CHECK、1 Enum、0 筆非預期差異）。
2. **連線安全與環境隔離程式碼實作**：
   - [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 完成開發/測試/雲端 Runtime/Migration 四條連線守門函式，鎖定 Project Ref `ypibmyfxfhsyfdwxprpi`、Pooler Host、Port（Runtime 限 `5432/6543`，Migration 禁 `6543`）、SSL 模式與角色名稱隔離（`app_runtime` vs `migration_admin`）。
   - [`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts) 完成正式環境 Root CA（`prod-supabase-ca.crt`）載入與 `rejectUnauthorized: true` 設定。
   - [`env.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/env.ts) 完成 `production` 必要變數檢驗（`SESSION_SECRET >= 32`、HTTPS Origin 等）。
   - 本階段離線實跑 `db-config-safety.test.ts` + `database-ssl-config.test.ts` + `rbac-workflow.test.ts` + `security.test.ts` + `validation.test.ts`：**`5` 個測試檔共 `100` 項測試全數通過（Exit Code `0`）**。
3. **既有認證 / 教師申請 / 管理員核心 API 之基礎防護**：
   - [`auth`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.routes.ts)、[`teachers`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.routes.ts)、[`admin`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts) 三個已實作模組具備 HttpOnly Session Cookie、SHA-256 Token 雜湊、Double-submit CSRF、Zod Body 驗證、Rate Limit、`requireRoles(['ADMIN'])` 角色守衛，且無已知一般使用者 IDOR 查詢路徑。
4. **安全規格與 PG17 沙盒角色模型驗收文件**：
   - R14-C-2-1／R14-C-2-2 已於本機 PG17 沙盒驗證 `BYPASSRLS` 不會繞過 `Table ACL`、`REVOKE UPDATE/DELETE/TRUNCATE ON "AuditLog"` 的執行期效果、7 步受控回滾機制及去除 `DROP OWNED BY` 與 Sequence `UPDATE`。

---

## 8. 未完成項目

1. **雲端資料庫正式權限與角色實施（全部 `尚未實作` / `尚待授權`）**：
   - Supabase 正式環境尚未建立 `app_runtime` 與 `migration_admin`、尚未移轉 37 表/`AnnouncementStatus`/`public` Owner、尚未授予業務表 DML 與 `REVOKE` `"AuditLog"`/`_prisma_migrations` 權限、尚未設定 `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin`。
2. **版本化可執行切換與回滾 SQL 腳本（`只有文件規劃`，尚未收斂成腳本）**：
   - Repo 內不存在獨立的 `roles_cutover.sql` 與 `roles_rollback.sql`，且文件對 `LOGIN`/`NOLOGIN`、Sequence `UPDATE` 及業務表清單存在矛盾。
3. **雲端真實網路 / Supavisor / Migration 實測（`尚未測試`）**：
   - 尚未實測透過 `aws-0-ap-southeast-2.pooler.supabase.com` 以 `app_runtime.ypibmyfxfhsyfdwxprpi` 登入（確認 Supavisor 支援自訂 PG 角色）。
   - 尚未實測 `migration_admin` 連線執行 `prisma migrate status` / `deploy`（以及測試 `public` schema `rls_auto_enable` 事件觸發器於 `migration_admin` 建表時是否正常運作與不報錯）。
   - 尚未實測 Render Production TLS 實機連線與 Node `pg.Pool` 穩定性。
4. **業務後端與資料隔離基礎建設（`尚未實作`）**：
   - Schema 中其餘 **27 個業務模型**（班級、作業、題庫、測驗、作答、術科、錯題、AI 助教、公告等）後端 API 全部尚未開發。
   - 後端尚缺「通用資料所有權校驗 Helper / Repository 規範」與「真實 HTTP + DB + `app_runtime` 角色下的跨租戶負向 IDOR 自動化整合測試套件」。
5. **既有前後端小規模授權與驗證缺口（`已發現但尚未修復`）**：
   - [`App.tsx:81-82`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L81-L82) `#sources`（`import-system`）未設 `<ProtectedRoute requiredRoles={['ADMIN']}>`（DEF-01）。
   - `admin.routes.ts` 未套用 `applicationIdParamSchema`，`/audit-logs` 未設 `validateQuery` 與分頁上限。
   - 郵件發送服務（`DisabledEmailProvider`，DEF-10）、過期 Session/Token 清理排程（R9）尚未實作。

---

## 9. 必須先修正的問題

在申請正式 Supabase 角色建立與任何正式切換前，必須依優先順序完成以下修正：

### P0（正式角色建置與切換前必改）

1. **修正文件 DDL 的 `NOLOGIN` 致命錯誤並產出單一權威 `.sql` 腳本**：
   - 必須將正式建立 SQL 統一修正為 **`WITH LOGIN PASSWORD ... NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`**（`app_runtime` 加 `BYPASSRLS`；`migration_admin` 維持 `NOBYPASSRLS`），徹底校正 R14-C-2-2 文件殘留沙盒 `NOLOGIN` 造成的不可連線錯誤。
   - 將「建立角色、移轉所有權（Table / Sequence / Enum / `public` Schema）、設定 ACL（含 `AuditLog` Append-Only 與 `_prisma_migrations` 隔離）、設定 `DEFAULT PRIVILEGES`（Sequence 僅 `USAGE, SELECT`）」與對應「7 步受控回滾＋依賴斷言檢查」整理為經靜態審查且與 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 37 表完全一致的標準 `.sql`（或經核准之執行手冊），先在本機 PG17 沙盒以 **`LOGIN` 帳號實際透過 psql 與 Prisma 連線實測通過**（不可再用 `postgres` + `SET ROLE` 代替真實連線測試）。
2. **修補 [`admin.routes.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts) 參數與分頁防呆缺口**：
   - 於 `approve` / `reject` 路由掛載已存在的 `validateParams(applicationIdParamSchema)`，並在服務層防止管理員自我審核。
   - 為 `GET /api/admin/audit-logs` 與 `GET /api/admin/teacher-applications` 補齊嚴格分頁檢驗（`page >= 1`, `1 <= limit <= 100`，阻絕 `NaN` / 負數 / 超大 `limit` 造成查詢錯誤或資源耗盡）。
3. **補齊 [`auth.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts) 之帳號狀態與稽核細節缺口**：
   - `verifyEmail` 與 `resetPassword` 在寫入資料庫前必須檢查 `record.user.deletedAt !== null || status === 'SUSPENDED' || status === 'DISABLED'`。
   - 為 `EMAIL_VERIFIED`、`PASSWORD_RESET_REQUESTED`、`PASSWORD_RESET_COMPLETED` 的 `AuditLog.details` 補入事件標的識別快照，降低極端情況下若 `userId` 被 `ON DELETE SET NULL` 時的可追溯損失。

### P1（開放給正式用戶前與擴充 27 個業務模型前必改）

4. **關閉前端 `#sources` (`import-system`) 未保護缺口（DEF-01）並拆清角色權限（DEF-03 / DEF-04）**：
   - 依授權計畫為 `import-system` 加上管理員路由保護，避免訪客直接藉由 URL Hash 存取管理/題庫匯入頁面；將 `TeacherDashboardPage` 假資料清理並落實 `TEACHER` 與 `ADMIN` 職責分離。
5. **為 `BYPASSRLS` 架構建立程式碼級資料所有權護欄與負向 IDOR CI 測試**：
   - 在開發剩餘 27 個業務模型前，定義統一後端 Ownership/Tenant 檢查工具函式與整合測試範本：每個涉及私有或班級資源的端點都必須在 **以 `app_runtime` 連線的真實測試 DB** 中執行負向測試（學生 A 讀取/修改/刪除學生 B 資源 -> 必為 `403`/`404`；教師 A 存取非本人建立之班級 -> 必為 `403`/`404`）。

---

## 10. 正式環境操作前置條件（Section 三.F）

正式 Supabase 角色建立、權限切換或 Render 上線前，**以下 9 項前置條件必須全部滿足且逐項留存可驗證證據**；目前狀態標記如下：

| 前置條件 | 具體驗收標準 | 目前實際狀態 |
|---|---|---|
| **1. 最新正式備份** | 於正式切換前執行即時 Supabase `pg_dump`（或已確認該基準備份之後無任何雲端 DDL/DML 變動；若距上次備份時間過久或曾有連線變動，必須重拉切換前最新備份） | **尚未執行切換前即時備份**（現有備份為先前記錄點，Phase 3-C-14 未連線確認目前雲端是否有後續變動） |
| **2. 最新備份加密與 SHA-256 驗證** | 備份完成後以正式保管的 32-byte AES-256-GCM 主金鑰加密（AuthTag 完整）並產出/比對明文與密文雙重 SHA-256 指紋 | **現有舊備份已驗證；切換前最新備份尚未執行**（另 KeePassXC / 主金鑰實物就緒度未於本階段解密驗證） |
| **3. 最新備份還原驗收** | 將切換前最新加密備份解密後於本機 PG17.11 沙盒獨立庫還原（Exit Code `0`、37 表與筆數/約束/索引完全一致） | **舊備份於 Phase 3-C-12/13 已驗收；切換前最新備份尚待執行** |
| **4. 角色與物件權限設計** | 定版唯一權威 `.sql`（改正為 `WITH LOGIN`、Sequence 僅 `USAGE, SELECT`、`public` 與 37 表及 `AnnouncementStatus` Owner 移轉至 `migration_admin`、禁止 `app_runtime` 成員繼承），並於 PG17 沙盒以 **`LOGIN` 真實連線身份**重測通過 | **存在文件矛盾且缺定版 `.sql`，尚未重測真實 `LOGIN` 連線** |
| **5. RLS / BYPASSRLS 安全決策** | 正式確認採「Express 應用層隔離 ＋ `app_runtime WITH BYPASSRLS` ＋ Table ACL」並凍結 Frontend 直連 Supabase 與未經審查的新端點（另確認 `rls_auto_enable` Event Trigger 對 `migration_admin` 建立新表時之執行權限相容性） | **方向已決議，但配套程式碼缺陷修復與 `migration_admin` 觸發 `rls_auto_enable` 相容性尚未實測** |
| **6. AuditLog 權限** | `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;` 納入定版腳本並確認僅定位為「Runtime Append-only」，且補齊業務軟刪除與日誌快照防線 | **PG17 模擬已測；正式庫尚待授權套用，日誌細節缺口待補** |
| **7. Migration 回復計畫** | 準備完整 7 步受控回滾 `.sql`（含斷連線、收回 Default Privileges/ACL、歸還 Owner 至 `postgres`、依賴斷言為 `0`、安全 `DROP ROLE`），並於 PG17 沙盒驗證一次切換＋回滾閉環 | **規劃完整且無 `DROP OWNED BY`，待與 `LOGIN` 版切換腳本同步實測一次** |
| **8. Render 連線切換計畫** | 確認 Render Web Service 環境變數僅配置 `DATABASE_URL`（`app_runtime.<ref>` @ Session/Tx Pooler ＋ `sslmode=require`）、高熵 `SESSION_SECRET`（>=32）、HTTPS `CORS_ORIGIN`/`FRONTEND_URL`，嚴禁配置 `DIRECT_URL` 或 `postgres`；Frontend 與 Backend 分階段切換與舊設定保留方案就緒 | **設計與 `db-validation.ts` 已就緒，正式平台變數寫入與切換演練尚未執行（尚待授權）** |
| **9. 連線驗證與故障回復計畫** | 事先定義測試驗證腳本：驗證 Supavisor 對 `app_runtime.<project_ref>` 認證、TLS CA 握手、`/api/health` 回傳 200、以 `app_runtime` 測試寫入 `AuditLog` 成功且 `UPDATE/DELETE` 必敗；若任一異常則立即切回舊連線並啟動第 7 項受控回滾 | **尚未於 Supabase / Render 測試，故障演練計畫待彙整進單一 Runbook** |

---

## 11. 建議下一階段

在**未觸碰 Supabase 正式環境與 Render 正式服務**的前提下，建議依序推進以下安全且務實的下一階段工作：

1. **Phase 3-C-15（授權後可執行，零雲端影響）：「正式角色切換／回滾定版 SQL 與既有前後端授權缺口修復」**
   - 產出單一版本控管的切換 SQL 與受控回滾 SQL（修正 `WITH LOGIN`、剔除 Sequence `UPDATE`、納入 `pg_shdepend` 依賴斷言）。
   - 在本機 Docker PG17 沙盒 `code_to_know_c2kb_prod_restore_clean_v2`（或另建沙盒驗證庫）中，**真實以 `app_runtime` 與 `migration_admin` 的帳密連線**實測 Prisma Client 與 `prisma migrate deploy`（含測試在 `ENABLE ROW LEVEL SECURITY` ＋ `0` Policy 狀態下模擬 `rls_auto_enable` 行為）。
   - 修補本報告第 9 節列出的後端驗證與狀態檢查缺口（`admin` 參數/分頁驗證、`verifyEmail`/`resetPassword` 帳號狀態檢查、`AuditLog.details` 快照）及 DEF-01 `#sources` 路由保護，並補齊「以 `app_runtime` 帳號對真實 Express HTTP 路由進行正負向 RBAC/CSRF 測試」。
2. **後續雲端操作順序（均須使用者逐項明確授權後始得啟動）**：
   - **授權階段 A**：確認切換前即時加密備份與 KeePassXC 主金鑰就緒度 → 沙盒最新還原通過。
   - **授權階段 B**：於 Supabase 正式環境建立 `migration_admin` 與 `app_runtime`（先驗證 Supavisor Pooler 自訂角色登入相容性！）→ 執行所有權移轉與 ACL / Default Privileges → 執行唯讀與非破壞性驗收。
   - **授權階段 C**：Render 環境變數切換與受控上線驗證；其餘 **27 個業務模型 API 尚未開發完成前，不得開放完整業務功能上線**。

---

## 12. 最終 GO / CONDITIONAL GO / NO-GO 判定

### 最終判定：**`NO-GO`（對於立即進行 Supabase 正式角色建置與 Render 正式連線切換，維持嚴格阻斷）**

#### 嚴格遵循五大判定原則之獨立核對聲明

1. **本機測試通過 ≠ 正式 Supabase 已驗證**：
   - 今日離線實測通過的 5 支測試套件（100/100）與 Phase 3-C-12/13 的 PG17 沙盒還原（`--no-owner --no-acl`），均**未**驗證真實 Supabase 雲端上的 Supavisor 自訂角色認證、`rls_auto_enable` 事件觸發器與實際網路 TLS 握手。
2. **RLS 已開啟 ≠ 使用者資料已隔離**：
   - Phase 3-C-13 證實的 `37/37` 表 `ENABLE ROW LEVEL SECURITY` 在 **`0` 條 Policies** 與 **`app_runtime WITH BYPASSRLS`** 設計下，不提供任何列級資料隔離保護。
3. **`BYPASSRLS` ≠ 資料庫本身會替使用者隔離資料**：
   - 採用 `BYPASSRLS` 代表跨使用者資料隔離 **100% 取決於 Express/Prisma 程式碼正確性**；目前僅實作 9/36 業務模型且尚無共用所有權守衛及負向 IDOR 整合測試，未來開發 27 個新模型時若無CI防線將面臨直接越權風險。
4. **`AuditLog` Append-only ≠ 任何管理者都無法修改**：
   - 正確安全定位應為 **「Runtime Append-only（對 `app_runtime` 唯增唯讀）」**；`postgres` 與作為 Owner 的 `migration_admin` 仍具完全修改與刪除能力，且對 `User` 的物理刪除會透過 `ON DELETE SET NULL` 改寫 `AuditLog.userId`。
5. **`PUBLICATION supabase_realtime` 存在 ≠ 訂閱功能已經正常**：
   - `supabase_realtime` 目前 `explicit_table_count = 0`，本機 PG17 沙盒 `wal_level = replica` 亦不支援 Logical Replication；且全站前後端 0 處使用 Realtime，該架構亦與 `BYPASSRLS`＋無 Supabase Auth JWT 衝突，現階段應明確延後 Realtime。

**結論總結**：本階段審查報告已完成交付並嚴格維持 100% 唯讀狀態，**立即停止並等待專案負責人審閱，絕不自行進入 Supabase 角色建立或 Render 連線切換。**
