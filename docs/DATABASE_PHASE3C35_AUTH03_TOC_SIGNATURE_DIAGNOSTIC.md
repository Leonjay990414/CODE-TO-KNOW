# CODE TO KNOW — Phase 3-C-35 AUTH-03 TOC SIGNATURE ERROR 唯讀診斷報告

- **診斷日期**：2026-11-12
- **執行性質**：100% 唯讀診斷（未修改任何程式碼或測試、未執行解密或 `pg_restore`、未連線 Supabase/Render）
- **中止錯誤**：`[TOC SIGNATURE ERROR] TOC ID 4791 物件簽章不符！實際內容：'ACL - SCHEMA storage supabase_admin'，預期匹配：'^ACL\s+-\s+SCHEMA\s+vault\b'`
- **整體狀態標記**：**BLOCKED（待授權修正 `restore_pg17_sandbox.ps1` TOC 寫死 ID 與筆數假設）**

---

## 一、錯誤根因及證據

### 1. 直接原因
在 `scripts/database/restore_pg17_sandbox.ps1`（第 271–283 行）中，`Invoke-StrictTocFilterAndVerify` 將 2026-11-10 舊版備份的 **10 個 TOC Archive ID 寫死**於 `$expectedExcludedIds` 與 `$expectedSignatures`：

```powershell
$expectedExcludedIds = @(5, 13, 3777, 4791, 4794, 4888, 4889, 4890, 4997, 4998)
$expectedSignatures = @{
    5    = '^EXTENSION\s+-\s+supabase_vault\b'
    13   = '^SCHEMA\s+-\s+vault\b'
    3777 = '^TABLE DATA\s+vault\s+secrets\b'
    4791 = '^ACL\s+-\s+SCHEMA\s+vault\b'
    ...
}
```

### 2. 為什麼會發生在 2026-11-12 備份？
1. PostgreSQL `pg_dump -Fc` 產生的 TOC Archive ID 屬於**單次匯出時的循序流水號**，並非跨時間點的固定常數。
2. 只要 Supabase 託管環境的系統 schema（如 `storage`、`auth`、`realtime`）或 `public` schema 物件有所增減，後續所有物件的 TOC ID 都會整體位移。
3. 在 2026-11-12 的正式備份中，TOC ID `4791` 實際對應的是 `ACL - SCHEMA storage supabase_admin`（屬於 `storage` schema 的 ACL，而非 `vault`），因此觸發第 186–188 行的 `[TOC SIGNATURE ERROR]` 中止。
4. 這正證明了 `restore_pg17_sandbox.ps1` 的「簽章安全防衛」有正確攔截到不符物件，沒有誤刪 `storage` 權限；問題出在「用寫死流水號去對應物件」。

---

## 二、TOC 項目與過濾規則分析

1. **`Test-IsVaultOrSupabaseVaultBody`（第 132–140 行）規則本身正確**：
   - `^SCHEMA\s+-\s+vault\b`
   - `^ACL\s+-\s+SCHEMA\s+vault\b`
   - `^EXTENSION\s+-\s+supabase_vault\b`
   - `^COMMENT\s+-\s+EXTENSION\s+supabase_vault\b`
   - `^[A-Z]+(?: [A-Z]+)*\s+vault\s+`
   - 以上規則是以**語意物件簽章**精準鎖定 `vault` / `supabase_vault`，不會誤中 `storage`、`supabase_admin` 或 `public` 物件。
2. **`Parse-AndVerifyFilteredToc`（第 142–240 行）現有檢查**：
   - 嚴格檢查每行格式 `^(\d+);\s+\d+\s+\d+\s+(.+)$` 與重複 ID（`seenIds`）。
   - 嚴格禁止排除任何 `public` 核心物件（`Test-IsPublicCoreTocBody`）。
   - 嚴格檢查排除清單外不得殘留任何 `Test-IsVaultOrSupabaseVaultBody` 項目。
   - **同類型硬編碼風險（第 223–240 行）**：除了 10 個寫死 ID 外，腳本亦寫死了總有效項目數必須為 `926->916` 或 `919->909`（`validCountPairs`），以及 `ExpectedPublicCount = 337`。若 Supabase 平台內部 schema（如 `storage`）物件數有變動，即使正確排除所有 `vault` 項目，仍可能在第 235 行觸發 `[TOC COUNT ERROR]`。

---

## 三、可能影響範圍

- **僅影響**：`scripts/database/restore_pg17_sandbox.ps1` 的 TOC 過濾與驗證流程，以及其離線測試 `scripts/database/restore_pg17_sandbox.test.ps1` 中針對「固定 10 個 ID 與固定 926/919 筆數」的測試案例（TC-19～TC-24）。
- **不影響**：`scripts/database/backup-crypto.cjs`、`backup-crypto.test.cjs`、密文 SHA-256 驗證、GCM AuthTag 認證解密、以及 `stdin` 金鑰傳遞機制。

---

## 四、建議修正方案（不放寬安全驗證的前提下修正）

1. **改以「語意物件簽章」識別並排除 `vault` / `supabase_vault`**，不再寫死固定 TOC ID：
   - 保留 `Test-IsVaultOrSupabaseVaultBody` 作為唯一排除條件，並要求至少匹配到預期類型的 `vault` / `supabase_vault` 核心項目（例如 `EXTENSION - supabase_vault`、`SCHEMA - vault`、`ACL - SCHEMA vault`）。
   - 保留 `seenIds` 重複 ID 檢查、每行格式解析檢查。
   - 保留「嚴禁排除任何 `public` 核心物件（`Test-IsPublicCoreTocBody`）」之安全防線。
   - 保留「排除後的剩餘清單重讀檢查：0 筆 `vault`/`supabase_vault` 殘留、必含 `pg_stat_statements`/`pgcrypto`/`uuid-ossp`、UTF-8 無 BOM + 純 LF」。
2. **將總筆數檢查改為數學不變量 + 安全下限**：
   - 驗證 `retainedActiveCount -eq ($rawActiveCount - $excludedCount)` 且 `$excludedCount -gt 0`。
   - 驗證 `retainedPublicCount -eq $rawPublicCount` 且 `$rawPublicCount -gt 0`（若需檢查核心表數，後續步驟 7 已有 `psql` 結構斷言把關）。

---

## 五、測試計畫（修正後應新增之測試）

1. **TOC ID 整體漂移測試（Shifted IDs）**：模擬 `4791` 為 `ACL - SCHEMA storage supabase_admin`，而 10 筆 `vault` 項目平移至其他 ID（如 `4798` 等），驗證腳本能完整保留 `storage` 項目並精準排除所有平移後的 `vault` 項目。
2. **非 Vault 系統物件保護測試**：驗證含 `storage`、`auth`、`supabase_admin` 的項目不被誤刪。
3. **動態總筆數不變量測試**：驗證當總有效筆數因平台 schema 變動而不再是 919/926 時，只要 `retained == raw - excluded` 且 `public` 100% 保留、`vault` 0 殘留，仍可通過驗證；反之若漏排任何 `vault` 或誤刪任何 `public`，必須立即失敗。
4. **保留既有負向測試**：重複 ID、BOM/CRLF 注入、缺少 `pgcrypto`/`uuid-ossp`/`pg_stat_statements` 必須繼續失敗。

---

## 六、Git HEAD、工作目錄與暫存檔清理狀態

- **Git `HEAD`**：`86a0f1116693bcce476b8747a446900d54b29a4a`
- **工作目錄狀態 (`git status --short`)**：103 筆（未對任何程式碼或測試執行修改）
- **AUTH-02 備份目錄清理結果（**PASS**）**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_SUPABASE_20261112_211508` 內僅有 4 個正式檔案（`backup_info.json`、`code_to_know_supabase_prod.dump.c2kb`、`code_to_know_supabase_prod.dump.c2kb.sha256`、`code_to_know_supabase_prod.dump.sha256`），**無任何 `.dump`、`.toc` 或 `.list` 暫存檔殘留**。

---

## 七、最終狀態標記

- **DIAGNOSTIC STATUS**：**PASS**（已精準定位根因與所有同類型假設）
- **AUTH-03 RESTORE STATUS**：**BLOCKED**（須待使用者授權依第四節方案修正 `restore_pg17_sandbox.ps1` 與其測試後，再重新執行本機隔離還原）
