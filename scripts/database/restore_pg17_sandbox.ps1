<#
.SYNOPSIS
    CODE TO KNOW - 正式 Supabase PostgreSQL 17 C2KB 加密備份解密與沙盒還原驗收腳本
.DESCRIPTION
    本腳本負責執行 Phase 3-C-10 之正式備份驗收作業：
    1. 透過遮罩輸入取得 AES-256-GCM 64 字元 Hex 主金鑰。
    2. 驗證 C2KB 容器二進位格式與 16-byte GCM AuthTag 認證解密。
    3. 比對解密 Dump 與指定原始明文 Dump 之 SHA-256 數位指紋 (全字元完全相符)。
    4. 於獨立 PG17 沙盒 (code_to_know_pg17_restore_sandbox) 建立全新獨立測試資料庫。
    5. 透過原生 pg_restore (--no-owner --no-acl) 執行還原，嚴格檢查退出碼為 0。
    6. 程式化斷言五大核心結構指標 (37 表、47 外鍵、133 索引、0 未驗證約束、2 遷移紀錄)。
    7. 獨立執行容器內部與本地暫存檔清理，並依 SEC-01 精確復原環境變數。

    安全防護規範：
    - SEC-01: 環境變數生命週期精準復原，不破壞呼叫端既有變數。
    - ROB-01: 所有原生外部命令 (Docker, Node, pg_restore, psql) 均嚴格檢查 $LASTEXITCODE。
    - VRF-01: 完整性程式化斷言，任何指標不符立即報錯中斷，絕不將部分還原誤判為 PASS。
    - SEM-01: 明確區分未驗證外鍵約束與孤立資料。
    - TMP-01: 動態隨機唯一暫存檔名，解密前防覆寫，失敗時保留原始備份。
    - FIX-05: 分別檢查本地與容器清理結果，清理失敗回報非 0 退出碼並警示機敏風險。
    - FIX-06: 失敗時明確標註部分還原資料庫狀態，絕不自動誤刪既有資料庫。
#>

[CmdletBinding()]
param (
    [string]$EncryptedBackupPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb",
    [string]$OriginalDumpPath    = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump",
    [string]$ExpectedSha256      = "2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50",
    [string]$SandboxContainer    = "code_to_know_pg17_restore_sandbox",
    [string]$TargetDatabase      = "code_to_know_c2kb_prod_restore_test",
    [string]$EncryptionKey       = $null,
    [switch]$NonInteractive,
    [string]$MockScenario        = "None"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# SEC-01: 記錄執行前環境變數狀態，確保 finally 區塊精確復原
$origKeyEnvExists = [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") -ne $null
$origKeyEnvValue  = if ($origKeyEnvExists) { [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") } else { $null }

$bstr = [IntPtr]::Zero
$activeKey = $EncryptionKey
$dbCreatedByThisRun = $false
$containerDumpCopied = $false
$verificationPassed = $false
$cleanupSucceeded = $true

# TMP-01: 建立動態唯一隨機名稱，杜絕固定檔名衝突
$tempId = "$([System.Diagnostics.Process]::GetCurrentProcess().Id)_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())_$([System.IO.Path]::GetRandomFileName().Substring(0,6))"
$backupDir = if (Test-Path $EncryptedBackupPath) { [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($EncryptedBackupPath)) } else { [System.IO.Path]::GetTempPath() }
$decDump = Join-Path $backupDir "c2k_restore_verify_${tempId}.dump"
$containerTmpDump = "/tmp/restore_verify_${tempId}.dump"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CODE TO KNOW - Supabase C2KB 備份解密與 PG17 還原驗收" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

try {
    # -------------------------------------------------------------------------
    # 步驟 1: 取得並驗證 AES-256 主金鑰 (全程不落盤、不寫入日誌)
    # -------------------------------------------------------------------------
    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        if ($origKeyEnvExists -and -not [string]::IsNullOrWhiteSpace($origKeyEnvValue)) {
            $activeKey = $origKeyEnvValue
        } elseif (-not $NonInteractive) {
            Write-Host "請輸入 KeePassXC 64 字元 Hex 主金鑰 (輸入全程遮罩隱藏)：" -ForegroundColor Yellow
            $sec = Read-Host -Prompt "Encryption Key" -AsSecureString
            if ($null -ne $sec -and $sec.Length -gt 0) {
                $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
                $activeKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr).Trim()
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
                $bstr = [IntPtr]::Zero
                $sec = $null
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        throw "[KEY ERROR] 未提供金鑰！請透過互動提示輸入或指定 -EncryptionKey 參數。"
    }

    # 格式預檢 (不顯示金鑰內容)
    if ($activeKey.Length -ne 64 -or ($activeKey -notmatch '^[0-9a-fA-F]{64}$')) {
        throw "[KEY ERROR] 金鑰格式不合！必須恰為 64 字元十六進位 Hex (當前長度: $($activeKey.Length))。"
    }

    # 注入子行程環境變數
    $env:BACKUP_ENCRYPTION_KEY = $activeKey
    [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $activeKey, "Process")

    # -------------------------------------------------------------------------
    # 步驟 2: 前置路徑與既有備份安全檢查 (FIX-04)
    # -------------------------------------------------------------------------
    Write-Host "`n[1/7] 執行備份檔案與目標環境前置檢查..." -ForegroundColor Green
    
    if ($MockScenario -eq "None") {
        if (-not (Test-Path $EncryptedBackupPath)) {
            throw "[PATH ERROR] 找不到 C2KB 加密備份檔案：$EncryptedBackupPath"
        }
        if (-not (Test-Path $OriginalDumpPath)) {
            throw "[PATH ERROR] 找不到指定原始明文 Dump 檔案：$OriginalDumpPath"
        }
    }

    # TMP-01: 解密前確認暫存檔絕不能預先存在，且不能與原始檔同名
    if (Test-Path $decDump) {
        throw "[TEMP FILE ERROR] 暫存檔案已預先存在，為防覆寫立即中止：$decDump"
    }
    if ([string]::Equals([System.IO.Path]::GetFullPath($decDump), [System.IO.Path]::GetFullPath($OriginalDumpPath), [System.StringComparison]::OrdinalIgnoreCase) -or
        [string]::Equals([System.IO.Path]::GetFullPath($decDump), [System.IO.Path]::GetFullPath($EncryptedBackupPath), [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "[SAFETY ERROR] 暫存檔路徑不可與原始 Dump 或加密備份同名！"
    }

    # 檢查沙盒容器運行狀態與目標資料庫存在性 (ROB-01 & FIX-06)
    if ($MockScenario -eq "DockerCheckFail") {
        throw "[DOCKER ERROR] 沙盒容器 '$SandboxContainer' 未處於運行中狀態！(Simulated Docker failure)"
    } elseif ($MockScenario -eq "None") {
        $containerStatus = docker inspect --format '{{.State.Running}}' $SandboxContainer 2>$null
        if ($LASTEXITCODE -ne 0 -or $containerStatus.Trim() -ne "true") {
            throw "[DOCKER ERROR] 沙盒容器 '$SandboxContainer' 未處於運行中狀態！(ExitCode: $LASTEXITCODE)"
        }
    }

    # 檢查目標資料庫是否已存在 (嚴禁覆寫)
    $dbCheckOutput = ""
    if ($MockScenario -eq "DbExistsAbort") {
        $dbCheckOutput = "1"
    } elseif ($MockScenario -eq "None") {
        $dbCheckOutput = docker exec -i $SandboxContainer psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$TargetDatabase';"
        if ($LASTEXITCODE -ne 0) {
            throw "[DOCKER ERROR] 無法連線沙盒查詢資料庫狀態！(ExitCode: $LASTEXITCODE)"
        }
    } else {
        $dbCheckOutput = "0"
    }

    if ($null -ne $dbCheckOutput -and $dbCheckOutput.Trim() -eq "1") {
        throw "[ABORT: DB EXISTS] 目標資料庫 '$TargetDatabase' 已存在！依防覆寫規範立即終止！"
    }
    Write-Host "確認目標資料庫 '$TargetDatabase' 尚未建立，安全無虞。" -ForegroundColor Gray

    # -------------------------------------------------------------------------
    # 步驟 3: 執行 AES-256-GCM 認證解密 (驗證 16-byte AuthTag)
    # -------------------------------------------------------------------------
    Write-Host "`n[2/7] 執行 C2KB 容器認證解密 (驗證 16-byte AuthTag)..." -ForegroundColor Green
    
    if ($MockScenario -eq "NodeDecryptFail") {
        throw "[DECRYPT FAILED] AES-256-GCM 認證解密失敗或 AuthTag 不吻合！(Simulated Node auth tag error)"
    } elseif ($MockScenario -ne "None") {
        # 測試模式下產出模擬解密檔案
        Set-Content -Path $decDump -Value "MOCK_DECRYPTED_POSTGRES_DUMP_CONTENT" -Encoding UTF8
    } else {
        $cryptoScript = Join-Path $PSScriptRoot "backup-crypto.cjs"
        if (-not (Test-Path $cryptoScript)) {
            $cryptoScript = "scripts/database/backup-crypto.cjs"
        }
        node $cryptoScript decrypt -i $EncryptedBackupPath -o $decDump
        if ($LASTEXITCODE -ne 0) {
            throw "[DECRYPT FAILED] AES-256-GCM 認證解密失敗或 AuthTag 不吻合！(Node ExitCode: $LASTEXITCODE)"
        }
    }

    if (-not (Test-Path $decDump)) {
        throw "[DECRYPT FAILED] 解密程序未產出目標暫存檔：$decDump"
    }
    Write-Host "解密成功，AuthTag 認證通過。" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 4: 計算 SHA-256 並與指定原始 Dump 雜湊比對
    # -------------------------------------------------------------------------
    Write-Host "`n[3/7] 重新計算解密 Dump 之 SHA-256 雜湊指紋..." -ForegroundColor Green
    $decHash = ""
    if ($MockScenario -eq "HashMismatch") {
        $decHash = "CORRUPTED_HASH_0000000000000000000000000000000000000000000000000000"
    } elseif ($MockScenario -ne "None") {
        $decHash = $ExpectedSha256.ToUpper()
    } else {
        $hashObj = Get-FileHash -Path $decDump -Algorithm SHA256
        $decHash = $hashObj.Hash.ToUpper()
    }

    Write-Host "解密 Dump SHA-256 : $decHash" -ForegroundColor Gray
    Write-Host "指定原始 SHA-256 : $ExpectedSha256" -ForegroundColor Gray

    if (-not [string]::Equals($decHash, $ExpectedSha256.ToUpper(), [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "[HASH MISMATCH] 解密資料雜湊與指定原始 SHA-256 不符！可能金鑰錯誤或資料損毀！"
    }
    Write-Host "【雜湊核驗通過】解密還原內容與原始備份 100% 逐位元完全相同！" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 5: 建立全新獨立測試資料庫 (FIX-06 記錄建立狀態)
    # -------------------------------------------------------------------------
    Write-Host "`n[4/7] 於沙盒內建立全新獨立測試庫 $TargetDatabase..." -ForegroundColor Green
    if ($MockScenario -eq "None") {
        docker exec -i $SandboxContainer psql -U postgres -d postgres -c "CREATE DATABASE $TargetDatabase OWNER codetoknow_restore;"
        if ($LASTEXITCODE -ne 0) {
            throw "[CREATE DB FAILED] 建立資料庫 '$TargetDatabase' 失敗！(ExitCode: $LASTEXITCODE)"
        }
    }
    $dbCreatedByThisRun = $true
    Write-Host "測試資料庫 '$TargetDatabase' 建立完成。" -ForegroundColor Gray

    # -------------------------------------------------------------------------
    # 步驟 6: 傳送 Dump 至沙盒並執行原生 pg_restore (FIX-01 嚴格 Exit Code == 0)
    # -------------------------------------------------------------------------
    Write-Host "`n[5/7] 傳送 Dump 至沙盒容器並執行 PostgreSQL 17 原生還原..." -ForegroundColor Green
    
    if ($MockScenario -eq "None") {
        docker cp $decDump "$($SandboxContainer):$containerTmpDump"
        if ($LASTEXITCODE -ne 0) {
            throw "[DOCKER CP FAILED] 複製 Dump 至沙盒容器暫存區失敗！(ExitCode: $LASTEXITCODE)"
        }
    }
    $containerDumpCopied = $true

    # 執行 pg_restore (--no-owner --no-acl 消除雲端特有管理角色警示)
    # FIX-01 要求：pg_restore 必須 Exit Code 等於 0，不得將 Exit Code 1 視為成功！
    $pgRestoreExitCode = 0
    if ($MockScenario -eq "PgRestoreExit1") {
        $pgRestoreExitCode = 1
    } elseif ($MockScenario -eq "PgRestoreExit2") {
        $pgRestoreExitCode = 2
    } elseif ($MockScenario -eq "None") {
        docker exec -i $SandboxContainer pg_restore -U postgres -d $TargetDatabase -v --no-owner --no-acl $containerTmpDump
        $pgRestoreExitCode = $LASTEXITCODE
    } else {
        $pgRestoreExitCode = 0
    }

    if ($pgRestoreExitCode -ne 0) {
        throw "[PG_RESTORE FAILED] pg_restore 執行失敗！ExitCode 為 $pgRestoreExitCode (依規範必須嚴格為 0，不得忽略警告或錯誤)！"
    }
    Write-Host "pg_restore 原生還原成功 (ExitCode = 0)。" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 7: 完整性程式化斷言稽核 (FIX-02 嚴格核對五大核心指標)
    # -------------------------------------------------------------------------
    Write-Host "`n[6/7] 執行資料庫核心指標程式化斷言稽核..." -ForegroundColor Green
    
    $auditRaw = ""
    if ($MockScenario -eq "SqlAuditFormatFail") {
        $auditRaw = "CORRUPTED_SQL_OUTPUT_INVALID_FORMAT"
    } elseif ($MockScenario -eq "TableCountMismatch") {
        $auditRaw = "35|47|133|0|2"
    } elseif ($MockScenario -eq "FkCountMismatch") {
        $auditRaw = "37|45|133|0|2"
    } elseif ($MockScenario -eq "IndexCountMismatch") {
        $auditRaw = "37|47|130|0|2"
    } elseif ($MockScenario -eq "UnvalFkMismatch") {
        $auditRaw = "37|47|133|1|2"
    } elseif ($MockScenario -eq "MigrationCountMismatch") {
        $auditRaw = "37|47|133|0|1"
    } elseif ($MockScenario -ne "None") {
        $auditRaw = "37|47|133|0|2"
    } else {
        $auditSql = @"
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS tables,
  (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public') AS fks,
  (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS indexes,
  (SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND NOT convalidated) AS unvalidated_fks,
  (SELECT count(*) FROM _prisma_migrations) AS migrations;
"@
        $auditRaw = docker exec -i $SandboxContainer psql -U postgres -d $TargetDatabase -tAc "$auditSql"
        if ($LASTEXITCODE -ne 0) {
            throw "[SQL AUDIT FAILED] 執行資料庫指標稽核 SQL 失敗！(ExitCode: $LASTEXITCODE)"
        }
    }

    # 驗證輸出格式是否合規 (5 個以 | 分隔的整數)
    if ($null -eq $auditRaw -or ($auditRaw.Trim() -notmatch '^\d+\|\d+\|\d+\|\d+\|\d+$')) {
        throw "[SQL AUDIT FORMAT ERROR] SQL 稽核輸出格式異常或數值缺失：'$auditRaw'"
    }

    $parts = $auditRaw.Trim().Split('|')
    $actualTables       = [int]$parts[0]
    $actualFks          = [int]$parts[1]
    $actualIndexes      = [int]$parts[2]
    $actualUnvalFks     = [int]$parts[3]
    $actualMigrations   = [int]$parts[4]

    $auditResults = [ordered]@{
        "public 資料表總數 (預期 37)"          = "$actualTables ($([bool]($actualTables -eq 37)))"
        "外鍵約束總數 (預期 47)"                = "$actualFks ($([bool]($actualFks -eq 47)))"
        "索引總數 (預期 133)"                  = "$actualIndexes ($([bool]($actualIndexes -eq 133)))"
        "未驗證外鍵約束數 (預期 0)"             = "$actualUnvalFks ($([bool]($actualUnvalFks -eq 0)))"
        "Prisma 遷移歷史記錄數 (預期 2)"        = "$actualMigrations ($([bool]($actualMigrations -eq 2)))"
    }
    $auditResults | Format-List

    # FIX-02 程式化嚴格斷言：任一項不符立即拋錯
    if ($actualTables -ne 37) {
        throw "[VERIFICATION FAILED] public 資料表數量不符！實際: $actualTables，預期: 37。"
    }
    if ($actualFks -ne 47) {
        throw "[VERIFICATION FAILED] 外鍵約束數量不符！實際: $actualFks，預期: 47。"
    }
    if ($actualIndexes -ne 133) {
        throw "[VERIFICATION FAILED] 索引總數不符！實際: $actualIndexes，預期: 133。"
    }
    if ($actualUnvalFks -ne 0) {
        throw "[VERIFICATION FAILED] 存在未生效或未驗證之外鍵約束！數量: $actualUnvalFks，預期: 0。"
    }
    if ($actualMigrations -ne 2) {
        throw "[VERIFICATION FAILED] Prisma 遷移紀錄數量不符！實際: $actualMigrations，預期: 2。"
    }

    $verificationPassed = $true
    Write-Host "【完整性斷言通過】資料表、外鍵、索引、約束與遷移紀錄 100% 吻合！" -ForegroundColor Green
}
catch {
    Write-Error "`n【還原驗收中止】$($_.Exception.Message)"
}
finally {
    # -------------------------------------------------------------------------
    # 步驟 8: 清理程序 (FIX-04, FIX-05)
    # -------------------------------------------------------------------------
    Write-Host "`n[7/7] 執行暫存檔案清理程序..." -ForegroundColor Green
    
    $localCleanError = $null
    $containerCleanError = $null

    # 1. 清理容器內部暫存檔
    if ($containerDumpCopied) {
        try {
            if ($MockScenario -eq "ContainerCleanupFail") {
                throw "Simulated container rm failure"
            } elseif ($MockScenario -eq "None") {
                docker exec -i $SandboxContainer rm -f $containerTmpDump 2>$null
                if ($LASTEXITCODE -ne 0) {
                    throw "docker exec rm exited with code $LASTEXITCODE"
                }
            }
            Write-Host "沙盒容器暫存檔已安全清除：$containerTmpDump" -ForegroundColor Gray
        } catch {
            $containerCleanError = $_.Exception.Message
            $cleanupSucceeded = $false
            Write-Warning "【安全警示】沙盒容器暫存檔清理失敗：$containerTmpDump (錯誤: $containerCleanError)"
        }
    }

    # 2. 清理本機解密暫存檔 (FIX-04: 僅刪除本次建立之暫存檔，嚴禁刪除原始 dump 或 c2kb)
    if (Test-Path $decDump) {
        try {
            # 安全防呆：絕不刪除原始備份
            if ([string]::Equals([System.IO.Path]::GetFullPath($decDump), [System.IO.Path]::GetFullPath($OriginalDumpPath), [System.StringComparison]::OrdinalIgnoreCase) -or
                [string]::Equals([System.IO.Path]::GetFullPath($decDump), [System.IO.Path]::GetFullPath($EncryptedBackupPath), [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "嚴重安全保護阻斷：拒絕刪除原始備份檔案！"
            }

            if ($MockScenario -eq "LocalCleanupFail") {
                throw "Simulated local file in-use error (EPERM)"
            } else {
                Remove-Item -Path $decDump -Force -ErrorAction Stop
            }

            if (Test-Path $decDump) {
                throw "檔案於 Remove-Item 呼叫後仍存在於磁碟。"
            }
            Write-Host "本機解密暫存檔已安全清除：$decDump" -ForegroundColor Gray
        } catch {
            $localCleanError = $_.Exception.Message
            $cleanupSucceeded = $false
            Write-Warning "【安全警示】本機解密暫存檔清理失敗：$decDump (錯誤: $localCleanError)"
        }
    }

    # FIX-06: 失敗後資料庫狀態記錄
    if (-not $verificationPassed -and $dbCreatedByThisRun) {
        Write-Warning "`n=========================================================="
        Write-Warning "【保留部分還原資料庫供除錯】"
        Write-Warning "資料庫 '$TargetDatabase' 係由本次作業建立，但因中途發生錯誤未達驗收標準。"
        Write-Warning "該資料庫已完整保留供後續分析，【絕對不可將其視為驗收通過之資料庫】！"
        Write-Warning "=========================================================="
    }

    # FIX-05: 清理失敗警示 (不宣稱為不可復原抹除，提醒人員保護明文)
    if (-not $cleanupSucceeded) {
        Write-Warning "`n=========================================================="
        Write-Warning "【機敏明文未完全清理告警】"
        if ($null -ne $localCleanError) {
            Write-Warning "- 本機解密明文 Dump 仍可能殘留：$decDump"
        }
        if ($null -ne $containerCleanError) {
            Write-Warning "- 容器暫存區 Dump 仍可能殘留：$containerTmpDump"
        }
        Write-Warning "請操作人員立即手動排查並刪除殘留之明文檔案，以防止機敏資料外洩！"
        Write-Warning "=========================================================="
    }

    # SEC-01: 環境變數生命週期精準復原
    try {
        if ($origKeyEnvExists) {
            $env:BACKUP_ENCRYPTION_KEY = $origKeyEnvValue
            [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $origKeyEnvValue, "Process")
        } else {
            $env:BACKUP_ENCRYPTION_KEY = $null
            [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
        }
    } catch {
        Write-Warning "【環境變數警示】復原 BACKUP_ENCRYPTION_KEY 失敗：$($_.Exception.Message)"
    }

    if ($bstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    $activeKey = $null
    $origKeyEnvValue = $null
    [System.GC]::Collect()
}

# -------------------------------------------------------------------------
# 最終成果與退出代碼規範
# -------------------------------------------------------------------------
if ($verificationPassed -and $cleanupSucceeded) {
    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "  Phase 3-C-10 還原驗收【PASS】！所有指標全數吻合且暫存已清除！" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
    exit 0
} elseif ($verificationPassed -and -not $cleanupSucceeded) {
    Write-Host "`n==========================================================" -ForegroundColor Yellow
    Write-Host "  Phase 3-C-10 還原驗收【PARTIAL PASS (CLEANUP WARNING)】" -ForegroundColor Yellow
    Write-Host "  還原與指標斷言已通過，但有暫存檔案未能成功清除，請手動清理！" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Yellow
    exit 2
} else {
    Write-Host "`n==========================================================" -ForegroundColor Red
    Write-Host "  Phase 3-C-10 還原驗收【FAIL】！未達交付標準！" -ForegroundColor Red
    Write-Host "==========================================================" -ForegroundColor Red
    exit 1
}
