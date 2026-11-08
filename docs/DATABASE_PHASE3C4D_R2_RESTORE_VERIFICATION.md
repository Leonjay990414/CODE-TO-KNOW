# CODE TO KNOW (碼上學)
# PHASE 3C-4D-R2：Supabase 備份還原至 PostgreSQL 17 隔離沙盒與結構完整性驗收報告
# (Supabase Backup Restore to Local PG17 Sandbox & Structural Integrity Verification Report)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-4D-R2 Official Deliverable)
- **執行日期**：2026-11-08
- **審核團隊**：PostgreSQL DBA、資料庫還原工程師、獨立資料完整性審查團隊
- **目標沙盒容器**：`code_to_know_pg17_restore_sandbox` (Port: `127.0.0.1:5433`)
- **目標測試資料庫**：`code_to_know_cloud_restore_test`
- **還原專屬帳號**：`codetoknow_restore`
- **備份來源檔案**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758\code_to_know_supabase_prod.dump`
- **備份 SHA-256**：`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`
- **任務性質**：**OFFLINE DATABASE RESTORE & AUTOMATED VERIFICATION (本機隔離沙盒還原與自動化結構驗收，零雲端連線、零既有庫影響)**
- **最終驗收結論**：**`PASS — SUPABASE BACKUP RESTORE AND STRUCTURE VERIFICATION SUCCESSFUL`**

---

## 執行摘要 (Executive Summary)

依據專案最高安全指引與使用者正式授權，審查團隊在嚴格通過「R1 強制驗收閘門」、「備份完整性驗證」及「目標庫純淨度確認」前三道防線後，成功將 Supabase 第一次正式雲端備份完整還原至本機 PostgreSQL 17 隔離沙盒資料庫 `code_to_know_cloud_restore_test`，並完成多維度唯讀結構自動化驗收。

### 核心驗收指標全數達成：
1. **37 張資料表 100% 齊全**：36 張業務資料表 + 1 張 `_prisma_migrations` 表全部精確建立。
2. **Migration 歷史 100% 完整**：`20261103000000_init` 與 `20261108000000_add_business_models` 兩筆紀錄完整還原，Checksum 與雲端完全一致。
3. **47 條外鍵關聯 (Foreign Keys) 100% 對齊**：關鍵級聯規則 `ExamAnswerSnapshot.questionId -> Question.id` 確實為 `ON DELETE SET NULL`。
4. **133 個索引 (Indexes) 與 64 個唯一索引 100% 建立**：完全符合 Prisma Schema 規格。
5. **枚舉型別 (Enum)**：`AnnouncementStatus`（`DRAFT`, `PUBLISHED`, `ARCHIVED`）完整建立。
6. **檢查條件 (Check Constraint)**：`ClassAssignment_target_xor_check` 互斥條件正確還原。
7. **資料筆數 (Row Counts)**：36 張業務表均為 0 筆（乾淨結構），`_prisma_migrations` 恰好 2 筆。
8. **三零安全底線貫徹**：**零 Supabase 雲端連線、零 PostgreSQL 16 既有環境干擾、零付費開銷**。

---

## 一、第一關：R1 強制驗收閘門複查結果

在執行任何還原操作前，審查團隊對 PHASE 3C-4D-R1 成果執行嚴格唯讀核對：

| 檢驗項目 | 規範標準 | 實測狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **R1 驗收報告存在性** | `docs/DATABASE_PHASE3C4D_R1_LOCAL_PG17_SANDBOX_SETUP.md` 存在 | 實體存在 | **PASS** |
| **R1 報告審查結論** | 必須為 `PASS — LOCAL POSTGRESQL 17 RESTORE SANDBOX READY` | 完全相符 | **PASS** |
| **沙盒容器運行狀態** | `code_to_know_pg17_restore_sandbox` running | running (Up) | **PASS** |
| **映像檔 Digest 鎖定** | `sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac` | 100% 一致 | **PASS** |
| **PostgreSQL 版本** | PostgreSQL 17.11 (Alpine 15.2.0) | 17.11 | **PASS** |
| **通訊埠口綁定** | 僅綁定 `127.0.0.1:5433` | 僅 `127.0.0.1:5433` | **PASS** |
| **專屬 Volume 與掛載** | `code_to_know_pg17_restore_sandbox_data` -> `/var/lib/postgresql/data` | 正確掛載 | **PASS** |
| **目標資料庫存在性** | `code_to_know_cloud_restore_test` | 存在且編碼 UTF8 | **PASS** |
| **專屬帳號連線能力** | `codetoknow_restore` 可正常登入 | TCP 5433 登入成功 | **PASS** |
| **還原前資料庫純淨度** | 目標庫為空白（0 表） | 表格數為 0，無髒資料 | **PASS** |
| **既有 PG 16 容器隔離** | `code_to_know_postgres:5432` 正常運作 | Up 12 hours (healthy) | **PASS** |
| **既有開發庫完整性** | `code_to_know` (37 表) 與 `code_to_know_restore_test` (10 表) 未受改動 | 表格數完全不變 | **PASS** |

---

## 二、第二關：正式備份檔案完整性與 TOC 檢驗

- **正式備份路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758\code_to_know_supabase_prod.dump`
- **實體大小**：`505,249 bytes`
- **獨立重算 SHA-256**：
  `08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3` (100% 相符)
- **`.sha256` 記錄檔比對**：完全一致。
- **`backup_info.json` 解析**：格式正確，無敏感帳密洩漏。
- **PostgreSQL 17 `pg_restore --list` 解析**：
  - 格式：PostgreSQL Custom Format (-Fc)
  - TOC 項目總數：926
  - 公共表格數：37
  - 包含 `AnnouncementStatus` 枚舉與 2 組 Migration 數據。

---

## 三、第三關：目標資料庫還原前最後確認

於還原發起前 10 秒發出唯讀探針：
- **連線目標**：`127.0.0.1:5433` (Localhost)
- **連線使用者**：`codetoknow_restore`
- **目標資料庫**：`code_to_know_cloud_restore_test`
- **實測表格數**：`0`
- **建立臨時表測試**：`CREATE TEMP TABLE ... DROP TABLE` 測試通過，確認具備足夠 DDL 權限。

---

## 四、第四關：正式還原執行紀錄

### 1. 還原命令規格與安全參數
還原操作透過專用沙盒容器以用戶 `codetoknow_restore` 執行，憑證自安全目錄記憶體注入，命令列參數無明文密碼：
```bash
pg_restore -v --no-owner --no-acl -h host.docker.internal -p 5433 -U codetoknow_restore -d code_to_know_cloud_restore_test /backups/code_to_know_supabase_prod.dump
```
- **安全參數說明**：
  - `--no-owner --no-acl`：防止還原過程中因缺乏 Supabase 雲端專用系統角色（如 `supabase_admin`、`pgbouncer`）而發生權限拒絕，確保所有業務物件平穩由 `codetoknow_restore` 接管。
  - 嚴格未使用 `--clean`、`--if-exists` 或 `--create`。

### 2. 還原執行狀態
- **還原起始時間**：2026-11-08 22:33:55 (Local)
- **完成時間**：2026-11-08 22:33:59 (耗時約 4 秒)
- **還原結果**：
  所有公共表格、資料、索引、外鍵與枚舉全數建立成功。
  原生 Stderr 報告僅標記 `errors ignored on restore: 14`，經逐行審查，該 14 項錯誤全部屬於 Supabase 雲端專用擴充套件（`supabase_vault`）與雲端內部事件觸發器（`issue_graphql_placeholder` 等），**對本機核心業務結構還原成功率為 100%**。

---

## 五、第五關：結構與資料自動化驗收

審查團隊於還原後以唯讀 SQL 進行深層結構審查：

### A. 37 張資料表完整清單驗收 (`[PASS]`)
`public` Schema 總表格數正好為 **37 張**：
`AIChatMessage`, `AIChatSession`, `Announcement`, `AnnouncementRead`, `AuditLog`, `Certification`, `CertificationEnrollment`, `Class`, `ClassAssignment`, `ClassEnrollment`, `EmailVerificationToken`, `ExamAnswerSnapshot`, `ExamAttempt`, `ExamPaper`, `PasswordResetToken`, `PracticalProgress`, `PracticalStep`, `PracticalStepProgress`, `PracticalTask`, `Question`, `QuestionBookmark`, `QuestionOption`, `QuestionTag`, `QuestionTagRelation`, `Role`, `Session`, `StudentWeaknessAnalysis`, `StudyTimeLog`, `Subject`, `TeacherApplication`, `TeacherProfile`, `UnitProgress`, `User`, `UserProfile`, `UserRole`, `WrongQuestionRecord`，以及 `_prisma_migrations`。

### B. Migration 歷史完整性驗收 (`[PASS]`)
查詢 `_prisma_migrations` 表格，確認包含兩筆正式記錄：
1. **`20261103000000_init`**：
   - Checksum：`ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29`
   - applied_steps_count：`1`
   - finished_at：`2026-11-08 07:58:55.55898+00`
   - rolled_back_at：`NULL`
2. **`20261108000000_add_business_models`**：
   - Checksum：`c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c`
   - applied_steps_count：`1`
   - finished_at：`2026-11-08 07:59:29.362019+00`
   - rolled_back_at：`NULL`

### C. 47 條外鍵關聯驗收 (`[PASS]`)
經 `information_schema.referential_constraints` 查詢，確認 **47 條 Foreign Keys** 100% 存在。
- **關鍵約束檢驗**：
  `ExamAnswerSnapshot_questionId_fkey` (`ExamAnswerSnapshot.questionId -> Question.id`)
  其 `delete_rule` 實測為 **`SET NULL`**，完全符合架構規範。

### D. 133 個索引驗收 (`[PASS]`)
經 `pg_indexes` 查詢，`public` Schema 索引總數正好為 **133 個**，包含所有複合查詢索引、主鍵索引與外鍵輔助索引。

### E. 枚舉型別 (Enum) 驗收 (`[PASS]`)
經 `pg_enum` 查詢，枚舉型別 `AnnouncementStatus` 完整包含 3 項排序值：
1. `DRAFT` (enumsortorder: 1)
2. `PUBLISHED` (enumsortorder: 2)
3. `ARCHIVED` (enumsortorder: 3)

### F. Check Constraint 互斥條件驗收 (`[PASS]`)
經 `pg_constraint` 查詢：
- **約束名稱**：`ClassAssignment_target_xor_check`
- **實體規則定義**：
  ```sql
  CHECK ((num_nonnulls("examPaperId", "practicalTaskId") = 1))
  ```
  嚴格要求作業指派對象（試卷或實作任務）必須且只能二選一。

### G. 37 張資料表資料筆數逐表檢驗 (`[PASS]`)
經動態 SQL 逐表查詢，確認目前業務資料表全部為純淨初始狀態：
- **36 張業務資料表**：筆數全數為 **`0` 筆**。
- **`_prisma_migrations` 表**：筆數恰好為 **`2` 筆**。

### H. Unique Constraints 唯一性限制驗收 (`[PASS]`)
經 `pg_indexes` 查詢，包含主鍵與業務唯一鍵之 `UNIQUE INDEX` 總數為 **64 個**（包含 `User_email_key`、`Certification_code_key` 等 27 項業務唯一鍵與 37 項主鍵）。

---

## 六、第六關：資料庫隔離再次驗證

還原完成後，立即對既有環境進行全量比對，確認零側漏：

| 隔離查核維度 | 預期基準 | 還原後實測狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **PG 17 沙盒狀態** | `code_to_know_pg17_restore_sandbox` Up | Up (5433 埠號正常) | **PASS** |
| **PG 17 專屬 Volume** | `code_to_know_pg17_restore_sandbox_data` | 獨立存放還原數據 | **PASS** |
| **PG 16 容器健康** | `code_to_know_postgres` Up (healthy) | Up 12 hours (healthy) | **PASS** |
| **PG 16 埠號綁定** | `127.0.0.1:5432` | 保持不變，無任何衝突 | **PASS** |
| **本機開發庫 `code_to_know`** | 37 張表 | 37 張表，100% 保持原樣 | **PASS** |
| **基準庫 `code_to_know_restore_test`** | 10 張表 | 10 張表，100% 保持原樣 | **PASS** |
| **雲端隔離性** | 零連線 Supabase | 100% 離線還原，零雲端封包 | **PASS** |
| **零其他改動** | 無 Migration、無 Seed、無 Git 提交 | 零其他操作 | **PASS** |

---

## 七、Git 與版本庫狀態

- **分支 (Branch)**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **工作目錄**：未執行任何 `git add/commit/push/reset/clean`，既有狀態原封不動。

---

## 八、驗收最終結論

```text
================================================================================
  驗收結論：PASS — SUPABASE BACKUP RESTORE AND STRUCTURE VERIFICATION SUCCESSFUL
  (Supabase 雲端備份於本機 PG17 沙盒還原大獲成功，結構與資料完整性驗收 100% 通過)
================================================================================
```

### 遵守安全停機條件：
本階段所有還原與驗收任務已全數完成。
- **未進入 R3**。
- **未執行正式部署**。
- **未修改 Supabase 雲端**。
- **未刪除備份檔或 PG17 沙盒**。
- 全面停止，靜候專案主管與使用者後續指示。
