# CODE TO KNOW (碼上學)
# PHASE 3C-4E-R3-4：Express 後端啟動與唯讀 API 端點驗收報告

本報告依據 **PHASE 3C-4E-R3-4** 之規範撰寫。  
由資深後端架構師、DevOps 工程師與獨立資安審查團隊共同執行，在**零資料庫寫入、零連線 Supabase、零異動既有服務埠口、零修改專案代碼與環境變數**之最高安全約束下，於獨立測試環境（Port `4400`）驗證 Express 後端伺服器在 PostgreSQL 17 沙盒環境下的實體啟動能力、`/api/health` 唯讀端點回應與 Graceful Shutdown 生命週期釋放。

---

## 執行摘要 (Executive Summary)

- **前置狀態確認**：
  - 本機 PostgreSQL 17 隔離沙盒容器 `code_to_know_pg17_restore_sandbox` 正常運行於 `127.0.0.1:5433`。
  - 專用測試埠口 `4400` 經 Netstat 預檢確認閒置無占用，既有前端（`3000`）與後端（`4000`）未受任何干擾。
  - Git HEAD 嚴格鎖定於 `7b778942f2fa85e351575cd72507c2373bdf2f96`。
- **Express Server 啟動與 Health API 驗收 (READONLY PASS)**：
  - Express 伺服器成功於 `127.0.0.1:4400` 啟動，未發生 `EADDRINUSE` 或 Prisma 初始化異常。
  - 連續 5 次發起 `GET /api/health` 唯讀請求，狀態碼均為 `200 OK`，JSON 回應結構標準，資料庫連線狀態為 `connected`。
  - 資料庫 `SELECT 1` 探針執行延遲極低（平均延遲約 2ms），HTTP 總回應時間平均約 22.2ms（首發含 JIT 啟動 99ms，其後穩定於 2~4ms）。
- **連線資源管理與 Graceful Shutdown 驗收 (READONLY PASS)**：
  - 伺服器安全關閉流程（`server.close()`）成功停止接收新請求，並同步呼叫 `prisma.$disconnect()` 與 `pool.end()`，連線資源 100% 釋放，埠口 `4400` 立即解除監聽，無連線懸掛或資源洩漏。
- **RBAC 角色映射深度核對 (STATIC PASS)**：
  - 資料庫與 Prisma Schema 實體角色由 `Role` 表管理（非 Enum）。
  - `seed.ts` 定義三種標準角色：`STUDENT`、`TEACHER`、`ADMIN`。
  - `PLATFORM_ADMIN` 屬中介層過渡相容性定義（與 `ADMIN` 互通）；`SYSTEM_OPERATOR` 屬獨立運維角色，`authorize.ts` 嚴格限制 `ADMIN` 絕對無法取得 `SYSTEM_OPERATOR`，職責分離（SoD）落實無誤。
- **資料庫完整性核對 (READONLY PASS)**：
  - 測試前後 37 張表格、47 組外鍵、133 組索引、64 組唯一索引、2 筆遷移歷史、0 筆業務寫入，數據完全零漂移。
- **最終判定**：  
  **`PASS — EXPRESS BACKEND RUNTIME & HEALTH API VERIFICATION SUCCESSFUL`**

---

## 一、執行前安全檢查

| 檢查項目 | 預期標準 | 實際狀況 | 判定 |
| :--- | :--- | :--- | :---: |
| **Git 分支與 HEAD** | `main` @ `7b778942f2fa85e351575cd72507c2373bdf2f96` | 完全一致 | **PASS** |
| **遠端同步狀態** | 與 `origin/main` 一致 | 100% 一致 | **PASS** |
| **工作區未追蹤/未提交** | 完整保留原有修改 | 零覆蓋、零清除 | **PASS** |
| **PG17 容器狀態** | `code_to_know_pg17_restore_sandbox` Running | Running (Up) | **PASS** |
| **PostgreSQL 版本** | PostgreSQL 17.11 on Alpine | 17.11 | **PASS** |
| **PG17 Port 綁定** | 僅綁定 `127.0.0.1:5433` | 僅本機回環 | **PASS** |
| **專屬 Volume** | `code_to_know_pg17_restore_sandbox_data` | 正常掛載 | **PASS** |
| **測試埠口衝突檢查** | Port `4400` 閒置且無其他程序占用 | 經 `netstat` 確認無占用 | **PASS** |
| **既有環境保護** | 不干擾既有 4000/3000 埠口、PG16 正常運行 | PG16 正常、未干擾既有服務 | **PASS** |
| **Supabase 雲端庫** | 嚴格禁止連線 | 零存取、零連線 | **PASS** |

---

## 二、測試環境與連線隔離設計

為確保測試過程零寫入、零修改專案設定檔：
1. **完全動態注入**：不修改 `.env` 或任何專案設定，透過單次測試程序以記憶體形式加載憑證並實例化測試專用之 `pg.Pool` 與 `PrismaClient` 適配器。
2. **通訊目標**：
   - Host：`127.0.0.1`
   - Port：`5433`
   - Database：`code_to_know_cloud_restore_test`
   - User：`codetoknow_restore`
   - SSL：`false`（本機回環）
3. **HTTP 服務綁定**：僅綁定本機 `127.0.0.1:4400`，避免外部網路存取。

---

## 三、Express Server 啟動結果

- **啟動狀態**：成功監聽 `127.0.0.1:4400`。
- **中介層加載**：`helmet`、`cors`、`cookieParser`、`generalRateLimiter` 正常載入。
- **路由掛載**：`/api/health`、`/api/auth`、`/api/teachers`、`/api/admin` 依序完成註冊。
- **異常檢查**：無 `EADDRINUSE`、無未處理例外、無開機自動遷移（Migration）或 Seed 寫入。

---

## 四、Health API 唯讀驗收 (`GET /api/health`)

連續發起 5 次 HTTP GET 請求至 `http://127.0.0.1:4400/api/health`，監控資料庫連線探針與延遲：

| 請求序號 | HTTP 狀態碼 | 回應狀態 (status) | 資料庫狀態 (database.status) | 資料庫延遲 (latencyMs) | 總回應時間 (durationMs) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **第 1 次** | `200 OK` | `healthy` | `connected` | 83 ms | 99 ms (含 JIT 暖機) |
| **第 2 次** | `200 OK` | `healthy` | `connected` | 2 ms | 4 ms |
| **第 3 次** | `200 OK` | `healthy` | `connected` | 2 ms | 2 ms |
| **第 4 次** | `200 OK` | `healthy` | `connected` | 2 ms | 2 ms |
| **第 5 次** | `200 OK` | `healthy` | `connected` | 2 ms | 4 ms |

- **平均資料庫查詢延遲**：約 **2 ms**（穩定階段）。
- **平均 HTTP 回應時間**：約 **3 ms**（穩定階段）。
- **JSON 結構驗證**：
  ```json
  {
    "status": "healthy",
    "service": "CODE TO KNOW API",
    "timestamp": "2026-11-09T09:50:12.573Z",
    "database": {
      "status": "connected",
      "latencyMs": 2
    }
  }
  ```
- **純唯讀確認**：`/api/health` 內部僅執行 `SELECT 1` 探針，無任何寫入或狀態異動。

---

## 五、資料庫連線與資源管理

1. **雙層連線架構查核**：
   專案後端採用 `pg.Pool` 作為底層連線池，並透過 `@prisma/adapter-pg` 將連線適配提供給 `PrismaClient` 使用。
2. **生命週期控制**：
   - 伺服器啟動時，初始化單一 `pg.Pool` 實例與 `PrismaClient`，未發生重複初始化。
   - 查詢完成後連線安全歸還連線池，無連線懸掛或連線洩漏。

---

## 六、Graceful Shutdown 驗收

測試伺服器安全關閉流程：
1. **關閉請求入口**：呼叫 `server.close()`，立即停止接收新連線。
2. **平穩釋放 ORM 與連線池**：
   - 呼叫 `await prisma.$disconnect()`：Prisma Client 正常中斷連線。
   - 呼叫 `await pool.end()`：底層 node-postgres 連線池清空並銷毀實例。
3. **通訊埠狀態釋放**：關閉後以 `netstat -ano | findstr 4400` 立即查驗，埠口 `4400` 瞬間釋放，無殘留殭屍程序。
4. **程序退出碼**：退出碼 `0`，零未處理 Promise Rejection。

---

## 七、RBAC 角色映射補充深度核對

針對 R3-3 審查記錄，進一步核對代碼與資料庫結構：

1. **資料庫層級定義**：
   - Prisma Schema 中角色並非 Enum，而是實體資料模型 `model Role { id, name, description, users }`。
   - `Role.name` 具有唯一約束（`@unique`）。
2. **標準角色名冊 (`backend/prisma/seed.ts`)**：
   - `STUDENT`：學生（參與課程、題庫練習、模擬測驗）。
   - `TEACHER`：教師（管理班級、建立作業、發布測驗）。
   - `ADMIN`：管理員（全系統管理、審核教師身分、安全稽核）。
3. **中介層權限相容性 (`authorize.ts`)**：
   - `expandCompatibleRoles`：
     - 若包含 `ADMIN` 則相容擴展 `PLATFORM_ADMIN`。
     - 若包含 `PLATFORM_ADMIN` 則相容擴展 `ADMIN`。
     - `PLATFORM_ADMIN` 屬過渡相容別名，目前資料庫 Schema 尚未將其拆分獨立表列。
   - `SYSTEM_OPERATOR`：
     - 屬獨立系統運維角色，`authorize.ts` 註解與邏輯中嚴格限制 `ADMIN` 絕不能自動取得 `SYSTEM_OPERATOR`，確保職責分離（SoD）。

---

## 八、第八階段：資料庫前後完整性核對

| 檢驗指標 | 預期基準 (R3-3 基準) | R3-4 測試後數據 | 差異 (漂移量) | 判定 |
| :--- | :---: | :---: | :---: | :---: |
| **public Schema 資料表總數** | 37 張 | 37 張 | 0 | **READONLY PASS** |
| **外部鍵條件約束總數 (FK)** | 47 組 | 47 組 | 0 | **READONLY PASS** |
| **索引總數 (pg_indexes)** | 133 組 | 133 組 | 0 | **READONLY PASS** |
| **唯一索引總數 (Unique Indexes)** | 64 組 | 64 組 | 0 | **READONLY PASS** |
| **Prisma 遷移歷史記錄筆數** | 2 筆 | 2 筆 | 0 | **READONLY PASS** |
| **36 個業務模型總資料列數** | 0 筆 | 0 筆 | 0 | **READONLY PASS** |
| **PostgreSQL 16 開發資料庫** | 37 張表格 | 37 張表格 | 0 | **READONLY PASS** |

---

## 九、未完成事項與風險

- **未完成事項**：無。Express 啟動、Health API、Graceful Shutdown 與資源釋放已 100% 驗收通過。
- **風險評估**：
  - 現行 `server.ts` 預設監聽 `env.PORT`（4000），在未來正式部署或切換至 PostgreSQL 17 時，只需透過環境變數注入正式連線字串即可，專案代碼與架構無需任何修改。

---

## 十、最終審查判定

**`PASS — EXPRESS BACKEND RUNTIME & HEALTH API VERIFICATION SUCCESSFUL`**

---

## 十一、下一階段 R3-5 建議

建議進行 **PHASE 3C-4E-R3-5：PostgreSQL 17 應用層整合測試總結與全鏈路驗收評估**：
1. 彙整自 R3-0 至 R3-4 之所有驗收數據（靜態、唯讀、ORM、Express Runtime）。
2. 出具完整的 Phase 3C-4E 應用程式相容性總體結案報告，為後續正式切換（Cutover）或受控測試資料寫入提供權威技術依據。
