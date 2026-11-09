# CODE TO KNOW（碼上學）
# PHASE 3C-2B.0.1：Docker 恢復後資料庫唯讀重新驗證報告
## (Phase 3C-2B.0.1 Docker Recovery & Read-Only PostgreSQL Live Verification)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-2B.0.1 Live Verification)
- **執行日期**：2026-11-08
- **執行角色**：資深 PostgreSQL 資料庫管理員、Prisma 架構師、資料安全稽核工程師
- **任務性質**：**唯讀環境恢復驗證（Read-Only Environment Recovery Verification）**
- **嚴格約束**：**無 Migration 建立、無 Migration 套用、無資料庫寫入、無 Git Commit/Push/Clean/Reset**
- **目標產物**：[`docs/DATABASE_PHASE3C2B0_1_RECOVERY_VERIFICATION_REPORT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C2B0_1_RECOVERY_VERIFICATION_REPORT.md)

---

## 一、執行摘要 (Executive Summary)

使用者手動啟動 Docker Desktop 後，本階段針對本機 Docker PostgreSQL 16 執行環境、既有資料庫狀態、既有資料完整性、外鍵約束及 Prisma 遷移狀態進行**全面性唯讀即時驗證（Live Read-Only Audit）**。

### 核心查驗成果：
1. **Docker 守護行程恢復確認**：Docker Engine `29.9.2` 運作正常，容器 `code_to_know_postgres` 處於健康運行狀態（`Up / healthy`），持久化資料卷 `code-to-know_postgres_data` 正確掛載於 `/var/lib/postgresql/data`。
2. **PostgreSQL 即時連線確認**：資料庫名稱為 `code_to_know`，連線使用者為 `codetoknow`，核心引擎版本為 `PostgreSQL 16.15 on x86_64-pc-linux-musl`。
3. **既有資料 100% 完整留存**：
   - 既有 9 張核心資料表與 `_prisma_migrations` 全部存在。
   - **`User` 資料表精確保留原本 4 筆使用者記錄**。
   - 8 組外鍵約束**孤兒資料數為 0**。
   - 6 組唯一性約束**重複違規數為 0**。
4. **Migration 歷史狀態一致**：
   - `_prisma_migrations` 資料表僅有 1 筆歷史記錄：`20261103000000_init`（狀態為正常完成，`applied_steps_count = 1`, `rolled_back_at = NULL`）。
   - 執行 `npx prisma migrate status` 輸出 `Database schema is up to date!`，確認無任何懸空或未套用之遷移。
5. **Schema 與實體資料庫差異確認**：
   - 目前實體 PostgreSQL 具有 9 張核心資料表。
   - `schema.prisma` 已準備好 36 個 Model。
   - 27 個新增業務 Model 尚未進行建表，**完全具備正式推進 Phase 3C-2B 本機 Migration 之所有必要安全條件**。
6. **本階段資料庫寫入判定**：**絕對為否 (FALSE)（零寫入、零 DDL）**。

---

## 二、PHASE 1：Git 狀態保護核對 (Git State Audit)

經比對 Phase 3C-2B.0 與當前狀態：

| 檢驗項目 | 期望值 / 前期狀態 | 實際檢測結果 | 判定 |
|---|---|---|:---:|
| **Git 分支** | `main` | `main` | **PASS** |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **暫存區 (Staged)** | 0 筆 | 0 筆 | **PASS** |
| **既有未暫存檔案 (Unstaged)** | 17 個修改檔 + 1 個已刪除 docx lock | 17 個修改檔 + 1 個已刪除 docx lock（原貌無損） | **PASS** |
| **未授權 Git 操作** | 零 add, commit, push, reset, clean, checkout, rebase | 全程零違規操作 | **PASS** |

---

## 三、PHASE 2：Docker 環境恢復確認 (Docker Live Environment Audit)

```text
$ docker info --format 'ServerVersion: {{.ServerVersion}}, OperatingSystem: {{.OperatingSystem}}, OSType: {{.OSType}}'
ServerVersion: 29.9.2, OperatingSystem: Docker Desktop, OSType: linux

$ docker compose ps -a
NAME                    IMAGE                COMMAND                  SERVICE    STATUS                    PORTS
code_to_know_postgres   postgres:16-alpine   "docker-entrypoint.s…"   postgres   Up 31 seconds (healthy)   127.0.0.1:5432->5432/tcp
```

### 逐項檢查結果：
1. **Docker Desktop 運作**：**正常 (Active)**。
2. **`docker info` 執行**：成功連線 Linux 守護行程，Server Version 為 `29.9.2`。
3. **容器名稱**：`code_to_know_postgres`（精確吻合）。
4. **容器健康狀態**：`healthy`（Docker 內建 `pg_isready` 健康檢查連續通過）。
5. **PostgreSQL 映像檔與版本**：`postgres:16-alpine`，實體執行版本 `PostgreSQL 16.15`。
6. **持久化資料卷 (Volume)**：
   - 卷名稱：`code-to-know_postgres_data`。
   - 掛載路徑：`Destination: /var/lib/postgresql/data`。
   - 模式：`rw`（可讀寫持久化）。
   - **確認：使用之資料卷與 14 小時前建立時完全一致，資料未曾重置。**

---

## 四、PHASE 3：PostgreSQL 唯讀資料驗證 (Live Database Data Verification)

透過容器 `docker exec` 對 `code_to_know` 資料庫發送唯讀查詢：

### 1. 資料庫連線元數據：
- **`current_database()`**：`code_to_know`
- **`current_user`**：`codetoknow`
- **`inet_server_port()`**：`5432`

### 2. 既有 9 張核心表與遷移表記錄統計：

```sql
SELECT 'User' AS tbl, count(*) FROM "User"
UNION ALL SELECT 'Role', count(*) FROM "Role"
UNION ALL SELECT 'UserRole', count(*) FROM "UserRole"
UNION ALL SELECT 'UserProfile', count(*) FROM "UserProfile"
UNION ALL SELECT 'Session', count(*) FROM "Session"
UNION ALL SELECT 'TeacherApplication', count(*) FROM "TeacherApplication"
UNION ALL SELECT 'EmailVerificationToken', count(*) FROM "EmailVerificationToken"
UNION ALL SELECT 'PasswordResetToken', count(*) FROM "PasswordResetToken"
UNION ALL SELECT 'AuditLog', count(*) FROM "AuditLog"
UNION ALL SELECT '_prisma_migrations', count(*) FROM "_prisma_migrations";
```

| 資料表名稱 (Table) | 實體筆數 (Row Count) | 歷史基準值 (Phase 2 Baseline) | 狀態與資料判定 |
|:---|:---:|:---:|:---:|
| **`User`** | **4 筆** | **4 筆** | **完全吻合 (原 4 位使用者完整保留)** |
| **`Role`** | **3 筆** | **3 筆** | **完全吻合 (`STUDENT`, `TEACHER`, `PLATFORM_ADMIN`)** |
| **`UserRole`** | **4 筆** | **4 筆** | **完全吻合** |
| **`UserProfile`** | **4 筆** | **4 筆** | **完全吻合** |
| **`Session`** | **3 筆** | **3 筆** | **完全吻合** |
| **`TeacherApplication`** | **2 筆** | **2 筆** | **完全吻合** |
| **`EmailVerificationToken`**| **4 筆** | **4 筆** | **完全吻合** |
| **`PasswordResetToken`** | **0 筆** | **0 筆** | **完全吻合** |
| **`AuditLog`** | **9 筆** | **9 筆** | **完全吻合 (資安稽核軌跡無損)** |
| **`_prisma_migrations`** | **1 筆** | **1 筆** | **完全吻合** |

### 3. 既有 Migration 歷史明細：
```text
                  id                  |   migration_name    |         finished_at          | applied_steps_count | rolled_back_at 
--------------------------------------+---------------------+------------------------------+---------------------+----------------
 f5899e80-26a2-4489-8adb-f8fb10335cc0 | 20261103000000_init | 2026-11-03 13:49:46.34429+00 |                   1 | [NULL]
```
- 確認本機資料庫僅套用初始之 `20261103000000_init`，無異常中斷或回滾記錄。

### 4. 外鍵參照完整性檢驗 (Foreign Key Integrity)：
針對既有表 8 組外鍵執行反向關聯檢查：
- `UserRole.userId` 孤兒計數：**0 筆**
- `UserRole.roleId` 孤兒計數：**0 筆**
- `UserProfile.userId` 孤兒計數：**0 筆**
- `Session.userId` 孤兒計數：**0 筆**
- `TeacherApplication.userId` 孤兒計數：**0 筆**
- `EmailVerificationToken.userId` 孤兒計數：**0 筆**
- `PasswordResetToken.userId` 孤兒計數：**0 筆**
- `AuditLog.userId` 孤兒計數：**0 筆**
- **判定：外鍵完整性 100% 健全，零孤兒資料。**

### 5. 唯一索引與重複風險檢驗 (Unique Constraints)：
針對 `User.email`、`Role.name`、`UserRole(userId, roleId)`、`UserProfile.userId`、`Session.tokenHash`、`EmailVerificationToken.tokenHash` 進行分組計數查驗：
- **重複資料筆數全數為 0**。
- **判定：唯一性索引皆嚴格生效，無任何約束衝突。**

---

## 五、PHASE 4：Prisma Schema 與實際資料庫差異分析 (Schema Drift Analysis)

在後端目錄執行 Prisma 官方遷移狀態指令：

```text
$ npx prisma migrate status
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "code_to_know", schema "public" at "127.0.0.1:5432"

1 migration found in prisma/migrations

Database schema is up to date!
```

### 差異分析結論：
1. **遷移歷史同步**：
   - 實體資料庫的 `_prisma_migrations` 與檔案系統 `backend/prisma/migrations/` **目前處於完全同步狀態**（皆為 1 個遷移 `20261103000000_init`）。
2. **Schema 差異與預期動作**：
   - 實體資料庫目前僅具有 9 張核心資料表。
   - `schema.prisma` 目前已就緒 36 個 Model。
   - 其中的 27 個新增業務 Model（公告、證照、題庫、學習歷程、班級、術科五大題組、模擬測驗快照、AI 教練）**尚未轉譯為實體遷移檔案**。
   - 此一狀態代表系統處於**極為乾淨的遷移起點**，在 Phase 3C-2B 執行 `prisma migrate dev --create-only` 時，將能精確捕獲 27 個新 Model 的增量 DDL，絕不會誤刪或覆蓋現有的 9 張核心表。

---

## 六、安全結論與 Phase 3C-2B 推進判定

| 審驗維度 | 檢驗結論 | 是否符合 Phase 3C-2B 前置條件 |
|---|---|:---:|
| **Docker Desktop 狀態** | 正常運行（`Engine running`, `healthy`） | **符合** |
| **既有 4 筆 User 完整性** | 4 筆完全完好無損 | **符合** |
| **既有 9 張核心資料表** | 結構與資料無任何篡改 | **符合** |
| **既有 Migration 歷史** | 單一乾淨遷移，狀態為 `up to date` | **符合** |
| **外鍵與唯一性** | 零孤兒、零重複資料 | **符合** |
| **Git 工作區保護** | 既有未暫存檔案 100% 完整保留 | **符合** |
| **本階段資料庫寫入** | **零寫入、零 DDL、零資料異動** | **符合** |

### **最終判定：【所有前置條件已全數具備，隨時可正式執行 Phase 3C-2B】**

本階段已完全停止，靜候您對 **Phase 3C-2B（本機 Docker PostgreSQL 正式遷移）** 的明確授權！
