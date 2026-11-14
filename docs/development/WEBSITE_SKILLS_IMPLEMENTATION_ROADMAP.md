# CODE TO KNOW｜網站開發與技能優化執行計畫 (WEBSITE SKILLS IMPLEMENTATION ROADMAP)

- **專案名稱**：碼上學｜CODE TO KNOW（碼上學 AI 智慧學習與教育科技平台）
- **標語**：碼上學，學無止境。 (Learn Beyond Limits.)
- **狀態**：Batch 1、Batch 2、Batch 3、Batch 4 (技能安裝)、第四輪 A (Design System) & 第四輪 B+C (UI/UX 視覺、動態微互動與互動體驗完整升級) 全部執行完成。進度基準鎖定在 `45.961878%`，AUTH-03 保持 `BLOCKED`。

---

## 一、累計成果架構與 Skills 矩陣分工

| 領域 | 負責 Skills | 核心成果與落實內容 | 完成狀態 |
| :--- | :--- | :--- | :--- |
| **SEO 基礎建設** | `seo-audit`, `ai-seo`, `schema`, `programmatic-seo` | 建立 `robots.txt`、`sitemap.xml`、Schema.org (WebSite, Organization)、動態 `useRouteSeo` hook | **已完成** |
| **文案與內容品質** | `humanizer`, `copywriting`, `copy-editing`, `content-strategy` | 產出 `WEBSITE_CONTENT_STYLE_GUIDE.md`，統整繁體中文、技能檢定稱謂與避免誇大未就緒功能 | **已完成** |
| **新手引導與無障礙** | `onboarding`, `signup`, `activation`, `web-design-guidelines` | 彈窗（GameBriefingModal、AuthModal）實作 Escape 鍵關閉、焦點自動捕捉、`:focus-visible` 2px 暖金外框 | **已完成** |
| **React 架構與模式** | `vercel-react-best-practices`, `vercel-composition-patterns` | 建立共用元件庫 (`StatCard`, `EmptyState`, `PageHeader`)，路由動態 SEO 監聽，精簡 inline JSX | **已完成** |
| **CSS 與全裝置 RWD** | `web-design-guidelines` | 提取重複 inline grid、統整斷點、全矩陣 14 頁面 × 11 視窗 = 154 場景 100% 通過（0px 溢出） | **已完成** |
| **UI / Web Design 能力整備** | `web-design-engineer`, `frontend-design`, `web-design-guidelines`, `emil-design-eng`, `design-taste-frontend`, `ui-ux-pro-max`, `impeccable` | 7 個核心設計 Skills 上游核實、安全安裝、衝突排查與整合指南產出 (`DESIGN_SKILLS_INTEGRATION_GUIDE.md`) | **已完成** |
| **全站 Design System 基礎工程** | `web-design-engineer`, `frontend-design`, `ui-ux-pro-max`, `design-taste-frontend` | 20 路由設計盤點、擴充鼠尾草綠/燕麥色/奶油白 Tokens、反套版 AI-Slop 守則、產出 `CODE_TO_KNOW_DESIGN_SYSTEM.md` | **第四輪 A 完成** |
| **全站 UI/UX 視覺與動態微互動** | `emil-design-eng`, `web-design-engineer`, `design-taste-frontend`, `impeccable` | 導入 `:active` 50ms 觸感按鈕回饋、平滑滾動進場 `.fade-in-section`、支援 Reduced Motion、產出全套四份 B+C 交付文件 | **第四輪 B+C 完成** |
| **端對端品質驗收** | `release-check`, `bug-fixing` | TypeScript 0 錯誤、Vite 構建 2.06s、Vitest 20 檔 187 測試全綠、154 場景 RWD 實機矩陣三度全數 0px 通過 | **已完成** |

---

## 二、邊界約束合規聲明

- 零 `git commit` / 零 `git push` / 零部署。
- 零資料庫更動，AUTH-03 保持 `BLOCKED`。
- 題庫 605 題與術科 5 題組數據 100% 原始保存。
- Phase 14 Batch 5 背景測試任務 (`task-13717`) 受到完整隔離保護。
- 正式進度基準嚴格維持 `45.961878%`（未擅自增加進度）。
