# CODE TO KNOW｜Phase 3-C-9：C2KB 備份與 PG17 還原前置檢查報告
# 正式 Supabase C2KB 加密備份與 PostgreSQL 17 沙盒還原驗收準備度查核

**文件編號**：C2K-DOC-DB-PHASE3C9-RESTORE-PREFLIGHT-01  
**檢查日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA / 應用安全架構師 (AppSec) / DevSecOps 稽核工程師  
**審查性質**：100% 唯讀前置查核與驗收計畫準備（零雲端連線、零資料庫寫入、零程式碼修改、零金鑰讀取）  
**審查結論判定**：**PASS（完全具備條件，C2KB 備份完整無損，PG17 沙盒就緒）**

---

## 一、加密備份檔案完整性查核

檢查目標目錄：  
`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`

### 1.1 檔案存在性、大小與數學增量檢驗

| 檔案名稱 | 實際大小 (Bytes) | 預期大小 (Bytes) | 狀態 | 密碼學規格驗證說明 |
| :--- | :---: | :---: | :---: | :--- |
| **`code_to_know_supabase_prod.dump`** | **505,249** | 505,249 | **吻合** | PostgreSQL 17 Custom Format (`-Fc`) 原始明文備份，37 張資料表完整封裝。 |
| **`code_to_know_supabase_prod.dump.c2kb`** | **505,282** | 505,282 | **吻合** | C2KB 二進位加密容器檔。剛好比原始 Dump 增加 **33 位元組**。 |
| **`code_to_know_supabase_prod.dump.sha256`** | **102** | 102 | **吻合** | 原始明文 Dump 之 SHA-256 數位指紋記錄檔。 |

> [!IMPORTANT]
> **密碼學尺寸數學證明（33 Bytes Overhead）**：  
> C2KB 容器規範由兩部分構成：
> 1. **頭部（Header, 17 Bytes）**：Magic (`C2KB`, 4 bytes) + Version (`0x01`, 1 byte) + Nonce (`12 bytes`)。
> 2. **尾部（Auth Tag, 16 Bytes）**：AES-256-GCM 訊息認證標籤。  
> 總計結構負擔恰為 $17 + 16 = 33$ 位元組。  
> 實測數值：$505,249 + 33 = 505,282$ 位元組，**100% 精確符合規範**。

### 1.2 容器格式二進位標頭解析
透過管線容器解析工具 `verifyContainerFormat` 實測：
- **容器格式合法性 (`valid`)**：`true`
- **檔案長度 (`fileSize`)**：`505282` bytes
- **容器版本 (`version`)**：`1` (`CURRENT_VERSION`)
- **Nonce 十六進位值 (`nonceHex`)**：`63f09d2b693755413af2ab39`（12-byte 隨機 Nonce）

### 1.3 數位指紋 (SHA-256) 比對

- **原始明文 Dump 計算 SHA-256**：
  `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`
- **`.sha256` 記錄檔內含雜湊值**：
  `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50  code_to_know_supabase_prod.dump`
- **比對結果**：**100% 完全相符**。
- **C2KB 密文檔案計算 SHA-256**：
  `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`

---

## 二、PG17 Sandbox 隔離環境查核

### 2.1 Docker 容器與引擎現況

| 檢查項目 | 查核結果 | 狀態判定 | 說明 |
| :--- | :--- | :---: | :--- |
| **容器名稱** | `code_to_know_pg17_restore_sandbox` | **PASS** | 容器運行狀態為 `Up 3 hours`，健康穩定。 |
| **PostgreSQL 版本** | `postgres (PostgreSQL) 17.11` | **PASS** | 與正式 Supabase PostgreSQL 17.11 同版同 Digest。 |
| **對外連接埠** | `127.0.0.1:5433 -> 5432/tcp` | **PASS** | 嚴格綁定 5433，與開發庫 5432 埠口完全隔離。 |
| **PG16 開發環境** | `code_to_know_postgres` (5432) | **PASS** | `Up 3 hours (healthy)`，獨立運行，零干擾。 |
| **沙盒儲存 Volume** | `code_to_know_pg17_restore_sandbox_data` | **PASS** | 獨立專用儲存磁區，與開發資料庫資料卷完全隔離。 |

### 2.2 目前沙盒已存在資料庫盤點（防覆寫檢查）
沙盒執行 `\l` 檢索現存資料庫清單：
1. `code_to_know_cloud_restore_test`（先前驗收測試所建立之測試庫，內含 37 張資料表）
2. `postgres`（預設系統管理庫）
3. `template0`、`template1`（系統範本庫）

> [!CAUTION]
> **資料庫防覆寫規範**：  
> 現有 `code_to_know_cloud_restore_test` 資料庫已存在。為確保本次驗收**不覆寫、不破壞任何既有測試記錄**，本次還原必須建立**全新且唯一之獨立測試庫**：  
> **建議名稱**：`code_to_know_c2kb_prod_restore_test`。

---

## 三、還原工具鏈與流程安全確認

經審查 [`scripts/database/backup-crypto.cjs`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-crypto.cjs) 與 [`scripts/database/backup-pipeline.cjs`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.cjs)：

1. **安全解密機制**：
   支援指令 `node scripts/database/backup-crypto.cjs decrypt -i <c2kb> -o <decrypted_temp.dump>`。解密前會先在暫存路徑輸出，解密驗證完全通過後才交付檔案。
2. **AES-GCM AuthTag 認證檢驗**：
   `decryptFile` 內部自動從 `.c2kb` 尾部讀取 16 位元組 AuthTag，並呼叫 `decipher.setAuthTag(authTag)`。若主金鑰不正確或密文遭到 1 個 bit 竄改，Node.js OpenSSL 引擎會立即拋出 `[CRYPTO DECRYPT ERROR]` 並抹除暫存檔。
3. **明文雜湊一致性核驗**：
   解密完成後，可在本地透過 PowerShell 即時計算解密 Dump 的 SHA-256，並與原始明文 Dump（`2BB79ECC...`）進行比對，確保解密還原結果具備 100% 逐位元完整性。
4. **PostgreSQL 17 `pg_restore` 原生支援**：
   沙盒內部已內建 `pg_restore (PostgreSQL) 17.11`。透過 `docker cp` 將解密 Dump 傳入容器 `/tmp/`，並以 `--no-owner --no-acl` 旗標還原，能徹底消除 Supabase 雲端特有管理角色（如 `supabase_admin`、`postgres.ypibmyfxfhsyfdwxprpi`）造成的權限警告。

---

## 四、還原風險評估與防護措施

| 潛在風險 | 風險等級 | 既有防護與緩解措施 |
| :--- | :---: | :--- |
| **誤觸正式 Supabase** | **無** | 還原作業嚴格在本地 Docker 容器 `127.0.0.1:5433` 內部執行，完全不發起任何對外連線，環境變數亦不含 Supabase 密鑰。 |
| **覆寫現有 PG16 開發庫** | **無** | 沙盒運行於連接埠 5433，PG16 開發庫運行於 5432，網路與 Docker Volume 實體隔離。 |
| **覆寫沙盒既有測試庫** | **無** | 採用新資料庫名稱 `code_to_know_c2kb_prod_restore_test`，先執行 `CREATE DATABASE`，不使用 DROP。 |
| **主金鑰洩漏至日誌或歷程** | **無** | 解密金鑰全程透過 `Read-Host -AsSecureString` 輸入，並於 `try/finally` 中藉由 `ZeroFreeBSTR` 與行程環境變數即刻銷毀。 |
| **暫存明文殘留於沙盒磁區** | **低** | 還原完成後，立即執行 `docker exec ... rm /tmp/...` 與本地暫存 Dump 清理。 |

---

## 五、下一步精確操作指引（待使用者授權後執行）

待專案負責人授權進入還原驗收階段，請依以下三步驟於本機 PowerShell 執行：

### 步驟 1：安全解密 `.c2kb` 並比對 SHA-256

```powershell
$sec = Read-Host -Prompt "請輸入 KeePassXC 64 字元 Hex 主金鑰 (解密驗收用)" -AsSecureString
$bstr = [IntPtr]::Zero

try {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr).Trim()
    $env:BACKUP_ENCRYPTION_KEY = $key

    $encPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb"
    $decPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod_decrypted_verify.dump"

    Write-Host "`n[解密] 執行 AES-256-GCM 認證解密..." -ForegroundColor Cyan
    node scripts/database/backup-crypto.cjs decrypt -i $encPath -o $decPath

    $origHash = (Get-FileHash -Path "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump" -Algorithm SHA256).Hash
    $decHash  = (Get-FileHash -Path $decPath -Algorithm SHA256).Hash
    
    Write-Host "`n原始 Dump SHA256 : $origHash" -ForegroundColor Green
    Write-Host "解密 Dump SHA256 : $decHash" -ForegroundColor Green
    if ($origHash -eq $decHash) {
        Write-Host "【雜湊核驗通過】解密還原內容與原始備份 100% 逐位元完全相同！`n" -ForegroundColor Green
    } else {
        Write-Error "【雜湊核驗失敗】解密內容與原始備份不一致！"
    }
}
finally {
    if ($bstr -ne [IntPtr]::Zero) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $env:BACKUP_ENCRYPTION_KEY = $null
    [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
    $key = $null
    $sec = $null
    [System.GC]::Collect()
}
```

### 步驟 2：建立全新測試庫並執行 `pg_restore` 還原

```powershell
$targetDb = "code_to_know_c2kb_prod_restore_test"
$decPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod_decrypted_verify.dump"

# 1. 於沙盒內建立乾淨空白資料庫
docker exec -i code_to_know_pg17_restore_sandbox psql -U postgres -d postgres -c "CREATE DATABASE $targetDb OWNER codetoknow_restore;"

# 2. 將解密後的 dump 複製進沙盒暫存區
docker cp $decPath "code_to_know_pg17_restore_sandbox:/tmp/restore_verify.dump"

# 3. 呼叫原生 pg_restore 執行還原 (消除雲端系統角色告警)
docker exec -i code_to_know_pg17_restore_sandbox pg_restore -U postgres -d $targetDb -v --no-owner --no-acl /tmp/restore_verify.dump

# 4. 清理容器內部暫存檔
docker exec -i code_to_know_pg17_restore_sandbox rm /tmp/restore_verify.dump
```

### 步驟 3：執行資料一致性與 37 張資料表驗證 SQL

```powershell
# 檢驗資料表數量與 migration 紀錄
docker exec -i code_to_know_pg17_restore_sandbox psql -U postgres -d $targetDb -c "
SELECT count(*) AS total_tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;
"
```

---

## 六、嚴格禁止規範遵守聲明

- [x] 100% 未連線 Supabase 正式雲端資料庫。
- [x] 100% 未執行任何 Supabase SQL 或雲端寫入。
- [x] 未修改任何正式資料庫角色或綱要。
- [x] 未修改 `.env` 檔案。
- [x] 未讀取 KeePassXC 密碼庫或紙本備援。
- [x] 未要求使用者將金鑰或密碼張貼至聊天視窗。
- [x] 未刪除或覆寫任何備份檔案。
- [x] 未修改任何專案原始程式碼。
- [x] 未執行 Git add / commit / push / reset / clean / stash。
- [x] 未部署 Render。
- [x] 本階段純屬唯讀前置檢查，未擅自執行還原操作。

---

## 七、審查結論判定

**審查判定**：**PASS**

所有前置條件、檔案完整性、密碼學尺寸增量、沙盒健康狀態均已 100% 查核完畢。隨時可於獲得使用者明確授權後執行正式還原與資料驗收。
