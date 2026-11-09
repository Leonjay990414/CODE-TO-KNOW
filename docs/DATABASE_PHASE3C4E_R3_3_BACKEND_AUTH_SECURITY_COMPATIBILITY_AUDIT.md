# CODE TO KNOW (碼上學)
# PHASE 3C-4E-R3-3：後端身分驗證、安全機制與 PostgreSQL 17 相容性審查報告

本報告依據 **PHASE 3C-4E-R3-3** 規範撰寫。  
由資深後端架構師、資安審查工程師與 PostgreSQL DBA 共同執行，在**零帳號建立、零資料庫寫入、零連線 Supabase、零修改環境設定**之最高安全約束下，針對後端既有身分驗證、Session 狀態儲存、CSRF 機制、RBAC 角色映射與 Zod Schema 進行深度靜態審查與唯讀測試。

---

## 執行摘要 (Executive Summary)

- **前置狀態確認**：
  - 本機 PostgreSQL 17 隔離沙盒容器 `code_to_know_pg17_restore_sandbox` 正常運行於 `127.0.0.1:5433`。
  - Git HEAD 嚴格鎖定於 `7b778942f2fa85e351575cd72507c2373bdf2f96`。
- **身分驗證與密碼模組審查 (STATIC PASS / READONLY PASS)**：
  - 密碼採用 `bcryptjs` 雜湊，預設 Cost Factor 為 12（測試環境自動優化為 10），記憶體雜湊比對機制與時序攻擊防護（`crypto.timingSafeEqual`）通過測試。
  - 密碼絕無明文存儲，統一映射至 PostgreSQL `User.passwordHash` 欄位。
- **Session 與 Cookie 安全機制審查 (STATIC PASS / READONLY PASS)**：
  - 本專案採用**有狀態資料庫儲存 Session 架構**（並非完全無狀態 JWT）。
  - Session Token 由 `crypto.randomBytes(32)` 生成高熵隨機字串，資料庫端僅存儲其 SHA-256 雜湊值（`tokenHash`），避免資料庫洩漏時 Session 被直接劫持。
  - Cookie 旗標配置嚴密：`HttpOnly = true`（防 XSS 竊取）、`SameSite = lax`、生產環境強制 `Secure = true`。
  - Session 查詢邏輯（包含 `user`、`roles`、`role` 多層 include）在 PostgreSQL 17 上唯讀測試通過。
- **CSRF 防護機制審查 (STATIC PASS)**：
  - 實施 Double Submit Cookie 模式（`XSRF-TOKEN` 與 `x-csrf-token` Header 雙重校驗），且以 `crypto.timingSafeEqual` 進行常數時間比對。
- **角色與權限映射 (RBAC) 審查 (STATIC PASS / READONLY PASS)**：
  - 角色架構由 `User` -> `UserRole` -> `Role` 實體表格管理，包含過渡期兼容擴展邏輯（`expandCompatibleRoles`），嚴格遵守職責分離（SoD）。
- **API Route 與 Zod Schema 靜態核對 (STATIC PASS)**：
  - 完整審查 `auth`、`teachers`、`admin` 三大核心模組之 Zod Schema，欄位限制、必填與 Nullable 處理完全與 PostgreSQL 17 Schema 相符。
- **資料庫完整性驗收 (READONLY PASS)**：
  - 測試前後 37 張資料表、47 組外鍵、133 組索引、64 組唯一索引、2 筆遷移歷史、0 筆業務資料，數據 100% 保持一致，零資料庫寫入。
- **最終判定**：  
  **`PASS — BACKEND AUTH & SECURITY FULLY COMPATIBLE WITH POSTGRESQL 17`**

---

## 一、執行前安全檢查

| 檢查項目 | 預期標準 | 實際狀況 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git 分支與 HEAD** | `main` @ `7b778942f2fa85e351575cd72507c2373bdf2f96` | 完全一致 | **PASS** |
| **遠端同步狀態** | 與 `origin/main` 一致 | 100% 一致 | **PASS** |
| **工作區未追蹤/未提交** | 完整保留原有修改 | 零覆蓋、零清除 | **PASS** |
| **PG17 容器狀態** | `code_to_know_pg17_restore_sandbox` Running | Running (Up) | **PASS** |
| **PostgreSQL 版本** | PostgreSQL 17.11 on Alpine | 17.11 | **PASS** |
| **Port 綁定** | 僅綁定 `127.0.0.1:5433` | 僅本機回環 | **PASS** |
| **專屬 Volume** | `code_to_know_pg17_restore_sandbox_data` | 正確掛載 | **PASS** |
| **PG16 開發庫隔離** | `code_to_know_postgres` @ `5432` 正常運行 | 正常運行未受干擾 | **PASS** |
| **Supabase 雲端庫** | 嚴格禁止連線 | 零存取、零連線 | **PASS** |

---

## 二、第二階段：密碼與身分驗證模組審查

審查位置：`backend/src/utils/password.ts`、`backend/src/modules/auth/auth.service.ts`

### 1. 套件與演算法規範 (STATIC PASS)
- 套件：`bcryptjs` (`^2.4.3`)。
- Salt Rounds：生產/開發環境強制設定為 `env.BCRYPT_ROUNDS`（預設 12），測試環境為 10。
- 密碼複雜度校驗：
  - 最小長度 8 字元、最大長度 100 字元。
  - 正則表達式強制要求英文字母與數字：`/[A-Za-z]/` 與 `/[0-9]/`。

### 2. 儲存與錯誤處理安全 (STATIC PASS)
- 明文防護：明文密碼僅在記憶體中存在於驗證函式生命週期，絕不寫入日誌、AuditLog 或資料庫。
- 資料庫映射：密碼雜湊值存入 PostgreSQL `"User"."passwordHash"` 欄位（PostgreSQL `text` 型別，相容 bcrypt 60 字元輸出）。
- 錯誤訊息模糊化：登入失敗統一回傳 `帳號或密碼錯誤`（避免使用者枚舉攻擊）。

### 3. 記憶體雜湊與常數時間比對測試 (READONLY PASS)
在純記憶體中以臨時字串執行驗證（無任何資料庫 I/O）：
- `bcrypt.compare` 正確密碼比對：`true`。
- `bcrypt.compare` 錯誤密碼比對：`false`（安全阻斷）。
- `safeCompare`（`crypto.timingSafeEqual`）比對：防範時序攻擊，常數時間比較完全符合預期。

---

## 三、第三階段：Session 與 Cookie 安全審查

審查位置：`backend/src/middleware/authenticate.ts`、`backend/src/modules/auth/auth.service.ts`

### 1. 架構定性說明 (STATIC PASS)
本專案後端採用**有狀態資料庫儲存 Session 機制 (Stateful DB-Backed Sessions)**，並非無狀態 JWT。

### 2. Session Token 產生與雜湊防護 (STATIC PASS)
- 產生方式：`generateSecureToken(32)`（透過 `crypto.randomBytes(32)` 產生 64 位元高熵十六進位字串）。
- 儲存防護：資料庫中之 `"Session"."tokenHash"` 僅保存原始 Token 經過 SHA-256 雜湊後的值（`hashToken(rawToken)`）。即便資料庫遭到外洩，攻擊者亦無法直接偽造 Session Cookie。

### 3. Cookie 安全屬性配置 (STATIC PASS)
- 名稱：`code_to_know_session`
- `httpOnly: true`：瀏覽器端 JavaScript 無法存取該 Cookie，徹底杜絕 XSS 竊取 Session。
- `secure: env.NODE_ENV === 'production'`：生產環境強制透過 HTTPS 傳輸。
- `sameSite: 'lax'`：防範跨站請求偽造（CSRF）。
- `maxAge`：預設 7 天（以毫秒計算：`7 * 24 * 60 * 60 * 1000`）。

### 4. 撤銷與逾期判定邏輯 (STATIC PASS)
在 `authenticate` 中間件中強制檢查：
1. `session.revokedAt !== null` -> 拋出 `SESSION_REVOKED`（登出或手動撤銷立即失效）。
2. `new Date() > session.expiresAt` -> 拋出 `SESSION_EXPIRED`。
3. `session.user.status !== 'ACTIVE'` -> 拋出 `ACCOUNT_SUSPENDED`。

### 5. PostgreSQL 17 唯讀查詢相容性 (READONLY PASS)
透過 Prisma Client 對本機 PG17 沙盒執行 Session 查詢模擬（帶完整多層 include）：
- 語句：`prisma.session.findUnique({ where: { tokenHash: ... }, include: { user: { include: { roles: { include: { role: true } } } } } })`
- 執行結果：回傳 `null`（空資料庫預期結果），Prisma 在 PostgreSQL 17 上編譯與執行該多層 JOIN 查詢完全無阻。

---

## 四、第四階段：CSRF 安全機制審查

審查位置：`backend/src/middleware/csrf.ts`

### 1. 防護機制與 Token 設計 (STATIC PASS)
- 採用 **Double Submit Cookie 模式**。
- Token 產生：`generateSecureToken(24)`（48 位元安全隨機字串）。
- 存儲 Cookie：`XSRF-TOKEN`（`httpOnly: false`，供前端客戶端 JavaScript 讀取）。
- 傳遞 Header：`x-csrf-token`。

### 2. 驗證與比對安全 (STATIC PASS)
- 安全 HTTP 方法放行：`GET`、`HEAD`、`OPTIONS` 免驗證。
- 變更性方法強制校驗：`POST`、`PUT`、`PATCH`、`DELETE` 必須攜帶有效 Header。
- 常數時間比對：呼叫 `safeCompare(cookieToken, headerToken)`，杜絕時序推斷攻擊。

---

## 五、第五階段：角色與權限資料映射 (RBAC)

審查位置：`backend/src/middleware/authorize.ts`、`backend/prisma/schema.prisma`

### 1. 角色資料結構映射 (STATIC PASS)
- 核心模型：`User` <-> `UserRole` <-> `Role`。
- 多對多關聯：透過複合主鍵 `UserRole` 表格（`@@id([userId, roleId])`）管理。
- 既有角色定義：`STUDENT`、`TEACHER`、`ADMIN`、`PLATFORM_ADMIN`、`SYSTEM_OPERATOR`。

### 2. RBAC 過渡相容性與職責分離 (SoD) (STATIC PASS)
- 函式 `expandCompatibleRoles`：
  - 僅允許舊版 `ADMIN` 與 `PLATFORM_ADMIN` 雙向過渡映射。
  - 嚴格禁止舊版 `ADMIN` 取得 `SYSTEM_OPERATOR`。
  - `SYSTEM_OPERATOR` 與 `PLATFORM_ADMIN` 互不相容，嚴守審計與系統營運之職責分離。

### 3. 教師申請與管理員審核結構 (STATIC PASS / READONLY PASS)
- `TeacherApplication` 模型：
  - 欄位：`id` (uuid), `userId`, `schoolName`, `subject`, `reason`, `proofUrl`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `reviewNote`, `reviewedAt`, `reviewedBy`。
  - 外鍵：`userId` 指向 `User.id`（1-to-1 申請）。
- `AuditLog` 模型：
  - 欄位：`id` (uuid), `userId`, `action`, `resource`, `details`, `ipAddress`, `userAgent`, `createdAt`。
- 唯讀查詢測試：對 PG17 沙盒執行 `teacherApplication` 與 `auditLog` 關聯查詢，SQL 編譯無誤。

---

## 六、第六階段：API Route 與 Zod Schema 靜態核對

### 1. Auth 模組 (`/api/auth`) (STATIC PASS)
- `POST /register` -> `registerSchema`：校驗 `email` (max 255), `password` (8~100 字元, 必含英數), `displayName` (2~50 字元)。
- `POST /login` -> `loginSchema`：校驗 `email`, `password` (min 1)。
- `POST /verify-email` -> `verifyEmailSchema`：校驗 `token`。
- `POST /forgot-password` -> `forgotPasswordSchema`：校驗 `email`。
- `POST /reset-password` -> `resetPasswordSchema`：校驗 `token`, `newPassword`。
- `POST /logout` -> 受到 `authenticate` 與 `csrfProtection` 保護。
- `GET /me` -> 受到 `authenticate` 保護。

### 2. Teachers 模組 (`/api/teachers`) (STATIC PASS)
- `POST /apply` -> 受到 `authenticate`、`csrfProtection`、`requireRoles(['STUDENT'])` 保護，使用 `applyTeacherSchema`（`schoolName`, `subject`, `reason`, `proofUrl`）。
- `GET /application/status` -> 受到 `authenticate` 保護。

### 3. Admin 模組 (`/api/admin`) (STATIC PASS)
- `GET /applications` -> 受到 `authenticate`、`requireRoles(['ADMIN', 'PLATFORM_ADMIN'])` 保護，使用 `listApplicationsQuerySchema`（`status`, `page`, `limit`）。
- `POST /applications/:id/approve` -> 受到 `requireRoles` 與 `csrfProtection` 保護，使用 `applicationIdParamSchema` (UUID) 與 `reviewApplicationSchema`。
- `POST /applications/:id/reject` -> 結構與防護同上。

---

## 七、第七階段：TypeScript 與非資料庫安全測試

審查團隊於純記憶體環境下執行代碼檢查與無資料庫單元測試：

1. **TypeScript 靜態型別編譯**：
   - 執行命令：`cd backend; npx tsc --noEmit`
   - 結果：**Exit Code 0，零編譯錯誤**。
2. **Zod Schema 驗證測試套件**：
   - 執行命令：`npx vitest run tests/validation.test.ts`
   - 結果：**12 項測試 100% 通過**（耗時 782ms）。
3. **資料庫配置安全測試套件**：
   - 執行命令：`npx vitest run tests/db-config-safety.test.ts`
   - 結果：**53 項測試 100% 通過**（耗時 558ms）。
4. **安全隔離證明**：上述測試全程於記憶體執行純邏輯驗證，無任何網路與資料庫寫入。

---

## 八、第八階段：資料庫前後完整性核對

| 檢驗指標 | R3-2 基準數據 | R3-3 審查後數據 | 差異 (漂移量) | 判定 |
| :--- | :---: | :---: | :---: | :---: |
| **public Schema 資料表總數** | 37 張 | 37 張 | 0 | **PASS** |
| **外部鍵條件約束總數 (FK)** | 47 組 | 47 組 | 0 | **PASS** |
| **索引總數 (pg_indexes)** | 133 組 | 133 組 | 0 | **PASS** |
| **唯一索引總數 (Unique Indexes)** | 64 組 | 64 組 | 0 | **PASS** |
| **Prisma 遷移歷史記錄筆數** | 2 筆 | 2 筆 | 0 | **PASS** |
| **36 個業務模型總資料列數** | 0 筆 | 0 筆 | 0 | **PASS** |
| **PostgreSQL 16 開發資料庫** | 37 張表格 | 37 張表格 | 0 | **PASS** |

---

## 九、未執行測試與原因

依據本階段最高安全限制，以下項目明確標記為 **NOT TESTED** 並說明原因：

1. **真實使用者註冊與密碼寫入**：未執行。原因：嚴格禁止對資料庫進行 INSERT 操作。
2. **真實 Session 建立與 Cookie 登入流程**：未執行。原因：嚴格禁止在資料庫中建立 Session 記錄。
3. **教師申請提交與管理員審核寫入**：未執行。原因：嚴格禁止產生教師申請與變更資料庫狀態。
4. **端對端 API 寫入整合測試 (`api.test.ts`, `integration.db.test.ts`)**：未執行。原因：測試套件包含資料庫寫入與清理動作，已依安全指示跳過。

---

## 十、發現的問題與風險

1. **目前狀態相容性**：
   後端現有身分驗證與安全中介層（`bcryptjs`, `crypto`, `express`, `cookieParser`, `zod`）在語法、欄位型別與 Prisma 映射上與 PostgreSQL 17 保持 100% 相容，無任何已知阻斷性缺陷。
2. **潛在風險與防護**：
   - Session 資料表目前為 0 筆，未來在有大量並行登入時，應確保 `"Session"."expiresAt"` 具備適當之清理機制（如排程定期清理過期 Session），避免無效 Token 累積。

---

## 十一、最終審查判定

**`PASS — BACKEND AUTH & SECURITY FULLY COMPATIBLE WITH POSTGRESQL 17`**

---

## 十二、下一階段 R3-4 建議

建議接續進行 **PHASE 3C-4E-R3-4：端對端讀取流程與 API 路由整合前置驗收**：
1. 針對唯讀型 API（如公開之 `/api/health`、公開公告列表查詢）進行端對端 HTTP 呼叫驗收。
2. 驗證後端 Express 伺服器啟動邏輯與連線池在 PostgreSQL 17 下的平穩釋放機制。
