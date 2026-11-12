# CODE TO KNOW｜Phase 3-C-23：低風險脫敏缺陷修補與完整回歸測試報告

- 執行日期：2026-11-11
- 階段定位：Phase 3-C-23（針對 Phase 3-C-22 獨立安全稽核所列兩項 `LOW` 脫敏邊界缺陷進行修補與回歸驗證）
- 報告原則：僅修改本機 `backend/src/utils/redaction.ts`、`backend/tests/safe-error-logger.test.ts` 及本報告，未連線 Supabase、未修改 Schema/Migration/`.env`/Secrets、未異動任何 Docker 容器或 Volume、未變更任何既有備份檔。

---

## 一、開始前基線（Pre-edit Baseline）

1. **Git Branch / HEAD**：
   - Branch：`main`
   - HEAD：`86a0f1116693bcce476b8747a446900d54b29a4a`
   - 修補前後均無任何 Git commit、push、reset、checkout 或 clean。
2. **既有資料庫與備份保留狀態**：
   - Docker 容器（修補前後完整一致）：`code_to_know_pg17_phase3c18_audit`（`postgres:17-alpine`，`127.0.0.1:5434->5432/tcp`）、`code_to_know_pg17_restore_sandbox`（`3540c0362c80`，`127.0.0.1:5433->5432/tcp`）、`code_to_know_postgres`（`postgres:16-alpine`，`127.0.0.1:5432->5432/tcp`）與 `dazzling_tharp`（`Exited (0)`）。
   - Docker Volumes：`code-to-know_postgres_data`、`code_to_know_pg17_phase3c18_audit_data`、`code_to_know_pg17_restore_sandbox_data` 及既有匿名 Volume 均保留不變。
   - 原始備份 SHA-256（修補前後一致）：
     - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
     - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 二、兩項 `LOW` 缺陷根因與修補設計（`backend/src/utils/redaction.ts`）

### 2.1 修補 A：URL 編碼敏感 Query 參數值截斷問題（[`redactStringSecrets`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L83-L102)）

- **原根因**：
  - 單一未分層之 KV 規則在普通 `=`/` :` 分隔符情境下也把 `%26` / `%23` / `%3B` 視為停止邊界，導致 `/cb?password=p%40ss%26word&ok=1` 在 `%26` 處提早截斷為 `/cb?password=[REDACTED]%26word&ok=1`，外洩 `%26` 後段同值秘密字元。
- **修補設計（分層正則，禁止直接 `decodeURIComponent` 以避免無效百分比編碼失敗或混層繞過）**：
  1. **非編碼層（[`SENSITIVE_KV_UNQUOTED_PATTERN`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L73-L76)）**：當鍵值分隔符為未編碼 `[:=]` 時，值匹配 `[^\s,"'}\];&#]+`，僅在未編碼空白或 `&`/`#`/`;` 等原始邊界結束；值內含 `%26`、`%23`、`%3B`、`%20` 一併納入單一敏感參數值並整體遮罩。
  2. **單層 URL 編碼層（[`SENSITIVE_KV_ENCODED_L1_PATTERN`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L62-L65)）**：透過 [`URL_ENCODED_BOUNDARY_L1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L7-L8) 與 [`buildInlineSecretKeyBody('%')`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L15-L38) 識別 `%3D` / `%3A` 鍵值分隔符（亦涵蓋 `access%5Ftoken` 等底線編碼鍵），僅在 `%26`、`%23`、`%3B`、`%20` 或原始邊界停止。
  3. **雙層 URL 編碼層（[`SENSITIVE_KV_ENCODED_L2_PATTERN`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L56-L59)）**：識別 `%253D` / `%253A` 雙層編碼分隔符，並在 `%2526`、`%2523`、`%253B`、`%2520` 等邊界停止。
  4. **DSN 與 Bearer/Basic 編碼補強**：[`ENCODED_DSN_CREDENTIAL_L2`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L49-L50) 補強雙層編碼 DSN；[`AUTH_SCHEME_PATTERN`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L52-L53) 支援空白、`%20`、`%2520` 且於編碼查詢邊界停止。
  5. **錯誤邊界**：無任何 `decodeURIComponent` 呼叫；若輸入為 `%E0%A4%A` 或 `%ZZ` 等無效編碼，直接依正則遮罩整個參數值並 fail-closed，保留無關正常參數（例如 `&ok=1`、`&page=2&lang=zh-TW`）。

### 2.2 修補 B：`Map`、`Set`、`URL`、`URLSearchParams` 安全序列化（[`sanitizeValueInternal`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L330-L422)）

- **原根因**：
  - 內建 slot 型特殊物件被 `Object.entries()` 處理時會回傳 `{}`，雖不洩漏內部憑證，卻遺失可安全脫敏後保留的非敏感診斷資訊（如 `URL` host/path/非敏感 query、`Map`/`Set` 診斷項目）。
- **修補設計（原生內部槽位存取 + Fail-closed + 防 getter/`toJSON`/Proxy 旁路）**：
  1. **不觸發實例覆寫或 `toJSON`**：預先取得原生 Prototype getter / 方法參考（[`mapSizeGetter`～`urlSearchParamsGetter`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L153-L163)、`Map.prototype.entries.call`、`Set.prototype.values.call`、`URLSearchParams.prototype.entries.call`）。偽造原型物件（如 `Object.create(URL.prototype)`）或 `Proxy` 包裝於呼叫原生方法/getter 時會被 V8 internal slot 檢查拒絕並拋錯，由外層 [`sanitizeAuditValue`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L427-L433) 捕捉後 fail-closed 回傳 `'[REDACTION_ERROR]'`；而真實 `URL` 上被注入的惡意實例 `href` getter 或 `toJSON` 完全不會被呼叫。
  2. **[`sanitizeMapObject`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L165-L197)**：輸出 `{ type: 'Map', entries, ...(truncatedEntries) }`；對 key 與 value 皆遞迴脫敏，若字串 key 符合 [`SENSITIVE_KEY_PATTERN`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L40-L41) 則值強制輸出 `'[REDACTED]'`；超過 [`MAX_AUDIT_COLLECTION_ITEMS`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L2) (`100`) 時截斷並標註 `truncatedEntries`。
  3. **[`sanitizeSetObject`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L199-L226)**：輸出 `{ type: 'Set', values, ...(truncatedItems) }`，每個成員均遞迴經過脫敏、循環檢查（`WeakSet`）與深度限制（[`MAX_AUDIT_SANITIZE_DEPTH`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L1) = `6`）。
  4. **[`sanitizeURLSearchParamsObject`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L228-L276)**：輸出 `{ type: 'URLSearchParams', params, ...(truncatedParams) }`，對 key 與 value 脫敏、檢查 `SENSITIVE_KEY_PATTERN`、支援重複參數鍵（陣列聚合），並使用 `Object.defineProperty` 安全寫入屬性以防 `__proto__` 原型汙染，上限 `100` 筆。
  5. **[`sanitizeURLObject`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L278-L328)**：輸出 `{ type: 'URL', protocol, hostname, port?, pathname, username?, password?, searchParams, hash?, href }`；若含 `password` 則顯式遮罩 `password: '[REDACTED]'` 並移除 `href` 內認證密碼後再交由 `redactStringSecrets` 處理（含 `ftp://` 等非 HTTP DSN 協定、巢狀 query 與 `#fragment`）；`searchParams` 經遞迴 [`sanitizeValueInternal`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts#L330-L422) 安全展開並遵守深度上限 `6`。

---

## 三、實際修改與新增檔案清單

| 檔案路徑 | 變更性質 | 摘要說明 |
|---|---|---|
| [`backend/src/utils/redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts) | 修改 | 分離未編碼 / L1 / L2 URL 編碼秘密比對邊界（修補 A）；新增 `Map`、`Set`、`URL`、`URLSearchParams` 原生槽位安全序列化函式並接入 `sanitizeValueInternal`（修補 B） |
| [`backend/tests/safe-error-logger.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/safe-error-logger.test.ts) | 修改（僅附加新測項，保留既有第 1～16 項） | 新增第 17～21 項回歸測試，驗證 URL 編碼截斷、雙層/無效編碼、`Map`/`Set`/`URL`/`URLSearchParams` 脫敏與診斷保留、循環/深度/數量限制、偽造原型/Proxy/`toJSON`/實例 getter Fail-closed |
| [`docs/DATABASE_PHASE3C23_REDACTION_EDGE_CASE_FIX_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C23_REDACTION_EDGE_CASE_FIX_REPORT.md) | 新增 | 本階段完整執行與驗證報告 |

---

## 四、新增測試涵蓋項目（[`backend/tests/safe-error-logger.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/safe-error-logger.test.ts#L347-L547)）

- **第 17 項（L347–382）**：
  - `/cb?password=p%40ss%26word&ok=1` 實測精準輸出 `/cb?password=[REDACTED]&ok=1`，不外洩 `p%40ss` 或 `%26word`。
  - `/oauth/cb?access_token=tok%26part2%23part3%3Bpart4%20tail&ok=1&Client-Secret=cs%26hidden&page=2&lang=zh-TW` 實測完全遮罩敏感值且保留 `ok=1`、`page=2`、`lang=zh-TW`。
  - 雙層編碼 `https://app.test/login?next=https%3A%2F%2Fapp.test%2Fcb%3Finner%3Dhttps%253A%252F%252Fidp.test%252F%253Faccess_token%253Ddummy_l2_tok%2526ok%253D1%26ACCESS_TOKEN%3Ddummy_l1_tok%26keep%3Dyes&access%5Ftoken=dummy_pct_key_tok&state=normal` 實測內外層敏感值全數遮罩，且保留 `%2526ok%253D1`、`%26keep%3Dyes`、`&state=normal`。
  - 無效編碼 `/cb?token=%E0%A4%A%26secret_tail&password=%ZZ%23frag&ok=1` 實測輸出 `/cb?token=[REDACTED]&password=[REDACTED]&ok=1`。
- **第 18 項（L384–422）**：
  - `Map` 附掛於 `Error`：包含 `authorization`、`api_key`、`requestId`、含 `token` 的物件 Key 與含 `secret` 的物件 Value、以及含 `redis://u:...@h:6379/0` 之 Key；`Set` 含 `safe-tag`、`Bearer ...` 與 `{ password, step }` 物件；驗證全部敏感字串已清除且 `req-map-99`、`meta-key`、`cache-cluster`、`safe-tag`、`validate` 保留。
- **第 19 項（L424–464）**：
  - `URL`（含 `https://` 帳密 + 巢狀 `postgresql://` query + `#refresh_token=...` 與 `ftp://` 帳密及 query `token`）與 `URLSearchParams`（含 `client_secret`、多值同名 `tag` 與 `page=3`）附掛於 `Error`；驗證全部帳密與 token 不外洩，且保留 `api.codetoknow.edu`、`/v1/callback`、`"ok":"1"`、`files.internal`、`"dir":"out"`、`"page":"3"`。
- **第 20 項（L466–505）**：
  - 自我參考 `circularMap`（值與鍵）輸出 `'[CIRCULAR]'`、`circularSet` 輸出 `'[CIRCULAR]'`。
  - 深度超過 6 層時巢狀 `Map` / `URL` 停止並輸出 `'[MAX_DEPTH_REDACTED]'`。
  - 各 `105` 筆之 `Map` / `Set` / `URLSearchParams` 皆精準截斷於 100 筆並輸出 `truncatedEntries: 5`、`truncatedItems: 5`、`truncatedParams: 5`，尾端第 105 筆秘密不出現。
- **第 21 項（L507–546）**：
  - `Object.create(URL.prototype)` 與 `Object.create(Map.prototype)` 偽造原型直接 fail-closed 回傳 `'[REDACTION_ERROR]'`。
  - `new Proxy(new Map(...), {})` 經過 `logSafeError` 輸出 `REDACTION_ERROR` 且不外洩內容。
  - 真實 `URL` 注入丟錯之實例 `href` getter 與 `toJSON` 方法，實測 `poisonInvoked === false`，僅透過原生 slot 安全輸出並保留 `example.org` 與 `"ok":"1"`。

---

## 五、最後一次程式修改後之完整驗證結果

| 檢查項目 | 執行指令 | 實際結果 | Exit Code |
|---|---|---|---|
| AuditLog 脫敏測試 | `.\node_modules\.bin\vitest.cmd run tests/audit-redaction.test.ts` | `1 passed (1)`、`10 passed (10)`（納入下方 11 檔全過） | `0` |
| 全域日誌與邊界回歸測試 | `.\node_modules\.bin\vitest.cmd run tests/safe-error-logger.test.ts` | `1 passed (1)`、`19 passed (19)`（納入下方 11 檔全過） | `0` |
| Backend 全部 11 支離線測試 | `.\node_modules\.bin\vitest.cmd run tests/db-config-safety.test.ts tests/rbac-workflow.test.ts tests/validation.test.ts tests/database-ssl-config.test.ts tests/audit-redaction.test.ts tests/safe-error-logger.test.ts tests/auth-lifecycle.test.ts tests/security.test.ts tests/idor-ownership.test.ts tests/admin-hardening.test.ts tests/api.test.ts` | `Test Files 11 passed (11)`、`Tests 157 passed (157)` | `0` |
| Backend `npm test`（未設 DB URL） | `npm.cmd test` | 11 支離線測項 `157 passed`；`app-runtime.db.test.ts` `3 skipped`；`integration.db.test.ts` 因缺少顯式 `TEST_DATABASE_URL` 依 fail-closed 安全阻斷（`1 failed suite / 1 skipped test`）→ DB 測項標註 **`NOT TESTED`** | `1` |
| Backend TypeScript Build | `cd backend; npm.cmd run build` (`tsc`) | 通過，0 錯誤 | `0` |
| Frontend 路由保護測試 | `cd frontend; ..\backend\node_modules\.bin\vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`、`Tests 7 passed (7)` | `0` |
| Frontend Build | `cd frontend; npm.cmd run build` (`tsc && vite build`) | `1612 modules transformed`，產出 `dist/index.html`、`dist/assets/index-HmsvxDpa.css`、`dist/assets/index-BybpJLnO.js` (`494.93 kB`) | `0` |

---

## 六、全域日誌掃描結果（整個 `backend/src`）

掃描 `console\.`、`stdout\.write`、`stderr\.write`、`logSafeError`、`winston`、`pino`、`morgan`：

- `logSafeError` 統一錯誤入口匯入點（3 處）：
  - `backend/src/middleware/error-handler.ts:46`
  - `backend/src/server.ts:24`
  - `backend/src/utils/audit.ts:123`
- 唯一脫敏後 `console.error` 出口：`backend/src/utils/redaction.ts:483, 509`。
- 其餘非錯誤輸出僅為既有純靜態啟動橫幅與狀態提示：`app.ts:56`、`server.ts:7-12,21,31,39`、`config/env.ts:35,54,64,93`、`services/email.provider.ts:15,23,37,45`。整個 `backend/src` 無任何 `winston`、`pino`、`morgan`、`stdout.write`、`stderr.write` 或未經 `logSafeError` 的業務錯誤輸出。

---

## 七、遺漏風險評估與未驗證項目（`NOT TESTED`）

1. **原 Phase 3-C-22 兩項 `LOW` 脫敏缺陷現況**：均已修補並經第 17～21 項實際單元/回歸測試證明有效；原「非對抗測試第 16 項」維持無資料庫相依與重入防護。
2. **Phase 3-C-22 原報告第 7.3 項觀察備註**（`backend/src/config/database.ts:96` Prisma 引擎內建 `log: ['error']`）：維持與 `logSafeError` 獨立，不變更既有資料庫模組設定。
3. **`NOT TESTED`（依法規範本階段不連線/寫入資料庫）**：
   - `backend/tests/integration.db.test.ts`（需 `TEST_DATABASE_URL`）。
   - `backend/tests/app-runtime.db.test.ts`（需隔離測試實例 `TEST_APP_RUNTIME_URL`）。
   - 正式環境 Supabase / Supavisor 實機異常格式與 OS `SIGTERM`/`SIGINT` 實際子程序終止測試。

---

## 八、最終結論與判定

- **最終判定：`PASS`**
- **判定依據**：
  1. 兩項 Phase 3-C-22 `LOW` 脫敏邊界缺陷皆已在 [`backend/src/utils/redaction.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/redaction.ts) 完成最小且完整的結構性修補，不影響既有介面與呼叫端。
  2. 新增第 17～21 項測試均採真實輸入與防繞過斷言；最後一次修改後，Backend 全部 11 支離線測試（`157/157`）、Backend `tsc`、Frontend 路由保護測試（`7/7`）與 Frontend `tsc && vite build` 均已重新執行並全數通過，全域日誌掃描無外洩出口。
  3. Git HEAD/Branch、Docker 容器/Volume 與備份 SHA-256 皆維持基線不變，無殘留背景任務。

---

## 九、建議進入下一階段前確認事項（尚未執行 Phase 3-C-24）

- 依本階段限制，**未自動進入 Phase 3-C-24**，待使用者審閱本報告後指示下一步：
  1. 若下一階段規劃重跑真實 PG17 隔離 sandbox 整合測試（`integration.db.test.ts` / `app-runtime.db.test.ts`），屆時再顯式提供指向隔離測試庫的 `TEST_DATABASE_URL` / `TEST_APP_RUNTIME_URL` 驗證真實 DB 交易寫入與 `AuditLog` 回滾。
  2. Git working tree 包含本階段及前階段累計之本機未提交變更，建議於審閱通過後再依團隊流程進行檢視與版本控制處理。
