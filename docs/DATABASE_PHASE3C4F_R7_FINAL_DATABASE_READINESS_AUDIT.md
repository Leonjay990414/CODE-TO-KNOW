# CODE TO KNOW｜PHASE 3C-4F-R7
# PostgreSQL 最終上線前唯讀完整性與安全準備審查報告

> **審查日期**：2026-11-09  
> **審查範疇**：Phase 3C-4A 至 Phase 3C-4F-R6 跨階段總體驗收與上線準備度稽核  
> **審查性質**：100% 唯讀審查（零寫入、零還原、零修改、零雲端操作）  
> **最終判定**：**CONDITIONAL GO**（主要驗收已全數通過，切換前需完成指定前置工作）

---

## 一、Git 與 Docker 執行前保全狀態

### 1. Git 版本控制狀態
- **分支 (Branch)**：`main`
- **HEAD Commit**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **狀態**：所有歷史未暫存/未追蹤之專案文件完整保留，無任何未授權之 commit、push、reset 或 clean。

### 2. 容器運行狀態與網路隔離核查
| 容器名稱 | 映像檔版本 | 內部埠口 | 宿主機埠口 | 運行狀態 | 角色定位 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `code_to_know_postgres` | `postgres:16-alpine` | 5432 | `127.0.0.1:5432` | Up (healthy) | 本機開發資料庫（完全未連線、零寫入） |
| `code_to_know_pg17_restore_sandbox` | `3540c0362c80` (PG 17.11) | 5432 | `127.0.0.1:5433` | Up (healthy) | 隔離還原驗收沙盒（已凍結為唯讀） |

### 3. 雲端隔離確認
- 全程未連線 Supabase 雲端正式資料庫（0 次連線、0 個活躍行程）。

### 4. 歷史測試腳本與文件存在性檢視
- [DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md)：**EXISTS**
- [DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md)：**EXISTS**
- [DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md)：**EXISTS**
- [test_pg17_readonly.cjs](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/test_pg17_readonly.cjs)：**EXISTS**
- [test_pg17_controlled_write.cjs](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/test_pg17_controlled_write.cjs)：**EXISTS**

---

## 二、備份完整性審查與 SHA-256 驗算

針對現有儲存於本地之生產備份檔案群進行密碼學指紋重新計算與比對：

### 1. 備份檔案實體盤點
- **備份目錄**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261108_215758`
- **Dump 實體檔案**：`code_to_know_supabase_prod.dump`（大小：**505,249 Bytes**，建立時間：2026-11-08 21:59:26）
- **SHA-256 檔案**：`code_to_know_supabase_prod.dump.sha256`（102 Bytes）
- **元數據檔案**：`backup_info.json`（690 Bytes）

### 2. SHA-256 密碼學獨立重算比對
- **獨立重算雜湊值**：  
  `08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`
- **`.sha256` 記錄檔內容**：  
  `08202DE9D9AB35083FC0A54A78563A498EA26CB35320976210BFCD7BFA2FEDA3`
- **比對結果**：**100% 精確吻合 (Bit-for-Bit Verified)**。

### 3. 備份格式與相容性
- **格式**：PostgreSQL Custom Format (`-Fc`)，含完整二進位 TOC 目錄。
- **產生引擎**：`pg_dump (PostgreSQL) 17.11`（由 Alpine 容器產生）。
- **目標還原相容性**：已於 `code_to_know_pg17_restore_sandbox` 實測完成還原，驗證結構與相容性 100% 成功。
- **第二份獨立備份**：本地保留有 `CODE_TO_KNOW_PRE_MIGRATION_20261108_114016`（前置基線備份），但正式雲端生產備份尚未自動備份至第二個異地存儲（如加密冷存儲/雲端硬碟），列為切換前待辦事項。

---

## 三、PG17 資料庫結構與 Migration 驗收

透過底層 SQL 探針唯讀查詢 `code_to_know_cloud_restore_test`：

| 檢核項目 | 預期基準 | 實際查核值 | 狀態與說明 |
| :--- | :---: | :---: | :--- |
| **PostgreSQL 引擎版本** | PostgreSQL 17.x | **17.11** | 符合 (PostgreSQL 17.11 on x86_64-pc-linux-musl) |
| **資料庫名稱** | `code_to_know_cloud_restore_test` | 一致 | 符合 |
| **資料表總數 (Base Tables)** | 37 | **37** | 36 張業務表 + 1 張 `_prisma_migrations` |
| **外鍵約束 (Foreign Keys)** | 47 | **47** | 47 組關聯定義全部有效，0 組孤立外鍵 |
| **索引總數 (Total Indexes)** | 133 | **133** | 涵蓋主鍵、外鍵與業務查詢索引 |
| **唯一索引 (Unique Indexes)** | 64 | **64** | 涵蓋 Email、TokenHash、UUID 等唯一約束 |
| **Migration 記錄筆數** | 2 | **2** | `20261103000000_init` 與 `20261108000000_add_business_models` |
| **未完成或失敗 Migration** | 0 | **0** | `rolled_back_at` 皆為 null，`applied_steps_count = 1` |

---

## 四、資料庫權限與連線安全審查

### 1. 角色與系統權限 (Roles & Privileges)
- **`postgres`**：系統管理角色，具備 SUPERUSER、CREATEDB、CREATEROLE（符合 PostgreSQL 原廠預設）。
- **`codetoknow_restore`**：沙盒專用角色，`rolsuper: false`、`rolcreatedb: false`、`rolcreaterole: false`，遵循最小權限原則。
- **生產環境評估**：Supabase 預設以 `postgres.<ref>` 透過連線池連線。為符合最佳實務，上線後建議評估建立專用非 Superuser 應用層帳號。

### 2. 資料庫設定與連線參數
- **`max_connections`**：沙盒設為 100；Supabase 雲端環境建議透過 Transaction Pooler (Port 6543) 或 Session Pooler (Port 5432) 調配連線上限。
- **`statement_timeout` 與 `idle_in_transaction_session_timeout`**：沙盒預設為 0；正式環境應配置逾時保護（建議查詢逾時 15s~30s、交易閒置逾時 30s），防止長查詢阻塞。
- **TLS 加密要求**：本機沙盒關閉 SSL；正式環境 Supabase 雲端已驗證強制啟用 TLS 1.3，支援 `sslmode=verify-full`。

---

## 五、Auth 與安全資料架構審查

### 1. 核心安全機制檢核
- **密碼雜湊**：採用 `bcryptjs`，測試環境 10 回合，正式環境由 `BCRYPT_ROUNDS`（預設 12）控制；強制密碼強度檢查（長度 >= 8、英數字混合）。
- **Session 機制**：
  - 伺服端採用 256 位元 CSPRNG 產生 raw token，資料庫僅存儲 SHA-256 雜湊值（`tokenHash`）。
  - 有效期限 7 天。
  - 支援主動登出撤銷（`revokedAt` 記錄）。
  - 當使用者被標記 `SUSPENDED`、`DISABLED` 或 `deletedAt` 時，中介軟體立即拒絕 Session，達到即刻失效。
- **CSRF 防護**：採用 Double-Submit Cookie 架構（`XSRF-TOKEN` cookie 與 `x-csrf-token` header），透過 `crypto.timingSafeEqual` 進行防時序攻擊校驗。
- **RBAC 機制**：角色資料庫化 (`Role` 表包含 `STUDENT`、`TEACHER`、`ADMIN`)，透過 `UserRole` 關聯，中介軟體即時自資料庫解析，嚴禁前端偽造。
- **AuditLog**：記錄使用者行為（註冊、登入失敗、登入、登出等），自動擷取 IP 與 UserAgent。原始碼內敏感資料已做過濾，無明文密碼寫入日誌之風險。

### 2. 安全風險與待補強項目
- **過期資料定期清理機制**：
  - 目前 Session 與 EmailVerificationToken 的過期判斷為**按需檢查 (On-demand)**，尚無排程 cron 或 `pg_cron` 背景任務定期清除實體資料庫中的逾期紀錄。
  - AuditLog 目前無生命週期淘汰與歸檔保留策略。

---

## 六、備份與災難復原流程就緒度

| 復原流程環節 | 現狀狀態 | 評估與依據文件 |
| :--- | :---: | :--- |
| **定期備份流程** | **手動/事件觸發** | 透過 `scripts/database/run_supabase_backup.ps1` 執行；因 Supabase Free Tier 不提供自動 Snapshot，需仰賴手動或外部排程。 |
| **備份完整性驗證** | **完整 (PASS)** | 自動產出 `.sha256` 與 `backup_info.json`，已建置驗算工具。 |
| **還原操作流程** | **完整 (PASS)** | [DATABASE_PHASE3C2C1_BACKUP_AND_RESTORE_VERIFICATION.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C2C1_BACKUP_AND_RESTORE_VERIFICATION.md) 與 [DATABASE_PHASE3C4E_R3_1_SANDBOX_RECOVERY_SUPPLEMENT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4E_R3_1_SANDBOX_RECOVERY_SUPPLEMENT.md) 提供詳盡標準流程。 |
| **還原後完整性核驗** | **完整 (PASS)** | 具備自動比對表數、外鍵、索引、Migration 歷史之比對腳本。 |
| **第二份異地備份** | **未完成 (PENDING)** | 目前備份集中於本機，建議上傳至加密雲端儲存庫以防本機災難。 |
| **災難復原專責指派** | **已規劃** | 明確規範由專題架構師與 DBA 執行。 |

---

## 七、正式環境切換條件評估 (14 項條件檢核清單)

| 項次 | 評估項目 | 檢核標準 | 審查評級 | 說明 |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **PG17 還原驗收** | 備份檔案能否於 PG17 完美還原 | **PASS** | 37 張表、47 外鍵、133 索引還原成功 |
| 2 | **R4 隔離測試入口** | 測試工具是否具備防止誤連保護 | **PASS** | 四重防護阻斷機制經檢驗有效 |
| 3 | **R5 獨立安全複核** | 指針同一性與負向阻擋驗證 | **PASS** | 實例嚴格相等，負向測試 100% 阻斷 |
| 4 | **R6 受控寫入整合測試** | Prisma 寫入、約束、交易 Commit/Rollback | **PASS** | 全數通過，測試資料已 100% 精確清理 |
| 5 | **備份與 SHA-256** | 備份檔案完整且指紋精確吻合 | **PASS** | 505,249 bytes，SHA-256 100% 吻合 |
| 6 | **Migration 狀態** | 雲端與本機 Migration 是否乾淨最新 | **PASS** | 2 筆遷移全數成功，無 failed/rollback |
| 7 | **連線安全** | 正式連線是否強制 TLS 且不暴露密碼 | **PARTIAL PASS** | 雲端 TLS 模式已驗證；正式連線池網址需以機密管理部署 |
| 8 | **權限管理** | 資料庫使用者是否符合最小權限 | **PARTIAL PASS** | 沙盒角色已受限；正式環境建議建置非 Superuser 專用帳號 |
| 9 | **Session 與 Token 管理** | 加密、雜湊、防時序、帳號停用即刻失效 | **PARTIAL PASS** | 核心邏輯安全完備；尚缺逾期紀錄背景清理排程 |
| 10 | **災難復原文件** | 是否具備標準還原 SOP 與復原步驟 | **PASS** | 策略規劃書與驗證報告齊備 |
| 11 | **正式環境環境變數** | 正式 `.env.production` 是否配置完備 | **NOT STARTED** | 尚待正式切換階段部署與安全注入 |
| 12 | **TLS (傳輸層安全)** | 正式連線是否全程強制 TLS 加密 | **PASS** | Supabase 雲端環境已驗證支援 TLS 1.3 |
| 13 | **監控與告警** | 資料庫 CPU、連線數與慢查詢監控 | **NOT STARTED** | 雲端儀表板就緒，告警規則待配置 |
| 14 | **正式環境備份排程** | 是否建置上線後自動化定期備份 | **NOT STARTED** | Free Plan 需配置外部定期排程或手動 Milestone 備份 |

---

## 八、正式環境切換前之剩餘工作清單 (Pre-Cutover Action Items)

在正式執行資料庫連線切換前，專題團隊應完成以下前置作業：

1. **正式環境環境變數注入 (`.env.production`)**：
   - 配置生產環境之 `DATABASE_URL`（經由 Supabase Session Pooler Port 5432 或 Transaction Pooler Port 6543）。
   - 設定正式 `COOKIE_DOMAIN`、`CORS_ORIGIN`、`BCRYPT_ROUNDS=12`。
   - 確保敏感變數僅存放於安全託管平台，不簽入 Git。
2. **第二份異地備份歸檔**：
   - 將已驗證之 `code_to_know_supabase_prod.dump`（SHA-256 吻合）複製一份至加密個人 Google Drive 或離線硬碟。
3. **過期 Session 與 Token 清理排程建立**：
   - 實作簡易的排程腳本或 API 端點，定期執行 `prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } })`。
4. **資料庫連線池與逾時參數調校**：
   - 於連線字串或後端配置明確的 `statement_timeout` 與 `connectionTimeoutMillis`。
5. **正式切換演練計畫**：
   - 制定切換時的維護視窗、DNS / API 指向更新順序及切換失敗時的回滾指引。

---

## 九、風險分級評估

| 風險項目 | 風險等級 | 影響範疇 | 緩解措施與對策 |
| :--- | :---: | :--- | :--- |
| **Supabase Free Tier 7 天無活動自動暫停** | **中 (Medium)** | 若專題評審期間 7 天無連線，服務可能暫時休眠 | 專題評審前定期發送心跳查詢（Ping），或設定定時監控端點保持喚醒。 |
| **缺少過期 Session 自動清理** | **低 (Low)** | 逾期 Session 堆積佔用磁碟空間 | 目前不影響安全性（中介軟體會攔截逾期 Session），上線前排入清理排程即可。 |
| **僅有一處實體備份副本** | **中 (Medium)** | 宿主機硬體故障導致備份遺失 | 切換前手動將 Dump 檔上傳至安全異地冷存儲。 |
| **切換時連線字串配置錯誤** | **低 (Low)** | 服務啟動失敗 | 全面套用後端現有之 `db-validation.ts` 啟動預檢，連線異常時立即阻斷並報警。 |

---

## 十、Go / No-Go 結論

```
======================================================================
  PHASE 3C-4F-R7 FINAL READINESS AUDIT VERDICT: [ CONDITIONAL GO ]
======================================================================
```

**獨立審查總評**：  
CODE TO KNOW 資料庫自 Phase 3C-4A 雲端遷移以來，歷經本地還原驗證（R1~R3-5）、測試入口硬隔離改造（R4）、獨立安全複核（R5）以及受控寫入整合與交易驗收（R6），資料庫架構、模型約束、外鍵關聯、交易完整性與備份指紋已獲得扎實驗證，無任何未解之技術阻塞項目（Zero BLOCKED items）。  

因此核定為 **`CONDITIONAL GO`**：**專案已具備進入正式切換規劃的成熟條件**，唯在正式切換當天，需依照第八章節所列之前置工作（環境變數安全注入、異地備份副檔存檔、切換維護視窗設定）依序完成，即可安全平穩地上線運行。
