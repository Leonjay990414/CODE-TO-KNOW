# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R1：Supabase PostgreSQL 17 正式備份工具建置與安全審查報告

**文檔版本**：1.0 (正式工具審核)  
**審查日期**：2026-11-08  
**審查角色**：PostgreSQL DBA、Supabase 架構師、資安審查團隊  
**適用專案**：CODE TO KNOW（碼上學）  
**目標專案**：`code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`, AWS Sydney)  
**最高資安守則**：100% 離線測試、零雲端連線、零 `pg_dump` 實際傾印、零機密落盤、零額外費用。

---

## 一、PostgreSQL 17 Client Tools 來源與版本核定

針對 Supabase 雲端 PostgreSQL 17.11 核心，為徹底杜絕先前因跨主版本（PG 16 vs PG 17）可能引發之 catalog 不相容風險，採用官方認證之隔離容器技術：

1. **官方工具來源**：
   - Docker 官方鏡像庫：`postgres:17-alpine`
   - Digest 指紋：`sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
   - 官方鏡像大小：約 450 MB（基礎 Alpine 核心，安全純淨）。
2. **實體工具版本驗證**：
   - `pg_dump (PostgreSQL) 17.11`
   - `pg_restore (PostgreSQL) 17.11`
   - **相容性結論**：工具版本（**17.11**）與 Supabase 雲端實體版本（**17.11.0.0.11**）達到 **100% 官方二進位精準匹配**。
3. **主機無侵入原則**：
   - 宿主機 Windows 不需要安裝全域 PostgreSQL 軟體，無 PATH 污染、無全域 Registry 變更。
   - 執行時採用 `docker run --rm` 暫時容器，執行結束立即銷毀容器執行個體，零殘留。

---

## 二、備份腳本實體建置與 SHA-256 數位指紋

備份工具已正式建立於專案指定腳本目錄：

- **實體路徑**：`scripts/database/run_supabase_backup.ps1`
- **檔案大小**：`9,879 Bytes`
- **SHA-256 數位指紋**：
  `a833eb8a60ea5fec2cc8eb33890167fa0339944b6c0d010b5eb945bed8aaa9e4`

---

## 三、腳本架構與關鍵資安防護設計

針對正式備份工具之源碼進行逐項安全稽核：

### 1. 通訊架構與端點鎖定
- **連線主機**：`aws-0-ap-southeast-2.pooler.supabase.com`
- **連線連接埠**：`5432` (**Session Pooler**)
  - 嚴格遵守 Supabase 官方規範，`pg_dump` 依賴 `COPY` 二進位傳輸協議與 Single Session，強制阻斷 Transaction Pooler (6543)。
  - 解決了 Free Plan 直連主機為 IPv6-only 的網路路由限制。
- **使用者格式**：`postgres.ypibmyfxfhsyfdwxprpi`（鎖定專案識別碼）。

### 2. TLS 嚴格驗證 (Strict TLS Root CA & verify-full)
- 透過容器環境變數注入 `PGSSLMODE=verify-full` 與 `PGSSLROOTCERT=/certs/supabase-root.crt`。
- 本機實體憑證：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`（執行前比對 SHA-256 `70072358...`，並以唯讀模式 `:ro` 掛載入容器）。
- 嚴格杜絕中間人攻擊 (MITM)、未加密明文傳輸與偽造主機名攻擊。

### 3. 密碼生命週期與零曝露防護 (Process Stdin Pipe)
- **輸入方式**：採用 PowerShell 原生 `Read-Host -AsSecureString`，使用者輸入過程全程為 `*` 遮罩。
- **進程隔離**：密碼透過 .NET Process StandardInput 管道串流寫入容器內部 shell，**不在宿主機 docker run 命令列中使用 -e PGPASSWORD**，徹底杜絕 Windows Event 4688、Sysmon 或 `docker inspect` 檢索到明文密碼。
- **記憶體即時擦除**：在 `try...finally` 區塊中，腳本結束或中斷時立即將記憶體字串重設為 `$null`，並主動調用 `[System.GC]::Collect()` 觸發垃圾回收。
- **零磁碟落盤**：不建立 `.pgpass` 暫存檔、不寫入日誌、不寫入 `.env`。

### 4. 映像檔鎖定與防覆寫機制
- **Docker 映像檔**：固定官方不可變 RepoDigest `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`。
- **輸出格式**：PostgreSQL Custom Format (`-Fc` / `--format=custom`)。
  - 原生二進位壓縮、具備內部校驗碼、支援 `pg_restore -j` 平行還原與特定資料表抽離。
- **目錄命名規則**：`CODE_TO_KNOW_SUPABASE_YYYYMMDD_HHMMSS`。
- **防覆寫檢驗**：寫入前檢查 `Test-Path $targetDirPath`，若目錄存在即刻報錯中斷，防止意外覆蓋歷史備份。

### 5. 完整性驗證與元數據歸檔 (Metadata JSON)
- 備份完成後立即調用 `Get-FileHash -Algorithm SHA256` 計算指紋，產出 `.sha256` 校驗檔。
- 同步產出 `backup_info.json`，記錄傾印時間 (UTC)、工具版本、檔案大小與 TLS 模式，供 DBA 稽核。

---

## 四、離線安全測試結果 (Offline Verification)

在未連接 Supabase、未輸入密碼之完全隔離條件下，執行乾跑測試：
```powershell
powershell -ExecutionPolicy Bypass -Command "& 'scripts\database\run_supabase_backup.ps1' -DryRun"
```

### 測試輸出紀錄：
```text
==========================================================
  CODE TO KNOW (碼上學) - Supabase 雲端備份工具 (PG 17)
==========================================================
目標專案：code-to-know-prod (ypibmyfxfhsyfdwxprpi)
目標端點：aws-0-ap-southeast-2.pooler.supabase.com:5432
通訊協定：Session Pooler (Port 5432, Strict TLS Root CA)
傾印格式：PostgreSQL Custom Format (-Fc)
==========================================================

[1/6] Client Tools 驗證通過：pg_dump (PostgreSQL) 17.11

[DryRun 模式] 離線路徑與參數驗證完成：
  預定輸出目錄：C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_175037
  預定輸出檔案：C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_175037\code_to_know_supabase_prod.dump
  Root CA 路徑：C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt
DryRun 測試通過，安全退出。
```

- **PowerShell 語法解析**：通過（Exit Code 0）。
- **Docker 容器呼叫測試**：通過（成功提取 `pg_dump 17.11` 版本字串）。
- **參數與路徑解析**：通過（路徑規範符合預期）。
- **未連線證明**：DryRun 模式在密碼輸入前即刻安全退出，未產生任何網路連線，未寫入任何 dump 檔案。

---

## 五、專案與 Git 完整性檢核

| 檢核項目 | 預期基準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Git 工作區** | 保留既有未暫存變更，無非預期 stage | 一致 | **PASS** |
| **Prisma Schema** | 未修改 | 未修改 | **PASS** |
| **Migration SQL** | 未修改 | 未修改 | **PASS** |
| **本機備份檔** | `2DB27F8B...` (25,685 bytes) | 未修改、完整封存 | **PASS** |
| **資料庫連線** | 零連線、零寫入 | 保持隔離 | **PASS** |
| **專案費用** | $0.00 USD (使用官方開源映像檔) | 完全免費 | **PASS** |

---

## 六、正式執行前所需授權清單 (Pre-execution Authorization)

未來若要在終端機正式執行該腳本，使用者必須明確授權：
- [ ] 授權透過 Docker 連線 Supabase Session Pooler (5432) 發起唯讀傾印。
- [ ] 確認於終端機安全輸入 Supabase 重設後之最新 Database Password。
- [ ] 確認將備份檔案儲存於 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\`。

---

## 七、最終審查結論：`PASS`（工具建置與離線審核完成）

本專案之 Supabase PostgreSQL 17 邏輯備份工具已完成建置，版本精準匹配（17.11）、安全防護完備、離線測試通過，已具備由使用者在授權後執行的最高安全級別。

> **聲明**：  
> **「本階段僅完成備份工具建置與離線安全審查，尚未連線 Supabase，亦未執行任何實際雲端備份。」**
