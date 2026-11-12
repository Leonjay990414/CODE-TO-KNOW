<#
.SYNOPSIS
    CODE TO KNOW - PG17 還原腳本 Phase 3-C-11F 離線自動化安全與 TOC 過濾整合測試
.DESCRIPTION
    測試 restore_pg17_sandbox.ps1 的所有邊界條件、TOC 過濾驗證與防覆寫保護：
    1. 100% 離線測試，絕不連線 Supabase，絕不連線 PG16/PG17 資料庫，亦不執行真實 pg_restore。
    2. 使用獨立隔離的本機暫存目錄與 -MockScenario / AST 提取函式驗證所有規格。
    3. 涵蓋原有 18 項安全情境 (FIX-01 至 FIX-06) 與 Phase 3-C-11F 新增之 TOC / DB / 參數驗證 (共 33 項)。
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
$totalTests = 37

# 透過 PowerShell AST 載入受測腳本內定義之純輔助函式，確保直接測試實際程式碼而不觸發主流程
$astTokens = $null
$astErrors = $null
$scriptAst = [System.Management.Automation.Language.Parser]::ParseFile($scriptUnderInspection, [ref]$astTokens, [ref]$astErrors)
if ($astErrors.Count -gt 0) {
    throw "受測腳本存在語法錯誤，無法載入測試：$($astErrors -join '; ')"
}
$helperNames = @(
    "Assert-SafeTargetDatabaseName",
    "Assert-TargetDatabaseAbsentResult",
    "Get-PgRestoreArguments",
    "Test-IsPublicCoreTocBody",
    "Test-IsVaultOrSupabaseVaultBody",
    "Parse-AndVerifyFilteredToc",
    "Invoke-StrictTocFilterAndVerify"
)
foreach ($fnAst in $scriptAst.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $false)) {
    if ($helperNames -contains $fnAst.Name) {
        . ([scriptblock]::Create($fnAst.Extent.Text))
    }
}

function New-MockRawTocFile {
    param (
        [Parameter(Mandatory = $true)][string]$Path,
        [int]$PublicCount = 337,
        [int[]]$OmitIds = @(),
        [hashtable]$OverrideLineById = @{},
        [string[]]$ExtraLines = @(),
        [bool]$IncludeSessionHeaderEntries = $true,
        [bool]$WithBom = $false,
        [bool]$UseCrLf = $false
    )

    $lines = New-Object System.Collections.Generic.List[string]
    $lines.Add(";")
    $lines.Add("; Archive created at 2026-11-10 20:45:19 CST")
    $lines.Add(";     dbname: postgres")
    $lines.Add(";     TOC Entries: 926")
    $lines.Add(";     Compression: gzip")
    $lines.Add(";     Dump Version: 1.15-0")
    $lines.Add(";     Format: CUSTOM")
    $lines.Add(";     Integer: 4 bytes")
    $lines.Add(";     Offset: 8 bytes")
    $lines.Add(";")

    $baseEntries = New-Object System.Collections.Generic.List[object]

    # 非 Vault 之必要擴充套件與註解 (6 項)
    $baseEntries.Add(@{ Id = 2; Text = "2; 3079 16401 EXTENSION - pg_stat_statements " })
    $baseEntries.Add(@{ Id = 3; Text = "3; 3079 16412 EXTENSION - pgcrypto " })
    $baseEntries.Add(@{ Id = 4; Text = "4; 3079 16449 EXTENSION - uuid-ossp " })
    $baseEntries.Add(@{ Id = 4792; Text = "4792; 0 0 COMMENT - EXTENSION pg_stat_statements " })
    $baseEntries.Add(@{ Id = 4793; Text = "4793; 0 0 COMMENT - EXTENSION pgcrypto " })
    $baseEntries.Add(@{ Id = 4795; Text = "4795; 0 0 COMMENT - EXTENSION uuid-ossp " })

    # 精確 10 個應排除之 Supabase Vault TOC 項目
    $baseEntries.Add(@{ Id = 5; Text = "5; 3079 16476 EXTENSION - supabase_vault " })
    $baseEntries.Add(@{ Id = 13; Text = "13; 2615 16475 SCHEMA - vault postgres" })
    $baseEntries.Add(@{ Id = 3777; Text = "3777; 0 16481 TABLE DATA vault secrets postgres" })
    $baseEntries.Add(@{ Id = 4791; Text = "4791; 0 0 ACL - SCHEMA vault postgres" })
    $baseEntries.Add(@{ Id = 4794; Text = "4794; 0 0 COMMENT - EXTENSION supabase_vault " })
    $baseEntries.Add(@{ Id = 4888; Text = "4888; 0 0 ACL vault FUNCTION _crypto_aead_det_decrypt(bytea, bytea) postgres" })
    $baseEntries.Add(@{ Id = 4889; Text = "4889; 0 0 ACL vault FUNCTION create_secret(text, text, text, text) postgres" })
    $baseEntries.Add(@{ Id = 4890; Text = "4890; 0 0 ACL vault FUNCTION update_secret(uuid, text, text, text, text) postgres" })
    $baseEntries.Add(@{ Id = 4997; Text = "4997; 0 0 ACL vault TABLE secrets postgres" })
    $baseEntries.Add(@{ Id = 4998; Text = "4998; 0 0 ACL vault TABLE decrypted_secrets postgres" })

    # PGDMP 完整版含 7 筆 Session / DB Header 項目 (pg_restore --list 會省略此 7 筆，形成 926 vs 919)
    if ($IncludeSessionHeaderEntries) {
        for ($h = 4779; $h -le 4785; $h++) {
            $baseEntries.Add(@{ Id = $h; Text = "${h}; 1262 17428 DATABASE - postgres_${h} postgres" })
        }
    }

    # 確保 Public 核心物件剛好 PublicCount 項 (預設 337 項)，ID 從 100 起跳，避開既有保留 ID
    for ($p = 1; $p -le $PublicCount; $p++) {
        $pubEntryId = 100 + $p
        $baseEntries.Add(@{ Id = $pubEntryId; Text = "${pubEntryId}; 1259 $(20000 + $p) TABLE public mock_public_obj_${p} postgres" })
    }

    # 包含 #4698 PUBLICATION supabase_realtime
    $baseEntries.Add(@{ Id = 4698; Text = "4698; 6104 33333 PUBLICATION - supabase_realtime postgres" })

    # 補齊 auth / storage 非 public、非 vault 項目，使得在預設狀態下：
    # - IncludeSessionHeaderEntries=$true 時總有效筆數為 926
    # - IncludeSessionHeaderEntries=$false 時總有效筆數為 919
    $otherCount = 565
    for ($k = 1; $k -le $otherCount; $k++) {
        $otherEntryId = 1000 + $k
        $baseEntries.Add(@{ Id = $otherEntryId; Text = "${otherEntryId}; 1259 $(30000 + $k) TABLE auth mock_auth_obj_${k} postgres" })
    }

    foreach ($entry in $baseEntries) {
        if ($OmitIds -contains $entry.Id) { continue }
        if ($OverrideLineById.ContainsKey($entry.Id)) {
            $lines.Add($OverrideLineById[$entry.Id])
        }
        else {
            $lines.Add($entry.Text)
        }
    }

    foreach ($ex in $ExtraLines) {
        $lines.Add($ex)
    }

    $sep = if ($UseCrLf) { "`r`n" } else { "`n" }
    $content = ($lines -join $sep) + $sep
    $encoding = New-Object System.Text.UTF8Encoding($WithBom)
    [System.IO.File]::WriteAllText($Path, $content, $encoding)
}

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
Write-Host "  CODE TO KNOW - PG17 還原腳本 Phase 3-C-11F 離線整合測試" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$dummyKey = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
$dummyHash = "2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50"

# 建立隔離測試檔案與標準 926 筆 Mock TOC 清單
$testEnc = Join-Path $testBaseDir "test_backup.dump.c2kb"
$testOrig = Join-Path $testBaseDir "test_backup.dump"
$validToc926 = Join-Path $testBaseDir "mock_raw_926.toc"
Set-Content -Path $testEnc -Value "MOCK_C2KB_CONTENT" -Encoding UTF8
Set-Content -Path $testOrig -Value "MOCK_ORIG_CONTENT" -Encoding UTF8
New-MockRawTocFile -Path $validToc926

$baseArgs = @(
    "-EncryptedBackupPath `"$testEnc`"",
    "-OriginalDumpPath `"$testOrig`"",
    "-ExpectedSha256 `"$dummyHash`"",
    "-EncryptionKey `"$dummyKey`"",
    "-MockRawTocPath `"$validToc926`"",
    "-NonInteractive"
)

try {
    # =========================================================================
    # 第一部分：原有 18 大安全性與邊界整合測試 (TC-01 ~ TC-18)
    # =========================================================================

    Run-ScenarioTest "TC-01" "所有必要命令成功 (全流程 PASS，ExitCode 0)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 為 0，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -notmatch "Phase 3-C-10 還原驗收【PASS】") { throw "未輸出 PASS 字樣" }
        if ($res.Output -notmatch "TOC 過濾驗證通過：原始=926，排除=10 \(Vault\)，保留=916，public 核心=337") { throw "未輸出預期之 TOC 過濾摘要" }
    }

    Run-ScenarioTest "TC-02" "Node 解密失敗 (AuthTag 錯誤中斷，無 PASS，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario NodeDecryptFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "AES-256-GCM 認證解密失敗") { throw "未捕捉到解密失敗報錯" }
    }

    Run-ScenarioTest "TC-03" "Docker 命令失敗 (容器未運行或連線失敗，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DockerCheckFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "沙盒容器.*未處於運行中狀態") { throw "未捕捉到容器未運行報錯" }
    }

    Run-ScenarioTest "TC-04" "pg_restore Exit Code 1 (FIX-01: 嚴格拒絕忽略警示，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario PgRestoreExit1"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "Exit Code 1 不得判定為 PASS" }
        if ($res.Output -notmatch "pg_restore 執行失敗！ExitCode 為 1") { throw "未包含預期之 ExitCode 1 報錯" }
    }

    Run-ScenarioTest "TC-05" "pg_restore Exit Code 2 (致命錯誤立即中止，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario PgRestoreExit2"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "pg_restore 執行失敗！ExitCode 為 2") { throw "未包含預期之 ExitCode 2 報錯" }
    }

    Run-ScenarioTest "TC-06" "SQL 驗收查詢失敗 (輸出格式異常或欄位缺失，ExitCode 1)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario SqlAuditFormatFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "失敗時不應輸出 PASS" }
        if ($res.Output -notmatch "SQL 稽核輸出格式異常") { throw "未捕捉到格式異常錯誤" }
    }

    Run-ScenarioTest "TC-07" "資料表數量不符 (實際 35，預期 37，嚴格判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario TableCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "public 資料表數量不符") { throw "未輸出資料表數量不符之報錯" }
    }

    Run-ScenarioTest "TC-08" "外鍵約束數量不符 (實際 45，預期 47，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario FkCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "外鍵約束數量不符") { throw "未輸出外鍵數量不符報錯" }
    }

    Run-ScenarioTest "TC-09" "索引總數不符 (實際 130，預期 133，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario IndexCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "索引總數不符") { throw "未輸出索引總數不符報錯" }
    }

    Run-ScenarioTest "TC-10" "未驗證外鍵約束不為 0 (存在 1 個約束未驗證，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario UnvalFkMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "未生效或未驗證之外鍵約束") { throw "未輸出未驗證外鍵報錯" }
    }

    Run-ScenarioTest "TC-11" "Prisma 遷移紀錄不符 (實際 1 筆，預期 2 筆，判定 FAIL)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario MigrationCountMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "數值不符不得輸出 PASS" }
        if ($res.Output -notmatch "Prisma 遷移紀錄數量不符") { throw "未輸出遷移紀錄不符報錯" }
    }

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

    Run-ScenarioTest "TC-14" "目標資料庫已存在時安全中止 (防覆寫保護)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbExistsAbort"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "資料庫已存在時不應輸出 PASS" }
        if ($res.Output -notmatch "目標資料庫.*已存在！依防覆寫規範立即終止") { throw "未觸發防覆寫報錯" }
    }

    Run-ScenarioTest "TC-15" "本機暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario LocalCleanupFail"))
        if ($res.ExitCode -ne 2) { throw "預期 ExitCode 為 2 (PARTIAL PASS / CLEANUP WARNING)，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "清理失敗時不得輸出完整 PASS" }
        if ($res.Output -notmatch "PARTIAL PASS \(CLEANUP WARNING\)") { throw "未輸出清理警告標記" }
        if ($res.Output -notmatch "本機解密暫存檔清理失敗") { throw "未明確指出本機檔案清理失敗" }
    }

    Run-ScenarioTest "TC-16" "容器暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario ContainerCleanupFail"))
        if ($res.ExitCode -ne 2) { throw "預期 ExitCode 為 2，實際為 $($res.ExitCode)。輸出：$($res.Output)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "清理失敗不得輸出完整 PASS" }
        if ($res.Output -notmatch "沙盒容器暫存檔清理失敗") { throw "未明確指出容器暫存檔清理失敗" }
    }

    Run-ScenarioTest "TC-17" "解密失敗時不誤刪原始備份 (原始 .dump 與 .c2kb 完好)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario NodeDecryptFail"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1" }
        if (-not (Test-Path $testEnc)) { throw "原始 C2KB 檔案遭意外刪除！" }
        if (-not (Test-Path $testOrig)) { throw "原始 Dump 檔案遭意外刪除！" }
    }

    Run-ScenarioTest "TC-18" "雜湊比對不符時終止 (HASH MISMATCH 絕對不輸出 PASS)" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario HashMismatch"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 為 1，實際為 $($res.ExitCode)" }
        if ($res.Output -match "Phase 3-C-10 還原驗收【PASS】") { throw "雜湊不符絕對不得輸出 PASS" }
        if ($res.Output -notmatch "解密資料雜湊與指定原始 SHA-256 不符") { throw "未輸出雜湊不符報錯" }
    }

    # =========================================================================
    # 第二部分：Phase 3-C-11F TOC 精準過濾與編碼驗證 (TC-19 ~ TC-26)
    # =========================================================================

    Run-ScenarioTest "TC-19" "TOC 精準過濾：排除 10 個 Vault ID、保留 916 項、337 public、無 BOM、純 LF、原始 TOC 完好" {
        $rawPath = Join-Path $testBaseDir "tc19_raw.toc"
        $outPath = Join-Path $testBaseDir "tc19_filtered.list"
        New-MockRawTocFile -Path $rawPath -UseCrLf $true  # 輸入就算含 CRLF，輸出也必須強制轉為純 LF 無 BOM
        $rawBytesBefore = [System.IO.File]::ReadAllBytes($rawPath)

        $summary = Invoke-StrictTocFilterAndVerify -RawTocPath $rawPath -FilteredTocPath $outPath
        if ($summary.RawActiveCount -ne 926) { throw "預期 RawActiveCount=926，實際 $($summary.RawActiveCount)" }
        if ($summary.ExcludedCount -ne 10) { throw "預期 ExcludedCount=10，實際 $($summary.ExcludedCount)" }
        if ($summary.RetainedActiveCount -ne 916) { throw "預期 RetainedActiveCount=916，實際 $($summary.RetainedActiveCount)" }
        if ($summary.PublicCount -ne 337) { throw "預期 PublicCount=337，實際 $($summary.PublicCount)" }

        $outBytes = [System.IO.File]::ReadAllBytes($outPath)
        if ($outBytes.Length -ge 3 -and $outBytes[0] -eq 0xEF -and $outBytes[1] -eq 0xBB -and $outBytes[2] -eq 0xBF) {
            throw "輸出清單檔錯誤包含 UTF-8 BOM！"
        }
        if ([Array]::IndexOf($outBytes, [byte]0x0D) -ge 0) {
            throw "輸出清單檔錯誤包含 CR (0x0D)！"
        }
        if ([Array]::IndexOf($outBytes, [byte]0x0A) -lt 0) {
            throw "輸出清單檔未包含 LF (0x0A)！"
        }

        $outText = [System.Text.Encoding]::UTF8.GetString($outBytes)
        foreach ($exId in @(5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998)) {
            if ($outText -match "(?m)^$exId;\s") {
                throw "已排除之 Vault TOC ID $exId 仍出現於輸出檔案！"
            }
        }
        foreach ($reqExt in @("pg_stat_statements", "pgcrypto", "uuid-ossp")) {
            if ($outText -notmatch [regex]::Escape($reqExt)) {
                throw "必要擴充套件 '$reqExt' 未保留於輸出清單！"
            }
        }
        $rawBytesAfter = [System.IO.File]::ReadAllBytes($rawPath)
        if ($rawBytesBefore.Length -ne $rawBytesAfter.Length) {
            throw "原始 TOC 檔遭到更改！"
        }
    }

    Run-ScenarioTest "TC-20" "TOC 支援 pg_restore --list (919 -> 909) 且拒絕非預期總數 (920)" {
        $raw919 = Join-Path $testBaseDir "tc20_919.toc"
        $out919 = Join-Path $testBaseDir "tc20_909.list"
        New-MockRawTocFile -Path $raw919 -IncludeSessionHeaderEntries $false
        $res919 = Invoke-StrictTocFilterAndVerify -RawTocPath $raw919 -FilteredTocPath $out919
        if ($res919.RawActiveCount -ne 919 -or $res919.RetainedActiveCount -ne 909 -or $res919.PublicCount -ne 337) {
            throw "919->909 驗證結果不符：$($res919 | ConvertTo-Json -Compress)"
        }

        $raw920 = Join-Path $testBaseDir "tc20_920.toc"
        New-MockRawTocFile -Path $raw920 -IncludeSessionHeaderEntries $false -ExtraLines @("9999; 1259 99999 TABLE auth extra_unexpected postgres")
        $res920 = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess") | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $raw920 })
        if ($res920.ExitCode -ne 1) { throw "異常總數 920 應失敗 (ExitCode 1)，實際為 $($res920.ExitCode)" }
        if ($res920.Output -notmatch "\[TOC COUNT ERROR\]") { throw "未觸發 [TOC COUNT ERROR]" }
    }

    Run-ScenarioTest "TC-21" "TOC 缺少目標 Vault ID (如遺漏 3777) 時必須中止" {
        $tocMissing = Join-Path $testBaseDir "tc21_missing_3777.toc"
        New-MockRawTocFile -Path $tocMissing -OmitIds @(3777)
        $argsList = $baseArgs | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $tocMissing }
        $res = Invoke-RestoreScript ($argsList + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 1) { throw "缺少 ID 時預期 ExitCode 1，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "\[TOC MISSING ERROR\]") { throw "未捕捉到 [TOC MISSING ERROR]：$($res.Output)" }
    }

    Run-ScenarioTest "TC-22" "TOC ID 物件簽章不符 (如 ID 5 被換成非 supabase_vault) 時必須中止" {
        $tocBadSig = Join-Path $testBaseDir "tc22_bad_sig.toc"
        New-MockRawTocFile -Path $tocBadSig -OverrideLineById @{ 5 = "5; 3079 16476 EXTENSION - malicious_other_ext " }
        $argsList = $baseArgs | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $tocBadSig }
        $res = Invoke-RestoreScript ($argsList + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 1) { throw "簽章不符預期 ExitCode 1，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "\[TOC SIGNATURE ERROR\]") { throw "未捕捉到 [TOC SIGNATURE ERROR]：$($res.Output)" }
    }

    Run-ScenarioTest "TC-23" "TOC 出現重複 ID 時必須中止" {
        $tocDup = Join-Path $testBaseDir "tc23_dup.toc"
        New-MockRawTocFile -Path $tocDup -ExtraLines @("101; 1259 20001 TABLE public duplicate_entry postgres")
        $argsList = $baseArgs | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $tocDup }
        $res = Invoke-RestoreScript ($argsList + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 1) { throw "重複 ID 預期 ExitCode 1，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "\[TOC DUPLICATE ERROR\]") { throw "未捕捉到 [TOC DUPLICATE ERROR]：$($res.Output)" }
    }

    Run-ScenarioTest "TC-24" "public 核心物件數不為 337 (如 336) 或漏列 Vault 物件時必須中止" {
        $toc336 = Join-Path $testBaseDir "tc24_pub336.toc"
        New-MockRawTocFile -Path $toc336 -PublicCount 336 -ExtraLines @("1999; 1259 39999 TABLE auth filler_keep_926 postgres")
        $argsPub = $baseArgs | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $toc336 }
        $resPub = Invoke-RestoreScript ($argsPub + @("-MockScenario AllSuccess"))
        if ($resPub.ExitCode -ne 1 -or $resPub.Output -notmatch "\[TOC PUBLIC ERROR\]") {
            throw "public=336 應觸發 [TOC PUBLIC ERROR] 並 ExitCode 1，實際 $($resPub.ExitCode)"
        }

        $tocExtraVault = Join-Path $testBaseDir "tc24_extra_vault.toc"
        New-MockRawTocFile -Path $tocExtraVault -ExtraLines @("5001; 1259 49999 TABLE vault hidden_vault_obj postgres")
        $argsV = $baseArgs | ForEach-Object { $_ -replace [regex]::Escape($validToc926), $tocExtraVault }
        $resV = Invoke-RestoreScript ($argsV + @("-MockScenario AllSuccess"))
        if ($resV.ExitCode -ne 1 -or $resV.Output -notmatch "\[TOC UNEXPECTED VAULT ERROR\]") {
            throw "未預期之 vault 物件應觸發 [TOC UNEXPECTED VAULT ERROR] 並 ExitCode 1"
        }
    }

    Run-ScenarioTest "TC-25" "TOC 輸出若含 UTF-8 BOM 時寫入後驗證必失敗" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario InjectTocBom"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 1，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "\[TOC ENCODING ERROR\]") { throw "未捕捉到 [TOC ENCODING ERROR]" }
    }

    Run-ScenarioTest "TC-26" "TOC 輸出若含 CRLF (0x0D) 時寫入後驗證必失敗" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario InjectTocCrLf"))
        if ($res.ExitCode -ne 1) { throw "預期 ExitCode 1，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "\[TOC NEWLINE ERROR\]") { throw "未捕捉到 [TOC NEWLINE ERROR]" }
    }

    # =========================================================================
    # 第三部分：目標資料庫名稱防覆寫保護與還原流程參數驗證 (TC-27 ~ TC-33)
    # =========================================================================

    Run-ScenarioTest "TC-27" "預設目標資料庫名稱為全新獨立測試庫 code_to_know_c2kb_prod_restore_clean_v2" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 0，實際 $($res.ExitCode)" }
        if ($res.Output -notmatch "目標測試資料庫名稱驗證通過：code_to_know_c2kb_prod_restore_clean_v2") {
            throw "預設目標資料庫不是 code_to_know_c2kb_prod_restore_clean_v2"
        }
    }

    Run-ScenarioTest "TC-28" "拒絕指定舊部分還原庫 code_to_know_c2kb_prod_restore_test 或保留系統庫" {
        foreach ($blockedDb in @("code_to_know_c2kb_prod_restore_test", "code_to_know_cloud_restore_test", "code_to_know", "postgres", "template0", "template1")) {
            $res = Invoke-RestoreScript ($baseArgs + @("-TargetDatabase `"$blockedDb`"", "-MockScenario AllSuccess"))
            if ($res.ExitCode -ne 1) { throw "使用封鎖資料庫 '$blockedDb' 時應被拒絕 (ExitCode 1)，實際為 $($res.ExitCode)" }
            if ($res.Output -notmatch "\[DB SAFETY ERROR\]") { throw "拒絕 '$blockedDb' 時未輸出 [DB SAFETY ERROR]" }
        }
    }

    Run-ScenarioTest "TC-29" "拒絕空值、不安全格式或含 SQL 注入字元之目標資料庫名稱 (Fail-Fast)" {
        foreach ($badDb in @("", "UPPER_CASE_DB", "db;DROP DATABASE postgres;--", "ab", "valid_name with_space")) {
            $res = Invoke-RestoreScript ($baseArgs + @("-TargetDatabase `"$badDb`"", "-MockScenario AllSuccess"))
            if ($res.ExitCode -ne 1) { throw "非法名稱 '$badDb' 應回傳 ExitCode 1，實際為 $($res.ExitCode)" }
            if ($res.Output -notmatch "\[DB SAFETY ERROR\]") { throw "非法名稱 '$badDb' 未觸發 [DB SAFETY ERROR]" }
        }
    }

    Run-ScenarioTest "TC-30" "絕對不包含自動 DROP DATABASE 指令，且失敗時明確標示保留部分還原庫" {
        $rawScriptContent = Get-Content -Path $scriptUnderInspection -Raw -Encoding UTF8
        if ($rawScriptContent -match '(?i)DROP\s+DATABASE') {
            throw "腳本中出現不允許之 DROP DATABASE SQL 語句！"
        }
        $resFail = Invoke-RestoreScript ($baseArgs + @("-MockScenario PgRestoreExit1"))
        if ($resFail.ExitCode -ne 1) { throw "預期 ExitCode 1" }
        if ($resFail.Output -notmatch "保留部分還原資料庫供除錯" -or $resFail.Output -notmatch "code_to_know_c2kb_prod_restore_clean_v2") {
            throw "失敗後未輸出保留部分還原資料庫之警示"
        }
    }

    Run-ScenarioTest "TC-31" "pg_restore 參數含 -L、--no-owner、--no-acl，不含 -N vault，且保留 #4698 警示不忽略" {
        $argsBuilt = Get-PgRestoreArguments -ContainerName "c" -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2" -ContainerTocListPath "/tmp/a.list" -ContainerDumpPath "/tmp/a.dump"
        $joined = $argsBuilt -join " "
        if ($joined -notmatch "--no-owner" -or $joined -notmatch "--no-acl" -or $joined -notmatch "-L /tmp/a\.list" -or $joined -notmatch "-d code_to_know_c2kb_prod_restore_clean_v2") {
            throw "Get-PgRestoreArguments 缺少必要參數：$joined"
        }
        if ($joined -match "(^|\s)-N(\s|$)" -or $joined -match "vault") {
            throw "Get-PgRestoreArguments 不應包含 -N vault：$joined"
        }

        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 0" }
        if ($res.Output -notmatch "PG_RESTORE ARGS: docker exec -i code_to_know_pg17_restore_sandbox pg_restore -U postgres -d code_to_know_c2kb_prod_restore_clean_v2 -v --no-owner --no-acl -L /tmp/restore_toc_.*\.list /tmp/restore_verify_.*\.dump") {
            throw "實際輸出之 PG_RESTORE ARGS 不符預期！輸出：$($res.Output)"
        }
        if ($res.Output -notmatch "#4698 PUBLICATION supabase_realtime") {
            throw "未輸出 #4698 PUBLICATION supabase_realtime 不預先忽略說明"
        }
    }

    Run-ScenarioTest "TC-32" "正常成功執行後自動清除本次暫存檔，但完整保留測試輸入檔案與 TOC 來源" {
        $tc32Dir = Join-Path $testBaseDir "tc32_isolated"
        New-Item -ItemType Directory -Path $tc32Dir -Force | Out-Null
        $tc32Enc = Join-Path $tc32Dir "tc32.dump.c2kb"
        $tc32Orig = Join-Path $tc32Dir "tc32.dump"
        $tc32Toc = Join-Path $tc32Dir "tc32.toc"
        Copy-Item -Path $testEnc -Destination $tc32Enc -Force
        Copy-Item -Path $testOrig -Destination $tc32Orig -Force
        Copy-Item -Path $validToc926 -Destination $tc32Toc -Force

        $beforeFiles = Get-ChildItem -Path $tc32Dir | Where-Object { $_.Name -like "c2k_restore_*" }
        if ($beforeFiles.Count -ne 0) { throw "測試前已殘留 c2k_restore_* 暫存檔" }

        $tc32Args = @(
            "-EncryptedBackupPath `"$tc32Enc`"",
            "-OriginalDumpPath `"$tc32Orig`"",
            "-ExpectedSha256 `"$dummyHash`"",
            "-EncryptionKey `"$dummyKey`"",
            "-MockRawTocPath `"$tc32Toc`"",
            "-NonInteractive",
            "-MockScenario AllSuccess"
        )
        $res = Invoke-RestoreScript $tc32Args
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 0，實際 $($res.ExitCode)" }

        $afterTemp = Get-ChildItem -Path $tc32Dir | Where-Object { $_.Name -like "c2k_restore_*" }
        if ($afterTemp.Count -ne 0) { throw "腳本執行後殘留本機暫存檔：$($afterTemp.Name -join ', ')" }
        if (-not (Test-Path $tc32Enc) -or -not (Test-Path $tc32Orig) -or -not (Test-Path $tc32Toc)) {
            throw "測試輸入檔案遭誤刪！"
        }
    }

    Run-ScenarioTest "TC-33" "100% 離線隔離檢查：Mock 執行不得透過任何外部連線或修改正式備份" {
        $prodBackupDir = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519"
        $prodDump = Join-Path $prodBackupDir "code_to_know_supabase_prod.dump"
        $prodC2kb = Join-Path $prodBackupDir "code_to_know_supabase_prod.dump.c2kb"
        $beforeDumpWrite = if (Test-Path $prodDump) { (Get-Item $prodDump).LastWriteTimeUtc } else { $null }
        $beforeC2kbWrite = if (Test-Path $prodC2kb) { (Get-Item $prodC2kb).LastWriteTimeUtc } else { $null }

        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario AllSuccess"))
        if ($res.ExitCode -ne 0) { throw "預期 ExitCode 0" }
        if ($null -ne $beforeDumpWrite -and (Get-Item $prodDump).LastWriteTimeUtc -ne $beforeDumpWrite) {
            throw "離線測試期間正式 .dump 修改時間異動！"
        }
        if ($null -ne $beforeC2kbWrite -and (Get-Item $prodC2kb).LastWriteTimeUtc -ne $beforeC2kbWrite) {
            throw "離線測試期間正式 .c2kb 修改時間異動！"
        }
    }

    # =========================================================================
    # 第四部分：Phase 3-C-11G 資料庫狀態查詢 fail-closed 完整測試 (TC-34 ~ TC-37)
    # =========================================================================

    function Assert-AbortedBeforeDecryptCreateRestore {
        param (
            [Parameter(Mandatory = $true)]$RunResult,
            [Parameter(Mandatory = $true)][string]$ExpectedPattern
        )
        if ($RunResult.ExitCode -ne 1) {
            throw "預期 ExitCode 為 1，實際為 $($RunResult.ExitCode)"
        }
        if ($RunResult.Output -match "Phase 3-C-10 還原驗收【PASS】") {
            throw "失敗時絕對不得輸出 PASS"
        }
        if ($RunResult.Output -notmatch $ExpectedPattern) {
            throw "未輸出預期報錯 ($ExpectedPattern)。實際輸出：$($RunResult.Output)"
        }
        if ($RunResult.Output -match "執行 C2KB 容器認證解密|解密成功") {
            throw "資料庫檢查失敗後不得進入備份解密階段！"
        }
        if ($RunResult.Output -match "建立全新獨立測試庫|建立完成") {
            throw "資料庫檢查失敗後不得建立資料庫！"
        }
        if ($RunResult.Output -match "PG_RESTORE ARGS|pg_restore 原生還原成功") {
            throw "資料庫檢查失敗後不得執行 pg_restore！"
        }
    }

    Run-ScenarioTest "TC-34" "psql 查詢執行失敗：立即 fail-closed 拒絕且不解密、不建庫、不執行 pg_restore" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbQueryExecFail"))
        Assert-AbortedBeforeDecryptCreateRestore -RunResult $res -ExpectedPattern "\[DB CHECK ERROR\].*查詢命令失敗"
    }

    Run-ScenarioTest "TC-35" "psql Exit Code 非 0：立即 fail-closed 拒絕且不解密、不建庫、不執行 pg_restore" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbQueryNonZeroExit"))
        Assert-AbortedBeforeDecryptCreateRestore -RunResult $res -ExpectedPattern "\[DB CHECK ERROR\].*psql ExitCode: 2"

        $threwNonZero = $false
        try {
            Assert-TargetDatabaseAbsentResult -PsqlExitCode 1 -QueryOutput "" -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2"
        } catch {
            $threwNonZero = ($_.Exception.Message -match "psql ExitCode: 1")
        }
        if (-not $threwNonZero) { throw "Assert-TargetDatabaseAbsentResult 對 ExitCode 1 未拋錯！" }
    }

    Run-ScenarioTest "TC-36" "查詢結果無法辨識：立即 fail-closed 拒絕；並確認空白/null/0 放行與 1 拒絕" {
        $res = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbQueryUnrecognized"))
        Assert-AbortedBeforeDecryptCreateRestore -RunResult $res -ExpectedPattern "\[DB CHECK ERROR\].*無法辨識"

        # 確認正常資料庫不存在結果 ("", $null, "0") 放行
        Assert-TargetDatabaseAbsentResult -PsqlExitCode 0 -QueryOutput "" -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2"
        Assert-TargetDatabaseAbsentResult -PsqlExitCode 0 -QueryOutput $null -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2"
        Assert-TargetDatabaseAbsentResult -PsqlExitCode 0 -QueryOutput "0" -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2"

        # 確認無法辨識輸出 ("ERROR: timeout", "2") 與已存在 ("1") 立即拒絕
        foreach ($badOut in @("1", "2", "ERROR: server closed connection")) {
            $rejected = $false
            try {
                Assert-TargetDatabaseAbsentResult -PsqlExitCode 0 -QueryOutput $badOut -DatabaseName "code_to_know_c2kb_prod_restore_clean_v2"
            } catch {
                $rejected = $true
            }
            if (-not $rejected) { throw "對異常查詢輸出 '$badOut' 未觸發 fail-closed 拒絕！" }
        }
    }

    Run-ScenarioTest "TC-37" "Docker 檢查失敗與目標庫已存在時，同樣阻斷於解密、建庫與 pg_restore 之前" {
        $resDocker = Invoke-RestoreScript ($baseArgs + @("-MockScenario DockerCheckFail"))
        Assert-AbortedBeforeDecryptCreateRestore -RunResult $resDocker -ExpectedPattern "\[DOCKER ERROR\]"

        $resExists = Invoke-RestoreScript ($baseArgs + @("-MockScenario DbExistsAbort"))
        Assert-AbortedBeforeDecryptCreateRestore -RunResult $resExists -ExpectedPattern "\[ABORT: DB EXISTS\]"
    }
}
finally {
    if (Test-Path $testBaseDir) {
        Remove-Item -Path $testBaseDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  測試總結：$passCount / $totalTests 個案例全數通過！ (失敗: $failCount)" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan

if ($failCount -gt 0) {
    exit 1
}
else {
    exit 0
}
