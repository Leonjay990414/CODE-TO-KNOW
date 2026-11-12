# CODE TO KNOW｜Phase 3-C-11G：Restore 腳本最終修復與完整重驗報告

- **階段名稱**：Phase 3-C-11G：Restore 腳本最終修復與完整重驗
- **執行日期**：2026-11-11
- **執行範圍**：僅限修復本機 Restore 腳本與測試、查明 Backup Pipeline 測試檔異動、對最新磁碟檔案重新執行全部離線自動化測試並產出本報告；**100% 離線作業，未執行任何真實資料庫操作、未執行 `pg_restore`、未連線 Supabase**

---

## 1. 修改前 Git 狀態與 HEAD

- **Git 分支**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（與預期基準一致，未切換分支或重設）
- **修改前工作區狀態**：
  - `M scripts/database/backup-pipeline.test.cjs`（SHA-256: `E67EF0A512DCE60ABCFADA3E924CA50FBC262499696CBDEE0E7AC59B69F4AB0B`, `18942` bytes, `BOM=False`, `HasCR=False`, `2026-11-11T09:54:56.8233630Z`）
  - `M scripts/database/restore_pg17_sandbox.ps1`（SHA-256: `7B0435299690863F79858E10DE25FF26BE7A907FBCFE32BDD332A5BF65844BA7`, `39416` bytes, `BOM=False`, `HasCR=False`, `2026-11-11T09:53:08.0700061Z`）
  - `M scripts/database/restore_pg17_sandbox.test.ps1`（SHA-256: `0131F06C175A5BBC3D7128C258412101EF28B3898F978BC9A58290DF21BDD0E2`, `35239` bytes, `BOM=True`, `HasCR=False`, `2026-11-11T09:53:12.1835820Z`）
  - 未變動之既有加密/管線檔案：
    - `scripts/database/backup-crypto.cjs`（`11431` bytes, `BOM=False`, `2026-11-09T11:50:16.8576379Z`, SHA-256 `7BA2D5567B3F9DE8874D89A48FF9D1BE2BD924A07B1824FD7E997C9156BF6BF6`）
    - `scripts/database/backup-crypto.test.cjs`（`11610` bytes, `BOM=False`, `2026-11-09T11:50:45.4195873Z`, SHA-256 `CA0ADE08AE298174177597FAEEECEA8098D67D8512F8066F5573ABC764F724C1`）
    - `scripts/database/backup-pipeline.cjs`（`8941` bytes, `BOM=False`, `2026-11-10T11:48:46.4666066Z`, SHA-256 `3659AA42E580EA1DBC14E849E483C6B996562773D36590E923B8675C828D5FD7`）
  - 既有報告與個人未追蹤項目：`DATABASE_PHASE3C11C...` ~ `11F`、`GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`、`1.docx`、`新增 文字文件.txt`、`照片/`、`tmp/`、`D "~$DE_TO_KNOW_20..."`（完整保留未動）。

---

## 2. 修改檔案清單

本階段僅異動或新增下列 3 個檔案：

1. [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1)（最終 `40841` bytes, `BOM=True`, `HasCR=False`, `2026-11-11T10:00:32.8394472Z`, SHA-256: `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440`）
2. [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1)（最終 `39671` bytes, `BOM=True`, `HasCR=False`, `2026-11-11T10:00:57.5356783Z`, SHA-256: `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4`）
3. [`docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md)（本階段最終修復與重驗報告）

---

## 3. 每個檔案修改原因

1. **[`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1)**：
   - **修復 UTF-8 BOM**：回復標準 UTF-8 BOM (`0xEF 0xBB 0xBF`) 以相容 Windows PowerShell 5.1 解析繁體中文，消除原本 40 個 AST 語法錯誤。
   - **強化資料庫狀態查詢 fail-closed 檢查與離線 Mock**：新增 [`Assert-TargetDatabaseAbsentResult`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L79-L100)，在步驟 2 (`[1/8]`) 執行 `SELECT 1 FROM pg_database` 後，對任何執行例外、`psql ExitCode -ne 0`、`1`（已存在）及「非空白 / 非 `"0"` / 非 `"1"`」之無法辨識輸出皆立即拋錯中止；並新增 `-MockScenario` 支援 `DbQueryExecFail`、`DbQueryNonZeroExit`、`DbQueryUnrecognized`。
2. **[`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1)**：
   - 將 `$totalTests` 擴充至 **37** 項，納入 `Assert-TargetDatabaseAbsentResult` 至 AST 抽取清單。
   - 新增 `TC-34` 至 `TC-37`（含共用斷言函式 `Assert-AbortedBeforeDecryptCreateRestore`），補齊資料庫狀態查詢執行失敗、非 0 Exit Code、無法辨識輸出、Docker 檢查失敗與目標庫已存在時之 fail-closed 與「不解密、不建庫、不執行 `pg_restore`」驗證；並維持 UTF-8 BOM。
3. **[`docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md)**：
   - 記錄本階段修復、調查結論與最終磁碟版本實測證據。

---

## 4. BOM 修復前後驗證

| 檔案 | 修復前狀態 | 修復後實測狀態 |
| :--- | :--- | :--- |
| `scripts/database/restore_pg17_sandbox.ps1` | `BOM=False`, `HasCR=False`, `AST_ERRORS=40` | `BOM=True` (`EF BB BF`), `HasCR=False`, **`AST_ERRORS=0`** |
| `scripts/database/restore_pg17_sandbox.test.ps1` | `BOM=True`, `HasCR=False`, `AST_ERRORS=0` | `BOM=True` (`EF BB BF`), `HasCR=False`, **`AST_ERRORS=0`** |

- 繁體中文字串與既有邏輯皆完整保留，未受重存破壞。

---

## 5. 資料庫查詢失敗測試結果（含正常放行與各失敗情境）

透過 `TC-01`、`TC-03`、`TC-14`、`TC-27` 及新增 `TC-34`~`TC-37` 達成全部 9 項要求（100% 離線 Mock 與 AST 函式直測，未連線真實資料庫）：

| 驗收情境 | 對應測試案例 | 實測結果 |
| :--- | :--- | :---: |
| 1. 目標資料庫不存在：允許進入後續流程 | `TC-01`、`TC-27`、[`TC-36`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L622-L639)（實測 `""`, `$null`, `"0"` 放行） | **PASS** |
| 2. 目標資料庫已存在：立即拒絕 | `TC-14`、[`TC-36`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L632-L639)、[`TC-37`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L641-L647) | **PASS** |
| 3. `psql` 查詢執行失敗：立即拒絕 | [`TC-34`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L604-L607)（`-MockScenario DbQueryExecFail`） | **PASS** |
| 4. `psql` Exit Code 非 0：立即拒絕 | [`TC-35`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L609-L620)（`-MockScenario DbQueryNonZeroExit` + `Assert-TargetDatabaseAbsentResult -PsqlExitCode 1`） | **PASS** |
| 5. 查詢結果無法辨識：立即拒絕 | [`TC-36`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L622-L639)（`-MockScenario DbQueryUnrecognized` + `"2"`, `"ERROR: server closed connection"`） | **PASS** |
| 6. Docker 或容器檢查失敗：立即拒絕 | `TC-03`、[`TC-37`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1#L641-L647)（`-MockScenario DockerCheckFail`） | **PASS** |
| 7. 查詢失敗時不得解密備份 | `TC-34`~`TC-37` 均通過 `Assert-AbortedBeforeDecryptCreateRestore` 檢查輸出無解密階段訊息 | **PASS** |
| 8. 查詢失敗時不得建立資料庫 | `TC-34`~`TC-37` 均通過檢查輸出無建庫階段訊息 | **PASS** |
| 9. 查詢失敗時不得執行 `pg_restore` | `TC-34`~`TC-37` 均通過檢查輸出無 `PG_RESTORE ARGS` / 還原成功訊息 | **PASS** |

---

## 6. `backup-pipeline.test.cjs` 異動調查

1. **Git Diff 檢查**：`git diff scripts/database/backup-pipeline.test.cjs` 僅有 2 處空白差異：
   - 第 1 行新增 1 行空白行；
   - 第 262 行 `} catch {}` 變為 `} catch { }`（增加 1 個空白字元）。
2. **SHA-256 比對**：
   - `HEAD` 版本（`18940` bytes）：`7B58A134F143EE7002DF4F76C927FEE98558CDA48503716060E62A152623C653`
   - 目前工作區（`18942` bytes）：`E67EF0A512DCE60ABCFADA3E924CA50FBC262499696CBDEE0E7AC59B69F4AB0B`
3. **影響評估與處理決策**：確認純屬空白／格式異動（檔案當時正於使用者編輯器開啟於第 2 行），**完全不影響任何測試邏輯或斷言**；依「不得直接還原整個檔案、不得覆蓋使用者既有修改」原則保留現況（標記為使用者編輯器存檔產生之無害空白格式異動），並直接針對此最終版本重新執行測試取得 `14/14 PASS`。

---

## 7. AES-256-GCM 測試結果及 Exit Code

- **指令**：`node scripts/database/backup-crypto.test.cjs`（於所有最終檔案定版後執行：`18:01:08~18:01:12+08:00`）
- **結果**：`14 / 14 個案例全數通過！`（`TC-01` ~ `TC-14` 全數 `PASS`）
- **Exit Code**：`0`

---

## 8. Backup Pipeline 測試結果及 Exit Code

- **指令**：`node scripts/database/backup-pipeline.test.cjs`（於所有最終檔案定版後執行：`18:01:09~18:01:21+08:00`，晚於 `09:54:56Z` 修改時間）
- **結果**：`14 / 14 個案例全數通過！`（`TC-01` ~ `TC-14` 全數 `PASS`）
- **Exit Code**：`0`

---

## 9. Restore 全部測試結果及 Exit Code

- **指令**：`powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\database\restore_pg17_sandbox.test.ps1`（於所有最終檔案定版後執行：`18:01:09~18:01:50+08:00`，晚於兩支 `.ps1` 最終修改時間 `10:00:32Z` / `10:00:57Z`）
- **總結**：**`37 / 37 個案例全數通過！ (失敗: 0)`**
- **Exit Code**：**`0`**

| 測試編號 | 測試案例名稱摘要 | 實測結果 |
| :---: | :--- | :---: |
| `TC-01` | 所有必要命令成功 (全流程 PASS，ExitCode 0) | PASS |
| `TC-02` | Node 解密失敗 (AuthTag 錯誤中斷，無 PASS，ExitCode 1) | PASS |
| `TC-03` | Docker 命令失敗 (容器未運行或連線失敗，ExitCode 1) | PASS |
| `TC-04` | `pg_restore` Exit Code 1 (FIX-01: 嚴格拒絕忽略警示，ExitCode 1) | PASS |
| `TC-05` | `pg_restore` Exit Code 2 (致命錯誤立即中止，ExitCode 1) | PASS |
| `TC-06` | SQL 驗收查詢失敗 (輸出格式異常或欄位缺失，ExitCode 1) | PASS |
| `TC-07` | 資料表數量不符 (實際 35，預期 37，嚴格判定 FAIL) | PASS |
| `TC-08` | 外鍵約束數量不符 (實際 45，預期 47，判定 FAIL) | PASS |
| `TC-09` | 索引總數不符 (實際 130，預期 133，判定 FAIL) | PASS |
| `TC-10` | 未驗證外鍵約束不為 0 (存在 1 個約束未驗證，判定 FAIL) | PASS |
| `TC-11` | Prisma 遷移紀錄不符 (實際 1 筆，預期 2 筆，判定 FAIL) | PASS |
| `TC-12` | 原本存在的環境變數正確復原 (SEC-01 原值保留) | PASS |
| `TC-13` | 原本不存在的環境變數正確清除 (SEC-01 清除為 null) | PASS |
| `TC-14` | 目標資料庫已存在時安全中止 (防覆寫保護) | PASS |
| `TC-15` | 本機暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS) | PASS |
| `TC-16` | 容器暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS) | PASS |
| `TC-17` | 解密失敗時不誤刪原始備份 (原始 `.dump` 與 `.c2kb` 完好) | PASS |
| `TC-18` | 雜湊比對不符時終止 (HASH MISMATCH 絕對不輸出 PASS) | PASS |
| `TC-19` | TOC 精準過濾：排除 10 個 Vault ID、保留 916 項、337 public、無 BOM、純 LF、原始 TOC 完好 | PASS |
| `TC-20` | TOC 支援 `pg_restore --list` (919 -> 909) 且拒絕非預期總數 (920) | PASS |
| `TC-21` | TOC 缺少目標 Vault ID (如遺漏 3777) 時必須中止 | PASS |
| `TC-22` | TOC ID 物件簽章不符 (如 ID 5 被換成非 `supabase_vault`) 時必須中止 | PASS |
| `TC-23` | TOC 出現重複 ID 時必須中止 | PASS |
| `TC-24` | `public` 核心物件數不為 337 (如 336) 或漏列 Vault 物件時必須中止 | PASS |
| `TC-25` | TOC 輸出若含 UTF-8 BOM 時寫入後驗證必失敗 | PASS |
| `TC-26` | TOC 輸出若含 CRLF (0x0D) 時寫入後驗證必失敗 | PASS |
| `TC-27` | 預設目標資料庫名稱為全新獨立測試庫 `code_to_know_c2kb_prod_restore_clean_v2` | PASS |
| `TC-28` | 拒絕指定舊部分還原庫 `code_to_know_c2kb_prod_restore_test` 或保留系統庫 | PASS |
| `TC-29` | 拒絕空值、不安全格式或含 SQL 注入字元之目標資料庫名稱 (Fail-Fast) | PASS |
| `TC-30` | 絕對不包含自動 `DROP DATABASE` 指令，且失敗時明確標示保留部分還原庫 | PASS |
| `TC-31` | `pg_restore` 參數含 `-L`、`--no-owner`、`--no-acl`，不含 `-N vault`，且保留 `#4698` 警示不忽略 | PASS |
| `TC-32` | 正常成功執行後自動清除本次暫存檔，但完整保留測試輸入檔案與 TOC 來源 | PASS |
| `TC-33` | 100% 離線隔離檢查：Mock 執行不得透過任何外部連線或修改正式備份 | PASS |
| `TC-34` | `psql` 查詢執行失敗：立即 fail-closed 拒絕且不解密、不建庫、不執行 `pg_restore` | PASS |
| `TC-35` | `psql` Exit Code 非 0：立即 fail-closed 拒絕且不解密、不建庫、不執行 `pg_restore` | PASS |
| `TC-36` | 查詢結果無法辨識：立即 fail-closed 拒絕；並確認空白/`null`/`0` 放行與 `1` 拒絕 | PASS |
| `TC-37` | Docker 檢查失敗與目標庫已存在時，同樣阻斷於解密、建庫與 `pg_restore` 之前 | PASS |

---

## 10. PowerShell 5.1 AST 結果

於所有修改與測試結束後，針對最新磁碟版本執行 `[System.Management.Automation.Language.Parser]::ParseFile(...)`：

- `scripts/database/restore_pg17_sandbox.ps1`：**`AST_ERRORS=0`**（`BOM=True`）
- `scripts/database/restore_pg17_sandbox.test.ps1`：**`AST_ERRORS=0`**（`BOM=True`）

---

## 11. TOC 過濾與編碼驗證

1. **編碼分流要求完全符合**：
   - `restore_pg17_sandbox.ps1`：UTF-8 **含 BOM** (`BOM=True`)。
   - `restore_pg17_sandbox.test.ps1`：UTF-8 **含 BOM** (`BOM=True`)。
   - `pg_restore -L` 輸出過濾清單（[`Invoke-StrictTocFilterAndVerify`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L259-L350)）：強制使用 `UTF8Encoding($false)`（**UTF-8 無 BOM**）與純 **Unix LF (`\n`)** 寫出，寫入後以二進位重讀驗證不含 `0xEF 0xBB 0xBF` 及 `0x0D`（由 `TC-19`、`TC-25`、`TC-26` 實測通過）。
2. **TOC 安全驗證**：
   - 精準對照 10 個 Vault TOC ID（`5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998`）之 ID 與物件簽章正規式，非模糊匹配，缺漏/重複/簽章不符/額外漏列 Vault 物件立即中止。
   - 驗證保留數 `926 -> 916`（或 `pg_restore --list` `919 -> 909`）、保留 `public` 核心 **337** 項、保留 `pg_stat_statements`/`pgcrypto`/`uuid-ossp`、不修改原始 TOC 檔，且絕不使用 `-N vault` 取代 `-L` 清單（由 `TC-19`~`TC-24`、`TC-31`、`TC-32` 實測通過）。

---

## 12. 修改後 Git HEAD 與工作區狀態

- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（維持不變，無任何 `add`/`commit`/`push`/`reset`/`clean`/`stash` 操作）
- **工作區狀態**：
  - `M scripts/database/backup-pipeline.test.cjs`（保留原有編輯器空白調整，已於最終版本通過 14/14 測試）
  - `M scripts/database/restore_pg17_sandbox.ps1`
  - `M scripts/database/restore_pg17_sandbox.test.ps1`
  - `?? docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md`（本報告）
  - 其餘前期文件、`tmp/`、個人檔案、`1.docx`、`新增 文字文件.txt`、`照片/` 皆維持原本狀態，未意外修改任何其他專案檔案或 `.env`。

---

## 13. 尚存風險及未解決問題

1. **真實 `pg_restore` 行為仍待實機授權驗證**：本階段全程 100% 離線驗證，真實 `pg_restore --list` 對 `code_to_know_supabase_prod.dump` 執行 `-L` 匯入 `code_to_know_c2kb_prod_restore_clean_v2` 的實際行為與 `#4698` (`PUBLICATION supabase_realtime`) 在 `wal_level=replica` 下的實際退出碼，仍需於下一授權階段正式實機確認。
2. **`backup-pipeline.test.cjs` 編輯器空白異動**：存在 2 bytes 無害空白變更（已通過 14/14 實測），建議於日後執行 Git 整理提交時一併決定是否納入或整理。
3. **編輯器存檔編碼提醒**：若使用 VS Code 開啟與儲存 `.ps1` 檔，需注意維持 `utf8bom` 編碼，避免再次剝除 UTF-8 BOM。

---

## 14. 本階段操作聲明

本階段 **未執行任何真實資料庫還原、`pg_restore`、`pg_dump` 或 SQL 寫入操作；未建立、修改或刪除任何資料庫；未修改 PG16 / PG17 容器或 `.env` / KeePassXC；未連線 Supabase；亦未執行任何 Git 寫入操作**。
