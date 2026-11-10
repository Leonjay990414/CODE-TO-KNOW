# CODE TO KNOW｜RLS 與 BYPASSRLS 最終安全設計審查報告
# 資料庫正式收尾 Phase 2：正式環境存取控制架構與安全權衡最終確認

**文件編號**：C2K-DOC-DB-PHASE2-RLS-REVIEW-01  
**審查日期**：2026-11-10  
**審查角色**：資深 PostgreSQL DBA、Supabase 資料庫資安架構師、Prisma 全端架構師  
**審查性質**：100% 唯讀安全審查（未連線雲端、未修改資料庫、未執行寫入或 Git 變更）  
**審查基準**：
- `backend/prisma/schema.prisma`（37 張資料表完整定義與關聯）
- 後端 Express 認證、授權中間件與已實作模組原始碼（`backend/src/`）
- `docs/DATABASE_PHASE3C4F_R14C21_ROLE_PERMISSION_TEST_MATRIX.md`
- `docs/DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md`
- `docs/DATABASE_PHASE3C4F_FINAL_COMPLETION_INVENTORY.md`
- Supabase 官方架構規格與 PostgreSQL 17 核心權限規格

---

## 目錄

- [一、審查目標與核心爭點說明](#一審查目標與核心爭點說明)
- [二、實際檢查的檔案與 API 範圍](#二實際檢查的檔案與-api-範圍)
- [三、目前資料存取控制的實務證據](#三目前資料存取控制的實務證據)
- [四、BYPASSRLS 的本質與安全風險深度分析](#四bypassrls-的本質與安全風險深度分析)
- [五、NOBYPASSRLS 與 RLS Policies 方案可行性評估](#五nobypassrls-與-rls-policies-方案可行性評估)
- [六、兩種核心方案完整比較矩陣](#六兩種核心方案完整比較矩陣)
- [七、最終推薦架構方案與技術理由](#七最終推薦架構方案與技術理由)
- [八、正式環境實作前的必要測試項目](#八正式環境實作前的必要測試項目)
- [九、下一階段進入判定與建議結論](#九下一階段進入判定與建議結論)

---

## 一、審查目標與核心爭點說明

在先前的 `PHASE 3C-4F-R14-C-2-1` 本機沙盒演練與 `R14-C-2-2` 審查中，我們確認了：
1. Supabase 雲端環境具備內建 Event Trigger `ensure_rls`，會對任何新建立的 public 資料表自動啟用 Row-Level Security（RLS，`relrowsecurity = true`）。
2. 目前 Prisma Schema 遷移產生的 37 張資料表均無定義任何 Row-Level Policy（`pg_policies` 共有 0 列政策）。
3. 當執行期角色 `app_runtime` 具備 `NOBYPASSRLS` 時，PostgreSQL 觸發核心規範的 **DEFAULT DENY ALL**，導致後端 API 的所有 SELECT 查詢返回 0 筆空集，所有 INSERT/UPDATE/DELETE 拋出安全拒絕例外。
4. `R14-C-2-2` 提出修訂：將正式環境之 `app_runtime` 設定為 `WITH BYPASSRLS`。

**本審查核心問題**：
- `app_runtime WITH BYPASSRLS` 是否真為適合 CODE TO KNOW 正式環境的最佳設計？
- 是否應該在資料庫層全面撰寫 RLS Policies 並改用 `NOBYPASSRLS`？
- `BYPASSRLS` 會帶來哪些真實風險？如何透過架構層次將風險降至最低？

---

## 二、實際檢查的檔案與 API 範圍

本階段對本機專案進行全量盤查，涵蓋的檔案與端點如下：

### 1. 資料庫模型定義（Prisma Schema）
- 檔案：[`backend/prisma/schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)（共 702 行，涵蓋 37 個模型）
- 檢查範圍：
  - **核心身分與安全（9 個模型）**：`User`、`Role`、`UserRole`、`UserProfile`、`Session`、`TeacherApplication`、`EmailVerificationToken`、`PasswordResetToken`、`AuditLog`。
  - **第一層：公告與宣傳（2 個模型）**：`Announcement`、`AnnouncementRead`。
  - **第四層：證照與題庫（6 個模型）**：`Certification`、`Subject`、`Question`、`QuestionOption`、`QuestionTag`、`QuestionTagRelation`。
  - **第二層：學生學習歷程（5 個模型）**：`CertificationEnrollment`、`UnitProgress`、`WrongQuestionRecord`、`QuestionBookmark`、`StudyTimeLog`。
  - **第三層：教師與班級管理（4 個模型）**：`TeacherProfile`、`Class`、`ClassEnrollment`、`ClassAssignment`。
  - **術科練習系統（4 個模型）**：`PracticalTask`、`PracticalStep`、`PracticalProgress`、`PracticalStepProgress`。
  - **模擬測驗系統（3 個模型）**：`ExamPaper`、`ExamAttempt`、`ExamAnswerSnapshot`。
  - **第五層：AI 助教與分析（3 個模型）**：`AIChatSession`、`AIChatMessage`、`StudentWeaknessAnalysis`。
  - **遷移歷史元資料（1 個資料表）**：`_prisma_migrations`。

### 2. 後端伺服器與配置
- [`backend/src/app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts)：Express App 啟動、Helmet、CORS 白名單、Cookie Parser、`/api/health` 連線探針。
- [`backend/src/config/database.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts)：PrismaClient 初始化、連線字串驗證。
- [`backend/src/config/db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)：`sslmode=verify-full` 強制驗證、Port 5432 Session Pooler 限制、`app_runtime` 角色白名單。

### 3. 安全與認證中間件
- [`backend/src/middleware/authenticate.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authenticate.ts)：驗證 Cookie `code_to_know_session`，比對 `Session.tokenHash`，載入 `User` 與 `UserRole`，注入 `req.user`。
- [`backend/src/middleware/authorize.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/authorize.ts)：`requireRoles` 角色存取控制，支援 `ADMIN` 與 `PLATFORM_ADMIN` 過渡相容，阻斷越權。
- [`backend/src/middleware/csrf.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/csrf.ts)：雙重提交 Cookie CSRF 防護。
- [`backend/src/middleware/rate-limiter.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/rate-limiter.ts)：全域與認證端點防暴力破解。

### 4. 已實作之後端業務 API 模組
- **認證模組（Auth Module）**：
  - `POST /api/auth/register`：強制指派 `STUDENT` 角色，使用者無法自選角色。
  - `POST /api/auth/login`：驗證密碼 Hash，檢查帳號狀態（SUSPENDED / DISABLED / DELETED）。
  - `POST /api/auth/logout`：廢止目前 Session，寫入 AuditLog。
  - `GET /api/auth/me`：基於 `req.user.id` 讀取個人資料。
  - `POST /api/auth/verify-email`、`POST /api/auth/forgot-password`、`POST /api/auth/reset-password`。
- **教師模組（Teacher Module）**：
  - `POST /api/teachers/applications`：強制綁定 `userId = req.user.id`，防止代他人申請。
  - `GET /api/teachers/my-application`：以 `where: { userId: req.user.id }` 查詢，學生僅能查看自己的申請。
- **管理者模組（Admin Module）**：
  - 路由強制掛載 `requireRoles(['ADMIN'])`。
  - `GET /api/admin/teacher-applications`：僅管理者可檢視全體申請名單。
  - `POST /api/admin/teacher-applications/:id/approve`：審核通過並授予 `TEACHER` 角色。
  - `POST /api/admin/teacher-applications/:id/reject`：拒絕申請。
  - `GET /api/admin/audit-logs`：僅管理者可分頁調閱系統審計日誌。

### 5. 尚未實作後端 API 的業務模型（28 個模型）
- 經程式碼全文檢索確認：公告、題庫、練習進度、班級、術科試題、模擬考、AI 對話等業務模組，目前僅在 `schema.prisma` 完成結構定義，其後端 Express 路由與服務層**尚未建立（標示為：後續開發階段工作）**。前端目前由 Demo Mode 提供靜態展示。

---

## 三、目前資料存取控制的實務證據

透過原始碼審查，目前系統的資料隔離與權限防護邊界具備以下技術證據：

### 1. 三層式架構邊界（3-Tier Architecture）
- **客戶端（瀏覽器）不直連資料庫**：前端從不持有 Supabase 連線憑證，所有存取皆透過 HTTP(S) API 呼叫 Express 後端。
- **身分驗證（Authentication）由後端完成**：Express 中間件 `authenticate.ts` 透過資料庫 `Session` 表校驗 Token，解析使用者的真實 Identity（`req.user.id` 與 `req.user.roles`）。
- **授權隔離（Authorization & Tenant Scoping）由應用層 SQL 條件保證**：
  - `auth.service.ts`: `getCurrentUser` 僅查詢 `where: { id: userId }`。
  - `teacher.service.ts`: `getMyApplication` 僅查詢 `where: { userId: req.user.id }`。
  - 任何未經授權的使用者呼叫 Admin 端點時，在 `authorize.ts` 即遭 `403 ForbiddenError` 攔截，根本不會發送 SQL 到資料庫。

### 2. 資料庫層 RLS 現況證據
- **資料表 RLS 狀態**：37 張表之 `pg_class.relrowsecurity` 均為 `true`（證據：`DATABASE_PHASE3C4F_R14C22_RLS_BYPASSRLS_SECURITY_REVIEW.md` 步驟 7931）。
- **資料庫 Policies 狀態**：`pg_policies` 中 public schema 的列數為 `0`。
- **PostgreSQL 核心行為**：因無 Policy，若角色未具備 `BYPASSRLS` 且非 Owner，PostgreSQL 核心自動判定為 **DEFAULT DENY ALL**。

---

## 四、BYPASSRLS 的本質與安全風險深度分析

### 1. BYPASSRLS 的真實作用
`BYPASSRLS` 是 PostgreSQL 提供給角色（Role）的系統屬性。當該角色執行查詢時：
- **完全略過** PostgreSQL 內部針對該資料表的 Row-Level Security 政策引擎過濾。
- 該角色對資料列（Rows）的存取範圍，**完全取決於 SQL 語句內的 WHERE 條件**以及**自主存取控制（DAC / Table ACL）**。

### 2. BYPASSRLS 的真實安全風險（Threat Modeling）

| 風險項目 | 風險情境描述 | 衝擊程度 | 現有防護措施 | 殘留風險評估 |
| :--- | :--- | :---: | :--- | :---: |
| **R-01：應用層 IDOR 漏洞** | 後端開發人員撰寫新 API 時，疏漏了 `where: { userId: req.user.id }` 條件，導致學生 A 可讀取學生 B 的私有進度。 | **高** | 程式碼 Review、TypeScript 型別安全、Prisma 查詢封裝、自動化單元測試。 | **中**（依賴後端工程紀律） |
| **R-02：資料庫憑據外洩** | `app_runtime` 的資料庫連線字串遭竊取，攻擊者直接連入 Session Pooler 查詢。 | **極高** | Render Secret 加密保管、TLS `verify-full` 強制綁定憑證、禁止公網直連、限 IP/Pooler 存取。 | **低**（憑證防護層厚實） |
| **R-03：SQL Injection 越權** | 後端若使用 raw query 且存在 SQL 注入，攻擊者可藉此傾印全表資料。 | **高** | 專案全面採用 Prisma ORM 參數化查詢，嚴格禁止動態字串拼接 SQL。 | **極低** |

### 3. BYPASSRLS「絕對不會」破壞的安全防線（已實證）
在 `PHASE 3C-4F-R14-C-2-1` 的沙盒演練中，已實測證明：
> **`BYPASSRLS` 僅能略過第二層（Row Level Policies），絕不可能繞過第一層（Table ACL / DAC）！**

- **AuditLog 不可篡改性（Append-Only）100% 成立**：
  - 資料庫底層執行：`REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM app_runtime;`。
  - 當以 `app_runtime WITH BYPASSRLS` 執行 `UPDATE "AuditLog"` 或 `DELETE FROM "AuditLog"` 時，PostgreSQL 在第一層 DAC 檢查即拒絕：
    `ERROR: permission denied for table AuditLog`。
  - **BYPASSRLS 完全無法賦予被 REVOKE 的權限**。
- **Prisma 遷移歷史表隔離 100% 成立**：
  - `REVOKE ALL ON "_prisma_migrations" FROM app_runtime;` 確保任何非授權存取直接被第一層阻斷。
- **DDL 結構防護 100% 成立**：
  - `REVOKE CREATE ON SCHEMA public FROM app_runtime;` 確保無法新增或刪除資料表。

---

## 五、NOBYPASSRLS 與 RLS Policies 方案可行性評估

若放棄 `BYPASSRLS`，堅持採用 `NOBYPASSRLS`，在技術上有兩種可選子方案：

### 子方案 A-1：全通無條件政策（Trivial All-Permissive Policies）
- **實作方式**：
  為目前 37 張表分別建立允許 `app_runtime` 的全開放 Policy：
  ```sql
  CREATE POLICY "app_runtime_full_access" ON public."User" TO app_runtime USING (true) WITH CHECK (true);
  -- 依此類推建立 37 次
  ```
- **可行性與缺陷分析**：
  1. **無任何列級防護實益**：因條件為 `true`，其在資料過濾上的效果與 `BYPASSRLS` 100% 相同（完全不防範 IDOR）。
  2. **遷移脆弱性（極度危險）**：未來執行 `prisma migrate` 新增資料表時，Supabase 的 `ensure_rls` Event Trigger 會立刻對新表開啟 RLS，但**不會**自動產生此 Policy。後端上線後存取新表將**立刻遭遇 0 筆查詢或寫入拒絕**，引發線上重大故障（Downtime）。
  3. **效能劣化**：PostgreSQL 查詢規劃器需對每一次查詢和關聯 JOIN 附加額外的政策評估樹。
  - **結論：完全不可行，為形式主義且帶來高度維運風險**。

### 子方案 A-2：動態租戶隔離政策（Dynamic Tenant-Aware Policies）
- **實作方式**：
  在資料庫中撰寫真正的業務條件，例如：
  ```sql
  CREATE POLICY "student_isolation" ON public."UnitProgress"
    TO app_runtime
    USING (userId = current_setting('app.current_user_id', true)::uuid);
  ```
- **在目前架構下的阻斷性困難（為何不可行）**：
  1. **連線池（Connection Pooling）狀態污染**：
     後端透過 Supabase Transaction/Session Pooler 連線。若使用 `SET LOCAL app.current_user_id = ...`，必須強制每一個 Prisma 查詢都包裹在 `$transaction` 內。如果漏設或連線重用，將引發跨請求的身分錯亂。
  2. **Prisma ORM 不原生支援 Session Context**：
     Prisma 是通用 ORM，發出查詢時只使用單一資料庫連線帳號，不具備自動附加目前登入者身分到 Postgres Session 變數的機制。全面重構為 Prisma Client Extensions 具備極大開發與回歸風險。
  3. **系統與背景作業死結**：
     系統中存在多種系統層級查詢（例如：排程清理過期 Session、健康檢查 `/api/health`、管理者查詢全體日誌、教師批改跨學生作業）。若資料庫層強制 `userId = current_user`，所有跨使用者的後端業務查詢將全數被拒絕，必須針對每一種角色與系統情境在 SQL 內編寫龐雜的複合政策。
  4. **Supabase `auth.uid()` 無法使用**：
     Supabase 的 `auth.uid()` 依賴 Supabase Auth 產生的 JWT 並由 PostgREST 注入。CODE TO KNOW 使用的是獨立 Node.js 後端自製 Cookie-Session 認證，資料庫層的 `auth.uid()` 永遠為 `NULL`。
  - **結論：與目前的 3-Tier Node.js + Prisma 架構嚴重衝突，不具可行性**。

---

## 六、兩種核心方案完整比較矩陣

| 評估維度 | 方案 A：NOBYPASSRLS + RLS Policies | 方案 B：BYPASSRLS + 後端嚴格授權 + Table ACL |
| :--- | :--- | :--- |
| **資料列隔離防線** | 資料庫核心強制過濾（需倚賴複雜 SQL 政策） | 後端 Express Middleware + Prisma WHERE 條件 |
| **防範 IDOR 漏洞** | **優**（若 Policy 撰寫正確，資料庫可二次攔截） | **中**（依賴後端服務層邏輯正確性） |
| **與 Prisma ORM 相容性** | **極差**（連線池難以安全傳遞使用者狀態） | **原生完美相容**（標準連線池作業模式） |
| **Migration 維運穩定度** | **高風險**（每次增表均有忘記補 Policy 導致當機的風險） | **極高**（自動繼承 Default Privileges，零維運阻斷） |
| **AuditLog 篡改防護** | 同樣依靠 Table ACL | **100% 依據 Table ACL 硬性防護（已本機實證）** |
| **查詢效能與開銷** | 較慢（查詢規劃器需展開 Policy 子查詢） | **最高效**（直接執行標準索引查詢） |
| **系統背景工作支援** | 極度複雜（需為系統帳號額外開洞） | **自然支援**（後端服務層統一調度） |
| **業界標準實務對照** | 適用於無後端架構（BaaS / 前端直連 Supabase） | **三層式企業架構標準實務（Node.js / Rails / Django）** |
| **Supabase 官方設計對照** | 對應 `anon` / `authenticated` 角色 | **完全對應 Supabase 原生 `service_role` 設計** |

---

## 七、最終推薦架構方案與技術理由

### 1. 最終推薦方案
> **正式確認：CODE TO KNOW 正式環境應採用「方案 B：`app_runtime WITH BYPASSRLS`」結合「嚴格 Table-Level ACL 與應用層縱深防禦」作為長期架構標準。**

### 2. 核心推薦理由
1. **符合現代三層式架構分工**：
   CODE TO KNOW 採用獨立的 Node.js/Express API 伺服器，資料庫的角色是**受信任的底層持久化存儲**，而非直接暴露於公網的多租戶閘道。身份驗證與業務權限檢查集中於應用層，是現代軟體工程中最具擴展性與可測試性的模式。
2. **與 Supabase 原生哲學完全一致**：
   在 Supabase 官方生態中，提供給後端伺服器（Node.js/Python）連線的專屬角色 `service_role`，其預設屬性即為 `BYPASSRLS`。自訂角色 `app_runtime` 採用相同設計，兼具專用最小權限與平台相容性。
3. **消除生產環境重大死鎖與斷線隱患**：
   採用 `BYPASSRLS` 可徹底避免未來每次執行 Prisma Migration 時，因 Supabase `ensure_rls` 自動啟用 RLS 而導致新表查詢瞬間中斷的線上事故。
4. **關鍵安全資產依然具備絕對硬性防護**：
   本機沙盒測試已證明，`AuditLog` 的 Append-Only 防護、`_prisma_migrations` 的存取隔離、以及 DDL 權限的剝奪，均由 PostgreSQL 底層的第一層 DAC（Table ACL）強制保證，完全不受 `BYPASSRLS` 影響。

### 3. 方案 B 的配套縱深防禦措施（Security Hardening）
為防範 `BYPASSRLS` 帶來的潛在風險，必須強制實施以下三項防禦層：
- **第一道防線（網路與傳輸）**：
  - 僅限透過 Session Pooler Port 5432 存取。
  - 強制啟用 TLS `verify-full` 並綁定 Supabase CA 憑證，防止連線被竊聽或中間人攻擊。
- **第二道防線（資料庫底層權限）**：
  - `NOCREATEDB`, `NOCREATEROLE`, `NOSUPERUSER`。
  - `REVOKE CREATE ON SCHEMA public FROM app_runtime`。
  - `REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM app_runtime`。
  - `REVOKE ALL ON "_prisma_migrations" FROM app_runtime`。
- **第三道防線（後端 API 程式碼規範）**：
  - 所有涉及使用者私有資料的查詢，必須強制以 `req.user.id` 作為 WHERE 條件，不得信任前端傳入之 `userId` 參數。
  - 全面使用 Prisma 參數化查詢，禁止字串拼接 SQL。

---

## 八、正式環境實作前的必要測試項目

在未來正式執行 Supabase 雲端最小權限角色切換前，必須依序通過以下測試驗證：

### 1. 後端應用層隔離自動化測試（本機實施）
- **T-AUTH-01（水平越權 IDOR 測試）**：
  模擬使用者 A 發送請求存取使用者 B 的 `teacher-application` 或學習記錄，驗證系統正確返回 `404 Not Found` 或 `403 Forbidden`。
- **T-AUTH-02（垂直越權 RBAC 測試）**：
  以 `STUDENT` 身分之 Session 存取 `/api/admin/*` 端點，驗證 `requireRoles` 確實阻斷並記錄安全日誌。
- **T-AUTH-03（註冊提權防護測試）**：
  在註冊 Payload 中惡意注入 `{ roles: ["ADMIN"] }`，驗證後端仍強制賦予 `STUDENT` 角色。

### 2. 雲端 DDL 套用後的即時驗收測試（Supabase 切換當下實施）
- **T-DB-01（AuditLog Append-Only 驗證）**：
  以 `app_runtime` 身分執行 `UPDATE "AuditLog"` 與 `DELETE FROM "AuditLog"`，必須回傳 `permission denied`。
- **T-DB-02（業務表 DML 驗證）**：
  以 `app_runtime` 身分執行 `SELECT`、`INSERT` 測試業務資料，確認無 RLS 阻斷問題。
- **T-DB-03（DDL 阻斷驗證）**：
  以 `app_runtime` 身分執行 `CREATE TABLE`，必須回傳 `permission denied for schema public`。
- **T-DB-04（遷移歷史隔離驗證）**：
  以 `app_runtime` 存取 `_prisma_migrations`，必須回傳 `permission denied`。

---

## 九、下一階段進入判定與建議結論

### 1. 審查判定結論
> **審查結果：【PASS / 審查通過】**  
> **結論確定**：`app_runtime WITH BYPASSRLS` 經深度論證，為兼顧目前系統架構可行性、維運穩定度與核心資產安全性的最佳技術決策。先前存在的「RLS 矛盾疑慮」正式結案消除。

### 2. 資料庫正式收尾全域狀態
依據 [`docs/DATABASE_PHASE3C4F_FINAL_COMPLETION_INVENTORY.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_FINAL_COMPLETION_INVENTORY.md) 之總體進度：
- **架構設計層面**：Phase 1（全階段盤點）與 Phase 2（RLS 最終安全審查）均已完成，架構阻礙全數釐清。
- **實體執行層面**：目前狀態依然為 **【NO-GO / 嚴格阻斷】**，因尚有以下前置阻礙（Blockers）待完成：
  1. **BLK-01 / BLK-02**：正式 AES-256 主金鑰尚未生成，密碼庫保管方案待使用者選定。
  2. **BLK-03 / BLK-04**：切換前之 Supabase 正式庫即時加密備份與本地還原驗證尚未執行。
  3. **BLK-05**：雲端最小權限角色切換尚未獲得授權執行。

### 3. 下一步行動建議
請使用者審閱本報告。若確認同意本報告之架構結論，下一步可進入：
- **Phase 3：主金鑰保管決策與正式 AES-256 金鑰生成（AUTH-K-01 / AUTH-K-02）**。
- 待金鑰與保管卡建立完畢後，方可推進至 Supabase 即時雲端備份（Phase 4）。

---
*(報告完畢，停止操作，等待使用者審查)*
