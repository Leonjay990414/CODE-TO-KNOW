# CODE TO KNOW｜PHASE 3C-4F-R9
# Session 與 Token 清理機制執行核對清單 (Cleanup Checklist)

> **制定日期**：2026-11-09  
> **適用目標**：CODE TO KNOW（碼上學）身分憑證定期清理與生命週期維護  
> **管理原則**：分析與實作分離、嚴格授權、邊界防護、零有效資料損失

---

## 一、已完成的唯讀分析 (Completed Read-Only Analysis)

- [x] **A-01：資料模型盤點**：確認現有 3 款身分憑證模型（`Session`、`EmailVerificationToken`、`PasswordResetToken`）。
- [x] **A-02：生命週期欄位審查**：確認各模型均具備 `createdAt`、`expiresAt` 及狀態欄位（`revokedAt` / `usedAt`）。
- [x] **A-03：邏輯失效 vs 實體清理界定**：確認目前系統僅具備中介軟體按需檢查（邏輯失效），實體資料庫從未執行實體清理。
- [x] **A-04：清理規則與緩衝期設計**：確立有效憑證絕對保護原則，並導入 7 天安全留存緩衝期（Grace Period）。
- [x] **A-05：部署平台相容性評估**：確認 Render Free Plan 不支援獨立 Cron Job 且有 15 分鐘休眠特性，確立「外部排程觸發內部維護端點」之最佳方案。
- [x] **A-06：索引與資料庫效能評估**：確認目前無 `expiresAt` 索引，小資料量下全表掃描無害，建議未來評估補增索引。
- [x] **A-07：外鍵連鎖安全性審查**：確認子表刪除不影響父表 `User`，無外鍵破壞風險。
- [x] **A-08：驗收測試案例規格化**：制定涵蓋逾期刪除、有效保留、冪等性與異常回滾之 11 項測試案例。

---

## 二、未來實作工作 (Future Implementation Tasks)

本階段為唯讀規劃，以下工作留待未來正式授權實作階段執行：

- [ ] **I-01：後端維護服務模組開發 (`cleanup.service.ts`)**
  - 實作分批刪除邏輯 (`take: 500`)。
  - 封裝 `Session`、`EmailVerificationToken`、`PasswordResetToken` 刪除查詢。
  - 統計並回傳各表刪除筆數。
- [ ] **I-02：專用受保護內部路由建置 (`maintenance.routes.ts`)**
  - 開設 `POST /api/internal/maintenance/cleanup`。
  - 加入 `x-maintenance-key` 中介軟體安全校驗。
- [ ] **I-03：維護金鑰環境變數定義**
  - 於 `backend/src/config/env.ts` 加入 `MAINTENANCE_API_KEY`（可選或正式必填）。
- [ ] **I-04：外部排程觸發器設定**
  - 配置 GitHub Actions 定時工作（或外部安全排程服務），每日定時發送帶金鑰之 HTTP 請求。
- [ ] **I-05：日誌脫敏確認**
  - 確保執行結果僅記錄刪除筆數，絕不洩漏使用者 ID、Token 或連線字串。

---

## 三、必須測試項目 (Mandatory Test Items)

未來清理程式部署至測試環境時，必須逐項實測並留存證據：

- [ ] **T-01：逾期 Session 實體刪除驗證**（`expiresAt` 超過 7 天者確認刪除）。
- [ ] **T-02：有效中 Session 絕對保留驗證**（尚未到期且未撤銷者確認不受影響）。
- [ ] **T-03：剛過期 Session 緩衝保留驗證**（過期未滿 7 天者確認留存供稽核）。
- [ ] **T-04：已撤銷 Session 清理驗證**（`revokedAt` 超過 7 天者確認刪除）。
- [ ] **T-05：已使用驗證 Token 清理驗證**（`usedAt` 超過 7 天者確認刪除）。
- [ ] **T-06：有效驗證信 Token 絕對保留驗證**（24 小時內且未驗證者點擊連結仍可正常通過）。
- [ ] **T-07：有效密碼重設 Token 絕對保留驗證**（1 小時內重設憑證功能不受干擾）。
- [ ] **T-08：連續重複執行測試 (Idempotency)**（連續兩次呼叫，第二次回傳刪除 0 筆且無異常）。
- [ ] **T-09：未授權呼叫防禦測試**（無 Header 或密鑰錯誤時立即回傳 `403 Forbidden`）。
- [ ] **T-10：資料庫連線中斷安全回滾測試**（模擬異常時交易安全 abort，無髒資料殘留）。

---

## 四、需要另外授權的操作 (Explicit Authorization Required)

以下操作涉及程式庫變更與雲端平台設定，**必須取得使用者明確文字授權**：

1. **A-01：修改後端程式碼與新增 API 路由**（新增維護端點與清理 Service）。
2. **A-02：在 Render 後台注入 `MAINTENANCE_API_KEY`**。
3. **A-03：配置與啟用外部定時工作 (GitHub Actions Cron)**。
4. **A-04：未來為 `expiresAt` 欄位新增 Prisma Migration 索引**。

---

## 五、禁止提前執行的操作 (Strictly Prohibited Early Execution)

在未獲得實作授權前，**全團隊嚴格禁止進行以下操作**：

- [x] **X-01：嚴禁在現有正式資料庫或 PG16 上執行手動 `DELETE` 清理**。
- [x] **X-02：嚴禁提前修改 Prisma Schema 或推播 Migration**。
- [x] **X-03：嚴禁在既有業務 Controller 中插入刪除逾期資料的連鎖邏輯**。
- [x] **X-04：嚴禁使用無緩衝期（Grace Period = 0）的激進刪除條件**。
- [x] **X-05：嚴禁在 Log 中印出被刪除紀錄的原始 Token、TokenHash 或 Email**。
- [x] **X-06：嚴禁連線 Supabase 雲端資料庫執行任何測試**。

---

## 六、核定結論

本核對清單明確劃分「分析成果」與「實作防線」。專案目前已圓滿完成 Phase 3C-4F-R9 規劃作業，技術路徑清晰完備，正式進入 **R10：異地備份與自動備份排程規劃**。
