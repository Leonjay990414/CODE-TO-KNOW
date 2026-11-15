# CODE TO KNOW｜GitHub 與 Render 雙環境部署規範

更新日期：2026-11-15

## 1. 環境分工

| 環境 | GitHub 分支 | Render 服務 | 用途 |
|---|---|---|---|
| 正式 Production | `main` | `code-to-know-web` | 對外正式公開版本 |
| 預覽 Preview | `develop` | `code-to-know-preview` | 隨時查看開發中版本 |

正式網站：
- https://code-to-know-web.onrender.com

預覽網站：
- Render Preview 服務尚待建立；建立後將網址補記於本文件。

## 2. 更新流程

1. 日常開發與新功能先進入 `develop`。
2. 將已完成的程式碼、文件與測試更新推送至 GitHub `develop`。
3. Render Preview 服務監聽 `develop`，自動建置並發布預覽版本。
4. 在 Preview 驗證頁面、互動、RWD、資安與測試結果。
5. 通過驗收後，透過 Pull Request 將 `develop` 合併至 `main`。
6. Render Production 服務只監聽 `main`，再部署正式版本。

## 3. Render 建置設定

兩個服務均為 Static Site，前端專案根目錄為 `frontend`。

- Root Directory：`frontend`
- Build Command：`npm ci && npm run build`
- Publish Directory：`dist`

環境變數不得照抄或臆測。建立 Preview 時，先檢查程式碼是否依賴 API、資料庫、Demo Mode 或其他環境變數，再決定是否設定。不得把 Production 機密複製到 Preview。

Hash-based 路由若能直接由前端處理，不應未經驗證就新增全站 Rewrite 規則。

## 4. 安全與變更規則

- 不得讓 Preview 服務監聽 `main`，也不得讓 Production 服務監聽 `develop`。
- 未完成 Preview 驗收，不得合併至 `main`。
- 不得把資料庫密碼、API Token、Session Secret 或其他機密寫入 Git。
- 不得在 Preview 使用 Production 資料庫或 Production 機密，除非另有明確安全設計與授權。
- 不得擅自修改 Supabase、PostgreSQL、Prisma Schema、Migration、後端 API 或正式環境變數。
- 五大正式術科題組 104301～104305 的題目、步驟、答案、教材與評分內容維持保護；未取得完整五組資料前，不做題組專屬修改。
- AUTH-03 維持 BLOCKED；task-13717 維持 STOPPED；P09-DBA-012 維持 BLOCKED。
- Commit、Push、PR Merge 與 Deploy 必須依專案負責人授權範圍執行；不得 force push、reset --hard、git clean 或使用 `git add .` / `git add -A`。

## 5. 目前設定狀態

- [x] GitHub `main` 作為正式版本分支。
- [x] 建立 GitHub `develop` 分支，建立點為當時的 `main`。
- [ ] 將本機尚未推送的修改檔案逐一審核後，明確加入 `develop`。
- [ ] 建立 Render Static Site `code-to-know-preview`，連接同一 GitHub Repository 的 `develop` 分支。
- [ ] 確認 Preview 建置與公開網址。
- [ ] 驗收通過後，以 Pull Request 將開發版本合併回 `main`。

注意：建立 `develop` 分支只複製當時 GitHub `main` 的遠端內容，不會自動包含開發者電腦上尚未推送的工作目錄修改。
