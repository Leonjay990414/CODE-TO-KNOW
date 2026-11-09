# CODE TO KNOW｜PHASE 3C-4F-R8
# 正式環境上線切換前核對清單 (Production Cutover Checklist)

> **制定日期**：2026-11-09  
> **適用目標**：CODE TO KNOW（碼上學）正式上線與資料庫切換  
> **管理原則**：分類管理、嚴格授權、階層檢查、嚴禁未經授權搶先執行

---

## 一、已完成項目 (Completed Items)

| 序號 | 項目名稱 | 驗收階段 | 狀態 | 驗證證據文件 |
| :---: | :--- | :---: | :---: | :--- |
| **C-01** | 本機 PG16 開發環境健全與基準凍結 | Phase 1B / 3C-4F-R3 | **已完成** | [DATABASE_PHASE3C4F_R3_PG16_TEST_DATA_CLEANUP_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R3_PG16_TEST_DATA_CLEANUP_AUDIT.md) |
| **C-02** | 雲端資料庫結構正式遷移 (36 業務表 + 1 遷移表) | Phase 3C-4A-R2 | **已完成** | [DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4A_R2_SUPABASE_POST_MIGRATION_VERIFICATION.md) |
| **C-03** | 第一次正式備份產出與 SHA-256 驗算 (505,249 Bytes) | Phase 3C-4C-R3 | **已完成** | [DATABASE_PHASE3C4C_R3_CLOUD_BACKUP_INTEGRITY_VERIFICATION.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4C_R3_CLOUD_BACKUP_INTEGRITY_VERIFICATION.md) |
| **C-04** | 本地 PG17 隔離沙盒還原驗證與修復 | Phase 3C-4E-R3-1 | **已完成** | [DATABASE_PHASE3C4E_R3_1_PRISMA_READONLY_CONNECTION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4E_R3_1_PRISMA_READONLY_CONNECTION_AUDIT.md) |
| **C-05** | Prisma Model 映射與關聯唯讀查詢相容性 | Phase 3C-4E-R3-2 | **已完成** | [DATABASE_PHASE3C4E_R3_2_PRISMA_MODEL_RELATION_READONLY_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4E_R3_2_PRISMA_MODEL_RELATION_READONLY_AUDIT.md) |
| **C-06** | Express 後端啟動、健康檢查與優雅關閉 | Phase 3C-4E-R3-4 | **已完成** | [DATABASE_PHASE3C4E_R3_4_EXPRESS_READONLY_API_SHUTDOWN_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4E_R3_4_EXPRESS_READONLY_API_SHUTDOWN_AUDIT.md) |
| **C-07** | PG17 專用測試入口與四重防護機制建置 | Phase 3C-4F-R4 | **已完成** | [DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R4_PG17_TEST_RUNNER_ISOLATION_AUDIT.md) |
| **C-08** | 獨立安全複核與實例拓撲一致性斷言 | Phase 3C-4F-R5 | **已完成** | [DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R5_INDEPENDENT_SECURITY_REVIEW.md) |
| **C-09** | 受控寫入、約束保護、交易 Commit / Rollback 驗收 | Phase 3C-4F-R6 | **已完成** | [DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R6_PG17_CONTROLLED_WRITE_INTEGRATION_AUDIT.md) |
| **C-10** | 最終上線前唯讀完整性與安全準備審查 (CONDITIONAL GO) | Phase 3C-4F-R7 | **已完成** | [DATABASE_PHASE3C4F_R7_FINAL_DATABASE_READINESS_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R7_FINAL_DATABASE_READINESS_AUDIT.md) |
| **C-11** | 正式環境設定規格與變數清單盤點 | Phase 3C-4F-R8 | **已完成** | [DATABASE_PHASE3C4F_R8_PRODUCTION_SECURITY_CONFIGURATION_PLAN.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_R8_PRODUCTION_SECURITY_CONFIGURATION_PLAN.md) |

---

## 二、待完成項目 (Pending Pre-Cutover Items)

| 序號 | 項目名稱 | 預定負責人 / 階段 | 預期交付成果 | 說明 |
| :---: | :--- | :---: | :--- | :--- |
| **P-01** | Session 與 Token 定期清理機制規劃 | R9 規劃階段 | 清理排程邏輯與實作規劃書 | 解決過期 Session/Token 實體紀錄堆積問題 |
| **P-02** | 正式高強度 `SESSION_SECRET` 產生 | 上線準備階段 | 32+ 字元高熵密鑰 | 嚴禁包含 `dev-insecure`，使用 CSPRNG 產生 |
| **P-03** | 第二份異地實體備份歸檔 | 上線準備階段 | 異地加密存檔完成確認 | 將已驗證之 dump 檔上傳至安全異地冷存儲 |
| **P-04** | 雲端資料庫保持活躍（心跳監控）排程 | 上線準備階段 | 定時心跳端點或呼叫作業 | 防止 Supabase Free Tier 連續 7 天無連線休眠 |
| **P-05** | 正式切換維護視窗與回滾程序確認 | 上線準備階段 | 切換排程時段公告 | 預留 15~30 分鐘維護窗口與回滾指引 |

---

## 三、必須人工確認項目 (Manual Verification Required)

在正式切換前，專案主持人與 DBA 必須逐項手動檢驗以下設定：

- [ ] **M-01：Render 後端環境變數配置確認**
  - `NODE_ENV` 確實設為 `production`。
  - `DATABASE_URL` 確實指向 `aws-0-ap-southeast-2.pooler.supabase.com` 並強制 `sslmode=require`。
  - `SESSION_SECRET` 長度達標（>= 32 字元）且已標記為 Secret。
  - `CORS_ORIGIN` 確實為 `https://` 開頭的前端正式網域，無尾隨斜線或路徑。
  - `FRONTEND_URL` 確實為 `https://` 開頭的前端正式網域。
- [ ] **M-02：Render 前端環境變數配置確認**
  - `VITE_API_URL` 確實指向後端正式 API 網址（含 `/api` 後綴）。
- [ ] **M-03：Supabase 儀表板連線與容量確認**
  - 確認專案處於 Active 狀態（未被暫停）。
  - 確認資料表筆數維持純淨基準。
- [ ] **M-04：備份檔案 SHA-256 再次抽檢**
  - 切換前確認本地備份檔案指紋無損。

---

## 四、需要另外授權項目 (Explicit Authorization Required)

以下項目牽涉正式環境變更，**必須取得使用者明確文字授權後方可執行**：

1. **A-01：正式環境變數寫入與儲存**：於 Render 平台實際儲存包含密碼之 `DATABASE_URL` 與 `SESSION_SECRET`。
2. **A-02：Render 正式構建與部署發布**：手動觸發 `code-to-know-api` 或 `code-to-know-web` 之正式發布。
3. **A-03：正式連線切換開關啟用**：將前端連線切換至正式雲端後端。
4. **A-04：雲端資料庫建立專用管理員帳號**：首次於正式環境建立管理者種子資料（若需執行）。

---

## 五、禁止提前執行項目 (Strictly Prohibited Early Execution)

在正式切換時段到來且獲得核准前，**全團隊嚴格禁止進行以下操作**：

- [x] **X-01：嚴禁提前將前端 API 指向正式環境**。
- [x] **X-02：嚴禁提前於正式資料庫執行任何測試性寫入**。
- [x] **X-03：嚴禁在 Git 儲存庫內提交任何 `.env` 或包含連線字串的檔案**。
- [x] **X-04：嚴禁在正式環境執行未經隔離沙盒驗證之 Prisma Migration**。
- [x] **X-05：嚴禁使用 Transaction Pooler (Port 6543) 執行 Prisma 遷移命令**。
- [x] **X-06：嚴禁刪除本機備份目錄內之任何歷史 dump 與 sha256 檔案**。
- [x] **X-07：嚴禁修改本機開發資料庫 (PG16) 或破壞其隔離狀態**。

---

## 六、核定結論

本核對清單已明確區隔「已完成事項」與「切換前防線」。專案目前處於 Phase 3C-4F-R8 規劃完成狀態，下一步將進行 **R9：Session 與 Token 定期清理機制之技術規劃**，在未達正式切換程序前，所有防護與禁止事項嚴格持續生效。
