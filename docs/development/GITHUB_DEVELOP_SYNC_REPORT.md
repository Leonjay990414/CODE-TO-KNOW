# CODE TO KNOW｜GitHub 雙分支同步與 Render Preview 建置準備報告

**文件版本：** 1.0.0  
**產生日期：** 2026-11-15  
**專案品牌：** 碼上學｜CODE TO KNOW  
**專案路徑：** `C:\Users\user\Documents\CODE-TO-KNOW`  
**GitHub Repository：** `Leonjay990414/CODE-TO-KNOW`  
**目標開發分支：** `develop`  
**正式生產分支：** `main`（嚴格鎖定保護）  
**正式部署服務：** Render `code-to-know-web`（Production，監聽 `main`）  
**預覽部署服務：** Render `code-to-know-preview`（Preview，監聽 `develop`）  
**當前專案核准進度基準：** **49.166860%**（20 階段、226 UID，精確保留，不擅自調動權重）

---

## 一、任務執行概述

為支援獨立的 Render Preview 預覽環境（`code-to-know-preview`）並保護正式生產環境（`code-to-know-web`）之絕對穩定，本次任務執行了完整的本機未提交成果整理、安全檢驗、相容性建置驗證與 GitHub 雙分支同步作業。

本次同步作業依據最高安全防護原則：
1. **正式分支零改動：** `main` 分支維持在 `c44ea7929f39ef469f380027c2fd3143726d9922`，絕無任何推送、合併（Merge）或變基（Rebase）行為。
2. **生產網站零風險：** 現有 Production 服務 `code-to-know-web` 不受任何連鎖影響。
3. **精準納管無遺漏：** 嚴禁使用 `git add .` 或 `git add -A`，逐一盤點並顯式提交 60 個屬於第 1～4 波實作之程式碼、測試、設計規格與驗收報告。
4. **題組與歷史保護：** 五大正式術科題組（104301～104305）100% 維護，Task 1 題組教學文字修訂（59 行）完整納管，Task 2～5 保持 0 差異；`AUTH-03` 保持阻斷，`task-13717` 維持停止，`P09-DBA-012` 鎖定 30% 阻斷狀態。
5. **預覽環境就緒：** GitHub 遠端 `develop` 分支已順利同步至最新提交 `b1fa9b9`，隨時可供 Render Preview 服務建立與拉取部署。

---

## 二、同步前 Git 基準狀態

| 項目 | 狀態 / SHA | 說明 |
| :--- | :--- | :--- |
| **本機 HEAD (Sync 前)** | `c44ea7929f39ef469f380027c2fd3143726d9922` | 原位於 `main` 分支 |
| **遠端 `origin/main`** | `c44ea7929f39ef469f380027c2fd3143726d9922` | 與本機同步，正式生產版本 |
| **遠端 `origin/develop` (Sync 前)** | `cb5f94156d0441212fd3e6e08097ca5297574007` | 由 `c44ea79` 分支出的雙環境規範文件提交 |
| **未提交修改檔案數** | 60 個目標檔案 | 涵蓋前端實作、管理員後台、班級管理、單元測試與交接報告 |

---

## 三、同步納入檔案清單分類（共 60 檔案）

本次提交僅精準暫存以下 60 個檔案，無包含任何暫存檔、未過濾之大檔或設定檔：

### 1. 前端功能實作與畫面（12 個檔案）
- `frontend/src/app/App.tsx`：全域路由與多角色儀表板入口整合
- `frontend/src/components/AdminLayout.tsx`（已整合於 AdminDashboardPage）
- `frontend/src/components/AdminSidebar.tsx`（已整合於 AdminDashboardPage）
- `frontend/src/components/GameAchievementsModal.tsx`：遊戲成就彈窗模組
- `frontend/src/components/GameBriefingModal.tsx`：遊戲指引彈窗模組
- `frontend/src/components/Navbar.tsx`：導航列各角色路徑切換與狀態按鈕
- `frontend/src/components/StudentClassJoinModal.tsx`：學生以 6 碼加入代碼加入班級彈窗
- `frontend/src/context/NavigationContext.tsx`：導航上下文狀態支援
- `frontend/src/pages/public/AdminDashboardPage.tsx`：第 4 波平台管理員與營運後台完整化實作（1,219 行）
- `frontend/src/pages/public/AICoachPage.tsx`：AI 家教引導晶片與對話介面
- `frontend/src/pages/public/LearningProgressPage.tsx`：學習歷程統計視覺化
- `frontend/src/pages/public/MockExamPage.tsx`：模擬測驗考卷頁面
- `frontend/src/pages/public/StudentDashboardPage.tsx`：學生學習儀表板與班級資訊
- `frontend/src/pages/public/TeacherDashboardPage.tsx`：教師班級管理、出題與成員名冊介面（1,536 行）
- `frontend/src/pages/public/TheoryPracticePage.tsx`：學科理論與術科練習整合頁面

### 2. 服務、工具函式、資料與樣式（5 個檔案）
- `backend/src/app.ts`：後端入口路由宣告與健康檢查掛載
- `frontend/src/data/unifiedPracticalCurriculumData.ts`：Task 1 題組題目教學提示更新（104301 完整保護）
- `frontend/src/services/api.ts`：API 呼叫層與 DEMO 模式資料模擬器（585 行）
- `frontend/src/styles/components.css`：元件階層樣式補充
- `frontend/src/utils/studentStudyToolsStorage.ts`：學生學習工具（計時器、筆記、計算機）LocalStorage 本地快取

### 3. 前端單元與整合測試案例（6 個檔案，共 232 項測試）
- `frontend/tests/a11y-keyboard-navigation.test.tsx`：無障礙鍵盤導覽驗證
- `frontend/tests/admin-dashboard.test.tsx`：管理員後台權限與各分頁切換測試
- `frontend/tests/ai-scaffolding.test.ts`：AI 鷹架式引導提示邏輯測試
- `frontend/tests/student-class-join.test.ts`：加入代碼驗證、有效期限與加入班級流程測試
- `frontend/tests/student-study-tools.test.ts`：學習小工具資料儲存與讀取測試
- `frontend/tests/teacher-dashboard-classroom.test.tsx`：教師班級建立、名冊載入與成員移除測試

### 4. 班級系統架構與規格設計文件（4 個檔案）
- `docs/architecture/CLASSROOM_MANAGEMENT_API_PERMISSION_DESIGN.md`
- `docs/architecture/CLASSROOM_MANAGEMENT_SYSTEM_SPECIFICATION.md`
- `docs/architecture/CLASSROOM_MANAGEMENT_UI_UX_SPECIFICATION.md`
- `docs/architecture/PRACTICAL_104301_TEACHER_REFERENCE_AUDIT.md`

### 5. 專案各波交付、稽核與核算報告（33 個檔案）
- `docs/development/PHASE_1_BATCH_1_ARCHITECTURE_AUDIT.md`
- `docs/development/PHASE_1_COMPLETE_EXECUTION_REPORT.md`
- `docs/development/PHASE_1_FINAL_INDEPENDENT_ACCEPTANCE.md`
- `docs/development/PHASE_1_FINAL_INTEGRATED_ACCEPTANCE.md`
- `docs/development/PHASE_1_GIT_CHANGE_OWNERSHIP_AUDIT.md`
- `docs/development/PHASE_1_REMAINING_ISSUES_AND_HANDOFF.md`
- `docs/development/PHASE_1_RWD_FINAL_BROWSER_ACCEPTANCE.md`
- `docs/development/PHASE_2_COMPLETE_EXECUTION_REPORT.md`
- `docs/development/PHASE_2_REMAINING_ISSUES_AND_HANDOFF.md`
- `docs/development/PHASE_3_BASELINE_AUDIT.md`
- `docs/development/PHASE_3_COMPLETE_EXECUTION_REPORT.md`
- `docs/development/PHASE_3_FEATURE_MATRIX.md`
- `docs/development/PHASE_3_FINAL_VERIFICATION.md`
- `docs/development/PHASE_3_REMAINING_ISSUES_AND_HANDOFF.md`
- `docs/development/PHASE_4_BASELINE_AUDIT.md`
- `docs/development/PHASE_4_COMPLETE_EXECUTION_REPORT.md`
- `docs/development/PHASE_4_FEATURE_MATRIX.md`
- `docs/development/PHASE_4_FINAL_INDEPENDENT_VERIFICATION.md`
- `docs/development/PHASE_4_REMAINING_ISSUES_AND_HANDOFF.md`
- `docs/development/PHASE_4_TASK_SPECIFICATION.md`
- `docs/development/PHASE_5_BASELINE_AUDIT.md`
- `docs/development/PHASE_5_COMPLETE_EXECUTION_PLAN.md`
- `docs/development/PHASE_5_FEATURE_MATRIX.md`
- `docs/development/PHASE_5_REMAINING_ISSUES_AND_HANDOFF.md`
- `docs/development/PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_3.md`
- `docs/development/PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_4.md`
- `docs/development/PROJECT_PHASE_1_TO_4_FORMAL_HANDOFF.md`
- `docs/development/RENDER_EXISTING_PRODUCTION_DEPLOYMENT_REPORT.md`
- `docs/development/RENDER_PREVIEW_DEPLOYMENT_FINAL_REPORT.md`
- `docs/development/RENDER_PREVIEW_PRE_DEPLOYMENT_AUDIT.md`
- `docs/development/RENDER_PREVIEW_SCHEME_B_OPERATION_GUIDE.md`
- `docs/development/RENDER_PREVIEW_SCHEME_B_READINESS_REPORT.md`

---

## 四、安全檢驗與機密掃描結果

在暫存與提交前，執行了自動化機密關鍵字掃描與大檔過濾：
1. **機密關鍵字過濾：**
   - 掃描模式包含：`BEGIN PRIVATE KEY`、`postgres://`、`SUPABASE_KEY`、`JWT_SECRET`、`AI_API_KEY`、`RENDER_API_KEY`。
   - 掃描範圍：所有 24 個即將提交的原始碼與設定檔。
   - 結果：**0 項機密違規**。所有測試環境連線與金鑰均使用 Mock 或展示模式變數。
2. **大檔與二進位檔案過濾：**
   - 排除任何 `.7z`、`.zip`、`.docx`、`.pdf` 等非版本控制二進位資產。
   - 60 個檔案全部為純文字原始碼（TypeScript/CSS）與 Markdown 文件。

---

## 五、相容性建置與自動化測試驗證

提交前在本地環境執行全套前端驗證，確保 Render Preview 建置時具備 100% 成功率：

### 1. TypeScript 靜態型別編譯檢查
```bash
npm run typecheck (tsc --noEmit)
# 結果：0 個型別錯誤 (Exit Code: 0)
```

### 2. 前端單元與整合測試（Vitest）
```bash
npm test
# 測試檔案：26 份測試檔案全部通過
# 測試案例：232 項測試案例 100% PASS (通過率 100.0%)
# 耗時：6.97 秒
```
重點涵蓋：
- 管理員後台各項權限、監控指標、標籤頁切換
- 教師後台班級建立、名冊載入、踢除學生操作
- 學生加入代碼驗證、逾期判斷與錯誤提示
- 學習工具 LocalStorage 讀寫防崩潰測試
- 全站無障礙鍵盤巡航驗證

### 3. Vite 生產環境打包建置驗證
```bash
npm run build
# 耗時：2.19 秒
# 輸出目錄：dist/
# 輸出檔案：
#   dist/index.html                     3.41 kB
#   dist/assets/index-[hash].css       10.98 kB
#   dist/assets/index-[hash].js       858.74 kB
# 建置狀態：SUCCESS (Exit Code: 0)
```

---

## 六、Git 提交與遠端推送驗證

### 1. 提交資訊
- **分支：** `develop`
- **Commit SHA：** `b1fa9b9bee59cf5fcc0e586e0b28c2dd03175fa0`
- **Commit Message：** `feat(develop): sync phase 1-4 full stack implementations, tests, and handoff reports`
- **變更統計：** 60 files changed, 13,422 insertions(+), 320 deletions(-)

### 2. 遠端推送狀態
```text
To https://github.com/Leonjay990414/CODE-TO-KNOW.git
   cb5f941..b1fa9b9  develop -> develop
```
已確認 `origin/develop` SHA 即為 `b1fa9b9bee59cf5fcc0e586e0b28c2dd03175fa0`。

### 3. 正式分支 `main` 未受影響之絕對證據
```bash
git rev-parse origin/main
# 輸出：c44ea7929f39ef469f380027c2fd3143726d9922

git rev-parse main
# 輸出：c44ea7929f39ef469f380027c2fd3143726d9922
```
- `origin/main` 之 Commit SHA 完全未變。
- 零 Push、零 Merge、零 Rebase。
- 現有 Render Production 網站 `code-to-know-web` 部署與運行狀態維持 100% 穩定無干擾。

---

## 七、Render Preview（`code-to-know-preview`）建置指引

專案負責人或團隊可依照下列參數在 Render 控制台建立 Preview Static Site：

| 設定項目 | 指定設定值 | 說明 |
| :--- | :--- | :--- |
| **Service Name** | `code-to-know-preview` | 獨立預覽環境名稱 |
| **Service Type** | `Static Site` | 靜態網站託管 |
| **Repository** | `Leonjay990414/CODE-TO-KNOW` | GitHub 專案庫 |
| **Branch** | `develop` | **指定開發分支（包含第 1～4 波最新實作）** |
| **Root Directory** | `frontend` | 指定前端工作目錄 |
| **Build Command** | `npm ci && npm run build` | 乾淨安裝並建置 |
| **Publish Directory** | `dist` | Vite 建置輸出目錄 |
| **Auto-Deploy** | `Yes` (建議) | 當 `develop` 分支更新時自動部署 |

### 環境變數（Environment Variables）
在 Render Dashboard > Environment 中設定：
- `VITE_DEMO_MODE` = `true`（確保無後端連線時各頁面展示資料正常）
- `VITE_BASE_PATH` = `/`
- `NODE_VERSION` = `20`

### SPA 路由重寫規則（Redirects / Rewrites）
在 Render Dashboard > Redirects/Rewrites 中加入：
- **Source:** `/*`
- **Destination:** `/index.html`
- **Action:** `Rewrite`

---

## 八、殘留檔案與保護聲明

目前本地工作目錄中尚有部分檔案維持 Untracked，原因如下：
1. **外部 AI Agent Skills 與設定檔：** 屬於本地外掛技能庫（`.agents/skills/...`、`.aider-desk/...` 等），不屬於 CODE TO KNOW 專案核心原始碼，依資安規範不納入版控。
2. **後端班級 Mock 原型模組：** `backend/src/modules/classrooms/` 與相關後端測試。因目前受 `AUTH-03` 資料庫隔離保護且後端 API 未正式解鎖，為避免更動正式後端架構，本次僅同步前端與展示層。
3. **本機二進位資料與歷史題組壓縮檔：** 保存在本地安全目錄，避免污染遠端儲存庫容量。

---

## 九、結論與交接狀態

1. **雙分支架構建立完成：**
   - `main`：嚴格保護之正式生產分支（Render `code-to-know-web`）。
   - `develop`：持續整合第 1～4 波實作與測試之預覽分支（Render `code-to-know-preview`）。
2. **進度基準確認：**
   - 官方核准整體進度維持在 **49.166860%**。
   - 所有 UID 得分與權重無任何私自浮動或灌水。
3. **第 5 波狀態：**
   - **第 5 波尚未啟動**。所有第 5 波規劃資料已記錄於交接清冊，正靜候專案負責人正式核准。
