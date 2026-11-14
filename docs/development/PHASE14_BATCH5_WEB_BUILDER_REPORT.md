# CODE TO KNOW 碼上學｜Phase 14 第 5 批：Web Builder 網頁架構師開發報告

**專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）  
**開發階段**：Phase 14｜互動遊戲與遊戲化學習系統（第 5 批次 / 連續開發計畫批次 1）  
**核心工作項目**：`P14-GAM-008` 開發 Web Builder：HTML／CSS 元件組合與網頁結構  
**關聯工作項目**：`P14-GAM-001`、`P14-GAM-002`、`P14-GAM-009`、`P14-GAM-010`、`P14-GAM-012`  
**報告產出時間**：2026-11-14 15:00  
**測試結果**：15 個測試套件共 154 項測試 100% PASS、TypeScript 編譯 0 錯誤、Vite 建置成功。  
**AUTH-03 狀態**：`BLOCKED`（嚴格保持）  

---

## 一、本批次開發成果

作為 Phase 14 的第五款核心遊戲，**Web Builder｜網頁架構師** 已正式完成開發、測試與遊戲中心解鎖上線。

### 1. 遊戲核心四關設計
1. **第一關：基本文件骨架（wb-01，入門）**：
   - 目標順序：`<!DOCTYPE html>` -> `<html lang="zh-Hant">` -> `<head>` -> `<body>`
   - 觀念核心：標準規範宣告、根元素容器、不可見中繼資料區與畫面可視化容器。
2. **第二關：語意化地標佈局（wb-02，基礎）**：
   - 目標順序：`<header>` -> `<nav>` -> `<main>` -> `<footer>`
   - 觀念核心：W3C 語意地標（Landmarks）配置，告別 `<div>` 湯，提升搜尋引擎 SEO 與螢幕閱讀器無障礙體驗。
3. **第三關：核心文章內容層級（wb-03，進階）**：
   - 目標順序：`<h1>` -> `<p>` -> `<h2>` -> `<ul>` -> `<img>`
   - 觀念核心：階層式標題不得跳級、條列清單與 `alt` 替代文字無障礙要求。
4. **第四關：全端教育平台首頁組裝（wb-04，整合）**：
   - 目標順序：`<header>` -> `<nav>` -> `<section-course>` -> `<section-interactive>` -> `<a-button>` -> `<footer>`
   - 觀念核心：綜合架構視野，模組化組裝全站入口。

### 2. 安全無害互動設計
- **絕對安全性**：完全杜絕 `eval()`、`new Function()` 或 `dangerouslySetInnerHTML`。
- **純 React DOM 受信任渲染**：依據結構化積木定義，以乾淨的 React JSX 元件安全呈現視覺預覽。
- **操作能力**：支援加入（Add）、移除（Remove）、上移（Move Up）、下移（Move Down）與重設（Reset）。
- **架構對照提示**：即時顯示目前結構序列與目標架構順序之比對指示。
- **雙層提示機制**：提供分層提示，協助學生循序漸進解題。

### 3. 本機儲存與防灌水評分
- 使用 `gameStorage.ts` 之 `saveLevelCompletion(userId, 'web-builder', levelNumber, stars, score)`。
- 防灌水保護：重複挑戰關卡時，保留歷史最佳分數與星級，不因較差成績扣損。
- 帳號隔離：使用 `ctk_game_progress:<userId>:web-builder`。

### 4. 遊戲中心解鎖
- `GameCenterPage.tsx` 中 Web Builder 卡片由「即將推出（UPCOMING）」解鎖為「已開放遊玩（AVAILABLE）」。
- 支援一鍵跳轉 `#games/web-builder`。
- 遊戲大廳累積統計完整納入 Web Builder 的通關數、星星數與得分。

---

## 二、測試與建置證據

1. **單元測試**：
   - 檔案：`frontend/tests/web-builder-game.test.ts`（10 項測試全數通過）
   - 全套測試：`npx --prefix frontend vitest run frontend/tests`（15 個套件、154 項測試 100% PASS，耗時 709ms）
2. **TypeScript 檢查與 Vite 生產建置**：
   - 執行 `npm --prefix frontend run build`：Exit code 0，生產輸出成功。
