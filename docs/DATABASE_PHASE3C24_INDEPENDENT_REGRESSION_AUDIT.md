# CODE TO KNOW｜Phase 3-C-24：獨立安全回歸稽核與網站穩定性檢查報告

- 稽核日期：2026-11-12
- 稽核階段：Phase 3-C-24（針對 Phase 3-C-23 修補成果之唯讀獨立回歸稽核與網站穩定性檢查）
- 稽核原則：全程唯讀，未修改任何正式程式碼、測試檔、Prisma Schema、Migration、`.env`、密碼/金鑰/Token、Docker 容器/Volume 或原始備份；未連線 Supabase、未執行任何資料庫寫入、未執行 Commit/Push/Deploy。

---

## 一、執行環境與 Git 基線

1. **Git 分支與 HEAD**：
   - Branch：`main`
   - HEAD：`86a0f1116693bcce476b8747a446900d54b29a4a`（與預期基線完全一致，無任何 commit、push、reset 或 clean）
2. **工作目錄確認**：
   - Phase 3-C-23 相關檔案均存在於工作目錄：`backend/src/utils/redaction.ts`（`??`）、`backend/tests/safe-error-logger.test.ts`（`??`）、`docs/DATABASE_PHASE3C23_REDACTION_EDGE_CASE_FIX_REPORT.md`（`??`），其餘既有已修改與未追蹤檔案完整保留，未遭覆寫或清除。
   - 本階段僅新增本稽核報告 `docs/DATABASE_PHASE3C24_INDEPENDENT_REGRESSION_AUDIT.md`。
3. **執行背景任務**：
   - `manage_task` 檢查確認目前無任何殘留背景任務。

---

## 二、Phase 3-C-23 修補獨立檢查結果

針對 [`backend/src/utils/redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts)、[`backend/tests/safe-error-logger.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/safe-error-logger.test.ts) 與 [`backend/tests/audit-redaction.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/audit-redaction.test.ts) 進行獨立程式碼審查與實測驗證：

| 檢查項目 | 驗證依據與結果 | 結論 |
|---|---|---|
| 1. 單層及雙層 URL 編碼敏感參數完整遮罩 | `redactStringSecrets` 將未編碼 `[:=]`（`SENSITIVE_KV_UNQUOTED_PATTERN`）、單層 `%3D`/`%3A`（`SENSITIVE_KV_ENCODED_L1_PATTERN`）及雙層 `%253D`/`%253A`（`SENSITIVE_KV_ENCODED_L2_PATTERN`）分離處理，並搭配 `ENCODED_DSN_CREDENTIAL_L2` 與 `AUTH_SCHEME_PATTERN`。`safe-error-logger.test.ts` 第 17 項實測 `/cb?password=p%40ss%26word&ok=1`、多編碼邊界及雙層編碼 `access_token` 均精準遮罩且保留正常參數。 | **PASS** |
| 2. 無效百分比編碼遵守 Fail-closed | `redaction.ts` 全檔未使用 `decodeURIComponent` 或 `decodeURI`；第 17 項實測 `/cb?token=%E0%A4%A%26secret_tail&password=%ZZ%23frag&ok=1` 正確輸出 `/cb?token=[REDACTED]&password=[REDACTED]&ok=1`，不拋出 `URIError` 亦不退回明文。 | **PASS** |
| 3. `Map`、`Set`、`URL`、`URLSearchParams` 安全序列化 | `sanitizeMapObject`、`sanitizeSetObject`、`sanitizeURLSearchParamsObject`、`sanitizeURLObject`（`redaction.ts:165-328`）與第 18～19 項實測驗證：敏感 key/value/憑證/query/fragment 皆脫敏，非敏感診斷資訊（host/path/正常參數）與重複參數均安全保留，且 `URLSearchParams` 使用 `Object.defineProperty` 防止 `__proto__` 原型汙染。 | **PASS** |
| 4. Proxy、偽造原型、循環參照及深度/數量限制 | 第 20～21 項實測驗證：自我參照 `Map`/`Set` 輸出 `'[CIRCULAR]'`；深度 > 6 輸出 `'[MAX_DEPTH_REDACTED]'`；> 100 筆截斷並標註 `truncatedEntries`/`truncatedItems`/`truncatedParams`；`Object.create(URL.prototype)`、`Object.create(Map.prototype)` 及 `Proxy(new Map(...))` 因原生 internal slot 檢查失敗而 fail-closed 回傳 `'[REDACTION_ERROR]'`。 | **PASS** |
| 5. 避免執行使用者覆寫的 `getter` 或 `toJSON` | `redaction.ts:153-163` 預先擷取原生 Prototype getter（`Object.getOwnPropertyDescriptor(Proto, prop)?.get`）與原生方法（`Map.prototype.entries.call`、`Set.prototype.values.call`、`URLSearchParams.prototype.entries.call`）；第 21 項實測確認注入會拋錯之實例 `href` getter 與 `toJSON` 完全未被執行（`poisonInvoked === false`）。 | **PASS** |
| 6. 全域錯誤日誌無未經脫敏之業務錯誤輸出 | 全域 `Select-String` 掃描 `backend/src`：`logSafeError` 統一收斂 `error-handler.ts:46`、`server.ts:24`、`audit.ts:123` 三大錯誤出口；唯一 `console.error` 出口位於 `redaction.ts:483, 509`。其餘 `console.*`（`app.ts:56`、`server.ts:7-12,21,31,39`、`env.ts:35,54,64,93`、`email.provider.ts:15,23,37,45`）均為純靜態字面值或 Zod 欄位名稱，無 `winston`/`pino`/`morgan`/`stdout.write`/`stderr.write`。 | **PASS** |
| 7. 無新增不必要依賴或循環引用 | `Select-String -Path backend/src/utils/redaction.ts -Pattern '^import|require\('` 結果為 **0 筆**（零外部套件與零內部模組依賴）；`audit.ts`、`error-handler.ts`、`server.ts` 僅單向匯入 `redaction.ts`。 | **PASS** |

---

## 三、跨模組回歸檢查（AuditLog、Auth、Admin、Teacher、Error Handler、Server Logger、Frontend）

| 模組 | 檢查內容與驗證證據 | 結論 |
|---|---|---|
| **AuditLog** | 全域掃描確認 `backend/src` 僅 `utils/audit.ts:112, 121` 呼叫 `auditLog.create`，所有業務寫入（`auth.service.ts`、`admin.service.ts`、`teacher.service.ts`）均統一經由 `logAuditEvent` 並於寫入前執行 `serializeAuditDetails` + IP/UA 脫敏；讀取端 `admin.service.ts:236` (`listAuditLogs`) 再次呼叫 `sanitizeAuditDetails(entry.details)`。`audit-redaction.test.ts`（10/10）全數通過。 | **PASS** |
| **Auth** | `auth-lifecycle.test.ts`（6/6）、`security.test.ts`（5/5）與 `validation.test.ts`（12/12）全數通過，確認登入、註冊、信箱驗證、密碼重設 Token 單次使用、帳號狀態與安全限制未受影響。 | **PASS** |
| **Admin** | `admin-hardening.test.ts`（10/10）與 `rbac-workflow.test.ts`（17/17）全數通過；Admin 權限檢查與審計日誌查詢二次脫敏維持正常。 | **PASS** |
| **Teacher** | `idor-ownership.test.ts`（7/7）與 `rbac-workflow.test.ts`（17/17）全數通過；Teacher 所有權隔離與狀態轉換正常。 | **PASS** |
| **Error Handler & Server Logger** | `error-handler.ts` 正常處理 `AppError`、`ZodError`、`SyntaxError` 與未知錯誤 500 回應（不洩漏堆疊密碼，僅於 `NODE_ENV=development` 回傳脫敏後 `stack`）；`server.ts` 優雅關閉 DB 斷線錯誤經 `logSafeError` 記錄；`api.test.ts`（5/5）與 `safe-error-logger.test.ts`（19/19）全數通過。 | **PASS** |
| **Frontend Protected Routes** | `App.tsx:55-89` 與 `ProtectedRoute.tsx` 維持對 `#sources`（`requiredRoles={['ADMIN']}`）及教師/學生專區之角色保護，且 `SYSTEM_OPERATOR` 隔離不受影響；`sources-route-protection.test.tsx`（7/7）全數通過。 | **PASS** |

---

## 四、Backend 與 Frontend 測試結果（對照 Phase 3-C-23 基線）

| 檢查項目 | 執行指令 | 本次實測結果 | 與 Phase 3-C-23 基線差異 |
|---|---|---|---|
| Backend 11 支離線測試 | `.\node_modules\.bin\vitest.cmd run tests/db-config-safety.test.ts tests/rbac-workflow.test.ts tests/validation.test.ts tests/database-ssl-config.test.ts tests/audit-redaction.test.ts tests/safe-error-logger.test.ts tests/auth-lifecycle.test.ts tests/security.test.ts tests/idor-ownership.test.ts tests/admin-hardening.test.ts tests/api.test.ts` | `Test Files 11 passed (11)`、`Tests 157 passed (157)`，Exit `0` | **完全一致（0 差異）** |
| AuditLog 脫敏測試 | `.\node_modules\.bin\vitest.cmd run tests/audit-redaction.test.ts` | `1 passed (1)`、`10 passed (10)`，Exit `0` | **完全一致（0 差異）** |
| 全域錯誤日誌測試 | `.\node_modules\.bin\vitest.cmd run tests/safe-error-logger.test.ts` | `1 passed (1)`、`19 passed (19)`，Exit `0` | **完全一致（0 差異）** |
| Backend 完整 `npm test`（無 DB URL） | `cd backend; npm.cmd test` | 11 支離線測試 `157 passed`；`app-runtime.db.test.ts` `3 skipped`；`integration.db.test.ts` 依 fail-closed 防呆拒絕無 `TEST_DATABASE_URL`（`1 failed suite / 1 skipped test`） | **完全一致（保護機制正常生效）** |
| Backend TypeScript Build | `cd backend; npm.cmd run build` (`tsc`) | 通過，0 錯誤，Exit `0` | **完全一致** |
| Frontend 路由保護測試 | `cd frontend; ..\backend\node_modules\.bin\vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`、`Tests 7 passed (7)`，Exit `0` | **完全一致** |
| Frontend TypeScript + Vite Build | `cd frontend; npm.cmd run build` | `1612 modules transformed`，產出 `dist/index.html`、`dist/assets/index-HmsvxDpa.css`、`dist/assets/index-BybpJLnO.js` (`494.93 kB`)，Exit `0` | **完全一致** |

---

## 五、安全性問題與風險分級

- **Critical / High / Medium**：**0 個**。
- **Low / 觀察項**：
  1. `backend/src/config/database.ts:96` Prisma 引擎內建 `log: ['error']` 屬於 Prisma stdout/stderr 通道，與應用程式 `logSafeError` 獨立；目前測試與靜態掃描未見連線字串密碼出現於輸出中。
  2. `Map`/`Set`/`URL`/`URLSearchParams` 之外的其他未知第三方類別若將憑證存於 Symbol 鍵或不可列舉內部槽位，依目前 `Object.entries` 行為預設不會輸出（偏向 fail-safe 不外洩，僅無額外展開）。

---

## 六、`NOT TESTED` 項目及原因（需另行授權）

1. **`backend/tests/integration.db.test.ts`（`NOT TESTED`）**：需提供隔離測試庫之 `TEST_DATABASE_URL` 並執行 PostgreSQL 寫入與清理，依本階段唯讀規範未執行。
2. **`backend/tests/app-runtime.db.test.ts`（`NOT TESTED`）**：需啟動隔離 PG17 測試實例並提供 `TEST_APP_RUNTIME_URL`（`127.0.0.1:5434/code_to_know_test`）驗證 `app_runtime` 角色交易與回滾，依規範未執行。
3. **正式 Supabase / Supavisor 實機連線與真實 `SIGTERM`/`SIGINT` 子程序結束測試（`NOT TESTED`）**：依規範禁止連線正式資料庫且本階段未執行真實進程訊號測試。
4. **Docker 容器與 Volume 即時狀態查詢（未啟動服務）**：本次執行 `docker ps -a` 與 `docker volume ls` 回傳 `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`（主機重開機後 Docker Desktop daemon 尚未啟動；依唯讀原則本階段未擅自啟動服務或變更容器）。

---

## 七、Docker、Volume、備份完整性確認

- **原始備份檔案 SHA-256（實測驗證與基線完全一致）**：
  - `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump`：
    `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb`：
    `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`
- **Docker 容器與 Volumes**：因 Docker Desktop 服務於本次稽核時未啟動（pipe 不存在），本階段無法即時列舉容器與 Volume；全程未執行任何 Docker 建立、啟動、停止或刪除指令。

---

## 八、最終判定

- **最終判定：`PASS`**
- **判定理由**：
  - Phase 3-C-23 兩項修補（URL 編碼邊界分層與 `Map`/`Set`/`URL`/`URLSearchParams` 原生槽位安全序列化）經獨立審查與第 17～21 項測試驗證完全生效且遵守 Fail-closed 與零循環依賴。
  - AuditLog、Auth、Admin、Teacher、Error Handler、Server Logger 與 Frontend 路由保護均無任何功能或安全回歸；Backend 11 支離線測試（`157/157`）、Frontend 測試（`7/7`）與前後端 Build 結果與 Phase 3-C-23 基線 100% 一致。
  - 原始備份 SHA-256 完整未變，無任何越權或禁區操作；`NOT TESTED` 資料庫整合測試與未啟動之 Docker Desktop 狀態已明確標註。

---

## 九、下一階段建議（尚未自動執行 Phase 3-C-25）

1. 若需完成真實 PostgreSQL 交易與 `app_runtime` 角色整合回歸（`integration.db.test.ts` 與 `app-runtime.db.test.ts`），請於確認啟動 Docker Desktop 與 PG17 隔離測試實例（Port `5434`）後，另行授權並顯式提供 `TEST_DATABASE_URL` / `TEST_APP_RUNTIME_URL` 執行。
2. 若準備整理目前累計本機未提交變更，建議先審閱 `git status` 與各階段報告後，再依專案 Git 流程分批檢視與提交。
