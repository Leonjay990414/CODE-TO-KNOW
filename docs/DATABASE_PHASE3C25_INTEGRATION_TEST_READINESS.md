# CODE TO KNOW｜Phase 3-C-25：資料庫整合測試環境準備度唯讀稽核報告

- 稽核日期：2026-11-12
- 稽核階段：Phase 3-C-25（資料庫整合測試安全性與隔離性唯讀靜態稽核）
- 稽核原則：全程唯讀，未啟動 Docker Desktop、未執行任何資料庫測試/Migration/Seed/Reset、未讀取 `.env` 機密內容、未修改任何程式碼或備份。
- 證據區分原則：本報告所有程式邏輯與防護判斷皆為**「程式碼靜態檢查已確認」**；兩支資料庫整合測試之**「實際資料庫測試尚未執行（`NOT TESTED`）」**。

---

## 一、Git 與備份完整性基線

1. **Git 分支與 HEAD**：
   - Branch：`main`
   - HEAD：`86a0f1116693bcce476b8747a446900d54b29a4a`
   - 未修改、清理或提交任何既有工作目錄變更；本階段僅新增本報告。
2. **原始備份檔案 SHA-256（實測驗證未變）**：
   - `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump`：
     `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
   - `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb`：
     `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 二、Docker 狀態（唯讀檢查）

- 執行 `docker ps -a --format "table {{.Names}}\t{{.Status}}"` 回傳錯誤：
  `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine; check if the path is correct and if the daemon is running: open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.`
- **結論**：主機 Docker Desktop daemon 目前未啟動。依本階段禁止事項，未啟動 Docker Desktop，並已停止後續 Docker 容器與資料庫內部狀態檢查。因此目前**無法確認**隔離 PG17 容器（Port `5434`）、資料庫 `code_to_know_test` 與角色 `c2k_test_app_runtime` 是否處於啟動可連線狀態。

---

## 三、兩支測試檔案的執行流程分析（靜態檢查）

### 3.1 [`backend/tests/integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts)（157 行）

1. **模組載入階段（L1–L8）**：直接匯入 `prisma`（來自 `src/config/database.ts`）、`authService`、`teacherService`、`adminService`、`validateTestDatabaseUrl`。
2. **`beforeAll`（L12–L30）**：檢查 `process.env.TEST_DATABASE_URL` 是否非空 -> 呼叫 `validateTestDatabaseUrl(testDbUrl)` -> 執行 `await prisma.$queryRaw\`SELECT 1\``。
3. **測試主體（L68–L156）**：`upsert` `ADMIN`/`STUDENT` Role -> 建立測試 Admin 與註冊測試 Student -> 申請教師身分 -> Admin 核准 -> 驗證 `TEACHER` Role 與 `AuditLog`。
4. **`afterAll`（L32–L66）**：依外鍵安全順序清除 `createdUserIds` 相關資料（`auditLog` -> `teacherApplication` -> `emailVerificationToken` -> `passwordResetToken` -> `session` -> `userProfile` -> `userRole` -> `user`）並執行 `prisma.$disconnect()`。

### 3.2 [`backend/tests/app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts)（320 行）

1. **Hoisted 前置檢查階段（L10–L40）**：透過 `vi.hoisted(...)` 在任何模組匯入與 `dotenv.config()` 之前讀取 `process.env.TEST_APP_RUNTIME_URL`，並定義 `validateIsolatedAppRuntimeTestUrl`。
2. **模組隔離 Mock（L45–L65）**：使用 `vi.mock('../src/config/database.js', ...)` 攔截全域 `database.ts`；僅在 `runtimeUrl` 通過 `validateIsolatedAppRuntimeTestUrl` 後建立獨立 `pg.Pool` 與 `PrismaClient`。
3. **`describe.skipIf(!runtimeUrl || !runtimeUrl.trim())`（L71）**：未設定 `TEST_APP_RUNTIME_URL` 時整個測試套件安全跳過，不會建立真實連線。
4. **測試主體（L120–L318）**：驗證角色權限（`current_user = c2k_test_app_runtime`、`rolsuper=false`、`rolbypassrls=true`）、驗證 DDL / `_prisma_migrations` / `AuditLog` `UPDATE`/`DELETE`/`TRUNCATE` 皆回傳 `42501`、以及完整 Auth/IDOR/Admin/AuditLog API 流程。
5. **`afterAll`（L83–L118）**：依序清除 `createdUserIds` 相關表（故意**不**清除 `AuditLog`，因 `c2k_test_app_runtime` 無 `DELETE` 權限），最後關閉 `prismaInstance.$disconnect()` 與 `poolInstance.end()`。

---

## 四、環境變數名稱與載入順序

| 項目 | `integration.db.test.ts` | `app-runtime.db.test.ts` |
|---|---|---|
| **必要測試環境變數** | `TEST_DATABASE_URL` | `TEST_APP_RUNTIME_URL` |
| **Vitest 執行環境** | `NODE_ENV` 由 Vitest 預設為 `'test'` | `NODE_ENV` 由 Vitest 預設為 `'test'` |
| **`.env` 載入時機（`env.ts:4` `dotenv.config()`）** | **在 `beforeAll` 之前載入**：頂層 `import { prisma } from '../src/config/database.js'` 會先觸發 `env.ts` 執行 `dotenv.config()`（不覆寫既有 shell 變數，但若 `.env` 內定義了 `TEST_DATABASE_URL` 則會被注入）。 | **讀值不受 `.env` 影響**：`TEST_APP_RUNTIME_URL` 於 `vi.hoisted` 階段讀取（早於 `app.ts` -> `env.ts`），因此僅採外部明確傳入之行程環境變數。 |
| **`DATABASE_URL` 讀取狀況** | `env.NODE_ENV === 'test'` 時，`database.ts:61-67` **不會**讀取 `DATABASE_URL`；但若有人強制設 `NODE_ENV=development` 或 `production`，`database.ts:69-74` 會改讀 `env.DATABASE_URL`。 | 因 `vi.mock('../src/config/database.js')` 完全取代 `database.ts`，執行期**完全不讀取** `DATABASE_URL`。 |

*(註：依規範本階段未讀取 `.env` 內容，亦未輸出任何連線字串或密碼。)*

---

## 五、資料庫目標隔離分析

| 隔離條件 | `integration.db.test.ts`（`validateTestDatabaseUrl`） | `app-runtime.db.test.ts`（`validateIsolatedAppRuntimeTestUrl`） |
|---|---|---|
| **阻斷 Supabase 正式資料庫** | **有效**：僅允許 `localhost` / `127.0.0.1`，所有 `*.supabase.co` / `*.supabase.com` 皆被拒絕；且允許庫名僅 `code_to_know_test`（非 `postgres`）。 | **有效**：僅允許 `localhost` / `127.0.0.1`、Port `5434`、庫名 `code_to_know_test`、角色 `c2k_test_app_runtime`。 |
| **阻斷 PG17 歷史還原資料庫（Port `5433`）** | **有效**：`db-validation.ts:75` 僅允許 Port `5432`（或未指定），Port `5433` 直接拒絕。 | **有效**：強制 Port 必須為 `'5434'`，Port `5433` 直接拒絕。 |
| **阻斷 PG16 正式 / 開發庫（Port `5432`, `code_to_know`）** | **僅以庫名隔離（風險點）**：`validateTestDatabaseUrl` **允許 Port `5432`**（正是 PG16 預設埠），僅靠資料庫名稱必須為 `code_to_know_test` 與開發庫 `code_to_know` 區隔；因此也**無法**指向 Port `5434` 的 PG17 隔離測試容器。 | **完全隔離**：強制 Port `'5434'`，Port `5432` 直接拒絕，不會觸及 PG16。 |
| **PostgreSQL 角色隔離** | **未限制角色名稱**：連線字串未強制檢核角色（例如不限制不可為 `postgres` / `codetoknow`）。 | **嚴格限制**：必須解碼後等於 `c2k_test_app_runtime`。 |

---

## 六、所有可能的資料庫寫入與清理操作（靜態盤點）

兩支測試均**不執行** `TRUNCATE`（`app-runtime` 僅探測拒絕 `42501`）、`DROP`、`ALTER`、`CREATE TABLE`（`app-runtime` 僅探測拒絕 `42501`）或 Prisma Migration。

1. **`integration.db.test.ts`**：
   - **寫入（`CREATE` / `UPSERT` / `INSERT`）**：`Role` (`upsert` `ADMIN`, `STUDENT`)、`User`、`UserRole`、`UserProfile`、`EmailVerificationToken`、`TeacherApplication`、`AuditLog`。
   - **清理（`afterAll` `DELETE`）**：僅依 `where: { userId: { in: createdUserIds } }` 與 `where: { id: { in: createdUserIds } }` 刪除上述測試建立的資料，**不會**對未列於 `createdUserIds` 的既有資料執行無條件 `deleteMany({})`。
   - **中斷風險**：未實作 `beforeEach` / `afterEach`；若進程在 `afterAll` 執行前異常終止（`SIGKILL`），`test_admin_<ts>@codetoknow.edu`、`test_student_<ts>@codetoknow.edu` 與 `Role` `upsert` 資料會殘留於測試資料庫。
2. **`app-runtime.db.test.ts`**：
   - **寫入**：透過 `PrismaClient` 與 Supertest API 建立測試 `Role`、`User`、`UserRole`、`UserProfile`、`EmailVerificationToken`、`Session`、`TeacherApplication`、`AuditLog`；另有 7 個負向權限探測 SQL（預期全部因 `42501` 被 PostgreSQL 拒絕）。
   - **清理（`afterAll`）**：僅刪除 `createdUserIds` 所屬的非 `AuditLog` 資料；**故意保留 `AuditLog` 紀錄**（因 `c2k_test_app_runtime` 依設計無 `DELETE` 權限），且 `Role` `upsert` 不刪除。
   - **中斷/殘留風險**：每次執行會於 `code_to_know_test` 的 `AuditLog` 累積 append-only 測試紀錄；若 `AuditLog.userId` 外鍵非 `ON DELETE SET NULL` 或無對應設定，`afterAll` 刪除 `User` 可能觸發外鍵約束警告（被 `try/catch` 印出 `Cleanup warning:` 但不會清除其他非測試資料）。

---

## 七、Fail-closed 防護結果

- **未提供 `TEST_DATABASE_URL` 時（`integration.db.test.ts`）**：`beforeAll` 立即拋出 `[INTEGRATION TEST CONFIG ERROR]` 拒絕連線，不會靜默 fallback 至 `DATABASE_URL`（已在 Phase 3-C-24 `npm test` 實測確認觸發拒絕）。
- **未提供 `TEST_APP_RUNTIME_URL` 時（`app-runtime.db.test.ts`）**：`describe.skipIf` 跳過全部 3 項測試，且 `vi.mock` 不建立 `pg.Pool`（已在 Phase 3-C-24 `npm test` 實測確認 `3 skipped`）。
- **無效 URL / 錯誤主機 / 錯誤埠號 / 錯誤資料庫名稱 / 錯誤角色**：兩者皆透過原生 `new URL(...)` 解析與嚴格白名單比對，錯誤訊息不輸出密碼或完整連線字串。

---

## 八、潛在風險與修正建議

1. **`MEDIUM` — `validateTestDatabaseUrl` 綁定 Port `5432`（與 PG16 同埠）且不支援隔離 PG17 Port `5434`**：
   - **現況**：`db-validation.ts:75` 硬編碼僅允許 Port `5432`，導致 `integration.db.test.ts` 無法連線至隔離 PG17 測試容器（`5434`），反而只允許連到本機 `5432`（PG16 所在埠）。
   - **建議**：後續授權調整時，評估於 `validateTestDatabaseUrl` 允許測試專用隔離埠（或由專案規範明確區分 `5434` 專用測試容器）並加上角色檢查，避免與 PG16 同埠。
2. **`LOW` — 兩支 `.db.test.ts` 平行執行與測試殘留風險**：
   - **現況**：Vitest 預設平行執行檔案；兩支測試對同一 `code_to_know_test` 執行時，`app-runtime.db.test.ts` 的 `GET /api/admin/audit-logs` 與 `integration.db.test.ts` 的 `auditLog.deleteMany` 可能同時操作。且 `integration.db.test.ts` 依賴 `env.ts` 之 `dotenv.config()`，若 `.env` 誤設 `TEST_DATABASE_URL` 會自動載入。
   - **建議**：執行資料庫整合測試時建議逐支或序列執行（`--no-file-parallelism`），並於獨立可丟棄測試容器（Port `5434`）中執行，完畢後視需要重建乾淨測試庫。
3. **`LOW` — `integration.db.test.ts` 缺變數時採 `throw` 而非 `skipIf`**：
   - 導致一般離線執行 `npm test` 時 Exit Code 為 `1`（雖符合 fail-closed，但與 `app-runtime.db.test.ts` 行為不一致；若需保留 fail-closed 阻斷，建議維持現狀並透過專屬指令區分離線與 DB 測試）。

---

## 九、測試執行前必要條件

在未來正式授權執行資料庫整合測試前，必須同時滿足以下條件：

1. 使用者明確啟動本機 Docker Desktop，並確認隔離 PG17 測試容器（Port `5434`、`code_to_know_test`）健康運作（**絕不可**連接 Port `5432`、`5433` 或 Supabase）。
2. 若要執行 `integration.db.test.ts` 於 PG17 隔離環境，須先獲得授權修正 `validateTestDatabaseUrl` 之 Port 白名單或確認目標測試實例隔離性。
3. 透過單次指令行環境變數明確傳入 `TEST_APP_RUNTIME_URL`（角色限 `c2k_test_app_runtime`、Port `5434`、DB `code_to_know_test`），禁止將測試連線字串寫入正式 `.env`。
4. 確認 `NODE_ENV=test` 且採用序列執行（避免兩支 `.db.test.ts` 併發寫入同一測試庫）。

---

## 十、最終判定

- **最終判定：`PARTIAL PASS`**
- **判定理由**：
  - **程式碼靜態檢查已確認**：兩支資料庫整合測試皆具備明確白名單與 Fail-closed 防護，絕不會連線正式 Supabase、PG17 還原資料庫（`5433`）或開發資料庫（`code_to_know`），且 `afterAll` 清理皆嚴格限定於 `createdUserIds`。其中 `app-runtime.db.test.ts` 已完全隔離至 Port `5434` 與 `c2k_test_app_runtime`。
  - **待解決條件與未驗證部分**：
    1. 主機 Docker Desktop daemon 目前未啟動，無法確認隔離 PG17 容器與測試資料庫狀態。
    2. `integration.db.test.ts` 所使用的 `validateTestDatabaseUrl` 目前僅允許 Port `5432`（與 PG16 同埠）且未限制角色，尚未對齊 PG17 隔離測試埠 `5434`。
    3. 兩支資料庫整合測試之**實際資料庫測試尚未執行（`NOT TESTED`）**。
