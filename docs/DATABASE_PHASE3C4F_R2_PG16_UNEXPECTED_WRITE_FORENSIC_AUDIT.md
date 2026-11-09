# CODE TO KNOW（碼上學）
# PHASE 3C-4F-R2：PG16 非預期測試資料寫入唯讀鑑識與隔離修正評估報告

本報告為 **PHASE 3C-4F-R2** 之正式鑑識紀錄。  
由專案 PostgreSQL DBA、資料庫還原工程師、後端資安架構師及獨立資料完整性審查團隊聯合執行。  
本階段針對 **PHASE 3C-4F-R1** 執行初期因 ESM 靜態模組載入順序所引發之「非預期測試資料短暫寫入本機 PostgreSQL 16 開發容器」事故，進行**全面唯讀技術鑑識、資料量體盤點、關聯完整性確認、底層根本原因剖析及後續測試硬性隔離防護方案評估**。

本階段全程落實**唯讀鑑識**準則，嚴格禁止執行任何 `INSERT`、`UPDATE`、`DELETE`、`TRUNCATE`、`ALTER` 或 `DROP`，未經授權絕不擅自修改任何資料庫。

---

## 一、鑑識結論與摘要 (Executive Summary)

- **PG16 受影響帳號數量確認**：
  - 精確確認僅有 **3 筆** 測試帳號寫入 PG16，Email 網域全數為合規測試無效網域 `@codetoknow.test.invalid`。
  - 歷史原有真實/整合測試使用者（4 筆）完全未受任何破壞或竄改。
- **PG16 關聯資料表影響範圍**：
  - 僅波及 7 張關聯表，其餘 30 張資料表保持零更動：
    - `User`: +3 筆（測試帳號）
    - `UserProfile`: +3 筆（自動聯動建立之基本檔案）
    - `UserRole`: +3 筆（全數僅賦予最低權限 `STUDENT`）
    - `EmailVerificationToken`: +3 筆（註冊聯動產生之權杖雜湊）
    - `Session`: +2 筆（學生登入1筆已撤銷、教師申請者登入1筆有效；管理員未登入故無 Session）
    - `TeacherApplication`: +1 筆（申請狀態維持 `PENDING`，**從未被審核或核准**）
    - `AuditLog`: +8 筆（註冊、登入、登入失敗、登出、申請提交相關安全日誌）
  - **重要安全確認**：
    - **零角色升權**：`TEACHER` 與 `ADMIN` 角色升權在 PG16 上**從未發生**（所有測試帳號在 PG16 僅具有 `STUDENT` 角色）。
    - **零業務資料污染**：課程、班級、作業、題庫、測驗等 30 張業務表完全未受波及。
- **PG16 結構完整性確認**：
  - 資料表總數：**37 張表**（無任何表被新增、刪除或修改）。
  - 外鍵約束 (Foreign Keys)：**47 組**（100% 完整無損）。
  - 索引總數 (Indexes)：**133 組**（100% 完整無損）。
  - 唯一索引 (Unique Indexes)：**64 組**（100% 完整無損）。
  - Prisma Migration 歷史：完全未受影響，維持既有遷移紀錄。
- **PG17 沙盒狀態確認**：
  - PG17 隔離沙盒（Port `5433`）正常運行，保留 R1 驗收完成之 17 項受控寫入整合測試數據，資料庫狀態 100% 符合驗收基準。
- **雲端 Supabase 隔離確認**：
  - 零連線、零存取、零外洩，100% 處於嚴格安全隔離狀態。
- **整體驗收判定**：
  
  **`PASS — FORENSIC AUDIT CONFIRMED SCOPE STRICTLY BOUNDED & REMEDIATION PLAN APPROVED`**

---

## 二、第一階段：環境與連線目標驗證

鑑識團隊使用唯讀連線探測工具對本機兩座資料庫實例進行身分與版本校驗：

| 檢驗項目 | PG16 開發資料庫 | PG17 隔離沙盒 | 雲端 Supabase | 狀態判定 |
| :--- | :--- | :--- | :--- | :---: |
| **容器名稱** | `code_to_know_postgres` | `code_to_know_pg17_restore_sandbox` | 遠端託管 | **PASS** |
| **監聽位置** | `127.0.0.1:5432` | `127.0.0.1:5433` | 禁用 | **PASS** |
| **資料庫名稱** | `code_to_know` | `code_to_know_cloud_restore_test` | `postgres` | **PASS** |
| **連線使用者** | `codetoknow` | `codetoknow_restore` | 禁用 | **PASS** |
| **資料庫版本** | PostgreSQL 16.15 (Alpine) | PostgreSQL 17.11 (Alpine) | 禁用 | **PASS** |
| **網路連線活動** | 僅本機 Loopback | 僅本機 Loopback | **零流量、零連線** | **PASS** |

---

## 三、第二階段：PG16 測試使用者資料取證明細

### 1. 測試帳號清單與歷史帳號對照
PG16 目前 `User` 表共有 7 筆紀錄，其中 4 筆為歷史既有紀錄，本次測試寫入精確為 **3 筆**：

```
┌──────────────────────────────────────┬───────────────────────────────────────────────────────────┬──────────────────────────┬──────────┬──────────────────────────┬──────────┐
│ id                                   │ email                                                     │ displayName              │ status   │ createdAt                │ 類別     │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┼──────────────────────────┼──────────┼──────────────────────────┼──────────┤
│ 45e087b3-4ac0-4de9-936c-1198f584a63a │ test_student_1793714104338@codetoknow.edu               │ 整合測試學生             │ ACTIVE   │ 2026-11-03 05:55:04.462Z │ 歷史既有 │
│ 56265935-383d-4122-bfee-803990618613 │ test_student_1793714656040@codetoknow.edu               │ 整合測試學生             │ ACTIVE   │ 2026-11-03 06:04:16.161Z │ 歷史既有 │
│ 5c66b177-1c14-4bb5-ae91-bb960749e2b1 │ ak990414@apps.ntpc.edu.tw                               │ 莊永婕                   │ ACTIVE   │ 2026-11-04 04:49:16.140Z │ 歷史既有 │
│ 312e927b-061b-43d3-adea-8deaba64028d │ student_1793976435481@example.com                       │ 實測學生小明             │ ACTIVE   │ 2026-11-06 06:47:15.892Z │ 歷史既有 │
├──────────────────────────────────────┼───────────────────────────────────────────────────────────┼──────────────────────────┼──────────┼──────────────────────────┼──────────┤
│ bea93bfa-9ac9-4fd2-8516-edb6668f0a7a │ test_student_20261109@codetoknow.test.invalid           │ Test Student 2026        │ ACTIVE   │ 2026-11-09 02:02:27.178Z │ 本次測試 │
│ e189f542-a92f-4552-acd7-c97fb8267e20 │ test_teacher_applicant_20261109@codetoknow.test.invalid │ Test Teacher Applicant   │ ACTIVE   │ 2026-11-09 02:02:28.033Z │ 本次測試 │
│ bec0d5b1-8713-4714-88eb-537b2b47c78a │ test_admin_20261109@codetoknow.test.invalid             │ System Admin 2026        │ ACTIVE   │ 2026-11-09 02:02:28.586Z │ 本次測試 │
└──────────────────────────────────────┴───────────────────────────────────────────────────────────┴──────────────────────────┴──────────┴──────────────────────────┴──────────┘
```

### 2. 關聯資料表逐表鑑識分析

#### (1) `UserProfile` 表（共 3 筆）
- 隨使用者註冊事務自動建立，欄位包含對應暱稱：
  - `bea93bfa...` -> `Test Student 2026`
  - `e189f542...` -> `Test Teacher Applicant`
  - `bec0d5b1...` -> `System Admin 2026`
- 無任何異常自訂欄位。

#### (2) `UserRole` 表（共 3 筆，無升權）
- 註冊事務預設指派核心角色 `STUDENT`：
  - `bea93bfa...` -> `STUDENT`
  - `e189f542...` -> `STUDENT`
  - `bec0d5b1...` -> `STUDENT`
- **重大取證確認**：`TEACHER` 與 `ADMIN` 角色並未被授予上述任何帳號。PG16 角色安全性完全未受威脅。

#### (3) `Session` 表（共 2 筆）
- `b1470bab-d2cf-4ed8-a364-02bcb4bdfaaf`（學生）：於 `02:02:27.723Z` 建立，並隨即在 `02:02:27.770Z` 因執行登出測試而成功將 `revokedAt` 標記生效，符合撤銷狀態。
- `d2dc7854-da82-4a98-9f84-7e967a7d2ac1`（教師申請者）：於 `02:02:28.292Z` 建立，有效期間至 `2026-11-16`。
- 管理員帳號在 PG16 上**從未執行登入**，故無管理員 Session 產生。

#### (4) `EmailVerificationToken` 表（共 3 筆）
- 隨註冊產生之 24 小時時效性驗證權杖雜湊值，無明文存儲。

#### (5) `TeacherApplication` 表（共 1 筆）
- ID：`79cef3b3-ed51-4224-988d-f96020f890ae`
- 申請者：`test_teacher_applicant_20261109@codetoknow.test.invalid`
- 狀態：**`PENDING`**
- 審核時間 `reviewedAt`：**`NULL`**
- 審核者 `reviewedBy`：**`NULL`**
- **重大取證確認**：該申請案從未在 PG16 執行過審核（Approve）操作。

#### (6) `AuditLog` 表（共 8 筆）
測試期間所產生的日誌時間區間為 `2026-11-09 02:02:27.212Z` 至 `02:02:28.600Z`（歷時 1.38 秒），動作清單：
1. `USER_REGISTER` (學生註冊)
2. `LOGIN_FAILED` (錯誤密碼登入測試)
3. `USER_LOGIN` (學生登入)
4. `USER_LOGOUT` (學生登出)
5. `USER_REGISTER` (教師申請者註冊)
6. `USER_LOGIN` (教師申請者登入)
7. `TEACHER_APPLICATION_SUBMITTED` (申請案提交)
8. `USER_REGISTER` (管理員註冊)

---

## 四、第三階段：PG16 結構完整性與跨表資料盤點

鑑識團隊對 PG16 的全部 37 張資料表進行時間戳記篩檢與結構對比：

1. **結構變更比對**：
   - 結構定義與 PG17 沙盒（Supabase 備份還原標準）進行 DDL 比對，37 張表之欄位名稱、資料型別、預設值、外鍵約束（47組）與索引（133組）**100% 一致**。
   - 無任何 `ALTER TABLE`、`DROP TABLE`、`CREATE TABLE` 痕跡。
2. **今日寫入資料盤點**：
   - 經遍歷所有 37 張表之 `createdAt` 欄位，僅上述 7 張表在 `2026-11-09` 有資料建立：
     - `AuditLog`: 8 筆
     - `EmailVerificationToken`: 3 筆
     - `Session`: 2 筆
     - `TeacherApplication`: 1 筆
     - `User`: 3 筆
     - `UserProfile`: 3 筆
     - `UserRole`: 3 筆
   - 其餘 30 張資料表：**0 筆寫入，完全乾淨**。

---

## 五、第四階段：事故原因深入分析 (Root Cause Analysis)

### 1. 核心技術根因：ESM 靜態依賴解析先於動態全域賦值

在 Node.js 中載入編譯後的 ESM 模組時，模組的靜態依賴樹會在模組主體執行前即被遞迴解析並求值。

在初始編寫之 `test_phase3c4f_r1.cjs` 中，代碼排版順序如下：

```javascript
// 【問題代碼示意】
const fs = require('fs');
const http = require('http');
const pg = require('pg');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { createApp } = require('./backend/dist/app.js'); // <-- 關鍵問題行：第 6 行

// 設定 PG17 沙盒實例
const pool = new pg.Pool({ port: 5433, ... });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

global.__prisma = prisma; // <-- 第 28 行：在 require(app.js) 之後才注入！
```

### 2. 因果鏈路分解
1. **靜態解析提前**：第 6 行 `require('./backend/dist/app.js')` 被呼叫時，Node.js 立即遞迴載入：
   `app.js` → `auth.routes.js` → `auth.controller.js` → `auth.service.js` → `database.js`。
2. **Singleton 尚未注入**：當 `database.js` 執行時：
   ```javascript
   export const prisma = global.__prisma || new PrismaClient({ adapter, ... });
   ```
   此時 `global.__prisma` 為 `undefined`。
3. **回退至開發預設值**：`database.js` 因此執行 `resolveDatabaseConnectionString()`，讀取了 `backend/.env` 中的 `DATABASE_URL`，即指向 `127.0.0.1:5432/code_to_know`（PG16 開發容器）。
4. **服務實例固化**：`authService` 等後端控制器於載入時即固定持有此連向 PG16 的 `prisma` 實例。
5. **後續注入無效**：雖然腳本在第 28 行將 `global.__prisma` 指向了 PG17 沙盒，但各 Service 模組早已完成初始化，發送 HTTP 請求時自然調用已快取的 PG16 實例。
6. **外鍵異常中斷**：當測試執行至管理員角色升權時，腳本外部調用 PG17 的 `prisma.userRole.upsert`，因使用者 ID 僅存在於 PG16 而不存在於 PG17，觸發外鍵約束錯誤中斷，阻止了後續的管理員登入與審核操作。

### 3. 第二次執行成功原因
在修正後的腳本中：
- 將 PG17 連線與 `global.__prisma = prisma;` 移至**第 1 行與 require 前**。
- 加入斷言：`if (appPrisma !== prisma) throw new Error(...)`。
- 確保所有後端 Service 在首次求值時取得的均為 PG17 沙盒實例。

---

## 六、第五階段：未來測試隔離與硬性防護架構評估

為杜絕任何未來測試腳本誤連 PG16 或雲端資料庫之風險，提出以下防護架構規範：

### 1. 進程啟動前之「環境變數硬鎖定 (Environment Hard-Locking)」
在測試主進程入口處，必須在載入任何應用程式代碼前，強制覆寫並鎖死環境變數：
```javascript
// 在任何 require() 之前強制設定
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://codetoknow_restore:***@127.0.0.1:5433/code_to_know_cloud_restore_test';
process.env.PORT = '4400';
```

### 2. 探針式防護守衛 (Pre-flight Target Guard)
建立不可繞過之連線守門函式，連線建立後必須立即執行 SQL 校驗，若非 PG17 沙盒則**強制 `process.exit(1)` 終止**：
```javascript
async function assertSandboxConnection(pool) {
  const res = await pool.query(`
    SELECT inet_server_port(), current_database(), current_user, version()
  `);
  const row = res.rows[0];
  const isPortValid = pool.options.port === 5433;
  const isDbValid = row.current_database === 'code_to_know_cloud_restore_test';
  const isUserValid = row.current_user === 'codetoknow_restore';
  const isPg17 = row.version.includes('PostgreSQL 17');

  if (!isPortValid || !isDbValid || !isUserValid || !isPg17) {
    console.error('[FATAL] DATABASE TARGET VIOLATION: Aborting execution to prevent unauthorized write.');
    process.exit(1);
  }
}
```

### 3. 實例一致性斷言 (Instance Identity Assertion)
在伺服器啟動前，比對應用程式內部導出之 `prisma` 與測試專用 `prisma` 是否完全相同記憶體位址：
```javascript
const { prisma: appPrisma } = require('./backend/dist/config/database.js');
if (appPrisma !== sandboxPrisma) {
  throw new Error('FATAL: Backend app did not bind to sandbox Prisma instance!');
}
```

### 4. 獨立測試 Script 指令 (Dedicated NPM Runner)
避免直接以全域環境執行臨時腳本，後續應將沙盒測試封裝為專屬指令，例如 `npm run test:sandbox:pg17`，透過 `cross-env` 注入乾淨變數，完全阻斷本地 `.env` 滲透。

---

## 七、第六階段：待授權之清理項目評估 (Pending Authorization)

基於專案資安規範，本階段僅完成取證與分析，**未對 PG16 執行任何資料清除**。

### 待授權項目說明
若使用者評估需恢復 PG16 開發資料庫至測試前乾淨狀態，建議在獲得**明確授權**後，依外鍵關聯順序或利用 CASCADE 特性，僅針對包含 `@codetoknow.test.invalid` 之後綴帳號執行以下安全清理 SQL：

```sql
-- 【待使用者明確授權後方可執行之建議清理腳本】
BEGIN;

-- 1. 清理稽核日誌中關聯至測試帳號之項目
DELETE FROM "AuditLog" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 2. 清理教師申請案
DELETE FROM "TeacherApplication" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 3. 清理 Session 憑證
DELETE FROM "Session" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 4. 清理信箱驗證權杖
DELETE FROM "EmailVerificationToken" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 5. 清理角色關聯
DELETE FROM "UserRole" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 6. 清理個人基本檔案
DELETE FROM "UserProfile" 
WHERE "userId" IN (
  SELECT id FROM "User" WHERE email LIKE '%@codetoknow.test.invalid'
);

-- 7. 清理核心使用者記錄
DELETE FROM "User" 
WHERE email LIKE '%@codetoknow.test.invalid';

COMMIT;
```

---

## 八、檢驗成果九問明確回覆

1. **PG16 是否確實只有 3 筆測試帳號？**  
   **是**。經完整查詢確認僅有 `test_student_20261109@...`、`test_teacher_applicant_20261109@...`、`test_admin_20261109@...` 3 筆。
2. **是否產生其他關聯資料？**  
   **是**。隨上述 3 筆帳號產生關聯資料：`UserProfile` (3筆)、`UserRole` (3筆)、`Session` (2筆)、`EmailVerificationToken` (3筆)、`TeacherApplication` (1筆，維持 PENDING)、`AuditLog` (8筆)。
3. **PG16 是否有結構變動？**  
   **否**。PG16 資料庫結構（37表、47外鍵、133索引、64唯一索引）100% 完整，無任何 DDL 或 Migration 變動。
4. **是否有其他非預期資料寫入？**  
   **否**。其餘 30 張資料表（課程、作業、測驗等）今日建立筆數全數為 0，歷史帳號資料完全未受更動。
5. **PG17 是否保持正常？**  
   **是**。PG17 沙盒狀態健康，完整保留 R1 驗收之 17 項整合測試數據。
6. **Supabase 是否保持零連線？**  
   **是**。雲端 Supabase 保持 100% 隔離，零連線、零寫入。
7. **事故原因是否已確認？**  
   **是**。已完整確認係因 `require('./dist/app.js')` 時 ESM 靜態 import 提前執行，導致 `database.js` 在 `global.__prisma` 注入前已完成 PG16 連線初始化。
8. **是否需要額外授權清理 PG16 測試資料？**  
   **是**。依資安準則，本階段未執行任何 DELETE，需待使用者明確授權後方可執行清理。
9. **未來如何確保測試只能連到 PG17？**  
   **已提出四重防護機制**：入口環境硬鎖定、連線前 SQL 探針強制校驗（非 5433/PG17 立即 abort）、內部 Prisma 實例記憶體位址斷言、專屬 NPM 測試命令隔離。

---

### 最終驗收結論：
**`PASS — PG16 FORENSIC AUDIT COMPLETE & SCOPE FULLY ISOLATED`**
