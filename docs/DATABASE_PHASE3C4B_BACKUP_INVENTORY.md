# CODE TO KNOW (碼上學)
# 備份檔案庫存清單 (Backup Inventory)

**文檔版本**：1.0  
**盤點日期**：2026-11-08  
**盤點執行者**：PostgreSQL DBA、資安審查工程師  
**專案名稱**：CODE TO KNOW（碼上學）  
**盤點模式**：100% 唯讀盤點，零破壞、零覆蓋。

---

## 一、備份庫存總覽

| 序號 | 備份識別標籤 | 備份類型 | 實體檔案路徑 | 檔案大小 (Bytes) | SHA-256 數位校驗指紋 | 建立時間 (UTC) | 相容版本 | 驗證狀態 |
| :---: | :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| 1 | `CODE_TO_KNOW_PRE_MIGRATION_20261108_114016` | 本機邏輯備份 (Custom Dump, `-Fc`) | `C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\code_to_know_pre_migration.dump` | 25,685 | `2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085` | 2026-11-08 03:40:28 | PostgreSQL 16.15 | **VERIFIED (已通過獨立還原驗證)** |

---

## 二、實體檔案屬性與雜湊核對詳情

### 檔案 1：`code_to_know_pre_migration.dump`
- **所屬目錄**：`C:\Users\user\Documents\CODE-TO-KNOW_BACKUPS\CODE_TO_KNOW_PRE_MIGRATION_20261108_114016\`
- **檔案大小**：25,685 位元組 (約 25.1 KB)
- **實體時間戳記**：
  - Created: `2026-11-08 11:40:28 (UTC+8)` / `2026-11-08T03:40:28.000Z`
  - Modified: `2026-11-08 11:40:28 (UTC+8)` / `2026-11-08T03:40:28.000Z`
- **SHA-256 核對**：
  - 實際雜湊：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
  - 預期基準：`2DB27F8B817179D3C777BC7109BB95207295E5BE8343BF0741715828E3372085`
  - 比對結果：**100% 精準吻合 (MATCH)**
- **備份內容物摘要**：
  - 來源資料庫：本機 Docker PostgreSQL 16.15 (`code_to_know`)
  - 結構範圍：36 張業務資料表 + `_prisma_migrations`（第一組 Init Migration 後狀態）
  - 格式：PostgreSQL Custom Format (`-Fc`)，支援平行還原與選擇性資料表擷取。

---

## 三、本機隔離驗證資料庫狀態

在先前 PHASE 3C-2C.1 驗證階段所建立之隔離測試資料庫目前維持完整保留：

- **容器環境**：Docker 容器 `code_to_know_postgres` (PostgreSQL 16.15)
- **隔離資料庫名稱**：`code_to_know_restore_test`
- **擁有者**：`codetoknow`
- **編碼**：`UTF8` / `en_US.utf8`
- **狀態**：保留作為未來災難復原演練或備份還原比對之隔離環境，**嚴禁刪除**。

---

## 四、雲端備份現況 (Supabase Cloud Backup)

- **專案名稱**：`code-to-know-prod` (Project Ref: `ypibmyfxfhsyfdwxprpi`)
- **方案等級**：**Free Plan** ($0.00 USD)
- **雲端備份庫存狀態**：**0 筆實體下載檔案**。
  - 依據 Supabase 官方備份架構，Free Plan 原廠**不提供**原生每日自動快照備份保留（Retention 0 days），且不提供實體下載連結。
  - 目前雲端僅存有已驗收之 36 張空資料表架構，由 Git 本地兩組 Migration 完整鎖定。
  - 後續需依據《備份與復原策略規劃》建立使用者排程之邏輯備份流程。
