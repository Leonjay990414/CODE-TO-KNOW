# CODE TO KNOW — Phase 3-C-35 AUTH-03 PowerShell ParserError 唯讀診斷報告

- **診斷日期**：2026-11-12
- **執行性質**：100% 唯讀診斷（未修改任何程式碼或設定檔、未執行解密、未執行 `pg_restore`、未連線 Supabase/Render）
- **診斷結論**：`scripts/database/restore_pg17_sandbox.ps1` **本身無任何語法錯誤或中文字串損壞**，真正原因為該檔案**遺失 UTF-8 BOM (`EF BB BF`)**，導致繁體中文 Windows PowerShell 5.1 以系統 ANSI (`CP950` / Big5) 編碼誤讀 UTF-8 中文位元組，進而產生 21 筆連鎖 `ParserError`。

---

## 一、環境與 Git 唯讀狀態確認

- **Git `HEAD`**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **工作目錄狀態 (`git status --short`)**：102 筆未提交變更
- **PG17 隔離容器**：`code_to_know_pg17_restore_sandbox` 狀態為 `Up 2 hours`
- **目標隔離資料庫 (`code_to_know_auth03_restore_20261112`)**：經本機沙盒 `psql` 查詢確認**不存在**（尚未建立）
- **`scripts/database/backup-crypto.cjs` 檢查**：`node -c` 語法檢查通過（Exit Code `0`），與本次 PowerShell `ParserError` 無關。

---

## 二、A. 已確認的語法錯誤（PowerShell Parser API 實測）

對 `scripts/database/restore_pg17_sandbox.ps1` 執行 `[System.Management.Automation.Language.Parser]::ParseFile(...)` 共回報 **21 筆 `ParserError`**（對照 `scripts/database/restore_pg17_sandbox.test.ps1` 為 **0 筆**）：

| 行號 | 字元位置 (Col) | ErrorId | 錯誤訊息摘要 | 涉及區段 |
| ---: | ---: | --- | --- | --- |
| 41 | 17 | `MissingArrayIndexExpression` / `UnexpectedToken` | `Unexpected token 'DB' in expression or statement.` | `[DB SAFETY ERROR] ... 目標資料庫名稱不可為空白！"` |
| 66 | 17 | `MissingArrayIndexExpression` / `UnexpectedToken` | `Unexpected token 'DB' in expression or statement.` | `[DB SAFETY ERROR] 禁止使用保留或舊版部分還原資料庫...` |
| 75 | 41 | `UnexpectedToken` | `Unexpected token '0") 蝜潛?...'`（UTF-8 註解被當 CP950 吃掉換行/引號） | 註解 `# 僅允許查詢無結果 ("") 或測試用未建立標記 ("0") 繼續...` |
| 119 | 37 | `MissingEndCurlyBrace` | `Missing closing '}' in statement block or type definition.` | 連鎖大括號未閉合 |
| 136 | 34 | `MissingEndCurlyBrace` | `Missing closing '}' in statement block or type definition.` | 連鎖大括號未閉合 |
| 161 | 54 | `MissingEndCurlyBrace` | `Missing closing '}' in statement block or type definition.` | 連鎖大括號未閉合 |
| 166 | 28 | `MissingEndCurlyBrace` | `Missing closing '}' in statement block or type definition.` | 連鎖大括號未閉合 |
| 175 | 21 | `MissingArrayIndexExpression` / `UnexpectedToken` | `Unexpected token 'TOC' in expression or statement.` | `[TOC DUPLICATE ERROR] 偵測到重複的 TOC ID：$tocId"` |
| 255 | 17 | `UnexpectedToken` / `MissingEndParenthesisInExpression` | `Unexpected token '^ACL\s+vault\s+FUNCTION\s+create_secret\'` | `$expectedSignatures` 雜湊表（受上方未閉合引號影響） |
| 256 | 17 | `UnexpectedToken` / `MissingEndParenthesisInExpression` | `Unexpected token '^ACL\s+vault\s+FUNCTION\s+update_secret\'` | `$expectedSignatures` 雜湊表 |
| 257 | 17 | `UnexpectedToken` / `MissingEndParenthesisInExpression` | `Unexpected token '^ACL\s+vault\s+TABLE\s+secrets\b'` | `$expectedSignatures` 雜湊表 |
| 656 | 39 | `ExpressionsMustBeFirstInPipeline` | `Expressions are only allowed as the first element of a pipeline.` | 連鎖語法錯位 |
| 757 | 30 / 45 | `TerminatorExpectedAtEndOfString` / `UnexpectedToken` | `The string is missing the terminator: '.` | 連鎖單引號/雙引號未閉合 |

> 註：以 UTF-8 檢視第 1～90 行、第 150～190 行、第 235～265 行原始內容，**完全沒有未配對引號、Here-String、括號、陣列語法錯誤或中文字串損壞**。

---

## 三、B. 編碼問題證據

| 檔案 | 前 3 Bytes (Hex) | UTF-8 BOM | 總長度 (Bytes) | CRLF 數 | LF-only 數 | `ps-encoding-guard.test.cjs` | ParserError 數 |
| --- | --- | :---: | ---: | ---: | ---: | :---: | ---: |
| `scripts/database/restore_pg17_sandbox.ps1` | `3C 23 0A` (`<#\n`) | **無（遺失）** | 42,666 | 0 | 846 | **FAIL** (`missing UTF-8 BOM`) | **21** |
| `scripts/database/restore_pg17_sandbox.test.ps1` | `EF BB BF` | **有** | 39,671 | 0 | 685 | **PASS** | **0** |

---

## 四、C. 已確認的根本原因

1. **缺乏 UTF-8 BOM (`EF BB BF`)**：繁體中文 Windows（系統 ANSI 代碼頁 CP950 / Big5）下的 PowerShell 5.1 解析 `.ps1` 時，若檔案開頭沒有 `EF BB BF` BOM，會預設以 CP950（雙位元組）讀取。
2. **UTF-8 三位元組中文被誤讀為 Big5**：當三位元組的 UTF-8 中文（如全形 `！` = `EF BC 81`）緊接 ASCII 引號 `"` 時，末位元組會與 `"` 結合成無效或跨字元序列，導致字串結尾引號 `"` 失效，進而在第 41、66、75、175、255～257 等行引發連鎖 `ParserError`。
3. **時間線觀察**：`21:34:53` 執行 `ps-encoding-guard.test.cjs` 時仍顯示 PASS（當時仍有 BOM）；但 `restore_pg17_sandbox.ps1` 的 `LastWriteTime` 更新於 `2026/11/12 21:35:27`，之後 BOM 即遺失。

---

## 五、D. 尚未確認的推測

- **尚未確認是哪個外部事件於 `21:35:27` 重新儲存並移除了 BOM**：由於 `21:34:53` 時 `ps-encoding-guard.test.cjs` 尚能通過，無法從現有檔案直接斷定是哪個編輯器或背景存檔動作於 `21:35:27` 將檔案以無 BOM UTF-8 寫回（本報告僅陳述時間戳與位元組事實，不做臆測）。

---

## 六、E. 建議的最小修復方案（待使用者授權後再執行）

1. **僅為 `scripts/database/restore_pg17_sandbox.ps1` 補回 UTF-8 BOM (`EF BB BF`)**，同時維持純 LF (`\n`) 換行，不改動任何程式碼邏輯與字元內容。
2. **修復後立即執行唯讀驗證**：
   - 執行 `node scripts/database/ps-encoding-guard.test.cjs` 確認 `5/5 PASS`。
   - 執行 `[System.Management.Automation.Language.Parser]::ParseFile(...)` 確認 `ParserErrorCount = 0`。
   - 重新執行 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/database/restore_pg17_sandbox.test.ps1` 確認 `37/37 PASS`。
   - 同時檢查 `scripts/database/run_supabase_backup.ps1` 確認三支 `.ps1` 皆具備 `EF BB BF` BOM 與純 LF。

目前依規定停止於此，等待您確認修復範圍與授權。
