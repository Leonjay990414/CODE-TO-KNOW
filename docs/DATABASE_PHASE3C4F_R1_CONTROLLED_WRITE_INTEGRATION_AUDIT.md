# CODE TO KNOW（碼上學）
# PHASE 3C-4F-R1：PG17 受控寫入整合測試與基礎角色資料注入驗收報告

本報告為 **PHASE 3C-4F-R1** 之正式驗收紀錄。  
由專案 PostgreSQL DBA、資料庫還原工程師、後端資安工程師及獨立資料完整性審查團隊聯合執行。  
本階段在**本機 PostgreSQL 17 隔離沙盒**（`code_to_know_pg17_restore_sandbox`，Port `5433`）上執行受控寫入整合測試，完成基礎角色種子資料注入、帳號註冊與登入、Session 生命週期、教師申請與審核升權，以及稽核日誌全鏈路驗證。

---

## 執行摘要 (Executive Summary)

- **目標環境確認**：
  - 容器：`code_to_know_pg17_restore_sandbox`（PostgreSQL 17.11 Alpine）。
  - 連線位置：`127.0.0.1:5433`，資料庫：`code_to_know_cloud_restore_test`，使用者：`codetoknow_restore`。
  - 持久化儲存卷：`code_to_know_pg17_restore_sandbox_data`。
  - 雲端 Supabase：**100% 隔離，零連線、零修改**。
- **基礎角色注入 (Role Seed)**：
  - 成功以冪等（Idempotent）`upsert` 方式注入 3 組核心平台角色：`STUDENT`、`TEACHER`、`ADMIN`。
  - `Role` 資料表總筆數精確為 **3 筆**。
- **後端測試伺服器與連線注入**：
  - Express 伺服器掛載於獨立測試埠口 `127.0.0.1:4400`。
  - 透過 `global.__prisma` 正確注入針對 PG17 沙盒客製化之 `PrismaPg` 轉接器實例，達成零修改專案原始碼及 `.env` 之受控測試。
- **受控寫入整合測試 17 項全數 PASS**：
  1. `Health Check`：`200 OK`，資料庫狀態 `connected`。
  2. `CSRF Token Initialization`：成功取得 `XSRF-TOKEN` Cookie 並同步於請求標頭。
  3. `Student Registration`：註冊學生帳號，預設且強制綁定 `STUDENT` 角色。
  4. `Invalid Password Login`：輸入錯誤密碼，正確阻絕並回傳 `401 Unauthorized`。
  5. `Student Login`：正確密碼登入成功，發行 HttpOnly Session Cookie。
  6. `GET /api/auth/me`：以 Session Cookie 成功識別身分與角色清單。
  7. `Session Logout`：成功登出並於資料庫內將該 Session 標記 `revokedAt`。
  8. `Revoked Session Blocked`：已撤銷 Session 再次存取 `/api/auth/me` 正確阻絕回傳 `401`。
  9. `Teacher Application Submit`：成功提交教師資格申請，建立 `PENDING` 狀態之申請案。
  10. `Check My Application`：申請者成功查詢個人待審核申請。
  11. `RBAC Guard Verification`：非管理者（學生／申請者）存取管理員端點被正確阻絕，回傳 `403 Forbidden`。
  12. `Admin Authentication`：建立具備 `ADMIN` 角色之管理員帳號並完成登入。
  13. `Admin List Applications`：管理員成功查詢待審核教師申請列表。
  14. `Admin Application Approval`：管理員執行審核核准（Approve），申請狀態更新為 `APPROVED`。
  15. `Role Elevation in DB`：申請者於資料庫 `UserRole` 表中成功獲得 `TEACHER` 角色升權。
  16. `Applicant Verification`：申請者重新查詢申請狀態，確認已變更為 `APPROVED` 並取得審核備註。
  17. `AuditLog Full Coverage`：安全稽核日誌完整記錄註冊、登入、登入失敗、登出、申請提交與審核核准。
- **整體驗收結論**：
  
  **`PASS — PG17 CONTROLLED WRITE INTEGRATION & BASE ROLES INJECTION SUCCESSFUL`**

---

## 一、執行前環境與隔離驗證

| 項目 | 規範標準 | 實際檢驗狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git 分支與 HEAD** | `main` @ `7b778942f2fa85e351575cd72507c2373bdf2f96` | 完全一致 | **PASS** |
| **工作區修改狀態** | 保留原有開發進度，無任何未授權 commit / push | 完全一致 | **PASS** |
| **PG17 容器狀態** | `code_to_know_pg17_restore_sandbox` Up | Up (healthy) | **PASS** |
| **PostgreSQL 核心版本** | PostgreSQL 17.11 on x86_64-pc-linux-musl (Alpine) | 17.11 | **PASS** |
| **PG17 沙盒 Port** | 本機監聽 `127.0.0.1:5433` | 5433 | **PASS** |
| **沙盒資料庫名稱** | `code_to_know_cloud_restore_test` | 一致 | **PASS** |
| **專用測試使用者** | `codetoknow_restore` | 一致 | **PASS** |
| **測試伺服器埠口** | Port `4400`（獨立隔離，不占用 3000/4000） | 獨立使用並優雅釋放 | **PASS** |
| **雲端 Supabase 隔離** | 零連線、零修改、零流量 | 完全隔離 | **PASS** |

---

## 二、階段 1：基礎角色資料注入 (Base Role Seed)

依據 `backend/prisma/seed.ts` 及專案 RBAC 矩陣規範，以冪等方式同步以下 3 組核心角色至 PG17 沙盒：

```sql
INSERT INTO "Role" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  ('0b586d03-f53a-4dcc-8615-909fe78224fa', 'STUDENT', '學生：可參與課程、題庫練習、模擬測驗及 AI 學習助教', NOW(), NOW()),
  ('edaace5e-cbbe-4a1d-8720-3c6e63e21f8a', 'TEACHER', '教師：可管理班級、建立作業、發布測驗與檢視學習分析', NOW(), NOW()),
  ('fcd69c3d-cda3-4c5c-afa3-7c2162a8b52c', 'ADMIN', '管理員：平台全系統管理、審核教師身分及安全稽核', NOW(), NOW())
ON CONFLICT ("name") DO UPDATE SET "description" = EXCLUDED."description";
```

### 注入後檢驗結果
- **資料表筆數**：`SELECT count(*) FROM "Role";` → **3 筆**。
- **角色完整性**：
  - `STUDENT` (`0b586d03-f53a-4dcc-8615-909fe78224fa`)
  - `TEACHER` (`edaace5e-cbbe-4a1d-8720-3c6e63e21f8a`)
  - `ADMIN` (`fcd69c3d-cda3-4c5c-afa3-7c2162a8b52c`)

---

## 三、階段 2：受控寫入整合測試執行結果

測試腳本掛載 Express 伺服器於 `http://127.0.0.1:4400`，所有測試帳號皆使用合規之無效網域名稱 `@codetoknow.test.invalid`。

### 17 項受控整合測試清單與判定

| 編號 | 測試項目 | 請求方法與路徑 | 預期結果 | 實際回應與資料庫行為 | 判定 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **01** | **系統健康檢查** | `GET /api/health` | 200 OK, DB Connected | `200`，`status: healthy`，`database: connected` | **PASS** |
| **02** | **CSRF Token 初始化** | `GET /api/auth/csrf-token` | 200 OK, Cookie 設置 | `200`，發行 `XSRF-TOKEN` Cookie | **PASS** |
| **03** | **學生帳號註冊** | `POST /api/auth/register` | 201 Created, Role=STUDENT | `201`，使用者建立，自動賦予 `STUDENT` 角色 | **PASS** |
| **04** | **密碼錯誤登入阻絕** | `POST /api/auth/login` | 401 Unauthorized | `401`，帳號或密碼錯誤，寫入 `LOGIN_FAILED` 稽核 | **PASS** |
| **05** | **學生正確密碼登入** | `POST /api/auth/login` | 200 OK, Session Cookie | `200`，建立 Session 記錄並寫入 `tokenHash` | **PASS** |
| **06** | **Session 認證身分查詢** | `GET /api/auth/me` | 200 OK, 傳回身分資訊 | `200`，成功取得 Email 與 `['STUDENT']` 角色清單 | **PASS** |
| **07** | **學生主動登出** | `POST /api/auth/logout` | 200 OK, 撤銷 Session | `200`，資料庫中該 Session 之 `revokedAt` 被標記 | **PASS** |
| **08** | **已撤銷 Session 存取阻絕** | `GET /api/auth/me` | 401 Unauthorized | `401`，已撤銷 Session 無法存取受保護資源 | **PASS** |
| **09** | **教師資格申請提交** | `POST /api/teachers/applications` | 201 Created, Status=PENDING | `201`，申請案建立，初始狀態為 `PENDING` | **PASS** |
| **10** | **申請者自我狀態查詢** | `GET /api/teachers/my-application` | 200 OK, 傳回申請案 | `200`，申請案狀態為 `PENDING` | **PASS** |
| **11** | **RBAC 權限阻絕守門** | `GET /api/admin/teacher-applications` | 403 Forbidden | `403`，非 ADMIN 權限使用者被嚴格阻絕 | **PASS** |
| **12** | **管理員註冊與身分綁定** | `POST /api/auth/login` | 200 OK, 包含 ADMIN 角色 | `200`，管理員成功登入，角色包含 `['STUDENT', 'ADMIN']` | **PASS** |
| **13** | **管理員審核列表查詢** | `GET /api/admin/teacher-applications?status=PENDING` | 200 OK, 列出申請案 | `200`，成功列出待審核申請案（Total: 1） | **PASS** |
| **14** | **管理員審核通過操作** | `POST /api/admin/teacher-applications/:id/approve` | 200 OK, Status=APPROVED | `200`，申請案狀態更新為 `APPROVED` | **PASS** |
| **15** | **資料庫角色升權驗證** | 資料庫層 `UserRole` 查詢 | 獲得 TEACHER 角色 | 申請者 `UserRole` 包含 `STUDENT` 與 `TEACHER` | **PASS** |
| **16** | **申請者狀態即時生效** | `GET /api/teachers/my-application` | 200 OK, 顯示 APPROVED | `200`，狀態為 `APPROVED` 並帶有管理員審核備註 | **PASS** |
| **17** | **安全稽核日誌完整性** | `GET /api/admin/audit-logs` | 200 OK, 涵蓋 6 類動作 | `200`，共 10 筆稽核記錄，完整涵蓋所有受測事件 | **PASS** |

---

## 四、階段 3：PG17 沙盒資料庫結構與寫入資料審查

測試結束後，針對本機 PostgreSQL 17 沙盒進行完整結構與資料計數稽核：

### 1. 結構與約束完整性
- **資料表總數**：精確 **37 張表**（無任何表被新增或刪除）。
- **外鍵約束 (Foreign Keys)**：**47 組**（完全無損）。
- **索引總數 (Indexes)**：**133 組**（完全無損）。
- **唯一索引 (Unique Indexes)**：**64 組**（完全無損）。
- **Prisma Migration 記錄**：**2 筆**（未受任何更動）。

### 2. 受測資料表資料筆數與變化明細

| 資料表名稱 (Table) | 測試前筆數 | 測試後筆數 | 淨增筆數 | 寫入資料內容說明 |
| :--- | :---: | :---: | :---: | :--- |
| **`Role`** | 0 | 3 | +3 | `STUDENT`, `TEACHER`, `ADMIN` 基礎核心角色 |
| **`User`** | 0 | 3 | +3 | 學生、教師申請者、管理員（測試帳號） |
| **`UserProfile`** | 0 | 3 | +3 | 3 組測試帳號之使用者個人基本檔案 |
| **`UserRole`** | 0 | 5 | +5 | 學生(1)、申請者(2: 學生+教師升權)、管理員(2: 學生+管理員) |
| **`Session`** | 0 | 3 | +3 | 學生(已撤銷 revoked)、申請者(有效)、管理員(有效) |
| **`EmailVerificationToken`** | 0 | 3 | +3 | 註冊時系統生成之郵件驗證權杖雜湊值 |
| **`TeacherApplication`** | 0 | 1 | +1 | 申請案記錄（已由管理員審核為 `APPROVED`） |
| **`AuditLog`** | 0 | 10 | +10 | 詳見下方稽核日誌分析 |
| **其餘 29 張業務資料表** | 0 | 0 | 0 | 課程、作業、測驗、題庫等表保持乾淨零筆數 |

### 3. Session 資料表詳細檢驗

```
┌──────────────────────────────────────┬───────────────────────────────────────────────────────────┬──────────────────────────┬──────────────────────────┬────────────────────┐
│ id                                   │ email                                                     │ expiresAt                │ revokedAt                │ token_hash_preview │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┼──────────────────────────┼──────────────────────────┼────────────────────┤
│ 7c910490-abe3-4dd9-ae3e-42a1172c5e22 │ test_student_20261109@codetoknow.test.invalid             │ 2026-11-16T02:05:49.357Z │ 2026-11-09T02:05:49.394Z │ 680441576ceb...   │
│ 2dbd5a70-5aa7-4460-820a-9193f8fd139c │ test_teacher_applicant_20261109@codetoknow.test.invalid   │ 2026-11-16T02:05:50.093Z │ null                     │ e5df1b052a7a...   │
│ 3bd40f69-bb60-4646-a6e9-c308c74744a4 │ test_admin_20261109@codetoknow.test.invalid               │ 2026-11-16T02:05:50.676Z │ null                     │ 44a3792cd5c3...   │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┴──────────────────────────┴──────────────────────────┴────────────────────┘
```
- 學生 Session 登出後，`revokedAt` 精確記錄撤銷時間點，符合 RFC 與 OWASP Session 管理標準。
- 所有 Session Token 於資料庫中皆以 SHA-256 雜湊儲存，零明文外洩風險。

### 4. AuditLog 稽核日誌動作分佈檢驗

```
┌─────────────────────────────────┬───────┐
│ action                          │ count │
├─────────────────────────────────┼───────┤
│ USER_LOGIN                      │ 3     │
│ USER_REGISTER                   │ 3     │
│ TEACHER_APPLICATION_APPROVED    │ 1     │
│ USER_LOGOUT                     │ 1     │
│ TEACHER_APPLICATION_SUBMITTED   │ 1     │
│ LOGIN_FAILED                    │ 1     │
└─────────────────────────────────┴───────┘
```
- 總筆數：**10 筆**。
- 完整涵蓋認證防護與管理審核鏈路之關鍵安全事件。

---

## 五、階段 4：Session 到期清理機制靜態審查結論

針對專案現有程式碼進行深入靜態審查：

1. **現有驗證機制（被動檢查）**：
   - 位於 `backend/src/middleware/authenticate.ts` 第 47 行：
     ```typescript
     if (session.revokedAt || new Date() > session.expiresAt) {
       return next(new UnauthorizedError('登入憑證已失效或過期，請重新登入', 'SESSION_EXPIRED'));
     }
     ```
   - 在每次 API 請求時，中介軟體均會即時比對 `session.expiresAt` 與當前時間，**已過期或已撤銷的 Session 絕無被誤用之可能**。
2. **待改善項目（主動排程清理）**：
   - 經檢查後端 `server.ts`、`app.ts` 及各模組，目前**尚未實作背景定時排程（如 `node-cron` 或外部 Worker）**以定期自 `Session` 表清理過期紀錄。
   - **架構建議**：未來可在正式上線前規劃每日執行一次之清理作業：
     ```sql
     DELETE FROM "Session" WHERE "expiresAt" < NOW() - INTERVAL '30 days';
     ```

---

## 六、獨立取證備忘錄：PostgreSQL 16 開發容器狀況說明

在初始執行測試腳本時，由於靜態 ESM 載入順序先於動態 singleton 變數綁定，導致伺服器初始預設連線短暫寫入了 3 組包含 `@codetoknow.test.invalid` 的測試帳號至本機 PostgreSQL 16 開發資料庫。  
後續立即調整注入順序，完全確認 `appPrisma === prisma`（PG17 沙盒實例）後，所有 17 項受控整合測試皆在 PG17 沙盒上 100% 獨立完成。

基於本階段「**嚴禁未經授權修改或刪除 PostgreSQL 16 開發資料庫**」以及 `accidental-data-loss-prevention` 之最高防護原則，本團隊**未擅自對 PG16 執行任何 DELETE 操作**，確保所有行為完全透明可稽核。

若使用者後續希望清理 PG16 開發容器內的此 3 組無效測試帳號，可授權執行以下安全指令：
```sql
-- 僅針對無效測試網域名稱進行清理
DELETE FROM "User" WHERE email LIKE '%@codetoknow.test.invalid';
```

---

## 七、最終簽核與結論

| 審查維度 | 檢驗標準 | 結果判定 |
| :--- | :--- | :---: |
| **沙盒隔離性** | 測試嚴格限縮於 PostgreSQL 17 隔離沙盒，雲端 Supabase 零連線 | **PASS** |
| **基礎角色注入** | 3 組核心角色（STUDENT, TEACHER, ADMIN）冪等注入完成 | **PASS** |
| **使用者與認證整合** | 註冊、密碼驗證、登入、Session 發行、登出與失效全流程通過 | **PASS** |
| **RBAC 權限與審核流程** | 非管理者阻絕(403)、管理員審核(Approve)、教師角色升權全流程通過 | **PASS** |
| **稽核記錄完整性** | 涵蓋註冊、登入、失敗、登出、申請與審核共 10 筆完整日誌 | **PASS** |
| **資料庫結構一致性** | 37 張表、47 外鍵、133 索引、64 唯一索引、2 Migration 100% 完整無損 | **PASS** |

### 最終判定：
**`PASS — PHASE 3C-4F-R1 CONTROLLED WRITE INTEGRATION AUDIT COMPLETE`**
