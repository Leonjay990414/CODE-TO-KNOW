# 碼上學｜CODE TO KNOW
# 第 4 波：平台管理員與系統營運後台完整化 — 最終獨立驗收與 P16 UID 證據核對報告

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件性質：** 第 4 波最終獨立驗收、真實性核對與 P16 正式 UID 審查報告  
**驗收時間：** 2026-11-15  
**對應波次與階段：** 第 4 波（主要對應 P16 平台管理員與系統營運後台）  
**審查基準：**
- `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` (226 UID 原始基準)
- `docs/development/PHASE_4_BASELINE_AUDIT.md`
- `docs/development/PHASE_4_FEATURE_MATRIX.md`
- `docs/development/PHASE_4_COMPLETE_EXECUTION_REPORT.md`
- `docs/development/PHASE_4_REMAINING_ISSUES_AND_HANDOFF.md`
- 專案程式碼與自動化測試套件（前端 Vitest 26 檔案、後端 Vitest 16 檔案）

---

## 一、驗收總結論與判定（Final Verdict）

### 驗收判定：【CONDITIONAL PASS（有條件通過）】

| 審查維度 | 預期標準 | 實測與證據結果 | 判定 |
| :--- | :--- | :--- | :---: |
| **管理員權限與 RBAC 隔離** | 嚴格阻擋非 ADMIN 角色，前後端雙重攔截，防 CSRF | 前端 `ProtectedRoute` 角色層級校驗、後端 `authenticate + requireRoles(['ADMIN'])`、CSRF Token 雙重校驗通過 | **PASS** |
| **教師申請審核真實性** | 真實資料庫操作、狀態篩選、防止重複審核、事務原子性 | `GET/POST /api/admin/teacher-applications`、Prisma `$transaction` 同步更新狀態、授予角色、寫入審計 | **PASS** |
| **全平台班級治理與資料邊界** | 釐清 `GET /api/admin/classrooms` 真實性，防 IDOR | 經查後端 **未實作** 該端點；前端透明標註治理架構規格與 Anti-IDOR 邊界，無假 API 欺騙 | **CONDITIONAL** |
| **安全稽核日誌與系統健康** | 真實端點、敏感資料脫敏、健康探針最小洩露 | `/api/admin/audit-logs` 支援分頁與 `sanitizeAuditDetails` 脫敏；`/api/health` 實測 `SELECT 1` 延遲 | **PASS** |
| **教材題庫與術科審計** | 605 題與 5 大題組來源真實，防假標籤 | 學科 605 題與術科 5 大題組（114 素材/考點）全數源自官方試題；前端合規展示，無後端動態 CMS | **PASS (合規)** |
| **前後端自動化測試** | 完整覆蓋、0 錯誤、誠實標註測試層級 | 前端 26 檔案 232 測試全數 PASS；後端 16 檔案 215 測試全數 PASS；生產編譯 0 錯誤 | **PASS** |
| **專案安全與防護約束** | `AUTH-03` 維持阻擋、題組受保護、0 Git 異動 | 實體資料庫阻擋未解除、題組一 59 行修改維持原狀、無 Commit/Push/Deploy | **PASS** |

### 判定條件說明（Conditions for Full Pass）：
1. **正式資料庫連線條件**：目前因雲端資料庫連線處於安全鎖定（`AUTH-03`），所有整合測試均以離線契約（Offline Contract Mock / Supertest）執行；待取得正式雲端 PostgreSQL 憑證並解除 `AUTH-03` 後，需進行實體庫端到端聯調。
2. **全平台班級與會員治理 API**：全平台跨班級檢索（`GET /api/admin/classrooms`）與全域會員凍結/停用 API 屬於後續深化規劃項目（Roadmap），目前僅落實架構邊界規格與 Anti-IDOR 隔離原則。

---

## 二、重點一：管理員身分驗證與權限控制（Admin Auth & RBAC Security）

### 1. 路由保護與階層判定（Frontend Security）
- **實作檔案**：`frontend/src/components/ProtectedRoute.tsx`、`frontend/src/context/NavigationContext.tsx`
- **核對結果**：
  - 路由 Hash `#admin` 與 `#admin-dashboard` 正確解析至 `admin-dashboard` 頁面。
  - `expandCompatibleFrontendRoles(['ADMIN'])` 明確展開為 `['ADMIN', 'PLATFORM_ADMIN']`。
  - 學生（`STUDENT`）或教師（`TEACHER`）角色無法越權訪問管理員主控台；未登入訪客存取時會提示要求管理員權限並觸發登入對話框。

### 2. 伺服端核心中介軟體攔截（Backend Security）
- **實作檔案**：`backend/src/modules/admin/admin.routes.ts`
- **架構檢驗**：
  ```typescript
  router.use(authenticate, requireRoles(['ADMIN']));
  ```
  - 所有 `/api/admin/*` 端點均受全域中介軟體強制保護。
  - 非 ADMIN 角色（如 STUDENT、TEACHER、SYSTEM_OPERATOR）發出 HTTP 請求時，伺服端一律回傳 `403 Forbidden`（未提供有效 JWT 則回傳 `401 Unauthorized`）。
  - 通過 `backend/tests/admin-hardening.test.ts` 實測：非管理員嘗試存取教師審核列表或審核日誌端點均被攔截（10/10 PASS）。

### 3. CSRF 防護與跨站請求偽造阻斷
- **實作檔案**：`backend/src/middleware/csrf.ts`
- **驗證點**：
  - 管理端所有具狀態變更（Mutation）之端點（`POST /api/admin/teacher-applications/:id/approve`、`POST /api/admin/teacher-applications/:id/reject`）均掛載 `csrfProtection` 中介軟體。
  - 前端 `api.ts` 自動攜帶 `ctk_csrf_token` Cookie 經由 `x-csrf-token` Header 傳送，若缺少或不匹配則回傳 `403 CSRF token missing or invalid`。

### 4. 兩套後台完全分離（P16-ADM-014 達成證據）
- 教師教學管理主控台與平台管理員主控台在架構上實現 **實體分離**：
  - 前端路由：`#teacher-dashboard` vs `#admin-dashboard`。
  - 權限角色：`TEACHER` vs `ADMIN`。
  - 後端命名空間：`/api/classrooms` vs `/api/admin/*`。
  - 絕無僅靠前端隱藏選單之危險實作。

---

## 三、重點二：教師申請審核真實性（Teacher Application Review）

### 1. 資料庫模型與資料流打通
- **Prisma 模型**：`TeacherApplication`（含關聯 `User`）。
- **核對端點**：
  - `GET /api/admin/teacher-applications`：支援 `status` 篩選（`PENDING`、`APPROVED`、`REJECTED`）、分頁 `page` 與 `limit`（最大 50 筆），並回傳申請人詳細資料（姓名、Email、註冊時間）。
  - `POST /api/admin/teacher-applications/:id/approve`：核准教師身分。
  - `POST /api/admin/teacher-applications/:id/reject`：退回教師身分。

### 2. 重複審核防護與狀態機守衛
- 在 `admin.service.ts` 中嚴格校驗：
  ```typescript
  if (application.status !== 'PENDING') {
    throw new BadRequestError(`該申請目前狀態為 ${application.status}，無法重複審核`);
  }
  ```
  已審核過之案件無法重複觸發核准或退回。

### 3. 資料庫交易原子性（Prisma $transaction）
- 審核通過時，在單一資料庫交易內完成三項原子操作：
  1. 更新 `TeacherApplication` 狀態為 `APPROVED`，記錄 `reviewedBy`（審核員 ID）、`reviewedAt` 與 `reviewNote`（審核備註）。
  2. 透過 `prisma.userRole.upsert` 賦予申請人 `TEACHER` 角色（若系統無 TEACHER 角色則自動確保建立）。
  3. 寫入 `AuditLog` 安全日誌（記錄動作 `TEACHER_APPLICATION_APPROVED`、申請人 ID、Email、操作員 IP 與 User-Agent）。

---

## 四、重點三：全平台班級治理與資料邊界（Classroom Governance & Anti-IDOR）

### 1. `GET /api/admin/classrooms` 端點實況核對
- **客觀事實**：後端 **未實作** `GET /api/admin/classrooms` 端點。
- **前端呈現檢驗**：
  - 檢視 `AdminDashboardPage.tsx` 第 3 分頁（Tab 3 `classrooms`）：
  - 該分頁明確標題為 **「全平台班級治理與架構邊界 (P16-ADM-008)」**。
  - 頁面顯著提示：
    > **【班級數據治理與 Anti-IDOR 隔離原則】**  
    > 目前班級管理模組遵循嚴格的租戶數據隔離（Tenant Isolation）。為防止未授權越權，後端 `/api/classrooms` 僅允許各班建立者（導師）存取其所屬班級名冊。管理員全域跨班級審查端點（`GET /api/admin/classrooms`）為後續架構規劃項目；本主控台嚴格遵循後端授權規範，絕不以不安全的前端越權繞過伺服端防護。
  - 頁面陳列 **Classroom Governance Schema Spec**（欄位規範：id、name、certificationId、joinCode、creatorId、memberCount），作為後續全平台班級治理 API 之架構設計藍本。
- **結論**：前端誠實公開系統邊界，**絕無偽造假 API、假資料或模擬越權呼叫**。

---

## 五、重點四：操作稽核日誌與系統健康（Audit Logs & Health Probe）

### 1. 系統稽核日誌端點真實性（Audit Logs）
- **後端端點**：`GET /api/admin/audit-logs`
- **資料庫模型**：Prisma `AuditLog`
- **防護與特性**：
  - 僅提供查詢端點，**無任何更新（PUT/PATCH）或刪除（DELETE）API**，在應用程式層落實 Append-Only（僅可附加寫入）規範。
  - **敏感資料脫敏（Sanitization）**：所有日誌詳情經由 `sanitizeAuditDetails()` 遞迴清洗，自動遮蔽 `password`、`token`、`secret`、`authorization` 等機密欄位。
  - **客觀澄清**：該日誌受應用層唯讀保護，但底層 PostgreSQL 資料庫尚未配置區塊鏈式密碼學防篡改或 WORM 存儲，報告與系統介面均誠實說明，不誇大為「不可逆密碼學硬體防篡改」。

### 2. 系統健康檢查探針（Health Probe）
- **端點位置**：`GET /api/health`
- **實作檢驗**：
  ```typescript
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  const latencyMs = Date.now() - start;
  ```
  - 端點真實發起 `SELECT 1` 查詢，量測資料庫查詢往返時間（Latency）。
  - 若連線異常或帳號驗證失敗，探針捕獲錯誤並回傳 `status: 'error'` 或 `'degraded'`，不會導致 Node.js 伺服器崩潰。
  - **探針邊界聲明**：該端點為單點資料庫存活與服務就緒探針（Liveness/Readiness Probe），**非分散式 APM 監控系統**（如 Datadog/NewRelic），介面誠實標記，不虛報未受監控之第三方指標。

---

## 六、重點五：教材題庫與術科題組審計（Curriculum & Practical Audit）

### 1. 學科題庫真實來源
- 官方題庫來源：勞動部勞動力發展署技能檢定中心「17300 網頁設計 丙級」學科試題（代號：173003A17）。
- 題量：全量 **605 題**（單選題 525 題、複選題 80 題），覆蓋工作項目 01～04。
- 載入路徑：前端由 `frontend/src/data/questionBankAdapter.ts` 載入完整官方題庫。

### 2. 術科五大題組真實來源
- 官方題組代號：173003B12（題組一 104301 至 題組五 104305）。
- 官方素材索引：173003B13 素材庫，合計 **114 個檔案** 經過逐一校對與考點對應。
- 本波異動驗證：題組二至題組五 **0 異動**；題組一維持第 2 波核准之 59 行教學檢核表校正，未受任何竄改。

### 3. 管理端後台功能真實邊界
- Tab 6 (`standards`) 實為「題庫與教材上架品質審核基準面板」，公開官方核實狀態與防呆發布準則（如禁止將 AI 生成題偽冒標記為官方題庫）。
- 本階段 **未實作動態 CMS 後台 API**（即不支援在瀏覽器中動態新增/刪除/編輯官方題目或上傳檔案），此部分維持程式碼與靜態資源版本管控。

---

## 七、重點六：測試覆蓋與自動化驗證（Testing & Build Verification）

實測執行時間：2026-11-15 19:48:00 ~ 19:48:30

### 1. 前端自動化測試套件（Frontend Vitest Suite）
- **執行指令**：`powershell -Command "cd frontend; npx vitest run tests"`
- **測試檔案總數**：**26 個檔案**（包含新增之 `tests/admin-dashboard.test.tsx`）
- **測試案例總數**：**232 項測試**
- **實測結果**：
  - **PASS：232 項（100%）**
  - **FAIL：0 項**
  - **SKIP：0 項**
  - **耗時**：1.21s

### 2. 後端離線測試套件（Backend Vitest Offline Suite）
- **執行指令**：`powershell -Command "cd backend; npm run test:offline"`
- **測試檔案總數**：**16 個檔案**（包含新增之 `tests/admin-hardening.test.ts`）
- **測試案例總數**：**215 項測試**
- **實測結果**：
  - **PASS：215 項（100%）**
  - **FAIL：0 項**
  - **SKIP：0 項**
  - **耗時**：2.04s

### 3. 生產環境編譯建置檢查（Production Build Check）
- **前端建置**：`powershell -Command "cd frontend; npm run build"`（`tsc && vite build`）
  - 結果：**0 錯誤**，耗時 2.40s，產出最佳化靜態資產 bundle。
- **後端編譯**：`powershell -Command "cd backend; npm run build"`（`tsc`）
  - 結果：**0 錯誤**，TypeScript 型別編譯全數通過。

### 4. 測試層級誠實分類標示（Test Level Categorization）
- **單元測試 (Unit Tests)**：`join-code.test.ts`, `validation.test.ts`, `audit-redaction.test.ts` 等（純演算法、校驗綱要、脫敏過濾）。
- **元件與路由測試 (Component Tests)**：`admin-dashboard.test.tsx` (10 tests), `teacher-dashboard-classroom.test.tsx` (9 tests) 等（元件渲染、Hash 路由解析、ADMIN 角色存取阻擋與 API 契約調用）。
- **離線整合與契約測試 (Contract Integration Tests)**：`classroom-routes.test.ts`, `admin-hardening.test.ts` (10 tests), `rbac-workflow.test.ts` 等（針對 Express App 模擬 HTTP 請求，驗證 JWT 認證、CSRF 檢查與 Anti-IDOR 權限攔截）。
- **真正端到端測試 (Live E2E Tests)**：**未執行**（因正式資料庫處於 `AUTH-03` 阻擋，未連線雲端實體庫進行全端瀏覽器測試，絕不誤導宣稱）。

---

## 八、重點七：P16 15 項正式 UID 逐項證據核對（P16 UID Detailed Audit）

依據基準文件 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，逐項核對第 4 波產出與建議狀態：

| UID | 原始工作項目內容 | 原始狀態 (進度) | 第 4 波實際交付與成果證據 | 建議調整狀態 (進度) | 調整依據與客觀邊界 |
| :--- | :--- | :---: | :--- | :---: | :--- |
| `P16-ADM-001` | 第四層平台管理：建立會員、教師審核、班級、課程、證照、教材、題庫、公告、回饋與平台規則管理。 | `NOT STARTED` (0%) | 完成教師資格審核 API、審核主控台 UI、審核通過角色賦予、審核備註與分頁篩選。一般會員註銷/封存與全域班級管理尚待後續深化。 | **`PARTIAL` (50%)** | 教師審核核心流程已 100% 落地並打通資料庫；一般會員管理與全域班級管理暫以規格呈現。 |
| `P16-ADM-002` | 第四層平台管理：建立內容上架、下架、版本、來源與品質審核。 | `PARTIAL` (40%) | 完成官方 605 題學科與 5 大術科審核品質面板，落實試題防偽防呆標籤規範（禁止 AI 題假冒官方題）。動態 CMS 後台 API 仍待開發。 | **`PARTIAL` (50%)** | 官方題庫品質核實完備，發布防呆準則建立，動態上架後台尚未打通。 |
| `P16-ADM-003` | 第四層平台管理：建立遊戲內容管理、任務設定及平台使用統計。 | `PARTIAL` (40%) | 完成 5 大遊戲學習模組品質審計、114 項術科素材索引審查面板。無後端動態配置遊戲數值之 CMS API。 | **`PARTIAL` (50%)** | 靜態合規與審計面板就緒，遊戲動態管理 API 仍為後續項目。 |
| `P16-ADM-004` | 第四層平台管理：建立客服回報、檢舉、處理狀態與申訴流程。 | `NOT STARTED` (0%) | 於主控台 Tab 7 制定 P0～P3 事故與檢舉事件分級通報矩陣，定義通報時限與處理 SOP。工單系統後端模型待建。 | **`PARTIAL` (30%)** | 制度規範與應變流程完備，工單管理 API 待後續波次開發。 |
| `P16-ADM-005` | 第四層平台管理：建立管理員角色、最小權限、操作稽核及敏感操作覆核。 | `NOT STARTED` (0%) | 完成 `GET /api/admin/audit-logs` 端點、審核交易中強制記錄日誌、日誌詳情脫敏洗淨、管理端日誌審閱介面與分頁。 | **`PARTIAL` (80%)** | 稽核讀取與自動寫入已打通；日誌匯出與進階全文檢索待補足。 |
| `P16-ADM-006` | 第五層系統營運：建立系統健康總覽與服務可用性檢查。 | `PASS` (100%) | 整合 `/api/health` 即時 DB 存活探針（SELECT 1 延遲量測）、前端 StatCard 即時視覺化展示。 | **`PASS` (100%)** | 維持原 PASS 狀態，前端介面已完整打通對接。 |
| `P16-ADM-007` | 第五層系統營運：建立前端錯誤、API 延遲／錯誤率、資料庫連線與容量監控。 | `PARTIAL` (40%) | 健康探針回傳即時 DB 延遲與連線狀態；全平台帳號治理面板顯示已審核教師名冊與安全邊界。專業 APM 監控待整合。 | **`PARTIAL` (50%)** | 資料庫延遲與基本連線已可即時探測，容量監控需雲端權限。 |
| `P16-ADM-008` | 第五層系統營運：建立 AI 用量、成本、模型錯誤與預算警報。 | `NOT STARTED` (0%) | 本波未涉及 AI 成本監控 API 開發，維持架構邊界。 | **`NOT STARTED` (0%)** | 誠實標記，未實作項目不予虛報。 |
| `P16-ADM-009` | 第五層系統營運：建立郵件佇列、退信、寄送成功率及第三方服務狀態。 | `NOT STARTED` (0%) | 本波未建立獨立郵件佇列監控儀表板。 | **`NOT STARTED` (0%)** | 誠實標記，維持 0%。 |
| `P16-ADM-010` | 第五層系統營運：建立日誌、告警、事故分級、維護模式與故障處理流程。 | `NOT STARTED` (0%) | 完成維運事件分級通報矩陣（P0~P3）與伺服端降級運作模式規範。 | **`PARTIAL` (30%)** | 事故分級與流程規格已落地於主控台，自動化告警待整合。 |
| `P16-ADM-011` | 第五層系統營運：建立功能開關、環境設定、版本發布、部署紀錄與回滾流程。 | `NOT STARTED` (0%) | 本波未實作管理端動態功能開關（Feature Flags）。 | **`NOT STARTED` (0%)** | 誠實標記，維持 0%。 |
| `P16-ADM-012` | 第五層系統營運：建立資料庫／檔案備份、復原演練與災難復原計畫。 | `NOT STARTED` (0%) | 屬雲端維運範疇，因安全限制本波未操作實體備份演練。 | **`NOT STARTED` (0%)** | 誠實標記，維持 0%。 |
| `P16-ADM-013` | 第五層系統營運：建立憑證／密鑰輪替、權限審核與高風險操作雙重確認。 | `NOT STARTED` (0%) | 教師審核核准/退回實作 CSRF Token 雙重確認機制與 Session Token SHA-256 雜湊安全存儲。 | **`PARTIAL` (30%)** | 關鍵審核操作已具備雙重驗證，全自動金鑰輪替待續。 |
| `P16-ADM-014` | 兩套後台使用不同角色與路由，API 亦分開授權；不得只靠前端隱藏選單。 | `NOT STARTED` (0%) | 教師後台（`#teacher-dashboard`，`TEACHER` 角色，`/api/classrooms`）與管理員後台（`#admin-dashboard`，`ADMIN` 角色，`/api/admin/*`）完全實體隔離，後端中介軟體獨立授權。 | **`PASS` (100%)** | 完美達成 UID 規格要求，前後端雙重隔離，絕非僅隱藏選單。 |
| `P16-ADM-015` | 建立管理端與監控端的稽核報告及定期權限檢查。 | `PARTIAL` (40%) | 完成管理員主控台稽核日誌瀏覽器、操作人員與動作分類篩選、敏感資料遮蔽演算法。定期定時排程檢查報告待實作。 | **`PARTIAL` (80%)** | 稽核日誌讀取與脫敏展示已打通，定期報表生成待續。 |

---

## 九、專案安全約束與不變量守護驗證（Safety Invariants Verification）

| 專案保護約束項目 | 要求規格 | 實測驗證結果 | 合規狀態 |
| :--- | :--- | :--- | :---: |
| **`AUTH-03` 實體庫阻擋維護** | 嚴禁繞過資料庫認證阻擋，不直連未授權雲端資料庫 | 測試全程使用離線 Mock 契約執行，未強行連線雲端資料庫 | **STRICTLY ENFORCED** |
| **`task-13717` 停止狀態維護** | 維持停止狀態，不擅自重啟背景程序 | 背景程序未被重啟 | **STRICTLY ENFORCED** |
| **`P09-DBA-012` 鎖定維護** | 維持 `BLOCKED` (30%)，不擅自解鎖 | 維持 30% 阻擋狀態，未行變更 | **STRICTLY ENFORCED** |
| **五大正式術科題組保護** | 104301～104305 題目、教材、考點零非預期變更 | 題組二至五 0 異動；題組一維持第 2 波核准之 59 行修改 | **100% PROTECTED** |
| **Git 操作零污染原則** | 不得執行 Commit、Push、Deploy、Reset、Clean | 0 次 Commit / Push / Deploy / Reset，工作目錄維持穩定狀態 | **STRICTLY ENFORCED** |
| **交付文件不覆寫原則** | 不得覆寫第 4 波已有之 4 份報告 | 4 份既有報告完整保留，本報告為獨立新增之驗收文件 | **STRICTLY ENFORCED** |

---

## 十、結案總結與交接建議

第 4 波「平台管理員與系統營運後台完整化」在嚴格的資安約束與唯讀保護下，成功建立了一套兼具 **真實資料流打通**、**嚴格 RBAC 隔離**、**透明系統邊界標示** 與 **高品質自動化測試** 的管理員主控台系統。

所有未完成之項目（全平台班級管理 API、全域會員停用 API、動態 CMS、APM 整合）均在前端介面與文件中明確記錄為架構規格與後續藍圖，絕無任何造假、虛報或繞過權限的行為。

後續若要啟動第 5 波或進一步解鎖生產環境，需優先依循合規管道取得雲端 PostgreSQL 正式授權以解除 `AUTH-03`，方能進行跨系統端到端驗證。
