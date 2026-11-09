# CODE TO KNOW｜Supabase 正式庫最小權限 SQL 最終安全技術複核報告 (Phase 3C-4F-R14-C-0.5)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14C05-REVIEW`  
**建立時間**：2026-11-09  
**主導角色**：獨立資安審查員 / PostgreSQL DBA / 後端安全架構師  
**審查性質**：100% 唯讀最終安全技術複核（零雲端連線、零資料庫寫入、零程式碼修改、零角色更動）  
**前置文件**：  
- `docs/DATABASE_PHASE3C4F_R14C0_MINIMUM_PRIVILEGE_IMPLEMENTATION_PLAN.md`  
- `docs/DATABASE_PHASE3C4F_R14C0_SQL_REVIEW_AND_ROLLBACK_PLAN.md`  
- `docs/DATABASE_PHASE3C4F_R14C0_AUTHORIZATION_CHECKLIST.md`  
- `backend/prisma/migrations/20261103000000_init/migration.sql`  
- `backend/prisma/migrations/20261108000000_add_business_models/migration.sql`  
- `scripts/database/backup-crypto.cjs`

---

## 一、報告摘要與 R14-C-0.5 審查判定

本報告依據 PHASE 3C-4F-R14-C-0.5 指示，對 R14-C-0 的三份前置規劃文件進行最後一次技術正確性與資安防護複核。

經由逐行比對 Prisma Migration SQL、PostgreSQL 17 權限體系與 Supabase 託管環境特性，審查團隊在 R14-C-0 原始方案中發現了 **3 項關鍵缺失與過度授權隱患**：
1. **`migration_admin` 過度授予 `CREATEDB` 權限**：Prisma 生產環境部署（`prisma migrate deploy`）僅套用既有遷移至現有資料庫，絕不建立 Shadow Database，不需要亦不應授予 `CREATEDB`。
2. **所有權移轉遺漏「自訂 Enum 類型」**：遷移 SQL 中包含 `CREATE TYPE "AnnouncementStatus" AS ENUM (...)`。R14-C-0 僅移轉資料表與序列，若未將自訂 Enum 類型移轉給 `migration_admin`，未來針對 Enum 的 `ALTER TYPE` 將因非 Owner 而被資料庫阻斷。
3. **`AuditLog` 權限過度寬鬆**：R14-C-0 規劃全表授予 `SELECT, INSERT, UPDATE, DELETE`，然而審計日誌（AuditLog）依資安規範必須維持不可篡改（Append-only），`app_runtime` 嚴禁具備 `UPDATE` 與 `DELETE` 權限。

> ### **R14-C-0.5 審查判定：`PARTIAL PASS`（問題已查明並完成技術修正，執行維持 `BLOCKED`）**
> 
> - **技術複核與方案校正**：**PASS**（已補齊 Enum 所有權移轉、移除 CREATEDB、落實 AuditLog 不可篡改防禦）。
> - **環境狀態與雲端授權**：**BLOCKED**（嚴格遵守最高安全限制，不連線正式庫、不執行 SQL，等待專案負責人授權）。

---

## 二、六大核心項目審查與技術修正 (W-01 ~ W-06)

---

### W-01｜Migration 角色權限精確化審查

對 `migration_admin` 角色屬性進行逐項技術必要性評估：

| 角色屬性 / 權限 | R14-C-0 原規劃 | 實際 Prisma 生產需求分析 | 最終審查決策 | 修正理由與依據 |
| :--- | :---: | :--- | :---: | :--- |
| **`CREATEDB`** | **授予** | **完全不需要**。`prisma migrate deploy` 僅執行現有 SQL 於目標庫，僅在開發端 `migrate dev` 才需建立 Shadow DB。 | **移除<br>(NOCREATEDB)** | 遵循最小權限原則，杜絕雲端資料庫遭額外建立獨立 DB 之濫用風險。 |
| **`CREATEROLE`** | **不授予** | 不需要。Prisma Migration 不管理 PostgreSQL 角色。 | **維持<br>(NOCREATEROLE)** | 杜絕提權風險。 |
| **`BYPASSRLS`** | **不授予** | 不需要。Table Owner 身分已能管理自身物件。 | **維持<br>(NOBYPASSRLS)** | 防止越權繞過系統其他租戶或擴展之 RLS。 |
| **public `CREATE`** | **授予** | **絕對必要**。Prisma CLI 必須執行 `CREATE TABLE`, `CREATE INDEX`, `CREATE TYPE`。 | **維持授予** | 結構遷移核心必要權限。 |
| **Advisory Lock** | **允許** | **絕對必要**。Prisma CLI 啟動時必須調用 `pg_advisory_lock` 防併發。 | **維持允許** | 透過 Session Pooler (5432) 保證鎖定有效性。 |

**【修正後角色建立 DDL 草案】**：
```sql
CREATE ROLE migration_admin WITH 
    LOGIN 
    PASSWORD '***MIGRATION_ADMIN_STRONG_PASSWORD***' 
    NOSUPERUSER 
    NOCREATEDB 
    NOCREATEROLE 
    NOBYPASSRLS;
```

---

### W-02｜Runtime 最小權限與審計防護審查

#### 1. `AuditLog` 審計防禦補強 (Append-Only)
- **問題**：R14-C-0 原始規劃授予 `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;`。
- **資安隱患**：一旦 Express 後端 API 遭受 SQL 注入或金鑰洩漏，攻擊者可調用 `DELETE FROM "AuditLog"` 銷毀登入失敗、角色變更或敏感操作痕跡。
- **修正對策**：實施審計表專屬保護：
  ```sql
  -- 1. 先授予 public 表基本權限
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;

  -- 2. 嚴格收回 AuditLog 的 UPDATE 與 DELETE 權限（維持不可篡改性）
  REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog" FROM app_runtime;

  -- 3. 嚴格收回 _prisma_migrations 之所有權限
  REVOKE ALL PRIVILEGES ON TABLE public._prisma_migrations FROM app_runtime;
  ```

#### 2. RLS 與 `NOBYPASSRLS` 現況確認
- **現況事實**：經檢查 13 筆 Migration SQL，Prisma 未在任何資料表執行 `ENABLE ROW LEVEL SECURITY`。
- **影響評估**：在未啟用 RLS 的情況下，`NOBYPASSRLS` 屬性不會干擾 `app_runtime` 的正常 DML 查詢。
- **營運防線警告**：維運人員未來**嚴禁在 Supabase Studio 隨意點擊啟用 RLS**。若需啟用，必須同時建立涵蓋 `app_runtime` 的專屬 Policy，否則將導致後端查詢返回 0 筆。

---

### W-03｜資料庫物件完整性審查（補齊 Enum Types）

審查團隊全面盤點 `backend/prisma/migrations/`，確認資料庫物件清單如下：
- **Base Tables**：37 張（36 張業務表 + 1 張 `_prisma_migrations`）。
- **Sequences**：0 個（所有主鍵皆為 TEXT/UUID，但保留 sequence 移轉邏輯作為防禦相容）。
- **Custom Enum Types**：**1 個**（`AnnouncementStatus`，定義於 `20261108000000_add_business_models/migration.sql:2`）。
- **Indexes / Foreign Keys**：133 個索引與 47 組外鍵（伴隨 Table Owner 移轉自動繼承）。
- **Functions / Triggers / Views**：目前遷移中皆為 0。

**【R14-C-0 遺漏點修訂】**：
在所有權移轉 SQL 中，必須補齊 `pg_type` 移轉，確保 `AnnouncementStatus` 之 Owner 轉移給 `migration_admin`：
```sql
-- 補齊 Enum Types 所有權移轉
FOR r IN (
    SELECT t.typname 
    FROM pg_type t 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE n.nspname = 'public' 
      AND t.typtype = 'e'
) LOOP
    EXECUTE 'ALTER TYPE public.' || quote_ident(r.typname) || ' OWNER TO migration_admin;';
END LOOP;
```

---

### W-04｜Default Privileges 完整性審查

確保未來 `migration_admin` 執行 Migration 時自動繼承：
1. **TABLES**：自動授予 `app_runtime` DML（`SELECT, INSERT, UPDATE, DELETE`）。
2. **SEQUENCES**：自動授予 `app_runtime` `USAGE, SELECT, UPDATE`。
3. **TYPES (新增)**：自動授予 `app_runtime` `USAGE` 權限（確保未來新增 Enum 類型時後端能正常讀寫欄位值）。
```sql
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public 
  GRANT USAGE ON TYPES TO app_runtime;
```

---

### W-05｜回滾方案差異與缺口分析 (Rollback Gap Analysis)

針對 R14-C-0 的四種回滾情境進行深度缺口分析：

| 回滾情境 | R14-C-0 原方案缺陷 | R14-C-0.5 補強修正方案 | 修正後可行性 |
| :--- | :--- | :--- | :---: |
| **情境 A：所有權還原** | 僅還原 Table 與 Sequence，遺漏 Enum Type 還原 | 增加 Enum Type 還原至 `postgres` 之 PL/pgSQL 迴圈 | **100% 可行** |
| **情境 B：權限撤銷** | 遺漏撤銷 Default Privileges on Types | 增加 `REVOKE USAGE ON TYPES` 之撤銷指令 | **100% 可行** |
| **情境 C：角色刪除** | 若物件依賴未清理，直接 `DROP ROLE` 會拋錯失敗 | 先檢查依賴，或執行 `DROP OWNED BY` 後再刪除角色 | **100% 可行** |
| **情境 D：備份還原** | **重大營運警示**：上線後若執行備份還原，將覆蓋上線後產生的真實用戶資料 | 明確標記：**備份還原僅限於切換前/切換維護窗口內**。正式上線後嚴禁以全量覆蓋作為回滾手段。 | **邊界確立** |

---

### W-06｜AES-256-GCM 備份流程安全性審查

針對 R14-B-1 實作之 `scripts/database/backup-crypto.cjs` 進行整合性審查：
1. **完整 Dump 產出保證**：`run_supabase_backup.ps1` 透過 Docker PG17 工具產出完整自訂格式 Dump，滿足 `(ExitCode=0) AND (大小>0) AND (SHA256成功)`。
2. **Nonce 唯一性**：每次加密使用 `crypto.randomBytes(12)` 生成動態 Nonce，嚴禁 IV 重用。
3. **Auth Tag 驗證隔離**：解密過程嚴格寫入 `.tmp` 暫存檔，只有當 16-byte Auth Tag 驗證成功後才原子化 rename 為正式檔，未驗證資料絕不流入還原管線。
4. **雜湊鏈設計**：
   - 明文備份：`*.dump.sha256`
   - 加密備份：`*.dump.enc.sha256`
   雙重數位指紋確保檔案完整性。
5. **沙盒還原演練**：必須於本地 PG17 沙盒（Port 5433）完成還原驗收，驗證 37 表無損。

---

## 三、審查結論與交付文件指引

1. R14-C-0 原始方案的大方向正確，但細節上存在 `CREATEDB` 過度授權、Enum Type 遺漏以及 `AuditLog` 未防篡改等問題。
2. 本次審查已將所有技術缺陷於本報告及後續 3 份交付文件中全數校正完畢。
3. 接續產出之文件：
   - `docs/DATABASE_PHASE3C4F_R14C05_PERMISSION_MATRIX_FINAL.md`：校正後之最終權限矩陣。
   - `docs/DATABASE_PHASE3C4F_R14C05_ROLLBACK_GAP_ANALYSIS.md`：回滾缺口深度分析與修訂腳本。
   - `docs/DATABASE_PHASE3C4F_R14C05_AUTHORIZATION_READINESS.md`：正式授權準備度判定與卡關條件。
