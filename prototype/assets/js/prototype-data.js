/**
 * CODE TO KNOW (碼上學) Prototype - Mock Data Repository
 * Exposed as global window.PROTOTYPE_DATA for local file:// compatibility.
 */

window.PROTOTYPE_DATA = {
  brand: {
    chineseName: '碼上學',
    englishName: 'CODE TO KNOW',
    fullTitle: '碼上學 AI 智慧學習與教育科技平台',
    slogan: '碼上學，學無止境。',
    englishTagline: 'Learn Beyond Limits.',
  },

  // 證照智慧學習中心資料庫 (包含網頁設計丙級示範證照與 Coming Soon 證照)
  certifications: [
    {
      id: 'web-design-c',
      code: '17300',
      name: '網頁設計丙級技術士',
      englishName: 'Website Design – Level C',
      level: '國家丙級技術士',
      category: 'web',
      categoryName: '網頁技術',
      isComingSoon: false,
      isFeatured: true,
      badgeText: '正式示範中',
      shortDesc: '勞動部技術士技能檢定國家標準（職類代號 17300）。涵蓋 HTML5 語意架構、CSS3 樣式設計、多媒體排版整合及考場 5 大經典題組。',
      detailedDesc: '網頁設計丙級為台灣技職高中、大專資訊相關科系及跨領域自學者的核心國家技術士檢定。依勞動部 173003A17 官方規範，學科題庫約 611 題；依 173003B12 規範，術科正式評量共 5 大題組（校園社團介紹網、運動廣場連結網、國家公園介紹網、網路行銷購物網、書曼的旅遊相簿），平台提供逐步拆解與線上即時雙欄沙盒。',
      subjectsCount: 611,
      practicalsCount: 5,
      progress: 45,
      enrolledStudents: 12480,
      tags: ['HTML5', 'CSS3', '排版佈局', '響應式'],
      features: [
        '學科 611 題官方全真題庫（示範模組精選）',
        '術科 5 大題組版型 Step-by-Step 實作拆解',
        'AI 助教即時解答標籤閉合與語法問題',
        '線上即時雙欄代碼編輯器實時預覽'
      ],
      examInfo: {
        duration: '學科 60 分鐘 / 術科 120 分鐘',
        questionCount: '學科單選 80 題 / 術科 5 大題組抽測 1 題',
        passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
        organ: '勞動部勞動力發展署技能檢定中心'
      },
      detailLink: 'pages/certification-detail.html?id=web-design-c',
      mockExamLink: 'pages/mock-exam.html?id=web-design-c',
      practicalLink: 'pages/practical-learning.html?id=web-design-c'
    },
    {
      id: 'software-design-c',
      code: '11900',
      name: '軟體設計丙級技術士',
      englishName: 'Computer Software Design C-Class',
      level: '國家丙級技術士',
      category: 'software',
      categoryName: '軟體開發',
      isComingSoon: true,
      isFeatured: false,
      badgeText: 'COMING SOON',
      shortDesc: '勞動部職類代號 11900。評量 C / C++ 結構化程式設計基礎、陣列演算法、文字檔案處理與字串邏輯分析。',
      detailedDesc: '電腦軟體設計丙級檢定為資電類科升學、技優甄審與程式設計師奠定紮實底層邏輯的核心國家證照。評量 C / C++ 語言核心基礎、陣列排序、字串反轉、檔案 I/O 與邊界邏輯處理能力。目前處於題庫數位化與在線沙盒整合階段，線上練習與測驗即將開放。',
      tags: ['C / C++', '演算法', '陣列', '字串處理'],
      plannedFeatures: [
        '學科歷屆試題智能分類刷題與錯題本',
        'C / C++ 核心演算法線上解題與即時評測',
        '術科第一站與第二站完整程式驗證沙盒',
        '4 階 AI 邏輯思考鷹架助教（提點思維不直接給答案）'
      ],
      examInfo: {
        duration: '學科 60 分鐘 / 術科 150 分鐘',
        questionCount: '學科單選 80 題 / 術科 8 題組抽取評測',
        passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
        organ: '勞動部勞動力發展署技能檢定中心'
      },
      detailLink: 'pages/certification-detail.html?id=software-design-c'
    },
    {
      id: 'computer-software-app-c',
      code: '11800',
      name: '電腦軟體應用丙級技術士',
      englishName: 'Computer Software Application C-Class',
      level: '國家丙級技術士',
      category: 'application',
      categoryName: '數位應用',
      isComingSoon: true,
      isFeatured: false,
      badgeText: 'COMING SOON',
      shortDesc: '勞動部職類代號 11800。全民數位資訊能力指標，涵蓋 Word 文書排版、Excel 統計函數、Access 資料庫與檔案管理。',
      detailedDesc: '電腦軟體應用丙級為台灣最普及的國家技術士檢定之一，適合商管、設計、文法與資訊各領域學習者。評量辦公室自動化核心技能，包含複雜文件排版、樞紐統計與資料庫關聯查詢。目前線上題庫與操作指引籌備中。',
      tags: ['Word 排版', 'Excel 函數', 'Access 資料庫', '檔案管理'],
      plannedFeatures: [
        '學科全真題庫考點智能歸納練習',
        'Word 精確排版與頁面規範逐步引導',
        'Excel 核心統計函數與圖表產製解析',
        'Access 關聯式資料庫查詢建置防呆檢核'
      ],
      examInfo: {
        duration: '學科 60 分鐘 / 術科 120 分鐘',
        questionCount: '學科單選 80 題 / 術科 6 大題組抽 1 題',
        passingScore: '學科 60 分以上、術科 60 分以上（雙科皆及格）',
        organ: '勞動部勞動力發展署技能檢定中心'
      },
      detailLink: 'pages/certification-detail.html?id=computer-software-app-c'
    },
    {
      id: 'apcs-test',
      code: 'APCS',
      name: 'APCS 大學程式設計先修檢測',
      englishName: 'Advanced Placement Computer Science',
      level: '學術升學指標檢定',
      category: 'algorithm',
      categoryName: '演算法檢測',
      isComingSoon: true,
      isFeatured: false,
      badgeText: 'COMING SOON',
      shortDesc: '大學程式設計先修檢測，全台頂尖資訊資工學系重要選才指標。涵蓋觀念題（C/C++）與實作題（4 題演算難關）。',
      detailedDesc: 'APCS 為全台指標性大學資工與資訊相關校系申請入學參採的重要檢定。分為程式設計觀念題與程式設計實作題兩大項。本平台歷年官方試題數位化與測資驗證整合中。',
      tags: ['樹狀圖', '動態規劃', '圖論 BFS/DFS', '二分搜尋'],
      plannedFeatures: [
        '歷年官方觀念題逐題推理解析',
        '實作題時空複雜度嚴格評測沙盒',
        '4 階 AI 思考鷹架點亮思維',
        '個人落點分析與弱點演算法標籤'
      ],
      examInfo: {
        duration: '觀念題 90 分鐘 / 實作題 150 分鐘',
        questionCount: '觀念題單選 40 題 / 實作題 4 題',
        passingScore: '以級分制評量 (1~5 級分)',
        organ: '國立臺灣師範大學 APCS 檢測小組'
      },
      detailLink: 'pages/certification-detail.html?id=apcs-test'
    },
    {
      id: 'its-python',
      code: 'ITS-PY',
      name: 'ITS Python 國際資訊科技認證',
      englishName: 'Information Technology Specialist – Python',
      level: '國際權威認證',
      category: 'software',
      categoryName: '軟體開發',
      isComingSoon: true,
      isFeatured: false,
      badgeText: 'COMING SOON',
      shortDesc: 'Certiport 全球資訊科技專家認證。評量現代 Python 核心語法、資料結構、檔案讀寫與例外處理規範。',
      detailedDesc: 'ITS Python 國際認證為 Certiport 針對科技專業人士所設計之國際通行技術資格。目前官方考綱解析與中英雙語題型整合中。',
      tags: ['Python 3', '物件導向', '檔案 I/O', '例外捕捉'],
      plannedFeatures: [
        '中英雙語題目解析對照',
        '國際認證真題模擬沙盒',
        '4 階 AI 語法診斷與思路引導'
      ],
      examInfo: {
        duration: '測驗時限 50 分鐘',
        questionCount: '約 35 ~ 45 題 (單選、複選、拖曳排序)',
        passingScore: '700 分以上 (滿分 1000 分)',
        organ: 'Certiport (Pearson VUE)'
      },
      detailLink: 'pages/certification-detail.html?id=its-python'
    },
    {
      id: 'web-design-b',
      code: '17300-B',
      name: '網頁設計乙級技術士',
      englishName: 'Website Design – Level B',
      level: '國家乙級技術士',
      category: 'web',
      categoryName: '網頁技術',
      isComingSoon: true,
      isFeatured: false,
      badgeText: 'COMING SOON',
      shortDesc: '勞動部職類代號 17300 乙級高階技能檢定。涵蓋 PHP/MySQL 動態網頁開發、資料庫 CRUD 安全機制、Session 驗證。',
      detailedDesc: '網頁設計乙級為進階全端工程技術士檢定，側重後端動態腳本語言、資料庫正規化設計、跨站腳本 (XSS) 與 SQL 注入防護。目前考綱題組數位化中。',
      tags: ['PHP', 'MySQL', 'JavaScript', '安全性'],
      plannedFeatures: [
        '全功能後端資料庫整合題組',
        'SQL 注入防禦教學模組',
        'MVC 架構與 Session 安全控管'
      ],
      examInfo: {
        duration: '學科 100 分鐘 / 術科 240 分鐘',
        questionCount: '學科 80 題 / 術科綜合實作題組',
        passingScore: '學科 60 分以上、術科 60 分以上（雙科及格）',
        organ: '勞動部勞動力發展署技能檢定中心'
      },
      detailLink: 'pages/certification-detail.html?id=web-design-b'
    }
  ],

  // 4 階 AI 思考鷹架教學模擬資料
  scaffoldingSteps: [
    {
      level: 1,
      name: '階段一：觀念聚焦',
      tag: '概念引導',
      question: '我不知道該如何下手處理「陣列中尋找兩數之和等於目標值」？',
      reply: '別急著寫雙重迴圈！先思考：如果我們已經遍歷過數字 A，當前正在看數字 B，我們希望過去已經記錄過哪個數值？這與雜湊表（Hash Map）的 O(1) 查找特性有何關聯？',
      benefit: '幫助學生確認底層資料結構，而非直接貼答案。'
    },
    {
      level: 2,
      name: '階段二：思考破題',
      tag: '思路拆解',
      question: '了解雜湊表原理了，那我遍歷陣列時具體該怎麼記錄？',
      reply: '你可以維護一個字典 `seen = {}`。遍歷每個元素 `num` 時：先計算出它的互補值 `complement = target - num`。如果 `complement` 已經在 `seen` 裡，你就找到了答案！否則，將當前數字存入字典。',
      benefit: '引導學生自己寫出狀態轉移與條件判斷。'
    },
    {
      level: 3,
      name: '階段三：邊界提點',
      tag: '邊界檢查',
      question: '如果陣列裡有重複的數字，或者 target 是同一個數字的兩倍呢？',
      reply: '這正是最關鍵的邊界條件！注意：同一個元素不能使用兩次。所以「先查後存」的順序非常精妙——在當前索引還沒存進去之前查字典，天然避開了元素與自身配對的錯誤。',
      benefit: '培養自我審查代碼與測試極端案例的直覺。'
    },
    {
      level: 4,
      name: '階段四：完整解構',
      tag: '架構昇華',
      question: '這個解法就是最優解了嗎？還有沒有其他思考角度？',
      reply: '當前雜湊法時間為 O(N)、空間為 O(N)，已是未排序陣列的極限。但若題目規定「陣列已排序且額外空間 O(1)」，則應轉向雙指針法（Two Pointers）。學會根據限制條件切換策略，才是真正的掌握。',
      benefit: '拓展高階工程視野，理解架構取捨。'
    }
  ],

  // 全站統計數字示意
  stats: {
    questionCount: '3,800+',
    passRate: '94.2%',
    activeStudents: '28,000+',
    partnerSchools: '45 所高中職大專'
  }
};

