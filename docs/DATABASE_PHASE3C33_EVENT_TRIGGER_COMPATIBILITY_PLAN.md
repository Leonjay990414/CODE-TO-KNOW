# CODE TO KNOW｜Phase 3-C-33：Event Trigger（`ensure_rls` / `rls_auto_enable`）與 Schema 相容性計畫

- **文件階段**：Phase 3-C-33（純設計與驗證規劃；**嚴禁停用、修改或刪除 Supabase Event Trigger**）
- **建立日期**：2026-11-12

---

## 一、`ensure_rls` / `rls_auto_enable` 機制與已知證據區分

| 項目 | 具體內容 | 證據來源分類 |
|---|---|---|
| **觸發條件** | 綁定 `ON ddl_command_end WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')`，僅對 `schema_name = 'public'` 的新資料表自動執行 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`。 | **Supabase 官方文件可確認** |
| **函式執行權限** | `public.rls_auto_enable()` 宣告為 `SECURITY DEFINER SET search_path = pg_catalog`，由高權限系統／管理帳號擁有，並對 `PUBLIC` 收回 `EXECUTE`。 | **Supabase 官方文件可確認** |
| **現有 37 表 RLS 狀態** | `public` Schema 全 37 張表（36 業務表 + `_prisma_migrations`）目前已全部啟用 `ENABLE ROW LEVEL SECURITY` 且 `0` 條 Policy。 | **本機 PG17 還原庫實證（Phase 3-C-13）** |
| **`migration_admin` 建表相容性** | 當 `NOSUPERUSER` 的 `migration_admin` 執行 `prisma migrate deploy` 建立新表時，`ddl_command_end` 是否能無權限衝突地觸發 `rls_auto_enable()` 並成功提交遷移。 | **必須連線 Supabase 實機驗證** |

---

## 二、`migration_admin` 建表權限與 RLS 無 Policy 之影響分析

1. **Migration 建立新資料表時可能遇到的權限問題**：
   - `migration_admin` 必須具備 `USAGE, CREATE ON SCHEMA public` 且成為 `public` Schema Owner（若 Supabase 託管允許）。
   - `rls_auto_enable()` 採 `SECURITY DEFINER`，理論上以函式建立者身分執行 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`，無須 `migration_admin` 成為 `SUPERUSER`；但若 Supabase 內部實作對物件擁有者有特殊限制，仍須透過受控沙盒式驗證（建立測試表並立即 `DROP`）實測確認。
   - **安全鐵律**：無論實測結果為何，**嚴禁**停用、修改或刪除 Supabase 預設 `ensure_rls` Event Trigger。
2. **RLS 自動啟用後「沒有 Policy」的雙面影響**：
   - **正面保護**：可確保 Supabase Data API（`anon` / `authenticated` 角色）對新表保持**預設全部拒絕（Default Deny）**，防止新表資料意外透過 PostgREST 暴露。
   - **對 `app_runtime` 的影響**：
     - 若 `app_runtime` 採 **`BYPASSRLS`**：可正常存取新表，但沒有 DB 層列級隔離（須仰賴後端 `ownership.ts`）。
     - 若未來轉向 **`NOBYPASSRLS`**：任何新表只要忘記在同一支 Migration 內補寫 `CREATE POLICY`，`app_runtime` 將立刻被拒絕查詢，導致新功能上線即停機。

---

## 三、Migration 完成後的 RLS 與 Policy 唯讀驗證清單

未來每次執行 `prisma migrate deploy` 後，維運或 CI 驗收應執行以下唯讀檢查（**本階段不執行**）：

```sql
-- [VALIDATION CHECKLIST] Migration 完成後之 Schema Owner、RLS 與 Policy 驗證
-- 1. 確認 public 下所有表均已啟用 RLS（預期 relrowsecurity = true 之缺漏數 = 0）
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;

-- 2. 確認 public 下所有表（含新建表）Owner 均為 migration_admin（預期 0 rows）
SELECT tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public' AND tableowner <> 'migration_admin';

-- 3. 盤點各表 RLS Policy 數量（確認預期狀況，防止無意間開放寬鬆 Policy 給 anon/authenticated）
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. 若新表屬於 AuditLog 類不可修改表，確認已顯式 REVOKE UPDATE, DELETE, TRUNCATE FROM app_runtime
SELECT table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'app_runtime'
  AND table_schema = 'public'
  AND table_name IN ('AuditLog', '_prisma_migrations')
ORDER BY table_name, privilege_type;
```
