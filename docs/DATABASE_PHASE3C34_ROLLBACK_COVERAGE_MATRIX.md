# CODE TO KNOW｜Phase 3-C-34：切換物件與七步回滾覆蓋對照矩陣

- **審查階段**：Phase 3-C-34（100% 唯讀交叉審查）
- **建立日期**：2026-11-12
- **比對文件**：[`DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md) vs [`DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md)

---

## 一、切換 SQL 物件 vs 回滾物件逐項覆蓋對照表（Section 五）

| # | 物件／權限類別 | 切換 SQL 異動內容（C33） | 回滾 SQL 復原內容（C33） | 覆蓋判定 |
|---|---|---|---|---|
| **1** | **Schema (`public`)** | 授 `migration_admin` `USAGE, CREATE`、`app_runtime` `USAGE`；`ALTER SCHEMA public OWNER TO migration_admin` | 步驟 4 `REVOKE ALL ON SCHEMA public`；步驟 5 `ALTER SCHEMA public OWNER TO postgres` | **FULL COVER** |
| **2** | **Table (37 表)** | 授 `app_runtime` DML；全部轉為 `migration_admin` Owner | 步驟 4 `REVOKE ALL ON ALL TABLES`；步驟 5 迴圈將 `migration_admin`/`app_runtime` 擁有之表歸還 `postgres` | **FULL COVER** |
| **3** | **View (`v`)** | 步驟 8 迴圈轉為 `migration_admin` Owner | 步驟 5 迴圈 `relkind = 'v'` 歸還 `postgres` | **FULL COVER** |
| **4** | **Materialized View (`m`)** | 步驟 8 迴圈轉為 `migration_admin` Owner | 步驟 5 迴圈 `relkind = 'm'` 歸還 `postgres` | **FULL COVER** |
| **5** | **Sequence** | 授 `app_runtime` `USAGE, SELECT`；轉為 `migration_admin` Owner | 步驟 4 `REVOKE ALL ON ALL SEQUENCES`；步驟 5 迴圈歸還 `postgres` | **FULL COVER** |
| **6** | **Enum / Composite / Domain Type** | 授 `app_runtime` `USAGE`；`typtype IN ('e','c')` 轉為 `migration_admin` Owner（目前 Schema 有 `1` Enum、`0` Domain） | 步驟 4 迴圈 `REVOKE ALL ON TYPE`；步驟 5 迴圈歸還 `postgres`（`INFO`：未來若新增 Domain 可擴充 `'d'`） | **FULL COVER（現有結構）** |
| **7** | **Function (`pg_proc`)** | 切換不主動轉移 Supabase 內建函式；僅未來 `migration_admin` 可能新建 | 步驟 4 `REVOKE ALL ON ALL FUNCTIONS`；步驟 5 迴圈 `pg_proc` (`prokind <> 'p'`) 歸還 `postgres` | **FULL COVER（C32 缺口已補齊）** |
| **8** | **Procedure (`pg_proc`)** | 切換不主動轉移；未來可能新建 | 步驟 5 迴圈 `pg_proc` (`prokind = 'p'`) `ALTER PROCEDURE ... OWNER TO postgres` | **FULL COVER（C32 缺口已補齊）** |
| **9** | **Default Privileges** | 由 **`migration_admin`** 設定 `TABLES`/`SEQUENCES`/`TYPES` 給 `app_runtime` | 步驟 3 由 **`migration_admin`** 撤銷 `TABLES`/`SEQUENCES`/`TYPES`/`FUNCTIONS`（建議於步驟 2 先留 `migration_admin` 執行完步驟 3 再斷線） | **FULL COVER** |
| **10** | **`AuditLog` ACL** | `REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER` 並留 `SELECT, INSERT` | 步驟 4 `REVOKE ALL` 清除 `app_runtime` 權限；步驟 5 Table Owner 歸還 `postgres` | **FULL COVER** |
| **11** | **`_prisma_migrations` ACL** | `REVOKE ALL` 給 `app_runtime` 與 `PUBLIC` | 步驟 4 `REVOKE ALL`；步驟 5 Table Owner 歸還 `postgres` | **FULL COVER** |
| **12** | **Role Membership** | 無額外 `GRANT role TO role`（`NOINHERIT`） | 步驟 6 檢查並步驟 7 `DROP ROLE` | **FULL COVER** |
| **13** | **Object Ownership** | 僅轉移 `public` Schema 業務物件給 `migration_admin` | 步驟 5 全物件迴圈歸還 `postgres`；步驟 6 統計 `remaining_* = 0` | **FULL COVER** |
| **14** | **`pg_shdepend`** | 跨庫依賴隨角色與授權產生 | 步驟 6 強制斷言 `pg_shdepend` 必須為 `0 rows` 方可執行 `DROP ROLE` | **FULL COVER** |

---

## 二、回滾七項安全確認結論

1. **每個被轉移 Owner 的物件都有歸還方案**：**是**（且排除 `auth`/`storage` 等系統物件）。
2. **每個新增 `GRANT` 都有對應 `REVOKE`**：**是**。
3. **Default Privileges 建立者與回復執行者一致**：**是**（均為 `migration_admin`）。
4. **`DROP ROLE` 前無剩餘 Owner 或依賴**：**是**（雙重系統目錄斷言為 `0`）。
5. **不使用 `DROP OWNED BY`**：**是**（明文禁止）。
6. **非原子步驟有中斷處理方案**：**是**（Render 切流與 `pg_terminate_backend` 標示為非原子並安排於離峰維護時窗）。
7. **回滾不會意外刪除既有資料**：**是**（僅修改中繼資料與權限，步驟 7 並驗證核心資料筆數）。
