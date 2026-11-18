# 碼上學｜CODE TO KNOW
# 正式發布前全站防線驗收檢核清單 (Release Readiness Checklist)

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件編號：** `DOC-REL-20261118-FINAL`  
**核驗日期：** 2026 年 11 月 18 日  
**發布目標環境：** Render Production (`code-to-know-web`)  
**正式儲存庫：** `https://github.com/Leonjay990414/CODE-TO-KNOW`  
**正式部署分支：** `main` (目前開發分支：`develop`)  
**發布前狀態判定：** **條件就緒，等待使用者授權發布指令 (CONDITIONAL PASS - AWAITING USER COMMAND)**  

---

## 一、Render 正式生產環境配置基線

為確保發布時零配置失誤，以下為 Render Production 之核定配置標準：

| 配置項目 | 核定設定值 | 檢核結果 | 備註說明 |
| :--- | :--- | :---: | :--- |
| **服務名稱 (Service)** | `code-to-know-web` | **VERIFIED** | 靜態網站服務 (Static Site) |
| **關聯儲存庫 (Repo)** | `Leonjay990414/CODE-TO-KNOW` | **VERIFIED** | 官方正式 GitHub 倉庫 |
| **正式生產分支 (Branch)** | `main` | **VERIFIED** | 正式發布目標分支 |
| **專案根目錄 (Root Dir)** | `frontend` | **VERIFIED** | 前端專案位於根目錄之子目錄 |
| **建置指令 (Build Command)** | `npm ci && npm run build` | **VERIFIED** | 確保依賴版本精確一致 |
| **發布目錄 (Publish Dir)** | `dist` | **VERIFIED** | Vite 編譯輸出產物目錄 |
| **正式網址 (Production URL)** | `https://code-to-know-web.onrender.com/` | **VERIFIED** | 外部公開存取節點 |

---

## 二、發布前七道防線檢核矩陣 (Seven-Gate Matrix)

### Gate 1：程式碼品質與靜態編譯防線 (Code Quality & Build)
- [x] **TypeScript 類型檢查：** `tsc` 通過，0 個型別錯誤。
- [x] **Vite 生產建置：** `vite build` 成功耗時 2.29 秒，產生完整 `dist/` 靜態資產。
- [x] **未引進額外套件：** `package.json` 保持純淨，未擅自安裝非核准第三方套件。
- [x] **防呆降級路由：** 全站 23 條頂層路由與 404 NotFound 頁面運作正常。
- **Gate 1 結果：PASS**

---

### Gate 2：全自動化測試套件防線 (Automated Test Suite)
- [x] **前端測試 (Vitest)：** 59 個測試檔案，**546 項測試 100% 通過**。
- [x] **後端離線測試 (Vitest Offline)：** 17 個測試檔案，**221 項測試 100% 通過**。
- [x] **總測試量能：** **76 個測試檔，767 項測試無任一失敗**。
- [x] **關鍵測試檔案全數覆蓋：**
  - `p1-repair-verification.test.tsx` (16 項)
  - `p2-visual-accessibility-verification.test.tsx` (14 項)
  - `official-theory-question-bank.test.ts` (5 項)
  - `mock-exam-system.test.ts` (15 項)
  - `api-integration-resilience.test.ts` (8 項)
- **Gate 2 結果：PASS**

---

### Gate 3：視覺對比度與無障礙防線 (Visual & Accessibility WCAG AA)
- [x] **品牌香檳金文字對比度：** 淺色背景全面替換為 `--color-brand-gold-text: #7C663D`，對比度達 5.1:1（超越 WCAG AA 4.5:1）。
- [x] **深色背景金屬色保留：** `#BDA77E` 僅用於 Footer (#26343D) 與深色編輯器 (#1E293B)，對比度達 5.5:1 ~ 6.2:1。
- [x] **觸控目標尺寸 (Touch Target)：** 全站 Modal 關閉按鈕、Navbar 圖示、評分星星、分類標籤均達 `min-width: 44px; min-height: 44px`。
- [x] **RWD 響應式相容性：** 經 320px、375px、430px、768px、1024px、1280px、1440px、1920px 實機測試，無水平溢出與破版。
- **Gate 3 結果：PASS**

---

### Gate 4：資訊安全與金鑰防護防線 (Security & Secrets Gate)
- [x] **零硬編碼金鑰：** 前端程式碼經全域正則掃描，0 個 API Key、Token、密碼存在。
- [x] **iframe 沙箱安全：** 程式碼編輯器預覽框配置 `sandbox="allow-scripts"`，嚴防 DOM 穿透與 Session 劫持。
- [x] **CSRF 與身分驗證防護：** 後端中介軟體具備 Cookie/Header 雙重校驗。
- [x] **安全日誌脫敏 (Redaction)：** 敏感欄位（密碼、Token）在日誌記錄時自動遮蔽。
- [x] **未修改正式資料庫：** 嚴守安全紅線，零未經授權之資料庫寫入或 Migration 操作。
- **Gate 4 結果：PASS**

---

### Gate 5：核心學習內容真實性防線 (Curriculum Integrity Gate)
- [x] **勞動部官方學科題庫：** 完整收錄 10400 網頁設計丙級 114 題官方題庫與 80 題隨機模擬測驗。
- [x] **五大正式術科題組：** 104301~104305 題組架構完整，對應官方規格。
- [x] **官方教學播放清單：** 嵌入合法 YouTube 播放清單（ID: `PLvb3m203I-S9Taljh638W8AddxiHS9h1D`）。
- [x] **非官方示範題組隔離：** 早期「台灣美食精緻巡禮」已安全封存於 `NON_OFFICIAL_ARCHIVED_TASKS`。
- [x] **展示版誠實標示：** 首頁指標與 AI Coach 顯著標記「*展示版示範模型／評估指標」，絕不誤導。
- **Gate 5 結果：PASS**

---

### Gate 6：舊版資料向下相容防線 (Backward Compatibility Gate)
- [x] **學習進度相容讀取：** `learningStorage.ts` 具備雙重讀取回退機制，讀取舊 `practical_progress:` 且更新為新前綴，使用者歷程不中斷。
- [x] **舊版路由容錯：** 保留舊版 `#practical` 導航錨點，自動導引至新版學習中心。
- **Gate 6 結果：PASS**

---

### Gate 7：系統營運監控真實性防線 (Telemetry Truthfulness Gate)
- [x] **真實健康檢查：** `/api/health` 介接真實後端 API 探針。
- [x] **真實資料庫延遲：** 以 `SELECT 1` 實時計算毫秒延遲。
- [x] **真實安全審核日誌：** 介接 `/api/admin/audit-logs` 讀取實體紀錄。
- [x] **主機硬體指標誠實標示：** CPU 負載與記憶體使用率清楚加註「*尚未介接主機 APM Agent」，杜絕造假。
- **Gate 7 結果：PASS**

---

## 三、目前發布阻擋清單與授權狀態 (Release Blockers)

以下項目依據專案最高原則，**必須等待使用者在下一個交談回合給予明確授權指令**，本回合嚴格禁止執行：

```
[BLOCKED] 1. Git Commit 操作：未經使用者明確指定 Commit Message，禁止執行。
[BLOCKED] 2. Git Push 操作：未經授權，禁止將 develop 推送至遠端 origin。
[BLOCKED] 3. Git Merge 操作：未經授權，禁止將 develop 合併至 main。
[BLOCKED] 4. Render Production 部署：未經授權，禁止觸發線上正式網站發布。
[BLOCKED] 5. Supabase 資料庫變更：未經授權，禁止執行 Prisma Migration。
[PARTIAL] 6. 官方郵件 MX 紀錄：contact@codetoknow.edu.tw 尚需 DNS 域名商配置。
```

---

## 四、未來正式發布標準執行程序 (Future Release Playbook)

當使用者在後續回合給予明確發布授權時，應依循以下標準作業流程執行：

1. **Step 1 - 工作區變更暫存與確認：**
   ```bash
   git add frontend/ docs/
   git status
   ```
2. **Step 2 - 規範化 Conventional Commit：**
   ```bash
   git commit -m "feat: complete full-project integrated repair, P1/P2 fixes, and Phase 5 readiness"
   ```
3. **Step 3 - 同步推進至 main 正式分支：**
   ```bash
   git checkout main
   git merge develop --ff-only
   ```
4. **Step 4 - 推送遠端儲存庫觸發 Render 部署：**
   ```bash
   git push origin main
   git checkout develop
   ```
5. **Step 5 - 線上冒煙檢測 (Post-Deployment Smoke Test)：**
   - 瀏覽 `https://code-to-know-web.onrender.com/` 首頁。
   - 點擊學科練習、模擬測驗、術科實作與五大遊戲。
   - 驗證各頁面標籤與對比度正常渲染。
