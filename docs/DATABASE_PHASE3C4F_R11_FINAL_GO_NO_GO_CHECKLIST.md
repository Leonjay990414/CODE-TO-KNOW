# CODE TO KNOW｜PHASE 3C-4F-R11
# 正式上線最終封關簽核清單 (Final Go / No-Go Checklist)

> **制定日期**：2026-11-09  
> **適用目標**：CODE TO KNOW（碼上學）正式上線與資料庫切換終審  
> **當前判定**：**CONDITIONAL GO**（待執行前置確認後正式放行）

---

## 一、正式上線必要條件核對 (Pre-Go-Live Mandatory Conditions)

| 檢核項目 | 判定標準 | 狀態 | 驗證證據 |
| :--- | :--- | :---: | :--- |
| **資料庫結構完整性** | 37 張表、47 外鍵、133 索引、64 唯一約束完全對齊 | **PASS** | R7 實測 SQL 探針通過 |
| **Prisma 相容性** | Model Delegate、關聯查詢、受控寫入與 Rollback 通過 | **PASS** | R3-2, R6 測試通過 |
| **本機開發庫隔離** | PG16 零非預期寫入，基準資料維持凍結 | **PASS** | R3 清理通過，R6 基準比對無誤 |
| **測試入口防護** | 四重防護機制 (Guard 1~4) 100% 阻斷非授權目標 | **PASS** | R4, R5 獨立審查通過 |
| **正式備份檔案無損** | 505,249 Bytes，SHA-256 密碼學指紋 100% 吻合 | **PASS** | R7 獨立驗算吻合 |
| **還原能力驗證** | 現存備份已於本機 PG17 沙盒完成還原與讀寫驗證 | **PASS** | R3-1, R6 實測通過 |

---

## 二、各領域安全與設定檢查清單

### 1. 資料庫權限檢查 (Database Permissions)
- [x] **P-01**：本機沙盒使用者 `codetoknow_restore` 遵循最小權限（非 SUPERUSER / 非 CREATEDB / 非 CREATEROLE）。
- [x] **P-02**：後端程式碼 [`db-validation.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/config/db-validation.ts) 內建應用層 DDL 阻斷與主機白名單。
- [ ] **P-03 (切換前確認)**：確認正式環境連線字串使用專用密碼，不於任何公開儲存庫洩漏。

### 2. TLS 與連線安全檢查 (TLS & Connection Security)
- [x] **T-01**：後端啟動檢驗強制 `sslmode=require` 或 `verify-full`，嚴禁 `disable`。
- [x] **T-02**：連線字串錯誤處理機制已實作遮蔽脫敏，不輸出密碼或憑證。
- [x] **T-03**：Prisma 驅動與底層 `pg.Pool` 連線設定一致。

### 3. Session / Token 安全檢查 (Session / Token Security)
- [x] **S-01**：Session Cookie 配置 `httpOnly: true`、`secure: true` (HTTPS)、`sameSite: 'lax'`。
- [x] **S-02**：CSRF 防護啟用 Double-Submit Cookie 架構與時序安全比對。
- [x] **S-03**：Session Token 與各類驗證 Token 於資料庫均僅以 SHA-256 雜湊儲存。
- [x] **S-04**：使用者停用 (`SUSPENDED`/`DISABLED`) 或刪除時，Session 即刻失效。
- [ ] **S-05 (後續維運)**：R9 規劃之逾期 Session/Token 自動清理排程待後續實作。

### 4. 正式環境變數檢查 (Production Environment Variables)
- [ ] **E-01 (切換前注入)**：`NODE_ENV=production` 已於 Render Web Service 後台設定。
- [ ] **E-02 (切換前注入)**：`DATABASE_URL` 確實指向 Supabase Session Pooler (Port 5432) 並啟用 SSL。
- [ ] **E-03 (切換前注入)**：`SESSION_SECRET` 已產生長度 >= 32 字元之高強度密鑰。
- [ ] **E-04 (切換前注入)**：`CORS_ORIGIN` 與 `FRONTEND_URL` 確實設定為正式 `https://` 前端網域。
- [ ] **E-05 (切換前注入)**：前端 `VITE_API_URL` 確實指向後端正式 API 網址。

### 5. 備份及還原檢查 (Backup & Disaster Recovery)
- [x] **B-01**：本機正式備份檔案及 SHA-256 驗證紀錄完整保存。
- [x] **B-02**：備份工具 `run_supabase_backup.ps1` 具備 Digest 鎖定與 Stdin 管道密碼保護。
- [ ] **B-03 (切換前手動執行)**：手動複製一份 dump 檔至加密 Google Drive 或離線硬碟（異地備份）。
- [ ] **B-04 (後續維運)**：R10 規劃之 GitHub Actions 自動夜間備份排程待後續部署。

### 6. 監控及告警檢查 (Monitoring & Alerting)
- [x] **M-01**：後端 `/api/health` 唯讀健康檢查端點運作正常。
- [ ] **M-02 (切換後啟用)**：配置定時心跳連線，防止 Supabase Free Tier 7 天無活動自動暫停。
- [ ] **M-03 (切換後啟用)**：啟用 Supabase 儀表板慢查詢與連線數告警。

---

## 三、使用者授權確認項目 (Explicit Authorization Items)

以下項目牽涉正式環境變更，**必須在切換當天取得使用者明確文字授權**：

1. **[授權項 A]**：於 Render 平台實際儲存正式 `DATABASE_URL` 與 `SESSION_SECRET`。
2. **[授權項 B]**：發布 Render 前端與後端正式環境部署。
3. **[授權項 C]**：切換 DNS / 前端 API 指向，正式對外開放存取。

---

## 四、上線前最終簽核欄位 (Sign-Off Form)

| 審查角色 | 審核判定 | 簽核註記 | 簽核日期 |
| :--- | :---: | :--- | :---: |
| **獨立安全審查人** | **CONDITIONAL GO** | 核心架構、防護隔離與資料一致性驗收通過，待完成前置變數注入與異地存檔 | 2026-11-09 |
| **PostgreSQL DBA** | **CONDITIONAL GO** | 37 表結構完全對齊，備份指紋無損，還原驗證通過，同意排定維護切換時段 | 2026-11-09 |
| **後端架構師** | **CONDITIONAL GO** | 程式層安全檢驗完備，環境變數 Zod 校驗嚴密，待執行正式切換作業 | 2026-11-09 |
| **專案負責人 (User)** | **[待簽核]** | *(待使用者完成最後授權後簽署放行)* | *(待定)* |

---

## 五、核定結論

本封關簽核清單宣告 **Phase 3C-4F-R1～R11 審查與驗收階段正式圓滿閉幕**。專案技術準備度達標，在取得專案負責人最終授權並完成前置注入後，即可安全執行正式環境上線切換。
