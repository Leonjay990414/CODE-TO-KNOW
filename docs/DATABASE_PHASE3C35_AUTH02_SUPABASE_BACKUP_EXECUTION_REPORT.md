# CODE TO KNOW｜Phase 3-C-35 AUTH-02：Supabase 正式加密備份執行報告

- **執行日期**：2026-11-12
- **階段定位**：`AUTH-02`（最新 Supabase 正式加密備份取得）
- **最終判定**：**`PARTIAL PASS`（前置與 `-DryRun` 全數通過；正式連線匯出因須由使用者於本機互動輸入密碼與 KeePassXC 主金鑰，依安全規範停於執行前等待使用者本機執行）**
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`（無程式碼、`.env`、Docker 或既有備份異動）

---

## 1. 使用者授權範圍

- **已授權**：透過既有 [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1)（`-Encrypt`）與 [`scripts/database/backup-crypto.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-crypto.cjs) 連線 Supabase Session Pooler 進行唯讀 `pg_dump` 並產出 `.dump` / `.c2kb` / `.sha256`。
- **嚴格禁止**：任何資料庫寫入、`AUTH-03` 解密或 PG17 還原、PG16/PG17/Render 操作、輸出密碼或金鑰、覆蓋 2026-11-10 舊備份。

---

## 2. 執行前環境基線

| 檢查項目 | 實測結果 | 判定 |
|---|---|---|
| **Docker Desktop** | 運行中（Server Version `29.9.2`） | **PASS** |
| **固定 Digest Client Tools** | `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`（`pg_dump (PostgreSQL) 17.11`） | **PASS** |
| **磁碟剩餘空間（`C:`）** | `662,180,130,816` bytes（約 `616.7 GiB` 可用） | **PASS** |
| **`run_supabase_backup.ps1 -DryRun`** | Exit Code `0`；確認端點 `aws-0-ap-southeast-2.pooler.supabase.com:5432`、`PGSSLMODE=verify-full` 與時間戳防覆寫目錄 | **PASS** |

---

## 3. TLS CA 憑證驗證結果

- **本機秘密目錄憑證**（`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`）與倉庫憑證（[`backend/certs/prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt)）：
  - **PEM 檔案 SHA-256（`Get-FileHash`）**：`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`（腳本內建預期雜湊比對通過）。
  - **DER X.509 指紋（`fingerprint256`）**：`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`（`CN=Supabase Root 2021 CA`）。
- **來源核對聲明**：尚未於本階段登入 Supabase Dashboard 下載官方 `prod-ca-2021.crt` 進行現場對比，故**不宣稱已完成遠端官方憑證比對與 TLS 握手驗證**。

---

## 4. Supabase Pooler 連線驗證結果

- **狀態**：**`NOT EXECUTED`（停於互動式安全輸入邊界）**。
- **原因**：`run_supabase_backup.ps1`（L110, L279）設計採本機終端機互動式遮罩輸入（`Read-Host -AsSecureString`）接收 Supabase `postgres.ypibmyfxfhsyfdwxprpi` 密碼與 KeePassXC AES-256-GCM 主金鑰；AI 代理不得讀取 KeePassXC／`.env` 機密，亦無法代為於無互動終端注入安全密碼。

---

## 5. 備份開始與完成時間

- **本階段未執行正式連線匯出**：`-DryRun` 檢查於 `2026-11-12 20:45:38 (UTC+8)` 完成，實際連線備份待使用者於本機終端執行後紀錄。

---

## 6. 備份檔案名稱、大小及 SHA-256

- **本階段未產出新備份**：因未執行連線匯出，目前尚無新 `.dump`、`.c2kb` 與 `.sha256` 檔案。

---

## 7. 加密結果與 8. 明文暫存檔處理結果

- **腳本機制確認**（[`run_supabase_backup.ps1:259-384`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1#L259-L384)）：指定 `-Encrypt` 且不加 `-KeepPlaintext` 時，`backup-pipeline.cjs` 會在完成 C2KB AES-256-GCM 串流加密與解密迴環驗證（Exit Code `0`）後自動清理暫存明文 `.dump`，並僅在加密驗證成功時才移除明文。
- **實際執行結果**：尚未執行。

---

## 9. 舊備份完整性檢查

- `2026-11-10` 既有正式備份（`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`）**完全未動**：
  - `code_to_know_supabase_prod.dump`（`505,249` bytes）：SHA-256 `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
  - `code_to_know_supabase_prod.dump.c2kb`（`505,282` bytes）：SHA-256 `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 10. 失敗、警告及未驗證事項

- **停頓原因（非程式錯誤）**：正式資料庫密碼與 KeePassXC 256-bit 主金鑰僅能由使用者於本機終端機安全輸入，無法由非互動式代理代勞。
- **未驗證事項**：Supabase Dashboard `prod-ca-2021.crt` 來源比對、實際 `pg_dump` 匯出、新 `.dump`/`.c2kb` SHA-256 產出。

---

## 11. Git、資料庫及其他環境影響檢查

- **Supabase / PG16 / PG17 / Render**：**0 接觸、0 寫入、0 異動**。
- **Git / 程式碼 / `.env` / 舊備份**：**0 修改**（僅新增本報告檔案）。

---

## 12. AUTH-02 最終判定與使用者本機執行指令

- **最終判定**：**`PARTIAL PASS`（本機前置與 `-DryRun` 通過；實際雲端匯出待使用者於本機互動執行）**
- **請使用者於本機 PowerShell 執行**（需依提示輸入 Supabase 密碼與 KeePassXC 64-char Hex 金鑰，全程遮罩）：
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/database/run_supabase_backup.ps1 -Encrypt
  ```
- 執行完成後，請提供新產出的時間戳目錄路徑與 `backup_info.json`（不含任何密碼或金鑰），再由後續階段核對並決定是否授權 `AUTH-03`。
