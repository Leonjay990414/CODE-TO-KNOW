# CODE TO KNOW｜PostgreSQL 安全措施實施前環境盤點與變更範圍確認報告 (Phase 3C-4F-R14-A)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14A-AUDIT`  
**建立時間**：2026-11-09  
**主導角色**：獨立資安審查員 / PostgreSQL DBA / 後端安全架構師  
**審查性質**：100% 唯讀實施前環境盤點（零雲端連線、零資料庫寫入、零程式碼修改、零憑證下載、零平台異動）  
**前置基準**：  
- `docs/DATABASE_PHASE3C4F_R13_TECHNICAL_CORRECTNESS_AUDIT.md`  
- `docs/DATABASE_PHASE3C4F_R13_SAFE_IMPLEMENTATION_ROADMAP.md`  
- `backend/src/config/database.ts`  
- `backend/src/config/env.ts`  
- `backend/src/config/db-validation.ts`  
- `backend/src/app.ts`  
- `scripts/database/run_supabase_backup.ps1`

---

## 一、報告摘要與 R14-A 最終判定

本階段依據 R13 修正後的技術規格，在進行任何實體修改或雲端操作前，對本機環境、程式碼相依性、現有備份工具、正式資料庫歷史結構及部署平台設定進行**實施前最後一次全鏈路環境盤點**。

經盤點確認：
1. **本地執行環境完備**：Node.js 版本為 `v24.19.0`，具備完整的原生 `node:crypto`（支援 AES-256-GCM）、`node:tls`、`node:stream` 與最新 ESM 模組支援；`pg` 套件版本為 `^8.13.1`。
2. **現存備份工具與檔案為明文傾印**：現有 `run_supabase_backup.ps1` 產出的是未加密之 PostgreSQL Custom Format 檔案（`.dump`），AES-256-GCM 加密能力目前僅存於 R12/R13 文件規劃，尚未落地為可執行腳本。
3. **雲端平台設定規格完全清晰**：後端環境變數格式（`DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`）與健康檢查端點（`/api/health`）已精確對齊。
4. **高風險操作邊界明確劃分**：所有需更動正式程式碼、雲端角色 DDL 或 Render 控制台之項目，已全部納入矩陣分類並鎖定授權防線。

> ### **R14-A 最終判定：`PASS`（實施前環境盤點與變更範圍確認全數合規，具備推進 R14-B 規劃條件）**
> 
> - **環境相依性盤點**：**PASS**（Node.js v24.19.0、pg v8.13.1 就緒）。
> - **變更邊界明確度**：**PASS**（五類變更範圍與影響檔案已逐項釐清）。
> - **操作安全隔離度**：**PASS**（未修改程式碼、未連線正式庫、未下載憑證、維持唯讀）。

---

## 二、五大實施前檢查項目詳細盤點

---

### R14-A-01｜TLS 憑證實施準備盤點

#### 1. 現況盤點
- **後端資料庫連線代碼**（`backend/src/config/database.ts:33`）：
  `const pool = new pg.Pool({ connectionString: resolveDatabaseConnectionString() });`
  未傳入獨立的 `ssl` 設定物件，僅仰賴 `DATABASE_URL` 結尾之 `?sslmode=require`。
- **後端環境配置**（`backend/src/config/env.ts:39-97`）：
  在 `NODE_ENV === 'production'` 模式下強制校驗 `DATABASE_URL`，但尚未包含 CA 憑證路徑變數。
- **執行環境**：
  - Node.js 版本：`v24.19.0`（內建支援 TLS 1.3、SNI 與標準 RFC 6125 主機名稱驗證）。
  - `pg` 套件版本：`^8.13.1`（支援傳入 `ConnectionConfig['ssl']` 物件）。
- **CA 憑證現況**：
  本地安全目錄 `C:\Users\user\Documents\CODE-TO-KNOW_SECRETS\certs\supabase-root.crt` 存在歷史憑證（SHA-256: `700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`）。
  專案代碼庫目錄（`backend/certs/`）目前尚未建立，亦無憑證檔案納入。

#### 2. 未來修改範圍與相依性
- **預計修改之檔案**：
  1. `backend/src/config/database.ts`：在 `new pg.Pool()` 初始化時，當環境為 production 且具備 CA 憑證時，注入 `ssl: createProductionSslConfig()`。
  2. `backend/src/config/env.ts`：新增可選變數 `SUPABASE_CA_CERT_PATH`（預設指向 `certs/prod-supabase-ca.crt`）。
  3. `backend/src/config/db-validation.ts`：放寬 Pooler 使用者名稱前綴校驗，允許 `app_runtime.<project_ref>`。
- **預計新增之檔案**：
  1. `backend/certs/prod-supabase-ca.crt`（可公開之 Supabase 官方 Root CA 憑證，納入版本控制）。
  2. `backend/tests/database-ssl-config.test.ts`（專用 SSL 設定邏輯單元測試）。
- **CA 憑證取得途徑**：
  自 Supabase Dashboard（Project Settings -> Database -> SSL Configuration）下載公開根憑證，或由管理員自受信任安全目錄安全複製。
- **驗證與負向測試設計**：
  1. *正向測試*：在沙盒環境測試讀取正確 CA 憑證，驗證 TLS 握手與 SAN 匹配成功。
  2. *負向測試 1（憑證錯誤）*：傳入自簽或損壞之 CA 憑證，連線池必須被底層拒絕並拋出 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`。
  3. *負向測試 2（主機名不符）*：連線目標與憑證 SAN（`*.pooler.supabase.com`）不匹配時，必須被 `tls.checkServerIdentity` 攔截並拋出 `ERR_TLS_CERT_ALTNAME_INVALID`。

---

### R14-A-02｜AES-256-GCM 備份工具準備盤點

#### 1. 現況盤點
- **現存備份腳本**（`scripts/database/run_supabase_backup.ps1`）：
  - 採用 Docker 容器隔離執行 `pg_dump -Fc`（映像檔 Digest 鎖定：`postgres@sha256:3540c0362c809df...`）。
  - 目前輸出之檔案為**未加密之自訂格式傾印檔**（`code_to_know_supabase_prod.dump`）。
  - 雜湊校驗：使用 PowerShell `Get-FileHash` 計算未加密檔案之 SHA-256 並輸出至 `.dump.sha256`。
- **OpenSSL 狀態**：
  Git 內建之 `openssl.exe` 實測證實其 `enc` 命令行工具不支援 AEAD（GCM）模式，確定無法直接用於備份加密。
- **Node.js Crypto 可用性**：
  Node.js `v24.19.0` 內建完整之 `node:crypto`，支援高效串流加密 `createCipheriv('aes-256-gcm', key, iv)` 與 `createDecipheriv`。

#### 2. 未來獨立加密工具架構規劃（`scripts/database/backup-crypto.cjs`）
- **演算法規格**：
  - 模式：`aes-256-gcm`（具備 AEAD 訊息驗證標籤）。
  - Nonce/IV：使用 `crypto.randomBytes(12)` 動態生成 12 位元組唯一隨機數（嚴禁硬編碼或重用）。
  - Authentication Tag：16 位元組（128-bit），加密結尾由 GCM 引擎產出。
- **封裝格式標準**：
  `[12 Bytes IV] + [密文資料流 (Ciphertext Stream)] + [16 Bytes Auth Tag]`
- **解密防護與完整性驗證**：
  解密端讀取頭部 12 Bytes 作為 IV，資料流結束時擷取最後 16 Bytes 傳入 `decipher.setAuthTag()`。若密文遭受篡改（位元翻轉）或金鑰錯誤，Node.js 立即拋出例外並以非 0 狀態碼（Exit Code 1）終止 Process，**嚴格禁止向資料庫還原管道輸出任何損壞位元組**。
- **金鑰分離防護**：
  加密金鑰由獨立環境變數 `BACKUP_ENCRYPTION_KEY` 傳入（必須為 64 位元 Hex 字串 / 256-bit），與資料庫登入密碼 `PGPASSWORD` 徹底隔離。
- **雜湊記錄鏈**：
  - 加密前產出未加密傾印之 SHA-256：`dump.sha256`
  - 加密後產出加密封裝檔之 SHA-256：`dump.enc.sha256`

---

### R14-A-03｜PostgreSQL 最小權限角色準備盤點

#### 1. 正式資料庫既有結構歷史證據盤點（非雲端連線）
依據 Phase 3C-4A-R2 遷移日誌及 Phase 3C-4C-R3 即時備份記錄：
- **現存資料表清單 (16 張)**：
  - 核心遷移表：`_prisma_migrations`
  - 使用者與認證：`users`, `roles`, `user_roles`, `sessions`, `email_verification_tokens`, `teacher_profiles`
  - 業務與課程：`courses`, `lessons`, `enrollments`, `learning_progress`
  - 測驗與問答：`exam_records`, `exam_answers`, `ai_conversations`, `ai_messages`
  - 系統審計：`audit_logs`
- **現有擁有者狀態 (Owner)**：
  目前所有資料表與關聯 Sequence 均由初始化執行者 `postgres` 擁有。
- **預設權限 (Default Privileges)**：目前為 PostgreSQL 預設狀態。

#### 2. 未來實施規格與影響評估
- **未來需執行之 DDL 類型**：
  1. 角色建立：`CREATE ROLE app_runtime`, `CREATE ROLE migration_admin`, `CREATE ROLE readonly_auditor`。
  2. 物件擁有權移轉：`ALTER TABLE ... OWNER TO migration_admin`（將所有 public 資料表與 Sequence 移轉給 migration_admin，否則 Prisma Migration 將因非 Table Owner 而報錯）。
  3. DML 授權：`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime`。
  4. 預設權限配置：`ALTER DEFAULT PRIVILEGES FOR ROLE migration_admin IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime`。
- **Prisma Migration 相容性**：
  - `prisma migrate deploy`（CLI）未來必須使用 `migration_admin` 連線字串執行。
  - 後端 Express 應用伺服器（Runtime）僅使用 `app_runtime` 連線字串執行。
- **權限切換失敗回復方案 (Rollback Plan)**：
  - 若 `app_runtime` 發生未預期權限阻絕，後端連線字串可立即切回預備之 `postgres` 帳號。
  - 物件所有權可執行 `REASSIGN OWNED BY migration_admin TO postgres` 完整還原。
- **授權邊界**：
  此 DDL 語句**必須由專案負責人授權**，並於 Supabase SQL Editor 或由授權人員直接執行，AI 本地流程不得自動連線執行。

---

### R14-A-04｜備份與異地儲存能力盤點

對專案目前備份能力進行「已具備實體能力」與「僅有文件規劃」之客觀查驗：

| 備份與災難復原能力 | 當前真實狀態 | 實體證據或狀態說明 |
| :--- | :---: | :--- |
| **手動雲端備份** | **真實具備** | `scripts/database/run_supabase_backup.ps1` 可成功執行（具備 Session Pooler 5432、verify-full TLS 與 Docker 映像 Digest 鎖定） |
| **本地安全儲存** | **真實具備** | `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS` 目錄保留 3 份歷史備份檔 |
| **SHA-256 數位指紋** | **真實具備** | 每次備份自動計算並產出 `.dump.sha256` 記錄檔 |
| **沙盒還原演練能力** | **真實具備** | 本地 PG17 容器（Port 5433）已完整演練自雲端 Dump 還原並通過 R6 寫入測試 |
| **AES-256-GCM 備份加密** | **僅有文件規劃** | R12/R13 已完成規格設計，待 R14 落地實作 `scripts/database/backup-crypto.cjs` |
| **自動備份排程 (Cron)** | **僅有文件規劃** | R10 已完成排程時程規劃，尚未配置實體定時任務 |
| **雲端異地儲存 (R2/S3)** | **僅有文件規劃** | R10 已完成架構規劃，尚未建立 Cloudflare R2 Bucket 或注入上傳憑證 |
| **失敗告警與監控 Webhook** | **僅有文件規劃** | R10/R13 規劃，尚未串接通知端點 |

---

### R14-A-05｜Render 與 Supabase 部署準備盤點

依據代碼庫與歷史文件查核，正式部署所需參數全量盤點如下：

#### 1. 前端服務（Render Static Site）
- **服務名稱**：`code-to-know-web`
- **倉庫根目錄**：`frontend`
- **構建指令**：`npm install && npm run build`
- **發布目錄**：`frontend/dist`
- **環境變數需求**：`VITE_API_URL`（值需為 Render 後端網址，如 `https://code-to-know-backend.onrender.com/api`）
- **路由重寫**：`/* -> /index.html`（SPA 必備）

#### 2. 後端服務（Render Web Service）
- **服務名稱**：`code-to-know-backend`
- **倉庫根目錄**：`backend`
- **運行環境**：Node.js（建議 Node 22+）
- **構建指令**：`npm install && npm run build`
- **啟動指令**：`npm run start`（執行 `dist/server.js`）
- **健康檢查路徑**：`/api/health`（回傳 HTTP 200 與 `{ status: 'healthy', database: { status: 'connected' } }`）
- **生產環境變數注入清單**：
  - `NODE_ENV=production`
  - `PORT=10000`（Render 預設）
  - `DATABASE_URL`: `postgresql://app_runtime.ypibmyfxfhsyfdwxprpi:[SECURE_PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require`
  - `SESSION_SECRET`: 長度 >= 32 字元之高強度隨機密鑰
  - `CORS_ORIGIN`: `https://code-to-know-web.onrender.com`（嚴格限定前端 HTTPS 來源）
  - `FRONTEND_URL`: `https://code-to-know-web.onrender.com`
  - `BCRYPT_ROUNDS`: `12`
  - `EMAIL_FROM`: `noreply@codetoknow.edu`

#### 3. 平台免費方案限制與影響因應
- **Render 15 分鐘休眠**：訪客於休眠後造訪將面臨約 50 秒冷啟動延遲。
- **Render 750 小時配額**：帳戶每月 750 小時僅夠單一服務常駐。前端為靜態站點不計入小時數，後端服務應避免額外開啟未使用的多餘服務。
- **Supabase 7 天休眠**：長期無造訪將暫停資料庫。上線後透過正規維運與真實流量保持運作，禁止使用偽造 Query 保活。

---

## 三、結論與驗收查驗

1. 本次盤點完整梳理了 R14 後續所需的全部檔案、環境相依性與授權卡關點。
2. 確立了「先本機獨立準備，後授權雲端操作」的防禦性順序。
3. 產出之配套變更矩陣將嚴格指導 R14-B 及後續實施步驟。
