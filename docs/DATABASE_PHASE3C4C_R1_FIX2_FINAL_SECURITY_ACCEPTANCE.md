# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R1-FIX2：Supabase 雲端備份工具最終安全驗收報告

**文檔版本**：1.0 (最終安全驗收結案)  
**驗收日期**：2026-11-08  
**驗收角色**：資安審查架構師、PostgreSQL DBA、DevSecOps 稽核團隊  
**主要檔案**：
- 執行工具：`scripts/database/run_supabase_backup.ps1`
- 審查文件：`docs/DATABASE_PHASE3C4C_R1_FIX_SECURITY_REVIEW.md`
- 基礎文件：`docs/DATABASE_PHASE3C4C_R1_BACKUP_TOOL_SECURITY_AUDIT.md`
**驗收模式**：100% 離線靜態原始碼審查、語法解析與 DryRun 模擬驗證，零 Supabase 連線、零資料庫寫入。

---

## 一、審查項目判定總表 (Executive Summary)

| 審查維度 | 檢驗標的與機制 | 判定結果 |
| :--- | :--- | :---: |
| **A. TLS 模式真實執行** | `PGSSLMODE=verify-full` + 主機 SAN 嚴格比對 | **PASS** |
| **B. Root CA 完整性** | SHA-256 完整比對 (`70072358...`)、唯讀掛載、未入 Git | **PASS** |
| **C. Stdin 密碼管道** | 消除命令列引數暴露、管道串流寫入容器內部 shell | **PASS** |
| **D. Docker Image Digest** | 鎖定不可變官方 RepoDigest (`postgres@sha256:3540c036...`) | **PASS** |
| **E. 備份流程與防覆寫** | 時間戳記目錄防覆寫、中途失敗自動清理、成功後計算 SHA-256 | **PASS** |
| **F. DryRun 離線測試** | 參數與憑證離線驗證通過，零連線、零密碼輸入、零 dump 產生 | **PASS** |
| **G. 記憶體與權限剩餘風險** | 明確界定本機管理者、Docker daemon 與記憶體覆寫威脅邊界 | **PASS** |
| **整體安全審查判定** | **PASS — 具備正式雲端備份執行條件** | **PASS** |

---

## 二、TLS 真實執行與參數傳遞鏈路審查 (A)

經深入比對 `run_supabase_backup.ps1` 第 125~138 行之容器參數傳遞路徑：

1. **環境變數注入路徑**：
   ```powershell
   -e "PGSSLMODE=verify-full"
   -e "PGSSLROOTCERT=/certs/$caFileName"
   -v "${caDir}:/certs:ro"
   ```
2. **PostgreSQL libpq 核心讀取行為**：
   - 容器內部執行 `pg_dump` 時，底層 `libpq` 驅動程式會優先讀取標準環境變數 `PGSSLMODE` 與 `PGSSLROOTCERT`。
   - 當 `PGSSLMODE=verify-full` 時，`libpq` 執行兩道強制檢驗：
     - **第一道 (CA Chain)**：伺服器出示之憑證必須能被 `/certs/supabase-root.crt` 完整驗證簽章鏈。
     - **第二道 (Hostname SAN Match)**：伺服器出示之憑證必須包含連線主機名稱 `aws-0-ap-southeast-2.pooler.supabase.com`（主題備用名稱 SAN 比對）。
   - 憑證目錄透過 Docker Volume 宣告為 `:ro`（唯讀掛載），容器內部無寫入權限，防護等級達最高等級。
3. **判定**：**PASS**

---

## 三、Root CA 實體與 SHA-256 完整指紋 (B)

經唯讀讀取實體檔案與計算雜湊：

- **實體路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`
- **檔案大小**：`1,367 Bytes`
- **完整 64 位十六進位 SHA-256 指紋**：
  `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`
- **比對結果**：與自 PHASE 3C-3D 以來核准之 Supabase Root CA 官方憑證雜湊 **100% 精準吻合**。
- **專案隔離性**：憑證存放於獨立目錄 `CODE-TO-KNOW_SECRETS`，未被加入 Git 追蹤，無外洩入儲存庫風險。
- **判定**：**PASS**

---

## 四、Stdin 密碼傳遞安全性與威脅模型剖析 (C)

### 1. 密碼傳遞流程逐行稽核
- **步驟 1 (互動讀取)**：PowerShell 使用 `Read-Host -AsSecureString`，終端全程顯示 `*` 遮罩。
- **步驟 2 (管道發送)**：透過 .NET `System.Diagnostics.ProcessStartInfo` 啟動 `docker run -i`，並在 Windows 命令列中對 `sh -c` 的複合指令實施雙引號包裹（`"$containerCmd"`），使用 `process.StandardInput.WriteLine($plainPass)` 直接將密碼寫入子行程之 Stdin，隨後立即關閉 StandardInput 管道。
- **步驟 3 (容器接收)**：容器內部命令 `sh -c "read -r PGPASSWORD; export PGPASSWORD; exec pg_dump ..."`：
  - `read -r` 由 stdin 讀入變數，密碼**絕不出現在宿主機的命令列引數中**（Process Arguments）。
  - `export PGPASSWORD` 導出環境變數供後續呼叫。
  - `exec pg_dump` 以 pg_dump 取代 shell 行程，完整執行連線傾印。
- **步驟 4 (異步輸出讀取與生命週期結束)**：採用 .NET `ReadToEndAsync()` 異步讀取 stdout 與 stderr，杜絕管道緩衝死鎖；在 PowerShell `finally` 區塊中，即刻執行 `$plainPass = $null` 並主動呼叫 `[System.GC]::Collect()`。

### 2. 客觀威脅模型與剩餘風險 (Residual Risks Disclosure)
依據嚴格資安審查準則，**不得宣稱完全消除所有記憶體殘留風險**，必須誠實揭露以下剩餘風險與防護邊界：
- **.NET Managed 記憶體回收特性**：將變數設為 `$null` 並調用 GC 僅標記記憶體可被回收，但在作業系統物理記憶體被其他資料覆蓋前，具備本機管理員權限（Administrator / SYSTEM）之攻擊者若透過記憶體傾印工具（如 ProcDump），理論上仍可能在短暫時間窗口內搜尋到字串殘留。
- **Docker 守護行程層級**：Docker 容器內部 shell 在讀入 `PGPASSWORD` 後，於容器生命週期內該變數存在於容器記憶體空間中。雖然 `--rm` 保證容器結束即銷毀，且 `docker inspect` 在容器啟動時的 Config.Env 看不到此變數，但擁有 Docker Engine 管理權限（`docker exec` 注入權限）的本機使用者在備份進行的瞬間仍可探查。
- **防禦邊界總結**：本方案已徹底消除了「日誌落盤、歷史指令殘留、CLI 引數外洩、`docker inspect` 靜態探測」等最容易遭受攻擊的高危險路徑，達到本機使用者環境下的最高防護水準。
- **判定**：**PASS**

---

## 五、Docker Image 不可變 Digest 鎖定 (D)

經由 `docker inspect` 與實際呼叫測試核對：

- **官方鏡像倉庫 (Repository)**：`postgres` (Docker Official Image)
- **不可變 RepoDigest**：
  `postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
- **實體工具版本**：`pg_dump (PostgreSQL) 17.11`
- **程式碼鎖定保證**：腳本第 28 行定義 `$pinnedDockerImage = "postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac"`，後續所有 `docker run` 呼叫皆嚴格引用此變數，**無任何使用動態 `latest` 或浮動 tag 之情事**。
- **判定**：**PASS**

---

## 六、備份流程防護與中斷清理機制 (E)

- **防覆寫檢驗**：寫入前檢查 `Test-Path $targetDirPath`，若目錄存在即刻報錯中斷，防止意外覆蓋歷史備份。
- **中途失敗清理**：若 `pg_dump` 返回非 0 退出碼，`run_supabase_backup.ps1` 第 155~159 行自動執行：
  ```powershell
  if (Test-Path $dumpFilePath) { Remove-Item $dumpFilePath -Force }
  Remove-Item $targetDirPath -Force -Recurse
  ```
  確保不會留下 0 位元組或損毀的 dump 檔案被誤認為有效備份。
- **SHA-256 觸發條件**：僅在 `pg_dump` 成功退出且檔案大小大於 0 時才計算 SHA-256 並產出 `.sha256` 檔案。
- **Metadata 機密檢查**：`backup_info.json` 僅記錄檔案名稱、雜湊、檔案大小、傾印時間 (UTC) 與 TLS 模式，**絕不包含密碼或連線字串**。
- **第三方上傳**：無任何向 S3、GCS 或其他第三方雲端空間發送之網路通訊程式碼。
- **判定**：**PASS**

---

## 七、DryRun 離線模擬測試 (F)

執行離線模擬：
```powershell
powershell -ExecutionPolicy Bypass -Command "& 'scripts\database\run_supabase_backup.ps1' -DryRun"
```

### 測試輸出確認：
- 成功調用 Digest 鎖定之 Docker 容器提取 `pg_dump (PostgreSQL) 17.11`。
- 成功校驗 Root CA 雜湊相符（`70072358...`）。
- 成功解析輸出路徑與防覆寫目錄。
- 退出碼：`0`。
- **零連線證明**：DryRun 模式在密碼輸入前即刻安全退出，**完全未向 Supabase 發起網路連線，未寫入任何 dump 檔案**。
- **判定**：**PASS**

---

## 八、Git 完整性核對 (G)

- **Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（精準一致）。
- **工作目錄狀態**：保留既有所有未暫存變更與未追蹤文檔，無任何 stage、commit、push、reset 或 clean 操作。
- **專案費用**：**$0.00 USD**。

---

## 九、最終審查結論與下一步建議

### 最終驗收判定：`PASS`（具備正式備份執行條件）

本專案之備份工具 `run_supabase_backup.ps1` 已通過最嚴格的源碼級資安審查：
- TLS 達到最高等級 `verify-full`。
- Root CA 雜湊經由完整 64 位指紋鎖定。
- 密碼管道化傳遞消除了命令列與 `docker inspect` 洩漏風險。
- Docker 映像檔由 SHA-256 Digest 永久固定。
- 錯誤處理與防覆寫機制健全。

**建議下一步**：
本工具已具備正式執行雲端備份的最高安全水準。當您準備好產出第一次雲端備份時，可下達執行授權指令進入 **PHASE 3C-4C-R2**。

> **聲明**：  
> **「本階段僅完成備份工具最終安全驗收，沒有連線 Supabase，也沒有執行任何實際雲端備份。」**
