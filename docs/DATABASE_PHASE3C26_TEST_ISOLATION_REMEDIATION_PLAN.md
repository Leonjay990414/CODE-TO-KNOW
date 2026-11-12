# CODE TO KNOW｜Phase 3-C-26：資料庫整合測試隔離修正方案設計與安全審查

- 設計日期：2026-11-12
- 階段定位：Phase 3-C-26（針對 Phase 3-C-25 `PARTIAL PASS` 所揭露之隔離風險提出唯讀修正設計與安全審查）
- 執行原則：全程唯讀，未修改任何程式碼、測試檔、Schema、Migration、`.env` 或備份；未啟動 Docker、未連線或寫入任何資料庫。
- 證據分級原則：
  - **已經由靜態分析確認的事項**：既有程式碼（`db-validation.ts`、`database.ts`、`env.ts`、`vitest.config.ts`、`integration.db.test.ts`、`app-runtime.db.test.ts`、`db-config-safety.test.ts`）的實際邏輯與相依關係。
  - **尚未經實際測試確認的事項**：本設計尚未實作，且所有資料庫整合測試與提案後的新測試案例均尚未於真實 PG17 環境執行。
  - **需要使用者授權才能執行的事項**：任何程式碼修改、測試檔調整、啟動 Docker Desktop、以及於隔離 PG17 容器（Port `5434`）執行資料庫整合測試。

---

## 一、Phase 3-C-25 風險逐項追蹤

| Phase 3-C-25 風險項目 | 風險等級 | 靜態分析現況（已確認） | 本階段修正設計方向 |
|---|---|---|---|
| 1. `validateTestDatabaseUrl` 綁定 Port `5432`（PG16 同埠）且未限制角色 | `MEDIUM` | [`db-validation.ts:75`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L75) 僅允許 Port `5432` 或省略埠號，無法連線 Port `5434` 隔離 PG17 容器，且不檢查 `parsed.username`；同時 [`db-config-safety.test.ts:26-32,147`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts#L26-L32) 依賴舊 `5432` 單元契約。 | 保留 `validateTestDatabaseUrl` 舊契約不破壞既有單元測試；新增嚴格隔離驗證函式 `validateIsolatedPg17TestUrl`（強制 Port `5434` + Host + DB + Role 四重白名單）供 `.db.test.ts` 共用。 |
| 2. `integration.db.test.ts` 頂層匯入 `database.ts` 先觸發 `.env` 載入 | `LOW` | [`integration.db.test.ts:2`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts#L2) 直接匯入 `prisma`，先執行 `env.ts:4` 的 `dotenv.config()`；若 `.env` 誤設 `TEST_DATABASE_URL` 會先被載入。 | 比照 `app-runtime.db.test.ts`，改以 `vi.hoisted` 於 `dotenv.config()` 前擷取環境變數，並以 `vi.mock('../src/config/database.js')` 建立隔離連線池與主動 `pool.end()`。 |
| 3. 兩支 `.db.test.ts` 平行執行與 `AuditLog` 清理衝突 | `LOW` | `vitest.config.ts` 未關閉檔案平行度；若同時執行，`integration.db.test.ts` 的 `auditLog.deleteMany` 與 `app-runtime.db.test.ts` 的 `GET /api/admin/audit-logs` 共用 `code_to_know_test`。另若 `integration` 改用 `c2k_test_app_runtime`，`auditLog.deleteMany` 會因 `42501` 失敗。 | 規劃序列執行流程（先 `app-runtime`、後 `integration`，`--no-file-parallelism`），並明確定義 `AuditLog` append-only 權限邊界。 |
| 4. `integration.db.test.ts` 缺變數時採 `beforeAll` 拋錯導致 `npm test` Exit 1 | `LOW` | 目前設計為 fail-closed 拋錯阻斷，但導致離線執行 `npm test` 時出現 1 failed suite。 | 區分離線測試腳本與 DB 測試腳本：一般離線測試不強制觸發 DB 測試，或於缺變數時安全跳過、但當變數存在（含空白/錯誤格式/非 `5434`/非允許角色）時必須 **立即 Fail-closed 拋錯**。 |
| 5. Docker Desktop Daemon 未啟動 | 待環境確認 | 主機重開機後 Docker Desktop pipe 不存在，無法即時檢查 PG17 容器（`5434`）。 | 納入未來執行前第 1 步前置檢查清單（須由使用者啟動後再驗證）。 |

---

## 二、兩支測試的完整隔離設計

### 2.1 `integration.db.test.ts` 連線與生命周期隔離設計

1. **獨立環境變數與 Hoisted 讀值**：
   - 在 `vi.hoisted(...)` 中讀取 `process.env.TEST_DATABASE_URL`（發生於任何模組匯入與 `env.ts` `dotenv.config()` 之前），杜絕 `.env` 意外注入測試目標。
2. **四重白名單校驗（`validateIsolatedPg17TestUrl`）**：
   - 必須同時通過 Protocol、Host、Port（明確 `'5434'`）、Database Name（`'code_to_know_test'`）與 Role 白名單；任一不符或缺少即拋錯 Fail-closed。
3. **模組隔離 Mock（`vi.mock('../src/config/database.js')`）**：
   - 與 `app-runtime.db.test.ts` 一致，攔截 `src/config/database.ts`，確保測試期間不建立連向 `DATABASE_URL` 或預設 `5432` 的全域連線池，且可在 `afterAll` 明確呼叫 `pool.end()` 釋放所有連線。
4. **`AuditLog` 與角色權限一致性處理**：
   - 靜態審查發現：若 `integration.db.test.ts` 使用最小權限角色 `c2k_test_app_runtime`（無 `AuditLog` `DELETE` 權限），現行 [`integration.db.test.ts:36-38`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts#L36-L38) 的 `prisma.auditLog.deleteMany(...)` 會觸發 PostgreSQL `42501`。
   - **修正選項**：
     - 建議方案：`integration.db.test.ts` 亦使用 `c2k_test_app_runtime` 角色貼近真實 Runtime 權限，並於 `afterAll` 移除 `auditLog.deleteMany`（比照 `app-runtime.db.test.ts` 保留 append-only `AuditLog`，或僅於外部測試結束後重置容器測試庫）；且 `integration.db.test.ts` 本身應在 `afterAll` 捕捉單表清理錯誤前先確保非 `AuditLog` 表（`teacherApplication`、`emailVerificationToken`、`passwordResetToken`、`session`、`userProfile`、`userRole`、`user`）完整清除。

### 2.2 `app-runtime.db.test.ts` 隔離確認

經靜態檢查確認既有隔離設計已相當嚴謹：
- **Port `5434`**：強制 `parsed.port === '5434'`，不可省略且拒絕 `5432`（PG16）、`5433`（PG17 還原庫）與 `6543`。
- **DB `code_to_know_test`**：強制路徑解碼後為 `code_to_know_test`。
- **Role `c2k_test_app_runtime`**：強制 `decodeURIComponent(parsed.username) === 'c2k_test_app_runtime'`，拒絕 `postgres`、`codetoknow`、`migration_admin` 與正式 `app_runtime`。
- **`vi.hoisted` 讀值**：早於 `app.ts` 與 `env.ts` 載入，不受 `.env` 污染。
- **建議補強**：將內嵌於 `app-runtime.db.test.ts` 的 `validateIsolatedAppRuntimeTestUrl` 抽離至 `db-validation.ts` 共用，並對非空但無效的 `TEST_APP_RUNTIME_URL` 維持「直接拋錯 Fail-closed」（僅在完全未定義 `undefined` 時跳過，避免空白字串靜默繞過）；同時為 `database.ts` mock 補齊 `env.NODE_ENV === 'test'` 斷言。

---

## 三、建議修改的檔案與函式（本階段僅設計，尚未修改）

| 檔案路徑 | 建議修改函式 / 區塊 | 修正目的 |
|---|---|---|
| [`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) | 新增 `ALLOWED_ISOLATED_TEST_PORTS` (`['5434']`)、`ALLOWED_ISOLATED_TEST_ROLES` (`['c2k_test_app_runtime']`) 與 `validateIsolatedPg17TestUrl(rawUrl, options?)` | 提供 Host + Port + DB + Role 四重嚴格白名單；不改動既有 `validateCloudRuntimeDatabaseUrl` / `validateMigrationDatabaseUrl` / `validateTestDatabaseUrl` 原有正式與單元測試限制。 |
| [`backend/tests/integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts) | `vi.hoisted` + `vi.mock('../src/config/database.js')` + `beforeAll` / `afterAll` (`pool.end()`) | 改用 `validateIsolatedPg17TestUrl` 強制鎖定 Port `5434` 與 `c2k_test_app_runtime`，防止 `.env` 污染並確保連線池完整關閉。 |
| [`backend/tests/app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts) | `vi.hoisted` 呼叫共用 `validateIsolatedPg17TestUrl` | 統一兩支 DB 測試的安全閘門，避免兩套驗證規則漂移。 |
| [`backend/tests/db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts) | 新增 `validateIsolatedPg17TestUrl()` 單元測試區塊 | 驗證所有 Fail-closed 邊界案例（離線可測）。 |
| [`backend/package.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json) | 區分 `test:offline` 與 `test:db`（含 `--no-file-parallelism`） | 確保離線測試穩定且 DB 測試強制序列執行。 |

*(註：`env.ts`、`database.ts` 及正式環境驗證函式無須放寬或修改，維持現有防禦。)*

---

## 四、Host、Port、DB、Role 四重白名單規則

```ts
// 建議規則（實作須待使用者授權）
ALLOWED_TEST_HOSTS          = ['localhost', '127.0.0.1']
ALLOWED_ISOLATED_TEST_PORTS = ['5434']                  // 不可省略 Port，禁止 5432 / 5433 / 6543
ALLOWED_TEST_DB_NAMES       = ['code_to_know_test']     // URL 解碼後比對，禁止 code_to_know / postgres
ALLOWED_ISOLATED_TEST_ROLES = ['c2k_test_app_runtime']  // URL 解碼後比對，禁止 postgres / codetoknow / migration_admin / app_runtime
```

**檢核原則**：
1. 必須同時驗證 **協定 (`postgres:` / `postgresql:`) + Host + Port + DB Name + Role** 五項，不得僅依賴 Port 判斷。
2. `parsed.port` 為空字串（隱含預設 `5432`）必須**拒絕**，確保不會隱性連到 PG16（`5432`）。
3. `parsed.username` 為空字串必須**拒絕**，確保不會隱性使用 OS 預設超級使用者連線。
4. 任一錯誤訊息不得包含密碼、Query String 或完整連線字串。

---

## 五、Fail-closed 測試案例設計（待授權實作於 `db-config-safety.test.ts`）

| 案例編號 | 測試輸入方向（僅結構示意，不含真實憑證） | 預期結果（Fail-closed） |
|---|---|---|
| FC-01 | `undefined`、`""`、`"   "` | 拋出缺失測試連線字串錯誤 |
| FC-02 | 指向本機 Port `5432`（PG16 埠）+ `code_to_know_test` | **拒絕**（`Disallowed port '5432'`） |
| FC-03 | 省略 Port（預設 `5432`）+ `code_to_know_test` | **拒絕**（`Port '5434' must be explicitly specified`） |
| FC-04 | 指向本機 Port `5433`（PG17 還原庫）+ `code_to_know_test` | **拒絕**（`Disallowed port '5433'`） |
| FC-05 | 指向 `aws-0-ap-southeast-2.pooler.supabase.com:5434/code_to_know_test` 或 `*.supabase.co` | **拒絕**（`Disallowed host`） |
| FC-06 | 指向 `127.0.0.1:5434/code_to_know`（開發庫名稱）或 `/postgres` | **拒絕**（`Disallowed database`） |
| FC-07 | 指向 `127.0.0.1:5434/code_to_know_test` 但角色為 `postgres`、`codetoknow`、`migration_admin`、`app_runtime` 或未填角色 | **拒絕**（`Disallowed role`） |
| FC-08 | 含特殊字元密碼之畸形 URL | **拒絕**且錯誤訊息不得洩漏密碼片段 |
| FC-09 | `127.0.0.1:5434/code_to_know_test` 且角色為 `c2k_test_app_runtime` | **PASS**（回傳標準化驗證後連線字串） |

---

## 六、平行執行與環境變數處理方案

1. **避免同一資料庫併發寫入與 `AuditLog` 競態**：
   - 於執行 DB 整合測試時強制使用 Vitest `--no-file-parallelism`（或明確分兩次指令依序執行 `app-runtime.db.test.ts` 與 `integration.db.test.ts`）。
   - 兩支測試均使用 `Date.now()` 搭配專屬前綴（`rt_*` 與 `test_*`）建立測試帳號，且 `afterAll` 嚴格以 `createdUserIds` 篩選清除。
2. **杜絕 `.env` 載入順序污染**：
   - 兩支 `.db.test.ts` 一律於 `vi.hoisted` 擷取環境變數（早於 `env.ts` 的 `dotenv.config()`）。
   - 規範執行時僅透過**單次指令行臨時環境變數**傳入，不在 `.env` 中存放 `TEST_DATABASE_URL` 或 `TEST_APP_RUNTIME_URL`。
3. **連線池關閉與中斷殘留處理**：
   - `afterAll` 統一於 `try / finally` 區塊依序執行 `prisma.$disconnect()` 與 `pool.end()`，避免連線池未關閉導致 Vitest hanging。
   - 若測試中斷留下測試帳號，僅影響隔離容器內 `code_to_know_test`（不影響 PG16、PG17 還原庫或 Supabase），可於該隔離測試庫安全重清或重建測試容器。

---

## 七、未來實際測試執行順序（須待授權後始可執行）

1. **確認 Docker Desktop 狀態**：確認 Docker daemon 已由使用者啟動且運作正常。
2. **確認環境隔離**：`docker ps` 確認 PG16（`5432`）、PG17 還原庫（`5433`）與 PG17 隔離測試容器（`5434`）各自獨立存在且 Port 無衝突。
3. **確認測試目標**：唯讀確認 Port `5434` 容器內存在 `code_to_know_test` 資料庫與非超級使用者角色 `c2k_test_app_runtime`。
4. **單次行程注入環境變數**：僅在該次測試 Shell 行程中設定 `NODE_ENV=test` 及測試環境變數，不寫入 `.env` 或使用者環境檔。
5. **先執行 `app-runtime.db.test.ts`**：單獨執行並確認 `42501` 權限邊界與完整 API 流程全數通過。
6. **再執行 `integration.db.test.ts`**：單獨序列執行並確認通過。
7. **驗證測試後資料與清理**：檢查 Port `5434` 測試庫內無殘留 `test_*` / `rt_*` 使用者（`User` 表回復測試前狀態），確認 PG16 與 PG17 還原庫零異動。
8. **確認連線池關閉**：確認 Vitest 行程正常結束退出（無掛起連線池或殘留 Node/tsx 程序）。
9. **執行離線測試與 Build 回歸**：重新執行 Backend 11 支離線測試、`npm run build`、Frontend 測試與 Build，確認整體基線無回歸。

---

## 八、回歸測試清單

授權實作修正後，應執行之回歸清單：
1. `backend/tests/db-config-safety.test.ts`（含新增 FC-01～FC-09 單元測試）。
2. Backend 全部離線測試（`audit-redaction`、`safe-error-logger`、`auth-lifecycle`、`admin-hardening`、`rbac-workflow`、`idor-ownership`、`security`、`validation`、`database-ssl-config`、`api`）。
3. `backend/npm run build`（`tsc`）。
4. `frontend/tests/sources-route-protection.test.tsx` 與 `frontend/npm run build`。
5. （於 Docker 啟動與隔離 PG17 容器就緒後）`app-runtime.db.test.ts` 與 `integration.db.test.ts` 序列實測。

---

## 九、尚未解決的風險（尚未經實際測試確認）

1. **Docker Desktop 目前未啟動**，隔離 PG17 容器（`5434`）內的 `code_to_know_test` Schema、Migration 狀態與 `c2k_test_app_runtime` 權限尚未於本次重開機後實地重驗。
2. **本階段所有修正設計皆為靜態方案**，尚未實作亦尚未經實機 PostgreSQL 執行驗證。
3. 若 `integration.db.test.ts` 改以 `c2k_test_app_runtime` 執行，其 `afterAll` 的 `auditLog.deleteMany` 行為須與 `AuditLog` append-only 策略對齊後再實測確認。

---

## 十、是否需要使用者授權程式碼修改

- **需要明確授權**：
  - 本階段（Phase 3-C-26）已嚴格遵守唯讀規範，**未修改任何程式碼或測試檔案**。
  - 若要進入下一階段實作上述設計（修改 `db-validation.ts`、`integration.db.test.ts`、`app-runtime.db.test.ts`、`db-config-safety.test.ts`、`package.json`）並啟動隔離 PG17 測試，**必須先取得使用者明確授權**。
