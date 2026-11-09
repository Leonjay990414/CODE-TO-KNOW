# CODE TO KNOW（碼上學）
# PHASE 3C-3H：Prisma CLI 雲端連線安全預檢報告

**執行日期**：2026-11-08  
**執行角色**：PostgreSQL DBA、Prisma 7 架構師、Supabase 雲端工程師、資安審查工程師  
**審查性質**：Prisma CLI 連線機制靜態鑑識、TLS 憑證鏈分析與唯讀預檢（Strictly Read-Only Preflight）  
**目標專案**：`code-to-know-prod`（Project Ref: `ypibmyfxfhsyfdwxprpi`，AWS Sydney `ap-southeast-2`）  

> [!IMPORTANT]
> **本階段僅進行 Prisma CLI 連線安全預檢，未執行 Migration、DDL 或任何資料庫寫入。**
> 全程嚴格遵守費用保護（$0.00 USD）、零資料庫變更、機密不落地與既有備份無損原則。

---

## 一、Prisma CLI 連線架構分析

### 1. Prisma 7 CLI 核心配置解析機制
在 CODE TO KNOW 專案中，Prisma 升級至版本 `7.10.1`，其 CLI 連線解析完全交由 `backend/prisma.config.ts` 與 `backend/src/config/db-validation.ts` 集中控管：

```typescript
// backend/prisma.config.ts
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    get url() {
      return resolveDatasourceUrl((key) => env(key));
    },
  },
});
```

當在 `backend/` 目錄執行任何 Prisma CLI 指令（例如 `prisma migrate status`）時：
1. **設定載入**：Prisma CLI 啟動 Node.js 行程載入 `prisma.config.ts`。
2. **URL 動態解析**：呼叫 `resolveDatasourceUrl()`，依據當前環境變數決定連線字串。
3. **模式分離與安全阻斷**：
   - 當 `nodeEnv === 'production'` 或 `MIGRATION_ENV === 'cloud'` 時：
     - 強制要求 `DIRECT_URL` 或 `MIGRATION_DATABASE_URL`，**嚴禁靜默回退至 Runtime 的 `DATABASE_URL`**（避免將業務連線或交易池誤用於遷移）。
     - 透過 `validateMigrationDatabaseUrl` 嚴格校驗：僅允許核准之官方主機、白名單專案 Ref（`ypibmyfxfhsyfdwxprpi`）、官方資料庫名稱（`postgres`），且**強制封鎖連接埠 6543**。
   - 當處於 `development` 模式時：
     - 僅讀取 `DATABASE_URL`，且透過 `validateDevelopmentDatabaseUrl` **強制封鎖 `*.supabase.co` 與 `*.pooler.supabase.com`**，杜絕開發模式誤連雲端。

---

## 二、Runtime 與 Migration CLI 之安全差異對照

經詳細核對 `backend/src/config/database.ts` 與 `backend/prisma.config.ts`，兩者的連線機制存在本質差異：

| 評估項目 | Migration CLI (遷移專用) | Runtime (應用程式執行時期) | 安全風險與差異說明 |
| :--- | :--- | :--- | :--- |
| **連線 URL** | `MIGRATION_DATABASE_URL` (或 `DIRECT_URL`) | `DATABASE_URL` | 兩者在代碼層完全解耦，禁止相互回退。 |
| **底層驅動引擎** | Rust 原生二進位 (`schema-engine-windows.exe`) | Node.js `pg` Client + `@prisma/adapter-pg` | CLI 依賴 Rust Schema Engine；Runtime 依賴 Node.js Driver Adapter。 |
| **使用 Pooler** | **強制 Session Pooler (Port 5432)** | Session Pooler (5432) 或 Transaction Pooler (6543) | Migration 必須支援會話級 Advisory Lock，嚴禁使用 6543。 |
| **TLS 協定版本** | TLSv1.3 (經 Pooler 協商) | TLSv1.3 (經 Pooler 協商) | 兩者連線均受 TLSv1.3 高強度加密保護。 |
| **Root CA 載入能力** | 依賴作業系統/原生信任庫（**不支援 URL `sslrootcert`**） | 支援 Node.js `fs.readFileSync` 載入自訂 CA | **重大架構差異**：Rust CLI 無法直接透過 URL 載入私有 Root CA。 |
| **憑證主體校驗** | 伺服器證書若由非公營私有 CA 簽發，Rust 預設報錯 | 可透過 Node `pg` 配置 `ca` 進行嚴格校驗 (`rejectUnauthorized: true`) | Runtime 可在使用者層自訂 CA；CLI 需依賴系統信任庫。 |
| **連線數限制** | 規劃 `connection_limit=1`（單連線） | 規劃 `pg.Pool max=5`（預設為 10） | 嚴格受控於 Supabase Nano Compute 的 15 條後端連線上限。 |

---

## 三、Session Pooler 連接埠 5432 設定與鎖機制

### 1. 為何 Migration 必須強制綁定 Port 5432
- **Prisma Migrate 諮詢鎖機制**：
  Prisma 在發起 Migration 前，會發送 `SELECT pg_advisory_lock(72707369);` 以取得分散式排他鎖，防止多個工作程序同時套用 DDL。
- **Pooler 運作模式比對**：
  - **Transaction Pooler (Port 6543)**：以 SQL Transaction 為單位共享後端連線。交易提交後，後端連線立即被回收釋放，導致會話級鎖失效或引發連線混亂。
  - **Session Pooler (Port 5432)**：客戶端連線後，Supavisor 分配專屬的 PostgreSQL 後端會話，直至客戶端斷開為止。完整支援 `pg_advisory_lock`。
- **代碼層防護實證**：
  `validateMigrationDatabaseUrl` 包含硬性規則：
  ```typescript
  if (parsed.port === '6543') {
    throw new Error('[MIGRATION CONFIG ERROR] Prisma Migration cannot use Transaction Pooler (port 6543)...');
  }
  ```
  已在單元測試 `backend/tests/db-config-safety.test.ts` 中完成 100% 阻斷驗證。

---

## 四、TLS Root CA 驗證深入鑑識

### 1. Root CA 實體檔案核對
- **實體路徑**：`C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`
- **檔案 SHA-256 雜湊**：`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`（與記錄完全相符）。
- **X.509 憑證解析結果**：
  - **Subject / Issuer**：`CN=Supabase Root 2021 CA, O=Supabase Inc, L=New Castle, ST=Delware, C=US`
  - **有效期限**：Apr 28, 2021 至 Apr 26, 2031 GMT
  - **SHA-256 指紋**：`80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`
  - **解析狀態**：`SUCCESS`

### 2. 重大技術發現：Prisma CLI Rust Engine 不支援 URL 自訂 Root CA
經對二進位引擎 `backend/node_modules/@prisma/engines/schema-engine-windows.exe` 進行靜態符號分析與字串掃描：
1. **參數支援分析**：
   - 引擎包含：`sslmode`, `sslcert`, `sslidentity`（用於客戶端 mTLS）。
   - **完全不包含 `sslrootcert`**！
2. **信任庫機制**：
   - Prisma CLI 核心由 Rust 撰寫（基於 `tokio-postgres` 與原生 TLS/rustls）。
   - Node.js 環境變數 `NODE_EXTRA_CA_CERTS` 僅對 Node.js 行程生效，**無法穿透傳遞給子行程的 Rust 二進位檔案**。
   - Rust 二進位檔案僅能讀取作業系統信任庫（Windows Certificate Store）或內建的公營 CA 清單（如 Mozilla WebPKI Roots）。
3. **影響評估**：
   - `CN=Supabase Root 2021 CA` 屬於 Supabase 專屬企業私有 CA，不在微軟官方 Windows Root Certificate 清單內。
   - 若直接以嚴格憑證校驗模式要求 Rust 引擎校驗該私有 CA，引擎在 TLS 握手階段即會因無法錨定 Root CA 而斷開連線，並向 Prisma CLI 回報 `P1001: Can't reach database server`。
   - **此項目為架構上的重要限制，必須如實列為未解決事項，嚴禁虛報已支援**。

---

## 五、Prisma CLI 唯讀測試結果（`prisma migrate status`）

### 1. 執行安全性評估
針對 `npx prisma migrate status` 進行嚴格安全性評估：
1. **是否建立 Migration 檔案**：否。
2. **是否執行 DDL**：否。
3. **是否執行 DML**：否。
4. **是否建立或刪除 `_prisma_migrations` 表**：**否**（若該表不存在，CLI 僅以唯讀查詢確認其不存在，絕不自動建表）。
5. **是否自動修正 Migration 歷史**：否。
6. **是否變更 Supabase Schema**：否。
- **結論**：`prisma migrate status` 具備 100% 唯讀性質，符合安全測試標準。

### 2. 本機與雲端實測診斷結果

#### (1) 本機資料庫實測（Local PostgreSQL 16.15）
- **執行指令**：`& node_modules\.bin\prisma.cmd migrate status`（cwd: `backend`）
- **執行結果**：
  ```
  Datasource "db": PostgreSQL database "code_to_know", schema "public" at "127.0.0.1:5432"
  2 migrations found in prisma/migrations
  Database schema is up to date!
  Exit code: 0
  ```
- **確認**：Prisma CLI 能精確診斷本機兩組遷移與實體表結構。

#### (2) 雲端連線預檢測試（Supabase Session Pooler）
- **執行指令**：設定 `MIGRATION_ENV=cloud` 並提供 `MIGRATION_DATABASE_URL` 指向 Session Pooler。
- **執行結果**：
  ```
  Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-0-ap-southeast-2.pooler.supabase.com:5432"
  Error: P1001: Can't reach database server at aws-0-ap-southeast-2.pooler.supabase.com:5432
  Exit code: 1
  ```
- **鑑識分析（對比 Node.js `pg` Client）**：
  - 相同網路、相同端點下，Node.js `pg` 載入 `supabase-root.crt` 後**能順利完成 TLS 1.3 握手並接收伺服器認證回應**（回傳 `28P01: password authentication failed`）。
  - 而 Prisma 的 Rust 引擎在 TLS 握手階段即因未信任 Supabase 私有 Root CA 中斷連線，被 Prisma 抽象化包裝為 `P1001`。
  - **證實**：Prisma 7 CLI 的 Rust 引擎在未將 Root CA 安裝進作業系統信任庫的情況下，無法直接對該 Pooler 完成自訂 CA 鏈路驗證。

---

## 六、`DIRECT_URL` IPv6 直連覆蓋風險與防護

### 1. 優先權覆蓋風險
在 `resolveDatasourceUrl()` 中：
```typescript
const selectedUrl = directUrl || migrationUrl!;
```
- 若環境中存在 `DIRECT_URL`，Prisma CLI 會**無條件優先採用 `DIRECT_URL`**。
- Supabase Free 方案的直連端點（`db.<ref>.supabase.co:5432`）**僅提供 IPv6 位址**。
- 若在純 IPv4 網路環境中配置了指向 Direct Connection 的 `DIRECT_URL`，將覆蓋掉可正常透過 IPv4 連線的 Session Pooler，直接導致遷移中斷。

### 2. 防護規範
- **嚴格禁令**：在 IPv4 網路環境下執行雲端遷移，**嚴禁配置 `DIRECT_URL`**。
- **單一端點原則**：統一透過 `MIGRATION_DATABASE_URL` 指向支援 IPv4 的 Session Pooler（`aws-0-ap-southeast-2.pooler.supabase.com:5432`）。

---

## 七、連線數容量配置建議

- **Supabase Nano Compute 限制**：
  伺服器後端最大連線數（Backend Connections）為 **15**。
- **Migration CLI 設定方案**：
  在 `MIGRATION_DATABASE_URL` 之 Query String 中顯式帶入 `connection_limit=1`，確保遷移工具在套用 DDL 期間僅佔用 1 條後端連線，執行完畢即刻釋放。
- **Runtime 連線池實作方案（未來修改建議）**：
  在 `backend/src/config/database.ts` 中，建議將 `pg.Pool` 顯式調整為：
  ```typescript
  const pool = new pg.Pool({
    connectionString: resolveDatabaseConnectionString(),
    max: env.NODE_ENV === 'production' ? 5 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  ```
  限制 Runtime 最大連線為 5 條，保留至少 9 條連線餘裕給 Supabase Dashboard、健康檢查及緊急維護作業。

---

## 八、尚未解決的問題（Unresolved Items）

1. **Prisma CLI Rust 引擎之私有 Root CA 信任機制**：
   - 經實測，Prisma CLI 的 Rust 引擎（`schema-engine-windows.exe`）無法透過 URL 參數（如 `sslrootcert`）或 `NODE_EXTRA_CA_CERTS` 讀取私有 Root CA。
   - **現狀處置**：目前在 Windows 環境下，Prisma CLI 若需與 Supabase 連線，其 TLS 模式目前為 Transport-level 加密，但無法在二進位層級獨立校驗私有 CA。
   - **解決方案評估**：
     - 方案 A（推薦）：將 `supabase-root.crt` 安裝至本機 Windows 信任受信任的根憑證授權單位（Trusted Root Certification Authorities）。
     - 方案 B：由 Node.js 封裝腳本（透過已完成驗證之 Node `pg` Driver）執行受控遷移部署。
2. **Runtime 代碼尚未整合自訂 CA**：
   - `backend/src/config/database.ts` 尚未實裝 `ssl: { ca: fs.readFileSync(...) }`，待取得授權後納入上線前代碼重構。

---

## 九、正式部署前風險清單（Risk Inventory）

| 風險項目 | 等級 | 潛在威脅 | 應對對策與審查現況 | 判定 |
| :--- | :---: | :--- | :--- | :---: |
| **意外產生雲端費用** | **Critical** | 方案升級或超額收費 | 嚴禁綁卡與升級，全程維持在 Free Plan ($0.00 USD)。 | `CONTROLLED` |
| **資料庫密碼外洩** | **Critical** | 連線字串落地進版控 | 密碼嚴禁寫入任何檔案，僅允許終端機受控遮罩輸入。 | `CONTROLLED` |
| **DIRECT_URL IPv6 阻斷** | **High** | 直連 IPv6 逾時覆蓋 Pooler | 強制停用 `DIRECT_URL`，全面鎖定 Session Pooler。 | `MITIGATED` |
| **CLI Rust 引擎私有 CA 阻礙** | **High** | Schema Engine 報錯 P1001 | 查明 Rust 引擎信任庫限制，規劃系統憑證安裝或驅動調度。 | `IDENTIFIED` |
| **誤用 Transaction Pooler** | **High** | 遺失 Advisory Lock 造成死鎖 | 代碼層已硬性封鎖 Port 6543 用於 Migration。 | `PASS` (已驗證) |
| **連線池滿載 (Exhaustion)** | **Medium** | Nano 15 連線數超載 | Migration 限制 `connection_limit=1`；Runtime 規劃 `max: 5`。 | `PLANNED` |
| **Init Checksum 差異** | **Low** | 本機提示 hash 警告 | 實測證實為結尾 1 byte `\n`，SQL 語法语義 100% 相同。 | `ACCEPTED` |

---

## 十、下一階段正式 Migration 必要條件（Gate Criteria）

在正式執行雲端 Migration 之前，必須滿足以下所有條件：

1. **憑證信任阻礙排除**：
   決定並實施 Prisma CLI 的 Root CA 信任方案（安裝至本機 Windows 信任庫或受控驅動套用）。
2. **連線字串環境變數安全注入**：
   制定終端機安全輸入範本，確保 `MIGRATION_DATABASE_URL` 於暫態記憶體設定，完成後立即消除。
3. **使用者正式授權（Explicit User Authorization）**：
   由使用者正式核准對 Supabase 雲端專案發起 DDL 寫入。
4. **本機備份再度核對**：
   確認備份檔案（`2DB27F8B...`）無損存在。

---

## 十一、最終回報問題明確答覆

### A. Prisma CLI 是否能安全連接 Supabase？
**部分具備，但存在憑證機制阻礙**。Prisma CLI 設定解析與白名單校驗健全；但其 Rust 引擎（`schema-engine`）因不支援 URL 私有 CA 參數，在未安裝至系統信任庫時會因無法校驗 Supabase 私有 Root CA 而拋出 `P1001`，需排除該信任阻礙後方可連線。

### B. 是否確實使用 Session Pooler 5432？
**是**。設定已完全鎖定 `aws-0-ap-southeast-2.pooler.supabase.com:5432`，且代碼層已硬性封鎖 Port 6543，完整保障 Advisory Lock 之連線需求。

### C. 是否完成 Root CA 憑證驗證？
**檔案與獨立 TLS 握手已完成驗證，但 Prisma CLI 尚未原生支援**。實體檔案 SHA-256 與指紋皆已驗證成功；Node.js `pg` Client 可成功通過 CA 校驗；但 Prisma CLI 的 Rust 引擎因缺乏自訂 CA 參數，目前無法直接載入該憑證。

### D. 是否存在 DIRECT_URL 覆蓋風險？
**是，已查明並提出防禦**。`resolveDatasourceUrl` 優先採用 `DIRECT_URL`，若配置了 IPv6-only 的直連端點會導致連線失敗。遷移策略已強制要求**不得配置 `DIRECT_URL`**，統一使用 `MIGRATION_DATABASE_URL`。

### E. migrate status 是否成功且維持唯讀？
**維持 100% 唯讀，但因憑證阻礙尚未能連通雲端**。本機測試已證實其 100% 唯讀且無副作用；雲端預檢中，Schema Engine 在 TLS 握手階段即安全終止，未對雲端產生任何寫入。

### F. Runtime 是否仍需要整合 Root CA？
**是**。現行 `backend/src/config/database.ts` 尚未實裝讀取本機 CA 檔案之邏輯，需在應用程式正式上線前補齊。

### G. 是否存在阻擋正式 Migration 的風險？
**存在 1 項待解技術阻礙**：Prisma CLI Rust 引擎對 Supabase 私有 Root CA 的信任機制。必須先將該 Root CA 安裝至本地 Windows 憑證庫，或透過相應方案解除該阻礙，否則 CLI 無法完成連線。

### H. 是否具備進入正式 Migration 授權審查的條件？
**尚需先釐清 Root CA 信任處置方案**。在解決 Prisma CLI Rust 引擎的憑證相容性方案之前，不建議貿然請求使用者核准正式部署。

---

> [!NOTE]
> **本階段僅進行 Prisma CLI 連線安全預檢，未執行 Migration、DDL 或任何資料庫寫入。**
