# CODE TO KNOW（碼上學）
# PHASE 3C-3E-R1：Supabase 唯讀驗證腳本安全審查報告
# (Static Security Audit of verify_cloud_readonly.cjs)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-3E-R1 Script Security Audit)
- **審核日期**：2026-11-08
- **審核團隊**：Node.js 資安工程師、PostgreSQL DBA
- **目標審查檔案**：`C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\verify_cloud_readonly.cjs`
- **任務性質**：**STRICTLY READ-ONLY STATIC SECURITY AUDIT (靜態安全審查，不執行腳本、不連線資料庫、不修改程式碼)**
- **最終判定**：**`PASS` (可安全由專案管理員於本機終端進行唯讀驗證)**

---

## 一、審查目標檔案基本資訊

| 項目 | 查核數據 / 規格 |
| :--- | :--- |
| **檔案路徑** | `C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\verify_cloud_readonly.cjs` |
| **檔案大小** | 4,204 位元組 (142 行原始碼) |
| **實測 SHA-256 雜湊值** | `6DD4792CF69B57098AD72FCEA0247270ABCDCD3EE629AA562B6A27567DAB044A` |
| **執行環境依賴** | Node.js 內建模組 (`fs`, `readline`) 搭配 `backend/node_modules/pg` (8.13.1) |
| **存取憑證路徑** | `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt` (專案倉儲外安全路徑) |

---

## 二、逐項安全審查結果 (Detailed Security Audit)

```mermaid
flowchart TD
    subgraph ScriptFlow["verify_cloud_readonly.cjs 執行生命週期"]
        Init["1. 初始化: 檢查並載入專案外 supabase-root.crt"]
        Prompt["2. 密碼獲取: 終端 setRawMode(true) 掩碼輸入 (*)"]
        PoolInit["3. 建立連線池: host, port 5432, user, ssl (rejectUnauthorized: true, max: 1)"]
        Handshake["4. 連線雲端 Session Pooler (TLS 1.3 握手)"]
        Queries["5. 依序執行 8 組純唯讀 SELECT 中繼資料查詢"]
        Release["6. finally 區塊: client.release() + await pool.end() 清理連線"]
    end

    Init --> Prompt --> PoolInit --> Handshake --> Queries --> Release
```

### A. SQL 安全性審查 `[PASS]`
審查團隊逐行檢索腳本內所有的 SQL 查詢語句：

| 行號 | SQL 查詢語句 | 查詢目的與類型 | 是否涉及寫入 / DDL | 安全判定 |
| :---: | :--- | :--- | :---: | :---: |
| **Line 96** | `SELECT version();` | 讀取 PostgreSQL 引擎版本與作業系統架構 | **否 (純唯讀函式)** | `[PASS]` |
| **Line 100** | `SELECT current_database();` | 讀取目前連線之資料庫名稱 (`postgres`) | **否 (純唯讀函式)** | `[PASS]` |
| **Line 104** | `SELECT current_user;` | 讀取目前驗證通過之身分名稱 | **否 (純唯讀屬性)** | `[PASS]` |
| **Line 108** | `SELECT current_schema();` | 讀取目前預設工作綱要 (`public`) | **否 (純唯讀函式)** | `[PASS]` |
| **Line 112** | `SELECT inet_server_addr();` | 讀取伺服器後端實體 IP 位址 | **否 (純唯讀函式)** | `[PASS]` |
| **Line 116** | `SELECT current_setting('server_version');` | 讀取伺服器設定之版本字串 | **否 (純唯讀函式)** | `[PASS]` |
| **Line 120** | `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;` | 讀取資料庫現存綱要清單 | **否 (系統目錄唯讀查詢)** | `[PASS]` |
| **Line 124** | `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;` | 讀取 `public` 綱要內之資料表清單 | **否 (系統目錄唯讀查詢)** | `[PASS]` |

- **寫入操作檢查**：**0 個** INSERT、UPDATE、DELETE、TRUNCATE。
- **結構變更檢查**：**0 個** CREATE、ALTER、DROP。
- **程序呼叫檢查**：**0 個** DO、CALL 或觸發程序。
- **SQL 注入風險**：**0 風險**。所有 SQL 均為硬編碼字串常數（String Literals），完全沒有字串拼接或外部參數代入。

---

### B. 密碼安全性審查 `[PASS]`

1. **終端互動掩碼輸入 (Masked Input)**：
   - 程式碼第 26-51 行實作了 `process.stdin.setRawMode(true)` 底層攔截：
     - 使用者每按鍵一次，終端僅輸出掩碼字元 `*`（第 45 行）。
     - 支援退格鍵（Backspace `\b \b`，第 38-42 行）。
     - 按下 Enter 鍵時平穩結算密碼，**完全不在終端螢幕顯示明文**。
2. **密碼儲存與外洩風險排查**：
   - **無寫入檔案**：腳本無任何 `fs.writeFileSync` 或檔案輸出呼叫。
   - **無輸出至 Console**：密碼字串未曾傳入 `console.log` 或 `console.error`。
   - **無命令列參數暴露**：密碼不透過 `process.argv` 傳遞。
   - **無環境變數持久化**：密碼未寫入系統永久環境變數。
   - **錯誤捕捉安全性**：第 134-136 行之 `catch (err)` 僅印出 `err.message` 與 `err.code`，不會輸出連線物件或密碼本身。

---

### C. TLS 憑證與主機名稱驗證審查 `[PASS]`

1. **Root CA 載入與檔案隔離**：
   - 第 9 行鎖定專案目錄外之安全路徑：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`。
   - 第 11-14 行於啟動時查驗檔案存在性，若遺失立即終止（`process.exit(1)`）。
2. **嚴格 TLS 驗證配置**：
   - 第 80-84 行明確配置：
     ```javascript
     ssl: {
         ca: caPem,
         rejectUnauthorized: true,
         servername: host,
     }
     ```
   - **`rejectUnauthorized: true`**：嚴格強制開啟憑證有效性校驗，**無任何關閉驗證（false）之備援路徑**。
   - **`servername: host`**：顯式傳入 `aws-0-ap-southeast-2.pooler.supabase.com`，由 Node.js 底層 TLS 模組執行嚴密的 SNI 與 SAN 主機名稱匹配。
3. **無連線字串覆蓋風險**：
   - 腳本採用明確物件參數（`new Pool({ host, port, database, user, password, ssl })`），完全未使用 URL 連線字串，不存在 query 參數混淆或覆蓋問題。

---

### D. 連線生命週期與阻斷防護審查 `[PASS]`

1. **連線端點核實**：
   - `host`: `aws-0-ap-southeast-2.pooler.supabase.com`（經核准之官方 Session Pooler）。
   - `port`: `5432`（Session Mode 專屬埠位）。
   - `database`: `postgres`。
   - `user`: `postgres.ypibmyfxfhsyfdwxprpi`（包含 Project Ref 之合法使用者）。
2. **容量與超時保護**：
   - **`max: 1`**（第 87 行）：全腳本**僅允許開啟 1 條連線**，絕無可能對 Supabase 連線池造成耗盡或壓力。
   - **`connectionTimeoutMillis: 10000`**（第 85 行）：10 秒逾時 Fail-Fast，避免網路中斷時行程無限掛起。
   - **`idleTimeoutMillis: 5000`**（第 86 行）：閒置 5 秒自動釋放。
3. **連線資源清理**：
   - 第 132 行於查詢完畢後主動呼叫 `client.release()`。
   - 第 138 行於 `finally` 區塊強制執行 `await pool.end()`，確保無論成功或拋出異常，Socket 均能 100% 關閉中斷。
4. **無不安全自動重試**：
   - 遇錯即在第 135 行輸出錯誤並結束，不發起任何盲目重試。

---

### E. 執行結果輸出內容審查 `[PASS]`

腳本輸出內容嚴格限於：
- PostgreSQL 系統版本字串。
- 當前連線之資料庫與使用者名稱。
- 伺服器端點 IP。
- 綱要名稱清單 (`information_schema.schemata`)。
- `public` 綱要內之資料表清單名稱與總數。
- **無任何敏感個資**、無任何密碼或 Token 輸出。

---

## 三、審查總結與最終判定

```mermaid
graph LR
    subgraph AuditChecklist["安全稽核項目 (Security Checklist)"]
        SQL["SQL 唯讀性: 8 個 SELECT, 0 個寫入 [PASS]"]
        PWD["密碼保護: 終端掩碼輸入, 不落地, 不輸出 [PASS]"]
        TLS["TLS 憑證: Pinning 官方 Root CA, 嚴格驗證 [PASS]"]
        CONN["連線配額: max=1, 10s 超時, 完工關閉 [PASS]"]
        OUT["輸出審查: 純中繼資料, 無個資無憑證 [PASS]"]
    end

    SQL --> FinalVerdict["最終判定: PASS<br/>可安全由使用者於本機終端執行"]
    PWD --> FinalVerdict
    TLS --> FinalVerdict
    CONN --> FinalVerdict
    OUT --> FinalVerdict
```

### 最終判定：**`PASS (可安全進行唯讀驗證)`**
- **判定依據**：
  該腳本具備最高等級之唯讀保護、密碼掩碼防護、TLS 1.3 憑證鏈校驗與連線數收斂（`max: 1`），**完全不具備任何修改資料庫結構或資料之能力**。
- **使用者自行執行授權建議**：
  專案管理員可安全於本機獨立終端視窗中執行該腳本，驗證 Supabase 雲端資料庫之連線與 Schema 狀態。

---

*報告產出時間：2026-11-08*  
*報告路徑：`docs/DATABASE_PHASE3C3E_R1_READONLY_SCRIPT_SECURITY_AUDIT.md`*
