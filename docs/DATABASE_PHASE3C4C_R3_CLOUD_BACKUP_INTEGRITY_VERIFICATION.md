# CODE TO KNOW (碼上學)
# PHASE 3C-4C-R3：第一次 Supabase 雲端備份獨立完整性驗收報告
# (First Supabase Cloud Backup Independent Integrity Verification Report)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-4C-R3 Official Deliverable)
- **驗收日期**：2026-11-08
- **審核團隊**：獨立備份驗收團隊、資深 PostgreSQL DBA、雲端資安稽核團隊
- **目標專案**：Supabase `code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`)
- **備份來源**：Session Pooler (`aws-0-ap-southeast-2.pooler.supabase.com:5432`)
- **備份目錄**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758`
- **任務性質**：**100% READ-ONLY INDEPENDENT INTEGRITY AUDIT (唯讀獨立完整性驗收，零雲端連線、零還原寫入、零密碼洩漏)**
- **最終審查結論**：**`PASS — FIRST SUPABASE CLOUD BACKUP INDEPENDENTLY VERIFIED`**

---

## 執行摘要 (Executive Summary)

使用者於獨立 PowerShell 終端機成功執行正式備份工具 [`run_supabase_backup.ps1`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/run_supabase_backup.ps1)，並產出 CODE TO KNOW 專案之第一份正式雲端資料庫備份檔案群。

審查團隊於本機隔離環境下，針對產出檔案執行全面獨立驗證：
1. **實體檔案三件套完整存在**：`code_to_know_supabase_prod.dump`、`.dump.sha256` 及 `backup_info.json` 均存在。
2. **檔案大小校驗**：Dump 實體大小恰好為 **505,249 位元組**，與系統預期完全吻合。
3. **SHA-256 密碼學獨立計算**：獨立重新計算雜湊值為 **`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`**，與預期值及 `.sha256` 記錄檔內容 **100% 精確吻合**。
4. **元數據安全檢查**：`backup_info.json` 格式合法，**零資料庫密碼、零連線字串、零環境變數外洩**。
5. **PostgreSQL 結構目錄唯讀解析 (`pg_restore --list`)**：
   - 包含 **926 項 TOC Entries**，格式為 PostgreSQL **CUSTOM Format (-Fc)**。
   - 由 PostgreSQL **17.11** 引擎產生。
   - 完整收錄 `public` Schema 之 **36 張業務資料表**、**1 張 `_prisma_migrations` 表** 及 **`AnnouncementStatus` 枚舉型別**。
6. **環境安全**：全程零雲端連線、零還原操作、Git 狀態純淨無污染。

---

## 一、備份產物實體檢驗 (Physical Artifact Inspection)

### 1. 檔案清單與屬性核對
備份目錄路徑：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758`

| 序號 | 檔案名稱 | 實體大小 (Bytes) | 建立時間 (Local) | 判定 |
| :---: | :--- | :---: | :---: | :---: |
| 1 | `code_to_know_supabase_prod.dump` | **505,249** | 2026-11-08 21:59:26 | **PASS** |
| 2 | `code_to_know_supabase_prod.dump.sha256` | **102** | 2026-11-08 21:59:26 | **PASS** |
| 3 | `backup_info.json` | **690** | 2026-11-08 21:59:26 | **PASS** |

實體 Dump 檔案大小非 0，且與預期 `505,249 bytes` 完全相符。

---

## 二、SHA-256 數位指紋獨立密碼學驗算 (Cryptographic Integrity)

審查團隊於本機以 Windows 原生 PowerShell `Get-FileHash -Algorithm SHA256` 獨立重新計算 Dump 實體檔案之雜湊：

```powershell
Get-FileHash -Path "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758\code_to_know_supabase_prod.dump" -Algorithm SHA256
```

### 雜湊比對矩陣：
- **獨立重算雜湊**：`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`
- **使用者提供預期值**：`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`
- **`.sha256` 檔案內容**：`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3  code_to_know_supabase_prod.dump`
- **核對結果**：**100% 精確吻合 (Bit-for-Bit Verified)**。

---

## 三、元數據檔案格式與機密安全檢查 (Metadata Audit)

解析檔案 `backup_info.json`：

```json
{
    "created_at_utc":  "2026-11-08T13:59:26Z",
    "database":  "postgres",
    "project_ref":  "ypibmyfxfhsyfdwxprpi",
    "project":  "code-to-know-prod",
    "format":  "PostgreSQL Custom Format (-Fc)",
    "tool_version":  "pg_dump (PostgreSQL) 17.11",
    "backup_file":  "code_to_know_supabase_prod.dump",
    "sha256":  "08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3",
    "file_size_bytes":  505249,
    "tls_mode":  "verify-full (Strict Root CA & Hostname SAN)",
    "docker_image":  "postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac",
    "target_host":  "aws-0-ap-southeast-2.pooler.supabase.com:5432"
}
```

### 機密資訊稽核：
| 檢核項目 | 標準要求 | 實際檢查結果 | 判定 |
| :--- | :--- | :--- | :---: |
| **資料庫密碼 (Password)** | 嚴禁出現 | 無任何密碼文字 | **PASS** |
| **PGPASSWORD 變數** | 嚴禁出現 | 未收錄 | **PASS** |
| **完整連線字串 (URI)** | 嚴禁包含使用者帳號與密碼之 URI | 僅標記 `target_host` 主機與連接埠 | **PASS** |
| **敏感環境變數** | 嚴禁暴露 API Key、Service Role Token | 零敏感 Token 或 API 密鑰 | **PASS** |
| **時間戳記合規性** | UTC ISO-8601 | `2026-11-08T13:59:26Z` (對應台北時間 21:59:26) | **PASS** |
| **工具版本與映像檔** | 鎖定特定版本與 RepoDigest | `17.11` 與 `sha256:3540c0...` 嚴格吻合 | **PASS** |

---

## 四、PostgreSQL TOC 唯讀目錄結構檢查 (`pg_restore --list`)

使用已鎖定 RepoDigest 之 `postgres:17-alpine` 容器，以**唯讀掛載 (`:ro`)** 方式對 Custom Format 備份檔執行 `pg_restore --list` 結構目錄清單解析（絕不執行資料庫連線或還原）：

```powershell
docker run --rm -v "C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758:/backups:ro" postgres@sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac pg_restore --list /backups/code_to_know_supabase_prod.dump
```

### 1. 傾印標頭基本資訊 (Archive Header)
- **建立時間**：`2026-11-08 13:58:12 UTC`
- **資料庫名稱**：`postgres`
- **TOC 項目總數 (TOC Entries)**：**`926`**
- **壓縮演算法**：`gzip`
- **傾印版本 (Dump Version)**：`1.16-0`
- **傾印格式 (Format)**：`CUSTOM`
- **來源資料庫版本**：`PostgreSQL 17.11`
- **執行傾印工具版本**：`pg_dump 17.11`

### 2. 業務資料表驗收 (36 業務資料表 + 1 Prisma 追蹤表)
經過濾 TOC 中 `public` Schema 之 `TABLE` 項目，確認 **37 張資料表** 100% 完整收錄：

```text
313; 1259 18046 TABLE public AIChatMessage postgres
312; 1259 18036 TABLE public AIChatSession postgres
288; 1259 17803 TABLE public Announcement postgres
289; 1259 17815 TABLE public AnnouncementRead postgres
287; 1259 17725 TABLE public AuditLog postgres
290; 1259 17823 TABLE public Certification postgres
296; 1259 17877 TABLE public CertificationEnrollment postgres
302; 1259 17935 TABLE public Class postgres
304; 1259 17953 TABLE public ClassAssignment postgres
303; 1259 17944 TABLE public ClassEnrollment postgres
285; 1259 17709 TABLE public EmailVerificationToken postgres
311; 1259 18024 TABLE public ExamAnswerSnapshot postgres
310; 1259 18014 TABLE public ExamAttempt postgres
309; 1259 18001 TABLE public ExamPaper postgres
286; 1259 17717 TABLE public PasswordResetToken postgres
307; 1259 17981 TABLE public PracticalProgress postgres
306; 1259 17973 TABLE public PracticalStep postgres
308; 1259 17992 TABLE public PracticalStepProgress postgres
305; 1259 17962 TABLE public PracticalTask postgres
292; 1259 17842 TABLE public Question postgres
299; 1259 17909 TABLE public QuestionBookmark postgres
293; 1259 17853 TABLE public QuestionOption postgres
294; 1259 17861 TABLE public QuestionTag postgres
295; 1259 17869 TABLE public QuestionTagRelation postgres
280; 1259 17667 TABLE public Role postgres
283; 1259 17692 TABLE public Session postgres
314; 1259 18055 TABLE public StudentWeaknessAnalysis postgres
300; 1259 17917 TABLE public StudyTimeLog postgres
291; 1259 17832 TABLE public Subject postgres
284; 1259 17700 TABLE public TeacherApplication postgres
301; 1259 17926 TABLE public TeacherProfile postgres
297; 1259 17887 TABLE public UnitProgress postgres
279; 1259 17658 TABLE public User postgres
282; 1259 17682 TABLE public UserProfile postgres
281; 1259 17674 TABLE public UserRole postgres
298; 1259 17899 TABLE public WrongQuestionRecord postgres
278; 1259 17649 TABLE public _prisma_migrations postgres
```

### 3. 枚舉型別驗收
- `1256; 1247 17796 TYPE public AnnouncementStatus postgres` 完整收錄。

---

## 五、Git 與工作目錄狀態

- **分支 (Branch)**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **工作目錄**：無任何 Git stage、commit、push、reset、clean 或 rebase 操作。

---

## 六、最高資安指標稽核表

| 稽核項目 | 規範指標要求 | 本次驗收實測結果 | 判定 |
| :--- | :--- | :--- | :---: |
| **雲端隔離性** | 嚴禁再次連線 Supabase | 零雲端網路傳輸，100% 本機離線驗算 | **PASS** |
| **資料庫保護** | 嚴禁執行 pg_restore 還原寫入 | 僅執行 `--list` 唯讀目錄掃描，零寫入 | **PASS** |
| **備份檔案保護** | 不得覆寫、修改或刪除備份 | 檔案採 `:ro` 掛載，唯讀完整性 100% | **PASS** |
| **資產留存** | 不得刪除既有備份目錄 | 既有所有備份完好留存 | **PASS** |
| **費用控制** | Free Plan 預算 $0.00 USD | 零付費操作，累計支出 $0.00 USD | **PASS** |

---

## 七、驗收最終結論

```text
================================================================================
  驗收結論：PASS — FIRST SUPABASE CLOUD BACKUP INDEPENDENTLY VERIFIED
  (CODE TO KNOW 第一次 Supabase 雲端備份產物通過獨立完整性、密碼學與結構驗收)
================================================================================
```

備份產物 `code_to_know_supabase_prod.dump` 經證實為結構完整、密碼學校驗無誤、可由 PostgreSQL 17 原生工具完全辨識之合法 Custom Format 邏輯備份。

**本階段任務正式完成。已依規定停止，未自行執行任何還原測試。靜候專案主管與使用者後續指示。**
