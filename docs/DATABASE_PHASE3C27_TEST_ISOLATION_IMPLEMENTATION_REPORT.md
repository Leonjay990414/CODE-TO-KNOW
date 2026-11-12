# CODE TO KNOW｜Phase 3-C-27：資料庫整合測試隔離機制實作與離線驗收報告

- 執行日期：2026-11-12
- 階段定位：Phase 3-C-27（依 Phase 3-C-26 授權範圍實作資料庫整合測試隔離機制與離線驗收）
- 執行原則：全程未啟動 Docker Desktop、未執行 `test:db` 或任何資料庫連線/寫入、未執行 Prisma Migration/Seed/Reset、未讀取或修改 `.env`、未執行 Git Commit/Push、未變更任何備份檔。

---

## 一、修改檔案清單（共 5 個授權程式碼/設定檔 + 本報告）

| 檔案路徑 | 變更性質 | 摘要說明 |
|---|---|---|
| [`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) | 修改 | 新增 `ALLOWED_ISOLATED_TEST_PORTS` (`['5434']`)、`ALLOWED_ISOLATED_TEST_ROLES` (`['c2k_test_app_runtime']`) 與共用驗證函式 [`validateIsolatedPg17TestUrl`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L114-L195)，完整保留既有 `validateTestDatabaseUrl` 與正式環境驗證限制。 |
| [`backend/tests/integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts) | 修改 | 改採 `vi.hoisted` 提前讀取 `TEST_DATABASE_URL`、`vi.mock('../src/config/database.js')` 隔離全域資料庫設定、接入 `validateIsolatedPg17TestUrl`、`afterAll` 使用 `try / finally` 確實關閉 `prisma.$disconnect()` 與 `pool.end()`，並移除違反 append-only 權限的 `auditLog.deleteMany`。 |
| [`backend/tests/app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts) | 修改 | 移除內嵌重複驗證器，改用共用 [`validateIsolatedPg17TestUrl`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L114-L195)，保留 `vi.hoisted`、負向 `42501` 權限測試、`AuditLog` append-only 驗證與 `try / finally` 連線池關閉。 |
| [`backend/tests/db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts) | 修改 | 新增 `FC-01`～`FC-10` 共 10 項 `validateIsolatedPg17TestUrl` 離線 Fail-closed 測試案例（全採合成假資料）。 |
| [`backend/package.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json) | 修改 | 新增 `"test:offline": "vitest run --exclude tests/**/*.db.test.ts"` 與 `"test:db": "vitest run --no-file-parallelism tests/app-runtime.db.test.ts tests/integration.db.test.ts"`。 |
| [`docs/DATABASE_PHASE3C27_TEST_ISOLATION_IMPLEMENTATION_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C27_TEST_ISOLATION_IMPLEMENTATION_REPORT.md) | 新增 | 本階段實作與離線驗收報告。 |

---

## 二、隔離驗證函式實作內容（[`validateIsolatedPg17TestUrl`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L114-L195)）

1. **五重白名單校驗（缺一不可）**：
   - **Protocol**：僅允許 `postgres:`、`postgresql:`。
   - **Host**：僅允許 `localhost`、`127.0.0.1`（拒絕所有雲端 `*.supabase.co`/`*.supabase.com` 與任意遠端主機）。
   - **Port**：必須顯式指定且為 `5434`（禁止省略 Port 以防隱性預設 `5432`；拒絕 `5432` PG16、`5433` PG17 還原庫與 `6543`）。
   - **Database**：URL 解碼並正規化後必須為 `code_to_know_test`（拒絕 `code_to_know`、`postgres`、`code-to-know-prod`）。
   - **Role (`username`)**：必須顯式指定且解碼後為 `c2k_test_app_runtime`（拒絕 `postgres`、`codetoknow`、`migration_admin`、`app_runtime` 及省略角色）。
2. **Fail-closed 與防憑證洩漏**：
   - 任何無效 URL、編碼異常或非白名單項目皆拋出 `[ISOLATED TEST DB CONFIG ERROR]`，且錯誤訊息絕不輸出密碼、Query String 或完整連線字串。
   - 既有 `validateTestDatabaseUrl`、`validateDevelopmentDatabaseUrl`、`validateCloudRuntimeDatabaseUrl`、`validateMigrationDatabaseUrl` 均保持原樣未放寬。

---

## 三、兩支資料庫測試修改摘要與額外安全審查

1. **角色權限一致性**：兩支測試現皆統一使用 `validateIsolatedPg17TestUrl`，共同鎖定非超級使用者角色 `c2k_test_app_runtime`（Port `5434`、`code_to_know_test`）。
2. **`AuditLog` 最小權限維持**：`integration.db.test.ts` 已移除 `afterAll` 中的 `auditLog.deleteMany`；`app-runtime.db.test.ts` 保留對 `AuditLog` `UPDATE`/`DELETE`/`TRUNCATE` 拒絕 `42501` 的驗證。
3. **環境變數讀取順序隔離**：兩支測試皆在 `vi.hoisted(...)` 階段擷取環境變數（早於 `env.ts` `dotenv.config()`），並透過 `vi.mock('../src/config/database.js')` 攔截一般應用程式資料庫設定，無測試程式可旁路連線 PG16、PG17 還原庫或 Supabase。
4. **Fail-closed 保護確認（靜態檢查）**：
   - `integration.db.test.ts` 缺少 `TEST_DATABASE_URL` 時於 `beforeAll` 立即拋出 `[INTEGRATION TEST CONFIG ERROR]`。
   - `app-runtime.db.test.ts` 缺少 `TEST_APP_RUNTIME_URL` 時跳過；若提供非空但違規之連線字串，`vi.mock` 內呼叫 `validateIsolatedPg17TestUrl` 會立即 Fail-closed 拋錯。

---

## 四、Fail-closed 測試結果（`db-config-safety.test.ts`）

- 執行指令：`cd backend; .\node_modules\.bin\vitest.cmd run tests/db-config-safety.test.ts`
- 實際結果：**`Test Files 1 passed (1)`、`Tests 69 passed (69)`**（Exit Code `0`），包含既有 59 項與新增 **FC-01 ～ FC-10** 共 10 項全數通過，驗證所有違規 Host/Port/DB/Role/Protocol/省略值與錯誤訊息不洩漏密碼皆正確生效。

---

## 五、Backend 離線測試與 TypeScript Build 結果

- **`npm run test:offline`**：
  - 執行指令：`cd backend; npm.cmd run test:offline`（`vitest run --exclude tests/**/*.db.test.ts`）
  - 實際結果：**`Test Files 11 passed (11)`、`Tests 167 passed (167)`**（Exit Code `0`）。
  - 涵蓋：`db-config-safety` (69)、`rbac-workflow` (17)、`validation` (12)、`safe-error-logger` (19)、`database-ssl-config` (7)、`audit-redaction` (10)、`auth-lifecycle` (6)、`security` (5)、`idor-ownership` (7)、`admin-hardening` (10)、`api` (5)；**0 支 `.db.test.ts` 被載入**。
- **Backend TypeScript Build**：
  - 執行指令：`cd backend; npm.cmd run build`（`tsc`）
  - 實際結果：**通過，0 錯誤**（Exit Code `0`）。

---

## 六、Frontend 測試與 Build 結果

- **Frontend 測試**：
  - 執行指令：`cd frontend; ..\backend\node_modules\.bin\vitest.cmd run tests/sources-route-protection.test.tsx`
  - 實際結果：**`Test Files 1 passed (1)`、`Tests 7 passed (7)`**（Exit Code `0`）。
- **Frontend Build**：
  - 執行指令：`cd frontend; npm.cmd run build`（`tsc && vite build`）
  - 實際結果：**通過**（`1612 modules transformed`，產出 `dist/index.html`、`dist/assets/index-HmsvxDpa.css`、`dist/assets/index-BybpJLnO.js` `494.93 kB`，Exit Code `0`）。

---

## 七、連線池與清理安全性

- 兩支 `.db.test.ts` 皆於 `vi.mock('../src/config/database.js')` 建立獨立 `pg.Pool` 與 `PrismaClient`，並於 `afterAll` 使用 `try / finally` 依序呼叫 `await prismaInstance.$disconnect()` 與 `await poolInstance.end()`。
- 清理資料僅針對 `createdUserIds` 追蹤清單刪除（`teacherApplication`、`emailVerificationToken`、`passwordResetToken`、`session`、`userProfile`、`userRole`、`user`），不會影響非測試資料。
- `package.json` 的 `test:db` 已強制加上 `--no-file-parallelism`，並依序先跑 `app-runtime.db.test.ts` 再跑 `integration.db.test.ts`。

---

## 八、Git 與備份完整性

- **Git 分支 / HEAD**：`main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無 Commit、Push、Reset 或 Clean。
- **是否曾連線任何資料庫**：**否**（未啟動 Docker，未執行 `test:db`，`test:offline` 未連通任何資料庫）。
- **是否曾修改資料庫或備份**：**否**。
- **原始備份 SHA-256（實測未變）**：
  - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`
- **背景任務**：無殘留背景任務。

---

## 九、未解決風險（尚未經實機 PG17 實測）

1. **Docker Desktop 尚未啟動**：隔離 PG17 容器（Port `5434`、`code_to_know_test`、`c2k_test_app_runtime`）尚未於主機重開機後啟動並重新驗證。
2. **實際資料庫整合測試尚未執行（`NOT TESTED`）**：`npm run test:db` 依本階段禁止事項未執行；`integration.db.test.ts` 改用 `c2k_test_app_runtime` 後，若 `AuditLog.userId` 外鍵設定於刪除 `User` 時有 RESTRICT 限制，或測試帳號清理順序受 `AuditLog` 影響，將於下一階段實測時驗證。

---

## 十、下一階段建議與授權需求

- **程式碼隔離條件已具備**：兩支 DB 測試在程式碼層面已具備進入隔離 PG17 實測的安全條件。
- **下一階段所需授權**：
  1. 請使用者啟動本機 Docker Desktop，並確認隔離 PG17 容器（Port `5434`、`code_to_know_test`、`c2k_test_app_runtime`）處於健康狀態（不動 PG16 `5432` 與 PG17 還原庫 `5433`）。
  2. 授權於單次測試行程中設定 `TEST_APP_RUNTIME_URL` 與 `TEST_DATABASE_URL`，執行 `cd backend; npm.cmd run test:db` 完成真實隔離 PG17 驗收。
