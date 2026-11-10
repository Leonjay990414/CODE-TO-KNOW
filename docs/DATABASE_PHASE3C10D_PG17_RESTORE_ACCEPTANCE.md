# CODE TO KNOW｜Phase 3-C-10D：PG17 還原驗收前置檢查確認與執行指示

## 一、執行前檢查結果（全數符合標準）

| 檢查項目 | 預期標準 | 實測核對結果 | 狀態 |
|---|---|---|:---:|
| **Git Branch & HEAD** | `main` @ `70a4c0cadd40300a9b92c74e570310e72b563891` | HEAD: `70a4c0cadd40300a9b92c74e570310e72b563891` | **PASS** |
| **還原腳本完整性** | Phase 3-C-10B 完成版 | `scripts/database/restore_pg17_sandbox.ps1` 具備 FIX-01~06 | **PASS** |
| **Phase 3-C-10C 獨立複核報告** | 判定為 PASS | `docs/DATABASE_PHASE3C10C_INDEPENDENT_RESTORE_AUDIT.md` 最終判定 PASS | **PASS** |
| **離線安全整合測試** | 18 大測試全數通過 | 實測 18/18 PASS（0 失敗） | **PASS** |
| **PG17 沙盒容器狀態** | `code_to_know_pg17_restore_sandbox` 正常運行 | `Up 4 hours`, 127.0.0.1:5433->5432/tcp | **PASS** |
| **PG17 版本** | 17.11 且連接埠為 5433 | `PostgreSQL 17.11 on x86_64-pc-linux-musl`, Port 5433 | **PASS** |
| **PG16 開發環境隔離** | 獨立於 5432，不連線、不操作 | `code_to_know_postgres` 獨立於 5432（未接觸） | **PASS** |
| **目標資料庫非存在性** | `code_to_know_c2kb_prod_restore_test` 尚不存在 | 查詢 `pg_database` 確認為空，無任何衝突資料庫 | **PASS** |
| **正式備份檔案三要素** | `.dump`、`.c2kb`、`.sha256` 均存在且雜湊吻合 | 505,249 bytes Dump (`2BB79...`) 與 505,282 bytes C2KB (`6E266...`) 完好 | **PASS** |
| **機敏資訊保護** | 不得外洩金鑰，不得貼入聊天視窗 | 依安全規範要求於本機終端機以遮罩方式輸入 | **PASS** |

---

## 二、使用者本機終端機執行指令

因安全防護機制嚴格禁止在非互動式後台程序或對話視窗傳遞真實金鑰，且腳本採用 `Read-Host -AsSecureString` 遮罩保護，請開啟您的 **本機 PowerShell 視窗**（在專案根目錄 `C:\Users\user\Documents\CODE-TO-KNOW` 下）執行以下命令：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\database\restore_pg17_sandbox.ps1
```

### 操作步驟：
1. 執行後腳本會提示：
   `請輸入 KeePassXC 64 字元 Hex 主金鑰 (輸入全程遮罩隱藏)：`
   `Encryption Key:`
2. 請直接從 **KeePassXC** 複製 64 字元的 AES-256-GCM 備份金鑰，並在終端機中按右鍵貼上（畫面全程不會顯示任何字元）。
3. 按 Enter 執行。
4. 腳本將自動完成：
   - 目標庫存在性安全檢查
   - 呼叫 `backup-crypto.cjs` 驗證 AuthTag 並解密
   - 比對解密後 SHA-256（必須完全等於 `2BB79ECC5BE8A129D66C6F42D5304C2CA265058E83770790E65F82E5AB717A50`）
   - 建立資料庫 `code_to_know_c2kb_prod_restore_test`
   - 使用 `docker cp` 與 `pg_restore --no-owner --no-acl` 還原
   - 自動查詢 5 大完整性指標並進行數值斷言
   - 抹除本機與容器內的明文暫存檔案並重設環境變數
5. 執行完成後，請將終端機輸出的結果（包含 5 大指標統計表與最後的判定結果）告知我，我們將進行驗收審核並產出正式驗收報告 `docs/DATABASE_PHASE3C10D_PG17_RESTORE_ACCEPTANCE.md`。
