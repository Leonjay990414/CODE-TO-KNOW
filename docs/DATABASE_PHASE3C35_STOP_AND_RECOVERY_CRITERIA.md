# CODE TO KNOW｜Phase 3-C-35：強制停止條件與復原處置規格

- **文件階段**：Phase 3-C-35（純安全防護規劃）
- **建立日期**：2026-11-12

> **總則**：一旦觸發下列任一停止條件，**必須立即停止執行並禁止繼續嘗試修改正式環境**，維持現狀保護資料完整並立即回報使用者。

---

## 一、十項強制停止條件與對應處置（Section 六）

| # | 強制停止條件 | 偵測方式 | 立即停止後之復原與處置動作 |
|---|---|---|---|
| **STOP-01** | **備份 SHA-256 不一致** | 新備份產出或解密比對時，`Get-FileHash` 與預期 `.sha256` 不符 | 立即標記該次備份無效並停止後續切換；不可使用損毀備份作為還原點。 |
| **STOP-02** | **C2KB 解密驗證失敗** | `backup-crypto.cjs` 報錯 AES-256-GCM AuthTag 驗證失敗或格式錯誤 | 立即停止；檢查 KeePassXC 金鑰對應與傳輸完整性，不可進入角色切換。 |
| **STOP-03** | **TLS 主機名稱驗證失敗** | `verify-full` 或 Node.js `rejectUnauthorized: true` 握手失敗，或官方 CA 指紋不符 | 立即停止連線並檢查 CA 檔來源與 Host；**嚴禁**以 `rejectUnauthorized: false` 或覆寫 `checkServerIdentity` 繞過。 |
| **STOP-04** | **出現未預期的權限提升** | `pg_auth_members` 非空、`app_runtime` 可執行 `SET ROLE` 或取得 `SUPERUSER`/`CREATEROLE` | 立即中止切換、撤銷多餘成員權限或啟動 7 步受控回滾；禁於 Render 啟用。 |
| **STOP-05** | **`AuditLog` 可被 Runtime `UPDATE` 或 `DELETE`** | `has_table_privilege('app_runtime', 'public."AuditLog"', 'UPDATE'/'DELETE'/'TRUNCATE')` 為 `true` 或實測未回傳 `42501` | 立即阻斷上線、追查 `PUBLIC` 或群組殘留授權；無法收斂則執行 7 步回滾。 |
| **STOP-06** | **`_prisma_migrations` 出現非預期權限** | `app_runtime` 或 `PUBLIC` 對 `public."_prisma_migrations"` 具任何讀寫權限 | 立即 `REVOKE ALL` 並追查來源；未確認歸零前禁止上線。 |
| **STOP-07** | **Event Trigger 行為與預期不同** | `ensure_rls` 遺失、或 `migration_admin` 建表觸發 `rls_auto_enable()` 時報權限錯 | 立即停止（**嚴禁停用或刪除 Supabase Event Trigger**），記錄錯誤並啟動回滾歸還 Owner。 |
| **STOP-08** | **Owner 轉移造成物件不可存取** | `ALTER SCHEMA public OWNER` 遭拒，或轉移後 `app_runtime`/`migration_admin` 發生非預期存取中斷 | 若於單一交易內則自動 `ROLLBACK`；若已部分提交則執行 7 步回滾歸還 Owner 至 `postgres`。 |
| **STOP-09** | **回滾依賴無法清除** | 回滾步驟 6 查詢 `pg_shdepend` 或剩餘物件計數 `> 0`，導致 `DROP ROLE` 遭拒 | **絕對禁止使用 `DROP OWNED BY`**；立即停止刪除角色，逐筆查明 `classid`/`objid` 歸還 `postgres` 後再重檢。 |
| **STOP-10** | **測試意外連到 PG16、正式 Supabase 或其他非授權資料庫** | 連線檢查發現 Host/Port/DB/Role 偏離授權目標（如誤觸 `5432` PG16、`5433` 還原庫或未授權雲端操作） | **最高級別中止**：立即斷線終止進程、封存當下狀態並回報使用者盤點影響。 |
