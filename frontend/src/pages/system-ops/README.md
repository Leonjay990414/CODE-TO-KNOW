# System Ops｜系統營運與監控後台 (Level 5)

## 一、層級定位
- **架構層級**：第五層（Level 5）- 系統營運與監控後台（Web Pages - System Operations & Telemetry）
- **主要對象**：DevOps 工程師、系統維運架構師、資訊安全主管。
- **技術規範**：React + TypeScript + Vite 元件（`.tsx`）。

## 二、層級職責
1. **系統健康狀態監控**：伺服器運作狀態、API 即時延遲、記憶體用量與 CPU 負載。
2. **資料庫連線監控**：PostgreSQL 連線池狀態、慢查詢日誌、Prisma 查詢指標。
3. **安全審計日誌（Audit Logs）**：高風險操作日誌、登入異常遙測、身分驗證失敗記錄、IP 存取稽核。
4. **遙測與錯誤分析**：前端 Error Boundary 遙測回報、API 異常狀態碼追蹤、學生端學習行為遙測。
5. **排程與佇列監控**：電子郵件佇列監控、題庫非同步匯入排程狀態。

## 三、預計收納頁面清冊（待後續搬移階段拆分實作）
- `SystemHealthPage.tsx`：由目前 `AdminDashboardPage.tsx` 內部之「系統健康度（Health Tab）」拆分出之獨立監控儀表板。
- `SystemAuditLogsPage.tsx`：由目前 `AdminDashboardPage.tsx` 內部之「安全審計日誌（Audit Tab）」拆分出之獨立安全稽核介面。
- `SystemTelemetryPage.tsx`：系統錯誤與使用者學習行為遙測監控面板。

## 四、權限與隔離邊界
- **維運人員最高安全邊界（Protected - Ops / SuperAdmin）**：
  - 需具備 `SYSTEM_OPERATOR` 專屬角色或系統管理員權限。
  - **重要架構邊界**：維運層僅負責技術穩定性與安全性，不得干涉具體教育教學業務；平台管理員（Level 4）無權未經授權存取未脫敏之系統日誌與底層基礎設施設定。
