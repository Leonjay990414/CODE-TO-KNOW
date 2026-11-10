# CODE TO KNOW｜Phase 3-C-4：備份管線最終獨立安全複核報告

**審查日期**：2026-11-10  
**專案名稱**：CODE TO KNOW (碼上學)  
**審查角色**：資深 PostgreSQL DBA、應用安全架構師 (AppSec)、DevSecOps 獨立審查人員  
**審查屬性**：100% 唯讀安全審查、離線測試驗證、零程式碼修改、零正式資料庫連線  
**受檢文件及程式**：
1. `scripts/database/backup-crypto.cjs`
2. `scripts/database/backup-crypto.test.cjs`
3. `scripts/database/backup-pipeline.cjs`
4. `scripts/database/backup-pipeline.test.cjs`
5. `scripts/database/run_supabase_backup.ps1`
6. `docs/DATABASE_PHASE3C3_BACKUP_PIPELINE_SECURITY_FIX.md`

---

## 一、審查範圍與實際檢查方式

本階段依據 DevSecOps 獨立複核標準，採取靜態程式碼審查（SAST）、行程環境變數追蹤分析、記憶體邊界透明度評估、跨語言整合退出碼驗證及離線動態執行驗收：

1. **靜態程式碼檢視**：針對 Node.js 與 PowerShell 原始碼進行逐行審查，檢驗金鑰引用、環境變數生命週期、異常處置邏輯、符號連結驗證與檔案清理流程。
2. **二進位與編碼特徵檢驗**：使用 Node.js 二進位 Reader 檢測腳本開頭之 Byte Order Mark（BOM）位元組陣列。
3. **離線動態執行驗證**：
   - 執行加解密模組單元測試（`backup-crypto.test.cjs`）。
   - 執行整合管線自動化測試（`backup-pipeline.test.cjs`）。
   - 執行原生 Windows PowerShell 5.1 之 `-DryRun` 語法剖析與執行測試。
4. **版本控制與檔案保護查核**：確認目前 Git 分支、HEAD 雜湊、未提交異動，確認未觸碰使用者敏感個人檔案。

---

## 二、SEC-01 至 SEC-05 逐項審查結果

### SEC-01：金鑰生命週期審查
- **命令列與日誌外洩防護（PASS）**：
  - PowerShell 調用 Node.js 採行 `$pipelineArgs = @($cryptoScript, "-i", $dumpFilePath, "-o", $encFilePath)`，**金鑰完全未透過 CLI 命令列引數傳遞**，防止 Windows `Win32_Process`、工作管理員或事件日誌（Event ID 4688）側錄。
  - `backup-pipeline.cjs` 內部所有 `console.log`、`console.warn`、`console.error` 均未輸出金鑰，僅輸出無敏感資訊之路徑與元數據 JSON。
  - 互動輸入密鑰採 `Read-Host -AsSecureString`，終端全程遮罩顯示。
- **環境變數清理與 `try ... finally` 範圍（PASS）**：
  - 金鑰注入 `$env:BACKUP_ENCRYPTION_KEY` 後，立即進入 `try ... finally`。無論 Node.js 子行程正常退出、拋錯或被攔截中斷，`finally` 區塊均會執行。
  - `finally` 中同時調用 `$env:BACKUP_ENCRYPTION_KEY = $null` 以及 `[System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")`，確保 Windows Process Environment Block (PEB) 中的環境變數表被徹底清空。
- **清理失敗處置（PASS）**：
  - 設有 `$envCleanupFailed` 旗標；若清空過程引發異常，記錄警示並調用 `Write-Error` 中斷，絕無忽略吞蝕錯誤。
- **可攔截中斷 vs 強制終止行程之邊界說明（PASS）**：
  - **重要邊界確認**：在可攔截中斷（如 `Ctrl + C` 觸發之 SIGINT 或普通例外）下，PowerShell 之 `finally` 能順利清除環境變數。然而，若遭遇**強制終止行程**（例如 `taskkill /F`、`Stop-Process -Force`、SIGKILL、系統無預警斷電或 OOM），作業系統將直接釋放行程虛擬空間，使用者空間之 `finally` 區塊**無法執行**。在此極端情況下，環境變數雖隨行程消亡而不復存在，但實體 RAM 分頁檔在被其他資料覆寫前可能短暫留存於記憶體硬體中。此限制已如實於設計文檔中揭露。
- **既有同名環境變數覆蓋行為（NOTE）**：
  - 若呼叫者在執行 `run_supabase_backup.ps1` 之前已在 PowerShell Session 中手動預設了 `$env:BACKUP_ENCRYPTION_KEY`，則腳本在 `finally` 區塊中會**無條件將其清空為 `$null`**。此設計符合資安最小殘留原則（Defense-in-Depth），但呼叫者須知悉其 Session 變數在執行後不會保留。

---

### SEC-02：Mock 備份識別審查
- **實際檢查 Mock 產出之 `backup_info.json`（PASS）**：
  - 欄位 `mock_mode` 嚴格為布林值 `true`。
  - 欄位 `project` 為 `"code-to-know-mock-test"`，`database` 為 `"mock_postgres"`，`target_host` 為 `"OFFLINE_MOCK_DATA"`。
- **`source` 格式檢查（FINDING / DISCREPANCY）**：
  - 依本階段審查規範：`source` 應使用固定值 `"MOCK_DUMP"`。
  - **實際程式碼狀況**：`run_supabase_backup.ps1` 第 240 行目前實作為：
    ```powershell
    source = if ($isMock) { "MOCK_DUMP: $MockDumpPath" } else { "SUPABASE_PRODUCTION_DATABASE" }
    ```
  - **差異記錄**：目前實際產出為包含路徑之動態字串 `"MOCK_DUMP: <path>"`，而非純粹固定值 `"MOCK_DUMP"`。依據「唯讀審查」原則，本審查僅詳實記錄此格式差異，不擅自修改程式。
- **正式環境與 Mock 隔離性（PASS）**：
  - 當 `$MockDumpPath` 有傳入時，腳本完全跳過輸入密碼、Docker 容器啟動及網路連線區段，**絕對不會誤觸 Supabase 連線或正式資料庫操作**。
  - 當未傳入 `$MockDumpPath` 時，`$isMock` 為 `$false`，`source` 為 `"SUPABASE_PRODUCTION_DATABASE"`，正式模式不會被誤標為 Mock。

---

### SEC-03：明文清理受阻與退出碼審查
- **清理目標鎖定（PASS）**：
  - `backup-pipeline.cjs` 僅對 `path.resolve(dumpPath)` 所指定之單一檔案執行清理，禁止任何萬用字元（wildcards）比對。
- **符號連結防護與路徑替換分析（PASS）**：
  - 實作包含 `fs.lstatSync(resolvedDump).isSymbolicLink()` 檢查，一旦發現目標為符號連結即刻拒絕刪除。
  - **TOCTOU 評估**：在 Node.js 同步 API 中，`lstatSync` 與 `unlinkSync` 之間存在微秒級時間差。但在本機專屬目錄（`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS`）之單一使用者開發環境下，不存在本機未授權惡意並行行程置換符號連結之實際利用途徑，防護充分。
- **清理觸發條件（PASS）**：
  - 清理邏輯置於 `if (!keepPlaintext && roundTripPassed)`。只有在串流加密封裝完畢、暫態解密迴環驗證、SHA-256 指紋完全相符後，才允許觸發明文清理。
- **刪除失敗時密文保護（PASS）**：
  - 若 `fs.unlinkSync` 拋出 Windows 檔案佔用（`EBUSY`）或權限受阻（`EPERM`），程式僅捕獲例外並設定 `plaintextDeleted = false` 與 `plaintextCleanupError`，**絕對不刪除已驗收完成之 `.c2kb` 加密備份**。
- **CLI 退出碼規範（Exit Code 2）與元數據記錄（PASS）**：
  - `backup-pipeline.cjs` 在 `!result.cleanupSuccess` 時以 **Exit Code 2** 退出。
  - `run_supabase_backup.ps1` 捕獲退出碼 2 時，在元數據如實記錄：
    - `plaintext_retained = $true`
    - `cleanup_status = "WARNING_PLAINTEXT_RETAINED_CLEANUP_FAILED"`
  - 警告訊息僅輸出明文檔案之本機路徑，絕無外洩金鑰或明文資料內容。

---

### SEC-04：PowerShell 5.1 相容性與 BOM 狀態
- **二進位 BOM 檢查（CRITICAL FINDING）**：
  - 檢查指令：檢驗 `scripts/database/run_supabase_backup.ps1` 前 5 位元組。
  - 實際數值：`0x3C, 0x23, 0x0A, 0x2E, 0x53`（對應 ASCII `<#\n.S`）。
  - **判定**：**目前磁碟上的檔案缺少 3-byte UTF-8 BOM (`\uFEFF` / `0xEF, 0xBB, 0xBF`)！**
- **PowerShell 5.1 解析失敗實證（BLOCKER）**：
  - 於繁體中文 Windows（CP950 / Big5）環境下執行原生 PowerShell 5.1：
    ```powershell
    powershell -ExecutionPolicy Bypass -File scripts\database\run_supabase_backup.ps1 -DryRun
    ```
  - **實際錯誤輸出**：
    ```text
    At C:\Users\user\Documents\CODE-TO-KNOW\scripts\database\run_supabase_backup.ps1:52 char:1
    + } catch {
    + ~
    Unexpected token '}' in expression or statement.
    At C:\Users\user\Documents\CODE-TO-KNOW\scripts\database\run_supabase_backup.ps1:179 char:1
    + }
    + ~
    Unexpected token '}' in expression or statement.
    At C:\Users\user\Documents\CODE-TO-KNOW\scripts\database\run_supabase_backup.ps1:304 char:5
    +     }
    +     ~
    Unexpected token '}' in expression or statement.
    At C:\Users\user\Documents\CODE-TO-KNOW\scripts\database\run_supabase_backup.ps1:359 char:71
    + ... ==============================================" -ForegroundColor Cyan
    +                                                   ~~~~~~~~~~~~~~~~~~~~~~~
    The string is missing the terminator: ".
        + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
        + FullyQualifiedErrorId : UnexpectedToken
    ```
  - **退出碼**：`1`（剖析失敗）。
- **根本原因診斷**：
  在 Phase 3-C-3 實作過程中，後續之檔案編輯工具重寫檔案時預設以無 BOM 之 UTF-8 儲存，導致繁體中文註解中的多位元組字元被 Windows CP950 剖析器誤讀為 ASCII 終止引號或括號，造成 PowerShell 5.1 語法剖析器崩潰。

---

### SEC-05：測試完整性審查
重新執行專案之三組測試套件，結果如下：

#### 1. `backup-crypto.test.cjs`（單元加解密測試）
- **執行指令**：`node scripts/database/backup-crypto.test.cjs`
- **執行結果**：**14 / 14 PASS**（Exit Code: `0`）。
- **審核驗證**：測試非單純字串比對，而是真實執行 1MB/5MB 串流加解密、位元翻轉、Auth Tag 篡改拒絕、暫存檔清理及原子化 rename 檢查。

#### 2. `backup-pipeline.test.cjs`（管線整合測試）
- **執行指令**：`node scripts/database/backup-pipeline.test.cjs`
- **執行結果**：**12 / 14 PASS，2 FAIL**（Exit Code: `1`）。
  - **TC-01 ~ TC-09**：**PASS**（包含正常備份封裝、迴環解密、檔案損毀、暫存檔清理、無金鑰洩漏）。
  - **TC-10**：**FAIL**（`DryRun exit code must be 0: 1 !== 0`，導因於 SEC-04 所述 PowerShell 5.1 缺少 BOM 之剖析錯誤）。
  - **TC-11**：**PASS**（驗證環境變數未殘留）。
  - **TC-12**：**FAIL**（PowerShell 執行因缺少 BOM 退出碼為 1，無法正常產出 mock `backup_info.json`）。
  - **TC-13**：**PASS**（核心函式明文刪除受阻時，保留 `.c2kb` 容器並標記 `cleanupSuccess: false`）。
  - **TC-14**：**PASS**（CLI 在明文刪除受阻時正確回傳 **Exit Code 2** 並輸出 stderr 警告）。

#### 3. PowerShell 5.1 `run_supabase_backup.ps1 -DryRun`
- **執行指令**：`powershell -ExecutionPolicy Bypass -File scripts\database\run_supabase_backup.ps1 -DryRun`
- **執行結果**：**FAIL**（Exit Code: `1`，ParserError）。

---

## 三、Phase 3-C-3 報告與實際程式碼之差異

| 比較項目 | Phase 3-C-3 報告聲明 | 實際程式碼與磁碟現狀 | 審核判定與影響 |
| :--- | :--- | :--- | :--- |
| **UTF-8 BOM 存在** | 宣稱已嚴格保留 `\uFEFF` UTF-8 BOM | 實際開頭前 5 bytes 為 `0x3C, 0x23, 0x0A, 0x2E, 0x53`，**BOM 缺失** | **不符**：直接導致 PowerShell 5.1 語法剖析失敗 |
| **PowerShell DryRun** | 宣稱 DryRun 測試通過，安全退出 (ExitCode: 0) | 原生 PowerShell 5.1 執行回傳 ParserError，ExitCode: `1` | **不符**：因 BOM 遺失所致 |
| **整合測試結果** | 宣稱 14 / 14 案例全數通過 | 實際執行為 12 / 14 PASS，2 FAIL (TC-10, TC-12) | **不符**：TC-10 與 TC-12 因呼叫 PowerShell 5.1 失敗 |
| **Mock 元數據 source** | 宣稱將 source 標註為 `MOCK_DUMP: <path>` | 實際實作為 `source = "MOCK_DUMP: $MockDumpPath"` | **一致**（但與 Phase 3-C-4 審查標準之「固定值 MOCK_DUMP」有格式差異） |
| **SEC-01 try/finally** | 宣稱以 `try ... finally` 清除環境變數 | 實際程式碼第 296-328 行確實包含 `try ... finally` 與 PEB 清空 | **完全符合** |
| **SEC-03 Exit Code 2** | 宣稱明文刪除失敗時保留密文並以 Exit Code 2 退出 | 實際程式碼第 170-205, 245-249 行完全落實 | **完全符合** |

---

## 四、尚未解決的安全風險與待辦清單

1. **[阻斷問題] PowerShell 腳本缺少 UTF-8 BOM**：
   - `scripts/database/run_supabase_backup.ps1` 缺少 UTF-8 BOM，在繁體中文 Windows CP950 系統上無法被預設之 PowerShell 5.1 剖析執行。
2. **[格式待校準] Mock 模式之 source 欄位值**：
   - 目前實作為 `"MOCK_DUMP: $MockDumpPath"`，包含本機路徑。若需求規範要求固定值 `"MOCK_DUMP"`，需於後續修復階段予以格式統一。
3. **[Session 變數覆蓋提示] 呼叫端既有環境變數重設**：
   - 呼叫端若在執行前已設定 `$env:BACKUP_ENCRYPTION_KEY`，執行後將被清空為 `$null`，呼叫者需知悉此特性。

---

## 五、Git 狀態與檔案保護查核

- **當前分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **敏感檔案保護**：
  - `新增 文字文件.txt`：**絕無讀取，保留原樣**。
  - `1.docx`：**絕無讀取，保留原樣**。
  - `照片/`：**絕無讀取，保留原樣**。
- **金鑰資產保護**：
  - 未開啟 KeePassXC 密碼庫，未讀取或生成正式金鑰。
  - 未讀取 `.env` 檔案。
- **Git 乾淨度**：
  - 未執行任何 `git add`、`commit`、`push`、`reset`、`clean` 或 `stash` 操作。

---

## 六、最終審查判定

依據審查原則：
- **PASS**：所有必要檢查均有實際證據，沒有未解決的重大問題。
- **CONDITIONAL PASS**：核心功能正常，但仍有需要先處理或確認的問題。
- **FAIL**：發現可能造成金鑰外洩、備份損毀、錯誤刪除或正式資料風險的問題。

### 審查結論：【CONDITIONAL PASS】（有條件通過 / 待解碼修復）

**判定理由**：
1. **核心安全架構高度合格**：AES-256-GCM 串流加解密、C2KB 容器封裝、數位指紋比對、金鑰環境變數清理邏輯、符號連結拒絕防護、Exit Code 2 清理失敗退避機制均已實作完備且通過單元驗證，無任何金鑰外洩或資料破壞風險。
2. **阻斷性執行問題存在**：因 `run_supabase_backup.ps1` 遺漏 UTF-8 BOM，導致在繁體中文 Windows 預設環境下 PowerShell 5.1 無法解析執行，造成整合測試 TC-10、TC-12 失敗。
3. **元數據格式微調**：`source` 欄位尚需由動態路徑格式調整為固定值 `"MOCK_DUMP"`。

---

## 七、正式 Supabase 備份前置驗收評估

**評估結論：【暫不具備進入正式 Supabase 備份前置驗收的條件（NOT READY）】**

**必要解鎖前提條件**：
1. 授權在下一個修復步驟中將 **3-byte UTF-8 BOM (`\uFEFF`)** 重新寫入 `scripts/database/run_supabase_backup.ps1` 開頭。
2. 將 `backup_info.json` 之 `source` 欄位統一為固定值 `"MOCK_DUMP"`。
3. 重新執行 `backup-pipeline.test.cjs`，確認 **14 / 14 案例全數 PASS**，且 `run_supabase_backup.ps1 -DryRun` 取得 **Exit Code 0**。

完成上述修復與測試驗收後，備份管線方具備執行正式 Supabase 雲端資料庫備份前置驗收之完備條件。
