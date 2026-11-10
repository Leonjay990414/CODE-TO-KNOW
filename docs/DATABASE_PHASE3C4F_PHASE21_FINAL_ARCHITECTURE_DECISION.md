# CODE TO KNOW｜資料庫架構決策與安全驗證最終判定報告
# 資料庫正式收尾 Phase 2.1：存取控制架構最終裁定與雲端切換前置準備

**文件編號**：C2K-DOC-DB-PHASE21-FINAL-DECISION-01  
**審查日期**：2026-11-10  
**審查角色**：資深 PostgreSQL DBA、Supabase 資安架構師、Prisma 全端架構師、DevSecOps 稽核員  
**審查性質**：100% 唯讀獨立綜合審查（未連線雲端、未修改資料庫、零寫入操作）  
**關聯報告**：
1. [`docs/DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_ROLE_PRIVILEGE_AUDIT.md)
2. [`docs/DATABASE_PHASE3C4F_PHASE21_PRISMA_DATA_ISOLATION_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_PRISMA_DATA_ISOLATION_AUDIT.md)
3. [`docs/DATABASE_PHASE3C4F_PHASE21_AUDITLOG_SECURITY_AUDIT.md`](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/DATABASE_PHASE3C4F_PHASE21_AUDITLOG_SECURITY_AUDIT.md)

---

## 一、方案 A 與 方案 B 深層技術重評

本階段針對「方案 A（NOBYPASSRLS + RLS Policies）」與「方案 B（BYPASSRLS + 應用層授權 + Table ACL）」進行了不偏頗的工程評估，深入探討 PostgreSQL 交易級設定、連線池相容性及維運可靠度：

### 1. 方案 A 的技術可行性深度評估（如何實作與其代價）
方案 A 並非「絕對與 Prisma 不相容」，但在目前的雲端連線池與微服務架構下，必須付出極高的工程與維運代價：
- **實作技術路徑**：
  若要讓 PostgreSQL RLS Policies 辨識使用者的身分，後端必須透過 Prisma Client Extensions（`$extends`）攔截每一個查詢，強制使用互動式交易（Interactive Transaction），並在查詢前注入 Transaction-Local Session 變數：
  ```ts
  // 透過 Prisma Extension 自動為每個查詢注入 SET LOCAL
  const prismaWithRLS = prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          return prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_user_id', ${currentUserId}, true)`;
            return query(args);
          });
        },
      },
    },
  });
  ```
- **連線池機制約束（Connection Pooling Trap）**：
  - 若使用 **Session Pooler (Port 5432)**：若未嚴格使用 `SET LOCAL`（或在交易外呼叫 `SET`），使用者狀態會殘留在 Physical Connection 上，當連線被下一個使用者的 HTTP 請求借用時，將引發**嚴重的跨租戶身分污染（Cross-Tenant Pollution）**。
  - 若使用 **Transaction Pooler (Port 6543)**：PgBouncer 在交易結束後會執行 `DISCARD`，但 Transaction Pooler 不支援 Advisory Lock，會破壞 Prisma Migration 的防併發機制。
- **跨國跨網延遲倍增（Network Latency Multiplier）**：
  CODE TO KNOW 的後端部署於 Render（美國西岸/俄勒岡），Supabase 資料庫部署於亞太雪梨（`aws-0-ap-southeast-2`），單次 TCP/TLS 往返時間（RTT）約 150～180ms。
  方案 A 強制將單次查詢變成包含 `BEGIN`、`set_config`、`SQL 查詢`、`COMMIT` 的互動式交易，**單一查詢延遲將從 160ms 暴增至 480ms 以上**，大幅劣化前端使用者體驗。
- **Supabase `ensure_rls` 造成的維運重大風險（Migration Failure Trap）**：
  Supabase 內建 Event Trigger 會對每一次 Migration 新建的表自動執行 `ENABLE ROW LEVEL SECURITY`。在方案 A 下，任何新表建置當下均無 Policy，會立刻觸發 **DEFAULT DENY ALL**，導致上線即當機，直到手動執行 SQL 補上 Policy 為止。

### 2. 方案 B 的技術優勢與安全防禦邊界
- **優勢**：
  1. 符合現代三層式（3-Tier）企業應用架構標準：由專屬 Node.js 後端伺服器集中處理認證、授權與業務驗證，PostgreSQL 專注於高效存儲與自主存取控制（DAC）。
  2. 原生相容 Prisma ORM 與 Session Pooler，零延遲放大，零連線污染風險。
  3. 與 Supabase 官方後端 `service_role` 規範完全一致。
- **安全邊界保障**：
  1. 第一層 Table ACL 100% 阻斷破壞性操作（`AuditLog` Append-Only、`_prisma_migrations` 隔離、禁止 DDL）。
  2. 應用層實施強型別與 Zod 驗證，查詢嚴格綁定 `where: { userId: req.user.id }`。

### 3. 核心問題直接解答

- **哪一個方案的安全邊界較強？**  
  **理論上方案 A 較強**（具備資料庫核心的強制列過濾，可防範後端程式碼的 IDOR 漏洞）；**但實務上方案 B 的整體系統穩定度與可維護性遠高於方案 A**。
- **哪一個方案較適合目前的 CODE TO KNOW？**  
  **方案 B**。CODE TO KNOW 為獨立後端架構，前端絕不直連資料庫；方案 B 不會造成連線池污染與延遲暴增，且沙盒測試已證明其 Table ACL 防護絕對可靠。
- **採用方案 B 必須滿足哪些不可妥協條件（Non-Negotiable Prerequisites）？**
  1. **輸入驗證與身分綁定**：所有涉及私有資料的新增與查詢，`userId` 必須強制取自 `req.user.id`，絕不可信任前端傳入的 ID。
  2. **AuditLog 權限防護**：正式庫必須嚴格執行 `REVOKE UPDATE, DELETE, TRUNCATE ON "AuditLog" FROM app_runtime;`。
  3. **資料表擁有權移轉**：所有資料表與 Enum 的 Owner 必須全數轉移至 `migration_admin`，`app_runtime` 絕不可擁有任何物件。
  4. **傳輸安全**：強制啟用 TLS `sslmode=verify-full` 並綁定憑證。
  5. **軟刪除規範**：使用者刪除必須採用 `deletedAt` 標記軟刪除，防止外鍵 `ON DELETE SET NULL` 級聯修改 `AuditLog`。
- **如果後端授權檢查不完整，應如何處理？**  
  必須建立自動化 CI/CD 整合測試，在測試流水線中針對每個端點執行負向身分測試（以 Token A 存取 Token B 的資源），若發現 HTTP 回應非 403/404 則立即阻斷部署。

---

## 二、三大稽核報告結果綜合彙整

| 稽核項目 | 對應報告編號 | 核心審查結論 | 判定結果 |
| :--- | :--- | :--- | :---: |
| **角色特權與邊界** | `DOC-DB-PHASE21-ROLE-AUDIT-01` | `app_runtime` 絕非 Owner，無 DDL、無系統特權、無提權途徑；`migration_admin` 職責分離明確。 | **PASS** |
| **Prisma 資料隔離** | `DOC-DB-PHASE21-PRISMA-AUDIT-01` | 全量掃描 39 處 Prisma 呼叫，無 IDOR 漏洞，身分資訊皆取自信任之 `req.user.id`。 | **PASS** |
| **AuditLog 安全防護** | `DOC-DB-PHASE21-AUDITLOG-AUDIT-01` | Table ACL 保證 Append-Only；`BYPASSRLS` 無法突破 DAC；級聯變更已由軟刪除機制防禦。 | **PASS** |

---

## 三、Phase 2.1 最終審查判定

依據嚴格的獨立複核標準，本階段四份報告已完成全面的交叉比對與論證：

> ### **最終判定結果：【PASS / 審查通過】**
> 
> **理由**：
> 1. 證據充分、完整且具備技術可重現性。
> 2. `app_runtime WITH BYPASSRLS` 在搭配 Table ACL 與 Express/Prisma 應用層授權下，證實為適合目前專案架構的最佳安全平衡解。
> 3. 後端原始碼無越權漏洞，審計日誌具備真實的防篡改保證。
> 4. **可以正式結束架構論證，獲准推進至下一個實體執行階段（主金鑰保管與建立）**。

---

## 四、雲端切換全域狀態與前置阻礙矩陣

雖然架構論證已正式通過（PASS），但依據 DevSecOps 規範，**目前資料庫生產環境操作依然處於受控阻斷狀態**：

| 阻礙代號 | 阻礙事項說明 | 當前狀態 | 解除條件 |
| :---: | :--- | :---: | :--- |
| **BLK-01** | 主金鑰保管方式決策（KeePassXC 或 BitLocker USB） | 待使用者確認 | 使用者明確回覆選定之方案。 |
| **BLK-02** | 正式 32-byte AES-256 主金鑰建立與實體紙本卡備援 | 尚未建立 | 獲得授權 `AUTH-K-01 / AUTH-K-02` 後本機生成。 |
| **BLK-03** | Supabase 正式庫切換前即時加密備份 | 尚未執行 | 獲得授權 `AUTH-B-02` 後透過 Pooler 串流執行。 |
| **BLK-04** | 即時備份於本機 PG17 沙盒還原與結構校驗 | 尚未執行 | 獲得授權 `AUTH-B-03 / AUTH-B-04` 後驗證。 |
| **BLK-05** | Supabase 正式庫最小權限角色建立與擁有權切換 | 尚未執行 | 獲得授權 `AUTH-C-01~05` 後由 postgres 管理員執行。 |

---

## 五、環境狀態與安全查核確認

- **Git 分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **使用者未提交檔案狀態**：完整保留（`新增 文字文件.txt`、`1.docx`、`照片/` 均原封未動）。
- **零寫入承諾確認**：
  - 本階段未連線 Supabase 雲端資料庫。
  - 未執行任何資料庫寫入操作。
  - 未修改任何既有程式碼、Prisma Schema 或環境變數。
  - 未執行任何 Git Commit、Push、Reset 或 Clean。

---

## 六、下一階段推進建議

建議專案負責人確認本報告之 **PASS** 判定後，進入：
👉 **Phase 3：主金鑰保管決策與正式 AES-256 主金鑰建立（AUTH-K-01 / AUTH-K-02）**

*(本階段全部工作已完成，已依指示停止操作，等待專案負責人審閱與授權)*
