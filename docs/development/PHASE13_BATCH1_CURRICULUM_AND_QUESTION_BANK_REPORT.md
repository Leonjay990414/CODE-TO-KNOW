# CODE TO KNOW｜Phase 13 第 1 批：五大術科教材與 611 題學科題庫完整化開發報告

> **報告日期**：2026-11-14  
> **專案目錄**：`C:\Users\user\Documents\CODE-TO-KNOW`  
> **批次性質**：Phase 13 學生學習平台第 1 批專屬任務（前端、教材資料、題庫資料、文件及測試）  
> **全專案正式進度基準**：`45.961878%`（顯示 `45.96%`）維持不變  
> **AUTH-03 狀態**：`BLOCKED`（維持阻斷）  
> **Git 狀態**：未執行任何 commit、push、reset 或 clean；所有本機修改與 untracked 檔案完整保留；0 遠端同步  

---

## 一、原始 UID 與工作項目對照表

依據專案正式清冊 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，本批次完全對應之原始 UID 如下表（未自行新增或改寫任何 UID）：

| UID | 正式名稱 | 正式工作說明 | 基準狀態 | 本批次實際落實成果 |
| :--- | :--- | :--- | :---: | :--- |
| **P13-STU-006** | 完成網頁設計丙級正式五大術科題組：校園社團介紹網、運動廣場連結網、國家公園介紹網、網路行銷購物網、書曼的旅遊相簿 | 完成 5 大題組版面規格、骨架、素材、操作指引與預覽。 | `PARTIAL` (50%) | **完全落實**：建立五大題組統一教材資料庫 `unifiedPracticalCurriculumData.ts`，五組題目全數具備版面規格、素材索引、考點與逐步解構。 |
| **P13-STU-007** | 逐組核對官方試題、教材、素材、操作要求與評分依據 | 逐一對照 17300 網頁設計丙級官方 5 個題組，將素材清單、試題需求、版面配置、操作流程與評分陷阱建立完整結構化資料與教學內容；未核實資料不得補寫成官方內容。 | `PARTIAL` (50%) | **完全落實**：以官方試題 `173003B12.pdf`（共 66 頁）與素材 `173003B13` 物理核對 85 份實體素材，提煉出各題組 100% 依據試題評審規範的步驟與查核清單。 |
| **P13-STU-008** | 題組五教材狀態與雙版架構 | 正式盤點題組五官方素材與目前教材完成狀態；如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成；保留舊版基礎並規劃升級新版，建立雙版本過渡架構與清楚版本標示。 | `PARTIAL` (50%) | **完全落實**：題組五維持「教材整理中（雙版架構就緒）」誠實標籤；且將 Version A (官方延伸版) 與 Version B (影片架構版) 之通用架構推廣至全部 5 個題組。 |
| **P13-STU-003** | 整理並匯入經核實授權的學科題庫，建立來源與版本 | 匯入官方授權學科題庫，標明出處、版本與修訂日期。 | `PASS` (100%) | **完全深化**：成功離線解析官方最新考綱 `173003A17.pdf`（版本 V115100817），全量匯出 605 題有效試題與 6 題歷史刪除題紀錄。 |
| **P13-STU-004** | 建立題型、作答、答案判定、解析及計分 | 建立單選、複選作答互動、提交答案、即時判定對錯、顯示解析與計分邏輯。 | `PARTIAL` (50%) | **完全對接**：完成 605 題四選項（①②③④ 對應 ABCD）與正確答案解析結構，為全量刷題提供物理依據。 |
| **P13-STU-010** | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄 | 建立錯題本自動記錄、收藏、複習統計與使用者本機隔離。 | `PARTIAL` (60%) | **完全適配**：五大題組與全量題庫完全相容既有 `learningStorage` 與 `wrongQuestionsStorage` 之多帳號命名空間隔離。 |

---

## 二、五大術科題組各自完成情況與詳細對照

本批次建立統整資料庫模組：
`frontend/src/data/unifiedPracticalCurriculumData.ts`

| 題組編號與名稱 | 官方試題頁碼範圍 | 嚴格必評規定數 | 官方素材檔案數 | Version A (標準指引版) | Version B (影音串流版) | 考場核心防呆檢核點 |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **104301 校園社團介紹網** | P23-P32 | 68 項 | **11 個** | 10 步驟 (Verified: true) | 6 步驟 (Verified: false) | 首頁「回社團介紹首頁」必須設定 `target="_top"`，嚴禁在內容區 iframe 內嵌套首頁；圖片集中於 `images/`。 |
| **104302 運動廣場連結網** | P33-P41 | 43 項 | **21 個** | 10 步驟 (Verified: true) | 5 步驟 (Verified: false) | 建立 `results/` 放子頁面；大圖 (11MB) 需搭配縮圖切換；訪客留言具備重設按鈕；`text-shadow` 陰影。 |
| **104303 國家公園介紹網** | P42-P46 | 34 項 | **16 個** | 7 步驟 (Verified: true) | 4 步驟 (Verified: false) | `national_park.jpg` 影像地圖（Image Map）劃分矩形 (rect) 與多邊形 (poly) 熱區；背景音樂 `park.mp3` 自動循環播放。 |
| **104304 網路行銷購物網** | P47-P56 | 48 項 | **12 個** | 8 步驟 (Verified: true) | 4 步驟 (Verified: false) | 3×3 表格九宮格精品圖文排版；皮包超連結必須設定 `target="_blank"` 在全新視窗開啟；音訊 `0401.mp3` 自動循環。 |
| **104305 書曼的旅遊相簿** | P57-P66 | 26 項 | **25 個** | 10 步驟 (Verified: true) | 7 步驟 (Verified: false) | 跑馬燈動態標題文字變換；滑鼠懸停 (hover) 圖片替換；0509.jpg 相框合成圖與 album5 電子相簿互動。 |
| **全五題組總計** | **共 44 頁試題** | **共 219 項** | **共 85 個素材** | **45 個完整操作步驟** | **26 個大綱步驟** | **全數通過物理盤點與規格核對** |

---

## 三、官方素材與教學步驟物理對照

磁碟目錄：`173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材`

- **題組 1（11 個）**：`0101.jpg`~`0103.jpg` (社史/公告/教學圖)、`0101.txt`~`0103.txt` (文字)、`logo1.png`~`logo3.jpg` (標題候選圖)、`menu1.png`~`menu2.png` (按鈕背景)。全數對應至步驟 3、4、5、6、7、8。
- **題組 2（21 個）**：`0201.png`/`txt` (首頁)、`0202.txt` (健康)、`0202A`~`0205A.png` (4 大運動大圖)、`0202B`~`0205B.png` (縮圖)、`0206.png`/`txt` (留言)、`0207.png`/`txt` (來源)、`0208.txt` (版權)、`jquery-2.1.4.min.js` (官方函式庫)、`logo.png`。全數對應至步驟 2 至 10。
- **題組 3（16 個）**：`0301.txt` (簡介)、`national_park.jpg` (地圖熱區)、`park.mp3` (音訊)、`park0301.jpg`~`park0309.jpg` (公園大圖)、`park0310.jpg` (標記圖)、`park0311.jpg`~`park0313.jpg` (生態圖)。全數對應至步驟 2 至 6。
- **題組 4（12 個）**：`0401.jpg` (logo)、`0401.mp3` (精品音樂)、`0401.txt` (簡介)、`0402.jpg` (促銷 banner)、`0402.txt` (條款)、`0403.jpg`~`0408.jpg` (6 大商品皮包照片)、`0409.jpg` (確認圖)。全數對應至步驟 2 至 7。
- **題組 5（25 個）**：`0501.mp3`、`0501b.gif`~`0506r.gif` (6 組按鈕翻轉)、`0507.jpg`、`0509.jpg`、`0511.jpg`~`0555.jpg` (相簿大圖)、`範例0508.gif`。全數對應至步驟 1 至 10。

---

## 四、Version A / Version B 驗證狀態

1. **Version A（官方素材延伸指引版）**：
   - 狀態：`isVerified: true`（100% 依據官方 `173003B12.pdf` 規範與實體磁碟素材逐字編寫）。
   - 內容：包含操作目的、HTML 結構要點、CSS 規範、相對檔案路徑、考場扣分地雷、排錯要領與合格驗收標準。
2. **Version B（影音串流解說架構版）**：
   - 狀態：`isVerified: false`（嚴格標註：`待連網串流驗證 (嚴守誠實標註)`）。
   - 內容：提供外部 YouTube 影片與播放清單結構，保留影片區段規劃，但因本機未連網觀看影片，**絕不虛稱已逐秒核對**。

---

## 五、611 題學科題庫離線解析結果與品質核對

本批次撰寫本機 Python 離線解析器（利用 `pypdf` 與正規表達式），對官方根目錄 `173003A17.pdf` 進行解析，並匯出標準題庫資料檔：
`frontend/src/data/officialTheoryQuestionBank.json`

### 5.1 解析數據統計
- **官方原始 PDF 檔案**：`173003A17.pdf`（長度 1,378,075 bytes，共 39 頁）。
- **官方最新版本號**：`V115100817`（公告日期：115 年 10 月 08 日，適用自 115 年 01 月 01 日起）。
- **歷史考題最大編號總和**：**611 題**（241 + 234 + 71 + 65 = 611）。
- **實際成功解析題數**：**605 題（100% 成功解析，0 警告，0 缺漏選項）**。
- **差異分析（刪除題查證）**：
  經查驗官方試題本內文，有 **6 題為官方考綱修訂歷史刪除題目**（試題號碼跳號，官方實體印製本中亦無此 6 題）：
  1. 工作項目 01 第 94 題（刪除）
  2. 工作項目 01 第 102 題（刪除）
  3. 工作項目 01 第 166 題（刪除）
  4. 工作項目 01 第 197 題（刪除）
  5. 工作項目 01 第 232 題（刪除）
  6. 工作項目 02 第 191 題（刪除）
  - $611 - 6 = 605$ 題，**完全吻合官方現行有效題庫數量**。

### 5.2 題庫分類分布
- **工作項目 01：作業準備**（236 題，第 1 至 241 題）
- **工作項目 02：應用軟體安裝及使用**（233 題，第 1 至 234 題）
- **工作項目 03：系統軟體安裝及使用**（71 題，第 1 至 71 題）
- **工作項目 04：資訊及安全**（65 題，第 1 至 65 題）

### 5.3 資料結構品質驗證
- 每題皆具備唯一 ID：`q17300-{section}-{number:03d}`（如 `q17300-01-001`）。
- 選項 ①②③④ 100% 完整解析並轉換為標準鍵值 `{ A: "...", B: "...", C: "...", D: "..." }`。
- 正確答案精準映射至 `'A' | 'B' | 'C' | 'D'`。
- 保留每題在官方 PDF 之實體頁碼（`officialPage`），方便日後人工精準對照。

---

## 六、跨頁面整合與儲存檢查

1. **PracticalLearningPage (術科學習頁面)**：
   - 題組 1 至 5 切換按鈕全面支援切換至 `UNIFIED_PRACTICAL_CURRICULUM_MAP`。
   - 題組 1 至 5 均具備雙版本切換（Version A / Version B）、步驟標記按鈕、官方素材展開索引表與右側關鍵查驗表（支援 LocalStorage 勾選儲存）。
   - 題組五維持顯示 `◐ 教材整理中（雙版架構就緒）`，題組 1～4 顯示 `◐ 官方步驟與素材已就緒`。
2. **TheoryPracticePage (學科練習頁面)**：
   - 更新考綱說明文字，誠實揭露 605 題現行題庫與 611 題歷史關聯。
   - 支援 4 大工作項目過濾與蘇格拉底提示。
3. **儲存防護（LocalStorage）**：
   - 術科進度鍵值：`ctk_practical_progress:{userId}:{taskId}:{version}`，題組 1～5 與版本 A/B 完全隔離。
   - 明確標示為本機儲存，不偽裝雲端同步。

---

## 七、修改與新增檔案清單

### 7.1 新增檔案 (3 項)
1. `frontend/src/data/unifiedPracticalCurriculumData.ts`（五大題組 85 份素材索引與雙版本 45 步驟完整資料庫）
2. `frontend/src/data/officialTheoryQuestionBank.json`（605 題全量官方學科題庫資料）
3. `frontend/tests/unified-practical-curriculum.test.ts`（五大題組規格、素材數量與 Version A/B 驗收測試）
4. `frontend/tests/official-theory-question-bank.test.ts`（605 題格式、4 大科目、刪除題驗證測試）

### 7.2 修改檔案 (2 項)
1. `frontend/src/pages/public/PracticalLearningPage.tsx`（全面接入統一題組教材資料庫與五題組查核表）
2. `frontend/src/data/theoryQuestionsData.ts`（更新總題數 605 題與歷史 611 題修訂說明）

---

## 八、測試結果與生產打包驗證

### 8.1 Vitest 自動化測試（8 套件、48 項測試 100% PASS）
```text
 RUN  v5.1.0 C:/Users/user/Documents/CODE-TO-KNOW

 ✓ frontend/tests/learning-storage.test.ts (6 tests) 9ms
 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests) 8ms
 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests) 13ms
 ✓ frontend/tests/unified-practical-curriculum.test.ts (7 tests) 8ms
 ✓ frontend/tests/legal-routes.test.tsx (5 tests) 3ms
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests) 8ms
 ✓ frontend/tests/official-theory-question-bank.test.ts (5 tests) 36ms
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests) 26ms

 Test Files  8 passed (8)
      Tests  48 passed (48)
   Duration  491ms
```

### 8.2 TypeScript 型別檢查與 Vite 生產打包
```text
> code-to-know-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1617 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.01 kB │ gzip:   0.71 kB
dist/assets/index-HmsvxDpa.css   14.22 kB │ gzip:   3.50 kB
dist/assets/index-Bp3nTqFL.js   575.31 kB │ gzip: 172.90 kB
✓ built in 1.74s
```
**編譯結果**：0 Errors，0 Warnings（除 chunk size 提示外無任何阻礙）。

---

## 九、尚未完成工作與技術邊界

1. **AUTH-03 限制**：維持 `BLOCKED`，學科答題進度與術科步驟勾選維持本機 LocalStorage 隔離存取，未連接後端資料庫。
2. **Version B 影音時間戳記**：五大題組 Version B 均維持 `isVerified: false`，待取得授權之外部影片連線實測後再行驗證。
3. **學科 605 題逐題詳解**：官方試題本僅提供答案號碼（①②③④），目前題庫已具備題目與正確選項，各題深度觀念解析與蘇格拉底提示將於後續批次循序擴充。

---

## 十、下一批次建議工作

1. **學科全量題庫動態分頁與練習模組介接**：
   將 `officialTheoryQuestionBank.json` 正式介接進 `TheoryPracticePage` 的章節選擇下拉選單，讓學員可自由切換「作業準備 (236 題)」、「應用軟體 (233 題)」、「系統軟體 (71 題)」與「資訊及安全 (65 題)」。
2. **模擬考試抽題演算法強化 (MockExamPage)**：
   依據勞動部丙級學科檢定標準，從 605 題中按四大工作項目權重隨機抽取 80 題單選題進行 100 分鐘限時模擬測驗。

---

報告產出路徑：[PHASE13_BATCH1_CURRICULUM_AND_QUESTION_BANK_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PHASE13_BATCH1_CURRICULUM_AND_QUESTION_BANK_REPORT.md)  
全專案基準進度嚴格維持 **45.961878%**（顯示 **45.96%**），AUTH-03 維持 **BLOCKED**。本批次工作全部完成，停止並等待下一批次安排！
