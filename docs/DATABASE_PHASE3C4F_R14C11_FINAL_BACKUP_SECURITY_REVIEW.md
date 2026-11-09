# CODE TO KNOW｜PHASE 3C-4F-R14-C-1-1
# 正式備份工具、TLS 安全與暫存檔生命週期最終安全複核

**文件編號**：`DATABASE_PHASE3C4F_R14C11_FINAL_BACKUP_SECURITY_REVIEW`  
**審查日期**：2026-11-09  
**審查性質**：第二輪獨立唯讀安全複核（不連線正式庫、不執行正式備份）  
**對應階段**：PHASE 3C-4F-R14-C-1-1 (W-01, W-02)  
**參照檔案**：  
- `scripts/database/run_supabase_backup.ps1`  
- `scripts/database/backup-crypto.cjs`

---

## 一、備份腳本參數與端點安全複核 (W-01)

### 1.1 Docker 映像檔 Digest 完整性與固定性驗證
- **【已由原始碼與本機測試證實】** 檢查 `run_supabase_backup.ps1:31`：
  ```powershell
  $pinnedDockerImage = "postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac"
  ```
- **檢查結果**：
  1. 使用完整 64 位元之 SHA-256 雜湊字串，**絕非截斷字串**。
  2. 經 Docker 指令核對，本地 `code_to_know_pg17_restore_sandbox` 使用之映像檔 RepoDigest 100% 完全相符。
  3. 保證每次備份執行的 Client Tools 版本皆嚴格固定為 PostgreSQL 17.11，不受 Docker Hub `latest` 標籤動態浮動或供應鏈投毒影響。

---

### 1.2 Session Pooler 端點與 TLS `verify-full` 生效性
- **端點設定**：`aws-0-ap-southeast-2.pooler.supabase.com:5432`，使用者 `postgres.ypibmyfxfhsyfdwxprpi`，資料庫 `postgres`。
- **TLS 驗證生效機制**：
  - 在容器執行引數中注入環境變數：
    `-e PGSSLMODE=verify-full -e PGSSLROOTCERT=/certs/supabase-root.crt`
  - 憑證檔案以唯讀模式 (`-v "${caDir}:/certs:ro"`) 掛載至容器。
  - **技術原理**：PostgreSQL 官方 `pg_dump` 原廠使用 `libpq` 函式庫，`PGSSLMODE=verify-full` 會強制執行：
    1. 驗證伺服器憑證鏈是否由指定之 Root CA（`supabase-root.crt`）簽發。
    2. 驗證伺服器憑證之主體別名（SAN）是否包含 `*.pooler.supabase.com`。
  - **憑證指紋一致性**：本機檔案 SHA-256 核對為 `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`，完全相符。

---

### 1.3 密碼傳遞防洩漏架構（多層級審查）
- **Process Arguments**：`docker run` 參數中無密碼資訊，使用 `ps`、工作管理員或 Process Explorer 無法讀取密碼。
- **PowerShell Transcript / Command History**：使用 `Read-Host -AsSecureString`，終端機輸入過程全程遮罩，不寫入 `ConsoleHost_history.txt`。
- **標準輸入串流 (Process Stdin Pipe)**：密碼由記憶體透過管道寫入容器 shell，以 Linux LF 結尾，不經由磁碟暫存。
- **Docker 診斷輸出與日誌**：若發生連線錯誤，`pg_dump` 僅輸出 `FATAL: password authentication failed for user "..."`，原廠程式絕不會將密碼印在 STDERR 中。
- **失敗清理可靠性**：腳本在失敗時同時檢查 Exit Code、檔案存在與大小，若異常則即刻呼叫 `Remove-Item` 清除殘餘檔案。

---

## 二、AES-256-GCM 加密工具與暫存檔生命週期複核 (W-02)

### 2.1 密碼學參數與串流認證
- **Nonce 安全性**：每次呼叫 `encryptFile` 時，皆透過 `crypto.randomBytes(12)` 產生全新的 96-bit 隨機 Nonce，絕不重用（Nonce-Reuse Free）。
- **Authentication Tag 驗證**：16-byte 認證標籤置於二進位容器尾端。解密時在 `pipeline` 串流管線完成時驗證。若檔案遭竄改 1 bit，`decipher` 即刻拋錯並中斷。
- **交付先驗性**：解密過程全程寫入帶有隨機後綴的暫存檔（`.tmp`），當且僅當 Auth Tag 驗證完全通過後，才執行原子重新命名，**保證絕不向使用者交付損毀或未經認證的明文檔案**。

---

### 2.2 原子更名與跨檔案系統限制
- **原子更名**：使用 `fs.renameSync(tempOutput, resolvedOutput)`。
- **跨磁碟限制審查**：
  - 在作業系統層級，跨磁碟分割區（如 C 槽至 D 槽）執行原子更名會觸發 `EXDEV: cross-device link not permitted` 錯誤。
  - **原始碼審查結果**：`backup-crypto.cjs:76, 189` 中，`tempOutput` 係以 `${resolvedOutput}.tmp...` 建立，即**暫存檔與正式輸出檔永遠位於同一個父目錄下（同磁碟、同檔案系統）**，徹底排除了 `EXDEV` 例外風險。

---

### 2.3 記憶體與磁碟殘留之嚴謹風險定性（物理安全邊界）

> [!IMPORTANT]
> **密碼學與系統層物理殘留之精準定義**：
> 1. **記憶體清理之技術極限**：
>    在 Node.js (V8) 與 PowerShell 環境中，將字串或 Buffer 賦予 `$null` 並觸發垃圾回收（`GC`），**僅能降低進程生命週期中的記憶體洩漏風險，無法保證實體 RAM 內容絕對不可復原**。V8 引擎內部之字串保留池、JIT 編譯最佳化副本、或作業系統的分頁檔（Pagefile / Swap），仍可能殘留未抹除之記憶體快照。若面臨具備實體存取權限的記憶體取證攻擊，需依賴作業系統全盤分頁加密（BitLocker）。
> 2. **檔案刪除之技術極限**：
>    腳本中調用之 `Remove-Item` 或 Node.js `fs.unlinkSync`，**僅為檔案系統層級的目錄項取消連結（Unlink），絕不等於儲存媒體上的安全抹除**。在現代 SSD（固態硬碟）上，由於磨損均衡（Wear Leveling）與 FTL（快閃記憶體轉換層）機制，被取消連結的區塊仍會殘存於實體 NAND Flash 晶片中，直到被垃圾回收（GC / TRIM）覆寫。因此，生產環境若要求極致機密銷毀，必須搭配全磁碟加密（BitLocker / LUKS）或加密容器銷毀。

---

## 三、檢核結論標記

| 複核項目 | 判定結果 | 驗證層級標記 |
| :--- | :--- | :--- |
| **Docker Digest 固定性** | 完整 64 位元 SHA-256，未截斷 | 【已由本機測試證實】 |
| **Session Pooler 與 TLS 驗證** | `verify-full` 與 Root CA 強制校驗 | 【已由原始碼確認】 |
| **密碼傳遞全程遮蔽** | Stdin 串流注入，CLI 與 Log 無洩漏 | 【已由原始碼確認】 |
| **AES-256-GCM Nonce 隨機性** | 每次調用獨立產生 12-byte CSPRNG Nonce | 【已由本機測試證實】 |
| **原子更名跨磁碟防護** | 同目錄建立暫存檔，無 EXDEV 風險 | 【已由原始碼確認】 |
| **實體記憶體與磁碟殘留** | 精準定義為檔案系統取消連結與進程隔離，不誇大保證 | 【僅有文件依據】 |
