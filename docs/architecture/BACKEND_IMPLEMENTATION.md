# 碼上學｜CODE TO KNOW

# 後端架構與服務實作報告（BACKEND IMPLEMENTATION）

- **品牌名稱**：碼上學｜CODE TO KNOW
- **系統名稱**：碼上學 AI 智慧學習與教育科技平台
- **文件版本**：1.0
- **文件路徑**：`docs/architecture/BACKEND_IMPLEMENTATION.md`
- **架構核心**：Node.js v24 + Express + TypeScript + Prisma 7.10.1 + Vitest

---

## 1. 後端服務功能總覽與完成狀態

| 功能類別 | 端點 / 元件 | 狀態 | 說明 |
| :--- | :--- | :--- | :--- |
| **服務健康探針** | `GET /api/health` | **DONE** | 真實探測 PostgreSQL 連線延遲（非假資料）；未連線回傳 503 degraded |
| **CSRF 防護** | `GET /api/auth/csrf-token` | **DONE** | 雙重 Cookie 防護，變更性請求強制校驗 `x-csrf-token` |
| **學員註冊** | `POST /api/auth/register` | **DONE** | 強制賦予 `STUDENT` 角色，防禦前端角色篡改，bcrypt 密碼雜湊 |
| **會員登入** | `POST /api/auth/login` | **DONE** | 密碼校驗，核發 httpOnly Cookie，建立 Server-side Session |
| **會員登出** | `POST /api/auth/logout` | **DONE** | 標記 Session 為 `revokedAt`，清除瀏覽器 Session Cookie |
| **當前使用者** | `GET /api/auth/me` | **DONE** | 回傳使用者 ID、名稱、角色與審核進度，排除密碼雜湊等機密 |
| **信箱驗證** | `POST /api/auth/verify-email` | **DONE** | 單次使用 Token 驗證，更新 `emailVerifiedAt` |
| **密碼重設** | `POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password` | **DONE** | 定時防帳號列舉，Token 單次有效，重設後撤銷所有現有 Session |
| **教育者申請** | `POST /api/teachers/applications` | **DONE** | 需登入，防範重複待審申請，建立 PENDING 申請 |
| **個人申請進度** | `GET /api/teachers/my-application` | **DONE** | 查詢個人最新審核狀態與備註 |
| **管理員審核名單** | `GET /api/admin/teacher-applications` | **DONE** | 需 ADMIN 權限，分頁過濾申請案件 |
| **管理員核准** | `POST /api/admin/teacher-applications/:id/approve` | **DONE** | 資料庫交易升級角色為 `TEACHER`，寫入 AuditLog |
| **管理員駁回** | `POST /api/admin/teacher-applications/:id/reject` | **DONE** | 標記 REJECTED，不授予 TEACHER 權限 |
| **平台稽核紀錄** | `GET /api/admin/audit-logs` | **DONE** | 僅 ADMIN 可存取，檢視全平台安全紀錄 |
| **郵件發送服務** | `emailProvider` | **PARTIALLY DONE** | 建立完整介面與開發 Console 工具；正式 SMTP 尚未配置憑證 |
| **Google 登入** | Google OAuth | **NOT DONE** | 依既定決策，保留日後整合擴充介面 |

---

## 2. 安全防護架構

1. **RBAC 角色授權中介層 (`requireRoles`)**：
   - 拒絕未登入使用者（401 Unauthorized）。
   - 阻止學員存取教師或管理員路由（403 Forbidden）。
   - 阻止教師存取管理員路由（403 Forbidden）。
2. **防範 IDOR 與角色偽造**：
   - 使用者身分純由伺服器端 Session 解出，不採信客戶端傳遞之 `userId` 或 `role`。
   - 審核人純以登入中管理員之 Session ID 登記，防止偽造審核者。
3. **安全密碼學實作**：
   - 密碼使用 `bcryptjs` 進行單向加鹽雜湊（生產與開發環境 Cost Factor = 12）。
   - 憑證（Session、Email Token、Reset Token）均於資料庫保存 SHA-256 雜湊，防止資料外洩造成直接提權。
   - Token 比對採用 `crypto.timingSafeEqual` 防範計時攻擊。
