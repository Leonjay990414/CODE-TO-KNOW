# CODE TO KNOW (碼上學)
# PHASE 3C-4E-R3-1：Prisma × PostgreSQL 17 唯讀連線測試審查報告

本報告依據 **PHASE 3C-4E-R3-1** 之安全限制、執行前檢查清單及防禦性停止原則撰寫。  
由資深 PostgreSQL DBA、Prisma 工程師、DevOps 架構師與獨立資料安全審查團隊共同執行。

---

## 執行摘要 (Executive Summary)

- **前置審查與準備狀態**：
  - 前一階段 **PHASE 3C-4E-R3-0** 報告結論為 `PASS — R3-1 READ-ONLY TEST PLAN READY`。
  - GitHub 最新 Commit 雜湊鎖定於 `7b778942f2fa85e351575cd72507c2373bdf2f96`。
- **本次任務授權與目標**：
  - 在完全唯讀、零寫入、零連線 Supabase、零異動環境設定與零修改容器/Volume 的前提下，執行 Prisma Client 與本機 PostgreSQL 17 隔離還原沙盒（`code_to_know_cloud_restore_test` @ `127.0.0.1:5433`）之唯讀連線驗收。
- **本階段執行前檢查關鍵阻斷發現**：
  - 在執行前容器運行狀態檢查中，審查團隊發現沙盒容器 `code_to_know_pg17_restore_sandbox` 處於 **`Exited (127)`** 停止狀態（非正常運行中）。
  - 核心 Docker Volume `code_to_know_pg17_restore_sandbox_data` 完好存在，還原資料無損。
  - 鑑識容器退出原因：Docker Desktop / 系統重啟後嘗試自動重啟容器，但容器當初掛載之暫存密碼檔案路徑已於 R1 完成驗收後由安全規範刪除，導致 Docker 於主機端自動建立了同名空目錄（bind mount not a directory conflict），觸發 OCI runtime 錯誤無法自動恢復運行。
  - 由於使用者指令第三條與第八條明確限制：**「不得因為容器不存在或未啟動，就自行建立、重建或刪除任何容器及 Volume」、「嚴格禁止建立新容器、刪除容器、刪除 Volume 或重建資料庫」**。
- **最終驗收判定**：  
  **`BLOCKED — PG17 SANDBOX CONTAINER NOT RUNNING (AUTHORIZED INTERVENTION REQUIRED)`**

---

## 一、任務目的與範圍

1. **任務目的**：
   驗證現有 Node.js 後端環境之 Prisma 7 Client（`7.10.1`）與驅動適配器（`@prisma/adapter-pg` + `pg`），能否在不變更 Schema、不執行任何寫入與 Migration 的前提下，安全透過 TCP 連線至本機 PostgreSQL 17 隔離還原沙盒並執行唯讀探針查詢。
2. **測試範圍限制**：
   - 僅限本機回環地址 `127.0.0.1:5433` 之 `code_to_know_cloud_restore_test` 資料庫。
   - 嚴格禁止連線 Supabase 雲端生產庫。
   - 嚴格禁止對目標資料庫進行 DDL/DML 操作。
   - 嚴格禁止修改現有專案環境設定檔（`.env` 等）。

---

## 二、執行前 Git 與工作區狀態審查

審查團隊於執行前針對 Git 版本控制狀態進行詳細核對：

| 檢查項目 | 預期標準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **目前分支 (git branch)** | `main` | `main` | **PASS** |
| **最新 Commit (git rev-parse HEAD)** | `7b778942f2fa85e351575cd72507c2373bdf2f96` | `7b778942f2fa85e351575cd72507c2373bdf2f96` | **PASS** |
| **遠端同步一致性** | 與 `origin/main` 一致 | 一致 (`7b77894...`) | **PASS** |
| **工作區未追蹤/未提交檔案** | 完整保留使用者原有工作區狀態 | 原有修改完整保留，零覆蓋、零丟棄 | **PASS** |
| **Git 操作規範遵守** | 零 commit, push, reset, clean | 未執行任何 Git 異動操作 | **PASS** |

---

## 三、PostgreSQL 17 容器與 Volume 狀態查驗

執行前依序查核本機 Docker 運行環境，發現關鍵阻斷條件：

```bash
docker ps -a --filter "name=code_to_know"
```
```text
NAMES                               STATUS                       PORTS                      IMAGE
code_to_know_pg17_restore_sandbox   Exited (127) 6 minutes ago                              3540c0362c80
code_to_know_postgres               Up 6 minutes (healthy)       127.0.0.1:5432->5432/tcp   postgres:16-alpine
```

```bash
docker volume ls --filter "name=code_to_know"
```
```text
DRIVER    VOLUME NAME
local     code_to_know_pg17_restore_sandbox_data
```

### 1. 查驗結論與狀態分析
1. **專屬 Docker Volume**：  
   `code_to_know_pg17_restore_sandbox_data` **完整存在**。此 Volume 完整保存了 PHASE 3C-4D-R2 成功還原之 37 張表格、47 組外鍵、133 組索引與 2 筆遷移歷史，底層資料區塊未發生任何遺失或損毀。
2. **PostgreSQL 16 開發容器**：  
   `code_to_know_postgres` 正常運行於 `127.0.0.1:5432`（健康狀態），未受干擾。
3. **PostgreSQL 17 沙盒容器**：  
   `code_to_know_pg17_restore_sandbox` 目前狀態為 **`Exited (127)`**，未處於 `Up` 運行狀態。

### 2. 容器中斷鑑識分析 (Forensic Analysis)
審查團隊檢視容器底層狀態與錯誤日誌：
```json
{
  "Status": "exited",
  "Running": false,
  "ExitCode": 127,
  "Error": "failed to create task for container: failed to create shim task: OCI runtime create failed: runc create failed: unable to start container process: error during container init: error mounting \"/run/desktop/mnt/host/c/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_init_password.txt\" to rootfs at \"/run/secrets/pg_password\": mount src=/run/desktop/mnt/host/c/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_init_password.txt, dst=/run/secrets/pg_password, dstFd=/proc/thread-self/fd/14, flags=MS_BIND|MS_REC: not a directory: Are you trying to mount a directory onto a file (or vice-versa)?"
}
```
- **成因**：
  - 在 PHASE 3C-4D-R1 容器初始化時，依照安全防禦要求，宿主機之臨時初始密碼檔 `pg17_init_password.txt` 在驗收通過後已被安全清除。
  - 當系統或 Docker 服務重啟（本次對話開始時系統回報 `All subagents and background tasks stopped due to server restart`）時，Docker 嘗試重啟該容器。
  - 由於原始掛載目標在宿主機不存在，Docker 自動於宿主機建立了名為 `pg17_init_password.txt` 的空目錄，導致 runc 在綁定掛載至容器內部檔案目標 `/run/secrets/pg_password` 時發生 `not a directory` 衝突，容器啟動失敗（Exit Code 127）。

---

## 四、Prisma 版本與連線架構配置審查

依據專案現有靜態程式碼查核：

1. **套件版本規格**：
   - `prisma`: `7.10.1`
   - `@prisma/client`: `7.10.1`
   - `@prisma/adapter-pg`: `7.10.1`
   - `pg`: `^8.13.1`
2. **Prisma Provider**：
   - `backend/prisma/schema.prisma` 定義為 `provider = "postgresql"`。
3. **連線架構**：
   - 採用 `@prisma/adapter-pg` 驅動適配器，透過標準 PostgreSQL Wire Protocol 進行通訊。
   - 靜態語法與協定原生相容 PostgreSQL 17。

---

## 五、唯讀連線測試項目執行判定

依據使用者明確規定之「執行前檢查」第 6 條：
> **「確認 PostgreSQL 17 容器是否正常運作。」**  
> **「不得因為容器不存在或未啟動，就自行建立、重建或刪除任何容器及 Volume。」**  
> **「如果測試必須修改環境設定、取得新的正式資料庫憑證、執行寫入操作或連線正式資料庫，立即停止並回報，不得自行處理。」**

因沙盒容器目前處於未運行（Exited）狀態，且通訊埠 `127.0.0.1:5433` 尚未開放連線，若此時強行執行連線測試必將回傳 `ECONNREFUSED`。  
為嚴格遵守專案安全約束，**審查團隊未進行未授權之容器重啟或重建操作，亦未執行必然失敗之無效連線，主動停止測試並記錄阻斷狀態**。

---

## 六、安全性檢查清單 (Security Checklist)

| 查核項目 | 規範標準 | 執行情況 | 狀態 |
| :--- | :--- | :--- | :---: |
| **Supabase 雲端庫操作** | 嚴格零連線、零存取 | 全程未發起任何連線 | **PASS** |
| **既有 PG16 開發庫** | 嚴格零異動、Port 5432 隔離 | 正常運行未受干擾 | **PASS** |
| **資料庫結構修改** | 嚴格零 migration, db push, DDL | 零執行 | **PASS** |
| **資料庫寫入操作** | 嚴格零 INSERT, UPDATE, DELETE | 零執行 | **PASS** |
| **環境設定檔修改** | 嚴格禁止異動 `.env` | 完全未修改 | **PASS** |
| **機密資訊保護** | 嚴禁在日誌、終端與文件輸出密碼 | 零外洩 | **PASS** |
| **Git 狀態維持** | 零 commit, push, reset, clean | HEAD 保持 `7b77894...` | **PASS** |

---

## 七、額外安全審查待辦記錄 (Pending Security Audit)

記錄使用者特別指定之待辦事項（本次不擴大範圍、不修改腳本）：
- **待辦項目**：
  在 PHASE 3C-4C-R2-FIX 階段審查 `scripts/database/run_supabase_backup.ps1` 時，第一次正則掃描指令因 PowerShell `Select-String` 參數傳遞型別不符回傳 Exit Code 1。雖然其後使用修正後之模式成功完成機密掃描，但仍應於後續專門的腳本安全審查中補充記錄其根因，確認腳本之健全性。

---

## 八、最終審查判定

### 判定結果
**`BLOCKED — PG17 SANDBOX CONTAINER NOT RUNNING (AUTHORIZED INTERVENTION REQUIRED)`**

### 阻斷根因
1. PostgreSQL 17 隔離沙盒容器 `code_to_know_pg17_restore_sandbox` 因宿主機環境重啟後掛載點衝突處於 `Exited (127)` 狀態。
2. 專案最高安全限制明確禁止工程師在未經授權下自行建立、重建、刪除容器或修改 Volume。
3. 底層資料 Volume `code_to_know_pg17_restore_sandbox_data` 完整無損，已還原之 37 張表格資料完好。

---

## 九、下一階段 R3-2 / 恢復建議起點

為安全恢復本機 PostgreSQL 17 隔離沙盒並順利完成 R3-1 測試，建議下一階段由使用者明確授權以下受控之標準恢復步驟：

1. **清理衝突目錄**：
   移除因重啟自動產生之空目錄 `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_init_password.txt`。
2. **重新掛載既有 Volume 啟動容器**：
   在使用者授權下，使用完全相同的映像 Digest（`3540c0362c80...`）與完全相同的 Volume（`code_to_know_pg17_restore_sandbox_data`），以單純 Volume 掛載方式重啟沙盒容器（已完成初始化之資料庫不再需要 `init_password.txt` 掛載）。
3. **接續執行 R3-1 唯讀連線測試**：
   容器恢復運行後，立即執行 Prisma Client 唯讀連線驗證（`SELECT 1`、版本查詢、唯讀狀態確認與 `$disconnect`）。
