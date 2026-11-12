# CODE TO KNOW｜Phase 3-C-32：正式切換 SQL 獨立安全審查報告

- **審查階段**：Phase 3-C-32（第二輪 100% 唯讀獨立安全審查）
- **審查日期**：2026-11-12
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **審查對象**：[`DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md)、[`backend/src/utils/audit.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts)、[`backend/src/middleware/error-handler.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/error-handler.ts)、[`backend/src/utils/ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)
- **審查原則**：未連線 Supabase / PG16 / PG17，未執行任何 SQL，未修改任何程式碼、`.env`、Docker 或備份。

---

## 一、11 段正式切換 SQL 逐段安全審查

| 步驟 | SQL 內容摘要 | 執行前提 | 執行順序 | 權限擴張 | 既有資料影響 | Supabase 內部物件影響 | 交易失敗殘留 | 驗證與回復評價 |
|---|---|---|---|---|---|---|---|---|
| **1. 切換前唯讀檢查** | 查詢 `pg_roles`, `pg_namespace`, `pg_class`, `pg_type` | 已取得最新正式備份，以 `postgres` 唯讀連線 | 正確（最先執行） | 無（唯讀） | 無 | 無 | 無 | **PASS**：只讀 `public` 統計，不寫入資料。 |
| **2. 建立角色 (`CREATE ROLE`)** | 建立 `migration_admin` (`NOBYPASSRLS`) 與 `app_runtime` (`BYPASSRLS`)，均設 `LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION`，授 `CONNECT` | 步驟 1 確認角色不存在；強密碼存於安全密碼庫 | 正確 | 無（`app_runtime` 的 `BYPASSRLS` 屬設計待決風險，於獨立報告分析） | 無 | 無 | 非單一交易包裹，若 `app_runtime` 失敗可能已建 `migration_admin` | **CONDITIONAL PASS**：建議註明若 Supabase 拒設 `NOREPLICATION` 時需中止評估，且回復須先 `REVOKE CONNECT` 再 `DROP ROLE`。 |
| **3. Schema 與物件所有權轉移** | `ALTER SCHEMA public OWNER TO migration_admin` ＋迴圈轉移 `pg_tables`, `pg_sequences`, `pg_type` (`e`,`c`) | 步驟 2 成功、無長事務鎖表 | 正確（位於授權前） | 無（`migration_admin` 僅管 `public`） | 無（僅改中繼資料 Owner） | **低至中風險**：嚴格限定 `schemaname = 'public'` 未碰 `auth`/`storage`/`realtime`；**但 Supabase `postgres` 是否有權轉移 `public` Owner 尚未實測** | 採 `BEGIN ... COMMIT` 搭配 `lock_timeout = '5s'`，失敗整段回滾 | **NEEDS LIVE VERIFICATION**：建議補充：若未來 `public` 含 `VIEW`/`MATERIALIZED VIEW`/`FUNCTION`，現行迴圈未涵蓋這三類物件之 Owner 轉移。 |
| **4. TABLE 權限草案** | 同交易開始：`REVOKE CREATE`, `GRANT USAGE ON SCHEMA public`, `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES` | 步驟 3 完成 | 與步驟 5～8 合併於同一交易，無空窗 | **暫時性（交易內）**涵蓋 `AuditLog` 與 `_prisma_migrations`，但於提交前即被步驟 7/8 收回 | 無 | **重要相容性疑問**：Supabase `postgres` 非真 `SUPERUSER`，若步驟 3 已將表 Owner 轉給 `migration_admin` 且 `postgres` 無 `migration_admin` 成員權，**`postgres` 在步驟 4 執行 `GRANT ALL TABLES` 是否會遭拒（`permission denied`）尚未實測** | 採 `BEGIN ... COMMIT` 與步驟 7/8 綁定，不會留下未收斂狀態 | **NEEDS LIVE VERIFICATION**：須實測「`postgres` 對 `migration_admin` 擁有之表執行 `GRANT`/`REVOKE`」權限，或評估改由 `migration_admin` 執行或先賦權再轉 Owner。 |
| **5. SEQUENCE 權限草案** | `REVOKE ALL` 後僅 `GRANT USAGE, SELECT ON ALL SEQUENCES` | 位於步驟 4 同一交易 | 正確 | 無（已嚴格排除 `UPDATE`） | 無 | 同步驟 4（Owner 轉移後之授權權限待實測） | 同步驟 4 原子交易 | **PASS（條件同步驟 4）**：目前 `0` 個 Sequence，具前瞻性。 |
| **6. TYPE 權限草案** | 迴圈對 `public` 自訂 `e`/`c` Type 授 `USAGE` | 步驟 3 完成 | 正確 | 無 | 無 | 同步驟 4 | 同步驟 4 原子交易 | **PASS（條件同步驟 4）**。 |
| **7. `AuditLog` 權限草案** | 同交易 `REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public."AuditLog" FROM app_runtime` 與 `PUBLIC` | 緊接步驟 4 同交易內 | 正確（無空窗） | 無（收斂權限） | 無 | 無 | 同步驟 4 原子交易 | **PASS**：有效鎖定 Runtime ACL Append-only。 |
| **8. `_prisma_migrations` 保護** | 同交易 `REVOKE ALL ON TABLE public."_prisma_migrations" FROM app_runtime, PUBLIC`，然後 `COMMIT` | 緊接步驟 7 同交易內 | 正確 | 無 | 無 | 無 | 同步驟 4 原子交易 | **PASS**。 |
| **9. Default Privileges** | `ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public` | 步驟 2～8 完成 | 正確 | 未來新表預設授 DML（注意：未來若新增不可變稽核表須手動補 `REVOKE`） | 無 | **高機率權限卡關點**：官方文件確認 Supabase `postgres` 非真 `SUPERUSER`，且步驟 2 禁止 `GRANT migration_admin TO postgres`；由 `postgres` 執行 `FOR ROLE migration_admin` **極可能觸發 `42501: must be able to SET ROLE "migration_admin"`** | 獨立 `BEGIN ... COMMIT` 交易 | **HIGH / MEDIUM FINDING**：修正方向為**改由 `migration_admin` 親自連線執行步驟 9**（最安全，無須臨時授權 `postgres`）。 |
| **10. 切換後驗證 SQL** | 唯讀查詢 `pg_roles`, `pg_auth_members`, `pg_tables`, `has_table_privilege`, `pg_default_acl` | 步驟 1～9 完成 | 正確 | 無 | 無 | 無 | 無 | **PASS**：建議額外加上 `has_sequence_privilege(..., 'UPDATE')` 斷言為 `false`。 |
| **11. 預期成功與失敗對照** | 含正向與負向 (`42501`) 測試 | 步驟 10 通過 | 正確 | 無 | 負向測試須採回滾或非破壞性測試 | 無 | 無 | **PASS**。 |

---

## 二、其他安全問題與程式碼現況核對（Section 八）

經本階段重新唯讀檢視後端與前端關鍵原始碼，確認以下事實（**絕不超出現有程式碼證據**）：

1. **`AuditLog` 寫入統一性與防護定性**：
   - 全後端 `backend/src/` 檢索 `auditLog.` 結果顯示，僅 [`backend/src/utils/audit.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/audit.ts#L112-L121) 兩處呼叫 `auditLog.create`，全部業務模組均經統一入口 `logAuditEvent` 並強制經過 `redaction.ts` Fail-closed 脫敏。
   - **安全定性維持不變**：`AuditLog` 僅具備 **Runtime 角色級 Table ACL Append-only 保護**（限制 `app_runtime`），`postgres` 與物件擁有者 `migration_admin` 仍可修改，且 `User` 外鍵 `ON DELETE SET NULL` 僅靠應用層軟刪除防護。
2. **全域錯誤紀錄遮蔽**：
   - [`backend/src/middleware/error-handler.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/middleware/error-handler.ts#L46-L68) 所有未預期錯誤均呼叫 `logSafeError`，且僅在 `NODE_ENV === 'development'` 回傳經 `redactStringSecrets(err.stack)` 脫敏的堆疊，正式環境只回傳通用 `INTERNAL_SERVER_ERROR`。
3. **前端路由守衛現況更正（實地驗證發現）**：
   - 經讀取 [`frontend/src/app/App.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L81-L90)，先前報告提及的 `#sources`（`case 'import-system':`）目前**已加上 `<ProtectedRoute requiredRoles={['ADMIN']} ...>`**，並非無保護狀態。
4. **9 個已實作 API 模型 vs 27 個未建立 API 模型**：
   - [`backend/src/app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts#L72-L76) 仍僅掛載 `/api/auth`、`/api/teachers`、`/api/admin`（涵蓋 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L43-L94) 所列 **9 個模型**）。
   - 其餘 **27 個模型仍為 `NOT_IMPLEMENTED`**，因此**絕不可宣稱 36 個模型已完成資料隔離驗證**。
   - 現有管理員邊界：[`admin.routes.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/modules/admin/admin.routes.ts) 已掛載 `authenticate`、`requireRoles(['ADMIN'])`、`validateParams(applicationIdParamSchema)` 與 `validateQuery(listAuditLogsQuerySchema)`；但管理員「自我審核」邏輯與 `AuthService` 中 3 類事件 `AuditLog.details` 快照仍屬設計強化觀察項。
