/**
 * CODE TO KNOW (碼上學) - 五大術科題組 13 大標準教學模組權威資料庫
 * 
 * 嚴格遵循勞動部技能檢定中心 173003B12 試題規範、11 冊官方講義實質稽核與現代 W3C 標準。
 * 涵蓋題組 1 至題組 5（104301 ~ 104305），不包含非正式題組。
 * 
 * 知識出處標籤 (Provenance Tags):
 * [GOV-REQ]: 官方試題硬性規定
 * [PDF-SUM]: 講義步驟提煉
 * [VID-INS]: 已核實影音教學補充 (未核實標註待補)
 * [STD-DOC]: W3C / MDN 現代 Web 技術標準
 * [CTK-DES]: 碼上學原創教學設計與思維引導
 */

export type ProvenanceTag = 'GOV-REQ' | 'PDF-SUM' | 'VID-INS' | 'STD-DOC' | 'CTK-DES';

export interface StepCodeExplanation {
  lineOrPart: string;
  explanation: string;
}

export interface StepQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TeachingStepDetail {
  stepNumber: number;
  title: string;
  tag: ProvenanceTag;
  learningGoal: string;
  prerequisites: string;
  detailedProcess: string[];
  criticalSettings: string[];
  codeSnippet: string;
  codeLanguage: 'html' | 'css' | 'javascript';
  codeExplanation: StepCodeExplanation[];
  expectedResult: string;
  commonMistakes: string[];
  troubleshooting: string[];
  extendedKnowledge: string;
  checkQuiz: StepQuiz;
}

export interface TaskAssetItem {
  filename: string;
  category: 'image' | 'text' | 'audio' | 'script' | 'style';
  purpose: string;
  officialSource: string;
}

export interface TeachingModuleData {
  taskId: number;
  taskCode: string;
  title: string;
  theme: string;
  difficulty: '★☆☆' | '★★☆' | '★★★';
  estimatedMinutes: number;
  canvasSpec: {
    width: string;
    centering: string;
    header: string;
    menu: string;
    content: string;
    footer: string;
  };

  // 13 大教學模組
  module1_Introduction: {
    overview: string;
    examCode: string;
    requirements: string[];
  };
  module2_LearningGoals: string[];
  module3_SiteArchitecture: {
    description: string;
    fileTree: { path: string; purpose: string }[];
  };
  module4_Preparation: {
    tools: string[];
    directorySpec: string;
    assets: TaskAssetItem[];
  };
  module5_StepByStepGuide: TeachingStepDetail[];
  module6_HtmlDeepDive: {
    title: string;
    content: string;
    codeExamples: { title: string; code: string; explanation: string }[];
  };
  module7_CssDeepDive: {
    title: string;
    content: string;
    rules: { selector: string; properties: string; purpose: string }[];
  };
  module8_JsInteractive: {
    title: string;
    hasJs: boolean;
    description: string;
    codeSnippet?: string;
    eventHandlers?: { event: string; target: string; description: string }[];
  };
  module9_PdfGaps: {
    topic: string;
    whatPdfMissed: string;
    modernStandard: string;
  }[];
  module10_VideoInsights: {
    status: 'VERIFIED_INSIGHT' | 'PENDING_RESEARCH';
    tip: string;
    provenanceTag: 'VID-INS' | 'CTK-MEMO';
    context: string;
  }[];
  module11_TrapsAndTroubleshooting: {
    trapTitle: string;
    penalty: string;
    detection: string;
    fix: string;
  }[];
  module12_QuizzesAndChecklist: {
    checklist: string[];
    quizzes: {
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }[];
  };
  module13_FinalPreviewAndAudit: {
    previewUrlHint: string;
    completionChecklist: string[];
    passingScoreRule: string;
  };
}

// ============================================================================
// 題組一：校園社團介紹網 (104301)
// ============================================================================
export const TASK_1_MODULES: TeachingModuleData = {
  taskId: 1,
  taskCode: '17300-104301',
  title: '校園社團介紹網',
  theme: '頁框佈局結構、跑馬燈公告、選單超連結 target 連動與影像合成',
  difficulty: '★☆☆',
  estimatedMinutes: 90,
  canvasSpec: {
    width: '1024px',
    centering: '水平置中 (margin: 0 auto;)',
    header: '1000px × 65px（標誌 logo.png 與校園社團主標題）',
    menu: '寬度 215px（選單區 menu1/menu2 動態懸停）',
    content: '寬度 770px（網頁內容區，預設 main.html，連動社史、活動、教學）',
    footer: '1000px × 20px（網頁設計及維護：XX○○○）',
  },
  module1_Introduction: {
    overview: '本題評量應檢人建立國立科技高中「校園社團介紹網」之能力。整體版面需在 1024×768 解析度下水平居中呈現，包含頂部標題、跑馬燈、左側選單、右側內嵌內容區與底部版權宣告。核心考點在於 iframe 內嵌子頁面之超連結目標 (target) 精確連動，以及兩幅影像合成 (logo.png 與 0104.jpg)。',
    examCode: '17300-104301',
    requirements: [
      '[GOV-REQ] 網站主目錄必須命名為 webXX (XX 為工作崗位號碼)，所有素材圖檔置於 images/ 資料夾。',
      '[GOV-REQ] 首頁檔名必須為 index.html (或 index.htm)。',
      '[GOV-REQ] 全站版面寬度 1024px，在不同解析度螢幕下一律水平置中顯示。',
      '[GOV-REQ] 吉他社相關三個子頁面點擊後，必須在右側內容 iframe (name="myFrame") 中展開。',
      '[GOV-REQ] 子頁面中「回社團介紹首頁」必須在 _top 整頁開啟，不得造成頁面巢狀割裂。',
    ],
  },
  module2_LearningGoals: [
    '掌握 HTML5 語意化佈局結構 (<header>, <nav>, <main>, <aside>, <footer>)',
    '理解 CSS 盒模型、邊框尺寸與置中技巧 (margin: 0 auto)',
    '理解 iframe 框架原理與 <a> 標籤 target 屬性之連動機制',
    '學會避免考場大忌：巢狀頁框 (Iframe in Iframe) 導致的畫面割裂',
    '精確處理相對路徑 (./images/ 與 ../)',
  ],
  module3_SiteArchitecture: {
    description: '網站由 index.html 作為外層主框架，右側透過 <iframe> 載入預設的 main.html。左側選單點選吉他社子頁時，透過 target="myFrame" 將 guitar_history.html 等內容渲染於同一框架內。',
    fileTree: [
      { path: 'index.html', purpose: '網站主首頁框架 (包含 Header, Marquee, Menu, Iframe, Footer)' },
      { path: 'main.html', purpose: '預設內容頁 (包含校長合成照片 0104 與歡迎詞)' },
      { path: 'guitar_history.html', purpose: '吉他社社史 (包含社史介紹文字與導覽超連結)' },
      { path: 'guitar_event.html', purpose: '吉他社近期活動 (包含活動清單表格與 TOP 錨點)' },
      { path: 'guitar_learning.html', purpose: '吉他社教學內容 (吉他教學基礎介紹)' },
      { path: 'css/style.css', purpose: '全站共用樣式表 (重設、字體、色票與佈局規格)' },
      { path: 'images/', purpose: '圖片素材資料夾 (包含 logo.png, 0101~0104, menu 圖形等)' },
    ],
  },
  module4_Preparation: {
    tools: ['文字編輯器 (VS Code / Notepad++)', '網頁瀏覽器 (Chrome / Edge)', '影像處理軟體 (GIMP / PhotoCap / Photoshop)'],
    directorySpec: '於 C 槽根目錄建立 C:\\webXX (XX 為考場號)，並於其下建立 images 與 css 資料夾。',
    assets: [
      { filename: '0101.jpg', category: 'image', purpose: '社史背景與吉他圖檔', officialSource: '173003B13' },
      { filename: '0101.txt', category: 'text', purpose: '吉他社社史內文文字', officialSource: '173003B13' },
      { filename: '0102.jpg', category: 'image', purpose: '近期活動配圖', officialSource: '173003B13' },
      { filename: '0102.txt', category: 'text', purpose: '近期活動內文文字', officialSource: '173003B13' },
      { filename: '0103.jpg', category: 'image', purpose: '教學內容配圖', officialSource: '173003B13' },
      { filename: '0103.txt', category: 'text', purpose: '教學內容內文文字', officialSource: '173003B13' },
      { filename: 'logo1.png', category: 'image', purpose: '標誌合成素材一 (科技高中標誌)', officialSource: '173003B13' },
      { filename: 'logo2.png', category: 'image', purpose: '標誌合成素材二 (主文字)', officialSource: '173003B13' },
      { filename: 'logo3.jpg', category: 'image', purpose: '標誌合成素材三 (背景底圖)', officialSource: '173003B13' },
      { filename: 'menu1.png', category: 'image', purpose: '選單按鈕預設背景', officialSource: '173003B13' },
      { filename: 'menu2.png', category: 'image', purpose: '選單按鈕懸停效果 (Hover)', officialSource: '173003B13' },
    ],
  },
  module5_StepByStepGuide: [
    {
      stepNumber: 1,
      title: '環境建置與 webXX 目錄規範',
      tag: 'GOV-REQ',
      learningGoal: '正確建立考場規範之專案目錄結構，設定基礎通用樣式',
      prerequisites: '確認工作崗位座號 (例如第 05 號，則目錄為 web05)',
      detailedProcess: [
        '1. 在本機磁碟根目錄建立 webXX 資料夾 (例如 C:\\web05)。',
        '2. 在 webXX 下建立 images 資料夾與 css 資料夾。',
        '3. 將題組一提供之 11 個官方素材複製至 images/ 目錄。',
        '4. 在 css 資料夾建立 style.css，並在根目錄建立 index.html。',
      ],
      criticalSettings: ['主資料夾名稱必須全小寫 webXX', '圖片集中存放於 images/'],
      codeSnippet: `/* css/style.css 通用盒模型與基礎重設 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: "標楷體", "DFKai-SB", serif;
  background-color: #FFFFFF;
}`,
      codeLanguage: 'css',
      codeExplanation: [
        { lineOrPart: 'box-sizing: border-box;', explanation: '確保 padding 與 border 不會撐大元素實際寬度，防止 1024px 版面被擠破。' },
        { lineOrPart: 'font-family: "標楷體";', explanation: '官方試題強制規定中文本文一律為標楷體，設定於 body 可讓全站繼承。' },
      ],
      expectedResult: '檔案目錄結構清晰，建立完畢後瀏覽器打開空白 index.html 無 404 報錯。',
      commonMistakes: ['目錄名稱打成 WebXX 或漏掉 XX 崗位號', '圖片散落在根目錄未放入 images/'],
      troubleshooting: ['檢查檔案總管路徑，確認 index.html 與 images/ 在同一層級。'],
      extendedKnowledge: '在現代 Web 開發中，box-sizing: border-box 是所有 UI 框架 (如 Tailwind, Bootstrap) 的黃金基石。',
      checkQuiz: {
        question: '若應檢人座位號碼為 3 號，依官方規定網站主資料夾名稱應為何？',
        options: ['web3', 'web03', 'web_03', 'Web03'],
        correctIndex: 1,
        explanation: '官方規範崗位號碼若為個位數需補零，必須是兩位數字小寫 web03。',
      },
    },
    {
      stepNumber: 2,
      title: '首頁 1024×768 版面七大區塊佈局',
      tag: 'GOV-REQ',
      learningGoal: '實作全站置中容器與頂部標題、跑馬燈、選單與內容 iframe',
      prerequisites: '完成 step 1 建立之 index.html 與 style.css',
      detailedProcess: [
        '1. 在 index.html 中建立外層包裝器 .layout-container，寬度設定 1024px 並下 margin: 0 auto 水平置中。',
        '2. 規劃頂部標題區 (.header)，放入合成後的 994×60px logo.png。',
        '3. 規劃跑馬燈公告區 (.marquee-bar)，設定規定之文字。',
        '4. 規劃主體兩欄佈局 (.container)：左側 215px 選單區，右側 770px 內容展示區。',
        '5. 在右側內容區放置 <iframe name="myFrame" src="./main.html">。',
        '6. 規劃底部版權宣告區 (.footer)。',
      ],
      criticalSettings: ['容器寬度 1024px', 'margin: 0 auto 置中', 'iframe 的 name 屬性必須與選單 target 相符'],
      codeSnippet: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國立科技高中─校園社團介紹網</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
  <div class="layout-container">
    <header class="header">
      <a href="./"><img src="./images/logo.png" alt="國立科技高中校園社團介紹網" width="994" height="60"></a>
    </header>
    <div class="marquee-bar">
      <marquee>歡迎光臨校園社團介紹網，參觀後請支持社團活動並熱烈參與</marquee>
    </div>
    <div class="main-body">
      <aside class="sidebar">
        <div class="menu-title">社團介紹</div>
        <nav class="menu-list">
          <a href="./guitar_history.html" target="myFrame" class="menu-item">吉他社</a>
          <span class="menu-item disabled">熱舞社</span>
          <span class="menu-item disabled">棒球社</span>
          <span class="menu-item disabled">羽球社</span>
          <span class="menu-item disabled">足球社</span>
          <span class="menu-item disabled">童軍社</span>
        </nav>
        <div class="update-date">最近更新日期：2026/09/26</div>
      </aside>
      <main class="content-area">
        <iframe src="./main.html" name="myFrame" frameborder="0"></iframe>
      </main>
    </div>
    <footer class="footer">
      網頁設計及維護：00kmtiger
    </footer>
  </div>
</body>
</html>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'name="myFrame"', explanation: '此名稱是左側選單 a 標籤 target 導向的目標錨點。' },
        { lineOrPart: '<marquee>...', explanation: '官方題目指定跑馬燈文字，不得漏字、錯字，否則一字扣一分。' },
      ],
      expectedResult: '瀏覽器中呈現完整的水平置中版面，頂部有 LOGO，左邊是社團選單，右邊內嵌 main.html。',
      commonMistakes: ['iframe 漏寫 name 屬性，導致選單點擊後開新視窗跳走', '跑馬燈文字錯字或標點符號不符合要求'],
      troubleshooting: ['檢查 a 標籤的 target 是否完全等於 iframe 的 name="myFrame"（注意大小寫）。'],
      extendedKnowledge: '現代前端開發中 marquee 標籤雖已廢棄，但因檢定系統採 17300 規範，在檢定作答時仍依考題要求為準。',
      checkQuiz: {
        question: '左側選單的超連結要如何讓網頁在右側名為 myFrame 的 iframe 中展開？',
        options: ['target="_blank"', 'target="_self"', 'target="myFrame"', 'target="_top"'],
        correctIndex: 2,
        explanation: '超連結的 target 屬性填入 iframe 的 name 屬性值，瀏覽器即會把該頁面載入到指定的 iframe 中。',
      },
    },
    {
      stepNumber: 3,
      title: '主頁 main.html 與校長影像合成',
      tag: 'STD-DOC',
      learningGoal: '合成校長照片 0104.jpg 並在 main.html 中排版歡迎詞',
      prerequisites: '準備 0101.jpg, 0102.jpg, 0103.jpg 與 0101.txt',
      detailedProcess: [
        '1. 使用影像軟體將校長玉照去背合成，匯出為 250×250px 檔名 0104.png (或 0104.jpg)。',
        '2. 建立 main.html，將背景圖片設為 ./images/0101.jpg。',
        '3. 插入 0104.png 圖片，下方插入段落文字，文字設定為標楷體、粗體、24px、藍色 (#0000FF)、斜體。',
      ],
      criticalSettings: ['文字：標楷體、粗體、24px、藍色、斜體', '背景圖片：0101.jpg'],
      codeSnippet: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>首頁內容</title>
  <style>
    body {
      background-image: url('./images/0101.jpg');
      font-family: "標楷體", serif;
      text-align: center;
      padding: 20px 0;
    }
    .principal-photo {
      width: 250px;
      height: 250px;
    }
    .welcome-text {
      font-size: 24px;
      font-weight: bold;
      font-style: italic;
      color: #0000FF;
      line-height: 1.8;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <img src="./images/0104.png" alt="科技高中校長" class="principal-photo">
  <p class="welcome-text">
    嗨！歡迎加入國立科技高中。<br>
    參加社團不僅可以豐富自己的人生、寬闊自己的視野，<br>
    也能砥礪技能、磨練人際、培養第二專長。<br>
    選擇一項您喜歡的社團，積極的參與和投入，<br>
    您會獲得一陣陣的驚喜！
  </p>
</body>
</html>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'color: #0000FF;', explanation: '官方規定文字顏色為純藍色。' },
        { lineOrPart: 'font-style: italic;', explanation: '官方規定歡迎詞需為斜體。' },
      ],
      expectedResult: 'main.html 在右側 iframe 中展示時，校長玉照置中，下方有藍色斜體歡迎詞。',
      commonMistakes: ['顏色寫成 #000000 (黑色)', '漏掉了斜體 (italic) 或粗體 (bold)'],
      troubleshooting: ['在瀏覽器 DevTools 中檢查 .welcome-text 的計算樣式 (Computed Styles)。'],
      extendedKnowledge: '在 CSS 中，font 縮寫可以一次設定 style, weight, size, family，例如 font: italic bold 24px "標楷體"。',
      checkQuiz: {
        question: '試題中要求歡迎詞為藍色，下列哪一個十六進位色碼正確？',
        options: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
        correctIndex: 2,
        explanation: 'RGB 格式中前兩位紅、中間綠、後兩位藍，純藍為 #0000FF。',
      },
    },
    {
      stepNumber: 4,
      title: '吉他社子頁社史與回首頁 target="_top" 關鍵防護',
      tag: 'GOV-REQ',
      learningGoal: '製作吉他社子頁導覽並掌握避免巢狀頁框崩潰之 target="_top"',
      prerequisites: '完成 main.html',
      detailedProcess: [
        '1. 建立 guitar_history.html，頁首標題「吉他社社史」(18px、紅色)。',
        '2. 導覽列放置 3 個超連結：回社團首頁、近期活動、教學內容。',
        '3. 「回社團首頁」的 target 必須設為 _top！',
        '4. 「近期活動」與「教學內容」不設定 target 或設為 _self（在同一 iframe 切換）。',
        '5. 插入 0101.jpg 圖檔與 0101.txt 內文文字。',
      ],
      criticalSettings: ['回社團首頁 target="_top" 絕對不可漏寫！'],
      codeSnippet: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>吉他社社史</title>
  <style>
    body { background-image: url('./images/0101.jpg'); font-family: "標楷體"; }
    header { text-align: center; font-size: 18px; color: #FF0000; font-weight: bold; }
    nav { display: flex; justify-content: space-around; margin: 15px 0; }
    .content-box { color: #FF0000; font-size: 16px; line-height: 1.6; }
  </style>
</head>
<body>
  <header>吉他社社史</header>
  <nav>
    <!-- [CTK-DES] 核心關鍵點：回首頁切記使用 _top -->
    <a href="./index.html" target="_top">社團首頁</a>
    <a href="./guitar_event.html">近期活動</a>
    <a href="./guitar_learning.html">教學內容</a>
  </nav>
  <div class="content-box">
    <img src="./images/0101.jpg" alt="吉他社社史配圖" style="width:250px; float:left; margin-right:15px;">
    <p>本社成立於民國八十五年，由喜愛音樂的同學共同發起...</p>
  </div>
</body>
</html>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'target="_top"', explanation: '若未加 target="_top"，點擊「社團首頁」會在小小的右側 iframe 內再載入整個 index.html，形成套娃崩潰（Iframe in Iframe）。' },
      ],
      expectedResult: '點選「社團首頁」時，整個瀏覽器視窗還原回 index.html 首頁，毫無巢狀現象。',
      commonMistakes: ['回首頁未設 target="_top"，直接在 iframe 裡面出現整張首頁（嚴重扣分）'],
      troubleshooting: ['點擊「社團首頁」測試，觀察整個瀏覽器網址列與畫面是否乾淨回到最外層。'],
      extendedKnowledge: 'target 屬性常見值：_self (當前頁籤)、_blank (新分頁)、_parent (父框架)、_top (頂層全視窗)。',
      checkQuiz: {
        question: '若在 iframe 中的頁面點擊超連結，希望將整個瀏覽器視窗導向首頁，應使用哪一個 target 屬性值？',
        options: ['_self', '_blank', '_parent', '_top'],
        correctIndex: 3,
        explanation: '_top 會跳出所有巢狀框架，直接在最頂層視窗載入目標網頁。',
      },
    },
  ],
  module6_HtmlDeepDive: {
    title: 'HTML 結構深入解析：Iframe 框架通訊與語意標籤',
    content: '題組一雖依循丙級考綱採用了 iframe 技術，但我們需要理解 iframe 的本質是獨立的 HTML 瀏覽情境 (Browsing Context)。每一個 iframe 具有獨立的 window 與 document，因此其內部 CSS 與外層父頁面相互隔離。',
    codeExamples: [
      {
        title: '語意化佈局與框架定位',
        code: `<div class="layout-container">
  <header class="header">...</header>
  <div class="marquee-bar"><marquee>...</marquee></div>
  <div class="main-body">
    <aside class="sidebar">...</aside>
    <main class="content-area">
      <iframe src="./main.html" name="myFrame"></iframe>
    </main>
  </div>
  <footer class="footer">...</footer>
</div>`,
        explanation: '透過容器層級清晰劃分，左右兩欄寬度相加等於 1024px，不會產生任何浮動溢出。',
      },
    ],
  },
  module7_CssDeepDive: {
    title: 'CSS 盒模型與精確尺寸控制',
    content: '全站寬度 1024px，考場電腦螢幕多為 1920×1080。透過 margin: 0 auto 能確保在任何大螢幕下均能居中，而不會緊貼在左上角被扣分。',
    rules: [
      { selector: '.layout-container', properties: 'width: 1024px; margin: 0 auto;', purpose: '全站版面置中' },
      { selector: '.header', properties: 'width: 1000px; height: 65px; margin: 0 auto;', purpose: '標題區寬高固定' },
      { selector: '.sidebar', properties: 'width: 215px; float: left;', purpose: '左側選單欄' },
      { selector: '.content-area', properties: 'width: 770px; float: right;', purpose: '右側內容欄' },
    ],
  },
  module8_JsInteractive: {
    title: 'JavaScript 與動態互動',
    hasJs: false,
    description: '題組一依試題要求為純 HTML 與 CSS 靜態頁框連動，無需撰寫複雜 JS。但可使用原生 CSS :hover 實作選單按鈕的圖片切換效果 (menu1.png 切換為 menu2.png)。',
  },
  module9_PdfGaps: [
    {
      topic: 'PDF 講義未說明的現代 Web 原理',
      whatPdfMissed: '講義教導使用舊式 Dreamweaver 拖曳插入 iframe 與切圖，未說明 CSS box-sizing 的作用，學生容易因 border 增加 2px 而導致右側欄掉到下方。',
      modernStandard: '一律宣告 * { box-sizing: border-box; }，內距與邊框將內縮計算，避免版面破裂。',
    },
  ],
  module10_VideoInsights: [
    {
      status: 'VERIFIED_INSIGHT',
      tip: '一建目錄二切圖，三設框架四設鏈，回首頁切記 _top。',
      provenanceTag: 'CTK-MEMO',
      context: '專案研發之考場破關口訣，幫助考生在限時 90 分鐘內按部就班不出錯。',
    },
    {
      status: 'PENDING_RESEARCH',
      tip: 'YouTube 播放清單 #01~#05 逐幀時間戳記補充（待取得逐字稿後標定）。',
      provenanceTag: 'VID-INS',
      context: '影片研究待補。',
    },
  ],
  module11_TrapsAndTroubleshooting: [
    {
      trapTitle: '跑馬燈錯別字扣分地雷',
      penalty: '每一錯字或漏字扣 1 分，最多扣 10 分。',
      detection: '逐字核對「歡迎光臨校園社團介紹網，參觀後請支持社團活動並熱烈參與」。',
      fix: '可直接複製試題文字檔或反覆核對，標點符號亦不可缺少。',
    },
    {
      trapTitle: '吉他社子頁回首頁造成巢狀框架',
      penalty: '超連結連動異常，該項功能不予給分 (扣 10 分)。',
      detection: '在右側 iframe 內點擊「社團首頁」，觀察是否變成小框中套大框。',
      fix: '在超連結標籤上強制加入 target="_top"。',
    },
  ],
  module12_QuizzesAndChecklist: {
    checklist: [
      '[ ] 網站主目錄名稱為 webXX 且包含 images 與 css 資料夾',
      '[ ] 首頁檔名為 index.html',
      '[ ] 全站版面水平居中 (margin: 0 auto)',
      '[ ] 跑馬燈文字無錯漏字',
      '[ ] 左側選單各項目高度、間距整齊',
      '[ ] 點選吉他社子頁，右側 iframe 正確切換',
      '[ ] 吉他社各子頁點選「社團首頁」，整頁返回首頁 (無巢狀)',
      '[ ] 頁尾版權文字正確呈現「網頁設計及維護：XX○○○」',
    ],
    quizzes: [
      {
        question: '題組一首頁的預設內容頁 iframe 應該載入哪一個檔案？',
        options: ['index.html', 'main.html', 'guitar_history.html', 'content.html'],
        answerIndex: 1,
        explanation: '試題規定未點選任何社團時，右側內容區預設載入 main.html。',
      },
      {
        question: '下列哪種情況會導致吉他社子頁出現「巢狀割裂（iframe in iframe）」？',
        options: [
          '回首頁超連結設定了 target="_top"',
          '回首頁超連結未設定 target="_top" 或誤設為 target="_self"',
          'iframe 的 name 設定為 myFrame',
          '在 main.html 中設定了背景圖片',
        ],
        answerIndex: 1,
        explanation: '在 iframe 內部如果沒有指定 _top 跳出頂層，瀏覽器預設在當前框架 (_self) 載入 index.html，造成套娃崩潰。',
      },
    ],
  },
  module13_FinalPreviewAndAudit: {
    previewUrlHint: '可於碼上學雙欄沙盒中點選「index.html」預覽完整全站連動。',
    completionChecklist: [
      '所有 5 個 HTML 檔案 (index, main, guitar_history, guitar_event, guitar_learning) 均能正常存取。',
      '點擊吉他社三個子頁能順暢流動，回首頁能一鍵回到主版面。',
      'LOGO 與校長影像比例精準、無鋸齒、無失真。',
    ],
    passingScoreRule: '總分 100 分，60 分及格。依 68 項評分標準嚴格檢驗。',
  },
};

// ============================================================================
// 題組二：運動廣場連結網 (104302)
// ============================================================================
export const TASK_2_MODULES: TeachingModuleData = {
  taskId: 2,
  taskCode: '17300-104302',
  title: '運動廣場連結網',
  theme: '尺寸色彩分割、文字陰影特效、縮圖點擊即時切換大圖、表單互斥群組',
  difficulty: '★★☆',
  estimatedMinutes: 90,
  canvasSpec: {
    width: '1024px',
    centering: '水平置中 (margin: 0 auto; 背景 #FFFFFF，外圍 #666666)',
    header: '1024px × 120px（運動廣場連結網標題，文字陰影 10px 10px 15px #333333）',
    menu: '寬度 200px（最新消息與動態運動展示項目）',
    content: '寬度 824px（點擊縮圖即時切換大圖互動區）',
    footer: '1024px × 30px（網頁設計及維護：XX○○○）',
  },
  module1_Introduction: {
    overview: '本題評量「運動廣場連結網」之建立。版面主體 1024×768px 置中，外圍背景為灰色 (#666666)，內容背景為白色 (#FFFFFF)。核心技術點包含：CSS text-shadow 文字陰影精確數值計算、大圖縮圖點擊即時更換展示 (原生 JS 或 jQuery)、以及訪客留言板中 Radio 互斥選項控制。',
    examCode: '17300-104302',
    requirements: [
      '[GOV-REQ] 標題文字「運動廣場連結網」必須加上文字陰影：水平偏移 10px、垂直偏移 10px、模糊 15px、陰影顏色 #333333。',
      '[GOV-REQ] 棒球、籃球、游泳等項目具有大圖與縮圖，點擊縮圖時上方大圖必須立即更新為對應運動大圖。',
      '[GOV-REQ] 訪客留言板之性別單選按鈕必須互斥（男與女不能同時被選中）。',
      '[GOV-REQ] 具有重設按鈕與送出按鈕，重設能完全清空輸入欄位。',
    ],
  },
  module2_LearningGoals: [
    '熟練 CSS text-shadow 語法與跨瀏覽器渲染機制',
    '掌握 JavaScript DOM 元素操控 (document.getElementById / src 屬性替換)',
    '理解 HTML 表單控制項之 name 屬性與 radio 互斥邏輯',
    '掌握無縫佈局與內外背景色差視覺營造',
  ],
  module3_SiteArchitecture: {
    description: '以 index.html 為主入口，點擊運動分類時載入對應運動介紹頁面，頁面中包含縮圖列與動態大圖容器。',
    fileTree: [
      { path: 'index.html', purpose: '首頁主版面 (包含陰影標題、導覽與內容區)' },
      { path: 'results/main.html', purpose: '預設首頁內容區 (運動廣場總覽簡介)' },
      { path: 'results/baseball.html', purpose: '棒球介紹子頁 (縮圖切換大圖)' },
      { path: 'results/basketball.html', purpose: '籃球介紹子頁 (縮圖切換大圖)' },
      { path: 'results/swimming.html', purpose: '游泳介紹子頁 (縮圖切換大圖)' },
      { path: 'results/msgboard.html', purpose: '訪客留言板表單' },
      { path: 'images/', purpose: '圖片庫 (包含 0201~0207 大小圖、logo 等 21 個素材)' },
    ],
  },
  module4_Preparation: {
    tools: ['文字編輯器', '瀏覽器', '影像工具'],
    directorySpec: '建立 C:\\webXX，包含 images, results 等子目錄。',
    assets: [
      { filename: '0201.png', category: 'image', purpose: '大圖展示素材 1', officialSource: '173003B13' },
      { filename: '0202A.png', category: 'image', purpose: '棒球縮圖 A', officialSource: '173003B13' },
      { filename: '0202B.png', category: 'image', purpose: '棒球大圖 B', officialSource: '173003B13' },
      { filename: '0206.txt', category: 'text', purpose: '留言板預設引導文字', officialSource: '173003B13' },
    ],
  },
  module5_StepByStepGuide: [
    {
      stepNumber: 1,
      title: '橫幅文字陰影 text-shadow 精確樣式',
      tag: 'GOV-REQ',
      learningGoal: '實作官方規範之 10px 10px 15px #333333 文字陰影',
      prerequisites: '首頁頂部標題區 HTML 標籤就緒',
      detailedProcess: [
        '1. 在 header 建立 h1 標籤包含文字「運動廣場連結網」。',
        '2. CSS 設定字型標楷體、大小 52px、文字顏色純白 #FFFFFF。',
        '3. 套用 text-shadow: 10px 10px 15px #333333。',
      ],
      criticalSettings: ['text-shadow: 10px 10px 15px #333333'],
      codeSnippet: `.banner-title {
  font-family: "標楷體", serif;
  font-size: 52px;
  color: #FFFFFF;
  text-align: center;
  /* 官方規範：X軸偏移 10px、Y軸偏移 10px、模糊半徑 15px、陰影顏色 #333333 */
  text-shadow: 10px 10px 15px #333333;
}`,
      codeLanguage: 'css',
      codeExplanation: [
        { lineOrPart: '10px 10px', explanation: '分別代表陰影向右偏移 10px、向下偏移 10px。' },
        { lineOrPart: '15px #333333', explanation: '15px 為羽化模糊度，#333333 為深灰色陰影。' },
      ],
      expectedResult: '白色標題文字後方出現柔和立體的深灰陰影，層次鮮明。',
      commonMistakes: ['參數順序錯置導致陰影不顯示', '陰影顏色漏打井字號 #'],
      troubleshooting: ['在瀏覽器 DevTools 中檢視 text-shadow 是否有被刪除線劃掉。'],
      extendedKnowledge: 'text-shadow 可支援多重陰影堆疊（以逗點分隔），用以製作發光霓虹燈效果。',
      checkQuiz: {
        question: 'CSS 屬性 text-shadow: 10px 10px 15px #333333 中，15px 代表什麼？',
        options: ['水平偏移', '垂直偏移', '模糊半徑 (Blur Radius)', '擴散半徑'],
        correctIndex: 2,
        explanation: 'text-shadow 的第三個長度參數為模糊半徑 (Blur Radius)。',
      },
    },
    {
      stepNumber: 2,
      title: '縮圖點擊即時更換大圖 DOM 互動',
      tag: 'STD-DOC',
      learningGoal: '使用原生 JavaScript 實作點擊縮圖切換大圖之流暢互動',
      prerequisites: '大圖 <img> 與多張縮圖 <img> 標籤建立完成',
      detailedProcess: [
        '1. 大圖標籤給予 id="largeImage"，初始 src 設為預設大圖路徑。',
        '2. 每一張縮圖加上 onclick 呼叫切換函數 switchPhoto(this.src)。',
        '3. 函數內部獲取大圖元素，動態改變其 src 屬性。',
      ],
      criticalSettings: ['id="largeImage"', 'onclick 事件綁定'],
      codeSnippet: `<!-- HTML 結構 -->
<div class="gallery-container">
  <div class="large-view">
    <img id="largeImage" src="../images/0202B.png" alt="運動大圖展示">
  </div>
  <div class="thumb-list">
    <img src="../images/0202A.png" alt="棒球縮圖" onclick="changeImage('../images/0202B.png')">
    <img src="../images/0203A.png" alt="籃球縮圖" onclick="changeImage('../images/0203B.png')">
  </div>
</div>

<script>
function changeImage(targetSrc) {
  var target = document.getElementById('largeImage');
  if (target) {
    target.src = targetSrc;
  }
}
</script>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'document.getElementById("largeImage").src = targetSrc', explanation: '直接操作 DOM 節點的 src 屬性，觸發瀏覽器立即重新繪製對應圖片。' },
      ],
      expectedResult: '滑鼠點擊任意縮圖時，上方展示區毫無延遲切換至該項目大圖。',
      commonMistakes: ['大小圖檔名弄反（大圖誤放到縮圖）', '路徑相對位置錯誤導致圖片破損'],
      troubleshooting: ['打開 F12 Console 查看是否有 Uncaught TypeError: Cannot set property src of null。'],
      extendedKnowledge: '在 React 中此模式對應 useState(activeImageUrl)，透過狀態驅動視圖渲染。',
      checkQuiz: {
        question: '在 JavaScript 中，若要動態替換 <img> 標籤顯示的圖片，應修改其哪一個屬性？',
        options: ['href', 'src', 'alt', 'data-url'],
        correctIndex: 1,
        explanation: 'img 標籤的影像位址存於 src (source) 屬性中。',
      },
    },
    {
      stepNumber: 3,
      title: '訪客留言板表單與單選按鈕互斥設計',
      tag: 'GOV-REQ',
      learningGoal: '掌握表單元素設計，並確保性別 radio 按鈕達成嚴格互斥',
      prerequisites: '建立 results/msgboard.html',
      detailedProcess: [
        '1. 建立 <form> 表單，包含姓名輸入框、性別單選鈕、留言內容 textarea。',
        '2. 「男」與「女」的 <input type="radio"> 必須指定完全相同的 name="gender"。',
        '3. 放置一個 <input type="reset" value="重新填寫"> 與一個送出按鈕。',
      ],
      criticalSettings: ['兩個 radio 的 name 屬性完全一致為 name="gender"'],
      codeSnippet: `<form class="guestbook-form">
  <div class="form-row">
    <label for="username">姓名：</label>
    <input type="text" id="username" name="username" required>
  </div>
  <div class="form-row">
    <label>性別：</label>
    <label><input type="radio" name="gender" value="male" checked> 男</label>
    <label><input type="radio" name="gender" value="female"> 女</label>
  </div>
  <div class="form-row">
    <label for="message">留言內容：</label>
    <textarea id="message" name="message" rows="5" cols="40"></textarea>
  </div>
  <div class="btn-group">
    <input type="submit" value="送出留言">
    <input type="reset" value="重新輸入">
  </div>
</form>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'name="gender"', explanation: '瀏覽器將相同 name 的 radio 視為同一互斥群組，點擊其一會自動取消另一個。' },
        { lineOrPart: 'type="reset"', explanation: '原生 HTML 重設按鈕，可一鍵將表單所有欄位還原至載入初始值。' },
      ],
      expectedResult: '點擊「女」時「男」自動取消，點擊「重新輸入」時表單欄位立刻清空重設。',
      commonMistakes: ['兩個 radio 的 name 取不同名字（如 gender1, gender2），造成男女能同時被選中（重大扣分）'],
      troubleshooting: ['手動交替點選男女選項，確認是否隨時只有一個處於選中狀態。'],
      extendedKnowledge: '在無障礙規範 (WCAG) 中，相關表單群組應使用 <fieldset> 與 <legend> 進行語意包裹。',
      checkQuiz: {
        question: 'HTML 中如何讓多個 Radio 單選按鈕達到「互斥（只能選一項）」的效果？',
        options: ['賦予相同的 id', '賦予相同的 name 屬性', '賦予相同的 class', '放在同一個 div 內'],
        correctIndex: 1,
        explanation: '瀏覽器依據相同的 name 屬性判定單選按鈕群組並實現互斥行為。',
      },
    },
  ],
  module6_HtmlDeepDive: {
    title: 'HTML 表單控制項與語意化結構',
    content: '表單是網頁與使用者互動最頻繁的區域。在題組二中，考官評分重點在於單選按鈕互斥、文字框尺寸、以及重設按鈕是否具備原生清空能力。',
    codeExamples: [
      {
        title: '標準互斥表單實作',
        code: `<input type="radio" name="gender" value="M"> 男
<input type="radio" name="gender" value="F"> 女`,
        explanation: '只要 name 一致，瀏覽器底層即自動維護單選邏輯。',
      },
    ],
  },
  module7_CssDeepDive: {
    title: 'CSS 文字陰影與多層級色彩架構',
    content: '題組二外圍背景為 #666666，內容寬度 1024px 背景為純白 #FFFFFF，這種對比設計讓網頁在不同螢幕居中時格外突出。',
    rules: [
      { selector: 'body', properties: 'background-color: #666666;', purpose: '全站外圍灰色背景' },
      { selector: '.main-wrapper', properties: 'width: 1024px; background-color: #FFFFFF; margin: 0 auto;', purpose: '居中白色內容主體' },
      { selector: '.title-shadow', properties: 'text-shadow: 10px 10px 15px #333333;', purpose: '官方規定陰影' },
    ],
  },
  module8_JsInteractive: {
    title: 'JavaScript 縮圖切換與事件監聽',
    hasJs: true,
    description: '點擊縮圖即時更換大圖展示，可以原生 JS 或 jQuery 實作。',
    codeSnippet: `function showPhoto(imgUrl) {
  document.getElementById('mainPhoto').src = imgUrl;
}`,
    eventHandlers: [
      { event: 'onclick', target: '.thumb-img', description: '將目標大圖路徑傳入更換函數' },
    ],
  },
  module9_PdfGaps: [
    {
      topic: 'PDF 講義未說明的 Radio 群組原理',
      whatPdfMissed: '講義直接讓學生輸入表格，但未解釋 name 屬性對於表單鍵值對 (Key-Value) 提交與互斥的作用，學生若改動 name 即會造成評分失敗。',
      modernStandard: '清楚理解表單序列化 (Form Serialization) 時 name 即為參數名稱，radio 群組共享同一參數名稱。',
    },
  ],
  module10_VideoInsights: [
    {
      status: 'VERIFIED_INSIGHT',
      tip: '內白外灰置中擺，文字陰影十與十五，單選同名方互斥。',
      provenanceTag: 'CTK-MEMO',
      context: '專案研發之題組二核心記憶口訣。',
    },
    {
      status: 'PENDING_RESEARCH',
      tip: 'YouTube 播放清單 #06~#11 逐幀時間戳記補充（待取得逐字稿後標定）。',
      provenanceTag: 'VID-INS',
      context: '影片研究待補。',
    },
  ],
  module11_TrapsAndTroubleshooting: [
    {
      trapTitle: '單選按鈕未互斥',
      penalty: '表單控制項功能不全，該項不予計分。',
      detection: '同時點擊「男」與「女」，觀察兩顆圓點是否同時亮起。',
      fix: '將兩者的 name 屬性修改為完全相同的值。',
    },
  ],
  module12_QuizzesAndChecklist: {
    checklist: [
      '[ ] 外圍背景為灰色 #666666，內容為白色 #FFFFFF 且置中',
      '[ ] 標題文字陰影 text-shadow 精確符合 10px 10px 15px #333333',
      '[ ] 運動子頁縮圖點擊能即時變更大圖',
      '[ ] 訪客留言板性別單選按鈕完全互斥',
      '[ ] 重設按鈕能正常還原表單',
    ],
    quizzes: [
      {
        question: '題組二中，大圖與縮圖切換的技術主要是修改哪一個 DOM 屬性？',
        options: ['src', 'href', 'title', 'class'],
        answerIndex: 0,
        explanation: '圖片的顯示內容直接由 src 屬性決定。',
      },
    ],
  },
  module13_FinalPreviewAndAudit: {
    previewUrlHint: '可在沙盒中開啟 index.html 查看陰影與子頁切換效果。',
    completionChecklist: ['文字陰影清晰可見', '所有縮圖切換運作正常', '留言板互斥與重設正常'],
    passingScoreRule: '滿分 100 分，60 分及格。',
  },
};

// ============================================================================
// 題組三：國家公園介紹網 (104303)
// ============================================================================
export const TASK_3_MODULES: TeachingModuleData = {
  taskId: 3,
  taskCode: '17300-104303',
  title: '國家公園介紹網',
  theme: '定時輪播動畫、影像地圖熱區標定、檔案下載超連結與音訊關聯',
  difficulty: '★★★',
  estimatedMinutes: 90,
  canvasSpec: {
    width: '1024px',
    centering: '水平置中 (margin: 0 auto; 背景 #00FFFF，主色調清新水綠)',
    header: '1024px × 100px（1 秒切換四張圖之標題輪播動畫）',
    menu: '寬度 200px（陽明山、雪霸等國家公園選單）',
    content: '寬度 824px（台灣地圖熱區標定與各國家公園風景）',
    footer: '1024px × 20px（網頁設計及維護：XX○○○）',
  },
  module1_Introduction: {
    overview: '本題評量應檢人建立「國家公園介紹網」之能力。亮點包含：頂部標題需實作 1 秒自動循環輪播之多圖動畫 (park0301~park0304)；台灣國家公園分布地圖需使用 <map> 與 <area> 精確標定陽明山 (矩形 rect) 與雪霸 (多邊形 poly) 影像熱區；以及檔案下載超連結與音訊檔案整合。',
    examCode: '17300-104303',
    requirements: [
      '[GOV-REQ] 標題動畫必須以 1 秒間隔定時切換圖片，無縫循環播放且無毛邊白邊。',
      '[GOV-REQ] 影像地圖中，陽明山熱區必須為矩形 (shape="rect")，雪霸必須為多邊形 (shape="poly")。',
      '[GOV-REQ] 點擊地圖熱區必須在內容區載入對應之國家公園子頁面。',
      '[GOV-REQ] 提供公園導覽或音訊之下載超連結功能。',
    ],
  },
  module2_LearningGoals: [
    '掌握 JavaScript setInterval 或 CSS Keyframes 製作無縫定時輪播動畫',
    '熟練 HTML <map> 與 <area> 矩形與多邊形座標標定技術',
    '掌握 HTML5 下載屬性 (<a href="..." download>) 與相對檔案傳輸',
    '理解影像熱區 coords 參數計算方式 (X1,Y1, X2,Y2 與頂點集合)',
  ],
  module3_SiteArchitecture: {
    description: '首頁展示定時標題與國家公園地圖，點擊地圖熱區或選單均能切換至陽明山與雪霸子頁。',
    fileTree: [
      { path: 'index.html', purpose: '首頁入口 (輪播動畫、地圖熱區、導覽欄)' },
      { path: 'others/main.html', purpose: '預設首頁內容 (地圖導覽)' },
      { path: 'park/yangmingshan.html', purpose: '陽明山國家公園子頁' },
      { path: 'park/sheipa.html', purpose: '雪霸國家公園子頁' },
      { path: 'images/', purpose: '圖片素材庫 (national_park.jpg, park0301~park0314)' },
    ],
  },
  module4_Preparation: {
    tools: ['文字編輯器', '瀏覽器', '影像工具'],
    directorySpec: '建立 C:\\webXX，包含 images, others, park 目錄。',
    assets: [
      { filename: 'national_park.jpg', category: 'image', purpose: '台灣國家公園全島地圖', officialSource: '173003B13' },
      { filename: 'park0301.jpg', category: 'image', purpose: '標題輪播圖一', officialSource: '173003B13' },
      { filename: 'park0302.jpg', category: 'image', purpose: '標題輪播圖二', officialSource: '173003B13' },
      { filename: 'park.mp3', category: 'audio', purpose: '國家公園背景導覽音樂', officialSource: '173003B13' },
    ],
  },
  module5_StepByStepGuide: [
    {
      stepNumber: 1,
      title: '標題區 1 秒定時輪播動畫製作',
      tag: 'STD-DOC',
      learningGoal: '使用原生 JavaScript setInterval 實作 1 秒精確自動輪換',
      prerequisites: '準備 park0301~park0304 四張尺寸相符圖檔',
      detailedProcess: [
        '1. 在 header 放置 <img> 標籤作為輪播容器，給予 id="bannerAnim"。',
        '2. 宣告圖片清單陣列，存放 4 張圖片路徑。',
        '3. 使用 setInterval 每 1000 毫秒切換計數器並更新 src。',
      ],
      criticalSettings: ['間隔時間 1000ms (1 秒)', '循環切換 (index % length)'],
      codeSnippet: `<div class="header-banner">
  <img id="bannerAnim" src="images/park0301.jpg" alt="國家公園標題動畫" width="1024" height="100">
</div>

<script>
(function() {
  var images = [
    'images/park0301.jpg',
    'images/park0302.jpg',
    'images/park0303.jpg',
    'images/park0304.jpg'
  ];
  var currentIndex = 0;
  var bannerImg = document.getElementById('bannerAnim');
  
  setInterval(function() {
    currentIndex = (currentIndex + 1) % images.length;
    bannerImg.src = images[currentIndex];
  }, 1000); // 嚴格每 1 秒切換一次
})();
</script>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'setInterval(..., 1000)', explanation: '每隔 1000 毫秒執行一次回呼函式，完全符合 1 秒切換規定。' },
        { lineOrPart: '(currentIndex + 1) % images.length', explanation: '利用取餘數運算達成 0->1->2->3->0 的無限循環。' },
      ],
      expectedResult: '頂部橫幅每隔 1 秒平滑切換一張國家公園風景，不會閃爍跳動。',
      commonMistakes: ['秒數設定錯誤（如設為 3 秒）', '輪播到最後一張停止未循環'],
      troubleshooting: ['在 Console 查看有無變數未定義或圖片路徑錯誤。'],
      extendedKnowledge: '亦可使用純 CSS @keyframes 與 animation 製作輪播，但 JS 方案在精確時間控制上更具確定性。',
      checkQuiz: {
        question: '試題要求標題圖片每隔 1 秒切換一次，setInterval 應填入的毫秒數為多少？',
        options: ['10', '100', '1000', '10000'],
        correctIndex: 2,
        explanation: '1 秒等於 1000 毫秒。',
      },
    },
    {
      stepNumber: 2,
      title: '影像地圖矩形與多邊形熱區座標標定',
      tag: 'GOV-REQ',
      learningGoal: '精確建立 <map> 與 <area> 之 rect 與 poly 熱區',
      prerequisites: '地圖圖片 national_park.jpg 載入完成',
      detailedProcess: [
        '1. <img> 標籤加上 usemap="#parkMap"（必須有井字號）。',
        '2. 建立 <map name="parkMap">。',
        '3. 陽明山使用 shape="rect" coords="左上X,左上Y,右下X,右下Y"。',
        '4. 雪霸使用 shape="poly" coords="X1,Y1, X2,Y2, X3,Y3, ..." 依序標定多邊形頂點。',
      ],
      criticalSettings: ['<img> usemap="#parkMap"', '<map name="parkMap">', '陽明山 rect，雪霸 poly'],
      codeSnippet: `<!-- 國家公園導覽地圖熱區 -->
<img src="images/national_park.jpg" usemap="#parkMap" alt="台灣國家公園地圖" width="800">
<map name="parkMap">
  <!-- 陽明山：矩形 (rect) -->
  <area shape="rect" coords="220,40,340,90" href="park/yangmingshan.html" target="myFrame" alt="陽明山國家公園">
  <!-- 雪霸：多邊形 (poly) -->
  <area shape="poly" coords="205,115,235,100,260,120,245,150,195,140" href="park/sheipa.html" target="myFrame" alt="雪霸國家公園">
</map>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'usemap="#parkMap"', explanation: '將 img 與指定名稱的 map 熱區關聯綁定。' },
        { lineOrPart: 'shape="poly"', explanation: '多邊形熱區，由多個 X,Y 頂點座標依序連接成封閉區間。' },
      ],
      expectedResult: '滑鼠懸停於地圖陽明山或雪霸位置時，游標自動變為手指 (pointer)，點擊即切換子頁。',
      commonMistakes: ['usemap 漏掉井字號 #', '多邊形座標數量不是偶數導致無法解析'],
      troubleshooting: ['檢查 map 的 name 與 img 的 usemap 是否完全相符。'],
      extendedKnowledge: '現代 Web 可使用 SVG `<polygon>` 取得更具響應式縮放能力的互動向量熱區。',
      checkQuiz: {
        question: 'HTML <area> 標籤中，代表多邊形熱區的 shape 屬性值為何？',
        options: ['circle', 'polygon', 'poly', 'multi'],
        correctIndex: 2,
        explanation: 'HTML 規範規定多邊形熱區簡寫為 poly。',
      },
    },
  ],
  module6_HtmlDeepDive: {
    title: 'HTML 影像地圖技術原理解析',
    content: '影像地圖 (Client-side Image Map) 允許在同一張點陣圖上設定多個獨立超連結。需注意 map 的 name 與 img 的 usemap 透過識別碼關聯。',
    codeExamples: [
      {
        title: '標準影像熱區結構',
        code: `<img src="map.jpg" usemap="#myMap"><map name="myMap"><area shape="rect" coords="0,0,50,50" href="page.html"></map>`,
        explanation: '座標以圖片左上角為 (0,0) 原點。',
      },
    ],
  },
  module7_CssDeepDive: {
    title: 'CSS 濾鏡上色效果與水藍色基調',
    content: '題組三背景色為水藍色 (#00FFFF)，配合國家公園大自然的主題清新氛圍。',
    rules: [
      { selector: 'body', properties: 'background-color: #00FFFF;', purpose: '全站背景水藍色' },
      { selector: '.menu-item:hover', properties: 'filter: brightness(1.2);', purpose: '選單懸停上色效果' },
    ],
  },
  module8_JsInteractive: {
    title: '定時器與音訊播放控制',
    hasJs: true,
    description: '使用 setInterval 進行每秒標題圖片切換。',
    codeSnippet: `setInterval(nextSlide, 1000);`,
  },
  module9_PdfGaps: [
    {
      topic: 'PDF 講義未說明的熱區座標測量方式',
      whatPdfMissed: '講義直接給出座標數字，學生不知座標從何而來，一旦素材更換無法自行測量。',
      modernStandard: '說明可在小畫家或 GIMP 中開啟圖片，查看左下角或狀態列的滑鼠像素座標。',
    },
  ],
  module10_VideoInsights: [
    {
      status: 'VERIFIED_INSIGHT',
      tip: '一秒四圖定時轉，多邊影像貼黃邊，下載不要加引號。',
      provenanceTag: 'CTK-MEMO',
      context: '專案研發之題組三核心記憶口訣。',
    },
    {
      status: 'PENDING_RESEARCH',
      tip: 'YouTube 播放清單 #12~#13 逐幀時間戳記補充（待取得逐字稿後標定）。',
      provenanceTag: 'VID-INS',
      context: '影片研究待補。',
    },
  ],
  module11_TrapsAndTroubleshooting: [
    {
      trapTitle: '影像熱區點擊無效',
      penalty: '超連結功能失敗，該項不予計分。',
      detection: '游標在地圖上未出現手指圖示。',
      fix: '檢查 <img> usemap 是否包含「#」符號。',
    },
  ],
  module12_QuizzesAndChecklist: {
    checklist: [
      '[ ] 標題動畫以 1 秒間隔平順切換',
      '[ ] 地圖熱區陽明山 (rect) 與雪霸 (poly) 位置準確',
      '[ ] 點選熱區正確載入陽明山與雪霸子頁',
      '[ ] 檔案下載連結能正確觸發下載',
    ],
    quizzes: [
      {
        question: '在 <img> 的 usemap 屬性中，下列哪一個語法正確連結到名為 parkMap 的地圖？',
        options: ['usemap="parkMap"', 'usemap="#parkMap"', 'usemap=".parkMap"', 'usemap="@parkMap"'],
        answerIndex: 1,
        explanation: 'usemap 屬性必須以「#」開頭指向對應 map 的 name。',
      },
    ],
  },
  module13_FinalPreviewAndAudit: {
    previewUrlHint: '於沙盒開啟 index.html 觀察每秒輪播與地圖點擊。',
    completionChecklist: ['標題輪播不停滯', '地圖熱區可點擊', '子頁面載入正確'],
    passingScoreRule: '滿分 100 分，60 分及格。',
  },
};

// ============================================================================
// 題組四：網路行銷購物網 (104304)
// ============================================================================
export const TASK_4_MODULES: TeachingModuleData = {
  taskId: 4,
  taskCode: '17300-104304',
  title: '網路行銷購物網',
  theme: '3×3 商品展示網格、新視窗安全屬性、購物表單狀態核對對話框',
  difficulty: '★★☆',
  estimatedMinutes: 90,
  canvasSpec: {
    width: '1024px',
    centering: '水平置中 (margin: 0 auto; 背景圖片無縫平鋪)',
    header: '1024px × 150px（網路行銷購物網標題橫幅）',
    menu: '寬度 200px（皮包區、短夾區、流行精品清單）',
    content: '寬度 824px（3×3 商品展示表格、訂購狀態核對）',
    footer: '1024px × 30px（網頁設計及維護：XX○○○）',
  },
  module1_Introduction: {
    overview: '本題評量電子商務「網路行銷購物網」前端實作。核心考點包含：以 3×3 網格展示商品清單 (列高 150px、標題 200px、內容 300px)；點選商品圖片以新視窗開啟 (target="_blank")；以及表單勾選購買意向後，以 JavaScript alert() 彈出符合規定的確認文字對話框。',
    examCode: '17300-104304',
    requirements: [
      '[GOV-REQ] 3×3 表格規格必須精確相符，每列高度 150px。',
      '[GOV-REQ] 商品細節點擊需在新視窗 (target="_blank") 開啟。',
      '[GOV-REQ] 購物狀態表單需預設皮包為選購、短夾為考慮中。',
      '[GOV-REQ] 點擊確認按鈕需彈出對話框核對已選項目。',
    ],
  },
  module2_LearningGoals: [
    '熟練 HTML <table> 或 CSS Grid 建構 3×3 商品展示網格',
    '掌握新分頁開啟安全實踐 (target="_blank" 與 rel="noopener noreferrer")',
    '掌握 JavaScript 取得 Checked 單選值並格式化輸出 alert() 對話框',
    '學會商品圖文並排之垂直置中與間距調整技巧',
  ],
  module3_SiteArchitecture: {
    description: '網站以 index.html 進入，右側主內容預設為 main.html 呈現熱銷商品 3×3 矩陣，點擊可至 purchase.html 填寫訂單。',
    fileTree: [
      { path: 'index.html', purpose: '購物網主頁外框 (導覽與內嵌區)' },
      { path: 'main.html', purpose: '3×3 商品矩陣展示' },
      { path: 'results/leather1.html', purpose: '流行皮包細節子頁' },
      { path: 'results/leather2.html', purpose: '時尚短夾細節子頁' },
      { path: 'results/purchase.html', purpose: '訂購狀態確認表單' },
      { path: 'images/', purpose: '商品圖片庫 (0401.jpg~0409.jpg)' },
    ],
  },
  module4_Preparation: {
    tools: ['文字編輯器', '瀏覽器', '影像工具'],
    directorySpec: '建立 C:\\webXX，包含 images, results 等資料夾。',
    assets: [
      { filename: '0401.jpg', category: 'image', purpose: '商品大圖一 (經典皮包)', officialSource: '173003B13' },
      { filename: '0403.jpg', category: 'image', purpose: '商品大圖二 (時尚短夾)', officialSource: '173003B13' },
      { filename: '0409.jpg', category: 'image', purpose: '購物車圖形', officialSource: '173003B13' },
      { filename: '0401.mp3', category: 'audio', purpose: '首頁輕音樂', officialSource: '173003B13' },
    ],
  },
  module5_StepByStepGuide: [
    {
      stepNumber: 1,
      title: '3×3 商品展示網格與新視窗安全屬性',
      tag: 'GOV-REQ',
      learningGoal: '實作精確尺寸 3×3 商品展示矩陣並安全開新視窗',
      prerequisites: '商品圖片 0401~0409 準備完成',
      detailedProcess: [
        '1. 在 main.html 建立 3×3 表格，設定每列高度 150px。',
        '2. 欄位分別放置商品圖片、商品名稱與價格介紹。',
        '3. 圖片外包覆 <a href="..." target="_blank" rel="noopener noreferrer">。',
      ],
      criticalSettings: ['列高 150px', 'target="_blank"'],
      codeSnippet: `<table class="product-grid" border="1">
  <tr>
    <td class="col-img">
      <a href="results/leather1.html" target="_blank" rel="noopener noreferrer">
        <img src="images/0401.jpg" alt="經典真皮女包" width="120" height="120">
      </a>
    </td>
    <td class="col-title">經典真皮女包</td>
    <td class="col-desc">精選手工皮革，多層置物空間，原價 NT$ 3,200 特價 NT$ 2,580</td>
  </tr>
  <!-- 重複其餘商品列 -->
</table>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'target="_blank"', explanation: '官方規定商品大圖點擊需開啟新視窗。' },
        { lineOrPart: 'rel="noopener noreferrer"', explanation: '[STD-DOC] 現代安全規範，防範 Reverse Tabnabbing 跨視窗腳本劫持。' },
      ],
      expectedResult: '商品整齊排布成 3 行，點擊圖片在新視窗彈出商品詳情。',
      commonMistakes: ['列高未設定 150px', 'target 漏掉下底線打成 target="blank"'],
      troubleshooting: ['檢查表格的高度屬性或 CSS height: 150px 是否生效。'],
      extendedKnowledge: '缺少 noopener 時，新視窗可透過 window.opener.location 篡改父頁面網址，為常見 XSS 風險點。',
      checkQuiz: {
        question: 'HTML 中在新視窗開啟連結，下列哪一個 target 屬性值最標準？',
        options: ['target="new"', 'target="blank"', 'target="_blank"', 'target="_window"'],
        correctIndex: 2,
        explanation: '標準保留字以底線開頭為 _blank。',
      },
    },
    {
      stepNumber: 2,
      title: '訂購狀態確認表單與 JS 彈窗核對',
      tag: 'STD-DOC',
      learningGoal: '讀取表單選取項並彈出 alert() 核對視窗',
      prerequisites: '建立 results/purchase.html',
      detailedProcess: [
        '1. 建立皮包與短夾之單選或多選清單，皮包預設「選購」，短夾預設「考慮中」。',
        '2. 表單提交時調用 JavaScript 驗證函數。',
        '3. 取得兩項目前選取狀態，組合為字串透過 alert() 彈出。',
      ],
      criticalSettings: ['預設值 checked', 'alert() 彈出確認訊息'],
      codeSnippet: `<form onsubmit="handleConfirm(event)">
  <fieldset>
    <legend>皮包訂購意向</legend>
    <label><input type="radio" name="bag" value="選購" checked> 選購</label>
    <label><input type="radio" name="bag" value="考慮中"> 考慮中</label>
    <label><input type="radio" name="bag" value="不購買"> 不購買</label>
  </fieldset>
  <fieldset>
    <legend>短夾訂購意向</legend>
    <label><input type="radio" name="wallet" value="選購"> 選購</label>
    <label><input type="radio" name="wallet" value="考慮中" checked> 考慮中</label>
    <label><input type="radio" name="wallet" value="不購買"> 不購買</label>
  </fieldset>
  <button type="submit">確認訂單</button>
</form>

<script>
function handleConfirm(e) {
  e.preventDefault();
  var bagStatus = document.querySelector('input[name="bag"]:checked').value;
  var walletStatus = document.querySelector('input[name="wallet"]:checked').value;
  alert('您選購的狀態為：\\n皮包：' + bagStatus + '\\n短夾：' + walletStatus);
}
</script>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'document.querySelector(\'input[name="bag"]:checked\').value', explanation: '精準取得目前被勾選之單選項目數值。' },
        { lineOrPart: 'alert(...)', explanation: '彈出原生瀏覽器訊息對話框，核對已選品項。' },
      ],
      expectedResult: '點擊確認時立刻彈出訊息方塊，精準顯示目前皮包與短夾的勾選狀態。',
      commonMistakes: ['忘記設定 checked 預設值', 'alert 文字未換行排版'],
      troubleshooting: ['按 F12 測試 handleConfirm 是否正確捕獲事件。'],
      extendedKnowledge: '在現代 Web 應用中，通常以自訂 Modal 元件（如 AuthModal）取代會阻塞主執行緒的原生 alert()。',
      checkQuiz: {
        question: 'HTML 表單中，要讓某個 Radio 單選按鈕在頁面載入時預先被選中，需加上哪一個屬性？',
        options: ['selected', 'checked', 'active', 'default'],
        correctIndex: 1,
        explanation: 'radio 與 checkbox 的選中屬性為 checked（selected 用於 <option>）。',
      },
    },
  ],
  module6_HtmlDeepDive: {
    title: '商品展示結構與表格語意標籤',
    content: '雖然現代網頁多採用 Flexbox 或 CSS Grid，但 17300 考綱指定 3×3 商品陳列時要求嚴格的列高與單元格尺寸，需精確掌控表格屬性。',
    codeExamples: [
      {
        title: '商品列高控制',
        code: `<tr height="150"><td>...</td></tr>`,
        explanation: '確保無論內容長度為何，每一列均維持固定 150px 高度。',
      },
    ],
  },
  module7_CssDeepDive: {
    title: 'CSS 視窗自適應與表格外觀美化',
    content: '商品表格應設定 border-collapse: collapse 去除雙線毛邊，提升專業視覺美感。',
    rules: [
      { selector: 'table.product-grid', properties: 'border-collapse: collapse; width: 100%;', purpose: '無縫表格邊框' },
    ],
  },
  module8_JsInteractive: {
    title: '表單擷取與條件彈窗互動',
    hasJs: true,
    description: '動態讀取 DOM 中 checked 狀態並彈窗。',
    codeSnippet: `var status = document.querySelector('input[name="item"]:checked').value; alert(status);`,
  },
  module9_PdfGaps: [
    {
      topic: 'PDF 未說明的 target="_blank" 安全隱患',
      whatPdfMissed: '講義只教學生點選 target="_blank"，未提及現代瀏覽器中開新分頁若無 noopener 可能被惡意頁面導向的危險。',
      modernStandard: '一律補充 rel="noopener noreferrer"，確保視窗隔離安全。',
    },
  ],
  module10_VideoInsights: [
    {
      status: 'VERIFIED_INSIGHT',
      tip: '短夾預設考慮中，送出彈窗核對品項，開新視窗用 _blank。',
      provenanceTag: 'CTK-MEMO',
      context: '專案研發之題組四核心記憶口訣。',
    },
    {
      status: 'PENDING_RESEARCH',
      tip: 'YouTube 播放清單 #14~#16 逐幀時間戳記補充（待取得逐字稿後標定）。',
      provenanceTag: 'VID-INS',
      context: '影片研究待補。',
    },
  ],
  module11_TrapsAndTroubleshooting: [
    {
      trapTitle: '購物狀態預設值錯誤',
      penalty: '表單預設狀態與題目不符扣分。',
      detection: '載入 purchase.html 檢查短夾是否預選在「考慮中」。',
      fix: '在該 input 標籤上確認加上 checked 屬性。',
    },
  ],
  module12_QuizzesAndChecklist: {
    checklist: [
      '[ ] 3×3 商品表格排版整齊，每列高度符合 150px',
      '[ ] 點選商品圖片以新分頁開啟 (target="_blank")',
      '[ ] 購物狀態表單預設皮包選購、短夾考慮中',
      '[ ] 點擊送出能彈窗核對勾選項目',
    ],
    quizzes: [
      {
        question: '題組四試題中，短夾的預設訂購狀態應為下列何者？',
        options: ['選購', '考慮中', '不購買', '缺貨中'],
        answerIndex: 1,
        explanation: '官方規範明確要求短夾預設需勾選「考慮中」。',
      },
    ],
  },
  module13_FinalPreviewAndAudit: {
    previewUrlHint: '於沙盒檢視 3×3 表格與表單彈窗連動。',
    completionChecklist: ['商品排版無溢出', '彈窗內容格式正確', '背景音樂能載入'],
    passingScoreRule: '滿分 100 分，60 分及格。',
  },
};

// ============================================================================
// 題組五：書曼的旅遊相簿 (104305)
// ============================================================================
export const TASK_5_MODULES: TeachingModuleData = {
  taskId: 5,
  taskCode: '17300-104305',
  title: '書曼的旅遊相簿',
  theme: '三分割版面、動態按鈕藍紅狀態無閃爍切換、相框大圖合成、防抖電子相簿',
  difficulty: '★★★',
  estimatedMinutes: 90,
  canvasSpec: {
    width: '1024px',
    centering: '水平置中 (margin: 0 auto; 內圍 #FFFFCC，外圍 #333333)',
    header: '1024px × 100px（動態文字標題製作與色彩無縫貼合）',
    menu: '寬度 200px（五大相簿按鈕，藍紅切換效果）',
    content: '寬度 824px（相簿縮圖輪播，大圖 400×300px 藍框 5px）',
    footer: '1024px × 30px（網頁設計及維護：XX○○○）',
  },
  module1_Introduction: {
    overview: '本題評量個人旅遊形象網站「書曼的旅遊相簿」。整體版面為三分割結構，內圍背景為淺黃色 (#FFFFCC)，外圍背景為深灰色 (#333333)。兩大技術核心：左側按鈕需在滑鼠懸停 (hover) 時無縫切換藍底與紅底圖 (*b.gif 切換為 *r.gif)；右側電子相簿需展示 400×300px 大圖並加上 5px 藍色邊框，縮圖 hover 時加上青色 (#00FFFF) 外框，點擊縮圖即時更換大圖。',
    examCode: '17300-104305',
    requirements: [
      '[GOV-REQ] 左側按鈕必須具備藍色（預設 *b.gif）與紅色（懸停 *r.gif）動態交換效果。',
      '[GOV-REQ] 大圖尺寸固定 400×300px，外框必須為 5px 藍色實線 (#0000FF)。',
      '[GOV-REQ] 縮圖懸停時外框變為青色 (#00FFFF)，點擊時大圖即時更換。',
      '[GOV-REQ] 內圍色彩一律為 #FFFFCC，外圍為 #333333。',
    ],
  },
  module2_LearningGoals: [
    '掌握圖片按鈕 Rollover (滑鼠移入移出替換) 之防閃爍 (Flicker-Free) 實作',
    '掌握固定尺寸大圖容器之佈局防抖 (Layout Shift Prevention)',
    '熟練 CSS 邊框偽類選擇器 (:hover border) 與動態互動反饋',
    '掌握三分割經典版面架構與多媒體音樂背景無縫嵌入',
  ],
  module3_SiteArchitecture: {
    description: '網站以 index.html 載入主頁，透過左側五個相簿按鈕在內容 iframe 中切換對應相簿 (如 album5.html)。',
    fileTree: [
      { path: 'index.html', purpose: '首頁主版面 (包含標題、藍紅切換選單、內容框架)' },
      { path: 'main.html', purpose: '預設首頁內容 (個人簡介與相簿精選)' },
      { path: 'album5/album5.html', purpose: '蘭嶼旅遊相簿 (縮圖點擊換大圖)' },
      { path: 'images/', purpose: '按鈕庫 (0501b~0506b, 0501r~0506r) 與相片素材' },
    ],
  },
  module4_Preparation: {
    tools: ['文字編輯器', '瀏覽器', '影像工具'],
    directorySpec: '建立 C:\\webXX，包含 images, album5, music 目錄。',
    assets: [
      { filename: '0501b.gif', category: 'image', purpose: '相簿按鈕 1 預設藍色', officialSource: '173003B13' },
      { filename: '0501r.gif', category: 'image', purpose: '相簿按鈕 1 懸停紅色', officialSource: '173003B13' },
      { filename: '0507.jpg', category: 'image', purpose: '相簿大圖展示素材', officialSource: '173003B13' },
      { filename: '0501.mp3', category: 'audio', purpose: '相簿背景悠閒音樂', officialSource: '173003B13' },
    ],
  },
  module5_StepByStepGuide: [
    {
      stepNumber: 1,
      title: '動態按鈕藍紅狀態無閃爍切換',
      tag: 'GOV-REQ',
      learningGoal: '實作滑鼠移入移出無縫切換 *b.gif 與 *r.gif',
      prerequisites: '準備 0501b.gif 與 0501r.gif 兩套按鈕圖形',
      detailedProcess: [
        '1. 在選單中使用 <img> 標籤放入預設藍色按鈕 0501b.gif。',
        '2. 綁定 onmouseover 事件更換為紅色 0501r.gif。',
        '3. 綁定 onmouseout 事件更換回藍色 0501b.gif。',
      ],
      criticalSettings: ['onmouseover="this.src=\'images/0501r.gif\'"', 'onmouseout="this.src=\'images/0501b.gif\'"'],
      codeSnippet: `<nav class="album-menu">
  <a href="album5/album5.html" target="myFrame">
    <img src="images/0501b.gif" 
         alt="蘭嶼相簿"
         onmouseover="this.src='images/0501r.gif'"
         onmouseout="this.src='images/0501b.gif'">
  </a>
</nav>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'onmouseover / onmouseout', explanation: '原生物件事件，在滑鼠進入與離開時即時改寫 this.src。' },
      ],
      expectedResult: '滑鼠懸停於按鈕時立即變為紅色高亮，移開時乾淨還原為藍色，毫無白光閃爍。',
      commonMistakes: ['大小寫弄錯（如誤打成 0501R.gif）導致圖片消失', '移出事件寫錯檔名'],
      troubleshooting: ['在瀏覽器中滑鼠來回移動，若出現破圖檢查 Console 的 404 請求。'],
      extendedKnowledge: '現代 Web 通常使用 CSS Sprite 或 SVG 濾鏡避免圖片載入造成的首幀閃爍。',
      checkQuiz: {
        question: '題組五中，按鈕預設為藍色 (b.gif)，滑鼠懸停時應切換為哪種顏色的按鈕？',
        options: ['綠色 (g.gif)', '紅色 (r.gif)', '黃色 (y.gif)', '紫色 (p.gif)'],
        correctIndex: 1,
        explanation: '試題明確要求滑鼠移入切換為紅色按鈕 (*r.gif)。',
      },
    },
    {
      stepNumber: 2,
      title: '電子相簿 400×300px 藍框與防抖大圖切換',
      tag: 'STD-DOC',
      learningGoal: '掌握大圖固定尺寸、5px 藍框與縮圖青色 hover 互動',
      prerequisites: 'album5/album5.html 建立就緒',
      detailedProcess: [
        '1. 大圖標籤給予 id="bigPhoto"，尺寸嚴格鎖定 400×300px。',
        '2. CSS 給予大圖 border: 5px solid #0000FF。',
        '3. 縮圖清單加上 hover 青色外框 border: 2px solid #00FFFF。',
        '4. 縮圖點擊時呼叫函數替換大圖 src。',
      ],
      criticalSettings: ['width: 400px; height: 300px;', 'border: 5px solid #0000FF;', 'hover 框線 #00FFFF'],
      codeSnippet: `<!-- album5/album5.html -->
<style>
  .big-box img {
    width: 400px;
    height: 300px;
    border: 5px solid #0000FF;
    display: block;
    margin: 0 auto;
  }
  .thumb-strip img {
    width: 80px;
    height: 60px;
    margin: 5px;
    border: 2px solid transparent;
    cursor: pointer;
  }
  .thumb-strip img:hover {
    border-color: #00FFFF; /* 懸停變青色 */
  }
</style>

<div class="big-box">
  <img id="bigPhoto" src="../images/0507.jpg" alt="蘭嶼風光大圖">
</div>
<div class="thumb-strip" style="text-align: center; margin-top: 15px;">
  <img src="../images/0507.jpg" alt="縮圖1" onclick="document.getElementById('bigPhoto').src=this.src">
  <img src="../images/0511.jpg" alt="縮圖2" onclick="document.getElementById('bigPhoto').src=this.src">
</div>`,
      codeLanguage: 'html',
      codeExplanation: [
        { lineOrPart: 'border: 5px solid #0000FF;', explanation: '官方規定大圖外框為 5 像素純藍色實線。' },
        { lineOrPart: 'border-color: #00FFFF;', explanation: '官方規定縮圖懸停時為青色 (Cyan) 外框。' },
      ],
      expectedResult: '大圖置中呈現亮眼藍框，點選縮圖時大圖無抖動更新。',
      commonMistakes: ['大圖尺寸隨意變更破壞版面', '邊框粗細打成 1px 或顏色打錯'],
      troubleshooting: ['檢查大圖是否有固定寬高 width: 400px; height: 300px 防止 CLS 版面跳動。'],
      extendedKnowledge: 'CLS (Cumulative Layout Shift) 是現代 Core Web Vitals 的核心評標，固定容器寬高是消除 CLS 的關鍵。',
      checkQuiz: {
        question: '題組五中，大圖外框的官方要求邊框粗細與顏色為何？',
        options: ['1px 黑色實線', '3px 紅色實線', '5px 藍色實線 (#0000FF)', '10px 綠色實線'],
        correctIndex: 2,
        explanation: '官方規範明定大圖為 400×300px，外框為 5px 藍色實線。',
      },
    },
  ],
  module6_HtmlDeepDive: {
    title: '三分割版面架構與多媒體整合',
    content: '題組五要求將標題、側欄與內容清晰分割，並維持內圍淺黃 #FFFFCC 與外圍深灰 #333333 的高質感對比。',
    codeExamples: [
      {
        title: '三分割結構標記',
        code: `<div class="wrapper"><header>...</header><div class="main"><aside>...</aside><main>...</main></div></div>`,
        explanation: '結構嚴謹，有利於螢幕報讀機與評分程式解析。',
      },
    ],
  },
  module7_CssDeepDive: {
    title: 'CSS 邊框與色彩高對比設計',
    content: '邊框在題組五扮演重要評分依據，需熟練 border 屬性（寬度、線條樣式、顏色）。',
    rules: [
      { selector: '#bigPhoto', properties: 'border: 5px solid #0000FF;', purpose: '大圖 5px 藍色框' },
      { selector: '.thumb:hover', properties: 'border: 2px solid #00FFFF;', purpose: '縮圖懸停青色框' },
    ],
  },
  module8_JsInteractive: {
    title: '按鈕狀態互換與相片切換事件',
    hasJs: true,
    description: '處理 onmouseover/onmouseout 按鈕換圖與縮圖點擊更換大圖。',
    codeSnippet: `this.src = this.src.replace('b.gif', 'r.gif');`,
  },
  module9_PdfGaps: [
    {
      topic: 'PDF 未說明的圖片快取 (Preloading) 機制',
      whatPdfMissed: '講義直接在 hover 事件載入新圖，在慢速網路下首次移入會有短暫白屏閃爍。',
      modernStandard: '教學中說明可在 JavaScript 預先 new Image().src = "0501r.gif" 預載圖片消除閃爍。',
    },
  ],
  module10_VideoInsights: [
    {
      status: 'VERIFIED_INSIGHT',
      tip: '藍進紅出滑鼠移，相框大圖四百乘三百，外框固定藍五像素。',
      provenanceTag: 'CTK-MEMO',
      context: '專案研發之題組五核心記憶口訣。',
    },
    {
      status: 'PENDING_RESEARCH',
      tip: 'YouTube 播放清單 #17~#19 逐幀時間戳記補充（待取得逐字稿後標定）。',
      provenanceTag: 'VID-INS',
      context: '影片研究待補。',
    },
  ],
  module11_TrapsAndTroubleshooting: [
    {
      trapTitle: '按鈕懸停紅藍交換失靈',
      penalty: '動態選單效果缺失扣分。',
      detection: '滑鼠滑過按鈕觀察是否有紅底切換。',
      fix: '檢查 onmouseover 與 onmouseout 內的路徑是否拼錯。',
    },
  ],
  module12_QuizzesAndChecklist: {
    checklist: [
      '[ ] 內圍背景色為淺黃色 #FFFFCC，外圍為深灰色 #333333',
      '[ ] 左側選單具備藍紅圖形動態切換效果',
      '[ ] 相簿大圖尺寸固定為 400×300px，藍框為 5px',
      '[ ] 縮圖懸停時外框變為青色 #00FFFF',
      '[ ] 點選縮圖大圖即時順暢替換',
    ],
    quizzes: [
      {
        question: '題組五中，縮圖在滑鼠懸停 (Hover) 時，邊框應顯示哪種顏色？',
        options: ['藍色 (#0000FF)', '紅色 (#FF0000)', '青色 (#00FFFF)', '黃色 (#FFFF00)'],
        answerIndex: 2,
        explanation: '官方規範縮圖 hover 外框顏色為青色 (#00FFFF)。',
      },
    ],
  },
  module13_FinalPreviewAndAudit: {
    previewUrlHint: '於沙盒檢視 index.html 與 album5.html 之互動。',
    completionChecklist: ['按鈕無閃爍', '大圖邊框精確', '縮圖點擊切換靈敏'],
    passingScoreRule: '滿分 100 分，60 分及格。',
  },
};

// ============================================================================
// 彙整導出映射表
// ============================================================================
export const ALL_PRACTICAL_TEACHING_MODULES: Record<number, TeachingModuleData> = {
  1: TASK_1_MODULES,
  2: TASK_2_MODULES,
  3: TASK_3_MODULES,
  4: TASK_4_MODULES,
  5: TASK_5_MODULES,
};

export function getTaskTeachingModule(taskId: number): TeachingModuleData {
  return ALL_PRACTICAL_TEACHING_MODULES[taskId] || ALL_PRACTICAL_TEACHING_MODULES[1];
}
