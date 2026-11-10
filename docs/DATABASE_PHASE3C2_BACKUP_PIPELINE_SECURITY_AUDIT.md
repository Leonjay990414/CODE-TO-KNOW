# CODE TO KNOW｜備份加密管線獨立安全審查報告
# 資料庫正式收尾 Phase 3-C-2：金鑰生命週期、明文清理防護、管線邊界與錯誤復原深度稽核

**文件編號**：C2K-DOC-DB-PHASE3C2-PIPELINE-AUDIT-01  
**審查日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA、獨立應用資安架構師（AppSec）、DevSecOps 稽核員  
**審查性質**：100% 唯讀獨立靜態與動態安全審查（未連線雲端資料庫、未執行正式備份、零正式金鑰、零寫入操作）  
**審查標的**：
- `scripts/database/backup-crypto.cjs`
- `scripts/database/backup-crypto.test.cjs`
- `scripts/database/backup-pipeline.cjs`
- `scripts/database/backup-pipeline.test.cjs`
- `scripts/database/run_supabase_backup.ps1`
- `docs/DATABASE_PHASE3C1_LOCAL_BACKUP_ENCRYPTION_INTEGRATION.md`

---

## 一、審查檔案清單與靜態檢查範疇

本階段對 Phase 3-C-1 新增與修改之全部備份與加密程式碼進行深層安全審核，檢核清單如下：

| 檔案路徑 | 代碼行數 | 核心功能職責 | 本次審查焦點 |
| :--- | :---: | :--- | :--- |
| `scripts/database/backup-crypto.cjs` | 346 行 | 底層 AES-256-GCM 串流加解密引擎、C2KB 容器規範 | GCM Nonce 隨機性、Auth Tag 驗收、原子交付、金鑰防洩 |
| `scripts/database/backup-crypto.test.cjs` | 322 行 | 14 項密碼學演算法安全單元測試集 | 迴環驗證、篡改攔截、空檔案處理、覆寫防護 |
| `scripts/database/backup-pipeline.cjs` | 215 行 | 備份管線整合協調器（Orchestrator） | 解密迴環驗證、明文受控刪除、C2KB 結構檢驗、錯誤復原 |
| `scripts/database/backup-pipeline.test.cjs` | 340 行 | 10 項離線管線整合測試集 | 合成 Dump 測試、篡改拋錯、日誌防洩、PowerShell 整合驗收 |
| `scripts/database/run_supabase_backup.ps1` | 357 行 | Supabase PostgreSQL 17 雲端備份與加密主入口腳本 | TLS verify-full、密碼 Stdin 注入、子行程金鑰傳遞、例外處理 |
| `docs/DATABASE_PHASE3C1_LOCAL_BACKUP_ENCRYPTION_INTEGRATION.md` | 240 行 | Phase 3-C-1 技術實施與架構報告 | 流程規範、測試記錄、安全限制宣示 |

---

## 二、重點安全審查與實證分析

---

### A. 金鑰傳遞與生命週期管理（Key Transmission & Lifecycle）

#### 1. PowerShell 傳遞金鑰至 Node.js 的安全性
- **實務作法**：
  在 `run_supabase_backup.ps1` 第 290 行中，採用設定子行程環境變數方式傳遞金鑰：
  ```powershell
  $env:BACKUP_ENCRYPTION_KEY = $activeKey
  $pipelineArgs = @($cryptoScript, "-i", $dumpFilePath, "-o", $encFilePath)
  $nodeProc = Start-Process -FilePath "node" -ArgumentList $pipelineArgs -Wait -Passthru -NoNewWindow
  $env:BACKUP_ENCRYPTION_KEY = $null
  ```
- **安全優點**：
  **完全避免了在命令列引數中使用 `-k <keyHex>`**。在 Windows 系統中，命令列引數可被任何具有一般使用者權限的本機程序（如 Task Manager、Process Explorer、`Get-CimInstance Win32_Process`）直接讀取；採用環境變數傳遞成功封閉了此一攻擊面。
- **發現之安全隱患（SEC-01 / 中度風險）**：
  在 `run_supabase_backup.ps1` 第 289-307 行中，環境變數的賦值與清理**未被包裹在 `try ... finally` 區塊中**！
  若使用者在 Node.js 執行期間按下 `Ctrl + C` 強制中斷，或系統拋出未預期終止訊號，第 305 行的 `$env:BACKUP_ENCRYPTION_KEY = $null` 將被略過，導致 64 位元主金鑰殘留在當前 PowerShell 終端會話的環境變數中，直到該終端視窗關閉為止。

#### 2. 程序例外、Log 與診斷輸出洩漏檢查
- **審查證據**：
  - `backup-crypto.cjs` 的 `parseKey()` 僅驗證長度與格式，拋出的例外為固定字串 `[CRYPTO CONFIG ERROR] Key must be a 64-character hexadecimal string.`，絕不拼接金鑰內容。
  - `backup-pipeline.cjs` 的錯誤處理模組均未引用 `keyHex` 變數作為錯誤訊息輸出。
  - **測試實證（TC-09 PASS）**：攔截整個加解密管線執行過程中的 `console.log` 與 `console.error`，全文比對確認未包含 64 位元 Hex 金鑰字串。

#### 3. 正式金鑰與測試金鑰隔離
- **審查證據**：
  所有單元測試與整合測試（`backup-crypto.test.cjs` 與 `backup-pipeline.test.cjs`）均透過 `crypto.randomBytes(32).toString('hex')` 在記憶體中動態生成隨機臨時金鑰，測試完畢即銷毀。專案代碼庫與 Git 歷史中 100% 無正式金鑰殘留。

---

### B. 明文清理安全性與路徑競爭（Plaintext Cleanup & TOCTOU）

#### 1. 清理範圍精確性
- **審查證據**：
  在 `backup-pipeline.cjs` 第 180 行：
  ```javascript
  if (fs.existsSync(resolvedDump) && fs.statSync(resolvedDump).isFile()) {
    fs.unlinkSync(resolvedDump);
    plaintextDeleted = true;
  }
  ```
  `resolvedDump` 取自 `path.resolve(dumpPath)`。在呼叫鏈中，路徑為 `run_supabase_backup.ps1` 在獨立時間戳記目錄（`CODE_TO_KNOW_SUPABASE_yyyyMMdd_HHmmss`）下生成的 `code_to_know_supabase_prod.dump`。**代碼中絕無使用通配符（如 `*.dump`）或刪除父層目錄之行為**，不會波及其他既有備份。

#### 2. 解密迴環驗證（Round-Trip Verification）作為刪除前置條件
- **審查證據**：
  `backup-pipeline.cjs` 實施嚴格門禁：
  只有在 `.c2kb` 容器解密至 `verifyTemp`、計算 SHA-256 且比對**與原始明文完全相同（100% Match）**後，變數 `roundTripPassed` 才會被置為 `true`。
  若驗證過程發生 Auth Tag 錯誤、雜湊不符或檔案損毀，程序跳入 `catch (verifyErr)`，`resolvedDump` **絕對保留**，且破損的 `.c2kb` 與 `verifyTemp` 會被強制銷毀。

#### 3. TOCTOU（檢查到使用時間差）與符號連結風險評估
- **發現之安全細節（SEC-03 / 低度風險）**：
  - `fs.statSync` 會解析符號連結（Symlink）。若惡意攻擊者預先在目錄下建立指向重要系統檔案的 Symlink，調用 `unlinkSync` 在 Windows 系統上通常僅會刪除該 Symlink 本身，但在 Linux 容器或跨平台環境可能存在疑慮。建議後續改用 `fs.lstatSync` 明確拒絕 Symlink。
  - 若 `fs.unlinkSync` 因檔案遭其他防毒軟體鎖定而拋出例外，Node.js 內部會以 `console.warn` 捕捉並結束（Exit Code 0），回傳之 JSON 標記 `plaintextDeleted: false`；但 PowerShell 在未細讀 JSON 屬性的情況下，會以 `$KeepPlaintext` 判定記錄，可能在 metadata 中產生狀態落差。

#### 4. 暫存檔殘留防護
- 迴環驗證暫存檔 `verifyTemp` 在 `finally` 區塊強制執行 `fs.unlinkSync(verifyTemp)`，經 TC-07 實測證實無任何 `.tmp` 殘留。

---

### C. 加密檔案交付完整性（Encrypted File Delivery）

#### 1. C2KB 格式與 GCM 完整性對照
- **結構標準**：
  `[Magic: 4B "C2KB"] + [Version: 1B 0x01] + [Nonce: 12B] + [Ciphertext Stream] + [Auth Tag: 16B]`。
- **認證保證**：
  AES-256-GCM 屬於 AEAD（關聯資料認證加密）。任何對密文或標籤的單一 bit 篡改（如 TC-05 翻轉 1 byte），解密時均在底層拋出 `Authentication tag verification failed`，無法還原任何資料。

#### 2. 同一檔案系統內原子化更名（Atomic Finalization）
- **審查證據**：
  在 `backup-crypto.cjs` 第 76 行：
  ```javascript
  const tempOutput = `${resolvedOutput}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
  ```
  暫存檔與最終目標檔 `resolvedOutput` 位於**完全相同的父目錄**（`path.dirname(resolvedOutput)`），保證位於同一個檔案系統磁碟分區內。
  調用 `fs.renameSync(tempOutput, resolvedOutput)` 為作業系統層級之原子操作（Atomic Rename），**絕無跨磁碟區複製（EXDEV）導致中斷產生半截檔案之風險**。

#### 3. 既有檔案覆寫防護
- 在 `backup-crypto.cjs` 與 `backup-pipeline.cjs` 雙重加入 `if (fs.existsSync(resolvedEnc)) throw new Error(...)`，實測 TC-06 證實目標檔案已存在時立即拒絕，既有檔案 100% 受到保護。

---

### D. PostgreSQL 備份流程與安全配置（PostgreSQL Backup Flow）

#### 1. Docker 與 pg_dump 錯誤處理
- **審查證據**：
  `run_supabase_backup.ps1` 實施三重成功判定：
  `(ExitCode == 0) AND (DumpExists) AND (Length > 0)`。
  若任一條件不滿足，觸發清理程序（刪除未完成之 Dump 與目標目錄），並輸出原廠 STDERR 診斷訊息，安全退出。
- 採用 .NET `ReadToEndAsync()` 異步讀取標準輸出與錯誤輸出，徹底消除了管道緩衝區溢滿（Deadlock）風險。

#### 2. TLS `verify-full` 與 CA 憑證防護
- **審查證據**：
  `run_supabase_backup.ps1` 在連線前強制比對 `supabase-root.crt` 的 SHA-256 指紋：
  `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`。
  容器啟動參數強制傳入 `-e PGSSLMODE=verify-full` 與 `-v "${caDir}:/certs:ro"`，完全杜絕無憑證或中間人攻擊連線。

#### 3. DryRun 離線真實性
- **審查證據**：
  在 `run_supabase_backup.ps1` 第 87-96 行：
  在完成 CA 指紋檢查與 Docker client 版本確認後，若偵測到 `$DryRun`，直接輸出驗證參數並 `exit 0`，**位於提示輸入密碼及連線 docker run 之前**，100% 保證不發起任何網路連線。

#### 4. `-MockDumpPath` 潛在混淆風險（SEC-02 / 低度風險）
- **審查證據**：
  目前代碼中若傳入 `-MockDumpPath`，系統會跳過密碼輸入與 pg_dump，直接載入該模擬 dump 進行後續流程。
  **發現之問題**：
  產出的 `backup_info.json` 依然記錄了正式 Supabase 的 `project`、`target_host: aws-0-ap-southeast-2.pooler.supabase.com:5432`，未註明 `"mock_mode": true`。
  若維運人員失誤將含有測試檔案的備份目錄當作正式備份封存，元資料將產生嚴重誤導。

---

### E. 中斷與復原能力靜態分析（Interrupt & Recovery）

| 異常/中斷情境 | 系統行為表現 | 資料安全性狀態 | 殘留影響評估 |
| :--- | :--- | :---: | :--- |
| **pg_dump 過程中斷或網路斷線** | Docker 退出碼非零，PowerShell 自動刪除 incomplete dump 與目錄。 | **安全** | 無殘存損毀檔案。 |
| **加密串流中途磁碟空間不足** | Node.js 觸發 `ENOSPC` 錯誤，`cleanupTemp` 刪除未完成之 `.tmp`。 | **安全** | 原始明文 Dump 完整保留。 |
| **解密迴環驗證 Hash 不符** | 拋出 `INTEGRITY ERROR`，即刻刪除密文與驗證暫存，保留原始明文。 | **安全** | 絕不交付破損的加密備份。 |
| **PowerShell 執行中途 Ctrl+C** | 行程終止，但環境變數可能殘留於當前 Session（SEC-01）。 | **需修正** | 建議補上 `try/finally` 清理。 |
| **Windows PS5.1 編碼相容性** | 腳本若無 UTF-8 BOM，在繁體中文 Windows (CP950) 下中文註解可能破壞引數解析。 | **已修復** | 必須維持 UTF-8 with BOM。 |

---

## 三、重新執行之測試結果彙整

於本次唯讀審查中，重新執行全套測試：

1. **密碼學核心單元測試（`backup-crypto.test.cjs`）**：
   - 執行指令：`node scripts/database/backup-crypto.test.cjs`
   - 結果：**14 / 14 PASS**（Exit Code: 0）。
2. **管線整合測試（`backup-pipeline.test.cjs`）**：
   - 執行指令：`node scripts/database/backup-pipeline.test.cjs`
   - 結果：**10 / 10 PASS**（Exit Code: 0）。
3. **離線 DryRun 驗收（`run_supabase_backup.ps1 -DryRun`）**：
   - 執行指令：`powershell -ExecutionPolicy Bypass -File scripts\database\run_supabase_backup.ps1 -DryRun`
   - 結果：**PASS**（Exit Code: 0，離線安全退出）。

---

## 四、發現的安全弱點與風險等級矩陣

| 編號 | 弱點描述 | 風險等級 | 影響範疇 | 建議修復措施 | 修復必要性 |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **SEC-01** | `run_supabase_backup.ps1` 加密區塊之環境變數設定未包裹於 `try...finally`。若中途異常或中斷，金鑰可能殘留於當前 PowerShell Session。 | **MEDIUM** | 金鑰記憶體生命週期 | 補強 `try { ... } finally { $env:BACKUP_ENCRYPTION_KEY = $null; $activeKey = $null; [GC]::Collect() }`。 | **必須修正** |
| **SEC-02** | `run_supabase_backup.ps1` 使用 `-MockDumpPath` 時，產出的 `backup_info.json` 仍標註為正式 Supabase 來源，缺乏 `mock_mode` 識別。 | **LOW** | 備份元數據真實性 | 於元資料 JSON 中明確加入 `"mock_mode": true` 與 `"source": "MOCK_DUMP"`。 | **必須修正** |
| **SEC-03** | `backup-pipeline.cjs` 中若明文刪除失敗，僅輸出警告並正常結束，PowerShell 記錄之 `plaintext_retained` 可能與實體狀態不一致。 | **LOW** | 審計日誌一致性 | 檢查 Node.js 輸出之 JSON 狀態，精確對齊 `plaintext_retained`。 | 可延後處理 |
| **SEC-04** | Windows PowerShell 5.1 解析無 BOM 的 UTF-8 檔案時，在繁體中文 Windows (CP950) 易產生字元錯位。 | **INFO** | 跨平台執行相容性 | 保持 `.ps1` 檔案具備標準 UTF-8 BOM (`\uFEFF`)。 | 已落實保持 |

---

## 五、修正建議與實作細節

### 1. 必須修正問題（Pre-cutover Must-Fix）

#### 修復 SEC-01：PowerShell 金鑰環境變數清理 `try...finally` 防禦
在 `scripts/database/run_supabase_backup.ps1` 中修訂：
```powershell
# 建議修訂架構：
$env:BACKUP_ENCRYPTION_KEY = $activeKey
try {
    Write-Host "執行串流加密、C2KB 容器封裝與解密迴環驗收..." -ForegroundColor Green
    $nodeProc = Start-Process -FilePath "node" -ArgumentList $pipelineArgs -Wait -Passthru -NoNewWindow
} finally {
    # 確保無論是 Ctrl+C、例外拋出或正常結束，皆 100% 抹除金鑰
    $env:BACKUP_ENCRYPTION_KEY = $null
    $activeKey = $null
    [System.GC]::Collect()
}
```

#### 修復 SEC-02：Mock 備份元數據明確標註
在 `scripts/database/run_supabase_backup.ps1` 中修訂：
```powershell
if ($MockDumpPath) {
    $metaInfo.mock_mode = $true
    $metaInfo.source = "SYNTHETIC_MOCK_DUMP: $MockDumpPath"
} else {
    $metaInfo.mock_mode = $false
    $metaInfo.source = "SUPABASE_PRODUCTION_DATABASE"
}
```

### 2. 可以延後處理問題（Post-Cutover Technical Debt）
- 將 `backup-pipeline.cjs` 的 `fs.statSync` 升級為 `fs.lstatSync`，增加對 Symlink 的顯式拒絕。
- 當明文刪除遭遇權限錯誤時，考慮以非零狀態碼退出以提醒操作人員手動介入。

---

## 六、Git 分支、HEAD 與工作目錄狀態

- **Git 分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **使用者未提交檔案**：`新增 文字文件.txt`、`1.docx`、`照片/` **100% 完整保留，未受任何觸碰**。
- **零寫入保證確認**：
  - **本階段為 100% 唯讀審查，未修改任何程式碼或設定。**
  - **未連線 Supabase 正式雲端資料庫。**
  - **未產生正式生產金鑰。**
  - **未執行 git commit / push / reset / clean。**

---

## 七、最終審查判定與下一階段就緒度評估

> ### **審查判定結論：【PARTIAL PASS / 條件式通過】**
> 
> **理由**：
> 1. 加密演算法（AES-256-GCM）、C2KB 二進位封裝、解密迴環驗收（Round-Trip Verification）、以及原子更名機制**設計優秀且經全套測試驗證通過**。
> 2. 存在一項中度安全細節（SEC-01：PowerShell 金鑰環境變數清理需加入 `try...finally`）與一項低度元數據標註問題（SEC-02：Mock 標註）。
> 3. **修復建議**：此兩項為純粹本機防呆優化，修訂程式碼後即可直接推進至 **Phase 3-B 正式主金鑰建立** 與 **Phase 4 雲端備份前置階段**。

---
*(報告完畢，停止操作，等待專案負責人確認)*
