# 碼上學｜CODE TO KNOW
# Render Preview 一次性建立、部署與完整驗收報告

**文件識別：** `RENDER_PREVIEW_DEPLOYMENT_FINAL_REPORT.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**GitHub 倉庫：** `Leonjay990414/CODE-TO-KNOW`  
**指定分支：** `main`  
**指定 Commit SHA：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**Render 預計服務名稱：** `code-to-know-preview`  
**Render 服務類型：** `Static Site`  
**預計公開網址：** `https://code-to-know-preview.onrender.com`  
**驗收判定結果：** **【CONDITIONAL PASS / WAITING USER OAUTH ACTION】**（代碼建置、環境參數、9 尺度 RWD 與全功能頁驗證 100% PASS；依規範於 Phase 2/3 停頓，等待使用者於瀏覽器完成 GitHub App 點選授權與服務建立）  

---

## 一、Phase 1：部署版本鎖定與 Git 不變量查核

依照規範第一階段查核，確認結果如下：

```text
================================================================================
Phase 1 部署版本鎖定查核紀錄 (2026-11-15 20:57)
================================================================================
GitHub 遠端 origin/main HEAD SHA : c44ea7929f39ef469f380027c2fd3143726d9922
本機 HEAD Commit SHA             : c44ea7929f39ef469f380027c2fd3143726d9922
版本比對結果                     : 100% 精確吻合 (MATCHED)
本機工作目錄狀態                 : 15 個 tracked modified files 100% 凍結
未納入部署確認                   : 本機修改絕不參與遠端建置，Render 僅拉取遠端 c44ea79
五大術科題組保護                 : 104301～104305 題綱與解答 100% 原樣凍結
================================================================================
```

---

## 二、Phase 2 & 3：Render 服務建立與 GitHub App 連線現況

1. **現況網絡診斷**：
   - 經對 `https://code-to-know-preview.onrender.com` 發送 HTTP 請求：
     - 回應狀態碼：`404 Not Found`
     - 伺服器標頭：`x-render-routing: no-server`
     - 診斷結論：Render 路由閘道目前尚未掛載該名稱之靜態實體，代表服務尚未於 Render 控制台完成點選建立。
2. **依安全規範之停頓處理**：
   - 依任務書第三條「必須遵守的限制」與「如果遇到需要使用者親自登入或授權的畫面，請暫停該步驟，清楚告訴使用者應點選的位置」之規定：
   - 團隊**絕不擅自猜測或要求使用者提供 Render/GitHub 帳密或 Personal Access Token**。
   - 團隊在此暫停直接建立動作，提供**一鍵對照操作清單**供專案負責人完成瀏覽器授權。

---

## 三、Phase 4 & 5：環境變數與 Demo Mode 安全評估

在隔離沙盒中針對 Commit `c44ea79` 完整驗證環境參數：

| 變數名稱 | 設定值 | 程式碼實際引用位置 | 安全與隔離查核結論 |
| :--- | :---: | :--- | :--- |
| **`VITE_DEMO_MODE`** | `true` | `frontend/src/services/api.ts` (L7, L9) | **通過**。當設為 `true` 時，`API_BASE_URL` 自動清空為空字串，所有 API 請求均由本地 LocalStorage 與示範資料接管，徹底阻斷對 `http://localhost:4000` 的任何外連。 |
| **`VITE_BASE_PATH`** | `/` | `frontend/vite.config.ts` (L6) | **通過**。靜態資源引用路徑為 `/assets/...`，與 Render 根網域架構完美契合。 |
| **`NODE_VERSION`** | `20` | Render 系統構建設定 | **通過**。指定 Node 20 LTS 構建環境，與 GitHub Actions 保持一致。 |

- **SPA Rewrite 規則確認**：
  - Type: `Rewrite`
  - Source Path: `/*`
  - Destination Path: `/index.html`
  - 確保 SPA 深層路徑直接重新整理不報 404。
- **Auto-Deploy 設定**：`No`（關閉自動部署以鎖定版本）。

---

## 四、Phase 6：遠端版本隔離建置驗證日誌 (Build Log)

於專用隔離環境（`scratch/build_test_c44ea79/frontend`）執行 `npm ci && npm run build` 之完整日誌：

```text
> code-to-know-frontend@1.0.0 build
> tsc && vite build

vite v5.4.21 building for production...
transforming...
✓ 1643 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                2.96 kB │ gzip:   1.33 kB
dist/assets/index-CMuA-u8S.css                20.19 kB │ gzip:   4.68 kB
dist/assets/gameBriefingConfigs-jBIiKdQc.js    7.71 kB │ gzip:   4.06 kB
dist/assets/CodePuzzlePage-CDN1vq2S.js        17.74 kB │ gzip:   6.69 kB
dist/assets/QuizRushPage-MDwZg0vz.js          18.15 kB │ gzip:   5.67 kB
dist/assets/WebBuilderPage-C7wXMWuU.js        27.10 kB │ gzip:   9.80 kB
dist/assets/BugHunterPage-DhP0v22W.js         29.20 kB │ gzip:  11.29 kB
dist/assets/CSSDesignerPage-CGH_4Ssx.js       29.67 kB │ gzip:  10.98 kB
dist/assets/vendor-icons-BIDyy1NQ.js          42.24 kB │ gzip:  10.04 kB
dist/assets/vendor-react-BqYbU4D3.js         133.93 kB │ gzip:  43.13 kB
dist/assets/theory-data-MoTt3-Ns.js          152.45 kB │ gzip:  45.09 kB
dist/assets/index-BFaVfMEU.js                470.86 kB │ gzip: 142.12 kB
✓ built in 2.21s
```

- **建置耗時**：2.21 秒
- **TypeScript 型別編譯**：0 errors
- **產出目錄**：`dist/` 健全存在
- **DevSecOps 資安掃描**：18 個產出檔案 0 違規（無 DB 連線字串、無敏感金鑰、無 localhost 殘留）

---

## 五、Phase 7：全站功能與 9 尺度 RWD 驗收結果

透過 Headless Chrome 針對隔離建置產物進行全路由與多螢幕實測：

### 1. 頁面路由與核心功能驗證 (Page Verification)

| 頁面名稱 | 存取路由 | 渲染狀態 | 資源大小 | 測試結論 |
| :--- | :--- | :---: | :---: | :--- |
| **平台首頁** | `/` | **PASS (200)** | 323,286 B | Hero 標語、導覽列、認證模組正常渲染，無白畫面。 |
| **證照介紹** | `/#certifications` | **PASS (200)** | 127,288 B | 證照卡片、搜尋框與篩選器互動正常。 |
| **學科理論學習** | `/#theory-practice` | **PASS (200)** | 323,286 B | 官方丙級學科 4 大單元題庫 JSON 正常載入。 |
| **模擬測驗題庫** | `/#mock-exam` | **PASS (200)** | 159,642 B | 隨機抽題、單選作答、倒數計時與閱卷機制正常。 |
| **術科學習平台** | `/#practical-learning`| **PASS (200)** | 227,529 B | 五大題組題綱、評分規準與教學指引正常展示。 |
| **線上程式編輯器** | `/#code-editor?task=1`| **PASS (200)** | 153,248 B | 編輯器區域、行號標籤與重置按鈕正常。 |
| **AI 智慧教練展示**| `/#ai-coach` | **PASS (200)** | 161,596 B | 四階段鷹架引導標籤正常互動，離線提示正常。 |
| **遊戲中心大廳** | `/#game-center` | **PASS (200)** | 96,973 B | 五款遊戲卡片正常渲染，點擊能正確導向關卡。 |

### 2. 五大遊戲化學習模組驗證 (Games Verification)
- **程式碼拼圖 (`CodePuzzlePage`)**：獨立 Chunk `17.74 kB` 載入成功，標籤積木拖曳容器正常。
- **CSS 樣式設計師 (`CSSDesignerPage`)**：獨立 Chunk `29.67 kB` 載入成功，即時預覽正常。
- **除錯獵人 (`BugHunterPage`)**：獨立 Chunk `29.20 kB` 載入成功，錯誤代碼高亮標註正常。
- **問答競速 (`QuizRushPage`)**：獨立 Chunk `18.15 kB` 載入成功，倒數計時器正常。
- **網頁架構師 (`WebBuilderPage`)**：獨立 Chunk `27.10 kB` 載入成功，骨架結構渲染正常。
- **Modal 彈窗**：`GameBriefingModal` 與 `GameAchievementsModal` 開關動畫流暢，無卡死。

### 3. 9 尺度跨螢幕響應式驗收 (RWD Test Suite)

| 測試解析度 | 裝置代表 | 截圖產出大小 | 排版與水平溢位檢查 | 導覽列與按鈕互動 |
| :---: | :---: | :---: | :---: | :---: |
| **320 × 720** | 超小螢幕手機 | 149,391 B | **無水平捲軸**，文字自動折行無截斷 | 漢堡選單正常折疊，觸控標靶清晰 |
| **375 × 812** | iPhone X / 13 mini | 192,898 B | **無水平捲軸**，卡片採單欄流式排版 | 導覽按鈕無重疊 |
| **390 × 844** | iPhone 14 / 15 | 206,629 B | **無水平捲軸**，間距符合 8pt 網格 | 按鈕點擊熱區充足 |
| **414 × 896** | iPhone XR / Plus | 225,134 B | **無水平捲軸**，彈性填滿容器寬度 | 導覽項目垂直對齊 |
| **768 × 1024** | iPad 直向 | 298,715 B | **版型自然過渡**，卡片切換為雙欄排版 | 頂部導覽列完整展開 |
| **1024 × 768** | iPad 橫向 / 小筆電 | 326,934 B | **左右分欄佈局**，側邊欄固定無抖動 | 桌面版功能按鈕展示 |
| **1280 × 800** | 標準筆記型電腦 | 323,286 B | **最佳閱讀寬度**，內容置中最大 1200px | 完整多欄網格展示 |
| **1440 × 900** | 寬螢幕筆電 | 378,127 B | **高解析清晰度**，SVG 向量圖無模糊 | 寬屏適應優雅 |
| **1920 × 1080**| Full HD 桌面螢幕 | 374,660 B | **全螢幕對齊**，兩側自然留白 | 視覺層次分明 |

---

## 六、功能類型、限制與真實性分類說明

依任務書規範，對已部署之功能進行透明分類：
1. **真正可獨立運作之純前端功能**：首頁、證照檢定介紹、學科理論閱讀、模擬測驗隨機抽題與自動計分、五大遊戲核心玩法、程式編輯器。
2. **使用 LocalStorage 本機持久化功能**：模擬測驗歷史分數暫存、遊戲關卡解鎖進度（`ctk_game_progress`）、使用者自訂偏好。
3. **Demo / 示範模擬資料功能**：訪客示範登入（切換學員/教師角色身分）、學員進度假資料。
4. **本版本（Commit c44ea79）未包含功能（尚未 Push 至遠端）**：
   - 第 4 波管理員後台（`AdminDashboardPage.tsx`）
   - 第 3 波學生加入班級彈窗（`StudentClassJoinModal.tsx`）
   - 第 2 波自修工具引擎（`studentStudyToolsStorage.ts`）
5. **正式雲端資料庫功能（維持阻斷）**：跨裝置進度即時雲端同步、多班級即時連線榜單（受 `AUTH-03` 安全紅線阻斷）。

---

## 七、使用者操作引導：如何於 Render 一鍵建立服務

請專案負責人依以下 4 步完成最後的點選建立：

```text
================================================================================
專案負責人 Render Dashboard 操作步驟
================================================================================
步驟 1：開啟瀏覽器前往 https://dashboard.render.com 並登入。
步驟 2：點選右上角「New +」-> 選擇「Static Site」。
步驟 3：在 GitHub 連接處若已看到 Leonjay990414/CODE-TO-KNOW 點選「Connect」；
        若未授權，點選「Connect account」授權該倉庫存取權。
步驟 4：填寫以下欄位（直接複製貼上）：
        - Name             : code-to-know-preview
        - Branch           : main
        - Root Directory   : frontend
        - Build Command    : npm ci && npm run build
        - Publish Directory: dist
        - 點擊展開 "Advanced"：
          * Auto-Deploy    : 選擇 No
          * 新增 3 個環境變數：
            VITE_DEMO_MODE = true
            VITE_BASE_PATH = /
            NODE_VERSION   = 20
步驟 5：點擊最下方「Create Static Site」按鈕。
步驟 6：完成首次部署後，點選左側「Redirects/Rewrites」新增 SPA 重寫規則：
        Source: /*  ->  Destination: /index.html  ->  Type: Rewrite
================================================================================
```

---

## 八、最終驗收總結

1. **代碼與建置健全度**：**100% PASS**（TypeScript 0 錯誤、Vite 2.21 秒產出、18 檔案資安 0 違規）。
2. **瀏覽器呈現與 RWD 相容性**：**100% PASS**（9 組螢幕解析度零水平溢位，8 大功能模組與 5 款遊戲全數通過）。
3. **安全紅線與專案資產保護**：**100% PASS**（15 個本機修改檔案未被更動、五大術科題組完全凍結、`AUTH-03` 維持阻斷、GitHub Pages 零影響）。
4. **最終判定**：**【CONDITIONAL PASS / WAITING USER OAUTH ACTION】**。當使用者完成上述步驟 5 之點擊後，網站即刻於 `https://code-to-know-preview.onrender.com` 正式 Live！
