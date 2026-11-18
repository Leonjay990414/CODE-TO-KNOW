# CODE TO KNOW｜P2 全站視覺與操作體驗修正及 P1 補充驗收報告

**任務版本**：`P2-VISUAL-REPAIR-2026-11-18`  
**執行環境**：Windows / Node.js 22 / Vite 5 / TypeScript 5 / Vitest 5.1.1  
**專案名稱**：碼上學｜CODE TO KNOW (Learn Beyond Limits.)  
**執行分支**：`develop` (HEAD: `502ccbc`)  
**報告日期**：2026-11-18  

---

## 目錄

1. [執行摘要](#一執行摘要)
2. [P2 四項核心驗收結果](#二p2-四項核心驗收結果)
3. [P1 補充檢查驗收結果](#三p1-補充檢查驗收結果)
4. [全站色彩對比度矩陣表 (P2-01)](#四全站色彩對比度矩陣表-p2-01)
5. [互動元件觸控尺寸驗收表 (P2-02)](#五互動元件觸控尺寸驗收表-p2-02)
6. [首頁數據與指標真實性來源表 (P2-03)](#六首頁數據與指標真實性來源表-p2-03)
7. [五層架構 21 頁面實際歸屬盤點矩陣 (P2-04)](#七五層架構-21-頁面實際歸屬盤點矩陣-p2-04)
8. [術科進度 Key 新舊相容性驗證機制](#八術科進度-key-新舊相容性驗證機制)
9. [System Ops 維運遙測數據來源核實](#九system-ops-維運遙測數據來源核實)
10. [完整修改檔案清單](#十完整修改檔案清單)
11. [自動化測試與 RWD 驗證結果](#十一自動化測試與-rwd-驗證結果)
12. [正式發布阻擋因素與尚未完成項目](#十二正式發布阻擋因素與尚未完成項目)
13. [安全限制覆核 (Git 與部署狀態)](#十三安全限制覆核-git-與部署狀態)

---

## 一、執行摘要

本輪任務依據《全站網頁版面配置與響應式稽核》所列之 P2 次級體驗問題及 P1 補充審查要求，完成了全站金色文字無障礙對比度修正（提升至 WCAG AA 4.5:1）、全站 Modal 與主要互動元件 44×44 CSS px 觸控目標調校、首頁各區塊評估模型之示範透明度標示，以及 21 個既有頁面在五層架構下的嚴謹盤點。

本階段恪守最高安全限制：**未執行 Git Commit、Push、Merge 或 Deploy**，**未修改 Supabase 資料庫與 Prisma Schema**，**未修改五大正式術科題組內容**，**未刪除任何舊資料或進度**，**未安裝任何外部套件**。

---

## 二、P2 四項核心驗收結果

| 項目編號 | 稽核項目 | 修正前狀態 | 修正後成果 | 驗收狀態 |
|---|---|---|---|:---:|
| **P2-01** | 全站香檳金文字對比度 | 淺色底使用原始香檳金 `#BDA77E`，對比度僅 2.09:1 ~ 2.34:1，未達 WCAG AA | 建立設計 Token 階層，淺色底統一採用高對比金色 `--color-brand-gold-text: #7C663D`（4.91:1 ~ 5.49:1）；深色底保留 `#BDA77E`（5.48:1 ~ 6.26:1），全數通過對比要求 | **PASS** |
| **P2-02** | 互動觸控目標尺寸 | AuthModal 與各彈窗關閉鈕為 36×36px 或無 padding，星號評分與分頁鈕低於 44px | 全站 6 大 Modal 關閉按鈕、分頁按鈕、星號評分、密碼切換鈕與 Navbar 通知鈴均調校為 `min-width: 44px; min-height: 44px;` | **PASS** |
| **P2-03** | 首頁數據真實性與標示 | 稽核指出原規劃之「98.4% 通過率」、「1,280+ 學員」易引發真實性疑慮 | 確認首頁未掛載未經證實之全站線上統計；既有展示區塊（72.4% 通過率、+18% 成長、全班 89.2% 及格率）均明確加註「*展示版示範模型／評估指標」 | **PASS** |
| **P2-04** | 五層架構 21 頁面歸屬盤點 | 頁面全數暫存於 `frontend/src/pages/public/`，未有正式架構映射清單 | 完成全站 21 個既有頁面（加計新版術科中樞與維運儀表板共 27 檔）之 L1 ~ L5 職責、路由、RBAC 權限與 API 依賴矩陣盤點 | **PASS** |

---

## 三、P1 補充檢查驗收結果

| 補充項目 | 檢查標的 | 實證結果 | 驗收狀態 | 說明與後續行動 |
|---|---|---|:---:|---|
| **A. Footer 聯絡信箱** | `contact@codetoknow.edu` | 超連結已改為 `mailto:`，但目前尚無已註冊網域之 MX 郵件伺服器解析證據 | **PARTIAL** | 本專案尚未建立外部 DNS 託管與企業信箱，誠實標示為 PARTIAL，上線前需向學校/品牌網管申請 MX 綁定。 |
| **B. 術科進度相容性** | `ctk_practical_progress:` vs `practical_progress:` | 於 `learningStorage.ts` 加入新舊前綴雙向容錯機制，新前綴未命中時自動平緩降級讀取舊版，寫入時升級至新前綴且不刪舊資料 | **PASS** | 自動化單元測試已驗證無縫過渡，完全相容舊版本地暫存紀錄。 |
| **C. System Ops 數據來源** | 健康檢查、資料庫延遲、CPU/記憶體、安全日誌 | `/api/health`（SELECT 1 延遲）與 `/api/admin/audit-logs` 為真實後端 API；硬體 CPU / RAM 監控目前後端未設探針 | **PASS** | 界面與文件嚴格標明真實探針項目，未偽造即時 CPU/記憶體圖表，硬體探針誠實標註待第二階段 APM 介接。 |

---

## 四、全站色彩對比度矩陣表 (P2-01)

依據 WCAG 2.1 / 2.2 標準，一般正文（< 18pt 或 < 14pt 粗體）對比度需達 **4.5:1 (Level AA)**；大字標題（≥ 18pt 或 ≥ 14pt 粗體）對比度需達 **3.0:1 (Level AA Large)**。

### 色碼對比計算數據

| 前景色 Token | 色碼 Hex | 背景色 (代表表面) | 背景色 Hex | 計算對比度 | WCAG AA 標準 | 判定結果 |
|---|---|---|---|:---:|:---:|:---:|
| **設計 Token (`--color-brand-gold-text`)** | `#7C663D` | 純白 (卡片/輸入框表面) | `#FFFFFF` | **5.49 : 1** | ≥ 4.5:1 | **PASS (正文及大字)** |
| **設計 Token (`--color-brand-gold-text`)** | `#7C663D` | 暖象牙白 (主要品牌背景) | `#F5F2EA` | **4.91 : 1** | ≥ 4.5:1 | **PASS (正文及大字)** |
| **設計 Token (`--color-brand-gold-text`)** | `#7C663D` | 自然米灰 / 燕麥色 | `#D9D2C4` | **3.65 : 1** | ≥ 3.0:1 | **PASS (大字/徽章)** |
| **深香檳金 (`--color-brand-gold-dark`)** | `#8D7243` | 純白 (純白底大標題) | `#FFFFFF` | **4.54 : 1** | ≥ 4.5:1 | **PASS (正文及大字)** |
| **深香檳金 (`--color-brand-gold-dark`)** | `#8D7243` | 暖象牙白 (品牌次要背景) | `#F5F2EA` | **4.06 : 1** | ≥ 3.0:1 | **PASS (大字標題)** |
| **原始香檳金 (`--color-brand-gold`)** | `#BDA77E` | 深石墨灰 (Footer / CTA 區塊) | `#26343D` | **5.48 : 1** | ≥ 4.5:1 | **PASS (深色底專用)** |
| **原始香檳金 (`--color-brand-gold`)** | `#BDA77E` | 編輯器暗色底 (Sandbox) | `#1E293B` | **6.26 : 1** | ≥ 4.5:1 | **PASS (深色底專用)** |
| *原始香檳金 (修正前不合格項)* | *`#BDA77E`* | *純白 (修正前)* | *`#FFFFFF`* | *2.34 : 1* | *< 4.5:1* | *FAIL (已全面替換)* |
| *原始香檳金 (修正前不合格項)* | *`#BDA77E`* | *暖象牙白 (修正前)* | *`#F5F2EA`* | *2.09 : 1* | *< 4.5:1* | *FAIL (已全面替換)* |

---

## 五、互動元件觸控尺寸驗收表 (P2-02)

驗收目標：主要可點擊與互動區域盡量達到 **44 × 44 CSS px**（符合 WCAG 2.5.5 / 2.5.8 與 Apple HIG 觸控標準），優先調整 hit area 與 padding，不扭曲視覺圖示比例。

| 元件名稱 | 所屬檔案 | 互動目標說明 | 修正前尺寸 | 修正後尺寸 (Hit Area) | 驗收視圖 (320px~1440px) | 結果 |
|---|---|---|:---:|:---:|:---:|:---:|
| **AuthModal 關閉鈕** | `AuthModal.tsx` | 右上角關閉對話框 | 36 × 36 px | **44 × 44 px** (`min-w-[44px] min-h-[44px]`) | 無溢位、對齊正常 | **PASS** |
| **AuthModal 密碼切換鈕** | `AuthModal.tsx` | 密碼顯示/隱藏眼睛 | 24 × 24 px (padding 4px) | **44 × 44 px** (全高度擴展) | 不重疊輸入文字 | **PASS** |
| **AuthModal 示範身分鈕** | `AuthModal.tsx` | 一鍵示範學員/教師登入 | 高度 34 px | **min-height: 44 px** | 彈性換行排列良好 | **PASS** |
| **FeedbackModal 關閉鈕** | `FeedbackModal.tsx` | 右上角關閉對話框 | 32 × 32 px | **44 × 44 px** | 正常居中 | **PASS** |
| **FeedbackModal 星級評分** | `FeedbackModal.tsx` | 1~5 顆星滿意度選取 | 32 × 32 px (padding 4px) | **44 × 44 px** (padding 10px) | 觸控區域不干擾 | **PASS** |
| **FeedbackModal 類別切換** | `FeedbackModal.tsx` | 4 大問題分類按鈕 | 高度 32 px | **min-height: 44 px** | 垂直排列間距足夠 | **PASS** |
| **NotificationCenter 關閉鈕** | `NotificationCenterModal.tsx` | 右上角關閉按鈕 | 36 × 36 px | **44 × 44 px** | 邊距自適應 | **PASS** |
| **NotificationCenter 分頁標籤** | `NotificationCenterModal.tsx` | 5 大通知類別 Pill | 高度 28 px | **min-height: 44 px** (padding 8x14px) | 水平捲軸滑動順暢 | **PASS** |
| **StudentClassJoin 關閉鈕** | `StudentClassJoinModal.tsx` | 右上角關閉按鈕 | 28 × 28 px | **44 × 44 px** | 點擊靈敏 | **PASS** |
| **TeacherApplyModal 關閉鈕** | `TeacherApplyModal.tsx` | 右上角關閉按鈕 | 36 × 36 px | **44 × 44 px** | 邊界圓角適中 | **PASS** |
| **GameAchievements 關閉鈕** | `GameAchievementsModal.tsx` | 右上角關閉按鈕 | 32 × 32 px | **44 × 44 px** | 居中無變形 | **PASS** |
| **GameBriefing 關閉鈕** | `GameBriefingModal.tsx` | 右上角關閉按鈕 | 30 × 30 px | **44 × 44 px** | 居中無變形 | **PASS** |
| **Navbar 站內通知鈴** | `Navbar.tsx` | 頂部導覽列通知按鈕 | 36 × 36 px | **44 × 44 px** | 與 Logo 間距適中 | **PASS** |
| **Navbar 漢堡選單鈕** | `Navbar.tsx` | 行動端導覽列展開鈕 | 44 × 44 px | **44 × 44 px** (既有符合) | 320px 全斷點通過 | **PASS** |
| **AdminDashboard 分頁控制** | `AdminDashboardPage.tsx` | 審核日誌上一頁/下一頁 | 高度 32 px | **min-height: 44 px** (padding 0 16px) | 桌面與平板無溢位 | **PASS** |
| **SystemOpsDashboard 分頁控制** | `SystemOpsDashboardPage.tsx` | 維運日誌上一頁/下一頁 | 高度 32 px | **min-height: 44 px** (padding 0 16px) | 桌面與平板無溢位 | **PASS** |

---

## 六、首頁數據與指標真實性來源表 (P2-03)

| 頁面區塊 | 數據/文本內容 | 原始性質 | 是否有後端真實來源 | 修正後標示與處理方案 | 狀態 |
|---|---|---|:---:|---|:---:|
| **Hero 頂部亮點** | 「4 階啟發式提示」、「理論與實務雙軌」、「師生雙端協同」 | 平台核心產品特點 | 是 (教學功能規格) | 保留，屬平台真實架構設計 | **PASS** |
| **Hero 互動卡片** | 「DEMO // 括弧有效性演算法」 | 互動展示原型 | 本機靜態展示 | 既有清楚標註 `<span class="badge badge-gold">互動展示原型</span>` | **PASS** |
| **稽核所指數據** | 「98.4% 通過率」、「1,280+ 學員」 | 早期稽核參考項目 | **否 (無真實依據)** | **確認正式首頁未發布上述虛構數字**，杜絕不實宣傳 | **PASS** |
| **LearningExperience** | 「通過率 72.4%」 | 題目展示卡片 | 示範考題評估模型 | 標示為 `通過率 72.4% (示範題組參考值)` | **PASS** |
| **LearningExperience** | 「成長率 +18%」 | 學習雷達模擬卡片 | 示範模擬 | 標示為 `成長率 +18% (示範模擬)` | **PASS** |
| **LearningExperience** | 「持續學習 24 天」 | 學習時長模擬卡片 | 示範模型 | 底部註明 `*本區數據為展示評估模型，非線上真實學員統計` | **PASS** |
| **StudentTeacherDual** | 「全班及格率 89.2%」、「平均作業時長 38 分鐘」 | 教師後台預覽模擬 | 示範模擬 | 標題改為 `教師端班級數據概覽預覽 (展示版示範模型)`，數值旁標註 `(示範指標)` | **PASS** |

---

## 七、五層架構 21 頁面實際歸屬盤點矩陣 (P2-04)

依據專案規範《CODE TO KNOW 20 階段總體規劃與五層網站架構》，全站 21 個既有頁面（加計新版術科中樞與維運儀表板共 27 檔）之實體盤點與層級映射如下表。**本輪僅完成精確盤點與路由對照，未破壞既有路徑與 import**。

| 項次 | 頁面名稱 | 現有路徑 (`frontend/src/`) | 目標層級 | 目標規範路徑 | 路由 Hash | 權限保護 (RBAC) | 核心 API 依賴 | 遷移風險評估 |
|:---:|---|---|---|---|---|---|---|:---:|
| 1 | `HomePage.tsx` | `pages/public/HomePage.tsx` | **Level 1 (Marketing)** | `pages/marketing/HomePage.tsx` | `#hero`, `#home` | Public | 無 | 低 (僅首頁匯入) |
| 2 | `CertificationsPage.tsx` | `pages/public/CertificationsPage.tsx` | **Level 1 (Marketing)** | `pages/marketing/CertificationsPage.tsx` | `#certifications` | Public | 無 (靜態課綱) | 低 |
| 3 | `CertificationDetailPage.tsx` | `pages/public/CertificationDetailPage.tsx` | **Level 1 (Marketing)** | `pages/marketing/CertificationDetailPage.tsx` | `#certification-detail` | Public | 無 | 低 |
| 4 | `WebDesignCDemoPage.tsx` | `pages/public/WebDesignCDemoPage.tsx` | **Level 1 (Marketing)** | `pages/marketing/WebDesignCDemoPage.tsx` | `#web-design-demo` | Public | 無 | 低 |
| 5 | `PracticalLearningPage.tsx` | `pages/public/PracticalLearningPage.tsx` | **Level 1 (Marketing)** | `pages/marketing/PracticalLearningPage.tsx` | `#practical` | Public | 無 (本機沙盒) | 低 (維持公開引導) |
| 6 | `StudentDashboardPage.tsx` | `pages/public/StudentDashboardPage.tsx` | **Level 2 (Student)** | `pages/student/StudentDashboardPage.tsx` | `#student` | Protected (`STUDENT`) | `studentApi.getEnrolledClasses` | 中 (需保持 ProtectedRoute) |
| 7 | `StudentPracticalHubPage.tsx` | `pages/student/practical/StudentPracticalHubPage.tsx` | **Level 2 (Student)** | `pages/student/practical/StudentPracticalHubPage.tsx` | `#student/practical` | Protected (`STUDENT`) | 本地存取引擎 | 低 (本階段新置) |
| 8 | `LearningProgressPage.tsx` | `pages/public/LearningProgressPage.tsx` | **Level 2 (Student)** | `pages/student/LearningProgressPage.tsx` | `#progress` | Protected (`STUDENT`) | 本機學習紀錄 | 中 |
| 9 | `TheoryPracticePage.tsx` | `pages/public/TheoryPracticePage.tsx` | **Level 2 (Student)** | `pages/student/TheoryPracticePage.tsx` | `#theory` | Public / Student | 官方題庫 JSON | 中 |
| 10 | `MockExamPage.tsx` | `pages/public/MockExamPage.tsx` | **Level 2 (Student)** | `pages/student/MockExamPage.tsx` | `#mock-exam` | Public / Student | 官方題庫 JSON | 中 |
| 11 | `AICoachPage.tsx` | `pages/public/AICoachPage.tsx` | **Level 2 (Student)** | `pages/student/AICoachPage.tsx` | `#ai-coach` | Public / Student | 鷹架規則庫 (展示版) | 低 |
| 12 | `CodeEditorPage.tsx` | `pages/public/CodeEditorPage.tsx` | **Level 2 (Student)** | `pages/student/CodeEditorPage.tsx` | `#code-editor` | Public / Student | 線上 iframe 執行緒 | 低 |
| 13 | `GameCenterPage.tsx` | `pages/public/GameCenterPage.tsx` | **Level 2 (Student)** | `pages/student/games/GameCenterPage.tsx` | `#games` | Public / Student | 遊戲成就 LocalStorage | 低 |
| 14 | `CodePuzzlePage.tsx` | `pages/public/CodePuzzlePage.tsx` | **Level 2 (Student)** | `pages/student/games/CodePuzzlePage.tsx` | `#code-puzzle` | Public / Student | 語法積木關卡庫 | 低 |
| 15 | `CSSDesignerPage.tsx` | `pages/public/CSSDesignerPage.tsx` | **Level 2 (Student)** | `pages/student/games/CSSDesignerPage.tsx` | `#css-designer` | Public / Student | CSS 關卡驗證引擎 | 低 |
| 16 | `BugHunterPage.tsx` | `pages/public/BugHunterPage.tsx` | **Level 2 (Student)** | `pages/student/games/BugHunterPage.tsx` | `#bug-hunter` | Public / Student | 除錯關卡引擎 | 低 |
| 17 | `QuizRushPage.tsx` | `pages/public/QuizRushPage.tsx` | **Level 2 (Student)** | `pages/student/games/QuizRushPage.tsx` | `#quiz-rush` | Public / Student | 計時快答題庫 | 低 |
| 18 | `WebBuilderPage.tsx` | `pages/public/WebBuilderPage.tsx` | **Level 2 (Student)** | `pages/student/games/WebBuilderPage.tsx` | `#web-builder` | Public / Student | 網頁積木組裝庫 | 低 |
| 19 | `TeacherDashboardPage.tsx` | `pages/public/TeacherDashboardPage.tsx` | **Level 3 (Teacher)** | `pages/teacher/TeacherDashboardPage.tsx` | `#teacher` | Protected (`TEACHER`) | `teacherApi.getMyApplication` | 高 (涉及教師申請審核) |
| 20 | `AdminDashboardPage.tsx` | `pages/public/AdminDashboardPage.tsx` | **Level 4 (Platform Admin)**| `pages/platform-admin/AdminDashboardPage.tsx` | `#admin` | Protected (`ADMIN`) | `adminApi.listApplications` | 高 (管理員核心營運) |
| 21 | `QuestionBankImportSystemPage.tsx`| `pages/public/QuestionBankImportSystemPage.tsx` | **Level 4 (Platform Admin)**| `pages/platform-admin/QuestionBankImportPage.tsx` | `#sources` | Protected (`ADMIN`) | 官方題庫解析模組 | 中 |
| 22 | `SystemOpsDashboardPage.tsx`| `pages/system-ops/SystemOpsDashboardPage.tsx` | **Level 5 (System Ops)** | `pages/system-ops/SystemOpsDashboardPage.tsx` | `#system-ops`, `#ops` | Protected (`ADMIN`) | `/api/health`, `/api/admin/audit-logs` | 中 (維運最高隔離區) |
| 23 | `LegalNoticePage.tsx` | `pages/public/LegalNoticePage.tsx` | **Shared (共用合規條款)** | `pages/shared/LegalNoticePage.tsx` | `#legal` | Public | 無 | 低 (全站共用) |

---

## 八、術科進度 Key 新舊相容性驗證機制

### 1. 問題成因與相容性挑戰
原設計早期版本採用 `practical_progress:{userId}:{taskId}:{version}` 作為本機鍵值，近期升級為具備專案命名空間之 `ctk_practical_progress:{userId}:{taskId}:{version}`。若僅單方面讀取新前綴，過去已在本機進行實作的考生歷史步驟將面臨暫時歸零風險。

### 2. 安全回退讀取與自動升級方案
於 `frontend/src/utils/learningStorage.ts` 實作「雙向容錯平緩升級」：
1. **讀取優先序**：優先使用新前綴 `ctk_practical_progress:...` 查詢。
2. **舊版安全回退**：若新前綴為 `null`，則安全回退嘗試讀取舊版 `practical_progress:...`。
3. **無損寫入升級**：當學員有任何進度變更執行 `savePracticalProgress` 時，資料統一寫入新前綴 `ctk_practical_progress:...`。
4. **絕對零清除**：寫入新前綴時，**不主動刪除或清空舊版鍵值**，將舊鍵留存作為本機第二道備援快照。

### 3. 自動化測試驗證結果
在 [p2-visual-accessibility-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p2-visual-accessibility-verification.test.tsx) 建立專屬單元測試：
- 注入舊版 `practical_progress:student-99:1:A` 假資料。
- 呼叫 `getPracticalProgress('student-99', 1, 'A')`，成功讀回 `completedSteps: [1, 2, 3]`。
- 執行 `savePracticalProgress` 寫入新進度，確認新前綴已成功持久化，且舊鍵資料未受覆蓋或遺失。
- 測試結果：**PASS (100% 通過)**。

---

## 九、System Ops 維運遙測數據來源核實

為確保發布誠信度，對 [SystemOpsDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx) 之所有遙測指標進行資料鏈核實：

1. **伺服端連線狀態**：
   - 來源：`GET /api/health`
   - 機制：後端於 [backend/src/app.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/backend/src/app.ts) 第 47 行公開健康探針。
   - 資料真實性：**真實**（依據伺服器即時運作狀態回傳 `healthy` 或 `degraded`）。
2. **資料庫 SELECT 1 探針與延遲**：
   - 來源：`GET /api/health` 內之 `database.latencyMs`
   - 機制：後端呼叫 `await prisma.$queryRaw\`SELECT 1\`` 計算往返毫秒數。
   - 資料真實性：**真實**（連線成功時回傳實際 ms 延遲數值）。
3. **安全審計日誌總計與分頁清單**：
   - 來源：`GET /api/admin/audit-logs`
   - 機制：管理員驗證權限後，由 PostgreSQL 資料表 `AuditLog` 依分頁讀取。
   - 資料真實性：**真實**（真實紀錄審核核准、退回與身分操作）。
4. **伺服器硬體（CPU、記憶體用量）**：
   - 現況：後端 `/api/health` 遵循最小資訊洩漏原則，未向前端暴露底層 OS CPU/RAM 探針。
   - 處理方案：在介面中**嚴格不偽造假即時圖表**，於五層架構分工說明中誠實標註「硬體 CPU/RAM 即時遙測待後續 APM 探針介接」，確保資訊 100% 透明。

---

## 十、完整修改檔案清單

| 檔案路徑 | 變更屬性 | 修改原因與重點內容 |
|---|:---:|---|
| [frontend/src/styles/tokens.css](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/styles/tokens.css) | 修改 | 擴充高對比金色 Token：新增 `--color-brand-gold-dark: #8D7243`（大字 4.54:1）與深化 `--color-brand-gold-text: #7C663D`（正文 4.91~5.49:1）註解規範 |
| [frontend/src/utils/learningStorage.ts](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/utils/learningStorage.ts) | 修改 | 加入舊前綴 `practical_progress` 平緩回退讀取機制，保障舊資料無損讀取與平滑過渡 |
| [frontend/src/components/FeedbackModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/FeedbackModal.tsx) | 修改 | 關閉按鈕、問題類別按鈕與 5 顆星號評分按鈕調校為 44×44px 觸控目標；文字顏色改用 `#7C663D` |
| [frontend/src/components/NotificationCenterModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/NotificationCenterModal.tsx) | 修改 | 關閉按鈕尺寸增至 44×44px；5 大通知類別切換 Pill 觸控高度設為 `min-height: 44px`；副標文字改用 `#7C663D` |
| [frontend/src/components/AuthModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AuthModal.tsx) | 修改 | 關閉按鈕調為 44×44px；示範學員/教師快速登入鈕增設 `minHeight: '44px'`；密碼切換眼睛擴展為 44×44px 觸控區 |
| [frontend/src/components/TeacherApplyModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/TeacherApplyModal.tsx) | 修改 | 關閉按鈕由 36×36px 調升為 44×44px |
| [frontend/src/components/StudentClassJoinModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/StudentClassJoinModal.tsx) | 修改 | 關閉按鈕增加 padding 並擴展為 44×44px |
| [frontend/src/components/GameAchievementsModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/GameAchievementsModal.tsx) | 修改 | 關閉按鈕觸控區域擴充為 44×44px |
| [frontend/src/components/GameBriefingModal.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/GameBriefingModal.tsx) | 修改 | 關閉按鈕觸控區域擴充為 44×44px |
| [frontend/src/components/Navbar.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Navbar.tsx) | 修改 | 站內通知中心鈴鐺按鈕由 36×36px 升級為 44×44px |
| [frontend/src/components/Hero.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/Hero.tsx) | 修改 | 白底展示卡片文字由 `var(--color-brand-gold)` 改為 `var(--color-brand-gold-text)` |
| [frontend/src/components/LearningExperience.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/LearningExperience.tsx) | 修改 | 柱狀圖副標改用高對比金色；通過率 72.4% 標示為 `(示範題組參考值)`，成長率與天數加註 `(示範模擬)` |
| [frontend/src/components/StudentTeacherDual.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/StudentTeacherDual.tsx) | 修改 | 班級及格率 89.2% 明確標示為 `教師端班級數據概覽預覽 (展示版示範模型)` 與 `(示範指標)` |
| [frontend/src/components/AIScaffoldingDemo.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/components/AIScaffoldingDemo.tsx) | 修改 | 選中步驟指示文字由 `var(--color-brand-gold)` 改為 `var(--color-brand-gold-text)` |
| [frontend/src/pages/public/LegalNoticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/LegalNoticePage.tsx) | 修改 | 頂部 Pill 文字由 `var(--color-brand-gold)` 改為 `var(--color-brand-gold-text)` |
| [frontend/src/pages/public/AICoachPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/AICoachPage.tsx) | 修改 | 側邊欄考題標籤與對話氣泡階梯標籤改用 `var(--color-brand-gold-text)` |
| [frontend/src/pages/public/StudentDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/StudentDashboardPage.tsx) | 修改 | 倒數天數改用高對比金色；「管理 / 加入 →」按鈕擴充觸控高度為 44px |
| [frontend/src/pages/public/LearningProgressPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/LearningProgressPage.tsx) | 修改 | 78% 掌握度改用高對比金色；「前往複習 →」按鈕擴展觸控區域為 44px |
| [frontend/src/pages/public/TheoryPracticePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TheoryPracticePage.tsx) | 修改 | 「開啟複習 →」按鈕改用高對比金色並擴展觸控尺寸為 44px |
| [frontend/src/pages/public/TeacherDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/TeacherDashboardPage.tsx) | 修改 | 步驟教學目標改用高對比金色 |
| [frontend/src/pages/public/PracticalLearningPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/PracticalLearningPage.tsx) | 修改 | 步驟步數指示與素材展開按鈕改用高對比金色 |
| [frontend/src/pages/public/AdminDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/AdminDashboardPage.tsx) | 修改 | 審核狀態文字改用高對比金色；申請紀錄與日誌分頁按鈕擴展觸控高度為 44px |
| [frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/system-ops/SystemOpsDashboardPage.tsx) | 修改 | 維運日誌上一頁/下一頁按鈕擴展觸控高度為 44px |
| [frontend/src/pages/public/CSSDesignerPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/CSSDesignerPage.tsx) | 修改 | 關卡提醒、課程卡片金額與目標描述改用高對比金色 |
| [frontend/src/pages/public/CodePuzzlePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/CodePuzzlePage.tsx) | 修改 | 任務指引文字改用高對比金色 |
| [frontend/src/pages/public/GameCenterPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/GameCenterPage.tsx) | 修改 | 遊戲卡片標籤與累積星星改用高對比金色 |
| [frontend/src/pages/public/QuizRushPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/public/QuizRushPage.tsx) | 修改 | 結算星號改用高對比金色 |
| [frontend/src/pages/student/practical/PracticalDetailPage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/PracticalDetailPage.tsx) | 修改 | 白底難度文字改用 `#7C663D`（暗底目錄維持 `#BDA77E`） |
| [frontend/src/pages/student/practical/PracticalHomePage.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/pages/student/practical/PracticalHomePage.tsx) | 修改 | 題組難度文字改用 `#7C663D` |
| [frontend/tests/p2-visual-accessibility-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p2-visual-accessibility-verification.test.tsx) | **新增** | 14 項專屬測試，驗證對比度、44px 觸控尺寸、首頁標註真實性與舊進度相容性 |

---

## 十一、自動化測試與 RWD 驗證結果

### 1. 前端 TypeScript 與生產建置
- 執行命令：`npm run build --prefix frontend`（包含 `tsc && vite build`）
- 建置耗時：**2.83s**
- 編譯狀態：**0 errors, 0 warnings**

### 2. 前端完整測試套件
- 執行命令：`npx vitest run frontend/tests`
- 執行結果：**59 個測試檔案，546 項測試全部通過 (0 失敗)**
- 專屬測試：[p2-visual-accessibility-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p2-visual-accessibility-verification.test.tsx)（14 項通過）、[p1-repair-verification.test.tsx](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/tests/p1-repair-verification.test.tsx)（16 項通過）

### 3. 後端離線測試套件
- 執行命令：`npm run test:offline --prefix backend`
- 執行結果：**17 個測試檔案，221 項測試全部通過 (0 失敗)**

### 4. 累計全端自動化測試
- **總計：76 個測試檔案，767 項測試全部通過 (100% 通過率)**

### 5. 響應式尺寸（RWD）多斷點覆核
針對 320px、375px、430px、768px、1024px、1280px、1440px 進行檢查：
- **320px (極窄行動)**：AuthModal、FeedbackModal 關閉鈕與邊界維持 16px 安全留白，無水平溢位；首頁文字折行流暢。
- **375px / 430px (主流手機)**：分頁控制鈕垂直置中，星號評分按鈕間隔充足，點擊區域互相獨立不干涉。
- **768px (平板)**：師生雙端預覽卡片自動切換為流暢堆疊排列，標籤與示範文字清晰對齊。
- **1280px / 1440px (桌面/寬螢幕)**：Navbar 44×44px 通知鈴與主選單對齊，無任何排版跳動或視覺突兀感。

---

## 十二、正式發布阻擋因素與尚未完成項目

依據全面核查，目前尚存在以下外部與架構限制，在進行 Render 正式生產部署前需知悉：

1. **Footer 聯絡信箱 MX 伺服器解析 (PARTIAL)**：
   - 現況：前端超連結已修正為 `mailto:contact@codetoknow.edu`，但 `codetoknow.edu` 尚未於公網 DNS 設定 MX 郵件伺服器。
   - 阻擋性質：次要展示限制（不影響前端運作，但使用者發信將會彈回）。
2. **後端資料庫角色粒度限制 (PARTIAL)**：
   - 現況：Prisma 資料庫目前僅支援 `STUDENT`、`TEACHER`、`ADMIN`。Level 4 平台管理與 Level 5 系統維運目前在前端已實體切分，但後端 API 均透過 `ADMIN` 權限受控存取。
   - 阻擋性質：中期架構優化（需待正式資料庫 Migration 窗口核定後新增 `SYSTEM_OPERATOR` 角色）。
3. **外部即時硬體 APM 探針介接 (NOT STARTED)**：
   - 現況：伺服器健康度與資料庫連線延遲為真實數據，但 CPU / RAM 負載未介接外部 Datadog / Prometheus。目前前端已標註為待介接，不偽造假數據。

---

## 十三、安全限制覆核 (Git 與部署狀態)

為恪守安全原則，在此再次核實本階段所有操作紀錄：

- [x] **Git Commit**：**0 次**（未執行）
- [x] **Git Push**：**未執行**
- [x] **Git Merge**：**未執行**
- [x] **Render Deploy (Production / Preview)**：**未執行**
- [x] **Database Changes / Schema Modifications**：**未執行**
- [x] **Prisma Migration**：**未執行**
- [x] **Secrets / Environment Variables**：**未修改或洩漏**
- [x] **五大正式術科題組 (104301~104305)**：**完整無損**

---
*報告完成時間：2026-11-18 19:50 (台北標準時間)*
