# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R2-FIX3：修復後備份工具獨立安全驗收報告

**文檔版本**：1.0 (獨立安全驗收結案)  
**驗收日期**：2026-11-08  
**驗收角色**：獨立資安審查架構師、PostgreSQL DBA、DevSecOps 稽核團隊  
**審查目標**：針對 `scripts/database/run_supabase_backup.ps1` 進行原始碼級獨立審查，逐行核對引數傳遞、Stdin 密碼管道、異步輸出管理、五項成功判定條件、TLS 驗證與映像鎖定。  
**驗收模式**：100% 離線靜態審核與 DryRun 模擬驗證，零外部網路連線、零資料庫寫入。

---

## 一、審查項目逐項判定總表 (Checklist & Verdicts)

| 審查維度 | 檢驗標的與機制 | 審查判定 |
| :--- | :--- | :---: |
| **A. SHA-256 與編碼核對** | `1c587e5515fbbe214642c1f9df1ee4a0a994c40322d351becabc186754c19433` (含 UTF-8 BOM) | **PASS** |
| **B. Docker Argument 傳遞** | Windows 雙引號精準包裹 `"$containerCmd"`，消除參數被拆解只跑 read 的缺陷 | **PASS** |
| **C. Stdin 安全性** | 密碼串流寫入 Stdin，命令列、日誌、`docker inspect` 零洩漏，客觀揭露剩餘風險 | **PASS** |
| **D. stdout/stderr 與程序管理** | .NET `ReadToEndAsync()` 異步雙向讀取，杜絕緩衝區死鎖，完整保留原廠錯誤診斷 | **PASS** |
| **E. 備份成功判定條件** | 依據實體原始碼，完整具備五項獨立成功判定條件，中途失敗強制清理時間戳記目錄 | **PASS** |
| **F. TLS 與映像鎖定** | `PGSSLMODE=verify-full` + Root CA SHA-256 核對 + 固定官方 RepoDigest | **PASS** |
| **G. 離線模擬測試** | DryRun 通過，零網路連線、零密碼輸入、零 dump 產生 | **PASS** |
| **H. Git 狀態完整性** | HEAD 保持 `765ff90`，保留既有未暫存修改，零 stage、零 commit | **PASS** |
| **整體安全審查判定** | **CONDITIONAL GO — READY FOR USER AUTHORIZATION** | **PASS** |

---

## 二、SHA-256 數位指紋與編碼核對 (A)

經唯讀讀取實體檔案與計算雜湊：
- **實體路徑**：`scripts/database/run_supabase_backup.ps1`
- **檔案大小**：`11,420 Bytes`
- **UTF-8 BOM**：存在 (`EF BB BF`)，符合 Windows PowerShell 5.1 解析多字節字元與雙引號之嚴格要求。
- **SHA-256 數位指紋**：
  `1c587e5515fbbe214642c1f9df1ee4a0a994c40322d351becabc186754c19433`
- **預期基準**：
  `1c587e5515fbbe214642c1f9df1ee4a0a994c40322d351becabc186754c19433`
- **比對結果**：**100% 精準吻合 (MATCH)**。

---

## 三、Docker Argument 傳遞與命令列結構審查 (B)

逐行核對腳本第 127~146 行之 ProcessStartInfo 建立邏輯：

1. **容器命令定義**：
   ```powershell
   $containerCmd = "read -r PGPASSWORD; export PGPASSWORD; exec pg_dump -h aws-0-ap-southeast-2.pooler.supabase.com -p 5432 -U postgres.ypibmyfxfhsyfdwxprpi -d postgres -Fc -v -f /backups/$dumpFileName"
   ```
2. **引數雙引號包裹**：
   ```powershell
   $escapedContainerCmd = "`"$containerCmd`""
   $dockerArgs = @(
       "run", "-i", "--rm",
       "-e", "PGSSLMODE=verify-full",
       "-e", "PGSSLROOTCERT=/certs/$caFileName",
       "-v", "${caDir}:/certs:ro",
       "-v", "${targetDirPath}:/backups:rw",
       $pinnedDockerImage,
       "sh", "-c", $escapedContainerCmd
   )
   $psi.Arguments = [string]::Join(" ", $dockerArgs)
   ```
3. **驗證結果**：
   - `sh` 是獨立參數。
   - `-c` 是獨立參數。
   - 完整 container command 被 Windows 雙引號完整包裹為單一參數，傳入 Linux 容器後被正確解析為複合指令，保證依序執行 `read` -> `export` -> `exec pg_dump`。
   - 徹底杜絕先前只執行 `read` 便以 Exit Code 0 退出之截斷缺陷。
4. **判定**：**PASS**

---

## 四、Stdin 密碼傳遞安全性與客觀威脅分析 (C)

1. **密碼生命週期與命令列隔離**：
   - 密碼由使用者透過 `Read-Host -AsSecureString` 互動輸入（終端星號遮罩）。
   - 純文字密碼僅存在於記憶體中，透過 `process.StandardInput.WriteLine($plainPass)` 串流傳入 Docker stdin，隨後立即關閉 StandardInput 管道。
   - **命令列零密碼**：`docker run` 命令列完全無 `-e PGPASSWORD` 或密碼字串。
   - **`docker inspect` 零密碼**：容器配置 Config.Env 不包含密碼。
   - **生命週期清除**：在 `finally` 區塊強制將 `$plainPass = $null` 並主動呼叫 `[System.GC]::Collect()`。
2. **客觀威脅模型與剩餘風險揭露**：
   - 具備 Windows 本機 Administrator / SYSTEM 權限或 Docker daemon 直接存取權限之本機使用者，在備份執行的極短暫時間窗口內，理論上仍可透過記憶體傾印工具探查進程記憶體。
   - 本腳本已消除了日誌落盤、歷史指令殘留、CLI 引數外洩等最高危險路徑，達到本機使用者環境下的最高防護水準。
3. **判定**：**PASS**

---

## 五、stdout / stderr 異步管理與管道死鎖防禦 (D)

逐行核對腳本第 153~167 行之管道管理：

1. **異步讀取實作**：
   ```powershell
   $stdoutTask = $process.StandardOutput.ReadToEndAsync()
   $stderrTask = $process.StandardError.ReadToEndAsync()
   $process.StandardInput.WriteLine($plainPass)
   $process.StandardInput.Close()
   $process.WaitForExit()
   [System.Threading.Tasks.Task]::WaitAll($stdoutTask, $stderrTask)
   $capturedStderr = $stderrTask.Result
   ```
2. **防死鎖驗證**：
   - `stdoutTask` 與 `stderrTask` 同時非同步啟動讀取，徹底杜絕了同步讀取單一串流時因作業系統緩衝區（4KB/64KB OS Buffer）溢滿引發的死鎖。
   - 透過 `[System.Threading.Tasks.Task]::WaitAll()` 確保兩個管道均已讀取至 EOF 後才進行後續判定。
   - 失敗時若 stderr 有內容，腳本會在終端機以黃色字體完整輸出 `capturedStderr`，確保原廠除錯資訊（如憑證驗證失敗、網路逾時等）清晰呈現，不再吞掉錯誤。
3. **判定**：**PASS**

---

## 六、實體原始碼五項獨立成功判定條件審核 (E)

經逐行核對 `run_supabase_backup.ps1`，確認腳本依序實施以下**五項獨立成功判定條件**，缺一不可：

1. **條件 1 (Exit Code 校驗)**：`$backupExitCode -eq 0`（Docker 行程必須成功退出）。
2. **條件 2 (檔案存在性校驗)**：`Test-Path $dumpFilePath` 為 `True`（Dump 檔案必須實體落盤）。
3. **條件 3 (檔案大小非空校驗)**：`$dumpLength -gt 0`（Dump 檔案大小必須大於 0 位元組）。
4. **條件 4 (SHA-256 計算校驗)**：`Get-FileHash -Path $dumpFilePath -Algorithm SHA256` 成功取得 64 位大寫雜湊並寫入 `.sha256` 檔案。
5. **條件 5 (Metadata 寫入校驗)**：`$metaInfo | ConvertTo-Json | Set-Content` 成功產出 `backup_info.json`（不含密碼與連線字串）。

**失敗防護機制**：
- 若條件 1~3 有任一項未達成，腳本在第 185~203 行立即進入失敗分支：印出 STDERR 原廠診斷、強制刪除殘缺 dump 檔案、強制遞迴刪除時間戳記目錄，絕不留下未完成檔案誤導使用者，亦絕不誤報成功！
- 判定：**PASS**

---

## 七、TLS 嚴格驗證與 Docker 映像檔鎖定 (F)

1. **TLS 模式**：`PGSSLMODE=verify-full`。
2. **Root CA 實體指紋**：
   - 檔案：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`
   - SHA-256：`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`（精準吻合）。
   - 以唯讀 `:ro` 掛載入容器 `/certs/supabase-root.crt`。
3. **Docker 映像檔**：
   - RepoDigest：`postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
   - 工具版本：`pg_dump (PostgreSQL) 17.11`（與雲端版本 17.11 官方二進位完全一致）。
4. **判定**：**PASS**

---

## 八、DryRun 離線模擬測試 (G)

執行離線模擬：
```powershell
powershell -ExecutionPolicy Bypass -Command "& 'scripts\database\run_supabase_backup.ps1' -DryRun"
```
- **測試輸出**：成功調用 Digest 鎖定之 Docker 容器提取 `pg_dump 17.11`，校驗 Root CA 雜湊通過，解析輸出目錄與檔案路徑正確，退出碼為 0。
- **零連線證明**：DryRun 模式在進入密碼讀取前即刻退出，**完全未向 Supabase 發起任何網路連線，未寫入任何 dump 檔案**。
- **判定**：**PASS**

---

## 九、Git 狀態與專案完整性檢核 (H)

- **Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（精準一致）。
- **工作目錄狀態**：保留既有所有未暫存變更與未追蹤文檔，無任何 stage、commit、push、clean 或 reset 操作。
- **專案費用**：**$0.00 USD**。
- **判定**：**PASS**

---

## 十、最終驗收結論：`CONDITIONAL GO — READY FOR USER AUTHORIZATION`

經獨立逐行審查與多維度本地離線驗證，備份工具 `scripts/database/run_supabase_backup.ps1`：
- **引數傳遞缺陷已徹底修復**。
- **異步管道與防死鎖機制完備**。
- **五項成功判定條件嚴格生效**。
- **TLS verify-full 與 Root CA 完整鎖定**。
- **Docker 映像檔與工具版本官方一致**。

本工具已完全具備發起第一次 Supabase 雲端正式備份之條件，**等待使用者正式下達執行授權**。

> **聲明**：  
> **「本階段僅完成修復後備份工具之獨立安全驗收，沒有連線 Supabase，亦未執行任何實際雲端備份。」**
