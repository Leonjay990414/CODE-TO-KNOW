# CODE TO KNOW (碼上學)
# PHASE 3C-4E-R3-1：PG17 隔離沙盒受控恢復與 Prisma 唯讀連線驗收補充報告

本報告依據 **PHASE 3C-4E-R3-1 受控恢復與驗收授權** 規範撰寫。  
由資深 PostgreSQL DBA、Prisma 架構師、DevOps 工程師與獨立資安審查團隊共同執行，完整記錄前置鑑識、衝突掛載排除、受控重建啟動、Prisma 唯讀查詢驗證與整體結構完整性驗收之全過程。

---

## 執行摘要 (Executive Summary)

- **前置狀態確認**：
  - 容器 `code_to_know_pg17_restore_sandbox` 因宿主機重啟後掛載點衝突處於 `Exited (127)` 狀態。
  - 原有專屬 Volume `code_to_know_pg17_restore_sandbox_data` 完整存在，底層資料無損。
- **受控恢復操作**：
  - 鑑識確認衝突路徑 `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_init_password.txt` 為 Docker 自動建立之唯一空資料夾（ItemCount = 0），且其餘機密檔案完好。
  - 經授權以非遞迴安全指令移除該空資料夾。
  - 由於舊容器定義中含有已失效之 Bind Mount，以乾淨方式移除舊停止容器（未帶 `-v`，原有 Volume 毫髮無損），並以完全相同之官方 Digest 映像（`sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`）、相同 Port（`127.0.0.1:5433`）與完全相同之 Volume 重新啟動沙盒。
- **Prisma 唯讀連線驗收**：
  - Prisma Client 7.10.1 初始化成功。
  - 透過 `@prisma/adapter-pg` 成功建立本機 TCP 5433 連線。
  - `SELECT 1` 回傳 `[{"result":1}]`。
  - 成功查詢 PostgreSQL 伺服器版本（`PostgreSQL 17.11`）、資料庫名稱（`code_to_know_cloud_restore_test`）、目前使用者（`codetoknow_restore`）。
  - 成功驗證階段唯讀設定與防寫機制（嘗試寫入觸發 `cannot execute CREATE TABLE in a read-only transaction` 正確被擋下）。
  - Prisma ORM 唯讀查詢 `prisma.user.count()` 回傳 `0`，且平穩執行 `$disconnect()` 與連線釋放。
- **結構完整性再次核對**：
  - 37 張資料表、47 組外鍵、133 組索引、64 組唯一索引、2 筆遷移歷史 100% 完好無缺。
- **最終驗收判定**：  
  **`PASS — PG17 SANDBOX RECOVERED AND PRISMA READ-ONLY VERIFICATION SUCCESSFUL`**

---

## 一、第一階段：恢復前鑑識結果

### 1. Git 版本與工作區狀態
- **Branch**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`（與遠端 `origin/main` 一致）。
- **工作區狀態**：使用者原有之未提交修改與未追蹤工作檔案完整保留，零覆蓋、零丟棄。
- **前置文件**：`docs/DATABASE_PHASE3C4E_R3_1_PRISMA_READONLY_CONNECTION_AUDIT.md` 存在且完整保存。

### 2. Docker 容器與環境規格鑑識
- **容器名稱**：`code_to_know_pg17_restore_sandbox`
- **原始退出代碼**：`Exited (127)`
- **錯誤訊息**：`failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting "/run/desktop/mnt/host/c/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_init_password.txt" to rootfs at "/run/secrets/pg_password": mount src=..., dst=..., flags=MS_BIND|MS_REC: not a directory`
- **完整映像識別資訊**：
  - Image Name：`postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
  - Image ID：`sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac`
  - Manifest Digest：`sha256:4717f90960a225c2d1c5dac50508c401230f693ff626e06e84e6db0a68ded508`
  - OS/Arch：`linux/amd64 (Alpine 3.24)`
- **通訊埠配置**：`127.0.0.1:5433 -> 5432/tcp`
- **Restart Policy**：`unless-stopped`
- **網路配置**：`bridge`
- **PG16 開發容器**：`code_to_know_postgres` 正常運行於 `127.0.0.1:5432`（健康狀態），完全隔離未受干擾。

### 3. Volume 完整性唯讀檢查
審查團隊以暫存唯讀 Alpine 容器查核 Volume `code_to_know_pg17_restore_sandbox_data`：
- **Volume 名稱**：`code_to_know_pg17_restore_sandbox_data`
- **Driver / Scope**：`local`
- **PG_VERSION**：存在，內容為 `17`。
- **資料庫目錄**：`base/`、`global/`、`pg_wal/`、`postgresql.conf` 均存在。
- **資料庫 OID 目錄**：`base/16384`（大小 20,480 bytes）完好存在，證實恢復前資料庫實體區塊未受任何損害。

---

## 二、第二階段：衝突資料夾確認與排除

審查團隊於處理前進行嚴密鑑識：

1. **路徑確認**：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_init_password.txt`
2. **型態與項目**：
   - `PSIsContainer`: `True`（為資料夾而非檔案）
   - `ItemCount`: `0`（子項目數量為 0，確為空資料夾）
   - 來源確認：Docker 在 Windows 宿主機尋找未命中之 Bind Mount 來源時自動建立之佔位空目錄。
3. **其餘機密檢查**：
   - `pg17_restore_user_password.txt`（正式使用者密碼檔，Mode: `-a----`，長度 24 bytes）完好存在。
   - `certs` 目錄完好存在。
4. **排除操作**：
   - 經授權呼叫 `[System.IO.Directory]::Delete('C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_init_password.txt')` 執行精確非遞迴移除。
   - 移除後重新查驗：路徑已不復存在，其餘機密檔案 100% 保持原狀。

---

## 三、第三階段：容器受控恢復與啟動

### 1. 舊容器移除與依據
- 由於舊容器定義中固化了對 `pg17_init_password.txt` 之 Bind Mount，啟動時 runc 會再次自動建立該目錄並發生型態衝突。
- 經授權執行 `docker rm code_to_know_pg17_restore_sandbox`（未帶任何 `-v` 旗標）。
- 移除後立即查核 `docker volume ls`，確認 `code_to_know_pg17_restore_sandbox_data` 仍然完好存在。

### 2. 受控重啟沙盒容器
依據 R1 官方規格重新啟動容器，由於資料庫已初始化完成，不再需要初始密碼檔案：
```bash
docker run -d \
  --name code_to_know_pg17_restore_sandbox \
  -p 127.0.0.1:5433:5432 \
  -v code_to_know_pg17_restore_sandbox_data:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac
```

### 3. 啟動日誌鑑識
```text
PostgreSQL Database directory appears to contain a database; Skipping initialization
2026-11-09 09:33:23.517 UTC [1] LOG: starting PostgreSQL 17.11 on x86_64-pc-linux-musl
2026-11-09 09:33:23.517 UTC [1] LOG: listening on IPv4 address "0.0.0.0", port 5432
2026-11-09 09:33:24.717 UTC [1] LOG: database system is ready to accept connections
```
- **初始化跳過確認**：日誌明確記錄 `Skipping initialization`，絕無重新格式化或覆寫資料。
- **自動復原與就緒**：PostgreSQL 17.11 成功完成 WAL 復原並進入連線就緒狀態。

---

## 四、第四階段：Prisma 唯讀連線測試結果

測試透過專案現有 `@prisma/client`（7.10.1）、`@prisma/adapter-pg`（7.10.1）與 `pg`（8.13.1）驅動，連線至本機 PG17 隔離沙盒（`127.0.0.1:5433`，Database: `code_to_know_cloud_restore_test`，User: `codetoknow_restore`）：

| 測試項目 | 預期結果 | 實際測試輸出 | 判定 |
| :--- | :--- | :--- | :---: |
| **Prisma Client 初始化** | Client 實例成功載入驅動適配器 | `Prisma Client Initialized: SUCCESS` | **PASS** |
| **TCP 5433 連線與 SELECT 1** | 成功回傳 `[{"result":1}]` | `SELECT 1 Result: [{"result":1}]` | **PASS** |
| **PostgreSQL 版本查詢** | 確認為 PostgreSQL 17.11 | `PostgreSQL 17.11 on x86_64-pc-linux-musl` | **PASS** |
| **目標資料庫名稱驗證** | 確認為還原沙盒庫 | `code_to_know_cloud_restore_test` | **PASS** |
| **連線帳號身分驗證** | 確認為沙盒專屬唯讀測試帳號 | `codetoknow_restore` | **PASS** |
| **交易唯讀設定與防寫測試** | 啟用唯讀並驗證 DDL 被阻斷 | `cannot execute CREATE TABLE in a read-only transaction` (Code: 25006) | **PASS** |
| **公共 Schema 表格數查詢** | 確認包含 37 張表格 | `Public Table Count: 37` | **PASS** |
| **Prisma ORM 物件讀取** | `prisma.user.count()` 回傳 0 | `Prisma ORM user.count(): 0` | **PASS** |
| **連線平穩關閉釋放** | 正常執行 `$disconnect()` | `Prisma Client and Pool Disconnected: SUCCESS` | **PASS** |

---

## 五、第五階段：結構與資料完整性驗收

在受控恢復與 Prisma 唯讀連線測試完成後，審查團隊以唯讀 SQL 進行深層結構校驗：

| 檢查項目 | 基準數據 (R2 驗收) | 恢復後實際數據 | 判定 |
| :--- | :---: | :---: | :---: |
| **public Schema 資料表總數** | 37 張 | 37 張 | **PASS** |
| **外部鍵條件約束總數 (FK)** | 47 組 | 47 組 | **PASS** |
| **索引總數 (pg_indexes)** | 133 組 | 133 組 | **PASS** |
| **唯一索引總數 (Unique Indexes)** | 64 組 | 64 組 | **PASS** |
| **Prisma 遷移歷史記錄筆數** | 2 筆 | 2 筆 | **PASS** |
| **業務資料寫入筆數** | 0 筆 | 0 筆 | **PASS** |
| **PostgreSQL 16 開發資料庫** | 37 張表格 | 37 張表格 (未受干擾) | **PASS** |

---

## 六、安全性檢查清單

- **Supabase 正式雲端庫**：**零連線、零操作**。
- **既有 PostgreSQL 16 庫**：**正常運行於 127.0.0.1:5432，未受干擾**。
- **資料庫 Volume**：**未刪除、未格式化、未清空**。
- **Prisma Schema 與 Migration**：**零異動、零 db push、零 seed**。
- **環境設定檔 (`.env`)**：**零修改**。
- **機密防護**：終端日誌、輸出與文件**零明文密碼外洩**。
- **Git 狀態**：HEAD 保持 `7b778942f2fa85e351575cd72507c2373bdf2f96`，工作區未追蹤及未暫存檔案完整保留。

---

## 七、最終審查結論

**`PASS — PG17 SANDBOX RECOVERED AND PRISMA READ-ONLY VERIFICATION SUCCESSFUL`**

PostgreSQL 17 本機隔離沙盒已安全復原，Prisma 7 Client 與 Node.js 後端環境已成功通過對 PostgreSQL 17 還原資料庫之實體 TCP 唯讀連線與 ORM 查詢驗證，資料庫完整性與安全邊界 100% 完好。
