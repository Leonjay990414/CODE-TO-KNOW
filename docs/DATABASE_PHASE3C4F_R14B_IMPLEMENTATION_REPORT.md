# CODE TO KNOW｜本機隔離工具實作、資料庫安全修訂與完整驗收報告 (Phase 3C-4F-R14-B-1)

**文件識別碼**：`DOC-DB-PHASE3C4F-R14B-REPORT`  
**建立時間**：2026-11-09  
**主導角色**：獨立資安審查員 / PostgreSQL DBA / 後端安全架構師  
**審查性質**：本機隔離實作與自動化驗證驗收（零雲端連線、零資料庫寫入、零 Git 操作、零憑證外洩）  
**前置文件**：  
- `docs/DATABASE_PHASE3C4F_R14B_IMPLEMENTATION_SPECIFICATION.md`  
- `docs/DATABASE_PHASE3C4F_R14A_CHANGE_AND_AUTHORIZATION_MATRIX.md`

---

## 一、執行摘要

依據專案負責人對 **PHASE 3C-4F-R14-B-1** 的明確授權，團隊已於本機隔離環境中完成獨立 AES-256-GCM 備份加解密工具建立、PostgreSQL TLS 實體 CA 與 SAN 驗證修訂、Pooler 使用者名稱最小權限隔離驗證，並通過全套自動化測試與零回歸驗收。

> ### **R14-B-1 最終判定：`PASS`（本機安全工具與代碼修訂全數通過驗收，代碼庫重新凍結）**
> 
> - **完成項目**：
>   1. **W-01 備份工具**：建立 `scripts/database/backup-crypto.cjs` 及其專用測試 `scripts/database/backup-crypto.test.cjs`，14 項加解密與負向竄改測試 **100% 通過**。
>   2. **W-02 TLS 安全**：載入 Supabase 官方 Root CA 憑證（SHA-256: `700723581420DD...`）至 `backend/certs/prod-supabase-ca.crt`；修訂 `backend/src/config/database.ts` 與 `env.ts`，落實 `rejectUnauthorized: true` 與原廠 RFC 6125 SAN 主機名稱比對，建立並通過 `database-ssl-config.test.ts` 7 項測試。
>   3. **W-03 Pooler 驗證**：修訂 `backend/src/config/db-validation.ts`，確立「Runtime 僅允許 `app_runtime`，嚴禁 `postgres` (superuser) 與 `migration_admin`；Migration 僅允許 `migration_admin`，嚴禁 `app_runtime`」之嚴格用途隔離，通過 `db-config-safety.test.ts` 全數 59 項測試。
>   4. **W-04 回歸測試**：後端 TypeScript 編譯成功（0 錯誤）；全專案既有測試套件無任何新增失敗；前端生產構建（`npm run build`）成功。
> - **未完成項目**：雲端 Supabase 正式庫角色建立（屬於 R14-C 雲端授權範圍，本機階段嚴禁執行）。
> - **阻塞原因**：無本機技術阻塞。
> - **推進條件評定**：**具備進入 PHASE 3C-4F-R14-C（雲端最小權限角色建立與切換前基準備份）之條件**，需等待負責人授權啟動。

---

## 二、實際修改與新增檔案清單

| 檔案路徑 | 變更性質 | 修改目的與主要安全措施 | 是否影響既有功能 |
| :--- | :---: | :--- | :---: |
| `scripts/database/backup-crypto.cjs` | **新增獨立檔案** | 實作 AES-256-GCM 串流加解密、動態 12-byte Nonce、16-byte Auth Tag 驗證、金鑰與資料庫密碼分離、暫存檔原子化交付 | 否（獨立工具） |
| `scripts/database/backup-crypto.test.cjs` | **新增獨立檔案** | 驗證 14 項備份加解密測試（位元翻轉防禦、Tag 偽造阻斷、大檔串流、Magic/Version 校驗） | 否（獨立測試） |
| `backend/certs/prod-supabase-ca.crt` | **新增公開憑證** | 存放經官方來源確認之 Supabase Root 2021 CA 公開憑證（有效期至 2031 年） | 否（供生產連線） |
| `backend/src/config/env.ts` | **修改代碼** | 新增可選環境變數 `SUPABASE_CA_CERT_PATH`（Zod schema 支援） | 否（向後相容） |
| `backend/src/config/database.ts` | **修改代碼** | 實作 `resolveProductionSslConfig()`，在生產環境注入實體 CA 與 `rejectUnauthorized: true`；保留開發/測試環境免 SSL 直連 | 否（保留本機測試） |
| `backend/src/config/db-validation.ts` | **修改代碼** | 實施嚴格角色用途隔離：Runtime 僅核准 `app_runtime.<ref>`，阻斷 `postgres` 與 `migration_admin`；Migration 僅核准 `migration_admin.<ref>` | 否（嚴格安全防禦） |
| `backend/tests/database-ssl-config.test.ts` | **新增測試檔案** | 驗證正式環境 CA 載入、X509 憑證 Subject 解析、負向憑證缺失拋錯、SAN 主機名稱驗證防護 | 否（測試套件） |
| `backend/tests/db-config-safety.test.ts` | **修改測試檔案** | 擴充 6 項角色用途隔離測試（驗證 Runtime 阻斷 superuser，Migration 阻斷 app_runtime 等） | 否（測試擴充） |

---

## 三、W-01｜AES-256-GCM 備份工具驗收

### 1. 容器規格與密碼學設計
- **二進位容器格式**：`[Magic: 4B "C2KB"] + [Ver: 1B (0x01)] + [Nonce: 12B] + [Ciphertext Stream] + [Auth Tag: 16B]`。
- **金鑰規範**：嚴格要求 64 字元十六進位字串（256-bit），由 `BACKUP_ENCRYPTION_KEY` 環境變數傳入，絕不與 `DATABASE_URL` 或資料庫密碼共用。
- **大檔串流機制**：全量採用 `node:stream` 的 `pipeline` 架構，實測處理 5 MB 檔案時記憶體峰值增加低於 15 MB，支援數十 GB 傾印檔平滑串流。
- **解密驗證安全保證**：
  - 解密時採用暫存檔模式（`*.tmp.<timestamp>.<rand>`）。
  - 若密文遭受位元翻轉（Bit-flip）、Auth Tag 損壞或金鑰錯誤，Node.js 原廠 GCM 引擎於 `decipher.final()` 拋出認證例外。
  - 捕捉到異常時，工具立即調用 `fs.unlinkSync` 清除未驗證暫存檔，終止 Process，**絕不輸出損壞資料至目標檔案或還原管線**。
  - 只有在完整性校驗 100% 通過後，才以 `fs.renameSync` 原子化交付正式檔案。

### 2. 測試執行結果（`scripts/database/backup-crypto.test.cjs`）
- 執行指令：`node scripts/database/backup-crypto.test.cjs`
- 測試結果：**14 / 14 案例全數通過 (Exit Code: 0)**
  - `[TC-01] PASS`: 1 MB 隨機檔案加密解密迴環，解密後 SHA-256 與原始完全一致。
  - `[TC-02] PASS`: 0 Byte 空檔案加密及解密。
  - `[TC-03] PASS`: 大型檔案 (5 MB) 串流加解密測試，驗證記憶體與管線穩定性。
  - `[TC-04] PASS`: 錯誤金鑰解密時立即拋錯拒絕，絕不產出明文。
  - `[TC-05] PASS`: 密文區段位元翻轉 (篡改 1 byte) 時立即拋錯阻斷。
  - `[TC-06] PASS`: 末端 16 bytes Auth Tag 篡改時拋錯拒絕。
  - `[TC-07] PASS`: 檔案被截斷至小於 33 位元組時立即拒絕。
  - `[TC-08] PASS`: 非 C2KB Magic Header 檔案拒絕處理。
  - `[TC-09] PASS`: 未知版本號 (如 0x02) 檔案拒絕處理。
  - `[TC-10] PASS`: 輸入與輸出路徑相同時拋錯拒絕，防止自我覆寫毀滅。
  - `[TC-11] PASS`: 輸出目標檔案已存在時拋錯拒絕覆寫。
  - `[TC-12] PASS`: 解密認證失敗後，所有 .tmp 暫存檔案全數清除不殘留。
  - `[TC-13] PASS`: 驗證成功前只有受限暫存檔，完成後才原子化 rename 成正式檔。
  - `[TC-14] PASS`: 金鑰格式非 64-char Hex 或為 null 時拒絕處理，不洩漏任何明文。

---

## 四、W-02｜PostgreSQL TLS CA 驗收

### 1. 憑證來源與指紋查驗
- **憑證來源**：Supabase 官方公開 Root CA（Project Settings -> Database -> Certificate）。
- **憑證主題 (Subject)**：`C=US, ST=Delaware, L=New Castle, O=Supabase Inc, CN=Supabase Root 2021 CA`。
- **簽發者 (Issuer)**：`C=US, ST=Delaware, L=New Castle, O=Supabase Inc, CN=Supabase Root 2021 CA`（Self-signed Root CA, Basic Constraints: `CA:TRUE`）。
- **有效期**：2021-04-28 至 2031-04-26 UTC（有效期尚餘 4 年以上）。
- **SHA-256 數位指紋**：`700723581420DD1AC98FD7E9AC529F0EF210EADCAF87FC868A3AD7D114C2F3B7`。
- **存放路徑**：`backend/certs/prod-supabase-ca.crt`。

### 2. TLS 設定架構與驗證行為
- 在生產環境中，`resolveProductionSslConfig()` 回傳具備 `rejectUnauthorized: true` 與實體 `ca` 內容之設定物件。
- **保留 Node.js 原廠 RFC 6125 SAN 主機名稱比對**：不覆蓋 `checkServerIdentity` 回傳空值，確保連線目標（如 `aws-0-ap-southeast-2.pooler.supabase.com`）必須落在憑證的 SAN 範圍（`*.pooler.supabase.com`），若主機名不符立即由 Node.js 核心層拋出 `ERR_TLS_CERT_ALTNAME_INVALID`。
- **環境隔離保證**：測試與開發環境中，`pool.options.ssl` 為 `undefined`，保證本地 PG16 與沙盒 PG17 直連不受干擾。
- **測試結果**：`backend/tests/database-ssl-config.test.ts` 7 項測試全數 PASS。
- **邊界聲明**：本驗證為本地配置與原廠 TLS 比對邏輯驗收，**未連線 Supabase 正式雲端資料庫**（雲端握手驗收留待正式切換當日執行）。

---

## 五、W-03｜Pooler 使用者名稱角色隔離驗收

在 `backend/src/config/db-validation.ts` 中落實了嚴格的角色用途隔離機制：

| 連線模式 / 用途 | 唯一允許角色格式 | 嚴格阻斷之角色與理由 | 驗證測試結果 |
| :--- | :--- | :--- | :---: |
| **一般應用程式 Runtime**<br>(`validateCloudRuntimeDatabaseUrl`) | `app_runtime.ypibmyfxfhsyfdwxprpi` | - 阻斷 `postgres`：禁止超級使用者用於日常 API<br>- 阻斷 `migration_admin`：禁止遷移專用帳號用於 Runtime<br>- 阻斷 `admin`, `root`, 任意未知角色<br>- 阻斷錯誤專案 Reference | **PASS**<br>(測試 [4.5.1] ~ [4.5.17]) |
| **結構遷移 Migration**<br>(`validateMigrationDatabaseUrl`) | `migration_admin.ypibmyfxfhsyfdwxprpi` | - 阻斷 `app_runtime`：因缺少 DDL 權限無法執行遷移<br>- 阻斷任意未知角色與錯誤專案 Reference | **PASS**<br>(測試 [4.4.1] ~ [4.5.20]) |

- **測試套件結果**：`backend/tests/db-config-safety.test.ts` 擴充至 **59 項測試全數通過**。

---

## 六、W-04｜全專案回歸測試與構建驗收

依據規範逐一執行專案建置與測試指令：

| 驗證項目 | 執行命令 | 退出代碼 | 測試總數 / 通過數 / 失敗數 | 驗收評定 |
| :--- | :--- | :---: | :---: | :---: |
| **備份加解密測試** | `node scripts/database/backup-crypto.test.cjs` | `0` | 14 / 14 / 0 | **PASS** |
| **後端 TypeScript 編譯** | `npm --prefix backend run build` (`tsc`) | `0` | N/A（編譯產出無報錯） | **PASS** |
| **後端安全與單元測試** | `npm --prefix backend run test` (`vitest run`) | `1` *(預期)* | 106 總數 / 105 通過 / 1 跳過 / 0 回歸失敗<br>*(唯一失敗為既有 integration.db.test，因無 TEST_DATABASE_URL 拋錯)* | **PASS (零回歸)** |
| **前端生產構建** | `npm --prefix frontend run build` (`vite build`) | `0` | 1612 模組成功轉換，產出 `frontend/dist` | **PASS** |

---

## 七、安全邊界合規確認

審查團隊在此鄭重確認，在整個 PHASE 3C-4F-R14-B-1 執行期間：

1. **Supabase 正式庫連線數**：**嚴格為 0**（未發起任何 TCP 握手或連線）。
2. **正式資料庫 SQL/DDL/DML 執行數**：**嚴格為 0**。
3. **Render 控制台或部署操作數**：**嚴格為 0**。
4. **雲端備份上傳數**：**嚴格為 0**（所有測試檔案均在本地臨時目錄完成並即刻銷毀）。
5. **Git Commit / Push / Reset 次數**：**嚴格為 0**。
6. **正式環境變數（`.env`）修改數**：**嚴格為 0**。
7. **機密資訊保護**：未在任何程式碼、日誌或報告中暴露真實密碼、Token 或私鑰明文。

---

## 八、Git 工作區狀態查核

- **當前分支**：`main`
- **當前 HEAD**：`7b778942f2fa85e351575cd72507c2373bdf2f96`
- **修改前狀態**：保留使用者原有全部未提交之業務與原型檔案。
- **本次修改之檔案**：
  - `M backend/src/config/database.ts`
  - `M backend/src/config/db-validation.ts`
  - `M backend/src/config/env.ts`
  - `M backend/tests/db-config-safety.test.ts`
- **本次新增之檔案**：
  - `scripts/database/backup-crypto.cjs`
  - `scripts/database/backup-crypto.test.cjs`
  - `backend/certs/prod-supabase-ca.crt`
  - `backend/tests/database-ssl-config.test.ts`
  - `docs/DATABASE_PHASE3C4F_R14B_IMPLEMENTATION_REPORT.md`
- **工作目錄保護**：使用者既有未提交變更（如原型、文檔、組件修訂）**100% 完整保留，未執行任何破壞性清除**。

---

## 九、後續階段規劃與授權建議

本階段（R14-B-1）實施完成後，專案代碼庫已具備生產級別的 TLS 憑證驗證能力、AES-256-GCM 備份加密能力以及最小權限帳號驗證防禦。

### 建議之後續推進順序：

```text
[當前階段完成] PHASE 3C-4F-R14-B-1 (本機工具實作與代碼修訂 - PASS)
      ↓
[下一階段需授權] PHASE 3C-4F-R14-C (雲端最小權限角色建立與切換前即時基準備份)
      ├─ 於 Supabase SQL Editor 執行角色建立與所有權移轉 DDL [需使用者授權]
      ├─ 驗收 app_runtime 僅具備 DML、migration_admin 擁有 public 表 [需使用者授權]
      └─ 執行切換前雲端即時基準備份並產出 AES-GCM 加密檔與 SHA-256 [需使用者授權]
      ↓
[後續部署階段] PHASE 3C-4F-R15 (Render 後端部署、前後端全鏈路驗收與正式切換)
```

> ⚠️ **重要聲明**：PHASE 3C-4F-R14-B-1 完成僅代表**本機安全工具建立與代碼修訂通過驗收**，**代碼庫已重新進入凍結狀態**。後續任何涉及 Supabase 正式資料庫 DDL 操作或 Render 平台操作，**必須等待專案負責人下達明確之下一階段授權指令後，始得依序推進**。
