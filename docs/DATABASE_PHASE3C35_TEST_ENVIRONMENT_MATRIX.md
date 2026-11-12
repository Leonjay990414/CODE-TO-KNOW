# CODE TO KNOW｜Phase 3-C-35：實機測試環境分級矩陣（區域 A / B / C）

- **文件階段**：Phase 3-C-35（純規劃文件；**未執行任何測試或連線**）
- **建立日期**：2026-11-12

---

## 一、三區域風險總覽

| 區域 | 環境目標 | 測試內容摘要 | 風險等級與性質 |
|---|---|---|---|
| **區域 A** | **本機 PG17 Sandbox**（`127.0.0.1:5434` 隔離容器；嚴禁觸碰 PG16 `5432` 與歷史還原庫 `5433`） | 修正版 11 段切換 SQL、7 步回滾 SQL（含 `pg_proc`）、`migration_admin` / `app_runtime` 權限與 `AuditLog` / `_prisma_migrations` 測試 | **低（隔離環境風險）**：完全不影響正式環境與開發庫 |
| **區域 B** | **Supabase 正式環境**（`aws-0-ap-southeast-2.pooler.supabase.com:5432`） | 最新備份、官方 CA 比對、唯讀探索、自建角色建立與 Supavisor SCRAM/TLS、`ensure_rls` 相容性、正式切換與回滾驗證 | **高（正式資料庫風險）**：涉及正式資料庫角色與物件 Owner 異動 |
| **區域 C** | **Render 正式環境**（Web Service + CI/CD） | 注入 `app_runtime` `DATABASE_URL`、重啟後 `/api/health`、Auth/Session/CSRF 與生產連線穩定度驗證 | **極高（正式服務中斷風險）**：影響線上使用者連線與服務可用性 |

---

## 二、逐區域詳細執行條件矩陣（Section 四）

| 測試項目 | 執行區域與位置 | 是否寫入資料 | 是否重啟服務 | 是否中斷使用者連線 | 是否需先備份 | 失敗時停止條件 | 所需明確授權 |
|---|---|---|---|---|---|---|---|
| **A-1：修正版切換／回滾 SQL 演練** | 區域 A（本機 PG17 Sandbox `5434`） | 僅寫入隔離測試庫中繼資料與暫時表 | 否 | 否 | 否（隔離環境） | 權限殘留、`pg_shdepend` 未歸零、意外連到 `5432`/`5433` | 授權 #1（本機 PG17 Sandbox 測試） |
| **B-1：取得最新正式加密備份** | 區域 B（Supabase 唯讀 `pg_dump` 至本機外部備份目錄） | 否（唯讀匯出） | 否 | 否（唯讀快照） | 本身即產出備份 | 連線失敗、SHA-256 異常或寫入不完整 | 授權 #2（最新 Supabase 備份取得） |
| **B-2：最新備份解密與 PG17 還原** | 本機外部工具 + 區域 A PG17 Sandbox | 否（不寫正式庫） | 否 | 否 | 否（使用 B-1 產物） | AuthTag 驗證失敗、解密後 SHA-256 不符、還原缺表 | 授權 #3（最新備份解密與 PG17 還原） |
| **B-3：Supabase 唯讀連線與 Event Trigger 盤點** | 區域 B（Supabase `postgres` 唯讀查詢 + Dashboard CA 下載） | 否 | 否 | 否 | 建議完成 B-1 | CA 指紋不符、`pg_event_trigger` 與預期不符 | 授權 #4（Supabase 唯讀連線驗證） |
| **B-4：暫時性測試角色驗證（選配／若先測 Supavisor）** | 區域 B（Supabase 建立短效測試角色測 Supavisor，測畢即刪） | 僅角色中繼資料（不改業務表 Owner） | 否 | 否 | **是（須先完成 B-1/B-2）** | Supavisor 拒絕自建角色登入、TLS `verify-full` 失敗 | 授權 #5（Supabase 暫時性測試角色建立） |
| **B-5：正式角色建立與切換 SQL（含 Event Trigger 測試）** | 區域 B（Supabase 維護時窗：`postgres` + `migration_admin`） | 僅中繼資料／權限與暫時測試表（立即 `DROP`） | 否（Render 尚未切換） | 否（因 Render 仍維持舊連線，但為謹慎須於離峰時窗） | **強制必須（B-1/B-2 完成）** | `42501` 失敗、`ensure_rls` 異常、負向測試未遭拒 | 授權 #6（建立正式角色）＋ 授權 #7（Owner 與權限切換） |
| **C-1：Render 環境變數調整與服務重啟切換** | 區域 C（Render Dashboard / CI） | 否 | **是（Web Service 重啟）** | **是（重啟視窗數秒～數十秒）** | **強制必須（區域 B 全數通過）** | `/api/health` 回傳 `503`、TLS 握手錯誤、`500` 異常 | 授權 #8（環境變數調整）＋ 授權 #9（Render 正式服務切換） |
| **B/C-R：緊急受控回滾** | 區域 C 切回 ＋ 區域 B 執行 7 步回滾 | 僅還原權限與 Owner（0 資料刪除） | **是（若區域 C 已切換）** | **是（`pg_terminate_backend` 中斷進行中連線）** | 保留切換前備份 | `pg_shdepend` 無法歸零（須人工排查，禁 `DROP OWNED BY`） | 授權 #10（正式回滾） |
