# CODE TO KNOW｜Phase 3-C-20：AuditLog 統一脫敏獨立安全稽核報告

- 稽核日期：2026-11-11
- 稽核階段：Phase 3-C-20（唯讀獨立安全稽核）
- 參考基線報告：
  - `docs/DATABASE_PHASE3C18_INDEPENDENT_SECURITY_AUDIT.md`
  - `docs/DATABASE_PHASE3C19_AUDITLOG_REDACTION_HARDENING_REPORT.md`
- 稽核原則：全程不修改任何既有程式碼、測試、設定檔、`.env`、Schema、Migration、Docker 容器/Volume 或備份檔案；僅執行唯讀檢查、獨立探針驗證、既有測試與建置確認，並於最後產出本報告。

---

## 1. Git 與環境基線

### 1.1 Git 分支與 HEAD

- Branch：`main`
- HEAD Commit：`86a0f1116693bcce476b8747a446900d54b29a4a`
- 既有工作目錄狀態（報告寫入前）：共 15 個既有已追蹤變更（含 `backend/src/utils/audit.ts`、`backend/src/modules/auth/auth.service.ts`、`backend/src/modules/admin/admin.service.ts`、`backend/src/modules/teachers/teacher.service.ts` 與前期資料庫/前端檔案），以及 `backend/tests/audit-redaction.test.ts`、`docs/DATABASE_PHASE3C19_AUDITLOG_REDACTION_HARDENING_REPORT.md` 等未追蹤檔案。

### 1.2 背景任務與程序狀態

- `manage_task list` 回傳：`No background tasks are currently running.`
- 無任何殘留 `vitest`、`tsx` 或舊階段測試背景程序。

### 1.3 Phase 3-C-19 相關異動範圍確認

經檢視工作目錄，`Phase 3-C-19` 主要異動集中於：
- `backend/src/utils/audit.ts`（統一安全寫入入口 `logAuditEvent` 與脫敏機制）
- `backend/src/modules/auth/auth.service.ts`（7 處審計寫入）
- `backend/src/modules/admin/admin.service.ts`（2 處審計寫入與 1 處讀取清單脫敏）
- `backend/src/modules/teachers/teacher.service.ts`（1 處審計寫入）
- `backend/tests/audit-redaction.test.ts`（新增單元/靜態檢查測試檔）
- `docs/DATABASE_PHASE3C19_AUDITLOG_REDACTION_HARDENING_REPORT.md`

---

## 2. `AuditLog` 寫入與讀取入口完整盤點

透過 PowerShell `Select-String` 針對 `backend/src` 全數 `.ts` 檔案搜尋 `auditLog|logAuditEvent|sanitizeAudit`，完整清點如下：

| 類別 | 檔案與行號 | 呼叫形式 / 用途 | 說明 |
|---|---|---|---|
| 寫入工具底層 | `backend/src/utils/audit.ts:265` | `dbClient.auditLog.create({ data })` | 結構化多載統一建立處（可接預設 `prisma` 或互動 `tx`） |
| 寫入工具底層 | `backend/src/utils/audit.ts:274` | `await prisma.auditLog.create({ data })` | Legacy 4 參數多載底層建立處（`try/catch` best-effort） |
| 服務寫入 #1 | `backend/src/modules/auth/auth.service.ts:84` | `await logAuditEvent({ action: 'USER_REGISTER', ... })` | 註冊事件（Standalone `await`） |
| 服務寫入 #2 | `backend/src/modules/auth/auth.service.ts:133` | `await logAuditEvent({ action: 'LOGIN_FAILED', ... })` | 密碼錯誤失敗登入事件（Standalone `await`） |
| 服務寫入 #3 | `backend/src/modules/auth/auth.service.ts:159` | `await logAuditEvent({ action: 'USER_LOGIN', ... })` | 成功登入事件（Standalone `await`） |
| 服務寫入 #4 | `backend/src/modules/auth/auth.service.ts:193` | `await logAuditEvent({ action: 'USER_LOGOUT', ... })` | 登出事件（Standalone `await`） |
| 服務寫入 #5 | `backend/src/modules/auth/auth.service.ts:300` | `await logAuditEvent({ action: 'EMAIL_VERIFIED', ... }, tx)` | 電子郵件驗證（Interactive `$transaction(tx)`） |
| 服務寫入 #6 | `backend/src/modules/auth/auth.service.ts:346` | `await logAuditEvent({ action: 'PASSWORD_RESET_REQUESTED', ... })` | 重設密碼請求（Standalone `await`） |
| 服務寫入 #7 | `backend/src/modules/auth/auth.service.ts:406` | `await logAuditEvent({ action: 'PASSWORD_RESET_COMPLETED', ... }, tx)` | 重設密碼完成（Interactive `$transaction(tx)`） |
| 服務寫入 #8 | `backend/src/modules/teachers/teacher.service.ts:45` | `await logAuditEvent({ action: 'TEACHER_APPLICATION_SUBMITTED', ... })` | 教師身分申請送出（Standalone `await`） |
| 服務寫入 #9 | `backend/src/modules/admin/admin.service.ts:131` | `logAuditEvent({ action: 'TEACHER_APPLICATION_APPROVED', ... })` | 核准教師申請（納入 Batch `prisma.$transaction([...])`） |
| 服務寫入 #10 | `backend/src/modules/admin/admin.service.ts:190` | `logAuditEvent({ action: 'TEACHER_APPLICATION_REJECTED', ... })` | 駁回教師申請（納入 Batch `prisma.$transaction([...])`） |
| 管理端讀取 | `backend/src/modules/admin/admin.service.ts:214,236` | `prisma.auditLog.findMany(...)` + `sanitizeAuditDetails(entry.details)` | 讀取清單並做縱深防禦二度脫敏 |

註：另查 `backend/src/utils/ownership.ts:52` 僅為靜態權限策略註記字串，非資料庫寫入呼叫。

---

## 3. 統一寫入入口覆蓋度與旁路檢查證據

1. **全域直寫掃描**：除 `backend/src/utils/audit.ts:265` 與 `:274` 兩行 `logAuditEvent` 內部實作外，`backend/src` 所有控制器、服務、中介層與工具模組均**無任何直接呼叫** `prisma.auditLog.create`、`tx.auditLog.create`、`createMany`、`upsert`、`update` 或 `delete` 之程式碼。
2. **讀取清單防禦**：`admin.service.ts:236` 於回傳既有資料前仍執行 `sanitizeAuditDetails(entry.details)`，確保歷史舊紀錄（即使早於 Phase 3-C-19 寫入）經由 `GET /api/admin/audit-logs` 輸出時亦不致回傳明文憑證。
3. **編譯/架構旁路邊界評估**：`config/database.ts` 仍匯出具備完整 Prisma Client 介面的 `prisma` 實例，語言層級本身無法禁止未來新程式直接寫出 `prisma.auditLog.create(...)`；目前主要依賴 `backend/tests/audit-redaction.test.ts` 的原始碼靜態掃描防堵誤用，實測有效。

---

## 4. 獨立脫敏測試結果（Scratch Probe：`phase3c20_audit_probe.ts`，`PROBE_EXIT=0`）

除 repo 既有測試外，本稽核另以獨立暫存探針測試 `audit.ts` 各邊界情境：

1. **12 種 URL / DSN 協定與情境（`dsnChecks`）**：
   - `postgresql`、`postgres`、`redis`、`redisNoUser`（無使用者名稱僅含密碼 -> `redis://:[REDACTED]@h:6379/0`）、`rediss`、`mysql`、`mongodb`、`mongodb+srv`、`amqp`、`amqps`、`https`（含基本認證帳號密碼）共 11 條含密連線字串之密碼區段全數替換為 `[REDACTED]`。
   - 無憑證公開網址 `https://codetoknow.edu/public/docs?page=1`（`httpsPublic`）完整保留未誤傷。
2. **混合陣列、循環參考與深度上限（`mixedArrayAndDepth`）**：
   - 第 5/6 層內含 `token` 鍵值正確替換為 `"[REDACTED]"`。
   - 超過 `MAX_AUDIT_SANITIZE_DEPTH = 6` 之深層巢狀陣列/物件停止遞迴並回傳 `"[MAX_DEPTH_REDACTED]"`。
3. **集合項目與鍵值數量上限（`collectionCap`）**：
   - 110 個鍵之物件僅保留前 `MAX_AUDIT_COLLECTION_ITEMS = 100` 鍵，附帶 `__truncatedKeys: 10`，且尾端第 101+ 鍵內含敏感字串未外洩（`containsTailSecret: false`）。
   - 105 項陣列截斷為前 100 項並於最末追加 `"...[TRUNCATED_5_ITEMS]"`。
4. **超長字串截斷前先脫敏（`largeString`）**：
   - 超過 `MAX_AUDIT_STRING_LENGTH = 4096` 字元且頭部與尾部均埋設秘密憑證之字串：輸出總長 `4110` 字元，結尾為 `...[TRUNCATED]`，頭尾秘密皆未外洩（`leaksFrontSecret: false`、`leaksTailSecret: false`）。
5. **Inline 字串角落案例（`inlineCorners`）**：
   - `Cookie:` 標頭輸出為 `"Cookie: [REDACTED]; csrftoken=[REDACTED]"`。
   - Kebab-case 欄位 `x-api-key: ...` 輸出為 `"x-api-key: [REDACTED]"`。
   - `authorization: Bearer ...` 輸出為 `"authorization: [REDACTED] [REDACTED]"`。
   - Query String `GET /cb?access_token=dummy_qs_tok&ok=1` 輸出為 `"GET /cb?access_token=[REDACTED]"`（安全無外洩，但因 `&` 未列入分隔排除字元，連帶遮罩同段落後續非敏感查詢參數，屬保守過度脫敏）。
6. **`Error` / `AggregateError`（`aggregateErrorOut`）**：
   - `AggregateError` 之 `message` 與 `stack` 內含 `Bearer ...` 皆已脫敏；但 V8 `AggregateError.errors` 為不可列舉屬性（non-enumerable），`Object.entries(errRecord)` 不會遍歷之，故輸出中未含 `errors` 陣列（安全上無外洩風險，僅屬診斷資訊略減，詳見第 11 節）。

---

## 5. Fail-closed 測試結果（Scratch Probe：`phase3c20_services_probe.ts`，`SERVICES_PROBE_EXIT=0`）

針對可能造成 JSON 序列化或物件遍歷拋錯的「毒藥物件」與 DB 寫入失敗進行實測：

1. **Throwing Getter 物件**：
   - `sanitizeAuditValue(poisonGetter)` 直接回傳 `"[REDACTION_ERROR]"`。
   - 透過結構化 `logAuditEvent({ action: 'POISON_GETTER_TEST', details: poisonGetter, ipAddress: '10.0.0.1 token=...', userAgent: 'Agent Bearer ...' })` 寫入時，`details` 回落為常數 `REDACTION_FALLBACK_JSON`（`'{"redactionFallback":"[REDACTION_ERROR]"}'`），不會拋出未捕獲例外，且 `ipAddress`（`10.0.0.1 token=[REDACTED]`）與 `userAgent`（`Agent Bearer [REDACTED]`）同步完成脫敏。
2. **含 Throwing `toJSON()` 方法之物件**：
   - 因 `sanitizeAuditValueInternal` 先將物件枚舉為一般鍵值並將 `function` 轉為 `"[function]"`，不直接執行原物件 `toJSON()`，故 `poisonToJson` 安全產出 `'{"okField":"Bearer [REDACTED]","toJSON":"[function]"}'`，未觸發 `toJSON()` 內部的連線字串洩漏或例外崩潰。
3. **Legacy 4 參數重載在 DB 拒絕寫入時**：
   - 當 `prisma.auditLog.create` 拒絕並拋出訊息含 `postgresql://admin:dummy_db_err_pw@db.local:5432/app` 之錯誤時：`logAuditEvent(null, 'LEGACY_ACTION_ERR', ...)` 未向外拋錯（`legacyDbFailThrew: false`），且 `audit.ts:276` 呼叫 `console.error('Failed to record audit log:', action, sanitizeAuditValue(error))`，經攔截確認錯誤訊息中的密碼已被替換為 `[REDACTED]`，無原始 `dummy_db_err_pw` 外洩（`legacyConsoleErrorSanitized: true`）。

---

## 6. 交易、多載與批次寫入驗證結果

### 6.1 多載與傳參行為確認

- **Structured Standalone (`logAuditEvent(payload)`)**：未傳第二參數時 `actionOrClient ?? prisma` 使用主 `prisma`，回傳 `PrismaPromise`，可單獨 `await`。
- **Structured Interactive Transaction (`logAuditEvent(payload, tx)`)**：傳入 `tx` 時呼叫 `tx.auditLog.create({ data })`，與外層交易共用連線與事務狀態。
- **Structured Batch Transaction (`prisma.$transaction([..., logAuditEvent(payload)])`)**：因回傳型別為未 `await` 之 `Prisma.Prisma__AuditLogClient<any>`（`PrismaPromise`），可合法納入 `prisma.$transaction([...])` 陣列批次送交。
- **Legacy 4 參數 (`logAuditEvent(req, action, userId, details)`)**：實測當 `req.headers['x-forwarded-for']` 為 `'203.0.113.5 password=dummy_xff_pw, 127.0.0.1'` 且 `user-agent` 為 `'Mozilla/5.0 Authorization: Bearer dummy_legacy_ua_tok'` 時，送入 `.create` 前已轉換為 `'203.0.113.5 password=[REDACTED]'` 與 `'Mozilla/5.0 Authorization: [REDACTED] [REDACTED]'`。

### 6.2 PG17.11 隔離容器 (`127.0.0.1:5434/code_to_know_test`，`c2k_test_app_runtime`) 交易原子性實測

於獨立探針 `phase3c20_audit_probe.ts`（`PROBE_EXIT=0`）直接對 Phase 3-C-18 既建 PG17.11 測試容器執行實測：
- 測試前 `AuditLog` 基準：`cnt = 16`，內容摘要雜湊 `digest = "217ff84e3e4a075e8aa9bc1b5984beb3"`。
- **Interactive `$transaction(tx)` 回滾測試**：於交易內建立測試 `User` 並透過 `await logAuditEvent(..., tx)` 寫入 `AuditLog` 後故意拋錯；結果確認 `interactiveRollbackThrown: true`，暫時 `User` 歸零（`rollbackUserRemaining: 0`），且 `AuditLog` 維持 `cnt = 16`、`digest = "217ff84e3e4a075e8aa9bc1b5984beb3"`，證明審計寫入確實隨交易完全回滾。
- **Batch `$transaction([...])` 回滾測試**：於批次陣列內放入 `logAuditEvent(...)` 與刻意失敗的唯一鍵衝突寫入；結果確認 `batchRollbackThrown: true`，且 `AuditLog` 仍維持 `cnt = 16`、`digest = "217ff84e3e4a075e8aa9bc1b5984beb3"`，證明批次寫入原子性完好且測試結束未殘留髒資料。

---

## 7. Auth / Admin / Teacher 實際服務層呼叫驗證

透過獨立探針 `phase3c20_services_probe.ts` 實際建立 `new AuthService()`、`new AdminService()` 與 `new TeacherService()` 並攔截底層 `.auditLog.create({ data })` 之入參，完整驗證全部 10 個服務層寫入點：

| 服務方法 | 交易傳參模式 (`viaTx`) | Action | 入庫前 `details` / `ipAddress` / `userAgent` 實測結果 |
|---|---|---|---|
| `AuthService.register` | `false` | `USER_REGISTER` | `ipAddress` 與 `userAgent` 中埋設的 `token=` / `Bearer` 均替換為 `[REDACTED]` |
| `AuthService.login` (失敗) | `false` | `LOGIN_FAILED` | `ipAddress` 與 `userAgent` 中埋設的 `password=` / `secret=` 均替換為 `[REDACTED]` |
| `AuthService.login` (成功) | `false` | `USER_LOGIN` | `details.sessionId` 被保守鍵名模式遮罩為 `"[REDACTED]"` |
| `AuthService.logout` | `false` | `USER_LOGOUT` | `details.sessionId` 與 `userAgent` 之 `Bearer` 均替換為 `[REDACTED]` |
| `AuthService.verifyEmail` | `true`（`tx`） | `EMAIL_VERIFIED` | 透過 `tx.auditLog.create` 寫入，內容安全無明文憑證 |
| `AuthService.requestPasswordReset` | `false` | `PASSWORD_RESET_REQUESTED` | 正確紀錄 `{ userId }`，無原始重設 Token 外洩 |
| `AuthService.resetPassword` | `true`（`tx`） | `PASSWORD_RESET_COMPLETED` | 透過 `tx.auditLog.create` 寫入；`revokedExistingSessions` 因鍵名含 `session` 被遮罩為 `"[REDACTED]"` |
| `TeacherService.submitApplication` | `false` | `TEACHER_APPLICATION_SUBMITTED` | `details.school` 內夾帶之 `Bearer ...` 已被脫敏為 `Bearer [REDACTED]` |
| `AdminService.approveTeacherApplication` | Batch `$transaction([...])` | `TEACHER_APPLICATION_APPROVED` | `details.note` 內夾帶之 `secret=...` 已被脫敏為 `secret=[REDACTED]` |
| `AdminService.rejectTeacherApplication` | Batch `$transaction([...])` | `TEACHER_APPLICATION_REJECTED` | `details.note` 內夾帶之 PostgreSQL DSN 密碼已被脫敏為 `[REDACTED]` |

此外同步實測 `AdminService.listAuditLogs`：面對模擬資料庫中的舊版未脫敏 JSON（含明文 `password` 與 `postgresql://...` 密碼），回傳至前端時已由 `sanitizeAuditDetails` 轉為 `{"password":"[REDACTED]","dsn":"postgresql://u:[REDACTED]@h:5432/db","note":"ok"}`。

---

## 8. 其他日誌洩漏風險查核

全面檢視 `backend/src` 內全數 `console.*` 呼叫位置後發現：

1. **`backend/src/middleware/error-handler.ts:45`（`MEDIUM` — 已由本階段實測驗證）**：
   - 原碼：`console.error('Unhandled server error:', err);`
   - 實測證據一（`phase3c20_audit_probe.ts` 之 `errorHandlerProbe`）：傳入含 `redis://u:dummy_unhandled_pw@cache.internal:6379` 的 `Error` 後，HTTP 500 JSON 回應僅回傳安全泛型訊息 `{ code: "INTERNAL_SERVER_ERROR", message: "系統發生非預期錯誤，請稍後再試" }`，但 **`stderr` 直接原樣印出包含 `dummy_unhandled_pw` 之完整錯誤與 stack（`stderrCapturedIncludesRawSecret: true`）**。
   - 實測證據二（`tests/api.test.ts` 執行輸出）：測試過程中亦可直接於 `stderr` 觀察到 `Unhandled server error: PrismaClientKnownRequestError: ...` 之未脫敏原始錯誤物件與檔案/程式碼上下文。
   - 補充觀察：`error-handler.ts:62-64` 僅在 `env.NODE_ENV === 'development'` 時於 HTTP 500 JSON 附加 `stack: err.stack`，生產模式已隔離，但伺服端 `stderr` / 容器日誌管道於任何環境皆會印出未脫敏 `err`。
2. **`backend/src/server.ts:23`（`MEDIUM`）**：
   - 原碼：`console.error('關閉資料庫連線時發生錯誤:', err);`
   - 優雅關機若 `$disconnect()` 失敗，可能直接將含連線目標細節的原始錯誤物件輸出至 `stderr`。
3. **其餘安全日誌路徑（無發現洩漏）**：
   - `backend/src/app.ts:56`：健康檢查僅記錄靜態字串 `'[HEALTH CHECK] Database connectivity check failed.'`。
   - `backend/src/services/email.provider.ts:15,23,37,45`：僅輸出靜態提示 `[EMAIL MOCK]` / `[EMAIL DISABLED]`，明確避免記錄 email、驗證連結或原始 token。
   - `backend/src/config/env.ts`：驗證失敗僅記錄 Zod 結構化欄位報告 `parsed.error.format()` 或 `URL` 格式驗證靜態說明，未輸出 `SESSION_SECRET` 或 `DATABASE_URL` 原始內容。
   - `backend/src/utils/audit.ts:276`：已對 `error` 套用 `sanitizeAuditValue(error)`。

---

## 9. Phase 3-C-20 實際執行之測試通過數與 Exit Code

所有測試與建置均於 Phase 3-C-20 當下重新執行並記錄原始結果：

| 測試 / 建置項目 | 執行指令 | 實際結果 | Exit Code |
|---|---|---|---|
| AuditLog 脫敏單元與靜態檢查 | `vitest.cmd run tests/audit-redaction.test.ts` | `Test Files 1 passed (1)`, `Tests 10 passed (10)` | `0` |
| Auth / Admin / IDOR / RBAC 群組 | `vitest.cmd run tests/auth-lifecycle.test.ts tests/admin-hardening.test.ts tests/idor-ownership.test.ts tests/rbac-workflow.test.ts` | `Test Files 4 passed (4)`, `Tests 40 passed (40)` | `0` |
| Backend 全數 10 支離線測試檔 | `vitest.cmd run tests/db-config-safety.test.ts ... tests/api.test.ts` | `Test Files 10 passed (10)`, `Tests 138 passed (138)` | `0` |
| Backend 完整 `npm test -- --run`（未提供 DB URL） | `npm.cmd test -- --run` | `10 passed`, `1 skipped`（`app-runtime.db.test.ts` 3 skipped）, `1 failed`（`integration.db.test.ts` 依 fail-closed 防呆預期拒絕缺 `TEST_DATABASE_URL`）; 共 `138 passed \| 4 skipped (142)` | `1`（預期行為） |
| Backend TypeScript 編譯建置 | `npm.cmd run build` (`tsc`) | 編譯無錯誤通過 | `0` |
| Frontend 路由保護測試 | `vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`, `Tests 7 passed (7)` | `0` |
| Frontend TypeScript + Vite 建置 | `npm.cmd run build` (`tsc && vite build`) | 1612 modules 轉換打包成功（`dist/assets/index-BybpJLnO.js 494.93 kB`） | `0` |
| Phase 3-C-20 獨立脫敏與 PG17 回滾探針 | `tsx.cmd .../phase3c20_audit_probe.ts` | 全數斷言與 PG17 交易回滾驗證完成（含重現 `errorHandler` `stderr` 洩漏） | `0` |
| Phase 3-C-20 獨立服務層與 Fail-closed 探針 | `tsx.cmd .../phase3c20_services_probe.ts` | 全數 10 個服務呼叫、毒藥物件與 legacy 多載驗證完成 | `0` |

---

## 10. 未執行測試與限制說明

依本階段嚴格唯讀範圍與隔離規範，以下項目於 Phase 3-C-20 **未執行（NOT TESTED）**：

1. **`backend/tests/integration.db.test.ts`（PG16 `127.0.0.1:5432`）**：未設定 `TEST_DATABASE_URL` 執行該整合測試，以維持 PG16 現狀不受測試清理影響。
2. **正式環境 Supabase / Supavisor TLS 實連線**：禁止連線正式環境與讀取正式憑證。
3. **`backend/tests/app-runtime.db.test.ts` 完整檔重跑**：於本階段未透過 Vitest 直接重跑該 3 支測項（`npm test` 預設未設 `TEST_RUNTIME_DATABASE_URL` 時顯示 `3 skipped`），改以獨立探針於 `code_to_know_pg17_phase3c18_audit`（`127.0.0.1:5434`）直接以 `c2k_test_app_runtime` 驗證互動與批次 `$transaction` 寫入及回滾完整性。

---

## 11. 發現問題、嚴重等級與修補建議（僅記錄，未於本階段修改）

### 11.1 `MEDIUM`：全域錯誤中介層與關機處理輸出未脫敏原始錯誤

- **位置**：
  - `backend/src/middleware/error-handler.ts:45`：`console.error('Unhandled server error:', err);`
  - `backend/src/server.ts:23`：`console.error('關閉資料庫連線時發生錯誤:', err);`
- **風險**：雖然 `AuditLog` 寫入已完整脫敏，但當資料庫驅動、外部 HTTP/SMTP 客戶端或 Prisma 拋出夾帶憑證/連線字串之未預期錯誤時，`stderr` 日誌彙整系統仍可能記錄未脫敏錯誤內容。
- **建議修補方向**：改寫為 `console.error('Unhandled server error:', sanitizeAuditValue(err));` 與 `console.error('關閉資料庫連線時發生錯誤:', sanitizeAuditValue(err));`。

### 11.2 `LOW`：角落脫敏邊界與工程防護細節

1. **`AggregateError.errors` 內層陣列略過**（`backend/src/utils/audit.ts:112`）：V8 `AggregateError.errors` 屬不可列舉屬性，`Object.entries` 不會讀取；無洩漏風險但少掉子錯誤摘要。後續可視需求顯式處理 `'errors' in value && Array.isArray(value.errors)` 並遞迴套用 `sanitizeAuditValueInternal`。
2. **Query String 非敏感後續參數連帶遮罩**（`backend/src/utils/audit.ts:23`）：`SENSITIVE_KV_UNQUOTED_PATTERN` 排除字元未包含 `&`，導致 `?access_token=abc&ok=1` 被整段替換為 `?access_token=[REDACTED]`。此屬安全優先之過度脫敏，風險極低；若需保留非敏感後續參數，可將 `&` 納入分隔邊界。
3. **`SENSITIVE_KEY_PATTERN` 保守遮罩非秘密欄位名**（`backend/src/utils/audit.ts:12`）：模式包含 `session`，致使 `USER_LOGIN` / `USER_LOGOUT` 的 `details.sessionId`（內部 UUID）及 `PASSWORD_RESET_COMPLETED` 的 `revokedExistingSessions`（布林值）在持久化前統一改寫為 `"[REDACTED]"`。不影響安全性，若日後稽核需要追蹤 Session ID 可再針對非憑證欄位微調白名單（勿放寬 `token`/`secret`/`cookie`/`sessionToken`）。
4. **Legacy 4 參數重載設計與未來直接呼叫防呆**：`logAuditEvent(req, action, ...)` 固定使用全域 `prisma` 而不接收 `tx`，雖目前線上服務已全部切換至結構化重載，仍建議待確認無遺留相依性後逐步淘汰 legacy signature，並維持 CI 執行 `tests/audit-redaction.test.ts` 的 `backend/src` 直接寫入靜態檢查。

---

## 12. Git HEAD 與工作目錄前後差異比對

- **HEAD 比較**：Phase 3-C-20 稽核前後均維持 `main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無任何 commit/reset/checkout 操作。
- **工作目錄差異**：
  - 既有已修改與未追蹤檔案（含 Phase 3-C-19 修改）：**零新增、零刪改、零覆蓋**。
  - 本階段於專案內唯一產出之檔案：`docs/DATABASE_PHASE3C20_AUDITLOG_INDEPENDENT_SECURITY_AUDIT.md`（另兩支獨立驗證探針僅暫存於對話 scratch 目錄，不屬於專案工作樹）。

---

## 13. 原始備份 SHA-256 與現有容器 / Volume 保留狀態

### 13.1 原始備份檔案完整性（核對與 Phase 3-C-11K / 3-C-13 紀錄一致）

| 檔案路徑 | 檔案大小 (Bytes) | SHA-256 雜湊值 |
|---|---:|---|
| `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump` | `505249` | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` |
| `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb` | `505282` | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` |

### 13.2 Docker 容器與 Volume 保留狀態

- `code_to_know_pg17_phase3c18_audit`（`postgres:17-alpine`，`127.0.0.1:5434->5432/tcp`）及 Volume `code_to_know_pg17_phase3c18_audit_data`：**完整保留**（且 `AuditLog` 維持 16 筆基準，無探針殘留資料）。
- `code_to_know_pg17_restore_sandbox`（`127.0.0.1:5433->5432/tcp`）及 Volume `code_to_know_pg17_restore_sandbox_data`：**完整保留、未變更**。
- `code_to_know_postgres`（`postgres:16-alpine`，`127.0.0.1:5432->5432/tcp`）及 Volume `code-to-know_postgres_data`：**完整保留、未變更**。

---

## 14. 最終審查結論

- **Phase 3-C-19 `AuditLog` 統一入口與寫入端脫敏目標**：**PASS**
  - 後端 10/10 業務寫入點全面收斂至 `logAuditEvent`；入庫前強制完成鍵名、DSN/Bearer/Cookie/KV 字串、深度與集合上限、截斷邊界及 Fail-closed 保護；Interactive/Batch 交易與 PG17 回滾原子性驗證通過；`adminService.listAuditLogs` 亦具備讀取端縱深防禦。
- **整體安全稽核最終裁定**：**CONDITIONAL PASS（有條件通過）**
  - 條件一：建議修補後端全域錯誤日誌出口（`backend/src/middleware/error-handler.ts:45` 與 `backend/src/server.ts:23`）之 `MEDIUM` 等級未脫敏原始錯誤物件輸出，避免例外時繞過 `AuditLog` 而透過 `stderr` 洩漏連線字串或憑證。
  - 條件二：正式角色切換前，仍需依既定時程與授權完成帶 `TEST_DATABASE_URL` / `TEST_RUNTIME_DATABASE_URL` 的完整整合測試及授權環境驗證。
