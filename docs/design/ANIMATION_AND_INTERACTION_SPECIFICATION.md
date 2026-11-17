# CODE TO KNOW (碼上學)｜網站動畫與互動效果開發規範

**文件識別碼：** `CTK-SPEC-ANIMATION-INTERACTION-20261117`  
**建立日期：** 2026 年 11 月 17 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**技術架構：** React 18 + TypeScript + Vite + 原生現代 CSS  
**核心設計哲學：** 自然、節制、教育科技感、以學習者為中心、無障礙第一（Emil Kowalski Design Engineering 理念）  
**品牌五大代表色票：**
- 鼠尾草綠 (`#5A7D6C` / `--color-brand-sage`)：學術成長、通過狀態、冷靜專注感
- 燕麥色 (`#EBE5D8` / `--color-brand-oat`)：溫潤中性層、柔和卡片背景
- 奶油白 (`#FAF8F2` / `--color-brand-cream`)：極致溫暖閱讀卡片底色、明亮閱讀感
- 藍灰系統 (`#526B7B` 深霧藍灰 / `#8FA9B8` 柔霧藍 / `#D9E2EA` 淺藍灰)：專業架構骨幹
- 香檳金 (`#BDA77E` / 文字 `#7C663D`)：靈感啟發微光、成就解鎖、焦點點睛色

---

## 一、動態設計核心原則 (Core Philosophy)

### 1. 目的導向，絕非為了炫技而動
動畫的存在只有三種合理理由：
1. **認知引導 (Cognitive Guidance)**：透過空間連續性（Spatial Continuity），幫助學習者理解介面階層、狀態變更（如鷹架步驟切換、題型展開）。
2. **操作即時回饋 (Tactile Feedback)**：按鈕按壓、卡片懸停、開關切換給予學習者「系統已確實收到操作」的明確反饋。
3. **優雅減輕等待焦慮 (Graceful Loading & Reveal)**：內容非突兀跳出，而是依層次輕柔顯現，降低頁面跳動感知。

> **嚴格禁令**：頻繁看見的元素（如命令鍵盤操作、主要表單輸入、快速列表導航）嚴格禁止過度動畫。絕不使用強烈彈跳（Bouncy Overshoot）、快速旋轉、大量光點散落等干擾學習注意力的效果。

### 2. 避免 `transition: all`
禁止在按鈕與卡片上使用 `transition: all`。必須明確指定過渡屬性（如 `transform`, `background-color`, `border-color`, `box-shadow`, `color`），以獲得瀏覽器合成器（Compositor）的最佳效能並防止意料之外的重排（Reflow）。

### 3. 微物理按壓手感 (The Tactile Press)
- 按鈕與互動式 Chip 在 `:active` 狀態應給予輕微縮放回饋（如 `transform: scale(0.97)`），並搭配 `50ms~100ms` 的極快響應，使點擊具有機械按鍵般的確切手感。
- 卡片懸停採用平滑上浮（`translateY(-2px)` 到 `translateY(-4px)`）與柔和陰影擴散，避免大幅晃動。

---

## 二、時間長度與動態曲線規範 (Tokens)

| 動態 Token | 數值 | 適用情境 |
| :--- | :--- | :--- |
| `--dur-instant` | `100ms` | 按鈕 `:active` 按壓、即時顏色回饋 |
| `--dur-fast` | `160ms` | 下拉選單、提示框 (Tooltip)、微互動圖示 |
| `--dur-base` | `240ms` | 對話框進場 (Modal)、抽屜 (Drawer)、標籤切換 |
| `--dur-slow` | `400ms` | 區塊滾動進場 (Scroll Reveal)、大型內容展開 |
| `--dur-slower` | `640ms` | 頁面整體轉場、溫和漸變氛圍背景 |

### 曲線選擇 (Easing)
- **進入動畫 (Enter)**：使用 `cubic-bezier(0.05, 0.7, 0.1, 1)` 或 `ease-out`（起步極快，收尾緩慢穩定，給予即時響應感）。
- **退出動畫 (Exit)**：使用 `cubic-bezier(0.3, 0, 0.8, 0.15)` 或 `ease-in`（起步平順，加速離場）。
- **位移動畫 (Move / Morph)**：使用 `cubic-bezier(0.2, 0, 0, 1)`（標準平滑雙向曲線）。

---

## 三、四大動態實作分類標準

### 1. Text Animation（文字動態）
- **標題遮罩揭露 (Headline Mask Reveal)**：
  大標題使用 `overflow: hidden` 搭配內部行區塊 `translateY(8px)` -> `translateY(0)` 與淡入，營造高質感書籍扉頁感。
- **品牌重點底線展開 (Accent Underline)**：
  關鍵字詞下方的香檳金或鼠尾草綠飾線，進場時由左至右平順延展（`scaleX(0)` -> `scaleX(1)`，`transform-origin: left`）。

### 2. SVG Animation（SVG 描邊與品牌微互動）
- **官方 Logo 互動**：
  品牌四色路徑（深霧藍弧、柔霧藍括號、香檳金代碼斜線、香檳金星芒）在懸停時觸發細緻的微光脈動或微旋轉，非粗糙旋轉。
- **圖示懸停反饋**：
  箭頭圖示懸停向右平移 `2px`，引導學習者點擊。

### 3. Scroll Animation（滾動視差與區塊進場）
- **IntersectionObserver 驅動**：
  嚴禁在滾動事件中直接計算 DOM 位置。一律使用原生的 `IntersectionObserver` 進行視口檢測。
- **視口進場標準**：
  元素預設偏移不超過 `16px`（`translateY(16px)`），透明度從 `0` 變為 `1`，進場完成後自動解除監聽。
- **嚴格避免水平溢位**：
  禁止使用大角度旋轉或超大負邊距位移，防止手機端（320px~414px）產生水平滾動條。

### 4. UI Interactions（介面元件回饋）
- **按鈕 (Button)**：
  懸停上浮 `1px`，點擊縮小至 `97%`，支援滑鼠釋放時彈性復位。
- **卡片 (Card)**：
  淺藍灰邊框在懸停時平滑加深至深霧藍灰，搭配燕麥與奶油白背景的柔光陰影。
- **標籤與開關 (Tabs & Switches)**：
  活動指示條採用滑動過渡，非突兀切換。

---

## 四、無障礙規範 (WCAG AAA & Reduced Motion)

全站強制實施嚴格的減速模式偏好偵測：

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
    transform: none !important;
  }
  .fade-in-section,
  .reveal-scroll-fade,
  .reveal-scroll-up,
  .stagger-item {
    opacity: 1 !important;
    transform: none !important;
  }
}
```

- **降級呈現原則**：當動態效果被停用時，所有文字、圖片、按鈕與操作區塊必須 100% 完整清晰呈現，功能與視覺層次不受任何減損。

---

## 五、生命週期與資源清理規則

1. **Observer 清理**：任何自訂之 React Hook（如 `useScrollReveal`）在組件卸載（`useEffect` cleanup）時，必須呼叫 `observer.disconnect()`。
2. **計時器清理**：使用 `setTimeout` 或 `requestAnimationFrame` 進行階梯式（stagger）動畫時，組件卸載時必須 `clearTimeout` / `cancelAnimationFrame`。
3. **無全域污染**：動態樣式優先封裝於 `tokens.css` 與 `components.css` 的標準語意類別中，避免在多處組件中散落難以維護的 magic number。
