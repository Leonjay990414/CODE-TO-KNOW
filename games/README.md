# CODE TO KNOW｜遊戲模組歷史／預備目錄導航
# (games/README.md)

> [!IMPORTANT]
> **【遊戲模組架構定位與預備目錄宣告】**  
> 1. **預備目錄定位**：本目錄（`games/`）為 CODE TO KNOW 專案架構中保留之預備目錄，早期曾規劃作為獨立原生 HTML5/Canvas 遊戲引擎放置空間。  
> 2. **目前正式遊戲運行位置**：目前全站五大教育科技遊戲與遊戲大廳**全數整合並運行於 React 前端**：
>    - 遊戲中心總覽：`frontend/src/pages/public/GameCenterPage.tsx`
>    - Bug 獵手 (除錯對決)：`frontend/src/pages/public/BugHunterPage.tsx`
>    - 程式拼圖 (語法建構)：`frontend/src/pages/public/CodePuzzlePage.tsx`
>    - CSS 魔法師 (樣式視覺)：`frontend/src/pages/public/CSSDesignerPage.tsx`
>    - 快速刷題 (單選競速)：`frontend/src/pages/public/QuizRushPage.tsx`
>    - 網頁組裝廠 (架構挑戰)：`frontend/src/pages/public/WebBuilderPage.tsx`
> 3. **禁止虛假宣稱**：嚴禁因本目錄為預備目錄而宣稱「遊戲系統不存在」或反向宣稱「本目錄已具備獨立微服務遊戲伺服器」。所有遊戲核心目前均以 React 元件實作並通過 43 檔前端自動化測試。  
> 4. **不修改或移動程式**：本文件僅提供架構說明與未來擴充指引，不移動任何現有程式碼。

---

## 遊戲模組現況與 P14 依賴稽核結論 (Game Dependency Status)

依據第 0 波第二批 [W0B2_P14_GAME_DEPENDENCY_AUDIT.md](file:///c:/Users/user/Documents/CODE-TO-KNOW/docs/master/wave0/batch2/W0B2_P14_GAME_DEPENDENCY_AUDIT.md) 之深度稽核：

### 1. 前端已完成並通過驗證之能力（PRODUCTION VERIFIED）
- 五大遊戲之玩法規則、關卡生成、即時計時器（含銷毀防洩漏）、分數計算、成就徽章彈窗（`GameAchievementsModal.tsx`）與行前說明彈窗（`GameBriefingModal.tsx`）。
- 遊戲動態載入（Lazy Loading）與路由保護皆通過前端整合測試驗證。

### 2. 尚未完成之後端與雲端依賴缺口（GAPS & PARTIAL STATUS）
- **GAM-014（教師遊戲作業派發）**：
  目前由 `frontend/src/utils/teacherGameTaskManager.ts` 透過瀏覽器 `localStorage` 提供本機原型功能，**維持 PARTIAL (70%) 判定**。尚未具備後端 REST API 與 PostgreSQL 持久化。
- **GAM-015（管理員遊戲全域配置）**：
  目前由 `frontend/src/utils/adminGameConfigManager.ts` 透過瀏覽器 `localStorage` 提供本機原型功能，**維持 PARTIAL (70%) 判定**。尚未具備平台全域配置資料庫與管理員權限日誌。

### 3. 未來正式雲端遊戲系統之解鎖依賴鏈（Prerequisite Chain）
若後續波次要將遊戲升級為跨裝置雲端同步與正式班級作業系統，必須循以下依賴順序解鎖：
1. **第 4 波（Wave 4：P12 / P15）**：
   - Prisma 定義 `GameTaskAssignment`、`GameSessionRecord` 與 `SystemConfig` 資料表。
   - 後端開闢 `/api/classrooms/:id/game-assignments` 與 `/api/admin/game-config` API。
2. **第 5 波（Wave 5：P14 遊戲化體系深化）**：
   - 前端切換 `teacherGameTaskManager` 與 `adminGameConfigManager` 由 LocalStorage 轉為真實 API 通訊。
   - 串接學生星幣獎勵商城原型與錯題沙盒重試。
