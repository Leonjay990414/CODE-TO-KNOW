# CODE TO KNOW（碼上學）
# PHASE 3C-4A-R0：Supabase 正式 Migration 前最後安全審查報告

**審查日期**：2026-11-08  
**審查團隊**：PostgreSQL DBA、Prisma ORM 7 專家、Supabase 雲端工程師、資安審查工程師  
**審查性質**：正式部署前獨立最後安全審查（Strictly Read-Only Pre-flight Gate Review）  
**目標專案**：`code-to-know-prod`（Project Ref: `ypibmyfxfhsyfdwxprpi`，AWS Sydney `ap-southeast-2`）  

> [!IMPORTANT]
> **本階段為唯讀最後安全審查，未對 Supabase 執行 Migration、DDL 或任何資料庫寫入。**  
> 全程嚴格遵守費用保護（$0.00 USD）、零資料庫變更、機密零落地與既有備份無損原則。

---

## 一、Git 分支、HEAD 與工作區狀態

### 1. 執行前後 Git 狀態稽核
- **當前分支**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **上游追蹤**：`origin/main`（同步最新狀態）
- **工作區保護現況**：
  - 既有工作區之暫存與未暫存檔案全數保留，未執行任何 `git restore`、`git clean`、`git reset`。
  - 本審查全程未執行任何 `git add`、`git commit`、`git push` 或 `git deploy`。

---

## 二、Migration 檔案實體完整性與結構核對

### 1. 實體檔案與雜湊校驗
對本機兩組 Migration SQL 檔案進行二進位位元組檢查：

| 遷移目錄名稱 | 檔案路徑 | 檔案大小 | UTF-8 BOM | SHA-256 雜湊值 |
| :--- | :--- | :---: | :---: | :--- |
| **`20261103000000_init`** | `backend/prisma/migrations/20261103000000_init/migration.sql` | 6,164 bytes | **無** (純 UTF-8) | `ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29` |
| **`20261108000000_add_business_models`** | `backend/prisma/migrations/20261108000000_add_business_models/migration.sql` | 27,849 bytes | **無** (純 UTF-8) | `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c` |

### 2. 資料表結構與數量核對（9 + 27 = 36 張）
- **第一組 `20261103000000_init`（9 張表）**：
  `User`, `Role`, `UserRole`, `UserProfile`, `Session`, `TeacherApplication`, `EmailVerificationToken`, `PasswordResetToken`, `AuditLog`。
- **第二組 `20261108000000_add_business_models`（27 張表 + 1 組 Enum）**：
  - Native Enum：`AnnouncementStatus` (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
  - 27 張業務表：`Announcement`, `AnnouncementRead`, `Certification`, `Subject`, `Question`, `QuestionOption`, `QuestionTag`, `QuestionTagRelation`, `CertificationEnrollment`, `UnitProgress`, `WrongQuestionRecord`, `QuestionBookmark`, `StudyTimeLog`, `TeacherProfile`, `Class`, `ClassEnrollment`, `ClassAssignment`, `PracticalTask`, `PracticalStep`, `PracticalProgress`, `PracticalStepProgress`, `ExamPaper`, `ExamAttempt`, `ExamAnswerSnapshot`, `AIChatSession`, `AIChatMessage`, `StudentWeaknessAnalysis`。
- **合計**：**36 張業務資料表**，與 `backend/prisma/schema.prisma` 之 36 個 Models 嚴格 1:1 對齊。

### 3. Checksum 鑑識結論再次確認
- 原始 Init Migration 在本機資料庫之 hash（`2185e3a0...`）經由 Git 懸置 Blob `6c4c39ff...` 證實與現行檔案（`ed5b504a...`）**僅相差結尾 1 個位元組之換行符號（`\n\n` vs `\n`），SQL 語句 100% 完全相同**。
- 依據最高原則：**嚴禁修改原始 Migration 檔案或本機歷史記錄**。雲端為全新庫，將直接以現行標準檔案寫入，部署無虞。

### 4. SQL 安全性與危險關鍵字檢查
- 全文掃描：未包含任何 `DROP TABLE`、`TRUNCATE`、`DELETE FROM`、`UPDATE`、`GRANT`、`REVOKE`、`ALTER USER`、`CREATE EXTENSION` 等破壞性或超權限語句。
- 程式中出現之 `ON UPDATE CASCADE` 全數為外鍵完整性約束條款，屬標準合規 DDL。

---

## 三、Prisma 連線架構與安全設定審查

### 1. 連線設定與 URL 優先度
- 依據 `backend/prisma.config.ts` 與 `backend/src/config/db-validation.ts`：
  - 雲端模式（`MIGRATION_ENV=cloud`）僅接受 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL`，**絕對不回退至本機 `DATABASE_URL`**。
  - 為防範 Supabase Free 方案之 Direct Connection（`db.<ref>.supabase.co:5432`）為 IPv6-only，遷移指引與執行指令碼中**強制移除 `DIRECT_URL`**，完全由 `MIGRATION_DATABASE_URL` 導向支援 IPv4 的 Session Pooler。

### 2. 連線端點與參數強制規範
- **Host**：`aws-0-ap-southeast-2.pooler.supabase.com`
- **Port**：`5432`（Session Pooler，**代碼層已硬性封鎖 Transaction Pooler 6543**）
- **Database**：`postgres`
- **User**：`postgres.ypibmyfxfhsyfdwxprpi`
- **強制連線參數**：
  - `sslmode=require`：強制 TLS 傳輸加密。
  - `sslcert=C:/Users/.../supabase-root.crt`：載入官方 Root CA 憑證。
  - `sslaccept=strict`：強制執行嚴格憑證鏈與主機名稱（SAN: `*.pooler.supabase.com`）核對。
  - `connect_timeout=15`：消除跨洲（台灣至雪梨）網路延遲造成的 5 秒預設 Socket Timeout。
  - `connection_limit=1`：限制遷移工具僅佔用 1 條連線，保護 Nano Compute 連線池。
- **機密零殘留**：經實測當前終端環境變數，`MIGRATION_DATABASE_URL`、`DIRECT_URL`、`DATABASE_URL`、`SUPABASE_DB_PASSWORD` 皆處於 `[NOT SET]` 狀態，無任何機密外洩或殘留。

---

## 四、安全執行腳本審查（Scratch Scripts Security Audit）

針對放置於專屬暫存區（`scratch/`）的三個腳本進行代碼級安全稽核：

| 腳本名稱 | 檔案 SHA-256 | 敏感資料處理方式 | SQL 寫入檢查 | 記憶體清除機制 | 審查判定 |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **`verify_cloud_readonly.cjs`** | `6dd4792c...` | 終端機 Raw Mode `*` 遮罩輸入 | 零寫入 (僅 SELECT) | 行程結束自動銷毀 | `PASS` |
| **`run_cloud_migrate_status.ps1`**| `ea81a739...` | `Read-Host -AsSecureString` 完全無回顯 | 零寫入 (僅 migrate status) | `finally` 區塊強制 Remove-Item | `PASS` |
| **`run_cloud_migrate_status.cjs`**| `3e7f02e6...` | 終端機 Raw Mode `*` 遮罩輸入 | 零寫入 (僅 migrate status) | 行程結束前刪除環境變數物件 | `PASS` |

- **共同安全防護特性**：
  1. 絕無硬編碼密碼或連線字串。
  2. 密碼絕不作為命令列參數傳遞（避免在行程清單 `ps` / 工作管理員中暴露）。
  3. 絕不寫入 `.env` 或任何磁碟檔案。
  4. 絕不向主控台輸出密碼或完整連線字串。

---

## 五、Supabase 雲端目標與 Prisma 唯讀狀態核對

### 1. 雲端實體狀態
- **專案名稱**：`code-to-know-prod`
- **專案識別**：`ypibmyfxfhsyfdwxprpi`（AWS Sydney `ap-southeast-2`）
- **PostgreSQL 核心版本**：`PostgreSQL 17.11`
- **`public` 綱要資料表數**：**0 張**（100% 潔淨狀態）
- **`_prisma_migrations` 表**：**不存在**（尚未進行過任何遷移）
- **自訂 Enum / Trigger / Function**：**0 組**
- **計費方案**：**Free Plan ($0.00 USD)**

### 2. Prisma CLI 唯讀診斷結果（`prisma migrate status`）
- **端點鎖定**：`aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`
- **TLS 驗證**：TLSv1.3，嚴格校驗官方 Root CA（`supabase-root.crt`，有效至 2031 年）。
- **認證結果**：已於 Phase 3C-3H-R2 正式完成 SASL SCRAM 認證，成功連通。
- **Migration 狀態判定**：
  - 本機磁碟 2 組 Migration（`init` 與 `add_business_models`）已被 Prisma 精確辨識。
  - 雲端狀態回報：**2 migrations pending（待套用狀態）**。
  - 執行過程未建立任何資料表，未執行任何 DDL/DML。

---

## 六、綜合檢查矩陣（Pass / Warn / Fail / Blocked）

| 審查維度 | 檢查項目 | 實際狀態與證據 | 判定 |
| :--- | :--- | :--- | :---: |
| **版本與資產** | Git HEAD Commit | `765ff905f4a567be06cb89a162043f27065dfd82` | `PASS` |
| | 本地備份檔案 | SHA-256: `2DB27F8B...` 無損存在 | `PASS` |
| | 兩組 Migration 檔案 | 9 表 + 27 表 = 36 業務表，零 BOM，雜湊吻合 | `PASS` |
| **連線與安全性** | Session Pooler 5432 | 強制鎖定 Port 5432，封鎖 Port 6543 | `PASS` |
| | IPv6 直連防禦 | 停用 `DIRECT_URL`，全面走 IPv4 Pooler | `PASS` |
| | TLS 1.3 與 Root CA | 官方 `sslcert` 與 `sslaccept=strict` 實測通過 | `PASS` |
| | 跨洲逾時防禦 | `connect_timeout=15` 實測解決 5 秒超時問題 | `PASS` |
| | 機密保護機制 | 互動式遮罩輸入，記憶體即刻清理，無落地 | `PASS` |
| **雲端目標狀態** | 雲端 public 綱要 | 0 張資料表，0 組遷移記錄，純淨初始態 | `PASS` |
| | 雲端計費方案 | Free Plan，無付費 Add-on，累積費用 $0.00 | `PASS` |
| **相容性與復原** | PG 16 → 17 相容性 | 語法、型別、內建函數與諮詢鎖 100% 相容 | `PASS` |
| | 失敗處置計畫 | 剔除自動 DROP SCHEMA，改採決策樹受控處理 | `PASS` |

---

## 七、尚未解決的風險與上線後建議

1. **本機 Init Migration 結尾 1-byte 換行歷史記錄**：
   - 現狀：本機 `_prisma_migrations` 與磁碟檔案存在 1-byte 歷史差異，此差異不影響雲端首次部署。
   - 處置：維持現狀，嚴禁手動篡改本機歷史。
2. **Runtime 程式碼 CA 整合（上線前工作）**：
   - 現狀：`backend/src/config/database.ts` 目前依賴系統憑證庫。
   - 建議：在 Migration 部署完成後、Express 應用程式正式部署前，將 `ca: fs.readFileSync(...)` 正式納入 `database.ts`。

---

## 八、最終審查判定

# **GO**

### 判定依據：
1. **所有必要安全檢查 100% 通過（PASS）**。
2. Prisma 7 CLI、Root CA 憑證鏈、Session Pooler 5432 連線、跨洲逾時保護與 SASL 認證均已通過完整實體檢驗。
3. 雲端目標資料庫確認處於 0 資料表的全新潔淨狀態，本機 36 個 Models 的 2 組 Migration 已就緒。
4. 全程落實密碼不落地、資料庫零寫入、費用維持 **$0.00 USD**。
5. **已完全具備提交使用者進行「正式 Migration 部署確認」之條件**。

---

> [!NOTE]
> **本階段為審查判定，尚未對 Supabase 執行 Migration 或資料庫寫入。請等待使用者確認授權後，方可進入下一階段執行正式部署。**
