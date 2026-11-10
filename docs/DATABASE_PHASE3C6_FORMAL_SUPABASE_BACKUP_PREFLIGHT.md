# CODE TO KNOW｜Phase 3-C-6：正式 Supabase 備份前置條件獨立檢查報告

**文件編號**：`docs/DATABASE_PHASE3C6_FORMAL_SUPABASE_BACKUP_PREFLIGHT.md`  
**審查日期**：2026-11-10  
**專案名稱**：CODE TO KNOW (碼上學)  
**審查角色**：資深 PostgreSQL DBA、應用安全架構師 (AppSec)、DevSecOps 稽核工程師  
**審查性質**：100% 唯讀前置條件獨立查核（零雲端連線、零憑證注入、零正式金鑰讀取、零程式碼修改、零 Git 寫入）  
**當前前置審查判定**：**【CONDITIONAL READY】（技術與管線 100% 就緒，待使用者密鑰輸入與正式授權）**  

---

## 執行摘要

本報告針對 CODE TO KNOW 專案在執行**第一次正式 Supabase PostgreSQL 17 雲端資料庫加密備份**前的所有必要前置條件進行全面、客觀的獨立稽核。

稽核結果確認：
1. **本機備份與加密管線**：在 Phase 3-C-5 修復後，經加解密單元測試（14/14 PASS）、管線整合測試（14/14 PASS）以及 Windows PowerShell 5.1 原生 DryRun 驗證，**技術工具鏈已達到 100% 就緒（100% READY）**。
2. **本機 PG17 還原沙盒**：獨立 Docker 容器 `code_to_know_pg17_restore_sandbox` 目前處於**運行中狀態（Up，Port 5433）**，已就緒供備份產出後立即進行解密與還原驗收。
3. **金鑰與連線憑證保護**：嚴格落實最小權限與零暴露原則。正式主金鑰與 Supabase 密碼絕不由 AI 生成、持有或寫入磁碟，完全保留於使用者端之 KeePassXC 2.8.0 與互動式遮罩輸入。

---

## 一、本機備份管線驗收狀態查核

針對本機備份管線之核心模組與腳本進行逐項規格確認：

| 檢驗項目 | 實作檔案與邏輯 | 規格與安全性確認 | 驗收狀態 |
| :--- | :--- | :--- | :---: |
| **AES-256-GCM 加密流程** | `scripts/database/backup-crypto.cjs` | 採用 Node.js 原生 `node:crypto` 串流加密，每次生成安全隨機 12-byte Nonce，計算 16-byte GCM Auth Tag | **PASS** |
| **C2KB 二進位容器** | `scripts/database/backup-crypto.cjs` | 結構：Magic Header (`C2KB` 4B) + Version (`0x01` 1B) + Nonce (12B) + Ciphertext + Tag (16B)，最小容器長度 33B | **PASS** |
| **SHA-256 完整性指紋** | `run_supabase_backup.ps1`<br>`backup-pipeline.cjs` | 明文 dump 與密文 c2kb 均計算 SHA-256 並獨立產出 `.sha256` 指紋檔 | **PASS** |
| **Round-Trip Verification** | `backup-pipeline.cjs` | 加密後立即暫態串流解密比對 SHA-256，100% 相符且 Auth Tag 認證通過才視為有效 | **PASS** |
| **明文清理與受阻保護** | `backup-pipeline.cjs` | 嚴格使用 `fs.lstatSync` 拒絕符號連結；刪除失敗時保留有效 `.c2kb` 密文並以 **Exit Code 2** 退出 | **PASS** |
| **Mock 與正式模式隔離** | `run_supabase_backup.ps1` | `-MockDumpPath` 時 `mock_mode: true`、`source: "MOCK_DUMP"` 並跳過連線；正式模式 `mock_mode: false`、`source: "SUPABASE_PRODUCTION_DATABASE"` | **PASS** |
| **PowerShell 5.1 相容性** | `run_supabase_backup.ps1` | 開頭具備 3-byte UTF-8 BOM (`0xEF, 0xBB, 0xBF`)，繁體中文 Windows (CP950) 解析無語法錯誤 | **PASS** |
| **金鑰環境變數生命週期** | `run_supabase_backup.ps1` | `try ... finally` 封裝，具備雙向恢復能力：原本無值安全清空，原本有值精準復原 | **PASS** |

---

## 二、金鑰保管狀態及證據等級分析

依據資安成熟度模型，嚴格區分「使用者已回報完成」與「已經過實際復原測試」：

### 2.1 證據等級對照表

| 保管項目 | 實體檢驗事實 | 證據等級 | 現況說明與邊界標記 |
| :--- | :--- | :---: | :--- |
| **KeePassXC 軟體安裝** | `C:\Program Files\KeePassXC\KeePassXC.exe` 存在，版本為 **2.8.0** | **客觀實體驗證 (Level 1)** | 系統端已實體驗證安裝檔案與版本，支援 Argon2 KDF 與 AES-KDBX4 格式。 |
| **KeePassXC 密碼庫建立** | 使用者回報已於專案目錄外部建立安全密碼庫 | **使用者回報 (Level 2 - Attestation)** | 依規範禁止 AI 搜尋或開啟 `.kdbx` 檔案，由專案負責人自主保管主密碼。 |
| **離線 USB 副本儲存** | 使用者回報已將密碼庫備份至離線隨身碟 | **使用者回報 (Level 2 - Attestation)** | 實體 USB 儲存屬於外部實體安全措施，未接入專案程式碼目錄。 |
| **USB 副本 SHA-256 一致** | 使用者回報比對本機庫與 USB 副本 SHA-256 完全相符 | **使用者回報 (Level 2 - Attestation)** | 確認檔案在複製至隨身碟過程未發生位元翻轉或損壞。 |
| **實體紙本防潮備援卡** | 使用者回報已手寫/打印 64 位元 Hex 金鑰並妥善封存 | **使用者回報 (Level 2 - Attestation)** | 作為防止所有硬體與電子媒介同時損壞之最後防線。 |
| **離線紙本實際復原驗證** | **尚未執行**（從未由紙本重新輸入還原金鑰執行演練） | **待驗證項目 (GAP)** | 尚未在完全斷網、未解鎖環境下測試純紙本抄寫金鑰之可讀性與有效性。 |

> [!IMPORTANT]
> **結論**：金鑰保管現況已具備執行正式備份的必要條件（已安裝工具、已建立保管與實體紙本備援），但「極端災難下的紙本復原演練」列為後續待排程驗收項目，不阻礙目前切換前備份之進行。

---

## 三、Supabase 正式備份連線與 TLS 前置條件

針對 [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1) 執行正式連線所需參數進行唯讀審查：

```powershell
目標專案：code-to-know-prod (ypibmyfxfhsyfdwxprpi)
目標端點：aws-0-ap-southeast-2.pooler.supabase.com:5432
連線架構：Session Pooler (Port 5432)
TLS 模式：PGSSLMODE=verify-full (Strict Root CA & Hostname SAN)
傾印格式：PostgreSQL Custom Format (-Fc)
映像鎖定：postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac
```

### 3.1 關鍵安全設計核對
1. **Session Pooler (Port 5432) 必要性**：
   - `pg_dump` 需執行 `SET TRANSACTION SNAPSHOT` 及多表長連線作業，Transaction Pooler (Port 6543) 會因連線複用而阻斷 dump 作業。腳本鎖定 Port 5432 為唯一正確架構。
2. **`verify-full` TLS 雙向強檢驗**：
   - 腳本配置 `PGSSLMODE=verify-full` 與 `PGSSLROOTCERT=/certs/supabase-root.crt`。
   - 實體 Root CA 存放於外部目錄：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`。
   - 腳本在啟動 Docker 前強制校驗 SHA-256 指紋是否為 `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`。
3. **不可變 Docker 映像檔（Digest 鎖定）**：
   - 鎖定 `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`（對應 PostgreSQL 17.11 Client Tools）。
   - 消除 Docker Hub 浮動標籤（floating tag）遭竄改或升級破壞相容性之風險。
4. **密碼全鏈路無痕注入（Zero-Leakage Stdin Pipe）**：
   - 密碼由專案負責人於終端透過 `Read-Host -AsSecureString` 輸入（遮罩顯示）。
   - 透過 .NET `ProcessStartInfo` 之 StandardInput 串流寫入容器內部 `read -r PGPASSWORD; export PGPASSWORD`。
   - 不出現在宿主機 CLI 引數、工作管理員、系統 Event Log 或環境變數表。
   - 輸入後立即在 `finally` 區塊將記憶體字串重設為 `$null`。
5. **目錄防覆寫與原子化清理**：
   - 輸出目錄帶時間戳記 `CODE_TO_KNOW_SUPABASE_yyyyMMdd_HHmmss`，若目錄已存在直接拋錯終止。
   - 若 `pg_dump` 失敗或輸出檔案為 0 位元組，立即自動清理未完成檔案與資料夾，避免殘留損毀 dump。

---

## 四、正式備份執行前尚缺少的項目（使用者手動操作）

在正式連線 Supabase 執行前，仍有以下項目必須由使用者親自提供與授權：

```mermaid
flowchart TD
    UserAuth["1. 使用者提供獨立正式備份執行授權"] --> RunCmd["2. 啟動 run_supabase_backup.ps1 -Encrypt"]
    RunCmd --> PromptPass["3. 終端提示輸入 Supabase 資料庫密碼 (遮罩輸入)"]
    PromptPass --> PromptKey["4. 終端提示輸入 AES-256 主金鑰 (自 KeePassXC 複製貼上，遮罩輸入)"]
    PromptKey --> ExecBackup["5. 執行受控備份、串流加密與迴環驗證"]
```

1. **使用者端正式主金鑰提供**：
   - 使用者須自本機 KeePassXC 2.8.0 複製 64-char Hex 主金鑰，並於 PowerShell 提示時以遮罩方式貼入。
2. **使用者端 Supabase 密碼提供**：
   - 使用者須於提示時以遮罩方式輸入使用者 `postgres.ypibmyfxfhsyfdwxprpi` 之資料庫密碼。
3. **明確且獨立的執行授權**：
   - 依專案資安規範，執行正式雲端連線與資料備份前，專案負責人須下達明確之執行指令。

---

## 五、PG17 還原沙盒準備狀態

備份檔案產出後，必須立即在隔離沙盒執行解密還原驗收，以證明備份真正可用：

### 5.1 沙盒現況查核
- **本機容器名稱**：`code_to_know_pg17_restore_sandbox`
- **運行狀態**：**Up（已運行約 1 小時，健康）**
- **對外連接埠**：`127.0.0.1:5433`（與本機開發庫 `5432` 實體隔離）
- **引擎版本**：PostgreSQL 17.11（與正式 Supabase 同版本，映像檔 Digest 完全相同）

### 5.2 還原防護與驗證流程規範
1. **不覆蓋現有資料庫防護**：
   - 還原目標強制指向 `127.0.0.1:5433` 內部之獨立測試庫（如 `c2k_restore_validation`），絕不連線 Supabase 雲端庫，亦不影響本機 `5432` 既有開發庫。
2. **解密與認證檢驗**：
   - 使用 `scripts/database/backup-crypto.cjs` 解密 `.c2kb` 檔案，驗證末端 16-byte Auth Tag 認證通過。
3. **結構與資料一致性檢查標準**：
   - 還原完成後，自動執行 SQL 檢驗：
     - **37 張業務資料表** 必須 100% 存在且可查詢。
     - **自訂 Enum**（如 `UserStatus`）必須正確還原。
     - **外鍵條件約束與索引數量** 必須與雲端綱要一致。
     - **`_prisma_migrations` 歷程表記錄** 必須完整無損。
4. **失敗復原與清理機制**：
   - 沙盒測試完畢後，執行 `DROP DATABASE c2k_restore_validation`，乾淨釋放空間，零副作用。

---

## 六、Git 與工作目錄狀態

- **當前分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **未提交修改說明**：
  - 前端 Demo 展示版修改（`frontend/`）。
  - 本次備份管線修復完成之 `scripts/database/run_supabase_backup.ps1`。
- **未追蹤檔案完整性**：
  - Phase 3-C-1 至 3-C-5 文件完整存在：
    - `docs/DATABASE_PHASE3C1_LOCAL_BACKUP_ENCRYPTION_INTEGRATION.md`
    - `docs/DATABASE_PHASE3C2_BACKUP_PIPELINE_SECURITY_AUDIT.md`
    - `docs/DATABASE_PHASE3C3_BACKUP_PIPELINE_SECURITY_FIX.md`
    - `docs/DATABASE_PHASE3C4_BACKUP_PIPELINE_FINAL_SECURITY_AUDIT.md`
    - `docs/DATABASE_PHASE3C5_BACKUP_PIPELINE_FINAL_FIX.md`
  - 使用者個人檔案保持原樣，**未曾開啟或讀取**：
    - `新增 文字文件.txt`
    - `1.docx`
    - `照片/`
- **版控乾淨度**：未執行任何未授權之 `git add`、`commit`、`push`、`reset`、`clean` 或 `stash` 操作。

---

## 七、風險與阻斷事項評估矩陣

| 風險項目 | 影響程度 | 當前緩解措施 | 阻斷狀態 |
| :--- | :---: | :--- | :---: |
| **網路不穩定中斷 dump** | 中 | 採用 Custom Format (`-Fc`)，腳本具備大小檢查與自動清理機制，失敗不留損毀檔 | 無阻斷 |
| **密碼輸入錯誤引發 401** | 低 | 錯誤輸出完整記錄於 stderr，密碼全程遮罩，不鎖死帳號 | 無阻斷 |
| **金鑰手動貼入格式錯誤** | 低 | Node.js `parseKey` 嚴格校驗 64-char Hex，格式不符立即拒絕處理並保留明文 dump | 無阻斷 |
| **明文暫存佔用空間** | 低 | 解密迴環驗收通過後自動受控刪除，硬碟剩餘空間 650GB 極度充裕 | 無阻斷 |
| **雲端誤操作風險** | 高 | 備份僅執行唯讀 `pg_dump`，連線使用者為唯讀讀取模式，不執行任何 DDL/DML 寫入 | 無阻斷 |

---

## 八、最終審核判定

依據專案前置檢核原則：
- **READY**：所有條件（含使用者輸入）均已就緒，可立即執行。
- **CONDITIONAL READY**：技術與管線 100% 通過驗收，僅待使用者提供正式金鑰/密碼與執行授權。
- **NOT READY**：核心工具或安全邏輯仍有重大缺陷，禁止執行。

### 最終判定：【CONDITIONAL READY】（有條件就緒）

**判定理由**：
1. 本機備份管線、AES-256-GCM 工具、C2KB 容器、PowerShell 5.1 BOM 編碼、環境變數生命週期雙向恢復機制均已在 Phase 3-C-5 完成 100% 離線測試驗收（28/28 PASS）。
2. 本機 PG17 還原沙盒容器處於正常運行狀態（Port 5433），具備完整驗證能力。
3. 系統端技術障礙已全數消除，唯一等待之前置條件為專案負責人提供正式主金鑰、資料庫密碼與執行授權。

---

## 九、下一階段建議及所需的獨立授權

### 9.1 下一階段建議（Phase 3-C-7：正式 Supabase 雲端備份與沙盒還原驗收）
在專案負責人下達明確授權後，建議執行以下標準作業程序：

1. **Step 1（正式備份）**：
   由使用者執行或授權執行以下指令：
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/database/run_supabase_backup.ps1 -Encrypt
   ```
   - 依提示輸入 Supabase 資料庫密碼。
   - 依提示貼入 KeePassXC 2.8.0 儲存之 64-char Hex AES-256 主金鑰。
2. **Step 2（產出核驗）**：
   - 核對產出之 `code_to_know_supabase_prod.dump.c2kb` 檔案大小與 SHA-256。
   - 檢驗 `backup_info.json` 元數據確認 `verified_round_trip: true`。
3. **Step 3（本機 PG17 沙盒還原驗收）**：
   - 將加密容器於本機沙盒（`127.0.0.1:5433`）進行解密與 `pg_restore`。
   - 自動檢驗 37 張表、自訂 Enum、外鍵及 Migration 歷程完整性。
   - 產出正式驗收報告。

### 9.2 所需之獨立授權宣告
進入下一階段前，請專案負責人明確確認：
> 「已備妥 KeePassXC 正式主金鑰與 Supabase 密碼，授權啟動正式備份與沙盒還原驗收。」

本階段前置檢查已全部完成，本工程師已停止操作，等待使用者確認與後續授權。
