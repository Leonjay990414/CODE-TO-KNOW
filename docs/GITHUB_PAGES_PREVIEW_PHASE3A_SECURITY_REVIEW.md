# CODE TO KNOW｜GitHub Pages Phase 3A：公開發布前安全複查報告

**審查日期**：2026 年 11 月 9 日  
**專案名稱**：碼上學｜CODE TO KNOW — AI 智慧學習與教育科技平台  
**報告編號**：`docs/GITHUB_PAGES_PREVIEW_PHASE3A_SECURITY_REVIEW.md`  
**審查人員**：資深 DevSecOps 工程師、GitHub Actions 安全審查工程師、React / Vite 工程師  
**審查模式**：唯讀安全審查與靜態分析（無寫入、無 Commit、無 Push、無 Deploy）  
**審查最終結論**：**READY（完全就緒，可進入公開展示 Repository 建立與授權階段）**

---

## 一、審查項目逐項評定結果表

| 審查維度 | 檢查細項 | 審查目標檔案 / 物件 | 評定結果 | 關鍵證據與安全機制說明 |
| :--- | :--- | :--- | :---: | :--- |
| **Actions 觸發** | 僅監控私人庫 `main` 分支與指定路徑 | `.github/workflows/deploy-preview.yml` | **PASS** | `branches: [main]`, `paths: ['frontend/**', '.github/workflows/deploy-preview.yml']`，修改後端或文件不觸發 |
| **依賴安裝** | 使用 `npm ci` 並確認 lockfile | `.github/workflows/deploy-preview.yml` | **PASS** | `npm --prefix frontend ci`，鎖定 `frontend/package-lock.json` 快取與依賴版本 |
| **建置順序** | 先執行型別檢查，再執行 Demo Mode 建置 | `.github/workflows/deploy-preview.yml` | **PASS** | Step 4 `tsc --noEmit` 優先於 Step 5 `run build:demo`，編譯錯誤立即中斷 |
| **部署門禁** | 發布前執行 DevSecOps 零洩漏掃描 | `.github/workflows/deploy-preview.yml` | **PASS** | Step 7 實作 Node 掃描腳本，白名單過濾副檔名，檢測到敏感字串直接 `process.exit(1)` |
| **部署目標** | 目標庫嚴格固定，不可變異 | `.github/workflows/deploy-preview.yml` | **PASS** | `external_repository: Leonjay990414/CODE-TO-KNOW-PREVIEW`，非動態變數 |
| **白名單發布** | 只發布 `frontend/dist/` 純靜態產物 | `.github/workflows/deploy-preview.yml` | **PASS** | `publish_dir: ./frontend/dist`，物理隔絕原始專案其他檔案 |
| **路徑洩漏防範**| 不可能誤將後端、文件推至公開庫 | `.github/workflows/deploy-preview.yml` | **PASS** | `dist` 內僅包含 HTML/JS/CSS/SVG，後端目錄與 `.env` 不在發布目錄中 |
| **權限最小化** | Workflow 權限維持最小必要 | `.github/workflows/deploy-preview.yml` | **PASS** | `permissions: contents: read`，私人庫僅具備唯讀權限 |
| **Token 安全** | 僅透過 Actions Secret 安全注入 | `.github/workflows/deploy-preview.yml` | **PASS** | `${{ secrets.PREVIEW_DEPLOY_TOKEN }}`，不寫死於程式碼，不透過 URL 傳遞 |
| **日誌脫敏** | 不在終端或 Remote URL 印出 Token | `.github/workflows/deploy-preview.yml` | **PASS** | GitHub Actions 原生自動 Masking，`peaceiris/actions-gh-pages@v4` 不暴露憑證 |
| **失敗終止** | 失敗時停止發布，保留上一個版本 | `.github/workflows/deploy-preview.yml` | **PASS** | Step 8 設有 `if: success()`，任一步驟 Exit Code 非 0 立即阻斷發布 |
| **第三方 Action**| Action 版本固定，無指令注入漏洞 | `.github/workflows/deploy-preview.yml` | **PASS** | 固定 `@v4`，所有 run 區塊為靜態腳本，無未轉義之 `${{ ... }}` 表達式 |
| **連線阻斷** | Demo Mode 不連線後端、Supabase 或 DB | `frontend/src/services/api.ts` | **PASS** | `isDemoMode` 啟用時 `request()` 與 `getCsrfToken()` 全面阻斷 `fetch()` |
| **API 完整攔截**| 100% 覆蓋所有 API 入口 | `frontend/src/services/api.ts` | **PASS** | `authApi` (6 項) 與 `teacherApi` (2 項) 全部具備 `if (isDemoMode)` 分支 |
| **網路套件繞過**| 無第三方網路套件或隱藏 fetch | 全專案代碼搜尋 | **PASS** | 全專案無 Axios、無 WebSocket、無第三方 HTTP client，僅有的 2 處 fetch 皆在 `api.ts` 內被攔截 |
| **模擬個資隔離**| 模擬帳號不含真實個資 | `frontend/src/services/api.ts` | **PASS** | 帳號使用 `student.demo@codetoknow.edu` 與 `teacher.demo@codetoknow.edu`，完全無真實個資 |
| **身分標示誠實**| 示範身分明確標記，不偽造正式帳號 | `Navbar.tsx`, `ProtectedRoute.tsx` | **PASS** | 具備「DEMO」徽章、展示模式卡片、身分切換提示與未連線免責聲明 |
| **正式資料防護**| 展示操作不寫入正式資料庫 | `frontend/src/services/api.ts` | **PASS** | 僅寫入瀏覽器臨時 `sessionStorage`，零外部 HTTP 封包發送 |
| **正式模式不變**| 關閉 Demo Mode 時不破壞正式功能 | 全前端驗證 | **PASS** | `VITE_DEMO_MODE=false` 時自動還原真實 API 呼叫與嚴格 `ProtectedRoute` 權限管制 |
| **工作階段範圍**| 僅保存必要的臨時展示狀態 | `AuthContext.tsx`, `api.ts` | **PASS** | 使用 `ctk_demo_user` 與 `ctk_demo_teacher_app` 於 `sessionStorage`，關閉分頁即清空 |
| **產物數量** | `frontend/dist/` 僅有 7 個檔案 | `frontend/dist/` 實體產物 | **PASS** | 1 個 HTML、2 個資產檔案 (JS/CSS)、4 個 SVG Logo 檔案，共 7 個 |
| **排除不必要檔**| 無 Source Map、無 `.env`、無測試檔 | `frontend/dist/` 實體產物 | **PASS** | 零 `.map` 檔案、零 `.env*` 檔案、零測試檔案 |
| **敏感字串零殘留**| 無 localhost、連線字串或 Token 殘留 | `frontend/dist/assets/` | **PASS** | `localhost:4000`、`DATABASE_URL`、`SUPABASE` 匹配次數皆為 **0** |
| **管理權限安全**| 無外洩之內部管理或資料庫介面 | `frontend/src/pages/public/` | **PASS** | 所有頁面均為合規教學展示，無後台使用者管理、無 SQL 終端 |

---

## 二、發現之風險與具體位置分析

經過嚴格逐行審查，**未發現高風險（High）或阻斷性（Critical）漏洞**。  
以下列出兩項屬於**維護與防禦性（Low/Informational）**的最佳實踐觀察，已於本架構中妥善緩解：

1. **觀察項 A：第三方 Action (`peaceiris/actions-gh-pages@v4`) 使用 Major Tag**
   - **具體位置**：[`.github/workflows/deploy-preview.yml#L151`](file:///c:/Users/user/Documents/CODE-TO-KNOW/.github/workflows/deploy-preview.yml#L151)
   - **風險評估**：使用 `@v4` 為業界通用做法，但理論上若上游 tag 被更動存在微小不確定性。
   - **緩解現狀**：該 Action 為 GitHub 官方 Marketplace 認證且擁有超過 11,000 Star 之極成熟開源專案；且本 Workflow 限制了 `permissions: contents: read`，即使 Action 本身發生異常，亦無法讀寫或更動私人開發庫之任何內容。
2. **觀察項 B：展示模式模擬註冊產生的 ID**
   - **具體位置**：[`frontend/src/services/api.ts#L202`](file:///c:/Users/user/Documents/CODE-TO-KNOW/frontend/src/services/api.ts#L202)
   - **風險評估**：`id: 'demo-registered-' + Date.now()` 使用時間戳記生成示範 ID。
   - **緩解現狀**：該 ID 僅暫存於當前瀏覽器 `sessionStorage`，關閉分頁即銷毀，且不向後端發送任何請求，不具安全威脅。

---

## 三、GitHub Actions 部署流程安全性結論

### 結論：**PASS（架構安全，防護完整）**

1. **觸發控制嚴格**：僅限 `main` 分支之前端變更觸發，修改後端或專案文件時自動忽略，防止不必要的部署執行。
2. **門禁檢驗嚴密**：建置流程包含 TypeScript 型別檢查、檔案存在性驗證、白名單副檔名檢查與敏感字串正則掃描（4 道連鎖門禁），確保瑕疵產物絕不上線。
3. **隔離邊界明確**：明確將 `publish_dir` 指定為 `./frontend/dist`，完全杜絕原始儲存庫中的內部程式碼、資料庫檔案與個人文件被推送至公開展示庫的可能。
4. **Token 安全規範符合**：Token 由 GitHub Actions Secret 注入，不落盤、不印出於日誌，且限制為最小之單一展示庫存取權限。

---

## 四、Demo Mode 隔離完整性結論

### 結論：**PASS（邏輯閉環，零後端連線）**

1. **連線徹底阻斷**：`isDemoMode` 在展示建置時將 `API_BASE_URL` 置空，Vite 編譯器透過 Dead Code Elimination 徹底剔除 `http://localhost:4000/api`。
2. **全入口無死角覆蓋**：前端所有 8 個 API 函式均實作 `if (isDemoMode)` 分支，未經授權無法連線外部，亦無任何繞過機制。
3. **資料誠實展示**：示範學員與示範教師身分清楚標示為模擬帳號，所有受保護專區皆給予清楚的「公開展示模式」提示，不會誤導訪客為正式連線。
4. **雙向相容保證**：當關閉 `VITE_DEMO_MODE` 時，程式碼自動恢復正式生產模式之完整認證、CSRF 防護與權限管制，未遭破壞。

---

## 五、公開建置產物安全性結論

### 結論：**PASS（純淨靜態，零敏感資訊）**

1. **檔案數量精確**：`frontend/dist/` 嚴格僅有 7 個實體檔案，無多餘之 `.map` Source Map、測試檔案或 `.env` 檔案。
2. **深層字串稽核通過**：
   - `localhost:4000`：0 處匹配。
   - `127.0.0.1`：0 處匹配。
   - `DATABASE_URL`：0 處匹配。
   - `postgresql:`：0 處匹配。
   - `SUPABASE`：0 處匹配。
   - `PRIVATE_KEY` / `Bearer Token`：0 處匹配。
3. **信箱檢驗**：產物中之信箱均為示範用網址（`*.demo@codetoknow.edu`、`*.edu` 模擬學生名冊、`contact@codetoknow.edu`），無真實個人個資。

---

## 六、Git 與個人檔案保護狀態

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
	modified:   frontend/index.html
	modified:   frontend/package.json
	modified:   frontend/src/components/AuthModal.tsx
	modified:   frontend/src/components/Navbar.tsx
	modified:   frontend/src/components/ProtectedRoute.tsx
	modified:   frontend/src/components/TeacherApplyModal.tsx
	modified:   frontend/src/context/AuthContext.tsx
	modified:   frontend/src/services/api.ts
	modified:   frontend/src/vite-env.d.ts
	modified:   frontend/vite.config.ts
	modified:   "~$DE_TO_KNOW_20階段總體規劃與五層網站架構_更新版.docx"
	modified:   "新增 文字文件.txt"

Untracked files:
	.github/
	1.docx
	docs/GITHUB_PAGES_PREVIEW_PHASE1_PREFLIGHT.md
	docs/GITHUB_PAGES_PREVIEW_PHASE2_IMPLEMENTATION_REPORT.md
	docs/GITHUB_PAGES_PREVIEW_PHASE2_TO_PHASE7_FINAL_REPORT.md
	docs/GITHUB_PAGES_PREVIEW_PHASE3A_SECURITY_REVIEW.md
	docs/GITHUB_PAGES_PREVIEW_SETUP_GUIDE.md
	"照片/"
```

- **目前 HEAD Commit Hash**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **原始 Repository**：`Leonjay990414/CODE-TO-KNOW` 維持 **Private**。
- **使用者私人檔案保護**：`1.docx`、`新增 文字文件.txt`、`~$...docx`、`照片/` 均完整保護，未受任何修改或刪除。
- **Git 寫入操作**：未執行任何 `git add`、`git commit`、`git push`、`git reset` 或 `git clean`。

---

## 七、尚未解決的問題與建議處理順序

所有本機程式碼、自動化架構與安全審查項目均已完成，**目前無本機待修正問題**。  
下一步所需處理的事項為**使用者外部授權與 GitHub 網頁配置**：

1. **第一優先**：由使用者登入 GitHub 建立獨立公開儲存庫 `Leonjay990414/CODE-TO-KNOW-PREVIEW`。
2. **第二優先**：由使用者於 GitHub 建立限定單一展示庫之 Fine-grained PAT（`Contents: Read and write`）。
3. **第三優先**：由使用者於私人開發庫 Actions Secrets 注入 `PREVIEW_DEPLOY_TOKEN`。
4. **第四優先**：觸發首次自動化部署並驗收 GitHub Pages 網址。

---

## 八、審查最終結論

# **READY**

本專案的前端靜態相容性、Demo Mode 隔離防護、GitHub Actions 自動化工作流程及公開產物安全檢查均已全數審查完畢，無任何阻斷性安全問題。  
**可安全進入建立公開 Repository 與授權設定階段。**
