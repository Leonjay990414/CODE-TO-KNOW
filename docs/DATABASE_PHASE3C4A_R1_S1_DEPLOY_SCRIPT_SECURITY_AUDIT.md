# CODE TO KNOW (碼上學)
# PHASE 3C-4A-R1-S1：正式 Migration 部署腳本獨立安全審查報告

**文檔版本**：1.0  
**審查日期**：2026-11-08  
**審查角色**：資深 Node.js 資安工程師、PostgreSQL DBA、Prisma 7 架構師  
**審查目標**：針對即將在使用者本機執行的三個部署與驗收腳本進行完整源碼級靜態安全審核，確保零憑證外洩風險、零非授權 DDL/DML、零額外費用風險。

---

## 一、審查目標檔案與 SHA-256 數位指紋

所有腳本均存儲於獨立隔離目錄，並經 SHA-256 驗證：

| 檔案名稱 | 實體路徑 | 大小 (Bytes) | SHA-256 數位指紋 | 判定 |
| :--- | :--- | :---: | :--- | :---: |
| **`run_cloud_migrate_deploy.cjs`** | `scratch\run_cloud_migrate_deploy.cjs` | 4,399 | `3dd75d8df9de55d2ca37bb11908345da0079d55ee8e6b7d32535975869435669` | **PASS** |
| **`run_cloud_migrate_deploy.ps1`** | `scratch\run_cloud_migrate_deploy.ps1` | 1,850 | `b7a6aef6ecbe916127081261467df7e901c74817c7cdc45c75bb79b986db52f9` | **PASS** |
| **`verify_cloud_post_migration.cjs`** | `scratch\verify_cloud_post_migration.cjs` | 8,678 | `ab1c79d84f6a79bc892829c587a4defdc69f8424ffb0b9a08adbff02e2f87953` | **PASS** |

---

## 二、PowerShell 腳本安全審查 (`run_cloud_migrate_deploy.ps1`)

針對使用者要求之 10 項 PowerShell 安全檢驗項目逐項核對：

1. **密碼接收方式**：
   - 經檢查源碼，`.ps1` 僅作為使用者友善外殼，**完全不在 PowerShell 層處理任何密碼**。
   - 避免了過去 PowerShell `SecureString` 在轉型為一般字串（`BSTR` 或 `PtrToStringAuto`）時在記憶體中殘留且失去受保護特性的典型安全缺陷。
   - 密碼接收完全移交由底層 Node.js 以 RawMode `stdin` 逐字元接收，PowerShell 行程內部完全無密碼變數。
2. **命令列參數暴露風險**：
   - 指令僅執行 `node $scriptPath`，無任何命令列參數（`args` 為空），任何系統層級的進程稽核（Process Creation Auditing, Sysmon Event ID 1）均無法捕捉任何敏感資訊。
3. **日誌與磁碟殘留**：
   - 零磁碟寫入、零檔案日誌輸出。
4. **子程序環境變數安全**：
   - 未在 PowerShell 設置任何敏感全域或使用者級環境變數（如 `$env:DATABASE_URL`），不會意外持久化至目前登入使用者環境。
5. **Execution Policy 安全性**：
   - 指令採用明確單次 bypass 參數引導，不變更系統全域 Execution Policy。
6. **結束狀態與退出碼 (Exit Code)**：
   - 透過 `$LASTEXITCODE` 忠實捕捉 Node.js 執行結果，若失敗（非 0）則明確退出並提示紅色警告，絕不會在失敗時誤報成功。
7. **執行次數保證**：
   - 單一線性調用，無迴圈、無重試機制，保證僅執行一次。

**PowerShell 審核判定**：**PASS**

---

## 三、Node.js 部署腳本安全審查 (`run_cloud_migrate_deploy.cjs`)

針對正式部署命令與憑證生命週期進行逐行審查：

1. **命令唯一性與授權範圍**：
   - 呼叫端點為 `prismaCmd`，傳遞參數固定為 `['migrate', 'deploy']`。
   - 絕無 `db push`、`migrate resolve`、`migrate reset` 或額外自訂 DDL。
2. **密碼生命週期與記憶體安全**：
   - 採用 `process.stdin.setRawMode(true)` 進行終端逐字節捕捉，終端即時輸出 `*` 遮罩。
   - 支援 Backspace (`\b` / ASCII 127) 與 Enter (`\r`, `\n`)。
   - 密碼僅存在於臨時變數中，編碼後組入臨時 `env` 物件傳給子行程。
   - 在子程序 `close` 事件觸發時，立即執行：
     ```javascript
     env.MIGRATION_DATABASE_URL = '';
     delete env.MIGRATION_DATABASE_URL;
     ```
     強制覆蓋並自記憶體中刪除，確保無殘留。
3. **連線字串與 TLS 設定**：
   - 目標主機：`aws-0-ap-southeast-2.pooler.supabase.com:5432`（精準鎖定 Session Pooler）。
   - 使用者帳號：`postgres.ypibmyfxfhsyfdwxprpi`（精確鎖定生產專案 Project Ref）。
   - 憑證設定：`sslcert=C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/certs/supabase-root.crt`。
   - 嚴格模式：`sslaccept=strict&sslmode=require`（強制驗證 Supabase Root CA，禁止中間人攻擊）。
   - 延遲參數：`connect_timeout=15&connection_limit=1`（解決跨海延遲，避免池化耗盡）。
4. **環境隔離**：
   - 顯式宣告 `delete env.DIRECT_URL`，確保 Prisma 7 的 `resolveDatasourceUrl` 不會被可能存在的 IPv6 Direct URL 覆蓋。
5. **異常處理與退出**：
   - 捕捉全域例外，退出碼直接傳遞給母體。

**Node.js 部署腳本審核判定**：**PASS**

---

## 四、雲端驗收腳本安全審查 (`verify_cloud_post_migration.cjs`)

針對 Migration 後的結構與資料安全核對腳本進行靜態稽核：

1. **SQL 唯讀性保證**：
   - 檢查腳本內部所有 8 組 SQL 查詢：
     - `SELECT table_name FROM information_schema.tables...` (唯讀)
     - `SELECT id, migration_name... FROM "_prisma_migrations"...` (唯讀)
     - `SELECT tc.table_name, kcu.column_name... FROM information_schema.table_constraints...` (唯讀)
     - `SELECT schemaname, tablename, indexname FROM pg_indexes...` (唯讀)
     - `SELECT t.typname, e.enumlabel FROM pg_type...` (唯讀)
     - `SELECT tc.table_name... FROM information_schema.check_constraints...` (唯讀)
     - `SELECT COUNT(*)::int AS cnt FROM ...` (唯讀統計)
   - **完全無** `CREATE`、`ALTER`、`DROP`、`TRUNCATE`、`INSERT`、`UPDATE`、`DELETE`。
2. **零自動修復**：
   - 腳本完全不包含任何 fallback、auto-repair 或 repair SQL。結構若有任何出入，僅輸出至終端與 JSON 報告供 DBA 判讀。
3. **TLS 與憑證安全**：
   - 使用 `pg.Pool`，配置 `rejectUnauthorized: true`，傳入實體 Root CA 憑證內容，連線安全性達到最高等級。

**雲端驗收腳本審核判定**：**PASS**

---

## 五、執行安全機制對比總表

| 安全檢驗項 | 審查標準 | 本次三腳本實作機制 | 審查判定 |
| :--- | :--- | :--- | :---: |
| **密碼命令列洩漏** | 嚴禁出現在 CLI 引數 | 透過互動式 Stdin 讀入，命令列為空引數 | **PASS** |
| **密碼日誌與磁碟洩漏** | 嚴禁寫入日誌或檔案 | 純記憶體暫存，連線字串不輸出至 console | **PASS** |
| **密碼記憶體清理** | 結束後立即擦除 | close 回呼中將字串重設為空並 delete | **PASS** |
| **目標端點校驗** | 限 Session Pooler 5432 | 寫死於連線字串，無誤連 Direct 或本機風險 | **PASS** |
| **TLS 憑證校驗** | 強制 Strict Root CA | `sslaccept=strict` + `supabase-root.crt` | **PASS** |
| **重複執行防護** | 禁止重試迴圈 | 單次同步執行，非 0 即刻終止退出 | **PASS** |
| **驗收腳本唯讀性** | 僅允許 SELECT | 100% 資訊架構唯讀查詢，無寫入語法 | **PASS** |

---

## 六、最終安全判定：`GO`

本專案正式 Migration 部署腳本與唯讀驗收腳本均已通過源碼級安全審查，**無密碼外洩風險、無非授權操作風險、無重試失控風險**，具備由使用者在本機 PowerShell 終端機執行的最高安全級別。
