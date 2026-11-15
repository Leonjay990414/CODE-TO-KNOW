# 碼上學｜CODE TO KNOW
# 班級管理系統 API 規格、邀請碼演算法與權限設計規範書
**Classroom Management API Specification, Join Code Algorithm & RBAC Design**

---

## 一、設計核心原則與資料庫現況

### 1.1 資料庫現有 DDL 與模型依據
本系統架構直接對齊既有 Prisma 遷移（`20261108000000_add_business_models/migration.sql`）中已建立完成的實體資料表：
- `Class` 資料表：包含 `id`, `name`, `code` (即 joinCode), `teacherId`, `description`, `status`, `createdAt`, `updatedAt`。
  - 唯一性約束：`CREATE UNIQUE INDEX "Class_joinCode_key" ON "Class"("joinCode");`
- `ClassEnrollment` 資料表：包含 `id`, `classId`, `studentId`, `enrolledAt`, `status`。
  - 複合唯一約束：`CREATE UNIQUE INDEX "ClassEnrollment_classId_studentId_key" ON "ClassEnrollment"("classId", "studentId");`
  - 外鍵約束：分別指向 `Class(id)` 與 `User(id)`。

### 1.2 RESTful 路由命名慣例
- 所有 API 端點均遵循 `api/v1/classes` 之命名結構。
- 統一回應封裝格式：
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

## 二、邀請碼（Join Code）生成與校驗演算法

### 2.1 字元集設計原則（Human-Friendly Alphanumeric）
為杜絕學生在行動裝置或投影幕抄寫時產生混淆，嚴格剔除高歧義字元：
- 排除：數字 `0` 與字母 `O`、數字 `1` 與大寫字母 `I`、大寫字母 `L`。
- **核定可用字元集（有效基數 Base 31）**：
  $$\Sigma = \{ \text{2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F, G, H, J, K, M, N, P, Q, R, S, T, U, V, W, X, Y, Z} \}$$
  空間容量為 $31^8 \approx 852,891,037,441$（超過 8,500 億種排列），足以完全防範碰撞與暴力列舉。

### 2.2 演算法實作規範（TypeScript 虛擬碼）
```typescript
import crypto from 'crypto';

const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 8;
const MAX_COLLISION_RETRIES = 5;

/**
 * 產生安全且高辨識度之 8 位班級邀請碼
 */
export function generateSecureJoinCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let result = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = bytes[i] % ALLOWED_CHARS.length;
    result += ALLOWED_CHARS[randomIndex];
  }
  return result;
}

/**
 * 驗證前端傳入之邀請碼格式
 */
export function validateJoinCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.trim().toUpperCase();
  const regex = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;
  return regex.test(cleanCode);
}
```

---

## 三、RBAC 權限矩陣與所有權驗證邏輯

### 3.1 角色權限矩陣（Role-Based Access Control Matrix）

| API 端點與操作 | HTTP 方法 | Student (學生) | Teacher (教師) | Admin (管理員) | 所有權檢核規則 (Ownership Check) |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/api/v1/classes` (列表) | GET | 僅能看已加入的班級 | 僅能看自己建立的班級 | 全平台所有班級 | Context 注入過濾條件 |
| `/api/v1/classes` (建立) | POST | ❌ 403 Forbidden | ✅ 允許建立 | ✅ 允許建立 | 自動綁定 `teacherId = user.id` |
| `/api/v1/classes/:id` (明細) | GET | 必須為在冊學員 | 必須為該班教師 | 允許調閱 | `class.teacherId === user.id` 或在冊 |
| `/api/v1/classes/:id` (更新) | PUT/PATCH | ❌ 403 Forbidden | 必須為該班教師 | 允許更新 | `class.teacherId === user.id` |
| `/api/v1/classes/:id` (封存/刪除) | DELETE | ❌ 403 Forbidden | 必須為該班教師 | 允許操作 | `class.teacherId === user.id` |
| `/api/v1/classes/join` (加入) | POST | ✅ 憑碼加入 | ❌ 教師不可當學生加入 | ❌ 不得操作 | 學生角色且未加入過 |
| `/api/v1/classes/:id/leave` (退出) | POST | 僅能退出自己 | ❌ 教師不可退班 | 允許強制移除 | `enrollment.studentId === user.id` |
| `/api/v1/classes/:id/students` (名冊) | GET | ❌ 403 Forbidden | 必須為該班教師 | 允許調閱 | `class.teacherId === user.id` |
| `/api/v1/classes/:id/students/:sid` | DELETE | ❌ 403 Forbidden | 必須為該班教師 | 允許移除 | `class.teacherId === user.id` |
| `/api/v1/classes/:id/code/regenerate` | POST | ❌ 403 Forbidden | 必須為該班教師 | 允許重設 | `class.teacherId === user.id` |

### 3.2 後端中介軟體驗證流程（Ownership Guard Middleware）
```typescript
export async function requireClassOwnership(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  const { id: classId } = req.params;

  if (user.role === 'ADMIN') {
    return next(); // 管理員具備全域繞道權限
  }

  const targetClass = await prisma.class.findUnique({
    where: { id: classId },
    select: { teacherId: true, status: true }
  });

  if (!targetClass) {
    return res.status(404).json({ success: false, error: { code: 'CLASS_NOT_FOUND', message: '查無此班級' } });
  }

  if (targetClass.teacherId !== user.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN_NOT_OWNER', message: '無權限管理非本人建立之班級' } });
  }

  req.targetClass = targetClass;
  next();
}
```

---

## 四、核心 RESTful API 端點合約規範

### 4.1 建立班級（Create Class）
- **URL**: `POST /api/v1/classes`
- **權限**: `TEACHER`, `ADMIN`
- **Request Body (JSON)**:
```json
{
  "name": "113學年度資訊科網頁丙級衝刺班",
  "description": "涵蓋學科605題與五大題組（104301~104305）實作輔導",
  "maxStudents": 60
}
```
- **Response 201 Created**:
```json
{
  "success": true,
  "data": {
    "id": "cls_9a8b7c6d5e",
    "name": "113學年度資訊科網頁丙級衝刺班",
    "joinCode": "7K9M3X2P",
    "status": "ACTIVE",
    "teacherId": "usr_t101",
    "studentCount": 0,
    "maxStudents": 60,
    "createdAt": "2026-11-15T08:00:00.000Z"
  }
}
```

### 4.2 憑邀請碼加入班級（Join Class via Code）
- **URL**: `POST /api/v1/classes/join`
- **權限**: `STUDENT`
- **Request Body (JSON)**:
```json
{
  "joinCode": "7K9M3X2P"
}
```
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "enrollmentId": "enr_123456",
    "classId": "cls_9a8b7c6d5e",
    "className": "113學年度資訊科網頁丙級衝刺班",
    "teacherName": "陳老師",
    "enrolledAt": "2026-11-15T08:15:00.000Z"
  }
}
```
- **錯誤回應範例**:
  - `404 Not Found`: `{ "success": false, "error": { "code": "INVALID_JOIN_CODE", "message": "班級邀請碼無效或已停用" } }`
  - `409 Conflict`: `{ "success": false, "error": { "code": "ALREADY_ENROLLED", "message": "您已是此班級成員" } }`
  - `429 Too Many Requests`: `{ "success": false, "error": { "code": "RATE_LIMIT_EXCEEDED", "message": "嘗試次數過多，請稍後再試" } }`

### 4.3 取得班級名冊與學習進度（Get Class Students & Progress）
- **URL**: `GET /api/v1/classes/:id/students?page=1&limit=20&search=王&sort=progress_desc`
- **權限**: `TEACHER`（班級持有者）, `ADMIN`
- **Response 200 OK**:
```json
{
  "success": true,
  "data": [
    {
      "studentId": "usr_s001",
      "name": "王小明",
      "email": "ming@example.edu.tw",
      "enrolledAt": "2026-11-10T09:00:00.000Z",
      "academicProgress": {
        "answeredQuestions": 580,
        "totalQuestions": 605,
        "completionRate": 0.958,
        "averageAccuracy": 88.5
      },
      "practicalProgress": {
        "completedTasks": 4,
        "totalTasks": 5,
        "taskStatus": {
          "104301": "PASSED",
          "104302": "PASSED",
          "104303": "PASSED",
          "104304": "PASSED",
          "104305": "IN_PROGRESS"
        }
      },
      "lastActiveAt": "2026-11-15T07:45:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 4.4 重設班級邀請碼（Regenerate Join Code）
- **URL**: `POST /api/v1/classes/:id/code/regenerate`
- **權限**: `TEACHER`（班級持有者）, `ADMIN`
- **Response 200 OK**:
```json
{
  "success": true,
  "data": {
    "classId": "cls_9a8b7c6d5e",
    "oldJoinCode": "7K9M3X2P",
    "newJoinCode": "4W8N9Y6D",
    "updatedAt": "2026-11-15T09:00:00.000Z"
  }
}
```

---

## 五、資料庫交易保證與錯誤代碼規範

### 5.1 交易原子性（Transactional Integrity）
加入班級操作必須置於 Prisma 交易內部執行，杜絕超額收生與計數競爭：
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 悲觀鎖或重新讀取班級以確認名額
  const targetClass = await tx.class.findUnique({
    where: { joinCode: cleanCode, status: 'ACTIVE' },
    include: { _count: { select: { enrollments: true } } }
  });

  if (!targetClass) {
    throw new CustomError('INVALID_JOIN_CODE', 404, '邀請碼不存在或班級未啟用');
  }

  if (targetClass._count.enrollments >= targetClass.maxStudents) {
    throw new CustomError('CLASS_FULL', 409, '該班級名額已滿');
  }

  // 2. 建立選班記錄
  const enrollment = await tx.classEnrollment.create({
    data: {
      classId: targetClass.id,
      studentId: userId,
      status: 'ACTIVE'
    }
  });

  return { targetClass, enrollment };
});
```

### 5.2 系統標準錯誤代碼對照表

| 錯誤代碼 (Code) | HTTP 狀態碼 | 繁體中文說明訊息 | 發生情境 |
| :--- | :---: | :--- | :--- |
| `CLASS_NOT_FOUND` | 404 | 查無指定的班級資訊 | ID 不存在或已被刪除 |
| `INVALID_JOIN_CODE` | 404 | 班級邀請碼無效或格式不符 | 輸入錯誤或代碼已被重設 |
| `ALREADY_ENROLLED` | 409 | 學生已加入該班級，請勿重複加入 | 觸發複合唯一約束 |
| `CLASS_FULL` | 409 | 該班級名額已滿，無法繼續加入 | 名額超過 `maxStudents` |
| `CLASS_LOCKED` | 403 | 該班級已停止招收新成員 | 班級狀態為 LOCKED 或 ARCHIVED |
| `FORBIDDEN_NOT_OWNER` | 403 | 僅限班級授課教師或管理員進行此操作 | 越權操作非本人之班級 |
| `CODE_COLLISION_FAILED` | 500 | 系統繁忙，生成唯一邀請碼失敗，請重試 | 連續 5 次隨機碰撞（極端罕見） |
| `RATE_LIMIT_EXCEEDED` | 429 | 操作過於頻繁，請於 15 分鐘後再試 | 觸發防暴力破解限制 |
