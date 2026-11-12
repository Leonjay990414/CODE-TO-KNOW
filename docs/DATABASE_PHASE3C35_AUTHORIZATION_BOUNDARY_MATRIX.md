# CODE TO KNOW｜Phase 3-C-35：十項獨立授權邊界矩陣

- **文件階段**：Phase 3-C-35（純授權邊界規劃）
- **建立日期**：2026-11-12

> **核心授權鐵律（Authorization Isolation Principle）**：
> 以下 10 項操作為**完全獨立之授權單元**。取得第 $N$ 項授權，**絕對不代表**自動取得第 $N+1$ 項或其他任何項目之授權；未獲明確書面授權前，一律保持 `NOT AUTHORIZED`。

---

## 一、十項獨立授權邊界表（Section 五）

| 授權編號 | 獨立授權項目 | 允許動作範圍 | 明確排除（未授權動作） | 目前狀態 |
|---|---|---|---|---|
| **AUTH-01** | **本機 PG17 Sandbox 測試** | 僅限連線本機隔離容器 `127.0.0.1:5434` 演練切換與回滾 SQL | 嚴禁觸碰 PG16（`5432`）、PG17 還原庫（`5433`）或任何雲端環境 | **`NOT AUTHORIZED`** |
| **AUTH-02** | **最新 Supabase 備份取得** | 僅限執行唯讀備份腳本產出當日 `.dump`、`.c2kb` 與 `.sha256` | 嚴禁對 Supabase 執行任何寫入、建號、DDL 或權限異動 | **`NOT AUTHORIZED`** |
| **AUTH-03** | **最新備份解密與 PG17 還原** | 僅限使用 KeePassXC 金鑰執行解密比對並還原至 PG17 Sandbox（測畢清除暫存明文） | 嚴禁輸出/記錄金鑰、嚴禁修改或刪除原始備份 | **`NOT AUTHORIZED`** |
| **AUTH-04** | **Supabase 唯讀連線驗證** | 僅限以現有通道唯讀查詢 `pg_roles`/`pg_event_trigger` 並下載官方 CA 比對 | 嚴禁建立角色、修改 Schema/Owner 或變更任何資料 | **`NOT AUTHORIZED`** |
| **AUTH-05** | **Supabase 暫時性測試角色建立** | 僅限建立短效測試角色測試 Supavisor SCRAM/TLS，測畢立即移除 | 嚴禁轉移 `public` Schema/表 Owner 或修改正式角色 | **`NOT AUTHORIZED`** |
| **AUTH-06** | **Supabase 正式角色建立** | 僅限執行切換草案段落 2 建立 `migration_admin` 與 `app_runtime` | 嚴禁未經 AUTH-07 即轉移 Owner 或授權業務表 | **`NOT AUTHORIZED`** |
| **AUTH-07** | **Supabase Owner 與權限切換** | 僅限執行切換草案段落 3～11（授權、Owner 轉移、Default Privileges、驗證） | 嚴禁擅自調整 Render 環境變數或重啟正式服務 | **`NOT AUTHORIZED`** |
| **AUTH-08** | **Render 環境變數調整** | 僅限預先配置 `DATABASE_URL`（`app_runtime`）與 CA 設定（未觸發切換或於維護視窗準備） | 嚴禁在區域 B 尚未通過前調整或寫入 Repo | **`NOT AUTHORIZED`** |
| **AUTH-09** | **Render 正式服務切換** | 僅限於維護時窗啟用新連線並重啟 Render Web Service 進行上線驗收 | 若驗收失敗不得強行硬撐，須依 AUTH-10 回滾 | **`NOT AUTHORIZED`** |
| **AUTH-10** | **正式回滾** | 僅限依修正版 7 步受控回滾方案切回連線、歸還 Owner 並移除新角色 | **絕對禁止使用 `DROP OWNED BY`** 或刪除任何業務資料 | **`NOT AUTHORIZED`** |
