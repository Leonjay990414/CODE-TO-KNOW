# CODE TO KNOW｜Supabase 正式庫最小權限實施前置授權檢核表 (Phase 3C-4F-R14-C-0)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14C0-CHECKLIST`  
**建立時間**：2026-11-09  
**版次**：v1.0.0  
**前置判定**：`CONDITIONAL READY FOR REVIEW`  
**適用範圍**：指導專案負責人審核 R14-C 實施前提、雲端授權項目與執行卡關防線

---

## 一、文件用途與授權總則

本檢核表依據 `DATABASE_PHASE3C4F_R14C0_MINIMUM_PRIVILEGE_IMPLEMENTATION_PLAN.md` 制定。

> [!CAUTION]
> **鐵律約束**：
> 1. 本檢核表內所有標記為 **`[必須專案負責人明確授權]`** 之項目，在負責人於對話或書面中給予精確授權指令前，**AI 絕對不得自動執行任何雲端連線、DDL 操作或備份觸發**。
> 2. 在獲得授權前，所有資料庫狀態維持唯讀，代碼庫維持凍結。

---

## 二、R14-C 正式執行前置必要條件查核 (Pre-Execution Gates)

| 編號 | 檢核項目 | 標準要求 | 目前狀態 | 驗證依據 |
| :---: | :--- | :--- | :---: | :--- |
| **GATE-01** | **本機代碼庫修訂完成** | `database.ts` (TLS CA), `env.ts`, `db-validation.ts` (三角色校驗) 修訂完備 | **PASS** | R14-B-1 完成並通過 105 項單元測試 |
| **GATE-02** | **AES-256-GCM 備份工具就位** | `scripts/database/backup-crypto.cjs` 具備串流加密與 16-byte Auth Tag 驗證 | **PASS** | `backup-crypto.test.cjs` 14 項測試通過 |
| **GATE-03** | **官方 Root CA 憑證就緒** | `backend/certs/prod-supabase-ca.crt` 存在且 SHA-256 為 `70072358...` | **PASS** | SHA-256 比對相符，X509 解析有效 |
| **GATE-04** | **所有權移轉 SQL 排除全局 REASSIGN** | 採用動態 PL/pgSQL 手術式單一 Schema 移轉，杜絕系統 Schema 污染 | **PASS** | R14-C-0 審查方案已明確修訂並完成安全論證 |
| **GATE-05** | **回滾 DDL 方案完備** | 具備 4 套針對不同失敗情境之還原 DDL 與災難復原指引 | **PASS** | `DATABASE_PHASE3C4F_R14C0_SQL_REVIEW_AND_ROLLBACK_PLAN.md` 就緒 |

---

## 三、必須由專案負責人明確授權的雲端操作清單 (Authorization Items)

以下項目為未來推進 R14-C 正式執行時，必須由負責人逐一核准的高風險雲端操作：

| 授權代碼 | 授權操作內容 | 操作目標與通道 | 風險等級 | 授權狀態 | 負責人簽核 |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **AUTH-C-01** | **授權執行切換前雲端即時基準備份**<br>（包含互動輸入密碼、Docker pg_dump、GCM 串流加密與 PG17 沙盒還原演練） | Supabase Session Pooler (Port 5432) | **中 (Medium)** | **[待授權]** | `[  ] 未簽署` |
| **AUTH-C-02** | **授權建立雲端資料庫角色**<br>（於 Supabase 建立 `migration_admin` 與 `app_runtime` 專用帳號） | Supabase SQL Editor / Admin 連線 | **高 (High)** | **[待授權]** | `[  ] 未簽署` |
| **AUTH-C-03** | **授權執行 public 物件所有權移轉**<br>（將 37 張表與 Sequence 所有權由 postgres 移轉給 migration_admin） | Supabase SQL Editor / Admin 連線 | **高 (High)** | **[待授權]** | `[  ] 未簽署` |
| **AUTH-C-04** | **授權配置 app_runtime DML 權限與 Default Privileges**<br>（授予日常查詢與寫入權限，配置未來新建表繼承規則） | Supabase SQL Editor / Admin 連線 | **中 (Medium)** | **[待授權]** | `[  ] 未簽署` |
| **AUTH-C-05** | **授權執行唯讀權限邊界驗收**<br>（驗證 app_runtime 具備 DML、遭拒 DDL，驗證 migration_admin 具備 DDL） | Supabase Session Pooler (Port 5432) | **低 (Low)** | **[待授權]** | `[  ] 未簽署` |

---

## 四、正式實施執行前核對檢查表 (Runbook Checklist)

在獲得上述授權並啟動執行當下，操作團隊必須逐項核對以下狀態：

- [ ] **[Check 1] 本機環境安全**：Git 分支為 `main`，HEAD 維持在 `7b778942f2fa85e351575cd72507c2373bdf2f96`。
- [ ] **[Check 2] 金鑰安全保管**：`BACKUP_ENCRYPTION_KEY` 已妥善保管於獨立安全密碼庫，不在終端機留存歷史紀錄。
- [ ] **[Check 3] 沙盒準備就緒**：本地 PG17 沙盒容器（`code_to_know_pg17_restore_sandbox`，Port 5433）正常運行中。
- [ ] **[Check 4] 備份驗證通過**：切換前雲端備份產出 `pre_cutover_prod.dump.enc`，SHA-256 吻合，且於沙盒還原確認資料表總數為 37 張。
- [ ] **[Check 5] 角色建立完畢**：`migration_admin` 與 `app_runtime` 成功建立，角色屬性具備 `NOBYPASSRLS`。
- [ ] **[Check 6] 所有權移轉合規**：查詢 `pg_tables` 確認 37 張表之 Owner 皆為 `migration_admin`，系統 Schema 物件未受影響。
- [ ] **[Check 7] 權限隔離驗證**：`app_runtime` 執行 `CREATE TABLE` 遭到 PostgreSQL 阻斷（`permission denied`）。
- [ ] **[Check 8] 回滾指引備妥**：所有回滾 DDL 腳本已於本地留存，若遭遇異常隨時可在 3 分鐘內完整還原。

---

## 五、責任邊界聲明

1. **AI 代理人責任限制**：
   本檢核表之產出標誌著 R14-C-0 前置審查規劃作業結束。AI 代理人在此聲明：在未取得專案負責人明確下達「授權執行 R14-C 雲端資料庫操作」之具體指令前，**絕不主動發起任何外部網路封包、不操作雲端 SQL、不更動資料庫權限**。
2. **負責人簽章授權欄**：
   - 審查判定：`[ ] 核准推進 R14-C 雲端操作` / `[ ] 駁回 / 要求修正`
   - 專案負責人簽章：____________________
   - 授權執行日期：____________________
