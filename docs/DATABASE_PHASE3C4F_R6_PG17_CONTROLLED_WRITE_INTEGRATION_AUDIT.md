# CODE TO KNOW｜PHASE 3C-4F-R6
# PG17 受控寫入整合測試與交易完整性驗收報告

> **驗收日期**：2026-11-09  
> **測試目標**：本機 PostgreSQL 17 隔離沙盒 (`127.0.0.1:5433`, `code_to_know_cloud_restore_test`)  
> **執行入口**：`scripts/test_pg17_controlled_write.cjs`  
> **最終判定**：**PASS**（全數寫入測試通過、交易機制正確、約束阻斷有效、測試資料 100% 精確清理、原基準無任何副作用）

---

## 一、Git 與 Docker 執行前環境狀態

### 1. Git 版本控制核查
- **Branch**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **工作區狀態**：維持所有未暫存/未追蹤之專案歷史文件，無未授權之 commit、push、reset 或 rebase。

### 2. 容器運行狀態與網路隔離核查
| 容器名稱 | 映像檔版本 | 內部埠口 | 宿主機埠口 | 運行狀態 | 角色定位與防護 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine` | 5432 | `127.0.0.1:5432` | Up (healthy) | 本機開發庫（嚴格鎖定唯讀，零連線寫入） |
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (PG 17.11) | 5432 | `127.0.0.1:5433` | Up (healthy) | 唯一授權受控寫入沙盒 |

### 3. Supabase 雲端環境隔離聲明
- 本次整合測試全程於本機隔離容器執行，連線字串僅鎖定本機 `127.0.0.1:5433`，對 Supabase 雲端環境保持 **0 連線、0 讀取、0 寫入**。

---

## 二、PG17 寫入入口架構與四重防護機制

本階段依規定新增專用受控寫入入口：[`scripts/test_pg17_controlled_write.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/test_pg17_controlled_write.cjs)，完整沿用 R4/R5 驗證通過的四重防護體系，未修改或覆蓋既有 R4 唯讀入口與 R5 審查腳本：

```
[測試入口啟動]
       │
       ▼
【Guard 1: 環境硬性鎖定】
  - 強制 process.env.NODE_ENV = 'test'
  - 即時刪除 ambient DATABASE_URL / DIRECT_URL / MIGRATION_DATABASE_URL
       │
       ▼
【Guard 2: 目標白名單校驗】
  - 嚴格校驗 Host (127.0.0.1), Port (5433), Database (code_to_know_cloud_restore_test), User (codetoknow_restore)
  - 阻斷 5432 (PG16) 與 6543 (Cloud Pooler)
       │
       ▼
【Guard 3: SQL 引擎連線身分握手】
  - 連線後即時查詢 SELECT version(), current_database(), current_user, inet_server_port();
  - 驗證引擎必須為 PostgreSQL 17.x，否則即刻 abort
       │
       ▼
【Guard 4: Prisma 實例指針同一性斷言】
  - 預先注入 global.__prisma = testPrisma
  - 載入 backend/dist/app.js 與 config/database.js
  - 斷言 appPrisma === testPrisma，確保 Express 與測試共用同一 PG17 客戶端
       │
       ▼
[進入受控寫入測試邏輯]
```

### 驗證結果
- **Guard 1 (Env Hard-Lock)**：**PASS**
- **Guard 2 (Whitelist Check)**：**PASS**
- **Guard 3 (SQL Handshake)**：**PASS** (`code_to_know_cloud_restore_test` on `PostgreSQL 17.11 on x86_64-pc-linux-musl`)
- **Guard 4 (Pointer Identity)**：**PASS** (`appPrisma === testPrisma`)

---

## 三、本次測試模型與測試項目矩陣

依循 Prisma Schema，選取核心低風險且具備外鍵關聯之代表性模型：
1. `User`（使用者核心）
2. `UserProfile`（1:1 一對一關聯）
3. `UserRole`（M:N 角色映射）
4. `TeacherApplication`（1:N 申請業務關聯）
5. `AuditLog`（稽核日誌模型）

| 測試代號 | 測試項目 | 測試標的與機制 | 預期反應 | 實測結果 | 判定 |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **Test A** | 基本寫入 (Basic Write) | 建立 R6 使用者、Profile 與 UserRole | 資料正常寫入並能透過 include 關聯查詢 | 寫入成功，關聯資料完整回傳 | **PASS** |
| **Test B** | 更新測試 (Update Test) | 更新 R6 使用者之 `displayName` 與 Profile `nickname` | 欄位即時變更，且不影響其他使用者 | 欄位成功更新，其餘紀錄無異動 | **PASS** |
| **Test C** | 唯一約束 (Unique Constraint) | 1. 嘗試重複插入相同 Email<br>2. 嘗試重複為同一個 User 插入第二筆 Profile | PostgreSQL 拋出唯一性衝突，Prisma 返回 `P2002` 錯誤 | 均被即時阻斷，返回 `P2002`，無髒資料 | **PASS** |
| **Test D** | 外鍵完整性 (Foreign Key) | 1. 有效 userId 建立 TeacherApplication<br>2. 無效 UUID (`000...`) 建立 TeacherApplication | 有效 FK 建立成功；無效 FK 遭拒絕並返回 `P2003` | 有效成功，無效 FK 被拒絕 (P2003) | **PASS** |
| **Test E** | 交易提交 (Transaction Commit) | 在 `$transaction` 區塊中建立 User、Profile 與 AuditLog | 交易成功 Commit，交易外可穩定查詢資料 | 交易內全數落盤，交易外持久存在 | **PASS** |
| **Test F** | 交易回滾 (Transaction Rollback) | 在 `$transaction` 區塊中建立資料後主動觸發異常 | 交易完整 Rollback，幽靈資料完全不存在 | 拋錯後交易中止，外界查無此資料 | **PASS** |
| **Stage 6** | 精確清理 (Precise Cleanup) | 依反向依賴順序清理本階段 R6 測試資料 | 逐表計數刪除，零殘留，不影響 R1 資料 | 精確清理完成，基準完全復原 | **PASS** |

---

## 四、R6 測試資料清單與隔離記錄

所有測試資料皆具有明確且唯一的標記：
- 測試 Email 網域：`@codetoknow.test.invalid`
- 識別標記：`R6_PG17_20261109`

### 本次建立並追蹤之實體清單
| 實體類別 | 實體 ID / 唯一識別值 | 關聯資訊 | 測試階段 |
| :--- | :--- | :--- | :--- |
| **User (A)** | `336c91ff-30c8-4edd-ae52-d90609d02497` | `r6_test_student_20261109@codetoknow.test.invalid` | Test A, B, C, D |
| **UserProfile (A)** | `cd7489e9-52a1-41e2-8c47-a7dbde6ad13f` | `userId`: `336c91ff-30c8-4edd-ae52-d90609d02497` | Test A, B |
| **UserRole (A)** | 關聯 ID (Student Role) | `roleId`: `0b586d03-f53a-4dcc-8615-909fe78224fa` | Test A |
| **TeacherApplication** | `d6ef7dca-cf1f-4ffc-93d7-ff845ef76d99` | `userId`: `336c91ff-30c8-4edd-ae52-d90609d02497` | Test D |
| **User (E)** | `9dfd2646-7b48-4f10-88b8-fee1219087c5` | `r6_test_tx_commit_20261109@codetoknow.test.invalid` | Test E (Tx Commit) |
| **UserProfile (E)** | `10fd9d82-df75-4720-9cb5-983196f1d24a` | `userId`: `9dfd2646-7b48-4f10-88b8-fee1219087c5` | Test E (Tx Commit) |
| **AuditLog (E)** | `0a1f0687-3639-473c-9990-db79b707f96f` | `userId`: `9dfd2646-7b48-4f10-88b8-fee1219087c5` | Test E (Tx Commit) |

---

## 五、約束拒絕與交易完整性詳細數據

### 1. Unique Constraint 測試數據
- **操作 1（重複 Email）**：
  - 嘗試插入相同 Email：`r6_test_student_20261109@codetoknow.test.invalid`
  - 資料庫拋出：`Unique constraint failed on the constraint: User_email_key`
  - Prisma 錯誤代碼：`P2002`
- **操作 2（重複 UserProfile）**：
  - 嘗試為同一個 `userId` 插入第二個 Profile
  - 資料庫拋出：`Unique constraint failed on the constraint: UserProfile_userId_key`
  - Prisma 錯誤代碼：`P2002`

### 2. Foreign Key 測試數據
- **有效關聯**：以既有 `User (A)` ID 建立 `TeacherApplication`，成功落盤。
- **無效關聯**：以全零 UUID `00000000-0000-0000-0000-000000000000` 建立 `TeacherApplication`。
  - 資料庫拋出：`Foreign key constraint violated on the constraint: TeacherApplication_userId_fkey`
  - Prisma 錯誤代碼：`P2003`

### 3. Transaction Commit 測試數據
- 在 `$transaction` 中同步建立 User (E) 與 AuditLog (E)。
- 交易順利完成，於交易外部執行 `prisma.user.findUnique` 與 `prisma.auditLog.findUnique` 均能精確檢索該紀錄。

### 4. Transaction Rollback 測試數據
- 在 `$transaction` 中嘗試建立 `r6_test_tx_rollback_20261109@codetoknow.test.invalid` 與對應 AuditLog。
- 主動拋出錯誤：`[R6_CONTROLLED_ROLLBACK] Intentional transaction abort for verification`。
- 交易外部重新查詢：
  - `prisma.user.findUnique({ where: { email: '...' } })` ➔ 回傳 **`null`**。
  - `prisma.auditLog.findMany({ where: { action: 'R6_TX_ROLLBACK_TEST' } })` ➔ 回傳 **`[]`**（0 筆）。
  - **證實 Rollback 機制在 PostgreSQL 17 底層完美回滾，無殘留任何髒資料**。

---

## 六、精確清理（Precise Cleanup）執行過程與筆數變化

清理作業依反向外鍵依賴順序，嚴格使用精確 ID 條件執行，絕無使用 `CASCADE` 或 `TRUNCATE`：

| 清理順序 | 目標資料表 | 清理依據 (Where 條件) | 清理前總筆數 | 刪除筆數 | 清理後總筆數 | 殘留核驗 |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: |
| **Step 1** | `AuditLog` | `id IN ('0a1f0687-...')` | 11 | 1 | 10 | 0 |
| **Step 2** | `TeacherApplication` | `id IN ('d6ef7dca-...')` | 2 | 1 | 1 | 0 |
| **Step 3** | `UserRole` | `userId IN ('336c91ff-...')` | 6 | 1 | 5 | 0 |
| **Step 4** | `UserProfile` | `userId IN ('336c91ff-...', '9dfd2646-...')` | 5 | 2 | 3 | 0 |
| **Step 5** | `User` | `id IN ('336c91ff-...', '9dfd2646-...')` | 5 | 2 | 3 | 0 |

**殘留清查**：執行 `prisma.user.findMany({ where: { email: { in: [r6Email1, r6Email2, r6Email3] } } })`，回傳 **0 筆**，證實 R6 測試資料完全清除。

---

## 七、PG16 與 PG17 前後基準比對

測試與清理完成後，透過底層 SQL 直接比對資料庫整體統計：

```
=== STAGE 6: PG16 & PG17 DATABASE BASELINE VERIFICATION ===

[PG16 Post-Test State]
┌───────────────────────┬────────┐
│ (index)               │ Values │
├───────────────────────┼────────┤
│ tables                │ 37     │
│ foreignKeys           │ 47     │
│ totalIndexes          │ 133    │
│ uniqueIndexes         │ 64     │
│ userCount             │ 4      │
│ sessionCount          │ 3      │
│ auditLogCount         │ 9      │
│ migrationHistoryCount │ 3      │
└───────────────────────┴────────┘

[PG17 Post-Test State]
┌───────────────────────┬────────┐
│ (index)               │ Values │
├───────────────────────┼────────┤
│ tables                │ 37     │
│ foreignKeys           │ 47     │
│ totalIndexes          │ 133    │
│ uniqueIndexes         │ 64     │
│ userCount             │ 3      │
│ roleCount             │ 3      │
│ sessionCount          │ 3      │
│ auditLogCount         │ 10     │
│ migrationHistoryCount │ 2      │
└───────────────────────┴────────┘
```

### R1 原始測試資料完整保留核驗
- `test_student_20261109@codetoknow.test.invalid` (`98c9279a-3a0e-4953-892d-d7b08ad3250d`)：**完整保留**
- `test_teacher_applicant_20261109@codetoknow.test.invalid` (`cbc87496-2468-4ede-8c64-cc43d38882c1`)：**完整保留**
- `test_admin_20261109@codetoknow.test.invalid` (`e3e8f8a0-3244-4b43-8028-29a0e6170cd0`)：**完整保留**
- Roles：`STUDENT`, `TEACHER`, `ADMIN` (3 筆)：**完整保留**
- Sessions：3 筆：**完整保留**
- AuditLogs：10 筆：**完整保留**
- TeacherApplication：1 筆：**完整保留**
- UserProfile：3 筆：**完整保留**

---

## 八、9 大核心安全問題逐項回覆

### Q1：是否只寫入 PG17？
> **解答：是**。所有連線與寫入動作皆嚴格鎖定在 `127.0.0.1:5433`（`code_to_know_cloud_restore_test`）。PG16 埠口 5432 與外部雲端連線在連線前即被 Guard 2 阻絕。

### Q2：四重防護是否持續有效？
> **解答：是**。Guard 1（環境鎖定）、Guard 2（白名單預檢）、Guard 3（SQL 引擎握手）與 Guard 4（指針同一性斷言）全程生效並在測試入口初始化時即刻檢驗通過。

### Q3：Commit 與 Rollback 是否通過？
> **解答：通過**。Test E 成功於交易內寫入並在外部穩定查詢；Test F 在異常拋出後完整回滾，幽靈使用者與日誌確認為 0 筆。

### Q4：Unique Constraint 與 Foreign Key 是否通過？
> **解答：通過**。重複 Email 與重複 Profile 均被資料庫與 Prisma 攔截並回傳 `P2002`；無效外鍵被攔截並回傳 `P2003`，有效外鍵均能正常建立關聯。

### Q5：R6 測試資料是否已精確清理？
> **解答：已精確清理**。依反向依賴順序對 2 筆 User、2 筆 UserProfile、1 筆 UserRole、1 筆 TeacherApplication、1 筆 AuditLog 進行精確刪除，殘留檢查確認為 0 筆。

### Q6：R1 資料是否完整保留？
> **解答：完整保留**。R1 的 3 筆測試使用者、3 個角色、3 個 Session、1 份教師申請、3 份 Profile 與 10 筆 AuditLog 筆數與內容完全未受影響。

### Q7：PG16 是否完全未受影響？
> **解答：完全未受影響**。PG16 之使用者（4 筆）、Session（3 筆）、AuditLog（9 筆）、Migration 紀錄（3 筆）與 37 張表結構維持 100% 凍結。

### Q8：Supabase 是否完全未操作？
> **解答：完全未操作**。審查與測試全程完全未接觸 Supabase 正式雲端資料庫，隔離度為 100%。

### Q9：是否可以進入下一階段？
> **解答：可以**。寫入相容性、約束保護、外鍵關聯、交易完整性與資料庫清理復原流程皆達到生產級標準。

---

## 九、未解決風險與注意事項

1. **生產環境切換前之流量隔離**：目前驗證係於本機 PG17 沙盒完成，若後續進行正式資料庫切換，需遵照既定標準變更程序（變更通知、唯讀維護視窗、資料庫備份、DNS/連線池切換）。
2. **密碼安全性維護**：密碼全程自外部受保護檔案動態讀取，後續所有腳本與文件均須維持「不記錄明文密碼與連線字串」之規範。

---

## 十、最終判定

```
======================================================================
  PHASE 3C-4F-R6 INTEGRATION & TRANSACTION AUDIT VERDICT: [ PASS ]
======================================================================
```

**核決意見**：  
PG17 受控寫入整合測試與交易完整性驗收正式通過。Prisma 在 PostgreSQL 17 下之寫入、更新、外鍵防護、唯一約束、交易提交與回滾表現完全符合規格，測試資料清理乾淨，現有基準完好無損。**正式核予 PASS 評級**。
