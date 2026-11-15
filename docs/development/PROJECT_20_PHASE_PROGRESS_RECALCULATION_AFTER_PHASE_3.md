# 碼上學｜CODE TO KNOW
# 全站 20 階段 226 UID 進度正式回溯與重新核算報告（第 1～3 波累積成果）

> **文件狀態：** 建議核算結果（Proposal for User Review）  
> **基準線保護聲明：** 本文件為依據第 1～3 波客觀程式碼與測試證據產出之「建議核算報告」，在未獲使用者正式核准前，**不直接覆寫**原始正式進度基準線（45.961878%），不自動更改任何外部系統狀態。  
> **第 4 波隔離聲明：** 第 4 波（平台管理員與營運後台 P16）目前正在獨立執行 Batch 0～7，本次核算完全排除第 4 波任何工作成果，絕無干擾或提早計分。  
> **核算日期：** 2026-11-15（最後針對性數字與證據校準版）  
> **專案路徑：** `c:/Users/user/Documents/CODE-TO-KNOW`  
> **Git 基準：** Commit `c44ea7929f39ef469f380027c2fd3143726d9922` on branch `main`

---

## 目錄 (Table of Contents)

1. [一、核算目的與範圍](#一核算目的與範圍)
2. [二、原始進度基準線 (Frozen Baseline)](#二原始進度基準線-frozen-baseline)
3. [三、正式進度計算模型與數學公式](#三正式進度計算模型與數學公式)
4. [四、第 1 波成果映射與升級證據 (P07 / P08 / P09 / P18)](#四第-1-波成果映射與升級證據-p07--p08--p09--p18)
5. [五、第 2 波成果映射與 P13 數字矛盾徹底釐清 (P13 深度核實)](#五第-2-波成果映射與-p13-數字矛盾徹底釐清-p13-深度核實)
6. [六、第 3 波成果映射與升級證據 (P15 深度核實)](#六第-3-波成果映射與升級證據-p15-深度核實)
7. [七、全站 226 項 UID 逐項核對總表](#七全站-226-項-uid-逐項核對總表)
8. [八、P01～P20 各階段建議完成率明細表](#八p01p20-各階段建議完成率明細表)
9. [九、全站加權完成率推導與三大波段分析](#九全站加權完成率推導與三大波段分析)
10. [十、原始基準與新建議基準對比總結](#十原始基準與新建議基準對比總結)
11. [十一、受阻 (BLOCKED) 與停工 (STOPPED) 項目追蹤](#十一受阻-blocked-與停工-stopped-項目追蹤)
12. [十二、第 1～3 波後全站尚未完成工作清冊 (Backlog)](#十二第-13-波後全站尚未完成工作清冊-backlog)
13. [十三、證據不足項目與核算限制邊界](#十三證據不足項目與核算限制邊界)
14. [十四、Git 安全與檔案保護查核結果](#十四git-安全與檔案保護查核結果)
15. [十五、最終核算判定與建議](#十五最終核算判定與建議)

---

## 一、核算目的與範圍

### 1.1 核算目的
CODE TO KNOW 專案歷經：
- **第 0 波**：全站盤點、架構檢驗與 226 個 UID 基準線凍結。
- **第 1 波**：基礎架構補強、RWD 斷點實機驗收、鍵盤無障礙導覽落盤與後端班級管理 API 骨幹完成。
- **第 2 波**：學生學習平台（P13）完整化，605 題學科題庫、全真 80 題模擬測驗、錯題筆記本與個人化學習工具落地。
- **第 3 波**：教師管理平台（P15）完整化，班級創建、8 碼唯一邀請碼生成、學生名冊查詢、踢除成員與本機備忘公告落盤。

目前 **第 4 波（平台管理員與系統營運後台 P16）** 正式啟動執行中。本報告之核心目的在於：**對第 1～3 波已交付之實體代碼、測試案例與文件進行嚴格回溯稽核，以客觀且具備完全可重現證據之標準，將成果逐一映射至原始 226 個唯一工作項目（UID），徹底消除數字矛盾，並精確計算新建議加權完成率，供使用者作為後續正式進度基準修訂之審查依據。**

### 1.2 核算範圍與排除事項
- **包含範疇**：
  - 第 1 波：P07、P08、P09、P18 關聯成果。
  - 第 2 波：P09、P10、P13 關聯成果。
  - 第 3 波：P15 關聯成果。
- **嚴格排除範疇**：
  - **排除第 4 波成果**：P16 管理員後台目前尚在開發驗收週期，其成果一律歸入後續核算，本次維持原始基準。
  - **排除未打通之雲端服務**：受限於 `AUTH-03`，所有涉及 Supabase PostgreSQL 真實雲端資料庫寫入、Gemini API 雲端扣點、外部 SMTP 寄信之項目，嚴格維持 PARTIAL 或 NOT STARTED，絕不灌水。
  - **排除五大術科題目修改**：題組一 59 行變更持續凍結，五大題組題目、答案與評分邏輯 100% 保持唯讀保護。

---

## 二、原始進度基準線 (Frozen Baseline)

依據 2026-11-13 凍結之官方基準規範書 [`docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md) 及 [`docs/development/PROJECT_20_PHASE_PROGRESS_FINAL_20261115.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PROJECT_20_PHASE_PROGRESS_FINAL_20261115.md)：

- **正式階段總數**：20 個（P01～P20）。
- **正式 UID 總數**：226 個唯一編號。
- **原始總權重**：100.0000%。
- **原始狀態分佈**：
  - `PASS`：**68 項** (30.09%)
  - `PARTIAL`：**75 項** (33.19%)
  - `NOT STARTED`：**79 項** (34.96%)
  - `BLOCKED`：**4 項** (1.77%)（`P09-DBA-012`, `P19-DEP-004`, `P19-DEP-005`, `P19-DEP-009`）
- **原始全站加權完成率**：**45.961878%**（四捨五入 **45.9620%**）。

---

## 三、正式進度計算模型與數學公式

本專案進度核算嚴格遵循下列數學模型，絕無發明自定義或不可重現之算式：

1. **階段權重分配**：
   全站共 20 個階段，各階段權重為 $W_p$ ($p \in [1, 20]$)，滿足：
   $$\sum_{p=1}^{20} W_p = 100.0\%$$

2. **UID 子項目權重**：
   階段 $p$ 內共有 $N_p$ 個 UID，各 UID 平分該階段權重：
   $$W_{p,i} = \frac{W_p}{N_p}$$

3. **UID 完成比率評分規則 ($R_{p,i}$)**：
   - `PASS`：$R_{p,i} = 1.0$ (100%)。具備實體代碼、自動化測試通過且完成驗收。
   - `PARTIAL`：$R_{p,i} \in [0.20, 0.80]$。依功能完成深度給予階梯比率（如 40%, 50%, 60%, 70%, 80%），未通雲端或缺後端者最高給予 80%。
   - `NOT STARTED`：$R_{p,i} = 0.0$ (0%)。尚無程式碼實作。
   - `BLOCKED`：$R_{p,i} \in [0.0, 0.30]$。受環境、密鑰或簽章阻斷（如 `P09-DBA-012` 給予 30% 代表工具鏈已備妥但還原受阻；P19 部署項目給予 0%）。

4. **階段完成率 ($C_p$) 與全站加權完成率 ($S_{\text{total}}$)**：
   $$C_p = \left( \frac{1}{N_p} \sum_{i=1}^{N_p} R_{p,i} \right) \times 100\%$$
   $$S_{\text{total}} = \sum_{p=1}^{20} \left( W_p \times \frac{C_p}{100} \right) = \sum_{p=1}^{20} \sum_{i=1}^{N_p} (W_{p,i} \times R_{p,i})$$

---

## 四、第 1 波成果映射與升級證據 (P07 / P08 / P09 / P18)

第 1 波聚焦於「基礎系統補強與全站品質提升」，經比對其產出與測試紀錄，針對 P07 與 P18 進行嚴格覆核：

### 4.1 P07-UIX-008 深度覆核
- **工作說明**：設計桌機、平板、手機斷點與操作方式。
- **原始基準**：`PARTIAL` (40%)。
- **測試方式與瀏覽器核心**：採用 Google Chrome 157.0.8103.78 官方 **Headless CDP (Chrome DevTools Protocol)** 協議，透過 `Emulation.setDeviceMetricsOverride` 進行自動化解析度模擬，**非實體硬體設備測試**。
- **受測 14 組視窗解析度完整清單**：
  1. `320 × 720`（極小窄螢幕）
  2. `340 × 800`（Galaxy Z Fold 封面外螢幕）
  3. `360 × 800`（標準 Android 手機）
  4. `375 × 812`（標準 iPhone X / 13 mini）
  5. `390 × 844`（主流 iPhone 14/15/16）
  6. `414 × 896`（大型 iPhone Plus）
  7. `430 × 932`（旗艦 iPhone Pro Max）
  8. `480 × 800`（手持寬螢幕設備）
  9. `768 × 1024`（iPad 直向）
  10. `840 × 900`（摺疊機展開正方形內螢幕）
  11. `1024 × 768`（iPad 橫向 / 輕薄筆電）
  12. `1280 × 800`（13 吋標準筆電）
  13. `1920 × 1080`（Full HD 桌面螢幕）
  14. `667 × 375`（手機橫向情境 Landscape）
- **實測數據**：全站 11 個核心頁面與 4 大彈窗，量測 `document.documentElement.scrollWidth` 與 `window.innerWidth`，**水平溢位量全數為 0px**（零破版）。
- **核定狀態**：**`PASS` (100%)**（加權貢獻由 0.2000% 升至 0.5000%，淨增長 +0.3000%）。

### 4.2 P07-UIX-009 深度覆核（嚴格維持原狀）
- **工作說明**：設計無障礙鍵盤操作、焦點、對比與替代文字。
- **原始基準**：`PARTIAL` (70%)。
- **現有測試覆蓋範圍**：查閱 [`frontend/tests/a11y-keyboard-navigation.test.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/a11y-keyboard-navigation.test.tsx)，僅針對 `GameAchievementsModal` 與 `GameBriefingModal` 兩款元件進行靜態 ARIA 屬性（`role="dialog"`, `aria-modal="true"`, `aria-labelledby`）之單元檢驗。
- **缺口查核**：全站 11 個公開頁面之完整 Tab 鍵焦點路徑、頁面跳轉焦點管理、全站 WCAG 2.1 AA 色彩對比度稽核及圖片替代文字清冊尚未建立自動化端到端測試。
- **判定結論**：**證據不足以支持全站級 PASS，嚴格維持 `PARTIAL` (70%)，絕不虛報升級**。

### 4.3 P18-QAS-011 深度覆核
- **工作說明**：測試 375、390、768、1024、1440 等視窗及主流瀏覽器。
- **原始基準**：`NOT STARTED` (0%)。
- **實體證據**：[`PHASE_1_RWD_FINAL_BROWSER_ACCEPTANCE.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PHASE_1_RWD_FINAL_BROWSER_ACCEPTANCE.md) 已於 Chromium 核心完成 320px 至 1920px 跨視窗排版量測與截圖。因 Safari/Firefox 等跨核心自動化待雲端流水線支援，誠實評定為 **`PARTIAL` (60%)**（加權貢獻淨增長 +0.2786%）。

---

## 五、第 2 波成果映射與 P13 數字矛盾徹底釐清 (P13 深度核實)

### 5.1 P13 原始 13 項 UID 完整清冊與基準核對
經重新回查原始基準規範書 [`docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md)，P13 共有 **13 項 UID**，階段權重為 **10.0%**，每項 UID 權重為 $\frac{10.0\%}{13} \approx 0.769231\%$：

| UID | 工作項目說明 | 原始狀態 (基準) | 原始完成度 | 建議完成度 | 變更證據與實裝路徑 | UID 加權貢獻 | 判定說明 |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| `P13-STU-001` | 完成學生登入後儀表板與個人設定 | `PARTIAL` | **50%** | **80%** | `StudentDashboardPage.tsx`, `StudentClassJoinModal.tsx` | 0.6154% (+0.2308%) | 儀表板 6 大卡片動態化；個人設定未完，嚴格評定 80% |
| `P13-STU-002` | 完成證照分類、詳情、官方來源及學習目標 | `PARTIAL` | 50% | 50% | frontend/src/pages/public/ | 0.3846% (0.0000%) | 維持基準狀態 |
| `P13-STU-003` | 整理並匯入經核實授權的學科題庫，建立來源與版本 | `PASS` | 100% | 100% | TheoryPracticePage.tsx | 0.7692% (0.0000%) | 基準已 PASS，不重複計分 |
| `P13-STU-004` | 建立題型、作答、答案判定、解析及計分 | `PARTIAL` | **50%** | **100%** | `studentStudyToolsStorage.ts`, `student-study-tools.test.ts` | 0.7692% (+0.3846%) | 605 題官方學科作答、即時判題、詳解與計分全數通過測試 |
| `P13-STU-005` | 建立模擬考計時、交卷、成績與歷史紀錄 | `PASS` | 100% | 100% | MockExamPage.tsx | 0.7692% (0.0000%) | 基準已 PASS，不重複計分 |
| `P13-STU-006` | 完成網頁設計丙級正式五大術科題組教學 | `PARTIAL` | 50% | 50% | unifiedPracticalCurriculumData.ts | 0.3846% (0.0000%) | 題組一 59 行變更凍結，維持保護 |
| `P13-STU-007` | 逐組核對官方試題、教材、素材與評分依據 | `PARTIAL` | 50% | 50% | docs/planning/ | 0.3846% (0.0000%) | 維持基準狀態 |
| `P13-STU-008` | 目前第五題組標示 in_preparation，維持教材整理中 | `PARTIAL` | 50% | 50% | unifiedPracticalCurriculumData.ts | 0.3846% (0.0000%) | 嚴格維持 in_preparation |
| `P13-STU-009` | 建立安全的程式編輯器與即時預覽 | `PASS` | 100% | 100% | PracticalLearningPage.tsx | 0.7692% (0.0000%) | 基準已 PASS，不重複計分 |
| `P13-STU-010` | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄 | `PARTIAL` | **60%** | **80%** | `TheoryPracticePage.tsx`, `studentStudyToolsStorage.ts` | 0.6154% (+0.1538%) | 本機收藏筆記工具完備；跨裝置雲端同步受 AUTH-03 限制暫列 80% |
| `P13-STU-011` | 完成學習摘要、弱點分布及學習建議 | `PARTIAL` | **50%** | **70%** | `LearningProgressPage.tsx` | 0.5385% (+0.1538%) | 學習摘要圖表動態渲染完成；AI 推薦待連線評定 70% |
| `P13-STU-012` | 建立教材 PDF／題庫匯入、欄位檢查與重複資料偵測 | `PASS` | 100% | 100% | questionBankAdapter.ts | 0.7692% (0.0000%) | 基準已 PASS，不重複計分 |
| `P13-STU-013` | 建立檔案權限、下載紀錄與教材版本管理 | `PARTIAL` | 50% | 50% | frontend/src/pages/public/ | 0.3846% (0.0000%) | 維持基準狀態 |

### 5.2 前版報告「1.4 個 UID 完成度單位」之矛盾根因分析
在前版報告初稿中出現「變更項目和為 120，但 P13 階段完成率卻呈現 76.92%（等於增加 140 點 / 1.4 個 UID 單位）」之現象，經徹底溯源其**真正原因**如下：
1. **表格文字誤植（Typo）**：前版報告內文中，將 `P13-STU-001` 與 `P13-STU-004` 的原始基準誤寫為 `PARTIAL (60%)`。
2. **真實原始基準為 50%**：在原始規範清冊中，`P13-STU-001` 與 `P13-STU-004` 的官方凍結基準實為 **50%**。
3. **計算腳本與文字不一致**：計算腳本以真實基準（50%）進行計算，若兩項均升級為 100%，增加量為：
   $$(100 - 50) + (100 - 50) + (80 - 60) + (70 - 50) = 50 + 50 + 20 + 20 = 140 \text{ 點 (1.4 個 UID 單位)}$$
   而讀者閱讀誤植 60% 之文字表格時，心算得出：
   $$(100 - 60) + (100 - 60) + (80 - 60) + (70 - 50) = 40 + 40 + 20 + 20 = 120 \text{ 點 (1.2 個 UID 單位)}$$
   因而產生 20 點之理解落差。

### 5.3 本次針對性核實修正（徹底排除矛盾）
依使用者指令「確認原始完整要求是否全部完成，若無額外充分證據，不得維持 76.92%」：
- **覆核 `P13-STU-001`**：該項目要求「完成學生登入後儀表板**與個人設定**」。經檢核 `StudentDashboardPage.tsx`，學生儀表板核心區塊已全數打通，但**個人設定（Profile Settings，如頭像更換、個人資料編輯、密碼重設）**尚未完備。
- **裁定調整**：將 `P13-STU-001` 由先前暫擬之 PASS (100%) **嚴格調降為 `PARTIAL` (80%)**（增加 30 點）。
- **四項變更實質總增長嚴格等於 120 點**：
  $$\Delta = (80 - 50) + (100 - 50) + (80 - 60) + (70 - 50) = 30 + 50 + 20 + 20 = 120 \text{ 點}$$
- **P13 階段完成率精確計算**：
  $$C_{P13} = \frac{860 + 120}{13} = \frac{980}{13} = 75.384615\% \approx \mathbf{75.38\%}$$
- **加權貢獻得分**：
  $$W_{P13} \times \frac{C_{P13}}{100} = 10.0\% \times \frac{75.384615\%}{100} = \mathbf{7.5385\%} \quad (\text{淨增長 } +0.9231\%)$$
- **核驗結論**：**P13 完成率正式由 76.92% 下修為 75.38%，四項增量總和 120 點與 13 項 UID 原始母體 100% 數學閉合，無任何矛盾！**

---

## 六、第 3 波成果映射與升級證據 (P15 深度核實)

針對第 3 波教師管理平台進行深層代碼與資料來源核實：

### 6.1 P15-TCH-002 深度覆核（嚴格調整為 PARTIAL）
- **工作說明**：建立教師儀表板與待辦事項。
- **原始基準**：`NOT STARTED` (0%)。
- **實際功能與資料來源**：
  - 查閱 [`TeacherDashboardPage.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx)，頁面實裝了指標概覽卡、班級清單、教學備忘板與題庫預覽。
  - 資料來源：透過 `teacherApi.getMyApplication()` 與 `classroomApi.getMyTeachingClassrooms()` 介接後端真實路由。
- **缺口查核**：「待辦事項（To-Do）」核心業務（如學生測驗批改隊列、待審核作業、考試逾期警示）之後端資料表與 API 尚未串接，考試建立與報表匯出仍屬 Roadmap 提示彈窗。
- **裁定結論**：依「不得將班級 API 核心骨幹等同完整教師管理系統」原則，**不評定為 PASS (100%)，調整評定為 `PARTIAL` (70%)**（由 0% 升至 70%，淨增長 0.3500%）。

### 6.2 P15-TCH-003 深度覆核（評定為 PASS）
- **工作說明**：建立班級、學期、課程、學生名單及加入流程。
- **原始基準**：`PARTIAL` (50%)。
- **全套實體證據鏈查驗**：
  1. **班級建立與資料模型**：`backend/src/modules/classrooms/`，包含班級名稱、學期、科目、年級設定。
  2. **8 碼邀請碼生成與防碰撞**：包含唯一性演算法、複製按鈕，通過 [`backend/tests/join-code.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/join-code.test.ts) 專項測試。
  3. **學生名冊查詢**：`GET /api/classrooms/:id/members` 查詢班級學員與加入日期。
  4. **成員踢除作業**：`DELETE /api/classrooms/:id/members/:studentId` 支援教師移除成員。
  5. **學生加入彈窗**：[`StudentClassJoinModal.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/StudentClassJoinModal.tsx) 驗證 8 碼並加入。
  6. **資安守衛（RBAC、Anti-IDOR、CSRF）**：
     - RBAC：`requireRole('TEACHER')` 限制班級管理；`requireRole('STUDENT')` 限制學生加入。
     - Anti-IDOR：`creatorId` 嚴格校驗，教師無法跨權限修改非名下班級。
     - CSRF：全面配置 `x-csrf-token` 雙重防禦標頭。
  7. **自動化測試**：`join-code.test.ts`、`teacher-dashboard-classroom.test.tsx`、`student-class-join.test.ts` 全數 PASS。
- **裁定結論**：本 UID 範疇（班級/邀請碼/名冊/加入流程）已 100% 交付且具備完備資安防禦，**評定為 `PASS` (100%)**（加權貢獻由 0.2500% 升至 0.5000%，淨增長 +0.2500%）。

### 6.3 P15-TCH-013 深度覆核（嚴格維持 NOT STARTED）
- **工作說明**：建立公告、站內通知及電子郵件通知。
- **原始基準**：`NOT STARTED` (0%)。
- **實際現況**：第 3 波之公告功能為純前端本機草稿（`ctk_teacher_announcements:${userId}`），僅供教師個人備課備忘，學生端完全無法接收，且未串接後端 API 或郵件通道。
- **裁定結論**：**嚴格維持 `NOT STARTED` (0%)，絕不計分**。

---

## 七、全站 226 項 UID 逐項核對總表

以下為全站 20 階段 226 個 UID 經本次針對性數字校準後之完整核對清冊：

| UID | 工作項目說明 | 原始狀態 (基準) | UID 權重 | 關聯波次 | 實體程式碼 / 文件證據 | 建議狀態 | 狀態變更理由 | 驗收可信度 |
| :--- | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| `P01-BRD-001` | 確認品牌名稱：碼上學 CODE TO KNOW；品牌全名與標語的正式寫法。 | `PASS` (100%) | 0.2778% | 未涉及 | AGENTS.md, WEBSITE_REQUIREMENTS.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P01-BRD-002` | 統一品牌核心描述，避免與舊專案名稱或舊標語混用。 | `PASS` (100%) | 0.2778% | 未涉及 | AGENTS.md, WEBSITE_REQUIREMENTS.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P01-BRD-003` | 撰寫品牌成立原因、使命、願景、核心價值與品牌承諾。 | `PASS` (100%) | 0.2778% | 未涉及 | AGENTS.md, WEBSITE_REQUIREMENTS.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P01-BRD-004` | 定義主要受眾：學生、教師、學校及可能的教育合作單位。 | `PASS` (100%) | 0.2778% | 未涉及 | AGENTS.md, WEBSITE_REQUIREMENTS.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P01-BRD-005` | 定義品牌個性、語氣、用字、視覺印象及不採用的風格。 | `PASS` (100%) | 0.2778% | 未涉及 | AGENTS.md, WEBSITE_REQUIREMENTS.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P01-BRD-006` | 研究程式教育、證照學習、線上測驗與 AI 教育產品。 | `PARTIAL` (60%) | 0.2778% | 未涉及 | MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P01-BRD-007` | 整理競品功能、收費方式、差異點及市場缺口。 | `PARTIAL` (60%) | 0.2778% | 未涉及 | MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P01-BRD-008` | 訂定短期 MVP、中期擴充、長期品牌發展方向。 | `PARTIAL` (60%) | 0.2778% | 未涉及 | MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P01-BRD-009` | 建立風險、成本、資源與團隊能力評估。 | `PARTIAL` (40%) | 0.2778% | 未涉及 | docs/planning 草案 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P02-IDN-001` | 確認 Logo 主版、橫式／直式／小尺寸版本及安全留白。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-002` | 確認中英文標準字、字體、字級與排版層級。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-003` | 建立主色、輔助色、中性色、狀態色及色彩使用比例。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-004` | 建立按鈕、卡片、表單、圖示、插畫與品牌圖形規範。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-005` | 建立網站、學生端、教師端、管理端及監控端的視覺一致性規範。 | `PARTIAL` (70%) | 0.3333% | 未涉及 | prototype/assets, SVG 圖章 | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P02-IDN-006` | 製作 SVG、PNG、favicon、社群頭像及分享圖。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-007` | 定義動畫速度、轉場、hover、載入狀態與減少動態偏好。 | `PASS` (100%) | 0.3333% | 未涉及 | frontend/public/images/logo/, tokens.css, components.css | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P02-IDN-008` | 建立 3D 獎牌、成就徽章及遊戲視覺規範。 | `PARTIAL` (70%) | 0.3333% | 未涉及 | prototype/assets, SVG 圖章 | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P02-IDN-009` | 建立品牌識別手冊與素材授權清單。 | `PARTIAL` (70%) | 0.3333% | 未涉及 | prototype/assets, SVG 圖章 | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P03-MKT-001` | 訪談或蒐集學生、教師的學習與教學需求。 | `PASS` (100%) | 0.2778% | 未涉及 | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P03-MKT-002` | 整理學科題庫、術科實作、考試、AI 輔助的使用痛點。 | `PASS` (100%) | 0.2778% | 未涉及 | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P03-MKT-003` | 分析競品及替代方案。 | `PARTIAL` (50%) | 0.2778% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P03-MKT-004` | 建立產品價值主張與差異化。 | `PASS` (100%) | 0.2778% | 未涉及 | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P03-MKT-005` | 將功能分為 MVP、第二版、長期規劃。 | `PASS` (100%) | 0.2778% | 未涉及 | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P03-MKT-006` | 定義成功指標：完成率、學習持續度、錯題改善、教師採用等。 | `PARTIAL` (50%) | 0.2778% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P03-MKT-007` | 評估免費方案限制、雲端服務限制、AI API 費用及維護成本。 | `PARTIAL` (50%) | 0.2778% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P03-MKT-008` | 建立功能風險清單與依賴關係。 | `PARTIAL` (50%) | 0.2778% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P03-MKT-009` | 確認不使用未經授權教材或未核實題目。 | `PASS` (100%) | 0.2778% | 未涉及 | WEBSITE_REQUIREMENTS.md, MARKET_RESEARCH_PRODUCT_STRATEGY.md | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-001` | 建立五層系統 Sitemap 與頁面清單。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-002` | 建立訪客、學生、教師、平台管理員、系統管理者角色矩陣。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-003` | 定義各角色登入後預設入口與跨層導覽規則。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-004` | 繪製註冊、登入、教師審核、加入班級、練習、考試、補考流程。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-005` | 繪製平台管理與系統監控的獨立流程。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-006` | 定義題庫、課程、遊戲、公告、檔案與使用者資料需求。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-007` | 定義訪客／會員功能比較及每項功能真實狀態。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-008` | 規劃公開網站頁面、FAQ、聯絡、SEO 與法律頁面。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P04-REQ-009` | 定義個資、未成年人資料、Cookie、資料保存與刪除規則。 | `PARTIAL` (60%) | 0.3500% | 未涉及 | PERMISSION_MATRIX.md, schema.prisma | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P04-REQ-010` | 建立需求追蹤矩陣，讓每項需求連到頁面、API、資料表與測試案例。 | `PASS` (100%) | 0.3500% | 未涉及 | WEBSITE_REQUIREMENTS.md, HomePage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-001` | 確認 Antigravity、Node.js、npm、Git、編輯器版本。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-002` | 整理專案根目錄、frontend、backend、prototype、docs、tests 等目錄。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-003` | 確認 GitHub 私有 Repository、分支策略與團隊權限。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-004` | 建立 issue、任務、里程碑、負責人及驗收欄位。 | `PARTIAL` (80%) | 0.3889% | 未涉及 | PROJECT_TRACKER.md | `PARTIAL` (80%) | 維持原始基準狀態 | 沿用基準 |
| `P05-ENV-005` | 分離 development、staging、production 環境。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-006` | 建立 .env.example，禁止提交真實密鑰。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-007` | 建立備份、還原及本機啟動說明。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-008` | 建立套件更新、弱點掃描與版本鎖定流程。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P05-ENV-009` | 規定每次修改前檢查 Git 狀態、備份必要檔案、測試後再提交。 | `PASS` (100%) | 0.3889% | 未涉及 | ENVIRONMENT_DEVELOPMENT.md, .editorconfig, ps-encoding-guard | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-001` | 建立專案總規則與禁止事項。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-002` | 建立 React／TypeScript 前端規則。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-003` | 建立 Express／API／後端規則。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-004` | 建立 PostgreSQL／Prisma／RLS 資料庫規則。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-005` | 建立身份驗證、授權、個資及資安規則。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-006` | 建立 UI/UX、響應式、動畫、SVG、3D 規範。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-007` | 建立 AI 教學、遊戲化與教材資料規範。 | `PARTIAL` (70%) | 0.3000% | 未涉及 | .agents/skills/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P06-RUL-008` | 建立測試、程式碼審查、文件及部署規則。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-009` | 建立只讀盤點、實作、獨立複核三種指令模板。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P06-RUL-010` | 要求代理明確回報修改檔案、測試證據、未完成項目及風險。 | `PASS` (100%) | 0.3000% | 未涉及 | AGENTS.md, .agents/skills/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P07-UIX-001` | 建立 Design System 與設計 Token。 | `PASS` (100%) | 0.5000% | 未涉及 | prototype/, frontend/src/pages/public/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P07-UIX-002` | 設計公開網站所有頁面及導覽。 | `PASS` (100%) | 0.5000% | 未涉及 | prototype/, frontend/src/pages/public/ | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P07-UIX-003` | 設計學生儀表板、題庫、考試、術科、AI、遊戲與歷程頁。 | `PARTIAL` (70%) | 0.5000% | 未涉及 | frontend/src/pages/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-004` | 設計教師班級、題庫、考試、成績及考試監控頁。 | `PARTIAL` (40%) | 0.5000% | 未涉及 | Teacher/Admin UI 待完善 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-005` | 設計平台管理員內容與帳號管理頁。 | `PARTIAL` (40%) | 0.5000% | 未涉及 | Teacher/Admin UI 待完善 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-006` | 設計系統營運總覽、告警、日誌、部署、備份及維護頁。 | `PARTIAL` (40%) | 0.5000% | 未涉及 | Teacher/Admin UI 待完善 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-007` | 設計登入、註冊、錯誤、空狀態、載入與權限不足畫面。 | `PARTIAL` (40%) | 0.5000% | 未涉及 | Teacher/Admin UI 待完善 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-008` | 設計桌機、平板、手機斷點與操作方式。 | `PARTIAL` (40%) | 0.5000% | Wave 1 | PHASE_1_RWD_FINAL_BROWSER_ACCEPTANCE.md (14 組視窗 CDP 模擬量測 0px 溢出) | **`PASS`** (100%) | 桌機、平板、手機 14 組視窗解析度經 Headless Chrome CDP 模擬測試達成 0px 水平溢位（非實體設備測試） | 已核實 |
| `P07-UIX-009` | 設計無障礙鍵盤操作、焦點、對比與替代文字。 | `PARTIAL` (70%) | 0.5000% | 未涉及 | frontend/src/pages/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P07-UIX-010` | 驗證品牌 Logo 不被未授權修改，並建立視覺回歸檢查。 | `PARTIAL` (40%) | 0.5000% | 未涉及 | Teacher/Admin UI 待完善 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P08-ARC-001` | 確認 React、TypeScript、Vite 前端架構。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-002` | 確認 Express、TypeScript、Prisma 後端架構。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-003` | 確認 PostgreSQL／Supabase 資料庫與檔案儲存方案。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-004` | 設計 API 分層、錯誤格式、驗證與速率限制。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-005` | 設計身份驗證、角色授權及資源層級權限。 | `PARTIAL` (60%) | 0.4500% | 未涉及 | docs/architecture/ | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P08-ARC-006` | 設計前端、後端、資料庫、AI、郵件及監控服務關係圖。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-007` | 規劃 Prototype 與 React 正式前端的資料一致策略。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P08-ARC-008` | 規劃背景工作、郵件佇列、AI 任務及排程。 | `PARTIAL` (60%) | 0.4500% | 未涉及 | docs/architecture/ | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P08-ARC-009` | 評估 Render／Supabase 免費層休眠、容量、備份與流量限制。 | `PARTIAL` (60%) | 0.4500% | 未涉及 | docs/architecture/ | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P08-ARC-010` | 預留 Flutter App 與桌面端共用 API 的架構。 | `PASS` (100%) | 0.4500% | 未涉及 | DEPLOYMENT_OPERATIONS_ARCHITECTURE.md, db-validation.ts | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P09-DBA-001` | 設計 users、profiles、roles、permissions 等資料表。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-002` | 設計學生、教師、班級、課程與班級成員關聯。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-003` | 設計證照、教材、題庫、題目、選項與解析資料。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-004` | 設計考試、考卷版本、作答、答案、成績與補考資料。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-005` | 設計錯題、收藏、筆記、學習紀錄及進度資料。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-006` | 設計遊戲、關卡、積分、成就與排行榜資料。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-007` | 設計公告、通知、郵件寄送及操作稽核資料。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-008` | 建立 Prisma Schema、Migration、索引與資料驗證。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-009` | 設定 RLS 與伺服器端授權；不可相信前端傳入的角色或 teacherEmail。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/src/middleware/authorize.ts, rbac-workflow.test.ts, idor-ownership.test.ts (RLS 實機未上線) | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-010` | 完成註冊、登入、登出、驗證信箱、密碼重設及安全工作階段。 | `PASS` (100%) | 0.7083% | 未涉及 | backend/prisma/schema.prisma, auth.service.ts, backup-crypto.cjs | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P09-DBA-011` | 測試學生不能讀取他人資料、教師只能管理授權班級、管理員依職責分權。 | `PARTIAL` (50%) | 0.7083% | 未涉及 | backend/tests/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P09-DBA-012` | 建立備份、還原、資料匯出及刪除流程。 | `BLOCKED` (30%) | 0.7083% | 未涉及 | backup-crypto.cjs, run_supabase_backup.ps1 PASS; restore_pg17_sandbox.ps1 BLOCKED (TOC ID 4791) | `BLOCKED` (30%) | 維持原始基準狀態 | 已核實受阻 |
| `P10-EML-001` | 決定網域與官方寄件服務供應商。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-002` | 規劃 hello、support、partnerships 等角色信箱；不必為每個平台重複建立獨立身分。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-003` | 建立系統通知寄件身分與寄送政策。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-004` | 設定 SPF、DKIM、DMARC 及寄件網域驗證。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-005` | 建立註冊驗證、密碼重設、登入安全提醒模板。 | `PARTIAL` (40%) | 0.3500% | 未涉及 | 文字草案 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P10-EML-006` | 建立考試開始、補考、教師公告及系統維護通知模板。 | `PARTIAL` (40%) | 0.3500% | 未涉及 | 文字草案 | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P10-EML-007` | 建立站內通知中心與已讀／未讀狀態。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-008` | 建立寄送佇列、重試、退信、退訂及寄送紀錄。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-009` | 測試寄件成功率、垃圾郵件分類及錯誤處理。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P10-EML-010` | 設定郵件服務用量與成本警戒。 | `NOT STARTED` (0%) | 0.3500% | 未涉及 | 尚未串接正式 SMTP 服務 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P11-AIS-001` | 選定可用模型與供應商，確認年齡、隱私、資料處理條款。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-002` | 建立伺服器端 AI Proxy，API Key 不可放在前端。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-003` | 建立學生身分、功能權限、每日／每月用量與預算限制。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-004` | 建立 HTML、CSS、JavaScript 分類教學能力。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-005` | 建立分階段提示：理解題意、定位問題、提示方向、解釋概念。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-006` | 建立程式碼與版面檢查，明確區分自動化規則與 AI 判斷。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-007` | 建立題目語意分析、錯題分類及弱點分析。 | `PARTIAL` (50%) | 0.5455% | 未涉及 | schema.prisma (AIChatSession) | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-008` | 建立 AI 輸出安全過濾、錯誤回報與人工檢視機制。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-009` | 建立模型版本、Prompt 版本、延遲、錯誤率與成本紀錄。 | `PASS` (100%) | 0.5455% | 未涉及 | AICoachPage.tsx, Socratic Prompt | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P11-AIS-010` | 用標準測試題評估正確性、穩定性與教學品質。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P11-AIS-011` | 未串接真實模型前，所有固定回覆均標示為示範，不可宣稱是真正 AI。 | `PARTIAL` (20%) | 0.5455% | 未涉及 | 尚未串接真實 Gemini API | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P12-WEB-001` | 完成首頁品牌主視覺、導覽與主要 CTA。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-002` | 完成品牌理念、平台介紹、功能特色及使用方式。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-003` | 完成訪客與會員功能比較區塊，逐項標示真實狀態。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-004` | 完成證照／課程公開介紹及可公開的術科題組介紹。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-005` | 完成 FAQ、聯絡我們、公告與品牌內容。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-006` | 完成註冊／登入入口及實際路由。 | `PARTIAL` (70%) | 0.5909% | 未涉及 | frontend/src/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P12-WEB-007` | 完成 SEO、Open Graph、Favicon、網站地圖及 robots 規則。 | `PASS` (100%) | 0.5909% | 未涉及 | HomePage.tsx, CertificationsPage.tsx, deploy-pages.yml | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P12-WEB-008` | 完成隱私權政策、服務條款及必要的資料告知。 | `PARTIAL` (70%) | 0.5909% | 未涉及 | frontend/src/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P12-WEB-009` | 同步檢查 Prototype 與 React 前端；兩者分開測試。 | `PARTIAL` (70%) | 0.5909% | 未涉及 | frontend/src/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P12-WEB-010` | 測試手機、平板、桌機、鍵盤操作、連結及錯誤頁。 | `PARTIAL` (70%) | 0.5909% | 未涉及 | frontend/src/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P12-WEB-011` | 核對所有功能描述，不得把規劃中、模擬或本機暫存功能寫成已完成。 | `PARTIAL` (70%) | 0.5909% | 未涉及 | frontend/src/ | `PARTIAL` (70%) | 維持原始基準狀態 | 沿用基準 |
| `P13-STU-001` | 完成學生登入後儀表板與個人設定。 | `PARTIAL` (50%) | 0.7692% | Wave 2 | StudentDashboardPage.tsx, StudentClassJoinModal.tsx | **`PARTIAL`** (80%) | 學生儀表板證照、進度、錯題、模考歷史、推薦章節與班級卡片動態打通；個人資料設定未完，嚴格評定為 80% | 部分核實 |
| `P13-STU-002` | 完成證照分類、詳情、官方來源及學習目標。 | `PARTIAL` (50%) | 0.7692% | 未涉及 | frontend/src/pages/public/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P13-STU-003` | 整理並匯入經核實授權的學科題庫，建立來源與版本。 | `PASS` (100%) | 0.7692% | 未涉及 | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P13-STU-004` | 建立題型、作答、答案判定、解析及計分。 | `PARTIAL` (50%) | 0.7692% | Wave 2 | studentStudyToolsStorage.ts, student-study-tools.test.ts | **`PASS`** (100%) | 605 題官方學科題型作答、即時判題、解析、計分與錯題本隔離存儲落地，單元測試通過 | 已核實 |
| `P13-STU-005` | 建立模擬考計時、交卷、成績與歷史紀錄。 | `PASS` (100%) | 0.7692% | 未涉及 | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P13-STU-006` | 完成網頁設計丙級正式五大術科題組：校園社團介紹網、運動廣場連結網、國家公園介紹網、網路行銷購物網、書曼的旅遊相簿。 | `PARTIAL` (50%) | 0.7692% | 未涉及 | frontend/src/pages/public/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P13-STU-007` | 逐組核對官方試題、教材、素材、操作要求與評分依據；未核實資料不得補寫成官方內容。 | `PARTIAL` (50%) | 0.7692% | 未涉及 | frontend/src/pages/public/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P13-STU-008` | 目前第五題組如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成。 | `PARTIAL` (50%) | 0.7692% | 未涉及 | frontend/src/pages/public/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P13-STU-009` | 建立安全的程式編輯器與即時預覽。 | `PASS` (100%) | 0.7692% | 未涉及 | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P13-STU-010` | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄。 | `PARTIAL` (60%) | 0.7692% | Wave 2 | TheoryPracticePage.tsx, studentStudyToolsStorage.ts | **`PARTIAL`** (80%) | 錯題本、收藏題庫、筆記與做題計時前端本機功能完備；跨裝置雲端同步受 AUTH-03 限制暫列 80% | 部分核實 |
| `P13-STU-011` | 完成學習摘要、弱點分布及學習建議。 | `PARTIAL` (50%) | 0.7692% | Wave 2 | LearningProgressPage.tsx | **`PARTIAL`** (70%) | 學習成效統計與章節弱點分佈雷達動態渲染已完成；AI 個性化推薦維持規則導引，待 P11 正式 API | 部分核實 |
| `P13-STU-012` | 建立教材 PDF／題庫匯入、欄位檢查、重複資料偵測與人工審核工具。 | `PASS` (100%) | 0.7692% | 未涉及 | TheoryPracticePage.tsx, MockExamPage.tsx, PracticalLearningPage.tsx | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P13-STU-013` | 建立檔案權限、下載紀錄與教材版本管理。 | `PARTIAL` (50%) | 0.7692% | 未涉及 | frontend/src/pages/public/ | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P14-GAM-001` | 建立獨立遊戲中心首頁、導覽、分類及搜尋。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-002` | 定義遊戲資料模型：名稱、學習目標、難度、版本、規則、關卡與狀態。 | `PARTIAL` (20%) | 0.4375% | 未涉及 | DOCX 文字規劃 | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P14-GAM-003` | 每款遊戲開始前顯示玩法、操作方式、計分規則、時間及注意事項。 | `PARTIAL` (20%) | 0.4375% | 未涉及 | DOCX 文字規劃 | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P14-GAM-004` | 開發 Code Puzzle：程式邏輯與流程判斷。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-005` | 開發 CSS Designer：版面配置、選擇器與樣式理解。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-006` | 開發 Bug Hunter：程式錯誤辨識與除錯思考。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-007` | 開發 Quiz Rush：證照知識與題型快問快答。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-008` | 開發 Web Builder：HTML／CSS 元件組合與網頁結構。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-009` | 建立關卡、難度、提示、重試及通關條件。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-010` | 建立分數、時間、星星、點數與獎勵計算規則。 | `PARTIAL` (20%) | 0.4375% | 未涉及 | DOCX 文字規劃 | `PARTIAL` (20%) | 維持原始基準狀態 | 沿用基準 |
| `P14-GAM-011` | 建立每日任務、連續學習、成就及可解鎖元件。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-012` | 建立遊戲紀錄、個人進度與排行榜；防止重複送分及竄改分數。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-013` | 建立課程、題庫、考試與遊戲的學習目標連動。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-014` | 讓教師可指派遊戲任務與班級挑戰。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-015` | 讓平台管理員可新增、編輯、停用遊戲與管理版本。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P14-GAM-016` | 建立遊戲平衡、可用性、無障礙及內容安全測試。 | `NOT STARTED` (0%) | 0.4375% | 未涉及 | 無遊戲程式碼或獨立頁面 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-001` | 完成教師申請、資料驗證與人工審核。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-002` | 建立教師儀表板與待辦事項。 | `NOT STARTED` (0%) | 0.5000% | Wave 3 | TeacherDashboardPage.tsx, teacher-dashboard-classroom.test.tsx | **`PARTIAL`** (70%) | 教師首頁指標卡、班級清單、備忘板與題庫預覽實裝且測試通過；待辦批改隊列與作業指派待連線，評定為 70% | 部分核實 |
| `P15-TCH-003` | 建立班級、學期、課程、學生名單及加入流程。 | `PARTIAL` (50%) | 0.5000% | Wave 3 | backend/src/modules/classrooms/, join-code.test.ts, StudentClassJoinModal.tsx | **`PASS`** (100%) | 班級建立、8 碼唯一邀請碼生成/複製、名冊查詢、踢除成員、加入班級、RBAC、Anti-IDOR 與 CSRF 測試全數通過 | 已核實 |
| `P15-TCH-004` | 建立教材、課程單元及教學任務管理。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-005` | 建立題庫新增、編輯、匯入、審核與版本控制。 | `PARTIAL` (50%) | 0.5000% | 未涉及 | schema.prisma (Class, Exam) | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P15-TCH-006` | 建立是非、選擇、填充、實作等題型管理。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-007` | 建立考試建立、排程、發布、開始與截止時間。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-008` | 建立及格分數、題目／選項隨機化、補考與重考規則。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-009` | 建立排除指定學生及個別考試設定。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-010` | 建立考試監控中心：考試狀態、交卷狀態、頁面離開事件與警示。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-011` | 設定異常警告門檻、人工覆核、處置理由與申訴紀錄。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-012` | 建立成績、錯題與班級弱點分析。 | `PARTIAL` (50%) | 0.5000% | 未涉及 | schema.prisma (Class, Exam) | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P15-TCH-013` | 建立公告、站內通知及電子郵件通知。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P15-TCH-014` | 建立遊戲指派、班級挑戰及完成狀態。 | `PARTIAL` (50%) | 0.5000% | 未涉及 | schema.prisma (Class, Exam) | `PARTIAL` (50%) | 維持原始基準狀態 | 沿用基準 |
| `P15-TCH-015` | 建立教師操作稽核紀錄及資料匯出權限。 | `NOT STARTED` (0%) | 0.5000% | 未涉及 | 即時監考與進階功能待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-001` | 第四層平台管理：建立會員、教師審核、班級、課程、證照、教材、題庫、公告、回饋與平台規則管理。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-002` | 第四層平台管理：建立內容上架、下架、版本、來源與品質審核。 | `PARTIAL` (40%) | 0.4667% | 未涉及 | 後端有 API，前端無獨立 Dashboard | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P16-ADM-003` | 第四層平台管理：建立遊戲內容管理、任務設定及平台使用統計。 | `PARTIAL` (40%) | 0.4667% | 未涉及 | 後端有 API，前端無獨立 Dashboard | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P16-ADM-004` | 第四層平台管理：建立客服回報、檢舉、處理狀態與申訴流程。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-005` | 第四層平台管理：建立管理員角色、最小權限、操作稽核及敏感操作覆核。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-006` | 第五層系統營運：建立系統健康總覽與服務可用性檢查。 | `PASS` (100%) | 0.4667% | 未涉及 | admin.routes.ts, admin.service.ts, server.ts (/api/health) | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P16-ADM-007` | 第五層系統營運：建立前端錯誤、API 延遲／錯誤率、資料庫連線與容量監控。 | `PARTIAL` (40%) | 0.4667% | 未涉及 | 後端有 API，前端無獨立 Dashboard | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P16-ADM-008` | 第五層系統營運：建立 AI 用量、成本、模型錯誤與預算警報。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-009` | 第五層系統營運：建立郵件佇列、退信、寄送成功率及第三方服務狀態。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-010` | 第五層系統營運：建立日誌、告警、事故分級、維護模式與故障處理流程。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-011` | 第五層系統營運：建立功能開關、環境設定、版本發布、部署紀錄與回滾流程。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-012` | 第五層系統營運：建立資料庫／檔案備份、復原演練與災難復原計畫。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-013` | 第五層系統營運：建立憑證／密鑰輪替、權限審核與高風險操作雙重確認。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-014` | 兩套後台使用不同角色與路由，API 亦分開授權；不得只靠前端隱藏選單。 | `NOT STARTED` (0%) | 0.4667% | 未涉及 | 維運面板待開發 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P16-ADM-015` | 建立管理端與監控端的稽核報告及定期權限檢查。 | `PARTIAL` (40%) | 0.4667% | 未涉及 | 後端有 API，前端無獨立 Dashboard | `PARTIAL` (40%) | 維持原始基準狀態 | 沿用基準 |
| `P17-MED-001` | 確立官方品牌核心帳號及管理者，不以多組互不相關帳號分散品牌。 | `PARTIAL` (30%) | 0.2500% | 未涉及 | 社群規劃草案 | `PARTIAL` (30%) | 維持原始基準狀態 | 沿用基準 |
| `P17-MED-002` | 盤點 Instagram、Threads、YouTube、Facebook、TikTok 等平台名稱可用性。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-003` | 建立帳號持有人、管理員、編輯者及雙重驗證規範。 | `PARTIAL` (30%) | 0.2500% | 未涉及 | 社群規劃草案 | `PARTIAL` (30%) | 維持原始基準狀態 | 沿用基準 |
| `P17-MED-004` | 建立內容企劃、發布日曆、審稿與素材授權流程。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-005` | 建立短影音、教學影片、品牌介紹、產品更新及活動內容系列。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-006` | 建立 AI 影片、圖像、配音、字幕與剪輯流程，檢查商用授權。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-007` | 規劃 Academy、AI Lab、Challenge 等內容系列。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-008` | 建立社群留言、私訊、客服轉介與危機回應流程。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-009` | 建立網站流量、社群觸及、互動及轉換成效分析。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P17-MED-010` | 建立品牌合作、學校合作及活動紀錄。 | `NOT STARTED` (0%) | 0.2500% | 未涉及 | 營運流程待建立 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-001` | 建立需求—功能—測試案例追蹤表。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-002` | 測試訪客、學生、教師、平台管理員、系統管理者完整流程。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-003` | 測試註冊、登入、登出、信箱驗證、密碼重設及權限拒絕。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-004` | 測試題庫匯入、作答、計分、考試、交卷、補考及成績。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-005` | 測試術科五大題組內容、教材下載及程式工作台。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-006` | 測試遊戲計分、獎勵、重複請求與排行榜防竄改。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-007` | 測試 AI 回答品質、用量限制、成本上限與服務中斷處理。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-008` | 測試郵件寄送、退信、重試與通知狀態。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-009` | 測試 API 授權、RLS、輸入驗證、速率限制及常見安全風險。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-010` | 測試資料備份、復原、資料刪除及稽核紀錄。 | `PASS` (100%) | 0.4643% | 未涉及 | backend/tests/, ps-encoding-guard, backup-crypto.test | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P18-QAS-011` | 測試 375、390、768、1024、1440 等視窗及主流瀏覽器。 | `NOT STARTED` (0%) | 0.4643% | Wave 1 | PHASE_1_RWD_FINAL_BROWSER_ACCEPTANCE.md (320~1920px 截圖與量測) | **`PARTIAL`** (60%) | 已於 Chromium 核心完成 14 組視窗解析度自動化排版量測；跨瀏覽器（Safari/Firefox）待雲端覆蓋 | 部分核實 |
| `P18-QAS-012` | 測試載入效能、錯誤監控、可用性與高峰負載。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P18-QAS-013` | 執行無障礙檢查、隱私檢查及第三方套件弱點檢查。 | `PARTIAL` (60%) | 0.4643% | 未涉及 | 測試套件 | `PARTIAL` (60%) | 維持原始基準狀態 | 沿用基準 |
| `P18-QAS-014` | 完成缺陷分級、修正、回歸測試及正式簽核。 | `NOT STARTED` (0%) | 0.4643% | 未涉及 | E2E 自動化與高負載測試待補 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-001` | 確認正式網域與 DNS 管理權限。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-002` | 設定 HTTPS、安全標頭及必要網域驗證。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-003` | 確認正式前端、後端、資料庫及儲存服務方案。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-004` | 設定正式環境變數與 Secret，禁止把密鑰寫入程式碼或文件。 | `BLOCKED` (0%) | 0.4545% | 未涉及 | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | `BLOCKED` (0%) | 維持原始基準狀態 | 已核實受阻 |
| `P19-DEP-005` | 執行正式資料庫 Migration 與初始資料檢查。 | `BLOCKED` (0%) | 0.4545% | 未涉及 | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | `BLOCKED` (0%) | 維持原始基準狀態 | 已核實受阻 |
| `P19-DEP-006` | 建立正式管理員帳號並啟用 MFA。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-007` | 確認 AI API、郵件服務及用量上限。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-008` | 設定監控、告警、備份及故障聯絡方式。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-009` | 執行部署前資料備份與回滾演練。 | `BLOCKED` (0%) | 0.4545% | 未涉及 | AUTH-03 阻斷，Render 未部署，Supabase 未切換 | `BLOCKED` (0%) | 維持原始基準狀態 | 已核實受阻 |
| `P19-DEP-010` | 進行小範圍試營運與正式上線檢查。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P19-DEP-011` | 公開上線後持續觀察錯誤率、服務可用性及使用者回報。 | `NOT STARTED` (0%) | 0.4545% | 未涉及 | 正式上線核准清單待執行 | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-001` | 建立例行系統健康檢查、錯誤追蹤及安全更新。 | `PASS` (100%) | 0.2083% | 未涉及 | run_supabase_backup.ps1 | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P20-OPS-002` | 依政策定期備份，定期演練資料復原。 | `PASS` (100%) | 0.2083% | 未涉及 | run_supabase_backup.ps1 | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P20-OPS-003` | 監控主機、資料庫、API、AI、郵件、儲存及成本。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-004` | 定期更新題庫、教材、證照資訊及官方來源。 | `PASS` (100%) | 0.2083% | 未涉及 | run_supabase_backup.ps1 | `PASS` (100%) | 維持原始基準狀態 | 已核實 |
| `P20-OPS-005` | 建立教師與學生回饋收集、分類、排程及回覆機制。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-006` | 追蹤產品指標、學習成效、留存與功能使用情況。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-007` | 持續擴充遊戲、課程、科目及教學工具。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-008` | 管理第三方服務合約、授權、帳號及權限。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-009` | 建立事故檢討、版本發布與變更管理。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-010` | 規劃 Flutter Android／iOS App，共用既有 API。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-011` | 評估 Windows／macOS 桌面端需求與技術方案。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
| `P20-OPS-012` | 依使用需求擴展其他科目、學校與教育領域。 | `NOT STARTED` (0%) | 0.2083% | 未涉及 | 長期營運與多端 App | `NOT STARTED` (0%) | 維持原始基準狀態 | 尚未啟動 |
---

## 八、P01～P20 各階段建議完成率明細表

| 階段代號 | 階段名稱 | 權重 ($W_p$) | UID 數 ($N_p$) | 基準 PASS | 基準 PARTIAL | 基準 NOT STARTED | 基準 BLOCKED | 基準完成率 | 基準加權貢獻 | 建議 PASS | 建議 PARTIAL | 建議 NOT STARTED | 建議 BLOCKED | 建議完成率 | 建議加權貢獻 | 百分點差異 (Delta) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **P01** | 品牌定位與品牌策略 | 2.5% | 9 | 5 | 4 | 0 | 0 | 80.00% | 2.0000% | 5 | 4 | 0 | 0 | 80.00% | 2.0000% | 0.0000% |
| **P02** | 品牌識別與視覺系統 | 3.0% | 9 | 6 | 3 | 0 | 0 | 90.00% | 2.7000% | 6 | 3 | 0 | 0 | 90.00% | 2.7000% | 0.0000% |
| **P03** | 市場研究與產品策略 | 2.5% | 9 | 5 | 4 | 0 | 0 | 77.78% | 1.9444% | 5 | 4 | 0 | 0 | 77.78% | 1.9444% | 0.0000% |
| **P04** | 網站規劃與完整需求規格 | 3.5% | 10 | 9 | 1 | 0 | 0 | 96.00% | 3.3600% | 9 | 1 | 0 | 0 | 96.00% | 3.3600% | 0.0000% |
| **P05** | 專案管理與開發環境建置 | 3.5% | 9 | 8 | 1 | 0 | 0 | 97.78% | 3.4222% | 8 | 1 | 0 | 0 | 97.78% | 3.4222% | 0.0000% |
| **P06** | Antigravity Rules 與 Skills 建置 | 3.0% | 10 | 9 | 1 | 0 | 0 | 97.00% | 2.9100% | 9 | 1 | 0 | 0 | 97.00% | 2.9100% | 0.0000% |
| **P07** | UI/UX 與互動體驗設計 | 5.0% | 10 | 2 | 8 | 0 | 0 | 58.00% | 2.9000% | 3 | 7 | 0 | 0 | 64.00% | 3.2000% | **+0.3000%** |
| **P08** | 技術選型與系統架構設計 | 4.5% | 10 | 7 | 3 | 0 | 0 | 88.00% | 3.9600% | 7 | 3 | 0 | 0 | 88.00% | 3.9600% | 0.0000% |
| **P09** | 資料庫、帳號與權限系統 | 8.5% | 12 | 1 | 10 | 0 | 1 | 52.50% | 4.4625% | 1 | 10 | 0 | 1 | 52.50% | 4.4625% | 0.0000% |
| **P10** | 官方電子郵件與通知系統 | 3.5% | 10 | 0 | 2 | 8 | 0 | 8.00% | 0.2800% | 0 | 2 | 8 | 0 | 8.00% | 0.2800% | 0.0000% |
| **P11** | AI 智慧教學與分析系統 | 6.0% | 11 | 1 | 10 | 0 | 0 | 30.00% | 1.8000% | 1 | 10 | 0 | 0 | 30.00% | 1.8000% | 0.0000% |
| **P12** | 公開品牌網站開發 | 6.5% | 11 | 6 | 5 | 0 | 0 | 86.36% | 5.6136% | 6 | 5 | 0 | 0 | 86.36% | 5.6136% | 0.0000% |
| **P13** | 學生學習平台開發 | 10.0% | 13 | 4 | 9 | 0 | 0 | 66.15% | 6.6154% | 5 | 8 | 0 | 0 | 75.38% | 7.5385% | **+0.9231%** |
| **P14** | 互動遊戲與遊戲化學習系統 | 7.0% | 16 | 0 | 3 | 13 | 0 | 3.75% | 0.2625% | 0 | 3 | 13 | 0 | 3.75% | 0.2625% | 0.0000% |
| **P15** | 教師管理平台開發 | 7.5% | 15 | 0 | 4 | 11 | 0 | 13.33% | 1.0000% | 1 | 4 | 10 | 0 | 21.33% | 1.6000% | **+0.6000%** |
| **P16** | 平台管理員與系統營運後台 | 7.0% | 15 | 1 | 4 | 10 | 0 | 17.33% | 1.2133% | 1 | 4 | 10 | 0 | 17.33% | 1.2133% | 0.0000% |
| **P17** | 品牌行銷與數位媒體中心 | 2.5% | 10 | 0 | 2 | 8 | 0 | 6.00% | 0.1500% | 0 | 2 | 8 | 0 | 6.00% | 0.1500% | 0.0000% |
| **P18** | 系統測試、品質控管與資安檢查 | 6.5% | 14 | 1 | 1 | 12 | 0 | 11.43% | 0.7429% | 1 | 2 | 11 | 0 | 15.71% | 1.0214% | **+0.2786%** |
| **P19** | 正式部署與公開上線 | 5.0% | 11 | 0 | 0 | 8 | 3 | 0.00% | 0.0000% | 0 | 0 | 8 | 3 | 0.00% | 0.0000% | 0.0000% |
| **P20** | 品牌營運、系統維護與長期發展 | 2.5% | 12 | 3 | 0 | 9 | 0 | 25.00% | 0.6250% | 3 | 0 | 9 | 0 | 25.00% | 0.6250% | 0.0000% |
| **總計** | **全站 20 階段加權總結** | **100.0%** | **226** | **68** | **75** | **79** | **4** | — | **45.961878%** | **71** | **74** | **77** | **4** | — | **48.063526%** | **+2.101648%** |

---

## 九、全站加權完成率推導與三大波段分析

### 9.1 累積推進歷程 (Progressive Cumulative Score)

進度計算採**累積推進**方式，嚴禁重複計分或將各波段完成率直接相加：

```
[原始凍結基準] (2026-11-13)
■■■■■■■■■□□□□□□□□□□□  45.961878% (PASS: 68, PARTIAL: 75, NOT STARTED: 79, BLOCKED: 4)

[第 1 波核算後] (基礎補強 + RWD CDP 模擬 + P18 視窗測試)
■■■■■■■■■□□□□□□□□□□□  46.540450% (單波貢獻: +0.578571%, 累計成長: +0.578571%)

[第 2 波核算後] (學生學習平台完整化，P13 實質增加 120 點)
■■■■■■■■■□□□□□□□□□□□  47.463526% (單波貢獻: +0.923077%, 累計成長: +1.501648%)

[第 3 波核算後 (本次最終精確建議結果)] (教師平台打通 + 資安防禦)
■■■■■■■■■■□□□□□□□□□□  48.063526% (單波貢獻: +0.600000%, 累計成長: +2.101648%)
```

### 9.2 三大波段權重區段對比分析

依專案架構劃分三大權重區段：
1. **第 1 波段：基礎規格與品牌架構 (P01～P08，總權重 27.5%)**
   - 原始基準貢獻：`23.196667%`（區段完成率 84.35%）
   - 新建議貢獻：`23.496667%`（區段完成率 **85.44%**）
   - 淨增長：**+0.300000%**（來自 `P07-UIX-008` 升級 PASS；`P07-UIX-009` 維持 PARTIAL）。

2. **第 2 波段：核心平台與自主學習 (P09～P13，總權重 34.5%)**
   - 原始基準貢獻：`18.771521%`（區段完成率 54.41%）
   - 新建議貢獻：`19.694598%`（區段完成率 **57.09%**）
   - 淨增長：**+0.923077%**（來自 `P13` 實質四項變更增加 120 點，完成率達 **75.38%**）。

3. **第 3 波段：遊戲、後台、部署與維運 (P14～P20，總權重 38.0%)**
   - 原始基準貢獻：`3.993690%`（區段完成率 10.51%）
   - 新建議貢獻：`4.872262%`（區段完成率 **12.82%**）
   - 淨增長：**+0.878571%**（來自 `P15-TCH-002` +0.3500%, `P15-TCH-003` +0.2500%, 及 `P18-QAS-011` +0.2786%）。

---

## 十、原始基準與新建議基準對比總結

| 指標項目 | 原始凍結基準 (2026/11/13) | 本次建議核算值 (校準精確版) | 差異 (Delta) | 狀態與品質說明 |
| :--- | :---: | :---: | :---: | :--- |
| **全站總階段數** | 20 個 | 20 個 | 0 | 結構完整對齊，無增刪階段 |
| **總 UID 項目數** | 226 項 | 226 項 | 0 | 一對一嚴格對應，無漏項或虛增 |
| **全站加權完成率** | **45.961878%** | **48.063526%** | **+2.101648%** | **四捨五入為 48.0635%**，實事求是、精確閉合 |
| **PASS 項目數** | 68 項 (30.09%) | **71 項** (31.42%) | **+3 項** | 新增 P07(1), P13(1), P15(1) 實質全端通過 |
| **PARTIAL 項目數** | 75 項 (33.19%) | **74 項** (32.74%) | **-1 項** | 2 項升級 PASS，新增 P18(1) 轉入，P13(3)/P15(1) 深度提升 |
| **NOT STARTED 項目數** | 79 項 (34.96%) | **77 項** (34.07%) | **-2 項** | P15-TCH-002 與 P18-QAS-011 成功啟動並取得進展 |
| **BLOCKED 項目數** | 4 項 (1.77%) | **4 項** (1.77%) | **0 項** | 嚴格鎖定，絕無解除外在阻斷項目 |

---

## 十一、受阻 (BLOCKED) 與停工 (STOPPED) 項目追蹤

本核算案嚴格遵守保護規則，未私自解除或降級任何受阻項目：

1. **`AUTH-03`：BLOCKED**
   - 狀態：持續阻斷。
   - 影響：Supabase 雲端資料庫直接連線受限，所有雲端同步（跨裝置紀錄、正式雲端公告廣播、即時線上考試交卷）均受阻。
2. **`task-13717`：STOPPED**
   - 狀態：持續停止。
   - 影響：非授權背景任務已終止，防止外在不可控之行程干擾專案代碼庫。
3. **`P09-DBA-012`：BLOCKED (30%)**
   - 狀態：維持 30% BLOCKED。
   - 影響：本機 PostgreSQL 17 沙箱因 TOC 簽章問題還原受阻，等待正式乾淨還原檔。
4. **`P19-DEP-004` / `P19-DEP-005` / `P19-DEP-009`：BLOCKED (0%)**
   - 狀態：維持 0% BLOCKED。
   - 影響：正式環境密鑰配置、生產資料庫正式遷移及雲端回滾演練需待正式上線授權。
5. **五大正式術科題組安全保護**：
   - 題組一（104301）既有 59 行修改持續鎖定，靜待五組答案齊備後比對。
   - 題組二至題組五之教材、題目、檢核邏輯 100% 保持唯讀保護。

---

## 十二、第 1～3 波後全站尚未完成工作清冊 (Backlog)

在第 1～3 波完成後，專案主要尚待推動之核心工程清單如下：

1. **P16 平台管理員與營運後台**（現正由第 4 波執行）：
   - 管理員使用者列表、角色指派、停權。
   - 審核中心（教師資格審核、內容發布審核）。
   - 系統運營監控面板（錯誤率、延遲、資源耗用）。
2. **P10 官方電子郵件與真實傳輸通道**：
   - 串接真實 SMTP/Resend 郵件服務，完成註冊驗證信、成績通知外發。
3. **P11 AI 智慧教學系統深度整合**：
   - 實作後端安全受控之 Gemini API Proxy，建立速率限制、Prompt 注入過濾與 Token 成本監控。
4. **P14 互動遊戲化學習系統**：
   - Code Puzzle、CSS Designer、Bug Hunter、Quiz Rush、Web Builder 5 款遊戲從 Prototype 原型升級為正式整合模組。
5. **P15 教師進階功能**：
   - 線上測驗建立與發布、及格分數與隨機抽題設定、即時考試監控中心與待辦批改隊列。
6. **P19 正式雲端部署**：
   - Render / 雲端容器部署、正式網域與 SSL 憑證配置、DNS 設定。

---

## 十三、證據不足項目與核算限制邊界

為確保進度數字具備 100% 法律與工程級可信度，本次核算明確列出下列**限制與邊界**：

1. **本機 LocalStorage 隔離不等於雲端多租戶資料庫**：
   - 學生筆記（`studentStudyToolsStorage`）與教師備忘（`ctk_teacher_announcements`）均以使用者 ID 前綴實作本機存儲。此架構滿足單機離線體驗，但無法跨裝置漫遊。因此涉及跨裝置同步之 UID 絕不評定為 PASS。
2. **Roadmap 誠實對話框不計為功能完成**：
   - 教師端考試建立、成績報表匯出目前以前端 Modal 清楚提示「規劃中」，此項設計保障了使用者體驗之透明度，但在 UID 計分上嚴格列為 0% NOT STARTED。
3. **單元測試不等於真實全鏈路 E2E**：
   - 前端 25 套測試與後端 16 套測試均在離線 Mock 環境下執行通過。在未串接正式 Supabase 雲端環境前，不跨越邊界宣告全系統整合完成。
4. **CDP 視窗模擬不等於實體設備測試**：
   - RWD 測試乃基於 Headless Chrome CDP 協議之解析度覆寫量測，已精確註明，避免誤導為硬體實機測試。

---

## 十四、Git 安全與檔案保護查核結果

### 14.1 Git 基準核驗
- **Git HEAD**：`c44ea7929f39ef469f380027c2fd3143726d9922`
- **當前分支**：`main`
- **Git 操作遵守**：零 Commit、零 Push、零 Deploy、零 Reset、零 Clean、零 Restore。

### 14.2 檔案變更保護核驗
- **第 4 波檔案隔離**：
  - `frontend/src/pages/public/AdminDashboardPage.tsx`：未修改，保持第 4 波原樣。
  - `frontend/tests/admin-dashboard.test.tsx`：未修改，保持第 4 波原樣。
  - `docs/development/PHASE_4_*`：未修改，保持第 4 波原樣。
- **本次修正唯一檔案**：
  - [`docs/development/PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_3.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PROJECT_20_PHASE_PROGRESS_RECALCULATION_AFTER_PHASE_3.md)
- **正式代碼保護**：未修改任何前端、後端、資料庫、Prisma Schema、Migration 或正式設定檔。

---

## 十五、最終核算判定與建議

### 15.1 最終判定結論
經過對第 1、2、3 波之實體程式碼、自動化測試套件與交付報告進行深度覆核與數字校準：
1. **P13 數字矛盾徹底消除**：實質四項變更增加 120 點，P13 完成率精確為 **75.38%**（由 66.15% 增加 9.23%），先前 76.92% 係因前版初稿文字誤植 60% 基準所致，現已完全修正對齊。
2. **P07 與 P15 實事求是**：
   - `P07-UIX-008` 明確標註為 Headless Chrome CDP 14 視窗模擬測試（0px 溢出），評為 PASS。
   - `P07-UIX-009` 因測試僅涵蓋 2 款彈窗，嚴格維持 **PARTIAL (70%)**。
   - `P15-TCH-002` 因待辦批改隊列未串後端，嚴格評定為 **PARTIAL (70%)**，不灌水為 PASS。
   - `P15-TCH-003` 班級管理與全套資安守衛（RBAC/Anti-IDOR/CSRF）通過測試，評為 **PASS (100%)**。
   - `P15-TCH-013` 因僅有本機備忘，無雲端與郵件通道，嚴格維持 **NOT STARTED (0%)**。
3. **最終客觀建議完成率**：全站加權完成率由原始基準 **45.961878%** 推進至 **48.063526%**（淨增長 **+2.101648%**，四捨五入為 **48.0635%**）。
4. **狀態分佈健康轉移**：
   - PASS 由 68 項提升至 **71 項** (+3 項)。
   - PARTIAL 由 75 項微調為 **74 項** (-1 項)。
   - NOT STARTED 由 79 項收斂至 **77 項** (-2 項)。
   - BLOCKED 維持 **4 項**（完全未變）。

### 15.2 正式地位與後續建議
- **正式地位**：本報告之數據為「**建議核算結果（Proposal）**」，不自動取代現行正式基準。
- **後續步驟**：
  1. 請使用者審閱本報告之最新校準數據與升級判定。
  2. 待使用者審核確認後，再行將 48.0635% 採認為官方新基準線。
  3. 第 4 波（P16 平台管理員與營運後台）繼續依原定 Batch 0～7 獨立執行，不受本核算影響。
