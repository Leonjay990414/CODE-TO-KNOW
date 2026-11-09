# CODE TO KNOW｜安全架構最終裁決與決策報告
# PHASE 3C-4F-R14-C-2-2：RLS、Sequence 權限、所有權證據與 Exit Code 1 綜合裁定

**文件編號**：C2K-DOC-DB-R14C22-DECISION-01  
**審查日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**審查性質**：本機唯讀架構與安全審查（未經授權禁止執行任何資料庫變更）  
**對應階段**：PHASE 3C-4F-R14-C-2-2 (補強審查)  

---

## 一、四大審查項目最終裁定矩陣

| 審查維度 | 核心發現與技術事實 | 安全決策與處置方案 | 最終裁決 |
| :--- | :--- | :--- | :--- |
| **1. RLS 與 BYPASSRLS** | 37 張表皆啟用 RLS 且 0 Policies；無 `BYPASSRLS` 會觸發 DEFAULT DENY ALL；Table ACL 仍 100% 保護 AuditLog。 | 正式環境 `app_runtime` 須配置 `BYPASSRLS`；否決手動 Policies（避免效能劣化與破壞未來 Migration）。 | **PASS** |
| **2. Sequence 權限模型** | 現有表全為 UUIDv4，序列數為 0；Prisma 新增僅需 `USAGE`，`UPDATE`（`setval()`）存在 DoS 碰撞隱患。 | 從 Default Privileges 與所有 GRANT 中**徹底剔除 `UPDATE`**，僅保留 `USAGE, SELECT`。 | **PASS** |
| **3. Sequence 所有權證據** | 實體序列數為 0，迴圈未實質處置實體；底層 `pg_class` 與 `pg_shdepend` 斷言已涵蓋目錄層級。 | 實體序列所有權移轉標記為「尚未驗證（非零實體情境）」；保留移轉迴圈以防未來 Schema 引進自增列。 | **PARTIAL PASS** |
| **4. Exit Code 1 原因對帳** | 5 次 Exit Code 1 均獲原始日誌確證；4 次為 PowerShell 參數跳脫錯誤，1 次為預期內缺少 `supabase_vault`。 | 重試皆成功且無髒資料殘留，各項測試目標均 100% 達成驗收。 | **PASS** |

---

## 二、正式環境切換 SQL 修訂細節（修正草案）

依據本階段審查結論，未來正式切換（R14-C-3）所使用之 SQL 腳本應包含以下兩項精準修正（本階段僅留存草案，不執行任何資料庫變更）：

### 修正 1：角色屬性與 RLS 協調
```sql
-- 舊草案（引發後端存取阻斷）：
-- CREATE ROLE app_runtime WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER NOBYPASSRLS;

-- 新草案（架構對齊）：
-- 說明：針對 Supabase ensure_rls 自動啟用特性，授予 BYPASSRLS 避開空 Policy 阻斷；
--       Table ACL (REVOKE UPDATE/DELETE ON "AuditLog") 依然由 PG 核心嚴格強制生效。
CREATE ROLE app_runtime WITH NOLOGIN NOCREATEDB NOCREATEROLE NOSUPERUSER BYPASSRLS;
```

### 修正 2：Sequence 預設權限與 GRANT 剔除 `UPDATE`
```sql
-- 舊草案（過度授權 setval()）：
-- ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
--   GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_runtime;
-- GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_runtime;

-- 新草案（嚴格最小權限）：
ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
```

---

## 三、是否具備進入 R14-C-3（正式雲端切換）的條件？

### 裁決：【NO-GO / 嚴格阻斷 (STRICTLY BLOCKED)】

本機架構審查與沙盒演練雖然已達成技術層面的 100% 就緒，但依照專案最高安全原則，目前**絕對不具備**進入 `R14-C-3` 的前置條件，原因如下：

```
                    ┌───────────────────────────────┐
                    │  R14-C-2-2 技術審查與 SQL 修正 │  -> PASS / 就緒
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │  AUTH-K-01 / 02 本地金鑰保管   │  -> 尚未拍板 (PENDING)
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │  AUTH-B-02 ~ 04 正式即時備份  │  -> 尚未執行 (BLOCKED)
                    └──────────────┬────────────────┘
                                   │
                                   ▼
                    ┌───────────────────────────────┐
                    │  AUTH-C-01 ~ 05 正式切換授權   │  -> 嚴格未授權 (BLOCKED)
                    └───────────────────────────────┘
```

1. **實體金鑰保管尚未就緒**：
   使用者已暫緩 Bitwarden/MFA，本地簡化方案（KeePassXC 資料庫或 BitLocker 隨身碟）尚未建立正式實體保管庫。
2. **切換前正式即時備份尚未執行**：
   在正式資料庫執行任何 DDL / 角色建立前，必須連線 Supabase 執行一次帶有 AES-256-GCM 加密的即時基準備份，並於本機沙盒完成還原驗收。
3. **雲端切換授權尚未簽核**：
   專案負責人明確限制本次僅為本機唯讀審查，未賦予任何雲端操作權限。

---

## 四、下一階段建議工作

建議下一步驟維持本機安全規劃，依序推進：
1. **拍板本地金鑰保管工具**（推薦 KeePassXC 本地保險庫）。
2. **申請正式即時加密備份授權**（`PHASE 3C-4F-R14-C-1-4` 或雲端備份前置）。
3. **完成備份驗收後，方可召開正式切換 GO/NO-GO 審查會**。
