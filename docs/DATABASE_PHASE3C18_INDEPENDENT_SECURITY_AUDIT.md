# CODE TO KNOW — Phase 3-C-18 獨立安全稽核報告

**執行階段**：Phase 3-C-18 / Phase 3-C-18-B（Phase 3-C-17 修補後獨立安全稽核與剩餘測試補完）  
**稽核性質**：嚴格唯讀程式碼審查、離線自動化測試、獨立暫時 PG17.11 實機驗證（無修改任何正式程式碼、Schema、PG16、原有 PG17 沙盒或 Supabase 環境）  
**報告日期**：2026-11-11  

---

## 一、稽核範圍、基線與環境盤點

### 1.1 Git 基線與工作目錄確認
- **分支（Branch）**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **稽核期間原始碼改動**：**0 處**（僅新增本報告 `docs/DATABASE_PHASE3C18_INDEPENDENT_SECURITY_AUDIT.md`；暫時驗證腳本放於 Agent scratch 目錄，不影響 repo 工作目錄）。
- **工作目錄既有修改／未追蹤檔案**（稽核前後比對一致）：
  - Phase 3-C-17 已修改程式碼：`backend/src/modules/admin/admin.controller.ts`、`admin.routes.ts`、`admin.schema.ts`、`admin.service.ts`、`backend/src/modules/auth/auth.service.ts`、`backend/src/modules/teachers/teacher.routes.ts`、`backend/src/utils/audit.ts`、`frontend/src/app/App.tsx`、`frontend/src/components/ProtectedRoute.tsx`
  - Phase 3-C-17 新增程式碼／測試：`backend/src/utils/ownership.ts`、`backend/tests/admin-hardening.test.ts`、`backend/tests/app-runtime.db.test.ts`、`backend/tests/auth-lifecycle.test.ts`、`backend/tests/idor-ownership.test.ts`、`frontend/tests/sources-route-protection.test.tsx`
  - 既有未提交文件與腳本變更（Phase 3-C-11 ~ 3-C-17 報告、PowerShell 還原腳本與 `.editorconfig` 等）完整保留。

### 1.2 Docker 與資料庫隔離確認
| 容器名稱 | 映像 / 用途 | 狀態 | 連接埠 | 稽核是否修改 |
| :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine`（本機 PG16 開發環境） | `Up (healthy)` | `127.0.0.1:5432` | **未修改、未停止** |
| `code_to_know_pg17_restore_sandbox` | PG17 還原驗證沙盒 | `Up` | `127.0.0.1:5433` | **未修改、未停止** |
| `code_to_know_pg17_phase3c18_audit` | `postgres:17-alpine`（PG 17.11 本階段暫時隔離測試容器） | `Up`（暫時保留待驗收） | `127.0.0.1:5434` | 僅用於獨立隔離測試 |
| 暫時 Volume：`code_to_know_pg17_phase3c18_audit_data` | 隔離 PG17.11 測試資料磁碟區 | `local`（暫時保留待驗收） | — | 依指示待驗收後再行清理 |

- **既有殘留檢查**：先前提權卡住之 `task-10415` 與五個對應程序（`PID 36404 / 40332 / 36708 / 40404 / 39196`）已安全中止，`OLD_PIDS_ABSENT=True`，背景任務為 `0`；PG17.11 暫時容器內 `pg_stat_activity` 無等待中鎖定或殘留測試連線。

---

## 二、測試與建置執行總表（含真實 Exit Code 與數量）

### 2.1 前階段（Phase 3-C-18 第一輪）已通過之測試與建置
| # | 測試／檢查項目 | 執行範圍／條件 | 測試數與結果 | Exit Code | 判定 |
| :-: | :--- | :--- | :--- | :-: | :--- |
| 1 | 後端 9 份離線測試套件 | `tests/db-config-safety.test.ts` (59), `rbac-workflow.test.ts` (17), `validation.test.ts` (12), `admin-hardening.test.ts` (10), `database-ssl-config.test.ts` (7), `idor-ownership.test.ts` (7), `auth-lifecycle.test.ts` (6), `security.test.ts` (5), `api.test.ts` (5) | **9 files passed / 128 passed (128)** | `0` | **PASS** |
| 2 | 後端完整 `npm test`（無測試 DB 環境變數） | 未設定 `TEST_DATABASE_URL` 與 `TEST_APP_RUNTIME_URL` | `1 failed \| 9 passed \| 1 skipped (11)`；`128 passed \| 4 skipped (132)` | `1` | **EXPECTED GUARD / FAIL**（註1） |
| 3 | 前端路由保護測試 | `frontend/tests/sources-route-protection.test.tsx` | **1 file passed / 7 passed (7)** | `0` | **PASS** |
| 4 | 後端 TypeScript 建置 | `backend`：`npm run build` (`tsc`) | 編譯無錯誤 | `0` | **PASS** |
| 5 | 前端 TypeScript 與 Vite 建置 | `frontend`：`npm run build` (`tsc && vite build`) | 1612 modules；`dist/index.html` 1.01 kB、`css` 14.22 kB、`js` 494.93 kB | `0` | **PASS** |
| 6 | PG17.11 `app_runtime` 隔離整合測試 | `npx vitest run tests/app-runtime.db.test.ts`（`TEST_APP_RUNTIME_URL` 指向 `127.0.0.1:5434/code_to_know_test`，身分 `c2k_test_app_runtime`） | **1 file passed / 3 passed (3)** | `0` | **PASS** |
| 7 | PG17.11 `app_runtime` 角色屬性與權限探針（第 1–4 段） | `pg_roles` / `nspacl` / `Sequence`（`nextval`/`currval` 成功 vs `setval` 遭拒 `42501`）/ `SET ROLE postgres` 與 `SET ROLE c2k_test_migration_admin` 遭拒 `42501` / `auth.users` 無跨 schema 表（`42P01`） | 屬性精確符合（`rolinherit=f, rolbypassrls=t, member_of_count=0`）；越權操作均為 `42501` | `0`（探針預期拒絕） | **PASS** |
| 8 | 傳統 PG16 `integration.db.test.ts` 實機整合跑批 | 依安全限制未於 PG16 `5432` 建立 `code_to_know_test` 資料庫 | 未連接實機重跑（前項 #2 於 `beforeAll` 因缺少 `TEST_DATABASE_URL` 明確阻斷） | — | **NOT TESTED** |
| 9 | Supabase 正式環境連線與 Pooler SSL/TLS 驗證 | 嚴禁連線 Supabase 正式庫 | 未實機連線正式環境 | — | **NOT TESTED** |

> **註 1（`npm test` Exit Code 1 說明）**：[`integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts#L12-L26) 刻意不靜默退回 dev/prod `DATABASE_URL`，當未明確提供指向本機 Port `5432` `code_to_know_test` 的 `TEST_DATABASE_URL` 時，會在 `beforeAll` 拋出 `[INTEGRATION TEST CONFIG ERROR]`；屬安全防護機制觸發，非程式碼功能錯誤，但因未在 5432 執行實測，該檔實機情境標為 **NOT TESTED**。

---

### 2.2 本階段（Phase 3-C-18-B）補完之三項獨立驗證結果

#### 測試 A：`AuditLog` 間接修改權限防禦（以安全 stdin 管道直連 `code_to_know_pg17_phase3c18_audit`）
以 `c2k_test_app_runtime` 登入 PG 17.11 隔離資料庫（`code_to_know_test`），於原有 `8` 筆 `AuditLog` 資料不變前提下執行 6 項間接修改／結構竄改探針：

| 探針名稱 | 測試 SQL 行為 | 回傳 SQLSTATE | 錯誤訊息 | psql Exit Code | 判定 |
| :--- | :--- | :---: | :--- | :-: | :--- |
| `CTE_UPDATE` | `WITH u AS (UPDATE public."AuditLog" ... RETURNING id) SELECT count(*) FROM u;` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |
| `CTE_DELETE` | `WITH d AS (DELETE FROM public."AuditLog" RETURNING id) SELECT count(*) FROM d;` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |
| `MERGE_UPDATE` | `MERGE INTO public."AuditLog" ... WHEN MATCHED THEN UPDATE ...` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |
| `UPSERT_ON_CONFLICT_UPDATE` | `INSERT INTO public."AuditLog" ... ON CONFLICT (id) DO UPDATE ...` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |
| `CREATE_TRIGGER` | `CREATE TRIGGER rogue_trig BEFORE INSERT ON public."AuditLog" ...` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |
| `TRUNCATE_AUDITLOG` | `TRUNCATE TABLE public."AuditLog";` | **`42501`** | `permission denied for table AuditLog` | `3` | **PASS** |

- **前後資料完整性快照**：
  - 測試前：`row_count = 8`，`content_md5 = 6e744efc72f58fa8597b18b923626ce1`（`Exit Code 0`）
  - 測試後：`row_count = 8`，`content_md5 = 6e744efc72f58fa8597b18b923626ce1`（`Exit Code 0`）
  - **結論**：完全一致性驗證 **PASS**，無任何資料遭修改或破壞。

#### 測試 B：`sanitizeAuditDetails` / `sanitizeAuditValue` 執行期邊界測試
使用暫存測試腳本 `phase3c18_test_b.ts` 直接透過 `node backend/node_modules/tsx/dist/cli.mjs` 執行（`TEST_B_EXIT=0`，全程使用合成假資料，無真實秘密）：

| 測試項目 | 實測輸入重點 | 實測輸出行為 | 判定 | 風險 |
| :--- | :--- | :--- | :--- | :--- |
| 敏感欄位 Key 脫敏 | `password`, `token`, `secret`, `apiKey`, `api_key`, `privateKey`, `authorization`, `passwordHash` | 全數精確取代為 `"[REDACTED]"` | **PASS** | — |
| 正常業務資料保留 | `schoolName`（中文）, `subject`, `targetUserId`, `action`, `approved: true`, `attemptCount: 3`, `reviewNote` | 100% 完整保留原值與型別 | **PASS** | — |
| PostgreSQL DSN 與純文字備援 | `postgresql://dummyuser:dummypass@...`、非 JSON 純文字含 `token=...` | 密碼與 Token 正確取代為 `[REDACTED]` | **PASS** | — |
| 行內字串複合匹配 | `Bearer ...`、`password=...`、`apiKey=...`、`access_token=...`、`client_secret=...` | 前五項皆遮罩為 `[REDACTED]`；**但 `api_key=...`（snake_case 字串）未被遮罩** | **PARTIAL** | **LOW** |
| 深層巢狀物件（`depth > 6`） | Depth 7 (`l7_within.password`) 與 Depth 8 (`l7_deep_obj.l8.*`) | [`sanitizeAuditValue`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L17-L20) 第 18 行因 `if (depth > 6 ...)` 直接回傳原物件，`password` / `token` / `apiKey` **未脫敏** | **PARTIAL** | **LOW** |
| `Error` 實例序列化 | `{ err: new Error("Bearer ...") }` | 因 `Error.message`/`stack` 為不可列舉屬性，`Object.entries` 輸出 `"err": {}`（無外洩但遺失錯誤診斷訊息） | **PARTIAL** | **INFORMATIONAL** |
| 非 PostgreSQL DSN | `redis://dummyuser:dummypass@...`、`mysql://dummyuser:dummypass@...` | [`redactStringSecrets`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L7-L15) 僅匹配 `postgres(ql)://`，其餘 DSN 密碼**未脫敏** | **PARTIAL** | **LOW** |

#### 測試 C：PG17.11 一次性 Token 並行競爭與資料清理測試
使用暫存測試腳本 `phase3c18_test_c.ts` 以 `c2k_test_app_runtime` 連線 `127.0.0.1:5434/code_to_know_test` 執行（`TEST_C_EXIT=0`），模擬 [`auth.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L290-L423) 之 `$transaction` + `updateMany({ where: { id, usedAt: null } })` 原子鎖定模式：
1. **信箱驗證 Token 雙併發競爭（`EmailVerificationToken`）**：
   - `Promise.all([V1, V2])` 結果：`V1` 成功消耗（`ok: true, count: 1`），`V2` 失敗回退（`ok: false, reason: "TOKEN_ALREADY_USED", count: 0`）。
   - 第 3 次重放 `V3_REPLAY`：`ok: false, count: 0`。
   - 最終資料庫狀態：`winners = 1, losers = 1`，帳號更新為 `ACTIVE` 且具有 `emailVerifiedAt`。
2. **密碼重設 Token 雙併發競爭（`PasswordResetToken`）**：
   - `Promise.all([R1, R2])` 結果：`R2` 成功消耗（`ok: true, count: 1`），`R1` 失敗回退（`ok: false, reason: "TOKEN_ALREADY_USED", count: 0`）。
   - 第 3 次重放 `R3_REPLAY`：`ok: false, count: 0`。
   - 最終資料庫密碼雜湊值僅更新為贏家結果 `"rotated_by_R2"`，輸家無造成任何重複寫入或覆蓋。
3. **專用測試資料清理確認**：
   - 腳本 `finally` 回報：`CLEANUP_CHECK: {"remainingUsers":0,"remainingVerify":0,"remainingReset":0}`。
   - 事後透過 `postgres` 獨立唯讀複查：`users = 0`, `audit_logs = 8`, `verify_tokens = 0`, `reset_tokens = 0`（`POST_CHECK_EXIT=0`）。

---

## 三、分區詳細安全稽核結果（Sections A–F）

### A. Admin API 與權限邊界
| 查核項目 | 程式依據 | 測試依據 | 狀態 | 風險等級 |
| :--- | :--- | :--- | :---: | :---: |
| Admin 路由全數受 `authenticate` + `authorize(['ADMIN'])` 保護 | `admin.routes.ts`、`authorize.ts` | `admin-hardening.test.ts` (10), `rbac-workflow.test.ts` (17), `app-runtime.db.test.ts` | **PASS** | — |
| `SYSTEM_OPERATOR` 不得透過相容映射取得 `ADMIN` 權限 | `authorize.ts` 僅展開 `ADMIN` <-> `PLATFORM_ADMIN` | `rbac-workflow.test.ts` | **PASS** | — |
| Params/Query/Pagination 嚴格 Zod 驗證 (`limit` 上限 100、UUID 格式驗證) | `admin.routes.ts`, `admin.schema.ts`, `validate.ts` | `admin-hardening.test.ts`, `app-runtime.db.test.ts` (bad UUID -> `400 VALIDATION_ERROR`) | **PASS** | — |
| 核准／拒絕前阻斷軟刪除或停用帳號（`deletedAt`/`SUSPENDED`/`DISABLED`） | `admin.service.ts` | `admin-hardening.test.ts` | **PASS** | — |
| **管理員自我核准與審核狀態交易鎖定缺口** | `admin.service.ts` 在 `$transaction` 之前先 `findUnique` 檢查 `status === 'PENDING'`，未於原子 `update` 條件加入 `status: 'PENDING'`；且未阻擋擁有 `ADMIN` 身分者申請或核准本人之教師申請（`application.userId === adminId`） | 靜態程式碼檢查（`admin.service.ts` L70-121 / L153-206、`teacher.service.ts`） | **PARTIAL** | **LOW** |

### B. AuditLog 寫入／讀取隔離與敏感資料防護
| 查核項目 | 程式依據 | 測試依據 | 狀態 | 風險等級 |
| :--- | :--- | :--- | :---: | :---: |
| DB 引擎層 `c2k_test_app_runtime` Append-only（禁 `UPDATE`/`DELETE`/`TRUNCATE`/間接 `CTE`/`MERGE`/`UPSERT`/`TRIGGER`） | Phase 3-C-15 / 3-C-16B ACL 設計 | `app-runtime.db.test.ts` + 測試 A（全數 `42501`） | **PASS** | — |
| `listAuditLogs` 回傳時經過 `sanitizeAuditDetails` 脫敏 | `admin.service.ts`, [`audit.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L46-L58) | `admin-hardening.test.ts`, 測試 B | **PASS** | — |
| **`AuditLog` 寫入路徑未統一經由 `logAuditEvent` / `sanitizeAuditDetails` 脫敏** | [`auth.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L83) (L83, L134, L162, L198, L307, L352, L414)、`admin.service.ts` (L131, L192)、`teacher.service.ts` (L44) 直接呼叫 `prisma.auditLog.create`，未過濾 `details`（例如 `reviewNote` / `schoolName` 若誤帶敏感字串會先落地明文，僅在讀取 `listAuditLogs` 時遮罩） | 靜態程式碼審查 + 測試 B | **PARTIAL** | **MEDIUM** |
| **`audit.ts` 脫敏深度上限與非 PG DSN／`api_key` 字串漏網** | [`sanitizeAuditValue`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L17-L20) `depth > 6` 直接回傳未脫敏物件；[`redactStringSecrets`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L7-L15) 未覆蓋 `redis://`/`mysql://`/`api_key=`；`Error` 實例序列化成 `{}` | 測試 B（`TEST_B_EXIT=0`） | **PARTIAL** | **LOW** |

### C. Auth Token 單次使用、帳號狀態與交易安全
| 查核項目 | 程式依據 | 測試依據 | 狀態 | 風險等級 |
| :--- | :--- | :--- | :---: | :---: |
| `verifyEmail` 與 `resetPassword` 單次使用、並發下僅一筆成功 | [`auth.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L290-L423) (`$transaction` + `updateMany` `usedAt: null`) | `auth-lifecycle.test.ts` (6), `app-runtime.db.test.ts`, 測試 C (`winners=1, losers=1`) | **PASS** | — |
| 停用／軟刪除帳號（`SUSPENDED`/`DISABLED`/`deletedAt`）於 `login`/`authenticate`/Token 消耗皆受阻斷 | `authenticate.ts` (L62), `auth.service.ts` (L246-266) | `auth-lifecycle.test.ts`, `app-runtime.db.test.ts` | **PASS** | — |
| `requestPasswordReset` 對停用／不存在帳號不洩漏帳號枚舉資訊 | `auth.service.ts` (L332-369) | `auth-lifecycle.test.ts` | **PASS** | — |
| **Token 過期／帳號狀態檢查時序與重設舊 Token 失效缺口** | 1) `verifyEmail`/`resetPassword` 在進入 `$transaction`（及 ~250ms `bcrypt`）**前**檢查 `expiresAt` 與 `user.status`，且 `updateMany` 僅條件 `usedAt: null` 未併入 `expiresAt: { gt: now }` 與帳號狀態重查；<br>2) `requestPasswordReset` 未將先前未使用的 `PasswordResetToken` 設為失效，且仍對 `PENDING_VERIFICATION` 發出 Token（雖 `resetPassword` 會拒絕）；<br>3) [`optionalAuthenticate`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts#L108) 第 108 行僅查 `deletedAt`，遺漏 `SUSPENDED`/`DISABLED`（目前無公開路由掛載） | 靜態程式碼檢查（`auth.service.ts`, `authenticate.ts`） | **PARTIAL** | **LOW** |

### D. IDOR、所有權與資料範圍隔離
| 查核項目 | 程式依據 | 測試依據 | 狀態 | 風險等級 |
| :--- | :--- | :--- | :---: | :---: |
| `ownership.ts` 集中防護函式正確實作且具邊界檢查 | `backend/src/utils/ownership.ts` (`resolveScopedUserId`, `assertResourceOwnership`, `assertNestedOwnership`, `buildOwnedWhere`, `rejectForgedOwnerFields`) | `idor-ownership.test.ts` (7), `app-runtime.db.test.ts` (偽造 `userId` -> `403 OWNERSHIP_FORBIDDEN`) | **PASS** | — |
| 現有已實作模組無明顯跨帳號讀寫漏洞 | `/api/auth/me`、`/api/teachers/*`（`rejectForgedOwnerFields(['userId'])` + `req.user!.id`）、`/api/admin/*` | `idor-ownership.test.ts`, `app-runtime.db.test.ts` | **PASS** | — |
| **27/36 資料模型尚未有業務 API 與強制隔離接線** | `PRISMA_MODEL_OWNERSHIP_INVENTORY` 明確盤點 36 模型中僅 9 個 `IMPLEMENTED`，其餘 27 個（班級、測驗、作答快照、錯題本、AI 對話等）尚未實作後端 API；部分現有服務尚直接依 `req.user!.id` 運作而非全面改用 `buildOwnedWhere` | `ownership.ts` (L42-94) | **PARTIAL** | **MEDIUM**（未來擴充風險；上線新 API 前必須強制套用） |

### E. `app_runtime` 資料庫最小權限一致性
| 查核項目 | 實測證據 | 狀態 | 風險等級 |
| :--- | :--- | :---: | :---: |
| 角色屬性：`LOGIN=t, SUPERUSER=f, CREATEDB=f, CREATEROLE=f, INHERIT=f, REPLICATION=f, BYPASSRLS=t, member_of_count=0` | `pg_roles` 實測 + `app-runtime.db.test.ts` | **PASS** | — |
| `PUBLIC` Schema / Table 無隱含授權，Runtime 無 Schema `CREATE` 權限 | `nspacl` + `public_table_privs = 0` + `CREATE TABLE`/`ALTER TABLE` 回傳 `42501` | **PASS** | — |
| `_prisma_migrations` 零權限、`AuditLog` 嚴格 Append-only（含 CTE/MERGE/UPSERT/TRIGGER/TRUNCATE） | `app-runtime.db.test.ts` + 測試 A 全數 `42501` | **PASS** | — |
| Sequences 僅 `USAGE, SELECT`（允許 `nextval`/`currval`，阻斷 `setval`）且支援未來 Migration `DEFAULT PRIVILEGES` | 測試序列實測：`nextval/currval` 成功、`setval` 回傳 `42501` | **PASS** | — |
| **與後端應用程式行為完全相容** | Register / Verify / Login / Teacher Apply / Admin Approve / AuditLog INSERT+SELECT 全流程通過（`app-runtime.db.test.ts` + 測試 C） | **PASS** | — |

> **環境對照備註（`BYPASSRLS` 與方案 B）**：本機測試對齊 Phase 3-C-15 方案 B（現況 37 張表已啟用 RLS 且 0 Policy，由後端強制所有權與 RBAC 邏輯，故 Runtime 使用 `BYPASSRLS=true` + 資料表 ACL 隔離）。未來若要轉為 DB 層 Row-Level Policy（方案 A `NOBYPASSRLS`），需先補齊各表 Policy 方可切換。

### F. 前端 `#sources` 路由與管理員介面防護
| 查核項目 | 程式依據 | 測試依據 | 狀態 | 風險等級 |
| :--- | :--- | :--- | :---: | :---: |
| `#sources` / `#import-system` / `#question-bank` 受 `<ProtectedRoute requiredRoles={['ADMIN']}>` 嚴格保護 | `App.tsx` (L81-90), `NavigationContext.tsx`, `ProtectedRoute.tsx` | `sources-route-protection.test.tsx` (7/7), `vite build` | **PASS** | — |
| 未登入、學生、教師、系統操作員（`SYSTEM_OPERATOR`）無法渲染 `QuestionBankImportSystemPage` | `ProtectedRoute.tsx` (`ADMIN` 與 `PLATFORM_ADMIN` 相容，排除 `SYSTEM_OPERATOR`) | `sources-route-protection.test.tsx` | **PASS** | — |
| **前端 UX 與靜態資料細節** | 1) `ProtectedRoute.tsx` (L414-445) 在 Demo 模式下於未登入管理頁面仍顯示「快速預覽學生/教師」按鈕（點擊後立即被 403 阻斷畫面擋下，**非權限繞過**）；<br>2) `Navbar.tsx` (L100) 角色徽章僅判斷 `'ADMIN'` 未計入 `'PLATFORM_ADMIN'`；<br>3) 前端 SPA 建置產物本身含靜態展示常數，惟安全邊界以後端真實 API（題庫管理 API 目前尚未實作）為準 | 靜態程式碼檢查 | **PARTIAL** | **LOW** |

---

## 四、統計摘要與風險改善建議清單

### 4.1 檢查項目狀態統計
- **獨立驗證測試／建置指令**：執行並通過 **6 組**（後端 9 檔 128 案例、前端 7 案例、後端 `tsc`、前端 `tsc+vite`、PG17 `app-runtime.db.test.ts` 3 案例、PG17 Phase 3-C-18-B 補完探針 A/B/C），外加無 `TEST_DATABASE_URL` 時正確觸發保護之 `npm test` 整批檢查（Exit Code `1`）與 **2 項** 依限制未連線執行之環境（`integration.db.test.ts` @ PG16 5432、Supabase 正式環境與 Pooler TLS）。
- **控制項評估彙整（依本報告第二／三節項目計）**：
  - **`PASS`**：**19 項**（核心 Auth/Token/併發防呆、Admin API 硬驗證、IDOR 既有端點防護、PG17 `app_runtime` 最小權限與 `AuditLog` Append-only ACL、前端 `#sources` 保護與前後端建置）
  - **`PARTIAL`**：**7 項**（如下列風險分級，其中 **0 CRITICAL / 0 HIGH**、**2 MEDIUM**、**4 LOW**、**1 INFORMATIONAL**）
  - **`FAIL`**：**0 項**（程式碼實作面無直接功能性失敗；無環境變數時之 `integration.db.test.ts` 為預期保護性拒絕）
  - **`NOT TESTED`**：**2 項**（PG16 `5432` 實機整合測試、Supabase 正式機連線與 Supavisor SSL/TLS 實測）

### 4.2 安全缺口與優先修復建議
| 優先順序 | 風險等級 | 問題摘要 | 影響說明與建議修補方向 |
| :-: | :-: | :--- | :--- |
| 1 | **MEDIUM** | **`AuditLog` 寫入端未全面經 `sanitizeAuditDetails`** | 建議上正式前或下一輪將 `auth.service.ts`（7 處）、`admin.service.ts`（2 處）、`teacher.service.ts`（1 處）改為統一呼叫 `logAuditEvent` 或在建立前顯式呼叫 `sanitizeAuditDetails`，避免任何明文進入資料庫。 |
| 2 | **MEDIUM** | **27/36 模型尚未建立業務 API（架構治理）** | 屬於待開發範圍；未來每開放一個新業務 API（班級、測驗、錯題、AI 對話等），必須強制通過 `ownership.ts`（`resolveScopedUserId` / `buildOwnedWhere` / `assertResourceOwnership`）並補齊對應 IDOR 測試。 |
| 3 | **LOW** | **`audit.ts` 深層物件與非 PG DSN／`api_key=` 脫敏邊界** | 建議將 `depth > 6` 改為截斷標記 `[MAX_DEPTH_TRUNCATED]`（而非原樣回傳明文物件），並擴充 `redactStringSecrets` 支援 `redis://`/`mysql://`/`https://u:p@` 與 `api_key=`，對 `Error` 擷取脫敏後 `message`/`name`。 |
| 4 | **LOW** | **Token 生命週期與管理員自我審核細節** | 1) `verifyEmail`/`resetPassword` 將 `expiresAt > now` 與 `user.status`/`deletedAt` 條件併入交易內原子更新；2) `requestPasswordReset` 作廢舊未使用 Token；3) `optionalAuthenticate` 補齊 `SUSPENDED`/`DISABLED` 檢查；4) `approveTeacherApplication` 加入 `application.userId === adminId` 自我審核禁止與交易內 `status: 'PENDING'` 條件。 |
| 5 | **LOW** | **前端 Demo 按鈕與 `PLATFORM_ADMIN` 徽章顯示** | 移除 ADMIN 路由未登入畫面下的 Student/Teacher Demo 預覽按鈕以避免操作混淆；將 `Navbar.tsx:100` 對齊 `PLATFORM_ADMIN`。 |
| 6 | **INFORMATIONAL** | **未連線驗證環境提醒** | 正式切換角色前，尚須獨立執行：Supabase 正式庫角色佈建腳本、Supavisor Pooler + `sslmode=require` + CA 憑證連線實測、以及傳統 PG16 `integration.db.test.ts` 全套驗證。 |

---

## 五、最終回答與下階段評估（Go / No-Go）

針對 Phase 3-C-18 六項核心評估問題的明確結論如下：

1. **Phase 3-C-17 的修補是否真正生效？**  
   **是（生效）**。Admin 驗證、軟刪除／停用帳號阻斷、Token 單次消費併發鎖定、教師申請 `userId` 防偽造、前端 `#sources` 角色防護及 `app_runtime` 最小權限資料庫約束皆經離線測試與 PG 17.11 隔離實測證實有效（惟前述寫入端日誌統一化等中等／低風險缺口仍建議持續收斂）。
2. **是否存在 IDOR、越權存取或跨使用者資料讀寫風險？**  
   - **已實作模組**：經靜態審查與測試驗證，**目前未發現可利用之跨帳號讀寫或越權繞過漏洞**。  
   - **未實作領域**：其餘 27 個資料模型尚未有對應後端端點，未來新增功能時仍須嚴格套用 `ownership.ts`。
3. **Token 單次使用、帳號狀態及交易處理安全性是否足夠？**  
   **核心防線達標（PASS with minor hardening items）**。PG 17.11 雙請求並行實測證實驗證與重設 Token 皆嚴格單次有效且無競爭覆蓋，停用帳號遭精準阻斷（`403 ACCOUNT_DISABLED`）；`expiresAt` 併入交易 `WHERE` 條件與舊重設 Token 作廢列為低風險補強。
4. **`AuditLog` 是否不會洩漏敏感資料？**  
   **READ 路徑與資料庫 Append-only 達標，WRITE 路徑屬 PARTIAL（MEDIUM）**。讀取輸出與一般欄位已妥善遮罩，且資料庫 ACL 已徹底阻斷直接／間接竄改；但業務服務直接呼叫 `prisma.auditLog.create` 時缺乏統一寫入前脫敏，且 `audit.ts` 在 `depth > 6` 與非 PostgreSQL DSN 存在邊界漏網，建議列為正式上線前或角色切換前之優先收斂項目。
5. **`app_runtime` 權限是否與實際後端程式行為一致？**  
   **完全一致（PASS）**。於隔離 PG 17.11 實測中，僅擁有必要業務 DML、`AuditLog` `SELECT, INSERT` 與 Sequence `USAGE, SELECT` 的 `c2k_test_app_runtime` 可順利完成所有應用流程，同時在 DB 層被精確拒絕對 `_prisma_migrations`、`AuditLog` 更新刪除（含 `CTE` / `MERGE` / `UPSERT` / `TRIGGER` / `TRUNCATE`）、DDL、`setval` 與 `SET ROLE` 之存取（全數 `42501`）。
6. **前端 `#sources` 路由是否無法被非管理員使用？**  
   **是（PASS）**。未登入、學生、教師與 `SYSTEM_OPERATOR` 在 `#sources`、`#import-system`、`#question-bank`（含變體查詢／大小寫規格驗證下）均被 `<ProtectedRoute requiredRoles={['ADMIN']}>` 攔截，無法渲染管理員匯入元件。

### 階段綜合建議：**CONDITIONAL GO（條件式同意進入下一階段「正式角色切換前置規劃與 Script 定版」）**
- **不可視為直接無條件上線**：目前尚未執行任何正式 Supabase 連線、尚未實測 Supavisor Pooler + TLS 憑證驗證，且 `AuditLog` 寫入端統一經過 `sanitizeAuditDetails`（MEDIUM）仍待補強。
- **建議路徑**：可授權進入下一階段「正式角色建立／切換前檢核與測試環境殘留資源（`code_to_know_pg17_phase3c18_audit`）驗收清理」，並於正式套用至 Supabase 前先完成寫入端 `AuditLog` 統一脫敏小幅補強，再依 Phase 3-C-15 切換程序嚴格授權執行。

---

## 六、本階段資源清理與狀態報告

- **PG17.11 測試資料清理**：**已完成**（測試 C 建立之專用 `User`、`EmailVerificationToken`、`PasswordResetToken` 全數清除，`0` 筆殘留；`AuditLog` 維持測試前之 8 筆且 `MD5` 一致；測試 A 未寫入任何資料）。
- **暫時容器與 Volume 狀態**：依本次指示**先行保留待驗收，未自行刪除**（`code_to_know_pg17_phase3c18_audit` 與 `code_to_know_pg17_phase3c18_audit_data`）。
- **殘留 OS 程序檢查**：無任何殘留 Node / PowerShell 測試程序。
- **Git 狀態結論**：`main` 分支 `HEAD = 86a0f1116693bcce476b8747a446900d54b29a4a`，僅新增本稽核報告 `docs/DATABASE_PHASE3C18_INDEPENDENT_SECURITY_AUDIT.md`，未更動任何正式程式碼或設定檔。
