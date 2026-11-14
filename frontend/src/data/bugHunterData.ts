/**
 * CODE TO KNOW — Bug Hunter Game Data & Verification Logic
 * Phase 14: Interactive Gaming and Gamified Learning System (P14-GAM-006, P14-GAM-009)
 *
 * Provides structured educational levels for Bug Hunter:
 * Level 1: HTML 結構除錯 (未閉合標籤、錯誤巢狀、屬性拼寫)
 * Level 2: CSS 樣式除錯 (錯誤屬性名稱、非法值、Flexbox 設定)
 * Level 3: JavaScript 基礎除錯 (變數/方法大小寫、賦值運算子誤用)
 * Level 4: HTML、CSS、JavaScript 綜合除錯 (跨領域複合錯誤排查)
 */

export interface FixOption {
  id: string;
  label: string;
  replacement: string;
  isCorrect: boolean;
  explanation: string;
}

export interface BuggyLineInfo {
  lineNum: number;
  bugType: string;
  originalText: string;
  expectedText: string;
  hint: string;
  explanation: string;
  fixOptions: FixOption[];
}

export interface BugHunterLevel {
  levelId: number;
  title: string;
  category: 'HTML 結構除錯' | 'CSS 樣式除錯' | 'JavaScript 邏輯除錯' | '綜合跨領域除錯';
  difficulty: '入門' | '基礎' | '進階' | '挑戰';
  estimatedMinutes: number;
  description: string;
  instructions: string;
  initialCode: string;
  buggyLines: BuggyLineInfo[];
  hints: string[];
  explanation: {
    overview: string;
    bugsAnalyzed: { line: number; error: string; fix: string; why: string }[];
    examTips: string;
    bestPractices: string;
  };
}

export const BUG_HUNTER_LEVELS: BugHunterLevel[] = [
  {
    levelId: 1,
    title: 'HTML 結構與標籤語意除錯',
    category: 'HTML 結構除錯',
    difficulty: '入門',
    estimatedMinutes: 4,
    description: '排查網頁導覽列中常見的標籤閉合不匹配與 HTML 屬性拼寫錯誤。',
    instructions: '請仔細檢視下方 HTML 程式碼，找出並修正其中的 2 處語法結構錯誤。可點擊有問題的行號進行修正。',
    initialCode: `<header class="site-header">
  <img src="images/logo.png" atr="碼上學 Logo">
  <nav class="navigation">
    <ul class="nav-list">
      <li><a href="#home">首頁</a></p>
      <li><a href="#courses">課程專區</a></li>
    </ul>
  </nav>
</header>`,
    buggyLines: [
      {
        lineNum: 2,
        bugType: 'HTML 屬性拼寫錯誤',
        originalText: '  <img src="images/logo.png" atr="碼上學 Logo">',
        expectedText: '  <img src="images/logo.png" alt="碼上學 Logo">',
        hint: '檢視圖片標籤的無障礙替代文字屬性名稱是否正確。',
        explanation: 'HTML 圖片標籤規範中，替代文字屬性應為 `alt`，而非 `atr`。若拼錯將導致螢幕報讀器無法辨識圖片，且無法通過 W3C 驗證。',
        fixOptions: [
          {
            id: 'l1_b1_opt1',
            label: '  <img src="images/logo.png" alt="碼上學 Logo">',
            replacement: '  <img src="images/logo.png" alt="碼上學 Logo">',
            isCorrect: true,
            explanation: '正確！使用標準 `alt` 屬性提供影像替代文字。',
          },
          {
            id: 'l1_b1_opt2',
            label: '  <img src="images/logo.png" title="碼上學 Logo">',
            replacement: '  <img src="images/logo.png" title="碼上學 Logo">',
            isCorrect: false,
            explanation: '`title` 僅為提示工具框，標準 HTML5 中圖片必須具備 `alt` 屬性以符合無障礙檢核。',
          },
          {
            id: 'l1_b1_opt3',
            label: '  <img src="images/logo.png">',
            replacement: '  <img src="images/logo.png">',
            isCorrect: false,
            explanation: '直接刪除屬性會導致圖片缺乏替代文字，在技能檢定中會被扣分。',
          },
        ],
      },
      {
        lineNum: 5,
        bugType: '標籤閉合不匹配 (Mismatched Tag)',
        originalText: '      <li><a href="#home">首頁</a></p>',
        expectedText: '      <li><a href="#home">首頁</a></li>',
        hint: '觀察該行標籤的開啟標籤與閉合標籤是否對應。',
        explanation: '該行以 `<li>` 開啟清單項，內部包覆 `<a>` 連結，但結尾卻誤用 `</p>` 閉合。標準 HTML 必須以對應的 `</a></li>` 閉合。',
        fixOptions: [
          {
            id: 'l1_b2_opt1',
            label: '      <li><a href="#home">首頁</a></li>',
            replacement: '      <li><a href="#home">首頁</a></li>',
            isCorrect: true,
            explanation: '正確！清單項目由 `<li>` 開啟，必須以 `</li>` 閉合。',
          },
          {
            id: 'l1_b2_opt2',
            label: '      <p><a href="#home">首頁</a></p>',
            replacement: '      <p><a href="#home">首頁</a></p>',
            isCorrect: false,
            explanation: '`<ul>` 清單內部子元素必須是 `<li>`，不可直接放置 `<p>` 標籤。',
          },
          {
            id: 'l1_b2_opt3',
            label: '      <li>首頁</p>',
            replacement: '      <li>首頁</p>',
            isCorrect: false,
            explanation: '依然存在 `<li>` 與 `</p>` 標籤不匹配的嚴重結構問題。',
          },
        ],
      },
    ],
    hints: [
      '【錯誤類型】：本關包含 1 處 HTML 屬性拼寫錯誤，以及 1 處標籤開閉不對稱錯誤。',
      '【可能位置】：請重點檢查第 2 行的 `<img>` 標籤與第 5 行的導覽項目閉合標籤。',
      '【修正方向】：將第 2 行的 `atr` 改為 `alt`；將第 5 行末端的 `</p>` 改為 `</li>`。',
    ],
    explanation: {
      overview: '在網頁設計丙級檢定與實務前端開發中，HTML 標籤必須完全對稱閉合，且關鍵無障礙屬性如 `alt` 萬不可漏寫或拼錯。現代瀏覽器雖有容錯機制，但在嚴格模式驗證或螢幕報讀下會產生嚴重破版與合規性扣分。',
      bugsAnalyzed: [
        {
          line: 2,
          error: '使用不存在的屬性名 `atr`',
          fix: '修正為標準屬性 `alt="碼上學 Logo"`',
          why: 'W3C 規範要求影像必須聲明 `alt` 屬性，確保網路延遲或視障報讀時有替代資訊。',
        },
        {
          line: 5,
          error: '開頭為 `<li>` 結尾卻為 `</p>`',
          fix: '修正為對稱閉合的 `</a></li>`',
          why: 'HTML 樹狀結構必須巢狀平衡，否則 DOM 樹解析將被迫進行隱式修正。',
        },
      ],
      examTips: '檢定術科考場中，常因複製貼上文字而殘留錯誤閉合標籤。存檔前務必使用編輯器高亮檢查成對標籤。',
      bestPractices: '使用現代 IDE 或語法檢查工具 (HTMLHint / ESLint) 自動攔截開閉標籤不對稱。',
    },
  },
  {
    levelId: 2,
    title: 'CSS 屬性名稱、非法值與 Flexbox 除錯',
    category: 'CSS 樣式除錯',
    difficulty: '基礎',
    estimatedMinutes: 5,
    description: '排查 CSS 樣式宣告中常見的屬性拼寫錯誤與非法 Flexbox 軸線值。',
    instructions: '請檢視下方 CSS 規則，找出並修復 2 處會導致排版完全失效的非法宣告。',
    initialCode: `.card-container {
  display: flex;
  justify-content: middle;
  align-items: center;
  padding: 16px;
  backgroud-color: #FFFFFF;
}`,
    buggyLines: [
      {
        lineNum: 3,
        bugType: '非法 CSS 屬性值 (Invalid Value)',
        originalText: '  justify-content: middle;',
        expectedText: '  justify-content: center;',
        hint: 'Flexbox 的主軸置中對齊值不是 middle。',
        explanation: '在 Flexbox 規範中，主軸對齊屬性 `justify-content` 的合法置中值是 `center`，而非 `middle`。`middle` 是 `vertical-align` 的專用值。',
        fixOptions: [
          {
            id: 'l2_b1_opt1',
            label: '  justify-content: center;',
            replacement: '  justify-content: center;',
            isCorrect: true,
            explanation: '正確！Flexbox 主軸置中使用 `center`。',
          },
          {
            id: 'l2_b1_opt2',
            label: '  justify-content: align-center;',
            replacement: '  justify-content: align-center;',
            isCorrect: false,
            explanation: '`align-center` 不是合法 CSS 屬性值。',
          },
          {
            id: 'l2_b1_opt3',
            label: '  justify-content: auto;',
            replacement: '  justify-content: auto;',
            isCorrect: false,
            explanation: '`justify-content` 沒有 `auto` 值。',
          },
        ],
      },
      {
        lineNum: 6,
        bugType: 'CSS 屬性名稱拼寫錯誤 (Property Typo)',
        originalText: '  backgroud-color: #FFFFFF;',
        expectedText: '  background-color: #FFFFFF;',
        hint: '注意 background 英文單字的拼寫。',
        explanation: '`backgroud-color` 遺漏了字母 `n`，屬於無效屬性名稱。瀏覽器會直接忽略該行，造成背景顏色無法正確填滿。',
        fixOptions: [
          {
            id: 'l2_b2_opt1',
            label: '  background-color: #FFFFFF;',
            replacement: '  background-color: #FFFFFF;',
            isCorrect: true,
            explanation: '正確！正確拼寫為 `background-color`。',
          },
          {
            id: 'l2_b2_opt2',
            label: '  bg-color: #FFFFFF;',
            replacement: '  bg-color: #FFFFFF;',
            isCorrect: false,
            explanation: '原生 CSS 沒有 `bg-color` 屬性（這是某些 CSS 框架的簡寫 class）。',
          },
          {
            id: 'l2_b2_opt3',
            label: '  color-background: #FFFFFF;',
            replacement: '  color-background: #FFFFFF;',
            isCorrect: false,
            explanation: 'CSS 規範中不存在 `color-background` 屬性。',
          },
        ],
      },
    ],
    hints: [
      '【錯誤類型】：本關包含 1 處 Flexbox 屬性值非法，以及 1 處屬性名稱拼寫單字錯誤。',
      '【可能位置】：請重點檢視第 3 行與第 6 行。',
      '【修正方向】：將第 3 行的 `middle` 改為標準的 `center`；將第 6 行的 `backgroud` 補上 `n` 修正為 `background-color`。',
    ],
    explanation: {
      overview: 'CSS 解析器具備「遇到無法辨識的屬性名或屬性值時靜默忽略」的特性，這常導致排版失效卻無控制台錯誤訊息。掌握 Flexbox 標準值（center、flex-start、space-between）是排版成功的關鍵。',
      bugsAnalyzed: [
        {
          line: 3,
          error: '`justify-content` 被賦予非法值 `middle`',
          fix: '改為合法標準值 `justify-content: center;`',
          why: 'Flexbox 對齊屬性採用 `center`；只有表格與行內元素的 `vertical-align` 才使用 `middle`。',
        },
        {
          line: 6,
          error: '拼錯屬性名 `backgroud-color`（漏 n）',
          fix: '修正為 `background-color: #FFFFFF;`',
          why: 'CSS 關鍵字不可拼錯，否則整行宣告無效被瀏覽器丟棄。',
        },
      ],
      examTips: '檢定中若發現樣式完全沒反應，優先檢查是否有屬性單字拼錯或末端漏分號。',
      bestPractices: '善用瀏覽器開發者工具 (F12) 的 Styles 面板，無效屬性會被劃上刪除線並顯示警告驚嘆號。',
    },
  },
  {
    levelId: 3,
    title: 'JavaScript 大小寫與條件賦值除錯',
    category: 'JavaScript 邏輯除錯',
    difficulty: '進階',
    estimatedMinutes: 6,
    description: '排查前端常見的 API 大小寫敏感錯誤與條件式中將比較誤寫為賦值的嚴重邏輯漏洞。',
    instructions: '請檢視下方事件監聽與表單驗證程式碼，找出並修正 2 處會導致腳本報錯或邏輯失控的 Bug。',
    initialCode: `const submitBtn = document.querySelector("#submit-btn");

submitBtn.addEventListener("click", function(event) {
  event.preventdefault();
  let score = 85;
  if (score = 100) {
    console.log("滿分合格！");
  }
});`,
    buggyLines: [
      {
        lineNum: 4,
        bugType: '方法名稱大小寫敏感錯誤 (Case-sensitivity Error)',
        originalText: '  event.preventdefault();',
        expectedText: '  event.preventDefault();',
        hint: 'JavaScript 是嚴格區分大小寫的語言，注意 Default 的 D。',
        explanation: '原生 DOM Event API 中，阻止預設行為的方法為 `preventDefault()`（駝峰式命名）。若寫成全小寫 `preventdefault()` 會拋出 `TypeError: event.preventdefault is not a function`。',
        fixOptions: [
          {
            id: 'l3_b1_opt1',
            label: '  event.preventDefault();',
            replacement: '  event.preventDefault();',
            isCorrect: true,
            explanation: '正確！DOM API 遵守駝峰命名法，D 必須大寫。',
          },
          {
            id: 'l3_b1_opt2',
            label: '  event.stop();',
            replacement: '  event.stop();',
            isCorrect: false,
            explanation: '標準 Event 物件沒有 `event.stop()` 方法。',
          },
          {
            id: 'l3_b1_opt3',
            label: '  return false;',
            replacement: '  return false;',
            isCorrect: false,
            explanation: '在 `addEventListener` 監聽器中 `return false` 無法可靠阻止表單原生送出行為。',
          },
        ],
      },
      {
        lineNum: 6,
        bugType: '條件式誤用賦值運算子 (Assignment vs Equality)',
        originalText: '  if (score = 100) {',
        expectedText: '  if (score === 100) {',
        hint: '條件判斷應使用嚴格相等比較運算子 (===)，而非單個賦值等號 (=)。',
        explanation: '單個等號 `=` 是賦值運算子，會將 `score` 強制改寫為 100，且因 100 為 Truthy 值，導致該條件判斷永遠為真。應使用 `===` 進行嚴格相等比對。',
        fixOptions: [
          {
            id: 'l3_b2_opt1',
            label: '  if (score === 100) {',
            replacement: '  if (score === 100) {',
            isCorrect: true,
            explanation: '正確！使用嚴格相等比較運算子 `===` 避免型別轉換與誤賦值。',
          },
          {
            id: 'l3_b2_opt2',
            label: '  if (score == 100) {',
            replacement: '  if (score == 100) {',
            isCorrect: true, // Also acceptable equality
            explanation: '可接受！寬鬆相等 `==` 亦可達成數值比對，最佳實務建議使用 `===`。',
          },
          {
            id: 'l3_b2_opt3',
            label: '  if (score := 100) {',
            replacement: '  if (score := 100) {',
            isCorrect: false,
            explanation: 'JavaScript 沒有 `:=` 運算子。',
          },
        ],
      },
    ],
    hints: [
      '【錯誤類型】：本關包含 1 處 DOM 事件方法大小寫拼寫錯誤，以及 1 處將條件比對誤寫為賦值的邏輯 Bug。',
      '【可能位置】：重點檢查第 4 行與第 6 行。',
      '【修正方向】：第 4 行改為 `event.preventDefault()`；第 6 行改為 `if (score === 100)`。',
    ],
    explanation: {
      overview: 'JavaScript 嚴格區分大小寫，許多初學者因打錯大小寫導致函式無法執行。此外，在 `if` 條件式中誤用單等號 `=` 是臭名昭著的幽靈 Bug，它不僅不會報錯，還會靜默竄改變數值。',
      bugsAnalyzed: [
        {
          line: 4,
          error: '方法寫成全小寫 `preventdefault()`',
          fix: '修正為駝峰命名 `event.preventDefault();`',
          why: 'JS 內建方法遵循 camelCase 命名規範。',
        },
        {
          line: 6,
          error: '條件式中誤用單等號賦值 `score = 100`',
          fix: '修正為嚴格相等 `score === 100`',
          why: '`=` 會將 100 賦予 score 並返回 100，造成條件恆為 true。',
        },
      ],
      examTips: '檢定第 5 題組與各題組表單驗證時，務必確認 `preventDefault()` 正確阻止頁面整頁刷新。',
      bestPractices: '使用 ESLint 規則 `no-cond-assign`，可在編寫階段直接標記條件式內的賦值錯誤。',
    },
  },
  {
    levelId: 4,
    title: 'HTML、CSS、JavaScript 綜合除錯靶場',
    category: '綜合跨領域除錯',
    difficulty: '挑戰',
    estimatedMinutes: 7,
    description: '綜合性實戰挑戰：一段包含結構、樣式與 DOM 操作的複合組件，同時潛伏多個關鍵 Bug。',
    instructions: '請逐行檢閱下方綜合組件程式碼，找出並修正隱藏在 HTML、CSS 與 JavaScript 中的 3 處錯誤。',
    initialCode: `<div id="score-card" class="result-box">
  <h2 class="title">測驗成績結算</h3>
  <p class="score-text">得分：<span id="final-score">0</span></p>
</div>
<style>
  .result-box {
    text-align: center;
    colour: #2563EB;
  }
</style>
<script>
  function displayScore(val) {
    const target = document.getElementById("score-card");
    target.innerHtml = "您的得分為：" + val;
  }
</script>`,
    buggyLines: [
      {
        lineNum: 2,
        bugType: 'HTML 標籤開閉不對稱 (H2 vs H3)',
        originalText: '  <h2 class="title">測驗成績結算</h3>',
        expectedText: '  <h2 class="title">測驗成績結算</h2>',
        hint: '檢查標題標籤前後層級是否一致。',
        explanation: '開啟標籤為 `<h2>`，閉合標籤卻誤寫為 `</h3>`，破壞了 HTML 文件大綱結構。',
        fixOptions: [
          {
            id: 'l4_b1_opt1',
            label: '  <h2 class="title">測驗成績結算</h2>',
            replacement: '  <h2 class="title">測驗成績結算</h2>',
            isCorrect: true,
            explanation: '正確！對應閉合 `</h2>`。',
          },
          {
            id: 'l4_b1_opt2',
            label: '  <h3 class="title">測驗成績結算</h3>',
            replacement: '  <h3 class="title">測驗成績結算</h3>',
            isCorrect: false,
            explanation: '原題組規劃為二級標題 h2，隨意降級為 h3 會影響大綱層級。',
          },
        ],
      },
      {
        lineNum: 9,
        bugType: 'CSS 屬性英式拼寫錯誤 (colour)',
        originalText: '    colour: #2563EB;',
        expectedText: '    color: #2563EB;',
        hint: 'CSS 採用美式英文標準，顏色屬性拼寫請注意。',
        explanation: 'CSS 標準中文字顏色屬性為 `color`，非英式拼寫 `colour`。瀏覽器無法辨識 `colour`。',
        fixOptions: [
          {
            id: 'l4_b2_opt1',
            label: '    color: #2563EB;',
            replacement: '    color: #2563EB;',
            isCorrect: true,
            explanation: '正確！CSS 官方標準為美式拼寫 `color`。',
          },
          {
            id: 'l4_b2_opt2',
            label: '    font-color: #2563EB;',
            replacement: '    font-color: #2563EB;',
            isCorrect: false,
            explanation: 'CSS 沒有 `font-color` 屬性。',
          },
        ],
      },
      {
        lineNum: 16,
        bugType: 'DOM innerHTML 屬性大小寫錯誤',
        originalText: '    target.innerHtml = "您的得分為：" + val;',
        expectedText: '    target.innerHTML = "您的得分為：" + val;',
        hint: 'DOM 元素的 HTML 內容設定屬性中，HTML 三個字母必須全大寫。',
        explanation: 'DOM 規範中為 `element.innerHTML`。寫成 `innerHtml` 會被視為自訂普通屬性賦值，不會更新頁面上的實際 HTML 內容。',
        fixOptions: [
          {
            id: 'l4_b3_opt1',
            label: '    target.innerHTML = "您的得分為：" + val;',
            replacement: '    target.innerHTML = "您的得分為：" + val;',
            isCorrect: true,
            explanation: '正確！DOM API 屬性名為 `innerHTML`。',
          },
          {
            id: 'l4_b3_opt2',
            label: '    target.textContent = "您的得分為：" + val;',
            replacement: '    target.textContent = "您的得分為：" + val;',
            isCorrect: true, // textContent is also semantically valid for pure text!
            explanation: '很棒！純文字更新使用 `textContent` 亦為安全高效的實務寫法。',
          },
          {
            id: 'l4_b3_opt3',
            label: '    target.value = "您的得分為：" + val;',
            replacement: '    target.value = "您的得分為：" + val;',
            isCorrect: false,
            explanation: '`div` 不是表單輸入框，沒有 `value` 屬性。',
          },
        ],
      },
    ],
    hints: [
      '【錯誤類型】：本關涵蓋 1 處 HTML 標籤層級不對稱、1 處 CSS 拼寫不合標準、以及 1 處 DOM 屬性大小寫錯誤。',
      '【可能位置】：請依序檢查第 2 行、第 9 行與第 16 行。',
      '【修正方向】：第 2 行修正為 `</h2>`；第 9 行修正為 `color`；第 16 行修正為 `innerHTML` 或 `textContent`。',
    ],
    explanation: {
      overview: '全端網頁組件由結構 (HTML)、外觀 (CSS) 與行為 (JS) 緊密聯動。任一環節出錯都將阻斷整體功能運作。此類跨領域排查能力是區分初學者與專業工程師的重要分水嶺。',
      bugsAnalyzed: [
        {
          line: 2,
          error: '`<h2>` 誤以 `</h3>` 閉合',
          fix: '改為對稱 `</h2>`',
          why: '維持標題語意完整性。',
        },
        {
          line: 9,
          error: 'CSS 屬性誤用英式英文 `colour`',
          fix: '修正為標準美式英文 `color`',
          why: 'W3C CSS 規範以美式拼寫為準。',
        },
        {
          line: 16,
          error: 'DOM 屬性大小寫錯誤 `innerHtml`',
          fix: '修正為 `innerHTML` 或 `textContent`',
          why: 'JS 區分大小寫，`innerHtml` 無法觸發 DOM 重新渲染。',
        },
      ],
      examTips: '術科動態效果與題組整合時，常因 script 中的小小大小寫錯誤導致整頁腳本中斷。養成打開 F12 Console 的好習慣。',
      bestPractices: '分離關注點（Separation of Concerns），並開啟 TypeScript 或嚴格模式降低無效屬性賦值風險。',
    },
  },
];
