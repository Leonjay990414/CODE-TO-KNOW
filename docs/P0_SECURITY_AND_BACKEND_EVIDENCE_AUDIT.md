# CODE TO KNOW（碼上學）
# P0 安全與後端功能真實性補充稽核報告

**稽核類型：** READ-ONLY AUDIT（嚴格唯讀檢查，未更動任何程式碼、資料庫或設定）  
**稽核日期：** 2026-11-06  
**報告版本：** v1.0.0  
**檔案路徑：** `docs/P0_SECURITY_AND_BACKEND_EVIDENCE_AUDIT.md`  

---

## 核心結論直球回答

> ### **1. 目前登入與 Session 是否真正安全？**
> **【判定：後端 Session 機制本身架構健全且安全；但前端路由缺乏保護。】**  
> - **後端安全性：** Session Token 使用密碼學安全的 32 位元組隨機數（`crypto.randomBytes(32)`），資料庫僅存儲 SHA-256 雜湊值（`tokenHash`），客戶端僅持有原始 Token 於 `httpOnly`, `sameSite: lax`, `secure`（生產環境）之 Session Cookie 中；登入強制校驗 CSRF；登出即時於資料庫將 `revokedAt` 設為當前時間使 Session 失效；密碼採用 Bcrypt 加上強度校驗。後端 Session 機制達到現代高資安標準。
> - **前端漏洞：** 前端 SPA 路由未與 Session 狀態聯動，未受保護的路由可被任意訪客以 Hash 形式直接瀏覽展示畫面。
>
> ### **2. 教師是否只能存取授權班級？**
> **【判定：後端完全無班級資料與 API，前端展示數據為全域寫死，根本不存在班級存取控制。】**  
> - 後端 Prisma Schema 完全沒有 `Class`, `Enrollment`, `ClassTeacher` 等班級相關資料表。
> - 後端沒有任何班級管理、學生管理、成績批改 API。
> - 前端 `TeacherDashboardPage.tsx` 所展示之「資訊一甲 (38 人)」與 5 名學生假名冊為組件內部靜態 Mock，非真實班級資料。
>
> ### **3. 學生是否可能進入教師或管理 API？**
> **【判定：後端 API 無法越權進入；但前端教師主控台介面學生可自由進入。】**  
> - **後端 API 防禦有效：** 後端 `/api/admin/*` 強制校驗 `requireRoles(['ADMIN'])`，學生存取會被 403 阻擋；現有 `/api/teachers/*` 僅有申請與查詢自身申請兩個端點，任何登入者均可申請，並無越權漏洞。
> - **前端介面嚴重裸露 (P0 漏洞)：** 前端無任何 Route Guard，學生只要手動修改網址為 `/#teacher`，即可直接繞過所有檢查進入教師主控台介面。
>
> ### **4. 平台管理員與系統維運人員是否真正分權？**
> **【判定：完全未分權。】**  
> - 資料庫 `Role` 表僅定義 `STUDENT`, `TEACHER`, `ADMIN` 三種角色，缺少 `SUPERADMIN`, `DEVOPS`, `OPERATOR`, `CONTENT_ADMIN`。
> - 系統所有管理功能（審核教師、檢視稽核日誌）全部歸於 `ADMIN` 單一角色，未將「業務內容管理（第四層）」與「系統營運監控（第五層）」進行架構性權限劃分。
>
> ### **5. Email 是否真的能寄出？**
> **【判定：完全不能寄出。】**  
> - 後端 `email.provider.ts` 在開發環境使用 `ConsoleEmailProvider`，在生產環境使用 `DisabledEmailProvider`，兩者均為直接返回 `false` 的 Stub 虛設類別，系統目前未配置真實 SMTP 或外部郵件服務商（Resend/SendGrid）憑證，0 封外部郵件能夠真實送達。
>
> ### **6. RLS 是否真正啟用並具有正確 Policy？**
> **【判定：完全未啟用，零 Policy。】**  
> - 本專案使用本機 Docker PostgreSQL，非 Supabase 託管環境。
> - 初始遷移檔案 `migration.sql` 與資料庫中，**全部 9 張資料表均未執行 `ENABLE ROW LEVEL SECURITY`**，亦無任何 `CREATE POLICY`。
> - Prisma 使用單一連線池帳號連線，所有資料隔離 100% 依賴應用層（Express Middleware 與 Prisma `where` 條件）。
>
> ### **7. 哪些安全問題必須優先修正？**
> 1. **P0-1**：前端加入 Route Guard，封堵 `/#teacher` 裸露漏洞。
> 2. **P0-2**：自公開導覽列移除內部工具「題庫來源 (`#sources`)」。
> 3. **P0-3**：資料庫層評估並引入多租戶資料隔離與 RLS 機制。
>
> ### **8. 哪些功能已具備真正的後端與資料庫支援？**
> - 使用者註冊、登入、登出、Session 管理、CSRF Token 防護。
> - 教師資格申請提交（寫入 `TeacherApplication`）與管理員審核（更新申請並寫入 `AuditLog`）。
> - 系統健康檢查探針 (`/api/health` 執行真實 PostgreSQL `SELECT 1`)。

---

## 一、身分驗證真實性 (Authentication Authenticity)

| 查核項目 | 實作機制 | 程式碼檔案與行號 | 真實性判定 |
|---|---|---|---|
| **註冊寫入資料庫** | 透過 `prisma.user.create` 於單一事務內建立 `User`、`UserRole` (強制 STUDENT)、`UserProfile`、`EmailVerificationToken` | `backend/src/modules/auth/auth.service.ts:51-79` | **真實有效 (A 類)** |
| **密碼安全雜湊** | 使用 `bcryptjs` 進行 Salt + Hash（`saltRounds: 12`），強密碼正則校驗（>=8碼，含英文與數字） | `backend/src/utils/password.ts:13-33` | **真實有效 (A 類)** |
| **後端登入驗證** | 比對資料庫中之 `passwordHash`，帳號不存在時使用安全模糊訊息「帳號或密碼錯誤」防止帳號枚舉 | `backend/src/modules/auth/auth.service.ts:121-143` | **真實有效 (A 類)** |
| **Session 生成與存檔** | 生成 32 位元組密碼學安全隨機字串，原始值送 Cookie，SHA-256 雜湊值存入 `Session` 表，效期 7 天 | `backend/src/modules/auth/auth.service.ts:145-158` | **真實有效 (A 類)** |
| **登出 Session 失效** | 呼叫 `authService.logout`，將資料庫該 Session 之 `revokedAt` 設為 `new Date()`，並清除瀏覽器 Cookie | `backend/src/modules/auth/auth.service.ts:188-207`<br>`backend/src/modules/auth/auth.controller.ts:76-83` | **真實有效 (A 類)** |
| **密碼重設 Token 機制** | 生成 32 位元組隨機 Token，SHA-256 存入 `PasswordResetToken`，效期 1 小時；重設成功後標記 `usedAt` 並廢止該用戶所有有效 Session | `backend/src/modules/auth/auth.service.ts:301-310, 351-364` | **真實有效 (A 類)** |
| **Email 驗證 Token 機制** | 生成 32 位元組隨機 Token，SHA-256 存入 `EmailVerificationToken`，效期 24 小時；驗證成功後標記 `usedAt` 與 `emailVerifiedAt` | `backend/src/modules/auth/auth.service.ts:47-48, 248-281` | **真實有效 (A 類)** |

---

## 二、Session 與 CSRF 安全檢查 (Session & CSRF Security Audit)

### 2.1 Session Cookie 安全屬性
檢驗 `backend/src/modules/auth/auth.controller.ts:41-48`：
```typescript
res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
  httpOnly: true,                         // 防止 XSS 竊取 Cookie (PASS)
  secure: env.NODE_ENV === 'production',   // 生產環境強制 HTTPS (PASS)
  sameSite: 'lax',                        // 防止跨站請求偽造 (PASS)
  path: '/',                              // 全站有效 (PASS)
  expires: result.expiresAt,              // 效期對齊後端 DB (PASS)
  domain: env.COOKIE_DOMAIN || undefined,
});
```
- **判定：符合業界最高安全性標準。** 

### 2.2 CSRF 防護機制
檢驗 `backend/src/middleware/csrf.ts:1-73`：
- **防禦模式：** Double Submit Cookie 模式（Cookie 存放 `XSRF-TOKEN`，前端透過 Header `x-csrf-token` 送回）。
- **套用範圍：**
  - `POST /api/auth/register` (已套用)
  - `POST /api/auth/login` (已套用)
  - `POST /api/auth/logout` (已套用)
  - `POST /api/auth/verify-email` (已套用)
  - `POST /api/auth/forgot-password` (已套用)
  - `POST /api/auth/reset-password` (已套用)
  - `POST /api/teachers/applications` (已套用)
  - `POST /api/admin/teacher-applications/:id/approve` (已套用)
  - `POST /api/admin/teacher-applications/:id/reject` (已套用)
- **測試驗證：** `backend/tests/api.test.ts:35-63` 實測未帶 Token 請求被 403 阻擋，合法 Token 順利通過 (PASS)。

---

## 三、Email 服務狀態 (Email Service Lifecycle Status)

依據系統實際程式碼，將 Email 服務狀態精確拆解分級：

| 階段層次 | 實際狀況 | 證據與程式碼 | 判定 |
|---|---|---|---|
| **1. Token 已建立** | `generateSecureToken(32)` 產生 64 字元十六進制金鑰 | `auth.service.ts:47, 301` | **YES** |
| **2. Token 已寫入資料庫** | SHA-256 雜湊存入 `EmailVerificationToken` / `PasswordResetToken` | `auth.service.ts:67-72, 304-309` | **YES** |
| **3. 郵件已進入寄送流程** | 程式碼呼叫 `emailProvider.sendVerificationEmail()` | `auth.service.ts:93, 322` | **YES** |
| **4. 郵件服務已成功接受** | `emailProvider` 為虛設類別（Stub），直接 return `false` | `backend/src/services/email.provider.ts:17, 39` | **NO** |
| **5. 實際外部投遞已驗證** | 無 SMTP 伺服器、無 API Key、0 封外部郵件送達 | `email.provider.ts:30-31` | **NO** |

> **結論**：Email 服務在 Token 生成與資料庫存檔層面已完成；但**在對外傳遞層面為 0%**，目前完全無法向真實使用者寄送驗證信或重設密碼信。

---

## 四、角色權限矩陣 (RBAC Matrix)

| 角色名稱 | 資料庫定義存在 | 伺服器端核驗機制 | 允許操作之 API | 前端對應介面 |
|---|---|---|---|---|
| **GUEST (未登入)** | 不適用 | 無 Session 視為訪客 | `/api/auth/login`, `/api/auth/register`, `/api/health` | 品牌首頁、證照中心、學科/模考/術科單機 |
| **STUDENT (學員)** | `Role` (name: `STUDENT`) | `authenticate` (驗證 Session) | 訪客所有 API + `/api/auth/me`, `/api/auth/logout`, `/api/teachers/applications` | 學生中心 (Student Hub，目前無守衛) |
| **TEACHER (認證教師)** | `Role` (name: `TEACHER`) | `authenticate` + (待建置角色權限) | 目前後端**無任何專屬教師 API** | 教師主控台 (目前為純前端 Mock 展示) |
| **ADMIN (平台管理員)** | `Role` (name: `ADMIN`) | `authenticate` + `requireRoles(['ADMIN'])` | `/api/admin/teacher-applications/*`, `/api/admin/audit-logs` | **完全無前端專屬頁面** |
| **DEVOPS (系統維運)** | **不存在** | **不存在** | 無專屬 API，依賴主機 Shell / Docker | **完全無介面** |

---

## 五、API 越權風險審查 (Broken Object Level Authorization / IDOR)

### 1. 學生是否能存取教師 API？
- **後端 API 現況：** 後端目前的 `/api/teachers/*` 端點僅有 `POST /applications`（提出申請）與 `GET /my-application`（查詢自身申請），此兩端點本來就是設計給尚未成為教師的學生使用的。後端**尚未實作任何僅限教師執行的 API**（例如管理班級、建立作業、批改試卷）。
- **前端介面漏洞：** 學生可透過輸入 `#teacher` 直接存取包含假學生名單的教師主控台（P0 漏洞）。

### 2. 未登入者是否能存取會員 API？
- **後端 API 防禦：** 所有受保護路由均掛載 `authenticate` 中介軟體（`backend/src/middleware/authenticate.ts:25-72`）。未帶有效 Session Cookie 者一律回傳 401 `UNAUTHENTICATED`，防禦健全。

### 3. API 是否信任前端傳入的參數？
- 檢驗 `teacher.controller.ts:13`：
  ```typescript
  const userId = req.user!.id; // 從驗證過的 Session 提取，不讀取 req.body.userId
  ```
- 檢驗 `admin.controller.ts:48`：
  ```typescript
  const adminId = req.user!.id; // 從驗證過的 Session 提取
  ```
- 檢驗 `auth.service.ts:57-61`：
  註冊時強制綁定 `STUDENT` 角色 ID，完全不讀取前端傳入的任何 `role` 欄位。
- **結論：後端在現有 API 中 100% 由 Session 決定身分，無信任客戶端偽造 ID 之漏洞。**

---

## 六、教師班級資料隔離 (Class Multi-Tenancy Isolation)

| 檢核維度 | 現狀查核結果 | 檔案與證據 | 評級 |
|---|---|---|---|
| **教師班級關聯模型** | 資料庫**完全無班級相關 Model**（無 Class, Course, Enrollment） | `backend/prisma/schema.prisma:1-146` | **P1 缺失** |
| **班級資料讀寫 API** | 後端**完全無班級相關 API** | `backend/src/app.ts:72-76` | **P1 缺失** |
| **跨班級橫向越權 (BOLA)** | 因後端無班級功能，**API 層目前無此漏洞** | 後端無此業務 | **無直接漏洞** |
| **前端偽造資料外洩展示** | `TeacherDashboardPage.tsx` 直接在程式碼中寫死 5 位學生姓名（陳品睿、林子翔等）、Email 與作答狀況 | `frontend/src/pages/public/TeacherDashboardPage.tsx:26-32` | **P0 展示漏洞** |

---

## 七、Prisma Model 與資料庫關聯 (Database Schema Integrity)

### 7.1 現有 9 個 Prisma 模型完整關聯盤點
1. `User` ──(1:N, Cascade)──> `UserRole` ──(N:1, Cascade)──> `Role`
2. `User` ──(1:1, Cascade)──> `UserProfile`
3. `User` ──(1:N, Cascade)──> `Session`
4. `User` ──(1:N, Cascade)──> `TeacherApplication`
5. `User` ──(1:N, Cascade)──> `EmailVerificationToken`
6. `User` ──(1:N, Cascade)──> `PasswordResetToken`
7. `User` ──(1:N, SetNull)──> `AuditLog`

### 7.2 關聯安全性查核
- **級聯刪除 (Cascade Delete)：** 當使用者被實體刪除時，其 Session、Token、Profile、UserRole、TeacherApplication 皆會自動級聯刪除，無孤兒資料（PASS）。
- **稽核日誌保留 (Set Null)：** 使用者被刪除時，`AuditLog.userId` 設為 `NULL`，稽核日誌本身完整保留（PASS）。
- **唯一性約束 (Unique Constraints)：** `User.email`、`Role.name`、`UserRole.[userId, roleId]`、`UserProfile.userId`、`Session.tokenHash`、Token 雜湊皆具備唯一索引，防止資料重複（PASS）。

---

## 八、PostgreSQL / Supabase RLS 狀態 (Row Level Security Status)

| 查核維度 | 實測現況 | 程式碼與日誌證據 |
|---|---|---|
| **是否使用 Supabase** | **否**。本專案為自建 PostgreSQL 16 容器，非 Supabase 託管服務。 | `docs/architecture/DATABASE_IMPLEMENTATION.md:9` |
| **RLS 啟用狀態** | **0 / 9 張資料表啟用 RLS**。`migration.sql` 完全無 `ENABLE ROW LEVEL SECURITY`。 | `backend/prisma/migrations/20261103000000_init/migration.sql:1-180` |
| **RLS Policy 定義** | **0 條 Policy**。無任何 `CREATE POLICY` 語句。 | `migration.sql` 全文檢索 0 筆匹配 |
| **Prisma 連線角色** | 使用資料庫擁有者帳號（`codetoknow`），具備最高資料表操作權限，連線池共用單一連線身分。 | `backend/src/config/database.ts:11-13` |
| **資料隔離機制** | 100% 仰賴 Node.js / Express 應用層程式碼過濾，資料庫層無防線。 | 應用層驗證機制 |

---

## 九、管理 API 真實性 (Admin API Authenticity)

| API 端點 | HTTP 方法 | 中介軟體防護 | 後端 Service 實作 | 資料庫實際讀寫 | 真實性評級 |
|---|---|---|---|---|---|
| `/api/admin/teacher-applications` | `GET` | `authenticate`, `requireRoles(['ADMIN'])` | `adminService.listTeacherApplications` | 查詢 `TeacherApplication` 並關聯 `User` | **A. 真正完成** |
| `/api/admin/teacher-applications/:id/approve` | `POST` | `authenticate`, `requireRoles(['ADMIN'])`, `csrfProtection` | `adminService.approveTeacherApplication` | 事務更新申請狀態、賦予 `TEACHER` 角色、寫入 `AuditLog` | **A. 真正完成** |
| `/api/admin/teacher-applications/:id/reject` | `POST` | `authenticate`, `requireRoles(['ADMIN'])`, `csrfProtection` | `adminService.rejectTeacherApplication` | 事務更新申請狀態為 `REJECTED`、寫入 `AuditLog` | **A. 真正完成** |
| `/api/admin/audit-logs` | `GET` | `authenticate`, `requireRoles(['ADMIN'])` | `adminService.listAuditLogs` | 分頁查詢 `AuditLog` 表 | **A. 真正完成** |
| **題庫與教材管理 API** | — | — | — | **完全無後端 API** | **D. 尚未開發** |
| **班級與學生名冊 API** | — | — | — | **完全無後端 API** | **D. 尚未開發** |
| **使用者管理與凍結 API** | — | — | — | **完全無後端 API** | **D. 尚未開發** |

---

## 十、AuditLog 完整性 (Security Audit Logging Integrity)

檢驗 `AuditLog` 資料模型（`backend/prisma/schema.prisma:132-146`）：
- 欄位包含：`id`, `userId`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`。
- 目前已真正寫入稽核日誌的操作事件：
  1. `USER_REGISTER` (`auth.service.ts:85`)
  2. `USER_LOGIN` (`auth.service.ts:164`)
  3. `LOGIN_FAILED` (`auth.service.ts:136`)
  4. `USER_LOGOUT` (`auth.service.ts:200`)
  5. `EMAIL_VERIFIED` (`auth.service.ts:276`)
  6. `PASSWORD_RESET_REQUESTED` (`auth.service.ts:315`)
  7. `PASSWORD_RESET_COMPLETED` (`auth.service.ts:368`)
  8. `TEACHER_APPLICATION_SUBMITTED` (`teacher.service.ts:47`)
  9. `TEACHER_APPLICATION_APPROVED` (`admin.service.ts:110`)
  10. `TEACHER_APPLICATION_REJECTED` (`admin.service.ts:162`)
- **缺失層面：** 缺少題庫變更、成績修改、權限異動等日誌（因相應業務 API 尚未開發）。

---

## 十一、測試執行結果 (Test Execution & Evidence)

依照「不得執行可能寫入正式資料庫的測試」之安全限制，本次測試嚴格區分如下：

| 測試檔案 | 測試類型 | 執行狀態 | 測試結果 | 備註說明 |
|---|---|---|---|---|
| `backend/tests/validation.test.ts` | Zod Schema 驗證 | **已實際執行** | **12 / 12 PASS** | 密碼規則、Email 格式、審核輸入校驗 |
| `backend/tests/security.test.ts` | 密碼雜湊與 Token 工具 | **已實際執行** | **5 / 5 PASS** | Bcrypt 雜湊驗證、SHA-256 雜湊、安全 Token |
| `backend/tests/rbac-workflow.test.ts` | RBAC 中介軟體單元測試 | **已實際執行** | **9 / 9 PASS** | 角色拒絕 (403)、未登入 (401)、審核狀態轉換 |
| `backend/tests/api.test.ts` | Supertest API 整合測試 | **已實際執行** | **5 / 5 PASS** | `/api/health` 探針、CSRF 阻擋與合法通過 |
| `backend/tests/integration.db.test.ts` | PostgreSQL 資料庫寫入測試 | **跳過 (未執行)** | **SKIPPED** | 因指令禁止資料庫寫入，依規定跳過 |
| `frontend/` (React 生產打包) | TypeScript & Vite Build | **已實際執行** | **PASS (0 Errors)** | 1,611 模組成功構建 |
| `frontend/` (React 實體瀏覽器) | Headless Chrome CDP 測試 | **已實際執行** | **PASS (0px 溢出)** | 375~1440px 測試通過，Modal 點擊成功 |

---

## 十二、問題分級清單 (P0 / P1 / P2 / P3 Issue Inventory)

### 【P0 優先級 — 重大安全與架構風險】

#### 1. ISS-P0-01：前端教師主控台無路由守衛，學生與訪客可任意存取偽造學生個資
- **問題描述：** `TeacherDashboardPage.tsx` 未受任何身分驗證或角色校驗保護，任何使用者只要在瀏覽器輸入 `/#teacher`，即可進入並檢視寫死的學生名單（「陳品睿」、「林子翔」等人之 Email、作業及格率）。
- **影響範圍：** 系統身分隔離、隱私呈現、教育科技產品權限規範。
- **檔案路徑：** `frontend/src/context/NavigationContext.tsx:94-97` 與 `frontend/src/pages/public/TeacherDashboardPage.tsx:26-32, 68-73`。
- **可重現證據：** 啟動前端，瀏覽器輸入 `http://localhost:5173/#teacher`，未登入即直接渲染教師主控台與學生名冊。
- **建議修正方向：** 在 `NavigationContext.tsx` 與 `App.tsx` 加入權限守衛；若非 `TEACHER` 或 `ADMIN`，強制攔截並重導向至 `#hero` 並跳出權限提示。
- **修正後應有測試：** 編寫測試模擬訪客與學生身分訪問 `#teacher`，驗證皆被重導向且不渲染學生名冊。

#### 2. ISS-P0-02：題庫管理引擎作為公開頁面暴露於前台導覽列
- **問題描述：** `QuestionBankImportSystemPage.tsx` 屬於內部題庫與教材管理功能，卻被放在 `frontend/src/pages/public/` 並在公開 Navbar 提供「題庫來源 (`#sources`)」按鈕，任何訪客均可直接檢閱題庫校驗結構與底層資料。
- **影響範圍：** 平台內容管理邊界、系統架構分層。
- **檔案路徑：** `frontend/src/components/Navbar.tsx:46, 95` 與 `frontend/src/pages/public/QuestionBankImportSystemPage.tsx:1-442`。
- **可重現證據：** 點擊 Navbar 第 9 項按鈕「題庫來源」即可進入管理引擎。
- **建議修正方向：** 自公開導覽列移除 `#sources`，移至管理後台專屬路由與檔案目錄。
- **修正後應有測試：** 驗證公開 Navbar 僅保留公共頁面，無內部管理引擎按鈕。

#### 3. ISS-P0-03：資料庫層完全未啟用 RLS (Row-Level Security)
- **問題描述：** PostgreSQL 資料庫所有資料表均未執行 `ENABLE ROW LEVEL SECURITY`，亦無任何 Policy。所有資料隔離 100% 依賴應用層。
- **影響範圍：** 資料庫底層安全、多租戶隔離。
- **檔案路徑：** `backend/prisma/migrations/20261103000000_init/migration.sql:1-180`。
- **可重現證據：** 檢驗 `migration.sql`，全檔無任何 RLS 語句。
- **建議修正方向：** 在後續資料庫升級中引入 RLS 策略或強化 Prisma 查詢中間件隔離。
- **修正後應有測試：** 執行資料庫層不同角色連線測試，驗證跨租戶資料無法讀取。

---

### 【P1 優先級 — 核心功能缺少必要後端支援】

#### 4. ISS-P1-01：學生學習核心業務資料表與 API 完全缺失
- **問題描述：** Prisma Schema 缺乏 `Question`, `Exam`, `Submission`, `UserProgress`, `WrongQuestion`, `Bookmark`, `StudyNote` 等模型。目前學科題庫、模擬考、進度頁全靠前端靜態常數，無法實現雲端持久化。
- **影響範圍：** 第二層學生學習平台核心功能。
- **檔案路徑：** `backend/prisma/schema.prisma`。
- **建議修正方向：** 設計教育核心業務資料表並建立相應 RESTful API。

#### 5. ISS-P1-02：教師教學後台無真實業務 API 與資料模型
- **問題描述：** 後端完全沒有班級（`Class`）、學生名冊（`Enrollment`）、派卷（`Assignment`）、成績分析 API。前端展示之教學數據純屬虛構。
- **影響範圍：** 第三層教師教學後台。
- **檔案路徑：** `backend/src/modules/teachers/teacher.routes.ts`。
- **建議修正方向：** 規劃教師班級管理 API 與資料表。

#### 6. ISS-P1-03：平台管理員缺乏視覺化前端後台 UI
- **問題描述：** 後端已實作教師審核 API 與審核日誌 API，但前端完全沒有對應的管理員頁面（`/admin`），管理員無法在瀏覽器中進行操作。
- **影響範圍：** 第四層平台管理後台。
- **檔案路徑：** `frontend/src/app/App.tsx`。
- **建議修正方向：** 建立第四層管理員專屬前端模組。

#### 7. ISS-P1-04：外部 Email 服務未真正啟用
- **問題描述：** `email.provider.ts` 僅為 Stub 模擬，未真正連接任何外部 SMTP / 郵件服務商，驗證信與重設密碼信無法真實寄出。
- **影響範圍：** 帳號信箱驗證與密碼找回。
- **檔案路徑：** `backend/src/services/email.provider.ts:1-55`。
- **建議修正方向：** 串接正式 SMTP / Resend API 並補齊環境變數。

---

### 【P2 優先級 — 功能不完整或角色權限粗糙】

#### 8. ISS-P2-01：角色體系未劃分平台業務管理與系統運維
- **問題描述：** 系統僅有 `STUDENT`, `TEACHER`, `ADMIN`，缺少 `DEVOPS`, `OPERATOR`, `CONTENT_ADMIN`。
- **影響範圍：** RBAC 細粒度控制。
- **檔案路徑：** `backend/prisma/schema.prisma:33-38`。

#### 9. ISS-P2-02：AI 學習教練尚未串接真實 LLM API
- **問題描述：** 前端對話與 4 階鷹架引導由前端狀態機模擬，後端尚未提供轉發代理端點。
- **影響範圍：** AI 學習教練。
- **檔案路徑：** `frontend/src/pages/public/AICoachPage.tsx`。

---

### 【P3 優先級 — 文件一致性改善】

#### 10. ISS-P3-01：Showcase 歷史文檔殘留舊四大題組名稱與缺失 P2
- **問題描述：** `SHOWCASE_FEATURE_INVENTORY.md` 與 `SHOWCASE_GUIDE.md` 仍記載舊題組名稱與舊四大題組說明。
- **影響範圍：** 專案展示文件。
- **檔案路徑：** `prototype/SHOWCASE_FEATURE_INVENTORY.md:84`, `prototype/SHOWCASE_GUIDE.md:87-90, 175`。

---

## 十三、下一階段 P0 修正建議 (Next Stage P0 Action Plan)

為確保系統在下一階段安全落地，建議依循以下具體步驟執行 P0 修正：

1. **實施前端路由守衛 (Frontend Route Guards)**：
   - 於 `NavigationContext.tsx` 中建立受保護路由白名單與角色映射表：
     - `#teacher` 映射至 `TEACHER` 角色
     - `#student` 映射至已登入狀態
   - 當使用者未具備相應權限時，自動中斷導航，彈出 `AuthModal` 或權限警示，並強制重導向至 `#hero`。
2. **重構頁面目錄結構 (Page Folder Restructuring)**：
   - 在 `frontend/src/pages/` 下建立四個實體隔離目錄：
     - `public/`：HomePage, CertificationsPage, CertificationDetailPage, WebDesignCDemoPage, PracticalLearningPage, TheoryPracticePage, MockExamPage, CodeEditorPage, AICoachPage, LearningProgressPage
     - `student/`：StudentDashboardPage
     - `teacher/`：TeacherDashboardPage
     - `admin/`：QuestionBankImportSystemPage（改名或歸入管理模組）
3. **淨化公開導覽列 (Navbar Sanitization)**：
   - 移除 Navbar 上的「題庫來源 (`#sources`)」按鈕，保持公開網站的專業與乾淨度。
4. **清理歷史 Showcase 文檔**：
   - 同步修正 `SHOWCASE_FEATURE_INVENTORY.md` 與 `SHOWCASE_GUIDE.md`，消除舊題組殘留並補齊 P2 比較區塊。

---

## 十四、無法確認的項目及缺少的證據 (Unverifiable Items)

1. **生產環境 PostgreSQL 連線併發表現（未驗證）：**
   - 本專案目前未進行高負載連線池壓力測試，在高併發登入情境下 Session 查詢延遲與連線池耗盡情況缺乏測試數據。
2. **真實外部郵件服務投遞率（未驗證）：**
   - 因專案目前無外部 SMTP 伺服器連線憑證，真實郵件是否會被 Gmail/Outlook 歸入垃圾郵件匣目前無法驗證。
3. **真實 LLM API 串接成本與響應延遲（未驗證）：**
   - AI 助教尚未串接正式商業 LLM API，真實場景下的 Token 費用與回應延遲無實測數據。

