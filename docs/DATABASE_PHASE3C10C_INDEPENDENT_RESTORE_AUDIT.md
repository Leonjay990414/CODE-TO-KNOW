# CODE TO KNOW｜Phase 3-C-10C：PG17 還原腳本獨立安全性複核報告
# PowerShell 沙盒還原腳本與 18 大離線測試之第三方獨立資安稽核

**文件編號**：C2K-DOC-DB-PHASE3C10C-INDEPENDENT-AUDIT-01  
**稽核日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA / 應用安全架構師 (AppSec) / DevSecOps 獨立稽核員  
**審查性質**：100% 唯讀獨立技術稽核（零修改程式碼、零雲端連線、零正式資料庫操作、零金鑰讀取）  
**審查結論判定**：**PASS（所有關鍵安全項目均有充分證據證明，具備執行正式還原驗收資格）**

---

## 執行摘要（Executive Summary）

本報告針對 Phase 3-C-10B 所產出之主還原腳本 [`scripts/database/restore_pg17_sandbox.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 與其自動化測試套件 [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) 進行嚴格的獨立唯讀安全性複核。

經全面審查，確認：
1. **測試有效性**：TC-01 至 TC-18 全數以獨立子程序執行，真實檢驗退出代碼（ExitCode 0, 1, 2）與關鍵錯誤特徵，無過度 Mock 或放寬斷言之情事。
2. **命令錯誤攔截**：Docker、Node、`psql`、`pg_restore` 均已落實 `$LASTEXITCODE` 即時檢查，且 `pg_restore` 嚴格要求 ExitCode 0。
3. **資料庫防覆寫**：目標資料庫預檢存在即中止，建立失敗即中止，中途失敗明確標註未完成狀態，不刪除既有資料庫。
4. **備份與金鑰防護**：原始 `.dump` 與 `.c2kb` 具備路徑隔離與刪除保護防呆，金鑰環境變數 100% 精準復原（SEC-01），清理失敗回報 ExitCode 2 並發出明文外洩告警。
5. **結構完整性斷言**：37 表、47 外鍵、133 索引、0 未驗證約束、2 遷移紀錄均以程式化整數比對，外鍵語意精確無誤。

---

## 一、AUDIT-01：18 項離線測試逐項審查結果

稽核團隊逐項檢視 TC-01 至 TC-18 之測試實作與斷言強度：

| 測試編號 | 測試情境與目標 | 測試實作方式 | 退出代碼檢驗 | 輸出斷言檢驗 | 稽核判定 |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **TC-01** | 所有必要命令成功 (Happy Path) | `-MockScenario AllSuccess` 全流程執行模擬 | 斷言 `ExitCode -eq 0` | 斷言包含 `Phase 3-C-10 還原驗收【PASS】` | **PASS** |
| **TC-02** | Node 解密失敗 (AuthTag 錯誤) | `-MockScenario NodeDecryptFail` 拋出解密例外 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `AES-256-GCM 認證解密失敗` | **PASS** |
| **TC-03** | Docker 命令失敗 (容器未運行) | `-MockScenario DockerCheckFail` 拋出 Docker 例外 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `沙盒容器.*未處於運行中狀態` | **PASS** |
| **TC-04** | `pg_restore` 回傳 ExitCode 1 (FIX-01) | `-MockScenario PgRestoreExit1` 模擬還原警告退出 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `ExitCode 為 1` 致命報錯 | **PASS** |
| **TC-05** | `pg_restore` 回傳 ExitCode 2 (致命錯誤) | `-MockScenario PgRestoreExit2` 模擬致命還原中斷 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `ExitCode 為 2` 報錯 | **PASS** |
| **TC-06** | SQL 稽核查詢失敗 (輸出格式異常) | `-MockScenario SqlAuditFormatFail` 回傳損毀字串 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `SQL 稽核輸出格式異常` | **PASS** |
| **TC-07** | 資料表數量不符 (實際 35，預期 37) | `-MockScenario TableCountMismatch` 回傳 35 表 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `public 資料表數量不符` | **PASS** |
| **TC-08** | 外鍵數量不符 (實際 45，預期 47) | `-MockScenario FkCountMismatch` 回傳 45 外鍵 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `外鍵約束數量不符` | **PASS** |
| **TC-09** | 索引數量不符 (實際 130，預期 133) | `-MockScenario IndexCountMismatch` 回傳 130 索引 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `索引總數不符` | **PASS** |
| **TC-10** | 未驗證外鍵不為 0 (實際 1，預期 0) | `-MockScenario UnvalFkMismatch` 回傳 1 未驗證 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `未生效或未驗證之外鍵約束` | **PASS** |
| **TC-11** | Prisma 遷移紀錄不符 (實際 1，預期 2) | `-MockScenario MigrationCountMismatch` 回傳 1 筆 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `Prisma 遷移紀錄數量不符` | **PASS** |
| **TC-12** | 原本存在的環境變數正確復原 (SEC-01) | 預設 `ORIGINAL_PRESERVED_ENV_KEY_12345` 執行 | 檢查子程序結束後值 | 斷言環境變數精準還原為預設原值 | **PASS** |
| **TC-13** | 原本不存在的環境變數正確清除 (SEC-01) | 預設 `$null` 執行主腳本 | 檢查子程序結束後值 | 斷言環境變數重設為空 (`[string]::IsNullOrEmpty`) | **PASS** |
| **TC-14** | 目標資料庫已存在時安全中止 (防覆寫) | `-MockScenario DbExistsAbort` 回傳資料庫已存在 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `目標資料庫.*已存在` 報錯 | **PASS** |
| **TC-15** | 本機暫存檔清理失敗 (FIX-05) | `-MockScenario LocalCleanupFail` 模擬刪除 EPERM | 斷言 `ExitCode -eq 2` | 斷言絕無 PASS，且含 `PARTIAL PASS (CLEANUP WARNING)` | **PASS** |
| **TC-16** | 容器暫存檔清理失敗 (FIX-05) | `-MockScenario ContainerCleanupFail` 模擬 rm 失敗 | 斷言 `ExitCode -eq 2` | 斷言絕無 PASS，且含 `沙盒容器暫存檔清理失敗` | **PASS** |
| **TC-17** | 解密失敗時不誤刪原始備份 (FIX-04) | 觸發解密失敗後檢查實體磁碟檔案 | 實體檢驗 `Test-Path` | 斷言原始 `.c2kb` 與 `.dump` 均 100% 存在 | **PASS** |
| **TC-18** | 雜湊比對不符時終止 (全情境保證) | `-MockScenario HashMismatch` 模擬雜湊損毀 | 斷言 `ExitCode -eq 1` | 斷言絕無 PASS，且含 `解密資料雜湊與指定原始 SHA-256 不符` | **PASS** |

---

## 二、測試修改前後差異剖析與初始失敗原因說明

在 Phase 3-C-10B 開發測試過程中，測試套件曾出現過失敗記錄，稽核團隊對其原因與修復進行審查：

### 1. 失敗原因 A（TC-01 至 TC-18 跨程序傳參失敗）：
- **現象**：初始測試執行時，拋出 `Cannot process argument transformation on parameter 'MockHooks'`。
- **根本原因**：測試腳本初期嘗試透過 `powershell.exe -File script.ps1 -MockHooks $hashtable` 將包含 ScriptBlock 之記憶體 Hashtable 傳遞給新進程。PowerShell CLI 引數傳遞機制以純字串解析，無法將字串反序列化為 ScriptBlock Hashtable。
- **修復方案**：將受測腳本重構為支援 `-MockScenario <string>` 之離線情境旗標（如 `AllSuccess`、`PgRestoreExit1`、`TableCountMismatch` 等），並在測試端改採 `System.Diagnostics.ProcessStartInfo` 啟動乾淨的獨立 PowerShell 子進程。此修正使測試符合真實 CLI 呼叫標準，徹底解決了進程邊界綁定問題。

### 2. 失敗原因 B（TC-12 與 TC-13 環境變數斷言誤判）：
- **現象**：TC-12 與 TC-13 回報環境變數數值不符。
- **根本原因**：受測腳本使用 `Write-Host` 輸出執行進度橫幅，`Write-Host` 直接寫入宿主資訊流（Host Information Stream），不受 `| Out-Null` 抑制。測試腳本使用 `$out = $proc.StandardOutput.ReadToEnd()` 讀取時，同時捕獲了橫幅輸出與尾端 `Write-Output` 的環境變數值。原測試以全文字串比對，導致斷言失敗。
- **修復方案**：測試端精確解析標準輸出的最後一行（`$lines[-1].Trim()`），精準核對環境變數還原值。

### 3. 是否存在過度 Mock 或放寬斷言之審查：
- **查核結論**：**不存在任何放寬斷言或過度 Mock**。
  - 核心斷言邏輯（如 `actualTables -eq 37`、`actualFks -eq 47`、`ExitCode -eq 0`、`pg_restore ExitCode 1 必須判定失敗`）完全保持嚴格標準。
  - Mock 僅模擬外部依賴（Docker 容器與 Node OpenSSL），未短路腳本內部的條件判斷、正則驗證、數值解析或清理邏輯。

---

## 三、還原腳本安全防護項目稽核（AUDIT-02 ~ AUDIT-05）

### 3.1 AUDIT-02：原生命令錯誤處理 ($LASTEXITCODE)
稽核代碼逐行確認：
- **`node` 解密命令**（Line 159-162）：呼叫後立即檢查 `$LASTEXITCODE -ne 0`，遇錯立即丟擲 `[DECRYPT FAILED]`。
- **`docker inspect` 容器檢查**（Line 120-123）：檢查 `$LASTEXITCODE -ne 0 -or $containerStatus -ne "true"`，未運行立即中斷。
- **`psql` 資料庫預檢**（Line 131-134）：檢查 `$LASTEXITCODE -ne 0`，連線失敗立即中斷。
- **`psql` 建立資料庫**（Line 197-200）：檢查 `$LASTEXITCODE -ne 0`，建立失敗立即中斷。
- **`docker cp` 複製檔案**（Line 211-214）：檢查 `$LASTEXITCODE -ne 0`，傳輸失敗立即中斷。
- **`pg_restore` 原生還原**（Line 226-234）：
  - 擷取 `$pgRestoreExitCode = $LASTEXITCODE`。
  - 執行強制斷言：`if ($pgRestoreExitCode -ne 0) throw [PG_RESTORE FAILED]`。
  - **確認嚴格禁止 ExitCode 1 與 ExitCode 2**。
- **`psql` 指標稽核**（Line 266-269）：檢查 `$LASTEXITCODE -ne 0`，查詢失敗立即中斷。

### 3.2 AUDIT-03：資料庫安全與防覆寫機制
- **目標庫預檢**（Line 139-141）：查詢 `pg_database WHERE datname = '$TargetDatabase'`，若回傳 `1` 立即丟擲 `[ABORT: DB EXISTS]`，完全不觸碰任何既有檔案或資料庫。
- **部分還原狀態標記 (FIX-06)**（Line 370-377）：
  - 腳本追蹤 `$dbCreatedByThisRun`。若資料庫由本次建立但未達驗收標準，輸出高風險警告，明確標註其為**半成品資料庫，嚴禁誤認為通過**。
- **零 DROP 策略**：腳本全文零 `DROP DATABASE` 指令，既有測試庫（如 `code_to_know_cloud_restore_test`）絕對不被刪除。
- **角色權限精確匹配**：
  - 沙盒內實際角色：`postgres` (Superuser)、`codetoknow_restore` (LOGIN, 無 CREATEDB)。
  - 腳本以 `postgres` 發起 `CREATE DATABASE ... OWNER codetoknow_restore;`，完全符合最小權限與沙盒實際角色設計。

### 3.3 AUDIT-04：備份與金鑰安全防護
- **正式備份零覆寫/零刪除防呆**（Line 111-114、Line 348-351）：
  - 嚴格比對 `$decDump` 絕對路徑，若與 `$OriginalDumpPath` 或 `$EncryptedBackupPath` 相同，立即拋出嚴重安全保護阻斷。
- **暫存檔防碰撞**（Line 108-110）：解密前若暫存檔預先存在，立即拋錯終止。
- **金鑰隱蔽性**：
  - 互動輸入全程遮罩 (`Read-Host -AsSecureString`)。
  - BSTR 記憶體透過 `Marshal::ZeroFreeBSTR` 物理清零。
  - 金鑰僅透過進程環境變數傳遞，**日誌、終端機與錯誤訊息中 100% 不含金鑰字串**。
- **環境變數精準復原 (SEC-01)**（Line 394-402）：
  - `finally` 區塊依執行前之 `$origKeyEnvExists` 狀態，精準復原為原值或清理為 `$null`。
- **清理失敗告警 (FIX-05)**（Line 422-427）：
  - 若容器暫存檔或本地解密暫存檔任一未刪除成功，腳本**絕對不輸出 PASS**，改回報 `ExitCode 2`（PARTIAL PASS / CLEANUP WARNING）並輸出機敏明文未清理告警。

### 3.4 AUDIT-05：驗收指標真實性與語意精確性
- **程式化數值解析**（Line 272-308）：
  - 格式驗證：正則表達式 `^\d+\|\d+\|\d+\|\d+\|\d+$` 杜絕欄位短缺或損毀。
  - 逐項程式化整數比對：
    - 資料表：實際值必須 `-eq 37`
    - 外鍵：實際值必須 `-eq 47`
    - 索引：實際值必須 `-eq 133`
    - 未驗證外鍵：實際值必須 `-eq 0`
    - Prisma 遷移記錄：實際值必須 `-eq 2`
  - 任一項不符立即丟擲 `[VERIFICATION FAILED]`，終止流程。
- **語意精確性 (SEM-01)**：
  - 指標名稱正式定名為「未驗證外鍵約束數 (`unvalidated_fks`)」，精確對應 `NOT convalidated` 之資料目錄語意，**未錯誤聲稱為「不存在孤立資料」**。

---

## 四、尚未解決之殘留風險與限制分析

| 風險項目 | 風險等級 | 評估說明與後續因應措施 |
| :--- | :---: | :--- |
| **Windows 記憶體分頁殘留** | **極低 (殘留限制)** | .NET 垃圾回收器 (`[GC]::Collect()`) 負責回收 Managed String 物件，但作業系統分頁機制無法保證實體 RAM 立即被物理覆寫。此為 Windows/.NET 平台架構本質限制，腳本已在流程結束後即刻清空指標與 BSTR 緩衝區，符合業界實務標準。 |
| **沙盒容器手動停止** | **低 (環境限制)** | 若操作人員在還原執行前手動關閉 Docker 容器，腳本會由 Line 121 捕捉並安全中止（ExitCode 1），不會造成資料損壞。 |
| **磁碟空間耗盡** | **極低 (已確認)** | 前置查核確認本機主機具備逾 600 GB 可用空間，容器內部磁區具備 952 GB 可用空間，而備份還原所需空間小於 50 MB，空間風險為零。 |

---

## 五、Git 分支、HEAD 與工作區狀態

- **Git 分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **工作區狀態**：
  - 使用者既有檔案（`frontend/`、`新增 文字文件.txt`、`1.docx`、`照片/`）保持原樣，**未受任何觸碰**。
  - 專案既有程式碼保持原樣，未執行任何未授權之寫入操作。
  - 本次僅新增本複核報告：[`docs/DATABASE_PHASE3C10C_INDEPENDENT_RESTORE_AUDIT.md`](file:///C:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C10C_INDEPENDENT_RESTORE_AUDIT.md)。
- **授權合規保證**：未執行任何 `git add`、`commit`、`push`、`reset`、`clean` 或 `stash` 操作。

---

## 六、超出授權範圍查核（Zero Out-of-Scope Operations）

- [x] 100% 遵守唯讀限制，未修改任何代碼或測試。
- [x] 未執行正式備份解密。
- [x] 未執行 `pg_restore`。
- [x] 未建立、修改或刪除任何資料庫。
- [x] 未連線 Supabase 正式雲端資料庫。
- [x] 未讀取 KeePassXC 或任何正式金鑰。
- [x] 未修改 `.env`。
- [x] 未修改 Render 設定或部署。
- [x] 未刪除、移動或覆寫任何使用者個人檔案。

---

## 七、獨立複核最終判定

**最終判定**：**PASS**

**判定理由**：  
所有 18 項測試均為真實有效的行為檢驗，原版腳本之六大安全缺陷（FIX-01 至 FIX-06）已於 [`restore_pg17_sandbox.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 中 100% 獲得妥善解決，原生命令錯誤攔截、防覆寫阻斷、環境變數復原與程式化完整性斷言均具備完整測試覆蓋與佐證。專案已完全具備安全執行正式 PG17 還原驗收之條件。

---
*(報告完畢，依規範立即停止操作，等待專案負責人下達後續執行指令)*
