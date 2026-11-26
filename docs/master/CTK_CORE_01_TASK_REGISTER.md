# CODE TO KNOW｜CTK-CORE-01 核心平台任務登記簿
## CORE-FIRST Platform Official Task Register

**文件識別：** `docs/master/CTK_CORE_01_TASK_REGISTER.md`  
**專案代號：** `CTK-CORE-01`  
**專案名稱：** 碼上學｜核心平台建構與智慧學習加速計畫  
**管理原則：** 每個分類獨立編號（三位數），任務代號不得重複。所有尚未開始執行的任務嚴格標記為 `PROPOSED`，嚴禁預先標記 `PASS`。  
**版本狀態：** v1.0.0 (2026-11-25)  

---

## 任務分類說明 (Task Category Codes)

- **DISC**：現況盤點、技術探索與環境查核 (Discovery)
- **PLAN**：架構設計、規範制定與遷移計畫 (Planning)
- **DB**：資料庫遷移、模型調整、種子資料與備份還原 (Database)
- **BE**：後端 API 模組、服務層、路由與控制器實作 (Backend)
- **FE**：前端頁面、API 客戶端串接與狀態管理改造 (Frontend)
- **SEC**：身分安全、權限矩陣、IDOR 審查與日誌脫敏 (Security)
- **TEST**：單元測試、整合測試、負載防刷與容錯測試 (Testing)
- **INT**：前後端全鏈路縱向整合與端對端驗收 (Integration)

---

## 一、現況盤點類任務 (DISC — Discovery)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-DISC-001` | CORE-FIRST Transition Planning & Database Read-Only Discovery | P0 | 全系統現況盤點、Prisma 與 API 缺口分析、建立三大規劃治理文件 | **PASS** | 本次已順利完成之唯讀盤點任務。 |
| `CTK-CORE-01-DISC-002` | Local PostgreSQL Docker Environment & Seed Data Readiness Audit | P0 | 本機 Docker PG17 連線池配置與 611 題 JSON 格式相容性查核 | `PROPOSED` | 待 DISC-001 驗收後啟動。 |
| `CTK-CORE-01-DISC-003` | Exam Attempt & Answer Snapshot Storage Capacity Modeling | P1 | 模擬考 80 題交卷快照資料增長量與磁碟空間估算 | `PROPOSED` | 待測驗模組上線後評估。 |

---

## 二、架構規劃類任務 (PLAN — Planning)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-PLAN-001` | Core Platform Transition Plan Baseline Formulation | P0 | 訂定 CORE-FIRST 轉型目標、DoD、P0/P1/P2 功能分級 | **PASS** | 載於 `CTK_CORE_01_CORE_FIRST_TRANSITION_PLAN.md`。 |
| `CTK-CORE-01-PLAN-002` | Question Bank & Exam Engine RESTful API Interface Specification | P0 | 制定題庫、試卷抽卷、作答交卷與錯題本之 OpenAPI 契約規範 | `PROPOSED` | 待後端實作前完成。 |
| `CTK-CORE-01-PLAN-003` | Practical Sandbox Code Snapshot & Progress Sync Protocol Design | P0 | 制定術科沙盒 104301~05 代碼暫存、步驟完成與雲端同步協議 | `PROPOSED` | 待術科模組整合前完成。 |

---

## 三、資料庫與持久化類任務 (DB — Database)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-DB-001` | Database Connection Pool & Local PG17 Initialization Baseline | P0 | 本機開發庫與測試庫連線池調優、健全檢查測試確認 | **PASS** | 已於本機 PG17 隔離庫驗證重現性、連線池與備份還原通過。 |
| `CTK-CORE-01-DB-002` | Official 611 Theory Questions Database Seed Pipeline | P0 | 官方 611 題題庫格式查核、Prisma 映射與 Seed 工具 (Dry-Run) 就緒 | **PASS** | 605 題有效題庫 Zod 校驗、決定性 UUID 冪等設計與 10 項測試通過。 |
| `CTK-CORE-01-DB-003` | Automated Database Backup & Point-in-Time Restore Scripts | P0 | 建立本機/伺服器端資料庫自動備份腳本與災難還原驗證流程 | **PASS** | 自訂格式備份、SHA-256、Manifest、Restore Preflight 隔離防呆與 12 項測試全數通過（PITR 評估為 PITR NOT IMPLEMENTED）。 |
| `CTK-CORE-01-DB-004` | Practical Task Baseline Data Verification & Step Seeding | P0 | 確保五大官方題組在 PracticalTask 與 PracticalStep 資料正確就緒 | **PASS** | 已整併於 `CTK-CORE-01-INT-003` 批次交付，5 大題組 71 步驟種子寫入完成。 |

---

## 四、後端服務與 API 類任務 (BE — Backend)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-BE-001` | Certification & Theory Question Bank Query APIs | P0 | 實作 `/api/certifications` 與 `/api/questions` 查詢與工作項目過濾 | `PROPOSED` | 依賴 DB-002。 |
| `CTK-CORE-01-BE-002` | 80-Question Stratified Paper Generation & Exam Attempt APIs | P0 | 實作 `/api/exams` 分層抽題出卷與測驗階段初始化 | `PROPOSED` | 依賴 BE-001。 |
| `CTK-CORE-01-BE-003` | Server-Side Exam Submission, Scoring & Answer Snapshot APIs | P0 | 實作 `/api/exam-attempts/:id/submit`，伺服器核分並寫入 AnswerSnapshot | `PROPOSED` | 依賴 BE-002。 |
| `CTK-CORE-01-BE-004` | Wrong Question Notebook Lifecycle & Mastery State Machine APIs | P0 | 實作 `/api/wrong-questions` 自動記錄錯題與連續 2 次答對解除掌握 | `PROPOSED` | 依賴 BE-003。 |
| `CTK-CORE-01-BE-005` | Student Unit Progress & Study Time Tracking APIs | P0 | 實作 `/api/progress/units` 單元完成度與學習時長記錄 | `PROPOSED` | 依賴 BE-001。 |
| `CTK-CORE-01-BE-006` | Practical Task Step Checklist & Sandbox Code Snapshot APIs | P0 | 實作 `/api/practical-progress` 保存 104301~05 步驟狀態與代碼快照 | **PASS** | 已整併於 `CTK-CORE-01-INT-003` 批次交付，支援雙版本隔離與代碼持久化。 |
| `CTK-CORE-01-BE-007` | Teacher Classroom Exam Roster & Practical Progress Analytics APIs | P0 | 擴充 `/api/classrooms/:id/analytics` 供教師檢視學員成績與術科進度 | **PASS** | 已整併於 `CTK-CORE-01-INT-004` 批次交付，支援班級成效診斷與個別學員進度穿透。 |

---

## 五、前端介面與 API 串接類任務 (FE — Frontend)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-FE-001` | Frontend Unified API Client Extension (Questions & Exams) | P0 | 於 `frontend/src/services/api.ts` 擴充 questionApi 與 examApi 客戶端 | `PROPOSED` | 依賴 BE-001, BE-002。 |
| `CTK-CORE-01-FE-002` | Theory Practice Page Real API Integration & LocalStorage Sunset | P0 | 將 `TheoryPracticePage.tsx` 串接後端題庫 API，支援離線 Demo 降級 | `PROPOSED` | 依賴 FE-001。 |
| `CTK-CORE-01-FE-003` | Mock Exam Page 80-Question Server Workflow & Result Integration | P0 | 將 `MockExamPage.tsx` 改由伺服器抽題、交卷並讀取伺服器核算成績 | `PROPOSED` | 依賴 FE-001, BE-003。 |
| `CTK-CORE-01-FE-004` | Wrong Question Notebook Server State Sync & Review Integration | P0 | 改造個人錯題本介面，與後端狀態機雙向同步掌握度狀態 | `PROPOSED` | 依賴 BE-004。 |
| `CTK-CORE-01-FE-005` | Practical Sandbox Real API Code Snapshot & Progress Integration | P0 | 將術科沙盒與教學步驟進度對接後端 `/api/practical-progress` | **PASS** | 已整併於 `CTK-CORE-01-INT-003` 批次交付，`CodeEditorPage` 與 `PracticalLearningPage` 雙向同步。 |
| `CTK-CORE-01-FE-006` | Student & Teacher Dashboard Core Learning Metrics Integration | P0 | 儀表板學生學習成效與教師班級學生成績列表串接真實後端 API | **PASS** | 已整併於 `CTK-CORE-01-INT-004` 批次交付，學生、教師與管理端三端儀表板串接完成。 |

---

## 六、安全與權限類任務 (SEC — Security)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-SEC-001` | Exam Attempt & Progress IDOR Ownership Enforcement Audit | P0 | 嚴格審查所有測驗與進度端點，強制僅能存取本人或授課教師管轄之資料 | **PASS** | 已整併於 `CTK-CORE-01-INT-004` 批次交付，IDOR 越權與欄位偽造防護 100% 驗證。 |
| `CTK-CORE-01-SEC-002` | Anti-Cheating & Exam Anti-Tampering Security Review | P0 | 審查交卷作答時間合理性、重複交卷阻斷與伺服器端唯一防護 | `PROPOSED` | 依賴 BE-003。 |
| `CTK-CORE-01-SEC-003` | Sensitive Data Redaction & Student Privacy Audit | P0 | 審查日誌與 API 回傳，確保學生個資、帳號機敏資訊均經去敏化處理 | `PROPOSED` | 橫跨全模組。 |

---

## 七、測試與品質驗證類任務 (TEST — Testing)

| 任務代號 | 任務名稱 | 優先等級 | 負責範疇 | 目前狀態 | 備註說明 |
|---|---|:---:|---|:---:|---|
| `CTK-CORE-01-TEST-001` | Question Bank & Exam Generation Unit Test Suite | P0 | 撰寫 80 題分層抽題分佈、題號唯一性與題型校驗之單元測試 | `PROPOSED` | 依賴 BE-002。 |
| `CTK-CORE-01-TEST-002` | Server-Side Scoring & Answer Snapshot Integrity Integration Tests | P0 | 撰寫交卷算分、單題配分權重與快照解耦防篡改之資料庫整合測試 | `PROPOSED` | 依賴 BE-003。 |
| `CTK-CORE-01-TEST-003` | Database Disaster Recovery & Scripted Backup/Restore Drill | P0 | 執行資料庫實體備份、毀損模擬與冷熱還原演練，確認資料無損 | `PROPOSED` | 依賴 DB-003。 |

---

## 八、2026-12-13 比賽衝刺垂直整合批次 (Vertical Slices — CORE-FIRST & DEADLINE-FIRST)

依據 2026-11-25《COMPETITION DEADLINE ACCELERATION RULES》，本專案不再過度拆分相互等待的微型任務，而是在 2026-12-13 比賽展示日前，將資料庫、後端、前端、測試與驗收整合成五大端到端垂直整合批次（P0 核心）：

| 批次代號 | 垂直整合任務名稱 | 涵蓋範疇 (DB + BE + FE + TEST) | 目標交付日期 | 目前狀態 |
|---|---|---|:---:|:---:|
| `CTK-CORE-01-INT-001` | **Batch 1: 官方學科題庫端對端學習與練習系統** | 605 題 Seed 寫入本機隔離庫 + `/api/questions` & `/api/certifications` + `TheoryPracticePage` 真實 API 串接 + 篩選刷題流程 + 整合測試 | 2026-11-28 | **PASS** |
| `CTK-CORE-01-INT-002` | **Batch 2: 80 題分層抽題模擬考與錯題本生命週期** | `/api/exams/generate` (4 工作項目抽題) + `/api/exam-attempts/:id/submit` (伺服器唯一算分快照) + 錯題本狀態機 + `MockExamPage` 串接 + 防作弊測試 | 2026-12-02 | **PASS** |
| `CTK-CORE-01-INT-003` | **Batch 3: 五大官方術科題組學習與沙盒代碼保存** | 104301~05 官方術科題組基礎資料 + `/api/practical-progress` + 步驟檢核與代碼快照持久化 + 沙盒編輯器串接 + 測試 | 2026-12-06 | **PASS** |
| `CTK-CORE-01-INT-004` | **Batch 4: 學生學習歷程與教師班級管理展示流程** | 學習成效進度 API + 教師班級成效儀表板 + `StudentDashboardPage` & `TeacherDashboardPage` 真實數據串接 + 角色權限隔離 (RBAC) 測試 | 2026-12-10 | **PASS** |
| `CTK-CORE-01-INT-005` | **Batch 5: 比賽展示總體驗收、資安回歸與備份還原演練** | 全流程端對端驗收 + 跨平台/RWD 視覺巡檢 + 備份完整性查核 + 比賽展示腳本與測試證據報告封裝 | 2026-11-25 | **PASS** |
| `CTK-CORE-01-INT-005-R` | **Batch 5-R: 獨立資料庫災難備份還原演練** | 建立獨立目標庫 `ctk_core01_int005_restore_verify` + 還原 20261125120830 備份 + 20 項跨庫深層比對 (37表/605題/5術科/0孤兒) + 原始 Scratch DB 100% 完好未覆蓋 | 2026-11-25 | **PASS** |
| `INT-005-R 補充稽核` | **Batch 5-R-Audit: 還原權限溯源、RLS 範圍查核與回歸測試** | 清查所有 GRANT/RLS 操作 100% 僅限目標還原庫 + 原始 Scratch DB 唯讀查核 + 還原庫權限報告 + 修改後 DB-003 單元測試 (12/12) 與離線測試套件 (336/336) 全數通過 | 2026-11-25 | **PASS** |
| `CTK-CORE-01-INT-006` | **Batch 6: 學生學習數據中心與錯題閉環** | 研讀時長真實追蹤 + 17300 四大工作項目進度動態核算 + 錯題本狀態機流轉 + 學習歷程頁面整合 | 2026-11-26 | **PASS** |
| `CTK-CORE-01-INT-007-A` | **Batch 7-A: 弱點診斷核心架構設計** | V2.2 弱點指數 (WI) 加權演算法 + 複合水線快照儲存契約 + 兩階段排序演算法設計審查 | 2026-11-26 | **PASS** |
| `CTK-CORE-01-INT-007-B` | **Batch 7-B: 弱點核心運算與快照服務** | Read-Through 快取 + Single-Flight 併發合併 + 10s 冷卻防刷 + 21 項單元與整合測試 | 2026-11-26 | **CLOSED / PASS** |
| `CTK-CORE-01-INT-007-C` | **Batch 7-C: 弱點診斷前端整合** | Layer 8 合約型別 + 原生 SVG 四軸雷達圖 + 四考科卡片 + 閉環推薦卡 + 8 項整合測試 | 2026-11-26 | **CONDITIONAL PASS** |
| `CTK-CORE-01-INT-007-C-REMEDIATION` | **Batch 7-C 修正: 瑕疵清理與拋光** | 清理檔案結尾空白行 (ISS-007C-01) + 修正文件路由筆誤 (ISS-007C-02) + 優化非429錯誤冷卻 (ISS-007C-03) + 圖例標籤拋光 (ISS-007C-04) | 2026-11-27 | **PENDING (明日第一項任務)** |

---

## 九、登記簿治理狀態與專案進度小結 (2026-11-25 每日結案)

### 1. 正式進度指標分項紀錄 (嚴格分開紀錄，絕不混用)

| 進度項目 | 正式紀錄 | 說明備註 |
|---|:---:|---|
| **CTK-CORE-01 INT 批次** | **6／6 PASS (INT-001~006)** | 前六大垂直整合衝刺批次全數通過 |
| **INT-007-B** | **CLOSED / PASS** | 弱點診斷核心運算與快照服務獨立驗收通過 |
| **INT-007-C** | **CONDITIONAL PASS** | 弱點診斷前端整合獨立驗收有條件通過（待明日修正） |
| **INT-005-R** | **PASS** | 獨立資料庫災難備份還原演練驗收通過 |
| **INT-005-R 補充稽核** | **PASS** | 權限操作溯源、原始庫唯讀保護與修改後回歸全數通過 |
| **CTK-CORE-01 加權完成率** | **尚未正式核算** | 待全專案需求盤點後依權重公式精確核算 |
| **原始專案整體基準** | **49.166860% LOCKED** | 既有進度基準凍結鎖定，未經正式審查不得擅改 |
| **原始 P10 階段** | **8.00%** | 既有 P10 階段進度基準 |
| **Master Wave** | **UNKNOWN，待核實** | 待整體 Roadmap 統整後確認 |
| **Preview Batch** | **UNKNOWN，待核實** | 待預覽環境重新對齊後確認 |

> [!NOTE]
> **重要宣告：** INT-001~INT-006 完工及 INT-007 推進僅代表已核准批次進度，絕不代表整個 CTK-CORE-01 核心平台已全數完工。INT-007-C 維持 CONDITIONAL PASS，明日排定首要執行 `CTK-CORE-01-INT-007-C-REMEDIATION`。

### 2. 任務狀態總結
- **已完成任務 (PASS / CLOSED)：** 14 項 (`DISC-001`, `PLAN-001`, `DB-001`, `DB-002`, `DB-003`, `DB-004`, `BE-006`, `BE-007`, `FE-005`, `FE-006`, `SEC-001`, `INT-001`～`INT-006`, `INT-007-A`, `INT-007-B`, `INT-005-R`, `INT-005-R 補充稽核`)。
- **有條件通過待修正任務 (CONDITIONAL PASS)：** 1 項 (`CTK-CORE-01-INT-007-C`)。
- **明日排定修正任務 (PENDING)：** 1 項 (`CTK-CORE-01-INT-007-C-REMEDIATION`)。
- **預先標記 PASS 數量：** **0 項（嚴格遵守治理守則）**。
- **任務代號重複數量：** **0 項（各分類獨立編號且唯一）**。

### 3. 2026-11-26 垂直整合第六批次成果紀錄 (CTK-CORE-01-INT-006)

- **任務代號：** `CTK-CORE-01-INT-006`
- **任務名稱：** 學生學習數據中心、研讀時長追蹤、工作項目進度與錯題本閉環整合
- **治理狀態：** **PASS (100% 通過驗收)**
- **交付與驗收詳情：**
  - **INT-006-A (研讀時長真實追蹤)：** 實作 `POST /api/student/study-time`（防溢位 1~7200s、原子累加）與 `GET /api/student/study-time`（總時長、7 日分佈、模組拆解）；前端自訂 Hook `useStudyTimer` 追蹤活躍標籤並非同步回報。
  - **INT-006-B (四大工作項目動態進度)：** 串接官方 17300 考科四項工作項目（236, 233, 71, 65 題，全量 605 題），動態核算答題數與掌握度，徹底拔除硬編碼假數值。
  - **INT-006-C (錯題本閉環)：** 實作 `POST /api/wrong-questions/record`，刷題與模考答錯自動收錄至 PostgreSQL 錯題本；流轉狀態機（UNRESOLVED → REVIEWING → 2連對 MASTERED 攻克）。
  - **INT-006-D (學習歷程頁面整合)：** 全面重構 `LearningProgressPage.tsx`，支援骨架載入、空狀態、錯誤重試與在線即時複習核分 Modal。
  - **安全與測試指標：**
    - `int006-student-analytics-and-wrong-questions.test.ts`：7/7 測試 PASS (含 IDOR 防禦)。
    - `int006-live-verification.ts`：PostgreSQL 17 容器實體驗證 100% 通過。
    - 後端離線全量測試：27 個檔案、343 個測試案例全數 PASS。
    - 前端 Vite Production Build 0 錯誤通過 (2.29s)。
  - **詳細報告：** [CTK_CORE_01_INT_006_FINAL_ACCEPTANCE_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/quality/CTK_CORE_01_INT_006_FINAL_ACCEPTANCE_REPORT.md)。

### 4. 2026-11-26 垂直整合第七批次成果紀錄 (CTK-CORE-01-INT-007 全系列)

- **INT-007-A (設計審查 V2.2)：** **CLOSED / PASS**
  - 交付文件：`CTK_CORE_01_INT_007A_DESIGN_REVIEW_V2_2.md`、`CTK_CORE_01_INT_007A_V2_2_INDEPENDENT_ACCEPTANCE_AUDIT.md`。
  - 明確弱點指數 WI 權重算式、四維官方考科映射、三級閾值 (65/40/20) 與複合水線快照淘汰機制。
- **INT-007-B (核心運算與快照服務)：** **CLOSED / PASS**
  - 交付模組：`weaknessDiagnosis.service.ts`、`weaknessDiagnosis.schema.ts`、`student.controller.ts`、`student.routes.ts`。
  - 核心機制：Read-Through 快取、Single-Flight 併發防雪崩、10s 冷卻防刷、兩階段排序。
  - 驗收數據：21/21 單元與整合測試 100% 通過；交付報告與獨立驗收報告齊備。
- **INT-007-C (弱點診斷前端整合)：** **CONDITIONAL PASS**
  - 交付組件：`WeaknessRadarChart` (純原生 SVG 四軸雷達圖)、`WeaknessSubjectCard`、`AdaptiveActionCard`、`WeaknessSummaryBanner`、`LearningProgressPage` 整合。
  - 前端合約：Layer 8 型別契約與 `api.ts` 串接完成，Demo Mode 離線降級支援。
  - 驗收測試：8/8 前端整合測試通過、前端 Build (Vite + tsc) 成功通過 (Exit 0, 2.36s)、後端全離線測試 (29 套件 / 373 測試) 100% 通過。
  - 待修正項目：
    - ISS-007C-01: `components.css` 與 `database-contracts.ts` 尾端多餘空白行清理。
    - ISS-007C-02: 實作報告表格路由筆誤更正為 `/api/student/weakness-analysis`。
    - ISS-007C-03: `LearningProgressPage.tsx` 非 429 錯誤時 fallback 觸發 10s 冷卻優化。
    - ISS-007C-04: 雷達圖圖例標示加註 `(弱點指數 WI)` UX 拋光。
    - 待彩排項目: 跨 10 種解析度實體瀏覽器渲染截圖驗證。
  - 明日接續：排定 2026-11-27 執行 `CTK-CORE-01-INT-007-C-REMEDIATION`。


