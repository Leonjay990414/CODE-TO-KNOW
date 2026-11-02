# 前端架構與模組規劃（FRONTEND ARCHITECTURE）

**專案名稱：** 碼上學｜CODE TO KNOW  
**文件路徑：** `docs/architecture/FRONTEND_ARCHITECTURE.md`  
**文件用途：** 定義前端專案結構、頁面模組、元件設計、路由、狀態管理及 API 串接規範。

---

## 1. 前端架構目標

前端採用 React + TypeScript + Vite，建立可維護、可擴充且支援響應式設計的教育平台介面。

設計目標：

1. 公開網站、學生端、教師端及管理端有清楚的模組分工。
2. 共用元件集中管理，避免重複開發。
3. 頁面、資料及業務邏輯適當分離。
4. API 呼叫統一管理。
5. 支援登入狀態及角色導向。
6. 支援手機、平板及桌面。
7. 方便未來增加新科目及新功能。
8. 讓 AI 開發工具能依照明確結構執行任務。

## 2. 前端技術基準

| 技術 | 用途 |
| --- | --- |
| React | 使用者介面 |
| TypeScript | 型別管理 |
| Vite | 開發及建置 |
| React Router | 頁面路由 |
| CSS Modules／CSS | 樣式管理 |
| TanStack Query | 伺服器資料及快取管理 |
| Zustand | 輕量全域狀態管理 |
| React Hook Form | 表單管理 |
| Zod | 資料驗證 |
| Vitest | 單元測試 |
| Playwright | 瀏覽器端測試 |

實際套件版本及安裝狀態，以後續專案實作與相容性驗證為準。

## 3. 專案資料夾結構

建議前端主要程式集中於 `frontend/`。

```text
frontend/
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   ├── providers.tsx
│   │   └── guards/
│   │
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── illustrations/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── data-display/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── courses/
│   │   ├── materials/
│   │   ├── questions/
│   │   ├── exams/
│   │   ├── learning/
│   │   ├── ai-assistant/
│   │   ├── games/
│   │   ├── analytics/
│   │   ├── classes/
│   │   ├── announcements/
│   │   └── administration/
│   │
│   ├── pages/
│   │   ├── public/
│   │   ├── student/
│   │   ├── teacher/
│   │   └── admin/
│   │
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   └── main.tsx
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 3.1 資料夾職責

| 資料夾 | 職責 |
| --- | --- |
| app | 應用程式初始化及路由 |
| components/ui | 基礎 UI 元件 |
| components/layout | 導覽列、側邊欄及版面 |
| components/feedback | 提示、錯誤及載入狀態 |
| features | 依業務功能分類的模組 |
| pages | 頁面組合與路由入口 |
| hooks | 共用 React Hooks |
| services | API 與外部服務 |
| stores | 全域用戶端狀態 |
| styles | 全域樣式及設計變數 |
| types | 共用 TypeScript 型別 |
| utils | 通用工具函式 |

## 4. 功能模組設計

每個主要功能放在自己的 `features/` 資料夾。

建議模組內部結構：

```text
features/questions/
├── components/
├── hooks/
├── services/
├── types/
├── utils/
└── index.ts
```

模組原則：

- 元件只處理介面呈現及互動。
- Hooks 管理模組內的狀態與操作。
- Services 負責 API 呼叫。
- Types 定義資料結構。
- Utils 放置可重複使用的純函式。
- 不得讓單一頁面承擔整個功能模組的所有邏輯。
- 模組之間應透過明確介面溝通。

## 5. 頁面與路由規劃

### 5.1 公開網站

| 路由 | 頁面 |
| --- | --- |
| `/` | 品牌首頁 |
| `/about` | 平台介紹 |
| `/features` | 功能介紹 |
| `/courses` | 公開課程介紹 |
| `/faq` | 常見問題 |
| `/login` | 登入 |
| `/register` | 註冊 |
| `/forgot-password` | 忘記密碼 |
| `/privacy` | 隱私權政策 |
| `/terms` | 使用條款 |

### 5.2 學生端

| 路由 | 頁面 |
| --- | --- |
| `/student` | 學生首頁 |
| `/student/courses` | 我的課程 |
| `/student/courses/:courseId` | 課程內容 |
| `/student/materials/:materialId` | 教材閱讀 |
| `/student/practice` | 題庫練習 |
| `/student/practice/:sessionId` | 練習作答 |
| `/student/exams` | 考試列表 |
| `/student/exams/:examId` | 考試資訊 |
| `/student/exams/:examId/attempt` | 考試作答 |
| `/student/wrong-answers` | 錯題整理 |
| `/student/ai` | AI 學習助理 |
| `/student/analytics` | 學習分析 |
| `/student/games` | 學習遊戲 |
| `/student/achievements` | 點數與成就 |
| `/student/profile` | 個人資料 |

### 5.3 教師端

| 路由 | 頁面 |
| --- | --- |
| `/teacher` | 教師首頁 |
| `/teacher/classes` | 班級管理 |
| `/teacher/classes/:classId` | 班級詳細資料 |
| `/teacher/students` | 學生管理 |
| `/teacher/courses` | 課程管理 |
| `/teacher/questions` | 題庫管理 |
| `/teacher/exams` | 考試管理 |
| `/teacher/exams/create` | 建立考試 |
| `/teacher/results` | 成績管理 |
| `/teacher/analytics` | 學習分析 |
| `/teacher/announcements` | 公告管理 |
| `/teacher/profile` | 個人資料 |

### 5.4 管理端

| 路由 | 頁面 |
| --- | --- |
| `/admin` | 管理首頁 |
| `/admin/users` | 使用者管理 |
| `/admin/roles` | 角色及權限 |
| `/admin/subjects` | 科目管理 |
| `/admin/courses` | 課程管理 |
| `/admin/questions` | 題庫管理 |
| `/admin/classes` | 班級管理 |
| `/admin/ai-settings` | AI 服務設定 |
| `/admin/system` | 系統設定 |
| `/admin/audit-logs` | 操作紀錄 |

實際開發時，路由可依功能完成順序逐步啟用，不需要一次建立所有頁面。

## 6. 版面與 Layout 設計

### 6.1 PublicLayout

用於公開網站。

包含：

- 品牌導覽列。
- 頁面內容。
- 頁尾。
- 登入及註冊入口。

### 6.2 StudentLayout

用於學生端。

包含：

- 學生導覽列。
- 側邊選單或手機版導覽。
- 學習內容區。
- 使用者資訊。
- 通知入口。

### 6.3 TeacherLayout

用於教師端。

包含：

- 教師導覽。
- 班級切換。
- 管理功能選單。
- 主要內容區。

### 6.4 AdminLayout

用於管理端。

包含：

- 管理導覽。
- 系統功能選單。
- 使用者資訊。
- 系統狀態及通知。
- 主要管理工作區。

不同角色不得只靠隱藏選單區分權限，實際權限仍須由後端 API 驗證。

## 7. 共用元件規劃

### 7.1 基礎元件

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Dialog
- Dropdown
- Tabs
- Tooltip
- Badge
- Card
- Avatar
- Progress
- Skeleton
- EmptyState
- ErrorState

### 7.2 資料呈現元件

- DataTable
- Pagination
- SearchBar
- FilterPanel
- StatCard
- ChartContainer
- ActivityTimeline
- NotificationList

### 7.3 教育專用元件

- QuestionCard
- QuestionOption
- AnswerFeedback
- ExamTimer
- ExamProgress
- CourseCard
- LessonCard
- MaterialViewer
- AIHintPanel
- AIChatPanel
- WrongAnswerCard
- LearningProgress
- AchievementCard
- GameCard

共用元件應保持一致的設計語言，並支援適當的響應式行為。

## 8. 狀態管理

前端狀態分為三種類型。

### 8.1 伺服器狀態

使用 TanStack Query 管理：

- 使用者資料。
- 課程資料。
- 題庫資料。
- 考試資料。
- 學習紀錄。
- 成績及分析資料。
- 公告資料。

### 8.2 全域用戶端狀態

使用 Zustand 管理必要的跨頁面狀態：

- 登入使用者基本資訊。
- 介面偏好設定。
- 導覽選單狀態。
- 必要的全域 UI 狀態。

登入及角色資訊仍須以後端驗證結果為準，不能將前端 Store 當成安全權限來源。

### 8.3 元件區域狀態

使用 React State 管理：

- 表單輸入。
- Dialog 開關。
- 當前 Tab。
- 暫時選取項目。
- 單一元件的互動狀態。

避免把所有狀態都放進全域 Store。

## 9. API 串接架構

API 呼叫統一放在 `services/` 或各功能模組的 `services/` 中。

建議：

```text
services/
├── api-client.ts
├── auth-service.ts
├── user-service.ts
└── error-handler.ts
```

### 9.1 API Client 職責

- 設定 API Base URL。
- 統一處理 JSON。
- 處理 Cookie 傳送設定。
- 統一處理 HTTP 錯誤。
- 設定逾時。
- 處理必要的重新登入流程。

使用 HttpOnly Cookie 時，前端不得嘗試讀取 Cookie 中的 HttpOnly 欄位。

### 9.2 API 使用原則

- 元件不得到處直接撰寫 fetch。
- API 呼叫集中管理。
- 伺服器資料透過 TanStack Query 管理。
- 對外傳送的資料必須符合型別及驗證規則。
- 不在前端保存 AI API Key 或資料庫密碼。

## 10. 登入與路由保護

建立以下路由保護機制：

- PublicRoute：公開頁面。
- AuthenticatedRoute：需要登入。
- RoleGuard：需要指定角色。
- PermissionGuard：需要指定權限。

路由保護主要用於前端導覽及操作體驗。

**真正的安全驗證必須由後端 API 再次執行。**

### 登入後導向

- Student → `/student`
- Teacher → `/teacher`
- Admin → `/admin`

若使用者沒有相應權限，應顯示無權限頁面或導向適當入口，不得只靠修改 URL 就能進入受保護資料。

## 11. 表單與資料驗證

使用 React Hook Form 管理複雜表單，使用 Zod 定義資料驗證規則。

適用範圍：

- 註冊及登入。
- 個人資料。
- 課程建立。
- 題目建立。
- 考試設定。
- 班級管理。
- 公告發布。

前端驗證可改善使用體驗，但後端必須重新驗證所有重要資料。

## 12. 樣式與品牌設計

使用共用 CSS Variables 管理品牌設計。

主要色彩：

| 名稱 | 色碼 |
| --- | --- |
| Warm Ivory | `#F5F2EA` |
| Deep Misty Blue-gray | `#526B7B` |
| Misty Blue | `#8FA9B8` |
| Pale Blue-gray | `#D9E2EA` |
| Natural Neutral | `#D9D2C4` |
| Muted Nude-pink | `#E8DCD8` |
| Champagne Gold | `#BDA77E` |
| Graphite | `#26343D` |

字體：

- 繁體中文：Noto Sans TC。
- 英文及數字：Inter。
- 程式碼：JetBrains Mono。

樣式必須遵守 `docs/design/DESIGN_SYSTEM.md`、`docs/design/WEBSITE_UI_UX_SPEC.md` 及 `docs/design/RESPONSIVE_DESIGN.md`。

## 13. 錯誤與載入狀態

所有主要資料頁面應考慮：

- 初次載入。
- 資料載入中。
- 資料載入成功。
- 沒有資料。
- API 錯誤。
- 網路中斷。
- 權限不足。
- 登入逾期。

不得讓使用者只看到空白畫面或無法理解的錯誤代碼。

## 14. 前端效能與品質

- 適當使用 React Lazy Loading。
- 大型頁面使用 Code Splitting。
- 圖片採用適當格式及尺寸。
- 避免不必要的重複渲染。
- 大量資料列表使用分頁或虛擬化。
- 圖表及 3D 元件按需載入。
- 尊重減少動態效果的使用者設定。
- 不得為追求動畫效果而影響基本操作。

## 15. 測試規劃

使用 Vitest 及 Playwright。

測試項目：

- 共用元件。
- 路由導向。
- 表單驗證。
- API 錯誤處理。
- 登入狀態。
- 角色導向。
- 學生練習流程。
- 教師考試建立流程。
- 手機、平板及桌面版面。

重要權限測試必須搭配後端 API 測試，不得只測試前端畫面。

## 16. 開發順序

建議依照以下順序開發：

1. 建立 React + TypeScript + Vite 基礎專案。
2. 設定路由與全域 Providers。
3. 建立設計變數及共用 UI 元件。
4. 建立 PublicLayout。
5. 建立登入及註冊頁面。
6. 建立登入狀態及路由保護。
7. 建立 StudentLayout。
8. 建立學生首頁及課程頁面。
9. 建立題庫及練習介面。
10. 串接後端 API。
11. 建立 AI 助理介面。
12. 建立教師端及管理端。
13. 完成響應式與自動化測試。

此順序是建議開發路徑，實際執行仍須依賴後端 API 與資料庫的完成狀態調整。

## 17. 驗收標準

- [ ] 前端資料夾結構清楚。
- [ ] 公開網站、學生端、教師端及管理端有明確分工。
- [ ] 路由命名及保護方式一致。
- [ ] 共用元件有統一規範。
- [ ] 伺服器狀態與用戶端狀態分離。
- [ ] API 呼叫集中管理。
- [ ] 表單具備驗證及錯誤回饋。
- [ ] 遵守品牌設計及 RWD 規範。
- [ ] 具備載入、空資料及錯誤狀態。
- [ ] 建立基本測試方式。

---

**文件狀態：** 前端架構初版，待實際專案結構及套件設定驗證。  
**重要說明：** 本文件定義預計採用的前端架構，不代表上述套件均已安裝或功能已完成。
