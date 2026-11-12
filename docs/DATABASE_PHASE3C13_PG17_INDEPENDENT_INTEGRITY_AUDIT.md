# CODE TO KNOW｜Phase 3-C-13：PG17.11 還原後獨立完整性查核報告

- **查核階段**：Phase 3-C-13：PG17.11 還原後獨立完整性查核
- **查核日期**：2026-11-11 19:02~19:05 (+08:00)（UTC `2026-11-11T11:02Z~11:05Z`）
- **查核性質**：**100% 唯讀獨立資料庫查核**（僅對 `code_to_know_pg17_restore_sandbox` / `code_to_know_c2kb_prod_restore_clean_v2` 執行唯讀查詢，並以記憶體串流方式比對原始 `.dump`；未執行任何 `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`/`CREATE`/`ALTER`/`DROP`、未執行 Migration、未修改 `wal_level`、未連線 Supabase、未接觸 PG16 開發資料庫、未讀取密碼或金鑰、未執行 Git 寫入、未修改任何程式碼或設定檔）
- **查核對象**：`code_to_know_pg17_restore_sandbox`（`127.0.0.1:5433`）內資料庫 `code_to_know_c2kb_prod_restore_clean_v2`（大小 `12 MB`，Owner `codetoknow_restore`）

---

## 一、獨立查核項目明細（A ~ H）

> 註：依查核規範，以下每一項均獨立列出查詢方式、實測結果、預期結果、單項判定與是否存在無法獨立驗證之項目，絕不以 `pg_restore Exit Code 0` 推論整體 100% 通過。

---

### A. 資料表與主鍵（判定：**`PASS`**）

- **查詢方式**：透過 `docker exec ... psql -d code_to_know_c2kb_prod_restore_clean_v2` 唯讀查詢 `information_schema.tables`（`table_schema = 'public' AND table_type = 'BASE TABLE'`）及 `information_schema.table_constraints`（`constraint_type = 'PRIMARY KEY'`）。
- **預期結果**：`public` 資料表總數 `37`、每張表均具 Primary Key、主鍵總數 `37`、缺少主鍵之資料表數 `0`。
- **實際結果**：`public` 資料表實測共 **`37`** 張，**`37 / 37`** 均為 `has_pk = t`，缺少主鍵數為 **`0`**：

| # | 資料表名稱 | Primary Key (`has_pk`) | # | 資料表名稱 | Primary Key (`has_pk`) |
|---:|---| :---: |---:|---| :---: |
| 1 | `AIChatMessage` | `t` | 20 | `Question` | `t` |
| 2 | `AIChatSession` | `t` | 21 | `QuestionBookmark` | `t` |
| 3 | `Announcement` | `t` | 22 | `QuestionOption` | `t` |
| 4 | `AnnouncementRead` | `t` | 23 | `QuestionTag` | `t` |
| 5 | `AuditLog` | `t` | 24 | `QuestionTagRelation` | `t` |
| 6 | `Certification` | `t` | 25 | `Role` | `t` |
| 7 | `CertificationEnrollment` | `t` | 26 | `Session` | `t` |
| 8 | `Class` | `t` | 27 | `StudentWeaknessAnalysis` | `t` |
| 9 | `ClassAssignment` | `t` | 28 | `StudyTimeLog` | `t` |
| 10 | `ClassEnrollment` | `t` | 29 | `Subject` | `t` |
| 11 | `EmailVerificationToken` | `t` | 30 | `TeacherApplication` | `t` |
| 12 | `ExamAnswerSnapshot` | `t` | 31 | `TeacherProfile` | `t` |
| 13 | `ExamAttempt` | `t` | 32 | `UnitProgress` | `t` |
| 14 | `ExamPaper` | `t` | 33 | `User` | `t` |
| 15 | `PasswordResetToken` | `t` | 34 | `UserProfile` | `t` |
| 16 | `PracticalProgress` | `t` | 35 | `UserRole` | `t` |
| 17 | `PracticalStep` | `t` | 36 | `WrongQuestionRecord` | `t` |
| 18 | `PracticalStepProgress` | `t` | 37 | `_prisma_migrations` | `t` |
| 19 | `PracticalTask` | `t` | | | |

- **無法獨立驗證項目**：無（37 張 `public` 資料表皆已直接實測）。

---

### B. 資料筆數（37 表逐一實際 `COUNT(*)`）（判定：**`PASS`（`public` 37 表）；非 `public` Schema 資料列數：`無法獨立比對`**）

- **查詢方式**：
  1. 對已還原資料庫全部 37 張 `public` 資料表逐一執行實際 `SELECT '<tbl>', COUNT(*)::bigint FROM public."<tbl>"`（未使用 `n_live_tup` 估算值）。
  2. 以 PG17 `pg_restore --data-only --schema=public -f -` 唯讀串流解析原始明文備份 `code_to_know_supabase_prod.dump`（`SHA-256` `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`），僅統計各 `COPY public."<table>" (...) FROM stdin;` 區塊內資料列數至 `\.`（未輸出任何資料列內容）。
- **預期結果**：`_prisma_migrations` 為 `2` 筆；其餘 `36` 張業務資料表實測筆數須與原始備份完全一致。
- **實際結果**：**`37 / 37` 全數吻合 (`MISMATCHES = 0`)**：
  - `_prisma_migrations`：還原庫實際 `COUNT(*)` = **`2`**；原始 `.dump` `COPY` 列數 = **`2`**（完全一致）。
  - 其餘 **`36`** 張業務資料表（`AIChatMessage` 至 `WrongQuestionRecord`，全部具名如上表 #1~#36）：還原庫實際 `COUNT(*)` 均為 **`0`**；原始 `.dump` 內對應 36 個 `COPY public."<tbl>"` 區塊資料列數亦均為 **`0`**（完全一致）。
- **無法獨立驗證項目**：
  - **非 `public` Schema（如 `auth`、`storage`、`realtime` 等共 `40` 張資料表）** 本階段未逐表執行 `COUNT(*)` 與原始備份 `COPY` 列數比對，亦未開啟 Vault（已排除），故**非 `public` Schema 資料筆數標示為「無法獨立比對」**（不列入 `public` 37 表一致宣稱內）。

---

### C. 外鍵與約束（判定：**`PASS`**）

- **查詢方式**：查詢 `pg_constraint`（`connamespace = 'public'`）之 `contype`、`convalidated`、目標表 `confrelid` 存在性，並檢查 `pg_index` 非主鍵唯一索引及 `pg_trigger` 啟用狀態。
- **預期結果**：外鍵總數 `47`、未驗證外鍵 `0`、所有外鍵參照目標均存在、PK/UNIQUE/CHECK 約束完整、無孤立或異常約束。
- **實際結果**：
  - **外鍵約束 (`contype = 'f'`)**：總數 **`47`**、`validated_fks = 47`、**`unvalidated_fks = 0`**、**`missing_target_fks = 0`**（所有參照目標表皆存在於系統目錄）。
  - **主鍵約束 (`contype = 'p'`)**：總數 **`37`**，全數 `convalidated = t`。
  - **檢查約束 (`contype = 'c'`)**：總數 **`1`**（`ClassAssignment` 上之 `ClassAssignment_target_xor_check`：`CHECK ((num_nonnulls("examPaperId", "practicalTaskId") = 1))`，`convalidated = t`）。
  - **唯一性約束 (`UNIQUE`)**：`pg_constraint` 中 `contype = 'u'` 為 `0`，符合 Prisma 遷移規範——所有欄位唯一性皆實作為 `public` 上 **`27`** 個 **Unique Non-PK Indexes**（`pg_index.indisunique AND NOT indisprimary`）。
  - **觸發器狀態 (`pg_trigger`)**：`disabled_triggers = 0`（無遭停用或異常觸發器）。
- **無法獨立驗證項目**：無。

---

### D. 索引（判定：**`PASS`**）

- **查詢方式**：查詢 `pg_indexes`（`schemaname = 'public'`）、`pg_index` 有效性旗標（`indisvalid`, `indisready`, `indislive`），並以 `(table_name, indkey, indisunique)` 偵測重複普通索引定義。
- **預期結果**：索引總數 `133`、`invalid` 索引 `0`、無重複或未完成建立之異常索引。
- **實際結果**：
  - `pg_indexes` 總數 = **`133`**、`pg_index` 總數 = **`133`**（拆解：`37` 個 PK 索引 + `27` 個 Unique 非 PK 索引 + `69` 個普通索引 = `133`）。
  - `invalid_indexes` (`NOT indisvalid`) = **`0`**、`not_ready_indexes` (`NOT indisready`) = **`0`**、`not_live_indexes` (`NOT indislive`) = **`0`**。
  - 重複索引檢查（非部分／非表達式索引之 `(table_name, indkey, indisunique)` 分組 `HAVING count(*) > 1`）：回傳 **`0` rows**，無重複定義。
- **無法獨立驗證項目**：無。

---

### E. RLS（Row Level Security）（狀態實測：`37/37` 已啟用結構旗標；安全性評估：**`PARTIAL PASS`（僅完成表級開關還原，使用者隔離尚未完成）**）

- **查詢方式**：查詢 `pg_class`（`relnamespace = 'public' AND relkind = 'r'`）之 `relrowsecurity`、`relforcerowsecurity` 及系統檢視 `pg_policies`。
- **預期結果**：統計 37 張表之 `ENABLE ROW LEVEL SECURITY` 與 `FORCE ROW LEVEL SECURITY` 及 RLS Policy 數量；不得將「RLS 已啟用」誤判為「使用者隔離已完成」。
- **實際結果**：
  - `total_tables = 37`
  - `ENABLE ROW LEVEL SECURITY` (`relrowsecurity = true`)：**`37 / 37`**（前述 37 張表全數為 `t`）
  - `FORCE ROW LEVEL SECURITY` (`relforcerowsecurity = true`)：**`0 / 37`**（37 張表全數為 `f`）
  - `public_policies_count`（`pg_policies WHERE schemaname = 'public'`）：**`0`**
  - `total_policies_all_schemas`（`pg_policies` 全庫）：**`0`**
- **重要安全解讀（不得高估）**：
  1. **「37/37 RLS 已啟用」不等同於「使用者資料隔離已完成」**：目前 `public` 內 **RLS Policy 數為 `0`**；對於未持有表擁有權或 `BYPASSRLS` 之一般角色雖為預設拒絕（Default-Deny），但專案尚未定義且實裝業務所需之「學生／教師／管理員／本人資料」Policy。
  2. `FORCE ROW LEVEL SECURITY` 為 `0/37`，且本次沙盒依設計以 `--no-owner --no-acl` 還原至 `codetoknow_restore` 擁有與 `postgres` 超級使用者環境，**表擁有者／應用直連高權限角色／超級使用者均會繞過 RLS**。
  3. 因此本項在「與原始備份結構一致」面向符合現況，但在「資料隔離與存取安全性」面向僅能判定為 **`PARTIAL PASS`**。
- **無法獨立驗證項目**：因 `restore_pg17_sandbox.ps1` 依規範使用 `--no-owner --no-acl` 還原，原始 Supabase 正式環境之角色擁有者與細部物件 `ACL`/`DEFAULT ACL` 授權並未重現於本沙盒（故正式環境 RBAC／最小權限仍無法由本沙盒直接驗收）。

---

### F. Schema、Enum、擴充與 Migration（判定：**`PASS`**）

- **查詢方式**：查詢 `pg_namespace`、`pg_type` + `pg_enum`、`pg_extension`、`public._prisma_migrations`（僅查詢非敏感中繼欄位）。
- **預期結果**：確認 `public`、`auth`、`storage`、`realtime`、`extensions` 等 Schema、確認 `AnnouncementStatus` Enum、`pgcrypto`/`uuid-ossp`/`pg_stat_statements` 擴充套件、確認 `_prisma_migrations` 2 筆紀錄。
- **實際結果**：
  - **使用者 Schema（共 7 個）**：`auth`、`extensions`、`graphql`、`graphql_public`、`public`、`realtime`、`storage`（確認 `vault` Schema **不存在**；`auth`/`storage`/`realtime` 共含 `40` 張系統表）。
  - **Enum（共 13 個）**：
    - `public."AnnouncementStatus"`：**`DRAFT, PUBLISHED, ARCHIVED`**（完整存在）
    - 其餘為 Supabase 內建 Schema Enum：`auth`（9 個）、`realtime`（2 個）、`storage`（1 個）。
  - **擴充套件（共 4 個）**：
    - `pgcrypto` `1.3`（schema: `extensions`）
    - `uuid-ossp` `1.1`（schema: `extensions`）
    - `pg_stat_statements` `1.11`（schema: `extensions`）
    - `plpgsql` `1.0`（schema: `pg_catalog`）
    - （確認 `supabase_vault` **未安裝**）
  - **`public` 常式與檢視**：`public` 檢視數 `0`；`public` 函式 `1` 支（`rls_auto_enable`，回傳型別 `event_trigger`）。
  - **`_prisma_migrations`（實測 2 筆）**：
    1. `id = 08c64569-e834-4bf9-a340-02fd9acb84d9`｜`migration_name = 20261103000000_init`｜`finished_at = 2026-11-08 07:58:55.55898+00`｜`rolled_back_at = NULL`｜`applied_steps_count = 1`
    2. `id = 4ed9d5ae-3184-41f1-9910-6fbd23c8b470`｜`migration_name = 20261108000000_add_business_models`｜`finished_at = 2026-11-08 07:59:29.362019+00`｜`rolled_back_at = NULL`｜`applied_steps_count = 1`
- **無法獨立驗證項目**：`graphql`／`graphql_public` 或 Supabase 平台專屬後端服務在純 PG17 沙盒中僅保留 Schema/結構，其獨立平台伺服器（PostgREST/GoTrue/Realtime Server）未於本機啟動運行。

---

### G. PUBLICATION（判定：**`PARTIAL PASS`**）

- **查詢方式**：唯讀執行 `SHOW wal_level;` 及查詢 `pg_publication`、`pg_publication_tables`、`pg_publication_namespace`。
- **預期結果**：確認 `supabase_realtime` 是否存在、檢查發布設定、記錄 `wal_level=replica` 並說明 Logical Replication 限制（不修改任何設定）。
- **實際結果**：
  - `SHOW wal_level;` = **`replica`**
  - `pg_publication`：`pubname = supabase_realtime`、`pubowner = postgres`、`puballtables = f`、`pubinsert = t`、`pubupdate = t`、`pubdelete = t`、`pubtruncate = t`、`pubviaroot = f`。
  - `pg_publication_tables`（`explicit_table_count`）= **`0`**；`pg_publication_namespace` = **`0` rows**。
- **Logical Replication 功能限制說明**：
  - 在 `wal_level = replica` 下，PostgreSQL WAL **不會記錄足夠供邏輯解碼（Logical Decoding）使用之完整資料變更資訊**。
  - 因此雖然 `CREATE PUBLICATION supabase_realtime ...` 物件本身已在資料庫目錄建立成功，但在目前本機 PG17.11 沙盒中**無法建立或使用 Logical Replication Slot 串流即時變更事件給 Supabase Realtime 訂閱端**。若未來需於本機實測 Realtime CDC，才需另案授權調整 PostgreSQL 啟動參數至 `wal_level = logical` 並重啟。
- **無法獨立驗證項目**：於目前 `wal_level = replica` 條件下，無法在本沙盒實測 Logical Replication CDC 訂閱傳輸功能。

---

### H. Vault 排除影響（判定：**`PASS`**）

- **查詢方式**：比對原始 `.dump` 經 PG17.11 `pg_restore --list` 解析出之 `public` 核心 `337` 項物件清單與已還原資料庫系統目錄，並以正規式掃描 `pg_proc.prosrc`、`pg_views.definition`、`pg_attrdef` 是否存在 `vault` 或 `supabase_vault` 參照。
- **預期結果**：10 個 Vault TOC 項目已排除、`public` 核心 `337` 項完整、無因排除 Vault 導致 `public` 缺失物件。
- **實際結果**：
  - 已確認 `vault` Schema 與 `supabase_vault` Extension 均不存在於 `code_to_know_c2kb_prod_restore_clean_v2`，10 個 Vault TOC 項目已精確排除（未讀取任何 Vault 內容）。
  - 原始 `.dump` 中 `337` 項 `public` 核心 TOC 物件拆解與還原庫核對全數對應：
    - `TABLE`: `37`（與 DB `37` 表一致）
    - `TABLE DATA`: `37`（與 DB `37` 表列數一致）
    - `TYPE`: `1`（`AnnouncementStatus` 一致）
    - `FUNCTION`: `1`（`rls_auto_enable` 一致）
    - `CONSTRAINT`: `37`（37 PK + 表內 1 CHECK 一致）
    - `INDEX`: `96`（加 37 PK 索引共 `133` 一致）
    - `FK CONSTRAINT`: `47`（47 validated FKs 一致）
    - `ROW SECURITY`: `37`（37 tables `relrowsecurity = t` 一致）
    - *(另 `ACL: 38`、`DEFAULT ACL: 6` 係依 `--no-owner --no-acl` 設計略過，非因排除 Vault 所致)*
  - `public` 內部相依掃描：`vault_proc_refs = 0`、`vault_view_refs = 0`、`vault_default_refs = 0`。
- **無法獨立驗證項目**：無（已確認排除 Vault 對 `public` 核心結構與資料零影響）。

---

## 二、備份、環境與禁止事項保護覆核（判定：**`PASS`**）

1. **原始備份與暫存清理**：
   - `code_to_know_supabase_prod.dump`：`505,249` bytes、`SHA-256` `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`（完整未動）。
   - `code_to_know_supabase_prod.dump.c2kb`：`505,282` bytes、`SHA-256` `6E2660285CF0F767F43E06D4669384D3CC40EAF6DF9936304B854B12C2167A37`（完整未動）。
   - 備份目錄無任何遺留 `.dump`/`.toc`/`.list` 解密暫存檔；PG17 容器 `/tmp` 目錄為空（僅 `.` 與 `..`）。
2. **既有資料庫保護**：
   - `code_to_know_c2kb_prod_restore_test`（`12 MB`）與 `code_to_know_cloud_restore_test`（`12 MB`）完整保留未動；PG16 開發資料庫未接觸；未連線或修改 Supabase。
3. **Git 狀態**：
   - `HEAD` 維持 `86a0f1116693bcce476b8747a446900d54b29a4a`，無任何 Git 寫入操作，無任何秘密或金鑰輸出。

---

## 三、分項最終判定總表

| 評估構面 | 判定 | 精確理由與限制說明 |
|---|---|---|
| **1. 備份解密完整性** | **`PASS`** | 原始 `.dump`（`2BB79...`）與 `.c2kb`（`6E266...`）SHA-256 完全吻合，Phase 3-C-12 以相同備份執行 AES-256-GCM AuthTag 認證解密與 SHA-256 比對通過且暫存檔已清空。 |
| **2. PostgreSQL 還原完整性** | **`PASS`** | `public` 37 表、37 PK、`1` CHECK、`47` 已驗證 FK（`0` 未驗證／`0` 缺目標）、`133` 索引（`37` PK + `27` Unique + `69` 普通；`0` invalid/duplicate）、`7` Schema、`4` 擴充、`1` Enum、`1` 函式及 `2` Prisma Migration 全數與 `.dump` 定義吻合，且排除 10 項 Vault 零影響 `public`。 |
| **3. 資料內容完整性** | **`PASS`（`public` 37 表）／`無法獨立比對`（非 `public` Schema）** | `public` 全部 37 張表經實際 `COUNT(*)` 驗證與 `.dump` `COPY` 列數 `37/37` 一致（`_prisma_migrations` = `2`、36 業務表 = `0`）；非 `public` Schema 40 張系統表未逐表比對資料列數。 |
| **4. RLS 與安全性** | **`PARTIAL PASS`** | `37/37` 資料表已開啟 `ENABLE ROW LEVEL SECURITY`，但 **`pg_policies` 數量為 `0`、`FORCE ROW LEVEL SECURITY` 為 `0/37`**，且本次使用 `--no-owner --no-acl` 還原；**僅證明結構旗標還原正確，使用者資料隔離與正式權限控管尚未建立亦尚未完成驗證**。 |
| **5. Realtime 功能限制** | **`PARTIAL PASS`** | `PUBLICATION supabase_realtime` 已存在且屬性與備份一致（`explicit_table_count = 0`），惟 PG17 沙盒目前 **`wal_level = replica`**，不支援 Logical Replication 解碼與 CDC 串流，無法在本沙盒直接驗證 Realtime 即時訂閱運作。 |

---

*本階段已完成 Phase 3-C-13 唯讀獨立完整性查核並立即停止，未對資料庫、PG16、Supabase、Git 或設定檔執行任何寫入；等待使用者審查與決定後續步驟。*
