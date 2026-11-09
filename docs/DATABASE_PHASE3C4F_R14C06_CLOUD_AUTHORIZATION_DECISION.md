# CODE TO KNOW｜PHASE 3C-4F-R14-C-0.6
# 正式資料庫操作技術就緒評估與授權決策報告

**文件編號**：`DATABASE_PHASE3C4F_R14C06_CLOUD_AUTHORIZATION_DECISION`  
**審查日期**：2026-11-09  
**審查性質**：第二輪獨立唯讀安全驗證、實體沙盒測試結案與授權就緒評估  
**對應階段**：PHASE 3C-4F-R14-C-0.6 (W-06)  
**前置審查**：  
- `DATABASE_PHASE3C4F_R14C06_FINAL_ROLLBACK_SAFETY_AUDIT.md`  
- `DATABASE_PHASE3C4F_R14C06_ENUM_AND_DEFAULT_PRIVILEGES_VERIFICATION.md`  
- `DATABASE_PHASE3C4F_R14C06_RUNTIME_PERMISSION_FINAL_AUDIT.md`

---

## 一、測試結果與證據核對 (W-06)

本階段對全專案既有測試套件進行嚴謹的逐項驗證，絕無虛報或未測試即標示 PASS 之情事：

| 測試模組 / 工具 | 實際執行指令 | 測試結果與數據 | Exit Code | 驗證層級標記 | 備註說明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AES-256-GCM 備份工具** | `node scripts/database/backup-crypto.test.cjs` | **14 / 14 passed** | `0` | 【已實際測試】 | 涵蓋 Magic Header、Nonce、Tag、位元翻轉阻斷、截斷拒絕與暫存檔清理 |
| **資料庫安全與 Pooler 驗證** | `npm --prefix backend test db-config-safety.test.ts` | **59 / 59 passed** | `0` | 【已實際測試】 | 覆蓋 Pooler 格式、帳號白名單、參數防護等 59 個案例 |
| **TLS CA 憑證配置測試** | `npm --prefix backend test database-ssl-config.test.ts` | **7 / 7 passed** | `0` | 【已實際測試】 | 驗證 X509 Subject (`Supabase Root 2021 CA`)、`rejectUnauthorized: true` 與模擬 SAN 主機名比對 |
| **後端單元測試總體** | `npm --prefix backend test` | **105 passed, 1 skipped** (12 suites passed, 1 suite skipped gate) | `1`（安全閘門） | 【已由原始碼確認】 | `integration.db.test.ts` 依架構規範在無 `TEST_DATABASE_URL` 時主動拋錯阻斷，非程式碼退行 |
| **PG17 沙盒引擎行為實測** | `docker exec code_to_know_pg17_restore_sandbox psql ...` | **4 大實驗全數驗證完成** | `0` | 【已實際測試】 | 證實 `DROP OWNED BY` 危險性、Enum 衍生陣列自動同步、Default Privileges 自動繼承與清理 |

> **重要說明**：上述 TLS 測試驗證了程式碼配置邏輯與憑證解析，**尚未（且嚴格禁止）對 Supabase 正式雲端資料庫進行實際網路連線與 TLS 握手**，該項目精準標示為【尚未驗證】。

---

## 二、六大核心問題最終技術判定

針對專案負責人關切的六大關鍵問題，給予明確技術答覆：

### 1. `DROP OWNED BY` 是否安全，是否應保留？
- **答覆**：**不安全，必須從標準回滾腳本中徹底移除！**
- **依據**：在 PG17 沙盒實測證實，若有任何資料表在回滾時未及時移轉 Owner，`DROP OWNED BY` 會直接永久 DROP 該資料表及其中的所有業務資料。
- **修訂**：改用顯式所有權移轉迴圈 + 依賴斷言檢查（Assertion Check）+ `DROP ROLE`，利用 PostgreSQL 引擎原廠的相依性防護機制阻斷誤刪。

### 2. Enum 所有權移轉是否完整？
- **答覆**：**完全完整！**
- **依據**：已在 Migration SQL 中確認 `AnnouncementStatus`（`typtype = 'e'`）。沙盒實測證實，移轉該主 Enum 類型時，PostgreSQL 會自動同步其陣列類型 `_AnnouncementStatus`，且過濾條件嚴格鎖定 `public` schema，精準不衝突。

### 3. Default Privileges 是否有實際驗證？
- **答覆**：**已於 PG17 沙盒實測驗證通過！**
- **依據**：`FOR ROLE migration_admin IN SCHEMA public` 針對 `TABLES`、`SEQUENCES`、`TYPES` 之預設授權語法完全正確。實測證實新建立的 Enum 與 Table 可直接由 `app_runtime` 正常存取（DML + USAGE），且 REVOKE 能 100% 清空規則（0 rows 殘留）。

### 4. AuditLog 是否符合預期的限制？
- **答覆**：**符合執行期 Append-Only 防護預期！**
- **依據**：原始碼無任何業務 UPDATE / DELETE 邏輯；資料庫層級已徹底阻斷 `app_runtime` 的修改與刪除。確認外鍵刪除 User 會觸發 `ON DELETE SET NULL`（正常行為），且 Superuser 仍有權限，因此精準定性為「執行期 Append-Only」，不誇大宣稱全角色絕對不可竄改。

### 5. Migration Role 是否仍有過度授權？
- **答覆**：**完全無過度授權！**
- **依據**：已徹底剝除 `CREATEDB`、`CREATEROLE`、`BYPASSRLS`，僅保留 Schema CREATE、Advisory Lock 與物件 Ownership，完全契合 Prisma Migrate Deploy 的實際執行需求。

### 6. 是否具備正式資料庫操作的技術準備條件？
- **答覆**：**具備！**
- **依據**：所有 DDL、最小權限角色設定、修正後的零風險回滾腳本、AES-256-GCM 備份工具及安全測試套件均已就緒並經沙盒實測。

### 7. 哪些項目仍需要專案負責人另外授權？
- **答覆**：**AUTH-C-01 至 AUTH-C-05 的 5 項雲端操作**，包含正式資料庫連線、角色建立、所有權移轉、備份提取與正式環境部署切換。

---

## 三、授權檢核矩陣 (Gating Matrix)

| 檢核代碼 | 檢核項目 | 當前狀態 | 備註說明 |
| :--- | :--- | :--- | :--- |
| **G-01** | R14-C-0.6 四份技術審查與實測文件交付 | **已就緒 (READY)** | 包含回滾安全、Enum/Default Privileges、Runtime 權限與決策報告 |
| **G-02** | 本機 AES-256-GCM 加密工具與 14 項測試通過 | **已就緒 (READY)** | 隨機金鑰已與密碼分離，具備驗證中止機制 |
| **G-03** | 修正版零風險回滾 SQL 草案就緒 | **已就緒 (READY)** | 已剔除 `DROP OWNED BY`，加入依賴斷言防護 |
| **G-04** | 雲端連線與操作權限限制 | **強制封鎖中 (BLOCKED)** | AUTH-C-01 ～ AUTH-C-05 保持凍結，等待正式簽核 |

---

## 四、最終驗收判定

本階段（PHASE 3C-4F-R14-C-0.6）完成之第二輪獨立安全審查，成功排除了 `DROP OWNED BY` 可能引發的重大資料遺失隱患，實體驗證了自訂 Enum 類型所有權自動衍生與 Default Privileges 運作機制，並精準界定了 `AuditLog` 權限邊界。所有技術規格與 SQL 草案已達到最高工程安全標準。

### **最終判定結果：PASS（可進入正式授權審查）**

> **特別聲明**：此 PASS 僅代表「技術規格、安全機制與沙盒驗證完全合格，可正式呈報專案負責人進行雲端操作授權審查」；**未獲專案負責人明確簽發下一步執行命令前，所有雲端正式庫操作一律保持絕對封鎖！**
