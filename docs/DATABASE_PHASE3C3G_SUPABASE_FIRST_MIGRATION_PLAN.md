# CODE TO KNOW（碼上學）
# PHASE 3C-3G：Supabase 雲端首次 Migration 部署計畫

**文件版本**：1.0.0  
**制定日期**：2026-11-08  
**規劃團隊**：PostgreSQL DBA、Prisma 7 架構師、Supabase 雲端工程師、資安審查工程師  
**文件性質**：部署前規劃、安全防禦架構與逐步執行指引（Strictly Pre-deployment Planning & Review）  
**雲端目標專案**：`code-to-know-prod`（Ref: `ypibmyfxfhsyfdwxprpi`，AWS Sydney `ap-southeast-2`）  

> [!IMPORTANT]
> **本階段僅完成部署計畫與安全審查，尚未對 Supabase 執行任何 Migration、DDL 或資料庫寫入。**
> 任何雲端寫入與部署操作必須留待取得使用者明確授權後方可實施。

---

## 一、專案現況與已就緒條件

### 1. 本機資料庫現況（Docker PostgreSQL 16.15）
- **實體容器**：`code_to_know_postgres`（映像檔：`postgres:16-alpine`，狀態：`healthy`）。
- **資料庫綱要**：`code_to_know`，擁有者 `codetoknow`。
- **Prisma Schema**：`backend/prisma/schema.prisma` 定義完整 36 個業務 Models。
- **實體資料表**：`public` 綱要內共 37 張資料表（36 張業務表 + 1 張 `_prisma_migrations`）。
- **物件統計**：1 組 Native Enum (`AnnouncementStatus`)、47 組 Foreign Keys、133 組 Indexes、1 組業務自訂 XOR Check Constraint (`ClassAssignment_target_xor_check`)。
- **本機驗證記錄**：已完成本地全新庫還原驗證（`code_to_know_restore_test`），結構與資料完整無損。
- **本機備份留存**：
  - 路徑：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`
  - 實測 SHA-256：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`（狀態：無損留存）。

### 2. Supabase 雲端目標現況（PostgreSQL 17.11）
- **專案識別**：`code-to-know-prod`（Project Ref: `ypibmyfxfhsyfdwxprpi`）。
- **主機節點**：`aws-0-ap-southeast-2.pooler.supabase.com`（AWS Sydney，亞太地區）。
- **計費方案**：**Free Plan**（Nano Compute，硬體共享，500 MB 儲存上限，每月 5 GB Egress）。
- **連線架構**：IPv4 Session Pooler（連接埠 `5432`，連線身分：`postgres.ypibmyfxfhsyfdwxprpi`）。
- **容量限制**：Pool Size = 15（後端連線），Max Client Connections = 200。
- **TLS 驗證狀態**：官方 Root CA（`prod-ca-2021.crt`）已完成離線隔離存放，經實測 TLSv1.3 握手成功（Cipher: `TLS_AES_256_GCM_SHA384`，`rejectUnauthorized: true`）。
- **目前資料庫狀態**：`public` 綱要內確認為 **0 張資料表**，`_prisma_migrations` 不存在，處於 100% 潔淨狀態（Pristine State）。

---

## 二、Migration 部署架構與端點拓撲

### 1. 網路拓撲與連線路徑
```
[Local Dev / Deploy Machine] (IPv4 Network)
       │
       ▼ (Encrypted TLSv1.3 / Root CA Verified)
[Supabase Supavisor Session Pooler] (Port 5432)
   aws-0-ap-southeast-2.pooler.supabase.com
       │ (Dedicated Session Backend Connection)
       ▼
[Supabase Cloud PostgreSQL 17.11] (Nano Compute)
   └── Database: postgres
       └── Schema: public (Clean / 0 tables)
```

### 2. 連線機制與鎖支援（Advisory Lock）
- Prisma Migrate 在執行時，必須取得 PostgreSQL Session 級諮詢鎖（Session-level Advisory Lock）：`SELECT pg_advisory_lock(72707369)`，以確保多工作節點時不會發生並行遷移衝突。
- **Session Pooler (Port 5432)** 在客戶端建立連線後，會為該連線分配單一專屬之伺服器後端會話（Server Backend Connection），直到客戶端斷線為止。因此，Session Pooler **完美支援 Prisma Advisory Locks**。
- **Transaction Pooler (Port 6543)** 則是在每個交易結束後立即歸還伺服器連線，下一個指令可能由不同後端會話處理，導致會話級鎖遺失或被其他連線誤鎖，**嚴禁將 Port 6543 用於 Migration**。

---

## 三、Runtime 與 Migration 連線策略

### 1. 程式代碼解析順序稽核（`resolveDatasourceUrl`）
依據 `backend/src/config/db-validation.ts` 與 `backend/prisma.config.ts` 之實作：
```typescript
if (nodeEnv === 'production' || process.env.MIGRATION_ENV === 'cloud') {
  const directUrl = process.env.DIRECT_URL?.trim();
  const migrationUrl = process.env.MIGRATION_DATABASE_URL?.trim();

  if (!directUrl && !migrationUrl) {
    throw new Error('[PRISMA MIGRATION CONFIG ERROR] Cloud migration requires an explicit DIRECT_URL or MIGRATION_DATABASE_URL.');
  }

  const selectedUrl = directUrl || migrationUrl!;
  validateMigrationDatabaseUrl(selectedUrl);
  return directUrl
    ? (getEnv('DIRECT_URL') || directUrl)
    : (getEnv('MIGRATION_DATABASE_URL') || migrationUrl!);
}
```

### 2. `DIRECT_URL` 潛在 IPv6-only 覆蓋風險與防禦
- **風險發現**：`resolveDatasourceUrl` 採取 `directUrl || migrationUrl`，意即**若環境中存在 `DIRECT_URL`，其優先權高於 `MIGRATION_DATABASE_URL`**。
- **Supabase Free 限制**：Supabase Free 方案之 Direct Connection 端點（`db.<ref>.supabase.co:5432`）**僅提供 IPv6 位址**。在純 IPv4 網路環境下（如多數一般家用與辦公室網路），嘗試連線 Direct Connection 將發生 `ENOTFOUND`、`EHOSTUNREACH` 或連線超時。
- **連線策略決策**：
  1. 在 IPv4 環境下執行雲端 Migration，**嚴禁設定指向 `db.<ref>.supabase.co` 的 `DIRECT_URL`**。
  2. 建議直接使用 **`MIGRATION_DATABASE_URL`**，並將其指向 IPv4 支援的 **Session Pooler (Port 5432)**：
     ```bash
     MIGRATION_DATABASE_URL="postgresql://postgres.ypibmyfxfhsyfdwxprpi:[PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require&connection_limit=1"
     ```
  3. 保留 `DATABASE_URL` 與 `MIGRATION_DATABASE_URL` 之變數用途分離，禁止相互回退。

### 3. 連線容量與 Pool Size 15 影響分析
- Supabase Nano 執行個體的 Pooler 伺服器端連線數（Backend Connections）上限為 **15**。
- **Migration 策略**：Migration 執行時，必須將連線數限制為 **1**（`connection_limit=1`），在極短時間內完成 DDL 並關閉連線，不佔用連線池資源。
- **Runtime 策略**：未來的 Express 應用程式執行時期（`pg.Pool`），`max` 必須嚴格設定為 **5**（最多不超過 8），保留至少 7 條連線給 Supabase Dashboard、排程作業及緊急 DBA 連線，防止 Connection Exhaustion。

### 4. 密碼與憑證保密規範
- **嚴禁行為**：嚴禁將資料庫密碼寫入 `.env`、`backend/.env`、指令碼檔案、日誌或提交至 Git。
- **受控注入方式**：正式部署執行時，密碼僅允許由終端機互動式受控輸入，或由暫態終端機環境變數（Session-scoped memory）提供，執行完成後立即清理記憶體變數。

---

## 四、TLS 與資安防護規劃

### 1. Root CA 憑證存放與校驗
- **憑證來源**：Supabase 官方亞太/全域 Root CA（`prod-ca-2021.crt`）。
- **實體存放路徑**：
  `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt`
  （完全獨立於 Git 專案工作目錄之外，位於上層專屬機密目錄）。
- **校驗演算法**：SHA-256 雜湊為 `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`。
- **強制連線參數**：
  Node.js `pg` Client 與 Prisma 連線必須強制設定 `rejectUnauthorized: true`，嚴禁使用 `rejectUnauthorized: false`。

### 2. Supabase Dashboard「SSL Enforcement: Disabled」解析與風險說明
- **澄清與事實**：Dashboard 顯示之「SSL Enforcement: Disabled」代表 Supabase 伺服器端「允許接受未加密連線」，**並不代表我們的連線沒有加密**。
- **已驗證事實**：在 Phase 3C-3E 中，我們透過 Session Pooler 進行的連線已實測通過 TLSv1.3 加密傳輸（Cipher: `TLS_AES_256_GCM_SHA384`）。
- **開啟 SSL Enforcement 之評估**：
  - 開啟效益：強制拒絕任何未通過 TLS 加密的連線，消除非加密連線可能性。
  - 潛在風險：若有未配置 TLS/SNI 的本機除錯工具或簡易客戶端連線，將直接被伺服器阻斷。
  - 處置建議：目前連線客戶端（Prisma 與 pg Pool）皆已具備 TLS 強制加密能力，本階段維持現狀，不修改 Supabase Dashboard 設定；待應用程式穩定部署後，可再由架構團隊評估啟用。

### 3. Git 與 `.gitignore` 補強建議
雖然機密憑證目前存放於工作區之外，但為求縱深防禦（Defense-in-Depth），建議在未來維護版控時，於專案根目錄及 `backend/.gitignore` 補強以下安全過濾規則：
```gitignore
# Security & TLS Certificates
*.crt
*.pem
*.key
*.cer
*ca-2021*
secrets/
.secrets/
```

---

## 五、Migration 執行順序與依賴深度分析

### 1. 兩組 Migration 依賴拓撲
本專案現存兩組 Migration，具備嚴格的先後繼承依賴：

```
[20261103000000_init]
  ├── 8 個基礎 Model (User, Role, UserRole, UserProfile, Session, TeacherApplication, EmailVerificationToken, PasswordResetToken, AuditLog)
  └── 基礎唯一鍵與外鍵關聯
       │
       ▼ (強依賴：28 個新 Model 中有 16 個透過 userId 外鍵參考 User.id)
[20261108000000_add_business_models]
  ├── 1 個 Native Enum (AnnouncementStatus)
  ├── 28 個業務 Model (課程、測驗、題庫、實作、AI 輔導等)
  ├── 47 組 Foreign Keys 拓撲建立
  ├── 133 組 Indexes 建立
  └── 1 組業務 Check 約束 (ClassAssignment_target_xor_check)
```

### 2. DDL 語法與權限安全審查
- **Extension 依賴**：經靜態全文掃描，兩組 Migration SQL 皆**無 `CREATE EXTENSION` 或 `DROP EXTENSION`** 語句。全域 UUID 生成使用核心原生 `gen_random_uuid()`，無相容性或特殊權限問題。
- **Schema 權限**：所有 DDL 僅操作預設之 `public` 綱要，不建立、修改或刪除任何自訂 Schema，亦不觸及 Supabase 系統綱要（`auth`, `storage`, `vault` 等）。
- **不可逆操作檢驗**：兩組 Migration 均為全新創建物件（`CREATE TABLE`, `CREATE INDEX`, `ALTER TABLE ... ADD CONSTRAINT`），未包含任何破壞性欄位刪除（`DROP COLUMN`）或表刪除（`DROP TABLE`）。
- **潛在中斷點**：
  1. 網路中斷：若在遷移過程中網路連線中斷，PostgreSQL 的 DDL 事務（Transactional DDL）會自動進行整體回滾（Rollback），不會在資料庫留下半套毀損物件。
  2. 順序倒置：若跳過 `init` 直接執行 `add_business_models`，會因找不到 `User` 表外鍵目標而立即中斷。因此必須嚴格保證順序執行。

### 3. Checksum 差異鑑識證據與處置原則
- **現象回顧**：
  - 本機資料庫 `_prisma_migrations` 記錄值：`2185e3a03ed86bdcaaaefbfe4ba39405bdcb9f3c0f415e5bf648ac8e8a64d915`
  - 現行磁碟檔案 SHA-256 實測值：`ed5b504a4b30d4e5b35a0cd58ad00ceb93c501d3d0e67bd61f5d490dcbafed29`
- **獨立鑑識實驗證據**：
  本階段透過二進位逐位元轉換實驗證實：
  - 現行檔案以 CRLF 換行之 SHA-256 為 `7cee6bc7...`
  - 現行檔案以 LF 換行之 SHA-256 為 `ed5b504a...`
  - 現行檔案加入 UTF-8 BOM 之後之 SHA-256 為 `40eaf9a9...` (CRLF) 及 `57849fe0...` (LF)
  - **上述任何一種換行或 BOM 組合，皆無法比對出 `2185e3a0...`**！
- **鑑識結論**：
  **不可將差異原因逕自推論為「換行格式或編碼差異」**。本機資料庫於 2026-11-03 13:49:46 UTC 執行遷移時，所讀取之檔案在空白、註解或 DDL 內容上必定存在其他微小差異。
- **處置原則（Strictly Read-Only）**：
  1. **嚴禁修改原始 Migration 檔案**：維持磁碟檔案 `ed5b504a...` 不變。
  2. **雲端首次部署影響評估**：雲端 Supabase 為全新資料庫，目前不存在 `_prisma_migrations`。當首次執行 `prisma migrate deploy` 時，Prisma 會直接將現行磁碟檔案（`ed5b504a...` 與 `c9eaba10...`）作為基準寫入雲端管理表記錄。因此，**該歷史記錄差異在雲端首次部署情境下不會引發衝突**。

---

## 六、備份與災難復原計畫

### 1. 現存備份資產保留與校驗
- **現存備份路徑**：
  `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump`
- **強制核對 SHA-256**：
  `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
- **保留保證**：本計畫與後續任何部署步驟，絕對禁止刪除、移動或覆蓋此備份檔案。

### 2. 雲端首次 Migration 前備份規劃
- 由於目前 Supabase 雲端資料庫 `public` 綱要為 **0 張資料表**，雲端尚未有任何商業資料。
- 在部署前，執行唯讀 Schema 結構快照（Catalog Snapshot），記錄當前雲端系統 Schema 清單與擴充套件清單，作為比對基準。

### 3. Migration 失敗時的停止條件與清理復原方案
若在未來正式部署執行過程中發生任何異常，必須立即觸發以下機制：
- **停止條件（Stop Conditions）**：
  1. Prisma CLI 拋出任何錯誤代碼（Exit Code != 0）。
  2. 發生網路逾時（Connection Timeout）或 TLS 握手失敗。
  3. Supabase 連線池拋出 `remaining connection slots are reserved` 或連線數超額。
  4. 任何 Migration 在雲端 `_prisma_migrations` 中被標記為 `rolled_back_at IS NOT NULL`。
- **復原策略（Recovery Plan）**：
  1. 若第一組 Migration 執行中斷：PostgreSQL 事務回滾機制會自動復原；若留下不完整管理表記錄，透過受控 DBA 指令重置 `public` 綱要：
     ```sql
     -- 僅在部署失敗且取得授權時，由 DBA 執行 public 重置
     DROP SCHEMA public CASCADE;
     CREATE SCHEMA public;
     GRANT ALL ON SCHEMA public TO postgres;
     GRANT ALL ON SCHEMA public TO public;
     ```
  2. **系統綱要安全隔離**：任何重置指令**嚴格限定在 `public` 綱要**，絕對不得碰觸 `auth`、`storage`、`vault` 等 Supabase 核心系統綱要。

---

## 七、Migration 執行計畫草案（Phase A ~ Phase J）

未來取得使用者授權後，正式部署將依循以下 10 個標準受控階段進行：

| 階段代號 | 階段名稱 | 執行目的與內容 | 預期結果 | 雲端寫入 | 授權需求 | 失敗停止條件 |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Phase A** | **部署前環境確認** | 檢查本地 Node、Prisma CLI、Docker 容器狀態及網路連線。 | 工具版本與狀態皆符合規格。 | 無 | 否 | 環境異常即停止。 |
| **Phase B** | **備份與 Hash 驗證** | 核對本地備份檔案 SHA-256，確認無損。 | 雜湊值符合 `2DB27F8B...`。 | 無 | 否 | 雜湊不符立即終止。 |
| **Phase C** | **連線與權限確認** | 以單次連線測試雲端 Session Pooler 與登入身分權限。 | 回傳 PG 17.11 與正確使用者。 | 無 | **是** (密碼) | 認證失敗即終止。 |
| **Phase D** | **第一組 Migration 執行** | 透過受控參數執行 `20261103000000_init`。 | 8 張基礎資料表建立成功。 | **有** | **是** (部署授權) | CLI 報錯立即停止。 |
| **Phase E** | **第一組 Migration 驗證** | 唯讀查詢 `public` 資料表清單與 `_prisma_migrations`。 | 確認 8 表建立且 migration 完成。 | 無 | 否 | 結構缺失即停止。 |
| **Phase F** | **第二組 Migration 執行** | 執行 `20261108000000_add_business_models`。 | 28 張業務資料表建立成功。 | **有** | **是** (部署授權) | CLI 報錯立即停止。 |
| **Phase G** | **第二組 Migration 驗證** | 唯讀查詢總資料表清單與第二組 migration 記錄。 | 確認累計 37 表建立完成。 | 無 | 否 | 數量不符即停止。 |
| **Phase H** | **36 個 Model 完整核對** | 逐一比對 36 個 Prisma Model 與實體資料表名稱。 | 1:1 完全精確對齊。 | 無 | 否 | 存在遺漏即警報。 |
| **Phase I** | **限制與約束條件核對** | 驗證 47 個 FK、133 個 Index、1 個 Enum、1 個 XOR Check。 | 約束條件完整建立無缺失。 | 無 | 否 | 缺少約束即排查。 |
| **Phase J** | **應用程式唯讀連線測試** | 以唯讀 Client 測試後端連線池與健康檢查 API。 | 後端正常啟動且查詢成功。 | 無 | 否 | 連線失敗即排查。 |

---

## 八、正式部署前風險分級（Risk Inventory）

| 風險項目 | 等級 | 潛在威脅與影響 | 現有防禦對策 | 鑑識判定 |
| :--- | :---: | :--- | :--- | :---: |
| **意外產生雲端費用** | **Critical** | 觸發付費方案或 Add-on 費用 | 全程嚴格遵守 Free 方案邊界，不升級、不綁卡、不啟用付費功能。 | `CONTROLLED` |
| **資料庫密碼外洩** | **Critical** | 機密外洩導致雲端資料庫遭入侵 | 密碼絕不寫入檔案或版控，僅採暫態記憶體或互動式輸入。 | `PROTECTED` |
| **DIRECT_URL IPv6 阻斷** | **High** | IPv4 環境下直連逾時，中斷遷移 | 強制停用 `DIRECT_URL`，以 Session Pooler 5432 作為遷移端點。 | `MITIGATED` |
| **誤用 Transaction Pooler** | **High** | Port 6543 遺失 Advisory Lock 造成死鎖 | 代碼層與單元測試已全面封鎖 Port 6543 用於 Migration。 | `PASS` (已實測) |
| **TLS 憑證校驗繞過** | **High** | 中間人攻擊風險 | 強制掛載專屬 Root CA，強制鎖定 `rejectUnauthorized: true`。 | `PASS` (已實測) |
| **雲端連線池容量耗盡** | **High** | Nano 15 連線數爆滿導致服務阻斷 | Migration 指定 `connection_limit=1`；Runtime 池 `max=5`。 | `PLANNED` |
| **網路抖動造成連線中斷** | **Medium** | 跨國連線（台灣至雪梨）中途斷線 | PostgreSQL 具備事務性 DDL，失敗自動 Rollback，不留髒物件。 | `MITIGATED` |
| **Init Migration Checksum 差異** | **Medium** | 本機若執行 `migrate dev` 可能拋出警告 | 雲端為新庫不受影響；本機維持現狀，不手動修改原始 SQL。 | `ACKNOWLEDGED` |
| **PostgreSQL 16 → 17 相容性** | **Low** | 語法棄用或內建函數行為變異 | 經詳細比對，本專案所有 DDL、函數與型別在 PG 17 均完美支援。 | `PASS` (零相容風險) |

---

## 九、尚未解決的問題（Unresolved Items）

1. **原始 Init Migration Checksum 鑑識成因**：
   - 雖然已排除 CRLF、LF、BOM 等格式變更假說，但原始產生 `2185e3a0...` 的檔案內容已無從追溯。
   - **當前處置**：維持現況，**不修改原始 Migration 檔案**。雲端首次部署將直接依據磁碟檔案（`ed5b504a...`）落地，此差異不影響雲端部署之執行。
2. **本機歷史 rolled-back 記錄**：
   - 本機 `_prisma_migrations` 曾留下一筆失敗後回滾的 BOM 記錄（`90eeb58c...`），但隨後已成功重新套用。該記錄為本機開發歷史痕跡，不會同步至雲端。

---

## 十、正式部署前所需授權項目清單

在正式進入 Migration 執行階段前，必須取得以下項目之明確授權與準備：

1. **使用者正式授權（Explicit User Authorization）**：
   - 明確同意對 Supabase 雲端專案 `code-to-know-prod` 執行 DDL 結構建立與 Migration 記錄寫入。
2. **資料庫連線密碼之受控提供**：
   - 由使用者於部署階段於受控遮罩終端機中輸入密碼，完成單次部署連線。
3. **雲端容量與 Egress 政策知悉**：
   - 確認理解 Supabase Free 方案 500 MB 儲存空間與 7 天閒置自動暫停機制。

---

## 十一、下一階段建議

1. **進入 PHASE 3C-3H：Supabase 雲端首次 Migration 部署執行（需授權）**。
2. **執行完成後立即啟動 PHASE 3C-3I：雲端 36 個 Model 完整結構鑑識驗收**。
3. **進行後端 API 與 Supabase 唯讀連線煙霧測試（Smoke Test）**。
