# 碼上學｜CODE TO KNOW
# 正式發布阻擋清單與外部依賴總冊 (Release Blockers and Dependencies)

**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**文件編號：** `DOC-BLK-20261118-RELEASE`  
**建立日期：** 2026 年 11 月 18 日  
**評定原則：** 實事求是、零過度自信、嚴守安全紅線、明確解除阻擋條件  

---

## 一、發布阻擋總表 (Blocker Summary Table)

目前專案若要進行正式發布（推送到 GitHub `main` 分支並觸發 Render Production 部署），存在以下四類阻擋因素：

| 阻擋編號 | 阻擋類別 | 阻擋標題 | 目前狀態 | 解除條件 (Criteria to Unblock) | 影響範圍 |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **BLK-01** | 程序/授權 | **Git 操作未經授權** | **BLOCKED** | 使用者於交談中明確下達「執行 commit 及 push」指令。 | 全版本控制與部署觸發 |
| **BLK-02** | 雲端部署 | **Render Production 未經授權** | **BLOCKED** | 使用者確認正式環境準備就緒，授權觸發線上發布。 | 公開線上正式站台 |
| **BLK-03** | 資料庫 | **Supabase AUTH-03 隔離約束** | **BLOCKED** | 使用者授權連接雲端資料庫並核准執行 Prisma Migration。 | 跨裝置雲端資料持久化 |
| **BLK-04** | 網域與郵件 | **官方信箱 MX 解析未配置** | **PARTIAL** | 網管於 DNS 服務商設定 MX/SPF/DKIM 指向有效郵件伺服器。 | 外部客服與系統驗證信 |
| **BLK-05** | 第三方 API | **Gemini API 金鑰未注入後端** | **PARTIAL** | 在 Render/主機環境變數配置 `GEMINI_API_KEY`。 | 即時 LLM 串流對話 |
| **BLK-06** | 運營遙測 | **主機 APM 探針尚未介接** | **PARTIAL** | 於伺服器安裝 Node.js APM 或主機監控 Agent。 | System Ops 之 CPU/RAM 圖表 |

---

## 二、逐項阻擋深度分析與解除路徑

### 1. BLK-01：Git Commit、Push、Merge 授權防線
- **根本原因：** 專案安全限制第 0.1 條明確規定：「未經使用者對具體操作再次明確授權，不得執行 Git Commit、Push、Merge」。
- **現況分析：** 目前所有 P1/P2 修復與架構防護已完備，工作區包含 32 個修改檔案與數個新實作檔案，全數處於 Worktree 暫存狀態。
- **解除步驟：**
  1. 使用者在交談中明確給予授權。
  2. 執行：
     ```bash
     git add frontend/ docs/
     git commit -m "feat: complete full-project integrated repair, P1/P2 accessibility, and Phase 5 master planning"
     ```

### 2. BLK-02：Render Production 部署授權防線
- **根本原因：** 專案安全限制禁止擅自向雲端生產環境發起發布。
- **現況分析：**
  - Service: `code-to-know-web` (Static Site)
  - Branch: `main`
  - URL: `https://code-to-know-web.onrender.com/`
  - 由於目前開發位於 `develop` 分支，推送到 `develop` 不會觸發 Render 生產建置；只有合併至 `main` 並推送才會觸發。
- **解除步驟：**
  1. 解除 BLK-01 完成 Commit。
  2. 使用者明確授權發布至生產環境。
  3. 將 `develop` 合併至 `main`，並執行 `git push origin main`。

### 3. BLK-03：Supabase AUTH-03 隔離約束與資料庫 Migration
- **根本原因：** 專案目前處於 `AUTH-03` 隔離模式，嚴禁未授權連接遠端 Supabase 或執行 `prisma migrate deploy`。
- **現況分析：**
  - 資料庫種子角色僅有 `STUDENT`、`TEACHER`、`ADMIN`。
  - 前端與後端已實作相容映射（`expandCompatibleRoles`），但在資料庫層面尚未建立獨立的 `SYSTEM_OPERATOR`。
- **解除步驟：**
  1. 使用者正式提供 Supabase 連線憑證。
  2. 審查 Prisma Schema 變更。
  3. 執行 Migration 新增角色 enum 與關聯資料。

### 4. BLK-04：官方信箱 MX 解析未配置
- **根本原因：** 網域名稱 `codetoknow.edu.tw` 尚未完成 DNS MX 紀錄設定。
- **現況分析：** 前端頁尾與聯絡彈窗標記為 `contact@codetoknow.edu.tw`，但寄信會失敗。目前前端已誠實加註「（網域配置維護中）」。
- **解除步驟：**
  1. 於 DNS 託管後台（如 Cloudflare / 學校 DNS）新增 MX 指向企業信箱伺服器。
  2. 新增 SPF 與 DKIM TXT 記錄以防垃圾郵件判定。
  3. 驗證收發信正常後，移除前端維護中標註。

### 5. BLK-05：Gemini API Key 伺服器端環境變數
- **根本原因：** 專案嚴禁將 API Key 放置於前端程式碼或寫入 Git。
- **現況分析：** AI Coach 目前採用本機「四階段啟發式鷹架備援引擎」運作，標註「展示版示範模型」，零呼叫外部網路。
- **解除步驟：**
  1. 在後端環境變數注入 `GEMINI_API_KEY=AIza...`。
  2. 啟動後端 Express 代理端點 `/api/ai/chat`。
  3. 前端切換至串流 SSE 模式。

### 6. BLK-06：主機 APM 探針
- **根本原因：** 目前 Render 靜態託管無常駐 Node.js 主機探針，無法獲取實體 CPU 與記憶體利用率。
- **現況分析：** System Ops 頁面誠實標註「*尚未介接主機 APM Agent」，健康檢查與資料庫延遲為真。
- **解除步驟：**
  1. 待後端獨立部署至容器環境時，引入 Prometheus 或 Datadog 探針。

---

## 三、解除阻擋後之發布檢驗簽核表 (Sign-off Checklist)

當所有阻擋依序解除後，發布前必須逐項勾稽：

- [ ] **核准 1：** 使用者明確下達 Git Commit 指令。
- [ ] **核准 2：** 使用者明確下達 main 分支推送與 Render 部署指令。
- [ ] **驗證 1：** 執行 `npm run build --prefix frontend` 編譯產物無錯誤。
- [ ] **驗證 2：** 前端 546 項測試 + 後端 221 項測試 = 767 項測試全數通過。
- [ ] **驗證 3：** 檢查 `git status` 確認無未預期檔案納入 commit。
- [ ] **驗證 4：** 線上生產網址 `https://code-to-know-web.onrender.com/` 冒煙測試通過。
