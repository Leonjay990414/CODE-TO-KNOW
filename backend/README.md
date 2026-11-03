# CODE TO KNOW (碼上學) — 後端服務與身分驗證系統

本目錄為「碼上學 AI 智慧學習與教育科技平台」的核心後端服務，提供身分驗證、RBAC 權限管理、教育者申請審核、安全 Session 與防護機制。

---

## 🛠 技術架構

- **Runtime**: Node.js (v24+) / TypeScript (Strict Mode)
- **Web Framework**: Express.js
- **ORM / 資料庫存取**: Prisma ORM
- **資料庫**: PostgreSQL 16 (透過 Docker 執行)
- **安全防護**:
  - `bcryptjs`: 密碼加鹽雜湊 (Cost Factor 12)
  - `crypto`: SHA-256 驗證憑證雜湊、安全隨機亂數
  - `httpOnly Cookie`: 儲存 Session ID，阻絕 XSS 竊取憑證
  - `CSRF Protection`: Double Submit Cookie 機制 (`XSRF-TOKEN` / `x-csrf-token`)
  - `helmet`: 安全 HTTP Headers
  - `express-rate-limit`: 防範暴力破解嘗試
  - `zod`: 強型別輸入驗證

---

## 📦 目錄結構

```text
backend/
├── prisma/
│   ├── schema.prisma           # PostgreSQL 資料庫模型定義
│   ├── seed.ts                 # 角色初始化資料 (STUDENT, TEACHER, ADMIN)
│   └── migrations/             # 初始資料庫遷移 SQL
├── scripts/
│   └── create-admin.ts         # 離線管理員帳號建立與授權工具
├── src/
│   ├── app.ts                  # Express 應用設定與中介層掛載
│   ├── server.ts               # HTTP 服務啟動與優雅關閉 (Graceful Shutdown)
│   ├── config/
│   │   ├── env.ts              # 環境變數強型別驗證
│   │   └── database.ts         # PrismaClient 單例模式
│   ├── middleware/
│   │   ├── authenticate.ts     # Session 驗證與使用者載入
│   │   ├── authorize.ts        # RBAC 角色存取授權 (requireRoles)
│   │   ├── csrf.ts             # CSRF 雙重防護機制
│   │   ├── error-handler.ts    # 統一異常回應處理
│   │   ├── rate-limiter.ts     # 請求頻率限制
│   │   └── validate.ts         # Zod 參數驗證中介層
│   ├── modules/
│   │   ├── auth/               # 註冊、登入、登出、驗證信、密碼重設
│   │   ├── teachers/           # 教師身分申請與進度查詢
│   │   └── admin/              # 教師身分審核與稽核日誌
│   └── utils/
│       ├── audit.ts            # 安全操作稽核紀錄寫入器
│       ├── errors.ts           # AppError 與標準 HTTP 例外類別
│       ├── password.ts         # 密碼雜湊與複雜度檢查
│       └── tokens.ts           # 安全亂數與 SHA-256 雜湊
└── tests/                      # Vitest 測試套件 (安全、驗證、RBAC、API、DB)
```

---

## 🚀 啟動與操作指南

### 1. 啟動 PostgreSQL (Docker)

專案根目錄已配置 `docker-compose.yml`，在終端機執行：

```powershell
# 於專案根目錄啟動資料庫容器
docker compose up -d
```

### 2. 套用資料庫遷移與角色初始化

```powershell
cd backend

# 套用資料庫 Schema
npx prisma migrate dev --name init

# 初始化固定系統角色 (STUDENT, TEACHER, ADMIN)
npm run prisma:seed
```

### 3. 建立初始系統管理員

管理員無法透過公開 API 註冊，需執行專用離線工具：

```powershell
npm run admin:create
```

依指示輸入管理員 Email、名稱與密碼，即完成建立。

### 4. 啟動後端開發伺服器

```powershell
npm run dev
```

後端服務將於 `http://localhost:4000` 啟動，並監聽 API 請求。健康檢查端點：`http://localhost:4000/api/health`。

### 5. 執行測試套件

```powershell
npm run test
```

### 6. 資料庫備份與還原

```powershell
# 備份資料庫至 SQL 檔案
docker exec -t code_to_know_postgres pg_dump -U codetoknow -d code_to_know > backup.sql

# 從 SQL 檔案還原資料庫
Get-Content backup.sql | docker exec -i code_to_know_postgres psql -U codetoknow -d code_to_know
```
