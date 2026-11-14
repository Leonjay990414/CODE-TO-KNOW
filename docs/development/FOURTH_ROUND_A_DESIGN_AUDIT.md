# CODE TO KNOW｜第四輪 A 全站設計系統盤點與問題診斷報告 (FOURTH ROUND A DESIGN AUDIT)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **稽核日期**：2026-11-14
- **負責技能**：`web-design-engineer`, `frontend-design`, `web-design-guidelines`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable`, `emil-design-eng`
- **架構**：React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 SPA
- **盤點涵蓋範圍**：全站 20 個真實路由狀態、4 個主要彈窗 (Modal)、導覽列與頁尾。

---

## 一、盤點範圍與路由清單核實

依據 `frontend/src/context/NavigationContext.tsx` 實際定義之 20 個頁面路由：
1. `home`（首頁，Hero, Experience, Features, Story, Pricing, FinalCTA）
2. `certifications`（證照智慧學習中心）
3. `certification-detail`（各項證照大綱與檢定詳細頁面）
4. `web-design-demo`（網頁設計丙級展示專區）
5. `theory-practice`（學科 605 題題庫刷題與錯題本複習）
6. `mock-exam`（全真 80 題 100 分鐘模擬考）
7. `practical-learning`（術科五大題組版面規格導引）
8. `code-editor`（雙欄/單欄自適應沙盒程式碼編輯器）
9. `ai-coach`（AI 4 階鷹架問答引導專區）
10. `learning-progress`（個人化學習曲線與研讀分析儀表板）
11. `student-dashboard`（學員個人學習管理中心）
12. `teacher-dashboard`（教師班級檢定預測與管理主控台）
13. `import-system`（官方題庫匯入與結構校驗工具）
14. `legal`（隱私權保護、服務條款與學術倫理規範）
15. `game-center`（五款教育互動遊戲與成就館入口）
16. `code-puzzle`（語意標籤與樣式重組拼圖遊戲）
17. `css-designer`（視覺化排版與盒模型設計師遊戲）
18. `bug-hunter`（考場常見失分語法除錯獵人遊戲）
19. `quiz-rush`（極限連擊快問快答題庫衝刺遊戲）
20. `web-builder`（考場版面組裝實戰切版大師遊戲）

---

## 二、現有設計問題分類與嚴重度分級

### 1. P0 級（嚴重度最高：可用性與排版破壞）— *前兩輪已澈底修復*
- **狀況**：iPad 768px 與摺疊機 840px 視窗在 `#practical` 原本存在 `+244px` / `+172px` 橫向溢出。
- **解決**：已抽離為 `.practical-detail-grid`，經 CDP 實機 154 場景測試橫向溢出全數歸 0。

### 2. P1 級（中度問題：設計一致性與視覺雜訊）
- **色彩 Token 分散**：
  - 各頁面存在直接硬編碼色碼（如 `#2E7D32`、`#16A34A`、`#C62828`、`#B8860B`、`#F5F2EA` 等）。
  - *改善方案*：將常用回饋色與自然色階收斂進 `tokens.css` 的 Design Tokens，如 `--color-brand-sage`、`--color-brand-oat`、`--color-brand-cream`，嚴禁頁面自由宣告雜亂顏色。
- **卡片階層不一致**：
  - 部分卡片 padding 為 28px，部分為 20px，部分缺少柔和陰影與邊框對比。
  - *改善方案*：統一卡片 padding 標準（Desktop: 24px/28px, Mobile: 16px/20px），並賦予統一的 `--border-default` 與 `--shadow-sm`。
- **按鈕高度與觸控體驗**：
  - 桌面版按鈕 40px，行動版部分小型按鈕未達 44px 推薦觸控尺寸。
  - *改善方案*：在行動端確保所有可互動點擊項目具備 `min-height: 44px`。

### 3. P2 級（輕度問題：Anti-AI-Slop 與精緻感不足）
- **Emoji 當作正式功能圖示**：
  - 部分按鈕或提示使用 `◐`、`✦`、`★` 或 Emoji 混雜 Lucide 圖示。
  - *改善方案*：主要導覽與狀態指示一律統一使用 `Lucide-React` 向量圖示，保持教育科技專業度。
- **過多漸層與高彩度徽章**：
  - 杜絕市面常見的「紫色到青色漸層」AI 模板陋習，堅持 CODE TO KNOW 沉穩的「暖象牙白、深霧藍灰、香檳金、鼠尾草綠」大地自然教育色盤。

---

## 三、技術風險評估與防護策略

1. **CSS 繼承與層疊覆蓋風險**：
   - 採用追加與變數擴充原則，絕不破壞既有已運作正常的 class。
2. **React 18 + Vite SPA 邊界**：
   - 保持純客戶端渲染特性，不使用任何 SSR/RSC 專用語法。
3. **安全約束合規**：
   - 保持 AUTH-03 鎖定 `BLOCKED`，進度基準固定在 `45.961878%`，官方題庫 605 題與 5 大術科數據完全保護。
