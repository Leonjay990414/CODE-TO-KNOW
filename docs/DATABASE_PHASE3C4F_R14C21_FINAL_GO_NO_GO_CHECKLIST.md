# CODE TO KNOW｜正式環境切換前最終 GO / NO-GO 檢查清單
# PHASE 3C-4F-R14-C-2-1：PG17 本機沙盒最小權限演練後評估清單

**文件編號**：C2K-DOC-DB-R14C21-GONO-01  
**審查日期**：2026-11-09  
**主責角色**：資深 PostgreSQL DBA 與資料庫安全架構師  
**評估基準**：R14-B-1、R14-C-0 至 R14-C-2-1 演練成果  
**總體裁決**：**本機沙盒演練 PASS / 正式雲端切換 NO-GO (BLOCKED)**  

---

## 一、檢查項目總體評估

| 檢查領域 | 檢查項目 | 評估標準 | 實際狀態 | 裁決 |
| :--- | :--- | :--- | :--- | :--- |
| **環境隔離** | 本機 PG17 沙盒隔離 | 是否於獨立 PG17 容器執行，不干擾 PG16 與正式雲端庫 | 於 5433 埠位容器執行，零雲端連線 | **PASS** |
| **備份基線** | 最新備份完整性驗證 | dump 檔案非空、SHA-256 符合、還原業務表與物件數量一致 | 505,249 bytes，37 表、1 enum、47 FK、133 索引完整還原 | **PASS** |
| **角色架構** | 最小權限角色建立 | NOLOGIN、NOCREATEDB、NOCREATEROLE、NOSUPERUSER | 成功建立並完成權限隔離 | **PASS** |
| **所有權轉移** | 業務物件所有權移轉 | 37 張表、Enum Type、Public Schema 移轉至 `migration_admin` | 移轉成功，陣列型別 `_AnnouncementStatus` 自動同步 | **PASS** |
| **權限繼承** | Default Privileges | 未來遷移新建物件自動賦權 `app_runtime` | 經實測建表驗證，權限自動繼承無誤 | **PASS** |
| **安全防護** | AuditLog 不可篡改 | `app_runtime` 僅限 SELECT/INSERT，嚴格禁止 UPDATE/DELETE/TRUNCATE | 內建函數與實測均回傳拒絕，外鍵 SET NULL 正常運作 | **PASS** |
| **系統保護** | `_prisma_migrations` 隔離 | 執行期角色不得讀寫 Prisma 遷移歷史表 | `app_runtime` 存取報錯拒絕，`migration_admin` 正常存取 | **PASS** |
| **RLS 架構** | Supabase `ensure_rls` 影響評估 | 確認 Event Trigger 存在，提出正確後端執行期連線方案 | 查出觸發器，確認 Node.js 後端角色須配置 `BYPASSRLS` | **PASS** |
| **受控回滾** | Controlled Rollback | 回滾語法正確，依賴斷言為 0，角色安全刪除，結構無損 | 7 步回滾實測完成，斷言嚴格為 0，原表完好恢復 `postgres` | **PASS** |
| **金鑰保管** | 本地簡化金鑰保管 | AUTH-K-01/02 方案是否已選定並設定完成 | 使用者暫緩 Bitwarden/MFA，本地方案待最終拍板 | **PENDING** |
| **即時備份** | 正式資料庫切換前即時備份 | AUTH-B-02/03/04 是否已於正式環境執行並驗證 | 尚未執行正式雲端備份（等待授權） | **BLOCKED** |
| **雲端授權** | Supabase 正式切換授權 | AUTH-C-01 至 AUTH-C-05 是否已取得負責人簽核 | 尚未申請正式切換授權 | **BLOCKED** |

---

## 二、阻擋項目（Blockers）現況矩陣

```
[本機技術驗證層] -> 100% PASS (R14-C-2-1 演練證明技術無阻礙)
       │
       ▼
[金鑰保管確認]   -> PENDING (KeePassXC / BitLocker 方案待確認)
       │
       ▼
[正式雲端備份]   -> BLOCKED (AUTH-B-02~04，待金鑰方案與雲端備份授權)
       │
       ▼
[正式權限切換]   -> BLOCKED (AUTH-C-01~05，維持最高安全鎖定)
```

1. **AUTH-K-01 / AUTH-K-02**：
   - 狀態：**PENDING**
   - 說明：使用者暫緩雲端密碼管理器，後續可採 KeePassXC 本地保險庫或 BitLocker 隔離隨身碟。
2. **AUTH-B-02 至 AUTH-B-04**：
   - 狀態：**BLOCKED**
   - 說明：在切換正式資料庫前，必須透過 Session Pooler 執行一次正式即時加密備份（AES-256-GCM）並驗證還原。
3. **AUTH-C-01 至 AUTH-C-05**：
   - 狀態：**STRICTLY BLOCKED**
   - 說明：在未取得正式環境明確切換授權前，絕對不接觸 Supabase 正式庫。

---

## 三、技術就緒結論與最終裁決

### 1. 本機技術層面判定：【GO (PASS)】
本階段 PG17 沙盒演練已將切換 SQL、權限矩陣、AuditLog 防護、RLS 架構補強以及受控回滾程序在與正式庫版本一致的 PostgreSQL 17.11 上完成 100% 實測驗證，無技術死角。

### 2. 正式環境部署層面判定：【NO-GO (BLOCKED)】
因正式環境即時備份尚未執行，且金鑰保管方案尚未拍板，依最高安全規範，正式環境切換程序維持 **NO-GO**。

### 3. 下一階段建議動作
1. 確定本地簡化金鑰保管方式（推薦 KeePassXC 本地資料庫或隔離隨身碟）。
2. 在具備正式備份授權的前提下，執行 `PHASE 3C-4F-R14-C-1-X` 正式雲端加密即時備份。
3. 備份驗收通過後，正式申請 `PHASE 3C-4F-R14-C-3` 雲端最小權限切換授權。
