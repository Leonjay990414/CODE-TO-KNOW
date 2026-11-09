# CODE TO KNOW（碼上學）
# PHASE 3A：Supabase 雲端資料庫架構與連線策略規格書
# (Cloud Database Architecture & Connection Strategy)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3 Architecture Design)
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_PHASE3A_SUPABASE_ARCHITECTURE.md`
- **審查團隊**：資深 PostgreSQL DBA、Prisma 7 資料庫架構師、Supabase 雲端工程師、資料庫資安工程師
- **管理狀態**：架構規劃（READ-ONLY ARCHITECTURE PLANNING，無直接雲端連線或寫入）

---

## 一、Supabase 專案基準資訊與現況盤點

### 1. 專案已知基本資訊
| 項目 | 設定值 | 狀態 / 來源 |
| :--- | :--- | :--- |
| **Supabase Project ID (Ref)** | `ypibmyfxfhsyfdwxprpi` | 已確認（專案設定紀錄） |
| **託管雲端廠商 (Cloud Provider)** | AWS (Amazon Web Services) | 已確認 |
| **部署區域 (Region)** | Sydney, Australia (`ap-southeast-2`) | 已確認 |
| **資料庫引擎 (Engine)** | PostgreSQL 16 (相容本機 Docker PostgreSQL 16.15) | 已確認 |
| **ORM 框架** | Prisma 7.10.1 (`@prisma/client` + `@prisma/adapter-pg`) | 已確認（`backend/package.json`） |
| **後端伺服器架構** | Express 4.21 + Node.js (Stateful API Server, Cookie Session) | 已確認（`backend/src/app.ts`） |
| **本機資料庫** | Docker Container `code_to_know_postgres` (Port 5432) | 已確認（Running, Healthy） |

### 2. 待核實雲端配置清單 (NOT VERIFIED)
依據「不猜測、不虛構」原則，以下雲端參數於本次唯讀審查中尚未直接連線取得，標記為 `NOT VERIFIED`：
- `[NOT VERIFIED]` Supabase 專案目前方案層級（Free Tier 或 Pro Tier）。
- `[NOT VERIFIED]` Supabase 是否已啟用付費 IPv4 Add-on（免費方案 Direct Connection 僅支援 IPv6，需透過 Supavisor Pooler 支援 IPv4）。
- `[NOT VERIFIED]` Supabase 專案是否處於 Paused（閒置休眠）狀態。
- `[NOT VERIFIED]` Supabase Dashboard 中即時資料庫密碼與 Service Role Key。

---

## 二、三種資料庫連線模式技術評估矩陣

在 Node.js / Express 與 Prisma 7 環境下，評估連線至 Supabase PostgreSQL 的三種主要連線拓撲：

```mermaid
flowchart TD
    subgraph ExpressServer["Express 後端伺服器 (長駐常態行程)"]
        Pool["pg.Pool (集中連線池)"]
        Adapter["@prisma/adapter-pg (Driver Adapter)"]
        PrismaClient["PrismaClient (查詢執行)"]
        Pool --> Adapter --> PrismaClient
    end

    subgraph PrismaCLI["DevOps / CI/CD 遷移工具"]
        PrismaMigrate["prisma migrate deploy / status"]
    end

    subgraph SupabaseCloud["Supabase 雲端網路邊界 (Sydney ap-southeast-2)"]
        SessionPooler["Supavisor Session Pooler (Port 5432)"]
        TxPooler["Supavisor Transaction Pooler (Port 6543)"]
        DirectEngine["Direct PostgreSQL Engine (Port 5432)"]
    end

    ExpressServer -->|"DATABASE_URL (Port 5432, Session Mode)"| SessionPooler
    SessionPooler --> DirectEngine
    PrismaCLI -->|"DIRECT_URL (Port 5432, Direct Engine)"| DirectEngine
    ExpressServer -.->|"不建議用於 Express 長連線"| TxPooler
```

### 三種連線方式完整比對：

| 評估維度 | 1. Direct Connection (直連) | 2. Session Pooler (會話池) | 3. Transaction Pooler (交易池) |
| :--- | :--- | :--- | :--- |
| **連線主機名稱** | `db.ypibmyfxfhsyfdwxprpi.supabase.co` | `aws-0-ap-southeast-2.pooler.supabase.com` | `aws-0-ap-southeast-2.pooler.supabase.com` |
| **連線埠位 (Port)** | `5432` | `5432` | `6543` |
| **網路協議相容性** | **僅原生 IPv6** (若無 IPv4 Add-on，一般寬頻環境可能連不上) | **支援 IPv4 與 IPv6** (由 Supavisor 代理) | **支援 IPv4 與 IPv6** (由 Supavisor 代理) |
| **Prepared Statements** | 100% 完整支援 | **100% 完整支援** (Session 綁定) | **不支援** (連線在交易後釋放，易拋出 `s0 exists` 錯誤) |
| **Advisory Locks (諮詢鎖)** | **100% 支援** (遷移鎖定必備) | 視工作階段長度而定 (`NOT TESTED`) | **完全不支援** (嚴禁用於 Migration) |
| **Prisma 7 適配器支援** | 完整支援 (`@prisma/adapter-pg`) | **最佳適配** (`@prisma/adapter-pg` + `pg.Pool`) | 需配置 `?pgbouncer=true`，易有並行限制 |
| **連線數乘載上限** | 依方案硬性限制 (Free 方案約 50~60 條) | **數千條並行客戶端連線** | 數萬條極短並行連線 |
| **適合之應用情境** | **DevOps 結構遷移 (Prisma Migrate)** | **Express 常駐後端 API Runtime** | 無狀態極短 Serverless Functions (如 Cloudflare Workers) |
| **本專案環境建議** | **作為雲端 `DIRECT_URL` (Migration 用)** | **作為雲端 `DATABASE_URL` (Express API 用)** | **不採用** (不符 Express 長駐伺服器模型) |

### 特別技術確認：Prisma 7 `@prisma/adapter-pg` 與 `pg.Pool`
1. 本專案使用 Prisma 7 現代架構，透過 `@prisma/adapter-pg` 將查詢委派給標準 `pg.Pool`。
2. `pg.Pool` 本身在 Node.js 內部已有客戶端連線池管理機制（預設保持 10~20 條連線）。
3. 當連線至 Supabase 時，若後端連線至 **Session Pooler (Port 5432)**：
   - 能夠完美兼顧 `pg.Pool` 的連線複用與 Prepared Statements 預編譯加速。
   - 避免使用 Transaction Pooler (Port 6543) 所引發的 Prepared Statement 衝突。
4. 結論：**不得僅以連接埠（5432 vs 6543）判斷連線能力，必須基於連線池模式（Session vs Transaction）與協議生命週期進行決策。**

---

## 三、三層環境隔離規範 (Environment Isolation)

為徹底防止跨環境資料污染與憑證混淆，嚴格劃分三套執行環境：

```mermaid
graph LR
    subgraph EnvDev["Local Development"]
        DockerDB["本機 Docker PostgreSQL 16<br/>127.0.0.1:5432/code_to_know"]
        DevAPI["Express API (NODE_ENV=development)"]
        DevAPI --> DockerDB
    end

    subgraph EnvTest["Automated Testing"]
        TestDB["獨立測試庫<br/>127.0.0.1:5432/code_to_know_test"]
        VitestRunner["Vitest Suite (NODE_ENV=test)"]
        VitestRunner --> TestDB
    end

    subgraph EnvProd["Cloud Production"]
        SupaSession["Supabase Session Pooler:5432"]
        SupaDirect["Supabase Direct Engine:5432"]
        ProdAPI["Cloud Express API (NODE_ENV=production)"]
        ProdMigrate["CI/CD Prisma Migrate"]
        ProdAPI --> SupaSession
        ProdMigrate --> SupaDirect
    end
```

### 1. 環境變數對應表與隔離規則
| 環境 | `DATABASE_URL` 格式 | `DIRECT_URL` (Migration) | 憑證來源與安全規則 |
| :--- | :--- | :--- | :--- |
| **Local Dev** | `postgresql://codetoknow:***@127.0.0.1:5432/code_to_know` | 無需配置（自動回退至本地 5432） | 本機 Docker 專用 64-char Hex 隨機密碼 |
| **Test** | `postgresql://codetoknow:***@127.0.0.1:5432/code_to_know_test` | 專用測試庫 | **強制獨立**，未配置時嚴禁回退，立即中斷 |
| **Production** | `postgresql://postgres.[ref]:***@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require` | `postgresql://postgres:***@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres?sslmode=require` | 雲端專屬強密碼，雙連線解耦，強制 SSL |

### 2. 六大零信任（Zero-Trust）防護底線
1. **禁止測試環境回退：** `TEST_DATABASE_URL` 缺失時直接終止測試，嚴禁回退至開發庫或正式庫。
2. **禁止環境密碼混用：** 本機開發密碼、測試密碼與雲端 Supabase 密碼必須完全獨立生成，嚴禁一致。
3. **禁止原始碼硬編碼：** 任何檔案（含測試檔、Seed 檔、設定檔）嚴禁包含明文密碼。
4. **禁止 Git 追蹤憑證：** `.gitignore` 強制忽略 `.env`、`.env.*`（除 `.env.example` 範本外）。
5. **禁止前端暴露：** 前端 Vite 專案嚴禁引用任何資料庫連線變數（`VITE_` 前綴變數不得包含 DB 資訊）。
6. **動態 URL 驗證守門員：** 所有連線字串皆須經由 `backend/src/config/db-validation.ts` 執行主機白名單與 SSL 參數驗證。

---

## 四、備份與災難復原規劃 (Backup & Disaster Recovery)

本規劃專為目前開發階段與初期上線設計，兼顧免費／低成本原則與資料防護彈性：

### 1. 本機 Docker 開發庫備份
- **備份工具：** `docker exec code_to_know_postgres pg_dump`
- **備份模式：** 邏輯匯出（Logical SQL Dump，包含 DDL 與 Data）。
- **建議腳本 (規劃儲備)：**
  ```bash
  # 僅規劃，本次不執行
  docker exec code_to_know_postgres pg_dump -U codetoknow -d code_to_know -F c -b -v -f /tmp/backup.dump
  docker cp code_to_know_postgres:/tmp/backup.dump ./backups/local_$(date +%Y%m%d_%H%M%S).dump
  ```
- **執行時機：** 執行重大 Schema Migration 前、或重構大批資料前手動執行。
- **保留期限：** 本機保留最近 5 次快照，老舊快照自動輪替。

### 2. Supabase 雲端資料庫備份策略
- **免費方案 (Free Tier) 現狀確認：**
  - Supabase 免費方案**不包含每日自動備份還原 (Daily Backup Dashboard Restore)**（此功能僅 Pro 方案提供 7 天保留）。
  - 因此在免費／低成本階段，**不得假設雲端具備自動定時備份**。
- **低成本開發階段替代方案：**
  - 採用 GitHub Actions 或排程工作，透過 `pg_dump` 搭配 `DIRECT_URL` 執行遠端邏輯備份。
  - 將加密後的備份檔轉存於安全儲存庫（如加密 S3 或離線存檔）。
  - 備份頻率：每週一次，重大版本發布前手動執行。

### 3. Migration 失敗緊急回復策略 (Rollback Strategy)
1. **Prisma 遷移前置防護：**
   - 每次執行遷移前，先確認本地已有可用之 SQL Dump。
2. **遷移中途失敗處理程序：**
   - 若 `prisma migrate deploy` 在中途失敗，PostgreSQL DDL 交易（Transactional DDL）多數會自動回滾（Rollback）。
   - 若 `_prisma_migrations` 表出現 `rolled_back_at` 或失敗標記：
     1. 檢查失敗日誌與 SQL 語法錯誤。
     2. 執行 `npx prisma migrate resolve --rolled-back <migration_name>` 標記重置。
     3. 修正 SQL 遷移腳本後重新發布。
   - 嚴禁直接在正式環境使用 `prisma migrate reset`（會清空全表資料）。

---

## 五、雲端安全架構與既有身分驗證整合

### 1. SSL/TLS 強制加密
- 雲端連線字串強制附加 `sslmode=require`。
- `backend/src/config/database.ts` 連線池設定：
  ```typescript
  ssl: env.DATABASE_URL.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : undefined
  ```
  確保所有傳輸中資料（In-Transit Data）全數經過 TLS 1.3/1.2 加密。

### 2. 保留既有 Express + Prisma + Cookie Session 架構（關鍵決策）
- **核心方針：** **堅決不將前端登入驗證重構為 Supabase Auth。**
- **理由評估：**
  1. 目前專案已實作完整且安全的 Express + Cookie Session 架構（包含 `httpOnly` 防 XSS、`SameSite=Lax`、雙重 Cookie CSRF 防禦、`Session` 表格狀態追蹤與 `revokedAt` 撤銷機制）。
  2. 若改為 Supabase Auth，需全盤改寫前端登入元件、中介軟體、RBAC 權限體系與所有已就緒之測試案例（包括通過之 92 項測試），產生巨大重構風險。
  3. 保留既有架構，Supabase 僅作為純粹、高效、受管的 **PostgreSQL 資料庫引擎**，完全符合專案既定五層技術架構。

### 3. Row Level Security (RLS) 整合策略
- 由於所有查詢均由後端 Express（透過統一 DB 使用者憑證）執行，存取控制主要由後端中介軟體（`authenticate.ts`、`authorize.ts`）在 API 層嚴密把關。
- 在資料庫層，將 RLS 視為**防禦縱深（Defense-in-Depth）**：
  - 未來若開放 Supabase Storage 或特定直連 API，可啟用 RLS。
  - 現階段所有後端 Prisma 連線均經由專有 Role 查詢，避免授權旁路。

### 4. Supabase Service Role Key 保護
- `SERVICE_ROLE_KEY` 具備繞過所有 RLS 之最高特權，**絕對禁止置於前端程式碼或公開倉儲**。
- 若未來有使用 Supabase Admin API 需求，僅限於後端伺服器環境變數中引用。

---

## 六、PHASE 3A 雲端準備總結與驗收閘門

| 檢核要項 | 規劃標準 | 達成狀況 |
| :--- | :--- | :---: |
| **專案基礎盤點** | Project Ref `ypibmyfxfhsyfdwxprpi`，Region `ap-southeast-2`，未核實事項標註明確 | **PASS** |
| **連線模式評估** | Session Pooler (Runtime 5432) 與 Direct Connection (Migration 5432) 明確解耦 | **PASS** |
| **環境三層隔離** | Local Dev / Test / Production 完全獨立，禁止測試庫回退，零密碼洩漏 | **PASS** |
| **備份與還原規劃** | 本機邏輯備份、免費方案雲端備份限制澄清、Migration 失敗處置程序完整 | **PASS** |
| **雲端安全架構** | 強制 SSL，保留既有 Express Auth 核心，Service Role Key 嚴密防護 | **PASS** |

**結論：Phase 3A 雲端架構規劃已完備，規格清晰、安全邊界嚴謹，具備進入 Phase 3B 業務資料模型擴充之架構支撐。**
