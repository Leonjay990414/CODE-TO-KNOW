# CODE TO KNOW｜PHASE 3C-4F-R12
# PostgreSQL 正式切換前置條件複核與風險改善計畫書

> **規劃日期**：2026-11-09  
> **適用目標**：CODE TO KNOW（碼上學）正式上線切換前置核對與風險緩解  
> **文件性質**：100% 唯讀審查、歷史結論消解與改善技術規劃（零實際切換、零雲端操作、零程式修改）  
> **審查結論**：**CONDITIONAL GO**（架構準備度成熟，前置條件與風險改善計畫完備，待授權後依順序執行）

---

## 一、執行前 Git 與環境保全狀態

### 1. Git 版本控制狀態
- **Repository**：`Leonjay990414/CODE-TO-KNOW`
- **Branch**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **工作區狀態**：所有歷史未暫存/未追蹤之專案文件完整保留，無任何未授權之 commit、push、reset 或 clean。

### 2. 容器運行狀態與隔離確認
| 容器名稱 | 映像檔版本 | 內部埠口 | 宿主機埠口 | 運行狀態 | 角色定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine` | 5432 | `127.0.0.1:5432` | Up (healthy) | 本機開發資料庫（完全未連線、零寫入） |
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (PG 17.11) | 5432 | `127.0.0.1:5433` | Up (healthy) | 隔離還原驗收沙盒（已凍結為唯讀） |

### 3. Supabase 雲端隔離確認
- 全程審查未對 Supabase 雲端資料庫發起任何連線，保持 100% 網路與連線隔離。

---

## 二、R1～R11 歷史結論一致性複核 (Historical Consistency Audit)

經重新逐項審閱 R1 至 R11 所有報告，釐清 8 項關鍵判定差異，建立客觀之**歷史報告狀態差異表**：

| 檢核議題 | 歷史報告記載 | R12 審查核實與結論 | 狀態與消解說明 |
| :--- | :--- | :--- | :---: |
| **1. R8 PARTIAL PASS vs R11 PASS 是否矛盾？** | R8 評級為 PASS，但內文多項切換條件標為 PARTIAL PASS；R11 摘要表標為 PASS。 | **無實質矛盾**。R8 之 PASS 代表「該階段設定規格書與清單文件已編制完成」；內文之 PARTIAL PASS 代表「線上實體環境變數與角色尚未切換注入」。兩者屬不同評估維度。 | **已釐清對齊** |
| **2. TLS 憑證驗證是否已實際確認？** | R8/R11 記錄 TLS 支援 `verify-full` 與 `sslmode=require`。 | **部分確認**。備份工具 `run_supabase_backup.ps1` 確實在 Docker 中實測通過 `verify-full` (Root CA 比對)；但在後端 Node.js Runtime 中，目前連線字串僅要求 `sslmode=require`（加密傳輸，未強制本機 CA 校驗）。 | **區隔標記** |
| **3. 正式資料庫最小權限是否已完成？** | R8 規劃了三層角色分離矩陣。 | **尚未完成**。本機沙盒已使用受限帳號，但雲端 Supabase 目前連線仍為預設之 `postgres` 帳號，角色分離尚待線上實施。 | **列為待改善** |
| **4. R9 清理機制是否只有規劃尚未實作？** | R9 完成架構與測試案例規劃。 | **確認純屬規劃，零程式碼實作**。目前後端無清理端點或定時服務，過期 Session/Token 僅在記憶體按需拒絕。 | **客觀確認** |
| **5. R10 異地備份是否僅有本機備份？** | R10 規劃了 GitHub Actions + R2。 | **確認目前僅有本機備份**。實體檔案僅存於 `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS`，尚無雲端副本。 | **客觀確認** |
| **6. R10 AES-256-CBC 是否仍未改善？** | R10 提出 CBC 模式，R11 建議 GCM。 | **已確認弱點，正式列入改善計畫**。CBC 缺乏 AEAD 認證，本次 R12 正式規範升級為 **AES-256-GCM** 或 **`age`**。 | **升級規範** |
| **7. RPO / RTO 是否仍為規劃目標？** | R10 提出 RPO <= 24h, RTO < 2h。 | **確認純屬規劃目標**。尚未進行線上災難演練，不得宣稱為已達成之合約 SLA。 | **客觀確認** |
| **8. 正式資料庫已建立等待切換是否有證據？** | R11 稱雲端資料庫已就緒。 | **有充分證據支持**。`PHASE3C4A_R2` 遷移報告與 `PHASE3C4C_R3` 備份報告（505KB dump, 926 TOC）證明雲端 36 張業務表已於 2026-11-08 部署就緒。 | **證據確鑿** |

---

## 三、正式資料庫目前狀態釐清

依據現有文件與歷史稽核紀錄，正式環境實體狀態客觀認定如下：

1. **Supabase 雲端專案**：**已建立**（Project: `code-to-know-prod`, Ref: `ypibmyfxfhsyfdwxprpi`, AWS Sydney 區域）。
   - *證據*：`docs/DATABASE_PHASE3A_SUPABASE_ARCHITECTURE.md`
2. **PostgreSQL 實例狀態**：**已初始化**（PostgreSQL 17.11 運作中）。
   - *證據*：`docs/DATABASE_PHASE3C4C_R3_CLOUD_BACKUP_INTEGRITY_VERIFICATION.md`
3. **雲端 Migration 狀態**：**已成功套用**（2 筆遷移：`20261103000000_init` 與 `20261108000000_add_business_models`）。
   - *證據*：`docs/DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md`
4. **Render 連線狀態**：**尚未連線**（Render 後端目前未配置生產 `DATABASE_URL`，處於預設或離線狀態）。
   - *證據*：`backend/src/config/env.ts` 與 `docs/DATABASE_PHASE3C4F_R8_PRODUCTION_SECURITY_CONFIGURATION_PLAN.md`
5. **雲端業務資料筆數**：**目前為 0 筆**（純淨資料表結構，無真實使用者資料）。
   - *證據*：`docs/DATABASE_PHASE3C4B_BACKUP_AND_RESTORE_STRATEGY.md`
6. **專案生命週期定位**：**正式切換前置準備階段 (Pre-Cutover Stage)**。

---

## 四、資料庫最小權限改善計畫 (Least Privilege Remediation Plan)

針對目前應用程式連線仍可能依賴 `postgres` 帳號之潛在風險，規劃三層角色分離實作方案：

### 1. 角色定義與權限矩陣
```sql
-- 1. 應用程式 Runtime 帳號 (DML 最小權限)
CREATE ROLE app_runtime WITH LOGIN PASSWORD 'STRONG_APP_PASSWORD_HERE';
GRANT CONNECT ON DATABASE postgres TO app_runtime;
GRANT USAGE ON SCHEMA public TO app_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_runtime;

-- 2. 結構遷移專用帳號 (DDL 遷移權限)
CREATE ROLE migration_admin WITH LOGIN PASSWORD 'STRONG_MIGRATE_PASSWORD_HERE';
GRANT CONNECT ON DATABASE postgres TO migration_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO migration_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO migration_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO migration_admin;

-- 3. 唯讀稽核帳號 (ReadOnly 審查專用)
CREATE ROLE readonly_auditor WITH LOGIN PASSWORD 'STRONG_AUDIT_PASSWORD_HERE';
GRANT CONNECT ON DATABASE postgres TO readonly_auditor;
GRANT USAGE ON SCHEMA public TO readonly_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_auditor;
```

### 2. 應用程式禁止操作與相容性分析
- **禁止 `app_runtime` 操作**：`DROP TABLE`、`ALTER TABLE`、`TRUNCATE`、`CREATE EXTENSION`、`GRANT`、`REVOKE`。
- **Prisma 相容性**：Prisma Client 在應用層僅產出 `SELECT`、`INSERT`、`UPDATE`、`DELETE` 及交易命令，**絕不執行 DDL**。因此實施 `app_runtime` 權限分離**100% 不會破壞既有後端業務功能**。
- **遷移工具相容性**：`prisma migrate deploy` 命令使用獨立的 `DIRECT_URL`（連線至 `migration_admin`，連接埠 5432），專門負責 DDL 結構更新。
- **切換安全防線**：切換當天若尚未在 Supabase 執行上述 SQL，後端程式碼內建之 [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 仍提供第一層 Host/Port/SSL 阻斷。

---

## 五、TLS 與連線安全深度複核

### 1. `sslmode=require` vs `sslmode=verify-full` 技術差異
- **`sslmode=require` (目前 Runtime 規範)**：
  - 加密通訊封包，防範網路監聽。
  - **局限**：Node.js `pg` driver 預設不比對憑證發行者 CA 與主機名稱 SAN，若本機 DNS 被惡意污染，無法絕對防禦中間人攻擊 (MITM)。
- **`sslmode=verify-full` (目前備份工具規範)**：
  - 加密通訊封包，且強制比對指定之 Root CA 憑證 (`supabase-root.crt`) 與主機 SAN。
  - **防護**：徹底杜絕 DNS 劫持與中間人偽造。

### 2. 改善與配置指引
- **備份腳本**：維持 `verify-full`，確保資料庫匯出時身分絕對真實。
- **Runtime 連線**：正式上線初期採用 `sslmode=require`（由 Supabase 官方 Pooler 支援）；未來若需升級為 `verify-full`，需在 Docker 或 Render 環境掛載 Root CA 檔案並於 `pg.Pool` 傳入 `ca` 參數。

---

## 六、備份安全改善計畫 (Backup Hardening Plan)

### 1. 加密演算法升級：全面捨棄 CBC，規範採用 GCM 或 `age`
- **問題回顧**：CBC 模式缺乏認證加密（AEAD），存在填充攻擊與位元翻轉風險。
- **改善方案**：未來自動備份管線一律升級為 **AES-256-GCM** 或現代檔案加密工具 **`age`**：
  ```bash
  # 方案 A: 使用 openssl AES-256-GCM
  openssl enc -aes-256-gcm -pbkdf2 -in db.dump -out db.dump.enc -pass pass:$BACKUP_KEY
  
  # 方案 B: 使用 age 工具 (最佳現代實務)
  age -r $RECIPIENT_PUBKEY -o db.dump.age db.dump
  ```
- **雙重驗證機制**：
  1. 未加密 Dump 計算 SHA-256（驗證傾印內容完整性）。
  2. 加密後檔案具備 GCM AEAD 認證標籤（驗證密文未遭竄改）。

### 2. 金鑰與異地存儲隔離
- 加密金鑰嚴禁存於儲存備份檔案之同一個 Cloudflare R2 / S3 Bucket。
- 金鑰僅留存於 GitHub Secrets 與 DBA 離線密碼庫。

---

## 七、正式環境部署前置條件分類

將所有正式切換前之工作劃分為四類：

### 分類 A：必須在切換前完成 (Pre-Cutover Mandatory)
1. 產出切換前專屬本機備份，確認 SHA-256 數位指紋無損。
2. 手動將該備份檔案複製一份至第二處異地加密冷存儲（Google Drive / 離線硬碟）。
3. 產生長度 >= 32 字元的高強度 `SESSION_SECRET`。
4. 確定切換維護時段（預留 15~30 分鐘，發布維護通知）。

### 分類 B：切換當天依順序執行 (Cutover Day Sequential Execution)
1. 於 Render 配置 `code-to-know-api` 之生產環境變數 (`DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `FRONTEND_URL`)。
2. 啟動後端，檢驗 `/api/health` 唯讀健康端點回傳 HTTP 200。
3. 於 Render 配置 `code-to-know-web` 之 `VITE_API_URL` 並發布前端。
4. 執行煙霧測試 (Smoke Test)：註冊/登入防護驗證。

### 分類 C：上線後維運改善 (Post-Cutover Enhancements)
1. 實作 R9 外部排程觸發 Session/Token 定期清理機制。
2. 部署 R10 GitHub Actions + Cloudflare R2 自動夜間備份管線。
3. 串接正式 Email Provider（如 Resend / SendGrid）取代 `DisabledEmailProvider`。
4. 於 Supabase 執行 SQL 建立 `app_runtime` 獨立角色。

### 分類 D：必須先取得使用者授權之操作 (Explicit Authorization Required)
1. 於 Render 儀表板實際貼上包含密碼之正式連線字串。
2. 觸發 Render 正式環境 Build & Deploy。
3. 切換 DNS 或正式公開網站對外服務。

---

## 八、免費方案與休眠風險全面揭露

專案架構維持 $0.00 零預算，但必須正視以下平台客觀限制：

1. **Render Free Tier 15 分鐘休眠 (Spin-down)**：
   - 15 分鐘無連線時，後端容器會暫停，首次造訪延遲 30~50 秒。
   - **重要防護**：每月每帳號僅提供 750 免費小時。單一服務 24/7 運行即佔用約 720 小時，**嚴禁同時建立多個未關閉的常駐測試服務，否則將導致帳號配額耗盡停機**。
2. **Supabase Free Tier 7 天無活動暫停 (Pausing)**：
   - 連續 7 天無查詢會暫停計算資源。切換上線後，正常使用者流量或每日備份即可防止休眠；若專題放假期間休眠，可自後台一鍵喚醒，磁碟資料保留 1 年。
3. **GitHub Actions 2,000 分鐘/月**：
   - 每日備份約耗 3 分鐘，每月約 90 分鐘，佔配額 4.5%，完全安全。
4. **Cloudflare R2 10GB 免費存儲**：
   - 專案備份約 505KB，搭配 7 天保留政策僅佔用 < 5MB，完全安全。

---

## 九、正式切換前 GO / NO-GO 最終判定標準

在切換日當天，必須滿足以下條件方能核發最終 GO：
- [ ] 備份檔案存在且 SHA-256 比對 100% 吻合。
- [ ] 已手動將備份複製一份至異地硬碟/雲端。
- [ ] 正式 `SESSION_SECRET` 已產生且強度 >= 32 字元。
- [ ] 使用者已明確授權注入 Render 正式環境變數。
- [ ] 宣告 15~30 分鐘維護視窗。

**任何一項未達成，立即中止切換，維持現狀。**
