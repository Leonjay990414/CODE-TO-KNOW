# CODE TO KNOW｜Phase 3-C-33：BYPASSRLS 安全決策與架構防護設計

- **文件階段**：Phase 3-C-33（純設計決策與風險控制規劃；**未修改任何程式碼或資料庫**）
- **建立日期**：2026-11-12
- **依據**：[`DATABASE_PHASE3C32_BYPASSRLS_ALTERNATIVE_ANALYSIS.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C32_BYPASSRLS_ALTERNATIVE_ANALYSIS.md)、[`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)、[`schema.prisma`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/prisma/schema.prisma)

---

## 一、五大核心架構問題明確回答

### 1. `app_runtime` 使用 `BYPASSRLS` 是否仍為目前最合適的暫定方案？
- **答案**：**就技術相容性而言，仍是目前唯一不需大規模重寫認證與 ORM 架構的暫定方案；但就上線安全標準而言，現階段仍受限於 27 個未實作模型與實機未測條件，尚不足以直接放行上線（維持 `NO-GO`）**。
- 原因：`public` Schema 全 37 張表已啟用 `ENABLE ROW LEVEL SECURITY` 且目前為 **`0` 條 Policy**，若未先建立完整的 RLS Policy 與 Session Context 注入機制而移除 `BYPASSRLS`，所有查詢將全面遭拒（100% 停機）。

### 2. 如何降低 `BYPASSRLS` 對跨使用者資料存取的影響？
必須透過四層強制應用層護欄補償資料庫列級防線的缺失：
1. **強制共用所有權守衛**：所有業務模組必須統一使用 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts)（`requireActor`、`resolveScopedUserId`、`assertResourceOwnership`、`assertNestedOwnership`），嚴禁在 Controller/Service 自行信任 Body/Query 傳入之 `userId` 或 `creatorId`。
2. **禁止偽造所有權欄位**：延續 `rejectForgedOwnerFields` 中介軟體，阻斷前端請求夾帶 `userId` / `authorId` / `creatorId`。
3. **強制 HTTP 負向 IDOR 自動化測試**：每新增任一資源端點，必須同步補齊「學生 A 存取學生 B」、「教師 A 存取教師 B 班級」、「一般使用者呼叫 `/api/admin/*`」之 HTTP 負向測試（預期 `403` / `404`）。
4. **表級硬隔離保留**：`BYPASSRLS` 不繞過 Table ACL，維持 `AuditLog` 僅 `SELECT, INSERT` 與 `_prisma_migrations` 零權限。

### 3. 是否能在不破壞現有 Cookie Session、CSRF 與 Prisma 架構的前提下，採用更低權限的設計？
- **技術上可行，但需經過獨立工程改造與 Supavisor 實測（屬於中長期「方案 C2：漸進式分層 `NOBYPASSRLS`」），無法零改動直接套用**：
  - 做法為：將 `app_runtime` 改為 `NOBYPASSRLS`，針對公開唯讀目錄表（`Certification`, `Subject`, `Question` 等）設開放讀取 Policy；針對個人敏感表透過 Prisma Client Extension (`$extends`) 把查詢包進 `$transaction` 並注入 `SELECT set_config('app.current_user_id', ..., true)`，再為 `auth` 登入前查表流程設計受控 `SECURITY DEFINER` 函式。
  - **未證實風險**：在 Supavisor 交易池（6543）或跨區連線（Render US ↔ Supabase Sydney）下，為每個請求強制開啟交易執行 `set_config` 的延遲倍增與連線池相容性**尚未實測**。

### 4. 是否需要依照資料模型建立更完整的 RLS Policy？
- **在現行暫定方案 A（`BYPASSRLS`）下**：即使建立 RLS Policy，`app_runtime` 仍會略過它們，實際意義僅在於防範未來意外以低權限角色（如 `anon`/`authenticated`）透過 Supabase Data API 存取（目前 `0` Policy 本就預設拒絕 `anon`/`authenticated`）。
- **若未來決定轉向方案 B 或 C2（`NOBYPASSRLS`）**：則**必須**依 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts) 所定義之 6 種所有權策略（`USER_SELF`, `DIRECT_USER_ID`, `NESTED_PARENT`, `TEACHER_OR_ENROLLED`, `ADMIN_ONLY`, `ADMIN_MANAGED_CATALOG`），為全部 36 個業務模型逐一撰寫無遞迴效能風險之 RLS Policy 並通過整合測試。

### 5. Supabase Auth 與目前自訂 Session 系統是否存在架構衝突？
- **是，存在根本架構不相容**：
  - 本專案使用 Express 自建 **HttpOnly Cookie + SHA-256 `Session` 資料表 + Double-submit CSRF**，完全不使用 Supabase GoTrue Auth 或前端 Supabase JWT。
  - Supabase 原生 RLS 函式 `auth.uid()` 依賴 GoTrue JWT Claims；若強行整合 Supabase Auth，等同重寫整個認證、註冊、密碼重設、Role 核准與 CSRF 架構。

---

## 二、36 個業務模型隔離覆蓋現況（嚴格區分，絕不誇大）

- **已有 API 並完成後端隔離／PG17 驗證（`9` 個模型）**：`User`, `Role`, `UserRole`, `UserProfile`, `Session`, `EmailVerificationToken`, `PasswordResetToken`, `TeacherApplication`, `AuditLog`（對應 `/api/auth/*`, `/api/teachers/*`, `/api/admin/*`）。
- **尚未建立 API 與隔離驗證（`27` 個模型）**：`Announcement`, `AnnouncementRead`, `Certification`, `Subject`, `Question`, `QuestionOption`, `QuestionTag`, `QuestionTagRelation`, `CertificationEnrollment`, `UnitProgress`, `WrongQuestionRecord`, `QuestionBookmark`, `StudyTimeLog`, `TeacherProfile`, `Class`, `ClassEnrollment`, `ClassAssignment`, `PracticalTask`, `PracticalStep`, `PracticalProgress`, `PracticalStepProgress`, `ExamPaper`, `ExamAttempt`, `ExamAnswerSnapshot`, `AIChatSession`, `AIChatMessage`, `StudentWeaknessAnalysis`。
- **明確結論**：現階段**絕不可宣稱 36 個模型已完成資料隔離驗證**；未來每開發一組新模型 API，皆須先通過 `ownership.ts` 審查與負向 IDOR 測試。
