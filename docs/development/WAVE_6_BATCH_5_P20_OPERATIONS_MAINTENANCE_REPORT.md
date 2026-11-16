# 碼上學｜CODE TO KNOW
# 第六波 Batch 5：P20 品牌營運、系統維護與長期發展全面報告
**Wave 6: Batch 5 Phase 20 Operations, Maintenance & Long-Term Evolution Report**

- **執行日期**：2026-11-16
- **執行工具**：Antigravity IDE
- **正式整體進度基準**：**49.166860%**（嚴格保護凍結）
- **核准基準狀態**：PASS 70 / PARTIAL 79 / NOT STARTED 73 / BLOCKED 4
- **涵蓋 UID**：`P20-OPS-001` 至 `P20-OPS-012`（共 12 項 UID）
- **真實性與透明度聲明**：
  - 本批次實作之使用者回饋模組（`feedbackStorage.ts`）與學習分析遙測模組（`learningTelemetry.ts`）為**客戶端本機緩衝與離線展示模組**。
  - **嚴格禁止並在此公開聲明：絕不將本機 LocalStorage / SessionStorage 緩衝資料宣稱為正式雲端大數據分析或即時遠端遙測服務**。
  - 雲端實體資料庫連線持續嚴守 `AUTH-03 BLOCKED` 邊界防護。

---

## 一、P20 品牌營運 12 項 UID 逐項狀態盤點表

| 正式 UID | 正式名稱 | 原始核准狀態 | 原始比率 | 本批次實作／依據檔案 | 已達成規格範圍 | 未覆蓋邊界與後續目標 | 建議狀態 |
|---|---|:---:|:---:|---|---|---|:---:|
| `P20-OPS-001` | 建立例行系統健康檢查、錯誤追蹤及安全更新。 | `PASS` | 100% | `/api/health` 探針、`safe-error-logger.ts`、`run_supabase_backup.ps1` | 結構化錯誤記錄、資料庫連線探針、定期安全更新程序 | 外部第三方 24/7 Sentry 告警通道整合 | **PASS (保留)** |
| `P20-OPS-002` | 依政策定期備份，定期演練資料復原。 | `PASS` | 100% | `run_supabase_backup.ps1`、`ps-encoding-guard` | 備份腳本就緒、加密金鑰配置、資料復原演練 SOP | 跨國異地多可用區熱備份切換 | **PASS (保留)** |
| `P20-OPS-003` | 監控主機、資料庫、API、AI、郵件、儲存及成本。 | `NOT STARTED` | 0% | `emailQueueService.ts` 80% 預警、成本監控與閾值架構規格 | 郵件與 AI 每日配額門檻警報演算法 | 雲端帳單 API 自動扣款上限熔斷連動 | **NOT STARTED** |
| `P20-OPS-004` | 定期更新題庫、教材、證照資訊及官方來源。 | `PASS` | 100% | `official-theory-question-bank.test.ts`、題組一至五教材 | 官方 17300 網頁設計丙級 605 題庫、五大術科題組版本鎖定 | 勞動部技檢中心新年度公告即時爬蟲解析 | **PASS (保留)** |
| `P20-OPS-005` | 建立教師與學生回饋收集、分類、排程及回覆機制。 | `NOT STARTED` | 0% | [feedbackStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/feedbackStorage.ts)、`feedback-and-telemetry.test.ts` | 使用者回饋收集、5 大分類過濾（bug/content/feature/exam/general）、1~5 星級評分 | 正式後端資料庫工單系統與客服郵件自動回覆 | **NOT STARTED** |
| `P20-OPS-006` | 追蹤產品指標、學習成效、留存與功能使用情況。 | `NOT STARTED` | 0% | [learningTelemetry.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/learningTelemetry.ts)、`feedback-and-telemetry.test.ts` | 學習事件遙測（7 類事件追蹤）、個資與密碼欄位自動脫敏、會話緩衝 | 遠端資料倉儲（Snowflake / BigQuery）ETL 串流 | **NOT STARTED** |
| `P20-OPS-007` | 持續擴充遊戲、課程、科目及教學工具。 | `NOT STARTED` | 0% | 五大教育遊戲迴圈模組化引擎、課程擴展白皮書 | 遊戲題庫解耦抽換機制、自定義題庫介面規格 | 擴充第二證照科目（電腦軟體應用）實體遊戲模組 | **NOT STARTED** |
| `P20-OPS-008` | 管理第三方服務合約、授權、帳號及權限。 | `NOT STARTED` | 0% | 第三方軟體授權盤點清單（MIT/Apache 2.0 合規性） | 依賴套件開源授權審核無衝突 | 商業字型與付費 API 企業採購合約簽訂 | **NOT STARTED** |
| `P20-OPS-009` | 建立事故檢討、版本發布與變更管理。 | `NOT STARTED` | 0% | 維運事件 P0~P3 分級矩陣、變更管理 SOP | 事故分級通報流程、緊急回滾 SOP、變更日誌規範 | 跨部門事故檢討 Post-Mortem 審查會議制度 | **NOT STARTED** |
| `P20-OPS-010` | 規劃 Flutter Android／iOS App，共用既有 API。 | `NOT STARTED` | 0% | [FLUTTER_MOBILE_APP_ARCHITECTURE.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/architecture/FLUTTER_MOBILE_APP_ARCHITECTURE.md) | 跨平台雙端架構設計、Riverpod 狀態管理、REST API 共用規範、Isar 離線資料庫 | 實體 Flutter 專案建置與 App Store / Google Play 送審 | **NOT STARTED** |
| `P20-OPS-011` | 評估 Windows／macOS 桌面端需求與技術方案。 | `NOT STARTED` | 0% | [MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/architecture/MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md) | Tauri 2.0 vs Electron vs Flutter Desktop 客觀評估，首選 Tauri 2.0 方案確定 | 產出實體 MSI / DMG 安裝打包產物與電腦教室試裝 | **NOT STARTED** |
| `P20-OPS-012` | 依使用需求擴展其他科目、學校與教育領域。 | `NOT STARTED` | 0% | [MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/architecture/MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md) | 模組化能力矩陣定義、軟體應用、網路架設、AI 資料科學擴展藍圖 | 取得技檢中心各科目新題庫官方授權與結構化標註 | **NOT STARTED** |

---

## 二、使用者回饋機制實作（P20-OPS-005）

1. **核心模組路徑**：[frontend/src/utils/feedbackStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/feedbackStorage.ts)
2. **功能規格**：
   - 支援 5 大分類（`bug` 缺陷回報、`content` 教材錯誤、`feature` 功能建議、`exam` 測驗疑義、`general` 一般意見）。
   - 評分區間防禦性截斷（強制鎖定為 1 ~ 5 星整數）。
   - 自動生成唯一回饋識別代號（`fb-{timestamp}-{rand}`）並標記初始狀態為 `NEW`。
   - 具備損毀 JSON 防禦自癒機制，若本機儲存資料格式毀損，安全回傳乾淨空陣列，不中斷 UI 渲染。
3. **測試套件覆蓋**：[feedback-and-telemetry.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/feedback-and-telemetry.test.ts)（4 項測試，100% 通過）。

---

## 三、學習分析與操作軌跡遙測模組（P20-OPS-006）

1. **核心模組路徑**：[frontend/src/utils/learningTelemetry.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/learningTelemetry.ts)
2. **事件類型與規格**：
   - `PAGE_VIEW`：頁面瀏覽與駐留時長。
   - `EXAM_START` / `EXAM_SUBMIT`：模擬考開考、作答耗時與交卷成績。
   - `GAME_START` / `GAME_COMPLETE`：教育遊戲挑戰歷程與星級星數。
   - `AI_HINT_REQUEST`：學員調用 AI 教練鷹架引導之階段與頻次。
   - `WRONG_QUESTION_REVIEW`：錯題本重測與強化複習軌跡。
3. **個資安全防禦（PII Filtering）**：
   - 自動過濾 metadata 中的敏感字串（包含 `password`, `secret`, `token`, `auth`, `credit` 等欄位），杜絕機密資料隨事件外洩。
   - 記憶體緩衝區限制上限 200 筆，避免長時間運行造成記憶體洩漏。
4. **測試套件覆蓋**：[feedback-and-telemetry.test.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/feedback-and-telemetry.test.ts)（3 項測試，100% 通過）。

---

## 四、跨平台與多領域擴展白皮書產出

1. **Flutter 跨平台行動應用程式（Android／iOS）架構規劃白皮書**：  
   📄 [FLUTTER_MOBILE_APP_ARCHITECTURE.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/architecture/FLUTTER_MOBILE_APP_ARCHITECTURE.md)
   - 定義了 Dio 網路層共用現有 Express REST API、Isar 本機資料庫離線快取 605 題庫、Riverpod 狀態管理與 KeyStore/KeyChain 憑證加密保護。
2. **多領域教育科技擴展與跨平台桌面端評估白皮書**：  
   📄 [MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/architecture/MULTI_DOMAIN_EDUCATION_EXPANSION_ROADMAP.md)
   - 規劃了擴展至電腦軟體應用（11900）、網路架設（17200）與 AI 資料科學之模組化能力矩陣。
   - 深入評估了 Tauri 2.0、Electron、Flutter Desktop 三大桌面端方案，確定以 **Tauri 2.0** 為第一首選技術（極小體積 15MB、低記憶體、100% 復用 React 程式碼）。

---

## 五、自動化測試總帳與雙建置驗收

### 5.1 前端 Vitest 測試套件
- **指令**：`npx --prefix frontend vitest run frontend/tests`
- **測試結果**：**50 個測試檔案全數通過（50 Passed，0 Failed）**
- **案例總數**：**469 個測試案例全數通過（469 Passed，0 Failed）**
- **耗時**：1.65 秒，Exit Code: `0`

### 5.2 後端離線安全測試套件
- **指令**：`npx --prefix backend vitest run tests/*`
- **測試結果**：**16 個測試檔案全數通過（16 Passed，0 Failed）**
- **案例總數**：**216 個測試案例全數通過（216 Passed，0 Failed）**
- **耗時**：1.61 秒，Exit Code: `0`

### 5.3 全站測試總計
$$\text{全站通過測試案例總計} = 469 \text{ (前端)} + 216 \text{ (後端)} = \mathbf{685} \text{ 測試案例 100\% 通過}$$

### 5.4 雙建置驗收
1. 前端 `npm --prefix frontend run build` -> `tsc` 0 錯誤，Vite 生產打包耗時 2.22s（0 錯誤）。
2. 後端 `npm --prefix backend run build` -> `tsc` 0 錯誤。
