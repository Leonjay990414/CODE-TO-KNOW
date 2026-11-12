# CODE TO KNOW｜Phase 3-C-34：角色與權限一致性矩陣

- **審查階段**：Phase 3-C-34（100% 唯讀交叉審查）
- **建立日期**：2026-11-12
- **比對對象**：[`DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md) 與 [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts)

---

## 一、三角色權限矩陣交叉核對（Section 三）

| 權限／屬性項目 | `postgres`（原廠管理帳號） | `migration_admin`（DDL 與 Owner） | `app_runtime`（Express 執行期） | 跨文件與實測狀態 |
|---|---|---|---|---|
| **登入與安全屬性** | 雲端預設管理角色（非真 `SUPERUSER`，具 `CREATEROLE`/`CREATEDB`/`BYPASSRLS`） | `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT NOREPLICATION` | `LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS NOINHERIT NOREPLICATION` | **`NOREPLICATION` 與 Supavisor 登入待實機驗證** |
| **角色成員關係 (`pg_auth_members`)** | 不隸屬 `migration_admin` / `app_runtime` | 無任何成員資格或被繼承關係 | 無任何成員資格或被繼承關係（禁 `SET ROLE postgres`/`migration_admin`） | **設計一致（PG17 沙盒曾測拒提權；正式庫待驗證）** |
| **Schema (`public`) 權限與 Owner** | 切換後移轉 `public` Owner 給 `migration_admin`（保留 `auth`/`storage`/`realtime` 等系統 Schema） | 規劃為 `public` Owner ＋ `USAGE, CREATE ON SCHEMA public` | 僅 `USAGE ON SCHEMA public`；顯式 `REVOKE CREATE ON SCHEMA public` | **`ALTER SCHEMA public OWNER TO migration_admin` 待實機驗證** |
| **35 張一般業務表** | 切換前先以 Owner 身分授 `app_runtime` DML，再轉交 Owner | 全部 37 張 `public` 表（36 業務 + `_prisma_migrations`）之 **Owner** | 僅 `SELECT, INSERT, UPDATE, DELETE`（無 `TRUNCATE`, `REFERENCES`, `TRIGGER`, `ALTER`, `DROP`） | **設計一致；切換順序已消除 `42501` 授權順序風險** |
| **`AuditLog` 權限** | 切換後僅由高權限緊急維護管理 | `AuditLog` **Table Owner**（保留遷移結構調整能力） | 僅 `SELECT, INSERT`；同交易顯式 `REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`（亦對 `PUBLIC` `REVOKE ALL`） | **Runtime 角色級 Append-only（PG17 已測 `42501`；正式庫待實裝）** |
| **`_prisma_migrations` 權限** | 切換後交由 `migration_admin` 管理 | `_prisma_migrations` **Table Owner** | **`REVOKE ALL`**（亦對 `PUBLIC` `REVOKE ALL`） | **零權限隔離（PG17 已測；正式庫待實裝）** |
| **Sequences** | 切換前授權，再轉交 Owner | `public` Sequences 之 **Owner** | 僅 `USAGE, SELECT`（**嚴禁 `UPDATE`**） | **目前 `0` 個 Sequence，具前瞻相容性** |
| **Views / Materialized Views** | 切換前若有則轉交 Owner | `public` Views / MViews 之 **Owner** | 依 `ALL TABLES` 授權僅限 DML 讀取/更新（視定義而定） | **C33 已補齊 `relkind IN ('v', 'm')` Owner 轉移** |
| **Enum / Type (`AnnouncementStatus`)** | 切換前授 `USAGE`，再轉交 Owner | `public` 自訂 Enum / Composite Type 之 **Owner** | 僅 `USAGE`（無 `ALTER TYPE` 權限） | **設計一致** |
| **Functions / Procedures** | 保留 Supabase 內建 `rls_auto_enable()` 等系統函式 | **不強奪** Supabase 系統函式；僅擁有自己未來建立之函式 | 無 `CREATE` 權限；不開放未授權系統函式 | **C33 已正確避開轉移 `rls_auto_enable()`** |
| **Default Privileges** | **不代為設定**（避免非真 `SUPERUSER` 觸發 `42501`） | **由 `migration_admin` 親自連線執行** `ALTER DEFAULT PRIVILEGES IN SCHEMA public` | 自動繼承 `TABLES` (DML)、`SEQUENCES` (`USAGE, SELECT` 無 `UPDATE`)、`TYPES` (`USAGE`) | **修正後完全符合 PostgreSQL 權限模型** |

---

## 二、特別檢查項目結論

1. **轉移 Owner 前後 `GRANT` 是否仍然有效？**：**是**。在 PostgreSQL 中，對 `app_runtime` 授予的物件 ACL 儲存在物件本身的 `relacl` / `seqacl` / `typacl` 中，不會因物件 Owner 從 `postgres` 轉移給 `migration_admin` 而失效。
2. **SQL 區塊失敗後是否會留下部分切換狀態？**：步驟 3～7（授權與 `AuditLog`/`_prisma_migrations` 收斂）合併於單一交易，步驟 8（Owner 轉移）為單一交易，步驟 9（Default Privileges）為單一交易；任一區塊失敗即整塊 `ROLLBACK`，配合步驟 2 建號前檢查與 7 步回滾方案可完整清除殘留。
3. **是否意外授予 `PUBLIC` 或其他角色權限？**：無。`AuditLog` 與 `_prisma_migrations` 均顯式對 `PUBLIC` 執行 `REVOKE ALL`，且兩新建角色均設 `NOINHERIT`、無 `pg_auth_members` 繼承。
