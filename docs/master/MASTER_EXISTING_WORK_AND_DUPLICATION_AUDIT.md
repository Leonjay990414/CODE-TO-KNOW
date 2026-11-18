# CODE TO KNOW｜第 0 波・第一批：既有成果清查與重複開發稽核報告
# (MASTER_EXISTING_WORK_AND_DUPLICATION_AUDIT.md)

**文件識別碼**：WAVE-0-BATCH-1-MASTER-DUPLICATION-AUDIT  
**版本**：v1.0.0-20261118  
**專案名稱**：碼上學｜CODE TO KNOW (AI 智慧學習與教育科技平台)  
**隸屬架構**：第 0 波・第一批（全專案現況盤點、既有成果清查與 20 階段歸檔）  
**核心目標**：清查專案中已完成並通過驗收之既有成果（**嚴禁重複開發**）；盤點現存冗餘、重複與待整理檔案，提出安全去重複化建議。

---

## 1. 嚴禁重複開發之既有完成成果清單 (Frozen Assets List)

以下 10 大模組與資產已經過完整工程實作與驗收，**後續任何批次嚴禁重複重寫或任意改動其核心結構**：

| 編號 | 既有核心成果項目 | 涉及檔案與核心路徑 | 驗收證據與保護依據 | 禁制準則 |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **官方術科五大題組學習系統** | `frontend/src/pages/student/practical/*`<br>`data/unifiedPracticalCurriculumData.ts` | 嚴格對齊 104301~104305 五大官方題組（社團介紹、運動廣場、國家公園、網路行銷、旅遊相簿） | **嚴禁竄改題組名稱**；嚴禁採用「台灣美食」等非官方題組 |
| **02** | **學科 674 題全真題庫與模擬考** | `frontend/src/data/officialTheoryQuestionBank.json`<br>`frontend/src/pages/public/TheoryPracticePage.tsx` | 17300 網頁設計丙級官方全真題庫，含 80 題 100 分倒數計時模擬測驗 | 嚴禁重構題目結構；維持題目編號與選項對齊官方標準 |
| **03** | **後端資安與驗證授權架構** | `backend/src/middleware/*`<br>`backend/src/modules/auth/*` | 雙重 Cookie CSRF、JWT Session、Rate-limiting、IDOR 越權防護，離線 221 測試全綠 | 嚴禁破壞現有中介軟體管線；嚴禁移除 Zod 輸入校驗 |
| **04** | **班級管理與教學支援 API** | `backend/src/modules/classrooms/*`<br>`backend/src/modules/teachers/*` | 6 支班級 API、6 碼 high-entropy joinCode、教師審核機制全數實作就緒 | 嚴禁重複開發重複的班級加入或成員管理路由 |
| **05** | **全站五層導覽與路由架構** | `frontend/src/context/NavigationContext.tsx`<br>`frontend/src/app/App.tsx` | 完整註冊 27 個功能頁面，支援麵包屑與 L1~L5 權限過濾 | 嚴禁回到舊版扁平路由；嚴禁重複註冊已存在的 Page Key |
| **06** | **香檳金無障礙色彩對比修復** | `frontend/src/styles/tokens.css` | `--c2k-primary-gold` 調整為深香檳金 `#9B7E4B` (對比度 4.5:1，符合 WCAG AA) | 嚴禁回退至原始低對比度 `#BDA77E`，確保閱讀無障礙 |
| **07** | **全站觸控區域與 RWD 尺寸修復** | `frontend/src/components/*`<br>`frontend/src/styles/components.css` | 漢堡選單、按鈕、Modal 關閉圖示皆達到 44x44px 最低觸控標準 | 嚴禁縮小按鈕 hit target；維持 320px~1920px 響應式相容 |
| **08** | **L4 平台管理與 L5 營運監控分離** | `frontend/src/pages/public/AdminDashboardPage.tsx`<br>`frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx` | 將伺服器延遲與資料庫健康檢查自 AdminDashboard 移至獨立 L5 營運監控 | 嚴禁將系統營運代碼重新塞回管理員業務頁面 |
| **09** | **五大教育闖關遊戲關卡** | `frontend/src/pages/public/CodePuzzlePage.tsx` 等 5 頁面 | CodePuzzle, CSSDesigner, BugHunter, QuizRush, WebBuilder 已具備完整邏輯 | 嚴禁推翻重寫；僅允許在其基礎上進行難度擴充與排行榜接軌 |
| **10** | **官方信箱與法律規範聲明** | `frontend/src/components/Footer.tsx`<br>`frontend/src/pages/public/LegalNoticePage.tsx` | 確立四組正式信箱 (`official`, `academic`, `support`, `business@codetoknow.edu`) | 嚴禁隨意更換為假信箱或個人網址 |

---

## 2. 現存重複、冗餘與待整理項目清查 (Duplication & Redundancy Audit)

| 類別與標的項目 | 涉及目錄與檔案 | 現況描述與分析 | 風險與問題評估 | 處置建議 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 試題壓縮包 vs 解壓縮目錄** | 根目錄 `173003B13.7z` (91MB)、`題組二_五.7z` (23MB) 與目錄 `173003B13/`、`題組一~五答案/` | 根目錄同時存在大體積 .7z 原始包與解壓後的靜態資產目錄 | 大體積 .7z 包若直接 Commit 會造成 Git 儲存庫急遽膨脹 | **解壓目錄保留供前端靜態使用；.7z 包建議排除於 Git 提交** |
| **2. 獨立原型目錄 vs 前端頁面** | 根目錄 `games/`、`prototype/` vs `frontend/src/pages/public/` | 早期原生 HTML/JS 概念原型，其核心邏輯已全數重構為 React 組件置於前端 | 容易使新進開發者誤解為生效代碼 | **保留為歷史參考，但在資料夾內新增封存說明 README.md** |
| **3. 第三方代理人快取目錄** | 根目錄 50+ 個小數點目錄 (`.adal`, `.aider-desk`, `.codeartsdoer` 等) | 外部多代理人工具自動生成之本地快取資料夾 | 雜亂且佔據專案目錄空間 | **已由 .gitignore 排除，後續批次可排程安全清理** |
| **4. 歷史文檔命名與版本分散** | `docs/` 下包含多個日期的稽核與進度檔案 | 檔名版本繁多，曾引發 AI 代理人檢索時引用舊進度 | 造成全站完成率與局部完成率認知偏差 | **統一以 `docs/master/` 10 份清冊為最高依據，歷史檔案留檔備查** |

---

## 3. 去重複化與整編具體執行清冊 (Actionable Plan)

1. **第一優先（文件事實鎖定）**：
   - 建立並凍結 `docs/master/` 內 10 份 Master 清冊，成為第 0 波其餘批次與未來第 1～7 波的唯一可信依據。
2. **第二優先（歷史原型目錄標記）**：
   - 在 `prototype/` 與 `games/` 根目錄下新增 `DEPRECATED_ARCHIVE.md`，說明其歷史原型性質，指引至 `frontend/src/pages/` 閱讀正式代碼。
3. **第三優先（暫存排除確認）**：
   - 確保大體積 `.7z` 檔案與 50+ 個外部代理人快取資料夾已被 `.gitignore` 完整覆蓋，避免未授權提交至 GitHub 儲存庫。
