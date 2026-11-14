/**
 * CODE TO KNOW — Code Puzzle Level Data
 * Phase 14: Interactive Gaming and Gamified Learning System (P14-GAM-004, P14-GAM-009)
 *
 * Provides structured educational levels for Code Puzzle game:
 * Logic sequencing, semantic hierarchy, and syntax structure matching Web Design Level C.
 */

export interface PuzzleBlock {
  id: string;
  content: string;
  indent?: number; // Visual indentation hint or level
}

export interface CodePuzzleLevel {
  levelId: number;
  title: string;
  category: 'HTML5' | 'CSS3' | 'JavaScript' | 'WebStructure';
  difficulty: '入門' | '基礎' | '進階';
  estimatedMinutes: number;
  description: string;
  instructions: string;
  blocks: PuzzleBlock[]; // Initial scrambled presentation
  correctOrder: string[]; // Array of block ids in correct semantic order
  acceptableOrders?: string[][]; // Permitted semantically equivalent orders
  hints: string[];
  explanation: string;
  targetCode: string;
}

export const CODE_PUZZLE_LEVELS: CodePuzzleLevel[] = [
  {
    levelId: 1,
    title: 'HTML5 網頁標準骨架排序',
    category: 'HTML5',
    difficulty: '入門',
    estimatedMinutes: 3,
    description: '重組標準 HTML5 文檔骨架，依據規範排序文檔宣告、html 根元素、head 與 body 容器。',
    instructions: '請將右側/下方打亂的 HTML 程式碼區塊，依照標準 HTML5 語意架構由上至下正確排列。',
    blocks: [
      { id: 'b_body_content', content: '  <body>\n    <main><h1>歡迎來到碼上學</h1></main>' },
      { id: 'b_doctype', content: '<!DOCTYPE html>' },
      { id: 'b_html_close', content: '  </body>\n</html>' },
      { id: 'b_html_open', content: '<html lang="zh-Hant">' },
      { id: 'b_head_meta', content: '  <head>\n    <meta charset="UTF-8">\n    <title>CODE TO KNOW</title>\n  </head>' },
    ],
    correctOrder: [
      'b_doctype',
      'b_html_open',
      'b_head_meta',
      'b_body_content',
      'b_html_close',
    ],
    hints: [
      '網頁文件標準開頭第一行必須是檔案類型宣告：<!DOCTYPE html>。',
      '<html> 標籤包含整個文件，<head> 負責中繼資料且必須位於 <body> 之前。',
      '所有畫面呈現的標題與內文都位於 <body> 內，最後由 </body></html> 閉合。',
    ],
    explanation: 'W3C HTML5 規範中，文件開頭必須有 <!DOCTYPE html> 宣告以觸發標準模式（Standards Mode）。接著是 <html lang="zh-Hant"> 根容器，內部包含儲存標題與字元編碼的 <head>，以及使用者能看見的 <body> 實體內容。',
    targetCode: `<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8">
    <title>CODE TO KNOW</title>
  </head>
  <body>
    <main><h1>歡迎來到碼上學</h1></main>
  </body>
</html>`,
  },
  {
    levelId: 2,
    title: 'CSS Flexbox 雙向置中宣告',
    category: 'CSS3',
    difficulty: '基礎',
    estimatedMinutes: 4,
    description: '排列 CSS 樣式規則，建立完美的版面水平與垂直彈性盒模型置中結構。',
    instructions: '請將打亂的 CSS 樣式屬性依照標準規則順序排列，包含選擇器、盒模型啟用、主軸與交叉軸對齊宣告。',
    blocks: [
      { id: 'c_align', content: '  align-items: center; /* 交叉軸置中 */' },
      { id: 'c_selector', content: '.hero-container {' },
      { id: 'c_close', content: '}' },
      { id: 'c_display', content: '  display: flex;' },
      { id: 'c_height', content: '  min-height: 100vh;' },
      { id: 'c_justify', content: '  justify-content: center; /* 主軸置中 */' },
    ],
    correctOrder: [
      'c_selector',
      'c_display',
      'c_justify',
      'c_align',
      'c_height',
      'c_close',
    ],
    acceptableOrders: [
      ['c_selector', 'c_display', 'c_justify', 'c_align', 'c_height', 'c_close'],
      ['c_selector', 'c_display', 'c_align', 'c_justify', 'c_height', 'c_close'],
      ['c_selector', 'c_display', 'c_height', 'c_justify', 'c_align', 'c_close'],
      ['c_selector', 'c_display', 'c_height', 'c_align', 'c_justify', 'c_close'],
      ['c_selector', 'c_height', 'c_display', 'c_justify', 'c_align', 'c_close'],
      ['c_selector', 'c_justify', 'c_align', 'c_display', 'c_height', 'c_close'],
    ],
    hints: [
      'CSS 宣告區塊必須先以類別選擇器 .hero-container { 開始。',
      '要讓對齊屬性生效，必須先將容器設定為彈性容器 display: flex;。',
      'justify-content 負責水平/主軸對齊，align-items 負責垂直/交叉軸對齊，最後由 } 結束。',
    ],
    explanation: '在 CSS 現代版面排版中，Flexbox 是最常見的置中方案。關鍵三部曲為：宣告 display: flex 啟動彈性盒、justify-content: center 主軸置中、align-items: center 交叉軸置中。配合 min-height: 100vh 撐滿視窗高度達成整體居中。',
    targetCode: `.hero-container {
  display: flex;
  justify-content: center; /* 主軸置中 */
  align-items: center; /* 交叉軸置中 */
  min-height: 100vh;
}`,
  },
  {
    levelId: 3,
    title: '語意化導覽列 (Semantic Navbar)',
    category: 'WebStructure',
    difficulty: '基礎',
    estimatedMinutes: 5,
    description: '組合符合 Web 檢定與無障礙標準的 HTML5 導覽列階層結構。',
    instructions: '將打亂的導覽列標籤依照 <nav> -> <ul> -> <li><a> 巢狀規範進行正確排列。',
    blocks: [
      { id: 'n_ul_close', content: '  </ul>' },
      { id: 'n_nav_open', content: '<nav class="main-navigation" aria-label="主選單">' },
      { id: 'n_item_2', content: '    <li><a href="#courses">技能檢定課程</a></li>' },
      { id: 'n_nav_close', content: '</nav>' },
      { id: 'n_ul_open', content: '  <ul class="nav-links">' },
      { id: 'n_item_1', content: '    <li><a href="#home">首頁</a></li>' },
    ],
    correctOrder: [
      'n_nav_open',
      'n_ul_open',
      'n_item_1',
      'n_item_2',
      'n_ul_close',
      'n_nav_close',
    ],
    acceptableOrders: [
      ['n_nav_open', 'n_ul_open', 'n_item_1', 'n_item_2', 'n_ul_close', 'n_nav_close'],
      ['n_nav_open', 'n_ul_open', 'n_item_2', 'n_item_1', 'n_ul_close', 'n_nav_close'],
    ],
    hints: [
      '最外層的導覽地標必須使用 <nav> 標記，並設定 aria-label。',
      '<nav> 內部應使用無序清單 <ul> 包裹多個導覽連結項目。',
      '清單項目 <li> 排列完畢後，先閉合 </ul>，最後再閉合 </nav>。',
    ],
    explanation: 'Web 無障礙網頁指引 (WCAG) 與網頁設計技能檢定中，均強調結構語意化。以 <nav> 作為 landmark，清單結構 <ul> 承載多個 <li>，能確保報讀軟體朗讀導覽項目的總數與當前索引，利於鍵盤及螢幕報讀器巡覽。',
    targetCode: `<nav class="main-navigation" aria-label="主選單">
  <ul class="nav-links">
    <li><a href="#home">首頁</a></li>
    <li><a href="#courses">技能檢定課程</a></li>
  </ul>
</nav>`,
  },
  {
    levelId: 4,
    title: 'JavaScript 事件監聽與表單驗證流程',
    category: 'JavaScript',
    difficulty: '進階',
    estimatedMinutes: 6,
    description: '依照執行先後順序，排列 DOM 元素選取、事件監聽器註冊、預設行為阻擋與結果處理。',
    instructions: '請將 JavaScript 事件處理的程式碼區塊依邏輯前置與回呼執行流程排列正確。',
    blocks: [
      { id: 'j_callback_end', content: '});' },
      { id: 'j_prevent', content: '  event.preventDefault(); // 阻止表單原生重整送出' },
      { id: 'j_listener_open', content: 'formEl.addEventListener("submit", (event) => {' },
      { id: 'j_select', content: 'const formEl = document.querySelector("#mock-exam-form");' },
      { id: 'j_logic', content: '  console.log("表單驗證完畢，啟動模擬考計時器");' },
    ],
    correctOrder: [
      'j_select',
      'j_listener_open',
      'j_prevent',
      'j_logic',
      'j_callback_end',
    ],
    hints: [
      '首先必須先取得目標 DOM 元素引用 (document.querySelector)。',
      '接著為元素綁定事件監聽器 addEventListener("submit", ...)。',
      '在監聽函式第一步常呼叫 event.preventDefault() 阻擋表單刷新，最後以 }); 閉合。',
    ],
    explanation: '前端事件驅動編程標準流程為：1. 獲取 DOM 節點；2. 註冊特定事件監聽器；3. 在回呼函式內處理事件物件（如 preventDefault 阻止表單整頁刷新）；4. 執行客製化的邏輯或 API 呼叫；5. 閉合監聽器函式。',
    targetCode: `const formEl = document.querySelector("#mock-exam-form");
formEl.addEventListener("submit", (event) => {
  event.preventDefault(); // 阻止表單原生重整送出
  console.log("表單驗證完畢，啟動模擬考計時器");
});`,
  },
];
