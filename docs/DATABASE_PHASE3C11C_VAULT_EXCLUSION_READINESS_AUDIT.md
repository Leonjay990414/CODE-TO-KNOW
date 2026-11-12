# CODE TO KNOW｜Phase 3-C-11C：Vault 排除策略與正式還原前安全審查報告

**文件版本**：1.0.0  
**審查日期**：2026-11-11  
**審查性質**：100% 唯讀獨立審查（未執行 `pg_restore`、未建立/修改/刪除資料庫、未連線 Supabase、未修改程式碼或環境設定、未讀取金鑰或秘密內容）  
**最終判定**：**CONDITIONAL PASS**（存在 2 項必須先行確認與修正的前置條件，尚不可直接以 `-N vault` 執行正式還原驗收）

---

## 一、備份檔案完整性驗證（實測結果）

對本機備份目錄 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261110_204519\` 進行唯讀檔案與雜湊檢查：

| 檔案名稱 | 實測大小 (Bytes) | 實測 SHA-256 | 既有紀錄比對 | 狀態 |
|---|---:|---|---|:---:|
| `code_to_know_supabase_prod.dump` | **505,249** | `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50` | 與 `.sha256` 紀錄檔完全一致 | **PASS** |
| `code_to_know_supabase_prod.dump.c2kb` | **505,282** | `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37` | 恰好增加 33 bytes (17B Header + 16B AuthTag) | **PASS** |
| `code_to_know_supabase_prod.dump.sha256` | **102** | — | 內容與 `.dump` 雜湊完全吻合 | **PASS** |

- **Custom Format 檔頭驗證**：`PGDMP` 格式版本 `1.16.0`（`intSize=4`, `offSize=8`, `format=1`, 壓縮演算法 `1=gzip`），來源庫 `postgres`（`PostgreSQL 17.11`），總計 **926 筆 TOC 項目**（`tocCount = 926`，對應 `pg_restore --list` 含註解檔頭共 935 行）。

---

## 二、Vault 物件排除清單與 Phase 3-C-11B 落差發現

直接唯讀解析 `code_to_know_supabase_prod.dump` 二進位 TOC（926 筆項目）後，發現全備份中與 `vault` 或 `supabase_vault` 相關的 TOC 項目**實際共 10 筆**，而非 Phase 3-C-11B 先前以字串比對預估的 8 筆：

| # | TOC `dumpId` | 物件型別 (`desc`) | TOC `namespace` 欄位 | 物件標籤 (`tag`) | 依賴 (`deps`) | `pg_restore -N vault` 是否排除？ |
|:---:|:---:|---|---|---|---|---|
| 1 | **`13`** | `SCHEMA` | `(null)` | `vault` | `[]` | **會排除**（`desc=SCHEMA` 且 `tag=vault`） |
| 2 | **`4791`** | `ACL` | `(null)` | `SCHEMA vault` | `['13']` | **會排除**（`ACL SCHEMA vault`，且 `--no-acl` 亦會跳過） |
| 3 | **`5`** | `EXTENSION` | **`(null)`** | `supabase_vault` | `['13']` | ❌ **不會排除！（重大風險）** |
| 4 | **`4794`** | `COMMENT` | **`(null)`** | `EXTENSION supabase_vault` | `['5']` | ❌ **不會排除！（重大風險）** |
| 5 | **`4888`** | `ACL` | `vault` | `FUNCTION _crypto_aead_det_decrypt(...)` | `['387']` | **會排除**（`namespace=vault` 且 `--no-acl` 跳過） |
| 6 | **`4889`** | `ACL` | `vault` | `FUNCTION create_secret(...)` | `['389']` | **會排除**（`namespace=vault` 且 `--no-acl` 跳過） |
| 7 | **`4890`** | `ACL` | `vault` | `FUNCTION update_secret(...)` | `['390']` | **會排除**（`namespace=vault` 且 `--no-acl` 跳過） |
| 8 | **`4997`** | `ACL` | `vault` | `TABLE secrets` | `['237']` | **會排除**（`namespace=vault` 且 `--no-acl` 跳過） |
| 9 | **`4998`** | `ACL` | `vault` | `TABLE decrypted_secrets` | `['238']` | **會排除**（`namespace=vault` 且 `--no-acl` 跳過） |
| 10 | **`3777`** | `TABLE DATA` | `vault` | `secrets` | `['237']` | **會排除**（`namespace=vault`） |

### 關鍵原因說明
- `pg_restore -N vault`（`--exclude-schema=vault`）在 PostgreSQL 實作中（`_tocEntryRequired`），僅比對 `SCHEMA` 名稱、`ACL SCHEMA` 名稱以及 `te->namespace == "vault"` 的項目。
- 然而 `EXTENSION`（`#5`: `CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;`）與 `COMMENT ON EXTENSION`（`#4794`）在 TOC 結構中的 `namespace` 欄位皆為 **`NULL` (`-`)**。
- 因此，Phase 3-C-11B 推論「`-N vault` 可排除 Vault 並保證 `ExitCode = 0`」**實際上無法成立**：若僅加上 `-N vault`，`pg_restore` 雖會跳過 `#13` 與 `#3777`，但**仍會嘗試執行 `#5` 與 `#4794`**，導致標準 PG17 容器再次拋出 `ERROR: extension "supabase_vault" is not available` 與 `extension "supabase_vault" does not exist`，退出碼仍會是 **`1`**。

---

## 三、Supabase Vault 資料安全與筆數確認

依唯讀且不讀取任何秘密內容之原則，直接於記憶體中檢驗 `dumpId: 3777`（`TABLE DATA vault secrets`，壓縮檔尾端 `offset: 505220`，壓縮長度 13 bytes）之資料區塊結構標記：

| 檢查項目 | 實測結果 | 備註 |
|---|---|---|
| `vault` Schema 是否存在於備份 | **是** | TOC `#13` (`CREATE SCHEMA vault;`) |
| Vault 資料表清單 | `vault.secrets`（實體表）；`vault.decrypted_secrets`（檢視表） | 皆屬 `supabase_vault` 擴充套件內部結構 |
| `vault.secrets` 資料筆數 | **0 筆**（`decompressedBytes = 5`, `dataRowCount = 0`, 僅含 COPY 結尾標記 `\.`） | 未讀取、未輸出任何資料內容 |
| `public` 對 `vault` 之相依性 | **0 項** | 無任何外鍵、欄位預設值、函式或 SQL 定義參照 Vault |
| 是否存在需另行保存的 Vault 資料 | **否** | 資料表為空（0 筆），且本專案金鑰係由本機 KeePassXC 管理 |

---

## 四、`public` Schema 相依性分析與非 Vault 物件檢查

對 `code_to_know_supabase_prod.dump` 全數 926 筆 TOC 項目進行交叉相依與 SQL 定義文字檢索：

1. **`public` Schema 總計 337 筆 TOC 項目**：
   - `TABLE`: **37**
   - `TABLE DATA`: **37**
   - `CONSTRAINT` (Primary Keys): **37**
   - `INDEX`: **96**（加上 37 個 PK 自動索引 = 資料庫總索引 **133**）
   - `FK CONSTRAINT`: **47**
   - `ROW SECURITY`: **37**
   - `TYPE`: **1** (`AnnouncementStatus`)
   - `FUNCTION`: **1** (`rls_auto_enable()`)
   - `ACL`: **38**；`DEFAULT ACL`: **6**
2. **外部 Schema 相依性**：`public` 內 337 個項目對其他 Schema（`vault`、`auth`、`storage`、`realtime`、`extensions`、`graphql`、`pgbouncer`）之 TOC `deps` 計數為 **0**，SQL `defn` 文字中亦 **0 次** 參照上述 Schema 名稱。
3. **非 Vault 物件參照檢查**：排除 `vault` 本身後，全庫其餘 916 筆項目無任何物件依賴 `vault` 或 `supabase_vault`。
4. **其餘擴充套件不受影響**：`pg_stat_statements`（`#2`）、`pgcrypto`（`#4`）、`uuid-ossp`（`#3`）皆獨立於 `extensions` Schema，不會受排除 Vault 影響。

---

## 五、`-N vault` 參數安全性評估

| 評估構面 | 結論 |
|---|---|
| **是否會誤刪 `public` 核心物件或通用擴充** | **不會**。`pgcrypto`、`uuid-ossp`、`pg_stat_statements` 及全部 337 筆 `public` 物件皆保留。 |
| **是否會留下依賴缺失物件的項目** | **會留下**。`EXTENSION supabase_vault`（`#5`）與 `COMMENT ON EXTENSION supabase_vault`（`#4794`）因 TOC `namespace` 為 `NULL`，不會被 `-N vault` 過濾。 |
| **單獨使用 `-N vault` 是否足夠** | **不足夠**。必須改採或搭配 `pg_restore -l` + `--use-list (-L)` 過濾全部 10 筆 Vault/supabase_vault TOC 項目（至少需明確移除 `#5`、`#4794`、`#13`、`#4791`、`#3777`）。 |

---

## 六、PG17 還原目標安全狀態檢查（實測現況）

於審查當下（2026-11-11 17:32~17:37）執行本機環境檢查：

| 檢查項目 | 實測結果 | 狀態 |
|---|---|:---:|
| **Docker Engine / Desktop 狀態** | 無法連線 Docker API pipe（`//./pipe/dockerDesktopLinuxEngine` 不存在）；`wsl -l -v` 顯示 `docker-desktop` 為 **`Stopped`**；宿主機無 `docker` / `postgres` 執行緒（研判為系統重新啟動後尚未開啟 Docker Desktop） | ❌ **未啟動 / 待確認** |
| **PG17.11 容器 (`code_to_know_pg17_restore_sandbox`)** | 因 Docker Engine 未啟動，**無法即時查詢容器健康與版本** | ⚠️ **待啟動 Docker 後驗證** |
| **PG16 與 PG17 連接埠隔離** | [`docker-compose.yml`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docker-compose.yml) 靜態設定確認 PG16 綁定 `127.0.0.1:5432:5432`；但 PG17（預期 `5433`）與 PG16 雙容器即時運行狀態目前無法查詢 | ⚠️ **待啟動 Docker 後驗證** |
| **既有部分還原資料庫 (`code_to_know_c2kb_prod_restore_test`)** | 因 PG17 容器未運行，目前**無法連線查詢確認存在**（本階段未執行任何建立或刪除動作） | ⚠️ **待啟動 Docker 後驗證** |
| **建議新測試資料庫名稱可用性** | 經查閱 Phase 3-C-11A / 11B 報告，先前尚未指定新測試庫名稱；建議下一階段採用全新唯一名稱（例如 `code_to_know_c2kb_prod_restore_clean_v2`），且須於 Docker 啟動後以 `pg_database` 唯讀確認尚不存在 | ⚠️ **待命名並於 Docker 啟動後確認** |

---

## 七、還原命令預演結果（唯讀分析，未實際執行）

1. **原方案（僅加 `-N vault`）預演結論**：
   - 指令：`pg_restore -U postgres -d <new_db> -v --no-owner --no-acl -N vault <dump>`
   - 預期結果：排除 `#13, #3777` 及 6 個 ACL 項目，但**仍執行 `#5` 與 `#4794`**，產生 2 筆錯誤並回傳 **Exit Code 1**，無法通過 `restore_pg17_sandbox.ps1` 的 `ExitCode == 0` 嚴格檢查（FIX-01）。
2. **修正建議方案（`--use-list` / `-L` 精準排除 TOC）預演結論**：
   - 流程：先以 `pg_restore --list <dump>` 匯出 TOC 清單，程式化移除明確屬於 Vault / `supabase_vault` 的 **10 筆項目**（TOC ID：`5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998`），再以 `pg_restore -U postgres -d <new_db> -v --no-owner --no-acl -L <filtered_list> <dump>` 執行還原。
   - `--no-owner --no-acl` 評估：**必須維持不調整**。備份內含 `supabase_admin`、`supabase_auth_admin`、`supabase_storage_admin`、`service_role`、`anon`、`authenticated`、`dashboard_user` 等雲端專屬角色，純 PG17 沙盒沒有這些角色，必須保留 `--no-owner --no-acl`。
   - **其餘潛在警告檢查**：`PUBLICATION - supabase_realtime`（TOC `#4698`）在 `wal_level=replica` 的純 PG17 容器上會產生 `pg_restore: warning: wal_level is insufficient to publish logical changes`。依 PostgreSQL `pg_restore` 行為（warning 不計入 `n_errors`），預期回傳 **Exit Code 0**，但**必須於 Docker PG17 啟動後實機透過 `pg_restore -N vault --list` 與模擬清單檢查確認**。
3. **還原後必驗指標（共 6 大項）**：
   - `public` 資料表：**37**
   - `public` 主鍵約束：**37**
   - `public` 外鍵約束：**47**（未驗證外鍵：**0**）
   - `public` 索引：**133**
   - `public` RLS 啟用表數：**37**（`relrowsecurity = true`）
   - `_prisma_migrations` 紀錄數：**2**（`20261103000000_init`, `20261108000000_add_business_models`），其餘 36 張業務表實測 `COUNT(*)` 皆為 **0**。

---

## 八、尚存風險及待確認事項

1. **【環境阻斷】Docker Desktop 未啟動**：`docker-desktop` WSL 處於 `Stopped` 狀態，無法驗證 `code_to_know_pg17_restore_sandbox` 容器、PG16/PG17 埠口分離、`code_to_know_c2kb_prod_restore_test` 現存狀態及新目標庫名未佔用。
2. **【策略修正】`-N vault` 無法排除 Extension TOC**：已由二進位 TOC 解析證實 `pg_restore -N vault` 不會排除 `#5 EXTENSION supabase_vault` 與 `#4794 COMMENT ON EXTENSION supabase_vault`，下一階段修改還原腳本時**不可僅使用 `-N vault`**，應改為 **`-L`（TOC 過濾清單）明確排除 10 個 Vault/supabase_vault 項目**。
3. **【待實機確認】`PUBLICATION supabase_realtime` (`#4698`) 警告與 Exit Code**：需於 PG17 容器啟動後確認只保留 `#4698` 警告時 `pg_restore` 是否穩定回傳 Exit Code 0（或是否連同 `supabase_realtime` 平台發布物件一併於報告記錄其警告行為）。
4. **【新庫命名確認】**：需明確選定尚未存在的目標庫名（建議 `code_to_know_c2kb_prod_restore_clean_v2`）並在啟動 Docker 後查詢確認尚不存在。

---

## 九、最終判定

**最終判定**：**CONDITIONAL PASS**

**判定依據**：
1. 備份檔案完整性（SHA-256、C2KB 尺寸與 PGDMP 結構）100% 無損；`vault.secrets` 實測為 **0 筆資料**，`public` 與 `vault` 之間 **0 相依性**，排除 Vault 不會造成任何應用資料遺失（排除 `NO-GO`）。
2. 但目前因 **(1) Docker Desktop 未啟動導致 PG17 目標容器狀態無法實測**，以及 **(2) 實測揭露 `-N vault` 無法排除 `namespace = NULL` 的 `#5 EXTENSION supabase_vault` 與 `#4794 COMMENT` 項目，必須改用 `-L` 清單排除或等價修正方案**，故未達立即 `PASS` 執行條件，判定為 **CONDITIONAL PASS**。

---

*本階段已完成唯讀審查並停止，未執行任何實際還原或修改動作。*
