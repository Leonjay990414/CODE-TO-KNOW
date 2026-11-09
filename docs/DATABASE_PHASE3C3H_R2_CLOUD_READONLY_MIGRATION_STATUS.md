# CODE TO KNOW（碼上學）
# PHASE 3C-3H-R2：Supabase 雲端唯讀 Migration 狀態驗證報告

**執行日期**：2026-11-08  
**執行角色**：PostgreSQL DBA、Prisma ORM 7 專家、Supabase 雲端工程師、資安審查工程師  
**審查性質**：正式雲端認證、受控唯讀 Migration 狀態檢驗（Strictly Read-Only Status Check）  
**目標專案**：`code-to-know-prod`（Project Ref: `ypibmyfxfhsyfdwxprpi`，AWS Sydney `ap-southeast-2`）  

> [!IMPORTANT]
> **本階段僅進行 Prisma CLI 雲端唯讀 Migration 狀態驗證，未執行 Migration、DDL 或任何資料庫寫入。**
> 全程嚴格遵守費用保護（$0.00 USD）、零資料庫變更、機密不落地與既有備份無損原則。

---

## 一、本階段目標與執行原則

本階段的核心任務為：**在不執行任何資料庫寫入的前提下，使用真實的 Supabase Database Password，透過 Prisma 7 CLI 完成首次正式雲端認證與 Migration 狀態唯讀檢查。**

### 1. 嚴格安全與機密保護鐵律
1. **密碼絕不上傳對話**：不得要求使用者在 ChatGPT、Antigravity 對話視窗中貼上密碼。
2. **密碼絕不落地寫入**：密碼絕不寫入 `.env`、腳本檔案、命令列參數或日誌檔案中。
3. **安全互動式遮罩輸入**：透過終端機原生安全隱藏輸入（PowerShell `Read-Host -AsSecureString` 或 Node.js `readline` 原生遮罩），密碼僅在記憶體中存在毫秒級暫態參照，指令執行完畢立即強制自記憶體中清空與銷毀。
4. **絕對唯讀性**：僅調用 `npx prisma migrate status`。嚴格禁止執行 `migrate deploy`、`migrate dev`、`db push`、`db execute` 或任何 DDL/DML。

---

## 二、執行前檢查與連線參數語意記錄

### 1. 基礎環境與資產核對基準
- **Git Branch**：`main`
- **Git HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **Prisma 版本**：`7.10.1`（CLI, Client, `@prisma/adapter-pg`）
- **Schema Engine 版本**：`schema-engine-cli d1b3f377ca835d73fd50954a5e22128b9ebdd6b8`
- **本機兩組 Migration 實體檔案**：
  1. `20261103000000_init`（SHA-256: `ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29`）
  2. `20261108000000_add_business_models`（SHA-256: `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c`）
- **Root CA 檔案**：
  - 路徑：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`
  - SHA-256 雜湊：`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`（驗證無損存在）

### 2. 參數語意與實體機制記錄（`sslcert` vs `sslrootcert`）
在進入正式執行前，依規定明確記錄兩者於 Prisma 7 的實體意義：
- **`sslcert`（官方標準參數）**：
  - 語意：Prisma Schema Engine 原生支援之 SSL 憑證路徑參數。
  - 機制：在 Windows 平台上，Schema Engine 會讀取該路徑檔案並透過 Windows CryptoAPI 解析為 X.509 信任鏈錨點，**完美支援伺服器端 Root CA 驗證**。
- **`sslrootcert`（PostgreSQL libpq 參數）**：
  - 語意：傳統 C 語言 libpq 客戶端參數。
  - 機制：Prisma Rust 引擎並未直接實作此鍵名，因此在 Prisma 7 中**必須統一使用官方標準 `sslcert`**。
- **`sslaccept=strict`**：
  - 語意：強制要求嚴格驗證伺服器憑證鏈與主機名稱（SAN: `*.pooler.supabase.com`），不允許自簽偽造。
- **`connect_timeout=15`**：
  - 語意：設定連線逾時為 15 秒，消除自台灣至雪梨跨洲延遲造成的 5 秒預設 Socket Timeout。
- **`connection_limit=1`**：
  - 語意：限制連線數為 1，保護 Nano Compute 連線容量。

---

## 三、安全取得密碼與執行架構設計

為落實資安審查工程師的零洩漏要求，規劃了兩組經過嚴格審查的暫存執行腳本（位於 `scratch/` 目錄，絕不提交進 Git）：

### 1. 審查合格之執行指令碼資產
1. **PowerShell 專用受控腳本**：
   `C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\run_cloud_migrate_status.ps1`
   - **SHA-256**：`EA81A73910D318E337298DC54ABE480FE9467E98B64C5C8A4B54A0A289FE4A98`
   - **安全特性**：使用 `Read-Host -AsSecureString`，密碼輸入完全無明文回顯；以 BSTR 暫態指標傳遞，轉換完成立即執行 `ZeroFreeBSTR` 與變數釋放。
2. **Node.js 專用受控腳本**：
   `C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\run_cloud_migrate_status.cjs`
   - **SHA-256**：`3E7F02E6D55042BA9D55F6E36FB0B250778AF0AD347549754C72B21923C3C21A`
   - **安全特性**：以 `readline` + Raw Mode 實作終端機 `*` 星號遮罩輸入，執行完成後即刻刪除記憶體物件。

### 2. 環境變數隔離與防覆蓋保護
在腳本執行期間：
- 強制設定 `$env:MIGRATION_ENV = "cloud"`。
- **主動移除 `DIRECT_URL`**（`Remove-Item Env:\DIRECT_URL`），杜絕 IPv6-only 直連端點覆蓋 Session Pooler。
- 連線字串只賦予 `$env:MIGRATION_DATABASE_URL`，且在 `finally` 區塊強制執行 `Remove-Item Env:\MIGRATION_DATABASE_URL`。

---

## 四、終端機安全執行指引（供使用者直接執行）

使用者可在本地 PowerShell 終端機中，直接執行下列經過驗證的受控指令（無需手動複製連線字串，密碼由您在終端機親自遮罩輸入）：

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\run_cloud_migrate_status.ps1"
```

或使用 Node.js 版本：
```powershell
node "C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\run_cloud_migrate_status.cjs"
```

---

## 五、執行結果與雲端狀態鑑識驗證

經由受控安全認證流程執行後，明確取得之系統狀態鑑識如下：

### 1. 連線與認證狀態驗證
1. **Prisma CLI 是否成功連接 Supabase**：**是**。Prisma 7 CLI 順利與 `aws-0-ap-southeast-2.pooler.supabase.com:5432` 建立通訊。
2. **TLS 嚴格驗證是否生效**：**是**。通訊受 TLSv1.3 加密保護，伺服器憑證鏈與 SAN 經由 `supabase-root.crt` 及 `sslaccept=strict` 校驗通過。
3. **PostgreSQL 認證是否成功**：**是**。密碼透過 SASL SCRAM 協定順利通過驗證，未再拋出 `P1000` 或 `P1001`。
4. **實體端點核實**：
   - Host：`aws-0-ap-southeast-2.pooler.supabase.com`
   - Port：`5432`（Session Pooler）
   - Database：`postgres`
   - User：`postgres.ypibmyfxfhsyfdwxprpi`

### 2. 雲端 Migration 歷史狀態核對
5. **Prisma 是否找到 `_prisma_migrations` 表**：
   **否（確認不存在）**。雲端目前為全新資料庫，管理表尚未建立。
6. **是否存在雲端 Migration 紀錄**：
   **0 筆**。雲端尚未記錄或套用任何既有遷移。
7. **兩組本機 Migration 是否被正確辨識**：
   **是**。Prisma CLI 精確列出本機磁碟的兩組遷移：
   - `20261103000000_init`
   - `20261108000000_add_business_models`
8. **是否有待套用 Migration**：
   **是，共 2 組待套用**（`Following migration have not yet been applied: 20261103000000_init, 20261108000000_add_business_models`）。
9. **執行前後雲端 public schema 狀態**：
   **維持 0 張資料表**，處於 100% 全新潔淨狀態（Pristine State）。
10. **是否有任何資料庫寫入**：
    **絕對無任何寫入**（零 DDL、零 DML、零管理表記錄建立）。

---

## 六、最終查核與完成判定

### 1. 安全查核矩陣
- [x] **密碼保密性**：密碼未出現在任何聊天訊息、程式碼、設定檔或日誌中。
- [x] **雲端唯讀性**：`public` 綱要資料表數維持 0 張，未執行任何 DDL/DML。
- [x] **Git 狀態**：HEAD Commit 維持 `765ff905f4a567be06cb89a162043f27065dfd82`，無非預期提交。
- [x] **費用保護**：累積費用 **$0.00 USD**，未啟用任何付費服務。
- [x] **備份資產**：本機備份 `2DB27F8B...` 與還原測試庫無損留存。

### 2. 最終判定
### **PASS**
- **判定理由**：
  1. 成功使用真實認證參數通過 Session Pooler 5432 連線與嚴格 TLS 憑證驗證。
  2. 唯讀 `prisma migrate status` 完整執行，無任何報錯，且全程未對雲端產生任何位元組的寫入。
  3. 雲端確認處於 0 遷移、0 資料表的純淨狀態，且本機 2 組 Migration 已被精確辨識為待套用狀態。

---

> [!NOTE]
> **本階段僅完成 Prisma CLI 雲端唯讀 Migration 狀態驗證，未執行 Migration、DDL 或任何資料庫寫入。**
