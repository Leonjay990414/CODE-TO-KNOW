# CODE TO KNOW（碼上學）
# PHASE 3C-2C.2-R1：Migration BOM 修復與受控重新套用報告

- **報告日期**：2026-11-08
- **執行階段**：PHASE 3C-2C.2-R1（Migration BOM 修復與受控重新套用）
- **審查角色**：PostgreSQL 資料庫管理工程師、Prisma Migration 部署工程師、資料安全與完整性審查員
- **任務性質**：AUTHORIZED BOM REPAIR & CONTROLLED RE-APPLICATION（使用者明確授權之 BOM 修復、失敗狀態重設與重新套用）
- **目前 Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（分支：`main`）
- **目標資料庫環境**：Docker PostgreSQL 容器 `code_to_know_postgres`（127.0.0.1:5432 / 資料庫：`code_to_know`）

---

## 一、執行摘要 (Executive Summary)

本階段遵照使用者授權，成功完成了 **Migration SQL BOM 移除**、**Prisma 失敗遷移狀態解除**、以及 **本機 Docker PostgreSQL 正式 Migration 重新套用**。

所有步驟依循防禦性操作準則，圓滿達成下列里程碑：

1. **BOM 精準切除**：使用 Node.js 讀取二進位 Buffer，僅精確切除開頭 3 個位元組之 UTF-8 BOM (`0xEF 0xBB 0xBF`)，SQL 實質內容、換行與語意 100% 保持一致。
2. **失敗狀態受控解除**：執行 `npx prisma migrate resolve --rolled-back 20261108000000_add_business_models`（退出碼 0），將 `applied_steps_count = 0` 之失敗嘗試安全標記為 rolled back，成功解除 P3018 鎖定。
3. **正式 Migration 套用成功**：執行 `npx prisma migrate deploy`（耗時 2,964 ms，退出碼 0），成功套用 `20261108000000_add_business_models`。
4. **資料庫架構正式擴增至 36 個 Model**：
   - 資料表總數由 10 張擴增為 **37 張**（36 個 Prisma Model 對應資料表 + 1 張 `_prisma_migrations`）。
   - 新增 1 個 Enum（`AnnouncementStatus`：DRAFT, PUBLISHED, ARCHIVED）。
   - 新增 39 條外鍵約束、38 個索引。
   - 核心排他約束 `ClassAssignment_target_xor_check` 經由 PostgreSQL 16 `num_nonnulls` 正式生效。
   - `ClassAssignment` 關聯 `onDelete` 正式確立為 `RESTRICT`。
   - `ExamAnswerSnapshot.questionId` 關聯 `onDelete` 正式確立為 `SET NULL`。
5. **原始資料 100% 毫髮無傷**：
   - 4 位真實使用者（整合測試學生 ×2、莊永婕、實測學生小明）全數完好。
   - 9 張既有核心資料表筆數維持原貌，外鍵孤兒數為 0，唯一鍵衝突數為 0。
6. **工程工具鏈與單元測試全數通過**：
   - `prisma validate`：通過（Valid 🚀）。
   - `prisma generate`：通過（Prisma Client v7.10.1 產出）。
   - `tsc --noEmit`：通過（0 個 TypeScript 編譯錯誤）。
   - `vitest run`：通過（5 個測試檔案，92 項單元測試 100% 通過）。

---

## 二、第一階段：確認現場 (Pre-Fix Verification)

在執行任何修改前，對目標資料庫及外部備份進行了嚴格核查：

| 檢驗項目 | 檢驗標準 | 實際核查結果 | 評定 |
|---|---|---|---|
| **Docker 容器** | 正常運行且 healthy | `healthy` (0 failing streak) | [PASS] |
| **目標資料庫** | `code_to_know` | `127.0.0.1:5432/code_to_know` | [PASS] |
| **外部備份檔案存在性** | 檔案存在 | 存在於外部安全目錄 | [PASS] |
| **外部備份 SHA-256** | `2DB27F8B817179D3...` | `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085` | [PASS] |
| **暫存還原庫** | `code_to_know_restore_test` | 存在於容器內 (`restore_test_exists = 1`) | [PASS] |
| **原始庫核心表** | 9 張核心表完整 | 9 張核心表全數在列 | [PASS] |
| **原始庫使用者** | 4 位使用者完整 | 4 位使用者記錄全數在列 | [PASS] |
| **`_prisma_migrations` 狀態** | 初始成功，新遷移 steps=0 | `init` 成功 (`applied_steps_count = 1`)<br/>`add_business_models` 失敗 (`applied_steps_count = 0`, `finished_at IS NULL`) | [PASS] |

---

## 三、第二階段：BOM 精準切除與指紋重新記錄

使用 Node.js 二進位處理模組讀取並處理 `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`：

### 3.1 修復前後二進位比對表

| 指標 | 修復前 (Before) | 修復後 (After) | 變更說明 |
|---|---|---|---|
| **檔案位元組長度** | 27,852 bytes | **27,849 bytes** | 精確切除 3 個位元組 |
| **開頭前 6 位元組** | `0xef 0xbb 0xbf 0x2d 0x2d 0x20` | `0x2d 0x2d 0x20 0x43 0x72 0x65` | 由 BOM 開頭變為 `-- Cre` |
| **UTF-8 BOM 存在性** | **True (有 BOM)** | **False (無 BOM)** | 徹底移除 BOM |
| **開頭文字** | `\u{feff}-- CreateEnum` | `-- CreateEnum` | 語法解析開頭乾淨 |
| **解碼字串內容一致性** | 基準字串 | 除 BOM 外字串完全一致 | 零 SQL 語意或空行變更 |
| **SHA-256 數位指紋** | `90eeb58c8fb03117dcbb2146bd78452a0decfa426e11c16f23350deee6025933` | **`c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c`** | 正式記錄新指紋 |

---

## 四、第三階段：解除失敗 Migration 狀態 (Resolve Rolled Back)

### 4.1 執行命令與輸出
在 `backend` 目錄執行：
```powershell
npx prisma migrate resolve --rolled-back 20261108000000_add_business_models
```

**終端完整輸出**：
```text
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "code_to_know", schema "public" at "127.0.0.1:5432"

Migration 20261108000000_add_business_models marked as rolled back.
```
- **退出碼**：`0`（耗時 2,242 ms）

### 4.2 資料庫記錄核實
查詢 `_prisma_migrations`：
- `20261108000000_add_business_models` 之 `rolled_back_at` 已被寫入時間戳記 `2026-11-08 03:57:15.674574+00`。
- 失敗鎖定狀態已正式解除。[PASS]

---

## 五、第四階段：重新套用 Migration (Deploy)

### 5.1 套用前狀態確認 (`prisma migrate status`)
```text
2 migrations found in prisma/migrations
Following migration have not yet been applied:
20261108000000_add_business_models

To apply migrations in production run prisma migrate deploy.
```
- **確認**：僅有唯一核准之 `20261108000000_add_business_models` 處於待套用狀態。

### 5.2 執行部署命令 (`prisma migrate deploy`)
```powershell
npx prisma migrate deploy
```

**終端完整輸出**：
```text
Loaded Prisma config from prisma.config.ts.
Prisma schema loaded from prisma\schema.prisma.
Datasource "db": PostgreSQL database "code_to_know", schema "public" at "127.0.0.1:5432"

2 migrations found in prisma/migrations

Applying migration `20261108000000_add_business_models`

The following migration(s) have been applied:

migrations/
  └─ 20261108000000_add_business_models/
    └─ migration.sql

All migrations have been successfully applied.
```
- **退出碼**：`0`（耗時 2,964 ms）
- **執行結果**：成功（All migrations have been successfully applied）。[PASS]

---

## 六、第五階段：成功後全量資料完整性驗證 (Post-Migration Verification)

### 6.1 資料表總數與清單核驗

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
==> 37
```

**37 張資料表全量清單**：
1. `AIChatMessage` (新)
2. `AIChatSession` (新)
3. `Announcement` (新)
4. `AnnouncementRead` (新)
5. `AuditLog` (原)
6. `Certification` (新)
7. `CertificationEnrollment` (新)
8. `Class` (新)
9. `ClassAssignment` (新)
10. `ClassEnrollment` (新)
11. `EmailVerificationToken` (原)
12. `ExamAnswerSnapshot` (新)
13. `ExamAttempt` (新)
14. `ExamPaper` (新)
15. `PasswordResetToken` (原)
16. `PracticalProgress` (新)
17. `PracticalStep` (新)
18. `PracticalStepProgress` (新)
19. `PracticalTask` (新)
20. `Question` (新)
21. `QuestionBookmark` (新)
22. `QuestionOption` (新)
23. `QuestionTag` (新)
24. `QuestionTagRelation` (新)
25. `Role` (原)
26. `Session` (原)
27. `StudentWeaknessAnalysis` (新)
28. `StudyTimeLog` (新)
29. `Subject` (新)
30. `TeacherApplication` (原)
31. `TeacherProfile` (新)
32. `UnitProgress` (新)
33. `User` (原)
34. `UserProfile` (原)
35. `UserRole` (原)
36. `WrongQuestionRecord` (新)
37. `_prisma_migrations` (遷移表)

- **結構結論**：原有 9 張核心表完整保留，新增 27 張業務表完整建立，合計 **36 個 Prisma Model 對應資料表** 100% 就緒！[PASS]

---

### 6.2 原始 9 張核心表筆數驗證

```sql
SELECT 'User' as tbl, count(*) FROM "User"
UNION ALL SELECT 'Role', count(*) FROM "Role"
...
```

| 資料表名稱 (Table Name) | 套用前筆數 | 套用後筆數 | 差異 (Delta) | 狀態評定 |
|---|:---:|:---:|:---:|:---:|
| `User` | **4** | **4** | 0 | [PASS] 100% 完整 |
| `Role` | **3** | **3** | 0 | [PASS] 100% 完整 |
| `UserRole` | **4** | **4** | 0 | [PASS] 100% 完整 |
| `UserProfile` | **4** | **4** | 0 | [PASS] 100% 完整 |
| `Session` | **3** | **3** | 0 | [PASS] 100% 完整 |
| `TeacherApplication` | **2** | **2** | 0 | [PASS] 100% 完整 |
| `EmailVerificationToken` | **4** | **4** | 0 | [PASS] 100% 完整 |
| `PasswordResetToken` | **0** | **0** | 0 | [PASS] 100% 完整 |
| `AuditLog` | **9** | **9** | 0 | [PASS] 100% 完整 |

---

### 6.3 關鍵約束與關聯行為現場驗證

現場查詢 PostgreSQL 系統目錄（`pg_constraint`, `pg_enum`）：

1. **Enum 驗證**：
   - `AnnouncementStatus`：包含 `DRAFT`, `PUBLISHED`, `ARCHIVED`（3 筆標籤完整）。[PASS]
2. **`ClassAssignment_target_xor_check` 排他約束**：
   ```sql
   CHECK ((num_nonnulls("examPaperId", "practicalTaskId") = 1))
   ```
   **正式存在於 `pg_constraint`**，排他性保證成立。[PASS]
3. **`ClassAssignment` 雙目標外鍵刪除保護**：
   - `ClassAssignment_examPaperId_fkey`：`confdeltype = 'r'` (RESTRICT)，`confupdtype = 'c'` (CASCADE)。
   - `ClassAssignment_practicalTaskId_fkey`：`confdeltype = 'r'` (RESTRICT)，`confupdtype = 'c'` (CASCADE)。
   - 刪除試卷或術科題目時，資料庫強制拒絕，歷史作業指派記錄不滅。[PASS]
4. **`ExamAnswerSnapshot.questionId` 解耦保護**：
   - `ExamAnswerSnapshot_questionId_fkey`：`confdeltype = 'n'` (SET NULL)。
   - 題庫題目刪除時，歷史作答快照文字與分數永存。[PASS]
5. **外鍵孤兒檢驗**：
   - 跨所有關聯表查詢，孤兒筆數為 **0**。[PASS]
6. **失敗 Migration 計數**：
   - `SELECT count(*) FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL AND "finished_at" IS NULL` = **0**。[PASS]

---

### 6.4 `_prisma_migrations` 最終歷史

| ID | Checksum | Migration 名稱 | Steps | Finished At | Rolled Back At | 狀態說明 |
|---|---|---|:---:|---|---|---|
| `f5899e80...` | `2185e3a0...` | `20261103000000_init` | 1 | `2026-11-03 13:49:46` | NULL | 初始遷移（成功） |
| `50170031...` | `90eeb58c...` | `20261108000000_add_business_models` | 0 | NULL | `2026-11-08 03:57:15` | 初次 BOM 失敗（已安全回滾） |
| `adfc015e...` | `c9eaba10...` | `20261108000000_add_business_models` | 1 | `2026-11-08 03:57:35` | NULL | **無 BOM 重新套用（成功套用）** |

---

## 七、工程測試與型別檢查結果

在正式資料庫架構擴展至 36 個 Model 後，執行工程測試鏈：

```text
1. Prisma Schema 驗證：
   npx --prefix backend prisma validate --schema backend/prisma/schema.prisma
   ==> The schema at backend\prisma\schema.prisma is valid 🚀 (Exit code 0) [PASS]

2. Prisma Client 重新產出：
   npx --prefix backend prisma generate --schema backend/prisma/schema.prisma
   ==> Generated Prisma Client (v7.10.1) in 290ms (Exit code 0) [PASS]

3. TypeScript 嚴格編譯檢查：
   npx --prefix backend tsc --noEmit -p backend/tsconfig.json
   ==> 0 errors, 0 warnings (Exit code 0) [PASS]

4. 單元與架構安全測試套件：
   npx --prefix backend vitest run --exclude "**/integration.db.test.ts"
   ==> Test Files: 5 passed (5)
       Tests: 92 passed (92)
       Duration: 1.22s (Exit code 0) [PASS]
```
*(依規範，資料庫整合測試未執行，不宣告為通過)*

---

## 八、Git 當前狀態核實

- **目前分支**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **變更檔案核實**：
  - `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`（BOM 已移除，為乾淨 UTF-8）。
  - 17 個未暫存之既有文檔與前端檔案維持原貌，未受任何干擾。
- **未執行任何 Git 操作**：零 Stage、零 Commit、零 Push、零 Clean。

---

## 九、尚存風險與後續實作注意要點

1. **`PracticalStepProgress` 跨版本一致性**：
   - 經架構核對，資料庫層級保證 `(progressId, stepId)` 唯一性，但跨表驗證（確保 Step 屬於該 Progress 的 Task）應在後續 `PracticalService` 業務邏輯中落實檢查。[WARN: 需 Service 層防護]
2. **初始 Migration Checksum 歷史殘留**：
   - 初始遷移之 `_prisma_migrations` 與 Git 記錄差異依然保留，未來在開發環境執行 `prisma migrate dev` 前，應避免直接觸發 reset，持續依循生產部署導向之受控流程。
3. **備份與暫存資料庫保留**：
   - 外部備份檔案（`2DB27F8B...`）與容器內暫存庫 `code_to_know_restore_test` 依指示完整保留，未自行刪除。

---

## 十、最終結論與停止宣告

> **【最終結論】**  
> **CODE TO KNOW（碼上學）專案已安全、受控且圓滿地完成本機 Docker PostgreSQL 27 個業務 Model 的正式 Migration 套用！**  
> **目前本機資料庫已具備完整的 36 個 Prisma Model 資料表，原有 4 位使用者資料與核心系統完全無損，工程工具鏈與單元測試全數綠燈通過。**

依據規範，本階段任務已全數完成並立即停止：
- 未刪除備份檔案。
- 未刪除暫存還原資料庫。
- 未操作 Supabase 或雲端服務。
- 未執行 Git Commit 或 Push。

靜候使用者審閱本報告！
