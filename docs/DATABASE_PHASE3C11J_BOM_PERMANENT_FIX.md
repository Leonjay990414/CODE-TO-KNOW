# CODE TO KNOW｜Phase 3-C-11J：PowerShell BOM 永久修復與防護設定報告

- **階段名稱**：Phase 3-C-11J：PowerShell BOM 永久修復與防護設定
- **執行日期**：2026-11-11 18:48~18:52 (+08:00)（UTC `2026-11-11T10:48Z~10:52Z`）
- **執行範圍**：僅建立專案級 PowerShell 編碼防護設定與離線驗證測試、恢復兩支 `.ps1` 腳本之 3-byte UTF-8 BOM (`0xEF 0xBB 0xBF`)、執行 PowerShell 5.1 AST 與完整離線測試；**100% 離線作業，未連線 Supabase、未執行 `pg_dump` / `pg_restore`、未異動任何資料庫或 Docker 容器、未執行 Git 寫入操作**
- **總體判定**：**`PASS`**（所有修復目標、SHA-256 完全比對、PowerShell 5.1 AST `0` 錯誤、三組既定離線測試 + 永久防護測試與測試後 BOM 覆驗全數通過；本階段未申請或執行 PG17 實際還原）

---

## 1. 修改前 Git HEAD 與工作目錄狀態

- **Git 分支**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（與預期基準完全一致）
- **防護設定存在狀態（修復前）**：
  - `.vscode/settings.json`：不存在 (`false`)
  - `.editorconfig`：不存在 (`false`)
- **修改前關鍵檔案實測狀態**：
  - [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1)：`40,838` bytes、前 3 bytes `3C 23 0A`、`BOM=False`、`HasCR=False`、SHA-256 `E1441384A9AD6CB635C5956372277721B7FFC998B9F2C3E49D31CE8E7E46528A`
  - [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1)：`39,668` bytes、前 3 bytes `3C 23 0A`、`BOM=False`、`HasCR=False`、SHA-256 `FF1A235C1B832E239F7F592885EE4A7A9DBCCDAE32BECFBC4B0145D0ED24AE8A`
  - [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1)：`19,749` bytes、前 3 bytes `EF BB BF`、`BOM=True`、`HasCR=False`、SHA-256 `AF9D470DE6691383138CBB7ED85171DA60E298F7922326A7D7F7A8E1A9534CDE`
  - [`scripts/database/backup-pipeline.test.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.test.cjs)：`18,942` bytes、`BOM=False`、`HasCR=false`、SHA-256 `E67EF0A512DCE60ABCFADA3E924CA50FBC262499696CBDEE0E7AC59B69F4AB0B`；`git diff` 確認仍僅保留先前既有之 **2 bytes 格式差異**（第 1 行開頭空行、`L262` `} catch {}` → `} catch { }`）。
- **其餘工作目錄狀態**：維持原有前期文件（`DATABASE_PHASE3C11C~11I`、`GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`）與個人未追蹤項目（`1.docx`、`新增 文字文件.txt`、`照片/`、`tmp/`、`D "~$DE_TO_KNOW_20..."`），未做任何覆蓋或刪除。

---

## 2. 新增或修改的設定檔與防護驗證檔

本階段採最小範圍新增下列 3 個檔案（未修改全域 `AppData\Roaming\Antigravity IDE\User\settings.json`，亦未變更 TypeScript / TSX / JSON / HTML / CSS 等一般檔案規則）：

1. **[`.vscode/settings.json`](file:///c:/Users/user/Documents/CODE-TO-KNOW/.vscode/settings.json)**（新增，僅限 PowerShell 語言專屬區段）：
   ```json
   {
     "[powershell]": {
       "files.encoding": "utf8bom",
       "files.eol": "\n"
     }
   }
   ```
   - 註記：`.gitignore` 第 10 行設有 `.vscode/`，因此本設定檔僅於本機工作區生效並由 IDE 自動套用，不會出現在一般 `git status --short` 未追蹤清單中。
2. **[`.editorconfig`](file:///c:/Users/user/Documents/CODE-TO-KNOW/.editorconfig)**（新增，僅宣告 PowerShell 規則）：
   ```ini
   [*.ps1]
   charset = utf-8-bom
   end_of_line = lf
   ```
   - 未加入 `[*]` 全域區段，確保不會影響 TypeScript 等其他副檔名之既有習慣與格式。
   - **重要限制聲明**：EditorConfig 僅屬編輯器規範提示，本身**無法單獨保證**所有 IDE、語言擴充套件或外部寫檔工具都不會移除 BOM。
3. **[`scripts/database/ps-encoding-guard.test.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/ps-encoding-guard.test.cjs)**（新增離線永久防護檢查）：
   - 完全唯讀檢查 `.vscode/settings.json`、`[powershell]` 規則、`.editorconfig`、`[*.ps1]` 規則、TypeScript/TSX/JSON/HTML/CSS 等規則未受影響，以及三支 `.ps1` 之 `EF BB BF` BOM 與純 LF 狀態，**不反覆存檔任何正式腳本**。

---

## 3. 兩支腳本 BOM 修復結果

以位元組緩衝前置方式僅插入 3-byte UTF-8 BOM（`0xEF 0xBB 0xBF`）於兩支目標腳本檔頭，**零改動**任何程式碼、註解、空白或 LF 換行字元：

| 目標檔案 | 修復前大小 (`Bytes`) | 修復後大小 (`Bytes`) | 修復後前 3 Bytes | `BOM` | `HasCR` | 與 11G 原始檔內容差異 |
|---|---:|---:|:---:| :---: | :---: |---|
| [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) | `40,838` | **`40,841`** | **`EF BB BF`** | **True** | False | 除補回 3-byte BOM 外完全一致 |
| [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) | `39,668` | **`39,671`** | **`EF BB BF`** | **True** | False | 除補回 3-byte BOM 外完全一致 |

---

## 4. 修復前後 SHA-256 比對

| 檔案路徑 | 修復前 `SHA-256` (無 BOM) | 修復後實測 `SHA-256` (含 BOM) | 預期 11G 定版 `SHA-256` | 比對結果 |
|---|---|---|---| :---: |
| `scripts/database/restore_pg17_sandbox.ps1` | `E1441384A9AD6CB635C5956372277721B7FFC998B9F2C3E49D31CE8E7E46528A` | **`6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440`** | `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440` | **100% 一致** |
| `scripts/database/restore_pg17_sandbox.test.ps1` | `FF1A235C1B832E239F7F592885EE4A7A9DBCCDAE32BECFBC4B0145D0ED24AE8A` | **`FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4`** | `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4` | **100% 一致** |

---

## 5. PowerShell 5.1 AST 結果

以 `[System.Management.Automation.Language.Parser]::ParseFile`（Windows PowerShell 5.1）檢查：

| 檔案路徑 | `BOM` | 修復前 AST 錯誤 | 修復後／測試後 AST 錯誤 | 判定 |
|---| :---: |---:|---:| :---: |
| `scripts/database/restore_pg17_sandbox.ps1` | **True** | `21` | **`0`** | **PASS** |
| `scripts/database/restore_pg17_sandbox.test.ps1` | **True** | `72` | **`0`** | **PASS** |
| `scripts/database/run_supabase_backup.ps1`（對照檢查） | **True** | `0` | **`0`** | **PASS** |

---

## 6. 三組離線測試與永久防護驗證結果

全部測試皆於 BOM 修復與設定檔建立後重新執行（100% 離線，未連線真實資料庫）：

| 測試項目 | 執行指令 | 通過數 | Exit Code | 判定 |
|---|---| :---: | :---: | :---: |
| A. AES-256-GCM 加密測試 | `node scripts/database/backup-crypto.test.cjs` | **`14 / 14`** | `0` | **PASS** |
| B. 備份與加密管線整合測試 | `node scripts/database/backup-pipeline.test.cjs` | **`14 / 14`** | `0` | **PASS** |
| C. PG17 還原離線整合測試 | `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\database\restore_pg17_sandbox.test.ps1` | **`37 / 37`** | `0` | **PASS** |
| D. 永久編碼防護離線驗證 | `node scripts/database/ps-encoding-guard.test.cjs` | **`5 / 5`** | `0` | **PASS** |

---

## 7. 測試後再次檢查 BOM 與穩定性結果

於上述四組測試全部執行完畢後，再次對兩支 `.ps1` 執行唯讀檢查，確認無任何測試或編輯器操作在測試期間再次移除 BOM：

| 檢查項目 | `scripts/database/restore_pg17_sandbox.ps1` | `scripts/database/restore_pg17_sandbox.test.ps1` | 預期結果 |
|---|---|---|---|
| 前 3 Bytes | **`EF BB BF`** | **`EF BB BF`** | **`EF BB BF`** |
| `BOM` 狀態 | **`True`** | **`True`** | **`True`** |
| `SHA-256` | `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440` | `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4` | **完全吻合** |
| 檔案大小 | **`40,841` bytes** | **`39,671` bytes** | **`40,841` / `39,671`** |
| `HasCR` | `False` | `False` | `False` |
| PowerShell 5.1 AST | **`0` 錯誤** | **`0` 錯誤** | **`0` 錯誤** |

---

## 8. 是否還有其他檔案受到影響

- **PowerShell 檔案**：[`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1) 仍維持 `19,749` bytes、`BOM=True`、`HasCR=False`、`AST_ERRORS=0`、SHA-256 `AF9D470DE6691383138CBB7ED85171DA60E298F7922326A7D7F7A8E1A9534CDE`，全程未變動。
- **既有 `.cjs` 管線／加密檔案**：[`scripts/database/backup-pipeline.test.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.test.cjs) 維持 `18,942` bytes、SHA-256 `E67EF0A5...` 及原有 2-byte 無害空白格式差異；`backup-crypto.cjs`、`backup-crypto.test.cjs`、`backup-pipeline.cjs` 均未變動。
- **其他專案檔案**：未修改任何 Prisma、SQL、TypeScript、前端或 `.env` 設定，無任何未授權異動。

---

## 9. Git HEAD 與工作目錄最終狀態

- **Git 分支**：`main`
- **Git HEAD**：`86a0f1116693bcce476b8747a446900d54b29a4a`（維持不變，無任何 Git 寫入操作）
- **`git status --short` 最終清單**：
  - `M scripts/database/backup-pipeline.test.cjs`（原有 2-byte 空白格式差異）
  - `M scripts/database/restore_pg17_sandbox.ps1`（本階段恢復 UTF-8 BOM，回到 11G SHA-256）
  - `M scripts/database/restore_pg17_sandbox.test.ps1`（本階段恢復 UTF-8 BOM，回到 11G SHA-256）
  - `D "~$DE_TO_KNOW_20\351\232\216\346\256\265\347\270\275\351\253\224\350\246\217\345\212\203\350\210\207\344\272\224\345\261\244\347\266\262\347\253\231\346\236\266\346\247\213_\346\233\264\346\226\260\347\211\210.docx"`（既有）
  - `M "\346\226\260\345\242\236 \346\226\207\345\255\227\346\226\207\344\273\266.txt"`（既有）
  - `?? .editorconfig`（本階段新增）
  - `?? scripts/database/ps-encoding-guard.test.cjs`（本階段新增）
  - `?? docs/DATABASE_PHASE3C11J_BOM_PERMANENT_FIX.md`（本報告）
  - 其餘前期 `?? docs/DATABASE_PHASE3C11C~11I.md`、`docs/GITHUB_PHASE_PAUSE_BACKUP_REPORT.md`、`1.docx`、`tmp/`、`照片/` 皆完整保留。
  - （註：`.vscode/settings.json` 存在於磁碟並運作，因 `.gitignore` 第 10 行規則 `.vscode/` 而未列入未追蹤清單。）

---

## 10. 總體判定

- **判定**：**`PASS`**
  - 專案層級 PowerShell 編碼防護（`.vscode/settings.json` 與 `.editorconfig`）已建立並由離線驗證腳本確認不影響 TypeScript 等其他檔案。
  - 兩支 `.ps1` 腳本之 3-byte UTF-8 BOM 已精確復原，SHA-256 與 11G 定版 **100% 吻合**，PowerShell 5.1 AST 錯誤數為 **`0`**。
  - `14/14`、`14/14`、`37/37` 與 `5/5` 全部離線測試皆於修復後重新通過，且測試完成後覆驗 BOM 與 SHA-256 保持完好未再流失。

---

## 11. 尚未排除的 IDE 存檔風險

1. **EditorConfig 屬於規範提示，非強制鎖**：即使已設定 `.editorconfig` 與 `.vscode/settings.json`，仍無法單獨保證所有第三方擴充功能、外部腳本或忽略編輯器語言組態的覆寫行為都不會再次移除 BOM。
2. **先前回彈之具體觸發事件「原因尚未證實」**：依 Phase 3-C-11I 調查結論，先前 `10:11:26Z` 觸發 Antigravity IDE 寫回並剝除 BOM 的具體操作或內部事件因無稽核日誌而尚未證實；若該類外部同步或歷史還原動作日後於無視 `.vscode/settings.json` 的路徑上執行，仍可能重現去 BOM。
3. **`.vscode/` 目前位於 `.gitignore` 第 10 行**：本機工作區的 `.vscode/settings.json` 雖已立即生效，但不會透過 `git commit` 同步至其他開發機或新 clone 工作區（若需跨機強制一致，日後可再由專案團隊評估是否於 `.gitignore` 例外納入 `!.vscode/settings.json`，並評估是否為全域 IDE 使用者設定補充 `"[powershell]"` 規則）。
4. **Windows PowerShell 5.1 字面值本質限制**：兩支 `.ps1` 原始碼仍包含繁體中文字面值；若未來 BOM 再度被無故剝除，PowerShell 5.1 仍可能發生編碼誤判。因此日後每次執行實機前置檢查或實際還原前，均應將 `node scripts/database/ps-encoding-guard.test.cjs` 與 PowerShell 5.1 AST `0` 錯誤檢核列為必要前置關卡。

---

*本階段已完成 PowerShell BOM 永久修復、防護設定與全套離線驗證並立即停止；未執行 PG17 實際還原或任何資料庫操作，靜待使用者審查後再決定是否進入下一階段。*
