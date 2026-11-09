# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R0：Supabase 正式備份前安全審查與執行條件確認報告

**文檔版本**：1.0 (獨立安全審查)  
**審查日期**：2026-11-08  
**審查角色**：PostgreSQL DBA、Supabase 架構師、資安審查團隊  
**適用專案**：CODE TO KNOW（碼上學）  
**目標專案**：`code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`, AWS Sydney)  
**審查規範**：100% 唯讀檢查、零資料庫寫入、零 `pg_dump`/`pg_restore` 執行、零敏感資料曝露、零額外費用。

---

## 一、專案 Git 狀態與工作目錄安全檢查

經使用 `git rev-parse HEAD` 與 `git status -s` 進行唯讀稽核：

1. **目前 HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（與全系列審查基準完全一致）。
2. **工作目錄狀態**：
   - 存在開發階段既有的未暫存修改與未追蹤文檔。
   - **完全保留**所有使用者既有變更，嚴格禁止任何 `git reset`、`git clean` 或覆蓋清理。
   - 零未授權的 stage 或 commit 操作。

---

## 二、釐清 PHASE 3C-4B 檢查命令錯誤根本原因 (Forensic Diagnosis)

在上一階段執行診斷時，曾出現 3 組 Exit Code 1，經逐一進行源碼與環境比對，查明根本原因如下：

### 1. Host 端的 `pg_dump` / `pg_restore` 檢查失敗 (`Exit Code 1`)
- **失敗命令**：在本機 PowerShell 執行 `pg_dump --version; pg_restore --version`。
- **錯誤訊息**：`The term 'pg_dump' is not recognized as the name of a cmdlet...`
- **根本原因**：**本機 Windows Host 系統並未安裝全域 PostgreSQL Client Tools**，且系統 `PATH` 環境變數未包含 PostgreSQL 二進位檔路徑。
- **影響評估**：本專案本機 PostgreSQL 環境是封裝在 Docker 容器內（`code_to_know_postgres`），因此 Host 端缺少命令為正常現象。若未來需要執行 `pg_dump`，應透過 Docker 容器或具備相應工具的隔離執行環境進行，而非直接在 Windows Host 命令列呼叫。

### 2. Docker 內以預設使用者 `postgres` 檢查失敗 (`Exit Code 1`)
- **失敗命令**：`docker exec code_to_know_postgres psql -U postgres -d code_to_know -c "\l"`。
- **錯誤訊息**：`psql: error: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL: role "postgres" does not exist`。
- **根本原因**：本專案在 `docker-compose.yml` 與 `.env` 中自訂之超級使用者與主資料庫帳號為 **`codetoknow`**（`POSTGRES_USER=codetoknow`），本機容器在初始化時並未建立預設的 `postgres` 角色。因此以 `-U postgres` 連線觸發 PostgreSQL 拒絕連線。此為**帳號指定不符**，非資料庫服務損毀。

### 3. Docker 內以 `code_to_know_user` 檢查失敗 (`Exit Code 1`)
- **失敗命令**：`docker exec code_to_know_postgres psql -U code_to_know_user -d code_to_know -c "\l"`。
- **錯誤訊息**：`FATAL: role "code_to_know_user" does not exist`。
- **根本原因**：同上，專案環境變數與 Docker 配置之實際帳號為 `codetoknow`，`code_to_know_user` 僅為部分文檔中的假設名稱，實體角色名稱不存在。
- **驗證確認**：隨後使用正確認證身份 `docker exec code_to_know_postgres psql -U codetoknow -d code_to_know -c "\l"` 執行，**成功以 Exit Code 0 輸出完整資料庫清單**（確認 `code_to_know` 與 `code_to_know_restore_test` 均健康存在）。

---

## 三、本機備份實體完整性與 SHA-256 核對

經唯讀讀取實體檔案與計算雜湊：

- **實體路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`
- **檔案大小**：`25,685 Bytes`
- **實體時間**：`2026-11-08T03:40:28.000Z`
- **SHA-256 數位指紋**：
  - 實體計算值：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
  - 預期基準值：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
  - 結論：**100% 精準吻合 (MATCH)**，檔案自建立以來未受任何修改。

---

## 四、Supabase 官方備份政策來源查核與修正

針對 PHASE 3C-4B 提出之各項政策，依據 Supabase 最新官方文檔（查核日期：2026-11-08）進行逐一比對與正式來源引用：

| 評估維度 | 官方政策查核結果 | 適用方案 | 官方文件標題與正規 URL | 政策修正與確認 |
| :--- | :--- | :---: | :--- | :---: |
| **1. Free Plan 自動備份能力** | **無自動備份 (0 天)**。官方明確建議 Free Plan 專案定期手動導出備份。 | Free | [Backups](https://supabase.com/docs/guides/platform/backups) | **確認相符** |
| **2. PITR 支援方案與費用** | **僅限付費方案之選購 Add-on**。按小時計費（7 天保留約 $100/月，14 天約 $200/月，28 天約 $400/月）。Free Plan 完全不支援。 | Pro / Team / Enterprise | [Point-in-Time Recovery (PITR)](https://supabase.com/docs/guides/platform/pitr) | **確認相符** |
| **3. 自動備份保留期限** | Free: 0 天；Pro: 7 天；Team: 14 天；Enterprise: 30 天。 | 全方案 | [Backups](https://supabase.com/docs/guides/platform/backups) | **確認相符** |
| **4. pg_dump 邏輯備份支援** | 官方支援使用 `pg_dump`。在 IPv4 網路環境下，官方指定**使用 Session Pooler (Port 5432)** 連線。 | 全方案 (含 Free) | [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) | **確認相符** |
| **5. Free Plan 暫停條件** | 連續 **7 天**無資料庫活動（以 Postgres 實際查詢活動為準）即自動休眠。 | Free | [Project Pausing](https://supabase.com/docs/guides/platform/pausing) | **確認相符** |
| **6. 暫停期間保存與喚醒** | 暫停後有 **90 天**（官方 mid-2024 更新，原 1 年已縮短）可於 Studio 一鍵免費喚醒。超過 90 天僅提供下載備份檔。 | Free | [Project Pausing](https://supabase.com/docs/guides/platform/pausing) | **需要修正** (由 1 年更正為 90 天) |
| **7. 相關備份與儲存費用** | 本專案完全維持 Free Plan（**$0.00 USD**）。無備份附加費。 | Free | [Supabase Pricing](https://supabase.com/pricing) | **確認相符** |

---

## 五、正式備份執行計畫 (Execution Blueprint)

未來若獲得使用者正式授權對 Supabase 雲端執行邏輯備份，必須嚴格遵守以下執行架構：

### 1. 連線端點與通訊協定
- **目標主機**：`aws-0-ap-southeast-2.pooler.supabase.com`
- **連接埠**：**`5432` (Session Pooler)**
  - **原因**：`pg_dump` 依賴 PostgreSQL 原生 `COPY` 通訊協定與持續會話（Single Session），若使用 Transaction Pooler (6543) 會導致協定中斷失敗。
  - **IPv4 相容**：Session Pooler 解決了 Free Plan 直連主機為 IPv6-only 的網路路由限制。
- **使用者名稱**：`postgres.ypibmyfxfhsyfdwxprpi`
- **資料庫名稱**：`postgres`

### 2. 備份檔案格式與命名
- **傾印格式**：PostgreSQL Custom Format (`-Fc` / `--format=custom`)
  - **優點**：原生二進位壓縮（節省頻寬與磁碟）、具備內部校驗碼、支援 `pg_restore` 平行還原（`-j`）與選擇性資料表擷取。
- **輸出路徑規範**：
  `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_CLOUD_PROD_<YYYYMMDD_HHMMSS>\code_to_know_cloud_prod.dump`

### 3. TLS 嚴格驗證與憑證處理
- 連線參數強制包含 `sslmode=require`。
- 本機驗證必須指定實體 Root CA：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`。

### 4. 執行流程防護與密碼安全
1. **密碼輸入**：採用與 Migration 相同的本機互動式遮罩輸入（Stdin RawMode `*` 遮罩），絕不寫入命令列引數、日誌或檔案。
2. **生命週期擦除**：Dump 程序結束後，即刻將記憶體變數與連線字串覆蓋銷毀。
3. **完成驗收**：立即計算產出檔案之 SHA-256 雜湊，並登錄至 `DATABASE_PHASE3C4B_BACKUP_INVENTORY.md`。

### 5. 儲存空間與費用評估
- 目前雲端為 36 張空資料表架構，預估 Custom Dump 檔案大小約為 **25 KB ~ 50 KB**。
- 專案額外成本：**$0.00 USD**。

---

## 六、風險清單與防範措施

| 風險項目 | 風險等級 | 潛在影響 | 防範措施 |
| :--- | :---: | :--- | :--- |
| **PostgreSQL 工具版本不符** | **中 (Medium)** | Host 無 `pg_dump`，或 Docker pg16 工具遇雲端 pg17 觸發 catalog 警告 | 優先使用相容之 PostgreSQL 17 容器環境執行，或透過受控 Node.js 結構導出腳本 |
| **跨海網路中斷** | **低 (Low)** | 台灣至雪梨連線瞬斷造成 Dump 殘缺 | 產出後強制比對二進位標頭與 SHA-256，並以 `pg_restore -l` 驗證內容完整性 |
| **憑證外洩** | **高 (High)** | 密碼落盤或出現在行程參數中 | 嚴格維持 Stdin 記憶體傳遞，嚴禁將密碼放入 CLI args |
| **誤觸非授權寫入** | **極高 (Critical)**| 誤將 restore 當 dump 執行造成雲端被覆蓋 | 腳本命令寫死 `pg_dump` 唯讀導出，嚴禁包含任何 `pg_restore` 邏輯 |

---

## 七、最終審查結論與執行條件判定

### 綜合判定：`GO — 具備正式備份規劃與執行條件`

- **Git 與專案完整性**：**PASS**（HEAD: `765ff90`, 零未授權修改）。
- **診斷錯誤釐清**：**PASS**（Host 工具路徑與容器使用者名稱已完整釐清）。
- **本機備份完整性**：**PASS**（SHA-256 精確吻合）。
- **Supabase 官方政策來源**：**PASS**（所有維度均補齊官方正規文件 URL，並修正 90 天喚醒政策）。
- **備份安全計畫**：**PASS**（Session Pooler 5432 + Custom Format + Strict Root CA + 密碼不落盤）。

---

> **聲明**：  
> **「本階段僅完成正式備份前安全審查，沒有執行任何雲端備份、資料庫寫入或還原操作。」**
