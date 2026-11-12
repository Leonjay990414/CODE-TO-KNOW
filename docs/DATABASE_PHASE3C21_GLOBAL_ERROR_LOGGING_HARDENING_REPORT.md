# CODE TO KNOW｜Phase 3-C-21：Backend 全域錯誤日誌安全修補報告

- 修補日期：2026-11-11
- 修補階段：Phase 3-C-21（Backend 全域錯誤日誌與脫敏規則補強）
- 依據報告：`docs/DATABASE_PHASE3C20_AUDITLOG_INDEPENDENT_SECURITY_AUDIT.md`

---

## 1. 修補前問題

依 Phase 3-C-20 獨立安全稽核結果，修補前存在以下已確認缺口：

1. **`MEDIUM` 全域未處理錯誤輸出未脫敏**：`backend/src/middleware/error-handler.ts:45` 以 `console.error('Unhandled server error:', err);` 直接輸出原始 `Error` 物件至 `stderr`（且 `development` 模式 `response.error.stack` 亦直接帶出原始 `err.stack`）。
2. **`MEDIUM` 伺服器關閉 DB 連線失敗輸出未脫敏**：`backend/src/server.ts:23` 於 `prisma.$disconnect()` 失敗時以 `console.error('關閉資料庫連線時發生錯誤:', err);` 直接輸出原始錯誤。
3. **`LOW` `AggregateError.errors` 未被遍歷脫敏**：V8 `AggregateError.errors` 為不可列舉屬性，`Object.entries(errRecord)` 不會讀取該陣列。
4. **`LOW` Query String 後續非敏感參數遭連帶遮罩**：`SENSITIVE_KV_UNQUOTED_PATTERN` 未納入 `&` / `#` 及 URL 編碼分隔符，導致 `?access_token=...&ok=1` 整段被遮罩為 `?access_token=[REDACTED]`。
5. **`LOW` `SENSITIVE_KEY_PATTERN` 保守誤判一般業務欄位**：模式直接包含 `session`，導致 `sessionId` 與 `revokedExistingSessions` 等非秘密業務欄位在稽核與錯誤結構中被改寫為 `"[REDACTED]"`。

---

## 2. 修改檔案及原因

| 檔案路徑 | 操作 | 修改原因 |
|---|---|---|
| `backend/src/utils/redaction.ts` | 新增 | 建立零內部模組相依之純脫敏與安全錯誤日誌模組，避免循環依賴並集中管理 `redactStringSecrets`、`sanitizeAuditValue`、`sanitizeAuditDetails` 與 `logSafeError` |
| `backend/src/utils/audit.ts` | 修改 | 改為由 `./redaction.js` 匯入並轉匯出脫敏常數與函式（避免重複實作），並將 legacy 失敗日誌改呼叫 `logSafeError` |
| `backend/src/middleware/error-handler.ts` | 修改 | 改為呼叫 `logSafeError` 輸出未處理例外（僅帶入安全 `method`、`path`），並對 `development` 模式回傳之 `err.stack` 套用 `redactStringSecrets` |
| `backend/src/server.ts` | 修改 | 抽出並匯出 `disconnectDatabaseOnShutdown()` 與 `gracefulShutdown()`，關閉 DB 失敗改呼叫 `logSafeError` |
| `backend/tests/audit-redaction.test.ts` | 修改 | 更新 `SENSITIVE_KEY_PATTERN` 精準度驗證（將 `sessionId` 移至正反案例確認區），並驗證 `authService.resetPassword` 保留 `revokedExistingSessions` |
| `backend/tests/safe-error-logger.test.ts` | 新增 | 完整覆蓋 Phase 3-C-21 第 1～16 項安全錯誤日誌、Error/AggregateError、Query String、敏感欄位精準度及防遞迴測試 |
| `docs/DATABASE_PHASE3C21_GLOBAL_ERROR_LOGGING_HARDENING_REPORT.md` | 新增 | 本階段完整執行與驗證報告 |

---

## 3. 共用安全錯誤日誌入口設計

於 `backend/src/utils/redaction.ts` 建立 `logSafeError(message: string, error?: unknown, context?: Record<string, unknown>): void`，設計滿足全部 10 項核心規範：

1. **獨立脫敏與職責分離**：與 `AuditLog` 持久化明確切分，`logSafeError` **絕不寫入** `AuditLog`，僅負責應用程式錯誤輸出前之脫敏，且不引入 `database.ts` / `prisma` / `env.ts` / `express`，從結構上徹底杜絕循環依賴。
2. **支援型別全面**：支援 `Error`、`AggregateError`、一般物件、陣列、純量及字串；保留錯誤 `name`、`code`、`stack`、`cause`、`errors` 與安全診斷上下文。
3. **重入 / 遞迴防護**：維護模組層級 `activeSafeErrorDepth` 旗標；若在執行期間因外部 hook 或自訂 sink 再次觸發 `logSafeError`，立刻靜默返回（`if (activeSafeErrorDepth > 0) return;`），保證不會發生無限遞迴。
4. **Fail-closed 且不覆蓋業務錯誤**：訊息字串、錯誤物件、上下文與最終 `console.error(...)` 呼叫各別受 `try/catch` 保護；脫敏失敗時回落為 `{ redactionFallback: '[REDACTION_ERROR]' }` 靜態結構，且永不向外拋出例外而蓋過原業務流程。

---

## 4. `error-handler` 修補結果

- `backend/src/middleware/error-handler.ts:46-49` 已由 `console.error('Unhandled server error:', err)` 改為：
  `logSafeError('Unhandled server error:', err, { method: _req.method, path: _req.path });`
- **最小化上下文**：顯式只傳遞 HTTP `method` 與 `path`（不含 `_req.headers`、`Authorization`、`Cookie`、`_req.body` 或查詢字串），經 `safe-error-logger.test.ts` 測項 10 與 `api.test.ts` `stderr` 實測，已正確輸出脫敏後的 `{ error: { name, message, stack, code, ... }, context: { method, path } }`，無原始密碼或請求憑證外洩。
- `backend/src/middleware/error-handler.ts:65-67` 在 `env.NODE_ENV === 'development'` 附加 `stack` 前亦經 `redactStringSecrets(err.stack)` 過濾。

---

## 5. `server shutdown` 修補結果

- `backend/src/server.ts:17-27` 抽出 `disconnectDatabaseOnShutdown()`，於 `prisma.$disconnect()` 發生例外時改由 `logSafeError('關閉資料庫連線時發生錯誤:', err)` 輸出並回傳 `false`，由 `gracefulShutdown` 保留既有 `process.exit(ok ? 0 : 1)` 結束流程。
- 經 `safe-error-logger.test.ts` 測項 11（以模擬 `prisma.$disconnect()` 拋出含 PostgreSQL 連線密碼與 `code: 'P1001'` 之錯誤）驗證：`dummy_shutdown_pg_pw` 已被遮罩為 `postgresql://admin:[REDACTED]@db.internal:5432/prod`，同時完整保留 `P1001` 錯誤代碼，且正常關機行為不受影響。

---

## 6. `Error` / `AggregateError` 脫敏結果

於 `backend/src/utils/redaction.ts` 之 `sanitizeErrorObject` 與 `sanitizeValueInternal` 補強並經測試驗證：

1. **顯式處理 `AggregateError.errors`**：即使為不可列舉屬性，仍檢查 `'errors' in errRecord && Array.isArray(errRecord.errors)` 並遞迴執行脫敏，保護多層內嵌錯誤之 `message`、`stack`、`headers` 與 `api_key`。
2. **完整處理 `Error.cause`、巢狀 Error 與自訂屬性**：所有 `cause` 鏈結與可列舉自訂屬性均套用敏感鍵遮罩與字串秘密過濾。
3. **深度、集合上限與循環參照防禦**：繼續強制 `MAX_AUDIT_SANITIZE_DEPTH = 6`（超出輸出 `'[MAX_DEPTH_REDACTED]'`）、`MAX_AUDIT_COLLECTION_ITEMS = 100`（Error 超限額外屬性亦補上 `__truncatedKeys` 計數）、`MAX_AUDIT_STRING_LENGTH = 4096`（先脫敏後截斷）及 `WeakSet` 循環偵測（`'[CIRCULAR]'`）。
4. **毒藥物件 Fail-closed**：Throwing getter 觸發 `[REDACTION_ERROR]` fallback 且不洩漏同物件相鄰秘密；含 throwing `toJSON()` 方法的物件先將函式轉為 `'[function]'` 而不觸發執行。

---

## 7. Query String 修補結果

於 `backend/src/utils/redaction.ts` 重構字串脫敏正規表示式與邊界定義：

1. **避免連帶遮罩後續參數**：`SENSITIVE_KV_UNQUOTED_PATTERN` 將 `&`、`#`、`;` 與 URL 編碼分隔符號 `%26`、`%23`、`%3B`、`%20` 納入邊界終止條件，`?access_token=...&ok=1&Client-Secret=...&page=2` 準確輸出為 `?access_token=[REDACTED]&ok=1&Client-Secret=[REDACTED]&page=2`。
2. **大小寫與分隔符號支援**：支援 `ACCESS_TOKEN`、`Api-Key`、`Client-Secret`、`api_key`、`session_token` 等變化，亦支援同時含多個敏感參數與普通參數之 URL。
3. **URL 編碼與異常百分比編碼安全處理**：支援內嵌百分號編碼查詢參數（`redirect=...%3Faccess_token%3D...%26ok%3D1`）及編碼 DSN（`postgresql%3A%2F%2Fu%3Apw%40...`）；全程不依賴可能拋錯之 `decodeURIComponent`，遇到無效編碼（如 `%E0%A4%A`）仍穩健遮罩且絕不退回輸出原始秘密。
4. **DSN 精準度補強**：`DSN_CREDENTIAL_PATTERN` 與 `ENCODED_DSN_CREDENTIAL_PATTERN` 限制使用者資訊不可跨越 `/`(`%2F`) 或 `?`(`%3F`)，避免含有埠號與 Query email 的公開 URL 誤判。

---

## 8. 敏感欄位誤判修補結果

調整 `SENSITIVE_KEY_PATTERN` 與 inline 關鍵字清單後：

- **保留之正常業務欄位**：`sessionId`、`session_id`、`revokedExistingSessions`、`sessionCount`、`author`、`passed`。
- **強制遮罩之真實敏感欄位**：`sessionToken`、`session_token`、`sessionSecret`、`session_secret`、`sessionKey`、`sessionCookie`、`Cookie`、`session`（獨立原鍵）、`password`、`pass`、`token`、`secret`、`apiKey`、`api_key`、`x-api-key`、`privateKey`、`credential`、`authorization`、`authHeader`、`authToken`、`passwordHash` 等。
- 已透過 `audit-redaction.test.ts`（含真實 `authService.resetPassword` 回寫 `revokedExistingSessions: true` 驗證）及 `safe-error-logger.test.ts` 測項 14～15 雙向實測通過。

---

## 9. 完整日誌路徑盤點

重新掃描 `backend/src` 全數 `.ts` 檔案中所有 `console.*`、`logSafeError` 與 Logger 相關位置：

| 檔案與行號 | 日誌敘述 / 用途 | 處理與安全評估 |
|---|---|---|
| `backend/src/middleware/error-handler.ts:46` | `logSafeError('Unhandled server error:', err, { method: _req.method, path: _req.path })` | **已修補安全**（統一入口脫敏） |
| `backend/src/server.ts:24` | `logSafeError('關閉資料庫連線時發生錯誤:', err)` | **已修補安全**（統一入口脫敏） |
| `backend/src/utils/audit.ts:123` | `logSafeError('Failed to record audit log:', error, { action })` | **已修補安全**（統一入口脫敏） |
| `backend/src/utils/redaction.ts:257,283` | `console.error(...)` | **安全入口內部 sink**（僅在完成脫敏且受重入與 fail-closed 保護後輸出） |
| `backend/src/app.ts:56` | `console.error('[HEALTH CHECK] Database connectivity check failed.')` | **安全**（靜態字串，無變數或錯誤物件） |
| `backend/src/server.ts:7-12,21,31,39` | 啟動埠號/環境/CORS 允許來源、訊號/安全斷開/強制終止超時訊息 | **安全**（僅含非敏感啟動/生命週期文字） |
| `backend/src/config/env.ts:35,54,64,93` | 環境變數 Zod 欄位缺失/格式錯誤訊息（`parsed.error.format()` 或靜態描述） | **安全**（不輸出 `SESSION_SECRET` / `DATABASE_URL` 實際值；維持低耦合未額外匯入） |
| `backend/src/services/email.provider.ts:15,23,37,45` | `[EMAIL MOCK]` / `[EMAIL DISABLED]` 靜態提示 | **安全**（不輸出收件者 Email、Token 或連結） |
| `backend/src/modules/*`（Auth / Admin / Teacher Controllers & Services） | 業務請求日誌檢查 | 全模組無新增 `console.*` / 原始 request body / auth header 日誌呼叫 |
| `backend/src/config/database.ts:96` | `new PrismaClient({ adapter, log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] })` | Prisma 引擎內建錯誤通道（非應用程式 `console.error`；不改動資料庫設定範圍，於第 12 節註記） |

---

## 10. 測試通過數與 Exit Code

所有測試均於本階段最後編輯完成後在隔離測試模式下實跑驗證（皆使用合成假資料）：

| 序號 | 測試指令（於 `backend/` 或 `frontend/`） | 實際通過數與狀態 | Exit Code |
|---:|---|---|---:|
| 1 | `vitest.cmd run tests/audit-redaction.test.ts` | `Test Files 1 passed (1)`, `Tests 10 passed (10)` | `0` |
| 2 | `vitest.cmd run tests/safe-error-logger.test.ts` | `Test Files 1 passed (1)`, `Tests 14 passed (14)` | `0` |
| 3 | `vitest.cmd run tests/auth-lifecycle.test.ts tests/admin-hardening.test.ts tests/idor-ownership.test.ts tests/rbac-workflow.test.ts` | `Test Files 4 passed (4)`, `Tests 40 passed (40)` | `0` |
| 4 | `vitest.cmd run`（全部 11 支離線測試檔） | `Test Files 11 passed (11)`, `Tests 152 passed (152)` | `0` |
| 5 | `npm.cmd test -- --run`（含未提供環境變數之 DB 測試檔） | `11 passed \| 1 skipped \| 1 failed`（`app-runtime.db.test.ts` 3 skipped；`integration.db.test.ts` 因未設 `TEST_DATABASE_URL` 觸發 fail-closed 檢查而失敗），合計 `152 passed \| 4 skipped (156)` | `1`（預期行為） |
| 6 | `vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`, `Tests 7 passed (7)` | `0` |

**未執行測試（NOT TESTED）**：`backend/tests/integration.db.test.ts`（未設定 `TEST_DATABASE_URL`）、`backend/tests/app-runtime.db.test.ts`（未設定 `TEST_RUNTIME_DATABASE_URL`，顯示為 skipped）、正式 Supabase / Supavisor 連線均依法規限制維持未執行，無任何偽報。

---

## 11. Backend / Frontend Build 結果

- **Backend TypeScript Build (`npm.cmd run build` / `tsc`)**：**PASS**（Exit Code `0`，零編譯錯誤）。
- **Frontend Production Build (`npm.cmd run build` / `tsc && vite build`)**：**PASS**（Exit Code `0`，`1612 modules transformed`，產出 `dist/assets/index-BybpJLnO.js 494.93 kB`）。

---

## 12. 尚未解決的風險

1. **Prisma 引擎內建錯誤日誌輸出**（`backend/src/config/database.ts:96`）：`@prisma/client` 在 `log: ['error']` 下由引擎直接輸出 `prisma:error` 至 stdout（如連線失敗訊息與 SQL 查詢片段），並不經應用程式 `logSafeError` 管線；不過此訊息屬於資料表結構與錯誤碼，且不應在本階段修改資料庫設定。若後續需統一收集為結構化脫敏日誌，可在資料庫整合檢討階段改用 Prisma `emit: 'event'` 並接駁至 `logSafeError`。
2. **整合 DB 測試與雲端實連驗證待續**：`integration.db.test.ts`、`app-runtime.db.test.ts` 及正式環境切換實測仍依授權分階段補完。

---

## 13. Git HEAD 與工作目錄前後差異

- **Git 分支 / HEAD**：修補前後均維持 `main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無任何 Commit / Push / Reset / Checkout。
- **Phase 3-C-21 工作目錄變更範圍**：
  - 修改既有檔案（新增本階段所需改動）：`backend/src/utils/audit.ts`、`backend/src/middleware/error-handler.ts`、`backend/src/server.ts`、`backend/tests/audit-redaction.test.ts`
  - 本階段新增檔案：`backend/src/utils/redaction.ts`、`backend/tests/safe-error-logger.test.ts`、`docs/DATABASE_PHASE3C21_GLOBAL_ERROR_LOGGING_HARDENING_REPORT.md`
  - 原有未追蹤報告（包含 Phase 3-C-20 報告等）與前期未提交變更均完整保留，無覆蓋或刪除。

---

## 14. 是否有非預期修改

- **無非預期修改**。本次所有變更嚴格限縮於 `backend/src/utils/redaction.ts`、`backend/src/utils/audit.ts`、`backend/src/middleware/error-handler.ts`、`backend/src/server.ts`、對應測試檔及本報告，未修改任何 Frontend 程式、`.env`、Prisma Schema、Migration、Render 設定、PG16 / 原有 PG17 / 暫存 PG17 Docker 容器或原始備份。

---

## 15. 階段結論

- **最終判定：PASS**
  - Backend 全域未處理錯誤（`error-handler.ts`）與伺服器關機資料庫斷線錯誤（`server.ts`）已完成統一 `logSafeError` 安全脫敏；`Error` / `AggregateError`、多參數/編碼 Query String、精準 `sessionId` / `revokedExistingSessions` 判定及無限遞迴與 Fail-closed 防護全數通過獨立自動化測試與前後端 Build 驗證。
