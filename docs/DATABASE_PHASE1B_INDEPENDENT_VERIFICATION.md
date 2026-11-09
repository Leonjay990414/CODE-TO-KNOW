# CODE TO KNOW（碼上學）
# DATABASE PHASE 1B — 第二次獨立驗收報告
# (Independent Verification Report)

- **審查日期：** 2026-11-07
- **審查角色：** 資深 PostgreSQL DBA、Docker / DevOps 工程師、資料庫安全工程師、軟體品質工程師
- **審查性質：** 唯讀審查與獨立驗證（Read-Only Independent Verification）
- **優先級：** P1 — Critical Foundation
- **驗收結論：** **全部合格（PASSED — 100% 符規）**

---

## 一、驗收範圍與執行原則

本次驗收嚴格遵守安全性限制：
1. **無破壞性指令：** 未執行 `git reset`、`git clean`、`git checkout`、`git restore`。
2. **無未授權寫入：** 未執行 `prisma migrate dev`、`db push`、`seed` 或業務資料寫入。
3. **無雲端外連：** 未連接 Supabase，未部署至雲端。
4. **機敏資訊遮罩：** 所有密碼與連線字串均實施最高等級遮罩（`[REDACTED_64_HEX]`），無任何敏感資訊外洩。
5. **完整保留變更：** 嚴格保留所有 108 個 Git 暫存檔案（Staged files）。

---

## 二、PART A 獨立驗收項目逐項檢查結果

### A-1: Docker Engine 與容器狀態檢查

- **檢查工具與命令：** `docker inspect code_to_know_postgres`
- **檢查結果：**
  - **Docker Engine 狀態：** 正常運行（Engine running）。
  - **容器名稱：** `/code_to_know_postgres`
  - **運行狀態 (State)：** `running`
  - **健康狀態 (Health)：** `healthy`（健康檢查通過）
  - **基礎映像檔 (Image)：** `postgres:16-alpine` (PostgreSQL 16.15)
  - **重啟策略 (RestartPolicy)：** `unless-stopped`
  - **連接埠綁定 (Port Binding)：** `127.0.0.1:5432 -> 5432/tcp`（**嚴格僅綁定本機 Loopback 介面**，杜絕外部局域網直接暴露）
  - **資料持久化磁碟區 (Volume)：** `code-to-know_postgres_data -> /var/lib/postgresql/data`（Driver: `local`）
  - **健康檢查命令 (Healthcheck)：** `CMD-SHELL pg_isready -U codetoknow -d code_to_know`
- **判定：** **合格 (PASS)**

---

### A-2: PostgreSQL 唯讀 SQL 驗證

- **執行命令：** `docker exec code_to_know_postgres psql -U codetoknow -d code_to_know`
- **唯讀 SQL 執行結果：**
  1. `SELECT version();`
     ```text
     PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
     ```
  2. `SELECT current_database();`
     ```text
     code_to_know
     ```
  3. `SELECT current_user;`
     ```text
     codetoknow
     ```
  4. `SELECT inet_server_port();`
     ```text
     5432
     ```
  5. `SELECT datname FROM pg_database WHERE datname = 'code_to_know';`
     ```text
     code_to_know (1 row)
     ```
- **判定：** **合格 (PASS)**

---

### A-3: 外部 TCP 網路連線驗證

- **驗證方式：** 透過後端 `pg`（node-postgres）套件，以標準 TCP Socket 連線至 `127.0.0.1:5432`，讀取 `backend/.env` 連線配置。
- **測試結果：**
  ```text
  TCP Connection SUCCESS: {
    database: 'code_to_know',
    user: 'codetoknow',
    port: 5432,
    version_preview: 'PostgreSQL 16.15 on x86_64-pc-linux-musl'
  }
  Ping query (SELECT 1): OK
  Pool ended cleanly.
  ```
- **判定：** **合格 (PASS)**

---

### A-4: 環境變數與安全防護檢查

1. **環境變數檔案一致性：**
   - 專案根目錄 `.env` 與 `backend/.env` 均存在且設定一致。
   - 資料庫主機：`127.0.0.1:5432`
   - 資料庫名稱：`code_to_know`
   - 資料庫使用者：`codetoknow`
   - 密碼強度：使用 64 字元高強度密碼學隨機十六進位字串（Cryptographically secure random hex string）。
2. **Docker Compose 配置安全：**
   - `docker-compose.yml` 之 `POSTGRES_PASSWORD` 定義為：
     ```yaml
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
     ```
     強制要求環境變數注入，嚴禁硬編碼預設密碼。
3. **Git 忽略安全檢核：**
   - `.gitignore` 第 4 行明確配置 `.env`。
   - 執行 `git status` 與 `git diff --staged` 確認根目錄 `.env` 與 `backend/.env` **均未被 Git 追蹤，亦未存在於暫存區中**。
- **判定：** **合格 (PASS)**

---

### A-5: 暫存腳本檢視與密碼同步安全性

1. **密碼同步機制複核：**
   - 針對舊 Docker Volume 初次建置密碼與新 64 字元強密碼之同步需求，執行腳本嚴格置於 Agent 沙盒暫存目錄（`scratch/`），**未在專案工作目錄建立任何臨時檔案**。
   - 資料庫內部使用標準 `ALTER USER codetoknow WITH PASSWORD '...'` 完成密碼更新，使 Docker Volume 內部憑證與 `.env` 達成 100% 一致。
2. **原始碼與文件安全：**
   - 專案程式碼與歷史提交紀錄中，無任何明文密碼被提交。
   - 報告與測試輸出中全面使用遮罩標籤。
- **判定：** **合格 (PASS)**

---

### A-6: Git 版本控制與 108 個暫存檔案完整性

- **檢查命令：** `git status --short`
- **當前分支：** `main`
- **當前 HEAD：** `af150371e2ad734b55af25969e5864cb7fb08f5b`
- **暫存檔案狀態：**
  - 既有 108 個暫存檔案（包含文件、規格書、前端原型資料及單元測試檔案）**100% 完整保留，無任何遺失、無被 un-stage、無被覆蓋**。
  - 工作目錄修改（Unstaged）：僅限 `docker-compose.yml` 安全防護修正及既有未暫存前端修改。
- **判定：** **合格 (PASS)**

---

## 三、驗收小結

| 驗收項目 | 檢查指標 | 驗收狀態 | 備註 |
| :--- | :--- | :---: | :--- |
| **A-1** 容器狀態 | 容器運行、健康檢查、連接埠僅綁定本機 | **PASS** | 5432:127.0.0.1, healthy |
| **A-2** 唯讀 SQL | 資料庫名、使用者、版本確認 | **PASS** | PostgreSQL 16.15, code_to_know |
| **A-3** TCP 連線 | node-postgres TCP Socket 連線驗證 | **PASS** | SELECT 1 通過，連線池正常釋放 |
| **A-4** 環境變數 | .env 配置一致、強密碼、.gitignore 隔離 | **PASS** | 64 位元 Hex 強密碼，未追蹤 |
| **A-5** 腳本安全 | 無專案目錄暫存腳本殘留、密碼全遮罩 | **PASS** | 腳本隔離於 scratch，日誌安全 |
| **A-6** Git 狀態 | 108 個既有暫存檔案完整保留 | **PASS** | HEAD af15037, 暫存無任何異動 |

**結論：Phase 1B 本機 PostgreSQL 16 環境正式通過第二次獨立驗收，具備完整且穩固之基礎架構。**
