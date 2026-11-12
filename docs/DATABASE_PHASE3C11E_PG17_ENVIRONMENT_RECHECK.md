# CODE TO KNOW｜Phase 3-C-11E：Docker 啟動後 PG17 環境唯讀重新驗證報告

**文件版本**：1.0.0  
**驗證日期**：2026-11-11  
**檢查性質**：100% 唯讀重新驗證（未執行 `pg_restore`、未建立或刪除資料庫、未執行 SQL 寫入、未連線 Supabase、未修改程式碼/腳本/設定、未進行 Git 操作、未操作 KeePassXC 或輸出金鑰）  
**最終判定**：**PASS**（Docker Desktop 與 PG17.11 沙盒環境完全就緒、埠口隔離正常、目標庫名安全可用、備份與 TOC 分析無誤，可以進入下一階段，等待使用者授權後續腳本調整與實際還原）

---

## 一、Docker Engine 與容器狀態（實測結果）

### 1. `docker version` 與 `docker info` 實測
- **Docker Client**：`Version 29.9.2`, `API 1.56`, `windows/amd64`, `Context: desktop-linux`
- **Docker Server**：`Docker Desktop 4.98.0 (245422)`, `Engine 29.9.2`, `API 1.56`, `OS/Arch: linux/amd64`
- **`docker info` 摘要**：`Name=docker-desktop | ServerVersion=29.9.2 | OSType=linux | ContainersRunning=2`

### 2. 容器列表實測 (`docker ps -a`)

| 容器名稱 | 映像檔 | 實測狀態 | Port Mapping | 用途說明 |
|---|---|---|---|---|
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (`postgres:17-alpine` digest) | **Up** (Running) | `127.0.0.1:5433->5432/tcp` | PG17 還原驗證沙盒 |
| `code_to_know_postgres` | `postgres:16-alpine` | **Up (healthy)** | `127.0.0.1:5432->5432/tcp` | PG16 本機開發資料庫 |
| `dazzling_tharp` | `hello-world` | Exited (0) 7 days ago | — | 既有測試殘留已停止容器（無關） |

### 3. 容器內 PostgreSQL 實際版本實測

- **PG17 容器 (`code_to_know_pg17_restore_sandbox`)**：
  `PostgreSQL 17.11 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit` ✅ **確為 17.11**
- **PG16 容器 (`code_to_know_postgres`)**：
  `PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit`

---

## 二、埠口隔離實機驗證

不僅依賴 [`docker-compose.yml`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docker-compose.yml)，已透過 `docker port`、宿主機 `Get-NetTCPConnection` 與容器內 `pg_isready` 完成雙重實機核對：

| 實例 | `docker port` 實測對應 | 宿主機 TCP Listen 實測 (`127.0.0.1`) | `pg_isready` 實測 | 隔離結論 |
|---|---|---|---|---|
| **PG16 (`code_to_know_postgres`)** | `5432/tcp -> 127.0.0.1:5432` | `127.0.0.1:5432` (`Listen`, PID `23940`) | `127.0.0.1:5432 - accepting connections` | **完全隔離** |
| **PG17 (`code_to_know_pg17_restore_sandbox`)** | `5432/tcp -> 127.0.0.1:5433` | `127.0.0.1:5433` (`Listen`, PID `23940`) | `127.0.0.1:5432 - accepting connections` | **完全隔離** |

---

## 三、PG17 資料庫清單與既有庫完整性唯讀確認

### 1. PG17 現存全部資料庫 (`\l`)

| 資料庫名稱 | Owner | Encoding | 檢查目標對照結果 |
|---|---|---|---|
| `code_to_know_cloud_restore_test` | `codetoknow_restore` | `UTF8` | ✅ **存在**（既有測試庫，保留未動） |
| `code_to_know_c2kb_prod_restore_test` | `codetoknow_restore` | `UTF8` | ✅ **存在**（Phase 3-C-10D 部分還原庫，完整保留） |
| `c2k_dryrun_sandbox` | — | — | ℹ️ **不存在於 PG17**（無衝突） |
| `code_to_know_c2kb_prod_restore_clean_v2` | — | — | ✅ **尚未存在（安全可用於下一階段乾淨還原）** |
| `postgres` / `template0` / `template1` | `postgres` | `UTF8` | 預設系統資料庫 |

- 角色確認（唯讀查詢 `pg_roles`）：`postgres` (`rolsuper=t, rolcreatedb=t, rolcanlogin=t`)、`codetoknow_restore` (`rolsuper=f, rolcreatedb=f, rolcanlogin=t`)。

### 2. 既有部分還原庫 (`code_to_know_c2kb_prod_restore_test`) 唯讀核驗

| 檢查指標 | 實測數值 | 與 Phase 3-C-11A/11B 紀錄比對 |
|---|---:|---|
| `public` 資料表數 | **37** | 一致（未遭修改或刪除） |
| `public` 外鍵約束數 | **47** | 一致 |
| `public` 索引數 | **133** | 一致 |
| 未驗證外鍵約束數 | **0** | 一致 |
| `_prisma_migrations` 紀錄數 | **2** | 一致 |
| 各 Schema 含表統計 | `public`: 37, `auth`: 27, `storage`: 10, `realtime`: 3, `extensions`: 2 | 一致 |

---

## 四、正式備份檔案與 SHA-256 核對

檢查目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\`

| 檔案名稱 | 實測大小 (Bytes) | 重新計算 SHA-256 | 既有基準比對 | 狀態 |
|---|---:|---|---|:---:|
| `code_to_know_supabase_prod.dump` | **505,249** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | 完全一致 | **PASS** |
| `code_to_know_supabase_prod.dump.c2kb` | **505,282** | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` | 完全一致 | **PASS** |
| `code_to_know_supabase_prod.dump.sha256` | **102** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50  code_to_know_supabase_prod.dump` | 完全一致 | **PASS** |

---

## 五、TOC 過濾清單複核（純分析，未產出清單檔亦未執行 `pg_restore`）

針對 `code_to_know_supabase_prod.dump` 二進位 TOC（926 筆）再次核對排除清單：

- **排除目標 ID**：`5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998`
- **實際排除筆數**：**10 筆**（10/10 精確對應 `vault` Schema 與 `supabase_vault` Extension 及其 ACL/Data）
- **保留總筆數**：**916 筆**
- **`public` 核心物件保留數**：**337 / 337 筆**（100% 保留）
- **相依性檢查**：保留項目依賴被排除 ID 之數量為 **0 筆**（未發現任何新相依性問題）

---

## 六、尚存問題與下一階段注意事項

雖然環境與備份狀態已 100% 通過驗收，進入下一階段（腳本修正授權／乾淨還原）時仍須注意以下事項：

1. **腳本尚未加入 `-L` TOC 過濾與新目標庫預設參數**：現行 [`scripts/database/restore_pg17_sandbox.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/restore_pg17_sandbox.ps1) 預設 `$TargetDatabase` 仍為已存在的 `code_to_know_c2kb_prod_restore_test`，且尚未整合 `--use-list (-L)` 排除上述 10 個 Vault/`supabase_vault` TOC ID（需以 UTF-8 無 BOM + LF 格式寫出清單檔）。在正式授權執行乾淨還原前，須依規範切換目標庫為 `code_to_know_c2kb_prod_restore_clean_v2` 並套用 `-L` 過濾清單。
2. **`PUBLICATION supabase_realtime` (`#4698`) 警告觀測**：在 `wal_level=replica` 的標準 PG17 容器中還原 `#4698` 時預期會有 `wal_level is insufficient` warning（非 fatal error），須於正式授權執行時實機確認 `pg_restore` Exit Code 確實為 `0`。

---

## 七、最終判定

**最終判定**：**PASS**（可以進入下一階段，等待使用者授權實際還原）

*本階段所有唯讀查核已完畢並立即停止，未執行任何實際還原或環境修改。*
