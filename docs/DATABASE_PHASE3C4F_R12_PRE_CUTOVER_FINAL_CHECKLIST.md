# CODE TO KNOW｜PostgreSQL 正式切換前置核對清單與簽核規範 (Phase 3C-4F-R12)

**文件識別碼**：`DOC-DB-PHASE3C4F-R12-CHECKLIST`  
**建立時間**：2026-11-09  
**版次**：v1.0.0  
**前置判定**：`CONDITIONAL GO`（依據 R11 封關評估與 R12 改善計畫）  
**適用範圍**：CODE TO KNOW（碼上學）正式資料庫切換前最終查核、安全把關與授權簽核

---

## 一、文件說明與使用原則

本清單依據 `DATABASE_PHASE3C4F_R12_PRE_CUTOVER_REMEDIATION_PLAN.md` 制定，作為技術團隊與負責人在執行「正式環境切換（Phase 3C-4F-R13+）」前的**硬性安全卡關清單（Gating Checklist）**。

> [!CAUTION]
> **未獲使用者與負責人完整書面／對話授權前，本清單所有待簽核項目維持 `BLOCKED` 或 `UNCONFIRMED`，嚴禁擅自執行正式切換作業。**

---

## 二、正式切換前必要條件核對表 (Pre-Cutover Mandatory Prerequisites)

| 編號 | 檢核項目 | 標準要求 | 負責角色 | 狀態 | 驗證方式／說明 |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **PRE-01** | **Git 基準鎖定** | 本地 `main` 與遠端 `origin/main` 保持一致，HEAD 為 `7b778942f2fa85e351575cd72507c2373bdf2f96` | 核心工程師 | **PASS** | `git status` 與 `git rev-parse HEAD` 確認無衝突無未追蹤程式碼 |
| **PRE-02** | **Prisma Migration 一致性** | `backend/prisma/migrations` 13 筆 migration 本地與 PG17 雜湊 100% 吻合 | DBA | **PASS** | R4~R7 雙向 SHA256 查核全數 PASS |
| **PRE-03** | **PG17 沙盒還原驗證** | 沙盒還原後結構完整、外鍵正確、Unique 約束正常 | DBA | **PASS** | R6 交易完整性測試通過，且已 Rollback 恢復初始基準 |
| **PRE-04** | **最小權限角色建立** | Supabase 建立 `app_runtime`、`migration_admin`、`readonly_auditor` | DBA / 授權人 | **PENDING** | 待使用者授權並至 Supabase SQL Editor 執行 DDL |
| **PRE-05** | **應用程式帳號權限驗收** | 驗證 `app_runtime` 僅具備 DML 權限，無法執行 DDL/DROP | 測試工程師 | **PENDING** | 待使用者授權後執行唯讀/DML 邊界檢驗腳本 |
| **PRE-06** | **CA 根憑證固化** | Supabase CA Cert 下載至 `backend/certs/`，並加入 Git 追蹤（公開憑證） | 後端工程師 | **PENDING** | 需取得 `prod-supabase-ca.crt` 並設置程式碼路徑 |
| **PRE-07** | **verify-full TLS 驅動升級** | 後端 `database.ts` 支援實體 CA 驗證與主機名比對 | 後端工程師 | **PENDING** | 程式碼修改完成後需先於本地跑過隔離單元測試 |
| **PRE-08** | **備份加密升級 (GCM)** | 升級備份腳本至 AES-256-GCM / `age`，移除 CBC 模式 | 安全工程師 | **PENDING** | 腳本需於獨立測試環境完成還原解密測試 |
| **PRE-09** | **Render 後端服務部署** | Render 建立 Web Service (`code-to-know-backend`)，設定健康檢查 | 運維工程師 | **PENDING** | 待授權於 Render 控制台配置與關聯倉庫 |
| **PRE-10** | **Render 機密變數注入** | `DATABASE_URL`、`JWT_SECRET`、`SESSION_SECRET` 等完成注入 | 專案負責人 | **PENDING** | 嚴禁明文記錄於 Repository 或對話紀錄中 |
| **PRE-11** | **前端 API 端點切換配置** | 前端 `VITE_API_BASE_URL` 支援指向 Render 正式後端網址 | 前端工程師 | **PENDING** | 確認 Render 網址格式與 CORS 白名單配置無誤 |
| **PRE-12** | **切換前即時基準備份** | 切換作業當下執行雲端備份並本地留存驗證 | DBA | **PENDING** | 產出切換前 `pre_cutover_baseline.sql.enc` 與 SHA256 |
| **PRE-13** | **切換維護公告與停機窗口** | 確認切換時段（建議 30 分鐘）、設定維護公告 | 專案負責人 | **PENDING** | 預備維護通知畫面與維護應變指引 |

---

## 三、安全檢核清單 (Security Check)

| 編號 | 安全檢核項目 | 合規標準 | 審查結果 | 備註 |
| :--- | :--- | :--- | :---: | :--- |
| **SEC-01** | **無明文機密外洩** | 程式碼庫、文件、PR、歷史紀錄無任何資料庫密碼、Token、密鑰 | **PASS** | R1~R12 全程遮罩查核無外洩 |
| **SEC-02** | **資料庫連線白名單** | Supabase 僅允許 Render 出口 IP 或強制 SSL/TLS 雙向加密 | **REVIEWED** | 依賴 TLS 加密與強密碼保護 |
| **SEC-03** | **應用程式隔離原則** | 後端 runtime 嚴禁使用 `postgres` 超級使用者帳號 | **BLOCKED** | 必須等 PRE-04/05 完成後放行 |
| **SEC-04** | **Token 與 Session 安全** | Cookie 啟用 `HttpOnly; Secure; SameSite=Lax/Strict` | **PASS** | 後端程式碼規格已符合現代標準 |
| **SEC-05** | **防暴破與限流機制** | 登入、註冊、Token 驗證具備 Rate Limiting | **PASS** | Express rate-limiter 模組與中間件就緒 |
| **SEC-06** | **密鑰儲存分離** | 備份密鑰與資料庫密碼不得存放在同一主機或同一雲端平台 | **PLAN READY** | R12 已提出架構設計，待落實密鑰管理 |

---

## 四、備份與災難復原檢核清單 (Backup & DR Check)

| 編號 | 檢核項目 | 標準要求 | 審查結果 | 備註 |
| :--- | :--- | :--- | :---: | :--- |
| **BKP-01** | **歷史備份完整性** | Phase 3C-4C 雲端即時備份檔案與校驗雜湊齊全 | **PASS** | 存在本地且雜湊已留存歸檔 |
| **BKP-02** | **異地備份儲存** | 備份檔上傳至獨立 Cloudflare R2 / AWS S3，設定生命週期 | **PENDING** | 待正式環境儲存桶建置與憑證授權 |
| **BKP-03** | **演練還原能力** | 沙盒還原演練成功率 100%，無資料遺失 | **PASS** | R4、R6 還原演練與交易測試通過 |
| **BKP-04** | **RPO / RTO 目標** | RPO < 24 小時，RTO < 30 分鐘 | **VERIFIED** | 流程規範具備對應架構水準 |

---

## 五、部署與全鏈路檢核清單 (Deployment & Pipeline Check)

| 編號 | 檢核項目 | 標準要求 | 審查結果 | 備註 |
| :--- | :--- | :--- | :---: | :--- |
| **DEP-01** | **前端構建驗證** | `frontend/dist` 生產構建無報錯、SPA 路由重導規則正確 | **PASS** | 前端 Render 靜態站點運行正常 |
| **DEP-02** | **後端容器構建** | Node.js TypeScript 編譯正常，dist 目錄無缺漏 | **PASS** | `backend/dist` 編譯無遺漏 |
| **DEP-03** | **健康檢查端點** | `/api/v1/health` 具備 DB 連線探針與延遲回報 | **PASS** | 程式碼已具備健康檢查路由 |
| **DEP-04** | **CORS 跨來源配置** | 後端 CORS 嚴格限定前端 Render 正式網域 | **PENDING** | 待後端服務部署後確認環境變數 `CORS_ORIGIN` |

---

## 六、回復檢核清單 (Rollback Check)

若正式切換過程中遭遇重大失敗（如資料庫連線超時、Schema 不相容、高延遲阻斷），必須立即依據以下清單執行回滾：

| 步驟 | 回復執行動作 | 判定條件與標準 | 執行耗時 | 負責人確認 |
| :---: | :--- | :--- | :---: | :---: |
| **RB-01** | **宣布切換中止** | 切換後 15 分鐘內健康檢查失敗或 API 錯誤率 > 1% | 即時 | [ ] 未啟動 |
| **RB-02** | **切斷後端流量** | Render 後端暫停服務或降級為唯讀模式 | < 2 分鐘 | [ ] 未啟動 |
| **RB-03** | **前端指針回指** | 前端 `VITE_API_BASE_URL` 回退至前一穩定版本 | < 3 分鐘 | [ ] 未啟動 |
| **RB-04** | **資料庫快照還原** | 若資料庫結構或數據受損，從切換前即時快照還原 | < 15 分鐘 | [ ] 未啟動 |
| **RB-05** | **發布復原公告** | 發布服務恢復公告並記錄切換中斷 Incident Log | < 5 分鐘 | [ ] 未啟動 |

---

## 七、使用者與團隊授權簽核欄位 (Authorization & Sign-Off)

> **重要規範**：正式切換作業**絕對禁止由 AI 自主啟動**。必須由各領域負責人逐項簽核，最後由專案負責人／使用者給予最終明確授權指令。

### 1. 專業領域簽核

| 審查領域 | 審查重點 | 簽核角色 | 簽核狀態 | 簽核時間 |
| :--- | :--- | :--- | :---: | :---: |
| **資料庫安全 (DBA)** | 最小權限角色建立、TLS CA 憑證配置、Schema 一致性 | 資料庫負責人 | **[ WAITING ]** | `YYYY-MM-DD` |
| **系統安全 (Security)** | 機密管理、加密演算法升級 (AES-GCM)、安全標頭 | 資訊安全負責人 | **[ WAITING ]** | `YYYY-MM-DD` |
| **全端架構 (Architect)** | Render 前後端連線、CORS、健康檢查與冷啟動預防 | 架構負責人 | **[ WAITING ]** | `YYYY-MM-DD` |

### 2. 最終 Go / No-Go 授權簽核

| 決策項目 | 決策結果 | 決策說明與限制條件 | 負責人簽章 | 授權時間 |
| :--- | :---: | :--- | :--- | :---: |
| **正式環境切換授權** | **NO-GO**<br>*(當前狀態)* | 待完成 R12 風險改善清單（A 類項目）並提供正式授權指令後，方得轉為 **GO** | 待使用者簽核 | 尚未簽署 |

---
**文件維護記錄**：  
- 2026-11-09: 由 R12 審查流程正式建立，確立切換前 13 項必要條件與 5 步回滾程序。
