# CODE TO KNOW｜Phase 3-C-8：既有明文備份加密方式唯讀檢查報告
# 既有 Supabase PostgreSQL 17 明文 Dump 離線加密與驗收準備度查核

**文件編號**：C2K-DOC-DB-PHASE3C8-ENCRYPT-READINESS-01  
**檢查日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA / 應用安全架構師 (AppSec) / DevSecOps 稽核工程師  
**審查性質**：100% 唯讀靜態檢查與離線驗證（零雲端連線、零資料庫寫入、零程式碼修改、零金鑰讀取）  
**審查結論判定**：**PASS（完全具備條件，支援既有 Dump 離線加密與迴環驗收）**

---

## 一、既有備份檔案盤點與完整性核驗

經盤點本地備份專用目錄 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\`，已確認找到 **3 份有效之正式 Supabase 明文傾印備份**。所有檔案皆為 PostgreSQL Custom Format (`-Fc`)，大小均為 505,249 位元組，且皆具備 SHA-256 數位指紋佐證：

### 1.1 備份檔案詳細清單

| 目錄名稱 | 檔案名稱 | 大小 (Bytes) | 建立時間 (Local) | 計算之 SHA-256 雜湊值 | .sha256 比對 |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **CODE_TO_KNOW_SUPABASE_20261110_204519**<br>*(Phase 3-C-7 最新備份)* | `code_to_know_supabase_prod.dump` | **505,249** | 2026/11/10 20:47:08 | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | **100% 一致** |
| **CODE_TO_KNOW_SUPABASE_20261110_202836** | `code_to_know_supabase_prod.dump` | **505,249** | 2026/11/10 20:29:58 | `43443FCE81A10009BC2C79E809EABE440AFEF2CA53AD1C3E0215BD2F63555632` | **100% 一致** |
| **CODE_TO_KNOW_SUPABASE_20261108_215758** | `code_to_know_supabase_prod.dump` | **505,249** | 2026/11/08 21:59:26 | `08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3` | **100% 一致** |

> [!NOTE]
> 最新且最推薦使用之加密目標為：  
> `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump`  
> 該檔案完整保留了 Supabase 正式庫 37 張業務資料表之綱要結構與真實業務資料，未受任何破壞。

---

## 二、核心檢查問題逐項判定報告

### Q1. 是否找到有效的既有明文備份？
- **判定結果**：**YES（已確認）**。
- **依據**：
  在 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\` 目錄下，確認存在大小 505,249 bytes 之明文傾印檔案 `code_to_know_supabase_prod.dump`。其 SHA-256 雜湊與同目錄之 `.sha256` 記錄檔 100% 吻合，格式為標準 PostgreSQL 17 Custom Format。

---

### Q2. 是否能不連線 Supabase，直接加密該檔案？
- **判定結果**：**YES（100% 支援）**。
- **依據**：
  專案既有之 [`scripts/database/backup-pipeline.cjs`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.cjs) 是純本地運作的 Node.js 密碼學管線模組。它直接針對磁碟指定之 `.dump` 檔案執行 AES-256-GCM 串流加密、C2KB 封裝與解密迴環驗證，**全流程不依賴任何網路、不發起任何資料庫連線、不需要 Docker 容器，亦不會重複對正式 Supabase 造成負載**。

---

### Q3. 應使用哪個現有程式及精確參數？
- **判定結果**：應使用 [`scripts/database/backup-pipeline.cjs`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.cjs)。
- **精確執行架構**：
  依據 SEC-01 金鑰生命週期防護規範，**嚴禁將金鑰作為 CLI 參數傳遞**（避免出現在行程清單或終端機歷程），應透過 PowerShell 記憶體環境變數傳遞。
- **精確執行腳本（由使用者於本機終端機貼入執行）**：

```powershell
# 1. 安全遮罩輸入 KeePassXC 64 字元 Hex 主金鑰
$sec = Read-Host -Prompt "請輸入 KeePassXC 備份主金鑰 (64 字元 Hex，輸入全程遮罩)" -AsSecureString
$bstr = [IntPtr]::Zero

try {
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $key = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr).Trim()
    
    # 2. 本地格式預檢 (不顯示金鑰)
    if ($key.Length -ne 64 -or ($key -notmatch '^[0-9a-fA-F]{64}$')) {
        Write-Error "金鑰格式不符！必須恰為 64 字元 Hex (當前長度: $($key.Length))。"
        return
    }

    # 3. 注入子行程環境變數
    $env:BACKUP_ENCRYPTION_KEY = $key

    # 4. 指定既有備份路徑與輸出路徑
    $dumpPath = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump"
    $encPath  = "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\code_to_know_supabase_prod.dump.c2kb"

    Write-Host "`n[啟動] 執行既有 Dump 離線加密、C2KB 封裝與迴環驗證..." -ForegroundColor Cyan

    # 5. 呼叫既有管線 (顯式指定 --keep-plaintext 保護原始 dump)
    node scripts/database/backup-pipeline.cjs -i $dumpPath -o $encPath --keep-plaintext
}
finally {
    # 6. SEC-01 嚴格清理環境變數與記憶體
    if ($bstr -ne [IntPtr]::Zero) {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
    $env:BACKUP_ENCRYPTION_KEY = $null
    [System.Environment]::SetEnvironmentVariable("BACKUP_ENCRYPTION_KEY", $null, "Process")
    $key = $null
    $sec = $null
    [System.GC]::Collect()
}
```

- **精確 CLI 引數說明**：
  - `-i <dumpPath>`：指定現有 505,249 bytes 明文備份檔案路徑。
  - `-o <encPath>`：指定輸出加密 C2KB 容器檔案路徑。
  - `--keep-plaintext`：強制保留原始明文 Dump，絕不刪除。

---

### Q4. 是否會覆寫既有檔案？
- **判定結果**：**絕對不會（Zero Overwrite Risk）**。
- **程式碼依據**：
  [`scripts/database/backup-pipeline.cjs:120-122`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.cjs#L120-L122)：
  ```javascript
  if (fs.existsSync(resolvedEnc)) {
    throw new Error(`[PIPELINE ERROR] Target encrypted file already exists: ${resolvedEnc}. Overwrite is disallowed.`);
  }
  ```
  在加密前會先檢查目標檔案是否存在。目前目錄中並不存在 `code_to_know_supabase_prod.dump.c2kb`；若未來該檔案已存在，管線會直接拋錯並中止，防禦任何意外覆寫。

---

### Q5. 加密成功後如何驗證 SHA-256 與 AES-GCM AuthTag？
- **判定結果**：**管線內部雙重驗證並自動產出 Sidecar 雜湊檔**。
- **程式碼依據**：
  1. **C2KB 容器格式驗證**（第 135–142 行）：
     檢驗前 17 位元組容器標頭（Magic: `C2KB`、Version: `0x01`、12-byte 隨機 Nonce）及最小檔案長度（33 bytes）。
  2. **密文 SHA-256 指紋產生**（第 167–168 行）：
     加密成功後，自動計算密文檔案之 SHA-256 指紋，並建立同名檔案 `${encPath}.sha256`。
  3. **AES-GCM AuthTag 驗證**：
     在後續解密迴環驗收中，Node.js 內建 crypto 模組會讀取密文末端 16-byte AuthTag。若金鑰不合或密文在傳輸/存儲中有任何 1 個位元被竄改，OpenSSL 會立刻拒絕解密並拋出認證失敗錯誤。

---

### Q6. 如何確認解密還原內容與原始 dump 的 SHA-256 相同？
- **判定結果**：**管線實施嚴格的 Round-Trip Decryption Verification（解密迴環驗證）**。
- **程式碼依據**：
  [`scripts/database/backup-pipeline.cjs:144-165`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.cjs#L144-L165)：
  ```javascript
  // 5. 執行解密迴環驗證 (Round-Trip Decryption Verification)
  const verifyTemp = `${resolvedEnc}.verify.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    await decryptFile(resolvedEnc, verifyTemp, keyHex);
    const decryptedSha256 = calculateFileSha256(verifyTemp);

    if (decryptedSha256 !== originalSha256) {
      throw new Error(`[PIPELINE INTEGRITY ERROR] Decrypted hash (${decryptedSha256}) does not match original plaintext hash (${originalSha256})!`);
    }
    roundTripPassed = true;
  } finally {
    try { if (fs.existsSync(verifyTemp)) fs.unlinkSync(verifyTemp); } catch {}
  }
  ```
- **核心保證**：
  加密完成後，管線自動在暫存區將 `.c2kb` 解密還原，並比對還原檔案的 SHA-256 雜湊與原始明文 Dump（`2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`）。**唯有兩者 100% 逐位元相同時，管線才判定加密成功**。驗證完成後，暫存檔立即徹底抹除。

---

### Q7. 若失敗，如何確保原始明文備份仍被保留？
- **判定結果**：**四重防護機制確保原始明文備份絕對保留**。
- **防護層級依據**：
  1. **參數防護**：顯式傳入 `--keep-plaintext`，管線在邏輯上跳過任何刪除明文的分支。
  2. **條件前置鎖定**：第 174 行設定 `if (!keepPlaintext && roundTripPassed)`。意即只要 `roundTripPassed` 為 false（加密中途出錯、格式檢驗失敗、解密雜湊不吻合），刪除程式碼絕對不會被執行。
  3. **失敗現場清理隔離**：第 159–160 行在捕捉到驗證失敗時，僅會刪除破損的 `.c2kb` 產出物與驗證暫存檔，原始 `.dump` 檔案路徑完全不在此清理範圍內。
  4. **自動化測試佐證**：整合測試 `TC-08`（中途失敗時保護原始明文）與 `TC-13` 已嚴格驗證此防護機制。

---

## 三、離線自動化測試驗證結果

本地執行 `scripts/database/backup-pipeline.test.cjs` 進行 14 大離線安全整合測試：
- **測試命令**：`node scripts/database/backup-pipeline.test.cjs`
- **測試結果**：**14 / 14 PASS (100% 通過)**。

```text
  ✓ [TC-01] PASS: 正常備份與加密流程：合成 Dump 成功封裝至 .c2kb 容器
  ✓ [TC-02] PASS: 正常解密及內容比對：解密後 SHA-256 與原始合成 Dump 完全一致
  ✓ [TC-03] PASS: 加密失敗時的處理：輸入檔案不存在時安全拋錯，不交付任何不完整檔案
  ✓ [TC-04] PASS: 金鑰錯誤時的處理：使用錯誤金鑰解密立即被 GCM Auth Tag 阻斷
  ✓ [TC-05] PASS: 加密檔案遭到篡改時的處理：翻轉 1 byte 密文即刻拋錯拒絕解密
  ✓ [TC-06] PASS: 輸出檔案已存在時不得覆蓋：目標 .c2kb 存在時拒絕覆寫並保護既有檔案
  ✓ [TC-07] PASS: 暫存檔清理精確性：清理機制絕不影響目錄中既有無關之 .tmp 檔案
  ✓ [TC-08] PASS: 中途失敗時保護原始明文：驗證失敗或異常時絕不刪除原始明文備份
  ✓ [TC-09] PASS: 敏感資訊日誌防護：全流程 Console/Error 輸出中絕不包含 64 位元金鑰字串
  ✓ [TC-10] PASS: Windows PowerShell 離線整合執行：run_supabase_backup.ps1 -MockDumpPath 與 -DryRun 驗證通過
  ✓ [TC-11] PASS: SEC-01 金鑰生命週期管理：PowerShell 執行後環境變數絕不殘留 BACKUP_ENCRYPTION_KEY
  ✓ [TC-12] PASS: SEC-02 Mock 備份標記：-MockDumpPath 產出之 backup_info.json 明確標記 mock_mode: true
  ✓ [TC-13] PASS: SEC-03 明文清理受阻處理：明文刪除失敗時，保留合格之 .c2kb 容器
  ✓ [TC-14] PASS: SEC-03 CLI 退出碼規範：明文清理受阻時，CLI 以退出碼 2 結束
```

---

## 四、安全規範遵守查核

- [x] 未連線 Supabase 雲端資料庫。
- [x] 未執行 `pg_dump` 或 `pg_restore`。
- [x] 未修改任何資料庫資料、資料表或綱要。
- [x] 未讀取 KeePassXC 密碼庫或任何私密檔案。
- [x] 未要求使用者在聊天視窗提供真實金鑰或密碼。
- [x] 未修改 `.env` 或系統環境變數。
- [x] 未修改或刪除任何既有備份檔案。
- [x] 未修改專案任何程式碼（100% 唯讀檢查）。
- [x] 未執行 Git add、commit、push、reset、clean 或 stash。
- [x] 未部署 Render。

---

## 五、最終結論與判定

**查核結論**：**PASS**

現有備份加密工具鏈完整具備「輸入既有 dump → 加密 → 驗證 → 產生 C2KB」之全部功能。  
使用者確認金鑰規格為 64 字元 Hex 後，可直接依本文「第二節 Q3」之指示在本地終端機執行加密，無需再次連線 Supabase 雲端資料庫。
