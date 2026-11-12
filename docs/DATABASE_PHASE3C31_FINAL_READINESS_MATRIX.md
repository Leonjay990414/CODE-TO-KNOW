# CODE TO KNOW｜Phase 3-C-31：正式環境角色切換最終準備度矩陣（Readiness Matrix）

- **文件階段**：Phase 3-C-31（設計整合完成，**停止於此，未進行任何正式角色建立或切換**）
- **建立日期**：2026-11-12
- **最終判定**：**`NO-GO（維持阻斷正式環境角色切換與 Render 上線）`**

---

## 一、BYPASSRLS 與資料隔離覆蓋率審查（共 36 個 Prisma 業務模型）

依據 [`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)、[`app.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts#L72-L76)、[`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts#L42-L94) 與 [`app-runtime.db.test.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/tests/app-runtime.db.test.ts)，必須嚴格區分以下四類狀態，**不得宣稱 36 個模型已全部完成使用者資料隔離驗證**：

| 分類 | 涵蓋模型／功能範圍 | 數量 | 實際安全證據與缺口 |
|---|---|---|---|
| **1. 已有 API 並完成驗證** | `User`, `Role`, `UserRole`, `UserProfile`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `TeacherApplication`, `AuditLog`（對應 `/api/auth/*`, `/api/teachers/*`, `/api/admin/*`） | **9 個模型** | 已具備 `authenticate`、`requireRoles(['ADMIN'])`、`rejectForgedOwnerFields`、參數 UUID 與分頁上限驗證，並於本機 PG17 `c2k_test_app_runtime` 通過授權與跨帳號 `403 OWNERSHIP_FORBIDDEN` 實測。 |
| **2. 已有 API 但尚未完整驗證** | （目前後端 15 個端點均已納入上述 9 個模型與 PG17 `app-runtime.db.test.ts`；唯**雲端 Supabase `app_runtime` 實機連線與前端 `#sources` 路由守衛（`DEF-01`）尚未於雲端/全端完成修復驗收**） | **—** | 前端 [`App.tsx`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/app/App.tsx) `#sources` 路由缺 `<ProtectedRoute>`、管理員自我審核邊界與 3 類 Auth `AuditLog.details` 快照仍列為待追蹤項目。 |
| **3. 尚未建立 API** | `Announcement`, `AnnouncementRead`, `Certification`, `Subject`, `Question`, `QuestionOption`, `QuestionTag`, `QuestionTagRelation`, `CertificationEnrollment`, `UnitProgress`, `WrongQuestionRecord`, `QuestionBookmark`, `StudyTimeLog`, `TeacherProfile`, `Class`, `ClassEnrollment`, `ClassAssignment`, `PracticalTask`, `PracticalStep`, `PracticalProgress`, `PracticalStepProgress`, `ExamPaper`, `ExamAttempt`, `ExamAnswerSnapshot`, `AIChatSession`, `AIChatMessage`, `StudentWeaknessAnalysis` | **27 個模型** | **0 個後端 HTTP 端點、0 個 HTTP 負向 IDOR 整合測試**；在 `app_runtime WITH BYPASSRLS` 模式下，PostgreSQL 不提供 Row-level 第二道防線。 |
| **4. 未來實作強制安全要求** | 針對上述 27 個模型未來新增之所有 Express 路由 | **全數 27 個** | 開發時**強制**使用 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)（`requireActor`、`resolveScopedUserId`、`assertResourceOwnership`、`assertNestedOwnership`），並為每條路由補齊「學生 A 存取學生 B」、「教師 A 存取教師 B 班級」、「一般用戶打管理路由」之 **HTTP 負向 IDOR 整合測試**。 |

---

## 二、已完成項目 vs 尚未完成項目

### 已完成項目（有檔案／程式碼／本機實測證據）
1. **統一角色與權限設計規範**：解決 `LOGIN` vs `NOLOGIN`、`NOINHERIT`、Sequence 排除 `UPDATE`、`AuditLog` Runtime Append-only 精確定義與 `_prisma_migrations` 隔離規則（[`DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_CUTOVER_DRAFT.md)）。
2. **正式切換與 7 步受控回滾 SQL 草案**：含每段 SQL 目的、影響、前置條件、失敗原因、回復方式，嚴禁 `DROP OWNED BY` 並標註非原子步驟（[`DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md)）。
3. **Supavisor & TLS 驗證計畫與 CA 指紋核對**：確認 `prod-supabase-ca.crt` 為 `Supabase Root 2021 CA` 並記錄 SHA-256 指紋與實機測試案例（[`DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md)）。
4. **後端安全防線與本機 PG17 隔離測試基線**：`db-validation.ts`、`database.ts`、`ownership.ts`、`redaction.ts`、`app-runtime.db.test.ts` 與 `integration.db.test.ts` 已於本機 PG17 隔離容器通過驗證（Phase 3-C-29／3-C-30）。

### 尚未完成項目（阻斷正式切換）
1. **Supabase 正式環境未建立 `migration_admin` 與 `app_runtime` 角色，亦未執行權限切換**。
2. **Supavisor 自訂角色（`app_runtime.<ref>` / `migration_admin.<ref>`）SCRAM 認證與 TLS `verify-full` 實機握手尚未測試（`NOT TESTED`）**。
3. **Supabase `postgres` 是否有權執行 `ALTER SCHEMA public OWNER TO migration_admin` 及 `migration_admin` 觸發 `rls_auto_enable` 尚未實測**。
4. **切換前最新正式加密備份尚未執行**。
5. **Render / CI 尚未配置正式新角色憑證**，且 27 個業務模型 API 尚未開發。

---

## 三、風險分級總表

| 等級 | 風險項目 | 影響說明 |
|---|---|---|
| **`HIGH`（阻斷）** | **Supavisor 自訂角色認證與 TLS 實機握手 `NOT TESTED`** | 無法保證 SQL 自建之 `app_runtime` / `migration_admin` 可透過 `aws-0-ap-southeast-2.pooler.supabase.com:5432` 完成 SCRAM 登入與 `verify-full` 握手。 |
| **`HIGH`（阻斷）** | **Supabase 託管下 `public` Schema Owner 轉移與 `rls_auto_enable` 相容性未實測** | 若 `postgres` 無權轉交 `public` Owner 或 `NOSUPERUSER` 觸發事件觸發器失敗，將導致切換中止或未來 Migration 失敗。 |
| **`HIGH`（阻斷）** | **切換前最新正式備份尚未取得** | 未具最新還原點前執行正式角色與 Owner 異動違反資料庫變更安全原則。 |
| **`MEDIUM`** | **`BYPASSRLS` 單點依賴後端授權（27 個模型未實作）** | 未來開發 27 個新模型時若漏接 `ownership.ts` 守衛，無資料庫 RLS 第二道防線可攔截 IDOR。 |
| **`MEDIUM`** | **應用程式細節待補強（前端 `#sources` 未受保護、`verify-full` URL 參數收斂）** | `db-validation.ts:532` 仍允許 `sslmode=require`/`verify-ca`；`validateMigrationDatabaseUrl` 未顯式檢核 `sslmode`。 |
| **`LOW`** | **`package.json` `test:db` 腳本無法單檔過濾**、**`0` Sequence 環境未實測真實自增序列** | 屬工具便利性與未來新增自增序列時再行驗證之項目。 |

---

## 四、所需使用者授權與正式環境測試條件

1. **切換前授權**：使用者明確書面授權執行「正式環境切換前加密備份（`.dump` + `.c2kb` + `.sha256`）」。
2. **維護時窗與建號授權**：使用者明確核准維護時窗，授權以 `postgres` 執行角色建立、權限切換草案，並保存新角色強密碼於安全密碼庫（不進 Git/Log/歷史）。
3. **實機測試條件**：依 [`DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_SUPAVISOR_TLS_VALIDATION_PLAN.md) 執行 `SUP-01`～`SUP-05`，Render 端在 `SUP-01`～`SUP-05` 全數通過前**維持原狀不切換**。
4. **回滾可行性**：已備妥經靜態檢查且禁用 `DROP OWNED BY` 之 [`7 步受控回滾方案`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C31_PRODUCTION_ROLE_ROLLBACK_DRAFT.md)；只要發生任一停止條件，均可透過「停用流量 → 終止殘留會話 → 收回 Default Privileges 與 GRANT → 迴圈歸還 Owner 至 `postgres` → `pg_shdepend` 零依賴斷言 → 安全 `DROP ROLE`」無損回復。

---

## 五、最終 GO / NO-GO 判定

- **Phase 3-C-31 設計文件整合交付**：**`GO（已完成並停止於設計階段）`**
- **立即進行正式 Supabase 角色建立、權限切換與 Render 上線**：**`NO-GO（維持阻斷）`**
  - **解除阻斷條件**：須同時滿足（1）取得使用者明確授權、（2）完成切換前最新正式備份、（3）於維護時窗完成切換與 `SUP-01`～`SUP-05` Supavisor + TLS 實機驗證通過。
