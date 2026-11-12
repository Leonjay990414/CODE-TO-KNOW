# CODE TO KNOW｜AUTH-02 連線失敗唯讀診斷報告

- **診斷日期**：2026-11-12
- **診斷性質**：**100% 唯讀檢查**（未重新連線 Supabase、未執行 `pg_dump` / SQL、未修改任何程式碼/設定/密碼/備份/Docker）
- **錯誤訊息**：`FATAL: password authentication failed for user "postgres"`
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`

---

## 一、根因分析與證據

### 1. 為什麼錯誤訊息顯示 `user "postgres"` 而非 `postgres.ypibmyfxfhsyfdwxprpi`？
- **並非腳本寫錯使用者名稱**。經唯讀檢視 [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1#L148-L155)：
  - 第 148 行明確傳入 `-U postgres.ypibmyfxfhsyfdwxprpi`。
  - 第 155 行明確設定 `-e PGUSER=postgres.ypibmyfxfhsyfdwxprpi`。
  - 第 41、148 行明確連線 `aws-0-ap-southeast-2.pooler.supabase.com:5432`（Session Pooler）與 `PGSSLMODE=verify-full`。
- **Supavisor 正常轉發行為**：Supavisor 收到 `postgres.ypibmyfxfhsyfdwxprpi` 後，依 `.ypibmyfxfhsyfdwxprpi` 路由至目標專案的後端 PostgreSQL，並以角色 **`postgres`** 進行 SCRAM-SHA-256 密碼驗證；當密碼驗證失敗時，後端 PostgreSQL 回傳 `FATAL: password authentication failed for user "postgres"`。
- **同時證實的正面事實**：此錯誤發生於**密碼驗證階段**，代表 **TCP 連線與 TLS `verify-full` 憑證/主機名驗證均已通過**，且此版 `run_supabase_backup.ps1`（Commit `86a0f11`）與 2026-11-10 成功產出備份的腳本完全一致（無未提交變更）。

### 2. 密碼驗證失敗的可能原因
1. **主要可能原因（憑證比對不符）**：互動輸入時提供的密碼與 Supabase 目前 `postgres` 角色密碼不一致（例如：於 KeePassXC 誤選其他條目如 AES 金鑰或舊密碼、貼上時前後多帶空白、或 2026-11-10 後曾在 Supabase Dashboard 重設過 Database Password）。
2. **次要腳本邊界（POSIX `read -r` 的 `$IFS` 行為）**：
   - 第 148 行容器內指令為 `tr -d '\r' | { read -r PGPASSWORD; export PGPASSWORD; exec pg_dump ...; }`。
   - 在 POSIX `sh` 中，未指定 `IFS=` 的 `read -r` 會剝除**開頭與結尾的空白/Tab**（若密碼本身前後含空白字元會導致失敗；一般無前後空白的密碼不受影響）。
   - 另 `ProcessStartInfo` 未顯式設定無 BOM UTF-8 `StandardInput` 編碼，若密碼含非 ASCII 字元在 Windows 代碼頁下可能有編碼差異。

---

## 二、PGUSER 與 Session Pooler 格式核對

| 檢查項目 | 腳本實際設定 | Supabase Session Pooler 官方格式 | 結果 |
|---|---|---|---|
| **Host / Port** | `aws-0-ap-southeast-2.pooler.supabase.com:5432` | `aws-0-<region>.pooler.supabase.com:5432` | **符合** |
| **PGUSER / `-U`** | `postgres.ypibmyfxfhsyfdwxprpi` | `postgres.[PROJECT-REF]` | **符合（未固定寫成 `postgres`）** |
| **TLS 模式** | `PGSSLMODE=verify-full` + `PGSSLROOTCERT=/certs/supabase-root.crt` | `verify-full` + Root CA | **符合** |

---

## 三、密碼傳遞方式安全性檢查

- **結論：安全（無明文外洩風險）**。
- 證據（[`run_supabase_backup.ps1:109-196`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1#L109-L196)）：
  1. 透過 `Read-Host -AsSecureString` 全程遮罩讀取。
  2. 經 `SecureStringToBSTR` 解出後立即 `ZeroFreeBSTR` 釋放 BSTR。
  3. 透過 `ProcessStartInfo.RedirectStandardInput` Stdin 管道寫入容器內部 `PGPASSWORD`（**未**使用宿主機 `docker run -e PGPASSWORD=...` 或 CLI 引數）。
  4. `finally` 區塊將 `$plainPass = $null` 並呼叫 `[System.GC]::Collect()`。

---

## 四、失敗後檔案清理與 Git 狀態檢查

1. **備份目錄檢查**（`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\`）：
   - **0 個** `20261112_*` 殘留資料夾、**0 個** 0-byte `.dump`、**0 個** 殘留明文暫存檔。
   - 腳本第 219～221 行已自動完整清除失敗目錄；`2026-11-10` 舊備份完全未動。
2. **Git 工作目錄檢查**：
   - `git status --short scripts/database/run_supabase_backup.ps1` 顯示**無任何修改**，專案程式碼與 `.env` 皆未因本次失敗而變動。

---

## 五、建議修正方向（本階段不直接修改）

1. **優先確認密碼來源（無須改程式）**：於 KeePassXC 確認所選條目確為 **Supabase Production `postgres` 資料庫密碼**（非 AES-256-GCM 備份金鑰、非舊密碼，且複製前後無多餘空白），必要時於 Supabase Dashboard 確認密碼狀態後，待下一階段授權再重試。
2. **（選配程式碼強化，待授權後評估）**：在 [`run_supabase_backup.ps1:148`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1#L148) 將 `read -r PGPASSWORD` 改為 `IFS= read -r PGPASSWORD`，避免密碼前後若有空白字元時被 `sh` 修剪（實際上目前無此必要除非密碼含前後空白）。

---

## 六、最終診斷判定

- **診斷檢查完成度**：**`PASS`（唯讀診斷已精確排除腳本 `PGUSER` 錯誤、TLS 失敗與檔案殘留問題）**
- **AUTH-02 備份任務狀態**：**`FAIL`（因 `postgres` 密碼認證未通過而中止，備份未產出，須確認正確密碼並獲授權後再執行）**

已停止於唯讀診斷階段，等待使用者下一階段授權。
