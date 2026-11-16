# 碼上學｜CODE TO KNOW
# Wave 6 結案後補充整合與登入／載入功能獨立驗收報告
**Wave 6: Post-Closure Supplementary Integration, Auth Diagnostics & Loading Experience Review**

- **文件識別**：`WAVE_6_POST_CLOSURE_SUPPLEMENTARY_REVIEW.md`
- **完成日期**：2026-11-16
- **執行工具**：Antigravity IDE
- **全站正式進度保護基準**：**49.166860%**（絕對凍結保護，不因本次診斷與優化重算）
- **226 UID 核准基準**：**PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4**（總計 226 項，完全不變）
- **AUTH-03 邊界狀態**：**BLOCKED**（嚴禁連線遠端 Supabase、嚴禁執行 Prisma Migration、嚴禁建立假測試帳號）
- **task-13717 狀態**：**STOPPED**（嚴格維持停止）
- **五大正式術科題組（104301～104305）**：**100% 絕對凍結保護**

---

## 一、整合範圍與來源文件

本報告旨在整合以下兩份既有獨立成果，並進行嚴格結案後補充校驗：
1. **Wave 6 原始驗證報告**：
   - [docs/development/WAVE_6_FINAL_ACCEPTANCE_AND_EVIDENCE_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/WAVE_6_FINAL_ACCEPTANCE_AND_EVIDENCE_REPORT.md)
   - [docs/development/WAVE_6_FINAL_UID_RECONCILIATION_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/WAVE_6_FINAL_UID_RECONCILIATION_REPORT.md)
2. **登入註冊故障診斷與動態載入優化報告**：
   - [docs/development/AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/development/AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md)
3. **正式基準來源**：
   - [docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/PROJECT_20_PHASE_UNIQUE_WORK_ITEMS_20261113.md)
   - [docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/PROJECT_20_PHASE_PROGRESS_MODEL_20261113.md)

---

## 二、Wave 6 原始核定基準（嚴格凍結）

1. **整體進度基準**：保持 **49.166860%**，未計入 Wave 6 實作或本次診斷與載入優化之任何加分。
2. **226 UID 母體狀態分佈**：
   - **PASS**：70 項
   - **PARTIAL**：79 項
   - **NOT STARTED**：73 項
   - **BLOCKED**：4 項（包含核心阻塞 `AUTH-03`）
   - **合計**：226 項 100% 吻合。

---

## 三、47 UID 狀態保留說明（不擅自重算或升級）

第六波涵蓋之 Phase 10（10 項）、Phase 18（14 項）、Phase 19（11 項）、Phase 20（12 項）共 47 項 UID，其狀態在本次整合中**嚴格維持 Wave 6 原始核定分佈，不因登入診斷或 Loading 優化而擅自更動**：

| Phase | 總項數 | PASS | PASS (保留) | PASS (候選) | PARTIAL | PARTIAL (保留) | NOT STARTED | BLOCKED | 說明 |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| **P10** | 10 | 1 | 0 | 0 | 9 | 0 | 0 | 0 | `EML-002` 通過；9 項模板就緒待商用發信通道 |
| **P18** | 14 | 3 | 1 | 2 | 6 | 2 | 0 | 0 | 3 項通過、1 項歷史保留、2 項候選待簽核、6 項 PARTIAL、2 項保留 |
| **P19** | 11 | 0 | 0 | 0 | 0 | 0 | 8 | 3 | 8 項待部署；3 項受 **AUTH-03 BLOCKED** 封鎖 |
| **P20** | 12 | 0 | 3 | 0 | 2 | 0 | 7 | 0 | 3 項歷史保留、2 項 PARTIAL、7 項白皮書就緒 |
| **總計**| **47** | **4** | **4** | **2** | **17** | **2** | **15** | **3** | **合計 47 項，完全保留** |

---

## 四、測試案例數量差異說明（694 → 703 項）

| 階段 | 前端測試套件 / 案例 | 後端離線套件 / 案例 | 全站總測試案例 | 增量來源說明 |
|---|:---:|:---:|:---:|---|
| **Wave 6 原始驗收** | 51 套件 / 473 案例 | 17 套件 / 221 案例 | **694 案例** | 包含基本套件與 Footer 意見回饋整合測試 |
| **本次補充整合後** | 53 套件 / 482 案例 | 17 套件 / 221 案例 | **703 案例** | **+9 案例**：新增 [loading-screen.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/loading-screen.test.tsx)（+4 項）與 [auth-modal.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/auth-modal.test.tsx)（+5 項） |

- **實測 Exit Code**：前端 `0`、後端離線 `0`，全數 703 個案例 100% 通過（0 失敗、0 略過）。

---

## 五、登入與註冊功能深度診斷結果

### 5.1 四層狀態嚴格分開標示（拒絕混為一談）

依據專案最高客觀驗收原則，嚴格將各層邊界明確區分：

1. **程式碼存在（Code Exists）**：**【已確認】**
   - 前端：`AuthModal.tsx`、`AuthContext.tsx`、`api.ts`。
   - 後端：`auth.service.ts`、`auth.routes.ts`、`auth.controller.ts`、`prisma/schema.prisma`。
2. **單元與離線整合測試通過（Unit Tests Pass）**：**【已確認】**
   - 前端：[auth-modal.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/auth-modal.test.tsx)（5 測試 PASS）、[cross-role-integration.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/cross-role-integration.test.tsx)（15 測試 PASS）。
   - 後端：[auth-lifecycle.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/auth-lifecycle.test.ts)（6 測試 PASS）、[validation.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/validation.test.ts)（12 測試 PASS）、[security.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/security.test.ts)（5 測試 PASS）。
3. **瀏覽器互動驗證（Browser Interaction Verified）**：**【部分完成／展示模式可用】**
   - 對話框 DOM 渲染、輸入欄位、前端 Email 格式與密碼長度防呆校驗、Escape 鍵關閉皆正常。
   - 展示模式（Demo Mode）下一鍵登入可正常更新 SessionStorage 與前端狀態。
   - **但在真實網路模式下，點擊真實登入／註冊目前無法在瀏覽器中成功完成全流程**。
4. **真實後端／資料庫連線成功（Real Backend & DB Live Connected）**：**【未成功／未連線】**
   - 後端 Node.js 伺服器未監聽，資料庫處於安全離線隔離。

---

## 六、本機後端與資料庫連線狀態實測

### 6.1 Port 4000 程序佔用情況與客觀事實界定
- **網路監聽現況**：本機 `0.0.0.0:4000` 處於 LISTEN 狀態，由 Windows 系統處理程序 **`LicenseMan`（PID: 4964）** 佔用。
- **客觀事實釐清**：
  - **事實 A**：CODE TO KNOW 的 Node.js 後端服務（`backend/src/server.ts`）**完全未在背景啟動或監聽**。
  - **事實 B**：`LicenseMan` 是外部既有系統程序，監聽了 Port 4000。
  - **事實 C**：當前端向預設之 `http://localhost:4000/api` 發送 TCP 請求時，因連線至 `LicenseMan` 而非 HTTP 伺服器，導致客戶端掛起直至 15 秒連線逾時。
  - **結論**：本機登入請求逾時的根本原因為 **「CODE TO KNOW 後端服務並未運行，且預設通訊埠 4000 被其他系統程序佔用」**。

### 6.2 本機 PostgreSQL 與遠端 Supabase 連線狀態
- 本機 Port 5432 與 Port 5434 均無 PostgreSQL 實體服務運行。
- 專案嚴格維持 **`AUTH-03 BLOCKED`**，未連線遠端 Supabase，未執行正式資料庫 Migration，未注入任何種子帳號。

### 6.3 P1001 錯誤的實際證據與範圍
- 在後端測試 [backend/tests/api.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/api.test.ts) 執行 `/api/health` 探針與 `/api/auth/login` 時，Prisma Client 實測輸出：
  ```text
  prisma:error
  Invalid `prisma.user.findUnique()` invocation in auth.service.ts:113:36
  Can't reach database server at 127.0.0.1:5432 (Code: P1001)
  ```
- 證明目前後端代碼即使手動啟動，只要觸及資料庫查詢，必然因資料庫實體未開通而拋出 P1001 阻斷。

---

## 七、Render Production API 位址重大風險提示

經核對 [frontend/src/services/api.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts#L7-L12)：
```typescript
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const API_BASE_URL = isDemoMode
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');
```

> [!WARNING]
> **重大生產部署風險（Render Production API Fallback Risk）**：
> 1. 當前端部署於 Render Static Site（`https://code-to-know-web.onrender.com`）時，若在 Render 環境變數中**未明確注入 `VITE_API_URL` 或未啟用 `VITE_DEMO_MODE=true`**：
>    - Vite 在編譯階段會將 `'http://localhost:4000/api'` 作為字串常數直接硬編碼（Hardcode）入靜態 JS Bundle 中。
> 2. **導致後果**：
>    - 線上真實訪客在訪問正式網站時，其瀏覽器會嘗試呼叫**該訪客自己個人電腦上的 `http://localhost:4000`**，必然導致全面連線失敗。
> 3. **防範方案**：
>    - 在後端 API 未於 Render 上開通並撥發正式域名之前，正式網站建置時**必須強制注入 `VITE_DEMO_MODE=true`**，或指向未來正式後端 URL。

---

## 八、Loading 動態畫面獨立驗收成果

1. **實際掛載位置**：
   - 掛載於 [frontend/src/app/App.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx#L163-L189) 之 5 大動態分割遊戲路由（`CodePuzzlePage`、`CSSDesignerPage`、`BugHunterPage`、`QuizRushPage`、`WebBuilderPage`）的 `<Suspense fallback={<GameLoadingFallback />}>`。
2. **範疇確認**：
   - **僅用於 Suspense 模組載入**，無未經授權之全站阻擋或侵入。未新增第二套重複 Loading 元件。
3. **真實狀態動態（無虛假百分比）**：
   - 採用無段式動態光環（`c2k-spin`）與掃掠光感指示槽（`c2k-shimmer`），絕不以偽造之「45%」或「80%」誤導使用者。
4. **無障礙與輔具支援**：
   - 容器具備 `role="status"`、`aria-live="polite"` 與 `aria-label="頁面與學習模組載入中"`。
   - 完整支援 `@media (prefers-reduced-motion: reduce)`，在使用者系統設定減少動態時自動停止所有動畫並提供靜態高對比雅緻呈現。
5. **品牌色彩一致性**：
   - 100% 採用官方品牌調色盤：`#26343D`（深炭灰）、`#F5F2EA`（暖象牙）、`#D9E2EA`（迷霧藍灰）、`#8FA9B8` / `#526B7B`（板岩藍灰）、`#BDA77E`（沉穩香檳金）。
6. **多裝置響應式實測**：
   - 320px、375px、768px、1024px、1440px、1920px 均無水平溢出，容器寬度上限設為 380px，卡片排版在手機與寬螢幕皆精緻呈現。

---

## 九、P18-QAS-011 報告文字修正對照

依據正式清冊與專案歷史核定原則，已完成原報告文字之嚴謹校正：

- **原不準確文字**：將 `P18-QAS-011` 之 `PARTIAL (保留)` 標註為「歷史核准保留」。
- **問題根因**：原始 20261113 清冊中 `P18-QAS-011` 原為 `NOT STARTED`，若稱「歷史核准保留」語意不正確。
- **正式修正文字**（已同步回寫至兩份報告）：
  > **「本次依據斷點截圖與檢查成果列為 PARTIAL (保留)，不代表原始清冊已核准通過。」**
- **嚴守界限**：維持 PARTIAL (保留)，**絕不擅自調升為 PASS**。

---

## 十、Git 工作區完整狀態確認

經執行唯讀指令實測：
- **分支**：`develop`
- **最新 Commit**：`6d93d70 docs: add GitHub develop sync and Render Preview readiness report`
- **8 個已追蹤修改檔案（原 Wave 6 7 個 + App.tsx 1 個，無遺失、無未授權覆蓋）**：
  1. `frontend/src/app/App.tsx`
  2. `frontend/src/components/Footer.tsx`
  3. `frontend/src/components/Navbar.tsx`
  4. `frontend/src/components/StudentTeacherDual.tsx`
  5. `frontend/src/pages/public/AICoachPage.tsx`
  6. `frontend/src/pages/public/GameCenterPage.tsx`
  7. `frontend/tests/ai-scaffolding.test.ts`
  8. `frontend/tests/game-onboarding-ux.test.ts`
- **新增未追蹤測試與報告（受控保護，未 Commit）**：
  - `frontend/tests/loading-screen.test.tsx`
  - `frontend/tests/auth-modal.test.tsx`
  - `docs/development/AUTH_LOGIN_REGISTER_AND_LOADING_DIAGNOSTIC_REPORT.md`
  - `docs/development/WAVE_6_POST_CLOSURE_SUPPLEMENTARY_REVIEW.md`

---

## 十一、已完成、部分完成、待確認及阻塞項目矩陣

| 類別 | 項目名稱 | 目前客觀狀態 | 說明與邊界 |
|---|---|:---:|---|
| **已完成** | Wave 6 測試矩陣與 703 項自動化測試 | **PASS** | 雙端測試與打包編譯 0 錯誤 |
| **已完成** | 既有載入畫面動態效果與品牌識別升級 | **PASS** | `GameLoadingFallback` 升級完畢，無障礙與 RWD 完備 |
| **已完成** | FeedbackModal 頁尾入口整合與本機存取 | **PASS** | `Footer.tsx` 點擊喚醒對話框，存入 `localStorage` |
| **部分完成** | 前端登入／註冊 UI 與欄位驗證 | **PARTIAL** | 介面與防呆驗證齊全，展示模式一鍵體驗可用 |
| **部分完成** | 官方郵件服務 (P10) 與題庫系統 | **PARTIAL** | 代碼與模板齊備，待實體發信網域與商用通道 |
| **待確認** | `P18-QAS-001`、`P18-QAS-014` 候選簽核 | **WAITING** | 需專案負責人正式簽核後方可計入正式 PASS |
| **待確認** | Render 生產環境 `VITE_DEMO_MODE` 設定 | **WAITING** | 需負責人確認線上靜態站是否強制鎖定 Demo 模式 |
| **阻塞** | 正式資料庫連線與 Migration (`AUTH-03`) | **BLOCKED** | 嚴格禁止私自連線 Supabase，等待安全會議開通 |
| **阻塞** | 後端開發 Port 4000 衝突與本機伺服器啟動 | **BLOCKED** | Port 4000 被佔用且後端未啟動，需更換 PORT 設定 |

---

## 十二、後續資料庫連接前置條件清單

在專案負責人正式指示進入資料庫連線作業前，必須滿足以下 4 項前置條件：

1. **召開專案安全會議**：正式決策解除 `AUTH-03 BLOCKED` 邊界限制。
2. **後端通訊埠配置調整**：在 `.env` 中將後端監聽通訊埠調整為未被佔用之通訊埠（例如 `PORT=4001` 或 `5000`），避免與 `LicenseMan` 衝突。
3. **資料庫環境就緒**：
   - 本機開發：啟動 Docker PostgreSQL（`127.0.0.1:5432`）。
   - 遠端部署：於 Supabase 開通正式專案，並於後端伺服器注入 `SUPABASE_CA_CERT_PATH` SSL 憑證。
4. **授權執行 Migration**：由專案負責人親自核准後執行 `npx prisma migrate deploy` 與 `scripts/create-admin.ts` 種子帳號建立。

---

## 十三、專案負責人需要確認的決策事項

1. **決策一：是否同意維持 Wave 6 原始進度保護值 49.166860% 與 226 UID 核定狀態不變？**
   - 建議：維持凍結。新完成之診斷與載入優化作為 Wave 6 後續維運資產，不擅自調升總進度。
2. **決策二：是否核准將 `P18-QAS-011` 文字更正為「本次依據斷點截圖與檢查成果列為 PARTIAL (保留)，不代表原始清冊已核准通過」？**
   - 建議：核准採納，恪守語意真實性。
3. **決策三：線上靜態站（Render）是否在後端 API 撥發前，強制指定環境變數 `VITE_DEMO_MODE=true`？**
   - 建議：強烈建議設定 `VITE_DEMO_MODE=true`，徹底避免線上訪客瀏覽器誤向訪客個人 `localhost:4000` 發送無效請求。
4. **決策四：何時安排資料庫安全評估會議以審議解除 `AUTH-03`？**
   - 建議：待專案負責人時間許可時排程審查。
