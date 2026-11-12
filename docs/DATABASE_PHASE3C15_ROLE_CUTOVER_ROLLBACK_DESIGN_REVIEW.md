# CODE TO KNOW｜Phase 3-C-15：資料庫角色切換與回滾方案唯讀定版審查

- **審查階段**：Phase 3-C-15：資料庫角色切換與回滾方案唯讀定版審查
- **審查日期**：2026-11-11（UTC+8）
- **審查性質**：**100% 唯讀分析與設計定版規劃**（未連線 Supabase、未建立/修改/刪除 PostgreSQL 角色、未執行任何 SQL 寫入/DDL/Migration、未修改任何 TypeScript/Prisma/SQL/PowerShell/Docker/Render/設定檔、未讀取或輸出任何密碼/Token/金鑰/連線字串、未執行 Git 寫入操作、未產生可直接執行之正式切換 SQL 檔案）
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **前序審查依據**：[`DATABASE_PHASE3C14_ROLE_RLS_REALTIME_FINAL_DESIGN_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C14_ROLE_RLS_REALTIME_FINAL_DESIGN_AUDIT.md)、[`DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C13_PG17_INDEPENDENT_INTEGRITY_AUDIT.md)

> **審查總結結論**：維持正式環境 **`NO-GO`（嚴格阻斷 `BLOCKED`）**。本報告僅提出角色設計定版規格、PG17 沙盒實測設計與待修補缺口清單，**尚未**於 Supabase 驗證或建立任何角色，且**不構成**任何可直接上線執行的正式成果。

---

## 1. LOGIN / NOLOGIN 矛盾分析（Section 三.A）

### 1.1 矛盾來源逐檔核對

經交叉比對專案既有文件與後端連線驗證程式，矛盾點精確如下：

| 來源檔案 | 針對 `migration_admin` 與 `app_runtime` 的定義 | 背景原因與潛在衝突 |
|---|---|---|
| [`DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C20_SQL_STATIC_SECURITY_REVIEW.md#L38-L61) | 兩者皆設計為 **`WITH LOGIN PASSWORD '...'`** | 對應後端與 Prisma CI/CD 各自獨立建立資料庫 TCP 連線的架構設計。 |
| [`DATABASE_PHASE3C4F_R14C21_PG17_SANDBOX_EXECUTION_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C21_PG17_SANDBOX_EXECUTION_REPORT.md#L71-L72) | 沙盒實測採 **`WITH NOLOGIN`** | 在 PG17 本機沙盒中係以 `postgres` 超級使用者登入後再 `SET ROLE`，因此測試時使用了 `NOLOGIN`。 |
| [`DATABASE_PHASE3C4F_R14C22_FINAL_SECURITY_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C22_FINAL_SECURITY_DECISION.md#L35) | 撰寫 `CREATE ROLE app_runtime WITH NOLOGIN ... BYPASSRLS;` | 直接沿用了沙盒測試 DDL 語法作為「正式切換修正草案」，卻未改回 `LOGIN`。 |
| [`DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md#L152-L155) | 兩角色皆寫為 **`WITH NOLOGIN`** | 與同段要求「僅透過 Pooler 以特定受控帳號登入」（L141）自相矛盾。 |
| [`DATABASE_PHASE3C4F_R14C06_RUNTIME_PERMISSION_FINAL_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R14C06_RUNTIME_PERMISSION_FINAL_AUDIT.md#L50-L97) | 未寫入 `CREATE ROLE` 語句，但假設 `app_runtime` 與 `migration_admin` 分別獨立連庫執行 | 實測區段同樣在 PG17 沙盒以 `SET ROLE test_app_runtime` 驗證 ACL，並未測試真實密碼登入。 |
| [`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L19-L405) | `APPROVED_PROD_RUNTIME_ROLE = 'app_runtime'`；`APPROVED_PROD_MIGRATION_ROLE = 'migration_admin'` | 程式碼強制要求 `DATABASE_URL` 用 `app_runtime` 登入、`DIRECT_URL`/`MIGRATION_DATABASE_URL` 用 `migration_admin`（或備援 `postgres`）登入。 |
| [`backend/src/config/database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L69-L97) | 以 `validateCloudRuntimeDatabaseUrl(env.DATABASE_URL)` 建立 `pg.Pool` 並傳給 `@prisma/adapter-pg` | 後端不以 `postgres` 登入後再執行 `SET ROLE app_runtime`，而是直接以 `DATABASE_URL` 的使用者身份認證。 |
| [`backend/prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts#L24-L28) | 透過 `resolveDatasourceUrl` 讀取 `DIRECT_URL` / `MIGRATION_DATABASE_URL` | Prisma Migrate CLI 直接以該連線字串之角色身份連線執行遷移。 |

### 1.2 關鍵設計分析與六大問題回答

1. **哪些角色需要 `LOGIN`？**
   - 依現行 [`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts) 與 [`prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) 之架構，**`postgres`、`migration_admin` 與 `app_runtime` 三者皆需要 `LOGIN`**，否則應用程式與 Prisma Migrate 將無法透過連線字串建立資料庫工作階段（`pg` 會回傳角色不允許登入錯誤）。
   - **不可只為求表面一致而直接宣稱 `LOGIN` 無風險**：改為 `LOGIN` 後，必須在 PG17 沙盒重測真實 TCP 密碼驗證與 Prisma 連線，且必須於 Supabase 驗證託管連線池是否容許自訂 `LOGIN` 角色。
   - **替代方案評估（為何先不採 `NOLOGIN` 群組角色 + `SET ROLE`）**：若將 `app_runtime`/`migration_admin` 保持為 `NOLOGIN` 權限包，則必須另建可 `LOGIN` 的成員帳號並在每次連線或交易下達 `SET ROLE`——不僅與現行 `db-validation.ts`（僅核准角色名 `app_runtime` / `migration_admin`）不相容，且若在 Transaction Pooler (Port 6543) 誤用會造成會話角色切換失效或連線狀態殘留風險。

2. **哪些角色只負責物件所有權？**
   - **`migration_admin` 同時承擔雙重職責**：它既是 `public` Schema、37 張資料表、Sequences（目前 0 個）與 `AnnouncementStatus` Enum 的 **Object Owner**，亦是執行 CI/CD `prisma migrate deploy` 的 **連線登入角色（須為 `LOGIN`）**。
   - 若誤將 `migration_admin` 設為 `NOLOGIN`，則只有在由 `postgres` 登入並手動 `SET ROLE migration_admin` 時才能執行遷移，這將使 `prisma migrate deploy` 搭配 [`prisma.config.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts) 與 `MIGRATION_DATABASE_URL` 無法自動化運行，也迫使 CI/CD 繼續持有過度授權的 `postgres` 憑證。

3. **Prisma Migration 如何取得必要權限？**
   - 在 PostgreSQL 中，執行 `ALTER TABLE`、`DROP INDEX`、`ALTER TYPE`、`CREATE TABLE` 等 DDL 不只要有 `public` Schema 的 `CREATE` 權限，**目標舊物件的 Owner 必須就是執行遷移的角色本身（或具備 `SUPERUSER`）**。
   - 因此方案規劃 `migration_admin` 具備：（a）`LOGIN` 屬性；（b）`USAGE, CREATE ON SCHEMA public`；（c）`public` Schema 及內部全體表/Sequence/Enum 之 Owner 身分；（d）連線至支援 Session-level `pg_advisory_lock` 的通道（Port 5432）。

4. **Runtime 如何透過 Supabase Pooler 登入？**
   - [`db-validation.ts:355-387`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L355-L387) 規定當主機為 `aws-0-ap-southeast-2.pooler.supabase.com` 時，連線使用者名稱格式必須為 `<role>.<project_ref>`，即 **`app_runtime.ypibmyfxfhsyfdwxprpi`**，並透過 Supavisor（Port `5432` Session Mode 或 `6543` Transaction Mode）驗證密碼後連線至 `postgres` 資料庫。

5. **`app_runtime.<project_ref>` 的登入相容性目前有哪些證據？**
   - **僅有本機程式碼格式校驗與文件架構推論，雲端實際認證證據為 `0`**：
     - 程式碼層面：[`db-config-safety.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/db-config-safety.test.ts) 僅驗證字串解析規則是否放行 `app_runtime.ypibmyfxfhsyfdwxprpi` 與 `migration_admin.ypibmyfxfhsyfdwxprpi`。
     - 先前雲端連線證據：[`DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md#L40-L43) 顯示過去唯一連線過正式 Supabase Pooler 的帳號是原廠預設 **`postgres.ypibmyfxfhsyfdwxprpi`**，從未測試過 SQL 自建帳號 `app_runtime` 或 `migration_admin` 是否能成功通過 Supabase Supavisor 認證。

6. **哪些結論只是設計假設，尚未經正式 Supabase 驗證？**
   - 以下皆屬**未經正式 Supabase 驗證之設計假設**：
     1. 透過 `postgres` 執行 `CREATE ROLE app_runtime WITH LOGIN PASSWORD ...` 後，**Supavisor 是否能即時識別並允許 `app_runtime.ypibmyfxfhsyfdwxprpi` 登入**（部分託管 Proxy 環境需特定角色或驗證機制同步，如 Supabase Auth/Supavisor 對 `pg_authid` SCRAM-SHA-256 的讀取與快取行為，若未實測存在無法透過 Pooler 認證的風險）。
     2. 在 Supabase 原生保留 `postgres` / `authenticator` / `supabase_admin` 等系統控制下，`postgres` 角色本身是否有權限執行 `ALTER SCHEMA public OWNER TO migration_admin;` 與 `ALTER TABLE ... OWNER TO migration_admin;` 而不受託管權限限制（Supabase 中若非 `supabase_admin`，對 `public` Schema 或含事件觸發器的 DDL 是否會遇到 permission denied，尚未實測）。
     3. **`rls_auto_enable` Event Trigger**（由 `postgres` 或 `supabase_admin` 擁有）在 `migration_admin`（`NOSUPERUSER`）執行未來 `CREATE TABLE` Migration 時是否能無錯觸發並正常完成。
     4. Port `6543`（Transaction Pooler）搭配 Prisma `@prisma/adapter-pg` + `pg.Pool` 是否需要調整 prepared statements / connection 參數（文件曾警告未配置相關相容設定恐出現 `prepared statement` 錯誤）。

---

## 2. 最終角色權限矩陣（Section 三.B）

> **重要聲明**：下表所列之 `migration_admin` 與 `app_runtime` 權限屬於**設計定版目標規格（規劃值）**；目前 Supabase 正式環境**尚未建立此二角色、尚未執行權限移轉與 REVOKE**，所有欄位不得視為雲端既定事實。

| 項目 | `postgres`（Supabase 原廠管理員） | `migration_admin`（DDL 與結構遷移） | `app_runtime`（Express API 執行期） |
|---|---|---|---|
| **LOGIN** | **規劃／現況：`LOGIN`**（Supabase 預設登入管理者；不應置於 Render Runtime）。 | **規劃：`LOGIN`（須設定強密碼）**<br>理由：`prisma.config.ts` 與 `DIRECT_URL` 需直接登入；尚待糾正 R14-C-2-2 的 `NOLOGIN` 誤寫並實測 Supabase Pooler 登入。 | **規劃：`LOGIN`（須設定強密碼）**<br>理由：`database.ts` `pg.Pool` 需以 `app_runtime` 直接認證；**尚未於 Supabase Supavisor 實測自訂角色登入**。 |
| **SUPERUSER** | **現況：Supabase 託管最高權限帳號**（具備 `CREATEROLE`/`CREATEDB`/`BYPASSRLS` 等雲端管理者權限）。 | **規劃：`NOSUPERUSER`**<br>理由：僅需管理 `public` 物件，無需跨系統 Schema 或伺服器級系統權限。 | **規劃：`NOSUPERUSER`**<br>理由：最小權限核心防線，阻絕任何提權與系統目錄篡改。 |
| **CREATEDB** | **現況：允許**（雲端託管權限內）。 | **規劃：`NOCREATEDB`**<br>理由：`prisma migrate deploy` 僅在既定 `postgres` 庫套用遷移，不建 Shadow DB（R14-C-0.5 已修訂移除）。 | **規劃：`NOCREATEDB`**<br>理由：應用程式不應建立資料庫。 |
| **CREATEROLE** | **現況：允許**（由其建立並管理 `migration_admin` 與 `app_runtime`）。 | **規劃：`NOCREATEROLE`**<br>理由：遷移流程不應動態建立或修改資料庫角色與密碼。 | **規劃：`NOCREATEROLE`**<br>理由：防範遭 SQL 注入時建立後門帳號。 |
| **BYPASSRLS** | **現況：具備／可繞過 RLS**（Superuser/Owner 特性）。 | **規劃：`NOBYPASSRLS`**<br>理由：身為 `public` 下物件之 **Owner**，未啟用 `FORCE ROW LEVEL SECURITY`（目前 0/37）時對自身物件天然免受 RLS 阻擋；不應具備對其他系統 Schema 的全域 `BYPASSRLS`。 | **規劃（暫定待補條件）：`BYPASSRLS`（或維持 NO-GO 直至補齊應用層防護）**<br>理由：37 表全開 `ENABLE ROW LEVEL SECURITY` 且 `0` 條 Policies；無 `BYPASSRLS` 將被預設拒絕。但啟用前必須滿足第 3 節原則與第 7、8、10 節全部前置修補及實測；`BYPASSRLS` 不影響 Table ACL。 |
| **Schema 所有權** | **現況：`public` 及託管系統 Schema Owner**；**規劃切換後**：保留系統 Schema（`auth`/`storage`/`realtime`/`extensions` 等），不再擁有業務 Schema `public`。 | **規劃：`public` Schema Owner（兼 `USAGE, CREATE`）；嚴禁授權任何非 `public` 系統 Schema**。<br>風險：`postgres` 在 Supabase 是否有權轉移 `public` Schema Owner **尚未於雲端實測**。 | **規劃：非 Owner；僅獲 `USAGE ON SCHEMA public`，顯式 `REVOKE CREATE ON SCHEMA public`**。<br>理由：允許查詢現有表/型別，徹底阻絕自建表、檢視表或函式。 |
| **Table 權限** | **現況：目前全部 37 張 `public` 表之 Owner**；規劃切換後應從應用與遷移路徑徹底撤除。 | **規劃：全部 37 張 `public` 表之 Owner（含 `_prisma_migrations` 與未來新增業務表）**。<br>理由：PostgreSQL 規定只有 Owner 能對既有表執行 `ALTER TABLE`/`DROP`。 | **規劃：僅 35 張一般業務表具備 `SELECT, INSERT, UPDATE, DELETE`**（註：37 表扣除 `_prisma_migrations` 與 `AuditLog`）。<br>理由：支撐後端 CRUD；無 `TRUNCATE`/`REFERENCES`/`TRIGGER` 與任何 DDL 權限。 |
| **Sequence 權限** | **現況：管理者**（目前 `public` 實測 0 個 Sequence）。 | **規劃：所有 `public` Sequences 之 Owner**。<br>風險：因目前全庫主鍵皆 UUIDv4（0 Sequences），此項屬前瞻性設計，**含非零 Sequence 情境尚未實測**。 | **規劃：`USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public`（嚴格排除 `UPDATE`）**。<br>理由：R14-C-2-2 審查確認 `UPDATE` 會開放 `setval()` 製造主鍵碰撞 DoS；Prisma 自增僅需 `USAGE`。 |
| **Type 權限** | **現況：`AnnouncementStatus` Owner**。 | **規劃：`public` 自訂 Enum（目前僅 `AnnouncementStatus`）之 Owner**。<br>理由：PG17 沙盒已實測轉移主 Enum 會同步轉移衍生陣列 `_AnnouncementStatus`，使未來 `ALTER TYPE` 可行。 | **規劃：`USAGE` on `public` Types（無擁有權、無 `ALTER`/`CREATE TYPE`）**。<br>理由：允許在 `Announcement` 等欄位正常寫入與查詢列舉值。 |
| **`AuditLog` 權限** | **現況：Owner（尚未受限）**；未來仍具最高管理能力。 | **規劃：`AuditLog` 表 Owner（保留完整所有權以供架構遷移）**。<br>風險提醒：因此 `AuditLog` **非**對所有角色絕對不可變。 | **規劃：顯式 `GRANT SELECT, INSERT` 並 `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog"`**。<br>定性：**Runtime Append-only**（PG17 沙盒已驗證 ACL 阻斷生效；正式庫**尚未實裝**；`User` 物理刪除仍會觸發 `ON DELETE SET NULL`）。 |

*(註：另對 `public."_prisma_migrations"` 規劃嚴格隔離：`migration_admin` 為 Owner、`app_runtime` 執行 `REVOKE ALL` 零權限。另建議兩新建角色均顯式加上 `NOINHERIT NOREPLICATION` 並禁止加入 `postgres`/`migration_admin` 成員關係。)*

---

## 3. BYPASSRLS 最終風險評估（Section 三.C）

### 3.1 現行架構隔離覆蓋率盤點（事實核對）

- **Prisma Schema 全量模型**：[`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma) 共計 **36 個業務模型**（對應 PG17 沙盒驗證之 `public` Schema **37** 張表扣除 `_prisma_migrations` 遷移紀錄表）。
- **已實作後端 API 端點**：[`app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts) 僅掛載 `/api/health`、`auth`（8 端點）、`teachers`（2 端點）、`admin`（4 端點），合計 **15 個端點**。
- **已觸及模型（9 個）**：`User`、`Role`、`UserRole`、`UserProfile`、`Session`、`EmailVerificationToken`、`PasswordResetToken`、`TeacherApplication`、`AuditLog`。
- **尚未實作模型（27 個）**：`Announcement`、`AnnouncementRead`、`Certification`、`Subject`、`Question`、`QuestionOption`、`QuestionTag`、`QuestionTagRelation`、`CertificationEnrollment`、`UnitProgress`、`WrongQuestionRecord`、`QuestionBookmark`、`StudyTimeLog`、`TeacherProfile`、`Class`、`ClassEnrollment`、`ClassAssignment`、`PracticalTask`、`PracticalStep`、`PracticalProgress`、`PracticalStepProgress`、`ExamPaper`、`ExamAttempt`、`ExamAnswerSnapshot`、`AIChatSession`、`AIChatMessage`、`StudentWeaknessAnalysis`。
- **AuthN / AuthZ Middleware**：[`authenticate.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts) 驗證 Cookie + SHA-256 Session + 過期/撤銷/`deletedAt`/`SUSPENDED`/`DISABLED`；[`authorize.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authorize.ts) 驗證角色並分離 `ADMIN`/`PLATFORM_ADMIN` 與 `SYSTEM_OPERATOR`。
- **IDOR 與管理端缺口**：現存 15 個後端端點無一般使用者 `:id` IDOR 查詢；但（1）`admin.routes.ts` 缺 `validateParams(applicationIdParamSchema)` 與 `/audit-logs` 分頁上限；（2）**0 個通用資料所有權 Helper**；（3）**0 個針對真實 Express HTTP + PostgreSQL + `app_runtime` 的負向 IDOR 自動化測試**（`rbac-workflow.test.ts` 為純記憶體 Mock，`integration.db.test.ts` 僅測單一正向流程且非 `app_runtime` 連線）；（4）前端 `App.tsx` `#sources` 仍無保護。

### 3.2 方案 A vs 方案 B 深度比較表

| 比較構面 | 方案 A：不使用 `BYPASSRLS`，採用 RLS Policy | 方案 B：使用 `BYPASSRLS`，由 Express 後端負責完整授權 |
|---|---|---|
| **1. 資料隔離能力** | **雙層縱深防禦（強）**：即使後端漏寫 `where: { userId }`，資料庫核心仍依 `current_setting('app.current_user_id')` 強制過濾列。 | **單層防禦（高度依賴程式碼正確性）**：資料庫完全略過 RLS；任何一處 API 漏寫擁有權驗證即直接引發跨使用者 IDOR 外洩。 |
| **2. 開發複雜度** | **極高**：（a）Express 自建 HttpOnly Cookie Session，未使用 Supabase GoTrue JWT，無法直接套用 `auth.uid()`；（b）須重寫 Prisma `$extends` 對**所有查詢包裹互動式交易**並注入 `SET LOCAL`；（c）須為 36 張表設計、撰寫並同步維護所有學生/教師/管理員 RLS Policy（包含多對多關聯如 `ClassEnrollment`）。 | **低至中**：符合現行 Express + Prisma Client 寫法，無需交易包裹或 Session 變數注入，可正常使用 `pg.Pool` 與 Prepared Statements。 |
| **3. 維護難度** | **高**：（a）Supabase `ensure_rls` 會在每次新增表自動啟用空 RLS，未同步補 Policy 即刻全表拒絕服務（停機風險）；（b）跨海互動式交易（`BEGIN` + `set_config` + Query + `COMMIT`）在 Render 美國與 Supabase 雪梨（~150-180ms RTT）間恐倍增請求延遲，且若混用 Session/Tx Pooler 處理不慎恐引發**跨租戶會話變數污染**。 | **中**：無 Pooler 會話變數污染與延遲倍增問題；但維護重心轉移至「強制 Code Review 與自動化負向權限測試」。 |
| **4. 未來新增模型時的風險** | **可用性中斷風險大**：開發 27 個模型或新增表時，若 Migration 未附帶完整 RLS Policy，`ensure_rls` 會觸發預設拒絕；若寫錯 Policy 條件，也可能發生遞迴查詢效能雪崩或隱蔽放行。 | **資安越權風險極大**：未來實作剩餘 **27 個含敏感學習/考試/班級/AI 資料之模型** 時，只要任一端點未檢查 `userId` 或 `Class.creatorId === req.user.id`，就無第二道防線補救。 |
| **5. 自動化測試需求** | 除 Express HTTP 測試外，尚須大量撰寫 PostgreSQL Policy 單元驗證測試、Transaction Pooler 會話隔離壓力測試。 | **強制門檻極高**：必須在開發 27 個模型前建置「通用 Ownership Helper」與「針對每一條新舊路由、以真實 `app_runtime` 連線執行的 HTTP 跨用戶（學生A/學生B、教師A/教師B、未登入/一般用戶打管理路由）負向 IDOR CI 阻斷測試」。 |
| **6. 適合目前 CODE TO KNOW 的程度** | **現階段實作相容性低**：專案目前無 Supabase Auth、無 `$extends`、無任何 Policy、後端跨區連線延遲敏感。 | **架構相容性較高，但現行安全配套尚未達標**：雖然先前文件傾向方案 B，但**目前僅完成 9/36 模型、缺乏共用所有權守衛、缺乏 `app_runtime` 負向 IDOR 測試且尚存既有缺陷**。 |

### 3.3 方案裁定與保留 `NO-GO` 理由

- **目前裁定**：**對立即將方案 B（或方案 A）正式上線切換，均維持 `NO-GO`**。
- **保留 `NO-GO` 依據**：在架構路線上，方案 B 雖與現行 Express + Prisma 架構最契合，但方案 B 成立的絕對前提是「後端授權護欄、測試防線與待修補缺陷已到位」；現有證據不足以證明未來 27 個模型與既有小缺口已具備安全防護，因此**不強行放行上線**。

---

## 4. SQL 切換順序設計（Section 三.D，步驟 1 ～ 9，純設計規格／不含可執行正式 SQL）

> **嚴格遵照本階段規範**：本節（第 4 節）與第 5 節僅提出階段性架構與控制設計（包含前置條件、預期結果、驗證方式、失敗處理與授權邊界），**不產生、不提供可直接執行之正式切換或回滾 `.sql` 腳本檔案**。

#### 步驟 1：角色建立順序（以 `postgres` 身分執行）
- **設計內容**：先檢查角色是否已存在；依最小權限原則依序建立 `migration_admin`（屬性：`LOGIN`、`NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`、`NOBYPASSRLS`、`NOINHERIT`、`NOREPLICATION`，設定高強度密碼）與 `app_runtime`（屬性：`LOGIN`、`NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`、`BYPASSRLS`、`NOINHERIT`、`NOREPLICATION`，設定獨立高強度密碼）。確認不授予兩者任何彼此成員關係或 `postgres` 成員關係，並授與 `postgres` 資料庫之 `CONNECT` 權限。
- **前置條件**：（1）已取得最新正式切換前加密備份並於 PG17 沙盒還原驗收完成；（2）已在 PG17 沙盒驗證過 `LOGIN` 模式下之相同建立設計；（3）密碼已存放於本機安全保險庫且不進 Git。
- **預期結果**：`pg_roles` 存在該兩角色且屬性旗標完全符合第 2 節矩陣；`pg_auth_members` 確認無多餘權限繼承。
- **驗證方式**：唯讀查詢 `pg_roles`（檢查 `rolcanlogin`, `rolsuper`, `rolcreatedb`, `rolcreaterole`, `rolbypassrls`, `rolinherit`, `rolreplication`）與 `pg_auth_members`。
- **失敗處理**：若 Supabase 託管環境拒絕部分屬性（如特定屬性需調整）或語法報錯，立即中止後續步驟並執行回滾（若角色尚未持有任何物件，僅收回資料庫連線權限並刪除已建立的單一測試角色）。
- **是否需要使用者另外授權**：**是**（正式環境操作須單獨授權）。

#### 步驟 2：Schema 與物件所有權轉移
- **設計內容**：嚴格將範圍限定於 **`public` Schema**（絕對不觸碰 `auth`、`storage`、`realtime`、`extensions`、`graphql`、`vault` 等系統 Schema），動態列舉所有既有物件並轉移 Owner 至 `migration_admin`：（a）`public` 下全部 **37 張資料表**（含業務 36 表與 `_prisma_migrations`）；（b）`public` 下所有 **Sequences**（目前 0 個，保留邏輯確保前瞻相容）；（c）`public` 下所有使用者定義 **Enum / Composite Types**（目前為 `AnnouncementStatus`，PostgreSQL 將自動連動 `_AnnouncementStatus` 陣列型別）；（d）`public` Schema 本體之 Owner 轉移至 `migration_admin`。並先對 `migration_admin` 確認持有 `USAGE, CREATE ON SCHEMA public`。
- **前置條件**：步驟 1 成功，且無殘留其他自訂業務物件卡在非預期 Schema 中。
- **預期結果**：`pg_tables`、`pg_sequences`、`pg_type` 與 `pg_namespace` 中 `public` 範圍內所有開發/遷移物件的 Owner 全數為 `migration_admin`，`postgres` 與 `app_runtime` 名下於 `public` 的業務物件計數皆為 `0`。
- **驗證方式**：針對 `pg_tables`、`pg_sequences`、`pg_type`（`typtype IN ('e','c')`）及 `pg_namespace` 執行 Owner 統計斷言查詢（預期剩餘非 `migration_admin` 物件數 = `0`）。
- **失敗處理**：若 Supabase 託管環境因系統權限限制而無法將 `public` Schema 本體或特定物件之 Owner 由 `postgres` 移轉為 `migration_admin`，**立即中止切換**並執行第 5 節所有權反向歸還與受控回滾，不可半途維持半套授權。
- **是否需要使用者另外授權**：**是**。

#### 步驟 3：Table 權限配置
- **設計內容**：先確認顯式 `REVOKE CREATE ON SCHEMA public FROM app_runtime` 並授予 `USAGE ON SCHEMA public TO app_runtime`（若需防止一般匿名角色誤取權限，亦須檢查 `PUBLIC` 角色是否具有多餘 `CREATE` 或資料表預設授權）。接著針對 `public` 下全部資料表授予 `app_runtime` 基本 DML（`SELECT, INSERT, UPDATE, DELETE`），再立即執行「步驟 6」收回特權表權限（特別是 `_prisma_migrations` 執行 `REVOKE ALL`）。
- **前置條件**：步驟 2 所有權轉移驗證通過；無活躍長事務鎖住資料表 DDL。
- **預期結果**：`app_runtime` 僅對 35 張一般業務表具備 `SELECT, INSERT, UPDATE, DELETE`，對 `_prisma_migrations` 不具備任何權限（`SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER` 全為 false）。
- **驗證方式**：使用 PostgreSQL 內建權限查詢函式 `has_schema_privilege` 與 `has_table_privilege` 對全數 37 張表進行自動化矩陣檢查。
- **失敗處理**：立即收回對 `app_runtime` 的全部 `public` Schema / Table 權限並視狀況進入全量受控回滾。
- **是否需要使用者另外授權**：**是**。

#### 步驟 4：Sequence 權限配置
- **設計內容**：針對 `public` 下所有既有 Sequences，規劃僅授予 `app_runtime` **`USAGE, SELECT`**，**嚴格不授予 `UPDATE`**（防止潛在 `setval()` 碰撞攻擊）。
- **前置條件**：步驟 2 完成；目前專案 `public` Sequences 數為 0，步驟仍須內建動態迴圈/批次規則以維持完整性。
- **預期結果**：若未來或異動後存在 Sequence，`has_sequence_privilege('app_runtime', ..., 'UPDATE')` 必為 `false`，僅 `USAGE` 與 `SELECT` 為 `true`。
- **驗證方式**：查詢 `information_schema.sequences` / `pg_sequences` 並搭配 `has_sequence_privilege` 驗證。
- **失敗處理**：收回多餘 Sequence 權限；若無法修正則回滾。
- **是否需要使用者另外授權**：**是**。

#### 步驟 5：Type 權限配置
- **設計內容**：確保 `app_runtime` 對 `public` 下自訂 Enum 型別（`AnnouncementStatus`）及未來新增 Enum 具備 `USAGE` 權限，無 `CREATE` 或擁有權。
- **前置條件**：步驟 2 已將 `AnnouncementStatus` Owner 轉交 `migration_admin` 且 `app_runtime` 已獲 `public` Schema `USAGE`。
- **預期結果**：`app_runtime` 能讀寫包含 `AnnouncementStatus` 欄位（`DRAFT`, `PUBLISHED`, `ARCHIVED`）之 `Announcement` 資料列，但嘗試 `ALTER TYPE` 會被拒絕。
- **驗證方式**：查詢系統目錄 `has_type_privilege('app_runtime', 'public."AnnouncementStatus"', 'USAGE')`（預期 `true`），並在沙盒測試以 `app_runtime` 寫入/讀取及嘗試 `ALTER TYPE` 失敗。
- **失敗處理**：檢查 Type Owner 與 `public` Schema `USAGE`；異常則執行受控回滾。
- **是否需要使用者另外授權**：**是**。

#### 步驟 6：`AuditLog` 權限配置（不可與步驟 3 脫鉤）
- **設計內容**：接續步驟 3，在同一授權單元/原子交易塊內顯式對 `public."AuditLog"` 執行 `REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;`（以及確保不具備 `REFERENCES`/`TRIGGER`），僅保留 `SELECT` 與 `INSERT`（同時於 `_prisma_migrations` 執行 `REVOKE ALL`）。
- **前置條件**：步驟 3 剛授予全表 DML，必須**同交易緊接執行**不可有時間空窗。
- **預期結果**：`app_runtime` 對 `AuditLog` 僅 `SELECT`/`INSERT` 為 `true`，`UPDATE`/`DELETE`/`TRUNCATE` 皆為 `false`。
- **驗證方式**：查詢 `has_table_privilege('app_runtime', 'public."AuditLog"', ...)` 五項操作，並於沙盒驗證負向 DML 拋出 `permission denied`。
- **失敗處理**：若驗證顯示 `UPDATE` 或 `DELETE` 仍為 `true`，禁止進入步驟 8/9 及禁止啟用 Runtime，立即再次收回並追查是否來自 `PUBLIC` 或群組繼承權限。
- **是否需要使用者另外授權**：**是**。

#### 步驟 7：Default Privileges 配置
- **設計內容**：以 `migration_admin` 身分（關鍵：必須指定 `FOR ROLE migration_admin IN SCHEMA public`）宣告未來新增物件的預設授權：（a）`TABLES` 自動授 `SELECT, INSERT, UPDATE, DELETE` 給 `app_runtime`；（b）`SEQUENCES` 自動授 `USAGE, SELECT` 給 `app_runtime`（**絕不含 `UPDATE`**）；（c）`TYPES` 自動授 `USAGE` 給 `app_runtime`。**注意營運規範**：未來若有新增稽核性質不可修改資料表，該 Migration SQL 結束前須額外補上 `REVOKE UPDATE, DELETE`。
- **前置條件**：步驟 2 已將 `migration_admin` 設為未來所有 Migration 的執行者。
- **預期結果**：`pg_default_acl` 內精確存在對應 `migration_admin` 在 `public` Schema 的 3 筆規則（Tables/Sequences/Types）。
- **驗證方式**：查詢 `pg_default_acl` 驗證建立者角色 OID、Schema OID 與授權遮罩。
- **失敗處理**：使用對應 `ALTER DEFAULT PRIVILEGES ... REVOKE ALL` 清除錯誤規則並重新審查。
- **是否需要使用者另外授權**：**是**。

#### 步驟 8：Runtime 連線驗證（先沙盒、未來授權後始於雲端）
- **設計內容**：以獨立測試程序使用 `app_runtime` 真實帳號密碼連線資料庫（沙盒驗證直連；雲端須透過 Supavisor Session Pooler Port 5432 檢查 `app_runtime.<project_ref>`），確認連線字串通過 `validateCloudRuntimeDatabaseUrl`＋Root CA 驗證，並執行唯讀 `SELECT 1`、讀取業務表、受控測試寫入/回滾業務資料（或檢查拒絕 `UPDATE AuditLog` / `SELECT _prisma_migrations` / `CREATE TABLE`）。
- **前置條件**：步驟 1～7 全數驗證通過；對應憑證已依安全規範備妥。
- **預期結果**：認證成功、TLS 驗證通過、`AuditLog` 與 `_prisma_migrations` 與 DDL 操作精確遭拒、`SHOW current_user` 為 `app_runtime`。
- **失敗處理**：**此步為最常見的雲端風險閘門**——若 Supavisor 拒絕 `app_runtime.<project_ref>` 登入，Render 仍維持尚未切換（零中斷影響），直接啟動第 5 節受控回滾並檢討雲端角色認證方案。
- **是否需要使用者另外授權**：**是**。

#### 步驟 9：Migration 連線驗證
- **設計內容**：以 `migration_admin` 真實帳號密碼透過 `DIRECT_URL` / `MIGRATION_DATABASE_URL`（Port 5432，通過 `validateMigrationDatabaseUrl`）執行唯讀態樣檢查（如 `prisma migrate status`），並在沙盒驗證「建立一張含 Enum 或外鍵的新測試表再卸除」時，能取得 `pg_advisory_lock`、正確觸發 Supabase `rls_auto_enable` 事件觸發器（不因非 Superuser 而失敗），且新表能依步驟 7 Default Privileges 被 `app_runtime` 存取。
- **前置條件**：步驟 8 通過；確認 Port 5432 Session 模式正常運作。
- **預期結果**：`prisma migrate status` 顯示現有 2 筆遷移同步無誤、無 Pending/Drift；沙盒實測建表＋Default Privileges＋`rls_auto_enable` 皆正常。
- **失敗處理**：若 `migration_admin` 因 `rls_auto_enable` Event Trigger 或鎖權限失敗，立即停用 `migration_admin` 並執行第 5 節受控回滾歸還 Owner 至 `postgres`。
- **是否需要使用者另外授權**：**是**。

---

## 5. SQL 回滾順序設計（Section 三.D，步驟 10 ～ 12，防護機制與純設計規格）

#### 步驟 10：受控回滾順序（7 階段反向程序）
1. **應用層先行降載／切回**：若 Runtime 已切換，先將應用流量或服務恢復至切換前核准狀態，確保無業務流量持續依賴即將刪除的角色。
2. **終止殘留會話（Connection Termination）**：透過 `postgres` 連線查詢 `pg_stat_activity`，僅終止資料庫內使用者名稱為 `app_runtime` 或 `migration_admin` 的後端連線（排除自身 `pg_backend_pid()`），消除物件鎖定競爭。
3. **收回 Default Privileges**：針對 `FOR ROLE migration_admin IN SCHEMA public`，依序執行 `REVOKE ALL` 撤銷 `TABLES`、`SEQUENCES`、`TYPES` 給予 `app_runtime` 的預設權限，並檢查 `pg_default_acl` 清零。
4. **收回既有物件與資料庫層級 GRANT**：先撤銷 `app_runtime` 與 `migration_admin` 在 `public` Schema、全部 Tables、Sequences、Functions、Types 上的授權，再撤銷資料庫層級 `CONNECT` / `ALL PRIVILEGES`。
5. **所有權安全反向歸還（Ownership Reversion Loop）**：僅限 `public` Schema，透過動態檢索將目前由 `migration_admin` 或 `app_runtime` 擁有的 Tables、Sequences、使用者定義 Types（含 Enum）與 `public` Schema 本體之 Owner 逐一改回 **`postgres`**。
6. **執行步驟 11 所有權與跨庫依賴斷言檢查**（必須確認全數歸零）。
7. **安全刪除角色**：僅在步驟 6 全數為 `0` 後，始執行 `DROP ROLE app_runtime;` 與 `DROP ROLE migration_admin;`。

- **前置條件**：保留原始 `postgres` 管理員緊急通道有效；已確認非系統必需物件被外部表單參照。
- **預期結果**：兩角色徹底移除、37 張業務表／Enum／資料筆數完整無損且 Owner 全數回歸 `postgres`、`pg_default_acl` 無殘留。
- **驗證方式**：核對 `pg_roles`（0 筆）、`pg_default_acl`（0 筆）、`public` 37 表數量與核心 `COUNT(*)` 未變動。
- **失敗處理**：若因殘留活躍連線或漏轉物件導致 `DROP ROLE` 報錯（PostgreSQL 原生依賴保護會直接阻擋刪除），**嚴禁繞過檢查強刪**，應重查 `pg_stat_activity` 與 `pg_shdepend` 找出漏網物件手動歸還 `postgres` 後再重試。
- **是否需要使用者另外授權**：**是**（正式環境執行回滾需授權操作）。

#### 步驟 11：角色刪除前的所有權與依賴檢查
- **設計內容**：在任何 `DROP ROLE` 之前，執行雙重系統目錄斷言檢查（Assertion Queries）：
  1. **跨資料庫全域依賴表（`pg_shdepend`）**：查詢 `pg_shdepend JOIN pg_roles` 過濾 `rolname IN ('app_runtime', 'migration_admin')`，必須精確回傳 **0 rows**（涵蓋物件所有權 `'o'`、ACL 授權 `'a'` 與預設權限 `'i'`）。
  2. **本庫多物件實質統計**：分別檢查 `pg_tables`（`tableowner`）、`pg_sequences`（`sequenceowner`）、`pg_type`（`typowner`）、`pg_class`（`relowner`，涵蓋 view/index/sequence/table）、`pg_proc`（`proowner`）與 `pg_namespace`（`nspowner`），合計必須為 **0**。
- **前置條件**：已完成步驟 10 前 5 項收回與所有權歸還。
- **預期結果**：所有斷言計數嚴格等於 `0`。
- **驗證方式**：將斷言查詢納入自動化腳本或維護驗收檢核點，非 `0` 直接失敗中止。
- **失敗處理**：依 `pg_shdepend.classid::regclass` 與 `objid` 定位未解除授權或未轉回的殘留物件（例如某個曾由 `migration_admin` 新建的檢視表或大物件），逐項收回/移轉給 `postgres` 後重測。
- **是否需要使用者另外授權**：查詢本身屬唯讀前置門檻，與回滾授權綁定。

#### 步驟 12：避免 `DROP OWNED BY` 誤刪資料的保護措施
- **設計內容（強制禁止清單）**：
  1. **明文全面禁用 `DROP OWNED BY`**：在所有設計規格、維運 Runbook 與未來腳本模板中**徹底刪除 `DROP OWNED BY app_runtime` / `DROP OWNED BY migration_admin`**。因 PG17 沙盒（R14-C-0.6）已實測證實：若漏轉任一張表的 Owner，`DROP OWNED BY` 不僅清除權限，還會**直接對該角色擁有的資料表執行永久 `DROP TABLE` 毀滅資料**。
  2. **改用「顯式迴圈移轉 + `pg_shdepend` 零依賴斷言 + 原生 `DROP ROLE`」**：刻意利用 PostgreSQL 原廠 `DROP ROLE` 當仍有依賴或所有權存在時會「主動拋錯拒絕刪除」的Fail-Safe 特性，把漏網風險轉為安全的報錯中斷，而非靜默刪表。
  3. **禁用 `REASSIGN OWNED BY postgres`**：因 `postgres` 亦持有 Supabase 系統擴充與雲端內部物件，絕不可全域 `REASSIGN OWNED BY postgres`，所有正向轉移必須以 `schemaname = 'public'` 為邊界迴圈處理。
- **前置條件**：審查所有未來切換／回滾腳本均須檢查不得出現 `DROP OWNED` 或 `REASSIGN OWNED BY postgres` 字樣。
- **預期結果**：回滾期間 0% 風險發生「因所有權尚未移回而連帶刪除業務表與真實資料」。
- **驗證方式**：靜態檢查禁止關鍵字，並在 PG17 沙盒模擬「刻意漏轉 1 張表 Owner 時執行 `DROP ROLE` 必須安全報錯拒絕、表與資料完整存活」。
- **失敗處理**：若發現任何檔或人員指令試圖使用 `DROP OWNED BY`，無條件駁回並凍結執行權限。
- **是否需要使用者另外授權**：屬架構安全鐵律，無條件強制適用。

---

## 6. Supabase Pooler 相容性評估（Section 三.E）

依專案已保存之技術架構分析與程式碼證據（[`DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md)、[`DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md)、[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)、[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)），不連線 Supabase 核對如下：

| 評估項目 | 已有技術證據與設計規格 | 關鍵限制與未經正式雲端測試部分 |
|---|---|---|
| **Session Pooler (5432) vs Transaction Pooler (6543)** | **5432 (Session Mode)**：一條客戶端連線綁定一條後端 PG 連線直到斷線，支援 `pg_advisory_lock`、Prepared Statements 與 IPv4 連線。<br>**6543 (Transaction Mode)**：每筆交易完成即歸還實體連線，適合極高併發無狀態短查詢，但**不支援 Session Advisory Locks**，且使用 Prisma / `node-postgres` 時若啟用 Prepared Statements 需特別相容處理（[`DATABASE_CONNECTION_STRATEGY.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_CONNECTION_STRATEGY.md#L142) 曾記錄未相容時會出現 `Prepared statement "s0" already exists` 風險）。 | 正式 Supabase 上 Port `6543` 搭配 `@prisma/adapter-pg` 的長期高併發相容性**尚未於雲端實測**。目前設計優先建議 Runtime 與 Migration 均走 **Session Pooler (Port 5432)**。 |
| **Migration 與 Runtime 是否需要不同連線？** | **絕對需要分離**：[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L178-L210) 在 Migration 模式明文阻擋 Port `6543` 與 `app_runtime` 角色（需 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL`，允許 Port `5432`）；[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L69-L70) 在 Production Runtime 僅讀取 `DATABASE_URL` 並鎖定 `app_runtime`（阻擋 `postgres` 與 `migration_admin`）。此外 Free Tier 直連端點 `db.ypibmyfxfhsyfdwxprpi.supabase.com` 僅具原生 **IPv6**（`DATABASE_PHASE3C3B` 記錄本機 IPv4 無法直連），因此 IPv4 環境下兩者通常同指 `aws-0-ap-southeast-2.pooler.supabase.com:5432`，但**憑證（角色）與環境變數（`DATABASE_URL` vs `DIRECT_URL`）嚴格分離**。 | 若未來從 Render 連線，需實測確認 Render 容器之出網 IPv4/IPv6 拓撲以及 Session Pooler (5432) 在 Free Tier 最大連線配額（預設 `pg.Pool max=10`，多實例擴展恐超標，見 [`DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md#L154-L175)）。 |
| **自訂資料庫角色登入方式（`role.<project_ref>`）** | [`db-validation.ts:356-387`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L356-L387) 強制 Pooler 使用者名稱採 `<role>.<project_ref>`（`app_runtime.ypibmyfxfhsyfdwxprpi`、`migration_admin.ypibmyfxfhsyfdwxprpi`）。 | **重大未知（尚未於雲端測試）**：過去 Supabase 雲端僅實測過原廠 **`postgres.ypibmyfxfhsyfdwxprpi`**；Supavisor 對透過 SQL `CREATE ROLE` 手動新增的非內建角色能否正常進行多租戶名稱路由與 SCRAM 密碼認證，**完全沒有本專案實測證據**。另 `db-validation.ts` 中若 URL `parsed.username` 為空，會跳過角色字串檢查（微幅邊界缺口）。 |
| **TLS `verify-full` 與 CA 驗證** | [`database.ts:22-58,83`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L22-L83) 在 `production` 強制載入 [`backend/certs/prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)（1,367 bytes）並設定 `rejectUnauthorized: true`、不覆寫 `checkServerIdentity`；[`database-ssl-config.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/database-ssl-config.test.ts) 7 項離線測試已驗證 X509 `CN=Supabase Root 2021 CA` 與 SAN 主機名比對行為。 | 1. 該 7 項測試為離線模擬，**Supabase Pooler 實機 TLS 握手與 CA 信任鏈（特別是 AWS Sydney Pooler 憑證對該 CA 檔）尚未以現有 `database.ts` 程式碼實測**。<br>2. [`db-validation.ts:435-440`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L435-L440) 接受 `sslmode=require | verify-full | verify-ca`；但需注意部分版本的 `pg-connection-string` 對連線字串內 `?sslmode=require` 的解析可能與 `PoolConfig.ssl` 互動覆寫，必須在實機確認。<br>3. `validateMigrationDatabaseUrl`（L113-227）**未檢查 `sslmode` 參數**，且 `prisma.config.ts` 未主動注入 `prod-supabase-ca.crt` 路徑。 |

---

## 7. 應用程式授權缺口盤點（Section 三.F）

針對 Phase 3-C-14 識別出的 7 項關鍵應用程式缺口，依現況精確列管如下（本階段僅盤點，**未做任何程式碼修改**）：

| # | 問題項目與原始碼位置 | 是否已實作 | 是否已有測試 | 是否需要修補 | 技術說明與風險影響 |
|---|---|---|---|---|---|
| **1** | [`admin.routes.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L21-L33) 未掛載 [`applicationIdParamSchema`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.schema.ts#L13-L15) | **已定義 Schema，但路由未掛載**（`approve` 與 `reject` 僅掛了 `validateBody`） | **無**（無測試驗證非法 `:id` 格式攔截） | **需要（P0）** | 非 UUID 的 `:id` 會直接進入 Prisma `findUnique`；建議補掛 `validateParams(applicationIdParamSchema)`，並建議於服務層禁止管理員自審。 |
| **2** | `GET /api/admin/audit-logs` 分頁與 `limit` 上限（[`admin.routes.ts:36`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts#L36)、[`admin.controller.ts:68-82`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.controller.ts#L68-L82)） | **尚未實作分頁驗證與上限** | **無** | **需要（P0）** | 控制器直接 `parseInt` 讀取未驗證 `req.query.page`/`limit`，傳入 `?limit=abc` 會產生 `NaN` 導致 Prisma 報錯，傳入極大值（如 `99999999`）則引發大表掃描 DoS 風險；同理 [`listApplicationsQuerySchema`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.schema.ts#L7-L11) 亦欠缺 `min(1)`/`max(100)` 邊界限制。 |
| **3** | [`auth.service.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L248-L376) `verifyEmail` / `resetPassword` 之 `deletedAt` 與 `SUSPENDED` 狀態檢查 | **尚未實作**（`login` L127 與 `requestPasswordReset` L297 有檢查，但 `verifyEmail` L251 與 `resetPassword` L336 遺漏） | **無** | **需要（P0）** | 若已申請驗證/重設 Token 的帳號隨後被管理員停權（`SUSPENDED`/`DISABLED`）或軟刪除（`deletedAt !== null`），使用者仍可透過舊 Token 改寫信箱驗證狀態或重設密碼（雖無法繞過登入封鎖，但違反狀態一致性）。 |
| **4** | 前端 [`App.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L81-L82) `#sources`（`import-system`）路由保護 | **尚未實作**（`case 'import-system'` 未包裹 `<ProtectedRoute>`，對應 DEF-01） | **無自動化測試覆蓋**（已有先前手動稽核報告證實存在此漏洞） | **需要（P1，上線業務前必補）** | 任何未登入訪客或一般學生直連 `#sources` 即可存取題庫管理與匯入頁面（[`DEF-01`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/POST_DATABASE_DEFERRED_TASKS.md#L16)）；另 `#teacher-dashboard` 仍存在 `TEACHER`/`ADMIN` 角色混用（DEF-04）及靜態學生假名冊（DEF-03）。 |
| **5** | 通用資料所有權檢查 Helper（如 `assertOwnership` / Tenant Scope） | **完全尚未實作**（全 `backend/src/` 檢索 0 筆） | **無** | **需要（P1，開發剩餘 27 模型前必備）** | 在 `app_runtime WITH BYPASSRLS` 架構下，PostgreSQL 不替業務表執行列級隔離；若無可複用 Helper 與統一規範，後續開發班級、考試、錯題、AI 助教等 27 模型極易出現 IDOR 漏洞。 |
| **6** | 使用 `app_runtime` 權限執行的 HTTP 負向 IDOR 測試 | **完全尚未實作**（`rbac-workflow.test.ts` 為純記憶體 Mock；`integration.db.test.ts` 未用 `app_runtime` 亦無跨租戶負向 HTTP 測試） | **無** | **需要（P1，建置後納入 CI 必過閘門）** | 唯有以 `app_runtime` 身分透過真實 Express App + 真實 PG17 DB 執行跨使用者讀寫（預期 `403`/`404`）及 `UPDATE AuditLog` 拒絕對照測試，才能驗證「應用層隔離 + Table ACL」雙防線真實有效。 |
| **7** | `AuditLog` 操作者快照完整性（[`auth.service.ts:273,312,365`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/auth/auth.service.ts#L273-L372)） | **部分欠缺**（`USER_REGISTER`、`USER_LOGIN`、`TEACHER_APPLICATION_*` 均有 `details`，唯 `EMAIL_VERIFIED`、`PASSWORD_RESET_REQUESTED`、`PASSWORD_RESET_COMPLETED` 無 `details`） | **無** | **建議修補（P1）** | 若未來發生任何造成 `User` 被刪除、觸發 `ON DELETE SET NULL` 將 `AuditLog.userId` 置空的情境，這 3 類資安事件將遺失操作帳號識別軌跡（建議寫入 `userId`/去識別帳號摘要快照，避免依賴外鍵單點追蹤）。 |

*(補充註記：[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L354) 中對 `parsed.username` 若為空字串或未帶帳號的容錯邊界，亦可一併納入後續後端修補清單以達 100% 嚴格失敗關閉 `fail-closed`。)*

---

## 8. PG17 沙盒測試計畫（下一階段經授權後執行方案）

在觸碰 Supabase 正式環境之前，下階段若獲授權修改本地測試/腳本，必須先在本地隔離容器 **`code_to_know_pg17_restore_sandbox`（127.0.0.1:5433）** 上建立**獨立於 `code_to_know_c2kb_prod_restore_clean_v2` 之外的新測試庫（或複製基準庫，保留原 11/12/13 驗收庫完好不動）**，執行下列 6 項「真實 `LOGIN` 閉環實測」：

| 測試項 | 測試設計內容 | 驗證目標與嚴格通過準則 |
|---|---|---|
| **SBX-01：`LOGIN` 模式切換執行驗證** | 以 `postgres` 執行設計定版之 7 步切換（使用 `WITH LOGIN PASSWORD`，含 `BYPASSRLS` 與明確 `NOINHERIT NOREPLICATION`），將 `public` Schema、37 表與 `AnnouncementStatus` 移交 `migration_admin`。 | `pg_roles`、`pg_tables`、`pg_type`、`pg_namespace` 與 `pg_default_acl` 全數吻合第 2 節矩陣，錯誤數 = `0`。 |
| **SBX-02：真實 `app_runtime` TCP `LOGIN` 與 ACL 負向實測** | **不使用 `SET ROLE`**，直接以 `postgresql://app_runtime:<pw>@127.0.0.1:5433/<sandbox_db>` 由 Node `pg.Pool` / Prisma Client 連線，實測 Express 認證/教師/管理員流程與邊界攔截。 | 1. 業務 CRUD 與 `AuditLog` `INSERT`/`SELECT` 全部成功。<br>2. 嘗試 `UPDATE/DELETE/TRUNCATE "AuditLog"` 必回 `permission denied`。<br>3. 嘗試讀取 `_prisma_migrations` 或執行 `CREATE TABLE` 必回 `permission denied`。<br>4. 嘗試 `SET ROLE migration_admin` / `postgres` 必被拒絕。 |
| **SBX-03：真實 `migration_admin` `LOGIN` 與 `rls_auto_enable` 模擬實測** | **不使用 `SET ROLE`**，直接以 `postgresql://migration_admin:<pw>@127.0.0.1:5433/<sandbox_db>` 執行 `prisma migrate status` 並測試新增一張含新 Enum 與自增 Sequence（或一般欄位）之暫時遷移表（含模擬 `ensure_rls` Event Trigger 觸發）。 | 1. 遷移命令能取得 `pg_advisory_lock` 並正常完成。<br>2. 確認非 Superuser 的 `migration_admin` 建立新表時，Supabase 結構之 `rls_auto_enable` 不會報錯失敗。<br>3. 新表與新 Sequence 自動依 `DEFAULT PRIVILEGES` 授權給 `app_runtime`（且 `app_runtime` 對新 Sequence 僅有 `USAGE, SELECT`，無 `UPDATE`）。 |
| **SBX-04：應用程式修補後 HTTP + DB 負向 IDOR 整合測試** | 完成第 7 節後端修補後，於 `app_runtime` 連線環境執行擴充版 `integration.db.test.ts` + HTTP `supertest`。 | 驗證 `approve`/`reject` 拒絕非法 UUID、`audit-logs` 拒絕無效/過大 `limit`、`verifyEmail`/`resetPassword` 阻擋已停權帳號，以及跨角色 `403`/`401` 全數精確攔截。 |
| **SBX-05：7 步受控回滾與 `DROP OWNED` 防護驗證** | 對完成測試的沙盒庫執行 7 步受控回滾設計，另刻意測試「若有 1 張表忘記轉回 `postgres`」情境。 | 1. 漏轉情境下 `DROP ROLE` 必須報錯阻止而非刪表，資料完整無損。<br>2. 完整歸還 Owner 後，`pg_shdepend` 檢驗為 `0 rows`，`DROP ROLE` 乾淨成功，37 張原表與資料保持完整。 |
| **SBX-06：回滾後再重套切換之冪等性複測** | 確認回滾完畢的沙盒庫可乾淨執行一次重新切換而無殘留衝突。 | 二次切換與驗證結果與第一次完全一致。 |

---

## 9. 正式環境操作風險總覽

若在現況未修補下貿然進入正式 Supabase 或 Render 操作，將面臨以下具體高風險：

1. **`NOLOGIN` 誤設導致服務全線無法登入**：若依 R14-C-2-2 舊草案執行，後端與遷移工具皆無法建立資料庫連線。
2. **Supavisor 自訂角色認證未知風險**：`app_runtime.ypibmyfxfhsyfdwxprpi` 與 `migration_admin.ypibmyfxfhsyfdwxprpi` 從未在 Supabase 雲端實測透過 `aws-0-ap-southeast-2.pooler.supabase.com` 登入；託管連線池可能不允許未經平台註冊的自訂 PG 角色直接通過代理認證，甚至影響後續連線方案選型。
3. **Supabase 託管 `public` Schema Owner 與 Event Trigger 權限相容風險**：Supabase 內部有 `supabase_admin` 等託管機制，在雲端環境將 `public` Schema Owner 從 `postgres` 轉出給非 Superuser 的 `migration_admin`，以及 `migration_admin` 觸發 `rls_auto_enable` 時是否完全比照本機 Docker PG17 無阻礙，**尚未經過驗證**。
4. **`BYPASSRLS` 單點隔離失誤風險**：27 個業務模型尚未開發、無通用所有權守衛、無負向 IDOR 自動化測試；一旦以 `BYPASSRLS` 上線後持續疊加新功能，單次邏輯疏漏即直接發生跨使用者資料外洩。
5. **Free Tier 連線數與跨區延遲風險**：[`database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L81-L86) 尚未顯式設定 `pg.Pool` `max`/`idleTimeoutMillis`/`connectionTimeoutMillis`（隱性依賴預設 `max: 10`、`connectionTimeoutMillis: 0`），Render 多實例水平擴展或遇到跨區網路震盪時存在打滿連線上限或請求無限掛起風險。
6. **未實作真實發信（`DisabledEmailProvider`）與既有前端 `#sources` 漏洞**：正式環境註冊驗證與重設密碼目前無法寄信（[`email.provider.ts:32-55`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/services/email.provider.ts#L32-L55)），且 `#sources` 與假名冊尚未收斂。

---

## 10. 下一階段必要前置條件

在任何正式環境（Supabase / Render）授權啟動前，必須按先後順序依賴達成下列全部條件：

1. **前置組 A（程式碼與設計修復 — 授權本機修改後執行）**：
   - 修補第 7 節列管之 P0/P1 應用程式授權、參數檢驗、帳號狀態檢查與 `#sources` 路由守衛缺口。
   - 建立後端通用資料所有權檢查設計規範／Helper，以及以 `app_runtime` 連線執行之 HTTP 負向 IDOR 整合測試骨架。
   - 將經靜態核對一致的切換設計與 7 步受控回滾設計定版為受控版本資產（須經人工複核無 `NOLOGIN`、無 `UPDATE ON SEQUENCES`、無 `DROP OWNED BY`）。
2. **前置組 B（PG17 沙盒真實 `LOGIN` 驗收 — 授權本機沙盒操作後執行）**：
   - 依第 8 節完成 `SBX-01` ~ `SBX-06` 全數通過（特別是**不用 `SET ROLE`，全程以真實 `LOGIN` 帳密測試 Prisma Client 與 Prisma Migrate**）。
3. **前置組 C（正式雲端安全與備份前提 — 須使用者逐項單獨簽發授權）**：
   - 確認正式主金鑰保管與復原卡已完成就緒；取得授權後重新連線 Supabase 拉取切換前**最新即時加密備份**並於 PG17 沙盒驗收通過（SHA-256＋結構＋筆數 100% 一致）。
   - 先單獨授權一項最小化唯讀連線測試：**驗證 Supavisor Pooler 是否確實支援自訂 PostgreSQL `LOGIN` 角色認證與 `ALTER SCHEMA public OWNER TO migration_admin` 相容性**，確認通過後方可授權正式角色切換。
   - 取得正式 Render 環境變數寫入、連線檢查（TLS CA 握手、`/api/health`、`AuditLog` Runtime Append-only 驗證）與故障回滾維護窗口授權。

---

## 11. 最終 GO / CONDITIONAL GO / NO-GO 判定

### 最終判定：**`NO-GO`（正式環境角色切換與 Render 上線維持嚴格阻斷）**

#### 嚴格符合 Phase 3-C-15 完成條件聲明

1. **本階段未宣稱**正式 Supabase 已完成角色驗證（所有自訂角色建置、Supavisor `app_runtime.<project_ref>` 登入、`migration_admin` Owner 轉移與 `rls_auto_enable` 雲端行為均標記為**尚未測試／尚未授權**）。
2. **本階段未宣稱** `BYPASSRLS` 已可安全上線（雖方案 B 維護性優於方案 A，但因 27/36 業務模型尚未實作、缺通用所有權守衛、缺 `app_runtime` 負向 IDOR 整合測試且存在 P0 應用缺口，故維持 **`NO-GO`**）。
3. **本文件純屬唯讀定版設計與缺口盤點**，絕不等同於已產生可直接上線之正式 DDL 執行成果，亦未對程式碼、SQL、測試資料庫、PG16、PG17、Docker、Render、Supabase 或 Git 做任何寫入。
4. **未解決清單明確保留**：包含 `LOGIN` 模式下之 PG17 沙盒真實認證測試、Supavisor 自訂角色認證相容性、7 項應用程式授權與檢驗缺口、業務 27 模型資料隔離建設，以及切換前最新雲端即時加密備份。

---

*本階段已完成 Phase 3-C-15 資料庫角色切換與回滾方案唯讀定版審查並立即停止，未執行任何寫入或正式環境操作；等待使用者審閱本報告並決定是否授權下一階段之「本機程式碼缺口修復與 PG17 沙盒 `LOGIN` 實測」。*
