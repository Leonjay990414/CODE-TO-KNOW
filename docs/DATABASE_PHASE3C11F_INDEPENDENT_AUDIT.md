# CODE TO KNOW｜Phase 3-C-11F-補充：唯讀獨立驗收報告

- **驗收階段**：Phase 3-C-11F-補充（唯讀獨立驗收）
- **驗收日期**：2026-11-11
- **驗收性質**：100% 唯讀審查（未修改任何既有程式碼、測試或設定檔；未執行實際 `pg_restore`、`pg_dump`、`psql` 或資料庫寫入；未連線 PG16、PG17 或 Supabase；未操作 `.env`、KeePassXC 或 Git 寫入指令）
- **整體驗收判定**：**`FAIL`（不通過 — 發現現行工作區腳本遺失 UTF-8 BOM 導致 40 個 PowerShell 5.1 語法錯誤、最後測試證據晚於檔案最後修改時間，以及缺乏資料庫狀態查詢失敗之離線測試，現階段不可申請 PG17 實際還原授權）**

---

## 一、目標資料庫防覆寫驗證（判定：**`PARTIAL PASS`**）

逐項查核 [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 與 [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1)：

| 查核項目 | 實作位置與依據 | 判定 | 說明 |
| :--- | :--- | :---: | :--- |
| 1. 正式執行前是否檢查目標資料庫是否已存在 | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L432-L448) | **PASS** | 於步驟 2 (`[1/8]`) 查詢目標資料庫是否存在。 |
| 2. 若存在，是否在解密、建庫及 `pg_restore` 前拒絕 | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L362-L564) | **PASS** | 步驟 0 (`L362`) 先做名稱白名單與封鎖名單驗證；步驟 2 (`L432-L447`) 在步驟 3 Node 解密 (`L453`)、步驟 6 `CREATE DATABASE` (`L530`) 與步驟 7 `pg_restore` (`L563`) 之前即拋錯中止。 |
| 3. 檢查使用的資料來源與錯誤處理方式 | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L436-L447) | **PASS** | 使用 `docker exec -i $SandboxContainer psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$TargetDatabase';"`；若 `$LASTEXITCODE -ne 0` 拋 `[DOCKER ERROR]`；若輸出 `.Trim() -eq "1"` 拋 `[ABORT: DB EXISTS]`。 |
| 4. 無法確認資料庫狀態時是否採取 fail-closed | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L426-L447) | **PARTIAL PASS** | 若 `docker inspect` 失敗 (`L427`) 或 `psql` `$LASTEXITCODE -ne 0` (`L438`) 均立即 `throw` 中止（fail-closed）；惟若 `psql` 意外以 ExitCode 0 回傳非 `"1"` 且非空白之異常字串，程式碼未額外拒絕，建議收斂為僅明確空值/`"0"` 視為不存在。 |
| 5. 預設目標是否為 `code_to_know_c2kb_prod_restore_clean_v2` | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L37) | **PASS** | `$TargetDatabase = "code_to_know_c2kb_prod_restore_clean_v2"`（由 [`TC-27`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L488-L494) 驗證）。 |
| 6. 舊的部分還原資料庫是否不會被覆蓋或刪除 | [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L66-L76) | **PASS** | `code_to_know_c2kb_prod_restore_test` 與 `code_to_know_cloud_restore_test`、`code_to_know`、`postgres`、`template0`、`template1` 列於 `$blockedNames`，於解密前即遭 `[DB SAFETY ERROR]` 拒絕（由 [`TC-28`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L496-L502) 驗證）。 |
| 7. 是否存在任何 `DROP DATABASE`、自動刪除或覆蓋流程 | 全檔唯讀檢查 | **PASS** | `restore_pg17_sandbox.ps1` 全檔無任何 `DROP DATABASE` 或覆蓋邏輯；失敗時依 `FIX-06` (`L713-L719`) 保留部分還原庫並輸出警告（由 [`TC-30`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L512-L522) 驗證）。 |

### 離線測試模擬涵蓋度查核

| 模擬情境 | 對應測試與機制 | 判定 | 說明 |
| :--- | :--- | :---: | :--- |
| 目標資料庫不存在 | [`TC-01`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L213-L218)、[`TC-27`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L488-L494) | **PASS** | `-MockScenario AllSuccess` 走過 `$dbCheckOutput = "0"`（`L442`）不中止之正常路徑。 |
| 目標資料庫已存在 | [`TC-14`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L331-L336) | **PASS** | `-MockScenario DbExistsAbort` 設 `$dbCheckOutput = "1"`（`L434-L435`），觸發 `[ABORT: DB EXISTS]` 與 ExitCode `1`。 |
| **資料庫狀態查詢失敗** | **無對應 `-MockScenario` 與測試案例** | **NOT VERIFIED** | [`TC-03`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L227-L232) 使用 `-MockScenario DockerCheckFail`，僅在 `L423-L424`（`docker inspect` 階段）拋錯中止，**尚未觸及 `L433-L440` 的 `SELECT 1 FROM pg_database` 查詢失敗分支**；腳本亦無獨立模擬 `psql` 資料庫存在性查詢失敗之 `-MockScenario`。 |

---

## 二、TOC 簽章逐項驗證（設計邏輯 **`PASS`**；最新磁碟檔執行狀態因 AST 阻斷為 **`NOT VERIFIED`**）

### 2.1 10 個 Vault TOC ID 逐項核對

依據 [`docs/DATABASE_PHASE3C11C_VAULT_EXCLUSION_READINESS_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11C_VAULT_EXCLUSION_READINESS_AUDIT.md#L28-L39) 對真實備份 `PGDMP` TOC 之二進位唯讀解析，與 [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L247-L259) `$expectedSignatures` 逐項對照如下：

| TOC ID | 實際物件類型 (`desc`) | 實際 `namespace` 欄位 | 實際物件名稱 / 標籤 (`tag`) | 程式碼比對簽章正規式 (`L248-L259`) | 歸屬確認 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| `5` | `EXTENSION` | `-` (`NULL`) | `supabase_vault` | `^EXTENSION\s+-\s+supabase_vault\b` | Supabase Vault 擴充套件 |
| `13` | `SCHEMA` | `-` (`NULL`) | `vault` | `^SCHEMA\s+-\s+vault\b` | Vault Schema |
| `3777` | `TABLE DATA` | `vault` | `secrets` | `^TABLE DATA\s+vault\s+secrets\b` | `vault.secrets` 資料區段 |
| `4791` | `ACL` | `-` (`NULL`) | `SCHEMA vault` | `^ACL\s+-\s+SCHEMA\s+vault\b` | `vault` Schema ACL |
| `4794` | `COMMENT` | `-` (`NULL`) | `EXTENSION supabase_vault` | `^COMMENT\s+-\s+EXTENSION\s+supabase_vault\b` | `supabase_vault` 註解 |
| `4888` | `ACL` | `vault` | `FUNCTION _crypto_aead_det_decrypt(...)` | `^ACL\s+vault\s+FUNCTION\s+_crypto_aead_det_decrypt\(` | `vault` 函式 ACL |
| `4889` | `ACL` | `vault` | `FUNCTION create_secret(...)` | `^ACL\s+vault\s+FUNCTION\s+create_secret\(` | `vault` 函式 ACL |
| `4890` | `ACL` | `vault` | `FUNCTION update_secret(...)` | `^ACL\s+vault\s+FUNCTION\s+update_secret\(` | `vault` 函式 ACL |
| `4997` | `ACL` | `vault` | `TABLE secrets` | `^ACL\s+vault\s+TABLE\s+secrets\b` | `vault.secrets` ACL |
| `4998` | `ACL` | `vault` | `TABLE decrypted_secrets` | `^ACL\s+vault\s+TABLE\s+decrypted_secrets\b` | `vault.decrypted_secrets` ACL |

### 2.2 7 項 TOC 規則之程式碼位置與測試對應

| 檢查要求 | 實際程式碼位置 | 對應測試位置 | 設計邏輯核對 |
| :--- | :--- | :--- | :---: |
| 1. 每個 ID 都只對應預期的 Supabase Vault 項目 | `L247-L259` (`$expectedSignatures`)、`L165-L167`（額外確認不屬 `public`） | [`TC-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L371-L409) | **PASS**（靜態檢視） |
| 2. ID 與物件簽章必須同時符合才可排除 | `L160-L170`（以 ID 查表後再以 `-cnotmatch` 驗簽章） | [`TC-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L371-L409)、[`TC-22`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L435-L442) | **PASS**（靜態檢視） |
| 3. 不得只靠 ID 或模糊文字判斷 | `L142` 嚴格解析 `^(\d+);\s+\d+\s+\d+\s+(.+)$`，`L160-L175` 不對 `vault` 做模糊排除，若出現預期 10 項外之 Vault 項目於 `L173-L175` 立即拋錯中止 | [`TC-22`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L435-L442)、[`TC-24`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L453-L469) | **PASS**（靜態檢視） |
| 4. 任何 ID 缺少、重複或簽章不符都必須停止 | 重複 ID：`L150-L152`；簽章不符：`L162-L164`；缺少 ID：`L189-L196` | [`TC-21`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L426-L433)、[`TC-22`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L435-L442)、[`TC-23`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L444-L451) | **PASS**（靜態檢視） |
| 5. 保留 916 個項目及全部 337 個 `public` 核心項目 | 數量配對 `926->916` / `919->909` (`L199-L212`)；`public=337` (`L101-L106`, `L214-L216`, `L311-L318`) | [`TC-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L371-L409)、[`TC-20`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L411-L425)、[`TC-24`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L453-L469) | **PASS**（靜態檢視） |
| 6. 保留 `pgcrypto`、`uuid-ossp`、`pg_stat_statements` | `L177-L179`、`L219-L224` | [`TC-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L400-L404) | **PASS**（靜態檢視） |
| 7. 原始 TOC 不得被修改 | `L261`、`L280`（寫入獨立 `$FilteredTocPath`）、`L321-L324` 比對 `$rawBytesBefore.Length -ne $rawBytesAfter.Length` | [`TC-19`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L405-L408)、[`TC-32`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L544-L574) | **PASS**（靜態檢視） |

> 註：雖然上述邏輯與測試對應於原始碼檢視皆存在，**但因 [`restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 目前存在 40 個 PowerShell 5.1 AST 錯誤（見第三節），目前磁碟版本的實際測試通過狀態為 `NOT VERIFIED`**。

---

## 三、測試證據檢查（關鍵風險項：**`FAIL`** / **`NOT VERIFIED`**）

唯讀核對各檔案最後修改時間（`LastWriteTimeUtc`）、日誌 `task-9635.log`、`git diff` 與 [`docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md) 之證據時間線如下：

| 檢查標的 | 檔案最後修改時間 (`UTC`) | 最近執行紀錄時間 | 唯讀實測 / 證據判讀 | 狀態 |
| :--- | :--- | :--- | :--- | :---: |
| **AES-256-GCM：14/14** (`backup-crypto.test.cjs` / `backup-crypto.cjs`) | `2026-11-09 11:50:16` / `11:50:45` | `2026-11-11 09:49:48~09:49:53 UTC` (`17:49:48~17:49:53+08:00`) | 兩檔自 2026-11-09 後未再修改，該次實跑觀察 `14 / 14 PASS`、退出碼 `0`（惟 `11F` 報告未附執行時間戳）。 | **PASS** |
| **Backup Pipeline：14/14** (`backup-pipeline.test.cjs` / `backup-pipeline.cjs`) | `backup-pipeline.test.cjs`: **`2026-11-11 09:54:56 UTC`** | `2026-11-11 09:49:49~09:50:03 UTC` (`17:49:49~17:50:03+08:00`) | 原執行結果雖為 `14 / 14 PASS`、退出碼 `0`，但 **`backup-pipeline.test.cjs` 於該次執行之後（`09:54:56Z`）再次被修改**（新增第 1 行空白與第 262 行 `catch { }` 空格），故對目前磁碟最新版本無執行證據。 | **NOT VERIFIED** |
| **PowerShell 5.1 AST 語法檢查** | `restore_pg17_sandbox.ps1`: `09:53:08Z`<br>`restore_pg17_sandbox.test.ps1`: `09:53:12Z` | 本次唯讀實測（`17:55:44+08:00`） | `restore_pg17_sandbox.test.ps1`：`BOM=True`, `AST_ERRORS=0`；**`restore_pg17_sandbox.ps1`：`BOM=False`, `AST_ERRORS=40`！**（於 `09:53:08Z` 重存時遺失 UTF-8 BOM，PowerShell 5.1 將中文錯誤解析為 ANSI/Big5 導致第 40、67、120 行等爆出 40 個語法錯誤，現況無法執行。） | **FAIL** |
| **PG17 Restore：33/33** (`restore_pg17_sandbox.test.ps1`) | `restore_pg17_sandbox.ps1`: **`09:53:08Z`**<br>`restore_pg17_sandbox.test.ps1`: **`09:53:12Z`** | `task-9635.log`: **`09:51:40 UTC`**；報告寫入：`09:52:10 UTC` | `task-9635.log`（`33/33 PASS`, ExitCode `0`）早於兩支 `.ps1` 檔最後修改時間（`09:53:08Z` / `09:53:12Z`）近 90 秒，且現行 `restore_pg17_sandbox.ps1` 已無法通過 PowerShell 5.1 AST 解析，故現行版本之 33/33 結果無效／未確認。 | **NOT VERIFIED** |
| **UTF-8 無 BOM（`-L` 清單）、LF 換行、原始 TOC 保留** | `restore_pg17_sandbox.ps1`: **`09:53:08Z`** | 依附於 `task-9635.log` (`09:51:40Z`) | 程式碼 [`L271-L324`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L271-L324) 實作邏輯仍正確，但因所依附之測試紀錄早於 `09:53:08Z` 修改且現況腳本 AST 失敗，對最新檔案狀態無法證明已通過。 | **NOT VERIFIED** |

---

## 四、Git 與檔案狀態檢查（判定：**`PARTIAL PASS`**）

唯讀執行 `git branch --show-current`、`git rev-parse HEAD`、`git status --short` 與 `git diff` 結果：

1. **Git 分支與 HEAD**：
   - Branch：`main`
   - HEAD：`86a0f1116693bcce476b8747a446900d54b29a4a`（與 Phase 3-C-11F 修改前基準完全一致，未執行任何 Git 寫入操作）。
2. **工作區檔案狀態分類**：
   - **Phase 3-C-11F 預期異動／新增**：
     - `M scripts/database/restore_pg17_sandbox.ps1`（`git diff --stat` 顯示 `488` 行變更；與測試檔合計 `777 insertions(+), 143 deletions(-)`）
     - `M scripts/database/restore_pg17_sandbox.test.ps1`
     - `?? docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md`
     - `?? docs/DATABASE_PHASE3C11F_INDEPENDENT_AUDIT.md`（本驗收報告）
   - **本階段出現之非預期異動（`FAIL` / 須釐清）**：
     - `M scripts/database/backup-pipeline.test.cjs`（最後修改 `09:54:56 UTC`，非 Phase 3-C-11F 核准範圍，含 2 處格式／空白變更）
     - `restore_pg17_sandbox.ps1` (`09:53:08Z`) 與 `restore_pg17_sandbox.test.ps1` (`09:53:12Z`) 在報告產出後疑遭編輯器自動格式化或重新存檔，並移除 `restore_pg17_sandbox.ps1` 之 UTF-8 BOM。
   - **既有工作區狀態（Phase 3-C-11F 前已存在之個人檔案與前期文件，未遭本階段破壞）**：
     - `D "~$DE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx"`、`M "新增 文字文件.txt"`、`?? 1.docx`、`?? 照片/`、`?? tmp/`
     - `?? docs/DATABASE_PHASE3C11C_VAULT_EXCLUSION_READINESS_AUDIT.md`、`11D`、`11E`、`GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`
3. **修改前後差異摘要**：
   - `scripts/database/restore_pg17_sandbox.ps1`：預設 `-TargetDatabase` 由 `code_to_know_c2kb_prod_restore_test` 改為 `code_to_know_c2kb_prod_restore_clean_v2`；新增 `Assert-SafeTargetDatabaseName`、`Get-PgRestoreArguments`、`Test-IsPublicCoreTocBody`、`Test-IsVaultOrSupabaseVaultBody`、`Parse-AndVerifyFilteredToc`、`Invoke-StrictTocFilterAndVerify`；步驟 5 新增 `-L` 過濾清單產生與編碼驗證；步驟 7 採用 `-L` 執行 `pg_restore` 並紀錄 `#4698` 不預先忽略說明；步驟 9 擴充本地與容器 TOC 暫存清理。
   - `scripts/database/restore_pg17_sandbox.test.ps1`：保留並適配 `TC-01`~`TC-18`，新增 `New-MockRawTocFile` 與 AST 輔助載入，擴充至 `TC-01`~`TC-33`。

---

## 五、明確驗收結論

1. **是否符合 Phase 3-C-11F 原始要求**：**否（整體判定 `FAIL`）**。雖然 TOC 過濾設計（10 筆 Vault ID + 簽章雙重驗證）、目標庫防覆寫規則與 `-L` 還原參數方向正確，但現行磁碟檔案存在 3 項具體阻塞／缺失，不符合交付與驗收標準。
2. **是否仍有需要修正的問題**：**是，須修正以下 4 項**：
   - **【阻斷 P0】`restore_pg17_sandbox.ps1` 遺失 UTF-8 BOM**：補回 `0xEF 0xBB 0xBF` BOM（與關閉會剝除 BOM 的自動存檔設定），使 PowerShell 5.1 AST 恢復為 `0` 錯誤。
   - **【測試缺口 P1】補齊「資料庫狀態查詢失敗」離線測試**：於 `restore_pg17_sandbox.ps1` 新增 `-MockScenario DbCheckFail` 覆蓋 `SELECT 1 FROM pg_database` (`$LASTEXITCODE -ne 0`) 之 fail-closed 路徑（並評估對非預期非空回傳字串之防呆），於 `restore_pg17_sandbox.test.ps1` 新增對應測試案例。
   - **【範圍整潔 P2】處理 `backup-pipeline.test.cjs` 非預期格式異動**：檢視 `git diff scripts/database/backup-pipeline.test.cjs` 決定保留或還原，避免夾帶無關變更。
   - **【重新驗證 P0】對最終定版檔案完整重跑測試**：修正完成後，**不再修改任何 `.ps1`/`.cjs` 檔案**，重新執行 `PowerShell 5.1 AST`、`backup-crypto.test.cjs`、`backup-pipeline.test.cjs` 及 `restore_pg17_sandbox.test.ps1`，並留存晚於檔案 `LastWriteTimeUtc` 的完整測試證據。
3. **是否可以申請下一階段的 PG17 實際還原授權**：**否（REJECTED — 現階段禁止申請實際還原授權）**，必須完成上述修正與最終版本完整重驗後，方可重新申請審查與授權。

---

*本唯讀獨立驗收報告已完成並停止，未修改任何現有程式碼/測試/設定，亦未進行任何資料庫或 Git 操作。*
