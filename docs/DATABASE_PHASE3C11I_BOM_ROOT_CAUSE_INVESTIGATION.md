# CODE TO KNOW｜Phase 3-C-11I：PowerShell UTF-8 BOM 遺失原因唯讀調查報告

- **調查階段**：Phase 3-C-11I：PowerShell UTF-8 BOM 遺失原因調查
- **調查日期**：2026-11-11 18:18~18:22 (+08:00)（UTC `2026-11-11T10:18Z~10:22Z`）
- **調查性質**：**100% 唯讀調查**（未修復或修改兩支 `.ps1` 腳本、未恢復 BOM、未修改 `.cjs` 或 IDE 設定、未連線 Supabase、未執行 `pg_restore` 或任何資料庫寫入、未執行任何 Git 寫入操作）
- **調查基準**：分支 `main`，`HEAD` 為 `86a0f1116693bcce476b8747a446900d54b29a4a`

---

## 1. 問題時間線（精確至 UTC 與 `+08:00`）

以下依檔案修改時間（`mtime`）、前期 Phase 報告實測紀錄，以及 `Antigravity IDE\User\History` 快照時間戳記重建完整事件順序：

| 時間 (`UTC`) | 時間 (`+08:00`) | 事件與證據來源 |
|---|---|---|
| `2026-11-10T11:48:46.929Z` | `19:48:46.929` | [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1) 在 `Antigravity IDE\User\History\-4de69941\hXtu.ps1` 留下含 `"source":"工作區編輯"` 之最後一次 IDE 歷史紀錄。 |
| `2026-11-10T12:00:51.610Z` | `20:00:51.610` | `run_supabase_backup.ps1` 磁碟最後修改時間（`19,749` bytes、`BOM=True`、`HasCR=False`、`AST_ERRORS=0`），此後至今皆未再異動。 |
| `2026-11-11T09:50:34Z~09:50:45Z` | `17:50:34~17:50:45` | `AppData\Roaming\Antigravity IDE\logs\20261111T173109\window1\exthost\ms-vscode.powershell\PowerShell.log` 記錄 PowerShell Extension (`v2025.4.0`) 與 PowerShell `v5.1.26100` 在 VS Code `v1.107.0` 引擎中啟動。 |
| `2026-11-11T09:52:10.698Z` | `17:52:10.698` | Phase 3-C-11F 報告 [`DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11F_RESTORE_SCRIPT_TOC_HARDENING.md) 產出（11F 當時兩支 `.ps1` 測試通過 `33/33`）。 |
| `2026-11-11T09:53:08.041Z` | `17:53:08.041` | **第一次異常（`restore_pg17_sandbox.ps1`）**：`User\History\568b2040\VTJf.ps1` 產生無 `"source"` 欄位之快照（`39,472` bytes、`BOM=True`）。 |
| `2026-11-11T09:53:08.070Z` | `17:53:08.070` | 磁碟 [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 被寫為 `39,416` bytes、`BOM=False`、SHA-256 `7B0435299690863F79858E10DE25FF26BE7A907FBCFE32BDD332A5BF65844BA7`，在 11F 獨立驗收（`09:57:05Z`）時呈現 **`AST_ERRORS=40`**。 |
| `2026-11-11T09:53:12.184Z` | `17:53:12.184` | [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) 亦於 `User\History\42a598c0\sQlP.ps1` 產生無 `"source"` 欄位快照（`35,239` bytes、`BOM=True`、SHA-256 `0131F06C...`，與該時刻磁碟一致）。 |
| `2026-11-11T09:54:56.823Z` | `17:54:56.823` | [`scripts/database/backup-pipeline.test.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.test.cjs) 發生 2 處無害空白異動，並於 `User\History\498e52bb\X7a2.cjs` 留下無 `"source"` 欄位快照（與目前磁碟 `18,942` bytes 完全一致）。 |
| `2026-11-11T10:00:32.839Z` | `18:00:32.839` | **Phase 3-C-11G 修復定版（主腳本）**：Agent 透過寫檔／編修工具修復 BOM 與防呆邏輯，產出 `40,841` bytes、**`BOM=True`**、**`AST_ERRORS=0`**、SHA-256 `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440`（此次工具寫入未產生 `User\History` 紀錄）。 |
| `2026-11-11T10:00:57.535Z` | `18:00:57.535` | **Phase 3-C-11G 修復定版（測試檔）**：產出 `39,671` bytes、**`BOM=True`**、**`AST_ERRORS=0`**、SHA-256 `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4`（此次工具寫入亦未產生 `User\History` 紀錄）。 |
| `2026-11-11T10:02:28.166Z` | `18:02:28.166` | Phase 3-C-11G 報告 [`DATABASE_PHASE3C11G_FINAL_REVALIDATION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11G_FINAL_REVALIDATION.md) 完成，記錄 `37/37`、`14/14`、`14/14` 全數通過與上述 `BOM=True`、`AST_ERRORS=0` 實測。 |
| `2026-11-11T10:11:26.243Z` | `18:11:26.243` | **第二次異常前置快照（主腳本）**：`User\History\568b2040\kevW.ps1` 寫入無 `"source"` 欄位之快照（`40,914` bytes、`BOM=True`、`HasCR=False`、`842` 行，含 11G 新增之 `$MockRawTocPath` 但帶 Allman 縮排／未對齊排版）。 |
| `2026-11-11T10:11:26.274Z` | `18:11:26.274` | **僅 0.031 秒後**，磁碟 `restore_pg17_sandbox.ps1` 變為 **`40,838` bytes、`BOM=False`、`HasCR=False`、`809` 行**、SHA-256 `E1441384A9AD6CB635C5956372277721B7FFC998B9F2C3E49D31CE8E7E46528A`。 |
| `2026-11-11T10:11:26.671Z` | `18:11:26.671` | **第二次異常前置快照（測試檔）**：`User\History\42a598c0\uQAZ.ps1` 寫入無 `"source"` 欄位之快照（`39,691` bytes、`BOM=True`、`HasCR=False`、`688` 行，含 11G 新增之 `TC-36` 且第 635–636 行為 `}\n catch {`）。 |
| `2026-11-11T10:11:26.692Z` | `18:11:26.692` | **僅 0.021 秒後**，磁碟 `restore_pg17_sandbox.test.ps1` 變為 **`39,668` bytes、`BOM=False`、`HasCR=False`、`686` 行**、SHA-256 `FF1A235C1B832E239F7F592885EE4A7A9DBCCDAE32BECFBC4B0145D0ED24AE8A`。 |
| `2026-11-11T10:12Z~10:13:43Z` | `18:12~18:13:43` | Phase 3-C-11H 實機前置驗證（[`DATABASE_PHASE3C11H_PG17_LIVE_PREFLIGHT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C11H_PG17_LIVE_PREFLIGHT.md)）檢出兩檔 `BOM=False`、PowerShell 5.1 AST 報出 **`21`** 與 **`72`** 個語法錯誤，判定 **`FAIL`** 並停機回報。 |
| `2026-11-11T10:18Z~10:19Z` | `18:18~18:19` | 本階段（11I）唯讀複驗確認兩檔磁碟位元組、SHA-256、AST 錯誤數與 `10:11:26Z` 完全一致，未再變化，並完成記憶體補回 BOM 雜湊驗證。 |

---

## 2. 兩支腳本的檔案差異（11G 定版 vs 11H／現況）

### 2.1 位元組與雜湊精確比對

| 檔案路徑 | 11G 定版大小 (`Bytes`) | 11H／現況大小 (`Bytes`) | 大小差 | 現況 `BOM` / `HasCR` / AST | 記憶體補回 `EF BB BF` 後之 `SHA-256` | 是否與 11G 定版 `SHA-256` 完全一致 |
|---|---:|---:|---:|:---:|---| :---: |
| [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) | `40,841` | `40,838` | **`-3`** | `False` / `False` / **`21` 錯誤** | `6B1FA1B7D59D6E5B317394A11743F1D6535731706277B83E3969740A9DE52440` | **是 (`100%` 吻合)** |
| [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) | `39,671` | `39,668` | **`-3`** | `False` / `False` / **`72` 錯誤** | `FB2CB516C9F6D9808080F8D6ED260932BD231FC78455D05E17C4946F0AA6D1B4` | **是 (`100%` 吻合)** |

- 現況磁碟 `SHA-256`：
  - `restore_pg17_sandbox.ps1`：`E1441384A9AD6CB635C5956372277721B7FFC998B9F2C3E49D31CE8E7E46528A`
  - `restore_pg17_sandbox.test.ps1`：`FF1A235C1B832E239F7F592885EE4A7A9DBCCDAE32BECFBC4B0145D0ED24AE8A`
- **實證結論**：兩支腳本於 `10:11:26Z` 前後**沒有任何一個字元、註解、邏輯、空白或 LF 換行（`\n`）改變**；**唯一被移除的只有檔頭 3-byte UTF-8 BOM（`0xEF 0xBB 0xBF`）**。
- 因兩支檔案目前均仍在相對 `HEAD` 之已修改狀態（`M`）且 `HEAD` 為 Phase 3-C-11F 之前版本，`git diff` 主要顯示 11F/11G 的功能新增；真正呈現 11G → 11H 變化的是上述 **3-byte BOM 差異與記憶體補回 SHA-256 100% 重合**。

### 2.2 IDE Local History 同期快照之額外線索

於 `10:11:26.243Z` 與 `10:11:26.671Z`（比磁碟新寫時間早 `21~31 ms`）寫入 IDE Local History 的快照，內容卻保留著 `BOM=True` 且帶有另一種排版樣式：

- `568b2040\kevW.ps1`（`40,914` bytes、`BOM=True`、`842` 行、SHA-256 `FE9632CEA6AC4E3312DD0AE85807EF58FC9C1279E1B52E9A19630FE67CE89E9B`）：已包含 11G 的 `$MockRawTocPath` 參數，但呈現未等號對齊之 `param`（第 34–41 行）及 `else` 獨立換行（共 10 處獨立 `else` 行，Allman 風格），不同於 11G 定版與現況磁碟（`809` 行、`0` 處獨立 `else` 行）。
- `42a598c0\uQAZ.ps1`（`39,691` bytes、`BOM=True`、`688` 行、SHA-256 `F291877E358CF9553FD2549653AF8ED6511425D0AA84E4278FCE10D6D3BA41DC`）：已包含 11G 的 `TC-36`，但第 635–636 行為 `}\n        catch {`，不同於現況磁碟（第 635 行 `} catch {`）。

---

## 3. BOM 遺失的可能原因及證據

依唯讀證據嚴格區分「**已證實**」與「**尚未證實**」兩個層次：

1. **已證實之底層原因（為何一旦經過 IDE 存檔便會失去 BOM）**：
   - Antigravity IDE（核心為 VS Code `v1.107.0`）全域 `User\settings.json` 與 PowerShell 擴充套件預設值均**未對 `[powershell]` 指定 `"files.encoding": "utf8bom"`**（詳見第 4 節），專案亦無 `.vscode/settings.json` 或 `.editorconfig` 強制要求 `utf8-bom`。
   - 因此，只要檔案經由 Antigravity IDE 的預設文字編碼管線寫回磁碟，系統便會套用 VS Code 預設 `"files.encoding": "utf8"`，將檔頭 3-byte `0xEF 0xBB 0xBF` 剝除為純 UTF-8。
2. **已證實之寫回途徑關聯**：
   - 兩次異常（`09:53:08Z/12Z` 及 `10:11:26.243Z~692Z`）以及 `backup-pipeline.test.cjs` 的空白異動（`09:54:56.823Z`），**皆伴隨 `Antigravity IDE\User\History` 產生無 `"source":"工作區編輯"` 欄位之快照**，且快照時間與磁碟 `mtime` 僅相隔 `0.021~0.031` 秒。
   - 反觀 Agent 透過 `write_file`/`edit_file`（`10:00:32Z`、`10:00:57Z`）直接改寫磁碟檔案時，**並未產生 `User\History` 紀錄**。這證明 `10:11:26Z` 的寫回行為高度關聯到 Antigravity IDE 的編輯器緩衝區／檔案寫回／歷史管理機制，而非 CLI 或專案內批次腳本。
3. **尚未證實之項目（依規範明確標註）**：
   - **具體於 `10:11:26Z` 觸發 IDE 將兩支 `.ps1` 以無 BOM 版本覆寫至磁碟的實際操作者或自動化觸發來源：原因尚未證實。**
   - 特別是為何 `kevW.ps1` / `uQAZ.ps1` 在 `10:11:26.243Z/671Z` 先記錄了「含 11G 程式碼但採 Allman 換行與 `BOM=True`」的狀態，緊接著 `0.02~0.03` 秒後磁碟卻成為「11G 定版排版（無 Allman 換行）但 `BOM=False`」，現有檔案系統與日誌中缺少可精確指認「UI 指令／Revert／Accept／Undo／Save／Extension Event」的稽核紀錄（詳見第 5、8 節）。

---

## 4. Antigravity IDE 編碼設定調查結果

| 檢查位置 | 存在狀態 | 實際檢查結果 |
|---|---|---|
| `C:\Users\user\AppData\Roaming\Antigravity\User\settings.json` | 不存在 | 非實際設定目錄 |
| `C:\Users\user\AppData\Roaming\Code\User\settings.json` | 不存在 | 非實際設定目錄 |
| `C:\Users\user\AppData\Roaming\Antigravity IDE\User\settings.json` | **存在（真實設定檔）** | **完全未設定** `"files.encoding"`、`"[powershell]"`、`"files.autoSave"`、`"editor.formatOnSave"` 或任何 BOM 相關鍵值；依 VS Code `v1.107.0` 預設，`"files.encoding"` 為 `"utf8"`（無 BOM）。 |
| `C:\Users\user\.antigravity-ide\extensions\ms-vscode.powershell-2025.4.0-universal\package.json` | **存在** | `contributes.configurationDefaults."[powershell]"` 僅定義 `debug.saveBeforeStart`、`editor.semanticHighlighting.enabled`、`editor.wordSeparators` 三項，**未設定 `"files.encoding": "utf8bom"`**。 |
| 專案工作區 `.vscode/settings.json` / 上層 `Documents\.vscode` | 不存在 | 無專案層 PowerShell 編碼鎖定 |
| 專案工作區 `.editorconfig` / `.gitattributes` / `.prettierrc*` | 不存在 | 無跨編輯器 `charset = utf-8-bom` 或編碼屬性規範 |
| 專案 `.git/hooks/` | 僅有 `.sample` 範本（`2026-11-01`） | 無任何啟用中的 Git pre-commit / post-rewrite 等 hook |

---

## 5. 是否找到自動格式化或重新存檔機制

1. **專案內腳本與自動化流程：未發現（已完全排除）**
   - 經檢索全專案 `*.ps1`、`*.cjs`、`*.mjs`、`*.js`、`*.ts`、`*.json`（排除 `node_modules`），所有呼叫 `Set-Content`、`Out-File`、`WriteAllText`、`writeFileSync`、`fs.writeFile` 的程式碼均只寫入測試暫存目錄（如 `.list`、`.toc`、`.dump`、`.sha256`、`package.json` 等資料／產物檔案），**沒有任何一支腳本會讀取並重寫專案內的 `.ps1` 原始碼**。
2. **IDE 層與擴充套件層：證實存在透過 IDE 寫回之痕跡，但具體觸發器「原因尚未證實」**
   - `AppData\Roaming\Antigravity IDE\logs\20261111T173109\window1\exthost\ms-vscode.powershell\PowerShell.log` 僅記錄到 `17:50:45 (+08:00)`（`09:50:45Z`）的啟動與語言伺服器初始化訊息（包含 `DidChangeConfigurationProvider: No ConfigurationItems have been defined`），**在 `10:11:26Z`（`18:11:26 +08:00`）前後並無任何格式化或存檔日誌**。
   - 雖然 `User\History` 快照（`568b2040`、`42a598c0`、`498e52bb`）證實兩支 `.ps1` 及 `backup-pipeline.test.cjs` 的異常改寫皆通過 Antigravity IDE 的歷史／工作複本管線，且 `editor.formatOnSave` 並未於 `settings.json` 啟用，但**究竟是使用者手動操作（例如存檔、還原、接受差異、Ctrl+Z）、擴充套件命令或 IDE 內部檔案同步事件在 `10:11:26Z` 觸發了覆寫與去 BOM，因欠缺該時點的操作／事件日誌，目前判定為「原因尚未證實」**。

---

## 6. 是否存在其他受影響檔案

全面盤點專案內所有 `.ps1` 檔案（共 3 支，已排除 `node_modules`）：

| 檔案路徑 | 大小 (`Bytes`) | 最後修改時間 (`UTC`) | `UTF-8 BOM` | `HasCR` | PowerShell 5.1 AST | 判定 |
|---|---:|---| :---: | :---: | :---: |---|
| [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) | `40,838` | `2026-11-11T10:11:26.274Z` | **False** | False | **`21` 錯誤** | **受影響（BOM 遺失）** |
| [`scripts/database/restore_pg17_sandbox.test.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.test.ps1) | `39,668` | `2026-11-11T10:11:26.692Z` | **False** | False | **`72` 錯誤** | **受影響（BOM 遺失）** |
| [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1) | `19,749` | `2026-11-10T12:00:51.610Z` | **True** | False | **`0` 錯誤** | **未受影響（完整保留 BOM）** |

- **備註（非 `.ps1` 檔案）**：[`scripts/database/backup-pipeline.test.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-pipeline.test.cjs) 曾於同波段 `2026-11-11T09:54:56.823Z` 產生 2 處純空白字元差異（檔案開頭增加 1 空行、`} catch {}` 改為 `} catch { }`），不影響 `.cjs` 執行與測試（`14/14` PASS），其後未再變動。其餘 `backup-crypto.cjs`、`backup-crypto.test.cjs`、`backup-pipeline.cjs` 及所有 `docs/DATABASE_PHASE3C11*.md` 均未受去 BOM 或格式改動影響。

---

## 7. 建議的永久修復方式（本階段僅規劃，尚未實作）

為根治 Windows PowerShell 5.1 編碼敏感與 IDE 存檔去 BOM 問題，建議採「**設定防護 + 程式碼本質免疫 + 檢查守門**」三層防線：

1. **工作區層強制鎖定 PowerShell 檔案編碼與換行**：
   - 新增專案級 `.vscode/settings.json`，明確指定：
     ```json
     {
       "[powershell]": {
         "files.encoding": "utf8bom",
         "files.eol": "\n"
       }
     }
     ```
   - 同時新增專案級 `.editorconfig`，為 `[*.ps1]` 宣告 `charset = utf-8-bom` 與 `end_of_line = lf`，確保跨編輯器一致保留 BOM。
2. **從根本消除 PowerShell 5.1 無 BOM 毀滅風險（強烈建議評估採用）**：
   - Windows PowerShell 5.1 之所以在無 BOM 時將 UTF-8 繁體中文字元誤判為 ANSI／Big5，進而把多字元組序列拆成引號破壞造成數十個 AST 語法錯誤，**根本觸發點在於 `.ps1` 原始碼字面值含有非 ASCII 字元**。
   - 長遠最穩健的做法除了補回與鎖定 `utf8bom`，亦可進一步評估：在 `.ps1` 執行期輸出或錯誤訊息中改用全 ASCII 或 PowerShell 轉義字元（或至少保證字串與註解在 BOM 意外遺失時不會讓引號閉合失效），讓腳本即使在極端無 BOM 情境下亦不致發生 AST 崩潰。
3. **補回 BOM 並加入自動化編碼／AST 守門檢查**：
   - 為兩支 `.ps1` 重新補回 `0xEF 0xBB 0xBF`（於寫回時保留 11G 完全一致之位元組與 LF 換行）。
   - 於 `restore_pg17_sandbox.test.ps1` 或獨立前置檢查中，驗證 `restore_pg17_sandbox.ps1` 與自身檔頭必須具備 `EF BB BF` 且 PowerShell 5.1 `Parser::ParseFile` 錯誤數必須為 `0`，作為進入任何實機階段前的必要檢查條件。

---

## 8. 是否能確認根本原因

- **可明確確認的結論**：
  1. 兩支 `.ps1` 腳本的故障**百分之百純粹是由檔頭 3-byte UTF-8 BOM（`0xEF 0xBB 0xBF`）被移除所致**；扣除 BOM 後所有程式碼內容與換行字元與 Phase 3-C-11G 通過版本**零差異**（記憶體補回 `EF BB BF` 後 `SHA-256` 100% 吻合）。
  2. Antigravity IDE 與 `ms-vscode.powershell` 擴充套件目前均**沒有**為 `[powershell]` 設定 `utf8bom`，專案亦無 `.vscode/settings.json` 或 `.editorconfig`，導致任何通過 Antigravity IDE 預設儲存流程的 `.ps1` 檔案都會失去 BOM。
  3. 兩次異常皆排除專案內腳本與 Git hooks 所為，且與 `Antigravity IDE\User\History` 的寫入紀錄精確吻合至 `21~31 ms`。
- **尚無法確認的部分（「原因尚未證實」）**：
  - **在 `2026-11-11T10:11:26Z` 那一刻，究竟是哪一個具體人為操作（例如編輯器切換／存檔／還原）、Antigravity IDE UI 功能，或擴充套件內部機制觸發了先生成 `kevW.ps1`/`uQAZ.ps1` 歷史快照再覆寫為無 BOM 11G 內容，因 IDE 日誌未記錄存檔與 UI 指令稽核事件，目前「原因尚未證實」**。

---

## 9. 下一階段建議（Phase 3-C-11J）

建議下一階段先執行**離線防護與腳本恢復驗證（仍不碰資料庫）**，完成後方可重新進入實機前置檢核：

1. 建立專案層 `.vscode/settings.json`（鎖定 `"[powershell]": { "files.encoding": "utf8bom", "files.eol": "\n" }`）與 `.editorconfig`（`[*.ps1]` `charset = utf-8-bom`）。
2. 為 `scripts/database/restore_pg17_sandbox.ps1` 與 `scripts/database/restore_pg17_sandbox.test.ps1` 補回 3-byte UTF-8 BOM (`0xEF 0xBB 0xBF`)，並驗證 PowerShell 5.1 AST 錯誤數回復為 `0`。
3. 對恢復 BOM 後之最新版本重新執行完整離線測試套件：
   - `node scripts/database/backup-crypto.test.cjs`（預期 `14/14` PASS）
   - `node scripts/database/backup-pipeline.test.cjs`（預期 `14/14` PASS）
   - `scripts/database/restore_pg17_sandbox.test.ps1`（預期 `37/37` PASS）
4. 記錄補回 BOM 後的最新檔案大小與 `SHA-256`，並確認在開啟／編輯／閒置觀察下不會再次被移除 BOM，隨後再重新執行 PG17 實機唯讀確認或申請 PG17 實際還原授權。
