# CODE TO KNOW（碼上學）
# PHASE 3C-3B：Supabase IPv4 Session Pooler 與 Prisma Migration 架構決策書
# (Connection Architecture & Migration Strategy Decision Record)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Phase 3C-3B Architecture Decision Record)
- **決策日期**：2026-11-08
- **決策團隊**：資深 Prisma 7 / PostgreSQL 架構師、Node.js 資料庫連線工程師、資安審查工程師
- **目標專案**：Supabase `code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`)
- **任務性質**：**STRICTLY READ-ONLY ARCHITECTURE REVIEW (唯讀架構審查與決策，零雲端連線、零程式碼改動、零費用)**
- **前置文件**：
  - `docs/DATABASE_PHASE3C3A_SUPABASE_READ_ONLY_PREPARATION_REPORT.md`
  - `docs/DATABASE_PHASE3C3A_R1_OFFICIAL_SPEC_AND_CONNECTION_REVIEW.md`

---

## 決策摘要 (Executive Decision Summary)

在 Supabase Free 方案資源受限（無免費 IPv4 直連、無自動備份、7 天無查詢自動休眠）且**本機網路環境實測缺乏原生 IPv6 路由**的客觀前提下，本報告針對 CODE TO KNOW 後端與 Prisma 7 的雲端連線架構做出以下關鍵工程決策：

1. **運行時期 (Runtime API)**：全面採用 **Supavisor Session Pooler (Port 5432)** 搭配 `@prisma/adapter-pg`，獲得 IPv4 支援、連線複用與 Prepared Statements 完整加速能力。
2. **結構遷移 (Prisma Migrate CLI)**：決策採用 **Supavisor Session Pooler (Port 5432)** 作為本機 IPv4 環境下免花費 ($0) 的官方相容遷移通道，繞過 `db.[ref].supabase.co` 僅有 IPv6 (AAAA) 之致命阻礙。
3. **環境變數解耦架構**：維持 `DATABASE_URL`（Runtime）與 `MIGRATION_DATABASE_URL` / `DIRECT_URL`（Migrate）的變數名稱分離，確保 CI/CD 最小權限原則與未來維運彈性，但在 IPv4 環境下兩者指向同一組 Session Pooler (5432) 端點。
4. **零費用防線守護**：**堅決不購買 $4/mo 之 IPv4 Add-on、堅決不升級 $25/mo 之 Pro Plan**。

---

## 一、Prisma 7.10.1 真正使用的連線來源程式碼審查

依據專案現有實作，審查團隊逐行追蹤 Prisma CLI 與後端 Runtime 讀取環境變數的確切生命週期：

```mermaid
sequenceDiagram
    autonumber
    box rgba(70,130,180,0.1) Prisma CLI 結構遷移 (DevOps / Migration)
    participant CLI as Prisma CLI (migrate deploy)
    participant Config as backend/prisma.config.ts
    participant Validation as db-validation.ts (resolveDatasourceUrl)
    end

    box rgba(46,139,87,0.1) Express 後端應用 (Runtime Query)
    participant Express as Express App Server
    participant DBConfig as backend/src/config/database.ts
    participant PGPool as pg.Pool (Node.js)
    participant Adapter as @prisma/adapter-pg
    participant PrismaClient as PrismaClient
    end

    Note over CLI,Validation: 遷移時期連線解析
    CLI->>Config: 讀取 defineConfig.datasource.url (Line 25-27)
    Config->>Validation: 執行 resolveDatasourceUrl (Line 26)
    Validation-->>CLI: 回傳 DIRECT_URL 或 MIGRATION_DATABASE_URL (Line 393-395)

    Note over Express,PrismaClient: 運行時期連線解析
    Express->>DBConfig: 啟動資料庫模組 (Line 1-45)
    DBConfig->>DBConfig: resolveDatabaseConnectionString 讀取 DATABASE_URL (Line 26, 30)
    DBConfig->>PGPool: new pg.Pool({ connectionString }) (Line 33)
    PGPool->>Adapter: new PrismaPg(pool) (Line 34)
    Adapter->>PrismaClient: new PrismaClient({ adapter }) (Line 38-41)
```

### 1. 程式碼確切行號與依據

| 執行角色 | 讀取之原始碼檔案與行號 | 實際讀取之環境變數 | 備援 / 回退行為 |
| :--- | :--- | :--- | :--- |
| **Prisma CLI (Migration)** | [backend/prisma.config.ts:25-27](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma.config.ts#L25-L27)<br/>[backend/src/config/db-validation.ts:381-396](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts#L381-L396) | 優先讀取 **`DIRECT_URL`**；<br/>若無則讀取 **`MIGRATION_DATABASE_URL`** | **嚴格拒絕回退**。若兩者皆缺失，立即拋出 `[PRISMA MIGRATION CONFIG ERROR]` 中斷。 |
| **Express API (Runtime)** | [backend/src/config/database.ts:25-31](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L25-L31)<br/>[backend/src/config/env.ts:11-13](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/env.ts#L11-L13) | 嚴格僅讀取 **`DATABASE_URL`** | 經過 `validateCloudRuntimeDatabaseUrl` 檢查，絕不讀取 `DIRECT_URL`。 |

### 2. 核心架構查驗結論
1. **連線來源已在程式碼層級完全解耦**：Prisma CLI 走 `prisma.config.ts` 的 `datasource.url`，Express Runtime 走 `database.ts` 的 `pg.Pool`。兩者在雲端生產模式下不會發生底層連線混用。
2. **`schema.prisma` 語法相容性**：專案使用 Prisma 7 現代宣告（[backend/prisma/schema.prisma:1-3](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma#L1-L3)），僅宣告 `provider = "postgresql"`，URL 委派予 `prisma.config.ts`，符合 Prisma 7.10.1 規範。
3. **驅動適配器獨立性**：`@prisma/adapter-pg`（[backend/package.json:21](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/package.json#L21)）直接接收獨立的 `pg.Pool` 實例，查詢全權交由 Node.js 客戶端連線池處理。

---

## 二、三種 Supabase 連線方案全方位技術評估

針對 Supabase 提供的三種連線拓撲，比對官方規範與本機實測客觀數據：

```mermaid
graph TD
    subgraph OptionA["方案 A: Direct Connection (Port 5432)"]
        A_Host["db.ypibmyfxfhsyfdwxprpi.supabase.co"]
        A_Net["僅支援原生 IPv6 (AAAA)"]
        A_Status["❌ 本機實測無法解析 (PingSucceeded: False)<br/>需購買 $4/mo IPv4 Add-on (違背零費用)"]
    end

    subgraph OptionB["方案 B: Session Pooler (Port 5432)"]
        B_Host["aws-0-ap-southeast-2.pooler.supabase.com"]
        B_Net["支援 IPv4 (A) + IPv6"]
        B_Status["✅ 本機實測 TCP 握手成功<br/>✅ 支援 Session-level Advisory Locks<br/>✅ 支援 Prepared Statements<br/>✅ 免費且無縫相容"]
    end

    subgraph OptionC["方案 C: Transaction Pooler (Port 6543)"]
        C_Host["aws-0-ap-southeast-2.pooler.supabase.com"]
        C_Net["支援 IPv4 (A) + IPv6"]
        C_Status["❌ 不支援 Session Advisory Locks (Migration 掛起)<br/>❌ 不支援 Prepared Statements (需額外設定)<br/>適合短生命週期 Serverless，不適合 Express"]
    end
```

### 三種方案技術比對矩陣

| 評估項目 | 方案 A: Direct Connection | 方案 B: Shared Pooler (Session 5432) | 方案 C: Shared Pooler (Transaction 6543) |
| :--- | :--- | :--- | :--- |
| **主機端點** | `db.[ref].supabase.co` | `aws-0-ap-southeast-2.pooler.supabase.com` | `aws-0-ap-southeast-2.pooler.supabase.com` |
| **連線埠 (Port)** | 5432 | 5432 | 6543 |
| **IPv4 支援度** | **無 (僅 AAAA 紀錄)** | **完整支援 (Amazon ELB A 紀錄)** | **完整支援 (Amazon ELB A 紀錄)** |
| **本機實測狀態** | **失敗 (無法解析 IP / 路由不通)** | **成功 (TCP 5432 握手通過)** | **成功 (TCP 6543 握手通過)** |
| **Session Advisory Locks** | 100% 完整支援 | **完整支援 (連線與客戶端 Session 綁定)** | **嚴格不支援 (交易後釋放，鎖洩漏)** |
| **Prepared Statements** | 完整支援 | **完整支援 (Session 專屬連線)** | 不支援 (需 `?pgbouncer=true`) |
| **Prisma Migrate 適用性** | **受阻於 IPv6 (除非花費 $4/mo)** | **相容且可執行 ($0 零費用可行解)** | **完全致命 (指令掛起或鎖錯誤)** |
| **Express Runtime 適用性** | 差 (直連數受限於 15~20 條) | **最佳 (連線複用＋預編譯語句加速)** | 需特殊配置且無 Session 狀態 |
| **費用評價** | 需 $4/mo 方可在純 IPv4 使用 | **$0.00 USD (完全免費)** | **$0.00 USD (但功能不相容)** |

> [!CAUTION]
> **重要警示：TCP 握手成功不等於資料庫登入成功**
> 本機對 `aws-0-ap-southeast-2.pooler.supabase.com:5432` 執行的 `Test-NetConnection` 僅證明 **TCP 傳輸層可達**，絕不代表已成功連線至 PostgreSQL。實際連線仍須具備合法資料庫密碼、正確的專案參照使用者名稱（`postgres.[project_ref]`）以及 SSL 握手。

---

## 三、Session Pooler 對 Prisma Migration 與 Advisory Lock 相容性剖析

### 1. 為何 Transaction Pooler (Port 6543) 絕對不能用於 Migration？
Prisma Migrate 依賴 PostgreSQL 的 **Session-level Advisory Locks**（`pg_advisory_lock` / `pg_try_advisory_lock`）來確保同一時間只有一個客戶端能修改結構與 `_prisma_migrations` 表格。
在 Transaction Mode (6543) 下：
- 連線池在每一個 `COMMIT` / `ROLLBACK` 後立刻收回底層連線。
- Advisory Lock 是綁定於實體連線上的；當連線被收回或切換至另一實體連線時，後續的解鎖（`pg_advisory_unlock`）會找不到原連線，導致**鎖洩漏（Lock Leak）**或 **命令無限掛起**。

### 2. 為何 Session Pooler (Port 5432) 能安全執行 Migration？
在 Session Mode (5432) 下：
- 客戶端與 Supavisor 建立連線後，Supavisor 會將一條專屬的後端 PostgreSQL 連線**全程綁定給該客戶端**，直到客戶端發出 `DISCONNECT`。
- 在整個會話週期內，所有 Advisory Locks、Prepared Statements 與暫存設定均能穩定保留。
- **官方文獻證實**：Supabase 官方文件（*Connecting with Prisma*）明確指出：
  > *"If your local environment is IPv4-only and does not have the IPv4 add-on, you can use the Session pooler string on port 5432 for Prisma migrations."*

---

## 四、`pg.Pool` 預設值、連線數與擴展性深度評估

針對後端檔案 [backend/src/config/database.ts:33](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/database.ts#L33) 的連線池實作進行深入檢視：

```typescript
// 現有程式碼
const pool = new pg.Pool({ connectionString: resolveDatabaseConnectionString() });
```

### 1. 預設值現況確認（依賴預設值）
- 在 `node-postgres`（`pg`）中，未傳入選填參數時：
  - **`max` (最大客戶端連線數)**：**預設為 10**。
  - **`idleTimeoutMillis` (閒置回收時間)**：**預設為 10,000 ms (10 秒)**。
  - **`connectionTimeoutMillis` (建立連線超時)**：**預設為 0 (無限等待)**。
- **審核判定**：目前程式碼並非「沒有連線上限」，而是**隱性依賴套件預設值 (10)**。

### 2. 多實例水平擴展（Scaling）連線數累積試算
Supabase Free Tier 的底層運算實例（Compute Instance）實體連線數上限約為 **50~60 條**（保留給 Superuser 後，應用程式可用直連數約 **15~20 條**）。
若未來後端 API 採用多行程或容器化部署：

| 部署模型 | 後端實例數 (Instances) | 單實例 Pool `max` | 總並行連線數試算 | 對 Supabase Free Tier 衝擊評估 |
| :--- | :---: | :---: | :---: | :--- |
| **本機單一開發行程** | 1 | 10 (預設) | **10 條** | 安全在上限之內。 |
| **生產環境單一伺服器** | 1 | 10 (預設) | **10 條** | 安全在上限之內。 |
| **生產環境小型叢集** | 2 | 10 (預設) | **20 條** | **臨界警告**（若有管理連線易拋出 `slots reserved`）。 |
| **無狀態彈性擴展** | 4 | 10 (預設) | **40 條** | **嚴重超標**（必定引發連線耗盡崩潰）。 |

### 3. 未來程式碼優化建議（本階段不修改程式碼）
為避免連線耗盡與無限等待死鎖，建議後續在進入雲端部署時，於 `database.ts` 明確注入以下連線池配置：
```typescript
// 建議之配置參數（僅記錄，本次不實作改動）
const pool = new pg.Pool({
  connectionString: resolveDatabaseConnectionString(),
  max: 5,                       // 將單實例連線收斂至 5 條，容許擴展至 3~4 個實例
  idleTimeoutMillis: 30000,     // 閒置 30 秒自動釋放
  connectionTimeoutMillis: 5000 // 5 秒連線不上立即 Fail-Fast，避免請求堆積掛起
});
```

---

## 五、TLS / SSL 與密碼安全規範

### 1. `sslmode=require` 的真實安全意涵
在 PostgreSQL 與 `node-postgres` 協議中：
- `sslmode=require` 表示**強制使用 TLS 握手對資料傳輸進行加密**（防止網路嗅探與明文外洩）。
- **關鍵安全限制**：`sslmode=require` **預設不驗證伺服器憑證主機名稱是否與 CA 簽名完全吻合**。若遭遇中間人攻擊（MITM）偽造 DNS，單靠 `require` 無法完全防禦。
- 若要達成最高標準的防禦，需在客戶端載入 Supabase 官方 Root CA（`prod-ca-2021.crt`）並配置 `sslmode=verify-full`。

### 2. 嚴正拒絕 `rejectUnauthorized: false` 作為通用解法
- 部分教學社群常推薦直接設定 `ssl: { rejectUnauthorized: false }` 來繞過連線憑證報錯。
- **資安架構評估**：
  - `rejectUnauthorized: false` 在底層等同於**關閉 Node.js 的 TLS 憑證合法性檢查**，完全破壞 PKI 信任鏈。
  - Supabase 官方連線池（`pooler.supabase.com`）由 Amazon Trust Services / Let's Encrypt 頒發公開合格憑證，Node.js 內建的 Mozilla CA 根憑證庫能原生完成驗證。
  - **結論**：本專案嚴格維持標準 TLS 憑證驗證，**不採用 `rejectUnauthorized: false` 作為粗暴解法**。

---

## 六、最終架構決策與實施建議

### 1. 核心決策：是否需要維持兩個不同的雲端連線 URL？

經過嚴密的工程論證，本團隊決定：**在環境變數設計上維持「雙連線名稱解耦」，但在 IPv4 環境下連線字串均指向「Session Pooler (Port 5432)」**。

```mermaid
graph TD
    subgraph EnvVars["生產環境變數宣告 (Production .env)"]
        RT_URL["DATABASE_URL<br/>(供 Express Runtime API)"]
        MG_URL["MIGRATION_DATABASE_URL<br/>(供 Prisma CLI 結構遷移)"]
    end

    subgraph SupabasePooler["Supabase 官方端點 (AWS Sydney ap-southeast-2)"]
        SP_5432["Supavisor Session Pooler (Port 5432)<br/>aws-0-ap-southeast-2.pooler.supabase.com:5432<br/>【支援 IPv4、SSL、Prepared Statements 與 Advisory Locks】"]
    end

    RT_URL -->|"Runtime 查詢通道"| SP_5432
    MG_URL -->|"DDL 遷移通道"| SP_5432
```

### 為什麼不合併成單一變數？
1. **最小權限原則（Least Privilege）**：在未來生產 CI/CD 自動化流程中，Migration 只需要 DDL 執行權限；而 API 伺服器僅需要 DML 執行權限。維持變數解耦利於權限分離。
2. **架構向前相容性**：若未來流量增長，Runtime 需切換至 Transaction Pooler (Port 6543) 以承載數萬條極短並行，此時只需變更 `DATABASE_URL`，而 `MIGRATION_DATABASE_URL` 仍能獨立留在 Port 5432，無需重構程式碼。
3. **符合程式碼既定守則**：目前 `db-validation.ts` 已內建雙變數防禦邏輯，維持現狀最穩健、改動面最小。

### 2. 建議之生產連線字串範本（佔位符展示，無機密）

```bash
# -------------------------------------------------------------
# CODE TO KNOW: 生產環境連線設定 (適用本機 IPv4 與雲端免費方案)
# -------------------------------------------------------------

NODE_ENV="production"
PORT=4000

# 1. Runtime API 連線 (使用 Session Pooler 5432，支援 IPv4、連線複用與 Prepared Statements)
DATABASE_URL="postgresql://postgres.ypibmyfxfhsyfdwxprpi:YOUR_SECURE_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# 2. Migration 專用連線 (指派至 Session Pooler 5432，提供 IPv4 下的 Advisory Locks 支援)
MIGRATION_DATABASE_URL="postgresql://postgres.ypibmyfxfhsyfdwxprpi:YOUR_SECURE_PASSWORD@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# 3. 本機開發完全隔離 (維持本地 Docker，不變更)
# 本地日常開發依舊使用: postgresql://codetoknow:***@127.0.0.1:5432/code_to_know
```

---

## 七、尚待人工確認事項清單 (Dashboard 人工核對)

在進入下一階段任何操作前，請專案管理員登入 [Supabase 控制台](https://supabase.com/dashboard) 核實：

- [ ] **1. 連線池狀態**：進入 **Settings -> Database -> Connection Pooling**，確認 Connection Pooler 為啟用狀態（預設啟用），且 Pool Mode 支援 **Session**。
- [ ] **2. 專案存活狀態**：確認首頁顯示綠燈 **Active**。
- [ ] **3. 資料庫密碼有效性**：確認手邊具備專案建立時設定之密碼（可於 Reset Database Password 重設，但切勿在對話中公開）。
- [ ] **4. 方案確認**：確認 Organization Plan 為 **Free**（$0/mo），未開啟任何計費 Add-on。

---

## 八、官方文獻依據與來源

1. **Supabase Connecting with Prisma Guide**:
   - `https://supabase.com/docs/guides/database/connecting-to-postgres#connecting-with-prisma` (查閱日期: 2026-11-08)
   - 官方確認：純 IPv4 環境推薦使用 Session Pooler (Port 5432) 進行 Prisma Migration。
2. **Supabase Connection Pooler & Supavisor Architecture**:
   - `https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler` (查閱日期: 2026-11-08)
   - 官方確認：Session Mode 保留後端實體連線與工作階段狀態；Transaction Mode (6543) 不保留。
3. **Prisma Official Documentation on Connection Pooling**:
   - `https://www.prisma.io/docs/orm/overview/databases/supabase` (查閱日期: 2026-11-08)
   - 官方確認：Advisory Locks 無法在 Transaction Pooler 正常工作。
4. **node-postgres Pool Default Configuration**:
   - `https://node-postgres.com/apis/pool` (查閱日期: 2026-11-08)
   - 官方確認：預設 `max: 10`、`idleTimeoutMillis: 10000`。

---

## 九、最終架構檢核判定總表

| 檢核維度 | 決策要點 | 最終判定 | 決策依據與說明 |
| :--- | :--- | :---: | :--- |
| **Prisma 7 連線來源** | 程式碼確切讀取行號與變數 | **`[PASS]`** | CLI 走 `prisma.config.ts`，Runtime 走 `database.ts`，架構清晰。 |
| **IPv4 網路相容性** | 透過 Session Pooler (5432) 解決 | **`[PASS]`** | 實測 Amazon ELB IPv4 A 紀錄握手成功，完全規避 Direct IPv6 障礙。 |
| **Advisory Locks 支援**| Session Pooler 工作階段鎖定 | **`[PASS]`** | Session 模式全程綁定後端連線，相容 `prisma migrate` 諮詢鎖。 |
| **費用保護防線** | 零付費方案，不買 IPv4 Add-on | **`[PASS]`** | 全程維持 **$0.00 USD**，不升級 Pro，無額外開銷。 |
| **Runtime 連線池配置** | `pg.Pool` 參數顯式宣告 | **`[WARN]`** | 目前依賴預設值 10，後續正式部署前建議顯式配置 `max: 5` 與 timeout。 |
| **TLS 安全機制** | 強制 `sslmode=require`，拒絕不安全關閉驗證 | **`[PASS]`** | 遵循標準 PKI 憑證鏈，不採用 `rejectUnauthorized: false` 陋習。 |
| **身分驗證架構** | 堅持 Express + Cookie Session | **`[PASS]`** | 不替換為 Supabase Auth，100% 守護既有 92 項測試與資安成果。 |
| **雲端專案即時狀態** | Dashboard 綠燈 Active 狀態 | **`[NOT CHECKED]`** | 屬雲端動態狀態，待使用者人工確認。 |

---

*報告產出時間：2026-11-08*  
*報告路徑：`docs/DATABASE_PHASE3C3B_CONNECTION_ARCHITECTURE_DECISION.md`*
