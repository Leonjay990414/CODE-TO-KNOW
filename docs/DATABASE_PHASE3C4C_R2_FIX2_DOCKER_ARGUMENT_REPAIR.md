# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R2-FIX2：Docker sh -c 引數傳遞與輸出管道修復審查報告

**文檔版本**：1.0 (深度修復與驗收)  
**修正日期**：2026-11-08  
**修正角色**：資安審查工程師、PostgreSQL DBA、Windows .NET/PowerShell 系統工程師  
**主要檔案**：`scripts/database/run_supabase_backup.ps1`  
**核心目標**：解決 Docker `sh -c` 複合指令因缺少雙引號被截斷只執行 `read` 的根本原因，並引入異步管道防護與多重成功校驗。

---

## 一、原始根本原因與修復前後對比 (RCA & Diff)

### 1. 根本原因回顧
在上一版本中，使用 `[string]::Join(" ", $dockerArgs)` 拼接 Windows 命令列，導致傳入 Docker 的指令未對 `sh -c` 後方的腳本進行引號包裹。Linux 容器將其視為 `sh -c read -r PGPASSWORD` 執行，只跑了 `read` 便以 Exit Code 0 退出，後續的 `export PGPASSWORD; exec pg_dump ...` 完全被忽略，造成 Exit Code 0 卻未產出 dump 檔案。

### 2. 修復前後參數傳遞與架構差異對比

| 評估維度 | FIX1 原始故障版本 | FIX2 修正版本 | 安全與功能改進效益 |
| :--- | :--- | :--- | :--- |
| **`sh -c` 引數包裹** | `$containerCmd` 未帶引號傳入 | **`"$containerCmd"` 嚴格雙引號包裹** | 保證 Linux 容器內部將整段腳本識別為單一完整指令，依序執行 `read` -> `export` -> `exec pg_dump`。 |
| **stdout/stderr 管理** | `RedirectStandardError = $false` (直接丟棄) | **.NET `ReadToEndAsync()` 異步雙向讀取** | 徹底杜絕管道緩衝區溢滿死鎖，並完整保留失敗時 pg_dump 原廠診斷輸出（不再吞掉錯誤訊息）。 |
| **備份成功判定** | 僅檢查 `$backupExitCode -ne 0` | **多重條件原子判定** | 必須同時滿足 `(ExitCode=0) AND (Dump存在) AND (大小>0) AND (SHA-256成功)`，缺一不可。 |
| **失敗目錄清理** | 僅依賴 Exit Code 觸發清理 | **條件不符時強制觸發清理與錯誤輸出** | 若 Dump 檔案不存在或為 0 位元組，立即印出 Stderr 診斷並徹底刪除時間戳記目錄，零殘留。 |
| **腳本檔案大小** | 9,879 Bytes | **11,420 Bytes** | 新增異步工作等待、非同步讀取與完整多重防護邏輯。 |
| **腳本 SHA-256** | `a833eb8a...` | **`1c587e5515fbbe214642c1f9df1ee4a0a994c40322d351becabc186754c19433`** | 重新核定並封裝。 |

---

## 二、使用的 .NET 引數傳遞與異步管道技術

經檢查本機執行環境：
- **PowerShell 版本**：`5.1.26100.8972` (Windows PowerShell Desktop)
- **CLR / .NET 版本**：`4.0.30319.42000` (.NET Framework 4.8.x)
- **ArgumentList 支援度**：Windows PowerShell 5.1 內建之 `ProcessStartInfo` 尚未提供 .NET Core 2.1+ 的 `ArgumentList` 集合屬性。

因此，採用符合 Windows API `CreateProcess` 規範的標準命令列跳脫與異步管道方案：
1. **Windows 命令列引數嚴格雙引號包裹**：
   ```powershell
   $escapedContainerCmd = "`"$containerCmd`""
   ```
   確保傳給 Docker 時，`sh -c` 後面的字串為 `sh -c "read -r PGPASSWORD; export PGPASSWORD; exec pg_dump ..."`。
2. **.NET Task 異步讀取 (`ReadToEndAsync`)**：
   ```powershell
   $stdoutTask = $process.StandardOutput.ReadToEndAsync()
   $stderrTask = $process.StandardError.ReadToEndAsync()
   
   $process.StandardInput.WriteLine($plainPass)
   $process.StandardInput.Close()

   $process.WaitForExit()
   [System.Threading.Tasks.Task]::WaitAll($stdoutTask, $stderrTask)
   $capturedStderr = $stderrTask.Result
   ```
   - 避免了同步讀取單一管道時，另一個管道因緩衝區塞滿（4KB/64KB OS Buffer）引發的典型子行程死鎖（Process Hang）。

---

## 三、離線安全測試矩陣 (零 Supabase 連線)

為證明本方案在容器端執行的正確性，在本地執行隔離測試（使用無敏感性測試字串 `LOCAL_TEST_ONLY`，絕無任何資料庫連線）：

### 1. 多命令依序執行與 Stdin 接收測試
- **測試命令**：`sh -c "read -r P; export P; echo \"GOT_PASS:$P\"; exit 42"`
- **輸入字串**：`LOCAL_TEST_ONLY`
- **測試結果**：
  - 成功執行第一指令（`read` 讀入變數）。
  - 成功執行第二指令（`export` 導出環境變數）。
  - 成功執行第三指令（`echo` 輸出字串）。
  - 成功執行第四指令（`exit 42` 返回自訂錯誤碼）。
- **判定**：**PASS**（證明複合命令已 100% 完整執行）。

### 2. 異步 stdout/stderr 與 Exit Code 0 測試
- **測試命令**：輸出 stdout 與 stderr 訊息，並以 `exit 0` 退出。
- **測試結果**：
  - `ExitCode`：`0`
  - `capturedStdout`：成功擷取內容。
  - `capturedStderr`：成功擷取錯誤流內容。
  - 無任何死鎖現象。
- **判定**：**PASS**

### 3. 異常退出與 Exit Code 42 測試
- **測試命令**：故意觸發 `exit 42`。
- **測試結果**：PowerShell 正確捕捉 `ExitCode: 42`，多重成功條件判定正確觸發失敗分支。
- **判定**：**PASS**

---

## 四、DryRun 離線模擬測試

執行離線模擬：
```powershell
powershell -ExecutionPolicy Bypass -Command "& 'scripts\database\run_supabase_backup.ps1' -DryRun"
```

### 測試輸出確認：
```text
==========================================================
  CODE TO KNOW (碼上學) - Supabase 雲端備份工具 (PG 17)
==========================================================
目標專案：code-to-know-prod (ypibmyfxfhsyfdwxprpi)
目標端點：aws-0-ap-southeast-2.pooler.supabase.com:5432
連線架構：Session Pooler (Port 5432)
TLS 模式：PGSSLMODE=verify-full (Strict Root CA & Hostname SAN)
傾印格式：PostgreSQL Custom Format (-Fc)
映像鎖定：postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac
==========================================================

[1/6] Client Tools 驗證通過：pg_dump (PostgreSQL) 17.11 (Digest 鎖定)

[DryRun 模式] 離線安全與參數驗證完成：
  預定輸出目錄：C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_212448
  預定輸出檔案：C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_212448\code_to_know_supabase_prod.dump
  Root CA 路徑：C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt (SHA-256 驗證相符)
  TLS 驗證模式：verify-full
  Docker 映像檔：postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac
DryRun 測試通過，安全退出。
```

- **Exit Code**：0
- **零連線證明**：DryRun 模式在進入密碼讀取前即刻退出，完全未連線 Supabase，未建立任何 dump 檔案。

---

## 五、專案與 Git 完整性檢核

| 檢核項目 | 預期基準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Root CA SHA-256** | `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7` | 一致 | **PASS** |
| **Docker RepoDigest**| `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac` | 一致 | **PASS** |
| **失敗目錄留存** | `CODE_TO_KNOW_SUPABASE_20261108_205853` 保留現場 | 完整保留 | **PASS** |
| **外部連線** | 100% 離線測試 | 零連線 | **PASS** |

---

## 六、最終審查結論：`PASS`（引數與管道缺陷已彻底修復）

本備份工具 `scripts/database/run_supabase_backup.ps1` 已完成深度修復與全套本地測試：
1. `sh -c` 雙引號包裹徹底解決了指令截斷問題。
2. 異步讀取徹底消除了管道死鎖風險並保留除錯資訊。
3. 成功多重條件驗證杜絕了誤判成功的可能。

> **聲明**：  
> **「本階段僅完成備份工具引數修復與離線測試，沒有連線 Supabase，亦未執行任何實際雲端備份。」**
