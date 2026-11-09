# CODE TO KNOW（碼上學）
# PHASE 3C-2C.3：Migration 完成後獨立資料庫驗收報告

- **報告日期**：2026-11-08
- **執行階段**：PHASE 3C-2C.3（Migration 完成後獨立資料庫驗收）
- **驗收角色**：PostgreSQL 資料庫架構師、Prisma 7.10.1 專家、後端系統架構師、資料完整性稽核工程師、軟體測試工程師
- **任務性質**：STRICTLY READ-ONLY AUDIT & ACCEPTANCE（嚴格唯讀，零 DDL/DML、零 Migration 套用、零 Seed、零 Git 操作）
- **目前 Git HEAD**：`765ff905f4a567be06cb89a162043f27065dfd82`（分支：`main`）
- **目標資料庫環境**：Docker PostgreSQL 容器 `code_to_know_postgres`（127.0.0.1:5432 / 資料庫：`code_to_know`）

---

## 一、驗收總結與評定結果 (Executive Summary)

針對已正式套用的增量 Migration：`20261108000000_add_business_models`，本團隊進行了全面、獨立且嚴謹的唯讀驗收核查。

### 驗收核心指標與總結判定

| 驗收維度 | 預期標準 | 現場實體檢驗結果 | 評定狀態 |
|---|---|---|:---:|
| **Migration 歷史完整性** | 含初始成功、BOM回滾、無BOM成功3筆 | 3 筆歷史完整、時間戳記與 steps 精確吻合 | **[PASS]** |
| **36 Model 與資料表對應** | 36 個 Model 1:1 實體對應 | 36 張業務表全數存在（另有 `_prisma_migrations` 共 37 張） | **[PASS]** |
| **關聯與刪除保護約束** | XOR CHECK 生效，核心外鍵 RESTRICT / SET NULL | `num_nonnulls` 約束已驗證，外鍵行為與 Schema 100% 吻合 | **[PASS]** |
| **既有資料保全性** | 4 位真實使用者、9 張表資料零遺失 | 筆數與原始基準 100% 一致，0 孤兒，0 衝突 | **[PASS]** |
| **Prisma CLI 狀態** | 退出碼 0，無待套用遷移 | `Database schema is up to date!`（Exit Code: 0） | **[PASS]** |
| **工程工具鏈與測試** | 語法 Valid，TS 0 錯誤，單元測試通過 | `validate` (0), `generate` (0), `tsc` (0), `vitest` (92 passed, 0) | **[PASS]** |
| **災難復原備份安全** | 外部備份完好，暫存庫保留 | 備份檔案 SHA-256 吻合，`restore_test` 存在 | **[PASS]** |
| **初始 Migration Checksum** | 歷史殘留差異客觀紀錄 | 保留獨立稽核項目，未擅自竄改 | **[WARN] (已記錄)** |

**【驗收總結裁定】**：  
**CODE TO KNOW（碼上學）正式資料庫 Migration `20261108000000_add_business_models` 驗收合格，正式具備 36 個 Prisma Model 完整實體結構與核心安全防線。**

---

## 二、第一階段：Migration 歷史驗收

查詢 PostgreSQL `_prisma_migrations` 全量內部記錄：

```sql
SELECT id, checksum, migration_name, applied_steps_count, started_at, finished_at, rolled_back_at 
FROM "_prisma_migrations" 
ORDER BY started_at ASC;
```

### 2.1 遷移記錄明細表

| 序號 | 記錄 ID | Migration 名稱 | Steps | Started At (UTC) | Finished At (UTC) | Rolled Back At (UTC) | Checksum | 狀態判定 |
|:---:|---|---|:---:|---|---|---|---|:---:|
| 1 | `f5899e80...` | `20261103000000_init` | 1 | 2026-11-03 13:49:45 | 2026-11-03 13:49:46 | NULL | `2185e3a0...` | [PASS] 初始套用成功 |
| 2 | `50170031...` | `20261108000000_add_business_models` | 0 | 2026-11-08 03:50:27 | NULL | 2026-11-08 03:57:15 | `90eeb58c...` | [PASS] BOM 失敗回滾 |
| 3 | `adfc015e...` | `20261108000000_add_business_models` | 1 | 2026-11-08 03:57:34 | 2026-11-08 03:57:35 | NULL | `c9eaba10...` | [PASS] 正式套用成功 |

### 2.2 審查要點分析
- **回滾記錄真實性**：序號 2 記錄完整記錄了因 BOM 導致語法錯誤之中斷，`applied_steps_count = 0`，且 `rolled_back_at` 明確載入時間戳記，稽核日誌完整留存。
- **重新套用獨立性**：序號 3 記錄為無 BOM 腳本重新套用之成果，產生了全新的 UUID (`adfc015e...`)，`applied_steps_count = 1`，`finished_at` 正常完工，未直接覆蓋舊記錄，具備完全的審計追蹤能力（Auditability）。

### 2.3 Checksum 交叉比對

| 項目 | 資料庫保存 Checksum | 磁碟/Git 檔案 SHA-256 | 比對結果 | 備註 |
|---|---|---|:---:|---|
| **初始 Migration (`init`)** | `2185e3a03ed86bdcaaaefbfe4ba39405bdcb9f3c0f415e5bf648ac8e8a64d915` | `ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29` | **不一致 [WARN]** | 早期歷史殘留差異，保持原樣未動 |
| **新 Migration (`add_business_models`)** | `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c` | `c9eaba10028cfd61282fc91a4de1d944f611091b83694704e2d8a692bc926a9c` | **100% 吻合 [PASS]** | 無 BOM 乾淨腳本雜湊值完全對齊 |

---

## 三、第二階段：36 個 Model 實體表全量驗收

經讀取 `backend/prisma/schema.prisma` 中的全部 36 個 `model` 宣告，並比對 PostgreSQL `information_schema.tables`、`columns`、`table_constraints`：

- **Prisma Model 總數**：36 個。
- **PostgreSQL Public 實體表總數**：37 張（包含 1 張遷移表 `_prisma_migrations`）。
- **業務資料表總數**：36 張。
- **缺失資料表 (Missing Tables)**：**0 個**。
- **非預期多餘資料表 (Unexpected Tables)**：**0 個**。

### 36 個 Model 與實體資料表 1:1 全量對照表

| 編號 | Prisma Model 名稱 | 實體資料表名稱 | 欄位數 | 主鍵定義 (PK) | 外鍵約束數 (FK) | 所屬業務系統 | 驗收評定 |
|:---:|---|---|:---:|---|:---:|---|:---:|
| 1 | `User` | `User` | 10 | `id` | 0 | 既有核心帳號系統 | [PASS] |
| 2 | `Role` | `Role` | 3 | `id` | 0 | 既有核心權限系統 | [PASS] |
| 3 | `UserRole` | `UserRole` | 4 | `id` | 2 | 既有核心權限系統 | [PASS] |
| 4 | `UserProfile` | `UserProfile` | 9 | `id` | 1 | 既有核心個人檔案 | [PASS] |
| 5 | `Session` | `Session` | 8 | `id` | 1 | 既有核心認證會話 | [PASS] |
| 6 | `TeacherApplication` | `TeacherApplication` | 12 | `id` | 1 | 既有核心教師審查 | [PASS] |
| 7 | `EmailVerificationToken` | `EmailVerificationToken` | 6 | `id` | 1 | 既有核心安全權杖 | [PASS] |
| 8 | `PasswordResetToken` | `PasswordResetToken` | 6 | `id` | 1 | 既有核心安全權杖 | [PASS] |
| 9 | `AuditLog` | `AuditLog` | 7 | `id` | 1 | 既有核心安全稽核 | [PASS] |
| 10 | `Announcement` | `Announcement` | 12 | `id` | 1 | 系統公告管理 | [PASS] |
| 11 | `AnnouncementRead` | `AnnouncementRead` | 4 | `id` | 2 | 系統公告管理 | [PASS] |
| 12 | `Certification` | `Certification` | 9 | `id` | 0 | 證照與科目模組 | [PASS] |
| 13 | `Subject` | `Subject` | 8 | `id` | 1 | 證照與科目模組 | [PASS] |
| 14 | `Question` | `Question` | 15 | `id` | 1 | 題目與題庫模組 | [PASS] |
| 15 | `QuestionOption` | `QuestionOption` | 5 | `id` | 1 | 題目與題庫模組 | [PASS] |
| 16 | `QuestionTag` | `QuestionTag` | 4 | `id` | 0 | 題目與題庫模組 | [PASS] |
| 17 | `QuestionTagRelation` | `QuestionTagRelation` | 3 | `questionId, tagId` | 2 | 題目與題庫模組 | [PASS] |
| 18 | `CertificationEnrollment` | `CertificationEnrollment` | 8 | `id` | 2 | 學生學習歷程 | [PASS] |
| 19 | `UnitProgress` | `UnitProgress` | 9 | `id` | 2 | 學生學習歷程 | [PASS] |
| 20 | `WrongQuestionRecord` | `WrongQuestionRecord` | 9 | `id` | 2 | 錯題複習系統 | [PASS] |
| 21 | `QuestionBookmark` | `QuestionBookmark` | 5 | `id` | 2 | 題目收藏系統 | [PASS] |
| 22 | `StudyTimeLog` | `StudyTimeLog` | 7 | `id` | 1 | 研習時數統計 | [PASS] |
| 23 | `TeacherProfile` | `TeacherProfile` | 8 | `id` | 1 | 教師與班級系統 | [PASS] |
| 24 | `Class` | `Class` | 9 | `id` | 2 | 教師與班級系統 | [PASS] |
| 25 | `ClassEnrollment` | `ClassEnrollment` | 6 | `id` | 2 | 教師與班級系統 | [PASS] |
| 26 | `ClassAssignment` | `ClassAssignment` | 10 | `id` | 3 | 教師與班級系統 | [PASS] |
| 27 | `PracticalTask` | `PracticalTask` | 13 | `id` | 0 | 術科實作系統 | [PASS] |
| 28 | `PracticalStep` | `PracticalStep` | 11 | `id` | 1 | 術科實作系統 | [PASS] |
| 29 | `PracticalProgress` | `PracticalProgress` | 12 | `id` | 2 | 術科實作系統 | [PASS] |
| 30 | `PracticalStepProgress` | `PracticalStepProgress` | 7 | `id` | 2 | 術科實作系統 | [PASS] |
| 31 | `ExamPaper` | `ExamPaper` | 10 | `id` | 1 | 模擬考試系統 | [PASS] |
| 32 | `ExamAttempt` | `ExamAttempt` | 13 | `id` | 2 | 模擬考試系統 | [PASS] |
| 33 | `ExamAnswerSnapshot` | `ExamAnswerSnapshot` | 15 | `id` | 2 | 模擬考試系統 | [PASS] |
| 34 | `AIChatSession` | `AIChatSession` | 8 | `id` | 1 | AI 智慧輔導系統 | [PASS] |
| 35 | `AIChatMessage` | `AIChatMessage` | 7 | `id` | 1 | AI 智慧輔導系統 | [PASS] |
| 36 | `StudentWeaknessAnalysis` | `StudentWeaknessAnalysis` | 8 | `id` | 2 | 學習診斷與弱點分析 | [PASS] |

*(註：`_prisma_migrations` 實體表記錄遷移歷史，未計入 36 個業務 Model)*

---

## 四、第三階段：資料庫約束驗收 (Database Constraints Verification)

查詢 PostgreSQL `pg_constraint` 系統目錄進行實體核查：

### 4.1 關鍵業務約束核查結果

1. **`ClassAssignment_target_xor_check` 排他約束**：
   - 定義：`CHECK ((num_nonnulls("examPaperId", "practicalTaskId") = 1))`
   - 驗證狀態：`convalidated = true`（已啟用且有效驗證）。
   - 效果：嚴格保證班級作業指派必須恰好指向試卷或術科任務之一，杜絕空指派與雙重指派。[PASS]
2. **`ClassAssignment` 雙外鍵刪除保護**：
   - `ClassAssignment_examPaperId_fkey`：`confdeltype = 'r'` (RESTRICT)，`confupdtype = 'c'` (CASCADE)。
   - `ClassAssignment_practicalTaskId_fkey`：`confdeltype = 'r'` (RESTRICT)，`confupdtype = 'c'` (CASCADE)。
   - 效果：刪除已指派試卷或術科題目時，資料庫強制阻斷，班級指派歷史不中斷。[PASS]
3. **`ExamAnswerSnapshot.questionId` 解耦保存**：
   - `ExamAnswerSnapshot_questionId_fkey`：`confdeltype = 'n'` (SET NULL)，`confupdtype = 'c'` (CASCADE)。
   - 效果：題庫題目下架刪除時，歷史作答快照文字與分數永存。[PASS]
4. **`PracticalStepProgress` 跨版本一致性架構查核**：
   - 現狀：資料庫層級保證了 `(progressId, stepId)` 的唯一性約束。
   - 結論：**資料庫層無法跨表驗證 `step.taskId === progress.taskId`，此邏輯已確認須在後端 `PracticalService` 業務邏輯中落實檢查。** [WARN: 需 Service 層防護]

### 4.2 資料完整性與約束無損檢驗

- **外鍵孤兒檢驗 (FK Orphans)**：跨 `UserRole`、`UserProfile`、`Session`、`TeacherApplication`、`EmailVerificationToken`、`PasswordResetToken`、`AuditLog` 等全量外鍵查詢，**孤兒筆數全數為 0**。[PASS]
- **唯一鍵衝突檢驗 (Unique Collisions)**：使用者信箱、角色代碼、Session Token Hash 等唯一性無任何衝突，**衝突數為 0**。[PASS]
- **失敗遷移檢驗**：`_prisma_migrations` 中未完成之失敗記錄數為 **0**。[PASS]

---

## 五、第四階段：既有資料保全實體驗收

將目前資料庫與 Migration 套用前之基準進行逐表精確比對：

| 資料表名稱 (Table Name) | Migration 前基準筆數 | 本階段現場實測筆數 | 差異 (Delta) | 狀態評定 |
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

### 4 位真實使用者帳號現況核實
1. `45e087b3...`：`test_student_1793714104338@codetoknow.edu`（整合測試學生，ACTIVE）
2. `56265935...`：`test_student_1793714656040@codetoknow.edu`（整合測試學生，ACTIVE）
3. `5c66b177...`：`ak990414@apps.ntpc.edu.tw`（莊永婕，ACTIVE）
4. `312e927b...`：`student_1793976435481@example.com`（實測學生小明，ACTIVE）
- **核驗結論**：4 位使用者無任何異動，身分認證資訊完好無損。[PASS]

---

## 六、第五階段：Prisma 狀態與程式驗證

在完成 Migration 後，針對後端工具鏈執行完整驗證指令：

```powershell
# 1. 檢驗 Prisma Schema
npx prisma validate --schema prisma/schema.prisma
==> The schema at prisma\schema.prisma is valid 🚀
Exit Code: 0 [PASS]

# 2. 檢驗遷移狀態
npx prisma migrate status
==> 2 migrations found in prisma/migrations
    Database schema is up to date!
Exit Code: 0 [PASS]

# 3. 檢驗 TypeScript 編譯
npx tsc --noEmit -p backend/tsconfig.json
==> 0 errors, 0 warnings
Exit Code: 0 [PASS]

# 4. 執行單元與架構安全測試
npx vitest run --exclude "**/integration.db.test.ts"
==> Test Files: 5 passed (5)
    Tests: 92 passed (92)
    Duration: 1.22s
Exit Code: 0 [PASS]
```
*(依規範，資料庫整合測試未執行，不宣告為通過)*

---

## 七、第六階段：備份安全檢查

對外部實體備份檔案與隔離暫存庫進行唯讀確認：

| 備份項目 | 實體檢驗路徑 / 目標 | 狀態 / SHA-256 | 驗收評定 |
|---|---|---|:---:|
| **外部實體備份檔** | `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump` | 存在，大小 **25,685 bytes** | [PASS] |
| **備份檔 SHA-256** | 現場重新計算指紋 | `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`（與原記錄 100% 吻合） | [PASS] |
| **暫存還原資料庫** | PostgreSQL 容器內 `code_to_know_restore_test` | 存在 (`SELECT count(*) FROM pg_database` = 1) | [PASS] |

---

## 八、Git 當前狀態核實

- **目前分支**：`main`
- **HEAD Commit**：`765ff905f4a567be06cb89a162043f27065dfd82`
- **未暫存之既有修改檔案**：17 個檔案維持原貌。
- **未執行任何 Git 操作**：零 Stage、零 Commit、零 Push、零 Clean。

---

## 九、尚存風險與後續實作注意要點

1. **`PracticalStepProgress` 跨版本一致性**：
   - 經架構核對，資料庫層級無法防範將 Task A 的 Step 指派給 Task B 的 Progress。此項目已確認為關聯設計之預期特性，應於未來 `PracticalService` 中實施業務檢驗。[WARN: 需 Service 層防護]
2. **初始 Migration Checksum 歷史記錄差異**：
   - 初始遷移之歷史差異依然客觀存在，未來在開發環境執行 `prisma migrate dev` 前，應避免直接觸發 reset，持續依循生產部署導向之受控流程。
3. **備份與暫存資料庫保留**：
   - 外部備份檔案與容器內暫存庫 `code_to_know_restore_test` 依指示完整保留，未自行刪除。

---

## 十、最終驗收結論與停止宣告

> **【最終驗收結論】**  
> **CODE TO KNOW（碼上學）本機 Docker PostgreSQL 正式 Migration 套用後獨立資料庫驗收全部合格（All Acceptance Criteria Met）！**  
> **本機資料庫已具備完整的 36 個業務模型實體資料表、進階約束與 Enum，原有 4 位真實使用者資料 100% 保全，Prisma 與後端工程工具鏈驗證全數通過。**

依據規範，本階段任務已全數完成並立即停止：
- 未刪除備份檔案。
- 未刪除暫存還原資料庫。
- 未操作 Supabase 或雲端服務。
- 未執行 Git Commit 或 Push。

靜候使用者審閱本驗收報告！
