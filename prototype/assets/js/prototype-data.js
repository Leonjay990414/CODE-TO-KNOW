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

  // 證照智慧學習中心資料庫 (包含網頁設計丙級示範證照與其他檢定)
  certifications: [
    {
      id: 'web-design-c',
      code: '17300',
      name: '網頁設計丙級技術士',
      level: '國家丙級技術士',
      category: 'web',
      categoryName: '網頁技術',
      isFeatured: true,
      badgeText: '示範核心證照',
      shortDesc: '勞動部技術士技能檢定國家標準（職類代號 17300）。涵蓋 HTML5 語意架構、CSS3 樣式設計、多媒體排版整合及考場 4 大經典題組。',
      subjectsCount: 611,       // 依 173003A17 官方題庫總數約 611 題
      practicalsCount: 4,        // 依 173003B12 官方術科為 4 大題組
      progress: 45,             // 當前示範進度
      enrolledStudents: 12480,   // 示範數據
      tags: ['HTML5', 'CSS3', '排版佈局', '響應式'],
      features: [
        '學科 611 題官方全真題庫（示範模組精選）',
        '術科 4 大題組版型 Step-by-Step 實作拆解',
        'AI 助教即時解答標籤閉合與語法問題',
        '線上即時雙欄代碼編輯器實時預覽'
      ],
      detailLink: 'pages/certification-detail.html?id=web-design-c',
      mockExamLink: 'pages/mock-exam.html?id=web-design-c',
      practicalLink: 'pages/practical-learning.html?id=web-design-c'
    },
    {
      id: 'software-design-c',
      code: '11900',
      name: '軟體設計丙級技術士',
      level: '國家丙級技術士',
      category: 'software',
      categoryName: '軟體開發',
      isFeatured: true,
      badgeText: '高職技職首選',
      shortDesc: '程式設計入門最高公信力檢定。側重基本演算法、變數作用域、流程控制判斷式與資料結構基礎實作。',
      subjectsCount: 380,
      practicalsCount: 4,
      progress: 10,
      enrolledStudents: 8950,
      tags: ['C / C++', '演算法', '陣列', '字串處理'],
      features: [
        '學科必考題型分類精選',
        '常見邏輯盲點 AI 提示分析',
        '邊界案例自動檢測引擎'
      ],
      detailLink: 'pages/certification-detail.html?id=software-design-c',
      mockExamLink: 'pages/mock-exam.html?id=software-design-c',
      practicalLink: 'pages/practical-learning.html?id=software-design-c'
    },
    {
      id: 'computer-software-app-c',
      code: '11800',
      name: '電腦軟體應用丙級技術士',
      level: '國家丙級技術士',
      category: 'application',
      categoryName: '數位應用',
      isFeatured: false,
      badgeText: '熱門通用認證',
      shortDesc: '全民數位資訊技能指標檢定。涵蓋文書處理排版、資料庫軟體整合操作、試算表公式函式與檔案管理。',
      subjectsCount: 510,
      practicalsCount: 6,
      progress: 0,
      enrolledStudents: 15600,
      tags: ['Word 排版', 'Excel 函數', 'Access 資料庫', '檔案管理'],
      features: [
        '學科全自動高頻率模擬測驗',
        '各題組操作防呆核對清單'
      ],
      detailLink: 'pages/certification-detail.html?id=computer-software-app-c',
      mockExamLink: 'pages/mock-exam.html?id=computer-software-app-c',
      practicalLink: 'pages/practical-learning.html?id=computer-software-app-c'
    },
    {
      id: 'apcs-test',
      code: 'APCS',
      name: 'APCS 大學程式設計先修檢測',
      level: '學術升學指標檢定',
      category: 'algorithm',
      categoryName: '演算法檢測',
      isFeatured: true,
      badgeText: '資工名校審查必備',
      shortDesc: '大學程式設計先修檢測，全台頂尖資訊資工學系重要選才指標。涵蓋觀念題（C/C++）與實作題（4 題演算難關）。',
      subjectsCount: 200,
      practicalsCount: 40,
      progress: 25,
      enrolledStudents: 7420,
      tags: ['樹狀圖', '動態規劃', '圖論 BFS/DFS', '二分搜尋'],
      features: [
        '觀念題逐題推理解析',
        '實作題時空複雜度嚴格評測',
        '4 階 AI 思考鷹架點亮思維'
      ],
      detailLink: 'pages/certification-detail.html?id=apcs-test',
      mockExamLink: 'pages/mock-exam.html?id=apcs-test',
      practicalLink: 'pages/practical-learning.html?id=apcs-test'
    },
    {
      id: 'its-python',
      code: 'ITS-PY',
      name: 'ITS Python 國際資訊科技認證',
      level: '國際權威認證',
      category: 'software',
      categoryName: '軟體開發',
      isFeatured: false,
      badgeText: 'Certiport 國際考證',
      shortDesc: 'Certiport 全球資訊科技專家認證。評量現代 Python 核心語法、資料結構、檔案讀寫與例外處理規範。',
      subjectsCount: 160,
      practicalsCount: 12,
      progress: 0,
      enrolledStudents: 4310,
      tags: ['Python 3', '物件導向', '檔案 I/O', '例外捕捉'],
      features: [
        '中英雙語題目解析對照',
        '國際認證真題模擬沙盒'
      ],
      detailLink: 'pages/certification-detail.html?id=its-python',
      mockExamLink: 'pages/mock-exam.html?id=its-python',
      practicalLink: 'pages/practical-learning.html?id=its-python'
    },
    {
      id: 'web-design-b',
      code: '17300-B',
      name: '網頁設計乙級技術士',
      level: '國家乙級技術士',
      category: 'web',
      categoryName: '網頁技術',
      isFeatured: false,
      badgeText: '進階專業資格',
      shortDesc: '勞動部高階技能檢定。涵蓋 PHP/MySQL 動態網頁開發、資料庫 CRUD 安全機制、Session 驗證與進階 JavaScript。',
      subjectsCount: 350,
      practicalsCount: 4,
      progress: 0,
      enrolledStudents: 2190,
      tags: ['PHP', 'MySQL', 'JavaScript', '安全性'],
      features: [
        '全功能後端資料庫整合題組',
        'SQL 注入防禦教學模組'
      ],
      detailLink: 'pages/certification-detail.html?id=web-design-b',
      mockExamLink: 'pages/mock-exam.html?id=web-design-b',
      practicalLink: 'pages/practical-learning.html?id=web-design-b'
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

