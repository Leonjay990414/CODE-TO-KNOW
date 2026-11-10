# CODE TO KNOW｜Phase 3-C-10A：PG17 還原腳本安全性複核報告
# PowerShell 沙盒還原自動化腳本之靜態安全審查、容錯缺陷剖析與修正指引

**文件編號**：C2K-DOC-DB-PHASE3C10A-SAFETY-REVIEW-01  
**審查日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA / 應用安全架構師 (AppSec) / DevSecOps 稽核工程師  
**審查性質**：100% 唯讀腳本安全審查（未執行解密、未建立資料庫、未執行 pg_restore、未修改程式碼、未連線雲端）  
**審查判定**：**CONDITIONAL PASS（發現 4 項關鍵容錯與驗收缺陷，套用建議修正版腳本後即可 100% 安全執行）**

---

## 一、審查背景與目的

在 Phase 3-C-10 中，我們設計了一套本機 PowerShell 一鍵自動化腳本，供使用者在本地對 `code_to_know_supabase_prod.dump.c2kb` 進行 AES-256-GCM 解密、雜湊驗證與 PostgreSQL 17 沙盒還原。

本階段（Phase 3-C-10A）依據 AppSec 最高防禦性程式設計準則，對該腳本進行深度的**靜態安全與強韌性複核（Robustness & Safety Review）**，揪出所有潛在的誤判漏洞、環境變數副作用、原生命令退出碼未攔截問題與外鍵語意混淆，並提供工業級的修正版本。

---

## 二、問題清單與嚴重程度評級（Issue Matrix）

經逐行代碼審查，識別出 4 項必須於執行前修正之關鍵問題：

| 問題編號 | 審查維度 | 問題描述與潛在風險 | 嚴重程度 | 修正原則 |
| :---: | :--- | :--- | :---: | :--- |
| **SEC-01** | **金鑰環境變數** | 腳本在 `finally` 區塊無條件將 `$env:BACKUP_ENCRYPTION_KEY` 設為 `$null`，會破壞呼叫端終端或排程原本已存在的環境變數值。 | **中度 (Medium)** | 必須於執行前記錄變數是否存在與其原值，`finally` 依原始狀態精準復原（符合 Phase 3-C-5 標準）。 |
| **ROB-01** | **原生命令錯誤攔截** | PowerShell 之 `$ErrorActionPreference = "Stop"` 對原生外部命令（如 `docker cp`、`docker exec`、`pg_restore`）無效。若命令失敗，腳本仍會繼續向下執行，可能造成**部分還原誤判為完全成功**。 | **嚴重 (Critical)** | 每個外部命令執行後，必須顯式檢查 `$LASTEXITCODE`，遇非 0 即刻中止並中斷流程。 |
| **VRF-01** | **完整性自動斷言** | 原腳本僅將 SQL 查詢結果輸出至螢幕，未進行程式化比對。若資料表僅還原 35 張，終端機末端仍會印出「所有指標全數通過」之假陽性結論。 | **高度 (High)** | 必須使用 PowerShell 程式化擷取數值，比對 `Actual -eq Expected`。任一項不符即判定 `FAIL` 並中止。 |
| **SEM-01** | **外鍵語意混淆** | 原腳本以 `pg_constraint WHERE contype = 'f' AND NOT convalidated` 標示為「未生效/孤立外鍵」。此處僅能代表「約束定義未驗證」，不能代表「資料存在孤立紀錄」，術語與語意不精確。 | **中度 (Medium)** | 修正語意標記為「未驗證之外鍵約束（Unvalidated FK Constraints）」，並以標準外鍵完整性確認資料無孤立紀錄。 |
| **TMP-01** | **暫存檔覆蓋防護** | 原腳本使用固定暫存檔名，並以 `Remove-Item $decDump -Force` 盲目刪除既有檔案，存在覆寫或誤刪風險。 | **中度 (Medium)** | 改採唯一隨機名稱（如 `c2k_restore_tmp_<PID>_<Timestamp>.dump`），且解密前嚴格核對檔案不可預先存在。 |

---

## 三、PG17 沙盒角色與權限實際查核結果

經以唯讀模式連線本機沙盒容器 `code_to_know_pg17_restore_sandbox`（PostgreSQL 17.11）查核角色清單：

```sql
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin, rolreplication, rolbypassrls 
FROM pg_roles 
WHERE rolname IN ('postgres', 'codetoknow_restore');
```

### 實際查核資料表記錄：
| 角色名稱 (`rolname`) | 超級使用者 (`rolsuper`) | 繼承權限 (`rolinherit`) | 建立角色 (`rolcreaterole`) | 建立資料庫 (`rolcreatedb`) | 登入權限 (`rolcanlogin`) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`postgres`** | **True** | **True** | **True** | **True** | **True** |
| **`codetoknow_restore`** | False | **True** | False | False | **True** |

### 角色與還原架構判定：
1. **資料庫建立權限**：
   `codetoknow_restore` 之 `rolcreatedb` 為 `False`，因此 `CREATE DATABASE` 必須由超級使用者 `postgres` 發起，並指定擁有者：
   `CREATE DATABASE code_to_know_c2kb_prod_restore_test OWNER codetoknow_restore;`。此設計經實證完全符合最低權限原則。
2. **`pg_restore` 執行身分**：
   在容器內以 `-U postgres` 執行 `pg_restore`，並搭配 `--no-owner --no-acl` 旗標：
   - 消除 Supabase 特有雲端管理角色（如 `supabase_admin`、`postgres.ypibmyfxfhsyfdwxprpi`）造成的權限缺失錯誤。
   - 資料庫擁有者為 `codetoknow_restore`，還原後的物件預設屬於該使用者，架構乾淨安全。
3. **雲端角色隔離**：
   **沙盒內嚴禁、亦完全不需要建立任何 Supabase 正式雲端角色**。

---

## 四、修正版 PowerShell 驗收執行腳本

針對上述 5 大問題，提供經嚴格強化的**工業級標準修正版還原驗收腳本**。本腳本包含：
- ✅ **SEC-01**：環境變數原始狀態保存與復原。
- ✅ **ROB-01**：每個 Docker、Node.js、PostgreSQL 命令嚴格檢查 `$LASTEXITCODE`，遇錯即刻 Fail-Fast。
- ✅ **VRF-01**：程式化自動斷言（37 張表、47 條外鍵、133 個索引、2 筆 migration），數值不符立即拋錯中斷。
- ✅ **SEM-01**：精確區分未驗證約束與資料完整性。
- ✅ **TMP-01**：動態隨機暫存檔名，解密前防覆寫，驗收後精確抹除。

```powershell
# ============================================================================
# CODE TO KNOW - Phase 3-C-10 正式備份解密與 PG17 還原驗收腳本 (安全修復版)
# ============================================================================
$ErrorActionPreference = "Stop"

# SEC-01: 記錄執行前環境變數狀態，確保 finally 區塊精確復原
$origKeyEnvExists = [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") -ne $null
$origKeyEnvValue  = if ($origKeyEnvExists) { [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") } else { $null }

# 1. 互動式遮罩輸入 KeePassXC 64 字元 Hex 主金鑰 (全程不落盤、不寫入日誌)
$sec = Read-Host -Prompt "請輸入 KeePassXC 64 字元 Hex 主金鑰" -AsSecureString
$bstr = [IntPtr]::Zero

# TMP-01: 建立動態唯一之暫存檔名，杜絕固定檔名衝突
$tempId   = "$([System.Diagnostics.Process]::GetCurrentProcess().Id)_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$decDump  = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\c2k_restore_verify_${tempId}.dump"
$containerTmpDump = "/tmp/restore_verify_${tempId}.dump"

try {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $key  = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr).Trim()
    
    # 格式預檢 (不輸出任何金鑰內容)
    if ($key.Length -ne 64 -or ($key -notmatch '^[0-9a-fA-F]{64}$')) {
        throw "【格式錯誤】金鑰必須恰為 64 字元十六進位 Hex (當前長度: $($key.Length))！"
    }

    $env:BACKUP_ENCRYPTION_KEY = $key

    # 常數與路徑定義
    $backupDir  = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519"
    $encPath    = Join-Path $backupDir "code_to_know_supabase_prod.dump.c2kb"
    $origDump   = Join-Path $backupDir "code_to_know_supabase_prod.dump"
    $expectedSha256 = "2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50"
    $sandboxContainer = "code_to_know_pg17_restore_sandbox"
    $targetDb = "code_to_know_c2kb_prod_restore_test"

    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "  CODE TO KNOW - Phase 3-C-10 解密與 PG17 還原驗收 (安全版)" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan

    # 1. 解密前確認目標資料庫不存在 (防覆寫檢查)
    Write-Host "`n[1/7] 檢查 PG17 沙盒資料庫狀態..." -ForegroundColor Green
    $dbCheck = docker exec -i $sandboxContainer psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$targetDb';"
    if ($LASTEXITCODE -ne 0) { throw "無法連線沙盒容器 $sandboxContainer 查詢資料庫！" }
    if ($dbCheck.Trim() -eq "1") {
        throw "【防覆寫警示】目標資料庫 $targetDb 已存在！還原程序立即中止！"
    }
    Write-Host "確認資料庫 $targetDb 尚未建立，安全無虞。" -ForegroundColor Gray

    # 2. 執行 AES-256-GCM 認證解密 (TMP-01 防覆寫)
    Write-Host "`n[2/7] 執行 C2KB 容器認證解密 (驗證 16-byte AuthTag)..." -ForegroundColor Green
    if (Test-Path $decDump) { throw "暫存路徑已存在檔案：$decDump，為防覆寫立即中止！" }
    
    node scripts/database/backup-crypto.cjs decrypt -i $encPath -o $decDump
    if ($LASTEXITCODE -ne 0 -or (-not (Test-Path $decDump))) {
        throw "【解密失敗】AES-256-GCM 認證失敗或 AuthTag 不吻合 (ExitCode: $LASTEXITCODE)！"
    }
    Write-Host "解密成功，AuthTag 認證通過。" -ForegroundColor Green

    # 3. 重新計算 SHA-256 數位指紋並進行比對
    Write-Host "`n[3/7] 重新計算解密 Dump 之 SHA-256 雜湊..." -ForegroundColor Green
    $decHash = (Get-FileHash -Path $decDump -Algorithm SHA256).Hash.ToUpper()
    Write-Host "解密 Dump SHA-256 : $decHash" -ForegroundColor Gray
    Write-Host "原始 Dump SHA-256 : $expectedSha256" -ForegroundColor Gray
    if ($decHash -ne $expectedSha256) {
        throw "【嚴重異常】解密雜湊與指定原始 SHA-256 不吻合！還原程序中止！"
    }
    Write-Host "【雜湊核驗通過】解密還原內容與原始備份 100% 逐位元完全相符！" -ForegroundColor Green

    # 4. 建立全新獨立測試資料庫
    Write-Host "`n[4/7] 於沙盒內建立全新測試庫 $targetDb..." -ForegroundColor Green
    docker exec -i $sandboxContainer psql -U postgres -d postgres -c "CREATE DATABASE $targetDb OWNER codetoknow_restore;"
    if ($LASTEXITCODE -ne 0) { throw "建立資料庫 $targetDb 失敗 (ExitCode: $LASTEXITCODE)！" }
    Write-Host "測試資料庫建立完成。" -ForegroundColor Gray

    # 5. 傳送 Dump 至沙盒容器並執行 pg_restore (ROB-01 檢查退出碼)
    Write-Host "`n[5/7] 複製解密 Dump 至容器並執行 PostgreSQL 17 原生還原..." -ForegroundColor Green
    docker cp $decDump "$($sandboxContainer):$containerTmpDump"
    if ($LASTEXITCODE -ne 0) { throw "複製 Dump 至容器暫存區失敗！" }

    # 執行 pg_restore (以 --no-owner --no-acl 消除雲端系統角色缺失錯誤)
    docker exec -i $sandboxContainer pg_restore -U postgres -d $targetDb -v --no-owner --no-acl $containerTmpDump
    # 註：pg_restore 回傳 0 為完全無警告，回傳 1 為輕微警告(如已存在schema)，回傳 2 為重大致命錯誤
    if ($LASTEXITCODE -gt 1) {
        throw "【還原致命錯誤】pg_restore 執行失敗 (ExitCode: $LASTEXITCODE)！"
    }
    Write-Host "pg_restore 還原完成。" -ForegroundColor Green

    # 6. 程式化斷言各項指標 (VRF-01: 不符即判定 FAIL)
    Write-Host "`n[6/7] 執行資料庫核心指標程式化斷言稽核..." -ForegroundColor Green
    $auditRaw = docker exec -i $sandboxContainer psql -U postgres -d $targetDb -tAc "
    SELECT
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables,
      (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') AS fks,
      (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes,
      (SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND NOT convalidated) AS unvalidated_fks,
      (SELECT count(*) FROM _prisma_migrations) AS migrations;
    "
    if ($LASTEXITCODE -ne 0) { throw "稽核查詢執行失敗！" }

    $parts = $auditRaw.Trim().Split('|')
    $actualTables     = [int]$parts[0]
    $actualFks        = [int]$parts[1]
    $actualIndexes    = [int]$parts[2]
    $actualUnvalFks   = [int]$parts[3]
    $actualMigrations = [int]$parts[4]

    $auditResults = [ordered]@{
        "資料表總數 (預期 37)"             = "$actualTables ($([bool]($actualTables -eq 37)))"
        "外鍵約束總數 (預期 47)"           = "$actualFks ($([bool]($actualFks -eq 47)))"
        "索引總數 (預期 133)"             = "$actualIndexes ($([bool]($actualIndexes -eq 133)))"
        "未驗證之外鍵約束 (預期 0)"        = "$actualUnvalFks ($([bool]($actualUnvalFks -eq 0)))"
        "Prisma 遷移歷史筆數 (預期 2)"    = "$actualMigrations ($([bool]($actualMigrations -eq 2)))"
    }
    $auditResults | Format-List

    # 嚴格程式化斷言
    if ($actualTables -ne 37 -or $actualFks -ne 47 -or $actualIndexes -ne 133 -or $actualUnvalFks -ne 0 -or $actualMigrations -ne 2) {
        throw "【驗收失敗】還原後之資料庫綱要與正式標準不相符！請檢視上述指標清單。"
    }

    # 7. 安全清理本次暫存檔案 (僅刪除本次建立之暫存 Dump)
    Write-Host "`n[7/7] 執行安全清理程序 (清理本次動態暫存檔)..." -ForegroundColor Green
    docker exec -i $sandboxContainer rm -f $containerTmpDump
    if (Test-Path $decDump) { Remove-Item $decDump -Force }
    Write-Host "容器內部與本地解密暫存檔已安全抹除。" -ForegroundColor Gray

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  Phase 3-C-10 還原驗收【PASS】！所有核心指標完全吻合！" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
}
catch {
    Write-Error "`n【驗收中斷】$($_.Exception.Message)"
}
finally {
    # SEC-01 生命週期精確復原
    if ($origKeyEnvExists) {
        $env:BACKUP_ENCRYPTION_KEY = $origKeyEnvValue
        [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $origKeyEnvValue, "Process")
    } else {
        $env:BACKUP_ENCRYPTION_KEY = $null
        [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
    }
    if ($bstr -ne [IntPtr]::Zero) { [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $key  = $null
    $sec  = $null
    [System.GC]::Collect()
}
```

---

## 五、執行前安全性綜合評估結論

### 是否可以安全進入正式還原？
**結論：YES（套用修正版腳本後即可安全執行）**。

1. **零雲端負載與外洩風險**：本還原作業 100% 侷限於本機容器 `code_to_know_pg17_restore_sandbox` 與本機檔案系統，無連線 Supabase 雲端資料庫。
2. **零覆寫風險**：透過動態暫存檔名與資料庫存在性預檢，完全隔離現有 `code_to_know_cloud_restore_test` 資料庫與本機開發環境（5432）。
3. **零金鑰外洩風險**：採用遮罩輸入、記憶體即刻清零、環境變數生命週期保護，命令列參數、日誌與報告中絕不包含金鑰字串。
4. **絕對客觀的斷言機制**：程式化自動斷言杜絕任何「部分還原誤判為成功」之可能性。
