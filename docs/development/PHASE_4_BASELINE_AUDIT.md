# 碼上學｜CODE TO KNOW
# 第 4 波：平台管理員與系統營運後台現況盤點報告（Batch 0 Baseline Audit）

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**執行波次：** 第 4 波（Wave 4）  
**對應核心階段：** P16（平台管理員與系統營運後台）  
**關聯階段：** P07（資安防禦）、P09（後端 API 與資料庫）、P15（教師教學平台）  
**基準 Git HEAD：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**分支：** `main`  
**盤點日期：** 2026-11-15  
**工作目錄狀態：** 乾淨保存前 3 波之累積成果，無任何衝突或破壞。

---

## 一、Git HEAD 與工作目錄既有成果存證

在開始第 4 波任何程式碼調整前，對專案基準進行存證：
- **當前 Git Commit**：`c44ea7929f39ef469f380027c2fd3143726d9922`
- **當前 Branch**：`main`
- **前三波工作目錄變更狀態**：
  1. `frontend/src/data/unifiedPracticalCurriculumData.ts`：精確維持 **59 行修改**（42 新增，17 刪除），五大正式術科題組（104301～104305）100% 受到保護。
  2. `frontend/src/pages/public/TeacherDashboardPage.tsx`：第 3 波重構完成，班級管理 API、名冊管理、605 題全量學科檢閱與本地草稿備忘正常運作。
  3. `frontend/tests/teacher-dashboard-classroom.test.tsx`：第 3 波新增之 9 項單元與契約測試完整通過。
  4. 既有未提交檔案均妥善保留，未執行任何 `git reset`、`git clean` 或 `git restore`。

---

## 二、現有管理員路由與權限防護機制盤點

### 1. 前端路由與角色保護
- **路由路徑**：`#admin`、`#admin-dashboard`
- **導覽解析**：`frontend/src/context/NavigationContext.tsx` 解析 Hash 轉發至 `admin-dashboard`。
- **身分保護**：`frontend/src/components/ProtectedRoute.tsx` 限定 `requiredRoles={['ADMIN']}`。
  - 透過 `expandCompatibleFrontendRoles`，僅具備 `ADMIN` 或 `PLATFORM_ADMIN` 之使用者可存取。
  - `STUDENT` 與 `TEACHER` 角色存取將直接阻擋，呈現客製化 403 Forbidden 介面。
- **現有前端頁面檔案**：`frontend/src/pages/public/AdminDashboardPage.tsx`（約 887 行）。

### 2. 後端路由與中間件保護
- **後端路由掛載點**：`backend/src/app.ts` 掛載 `/api/admin` 至 `adminRoutes`。
- **後端存取控制**：`backend/src/modules/admin/admin.routes.ts` 宣告：
  ```typescript
  router.use(authenticate, requireRoles(['ADMIN']));
  ```
  - 所有請求強制通過 JWT 認證（`authenticate`）與角色校驗（`requireRoles(['ADMIN'])`）。
  - 所有寫入操作（`POST /teacher-applications/:id/approve` 與 `reject`）皆受 `csrfProtection` 防護。

---

## 三、管理員現有 API 與真實資料來源盤點

經由檢視 `backend/src/modules/admin/` 與 `frontend/src/services/api.ts`，確認現有 API 支援能力如下：

| API 端點與方法 | 後端 Controller / Service | 前端 API 方法 | 資料模型依據 | 真實度與可用性判定 |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin/teacher-applications` | `AdminController.listTeacherApplications`<br>`AdminService.listTeacherApplications` | `adminApi.listTeacherApplications` | Prisma `TeacherApplication`<br>關聯 `User` (email, displayName, status) | **REAL API** (支援狀態過濾與分頁) |
| `POST /api/admin/teacher-applications/:id/approve` | `AdminController.approveTeacherApplication`<br>`AdminService.approveTeacherApplication` | `adminApi.approveTeacherApplication` | 事務更新 `TeacherApplication` 狀態並透過 `UserRole` 注入 `TEACHER` 角色 | **REAL API** (具備 CSRF 與 AuditLog 寫入) |
| `POST /api/admin/teacher-applications/:id/reject` | `AdminController.rejectTeacherApplication`<br>`AdminService.rejectTeacherApplication` | `adminApi.rejectTeacherApplication` | 事務更新 `TeacherApplication` 狀態並寫入審核拒絕備註 | **REAL API** (具備 CSRF 與 AuditLog 寫入) |
| `GET /api/admin/audit-logs` | `AdminController.listAuditLogs`<br>`AdminService.listAuditLogs` | `adminApi.listAuditLogs` | Prisma `AuditLog`<br>關聯 `User`，經由 `sanitizeAuditDetails` 脫敏 | **REAL API** (支援分頁與脫敏處理) |
| `GET /api/health` | `app.get('/api/health')`<br>(公開匿名探針) | `adminApi.getHealth` | 執行即時 `SELECT 1` 檢測資料庫連線 | **REAL API** (回傳資料庫連線與延遲) |

---

## 四、功能缺口與缺失 API 分析（Gaps & Missing APIs）

依據第 4 波任務書要求，盤點尚未具備後端支援的項目，防止前端製造假功能：

1. **全平台使用者帳號列表與管理（User Governance）**：
   - **現況**：後端**不存在** `GET /api/admin/users`、`PATCH /api/admin/users/:id`、`DELETE /api/admin/users/:id`。
   - **處置原則**：帳號停用、凍結、註銷或手動提權均屬高風險操作，不可在前端憑空捏造假按鈕或使用 LocalStorage 冒充。管理介面僅展示已有申請紀錄之教師帳號，並清楚標記「全平台帳號治理 API 待後端開發」。
2. **全平台班級監理（Classroom Governance）**：
   - **現況**：後端現有 `/api/classrooms` 僅支援教師個人班級（`my-teaching`）與學生個人班級（`my-enrolled`），並受 Anti-IDOR 班級所有權防護，**不存在** 管理員跨班級查詢之 `GET /api/admin/classrooms`。
   - **處置原則**：嚴格遵守後端安全隔離原則，不繞過權限。介面誠實說明管理員全域班級審計功能之規劃，不展示假班級數據。
3. **平台大數據統計總覽（Platform Global Statistics）**：
   - **現況**：後端**不存在** `GET /api/admin/stats` 全站統計端點（如學生總數、班級總數、測驗完成總數）。
   - **處置原則**：禁止使用假數字或硬編碼。僅呈現真實存在的「待審核申請數」、「安全日誌筆數」及「資料庫連線狀態」，其餘標記「暫無統計 / 待 API 提供」。
4. **系統全面營運監控 vs. 單一健康探針**：
   - **現況**：`/api/health` 僅為單一公開健康檢查（`SELECT 1` 探針），並非包含記憶體、CPU、連線池、郵件隊列之完整 APM 監控系統。
   - **處置原則**：如實呈現資料庫即時連線與延遲，不誇大為全系統分散式監控。

---

## 五、第 4 波分批執行路徑規劃（Batches 1～7）

- **Batch 1｜管理員首頁與資訊架構**：整合真實統計卡片，正名無資料項目，梳理操作導覽與反饋。
- **Batch 2｜帳號與教師申請審核**：完善教師申請審核流程（待審核、已核准、退回），強化操作確認與防重複提交。
- **Batch 3｜全平台班級治理盤點**：梳理權限邊界，記錄管理員層級之治理需求，不假造全域班級。
- **Batch 4｜系統健康與安全日誌**：整合即時 `/api/health` 與脫敏 `/admin/audit-logs`，完善日誌檢視。
- **Batch 5｜平台內容與功能治理**：展示 605 題學科與五大術科合規標準，展示維運事件分級通報矩陣（P0～P3），保護五大題組。
- **Batch 6｜權限、介面與無障礙**：檢驗 ADMIN 角色阻擋、RWD 響應式排版（320px～1920px）與 ARIA 焦點管理。
- **Batch 7｜整合測試與交付**：執行前後端完整測試套件與編譯檢查，產出正式結案報告。

---

## 六、盤點結論

專案既有之教師申請審核、AuditLog 脫敏查詢與健康檢查 API 基礎良好且具備高資安防護（JWT、CSRF、RBAC）。本波將以此為核心，打造誠實、穩固、不浮誇的平台管理主控台。
