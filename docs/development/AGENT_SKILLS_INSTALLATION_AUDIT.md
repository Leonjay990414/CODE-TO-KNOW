# CODE TO KNOW 碼上學｜Agent Skills 整合安裝與安全審查報告

- **專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）
- **執行環境**：Antigravity IDE (Windows PowerShell, Python 3.14.7, Node.js 24)
- **安裝範圍**：專案層級 `.agents/skills/`、`.agents/rules/`、`.agents/workflows/`
- **報告日期**：2026-11-14
- **負責目標**：全面檢查、安裝並驗證 5 大來源的 Agent Skills（行銷成長、文案去 AI 感、架構圖譜、提示庫、獨立開發者實踐）
- **AUTH-03 狀態**：`BLOCKED`（嚴格保持，零資料庫/後端連線）
- **正式進度基準**：`45.961878%`（嚴格維持法定基準）

---

## 一、安裝來源與官方網址

| 代號 | 來源名稱 | 官方儲存庫 / 來源網址 | 授權條款 | 專案定位 |
| :--- | :--- | :--- | :--- | :--- |
| **A** | **Marketing Skills** | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | MIT License | 全方位產品行銷、SEO、文案、轉換率優化（CRO）與增長策略 |
| **B** | **Humanizer** | [blader/humanizer](https://github.com/blader/humanizer) | MIT License | 消除 AI 生成腔調、保留繁體中文自然流暢表達與專業事實 |
| **C** | **Graphify** | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) | Apache-2.0 | 程式碼庫與架構知識圖譜生成、關聯走訪與查詢（PyPI: `graphifyy`） |
| **D** | **prompts.chat** | [f/prompts.chat](https://github.com/f/prompts.chat) | MIT License | 提示詞查找、範本探索與提示優化檢索 |
| **E** | **Chinese Indie Dev** | [1c7/chinese-independent-developer](https://github.com/1c7/chinese-independent-developer) | 依原專案規範 | 中國獨立開發者出海案例、商業變現先例與營運參考 |

---

## 二、每個來源實際找到的 Skill 數量與處置統計

| 來源代號 | 來源名稱 | 找到 Skill 總數 | 成功安裝數 | 未安裝 / 延後數 | 處置狀態 | 備註說明 |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **A** | Marketing Skills | **53** | **53** | 0 | `FORMAT_VALID` | 53 款行銷技能全數安裝，保留完整 `references`、`assets` 與 `evals` |
| **B** | Humanizer | **1** | **1** | 0 | `FORMAT_VALID` | 安裝 v4.0.0 完整版，支援繁體中文自然文案改寫 |
| **C** | Graphify | **1** | **1** | 0 | `FORMAT_VALID` | 官方 PyPI `graphifyy` 套件安裝完成，佈署 Antigravity 專用規則與工作流 |
| **D** | prompts.chat | **4** | 0 | **4** | `BLOCKED` (待評估) | 2 款為 prompts.chat 官網內部建構工具；2 款（`prompt-lookup`、`skill-lookup`）強依賴外部 MCP 伺服器，依規範暫不安裝遠端連線 |
| **E** | Chinese Indie Dev| **1** | 0 | **1** | `BLOCKED` (專屬維護) | `chinese-indie-dev` 為原作者 1c7 專屬 GitHub 倉庫工單審查工具，非通用 Agent 技能，依規定不納入安裝，保留參考連結 |
| **合計** | **全來源彙總** | **60** | **55** | **5** | **55 成功安裝** | 另有本專案既有 9 款技能完好保留，目前全專案共有 64 款技能 |

---

## 三、成功安裝的 Skill 清單（共 55 款新技能）

### 1. Marketing Skills（53 款）
1. `ab-testing`：A/B 測試設計、假設驗證與顯著性分析
2. `ad-creative`：廣告素材文案與視覺概念設計
3. `ads`：付費廣告投放策略與架構（Google / Meta / LinkedIn）
4. `ai-seo`：AI 搜尋引擎最佳化（AEO / GEO / 語意搜尋）
5. `analytics`：行銷與轉換成效分析指標（GA4 / PostHog）
6. `aso`：應用程式商店最佳化（App Store Optimization）
7. `attribution`：多觸點行銷歸因模型（Attribution Modeling）
8. `churn-prevention`：流失預防、取消流程挽留與流失預警
9. `co-marketing`：跨品牌聯合行銷與合作夥伴推廣
10. `cold-email`：商務陌生開發郵件架構與個人化開頭
11. `community-marketing`：社群經營、Discord / 討論區活躍度建立
12. `competitor-profiling`：競品畫像建立與優缺點矩陣分析
13. `competitors`：競品監控、差異化定位與反擊策略
14. `content-strategy`：內容行銷策略、主題集群與編輯行事曆
15. `conversion-tracking`：轉換追蹤事件設定與像素驗證
16. `copy-editing`：文案校對、精簡文字與可讀性評估
17. `copywriting`：行銷核心文案、痛點激發與行動呼籲（CTA）
18. `cro`：著陸頁與產品頁轉換率優化（Conversion Rate Optimization）
19. `customer-research`：客戶深度訪談、問卷分析與痛點萃取
20. `directory-submissions`：產品目錄提交（Product Hunt、目錄站索引）
21. `emails`：電子郵件行銷旅程、歡迎信序列與電子報策展
22. `events`：線上研討會（Webinar）與發布會活動策劃
23. `free-tools`：工程行銷工具（Engineering-as-Marketing）、計算機與免費工具引流
24. `image`：行銷配圖概念規劃、視覺調性與社群圖片指引
25. `influencer-marketing`：KOL / 創作者合作與贊助談判指南
26. `launch`：新產品上線發布策略、預熱期、上線日作戰手冊
27. `lead-magnets`：潛在客戶磁鐵設計（電子書、白皮書、模板）
28. `link-building`：反向連結建置、數位公關與外部引用建立
29. `marketing-council`：行銷專家諮詢委員會多角度沙盤推演
30. `marketing-ideas`：增長點子頭腦風暴與 ICE 優先級打分
31. `marketing-loops`：病毒循環與產品內建自增長閉環
32. `marketing-plan`：季度與年度行銷計畫全景規劃
33. `marketing-psychology`：行銷心理學原理（社會認同、稀缺性、錨定效應）
34. `offers`：產品包裝報價策略、不可拒絕的價值主張
35. `onboarding`：新手引導流程優化、Time-to-Value 縮短
36. `paywalls`：付費牆架構、升級觸發點與免費/付費界限設計
37. `popups`：彈窗時機與觸發條件設計、退場意圖捕捉
38. `pricing`：SaaS / 教育定價策略、分層定價與心理定價
39. `product-marketing`：產品行銷基礎定位（所有行銷技能之核心起點）
40. `programmatic-seo`：程式化 SEO、大規模模板化頁面規劃
41. `prospecting`：高價值潛在客戶篩選與線索挖掘
42. `public-relations`：新聞稿撰寫、媒體外聯與公關故事包裝
43. `referrals`：推薦邀請計畫設計、雙向獎勵機制
44. `reverse-engineer-marketing`：競品逆向工程、行銷技術棧剖析
45. `revops`：營收運營（Revenue Operations）流程與工具鏈打通
46. `sales-enablement`：銷售賦能材料、產品手冊、戰鬥卡（Battlecard）
47. `schema`：結構化資料標記（JSON-LD、Schema.org）
48. `seo-audit`：技術 SEO 稽核、索引狀態、Core Web Vitals 改善
49. `signup`：註冊表單轉換優化、降低註冊摩擦力
50. `site-architecture`：網站架構與內部連結層級規劃
51. `sms`：簡訊行銷、推播通知與短文案提醒
52. `social`：社群媒體發布策略（X、LinkedIn、Threads、FB）
53. `video`：短影音與產品示範影片腳本結構

### 2. Humanizer（1 款）
54. `humanizer`：移除 26 種典型 AI 生成腔調（如過度並列、對仗排比、空洞陳詞、刻意破折號），改寫為真誠自然的人類文案，強化繁體中文在地化自然度。

### 3. Graphify（1 款 + 規則 + 工作流）
55. `graphify`：將程式碼庫解析為知識圖譜、神經節點分析與跨檔案架構查詢。
   - 伴隨規則：`.agents/rules/graphify.md`（僅在 `graphify-out/` 存在時自動激活，不干擾既有 01~07 規則）
   - 伴隨工作流：`.agents/workflows/graphify.md`

---

## 四、未安裝的 Skill 與詳細原因

| 來源 | Skill 名稱 | 未安裝原因分類 | 深入技術分析與決定理由 |
| :--- | :--- | :--- | :--- |
| **prompts.chat** | `book-translation` | `NOT_APPLICABLE` | 專為翻譯 `prompts.chat` 官方網站電子書 `src/content/book/` 之內部工具，非教育平台可用之通用技能。 |
| **prompts.chat** | `widget-generator` | `NOT_APPLICABLE` | 專為生成 `prompts.chat` 官網贊助商卡片/Widget 之內部外掛生成器，與當前專案無關。 |
| **prompts.chat** | `prompt-lookup` | `BLOCKED` (依賴遠端 MCP) | 必須依賴 `prompts.chat` 遠端 MCP 伺服器之 `search_prompts` / `get_prompt` 工具。依規範第 II.D.5 條列入待評估清單，暫不安裝。 |
| **prompts.chat** | `skill-lookup` | `BLOCKED` (依賴遠端 MCP) | 必須依賴 `prompts.chat` 遠端 MCP 伺服器之 `search_skills` / `get_skill` 工具。依規範列入待評估清單，暫不安裝。 |
| **Chinese Indie Dev**| `chinese-indie-dev` | `BLOCKED` (專屬維護腳本) | 專為倉庫維護者（1c7 本人）處理 issue #160、核對 PR 與審查提交之個人腳本，內含要求使用維護者 GitHub PAT 與直接 git master 之操作，不適合裝入本專案。保留參考研究網址：`https://github.com/1c7/chinese-independent-developer`。 |

---

## 五、Antigravity 相容性與 YAML Frontmatter 驗證結果

專案透過自動化稽核指令（`tmp/validate-installed-skills.mjs`）對 `.agents/skills/` 內全數 64 款技能進行完整解析：

```
Auditing 64 skills in .agents/skills/...
Audit Complete: 64 valid skills, 0 invalid.
ALL 64 SKILLS PASSED YAML FRONTMATTER & STRUCTURE VALIDATION!
```

- **目錄獨立性**：全數 55 款新技能皆為獨立目錄，包含完整之 `SKILL.md`。
- **YAML Frontmatter**：包含必備之 `name` 與 `description`，符合 Antigravity 技能自動探索標準。
- **子目錄結構完整保留**：
  - 各行銷技能之 `references/`、`assets/`、`evals/` 完全移植，未精簡或遺失任何參考資料。
  - Graphify 包含 Windows 專屬之 8 個 `references/*.md`（`query.md`, `update.md`, `extraction-spec.md`, `hooks.md` 等）。

---

## 六、套件與外部依賴情況

1. **Python 依賴**：
   - 套件名稱確認：`graphifyy`（官方 PyPI 註冊名稱，非相似不明套件）。
   - 安裝指令：`python -m pip install graphifyy`。
   - 安裝版本：`graphifyy 0.9.108`（依賴 `networkx 3.7`, `rapidfuzz 3.14.6`, `tree-sitter 0.25.2` 及 20+ 款語言語法解析庫）。
   - 安裝結果：安裝成功，產出 CLI 執行檔（`graphify.exe`、`graphify-mcp.exe`）。
2. **遵守不執行原則**：
   - 本次**未執行** `/graphify .`。
   - **未建立**知識圖譜。
   - **未配置**外部遠端 MCP。
   - 待後續獨立評估後再決定是否建置全域知識圖譜。

---

## 七、安全性審查結論

所有外部檔案經自動化模式比對與人工安全審查：
1. **LICENSE 檢查**：
   - `marketingskills`：MIT License (Corey Haines)
   - `humanizer`：MIT License (Siqi Chen)
   - `graphify`：Apache-2.0 License (Graphify Labs)
   - 全數為合法、相容之開源授權。
2. **危險模式檢測**：
   - 搜尋危險指令：`rm -rf /`、`format c:`、`drop database`、惡意網路外洩代碼。
   - 結果：**零匹配（0 violations）**。
3. **無硬編碼金鑰**：未引入任何 API Key、Token 或敏感憑證。
4. **專案保護規則恪守**：
   - 零 Git Commit、零 Git Push、零部署。
   - 零修改資料庫、Prisma、SQL、API 或後端業務邏輯。
   - `AUTH-03` 維持嚴格 `BLOCKED`。
   - 現有專案規則（`.agents/rules/01-brand-and-ui.md` 至 `07-git-and-collaboration.md`）無任何一處被覆蓋或修改。

---

## 八、檔案變更清單

### 1. 新增檔案與目錄
- `.agents/skills/<53 marketing skills>/`（共 53 款行銷技能及其參考材料）
- `.agents/skills/humanizer/`（含 `SKILL.md`、`README.md`、`LICENSE`）
- `.agents/skills/graphify/`（含 Windows 專用 `SKILL.md`、`references/`、`LICENSE`）
- `.agents/rules/graphify.md`（Antigravity 專屬常駐規則，僅在 `graphify-out/` 存在時生效）
- `.agents/workflows/graphify.md`（Antigravity 專屬工作流）
- `docs/development/AGENT_SKILLS_INSTALLATION_AUDIT.md`（本審查報告）

### 2. 未變更項目
- 既有 9 款技能（`bug-fixing`, `feature-development`, `logo-design`, `release-check`, `supabase`, `supabase-postgres-best-practices`, `vercel-composition-patterns`, `vercel-react-best-practices`, `web-design-guidelines`）維持原樣。
- 既有 7 個規則檔案（`01-brand-and-ui.md` 至 `07-git-and-collaboration.md`）100% 保持未變。
- 網站前端、後端、資料庫與各項設定檔案無任何越權更動。

---

## 九、重新啟動與後續建議

1. **Antigravity 識別狀態**：
   - 技能已寫入 `.agents/skills/`，檔案與目錄結構完全有效。
   - 部分環境在熱重載時會自動讀取新增之 `.agents/skills/`；若在交談中希望立即自動補全 `/humanizer` 或 `/graphify`，可於對話切換或重啟 IDE 時全面刷新。
2. **待評估事項**：
   - 評估是否需要透過 MCP 連接 `prompts.chat` 以取得百萬級提示詞搜尋能力。
   - 評估是否在適當時機針對 CODE TO KNOW 核心專案執行 `graphify` 產生架構圖譜。

---

## 十、最終狀態判定

- **整體安裝與安全稽核結果**：**PASS**
- **技能檔案格式驗證**：**FORMAT_VALID (64/64 技能 100% 通過)**
- **專案保護與資安遵循**：**100% COMPLIANT**
