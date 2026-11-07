# CODE TO KNOW（碼上學）
# 正式建置前驗收查檢表 (DATABASE PRE-BUILD CHECKLIST)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0
- **查檢日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_PREBUILD_CHECKLIST.md`
- **狀態標記規範**：
  - **`PASS`**：已有實際客觀證據，驗收通過。
  - **`FAIL`**：檢查發現明確錯誤或不合規。
  - **`BLOCKED`**：因實體環境或外部服務未啟動而阻塞。
  - **`NEEDS USER CONFIRMATION`**：需使用者人工確認、決策或提供安全金鑰。
  - **`NOT TESTED`**：本次未執行測試。

---

## 一、基礎架構與環境查檢清單

| 編號 | 查檢項目 | 檢驗標準與依據 | 驗收狀態 | 備註與客觀證據 |
|:---:|---|---|:---:|---|
| **ENV-01** | **Docker CLI 安裝狀態** | 系統中已安裝 Docker 命列工具。 | **`PASS`** | `Docker version 29.9.2, build a82e528`。 |
| **ENV-02** | **Docker Desktop / Engine 狀態** | Docker 守護進程正在運作，可連線至 Docker API。 | **`BLOCKED`** | `dockerDesktopLinuxEngine` 具名管道未連線，服務未啟動。 |
| **ENV-03** | **本機 5432 埠位狀態** | 埠位未被其他本機資料庫程序佔用。 | **`PASS`** | `Get-NetTCPConnection` 實測無衝突程序監聽。 |
| **ENV-04** | **本機容器設定一致性** | `docker-compose.yml` 與 `.env` 帳號資料庫吻合。 | **`PASS`** | 使用者 `codetoknow`、資料庫 `code_to_know` 一致。 |
| **ENV-05** | **Supabase 專案參數就緒** | 具備主機、區域、埠位、帳號資訊。 | **`PASS`** | AWS Sydney (`ap-southeast-2`)，專案 Ref `ypibmyfxfhsyfdwxprpi`。 |
| **ENV-06** | **Supabase 專案 Active 狀態** | 雲端專案處於活躍連線狀態（未被 7 天休眠暫停）。 | **`NEEDS USER CONFIRMATION`** | 需使用者至 Supabase 控制台確認專案為「Active」。 |
| **ENV-07** | **Supabase 密碼配置** | 正式密碼已妥善保存於雲端託管平台環境變數。 | **`NEEDS USER CONFIRMATION`** | 本機環境不保存雲端密碼，需使用者部署時填入。 |
| **ENV-08** | **Staging 專案實體隔離** | 雲端已配置獨立於 Production 之 Staging 專案。 | **`NEEDS USER CONFIRMATION`** | 目前僅已知 `code-to-know-prod`，建議建立 Staging 專案。 |
| **ENV-09** | **獨立 Test 資料庫配置** | 本機已規劃獨立測試庫 `code_to_know_test`。 | **`BLOCKED`** | 依賴本機 Docker 啟動後建立。 |

---

## 二、Prisma 7 與程式碼品質查檢清單

| 編號 | 查檢項目 | 檢驗標準與依據 | 驗收狀態 | 備註與客觀證據 |
|:---:|---|---|:---:|---|
| **ORM-01** | **Prisma 7 Driver Adapter** | 使用 `@prisma/adapter-pg` 與 `pg.Pool`。 | **`PASS`** | 原生支援連線池與 PostgreSQL 16。 |
| **ORM-02** | **`prisma.config.ts` 語法健全** | 檔案無語法錯誤，能被 Prisma 7 正常載入。 | **`PASS`** | 已排除第 1 行遺留文字，`prisma validate` 成功。 |
| **ORM-03** | **Prisma Schema 語法校驗** | `schema.prisma` 語法合規無衝突。 | **`PASS`** | `npx prisma validate` 回報 Valid 🚀。 |
| **ORM-04** | **現存模型與 Migration 一致性** | 9 個模型與 `20261103000000_init` 完全吻合。 | **`PASS`** | 檔案層級完全對齊無 Drift；實體資料庫 Drift 檢查待啟動連線後執行。 |
| **ORM-05** | **前端 TypeScript 建置** | `npm run build --prefix frontend` 零型別錯誤。 | **`PASS`** | Vite 打包通過，1612 模組全數通過。 |
| **ORM-06** | **後端 TypeScript 建置** | `npm run build --prefix backend` 零型別錯誤。 | **`PASS`** | `tsc` 編譯通過，無錯誤輸出。 |
| **ORM-07** | **前端資料庫契約型別** | 包含公告、通知、角色、成績契約型別。 | **`PASS`** | `frontend/src/types/database-contracts.ts` 完備。 |

---

## 三、安全性、RBAC 與多租戶隔離查檢清單

| 編號 | 查檢項目 | 檢驗標準與依據 | 驗收狀態 | 備註與客觀證據 |
|:---:|---|---|:---:|---|
| **SEC-01** | **伺服端 Session 驗證** | 身分由 HttpOnly Cookie 與資料庫 Session 判定。 | **`PASS`** | `authenticate` 中介軟體已完成並通過單元測試。 |
| **SEC-02** | **零信任前端身分參數** | 查詢條件一律自 `req.user.id` 提取，禁客戶端偽造。 | **`PASS`** | 規範已載明於 RBAC 與 Security Plan。 |
| **SEC-03** | **教師多租戶班級防越權 (BOLA)** | 調閱名冊前強制比對 `ClassTeacher` 授權表。 | **`PASS`** | 後端規範落實，非本班教師回傳 403。 |
| **SEC-04** | **維運者最小權限原則** | `SYSTEM_OPERATOR` 僅能管維護與監控，禁閱學生個資。 | **`PASS`** | 權限邊界已明確切割。 |
| **SEC-05** | **公告富文本防 XSS** | 寫入 `Announcement.content` 前強制 HTML 白名單消毒。 | **`PASS`** | 規範已寫入安全計畫。 |
| **SEC-06** | **學生發布防洗版** | 限制所屬班級發文、每 60 秒至多 1 篇、單日上限 5 篇。 | **`PASS`** | 速率限制機制已規劃。 |
| **SEC-07** | **郵件佇列解耦與個資脫敏** | `EmailQueue` 不重存大 HTML，日誌強制 Email 脫敏。 | **`PASS`** | 規範明確，已誠實標記目前為 Console Mock。 |
| **SEC-08** | **Supabase RLS 防禦定位** | 明確定位 Express 後端為主要防線，RLS 為輔助防線。 | **`PASS`** | 避免 Superuser 自動繞過 RLS 的架構盲區。 |

---

## 四、測試套件分流驗收查檢清單

| 編號 | 測試模組 / 類型 | 測試範圍與測試檔 | 驗收狀態 | 備註與實測證據 |
|:---:|---|---|:---:|---|
| **TST-01** | **Unit Test: RBAC 權限工作流** | `tests/rbac-workflow.test.ts` (9 tests) | **`PASS`** | 9 項測試通過 (4ms)。 |
| **TST-02** | **Unit Test: 輸入驗證與密碼強度** | `tests/validation.test.ts` (12 tests) | **`PASS`** | 12 項測試通過 (6ms)。 |
| **TST-03** | **Unit Test: 安全標頭與密碼雜湊** | `tests/security.test.ts` (5 tests) | **`PASS`** | 5 項測試通過 (197ms)。 |
| **TST-04** | **Unit Test: API 與 CSRF 防護** | `tests/api.test.ts` (5 tests) | **`PASS`** | 5 項測試通過 (178ms)。 |
| **TST-05** | **Integration Test: 實體資料庫讀寫** | `tests/integration.db.test.ts` (1 test) | **`BLOCKED`** | 因本機 Docker 未啟動，5432 連線遭拒被跳過。 |
| **TST-06** | **E2E Test: 跨角色端對端流程** | Playwright / Supertest 完整瀏覽器流程 | **`NOT TESTED`** | 需待實體資料庫上線後執行。 |

---

## 五、正式建置前必要決策與使用者人工作業清單

為進入正式資料庫建置階段，需完成以下**三項具體人工作業**：

1. **[人工作業 1] 啟動本機 Docker Desktop**：
   - 開啟 Windows 上的 Docker Desktop 應用程式。
   - 等待右下角狀態小圖示由橘色轉為綠色「Engine running」。
2. **[人工作業 2] 授權啟動本機 PostgreSQL 容器**：
   - 於專案根目錄執行 `docker compose up -d`。
   - 驗證 `docker ps` 中 `code_to_know_postgres` 顯示為 `Up (healthy)`。
3. **[人工作業 3] 建立獨立測試庫 `code_to_know_test`**：
   - 於本機容器內執行 `createdb -U codetoknow code_to_know_test`，以利執行整合測試。
4. **[使用者決策] 建立 Supabase 獨立 Staging 專案**：
   - 登入 Supabase 控制台，建立 `code-to-know-staging`，確保雲端測試不污染正式營運庫 `code-to-know-prod`。

---

## 六、最安全之下一步執行順序 (Safest Execution Order)

```
[步驟 1: 使用者啟動 Docker Desktop]
       │
       ▼
[步驟 2: 啟動本機容器 docker compose up -d]
       │
       ▼
[步驟 3: 執行本機整合測試 vitest run tests/integration.db.test.ts (目標: 全量 PASS)]
       │
       ▼
[步驟 4: 依照 11 階段計畫逐階擴充 schema.prisma 並產出 Migration]
       │
       ▼
[步驟 5: 於本機執行 seed.ts 灌入經盤點核對之官方題庫與初始資料 (Migration 與 Seed 分開授權)]
       │
       ▼
[步驟 6: 配置雲端 Staging 專案連線字串，執行 prisma migrate deploy 預演]
       │
       ▼
[步驟 7: 預演無誤後，正式套用 Migration 至 Supabase Production (code-to-know-prod)]
```
