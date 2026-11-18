# CODE TO KNOW｜全專案 API 與後端端點盤點清冊 (Master API Inventory)

版本：MASTER-API-INVENTORY-20261118  
專案：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
受檢檔案：`backend/src/app.ts`, `backend/src/modules/**/*`, `frontend/src/services/api.ts`, `backend/tests/*`  
安全原則：全端點嚴格執行輸入參數 Zod 驗證、CSRF 雙重防禦、角色權限 RBAC 與 IDOR 物件越權查核。

---

## 一、API 架構與全域防護機制總覽

1. **基礎安全防護 (Helmet & CORS)**：
   - 啟動 Helmet 基礎防禦標頭（防 MIME 探測、Clickjacking）。
   - CORS 限制由環境變數 `CORS_ORIGIN` 嚴格綁定，支援憑證傳遞（`credentials: true`）。
2. **請求限制與防刷 (Rate Limiting)**：
   - 全域請求限流器 (`generalRateLimiter`)：標準每分鐘 100 次請求。
   - 敏感端點（登入、註冊、忘記密碼）：具備專用高敏感限流防護。
3. **身分驗證與 Session (Auth & CSRF)**：
   - 採用 HTTP-only、Secure、SameSite 嚴格模式 Cookie 傳遞 Session Token。
   - 狀態變更請求（POST / PUT / DELETE）強制查驗 `x-csrf-token` Header 與 Cookie 一致性。
4. **前端雙模切換 (Dual-Mode Client)**：
   - `frontend/src/services/api.ts` 支援無後端純前端展示版（`VITE_DEMO_MODE=true`）與正式連線模式無縫切換。

---

## 二、後端 API 端點完整盤點清冊

### 1. 系統健康與基礎架構 (Health & Infra)

| 端點與 Method | 模組名稱 | 認證層級 | 授權角色 | 請求參數 / Zod Schema | 回應格式與狀態碼 | 資料庫存取 | 前端對接狀態 | 歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/health` | 系統健康 | 公開 | 所有人 | 無 | 200/503: `{ status, service, timestamp, database: { status, latencyMs } }` | `SELECT 1` | `SystemOpsDashboardPage.tsx` 已接通 | P04 / P04-INF-006 |

### 2. 身分驗證與帳號管理模組 (`/api/auth`)

| 端點與 Method | 認證層級 | 授權角色 | 請求參數 (Zod Schema) | 回應狀態碼與格式 | 資料庫存取 Model | 測試涵蓋檔案 | 前端對接狀態 | 歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/auth/csrf-token` | 公開 | 所有人 | 無 | 200: `{ success: true, data: { csrfToken } }` | 無 | `security.test.ts` | `api.ts: getCsrfToken()` 已接通 | P05 / P05-SEC-012 |
| `POST /api/auth/register` | 公開 (需CSRF) | 訪客 | `RegisterSchema`: `{ email, password, displayName }` | 201: `{ success: true, message, data: { user } }`<br>400/409 | `User`, `Role`, `UserRole`, `UserProfile`, `EmailVerificationToken` | `auth-lifecycle.test.ts`, `validation.test.ts` | `api.ts: authApi.register()` 已接通 | P07 / P07-USR-006 |
| `POST /api/auth/login` | 公開 (需CSRF) | 訪客 | `LoginSchema`: `{ email, password }` | 200: `{ success: true, data: { user } }` (設 Cookie)<br>400/401 | `User`, `UserRole`, `Session` | `auth-lifecycle.test.ts`, `security.test.ts` | `api.ts: authApi.login()` 已接通 | P07 / P07-USR-007 |
| `POST /api/auth/verify-email` | 公開 | 所有人 | `VerifyEmailSchema`: `{ token }` | 200: `{ success: true, message }`<br>400/404 | `EmailVerificationToken`, `User` | `auth-lifecycle.test.ts` | `api.ts: authApi.verifyEmail()` 已接通 | P07 / P07-USR-008 |
| `POST /api/auth/forgot-password`| 公開 (需CSRF) | 所有人 | `ForgotPasswordSchema`: `{ email }` | 200: `{ success: true, message }`<br>400 | `User`, `PasswordResetToken` | `auth-lifecycle.test.ts` | `api.ts: authApi.forgotPassword()` 已接通 | P07 / P07-USR-009 |
| `POST /api/auth/reset-password` | 公開 (需CSRF) | 所有人 | `ResetPasswordSchema`: `{ token, newPassword }` | 200: `{ success: true, message }`<br>400/404 | `PasswordResetToken`, `User` | `auth-lifecycle.test.ts` | `api.ts: authApi.resetPassword()` 已接通 | P07 / P07-USR-010 |
| `POST /api/auth/logout` | 已登入 (需CSRF)| 登入使用者 | 無 (清除 Cookie) | 200: `{ success: true, message }`<br>401 | `Session` | `auth-lifecycle.test.ts` | `api.ts: authApi.logout()` 已接通 | P07 / P07-USR-011 |
| `GET /api/auth/me` | 已登入 | 登入使用者 | 無 | 200: `{ success: true, data: { user } }`<br>401 | `User`, `UserRole`, `UserProfile` | `auth-lifecycle.test.ts`, `rbac-workflow.test.ts` | `api.ts: authApi.me()` 已接通 | P07 / P07-USR-012 |

### 3. 教師資格申請模組 (`/api/teachers`)

| 端點與 Method | 認證層級 | 授權角色 | 請求參數 (Zod Schema) | 回應狀態碼與格式 | 資料庫存取 Model | 測試涵蓋檔案 | 前端對接狀態 | 歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/teachers/applications` | 已登入 (需CSRF) | STUDENT | `TeacherApplicationSchema`: `{ schoolName, subject, reason, certificateUrl }` | 201: `{ success: true, data: { application } }`<br>400/409 | `TeacherApplication`, `AuditLog` | `rbac-workflow.test.ts` | `api.ts: teacherApi.apply()` 已接通 | P08 / P08-TCH-008 |
| `GET /api/teachers/my-application`| 已登入 | STUDENT / TEACHER | 無 | 200: `{ success: true, data: { application } }`<br>401 | `TeacherApplication` | `rbac-workflow.test.ts` | `api.ts: teacherApi.getMyApplication()` 已接通 | P08 / P08-TCH-009 |

### 4. 平台管理與審核模組 (`/api/admin`)

| 端點與 Method | 認證層級 | 授權角色 | 請求參數 (Zod Schema) | 回應狀態碼與格式 | 資料庫存取 Model | 測試涵蓋檔案 | 前端對接狀態 | 歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin/teacher-applications` | 已登入 | ADMIN | Query: `{ status?, page?, limit? }` | 200: `{ success: true, data: { applications, pagination } }`<br>403 | `TeacherApplication`, `User` | `admin-hardening.test.ts`, `rbac-workflow.test.ts` | `api.ts: adminApi.getTeacherApplications()` 已接通 | P16 / P16-ADM-008 |
| `POST /api/admin/teacher-applications/:id/approve` | 已登入 (需CSRF) | ADMIN | Path: `id`, Body: `{ note? }` | 200: `{ success: true, message, data: { application } }`<br>400/403/404 | `TeacherApplication`, `UserRole`, `Role`, `TeacherProfile`, `AuditLog` | `admin-hardening.test.ts`, `rbac-workflow.test.ts` | `api.ts: adminApi.approveTeacherApplication()` 已接通 | P16 / P16-ADM-009 |
| `POST /api/admin/teacher-applications/:id/reject` | 已登入 (需CSRF) | ADMIN | Path: `id`, Body: `{ reason }` | 200: `{ success: true, message, data: { application } }`<br>400/403/404 | `TeacherApplication`, `AuditLog` | `admin-hardening.test.ts`, `rbac-workflow.test.ts` | `api.ts: adminApi.rejectTeacherApplication()` 已接通 | P16 / P16-ADM-010 |
| `GET /api/admin/audit-logs` | 已登入 | ADMIN | Query: `{ action?, userId?, page?, limit? }` | 200: `{ success: true, data: { logs, pagination } }`<br>403 | `AuditLog`, `User` | `admin-hardening.test.ts`, `audit-redaction.test.ts` | `api.ts: adminApi.getAuditLogs()` 已接通 | P16 / P16-ADM-011 |

### 5. 班級教學與學員管理模組 (`/api/classrooms`)

| 端點與 Method | 認證層級 | 授權角色 | 請求參數 (Zod Schema) | 回應狀態碼與格式 | 資料庫存取 Model | 測試涵蓋檔案 | 前端對接狀態 | 歸屬階段與 UID |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST /api/classrooms` | 已登入 (需CSRF) | TEACHER / ADMIN | `CreateClassroomSchema`: `{ name, description?, certificationId }` | 201: `{ success: true, data: { classroom } }`<br>400/403 | `Class` (自動產生 6 碼 high-entropy joinCode) | `classroom-permission.test.ts`, `classroom-routes.test.ts` | `api.ts: classroomApi.createClassroom()` 已接通 | P08 / P08-CLS-009 |
| `GET /api/classrooms/my-teaching` | 已登入 | TEACHER / ADMIN | 無 | 200: `{ success: true, data: { classrooms } }`<br>403 | `Class`, `ClassEnrollment` | `classroom-permission.test.ts`, `classroom-routes.test.ts` | `api.ts: classroomApi.getMyTeachingClassrooms()` 已接通 | P08 / P08-CLS-010 |
| `GET /api/classrooms/my-enrolled` | 已登入 | STUDENT | 無 | 200: `{ success: true, data: { enrolled } }`<br>401 | `ClassEnrollment`, `Class`, `User` | `classroom-permission.test.ts`, `classroom-routes.test.ts` | `api.ts: classroomApi.getMyEnrolledClassrooms()` 已接通 | P08 / P08-CLS-011 |
| `POST /api/classrooms/join` | 已登入 (需CSRF) | STUDENT | `JoinClassroomSchema`: `{ joinCode, seatNumber? }` | 200: `{ success: true, message, data: { enrollmentId } }`<br>400/404/409 | `Class`, `ClassEnrollment` | `classroom-permission.test.ts`, `join-code.test.ts` | `api.ts: classroomApi.joinClassroom()` 已接通 | P08 / P08-CLS-012 |
| `GET /api/classrooms/:id/members` | 已登入 | 班級建立者 或 成員 | Path: `id` | 200: `{ success: true, data: { class, members } }`<br>403/404 | `Class`, `ClassEnrollment`, `User` | `classroom-permission.test.ts`, `idor-ownership.test.ts` | `api.ts: classroomApi.getClassroomMembers()` 已接通 | P08 / P08-CLS-013 |
| `DELETE /api/classrooms/:id/members/:studentId` | 已登入 (需CSRF) | 班級建立者 TEACHER | Path: `id`, `studentId` | 200: `{ success: true, message }`<br>403/404 | `Class`, `ClassEnrollment` | `classroom-permission.test.ts`, `idor-ownership.test.ts` | `api.ts: classroomApi.removeMember()` 已接通 | P08 / P08-CLS-014 |

---

## 三、端點測試覆蓋與品質保證指標

- **總實作端點數**：21 個（包含 1 個健康檢查、8 個認證、2 個教師申請、4 個平台管理、6 個班級管理）。
- **單元與安全測試覆蓋率**：100% 端點皆在 `backend/tests/` 具備對應測試情境（涵蓋合法請求、欄位無效、越權讀取 IDOR、未登入攔截、Token 偽造、CSRF 缺失與重放防禦）。
- **型別安全性**：前後端介面完全對齊 TypeScript 契約（`backend/src/types/` 與 `frontend/src/types/database-contracts.ts`）。
