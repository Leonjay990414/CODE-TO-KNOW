# CODE TO KNOW｜Phase 13 第 4 批：錯題本與個人化複習系統開發報告

- **報告日期**：2026-11-14
- **專案名稱**：CODE TO KNOW 碼上學 AI 智慧學習與教育科技平台
- **工作批次**：Phase 13 學生學習平台開發 · 第 4 批次（錯題本與個人化複習系統）
- **正式全專案進度基準**：45.961878%（顯示 45.96%）
- **AUTH-03 狀態**：`BLOCKED`（嚴格維持）
- **Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`（分支：`main`，未執行任何 Commit / Push，工作目錄成果完整保留）

---

## 一、原始 UID 對應與查核結果

依據 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md` 清冊核對：

| UID | 原始清冊工作項目說明 | 原始狀態 | 本批次實作及完善內容 |
| :--- | :--- | :---: | :--- |
| **P13-STU-010** | 完成錯題本、收藏、筆記、學習時間及跨裝置紀錄。 | `PARTIAL` (60%) | **核心突破**：建立完備之三階段掌握度狀態機（尚未掌握 / 複習中 / 已攻克）、跨來源（學科練習＋全真模擬考答錯與未答）自動去重收錄、四大工作項目分類篩選、多維度排序、單題即時重測與獨立抽題複習測驗模式。 |
| **P13-STU-004** | 建立題型、作答、答案判定、解析及計分。 | `PARTIAL` (50%) | 錯題本支援單題重測與抽測模式，作答後即時判定對錯、更新連續答對次數與掌握狀態，並提供官方頁碼客觀解析。 |
| **P13-STU-011** | 完成學習摘要、弱點分布及學習建議。 | `PARTIAL` (50%) | 提供四大工作項目錯題落點統計，精準顯示未掌握與已掌握分佈。 |

---

## 二、開發前功能盤點

在實作本批次前，對既有系統進行深入盤點：
1. **已具備基礎**：
   - `wrongQuestionsStorage.ts` 原先具備基礎之新增、計數與攻克標記（舊版僅有單次答對即 resolved 的二元狀態）。
   - `LearningProgressPage.tsx` 與 `StudentDashboardPage.tsx` 已有部分 UI 銜接點。
2. **先前不足與本批次補齊之關鍵**：
   - 舊版模擬考未作答之試題未被收錄入錯題本（本批次已全面納入，標註「未作答」）。
   - 缺少明確且經測試驗證的**掌握度狀態門檻**（先前僅有答對 1 次即視為攻克，容易因僥倖猜對而失去複習價值；本批次確立連續答對 2 次之攻克門檻）。
   - 缺少**單題卡片原地重測**與**隨機抽題複習流程（Review Quiz Mode）**。
   - 缺少依四大工作項目與錯誤次數的多維度排序與篩選。

---

## 三、錯題本與個人化複習核心功能

### 1. 錯題自動收集（多來源去重）
- **學科章節練習 (`TheoryPracticePage`)**：答錯立即呼叫 `recordWrongAttempt`，寫入題目詳情、官方章節、題號與頁碼。
- **全真模擬考試 (`MockExamPage` / `mockExamStorage`)**：
  - 交卷時自動同步答錯試題。
  - **未作答題目主動收錄**：針對使用者跳過未作答的試題，記錄其答案為 `未作答`，標註為需加強之錯題。
  - 具備 `wrongSynced` 旗標與 Session 去重保護，避免重複交卷或重複檢視成績時重複累加計數。

### 2. 掌握度狀態機與判定規則 (Mastery Criteria)
系統確立嚴謹、可測試之三階段掌握度狀態機：
- **尚未掌握 (`unmastered`)**：
  - 觸發條件：初次答錯，或在複習過程中再次答錯。
  - 特徵：`wrongCount >= 1` 且 `consecutiveCorrect === 0`，`resolved = false`。
  - 介面標示：紅色警示框、`▲ 尚未掌握 (累計錯 X 次)`。
- **複習中 (`reviewing`)**：
  - 觸發條件：在錯題本或模擬考中重新答對 1 次。
  - 特徵：`consecutiveCorrect === 1`，`resolved = false`。
  - 介面標示：橘色標籤、`★ 複習中 (已答對 1 次 · 還差 1 次攻克)`。
- **已攻克掌握 (`mastered`)**：
  - 觸發條件：連續答對達到門檻（`consecutiveCorrect >= 2`）。
  - 特徵：`consecutiveCorrect >= 2`，`resolved = true`。
  - 介面標示：綠色標籤、`● 已掌握 (連續答對 2 次)`，預設在待複習清單中排除，但可在「已掌握」與「全部錯題」分類中隨時檢視與重測。

### 3. 多維度分類篩選與排序
- **狀態分類標籤頁**：
  - 待攻克全部（`unmastered` + `reviewing`）
  - 尚未掌握（`unmastered`）
  - 複習中（`reviewing`）
  - 已攻克掌握（`mastered`）
  - 全部錯題紀錄（`all`）
- **工作項目分類篩選**：全部工作項目、項目 01 作業準備、項目 02 應用軟體使用、項目 03 系統軟體使用、項目 04 資訊及安全。
- **排序方式**：最後作答時間（新到舊）、錯誤次數（高到低）、官方題號（小到大），支援升降冪切換。

### 4. 兩種靈活複習操作體驗
- **模式 A：單題卡片原地即時重測**：
  - 學生瀏覽錯題時，可點選「立即重測此題」，展開選項點選作答，點擊「送出核對」後即時更新掌握度與計數，無須跳離清單。
- **模式 B：獨立抽題複習測驗 (Review Quiz Mode)**：
  - 點擊「開始錯題抽測 (10題)」，自目前篩選條件下的錯題庫中隨機抽取至多 10 題進行逐題測驗。
  - 提供即時答對/答錯反饋、連續答對累積、完成後呈現複習成果總結卡。

---

## 四、錯題資料結構與 Schema 設計

```typescript
export type MasteryStatus = 'unmastered' | 'reviewing' | 'mastered';

export interface WrongQuestionItem {
  questionId: string;           // 官方題目唯一 ID (例如 173003-01-001)
  certificationId: string;      // 證照代號 (web-design-c)
  officialSection?: '01' | '02' | '03' | '04'; // 官方四大工作項目
  officialNumber?: number;      // 官方題號 (1 - 611)
  officialPage?: number;        // 官方試題本頁碼 (1 - 39)
  chapterId?: number;
  topic: string;                // 工作項目名稱
  question: string;             // 完整試題文字
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userSelectedAnswer: string;   // 使用者選擇 (A/B/C/D 或 '未作答')
  correctAnswer: string;        // 標準答案
  explanation: string;          // 官方試題本對照解析
  wrongCount: number;           // 錯誤累計次數
  consecutiveCorrect: number;   // 連續答對次數 (門檻: 2)
  masteryStatus: MasteryStatus; // 掌握狀態
  source?: 'theory_practice' | 'mock_exam' | 'manual_review';
  firstFailedAt: string;        // 首次答錯時間 (ISO)
  lastAttemptAt: string;        // 最後作答時間 (ISO)
  resolved: boolean;            // 相容欄位 (masteryStatus === 'mastered')
}
```

---

## 五、跨頁面整合與數據一致性

系統在所有學生主要頁面實現資料實時連動：
1. **`StudentDashboardPage.tsx`（學生儀表板）**：
   - 快捷卡片即時顯示：`待複習 ${wrongStats.unresolvedCount} 題 ｜ 已攻克 ${wrongStats.resolvedCount} 題`。
2. **`TheoryPracticePage.tsx`（學科練習頁）**：
   - 頂部切換按鈕即時反映待複習總數 `我的錯題本 (${wrongStats.unresolvedCount} 待複習)`。
   - 錯題分頁頂部展示 4 張狀態指標卡（累計收錄、尚未掌握、複習中、已攻克）。
3. **`MockExamPage.tsx`（模擬考頁面）**：
   - 考後成績單自動顯示已同步錯題數量，並提供一鍵前往錯題本精熟複習連結。
4. **`LearningProgressPage.tsx`（學習歷程頁面）**：
   - 本機錯題本指標卡實時展示待攻克題數、累計收錄與成功攻克題數。

---

## 六、帳號資料隔離與安全機制

1. **使用者命名空間隔離**：
   - 訪客：`ctk_wrong_questions:guest-anonymous`
   - Demo 學生：`ctk_wrong_questions:demo-student`
   - 正式帳號：`ctk_wrong_questions:${user.id}`
2. **嚴格禁止全域操作**：絕不呼叫 `localStorage.clear()`，僅依當前帳號 Key 進行單獨讀寫或清空。
3. **容錯恢復機制**：`getWrongQuestionsCollection` 具備安全 JSON 解析防線，遇資料損毀或欄位缺少時自動以安全預設值填補，防止前端拋出未捕獲例外。
4. **本機儲存告知**：清楚告知學生數據存放於瀏覽器本機儲存空間，更換裝置或清理快取前數據持續留存。

---

## 七、測試與建置結果

### 1. 單元與整合測試（Vitest）
執行指令：`npx vitest run frontend/tests`
- **測試結果**：**10 個測試套件全數通過，共 78 項測試 PASS，0 錯誤，耗時 559ms**。
- **本批次新增專屬測試套件**：[wrong-questions-review-system.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/wrong-questions-review-system.test.ts)（**15 項測試全數通過**）：
  1. 學科答錯自動收錄。
  2. 模擬考答錯自動收錄。
  3. 模擬考未作答之收錄處理。
  4. 同一試題跨來源（學科/模擬考）自動去重。
  5. 錯誤次數（`wrongCount`）精確累計。
  6. 最近錯誤時間更新並保留初次答錯時間戳記。
  7. 答對後狀態切換（1 次 correct -> reviewing，2 次 consecutive -> mastered）。
  8. 連續答對判定與中途答錯重置（consecutiveCorrect 歸零並退回 unmastered）。
  9. 同場次重複同步事件防止重複計算。
  10. 四大工作項目分類篩選精確度。
  11. 隨機複習抽題不重複性。
  12. 不同帳號切換後資料完全隔離。
  13. LocalStorage 損毀安全容錯（遇到非 JSON 字符安全恢復）。
  14. 空錯題本狀態顯示正常。
  15. 統計摘要與清單長度數據完全一致。

### 2. 生產環境編譯建置（Vite Build）
執行指令：`npm --prefix frontend run build` (`tsc && vite build`)
- **建置狀態**：**0 個 TypeScript 錯誤，編譯打包成功（耗時 1.99s）**。
- **產出檔案**：
  - `dist/index.html` (1.01 kB)
  - `dist/assets/index-BjE94Mpv.css` (14.24 kB)
  - `dist/assets/index-DNCxMlIp.js` (762.14 kB)

---

## 八、新增與修改檔案清冊

1. **新增檔案**：
   - [wrong-questions-review-system.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/wrong-questions-review-system.test.ts)：錯題本與個人化複習系統 15 大情境自動化測試套件。
   - [PHASE13_BATCH4_WRONG_QUESTIONS_REVIEW_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/PHASE13_BATCH4_WRONG_QUESTIONS_REVIEW_REPORT.md)（本報告）。
2. **修改檔案**：
   - [wrongQuestionsStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/wrongQuestionsStorage.ts)：升級為三階段掌握度狀態機、工作項目過濾、多重排序、抽題複習函式與容錯保護。
   - [mockExamStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/mockExamStorage.ts)：強化模擬考交卷同步，納入未作答試題與官方章節欄位傳遞。
   - [TheoryPracticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TheoryPracticePage.tsx)：重構錯題本視圖，支援 4 態統計卡、篩選工具列、單題原地重測、獨立抽題複習測驗。
   - [StudentDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/StudentDashboardPage.tsx)：接入本機錯題即時統計數據。
   - [mock-exam-system.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/mock-exam-system.test.ts)：同步更新模擬考錯題同步情境。
   - [wrong-questions-storage.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/wrong-questions-storage.test.ts)：更新掌握度生命週期測試。

---

## 九、尚未完成事項與後續批次建議

### 1. 尚未完成與限制事項
- 目前錯題紀錄存放於本機瀏覽器 LocalStorage，尚未對接遠端資料庫（因 AUTH-03 維持 BLOCKED）。
- 目前官方 605 題中，5 題具備 4 階層式 Socratic AI 提示導引，其餘試題依據官方試題本提供標準解答與頁碼對照。

### 2. 下一步建議
至此，Phase 13 之五大術科題組教材（Batch 1/2）、605 題官方學科題庫（Batch 2）、80 題全真模擬考系統（Batch 3）、以及錯題本與個人化複習系統（Batch 4）均已全數實作並通過自動化測試與建置檢查。建議下一批次進入 **Phase 13 學生學習平台端到端綜合驗收與進度模型正式校正**。

---

## 十、Git 狀態與專案基準確認

- **Git HEAD**：`310323dee802eb3a940ed947c7c665e147fb19f3`（分支：`main`）。
- **操作安全**：**未執行任何 git commit、未執行 git push、未執行 git reset/clean**，所有本機成果完整保留。
- **AUTH-03 狀態**：嚴格維持 `BLOCKED`。
- **全專案正式進度基準**：嚴格維持 `45.961878%`（顯示 `45.96%`）。
