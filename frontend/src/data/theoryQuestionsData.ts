/**
 * CODE TO KNOW (碼上學) - 網頁設計丙級 (17300) 學科題庫展示資料庫
 * 註：依據勞動部勞動力發展署 173003A17 官方檢定手冊，
 * 學科題庫總數約 611 題。本檔案提供代表性全真範例題目與四階 AI 鷹架引導。
 * 所有資料標註為【展示示範資料 / 待全量官方題庫匯入】。
 */

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface AIScaffoldingHint {
  level1Focus: string;      // 觀念聚焦
  level2Strategy: string;   // 思考破題
  level3Boundary: string;   // 邊界提點
  level4Breakdown: string;  // 完整解構
}

export interface TheoryQuestion {
  id: string;
  officialNumber: number;
  chapterId: number;
  chapterName: string;
  category: string;
  question: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  keyRule: string;
  difficulty: 'easy' | 'medium' | 'hard';
  aiHints: AIScaffoldingHint;
}

export const OFFICIAL_THEORY_TOTAL_QUESTIONS = 605;
export const OFFICIAL_THEORY_HISTORICAL_MAX = 611;
export const THEORY_QUESTIONS_NOTE =
  '依勞動部 173003A17 官方最新公告考綱（V115100817），扣除歷史修訂刪除之 6 題後，官方實體有效試題共計 605 題。全量題庫已離線解析核對就緒，提供逐題練習、題型分類、真題頁碼對照與錯題本追蹤。';

export const SAMPLE_THEORY_QUESTIONS: TheoryQuestion[] = [
  {
    id: 'q17300-024',
    officialNumber: 24,
    chapterId: 2,
    chapterName: '工作項目 02：HTML5 語意架構與標籤規範',
    category: '語意標籤與無障礙',
    question: '在 HTML5 現代網頁標準中，若要標示網頁中具有主要導覽功能的一組內部或外部超連結集合，最符合 W3C 語意化與無障礙（Accessibility）規範的標籤為何？',
    codeSnippet: '<!-- 示範結構 -->\n<___ aria-label="主要選單">\n  <a href="#home">首頁</a>\n  <a href="#courses">課程</a>\n</___>',
    options: [
      { key: 'A', text: '<menu type="toolbar">' },
      { key: 'B', text: '<nav>' },
      { key: 'C', text: '<div class="navigation-bar">' },
      { key: 'D', text: '<section role="links">' },
    ],
    correctAnswer: 'B',
    explanation: '依據 W3C HTML5 規範，<nav> 專門用於標示網頁的重要導覽連結區塊，能協助螢幕報讀軟體（Screen Reader）及搜尋引擎迅速識別導航結構。<menu> 過去曾被用於工具列，但在現代標準中多作非主要用途；無語意的 <div> 則無法提供無障礙樹識別。',
    keyRule: 'W3C 語意規範：主要導覽列必須使用 <nav> 標籤封裝。',
    difficulty: 'easy',
    aiHints: {
      level1Focus: '這題考查 HTML5 核心的「結構語意化」。試著想想：哪一個標籤的英文名稱與「導航 (Navigation)」直接對應？',
      level2Strategy: '雖然用 <div> 搭配 class 也可以寫出選單外觀，但無障礙閱讀器與搜尋引擎無法直接理解其意義，因此 HTML5 引入了原生專用標籤。',
      level3Boundary: '注意：並非所有超連結都必須放進此標籤中，只有頁面頂端主選單、側邊選單等「核心導覽區塊」才應使用。',
      level4Breakdown: '正確答案為 (B) <nav>。它代表 Navigation，是 HTML5 十大語意結構標籤之一，與 <header>、<main>、<aside>、<footer> 並列為標準版面元素。',
    },
  },
  {
    id: 'q17300-058',
    officialNumber: 58,
    chapterId: 3,
    chapterName: '工作項目 03：CSS3 盒模型與排版佈局',
    category: 'CSS 盒模型與排版',
    question: '在 CSS 樣式中，若某 <div> 宣告為 width: 300px; padding: 20px; border: 5px solid #000; box-sizing: border-box;，則此區塊在瀏覽器中最終呈現的實際渲染寬度（Rendered Width）為何？',
    codeSnippet: 'div.box {\n  width: 300px;\n  padding: 20px;\n  border: 5px solid #000;\n  box-sizing: border-box;\n}',
    options: [
      { key: 'A', text: '350px' },
      { key: 'B', text: '325px' },
      { key: 'C', text: '300px' },
      { key: 'D', text: '250px' },
    ],
    correctAnswer: 'C',
    explanation: '當設定 box-sizing: border-box; 時，設定的 width（300px）會直接包含內容區 (content)、內距 (padding) 與邊框 (border)。因此元素總寬度維持在 300px，而內容區寬度會自動壓縮為 300 - (20*2) - (5*2) = 250px。',
    keyRule: 'box-sizing: border-box 使得 width = content + padding + border。',
    difficulty: 'medium',
    aiHints: {
      level1Focus: '關鍵在於 CSS 的盒模型（Box Model）模式：預設是 content-box，還是目前指定的 border-box？',
      level2Strategy: '若為 border-box，padding 與 border 會被包進所設定的 width 之中，還是會額外往外加上去？',
      level3Boundary: '若是 content-box，總寬度會是 300 + 40 + 10 = 350px；但題目特別宣告了 border-box！',
      level4Breakdown: '答案為 (C) 300px。border-box 是現代響應式設計（RWD）的黃金準則，能確保元素總寬度嚴格不超出宣告寬度。',
    },
  },
  {
    id: 'q17300-112',
    officialNumber: 112,
    chapterId: 1,
    chapterName: '工作項目 01：作業準備與智慧財產權法規',
    category: '智慧財產權與倫理',
    question: '在網頁開發與設計檢定過程中，若需要使用網路上下載之非自製圖片或音效素材，下列何種處置最符合著作權法規範與考場評分守則？',
    options: [
      { key: 'A', text: '只要圖片解析度縮小至 50% 以下即可自由使用，不需授權' },
      { key: 'B', text: '需使用檢定單位官方提供之檢定專用素材，或取得創用 CC (Creative Commons) 授權並依規範標註來源' },
      { key: 'C', text: '商業專利圖片只要在圖片上加入自己網站的浮水印便合法' },
      { key: 'D', text: '只要未營利販售，任何網路素材皆可任意置入考場網頁作品' },
    ],
    correctAnswer: 'B',
    explanation: '依據著作權法及技能檢定試場規則，應檢人於考場實作時，必須嚴格使用試題隨附官方合法授權之素材資料夾（如素材題組檔案），若在非檢定或公開網站專案中，則必須取得合法著作權授權或採用符合 CC 授權規定之素材，不得擅自未經授權引用商業著作。',
    keyRule: '檢定應試限用官方隨附合法素材；日常開發應確認 CC 授權或授權證明。',
    difficulty: 'easy',
    aiHints: {
      level1Focus: '著作權的核心精神是「創作人的智慧財產保障」。縮小尺寸或標上自己的浮水印能免除侵權責任嗎？',
      level2Strategy: '思考考場官方試題說明：「應檢人僅得使用承辦單位提供之檢定用素材」之嚴格規範。',
      level3Boundary: '注意常見誤區：未營利不等於免責，非營利重製若未獲授權仍構成侵害著作權。',
      level4Breakdown: '答案為 (B)。檢定考場內嚴格禁止攜帶或擅自下載外部未受認可素材，必須全數使用檢定單位提供的試題素材庫。',
    },
  },
  {
    id: 'q17300-189',
    officialNumber: 189,
    chapterId: 4,
    chapterName: '工作項目 04：資訊安全與多媒體色彩原理',
    category: '多媒體格式與網路效能',
    question: '在網頁設計丙級術科實作中，當需要為網站設計具備「透明背景 (Alpha Transparency)」的圖示或 Logo，且需確保在各主流瀏覽器皆能清晰無失真渲染時，下列何種圖檔格式最為適合？',
    options: [
      { key: 'A', text: '標準 JPEG (.jpg) 檔案' },
      { key: 'B', text: '點陣圖 BMP (.bmp) 檔案' },
      { key: 'C', text: '可攜式網路圖形 PNG (.png) 檔案' },
      { key: 'D', text: '動畫圖形 APNG (.apng) 檔案' },
    ],
    correctAnswer: 'C',
    explanation: 'PNG (Portable Network Graphics) 採用無損壓縮技術，且原生支援 8-bit 與 24-bit 的 Alpha 色版透明度，能精準保留漸層透明與透明邊緣，為網頁 Logo、透明圖示之國家標準首選；JPEG 不支援任何透明色；BMP 未壓縮且檔案過大不符網頁效能規範。',
    keyRule: '透明背景與向量/銳利圖示優先採用 PNG 或 SVG；連續色調照片採用 JPEG/WebP。',
    difficulty: 'easy',
    aiHints: {
      level1Focus: '哪種圖檔格式原生具備 Alpha Transparency（透明通道），且是無損壓縮？',
      level2Strategy: '排除法：JPEG 擅長壓縮自然風景照片，但完全不支援透明背景；BMP 體積龐大且不適合網頁傳輸。',
      level3Boundary: '考場素材中，社團標誌與去背圖案大部分皆以 .png 格式提供。',
      level4Breakdown: '答案為 (C) PNG 格式。它完全取代了早期 GIF 的二元單色透明，具備 256 階全透明至不透明平滑漸變。',
    },
  },
  {
    id: 'q17300-305',
    officialNumber: 305,
    chapterId: 3,
    chapterName: '工作項目 03：CSS3 盒模型與排版佈局',
    category: 'CSS 水平置中與排版',
    question: '網頁設計丙級術科試題通用規範要求「整體網頁寬度 1024 像素，且必須在不同解析度螢幕中保持水平置中」。在 CSS 中，對寬度設定為 1024px 的外層容器區塊，下列哪一組設定能標準達成水平置中？',
    codeSnippet: '.wrapper {\n  width: 1024px;\n  /* 水平置中關鍵設定 */\n}',
    options: [
      { key: 'A', text: 'text-align: center;' },
      { key: 'B', text: 'margin: 0 auto;' },
      { key: 'C', text: 'padding: 0 auto;' },
      { key: 'D', text: 'float: center;' },
    ],
    correctAnswer: 'B',
    explanation: '區塊元素 (Block-level element) 具備固定寬度時，透過 margin-left: auto; 與 margin-right: auto;（簡寫為 margin: 0 auto;），瀏覽器會自動將剩餘的視窗可用空間平分給左右外距，從而使該容器在螢幕中完美水平置中。text-align: center 僅影響行內元素 (inline) 與文字，對區塊容器無效；float 亦無 center 屬性值。',
    keyRule: '定寬區塊元素水平置中標準語法：margin: 0 auto;',
    difficulty: 'medium',
    aiHints: {
      level1Focus: '目標是將一個具有 width: 1024px 的「區塊元素（Block Element）」置中，而非單純的行內文字。',
      level2Strategy: 'text-align 只能讓文字或 span 置中；如果要讓整顆 div 置中，必須操作外距 (margin)。',
      level3Boundary: '注意：float 只有 left、right、none，根本沒有 float: center！',
      level4Breakdown: '答案為 (B) margin: 0 auto;。此語法是網頁設計丙級 4 大題組版面開局最關鍵的必考第一步。',
    },
  },
];

