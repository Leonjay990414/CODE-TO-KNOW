# CODE TO KNOW (碼上學)
# PHASE 3C-4A-R2-FIX：Supabase 唯讀驗收腳本 pg 模組解析修正報告

**文檔版本**：1.0  
**修正日期**：2026-11-08  
**執行角色**：Node.js 架構師、PostgreSQL DBA、資安審查工程師  
**修正範圍**：`scratch\run_verify_cloud_post_migration.ps1` 啟動外殼腳本之模組搜尋路徑隔離注入。

---

## 一、問題根本原因 (Root Cause Analysis)

在執行 `run_verify_cloud_post_migration.ps1` 時觸發錯誤：
`Error: Cannot find module 'pg'`

### 1. 模組解析機制
Node.js 模組解析機制（CommonJS `require()`）依據**呼叫腳本所在之實體目錄**向上逐層查找 `node_modules`：
- 驗收腳本實體路徑：`C:\Users\user\.gemini\antigravity\brain\90b2423b-3b28-43de-84ef-17da29ebc1c1\scratch\verify_cloud_post_migration.cjs`
- Node.js 搜尋鏈路：
  - `...\scratch\node_modules`
  - `...\90b2423b-3b28-43de-84ef-17da29ebc1c1\node_modules`
  - `...\brain\node_modules`
  - `...\antigravity\node_modules`
  - `C:\Users\user\.gemini\node_modules`
  - `C:\Users\user\node_modules`
  - `C:\Users\node_modules`
  - `C:\node_modules`
- 搜尋鏈路中並未包含工作區 `C:\Users\user\Documents\CODE-TO-KNOW\backend\node_modules`。

### 2. 專案內部 `pg` 套件實際定位
經唯讀檢查確認：
- `backend/package.json`：包含 `pg` 與 `@prisma/adapter-pg`。
- 實際安裝目錄：`C:\Users\user\Documents\CODE-TO-KNOW\backend\node_modules\pg`
- 套件版本：**`8.23.1`**
- 依賴關係：`code-to-know-backend@1.0.0` 正式依賴，完全無需安裝任何新套件。

---

## 二、修復方案（零修改驗收腳本、零安裝套件）

依據規範，嚴格遵守「**不修改原始驗收腳本、不變更永久環境變數、不安裝套件**」原則：

1. **原始驗收腳本保持不變**：
   - 檔案：`scratch\verify_cloud_post_migration.cjs`
   - 大小：8,678 Bytes
   - SHA-256：`ab1c79d84f6a79bc892829c587a4defdc69f8424ffb0b9a08adbff02e2f87953`（維持 100% 精確吻合）。
2. **啟動外殼腳本備份**：
   - 已建立原始外殼備份：`scratch\run_verify_cloud_post_migration.ps1.bak`。
3. **啟動外殼腳本注入暫時性 `NODE_PATH`**：
   - 在 PowerShell 外殼中，針對執行過程設定子行程環境變數：
     ```powershell
     $prevNodePath = $env:NODE_PATH
     $env:NODE_PATH = "C:\Users\user\Documents\CODE-TO-KNOW\backend\node_modules"
     try {
         node $scriptPath
         $auditExitCode = $LASTEXITCODE
     } finally {
         # 執行結束即刻還原或清除
         if ($null -ne $prevNodePath) {
             $env:NODE_PATH = $prevNodePath
         } else {
             Remove-Item Env:\NODE_PATH -ErrorAction SilentlyContinue
         }
     }
     ```
   - 僅影響本次驗收子行程，不污染全域環境，保證進程生命週期安全。

---

## 三、模組解析離線測試結果（零資料庫連線）

在未連接 Supabase、未輸入密碼之隔離條件下，執行模組解析驗證：
```powershell
$env:NODE_PATH = "C:\Users\user\Documents\CODE-TO-KNOW\backend\node_modules"
node -e "const pg = require('pg'); console.log('Resolved pg path:', require.resolve('pg')); console.log('pg version:', require('pg/package.json').version);"
```

**測試輸出**：
- 解析成功路徑：`C:\Users\user\Documents\CODE-TO-KNOW\backend\node_modules\pg\lib\index.js`
- 模組版本：`8.23.1`
- 退出碼：`0`（解析完全正常）。

---

## 四、安全與專案完整性檢核

| 項目 | 預期狀態 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Git 暫存區** | 無任何 staged 變更 | 純淨 | **PASS** |
| **驗收腳本 SHA-256** | `ab1c79d84f6a79bc...` | `ab1c79d84f6a79bc...` | **PASS** |
| **套件變更** | 零 npm install / 零更新 | 未安裝任何新套件 | **PASS** |
| **資料庫連線與寫入** | 零連線、零寫入 | 離線解析測試，零連線 | **PASS** |
| **費用與方案** | 零費用 ($0.00 USD) | 完全維持 Free Plan | **PASS** |

---

## 五、最終結論：`PASS`（模組解析修正就緒）

模組解析問題已完全修復，隨時可安全啟動唯讀驗收腳本。
