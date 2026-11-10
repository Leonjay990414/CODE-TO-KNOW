# CODE TO KNOW｜Phase 3-C-10B：PG17 還原腳本最終修正與離線測試報告
# PostgreSQL 17 沙盒還原自動化腳本之強韌化修復、18 大離線測試驗收與相容性查核

**文件編號**：C2K-DOC-DB-PHASE3C10B-FINAL-HARDENING-01  
**審查日期**：2026-11-10  
**主檢角色**：資深 PostgreSQL DBA / 應用安全架構師 (AppSec) / DevSecOps 稽核工程師  
**審查性質**：本機腳本強韌化修改與 100% 離線自動化測試驗證（零雲端連線、零正式資料庫操作、零金鑰讀取）  
**審查結論判定**：**PASS（18 大離線測試全數通過，具備安全執行正式還原資格）**

---

## 一、修改與新增檔案清單

本次作業在授權範圍內，僅建立及維護以下本機檔案，未修改任何專案業務代碼或雲端設定：

| 檔案路徑 | 性質 | 說明 |
| :--- | :---: | :--- |
| [`scripts/database/restore_pg17_sandbox.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) | **新增 (獨立腳本)** | 正式 Supabase C2KB 備份解密與 PG17 沙盒還原驗收自動化主腳本（納入 FIX-01 至 FIX-06）。 |
| [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) | **新增 (測試套件)** | 涵蓋 18 大安全情境之 100% 離線整合測試套件。 |
| [`docs/DATABASE_PHASE3C10B_RESTORE_SCRIPT_FINAL_HARDENING.md`](file:///C:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C10B_RESTORE_SCRIPT_FINAL_HARDENING.md) | **新增 (技術報告)** | 本階段最終修復、測試記錄與相容性審查報告。 |

---

## 二、六大安全缺陷 (FIX-01 ~ FIX-06) 修正方式與落實細節

### FIX-01：嚴格攔截原生外部命令錯誤（Zero Tolerance for Error Concealment）
- **修復問題**：PowerShell `$ErrorActionPreference = "Stop"` 無法中斷原生命令（Docker、Node、`pg_restore`、`psql`）的失敗。
- **落實機制**：
  - 在每一個關鍵外部命令執行後，立即顯式檢查 `$LASTEXITCODE`。
  - **特別規範**：針對 `pg_restore`，嚴格要求 `$pgRestoreExitCode -eq 0`。**嚴禁將 Exit Code 1（含警告）或 Exit Code 2（致命錯誤）視為成功**，遇非 0 一律立即中止並進入清理，絕不輸出 PASS。

### FIX-02：完整驗收斷言（Programmatic Assertion Invariants）
- **修復問題**：原腳本僅輸出 SQL 字串，無法防止數值不符時的假陽性誤判。
- **落實機制**：
  - 透過 `psql -tAc` 輸出以 `|` 分隔之指標字串，並以正則表達式 `^\d+\|\d+\|\d+\|\d+\|\d+$` 驗證輸出格式。
  - 程式化擷取整數並執行強制斷言：
    - `public` 資料表總數 **恰為 37**
    - 外鍵約束總數 **恰為 47**
    - 索引總數 **恰為 133**
    - 未驗證外鍵約束數 **恰為 0**
    - Prisma 遷移記錄數 **恰為 2**
  - 任一指標不符或格式異常，立即丟擲例外中斷流程，回報 `ExitCode 1`。

### FIX-03：環境變數生命週期精準復原（SEC-01 Compliance）
- **修復問題**：無條件將環境變數設為 `$null` 會破壞呼叫端環境狀態。
- **落實機制**：
  - 於執行前透過 `[System.Environment]::GetEnvironmentVariable` 記錄變數是否存在（`$origKeyEnvExists`）與其原值（`$origKeyEnvValue`）。
  - 在 `finally` 區塊中：若原本存在則精準還原其原值；若原本不存在則清除為 `$null`。
  - 嚴格未將金鑰寫入日誌、命令列引數或錯誤訊息。
  - 明確遵循記憶體特性，不宣稱 .NET 不可變字串已完成物理抹除。

### FIX-04：暫存檔命名與既有備份安全防護（TMP-01 Compliance）
- **修復問題**：固定檔名與盲目刪除可能導致碰撞覆寫或誤刪。
- **落實機制**：
  - 採用動態唯一隨機命名：`c2k_restore_verify_${PID}_${Timestamp}_${Random}.dump`。
  - 解密前主動檢查暫存路徑，若預先存在檔案則立即中斷。
  - 解密失敗或還原中止時，**多重防呆確保絕不誤刪原始 `.dump` 或 `.c2kb`**。

### FIX-05：清理失敗獨立處置與機敏告警（Defense-in-Depth Cleanup）
- **修復問題**：未獨立檢視本地與容器清理狀況，可能遺留明文。
- **落實機制**：
  - 分別獨立捕捉容器暫存檔（`docker exec rm`）與本地解密暫存檔（`Remove-Item`）之清除結果。
  - 若任一清理失敗：**嚴格禁止輸出 PASS**，回報 `ExitCode 2`（PARTIAL PASS / CLEANUP WARNING），精確指出哪個檔案未清除，並發出機敏明文未清理告警，提示操作人員手動排查。

### FIX-06：錯誤後資料庫狀態記錄（Forensic State Tracking）
- **修復問題**：中途失敗遺留之半成品資料庫可能被誤認為合格。
- **落實機制**：
  - 腳本追蹤 `$dbCreatedByThisRun` 旗標。若資料庫係由本次作業建立但驗收未通過，於結尾印出高風險警告，明確標註該資料庫僅供除錯，**絕對不可視為驗收通過之資料庫**。
  - 絕不自動刪除既有測試庫（如 `code_to_know_cloud_restore_test`）。

---

## 三、18 大離線自動化測試驗證成果

執行測試腳本：[`scripts/database/restore_pg17_sandbox.test.ps1`](file:///C:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1)

```text
==========================================================
  CODE TO KNOW - PG17 還原腳本 18 大離線安全整合測試
==========================================================
  [TC-01] 所有必要命令成功 (全流程 PASS，ExitCode 0) ... PASS
  [TC-02] Node 解密失敗 (AuthTag 錯誤中斷，無 PASS，ExitCode 1) ... PASS
  [TC-03] Docker 命令失敗 (容器未運行或連線失敗，ExitCode 1) ... PASS
  [TC-04] pg_restore Exit Code 1 (FIX-01: 嚴格拒絕忽略警示，ExitCode 1) ... PASS
  [TC-05] pg_restore Exit Code 2 (致命錯誤立即中止，ExitCode 1) ... PASS
  [TC-06] SQL 驗收查詢失敗 (輸出格式異常或欄位缺失，ExitCode 1) ... PASS
  [TC-07] 資料表數量不符 (實際 35，預期 37，嚴格判定 FAIL) ... PASS
  [TC-08] 外鍵約束數量不符 (實際 45，預期 47，判定 FAIL) ... PASS
  [TC-09] 索引總數不符 (實際 130，預期 133，判定 FAIL) ... PASS
  [TC-10] 未驗證外鍵約束不為 0 (存在 1 個約束未驗證，判定 FAIL) ... PASS
  [TC-11] Prisma 遷移紀錄不符 (實際 1 筆，預期 2 筆，判定 FAIL) ... PASS
  [TC-12] 原本存在的環境變數正確復原 (SEC-01 原值保留) ... PASS
  [TC-13] 原本不存在的環境變數正確清除 (SEC-01 清除為 null) ... PASS
  [TC-14] 目標資料庫已存在時安全中止 (防覆寫保護) ... PASS
  [TC-15] 本機暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS) ... PASS
  [TC-16] 容器暫存檔清理失敗 (FIX-05: 警告並回報 ExitCode 2，非 PASS) ... PASS
  [TC-17] 解密失敗時不誤刪原始備份 (原始 .dump 與 .c2kb 完好) ... PASS
  [TC-18] 雜湊比對不符時終止 (HASH MISMATCH 絕對不輸出 PASS) ... PASS

==========================================================
  測試總結：18 / 18 個案例全數通過！ (失敗: 0)
==========================================================
```

### 全專案密碼學與管線測試回歸確認：
1. **AES-256-GCM 單元測試 (`backup-crypto.test.cjs`)**：**14 / 14 PASS**
2. **備份加密整合管線測試 (`backup-pipeline.test.cjs`)**：**14 / 14 PASS**
3. **PG17 還原腳本強韌性測試 (`restore_pg17_sandbox.test.ps1`)**：**18 / 18 PASS**
- **全套測試累計**：**46 / 46 PASS (100% 通過，0 失敗)**。

---

## 四、PowerShell 5.1 語法與相容性檢查

- **本機環境**：Windows PowerShell 5.1 (`5.1.26100.8972`)
- **語法解析驗證**：透過 `[System.Management.Automation.Language.Parser]::ParseFile` 靜態語法樹分析：
  ```powershell
  PowerShell 5.1 AST Parsing PASS: 0 syntax errors
  ```
- **相容性保證**：
  - 嚴格未使用 PowerShell 7 專有語法（無三元運算子 `?:`、無空值合併 `??`、無管道鏈 `&&`/`||`）。
  - 100% 相容於 Windows 預設之 PowerShell 5.1 終端機環境。

---

## 五、原始檔案與備份保護確認

經實際磁碟查核：
- `code_to_know_supabase_prod.dump`（505,249 bytes）：**100% 完整無損**，SHA-256：`2BB79ECC...`
- `code_to_know_supabase_prod.dump.c2kb`（505,282 bytes）：**100% 完整無損**，SHA-256：`6E266028...`
- `code_to_know_supabase_prod.dump.sha256`（102 bytes）：**100% 完整無損**。
- 所有測試產出之暫存目錄已於測試 `finally` 區塊全數乾淨銷毀。

---

## 六、Git 分支、HEAD 與工作區狀態

- **Git 分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **工作區狀態**：
  - 未提交之業務代碼（`frontend/`）與使用者既有檔案（`新增 文字文件.txt`、`1.docx`、`照片/`）**保持原樣，未受任何觸碰**。
  - 本次僅新增 `scripts/database/restore_pg17_sandbox.ps1`、`scripts/database/restore_pg17_sandbox.test.ps1` 及本報告。
- **授權合規保證**：未執行任何 `git add`、`commit`、`push`、`reset`、`clean` 或 `stash` 操作。

---

## 七、超出授權範圍查核（Zero Out-of-Scope Operations）

- [x] 未連線 Supabase 雲端環境。
- [x] 未執行正式 `pg_dump`。
- [x] 未解密正式 `.c2kb` 備份。
- [x] 未執行 `pg_restore` 還原正式備份。
- [x] 未建立、修改或刪除任何 PostgreSQL 資料庫。
- [x] 未修改正式資料庫角色、權限、RLS 或 Prisma Schema。
- [x] 未修改 `.env` 或系統環境變數。
- [x] 未讀取、記錄、輸出任何真實金鑰或密碼。
- [x] 未部署 Render。

---

## 八、最終審查判定

**最終判定**：**PASS**

所有六大安全防護缺陷已徹底修復，18 大離線自動化測試與 46 項回歸測試全數通過，PowerShell 5.1 相容性確認無虞，正式具備執行 PG17 沙盒還原驗收的完全資格。

---

## 九、下一階段待執行工作（需專案負責人授權）

本階段已完成所有修復與離線測試，**已依規範立即停止操作，未自行進入下一階段**。

待專案負責人審閱本報告並下達正式還原執行授權後，後續工作包括：
1. **執行正式還原腳本**：
   在使用者本機終端機執行 `.\scripts\database\restore_pg17_sandbox.ps1`，透過遮罩方式輸入 KeePassXC 正式主金鑰。
2. **端對端資料驗收**：
   比對還原至 `code_to_know_c2kb_prod_restore_test` 之 37 張資料表結構、47 條外鍵、133 個索引、2 筆 migration 歷史及真實資料筆數。
3. **完成備份還原里程碑**：
   產出正式還原驗收結案報告，並清理測試資料庫與沙盒環境。
