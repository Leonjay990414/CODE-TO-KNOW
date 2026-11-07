# CODE TO KNOW（碼上學）
# 四環境變數規範與資安指引 (DATABASE ENVIRONMENT VARIABLES GUIDE)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_ENVIRONMENT_VARIABLES_GUIDE.md`
- **架構原則**：
  1. **零真實機密揭露**：本文件僅提供架構規範與安全範例佔位符，嚴禁填入真實密碼或憑證。
  2. **環境嚴格隔離**：Development、Test、Staging、Production 四大環境變數彼此隔離，杜絕跨環境資料污染。
  3. **前端零機密暴露**：前端客戶端僅允許讀取以 `VITE_` 為前綴之公開 API 網址，嚴禁存取任何資料庫連線字串或 Service Role Key。

---

## 一、四環境變數規範矩陣

| 環境名稱 (NODE_ENV) | 資料庫主機與型態 | 主要連線變數規範 | `DIRECT_URL` (Migration 專用) | 隔離防護要求 |
|---|---|---|---|---|
| **`development`** | 本機 Docker (`127.0.0.1:5432`) | `DATABASE_URL="postgresql://codetoknow:<DEV_PASS>@127.0.0.1:5432/code_to_know?schema=public"` | 與 `DATABASE_URL` 相同 | 僅限本機開發，連線池大小預設 10。 |
| **`test`** | 本機獨立測試庫 (`127.0.0.1:5432`) | **`TEST_DATABASE_URL="postgresql://codetoknow:<DEV_PASS>@127.0.0.1:5432/code_to_know_test?schema=public"`** | 與 `TEST_DATABASE_URL` 相同 | **強制獨立變數，嚴禁 fallback 至 DATABASE_URL**。庫名必須含 test。 |
| **`staging`** | Supabase 雲端測試專案 | `DATABASE_URL="postgresql://postgres.<STAGING_REF>:<STAGING_PASS>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"` (Session Pooler) | 優先評估 Direct Connection (`NOT TESTED`) | 獨立專案，用於模擬 Production 遷移驗收。禁止臆測真實字串。 |
| **`production`** | Supabase 正式專案 (`code-to-know-prod`) | `DATABASE_URL="postgresql://postgres.ypibmyfxfhsyfdwxprpi:<PROD_PASS>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"` (Session Pooler) | 優先評估 Direct Connection (`NOT TESTED`) | 僅存於雲端託管平台環境變數，強制 SSL。 |

---

## 二、後端環境變數配置範例（安全佔位符）

### 1. 本機開發環境 (`backend/.env`)

```ini
# ==========================================
# CODE TO KNOW — Development Environment (.env)
# ==========================================
NODE_ENV=development
PORT=4000

# 本機 Docker PostgreSQL 16
DATABASE_URL="postgresql://codetoknow:your_local_secure_password@127.0.0.1:5432/code_to_know?schema=public"

# 安全與 Session 密鑰 (本機開發長度需滿 32 碼)
SESSION_SECRET="dev-secure-session-secret-must-be-min-32-chars-long-001"
COOKIE_SECRET="dev-secure-cookie-secret-must-be-min-32-chars-long-002"
JWT_SECRET="dev-secure-jwt-secret-must-be-min-32-chars-long-003"
BCRYPT_ROUNDS=12

# 前端網址與 CORS
CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
COOKIE_DOMAIN="localhost"

# 電子郵件 (開發階段未配置 SMTP 時自動以控制台 Mock 輸出)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="noreply@codetoknow.edu"
```

### 2. 本機自動化測試環境 (`backend/.env.test`)

```ini
# ==========================================
# CODE TO KNOW — Automated Test Environment (.env.test)
# ==========================================
NODE_ENV=test
PORT=4001

# 獨立測試資料庫 (強制使用 TEST_DATABASE_URL，不允許 fallback 到 DATABASE_URL)
TEST_DATABASE_URL="postgresql://codetoknow:your_local_secure_password@127.0.0.1:5432/code_to_know_test?schema=public"

SESSION_SECRET="test-environment-session-secret-min-32-characters-test"
COOKIE_SECRET="test-environment-cookie-secret-min-32-characters-test"
JWT_SECRET="test-environment-jwt-secret-min-32-characters-test"
BCRYPT_ROUNDS=10  # 測試環境降低雜湊輪數以加速測試執行

CORS_ORIGIN="http://localhost:3000"
FRONTEND_URL="http://localhost:3000"
EMAIL_FROM="test-noreply@codetoknow.edu"
```

### 3. Supabase 雲端 Staging 環境 (託管平台後台設定)

```ini
# ==========================================
# CODE TO KNOW — Cloud Staging Environment
# ==========================================
NODE_ENV=production
PORT=4000

# 連線至 Supabase Staging 專案 (Session Pooler)
DATABASE_URL="postgresql://postgres.<STAGING_PROJECT_REF>:<STAGING_DB_PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# 供 Prisma Migrate CLI 專用 Direct 連線
DIRECT_URL="postgresql://postgres:<STAGING_DB_PASSWORD>@db.<STAGING_PROJECT_REF>.supabase.co:5432/postgres?sslmode=require"

# 高強度隨機產生之金鑰 (至少 64 碼)
SESSION_SECRET="<SECURE_RANDOMLY_GENERATED_64_CHAR_STAGING_SESSION_SECRET>"
COOKIE_SECRET="<SECURE_RANDOMLY_GENERATED_64_CHAR_STAGING_COOKIE_SECRET>"
JWT_SECRET="<SECURE_RANDOMLY_GENERATED_64_CHAR_STAGING_JWT_SECRET>"
BCRYPT_ROUNDS=12

# Staging 網域名稱
CORS_ORIGIN="https://staging.codetoknow.edu.tw"
FRONTEND_URL="https://staging.codetoknow.edu.tw"
COOKIE_DOMAIN=".codetoknow.edu.tw"

EMAIL_FROM="staging-notify@codetoknow.edu.tw"
```

### 4. Supabase 雲端正式營運環境 (`code-to-know-prod`)

```ini
# ==========================================
# CODE TO KNOW — Cloud Production Environment (code-to-know-prod)
# 僅存放在 Vercel / Cloud Run / Secret Manager，嚴禁落盤於任何檔案
# ==========================================
NODE_ENV=production
PORT=4000

# 連線至 Supabase Production 正式專案 (Session Pooler)
DATABASE_URL="postgresql://postgres.ypibmyfxfhsyfdwxprpi:<PRODUCTION_DB_PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=require"

# 供正式 Migration 專用 Direct 連線 (需自 Supabase 控制台取得實際連線主機，此處為安全佔位符)
DIRECT_URL="postgresql://postgres:<PRODUCTION_DB_PASSWORD>@<SUPABASE_DIRECT_HOST_FROM_DASHBOARD>:5432/postgres?sslmode=require"

# 正式營運高強度密鑰
SESSION_SECRET="<PRODUCTION_HIGH_ENTROPY_CRYPTOGRAPHIC_SECRET_MIN_64_CHARS>"
COOKIE_SECRET="<PRODUCTION_HIGH_ENTROPY_CRYPTOGRAPHIC_SECRET_MIN_64_CHARS>"
JWT_SECRET="<PRODUCTION_HIGH_ENTROPY_CRYPTOGRAPHIC_SECRET_MIN_64_CHARS>"
BCRYPT_ROUNDS=12

# 正式商用網域 (強制 HTTPS)
CORS_ORIGIN="https://codetoknow.edu.tw"
FRONTEND_URL="https://codetoknow.edu.tw"
COOKIE_DOMAIN=".codetoknow.edu.tw"

# 正式郵件服務商憑證 (SendGrid / AWS SES)
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="<SENDGRID_PRODUCTION_API_KEY>"
EMAIL_FROM="service@codetoknow.edu.tw"
```

---

## 三、前端環境變數配置規範

前端使用 Vite 建置，**僅能讀取以 `VITE_` 開頭之公開變數**：

### 1. 前端開發配置 (`frontend/.env`)
```ini
VITE_API_URL="http://localhost:4000/api"
```

### 2. 前端正式部署配置 (`frontend/.env.production`)
```ini
VITE_API_URL="https://api.codetoknow.edu.tw/api"
```

> [!CAUTION]
> **前端安全紅線**：
> 1. 嚴禁在前端配置 `DATABASE_URL`、`DIRECT_URL`、`SUPABASE_SERVICE_ROLE_KEY`。
> 2. 嚴禁在前端程式碼中寫死任何資料庫密碼或管理員 Token。
> 3. 前端僅能透過標準 RESTful API 與後端 Express 溝通，所有權限判定皆由後端強制驗收。

---

## 四、Prisma 7 適配與連線初始化規範

避免沿用舊版 Prisma 6 語法，後端採用 Prisma 7 標準 Driver Adapter：

### 1. `backend/prisma.config.ts` 標準配置
```typescript
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // 優先使用 DIRECT_URL (供遷移鎖)，若無則降級為 DATABASE_URL
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
});
```

### 2. `backend/src/config/database.ts` 連線池動態初始化
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.js';

// 判斷是否為雲端環境 (含 sslmode=require 或 pooler.supabase.com)
const isCloudDatabase = env.DATABASE_URL.includes('supabase.com') || env.DATABASE_URL.includes('sslmode=require');

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: isCloudDatabase ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

export const prisma =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
```
