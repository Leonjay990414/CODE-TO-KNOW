# CODE TO KNOW — Phase 3-C-19 `AuditLog` 統一脫敏與安全修補報告

**執行階段**：Phase 3-C-19（依據 Phase 3-C-18 獨立安全稽核結果執行之 `AuditLog` 寫入統一化與脫敏修補）  
**工作範圍**：本機後端程式碼（`audit.ts`、`auth.service.ts`、`admin.service.ts`、`teacher.service.ts`）、專用單元測試與本報告（不操作正式資料庫、不執行 Migration、不修改 Schema）  
**報告日期**：2026-11-11  

---

## 一、修正前問題（依據 Phase 3-C-18 稽核結果）

依據 [DATABASE_PHASE3C18_INDEPENDENT_SECURITY_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C18_INDEPENDENT_SECURITY_AUDIT.md)，修補前存在以下兩項主要問題：

1. **P0 — `AuditLog` 寫入入口未統一經過脫敏（MEDIUM）**：
   - `auth.service.ts`（7 處）、`admin.service.ts`（2 處）、`teacher.service.ts`（1 處）皆直接呼叫 `prisma.auditLog.create` 或 `tx.auditLog.create`，繞過 `backend/src/utils/audit.ts` 之 `logAuditEvent` / `sanitizeAuditDetails`，僅於管理員讀取 `/api/admin/audit-logs`（`listAuditLogs`）時進行讀取端脫敏。
   - 若業務參數（如 `reviewNote`、`schoolName`）或呼叫端欄位意外夾帶敏感資訊，會於資料庫落地明文。
   - 原 `logAuditEvent` 的 `catch` 分支直接執行 `console.error('Failed to record audit log:', action, error)`，若 DB 例外訊息包含連線字串或憑證，可能於錯誤日誌外洩。
2. **P1 — `sanitizeAuditDetails` / `sanitizeAuditValue` 脫敏邊界不完整（LOW / INFORMATIONAL）**：
   - **深層物件漏網**：`depth > 6` 時直接 `return value`，導致深層物件內的 `password`、`token`、`apiKey` 原樣未遮罩輸出，且缺乏循環參照與集合上限防護。
   - **DSN 覆蓋不足**：僅遮罩 `postgresql://` / `postgres://`，未遮罩 `redis://`、`rediss://`、`mysql://`、`mongodb://`、`mongodb+srv://`（包含無帳號僅密碼的 `redis://:pass@host`）。
   - **行內敏感字串邊界不足**：未匹配蛇形／烤肉串命名之 `api_key=`、`api-key`、`private_key`、`Cookie:`/`Set-Cookie:` 與 `Basic` 授權格式。
   - **`Error` 實例退化為 `{}`**：`Error.name` / `Error.message` / `Error.stack` 為不可列舉屬性，經 `Object.entries` 序列化後變為空物件 `{}`，無法於保留診斷摘要的同時確保訊息／Stack／`.cause` 先行脫敏。

---

## 二、修改檔案及原因

| 檔案路徑 | 異動類型 | 修改原因 |
| :--- | :---: | :--- |
| [audit.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts) | 修改 | 強化 `logAuditEvent` 作為統一寫入入口（同時相容一般 `await`、互動式 `$transaction(tx)`、批次陣列 `$transaction([...])` 及舊版 Express 呼叫），加入 Fail-closed 回退 JSON、深層/循環防護、7+ 種 DSN 脫敏、行內關鍵字強化、`Error` 脫敏序列化與錯誤日誌脫敏。 |
| [auth.service.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts) | 修改 | 將全數 7 處直接 `auditLog.create`（含 `verifyEmail` 與 `resetPassword` 交易內寫入）改為透過共用入口 `logAuditEvent` 寫入，保留原有互動式交易原子性與錯誤行為。 |
| [admin.service.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.service.ts) | 修改 | 將 `approveTeacherApplication` 與 `rejectTeacherApplication` 之 `AuditLog` 寫入改由 `logAuditEvent` 產生受保護的 `PrismaPromise`，維持原有 `prisma.$transaction([...])` 批次交易語意；`listAuditLogs` 保留 `sanitizeAuditDetails` 讀取縱深防禦。 |
| [teacher.service.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/teachers/teacher.service.ts) | 修改 | 將 `submitApplication` 之 `AuditLog` 寫入改為呼叫 `logAuditEvent`。 |
| [audit-redaction.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/audit-redaction.test.ts) | 新增 | 新增 Phase 3-C-19 專用 10 大測試案例，完整驗證敏感欄位變體、深層與超限深度、循環參照、多種 DSN、行內字串、`Error` 實例、中英文業務資料保留、三模組入口統一性、交易原子性、Fail-closed、靜態無繞過掃描及錯誤日誌脫敏。 |
| `docs/DATABASE_PHASE3C19_AUDITLOG_REDACTION_HARDENING_REPORT.md` | 新增 | 建立本階段交付與驗收報告。 |

---

## 三、`AuditLog` 寫入與存取入口盤點表（修改後全局掃描）

透過 `backend/src` 全局檢索 `auditLog|logAuditEvent`，確認**無任何業務服務繞過共用入口直接呼叫 `auditLog.create`**：

| # | 檔案與位置 | 操作／事件 | 呼叫方式與交易語意 | 脫敏狀態 |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `backend/src/utils/audit.ts` (L240–278) | 共用寫入入口 `logAuditEvent` | 唯一允許呼叫 `.auditLog.create` 之模組；輸出前必經 `buildAuditLogCreateData` 與 Fail-closed 保護 | **統一寫入端強制脫敏** |
| 2 | `backend/src/modules/auth/auth.service.ts:84` | `USER_REGISTER` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 3 | `backend/src/modules/auth/auth.service.ts:133` | `LOGIN_FAILED` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 4 | `backend/src/modules/auth/auth.service.ts:159` | `USER_LOGIN` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 5 | `backend/src/modules/auth/auth.service.ts:193` | `USER_LOGOUT` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 6 | `backend/src/modules/auth/auth.service.ts:300` | `EMAIL_VERIFIED` | `await logAuditEvent(..., tx)`（互動式 `$transaction` 內，維持例外回滾） | 已統一經共用入口 |
| 7 | `backend/src/modules/auth/auth.service.ts:346` | `PASSWORD_RESET_REQUESTED` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 8 | `backend/src/modules/auth/auth.service.ts:406` | `PASSWORD_RESET_COMPLETED` | `await logAuditEvent(..., tx)`（互動式 `$transaction` 內，維持例外回滾） | 已統一經共用入口 |
| 9 | `backend/src/modules/admin/admin.service.ts:131` | `TEACHER_APPLICATION_APPROVED` | `logAuditEvent(...)`（納入 `prisma.$transaction([...])` 批次陣列） | 已統一經共用入口 |
| 10 | `backend/src/modules/admin/admin.service.ts:190` | `TEACHER_APPLICATION_REJECTED` | `logAuditEvent(...)`（納入 `prisma.$transaction([...])` 批次陣列） | 已統一經共用入口 |
| 11 | `backend/src/modules/teachers/teacher.service.ts:45` | `TEACHER_APPLICATION_SUBMITTED` | `await logAuditEvent(...)`（獨立寫入） | 已統一經共用入口 |
| 12 | `backend/src/modules/admin/admin.service.ts:210–241` | `listAuditLogs` | 唯讀查詢（`findMany` + `count`），對每筆 `details` 額外執行 `sanitizeAuditDetails` | 讀取端縱深防禦 |

> **資料庫 ACL 保留確認**：`c2k_test_app_runtime` 僅具備 `AuditLog` `SELECT, INSERT` 權限（無 `UPDATE` / `DELETE` / `TRUNCATE`），本次修改完全維持寫入欄位與 `app_runtime` append-only 限制一致，無新增循環依賴（`audit.ts` 僅單向依賴 `config/database.ts`）。

---

## 四、統一入口實作結果

[`logAuditEvent`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L240-L278) 採用 TypeScript 函式多載實作：
- **結構化嚴格模式**：`logAuditEvent(payload: AuditEventInput, client?: AuditLogClient): Prisma.Prisma__AuditLogClient<any>`
  - 非 `async` 直接回傳底層 `PrismaPromise`，支援：
    1. 獨立呼叫 `await logAuditEvent({ userId, action, details, ipAddress, userAgent })`；
    2. 互動式交易 `await logAuditEvent({ ... }, tx)`（保留交易失敗原子回滾語意）；
    3. 批次陣列交易 `prisma.$transaction([op1, op2, logAuditEvent({ ... })])`。
- **舊版 Express best-effort 模式**：`logAuditEvent(req, action, userId, details)` 維持相容，並在 `catch` 分支先以 `sanitizeAuditValue(error)` 脫敏後再紀錄 `console.error`。
- **Fail-closed 機制**：`serializeAuditDetails` 與 `sanitizeAuditValue` 均包覆例外處理；若序列化發生異常或回傳 `'[REDACTION_ERROR]'`，一律寫入 `'{"redactionFallback":"[REDACTION_ERROR]"}'`，絕不回退輸出原始內容。此外，`ipAddress` 與 `userAgent` 亦先經過 `redactStringSecrets`。

---

## 五、敏感資料脫敏修正項目

1. **深層巢狀與資料量／循環保護**：
   - 定義常數 `MAX_AUDIT_SANITIZE_DEPTH = 6`、`MAX_AUDIT_COLLECTION_ITEMS = 100`、`MAX_AUDIT_STRING_LENGTH = 4096`。
   - `depth <= 6` 之物件／陣列完整遞迴遮罩；超過深度（`depth > 6`）之物件／陣列回傳 `'[MAX_DEPTH_REDACTED]'`（絕不原樣回傳未檢查物件），葉節點字串仍經 `redactStringSecrets`。
   - 透過祖先路徑追蹤集合（`WeakSet<object>` + `try/finally delete`）將真正循環參照取代為 `'[CIRCULAR]'`，同時允許非循環共用兄弟參照正確呈現；`Date` 轉為 ISO 字串、`bigint` 轉為字串。
   - 長字串先執行所有脫敏規則後再截斷並加上 `...[TRUNCATED]`。
2. **多種資料庫／服務連線字串（DSN）遮罩**：
   - `DSN_CREDENTIAL_PATTERN` 覆蓋 `postgresql://`、`postgres://`、`redis://`、`rediss://`、`mysql://`、`mongodb://`、`mongodb+srv://`、`amqp(s)://` 與含認證之 `http(s)://`，同時支援省略使用者名稱的 `redis://:password@host` 格式。
3. **行內敏感字串補強**：
   - 覆蓋 `Bearer` / `Basic`、`password`、`token`、`access_token`、`refresh_token`、`secret`、`client_secret`、`apiKey`、`api_key`、`x-api-key`、`privateKey`、`private_key`、`authorization`、`cookie`、`set-cookie`、`session`、`sessionId`、`credential` 等大小寫、蛇形／駝峰／烤肉串及引號／無引號鍵值分離格式。
4. **`Error` 實例安全處理**：
   - 顯式保留脫敏後的 `name`、`message`、`stack`（若有），並遞迴脫敏 `code`、`cause`（含防循環）與其他可列舉附加屬性（先以 `SENSITIVE_KEY_PATTERN` 比對 Key 名稱）。
5. **非敏感業務資料保留**：
   - 驗證中文／英文學校名稱、科目、審核備註、UUID、公開 HTTPS URL、布林與數值均完整保留。

---

## 六、測試執行結果與 Exit Code（全數於最後一次程式修改後重跑）

> **僅使用合成假資料；未修改 PG16 開發庫、原有 PG17 沙盒與 Supabase。**

| # | 測試／指令 | 案例數與結果 | Exit Code | 狀態 |
| :-: | :--- | :--- | :-: | :---: |
| 1 | `backend`：`.\node_modules\.bin\vitest.cmd run tests/audit-redaction.test.ts` | **1 file passed / 10 passed (10)** | `0` | **PASS** |
| 2 | `backend`：`auth-lifecycle`, `admin-hardening`, `idor-ownership`, `rbac-workflow`, `audit-redaction` | **5 files passed / 50 passed (50)** | `0` | **PASS** |
| 3 | `backend` 完整離線測試套件（10 份檔案：`db-config-safety` 59, `rbac-workflow` 17, `validation` 12, `database-ssl-config` 7, `audit-redaction` 10, `auth-lifecycle` 6, `security` 5, `idor-ownership` 7, `admin-hardening` 10, `api` 5） | **10 files passed / 138 passed (138)** | `0` | **PASS** |
| 4 | `backend`：`npm run build` (`tsc`) | TypeScript 編譯 0 錯誤 | `0` | **PASS** |
| 5 | `frontend`：`..\backend\node_modules\.bin\vitest.cmd run tests/sources-route-protection.test.tsx` | **1 file passed / 7 passed (7)** | `0` | **PASS** |
| 6 | `frontend`：`npm run build` (`tsc && vite build`) | 1612 modules 建置成功（`dist/index.html` 1.01 kB、`css` 14.22 kB、`js` 494.93 kB） | `0` | **PASS** |
| 7 | `backend` 隔離 PG17.11 實機測試：`tests/app-runtime.db.test.ts`（`TEST_APP_RUNTIME_URL` -> `127.0.0.1:5434/code_to_know_test` as `c2k_test_app_runtime`） | **1 file passed / 3 passed (3)** | `0` | **PASS** |
| 8 | `backend`：`npm test`（無 `TEST_DATABASE_URL` / `TEST_APP_RUNTIME_URL`） | `1 failed \| 10 passed \| 1 skipped (12)`；`138 passed \| 4 skipped (142)`（`integration.db.test.ts` 於 `beforeAll` 因未設定 `TEST_DATABASE_URL` 正確拒絕回退；`app-runtime.db.test.ts` 略過 3 項） | `1` | **EXPECTED GUARD** |
| 9 | `integration.db.test.ts` @ PG16 Port `5432` 與 Supabase 正式庫連線驗證 | 依嚴格限制未於 PG16 `5432` 建立 `code_to_know_test` 且未連線 Supabase | — | **NOT TESTED** |

---

## 七、尚未解決之風險與後續項目

1. **PG16 Port `5432` 整合測試與 Supabase 正式環境連線（`NOT TESTED`）**：尚未對正式 Supabase（含 Supavisor Pooler + `sslmode=require` + CA 憑證）與獨立 PG16 `TEST_DATABASE_URL` 執行端到端實測。
2. **其餘 27/36 資料模型（既有待開發項目）**：[`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L42-L94) 所列尚未實作 API 之業務模型，日後新增端點時須同步套用所有權隔離與 `logAuditEvent`。
3. **Phase 3-C-18 核准待考量之低風險補強項**：`auth.service.ts` 交易內 `expiresAt > now`／停用舊重設 Token、管理員自我核准保護、`optionalAuthenticate` 狀態檢查與前端 `Navbar` `PLATFORM_ADMIN` 徽章顯示等項目不屬於本階段 `AuditLog` 範圍，維持原狀未動。

---

## 八、Git HEAD、工作目錄前後差異與非預期修改檢查

- **Git 分支與 HEAD**：`main` 分支，`HEAD = 86a0f1116693bcce476b8747a446900d54b29a4a`（無 commit/push/reset）。
- **工作目錄變化對比（Phase 3-C-18 結束後 -> Phase 3-C-19 完成後）**：
  - 原有使用者未提交檔案、Phase 3-C-17 修改與既有文件／個人檔案（`.docx`、`.txt`、`照片/`、`scripts/database/*` 等）皆完整保留。
  - **本階段唯一程式碼新增／異動**：
    - 修改：`backend/src/utils/audit.ts`、`backend/src/modules/auth/auth.service.ts`、`backend/src/modules/admin/admin.service.ts`、`backend/src/modules/teachers/teacher.service.ts`
    - 新增：`backend/tests/audit-redaction.test.ts`、`docs/DATABASE_PHASE3C19_AUDITLOG_REDACTION_HARDENING_REPORT.md`
- **非預期修改**：**無（0 處）**。
- **環境容器保留確認**：`code_to_know_postgres` (`5432`)、`code_to_know_pg17_restore_sandbox` (`5433`) 與暫時隔離測試容器 `code_to_know_pg17_phase3c18_audit` (`5434`) 及各自 Volume 均完好保留。

---

## 九、階段結論

**Phase 3-C-19（`AuditLog` 統一脫敏與安全修補）結論：PASS**  
所有 `AuditLog` 業務寫入點已 100% 集中至 `logAuditEvent` 統一入口且於寫入資料庫前強制執行 Fail-closed 脫敏；深層／超限物件、循環參照、7+ 種 DSN、行內敏感字串與 `Error` 實例皆完成修補並通過 138 項後端離線測試、前後端建置與隔離 PG17.11 實機驗證。（`integration.db.test.ts` @ 5432 與 Supabase 正式庫依階段限制維持 `NOT TESTED`。）  

依指示停止於本階段交付狀態，等候使用者驗收指示。
