# CODE TO KNOW｜第三輪全站大量開發執行報告 (WEBSITE SKILLS BATCH 3 REPORT)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **報告日期**：2026-11-14
- **基準版本**：Phase 14（進度基準鎖定：`45.961878%`，AUTH-03 保持 `BLOCKED`）
- **核心方針**：連續大批量推進全站 SEO 基礎建設、文案與內容品質標準、無障礙新手引導與三環境相容性檢驗。

---

## 一、使用的 Skills 與實際應用清單

| Skill 名稱 | 來源目錄 | 實際應用於 CODE TO KNOW 之具體落實 |
| :--- | :--- | :--- |
| `seo-audit` & `ai-seo` | `.agents/skills/seo-audit/` | 檢查與重構 `frontend/index.html` 標籤層級、Meta Description、Canonical、Open Graph、Twitter Card，並建立 `robots.txt` 與 `sitemap.xml`。 |
| `schema` | `.agents/skills/schema/` | 於首頁注入真實符合平台現況的 Schema.org `WebSite` 與 `Organization` JSON-LD 結構化資料，不捏造虛假評價。 |
| `programmatic-seo` | `.agents/skills/programmatic-seo/` | 建立 `frontend/src/hooks/useRouteSeo.ts`，依據目前路由切換動態覆寫 document.title 與 meta description，解決 SPA 頁面標題單一問題。 |
| `humanizer` & `copywriting` | `.agents/skills/humanizer/` | 審核全站按鈕命名與教學指引，建立 `docs/planning/WEBSITE_CONTENT_STYLE_GUIDE.md`，消除 AI 腔調與假名詞。 |
| `onboarding` & `web-design-guidelines` | `.agents/skills/onboarding/` | 升級 `frontend/src/components/GameBriefingModal.tsx`，加入鍵盤 Escape 鍵監聽、按鈕自動 Focus 與可存取焦點捕捉。 |
| `release-check` | `.agents/skills/release-check/` | 驗證三環境（本機 Vite、GitHub Pages、Vercel）路徑相容性，執行完整 154 場景 RWD 與 187 項 Vitest 回歸。 |

---

## 二、各批次具體改善成果

### 1. 全站 SEO 基礎建設與搜尋可見度
- **全站主要 Meta 標籤與社交分享卡**：
  - 更新 `frontend/index.html`，加入 Open Graph 與 Twitter Card 標籤，設定標準 Canonical URL `https://code-to-know.com/`。
- **Schema.org 結構化資料 (JSON-LD)**：
  - 注入 `WebSite` 與 `Organization` 規格，明確標示品牌名稱「碼上學｜CODE TO KNOW」與「碼上學，學無止境。 Learn Beyond Limits.」。
- **搜尋引擎爬蟲指引**：
  - 建立 `frontend/public/robots.txt`，允許全站索引並宣告 Sitemap 路徑。
  - 建立 `frontend/public/sitemap.xml`，涵蓋首頁、證照中心、學科測驗、全真模考、術科導引、沙盒編輯器與遊戲中心等主要公開路由。
- **SPA 動態路由 SEO**：
  - 於 `frontend/src/hooks/useRouteSeo.ts` 建立 `ROUTE_SEO_MAP`，並在 `AppContent` 內掛載監聽，使使用者在切換考科或遊戲時，瀏覽器分頁標題與 Description 能即時動態對齊該功能定位。

### 2. 全站文案與內容品質標準
- 產出兼具教育專業與品牌承諾的 [WEBSITE_CONTENT_STYLE_GUIDE.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/planning/WEBSITE_CONTENT_STYLE_GUIDE.md)。
- 規範用詞嚴格依循台灣在地用法（「程式碼」、「專案」、「軟體」、「介面」），杜絕「代碼」、「項目」、「軟件」等非台灣習慣詞彙。
- 嚴格要求未連接後端之功能標示 `✦ 前端展示示範資料庫 (Demo Data)`，不誇大未就緒的雲端同步服務。

### 3. 新手引導與彈窗操作無障礙
- 優化五款遊戲共用之新手說明彈窗 `GameBriefingModal.tsx`：
  - 開啟時自動將 Focus 導向主要動作按鈕「我瞭解了，開始挑戰」。
  - 支援全域 `Escape` 鍵快速關閉彈窗，改善鍵盤操作流暢度。
  - 按鈕套用 `.btn-nowrap`，防止小螢幕文字斷裂。

### 4. 三環境相容性檢查 (Local Vite / GitHub Pages / Vercel)
- **本機 Vite 開發版**：`port: 3000`，`base: './'`，一切熱更新與路由均正常。
- **GitHub Pages 展示版**：`base: process.env.VITE_BASE_PATH || './'`，支援 HashRouter，靜態資源採用相對路徑 `./images/...`，能無縫適應 `/CODE-TO-KNOW/` 子目錄。
- **Vercel 生產版**：支援根目錄構建與 SPA 重定向，輸出目錄為 `dist/`，相容生產環境標準部署。

---

## 三、修改與新增之檔案清單

1. `frontend/index.html`（SEO、Open Graph、Twitter Card、Schema.org JSON-LD）
2. `frontend/public/robots.txt`（新增，搜尋引擎爬蟲指引）
3. `frontend/public/sitemap.xml`（新增，主要公開路由索引）
4. `frontend/src/hooks/useRouteSeo.ts`（新增，動態路由 SEO 監聽 Hook）
5. `frontend/src/app/App.tsx`（掛載動態 SEO 監聽）
6. `frontend/src/components/GameBriefingModal.tsx`（Escape 鍵支援、自動 Focus 管理）
7. `docs/planning/WEBSITE_CONTENT_STYLE_GUIDE.md`（新增，品牌文案規範文件）
8. `docs/development/WEBSITE_SKILLS_IMPLEMENTATION_ROADMAP.md`（更新）
9. `docs/development/WEBSITE_SKILLS_BATCH3_REPORT.md`（本報告）

---

## 四、回歸驗證與效能數據

| 檢驗項目 | 工具 / 命令 | 執行結果 | 判定 |
| :--- | :--- | :--- | :--- |
| **TypeScript 型別檢查** | `tsc --noEmit` (via build) | 0 個型別錯誤 | **PASS** |
| **生產環境 Bundle 打包** | `npm --prefix frontend run build` | 1.95 秒完成，0 警告 | **PASS** |
| **主 Bundle 體積** | `dist/assets/index-*.js` | 470.85 kB (Gzip: 142.18 kB) | **OPTIMAL** |
| **全套 Vitest 單元/整合測試** | `npx vitest run frontend/tests` | **20 / 20 檔案通過，187 / 187 測試通過** | **PASS** |
| **完整 RWD 實機矩陣 (14 頁面 × 11 視窗)** | Chrome CDP `verify-154-matrix.mjs` | **154 / 154 全部通過，0px 溢出** | **PASS** |

---

## 五、約束邊界檢查

- [x] 未執行任何 `git commit` 或 `git push`。
- [x] 未部署至 GitHub Pages 或 Vercel。
- [x] 未修改任何後端 API、Prisma Schema、資料庫或 `.env`。
- [x] AUTH-03 維持 `BLOCKED`。
- [x] 進度基準嚴格鎖定在 `45.961878%`。
- [x] 官方題庫與術科資料零變更。
- [x] Phase 14 Batch 5 背景測試任務未受干擾。
