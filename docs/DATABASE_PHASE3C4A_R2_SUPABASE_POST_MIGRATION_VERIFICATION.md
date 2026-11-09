# CODE TO KNOW (碼上學)
# PHASE 3C-4A-R2：Supabase 正式 Migration 後唯讀全面驗收報告

**文檔版本**：1.0 (正式驗收結案)  
**驗收日期**：2026-11-08  
**驗收執行者**：PostgreSQL DBA、Prisma 7 架構師、雲端資安審查團隊  
**目標專案**：Supabase `code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`)  
**連線架構**：AWS Sydney (`aws-0-ap-southeast-2.pooler.supabase.com:5432` Session Pooler, Strict Root CA)

---

## 一、驗收目的與授權範圍

本階段為正式 Migration 執行後的「**100% 唯讀結構與資料安全全面驗收**」。  
依據最高資安規範：
- 零 DDL、零 DML 寫入操作。
- 不修改任何 `.env` 或正式環境變數。
- 不自動修復任何項目。
- 零明文密碼、連線字串或敏感 Token 輸出。
- 所有驗收結果均以實體連線唯讀查詢（`cloud_audit_results.json`）為準，絕不補造或臆測數據。

---

## 二、執行前 Git 與環境狀態

| 項目 | 預期基準 | 實際檢驗狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Git 工作區** | 無新增 staged，保留未暫存變更 | 與審查前完全一致，無意外修改 | **PASS** |
| **Prisma Schema** | `backend/prisma/schema.prisma` | 未修改 | **PASS** |
| **Migration SQL** | 2 組 Migration SQL 檔案 | 未修改 | **PASS** |
| **正式環境變數** | 零本機 Supabase 密碼寫死 | 純淨 (僅指向本機 Docker) | **PASS** |

---

## 三、雲端連線端點與 TLS 憑證驗證

| 連線參數 | 驗收規範標準 | 實際連線狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **主機端點 (Host)** | `aws-0-ap-southeast-2.pooler.supabase.com` | 符合 Session Pooler 官方規格 | **PASS** |
| **連接埠 (Port)** | `5432` (Session Pooler) | 支援 `pg_advisory_lock`，阻斷 6543 | **PASS** |
| **資料庫名稱 (DB)** | `postgres` | 符合 Supabase 預設資料庫名稱 | **PASS** |
| **使用者 (User)** | `postgres.ypibmyfxfhsyfdwxprpi` | 鎖定專案參照碼，杜絕跨專案連線 | **PASS** |
| **TLS 憑證 (CA)** | `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt` | 嚴格載入實體憑證 (SHA-256: `70072358...`) | **PASS** |
| **SSL 嚴格驗證** | `rejectUnauthorized: true`, `sslaccept=strict` | 驗證通過，禁止中間人攻擊 (MITM) | **PASS** |
| **網路延遲適配** | `connect_timeout=15` | 跨海連線穩定通過 (無 P1001 逾時) | **PASS** |

---

## 四、正式 Migration 執行結果 (`_prisma_migrations`)

經唯讀查詢 Supabase 實體資料庫 `_prisma_migrations` 表格，確認兩組 Migration 均已完整套用：

```sql
SELECT id, migration_name, checksum, finished_at, applied_steps_count, rolled_back_at FROM "_prisma_migrations";
```

### 實際查詢結果記錄：
1. **第一組 Migration：`20261103000000_init`**
   - **Migration ID**：`08c64569-e834-4bf9-a340-02fd9acb84d9`
   - **套用步數 (applied_steps_count)**：`1`
   - **完成時間 (finished_at)**：`2026-11-08T07:58:55.558Z`
   - **Rollback 狀態 (rolled_back_at)**：`NULL` (無回滾)
   - **記錄校驗碼 (checksum)**：`ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29`
   - **狀態判定**：**PASS**
2. **第二組 Migration：`20261108000000_add_business_models`**
   - **Migration ID**：`4ed9d5ae-3184-41f1-9910-6fbd23c8b470`
   - **套用步數 (applied_steps_count)**：`1`
   - **完成時間 (finished_at)**：`2026-11-08T07:59:29.362Z`
   - **Rollback 狀態 (rolled_back_at)**：`NULL` (無回滾)
   - **記錄校驗碼 (checksum)**：`c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c`
   - **狀態判定**：**PASS**

**Migration 執行總結**：已套用 2 組，失敗 0 組，Pending 0 組。

---

## 五、36 張實體業務資料表驗收

`public` Schema 總資料表數為 **37** 張，包含 1 張 Prisma 管理表 (`_prisma_migrations`) 與恰好 **36** 張業務資料表，無任何非預期冗餘表格：

| # | 資料表名稱 (Table Name) | 對應 Prisma Model | 所屬領域 | 狀態 |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `User` | User | 核心身份驗證 | **PASS** |
| 2 | `UserProfile` | UserProfile | 使用者擴充資料 | **PASS** |
| 3 | `Role` | Role | 權限角色系統 | **PASS** |
| 4 | `UserRole` | UserRole | 使用者角色多對多 | **PASS** |
| 5 | `Session` | Session | 登入會話管理 | **PASS** |
| 6 | `AuditLog` | AuditLog | 安全審計紀錄 | **PASS** |
| 7 | `EmailVerificationToken` | EmailVerificationToken | 信箱驗證安全碼 | **PASS** |
| 8 | `PasswordResetToken` | PasswordResetToken | 密碼重設安全碼 | **PASS** |
| 9 | `TeacherApplication` | TeacherApplication | 教師資格審核申請 | **PASS** |
| 10 | `TeacherProfile` | TeacherProfile | 教師專屬資訊與認證 | **PASS** |
| 11 | `Subject` | Subject | 學科領域分類 | **PASS** |
| 12 | `Certification` | Certification | 專業證照體系 | **PASS** |
| 13 | `CertificationEnrollment` | CertificationEnrollment | 證照報名追蹤 | **PASS** |
| 14 | `Question` | Question | 題庫核心題目 | **PASS** |
| 15 | `QuestionOption` | QuestionOption | 單選/多選題目選項 | **PASS** |
| 16 | `QuestionTag` | QuestionTag | 知識點與概念標籤 | **PASS** |
| 17 | `QuestionTagRelation` | QuestionTagRelation | 題目標籤關聯表 | **PASS** |
| 18 | `ExamPaper` | ExamPaper | 模擬試卷設定 | **PASS** |
| 19 | `ExamAttempt` | ExamAttempt | 考試作答紀錄 | **PASS** |
| 20 | `ExamAnswerSnapshot` | ExamAnswerSnapshot | 作答快照 (SET NULL) | **PASS** |
| 21 | `WrongQuestionRecord` | WrongQuestionRecord | 個人錯題本追蹤 | **PASS** |
| 22 | `QuestionBookmark` | QuestionBookmark | 題目個人收藏 | **PASS** |
| 23 | `PracticalTask` | PracticalTask | 實戰練習專案任務 | **PASS** |
| 24 | `PracticalStep` | PracticalStep | 實戰引導步驟定義 | **PASS** |
| 25 | `PracticalProgress` | PracticalProgress | 學生實戰總體進度 | **PASS** |
| 26 | `PracticalStepProgress` | PracticalStepProgress | 步驟級進度與評估 | **PASS** |
| 27 | `UnitProgress` | UnitProgress | 單元學習進度 | **PASS** |
| 28 | `StudyTimeLog` | StudyTimeLog | 學習時間分析統計 | **PASS** |
| 29 | `StudentWeaknessAnalysis`| StudentWeaknessAnalysis | AI 學生弱點診斷 | **PASS** |
| 30 | `AIChatSession` | AIChatSession | AI 教學輔導會話 | **PASS** |
| 31 | `AIChatMessage` | AIChatMessage | AI 對話訊息紀錄 | **PASS** |
| 32 | `Class` | Class | 班級與教學社群 | **PASS** |
| 33 | `ClassEnrollment` | ClassEnrollment | 學生班級加入紀錄 | **PASS** |
| 34 | `ClassAssignment` | ClassAssignment | 班級作業指派 (XOR) | **PASS** |
| 35 | `Announcement` | Announcement | 系統公告管理 | **PASS** |
| 36 | `AnnouncementRead` | AnnouncementRead | 公告已讀追蹤 | **PASS** |

---

## 六、外鍵、索引、Enum 與約束驗收

### 1. 外鍵約束 (Foreign Keys)
- **總數驗收**：實際 **47** 個（預期 47 個，完全相符）。
- **關鍵關聯核對**：
  - `ExamAnswerSnapshot.questionId` 外鍵之 `delete_rule` 為 **`SET NULL`**（符合架構防護需求，題庫題目刪除時保留作答歷程紀錄）。
  - `ClassAssignment` 正確關聯 `ExamPaper` 與 `PracticalTask`。
- **孤兒資料檢查**：無任何外鍵關聯異常。

### 2. 索引總數 (pg_indexes)
- **總數驗收**：`public` Schema 實際 **133** 個索引（包含主鍵 B-Tree、唯一約束 Unique Index 及外鍵加速索引，完全相符）。

### 3. PostgreSQL 自訂 Enum
- **Enum 驗收**：`AnnouncementStatus`
  - 標籤：`DRAFT`, `PUBLISHED`, `ARCHIVED`（共 3 種狀態，完全相符）。

### 4. Check Constraints 與 XOR 業務規則
- **約束總數**：實際 **252** 個（涵蓋系統 NOT NULL 與自訂 CHECK 約束）。
- **ClassAssignment 目標互斥約束 (XOR Check)**：
  - **約束名稱**：`ClassAssignment_target_xor_check`
  - **實體 SQL 規則**：`(num_nonnulls("examPaperId", "practicalTaskId") = 1)`
  - **驗證結論**：**PASS**（保證作業派發只能是指派試卷或指派實戰任務二選一）。

---

## 七、資料純淨度與安全性驗收 (Data Safety)

經逐表執行 `SELECT COUNT(*)::int` 稽核 36 張業務資料表：
- **業務資料總筆數**：**`0`** 筆。
- **非預期測試資料**：無。
- **管理員帳號**：未建立（符合預期，嚴禁在 Migration 階段預先建立管理者）。
- **Seed 執行狀態**：未執行 Seed。
- **結論**：雲端資料庫目前為**純淨無污染的正式架構**。

---

## 八、Prisma Migrate 狀態檢查結果 (Prisma CLI Verification)

使用者已於完成 Supabase Dashboard 密碼重設後，在本機終端機安全執行 `run_cloud_migrate_status.ps1`，成功完成 Prisma 7 CLI 唯讀狀態查詢：

### 1. 執行參數與環境核對
- **Prisma 設定檔**：`prisma.config.ts`
- **Prisma Schema**：`prisma/schema.prisma`
- **Datasource 提供者**：PostgreSQL
- **目標主機與連線埠**：`aws-0-ap-southeast-2.pooler.supabase.com:5432` (Session Pooler)
- **資料庫與 Schema**：Database `postgres` / Schema `public`
- **憑證與連線安全**：使用者於本機終端機以安全遮罩輸入新重設之 Database Password，全程未記錄密碼、長度、雜湊或連線字串，結束後立即自記憶體清除敏感環境變數。

### 2. Prisma CLI 實際狀態輸出
- **Migration 比對結果**：Prisma CLI 成功讀取雲端狀態，辨識出本機 2 筆 Migration（`20261103000000_init`、`20261108000000_add_business_models`）。
- **Schema 狀態**：**`Database schema is up to date!`**
- **操作性質**：100% 唯讀狀態查詢，絕無執行 `migrate deploy`、`migrate resolve`、`db push` 或 `seed`。
- **狀態判定**：**PASS**

---

## 九、資料庫備份狀態釐清 (重要架構說明)

針對本專案目前的備份現況，必須嚴格區分本機與雲端：

1. **本機資料庫實體備份 (Local Dump)**：
   - 路徑：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`
   - SHA-256：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
   - 狀態：已完整封存且已完成本地獨立還原測試（PostgreSQL 16.15）。
2. **Supabase 雲端備份現況 (Cloud Backup)**：
   - 方案級別：**Free Plan** ($0.00 USD)。
   - 官方機制：Supabase Free Plan 提供每日自動 WAL / 實體基礎備份（由 Supabase 原廠平台自動管理），但不支援自訂 Point-in-time Recovery (PITR)。
   - 狀態：**尚未確認 / 待確認**（依據嚴格審查規範，雲端自動備份未經實體提取驗證前，不得標示為 PASS）。目前雲端業務資料為 0 筆空表，架構由 Git Migration 完全鎖定。

---

## 十、憑證安全與輪替確認

1. **憑證輪替執行**：
   - 使用者已於 Supabase Dashboard 成功完成 Database Password 重設，消除了先前密碼在終端或對話中的潛在曝露風險。
2. **本機安全性**：
   - 本機 `.env` 與專案程式碼完全未寫入或殘留 Supabase 雲端新密碼。
   - 所有後續 Migration 或狀態檢查均維持記憶體單次注入與即時擦除。

---

## 十一、最終驗收總結與各維度判定

依據嚴格的分項核對機制，本次驗收各維度判定如下：

| 驗收維度 | 檢驗標的 | 判定結果 |
| :--- | :--- | :---: |
| **雲端 Migration 部署** | 兩組 Migration (`init` + `add_business_models`) 成功套用 | **PASS** |
| **雲端實體結構驗收** | 36 張業務表、47 外鍵、133 索引、Enum、XOR Check、SET NULL | **PASS** |
| **Prisma CLI 狀態驗證** | `Database schema is up to date!` (Prisma 7 Session Pooler 5432) | **PASS** |
| **業務資料空表檢查** | 36 張業務資料表總筆數為 0，零測試資料、零管理員 | **PASS** |
| **雲端備份現況** | Supabase Free Plan 雲端自動備份尚未進行實體擷取驗證 | **待確認 (UNVERIFIED)** |

**整體 R2 結論**：  
**`PASS — Supabase Migration Deployment & Post-Migration Verification`**  
本專案已正式完成 Supabase 雲端資料庫之首次 Migration 部署、實體結構全面驗收與 Prisma CLI 狀態核驗，雲端架構與本機完全一致且零業務資料污染。
