# CODE TO KNOW｜Prisma 資料存取控制與使用者資料隔離深度稽核報告
# 資料庫正式收尾 Phase 2.1：全量 Prisma 查詢檢查、IDOR 防護與租戶資料隔離審查

**文件編號**：C2K-DOC-DB-PHASE21-PRISMA-AUDIT-01  
**審查日期**：2026-11-10  
**審查角色**：資深全端架構師 / 應用程式安全架構師（AppSec）  
**審查性質**：100% 唯讀程式碼全面稽核（檢索整個 `backend/src/` 目錄）  
**審查基準**：
- `backend/prisma/schema.prisma`
- `backend/src/app.ts`、`backend/src/server.ts`
- `backend/src/middleware/authenticate.ts`、`backend/src/middleware/authorize.ts`
- `backend/src/utils/audit.ts`
- `backend/src/modules/auth/` 全模組
- `backend/src/modules/teachers/` 全模組
- `backend/src/modules/admin/` 全模組

---

## 一、審查目標與檢索方法

在採用「方案 B：`app_runtime WITH BYPASSRLS`」的架構下，**資料庫底層將多租戶列級隔離的責任委由應用層（Application-Layer Authorization）完全承擔**。

為了驗證此架構在 CODE TO KNOW 現行後端實作中的安全性，本審查全量掃描 `backend/src/` 內所有涉及 Prisma 的呼叫：
- 檢索目標：`findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, `groupBy`, `update`, `updateMany`, `delete`, `deleteMany`, `create`, `createMany`, `upsert`, `$queryRaw`, `$executeRaw`, `$transaction`。
- 逐一審查其輸入來源、身分校驗、WHERE 條件、以及是否存在水平越權（IDOR）或垂直越權（Privilege Escalation）風險。

---

## 二、後端全量 Prisma 查詢清單與安全判定矩陣

經全量掃描，`backend/src/` 中共包含 **39 個 Prisma 呼叫點**（展開 `$transaction` 內部操作共計 **45 個獨立模型操作**）。以下進行逐一盤查：

| 編號 | 檔案與行號 | 操作模型 | Prisma 方法 | 查詢條件 / 資料內容 (WHERE / DATA) | 呼叫情境與權限保護機制 | 隔離性判定 |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **P-01** | `app.ts:52` | *(Raw SQL)* | `$queryRaw` | `SELECT 1` | 公開健康檢查 `/api/health`，無傳入參數，不涉及使用者資料。 | **PASS** |
| **P-02** | `server.ts:19` | *(System)* | `$disconnect` | N/A | 伺服器優雅關閉（Graceful Shutdown），中斷連線。 | **PASS** |
| **P-03** | `authenticate.ts:35` | `Session` | `findUnique` | `where: { tokenHash }` | 讀取 HttpOnly Cookie 的 Token，以 SHA-256 Hash 查表。檢查逾期、廢止及帳號狀態。 | **PASS** |
| **P-04** | `authenticate.ts:93` | `Session` | `findUnique` | `where: { tokenHash }` | 可選身分驗證中間件，邏輯同 P-03，不主動拒絕無 Token 請求。 | **PASS** |
| **P-05** | `audit.ts:18` | `AuditLog` | `create` | `data: { userId, action, details, ipAddress, userAgent }` | 集中式審計工具函式，參數化寫入日誌。 | **PASS** |
| **P-06** | `auth.service.ts:24` | `User` | `findUnique` | `where: { email: normalizedEmail }` | 註冊時檢查 Email 是否已被使用。 | **PASS** |
| **P-07** | `auth.service.ts:33` | `Role` | `findUnique` | `where: { name: 'STUDENT' }` | 註冊時取得學生角色 ID。 | **PASS** |
| **P-08** | `auth.service.ts:38` | `Role` | `create` | `data: { name: 'STUDENT', description }` | 角色不存在時自動建立預設學生角色。 | **PASS** |
| **P-09** | `auth.service.ts:51` | `User` | `create` | `data: { email, passwordHash, displayName, roles: { create: { roleId: studentRole.id } } }` | 使用者註冊。**角色寫死為 STUDENT，前端無法自選角色提權**。 | **PASS** |
| **P-10** | `auth.service.ts:82` | `AuditLog` | `create` | `data: { userId: user.id, action: 'USER_REGISTER' }` | 記錄註冊成功日誌，userId 來自後端新建之 user.id。 | **PASS** |
| **P-11** | `auth.service.ts:113` | `User` | `findUnique` | `where: { email: normalizedEmail }` | 登入查詢使用者身分與密碼雜湊。 | **PASS** |
| **P-12** | `auth.service.ts:133` | `AuditLog` | `create` | `data: { userId: user.id, action: 'LOGIN_FAILED' }` | 記錄登入失敗事件。 | **PASS** |
| **P-13** | `auth.service.ts:150` | `Session` | `create` | `data: { userId: user.id, tokenHash, expiresAt }` | 登入成功核發 Session，綁定後端驗證之 user.id。 | **PASS** |
| **P-14** | `auth.service.ts:161` | `AuditLog` | `create` | `data: { userId: user.id, action: 'USER_LOGIN' }` | 記錄登入成功日誌。 | **PASS** |
| **P-15** | `auth.service.ts:190` | `Session` | `updateMany` | `where: { id: sessionId, revokedAt: null }` | 登出作業，`sessionId` 取自受信任的 `req.sessionId`，僅廢止目前會話。 | **PASS** |
| **P-16** | `auth.service.ts:197` | `AuditLog` | `create` | `data: { userId, action: 'USER_LOGOUT' }` | 記錄登出日誌，`userId` 取自 `req.user.id`。 | **PASS** |
| **P-17** | `auth.service.ts:213` | `User` | `findUnique` | `where: { id: userId }` | `GET /api/auth/me` 個人檔案查詢。**userId 嚴格取自 `req.user.id`，無 URL 參數，絕無 IDOR**。 | **PASS** |
| **P-18** | `auth.service.ts:251` | `EmailVerificationToken` | `findUnique` | `where: { tokenHash }` | 驗證信箱 Token，檢查有效性。 | **PASS** |
| **P-19a** | `auth.service.ts:265` | `User` | `update` | `where: { id: record.userId }` | 信箱驗證成功更新使用者 `emailVerifiedAt`。 | **PASS** |
| **P-19b** | `auth.service.ts:269` | `EmailVerificationToken` | `update` | `where: { id: record.id }` | 標記 Token 為已使用（`usedAt = now()`）。 | **PASS** |
| **P-19c** | `auth.service.ts:273` | `AuditLog` | `create` | `data: { userId: record.userId, action: 'EMAIL_VERIFIED' }` | 審計記錄信箱驗證。 | **PASS** |
| **P-20** | `auth.service.ts:292` | `User` | `findUnique` | `where: { email: normalizedEmail }` | 忘記密碼查詢目標使用者。 | **PASS** |
| **P-21** | `auth.service.ts:304` | `PasswordResetToken` | `create` | `data: { userId: user.id, tokenHash, expiresAt }` | 建立重設密碼 Token。 | **PASS** |
| **P-22** | `auth.service.ts:312` | `AuditLog` | `create` | `data: { userId: user.id, action: 'PASSWORD_RESET_REQUESTED' }` | 審計記錄重設密碼申請。 | **PASS** |
| **P-23** | `auth.service.ts:336` | `PasswordResetToken` | `findUnique` | `where: { tokenHash }` | 驗證重設密碼 Token。 | **PASS** |
| **P-24a** | `auth.service.ts:352` | `User` | `update` | `where: { id: record.userId }` | 更新密碼 Hash。 | **PASS** |
| **P-24b** | `auth.service.ts:356` | `PasswordResetToken` | `update` | `where: { id: record.id }` | 標記重設 Token 為已使用。 | **PASS** |
| **P-24c** | `auth.service.ts:361` | `Session` | `updateMany` | `where: { userId: record.userId, revokedAt: null }` | **防會話劫持：重設密碼時強制登出該使用者全數既有連線**。 | **PASS** |
| **P-24d** | `auth.service.ts:365` | `AuditLog` | `create` | `data: { userId: record.userId, action: 'PASSWORD_RESET_COMPLETED' }` | 審計記錄密碼重設完成。 | **PASS** |
| **P-25** | `teacher.service.ts:11` | `UserRole` | `findMany` | `where: { userId }` | 申請教師前檢查目前身分，`userId` 取自 `req.user.id`。 | **PASS** |
| **P-26** | `teacher.service.ts:22` | `TeacherApplication` | `findFirst` | `where: { userId, status: 'PENDING' }` | 檢查是否已有待審申請，`userId` 取自 `req.user.id`。 | **PASS** |
| **P-27** | `teacher.service.ts:33` | `TeacherApplication` | `create` | `data: { userId, schoolName, subject, reason, proofUrl }` | 送出教師申請。**userId 來自 `req.user.id`，前端傳入無效**。 | **PASS** |
| **P-28** | `teacher.service.ts:44` | `AuditLog` | `create` | `data: { userId, action: 'TEACHER_APPLICATION_SUBMITTED' }` | 記錄教師申請審計日誌。 | **PASS** |
| **P-29** | `teacher.service.ts:61` | `TeacherApplication` | `findFirst` | `where: { userId }, orderBy: { createdAt: 'desc' }` | `GET /api/teachers/my-application` 查詢自己的申請。**無 URL 參數，userId 來自 `req.user.id`，無法看他人記錄**。 | **PASS** |
| **P-30** | `admin.service.ts:15` | `TeacherApplication` | `findMany` | `where: status ? { status } : {}, skip, take: limit` | 管理者清單查詢。**由 `requireRoles(['ADMIN'])` 阻擋非管理者**。 | **PASS** |
| **P-31** | `admin.service.ts:32` | `TeacherApplication` | `count` | `where: status ? { status } : {}` | 管理者分頁總數計算。 | **PASS** |
| **P-32** | `admin.service.ts:56` | `TeacherApplication` | `findUnique` | `where: { id: applicationId }` | 管理者審核前讀取目標申請（`applicationId` 來自 URL 路由參數）。限管理員。 | **PASS** |
| **P-33** | `admin.service.ts:70` | `Role` | `findUnique` | `where: { name: 'TEACHER' }` | 審核時查詢 TEACHER 角色 ID。 | **PASS** |
| **P-34** | `admin.service.ts:75` | `Role` | `create` | `data: { name: 'TEACHER', description }` | 預防性角色建立。 | **PASS** |
| **P-35a** | `admin.service.ts:85` | `TeacherApplication` | `update` | `where: { id: applicationId }, data: { status: 'APPROVED', reviewedBy: adminId }` | 管理者核准申請，reviewedBy 記錄管理員 ID。 | **PASS** |
| **P-35b** | `admin.service.ts:94` | `UserRole` | `upsert` | `where: { userId_roleId }, create: { userId, roleId }` | 授予申請人 TEACHER 角色。 | **PASS** |
| **P-35c** | `admin.service.ts:107` | `AuditLog` | `create` | `data: { userId: adminId, action: 'TEACHER_APPLICATION_APPROVED' }` | 記錄審核核准操作日誌。 | **PASS** |
| **P-36** | `admin.service.ts:136` | `TeacherApplication` | `findUnique` | `where: { id: applicationId }` | 管理者退件前讀取目標申請。限管理員。 | **PASS** |
| **P-37a** | `admin.service.ts:150` | `TeacherApplication` | `update` | `where: { id: applicationId }, data: { status: 'REJECTED', reviewedBy: adminId }` | 管理者駁回申請。 | **PASS** |
| **P-37b** | `admin.service.ts:159` | `AuditLog` | `create` | `data: { userId: adminId, action: 'TEACHER_APPLICATION_REJECTED' }` | 記錄駁回操作日誌。 | **PASS** |
| **P-38** | `admin.service.ts:185` | `AuditLog` | `findMany` | `skip, take: limit, orderBy: { createdAt: 'desc' }` | 管理者調閱安全日誌。**路由層掛載 `requireRoles(['ADMIN'])`**。 | **PASS** |
| **P-39** | `admin.service.ts:195` | `AuditLog` | `count` | 無條件全量計數 | 管理者日誌分頁總數計算。 | **PASS** |

---

## 三、七大專項資料隔離安全檢查

### 1. 學生是否只能存取自己的個人資料？
- **檢查結果**：**是（PASS）**。
- **證據**：
  - 個人資料查詢端點為 `GET /api/auth/me`，路由定義為：
    ```ts
    router.get('/me', authenticate, (req, res, next) => authController.getMe(req, res, next));
    ```
  - 控制器將參數指定為 `req.user!.id`，服務層執行：
    ```ts
    prisma.user.findUnique({ where: { id: userId } });
    ```
  - 不存在任何以 URL 參數（如 `/api/users/:id`）查詢使用者私有資料的端點。學生完全無法透過竄改參數存取其他學生的資料。

### 2. 教師是否只能存取授權的教學資料？
- **檢查結果**：**符合現行範圍（PASS）**。
- **證據**：
  - 現階段已實作的教師相關端點為申請端點（`POST /api/teachers/applications` 與 `GET /api/teachers/my-application`）。
  - 查詢條件均嚴格限制為 `where: { userId: req.user.id }`。
  - 班級（`Class`）、作業（`ClassAssignment`）與學生繳交進度（`PracticalProgress` 等）之業務 API 尚未實作。

### 3. 管理員是否只能透過明確授權的管理功能操作資料？
- **檢查結果**：**是（PASS）**。
- **證據**：
  - `backend/src/modules/admin/admin.routes.ts` 第 12 行全域掛載：
    ```ts
    router.use(authenticate, requireRoles(['ADMIN']));
    ```
  - `requireRoles` 中間件檢查使用者的角色名冊（支援 `PLATFORM_ADMIN` 與 `ADMIN`），未具備權限者直接回應 `403 Forbidden`。
  - 一般使用者完全無法進入審核申請或調閱 `AuditLog`。

### 4. 是否有只依據前端傳入 ID、而未驗證使用者權限的查詢（IDOR 風險）？
- **檢查結果**：**無（PASS）**。
- **證據**：
  - 現有端點中，唯一接受 URL ID 參數的是管理者的審核與駁回端點：
    - `POST /api/admin/teacher-applications/:id/approve`
    - `POST /api/admin/teacher-applications/:id/reject`
  - 這些端點已受 `requireRoles(['ADMIN'])` 強制保護，只有經認證授權的管理者可操作，屬於合法管理行為，非 IDOR 漏洞。
  - 所有面向使用者的查詢均不接受使用者自訂的 `:userId`。

### 5. 是否有巢狀 Prisma 查詢或 Raw SQL 繞過既有授權檢查？
- **檢查結果**：**無（PASS）**。
- **證據**：
  - 全專案唯一的 Raw SQL 為 `backend/src/app.ts:52` 的 `prisma.$queryRaw\`SELECT 1\``，僅用於 DB 健康心跳探測，無資料外洩風險。
  - 所有業務查詢均使用 Prisma 型別安全 API，參數透過底層驅動自動參數化（Parameterized Queries），無 SQL Injection 隱患。

### 6. 新增資料時，userId 是否由可信任的後端身分產生？
- **檢查結果**：**是（PASS）**。
- **證據**：
  - 送出教師申請時，`teacher.controller.ts` 明確自 `req.user!.id` 取出傳入 `teacherService.submitApplication(userId, ...)`。
  - 註冊時，`auth.service.ts` 自行生成使用者，並以新建的 `user.id` 綁定 `Session` 與 `AuditLog`。
  - 前端 Payload 中的任何自訂 `userId` 均被 Zod Schema 忽略或拒絕，不予採納。

### 7. 尚未實作 API 的 28 個模型之未來安全規範（NEEDS_REVIEW / 開發強制規範）
- **現況事實**：
  Prisma Schema 中已預先設計了 28 個進階業務模型（如 `Class`、`ClassEnrollment`、`ExamAttempt`、`UnitProgress`、`AIChatSession` 等），目前 Express 伺服器尚未實作對應 Controller 與 Route。
- **未來實施強制規範（Non-Negotiable Guidelines）**：
  未來在開發這些模組時，必須遵循以下應用層隔離原則：
  1. **學生端點**：查詢學生進度時，必須在 WHERE 條件強制注入 `userId: req.user.id`。
  2. **教師端點**：查詢班級學生資料時，必須先校驗該班級的 `creatorId === req.user.id`。
  3. **AI 助教端點**：查詢或傳送對話時，必須校驗 `AIChatSession.userId === req.user.id`。

---

## 四、本項審查統計結果

| 評核指標 | 數量 | 佔比 | 備註 |
| :--- | :---: | :---: | :--- |
| **PASS（符合資料隔離與最小授權）** | **39 處** | **100%** | 目前後端現有之 39 處 Prisma 呼叫全數通過審查。 |
| **NEEDS_REVIEW（後續開發需持續遵循規範）** | **1 項** | N/A | 針對未來即將實作的 28 個未開端點之業務模型提出強制安全指引。 |
| **FAIL（存在 IDOR 或越權漏洞）** | **0 處** | **0%** | 未發現任何越權漏洞或不受信任的 ID 查詢。 |

---

## 五、本項審查總結結論

目前已實作的 Express 後端服務層，對使用者身分校驗、角色判定、以及 `where: { userId: req.user.id }` 的範圍限制實施得相當嚴謹：
1. 學生完全無法存取或竄改他人帳號資料與申請單。
2. 管理者功能受到 `requireRoles` 中間件嚴密隔離。
3. 採用「方案 B：`app_runtime WITH BYPASSRLS`」在當前的程式碼實作上**具備充分的應用層安全支撐，未發現資料洩漏或越權隱患**。

**本項審查總體判定：【PASS】**
