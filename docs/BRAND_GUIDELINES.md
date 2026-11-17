# 碼上學｜CODE TO KNOW 品牌視覺識別與設計系統規範指南 (Brand Guidelines)

**文件版本：** v1.0.0 (Phase 5 Canonical Edition)  
**發布日期：** 2026-11-16  
**權威維護：** CODE TO KNOW 品牌與設計工程小組  
**對應 UID：** `P17-MED-001`, `P17-MED-002`, `P17-MED-003`, `P17-MED-004`  

---

## 一、品牌核心定位與精神 (Brand Identity & Mission)

### 1. 品牌命名與標語
- **中文品牌名稱：** 碼上學
- **英文品牌名稱：** CODE TO KNOW
- **完整正式全銜：** 碼上學 AI 智慧學習與教育科技平台
- **中文核心標語（Slogan）：** 碼上學，學無止境。
- **英文標語（English Tagline）：** Learn Beyond Limits.
- **品牌使命：** 以蘇格拉底式 AI 引導輔助獨立思考，不直接提供破題答案；結合學術知識、真實術科試題與五大教育遊戲，打造專業、沉穩、溫潤且富啟發性的國際級教育科技體驗。

---

## 二、色彩系統規範 (Brand Color Tokens)

CODE TO KNOW 捨棄喧鬧的高飽和度霓虹色彩，採用低調、典雅、溫暖且具備學術沉澱感的自然調和色盤（Nature & Academic Palette）。

### 1. 核心品牌色盤 (Core Palette)
| 色彩名稱 | 變數名稱 | 色碼 HEX | 適用場景與語意 | WCAG AA 對比標準 |
| :--- | :--- | :--- | :--- | :--- |
| **暖象牙白 (Warm Ivory)** | `--color-brand-ivory` | `#F5F2EA` | 平台主背景、呼吸底層、卡片外框基底 | 淺色基準 |
| **深霧藍灰 (Deep Slate)** | `--color-brand-deep-slate` | `#526B7B` | 次級標題、主按鈕、深色元件、權威定位 | 對比比值 > 4.8:1 |
| **柔霧藍 (Misty Slate)** | `--color-brand-slate` | `#8FA9B8` | 圖形引導、輔助線條、次要圖標 | 輔助裝飾 |
| **淺藍灰 (Ice Slate)** | `--color-brand-ice-slate` | `#D9E2EA` | 容器外框、卡片邊框、柔和分隔線 | 微細邊界 |
| **自然米灰 (Natural Sand)** | `--color-brand-sand` | `#D9D2C4` | 次級卡片背景、沉澱襯底、微對比層 | 溫潤襯托 |
| **柔霧裸粉 (Muted Nude Pink)**| `--color-brand-pink` | `#E8DCD8` | 成就解鎖微光、典雅高亮點綴 | 溫潤點睛 |
| **沉穩香檳金 (Champagne Gold)** | `--color-brand-gold` | `#BDA77E` | 啟發指示、徽章金星、卓越標記 | 焦點強調 |
| **高對比金 (Gold Text)** | `--color-brand-gold-text` | `#7C663D` | 淺底金色文字、高對比標籤 | 對比比值 > 4.5:1 |
| **深石墨灰 (Deep Charcoal)** | `--color-brand-charcoal` | `#26343D` | 主要標題、高易讀性正文、極深色外框 | 對比比值 > 11.2:1 |

### 2. 自然生機與卡片輔助色 (Nature Accents)
- **鼠尾草綠 (Sage Green, `#5A7D6C` / 淺底 `#EBF2EE`)：** 代表答題正確、代碼通過、穩定進步。
- **燕麥色 (Oat Beige, `#EBE5D8`)：** 用於次級區塊底色，降低純白反光對眼睛的疲勞度。
- **奶油白 (Cream White, `#FAF8F2`)：** 用於核心程式碼與題型閱讀卡片底色。

---

## 三、排版與字體規範 (Typography)

### 1. 字體系列 (Font Family)
- **繁體中文字體：** `Noto Sans TC`，備選 `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`。
- **英文字體：** `Inter`，備選 `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`。
- **程式碼與等寬字體：** `JetBrains Mono`、`Fira Code`、`Consolas`。

### 2. 字級階層與行距
- **Display 巨型標題：** `3.75rem (60px)` / 行距 `1.15` / 字距 `-0.025em`（首頁 Hero 核心口號）
- **H1 主頁大標題：** `2.75rem (44px)` / 行距 `1.2` / 字距 `-0.02em`
- **H2 區塊主要標題：** `2.0rem (32px)` / 行距 `1.3`
- **H3 卡片與模組標題：** `1.5rem (24px)` / 行距 `1.4`
- **內文正文（Body）：** `1.0rem (16px)` / 行距 `1.6`
- **註解與次級文字：** `0.875rem (14px)` / 行距 `1.5`
- **微型標籤（Badge）：** `0.75rem (12px)` / 行距 `1.4` / 字距 `0.05em`

---

## 四、標誌規範與安全邊距 (Logo Guidelines)

### 1. Logo 構成
- **品牌圖形：** 幾何對角漸變象徵思維階梯與開啟的代碼書本。
- **標準字組合：** 左側圖形標誌，右側中文「碼上學」搭配次行英文「CODE TO KNOW」。

### 2. 安全保護邊距 (Clear Space)
- 標誌周圍必須保留至少 `X` 的空白區域（`X` 為標誌圖案高度的 50%）。
- 禁止任何文字、圖形、按鈕侵入安全區域。

### 3. 禁止使用事項
- 嚴禁扭曲、傾斜或改變標誌長寬比例。
- 嚴禁自行置換未核准的高彩度高反差顏色（如霓虹紅、亮綠）。
- 嚴禁在未經核准的雜亂背景上放置無外框標誌。

---

## 五、AI 品牌語氣與文案哲學 (Tone of Voice)

1. **謙遜而啟發（Socratic & Humble）：**
   - 不吹噓「AI 無所不能」，嚴禁使用「地表最強」、「一秒學會」等誇張營銷話術。
   - 始終維持教學者與思維導師的謙遜身段，著重於引導學生自發性推理。
2. **客觀與嚴謹（Objective & Trustworthy）：**
   - 遇到未連線商用 LLM 服務時，誠實揭露 `[OFFLINE-RULE-FALLBACK]` 或 `[DEMO]` 標記，絕不偽造在線對話。
3. **拒絕 AI 行話套路（No AI Cliches）：**
   - 嚴格杜絕「這不是 X，而是 Y」對比句型。
   - 嚴格杜絕三段式假高潮、空洞的「探索無窮可能」等陳腔濫調。
   - 用平實、具體的教學術語解釋技術本質（如「Document Flow 正常文件排版流」、「外邊距塌陷」）。

---

## 六、無障礙與響應式原則 (Accessibility & Responsiveness)

- **對比度標準：** 所有重要資訊與正文嚴格遵循 WCAG 2.1 AA 級標準（對比度至少 4.5:1）。
- **觸控熱區：** 移動端按鈕最小點擊範圍為 `44px × 44px`。
- **響應式斷點覆蓋：**
  - 手機直向：`320px`～`480px`
  - 平板直向與手機橫向：`768px`
  - 平板橫向與小筆電：`1024px`
  - 桌面寬螢幕：`1280px`～`1920px`
