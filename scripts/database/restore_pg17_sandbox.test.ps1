<#
.SYNOPSIS
    CODE TO KNOW - PG17 還原腳本 18 大離線自動化安全與強韌性測試
.DESCRIPTION
    測試 restore_pg17_sandbox.ps1 的所有邊界條件與錯誤防護：
    1. 100% 離線測試，絕不連線 Supabase，絕不連線正式資料庫，亦不執行真實資料庫還原。
    2. 使用獨立隔離的本機暫存目錄與 -MockScenario 參數模擬各類外部命令情境。
    3. 涵蓋 18 大安全情境 (FIX-01 至 FIX-06)。
#>

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$scriptUnderInspection = Join-Path $PSScriptRoot "restore_pg17_sandbox.ps1"
if (-not (Test-Path $scriptUnderInspection)) {
    throw "找不到受測腳本：$scriptUnderInspection"
}

$testBaseDir = Join-Path $PSScriptRoot "../../tmp/restore_pg17_sandbox_test_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
New-Item -ItemType Directory -Path $testBaseDir -Force | Out-Null

$passCount = 0
$failCount = 0
$totalTests = 18

function Invoke-RestoreScript {
    param (
        [string[]]$ScriptParams
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptUnderInspection`" " + ($ScriptParams -join " ")
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    
    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    
    return [PSCustomObject]@{
        ExitCode = $proc.ExitCode
        Output   = "$stdout`n$stderr"
        Stdout   = $stdout
        Stderr   = $stderr
    }
}

function Run-ScenarioTest {
    param (
        [string]$TestId,
        [string]$Description,
        [scriptblock]$TestBody
    )

    Write-Host -NoNewline "  [$TestId] $Description ... "
    try {
        & $TestBody
        Write-Host "PASS" -ForegroundColor Green
        $script:passCount++
    }
    catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "      錯誤訊息：$($_.Exception.Message)" -ForegroundColor Red
        $script:failCount++
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CODE TO KNOW - PG17 還原腳本 18 大離線安全整合測試" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$dummyKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
$dummyHash = "2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50"

# 建立隔離測試檔案
$testEnc = Join-Path $testBaseDir "test_backup.dump.c2kb"
$testOrig = Join-Path $testBaseDir "test_backup.dump"
Set-Content -Path $testEnc -Value "MOCK_C2KB_CONTENT" -Encoding UTF8
Set-Content -Path $testOrig -Value "MOCK_ORIG_CONTENT" -Encoding UTF8

$baseArgs = @(
    "-EncryptedBackupPath `"$testEnc`"",
    "-OriginalDumpPath `"$testOrig`"",
    "-ExpectedSha256 `"$dummyHash`"",
    "-EncryptionKey `"$dummyKey`"",
    "-NonInteractive"
)

try {
    # -------------------------------------------------------------------------
    # TC-01: 所有必要命令成功 (Happy Path)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-01" "所有必要命令成功 (全流程 PASS，ExitCode 0)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 為 0，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -notmatch "Phase 3-C-10 還原驗收【PASS】") { throw "未輸出 PASS 字樣" }
    }

    # -------------------------------------------------------------------------
    # TC-02: Node 解密失敗
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-02" "Node 解密失敗 (AuthTag 錯誤中斷，無 PASS，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario NodeDecryptFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "AES-256-GCM 認證解密失敗") { throw "未捕捉到解密失敗報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-03: Docker 命令失敗
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-03" "Docker 命令失敗 (容器未運行或連線失敗，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DockerCheckFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "沙盒容器.*未處於運行中狀態") { throw "未捕捉到容器未運行報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-04: pg_restore Exit Code 1 (FIX-01: 嚴格拒絕 Exit Code 1)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-04" "pg_restore Exit Code 1 (FIX-01: 嚴格拒絕忽略警示，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario PgRestoreExit1"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "Exit Code 1 不得判定為 PASS" }
        if ($res.Output -notmatch "pg_restore 執行失敗！ExitCode 為 1") { throw "未包含預期之 ExitCode 1 報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-05: pg_restore Exit Code 2 (致命還原錯誤)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-05" "pg_restore Exit Code 2 (致命錯誤立即中止，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario PgRestoreExit2"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "pg_restore 執行失敗！ExitCode 為 2") { throw "未包含預期之 ExitCode 2 報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-06: SQL 驗收查詢失敗 (FIX-02 異常輸出或格式錯誤)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-06" "SQL 驗收查詢失敗 (輸出格式異常或欄位缺失，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario SqlAuditFormatFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "SQL 稽核輸出格式異常") { throw "未捕捉到格式異常錯誤" }
    }

    # -------------------------------------------------------------------------
    # TC-07: 資料表數量不符 (FIX-02: 35 而非 37)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-07" "資料表數量不符 (實際 35，預期 37，嚴格判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario TableCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "public 資料表數量不符") { throw "未輸出資料表數量不符之報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-08: 外鍵數量不符 (FIX-02: 45 而非 47)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-08" "外鍵約束數量不符 (實際 45，預期 47，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario FkCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "外鍵約束數量不符") { throw "未輸出外鍵數量不符報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-09: 索引數量不符 (FIX-02: 130 而非 133)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-09" "索引總數不符 (實際 130，預期 133，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario IndexCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "索引總數不符") { throw "未輸出索引總數不符報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-10: 未驗證外鍵約束不為 0 (SEM-01 & FIX-02: 存在 1 個未驗證外鍵)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-10" "未驗證外鍵約束不為 0 (存在 1 個約束未驗證，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario UnvalFkMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "未生效或未驗證之外鍵約束") { throw "未輸出未驗證外鍵報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-11: Prisma 遷移數量不符 (FIX-02: 1 而非 2)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-11" "Prisma 遷移紀錄不符 (實際 1 筆，預期 2 筆，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario MigrationCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "Prisma 遷移紀錄數量不符") { throw "未輸出遷移紀錄不符報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-12: 原本存在的環境變數正確復原 (SEC-01)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-12" "原本存在的環境變數正確復原 (SEC-01 原值保留)" {
        $originalValue = "ORIGINAL_PRESERVED_ENV_KEY_12345"
        
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $cmdText = "`$env:BACKUP_ENCRYPTION_KEY = '$originalValue'; & `"$scriptUnderInspection`" " + ($baseArgs -join " ") + " -MockScenario AllSuccess | Out-Null; Write-Output (`$env:BACKUP_ENCRYPTION_KEY)"
        $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"$cmdText`""
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        
        $proc = [System.Diagnostics.Process]::Start($psi)
        $out = $proc.StandardOutput.ReadToEnd()
        $proc.WaitForExit()
        
        $lines = ($out.Trim() -split "`r?`n") | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        $actualVal = $lines[-1].Trim()
        if ($actualVal -ne $originalValue) {
            throw "環境變數未正確復原！預期 '$originalValue'，實際為 '$actualVal'"
        }
    }

    # -------------------------------------------------------------------------
    # TC-13: 原本不存在的環境變數正確清除 (SEC-01)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-13" "原本不存在的環境變數正確清除 (SEC-01 清除為 null)" {
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $cmdText = "`$env:BACKUP_ENCRYPTION_KEY = `$null; & `"$scriptUnderInspection`" " + ($baseArgs -join " ") + " -MockScenario AllSuccess | Out-Null; Write-Output ([string]::IsNullOrEmpty(`$env:BACKUP_ENCRYPTION_KEY))"
        $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"$cmdText`""
        $psi.UseShellExecute = $false
        $psi.RedirectStandardOutput = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        
        $proc = [System.Diagnostics.Process]::Start($psi)
        $out = $proc.StandardOutput.ReadToEnd()
        $proc.WaitForExit()

        $lines = ($out.Trim() -split "`r?`n") | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
        $actualVal = $lines[-1].Trim()
        if ($actualVal -ne "True") {
            throw "原本不存在的環境變數未被清空！實際為: '$actualVal'"
        }
    }

    # -------------------------------------------------------------------------
    # TC-14: 目標資料庫已存在時安全中止 (防覆寫保護)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-14" "目標資料庫已存在時安全中止 (防覆寫保護)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbExistsAbort"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "資料庫已存在時不應輸出 PASS" }
        if ($res.Output -notmatch "目標資料庫.*已存在！依防覆寫規範立即終止") { throw "未觸發防覆寫報錯" }
    }

    # -------------------------------------------------------------------------
    # TC-15: 本機暫存檔清理失敗 (FIX-05)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-15" "本機暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario LocalCleanupFail"))
        if ($res.ExitCode -ne 2) { throw "預期 ExitCode 為 2 (PARTIAL PASS / CLEANUP WARNING)，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "清理失敗時不得輸出完整 PASS" }
        if ($res.Output -notmatch "PARTIAL PASS \(CLEANUP WARNING\)") { throw "未輸出清理警告標記" }
        if ($res.Output -notmatch "本機解密暫存檔清理失敗") { throw "未明確指出本機檔案清理失敗" }
    }

    # -------------------------------------------------------------------------
    # TC-16: 容器暫存檔清理失敗 (FIX-05)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-16" "容器暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario ContainerCleanupFail"))
        if ($res.ExitCode -ne 2) { throw "預期 ExitCode 為 2，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "清理失敗不得輸出完整 PASS" }
        if ($res.Output -notmatch "沙盒容器暫存檔清理失敗") { throw "未明確指出容器暫存檔清理失敗" }
    }

    # -------------------------------------------------------------------------
    # TC-17: 解密失敗時不誤刪原始備份 (FIX-04)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-17" "解密失敗時不誤刪原始備份 (原始 .dump 與 .c2kb 完好)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario NodeDecryptFail"))
        if (-not (Test-Path $testEnc)) { throw "原始 C2KB 檔案遭意外刪除！" }
        if (-not (Test-Path $testOrig)) { throw "原始 Dump 檔案遭意外刪除！" }
    }

    # -------------------------------------------------------------------------
    # TC-18: 失敗情境絕對不得輸出 PASS (全情境保證)
    # -------------------------------------------------------------------------
    Run-ScenarioTest "TC-18" "雜湊比對不符時終止 (HASH MISMATCH 絕對不輸出 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario HashMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "雜湊不符絕對不得輸出 PASS" }
        if ($res.Output -notmatch "解密資料雜湊與指定原始 SHA-256 不符") { throw "未輸出雜湊不符報錯" }
    }
}
finally {
    # 測試結束後清理測試目錄
    if (Test-Path $testBaseDir) {
        Remove-Item -Path $testBaseDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  測試總結：$passCount / $totalTests 個案例全數通過！ (失敗: $failCount)" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
