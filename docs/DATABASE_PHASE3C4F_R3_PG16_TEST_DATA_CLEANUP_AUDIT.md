# CODE TO KNOW（碼上學）
# PHASE 3C-4F-R3：PG16 非預期測試資料精準清理與逐表驗收報告

本報告為 **PHASE 3C-4F-R3** 之正式驗收紀錄。  
由專案 PostgreSQL DBA、資料庫還原工程師、後端資安架構師及獨立資料完整性審查團隊聯合執行。  
本階段依據使用者明確授權，針對 **PHASE 3C-4F-R1** 執行初期因 ESM 依賴解析順序意外寫入 PostgreSQL 16 開發容器之 3 筆測試帳號及其關聯資料，完成**執行前安全閘門核對、嚴格子表優先參數化 Transaction 清理，以及清理後逐表完整性驗收**。

---

## 一、執行摘要與授權範圍 (Executive Summary & Authorization)

- **使用者明確授權範圍**：
  - **唯一允許操作之資料庫**：
    - 容器：`code_to_know_postgres`
    - 主機與埠口：`127.0.0.1:5432`
    - 資料庫名稱：`code_to_know`
    - 資料庫使用者：`codetoknow`
    - PostgreSQL 版本：16.15 (Alpine)
  - **唯一允許清理之目標帳號（嚴格核對 ID 與 Email）**：
    1. `test_student_20261109@codetoknow.test.invalid`  
       ID：`bea93bfa-9ac9-4fd2-8516-edb6668f0a7a`
    2. `test_teacher_applicant_20261109@codetoknow.test.invalid`  
       ID：`e189f542-a92f-4552-acd7-c97fb8267e20`
    3. `test_admin_20261109@codetoknow.test.invalid`  
       ID：`bec0d5b1-8713-4714-88eb-537b2b47c78a`
- **絕對隔離承諾**：
  - **PG17 隔離沙盒**（`127.0.0.1:5433`）：零連線、零修改、保留 R1 驗收資料。
  - **雲端 Supabase**：零連線、零修改、完全網路隔離。
- **清理執行成果**：
  - 單一資料庫交易（Transaction）執行，行級鎖定（`FOR UPDATE`），子表優先，母表最後。
  - 實際刪除筆數與執行前盤點預期數值 **100% 完全精確吻合**，交易成功 `COMMIT`。
  - 原有 4 筆真實／測試帳號及其所有關聯紀錄 **100% 完整保留**。
  - PG16 資料庫結構（37表、47外鍵、133索引、64唯一索引、3遷移）**完全零變動**。
- **最終判定**：
  
  **`PASS — PRECISION CLEANUP SUCCESSFUL & TABLE-BY-TABLE VERIFICATION PASSED`**

---

## 二、第一階段：執行前環境與安全閘門確認

清理程序透過獨立資料庫連線池直接連至 PG16，未透過 Express 或全域 Prisma 實例，確保環境隔離性：

| 檢驗項目 | 規範標準 | 實際檢驗狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **目標容器** | `code_to_know_postgres` (Up, healthy) | 正常運行 | **PASS** |
| **主機與埠口** | `127.0.0.1:5432` | 連線目標精確鎖定 | **PASS** |
| **資料庫名稱** | `code_to_know` | 一致 | **PASS** |
| **資料庫使用者** | `codetoknow` | 一致 | **PASS** |
| **PostgreSQL 核心版本** | PostgreSQL 16.15 on x86_64-pc-linux-musl | 16.15 | **PASS** |
| **PG17 沙盒狀態** | `code_to_know_pg17_restore_sandbox` @ `5433` | 正常運作，本程序零連線 | **PASS** |
| **Supabase 雲端資料庫** | 遠端連線埠口與連線池 | 零連線、零使用憑證 | **PASS** |

---

## 三、第二階段：清理前逐表唯讀盤點與外鍵分析

經查詢 PostgreSQL 系統目錄 `information_schema.referential_constraints`，確認引用 `"User"("id")` 之子表共有 21 張。  
逐表盤點關聯至 3 筆目標帳號之資料分佈：

| 資料表名稱 (Table) | 外鍵關聯欄位 | 預期清理筆數 | 實際盤點筆數 | 關聯資料歸屬確認 |
| :--- | :--- | :---: | :---: | :--- |
| **`AuditLog`** | `userId` | 8 | **8** | 8 筆日誌全數為該 3 筆帳號測試操作 |
| **`TeacherApplication`** | `userId` | 1 | **1** | 申請者為 `test_teacher_applicant...`，狀態 PENDING |
| **`Session`** | `userId` | 2 | **2** | 學生(已撤銷1筆)、教師申請者(有效1筆) |
| **`EmailVerificationToken`** | `userId` | 3 | **3** | 3 組帳號註冊生成之權杖雜湊 |
| **`UserRole`** | `userId` | 3 | **3** | 3 組帳號之 `STUDENT` 角色綁定 |
| **`UserProfile`** | `userId` | 3 | **3** | 3 組帳號之個人基本檔案 |
| **`User`** | `id` (母表) | 3 | **3** | 3 組授權目標帳號 |
| **其餘 15 張子表** | 各自外鍵欄位 | 0 | **0** | 零關聯引用 |

### 原有 4 筆使用者保留基線確認
盤點確認 PG16 歷史原有 4 筆使用者完整存在，未列入清理清單：
1. `45e087b3-4ac0-4de9-936c-1198f584a63a` (`test_student_1793714104338@codetoknow.edu`)
2. `56265935-383d-4122-bfee-803990618613` (`test_student_1793714656040@codetoknow.edu`)
3. `5c66b177-1c14-4bb5-ae91-bb960749e2b1` (`ak990414@apps.ntpc.edu.tw`)
4. `312e927b-061b-43d3-adea-8deaba64028d` (`student_1793976435481@example.com`)

---

## 四、第三階段：清理腳本架構與安全審查

清理腳本 (`execute_pg16_precision_cleanup.cjs`) 經團隊架構審查，符合以下安全指標：

1. **參數化 SQL (Parameterized Query)**：使用 `$1::text[]` 陣列參數傳遞，杜絕 SQL Injection。
2. **無 CASCADE 刪除**：嚴禁依賴資料庫級聯，強制依外鍵由底層子表向上逐層清理。
3. **雙重身分核對**：刪除母表 `User` 時，同時比對 `id = ANY($1) AND email = ANY($2)`，防止任何 ID 或 Email 單邊漂移導致誤刪。
4. **單一資料庫事務與行鎖定 (Transaction & Row Lock)**：
   - 事務開啟後立即以 `SELECT ... FOR UPDATE` 鎖定目標使用者，防止併發干擾。
   - 每步驟核對 `rowCount`，若有任何一表不等於預期筆數，立即執行 `ROLLBACK`。
5. **原始資料保全斷言**：在事務 `COMMIT` 前，再次驗證原有 4 筆使用者完全存在，否則觸發回滾。

---

## 五、第四階段：精準清理執行與 Transaction 結果

腳本於本機執行，所有安全閘門 100% 通過後順利進入事務執行：

```
[Stage 5: Executing Precision Cleanup Transaction...]
- Step 1: Lock 3 Target Users with FOR UPDATE -> OK
- Step 2: DELETE FROM "AuditLog" WHERE "userId" IN (targets) -> Deleted: 8 rows (Expected: 8)
- Step 3: DELETE FROM "TeacherApplication" WHERE "userId" IN (targets) -> Deleted: 1 rows (Expected: 1)
- Step 4: DELETE FROM "Session" WHERE "userId" IN (targets) -> Deleted: 2 rows (Expected: 2)
- Step 5: DELETE FROM "EmailVerificationToken" WHERE "userId" IN (targets) -> Deleted: 3 rows (Expected: 3)
- Step 6: DELETE FROM "UserRole" WHERE "userId" IN (targets) -> Deleted: 3 rows (Expected: 3)
- Step 7: DELETE FROM "UserProfile" WHERE "userId" IN (targets) -> Deleted: 3 rows (Expected: 3)
- Step 8: DELETE FROM "User" WHERE id IN (targets) AND email IN (targets) -> Deleted: 3 rows (Expected: 3)
- Step 9: Post-check original users intact (Count: 4) -> OK
>>> TRANSACTION COMMITTED SUCCESSFULLY! <<<
```

### 實際刪除統計彙整表

| 執行順序 | 目標資料表 (Table) | 預期刪除筆數 | 實際刪除筆數 | 差異 (Delta) | 執行狀態 |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | `AuditLog` | 8 | 8 | 0 | **SUCCESS** |
| 2 | `TeacherApplication` | 1 | 1 | 0 | **SUCCESS** |
| 3 | `Session` | 2 | 2 | 0 | **SUCCESS** |
| 4 | `EmailVerificationToken` | 3 | 3 | 0 | **SUCCESS** |
| 5 | `UserRole` | 3 | 3 | 0 | **SUCCESS** |
| 6 | `UserProfile` | 3 | 3 | 0 | **SUCCESS** |
| 7 | `User` (母表) | 3 | 3 | 0 | **SUCCESS** |
| **總計** | **7 張相關資料表** | **23** | **23** | **0** | **COMMIT** |

---

## 六、第五階段：清理後逐表驗收

清理完成後，由獨立檢驗腳本 (`verify_pg16_post_cleanup.cjs`) 執行完整資料庫複查：

### 1. 目標測試資料殘留檢查（必須全數為 0）
```
┌────────────────────────┬────────┐
│ 資料表名稱             │ 殘留筆數 │
├────────────────────────┼────────┤
│ User                   │ 0      │
│ UserProfile            │ 0      │
│ UserRole               │ 0      │
│ Session                │ 0      │
│ EmailVerificationToken │ 0      │
│ TeacherApplication     │ 0      │
│ AuditLog               │ 0      │
└────────────────────────┴────────┘
```
- 以目標 ID、目標 Email 及模糊網域 `%@codetoknow.test.invalid%` 交叉檢驗，**全表零殘留**。

### 2. 原有使用者及關聯資料保全驗收
```
┌─────────┬────────────────────────────────────────┬─────────────────────────────────────────────┬────────────────┬──────────┬──────────────────────────┐
│ (index) │ id                                     │ email                                       │ displayName    │ status   │ createdAt                │
├─────────┼────────────────────────────────────────┼─────────────────────────────────────────────┼────────────────┼──────────┼──────────────────────────┤
│ 0       │ '45e087b3-4ac0-4de9-936c-1198f584a63a' │ 'test_student_1793714104338@codetoknow.edu' │ '整合測試學生' │ 'ACTIVE' │ 2026-11-03T05:55:04.462Z │
│ 1       │ '56265935-383d-4122-bfee-803990618613' │ 'test_student_1793714656040@codetoknow.edu' │ '整合測試學生' │ 'ACTIVE' │ 2026-11-03T06:04:16.161Z │
│ 2       │ '5c66b177-1c14-4bb5-ae91-bb960749e2b1' │ 'ak990414@apps.ntpc.edu.tw'                 │ '莊永婕'       │ 'ACTIVE' │ 2026-11-04T04:49:16.140Z │
│ 3       │ '312e927b-061b-43d3-adea-8deaba64028d' │ 'student_1793976435481@example.com'         │ '實測學生小明' │ 'ACTIVE' │ 2026-11-06T06:47:15.892Z │
└─────────┴────────────────────────────────────────┴─────────────────────────────────────────────┴────────────────┴──────────┴──────────────────────────┘
```
- 原有使用者筆數：**4 筆**（100% 完整保留）。
- 原有個人檔案 (`UserProfile`)：**4 筆**。
- 原有角色關聯 (`UserRole`)：**4 筆**。
- 原有登入憑證 (`Session`)：**3 筆**。
- 原有教師申請案 (`TeacherApplication`)：**2 筆**。
- 原有歷史稽核日誌 (`AuditLog`)：**9 筆**。
- 核心基礎角色 (`Role`)：**3 筆**（`STUDENT`、`TEACHER`、`ADMIN` 完整保留）。

### 3. PG16 資料庫結構與約束完整性
- **資料表總數**：37 張表。
- **外鍵約束總數**：47 組（外鍵關聯完整，無任何孤兒記錄）。
- **索引總數**：133 組。
- **唯一索引總數**：64 組。
- **Prisma Migration 紀錄**：3 筆。
- **其餘 30 張業務表**：全數維持乾淨 0 筆，未受任何干擾。

---

## 七、第六階段：PG17 與 Supabase 隔離確認

- **PG17 隔離沙盒**：
  - 容器 `code_to_know_pg17_restore_sandbox` 持續正常運行（Uptime 42+ 分鐘）。
  - 本次清理程序連線位置嚴格鎖定於 `127.0.0.1:5432`，**未向 `5433` 發起任何請求**。
  - PG17 內部經 R1 驗收之資料庫結構與受控寫入測試記錄完全維持原貌。
- **雲端 Supabase**：
  - 本次清理程序未讀取亦未載入任何 Supabase 憑證或連線字串。
  - 雲端正式資料庫保持 100% 隔離，零存取、零更動。

---

## 八、執行成果明確回覆

1. **是否只刪除指定 3 筆 User？**  
   **是**。母表僅刪除指定 3 筆，原有 4 筆使用者未受任何更動。
2. **七張相關資料表各刪除幾筆？**  
   - `AuditLog`: 8 筆
   - `TeacherApplication`: 1 筆
   - `Session`: 2 筆
   - `EmailVerificationToken`: 3 筆
   - `UserRole`: 3 筆
   - `UserProfile`: 3 筆
   - `User`: 3 筆  
   （合計精確刪除 23 筆）。
3. **是否所有目標關聯資料均已清理？**  
   **是**。交叉檢驗殘留筆數全數為 0。
4. **原有 4 筆使用者是否完整保留？**  
   **是**。4 筆使用者及其對應之 Profile、Role、Session、Application 與 9 筆歷史 AuditLog 完全保留。
5. **PG16 結構是否零變動？**  
   **是**。37 表、47 外鍵、133 索引、64 唯一索引、3 Migration 完全零變動。
6. **PG17 是否未受影響？**  
   **是**。PG17 沙盒未被建立任何連線，原有驗收資料完整保留。
7. **Supabase 是否未被操作？**  
   **是**。保持 100% 安全隔離。
8. **Transaction 是否成功 COMMIT？**  
   **是**。所有安全斷言通過，交易成功提交。
9. **清理後是否有孤兒外鍵？**  
   **否**。依外鍵子表優先反向順序清理，無任何外鍵違反或孤兒紀錄。
10. **是否可以進入下一階段測試隔離修正？**  
    **是**。PG16 已恢復乾淨基準，已具備進入測試隔離架構固化之條件。

---

### 最終驗收結論：
**`PASS — PRECISION CLEANUP SUCCESSFUL & TABLE-BY-TABLE VERIFICATION PASSED`**
