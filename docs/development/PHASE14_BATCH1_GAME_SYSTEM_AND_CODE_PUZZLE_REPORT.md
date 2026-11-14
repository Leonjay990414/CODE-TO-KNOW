# CODE TO KNOW｜Phase 14 第 1 批：遊戲系統架構與 Code Puzzle 初版開發報告

**專案名稱**：碼上學｜CODE TO KNOW  
**報告日期**：2026-11-14  
**執行階段**：Phase 14｜互動遊戲與遊戲化學習系統（第 1 批）  
**正式全專案進度基準**：45.961878%（呈現 45.96%）  
**AUTH-03 狀態**：BLOCKED（嚴格維持）  
**Git HEAD 錨點**：`310323dee802eb3a940ed947c7c665e147fb19f3`  

---

## 一、執行摘要與前置基準查核

本批次為原始 20 階段規劃中的 **Phase 14：互動遊戲與遊戲化學習系統** 第 1 批連續開發工作。
依照專案最高規範，本批次聚焦於：
1. **核對 Phase 14 全數 16 項原始 UID** 之工作範圍、完成條件與權重比例。
2. **建立 5 款微型學習遊戲之整體系統架構**（資料模型、帳號隔離本機儲存、星星與評分機制、通關條件）。
3. **完成 Code Puzzle（程式邏輯拼圖）初版（v1）**：包含 4 大關卡、上下排序操作、重置順序、即時校驗、漸進式提示引導、星星/分數結算、通關語法深度解析與響應式介面。
4. **完成獨立遊戲中心首頁（GameCenterPage）**：整合全真 5 款遊戲藍圖與學員通關數據摘要。
5. **整合導覽與學生平台**：於 `NavigationContext`、`App.tsx`、`Navbar.tsx` 與 `StudentDashboardPage` 完成無縫串接。
6. **落實自動化回歸測試與型別建置檢驗**：新增 14 項專案測試，全站 11 份測試檔共 92 項測試全數 PASS，Vite 生產建置 0 錯誤。
7. **嚴格遵循 Git 與檔案安全規範**：未執行 `git commit`、`git push`、`git reset` 或 `git clean`，所有既有工作成果 100% 完整保留。

---

## 二、Phase 14 原始 UID 清冊盤點與狀態對照

依據 `docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md`，Phase 14 佔全專案進度權重 **7.0%**，共計 16 項唯一 UID（每項佔 0.4375%）：

| UID | 原始工作項目名稱 | 原始工作範疇與驗收條件 | 本批次成果狀態 | 本批次進度進展 |
| :--- | :--- | :--- | :--- | :--- |
| **P14-GAM-001** | 遊戲中心首頁與分類導覽 | 獨立遊戲中心頁面、導覽路徑、五大遊戲分類、推薦與遊戲搜尋 | **PARTIAL (80%)** | 已完成 `GameCenterPage.tsx`，展示 5 款遊戲卡片、路由 `#games`、通關星數與積分摘要。 |
| **P14-GAM-002** | 遊戲資料模型 | 關卡、難度、題型、獎勵、限制條件等資料結構 | **PARTIAL (75%)** | 建立 `gameStorage.ts` 與 `codePuzzleData.ts` 完整資料介面（LevelProgress、UserGameRecord）。 |
| **P14-GAM-003** | 玩法與計分規則 | 玩法、操作方式、計分規則、時間及注意事項說明 | **PARTIAL (70%)** | 實作 1~3 星星評級規則、提示扣星邏輯、通關積分公式（100 基本分 + 50*星星）。 |
| **P14-GAM-004** | Code Puzzle 遊戲實作 | 程式邏輯與流程判斷遊戲，程式區塊拼接、排序或條件判斷 | **PARTIAL (85%)** | 完成 4 關可玩版本，支援上下調整區塊、提交檢驗、錯誤引導與標準答案詳解。 |
| **P14-GAM-005** | CSS Designer 遊戲實作 | 版面配置、選擇器與樣式理解，視覺化調整與即時預覽 | **NOT STARTED** | 已納入遊戲中心卡片規劃（Batch 2 實作）。 |
| **P14-GAM-006** | Bug Hunter 遊戲實作 | 程式錯誤辨識與除錯思考，找出語法錯誤或邏輯漏洞 | **NOT STARTED** | 已納入遊戲中心卡片規劃（Batch 3 實作）。 |
| **P14-GAM-007** | Quiz Rush 遊戲實作 | 證照知識與題型快問快答，限時作答與連擊機制 | **NOT STARTED** | 已納入遊戲中心卡片規劃（Batch 4 實作，整合 605 題題庫）。 |
| **P14-GAM-008** | Web Builder 遊戲實作 | HTML/CSS 元件組合與網頁結構，模組化拼裝與結果呈現 | **NOT STARTED** | 已納入遊戲中心卡片規劃（Batch 5 實作）。 |
| **P14-GAM-009** | 關卡難度與提示機制 | 關卡、難度、提示、重試及通關條件 | **PARTIAL (60%)** | Code Puzzle 具備入門/基礎/進階 3 級難度，每關配備 3 階段遞進提示與重置功能。 |
| **P14-GAM-010** | 遊戲獎勵與成就計算 | 分數、時間、星星、點數與獎勵計算規則 | **PARTIAL (50%)** | 已實作最佳時間、最高分數、星數計算與防洗分覆寫保護（保留歷史最高紀錄）。 |
| **P14-GAM-011** | 學習挑戰與解鎖機制 | 每日任務、連續學習、成就及可解鎖元件 | **NOT STARTED** | 待後續批次與學生儀表板深度連動。 |
| **P14-GAM-012** | 遊戲紀錄與數據統計 | 遊戲紀錄、個人進度與排行榜 | **PARTIAL (50%)** | 本機多帳號完全隔離持久化（`ctk_game_progress:${userId}:${gameId}`）。 |
| **P14-GAM-013** | 學習目標整合 | 課程、題庫、考試與遊戲的學習目標連動 | **NOT STARTED** | Code Puzzle 關卡已對齊「網頁設計丙級」HTML5、Flexbox、語意化導覽與 DOM 事件。 |
| **P14-GAM-014** | 教師指派遊戲任務 | 教師指派遊戲任務、自訂題型或檢定練習活動 | **NOT STARTED** | 屬於教師端功能，待 Phase 15/17 開展。 |
| **P14-GAM-015** | 遊戲管理與版本維護 | 管理員管理遊戲、關卡、題庫及版本更新 | **NOT STARTED** | 屬於管理端功能，待後續階段開展。 |
| **P14-GAM-016** | 遊戲平衡與測試驗證 | 遊戲平衡、可用性、無障礙與安全測試 | **PARTIAL (40%)** | 完成 Code Puzzle 14 項自動化整合測試與響應式按鈕佈局。 |

---

## 三、五款學習遊戲系統整體架構

本平台遊戲系統秉持「**寓教於樂、激發獨立思考、杜絕盲猜**」的核心教育理念，針對網頁設計檢定核心痛點設計 5 款專屬微型遊戲：

```
                              [CODE TO KNOW 遊戲中心]
                                    (#games)
                                       │
      ┌───────────────┬────────────────┼───────────────┬───────────────┐
      │               │                │               │               │
 [Code Puzzle]  [CSS Designer]   [Bug Hunter]    [Quiz Rush]    [Web Builder]
(程式邏輯拼圖)  (樣式排版設計師) (程式除錯獵人)  (證照疾速快答) (網頁架構拼裝工坊)
  P14-GAM-004     P14-GAM-005      P14-GAM-006     P14-GAM-007    P14-GAM-008
 【Batch 1 上線】 【Batch 2 規劃】 【Batch 3 規劃】 【Batch 4 規劃】 【Batch 5 規劃】
```

### 1. 遊戲核心職責切分
- **Code Puzzle (程式邏輯拼圖)**：重組語意標籤與樣式屬性順序，建立由外至內、由上而下的巢狀與執行邏輯。
- **CSS Designer (樣式排版設計師)**：透過直覺式參數調校（Margin, Padding, Flex Align, Grid），即時視覺化對齊目標框。
- **Bug Hunter (程式除錯獵人)**：考驗火眼金睛，快速揪出考場最常見的失分陷阱（標籤未閉合、非法屬性值、語法拼錯）。
- **Quiz Rush (證照疾速快答)**：整合 605 題官方學科題庫，透過計時快答強化直覺反應力與瞬時記憶。
- **Web Builder (網頁架構拼裝工坊)**：將導覽列、輪播圖、內容表格與頁尾等組件組裝成合格網頁，培養全域大局觀。

---

## 四、資料模型與本機儲存架構 (`gameStorage.ts`)

### 1. 命名空間與帳號隔離規範
為落實多學員/公用裝置隱私安全，所有遊戲紀錄均採用嚴格前綴隔離：
```
ctk_game_progress:${userId || 'guest-anonymous'}:${gameId}
```
訪客與不同登入學員擁有獨立的沙盒儲存空間，登出或切換帳號互不污染。

### 2. 資料結構定義
```typescript
export interface LevelProgress {
  levelId: number;
  completed: boolean;
  stars: number;         // 1~3 顆星
  highScore: number;     // 歷史最高積分
  attempts: number;      // 累計嘗試次數
  hintsUsed: number;     // 該次使用提示數
  bestTimeSeconds?: number;
  completedAt?: string;
}

export interface UserGameRecord {
  userId: string;
  gameId: GameId;
  totalScore: number;
  totalStars: number;
  completedLevelsCount: number;
  levels: Record<number, LevelProgress>;
  lastPlayedAt: string;
}
```

### 3. 星星評級與積分公式 (`P14-GAM-003`, `P14-GAM-010`)
- **3 顆星**：完全自主排列正確（使用 0 次提示）。獲得基礎積分 100 分 + 3 星獎勵 150 分 = **250 分**。
- **2 顆星**：使用 1 次思考引導提示後通關。獲得基礎積分 100 分 + 2 星獎勵 100 分 = **200 分**。
- **1 顆星**：使用 2 次（含）以上提示後通關。獲得基礎積分 100 分 + 1 星獎勵 50 分 = **150 分**。
- **高分保留防洗分**：重新遊玩時若獲得較低成績，系統自動保留該關卡歷史最高分數與最高星數，僅累加遊玩次數。

---

## 五、Code Puzzle 初版（v1）實作成果

### 1. 關卡內容配置 (`codePuzzleData.ts`)
本批次已提供 4 個涵蓋 Web 檢定關鍵重點的實戰關卡：
1. **第 1 關：HTML5 網頁標準骨架排序（入門）**
   - 包含 `<!DOCTYPE html>`、`<html lang="zh-Hant">`、`<head>`（meta/title）、`<body>`（main/h1）、`</body></html>`。
   - 考驗標準模式宣告、根容器與內容容器先後順序。
2. **第 2 關：CSS Flexbox 雙向置中宣告（基礎）**
   - 包含 `.hero-container {`、`display: flex;`、`justify-content: center;`、`align-items: center;`、`min-height: 100vh;`、`}`。
   - 考驗彈性盒容器啟用先於對齊屬性生效之排版法則。
3. **第 3 關：語意化導覽列 Semantic Navbar（基礎）**
   - 包含 `<nav>` 地標、`<ul>` 清單、多個 `<li><a>` 項目與閉合結構。
   - 考驗無障礙（WCAG）與檢定評分要求的階層包覆性。
4. **第 4 關：JavaScript 事件監聽與表單驗證流程（進階）**
   - 包含 `document.querySelector`、`addEventListener('submit')`、`event.preventDefault()`、處理邏輯與閉合。
   - 考驗前端非同步與事件驅動編程執行時序。

### 2. 互動元件與使用體驗 (`CodePuzzlePage.tsx`)
- **上下移動調整按鈕**：每行程式碼右側配備直覺的「上移 (ArrowUp) / 下移 (ArrowDown)」無障礙按鈕，完美適配行動裝置點擊，避免移動端拖拉手勢誤觸或溢出。
- **行號與等寬字型顯示**：以專業代碼編輯器樣式呈現，標籤縮排與註解清晰可讀。
- **一鍵重置順序 (Reset)**：提供一鍵恢復初始打亂狀態之重整按鈕。
- **三階段遞進式提示 (Progressive Hints)**：點選提示按鈕逐級揭露思考引導，並動態提示扣星警語。
- **即時校驗反饋 (Immediate Feedback)**：
  - 成功：展開恭賀橫幅、點亮星級、計入總分、提供**完整語法解析與標準程式碼範本**，並提供「挑戰下一關」按鈕。
  - 失敗：給予溫和且具教育性的排錯建議，引導學員檢查開閉標籤對應關係。

---

## 六、開發技能查核說明（Skills Audit）

依據本次指引第 7 條之查核要求：
1. **現行已安裝技能檢視**：目前專案已配置之技能包括 `feature-development`、`bug-fixing`、`web-design-guidelines`、`impeccable`、`vercel-react-best-practices` 等前端與程式碼品質技能。
2. **評估結論**：CODE TO KNOW 之遊戲系統完全建立在現代 React 18、TypeScript、純 CSS 變數及安全本機 LocalStorage 之上，架構簡潔模組化，**無需安裝額外第三方遊戲引擎或 70 多個不相干技能**，避免造成專案依賴膨脹與環境衝突。

---

## 七、品質驗證與自動化測試報告

### 1. 自動化測試套件 (`frontend/tests/code-puzzle-game.test.ts`)
本批次撰寫 14 項專屬測試，涵蓋三大測試向度：
- **Level Integrity**：驗證關卡數量 >= 3、所有關卡 correctOrder 與 blocks 完全對應、初始區塊排列確實被打亂。
- **Game Storage & Scoring**：驗證初次存取預設值、評級星星與分數結算、多次遊玩最高分保護、多學員 LocalStorage 完全隔離、損壞 JSON 自動容錯防崩潰、重置功能獨立性、全遊戲數據彙總統計。
- **Navigation Routing**：驗證 `#games`、`#game-center`、`#games/code-puzzle`、`#code-puzzle` 正確解析為相應頁面。

### 2. 執行結果（100% PASS）
```bash
$ npx vitest run frontend/tests

 ✓ frontend/tests/wrong-questions-storage.test.ts (6 tests)
 ✓ frontend/tests/learning-storage.test.ts (6 tests)
 ✓ frontend/tests/account-storage-isolation.test.ts (7 tests)
 ✓ frontend/tests/practical-task5-curriculum.test.ts (5 tests)
 ✓ frontend/tests/legal-routes.test.tsx (5 tests)
 ✓ frontend/tests/unified-practical-curriculum.test.ts (7 tests)
 ✓ frontend/tests/code-puzzle-game.test.ts (14 tests)
 ✓ frontend/tests/mock-exam-system.test.ts (15 tests)
 ✓ frontend/tests/official-theory-question-bank.test.ts (5 tests)
 ✓ frontend/tests/wrong-questions-review-system.test.ts (15 tests)
 ✓ frontend/tests/sources-route-protection.test.tsx (7 tests)

 Test Files  11 passed (11)
      Tests  92 passed (92)
   Duration  617ms
```

### 3. 生產環境建置檢查（Vite Build）
```bash
$ npm --prefix frontend run build
> tsc && vite build

vite v5.4.21 building for production...
✓ 1624 modules transformed.
dist/index.html                   1.01 kB │ gzip:   0.71 kB
dist/assets/index-BjE94Mpv.css   14.24 kB │ gzip:   3.51 kB
dist/assets/index-D8z8e9NB.js   794.99 kB │ gzip: 237.07 kB
✓ built in 2.13s
```
**編譯結果**：TypeScript 0 警告、0 錯誤，Vite 生產打包順利通過。

---

## 八、版本控制與基準聲明

1. **未執行破壞性指令**：嚴格落實指令保護，未執行 `git commit`、`git push`、`git reset` 或 `git clean`。
2. **既有未提交成果保護**：所有 Phase 12 與 Phase 13 已修改或新增之成果（共 15 個已修改檔案、34 個未追蹤檔案）完整存續於工作目錄中，無任何代碼流失。
3. **HTML 入口完整性**：未修改或刪除任何 `index.html`，正式入口維持 `frontend/index.html`。
4. **進度維持**：正式基準進度維持 **45.961878%（45.96%）**，`AUTH-03` 維持 **BLOCKED**。

---

## 九、後續批次接續規劃 (Next Steps)

1. **Phase 14 第 2 批 (Batch 2)**：
   - 實作 **CSS Designer (`P14-GAM-005`)**：以 Flexbox 與 Grid 佈局為主的滑桿互動排版遊戲。
   - 增加目標框與物件碰撞判定。
2. **Phase 14 第 3 批 (Batch 3)**：
   - 實作 **Bug Hunter (`P14-GAM-006`)**：建立考場常見失分語法除錯靶場。
3. **Phase 14 第 4 批 (Batch 4)**：
   - 實作 **Quiz Rush (`P14-GAM-007`)**：結合官方 605 題題庫進行倒數連鎖競速快問快答。
4. **Phase 14 第 5 批 (Batch 5)**：
   - 實作 **Web Builder (`P14-GAM-008`)** 與成就勳章徽章系統 (`P14-GAM-011`)。
