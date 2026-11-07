# CODE TO KNOW（碼上學）
# 資料庫資訊安全與個人資料隱私維護計畫 (DATABASE SECURITY PLAN)

- **系統名稱**：碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)
- **文件版本**：v1.0.0 (Pre-Database Implementation)
- **建立日期**：2026-11-07
- **文件路徑**：`docs/DATABASE_SECURITY_PLAN.md`
- **資安準則**：遵循 OWASP Top 10、台灣個人資料保護法（PDPA）與 ISO 27001 資訊安全控制標準。

---

## 一、身分鑑別與憑證防禦架構

### 1. 密碼安全雜湊 (Password Hashing)
- **演算法**：採用 `bcrypt`（Blowfish 基礎金鑰衍生函式），作業因子固定為 `12 rounds`（兼顧安全性與防禦 DoS 運算耗時）。
- **抗時序攻擊 (Timing Attack Protection)**：驗證密碼時一律調用常數時間比對（`bcrypt.compare`），防止攻擊者藉由分析反應時間推測密碼前綴。
- **儲存防護**：資料庫僅儲存 `passwordHash`，嚴禁任何形式之明文密碼落盤或記載於日誌。

### 2. 連線階段安全 (Stateful Session Management)
- **儲存與雜湊**：使用者登入成功後，後端隨機產生 32 位元組（256-bit）加密安全亂數作為 Session Token。
- **資料庫單向防護**：資料庫 `Session.tokenHash` 僅儲存 Token 經由 `SHA-256` 雜湊後之摘要。即便資料庫外洩，攻擊者亦無法直接還原原始 Cookie 進行 Session Hijacking。
- **Cookie 屬性設定**：
  - `HttpOnly = true`：徹底免疫客戶端 JavaScript（XSS）竊取 Cookie。
  - `SameSite = 'Lax'`：防禦跨站請求偽造（CSRF）。
  - `Secure = true`（正式環境）：強制限定 HTTPS 加密傳輸。
  - `Path = '/'`：鎖定全站有效範圍。
- **即時失權機制**：使用者執行登出或修改密碼時，後端同步執行資料庫實體撤銷，令所有關聯之 Session 立即失效。

### 3. CSRF 跨站請求偽造雙重防禦
- **中介軟體強制校驗**：所有可能改變資料庫狀態之變更請求（`POST`, `PUT`, `PATCH`, `DELETE`），中介軟體 `csrfProtection` 強制比對 Cookie 內之 CSRF Secret 與 HTTP 請求標頭之 `x-csrf-token`。
- **快取自動失效**：當發生 `CSRF_VALIDATION_FAILED` 時，客戶端自動清除快取 Token 並重新交握，確保通訊可靠性。

---

## 二、資料庫層注入防護與 RLS 架構比較分析

### 1. SQL Injection 絕對防護
- **Prisma 參數化查詢**：所有日常 ORM 操作（`findUnique`, `create`, `update` 等）皆經由底層 Query Engine 自動執行 SQL 參數化綁定，杜絕字串拼接注入。
- **原生查詢嚴格限制**：若必須調用 `$queryRaw`，**嚴禁使用字串拼接或未經轉義的變數內插**，必須使用 Prisma 提供的 Tagged Template 語法（自動參數化）。

### 2. 自建 PostgreSQL (現行) vs Supabase RLS 架構深度對比

| 比較維度 | 現行本機 PostgreSQL 容器架構 | Supabase RLS 託管資料庫架構 |
|---|---|---|
| **防護執行層** | **應用程式層 (Application-Level)**：由 Express 中介軟體與 Prisma Service 查詢條件強制把關。 | **資料庫核心層 (Database-Level)**：由 PostgreSQL 內建行級安全（RLS）核心攔截。 |
| **連線池機制** | 後端使用單一資料庫擁有者帳號（`codetoknow`）建立共用連線池（`pg.Pool`），效能高、無握手開銷。 | 若以 Prisma 連線，所有連線預設均為 `postgres` 最高權限，必須在每個事務前執行 `SET LOCAL request.jwt.claim.sub` 方能啟動 RLS。 |
| **多租戶隔離實作** | 在 Prisma 查詢中嚴格注入 `WHERE userId = req.user.id` 或 `WHERE classId IN (授權班級)`。 | 在資料庫建立 `CREATE POLICY ... USING (auth.uid() = user_id)`。 |
| **相依性與可移植性** | **極高**。100% 開源標準，可自由部署於任何雲端（GCP Cloud SQL, AWS RDS, 地端伺服器）。 | 依附 Supabase Auth 與專屬 JWT 生態系，遷移成本較高。 |
| **現況結論與建議** | 目前本案架構定位為**自建獨立平台**，現階段維持由後端 Service 嚴密控管查詢邊界；**在尚未決策遷移至 Supabase 前，不可擅自在 Migration 撰寫無效的 RLS Policy**。 |

---

## 三、個人資料保護與隱私遮蔽規範 (PII Protection)

### 1. 個資分類與敏感等級
- **高敏個資（Restricted）**：身分證字號、教師合格證字號、證明文件圖檔路徑、密碼雜湊。
- **中敏個資（Confidential）**：學生真實姓名、電子信箱、手機號碼、學號、家庭聯絡簿。
- **一般學習紀錄（Internal）**：測驗答對率、錯題清單、積分、登入時數。

### 2. 介面呈現與資料遮蔽 (Data Masking) 規範
當教師或管理員檢視名冊時，後端或前端 Service 必須在輸出前落實欄位遮蔽：
- **中文姓名**：3 字姓名遮蔽中間字（如 `陳*睿`）；2 字姓名遮蔽末字（如 `林*`）。
- **電子郵件**：帳號部分超過 3 字者，僅保留前後各 2 碼，其餘以星號替代（如 `ch***r@school.edu`）。
- **電話號碼**：末 4 碼以星號替代（如 `0912-***-567`）。

---

## 四、多租戶班級資料隔離防禦規範 (Prevent BOLA/IDOR)

任課教師查閱班級學生名冊時，後端 Service **嚴禁直接使用客戶端傳遞之 `classId` 進行盲目查詢**。必須遵循以下防禦範式：

```typescript
// 班級存取安全性服務層範式：
async function getStudentsInClass(classId: string, currentTeacherUserId: string) {
  // 1. 強制檢查師生歸屬權
  const classAssignment = await prisma.classTeacher.findFirst({
    where: {
      classId: classId,
      teacherId: currentTeacherUserId,
    },
  });

  if (!classAssignment) {
    // 阻絕越權存取，並寫入安全警報日誌
    await recordSecurityAlert({
      type: 'SUSPICIOUS_UNAUTHORIZED_CLASS_ACCESS',
      actorId: currentTeacherUserId,
      targetClassId: classId,
    });
    throw new ForbiddenError('權限不足：您並非此班級之任課教師', 'ACCESS_DENIED_NOT_CLASS_TEACHER');
  }

  // 2. 經授權後始得調閱名冊
  return prisma.enrollment.findMany({
    where: { classId: classId, status: 'ENROLLED' },
    include: {
      student: {
        select: {
          id: true,
          displayName: true,
          email: true,
          profile: true,
        },
      },
    },
  });
}
```

---

## 五、資料備份、保存與刪除政策 (Retention & Disaster Recovery)

1. **軟刪除原則**：使用者主檔（`User`）與班級主檔（`Class`）採用 `deletedAt` 標記軟刪除，避免歷史作答與成績外鍵約束斷裂。
2. **過期憑證自動清洗 (Garbage Collection)**：
   - 建立排程任務每日定期清理 `expiresAt < NOW()` 之已逾期 Session、EmailVerificationToken 與 PasswordResetToken。
3. **資料庫冷熱備份規劃**：
   - **每日全備份**：透過 `pg_dump -Fc` 產出自包含格式備份檔，雜湊校驗（SHA-256）後加密傳輸至異地冷儲存。
   - **定期還原演練**：每季於獨立沙盒環境執行一次完整還原測試，驗證 RTO（目標復原時間 < 2 小時）與 RPO（目標復原點 < 24 小時）。
4. **錯誤訊息脫敏 (Error Sanitization)**：
   - 正式環境（`NODE_ENV === 'production'`）一律攔截資料庫驅動拋出之原生例外，禁止將資料表名稱、欄位結構或連線字串輸出給前端客戶端。

---

## 六、公告、站內通知與郵件佇列專屬資安防護規範 (Announcement & Email Security Protocols)

### 1. 跨站腳本攻擊 (XSS) 防禦與富文本內容消毒
- **威脅模型**：管理員或學生在公告/分享內文注入惡意 `<script>`、`onerror=`、`iframe` 竊取讀者 Session Cookie。
- **防禦手段**：
  - 後端寫入 `Announcement.content` 前，強制經由白名單型 HTML 消毒器（如 `sanitize-html` 或 `DOMPurify`）過濾所有未知標籤與危險屬性。
  - 前端渲染使用經過安全跳脫之 Markdown 解析器，絕不直接將未經消毒的字串注入 `dangerouslySetInnerHTML`。
  - Session Cookie 一律維持 `HttpOnly: true`，即便發生 DOM 注入，惡意腳本亦無法讀取 Session Token。

### 2. 多受眾身分驗證與防跨班越權 (Anti-IDOR / Anti-BOLA)
- **威脅模型**：學生透過修改 API 請求參數（如 `GET /api/announcements?classId=other-class-id`）偷看其他班級之測驗或評語。
- **防禦手段**：
  - 後端查詢公告時**完全忽略前端傳送之 classId 查詢參數**。
  - 後端一律由 `req.user.id` 查詢使用者在 `Enrollment` 中的有效班級列表，動態綁定至 SQL `WHERE` 條件中。

### 3. 學生發文防洗版與速率限制 (Anti-Spam & Rate Limiting)
- **威脅模型**：惡意學生撰寫腳本發布大量垃圾公告或討論，塞爆資料庫與他人通知列表。
- **防禦手段**：
  - 學生角色受限於專屬發文頻率限制（Rate Limiting）：每 60 秒最多發布 1 則，單日最多 5 則。
  - 發布內容長度限制：標題上限 200 字，內文上限 5000 字。
  - 敏感關鍵詞過濾與違規檢舉機制：提供一鍵檢舉（`AnnouncementModeration`），任課教師與管理員可即時下架。

### 4. 郵件日誌脫敏與非同步佇列保護 (Email Sanitization & Queue Decoupling)
- **威脅模型**：全校性公告發布觸發萬封郵件同步發送，導致後端主服務 HTTP 連線池耗盡崩潰；郵件日誌洩漏學生 Email 個資。
- **防禦手段**：
  - **非同步佇列解耦**：公告發布 API 僅將寄件任務寫入 `EmailQueue`，立即回傳 HTTP 200，由獨立背景 Worker 依照速率配額（如每秒 20 封）消化。
  - **大內容禁重覆**：`EmailQueue` 僅儲存 `announcementId` 與範本參數，不重複拷貝龐大 HTML 內文。
  - **日誌遮蔽脫敏**：`EmailDeliveryLog` 與系統日誌在輸出至監控平台時，強制對收件者 Email 進行遮蔽處理（如 `ch***r@school.edu`），符合個資法規。
