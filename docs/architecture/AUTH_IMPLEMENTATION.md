# 碼上學｜CODE TO KNOW

# 身分驗證與權限架構實作報告（AUTH IMPLEMENTATION）

- **品牌名稱**：碼上學｜CODE TO KNOW
- **系統名稱**：碼上學 AI 智慧學習與教育科技平台
- **文件版本**：1.0
- **實作狀態**：完成後端與前端身分模組整合
- **文件路徑**：`docs/architecture/AUTH_IMPLEMENTATION.md`

---

## 1. 核心安全架構與原則實踐

依據專案核心規則與架構文件規範，本次建置完成以下安全防護體系：

1. **角色分立與防竄改（RBAC）**：
   - 註冊端點（`POST /api/auth/register`）一律強制賦予 `STUDENT` 角色。前端傳遞的任何角色欄位均被忽視，杜絕前端提權風險。
   - 教育者身分嚴格採「申請與審核制」。使用者必須先完成註冊登入，再透過 `POST /api/teachers/applications` 提交任教證明。
   - 未經管理員審核前，使用者僅保有 `STUDENT` 權限；審核通過後，系統在事務（Transaction）內將角色賦予 `TEACHER`。
   - 管理員（`ADMIN`）不開放公開註冊，必須透過離線指令碼 `backend/scripts/create-admin.ts` 建立。

2. **憑證與 Session 安全**：
   - 密碼使用 `bcryptjs` 進行單向加鹽雜湊（生產與開發環境 Cost Factor = 12）。
   - 使用者登入後，後端產生 256 位元高強度隨機 Session Token。
   - 原始 Token 透過 `httpOnly`、`sameSite: 'lax'` Cookie 發送至瀏覽器，杜絕 JavaScript XSS 竊取憑證。
   - 資料庫僅儲存 Token 之 SHA-256 雜湊值（`tokenHash`）。即使資料庫遭到外洩，攻擊者亦無法直接偽造 Session。
   - 使用者登出或修改密碼時，相關 Session 即刻標記為 `revokedAt` 廢止。

3. **CSRF 防護機制**：
   - 採用 Double Submit Cookie 架構，發放 `XSRF-TOKEN` Cookie。
   - 針對所有具狀態變更（Mutating）之請求（`POST`, `PUT`, `PATCH`, `DELETE`），後端驗證 `x-csrf-token` Header 與 Cookie 之一致性。

4. **安全稽核日誌（AuditLog）**：
   - 完整記錄重要安全事件：`USER_REGISTER`、`USER_LOGIN`、`USER_LOGOUT`、`TEACHER_APPLICATION_SUBMITTED`、`TEACHER_APPLICATION_APPROVED`、`TEACHER_APPLICATION_REJECTED` 等，包含 IP 與 User-Agent。

---

## 2. API 端點清單

### 認證與帳號（Auth Module）

| 方法 | 端點路徑 | 權限需求 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/csrf-token` | 公開 | 取得並設定 CSRF 防護憑證 |
| `POST` | `/api/auth/register` | 公開 + 頻率限制 | 註冊新學員帳號（一律為 STUDENT） |
| `POST` | `/api/auth/login` | 公開 + 頻率限制 | 使用者登入（核發 httpOnly Session Cookie） |
| `POST` | `/api/auth/logout` | 登入者 | 登出並撤銷 Session |
| `GET` | `/api/auth/me` | 登入者 | 取得當前登入者資訊、角色與申請進度 |
| `POST` | `/api/auth/verify-email` | 公開 | 驗證電子信箱憑證 |
| `POST` | `/api/auth/forgot-password` | 公開 | 申請密碼重設信件 |
| `POST` | `/api/auth/reset-password` | 公開 | 以安全 Token 重設密碼 |

### 教育者申請（Teachers Module）

| 方法 | 端點路徑 | 權限需求 | 說明 |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/teachers/applications` | 登入學員 | 提交教育者身分審核申請 |
| `GET` | `/api/teachers/my-application` | 登入者 | 查詢個人最新教師身分申請進度與備註 |

### 管理員審核（Admin Module）

| 方法 | 端點路徑 | 權限需求 | 說明 |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/teacher-applications` | `ADMIN` 角色 | 分頁檢視待審核、已核准或退回之教師申請 |
| `POST` | `/api/admin/teacher-applications/:id/approve` | `ADMIN` 角色 | 核准教師身分，系統自動賦予 `TEACHER` 角色 |
| `POST` | `/api/admin/teacher-applications/:id/reject` | `ADMIN` 角色 | 退回教師身分申請並填寫審核意見 |
| `GET` | `/api/admin/audit-logs` | `ADMIN` 角色 | 查詢全平台安全與稽核日誌 |

---

## 3. 前端整合

- 服務封裝：`frontend/src/services/api.ts`（支援 `credentials: 'include'` 與自動 CSRF 憑證配對）。
- 登入視窗：`frontend/src/components/AuthModal.tsx`（已解除展示用 disabled，支援登入/註冊模式切換、表單驗證、載入狀態、教師審核提示與錯誤處理）。
