# CODE TO KNOW｜Phase 3-C-32：七步回滾方案安全審查報告

- **審查階段**：Phase 3-C-32（第二輪 100% 唯讀獨立安全審查）
- **審查日期**：2026-11-12
- **審查對象**：[`DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md)
- **審查原則**：100% 唯讀審查，未執行任何回滾 SQL。

---

## 一、七步回滾程序逐項安全檢核（Section 六）

| 審查重點 | Phase 3-C-31 回滾草案現況 | 審查評價與風險提示 |
|---|---|---|
| **1. 應用程式切流與 DB 角色變更順序** | 步驟 1 先於 Render / CI 降載或切回舊連線設定，停止產生新連線後，步驟 2 才於資料庫端清除連線。 | **PASS**：順序正確，避免應用不斷重連與資料庫 `DROP ROLE` 競爭。 |
| **2. 舊連線是否仍可能持有權限？** | 若 Render 仍有舊實例或背景 Worker 尚未重啟，舊連線在步驟 2 執行 `pg_terminate_backend` 前仍持有舊 Session 權限；Supavisor Pooler 亦可能快取短暫連線。 | **INFO / MEDIUM**：執行步驟 2 後應立即檢查 `pg_stat_activity` 確認 `0` 筆 `app_runtime` / `migration_admin` 連線，確認 Render 端已無重連進程。 |
| **3. `pg_terminate_backend` 影響範圍** | 限定 `WHERE usename IN ('app_runtime', 'migration_admin') AND pid <> pg_backend_pid()`。 | **PASS（注意中斷影響）**：不影響 `postgres` 維運連線與 Supabase 內部系統連線，但會**立即強制中斷**進行中的應用查詢並自動回滾未提交交易。 |
| **4. 物件所有權回復是否完整？** | 步驟 5 動態迴圈歸還 `pg_tables`、`pg_sequences`、`pg_class (v, m)`、`pg_type (e, c)` 與 `public` Schema Owner 至 `postgres`。 | **LOW FINDING（遺漏 `pg_proc`）**：步驟 4 收回了 `ALL FUNCTIONS` 權限，但步驟 5 歸還 Owner 迴圈**未包含 `pg_proc`（Function / Procedure）**。雖目前專案無自建業務 Function，若未來 `migration_admin` 建立函式將導致步驟 6 `pg_shdepend` 阻擋刪除，建議補上 `pg_proc` 迴圈。 |
| **5. Default Privileges 是否正確回復？** | 步驟 3 針對 `FOR ROLE migration_admin IN SCHEMA public` 撤銷 `TABLES`, `SEQUENCES`, `TYPES`, `FUNCTIONS` 授予 `app_runtime` 的預設權限。 | **PASS（相容性提醒）**：與切換草案步驟 9 相同，若由 `postgres` 執行 `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin`，在 Supabase 非 `SUPERUSER` 下是否允許直接撤銷他角色之 Default ACL 須實機確認（或先由 `migration_admin` 撤銷後再切斷連線）。 |
| **6. Sequence 與 Enum 所有權是否遺漏？** | 步驟 5 已顯式涵蓋 `pg_sequences` 與 `pg_type (typtype IN ('e', 'c'))`（排除衍生 `_` 陣列型別，PG 自動連動）。 | **PASS**。 |
| **7. `pg_shdepend` 與 `DROP ROLE` 前置條件** | 步驟 6 同時檢查全域 `pg_shdepend`（0 rows）與本庫 5 項物件統計（皆為 0），確認全數歸零後步驟 7 才執行不帶強制旗標之 `DROP ROLE`。 | **PASS**：嚴格遵守「禁用 `DROP OWNED BY`」鐵律，利用原生 `DROP ROLE` 依賴保護作為安全保險絲。 |
| **8. 無法原子回滾的步驟與正常使用者影響** | 草案已明確標示步驟 1（Render 切流）與步驟 2（`pg_terminate_backend`）**無法保證單一交易原子性**。 | **PASS**：若在正式切換維護時窗執行，Render 切流與斷線瞬間會導致線上使用者遭遇短暫 API `503`／重試，須於離峰維護時窗進行並提前公告。 |
