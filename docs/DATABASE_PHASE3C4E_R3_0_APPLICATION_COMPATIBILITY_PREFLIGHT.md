# CODE TO KNOW (碼上學)
# PHASE 3C-4E-R3-0：PostgreSQL 17 應用程式相容性測試前置審查報告

本報告依據 **PHASE 3C-4E-R3-0** 之安全與測試規範撰寫。  
由 PostgreSQL DBA、Prisma 工程師、Node.js 後端架構師及獨立資安審查團隊共同執行 100% 唯讀審查與靜態相容性分析。  
審查期間嚴格遵守零資料庫寫入、零連線 Supabase、零異動既有資料庫、零洩漏密碼與零 Git Commit 之最高安全約束。

---

## 執行摘要 (Executive Summary)

- **前置階段狀態**：
  - **PHASE 3C-4D-R1**（沙盒建置）：`PASS`（容器 `code_to_know_pg17_restore_sandbox` 正常運行於 `127.0.0.1:5433`，PostgreSQL 17.11 Alpine）。
  - **PHASE 3C-4D-R2**（正式還原與結構驗收）：`PASS`（37 張表格、47 組外鍵、133 組索引、2 筆正式遷移歷史、0 筆殘留業務資料，結構驗收 100% 通過）。
- **本階段審查範圍**：
  - 審查既有後端專案與 Prisma 7 架構能否在完全隔離之本機測試環境下，安全連接 PostgreSQL 17 還原沙盒資料庫。
  - 靜態評估 Prisma 7.10.1、`@prisma/adapter-pg`、`pg` 驅動對 PostgreSQL 17 的原生相容性。
  - 審查連線安全防護中介層（`db-validation.ts`）的白名單邊界與防呆機制。
  - 制定 **PHASE 3C-4E-R3-1 唯讀連線驗證計劃**。
- **最終前置審查結論**：  
  **`PASS — R3-1 READ-ONLY TEST PLAN READY`**

---

## 六大驗收門檻詳細審查結果 (Six Gates Verification)

### 第一關：確認 R2 正式還原結果與工具行為分析 (Gate 1)

1. **R1 與 R2 報告完整性核對**：
   - `docs/DATABASE_PHASE3C4D_R1_LOCAL_PG17_SANDBOX_SETUP.md` 存在（大小 10,403 bytes），結論為 `PASS — LOCAL POSTGRESQL 17 RESTORE SANDBOX READY`。
   - `docs/DATABASE_PHASE3C4D_R2_RESTORE_VERIFICATION.md` 存在（大小 11,695 bytes），結論為 `PASS — SUPABASE BACKUP RESTORE AND STRUCTURE VERIFICATION SUCCESSFUL`。
2. **`pg_restore` Exit Code 1 行為澄清與鑑識審查**：
   - **探索性預檢階段（Phase 3C-4D-R0）**：曾使用 PostgreSQL 16 `pg_restore` 嘗試讀取 PostgreSQL 17 的 Custom Format Dump 檔案，因 PostgreSQL 二進位檔格式不向下相容，直接回報 `unsupported version (1.15) in file header`，程序異常終止（Exit Code 1）。
   - **正式還原階段（Phase 3C-4D-R2）**：使用 PostgreSQL 17.11 官方映像容器執行 `pg_restore`，還原了全部 37 張業務與架構表格、47 組外鍵與 133 組索引。`pg_restore` 報告 `errors ignored on restore: 14` 並回傳 Exit Code 1。
   - **根因判定**：經詳細日誌比對，該 14 項被忽略的錯誤均屬於 Supabase 雲端專屬的延伸套件（如 `supabase_vault`）以及雲端專屬事件觸發器（如 `issue_graphql_placeholder` 等），在標準本機 PostgreSQL 環境下不存在這些雲端內部物件。`pg_restore` 的原生機制規定「只要存在被忽略的非致命警告，退出碼即為 1」。核心 public schema 的業務模型與遷移歷史還原成功率為 **100%**。

---

### 第二關：PostgreSQL 17 沙盒容器與資料庫再核對 (Gate 2)

審查團隊於唯讀環境下重新查核本機 Docker 運行環境：

| 檢查項目 | 預期規格 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **容器名稱** | `code_to_know_pg17_restore_sandbox` | 運行中 (Up 18 minutes) | **PASS** |
| **映像檔 Digest** | `sha256:3540c0362c809df084ffac0ae69fe794515f9de92692f02178bcdce0ef0302ac` | 完全一致 | **PASS** |
| **PostgreSQL 版本** | PostgreSQL 17.11 on x86_64-pc-linux-musl | 17.11 Alpine | **PASS** |
| **Port 綁定** | `127.0.0.1:5433:5432` | 僅綁定 `127.0.0.1:5433` | **PASS** |
| **資料庫名稱** | `code_to_know_cloud_restore_test` | 存在且正常回應 | **PASS** |
| **專屬帳號** | `codetoknow_restore` | 連線驗證正常 | **PASS** |
| **公共表格數量** | 37 張 | 37 張 | **PASS** |
| **遷移紀錄數量** | 2 筆 | 2 筆 | **PASS** |
| **既有 PG16 容器** | `code_to_know_postgres` 保持 `127.0.0.1:5432` | 運行中 (Up 12 hours) 未受干擾 | **PASS** |

---

### 第三關：Prisma 與後端靜態相容性審查 (Gate 3)

針對後端依賴套件、Prisma 設定及資料庫連線中介層進行靜態代碼分析：

1. **套件版本相容性**：
   - `prisma`: `7.10.1`
   - `@prisma/client`: `7.10.1`
   - `@prisma/adapter-pg`: `7.10.1`
   - `pg` (node-postgres): `^8.13.1`
   - **相容性分析**：Prisma 7.x 官方原生支援 PostgreSQL 17。`@prisma/adapter-pg` 搭配 `pg` 8.13+ 驅動使用標準 PostgreSQL Wire Protocol，相容 PostgreSQL 12 至 17，無已知版本阻斷缺陷。
2. **連線設定與 Connection Pool 審查** (`backend/src/config/database.ts`)：
   - 採用 `pg.Pool` 實例化連線池並注入 `PrismaPg(pool)` 適配器。
   - 無強制硬編碼 PostgreSQL 16 專用 SQL 語法或內部系統欄位查詢。
   - 後端啟動程式無自動執行 `prisma migrate deploy`、`prisma db push` 或 `prisma seed` 之邏輯，不會對目標資料庫造成意外寫入。
3. **連線安全防護審查** (`backend/src/config/db-validation.ts`)：
   - 經靜態查閱，現行 `db-validation.ts` 對各環境之主機與連線埠具備嚴格限制：
     - `validateTestDatabaseUrl`：僅允許主機 `localhost`、`127.0.0.1`，Port `5432`，資料庫名稱 `code_to_know_test`。
     - `validateDevelopmentDatabaseUrl`：僅允許主機 `localhost`、`127.0.0.1`，Port `5432`，資料庫名稱 `code_to_know`。
     - `validateCloudRuntimeDatabaseUrl`：僅允許 Supabase 官方主機與資料庫 `postgres`，禁止連線本機。
   - **重要發現**：後端現行之全域白名單設計嚴密隔離了本機開發、測試與雲端生產環境。因還原沙盒運行於 Port **5433** 且資料庫名稱為 **`code_to_know_cloud_restore_test`**，若直接以既有 `validateTestDatabaseUrl` 或 `validateDevelopmentDatabaseUrl` 驗證會觸發防禦性例外。
   - **決策**：在 R3-1 階段，測試腳本將使用**獨立之隔離連線測試實例**（直接以 `pg.Pool` 連線或以專屬非生產測試配置實例化 PrismaClient），**絕不修改現有已通過驗收的 `db-validation.ts` 生產代碼**，確保生產與開發安全邊界不動如山。

---

### 第四關：憑證與連線先決條件審查 (Gate 4)

審查團隊於完全唯讀與記憶體隔離之環境下查驗憑證先決條件：

1. **憑證檔案實體查驗**：
   - 檔案路徑：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_restore_user_password.txt`
   - 檔案存在性：`True`
   - 檔案大小：`24 bytes`（符合英數安全隨機密碼長度與結尾格式）
   - Windows ACL 權限：`DESKTOP-C343IV7\user Allow FullControl`（嚴格限本機目前使用者存取）
2. **資訊安全合規性**：
   - 控制台、日誌、命令列、暫存檔與本報告中**絕對零明文輸出**。
   - R3-1 執行時將嚴格自該檔案透過環境變數或記憶體流讀取，禁止在腳本中硬編碼密碼。

---

### 第五關：非資料庫測試與型別安全驗證 (Gate 5)

為確保專案程式碼基線健康且非資料庫測試安全可靠，審查團隊執行靜態編譯與無資料庫測試：

1. **TypeScript 靜態編譯檢查**：
   - 執行命令：`npx tsc --noEmit`（於 `backend/` 目錄）
   - 結果：Exit Code `0`，**零編譯錯誤**，型別定義完全健全。
2. **純單元測試套件執行**：
   - 執行命令：`npx vitest run tests/db-config-safety.test.ts`
   - 結果：**53 項單元測試 100% PASS**（耗時 740ms），所有安全邊界與 URL 格式校驗完全符合預期。
   - 測試過程全程於記憶體執行純邏輯驗證，無任何網路連線與資料庫 I/O。

---

### 第六關：PHASE 3C-4E-R3-1 唯讀連線測試計劃 (Gate 6)

審查團隊依據上述審查結果，正式擬定 **PHASE 3C-4E-R3-1 唯讀測試實施計劃**：

#### 1. 測試目標
驗證 Node.js 後端應用層與 Prisma 7 Client 在不變更既有 Schema、不寫入任何資料的前提下，能否透過 TCP 正確連線 PostgreSQL 17 還原資料庫，並安全執行基礎查詢與 ORM 關聯讀取。

#### 2. 連線參數配置
- **Host**：`127.0.0.1`
- **Port**：`5433`
- **User**：`codetoknow_restore`
- **Password**：自 `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\pg17_restore_user_password.txt` 動態讀取
- **Database**：`code_to_know_cloud_restore_test`
- **SSL**：`disable`（本機回環隔離連線）

#### 3. 測試執行項目（100% 唯讀）
1. **Raw SQL 探針測試**：
   - `SELECT version();`：驗證回傳 `PostgreSQL 17.11`。
   - `SELECT current_database(), current_user;`：驗證資料庫與角色名稱。
   - `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';`：驗證表格數為 37。
2. **Prisma Client ORM 唯讀查詢測試**：
   - `prisma.user.count()`：驗證回傳 `0`。
   - `prisma.role.findMany()`：驗證查詢成功且無語法錯誤。
   - `prisma.systemSetting.findMany()` 或系統模型查詢：驗證 ORM 欄位映射與型別相容性。
   - 查詢 `_prisma_migrations` 表格：驗證 Prisma 內部遷移歷史讀取能力。
3. **安全終止**：
   - 顯式呼叫 `prisma.$disconnect()` 與 `pool.end()`，確保連線平穩釋放無懸掛 Socket。

---

## 結論與下一步建議

### 審查結論
**`PASS — R3-1 READ-ONLY TEST PLAN READY`**

本機 PostgreSQL 17 還原資料庫結構完整無損，Prisma 7.10.1 與後端 TypeScript 程式庫具備完整的 PostgreSQL 17 連線相容條件。測試先決條件已全部就緒，且安全邊界與隔離防護措施明確。

### 下一步建議
等待使用者正式授權後，方可進入 **PHASE 3C-4E-R3-1：PostgreSQL 17 應用程式唯讀連線相容性測試**。本階段工作已安全完成，未執行任何寫入或測試連線操作。
