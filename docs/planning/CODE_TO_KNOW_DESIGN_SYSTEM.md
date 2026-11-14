# 碼上學｜CODE TO KNOW 品牌設計系統 (BRAND DESIGN SYSTEM)

- **產品全名**：碼上學 AI 智慧學習與教育科技平台
- **品牌口號**：碼上學，學無止境。 (Learn Beyond Limits.)
- **文件版本**：v1.0 (2026-11-14)
- **技術架構**：React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 SPA
- **設計理念**：專業學術、啟發式鷹架、沉穩大地色調、去模板化 (Anti-AI-Slop)、無障礙友善

---

## 一、品牌核心定位與設計理念

### 1. 核心定位 (Positioning)
CODE TO KNOW 不是泛娛樂化的速成學習網站，亦非千篇一律的 AI 自動生成模板。它是專為技能檢定、程式邏輯建構與現代資訊教育打造的沉浸式學習科技平台。

### 2. 視覺風格 (Visual Tone)
- **學術與權威 (Academic & Trustworthy)**：沉穩的深霧藍灰 (`#526B7B`) 與深石墨灰 (`#26343D`) 傳遞專業。
- **溫暖與啟發 (Warm & Enlightening)**：暖象牙白 (`#F5F2EA`) 與燕麥色 (`#EBE5D8`) 營造舒適無壓力的沉浸研讀氛圍。
- **啟發式高光 (Scaffolding Glow)**：沉穩香檳金 (`#BDA77E` / 文字專用 `#7C663D`) 點亮成就解鎖與核心概念。
- **生機與安全 (Growth & Sage)**：鼠尾草綠 (`#5A7D6C`) 標示進度通過、達標與良性回饋。

---

## 二、色彩系統 Design Tokens

### 1. 品牌原創色盤 (Brand Palette)
```css
/* 基底與背景層 */
--color-brand-ivory: #F5F2EA;       /* 暖象牙白 (主背景基底) */
--color-brand-cream: #FAF8F2;       /* 奶油白 (卡片高亮底色) */
--color-brand-oat: #EBE5D8;         /* 燕麥色 (區塊柔和底色) */
--color-brand-sand: #D9D2C4;        /* 自然米灰 (次級中性層) */

/* 結構與主要品牌色 */
--color-brand-deep-slate: #526B7B;  /* 深霧藍灰 (主按鈕、權威結構) */
--color-brand-slate: #8FA9B8;       /* 柔霧藍 (輔助引導圖形) */
--color-brand-ice-slate: #D9E2EA;   /* 淺藍灰 (邊框、柔和分隔線) */
--color-brand-charcoal: #26343D;    /* 深石墨灰 (高對比標題與正文) */

/* 啟發與成就高光色 */
--color-brand-gold: #BDA77E;        /* 香檳金 (裝飾、邊界、星星徽章) */
--color-brand-gold-text: #7C663D;   /* 高對比香檳金文字 (符合 WCAG AA 4.5:1) */
--color-brand-gold-hover: #A8936B;  /* 香檳金懸停態 */

/* 成長與學術自然色 */
--color-brand-sage: #5A7D6C;        /* 鼠尾草綠 (通過、達標、安全感) */
--color-brand-sage-light: #EBF2EE;  /* 鼠尾草綠淺底 (徽章底色) */
```

### 2. 語意化表面與文字層級 (Semantic Surfaces & Typography)
```css
--surface-base: var(--color-brand-ivory);
--surface-raised: #FFFFFF;
--surface-sunken: #EFECE3;

--text-primary: var(--color-brand-charcoal);
--text-secondary: var(--color-brand-deep-slate);
--text-muted: #6C7F8C;
--text-gold: var(--color-brand-gold-text);
```

---

## 三、字體與文字階層 (Typography Hierarchy)

### 1. 字型家族 (Font Families)
- **正體中文字型**：`"Noto Sans TC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- **英文字型**：`"Inter", -apple-system, BlinkMacSystemFont, sans-serif`
- **程式碼等寬字型**：`"JetBrains Mono", Consolas, "Courier New", monospace`

### 2. 字級規範 (Font Sizes & Line Heights)
| 角色 | 變數 | 尺寸 (rem/px) | 行高 | 粗細 | 適用情境 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | `--font-size-display` | `3.75rem (60px)` | 1.15 | 700 / 800 | 首頁 Hero 主視覺大字 |
| **H1** | `--font-size-3xl` | `2.75rem (44px)` | 1.35 | 700 | 各大頁面主要主標題 |
| **H2** | `--font-size-2xl` | `2.0rem (32px)` | 1.35 | 600 / 700 | 區塊標題、題組大標 |
| **H3** | `--font-size-xl` | `1.5rem (24px)` | 1.35 | 600 | 卡片標題、題目內容 |
| **Body (正文)**| `--font-size-base` | `1.0rem (16px)` | 1.60 | 400 | 閱讀內文、說明解析 |
| **Caption/Tag**| `--font-size-xs` | `0.75rem (12px)`| 1.45 | 500 / 600 | 徽章標籤、微小資訊 |

---

## 四、間距、圓角與陰影系統 (Spacing, Radius & Shadows)

### 1. 8-Point 間距尺規 (Spacing)
- `--space-1` (4px), `--space-2` (8px), `--space-3` (12px), `--space-4` (16px)
- `--space-6` (24px), `--space-8` (32px), `--space-12` (48px), `--space-16` (64px)
- **桌面邊界**：`--gutter-desktop: 32px`
- **行動邊界**：`--gutter-mobile: 16px`

### 2. 圓角系統 (Radius)
- `--radius-xs` (4px)：微型標籤、輸入框小元素。
- `--radius-sm` (6px)：按鈕、提示晶片。
- `--radius-md` (10px)：一般資訊卡片、彈窗內容器。
- `--radius-lg` (16px)：大型卡片、主對話視窗。
- `--radius-full` (9999px)：圓形按鈕、Pill 膠囊標籤。

### 3. 柔和陰影系統 (Elevation Shadows)
```css
--shadow-subtle: 0 1px 2px rgba(38, 52, 61, 0.04);
--shadow-sm: 0 2px 4px rgba(38, 52, 61, 0.05), 0 1px 2px rgba(38, 52, 61, 0.03);
--shadow-md: 0 4px 12px rgba(38, 52, 61, 0.06), 0 2px 4px rgba(38, 52, 61, 0.03);
--shadow-lg: 0 12px 28px rgba(38, 52, 61, 0.08);
--shadow-gold-spark: 0 0 24px rgba(189, 167, 126, 0.35);
```

---

## 五、共用元件規格與行為規範 (Component Standards)

### 1. 按鈕 (Buttons)
- **Primary**：背景 `--color-brand-deep-slate`，文字白色，Hover 加深，觸控 `min-height: 44px`。
- **Secondary / Outline**：白底搭配 `--border-default`，文字 `--color-brand-deep-slate`。
- **Gold Accent**：邊框 `--color-brand-gold`，文字 `--color-brand-gold-text`。
- **防墜行防護**：主要按鈕必備 `.btn-nowrap`，杜絕單字墜行。
- **鍵盤焦點**：`:focus-visible` 呈現 2px 香檳金外框，`outline-offset: 2px`。

### 2. 卡片 (Cards & StatCard)
- 統一白底或奶油白底 (`--color-brand-cream`)。
- 邊框採用柔和 `--border-default`，嚴禁過黑邊框。
- 支援 `.interactive-card`，懸停具備 `-2px` 平滑微浮動與高階陰影回饋。

### 3. 空狀態 (EmptyState)
- 虛線邊框 `1px dashed var(--border-strong)`。
- 語意標籤宣告 `role="status"` 與 `aria-live="polite"`。
- 一律提供具體下一步動作指引（如「清除篩選並重設」）。

---

## 六、反制式 AI 模板設計原則 (Anti-AI-Slop Guidelines)

1. **嚴禁紫藍混色霓虹漸層**：堅持溫潤、學術、深度的暖象牙白與深霧藍灰。
2. **拒絕無意義的裝飾性 Emoji**：正式功能一律使用 Lucide 向量圖示。
3. **避免千篇一律的三欄平鋪卡片**：依照內容特性選擇主從對比雙欄、階梯式列表或 2×2 網格。
4. **誠實呈現，嚴禁虛假評價與假數據**：示範模式明確標註 `Demo Data`，不捏造不存在的學員見證。
5. **遵循無障礙減速動畫規範**：全站主動適配 `@media (prefers-reduced-motion: reduce)`。
