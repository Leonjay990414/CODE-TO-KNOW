# CODE TO KNOW（碼上學）
# PHASE 3C-2C.1：正式 PostgreSQL 備份建立與獨立還原驗證報告

- **報告日期**：2026-11-08
- **執行階段**：PHASE 3C-2C.1（正式 PostgreSQL 備份建立與獨立還原驗證）
- **審查角色**：PostgreSQL 資料庫管理工程師、Docker 資料庫部署工程師、資料備份與災難復原工程師、資料完整性稽核工程師
- **任務性質**：AUTHORIZED BACKUP & ISOLATED RESTORE TEST（使用者明確授權之實體備份與隔離還原驗證）
- **目前 Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（分支：`main`）
- **原始資料庫環境**：Docker PostgreSQL 容器 `code_to_know_postgres`（127.0.0.1:5432 / 資料庫：`code_to_know`）
- **隔離還原暫存庫**：`code_to_know_restore_test`（擁有者：`codetoknow`）

---

## 一、執行摘要 (Executive Summary)

本階段遵照使用者明確授權，圓滿完成了 **正式 PostgreSQL 實體備份建立** 與 **隔離暫存資料庫還原驗證演練**。所有操作嚴格落實防禦性原則，達成下列關鍵指標：

1. **實體備份建立成功且存放於專案外部**：
   - 採用 PostgreSQL Custom Format (`.dump`) 完整導出原始資料庫 `code_to_know`。
   - 備份檔存放於 Git 工作樹外部安全目錄：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`。
   - 檔案大小 **25,685 bytes**，經 SHA-256 雙重校驗（容器內與本機端）完全一致（`2DB27F8B...`）。
2. **目錄結構 TOC 完整性檢驗通過**：
   - `pg_restore -l` 成功讀取 64 個 TOC 實體項目，包含 9 張核心表之資料定義（DDL）、表資料（TABLE DATA）、主鍵、唯一鍵、索引與外鍵約束，二進位無損。
3. **獨立暫存庫隔離建立與還原演練 100% 成功**：
   - 在未干擾原始庫的前提下，使用 `template0` 建立全新乾淨暫存資料庫 `code_to_know_restore_test`。
   - 使用 `pg_restore --single-transaction --exit-on-error` 成功將備份還原至暫存庫（退出碼 0，無任何警告或錯誤）。
4. **雙庫資料一致性比對 100% 吻合**：
   - 暫存庫還原後，9 張核心表之資料筆數與原始庫完全一致（User: 4, Role: 3, UserRole: 4, UserProfile: 4, Session: 3, TeacherApplication: 2, EmailVerificationToken: 4, PasswordResetToken: 0, AuditLog: 9）。
   - 暫存庫外鍵孤兒數：**0**；唯一鍵衝突數：**0**；失敗 Migration 數：**0**。
5. **原始資料庫零變動確認**：
   - 原始資料庫 `code_to_know` 保持 10 張表（9 核心表 + 1 遷移表），4 筆 User 完好，未執行任何 DDL/DML，亦未套用任何新 Migration。

---

## 二、任務 A：執行前最後安全檢查

在建立備份前，執行了完整的實體環境與權限檢驗：

| 檢驗項目 | 檢驗標準 | 實際查詢結果 | 評定 |
|---|---|---|---|
| **Docker Engine** | 正常運作 | 正常 (Active) | [PASS] |
| **容器健康狀態** | `healthy` | `healthy` (0 failing streak) | [PASS] |
| **PostgreSQL 核心版本** | 16.15 | `PostgreSQL 16.15 on x86_64-pc-linux-musl (64-bit)` | [PASS] |
| **原始資料庫名稱** | `code_to_know` | `code_to_know` | [PASS] |
| **原始資料庫大小** | 記錄當前體量 | `8375 kB` (~8.38 MB) | [PASS] |
| **原始資料庫連線數** | 無外部併發 | `1`（僅當前唯讀查詢連線） | [PASS] |
| **使用者資料庫建立權限** | `rolcreatedb = true` | `t` (True) | [PASS] |
| **暫存資料庫預先檢查** | `code_to_know_restore_test` 必須不存在 | `restore_test_db_exists = 0` (確實不存在) | [PASS] |
| **外部備份目錄** | 存在且可寫入 | 外部路徑建立完成，具有完整寫入權限 | [PASS] |
| **磁碟可用空間** | 大於 10 MB | 主機可用 619.5 GB，容器可用 953.4 GB | [PASS] |

---

## 三、任務 B：正式備份建立與檔案完整性驗證

### 3.1 備份目錄與執行環境

- **實體存放路徑**：
  `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`
- **容器暫存路徑**：
  `/tmp/code_to_know_pre_migration.dump`
- **備份指令規範**（容器原生執行，終端日誌無明文密碼）：
  ```bash
  docker exec code_to_know_postgres pg_dump -U codetoknow -d code_to_know -F c -b -v -f /tmp/code_to_know_pre_migration.dump
  ```
- **工作樹隔離**：
  備份檔直接存放於專案外部，Git 工作目錄未產生任何 untracked 檔案，杜絕二進位檔案誤入版本控制之風險。

### 3.2 備份檔案實體特徵與雜湊

| 鑑識指標 | 容器內實體檔案 (`/tmp/...`) | Windows 本機外部實體檔案 | 一致性比對 |
|---|---|---|---|
| **檔案大小** | 25,685 bytes | 25,685 bytes | **100% 相同** |
| **檔案格式** | PostgreSQL Custom Format (`-F c`, gzip 壓縮) | PostgreSQL Custom Format (`-F c`) | **100% 相同** |
| **SHA-256 數位指紋** | `2db27f8b817179d3c777bc7109bb95207295e5be8343bf0741715828e3372085` | `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085` | **完全一致 [PASS]** |
| **備份產出時間** | 2026-11-08 03:40:28 UTC (11:40:28 本地時間) | 2026-11-08 03:40:28 UTC | [PASS] |

### 3.3 `pg_restore -l` 目錄結構 (TOC) 驗證

執行 `docker exec code_to_know_postgres pg_restore -l /tmp/code_to_know_pre_migration.dump`：
- **TOC 總項目數**：64 筆。
- **包含資料定義 (TABLE)**：`AuditLog`, `EmailVerificationToken`, `PasswordResetToken`, `Role`, `Session`, `TeacherApplication`, `User`, `UserProfile`, `UserRole`, `_prisma_migrations`。
- **包含表資料 (TABLE DATA)**：全數 10 張表均包含對應的資料段（Dump ID 3543 至 3552）。
- **包含約束與索引**：完整包含 10 個主鍵、22 個索引、8 條外鍵約束。
- **驗證結論**：備份檔案結構完整，無任何二進位損毀或缺失段落。[PASS]

---

## 四、任務 C：獨立暫存資料庫建立

依照隔離測試標準程序：

1. **防覆蓋預檢**：確認 `code_to_know_restore_test` 先前確實不存在。
2. **乾淨樣板建立**：
   ```sql
   CREATE DATABASE code_to_know_restore_test WITH TEMPLATE template0 OWNER codetoknow;
   ```
   執行結果：`CREATE DATABASE`（成功）。
3. **連線與目標二次確認**：
   在還原前查詢連線資訊：
   ```sql
   SELECT current_database(), current_user;
   ==> code_to_know_restore_test | codetoknow
   ```
   **確證連線目標為暫存庫，而非正式庫 `code_to_know`。** [PASS]

---

## 五、任務 D：獨立還原執行結果

執行非破壞性、單一事務隔離還原：

```bash
docker exec code_to_know_postgres pg_restore -U codetoknow -d code_to_know_restore_test --exit-on-error --single-transaction -v /tmp/code_to_know_pre_migration.dump
```

- **執行參數說明**：
  - 未使用 `--clean`（暫存庫原為乾淨庫，無需 DROP）。
  - `--exit-on-error`：保證一旦發生任何錯誤立即終止。
  - `--single-transaction`：保證原子性，所有物件於同一交易內建立完成。
- **還原日誌核實**：
  - 依序完成 10 張 TABLE 建立。
  - 依序完成 10 張 TABLE 資料導入。
  - 依序完成主鍵、索引及外鍵約束綁定。
- **退出碼**：**0**（成功，無任何錯誤）。[PASS]

---

## 六、任務 E：備份還原完整性驗證 (Data Integrity Comparison)

### 6.1 原始庫與還原庫資料筆數全量比對表

| 資料表名稱 (Table Name) | 原始資料庫 (`code_to_know`) | 還原暫存庫 (`code_to_know_restore_test`) | 差異 (Delta) | 比對結果 |
|---|:---:|:---:|:---:|:---:|
| `User` | **4** | **4** | 0 | [PASS] 100% 吻合 |
| `Role` | **3** | **3** | 0 | [PASS] 100% 吻合 |
| `UserRole` | **4** | **4** | 0 | [PASS] 100% 吻合 |
| `UserProfile` | **4** | **4** | 0 | [PASS] 100% 吻合 |
| `Session` | **3** | **3** | 0 | [PASS] 100% 吻合 |
| `TeacherApplication` | **2** | **2** | 0 | [PASS] 100% 吻合 |
| `EmailVerificationToken` | **4** | **4** | 0 | [PASS] 100% 吻合 |
| `PasswordResetToken` | **0** | **0** | 0 | [PASS] 100% 吻合 |
| `AuditLog` | **9** | **9** | 0 | [PASS] 100% 吻合 |
| `_prisma_migrations` | **1** | **1** | 0 | [PASS] 100% 吻合 |

### 6.2 4 位真實使用者還原核驗

在暫存庫執行查詢核對：
1. `45e087b3...`：`test_student_1793714104338@codetoknow.edu`（整合測試學生，ACTIVE）
2. `56265935...`：`test_student_1793714656040@codetoknow.edu`（整合測試學生，ACTIVE）
3. `5c66b177...`：`ak990414@apps.ntpc.edu.tw`（莊永婕，ACTIVE）
4. `312e927b...`：`student_1793976435481@example.com`（實測學生小明，ACTIVE）
- **核驗結論**：4 位使用者之 ID、Email、顯示名稱、狀態與還原前完全一致。[PASS]

### 6.3 資料關聯性與約束驗證

在暫存庫 `code_to_know_restore_test` 執行完整約束檢查：
- **外鍵孤兒檢驗 (FK Orphans)**：
  - `UserRole -> User`：0 筆
  - `UserRole -> Role`：0 筆
  - `UserProfile -> User`：0 筆
  - `Session -> User`：0 筆
  - `TeacherApplication -> User`：0 筆
  - `EmailVerificationToken -> User`：0 筆
  - **孤兒總數：0 筆 [PASS]**
- **唯一鍵衝突檢驗 (Unique Collisions)**：
  - `User.email` 重複數：0 筆
  - `Role.name` 重複數：0 筆
  - `UserRole (userId, roleId)` 重複數：0 筆
  - `UserProfile.userId` 重複數：0 筆
  - `Session.tokenHash` 重複數：0 筆
  - **衝突總數：0 筆 [PASS]**
- **遷移表記錄完整性**：
  - 暫存庫中 `_prisma_migrations` 僅含原有的 `20261103000000_init` 記錄，Checksum 保持 `2185e3a0...`，失敗記錄數為 0。
  - 未包含任何未授權的新遷移標記。[PASS]

### 6.4 還原後備份檔指紋二次校驗

在完成還原演練後，對 Windows 存放之備份檔重新計算 SHA-256：
- **初次導出 Hash**：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
- **還原後二次 Hash**：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
- **判定**：備份檔案在整個還原測試過程中未被更動，數位指紋一致。[PASS]

---

## 七、任務 F：原始資料庫保護現場核證

在完成暫存庫還原測試後，切換回原始資料庫 `code_to_know` 執行現場盤點：

```sql
SELECT 
  current_database(),
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT count(*) FROM "User") as user_count,
  (SELECT count(*) FROM "Role") as role_count,
  (SELECT count(*) FROM "Session") as session_count,
  (SELECT count(*) FROM "AuditLog") as audit_count,
  (SELECT count(*) FROM "_prisma_migrations") as migration_count;
```

### 查詢結果

```text
 current_database | total_tables | user_count | role_count | session_count | audit_count | migration_count 
------------------+--------------+------------+------------+---------------+-------------+-----------------
 code_to_know     |           10 |          4 |          3 |             3 |           9 |               1
(1 row)
```

- **結論**：原始資料庫 `code_to_know` 依然維持 10 張表、4 筆使用者、3 筆角色、3 筆會話、9 筆稽核記錄及 1 筆遷移歷史，**未受任何寫入干擾，100% 原狀保全**。[PASS]

---

## 八、暫存資料庫與備份檔案保存狀態宣告

遵照使用者操作規則：
1. **實體備份檔案**：已完好保存在 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`。
2. **容器暫存備份**：`/tmp/code_to_know_pre_migration.dump` 保留原狀，未刪除。
3. **暫存還原庫**：`code_to_know_restore_test` **完整保留在 Docker PostgreSQL 容器內**，供使用者隨時查驗，**未自行執行 DROP**。

---

## 九、Git 狀態核實

- **目前分支**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **工作目錄純淨度**：備份檔案存放在專案目錄外部，Git 工作目錄未產生任何暫存備份檔案。
- **未執行 Git 寫入**：零 commit、零 push、零 clean、零 reset。

---

## 十、最終風險與驗證矩陣

| 檢驗維度 | 評定狀態 | 關鍵證據 |
|---|:---:|---|
| **原始資料庫安全性** | **[PASS]** | 原始庫 `code_to_know` 現場核查未受干擾，4 位 User 完好 |
| **備份檔案建立** | **[PASS]** | 產出 25,685 bytes Custom Format dump，SHA-256 已雙重校驗 |
| **備份目錄獨立性** | **[PASS]** | 存放於專案外部，無誤入 Git 之風險 |
| **TOC 結構完整性** | **[PASS]** | `pg_restore -l` 64 筆項目解析通過，DDL 與 TABLE DATA 完備 |
| **獨立還原演練** | **[PASS]** | 暫存庫 `code_to_know_restore_test` 還原成功，退出碼 0 |
| **資料筆數一致性** | **[PASS]** | 9 表筆數 100% 吻合，4 位 User 完整 |
| **資料關聯約束性** | **[PASS]** | 0 孤兒外鍵、0 唯一鍵衝突、0 失敗遷移 |
| **備份指紋不可變性** | **[PASS]** | 還原前後 SHA-256 吻合 |
| **暫存庫狀態保存** | **[PASS]** | 遵照規範保留暫存庫，未擅自 DROP |
| **正式套用授權** | **[NOT AUTHORIZED]** | 本階段僅限備份與還原驗證，未獲套用授權，嚴禁部署 |

---

## 十一、最終結論與停止宣告

> **【最終結論】**  
> **CODE TO KNOW 專案已成功建立一份可讀取、結構完整、經隔離環境實際還原驗證 100% 一致之 PostgreSQL 實體備份。**  
> **這份備份具備最高信任度，可作為未來正式執行 Migration 套用時最堅實的災難復原防線。**

依據安全規範，本階段任務已全部達成並立即停止：
- 未套用 Migration。
- 未執行 resolve。
- 未修改原始資料庫。
- 未刪除暫存資料庫。
- 未修改 Schema 或代碼。
- 未執行 Git 操作。

靜候使用者審查本報告與下一步正式套用之授權指示！
