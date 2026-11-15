# 碼上學｜CODE TO KNOW
# 第 3 波最終針對性驗收報告（Phase 3 Final Targeted Verification Report）

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**執行波次：** 第 3 波（教師管理平台完整化）最終針對性驗收  
**對應核心階段：** P15（教師教學平台與班級管理）  
**關聯階段：** P07、P09、P10、P11、P16  
**Git HEAD 基準：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**分支：** `main`  
**驗收日期：** 2026-11-15  
**最終判定：** **CONDITIONAL PASS（條件通過）**

---

## 一、嚴格保護規則與限制遵循狀況

本報告嚴格依據真實原始碼、測試執行輸出及 Git 狀態進行客觀核對：
1. **優先採唯讀檢查**：僅針對使用者指出的「公告真實性」、「統計口徑」與「605 題題庫檢視」進行最小範圍已授權之前端介面正名與配接修正。
2. **零後端與資料庫改動**：未修改 Prisma Schema、Migration、SQL、後端 API 路由、Controller、Service、Middleware 或環境變數。
3. **五大正式術科題組絕對保護**：未修改 104301～104305 題組之題目、教材、步驟、答案、評分及檢核條件；`unifiedPracticalCurriculumData.ts` 既有 59 行修改維持原樣（42 新增，17 刪除）。
4. **Git 操作零破壞**：未執行 `commit`、`push`、`deploy`、`reset`、`clean` 或 `restore`。
5. **嚴格禁止啟動第 4 波**：管理員後台程式碼處於完全凍結狀態，未執行任何第 4 波開發工作。

---

## 二、第一項核對：班級公告真實性核對

### 1. 唯讀檢查結果
- **儲存位置**：僅存在於瀏覽器本機 LocalStorage，金鑰為 `ctk_teacher_announcements:${userId}`。
- **存取邊界**：僅限當前瀏覽器、當前登入之使用者 ID 才能讀取。跨裝置、跨瀏覽器或隱身模式下無法同步。
- **學生端能見度**：**學生端目前無法取得該公告**。因為後端目前尚未實作班級公告資料庫模型與雲端廣播 API（`/api/classrooms/:id/announcements`），前端亦無將其傳遞至雲端之 API 呼叫。
- **公告發布數本質**：儀表板卡片所呈現之數字純粹為本機 LocalStorage 中的陣列長度（`announcements.length`），非雲端正式發布總數。

### 2. 程式碼證據
```typescript
// frontend/src/pages/public/TeacherDashboardPage.tsx (行 104-110)
const ANNOUNCEMENTS_KEY = `ctk_teacher_announcements:${userId}`;
const [announcements, setAnnouncements] = useState<Array<{ id: string; title: string; content: string; date: string }>>(() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(ANNOUNCEMENTS_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return [...];
});
```

### 3. 已完成之最小範圍正名修正
為貫徹專案誠實原則，避免教師與評鑑者誤認本機儲存為正式雲端發布，已實施以下正名：
1. **儀表板卡片正名**：由「教學公告備忘 / 班級佈告欄發布數」改為 **「教學備忘草稿 / 本機草稿與備忘統計」**（單位：則）。
2. **標籤頁按鈕正名**：由「班級公告與備忘」改為 **「教學備忘與草稿 ({count} 則)」**。
3. **介面顯著提示橫幅**：在公告區頂部新增黃色警告橫幅：
   > **【本機備忘與草稿功能提示】** 目前公告僅儲存於當前瀏覽器本機（LocalStorage），供教師個人備課與記錄備忘，學生端尚未能直接同步讀取。全校/班級雲端公告推播功能將於後續波次對接後端 API。
4. **送出按鈕正名**：由「儲存並發布公告」正名為 **「儲存本機備忘草稿」**。
5. **反饋文字正名**：儲存後提示「✓ 教學備忘已儲存為本機草稿（尚未連線雲端公告廣播服務）」。

---

## 三、第二項核對：教師儀表板統計口徑核對

### 1. 四個統計卡片資料來源與口徑判定

| 統計卡片標籤 | 原始標籤與說明 | 實際資料來源 | 是否為真實資料 | 重複計算/寫死判定 | 修正後標籤與口徑規範 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **已建立教學班級** | 已建立教學班級（班） | `classrooms.length` | **真實 API** (`GET /api/classrooms/my-teaching`) | 無重複，真實反映當前教師後端建置班級數 | 維持 **「已建立教學班級」**（班） |
| **指導學員總數** | 指導學員總數（人）<br>全班級加入學員加總 | `classrooms.reduce((s, c) => s + (c.memberCount \|\| 0), 0)` | **真實 API 累加** | **存在重複計算可能**：若同一學生加入教師旗下 2 個班級，會被重複累計 2 次，本質為「修課人次」而非「獨立學生人數」 | 正名為 **「指導修課人次」**（人次）<br>說明：*全班級加入學員累計人次（非獨立人數）* |
| **輔導證照項目** | 輔導證照項目：17300<br>網頁設計丙級技術士 | 靜態常數 `"17300"` | **系統預設值** | **固定寫死**：專案目前核心為 17300 網頁設計丙級，後端尚未建構多職類動態教師專長綁定 | 正名說明為 **「預設輔導職類（網頁設計丙級）」** |
| **教學備忘草稿** | 教學公告備忘（則）<br>班級佈告欄發布數 | `announcements.length` | **本機 LocalStorage** | **非平台統計**，純屬個人本機備忘筆數 | 正名為 **「教學備忘草稿」**（則）<br>說明：*本機草稿與備忘統計* |

### 2. 程式碼證據
```typescript
// frontend/src/pages/public/TeacherDashboardPage.tsx (行 570-602)
<div className="stats-row">
  <StatCard
    label="已建立教學班級"
    value={String(classrooms.length)}
    unit="班"
    icon={School}
    iconColor="var(--color-brand-deep-slate)"
    subText="教學班級即時統計"
  />
  <StatCard
    label="指導修課人次"
    value={String(totalStudentsCount)}
    unit="人次"
    icon={Users}
    iconColor="var(--color-brand-gold)"
    subText="全班級加入學員累計人次（非獨立人數）"
  />
  <StatCard
    label="輔導證照項目"
    value="17300"
    subText="預設輔導職類（網頁設計丙級）"
    icon={Award}
    iconColor="#2E7D32"
  />
  <StatCard
    label="教學備忘草稿"
    value={String(announcements.length)}
    unit="則"
    icon={Bell}
    iconColor="var(--color-brand-deep-slate)"
    subText="本機草稿與備忘統計"
  />
</div>
```

---

## 四、第三項核對：官方題庫數量與 605 題 vs 611 題差異原因

### 1. 唯讀比對與權威依據
經查核專案資料庫 `frontend/src/data/officialTheoryQuestionBank.json` 與測試檔案 `frontend/tests/official-theory-question-bank.test.ts`：
- **官方依據文件**：勞動部勞動力發展署技能檢定中心公告之現行測試參考資料 **`173003A17.pdf`**（版本：`V115100817`）。
- **卷面歷年最高題號（`historicalMaxQuestionNumber`）**：**611 號**。
- **官方公告廢除/刪除試題（`officialDeletedQuestions`）**：**共 6 題**。
  - 工作項目 01（作業準備）：第 94 題、第 102 題、第 166 題、第 197 題、第 232 題（共 5 題官方註記刪除）。
  - 工作項目 02（應用軟體安裝及使用）：第 191 題（共 1 題官方註記刪除）。
  - 工作項目 03（系統軟體安裝及使用）：0 題刪除。
  - 工作項目 04（資訊及安全）：0 題刪除。
- **現行有效試題總數（`totalOfficialActiveQuestions`）**：**精確為 605 題**。
  - 工作項目 01（作業準備）：236 題（題號最大至 241，扣除 5 題刪除 = 236 題）。
  - 工作項目 02（應用軟體安裝及使用）：233 題（題號最大至 234，扣除 1 題刪除 = 233 題）。
  - 工作項目 03（系統軟體安裝及使用）：71 題。
  - 工作項目 04（資訊及安全）：65 題。
  - **總和：$236 + 233 + 71 + 65 = 605$ 題**（加計 6 題刪除題剛好為卷面題號 611）。

### 2. 教師頁面問題發現與最小修正
- **問題發現**：舊版 `TeacherDashboardPage.tsx` 在 Tab 3 按鈕上標註「學科 605 題題庫檢視」，但底層程式碼卻引用了 `UNIFIED_QUESTION_BANK`（僅包含 9 道多職類範例題），導致教師端只能看到 9 題！
- **最小範圍修正**：
  - 將引入來源改為 `frontend/src/data/questionBankAdapter.ts` 產出之 **`ALL_OFFICIAL_THEORY_QUESTIONS`**（完整包含 605 題結構化資料）。
  - 下拉選單改為清楚標註四大工作項目之題數分配（01: 236題、02: 233題、03: 71題、04: 65題）。
  - 支援關鍵字搜尋題目、解析與官方題號。
  - 修正後，教師在後台可真實、完整檢視全部 605 題官方學科題目，與學生端刷題模式數據 100% 吻合！

---

## 五、第四項核對：測試可信度與測試分類統計

### 1. 最終成功執行命令與輸出統計

#### 前端測試套件
- **執行命令**：`powershell -Command "cd frontend; npx vitest run tests"`
- **執行結果**：
  - **測試檔案總數**：**26 個檔案**
  - **測試通過檔案**：**26 個（100% PASS）**
  - **測試案例總數**：**230 項測試**
  - **PASS**：**230 項**
  - **FAIL**：**0 項**
  - **SKIP**：**0 項**
  - **未執行**：**0 項**
  - **執行耗時**：1.13 秒
- **前端建置**：`npm --prefix frontend run build`（`tsc && vite build`）耗時 2.14 秒，**0 TS 錯誤，0 建置錯誤**。

#### 後端測試套件
- **執行命令**：`powershell -Command "cd backend; npm run test:offline"`（依據專案安全規則排除 `.db.test.ts`，防止在資料庫未授權時誤連正式庫）
- **執行結果**：
  - **測試檔案總數**：**16 個檔案**
  - **測試通過檔案**：**16 個（100% PASS）**
  - **測試案例總數**：**215 項測試**
  - **PASS**：**215 項**
  - **FAIL**：**0 項**
  - **SKIP**：**0 項**
  - **未執行**：**0 項**
  - **執行耗時**：1.67 秒
- **後端建置**：`npm --prefix backend run build`（`tsc`）完成，**0 錯誤**。

### 2. 測試層級分類標示（嚴禁將非端到端測試誤稱為 E2E）

| 測試層級 | 檔案清單與測試範圍 | 說明與邊界 |
| :--- | :--- | :--- |
| **單元測試 (Unit Tests)** | • `join-code.test.ts` (17)<br>• `validation.test.ts` (12)<br>• `email-templates.test.ts` (8)<br>• `db-config-safety.test.ts` (69)<br>• `safe-error-logger.test.ts` (19)<br>• `audit-redaction.test.ts` (10)<br>• `learning-storage.test.ts` (6)<br>• `wrong-questions-storage.test.ts` (6)<br>• `account-storage-isolation.test.ts` (11)<br>• `official-theory-question-bank.test.ts` (5) | 驗證演算法、資料模型轉換、毀損資料容錯、儲存層隔離與常數定義，無外部依賴。 |
| **元件與路由測試 (Component & Route Tests)** | • `admin-dashboard.test.tsx` (8)<br>• `teacher-dashboard-classroom.test.tsx` (9)<br>• `student-class-join.test.ts` (7)<br>• `legal-routes.test.tsx` (5)<br>• `a11y-keyboard-navigation.test.tsx` (4)<br>• `sources-route-protection.test.tsx` (7) | 驗證 React 元件渲染、Hash 路由解析、無障礙聚焦狀態與 RBAC 身分防護（TEACHER / ADMIN）。 |
| **離線整合與契約測試 (Contract Integration Tests)** | • `classroom-routes.test.ts` (11)<br>• `classroom-permission.test.ts` (8)<br>• `rbac-workflow.test.ts` (17)<br>• `idor-ownership.test.ts` (7)<br>• `security.test.ts` (5)<br>• `api.test.ts` (5) | 透過 Supertest 針對 Express App 路由發起模擬 HTTP 請求，驗證權限攔截、CSRF 檢查與輸入校驗。 |
| **真正端到端 (Live E2E Tests)** | **本波未執行** | 因正式資料庫處於 `AUTH-03` 阻擋狀態，未啟動包含真實瀏覽器與實體雲端資料庫之端到端測試。本波報告嚴格杜絕使用假 E2E 字眼。 |

### 3. 前次執行 Exit 1 之根本原因與修復驗證
- **原因診斷**：前端單元測試環境（Node.js / Vitest）未啟動真實 HTTP 伺服器。在初版 `teacher-dashboard-classroom.test.tsx` 中呼叫 `classroomApi.getMyTeachingClassrooms()` 時，底層 `fetch()` 直連 `http://localhost:4000/api` 導致連線逾時（5000ms Timeout）。隨後在加入 Mock 時，未考慮 `POST` 與 `DELETE` 請求會先發送 `/auth/csrf-token` 交換金鑰，導致呼叫順序索引偏移。
- **修復驗證**：在測試中以 URL 匹配模式正確攔截 `/auth/csrf-token` 與各 `/classrooms` 路由，完全契合後端 REST 契約規範，9 項測試全數在 14ms 內瞬時 PASS，無任何逾時或假陽性。

---

## 六、第五項核對：Git 狀態與五大術科題組保護查核

### 1. Git 基準存證
- **Git HEAD**：`c44ea7929f39ef469f380027c2fd3143726d9922`（精確吻合第 1、2、3 波基準）。
- **Branch**：`main`。
- **未提交之破壞性操作**：**0 Commit、0 Push、0 Deploy、0 Reset、0 Clean、0 Restore**。

### 2. 五大正式術科題組保護查核
- 查驗 `git diff --stat frontend/src/data/unifiedPracticalCurriculumData.ts`：
  ```text
  frontend/src/data/unifiedPracticalCurriculumData.ts | 59 +++++++++++++++-------
  1 file changed, 42 insertions(+), 17 deletions(-)
  ```
  **結果**：該檔案精確維持原始 59 行修改（為第 1 波題組一檢核清單與跑馬燈比對紀錄），**未被更動或覆蓋**。
- 五大題組題目、教材、步驟、標準答案、檢核條件與評分標準：**0 異動**。

---

## 七、最終驗收結論與判定

### 1. 問題修正總結清單
1. ✅ **公告真實性正名**：完成。已全面正名為「本機教學備忘草稿」，加註學生端未連通警示，移除任何誤導為正式發布之字眼。
2. ✅ **統計口徑修正**：完成。學員數正名為「指導修課人次（累計人次）」，輔導職類標註「預設職類 17300」，公告數正名為「本機草稿與備忘統計」。
3. ✅ **官方題庫完整串接**：完成。底層成功介接 `ALL_OFFICIAL_THEORY_QUESTIONS`，使教師端能夠檢索全量 605 題官方有效試題。
4. ✅ **605 題 vs 611 題來源釐清**：完成。確認 611 題為卷面最高題號，其中 6 題已被官方廢止刪除，現行有效題庫精確為 605 題。
5. ✅ **測試可信度釐清**：完成。確認前後端共 445 項測試（前端 230、後端 215）100% 通過，0 FAIL、0 SKIP，且明確區分單元、元件與整合測試，絕不冒稱真實 E2E。

### 2. 最終結案判定：CONDITIONAL PASS（條件通過）
- **判定理由**：第 3 波所屬之教師端管理介面、班級 API 介接、學員名冊安全控制、題庫備課檢視與統計口徑已全數達到最高標準之真實性與透明度。
- **保持 CONDITIONAL 之限制條件**：
  - `AUTH-03` 維持 **BLOCKED**。
  - `task-13717` 維持 **STOPPED**。
  - `P09-DBA-012` 維持 **BLOCKED (30%)**。
  - 全站 20 階段 226 個 UID 加權完成率維持官方基準 **45.961878%（45.9620%）**。
  - 待正式生產環境資料庫解鎖連線後，方可進行端到端連線並轉為 FULL PASS。

### 3. 當前狀態
本波針對性核對與最小修正工作已全數完成，**嚴禁自行開始第 4 波（平台管理員與系統營運後台）之開發**，處於等待指示狀態。
