# CODE TO KNOW｜UI / Web Design Agent Skills 整合與使用指引 (DESIGN SKILLS INTEGRATION GUIDE)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **發布日期**：2026-11-14
- **專案架構**：React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 (React SPA，非 Next.js / 非 RSC)
- **存放目錄**：`.agents/skills/`

---

## 一、7 個 UI / Web Design Skills 總覽與上游來源

| # | Skill 名稱 | 上游 Repository | 授權 (LICENSE) | 核心定位與職責 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `web-design-engineer` *(原 web-design-skill)* | `ConardLi/garden-skills` | MIT | **全功能視覺工程師**：將需求轉化為高質感、具備教育科技調性的完整前端頁面、畫布與展示區塊。 |
| 2 | `frontend-design` | `anthropics/skills` | Apache-2.0 | **去 AI 套版化 (Anti-Slop) 規劃**：在寫 code 前先強制擬定 4~6 色票、字級階層與 ASCII 佈局，拒絕平庸千篇一律的模板。 |
| 3 | `web-design-guidelines` | `vercel-labs/agent-skills` | Apache-2.0 | **互動品質與無障礙基線**：審核 44px 觸控標靶、鍵盤 Focus 可見性、消除橫向破版與 WCAG 對比度規範。 |
| 4 | `emil-design-eng` | `emilkowalski/skills` | MIT | **微互動與動效工藝**：精雕細琢按鈕回饋、彈窗縮放、CSS cubic-bezier 曲線與流暢轉場體驗。 |
| 5 | `design-taste-frontend` *(原 taste-skill)* | `Leonxlnx/taste-skill` | MIT | **審美與排版節奏**：參照頂尖現代科技企業網站，把控視覺留白、字體節奏與高級感。 |
| 6 | `ui-ux-pro-max` | `nextlevelbuilder/ui-ux-pro-max-skill` | MIT | **UI/UX 模式與設計系統庫**：提供 Glassmorphism、Bento Grid、Dark Mode 等主流風格知識庫與佈局藍圖。 |
| 7 | `impeccable` | `pbakaus/impeccable` | MIT | **介面打磨與設計詞彙**：提供精準的 design vocabulary（shape, craft, polish, typeset）引導 AI 進行細節審查。 |

---

## 二、CODE TO KNOW 技術架構相容性與使用限制

CODE TO KNOW 目前採用 **Vite + React SPA (客戶端渲染)** 架構，在使用上述 Skills 時必須嚴格遵守以下限制：

1. **不支援 Next.js 專用特性**：
   - 忽略 Skills 中提及的 `next/image`、`next/font`、Server Components (`'use server'`) 或 App Router API。
   - 圖片資源一律使用原生 `<img>` 搭配 Vite 靜態路徑或相對路徑。
2. **不支援 React 19 實驗性 Hook**：
   - 專案維持 React 18.3.1，不引入 `useActionState`、`useFormStatus` 等 React 19 專用寫法。
3. **無 Tailwind / shadcn/ui 依賴**：
   - 專案使用統一的 `components.css` 與 CSS Variables (`--color-brand-*`, `--font-*`, `--space-*`)。
   - 任何 Skill 產出的 CSS 必須適應專案既有 CSS 變數體系，禁止強行安裝 Tailwind 或全域套件。

---

## 三、實務任務分工與選用原則 (Workflow & Coordination)

為避免多個設計 Skills 同時介入產生互相衝突的樣式或互相打架的指令，請依任務類型指派**單一主力 Skill**：

```
[任務類型]                              [主力 Skill]               [輔助檢驗 Skill]
-----------------------------------------------------------------------------------------
1. 新頁面初稿或全新模組佈局規劃     →  frontend-design         →  ui-ux-pro-max (風格參考)
2. 全站或特定頁面之視覺美感升級     →  web-design-engineer     →  design-taste-frontend
3. 按鈕、彈窗、Toast 之動態反饋    →  emil-design-eng         →  web-design-guidelines (減速動畫)
4. 交付前的全站設計稽核與打磨       →  impeccable              →  web-design-guidelines (A11y 標竿)
```

---

## 四、安全與維護原則

1. **免額外全域套件**：Skills 均以純 Markdown `SKILL.md` 指引驅動，不強制安裝 CLI 或全域守護進程。
2. **零環境干擾**：不讀取、不要求敏感 API Key，不觸碰後端與資料庫。
3. **版本更新**：若未來上游釋出新版，透過標準 `npx skills add <repo>@<skill>` 進行無損複寫更新。
