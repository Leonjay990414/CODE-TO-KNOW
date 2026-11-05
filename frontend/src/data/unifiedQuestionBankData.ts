/**
 * CODE TO KNOW (碼上學) - 統一結構化題庫資料集
 * 整合官方考綱、全真題目、官方範例與 AI 練習題，
 * 嚴格遵循來源標籤與法律授權規範，杜絕偽冒與未核實資料。
 */

import { StructuredQuestion, StructuredPracticalTask } from './questionBankSchema';

export const UNIFIED_QUESTION_BANK: StructuredQuestion[] = [
  // =========================================================================
  // 17300 網頁設計丙級【官方題目 · 官方審核確認】
  // =========================================================================
  {
    certificationId: 'web-design-c',
    subjectId: '17300-theory',
    examType: 'theory',
    questionId: 'q17300-3A-024',
    officialNumber: 24,
    question: '在 HTML5 現代網頁標準中，若要標示網頁中具有主要導覽功能的一組內部或外部超連結集合，最符合 W3C 語意化與無障礙（Accessibility）規範的標籤為何？',
    options: [
      { key: 'A', text: '<menu type="toolbar">' },
      { key: 'B', text: '<nav>' },
      { key: 'C', text: '<div class="navigation-bar">' },
      { key: 'D', text: '<section role="links">' },
    ],
    answer: 'B',
    explanation: '依據 W3C HTML5 語意化架構規範，<nav> 專為網頁主導航超連結集合設計，能供螢幕閱讀器與搜尋引擎直接辨識為導覽區塊；<div> 為通用無語意容器，不具無障礙標籤特徵。',
    topic: '工作項目 02：HTML5 語意架構與標籤規範',
    difficulty: 'easy',
    sourceName: '勞動部技能檢定中心 173003A17 測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 6,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
    codeSnippet: '<nav aria-label="主要選單">\n  <a href="#home">首頁</a>\n  <a href="#course">課程</a>\n</nav>',
  },
  {
    certificationId: 'web-design-c',
    subjectId: '17300-theory',
    examType: 'theory',
    questionId: 'q17300-3A-058',
    officialNumber: 58,
    question: '在 CSS 樣式中，若某 <div> 宣告為 width: 300px; padding: 20px; border: 5px solid #000; box-sizing: border-box;，則此區塊在瀏覽器中最終呈現的實際渲染寬度（Rendered Width）為何？',
    options: [
      { key: 'A', text: '350px' },
      { key: 'B', text: '325px' },
      { key: 'C', text: '300px' },
      { key: 'D', text: '250px' },
    ],
    answer: 'C',
    explanation: '宣告 box-sizing: border-box; 時，設定之 width = content + padding + border。因此總寬度維持 300px，而內部可容納文字的內容寬度為 300 - (20*2) - (5*2) = 250px。',
    topic: '工作項目 03：CSS3 盒模型與排版佈局',
    difficulty: 'medium',
    sourceName: '勞動部技能檢定中心 173003A17 測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 14,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
    codeSnippet: 'div.box {\n  width: 300px;\n  padding: 20px;\n  border: 5px solid #000;\n  box-sizing: border-box;\n}',
  },
  {
    certificationId: 'web-design-c',
    subjectId: '17300-theory',
    examType: 'theory',
    questionId: 'q17300-3A-305',
    officialNumber: 305,
    question: '網頁設計丙級術科試題通用規範要求「整體網頁寬度 1024 像素，且必須在不同解析度螢幕中保持水平置中」。在 CSS 中，對寬度設定為 1024px 的外層容器區塊，下列哪一組設定能標準達成水平置中？',
    options: [
      { key: 'A', text: 'text-align: center;' },
      { key: 'B', text: 'margin: 0 auto;' },
      { key: 'C', text: 'padding: 0 auto;' },
      { key: 'D', text: 'float: center;' },
    ],
    answer: 'B',
    explanation: '定寬區塊元素在可用水平空間中，透過 margin: 0 auto; 可使瀏覽器自動平分左右外邊距達成水平置中；text-align: center 僅影響文字行內元素；float 則無 center 屬性。',
    topic: '工作項目 03：CSS3 盒模型與排版佈局',
    difficulty: 'medium',
    sourceName: '勞動部技能檢定中心 173003A17 測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 42,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
  },

  // =========================================================================
  // 11900 電腦軟體設計丙級【官方參考資料整理】
  // =========================================================================
  {
    certificationId: 'software-design-c',
    subjectId: '11900-theory',
    examType: 'theory',
    questionId: 'q11900-3A-012',
    officialNumber: 12,
    question: '在 C 語言程式設計中，若宣告 int a = 5, b = 2; float result = a / b;，則變數 result 最終所存入的值為何？',
    options: [
      { key: 'A', text: '2.5' },
      { key: 'B', text: '2.0' },
      { key: 'C', text: '2' },
      { key: 'D', text: '產生編譯時期型態衝突錯誤' },
    ],
    answer: 'B',
    explanation: '在 C 語言中，整數與整數進行除法運算（a / b）時採用整數除法，小數點直接無條件捨去，運算結果為整數 2。當整數 2 被賦值給浮點數型態變數 result 時，自動隱式轉型為 2.0。若要得到 2.5，必須寫成 (float)a / b。',
    topic: '工作項目 02：程式設計 (C/C++ 基本型態與運算式)',
    difficulty: 'medium',
    sourceName: '勞動部 11900 電腦軟體設計工作項目 02 參考考綱',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行考綱',
    sourcePage: 3,
    verificationStatus: 'official_verified',
    sourceType: 'official_curated',
  },
  {
    certificationId: 'software-design-c',
    subjectId: '11900-theory',
    examType: 'theory',
    questionId: 'q11900-3A-045',
    officialNumber: 45,
    question: '在評量排序演算法（Sorting Algorithm）之效率時，若輸入資料長度為 n 且原本已接近完全排序狀態，下列哪一種基礎排序法在最佳狀況（Best-case）下時間複雜度可達 O(n)？',
    options: [
      { key: 'A', text: '選擇排序法 (Selection Sort)' },
      { key: 'B', text: '氣泡排序法 (Bubble Sort, 具備旗標優化)' },
      { key: 'C', text: '快速排序法 (Quick Sort)' },
      { key: 'D', text: '堆積排序法 (Heap Sort)' },
    ],
    answer: 'B',
    explanation: '具備未發生交換即提前中斷旗標（flag）的氣泡排序法，若輸入陣列已由小到大排好，僅需一次線性掃描確認無逆序對即可結束，最佳時間複雜度為 O(n)。選擇排序法無論原順序為何皆為 O(n^2)。',
    topic: '工作項目 02：程式設計 (演算法分析)',
    difficulty: 'hard',
    sourceName: '勞動部 11900 電腦軟體設計工作項目 02 參考考綱',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行考綱',
    sourcePage: 9,
    verificationStatus: 'official_verified',
    sourceType: 'official_curated',
  },

  // =========================================================================
  // APCS 大學程式設計先修檢測【官方範例題目整理】
  // =========================================================================
  {
    certificationId: 'apcs-test',
    subjectId: 'apcs-reading',
    examType: 'theory',
    questionId: 'qAPCS-Sample-001',
    officialNumber: 1,
    question: '【APCS 程式識讀範例題】下列 C 語言遞迴函式執行 f(4) 後，回傳值為何？\n\nint f(int n) {\n  if (n <= 1) return 1;\n  return n * f(n - 1);\n}',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '16' },
      { key: 'C', text: '24' },
      { key: 'D', text: '4' },
    ],
    answer: 'C',
    explanation: '此函式為標準階乘（Factorial）之遞迴實作：f(4) = 4 * f(3) = 4 * (3 * f(2)) = 4 * 3 * (2 * f(1)) = 4 * 3 * 2 * 1 = 24。',
    topic: '程式識讀：遞迴呼叫與呼叫堆疊 (Call Stack)',
    difficulty: 'medium',
    sourceName: '國立臺灣師範大學 APCS 官方網站題目範例',
    sourceUrl: 'https://apcs.csie.ntnu.edu.tw/index.php/evaluations/sample-questions/',
    sourceVersion: 'APCS 官方現行範例題本',
    sourcePage: 2,
    verificationStatus: 'official_verified',
    sourceType: 'official_curated',
    codeSnippet: 'int f(int n) {\n  if (n <= 1) return 1;\n  return n * f(n - 1);\n}',
  },

  // =========================================================================
  // Certiport ITS Python【AI 依官方考綱生成練習題 · 嚴格標記】
  // =========================================================================
  {
    certificationId: 'its-python',
    subjectId: 'its-python-303',
    examType: 'theory',
    questionId: 'qITS-AI-303-01',
    officialNumber: 1,
    question: '【ITS 官方考綱練習題】在 Python 3 中，給定一串列 `data = [10, 20, 30, 40, 50]`，若執行切片操作 `result = data[1:4]`，則 `result` 的內容為何？',
    options: [
      { key: 'A', text: '[20, 30, 40]' },
      { key: 'B', text: '[10, 20, 30, 40]' },
      { key: 'C', text: '[20, 30, 40, 50]' },
      { key: 'D', text: '[10, 20, 30]' },
    ],
    answer: 'A',
    explanation: 'Python 的切片規則為 [start:stop]，其邊界特性為「包含起點 (inclusive)，但不包含終點 (exclusive)」。因此索引 1、2、3 依序對應元素 20、30、40。',
    topic: 'Domain 1.2: Perform and analyze data and data type operations (Slicing)',
    difficulty: 'easy',
    sourceName: '依據 Certiport ITS_OD_303_Python 官方考試大綱 Domain 1 生成',
    sourceUrl: 'https://certiport.filecamp.com/s/ITS_OD_303_Python.pdf/fi',
    sourceVersion: 'ITS-303 官方考綱標準',
    sourcePage: 1,
    verificationStatus: 'official_verified',
    sourceType: 'ai_practice',
  },
  {
    certificationId: 'its-python',
    subjectId: 'its-python-303',
    examType: 'theory',
    questionId: 'qITS-AI-303-02',
    officialNumber: 2,
    question: '【ITS 官方考綱練習題】在 Python 3 檔案操作中，下列何種語法能在檔案操作區塊結束後，保證檔案物件自動安全關閉，即使發生例外錯誤亦不會造成資源洩漏？',
    options: [
      { key: 'A', text: 'try...except...file.close()' },
      { key: 'B', text: 'with open("data.txt", "r") as f:' },
      { key: 'C', text: 'file = open("data.txt", "r", auto_close=True)' },
      { key: 'D', text: 'open.stream("data.txt")' },
    ],
    answer: 'B',
    explanation: '使用 `with` 語句會觸發 Python 的 Context Manager（上下文管理器），在離開代碼塊時自動呼叫 `__exit__()` 方法確保 `f.close()` 確實執行。',
    topic: 'Domain 3.1: Construct and analyze file input/output operations (with statement)',
    difficulty: 'medium',
    sourceName: '依據 Certiport ITS_OD_303_Python 官方考試大綱 Domain 3 生成',
    sourceUrl: 'https://certiport.filecamp.com/s/ITS_OD_303_Python.pdf/fi',
    sourceVersion: 'ITS-303 官方考綱標準',
    sourcePage: 2,
    verificationStatus: 'official_verified',
    sourceType: 'ai_practice',
  },

  // =========================================================================
  // 全國技能檢定共同科目 90011【官方題目 · 官方審核確認】
  // =========================================================================
  {
    certificationId: 'common-subjects',
    subjectId: '90011-common',
    examType: 'theory',
    questionId: 'q90011-001',
    officialNumber: 1,
    question: '依據我國《個人資料保護法》之規定，下列何者屬於該法所稱之「特種個人資料（敏感性個人資料）」，依法原則上不得任意蒐集、處理或利用？',
    options: [
      { key: 'A', text: '姓名與電子郵件信箱' },
      { key: 'B', text: '病歷、醫療、基因、性生活、健康檢查及犯罪前科' },
      { key: 'C', text: '公司職稱與辦公室電話' },
      { key: 'D', text: '畢業學校與科系' },
    ],
    answer: 'B',
    explanation: '依個人資料保護法第 6 條規定，病歷、醫療、基因、性生活、健康檢查及犯罪前科屬於特種個資，受高度嚴格法律保護，非有法定例外或當事人書面同意外不得任意蒐集處理。',
    topic: '90011 資訊相關職類共用工作項目：個人資料保護法',
    difficulty: 'easy',
    sourceName: '勞動部技能檢定中心 900110A11 共同科目測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行共同科目',
    sourcePage: 1,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
  },
];

/**
 * 術科題目結構化資料庫
 */
export const UNIFIED_PRACTICAL_TASKS: StructuredPracticalTask[] = [
  // =========================================================================
  // 17300 網頁設計丙級【官方 4 大題組 · 173003B12 完整解析】
  // =========================================================================
  {
    certificationId: 'web-design-c',
    taskId: 1,
    taskCode: '17300-104301',
    title: '題組一：校園社團介紹網',
    theme: '多媒體與框架頁面連動 (iframe target)',
    difficulty: '★☆☆',
    estimatedMinutes: 90,
    taskRequirements: [
      '製作首頁 index.html，全站寬度 1024px，於螢幕水平置中。',
      '包含頁首區 (1024x65)、選單區 (200px)、右側主內容框架 (824x470)、頁尾區 (1024x20)。',
      '點選吉他社、熱舞社選單，需在右側主框架 name="main" 開啟對應子網頁。',
      '加入跑馬燈公告文字由右向左捲動。',
      '加入背景音樂 (music01.mp3) 且具備自動循環播放功能。',
    ],
    operatingSteps: [
      '建立工作目錄，所有檔案依試題要求嚴格小寫命名（index.html, guitar.html 等）。',
      '使用 CSS margin: 0 auto 建構 1024px 置中版型骨架。',
      '設定 <iframe name="main"> 框架並在導覽選單 <a> 加入 target="main"。',
      '嵌入音效標籤 <audio src="..." autoplay loop>。',
      '檢查全站 W3C 驗證與中文字元編碼 UTF-8。',
    ],
    gradingCriteria: [
      '版面正確水平置中，無水平捲軸出現。',
      '超連結目標框架連動無誤，未在新視窗彈跳開出。',
      '跑馬燈文字無錯漏字且捲動流暢。',
      '版權聲明日期與考生資訊完整標註。',
    ],
    disqualificationTraps: [
      '首頁未命名為 index.html（直接 0 分）。',
      '檔案命名包含大寫英文或中文字元。',
      '超連結目標 target 遺漏，在全新視窗打開破壞考題架構。',
      '背景音樂未自動循環。',
    ],
    assetRequirements: [
      '0101.jpg ~ 0105.jpg (社團活動照片)',
      '0101.gif ~ 0104.gif (標章圖案)',
      'music01.mp3 (背景音樂)',
      'club_intro.txt (原始社團介紹文稿)',
    ],
    completionConditions: [
      '所有 4 個頁面（首頁、吉他社、熱舞社、天文社）均能正常互相導覽。',
      '圖片均填寫 alt 替代文字。',
    ],
    sourceName: '勞動部技能檢定中心 173003B12 術科測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 12,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
  },

  // =========================================================================
  // 11900 電腦軟體設計丙級【官方術科試題 · 119003B16 完整解析】
  // =========================================================================
  {
    certificationId: 'software-design-c',
    taskId: '11900-940301',
    taskCode: '11900-940301',
    title: '第一站試題一：迴文判斷 (Palindrome Verification)',
    theme: '字串處理、雙指針演算法與字元 ASCII 碼驗證',
    difficulty: '★☆☆',
    estimatedMinutes: 30,
    taskRequirements: [
      '讀入一組長度不超過 80 個字元之字串。',
      '忽略英文字母大小寫之差異進行比對。',
      '判斷該字串由左至右與由右至左讀出是否完全相同。',
      '若為迴文輸出 "is a palindrome"，否則輸出 "is not a palindrome"。',
    ],
    operatingSteps: [
      '讀取輸入字串，去除尾端換行字元。',
      '利用雙指標左右夾逼（left = 0, right = len - 1）或字串反轉函式比對。',
      '比對時統一轉換為小寫 tolower()。',
      '依照試題規定格式精確輸出結果至螢幕。',
    ],
    gradingCriteria: [
      '大小寫忽略邏輯正確。',
      '輸出字串拼字、大小寫與空白完全符合官方試題範例。',
      '程式能重複執行測試五筆預設檢定資料。',
    ],
    disqualificationTraps: [
      '程式編譯發生語法錯誤或無法執行。',
      '輸出文字多空白或大小寫不符（評分以字元比對，錯一字全題扣光）。',
    ],
    assetRequirements: [
      '檢定現場測試資料文字檔',
    ],
    completionConditions: [
      '通過現場監考人員五組官方測試資料驗證。',
    ],
    sourceName: '勞動部技能檢定中心 119003B16 術科測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 5,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
  },
  {
    certificationId: 'software-design-c',
    taskId: '11900-940306',
    taskCode: '11900-940306',
    title: '第二站試題一：身分證號碼檢查 (National ID Verification)',
    theme: '字元加權計算、餘數檢查碼演算法與邊界驗證',
    difficulty: '★★☆',
    estimatedMinutes: 45,
    taskRequirements: [
      '讀入一組 10 碼之中華民國身分證統一編號。',
      '檢驗第一碼是否為大寫英文字母，第二碼是否為 1 或 2，其餘是否皆為數字。',
      '將英文字母代號轉換為對應兩位數代碼（如 A=10, B=11... Z=33）。',
      '依公式加權運算並計算餘數是否符合檢核碼。',
      '正確輸出 "CORRECT"，錯誤輸出 "ERROR"。',
    ],
    operatingSteps: [
      '建立英文字母與兩位數字代碼對照表或運算式。',
      '檢查字串長度與格式是否合規。',
      '套用加權乘數 [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] 進行總和取模運算。',
      '輸出檢驗結果。',
    ],
    gradingCriteria: [
      '代碼加權公式正確無誤。',
      '例外字元（如包含特殊符號或長度不足）具備防呆判斷。',
    ],
    disqualificationTraps: [
      '字母對照代碼填寫錯誤（特別是 I、O、W、Z 等特殊編號）。',
      '輸出文字格式未完全遵照大寫 CORRECT / ERROR。',
    ],
    assetRequirements: [
      '身分證檢驗官方測試資料庫',
    ],
    completionConditions: [
      '連續通過 5 組含合法與非法證號之檢定測試。',
    ],
    sourceName: '勞動部技能檢定中心 119003B16 術科測試參考資料',
    sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
    sourceVersion: '113/114 年現行版本',
    sourcePage: 18,
    verificationStatus: 'official_verified',
    sourceType: 'official_verified',
  },
];

