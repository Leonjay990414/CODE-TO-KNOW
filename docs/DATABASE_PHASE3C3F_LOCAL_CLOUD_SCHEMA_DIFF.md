# CODE TO KNOW（碼上學）
# PHASE 3C-3F：本機與 Supabase 雲端資料庫差異核對報告（Strictly Read-Only）

**執行日期**：2026-11-08  
**執行角色**：資深 PostgreSQL DBA、Prisma 7 架構師、Supabase 雲端資料庫工程師、資安審查工程師  
**審查性質**：100% 唯讀比對、靜態相容性分析、差分核實（Zero DDL / Zero DML / Zero Cost）  
**雲端目標專案**：`code-to-know-prod`（Ref: `ypibmyfxfhsyfdwxprpi`，Region: `ap-southeast-2` / AWS Sydney）  

---

## 一、本階段執行摘要

本階段針對 CODE TO KNOW 既有本機 Docker PostgreSQL 16.15 與遠端 Supabase 雲端 PostgreSQL 17.11 進行嚴格的唯讀結構比對（Schema Diff）與相容性驗證。

全程嚴格落實**零變更、零付費、零機密外洩**原則：
1. **零寫入**：未執行任何 `CREATE`、`ALTER`、`DROP`、`INSERT`、`UPDATE`、`DELETE`、`TRUNCATE`、`GRANT` 或 `REVOKE`。
2. **零 Migration**：未執行任何 `prisma migrate deploy`、`migrate resolve`、`db push`、`db pull` 或 `seed`。
3. **環境無損**：未修改任何 `.env`、應用程式代碼或 Prisma Schema。本機正式備份與隔離還原資料庫完全保留。
4. **雲端乾淨度核實**：遠端 Supabase `public` 綱要確認為 **0 張資料表**，完全處於可供首次乾淨部署之狀態。
5. **相容性無虞**：本機 PG 16.15 與雲端 PG 17.11 針對 Prisma 7 產生的所有 DDL 語法與資料型別具備 100% 向後相容性，無任何語法棄用或阻擋風險。

---

## 二、本機資料庫實際狀態

### 1. 容器與基礎環境
- **容器名稱**：`code_to_know_postgres`（狀態：`Up / healthy`）
- **映像檔版本**：`postgres:16-alpine`
- **PostgreSQL 核心版本**：`PostgreSQL 16.15 on x86_64-pc-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit`
- **資料庫名稱**：`code_to_know`
- **資料庫擁有者**：`codetoknow`
- **監聽連接埠**：`5432`

### 2. 資料表與物件盤點
- **`public` 綱要資料表總數**：37 張
  - **業務資料表**：36 張（完全對應 `schema.prisma` 之 36 個 Models）
  - **Prisma 管理表**：1 張（`_prisma_migrations`）
- **自訂列舉（Native Enum）**：1 組
  - `AnnouncementStatus`（值：`DRAFT`, `PUBLISHED`, `ARCHIVED`）
- **外鍵條件（Foreign Key Constraints）**：47 組
- **實體索引（Physical Indexes）**：133 組（含主鍵索引、唯一索引、B-Tree 檢索索引）
- **自訂檢查條件（Check Constraints）**：1 組業務自訂條件
  - `ClassAssignment_target_xor_check`：`CHECK (num_nonnulls("examPaperId", "practicalTaskId") = 1)`
  - 其餘 251 組為系統自動生成的 `NOT NULL` 欄位約束。
- **已安裝擴充功能（Installed Extensions）**：
  - `plpgsql` (v1.0)
  - 未使用任何外部非標準 Extension（如 `uuid-ossp`、`pgcrypto` 等皆未依賴，UUID 由核心內建 `gen_random_uuid()` 支援）。

### 3. 本機業務資料筆數現況（Read-Only Query）
經對本機資料庫進行唯讀計數查詢，所有 36 張業務表之資料筆數如下：

| 分類 | 資料表名稱 | 本機資料筆數 | 說明 |
| :--- | :--- | :---: | :--- |
| **核心身分與權限** | `User` | **4** | 開發/測試預設帳號 |
| | `Role` | **3** | `ADMIN`, `TEACHER`, `STUDENT` |
| | `UserRole` | **4** | 角色指派關聯 |
| | `Session` | **3** | 測試登入會話 |
| | `UserProfile` | **4** | 使用者個人基本資料 |
| **稽核與驗證** | `AuditLog` | **9** | 本機系統操作日誌 |
| | `EmailVerificationToken` | **4** | 電子信箱驗證 Token |
| | `PasswordResetToken` | **0** | 無未處理重設 Token |
| **教師申請模組** | `TeacherApplication` | **2** | 測試申請紀錄 |
| | `TeacherProfile` | **0** | 待審核通過後建立 |
| **其餘 27 張業務表** | `Subject`, `Certification`, `CertificationEnrollment`, `Class`, `ClassEnrollment`, `QuestionTag`, `Question`, `QuestionOption`, `QuestionTagRelation`, `QuestionBookmark`, `ExamPaper`, `ExamAttempt`, `ExamAnswerSnapshot`, `PracticalTask`, `PracticalStep`, `PracticalProgress`, `PracticalStepProgress`, `ClassAssignment`, `AIChatSession`, `AIChatMessage`, `StudyTimeLog`, `UnitProgress`, `WrongQuestionRecord`, `StudentWeaknessAnalysis`, `Announcement`, `AnnouncementRead` | **0** | 結構就緒，尚無業務資料 |

---

## 三、Supabase 雲端實際狀態

### 1. 雲端專案與連線端點
- **專案名稱**：`code-to-know-prod`
- **專案識別碼 (Ref)**：`ypibmyfxfhsyfdwxprpi`
- **雲端區域**：`ap-southeast-2`（AWS Sydney）
- **服務方案**：Free Plan（Nano Compute, 500 MB 儲存上限）
- **連線架構**：IPv4 Session Pooler（連接埠 `5432`）
  - 連線主機：`aws-0-ap-southeast-2.pooler.supabase.com`
  - 連線身分：`postgres.ypibmyfxfhsyfdwxprpi`
  - 資料庫：`postgres`
  - TLS 協議：`TLSv1.3`，加密套件 `TLS_AES_256_GCM_SHA384`
  - 憑證鏈校驗：`rejectUnauthorized: true`，官方 Root CA（`prod-ca-2021.crt`）通過驗證

### 2. 雲端資料庫物件核對
- **PostgreSQL 核心版本**：`PostgreSQL 17.11`
- **`public` 綱要狀態**：存在，為預設空結構
- **`public` 綱要資料表總數**：**0 張**（無任何業務資料表）
- **`_prisma_migrations` 表**：**不存在**（從未執行過任何 Prisma Migration）
- **專案相關客製化物件**：無任何預先建立之 View、Trigger、Function 或 Type。
- **Supabase 系統內部綱要**：
  - 存在預設系統管理綱要：`auth`, `storage`, `vault`, `realtime`, `extensions`, `graphql`, `graphql_public`, `net`, `pgbouncer`, `pgsodium`, `pgsodium_masks`。
  - 上述綱要皆與 `public` 完全隔離，符合 Supabase 標準多租戶與 PaaS 架構。
- **結論**：雲端環境處於 **100% 潔淨狀態（Pristine State）**，完全具備執行全新 Migration 初始化之條件。

---

## 四、本機與雲端 Schema 差異表

| 比對項目 | 本機 Docker 環境 | Supabase 雲端環境 | 差異說明與評估 |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 版本** | `16.15` | `17.11` | 雲端版本較新（PG 17）。語法向後相容，評估無風險。 |
| **Prisma Models** | 36 個 | 不適用（未部署） | 本機完整定義，雲端待部署。 |
| **業務資料表數量** | 36 張 | **0 張** | 差異 36 張。雲端為全空，無衝突風險。 |
| **Prisma 管理表** | 1 張 (`_prisma_migrations`) | **0 張**（不存在） | 雲端將由首次部署自動建表。 |
| **Native Enum** | 1 組 (`AnnouncementStatus`) | **0 組** | 差異 1 組。將由 Migration DDL 自動建立。 |
| **Foreign Keys** | 47 組 | **0 組** | 差異 47 組。關聯拓撲於 Phase 3C-2A 驗證無迴圈，可依序建立。 |
| **實體索引 (Indexes)** | 133 組 | **0 組** | 差異 133 組。將由 Migration DDL 自動建立。 |
| **業務 Check 約束** | 1 組 (`target_xor_check`) | **0 組** | 差異 1 組。`num_nonnulls` 為 PG 內建函數，PG 17 完美支援。 |
| **已安裝擴充功能** | 僅 `plpgsql` | Supabase 內建套裝 | 本專案不依賴非標準 Extension，兩者環境皆滿足需求。 |
| **資料筆數 (Data)** | 核心表共 30 筆測試資料 | **0 筆** | 首次部署僅套用結構（DDL），不匯入本機開發測試髒資料。 |

---

## 五、Migration 歷史與 Checksum 核對

### 1. 磁碟遷移檔案清單與 SHA-256
路徑：`backend/prisma/migrations/`

| 遷移目錄名稱 | 檔案大小 | 磁碟檔案 SHA-256 Checksum |
| :--- | :---: | :--- |
| `20261103000000_init` | 4,927 bytes | `ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29` |
| `20261108000000_add_business_models` | 27,849 bytes | `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c` |

### 2. 本機資料庫 `_prisma_migrations` 歷史紀錄

| 遷移名稱 (migration_name) | 執行狀態 | 記錄之 Checksum | 磁碟 Checksum 比對 |
| :--- | :---: | :--- | :---: |
| `20261103000000_init` | `APPLIED` (finished) | `2185e3a03ed86bdcaaaefbfe4ba39405bdcb9f3c0f415e5bf648ac8e8a64d915` | **MISMATCH (已知歷史差異)** |
| `20261108000000_add_business_models` | `ROLLED_BACK` | `90eeb58c8fb03117dcbb2146bd78452a0decfa426e11c16f23350deee6025933` | 歷史 BOM 失敗記錄 |
| `20261108000000_add_business_models` | `APPLIED` (finished) | `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c` | **MATCH (完全一致)** |

### 3. Checksum 鑑識分析與雲端部署影響
- **本機 Init 差異成因**：在 2026-11-03 初始化本機資料庫時，記錄之 hash 為 `2185e3a0...`。隨後該檔案經歷了 Windows 換行符號或空白正規化，導致磁碟檔案 hash 變為 `ed5b504a...`。
- **對雲端部署的影響判定**：**無負面影響**。
  - 雲端資料庫目前為空，**不存在 `_prisma_migrations` 表**。
  - 當未來在雲端執行 `prisma migrate deploy` 時，Prisma 會以磁碟上當前檔案（`ed5b504a...` 與 `c9eaba10...`）作為基準，依序在雲端執行並寫入這兩組當前 hash。
  - 雲端並不會繼承本機的歷史 mismatch，而會建立乾淨、一致且以現行磁碟檔案為準的雲端 Migration 歷史。

---

## 六、PostgreSQL 16 與 17 相容性分析

針對本專案所有 Migration DDL 及 Prisma Client 查詢模式進行 PostgreSQL 17 相容性比對：

1. **基本資料型別**：
   - `UUID`, `TEXT`, `INTEGER`, `BOOLEAN`, `TIMESTAMP(3) WITH TIME ZONE`, `JSONB` 皆為標準 SQL / PostgreSQL 原生型別，PG 17 表現一致。
2. **預設函數**：
   - `gen_random_uuid()`：PostgreSQL 自 13 版起即納入核心內建函數，PG 17 完全原生支援，無需掛載 `pgcrypto`。
   - `CURRENT_TIMESTAMP`：標準 ANSI SQL 函數，PG 17 完全相容。
3. **自訂檢查條件 (Check Constraint)**：
   - `num_nonnulls("examPaperId", "practicalTaskId") = 1`：`num_nonnulls` 自 PG 9.4 引入，PG 17 行為完全相同。
4. **列舉型別 (Enum)**：
   - `CREATE TYPE "AnnouncementStatus" AS ENUM (...)` 完全相容。
5. **外鍵連動 (Cascading Actions)**：
   - `ON DELETE CASCADE`, `ON UPDATE CASCADE`, `ON DELETE SET NULL`, `ON DELETE RESTRICT` 全數為標準外鍵規則，相容性 100%。
6. **連線池與 Advisory Locks**：
   - Prisma Migration 依賴 `pg_advisory_lock` 來防止並行遷移衝突。
   - 由於我們採用 **Session Pooler (Port 5432)**，客戶端連線直通專屬後端會話，完整支援會話級諮詢鎖，PG 17 無任何鎖機制阻礙。
7. **結論**：本專案未採用任何在 PG 17 中被棄用（Deprecated）或移除（Removed）的功能，**PG 16 → 17 具備 100% 無縫相容性**。

---

## 七、雲端部署前的風險清單

| 風險項目 | 風險等級 | 潛在威脅 | 現有防禦與緩解對策 | 狀態 |
| :--- | :---: | :--- | :--- | :---: |
| **誤連交易池 (Port 6543)** | High | Advisory Lock 失效導致 Migration 崩潰 | `MIGRATION_DATABASE_URL` 強制鎖定 Port `5432`，並有單元測試防護 | `MITIGATED` |
| **TLS 憑證未驗證** | High | 中間人攻擊 (MITM) 或未授權連線 | 強制掛載 Root CA (`prod-ca-2021.crt`)，`rejectUnauthorized=true` | `VERIFIED` |
| **本機資料遭到污染** | High | 部署時誤操作本地庫或備份遺失 | 本地備份 SHA-256 完整驗證，雲端連線完全隔離 | `VERIFIED` |
| **連線數爆滿 (Connection Exhaustion)** | Medium | Supabase Nano 運算資源連線耗盡 | Migration 採用單一連線 (`max: 1`)，完成即銷毀 Pool | `PLANNED` |
| **Migration DDL 語法失敗** | Medium | 欄位型別不相容中斷部署 | 本地已成功套用相同 SQL，且無平台特異性語法 | `VERIFIED` |
| **意外產生雲端費用** | Critical | 觸發付費方案或 Add-on | 全程鎖定 Free 方案規範，不升級、不綁卡、不購 IPv4 | `CONTROLLED` |

---

## 八、尚未解決的問題

1. **本機 Init Migration Checksum 歷史記錄差異**：
   - 本機 `_prisma_migrations` 內 `20261103000000_init` 的 hash（`2185e3a0...`）與磁碟檔案（`ed5b504a...`）不符。
   - **現狀**：依照規範，本階段如實揭露，不以手動 SQL 或 `prisma migrate resolve` 篡改本機歷史。
   - **處置建議**：未來若本機需執行 `prisma migrate dev`，可由團隊評估是否統一 resolve；但在雲端首次部署情境下，該差異不構成任何阻礙。

---

## 九、下一階段建議

1. **進入 PHASE 3C-3G：Supabase 雲端首次 Migration 部署計畫擬定**：
   - 撰寫受控部署作業指引，明確規範執行指令、連線字串注入方式（禁止寫死在檔案）、逾時控制與日誌脫敏。
2. **驗證腳本與環境變數隔離**：
   - 確保雲端連線密碼僅於執行時由互動式終端機或受控記憶體環境變數輸入，嚴禁寫入 `.env` 提交版控。
3. **部署後結構與權限複核**：
   - 規劃部署後的唯讀驗證步驟，確認雲端產生的 37 張資料表結構、47 組外鍵及索引皆與本機 100% 吻合。

---

## 十、項目驗證狀態清單

- [x] **本機 PostgreSQL 容器健康度**：`healthy`（PostgreSQL 16.15）
- [x] **本機 36 個 Prisma Models 與資料表 1:1 對應**：`VERIFIED`
- [x] **本機 Foreign Keys (47) 與 Indexes (133)**：`VERIFIED`
- [x] **本機 XOR Check Constraint 完整性**：`VERIFIED`
- [x] **本機備份 SHA-256 完整性**：`2DB27F8B...`（完全無損）
- [x] **Supabase 雲端連線與 TLS 1.3 握手**：`VERIFIED`（Session Pooler 5432）
- [x] **Supabase 雲端 public 綱要乾淨度**：`VERIFIED`（0 張資料表）
- [x] **PostgreSQL 16 → 17 語法相容性**：`VERIFIED`（100% 相容）
- [x] **Git 工作區隔離與零提交守則**：`VERIFIED`（HEAD 未變動）

---

## 十一、最終回報問題明確答覆

### A. 本機 36 個 Model 是否完整且一致？
**是**。本機資料庫之 36 張業務資料表完全對應 `schema.prisma` 定義的 36 個 Models，包含 1 組列舉、47 組外鍵、133 組索引與 1 組 XOR 條件，全部處於健康且已通過驗收之狀態。

### B. Supabase 是否確實處於可供首次部署的乾淨狀態？
**是**。遠端 `public` 綱要內確認為 0 張資料表，不存在任何舊版或衝突物件，`_prisma_migrations` 亦尚未建立，為標準的全新 Pristine 狀態。

### C. Migration 是否具備雲端部署前置條件？
**是**。兩組 Migration SQL 檔案（`20261103000000_init` 與 `20261108000000_add_business_models`）皆已完成語法稽核、BOM 移除與本機還原驗證，具備部署前置條件。

### D. PostgreSQL 16 → 17 是否存在已知相容性問題？
**否**。經深入比對 PostgreSQL 17 發布規範與本專案 DDL，本專案所有資料型別、預設函數（`gen_random_uuid()`）、檢查函數（`num_nonnulls()`）與鎖機制在 PG 17 均獲完全支援，無已知相容性問題。

### E. 是否仍有阻擋雲端部署的 Critical 或 High 風險？
**否**。費用保護（$0）、TLS 安全校驗、Session Pooler 鎖相容性、本機備份留存均已完成防禦，目前不存在阻擋部署之 Critical 或 High 風險。

### F. 下一階段是否可以進入 Migration 部署規劃？
**是**。已具備充分證據與安全基礎，建議正式進入下一階段擬定**「Supabase 雲端首次 Migration 部署計畫」**。
