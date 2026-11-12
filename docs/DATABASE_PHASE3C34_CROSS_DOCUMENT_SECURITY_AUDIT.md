# CODE TO KNOW｜Phase 3-C-34：Phase 3-C-33 跨文件獨立安全交叉審查報告

- **審查階段**：Phase 3-C-34（針對 Phase 3-C-33 六份修正版設計文件之 100% 唯讀獨立交叉審查）
- **審查日期**：2026-11-12
- **Git 基準**：Branch `main`｜HEAD `86a0f1116693bcce476b8747a446900d54b29a4a`
- **審查範圍**：
  - `DATABASE_PHASE3C33_PRODUCTION_ROLE_CUTOVER_REVISED_DRAFT.md`
  - `DATABASE_PHASE3C33_BYPASSRLS_SECURITY_DECISION.md`
  - `DATABASE_PHASE3C33_EVENT_TRIGGER_COMPATIBILITY_PLAN.md`
  - `DATABASE_PHASE3C33_COMPLETE_ROLLBACK_REVISED_DRAFT.md`
  - `DATABASE_PHASE3C33_BACKUP_CA_AND_TLS_READINESS.md`
  - `DATABASE_PHASE3C33_FINAL_GO_NO_GO_MATRIX.md`
  - 交叉比對 `Phase 3-C-31`、`Phase 3-C-32`、`scripts/database/backup-crypto.cjs`、`backend/src/utils/ownership.ts`、`backend/src/config/db-validation.ts`、`backend/src/config/database.ts`。

---

## 一、六份文件一致性總評

經逐份交叉核對，Phase 3-C-33 六份文件之間**結論完全一致**，未出現「把設計修正誤列為實機通過」或「將未實測項目誤標為 PASS」之情形：
1. **C32 四項 `HIGH` 阻斷均已有明確設計修正與驗證路徑**：修正版切換 SQL 已將授權順序提前至 `postgres` 仍為 Owner 之時、將 `ALTER DEFAULT PRIVILEGES` 改由 `migration_admin` 親自連線執行、補充 `VIEW`/`MVIEW` 與回滾 `pg_proc` 迴圈，並建立完整備份解密演練與官方 CA 核對規格。
2. **所有未連線 Supabase 的實機項目均維持 `NOT TESTED` / `BLOCKED` / `NOT AUTHORIZED`**，最終判定一致維持 **`NO-GO`**。

---

## 二、BYPASSRLS 與資料隔離交叉審查（Section 四）

| 審查要求 | C33 文件與程式碼證據核對 | 審查結論 |
|---|---|---|
| **1. `BYPASSRLS` 原因與風險是否清楚？** | [`DATABASE_PHASE3C33_BYPASSRLS_SECURITY_DECISION.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C33_BYPASSRLS_SECURITY_DECISION.md) 清楚說明 `public` 37 表全啟用 RLS 且 `0` 條 Policy，若移除 `BYPASSRLS` 將全面拒絕存取；同時明確指出其為**單點依賴後端應用層防線**之高耦合風險。 | **PASS** |
| **2. 9 個已有 API 模型是否有對應所有權檢查？** | [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L43-L52) 盤點 9 個 `IMPLEMENTED` 模型（`User`, `Role`, `UserRole`, `UserProfile`, `Session`, `TeacherApplication`, `EmailVerificationToken`, `PasswordResetToken`, `AuditLog`），對應 `/api/auth/*`, `/api/teachers/*`, `/api/admin/*` 均具 `authenticate`、`requireRoles(['ADMIN'])` 或 `req.user.id` 綁定，且經 PG17 `app-runtime.db.test.ts` 驗證 `403 OWNERSHIP_FORBIDDEN`。 | **PASS** |
| **3. 27 個未建立 API 模型是否有明確未來安全要求？** | 明確列出全數 **27 個 `NOT_IMPLEMENTED` 模型**，規定開發時強制套用 `ownership.ts`（`requireActor`, `resolveScopedUserId`, `assertResourceOwnership`, `assertNestedOwnership`）及 HTTP 負向 IDOR 測試；**未將應用層所有權檢查宣稱為資料庫層 RLS，亦未宣稱 36 個模型已全部完成隔離驗證**。 | **PASS** |
| **4. 管理員與一般使用者存取是否分開？** | `admin.routes.ts` 統一掛載 `requireRoles(['ADMIN'])`（與 `STUDENT`/`TEACHER`/`SYSTEM_OPERATOR` 分離）；`ownership.ts` 明確將 `SYSTEM_OPERATOR` 排除於使用者資料覆寫之外。 | **PASS** |
| **5. 未來導入 RLS 與 Cookie Session 相容性？** | 已明確指出自建 HttpOnly Cookie + `Session` 表與 Supabase GoTrue `auth.uid()` 不相容；若未來導入 RLS（方案 B 或 C2），必須改造 Prisma `$extends` 交易內注入 `SET LOCAL` 並為 `auth` 登入前查詢設計 `SECURITY DEFINER` 函式，且須實測 Supavisor 相容性。 | **PASS** |

---

## 三、備份、CA 與 TLS 證據交叉審查（Section 六）

經核對 [`scripts/database/backup-crypto.cjs`](file:///c:/Users/user/Documents/CODE-TO-KNOW/scripts/database/backup-crypto.cjs#L9-L41) 與 C33 規格文件：
1. **備份日期與版本標示**：C33 誠實將 `2026-11-10` 備份（`code_to_know_supabase_prod.dump` 505,249 bytes, `2BB79...`；`.c2kb` 505,282 bytes, `6E266...`）標記為「既有舊備份基準」，**未**將其冒充為切換前最新備份，並明確要求切換前重新取得新備份。
2. **C2KB 容器格式與 AES-256-GCM 驗證**：與 `backup-crypto.cjs` 實作完全吻合——`[4B "C2KB"] + [1B 0x01] + [12B Nonce] + [Ciphertext] + [16B AuthTag]`（總檔頭+標籤固定開銷 `33 bytes`，`505,249 + 33 = 505,282` bytes 完全相符），金鑰為 64-char Hex（256-bit）由 KeePassXC 離線保管。
3. **CA 憑證雜湊與來源區分**：C33 正確區分 [`prod-supabase-ca.crt`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/certs/prod-supabase-ca.crt) 的 **PEM 檔案 SHA-256**（`70072358...`）與 **DER X.509 `fingerprint256`**（`80:70:25:AD:...`），並要求至 Supabase Dashboard `SSL Configuration` 下載 `prod-ca-2021.crt` 進行來源比對，未將本地中繼資料當作官方比對成功。
4. **TLS 與 Supavisor**：`sslmode=verify-full`、Node.js `rejectUnauthorized: true`、`<role>.ypibmyfxfhsyfdwxprpi` 與 SCRAM-SHA-256 規格完整，遠端實測仍維持 `NOT TESTED`。

---

## 四、新發現之細微設計改善建議（僅紀錄，不自行修改）

1. **回滾步驟 2 與步驟 3 的執行連線順序細節（`LOW` / 操作面）**：C33 回滾草案步驟 2 由 `postgres` 終止 `app_runtime` 與 `migration_admin` 全部連線，緊接步驟 3 卻註明由 `migration_admin` 執行 `ALTER DEFAULT PRIVILEGES ... REVOKE ALL`。建議未來執行 Runbook 時明確寫為：「步驟 2 先僅終止 `app_runtime` 連線 → `migration_admin` 執行步驟 3（與步驟 4）→ `migration_admin` 自行斷線後再確認 `pg_stat_activity` 皆為 0 → `postgres` 執行步驟 5～7」。
2. **Domain 型別（`typtype = 'd'`）註記（`INFO`）**：目前 `schema.prisma` 有 `0` 個 Domain（僅 1 個 Enum `AnnouncementStatus`），未來若有引入 PostgreSQL `DOMAIN`，可於切換/回滾迴圈的 `typtype IN ('e', 'c', 'd')` 順帶納入。
