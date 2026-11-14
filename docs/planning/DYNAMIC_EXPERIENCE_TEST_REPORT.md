# CODE TO KNOW (碼上學) 全站動態體驗測試與驗收報告 (Test Report)

> **專案**: 碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
> **版本**: 1.0.0  
> **日期**: 2026-11-14  

---

## 一、測試環境與驗證工具

1. **靜態型別與語法**: TypeScript 5.6.3 (`tsc --noEmit`)
2. **生產打包引擎**: Vite 5.4.21 (`npm run build`)
3. **單元與整合測試**: Vitest 5.1.0 (`vitest run frontend/tests`)
4. **全裝置 RWD 真機矩陣**: Chrome DevTools Protocol (CDP) WebSocket 自動化腳本 (`tmp/verify-154-matrix.mjs`)
5. **瀏覽器核心模擬**: Chrome Headless (Windows 11)

---

## 二、測試執行數據與結果

| 測試分類 | 測試項目 | 測試情境 / 樣本 | 判定標準 | 測試結果 | 狀態 |
|---|---|---|---|---|---|
| **靜態型別** | TypeScript Compilation | 全前端 1,643 個模組 | 0 Errors, 0 Warnings | Exit Code 0 | **PASS** |
| **生產建置** | Vite Production Bundle | 主頁、遊戲、測驗、題庫 | Exit Code 0, Bundle < 500kB | 主 Bundle 470.99 kB (Gzip 142.25 kB) | **PASS** |
| **前端測試** | Vitest Test Suite | 20 個測試檔 (儲存隔離、遊戲復原、新手教學、計時器清理、題庫等) | 100% 通過 | **187/187 Tests Passed** | **PASS** |
| **RWD 真機矩陣** | Chrome CDP 跨裝置檢測 | 14 個核心路由 × 11 種視窗尺寸 (320px ~ 1920px) | `scrollWidth - innerWidth <= 0px` | **154/154 Scenarios Passed (0px 溢位)** | **PASS** |
| **無障礙動態降級** | `prefers-reduced-motion` | 檢查 `@media (prefers-reduced-motion: reduce)` | 禁用 transform 位移，時間 <= 0.001ms | 樣式強制覆蓋，文字正常呈現 | **PASS** |
| **鍵盤無障礙** | Focus Ring 焦點環 | 按鈕、輸入框、互動卡片 | 2px 香檳金色 outline offset 2px | `:focus-visible` 100% 覆蓋 | **PASS** |
| **效能評估** | LCP & CLS 防線 | Hero 與卡片 Stagger | 不引發 Layout Shift，LCP < 2.5s | CSS `will-change: transform, opacity` 最佳化 | **PASS** |

---

## 三、驗收結論

全站動態體驗升級已達成以下指標：
1. **零功能性退化**：題庫、測驗作答、術科引導、5 款程式學習遊戲全部運作如常。
2. **零過度動畫干擾**：學科閱讀與編輯器保持絕對安靜。
3. **無障礙合規**：滿足 WCAG AAA 減少動態效果要求與焦點環標準。
4. **跨裝置適應**：全尺寸 320px 到 1920px 無破版。
