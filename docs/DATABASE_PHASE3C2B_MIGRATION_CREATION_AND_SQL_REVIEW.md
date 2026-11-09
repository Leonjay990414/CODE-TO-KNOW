# CODE TO KNOW（碼上學）
# PHASE 3C-2B：本機 Migration 草稿建立與 Migration SQL 安全審查報告

- **報告日期**：2026-11-08
- **執行階段**：PHASE 3C-2B（本機 Migration 草稿建立與 SQL 安全審查）
- **審查角色**：資深 PostgreSQL 資料庫架構師、Prisma Migration 專家、資料庫安全工程師、資料完整性審查員
- **目前 Git 分支**：`main`（HEAD: `765ff905f4a567be06cb89a162043f27065dfd82`）
- **本機資料庫目標**：Docker PostgreSQL 容器 `code_to_know_postgres`（127.0.0.1:5432 / 資料庫：`code_to_know`）

---

## 一、審查與執行摘要 (Executive Summary)

本階段為 **本機 Migration 草稿建立與 Migration SQL 安全審查**。在嚴格遵守使用者明確授權範疇、堅決阻斷破壞性操作（如 `prisma migrate reset`）的最高準則下，圓滿達成下列目標：

1. **Schema 關聯防禦強化**：已依授權修改 `backend/prisma/schema.prisma`，將 `ClassAssignment.examPaper` 與 `ClassAssignment.practicalTask` 之級聯刪除政策由 `Cascade` 全數改為 `Restrict`，防禦因試卷或術科題目異動而意外清空班級指派歷史之風險。
2. **非破壞性增量 DDL 萃取**：面對初始 Migration (`20261103000000_init`) 因 Windows 換行符差異導致的 Checksum 不符警告，果斷阻斷 Prisma 預設的 `migrate reset`（避免 DROP 本機資料庫導致現有 4 筆真實使用者資料遺失），改用 Prisma 官方標準之 `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`，成功且零風險地提取出 27 個新業務模型的純淨增量 Migration DDL。
3. **加入專用排他性約束 (XOR CHECK)**：於 Migration SQL 中納入 PostgreSQL 16 專用排他性條件 `ClassAssignment_target_xor_check`，強制保證每一筆班級指派任務必須「恰好關聯一個試卷」或「恰好關聯一個術科任務」（`num_nonnulls("examPaperId", "practicalTaskId") = 1`）。
4. **建立正式 Migration 草稿**：已建立 migration 目錄與腳本檔案 `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`（總長度 574 行，大小 27.8 KB）。
5. **程式碼與型別驗證**：
   - `prisma validate`：通過（Syntax & Relations Valid）。
   - `prisma generate`：通過（成功產出 Prisma Client v7.10.1）。
   - `tsc --noEmit`：通過（0 個 TypeScript 編譯錯誤）。
   - `vitest run`：通過（5 個測試檔案、92 項單元測試 100% 通過）。
6. **零寫入主資料庫保證**：本機 Docker PostgreSQL `code_to_know` 內既有 9 張資料表、4 筆 User 與 `_prisma_migrations` 記錄 100% 毫髮無傷，主資料庫未套用任何 DDL，亦無任何一筆資料遺失。

---

## 二、嚴格執行授權邊界合規確認

| 項目 | 規範狀態 | 實際執行情形 | 判定 |
|---|---|---|---|
| 修改 `backend/prisma/schema.prisma` | 使用者已授權 | 修改 `ClassAssignment` 關聯之 `onDelete: Restrict` | ✅ 合規 |
| 將 `ClassAssignment` 雙外鍵設為 Restrict | 使用者已授權 | `examPaper` 與 `practicalTask` 均為 `Restrict` | ✅ 合規 |
| 建立本機 Migration 草稿 | 使用者已授權 | 建立 `20261108000000_add_business_models/migration.sql` | ✅ 合規 |
| 加入 `ClassAssignment_target_xor_check` | 使用者已授權 | SQL 尾端已包含 PostgreSQL 16 `num_nonnulls` XOR 限制 | ✅ 合規 |
| 審查 Migration SQL | 使用者已授權 | 逐一審查 27 個 Model、1 個 Enum、38 條 FK 與 38 個索引 | ✅ 合規 |
| 執行驗證、生成、編譯與單元測試 | 使用者已授權 | `validate`、`generate`、`tsc`、`vitest` (92 測試) 全數通過 | ✅ 合規 |
| 產出遷移建立與安全審查報告 | 使用者已授權 | 本文即為完整交付報告 | ✅ 合規 |
| **執行 `prisma migrate dev`（不帶 create-only）** | **絕對禁止** | **未執行** | 🛡️ 安全 |
| **執行 `prisma migrate deploy`** | **絕對禁止** | **未執行** | 🛡️ 安全 |
| **執行 `prisma db push`** | **絕對禁止** | **未執行** | 🛡️ 安全 |
| **執行 `prisma migrate reset`** | **絕對禁止** | **未執行（遭遇提示時立即終止並改道安全機制）** | 🛡️ 安全 |
| **執行主資料庫 DDL / DML / Seed** | **絕對禁止** | **未執行任何寫入** | 🛡️ 安全 |
| **修改 Supabase 或環境變數** | **絕對禁止** | **未修改** | 🛡️ 安全 |
| **Git Commit / Push / Reset / Clean** | **絕對禁止** | **未執行** | 🛡️ 安全 |

---

## 三、Shadow Database 與初始 Migration Checksum 異象深度分析

### 3.1 異象現象還原

在嘗試執行 `npx prisma migrate dev --create-only` 準備建立草稿時，Prisma CLI 輸出以下診斷訊息並停止：

```text
The migration 20261103000000_init was modified after it was applied.
We need to reset the "public" schema at "127.0.0.1:5432"
Do you want to continue? All data will be lost.
```

### 3.2 根本原因分析 (Root Cause Analysis)

1. **資料庫記錄值**：
   - 資料庫 `_prisma_migrations` 資料表中，`20261103000000_init` 的 `checksum` 記錄值為：
     `2185e3a03ed86bdcaaaefbfe4ba39405bdcb9f3c0f415e5bf648ac8e8a64d915`
2. **本機磁碟檔案計算值**：
   - 本機 `backend/prisma/migrations/20261103000000_init/migration.sql` 經 Git 在不同平台（Windows / Linux）簽入簽出後，因換行符（CRLF vs LF）或微小空行差異，經 SHA-256 計算之雜湊值為：
     `ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29`
3. **Prisma CLI 防衛機制**：
   - Prisma 為了確保「本機 SQL 檔案」與「資料庫已套用記錄」完全一致，一旦偵測到 Checksum 不符，其預設流程會要求執行 `migrate reset`（即 DROP 資料庫後重建）。
   - **重大安全風險**：若在已有 4 名真實使用者與審查記錄的本機資料庫執行 reset，將會直接造成災難性的資料抹除！

### 3.3 專業架構防禦策略與解決方案

身為資料庫架構師與安全工程師，在「零資料遺失」的底線要求下，採取了以下非破壞性策略：

1. **果斷中斷自動重置**：堅決阻斷任何交互式 reset 提示。
2. **採用標準差分命令**：
   執行 Prisma 官方專門用於產出乾淨 DDL 腳本而不修改資料庫狀態的命令：
   ```bash
   npx prisma migrate diff \
     --from-config-datasource \
     --to-schema prisma/schema.prisma \
     --script
   ```
   此命令會直接以「目前資料庫內真實存在的 9 張資料表架構」為基準，比對 `schema.prisma`（36 個 Model），精確且乾淨地計算出純增量 SQL。
3. **狀態核實**：
   在將產出的 DDL 結合 XOR Check 儲存為 `backend/prisma/migrations/20261108000000_add_business_models/migration.sql` 後，執行 `npx prisma migrate status`，Prisma 正確識別：
   - 發現 2 個 migration。
   - `20261108000000_add_business_models` 處於未套用狀態（unapplied）。
   - 資料庫結構維持原狀，零干擾。

---

## 四、Migration SQL 內容全量安全審查

### 4.1 基本指標統計

- **檔案路徑**：`backend/prisma/migrations/20261108000000_add_business_models/migration.sql`
- **新增 Enum 數量**：1 個（`AnnouncementStatus`）
- **新增 Table 數量**：27 個
- **主鍵定義 (PRIMARY KEY)**：27 個（`AnnouncementRead_pkey`, `Certification_pkey`, ...）
- **複合主鍵**：1 個（`QuestionTagRelation_pkey` 於 `("questionId", "tagId")`）
- **外鍵約束 (FOREIGN KEY)**：38 條
- **索引數量 (CREATE INDEX / UNIQUE INDEX)**：38 個
- **自訂檢查條件 (CHECK CONSTRAINT)**：1 個（`ClassAssignment_target_xor_check`）
- **破壞性 DDL 語句 (DROP / TRUNCATE / ALTER DROP)**：**0 條**

---

### 4.2 27 個新增資料表盤點

| 編號 | 資料表名稱 (Table Name) | 所屬業務領域 | 主鍵 / 複合鍵 | 外鍵數量 | 索引數量 |
|---|---|---|---|---|---|
| 1 | `Announcement` | 系統公告 | `id` (PK) | 0 (authorId 未設強關聯) | 3 |
| 2 | `AnnouncementRead` | 系統公告 | `id` (PK) | 2 (announcementId, userId) | 2 |
| 3 | `Certification` | 證照與科目 | `id` (PK) | 0 | 1 (code UNIQUE) |
| 4 | `Subject` | 證照與科目 | `id` (PK) | 1 (certificationId) | 2 |
| 5 | `Question` | 題目與題庫 | `id` (PK) | 1 (subjectId) | 2 |
| 6 | `QuestionOption` | 題目與題庫 | `id` (PK) | 1 (questionId) | 1 |
| 7 | `QuestionTag` | 題目與題庫 | `id` (PK) | 0 | 1 (name UNIQUE) |
| 8 | `QuestionTagRelation` | 題目與題庫 | `(questionId, tagId)` (CPK) | 2 (questionId, tagId) | 1 |
| 9 | `CertificationEnrollment` | 學生進度 | `id` (PK) | 2 (userId, certificationId) | 2 |
| 10 | `UnitProgress` | 學生進度 | `id` (PK) | 2 (userId, subjectId) | 2 |
| 11 | `WrongQuestionRecord` | 學生進度 | `id` (PK) | 2 (userId, questionId) | 2 |
| 12 | `QuestionBookmark` | 學生進度 | `id` (PK) | 2 (userId, questionId) | 2 |
| 13 | `TeacherProfile` | 教師與班級 | `id` (PK) | 1 (userId UNIQUE) | 1 |
| 14 | `Class` | 教師與班級 | `id` (PK) | 2 (creatorId, certificationId) | 3 |
| 15 | `ClassEnrollment` | 教師與班級 | `id` (PK) | 2 (classId, studentId) | 2 |
| 16 | `ClassAssignment` | 教師與班級 | `id` (PK) | 3 (classId, examPaperId, practicalTaskId) | 3 |
| 17 | `PracticalTask` | 術科實作 | `id` (PK) | 0 | 1 (code UNIQUE) |
| 18 | `PracticalStep` | 術科實作 | `id` (PK) | 1 (taskId) | 2 |
| 19 | `PracticalProgress` | 術科實作 | `id` (PK) | 2 (userId, taskId) | 2 |
| 20 | `PracticalStepProgress` | 術科實作 | `id` (PK) | 2 (progressId, stepId) | 2 |
| 21 | `ExamPaper` | 模擬測驗 | `id` (PK) | 1 (certificationId) | 2 |
| 22 | `ExamAttempt` | 模擬測驗 | `id` (PK) | 2 (userId, examPaperId) | 2 |
| 23 | `ExamAnswerSnapshot` | 模擬測驗 | `id` (PK) | 2 (attemptId, questionId) | 2 |
| 24 | `AIChatSession` | AI 智慧輔導 | `id` (PK) | 1 (userId) | 2 |
| 25 | `AIChatMessage` | AI 智慧輔導 | `id` (PK) | 1 (sessionId) | 1 |
| 26 | `StudyTimeLog` | 統計與學習成效 | `id` (PK) | 1 (userId) | 2 |
| 27 | `StudentWeaknessAnalysis` | 統計與學習成效 | `id` (PK) | 2 (userId, subjectId) | 2 |

---

### 4.3 核心外鍵行為與保護機制審查

1. **`ClassAssignment` 雙目標外鍵保護（由 Cascade 修正為 Restrict）**：
   ```sql
   ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_examPaperId_fkey" 
     FOREIGN KEY ("examPaperId") REFERENCES "ExamPaper"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

   ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_practicalTaskId_fkey" 
     FOREIGN KEY ("practicalTaskId") REFERENCES "PracticalTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
   ```
   - **安全性判定**：合規且關鍵。當教師或管理員嘗試刪除已指派給班級學生的測驗試卷或術科題目時，資料庫會直接拒絕（RESTRICT），避免產生歷史作業與學生成績記錄孤兒或被意外連帶清空。

2. **`ExamAnswerSnapshot` 歷史作答保護政策**：
   ```sql
   ALTER TABLE "ExamAnswerSnapshot" ADD CONSTRAINT "ExamAnswerSnapshot_questionId_fkey" 
     FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

   ALTER TABLE "ExamAnswerSnapshot" ADD CONSTRAINT "ExamAnswerSnapshot_attemptId_fkey" 
     FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
   ```
   - **安全性判定**：合規。若題庫維護人員刪除題庫中的某道題目，歷史考試作答快照中的 `questionId` 會被設為 `NULL`，但該快照資料表本身仍完整保留作答快照文字（題目、選項、學生作答、給分），滿足教育科技平台對「歷史評量客觀不可變更」與法規遵循之要求。

3. **`ClassAssignment` 互斥條件 (XOR CHECK) 審查**：
   ```sql
   ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_target_xor_check" 
     CHECK (num_nonnulls("examPaperId", "practicalTaskId") = 1);
   ```
   - **安全性判定**：合規。使用 PostgreSQL 16 原生函數 `num_nonnulls`，嚴格保證在資料庫層次任何新增或更新之指派，`examPaperId` 與 `practicalTaskId` 當中非空值的個數必須「恰好為 1」。杜絕了兩者皆為空值（無效指派）或兩者皆有值（混淆指派）的資料污染可能。

---

## 五、PostgreSQL 資料庫現狀與資料完整性驗證 (Zero-Impact Verification)

在執行 Migration 差分與草稿建立後，對本機 Docker PostgreSQL 容器進行了現場查詢驗證：

```sql
SELECT 'User' as tbl, count(*) FROM "User"
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

### 查詢結果比對表

| 資料表名稱 | Phase 3C-2B.0.1 盤點筆數 | 本階段結束後盤點筆數 | 差異 (Delta) | 狀態判定 |
|---|---|---|---|---|
| `User` | 4 | 4 | 0 | ✅ 100% 完整無損 |
| `Role` | 3 | 3 | 0 | ✅ 100% 完整無損 |
| `UserRole` | 4 | 4 | 0 | ✅ 100% 完整無損 |
| `UserProfile` | 4 | 4 | 0 | ✅ 100% 完整無損 |
| `Session` | 3 | 3 | 0 | ✅ 100% 完整無損 |
| `TeacherApplication` | 2 | 2 | 0 | ✅ 100% 完整無損 |
| `EmailVerificationToken` | 4 | 4 | 0 | ✅ 100% 完整無損 |
| `PasswordResetToken` | 0 | 0 | 0 | ✅ 100% 完整無損 |
| `AuditLog` | 9 | 9 | 0 | ✅ 100% 完整無損 |
| `_prisma_migrations` | 1 | 1 | 0 | ✅ 僅含 init，未擅自寫入 |

- **結論**：本階段確實未對本機 Docker PostgreSQL 主資料庫執行任何 DDL 或 DML 操作，既有 4 名真實使用者與相關日誌 100% 安全無失。

---

## 六、工程工具鏈驗證結果

```text
1. Prisma Schema 語法與關聯驗證：
   npx --prefix backend prisma validate --schema backend/prisma/schema.prisma
   ==> The schema at backend\prisma\schema.prisma is valid 🚀 (Exit code 0)

2. Prisma Client 產出：
   npx --prefix backend prisma generate --schema backend/prisma/schema.prisma
   ==> Generated Prisma Client (v7.10.1) to .\backend\node_modules\@prisma\client (Exit code 0)

3. TypeScript 嚴格靜態型別編譯檢查：
   npx --prefix backend tsc --noEmit -p backend/tsconfig.json
   ==> 0 errors, 0 warnings (Exit code 0)

4. 單元與架構安全測試套件：
   npx --prefix backend vitest run --exclude "**/integration.db.test.ts"
   ==> Test Files: 5 passed (5)
       Tests: 92 passed (92)
       Duration: 1.19s (Exit code 0)
```

---

## 七、Phase 3C-2C 正式套用 Migration 前置建議與操作閘門

在未來獲取使用者明確授權進行 **Phase 3C-2C：本機 Migration 正式套用** 前，必須遵循以下操作指引：

1. **初始 Migration Checksum 校正**：
   由於 `20261103000000_init` 的本地檔案在不同作業系統間換行符差異導致 hash 不符，在正式執行 `prisma migrate dev` 或 `prisma migrate deploy` 前，應透過安全非破壞性指令完成標記：
   ```bash
   npx prisma migrate resolve --applied 20261103000000_init
   ```
   以消除 Prisma 對重置資料庫的誤判。
2. **正式套用新 Migration**：
   執行：
   ```bash
   npx prisma migrate deploy
   ```
   將 `20261108000000_add_business_models` 安全套用到本機 Docker PostgreSQL，正式建立 27 張資料表與 XOR CHECK。
3. **套用後驗證**：
   - 檢查 `_prisma_migrations` 是否成功增加 1 筆記錄，累計為 2 筆。
   - 檢查 `public` schema 資料表總數是否由 9 張擴充為 36 張（加上 migrations 記錄表為 37 張）。
   - 重新驗證 4 筆既有 User 資料是否完好如初。
