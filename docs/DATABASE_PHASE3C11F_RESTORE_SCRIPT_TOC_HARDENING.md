# CODE TO KNOW｜Phase 3-C-11F：PG17 還原腳本 TOC 過濾與安全性修正報告

- **階段名稱**：Phase 3-C-11F：PG17 還原腳本 TOC 過濾與安全性修正
- **執行日期**：2026-11-11
- **執行範圍**：僅限本機還原腳本、離線整合測試與技術文件修正；**100% 離線作業，未執行任何真實資料庫還原、未建立/修改/刪除任何資料庫、未連線 Supabase**
- **Git 狀態（檢查基準）**：分支 `main`，HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`（未執行任何 Git 寫入操作）

---

## 一、修改檔案清單

本次僅修改/新增下列 3 個檔案（未修改任何後端 TypeScript、`.env`、KeePassXC、Docker 設定或既有資料庫/備份檔案）：

1. [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) — 新增精準結構化 TOC 過濾與寫後驗證、`Assert-SafeTargetDatabaseName` 防覆寫保護、`Get-PgRestoreArguments`（`-L` + `--no-owner --no-acl`，絕不以 `-N vault` 替代）、預設目標資料庫改為 `code_to_know_c2kb_prod_restore_clean_v2`，以及 `#4698` 不預先忽略原則與完整清理保護。
2. [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) — 保留並更新原有 `TC-01` 至 `TC-18`（改以受保護的 Mock TOC 與新預設目標庫運作），新增 `TC-19` 至 `TC-33`（共 **33** 項 100% 離線整合測試），透過 PowerShell AST 直接提取實際輔助函式並搭配子行程完整驗證。
3. [`docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md) — 本階段安全性修正與離線測試報告（本文件）。

---

## 二、修改前後差異摘要

| 面向 | Phase 3-C-10B 原版實作 | Phase 3-C-11F 修正後實作 |
| :--- | :--- | :--- |
| 預設 `-TargetDatabase` | `code_to_know_c2kb_prod_restore_test` | `code_to_know_c2kb_prod_restore_clean_v2` |
| 目標資料庫名稱驗證 | 僅於連線容器後檢查目標庫是否已存在（`DbExistsAbort`） | 解密前 Fail-Fast 呼叫 [`Assert-SafeTargetDatabaseName`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L51-L77)：限定 `^[a-z][a-z0-9_]{2,62}$`，明文封鎖 `code_to_know_c2kb_prod_restore_test`、`code_to_know_cloud_restore_test`、`code_to_know`、`postgres`、`template0`、`template1` |
| TOC 過濾機制 | 無（直接執行全量還原，導致 `supabase_vault` 與 `vault.secrets` 出現 3 個錯誤而以 ExitCode 1 失敗） | 新增步驟 5：執行 `pg_restore --list` 後呼叫 [`Invoke-StrictTocFilterAndVerify`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L236-L327) 與 [`Parse-AndVerifyFilteredToc`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L118-L234) 產出獨立 `-L` 過濾清單，保留原始 TOC 檔案不覆寫 |
| `pg_restore` 執行參數 | `docker exec -i <container> pg_restore -U postgres -d <db> -v --no-owner --no-acl <dump>` | [`Get-PgRestoreArguments`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L79-L99) 產生 `-U postgres -d <db> -v --no-owner --no-acl -L <containerTmpToc> <containerTmpDump>`；嚴格要求 ExitCode `0` |
| 暫存清理範圍 | 僅清理本機 `$decDump` 與容器 `/tmp/*.dump` | 額外清理本機 `$rawTocPath`、` $filteredTocPath` 與容器 `/tmp/restore_toc_*.list`，並明確檢查不覆蓋或刪除 `$OriginalDumpPath` 與 `$EncryptedBackupPath` |
| `#4698 PUBLICATION supabase_realtime` | 未特別標註 | 明確註記與輸出說明：對 `wal_level=replica` 可能產生的警告不預先忽略，維持 ExitCode `0` 嚴格驗收規則 |
| 測試覆蓋率 | `TC-01` ~ `TC-18`（18 項） | `TC-01` ~ `TC-33`（33 項，涵蓋 TOC ID/簽章/編碼/換行/保留數量、DB 防覆寫與注入防護、`-L` 參數與離線隔離） |

---

## 三、TOC 排除規則與精準驗證設計

### 3.1 結構化 ID + 物件簽章雙重比對（非純文字模糊比對）

[`Parse-AndVerifyFilteredToc`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L118-L234) 解析每一筆非註解 TOC 項目（格式 `^(\d+);\s+\d+\s+\d+\s+(.+)$`），同時驗證 **TOC ID** 與 **物件簽章正規式**，且確認該 ID 不屬於 `public` 核心物件。必須精準排除以下 10 個項目：

| TOC ID | 預期物件簽章正規式 (`$expectedSignatures`) | 物件類型與說明 |
| :--- | :--- | :--- |
| `5` | `^EXTENSION\s+-\s+supabase_vault\b` | `EXTENSION - supabase_vault` |
| `13` | `^SCHEMA\s+-\s+vault\b` | `SCHEMA - vault` |
| `3777` | `^TABLE DATA\s+vault\s+secrets\b` | `TABLE DATA vault secrets` |
| `4791` | `^ACL\s+-\s+SCHEMA\s+vault\b` | `ACL - SCHEMA vault` |
| `4794` | `^COMMENT\s+-\s+EXTENSION\s+supabase_vault\b` | `COMMENT - EXTENSION supabase_vault` |
| `4888` | `^ACL\s+vault\s+FUNCTION\s+_crypto_aead_det_decrypt\(` | `ACL vault FUNCTION _crypto_aead_det_decrypt(...)` |
| `4889` | `^ACL\s+vault\s+FUNCTION\s+create_secret\(` | `ACL vault FUNCTION create_secret(...)` |
| `4890` | `^ACL\s+vault\s+FUNCTION\s+update_secret\(` | `ACL vault FUNCTION update_secret(...)` |
| `4997` | `^ACL\s+vault\s+TABLE\s+secrets\b` | `ACL vault TABLE secrets` |
| `4998` | `^ACL\s+vault\s+TABLE\s+decrypted_secrets\b` | `ACL vault TABLE decrypted_secrets` |

### 3.2 異常中止保護（Fail-Closed）與編碼驗證

[`Invoke-StrictTocFilterAndVerify`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L236-L327) 與 [`Parse-AndVerifyFilteredToc`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L118-L234) 實作下列防呆斷言：

1. **缺少應排除 ID / 重複 ID / 簽章不符立即中止**：若 10 個目標 ID 任一缺失（`[TOC MISSING ERROR]`）、出現重複 ID（`[TOC DUPLICATE ERROR]`）或實際物件主體與簽章不符（`[TOC SIGNATURE ERROR]`），立即拋錯中斷。
2. **漏列 Vault 物件偵測**：除上述 10 項外，[`Test-IsVaultOrSupabaseVaultBody`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L108-L116) 若偵測到其他未預期的 `vault` / `supabase_vault` 項目，立即拋錯（`[TOC UNEXPECTED VAULT ERROR]`）。
3. **保留數量與核心物件驗證**：僅允許已驗證的兩組數量配對通過——完整 `PGDMP` `926 -> 916` 或 `pg_restore --list`（省略 ID `4779..4785` 共 7 筆）`919 -> 909`；同時強制要求 `public` 核心物件（[`Test-IsPublicCoreTocBody`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L101-L106)）於過濾前後皆精確為 **337** 項，並確認 `pg_stat_statements`、`pgcrypto`、`uuid-ossp` 三項必要擴充套件均有保留。
4. **輸出檔案編碼與寫後重讀驗證**：
   - 使用 `[System.Text.UTF8Encoding]::new($false)` 與 `"\n"` 寫入過濾清單，嚴禁覆蓋原始 TOC 檔。
   - 寫入後立即以二進位位元組重讀：檢查檔首不含 `0xEF 0xBB 0xBF`（UTF-8 BOM）、全文不含 `0x0D`（CR / CRLF），並重新解析有效行數、排除 ID 殘留為 0、保留 337 項 `public` 核心及原始 TOC 位元組長度不變。

---

## 四、目標資料庫防覆寫保護說明

1. **全新預設目標庫**：預設 `-TargetDatabase` 已變更為 `code_to_know_c2kb_prod_restore_clean_v2`。
2. **識別字安全與舊庫封鎖**：在步驟 0（連線 Docker 與解密前）執行 [`Assert-SafeTargetDatabaseName`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L51-L77)：
   - 嚴格符合 `^[a-z][a-z0-9_]{2,62}$`（拒絕空白、大寫字母、分號/空白/SQL 注入字串與過短名稱）。
   - 明文禁止指定既有部分還原測試庫 `code_to_know_c2kb_prod_restore_test`、以及 `code_to_know_cloud_restore_test`、`code_to_know`、`postgres`、`template0`、`template1`。
3. **既有資料庫檢查與禁止自動刪庫**：步驟 2 查詢 `pg_database` 確認目標庫不存在（存在則立即 `[ABORT: DB EXISTS]` 終止），且腳本全域不包含任何 `DROP DATABASE` 指令；若建立測試庫後中途失敗，依 `FIX-06` 保留部分還原庫供排查並強制警示不可視為 PASS。

---

## 五、`pg_restore` 執行參數與 `#4698` 處理說明

- [`Get-PgRestoreArguments`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1#L79-L99) 組合固定原生參數：
  `docker exec -i <SandboxContainer> pg_restore -U postgres -d <TargetDatabase> -v --no-owner --no-acl -L <containerTmpToc> <containerTmpDump>`
- 明確保留 `--no-owner --no-acl` 與 `-L`，**不使用 `-N vault` 替代精確 TOC 過濾**。
- 嚴格檢查 `$LASTEXITCODE -eq 0`（ExitCode `1` 或 `2` 一律中止並判定 FAIL）。
- **關於 `#4698`（`PUBLICATION supabase_realtime`）**：本腳本不預先將其加入排除清單，亦不將 `wal_level=replica` 下可能觸發的警告或 Exit Code 1 視為成功；若未來正式執行時確因 `#4698` 產生 warning 與非 0 退出碼，須待實際觀察官方輸出與對象再做獨立技術評估。

---

## 六、所有測試結果與退出碼

以下測試皆於 **100% 離線本機環境**執行於最終版本之後（未連接任何 Docker 資料庫或 Supabase）：

| 測試項目 | 執行指令 | 觀察結果 | 退出碼 |
| :--- | :--- | :--- | :--- |
| AES-256-GCM 加解密單元測試 | `node scripts/database/backup-crypto.test.cjs` | `14 / 14 個案例全數通過！`（`TC-01` ~ `TC-14` 全數 `PASS`） | `0` |
| 備份與加密管線整合測試 | `node scripts/database/backup-pipeline.test.cjs` | `14 / 14 個案例全數通過！`（`TC-01` ~ `TC-14` 全數 `PASS`） | `0` |
| PowerShell 5.1 AST 語法檢查 | `[System.Management.Automation.Language.Parser]::ParseFile(...)`（兩個 `.ps1` 檔） | `restore_pg17_sandbox.ps1 ERRORS=0`、`restore_pg17_sandbox.test.ps1 ERRORS=0` | `0` |
| PG17 還原腳本離線整合測試（含 TOC UTF-8 無 BOM / LF 二進位檢查） | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\database\restore_pg17_sandbox.test.ps1` | `33 / 33 個案例全數通過！ (失敗: 0)`（`TC-01` ~ `TC-33` 全數 `PASS`） | `0` |
| 後端 TypeScript Build | 不適用（本次 `git diff` 僅變更 `scripts/database/` 下兩支 `.ps1` 檔案及新增本報告，未變更任何 `.ts`/`.tsx` 或後端設定） | 未執行後端編譯 | — |

---

## 七、剩餘風險與注意事項

1. **真實 `pg_restore` 尚未於本階段執行**：`TC-01` ~ `TC-33` 為 100% 離線 Mock 與函式單元/整合驗證，真實 `pg_restore --list` 對正式 `.dump` 匯入 `code_to_know_c2kb_prod_restore_clean_v2` 的實際 PostgreSQL 17.11 執行行為（包含 `#4698 PUBLICATION supabase_realtime` 於 `wal_level=replica` 下的實際退出碼）仍須於下一授權階段正式執行驗證。
2. **容器跨介面換行防護**：雖然輸出 `-L` 檔已於寫入後透過位元組級別驗證無 UTF-8 BOM 且無 `0x0D`（CR），`docker cp` 至 Linux Alpine 容器後仍應保留原有檔案位元組；若未來更改複製方式（例如改用管線轉送），需確認不經文字轉碼重寫。
3. **舊部分還原庫清理**：既有的 `code_to_know_c2kb_prod_restore_test` 目前僅被本腳本封鎖寫入而非刪除，若需回收空間仍須另行取得明確授權處理。

---

## 八、本階段操作聲明

本階段 **未執行真實資料庫還原、未執行 `pg_restore` / `psql` 資料庫操作、未連線 Supabase、未修改 `.env` 或備份原始檔、亦未執行任何 Git 寫入操作**。
