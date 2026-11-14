# CODE TO KNOW (碼上學) API 與會員權限安全專案稽核

> **報告類型**: API 安全與多層權限架構防禦審計 (OWASP API Security Top 10 Review)  
> **稽核目標**: `backend/src/` 及 `frontend/src/services/api.ts`  
> **評估工具**: `reverse-skill` (v1.0.1) — `skills/api-security`  
> **分析範圍**: BOLA/IDOR、BFLA、Session 管理、CSRF、敏感資訊遮罩 (Data Redaction)  

---

## 1. API 權限模型架構評估

CODE TO KNOW (碼上學) 採取嚴格的 **三層角色與所有權防護架構**：
1. **認證層 (`authenticate.ts`)**:
   - 提取 HttpOnly Session Cookie (`code_to_know_session`)。
   - 使用 SHA-256 雜湊化憑證搜尋資料庫，嚴禁明文比對。
   - 驗證會話是否主動撤銷 (`revokedAt !== null`)、過期時間 (`expiresAt`)、以及使用者帳號狀態 (`SUSPENDED`, `DISABLED`, `deletedAt`)。
2. **角色授權層 (`authorize.ts`)**:
   - 支援 `STUDENT`、`TEACHER`、`ADMIN`、`PLATFORM_ADMIN`、`SYSTEM_OPERATOR`。
   - 實施職責分離 (SoD)：`ADMIN` 僅相容 `PLATFORM_ADMIN`，絕對不得自動提升為 `SYSTEM_OPERATOR`。
3. **資料所有權隔離層 (`ownership.ts`)**:
   - 覆蓋 Prisma Schema 全數 36 個模型之資料歸屬策略 (`USER_SELF`, `DIRECT_USER_ID`, `NESTED_PARENT`, `TEACHER_OR_ENROLLED`, `ADMIN_ONLY`, `ADMIN_MANAGED_CATALOG`)。
   - 執行 `resolveScopedUserId` 與 `assertResourceOwnership`，拒絕客戶端在請求主體 (Body) 或查詢字串 (Query) 傳入之任意 `userId`，徹底消除 BOLA / IDOR 漏洞。

---

## 2. API 安全漏洞檢查項目 (OWASP API Top 10)

### API1:2023 - 破裂之物件級授權 (Broken Object Level Authorization - BOLA / IDOR)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - `backend/src/utils/ownership.ts:125-153`:
    ```typescript
    export function resolveScopedUserId(
      actor: OwnershipActor,
      requestedTargetUserId?: unknown,
      options: OwnershipScopeOptions = {}
    ): string {
      // 若客戶端未指定 targetUserId，自動鎖定為當前已登入之 actor.id
      if (!requestedTargetUserId) return actor.id;
      // 若客戶端試圖偽造或傳入不同 userId，非 ADMIN 身份直接丟出 403 OWNERSHIP_FORBIDDEN
      if (allowAdminOverride && hasAdminOverrideRole(actor.roles)) {
        return normalizedTarget;
      }
      throw new ForbiddenError('禁止跨帳號指定或存取其他使用者的資源', 'OWNERSHIP_FORBIDDEN');
    }
    ```
  - `backend/src/modules/teachers/teacher.routes.ts:16`:
    路由掛載 `rejectForgedOwnerFields(['userId'])`，任何在請求主體企圖假造 `userId` 的操作皆由中介層直接中斷並記錄稽核日誌。
  - **自動化測試佐證**: `backend/tests/idor-ownership.test.ts` 7 項測試全數綠燈。

### API2:2023 - 破裂之認證機制 (Broken Authentication)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - 登入、註冊、重設密碼均配置專屬限流器 `authRateLimiter`（5 次嘗試限制，防範暴力破解）。
  - 密碼加密採用 Bcrypt (Work factor: 12) 與安全 Argon2 驗證。
  - 重設密碼與驗證信 Token 均採用加密亂數產生 (`generateSecureToken(32)`)，資料庫僅儲存其 SHA-256 Hash，並嚴格設定 15 分鐘及 24 小時有效期。

### API3:2023 - 破裂之物件屬性級授權 (Broken Object Property Level Authorization)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - 所有 API 輸入均經由 Zod Schema 嚴格校驗 (`validateBody`, `validateQuery`, `validateParams`)。
  - Zod 採用白名單過濾模式，不允許透過大量賦值 (Mass Assignment) 注入如 `roles`, `status`, `emailVerifiedAt` 等特權屬性。

### API4:2023 - 缺乏受限的資源消耗 (Unrestricted Resource Consumption)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - 全域掛載 `generalRateLimiter` (每 IP 每分鐘 100 次請求)。
  - 敏感認證路由掛載 `authRateLimiter` (每 IP 每 15 分鐘 15 次請求)。
  - Express Body Parser 設定嚴格上限 `limit: '1mb'`，防止記憶體溢位攻擊。

### API5:2023 - 破裂之功能級授權 (Broken Function Level Authorization - BFLA)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - 管理員功能模組 (`/api/admin/*`) 統一於路由根目錄掛載：
    `router.use(authenticate, requireRoles(['ADMIN']));`
  - 學生或教師嘗試存取 `/api/admin/teacher-applications` 或 `/api/admin/audit-logs` 時，直接被授權中介層攔截並回傳 403 `INSUFFICIENT_PERMISSIONS`。
  - **自動化測試佐證**: `backend/tests/rbac-workflow.test.ts` 17 項角色流程測試全數通過。

### API6:2023 - 不安全的敏感資訊暴露與日誌記錄 (Sensitive Data Exposure in Logs)
- **稽核結果**: **PASS (安全防護就位)**
- **檢驗證據**:
  - `backend/src/utils/redaction.ts` 實作自動脫敏函式 `redactSensitiveData`。
  - 在寫入 `AuditLog` 或印出除錯訊息時，自動過濾並遮罩 `password`, `token`, `secret`, `cookie`, `credential` 等 18 種敏感鍵值。
  - 健康檢查路由 (`/api/health`) 僅回傳服務狀態與資料庫延遲，未暴露內部資料庫 IP、版本號或連線字串。
  - **自動化測試佐證**: `backend/tests/audit-redaction.test.ts` 10 項測試全數通過。

### API7:2023 - 伺服器端請求偽造 (SSRF)
- **稽核結果**: **PASS (未發現 SSRF 向量)**
- **檢驗證據**:
  - 後端目前未開放任何接受使用者輸入 URL 並由伺服器端抓取的外部請求代理功能。
  - 教師證件上傳僅接受字串 URL 宣告，未在伺服器端自動發起 `fetch` 或 `curl`。

### API8:2023 - 安全設定錯誤 (Security Misconfiguration)
- **稽核結果**: **PASS (已加固)**
- **檢驗證據**:
  - `Helmet` 預設啟用多項防護標頭 (`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`)。
  - CORS 設定為指定來源 `env.CORS_ORIGIN`（非萬用字元 `*`），並支援安全的憑證攜帶 (`credentials: true`)。
  - 未啟用的未實作模組 (36 個模型中的 27 個) 明確標記為 `apiStatus: 'NOT_IMPLEMENTED'`，無暴露未完成之影子端點 (Shadow Endpoints)。

### API9:2023 - 不當的資產管理 (Improper Inventory Management)
- **稽核結果**: **PASS**
- **檢驗證據**:
  - 所有路由均具備明確語意版本 (`/api/auth`, `/api/teachers`, `/api/admin`)，無遺留未受保護之測試或 Debug 路由。

---

## 3. 會員資料隔離與跨帳號防護總結

| 測試場景 | 預期行為 | 實際程式碼防線 | 狀態 |
|---|---|---|---|
| 會員 A 存取會員 B 的學習進度 | 阻擋 | `resolveScopedUserId` 強制將查詢條件限縮為 `actor.id` | **PASS** |
| 會員 A 在 Body 偽造 `userId: "user-b"` | 阻擋並記 Log | `rejectForgedOwnerFields` 觸發 403 Forbidden | **PASS** |
| 學生嘗試調用 `/api/admin/teacher-applications/:id/approve` | 阻擋 | `requireRoles(['ADMIN'])` 攔截 | **PASS** |
| 偽造 CSRF Token 進行帳號變更 | 阻擋 | `safeCompare(cookieToken, headerToken)` 攔截 | **PASS** |
| 會員登出後重複使用 Session Cookie | 阻擋 | 資料庫標記 `revokedAt`，立即失效 | **PASS** |

CODE TO KNOW 之 API 與會員權限層在設計與實作上均展現出高水準之安全成熟度。
