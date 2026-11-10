<#
.SYNOPSIS
    CODE TO KNOW - Supabase PostgreSQL 17 雲端資料庫邏輯備份安全執行腳本 (引數修復與異步管道補強版)
.DESCRIPTION
    使用官方固定 Digest 之 PostgreSQL 17 Client Tools (postgres@sha256:3540c0362c809df...) 執行受控 pg_dump。
    
    安全架構設計：
    1. TLS 模式維持最高等級：PGSSLMODE=verify-full (強制比對 Root CA 憑證與主機 SAN 名稱)。
    2. 憑證以唯讀模式 (:ro) 掛載至容器內部，絕不複製憑證至專案目錄或 Git。
    3. Docker 映像檔全面鎖定不可變之官方 RepoDigest，杜絕 latest 標籤遭竄改或動態浮動風險。
    4. 密碼傳遞：透過 Process Stdin 管道串流寫入容器內部 shell，絕不在宿主機 CLI 參數或環境變數中暴露。
    5. 引數傳遞防護 (FIX2)：對 `sh -c` 的容器複合命令嚴格實施 Windows 命令列雙引號包裹，
       保證 Linux 容器內部將完整腳本視為單一字串參數解析，消除 read 單獨執行即退出的截斷缺陷。
    6. 輸出管道防死鎖 (FIX2)：採用 .NET `ReadToEndAsync()` 異步讀取 stdout 與 stderr，
       徹底杜絕管道緩衝區溢滿死鎖，並完整保留失敗時之 pg_dump 原廠診斷輸出（絕不吞掉錯誤訊息）。
    7. 成功多重條件防護 (FIX2)：備份成功必須同時滿足 (ExitCode=0) AND (Dump存在) AND (大小>0) AND (SHA256成功)。
    8. 密碼生命週期：於 finally 區塊即刻將純文字字串重設為 $null 並觸發 GC 記憶體擦除。
#>

[CmdletBinding()]
param (
    [switch]$DryRun,
    [switch]$Encrypt,
    [string]$EncryptionKey,
    [switch]$KeepPlaintext,
    [string]$MockDumpPath
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Stop"

$workspaceRoot = "C:\Users\user\Documents\CODE-TO-KNOW"
$caPath = "C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt"
$baseBackupDir = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS"
$pinnedDockerImage = "postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  CODE TO KNOW (碼上學) - Supabase 雲端備份工具 (PG 17)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "目標專案：code-to-know-prod (ypibmyfxfhsyfdwxprpi)" -ForegroundColor Gray
Write-Host "目標端點：aws-0-ap-southeast-2.pooler.supabase.com:5432" -ForegroundColor Gray
Write-Host "連線架構：Session Pooler (Port 5432)" -ForegroundColor Gray
Write-Host "TLS 模式：PGSSLMODE=verify-full (Strict Root CA & Hostname SAN)" -ForegroundColor Gray
Write-Host "傾印格式：PostgreSQL Custom Format (-Fc)" -ForegroundColor Gray
Write-Host "映像鎖定：$pinnedDockerImage" -ForegroundColor Gray
Write-Host "==========================================================`n" -ForegroundColor Gray

# 1. 前置檢查：Root CA 憑證是否存在與 SHA-256 核對
if (-not (Test-Path $caPath)) {
    Write-Error "找不到 Root CA 憑證：$caPath"
    exit 1
}

$expectedCaHash = "700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7"
$actualCaHash = (Get-FileHash -Path $caPath -Algorithm SHA256).Hash.ToUpper()
if ($actualCaHash -ne $expectedCaHash) {
    Write-Error "Root CA 憑證雜湊不符！預期：$expectedCaHash，實際：$actualCaHash"
    exit 1
}

# 2. 檢查 Docker 服務與固定 Digest 之 PostgreSQL 17 Client Tools 映像檔
try {
    $dockerCheck = docker run --rm $pinnedDockerImage pg_dump --version
    Write-Host "[1/6] Client Tools 驗證通過：$dockerCheck (Digest 鎖定)" -ForegroundColor Green
} catch {
    Write-Error "無法執行固定 Digest 之 docker postgres 17 容器，請確認 Docker 服務正常。"
    exit 1
}

# 3. 建立獨立備份時間戳記目錄 (防覆寫設計)
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$targetDirName = "CODE_TO_KNOW_SUPABASE_$timestamp"
$targetDirPath = Join-Path $baseBackupDir $targetDirName

if (Test-Path $targetDirPath) {
    Write-Error "防覆寫中斷：目標備份目錄已存在 ($targetDirPath)"
    exit 1
}

$dumpFileName = "code_to_know_supabase_prod.dump"
$dumpFilePath = Join-Path $targetDirPath $dumpFileName
$shaFileName = "code_to_know_supabase_prod.dump.sha256"
$shaFilePath = Join-Path $targetDirPath $shaFileName
$infoFileName = "backup_info.json"
$infoFilePath = Join-Path $targetDirPath $infoFileName

if ($DryRun) {
    Write-Host "`n[DryRun 模式] 離線安全與參數驗證完成：" -ForegroundColor Yellow
    Write-Host "  預定輸出目錄：$targetDirPath" -ForegroundColor Gray
    Write-Host "  預定輸出檔案：$dumpFilePath" -ForegroundColor Gray
    Write-Host "  Root CA 路徑：$caPath (SHA-256 驗證相符)" -ForegroundColor Gray
    Write-Host "  TLS 驗證模式：verify-full" -ForegroundColor Gray
    Write-Host "  Docker 映像檔：$pinnedDockerImage" -ForegroundColor Gray
    Write-Host "DryRun 測試通過，安全退出。" -ForegroundColor Green
    exit 0
}

if ($MockDumpPath) {
    if (-not (Test-Path $MockDumpPath)) {
        Write-Error "找不到指定的 Mock Dump 檔案：$MockDumpPath"
        exit 1
    }
    New-Item -ItemType Directory -Path $targetDirPath -Force | Out-Null
    Copy-Item -Path $MockDumpPath -Destination $dumpFilePath -Force
    $backupExitCode = 0
    Write-Host "[MOCK 測試模式] 已載入測試備份檔案至目標目錄：$dumpFilePath" -ForegroundColor Yellow
} else {
    # 4. 安全隱藏式互動輸入密碼 (避免明文落盤或進入命令列參數)
    Write-Host "請輸入 Supabase 雲端資料庫密碼 (密碼全程遮罩隱藏)：" -ForegroundColor Yellow
    $securePass = Read-Host -Prompt "Database Password" -AsSecureString

    if ($null -eq $securePass -or $securePass.Length -eq 0) {
        Write-Error "密碼不能為空！"
        exit 1
    }

    # 在記憶體中解出純文字供 Stdin Pipe 注入
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePass)
    $plainPass = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $securePass = $null

    # FIX4: 防禦性清除前後可能的 CR/LF 殘留，確保密碼字串純淨
    $plainPass = $plainPass.TrimEnd("`r", "`n")

    # 5. 建立本機輸出目錄
    New-Item -ItemType Directory -Path $targetDirPath -Force | Out-Null
    Write-Host "[2/6] 建立獨立備份目錄：$targetDirPath" -ForegroundColor Green

    # 6. 執行受控 pg_dump (透過 Docker 容器隔離執行)
    # 安全核心：密碼透過 Stdin 管道讀入容器內部環境變數，不在宿主機 CLI 引數中使用 -e PGPASSWORD
    Write-Host "[3/6] 連線 Session Pooler (5432) 執行結構與資料邏輯傾印 (-Fc, verify-full)..." -ForegroundColor Green

    $caFileName = [System.IO.Path]::GetFileName($caPath)
    $caDir = [System.IO.Path]::GetDirectoryName($caPath)

    $backupExitCode = 1
    $capturedStdout = ""
    $capturedStderr = ""

    try {
        # 組合 ProcessStartInfo
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "docker"
        
        # 容器內部啟動小型 shell 腳本：先從 stdin 讀取密碼並 export PGPASSWORD，隨後執行 pg_dump
        # FIX4: 使用 tr -d '\r' 過濾 Windows Stdin 管道可能附帶之回車符號，杜絕密碼字串被污染
        $containerCmd = "tr -d '\r' | { read -r PGPASSWORD; export PGPASSWORD; exec pg_dump -h aws-0-ap-southeast-2.pooler.supabase.com -p 5432 -U postgres.ypibmyfxfhsyfdwxprpi -d postgres -Fc -v -f /backups/$dumpFileName; }"
        
        # FIX2: 對 sh -c 的命令列實施嚴格雙引號包裹，確保傳入 Windows 核心時不被拆解成多個參數
        $escapedContainerCmd = "`"$containerCmd`""
        
        $dockerArgs = @(
            "run", "-i", "--rm",
            "-e", "PGUSER=postgres.ypibmyfxfhsyfdwxprpi",
            "-e", "PGSSLMODE=verify-full",
            "-e", "PGSSLROOTCERT=/certs/$caFileName",
            "-v", "${caDir}:/certs:ro",
            "-v", "${targetDirPath}:/backups:rw",
            $pinnedDockerImage,
            "sh", "-c", $escapedContainerCmd
        )

        $psi.Arguments = [string]::Join(" ", $dockerArgs)
        $psi.UseShellExecute = $false
        $psi.RedirectStandardInput = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true

        $process = [System.Diagnostics.Process]::Start($psi)

        # FIX2: 採用非同步工作讀取 stdout 與 stderr，杜絕管道緩衝區溢滿死鎖
        $stdoutTask = $process.StandardOutput.ReadToEndAsync()
        $stderrTask = $process.StandardError.ReadToEndAsync()
        
        # FIX4: 透過 Stdin 寫入密碼，顯式指定換行符為 Linux LF (`n)，杜絕 Windows CRLF 注入
        $process.StandardInput.NewLine = "`n"
        $process.StandardInput.WriteLine($plainPass)
        $process.StandardInput.Flush()
        $process.StandardInput.Close()

        $process.WaitForExit()

        # 等待異步讀取完畢
        [System.Threading.Tasks.Task]::WaitAll($stdoutTask, $stderrTask)
        $capturedStdout = $stdoutTask.Result
        $capturedStderr = $stderrTask.Result

        $backupExitCode = $process.ExitCode
    } catch {
        Write-Error "執行 pg_dump 過程中發生異常：$($_.Exception.Message)"
    } finally {
        # 立即清理記憶體密碼
        $plainPass = $null
        [System.GC]::Collect()
    }
}

# 7. 驗證執行結果與失敗清理 (多重條件防護)
$dumpExists = Test-Path $dumpFilePath
$dumpLength = 0
if ($dumpExists) {
    $dumpLength = (Get-Item $dumpFilePath).Length
}

if ($backupExitCode -ne 0 -or (-not $dumpExists) -or ($dumpLength -eq 0)) {
    Write-Host "`n==========================================================" -ForegroundColor Red
    Write-Host "  [警告] pg_dump 執行失敗或備份檔異常！" -ForegroundColor Red
    Write-Host "  Docker Exit Code: $backupExitCode" -ForegroundColor Red
    Write-Host "  Dump 檔案存在: $dumpExists" -ForegroundColor Red
    Write-Host "  Dump 檔案大小: $dumpLength 位元組" -ForegroundColor Red
    
    if (-not [string]::IsNullOrWhiteSpace($capturedStderr)) {
        Write-Host "`n--- pg_dump / Docker 原廠診斷輸出 (STDERR) ---" -ForegroundColor Yellow
        Write-Host $capturedStderr.Trim() -ForegroundColor Yellow
        Write-Host "--------------------------------------------------`n" -ForegroundColor Yellow
    }

    Write-Host "清理未完成之目錄與殘餘檔案..." -ForegroundColor Red
    if ($dumpExists) { Remove-Item $dumpFilePath -Force -ErrorAction SilentlyContinue }
    Remove-Item $targetDirPath -Force -Recurse -ErrorAction SilentlyContinue
    Write-Host "==========================================================" -ForegroundColor Red
    exit $(if ($backupExitCode -ne 0) { $backupExitCode } else { 1 })
}

Write-Host "[4/6] 備份檔案產出成功 (大小：$dumpLength 位元組)" -ForegroundColor Green

# 8. 計算 SHA-256 數位指紋
Write-Host "[5/6] 計算 SHA-256 完整性雜湊..." -ForegroundColor Green
$hashObj = Get-FileHash -Path $dumpFilePath -Algorithm SHA256
$sha256 = $hashObj.Hash.ToUpper()

Set-Content -Path $shaFilePath -Value "$sha256  $dumpFileName" -Encoding UTF8

# 9. 產出元數據說明檔 (Metadata JSON, 絕不含密碼)
$isMock = [bool]$MockDumpPath
$metaInfo = [ordered]@{
    project = if ($isMock) { "code-to-know-mock-test" } else { "code-to-know-prod" }
    project_ref = if ($isMock) { "mock-synthetic-ref" } else { "ypibmyfxfhsyfdwxprpi" }
    target_host = if ($isMock) { "OFFLINE_MOCK_DATA" } else { "aws-0-ap-southeast-2.pooler.supabase.com:5432" }
    mock_mode = $isMock
    source = if ($isMock) { "MOCK_DUMP" } else { "SUPABASE_PRODUCTION_DATABASE" }
}
if ($isMock) {
    $metaInfo["mock_dump_path"] = $MockDumpPath
}
$metaInfo["format"] = "PostgreSQL Custom Format (-Fc)"
$metaInfo["tool_version"] = $dockerCheck.Trim()
$metaInfo["docker_image"] = if ($isMock) { "N/A (Mock Mode)" } else { $pinnedDockerImage }
$metaInfo["database"] = if ($isMock) { "mock_postgres" } else { "postgres" }
$metaInfo["backup_file"] = $dumpFileName
$metaInfo["file_size_bytes"] = $dumpLength
$metaInfo["sha256"] = $sha256
$metaInfo["created_at_utc"] = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$metaInfo["tls_mode"] = if ($isMock) { "N/A (Offline Mock)" } else { "verify-full (Strict Root CA & Hostname SAN)" }
$metaInfo["encrypted"] = $false

# 10. 若指定 -Encrypt，執行 AES-256-GCM 加密管線與解密迴環驗證
if ($Encrypt) {
    Write-Host "`n[加值防護] 啟動 AES-256-GCM 備份加密管線..." -ForegroundColor Cyan

    $cryptoScript = Join-Path $workspaceRoot "scripts\database\backup-pipeline.cjs"
    if (-not (Test-Path $cryptoScript)) {
        Write-Error "找不到加密管線工具：$cryptoScript"
        exit 1
    }

    # SEC-01: 記錄環境變數原本狀態，以便執行後安全復原或清理
    $origKeyEnvExists = [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") -ne $null
    $origKeyEnvValue = if ($origKeyEnvExists) { [System.Environment]::GetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", "Process") } else { $null }

    $activeKey = $EncryptionKey
    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        $activeKey = $origKeyEnvValue
    }

    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        Write-Host "請輸入 AES-256-GCM 備份主金鑰 (64 位元 Hex，輸入全程遮罩隱藏)：" -ForegroundColor Yellow
        $secKey = Read-Host -Prompt "Encryption Key" -AsSecureString
        if ($null -ne $secKey -and $secKey.Length -gt 0) {
            $bstrKey = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secKey)
            $activeKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstrKey)
            [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstrKey)
            $secKey = $null
            $activeKey = $activeKey.Trim()
        }
    }

    if ([string]::IsNullOrWhiteSpace($activeKey)) {
        Write-Error "未提供加密金鑰，加密管線中止！原始明文備份已保留供保護。"
        exit 1
    }

    $encFileName = "$dumpFileName.c2kb"
    $encFilePath = Join-Path $targetDirPath $encFileName
    $encShaFileName = "$encFileName.sha256"
    $encShaFilePath = Join-Path $targetDirPath $encShaFileName

    # SEC-01: 透過子行程環境變數傳遞金鑰，防止命令列參數外洩
    # 採用 try/finally 保證在正常結束、異常拋錯或可攔截中斷時均恢復或清理環境變數
    $env:BACKUP_ENCRYPTION_KEY = $activeKey
    $envRestoreFailed = $false
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
        # SEC-01 生命週期恢復機制：
        # 若執行前原本已有環境變數，安全恢復其原值；若原本不存在，清空為 $null
        try {
            if ($origKeyEnvExists) {
                $env:BACKUP_ENCRYPTION_KEY = $origKeyEnvValue
                [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $origKeyEnvValue, "Process")
            } else {
                $env:BACKUP_ENCRYPTION_KEY = $null
                [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
            }
        } catch {
            $envRestoreFailed = $true
            Write-Warning "【安全警示】恢復或清理行程環境變數 BACKUP_ENCRYPTION_KEY 失敗：$($_.Exception.Message)"
        }
        $activeKey = $null
        $origKeyEnvValue = $null
        # 記憶體安全說明：.NET System.String 為不可變物件由 GC 管理，調用 Collect() 提示回收
        # 但作業系統實體記憶體分頁無法保證立即物理抹除，環境變數恢復/清除可確保 Process Environment Block 狀態精確
        [System.GC]::Collect()
        if ($envRestoreFailed) {
            Write-Error "環境變數恢復/清理失敗，請手動確認終端環境變數狀態！"
        }
    }

    # SEC-03: 根據退出碼處理
    # 0 = 完整成功（若非 KeepPlaintext 則明文已刪除）
    # 2 = 加密與迴環驗證成功，但明文清理失敗（保留 .c2kb 與明文，發出警示）
    # 其餘 = 加密或驗證失敗（中止並保留明文供診斷）
    if ($nodeExitCode -ne 0 -and $nodeExitCode -ne 2) {
        Write-Error "加密管線或解密迴環驗證失敗！(ExitCode: $nodeExitCode)。原始明文備份已保留供後續分析。"
        exit $nodeExitCode
    }

    if (-not (Test-Path $encFilePath)) {
        Write-Error "加密管線異常：未產出加密檔案 $encFilePath"
        exit 1
    }

    # 計算密文雜湊指紋
    $encHashObj = Get-FileHash -Path $encFilePath -Algorithm SHA256
    $encSha256 = $encHashObj.Hash.ToUpper()
    Set-Content -Path $encShaFilePath -Value "$encSha256  $encFileName" -Encoding UTF8

    $encLength = (Get-Item $encFilePath).Length

    # 更新元資料
    $metaInfo.encrypted = $true
    $metaInfo.encrypted_file = $encFileName
    $metaInfo.encrypted_size_bytes = $encLength
    $metaInfo.encrypted_sha256 = $encSha256
    $metaInfo.container_format = "C2KB (Magic: 4B, Version: 1B, Nonce: 12B, Tag: 16B)"
    $metaInfo.verified_round_trip = $true

    if ($nodeExitCode -eq 2) {
        Write-Warning "【安全警示】加密與解密迴環驗證成功，但明文備份刪除失敗！明文路徑：$dumpFilePath"
        $metaInfo.plaintext_retained = $true
        $metaInfo.cleanup_status = "WARNING_PLAINTEXT_RETAINED_CLEANUP_FAILED"
    } else {
        $metaInfo.plaintext_retained = [bool]$KeepPlaintext
        $metaInfo.cleanup_status = if ($KeepPlaintext) { "KEPT_BY_USER_REQUEST" } else { "CLEANED_SUCCESSFULLY" }
        if (-not $KeepPlaintext) {
            Write-Host "明文暫存檔已於解密迴環驗證合格後安全清理。" -ForegroundColor Yellow
            Write-Host "（安全提醒：常規檔案刪除不代表 SSD 實體晶片安全抹除，正式密鑰保護為根本防線）" -ForegroundColor Gray
        }
    }
}

$metaInfo | ConvertTo-Json -Depth 4 | Set-Content -Path $infoFilePath -Encoding UTF8
Write-Host "[6/6] 數位指紋與元數據已產出：$shaFileName, $infoFileName" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  $(if ($isMock) { '[離線模擬測試] 備份與加密管線執行成功！' } else { 'Supabase 雲端備份與加密管線執行成功！' })" -ForegroundColor Green
Write-Host "  目錄：$targetDirPath" -ForegroundColor Cyan
if ($metaInfo.encrypted) {
    Write-Host "  加密檔案：$($metaInfo.encrypted_file)" -ForegroundColor Cyan
    Write-Host "  密文 SHA-256：$($metaInfo.encrypted_sha256)" -ForegroundColor Cyan
    Write-Host "  解密迴環驗證：PASS" -ForegroundColor Green
} else {
    Write-Host "  檔案：$dumpFileName" -ForegroundColor Cyan
    Write-Host "  SHA-256：$sha256" -ForegroundColor Cyan
}
Write-Host "==========================================================" -ForegroundColor Cyan

exit 0
