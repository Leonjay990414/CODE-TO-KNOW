# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R2-FIX1：第一次 Supabase 雲端備份失敗根本原因診斷報告

**文檔版本**：1.0 (深度診斷與根因鎖定)  
**診斷日期**：2026-11-08 21:00 (UTC+8)  
**診斷角色**：資深 DevSecOps 工程師、PostgreSQL DBA、Windows/PowerShell 核心架構師  
**目標專案**：`code-to-know-prod` (ypibmyfxfhsyfdwxprpi)  
**執行腳本**：`scripts/database/run_supabase_backup.ps1` (SHA-256: `a833eb8a...`)  
**診斷準則**：100% 離線靜態審查與本地進程模型驗證，零 Supabase 連線、零密碼讀取、保留現場。

---

## 一、故障現場盤點與跡證 (Forensic Evidence)

### 1. 本地備份目錄狀態
經唯讀檢查實體目錄：
- **路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_205853`
- **目錄存在性**：**存在 (True)**
- **目錄內部檔案數**：**0 個檔案 (空目錄)**
- **Dump 檔案與校驗檔**：完全未產出。
- **目錄清理邏輯未被觸發之關鍵線索**：
  在 `run_supabase_backup.ps1` 第 162~167 行中，若 `$backupExitCode -ne 0`，腳本會執行：
  ```powershell
  Write-Host "[警告] pg_dump 執行失敗 (Exit Code: $backupExitCode)，清理未完成之目錄..." -ForegroundColor Red
  Remove-Item $targetDirPath -Force -Recurse
  ```
  但使用者回報與現場均顯示：**此錯誤訊息未出現，目錄亦未被刪除**，而是直接通過了第 162 行的判定，進入了第 170 行：
  ```powershell
  if (-not (Test-Path $dumpFilePath)) {
      Write-Error "備份檔案未產出：$dumpFilePath"
      exit 1
  }
  ```
  **此重大跡證直接證明：`$process.ExitCode` 返回了 `0`！**

### 2. Docker 容器狀態
- 經由 `docker ps -a` 檢查，無任何掛起或殘留之 PostgreSQL 17 容器（證明 `--rm` 正常運作，容器已正常結束退出）。

---

## 二、根本原因深度分析 (Root Cause Analysis - RCA)

### 根本原因判定：`ROOT CAUSE CONFIRMED` (根因已完全確認)

這是一個極其隱蔽的 **Windows .NET `ProcessStartInfo.Arguments` 字串拼接解析缺陷**：

#### 1. 缺陷源碼位置 (`run_supabase_backup.ps1` 第 127~139 行)
在腳本中，定義了容器內部複合指令：
```powershell
$containerCmd = "read -r PGPASSWORD; export PGPASSWORD; exec pg_dump -h aws-0-ap-southeast-2.pooler.supabase.com -p 5432 -U postgres.ypibmyfxfhsyfdwxprpi -d postgres -Fc -v -f /backups/$dumpFileName"

$dockerArgs = @(
    "run", "-i", "--rm",
    "-e", "PGSSLMODE=verify-full",
    "-e", "PGSSLROOTCERT=/certs/$caFileName",
    "-v", "${caDir}:/certs:ro",
    "-v", "${targetDirPath}:/backups:rw",
    $pinnedDockerImage,
    "sh", "-c", $containerCmd
)

$psi.Arguments = [string]::Join(" ", $dockerArgs)
```

#### 2. .NET ProcessStartInfo 傳入 Windows 核心之實體字串剖析
當執行 `[string]::Join(" ", $dockerArgs)` 時，在 Windows 下產生的完整命令列字串為：
```text
run -i --rm -e PGSSLMODE=verify-full ... postgres@sha256:... sh -c read -r PGPASSWORD; export PGPASSWORD; exec pg_dump ...
```
**注意：`sh -c` 後方的 `$containerCmd` 失去了雙引號保護！**

#### 3. Linux 容器內部 `sh -c` 的直譯行為
在 Linux（POSIX Shell）中，`sh -c arg1 arg2 arg3...` 的行為規範是：
- `sh -c` **只會將其後的第一個單詞（Token）當作指令執行**，後續的所有單詞（`arg2 arg3...`）會被當作傳入該指令的參數（`$0, $1, $2...`）！
- 因此，容器內部實際執行的指令只有第一個單詞：
  `read`
- 由於 `$psi.RedirectStandardInput = $true`，PowerShell 透過管道寫入了密碼：
  `$process.StandardInput.WriteLine($plainPass)`
- 容器內的 `read` 指令成功讀取了這一行輸入，**然後 `read` 成功執行完畢，整部 shell 容器便以 Exit Code 0 順利結束！**
- **後續的 `export PGPASSWORD; exec pg_dump ...` 根本完全沒有被執行到！**

#### 4. 為何回傳「備份檔案未產出」且 ExitCode 為 0
1. 容器內部的 `read` 成功結束，因此 Docker 程序返回 Exit Code `0`。
2. 腳本檢查 `if ($backupExitCode -ne 0)` 判定為假（Pass），誤以為執行成功。
3. 腳本接續檢查 `if (-not (Test-Path $dumpFilePath))`，因為 `pg_dump` 根本沒跑，檔案當然不存在，最終觸發了 `備份檔案未產出` 報錯。
4. 另外，因 `$psi.RedirectStandardOutput = $false` 與 `$psi.RedirectStandardError = $false`，容器內部的 stderr/stdout 未被橋接至宿主機終端，導致除錯訊息完全消失。

---

## 三、安全風險評估 (Security Posture Review)

經由上述根因確認，針對憑證與系統安全進行客觀評估：

1. **密碼是否外洩？**
   - **否 (Zero Leakage)**：密碼由 PowerShell SecureString 轉純文字後，直接透過 StandardInput 管道寫入 Docker stdin，完全沒有進入命令列引數，沒有寫入任何檔案，亦未在終端機輸出。
2. **雲端連線是否曾發起？**
   - **否 (No Connection)**：因為 `pg_dump` 根本沒有被呼叫，容器只執行了 `read` 即退出，**完全未向 Supabase 發起任何網路請求**。
3. **雲端資料庫狀態**：
   - 100% 保持唯讀原狀，零寫入、零變更。
4. **本機備份目錄**：
   - 空目錄 `CODE_TO_KNOW_SUPABASE_20261108_205853` 留存，無任何損毀或殘缺 dump。

---

## 四、最小修復方案 (Minimal Fix Plan)

修復此問題僅需對 `scripts/database/run_supabase_backup.ps1` 進行結構性微調（無需變更任何架構設計）：

### 1. 為 `sh -c` 的參數補上 Windows 跳脫雙引號
將 `$containerCmd` 在組裝進 `$dockerArgs` 時以 `\"` 包裹，確保傳入 `docker` 時被識別為單一完整指令字串：
```powershell
$escapedContainerCmd = "`"$containerCmd`""
```
或直接在 `$psi.Arguments` 中確保包含包含引號：
```powershell
"sh", "-c", "`"$containerCmd`""
```

### 2. 串接 Stderr / Stdout 以保留診斷資訊
將 `$psi.RedirectStandardError = $false` 保留給終端機繼承（或由 PowerShell 捕獲輸出），確保若網路超時或密碼錯誤時，PostgreSQL 官方的錯誤回報能在終端機即時呈現，不再吞掉錯誤訊息。

---

## 五、專案與 Git 完整性檢核

| 檢核項目 | 預期基準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **工作目錄** | 保留既有未暫存變更 | 一致 | **PASS** |
| **Prisma Schema** | 未修改 | 未修改 | **PASS** |
| **Migration SQL** | 未修改 | 未修改 | **PASS** |
| **本機備份檔** | `2DB27F8B...` (25,685 bytes) | 未修改、完整封存 | **PASS** |
| **資料庫連線** | 本次故障中完全未連線 | 保持隔離 | **PASS** |

---

## 六、最終診斷結論：`ROOT CAUSE CONFIRMED`

- **判定**：**根本原因已完全確認**。
- **故障本質**：Windows .NET 行程參數未對 `sh -c` 參數加雙引號，導致 Linux 容器只執行了 `read` 指令便以 Exit Code 0 退出，未實際調用 `pg_dump`。
- **下一步**：請授權進入修復階段，我將套用最小修復並進行離線語法與參數驗證。
