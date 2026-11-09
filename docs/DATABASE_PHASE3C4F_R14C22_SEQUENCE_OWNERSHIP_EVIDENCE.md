# CODE TO KNOW｜Sequence 所有權轉移與回滾證據審查報告
# PHASE 3C-4F-R14-C-2-2：序列所有權移轉、回滾與斷言證據補強

**文件編號**：C2K-DOC-DB-R14C22-SEQ-EVID-01  
**審查日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**審查性質**：本機唯讀架構與安全審查（未經授權禁止執行任何資料庫變更）  
**審查基準**：R14-C-2-1 沙盒執行紀錄、SQL 草案、`pg_class` / `pg_sequences` 系統表清查  

---

## 一、審查目的與準則

在 `PHASE 3C-4F-R14-C-2-1` 報告中，提及「Sequences (0) 移轉與回滾」。為避免在無具體實體序列的情況下產生安全假設盲區，本報告依據嚴格審計準則，重新核對 R14-C-2-1 之執行日誌，檢驗序列在「所有權移轉」、「回滾程序」及「斷言驗證（Assertion）」中的實際證據鏈。

> [!IMPORTANT]
> 審計硬性要求：若既有紀錄沒有具備足夠的非零實體操作證據，必須嚴格標示為**「尚未驗證（非零實體情境）」**，不得因迴圈未報錯而直接推論驗證通過。

---

## 二、七項所有權與證據鏈核驗

### 1. 所有 Sequence 的名稱與數量
- **清查結果**：**public Schema 內之序列數量為 0**。
- **證據**：
  在 R14-C-2-1 步驟 7900 中，還原基準備份後查詢：
  ```sql
  SELECT count(*) AS total_sequences FROM pg_sequences WHERE schemaname = 'public';
  -- 實際輸出：0
  ```
  在步驟 7988 的回滾腳本查詢：
  ```sql
  SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner = 'migration_admin';
  -- 實際輸出：0 筆
  ```
- **結論**：名稱為「無（None）」，數量為「0」。

---

### 2. 原始 Owner 狀態
- **清查結果**：由於 public Schema 內並無序列，故無既有實體序列之原始 Owner。
- **審計標示**：**無實體物件（N/A - Zero Object Baseline）**。

---

### 3. 移轉後 Owner 狀態
- **執行腳本回溯**：
  在 R14-C-2-1 步驟 4 的移轉腳本中：
  ```sql
  FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public') LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO migration_admin', r.sequencename);
    RAISE NOTICE 'Transferred sequence public.% to migration_admin', r.sequencename;
  END LOOP;
  ```
- **實際執行現象**：
  因 `pg_sequences` 為空集合，該迴圈執行次數為 0 次，控制台未輸出任何 `Transferred sequence ...` 之 NOTICE 訊息。
- **審計判定**：
  語法結構正確，但在「實體序列所有權移轉之真實生效性」上屬於**【尚未驗證（非零實體情境）】**。

---

### 4. 回滾後 Owner 狀態
- **執行腳本回溯**：
  在 R14-C-2-1 步驟 7988 的回滾腳本中：
  ```sql
  FOR r IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' AND sequenceowner = 'migration_admin') LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO postgres', r.sequencename);
    RAISE NOTICE 'Reverted sequence public.% to postgres', r.sequencename;
  END LOOP;
  ```
- **實際執行現象**：
  因查詢結果為 0 筆，該迴圈執行次數為 0 次，控制台未輸出任何 `Reverted sequence ... to postgres` 之 NOTICE 訊息。
- **審計判定**：
  語法結構具備對稱性，但由於無實體序列被處置，實體序列回滾屬於**【尚未驗證（非零實體情境）】**。

---

### 5. 是否存在漏移轉的 Sequence？
- **清查結果**：**不存在**。
- **理由**：經全庫清查，`public` Schema 內無任何序列遺漏。

---

### 6. 是否存在額外衍生物件（Derived Objects）？
- **清查結果**：**無**。
- **比對說明**：
  相較於自訂 Enum（如 `AnnouncementStatus` 會自動衍生系統底層陣列型別 `_AnnouncementStatus`），Sequence 在 PostgreSQL 底層是一張特殊資料表（`relkind = 'S'`），不會衍生額外的陣列或複合型別。

---

### 7. 回滾 Assertion 是否涵蓋 Sequence？
- **回滾斷言語法檢查**：
  在 R14-C-2-1 步驟 7990-7994 中，執行了兩項斷言：
  
  **斷言 1：共用依賴檢查 (`pg_shdepend`)**
  ```sql
  SELECT d.classid::regclass, d.objid, r.rolname, d.deptype
  FROM pg_shdepend d
  JOIN pg_roles r ON r.oid = d.refobjid
  WHERE r.rolname IN ('app_runtime', 'migration_admin');
  -- 結果：0 rows
  ```
  *分析*：若有任何序列仍屬於該兩角色，`pg_shdepend` 必定會記錄該物件對角色的擁有者依賴 (`deptype = 'o'`)。該查詢回傳 0，證實無任何物件（含序列）殘留。

  **斷言 2：物件持有統計檢查**
  ```sql
  SELECT 'tables' AS obj, count(*) FROM pg_tables WHERE tableowner IN ('app_runtime', 'migration_admin')
  UNION ALL
  SELECT 'types' AS obj, count(*) FROM pg_type t JOIN pg_roles r ON r.oid = t.typowner WHERE r.rolname IN ('app_runtime', 'migration_admin')
  UNION ALL
  SELECT 'classes' AS obj, count(*) FROM pg_class c JOIN pg_roles r ON r.oid = c.relowner WHERE r.rolname IN ('app_runtime', 'migration_admin')
  UNION ALL
  SELECT 'namespaces' AS obj, count(*) FROM pg_namespace n JOIN pg_roles r ON r.oid = n.nspowner WHERE r.rolname IN ('app_runtime', 'migration_admin');
  ```
  *分析*：在 PostgreSQL 中，Sequence 於 `pg_class` 的 `relkind` 為 `'S'`。因為該查詢已涵蓋 `pg_class`（統計為 0），所以在底層目錄層級，Sequence 已經被間接涵蓋。
  
- **不足之處與補強建議**：
  雖然 `pg_class` 間接涵蓋，但斷言統計列表中未獨立顯示 `SELECT 'sequences' AS obj, count(*) FROM pg_sequences WHERE sequenceowner IN (...)`。從嚴格審計視角，斷言清單應明確加入 `pg_sequences` 獨立統計行。

---

## 三、審查結論與判定標示

| 審查維度 | 實質狀態 | 審計標示 | 處置與補強建議 |
| :--- | :--- | :--- | :--- |
| **現有庫序列盤點** | 數量嚴格為 0 | **PASS** | 現行業務無序列需求（全 UUIDv4） |
| **移轉腳本邏輯** | 語法正確，因集合為空未實體觸發 | **PARTIAL PASS (形式通過)** | 無實體物件可供移轉 |
| **回滾腳本邏輯** | 語法正確，因集合為空未實體觸發 | **PARTIAL PASS (形式通過)** | 無實體物件可供回滾 |
| **非零實體移轉演練** | 未在具備真實 Sequence 之環境演練 | **尚未驗證 (NON-ZERO UNVERIFIED)**| 未來若引入自增序列，須專案補測 |
| **回滾斷言覆蓋度** | `pg_shdepend` 與 `pg_class` 覆蓋 | **PASS** | 建議於斷言 SQL 顯式加入 `pg_sequences` |

**最終審定**：
目前正式庫因全數採用 UUIDv4，無序列所有權移轉之立即風險。但本報告誠實記錄「非零實體情境尚未驗證」，並建請在切換腳本中持續保留 Sequence 移轉與回滾迴圈，以防未來 Schema 變更。
