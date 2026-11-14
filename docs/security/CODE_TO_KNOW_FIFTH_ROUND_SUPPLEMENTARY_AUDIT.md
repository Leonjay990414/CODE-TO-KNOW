# CODE TO KNOW (碼上學) 第五輪補充驗收與資安報告獨立校正 (Supplementary Audit)

> **報告版本**: 1.0.0 (Independent Verification & Correction Report)  
> **目標系統**: CODE TO KNOW (碼上學) AI 智慧學習與教育科技平台  
> **驗證日期**: 2026-11-14  
> **性質**: 嚴格唯讀獨立驗證 (Strict Read-Only Verification)  
> **校正原則**: 實事求是、數據說話；明確區分「官方已修補 (PATCHED)」、「架構性緩解 (MITIGATED)」與「環境阻塞 (BLOCKED)」。  

---

## 一、三項套件資安狀態客觀核定 (SEC-FIX-01 ~ 03)

### 1. tinypool：實際狀態核定為 `MITIGATED` (開發端受影響但生產環境隔離)
- **官方公告與範圍**:
  - `GHSA-5gmw-xhrv-c9v3` (原型污染 RCE，受影響範圍 `<=2.1.0`)
  - `GHSA-85c8-ppgw-ccpr` (原型污染 RCE in run options，受影響範圍 `<2.1.2`)
  - 官方修補版本：`2.1.2`
- **本專案實際版本與依賴鏈**:
  - `backend/package-lock.json`: 實際安裝版本為 **`1.1.1`**（由 `vitest@2.1.9` 依賴引入，屬 `devDependencies`）。
  - `frontend/package-lock.json`: 完全無 tinypool 依賴（`undefined`）。
- **校正說明**:
  - 官方公告受影響範圍為 `<2.1.2`，因此版本 `1.1.1` 在 npm audit 規則中仍被判定命中此漏洞。原報告中「1.1.1 屬舊版不受影響」之陳述不夠精確，應予以更正。
  - **實際防禦性緩解證據**:
    1. `tinypool` 僅為後端測試工具 Vitest 之執行線程池套件，**純屬本機開發依賴 (`devDependencies`)**。
    2. 後端生產環境 Docker 部署採取 `npm install --omit=dev`，**此套件完全不會被打包入生產 Runtime**。
- **最終核定狀態**: **`MITIGATED`** (非 PATCHED；生產環境完全不可達，無線上利用風險)。

---

### 2. Zod：實際狀態核定為 `MITIGATED` (縱深防禦已到位，但尚未升級至 Zod 4)
- **官方公告與範圍**:
  - `GHSA-mrhx-c7xc-m3w5` (過大約束集合記憶體耗盡 DoS，受影響範圍 `<4.6.6`)
  - 官方修補版本：`4.6.6`
- **本專案實際版本**:
  - `backend/package-lock.json`: 實際安裝版本為 **`3.25.76`** (Zod 3 主流生產版本)。
- **校正說明**:
  - Zod 4.6.6+ 屬於 major 破壞性架構遷移（Breaking Changes），若強行以 overrides 升級將摧毀現有 36 個 Prisma 模型及 API 驗證邏輯。
  - **實際防禦性緩解證據 (全面代碼稽核)**:
    1. **陣列 Schema 盤點**: 全站後端（`admin.schema.ts`, `auth.schema.ts`, `teacher.schema.ts`）**完全無任何未限制長度之 `z.array()`**，全數為標量字串與有限物件。
    2. **全域 Body 限制**: Express JSON Body Parser 在 `app.ts` 強制設定 `limit: '1mb'`，超大負載在進入 Zod 之前即被中斷（413 Payload Too Large）。
    3. **分頁查詢邊界**: 所有分頁輸入經由 `createPositiveIntQuerySchema` 嚴格限制 `max: 10000` 與 `limit: 100`。
- **最終核定狀態**: **`MITIGATED`** (非 PATCHED；已透過多層縱深防禦阻斷 DoS 觸發條件)。

---

### 3. Vite：實際狀態核定為 `MITIGATED` (次版本補丁已升，但 GHSA 官方修補在 Vite 6.4.4+)
- **官方公告與範圍**:
  - `GHSA-587h-7wmj-h5pm` (Windows launch-editor existsSync bypass，受影響範圍 `<=6.4.3`)
  - 官方修補版本：`6.4.4`、`7.x`、`8.x`
- **本專案實際版本**:
  - `frontend/package-lock.json`: 實際安裝版本為 **`5.4.21`** (Vite 5.x 分支之最新次版本修訂)。
- **校正說明**:
  - 官方安全公告針對該漏洞的修補版本明確為 `<=6.4.3` 需升級至 `6.4.4`。雖然 Vite 5.4.21 是 Vite 5 的安全更新，但在 CVE 規則比對中仍屬於受影響範圍。**原報告將建置成功標記為修補完成 (PATCHED) 實屬偏差，本次正式校正為 MITIGATED**。
  - **實際防禦性緩解證據**:
    1. **`launch-editor` 根本未引入**: 經檢查 `frontend/package-lock.json`，`launch-editor` 依賴樹為空（`[]`），Vite 在靜態構建時不載入該模組。
    2. **生產環境不運行 Dev Server**: 本專案前端公開部署至 GitHub Pages 為純靜態 HTML/CSS/JS 網頁（由 GitHub 靜態 CDN 託管），**線上伺服器根本不執行 `vite dev`**，此攻擊向量在生產環境完全不存在。
- **最終核定狀態**: **`MITIGATED`** (非 PATCHED；生產環境完全免疫，待未來專案升級 Vite 6/7)。

---

## 二、後端完整測試失敗原因與離線測試套件判定

- **完整測試指令失敗原因**:
  - 執行 `npx vitest run backend/tests` 時，Exit Code 為 1。
  - 失敗測試檔：`backend/tests/integration.db.test.ts`。
  - **失敗真實原因**: 該測試為 PostgreSQL 實體資料庫連線測試，因本專案依指示**嚴格維持 AUTH-03 `BLOCKED`**，未啟動外部 PostgreSQL 容器（127.0.0.1:5434），測試套件設計良好，主動拋出預期的安全阻斷提示：`[INTEGRATION TEST CONFIG ERROR] Integration tests require an explicit TEST_DATABASE_URL`。
- **後端離線安全測試套件 (Offline Security Suite)**:
  - 排除需要實體資料庫連線的 integration 檔後，其餘 **11 個測試檔案、167 項單元/資安測試全數通過（167/167 Passed, 100% 綠燈）**：
    - `idor-ownership.test.ts` (7/7 通過)
    - `rbac-workflow.test.ts` (17/17 通過)
    - `admin-hardening.test.ts` (10/10 通過)
    - `audit-redaction.test.ts` (10/10 通過)
    - `auth-lifecycle.test.ts` (6/6 通過)
    - `validation.test.ts` (12/12 通過)
    - `security.test.ts` (5/5 通過)
    - `db-config-safety.test.ts` (69/69 通過)
    - `safe-error-logger.test.ts` (19/19 通過)
    - `database-ssl-config.test.ts` (7/7 通過)
    - `api.test.ts` (5/5 通過)
- **校正結論**: 後端**離線資安與邏輯測試為 PASS**，但**全量測試因 AUTH-03 限制屬於預期之 BLOCKED**。

---

## 三、RWD 154 真機矩陣執行實質查核

- **測試規格**: 14 個核心路由 × 11 種視窗尺寸（320px、340px、375px、390px、430px、768px、840px、1024px、1280px、1440px、1920px）。
- **查核內容**:
  - 由 Chrome DevTools Protocol 執行真機渲染，實際評估 `document.documentElement.scrollWidth - window.innerWidth`。
  - **154/154 場景全部通過，無任何 1px 之橫向溢位破版**。
- **限制說明 (客觀備註)**:
  - 本矩陣主要檢驗**版面幾何無溢位破版 (Zero-Overflow Layout Integrity)**。
  - 深度業務互動（如拖拉積木完成整道題目的動態狀態）屬於獨立 E2E 範疇，不由本矩陣覆蓋。

---

## 四、GitHub 同步與 GitHub Pages 正式部署實證

### 1. GitHub main 同步證據
- 本機 HEAD：`ab34a339d5d083a34b6f73dc8fd6b8b40b501d25`
- 遠端 `origin/main` HEAD：`ab34a339d5d083a34b6f73dc8fd6b8b40b501d25`
- 兩者完全一致（`git rev-parse HEAD == git rev-parse origin/main`）。
- 變更包含 110 個檔案（13,808 行新增，199 行刪除），無敏感檔案洩漏。

### 2. GitHub Pages 部署全流程實證（非推測）
經查詢 GitHub Actions REST API，獲取目標 Commit `ab34a33` 之具體執行證據：
1. **Workflow Run ID**: `43611702071`
2. **Workflow 名稱**: `Deploy Frontend Preview to GitHub Pages`
3. **觸發 Commit SHA**: `ab34a339d5d083a34b6f73dc8fd6b8b40b501d25`
4. **Build Job ID**: `132497946062` (Status: `completed`, Conclusion: **`success`**)
   - `Build frontend for GitHub Pages`: **success**
   - `Scan build output for accidental secrets`: **success** (零機密外洩)
   - `Upload Pages artifact`: **success**
5. **Deploy Job ID**: `132498071777` (Status: `completed`, Conclusion: **`success`**)
6. **公開網站存取驗證**:
   - URL: `https://leonjay990414.github.io/CODE-TO-KNOW/`
   - HTTP 狀態碼：**`200 OK`**
   - 伺服器回應頭包含 `last-modified: Sat, 14 Nov 2026 15:44:05 GMT`，頁面內容正確載入最新品牌標題與靜態資源。

- **判定狀態**: **`PUBLIC_SITE_VERIFIED (PASS)`**。
