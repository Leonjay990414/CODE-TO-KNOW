# CODE TO KNOW（碼上學）
# PHASE 3C-2C.2：本機 PostgreSQL 正式 Migration 受控套用報告

- **報告日期**：2026-11-08
- **執行階段**：PHASE 3C-2C.2（本機 PostgreSQL 正式 Migration 受控套用）
- **審查角色**：PostgreSQL 資料庫管理工程師、Prisma Migration 部署工程師、資料安全與完整性審查員
- **任務性質**：AUTHORIZED MIGRATION APPLICATION（受控正式套用；遵照「若失敗不得直接重試或自行修補，先檢查資料庫實際狀態並提交報告」之最高準則）
- **目前 Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（分支：`main`）
- **目標資料庫環境**：Docker PostgreSQL 容器 `code_to_know_postgres`（127.0.0.1:5432 / 資料庫：`code_to_know`）

---

## 一、執行摘要與結果總覽 (Executive Summary)

本階段遵照使用者授權，針對本機 Docker PostgreSQL 正式資料庫 `code_to_know` 執行增量 Migration：`20261108000000_add_business_models`。

在執行部署時，Prisma 引擎與 PostgreSQL 拋出語法中斷錯誤（P3018 / SQLSTATE 42601）。依據使用者事前嚴格指示：**「若失敗，不得直接重試或自行修補。先檢查資料庫實際狀態並提交報告」**，系統已立即停止任何修補或重試動作，並完成深層鑑識與資料庫保護審查：

1. **套用結果**：
   - 執行指令：`npx prisma migrate deploy`
   - 執行耗時：2,256 ms
   - 退出碼 (Exit Code)：`1`（中斷退出）
   - 錯誤代碼：`P3018`（Database error code: 42601，語法錯誤於 `\u{feff}`）
2. **根因鑑識 (Root Cause Forensic)**：
   - 經二進位分析，`backend/prisma/migrations/20261108000000_add_business_models/migration.sql` 檔案開頭帶有 Windows PowerShell 5.1 `Set-Content -Encoding utf8` 自動寫入之 **UTF-8 BOM (Byte Order Mark, `0xEF 0xBB 0xBF`)**。
   - 運行於 Docker Alpine Linux 的 PostgreSQL 核心詞法分析器（`scan.l`）不接受 SQL 腳本第 0 位元組存在 BOM，因而於讀取第 1 個字元時立即阻斷交易。
3. **資料庫 100% 完好無損證實**：
   - 因 PostgreSQL 具備交易性 DDL（Transactional DDL）保證，整筆遷移在第 0 個指令執行前即原子性中斷。
   - **原始資料表維持 10 張**（9 張業務核心表 + 1 張遷移表），**零新增髒表**。
   - **4 位真實使用者資料 100% 毫髮無傷**，所有關聯資料筆數零變動。
   - 備份檔案 `code_to_know_pre_migration.dump` 與暫存還原庫 `code_to_know_restore_test` 完整無損。
4. **現狀處置遵循**：
   - 未執行 `prisma migrate resolve`。
   - 未執行 `prisma migrate reset`。
   - 未自行修改 Migration SQL 或資料庫記錄。
   - 保持現場，提交完整分析與修復授權建議。

---

## 二、第一階段：執行前最後安全檢查核驗

在啟動部署指令前，全量安全前置條件均已通過核驗：

| 檢驗項目 | 檢驗標準 | 實際結果 | 判定 |
|---|---|---|---|
| **Docker Engine** | 正常運作 | 正常 (Active) | [PASS] |
| **容器健康狀態** | `healthy` | `healthy` (0 failing streak) | [PASS] |
| **目標資料庫** | 嚴格為 `code_to_know` | `127.0.0.1:5432/code_to_know` | [PASS] |
| **備份檔案存在性** | 檔案存在且可讀 | 存在於外部安全目錄 | [PASS] |
| **備份檔案 SHA-256** | `2DB27F8B817179D3...` | `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085` | [PASS] |
| **暫存還原庫保留** | `code_to_know_restore_test` | 存在於容器內 (`restore_test_exists = 1`) | [PASS] |
| **原始庫核心表** | 9 張核心表完整 | 9 張核心表全數存在 | [PASS] |
| **原始庫使用者** | 4 位使用者完整 | 4 位使用者記錄全數在列 | [PASS] |
| **待套用遷移唯一性** | 僅 1 筆待套用 | 僅 `20261108000000_add_business_models` | [PASS] |
| **初始遷移狀態** | `20261103000000_init` 已套用 | `applied_steps_count = 1`, `finished_at` 正常 | [PASS] |
| **破壞性語句掃描** | 零 DROP/TRUNCATE/DELETE | 掃描確認 0 筆破壞性指令（UPDATE 僅限 ON UPDATE CASCADE） | [PASS] |

---

## 三、Migration SQL 數位指紋與檔案特徵

在執行前，對兩份遷移腳本進行二進位雜湊比對：

| 遷移檔案 | 檔案大小 | SHA-256 數位指紋 | 狀態判定 |
|---|---|---|---|
| `20261103000000_init/migration.sql` | 6,164 bytes | `ED5B504A4B30D4E5B35A0CD58AD00CEB93C501D3D0E67BD61F5D490DCBAFED29` | 與 Git HEAD 一致 |
| `20261108000000_add_business_models/migration.sql` | 27,852 bytes | `90EEB58C8FB03117DCBB2146BD78452A0DECFA426E11C16F23350DEEE6025933` | 與審查草稿一致 |

---

## 四、實際套用命令與執行結果日誌

### 4.1 執行命令
```powershell
cd backend
npx prisma migrate deploy
```

### 4.2 終端輸出完整記錄
```text
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "code_to_know", schema "public" at "127.0.0.1:5432"

2 migrations found in prisma/migrations

Applying migration `20261108000000_add_business_models`
Error: P3018
A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve
Migration name: 20261108000000_add_business_models
Database error code: 42601
Database error:
ERROR: syntax error at or near "﻿"
Position:
  0
  1 ﻿-- CreateEnum
DbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42601), message: "syntax error at or near \"\\u{feff}\"", detail: None, hint: None, position: Some(Original(1)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("scan.l"), line: Some(1244), routine: Some("scanner_yyerror") }
```

---

## 五、錯誤根因深層技術鑑識 (Root Cause Forensic)

針對報錯字元 `\u{feff}` 進行二進位檢查：

```javascript
const buf = fs.readFileSync('backend/prisma/migrations/20261108000000_add_business_models/migration.sql');
// 第一個位元組：0xef 0xbb 0xbf (UTF-8 BOM)
```

1. **產生機制**：  
   在 Phase 3C-2B 使用 Windows PowerShell 5.1 產檔時，`Set-Content -Encoding utf8` 依 Windows 舊有慣例在檔案開頭附加了 3 位元組的 UTF-8 BOM（`0xEF 0xBB 0xBF`）。
2. **PostgreSQL 解析衝突**：  
   PostgreSQL 服務端運行於 Linux (Alpine)。其詞法掃描器（`scan.l` 第 1244 行 `scanner_yyerror`）以純位元組流讀取 SQL。遇到 `0xEF 0xBB 0xBF` 時，因其既非合法 SQL 標識符亦非註解開頭符號，遂直接判定為語法錯誤（Syntax error at or near `\u{feff}`），終止解析。
3. **交易原子性保護**：  
   因為語法錯誤發生在讀取第一個指令（Position 1）時，**PostgreSQL 尚未執行任何一個 DDL 語句**，整體事務直接中止。

---

## 六、套用中斷後資料庫現場實況盤點 (Database Integrity Audit)

在套用中斷後，立即透過 `docker exec` 對目標資料庫 `code_to_know` 執行唯讀現場盤點：

### 6.1 資料表總數與結構
```sql
SELECT count(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
==> total_tables: 10
```
- **結論**：資料庫中依然只有原有的 9 張核心表與 1 張遷移表，**完全沒有任何未完成或殘留的新資料表**。

### 6.2 9 張核心表資料筆數前後對照表

| 資料表名稱 (Table Name) | 套用前基準筆數 | 套用中斷後現場筆數 | 差異 (Delta) | 狀態評定 |
|---|:---:|:---:|:---:|:---:|
| `User` | **4** | **4** | 0 | [PASS] 100% 完好 |
| `Role` | **3** | **3** | 0 | [PASS] 100% 完好 |
| `UserRole` | **4** | **4** | 0 | [PASS] 100% 完好 |
| `UserProfile` | **4** | **4** | 0 | [PASS] 100% 完好 |
| `Session` | **3** | **3** | 0 | [PASS] 100% 完好 |
| `TeacherApplication` | **2** | **2** | 0 | [PASS] 100% 完好 |
| `EmailVerificationToken` | **4** | **4** | 0 | [PASS] 100% 完好 |
| `PasswordResetToken` | **0** | **0** | 0 | [PASS] 100% 完好 |
| `AuditLog` | **9** | **9** | 0 | [PASS] 100% 完好 |

### 6.3 4 位真實使用者資料現場確認
- `45e087b3...`：整合測試學生（ACTIVE）
- `56265935...`：整合測試學生（ACTIVE）
- `5c66b177...`：莊永婕（ACTIVE）
- `312e927b...`：實測學生小明（ACTIVE）
- **核驗結論**：4 位使用者無任何異動，帳號狀態與個人檔案完好無損。

### 6.4 `_prisma_migrations` 內部狀態
查詢結果顯示目前遷移表記錄如下：
1. `20261103000000_init`：`applied_steps_count = 1`，`finished_at` 正常（原貌保留）。
2. `20261108000000_add_business_models`：
   - `applied_steps_count`: `0`（未套用任何步驟）
   - `finished_at`: `NULL`
   - `rolled_back_at`: `NULL`
   - `logs`: 記錄 PostgreSQL 語法錯誤診斷資訊。

---

## 七、工程驗證與代碼狀態

在保持資料庫現狀下，執行了工程測試鏈：
- `npx prisma validate`：**退出碼 0**（Valid 🚀）
- `npx tsc --noEmit`：**退出碼 0**（0 個 TypeScript 編譯錯誤）
- `npx vitest run`：**退出碼 0**（5 個測試檔案，92 項單元測試全數通過）

---

## 八、現存狀態與安全處置建議 (Next Step Proposal)

依據指示，我們**未擅自進行任何修復**。以下提出專業架構修補建議，靜候使用者授權：

### 8.1 建議修復兩步驟（標準恢復 SOP）
1. **步驟一：移除 Migration SQL 開頭的 3 位元組 BOM**：
   使用 Node.js 以無 BOM 的 UTF-8 重新存檔 `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`，消除 `\u{feff}` 字元。
2. **步驟二：重設資料庫中未完成的失敗標記**：
   在 `backend` 目錄執行 Prisma 官方修復指令：
   ```bash
   npx prisma migrate resolve --rolled-back 20261108000000_add_business_models
   ```
   *作用*：告知 Prisma 該次失敗的遷移尚未執行任何 DDL（`applied_steps_count = 0`），將其狀態標記為 rolled back，以解除 P3018 鎖定。
3. **步驟三：重新受控套用**：
   執行 `npx prisma migrate deploy`，正式建立 27 張資料表。

---

## 九、最終停止條件確認

- **本階段已依指示立即停止**：
  - **未執行** `prisma migrate resolve`。
  - **未執行** `prisma migrate reset`。
  - **未修改** `migration.sql` 檔案。
  - **未修改** 原始資料庫中的任何資料。
  - **未刪除** 暫存還原庫 `code_to_know_restore_test`。
  - **未刪除** 實體備份檔案。
  - **未執行** Git Commit / Push / Clean。
- **報告交付完成，現場完整保留，靜候使用者審查鑑識結果與下一步修補授權！**
