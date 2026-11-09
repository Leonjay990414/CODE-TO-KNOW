# CODE TO KNOW｜PHASE 3C-4F-R11
# PostgreSQL 最終上線準備總結與全鏈路封關評估報告

> **審查日期**：2026-11-09  
> **評估目標**：整合 Phase 3C-4F-R1 至 R10 所有資料庫審查成果，進行最終全鏈路封關評估  
> **審查性質**：100% 唯讀審查、文件查核與技術風險評估（零資料庫寫入、零雲端操作、零排程部署）  
> **最終判定**：**CONDITIONAL GO**（核心架構與安全性全數驗證通過，需完成指定前置工作後方可正式切換）

---

## 一、執行前 Git 與環境保全狀態

### 1. Git 版本控制狀態
- **Repository**：`Leonjay990414/CODE-TO-KNOW`
- **Branch**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **狀態**：所有歷史未暫存/未追蹤之專案文件完整保留，無任何未授權之 commit、push、reset 或 clean。

### 2. 容器運行狀態與隔離確認
| 容器名稱 | 映像檔版本 | 內部埠口 | 宿主機埠口 | 運行狀態 | 角色定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine` | 5432 | `127.0.0.1:5432` | Up (healthy) | 本機開發資料庫（完全未連線、零寫入） |
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (PG 17.11) | 5432 | `127.0.0.1:5433` | Up (healthy) | 隔離還原驗收沙盒（已凍結為唯讀） |

### 3. Supabase 雲端環境隔離聲明
- 全程審查未對 Supabase 雲端資料庫發起任何連線或寫入，隔離度為 **100%**。

---

## 二、R1～R10 全階段成果與證據盤點

經對 `docs/` 與程式庫全面查驗，所有階段之正式報告皆完整存在，具備可驗證之實測數據與程式碼依據，無任何憑空宣稱：

| 階段代號 | 核心任務 | 正式交付文件 | 實測結果 | 驗收證據與結論 |
| :---: | :--- | :--- | :---: | :--- |
| **R1** | PG17 控制性寫入與角色注入 | [DATABASE_PHASE3C4F_R1_CONTROLLED_WRITE_INTEGRATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R1_CONTROLLED_WRITE_INTEGRATION_AUDIT.md) | **PASS** | 注入 3 筆測試帳號與 3 角色，揭露 ESM 模組載入順序問題 |
| **R2** | PG16 非預期寫入唯讀鑑識 | [DATABASE_PHASE3C4F_R2_PG16_UNEXPECTED_WRITE_FORENSIC_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R2_PG16_UNEXPECTED_WRITE_FORENSIC_AUDIT.md) | **PASS** | 查明 R1 連線漂移至 PG16 之根因，清點出 3 筆帳號與 20 筆關聯資料 |
| **R3** | PG16 測試資料精準清理 | [DATABASE_PHASE3C4F_R3_PG16_TEST_DATA_CLEANUP_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R3_PG16_TEST_DATA_CLEANUP_AUDIT.md) | **PASS** | 單一交易行鎖 (`FOR UPDATE`) 精確清理 20 筆關聯資料，PG16 完全復原 |
| **R4** | PG17 測試入口硬性隔離改造 | [DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md) | **PASS** | 建立四重防護架構 (Guard 1~4) 與專用入口 `test_pg17_readonly.cjs` |
| **R5** | 獨立安全複核與實例斷言 | [DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md) | **PASS** | 驗證 `appPrisma === testPrisma`，負向測試 100% 阻斷非授權目標 |
| **R6** | PG17 受控寫入與交易驗收 | [DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md) | **PASS** | Prisma 寫入、更新、P2002/P2003 約束、Tx Commit/Rollback 全數通過並精確清理 |
| **R7** | 資料庫最終就緒唯讀審查 | [DATABASE_PHASE3C4F_R7_FINAL_DATABASE_READINESS_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R7_FINAL_DATABASE_READINESS_AUDIT.md) | **CONDITIONAL GO** | 備份 SHA-256 吻合、結構 37 表完全對齊，核定具備切換前置條件 |
| **R8** | 正式環境安全設定規格化 | [DATABASE_PHASE3C4F_R8_PRODUCTION_SECURITY_CONFIGURATION_PLAN.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R8_PRODUCTION_SECURITY_CONFIGURATION_PLAN.md)<br>[DATABASE_PHASE3C4F_R8_PRODUCTION_CUTOVER_CHECKLIST.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R8_PRODUCTION_CUTOVER_CHECKLIST.md) | **PASS** | 盤點正式變數清單，制定權限分離矩陣、TLS 與 Cookie 防禦規範 |
| **R9** | Session/Token 清理機制規劃 | [DATABASE_PHASE3C4F_R9_SESSION_TOKEN_CLEANUP_DESIGN.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R9_SESSION_TOKEN_CLEANUP_DESIGN.md)<br>[DATABASE_PHASE3C4F_R9_SESSION_TOKEN_CLEANUP_CHECKLIST.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R9_SESSION_TOKEN_CLEANUP_CHECKLIST.md) | **PASS** | 釐清邏輯失效與實體清理差異，確立 7 天緩衝期與外部排程觸發架構 |
| **R10** | 異地備份與自動排程規劃 | [DATABASE_PHASE3C4F_R10_BACKUP_ARCHITECTURE_PLAN.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R10_BACKUP_ARCHITECTURE_PLAN.md)<br>[DATABASE_PHASE3C4F_R10_BACKUP_SECURITY_CHECKLIST.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R10_BACKUP_SECURITY_CHECKLIST.md) | **PASS** | 盤點現有備份資產，規劃 $0 成本 GitHub Actions + Cloudflare R2 備份架構 |

---

## 三、資料庫結構與 Migration 最終評估

### 1. 資料庫實例定位與版本區隔
- **本機開發資料庫 (PG16)**：Docker 容器 `code_to_know_postgres`（PostgreSQL 16.15-alpine，連接埠 5432），專供本機日常開發測試。
- **本地還原驗收沙盒 (PG17)**：Docker 容器 `code_to_know_pg17_restore_sandbox`（PostgreSQL 17.11-alpine，連接埠 5433），專供驗證雲端備份之還原與相容性。
- **正式雲端資料庫 (Supabase)**：`code-to-know-prod`（PostgreSQL 17.11，Sydney 區域），供未來生產環境運行。

### 2. 結構物件計數與驗證依據
> **重要說明**：以下數據來源為 **2026-11-09 於本機 PG17 沙盒（自正式雲端備份還原）執行之唯讀 SQL 探針實測數據**，正式環境即時數據依安全限制待切換當天進行最終唯讀核驗。

- **資料表總數 (Base Tables)**：**37 張**（36 張業務表 + 1 張 `_prisma_migrations`）。
- **外鍵約束 (Foreign Keys)**：**47 組**（全數通過關聯校驗，0 組孤立外鍵）。
- **索引總數 (Total Indexes)**：**133 個**。
- **唯一約束 / 唯一索引 (Unique Constraints)**：**64 個**。
- **Migration 紀錄狀態**：
  - PG17 具備 2 筆遷移：`20261103000000_init` 與 `20261108000000_add_business_models`。
  - `rolled_back_at` 皆為 null，`applied_steps_count = 1`，0 筆失敗或未完成遷移。
  - PG16 之 3 筆歷史差異已於 R5 查明：源於 2026-11-08 本機開發時期一次 UTF-8 BOM 語法錯誤之回滾歷史紀錄，兩者最終實體 DDL 完全對齊。

---

## 四、資料庫安全性最終評估

### 1. 連線安全與環境隔離 (Connection Security)
- **連線字串硬性檢驗**：[`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 於應用層啟動時嚴格檢查：
  - 正式環境 `DATABASE_URL` 必須指向 Supabase Session Pooler (`aws-0-ap-southeast-2.pooler.supabase.com`)。
  - 帳號格式必須包含專案參照碼 `postgres.ypibmyfxfhsyfdwxprpi`。
  - 連線必須顯式指定 `sslmode=require` 或 `verify-full`。
  - 遷移連線 `DIRECT_URL` 必須使用 Port 5432，嚴禁使用 Transaction Pooler Port 6543。
- **敏感資訊脫敏**：所有錯誤處理中介軟體均已實作敏感字串遮蔽，連線異常時不洩漏密碼與 Query String。

### 2. 資料庫權限現況 (Permissions Reality Check)
- **現狀事實**：
  - 本地 PG17 沙盒使用者 `codetoknow_restore` 設為非 SUPERUSER、非 CREATEDB、非 CREATEROLE，遵循最小權限。
  - 雲端 Supabase 目前連線身分為原廠預設之 `postgres` 帳號。
  - R8 規劃之「三層身分分離矩陣」（`app_runtime`、`migration_admin`、`postgres`）目前屬於**架構規劃階段**，**尚未在 Supabase 正式雲端執行角色建立與權限拆分**。
- **防禦補償**：在尚未拆分雲端角色前，由後端程式層硬性封鎖 DDL 與非法連線字串。

### 3. 身分驗證、Session 與 Token 防禦
- **密碼安全**：採用 `bcryptjs`，正式環境強制 `BCRYPT_ROUNDS=12`，密碼強度驗證（>= 8 字元、英數混合）。
- **Session Cookie**：`httpOnly: true`、`secure: true` (HTTPS)、`sameSite: 'lax'`。
- **CSRF 防護**：Double-Submit Cookie 架構（`XSRF-TOKEN` 與 `x-csrf-token`），時序安全比對。
- **憑證儲存安全**：Session Token、EmailVerificationToken、PasswordResetToken 於資料庫均**僅存儲 SHA-256 雜湊 (`tokenHash`)**，絕無明文落盤。
- **即刻失效機制**：使用者被標記 `SUSPENDED`、`DISABLED` 或刪除時，中介軟體即刻拒絕請求。
- **逾期實體清理**：R9 已完成 7 天緩衝期與批次刪除設計，目前**尚未正式實作排程**。

---

## 五、正式環境部署準備度盤點 (Deployment Readiness)

依據原始碼實查與 R8 規劃，將所有正式環境設定明確歸類：

| 評估項目 | 部署平台 / 設定位置 | 當前狀態分類 | 說明與現狀證據 |
| :--- | :--- | :---: | :--- |
| **前端服務架構** | Render Static Site (`code-to-know-web`) | **已由程式碼確認** | `frontend/package.json`，建置指令 `tsc && vite build`，目錄 `frontend/dist` |
| **後端服務架構** | Render Web Service (`code-to-know-api`) | **已由程式碼確認** | `backend/package.json`，啟動指令 `node dist/server.js`，預設埠口 4000 |
| **前端 API URL** | `frontend/src/services/api.ts` | **已由程式碼確認** | 支援由 `VITE_API_URL` 注入，預設 fallback 至本機 4000 |
| **後端環境變數驗證**| `backend/src/config/env.ts` | **已由程式碼確認** | Zod Schema 嚴格校驗 `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL` |
| **Health Check API** | `/api/health` | **已由測試確認** | R3-4 實測通過，回傳 HTTP 200，連線資源正常釋放 |
| **HTTPS 強制要求** | `config/env.ts` | **已由程式碼確認** | 生產模式強制 `CORS_ORIGIN` 與 `FRONTEND_URL` 必須為 `https://` |
| **Session Secret** | `config/env.ts` | **已由程式碼確認** | 生產模式強制長度 >= 32 字元且嚴禁包含 `dev-insecure` |
| **正式環境變數注入**| Render 儀表板後台 | **尚未設定** | 正式 `.env.production` 待上線切換當天由專案管理者注入 |
| **Email 發送能力** | `backend/src/services/email.provider.ts` | **存在風險 / 待串接** | 生產模式目前載入 `DisabledEmailProvider`，無法發送真實信件 |
| **雲端資料庫閒置暫停**| Supabase Free Tier | **存在風險 / 待排程** | 連續 7 天無活動將休眠，需配置定時心跳連線防止暫停 |
| **雲端慢查詢監控** | Supabase 儀表板 | **僅有文件規劃** | 雲端儀表板具備基本指標，告警規則尚未設定 |

---

## 六、備份與災難復原最終評估 (Disaster Recovery Audit)

### 1. 現存備份資產客觀事實
- **實體檔案**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758\code_to_know_supabase_prod.dump`（505,249 Bytes）。
- **SHA-256 數位指紋**：`08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`（100% 吻合）。
- **還原能力驗證**：已於本機 PG17 沙盒完成 100% 結構重建與受控讀寫驗證。
- **異地儲存與自動排程**：**目前尚未建立**（現存備份僅存於本機磁碟，無雲端副本，無定時排程）。

### 2. 備份加密演算法專項審查 (AES-256-CBC vs AES-256-GCM)
- **問題分析**：R10 規劃中提及使用 `openssl enc -aes-256-cbc` 進行加密。經密碼學審查，CBC 模式為**非認證加密 (Unauthenticated Encryption)**，易受填充預言機攻擊 (Padding Oracle) 或位元翻轉攻擊 (Bit-flipping)。雖然 R10 規劃以 SHA-256 驗算，但單純的 SHA-256 缺乏金鑰認證性 (Keyed Integrity)。
- **安全升級建議**：正式實作自動備份加密時，應升級採用 **AES-256-GCM**（具備 AEAD 認證標籤，解密時自動驗證密文完整性與真實性），或採用現代加密工具 **`age`** (Actually Good Encryption)，徹底杜絕密文竄改風險。

### 3. RPO 與 RTO 規劃目標客觀定性
- **RPO <= 24 小時 / RTO < 2 小時**：此為專案之**初步技術規劃目標**，目前尚未部署定時自動備份，故**尚未取得正式 SLA 驗證證據**。

---

## 七、零預算可行性與平台限制評估

專案架構完全依據 $0.00 零預算原則規劃，各項免費平台配額與實務限制如下：

| 平台服務 | 規劃使用之免費配額 | 平台限制與潛在風險 | 專案應對措施 |
| :--- | :--- | :--- | :--- |
| **Supabase (Database)** | Free Plan (500MB 資料庫空間，每週 5GB 頻寬) | **0 天自動備份留存**<br>**連續 7 天無活動自動暫停休眠** | 仰賴獨立外部備份；切換後配置每日定時心跳連線防止休眠。 |
| **Render (Web Hosting)** | Free Plan (1 Web Service + 1 Static Site) | **15 分鐘無流量自動休眠 (Spin-down)**<br>**不支援免費獨立 Cron Job** | 採用外部定時發送 Webhook 喚醒與觸發清理，不使用內部定時器。 |
| **GitHub Actions (CI/CD)**| Free Plan (私有庫每月 2,000 分鐘) | 排程可能存在 15~30 分鐘抖動；免費額度非永久合約保證 | 每日備份約耗 3 分鐘（每月僅需 ~90 分鐘），額度充裕；保留本地手動備份工具。 |
| **Cloudflare R2 (Storage)**| Free Tier (每月 10GB 存儲，0 出流量費) | 超過 10GB 需付費 (專案備份僅 500KB，可存萬份) | 嚴格執行 7 天保留政策，自動刪除過期物件。 |

---

## 八、最終風險登錄表 (Risk Register)

| 風險項目 | 說明與影響 | 風險等級 | 判定理由與緩解對策 |
| :--- | :--- | :---: | :--- |
| **異地備份缺失** | 備份檔案目前僅存於本地磁碟，未建立雲端副本 | **HIGH** | 本地硬體毀損可能導致備份遺失。**緩解：切換前手動上傳一份至 Google Drive**。 |
| **Free Tier 閒置休眠** | Supabase 7 天無連線暫停；Render 15 分鐘冷啟動 | **HIGH** | 評審或訪客首存取可能延遲 30~50 秒。**緩解：建立定期心跳端點保持喚醒**。 |
| **DB 最小權限尚未落盤** | 正式環境目前仍為 `postgres` 帳號，未實體拆分角色 | **MEDIUM** | 應用層有嚴格 DDL 阻斷，但底層角色權限過大。**緩解：初期維持程式層防護，未來評估拆分**。 |
| **Email 發送能力停用** | 目前載入 `DisabledEmailProvider`，無法發送驗證信 | **MEDIUM** | 正式使用者無法收到驗證信與重設信。**緩解：後續階段串接真實 SMTP / Resend**。 |
| **正式環境變數尚未配置**| Render 平台的正式變數尚未注入 | **MEDIUM** | 正常前置狀態，切換當天依 R8 清單手動配置即可。 |
| **Session 逾期實體堆積**| 逾期 Session/Token 尚未實作自動刪除排程 | **LOW** | 邏輯已安全攔截，僅為磁碟佔用問題，不影響安全性。 |
| **備份 CBC 模式弱點** | R10 規劃之 CBC 模式缺乏 AEAD 完整性認證 | **LOW** | 實作時升級為 AES-256-GCM 或 `age` 即可消除。 |
| **TLS 憑證驗證行為** | 正式環境需確保 driver 強制啟用 SSL | **LOW** | `db-validation.ts` 已在程式層硬性鎖定 `sslmode=require`。 |
| **監控告警尚未建立** | 雲端資料庫無自動慢查詢告警 | **LOW** | 上線初期流量小，待正式維運階段補齊。 |

---

## 九、正式上線 GO / NO-GO 判定

```
======================================================================
  PHASE 3C-4F-R11 FINAL GATE ASSESSMENT VERDICT: [ CONDITIONAL GO ]
======================================================================
```

### 核決意見：
資料庫架構設計、Prisma 37 張資料表映射、47 組外鍵關聯、133 個索引、唯讀查詢相容性、受控寫入與交易回滾（Commit / Rollback）以及本地沙盒還原驗證，已獲得 **100% 完整之測試證據支持**，本機隔離體系與防誤連機制運作完美。  

然而，依據嚴謹之生產發布標準，正式環境尚有數項前置作業待落實（異地備份手動存檔、Render 正式環境變數注入、維護視窗設定），因此**嚴格判定為 `CONDITIONAL GO`**（**具備進入切換排程之條件，待完成指定前置檢查後正式放行**）。

---

## 十、後續建議執行路線圖 (Roadmap)

```
[當前狀態: R11 封關評估完成]
              │
              ▼
【階段一：切換日前置準備】
  1. 手動將已驗證之 dump 檔上傳至安全異地冷存儲 (Google Drive / 離線硬碟)。
  2. 產生長度 >= 32 字元之正式高強度 SESSION_SECRET。
  3. 訂定正式切換時段 (預留 15~30 分鐘維護窗口)。
              │
              ▼
【階段二：切換日正式部署】
  1. 於 Render 配置 code-to-know-api 與 code-to-know-web 之正式環境變數。
  2. 啟動後端 Web Service，驗證 /api/health 健康檢查。
  3. 前端連線驗收，確認登入、註冊與各項業務流程正常。
              │
              ▼
【階段三：正式維運與長期強化 (Phase 3C-4G)】
  1. 實作 R9 外部排程觸發 Session / Token 定期清理機制。
  2. 建立 R10 GitHub Actions + Cloudflare R2 自動化夜間加密備份管線。
  3. 串接正式 Email Provider (如 Resend / SendGrid)，啟用真實郵件發送。
  4. 配置定期 Ping 心跳監控，防止 Supabase 閒置暫停。
```
