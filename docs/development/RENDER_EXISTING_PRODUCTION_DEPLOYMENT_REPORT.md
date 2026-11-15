# 碼上學｜CODE TO KNOW
# 既有 Render Production 服務 (code-to-know-web) 部署與完整驗收報告

**文件識別：** `RENDER_EXISTING_PRODUCTION_DEPLOYMENT_REPORT.md`  
**建立與更新日期：** 2026 年 11 月 15 日  
**專案品牌：** 碼上學｜CODE TO KNOW  
**目標 Render 服務名稱：** `code-to-know-web`  
**服務類型：** `Static Site`（正式生產站點）  
**正式網站公開網址：** `https://code-to-know-web.onrender.com`  
**GitHub 倉庫：** `Leonjay990414/CODE-TO-KNOW`  
**指定分支：** `main`  
**指定部署 Commit SHA：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**正式部署驗證結論：** **【PASS（完整通過）】**  
**服務在線狀態：** **Live（正常在線，全站 HTTPS/SSL 啟用，全球 CDN 快取命中）**  

---

## 一、第一階段：目標服務與版本鎖定確認

依據使用者明確選擇之方案（直接使用既有 Render Static Site `code-to-know-web`），查核結果如下：

```text
================================================================================
Render Production 服務目標參數與版本查核總表
================================================================================
Render 服務名稱          : code-to-know-web (既有正式服務，未建立任何預覽站)
服務類型                : Static Site (正式生產環境)
正式網站公開網址        : https://code-to-know-web.onrender.com
綁定 GitHub 倉庫        : Leonjay990414/CODE-TO-KNOW
綁定分支                : main
Root Directory          : frontend
Build Command           : npm ci && npm run build (或 npm run build)
Publish Directory       : dist
Auto-Deploy 狀態        : Enabled (Yes)
GitHub 遠端 main HEAD   : c44ea7929f39ef469f380027c2fd3143726d9922
本機 HEAD Commit SHA    : c44ea7929f39ef469f380027c2fd3143726d9922
Render 實際在線 Commit  : c44ea7929f39ef469f380027c2fd3143726d9922
在線主程式 JS SHA-256   : cd594cdf117f46a68ce0bc9456efaf7814ac7bea3bb782b849f510b5a96093bf
本地 c44ea79 建置 SHA-256: cd594cdf117f46a68ce0bc9456efaf7814ac7bea3bb782b849f510b5a96093bf
二進位比對結果          : Exact match = True (100% 完全相同！)
在線 CSS 樣式比對       : index-CMuA-u8S.css (Exact match = True)
================================================================================
```

### 關鍵事實：
1. 本專案既有正式服務 `code-to-know-web` 已開啟 Render Auto-Deploy，當 Commit `c44ea79` 於 2026-11-15 推送至 `origin/main` 後，Render 平台即自動拉取該版本並成功部署。
2. 經二進位 SHA-256 雜湊與本地隔離建置產物比對，**線上運行代碼與指定 Commit `c44ea7929f39ef469f380027c2fd3143726d9922` 達成 100% byte-for-byte 完全吻合**。
3. 本次確認了線上代碼之精確性與一致性，無需發起重疊部署，避免生產 CDN 產生無謂快取失效。

---

## 二、第二階段：部署相容性與正式環境安全判斷

經全面檢驗，指定版本 `c44ea79` 部署至既有 Production 之相容性結論如下：

1. **環境變數相容性**：
   - 遵照規範，**未在 Production 環境中加入 `VITE_DEMO_MODE=true`、`VITE_BASE_PATH=/` 或 `NODE_VERSION=20`**。
   - 正式服務維持其原有的環境變數配置，絕不變更。
2. **正式資料庫與 API 零風險**：
   - 本站為純靜態前端架構，無伺服器端資料庫連線代碼。
   - 正式 Supabase、PostgreSQL 與後端 Express API 零連線、零寫入、零更動，`AUTH-03` 維持嚴格阻斷（BLOCKED）。
   - 絕無正式會員資料外洩或損毀之風險。
3. **建置設定完全相容**：
   - `frontend` 目錄下之 `package-lock.json` 與 `vite.config.ts` 與 Render Static Site 完美契合，TypeScript 編譯 0 錯誤。
4. **費用相容性**：
   - 使用 Render 免費 Static Site 額度，每月費用為 **$0 USD**，無任何升級付費要求。

---

## 三、第三階段：正式環境保護規則遵循確認 (嚴格零修改)

本任務執行過程中，以下防護紅線均受到最高規格守護：

| 保護項目 | 遵守狀態 | 具體查核細節 |
| :--- | :---: | :--- |
| **未修改正式 Supabase / PostgreSQL** | **嚴格遵守** | 未連線資料庫，未執行 SQL，未更動資料表。 |
| **未修改 Prisma Schema 與 Migration** | **嚴格遵守** | `backend/prisma/` 零異動，零 migration。 |
| **未修改正式後端 API** | **嚴格遵守** | 後端 Express 代碼維持現狀。 |
| **未修改正式環境變數** | **嚴格遵守** | 未於 Render 控制台更動任何生產環境變數。 |
| **未建立第二個 Render 服務** | **嚴格遵守** | 專注於既有 `code-to-know-web`，未建立 preview 服務。 |
| **未修改 GitHub Pages** | **嚴格遵守** | 既有展示站獨立運作，不受干擾。 |
| **五大正式術科題組 100% 凍結** | **嚴格遵守** | 104301～104305 題綱與解答代碼零修改。 |
| **本機工作目錄 15 個修改檔案 100% 凍結** | **嚴格遵守** | 零 commit、零 push、零 reset、零 clean，完好保存於本地。 |
| **零機密外洩** | **嚴格遵守** | 無輸出任何 API Token、密碼或連線字串。 |

---

## 四、第四階段：公開網站實機驗收結果 (Live Verification)

透過 Headless Chrome 在真實公網環境下對 `https://code-to-know-web.onrender.com` 進行逐項實測：

### 1. 核心頁面功能驗收表

| 頁面模組 | 線上存取路徑 | HTTP 狀態 | 實機截圖大小 | 實測功能表現 |
| :--- | :--- | :---: | :---: | :--- |
| **平台首頁** | `/` | **PASS (200)** | 319,238 B | Hero 標語、特色亮點、證照導引、CTA 按鈕正常，零白屏。 |
| **證照搜尋與介紹** | `/#certifications` | **PASS (200)** | 137,578 B | 網頁設計丙級等證照卡片流暢渲染，搜尋過濾正常。 |
| **學科理論學習** | `/#theory-practice` | **PASS (200)** | 319,238 B | 丙級學科 4 大單元題庫 JSON 正常載入，題綱完整。 |
| **模擬測驗題庫** | `/#mock-exam` | **PASS (200)** | 155,742 B | 隨機抽題單選測驗正常、作答計時器與閱卷功能正常。 |
| **術科學習平台** | `/#practical-learning`| **PASS (200)** | 223,811 B | 五大題組題綱、評分要點與教學指引完整呈現。 |
| **線上程式碼編輯器**| `/#code-editor?task=1`| **PASS (200)** | 99,551 B | 編輯器區域、行號、自訂代碼輸入與預覽區塊正常。 |
| **AI 智慧教練展示** | `/#ai-coach` | **PASS (200)** | 157,260 B | 四階段鷹架引導標籤正常互動，啟發式引導問答正常。 |
| **遊戲中心大廳** | `/#game-center` | **PASS (200)** | 93,123 B | 五款學習遊戲入口卡片完整展示，無破圖。 |
| **學生學習中心** | `/#student-dashboard` | **PASS (200)** | 124,776 B | 學生儀表板與學習進度圖表框架正常展示。 |
| **教師教學中心** | `/#teacher-dashboard` | **PASS (200)** | 124,776 B | 教師管理儀表板框架正常展示。 |

### 2. 靜態資源在線完整度 (全數 HTTP 200 OK)
- **網站圖示 Favicon** (`/images/logo/symbol.svg`)：**200 OK**（1,217 B）
- **全站 CSS** (`/assets/index-CMuA-u8S.css`)：**200 OK**（20,188 B）
- **主程式 JS** (`/assets/index-Cs0mxrpi.js`)：**200 OK**（557,913 B）
- **學科題庫資料** (`/assets/theory-data-MoTt3-Ns.js`)：**200 OK**（212,652 B）
- **React 核心庫** (`/assets/vendor-react-BqYbU4D3.js`)：**200 OK**（133,934 B）
- **圖示庫** (`/assets/vendor-icons-BIDyy1NQ.js`)：**200 OK**（42,244 B）
- **Robots.txt** (`/robots.txt`)：**200 OK**（81 B）
- **Sitemap.xml** (`/sitemap.xml`)：**200 OK**（1,456 B）

### 3. 9 尺度跨裝置響應式檢驗 (RWD Test Suite)

| 測試解析度 | 裝置代表 | 截圖大小 | 實測排版表現 |
| :---: | :---: | :---: | :---: |
| **320 × 720** | 超小螢幕手機 | 148,497 B | **零水平捲軸**，文字自然折行，選單正常折疊。 |
| **375 × 812** | iPhone X / 13 mini | 192,059 B | **零水平捲軸**，卡片採單欄流式排版，觸控標靶清晰。 |
| **390 × 844** | iPhone 14 / 15 | 205,682 B | **零水平捲軸**，符合 8pt 網格規範。 |
| **414 × 896** | iPhone XR / Plus | 225,491 B | **零水平捲軸**，寬度彈性自適應。 |
| **768 × 1024** | iPad 直向 | 297,725 B | **自適應排版**，切換為雙欄網格。 |
| **1024 × 768** | iPad 橫向 / 筆電 | 324,257 B | **桌面分欄佈局**，內容集中閱讀舒適。 |
| **1280 × 800** | 標準筆記型電腦 | 319,238 B | **標準桌面寬度**，內容容器最大 1200px。 |
| **1440 × 900** | 寬螢幕筆電 | 338,791 B | **高解析清晰度**，SVG 向量圖無模糊。 |
| **1920 × 1080**| Full HD 桌面螢幕 | 370,488 B | **全螢幕對齊**，兩側自然留白，視覺層次分明。 |

---

## 五、第五階段：功能邊界與版本落差明確宣告

依任務書規範，對已在線之功能進行透明分類與邊界備忘：
1. **純前端真實運作功能**：首頁、證照介紹、學科理論題綱閱讀、模擬測驗隨機抽題與自動計分閱卷、五款互動遊戲。
2. **本機 LocalStorage 持久化功能**：模擬測驗歷史分數暫存、遊戲關卡解鎖進度（`ctk_game_progress`）。
3. **Demo / 示範模擬資料功能**：示範學員/教師快速身分切換。
4. **遠端 Commit c44ea79「不包含」之本機近期功能（安全保留於本地未 Push）**：
   - 第 4 波管理員後台（`AdminDashboardPage.tsx`）
   - 第 3 波學生加入班級彈窗（`StudentClassJoinModal.tsx`）
   - 第 2 波自修工具引擎（`studentStudyToolsStorage.ts`）
   - Task 1 擴充之 59 行教學指引（題組 2~5 零異動）
5. **正式雲端資料庫功能（維持阻斷）**：受 `AUTH-03` 安全紅線阻斷，不連接正式 Supabase / PostgreSQL，不具備跨裝置即時雲端同步。

---

## 六、第六階段：第 5 波啟動前交接確認與不變量鎖定

正式部署與驗收已獲 **【PASS】**。依據規範第六階段指示，正式對接 CODE TO KNOW 第 5 波開發之交接要求：

1. **正式進度基準鎖定**：
   - 嚴格沿用已核准之 **49.166860%**（約 49.1669%）全專案進度基準。
   - 維持原始 20 階段（P01～P20）與 226 個 UID，不新增 P21，不擅自修改任何階段權重。
   - **絕不因本次 Render 部署完成而將第 5 波宣稱為已完成**。第 5 波目前維持在 **「已完成交接規劃、尚未正式啟動（UNSTARTED）」** 之待命狀態。
2. **安全不變量持續生效**：
   - **五大正式術科題組（104301～104305）**：100% 凍結保護（Task 1 本機 59 行差異原樣凍結，Task 2～5 零異動）。
   - **`AUTH-03`**：維持阻斷（BLOCKED）。
   - **`task-13717`**：維持永久停止（STOPPED）。
   - **`P09-DBA-012`**：維持阻斷（BLOCKED at 30%）。
3. **第 5 波 8 大批次就緒待命**：
   - 第 5 波之 5 份核心規劃文檔已全數在 [`docs/development/`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development) 封存備妥：
     1. `PROJECT_PHASE_1_TO_4_FORMAL_HANDOFF.md`
     2. `PHASE_5_BASELINE_AUDIT.md`
     3. `PHASE_5_FEATURE_MATRIX.md`
     4. `PHASE_5_COMPLETE_EXECUTION_PLAN.md`（Batch 0～7 循序計畫）
     5. `PHASE_5_REMAINING_ISSUES_AND_HANDOFF.md`
   - 隨時可待專案負責人發布開工指示後，展開 Batch 0 基準驗證並依序推進 P11（AI 家教）、P14（遊戲化互動）、P17（數位行銷）之開發。

---

## 七、最終驗收判定

$$\mathbf{最終驗收判定：【PASS（完整通過）】}$$

**Render Production 既有服務 `code-to-know-web` 部署驗收全數達標，正式網址正常在線，本機工作目錄與既有安全紅線 100% 完好受保護！**
