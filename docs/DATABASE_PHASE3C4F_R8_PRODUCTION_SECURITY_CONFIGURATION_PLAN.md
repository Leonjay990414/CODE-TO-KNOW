# CODE TO KNOW｜PHASE 3C-4F-R8
# 正式環境安全設定與資料庫權限規劃規格書

> **規劃日期**：2026-11-09  
> **適用專案**：CODE TO KNOW（碼上學）  
> **文件性質**：100% 唯讀盤點與安全架構規範（零正式操作、零憑證注入、零雲端修改）  
> **審查結論**：**PASS**（正式環境規格完整釐清，機密與連線架構安全鎖定）

---

## 一、執行前 Git 與環境狀態

### 1. Git 版本控制審查
- **Repository**：`Leonjay990414/CODE-TO-KNOW`
- **Branch**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **工作區狀態**：維持所有未暫存/未追蹤之專案歷史文件，無任何未授權之 commit、push、reset 或 clean。

### 2. 容器運行狀態與隔離確認
| 容器名稱 | 映像檔版本 | 內部埠口 | 宿主機埠口 | 運行狀態 | 角色定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine` | 5432 | `127.0.0.1:5432` | Up (healthy) | 本機開發資料庫（完全未連線、零寫入） |
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (PG 17.11) | 5432 | `127.0.0.1:5433` | Up (healthy) | 隔離還原驗收沙盒（已凍結為唯讀） |

### 3. Supabase 雲端環境隔離聲明
- 本階段為純粹程式碼設定與架構盤點，**100% 零連線、零讀取、零修改** Supabase 雲端生產庫。

---

## 二、正式環境整體架構

CODE TO KNOW 正式環境採「前後端分離 + 雲端託管資料庫」之現代雲原生架構：

```
使用者瀏覽器 (Web Client)
       │
       ▼ (HTTPS / WSS)
┌─────────────────────────────────────────────────────────┐
│ 前端託管：Render Static Site (code-to-know-web)         │
│ - Root Directory: frontend                             │
│ - Build Command: npm install && npm run build          │
│ - Publish Directory: frontend/dist                     │
└─────────────────────────────────────────────────────────┘
       │
       ▼ (HTTPS API REST / Cookie with HttpOnly + Secure)
┌─────────────────────────────────────────────────────────┐
│ 後端 API：Render Web Service (code-to-know-api)         │
│ - Root Directory: backend                              │
│ - Build Command: npm install && npm run build          │
│ - Start Command: npm start (node dist/server.js)       │
│ - Port: 4000 (或由 Render 動態指派 $PORT)               │
└─────────────────────────────────────────────────────────┘
       │
       ├────────────────────────────────────────┐
       │ (Runtime 業務查詢 / Session Pooler)     │ (Migration 遷移 / Direct)
       ▼                                        ▼
┌─────────────────────────────────────────────────────────┐
│ 資料庫服務：Supabase PostgreSQL 17 (code-to-know-prod)   │
│ - Project Ref: ypibmyfxfhsyfdwxprpi (Sydney Region)     │
│ - Runtime: aws-0-ap-southeast-2.pooler.supabase.com     │
│ - Port: 5432 (Session Pooler) 或 6543 (Tx Pooler)      │
│ - TLS: 強制啟用 TLS 1.3 (sslmode=require)               │
└─────────────────────────────────────────────────────────┘
```

---

## 三、正式環境變數完整盤點清單

經清查 `backend/src/config/env.ts`、`database.ts`、`db-validation.ts`、`frontend/src/services/api.ts` 及各模組原始碼，**僅列出程式碼實際使用或確實需要之變數**，絕不虛構未實現之變數：

### 1. 後端環境變數 (Backend Environment Variables)

| 變數名稱 | 引用位置 | 用途說明 | 必要性 | 正式環境預期設定範例 | 機密等級 | 部署平台設定需求 |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **`NODE_ENV`** | `config/env.ts`<br>`config/database.ts` | 執行環境模式切換，觸發嚴格生產安全性檢驗 | **必要** | `production` | 公開 | **Render Web Service** |
| **`PORT`** | `config/env.ts`<br>`server.ts` | 後端伺服器監聽之 HTTP 連接埠 | 選用 (有預設) | `4000` (或由 Render 自行注入) | 內部 | **Render 自動提供** |
| **`DATABASE_URL`** | `config/env.ts`<br>`config/database.ts` | 後端 Runtime 連線 Supabase 之連線字串 | **必要** | `postgresql://postgres.ypibmyfxfhsyfdwxprpi:[MASKED]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require` | **極高 (Secret)** | **Render Secret Env** |
| **`DIRECT_URL`** | `config/db-validation.ts`<br>`prisma.config.ts` | 供 Prisma CLI 執行遷移時的直連或 Session Pooler 字串 (Port 5432) | **必要 (部署/CI)** | `postgresql://postgres:[MASKED]@db.ypibmyfxfhsyfdwxprpi.supabase.co:5432/postgres?sslmode=require` | **極高 (Secret)** | **CI/CD 或 本地安全終端** |
| **`SESSION_SECRET`** | `config/env.ts`<br>`app.ts` | Cookie 簽章與 Session 防偽金鑰 (生產環境嚴格要求 >= 32 字元) | **必要** | 至少 32 位元高熵 CSPRNG 隨機字串 | **極高 (Secret)** | **Render Secret Env** |
| **`BCRYPT_ROUNDS`** | `config/env.ts`<br>`utils/password.ts` | 使用者密碼雜湊運算強度 (預設 12，提供足夠運算成本防禦撞庫) | 選用 (有預設) | `12` | 內部 | 可於 Render 配置 |
| **`CORS_ORIGIN`** | `config/env.ts`<br>`app.ts` | 允許跨來源請求之 Origin (生產環境必須為 https，不可帶 path) | **必要** | `https://code-to-know-web.onrender.com` (或自訂網域) | 內部 | **Render Secret Env** |
| **`FRONTEND_URL`** | `config/env.ts`<br>`email.provider.ts` | 前端網站基底網址 (用於重設密碼與驗證信導引網址) | **必要** | `https://code-to-know-web.onrender.com` (或自訂網域) | 內部 | **Render Secret Env** |
| **`COOKIE_DOMAIN`** | `config/env.ts`<br>`middleware/csrf.ts` | Cookie 作用域，跨子網域共享時設定 (如 `.codetoknow.edu`) | 選用 | 未使用自訂網域時留空，或配置自訂網域根網域 | 內部 | 視網域架構於 Render 配置 |
| **`EMAIL_FROM`** | `config/env.ts` | 系統寄件者信箱地址 | 選用 (有預設) | `noreply@codetoknow.edu` | 公開 | 可於 Render 配置 |

> **重要備註（關於郵件變數 `SMTP_*`）**：  
> 經實質原始碼審查，目前 [`email.provider.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/services/email.provider.ts) 在 `NODE_ENV === 'production'` 下預設載入 `DisabledEmailProvider`（服務暫時停用，不發送真信），原始碼中**並未讀取或實作** `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`。依「不虛構不存在設定」之原則，本階段不列入必要正式環境變數，待後續正式串接郵件服務商（如 Resend / SendGrid / SMTP）時再行擴充。

### 2. 前端環境變數 (Frontend Environment Variables)

| 變數名稱 | 引用位置 | 用途說明 | 必要性 | 正式環境預期設定範例 | 機密等級 | 部署平台設定需求 |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| **`VITE_API_URL`** | `frontend/src/services/api.ts` | 前端 API Client 請求後端之基底端點 | **必要** | `https://code-to-know-api.onrender.com/api` | 公開 | **Render Static Site Build Env** |

---

## 四、資料庫權限最小化審查與矩陣規劃

### 1. 現有架構審查
- 目前 Supabase 專案建立於 Free Tier，原廠預設提供單一主要連線身分：`postgres`（透過 Pooler 時帳號為 `postgres.ypibmyfxfhsyfdwxprpi`）。
- 該預設帳號在資料庫內部擁有 Database Owner 權限。

### 2. 正式環境權限矩陣規劃
為落實最小權限原則（Principle of Least Privilege），規劃三層身分分離模型：

| 身分角色 (Identity) | 建議帳號名稱 | 預期持有權限 (Privileges) | 適用使用情境 | 存取控制方式 |
| :--- | :--- | :--- | :--- | :--- |
| **Application Runtime User** | `app_runtime` | `CONNECT` 至 `postgres`<br>`USAGE` 於 `public` Schema<br>`SELECT, INSERT, UPDATE, DELETE` 於業務資料表<br>`USAGE, SELECT` 於 Sequences<br>**嚴禁 `CREATE, DROP, ALTER, TRUNCATE`** | 正式 Web API 伺服器日常業務運作 | 透過 Connection Pooler (Port 5432/6543) 連線，無法修改資料庫結構 |
| **Migration CI/CD User** | `migration_admin` | 具備 `public` Schema 之 `CREATE, ALTER, DROP, REFERENCES` 權限<br>`_prisma_migrations` 表之全權管理 | 經核准之部署流程與結構遷移 (Prisma Deploy) | 僅於 CI/CD Pipeline 或專責 DBA 維護視窗執行，平時不掛載於 Web API |
| **Database Owner / Superuser** | `postgres` (原廠) | 資料庫擁有者全權限 (SUPERUSER / CREATEDB / CREATEROLE) | 災難復原、擴充功能啟用、低階備份 | 嚴禁配置於一般 Web 伺服器之環境變數中 |

### 3. 現階段替代方案（Supabase Free Tier 過渡期實務）
由於 Supabase 雲端託管之連線池（Supavisor）預設綁定 `postgres.<project_ref>` 憑證，若專案初期尚未建立獨立 Postgres Role：
- **替代安全對策**：
  1. 運行時期（Runtime）連線字串**絕不賦予任何 DDL 命令**，僅透過 Prisma Client 產生的 DML (Select/Insert/Update/Delete) 操作。
  2. 後端程式啟動時由 `validateCloudRuntimeDatabaseUrl` 硬性鎖定目標與格式。
  3. 將執行遷移之 `DIRECT_URL` 與運行時期之 `DATABASE_URL` 在環境變數層面分離，Web API 服務環境變數中**嚴格禁止注入 `DIRECT_URL`**，避免 Web 服務具有執行 Migration 之權限。

---

## 五、TLS 與連線安全審查

針對正式環境雲端連線之安全機制核查：

1. **強制 TLS 傳輸加密**：
   - 經 [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 驗證，正式環境連線字串必須包含 `sslmode=require` 或 `sslmode=verify-full`。若缺少 SSL 參數或設為 `sslmode=disable`，系統將拒絕啟動。
2. **憑證驗證相容性**：
   - Supabase 官方提供標準 Root CA，Node.js 內建 CA 清單能正常信任 Supabase 之 Let's Encrypt / AWS ACM 憑證。
3. **防止不安全回退**：
   - 原始碼中無任何 `ssl: false` 之正式 fallback；非 production 模式才允許不使用 SSL。
4. **連線字串洩漏防護**：
   - `db-validation.ts`、`env.ts` 與所有錯誤處理中介軟體均已實作敏感字串遮蔽，在拋出 `RUNTIME CONFIG ERROR` 時僅印出違規原因（如 Host、Port、Database 不符），**絕不列印密碼、Token 或 Query String**。
5. **Driver 與 Prisma 轉接器一致性**：
   - 後端使用 `@prisma/adapter-pg` 搭配 `pg.Pool`，Pool 之連線字串統一由 `resolveDatabaseConnectionString()` 產出並校驗，驅動層與 ORM 層行為一致。

---

## 六、Session、Cookie 與 Token 安全架構審查

經對照 R7 審查結論，正式環境之身分驗證防護標準如下：

| 安全維度 | 實作現狀與標準 | 正式環境安全評估 |
| :--- | :--- | :---: |
| **Session Secret** | `config/env.ts` 規範生產環境長度 >= 32 字元且嚴禁包含 `dev-insecure` 字樣 | **COMPLIANT** |
| **HttpOnly Cookie** | `SESSION_COOKIE_NAME` (`code_to_know_session`) 標記 `httpOnly: true`，前端 JavaScript 無法存取 | **COMPLIANT** |
| **Secure Cookie** | 標記 `secure: env.NODE_ENV === 'production'`，正式環境強制僅能透過 HTTPS 傳輸 | **COMPLIANT** |
| **SameSite Cookie** | 統一配置為 `sameSite: 'lax'`，阻絕跨站請求攜帶 Session Cookie，有效防禦 CSRF | **COMPLIANT** |
| **Cookie Domain** | 支援由 `COOKIE_DOMAIN` 動態設定；若前後端處於相同根網域（如 `.codetoknow.edu`）可跨子網域共享 | **COMPLIANT** |
| **CSRF 防護** | 採用 Double-Submit Cookie 架構（`XSRF-TOKEN` 與 `x-csrf-token`），使用時序安全比較 `safeCompare` | **COMPLIANT** |
| **Token 安全儲存** | 資料庫僅存儲 SHA-256 雜湊（`tokenHash`），原始 Token 僅存在於記憶體與使用端 Cookie/URL | **COMPLIANT** |
| **帳號停用即刻失效** | `authenticate` 中介軟體即時比對 `user.status !== 'ACTIVE'` 或 `deletedAt !== null`，即刻拒絕請求 | **COMPLIANT** |
| **過期資料定期清理** | 目前為 On-demand 驗證逾期；**尚缺背景自動清理排程**，已排定於 R9 進行機制規劃 | **PENDING R9** |

---

## 七、Render 與 Supabase 部署需求盤點

### 1. Render 部署平台規範
- **前端 (Static Site)**：
  - **Service 名稱**：`code-to-know-web`
  - **Git Branch**：`main`
  - **Root Directory**：`frontend`
  - **Build Command**：`npm install && npm run build`
  - **Publish Directory**：`frontend/dist`
  - **環境變數需求**：`VITE_API_URL=https://<backend-service-host>/api`
- **後端 (Web Service)**：
  - **Service 名稱**：`code-to-know-api`
  - **Git Branch**：`main`
  - **Root Directory**：`backend`
  - **Build Command**：`npm install && npm run build`
  - **Start Command**：`npm start`
  - **環境變數需求**：`NODE_ENV=production`, `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`, `BCRYPT_ROUNDS=12`

### 2. Supabase 雲端資料庫規範
- **連線模式**：
  - **Runtime Web API**：連線至 Session Pooler (`aws-0-ap-southeast-2.pooler.supabase.com:5432`) 或 Transaction Pooler (`:6543`)。
  - **Schema Migration**：必須連線至 Port 5432（Session Pooler 或 Direct Host），嚴禁使用 Port 6543。
- **TLS 要求**：全連線強制 `sslmode=require`。
- **閒置暫停應對**：Supabase Free Tier 連續 7 天無連線會休眠，上線前需配置心跳排程保持活躍。

---

## 八、尚未完成事項與正式切換前必要條件

### 1. 切換前必要前置作業
1. **正式金鑰產生**：使用 CSPRNG 產生長度 >= 32 字元的高強度 `SESSION_SECRET`。
2. **正式環境變數注入**：於 Render 後台設定 `code-to-know-api` 與 `code-to-know-web` 之正式變數。
3. **第二份異地備份存檔**：將已驗證之 `code_to_know_supabase_prod.dump` 備份至加密 Google Drive 或離線硬碟。
4. **過期 Session 清理機制**：建立定期清理逾期 Session 與 Token 之維護作業（R9 規劃重點）。

### 2. 正式切換當天操作限制
- **維護視窗宣告**：切換前通知團隊，預留 15~30 分鐘維護時間。
- **零中途 Migration**：切換當天禁止執行未經測試的新 Migration。
- **即時健康檢查**：後端啟動後立即驗證 `/api/health`。
- **回滾機制備便**：若發生連線異常或啟動失敗，立即將 Render 環境變數指回維護模式。

---

## 九、最終判定

```
======================================================================
  PHASE 3C-4F-R8 CONFIGURATION & PERMISSION AUDIT VERDICT: [ PASS ]
======================================================================
```

**核決意見**：  
正式環境變數清單已精確盤點，無任何多餘或虛構之設定；權限分離模型、TLS 安全連線、Cookie / Session / Token 防禦機制及 Render / Supabase 部署參數皆已完備成冊，符合生產部署之安全規格。
