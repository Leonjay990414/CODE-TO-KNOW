# CODE TO KNOW｜PHASE 3C-4F-R10
# 備份安全與排程執行核對清單 (Backup Security Checklist)

> **制定日期**：2026-11-09  
> **適用目標**：CODE TO KNOW（碼上學）資料庫備份安全、異地存儲與災難復原防護  
> **管理原則**：安全第一、金鑰隔離、實體加密、嚴防未經授權搶先執行

---

## 一、備份安全檢查清單 (Backup Security Checklist)

- [x] **S-01：憑證唯讀掛載**：備份工具採用 `:ro` 模式掛載 Root CA，杜絕憑證遭污染或回寫專案。
- [x] **S-02：映像檔 Digest 鎖定**：鎖定不可變之官方 RepoDigest (`postgres@sha256:3540c0...`)，防範供應鏈攻擊。
- [x] **S-03：密碼管道防洩漏**：密碼透過 Stdin 管道傳入容器內部，宿主機 CLI 與環境變數不暴露明文。
- [x] **S-04：記憶體即時擦除**：密碼使用後立即在 finally 區塊設定為 null 並觸發垃圾回收。
- [x] **S-05：端點白名單校驗**：連線主機嚴格鎖定於核准之 Session Pooler (`aws-0-ap-southeast-2.pooler.supabase.com:5432`)。
- [ ] **S-06：備份靜態加密 (規劃待實作)**：未來產出之 Dump 檔案需使用 AES-256-CBC 進行對稱加密。
- [ ] **S-07：加密金鑰分離保管 (規劃待實作)**：解密金鑰 (`BACKUP_ENCRYPTION_KEY`) 與備份檔案存儲空間完全實體分離。

---

## 二、排程檢查清單 (Schedule Checklist)

- [x] **SC-01：現有排程狀態清查**：確認目前專案**完全沒有任何自動排程**（0 個 Cron、0 個 GitHub Workflow）。
- [x] **SC-02：排程時間避開高峰**：未來排程時段設定於每日凌晨 03:00（台灣時間），避免影響白天學習與測驗流量。
- [x] **SC-03：排程冪等性防護**：每次備份以獨立時間戳記命名目錄，即使同一分鐘重複執行亦不發生衝突或覆蓋。
- [ ] **SC-04：GitHub Actions 密鑰注入 (待使用者授權)**：未來需手動於 GitHub Secrets 配置資料庫連線變數。
- [ ] **SC-05：定時心跳連線維護 (待實作)**：定時喚醒機制，防止 Supabase Free Tier 連續 7 天無連線自動休眠。

---

## 三、異地儲存檢查清單 (Offsite Storage Checklist)

- [x] **OS-01：現存備份單點現狀識別**：確認現有備份僅存放於本機硬碟，尚無異地副本。
- [x] **OS-02：零預算異地目標選型**：選定 Cloudflare R2（10GB 免費 / 0 出流量費用）或 GitHub Releases/Artifacts 作為異地空間。
- [ ] **OS-03：異地存儲桶私有化配置 (待設定)**：未來 R2 Bucket 必須關閉公開訪問 (Public Access Disabled)。
- [ ] **OS-04：異地傳輸加密驗證 (待設定)**：傳輸過程強制 HTTPS / TLS 1.3，嚴禁明文傳輸。
- [ ] **OS-05：異地保留過期輪轉 (待設定)**：配置自動過期規則，超過 7 天之每日備份自動刪除，節省空間。

---

## 四、完整性驗證清單 (Integrity Verification Checklist)

- [x] **IV-01：未加密 Dump SHA-256 驗算**：現存備份 Dump 雜湊已獲 100% 重複驗證（`08202DE9D9...`）。
- [x] **IV-02：檔案大小非零核查**：現存 Dump 實體大小恰好為 505,249 Bytes。
- [x] **IV-03：PostgreSQL Custom Format 目錄檢核**：`pg_restore --list :ro` 驗證具備 926 項 TOC Entries。
- [x] **IV-04：失敗自動清理機制**：當 `pg_dump` 異常退出或大小為 0 時，腳本自動刪除殘餘半成品目錄。
- [ ] **IV-05：加密後指紋二次驗算 (待實作)**：未來上傳異地前後，需雙向比對遠端 ETag / SHA-256。

---

## 五、還原驗證清單 (Restore Verification Checklist)

- [x] **RV-01：本地 PG17 沙盒還原成功**：現存生產 Dump 已於 `code_to_know_pg17_restore_sandbox` 成功還原。
- [x] **RV-02：架構與關聯 100% 對齊**：37 張表、47 外鍵、133 索引、64 唯一約束全數通過。
- [x] **RV-03：Prisma Model 映射相容**：全 Model Delegate 與關聯查詢驗收通過 (R3-2)。
- [x] **RV-04：受控寫入與交易回滾驗收**：Prisma 寫入、更新、外鍵防護與 Rollback 全數通過 (R6)。
- [x] **RV-05：防止誤覆蓋正式環境**：還原工具預設強制鎖定本機沙盒，嚴禁預設還原至雲端正式庫。

---

## 六、正式上線前必要條件 (Pre-Go-Live Mandatory Conditions)

在正式上線切換日前，專案團隊必須落實以下備份防線：

1. **[強制] 手動異地備份存檔**：將已驗證之 `code_to_know_supabase_prod.dump`（505,249 Bytes）手動複製一份至加密個人 Google Drive 或離線硬碟。
2. **[強制] 遷移前專屬基線備份**：若上線當天有任何最後微調，必須在操作前 10 分鐘執行手動備份。
3. **[建議] 建立 GitHub Actions 備份排程**：取得授權後，部署每日自動夜間備份管線。

---

## 七、核定結論

本檢查清單已明確區隔「現有已驗證之安全能力」與「未來自動化待落實項目」。專案目前已圓滿完成 Phase 3C-4F-R10 規劃作業，正式進入 **R11：PostgreSQL 最終上線準備總結與全鏈路封關評估**。
