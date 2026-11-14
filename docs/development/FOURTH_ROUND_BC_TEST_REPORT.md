# CODE TO KNOW｜第四輪 B+C 全套回歸測試報告 (FOURTH ROUND BC TEST REPORT)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **測試日期**：2026-11-14
- **負責技能**：`release-check`, `bug-fixing`, `web-design-guidelines`
- **架構**：React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 SPA

---

## 一、測試矩陣與統計總覽

| 測試類型 | 執行工具 / 腳本 | 測試目標 | 執行結果 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **TypeScript 型別檢查** | `tsc --noEmit` (via build) | 全站原始碼型別嚴謹性 | **0 個型別錯誤** | **PASS** |
| **生產環境 Bundle 打包** | `npm --prefix frontend run build` | 生產構建與 Code Splitting | **2.06 秒完成，0 警告** | **PASS** |
| **Vitest 單元與整合測試套件** | `npx vitest run frontend/tests` | 20 個測試檔、187 項測試 | **20 / 20 檔案通過，187 / 187 測試通過** | **PASS** |
| **Chrome CDP 154 場景全矩陣 RWD** | `node tmp/verify-154-matrix.mjs` | 14 頁面 × 11 種視窗尺寸 (320px ~ 1920px) | **154 / 154 全部通過，0px 溢出** | **PASS** |

---

## 二、RWD 測試視窗明細 (11 種視窗尺寸全部 0px 溢出)

- `320px` (極窄手機 JioPhone / iPhone SE 1代)：**0px 溢出 (PASS)**
- `340px` (摺疊機外螢幕 Galaxy Z Fold)：**0px 溢出 (PASS)**
- `375px` (iPhone SE 2/3 代)：**0px 溢出 (PASS)**
- `390px` (iPhone 13/14/15 標準版)：**0px 溢出 (PASS)**
- `430px` (iPhone Pro Max 系列)：**0px 溢出 (PASS)**
- `768px` (iPad 直向模式)：**0px 溢出 (PASS)**
- `840px` (摺疊機展開主螢幕)：**0px 溢出 (PASS)**
- `1024px` (iPad 橫向 / 輕薄筆電)：**0px 溢出 (PASS)**
- `1280px` (標準筆電視窗)：**0px 溢出 (PASS)**
- `1440px` (標準桌面 Full HD)：**0px 溢出 (PASS)**
- `1920px` (大尺寸寬螢幕)：**0px 溢出 (PASS)**
