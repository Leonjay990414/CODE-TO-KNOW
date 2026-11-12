# CODE TO KNOW｜Phase 3-C-17：後端 P0/P1 安全缺口修補與 `app_runtime` 整合測試報告

- **階段名稱**：Phase 3-C-17：後端 P0/P1 安全缺口修補與 `app_runtime` 整合測試
- **日期**：2026-11-11
- **執行分支與基準 HEAD**：`main` (`86a0f1116693bcce476b8747a446900d54b29a4a`)
- **正式環境影響**：**零連線、零修改**（未連線 Supabase，未修改 PG16 開發庫，未修改既有 PG17 還原沙盒 `code_to_know_pg17_restore_sandbox`）

---

## 1. 執行摘要

本階段針對 Phase 3-C-14 / 3-C-15 / 3-C-16B 盤點之應用層 P0/P1 安全缺口執行本機程式碼修補、自動化測試與獨立 PG17.11 `app_runtime` 權限整合驗證：

1. **Admin `:id` 參數校驗與安全防護**：於 [`admin.routes.ts`](../backend/src/modules/admin/admin.routes.ts) 將 [`applicationIdParamSchema`](../backend/src/modules/admin/admin.schema.ts) 掛載至 `POST /api/admin/teacher-applications/:id/approve` 與 `/reject`，阻擋非 UUID 識別碼，同時在 [`admin.service.ts`](../backend/src/modules/admin/admin.service.ts) 檢查申請人帳號未被刪除、凍結或停用。
2. **AuditLog 與管理端分頁／敏感資訊防護**：新增 [`listAuditLogsQuerySchema`](../backend/src/modules/admin/admin.schema.ts) 並強化 [`listApplicationsQuerySchema`](../backend/src/modules/admin/admin.schema.ts)，嚴格限制 `page >= 1`、`1 <= limit <= 100`；於 [`audit.ts`](../backend/src/utils/audit.ts) 建立 [`sanitizeAuditDetails`](../backend/src/utils/audit.ts) 遞迴遮罩敏感鍵值與連線字串密碼，並在 [`admin.service.ts`](../backend/src/modules/admin/admin.service.ts) 寫入與讀取雙向套用。
3. **Auth 憑證生命週期與帳號狀態雙重驗證**：於 [`auth.service.ts`](../backend/src/modules/auth/auth.service.ts) 的 `verifyEmail` 與 `resetPassword` 強制檢查使用者存在、`deletedAt === null` 及帳號狀態（阻擋 `SUSPENDED`、`DISABLED`；`resetPassword` 僅允許 `ACTIVE`），並透過互動式交易原子化核銷單次 Token；`requestPasswordReset` 亦對停權／停用／軟刪除帳號靜默不簽發 Token 且不揭露帳號狀態。
4. **前端 `#sources` 路由保護**：於 [`App.tsx`](../frontend/src/app/App.tsx) 將 `case 'import-system'`（對應 `#sources` / `#import-system` / `#question-bank`）納入 [`ProtectedRoute`](../frontend/src/components/ProtectedRoute.tsx) `requiredRoles={['ADMIN']}` 保護，並於 [`ProtectedRoute.tsx`](../frontend/src/components/ProtectedRoute.tsx) 支援 `ADMIN` / `PLATFORM_ADMIN` 相容擴展（嚴格排除 `SYSTEM_OPERATOR`）。
5. **可重複使用 Ownership Helper 與全 36 模型盤點**：建立 [`ownership.ts`](../backend/src/utils/ownership.ts)，實作 [`resolveScopedUserId`](../backend/src/utils/ownership.ts)、[`assertResourceOwnership`](../backend/src/utils/ownership.ts)、[`assertNestedOwnership`](../backend/src/utils/ownership.ts)、[`buildOwnedWhere`](../backend/src/utils/ownership.ts)、[`rejectForgedOwnerFields`](../backend/src/utils/ownership.ts) 與涵蓋全部 36 個 Prisma 模型的 [`PRISMA_MODEL_OWNERSHIP_INVENTORY`](../backend/src/utils/ownership.ts)，並將偽造 `userId` 防護套用至 [`teacher.routes.ts`](../backend/src/modules/teachers/teacher.routes.ts)。
6. **獨立 PG17.11 `app_runtime` 實測**：啟動獨立臨時 PG17.11 容器執行 [`app-runtime.db.test.ts`](../backend/tests/app-runtime.db.test.ts)，驗證最小權限運行角色 DML、DDL 阻擋（`42501`）、`_prisma_migrations` 阻擋（`42501`）、`AuditLog` append-only（僅 `SELECT`/`INSERT`，阻擋 `UPDATE`/`DELETE`/`TRUNCATE`）及完整 API/IDOR 流程，測試完畢後已清除臨時容器與匿名 Volume。

---

## 2. Git 與環境起始狀態確認

- **Git Branch**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（無 commit/push/reset/rebase）
- **保留既有工作目錄變更**：完整保留先前記錄之 BOM 防護變更（`.editorconfig`、`scripts/database/*`、`docs/DATABASE_PHASE3C11*` ~ `3C16B*` 等未提交檔案）。
- **既有資料庫狀態**：
  - `code_to_know_postgres`（PG16，`127.0.0.1:5432`）：全程未修改。
  - `code_to_know_pg17_restore_sandbox`（PG17.11，`127.0.0.1:5433`）及 `code_to_know_c2kb_prod_restore_clean_v2` 等還原資料庫：全程未修改。

---

## 3. 安全缺口盤點對照（P0 / P1 / P2）

| 等級 | 缺口項目 | 盤點前實碼狀況 | 本階段處理狀態 |
|---|---|---|---|
| **P0** | Data Ownership / IDOR 基礎防護機制 | 多數業務模型尚未建立共用 Ownership Helper；`/api/teachers/*` 依賴 Zod strip 忽略額外欄位，缺乏明確跨帳號 `userId` 拒絕檢核與 36 模型統一規範 | **已修補**：新增 [`ownership.ts`](../backend/src/utils/ownership.ts) 並覆蓋 36 模型；`/api/teachers/*` 掛載 `rejectForgedOwnerFields(['userId'])` |
| **P0** | Admin `:id` 參數未掛載 UUID 校驗 | [`admin.schema.ts`](../backend/src/modules/admin/admin.schema.ts) 已定義 `applicationIdParamSchema`，但 [`admin.routes.ts`](../backend/src/modules/admin/admin.routes.ts) 的 `/approve` 與 `/reject` 未掛載 `validateParams` | **已修補**：已掛載 `validateParams(applicationIdParamSchema)` |
| **P1** | `GET /api/admin/audit-logs` 分頁與敏感資訊防護缺失 | 無 `validateQuery`，未限制 `limit` 上界；`listApplicationsQuerySchema` 的 `parseInt` 接受 `NaN`/負數/超大值；`AuditLog.details` 原樣回傳 | **已修補**：新增 `listAuditLogsQuerySchema`、修正 `listApplicationsQuerySchema`、加入 `normalizePagination` 與 `sanitizeAuditDetails` |
| **P1** | `verifyEmail` / `resetPassword` 未檢查帳號狀態與 `deletedAt` | [`auth.service.ts`](../backend/src/modules/auth/auth.service.ts) 只檢查 Token 存在/未使用/未過期，未檢查使用者 `deletedAt` 或 `SUSPENDED`/`DISABLED` | **已修補**：加入 `assertAccountPermitsTokenAction`、交易內原子化單次 Token 更新與 `requestPasswordReset` 停權靜默阻擋 |
| **P1** | 前端 `#sources` 路由未受管理員權限保護 | [`App.tsx`](../frontend/src/app/App.tsx) `case 'import-system'` 未包覆 `<ProtectedRoute>` | **已修補**：以 `<ProtectedRoute requiredRoles={['ADMIN']} ...>` 保護，並於 [`ProtectedRoute.tsx`](../frontend/src/components/ProtectedRoute.tsx) 補強 `ADMIN`/`PLATFORM_ADMIN` 相容檢查 |
| **P2** | `AuditLog` details 結構與管理員自審 / CSP / Rate Limiter | `AuditLog` append-only ACL 需於 DB 層落實；Rate Limiter 目前為單體記憶體儲存；前端 CSP 由託管層設定 | **部分緩解＋持續追蹤**：`AuditLog` 敏感遮罩與 DB append-only 已驗證；其餘列為第 11 節追蹤項目 |

---

## 4. Admin API 參數與權限修補結果

- **修補檔案**：
  - [`backend/src/modules/admin/admin.routes.ts`](../backend/src/modules/admin/admin.routes.ts)
  - [`backend/src/modules/admin/admin.schema.ts`](../backend/src/modules/admin/admin.schema.ts)
  - [`backend/src/modules/admin/admin.controller.ts`](../backend/src/modules/admin/admin.controller.ts)
  - [`backend/src/modules/admin/admin.service.ts`](../backend/src/modules/admin/admin.service.ts)
- **重點變更**：
  1. `POST /api/admin/teacher-applications/:id/approve` 與 `/reject` 均加上 `validateParams(applicationIdParamSchema)`。
  2. 申請審核前檢查目標申請人 `deletedAt == null` 且狀態非 `SUSPENDED` / `DISABLED`。
  3. 維持全路由 `authenticate` + `requireRoles(['ADMIN'])`（允許相容之 `PLATFORM_ADMIN`，拒絕 `STUDENT`、`TEACHER` 與 `SYSTEM_OPERATOR`）。
- **自動化驗證（[`backend/tests/admin-hardening.test.ts`](../backend/tests/admin-hardening.test.ts)）**：
  - 未登入存取 → `401`
  - `STUDENT`、`TEACHER`、`SYSTEM_OPERATOR` → `403 INSUFFICIENT_PERMISSIONS`
  - 非法 `:id`（如 `not-a-uuid`、`12345`、`%20`）→ `400 VALIDATION_ERROR`
  - 缺少 `:id` 路徑（`//approve`）→ `404 NOT_FOUND`
  - 不存在之合法 UUID → `404 NOT_FOUND`
  - 合法 UUID + `ADMIN` / `PLATFORM_ADMIN` → `200`

---

## 5. AuditLog 分頁、效能與敏感資訊防護結果

- **分頁防護**：
  - [`createPositiveIntQuerySchema`](../backend/src/modules/admin/admin.schema.ts) 使用正則 `/^\d+$/` 與 Zod integer range (`page`: `1..10000`；`limit`: `1..100`)，直接攔截負數、`0`、小數、非數字字串與超過 `100` 的 `limit` 請求（回傳 `400 VALIDATION_ERROR`）。
  - [`admin.service.ts`](../backend/src/modules/admin/admin.service.ts) 額外透過 `normalizePagination` 在服務層保底限制上限 `MAX_ADMIN_PAGE_LIMIT = 100`。
- **敏感資訊防護**：
  - [`backend/src/utils/audit.ts`](../backend/src/utils/audit.ts) 提供 [`sanitizeAuditValue`](../backend/src/utils/audit.ts) 與 [`sanitizeAuditDetails`](../backend/src/utils/audit.ts)，遞迴遮罩 `password`、`token`、`secret`、`apiKey`、`privateKey`、`credential`、`cookie`、`session`、`authorization`、`hash` 等敏感欄位，並遮罩內嵌之 `postgresql://user:pass@` 及 `Bearer ...` 字串為 `[REDACTED]`。
  - 寫入端（`logAuditEvent`）與讀取端（`adminService.listAuditLogs`）雙向套用，同時 `listAuditLogs` 僅選取必要 `AuditLog` 與 `user` 安全欄位（`id`, `email`, `displayName`）。
- **資料庫 ACL 配合**：`c2k_test_app_runtime` 對 `AuditLog` 僅具備 `SELECT` 與 `INSERT` 權限，無 `UPDATE` / `DELETE` / `TRUNCATE`。

---

## 6. AuthService 帳號狀態與生命週期驗證修補結果

- **修補檔案**：[`backend/src/modules/auth/auth.service.ts`](../backend/src/modules/auth/auth.service.ts)
- **重點變更**：
  1. 新增 `assertAccountPermitsTokenAction(user, action)`：
     - 若 `!user || user.deletedAt !== null` 或 `user.status` 為 `SUSPENDED` / `DISABLED`，拋出 `403 ACCOUNT_DISABLED`。
     - `verifyEmail` 允許 `ACTIVE` 與 `PENDING_VERIFICATION`（驗證成功後將 `PENDING_VERIFICATION` 轉為 `ACTIVE`）。
     - `resetPassword` 嚴格僅允許 `ACTIVE` 帳號執行（阻擋 `SUSPENDED`、`DISABLED`、`PENDING_VERIFICATION`）。
  2. `verifyEmail` 與 `resetPassword` 改採互動式 `prisma.$transaction` 與原子條件 `updateMany({ where: { id: record.id, usedAt: null }, ... })`，杜絕單次 Token 併發重放。
  3. `requestPasswordReset` 若命中軟刪除、`SUSPENDED` 或 `DISABLED` 帳號，不建立 `PasswordResetToken` 亦不寄信，仍回傳一致通用訊息防止帳號與狀態枚舉。
  4. 稽核事件僅寫入 `userId` 與時間／旗標，絕不將 Token 或密碼寫入錯誤訊息或日誌。
- **自動化驗證（[`backend/tests/auth-lifecycle.test.ts`](../backend/tests/auth-lifecycle.test.ts)）**：共 6 項測試全數通過。

---

## 7. 前端 `#sources` 路由保護修補結果

- **修補檔案**：
  - [`frontend/src/app/App.tsx`](../frontend/src/app/App.tsx)
  - [`frontend/src/components/ProtectedRoute.tsx`](../frontend/src/components/ProtectedRoute.tsx)
- **重點變更**：
  1. `case 'import-system'`（對應 `#sources`、`#import-system`、`#question-bank`）已使用 `<ProtectedRoute requiredRoles={['ADMIN']} pageTitle="官方證照題庫匯入與解析管理系統" ...>` 包覆，未登入或非管理員身分時不會渲染 [`QuestionBankImportSystemPage`](../frontend/src/pages/public/QuestionBankImportSystemPage.tsx)。
  2. 新增 [`expandCompatibleFrontendRoles`](../frontend/src/components/ProtectedRoute.tsx) 對應 `ADMIN` ↔ `PLATFORM_ADMIN` 相容性，並明確排除 `SYSTEM_OPERATOR`。
  3. 當權限為僅限管理員之路由時，未登入卡片顯示「管理員專區 · 存取限制」提示；403 提示頁正確顯示「平台管理員」標籤。
- **自動化驗證（[`frontend/tests/sources-route-protection.test.tsx`](../frontend/tests/sources-route-protection.test.tsx)）**：共 7 項測試驗證未登入、`STUDENT`、`TEACHER`、`SYSTEM_OPERATOR`、`ADMIN`、`PLATFORM_ADMIN` 與 hash 解析，全數通過。

---

## 8. 後端 Ownership Helper 與全 36 Prisma 模型清單

已於 [`backend/src/utils/ownership.ts`](../backend/src/utils/ownership.ts) 建立共用 Ownership Helper 與完整 36 模型清單（`PRISMA_MODEL_OWNERSHIP_INVENTORY`），並由單元測試動態比對 `backend/prisma/schema.prisma` 確認零遺漏。

### Admin Override 規則定義
- `allowAdminOverride` **預設為 `false`**（Fail-Closed），除非業務端點明確啟用。
- 僅 `ADMIN` 與 `PLATFORM_ADMIN` 可執行授權內之教學／管理資源 Override。
- `SYSTEM_OPERATOR` 僅負責系統基礎維運，**明確排除於學生與教學資料 Ownership Override 之外**。
- 用戶端在 `req.body` 或 `req.query` 傳入之 `userId` 絕不作為授權依據；`resolveScopedUserId` 與 `rejectForgedOwnerFields` 對跨帳號 `userId` 偽造一律回傳 `403 OWNERSHIP_FORBIDDEN`。

### 36 個 Prisma 模型 Ownership 與實作狀態清查

| # | 模型 | Ownership 策略 | 歸屬欄位 / 關聯路徑 | 後端業務 API 狀態 |
|---|---|---|---|---|
| 1 | `User` | `USER_SELF` | `id` | **IMPLEMENTED** (`/api/auth/*`) |
| 2 | `Role` | `ADMIN_MANAGED_CATALOG` | 目錄表（無單一擁有者） | **IMPLEMENTED** (註冊/核准指派) |
| 3 | `UserRole` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (`/api/auth/me`, Admin 核准) |
| 4 | `UserProfile` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (註冊建立) |
| 5 | `Session` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (`authenticate`, logout/reset) |
| 6 | `TeacherApplication` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (`/api/teachers/*`, `/api/admin/*`) |
| 7 | `EmailVerificationToken` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (`verifyEmail`) |
| 8 | `PasswordResetToken` | `DIRECT_USER_ID` | `userId` | **IMPLEMENTED** (`requestPasswordReset`, `resetPassword`) |
| 9 | `AuditLog` | `ADMIN_ONLY` | `userId`（稽核參照） | **IMPLEMENTED** (`/api/admin/audit-logs`, append-only) |
| 10 | `Announcement` | `ADMIN_MANAGED_CATALOG` | `authorId` (管理端) | **NOT IMPLEMENTED** |
| 11 | `AnnouncementRead` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 12 | `Certification` | `ADMIN_MANAGED_CATALOG` | 公開證照目錄 | **NOT IMPLEMENTED** |
| 13 | `Subject` | `ADMIN_MANAGED_CATALOG` | `certificationId -> Certification` | **NOT IMPLEMENTED** |
| 14 | `Question` | `ADMIN_MANAGED_CATALOG` | `subjectId -> Subject` | **NOT IMPLEMENTED** |
| 15 | `QuestionOption` | `ADMIN_MANAGED_CATALOG` | `questionId -> Question` | **NOT IMPLEMENTED** |
| 16 | `QuestionTag` | `ADMIN_MANAGED_CATALOG` | 標籤目錄 | **NOT IMPLEMENTED** |
| 17 | `QuestionTagRelation` | `ADMIN_MANAGED_CATALOG` | `questionId -> Question` | **NOT IMPLEMENTED** |
| 18 | `CertificationEnrollment` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 19 | `UnitProgress` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 20 | `WrongQuestionRecord` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 21 | `QuestionBookmark` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 22 | `StudyTimeLog` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 23 | `TeacherProfile` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 24 | `Class` | `TEACHER_OR_ENROLLED` | `creatorId`（無 `userId` 欄位）/ `enrollments[].studentId` | **NOT IMPLEMENTED** |
| 25 | `ClassEnrollment` | `TEACHER_OR_ENROLLED` | `studentId` 或 `class.creatorId` | **NOT IMPLEMENTED** |
| 26 | `ClassAssignment` | `NESTED_PARENT` | `class.creatorId`（管理）/ `class.enrollments[].studentId`（閱讀） | **NOT IMPLEMENTED** |
| 27 | `PracticalTask` | `ADMIN_MANAGED_CATALOG` | 公開實作題組目錄 | **NOT IMPLEMENTED** |
| 28 | `PracticalStep` | `ADMIN_MANAGED_CATALOG` | `taskId -> PracticalTask` | **NOT IMPLEMENTED** |
| 29 | `PracticalProgress` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 30 | `PracticalStepProgress` | `NESTED_PARENT` | `progress.userId` (`PracticalProgress`) | **NOT IMPLEMENTED** |
| 31 | `ExamPaper` | `ADMIN_MANAGED_CATALOG` | 試卷設定目錄 | **NOT IMPLEMENTED** |
| 32 | `ExamAttempt` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 33 | `ExamAnswerSnapshot` | `NESTED_PARENT` | `attempt.userId` (`ExamAttempt`) | **NOT IMPLEMENTED** |
| 34 | `AIChatSession` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |
| 35 | `AIChatMessage` | `NESTED_PARENT` | `session.userId` (`AIChatSession`) | **NOT IMPLEMENTED** |
| 36 | `StudentWeaknessAnalysis` | `DIRECT_USER_ID` | `userId` | **NOT IMPLEMENTED** |

---

## 9. IDOR 跨帳號存取測試結果

於 [`backend/tests/idor-ownership.test.ts`](../backend/tests/idor-ownership.test.ts) 與 [`backend/tests/app-runtime.db.test.ts`](../backend/tests/app-runtime.db.test.ts) 驗證下列情境：

1. **已實作 HTTP 端點（`/api/teachers/*`）**：
   - User A 讀取自身教師申請（`200`）。
   - User B 嘗試以 `?userId=<UserA>` 讀取（`403 OWNERSHIP_FORBIDDEN`）。
   - User B 嘗試以 Body `{ userId: <UserA>, ... }` 偽造建立教師申請（`403 OWNERSHIP_FORBIDDEN`），驗證既有資料維持未變。
   - 未登入存取（`401`）。
2. **Ownership Helper 跨層級資源驗證（`ExamAttempt`、`ExamAnswerSnapshot`、`ClassAssignment`）**：
   - User A 讀取／更新／刪除自身資源通過；User B 替換資源 ID 嘗試讀取、修改、刪除均拋出 `403 OWNERSHIP_FORBIDDEN`，驗證模擬資料狀態（分數、存在性）完全未被修改。
   - 無直屬 `userId` 之巢狀模型（`ExamAnswerSnapshot`、`ClassAssignment`）正確依父關聯權限判斷（已選課學生可讀作業、不可篡改班級作業）。
   - 明確 Admin Override 測試：`ADMIN` 與 `PLATFORM_ADMIN` 在 `allowAdminOverride: true` 時通過、`false` 時拒絕；`SYSTEM_OPERATOR` 即使於 `allowAdminOverride: true` 亦遭拒絕。
3. **尚未實作之業務模組（題庫、模擬測驗、實作進度、班級管理、AI 教練）**：誠實標註為 `NOT IMPLEMENTED`，待未來實作路由時強制注入 [`ownership.ts`](../backend/src/utils/ownership.ts) helpers。

---

## 10. `app_runtime` 整合測試結果（獨立 PG17.11 臨時沙盒）

- **隔離架構**：建立全新臨時 Docker 容器 `code_to_know_pg17_phase3c17_test`（`postgres:17-alpine`，實測版本 `PostgreSQL 17.11 on x86_64-pc-linux-musl`），綁定 `127.0.0.1:5434`、資料庫 `code_to_know_test`；未觸碰正式環境、PG16 或既有 PG17 還原沙盒。
- **測試角色權限配置**：
  - `c2k_test_migration_admin`（擁有 `public` schema 並執行既有兩個 Prisma migrations SQL 建立 36 張業務表與 `_prisma_migrations`）。
  - `c2k_test_app_runtime`（`LOGIN`、`NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`、`NOREPLICATION`、`BYPASSRLS`，依 Phase 3-C-15 設計）：
    - 35 張一般業務表具備 `SELECT, INSERT, UPDATE, DELETE`
    - `AuditLog` 僅具備 `SELECT, INSERT`（無 `UPDATE` / `DELETE` / `TRUNCATE`）
    - `_prisma_migrations` 具備 **零權限**
- **實測結果（[`backend/tests/app-runtime.db.test.ts`](../backend/tests/app-runtime.db.test.ts) — `3 passed (3)`）**：
  1. 確認連線身份確為 `c2k_test_app_runtime`、`rolsuper=false`、`rolbypassrls=true`。
  2. 驗證禁止行為均回傳 PostgreSQL `42501` (`insufficient_privilege`) 且錯誤訊息無密碼或連線字串洩漏：`CREATE TABLE`、`ALTER TABLE public."User"`、`SELECT`/`DELETE public."_prisma_migrations"`、`UPDATE`/`DELETE`/`TRUNCATE public."AuditLog"`。
  3. 實測完整 Express + Prisma 執行流程：`register` → `verifyEmail` → `login` → `SUSPENDED` 帳號驗證遭擋 → `POST /api/teachers/applications` → 跨帳號 `userId` IDOR 遭擋 → `ADMIN` 參數驗證與核准（寫入 `AuditLog` 成功）→ `GET /api/admin/audit-logs` 分頁與上界阻擋（`limit=500` → `400`）。

---

## 11. P2 剩餘風險與後續建議

1. **未實作業務模組之 API 上線規範**：`Class`、`ExamAttempt`、`PracticalProgress`、`AIChatSession` 等 27 張業務資料表尚無 HTTP API；未來新增模組時必須將 [`ownership.ts`](../backend/src/utils/ownership.ts) 列為 PR 審查必要項目，且需針對每個新端點補齊對應 IDOR 整合測試。
2. **管理員自行核准風險（Self-Approval）**：目前 `admin.service.ts` 已阻擋停用/停權/刪除申請人；若組織規定管理員帳號同時申請教師資格時不得自審，後續可補充 `application.userId === adminId` 阻擋規則。
3. **Rate Limiter 擴展性與前端 CSP**：目前 [`rate-limiter.ts`](../backend/src/middleware/rate-limiter.ts) 採記憶體儲存，多實例部署時應評估切換外部 Store（如 Redis）；前端靜態 HTML 之 Content Security Policy 仍須於託管層（Render / Cloudflare / Vercel 等）配置。
4. **`integration.db.test.ts` 執行條件**：該檔會在未設定 `TEST_DATABASE_URL`（且依 [`db-validation.ts`](../backend/src/config/db-validation.ts) 白名單要求本機 port `5432` 與資料庫名稱 `code_to_know_test`）時於 `beforeAll` 顯式失敗，此為既有防呆設計。

---

## 12. 完整修改與新增檔案清單

### 修改檔案
- `backend/src/modules/admin/admin.routes.ts`
- `backend/src/modules/admin/admin.schema.ts`
- `backend/src/modules/admin/admin.controller.ts`
- `backend/src/modules/admin/admin.service.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/teachers/teacher.routes.ts`
- `backend/src/utils/audit.ts`
- `frontend/src/app/App.tsx`
- `frontend/src/components/ProtectedRoute.tsx`

### 新增檔案
- `backend/src/utils/ownership.ts`
- `backend/tests/admin-hardening.test.ts`
- `backend/tests/auth-lifecycle.test.ts`
- `backend/tests/idor-ownership.test.ts`
- `backend/tests/app-runtime.db.test.ts`
- `frontend/tests/sources-route-protection.test.tsx`
- `docs/DATABASE_PHASE3C17_BACKEND_SECURITY_HARDENING_REPORT.md`

---

## 13. 測試與建置結果紀錄

### A. 離線安全與單元／API 測試（不需資料庫連線）
- 指令：`npx vitest run tests/rbac-workflow.test.ts tests/db-config-safety.test.ts tests/validation.test.ts tests/database-ssl-config.test.ts tests/security.test.ts tests/api.test.ts tests/admin-hardening.test.ts tests/auth-lifecycle.test.ts tests/idor-ownership.test.ts`（於 `backend/`）
  - **測試檔案**：`9 passed (9)`
  - **測試案例**：**`128 passed (128)`**（失敗 `0`、跳過 `0`）
  - 注意：`tests/api.test.ts` 之 health check 與 CSRF 測試設計為無 DB 時回傳非 403/503 降級狀態並仍計為通過。
- 指令：`..\backend\node_modules\.bin\vitest run tests/sources-route-protection.test.tsx`（於 `frontend/`）
  - **測試檔案**：`1 passed (1)`
  - **測試案例**：**`7 passed (7)`**（失敗 `0`、跳過 `0`）

### B. 完整 `backend` `npm test`（無外部 DB 環境變數之彙整執行）
- 指令：`npm test`（於 `backend/`）
  - **測試檔案**：`9 passed | 1 failed | 1 skipped (11)`
  - **測試案例**：`128 passed | 4 skipped (132)`
  - 需連線 DB 測試清單：
    1. `tests/app-runtime.db.test.ts`（3 個案例）：未設定 `TEST_APP_RUNTIME_URL` 時跳過（`3 skipped`）；連線獨立 PG17.11 `c2k_test_app_runtime` 時 **3 passed (3)**。
    2. `tests/integration.db.test.ts`（1 個案例，`1 skipped`）：未設定指向 `5432/code_to_know_test` 的 `TEST_DATABASE_URL` 時按既有安全規則於 `beforeAll` 顯式報錯阻擋。

### C. 獨立 PG17.11 `app_runtime` 實機整合測試
- 指令：`TEST_APP_RUNTIME_URL=<isolated_temp_pg17_5434_c2k_test_app_runtime> npx vitest run tests/app-runtime.db.test.ts`
  - **測試檔案**：`1 passed (1)`
  - **測試案例**：**`3 passed (3)`**（失敗 `0`、跳過 `0`）

### D. TypeScript 型別檢查與建置
- `backend` `npm run build` (`tsc`)：通過（Exit Code 0）
- `frontend` `npm run build` (`tsc && vite build`)：通過（Exit Code 0，1612 modules transformed，產出正常）

---

## 14. 環境清理確認

- 臨時容器 `code_to_know_pg17_phase3c17_test` 及匿名 Volume 已執行 `docker rm -f -v` 移除。
- `docker ps -a` 確認僅剩既有容器：
  - `code_to_know_pg17_restore_sandbox`（`127.0.0.1:5433`）— 完好未改動
  - `code_to_know_postgres`（PG16，`127.0.0.1:5432`）— 完好未改動
  - `dazzling_tharp`（既有已停止容器）— 未改動
- 報告與程式碼中未包含任何正式或測試密碼、Token、金鑰與真實連線字串。

---

## 15. 下一階段準備度評估（正式資料庫角色切換前）

- **就緒判斷**：**後端已確認之 P0/P1 安全缺口與 `app_runtime` 權限行為：GO（已修補並通過本機及臨時 PG17.11 驗證）**；但切換正式 Supabase 前仍須於下一階段依核准程序獨立執行與查核：
  1. 本階段所有變更尚未 Git commit，需由專案負責人審查工作目錄變更後再決定提交與部署。
  2. 正式 Supabase 尚未在本階段觸碰；實際切換仍須依 Phase 3-C-15 計畫嚴格執行角色建立／切換與回滾前檢查。
  3. 未來實作第 8 節標記 `NOT IMPLEMENTED` 之 27 個業務模型 API 時，必須沿用 `ownership.ts` 並補齊 IDOR 測試後方可上線。
