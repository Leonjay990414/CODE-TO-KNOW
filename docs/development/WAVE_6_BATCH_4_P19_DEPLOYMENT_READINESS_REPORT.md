# 碼上學｜CODE TO KNOW
# 第六波 Batch 4：P19 正式部署前置整備全面報告
**Wave 6: Batch 4 Phase 19 Production Deployment Readiness Comprehensive Report**

- **執行日期**：2026-11-16
- **執行工具**：Antigravity IDE
- **正式整體進度基準**：**49.166860%**（嚴格保護凍結）
- **核准基準狀態**：PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4
- **涵蓋 UID**：`P19-DEP-001` 至 `P19-DEP-011`（共 11 項 UID）
- **最高紀律（絕對邊界）**：
  1. 僅實施部署規格盤點與架構整備，**嚴禁執行任何實體雲端部署**。
  2. 嚴禁觸碰、讀取或輸出真實環境機密密鑰。
  3. 嚴禁修改正式資料庫或執行連線操作。
  4. 嚴格維持 `P19-DEP-004`、`P19-DEP-005`、`P19-DEP-009` 為 **`BLOCKED`**，未經授權絕不解除。

---

## 一、P19 部署整備 11 項 UID 逐項狀態盤點表

| 正式 UID | 正式名稱 | 原始核准狀態 | 原始比率 | 本批次盤點與就緒度依據 | 未覆蓋邊界與阻塞原因 | 建議狀態 |
|---|---|:---:|:---:|---|---|:---:|
| `P19-DEP-001` | 確認正式網域與 DNS 管理權限。 | `NOT STARTED` | 0% | 網域名稱與 DNS 委任規劃（預計 `codetoknow.edu.tw` 或自訂網域） | 實體網域註冊審核與 DNS 託管生效（待上線階段） | **NOT STARTED** |
| `P19-DEP-002` | 設定 HTTPS、安全標頭及必要網域驗證。 | `NOT STARTED` | 0% | Helmet 安全標頭、HSTS、CORS 與 Let's Encrypt 自動憑證規劃已納入架構 | 實體伺服器 SSL 證書握手生效（待雲端綁定） | **NOT STARTED** |
| `P19-DEP-003` | 確認正式前端、後端、資料庫及儲存服務方案。 | `NOT STARTED` | 0% | 前端 Render Static Site、後端 Render Web Service、資料庫 PostgreSQL | 實體雲端付費方案啟用與開通（待專案負責人授權） | **NOT STARTED** |
| `P19-DEP-004` | 設定正式環境變數與 Secret，禁止把密鑰寫入程式碼或文件。 | `BLOCKED` | 0% | `.env.example` 規格完備；全站無明文密鑰洩漏 | **AUTH-03 BLOCKED**（正式雲端 Secret 尚未注入 Render） | **BLOCKED** |
| `P19-DEP-005` | 執行正式資料庫 Migration 與初始資料檢查。 | `BLOCKED` | 0% | `prisma/schema.prisma` 與 Migration 腳本已完成本機校驗 | **AUTH-03 BLOCKED**（嚴禁連線遠端資料庫執行遷移） | **BLOCKED** |
| `P19-DEP-006` | 建立正式管理員帳號並啟用 MFA。 | `NOT STARTED` | 0% | 管理員資料模型、密碼強固性校驗與 TOTP 規格已定義 | 實體生產資料庫種子帳號注入（待資料庫開通） | **NOT STARTED** |
| `P19-DEP-007` | 確認 AI API、郵件服務及用量上限。 | `NOT STARTED` | 0% | `emailQueueService.ts` 80% 警戒預警演算法、AI 離線備援引擎就緒 | 實體 Google Vertex AI 與 SendGrid 付費額度綁定 | **NOT STARTED** |
| `P19-DEP-008` | 設定監控、告警、備份及故障聯絡方式。 | `NOT STARTED` | 0% | `/api/health` 探針健康檢查端點、`safe-error-logger.ts` P0~P3 通報矩陣 | 外部 PagerDuty / Sentry 實體告警通道對接 | **NOT STARTED** |
| `P19-DEP-009` | 執行部署前資料備份與回滾演練。 | `BLOCKED` | 0% | `run_supabase_backup.ps1` 備份腳本已就緒 | **AUTH-03 BLOCKED**（雲端實體備份需遠端 DB 憑證） | **BLOCKED** |
| `P19-DEP-010` | 進行小範圍試營運與正式上線檢查。 | `NOT STARTED` | 0% | 小規模封測檢核清單（Guest/Student/Teacher/Admin 4 角色檢查表） | 邀請真實受測學校師生進入封測（待正式發布） | **NOT STARTED** |
| `P19-DEP-011` | 公開上線後持續觀察錯誤率、服務可用性及使用者回報。 | `NOT STARTED` | 0% | 營運維護監控 SOP、回饋收集規格 | 上線後 72 小時連續運維輪班排程 | **NOT STARTED** |

---

## 二、部署環境架構與分支映射（Branch Strategy）

### 2.1 雙軌部署架構設計

```
[Git 開發分支: develop] ──> 本地測試 / 離線驗證 ──> 測試通過 (Exit Code: 0)
                                                          │
[Git 正式分支: main] ────> GitHub Pages 預覽站點 (Preview Demo)
                                │ (VITE_DEMO_MODE=true)
                                └──> [待授權] Render Production Cluster
                                          ├─ Frontend Static Site (dist/)
                                          └─ Backend Web Service (node dist/server.js)
```

1. **靜態展示站點（Preview Demo）**：
   - 託管平台：GitHub Pages（`.github/workflows/deploy-pages.yml`）。
   - 目標分支：`main` 分支。
   - 模式：`VITE_DEMO_MODE=true`、`VITE_BASE_PATH=/CODE-TO-KNOW/`。
   - 特徵：純前端靜態運作，使用 LocalStorage 模擬資料，不產生雲端成本，安全無伺服器弱點風險。
2. **正式生產叢集（Production Cluster）**：
   - 前端服務：Render Static Site（連接自訂網域）。
   - 後端服務：Render Web Service（Node.js 20 LTS 容器）。
   - 資料庫：PostgreSQL 5432（待授權後啟用連線）。

### 2.2 分支對應與發布防線
- `develop` 分支：主開發與整合分支，所有批次修正、單元測試、靜態型別檢核皆在此驗證完畢。
- `main` 分支：正式發布分支。嚴禁直接在 `main` 進行未經測試之熱修復（No Hotfix without Test）。
- 發布前必須滿足：`tsc` 0 錯誤、前後端自動化測試 100% 通過、無安全漏洞阻斷。

---

## 三、Render 服務設定規格清單

### 3.1 前端靜態服務（Frontend Static Site）
- **Root Directory**：`frontend`
- **Build Command**：`npm run build`
- **Publish Directory**：`dist`
- **Node.js Version**：`20.x`
- **SPA 路由重導防護（404 Rewrite）**：
  - 由於碼上學採用 `NavigationContext` Hash 錨點機制（`/#theory-practice`, `/#mock-exam`），所有路由天然皆由單一實體檔案 `index.html` 解析處理。
  - 額外配置 Render Rewrite 規則：`Source: /*` -> `Destination: /index.html`，提供雙層防護。

### 3.2 後端 API 服務（Backend Web Service）
- **Root Directory**：`backend`
- **Build Command**：`npm run build`（執行 `tsc` 編譯 TypeScript 至 `dist/`）
- **Start Command**：`npm start`（執行 `node dist/server.js`）
- **Health Check Path**：`/api/health`（回傳 HTTP 200/503 及資料庫探針狀態）
- **自動重啟機制（Auto Restart）**：未處理異常自動重啟並發送警報。

---

## 四、安全通訊、Cookie、CORS 與標頭配置

1. **HTTPS 傳輸加密**：
   - 生產環境全面啟用強制 HTTPS 重導（HTTP -> HTTPS 301）。
2. **Cookie 安全旗標**：
   - `SESSION_COOKIE_NAME`：配置 `httpOnly: true`（防範 XSS 竊取）、`secure: true`（僅限 HTTPS 傳送）、`sameSite: 'lax'`（防範跨站請求）、`path: '/'`。
   - `XSRF-TOKEN`：配置 `httpOnly: false`（允許前端 JS 讀取後代入 Header）、`secure: true`、`sameSite: 'lax'`。
3. **CORS 跨來源資源共享**：
   - 嚴格指定來源：`cors({ origin: env.CORS_ORIGIN, credentials: true })`。
   - 拒絕萬用字元（`*`）與憑證同時使用的不安全配置。
4. **安全標頭（Security Headers）**：
   - 透過 `helmet()` 啟用：
     - `X-Content-Type-Options: nosniff`（防範 MIME 混淆嗅探）。
     - `X-Frame-Options: SAMEORIGIN`（防範點擊劫持 Clickjacking）。
     - `Strict-Transport-Security: max-age=15552000; includeSubDomains`（HSTS 強制加密）。

---

## 五、正式環境變數規格清冊（機密保護原則）

> **安全聲明**：本表僅盤點正式環境所需之變數名稱、注入目標與安全等級。**嚴禁記錄、探測或展示任何真實密鑰值**。

| 變數名稱 | 注入目標 | 用途說明 | 敏感等級 | 目前就緒狀態 |
|---|:---:|---|:---:|:---:|
| `NODE_ENV` | 前端／後端 | 執行環境區分（`production` / `development`） | 公開 | ✅ 範本已就緒 |
| `PORT` | 後端 | 後端監聽連接埠（預設 4000） | 低 | ✅ 範本已就緒 |
| `VITE_BASE_PATH` | 前端 | 網站根目錄前綴 | 公開 | ✅ 範本已就緒 |
| `VITE_DEMO_MODE` | 前端 | 是否為靜態展示自學模式 | 公開 | ✅ 範本已就緒 |
| `VITE_API_URL` | 前端 | 正式後端 API 反向代理網址 | 低 | 待後端網址開通 |
| `CORS_ORIGIN` | 後端 | 允許連線之前端 FQDN 網址 | 低 | 待前端網域開通 |
| `DATABASE_URL` | 後端 | PostgreSQL 5432 生產連線字串 | **極高** | 🔒 **BLOCKED (AUTH-03)** |
| `DIRECT_URL` | 後端 | 資料庫 Migration 專用連線 | **極高** | 🔒 **BLOCKED (AUTH-03)** |
| `SESSION_SECRET` | 後端 | Cookie 簽署防篡改密鑰（>=32 碼） | **極高** | 待生產注入 |
| `COOKIE_SECRET` | 後端 | 加密 Cookie 密鑰（>=32 碼） | **極高** | 待生產注入 |
| `JWT_SECRET` | 後端 | 身分驗證 Token 簽名密鑰 | **極高** | 待生產注入 |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | 後端 | 商業交易型郵件發信憑證 | **高** | 待生產注入 |

---

## 六、部署前自動化驗證與回滾 SOP（Pre-flight & Rollback SOP）

### 6.1 部署前自動化驗證步驟
```bash
# 1. 靜態型別檢核
npm --prefix frontend run build  # 驗證 tsc 與 vite build
npm --prefix backend run build   # 驗證後端 tsc

# 2. 自動化測試全覆蓋
npx --prefix frontend vitest run frontend/tests # 462 測試通過
npx --prefix backend vitest run tests/*         # 216 測試通過

# 3. 本機依賴弱點檢核
npm --prefix frontend audit
npm --prefix backend audit
```

### 6.2 部署後冒煙測試（Smoke Test SOP）
1. 呼叫健康檢查端點：`curl -I https://api.codetoknow.edu.tw/api/health`（必須回傳 HTTP 200）。
2. 首頁與公開頁面渲染：存取網頁確認導覽列、學科 605 題庫、術科展示組件無破版。
3. 訪客權限攔截驗證：直接點擊 `#student`，確認彈出登入 Modal 且控制台無拋錯。

### 6.3 故障回滾 SOP（Rollback Procedure）
1. **前端靜態產物回滾**：
   - 於 Render Dashboard 點擊「Rollback to previous deploy」，10 秒內切換至上一版穩定靜態產物。
2. **後端服務回滾**：
   - 自動切換至上一版本之 Docker Image / Git commit SHA，無中斷重啟。
3. **資料庫遷移防護**：
   - 鑑於 `AUTH-03` 嚴格處於 `BLOCKED`，未授權前嚴禁執行破壞性 `prisma migrate deploy`，保障資料庫絕對安全。
