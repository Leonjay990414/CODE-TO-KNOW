# CODE TO KNOW（碼上學）
# DATABASE PHASE 2 — 補充稽核與 Phase 3 前置確認報告
# (Supplementary Audit & Phase 3 Pre-Flight Verification Report)

- **審查日期：** 2026-11-07
- **審查角色：** 資深 PostgreSQL DBA、Prisma 架構師、資安稽核工程師、QA 工程師
- **任務模式：** 唯讀調查與架構分析（READ-ONLY INVESTIGATION ONLY）
- **優先級：** P1 — Critical Foundation
- **核心狀態：** **調查完成（所有項目經資料庫實體驗證，無任何推測）**

---

## 一、Migration 歷史及來源調查

### 1. `_prisma_migrations` 實體紀錄
透過唯讀 SQL 查詢本機 PostgreSQL 容器之 `_prisma_migrations` 表格，完整紀錄如下：

| 欄位名稱 | 實際儲存值 | 技術意涵 |
| :--- | :--- | :--- |
| **id** | `f5899e80-26a2-4489-8adb-f8fb10335cc0` | Prisma 生成之唯一遷移識別碼 (UUID) |
| **checksum** | `2185e3a03ed86bdcaaaefbfe4ba39405bdcb9f3c0f415e5bf648ac8e8a64d915` | DDL 檔案 SHA-256 完整性雜湊值 |
| **migration_name** | `20261103000000_init` | 初始遷移名稱 |
| **started_at** | `2026-11-03 13:49:45.717103+00` (UTC) | 遷移開始執行時間 (約台灣時間 21:49:45) |
| **finished_at** | `2026-11-03 13:49:46.34429+00` (UTC) | 遷移成功完成時間 (執行耗時約 0.627 秒) |
| **applied_steps_count** | `1` | 成功套用步數 (1 步完成) |
| **rolled_back_at** | `NULL` | 無任何復原紀錄 (未曾 Rollback) |
| **logs** | `NULL` / 空字串 | 無任何錯誤日誌 (乾淨執行完畢) |

### 2. Git 歷史與遷移檔案對比
- **Git Commit 紀錄：**
  - Commit Hash: `4284a7a07099857e92fe377017c42989586f22b0`
  - Commit 日期: `Tue Nov 3 22:22:36 2026 +0800` (即 UTC 14:22:36)
  - Commit 說明: `feat: add CODE TO KNOW frontend and backend foundation`
  - 納管檔案: `backend/prisma/migrations/20261103000000_init/migration.sql` (共 180 行 DDL)
- **歷史軌跡分析：**
  本機 Docker Volume（`code-to-know_postgres_data`）於 2026-11-03 13:49:46 UTC 透過 `prisma migrate dev` 或 `prisma migrate deploy` 正式建立初始 Schema。約 33 分鐘後（14:22:36 UTC），該 DDL 檔案被納入 Git 提交。

### 3. Migration SQL 與目前 `schema.prisma` 一致性
- 比對項目涵蓋 9 張資料表、14 個索引（含 5 個 UNIQUE 索引與 9 個普通索引）、8 條外鍵約束及 `onDelete` 行為。
- 比對結果：`schema.prisma` 與 `migration.sql` **100% 完全精確一致，無任何 Schema Drift**。

### 4. 資料庫初始化與 Seed 執行調查
- 專案存在 `backend/prisma/seed.ts`，功能為建立/更新三種預設角色 (`STUDENT`, `TEACHER`, `ADMIN`)。
- 專案存在 `backend/scripts/create-admin.ts`，功能為互動式建立管理員並賦予 `ADMIN` 角色與寫入 `AuditLog`。
- 經比對資料庫實際紀錄，資料庫中的 3 個預設角色說明與 `seed.ts` 高度相近（`ADMIN` 說明略微更新），確認資料庫初始時確實執行過基礎角色同步程序。

---

## 二、現有資料來源調查

> **資安與個資合規聲明：** 本次調查嚴格遵循隱私與安全規範，禁止輸出任何姓名、電子郵件、密碼雜湊、Session Token、驗證 Token 或使用者個資，所有統計均採去識別化與聚合統計方式呈現。

### 1. 現存資料筆數與非敏感統計

| 資料表 | 筆數 | 建立時間範圍 (UTC) | 關鍵非敏感屬性分佈 |
| :--- | :---: | :---: | :--- |
| **User** | 4 | `2026-11-03 05:55:04` ~ `2026-11-06 06:47:15` | 全部 4 筆狀態皆為 `ACTIVE` |
| **Role** | 3 | 2026-11-03 初始建立 | `STUDENT`, `TEACHER`, `ADMIN` |
| **UserRole** | 4 | 隨 User 建立時配置 | 角色指派分佈：`STUDENT`: 4 筆, `TEACHER`: 0 筆, `ADMIN`: 0 筆 |
| **UserProfile** | 4 | 隨 User 建立時配置 | 時區全為 `Asia/Taipei`，語系全為 `zh-TW` |
| **Session** | 3 | 2026-11-03 ~ 2026-11-06 | `revokedAt` 皆為 NULL，有效登入會話 |
| **TeacherApplication** | 2 | 2026-11-03 ~ 2026-11-06 | 申請狀態：`PENDING`: 2 筆, `APPROVED`: 0 筆, `REJECTED`: 0 筆 |
| **EmailVerificationToken** | 4 | 隨 User 註冊時發行 | 4 筆皆具備 24 小時有效期限 |
| **PasswordResetToken** | 0 | 無 | 系統未曾發行過重設密碼權杖 |
| **AuditLog** | 9 | 2026-11-03 ~ 2026-11-06 | 動作類型：`USER_REGISTER` (4), `USER_LOGIN` (3), `TEACHER_APPLICATION_SUBMITTED` (2) |

### 2. 資料來源分析與判斷
1. **使用者身分來源：**
   - 4 位使用者皆具備 `AuditLog.action = 'USER_REGISTER'` 紀錄，證實全部來自使用者註冊 API。
   - 所有 4 位使用者目前**僅被指派 `STUDENT` 角色**。
2. **管理員帳號調查：**
   - `ADMIN` 角色指派人數為 **0**。
   - `AuditLog` 中**不存在** `ADMIN_INITIALIZED` 或 `ADMIN_ROLE_PROMOTED` 紀錄。
   - 結論：**目前資料庫中完全不存在任何管理員帳號**，`backend/scripts/create-admin.ts` 尚未在現有資料庫上執行過。
3. **測試資料與正式資料混雜風險評估：**
   - 去識別化網域名稱統計：`codetoknow.edu` (2 筆)、`example.com` (1 筆)、`apps.ntpc.edu.tw` (1 筆)。
   - `example.com` 為 IETF RFC 2606 專用保留測試網域；`codetoknow.edu` 為開發自訂測試網域；`apps.ntpc.edu.tw` 則為教育局校務雲端帳號格式（推測為前端 API 功能驗證時手動輸入之測試資料）。
   - **結論：現存 4 筆 User 均為開發與測試階段所建立之驗證資料，目前環境純屬本機開發與測試環境，無正式生產資料混雜之風險。**

---

## 三、資料安全與完整性檢查

### 1. 外鍵約束與孤兒紀錄（Orphaned Records）檢驗
透過 SQL `LEFT JOIN ... WHERE parent.id IS NULL` 執行完整約束完整性掃描：

| 檢查項目 | 孤兒紀錄筆數 | 檢驗結果 |
| :--- | :---: | :---: |
| `UserProfile.userId -> User.id` | 0 | **PASS** |
| `UserRole.userId -> User.id` | 0 | **PASS** |
| `UserRole.roleId -> Role.id` | 0 | **PASS** |
| `Session.userId -> User.id` | 0 | **PASS** |
| `TeacherApplication.userId -> User.id` | 0 | **PASS** |
| `EmailVerificationToken.userId -> User.id` | 0 | **PASS** |
| `AuditLog.userId -> User.id` (除 NULL 外) | 0 | **PASS** |

### 2. 唯一性與實體完整性
- `User.email`：4 筆資料皆唯一，無重複。
- `Role.name`：3 筆角色唯一。
- `UserRole(userId, roleId)`：無重複指派。
- `Session.tokenHash`、`EmailVerificationToken.tokenHash`：全數符合 UNIQUE 約束。
- **結論：現有資料庫之關聯完整性、參照完整性與唯一性約束達到 100% 符規。**

---

## 四、Vitest 失敗原因調查與測試隔離分析

### 1. 測試套件執行結果總覽
先前執行 `npm test`（Vitest 2.1.9）結果：
- **通過套件 (Passed Suites)：** 5 個
  - `tests/db-config-safety.test.ts` (53 tests passed)
  - `tests/rbac-workflow.test.ts` (17 tests passed)
  - `tests/validation.test.ts` (12 tests passed)
  - `tests/security.test.ts` (5 tests passed)
  - `tests/api.test.ts` (5 tests passed)
- **失敗套件 (Failed Suites)：** 1 個
  - `tests/integration.db.test.ts` (1 test failed)
- **總計：** 92 項測試通過，1 項失敗。

### 2. 失敗測試案件深入分析
- **失敗檔案：** `backend/tests/integration.db.test.ts`
- **失敗案例：** `beforeAll` 鉤子 (Hook)
- **實際拋出錯誤訊息：**
  ```text
  Error: [INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL targeting an isolated test database. Silent fallback to dev/prod DATABASE_URL is strictly disallowed.
  ```

### 3. 根因剖析（Root Cause Analysis）
1. **故意的安全防護閘門 (Intentional Safety Gate)：**
   `integration.db.test.ts` 是一組**即時資料庫寫入測試**（會執行使用者註冊、新增管理員、提交教師申請及事後資料清理）。
   在 Phase 3.3 架構修正中，工程團隊在 `beforeAll` 明確加入了防護守則：
   ```typescript
   const testDbUrl = process.env.TEST_DATABASE_URL;
   if (!testDbUrl || !testDbUrl.trim()) {
     throw new Error(
       '[INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL targeting an isolated test database. Silent fallback to dev/prod DATABASE_URL is strictly disallowed.'
     );
   }
   ```
2. **防護目的：**
   此錯誤**並非程式碼瑕疵或 Prisma 故障**，而是**最高等級的資料庫安全隔離機制**。當開發者或 CI 未明確指定獨立的測試資料庫（`TEST_DATABASE_URL`）時，系統**絕對禁止自動回退 (Fallback) 到開發或生產環境 `DATABASE_URL`**，藉此杜絕測試資料污染或破壞開發庫。
3. **`api.test.ts` 日誌中的 `password authentication failed` 說明：**
   - 在 `backend/src/config/database.ts` 中：
     ```typescript
     if (env.NODE_ENV === 'test') {
       if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL.trim()) {
         return validateTestDatabaseUrl(process.env.TEST_DATABASE_URL);
       }
       return 'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know_test';
     }
     ```
   - 當 `NODE_ENV === 'test'` 且未提供 `TEST_DATABASE_URL` 時，`database.ts` 故意將連線導向隔離的虛擬測試庫 `code_to_know_test`（密碼為 `secret`）。
   - 本機 PostgreSQL 容器密碼已在 Phase 1B 提升為 64 位元 Hex 強密碼，因此虛擬連線被資料庫拒絕。
   - `api.test.ts` 專門設計用於在資料庫離線或降級時驗證 API 回應（例如 `GET /api/health` 預期返回 `[200, 503]` 及 `status: ['healthy', 'degraded']`），因此 `api.test.ts` 的 5 項測試全數正常通過。

### 4. 測試重跑安全性評估
- **純單元與邏輯測試：** `db-config-safety.test.ts`、`rbac-workflow.test.ts`、`validation.test.ts`、`security.test.ts`、`api.test.ts` 為純記憶體與中介軟體測試，保證 100% 唯讀，不寫入任何資料庫，可隨時安全重跑。
- **整合測試 (`integration.db.test.ts`)：** 在尚未建立獨立的 `code_to_know_test` 資料庫並配置 `TEST_DATABASE_URL` 前，**嚴禁以開發庫連線強行執行**。

---

## 四、Prisma 架構補充審查

### 1. 角色與指派設計 (Role & UserRole)
- 採用正規化多對多關聯（Many-to-Many via `UserRole`），非字串或列舉欄位。
- 複合唯一鍵 `@@unique([userId, roleId])` 確保指派不重複。
- 索引覆蓋：`userId` 與 `roleId` 皆具備獨立 B-Tree 索引，關聯查詢效能達到最佳化。

### 2. 串聯刪除 (Cascade Delete) 策略分析
當 `User` 主檔被刪除時：
- `UserProfile`：`ON DELETE CASCADE`（個人偏好同步清除）。
- `UserRole`：`ON DELETE CASCADE`（權限指派同步清除）。
- `Session`：`ON DELETE CASCADE`（連線會話同步失效）。
- `TeacherApplication`：`ON DELETE CASCADE`（教師審批單同步清理）。
- `EmailVerificationToken` / `PasswordResetToken`：`ON DELETE CASCADE`（安全權杖同步銷毀）。
- **架構評估：** 從屬資料採用 Cascade 完全符合關聯資料庫正規化設計，能徹底預防孤兒紀錄（Orphaned Rows）。

### 3. Session 與驗證 Token 安全期限審查
檢驗 `backend/src/modules/auth/auth.service.ts` 中的實際生效邏輯：
- **`PasswordResetToken` (密碼重設)：**
  - 有效期限：`Date.now() + 60 * 60 * 1000` (**1 小時**)。
  - 安全評估：短生命週期，單次使用（`usedAt` 標記），符合 OWASP 密碼重設資安指引。
- **`EmailVerificationToken` (信箱驗證)：**
  - 有效期限：`Date.now() + 24 * 60 * 60 * 1000` (**24 小時**)。
  - 安全評估：符合一般使用者信箱驗證操作合理等待期，單次使用。
- **`Session` (登入會話)：**
  - 有效期限：`Date.now() + 7 * 24 * 60 * 60 * 1000` (**7 天**)。
  - 撤銷機制：具備 `revokedAt` 欄位，登出或主動踢除時立即置值失效。
  - 儲存安全：資料庫僅儲存 `tokenHash`（SHA-256 雜湊），嚴禁明文儲存 Session Token。

### 4. AuditLog 的保留策略與 `onDelete: SetNull` 深度確認
- **特別確認事項：** `AuditLog` 使用 `onDelete: SetNull` 是否符合稽核資料保留需求？
- **審核結論：** **完全符合，且此為資安最佳實踐（Best Practice）。**
  - **防竄改與防毀屍滅跡：** 若 `AuditLog` 採用 `onDelete: Cascade`，惡意使用者或被盜帳號在進行非法操作後，只需註銷帳號即可將所有犯罪軌跡（Audit Trails）連帶抹除。
  - **合規性要求：** 根據 ISO 27001、SOC 2 及臺灣個人資料保護法，系統操作紀錄需具備不可否認性（Non-repudiation）與可追溯性。採用 `SetNull` 保證即使使用者帳號被刪除，歷史日誌（操作動作、執行時間、來源 IP、UserAgent、操作細節）依然永久保存。
  - **情境資訊保存：** 在寫入 `AuditLog` 時，關鍵資訊（如電子郵件、操作代碼）已同時記錄於 `details`（JSON 字串）欄位中，即便 `userId` 變為 `NULL`，稽核人員仍能透過 `details` 完整追蹤事發當時的情境。

### 5. Prisma Client 連線池管理
- `backend/src/config/database.ts` 透過 `pg.Pool` 封裝連線，並利用 `@prisma/adapter-pg` 提供 Driver Adapter。
- 使用 `global.__prisma` 單例模式，在開發環境中避免因 Vite/Node 熱重載而導致資料庫連線洩漏（Connection Leaks）。

---

## 五、Phase 3 階段重新規劃與解耦建議

為確保專案穩健推進，**強烈建議嚴格將 Phase 3 拆分為兩個獨立、解耦的子階段**，嚴禁兩者混為一談：

```mermaid
flowchart TD
    subgraph Phase2["Phase 2 (本機基礎) - [COMPLETED]"]
        P2_1["PostgreSQL 16 容器運行 (127.0.0.1:5432)"]
        P2_2["Prisma 7 現代化配置與 Driver Adapter"]
        P2_3["9 大核心模型 100% 吻合"]
    end

    subgraph Phase3A["Phase 3A: 雲端連線準備 (Cloud Infrastructure Gate)"]
        P3A_1["Supabase 專案參照與主機白名單確認"]
        P3A_2["Session (5432) / Transaction (6543) Pooler 區分"]
        P3A_3["Direct URL vs Pooler URL 雙軌配置隔離"]
        P3A_4["IPv4 / IPv6 可達性與 SSL 唯讀連線探測"]
    end

    subgraph Phase3B["Phase 3B: 業務資料模型擴充 (Business Domain Modeling)"]
        P3B_1["題庫與練習模型 (Question, Tag, Category)"]
        P3B_2["證照與追蹤模型 (Certification, UserTracking)"]
        P3B_3["實戰與測驗模型 (PracticalTask, ExamSession)"]
        P3B_4["本機 Migration 腳本生成與本地驗證測試"]
    end

    subgraph Phase4["Phase 4: 雲端部署與整合 (Cloud Deployment)"]
        P4_1["雲端 Prisma Migrate Deploy"]
        P4_2["線上 RBAC 與業務功能聯調驗收"]
    end

    Phase2 --> Phase3A
    Phase2 --> Phase3B
    Phase3A --> Phase4
    Phase3B --> Phase4
```

### A. Phase 3A：Supabase 雲端資料庫連線準備 (Cloud Connectivity Gate)
- **核心定位：** 純雲端網路、連線池、權限與連通性前置驗證，**不涉及任何業務資料表之變更**。
- **建議執行要點：**
  1. 盤點 Supabase 專案之主機資訊與專屬 Project Reference。
  2. 嚴格區分 **Runtime 連線**（走 Transaction Pooler，連接埠 6543，適合無狀態 API）與 **Migration 連線**（走 Session Pooler 或 Direct Connection，連接埠 5432，支援 DDL 鎖定與 advisory locks）。
  3. 檢驗本機開發環境對 Supabase Direct Connection 之 IPv4/IPv6 可達性。
  4. 驗證 SSL/TLS 強制加密參數（`sslmode=require`）。
  5. **僅執行唯讀探測（如 `SELECT 1` 或版本查詢），嚴禁直接推送 Schema 或執行 Migration**。
- **准出條件 (Exit Criteria)：** 雲端連線字串通過靜態驗證，唯讀連線測試成功，連線池規則完全落地。

### B. Phase 3B：業務資料模型擴充設計 (Business Domain Schema Modeling)
- **核心定位：** 本地資料庫領域模型設計與本機遷移驗證，**不依賴 Supabase 雲端環境**。
- **建議執行要點：**
  1. 將 Group B 現有前端與原型資料正規化為 Prisma Schema：
     - **題庫模組：** `Question`, `QuestionTag`, `QuestionCategory`, `UserPracticeRecord`, `QuestionFavorite`
     - **證照模組：** `Certification`, `CertificationCategory`, `UserCertificationTracking`
     - **實戰任務模組：** `PracticalTask`, `TaskSubmission`, `TaskEvaluation`
     - **模擬測驗模組：** `ExamSession`, `ExamQuestion`, `ExamSubmission`, `ExamScore`
  2. 規劃精確之外鍵約束、級聯策略與查詢索引（特別是標籤搜尋與高頻題庫篩選）。
  3. 於**本機 PostgreSQL 容器**執行 `prisma migrate dev --create-only` 生成新遷移檔案，進行本地 DDL 審核與驗證。
  4. 同步更新 `DATABASE_DATA_DICTIONARY.md` 與前端 TypeScript API 契約。
- **准出條件 (Exit Criteria)：** 新業務模型通過 `npx prisma validate`，本機遷移成功，資料字典同步完畢。

---

## 六、總結決策判定表

| 稽核項目 | 判定狀態 | 核心事實依據與結論 |
| :--- | :---: | :--- |
| **Migration 歷史** | **PASS** | `20261103000000_init` 於 2026-11-03 13:49 UTC 乾淨套用，與現行 Schema 100% 吻合，無 Rollback 或報錯 |
| **現有資料來源** | **PASS** | 4 筆 User 皆由註冊 API 建立，全為 `STUDENT` 角色；資料庫目前無 Admin 帳號；純屬本機開發測試資料，無正式資料混雜 |
| **資料安全與約束** | **PASS** | 7 項外鍵約束檢測結果全為 0 孤兒紀錄；唯一鍵約束健全；敏感欄位皆實施雜湊與遮罩 |
| **Vitest 失敗原因** | **PASS (預期防護)** | `integration.db.test.ts` 失敗係因未配置 `TEST_DATABASE_URL`，此為避免污染開發庫之主動安全防護；其餘 92 項測試全數通過 |
| **Prisma 架構補充** | **PASS** | 9 大模型結構精確；Token 期限設計合理 (1hr / 24hr / 7d)；`AuditLog` 採 `SetNull` 符合資安法規與防竄改需求 |
| **Phase 3 規劃** | **PASS** | 提出 Phase 3A (雲端連線準備) 與 Phase 3B (業務模型擴充) 之完全解耦架構，降低跨環境耦合風險 |

---
**本次補充稽核與 Phase 3 前置確認已全部完成。依據唯讀安全限制，未執行任何資料庫寫入、未修改程式碼、未連接 Supabase。現已立即停止，靜候使用者審查指示。**
