# CODE TO KNOW｜PostgreSQL 正式切換安全實施路線圖 (Phase 3C-4F-R13)

**文件識別碼**：`DOC-DB-PHASE3C4F-R13-ROADMAP`  
**建立時間**：2026-11-09  
**版次**：v1.0.0  
**前置文件**：  
- `docs/DATABASE_PHASE3C4F_R13_TECHNICAL_CORRECTNESS_AUDIT.md`  
- `docs/DATABASE_PHASE3C4F_R12_PRE_CUTOVER_FINAL_CHECKLIST.md`  
**適用範圍**：指導後續 PHASE 3C-4F-R14 的安全落地實施與正式切換把關

---

## 一、概述與核心安全準則

本路線圖依據 `DATABASE_PHASE3C4F_R13_TECHNICAL_CORRECTNESS_AUDIT.md` 之複核成果制定，旨在為 PHASE 3C-4F-R14（安全加固與切換前落地準備）提供一套具有明確依賴關係、風險分級、驗收標準及硬性阻斷點的執行準則。

> [!IMPORTANT]
> **鐵律**：本路線圖中所有標記為 `[需要使用者授權]` 之項目，在未取得專案負責人明確書面／對話指示前，**絕對不得先行執行**。

---

## 二、PHASE 3C-4F-R14 安全實施工作分解矩陣

本矩陣按照嚴格的技術相依順序排列，前一階段未通過驗收前，不得推進至下一階段。

| 順序 | 任務模組名稱 | 風險等級 | 前置依賴條件 | 驗收方式與交付成果 | 授權要求 |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **Step 1** | **更新連線校驗模組 (`db-validation.ts`)** | **中 (Medium)** | 無（本地程式碼） | 修正 Pooler 使用者名稱硬編碼限制，使其支援 `app_runtime.<ref>`，執行本機單元測試通過 | **內部開發**<br>*(不需雲端授權)* |
| **Step 2** | **升級備份加密工具為 Node.js GCM 串流** | **低 (Low)** | 無（本地獨立腳本） | 建立 `scripts/backup-crypto.cjs`，於本地演練「生成隨機資料 -> GCM 加密 -> 篡改 1 bit -> 驗證解密阻斷 -> 正常解密比對」 | **內部開發**<br>*(不需雲端授權)* |
| **Step 3** | **固化 Supabase Root CA 憑證與升級 TLS** | **中 (Medium)** | 取得 Supabase 官方 CA | 將 `prod-supabase-ca.crt` 放入 `backend/certs/`，修改 `database.ts` 引入 `rejectUnauthorized: true` + 實體 CA，於沙盒通過測試 | **內部開發**<br>*(需取得公開 CA 憑證)* |
| **Step 4** | **Supabase 建立最小權限角色與 DDL 移轉** | **高 (High)** | Step 1 通過、負責人授權 | 於 Supabase SQL Editor 執行 R13 校正後 DDL；透過唯讀查詢確認 `app_runtime` 僅具備 DML、所有權已移交 `migration_admin` | **[必須使用者授權]** |
| **Step 5** | **應用程式帳號連線與權限邊界驗收** | **中 (Medium)** | Step 4 建立完畢 | 執行隔離驗證腳本：測試 `app_runtime` 執行 SELECT/INSERT 成功，測試執行 DROP/CREATE 遭 PG 拒絕 | **[必須使用者授權]** |
| **Step 6** | **切換前雲端即時基準備份 (GCM)** | **中 (Medium)** | Step 2、Step 4 完成 | 產出切換前 `pre_cutover_prod.sql.enc` 與 SHA-256 雜湊，並於本地 PG17 沙盒完成解密還原驗證 | **[必須使用者授權]** |
| **Step 7** | **Render 後端服務建立與憑證注入** | **高 (High)** | Step 3、Step 4、負責人授權 | 於 Render 建立 Web Service，安全注入 `DATABASE_URL`（指向 `app_runtime`），確認無明文洩漏 | **[必須使用者授權]** |
| **Step 8** | **前後端全鏈路連線與健康檢查** | **中 (Medium)** | Step 7 完成部署 | 驗證 Render 前端向後端 `/api/v1/health` 請求成功，延遲與 DB 連線探針回報正常 | **[必須使用者授權]** |
| **Step 9** | **正式切換維護窗口與回滾演練確認** | **極高 (Critical)** | Step 1～8 全數 PASS | 團隊確認 30 分鐘維護窗口，確認 5 步回滾程序就緒，發布切換完成通知 | **[必須專案負責人最終簽核]** |

---

## 三、各任務詳細實施規格與驗收標準

### 1. Step 1：修正 `db-validation.ts` 連線校驗規則
- **問題**：目前 `validateCloudRuntimeDatabaseUrl` 行 319 硬編碼比對 `postgres.${APPROVED_PROD_PROJECT_REF}`。
- **改進規格**：
  允許核准的角色前綴（`postgres`、`app_runtime`）：
  ```typescript
  const ALLOWED_RUN_ROLES = ['postgres', 'app_runtime'];
  const userPrefix = username.split('.')[0];
  if (!ALLOWED_RUN_ROLES.includes(userPrefix) || !username.endsWith(`.${APPROVED_PROD_PROJECT_REF}`)) {
    throw new Error(`[RUNTIME CONFIG ERROR] Invalid pooler username '${username}'.`);
  }
  ```
- **驗收**：執行 `npm test` 確認既有驗證測試與新增案例皆 100% 通過。

### 2. Step 2：建立標準 Node.js AES-256-GCM 串流加密工具
- **腳本位置**：`scripts/backup-crypto.cjs`
- **功能規格**：
  - 加密模式：`aes-256-gcm`
  - IV：每次執行調用 `crypto.randomBytes(12)`
  - 封裝格式：前 12 位元組為 IV，隨後為密文，最後 16 位元組為 Auth Tag
  - 完整性校驗：解密時必須比對 Auth Tag，若失敗拋錯並終止 Process（Exit Code 1），杜絕半損壞資料流向資料庫
- **驗收**：撰寫單元測試驗證位元翻轉防禦能力。

### 3. Step 3：固化 CA 憑證與後端 TLS 安全升級
- **憑證位置**：`backend/certs/prod-supabase-ca.crt`（可納入版本控制之公開根憑證）
- **程式碼規範**：修改 `backend/src/config/database.ts`，採用 R13-01 提出的 `createProductionSslConfig` 規格，保留 Node.js 預設 RFC 6125 主機名稱驗證。
- **驗收**：於本機環境測試憑證缺失與憑證錯誤時，連線池能正確拋出具備辨識度的例外。

### 4. Step 4 & 5：雲端最小權限角色建立與驗證
- **執行方式**：由使用者／授權工程師於 Supabase SQL Editor 執行 R13-03 提供的標準 SQL。
- **關鍵驗收點**：
  - 驗證 1：`SELECT tableowner FROM pg_tables WHERE schemaname = 'public';` 確認皆為 `migration_admin`。
  - 驗證 2：使用 `app_runtime` 連線執行 `CREATE TABLE test_fail (id int);` 必須回傳 `permission denied for schema public`。
  - 驗證 3：使用 `app_runtime` 連線執行 `SELECT COUNT(*) FROM users;` 必須成功回傳 `0`。

---

## 四、不可執行事項清單 (Prohibited Actions in R14)

在 R14 執行期間，以下行為屬於**絕對禁止事項**：

1. **嚴禁在程式碼中寫死任何正式環境密碼或 Token**。
2. **嚴禁將包含正式機密之 `.env` 或設定檔加入 Git 追蹤**。
3. **嚴禁在未執行切換前基準備份前進行角色變更或切換**。
4. **嚴禁繞過 `db-validation.ts` 的白名單檢查**。
5. **嚴禁在備份腳本中使用未經驗證的密碼學指令（如 `openssl enc -aes-256-gcm`）**。
6. **嚴禁使用外部定期 Ping 或假查詢規避雲端平台的休眠機制**。
7. **嚴禁在未獲得專案負責人最終書面授權前切換公開 DNS 或前端正式 API 指標**。

---

## 五、正式切換前的最終阻斷條件 (Hard Gating Blockers)

若符合以下任何一項條件，正式切換必須**立即宣告 BLOCKED**，禁止上線：

| 阻斷代碼 | 阻斷條件 | 觸發後處置措施 |
| :---: | :--- | :--- |
| **GATE-01** | **`app_runtime` 具備任何 DDL 權限** | 立即撤銷 public schema 的 CREATE 權限，修復至完全隔離。 |
| **GATE-02** | **後端 TLS 關閉主機名驗證或憑證檢查** | 阻斷部署，強制退回 Step 3，修復 TLS 配置。 |
| **GATE-03** | **切換前即時備份解密失敗或 SHA-256 雜湊不符** | 終止切換維護窗口，排查備份加密工具。 |
| **GATE-04** | **Render 後端啟動失敗或 `/api/v1/health` 探針未通過** | 阻斷前端指標變更，檢查 Render 環境變數與連線逾時。 |
| **GATE-05** | **專案負責人未完成書面簽核** | 系統維持維護或待命狀態，嚴禁私自切換流量。 |

---

## 六、五步緊急回滾程序 (Emergency Rollback Standard)

若正式切換後 15 分鐘內發現無法解決之系統異常，啟動標準回滾：

```text
[Step 1] 宣佈切換失敗，啟動緊急回滾窗口 (< 1 分鐘)
   ↓
[Step 2] 前端指標立即切回維護頁面或前一穩定版本 (< 2 分鐘)
   ↓
[Step 3] 停止 Render 後端服務連線，阻斷新請求注入資料庫 (< 2 分鐘)
   ↓
[Step 4] 檢視資料庫受損狀況；若結構受損，使用切換前備份執行沙盒復原確認後還原 (< 15 分鐘)
   ↓
[Step 5] 撰寫事後檢討報告 (Incident Postmortem) 並向負責人通報 (< 30 分鐘)
```

---
**路線圖核准狀態**：  
- 技術規範審查：**PASS**（依據 R13 獨立審查結果確立）  
- 實施就緒狀態：**READY FOR R14 PLANNING**（等待使用者授權啟動 R14 準備）
