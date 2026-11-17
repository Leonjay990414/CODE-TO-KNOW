# Shared｜跨層共用頁面 (Shared Pages)

## 一、層級定位
- **架構層級**：跨層共用頁面（Cross-Layer Shared Pages）
- **主要對象**：全體使用者（跨訪客、學生、教師、管理員）。
- **技術規範**：React + TypeScript + Vite 元件（`.tsx`）。

## 二、層級職責
1. **法規與合規聲明**：全站通用之法律規範頁面，包含隱私權政策（Privacy Policy）、使用者服務條款（Terms of Service）、AI 智慧倫理守則（AI Ethics）。
2. **通用狀態與錯誤頁面**：未找到頁面（404 Not Found）、伺服器異常提示（500 Error）、系統維護公告。
3. **公共協議與指引**：平臺開源聲明、第三方開源授權宣告、全站無障礙宣告。

## 三、預計收納頁面清冊（待後續搬移階段執行）
- `LegalNoticePage.tsx`：法律條款與隱私權規範中心（Privacy / Terms / AI Ethics）。
- `NotFoundPage.tsx`：通用 404 頁面（若未來獨立抽離）。

## 四、權限與存取控制
- 通用公開存取，全站各系統 Footer 與導覽列均可直接導引用。
