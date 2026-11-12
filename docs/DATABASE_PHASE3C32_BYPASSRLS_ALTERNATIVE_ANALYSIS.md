# CODE TO KNOW｜Phase 3-C-32：BYPASSRLS 替代方案獨立分析報告

- **審查階段**：Phase 3-C-32（第二輪 100% 唯讀獨立安全審查）
- **審查日期**：2026-11-12
- **審查目標**：評估 `app_runtime` 暫定 `BYPASSRLS` 是否存在更安全且符合 Supabase 託管環境與現行技術棧的替代方案。

> **核心聲明**：本報告不因本機 PG17 Docker 測試通過，就認定 `BYPASSRLS` 是正式環境的最佳選擇；所有未經正式 Supabase 實機測試的相容性表現均明確標記為 **「未證實」**。

---

## 一、三種資料隔離架構方案對照

- **方案 A（現行暫定設計）**：`app_runtime` 具備 `BYPASSRLS`，PostgreSQL RLS 形同停用（0 條 Policy），由 Express + Prisma + `ownership.ts` 應用層負責 100% 資料隔離。
- **方案 B（純自管資料庫 RLS）**：`app_runtime` 改為 `NOBYPASSRLS`，Express 透過 Prisma `$extends` 對每個請求啟動交易並執行 `SET LOCAL app.current_user_id = ...`，由 PostgreSQL `CREATE POLICY` 執行列級資料隔離。
- **方案 C（符合 Supabase 託管環境之混合／低權限替代方案）**：
  - **C1（Supabase Auth GoTrue JWT 原生路線）**：放棄自建 HttpOnly Cookie Session，改用 Supabase Auth 發放 JWT 並於 Postgres 使用 `auth.uid()` RLS（屬重大架構重寫）。
  - **C2（表分層混合 `NOBYPASSRLS` 路線，推薦作為未來強化方向）**：`app_runtime` 設為 `NOBYPASSRLS`；公開／唯讀目錄表（如 `Certification`, `Subject`, `Question`）設公開讀取 Policy，個人敏感表（如 `ExamAttempt`, `AIChatSession`, `Class`）由 Prisma `$extends` 交易內注入 `SET LOCAL app.current_user_id`（並區分管理員與系統登入流程之受控 Context），將「全庫無防線」縮小為「最小表面積」。

---

## 二、九大安全與架構構面深度比較

| 比較構面 | 方案 A：`BYPASSRLS` + Express 應用層隔離 | 方案 B：`NOBYPASSRLS` + 全庫 `SET LOCAL` RLS | 方案 C（C1 Supabase Auth / C2 分層 `NOBYPASSRLS`） |
|---|---|---|---|
| **1. 權限範圍** | `app_runtime` 對 `public` 35 業務表具備全列 `SELECT/INSERT/UPDATE/DELETE`（`AuditLog` 僅 `SELECT/INSERT`），可略過所有 RLS Policy。 | `app_runtime` 無法略過 RLS；即使取得連線憑證，未設定有效 Session Context 時對個人表預設 `0` 列存取。 | **C1**：依賴 `authenticated` JWT；**C2**：`app_runtime` 採 `NOBYPASSRLS`，目錄表開放讀 Policy，敏感表強制 RLS Policy。 |
| **2. 資料隔離能力** | **單點防線**：100% 依賴 Express API 與 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts) 正確性；Table ACL 無法阻擋同表跨用戶 IDOR。 | **雙層縱深防禦（理論最強）**：即使 Express 漏寫 `where: { userId }`，DB 引擎仍依 Policy 阻擋跨列存取。 | **C1**：強（依賴 JWT）；**C2**：雙層縱深防禦，且將無狀態公開目錄表排除於交易注入負擔之外。 |
| **3. Prisma 相容性** | **原生相容**：現行 `PrismaPg` + `pg.Pool` 無須包互動式交易。 | **需侵入式改造**：必須以 Prisma Client Extension (`$extends`) 把每次查詢包入 `$transaction` 執行 `set_config(..., true)`；不支援跨多查詢的批次非互動語法（**正式相容性未證實**）。 | **C1**：需捨棄現行 Prisma Session 認證；**C2**：敏感表仍須 `$transaction` + `set_config`（**未證實**），公開查詢免包交易。 |
| **4. Supavisor 相容性** | **Port 5432 / 6543 皆理論相容**（無會話變數依賴，但自建角色登入本身**未證實**）。 | **對 Pooler 模式極度敏感**：在 Transaction Pooler (Port 6543) 若誤用 `SET`（非 `SET LOCAL`）或未包交易，會發生**跨租戶會話變數污染（嚴重資安漏洞）**；Session Mode (5432) 則受連線數上限與跨區交易 RTT 倍增影響（**未證實**）。 | **C1**：原生相容 Supavisor；**C2**：須嚴格鎖定交易內 `SET LOCAL`，與方案 B 具相同 Pooler 注意事項（**未證實**）。 |
| **5. Cookie Session 認證相容性** | **100% 相容**：完全契合現行 HttpOnly Cookie + SHA-256 `Session` 表設計。 | **需解決登入前查表雞生蛋問題**：`POST /api/auth/login`、`register`、`verify-email` 尚未有 `req.user.id`，若 `User`/`Session` 開啟嚴格 RLS 且 `NOBYPASSRLS`，認證流程本身會被 RLS 阻擋，必須搭配受控 `SECURITY DEFINER` 函式或特殊登入 Policy。 | **C1**：不相容（須廢除現行 Cookie Session 改用 Supabase GoTrue）；**C2**：與方案 B 相同，須為 `auth` 模組設計 `SECURITY DEFINER` 或受控 Policy。 |
| **6. 管理員資料存取** | **簡單**：`requireRoles(['ADMIN'])` 通過後即可查審全部 `TeacherApplication` 與 `AuditLog`。 | **複雜**：須同時注入 `app.current_user_roles` 並在各表寫入 `ADMIN` 條件分支 Policy（且須防範偽造設定）。 | **C1**：依賴 `service_role` 或 Custom Claims；**C2**：同方案 B，須於 Policy 顯式區分 `ADMIN` 與 `STUDENT`/`TEACHER`。 |
| **7. `AuditLog` 行為** | `app_runtime` 僅 `SELECT/INSERT`（Table ACL 生效，`BYPASSRLS` 不繞過 Table ACL）。 | `app_runtime` 僅 `SELECT/INSERT`，且 `SELECT` 還可再受 RLS 限制僅 `ADMIN` 可讀。 | **C1/C2**：同左，`AuditLog` 仍須維持 Table ACL `REVOKE UPDATE, DELETE, TRUNCATE`。 |
| **8. 開發與維護成本** | **低至中**（僅需維護後端路由、[`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts) 與強制 IDOR 測試）。 | **極高**：須為 36 張表設計無遞迴之 RLS Policy（含 `ClassEnrollment` 多對多關聯）、改造全部 Prisma 查詢並撰寫大量 PG Policy 測試。 | **C1**：極高（等同重寫認證系統）；**C2**：高（但可分階段針對新增的 27 個業務模型逐步套用）。 |
| **9. 應用層漏洞影響範圍** | **全表跨租戶外洩（高衝擊）**：任一端點遺漏 `where: { userId }` 或 `assertResourceOwnership`，攻擊者可讀寫全表所有使用者資料。 | **僅限單一使用者／受 Policy 限制之列（低衝擊）**：只要資料庫連線未被接管且 `SET LOCAL` 未被使用者輸入注入，DB 會攔截越權查詢。 | **C1/C2**：同方案 B，有效收斂應用程式漏洞之爆炸半徑。 |

---

## 三、審查結論

1. **為何現階段無法直接切換至方案 B 或 C1**：
   - 本專案目前採自建 HttpOnly Cookie + Prisma `Session` 認證，且 37 張表為 `0` 條 Policy；若在未改造 Prisma `$extends`、未設計登入前 `SECURITY DEFINER` 流程及未撰寫 36 張表 Policy 前貿然將 `app_runtime` 改為 `NOBYPASSRLS`，正式服務將**全面拒絕存取（100% 停機）**。
2. **方案 A（`BYPASSRLS`）為何目前仍被判定為 `NO-GO`**：
   - 在方案 A 下，目前 **36 個業務模型僅 9 個有 API，其餘 27 個含個人學習、測驗、錯題與 AI 對話紀錄之模型尚未實作**。一旦上線後於 `BYPASSRLS` 環境開發這 27 個模型，只要任一路由漏接 [`ownership.ts`](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/utils/ownership.ts) 即直接構成 IDOR。
   - **架構建議（待決策）**：短期在補齊 Supavisor 實機驗證、切換腳本與前端/授權缺口前，**維持 `NO-GO`**；中長期於開發 27 個新模型時，建議評估採用**方案 C2（漸進式 `NOBYPASSRLS` + 關鍵個人表 RLS Policy）**，或至少為每個新模型強制通過自動化 HTTP 負向 IDOR CI 閘門後方可放行。
