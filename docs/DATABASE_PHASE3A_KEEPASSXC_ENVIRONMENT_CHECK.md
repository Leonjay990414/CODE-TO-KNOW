# CODE TO KNOW｜KeePassXC 本機保管環境檢查報告
# 資料庫正式收尾 Phase 3-A：AES-256-GCM 主金鑰本機安全保管環境盤點

**文件編號**：C2K-DOC-DB-PHASE3A-KEEPASSXC-CHECK-01  
**檢查日期**：2026-11-10  
**主檢角色**：資安稽核工程師 / 本機密碼學架構師  
**審查性質**：100% 唯讀環境檢查（未建立金鑰、未建立密碼庫、未連線雲端、零寫入操作）  
**安全規範聲明**：
- 嚴格未讀取 `新增 文字文件.txt` 及任何使用者私有文件。
- 未生成正式 AES-256 主金鑰。
- 未修改任何專案程式碼、Git 設定或環境變數。

---

## 一、KeePassXC 安裝與啟動狀態檢查

### 1. 檢查結果
- **安裝狀態**：**尚未安裝（NOT INSTALLED）**。
- **檢查依據**：
  - 系統 `PATH` 環境變數檢索：無 `keepassxc` 相關指令。
  - Windows 64-bit 標準目錄：`C:\Program Files\KeePassXC\KeePassXC.exe`（不存在）。
  - Windows 32-bit 相容目錄：`C:\Program Files (x86)\KeePassXC\KeePassXC.exe`（不存在）。
  - 使用者本機應用程式目錄：`%LOCALAPPDATA%\Programs\KeePassXC\KeePassXC.exe`（不存在）。
  - Windows 登錄表（Registry）安裝清單檢索：未登記任何 KeePassXC 軟體安裝資訊。
  - 使用者桌面與下載目錄：無 KeePassXC 安裝程式安裝包。
- **目前版本與啟動狀態**：N/A（尚未安裝）。

---

## 二、KeePassXC 官方安裝導引（請使用者自行操作）

依據本階段最高安全規範，AI 助手**不得自行下載、安裝或靜默執行任何安裝程式**。請專案負責人依以下官方途徑手動下載並安裝：

1. **官方下載頁面**：
   👉 [https://keepassxc.org/download/](https://keepassxc.org/download/)
2. **建議下載規格**：
   - 平台：Windows 64-bit
   - 安裝檔格式：**MSI Installer**（標準安裝檔）或 **Portable**（免安裝可攜版，可直接解壓縮於離線隨身碟）。
3. **安全驗證建議（SHA-256 數位簽章校驗）**：
   下載完成後，可在 PowerShell 執行以下指令比對官方公佈之 SHA-256 雜湊值，確保安裝包未遭竄改：
   ```powershell
   Get-FileHash "$env:USERPROFILE\Downloads\KeePassXC-*-Win64.msi" -Algorithm SHA256
   ```

---

## 三、本機保管環境檢查結果

### 1. 本機磁碟與存儲空間狀態
經系統磁碟盤點（`Get-Volume` / `Get-Disk`）：
- **本機主硬碟（C:）**：
  - 設備型號：NVMe Acer SSD FA100 1TB
  - 檔案系統：NTFS
  - 可用空間：約 **652.5 GB**（存儲空間極度充裕）。
  - 安全評估：適合作為 KeePassXC 本機日常存取的 `.kdbx` 加密資料庫主要放置點（**必須存放於專案程式碼目錄之外**）。

### 2. 外接與抽取式裝置狀態
偵測到目前本機連接有兩組外接 USB 裝置：
- **裝置 1（D: 槽，標籤：莊詠捷）**：
  - 設備型號：ADATA USB Flash Drive（64GB）
  - 檔案系統：FAT32
  - 可用空間：約 2.3 GB。
- **裝置 2（F: 槽，標籤：Transcend）**：
  - 設備型號：JetFlash Transcend 16GB
  - 檔案系統：FAT32
  - 可用空間：約 9.3 GB。
- **安全評估**：
  兩組隨身碟均為 FAT32 格式，目前尚未啟用 BitLocker 硬體加密。若需作為「離線備援金鑰隨身碟」，建議後續在專案負責人指示下指定獨立隨身碟專用，避免與個人現有檔案混用。

---

## 四、如何避免密碼庫及備援資料被 Git 追蹤

密碼庫檔案（`.kdbx`）與金鑰檔案（`.key`）若意外提交至 Git 倉庫，即使倉庫為 Private，依然存在嚴重的資安外洩風險。

### 核心防護原則：
1. **目錄實體隔離原則（Physical Separation）**：
   > [!IMPORTANT]
   > **KeePassXC 密碼庫檔案（如 `c2k_vault.kdbx`）嚴禁存放在專案目錄 `C:\Users\user\Documents\CODE-TO-KNOW` 內部！**
   
   - **正確存放位置**：應存放在專案外部獨立目錄，例如：
     - `C:\Users\user\SecureVault\c2k_production.kdbx`
     - 或使用者家目錄下的獨立加密安全夾。
   - **實體隔離優點**：即使執行 `git add .`、`git push` 或 `git clean -fdx`，皆 100% 不可能影響或暴露外部密碼庫。

2. **專案 `.gitignore` 縱深防禦配置（防呆保護）**：
   為防止未來任何操作人員失誤將金鑰或備份檔案複製至專案中，待後續獲得授權後，專案 `.gitignore` 應補強以下黑名單規則：
   ```gitignore
   # 密碼學金鑰與密碼庫防呆隔離
   *.kdbx
   *.key
   *.c2kb
   *.dump
   *.pem
   *.crt
   !backend/certs/prod-supabase-ca.crt
   /secrets/
   /backups/
   ```

---

## 五、離線備援準備狀態評估

依據高安全等級之金鑰管理規範（Key Custody）：

| 備援層級 | 備援媒介 | 當前準備狀態 | 評估說明與後續動作 |
| :--- | :--- | :---: | :--- |
| **第一層（本機加密）** | 本機 KeePassXC (`.kdbx`) | **待準備** | 待使用者安裝 KeePassXC 軟體後建立。 |
| **第二層（離線隨身碟）** | 專屬加密 USB 隨身碟 | **待準備** | 目前 D: 與 F: 槽已有隨身碟，但待使用者指定專用裝置並確認是否啟用 BitLocker。 |
| **第三層（實體紙本防潮卡）** | A4 實體抄寫/列印卡 | **待準備** | 待生成正式 32-byte 金鑰後，抄寫 Hex 字串並封存於防潮保險箱。 |

---

## 六、下一步操作建議

1. **使用者操作**：
   請專案負責人開啟瀏覽器前往 [https://keepassxc.org/download/](https://keepassxc.org/download/) 下載並安裝 KeePassXC。
2. **安裝完成後確認**：
   安裝完畢後通知 AI 助手，我們將進行快速啟動驗證，隨後進入 **Phase 3-B：正式 32-byte AES-256 主金鑰生成與備援卡建立**。

---

## 七、Git 狀態與安全查核確認

- **Git 分支**：`main`
- **當前 HEAD**：`70a4c0cadd40300a9b92c74e570310e72b563891`
- **Git Status**：
  - 未提交之使用者檔案（`新增 文字文件.txt`、`1.docx`、`照片/`）**100% 完整保留，未受任何觸碰**。
  - 本次僅新增本檢核文件：`docs/DATABASE_PHASE3A_KEEPASSXC_ENVIRONMENT_CHECK.md`。
- **零寫入保證**：
  - **未連線 Supabase 雲端環境。**
  - **未讀取 `新增 文字文件.txt`。**
  - **未產生正式主金鑰。**
  - **未執行 git commit / push / reset / clean。**

---
*(報告完畢，停止操作，等待使用者確認)*
