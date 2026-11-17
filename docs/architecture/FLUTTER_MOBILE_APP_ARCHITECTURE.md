# 碼上學｜CODE TO KNOW
# Flutter 跨平台行動應用程式（Android／iOS）架構規劃白皮書
**P20-OPS-010: Cross-Platform Mobile Application Architecture Specification**

- **文件編號**：DOC-ARCH-P20-FLUTTER-20261116
- **適用範圍**：CODE TO KNOW 行動端（Android & iOS）
- **核心目標**：共用後端 RESTful API、支援學科題庫離線練習、答題進度跨端同步、推播考前通知

---

## 一、行動端產品定位與設計理念

1. **產品定位**：
   - 專注於學員碎片化時間（通勤、課間）之學科模擬考、錯題複習、五大教育遊戲挑戰與即時班級通知。
   - 術科題組與代碼工作台因需要大螢幕編程，行動端提供精簡唯讀檢閱與題組引導模式。
2. **技術選型理由（Why Flutter）**：
   - **單一代碼庫（Single Codebase）**：Dart 語言同時編譯產出原生 ARM 機器碼（Android APK/AAB 與 iOS IPA），大幅降低多端維護成本。
   - **高度客製化渲染引擎（Impeller Engine）**：確保碼上學品牌調性（#F5F2EA 象牙白、#8FA9B8 藍灰、#BDA77E 香檳金）在所有尺寸螢幕上 120Hz 流暢渲染。
   - **完善的本機儲存與離線優先架構**：透過 Isar / Hive 本機資料庫完美繼承 605 題庫與離線自學機制。

---

## 二、系統架構與分層設計

```
┌────────────────────────────────────────────────────────┐
│             UI Layer (Widgets / Screens)               │
│  Home | QuestionBank | MockExam | WrongBook | Games    │
├────────────────────────────────────────────────────────┤
│           State Management (Riverpod / BLoC)           │
│   AuthNotifier | ExamStateNotifier | SyncNotifier      │
├────────────────────────────────────────────────────────┤
│             Domain / Use Case Layer                    │
│   SubmitExamUseCase | ReviewWrongQuestionsUseCase      │
├────────────────────────────────────────────────────────┤
│              Data Layer (Repository Pattern)           │
│   ┌────────────────────────┬─────────────────────────┐ │
│   │   Remote Data Source   │    Local Data Source    │ │
│   │ (Dio HTTP / REST API)  │  (Isar DB / SecureStorage)│
│   └────────────────────────┴─────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

1. **網路通訊層（Dio Client）**：
   - 完全共用現有 Express 後端端點（`/api/auth`, `/api/classrooms`, `/api/teachers`）。
   - 自動攔截並注入 `XSRF-TOKEN` 與 Session Cookie。
   - 實裝 Exponential Backoff 自動重試中介層。
2. **本機離線快取（Isar Database）**：
   - 將 17300 網頁設計丙級 605 道學科題庫以二進位壓縮預載於 App Assets。
   - 首次啟動即刻解壓至本地高速資料庫，無網路環境亦可隨時作答。
3. **狀態管理（Riverpod）**：
   - 編譯期型別安全，依賴注入清晰，便於自動化測試。

---

## 三、跨端安全防護與隱私控制

1. **憑證安全儲存（Flutter Secure Storage）**：
   - Android 使用 KeyStore 加密，iOS 使用 KeyChain，杜絕 Root/Jailbreak 明文讀取 Token。
2. **防作弊與計時器保護**：
   - 測驗計時器採用 `Stopwatch` 配合設備單調遞增時間（Monotonic Clock），避免使用者透過修改系統時間作弊。
3. **推播通知（Firebase Cloud Messaging - FCM）**：
   - 整合班級公告與考前 24 小時倒數提醒，提供防騷擾開關與推播分類控制。
