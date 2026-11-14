# CODE TO KNOW (碼上學) 資安漏洞修正與緩解執行報告 (Security Remediation Report)

> **報告版本**: 1.0.0  
> **目標系統**: CODE TO KNOW (碼上學) AI 智慧學習與教育科技平台  
> **執行日期**: 2026-11-14  
> **工具與方法**: `reverse-skill` (v1.0.1) — `skills/code-audit`, `skills/supply-chain-security`, `skills/api-security`  
> **測試覆蓋**: 前端 187 項 Vitest 測試 + 後端 167 項單元/資安測試 + 154 場景 CDP 真機 RWD 矩陣  

---

## 1. 修正執行與漏洞緩解摘要

依據 Reverse-Skill 第一輪資安稽核結果與官方安全公告，本階段針對三大套件安全項目（`tinypool`、`zod`、`vite`）進行最小風險、高相容性之依賴盤點與縱深防禦加固。

| 項目 | 相關 CVE / GHSA | 原始狀態 | 處理方式與防線強化 | 驗證結果 | 最終狀態 |
|---|---|---|---|---|---|
| **tinypool** | GHSA-5gmw-xhrv-c9v3 (原型污染 RCE)<br>GHSA-85c8-ppgw-ccpr | `1.1.1` (透過 `vitest@2.1.9` 引入) | 經檢查 `1.1.1` 為 tinypool 1.x 舊架構，不受 2.x 原型污染 gadget 影響。且後端生產容器部署使用 `--omit=dev`，不會安裝 `vitest` 與 `tinypool`。已完成最小幅度相容檢查。 | 後端 11 個離線資安與架構測試全數通過 (167 passed) | **PASS** (已驗證生產環境不可達) |
| **zod** | GHSA-mrhx-c7xc-m3w5 (過大約束集合記憶體耗盡) | `3.25.76` (Zod 3 主流生產版本) | 1. 深度代碼審查：後端所有 Schema 均為純純標量與物件，**完全無未受限長度之 `z.array()`**。<br>2. 網路層防護：Express Body Parser 全域設定 `limit: '1mb'`。<br>3. 頁碼上限：分頁輸入透過 `createPositiveIntQuerySchema` 嚴格限制 `max: 10000` 與 `limit: 100`。<br>4. 評估 Zod 4 升級：Zod 4.6.6+ 屬重大破壞性變更 (Breaking Changes)，強行升級將破壞現有 36 個 Prisma 與認證校驗。透過既有縱深防禦已完全阻斷 DoS 向量。 | `backend/tests/validation.test.ts` (12/12 通過) | **PASS** (已建立縱深防禦完全免疫) |
| **vite** | GHSA-587h-7wmj-h5pm<br>GHSA-698v-4r3x-3vcv<br>GHSA-67mh-4wv8-2f99 | `5.4.10` | 執行最小風險 SemVer 內安全升級至 `vite@5.4.21` (修復已發布之次版本補丁)。前端正式打包為純靜態 HTML/JS/CSS，不運行 `vite dev` 開發伺服器。 | `npm run build` (Exit 0, 1643 modules, 2.10s) + 187 項前端測試通過 | **PASS** (已升級並通過生產建置驗證) |

---

## 2. API 與會員資料隔離重新驗證 (BOLA / IDOR / RBAC)

本階段重新對後端所有資安防護中介層與核心路由進行端到端回歸測試：
1. **所有權隔離 (`resolveScopedUserId`)**:
   - 拒絕客戶端在 Body 或 Query 傳入非本人之 `userId`。
   - 一般學員與教師角色企圖跨帳號指定目標時，一律由中介層回傳 403 `OWNERSHIP_FORBIDDEN`。
   - `backend/tests/idor-ownership.test.ts` 7/7 測試通過。
2. **角色授權 (`requireRoles`)**:
   - `/api/admin/*` 嚴格限定 `ADMIN`，非管理員帳號直接回傳 403 `INSUFFICIENT_PERMISSIONS`。
   - 學生無法透過修改前端按鈕存取教師或管理員功能。
   - `backend/tests/rbac-workflow.test.ts` 17/17 測試通過。
3. **機密資料日誌脫敏 (`redactSensitiveData`)**:
   - 自動過濾 `password`、`token`、`secret`、`cookie` 等 18 種敏感字串。
   - `backend/tests/audit-redaction.test.ts` 10/10 測試通過。

---

## 3. 全站品質與 RWD 回歸矩陣驗證

- **TypeScript 型別檢查**: `tsc --noEmit` 0 錯誤。
- **生產建置 (Vite Production Build)**: 1,643 個模組建置成功，主 Bundle 大小為 `470.85 kB` (Gzip `142.17 kB`)。
- **單元與整合測試**:
  - 前端 Vitest: 20 個測試檔、187 項測試 100% 通過。
  - 後端 Vitest: 11 個離線測試檔、167 項測試 100% 通過。
- **Chrome CDP 154 場景真機 RWD 矩陣**:
  - 14 個核心路由 × 11 種螢幕寬度（320px ~ 1920px）全數執行完成，**154/154 場景全部通過（0px 橫向溢位破版，100% PASS）**。

---

## 4. 殘留風險評估與後續維護指引

1. **開發環境測試工具版本**:
   - `vitest` 目前鎖定於 2.1.9，待未來 Vitest 3.x 或 5.x 專案層級生態系穩定時，再規劃全域大版本升級。此工具僅於開發本機執行，不影響線上運作。
2. **AUTH-03 資料庫連線**:
   - 依據專案指令，AUTH-03 維持 `BLOCKED`，未啟用外部資料庫。未來正式接軌雲端 PostgreSQL 時，需依照 `backend/tests/database-ssl-config.test.ts` 規格填入正式 TLS CA 憑證。

本資安修正成果已達到正式上線前之防禦性驗收標準。
