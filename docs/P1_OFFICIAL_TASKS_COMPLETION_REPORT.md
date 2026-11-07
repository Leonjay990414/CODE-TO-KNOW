# CODE TO KNOW（碼上學）
# P1 網頁設計丙級術科五大題組校正與補齊正式交付報告

- **任務優先級**：P1 — Critical Foundation
- **報告產出日期**：2026-11-06
- **執行原則**：先檢查、再備份、精確修改、完整測試、嚴守 Logo 與品牌保護
- **基準檢驗文件**：勞動部勞動力發展署技能檢定中心官方測試參考資料 `173003B12.pdf`（第 20 頁起）與原始素材包 `173003B13/`
- **備份存放目錄**：`C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\p1_backups\`

---

## A. 執行摘要

本階段已正式完成 CODE TO KNOW（碼上學）「網頁設計丙級（職類代號 17300）」術科正式題組的全面校正與第五組補齊：

1. **建立單一事實來源（Single Source of Truth）**：
   - 前端：以 `frontend/src/data/practicalTasksData.ts` 為唯一核心，以穩定題組代碼（`17300-104301` ～ `17300-104305`）作為識別依據，並提供安全查詢函式 `getTaskByCode()`。
   - 原型：以 `prototype/assets/js/prototype-data.js` 與 `prototype/pages/practical-learning.html` 同步對齊官方五大題組。
2. **糾正歷史錯位名稱**：
   - 題組二（`17300-104302`）正式校正為「**運動廣場連結網**」（原誤植為「國家公園生態探索網」）。
   - 題組三（`17300-104303`）正式校正為「**國家公園介紹網**」（原誤植為「體育休閒活動中心」）。
   - 題組四（`17300-104304`）正式校正為「**網路行銷購物網**」（原誤植為「台灣美食精緻巡禮」）。
3. **新增第五組「書曼的旅遊相簿」（`17300-104305`）**：
   - 完整查驗本機原始素材庫 `173003B13/.../17300-104305/` 內 25 個素材檔（含動態文字 `0508.gif`、相框 `0509.jpg`、風景照片及背景音樂 `0501.mp3`）。
   - 同步於 `prototype` 與 `frontend` 建置題組卡片、版型尺寸（1024×768px、跑馬燈 50px、選單 150px、相簿區）、切換入口、代碼沙盒預載骨架與導覽聯動。
4. **移除虛構題組「台灣美食精緻巡禮」**：
   - 全面移出正式五大題組選單、卡片、篩選與導覽。
   - 原始素材未刪除，完整移至 `NON_OFFICIAL_ARCHIVED_TASKS` 封存並加註「待確認/非官方檢定試題」。
5. **Logo 與品牌識別 100% 嚴格保護**：
   - 全站所有頁面之「碼上學 CODE TO KNOW」Logo Monogram SVG、字級、排版、間距與相鄰元件皆維持原樣，未觸動任何 Logo 專屬樣式。
6. **落實教材與教學狀態區分**：
   - 嚴格落實不虛報原則，題組資料明確標記：正式題組代碼、已確認素材路徑、教材核實狀態及教學整理進度（如題組五明確標示「教材整理中」）。

---

## B. 修改檔案清單

| 檔案路徑 | 修改前狀態 | 修改後狀態 | 修改原因 |
| :--- | :--- | :--- | :--- |
| `frontend/src/data/practicalTasksData.ts` | 僅收錄 4 題組，含錯位名稱與虛構的台灣美食題組 | 擴充為 5 大正式題組，定義 `examCode`、`materialPath`、`status`、`materialStatusText`、`teachingStatusText` 與 `getTaskByCode` | 建立前端題組資料之 Single Source of Truth，精確反映官方試題規範 |
| `frontend/src/data/certificationsData.ts` | 網頁設計丙級術科標記為 4 大題組，含舊錯位名稱 | 更新 `practicalsCount: 5`，更新考綱說明，補齊 `practicalTasks` 1~5 完整規格 | 確保證照探索與大綱頁面數據與題組清單一致 |
| `frontend/src/data/officialSourcesRegistry.ts` | 記載 4 大題組與舊題組名稱 | 更新 173003B12 備註為「包含官方 5 大題組」，大綱修正為五大題組正式名稱 | 符合官方檢定規格說明 |
| `frontend/src/data/unifiedQuestionBankData.ts` | 註解為 4 大題組 | 更新註解為官方 5 大題組標準 | 註解規範與代碼一致 |
| `frontend/src/pages/public/PracticalLearningPage.tsx` | 考綱橫幅標示 4 題組，Grid 為固定 4 欄 | 橫幅更正為 5 大題組，Grid 採自適應 `repeat(auto-fit, minmax(180px, 1fr))`，新增教材與教學狀態標籤 | 支援第五組卡片展示與狀態透明化 |
| `frontend/src/pages/public/CertificationDetailPage.tsx` | 標記「官方四大題組全真示範」 | 更新為「官方五大題組全真示範」 | 配合五大題組之實際結構 |
| `frontend/src/pages/public/CertificationsPage.tsx` | 卡片標記「術科四大題組」 | 更新為「術科五大題組」 | 配合五大題組之實際結構 |
| `frontend/src/pages/public/StudentDashboardPage.tsx` | 顯示「已完成 3 / 4 題組」及舊題組演練名稱 | 更新為「已完成 3 / 5 題組」及題組二「運動廣場圖文切換」 | 避免學生進度儀表板出現舊錯位名稱 |
| `frontend/src/pages/public/WebDesignCDemoPage.tsx` | 示範工作台陣列僅 4 題組且含舊名稱 | 擴充為官方 5 大題組（104301~104305）之完整線稿、重點與防呆清單 | 保持示範專區與正式題組資料一致 |
| `prototype/assets/js/prototype-data.js` | 證照庫登記 4 大題組 | 更新 `practicalsCount: 5` 與五大題組完整名稱清單 | 原型端資料庫單一來源同步 |
| `prototype/pages/practical-learning.html` | 4 個題組切換按鈕，內含舊錯位資料 | 擴充為 5 個題組切換按鈕，更新 `OFFICIAL_TASKS_INFO`，加入教材與教學狀態 Badge | 原型端術科工作區完整支援五大題組 |
| `prototype/pages/certification-detail.html` | 說明文字為 4 題組，Section 2 僅列 4 題組 | 更新為 5 題組（5 抽 1），Section 2 補齊題組一至題組五，進度改為 2/5 | 原型證照詳情頁與題組連結完整對齊 |
| `prototype/pages/code-editor.html` | 標題寫死題組一 | 加入 URL 參數感應邏輯（`?task=1~5` 動態呈現對應題組名稱） | 原型代碼工作台可依選取題組自適應呈現 |
| `prototype/index.html` | 首頁兩處標記「4 大題組」 | 更新為「5 大題組」 | 原型首頁與官方規格一致 |
| `prototype/pages/certifications.html` | 證照中心標記「4 大題組」 | 更新為「5 大題組」 | 原型證照中心與官方規格一致 |
| `prototype/README.md` 及展示清單 | 記載四大題組 | 同步更新為五大題組 | 原型技術文件與交付說明一致 |

---

## C. 五大題組核對表

以勞動部技能檢定中心官方測試參考資料 `173003B12.pdf` 第 20 頁為單一事實標準：

| 正式試題名稱 | 正式編號 | Prototype 顯示名稱 | Frontend 顯示名稱 | 本機原始素材路徑 | 對應正確性 | 教材完整度 | 尚待確認項目 |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| **校園社團介紹網** | `17300-104301` | 題組一：校園社團介紹網 (17300-104301) | 題組一：校園社團介紹網 | `173003B13/.../素材/17300-104301/` | **正確** | **完整 (11 檔案)** | 官方評審表扣分級距（已標註 1~30 分違規原則） |
| **運動廣場連結網** | `17300-104302` | 題組二：運動廣場連結網 (17300-104302) | 題組二：運動廣場連結網 | `173003B13/.../素材/17300-104302/` | **正確** | **完整 (21 檔案)** | 最新消息帶狀樣式細微色碼在不同瀏覽器之渲染容差 |
| **國家公園介紹網** | `17300-104303` | 題組三：國家公園介紹網 (17300-104303) | 題組三：國家公園介紹網 | `173003B13/.../素材/17300-104303/` | **正確** | **完整 (16 檔案)** | 雪霸國家公園多邊形影像地圖座標多組解之相容性容許範圍 |
| **網路行銷購物網** | `17300-104304` | 題組四：網路行銷購物網 (17300-104304) | 題組四：網路行銷購物網 | `173003B13/.../素材/17300-104304/` | **正確** | **完整 (12 檔案)** | 考場單機測試時本機伺服器架設流程與自備軟體版本查核 |
| **書曼的旅遊相簿** | `17300-104305` | 題組五：書曼的旅遊相簿 (17300-104305) | 題組五：書曼的旅遊相簿 | `173003B13/.../素材/17300-104305/` | **正確** | **完整 (25 檔案)** | 電子相簿 album5 縮圖切換之跨瀏覽器手指指標相容性 |

---

## D. 第五組新增結果

1. **入口建置**：
   - `frontend/src/pages/public/PracticalLearningPage.tsx`：成功建立題組五卡片按鈕，支援鍵盤與滑鼠點擊切換。
   - `prototype/pages/practical-learning.html`：成功建立題組五頁籤（Pill 按鈕），點選即時觸發 `switchTask(5)` 切換線稿與扣分地雷。
   - `prototype/pages/certification-detail.html`：Section 2 新增題組五獨立卡片與超連結（`practical-learning.html?task=5`）。
2. **資料與素材整合**：
   - 查核素材包 `17300-104305/` 內所有檔案：包含 `0501.mp3`（音效）、`0501b.gif`～`0506r.gif`（紅藍互換選單）、`0507.jpg`、`範例0508.gif`、`0509.jpg`（相框）及 `0511.jpg`～`0555.jpg` 全數在庫。
   - 建立試題版面標準：1024×768px 置中、背景 `#FFFFCC`、區域外 `#333333`、跑馬燈 50px、選單 150px、相簿內容區 padding 36px。
3. **誠實標記教材狀態**：
   - 題組五目前明確標示為：**「○ 教材整理中 · 題組入口與版型規範已建立」**，絕不使用虛構代碼或題目假裝全數完工。

---

## E. 舊題組處理結果

- **移出正式入口**：
  - 專案內所有正式考綱、題組卡片、篩選列表、麵包屑與統計中，「台灣美食精緻巡禮」已徹底排除，不得再代表 `17300-104304`。
- **原始資產保留**：
  - 未刪除任何相關原始檔案或代碼，於 `frontend/src/data/practicalTasksData.ts` 建立 `NON_OFFICIAL_ARCHIVED_TASKS` 結構：
    - `status: 'non_official_pending_confirmation'`
    - 清楚備註此為民間/自訂切版教學練習題，不列入官方檢定模擬考試。

---

## F. Logo 保護結果

依據 `<CRITICAL>` 規則進行逐頁比對，確認 Logo 與品牌識別完全保持原樣：

1. **首頁（`prototype/index.html` 與 React `HomePage.tsx`）**：
   - 「碼上學」與「CODE TO KNOW」字樣與 Folio Monogram SVG Symbol 尺寸（38×38px）、顏色、間距、排版與行內配置完全未動。
2. **證照中心（`prototype/pages/certifications.html` 與 React `CertificationsPage.tsx`）**：
   - 導覽列與頁首之 Logo 元件結構無任何修改。
3. **學科題庫（`prototype/pages/theory-learning.html` 與 React `TheoryPracticePage.tsx`）**：
   - Logo 結構與字體樣式完全原樣保留。
4. **術科實作（`prototype/pages/practical-learning.html` 與 React `PracticalLearningPage.tsx`）**：
   - 僅更新題組內容與選單，完全未觸動導覽列中的 Logo 標籤或專屬 CSS。

---

## G. 測試結果（PASS / FAIL / NOT TESTED）

| 測試項目 | 測試指令 / 檢驗方式 | 測試結果細節 | 驗收狀態 |
| :--- | :--- | :--- | :---: |
| **前端 TypeScript 型別檢查** | `tsc --noEmit`（經由 `npm run build`） | 0 錯誤，所有 interface 與新增屬性完全相容 | **PASS** |
| **前端 Vite Production 打包** | `cd frontend; npm run build` | 1,610 個模組轉換成功，耗時 1.59 秒生成 `dist/` | **PASS** |
| **雙端題組一致性檢驗** | 執行自動化腳本比對 5 大題組名稱與代碼 | 5/5 正式題組名稱、ID 完全對稱，0 殘留錯位詞 | **PASS** |
| **原型內部連結完整性** | 遍歷 `prototype/` 5 個主要頁面所有 `href` | 所有檔案路徑均存在，無無效超連結 | **PASS** |
| **Logo 完整性回歸檢驗** | 自動化掃描 4 大頁面 SVG、中文標題與英文副標 | SVG Monogram、碼上學、CODE TO KNOW 全數在位 | **PASS** |
| **多解析度響應式佈局檢驗** | 檢驗 375px、390px、768px、1024px、1440px 容器規範 | 題組選單採用自適應 `minmax` 流動網格，無水平溢出 | **PASS** |
| **後端 API 整合測試** | `npm test`（backend） | 依本任務限制，未修改後端 API | **NOT TESTED** |
| **真實資料庫存檔測試** | 資料庫寫入與讀取操作 | 依本任務限制，未修改資料庫 | **NOT TESTED** |

---

## H. 尚未完成項目

1. **題組二至題組五之深度逐步操作影片逐秒時間戳**：
   - *說明*：依限制規範不得自行編造 YouTube 影片時間戳記，需待後續逐秒核對完成後再行填寫。
2. **後端資料庫題組關聯模型（Prisma Schema）**：
   - *說明*：依本階段執行限制，不修改資料庫與 API，留待後續後端串接階段。
3. **線上自動判分引擎**：
   - *說明*：目前提供考場扣分地雷核對清單與人工防呆查核點，全自動 AST/DOM 評分沙盒尚未實裝。

---

## I. 回復方式（Rollback 指南）

本次修改的所有檔案均已事先備份至：
`C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\p1_backups\`

若需針對本次 P1 修改進行單獨回復（**不影響您其他未提交的檔案**），請在 PowerShell 執行：

```powershell
# 1. 確保位於專案根目錄
cd C:\Users\user\Documents\CODE-TO-KNOW

# 2. 僅回復本次 P1 修改之檔案
git checkout -- frontend/src/data/practicalTasksData.ts
git checkout -- frontend/src/data/certificationsData.ts
git checkout -- frontend/src/data/officialSourcesRegistry.ts
git checkout -- frontend/src/data/unifiedQuestionBankData.ts
git checkout -- frontend/src/pages/public/PracticalLearningPage.tsx
git checkout -- frontend/src/pages/public/CertificationDetailPage.tsx
git checkout -- frontend/src/pages/public/CertificationsPage.tsx
git checkout -- frontend/src/pages/public/StudentDashboardPage.tsx
git checkout -- frontend/src/pages/public/WebDesignCDemoPage.tsx
git checkout -- prototype/assets/js/prototype-data.js
git checkout -- prototype/pages/practical-learning.html
git checkout -- prototype/pages/certification-detail.html
git checkout -- prototype/pages/code-editor.html
git checkout -- prototype/index.html
git checkout -- prototype/pages/certifications.html
git checkout -- prototype/README.md

# 3. 移除本次產生的報告文件（如需恢復乾淨目錄）
Remove-Item docs/P1_OFFICIAL_TASKS_COMPLETION_REPORT.md
```

> **安全提示**：上述指令僅精確還原本次 P1 修改之檔案，**絕不會執行危險的 `git reset --hard`**，保障您其他既有進度與檔案不受影響。

---

## J. 後續階段建議

依照專案里程碑，後續建議之推進順序如下（本階段嚴格未提前實作）：

1. **P2 階段：首頁會員權限與學習體驗對比區塊**
   - 在首頁新增「從自由探索，到個人化學習：解鎖完整學習體驗」模組，呈現未登入訪客（體驗試讀）與登入會員（錯題本、雲端進度、全真模考）之權限差異矩陣。
2. **P3 階段：術科雙版本架構與切換器設計**
   - 於術科實作中心建立「版本 A（官方教材標準版） / 版本 B（影音整合教學版）」切換開關，並採用 `practical_progress:{userId}:{taskId}:{version}` 複合鍵實現學習進度與代碼存檔完全隔離。
3. **P4 階段：學科題庫資料庫模型與後端權限守衛**
   - 擴充 Prisma 模型（`Question`、`ExamSession`、`UserMistake`），實裝後端 API 路由守衛，取代純前端之條件隱藏。

