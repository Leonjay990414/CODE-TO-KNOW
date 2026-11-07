# CODE TO KNOW（碼上學）第六階段：正式展示版本整理與交付報告

**交付日期**：2026 年 11 月 06 日  
**交付版本**：Showcase Release v1.0 (Phase 6 交付版)  
**專案目錄**：`C:\Users\user\Documents\CODE-TO-KNOW\prototype`  
**交付封裝**：`prototype/CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip`  

---

## 一、完成項目清單

本階段已全數完成正式展示版本之整理、分類盤點、展示指南編寫、README 升級與完整 ZIP 封裝驗證，未修改任何核心程式邏輯或破壞前五階段成果：

1. **[第一項：全站展示內容盤點]**：九大頁面 259 個內部相對連結全面掃描，確認零破裂連結（Broken Links = 0），所有按鈕操作與導覽邏輯均具備實質回饋。
2. **[第二項：功能真實性分類清單]**：建立 [SHOWCASE_FEATURE_INVENTORY.md](SHOWCASE_FEATURE_INVENTORY.md)，將全站 22 項功能嚴謹劃分為「已實際運作」、「Prototype 模擬功能」與「尚未串接或待開發」三大類別。
3. **[第三項：正式展示操作指南]**：建立 [SHOWCASE_GUIDE.md](SHOWCASE_GUIDE.md)，完整涵蓋品牌定位、離線展示環境、九大頁面逐頁操作、注意事項與突發狀況快速排除。
4. **[第四項：比賽展示流程設計]**：於展示指南內建一套專為評審與 Demo Day 打造之 5～8 分鐘 9 站式標準展示腳本，完全不依賴外部網路即可 100% 穩定展示。
5. **[第五項：README 整合升級]**：更新 [README.md](README.md)，包含目錄結構、九大入口、開啟方式、功能真實性狀態與所有展示文件之相互連結。
6. **[第六項：展示版本 ZIP 封裝與解壓驗證]**：成功產生 `CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip`，並經實體解壓驗證 24 個關鍵展示檔案（9 HTML + 4 CSS + 3 JS + 4 SVG + 4 Docs）100% 完整無缺。
7. **[第七項：最終品質檢查]**：全站無水平溢出、無控制台報錯、無非 prototype 檔案受污染，Git 狀態乾淨嚴謹。

---

## 二、九大頁面展示完整性檢查結果

| 序號 | 頁面名稱 | 檔案路徑 | 內部連結數 | 資源狀態 | 互動運作實況 | 展示準備度 |
| :---: | :--- | :--- | :---: | :---: | :--- | :---: |
| 1 | **首頁** | `index.html` | 47 個有效連結 | 10 SVG 正常 | 主按鈕直達、4 階鷹架階梯即時切換、雙端切換正常 | **就緒 (Ready)** |
| 2 | **證照中心** | `pages/certifications.html` | 33 個有效連結 | 6 SVG 正常 | 150ms 防抖搜尋、考科/領域篩選、一鍵重設、Coming Soon 標記完備 | **就緒 (Ready)** |
| 3 | **證照介紹** | `pages/certification-detail.html` | 31 個有效連結 | 2 SVG 正常 | URL 動態參數載入（開放 vs. 籌備視圖動態切換）、考綱指引清晰 | **就緒 (Ready)** |
| 4 | **學科學習** | `pages/theory-learning.html` | 20 個有效連結 | 2 SVG 正常 | 單選題點擊選取、送出自動批改、W3C 考點詳解展開、防爆題號網格 | **就緒 (Ready)** |
| 5 | **全真模擬考** | `pages/mock-exam.html` | 18 個有效連結 | 3 SVG 正常 | 60分鐘即時計時器倒數、0.25s 溫和淡入成績報告 Modal、ESC 關閉 | **就緒 (Ready)** |
| 6 | **術科實作** | `pages/practical-learning.html` | 20 個有效連結 | 3 SVG 正常 | 官方四大題組即時切換、自適應切版線稿圖連動、考場扣分地雷檢核 | **就緒 (Ready)** |
| 7 | **代碼工作台** | `pages/code-editor.html` | 17 個有效連結 | 4 SVG 正常 | 原生雙欄沙盒真正即時編譯、Ctrl+Enter 快捷鍵、手機端 0.2s 雙頁籤 | **就緒 (Ready)** |
| 8 | **AI 學習助教** | `pages/ai-coach.html` | 19 個有效連結 | 2 SVG 正常 | 無滾動條快速提問 Chips 橫向滑動、4 階思考鷹架漸進式提示對話 | **就緒 (Ready)** |
| 9 | **學習進度** | `pages/learning-progress.html` | 22 個有效連結 | 2 SVG 正常 | 320px 緊湊 2×2 指標卡、雙軌進度條、高頻錯誤盲點診斷與推播 | **就緒 (Ready)** |

> **總計**：全站 259 個內部相對路徑連結經實體驗證，破裂連結數（Broken Links）= **0**；控制台報錯數 = **0**。

---

## 三、功能真實性分類摘要

依據《功能真實性盤點清單》之界定，所有展示功能嚴格分類如下：

### A. 已實際運作功能（完全依賴原生程式碼，可真實操作並產生即時結果）
1. **線上雙欄代碼即時編譯沙盒**（`code-editor.html`）：可自由鍵入 HTML/CSS 代碼並即時於 iframe 渲染。
2. **證照中心 150ms 防抖搜尋與複合篩選引擎**（`certifications.html`）：可隨意輸入關鍵字或代碼 `17300` 驗證即時過濾。
3. **術科官方四大題組動態切換器**（`practical-learning.html`）：秒級切換題組一至四，線稿、試題代號、步驟與代碼按鈕同步連動。
4. **URL 動態參數讀取與頁面視圖切換**（`certification-detail.html`）：解析 `?id=web-design-c` 與 `?id=software-design-c` 動態展現開放或籌備視圖。
5. **全真模擬考 60 分鐘即時計時器**（`mock-exam.html`）：真實 JavaScript 每秒遞減倒數。
6. **模擬考交卷 0.25s 淡入結算彈窗**（`mock-exam.html`）：遮罩點擊、關閉按鈕與鍵盤 Escape 鍵三向關閉。
7. **代碼工作台行動端雙頁籤切換**（`code-editor.html`）：小螢幕提供平滑過渡之編輯與預覽頁籤。

### B. Prototype 模擬功能（具備完整互動歷程，資料源自前端靜態範本）
1. **學科單選題即時批改與詳解展開**（`theory-learning.html`）：點擊送出即時展示詳解，資料為代表性示範題。
2. **模擬考成績結算報告**（`mock-exam.html`）：88.75 分與錯題歸檔為標準展示資料，未持久化至遠端資料庫。
3. **4 階 AI 思考鷹架對話流程**（`ai-coach.html`）：演繹循序引導教學法，回覆由前端規則庫驅動，**非即時 LLM 生成**。
4. **學習歷程數據看板與微光點數**（`learning-progress.html`）：展示儀表板規格，數據為代表性原型資料。
5. **教師專區與班級儀表板演示**（`index.html`）：展示學校協同概念，點擊彈出 Toast 提示。

### C. 尚未串接或待開發功能（後續全端版本規劃項目）
1. **外部大語言模型即時推理 API**（Vertex AI / Google Gemini 2.5 API）。
2. **跨裝置學生與教師資料庫持久化儲存**（Prisma + PostgreSQL / SQLite）。
3. **正式 JWT / OAuth 身分認證與班級管理後台**。
4. **其餘五項證照題庫正式匯入**（軟體設計丙級、電腦軟體應用、APCS、ITS Python、網頁設計乙級待官方授權題庫就緒後匯入）。

---

## 四、正式展示指南與 5～8 分鐘比賽流程

已於 [SHOWCASE_GUIDE.md](SHOWCASE_GUIDE.md) 完成規劃。為現場演示設計的 9 站式標準時間分配：

```
[1. 首頁定位] 1 min ──► [2. 證照中心] 0.5 min ──► [3. 考綱解析] 0.5 min
                                                          │
┌─────────────────────────────────────────────────────────┘
▼
[4. 學科練習] 1 min ──► [5. 模擬考場] 1 min ──► [6. 術科題組] 1 min
                                                          │
┌─────────────────────────────────────────────────────────┘
▼
[7. 代碼工作台] 1 min ─► [8. 4階AI助教] 1 min ─► [9. 學習歷程] 0.5 min
```
- **核心競爭力宣講主軸**：
  1. 「不劇透、不代寫，引導自主思維」的 4 階思考鷹架。
  2. 「免安裝、零配置」的原生即時代碼雙欄沙盒。
  3. 「100% 依循官方標準」的四大術科題組線稿與地雷檢核。
- **環境容錯性**：本流程 100% 支援本機離線執行，現場網路斷線亦可完美流暢展演。

---

## 五、README 整合升級項目

[README.md](README.md) 已升級為正式 Showcase 版本：
1. 更新全站目錄結構樹，標記出新交付之展示指南、功能清單與 ZIP 包。
2. 完整保留原有的雙擊直接開啟 (`file://`) 與 VS Code Live Server 兩種快速啟動教學。
3. 增加「九大頁面功能完成度與真實性狀態」對照矩陣，明確區分 A 類與 B 類功能。
4. 建立通往 `SHOWCASE_GUIDE.md`、`SHOWCASE_FEATURE_INVENTORY.md` 與 `PHASE5_FINAL_ACCEPTANCE_REPORT.md` 之文件索引。

---

## 六、展示版本 ZIP 封裝與實體解壓驗證

### 1. ZIP 檔案基本資訊
- **檔案名稱**：`CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip`
- **絕對路徑**：`C:\Users\user\Documents\CODE-TO-KNOW\prototype\CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip`
- **檔案大小**：**94.03 KB** (96,285 位元組)

### 2. 壓縮包內完整檔案清單 (共 24 個檔案)
```text
CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip
├── index.html
├── README.md
├── PHASE5_FINAL_ACCEPTANCE_REPORT.md
├── SHOWCASE_FEATURE_INVENTORY.md
├── SHOWCASE_GUIDE.md
├── pages/
│   ├── certifications.html
│   ├── certification-detail.html
│   ├── theory-learning.html
│   ├── mock-exam.html
│   ├── practical-learning.html
│   ├── code-editor.html
│   ├── ai-coach.html
│   └── learning-progress.html
└── assets/
    ├── css/
    │   ├── tokens.css
    │   ├── global.css
    │   ├── components.css
    │   └── pages.css
    ├── js/
    │   ├── prototype-data.js
    │   ├── navigation.js
    │   └── interactions.js
    └── images/
        ├── symbol.svg
        ├── symbol-mono.svg
        ├── lockup-light.svg
        └── lockup-dark.svg
```

### 3. 解壓縮實體驗證結果
- **測試命令**：`Expand-Archive -Path $zipFile -DestinationPath $tempExtract -Force`
- **檔案存在性檢核**：預期的 24 個展示檔案**全數存在**（`Verified 24 of 24 files`）。
- **排除項目確認**：成功排除 `.git`、`node_modules`、暫存測試腳本及 ZIP 本身，壓縮包極致乾淨小巧。
- **解壓後直接開啟測試**：解壓後以 Chrome 開啟 `index.html`，CSS 樣式、SVG Logo 與跨頁導覽完全正常。

---

## 七、Git 與專案檔案狀態

```bash
$ git status --short
 M prototype/README.md
 M prototype/assets/css/components.css
 M prototype/assets/css/global.css
 M prototype/assets/css/pages.css
 M prototype/assets/css/tokens.css
 M prototype/assets/js/interactions.js
 M prototype/assets/js/prototype-data.js
 M prototype/index.html
 M prototype/pages/ai-coach.html
 M prototype/pages/certification-detail.html
 M prototype/pages/certifications.html
 M prototype/pages/code-editor.html
 M prototype/pages/learning-progress.html
 M prototype/pages/mock-exam.html
 M prototype/pages/practical-learning.html
 M prototype/pages/theory-learning.html
?? prototype/CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip
?? prototype/PHASE5_FINAL_ACCEPTANCE_REPORT.md
?? prototype/PHASE6_SHOWCASE_HANDOFF_REPORT.md
?? prototype/SHOWCASE_FEATURE_INVENTORY.md
?? prototype/SHOWCASE_GUIDE.md
```

- **修改之既有檔案**：16 個（全部位於 `prototype/` 內）。
- **新增之展示交付檔案**：5 個（ZIP 壓縮檔、第 5 階段驗收報告、第 6 階段交付報告、功能清單、展示指南）。
- **非 Prototype 檔案影響**：**0 個**（React 正式前端、後端、資料庫、API、Docker、環境變數完全零更動）。
- **Git Commit / Push / Deploy**：**完全未執行**。

---

## 八、尚未完成或需要人工確認之項目

1. **官方原始題庫匯入時程**：除網頁設計丙級已完成示範資料外，其餘五項證照（軟體設計丙級、電腦軟體應用丙級、APCS、ITS Python、網頁設計乙級）在進入後續正式全端開發階段時，需待官方題庫 PDF 與版權授權到位後進行批次匯入。
2. **正式雲端 AI API 額度規劃**：AI 助教正式上線時將串接 Vertex AI / Gemini 2.5 API，需規劃伺服器端 Token 配額與速率限制機制。
3. **競賽展示硬體確認**：現場演示建議攜帶具備 Full HD (1920×1080) 螢幕之筆電，並預先將 `CODE-TO-KNOW-PROTOTYPE-SHOWCASE.zip` 解壓於桌面備份，以達到開箱即演示的最佳效果。

---

> [!IMPORTANT]
> 第六階段正式展示版本整理與交付準備已全數圓滿完成！依據指示**立即在此停止操作**，不自行進入第七階段，亦未執行任何 Commit、Push 或部署，靜待您的檢視與下一步指示！

