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
    [switch]$DryRun
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
$metaInfo = @{
    project = "code-to-know-prod"
    project_ref = "ypibmyfxfhsyfdwxprpi"
    target_host = "aws-0-ap-southeast-2.pooler.supabase.com:5432"
    format = "PostgreSQL Custom Format (-Fc)"
    tool_version = $dockerCheck.Trim()
    docker_image = $pinnedDockerImage
    database = "postgres"
    backup_file = $dumpFileName
    file_size_bytes = $dumpLength
    sha256 = $sha256
    created_at_utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    tls_mode = "verify-full (Strict Root CA & Hostname SAN)"
}

$metaInfo | ConvertTo-Json -Depth 4 | Set-Content -Path $infoFilePath -Encoding UTF8
Write-Host "[6/6] 數位指紋與元數據已產出：$shaFileName, $infoFileName" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  Supabase 雲端備份成功完成！" -ForegroundColor Green
Write-Host "  目錄：$targetDirPath" -ForegroundColor Cyan
Write-Host "  檔案：$dumpFileName" -ForegroundColor Cyan
Write-Host "  SHA-256：$sha256" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

exit 0
