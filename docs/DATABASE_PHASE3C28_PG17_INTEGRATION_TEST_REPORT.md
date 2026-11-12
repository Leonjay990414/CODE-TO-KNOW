# CODE TO KNOW｜Phase 3-C-28：PG17 隔離資料庫實際整合測試與權限驗收報告

- 執行日期：2026-11-12
- 階段定位：Phase 3-C-28（PG17 隔離資料庫實際整合測試與權限驗收）
- 執行原則：全程未連線 Supabase、未操作 PG16（`5432`）與 PG17 歷史還原庫（`5433`）、未修改任何正式程式碼/Schema/`.env`/備份、未重建測試庫、未重設既有角色密碼、未刪除任何 Docker 容器或 Volume。

---

## 一、Docker 與容器身分確認

已透過 `docker ps -a`、`docker volume ls` 與 `docker inspect code_to_know_pg17_phase3c18_audit` 完整確認：

| 環境 | Container ID | 容器名稱 | Image | Host -> Container Port | 專用 Volume | 狀態 |
|---|---|---|---|---|---|---|
| **PG16（禁止操作）** | `b7ec11c47db4` | `code_to_know_postgres` | `postgres:16-alpine` | `127.0.0.1:5432->5432/tcp` | `code-to-know_postgres_data` | `Up`（未接觸） |
| **PG17 歷史還原庫（禁止操作）** | `08df84db262b` | `code_to_know_pg17_restore_sandbox` | `3540c0362c80` | `127.0.0.1:5433->5432/tcp` | `code_to_know_pg17_restore_sandbox_data` | `Up`（未接觸） |
| **PG17 隔離測試環境（唯一授權目標）** | `16bea6ce523c` (`16bea6ce523cc37e5e1dc9ee05e7eb2981cce4d1c56b3a7f4d54bb908e2c7f66`) | `code_to_know_pg17_phase3c18_audit` | `postgres:17-alpine` | `127.0.0.1:5434->5432/tcp` | `code_to_know_pg17_phase3c18_audit_data` | 已啟動並通過 `pg_isready` |

---

## 二、PG16、PG17 還原庫、PG17 測試環境隔離證據

- 三者分別對應三個獨立 Container ID、三個獨立 Host Port（`5432`、`5433`、`5434`）與三個獨立 Docker Named Volume（`code-to-know_postgres_data`、`code_to_know_pg17_restore_sandbox_data`、`code_to_know_pg17_phase3c18_audit_data`）。
- 本階段僅對 `16bea6ce523c`（`code_to_know_pg17_phase3c18_audit`，Port `5434`）執行唯讀檢查與 Round 1 測試啟動，完全未連線或操作 `5432`、`5433` 及 Supabase。

---

## 三、測試資料庫與角色準備結果（唯讀檢查）

於 `code_to_know_pg17_phase3c18_audit` 內執行唯讀檢查確認：
- **PostgreSQL 版本**：`PostgreSQL 17.11 on x86_64-pc-linux-musl`
- **測試資料庫**：`code_to_know_test` 已存在。
- **測試角色**：`c2k_test_app_runtime` 已存在（`rolsuper = f`、`rolcreatedb = f`、`rolcreaterole = f`、`rolbypassrls = t`）。
- **認證機制（`pg_hba.conf`）**：外部 TCP 連線規則為 `host all all all scram-sha-256`（Docker bridge 連入須提供正確 `c2k_test_app_runtime` 密碼）。
- **遵循規範**：因測試庫與角色皆已就緒，依 Phase 3-C-28 第三節嚴格規範，**未重建資料庫、未重設 `c2k_test_app_runtime` 密碼、未修改任何現有角色權限**。

---

## 四、第一輪：`app-runtime.db.test.ts` 測試逐項結果

- **前置指令審查（依第四節要求）**：
  - 檢查 [`backend/package.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json#L19) 發現 `"test:db": "vitest run --no-file-parallelism tests/app-runtime.db.test.ts tests/integration.db.test.ts"` 內建兩個檔案路徑參數；若直接執行 `npm run test:db -- --run tests/app-runtime.db.test.ts`，npm 會把後面參數附加在 `integration.db.test.ts` 之後，導致兩支測試同時被執行。因此第一輪改以 `.\node_modules\.bin\vitest.cmd run --no-file-parallelism tests/app-runtime.db.test.ts` 精準單獨執行。
- **實際執行結果**：
  - **Exit Code `1`（Failed in `beforeAll`）**
  - **錯誤訊息**：`PrismaClientKnownRequestError` — `Raw query failed. Code: 28P01. Message: password authentication failed for user "c2k_test_app_runtime"`（位於 `tests/app-runtime.db.test.ts:56` `await prismaInstance.$queryRaw\`SELECT 1\``）。
  - **原因**：`c2k_test_app_runtime` 角色係於先前階段（Phase 3-C-18）以臨時隨機密碼建立且未保存於 `.env` 或專案檔案中；依 Phase 3-C-28 第三節規範本階段**不得重設既有角色密碼**，因此以測試環境變數連入 `127.0.0.1:5434` 時遭 PostgreSQL `scram-sha-256` 拒絕（`28P01`）。
- **8 項細部驗證狀態**：
  1. 專用角色登入成功：**FAIL（`28P01` 密碼驗證失敗）**
  2. 正向 DML 操作：**NOT TESTED**（因 `beforeAll` 失敗跳過 `3 skipped`）
  3. CREATE / ALTER / DROP 拒絕：**NOT TESTED**
  4. `AuditLog` SELECT / INSERT：**NOT TESTED**
  5. `AuditLog` UPDATE / DELETE / TRUNCATE 拒絕：**NOT TESTED**
  6. `_prisma_migrations` 權限：**僅於 `information_schema.role_table_grants` 靜態確認 `c2k_test_app_runtime` 無任何授權，執行期 SQL `NOT TESTED`**
  7. 跨使用者資料存取阻擋：**NOT TESTED**
  8. Prisma Client 與 Pool 關閉：`afterAll` 正常執行完畢且 Vitest 進程正常結束退出（Exit `1`，無掛起）。

---

## 五、第二輪：`integration.db.test.ts` 測試結果

- **執行狀態：`NOT TESTED`（未執行）**
- **原因**：依 Phase 3-C-28 第五節強制規定「若第一輪失敗，不得執行第二輪」，第一輪因 `28P01` 阻斷後立即停止，未執行 `integration.db.test.ts`。

---

## 六、AuditLog 權限驗收（唯讀資料庫檢查）

- 透過 `information_schema.role_table_grants` 唯讀確認 `c2k_test_app_runtime` 目前於 `code_to_know_test` 之授權：
  - `AuditLog`：**僅 `INSERT`、`SELECT`**（無 `UPDATE`、`DELETE`、`TRUNCATE`）
  - `_prisma_migrations`：**0 筆授權**
  - `User`：`SELECT`、`INSERT`、`UPDATE`、`DELETE`
- 實際執行期 `42501` 拒絕驗證因 Round 1 認證受阻而為 `NOT TESTED`。

---

## 七、資料清理與連線池關閉結果

- `app-runtime.db.test.ts` 在 `beforeAll` 失敗後觸發 `afterAll` 正常執行 `$disconnect()` 與 `pool.end()`，Vitest 未發生 hanging。
- 測試資料筆數完全未變（未寫入任何資料）。

---

## 八、測試前後資料完整性比較（`code_to_know_test`）

| 資料表 | 測試前筆數 | 測試後筆數 | 變化 |
|---|---|---|---|
| `User` | `0` | `0` | `0`（無遺留） |
| `AuditLog` | `16` | `16` | `0`（完整保留） |
| `TeacherApplication` | `0` | `0` | `0` |
| `Role` | `3` | `3` | `0` |

- PG16（`5432`）、PG17 歷史還原庫（`5433`）及 Supabase 均零連線、零異動。
- 測試容器 `code_to_know_pg17_phase3c18_audit` 與 Volume `code_to_know_pg17_phase3c18_audit_data` 已保留現場，未刪除。

---

## 九、Backend / Frontend 回歸測試結果

- 本階段未修改任何正式程式碼、測試檔或設定檔，因此沿用 Phase 3-C-27 已通過之離線驗收基線（`test:offline` `167 passed`、Backend `tsc` 通過、Frontend `7 passed` 與 `vite build` 通過）；實際資料庫回歸則為 `NOT TESTED`。

---

## 十、Git 與備份 SHA-256

- **Git 分支 / HEAD**：`main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無 Commit、Push、Reset 或 Clean。
- **原始備份 SHA-256（實測未變）**：
  - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 十一、未解決風險

1. **既有多階段隔離容器密碼不可知導致實測阻斷**：`code_to_know_pg17_phase3c18_audit` 內既有角色 `c2k_test_app_runtime` 採臨時隨機密碼建立且未保存；依「既有角色不得重設密碼」規範，無法以該角色連入完成實測。
2. **`package.json` `test:db` 腳本參數轉交問題**：`"test:db": "vitest run --no-file-parallelism tests/app-runtime.db.test.ts tests/integration.db.test.ts"` 在使用 `npm run test:db -- --run tests/app-runtime.db.test.ts` 時會連帶納入 `integration.db.test.ts`，無法單獨篩選單一測試檔。
3. **Round 1 與 Round 2 實機整合測試均尚為 `NOT TESTED`**。

---

## 十二、最終判定與後續建議

- **最終判定：`NO-GO`**
  - **判定依據**：第一輪 `app-runtime.db.test.ts` 於 `beforeAll` 即因 PostgreSQL `28P01`（`password authentication failed for user "c2k_test_app_runtime"`）失敗，第二輪 `integration.db.test.ts` 依規定未執行，實際執行期權限與交易整合測試皆尚未通過驗證。
- **建議解鎖方式（須待使用者明確授權後執行，本階段已停止）**：
  1. 授權對僅供測試之隔離容器 `code_to_know_pg17_phase3c18_audit`（Port `5434`）重設 `c2k_test_app_runtime` 臨時測試密碼（只用於單次測試指令行環境變數，不寫入 `.env` 亦不影響其他角色/權限），或授權重新建立專供本次測試使用的乾淨 PG17 隔離測試容器。
  2. （選配）若需支援 `npm run test:db -- tests/app-runtime.db.test.ts` 單檔執行，可將 `package.json` 的 `test:db` 拆分為 `test:db:app-runtime` 與 `test:db:integration`，或改用 `vitest run --no-file-parallelism` 不預先綁定雙檔路徑。
