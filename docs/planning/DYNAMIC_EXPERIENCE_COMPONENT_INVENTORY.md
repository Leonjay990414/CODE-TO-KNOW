# CODE TO KNOW (碼上學) 動態體驗元件與狀態清單 (Component Inventory)

> **專案**: 碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
> **版本**: 1.0.0  
> **日期**: 2026-11-14  

---

## 一、動態 Tokens 基準

```css
/* Duration */
--dur-instant: 100ms;
--dur-fast: 160ms;
--dur-base: 240ms;
--dur-slow: 400ms;
--dur-slower: 640ms;

/* Easing */
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);
--ease-exit: cubic-bezier(0.3, 0, 0.8, 0.15);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Scales & Displacement */
--motion-displacement-sm: 8px;
--motion-displacement-md: 16px;
--motion-displacement-lg: 24px;
--motion-scale-press: 0.97;
--motion-scale-modal-enter: 0.96;
```

---

## 二、共用動態組件規範與狀態對照

| 組件名稱 | 適用類別 / 標籤 | 正常態 (Resting) | 懸停態 (Hover) | 按下態 (Active / Press) | 焦點態 (Focus-Visible) | 無障礙降級 (Reduced-Motion) |
|---|---|---|---|---|---|---|
| **按鈕 (Button)** | `.btn`, `button` | 邊界柔和，過渡 `var(--dur-fast)` | 桌面位移 `translateY(-1px)` | 縮放 `scale(0.97)`，50ms 反饋 | 2px 香檳金色輪廓環，offset 2px | `transform: none`，僅顏色變換 |
| **卡片 (Card)** | `.interactive-card` | 底色 `var(--surface-sunken)` | 桌面 `translateY(-4px)`，陰影深化 | 輕微回彈 `scale(0.99)` | 2px 香檳金色外框 | 禁用位移，無延遲 |
| **彈窗 (Modal)** | `.modal-overlay`, `.modal-content` | 透明度 0 | 遮罩淡入 `var(--dur-base)` | 內容由 `0.96 -> 1` 彈簧曲線顯現 | 自動捕獲焦點至主要動作按鈕 | 直接呈現，跳過縮放 |
| **手機底部面板** | `.modal-bottom-sheet` | 螢幕底部之外 | 手機觸控自動適配 | 由下而上 `translateY(100% -> 0)` | 鎖定視窗捲動 | 直接顯示於底部 |
| **訊息通知 (Toast)** | `.toast-item` | 隱藏 | 進入由 `16px -> 0` 柔和滑入 | 可點擊關閉按鈕 | 支援鍵盤 Tab 操作關閉 | 無位移，直接淡現 |
| **表單輸入框** | `input`, `select`, `textarea` | 1px 預設淺邊框 | 邊框微深 | 聚焦時 3px 金色擴散發光環 | 2px 香檳金輪廓 | 無發光動畫，直接變換顏色 |
| **列表依序進場** | `.stagger-item` | 透明度 0，位移 8px | 項目 1~8 依序 40ms 階梯延遲 | 支援個別項目互動 | 無延遲阻礙 | `opacity: 1 !important`，零位移 |
| **AI 思考指示器** | `.pulse-dot-1..3` | 呼吸微動態 | 點點平順縮放 `scale(0.8 -> 1.1)` | 循環週期 1.4s | 語音朗讀支援 `aria-live` | 靜態三點顯示，無縮放閃爍 |
