# CODE TO KNOW｜Phase 3-C-3：備份管線安全修補與離線驗收技術報告

**執行日期**：2026-11-10  
**專案名稱**：CODE TO KNOW (碼上學)  
**執行角色**：資深 PostgreSQL DBA、應用安全架構師 (AppSec)、DevSecOps 安全審查工程師  
**工作範圍**：本機備份加密管線安全修補 (SEC-01, SEC-02, SEC-03)、UTF-8 BOM 編碼驗證、100% 離線自動化整合測試與驗收  
**安全基準**：零正式雲端資料庫連線、零正式金鑰讀取、受限檔案絕無讀取、零 Git 操作  

---

## 執行摘要

本階段針對 Phase 3-C-2 獨立安全審查中揭露之三項安全發現（SEC-01、SEC-02、SEC-03）及繁體中文 Windows 環境下之 PowerShell 5.1 解析編碼問題進行完整修補與自動化測試驗收。

所有修補均於本機環境完成，全流程僅使用記憶體暫態生成的合成測試資料（Synthetic Mock Data）與專用測試金鑰，全數通過 28 項離線單元與整合測試及 PowerShell 端對端離線測試。

### 修補成果矩陣

| 項目識別 | 風險描述 | 修補策略與機制 | 驗收狀態 |
| :--- | :--- | :--- | :--- |
| **SEC-01** | 金鑰環境變數生命週期未封閉保護，中途異常時恐殘留於行程變數表 | 採用 `try ... finally` 強制保證清理；調用 `[Environment]::SetEnvironmentVariable` 移除 Process Environment Block；嚴格拒絕以 GC 宣稱記憶體抹除；清理失敗立即拋錯 | **PASS** (TC-11) |
| **SEC-02** | 離線測試產出之元數據未標示模擬模式，易誤認為 Supabase 正式備份 | 於 `backup_info.json` 顯式加入 `mock_mode: true`，且將 `source` 標註為 `MOCK_DUMP: <path>`，專案標註為 `code-to-know-mock-test` | **PASS** (TC-12) |
| **SEC-03** | 明文清理失敗時程式行為未受控，缺乏精確退出碼與非破壞性保護 | 僅在迴環驗收通過後清理；強制 `lstatSync` 拒絕符號連結；刪除受阻時保留 `.c2kb` 密文並以 **Exit Code 2** 退出；stderr 明確警示明文路徑 | **PASS** (TC-13, TC-14) |
| **BOM 檢驗** | 繁體中文 Windows (CP950) 下 PowerShell 5.1 解析無 BOM UTF-8 中文註解破壞語法標記 | 保留 `\uFEFF` UTF-8 BOM，通過繁體中文 Windows 原生 PowerShell 5.1 語法剖析與 `-DryRun` 測試 | **PASS** |

---

## 一、SEC-01：金鑰環境變數生命週期管理修補

### 1.1 威脅與根本原因分析
在舊版流程中，PowerShell 透過設定 `$env:BACKUP_ENCRYPTION_KEY = $activeKey` 將 64 位元 Hex 金鑰傳遞予 Node.js 子程序。若子程序執行期間遭遇未攔截例外、使用者中斷（`Ctrl + C`）或提早返回，該環境變數將持續駐留於當前 PowerShell 會話（Session）之 Process Environment Block (PEB) 中，後續啟動之任何子行程均可能無意間繼承該敏感變數。

### 1.2 修補架構與防護機制
在 `scripts/database/run_supabase_backup.ps1` 中實施以下結構化防護：

```powershell
# SEC-01: 透過子行程環境變數傳遞金鑰，防止命令列參數外洩
# 採用 try/finally 保證在正常結束、異常拋錯或可攔截中斷時均清理環境變數
$env:BACKUP_ENCRYPTION_KEY = $activeKey
$envCleanupFailed = $false
$nodeExitCode = 1

try {
    $pipelineArgs = @(
        $cryptoScript,
        "-i", $dumpFilePath,
        "-o", $encFilePath
    )
    if ($KeepPlaintext) {
        $pipelineArgs += "--keep-plaintext"
    }

    Write-Host "執行串流加密、C2KB 容器封裝與解密迴環驗收..." -ForegroundColor Green
    $nodeProc = Start-Process -FilePath "node" -ArgumentList $pipelineArgs -Wait -Passthru -NoNewWindow
    $nodeExitCode = $nodeProc.ExitCode
} finally {
    # 立即自環境變數表清除金鑰，防止子行程與後續流程殘留
    try {
        $env:BACKUP_ENCRYPTION_KEY = $null
        [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
    } catch {
        $envCleanupFailed = $true
        Write-Warning "【安全警示】清理行程環境變數 BACKUP_ENCRYPTION_KEY 失敗：$($_.Exception.Message)"
    }
    $activeKey = $null
    # 記憶體安全說明：.NET System.String 為不可變物件由 GC 管理，調用 Collect() 提示回收
    # 但作業系統實體記憶體分頁無法保證立即物理抹除，環境變數清除可確保 Process Environment Block 不殘留
    [System.GC]::Collect()
    if ($envCleanupFailed) {
        Write-Error "環境變數清理失敗，請手動確認終端環境變數狀態！"
    }
}
```

### 1.3 執行環境記憶體限制與資安邊界透明性說明
- **不可變字串（Immutable String）限制**：PowerShell（.NET Framework CLR）與 Node.js（V8 引擎）中，字串均屬於堆積（Heap）管理之不可變物件。程式碼將變數指派為 `$null` 僅斷開參考，實際記憶體區塊在垃圾回收器（GC）搬移或壓縮前可能殘留於記憶體頁面中。
- **拒絕不實宣稱**：單純調用 `[System.GC]::Collect()` 並無法對底層作業系統實體記憶體 RAM 或分頁檔（Pagefile）執行物理安全抹除（Zeroize）。
- **關鍵邊界保護**：將 `$env:BACKUP_ENCRYPTION_KEY` 設為 `$null` 並調用 `[Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")`，確保能徹底清空 Windows PEB 中的環境變數表，使後續行程無法讀取。正式金鑰的終極防護依賴本機 KeePassXC 主庫管理，在記憶體中的停留時間降至最低。

---

## 二、SEC-02：Mock 備份來源明確標記修補

### 2.1 潛在風險分析
若測試人員或自動化流程使用 `-MockDumpPath` 執行離線管線演練，產出的備份資料夾包含完整的數位指紋、元數據結構及 `.c2kb` 密文檔。若 `backup_info.json` 仍記載專案為 `code-to-know-prod`，日後災難復原演練或審計稽核時，極易將合成測試資料誤認為來自 Supabase 正式雲端資料庫之可用備份。

### 2.2 修補後之元數據架構
在 `scripts/database/run_supabase_backup.ps1` 中，顯式依據 `$MockDumpPath` 動態區分正式與測試屬性：

```powershell
# 9. 產出元數據說明檔 (Metadata JSON, 絕不含密碼)
$isMock = [bool]$MockDumpPath
$metaInfo = [ordered]@{
    project = if ($isMock) { "code-to-know-mock-test" } else { "code-to-know-prod" }
    project_ref = if ($isMock) { "mock-synthetic-ref" } else { "ypibmyfxfhsyfdwxprpi" }
    target_host = if ($isMock) { "OFFLINE_MOCK_DATA" } else { "aws-0-ap-southeast-2.pooler.supabase.com:5432" }
    mock_mode = $isMock
    source = if ($isMock) { "MOCK_DUMP: $MockDumpPath" } else { "SUPABASE_PRODUCTION_DATABASE" }
    format = "PostgreSQL Custom Format (-Fc)"
    tool_version = $dockerCheck.Trim()
    docker_image = if ($isMock) { "N/A (Mock Mode)" } else { $pinnedDockerImage }
    database = if ($isMock) { "mock_postgres" } else { "postgres" }
    backup_file = $dumpFileName
    file_size_bytes = $dumpLength
    sha256 = $sha256
    created_at_utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tls_mode = if ($isMock) { "N/A (Offline Mock)" } else { "verify-full (Strict Root CA & Hostname SAN)" }
    encrypted = $false
}
```

### 2.3 終端顯示明確區隔
終端成功橫幅依據狀態輸出，杜絕任何混淆：
```powershell
Write-Host "  $(if ($isMock) { '[離線模擬測試] 備份與加密管線執行成功！' } else { 'Supabase 雲端備份與加密管線執行成功！' })" -ForegroundColor Green
```

---

## 三、SEC-03：明文清理受阻處理與標準退出碼

### 3.1 核心修補邏輯（`scripts/database/backup-pipeline.cjs`）
在明文檔案刪除階段，實施以下多重嚴格檢查：
1. **嚴格拒絕符號連結（Symlink Protection）**：使用 `fs.lstatSync(resolvedDump)` 檢驗檔案屬性。若目標為符號連結，拋出例外拒絕刪除，防止透過惡意連結刪除系統上無關檔案。
2. **只鎖定單一絕對路徑**：禁止任何萬用字元（wildcards）比對，僅刪除本次備份產生的 dump 檔案。
3. **驗證失敗絕不刪除**：只有在串流解密迴環驗證（Round-Trip Verification）通過（SHA-256 100% 相符且未遭篡改）的情況下，才允許觸發刪除。
4. **清理失敗非破壞性保護**：若因 Windows 檔案鎖定（`EBUSY`）或權限不足（`EPERM`）導致 `fs.unlinkSync` 失敗，**絕對不刪除已驗證完成之 `.c2kb` 加密容器**，並在回傳物件中標註 `cleanupSuccess: false` 與 `plaintextCleanupError`。

```javascript
  // 7. 受控清理明文 (僅在 roundTripPassed 嚴格為 true 時執行)
  let plaintextDeleted = false;
  let plaintextCleanupError = null;

  if (!keepPlaintext && roundTripPassed) {
    try {
      // 嚴格核對為常規檔案且拒絕符號連結，杜絕路徑竄改
      const stat = fs.lstatSync(resolvedDump);
      if (stat.isSymbolicLink()) {
        throw new Error(`Refusing to unlink symbolic link at "${resolvedDump}". Target must be a regular file.`);
      }
      if (!stat.isFile()) {
        throw new Error(`Target is not a regular file at "${resolvedDump}".`);
      }
      fs.unlinkSync(resolvedDump);
      plaintextDeleted = true;
    } catch (cleanupErr) {
      plaintextCleanupError = cleanupErr.message;
      // 若明文刪除失敗，記錄告警但不破壞已完成之加密備份
      console.warn(`[PIPELINE WARNING] Encrypted backup verified and preserved, but failed to unlink plaintext dump at "${resolvedDump}": ${cleanupErr.message}`);
    }
  }
```

### 3.2 CLI 退出碼階層規範
`backup-pipeline.cjs` CLI 介面定義三態明確退出碼：
- **Exit Code 0**：加密成功、迴環驗證通過，且明文已安全清理（或使用者指定 `--keep-plaintext`）。
- **Exit Code 1**：加密失敗、金鑰格式不符、檔案損毀或迴環認證不通過（中止處理，密文不交付，明文保留供除錯）。
- **Exit Code 2**：加密成功且迴環驗證通過（`.c2kb` 完整有效），但明文檔案無法自動刪除。

```javascript
    if (!result.cleanupSuccess) {
      console.error(`[PIPELINE NOTICE] Encrypted backup was verified and preserved, but plaintext dump could not be removed at "${result.originalFile}": ${result.plaintextCleanupError}`);
      // 退出碼 2：加密與迴環驗證成功，但明文清理未達成
      process.exit(2);
    }
    process.exit(0);
```

### 3.3 PowerShell 對應處理機制
在 `run_supabase_backup.ps1` 中捕獲 `$nodeExitCode`：
- 若為 **Exit Code 2**：
  - 記錄警告訊息，告知使用者明文路徑，提醒手動清理。
  - 元數據更新：`plaintext_retained = $true`，`cleanup_status = "WARNING_PLAINTEXT_RETAINED_CLEANUP_FAILED"`。
  - 保留產出之 `.c2kb` 容器及其 `.sha256` 數位指紋，不造成備份資產遺失。

---

## 四、PowerShell 5.1 與 UTF-8 BOM 編碼解析驗證

### 4.1 Windows PowerShell 5.1 解析器特性
在繁體中文 Windows（預設字碼頁 CP950 / Big5）環境下，PowerShell 5.1 解析無 BOM 之 UTF-8 腳本時，可能將多位元組中文字元之後續位元組誤判為 ASCII 特殊控制符號（例如單引號、雙引號或右大括號 `}`），進而拋出 `TerminatorExpectedAtEndOfString` 或 `UnexpectedToken` 語法剖析錯誤。

### 4.2 修補與驗證
1. 確保 `scripts/database/run_supabase_backup.ps1` 開頭嚴格保留 **3-byte UTF-8 BOM (`0xEF, 0xBB, 0xBF`)**。
2. 執行驗證指令確認：
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\database\run_supabase_backup.ps1 -DryRun
   ```
   **驗證結果**：PowerShell 5.1 順暢解析，完整執行參數與環境校驗，無任何語法錯誤，以退出碼 0 安全退出。

---

## 五、離線自動化測試與驗收結果

### 5.1 單元測試：`backup-crypto.test.cjs` (14 / 14 PASS)
執行指令：`node scripts/database/backup-crypto.test.cjs`

| 測試編號 | 測試案例說明 | 驗收結果 |
| :--- | :--- | :--- |
| **TC-01** | 1 MB 隨機檔案加密解密迴環，解密後 SHA-256 與原始完全一致 | **PASS** |
| **TC-02** | 0 Byte 空檔案加密及解密 | **PASS** |
| **TC-03** | 大型檔案 (5 MB) 串流加解密測試，驗證記憶體與管線穩定性 | **PASS** |
| **TC-04** | 錯誤金鑰解密時立即拋錯拒絕，絕不產出明文 | **PASS** |
| **TC-05** | 密文區段位元翻轉 (篡改 1 byte) 時立即拋錯阻斷 | **PASS** |
| **TC-06** | 末端 16 bytes Auth Tag 篡改時拋錯拒絕 | **PASS** |
| **TC-07** | 檔案被截斷至小於 33 位元組時立即拒絕 | **PASS** |
| **TC-08** | 非 C2KB Magic Header 檔案拒絕處理 | **PASS** |
| **TC-09** | 未知版本號 (如 0x02) 檔案拒絕處理 | **PASS** |
| **TC-10** | 輸入與輸出路徑相同時拋錯拒絕，防止自我覆寫毀滅 | **PASS** |
| **TC-11** | 輸出目標檔案已存在時拋錯拒絕覆寫 | **PASS** |
| **TC-12** | 解密認證失敗後，所有 .tmp 暫存檔案全數清除不殘留 | **PASS** |
| **TC-13** | 驗證成功前只有受限暫存檔，完成後才原子化 rename 成正式檔 | **PASS** |
| **TC-14** | 金鑰格式非 64-char Hex 或為 null 時拒絕處理，不洩漏任何明文 | **PASS** |

### 5.2 整合測試：`backup-pipeline.test.cjs` (14 / 14 PASS)
執行指令：`node scripts/database/backup-pipeline.test.cjs`

| 測試編號 | 測試案例說明 | 驗收結果 |
| :--- | :--- | :--- |
| **TC-01** | 正常備份與加密流程：合成 Dump 成功封裝至 .c2kb 容器 | **PASS** |
| **TC-02** | 正常解密及內容比對：解密後 SHA-256 與原始合成 Dump 完全一致 | **PASS** |
| **TC-03** | 加密失敗時的處理：輸入檔案不存在時安全拋錯，不交付任何不完整檔案 | **PASS** |
| **TC-04** | 金鑰錯誤時的處理：使用錯誤金鑰解密立即被 GCM Auth Tag 阻斷 | **PASS** |
| **TC-05** | 加密檔案遭到篡改時的處理：翻轉 1 byte 密文即刻拋錯拒絕解密 | **PASS** |
| **TC-06** | 輸出檔案已存在時不得覆蓋：目標 .c2kb 存在時拒絕覆寫並保護既有檔案 | **PASS** |
| **TC-07** | 暫存檔清理精確性：清理機制絕不影響目錄中既有無關之 .tmp 檔案 | **PASS** |
| **TC-08** | 中途失敗時保護原始明文：驗證失敗或異常時絕不刪除原始明文備份 | **PASS** |
| **TC-09** | 敏感資訊日誌防護：全流程 Console/Error 輸出中絕不包含 64 位元金鑰字串 | **PASS** |
| **TC-10** | Windows PowerShell 離線整合執行：run_supabase_backup.ps1 -MockDumpPath 與 -DryRun 驗證通過 | **PASS** |
| **TC-11** | **[SEC-01]** 金鑰生命週期管理：PowerShell 執行後環境變數絕不殘留 BACKUP_ENCRYPTION_KEY | **PASS** |
| **TC-12** | **[SEC-02]** Mock 備份標記：-MockDumpPath 產出之 backup_info.json 明確標記 mock_mode: true 與 MOCK_DUMP 來源 | **PASS** |
| **TC-13** | **[SEC-03]** 明文清理受阻處理：明文刪除失敗時，保留合格之 .c2kb 容器並標記 cleanupSuccess: false | **PASS** |
| **TC-14** | **[SEC-03]** CLI 退出碼規範：明文清理受阻時，CLI 以退出碼 2 結束並將診斷路徑輸出至 stderr | **PASS** |

### 5.3 端對端 PowerShell 離線驗證
- **DryRun 模式驗證**：
  ```
  Client Tools 驗證通過：pg_dump (PostgreSQL) 17.11 (Digest 鎖定)
  Root CA 路徑：C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt (SHA-256 驗證相符)
  TLS 驗證模式：verify-full
  DryRun 測試通過，安全退出 (ExitCode: 0)。
  ```
- **MockDumpPath + Encrypt 模式驗證**：
  ```
  執行串流加密、C2KB 容器封裝與解密迴環驗收...
  數位指紋與元數據已產出：code_to_know_supabase_prod.dump.sha256, backup_info.json
  [離線模擬測試] 備份與加密管線執行成功！
  解密迴環驗證：PASS
  ExitCode: 0
  ```

---

## 六、修改檔案清單與變更摘要

1. **`scripts/database/run_supabase_backup.ps1`**
   - 補強 `$metaInfo`，加入 `mock_mode` 與動態 `source` 屬性（修補 SEC-02）。
   - 將環境變數傳遞區段以 `try ... finally` 封裝，調用 `[Environment]::SetEnvironmentVariable` 清除 Process Environment Block（修補 SEC-01）。
   - 增加 Node.js Exit Code 2（明文清理失敗）對應之警告機制與元數據標記（修補 SEC-03）。
   - 嚴格維持檔案開頭之 UTF-8 BOM (`\uFEFF`)，防止 PowerShell 5.1 解析錯誤。

2. **`scripts/database/backup-pipeline.cjs`**
   - 增加 `fs.lstatSync` 符號連結防護，拒絕刪除符號連結。
   - 追蹤 `plaintextCleanupError`，刪除受阻時不破壞 `.c2kb` 檔案。
   - CLI 進入點在 `cleanupSuccess: false` 時回傳 **Exit Code 2** 並輸出 stderr 警告（修補 SEC-03）。
   - 匯出 `main` 函式供整合測試 harness 呼叫。

3. **`scripts/database/backup-pipeline.test.cjs`**
   - 新增 TC-11（SEC-01 環境變數清除驗證）。
   - 新增 TC-12（SEC-02 Mock 元數據標記驗證）。
   - 新增 TC-13（SEC-03 核心函式清理失敗回退驗證）。
   - 新增 TC-14（SEC-03 CLI 退出碼 2 與診斷警示驗證）。
   - 自動相容 PowerShell 產出之 UTF-8 BOM JSON 檔案解析。

---

## 七、安全邊界與保證聲明

本工程師嚴格恪守資安作業規範與授權邊界：
1. **零雲端資料庫連線**：全流程未發起任何通往 Supabase（`aws-0-ap-southeast-2.pooler.supabase.com`）或其他網路主機之網路封包。
2. **零正式金鑰接觸**：全流程未讀取 KeePassXC 密碼庫、未讀取任何紙本金鑰、未產生任何正式金鑰。所有測試金鑰均為 Node.js `crypto.randomBytes(32)` 在測試行程記憶體中暫態產生。
3. **零敏感檔案接觸**：未讀取 `新增 文字文件.txt`、`1.docx` 或 `照片/` 內任何內容。
4. **零未授權 Git 寫入**：未執行任何 `git add`、`git commit`、`git push` 或 `git reset` 操作。

---

## 八、結論與後續交接

CODE TO KNOW 本機資料庫備份與 AES-256-GCM 加密整合管線之三項安全發現（SEC-01、SEC-02、SEC-03）已全數修補並通過自動化測試驗證。系統具備：
- 完整封閉的金鑰環境變數生命週期管理。
- 明確區隔的測試模擬與正式備份標記。
- 具備防符號連結竄改、保留密文資產、三態退出碼的強固清理機制。
- 繁體中文 Windows PowerShell 5.1 原生環境高度相容性。

至此，**Phase 3-C-3 安全修補與離線驗收正式完成**。專案已具備後續進入正式金鑰配置或演練之健全基礎。
