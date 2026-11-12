# CODE TO KNOW｜Phase 3-C-22：全域錯誤日誌與脫敏機制獨立安全稽核報告

- 稽核日期：2026-11-11
- 稽核階段：Phase 3-C-22（針對 Phase 3-C-21 修補之唯讀獨立安全稽核）
- 稽核原則：全程唯讀，未修改任何正式程式碼、測試檔、`.env`、Schema、Migration、既有 Docker 容器/Volume 或原始備份；不執行資料庫寫入、不連線 Supabase 或既有資料庫。

---

## 1. 稽核範圍與驗證證據分級規範

本次稽核涵蓋 Phase 3-C-21 全部異動與後端完整日誌與審計路徑：

- **A. 共用脫敏模組**：`backend/src/utils/redaction.ts`（零依賴設計、`logSafeError` 重入防護、Fail-closed、Error/AggregateError、WeakSet 與三項邊界上限、getter / `toJSON` 毒藥保護）。
- **B. 全域錯誤日誌**：`backend/src/middleware/error-handler.ts`、`backend/src/server.ts`、`backend/src/utils/audit.ts` 與整個 `backend/src` 全部 `console.*` / Logger / `.stack` / `req.*` 輸出路徑。
- **C. Query String 與秘密欄位**：多參數、`access_token` / `refresh_token` / `api_key` / `client_secret` / `password` / `authorization` / `cookie`、大小寫與 `-`/`_`、URL 編碼與異常編碼、DSN、`sessionId` / `revokedExistingSessions` 正反精度。
- **D. AuditLog**：`audit.ts` 與 `auth.service.ts`、`admin.service.ts`、`teacher.service.ts` 寫入/讀取路徑與交易行為。
- **E. 測試品質**：實質審查 `audit-redaction.test.ts` 與 `safe-error-logger.test.ts` 斷言內容，避免僅看測試數量。

本報告各結論皆明確區分：**已由實際測試證明**、**僅由靜態程式碼檢查確認**、**尚未測試（NOT TESTED）**、**無法確認**。

---

## 2. 實際檢查的檔案

- 共用脫敏與日誌：`backend/src/utils/redaction.ts`、`backend/src/utils/audit.ts`
- 全域錯誤與生命週期：`backend/src/middleware/error-handler.ts`、`backend/src/server.ts`、`backend/src/app.ts`
- 設定與環境：`backend/src/config/env.ts`、`backend/src/config/database.ts`、`backend/src/services/email.provider.ts`
- 服務與權限模組（全域掃描）：`backend/src/modules/auth/*`、`backend/src/modules/admin/*`、`backend/src/modules/teachers/*`、`backend/src/middleware/*`、`backend/src/utils/ownership.ts`
- 測試檔案：`backend/tests/audit-redaction.test.ts`、`backend/tests/safe-error-logger.test.ts`、`backend/tests/api.test.ts` 等全部 11 支離線測試與 `frontend/tests/sources-route-protection.test.tsx`
- 相關參考報告：`docs/DATABASE_PHASE3C20_AUDITLOG_INDEPENDENT_SECURITY_AUDIT.md`、`docs/DATABASE_PHASE3C21_GLOBAL_ERROR_LOGGING_HARDENING_REPORT.md`

---

## 3. 各項安全測試與驗證結果

### 3.1 A. 共用脫敏模組（`backend/src/utils/redaction.ts`）

| 檢查項目 | 驗證方式與實際證據 | 證據分級 | 結論 |
|---|---|---|---|
| 無循環相依且未依賴 `database.ts` / `Prisma` / `AuditLog` | `Select-String` 靜態匯入掃描顯示 `redaction.ts` 頂層 **0 個** `import` 語句；`audit.ts`、`error-handler.ts`、`server.ts` 單向匯入 `redaction.ts`，構成無環 DAG。 | **僅由靜態程式碼檢查確認** | PASS |
| `logSafeError` 重入保護 | `safe-error-logger.test.ts` 第 16 項實測：`console.error` hook 重入呼叫 `logSafeError` 時因 `if (activeSafeErrorDepth > 0) return;` 立即中止，`reentrantCalls === 1`。 | **已由實際測試證明** | PASS |
| 脫敏失敗 Fail-closed | `safe-error-logger.test.ts` 第 7、9 項實測 throwing getter 與 throwing Proxy (`ownKeys`) 皆回落為 `{ redactionFallback: '[REDACTION_ERROR]' }`，不洩漏相鄰秘密。 | **已由實際測試證明** | PASS |
| 不因日誌失敗覆蓋原業務例外 | 獨立探針 `phase3c22_adversarial_probe.ts`（section E）與測項 9/16 實測 `console.error` 拋錯時 `logSafeError` 吞錯並保留外層 `BUSINESS_FLOW_ERR`。 | **已由實際測試證明** | PASS |
| `Error` / `AggregateError` / `cause` / `stack` / 巢狀物件 | `safe-error-logger.test.ts` 第 1～5 項與對抗探針（105 個額外屬性 + 巢狀 `AggregateError` + throwing `Error.name` getter）確認 `errors`、`cause`、`stack`、`__truncatedKeys: 5` 與 fail-closed 皆生效。 | **已由實際測試證明** | PASS |
| `WeakSet` 循環與深度/集合/字串限制 | 測試確認 `Error.cause` + `AggregateError.errors` 循環輸出 `'[CIRCULAR]'`，深度 > 6 輸出 `'[MAX_DEPTH_REDACTED]'`；`collection/string` 上限常數（100 / 4096）沿自 Phase 3-C-19 並經原始碼與測試確認。 | **已由實際測試證明** | PASS |
| `toJSON` 與非一般槽位物件（`Map`/`Set`/`URL`） | 測項 8 確認 throwing `toJSON` 轉為 `'[function]'` 不執行；對抗探針實測 `Map` / `URL` 附掛於 `Error` 上因 `Object.entries` 回 `{}` 而**不洩漏秘密**（僅遺失非秘密 slot 資訊，見第 7 節）。 | **已由實際測試證明** | PASS |

### 3.2 B. 全域錯誤日誌

| 檢查項目 | 驗證方式與實際證據 | 證據分級 | 結論 |
|---|---|---|---|
| `error-handler.ts` 不直接輸出原始 Error、Headers、Body、Query | 審查 `error-handler.ts:46-49` 與測項 10 + `api.test.ts` `stderr` 實測：只傳 `err` 與 `{ method: _req.method, path: _req.path }`；對抗探針實測 path 夾帶 `/reset/Bearer%20...` 亦被遮罩為 `/reset/Bearer%20[REDACTED]`。 | **已由實際測試證明** | PASS |
| `NODE_ENV=development` stack 脫敏 | 對抗探針 section D 將 `env.NODE_ENV` 暫設為 `development`，驗證 HTTP 500 JSON `error.stack` 將 PostgreSQL DSN 密碼替換為 `[REDACTED]` 且保留 stack 軌跡。 | **已由實際測試證明** | PASS |
| 伺服器關閉 DB 斷線錯誤安全輸出 | `safe-error-logger.test.ts` 第 11 項實測匯入 `server.ts` 並模擬 `prisma.$disconnect()` 拋出含連線密碼錯誤，確認輸出為 `postgresql://admin:[REDACTED]@db.internal:5432/prod` 與 `code: 'P1001'`。真實 OS 訊號（`SIGTERM`/`SIGINT` -> `process.exit`）則屬靜態審查 + 尚未實測整合訊號。 | **已由實際測試證明**（函式）/ **尚未測試**（真實進程訊號） | PASS |

### 3.3 C. Query String 與秘密欄位精準度

| 檢查項目 | 驗證方式與實際證據 | 證據分級 | 結論 |
|---|---|---|---|
| 多敏感參數與後續正常參數保留 | `safe-error-logger.test.ts` 測項 12～13 與對抗探針 `qsSamples` 實測 `?access_token=...&ok=1`、`ACCESS_TOKEN`、`refresh-token`、`X-Api-Key`、`Client_Secret`、`&page=2&lang=zh-TW` 精準遮罩且保留正常參數。 | **已由實際測試證明** | PASS |
| URL 編碼與無效百分比編碼 | 實測內嵌編碼 URL（`next=https%3A%2F%2F...%3Fclient_secret%3Ds9%26ok%3D1&state=xyz`）、編碼 DSN（`postgresql%3A%2F%2Fadmin%3A[REDACTED]%40...`）與無效編碼（`?access_token=%E0%A4%A&ok=1`）皆正確遮罩，不退回明文。另有實測 `password=p%40ss%26word` 截斷邊界瑕疵（見第 7 節 `LOW`）。 | **已由實際測試證明** | PASS（附 `LOW` 備註） |
| `sessionId` / `revokedExistingSessions` / `author` / `passed` 正反精度 | 測項 14～15 與 `audit-redaction.test.ts` 測項 1、9/10 實測 `sessionId`、`session_id`、`revokedExistingSessions`、`author`、`passed` 完整保留；`sessionToken`、`session_secret`、`sessionKey`、`sessionCookie`、`Cookie`、`session` 全部為 `[REDACTED]`。 | **已由實際測試證明** | PASS |

### 3.4 E. 測試品質檢核

實質檢視 `backend/tests/audit-redaction.test.ts`（10 支測試）與 `backend/tests/safe-error-logger.test.ts`（14 支測試）：
- 皆採合成假資料，無硬編碼真實憑證。
- 測項同時檢查 `not.toContain(<秘密片段>)` 與正面斷言（保留 `req-77`、`P1001`、`ok=1`、`sessionId`、`revokedExistingSessions: true`），並非只測 exit code。
- 一項微小強化空間：測項 16 驗證了 `reentrantCalls === 1` 與 `toHaveBeenCalledTimes(1)`，但未直接在該測試中 spy `prisma.auditLog.create` 斷言未被呼叫（改由靜態審查 `redaction.ts` 無任何資料庫匯入加以補強）。

---

## 4. 全域日誌掃描結果（整個 `backend/src`）

透過 `Select-String` 針對 `backend/src` 全數 `.ts` 檔案掃描 `console\.`、`stdout\.write`、`stderr\.write`、`logSafeError`、`winston`、`pino`、`morgan`、`bunyan`、`.stack` 與 `req.body|headers|cookies|query|originalUrl`：

1. **已接入 `logSafeError` 之錯誤出口（3 處）**：
   - `backend/src/middleware/error-handler.ts:46`（僅記錄 `err` 與 `{ method, path }`）
   - `backend/src/server.ts:24`（DB 關閉例外）
   - `backend/src/utils/audit.ts:123`（legacy `logAuditEvent` DB 失敗日誌）
2. **安全入口內部唯一 sink**：
   - `backend/src/utils/redaction.ts:257,283`（完成脫敏與防呆後才呼叫 `console.error`）
3. **其餘非 `logSafeError` 輸出點評估（皆由靜態掃描確認無秘密外洩）**：
   - `backend/src/app.ts:56`：`console.error('[HEALTH CHECK] Database connectivity check failed.')`（純靜態字串）
   - `backend/src/server.ts:7-12,21,31,39`：啟動橫幅（PORT/NODE_ENV/CORS_ORIGIN）與固定中文狀態文字
   - `backend/src/config/env.ts:35,54,64,93`：Zod 欄位錯誤結構與缺失變數名稱（不印秘密值）
   - `backend/src/services/email.provider.ts:15,23,37,45`：`[EMAIL MOCK]` / `[EMAIL DISABLED]` 純靜態文字
   - `backend/src/modules/*` 與 `middleware/*`（除 `error-handler.ts` 外）：**0 處** `console.*`、`winston`、`pino`、`morgan`、`stdout.write` 或 `stderr.write` 呼叫；控制器傳遞給 Service 之 `req.body` / `user-agent` 未新增任何原樣日誌輸出。
4. **Prisma 引擎內建錯誤通道**：
   - `backend/src/config/database.ts:96` 配置 `log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']`。在 `api.test.ts` 執行期間可見其直接印出 `prisma:error`（查詢片段與錯誤碼），屬 Prisma 引擎內部 stdout 機制而非應用程式 `console.error`；實際連接字串密碼不會出現在該訊息中。

---

## 5. `AuditLog` 寫入與讀取檢查（無執行正式或既有 DB 寫入）

| 檢查項目 | 證據與判定 | 證據分級 |
|---|---|---|
| 統一入口與無旁路直寫 | 全域 `Select-String` 確認除 `utils/audit.ts:112` 與 `:121` 外，`backend/src` 無任何 `auditLog.create` / `createMany` / `upsert` / `update` / `delete`；`audit-redaction.test.ts` 測項 11（靜態檔案走訪檢查）亦實際通過。 | **已由實際測試證明** + **靜態檢查** |
| 寫入前脫敏與讀取端二次脫敏 | `audit.ts:39-77` 於建立前執行 `serializeAuditDetails` 與 IP/UA 脫敏；`admin.service.ts:236` 於 `listAuditLogs` 呼叫 `sanitizeAuditDetails(entry.details)`。 | **已由實際測試證明**（模擬 DB） |
| 交易式與批次交易行為維持 | `audit.ts:103-113` 維持回傳 `dbClient.auditLog.create({ data })`（供 `await logAuditEvent(..., tx)` 與 `prisma.$transaction([...])` 使用）；`audit-redaction.test.ts` 測項 9～10（模擬 DB）驗證 interactive `tx` 與 batch `$transaction` 及拋錯傳播。 | **已由實際測試證明**（模擬 DB） / **尚未測試**（Phase 3-C-21 重構後之真實 PG SQL 交易回滾） |
| 一般錯誤日誌不寫入 `AuditLog` 且不干擾交易 | `redaction.ts` 完全未匯入 `audit.ts` 或 `database.ts`；`logAuditEvent` structured overload 不含內部吞錯（失敗會正確 reject 觸發交易回滾），僅 legacy overload 於失敗時呼叫 `logSafeError`。 | **僅由靜態程式碼檢查確認** |

---

## 6. 測試與 Build 結果（於 Phase 3-C-22 當下實測）

| 檢查項目 | 指令 | 實際結果 | Exit Code |
|---|---|---|---|
| Backend 全部 11 支離線測試檔 | `vitest.cmd run tests/db-config-safety.test.ts ... tests/api.test.ts` | `Test Files 11 passed (11)`, `Tests 152 passed (152)` | `0` |
| Backend 完整 `npm test -- --run`（未提供 DB URL） | `npm.cmd test -- --run` | `11 passed \| 1 skipped`（`app-runtime.db.test.ts` 3 skipped）`\| 1 failed`（`integration.db.test.ts` 依 fail-closed 防呆拒絕無 `TEST_DATABASE_URL`）；共 `152 passed \| 4 skipped (156)` | `1`（依規範標示 DB 測項 **NOT TESTED**） |
| Phase 3-C-22 對抗探針（唯讀記憶體驗證） | `tsx.cmd .../phase3c22_adversarial_probe.ts` | `ALL_ADVERSARIAL_PROBES_PASSED`（含 dev stack 脫敏、path 脫敏、slot 物件、105 extra props） | `0` |
| Backend TypeScript Build | `npm.cmd run build` (`tsc`) | 通過無錯誤 | `0` |
| Frontend 路由保護測試 | `vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`, `Tests 7 passed (7)` | `0` |
| Frontend TypeScript + Vite Build | `npm.cmd run build` (`tsc && vite build`) | `1612 modules transformed`，產出 `dist/assets/index-BybpJLnO.js 494.93 kB` | `0` |

---

## 7. 所有發現的問題及嚴重程度

本次稽核確認 **0 個 Critical、0 個 High、0 個 Medium** 問題，僅紀錄 3 項 **`LOW` / 觀察備註**（依唯讀規範未進行任何自動修改）：

1. **`LOW` — 非編碼查詢參數內含 `%26` / `%23` / `%3B` 時提早截斷（`backend/src/utils/redaction.ts:44`）**：
   - **實測證據**：對抗探針 `encodedPercentInsideValue` 測試 `redactStringSecrets('/cb?password=p%40ss%26word&ok=1')` 回傳 `'/cb?password=[REDACTED]%26word&ok=1'`。當秘密本身將 `&` 編碼為 `%26` 置於普通 `=` 參數中時，正則在 `%26` 提前結束，導致 `%26` 後段同值字元（`word`）未被一併遮罩。
   - **後續建議**：將「普通 `=`/` :`」與「URL 編碼 `%3D`/`%3A`」分開兩條邊界規則：僅當鍵值分隔符為 `%3D`/`%3A` 時才將 `%26`/`%23`/`%3B` 視為參數結尾；普通 `=` 只在未編碼 `&`/`#`/`;`/空白 結束。
2. **`LOW` — 內建 slot 物件（`Map`、`Set`、`URL`、`URLSearchParams`）輸出為 `{}`（`backend/src/utils/redaction.ts:174`）**：
   - **實測證據**：對抗探針 `slotSanitized` 確認此類物件不會洩漏內部憑證（輸出 `{}`），但會失去原本可安全脫敏後保留的非敏感診斷訊息（如 `URL.pathname` / `hostname`）。
3. **`LOW` — 觀察項：`database.ts:96` Prisma 內建 `log: ['error']` 與 `safe-error-logger.test.ts` 第 16 項未直接 spy `auditLog.create`**：
   - Prisma 內建 stdout 錯誤流與一般應用程式 `logSafeError` 各自獨立；目前僅依靜態檢查確認無秘密字串外洩且 `redaction.ts` 無資料庫相依。

---

## 8. 尚未驗證的項目（`NOT TESTED` / `無法確認`）

- **`NOT TESTED`（依法規禁止寫入既有 DB 而未執行）**：
  1. `backend/tests/integration.db.test.ts`（需 `TEST_DATABASE_URL` 與 PostgreSQL 寫入/清理）。
  2. `backend/tests/app-runtime.db.test.ts`（Phase 3-C-21 重構 `audit.ts` 後尚未於真實 PostgreSQL 重跑 `app_runtime` role 交易寫入/回滾整合測試）。
  3. 正式環境 Supabase / Supavisor TLS 實機連線與真實 Cloud Pooler 例外格式。
  4. `server.ts` 接收真實 OS `SIGTERM` / `SIGINT` 訊號並觸發 `process.exit` 的完整子程序結束測試。
- **`無法確認`**：
  - 未來尚未引入的第三方套件自訂錯誤類別，若將憑證存於**不可列舉的內部屬性或 Symbol 鍵**（且不在 `name`、`message`、`stack`、`code`、`cause`、`errors` 中），無法在通用層保證窮舉識別（但因 `Object.entries` 不讀取這類屬性，現況預設是不輸出而非外洩）。

---

## 9. Git HEAD 與工作目錄變化

- **Git Branch / HEAD**：稽核前後皆維持 `main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無任何 commit、push、reset、checkout 或 clean。
- **工作目錄變化**：本次唯讀稽核未改動任何既有程式碼、測試、設定或前階段文件；僅於 `docs/` 新增本稽核報告 `docs/DATABASE_PHASE3C22_GLOBAL_ERROR_LOGGING_INDEPENDENT_AUDIT.md`。

---

## 10. Docker 容器、Volume 與備份保留情況

1. **Docker 容器（`docker ps -a` 實查全部保留且運行狀態不變）**：
   - `code_to_know_pg17_phase3c18_audit`（`postgres:17-alpine`，`127.0.0.1:5434->5432/tcp`）
   - `code_to_know_pg17_restore_sandbox`（`3540c0362c80`，`127.0.0.1:5433->5432/tcp`）
   - `code_to_know_postgres`（`postgres:16-alpine`，`127.0.0.1:5432->5432/tcp`）
   - `dazzling_tharp`（`hello-world`，`Exited (0)`，既有容器未動）
2. **Docker Volumes（`docker volume ls` 實查完整保留）**：
   - `code-to-know_postgres_data`、`code_to_know_pg17_phase3c18_audit_data`、`code_to_know_pg17_restore_sandbox_data`（及既有匿名 volume）。
3. **原始備份檔案 SHA-256 核對未變**：
   - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
   - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 最終判定

- **最終判定：`PASS`**
  - **判定依據**：Phase 3-C-21 核心安全目標（共用零循環相依 `logSafeError`、`error-handler.ts` 與 `server.ts` 錯誤出口脫敏、`Error`/`AggregateError`/`cause`/`stack` 與毒藥 Fail-closed、Query String 多參數保留、以及 `sessionId`/`revokedExistingSessions` 精準度）均已具備足夠的實測與靜態分析證據；無 Critical、High 或 Medium 安全漏洞。第 7 節所列 3 項 `LOW` 觀察項與第 8 節依法未執行之 DB 整合項目均已明確標註，建議於後續適當時機補充微調及帶環境變數執行整合測試即可。
