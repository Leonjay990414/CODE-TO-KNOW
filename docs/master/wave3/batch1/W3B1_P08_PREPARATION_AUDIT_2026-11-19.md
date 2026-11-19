# CODE TO KNOW｜Wave 3 Batch 1｜Phase P08 前置盤點與規劃準備報告

- **專案名稱**：碼上學｜CODE TO KNOW
- **所屬階段**：Wave 3 Batch 1｜Phase P08 教室管理與教學支援
- **紀錄日期**：2026-11-19
- **盤點性質**：前置唯讀盤點與規劃準備（嚴格禁止未經授權之程式碼修改）
- **官方權重**：4.5000%
- **官方 UID 總數**：10 項（單項權重 0.4500%）
- **前置準備判定**：**READY FOR PLANNING**

---

## 1. Wave 3 官方階段劃分與定位

依據專案權威基準文件（`CODE_TO_KNOW_AUTHORITATIVE_BASELINE.md`、`WAVE2_SCOPE_RECONCILIATION.md` 及 `MASTER_20_PHASE_REORGANIZATION_PLAN.md`）：

Wave 3 聚焦於「教師端、班級管理與專業測驗教學體系」，共包含三個正式階段：

| Phase 編號 | Phase 官方名稱 | 所屬 Batch | 官方 UID 數 | 官方權重 | 階段狀態 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase P08** | **教室管理與教學支援** | **Wave 3 Batch 1** | **10 項** | **4.5000%** | **Preparation 盤點完成，待正式規劃** |
| Phase P09 | 學科題庫與線上測驗系統 | Wave 3 Batch 2 | 12 項 | 8.5000% | 待進入 |
| Phase P10 | 術科學習與實作檢定系統 | Wave 3 Batch 3 | 10 項 | 3.5000% | 待進入 |
| **合計** | **Wave 3 總計** | **3 個 Batch** | **32 項** | **16.5000%** | - |

專案既有規劃文件資產：
1. `docs/planning/CLASSROOM_MANAGEMENT_API_PERMISSION_DESIGN.md` (297 行)
2. `docs/planning/CLASSROOM_MANAGEMENT_SYSTEM_SPECIFICATION.md` (166 行)
3. `docs/planning/CLASSROOM_MANAGEMENT_UI_UX_SPECIFICATION.md` (123 行)

以上三份既有文件已定義高完整度之班級管理規格與權限架構，後續 Wave 3 Batch 1 正式規劃目錄（`docs/master/wave3/batch1/`）將全面繼承其優良設計，不另建衝突或重複規格。

---

## 2. Phase P08 官方 10 項 UID 清冊與權重

全數 UID 權重均為 **0.4500%**，合計精確等於 **4.5000%**：

| 重整後 UID | 原始 UID | 官方工作項目名稱 | 權重 | 官方驗收條件摘要 | 核心依賴 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P08-CLS-001** | `P08-CLS-001` | 班級建立與 8 位元英數邀請碼演算法 | 0.4500% | 教師建立班級，自動生成無混淆字元 (排除 0/O/1/I) 之 8 碼 code，具資料庫唯一性與碰撞重試 | P07 角色認證、Prisma `Class` |
| **P08-CLS-002** | `P08-CLS-002` | 學生憑碼加入班級與防重複入班機制 | 0.4500% | 學生輸入 8 碼邀請碼加入班級，防重複入班、防教師自我加入、檢查班級非封存狀態 | `ClassEnrollment`、學生認證 |
| **P08-CLS-003** | `P08-CLS-003` | 班級成員名冊查詢與狀態管理 | 0.4500% | 教師可分頁查詢班級學生名冊、入班時間、學習狀態，支援關鍵字搜尋 | IDOR 權限防護、Prisma 分頁 |
| **P08-CLS-004** | `P08-CLS-004` | 班級成員移除與退班安全處理 | 0.4500% | 教師踢除學生或學生自主退班；軟刪除或狀態標記，作答歷程完整保留供審計追蹤 | 審計日誌、關聯數據保留 |
| **P08-CLS-005** | `P08-CLS-005` | 班級歸檔、停用與狀態生命週期管理 | 0.4500% | 支援 `ACTIVE` / `ARCHIVED` 狀態切換，封存後不可加入新成員、只讀閱覽 | 生命週期狀態機、教師擁有人校驗 |
| **P08-TCH-001** | `P08-TCH-001` | 教師教學管理中心儀表板與班級統計 | 0.4500% | 提供班級總數、學生人數、活躍率、作業指派數等核心指標彙整 API 與前端面板 | 教師儀表板聚合統計 API |
| **P08-TCH-002** | `P08-TCH-002` | 教師指派學科/術科作業與學習任務 | 0.4500% | 教師可向班級發布作業（含截止日、題組 ID 或任務設定），學生可見其待辦任務 | `ClassAssignment` 模型與路由 |
| **P08-TCH-003** | `P08-TCH-003` | 班級學生學習進度與作答歷程檢視 | 0.4500% | 教師可查看特定學生在該班級相關題庫與實作任務之得分率、完成度與時間戳記 | 作答紀錄關聯查詢、權限控制 |
| **P08-TCH-004** | `P08-TCH-004` | 班級學科題目弱點分析與答錯率統計 | 0.4500% | 提供班級維度的題目答錯率排行、知識點弱點熱區彙整，輔助教學診斷 | 弱點統計聚合查詢 |
| **P08-TCH-005** | `P08-TCH-005` | 教師與學生資料隔離、水平越權防護 (IDOR) 與 AuditLog | 0.4500% | 嚴格防範非班級任課教師跨班讀取或異動班級、防學生越權查閱其他學生數據，記錄重要審計日誌 | `ownership.ts`、RBAC 中間件、審計記錄 |

---

## 3. 現況盤點：程式碼、資料模型與既有測試

### A. 資料庫模型（Prisma Schema：已正式存在）
- `Class`: 包含 `id`, `name`, `code` (邀請碼), `teacherId`, `description`, `status` (預設 ACTIVE), `createdAt`, `updatedAt`。
- `ClassEnrollment`: 包含 `id`, `classId`, `studentId`, `enrolledAt`, `status` (`ACTIVE`/`ARCHIVED`)，具備 `[classId, studentId]` 複合唯一鍵。
- `ClassAssignment`: 包含 `id`, `classId`, `title`, `description`, `examPaperId`, `dueDate`, `createdAt`。
- `TeacherProfile` 與 `TeacherApplication`: 具備完整教師資料與審核模型。

### B. 後端路由與服務現況
- 路由註冊：`backend/src/modules/classrooms/classroom.routes.ts`
  - `POST /api/classrooms` (教師建立班級)
  - `GET /api/classrooms` (教師查詢所屬班級)
  - `GET /api/classrooms/:id` (查詢特定班級詳情)
  - `GET /api/classrooms/:id/members` (查詢班級成員)
  - `POST /api/classrooms/join` (學生憑邀請碼加入班級)
- 服務實現：`backend/src/modules/classrooms/classroom.service.ts`
  - 8 碼邀請碼生成排除易混淆字元（`0, O, 1, I`），具備 5 次碰撞重試。
  - 防重複入班與防止教師自我加入。
- 權限防護：`backend/src/middleware/ownership.ts`
  - 具備 `verifyClassOwnership` 防範 IDOR 水平越權。
- 教師申請審核模組：`backend/src/modules/teachers/`
  - 具備教師資格申請、後台審查與審核通過自動賦予 `TEACHER` 角色之完整流程。

### C. 前端頁面與組件現況
- `frontend/src/pages/public/TeacherDashboardPage.tsx`：已建構高完整度教師儀表板 UI（班級列表、成員分頁、邀請碼複製、作業指派 Modal、班級弱點圖表），部分統計與作業發布現由前端狀態暫存。
- `frontend/src/components/StudentClassJoinModal.tsx`：學生憑碼入班 Modal。
- `frontend/src/components/TeacherApplyModal.tsx`：教師資格申請 Modal。

### D. 既有測試套件（測試數量盤點）
- `backend/tests/classroom-routes.test.ts`：**11 項測試**
- `backend/tests/classroom-permission.test.ts`：**8 項測試**
- `backend/tests/join-code.test.ts`：**17 項測試**
- `frontend/tests/teacher-dashboard-classroom.test.tsx`：**9 項測試**
- `frontend/tests/student-class-join.test.ts`：**7 項測試**
- **五套件累計測試案例數**：**52 項既有測試案例**

---

## 4. 初始 UID 狀態評估矩陣（嚴格區分 VERIFIED / PARTIAL）

| UID | 工作項目 | 狀態判定 | 現有進度依據與差距 |
| :--- | :--- | :--- | :--- |
| **P08-CLS-001** | 班級建立與 8 碼邀請碼 | **VERIFIED** | 後端 `createClassroom` 具備排除混淆字元、唯一性校驗與 17 項單元測試，已 100% 達成。 |
| **P08-CLS-002** | 學生憑碼入班與防重入 | **VERIFIED** | 後端 `joinClassroom` 防重入、防自己加入已實現並經整合測試驗證。 |
| **P08-CLS-003** | 班級成員名冊查詢與管理 | **PARTIAL** | 目前 `getMembers` 僅提供基本名單，缺少進階分頁、關鍵字搜尋與學習統計欄位。 |
| **P08-CLS-004** | 成員移除與退班安全處理 | **PARTIAL** | 後端尚缺明確的 `DELETE /api/classrooms/:id/members/:studentId` (踢除) 與 `POST /api/classrooms/:id/leave` (學生退班) 端點。 |
| **P08-CLS-005** | 班級歸檔與狀態生命週期 | **PARTIAL** | Prisma `Class.status` 已有 `ACTIVE`，尚缺 `PATCH /api/classrooms/:id/status` 歸檔/復原端點與歸檔後防異動檢查。 |
| **P08-TCH-001** | 教師管理儀表板與班級統計 | **PARTIAL** | 前端 UI 已就緒，但統計數據（學生總數、平均活躍度）目前為前端計算，後端尚需補足儀表板聚合 API。 |
| **P08-TCH-002** | 指派作業與學習任務 | **PARTIAL** | Prisma 已有 `ClassAssignment` 模型，後端尚缺作業 CRUD 路由與學生端作業列表端點。 |
| **P08-TCH-003** | 學生學習進度與作答檢視 | **PARTIAL** | 學生個別作答紀錄已在答題系統存在，但尚未聚合為「班級維度之學生成績檢視 API」。 |
| **P08-TCH-004** | 班級題目弱點分析統計 | **PARTIAL** | 前端有弱點圖表介面，後端尚缺班級錯題排行與弱點聚合計算 API。 |
| **P08-TCH-005** | 水平越權 (IDOR) 防護與審計 | **PARTIAL** | `verifyClassOwnership` 已實現核心班級隔離，尚缺擴展至作業、弱點資料與成員踢除的完整 AuditLog。 |

- **VERIFIED**：2 項 (20.00%)
- **PARTIAL**：8 項 (80.00%)
- **MISSING**：0 項 (0.00%)

---

## 5. 功能缺口與安全依賴分析

1. **班級生命週期與成員異動端點**：
   - `PATCH /api/classrooms/:id/status` (切換 ACTIVE / ARCHIVED)
   - `DELETE /api/classrooms/:id/members/:studentId` (教師踢除成員)
   - `POST /api/classrooms/:id/leave` (學生退出班級)
2. **作業指派系統 (ClassAssignment) 正式 API**：
   - `POST /api/classrooms/:id/assignments` (發布作業)
   - `GET /api/classrooms/:id/assignments` (班級作業列表)
3. **班級教學數據聚合分析 API**：
   - `GET /api/classrooms/:id/analytics/dashboard` (儀表板總覽指標)
   - `GET /api/classrooms/:id/analytics/weaknesses` (題目答錯率與弱點分析)
   - `GET /api/classrooms/:id/analytics/progress` (學生成績與完成度總表)
4. **安全依賴防護**：
   - 延續 P07 的 `requireRole('TEACHER')` 與 CSRF 防護。
   - 所有班級操作嚴格通過 `verifyClassOwnership`，避免 IDOR 越權存取。
   - 記錄關鍵操作（封存班級、踢除學生、發布作業）至 Audit Log。

---

## 6. 建議實作推進順序

- **Step 1｜班級生命週期與成員管理完備（CLS 系列補強）**：
  - 補齊成員踢除、學生退班、班級歸檔端點與分頁搜尋。
  - 對應 UID：`P08-CLS-003`, `P08-CLS-004`, `P08-CLS-005`。
- **Step 2｜作業指派與學生任務整合（TCH 作業核心）**：
  - 實現 `ClassAssignment` 路由、控制層與服務層。
  - 對應 UID：`P08-TCH-002`。
- **Step 3｜教學分析、弱點統計與 IDOR/審計加固（TCH 統計與安全）**：
  - 實現班級儀表板指標聚合、弱點錯題分析 API 與安全審計。
  - 對應 UID：`P08-TCH-001`, `P08-TCH-003`, `P08-TCH-004`, `P08-TCH-005`。

---

## 7. 測試與驗證策略

1. **單元與整合測試（Jest / Supertest）**：
   - 規劃 `backend/tests/classroom-lifecycle.test.ts`（涵蓋歸檔、踢除、退班邊界）。
   - 規劃 `backend/tests/classroom-assignment.test.ts`（涵蓋指派作業、截止日、權限校驗）。
   - 規劃 `backend/tests/classroom-analytics.test.ts`（涵蓋弱點排行、學生作答聚合計算）。
2. **安全越權測試（IDOR Test Suite）**：
   - 驗證教師 A 無法查看或異動教師 B 的班級、作業、學生作答數據。
   - 驗證學生無法發布作業或查閱他人個別評量細節。

---

## 8. 預估需授權修改之檔案清單

- 後端規格與服務：
  - `backend/src/modules/classrooms/classroom.schema.ts`
  - `backend/src/modules/classrooms/classroom.service.ts`
  - `backend/src/modules/classrooms/classroom.controller.ts`
  - `backend/src/modules/classrooms/classroom.routes.ts`
- 後端測試套件：
  - `backend/tests/classroom-lifecycle.test.ts`
  - `backend/tests/classroom-assignment.test.ts`
  - `backend/tests/classroom-analytics.test.ts`

---

## 9. 判定結論

**READY FOR PLANNING (具備進入正式規劃之完整條件)**。

> [!NOTE]
> 本文件僅為 2026-11-19 前置盤點之歷史紀錄，不代表六份正式規劃文件（`W3B1_UID_SCOPE_AND_TRACEABILITY.md`、`W3B1_IMPLEMENTATION_PLAN.md` 等），亦禁止擅自進入程式碼實作。
