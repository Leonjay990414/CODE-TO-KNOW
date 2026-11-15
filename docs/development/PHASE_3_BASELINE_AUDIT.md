# 碼上學｜CODE TO KNOW
# 第 3 波：教師管理平台基準盤點與安全檢查報告 (Batch 0 Baseline Audit)

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台  
**執行波次：** 第 3 波 Batch 0  
**基準時間：** 2026-11-15  
**Git HEAD：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**分支：** `main`  
**正式 UID 基準維持率：** 45.961878% (103.873843 / 226 UID) — 嚴格鎖定維持  

---

## 一、Git 與工作目錄安全基準記錄

### 1.1 核心 Git 狀態
- **Git HEAD SHA：** `c44ea7929f39ef469f380027c2fd3143726d9922`
- **當前分支：** `main`
- **追蹤中既有修改檔案（共 15 檔，必須 100% 保留）：**
  1. `backend/src/app.ts` (Phase 1: 班級路由註冊)
  2. `frontend/src/app/App.tsx` (Phase 1 & 2: 路由保護與 SEO)
  3. `frontend/src/components/GameAchievementsModal.tsx`
  4. `frontend/src/components/GameBriefingModal.tsx`
  5. `frontend/src/components/Navbar.tsx`
  6. `frontend/src/context/NavigationContext.tsx`
  7. `frontend/src/data/unifiedPracticalCurriculumData.ts` (Phase 1 既有題組一 59 行變動，絕對保護)
  8. `frontend/src/pages/public/AICoachPage.tsx`
  9. `frontend/src/pages/public/LearningProgressPage.tsx`
  10. `frontend/src/pages/public/MockExamPage.tsx`
  11. `frontend/src/pages/public/StudentDashboardPage.tsx` (Phase 2: 學生儀表板串接)
  12. `frontend/src/pages/public/TeacherDashboardPage.tsx` (待本波完整化)
  13. `frontend/src/pages/public/TheoryPracticePage.tsx` (Phase 2: 收藏與筆記)
  14. `frontend/src/services/api.ts` (Phase 1: 班級 API 客戶端)
  15. `frontend/src/styles/components.css`

### 1.2 外部阻礙狀態確認
- **AUTH-03：** `BLOCKED`（本機 Docker PG17 未啟動，嚴禁連線生產資料庫或偽造連線）。
- **task-13717：** `STOPPED`（背景行程維持終止）。
- **P09-DBA-012：** `BLOCKED (30%)`（維持原進度）。

---

## 二、教師端路由、頁面與元件盤點

### 2.1 路由與存取保護
- **主路由：** `teacher-dashboard`（對應 `TeacherDashboardPage.tsx`）。
- **路由保護中介元件：** `ProtectedRoute.tsx`
  - 宣告：`requiredRoles={['TEACHER', 'ADMIN']}`
  - 角色驗證邏輯：`expandCompatibleFrontendRoles(requiredRoles)` 確保僅具備 `TEACHER` 或 `ADMIN` 角色之登入者可進入。
  - 未登入行為：導向登入視窗，並以 `sessionStorage` 暫存 `ctk_intended_route`。
  - 非教師（如一般學員 `STUDENT`）存取：呈現標準 403 Forbidden 專屬頁面，提示「需要教師資格 (Teacher Access Required)」並提供「申請成為認證教師」與「返回學生中心」CTA。

### 2.2 教師端相關元件與彈窗
1. **`TeacherApplyModal.tsx`**：
   - 負責一般使用者申請教師認證之表單 Modal（填寫服務學校、任教科目、申請理由、證明文件等）。
   - 調用 API：`teacherApi.applyTeacherRole()`。
2. **`TeacherDashboardPage.tsx`**：
   - 當前教師端主要頁面。
   - 包含四個頁籤（Tabs）：
     - `roster`：我的班級學員
     - `benchmark`：檢定常模分析與失分熱點
     - `curriculum`：官方題庫與術科教材備課
     - `announcements`：班級公告與備忘

---

## 三、既有班級管理 API 與後端支援盤點

在 Phase 1 中，後端已經完成了班級管理核心模組，且 `classroomApi` 已於 `frontend/src/services/api.ts` 完成定義：

| API 端點 | HTTP 方法 | 前端 Service 方法 | 後端 Controller / Service | 權限要求 | 狀態 |
| :--- | :---: | :--- | :--- | :---: | :---: |
| `/api/classrooms` | `POST` | `classroomApi.createClassroom` | `classroomController.createClassroom` | `TEACHER` / `ADMIN` | **真實 API 就緒** |
| `/api/classrooms/my-teaching` | `GET` | `classroomApi.getMyTeachingClassrooms` | `classroomController.getMyTeachingClassrooms` | `TEACHER` / `ADMIN` | **真實 API 就緒** |
| `/api/classrooms/my-enrolled` | `GET` | `classroomApi.getMyEnrolledClassrooms` | `classroomController.getMyEnrolledClassrooms` | `STUDENT` / `ADMIN` | **真實 API 就緒** |
| `/api/classrooms/join` | `POST` | `classroomApi.joinClassroom` | `classroomController.joinClassroom` | `STUDENT` / `ADMIN` | **真實 API 就緒** |
| `/api/classrooms/:id/members` | `GET` | `classroomApi.getClassroomMembers` | `classroomController.getClassroomMembers` | `TEACHER` / `ADMIN` (Scoped) | **真實 API 就緒** |
| `/api/classrooms/:id/members/:studentId` | `DELETE` | `classroomApi.removeMember` | `classroomController.removeMember` | `TEACHER` / `ADMIN` (Scoped) | **真實 API 就緒** |

**重要發現：**
上述 API 雖然已在 Phase 1 研發完畢並通過 11 項整合測試（`backend/tests/classroom-routes.test.ts`），但在前端 `TeacherDashboardPage.tsx` 中，`roster` 頁籤目前**直接顯示未連線之 EmptyState**，尚未將上述 API 串接至教師前端畫面！這是本波必須優先完成之重大缺口。

---

## 四、教師端功能現況、Mock Data 與未完成功能盤點

### 4.1 現有功能實作真實性盤點表

| 功能區塊 | 現況實作方式 | 是否有真實 API | 是否為純前端/Mock | 缺失與問題 |
| :--- | :--- | :---: | :---: | :--- |
| **教師身分審核狀態** | 調用 `teacherApi.getMyApplication()` | **有** | 否（真實請求） | 具備 PENDING / APPROVED / REJECTED 完整狀態展示。 |
| **班級列表與建立** | 僅呈現 `EmptyState` 文字 | **有** (`POST /classrooms`, `GET /classrooms/my-teaching`) | 是（尚未串接） | **嚴重缺口**：尚未將既有 `classroomApi` 串接到 `TeacherDashboardPage`。 |
| **學生名冊查看與移除** | 尚未實作在頁面中 | **有** (`GET /:id/members`, `DELETE /:id/members/:studentId`) | 是（尚未串接） | **嚴重缺口**：尚未實作名冊列表、搜尋與移除確認彈窗。 |
| **常模統計與考點分析** | 呈現歷屆常模參考數據（1,240 人次、錯誤熱點 #058, #305, #112） | 否（為靜態學術常模） | 是（已明確標註常模基準） | 已標註「非單一特定班級真實成績」，符合透明原則。 |
| **教材備課檢視** | 檢視學科 605 題與術科五大題組大綱 | **有**（本地正規題庫資料） | 否（讀取官方標準題庫） | 運作良好，可保留。 |
| **教學公告發布** | 僅儲存於 React `useState` 暫態陣列 | 否（後端無公告 API） | 是（純前端暫態） | 頁面重整後公告遺失，未持久化。 |
| **測驗派卷按鈕** | 彈出 `alert('班級測驗派卷 API 將於下一階段開通')` | 否 | 是（按鈕無實質功能） | 死按鈕/Alert，需改善為明確的未開通狀態與需求排程指引。 |
| **匯出成績報表** | 彈出 `alert('學生成績報表匯出功能已排入開發時程')` | 否 | 是（按鈕無實質功能） | 死按鈕/Alert，需改善為明確狀態。 |

### 4.2 程式碼重複結構問題
- `TeacherDashboardPage.tsx` 存在嚴重的程式碼重複：行 808～1127 完整複製了行 369～681 的「教材備課」與「公告」內容，產生了兩套相同的 Tab 渲染邏輯，導致檔案膨脹至 1127 行。本波必須予以精簡消除。

---

## 五、第 3 波功能改善與整合路線圖 (Batches 1～6)

1. **Batch 1：教師首頁與儀表板優化**
   - 建立真實班級與學員統計卡片（調用 `classroomApi.getMyTeachingClassrooms()`）。
   - 消除重複之 Tab 渲染程式碼。
   - 明確區分「班級即時數據」與「全國常模參考數據」。
2. **Batch 2：班級管理完整化**
   - 串接 `classroomApi.getMyTeachingClassrooms()` 渲染教師已建立之班級卡片。
   - 實作「建立班級」Modal，串接 `classroomApi.createClassroom()`。
   - 支援 8 碼加入碼展示與單鍵複製（具備已複製即時反饋）。
   - 提供無班級時之友善引導 EmptyState。
3. **Batch 3：學生管理完整化**
   - 點擊特定班級展開學生名冊，串接 `classroomApi.getClassroomMembers(classId)`。
   - 提供學生姓名/信箱即時搜尋。
   - 實作「移除學生」安全確認 Modal，串接 `classroomApi.removeMember(classId, studentId)`。
   - 完整處理空名冊、載入中與錯誤狀態。
4. **Batch 4：教學管理功能整合與狀態清晰化**
   - 保留學科 605 題與術科五大題組備課檢視。
   - 將公告發布升級為持久化 LocalStorage（`ctk_teacher_announcements:{userId}`），明確標註為本機草稿，標註雲端 API 尚未開通。
   - 將未支援之「派卷」與「匯出」移除惱人 `alert()`，改為清楚的「敬請期待／功能規劃中」優雅說明與禁用態。
5. **Batch 5：權限驗證與無障礙體驗整合**
   - 驗證 `ProtectedRoute`、帳號切換、登出資料清理。
   - 檢查 Modal Focus Trap、鍵盤 ESC 關閉、焦點還原。
   - 完整檢查 13 種 RWD 螢幕斷點。
6. **Batch 6：全套回歸測試與文件交付**
   - 執行前後端 Vitest、TypeScript Build、Vite Build。
   - 產出最終執行總結報告、殘留清單與功能矩陣。

---
**核定結論：** 基準盤點與安全檢查完成，無違反禁止事項，正式准予推進 Batch 1。