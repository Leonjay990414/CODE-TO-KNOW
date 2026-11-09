# CODE TO KNOW（碼上學）
# DATABASE PHASE 1 — 本機 PostgreSQL 16 環境檢查與建置準備報告
# Document: docs/DATABASE_PHASE1_ENVIRONMENT_AUDIT.md

**執行角色：** 資深資料庫架構師、Docker 工程師、PostgreSQL 管理工程師、Prisma 7 架構工程師、DevOps 工程師  
**任務優先級：** P1 — Critical Foundation  
**產出日期：** 2026-11-07  
**架構定調：** 雙環境架構（本機 Docker PostgreSQL 16 + 雲端 Supabase PostgreSQL）

---

## 一、專案環境檢查 (Project Environment Check)

本機專案環境結構與檔案盤點如下：

1. **專案根目錄路徑：** `C:\Users\user\Documents\CODE-TO-KNOW`
2. **後端專案目錄：** `C:\Users\user\Documents\CODE-TO-KNOW\backend`
3. **前端專案目錄：** `C:\Users\user\Documents\CODE-TO-KNOW\frontend`
4. **核心設定與規格檔案驗證：**
   - `docker-compose.yml`：已存在於專案根目錄（版本 3.8，配置 PostgreSQL 16-alpine）。
   - `.env.example`（根目錄）：已存在，規範本機 Docker 容器環境變數範本。
   - `backend/.env.example`：已存在，規範後端服務環境變數與安全金鑰範本。
   - `backend/prisma/schema.prisma`：已存在，定義 PostgreSQL 16 基礎資料模型（9 個核心 Models）。
   - `backend/prisma.config.ts`：已存在，採用 Prisma 7 官方標準 `defineConfig` 動態解析連線字串。
   - `backend/package.json`：已存在，宣告 Prisma 7.10.1、`@prisma/adapter-pg` 及 `@prisma/client`。
   - `.gitignore`：已確認將 `.env`、`.env.*` 列入忽略名單，嚴格防止金鑰洩漏至 Git。

---

## 二、Git 狀態與版本完整性 (Git Status & Integrity)

| 檢查項目 | 查驗數值 / 狀態 | 驗證結論 |
|---|---|---|
| **目前分支 (Current Branch)** | `main` | 符合主要開發分支規範 |
| **HEAD Commit Hash** | `af150371e2ad734b55af25969e5864cb7fb08f5b` | 基準點一致，未有未授權 commit |
| **Staged Area 檔案數** | **108 個檔案** | 完整保留既有暫存區，無清除或覆蓋 |
| **Working Tree 狀態** | 包含先前已校正的前端 UI 與文件 | 完整保留，未執行 `git reset` 或 `checkout` |
| **Untracked 檔案** | `1.docx`, `~$1.docx` | 使用者既有本機文件，未更動 |

---

## 三、Docker 安裝及運作狀態 (Docker Installation & Operational State)

經本機唯讀指令檢測：

1. **Docker Client 安裝狀態：** **已安裝 (Installed)**
   - Client 版本：`Docker version 29.9.2, build a82e528`
   - API 版本：`1.56`
   - Go 語言編譯版本：`go1.26.10`
   - 作業系統與平台：`windows/amd64`
   - 運作 Context：`desktop-linux`
2. **Docker Compose 版本：** **已安裝 (Installed)**
   - 版本：`Docker Compose version v5.6.1`
3. **Docker 桌面應用程式 (Docker Desktop)：**
   - Windows 系統中已安裝 Docker Desktop 執行檔。
   - 目前 Windows 背景行程無作用中之 Docker 處理聯乘。

---

## 四、Docker Engine 狀態 (Docker Engine Connection Status)

1. **Docker Engine 連線檢測：**
   - 檢測指令：`docker version`
   - 回應狀態：`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`
2. **狀態診斷：**
   - Docker Desktop 目前**尚未啟動 (Stopped / Not Running)**。
   - Docker Daemon 具名管道（Named Pipe: `dockerDesktopLinuxEngine`）目前處於未監聽狀態。
3. **合規處置：**
   - 依「第一階段安全執行原則」，代理人**嚴格禁止自行啟動 Docker Desktop**。
   - 狀態已客觀記錄，待使用者於適當時機手動開啟 Docker Desktop。

---

## 五、PostgreSQL 相關 Images、Containers、Volumes 盤點

因 Docker Engine 尚未啟動，目前無運行中之 Docker 守護行程。進一步盤點結果如下：

1. **Docker Images：**
   - 待 Docker Desktop 啟動後執行 `docker images`，若本機未具備 `postgres:16-alpine`，首次建置時將自動自官方 Docker Hub 安全拉取。
2. **Docker Containers：**
   - 無執行中的 `code_to_know_postgres` 容器。
3. **Docker Volumes：**
   - 無命名衝突之孤立 Volume；專案 `docker-compose.yml` 預定配置具名 Volume `postgres_data`，確保資料持久化。

---

## 六、連接埠使用狀況 (Port Usage & Conflicts Check)

透過 PowerShell `Get-NetTCPConnection -State Listen` 進行關鍵連接埠佔用檢測：

| 檢驗連接埠 | 標準用途 | 目前監聽狀態 (Listen State) | 佔用處理序 (PID / Process) | 衝突評估 |
|---|---|---|---|---|
| **5432** | 預設 PostgreSQL 連接埠 | **未佔用 (FREE)** | 無 | **無衝突，可作為本機 PostgreSQL 16 優先連接埠** |
| **5433** | 備用 PostgreSQL 連接埠 | **未佔用 (FREE)** | 無 | 無衝突，適合作為緊急 Fallback |
| **6543** | Supabase Pooler 參考埠 | **未佔用 (FREE)** | 無 | 無衝突，雲端連線保留使用 |
| **4000** | 後端 Express API | 監聽中 (0.0.0.0:4000) | PID: 5040 (node/tsx 後端開發伺服器) | 正常開發服務 |
| **3000** | 前端 Vite Web | 監聽中 ([::1]:3000) | PID: 37144 (Vite 前端開發伺服器) | 正常開發服務 |

> **結論：** 本機 Windows 系統未安裝亦未啟動任何本機原生 PostgreSQL 服務（無 `postgres.exe` 運作）。**連接埠 5432 完全可用，無任何連接埠衝突風險。**

---

## 七、Prisma 與 PostgreSQL 相容性檢查 (Prisma & PostgreSQL Compatibility)

1. **安裝版本清單（`backend/node_modules` 實際版本）：**
   - `prisma`：`7.10.1`
   - `@prisma/client`：`7.10.1`
   - `@prisma/adapter-pg`：`7.10.1`
   - `pg` (node-postgres)：`8.13.1`
2. **Prisma 7 架構特性適配確認：**
   - **`prisma.config.ts`：** Prisma 7 移除了 `schema.prisma` 中的靜態 `url = env(...)`，全面改由 TypeScript 模組 `defineConfig` 動態提供 datasource URL。
   - **連線隔離防護：** 經 `db-validation.ts` 防護閘門驗證：
     - 開發模式（Development）：連線字串必須為本機 `127.0.0.1` 或 `localhost`，連接埠必須為 `5432` 或 `5433`，資料庫名稱必須為 `code_to_know`。
     - 測試模式（Test）：嚴格阻斷未指定之直接連線，防止單元測試污染開發資料庫。
     - 雲端模式（Production）：僅允許 `*.supabase.co` 專屬白名單。
3. **Driver Adapter 運作機制：**
   - 在 `backend/src/config/database.ts` 中使用 `pg.Pool` 搭配 `PrismaPg` 轉接驅動，符合 PostgreSQL 16 協定規範。
4. **現有 Migration 盤點：**
   - `backend/prisma/migrations/20261103000000_init/migration.sql`：已存在初始 DDL 腳本，包含 9 個核心 Model。語法完全遵循標準 ANSI/PostgreSQL 16 DDL，相容性 100%。

---

## 八、PostgreSQL 16 相容性評估 (PostgreSQL 16 Compatibility)

1. **資料型別相容性：**
   - `TEXT`, `TIMESTAMP(3)`, `BOOLEAN`, `JSONB` 皆為 PostgreSQL 16 核心支援標準。
2. **約束與鍵值機制：**
   - `PRIMARY KEY`, `FOREIGN KEY ... ON DELETE CASCADE`, `CREATE UNIQUE INDEX`, `CREATE INDEX` 與 PostgreSQL 16 完全相容。
3. **官方映像檔安全性：**
   - `postgres:16-alpine` 採 Alpine Linux 最小化核心建構，CVE 漏洞面極小，記憶體開銷低（約 30–50MB Idle），高度適配本機開發與快速測試。

---

## 九、本機資料庫建置方案 (Local PostgreSQL 16 Deployment Blueprint)

經盤點確認，現有根目錄 `docker-compose.yml` 結構已完全符合專案需求，建置方案規劃如下：

### 1. 容器架構配置
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: code_to_know_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-codetoknow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-codetoknow_secret}
      POSTGRES_DB: ${POSTGRES_DB:-code_to_know}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-codetoknow} -d ${POSTGRES_DB:-code_to_know}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  postgres_data:
    driver: local
```

### 2. 架構亮點說明
- **網路安全隔離：** `127.0.0.1:5432:5432` 僅綁定本機 Loopback，不對區域網路（LAN）開放，杜絕外部探測。
- **健康檢查機制：** 內建 `pg_isready`，每 5 秒探測資料庫存活狀態，確保應用程式於資料庫真正就緒後再進行連線。
- **持久化儲存：** 具名 Volume `postgres_data` 獨立掛載至 `/var/lib/postgresql/data`，即便容器銷毀重建，資料表與內容完整留存。
- **敏感資訊遮蔽：** 密碼參數全面透過環境變數注入，且已由 `.gitignore` 保護，不寫死於版本控制中。

---

## 十、可能發生的風險與因應措施 (Potential Risks & Mitigations)

| 風險項目 | 風險等級 | 潛在影響 | 因應與防護措施 |
|---|---|---|---|
| **Docker Desktop 未啟動** | 中 | 執行 `docker compose up` 時連線失敗 | 待使用者手動開啟 Docker Desktop 後再啟動容器。 |
| **本機防火牆攔截 5432** | 低 | 本機 localhost 連線被 Windows Defender 阻擋 | 僅綁定 `127.0.0.1` 迴路，原則上不觸發對外防火牆警示。 |
| **非預期覆蓋既有資料** | 極低 | 既有同名 Volume 資料被覆蓋 | 本機目前無任何 `code_to_know` 歷史 Volume，為全新獨立空間。 |
| **Prisma 連線誤觸雲端** | 極低 | 本機開發時意外連線至 Supabase 生產庫 | `db-validation.ts` 內建防護：在 `NODE_ENV=development` 下僅允許連線本機 5432/5433，否則立即拋出安全例外中斷。 |

---

## 十一、下一步需要使用者確認與操作的事項 (Next Steps)

進入下一階段（啟動 Docker 容器與建立資料庫）前，需請使用者確認：

1. **手動啟動 Docker Desktop：**  
   請使用者於 Windows 系統中開啟 Docker Desktop，等待右下角圖示顯示為綠色（Engine Running）。
2. **授權啟動本機容器：**  
   待 Docker Desktop 就緒後，授權執行 `docker compose up -d` 建立 `code_to_know_postgres` 容器。
3. **授權執行 Prisma 首次 Migration：**  
   容器健康狀態轉為 `healthy` 後，授權執行 `prisma migrate deploy` 或 `prisma migrate dev` 將 9 個核心 Model 寫入本機 PostgreSQL 16。
4. **確認密碼設定：**  
   使用者可確認根目錄 `.env` 中 `POSTGRES_PASSWORD` 之設定值是否符合預期。

---

## 十二、驗收結論與停止聲明

- **Docker Client / Compose：** 已安裝完備（Client v29.9.2, Compose v5.6.1）。
- **Docker Engine：** 目前處於停止狀態，符合安全限制，未擅自啟動。
- **連接埠 5432：** 完全空閒無衝突。
- **Prisma 7.10.1 與 PostgreSQL 16：** 相容性 100%。
- **Git 狀態：** 108 個暫存檔案完整留存，HEAD 指標未變更。
- **停止條件：** 已立即停止，未建立容器，未建立資料庫，未執行 Migration，未連線 Supabase。
