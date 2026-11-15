# 碼上學｜CODE TO KNOW
# Render Preview（方案 B）部署準備與就緒狀態審查報告

**文件識別：** `RENDER_PREVIEW_SCHEME_B_READINESS_REPORT.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**方案代號：** 方案 B（使用 GitHub 遠端 `main` 分支既有 Commit 建立獨立預覽）  
**指定 GitHub 倉庫：** `Leonjay990414/CODE-TO-KNOW`  
**指定分支：** `main`  
**指定 Commit SHA：** `c44ea7929f39ef469f380027c2fd3143726d9922`  
**預計 Render 服務名稱：** `code-to-know-preview`  
**預計 Render 服務類型：** `Static Site`  
**就緒審查總評判定：** **【A. READY：所有設定已確認，可以等待使用者授權建立服務】**  

---

## 一、方案 B 執行背景與就緒評估總結

本報告針對專案負責人指定之「方案 B（使用 GitHub 遠端既有 `main` Commit `c44ea79` 部署 Render Preview 獨立測試站點）」進行深度就緒審查（Readiness Audit）。

經本團隊在**完全不碰觸、不修改現有 15 個已修改檔案、不修改五大術科題組、不執行任何 Git 寫入或分支切換**的前提下，透過專用隔離沙盒執行完整驗證，確認以下結論：

1. **版本有效性**：GitHub 遠端 `origin/main` 目前精確指向指定的 `c44ea7929f39ef469f380027c2fd3143726d9922`，版本完全吻合且凍結有效。
2. **建置健全度**：該 Commit 之 `frontend` 代碼在隔離沙盒中以 `npm ci` 與 `npm run build` 建置耗時 2.21 秒，TypeScript 0 錯誤，資安掃描 0 違規。
3. **環境隔離性**：Demo Mode 能完全切斷對 localhost 後端與正式資料庫的連線，具備 100% 獨立展示能力。
4. **設定完整性**：Render Static Site 之參數、環境變數（`VITE_DEMO_MODE=true`、`VITE_BASE_PATH=/`、`NODE_VERSION=20`）與 SPA Rewrite 規則已全數定義並產出詳細操作指南。
5. **責任邊界明確**：本機工作目錄與未提交之後台新功能受到 100% 完整保護，未發生任何覆寫或污染。

---

## 二、關鍵就緒指標檢核清單 (Readiness Checklist)

```text
================================================================================
方案 B 部署就緒檢核指標清單 (2026-11-15 20:48 審查通過)
================================================================================
[✓] 1. 指定 Commit 有效性查核
    - 指定 Commit SHA        : c44ea7929f39ef469f380027c2fd3143726d9922 (有效存在)
    - 遠端 origin/main SHA   : c44ea7929f39ef469f380027c2fd3143726d9922 (100% 一致)
    - 本地 HEAD SHA          : c44ea7929f39ef469f380027c2fd3143726d9922 (100% 一致)

[✓] 2. 前端獨立建置相容性
    - 隔離目錄               : scratch/build_test_c44ea79/frontend
    - 套件還原 (npm ci)      : 耗時 15s，0 漏洞 (Zero vulnerabilities)
    - 型別編譯 (tsc)         : 0 errors (成功通過)
    - Vite 生產打包          : 耗時 2.21s，產出 dist/ 完整目錄
    - 主 Bundle 體積         : 470.86 kB (未超過 500 kB 警示門檻)

[✓] 3. 資安與機密掃描 (DevSecOps)
    - 掃描檔案數             : 18 個靜態產出物 (.html, .js, .css)
    - 機密違規項目           : 0 違規 (無 DB 連線字串、無金鑰、無 localhost 殘留)

[✓] 4. 環境變數規劃
    - VITE_DEMO_MODE=true    : 已確認代碼支援，成功啟用離線純前端展示模式
    - VITE_BASE_PATH=/       : 已確認 vite.config.ts 支援，根路徑資源引用
    - NODE_VERSION=20        : 指定 Node 20 LTS 構建，相容 lockfile

[✓] 5. SPA 路由與靜態資源
    - 路由模式               : Hash-based Routing (NavigationContext.tsx)
    - Rewrite 規則           : /* -> /index.html (Rewrite 200)

[✓] 6. 平台成本與限制
    - 預估月費               : $0 USD (Render Static Site 終身免費)
    - 頻寬額度               : 100 GB / 月 (極度充裕)
    - 建置時間               : 500 分鐘 / 月 (單次約 45 秒，可建置 600+ 次)
    - 休眠特性               : 無休眠 (CDN 託管，秒開無延遲)

[✓] 7. 既有環境與資產保護
    - GitHub Pages 展示站    : 100% 獨立，零影響
    - 五大正式術科題組       : 100% 凍結，零修改
    - 本機 15 個已修改檔案   : 100% 保留於工作目錄，零重設
    - AUTH-03 / 資料庫       : 維持阻斷 (BLOCKED)，零連線
================================================================================
```

---

## 三、遠端版本 (c44ea79) 與本機工作目錄落差明確備忘

為使驗收標準清晰，再次記錄方案 B 部署之內容邊界：

| 功能模組 | 遠端 Commit c44ea79 狀態（方案 B 呈現） | 本機工作目錄狀態（保留不提交） |
| :--- | :--- | :--- |
| **官方首頁與展示** | 包含基本 Hero、特色介紹與課程連結 | 包含相同首頁結構 |
| **模擬測驗題庫** | 包含隨機抽題、計時與自動閱卷評分 | 包含相同模擬測驗功能 |
| **理論與實作整合** | 包含題綱閱讀與程式碼實作編輯器 | 包含進階單元跳轉優化 |
| **五大互動遊戲** | 包含拼圖、CSS、除錯、問答、架構原型 | 包含相同遊戲原型與 109 項測試 |
| **五大術科題組** | 包含 104301～104305 原始標準題綱 | 僅 Task 1 擴充 59 行教學說明（題組 2~5 零異動） |
| **學生個人自修工具** | 未包含（使用預設展示資料） | 包含 `studentStudyToolsStorage.ts`（錯題本、筆記） |
| **學生加入班級彈窗** | 未包含 | 包含 `StudentClassJoinModal.tsx` |
| **教師教學管理後台** | 包含基礎儀表板原型 | 包含進階班級管理、學生名冊與公告系統 |
| **平台管理員後台** | **完全不包含** | 包含 `AdminDashboardPage.tsx`（五大後台分頁） |

> **結論**：方案 B 是一次乾淨、安全且標準的「遠端基線預覽」，能完整驗證 Render Static Site 的建置、分發、Demo Mode 與跨裝置體驗；本機未提交的高階後台功能將完整封存在本地，等待後續波次經正式授權後再行推播。

---

## 四、下一步操作指引與授權事項

本團隊已依任務書規範完成所有前置準備，並產出可供專案負責人直接對照操作的步驟指南：
- 完整操作手冊請參閱：[`docs/development/RENDER_PREVIEW_SCHEME_B_OPERATION_GUIDE.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/RENDER_PREVIEW_SCHEME_B_OPERATION_GUIDE.md)

### 待專案負責人自行執行之操作清單：
1. 登入 Render 控制台（[dashboard.render.com](https://dashboard.render.com)）。
2. 安裝並授權 Render GitHub App 存取 `Leonjay990414/CODE-TO-KNOW` 倉庫。
3. 建立 Static Site：
   - Name: `code-to-know-preview`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
   - Auto-Deploy: `No`（關閉自動部署以鎖定版本）
4. 配置環境變數：
   - `VITE_DEMO_MODE` = `true`
   - `VITE_BASE_PATH` = `/`
   - `NODE_VERSION` = `20`
5. 建立後配置 SPA Rewrite：
   - Source: `/*` $\to$ Destination: `/index.html` (Rewrite)
6. 點擊 "Manual Deploy" $\to$ "Deploy latest commit" 啟動首次部署。

---

## 五、最終就緒判定

$$\mathbf{最終審查判定：【A.\ READY：所有設定已確認，可以等待使用者授權建立服務】}$$

**本任務已全數完成並立即停止。未執行任何 Render 服務建立、GitHub App 授權、Commit、Push 或 Deploy 操作。等待專案負責人下一步指示！**
