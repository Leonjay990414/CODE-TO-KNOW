# CODE TO KNOW｜Phase 3-C-33：備份、CA 憑證與 Supavisor TLS 準備與實機驗證規格

- **文件階段**：Phase 3-C-33（純規格文件；**本階段未執行備份、未解密、未還原、未讀取金鑰、未連線 Supabase**）
- **建立日期**：2026-11-12

---

## 一、正式切換前備份準備規格（Section 六）

### 1. 既有最新備份基準（2026-11-10）
- 目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`
  - `code_to_know_supabase_prod.dump`（505,249 bytes）：SHA-256 `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`（505,282 bytes）：SHA-256 `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

### 2. 切換前強制備份與解密演練規格（未來獲授權後執行）
1. **重新取得切換當下最新正式備份**：透過已驗證之專案備份管線（`scripts/database/run_supabase_backup.ps1`）產出當日時間戳目錄下之明文 `.dump` 與 AES-256-GCM 加密 `.c2kb`。
2. **雙重 SHA-256 紀錄**：記錄新 `.dump` 與 `.c2kb` 之 SHA-256，並寫入對應 `.sha256` 校驗檔。
3. **KeePassXC 金鑰解密驗證**：使用保存於使用者 KeePassXC 離線資料庫之加密金鑰執行受控解密測試，確認 AES-256-GCM AuthTag 通過，且**解密後檔案 SHA-256 與原始 `.dump` 100% 一致**（驗證後立即清除暫存解密檔）。
4. **獨立 PG17 Sandbox 還原驗證**：以 `scripts/database/restore_pg17_sandbox.ps1` 還原至獨立 PG17 Sandbox，核對 37 張表、`COUNT(*)` 與物件定義完整無誤。
5. **雙份離線保留與金鑰隔離**：加密備份（`.c2kb`）與 `.sha256` 同步保留本機外部備份目錄及外接 USB 備份；KeePassXC 金鑰僅離線保管，嚴禁寫入 Repo、`.env`、終端紀錄或對話內容。

---

## 二、CA 憑證核對與指紋差異說明

### 1. 本機 `prod-supabase-ca.crt` 雙重雜湊核對（唯讀）
針對倉庫內 [`backend/certs/prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)：
- **PEM 檔案本身的 SHA-256（`Get-FileHash`）**：
  `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`
- **DER 解碼後 X.509 憑證指紋（`crypto.X509Certificate.fingerprint256`）**：
  `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`
- **憑證主體中繼資料**：`Subject = Issuer = CN=Supabase Root 2021 CA, O=Supabase Inc, C=US`（效期 `2021-04-28` ～ `2031-04-26`）。

### 2. 先前 C31 / C32 記錄差異與官方來源說明
- **為何出現不同格式之雜湊／指紋**：X.509 `fingerprint256`（`80:70:25:AD:...`）係對憑證 **ASN.1 DER 二進位內容**計算之 SHA-256；而檔案系統 `Get-FileHash`（`70072358...`）係對 **Base64 PEM 文字檔（含 `BEGIN/END CERTIFICATE` 與換行字元）**計算之 SHA-256，兩者演算法目標不同，皆屬同一張憑證之正確數值，但比對時不可混用。
- **官方來源核對**：Supabase 官方文件明確指出，官方 Root CA 檔案 `prod-ca-2021.crt` 僅應從 **Supabase Dashboard → Project Settings → Database → SSL Configuration → Download Certificate** 取得。
- **嚴格區分**：檢查本機 `.crt` 檔案中繼資料**絕不等同於**官方來源認證或遠端 TLS 握手通過；正式驗證前須由使用者從 Dashboard 下載 `prod-ca-2021.crt` 並與倉庫檔案進行 Byte-for-byte / File SHA-256 比對。

---

## 三、Supavisor 實機驗證計畫（Section 七）

### 證據分層定義
- **A. 本機 PG17 已測試**：Node.js `pg.Pool` + `rejectUnauthorized: true` + `checkServerIdentity` 離線單元測試（[`database-ssl-config.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/database-ssl-config.test.ts)）；`c2k_test_app_runtime` 登入與 `AuditLog` `42501` 實測（[`app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts)）。
- **B. Supabase 官方文件可確認**：Session Pooler Host/Port（`aws-0-ap-southeast-2.pooler.supabase.com:5432`）、自訂角色格式 `[ROLE_NAME].[PROJECT_REF]`、須以 SQL `CREATE ROLE ... WITH LOGIN` 建立、`sslmode=verify-full` 驗證 CA 與主機名、`prod-ca-2021.crt` 下載路徑。
- **C. 必須連線 Supabase 才能驗證（目前全數 `NOT TESTED`）**：

| 驗證編號 | 驗證項目 | 類別 | 通過準則與資源清理／遮蔽要求 |
|---|---|---|---|
| **V-01** | 官方 `prod-ca-2021.crt` 下載比對 | **C** | Dashboard 下載檔與 `backend/certs/prod-supabase-ca.crt` 檔案 SHA-256 一致。 |
| **V-02** | `app_runtime.ypibmyfxfhsyfdwxprpi` 正確密碼登入（Port `5432`, `sslmode=verify-full`） | **C** | SCRAM-SHA-256 認證成功、`SELECT current_user` 為 `app_runtime`、Node `rejectUnauthorized: true` 握手通過；**測試結束立即 `pool.end()` 釋放連線**。 |
| **V-03** | `migration_admin.ypibmyfxfhsyfdwxprpi` 正確密碼登入（Port `5432`, `sslmode=verify-full`） | **C** | SCRAM-SHA-256 認證成功、`SELECT current_user` 為 `migration_admin`、TLS 握手通過；結束立即釋放連線。 |
| **V-04** | 故意錯誤密碼測試（`app_runtime` 與 `migration_admin`） | **C** | 精確遭拒（`28P01`），且**錯誤日誌經 `redaction.ts` / `db-validation.ts` 處理後不含密碼與連線字串**，用畢立即清理測試連線。 |
| **V-05** | `app_runtime` 權限邊界實測（含負向 `AuditLog` / `_prisma_migrations` / DDL） | **C** | 業務表可讀、`AuditLog` `UPDATE`/`DELETE` 與 `_prisma_migrations` `SELECT` 與 `CREATE TABLE` 皆回傳 `42501`。 |
| **V-06** | 密碼傳遞安全檢查 | **C** | 測試全程使用 `PGPASSFILE` 或暫時性進程變數，**0 密碼進入終端歷史、Log 或文件**。 |
