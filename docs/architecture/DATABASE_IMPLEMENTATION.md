# 碼上學｜CODE TO KNOW

# 資料庫建置與遷移實作報告（DATABASE IMPLEMENTATION）

- **品牌名稱**：碼上學｜CODE TO KNOW
- **系統名稱**：碼上學 AI 智慧學習與教育科技平台
- **文件版本**：1.0
- **文件路徑**：`docs/architecture/DATABASE_IMPLEMENTATION.md`
- **資料庫**：PostgreSQL 16 (Docker)
- **資料庫名稱**：`code_to_know`
- **ORM**：Prisma 7.10.1 (搭配 `@prisma/adapter-pg`)

---

## 1. 資料庫實作狀態總覽

| 模組 / 項目 | 狀態 | 說明 |
| :--- | :--- | :--- |
| **Docker Compose** | **DONE** | 官方 `postgres:16-alpine`，命名資料卷 `postgres_data`，本機綁定 `127.0.0.1:5432`，自帶 healthcheck |
| **Prisma 7 設定** | **DONE** | 建立 `prisma.config.ts`，Schema 移除硬編碼 URL，全環境變數驅動 |
| **資料模型結構** | **DONE** | 8 大核心資料表與關聯已完整定義於 `prisma/schema.prisma` |
| **Migration SQL** | **DONE** | 初始結構遷移檔已建立於 `prisma/migrations/20261103000000_init/migration.sql` |
| **系統角色 Seed** | **DONE** | `prisma/seed.ts` 具備 `STUDENT`, `TEACHER`, `ADMIN` 冪等 Upsert 腳本 |
| **管理員初始化** | **DONE** | `scripts/create-admin.ts` 離線互動腳本已就緒 |
| **PostgreSQL 容器啟動** | **BLOCKED** | 本機系統未偵測到 Docker CLI 或 Docker Desktop，待使用者本機啟動 |
| **即時資料庫遷移套用** | **BLOCKED** | 依附於 Docker PostgreSQL 啟動，待執行 `npx prisma migrate dev` |

---

## 2. 資料模型與關聯規格

### 1. `User`（使用者帳號表）
- `id` (UUID, PK)
- `email` (VARCHAR 255, Unique, Index)
- `passwordHash` (VARCHAR 255, bcrypt)
- `displayName` (VARCHAR 100)
- `avatarUrl` (TEXT, Nullable)
- `status` (VARCHAR 30, Default: 'ACTIVE', Index)
- `emailVerifiedAt` (TIMESTAMP, Nullable)
- `createdAt`, `updatedAt`, `deletedAt` (軟刪除)

### 2. `Role`（角色定義表）
- `id` (UUID, PK)
- `name` (VARCHAR 50, Unique) — 固定為 `STUDENT`, `TEACHER`, `ADMIN`
- `description` (TEXT)

### 3. `UserRole`（使用者與角色多對多關聯）
- `id` (UUID, PK)
- `userId` (FK -> User.id, Cascade Delete)
- `roleId` (FK -> Role.id, Cascade Delete)
- 限制：`@@unique([userId, roleId])`

### 4. `UserProfile`（使用者擴充個人檔案）
- `id` (UUID, PK)
- `userId` (FK -> User.id, Unique)
- `nickname`, `timezone`, `language`, `educationLevel`, `bio`

### 5. `Session`（伺服器端 Session 表）
- `id` (UUID, PK)
- `userId` (FK -> User.id, Cascade Delete)
- `tokenHash` (VARCHAR 64, SHA-256 雜湊, Unique, Index)
- `ipAddress`, `userAgent`
- `expiresAt` (TIMESTAMP)
- `revokedAt` (TIMESTAMP, Nullable, 用於登出即刻失效)

### 6. `TeacherApplication`（教育者申請審核表）
- `id` (UUID, PK)
- `userId` (FK -> User.id, Cascade Delete)
- `schoolName`, `subject`, `reason`, `proofUrl`
- `status` (Default: 'PENDING', Index: `PENDING`, `APPROVED`, `REJECTED`)
- `reviewedBy` (UUID, 管理員 ID)
- `reviewedAt` (TIMESTAMP)
- `reviewNote` (TEXT)

### 7. `EmailVerificationToken`（信箱驗證 Token 表）
- `id` (UUID, PK), `userId` (FK), `tokenHash` (Unique), `expiresAt`, `usedAt`

### 8. `PasswordResetToken`（密碼重設 Token 表）
- `id` (UUID, PK), `userId` (FK), `tokenHash` (Unique), `expiresAt`, `usedAt`

### 9. `AuditLog`（安全操作稽核表）
- `id` (UUID, PK)
- `userId` (FK -> User.id, Set Null)
- `action` (Index), `details`, `ipAddress`, `userAgent`, `createdAt` (Index)

---

## 3. 資料庫備份與還原指南

### 備份指令（PowerShell）
```powershell
docker exec -t code_to_know_postgres pg_dump -U codetoknow -d code_to_know > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

### 還原指令（PowerShell）
```powershell
Get-Content backup_file.sql | docker exec -i code_to_know_postgres psql -U codetoknow -d code_to_know
```
