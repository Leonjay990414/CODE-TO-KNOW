# CODE TO KNOW｜Phase 3-C-35：AUTH-02 唯讀授權範圍與前置確認

- **文件階段**：Phase 3-C-35（`AUTH-02` 執行前唯讀授權範圍確認；**未連線任何資料庫、未取得或解密備份**）
- **建立日期**：2026-11-12
- **前置階段**：[`DATABASE_PHASE3C35_AUTH01_PG17_SANDBOX_EXECUTION_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_AUTH01_PG17_SANDBOX_EXECUTION_REPORT.md)（`AUTH-01` 已全數 `PASS`）
- **參考規範**：[`DATABASE_PHASE3C35_LIVE_VALIDATION_MASTER_PLAN.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_LIVE_VALIDATION_MASTER_PLAN.md)、[`DATABASE_PHASE3C35_AUTHORIZATION_BOUNDARY_MATRIX.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_AUTHORIZATION_BOUNDARY_MATRIX.md)、[`DATABASE_PHASE3C35_STOP_AND_RECOVERY_CRITERIA.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_STOP_AND_RECOVERY_CRITERIA.md)、[`DATABASE_PHASE3C35_FINAL_READINESS_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_FINAL_READINESS_REPORT.md)

---

## 1. AUTH-02 正式名稱與目的

- **正式名稱**：**AUTH-02：最新 Supabase 正式加密備份取得（Latest Supabase Encrypted Backup Acquisition）**
- **核心目的**：在未來任何正式環境探索或角色切換之前，先取得**切換當下最新**的 Supabase 正式資料庫邏輯備份（`.dump` + AES-256-GCM 加密 `.c2kb` + `.sha256` 校驗檔），取代 `2026-11-10` 舊備份作為最新災害復原基準（對應 `H04-1` 與 `H04-2`）。

---

## 2. AUTH-02 所需操作的完整清單

1. 檢查本機 Docker 服務與鎖定之 PG17 Client Tools 映像檔（`postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`）。
2. 唯讀核對本機 Root CA（`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`）SHA-256（`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`）。
3. 由使用者透過安全互動輸入或密碼庫提供認證資訊（不進 CLI 參數、Log、Shell History 或檔案），執行 [`scripts/database/run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1)（搭配 `-Encrypt`）。
4. 透過 Supabase Session Pooler（`aws-0-ap-southeast-2.pooler.supabase.com:5432`、`PGSSLMODE=verify-full`）執行唯讀邏輯匯出 `pg_dump -Fc`，產生於全新時間戳目錄 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_YYYYMMDD_HHMMSS\`。
5. 計算並記錄最新 `.dump` 與加密 `.c2kb` 之 SHA-256，生成 `.sha256` 與 `backup_info.json`（並依需求視選項決定是否清除明文僅保留 `.c2kb`）。
6. 將新備份與 `.sha256` 同步留存至外接 USB 離線備份（若使用者同時指示）。

---

## 3. 涉及環境與操作性質邊界

| 環境 | 是否涉及 | 具體操作與性質 |
|---|---|---|
| **本機檔案系統（外部備份目錄）** | **是** | 於 `CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_<timestamp>\` **新增**備份與校驗檔（不覆寫既有目錄）。 |
| **Supabase 正式環境** | **是（僅唯讀匯出）** | 僅透過 `pg_dump` 進行**唯讀**結構與資料匯出；**不執行任何 `INSERT`/`UPDATE`/`DELETE`/DDL/角色異動**。 |
| **PG16（`5432`）** | **否** | 完全不觸及。 |
| **PG17 還原 Sandbox（`5433`）／測試容器（`5434`）** | **否** | 完全不觸及（`pg_dump` 使用獨立暫時性 `--rm` Client Tools 容器）。 |
| **Render** | **否** | 完全不觸及。 |

- **是否涉及正式資料讀取？**：**是**（`pg_dump` 邏輯讀取正式庫結構與資料列，僅寫入本地加密檔案，**絕不輸出資料內容於終端或報告**）。
- **是否涉及資料庫寫入？**：**否**（100% 唯讀）。
- **是否涉及備份？**：**是**（本階段唯一核心任務）。
- **是否涉及解密或還原？**：**否**（解密與 PG17 還原驗收屬於獨立的 **`AUTH-03`**，不在 AUTH-02 授權範圍內）。

---

## 4. 所需帳號、權限及前置條件

- **所需資料庫帳號與權限**：現有可登入 Supabase `postgres` 資料庫之管理員讀取帳號（`postgres.ypibmyfxfhsyfdwxprpi`）及 **KeePassXC 離線 256-bit 加密金鑰（64-char Hex）**。
- **前置條件**：
  1. 使用者明確書面授權 **`AUTH-02`**。
  2. 本機 Docker Desktop 運行中（供執行固定 Digest 之 `pg_dump` 容器）。
  3. 外部秘密目錄存在有效的 `supabase-root.crt`（SHA-256 吻合）與可寫入之 `CODE-TO-KNOW_BACKUPS` 目錄。

---

## 5. 可能影響的資料與資源

- **正式 Supabase 資料庫**：產生短暫的唯讀 `pg_dump` 快照讀取負載（無鎖表寫入、無資料與結構變更）。
- **本機磁碟**：於 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\` 新增一個獨立時間戳備份資料夾（不影響 `2026-11-10` 等既有備份、不修改 Repo 程式碼）。

---

## 6. 執行前檢查、停止條件及復原方式

- **執行前檢查**：確認無進行中正式遷移、Root CA SHA-256 吻合、目標時間戳目錄不存在、`-DryRun` 驗證通過（若先跑 DryRun）。
- **強制停止條件（對應 `STOP-01`、`STOP-03`、`STOP-10`）**：
  - Root CA 憑證 SHA-256 不符或 TLS `verify-full` 握手失敗。
  - `pg_dump` Exit Code 非 0、輸出檔案大小為 0、或 SHA-256 計算失敗。
  - 加密過程中斷或目標目錄發生覆寫衝突。
- **復原方式**：因 AUTH-02 對資料庫零寫入，失敗時無須資料庫回滾；僅須刪除該次不完整之新建時間戳暫存目錄（**嚴禁刪除任何既有歷史備份**），並於 `finally` 清除記憶體中的密碼與金鑰字串。

---

## 7. AUTH-01 結果與 AUTH-02 獨立授權確認

1. **`AUTH-01` 的 `PASS` 結果是否滿足 `AUTH-02` 的前置條件？**：**是，就流程順序而言已完成並滿足前置隔離演練階段**；但依授權邊界原則，**`AUTH-01` 通過並不會自動開啟 `AUTH-02`**。
2. **`AUTH-02` 是否需要獨立、明確的使用者授權？**：**是，絕對需要**。依 [`DATABASE_PHASE3C35_AUTHORIZATION_BOUNDARY_MATRIX.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C35_AUTHORIZATION_BOUNDARY_MATRIX.md)，`AUTH-02` 目前狀態仍為 **`NOT AUTHORIZED`**，且取得 `AUTH-02` 後亦**不得**延伸解讀為已授權 `AUTH-03`（解密與還原）或 `AUTH-04`（Supabase 唯讀連線驗證）。
