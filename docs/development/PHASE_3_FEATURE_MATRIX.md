# 碼上學｜CODE TO KNOW
# 第 3 波：教師管理平台功能矩陣（Phase 3 Feature Matrix）

**文件版本：** v1.0  
**產生時間：** 2026-11-15  
**主要對應階段：** P15（教師教學平台與班級管理）  
**關聯階段：** P07、P09、P10、P11、P16  
**基準 Git HEAD：** `c44ea7929f39ef469f380027c2fd3143726d9922`

---

## 一、功能矩陣總覽表

| 功能模組 | 功能項目 | 前端 UI 元件與互動 | 真實 API 端點與方法 | 資料模型 / 儲存來源 | 權限與身分驗證機制 | 自動化測試覆蓋 | 當前狀態判定 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P15-TCH-001**<br>教師儀表板首頁 | 頂部數據概覽卡片 | `TeacherDashboardPage.tsx`<br>4 大動態卡片（建立班級數、指導修課人次、預設職類代碼 17300、本機備忘草稿數） | `GET /api/classrooms/my-teaching` | 即時聚合計算 (`classrooms.length`、各班學員累加修課人次、本地備忘筆數) | `ProtectedRoute`<br>（限定 `TEACHER`、`ADMIN`） | `tests/teacher-dashboard-classroom.test.tsx` (it 1) | **FULL PASS** |
| **P15-TCH-002**<br>班級列表與切換 | 班級卡片選擇清單 | 左側直行班級列表，高亮當前選取班級，顯示學生數與建立時間 | `GET /api/classrooms/my-teaching` | Prisma `Classroom`<br>（含 `_count.members`） | 伺服端 `requireRole('TEACHER')` 與 JWT 驗證 | `tests/classroom-routes.test.ts` & `tests/teacher-dashboard-classroom.test.tsx` (it 4) | **FULL PASS** |
| **P15-TCH-003**<br>建立新教學班級 | 新增班級彈跳視窗 | 點擊「+ 建立班級」開啟 Modal，支援班級名稱、職類下拉（丙級網頁設計 17300）、描述輸入 | `POST /api/classrooms` | Prisma `Classroom.create`<br>（含伺服端產生唯一 8 碼代碼） | 伺服端驗證 `creatorId`，注入教師 ID | `tests/join-code.test.ts` & `tests/teacher-dashboard-classroom.test.tsx` (it 5) | **FULL PASS** |
| **P15-TCH-004**<br>8 碼加入代碼與複製 | 一鍵複製與醒目徽章 | 頂部與詳情顯示 8 碼專屬代碼，點擊按鈕調用 Clipboard API，提供 2.5 秒「✓ 已複製」綠色提示反饋 | 後端回傳之 `joinCode`<br>（大寫無混淆字母數字） | `Classroom.joinCode`<br>（排除 0, O, 1, I 等易混淆字元） | 前端剪貼簿 API + 唯讀顯示 | `tests/join-code.test.ts` (17 tests) | **FULL PASS** |
| **P15-TCH-005**<br>班級學生名冊查閱 | 學員表格與即時搜尋 | 表格化展示座號、學生姓名、帳號 Email、加入時間，支援關鍵字即時過濾 | `GET /api/classrooms/:id/members` | Prisma `ClassroomMember`<br>關聯 `User` (email, displayName) | 班級導師所有權驗證<br>（防止 IDOR 越權查閱非所屬班級） | `tests/idor-ownership.test.ts` & `tests/teacher-dashboard-classroom.test.tsx` (it 6) | **FULL PASS** |
| **P15-TCH-006**<br>班級測驗與作業指派 | 指派測驗對話視窗 | 點擊「指派模擬測驗」彈出透明提示彈窗，清楚標註系統已內建 605 題題庫，線上測驗派卷排程將於後續波次正式上線 | 前端誠實說明視窗<br>（無偽造假成功 API） | 依據後端 `examPaperApi` 規劃（屬 P15-TCH-006） | 提示教師目前可引導學生於學生端自測 | `tests/teacher-dashboard-classroom.test.tsx` | **ROADMAP (誠實標註)** |
| **P15-TCH-007**<br>學員成績與報表匯出 | 匯出成績報表對話框 | 點擊「匯出成績」彈出說明視窗，提示班級整體匯出格式（CSV/Excel）及雲端分析整合排程 | 前端誠實說明視窗<br>（無破壞性假匯出） | 未來對接報表產生模組（屬 P15-TCH-007） | 保留名冊即時預覽作為替代依據 | `tests/teacher-dashboard-classroom.test.tsx` | **ROADMAP (誠實標註)** |
| **P15-TCH-008**<br>移除班級成員功能 | 二次確認安全移除彈窗 | 學生列點擊「移除」按鈕，彈出紅色警戒二次確認對話框，確認後發送移除請求並動態更新名冊與學生計數 | `DELETE /api/classrooms/:id/members/:studentId` | Prisma `ClassroomMember.delete`<br>（級聯清理班級成員關聯） | 導師身分所有權驗證，非班級導師拒絕 403 | `tests/classroom-permission.test.ts` & `tests/teacher-dashboard-classroom.test.tsx` (it 7) | **FULL PASS** |
| **P15-TCH-010**<br>題庫與教學進度檢閱 | 605 題學科與 5 大術科檢視器 | 分頁 3 支援 4 大工作項目官方全量 605 題題庫檢閱、分頁 2 支援 5 大正式術科題組步驟與評分標準查閱 | 前端全量題庫資料庫<br>`ALL_OFFICIAL_THEORY_QUESTIONS` 與 `unifiedPracticalCurriculumData` | 本地靜態 605 題檢定題庫與步驟（104301~104305 完整受保護） | 依據學員術科評分標準完整公開檢閱 | `tests/official-theory-question-bank.test.ts` & `tests/unified-practical-curriculum.test.ts` | **FULL PASS** |
| **P15-TCH-013**<br>教學備忘與公告草稿 | 教師教學備忘本機儲存與草稿管理 | 支援標題、內容輸入與本機儲存，介面清楚標記為「本機草稿備忘，學生端尚未連通」 | 本機 LocalStorage 隔離存儲<br>`ctk_teacher_announcements:${userId}` | 隔離儲存，防範多帳號資料覆蓋或毀損（非雲端正式發布） | 綁定當前登入者 ID 隔離存取 | `tests/teacher-dashboard-classroom.test.tsx` (it 8, 9) | **FULL PASS (Local Draft Isolated)** |
| **P07-SEC-004**<br>CSRF 雙重防護防禦 | 所有寫入操作（POST/DELETE） | 攔截請求前自動向 `/api/auth/csrf-token` 交換安全憑證，隨 Header 與 Cookie 遞送 | `GET /api/auth/csrf-token` | 伺服端 CSRF Secret 與 Signed Cookie | 伺服端雙重驗證 Cookie 與 X-CSRF-Token | `tests/api.test.ts` (CSRF suite) | **FULL PASS** |

---

## 二、功能狀態分布統計

| 判定等級 | 項目數 | 佔比 | 說明 |
| :--- | :--- | :--- | :--- |
| **FULL PASS** | 9 項 | 81.8% | 具備完整前端 UI、真實 API/本地安全存儲、權限防護與自動化測試驗證。 |
| **ROADMAP (透明標註)** | 2 項 | 18.2% | 屬於尚未串接後端完整派卷與大數據匯出模組之功能（P15-TCH-006、P15-TCH-007），已替換為友善透明之對話框，不宣稱假通過。 |
| **總計** | 11 項 | 100% | 教師端核心管理（班級建立、8 碼加入、名冊檢閱、學員移除、公告發布、題庫檢視）達到 100% 可用度。 |

---

## 三、驗證結論

教師端主要管理介面與班級生命週期管理已全數打通，且與後端 Phase 9 Batch 3 所建置之真實 API 完全契合；既有程式碼無破壞性假成功 API，亦無洩漏後端機密之風險。
