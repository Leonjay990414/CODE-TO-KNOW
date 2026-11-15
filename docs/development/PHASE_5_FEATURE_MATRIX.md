# 碼上學｜CODE TO KNOW
# 第 5 波功能矩陣與架構設計規格書

**文件識別：** `PHASE_5_FEATURE_MATRIX.md`  
**建立日期：** 2026 年 11 月 15 日  
**專案名稱：** 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW)  
**涵蓋階段：**  
- **P11：AI 輔助學習與弱點分析**（11 個 UID）  
- **P14：遊戲化學習與互動體驗**（16 個 UID）  
- **P17：品牌數位行銷與媒體傳播**（10 個 UID）  
**總對應 UID 數：** **37 個 UID**  
**文件性質：** 第 5 波功能架構清單、元件介面合約、資料模型與實作優先級分級  
**波次執行狀態：** **尚未啟動 (UNSTARTED)**  

---

## 一、架構設計原則與優先級分層 (Tier Classification)

為確保在安全紅線（`AUTH-03` 隔離、禁止非預期資料庫變更、無伺服器金鑰外洩風險）之下穩健推進，第 5 波將所有待實作功能劃分為三個優先級層次（Tiers）：

1. **Tier 1：核心閉環與本機高可用（Core & High Resilience）— 最高優先**
   - 不依賴外部網路與雲端資料庫即可 100% 獨立運行。
   - 包含：四階段 AI 引導提示、離線規則式 AI 備援引擎、五大遊戲核心玩法完整閉環、遊戲本機三星評分與成就系統、品牌首頁與 SEO 結構化標記。
2. **Tier 2：跨模組融合與教學管理延伸（Cross-Module Integration）— 次高優先**
   - 打通既有模組間的互通體驗。
   - 包含：考題/實作頁面一鍵呼叫 AI 鷹架提示、教師端指派遊戲關卡作業介面、品牌媒體展示中心（Media Center）與推廣素材庫。
3. **Tier 3：雲端代理與進階串流體驗（Cloud Proxy & Advanced Features）— 視授權條件實施**
   - 涉及外部服務呼叫或需要額外環境變數配置。
   - 包含：後端 Gemini/OpenAI API 安全代理路由、Token 速率限制中介軟體、跨裝置遊戲雲端排行榜（依賴 `AUTH-03` 解除）。

---

## 二、完整功能矩陣與架構規格表

### 1. P11：AI 輔助學習與弱點分析模組 (11 UIDs)

| 功能模組名稱 | 對應 UID | 核心元件與路徑 | 資料合約 / 儲存策略 | 前端互動與視覺體驗 | 後端 API / 安全考量 | 優先級 |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **四階段鷹架導引系統** | P11-AIS-001<br>P11-AIS-007 | `AICoachPage.tsx`<br>`AIScaffoldingDemo.tsx` | 本機狀態 / LocalStorage<br>`ctk_ai_chat_session` | 標籤式引導（觀念聚焦/破題思路/邊界提示/架構解構），禁止直接解答代碼。 | 後端校驗 Prompt，嚴格實施防抄襲系統設定。 | **Tier 1** |
| **離線規則備援引擎** | P11-AIS-010 | `src/utils/aiFallbackEngine.ts` | 內建靜態規則資料庫（按題組 1~5 知識點索引） | 當網路中斷或 API 無金鑰時，無縫切換為規則提示，並顯示「離線備援模式」徽章。 | 純前端/離線可用，零外部網路依賴。 | **Tier 1** |
| **對話工作階段管理** | P11-AIS-004 | `AICoachPage.tsx`<br>`AIChatSidebar.tsx` | `ctk_ai_sessions:${userId}`<br>具備歷史對話列表 | 左側抽屜式歷史工作階段列表，支援新增、重命名、刪除與導出對話記錄。 | 與 `schema.prisma` 之 `AIChatSession` 欄位相容。 | **Tier 1** |
| **代碼語法即時診斷** | P11-AIS-005<br>P11-AIS-011 | `CodeEditor.tsx`<br>`AIDiagnosticOverlay.tsx` | 前端啟發式規則庫 + 正則語法檢核 | 在程式碼編輯器行號旁標註潛在語法與常見邏輯陷阱，提供逐行代碼走讀說明。 | 輕量化客戶端即時診斷，不阻塞編輯器主執行緒。 | **Tier 1** |
| **弱點診斷與推薦** | P11-AIS-006 | `LearningProgressPage.tsx`<br>`AIWeaknessRadar.tsx` | `ctk_student_weakness:${userId}` | 五角形技能雷達圖（HTML 語法、CSS 排版、JS 邏輯、表單驗證、多媒體處理）。 | 結合模擬測驗錯題動態計算各單元熟練度。 | **Tier 2** |
| **對話回饋評分機制** | P11-AIS-009 | `AIFeedbackModal.tsx` | `ctk_ai_feedback` | 每則 AI 回應附帶讚/倒讚與文字意見回饋，提交後顯示感謝動效。 | 記錄評分以利後續模型調優，本機暫存防重複提交。 | **Tier 2** |
| **教師提問監控防護** | P11-AIS-008 | `TeacherDashboardPage.tsx` | `ctk_ai_moderation_alerts` | 教師可查看班級學生的高頻提問關鍵字與不當提問預警標籤。 | 實施敏感詞字典比對，保護未成年學生學習環境。 | **Tier 2** |
| **後端安全代理服務** | P11-AIS-002<br>P11-AIS-003 | `backend/src/routes/aiRoutes.ts`<br>`aiController.ts` | 伺服器端環境變數 `GEMINI_API_KEY` | 支援打字機動態串流效果，具備網路中斷自動重連與防抖控制。 | **API Key 絕不外洩至前端**；配置 Rate-Limiter（每分 5 次）。 | **Tier 3** |

---

### 2. P14：遊戲化學習與互動體驗模組 (16 UIDs)

| 功能模組名稱 | 對應 UID | 核心元件與路徑 | 資料合約 / 儲存策略 | 前端互動與視覺體驗 | 後端 API / 安全考量 | 優先級 |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **遊戲大廳與關卡地圖** | P14-GAM-001<br>P14-GAM-010 | `GameCenterPage.tsx`<br>`GameWorldMap.tsx` | `gameStorage.ts`<br>`ctk_game_progress:${userId}` | 航海冒險/科技島嶼地圖，關卡節點具備鎖定/解鎖/已通關三星視覺狀態。 | 本機計算解鎖前置條件（前一關滿 2 星解鎖下一關）。 | **Tier 1** |
| **五大互動遊戲完整化** | P14-GAM-002<br>P14-GAM-003<br>P14-GAM-004<br>P14-GAM-005<br>P14-GAM-006 | `CodePuzzlePage.tsx`<br>`CSSDesignerPage.tsx`<br>`BugHunterPage.tsx`<br>`QuizRushPage.tsx`<br>`WebBuilderPage.tsx` | 各遊戲獨立關卡配置檔<br>`frontend/src/data/games/` | 1. **拼圖**：拖曳與卡牌組裝<br>2. **樣式**：即時視覺比對<br>3. **除錯**：雷達標註修復代碼<br>4. **問答**：連擊 Combo 加速<br>5. **架構**：積木式搭建頁面 | 純前端沙盒運行，嚴格隔離 DOM 注入，防止 XSS 攻擊。 | **Tier 1** |
| **星級計分與通關動畫** | P14-GAM-007<br>P14-GAM-011 | `GameVictoryModal.tsx`<br>`ConfettiEffect.tsx` | `gameStorage.ts` | 結算時跳出三星動態點亮動畫、彩色碎紙彩帶特效、計算用時與連擊分數。 | 透過 Web Audio 產生無外部音訊檔依賴之合成音效。 | **Tier 1** |
| **成就系統與勳章展示** | P14-GAM-008 | `GameAchievementsModal.tsx`<br>`gameAchievementEngine.ts` | `ctk_game_achievements:${userId}` | 9 大主題成就勳章（如：初試啼聲、樣式大師、除錯專家、急速先鋒），具備解鎖進度條。 | 事件驅動（Event-driven）成就觸發監聽器。 | **Tier 1** |
| **關卡前導引說明** | P14-GAM-009 | `GameBriefingModal.tsx` | `gameStorage.ts` | 關卡啟動前彈出任務目標、過關條件與學習重點，支援「不再提示」複選框。 | 符合對話框無障礙規範（Esc 鍵關閉、焦點自動定位）。 | **Tier 1** |
| **遊戲無障礙鍵盤導航** | P14-GAM-016 | 全體遊戲頁面 | WAI-ARIA 屬性規範 | 所有遊戲支援鍵盤全操作：Tab 輪巡、Space/Enter 選取、方向鍵移動積木。 | 為視覺障礙與行動不便學習者提供等效學習途徑。 | **Tier 1** |
| **斷線防護與進度儲存** | P14-GAM-012 | `gameStorage.ts` | 本機 LocalStorage + SessionStorage 雙重防護 | 即時儲存玩家當前關卡步數，重新整理頁面後可接續作答，防資料遺失。 | 暫緩遠端資料庫同步，標註「本地單機防護」。 | **Tier 2** |
| **班級模擬排行榜** | P14-GAM-013 | `GameLeaderboardModal.tsx` | 內建同儕模擬資料 + 本地玩家即時排名 | 顯示全班前 10 名排行榜、個人目前排名、星數與總分，具備上升/下降動態箭頭。 | 激勵同儕良性競爭，免除雲端高頻連線開銷。 | **Tier 2** |
| **教師指派關卡任務** | P14-GAM-014 | `TeacherDashboardPage.tsx` | `ctk_teacher_game_tasks` | 教師可在班級管理中指派指定遊戲關卡為課堂小測驗，並檢視班級通關率。 | 完善教師教學武器庫，實現寓教於樂。 | **Tier 2** |
| **管理員關卡參數設定** | P14-GAM-015 | `AdminDashboardPage.tsx` | `ctk_admin_game_configs` | 管理員可調整關卡倒數秒數、計分加權倍率與活動難度。 | 集中於管理員後台「系統設定」分頁維護。 | **Tier 2** |

---

### 3. P17：品牌數位行銷與媒體傳播模組 (10 UIDs)

| 功能模組名稱 | 對應 UID | 核心元件與路徑 | 資料合約 / 儲存策略 | 前端互動與視覺體驗 | 後端 API / 安全考量 | 優先級 |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **品牌識別系統展示 (VI)** | P17-MED-001 | `BrandKitPage.tsx`<br>`components.css` | 靜態品牌規範規格表 | 展示品牌理念、標準字、標準色票（溫暖象牙白、薄霧藍灰、香檳金）、Logo 規範。 | 提供向量 SVG 與高解析度 PNG 標誌下載。 | **Tier 1** |
| **官網首頁質感重塑** | P17-MED-002 | `HomePage.tsx`<br>`HeroBanner.tsx` | 靜態文案與課程摘要 | 提升首頁國際級 EdTech 視覺質感：優雅的微動效、權威檢定通過率數據展示、清晰 CTA。 | 符合 RWD 全斷點優化，無排版跳動。 | **Tier 1** |
| **SEO 結構化與社群分享** | P17-MED-010 | `index.html`<br>`MetaTags.tsx` | JSON-LD Schema<br>OpenGraph / Twitter | 包含 EducationalOrganization 結構化資料、動態標題、描述、OG Image 社群分享卡片。 | 顯著提升搜尋引擎爬蟲能見度與社群點擊率。 | **Tier 1** |
| **媒體宣傳與素材展示中心** | P17-MED-003<br>P17-MED-005<br>P17-MED-006 | `MediaCenterPage.tsx`<br>`AssetHubModal.tsx` | 靜態素材目錄 + 宣傳文案庫 | 整合官方宣傳短片、產品功能展示 Demo、宣傳海報下載、社群推廣文案懶人包。 | 所有外部媒體資源均採 HTTPS 安全內嵌。 | **Tier 2** |
| **檢定榜單與成功見證** | P17-MED-007 | `HomePage.tsx`<br>`TestimonialSection.tsx` | 靜態學員心得資料庫 | 輪播展示真實學習心得、全國技能競賽選手推薦、丙級檢定滿分通關案例。 | 增強潛在學員與合作學校之信任度。 | **Tier 2** |
| **最新消息與活動公告專區** | P17-MED-008 | `NewsPage.tsx`<br>`NewsDetailModal.tsx` | `ctk_public_news` | 分類展示平台版本更新日誌、全國檢定重要日程、線上研習營報名資訊。 | 具備最新消息篩選與重要通知置頂標籤。 | **Tier 2** |
| **行銷行事曆與內容排程** | P17-MED-004 | `MarketingCalendarModal.tsx` | 本機模擬排程表 | 展示年度重大考試日程、版本發布排程、推廣主題規劃甘特圖。 | 供平台營運團隊規劃學期推廣節奏。 | **Tier 3** |
| **行銷成效與流量分析模擬** | P17-MED-009 | `AdminDashboardPage.tsx` | `ctk_marketing_analytics` | 模擬訪客來源分佈（搜尋引擎、社群推薦、學校推廣）、UTM 來源標籤解析與點擊率。 | 前端純模擬指標，不蒐集使用者隱私資料。 | **Tier 3** |

---

## 三、技術資料模型設計 (TypeScript Interfaces)

為確保在 `AUTH-03` 隔離下各模組資料結構高度正規化，第 5 波將定義以下純 TypeScript 介面合約：

```typescript
// 1. AI 鷹架引導合約 (P11)
export type ScaffoldingStage = 'CONCEPT_FOCUS' | 'PROBLEM_SOLVING' | 'BOUNDARY_HINT' | 'ARCHITECTURE';

export interface AIScaffoldingMessage {
  id: string;
  stage: ScaffoldingStage;
  stageLabel: string;
  title: string;
  content: string;
  guidingQuestions: string[];
  suggestedAction?: string;
  timestamp: string;
}

export interface AISession {
  sessionId: string;
  userId: string;
  title: string;
  taskContext?: string; // 對應題組或學習單元
  messages: AIScaffoldingMessage[];
  createdAt: string;
  updatedAt: string;
}

// 2. 遊戲進度與星級成就合約 (P14)
export interface GameLevelProgress {
  gameId: 'code-puzzle' | 'css-designer' | 'bug-hunter' | 'quiz-rush' | 'web-builder';
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  stars: 0 | 1 | 2 | 3;
  bestScore: number;
  bestTimeSeconds: number;
  lastPlayedAt?: string;
}

export interface GameAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'BEGINNER' | 'MASTERY' | 'SPEED' | 'PERFECTION';
  unlocked: boolean;
  unlockedAt?: string;
  progressPercent: number;
}

// 3. 媒體素材與行銷公告合約 (P17)
export interface MarketingAsset {
  id: string;
  title: string;
  category: 'POSTER' | 'SOCIAL_COPY' | 'SLIDE_DECK' | 'DEMO_VIDEO';
  description: string;
  previewUrl: string;
  downloadUrl?: string;
  tags: string[];
}

export interface PublicAnnouncement {
  id: string;
  category: 'UPDATE' | 'EVENT' | 'EXAM_ALERT';
  title: string;
  summary: string;
  content: string;
  publishDate: string;
  isPinned: boolean;
}
```

---

## 四、安全檢驗與風險對策

1. **API Key 資安保護**：
   - 伺服器代理路由必須遵循「金鑰環境變數化」規範。
   - 若後端未注入 `GEMINI_API_KEY`，系統自動退守至 `aiFallbackEngine.ts`，絕不阻斷前端頁面操作。
2. **本機儲存配額防護**：
   - 所有 LocalStorage 讀寫均包裹 `try-catch` 異常處理。
   - 若遇到 `QuotaExceededError`，自動清理過期的對話快取，確保核心遊戲與考題資料安全。
3. **無障礙法規合規**：
   - 遊戲操作元件均標註 `aria-label`、`role="button"` 與 `tabIndex={0}`。
   - 鍵盤事件監聽 `onKeyDown` 支援 Enter/Space 觸發，方向鍵切換焦點。
