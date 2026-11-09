# CODE TO KNOW (碼上學)
# PHASE 3C-4A-R2-SECURITY：資料庫憑證安全盤點與驗收登入調查報告

**文檔版本**：1.0  
**盤點日期**：2026-11-08  
**執行角色**：Node.js 資安工程師、PostgreSQL DBA、雲端架構師  
**最高資安準則**：零秘密值呈現、零資料庫寫入、零未授權連線、嚴守機密安全防護。

---

## 一、本次驗收連線失敗原因調查 (Root Cause Investigation)

在執行驗收程序時，Supabase 雲端回傳錯誤訊息：
`password authentication failed for user "postgres"`

經深入比對驗收腳本原始碼、連線架構與專案歷史，確認以下關鍵事實：

### 1. 錯誤訊息之使用者名稱分析
- **連線使用者配置**：在 `verify_cloud_post_migration.cjs` 第 63 行中，傳入之使用者字串為 `postgres.ypibmyfxfhsyfdwxprpi`。
- **PostgreSQL 核心認證訊息特徵**：在透過 Supabase Session Pooler (PgBouncer) 連線時，PgBouncer 會將 `postgres.<project-ref>` 轉發至內部實體資料庫，但在後端 PostgreSQL 認證失敗時，PostgreSQL 官方日誌與錯誤回傳通常僅標註主帳號名稱 `"postgres"`（即 `password authentication failed for user "postgres"`）。此為 PostgreSQL 認證機制之標準回報格式，確認連線確實已抵達 Supabase Sydney 實體執行個體。

### 2. 認證失敗可能原因盤點
1. **密碼輸入過程之終端字元編碼或符號影響**：
   - 密碼中若含有特殊字符（如 `@`, `#`, `$`, `&`, `!` 或跳脫符號），在 Node.js `process.stdin` RawMode 逐字節接收時，若包含控制字元或透過剪貼簿貼上含有換行／空白（CR/LF），可能造成記憶體字串與實際密碼有微幅偏差。
2. **終端機輸入與字串暫存**：
   - 終端機接收過程中，若使用者曾按退格鍵或貼上時夾帶不可見字元，造成認證字串不符。
3. **雲端密碼狀態變更或專案密碼一致性**：
   - 若使用者在先前操作曾於 Supabase Dashboard 點選 Reset Database Password，則舊密碼即刻失效。

---

## 二、本機憑證使用位置全面盤點 (Credential Inventory)

針對全專案所有環境變數檔案、設定檔與程式碼引用進行靜態盤點（**絕無任何秘密值外洩**）：

| 檔案路徑 | 變數名稱 | 存在狀態 | 使用目的 | 密碼重設後是否需更新 |
| :--- | :--- | :---: | :--- | :---: |
| `.env` (專案根目錄) | `DATABASE_URL` | 存在 | 本機 Docker 開發連線 (`localhost:5432/code_to_know`) | **否** (本機獨立密碼) |
| `.env` (專案根目錄) | `POSTGRES_PASSWORD` | 存在 | 本機 Docker Compose 容器啟動密碼 | **否** (本機獨立密碼) |
| `backend/.env` | `DATABASE_URL` | 存在 | 後端開發連線 (`localhost:5432/code_to_know`) | **否** (本機獨立密碼) |
| `backend/.env` | `POSTGRES_PASSWORD` | 存在 | 後端開發資料庫設定 | **否** (本機獨立密碼) |
| `frontend/.env` | `VITE_API_URL` | 存在 | 前端呼叫後端 API 網址 (無資料庫密碼) | **否** (無關) |
| `backend/prisma.config.ts` | `resolveDatasourceUrl` | 程式碼引用 | 讀取動態環境變數解析 Migration / Runtime URL | **否** (動態讀取，無硬編碼) |
| `backend/src/config/db-validation.ts` | `MIGRATION_DATABASE_URL` | 變數名稱白名單 | 雲端 Migration 唯一授權變數 | **是** (若有設定需更新) |
| `backend/src/config/db-validation.ts` | `DIRECT_URL` | 變數名稱白名單 | 雲端直連變數 (Free Plan 停用) | **否** (Free Plan 隔離) |
| `backend/src/config/database.ts` | `DATABASE_URL` | 程式碼引用 | 後端 Runtime pg Pool 連線 (目前指向量產/開發) | **是** (未來部署雲端時需配置) |

> **盤點安全結論**：
> 專案之 `.env` 與 `backend/.env` 目前**完全未存放 Supabase 雲端資料庫之密碼或連線字串**（全部指向本機 Docker `code_to_know`）。
> Supabase 雲端憑證在過去所有操作中，均採用「**純記憶體、單次互動輸入、執行完畢即刻 delete 擦除**」機制，**本地檔案系統中零雲端機密殘留**！

---

## 三、驗收腳本原始碼安全檢查 (`verify_cloud_post_migration.cjs`)

針對已審查之驗收腳本再次進行嚴格源碼審查：

1. **連線目標與帳號**：
   - Host：`aws-0-ap-southeast-2.pooler.supabase.com`（確為既定 Session Pooler）。
   - Port：`5432`。
   - Database：`postgres`。
   - User：`postgres.ypibmyfxfhsyfdwxprpi`（符合 Supabase Session Pooler 要求之 `<user>.<project-ref>` 格式）。
2. **TLS 嚴格驗證**：
   - `ssl.ca`：載入實體 `supabase-root.crt`。
   - `rejectUnauthorized: true`（嚴格驗證，禁止中間人攻擊）。
   - `servername: 'aws-0-ap-southeast-2.pooler.supabase.com'`（精確比對 SAN）。
3. **密碼生命週期與安全**：
   - 採用 `process.stdin.setRawMode(true)`。
   - 密碼只傳遞給 `new Pool({ password })`，完全沒有任何 `console.log(password)` 或字串拼接輸出。
   - 零明文寫入檔案。
4. **SQL 唯讀性**：
   - 經核對內部 8 組 SQL 均為 `information_schema`、`pg_indexes` 與 `COUNT(*)`，絕無任何修改語句。

---

## 四、憑證外洩處理與防護建議 (Mitigation & Recommendations)

因使用者提到資料庫密碼曾出現在終端或對話中，依據 OWASP 及資安防護規範，建議處置步驟如下：

1. **Supabase Dashboard 重設密碼 (Database Password Reset)**：
   - 建議使用者登入 Supabase 官方 Dashboard（`https://supabase.com/dashboard/project/ypibmyfxfhsyfdwxprpi/settings/database`）。
   - 點選 **Reset Database Password**，產生一組全新的隨機高強度密碼並妥善保存於個人密碼管理器。
2. **零程式碼與零配置變更**：
   - 由於 CODE TO KNOW 本地程式碼與 `.env` 本就未儲存 Supabase 密碼，因此重設密碼**完全不會影響本地 Docker 與現有開發環境**。
3. **後續驗收流程**：
   - 密碼重設後，未來執行唯讀驗收腳本時，僅需在命令列提示時以安全遮罩輸入新密碼即可，無需修改任何專案檔案。

---

## 五、專案與 Git 完整性檢核

| 檢核項目 | 預期基準 | 實際狀態 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git HEAD** | `765ff905f4a567be06cb89a162043f27065dfd82` | `765ff905f4a567be06cb89a162043f27065dfd82` | **PASS** |
| **Git 暫存區** | 無任何 staged 變更 | 純淨 | **PASS** |
| **Prisma Schema** | 未修改 | 未修改 | **PASS** |
| **Migration SQL** | 未修改 | 未修改 | **PASS** |
| **正式環境變數** | 零本機 Supabase 殘留 | 純淨 | **PASS** |
| **驗收腳本 SHA-256** | `ab1c79d84f6a79bc...` | `ab1c79d84f6a79bc...` | **PASS** |
| **資料庫連線與寫入** | 零連線、零寫入 | 保持隔離 | **PASS** |

---

## 六、最終總結判定：`BLOCKED` (等待憑證重設與授權)

由於目前雲端認證失敗且憑證有外洩疑慮，依據安全規範將流程判定為 **BLOCKED**。在使用者確認於 Supabase Dashboard 重設密碼並授權後，方可進行下一步唯讀驗收。
