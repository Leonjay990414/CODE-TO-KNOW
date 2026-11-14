# CODE TO KNOW｜第四輪 B+C 全站互動體驗與動態品質稽核報告 (FOURTH ROUND BC INTERACTION AUDIT)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **報告日期**：2026-11-14
- **負責技能**：`emil-design-eng`, `web-design-guidelines`, `impeccable`
- **架構**：React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 SPA

---

## 一、動態效果與微互動標準 (Emil Kowalski 工藝原則落實)

1. **觸感反饋 (Tactile Response)**：
   - 全站按鈕在點擊當下具備 `transform: scale(0.98)` 的 50ms 即時物理觸感回饋，滑鼠放開時平滑復原。
2. **滾動進場平滑化 (Soft Scroll Reveal)**：
   - 透過 `IntersectionObserver` 搭配 `.fade-in-section`，區塊具備 400ms 的平滑垂直位移與透明度淡入 (`cubic-bezier(0.16, 1, 0.3, 1)`)，絕不阻塞使用者第一時間的滾動與點擊。
3. **無障礙減速動效 (Reduced Motion)**：
   - 嚴格遵守 `@media (prefers-reduced-motion: reduce)`，主動將動畫時間設為 0.01ms，為前庭功能障礙者提供舒適靜態體驗。

---

## 二、對話框 (Modal) 與鍵盤互動審計

1. **Escape 鍵關閉**：
   - `AuthModal`、`GameBriefingModal`、`GameAchievementsModal`、`TeacherApplyModal` 全面支援 `Escape` 鍵退出。
2. **焦點捕捉與引導 (Focus Trap & Initial Focus)**：
   - 開啟彈窗時自動導向主要行動按鈕（如「開始挑戰」或輸入欄位），防止焦點遺落在背後 DOM。
3. **可見焦點環 (Focus Ring)**：
   - 鍵盤 Tab 鍵瀏覽時，所有可互動項目皆清晰呈現 2px 香檳金外框 (`:focus-visible`)。
