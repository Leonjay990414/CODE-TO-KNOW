# CODE TO KNOW｜Phase 3-C-29：PG17 隔離測試角色密碼修復與整合測試報告

- 執行日期：2026-11-12
- 階段定位：Phase 3-C-29（隔離 PG17 測試角色臨時密碼修復與雙輪實機整合測試）
- 執行原則：全程未操作 PG16（`5432`）、未操作 PG17 歷史還原庫（`5433`）、未連線 Supabase、未修改角色權限/RLS/`pg_hba.conf`、未執行 Migration、未寫入 `.env` 或任何專案檔密碼、未刪除任何 Docker 容器/Volume 或備份、未執行 Commit/Push/Deploy。

---

## 一、隔離容器與資料庫身分

| 項目 | 實查確認值 |
|---|---|
| **Docker 容器名稱** | `code_to_know_pg17_phase3c18_audit` |
| **Container ID** | `16bea6ce523cc37e5e1dc9ee05e7eb2981cce4d1c56b3a7f4d54bb908e2c7f66` (`16bea6ce523c`) |
| **Image / PostgreSQL 版本** | `postgres:17-alpine` / `PostgreSQL 17.11 on x86_64-pc-linux-musl` |
| **Port Mapping** | `127.0.0.1:5434->5432/tcp` |
| **專用 Volume** | `code_to_know_pg17_phase3c18_audit_data` |
| **資料庫名稱** | `code_to_know_test` |
| **測試角色** | `c2k_test_app_runtime`（`rolsuper=f`、`rolinherit=f`、`rolcreaterole=f`、`rolcreatedb=f`、`rolcanlogin=t`、`rolbypassrls=t`） |
| **非測試環境狀態** | PG16（`b7ec11c47db4`，`5432`）與 PG17 歷史還原庫（`08df84db262b`，`5433`）及 Supabase 均零接觸 |

---

## 二、臨時密碼重設結果

- 透過 Node.js `crypto.randomBytes(24).toString('base64url')` 於記憶體中產生高強度隨機臨時密碼。
- 透過 `docker exec -i code_to_know_pg17_phase3c18_audit psql -U postgres -d code_to_know_test` **標準輸入（stdin）** 執行單一 `ALTER ROLE c2k_test_app_runtime WITH PASSWORD ...` 指令，**未變更任何角色屬性、權限、`pg_hba.conf` 或 RLS Policy**。
- 密碼全程未輸出至終端、Log、報告或聊天內容，未放進命令列參數或 Shell History，亦未寫入 `.env` 或任何持久化檔案；測試進程結束後即自記憶體清除。

---

## 三、SCRAM 登入驗證結果

透過 `127.0.0.1:5434` 建立真實 TCP/SCRAM 連線驗證：
1. **正確臨時密碼登入**：成功連線，`SELECT current_user, current_database()` 回傳 `{"current_user":"c2k_test_app_runtime","current_database":"code_to_know_test"}`。
2. **錯誤密碼探測**：以錯誤密碼連線遭 PostgreSQL `scram-sha-256` 拒絕，回傳預期錯誤碼 **`28P01`**。

---

## 四、第一輪：`app-runtime.db.test.ts` 測試結果

- **執行指令**：於 `backend/` 目錄執行 `.\node_modules\.bin\vitest.cmd run --no-file-parallelism tests/app-runtime.db.test.ts`（僅於子行程環境注入 `NODE_ENV=test` 與 `TEST_APP_RUNTIME_URL`）。
- **實際結果**：**`Test Files 1 passed (1)`、`Tests 3 passed (3)`**（Exit Code `0`，0 skipped、0 failed）。
- **逐項驗證確認**：
  1. `c2k_test_app_runtime` 成功登入且確認 `rolsuper=false`、`rolcreatedb=false`、`rolcreaterole=false`、`rolbypassrls=true`：**PASS**。
  2. 正向 Auth 註冊、信箱驗證、`SUSPENDED` 帳號阻擋（`403 ACCOUNT_DISABLED`）、CSRF + Session、IDOR 跨帳號申請與查詢阻擋（`403 OWNERSHIP_FORBIDDEN`）、Admin 審批與 UUID 驗證（`400 VALIDATION_ERROR`）與 `AuditLog` 分頁查詢：**PASS**。
  3. 負向 `CREATE TABLE`、`ALTER TABLE`、存取/刪除 `_prisma_migrations`、`AuditLog` `UPDATE` / `DELETE` / `TRUNCATE` 全部回傳 PostgreSQL **`42501`**（`insufficient_privilege`），且錯誤訊息無密碼/連線字串洩漏：**PASS**。
  4. Prisma Client 與 `pg.Pool` 於 `afterAll` 正常關閉，行程完整退出：**PASS**。

---

## 五、第二輪：`integration.db.test.ts` 測試結果

- **前置條件**：第一輪完全通過後始執行第二輪。
- **執行指令**：於 `backend/` 目錄執行 `.\node_modules\.bin\vitest.cmd run --no-file-parallelism tests/integration.db.test.ts`（僅於子行程環境注入 `NODE_ENV=test` 與 `TEST_DATABASE_URL`）。
- **實際結果**：**`Test Files 1 passed (1)`、`Tests 1 passed (1)`**（Exit Code `0`）。
- **驗證確認**：
  - 連線經 `vi.hoisted` 與 [`validateIsolatedPg17TestUrl`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L114-L195) 驗證（Port `5434`、`code_to_know_test`、`c2k_test_app_runtime`），不讀取 `.env` 正式設定。
  - 全程使用合成測試帳號完成註冊 -> 教師申請 -> Admin 核准 -> `TEACHER` Role 與 `AuditLog` 寫入驗證。
  - `afterAll` 依追蹤之 `createdUserIds` 完成清理（不刪除 `AuditLog`），並正常關閉 `PrismaClient` 與 `pg.Pool`。

---

## 六、AuditLog 權限驗收

測試結束後再次透過 `information_schema.role_table_grants` 與 `pg_roles` 確認：
- `c2k_test_app_runtime` 屬性維持 `rolsuper=f, rolinherit=f, rolcreaterole=f, rolcreatedb=f, rolcanlogin=t, rolbypassrls=t`。
- `AuditLog` 授權維持僅 **`INSERT`、`SELECT`**（append-only）。
- `_prisma_migrations` 維持 **0 筆授權**。

---

## 七、測試前後資料筆數比較與清理結果

| 資料表（`code_to_know_test`） | 測試前筆數 | 測試後筆數 | 變化說明 |
|---|---|---|---|
| `User` | `0` | `0` | 本次建立的合成測試帳號已全部清理完畢 |
| `TeacherApplication` | `0` | `0` | 本次建立的測試申請已全部清理完畢 |
| `Role` | `3` | `3` | 系統角色數維持不變 |
| `AuditLog`（總筆數） | `16` | `27` | 新增 `11` 筆本次兩輪測試產生的 append-only `AuditLog` 紀錄 |
| `AuditLog`（測試前原有筆數） | `16` | `16` | `createdAt <= 2026-11-11 12:58:29.62` 原有 `16` 筆完整保留未刪改 |

---

## 八、Backend / Frontend 回歸測試結果

兩輪資料庫測試皆通過後，重新執行完整離線與建置回歸：

| 檢查項目 | 執行指令 | 實際結果 | Exit Code |
|---|---|---|---|
| Backend 離線測試 | `cd backend; npm.cmd run test:offline` | `Test Files 11 passed (11)`、`Tests 167 passed (167)` | `0` |
| Backend Build | `cd backend; npm.cmd run build` (`tsc`) | 通過，0 錯誤 | `0` |
| Frontend 測試 | `cd frontend; ..\backend\node_modules\.bin\vitest.cmd run tests/sources-route-protection.test.tsx` | `Test Files 1 passed (1)`、`Tests 7 passed (7)` | `0` |
| Frontend Build | `cd frontend; npm.cmd run build` (`tsc && vite build`) | `1612 modules transformed`，產出 `dist/` | `0` |

---

## 九、Git 與備份 SHA-256

- **Git 分支 / HEAD**：`main` @ `86a0f1116693bcce476b8747a446900d54b29a4a`，無 Commit、Push、Reset 或 Deploy；工作目錄僅於 `docs/` 新增本報告，未修改 `.env` 或程式碼。
- **Docker 容器與 Volume**：`code_to_know_pg17_phase3c18_audit` 與 `code_to_know_pg17_phase3c18_audit_data`（以及 PG16 `5432`、PG17 還原庫 `5433`）全部保留。
- **原始備份 SHA-256（實測未變）**：
  - `code_to_know_supabase_prod.dump`：`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`：`6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 十、未解決問題與風險

1. `backend/package.json` 的 `test:db` 腳本目前同時列出兩個檔案路徑，使用 `npm run test:db -- <單一檔案>` 時會帶出兩支檔案（本次已改用 `vitest` 單檔指令序列執行）；未來可視需要拆分為獨立 npm script。
2. 隔離測試容器內 `AuditLog` 因 append-only 設計新增了 `11` 筆測試紀錄（僅限於隔離測試庫 `code_to_know_test`），不影響 PG16、PG17 還原庫或 Supabase。

---

## 十一、最終判定

- **最終判定：`PASS`**
- **判定依據**：
  1. 臨時密碼安全產生與傳遞全程未落地、未外洩，SCRAM 正反登入驗證通過。
  2. 第一輪 `app-runtime.db.test.ts`（`3/3`）與第二輪 `integration.db.test.ts`（`1/1`）於隔離 PG17 容器（Port `5434`、`code_to_know_test`、`c2k_test_app_runtime`）全數實測通過。
  3. `AuditLog` append-only（`42501`）與最小權限維持不變，測試帳號完全清理，原有 `16` 筆 `AuditLog` 完整保留，前後端離線回歸與 Build 全數通過，PG16 / PG17 還原庫 / Supabase 零接觸。
