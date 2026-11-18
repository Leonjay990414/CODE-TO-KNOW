# CODE TO KNOW｜第 0 波・第一批：全專案 API 與後端端點清冊
# (MASTER_API_INVENTORY.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-API-INVENTORY  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**盤點範圍**：`backend/src/app.ts`, `backend/src/modules/**/*`, `frontend/src/services/api.ts`, `backend/tests/*`。

---

## 1. 後端架構與全域安全防護機制 (Section F 審查)

- **Express 應用核心** (`backend/src/app.ts`)：
  - 整合 Helmet 標頭防護、CORS 憑證白名單、Cookie Parser (Signed Cookie)。
  - 全域通用限流器 `generalRateLimiter` (100 req/min)。
  - 雙重防禦 Cookie CSRF 防禦管線。
  - 全域例外錯誤捕捉器 `errorHandler`，強制進行日誌敏感資訊去識別化 (`redaction.ts`)。
- **前端 API 客戶端** (`frontend/src/services/api.ts`)：
  - 支援「正式 API」與「展示模式 (Demo Mode)」雙軌運行。
  - 當 `VITE_DEMO_MODE=true` 或無後端連線時，自動以 `sessionStorage` 降級提供服務，保證前端無白屏。

---

## 2. 後端 API 21 個正式端點完整規格矩陣

| 編號 | HTTP Method & Path | 功能名稱 | 所屬模組 | 目標使用者 | 所需角色 | Request 格式 (Zod Schema) | Response 狀態碼與格式 | 資料來源 | DB讀取 | DB寫入 | 安全驗證與防護 | 對應前端頁面 | 涵蓋測試檔案 | 實際狀態 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **01** | `GET /api/health` | 系統健康檢查 | 系統監控 | 所有人 | 公開 | 無 | 200/503: `{ status, database: { status, latencyMs } }` | PG17 資料庫 | 是 (`SELECT 1`) | 否 | 限流防護 | `SystemOpsDashboardPage.tsx` | `tests/api.test.ts` | **PASS** |
| **02** | `GET /api/auth/csrf-token` | 取得 CSRF 權杖 | 認證 | 所有人 | 公開 | 無 | 200: `{ success: true, data: { csrfToken } }` | Session/Cookie | 否 | 否 | 雙重 Cookie 簽章 | `api.ts: getCsrfToken()` | `tests/security.test.ts` | **PASS** |
| **03** | `POST /api/auth/register` | 使用者註冊 | 認證 | 訪客 | 訪客 | Body: `{ email, password, displayName }` | 201: `{ user }`<br>400/409 | `User`, `Role`, `UserProfile` | 是 | 是 | CSRF, Zod, bcrypt 鹽值雜湊 | `AuthModal.tsx` | `tests/auth-lifecycle.test.ts` | **PASS** |
| **04** | `POST /api/auth/login` | 使用者登入 | 認證 | 訪客 | 訪客 | Body: `{ email, password }` | 200: `{ user }` (設 HttpOnly Cookie)<br>401 | `User`, `Session` | 是 | 是 | CSRF, Zod, 敏感密碼比對 | `AuthModal.tsx` | `tests/auth-lifecycle.test.ts` | **PASS** |
| **05** | `POST /api/auth/verify-email` | 驗證信箱 | 認證 | 所有人 | 公開 | Body: `{ token }` | 200: `{ success: true }`<br>400/404 | `EmailVerificationToken`, `User` | 是 | 是 | 一次性高熵 Token 查核 | 獨立信件驗證頁 | `tests/auth-lifecycle.test.ts` | **PASS** |
| **06** | `POST /api/auth/forgot-password` | 請求重設密碼 | 認證 | 所有人 | 公開 | Body: `{ email }` | 200: `{ success: true }` | `User`, `PasswordResetToken` | 是 | 是 | CSRF, 離線 Mock 發信佇列 | `AuthModal.tsx` | `tests/auth-lifecycle.test.ts` | **PASS** |
| **07** | `POST /api/auth/reset-password` | 重設密碼執行 | 認證 | 所有人 | 公開 | Body: `{ token, newPassword }` | 200: `{ success: true }`<br>400/404 | `PasswordResetToken`, `User` | 是 | 是 | CSRF, Token 逾期校驗 | 獨立密碼重設頁 | `tests/auth-lifecycle.test.ts` | **PASS** |
| **08** | `POST /api/auth/logout` | 使用者登出 | 認證 | 登入者 | 登入者 | 無 (清除 Session Cookie) | 200: `{ success: true }` | `Session` | 是 | 是 | CSRF, Cookie 註銷 | `Navbar.tsx` | `tests/auth-lifecycle.test.ts` | **PASS** |
| **09** | `GET /api/auth/me` | 取得當前身分 | 認證 | 登入者 | 登入者 | 無 | 200: `{ user: { id, email, roles } }`<br>401 | `User`, `UserRole`, `UserProfile` | 是 | 否 | JWT 解析, RBAC | `AuthContext.tsx` | `tests/rbac-workflow.test.ts` | **PASS** |
| **10** | `POST /api/teachers/applications` | 提交教師資格申請 | 教師 | 學生 | STUDENT | Body: `{ schoolName, subject, reason, certificateUrl }` | 201: `{ application }`<br>400/409 | `TeacherApplication`, `AuditLog` | 是 | 是 | CSRF, JWT, 重複申請攔截 | `TeacherApplyModal.tsx` | `tests/rbac-workflow.test.ts` | **PASS** |
| **11** | `GET /api/teachers/my-application`| 查詢申請審核進度 | 教師 | 申請者 | STUDENT / TEACHER | 無 | 200: `{ application }`<br>401 | `TeacherApplication` | 是 | 否 | JWT 認證 | `TeacherApplyModal.tsx` | `tests/rbac-workflow.test.ts` | **PASS** |
| **12** | `GET /api/admin/teacher-applications`| 審核清單查詢 | 管理員 | 管理員 | ADMIN | Query: `{ status?, page?, limit? }` | 200: `{ applications, pagination }`<br>403 | `TeacherApplication`, `User` | 是 | 否 | JWT, RBAC(ADMIN) | `AdminDashboardPage.tsx` | `tests/admin-hardening.test.ts`| **PASS** |
| **13** | `POST /api/admin/teacher-applications/:id/approve`| 核准教師資格 | 管理員 | 管理員 | ADMIN | Path: `id`, Body: `{ note? }` | 200: `{ application }`<br>403/404 | `TeacherApplication`, `UserRole`, `Role` | 是 | 是 | CSRF, RBAC(ADMIN), 審計寫入 | `AdminDashboardPage.tsx` | `tests/admin-hardening.test.ts`| **PASS** |
| **14** | `POST /api/admin/teacher-applications/:id/reject` | 駁回教師資格 | 管理員 | 管理員 | ADMIN | Path: `id`, Body: `{ reason }` | 200: `{ application }`<br>403/404 | `TeacherApplication`, `AuditLog` | 是 | 是 | CSRF, RBAC(ADMIN), 審計寫入 | `AdminDashboardPage.tsx` | `tests/admin-hardening.test.ts`| **PASS** |
| **15** | `GET /api/admin/audit-logs` | 系統審計日誌查詢 | 管理員 | 管理員 | ADMIN | Query: `{ action?, page?, limit? }` | 200: `{ logs, pagination }`<br>403 | `AuditLog`, `User` | 是 | 否 | JWT, RBAC(ADMIN), 個資脫敏 | `AdminDashboardPage.tsx` | `tests/audit-redaction.test.ts` | **PASS** |
| **16** | `POST /api/classrooms` | 建立教學班級 | 班級 | 教師 | TEACHER / ADMIN | Body: `{ name, description?, certificationId }` | 201: `{ classroom: { id, joinCode } }` | `Class` | 是 | 是 | CSRF, 6碼高熵代碼產生器 | `TeacherDashboardPage.tsx` | `tests/classroom-routes.test.ts`| **PASS** |
| **17** | `GET /api/classrooms/my-teaching` | 查詢指導班級列表 | 班級 | 教師 | TEACHER / ADMIN | 無 | 200: `{ classrooms }`<br>403 | `Class`, `ClassEnrollment` | 是 | 否 | JWT, RBAC(TEACHER) | `TeacherDashboardPage.tsx` | `tests/classroom-routes.test.ts`| **PASS** |
| **18** | `GET /api/classrooms/my-enrolled` | 查詢已加入班級 | 班級 | 學生 | STUDENT | 無 | 200: `{ enrolled }`<br>401 | `ClassEnrollment`, `Class` | 是 | 否 | JWT 認證 | `StudentDashboardPage.tsx` | `tests/classroom-routes.test.ts`| **PASS** |
| **19** | `POST /api/classrooms/join` | 學生加入班級 | 班級 | 學生 | STUDENT | Body: `{ joinCode, seatNumber? }` | 200: `{ enrollmentId, className }`<br>404/409 | `Class`, `ClassEnrollment` | 是 | 是 | CSRF, 班級代碼比對, 重複加入攔截 | `StudentClassJoinModal.tsx` | `tests/join-code.test.ts` | **PASS** |
| **20** | `GET /api/classrooms/:id/members` | 查詢班級學員名冊 | 班級 | 師生 | 班級老師或成員 | Path: `id` | 200: `{ class, members }`<br>403/404 | `Class`, `ClassEnrollment`, `User` | 是 | 否 | IDOR 越權防護檢查 | `TeacherDashboardPage.tsx` | `tests/idor-ownership.test.ts` | **PASS** |
| **21** | `DELETE /api/classrooms/:id/members/:studentId` | 移除班級學員 | 班級 | 教師 | 該班級建立者 | Path: `id`, `studentId` | 200: `{ success: true }`<br>403/404 | `Class`, `ClassEnrollment` | 是 | 是 | CSRF, IDOR 嚴格所有權檢查 | `TeacherDashboardPage.tsx` | `tests/idor-ownership.test.ts` | **PASS** |

---

## 3. 單元測試覆蓋與品質指標

- **端點測試覆蓋率**：100%（21/21 端點全數在 `backend/tests/` 具備自動化測試案例）。
- **測試案例通過數**：221 個離線測試案例全數通過，涵蓋非法參數、越權查詢 (IDOR)、未登入攔截與 Token 竄改防護。
