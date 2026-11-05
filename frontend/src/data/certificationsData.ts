/**
 * CODE TO KNOW (碼上學) - Certifications Data Repository
 * Official Frontend Mock & Demo Dataset
 *
 * Requirements:
 * - Active official demonstration: 網頁設計丙級 (Website Design – Level C)
 * - Coming Soon showcases:
 *   1. 電腦軟體設計丙級 (Computer Software Design C-Class)
 *   2. 電腦軟體應用丙級 (Computer Software Application C-Class)
 *   3. APCS 大學程式設計先修檢測 (Advanced Placement Computer Science)
 *   4. ITS Python 國際資訊科技認證 (Information Technology Specialist – Python)
 *   5. 網頁設計乙級技術士 (Website Design – Level B)
 *
 * Rules:
 * - Clear COMING SOON status
 * - No fictitious question counts, scores, pass rates, or learning records for Coming Soon certifications.
 */

export interface ExamInfo {
  duration: string;
  questionCount: string;
  passingScore: string;
  organ: string;
  qualification: string;
}

export interface TheoryChapter {
  chapterId: number;
  title: string;
  questionCount?: number;
  focus: string;
}

export interface PracticalTask {
  taskId: number;
  name: string;
  category: string;
  description: string;
  keyPoints: string[];
  isDemoReady?: boolean;
}

export interface LearningResource {
  title: string;
  type: string;
  url?: string;
  note: string;
}

export interface Certification {
  id: string;
  code: string;
  name: string;
  englishName: string;
  level: string;
  category: 'web' | 'software' | 'algorithm' | 'application';
  categoryName: string;
  disciplineType: 'comprehensive' | 'theory' | 'practical';
  demoStatus: 'demo_ready' | 'preview_only';
  isComingSoon: boolean;
  isFeatured: boolean;
  badgeText: string;
  shortDesc: string;
  detailedDesc: string;
  subjectsCount?: number;
  practicalsCount?: number;
  progress?: number;
  enrolledStudents?: number;
  tags: string[];
  plannedFeatures: string[];
  examInfo: ExamInfo;
  theoryChapters: TheoryChapter[];
  practicalTasks: PracticalTask[];
  resources: LearningResource[];
}

export const CERTIFICATIONS_DATA: Certification[] = [
  // 1. 網頁設計丙級技術士 (Active Demonstration Entrance)
  {
    id: 'web-design-c',
    code: '17300',
    name: '網頁設計丙級技術士',
    englishName: 'Website Design – Level C',
    level: '國家丙級技術士',
    category: 'web',
    categoryName: '網頁技術',
    disciplineType: 'comprehensive',
    demoStatus: 'demo_ready',
    isComingSoon: false,
    isFeatured: true,
    badgeText: '正式示範中',
    shortDesc: '勞動部技術士技能檢定國家標準（職類代號 17300）。涵蓋 HTML5 語意架構、CSS3 樣式排版、多媒體整合及官方 4 大經典題組。',
    detailedDesc: '網頁設計丙級為台灣技職高中、大專資訊相關科系及跨領域自學者的核心國家技術士檢定。依勞動部 173003A17 官方規範，學科題庫總數約 611 題（平台目前展示核心精選題練習）；依 173003B12 規範，術科正式評量共 4 大題組（校園社團、國家公園、體育活動、台灣美食），本平台提供逐步拆解、防呆檢核與安全沙盒，協助學習者高分考取證照。',
    subjectsCount: 611,
    practicalsCount: 4,
    progress: 45,
    enrolledStudents: 12480,
    tags: ['HTML5', 'CSS3', '排版佈局', '響應式', '網頁標準'],
    plannedFeatures: [
      '官方 173003A17 全真學科題庫智能刷題',
      '官方 173003B12 術科 4 大題組逐步實作拆解',
      '線上即時 HTML5 / CSS3 語意化程式碼編輯器',
      '4 階 AI 思考鷹架助教（觀念、破題、邊界、架構）',
      '全真模擬考場倒數與自動計分診斷',
    ],
    examInfo: {
      duration: '學科 60 分鐘 / 術科 120 分鐘',
      questionCount: '學科單選 80 題（抽自約 611 題題庫） / 術科 4 大題組抽測 1 題',
      passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
      organ: '勞動部勞動力發展署技能檢定中心',
      qualification: '年滿 15 歲或國民中學畢業者即可報考',
    },
    theoryChapters: [
      {
        chapterId: 1,
        title: '工作項目 01：作業準備與智慧財產權法規',
        questionCount: 120,
        focus: '個人資料保護法、著作權法、網路資訊安全規範常識（依 173003A17）',
      },
      {
        chapterId: 2,
        title: '工作項目 02：應用軟體安裝及使用 (HTML5 結構)',
        questionCount: 180,
        focus: 'DOCTYPE 宣告、header、nav、article、section 語意化結構',
      },
      {
        chapterId: 3,
        title: '工作項目 03：系統軟體安裝及使用 (CSS3 排版)',
        questionCount: 180,
        focus: '盒模型 (Box Model)、選擇器權重、1024px 水平置中、浮動清除',
      },
      {
        chapterId: 4,
        title: '工作項目 04：資訊安全與多媒體色彩原理',
        questionCount: 131,
        focus: 'PNG/JPEG/GIF 格式差異、RGB/CMYK 色彩空間、音訊播放屬性',
      },
    ],
    practicalTasks: [
      {
        taskId: 1,
        name: '題組一：校園社團介紹網',
        category: '多媒體與框架佈局',
        description: '建立 1024px 水平置中校園社團首頁，包含吉他社與熱舞社等子分頁跳轉、跑馬燈效果與音訊嵌入。',
        keyPoints: ['1024px 寬度置中', 'iframe 目標框架 target 連動', '跑馬燈屬性規範', '背景音樂自動循環'],
        isDemoReady: true,
      },
      {
        taskId: 2,
        name: '題組二：國家公園生態探索網',
        category: '圖文清單與錨點導覽',
        description: '台灣國家公園地形與保育介紹，涵蓋圖片展示清單、頁內錨點跳轉、表格屬性設定。',
        keyPoints: ['圖片等比例縮放', '頁內錨點 id 與 href 參照', '表格邊界與儲存格合併', '超連結狀態偽類樣式'],
        isDemoReady: true,
      },
      {
        taskId: 3,
        name: '題組三：體育休閒活動中心',
        category: '互動表單與動態選單',
        description: '活動中心報名預約系統，包含導覽選單翻轉反白特效、表單驗證欄位與多選項控制項。',
        keyPoints: ['滑鼠懸停 hover 翻轉效果', '表單 input 類型規範', '選取方塊與單選鈕群組', '送出與清除按鈕重設'],
        isDemoReady: true,
      },
      {
        taskId: 4,
        name: '題組四：台灣美食精緻巡禮',
        category: '格線排列與圖文展示',
        description: '在地美食品味指南，採用多欄圖片排列佈局、自訂浮水印背景與字型排版設計。',
        keyPoints: ['圖片替代文字 alt 嚴格填寫', '自訂背景圖不重複固定', '文字陰影與排版階層', '多媒體視訊播放器嵌入'],
        isDemoReady: true,
      },
    ],
    resources: [
      {
        title: '勞動部官方檢定試題及應檢參考資料（17300 網頁設計丙級）',
        type: '官方規範規章',
        note: '包含學科標準答案題庫及術科評分要點',
      },
      {
        title: 'W3C HTML5 / CSS3 語意標準手冊',
        type: '技術標準',
        note: '現代 Web 標準推薦實踐指南',
      },
      {
        title: '碼上學 4 階 AI 思考鷹架助教模組',
        type: '平台內建工具',
        note: '解題卡關時不直接劇透程式碼，循序啟發思維',
      },
    ],
  },

  // 2. 電腦軟體設計丙級 (Coming Soon)
  {
    id: 'software-design-c',
    code: '11900',
    name: '電腦軟體設計丙級',
    englishName: 'Computer Software Design C-Class',
    level: '國家丙級技術士',
    category: 'software',
    categoryName: '軟體開發',
    disciplineType: 'comprehensive',
    demoStatus: 'preview_only',
    isComingSoon: true,
    isFeatured: false,
    badgeText: 'COMING SOON',
    shortDesc: '勞動部職類代號 11900。評量 C / C++ 結構化程式設計基礎、陣列演算法、文字檔案處理與字串邏輯分析。',
    detailedDesc: '電腦軟體設計丙級檢定為資電類科升學、技優甄審與程式設計師奠定紮實底層邏輯的核心國家證照。評量 C / C++ 語言核心基礎、陣列排序、字串反轉、檔案 I/O 與邊界邏輯處理能力。本檢定目前處於題庫數位化與在線沙盒整合階段，線上練習與測驗即將開放。',
    tags: ['C / C++', '演算法', '陣列', '字串處理', '邏輯控制'],
    plannedFeatures: [
      '學科歷屆試題智能分類刷題與錯題本',
      'C / C++ 核心演算法線上解題與即時評測',
      '術科第一站與第二站完整程式驗證沙盒',
      '4 階 AI 邏輯思考鷹架助教（提點思維不直接給答案）',
      '考場常見零分陷阱與格式檢核防呆提示',
    ],
    examInfo: {
      duration: '學科 60 分鐘 / 術科 150 分鐘',
      questionCount: '學科單選 80 題 / 術科 8 題組抽取評測',
      passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
      organ: '勞動部勞動力發展署技能檢定中心',
      qualification: '年滿 15 歲或國民中學畢業者即可報考',
    },
    theoryChapters: [
      { chapterId: 1, title: '工作項目 01：程式語言概論與記憶體架構', focus: '資料型態、指標位址、進位制轉換常識' },
      { chapterId: 2, title: '工作項目 02：流程控制與迴圈演算法', focus: 'for/while 迴圈、巢狀判斷式、條件分支' },
      { chapterId: 3, title: '工作項目 03：陣列、字串與函式呼叫', focus: '氣泡排序、二分搜尋、遞迴函式原理' },
      { chapterId: 4, title: '工作項目 04：結構化程式與檔案 I/O', focus: '文字檔讀寫、結構體宣告、例外狀況處理' },
    ],
    practicalTasks: [
      { taskId: 1, name: '第一站試題：數列統計與迴文檢驗 (940301)', category: '基本演算法', description: '陣列極值搜尋、中位數計算與對稱字串判斷。', keyPoints: ['雙指針比對', '陣列排序', '進位捨入處理'] },
      { taskId: 2, name: '第一站試題：身分證號檢驗與加權運算 (940306)', category: '字串與邏輯運算', description: '字元代碼轉換與檢核碼餘數加權計算。', keyPoints: ['ASCII 碼運算', '公式加權檢核', '例外格式過濾'] },
      { taskId: 3, name: '第二站試題：矩陣相加乘運算', category: '多維陣列', description: '二維陣列維度相容性檢查與矩陣乘法運算輸出。', keyPoints: ['三重迴圈設計', '空間配置', '邊界例外'] },
      { taskId: 4, name: '第二站試題：文字檔成績計算與排序', category: '檔案處理', description: '讀取資料文字檔，計算總分平均並輸出依序排名。', keyPoints: ['檔案串流讀寫', '結構體排序', '格式化排版'] },
    ],
    resources: [
      { title: '勞動部 11900 電腦軟體設計丙級試題規範 (119003B16)', type: '官方文件', note: '術科評分標準與編譯環境規範' },
      { title: '現代 C/C++ 標準編譯環境指南', type: '技術指南', note: 'GCC/Clang 編譯器參數建議' },
    ],
  },

  // 3. 電腦軟體應用丙級 (Coming Soon)
  {
    id: 'computer-software-app-c',
    code: '11800',
    name: '電腦軟體應用丙級',
    englishName: 'Computer Software Application C-Class',
    level: '國家丙級技術士',
    category: 'application',
    categoryName: '數位應用',
    disciplineType: 'comprehensive',
    demoStatus: 'preview_only',
    isComingSoon: true,
    isFeatured: false,
    badgeText: 'COMING SOON',
    shortDesc: '勞動部職類代號 11800。全民數位資訊能力指標，涵蓋 Word 文書排版、Excel 統計函數、Access 資料庫與檔案管理。',
    detailedDesc: '電腦軟體應用丙級為台灣最普及的國家技術士檢定之一，適合商管、設計、文法與資訊各領域學習者。評量辦公室自動化核心技能，包含複雜文件排版、樞紐統計與資料庫關聯查詢。目前線上題庫與操作指引正籌備中。',
    tags: ['Word 排版', 'Excel 函數', 'Access 資料庫', '檔案管理'],
    plannedFeatures: [
      '學科全真題庫考點智能歸納練習',
      'Word 精確排版與頁面規範逐步引導',
      'Excel 核心統計函數與圖表產製解析',
      'Access 關聯式資料庫查詢建置防呆檢核',
      '跨題組操作步驟查驗與評分標準檢驗',
    ],
    examInfo: {
      duration: '學科 60 分鐘 / 術科 120 分鐘',
      questionCount: '學科單選 80 題 / 術科 6 大題組抽 1 題',
      passingScore: '學科 60 分以上、術科 60 分以上（雙科皆及格）',
      organ: '勞動部勞動力發展署技能檢定中心',
      qualification: '年滿 15 歲者皆可報名報考',
    },
    theoryChapters: [
      { chapterId: 1, title: '工作項目 01：電腦硬體、系統架構與網路通訊', focus: 'CPU/RAM 規格、作業系統檔案階層、IP 協定' },
      { chapterId: 2, title: '工作項目 02：辦公室應用軟體操作常識', focus: '文書樣式、試算表常用統計函數、資料庫鍵值' },
      { chapterId: 3, title: '工作項目 03：資訊安全防護與網路防毒概念', focus: '密碼學基礎、惡意程式防範、備份復原規範' },
      { chapterId: 4, title: '工作項目 04：職業道德、綠色環保與工作安全法規', focus: '勞動基準法、智慧財產權益、節能減碳常識' },
    ],
    practicalTasks: [
      { taskId: 1, name: '題組一：文書排版與資料庫報表整合', category: '辦公室自動化', description: '整合 Access 資料表輸出查詢，並以 Word 完成多段落排版與頁眉頁尾。', keyPoints: ['頁面邊界設定', '表格合併與框線', '頁首頁尾學號考號'] },
      { taskId: 2, name: '題組二：試算表樞紐統計與圖表產製', category: '試算表應用', description: '運用 VLOOKUP、IF、SUMIF 統計銷售數據並產出統計圖表。', keyPoints: ['函數巢狀組合', '圖表標題與座標軸', '百分比數值格式'] },
    ],
    resources: [
      { title: '勞動部 11800 電腦軟體應用技術士技術手冊', type: '官方文件', note: '資料集與試題作答防呆檢核表' },
    ],
  },

  // 4. APCS 大學程式設計先修檢測 (Coming Soon)
  {
    id: 'apcs-test',
    code: 'APCS',
    name: 'APCS 大學程式設計先修檢測',
    englishName: 'Advanced Placement Computer Science',
    level: '學術升學指標檢定',
    category: 'algorithm',
    categoryName: '演算法檢測',
    disciplineType: 'comprehensive',
    demoStatus: 'preview_only',
    isComingSoon: true,
    isFeatured: false,
    badgeText: 'COMING SOON',
    shortDesc: '全台頂尖大學資工系重要選才指標。包含觀念題（C 語言底層與邏輯推演）與實作題（4 題高難度演算法評測）。',
    detailedDesc: 'APCS (Advanced Placement Computer Science) 由國立臺灣師範大學主辦，為高中生申請國內頂尖大學資訊學系最具公信力之能力指標。檢定分為「程式設計觀念題」與「程式設計實作題」兩大科目，評定等第由 1 至 5 級分。目前正在建置專屬線上評判系統 (OJ) 與演算法解題鷹架。',
    tags: ['動態規劃', '樹狀結構', '圖論 BFS/DFS', '二分搜尋', '時間複雜度'],
    plannedFeatures: [
      '觀念題程式碼追蹤推理與遞迴邏輯拆解',
      '實作題專屬在線評判系統 (Online Judge)',
      '時間複雜度與空間複雜度 (Big-O) 即時診斷',
      '經典高頻題型（貪婪、DP、樹圖搜尋）演算法知識圖譜',
      '4 階 AI 思考鷹架：從題目直覺到狀態轉移方程式引導',
    ],
    examInfo: {
      duration: '觀念題 90 分鐘 / 實作題 150 分鐘',
      questionCount: '觀念題 40 題單選 / 實作題 4 題程式題',
      passingScore: '評定等第 1 至 5 級分（資工系通常採計 4 級分以上）',
      organ: '國立臺灣師範大學資訊工程學系承辦',
      qualification: '全國高中職在學學生及社會大眾皆可報考',
    },
    theoryChapters: [
      { chapterId: 1, title: '主題範疇 01：運算思維與程式追蹤推理', focus: '變數作用域、遞迴追蹤、運算子優先級' },
      { chapterId: 2, title: '主題範疇 02：基礎資料結構：堆疊、佇列與串列', focus: 'LIFO/FIFO 操作、陣列實作、鏈結節點指向' },
      { chapterId: 3, title: '主題範疇 03：進階資料結構：樹與圖論遍歷', focus: '二元樹中序/前序遍歷、鄰接矩陣與 DFS/BFS' },
      { chapterId: 4, title: '主題範疇 04：演算法效能與時空複雜度 Big-O', focus: 'Big-O 評估、最壞情況與最優情況分析' },
    ],
    practicalTasks: [
      { taskId: 1, name: '基本題：模擬與邏輯驗證', category: 'Level 1 基礎門檻', description: '依照題意執行精確條件邏輯與狀態維護。', keyPoints: ['邊界檢查', '條件分支', '型態溢位防護'] },
      { taskId: 2, name: '進階題：雙指針與滑動窗口', category: 'Level 2 線性演算法', description: '以 O(N) 線性時間在連續區間內找出目標解。', keyPoints: ['雙指針法', '前綴和', '雜湊表輔助'] },
      { taskId: 3, name: '挑戰題：二元樹與圖搜尋遍歷', category: 'Level 3 樹狀與圖論', description: '針對樹狀階層結構進行最長路徑或連通塊求解。', keyPoints: ['DFS 深度優先', 'BFS 廣度優先', '記憶化遞迴'] },
      { taskId: 4, name: '壓軸題：動態規劃與背包問題', category: 'Level 4 狀態轉移最優解', description: '找出最優子結構並建立狀態轉移方程式。', keyPoints: ['DP 狀態設計', '滾動陣列空間壓縮', '邊界初始值'] },
    ],
    resources: [
      { title: 'APCS 官方歷次檢定試題公開範例 (NTNU CSIE)', type: '官方歷屆試題', note: '包含實作題測資規格與觀念題詳解' },
      { title: '演算法競賽入門到精通知識圖譜', type: '延伸教材', note: '涵蓋經典 DP 與圖論高頻題型' },
    ],
  },

  // 5. ITS Python 國際資訊科技認證 (Coming Soon)
  {
    id: 'its-python',
    code: 'ITS-PY',
    name: 'ITS Python 國際資訊科技認證',
    englishName: 'Information Technology Specialist – Python',
    level: '國際權威認證',
    category: 'software',
    categoryName: '軟體開發',
    disciplineType: 'comprehensive',
    demoStatus: 'preview_only',
    isComingSoon: true,
    isFeatured: false,
    badgeText: 'COMING SOON',
    shortDesc: 'Certiport 全球資訊科技專家認證。評量現代 Python 核心語法、資料結構、檔案讀寫與例外處理規範。',
    detailedDesc: 'Information Technology Specialist (ITS) 是由全球權威認證機構 Certiport 頒發的國際專業證照。全面驗證學習者於 Python 3 基礎運算、容器操作、函式定義及例外控制之實務能力。目前正依照 ITS-303 官方考綱建置互動練習模組。',
    tags: ['Python 3', '物件導向', '檔案 I/O', '例外捕捉', '國際證照'],
    plannedFeatures: [
      'Certiport ITS-303 官方考試大綱對應精選練習題',
      'Python 3 互動式線上程式碼編輯沙盒',
      '容器型態 (List / Tuple / Dict / Set) 專題實作導引',
      '檔案串流 I/O 與 try-except 例外處理情境題',
      '全真測驗模擬與知識弱點熱力圖分析',
    ],
    examInfo: {
      duration: '全測驗 50 分鐘',
      questionCount: '約 35~40 題（單選、複選、程式碼填空與拖曳題）',
      passingScore: '滿分 1000 分，達 700 分即合格獲證',
      organ: 'Certiport / Pearson VUE',
      qualification: '無年齡或學歷限制，國際通用標準',
    },
    theoryChapters: [
      { chapterId: 1, title: '考綱領域 1：Python 運算與資料型態操作 (20-25%)', focus: 'int/float/str、切片語法、邏輯運算與型態轉換' },
      { chapterId: 2, title: '考綱領域 2：資料結構與資料串流決策 (25-30%)', focus: 'List、Tuple、Dict、Set 操作與推導式' },
      { chapterId: 3, title: '考綱領域 3：模組重構與函式架構 (20-25%)', focus: 'def 函式、引數傳遞、內建模組引用與命名空間' },
      { chapterId: 4, title: '考綱領域 4：檔案讀寫與例外錯誤防禦 (20-25%)', focus: 'with open() 串流、try/except/finally 異常捕捉' },
    ],
    practicalTasks: [
      { taskId: 1, name: '單元沙盒：購物清單金額累計與折價券計算', category: '資料結構操作', description: '運用字典與串列推導式完成結帳邏輯。', keyPoints: ['List Comprehension', 'Dict 鍵值運算', '浮點數精度'] },
      { taskId: 2, name: '單元沙盒：CSV 銷售報表讀取與過濾', category: '檔案串流', description: '讀取 CSV 檔案並過濾特定門檻業績列。', keyPoints: ['內建 csv 模組', '例外錯誤處理', '寫入新檔案'] },
    ],
    resources: [
      { title: 'Certiport ITS Python Exam Objectives 官方大綱', type: '原廠大綱', note: '中英對照認證主題與測驗範疇' },
    ],
  },

  // 6. 網頁設計乙級技術士 (Coming Soon)
  {
    id: 'web-design-b',
    code: '17300-B',
    name: '網頁設計乙級技術士',
    englishName: 'Website Design – Level B',
    level: '國家乙級技術士',
    category: 'web',
    categoryName: '網頁技術',
    disciplineType: 'comprehensive',
    demoStatus: 'preview_only',
    isComingSoon: true,
    isFeatured: false,
    badgeText: 'COMING SOON',
    shortDesc: '勞動部職類代號 17300 乙級。涵蓋 PHP/MySQL 動態全端開發、資料庫 CRUD、Session 驗證與資安防禦。',
    detailedDesc: '網頁設計乙級為國家高階全端技術士資格，要求應檢人具備完整動態網站架構能力。實作涵蓋伺服器環境配置、關聯式資料庫正規化設計、預備陳述式防禦 SQL Injection，以及管理後台權限管制。目前正在研製安全沙盒與題組逐步演練教學。',
    tags: ['PHP', 'MySQL', 'JavaScript', '安全性', 'CRUD'],
    plannedFeatures: [
      '學科進階資訊安全與伺服器架構考題剖析',
      'PHP 與 MySQL 關聯資料庫動態 CRUD 題組拆解',
      'SQL 注入防禦 (Prepared Statements) 安全程式檢驗',
      '會員 Session 狀態維護與購物車交易流程實戰',
      '術科題組逐步比對檢核與評分重點解析',
    ],
    examInfo: {
      duration: '學科 100 分鐘 / 術科 240 分鐘',
      questionCount: '學科單選 60 題複選 20 題 / 術科 4 題組抽 1 題',
      passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
      organ: '勞動部勞動力發展署技能檢定中心',
      qualification: '取得丙級證照後具備相關學經歷或高中職相關科系畢業者',
    },
    theoryChapters: [
      { chapterId: 1, title: '工作項目 01：Web 伺服器配置與網路協定運作', focus: 'Apache/Nginx 設定、HTTP Header、DNS 映射' },
      { chapterId: 2, title: '工作項目 02：關聯式資料庫設計與 SQL 語法', focus: '資料表正規化、JOIN 查詢、索引建立與最佳化' },
      { chapterId: 3, title: '工作項目 03：後端動態腳本程式與狀態維護', focus: 'PHP Session、Cookie 機制、檔案上傳安全' },
      { chapterId: 4, title: '工作項目 04：資訊安全威脅與防禦實踐', focus: 'XSS 攻擊防禦、SQL Injection 預備陳述句、CSRF 防護' },
    ],
    practicalTasks: [
      { taskId: 1, name: '題組一：會員註冊登入與購物商城後台', category: '全端動態管理系統', description: '建置完整會員 Session 驗證機制與商品 CRUD 管理後台。', keyPoints: ['密碼雜湊運算', 'PDO 預備陳述式', '管理員權限判定'] },
    ],
    resources: [
      { title: '勞動部 17300-B 網頁設計乙級技術手冊', type: '官方文件', note: '資料庫 DDL 規格與評分審查要點' },
    ],
  },
];

export function getAllCertifications(): Certification[] {
  return CERTIFICATIONS_DATA;
}

export function getCertificationById(id: string): Certification | undefined {
  return CERTIFICATIONS_DATA.find((c) => c.id === id);
}
