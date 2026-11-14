# CODE TO KNOW｜Phase 13 學生學習平台 30 分鐘連續開發報告

- **報告日期**：2026-11-13
- **所屬階段**：Phase 13｜學生學習平台開發
- **依據清冊**：第五輪 20 階段 226 項 canonical UID 工作清冊（`docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`）
- **正式整體進度基準**：**45.961878%（45.96%）**（嚴格維持，未經正式驗收與清冊更新程序，不宣稱整體進度已增加）
- **AUTH-03 狀態**：**`BLOCKED`**（維持隔離，未執行任何資料庫還原或遠端連線）
- **Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`（工作目錄修改安全保護）

---

## 1. 本次執行 UID 清單與原始狀態

| UID | 正式工作說明重點 | 原始狀態 | 本次完成程度 |
| :--- | :--- | :---: | :---: |
| `P13-STU-007` | 逐組核對官方試題、教材、素材、操作要求與評分依據；未核實資料不得補寫成官方內容。 | `PARTIAL` (50%) | **85%**（題組五 25 份官方素材已全量核驗索引並落實教學解構） |
| `P13-STU-008` | 目前第五題組如仍標示 in_preparation，應維持教材整理中，不得假裝完整教學已完成。 | `PARTIAL` (50%) | **85%**（建立 Version A 官方延伸版與 Version B 影片實戰版雙軌架構） |
| `P13-STU-004` | 建立題型、作答、答案判定、解析及計分。 | `PARTIAL` (50%) | **80%**（學科作答回饋、4階 AI 提示、作答計分與錯題自動收錄已打通） |
| `P13-STU-010` | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄。 | `PARTIAL` (60%) | **85%**（完成 LocalStorage 錯題本、累計次數、答對標記掌握與複習模式） |

---

## 2. 每個 UID 的實際完成內容

### 2.1 `P13-STU-007` & `P13-STU-008`：題組五「書曼的旅遊相簿 (104305)」教材與素材核實
1. **25 份官方素材全量索引**：
   - 經對比磁碟 `173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104305`，25 個檔案全數核實驗證其大小、副檔名與用途，建立於 `task5CurriculumData.ts`。
   - 包含背景音樂（`0501.mp3`）、選單按鈕雙色切換（`0501b.gif`~`0506r.gif` 共 12 檔）、書曼生活照片（`0507.jpg`）、相框（`0509.jpg`）、景點照片（`0511.jpg`~`0541.jpg` 共 4 檔）、相簿原圖（`0551.jpg`~`0555.jpg` 共 5 檔）及官方動態標題範例（`範例0508.gif`）。
2. **Version A（官方素材延伸版）教學解構**：
   - 完成 10 個核心實作步驟（版面置中、跑馬燈、背景音樂、選單佈局、按鈕翻轉、維護資訊、內容 iframe 框架、album5 電子相簿、相框合成 0510a.gif、考場防呆）。
   - 每一步驟皆包含「操作目的」、「HTML 結構」、「CSS 規範」、「檔案路徑」、「考場陷阱」、「排錯要領」、「合格驗收標準」與「關聯素材標籤」。
   - 提供 10 項官方評分關鍵自我查核表，支援本機互動式核取。
3. **Version B（影片實戰解析版）影音學習架構**：
   - 整合官方推薦播放清單 (`PLvb3m203I-S9Taljh638W8AddxiHS9h1D`) 與參考影片 (`TZ5EJatWres`)。
   - 誠實標示為「影片示範架構（待連網串流驗證）」，絕不宣稱未經檢驗之串流內容，提供 7 大章節實務拆解與查核清單。

### 2.2 `P13-STU-004` & `P13-STU-010`：學科本機自我測驗與錯題本系統
1. **作答回饋與答案判定**：
   - 送出答案後即時判定對錯、展示綠/紅反饋標籤、顯示官方標準試題解析。
   - 整合四階認知鷹架（觀念聚焦、思考破題、邊界提點、完整解構）點擊展開探討。
2. **本機錯題本（LocalStorage）**：
   - 答錯時自動收錄題目、題幹、各選項文字、使用者誤選答案、正確解答與詳解。
   - 若重複答錯同一題，自動累計 `wrongCount`（錯誤次數）。
   - 若使用者在後續練習中重新答對該題，系統自動將該題標註為 `resolved: true`（已攻克掌握），實現動態學習進度流轉。
3. **錯題複習專屬模式**：
   - 於學科頁面右上角提供「我的錯題本」切換入口，點選即可查看當前待攻克題數。
   - 支援依最新錯誤時間排序、查看過往誤選與正確解析、單題移除與全部清空功能。
4. **學習儀表板數據同步**：
   - 於 `LearningProgressPage.tsx` 串接本機錯題本統計，即時顯示累計收錄題數、已攻克題數與待攻克清單。

---

## 3. 教材 Version A 完成情況
- **版本識別**：`A`（`VERSION_A_CURRICULUM`）
- **核實狀態**：`isVerified: true`（已完整對照 173003B12 規範書與本機 25 份素材）
- **步驟數量**：10 步驟
- **自我查核表**：10 項完整查驗點
- **互動支援**：支援步驟完成點選、查核表勾選、本機 LocalStorage 進度儲存與一鍵重設。

---

## 4. 教材 Version B 完成情況
- **版本識別**：`B`（`VERSION_B_CURRICULUM`）
- **核實狀態**：`isVerified: false`（誠實標註影片示範架構，待連網串流驗證）
- **播放清單來源**：`https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D`
- **參考解題影音**：`https://www.youtube.com/watch?v=TZ5EJatWres`
- **步驟數量**：7 個實戰拆解章節
- **自我查核表**：5 項考場實操節奏查驗點

---

## 5. 官方素材核對結果（17300-104305 題組五）

| 類別 | 檔案清單 | 數量 | 狀態 | 用途 |
| :--- | :--- | :---: | :---: | :--- |
| **背景音樂** | `0501.mp3` | 1 | 存在 (474 KB) | 網站背景音樂，自動循環播放 |
| **選單按鈕圖標** | `0501b.gif`~`0506b.gif`, `0501r.gif`~`0506r.gif` | 12 | 存在 (約 2.5 KB/檔) | 金門/馬祖/澎湖/綠島/蘭嶼/回首頁之藍紅 hover 切換 |
| **人物照片** | `0507.jpg` | 1 | 存在 (42 KB) | 書曼個人生活照片 |
| **相框素材** | `0509.jpg` | 1 | 存在 (13 KB) | 景點相框底圖，用於 0510a.gif 合成 |
| **景點代表照片** | `0511.jpg`, `0521.jpg`, `0531.jpg`, `0541.jpg` | 4 | 存在 (27~116 KB) | 各景點縮圖與合成素材 |
| **相簿原圖** | `0551.jpg`~`0555.jpg` | 5 | 存在 (34~73 KB) | album5 電子相簿大圖與縮圖切換來源 |
| **動態文字範例** | `範例0508.gif` | 1 | 存在 (5.5 KB) | 書曼的旅遊相簿動態變色輪播標題範例 |
| **總計** | **全量素材清單** | **25 檔** | **100% 存在** | **無缺少任何官方檔案** |

---

## 6. 本機進度儲存設計（`learningStorage.ts`）
- **儲存前綴與鍵值格式**：`ctk_practical_progress:{userId}:{taskId}:{version}`
- **架構版本控制**：`schemaVersion: 1`
- **版本隔離機制**：Version A 與 Version B 儲存於完全獨立的鍵值中，兩者勾選進度互不覆蓋、互不污染。
- **安全防護**：全模組採用 `try/catch` 封裝，遭遇損毀的 JSON 字串時自動降級返回預設安全資料，絕不造成頁面崩潰白屏。

---

## 7. 錯題本與自我測驗功能（`wrongQuestionsStorage.ts`）
- **儲存前綴與鍵值格式**：`ctk_wrong_questions:{userId}`
- **架構版本控制**：`schemaVersion: 1`
- **累加與去重機制**：同一題目多次答錯僅累加 `wrongCount`，不產生重複記錄；重新答對自動標記 `resolved: true`。
- **UI 整合**：學科頁籤切換、即時作答統計、艾賓浩斯推播及個人歷程儀表板數據同步。

---

## 8. 修改檔案清單

### 8.1 新增檔案
- [frontend/src/data/task5CurriculumData.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/data/task5CurriculumData.ts)（題組五教材解構、雙版本資料庫與 25 份素材索引）
- [frontend/src/utils/learningStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/learningStorage.ts)（術科本機進度與雙版本隔離儲存模組）
- [frontend/src/utils/wrongQuestionsStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/wrongQuestionsStorage.ts)（學科本機錯題本與答對攻克標記管理模組）
- [frontend/tests/practical-task5-curriculum.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/practical-task5-curriculum.test.ts)（題組五教材與 25 素材測試）
- [frontend/tests/learning-storage.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/learning-storage.test.ts)（學習進度儲存與版本隔離測試）
- [frontend/tests/wrong-questions-storage.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/wrong-questions-storage.test.ts)（錯題本去重與狀態流轉測試）

### 8.2 修改檔案
- [frontend/src/data/practicalTasksData.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/data/practicalTasksData.ts)（更新題組五教學狀態為雙版本就緒）
- [frontend/src/pages/public/PracticalLearningPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/PracticalLearningPage.tsx)（加入 Version A/B 切換、步驟學習、素材索引與查核表互動）
- [frontend/src/pages/public/TheoryPracticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TheoryPracticePage.tsx)（打通作答判定、錯題自動收錄與錯題本複習視圖）
- [frontend/src/pages/public/LearningProgressPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/LearningProgressPage.tsx)（串接本機錯題統計與修正文字）

---

## 9. 測試清單與執行結果

| 測試檔名 | 測試項目描述 | 結果 |
| :--- | :--- | :---: |
| `practical-task5-curriculum.test.ts` | 題組五代碼、25 份素材清單、Version A 10 步驟與 Version B 影音架構 | **5/5 PASS** |
| `learning-storage.test.ts` | 鍵值格式、Version A/B 獨立隔離、步驟與查核表切換、JSON 容錯、重設 | **6/6 PASS** |
| `wrong-questions-storage.test.ts` | 答錯收錄、累計次數、答對攻克 (resolved)、單題刪除、清空、JSON 容錯 | **6/6 PASS** |
| `legal-routes.test.tsx` | 法律頁籤與深層雜湊解析測試（回歸驗證） | **5/5 PASS** |
| `sources-route-protection.test.tsx` | 題庫匯入來源頁面路由權限防護（回歸驗證） | **7/7 PASS** |
| **總計** | **全量自動化單元與整合測試** | **29/29 PASS (100%)** |

---

## 10. TypeScript 與 Vite 建置結果
- **執行指令**：`npm --prefix frontend run build` (`tsc && vite build`)
- **轉換模組數**：1,616 模組
- **型別錯誤**：0 筆
- **建置產物**：`dist/index.html` (1.01 kB)、`dist/assets/index-*.js` (543.34 kB)、`dist/assets/index-*.css` (14.22 kB)
- **結果**：**100% SUCCESS**

---

## 11. 尚未完成的功能與限制
1. **跨裝置雲端資料庫同步**：目前進度與錯題本完全儲存於使用者瀏覽器之 LocalStorage。若更換設備或清除瀏覽器快取，紀錄將無法自動繼承。
2. **Version B 影音秒數打點**：Version B 之 7 大步驟目前為架構拆解，因無網路串流環境，尚未填入實體影片的精確時間點。
3. **學科題庫全量 611 題匯入**：目前學科練習頁面採用 5 大代表性章節樣例題庫，全量 611 題之後續匯入需透過後台題庫管線進行。

---

## 12. 需要正式資料庫或後端支援的工作
- `UserProgress` 遠端資料表持久化與雙向同步（受限於 AUTH-03 BLOCKED）。
- 正式學員歷史成績雲端折線圖分析。
- 教師端檢視全班錯題熱點之聚合分析 API。

---

## 13. 下一批建議 UID
1. **`P13-STU-001`**：完成學生登入後儀表板與個人設定（基於前端本地狀態與 Demo 整合）。
2. **`P13-STU-002`**：完善證照分類、詳情與學習目標設定。
3. **`P13-STU-011`**：完成學習摘要、弱點雷達圖與學習建議視覺化展示。
