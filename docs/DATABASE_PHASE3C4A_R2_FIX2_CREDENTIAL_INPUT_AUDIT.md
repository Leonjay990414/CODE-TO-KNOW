# CODE TO KNOW (碼上學)
# PHASE 3C-4A-R2-FIX2：Supabase 憑證輸入與連線設定離線安全核對報告

**文檔版本**：1.0 (離線安全審核)  
**核對日期**：2026-11-08  
**執行角色**：Node.js 資安工程師、PostgreSQL DBA、Prisma 7 架構師  
**審核準則**：100% 離線靜態原始碼審核、零 Supabase 連線、零密碼輸入、零檔案破壞。

---

## 一、檢查檔案清單與 SHA-256 數位指紋

本次離線審核針對 Antigravity 隔離 scratch 目錄下所有 6 個相關腳本進行實體存在性、大小與 SHA-256 驗證：

| 檔案名稱 | 實體路徑 | 大小 (Bytes) | SHA-256 數位指紋 | 存在狀態 |
| :--- | :--- | :---: | :--- | :---: |
| **`run_verify_cloud_post_migration.ps1`** | `scratch\run_verify_cloud_post_migration.ps1` | 2,593 | `b5fd1183cf1d9814e0216bd9aabf72a83d541335808b99d6c80605493af82554` | **存在** |
| **`verify_cloud_post_migration.cjs`** | `scratch\verify_cloud_post_migration.cjs` | 8,678 | `ab1c79d84f6a79bc892829c587a4defdc69f8424ffb0b9a08adbff02e2f87953` | **存在** |
| **`run_cloud_migrate_status.ps1`** | `scratch\run_cloud_migrate_status.ps1` | 3,523 | `ea81a73910d318e337298dc54abe480fe9467e98b64c5c8a4b54a0a289fe4a98` | **存在** |
| **`run_cloud_migrate_status.cjs`** | `scratch\run_cloud_migrate_status.cjs` | 3,874 | `3e7f02e6d55042ba9d55f6e36fb0b250778af0ad347549754c72b21923c3c21a` | **存在** |
| **`run_cloud_migrate_deploy.ps1`** | `scratch\run_cloud_migrate_deploy.ps1` | 1,850 | `b7a6aef6ecbe916127081261467df7e901c74817c7cdc45c75bb79b986db52f9` | **存在** |
| **`run_cloud_migrate_deploy.cjs`** | `scratch\run_cloud_migrate_deploy.cjs` | 4,399 | `3dd75d8df9de55d2ca37bb11908345da0079d55ee8e6b7d32535975869435669` | **存在** |

---

## 二、登入設定交叉比較分析

比較先前成功套用 Migration 的部署腳本（`run_cloud_migrate_deploy.cjs`）、狀態腳本（`run_cloud_migrate_status.cjs`）與驗收腳本（`verify_cloud_post_migration.cjs`）：

| 檢查項目 | 成功之 Deploy / Status 腳本 | R2 唯讀驗收腳本 | 一致性比對與分析 |
| :--- | :--- | :--- | :---: |
| **Host** | `aws-0-ap-southeast-2.pooler.supabase.com` | `aws-0-ap-southeast-2.pooler.supabase.com` | **一致 (PASS)** |
| **Port** | `5432` | `5432` | **一致 (PASS)** |
| **Database** | `postgres` | `postgres` | **一致 (PASS)** |
| **Username** | `postgres.ypibmyfxfhsyfdwxprpi` | `postgres.ypibmyfxfhsyfdwxprpi` | **一致 (PASS)** |
| **連線模式** | Connection URL (Prisma Rust Engine) | `pg.Pool` (JavaScript Node-Postgres) | 差異但架構符合 |
| **密碼編碼** | `encodeURIComponent(password)` | 原生傳遞 `password: password` | **分析見下文** |
| **TLS 憑證 (CA)** | `sslcert=.../supabase-root.crt` | `ssl: { ca: caCert, ... }` | **一致 (PASS)** |
| **TLS 嚴格驗證** | `sslaccept=strict` | `rejectUnauthorized: true` | **一致 (PASS)** |
| **連線逾時** | `connect_timeout=15` | `connectionTimeoutMillis: 15000` | **一致 (PASS)** |

### 關鍵分析：為何錯誤訊息曾回傳 `password authentication failed for user "postgres"`？
1. **Username 傳入核對**：
   - 經檢查 `verify_cloud_post_migration.cjs` 第 63 行，明確寫入 `user: 'postgres.ypibmyfxfhsyfdwxprpi'`，絕非單純傳入 `'postgres'`。
2. **PostgreSQL 與 PgBouncer 認證協議**：
   - 連線 Session Pooler（PgBouncer）時，PgBouncer 以使用者名稱中的 `.ypibmyfxfhsyfdwxprpi` 作為專案路由識別標記，在內部與後端實體資料庫連線時，實體 PostgreSQL 使用者身份即為 `"postgres"`。
   - 當認證失敗時，PostgreSQL 內部核心產生的標準 SASL SCRAM-SHA-256 錯誤回傳字串即為 `password authentication failed for user "postgres"`。
   - 此訊息**不能推論為腳本傳入錯誤的使用者名稱**，而是印證了**連線已成功路由抵達 Supabase 內部實體 PostgreSQL，但密碼比對失敗**。
3. **密碼字元處理**：
   - `pg.Pool` 內部會直接將原始字串透過 PostgreSQL Startup Message / SASL 流程傳遞，不需要、亦**不能**進行 URL Encoding（若進行 `encodeURIComponent` 反而會將特殊符號如 `#`, `@`, `%` 轉成 `%23`, `%40` 導致密碼錯誤）。
   - `verify_cloud_post_migration.cjs` 直接傳入 `password: password` 是 Node-pg 套件的**完全正確作法**。

---

## 三、密碼輸入流程安全檢查 (RawMode & Stdin)

檢查 `verify_cloud_post_migration.cjs` 與 `run_cloud_migrate_status.cjs` 之密碼輸入函式 `getMaskedPassword()`：

1. **終端字元接收與 Enter 鍵處理**：
   ```javascript
   if (s === '\n' || s === '\r' || s === '\u0004') {
       process.stdin.removeListener('data', onData);
       process.stdin.setRawMode?.(false);
       process.stdin.pause();
       process.stdout.write('\n');
       resolve(pwd.trim());
   }
   ```
   - **優點**：正確攔截 Enter (`\n`, `\r`) 與 EOF (`\u0004`)，並在完成後立即調用 `setRawMode(false)` 還原終端模式。
   - **修剪行為**：`pwd.trim()` 僅會移除使用者輸入結尾的換行或誤按的頭尾空白字元。
2. **退格鍵 (Backspace)**：
   - 正確處理 `\b` 與 ASCII 127 (`\x7f`)，並以 `\b \b` 擦除螢幕星號遮罩，記憶體切片 `pwd.slice(0, -1)` 正確。
3. **密碼防洩漏保證**：
   - 螢幕只輸出 `*` 遮罩。
   - 零 `console.log(password)`，零檔案落盤，零參數傳遞。
   - 連線完成後，在 `close` / `finally` 即刻將變數重設為空並自環境中刪除。

---

## 四、Node.js DEP0190 警告分析與修正建議

先前在執行 Migration Deploy 時，Node.js 曾輸出：
`(node:xxxxx) [DEP0190] DeprecationWarning: Passing args to child_process.spawn with shell: true is deprecated.`

### 1. 根本原因
- 在 `run_cloud_migrate_deploy.cjs` 與 `run_cloud_migrate_status.cjs` 中：
  ```javascript
  const child = spawn(prismaCmd, ['migrate', 'deploy'], {
      cwd: backendDir,
      env,
      shell: true, // <-- 此處造成 DEP0190
      stdio: 'inherit'
  });
  ```
- Node.js 官方在 Node 20+ / 22+ 中標記 `DEP0190`：當 `shell: true` 時，傳遞第二參數 `args` 陣列會在底層被重新字串拼接，若引數含惡意字符可能引發 Shell Injection。因此 Node 建議改為由 shell 解析整段指令，或在 Windows 下執行 `.cmd` 時指定 `shell: false`（但需直接調用 cmd.exe）或保留空 args。

### 2. 本專案安全性評估
- 本專案傳入之 args 為靜態常數字串 `['migrate', 'status']` 或 `['migrate', 'deploy']`，完全無外部或使用者可控字符，**絕無 Command Injection 風險**。
- 此警告僅為 Node.js 引擎提示，不影響 Migration 或驗收的執行正確性與退出碼。
- **後續優化建議**：未來可將調用改為 `spawn('cmd.exe', ['/c', prismaCmd, 'migrate', 'status'], { shell: false })`，即可乾淨消除 DEP0190 警告。

---

## 五、專案與 Git 完整性檢核

| 項目 | 預期基準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Git 工作區** | 保留未暫存變更，無非預期 staged | 一致 | **PASS** |
| **Prisma Schema** | 未修改 | 未修改 | **PASS** |
| **Migration SQL** | 未修改 | 未修改 | **PASS** |
| **檔案變更狀態** | 零檔案修改 (純靜態審查) | 腳本 SHA-256 均一致 | **PASS** |
| **資料庫連線** | 100% 離線，零連線嘗試 | 零連線 | **PASS** |

---

## 六、最終判定與下一步安全建議：`GO`

### 1. 最終判定：`GO`
現有所有 6 個腳本在**端點配置、帳號格式、密碼輸入遮罩、TLS Strict Root CA 驗證**方面均完全正確且高度安全，無任何程式碼邏輯缺陷。

### 2. 下一步安全執行建議 (Next Step)
由於使用者已在 Supabase Dashboard 完成密碼重設，先前因憑證疑慮而暫緩的「**Prisma CLI 唯讀狀態檢查 (`npx prisma migrate status`)**」已具備安全重啟條件：
- 建議使用既有經安全審查之 `run_cloud_migrate_status.ps1`。
- 輸入 Supabase 重設後的新密碼，透過 Session Pooler 5432 驗證雲端 Migration 是否處於 `Database schema is up to date!`。
