# CODE TO KNOW 碼上學｜Phase 14 連續開發執行計畫：前置盤點與安全基線報告（批次 0）

**專案名稱**：碼上學 AI 智慧學習與教育科技平台（CODE TO KNOW）  
**執行階段**：Phase 14｜互動遊戲與遊戲化學習系統（連續開發計畫批次 0）  
**執行時間**：2026-11-14 14:55  
**工作目錄**：`C:\Users\user\Documents\CODE-TO-KNOW`  
**Git 分支**：`main`（HEAD: `47c8ba4b176fb19478a8330598ef86a9039f78eb`）  
**正式進度基準**：45.961878%（嚴格鎖定，未經專案經理正式稽核不更動）  
**AUTH-03 狀態**：`BLOCKED`（嚴格保持，不連線後端/資料庫）  

---

## 一、專案盤點與執行前檢查

1. **Git 狀態確認**：
   - 目前位於 `main` 分支，本地 HEAD 與 `origin/main` 保持一致（`47c8ba4b176fb19478a8330598ef86a9039f78eb`）。
   - 工作目錄除了暫存文檔清理外，所有既有修改與本機報告、測試套件皆完整保存，無任何破壞性操作。
2. **Phase 14 Batch 1–4 既有成果查核**：
   - Batch 1：Code Puzzle（`P14-GAM-004`）完成，對應 `CodePuzzlePage.tsx`、`codePuzzleData.ts`。
   - Batch 2：CSS Designer（`P14-GAM-005`）完成，對應 `CSSDesignerPage.tsx`、`cssDesignerData.ts`。
   - Batch 3：Bug Hunter（`P14-GAM-006`）完成，對應 `BugHunterPage.tsx`、`bugHunterData.ts`。
   - Batch 4：Quiz Rush（`P14-GAM-007`）完成，對應 `QuizRushPage.tsx`、`quizRushEngine.ts`。
3. **儲存模組核對**：
   - `gameStorage.ts`：以 `ctk_game_progress:<userId>:<gameId>` 進行命名空間隔離，內建高標保留防灌水規則與 JSON 損毀降級容錯。
   - `wrongQuestionsStorage.ts`：以 `ctk_wrong_questions:<userId>` 提供 Phase 13 錯題本雙向同步。
4. **題庫真實性**：
   - `officialTheoryQuestionBank.json`：確實驗證 605 題官方真實學科題庫，四大工作項目完整對接。
5. **測試基線**：
   - 執行 `npx --prefix frontend vitest run frontend/tests`：14 個測試套件共 144 項測試 100% PASS。

---

## 二、批次 1–7 開發範圍確認

- **批次 1**：開發第五款核心遊戲 Web Builder（`P14-GAM-008`），採用安全結構積木渲染，絕不使用 `eval`、`new Function` 或 `dangerouslySetInnerHTML`。
- **批次 2**：成就與徽章系統（`P14-GAM-011`），跨五款遊戲依真實歷史紀錄推導解鎖，防重複發放。
- **批次 3**：五款遊戲統一整合（`P14-GAM-001`, `P14-GAM-012`），Game Center 統計一致化。
- **批次 4**：獎勵與防重複計算審查（`P14-GAM-010`）。
- **批次 5**：RWD、無障礙與互動品質補強（`P14-GAM-016`）。
- **批次 6**：完整回歸測試與安全掃描。
- **批次 7**：文件歸檔與總結報告產出。
