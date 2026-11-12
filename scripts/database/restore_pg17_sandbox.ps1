<#
.SYNOPSIS
    CODE TO KNOW - 正式 Supabase PostgreSQL 17 C2KB 加密備份解密與沙盒還原驗收腳本
.DESCRIPTION
    本腳本負責執行 Phase 3-C-11F 安全修正後之 PG17 還原驗收作業：
    1. 嚴格驗證目標資料庫名稱（預設 code_to_know_c2kb_prod_restore_clean_v2，拒絕舊庫與危險識別字）。
    2. 透過遮罩輸入取得 AES-256-GCM 64 字元 Hex 主金鑰。
    3. 驗證 C2KB 容器二進位格式與 16-byte GCM AuthTag 認證解密。
    4. 比對解密 Dump 與指定原始明文 Dump 之 SHA-256 數位指紋 (全字元完全相符)。
    5. 產生原始 TOC 清單並以結構化 ID + 物件簽章精準排除 10 個 Supabase Vault 項目，
       輸出 UTF-8 無 BOM、LF 換行之 -L 清單檔，寫入後重讀驗證編碼、筆數與核心物件保留。
       (保留原始 TOC 不改寫；不以 -N vault 取代精確 TOC 過濾。)
    6. 於獨立 PG17 沙盒 (code_to_know_pg17_restore_sandbox) 建立全新獨立測試資料庫。
    7. 透過原生 pg_restore (--no-owner --no-acl -L <toc_list>) 執行還原，嚴格檢查退出碼為 0。
       說明：對於 #4698 (PUBLICATION supabase_realtime) 在 wal_level=replica 下可能產生的
       warning，本腳本不預先忽略，亦不把任何警告或 Exit Code 1 當成成功；實際 Exit Code 須由正式執行確認。
    8. 程式化斷言五大核心結構指標 (37 表、47 外鍵、133 索引、0 未驗證約束、2 遷移紀錄)。
    9. 獨立執行容器內部與本地暫存檔清理，並依 SEC-01 精確復原環境變數。

    安全防護規範：
    - SEC-01: 環境變數生命週期精準復原，不破壞呼叫端既有變數。
    - ROB-01: 所有原生外部命令 (Docker, Node, pg_restore, psql) 均嚴格檢查 $LASTEXITCODE。
    - VRF-01: 完整性程式化斷言，任何指標不符立即報錯中斷，絕不將部分還原誤判為 PASS。
    - SEM-01: 明確區分未驗證外鍵約束與孤立資料。
    - TMP-01: 動態隨機唯一暫存檔名，解密前防覆寫，失敗時保留原始備份。
    - FIX-05: 分別檢查本地與容器清理結果，清理失敗回報非 0 退出碼並警示機敏風險。
    - FIX-06: 失敗時明確標註部分還原資料庫狀態，絕不自動誤刪既有資料庫。
    - TOC-01: 精準排除 10 筆 Vault TOC 項目並驗證 UTF-8 無 BOM / LF 編碼與 337 項 public 核心保留。
#>

[CmdletBinding()]
param (
    [string]$EncryptedBackupPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb",
    [string]$OriginalDumpPath    = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump",
    [string]$ExpectedSha256      = "2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50",
    [string]$ExpectedCiphertextSha256 = "",
    [string]$SandboxContainer    = "code_to_know_pg17_restore_sandbox",
    [string]$TargetDatabase      = "code_to_know_c2kb_prod_restore_clean_v2",
    [string]$EncryptionKey       = $null,
    [switch]$NonInteractive,
    [string]$MockScenario        = "None",
    [string]$MockRawTocPath      = $null
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

# =========================================================================
# 安全輔助函式區
# =========================================================================

function Assert-SafeTargetDatabaseName {
    param (
        [string]$DatabaseName
    )

    if ([string]::IsNullOrWhiteSpace($DatabaseName)) {
        throw "[DB SAFETY ERROR] 目標資料庫名稱不可為空白！"
    }

    # 嚴格限制僅允許小寫英數字與底線，長度 3~63，防範 SQL 識別字注入或危險字元
    if ($DatabaseName -cnotmatch '^[a-z][a-z0-9_]{2,62}$') {
        throw "[DB SAFETY ERROR] 目標資料庫名稱格式不安全或不合規範：'$DatabaseName'（僅允許小寫英文字母開頭，含 a-z0-9_，長度 3~63）。"
    }

    # 明確封鎖系統庫、開發庫與舊版部分還原庫，嚴禁預設或重複覆用
    $blockedNames = @(
        "code_to_know_c2kb_prod_restore_test",
        "code_to_know_cloud_restore_test",
        "code_to_know",
        "postgres",
        "template0",
        "template1"
    )
    if ($blockedNames -contains $DatabaseName) {
        throw "[DB SAFETY ERROR] 禁止使用保留或舊版部分還原資料庫作為目標：'$DatabaseName'！請使用全新獨立測試庫名稱。"
    }
}

function Assert-TargetDatabaseAbsentResult {
    param (
        [int]$PsqlExitCode,
        [string]$QueryOutput,
        [string]$DatabaseName
    )

    if ($PsqlExitCode -ne 0) {
        throw "[DB CHECK ERROR] 無法連線或查詢沙盒資料庫狀態 (psql ExitCode: $PsqlExitCode)！採 fail-closed 原則立即中止。"
    }

    $trimmed = if ($null -eq $QueryOutput) { "" } else { $QueryOutput.Trim() }

    if ($trimmed -eq "1") {
        throw "[ABORT: DB EXISTS] 目標資料庫 '$DatabaseName' 已存在！依防覆寫規範立即終止！"
    }

    # 僅允許查詢無結果 ("") 或測試用未建立標記 ("0") 繼續；任何無法辨識輸出立即 fail-closed
    if ($trimmed -ne "" -and $trimmed -ne "0") {
        throw "[DB CHECK ERROR] 目標資料庫狀態查詢結果無法辨識：'$trimmed'！採 fail-closed 原則立即中止。"
    }
}

function Get-PgRestoreArguments {
    param (
        [Parameter(Mandatory = $true)][string]$ContainerName,
        [Parameter(Mandatory = $true)][string]$DatabaseName,
        [Parameter(Mandatory = $true)][string]$ContainerTocListPath,
        [Parameter(Mandatory = $true)][string]$ContainerDumpPath
    )

    # 嚴格使用 -L 精準清單，保留 --no-owner --no-acl，絕不使用 -N vault 替代
    return @(
        "exec", "-i", $ContainerName,
        "pg_restore",
        "-U", "postgres",
        "-d", $DatabaseName,
        "-v",
        "--no-owner",
        "--no-acl",
        "-L", $ContainerTocListPath,
        $ContainerDumpPath
    )
}

function Test-IsPublicCoreTocBody {
    param ([string]$Body)
    # TOC 主體格式：<DESC> <NAMESPACE> <TAG>...
    # public 核心項目之 namespace 欄位必為 'public'（不含 ACL - SCHEMA public，其 namespace 為 '-'）
    return ($Body -cmatch '^[A-Z]+(?: [A-Z]+)*\s+public\s+')
}

function Test-IsVaultOrSupabaseVaultBody {
    param ([string]$Body)
    if ($Body -cmatch '^SCHEMA\s+-\s+vault\b') { return $true }
    if ($Body -cmatch '^ACL\s+-\s+SCHEMA\s+vault\b') { return $true }
    if ($Body -cmatch '^EXTENSION\s+-\s+supabase_vault\b') { return $true }
    if ($Body -cmatch '^COMMENT\s+-\s+EXTENSION\s+supabase_vault\b') { return $true }
    if ($Body -cmatch '^[A-Z]+(?: [A-Z]+)*\s+vault\s+') { return $true }
    return $false
}

function Parse-AndVerifyFilteredToc {
    param (
        [string[]]$Lines,
        [int[]]$ExpectedExcludedIds,
        [hashtable]$ExpectedSignatures,
        [int]$ExpectedPublicCount = 337
    )

    $seenIds = @{}
    $matchedExcluded = @{}
    $retainedLines = New-Object System.Collections.Generic.List[string]
    $retainedExtensions = New-Object System.Collections.Generic.List[string]
    $rawActiveCount = 0
    $retainedActiveCount = 0
    $rawPublicCount = 0
    $retainedPublicCount = 0

    foreach ($rawLine in $Lines) {
        $line = $rawLine.TrimEnd("`r")
        if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith(";")) {
            $retainedLines.Add($line)
            continue
        }

        if ($line -notmatch '^(\d+);\s+\d+\s+\d+\s+(.+)$') {
            throw "[TOC PARSE ERROR] 發現無法解析之非註解 TOC 項目行：'$line'"
        }

        $tocId = [int]$Matches[1]
        $body = $Matches[2]
        $rawActiveCount++

        if ($seenIds.ContainsKey($tocId)) {
            throw "[TOC DUPLICATE ERROR] 偵測到重複的 TOC ID：$tocId"
        }
        $seenIds[$tocId] = $true

        $isPublic = Test-IsPublicCoreTocBody -Body $body
        if ($isPublic) {
            $rawPublicCount++
        }

        if ($ExpectedSignatures.ContainsKey($tocId)) {
            $sigPattern = $ExpectedSignatures[$tocId]
            if ($body -cnotmatch $sigPattern) {
                throw "[TOC SIGNATURE ERROR] TOC ID $tocId 物件簽章不符！實際內容：'$body'，預期匹配：'$sigPattern'"
            }
            if ($isPublic) {
                throw "[TOC SAFETY ERROR] 排除名單中的 TOC ID $tocId 不得屬於 public 核心物件！"
            }
            $matchedExcluded[$tocId] = $body
            continue
        }

        # 防呆：不得遺漏預期清單之外的 vault / supabase_vault 項目
        if (Test-IsVaultOrSupabaseVaultBody -Body $body) {
            throw "[TOC UNEXPECTED VAULT ERROR] 偵測到預期 10 筆清單以外之 Vault 相關 TOC 項目 (ID: $tocId)：'$body'"
        }

        if ($body -cmatch '^(?:EXTENSION|COMMENT\s+-\s+EXTENSION)\s+-\s+(.+)$') {
            $retainedExtensions.Add("${tocId}: $($Matches[1].Trim())")
        }

        $retainedLines.Add($line)
        $retainedActiveCount++
        if ($isPublic) {
            $retainedPublicCount++
        }
    }

    # 驗證 10 個目標 ID 必須全部存在並匹配
    $missingIds = @($ExpectedExcludedIds | Where-Object { -not $matchedExcluded.ContainsKey($_) })
    if ($missingIds.Count -gt 0) {
        throw "[TOC MISSING ERROR] 原始 TOC 缺少應排除之 Vault TOC ID：$($missingIds -join ', ')"
    }

    if ($matchedExcluded.Count -ne $ExpectedExcludedIds.Count) {
        throw "[TOC COUNT ERROR] 排除項目數不符！實際排除：$($matchedExcluded.Count)，預期：$($ExpectedExcludedIds.Count)。"
    }

    # 驗證保留筆數：PGDMP 完整 926 筆（排除 10 筆 -> 916 筆）或 pg_restore --list 省略 7 筆 DB/Session 標頭之 919 筆（排除 10 筆 -> 909 筆）
    $validCountPairs = @(
        @{ Raw = 926; Retained = 916 },
        @{ Raw = 919; Retained = 909 }
    )
    $isCountValid = $false
    foreach ($pair in $validCountPairs) {
        if ($rawActiveCount -eq $pair.Raw -and $retainedActiveCount -eq $pair.Retained) {
            $isCountValid = $true
            break
        }
    }
    if (-not $isCountValid) {
        throw "[TOC COUNT ERROR] TOC 保留項目數與預期不符！原始有效項：$rawActiveCount，保留有效項：$retainedActiveCount（預期 926->916 或 pg_restore --list 輸出 919->909）。"
    }

    if ($rawPublicCount -ne $ExpectedPublicCount -or $retainedPublicCount -ne $ExpectedPublicCount) {
        throw "[TOC PUBLIC ERROR] public 核心項目數量不符！原始：$rawPublicCount，保留：$retainedPublicCount，預期：$ExpectedPublicCount。"
    }

    # 驗證其他必要擴充套件未被誤刪
    $extJoined = ($retainedExtensions -join "`n")
    foreach ($reqExt in @("pg_stat_statements", "pgcrypto", "uuid-ossp")) {
        if ($extJoined -notmatch [regex]::Escape($reqExt)) {
            throw "[TOC EXTENSION ERROR] 必要通用擴充套件 '$reqExt' 未保留於過濾清單中！"
        }
    }

    return [PSCustomObject]@{
        RetainedLines      = $retainedLines.ToArray()
        RawActiveCount     = $rawActiveCount
        RetainedActiveCount = $retainedActiveCount
        ExcludedCount      = $matchedExcluded.Count
        PublicCount        = $retainedPublicCount
        RetainedExtensions = $retainedExtensions.ToArray()
    }
}

function Invoke-StrictTocFilterAndVerify {
    param (
        [Parameter(Mandatory = $true)][string]$RawTocPath,
        [Parameter(Mandatory = $true)][string]$FilteredTocPath,
        [string]$Scenario = "None"
    )

    if (-not (Test-Path $RawTocPath)) {
        throw "[TOC PATH ERROR] 找不到原始 TOC 清單檔：$RawTocPath"
    }

    $expectedExcludedIds = @(5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998)
    $expectedSignatures = @{
        5    = '^EXTENSION\s+-\s+supabase_vault\b'
        13   = '^SCHEMA\s+-\s+vault\b'
        3777 = '^TABLE DATA\s+vault\s+secrets\b'
        4791 = '^ACL\s+-\s+SCHEMA\s+vault\b'
        4794 = '^COMMENT\s+-\s+EXTENSION\s+supabase_vault\b'
        4888 = '^ACL\s+vault\s+FUNCTION\s+_crypto_aead_det_decrypt\('
        4889 = '^ACL\s+vault\s+FUNCTION\s+create_secret\('
        4890 = '^ACL\s+vault\s+FUNCTION\s+update_secret\('
        4997 = '^ACL\s+vault\s+TABLE\s+secrets\b'
        4998 = '^ACL\s+vault\s+TABLE\s+decrypted_secrets\b'
    }

    $rawBytesBefore = [System.IO.File]::ReadAllBytes($RawTocPath)
    $rawText = [System.Text.Encoding]::UTF8.GetString($rawBytesBefore)
    $rawLines = $rawText -split "`r?`n"
    if ($rawLines.Count -gt 0 -and [string]::IsNullOrEmpty($rawLines[-1])) {
        $rawLines = $rawLines[0..($rawLines.Count - 2)]
    }

    $parsed = Parse-AndVerifyFilteredToc -Lines $rawLines -ExpectedExcludedIds $expectedExcludedIds -ExpectedSignatures $expectedSignatures

    # 以 UTF-8 無 BOM + LF (\n) 寫入過濾後 -L 清單檔（不覆蓋原始 TOC 檔）
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $outputText = ($parsed.RetainedLines -join "`n") + "`n"

    if ($Scenario -eq "InjectTocBom") {
        $bomUtf8 = New-Object System.Text.UTF8Encoding($true)
        [System.IO.File]::WriteAllText($FilteredTocPath, $outputText, $bomUtf8)
    } elseif ($Scenario -eq "InjectTocCrLf") {
        [System.IO.File]::WriteAllText($FilteredTocPath, (($parsed.RetainedLines -join "`r`n") + "`r`n"), $utf8NoBom)
    } else {
        [System.IO.File]::WriteAllText($FilteredTocPath, $outputText, $utf8NoBom)
    }

    # 寫入後重新讀取並驗證編碼、換行、筆數及排除項目，同時確認原始 TOC 完好
    $writtenBytes = [System.IO.File]::ReadAllBytes($FilteredTocPath)
    if ($writtenBytes.Length -ge 3 -and $writtenBytes[0] -eq 0xEF -and $writtenBytes[1] -eq 0xBB -and $writtenBytes[2] -eq 0xBF) {
        throw "[TOC ENCODING ERROR] 過濾清單含 UTF-8 BOM 位元組，pg_restore -L 禁止使用 BOM！"
    }
    if ([Array]::IndexOf($writtenBytes, [byte]0x0D) -ge 0) {
        throw "[TOC NEWLINE ERROR] 過濾清單含 CR (0x0D / CRLF) 換行符，必須嚴格使用 Unix LF (\n)！"
    }

    $rereadText = $utf8NoBom.GetString($writtenBytes)
    $rereadLines = $rereadText -split "`n"
    if ($rereadLines.Count -gt 0 -and [string]::IsNullOrEmpty($rereadLines[-1])) {
        $rereadLines = $rereadLines[0..($rereadLines.Count - 2)]
    }

    $rereadActiveCount = 0
    $rereadPublicCount = 0
    foreach ($rLine in $rereadLines) {
        if ([string]::IsNullOrWhiteSpace($rLine) -or $rLine.StartsWith(";")) { continue }
        if ($rLine -notmatch '^(\d+);\s+\d+\s+\d+\s+(.+)$') {
            throw "[TOC RE-READ ERROR] 重讀過濾清單發現格式錯誤行：'$rLine'"
        }
        $rId = [int]$Matches[1]
        $rBody = $Matches[2]
        if ($expectedExcludedIds -contains $rId) {
            throw "[TOC RE-READ ERROR] 已排除之 Vault TOC ID ($rId) 仍殘留於過濾清單中！"
        }
        $rereadActiveCount++
        if (Test-IsPublicCoreTocBody -Body $rBody) {
            $rereadPublicCount++
        }
    }

    if ($rereadActiveCount -ne $parsed.RetainedActiveCount -or $rereadPublicCount -ne 337) {
        throw "[TOC RE-READ ERROR] 重讀過濾清單筆數驗證失敗！有效項：$rereadActiveCount (預期 $($parsed.RetainedActiveCount))，public：$rereadPublicCount (預期 337)。"
    }

    # 驗證原始 TOC 檔案未被修改
    $rawBytesAfter = [System.IO.File]::ReadAllBytes($RawTocPath)
    if ($rawBytesBefore.Length -ne $rawBytesAfter.Length) {
        throw "[TOC INTEGRITY ERROR] 原始 TOC 檔案長度於過濾過程中遭修改！"
    }

    return $parsed
}

# =========================================================================
# 主執行流程
# =========================================================================

# SEC-01: 記錄執行前環境變數狀態，確保 finally 區塊精確復原
$origKeyEnvExists = [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") -ne $null
$origKeyEnvValue  = if ($origKeyEnvExists) { [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") } else { $null }

$bstr = [IntPtr]::Zero
$activeKey = $EncryptionKey
$dbCreatedByThisRun = $false
$containerDumpCopied = $false
$containerTocCopied = $false
$verificationPassed = $false
$cleanupSucceeded = $true

# TMP-01: 建立動態唯一隨機名稱，杜絕固定檔名衝突
$tempId = "$([System.Diagnostics.Process]::GetCurrentProcess().Id)_$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())_$([System.IO.Path]::GetRandomFileName().Substring(0,6))"
$backupDir = if (Test-Path $EncryptedBackupPath) { [System.IO.Path]::GetDirectoryName([System.IO.Path]::GetFullPath($EncryptedBackupPath)) } else { [System.IO.Path]::GetTempPath() }
$decDump = Join-Path $backupDir "c2k_restore_verify_${tempId}.dump"
$rawTocPath = Join-Path $backupDir "c2k_restore_raw_${tempId}.toc"
$filteredTocPath = Join-Path $backupDir "c2k_restore_filtered_${tempId}.list"
$containerTmpDump = "/tmp/restore_verify_${tempId}.dump"
$containerTmpToc  = "/tmp/restore_toc_${tempId}.list"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CODE TO KNOW - Supabase C2KB 備份解密與 PG17 還原驗收" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

try {
    # -------------------------------------------------------------------------
    # 步驟 0: 目標資料庫名稱安全檢查 (Fail-Fast，於任何連線或解密前攔截)
    # -------------------------------------------------------------------------
    Assert-SafeTargetDatabaseName -DatabaseName $TargetDatabase
    Write-Host "目標測試資料庫名稱驗證通過：$TargetDatabase" -ForegroundColor Gray

    # -------------------------------------------------------------------------
    # 步驟 1: 取得並驗證 AES-256 主金鑰 (全程不落盤、不寫入日誌)
    # -------------------------------------------------------------------------
    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        if (-not $NonInteractive) {
            Write-Host "請輸入 KeePassXC 64 字元 Hex 主金鑰 (輸入全程遮罩隱藏)：" -ForegroundColor Yellow
            $sec = Read-Host -Prompt "Encryption Key" -AsSecureString
            if ($null -ne $sec -and $sec.Length -gt 0) {
                $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
                $activeKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
                [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
                $bstr = [IntPtr]::Zero
                $sec = $null
            }
        }
    }

    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        throw "[KEY ERROR] 未提供金鑰！請透過互動提示輸入或指定 -EncryptionKey 參數。"
    }

    # 格式預檢 (不顯示金鑰內容，不 trim 內容)
    if ($activeKey.Length -ne 64 -or ($activeKey -cnotmatch '^[0-9a-fA-F]{64}$')) {
        throw "[KEY ERROR] 金鑰格式不合！必須恰為 64 字元十六進位 Hex (當前長度: $($activeKey.Length))。"
    }

    # -------------------------------------------------------------------------
    # 步驟 2: 前置路徑與既有備份安全檢查 (FIX-04)
    # -------------------------------------------------------------------------
    Write-Host "`n[1/8] 執行備份檔案與目標環境前置檢查..." -ForegroundColor Green

    if ($MockScenario -eq "None") {
        if (-not (Test-Path $EncryptedBackupPath)) {
            throw "[PATH ERROR] 找不到 C2KB 加密備份檔案：$EncryptedBackupPath"
        }
        if (-not [string]::IsNullOrWhiteSpace($ExpectedCiphertextSha256)) {
            $cipherHash = (Get-FileHash -LiteralPath $EncryptedBackupPath -Algorithm SHA256).Hash.ToUpper()
            if (-not [string]::Equals($cipherHash, $ExpectedCiphertextSha256.ToUpper(), [System.StringComparison]::OrdinalIgnoreCase)) {
                throw "[HASH MISMATCH] 加密備份密文 SHA-256 與預期不符！實際: $cipherHash，預期: $ExpectedCiphertextSha256"
            }
            Write-Host "加密備份密文 SHA-256 驗證通過：$cipherHash" -ForegroundColor Gray
        }
    }

    # TMP-01: 解密前確認暫存檔絕不能預先存在，且不能與原始檔同名
    foreach ($tmpCandidate in @($decDump, $rawTocPath, $filteredTocPath)) {
        if (Test-Path $tmpCandidate) {
            throw "[TEMP FILE ERROR] 暫存檔案已預先存在，為防覆寫立即中止：$tmpCandidate"
        }
        if ((-not [string]::IsNullOrWhiteSpace($OriginalDumpPath) -and [string]::Equals([System.IO.Path]::GetFullPath($tmpCandidate), [System.IO.Path]::GetFullPath($OriginalDumpPath), [System.StringComparison]::OrdinalIgnoreCase)) -or
            [string]::Equals([System.IO.Path]::GetFullPath($tmpCandidate), [System.IO.Path]::GetFullPath($EncryptedBackupPath), [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "[SAFETY ERROR] 暫存檔路徑不可與原始 Dump 或加密備份同名！"
        }
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

    # 檢查目標資料庫是否已存在 (嚴禁覆寫，採 fail-closed 原則)
    $dbCheckOutput = ""
    $dbCheckExitCode = 0
    if ($MockScenario -eq "DbExistsAbort") {
        $dbCheckOutput = "1"
    } elseif ($MockScenario -eq "DbQueryExecFail") {
        throw "[DB CHECK ERROR] 執行資料庫狀態查詢命令失敗！(Simulated psql execution failure)"
    } elseif ($MockScenario -eq "DbQueryNonZeroExit") {
        $dbCheckExitCode = 2
        $dbCheckOutput = ""
    } elseif ($MockScenario -eq "DbQueryUnrecognized") {
        $dbCheckExitCode = 0
        $dbCheckOutput = "UNEXPECTED_PG_DATABASE_STATE"
    } elseif ($MockScenario -eq "None") {
        try {
            $rawDbCheck = docker exec -i $SandboxContainer psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$TargetDatabase';"
            $dbCheckExitCode = $LASTEXITCODE
            $dbCheckOutput = if ($null -eq $rawDbCheck) { "" } else { ($rawDbCheck | Out-String) }
        } catch {
            throw "[DB CHECK ERROR] 執行資料庫狀態查詢命令失敗：$($_.Exception.Message)"
        }
    } else {
        $dbCheckOutput = "0"
    }

    Assert-TargetDatabaseAbsentResult -PsqlExitCode $dbCheckExitCode -QueryOutput $dbCheckOutput -DatabaseName $TargetDatabase
    Write-Host "確認目標資料庫 '$TargetDatabase' 尚未建立，安全無虞。" -ForegroundColor Gray

    # -------------------------------------------------------------------------
    # 步驟 3: 執行 AES-256-GCM 認證解密 (驗證 16-byte AuthTag)
    # -------------------------------------------------------------------------
    Write-Host "`n[2/8] 執行 C2KB 容器認證解密 (驗證 16-byte AuthTag)..." -ForegroundColor Green

    if ($MockScenario -eq "NodeDecryptFail") {
        throw "[DECRYPT FAILED] AES-256-GCM 認證解密失敗或 AuthTag 不吻合！(Simulated Node auth tag error)"
    } elseif ($MockScenario -ne "None") {
        Set-Content -Path $decDump -Value "MOCK_DECRYPTED_POSTGRES_DUMP_CONTENT" -Encoding UTF8
    } else {
        $cryptoScript = Join-Path $PSScriptRoot "backup-crypto.cjs"
        if (-not (Test-Path $cryptoScript)) {
            $cryptoScript = "scripts/database/backup-crypto.cjs"
        }

        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName = "node"
        $psi.Arguments = "`"$cryptoScript`" decrypt --key-stdin -i `"$EncryptedBackupPath`" -o `"$decDump`""
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardInput = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

        $proc = $null
        $stdinWriter = $null
        try {
            $proc = [System.Diagnostics.Process]::Start($psi)
            $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
            $stdinWriter = [System.IO.StreamWriter]::new($proc.StandardInput.BaseStream, $utf8NoBom, 256, $false)
            $stdinWriter.NewLine = "`n"
            $stdinWriter.WriteLine($activeKey)
            $stdinWriter.Flush()
            $stdinWriter.Dispose()
            $stdinWriter = $null

            $nodeStdout = $proc.StandardOutput.ReadToEnd()
            $nodeStderr = $proc.StandardError.ReadToEnd()
            $proc.WaitForExit()
            $nodeExitCode = $proc.ExitCode
        } finally {
            $activeKey = $null
            if ($null -ne $stdinWriter) { $stdinWriter.Dispose() }
            if ($null -ne $proc) { $proc.Dispose() }
        }

        if (-not [string]::IsNullOrWhiteSpace($nodeStdout)) {
            Write-Host $nodeStdout.TrimEnd()
        }
        if (-not [string]::IsNullOrWhiteSpace($nodeStderr)) {
            Write-Host $nodeStderr.TrimEnd() -ForegroundColor Red
        }
        if ($nodeExitCode -ne 0) {
            throw "[DECRYPT FAILED] AES-256-GCM 認證解密失敗或 AuthTag 不吻合！(Node ExitCode: $nodeExitCode)"
        }
    }

    if (-not (Test-Path $decDump)) {
        throw "[DECRYPT FAILED] 解密程序未產出目標暫存檔：$decDump"
    }
    Write-Host "解密成功，AuthTag 認證通過。" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 4: 計算 SHA-256 並與指定原始 Dump 雜湊比對
    # -------------------------------------------------------------------------
    Write-Host "`n[3/8] 重新計算解密 Dump 之 SHA-256 雜湊指紋..." -ForegroundColor Green
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
    # 步驟 5: 產生並驗證 TOC 過濾清單 (-L，精準排除 10 筆 Vault TOC 項目)
    # -------------------------------------------------------------------------
    Write-Host "`n[4/8] 解析備份 TOC 並建立嚴格驗證之 -L 過濾清單..." -ForegroundColor Green

    if ($MockScenario -eq "None") {
        docker cp $decDump "$($SandboxContainer):$containerTmpDump"
        if ($LASTEXITCODE -ne 0) {
            throw "[DOCKER CP FAILED] 複製 Dump 至沙盒容器暫存區失敗！(ExitCode: $LASTEXITCODE)"
        }
        $containerDumpCopied = $true

        $rawTocLines = docker exec -i $SandboxContainer pg_restore --list $containerTmpDump
        if ($LASTEXITCODE -ne 0) {
            throw "[TOC LIST FAILED] 執行 pg_restore --list 匯出 TOC 失敗！(ExitCode: $LASTEXITCODE)"
        }
        $utf8NoBomWriter = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($rawTocPath, (($rawTocLines -join "`n") + "`n"), $utf8NoBomWriter)
    } else {
        if ([string]::IsNullOrWhiteSpace($MockRawTocPath) -or -not (Test-Path $MockRawTocPath)) {
            throw "[TEST CONFIG ERROR] 測試模式必須提供有效之 -MockRawTocPath！"
        }
        Copy-Item -Path $MockRawTocPath -Destination $rawTocPath -Force
    }

    $tocSummary = Invoke-StrictTocFilterAndVerify -RawTocPath $rawTocPath -FilteredTocPath $filteredTocPath -Scenario $MockScenario
    Write-Host "TOC 過濾驗證通過：原始=$($tocSummary.RawActiveCount)，排除=$($tocSummary.ExcludedCount) (Vault)，保留=$($tocSummary.RetainedActiveCount)，public 核心=$($tocSummary.PublicCount)" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 6: 建立全新獨立測試資料庫 (FIX-06 記錄建立狀態)
    # -------------------------------------------------------------------------
    Write-Host "`n[5/8] 於沙盒內建立全新獨立測試庫 $TargetDatabase..." -ForegroundColor Green
    if ($MockScenario -eq "None") {
        docker exec -i $SandboxContainer psql -U postgres -d postgres -c "CREATE DATABASE $TargetDatabase OWNER codetoknow_restore;"
        if ($LASTEXITCODE -ne 0) {
            throw "[CREATE DB FAILED] 建立資料庫 '$TargetDatabase' 失敗！(ExitCode: $LASTEXITCODE)"
        }
    }
    $dbCreatedByThisRun = $true
    Write-Host "測試資料庫 '$TargetDatabase' 建立完成。" -ForegroundColor Gray

    # -------------------------------------------------------------------------
    # 步驟 7: 傳送過濾清單至沙盒並執行原生 pg_restore -L (FIX-01 嚴格 Exit Code == 0)
    # -------------------------------------------------------------------------
    Write-Host "`n[6/8] 傳送驗證後 TOC 清單至沙盒並執行 PostgreSQL 17 原生還原 (-L)..." -ForegroundColor Green
    Write-Host "（注意：對於 #4698 PUBLICATION supabase_realtime 於 wal_level=replica 下可能出現之 warning，" -ForegroundColor Gray
    Write-Host "  本腳本不預先忽略且絕不將警告視為成功，將嚴格要求 ExitCode == 0 並完整保留警告紀錄。）" -ForegroundColor Gray

    $pgRestoreArgs = Get-PgRestoreArguments -ContainerName $SandboxContainer -DatabaseName $TargetDatabase -ContainerTocListPath $containerTmpToc -ContainerDumpPath $containerTmpDump
    Write-Host "PG_RESTORE ARGS: docker $($pgRestoreArgs -join ' ')" -ForegroundColor DarkGray

    if ($MockScenario -eq "None") {
        docker cp $filteredTocPath "$($SandboxContainer):$containerTmpToc"
        if ($LASTEXITCODE -ne 0) {
            throw "[DOCKER CP FAILED] 複製 -L 過濾清單至沙盒容器失敗！(ExitCode: $LASTEXITCODE)"
        }
        $containerTocCopied = $true
    }

    # FIX-01 要求：pg_restore 必須 Exit Code 等於 0，不得將 Exit Code 1 視為成功！
    $pgRestoreExitCode = 0
    if ($MockScenario -eq "PgRestoreExit1") {
        $pgRestoreExitCode = 1
    } elseif ($MockScenario -eq "PgRestoreExit2") {
        $pgRestoreExitCode = 2
    } elseif ($MockScenario -eq "None") {
        & docker @pgRestoreArgs
        $pgRestoreExitCode = $LASTEXITCODE
    } else {
        $pgRestoreExitCode = 0
    }

    if ($pgRestoreExitCode -ne 0) {
        throw "[PG_RESTORE FAILED] pg_restore 執行失敗！ExitCode 為 $pgRestoreExitCode (依規範必須嚴格為 0，不得忽略警告或錯誤)！"
    }
    Write-Host "pg_restore 原生還原成功 (ExitCode = 0)。" -ForegroundColor Green

    # -------------------------------------------------------------------------
    # 步驟 8: 完整性程式化斷言稽核 (FIX-02 嚴格核對五大核心指標)
    # -------------------------------------------------------------------------
    Write-Host "`n[7/8] 執行資料庫核心指標程式化斷言稽核..." -ForegroundColor Green

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
  (SELECT count(*) FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace WHERE con.contype = 'f' AND nsp.nspname = 'public' AND NOT con.convalidated) AS unvalidated_fks,
  (SELECT count(*) FROM public._prisma_migrations WHERE rolled_back_at IS NULL) AS migrations;
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
    # 步驟 9: 清理程序 (FIX-04, FIX-05)
    # -------------------------------------------------------------------------
    Write-Host "`n[8/8] 執行暫存檔案清理程序..." -ForegroundColor Green

    $localCleanError = $null
    $containerCleanError = $null

    # 1. 清理容器內部暫存檔 (Dump 與 TOC 清單)
    if ($containerDumpCopied -or $containerTocCopied -or $MockScenario -eq "ContainerCleanupFail") {
        try {
            if ($MockScenario -eq "ContainerCleanupFail") {
                throw "Simulated container rm failure"
            } elseif ($MockScenario -eq "None") {
                if ($containerDumpCopied) {
                    docker exec -i $SandboxContainer rm -f $containerTmpDump 2>$null
                    if ($LASTEXITCODE -ne 0) { throw "docker exec rm dump exited with code $LASTEXITCODE" }
                }
                if ($containerTocCopied) {
                    docker exec -i $SandboxContainer rm -f $containerTmpToc 2>$null
                    if ($LASTEXITCODE -ne 0) { throw "docker exec rm toc exited with code $LASTEXITCODE" }
                }
            }
            Write-Host "沙盒容器暫存檔已安全清除。" -ForegroundColor Gray
        } catch {
            $containerCleanError = $_.Exception.Message
            $cleanupSucceeded = $false
            Write-Warning "【安全警示】沙盒容器暫存檔清理失敗 (錯誤: $containerCleanError)"
        }
    }

    # 2. 清理本機暫存檔 (FIX-04: 僅刪除本次建立之暫存檔，嚴禁刪除原始 dump 或 c2kb)
    foreach ($tmpFile in @($decDump, $rawTocPath, $filteredTocPath)) {
        if (Test-Path $tmpFile) {
            try {
                if ([string]::Equals([System.IO.Path]::GetFullPath($tmpFile), [System.IO.Path]::GetFullPath($OriginalDumpPath), [System.StringComparison]::OrdinalIgnoreCase) -or
                    [string]::Equals([System.IO.Path]::GetFullPath($tmpFile), [System.IO.Path]::GetFullPath($EncryptedBackupPath), [System.StringComparison]::OrdinalIgnoreCase)) {
                    throw "嚴重安全保護阻斷：拒絕刪除原始備份檔案！"
                }

                if ($MockScenario -eq "LocalCleanupFail" -and $tmpFile -eq $decDump) {
                    throw "Simulated local file in-use error (EPERM)"
                } else {
                    Remove-Item -Path $tmpFile -Force -ErrorAction Stop
                }

                if (Test-Path $tmpFile) {
                    throw "檔案於 Remove-Item 呼叫後仍存在於磁碟。"
                }
                Write-Host "本機暫存檔已安全清除：$tmpFile" -ForegroundColor Gray
            } catch {
                $localCleanError = $_.Exception.Message
                $cleanupSucceeded = $false
                Write-Warning "【安全警示】本機解密暫存檔清理失敗：$tmpFile (錯誤: $localCleanError)"
            }
        }
    }

    # FIX-06: 失敗後資料庫狀態記錄 (絕不自動刪除)
    if (-not $verificationPassed -and $dbCreatedByThisRun) {
        Write-Warning "`n=========================================================="
        Write-Warning "【保留部分還原資料庫供除錯】"
        Write-Warning "資料庫 '$TargetDatabase' 係由本次作業建立，但因中途發生錯誤未達驗收標準。"
        Write-Warning "該資料庫已完整保留供後續分析，【絕對不可將其視為驗收通過之資料庫】！"
        Write-Warning "=========================================================="
    }

    # FIX-05: 清理失敗警示
    if (-not $cleanupSucceeded) {
        Write-Warning "`n=========================================================="
        Write-Warning "【機敏明文未完全清理告警】"
        if ($null -ne $localCleanError) {
            Write-Warning "- 本機暫存檔案仍可能殘留：$decDump / $rawTocPath / $filteredTocPath"
        }
        if ($null -ne $containerCleanError) {
            Write-Warning "- 容器暫存區檔案仍可能殘留：$containerTmpDump / $containerTmpToc"
        }
        Write-Warning "請操作人員立即手動排查並刪除殘留之暫存檔案，以防止機敏資料外洩！"
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
