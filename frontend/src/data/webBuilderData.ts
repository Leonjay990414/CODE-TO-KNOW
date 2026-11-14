/**
 * CODE TO KNOW 碼上學｜Web Builder 網頁架構師關卡資料庫
 * 對應原始 UID：P14-GAM-008（HTML／CSS 元件組合與網頁結構）
 * 安全性保證：純結構化積木定義，嚴禁包含任何動態執行程式碼或腳本注入
 */

export type BlockCategory = 'root' | 'structure' | 'semantic' | 'content';

export interface WebBlock {
  id: string;
  type: string;
  tag: string;
  label: string;
  category: BlockCategory;
  description: string;
  semanticRole: string;
  previewContent?: string;
  color: string;
}

export interface WebBuilderLevel {
  id: string;
  levelNumber: number;
  title: string;
  subtitle: string;
  difficulty: '入門' | '基礎' | '進階' | '整合';
  targetDescription: string;
  conceptSummary: string;
  starterBlockIds: string[];
  targetBlockSequence: string[];
  blockPool: WebBlock[];
  hints: [string, string];
  pedagogicalNotes: string;
}

export const WEB_BUILDER_BLOCKS: Record<string, WebBlock> = {
  // 根與基本骨架積木
  'doctype': {
    id: 'doctype',
    type: 'doctype',
    tag: '<!DOCTYPE html>',
    label: '<!DOCTYPE html> 文件宣告',
    category: 'root',
    description: '告知瀏覽器採用現代標準 HTML5 模式進行解析與渲染',
    semanticRole: '標準規範宣告',
    previewContent: '📄 宣告文件類型為 HTML5',
    color: '#3B82F6',
  },
  'html': {
    id: 'html',
    type: 'html',
    tag: '<html lang="zh-Hant">',
    label: '<html lang="zh-Hant"> 根元素',
    category: 'root',
    description: '網頁所有內容的最高層根容器，宣告網頁語系為繁體中文',
    semanticRole: '文件最高層節點',
    previewContent: '🌐 網頁全站根邊界容器',
    color: '#2563EB',
  },
  'head': {
    id: 'head',
    type: 'head',
    tag: '<head>',
    label: '<head> 中繼資訊區',
    category: 'structure',
    description: '包含給瀏覽器與搜尋引擎讀取的中繼設定（編碼、標題、樣式表連結）',
    semanticRole: '文件詮釋資料 (Metadata)',
    previewContent: '⚙️ 標題、字型與編碼中繼資訊',
    color: '#6366F1',
  },
  'title': {
    id: 'title',
    type: 'title',
    tag: '<title>',
    label: '<title> 頁面標題',
    category: 'content',
    description: '顯示於瀏覽器分頁標籤與書籤之頁面名稱',
    semanticRole: '瀏覽器視窗標籤與搜尋引擎索引名稱',
    previewContent: '📌 碼上學｜前端技術全景學習平台',
    color: '#8B5CF6',
  },
  'body': {
    id: 'body',
    type: 'body',
    tag: '<body>',
    label: '<body> 主要內容主體',
    category: 'structure',
    description: '所有在螢幕畫面上可見之使用者介面節點全數置於此元素之內',
    semanticRole: '可視化視圖內容容器',
    previewContent: '🖥️ 網頁可視化區域容器',
    color: '#10B981',
  },

  // 語意化地標積木
  'header': {
    id: 'header',
    type: 'header',
    tag: '<header>',
    label: '<header> 頁首地標',
    category: 'semantic',
    description: '引導區域，通常包含網站標誌、品牌識別與導覽按鈕群',
    semanticRole: '頁首導引橫幅 (banner)',
    previewContent: '🔖 網站標誌與頁首導航區',
    color: '#059669',
  },
  'nav': {
    id: 'nav',
    type: 'nav',
    tag: '<nav>',
    label: '<nav> 導航選單',
    category: 'semantic',
    description: '主要的頁面超連結群組，具備明確無障礙導覽輔助屬性',
    semanticRole: '主要導航列 (navigation)',
    previewContent: '🧭 課程首頁 ｜ 實務題庫 ｜ 證照模擬考',
    color: '#0D9488',
  },
  'main': {
    id: 'main',
    type: 'main',
    tag: '<main>',
    label: '<main> 核心主體地標',
    category: 'semantic',
    description: '頁面最核心且唯一的獨立主題內容，每個頁面僅能存在一個 main',
    semanticRole: '核心主要內容 (main content)',
    previewContent: '📖 探索專業證照與互動學習歷程',
    color: '#D97706',
  },
  'section-course': {
    id: 'section-course',
    type: 'section',
    tag: '<section class="courses">',
    label: '<section> 課程主題區塊',
    category: 'semantic',
    description: '具有明確標題之獨立主題邏輯分組區塊',
    semanticRole: '主題邏輯區塊 (region)',
    previewContent: '📚 五大題組術科教學與題庫解析',
    color: '#EA580C',
  },
  'section-interactive': {
    id: 'section-interactive',
    type: 'section',
    tag: '<section class="games">',
    label: '<section> 互動遊戲區塊',
    category: 'semantic',
    description: '包含多款程式邏輯拼圖與快答遊戲的互動體驗區塊',
    semanticRole: '互動練習分區 (region)',
    previewContent: '🎮 挑戰五款程式互動遊戲獲得成就徽章',
    color: '#C026D3',
  },
  'footer': {
    id: 'footer',
    type: 'footer',
    tag: '<footer>',
    label: '<footer> 頁尾宣告',
    category: 'semantic',
    description: '頁面底層資訊，包含版權宣告、隱私權規範與法律條款連結',
    semanticRole: '內容資訊與版權 (contentinfo)',
    previewContent: '© 2026 CODE TO KNOW 碼上學．保留所有權利',
    color: '#475569',
  },

  // 內容排版積木
  'h1': {
    id: 'h1',
    type: 'h1',
    tag: '<h1>',
    label: '<h1> 最高層主標題',
    category: 'content',
    description: '頁面最重要之第一層級主標題，原則上一頁建議僅使用一個',
    semanticRole: '頁面第一級大標題 (Heading 1)',
    previewContent: '碼上學：引領新世代程式學習',
    color: '#DC2626',
  },
  'h2': {
    id: 'h2',
    type: 'h2',
    tag: '<h2>',
    label: '<h2> 次級分區標題',
    category: 'content',
    description: '各個章節或 section 之主題標題',
    semanticRole: '分區第二級標題 (Heading 2)',
    previewContent: '最新熱門技能與推薦路徑',
    color: '#E11D48',
  },
  'p': {
    id: 'p',
    type: 'p',
    tag: '<p>',
    label: '<p> 段落內文',
    category: 'content',
    description: '排版純文字與說明的標準段落區塊',
    semanticRole: '本文文字段落 (paragraph)',
    previewContent: '透過階段式引導與即時回饋，建立穩健的資訊素養與實作自信心。',
    color: '#71717A',
  },
  'ul-li': {
    id: 'ul-li',
    type: 'ul',
    tag: '<ul> / <li>',
    label: '<ul> 無序清單與項目',
    category: 'content',
    description: '項目符號清單，適合展示並列不分先後順序的特性或條目',
    semanticRole: '無序條目清單 (unordered list)',
    previewContent: '• 完整 605 題題庫解析\n• 五大術科題組逐步解說\n• 全真計時模擬考評分',
    color: '#0284C7',
  },
  'img': {
    id: 'img',
    type: 'img',
    tag: '<img alt="...">',
    label: '<img> 具替代文字圖片',
    category: 'content',
    description: '嵌入影像，且必須包含描述圖片內容之 alt 屬性以符合無障礙規範',
    semanticRole: '具備無障礙替代文字之圖像 (image)',
    previewContent: '🖼️ [首頁形象圖：學生使用 AI 平台自主探索]',
    color: '#9333EA',
  },
  'a-button': {
    id: 'a-button',
    type: 'a',
    tag: '<a href="..." class="btn">',
    label: '<a> 動作引導超連結',
    category: 'content',
    description: '引導使用者點擊前往註冊或開始體驗之行為召喚 (CTA) 連結',
    semanticRole: '超連結或導覽錨點 (hyperlink)',
    previewContent: '👉 立即開始探索學習 →',
    color: '#CA8A04',
  },
};

export const WEB_BUILDER_LEVELS: WebBuilderLevel[] = [
  {
    id: 'wb-01',
    levelNumber: 1,
    title: '第一關：基本文件骨架',
    subtitle: '建立符合 W3C 標準規範之 HTML5 根架構',
    difficulty: '入門',
    targetDescription: '將現代網頁不可或缺的宣告與最高層級容器依正確父子層次依序排列。',
    conceptSummary: '標準的 HTML 文件必須以 <!DOCTYPE html> 開始，接續 <html> 根元素，內部再細分代表中繼設定的 <head> 與展示內容的 <body>。',
    starterBlockIds: ['head', 'doctype', 'body', 'html'],
    targetBlockSequence: ['doctype', 'html', 'head', 'body'],
    blockPool: [
      WEB_BUILDER_BLOCKS['doctype'],
      WEB_BUILDER_BLOCKS['html'],
      WEB_BUILDER_BLOCKS['head'],
      WEB_BUILDER_BLOCKS['body'],
      WEB_BUILDER_BLOCKS['footer'],
    ],
    hints: [
      '提示 1：瀏覽器解析網頁的第一步，必須先看到宣告 HTML5 規格的 <!DOCTYPE html>。',
      '提示 2：所有元素都在 <html> 內，而不可見的中繼資料 <head> 必須排在畫面主體 <body> 之前。',
    ],
    pedagogicalNotes: '本關卡引導學生建立正確的網頁骨架觀念：缺少 DOCTYPE 會導致舊版瀏覽器進入 Quirk Mode（怪異模式），且 <head> 負責網頁的靈魂中繼設定，<body> 才是視圖的主角。',
  },
  {
    id: 'wb-02',
    levelNumber: 2,
    title: '第二關：語意化地標佈局',
    subtitle: '告別傳統 <div> 湯，運用 HTML5 地標元件構築結構',
    difficulty: '基礎',
    targetDescription: '在主體畫面中正確配置頁首、主要導航、核心內容與頁尾四大語意地標。',
    conceptSummary: '語意化標籤讓搜尋引擎（SEO）與螢幕閱讀器（Accessibility）能立即辨識網頁功能分區。',
    starterBlockIds: ['footer', 'main', 'header', 'nav'],
    targetBlockSequence: ['header', 'nav', 'main', 'footer'],
    blockPool: [
      WEB_BUILDER_BLOCKS['header'],
      WEB_BUILDER_BLOCKS['nav'],
      WEB_BUILDER_BLOCKS['main'],
      WEB_BUILDER_BLOCKS['footer'],
      WEB_BUILDER_BLOCKS['h1'],
    ],
    hints: [
      '提示 1：使用者打開網頁第一個映入眼簾的是頁首 <header>，接著通常是主選單 <nav>。',
      '提示 2：頁面最關鍵的主體是 <main>，而版權與條款聲明永遠守候在最底層的 <footer>。',
    ],
    pedagogicalNotes: '本關卡強調語意化地標（Landmarks）對無障礙瀏覽的重要性。<main> 應是頁面唯一的焦點，避免將非重複的關鍵內容置於 header 或 footer 中。',
  },
  {
    id: 'wb-03',
    levelNumber: 3,
    title: '第三關：核心文章內容層級',
    subtitle: '運用正確的標題層級與圖文清單組織內容',
    difficulty: '進階',
    targetDescription: '在主題區塊內，以清晰的標題（h1、h2）、段落（p）、替代文字圖像（img）與無序清單組織專業資訊。',
    conceptSummary: '良好的階層式內容結構（H1 -> H2 -> P -> UL -> IMG）有助於視障讀者快速掌握大綱，也利於結構化資料提取。',
    starterBlockIds: ['p', 'h2', 'ul-li', 'h1', 'img'],
    targetBlockSequence: ['h1', 'p', 'h2', 'ul-li', 'img'],
    blockPool: [
      WEB_BUILDER_BLOCKS['h1'],
      WEB_BUILDER_BLOCKS['p'],
      WEB_BUILDER_BLOCKS['h2'],
      WEB_BUILDER_BLOCKS['ul-li'],
      WEB_BUILDER_BLOCKS['img'],
      WEB_BUILDER_BLOCKS['footer'],
    ],
    hints: [
      '提示 1：文章開端必須有最頂層的 <h1> 主標題，接著以簡介段落 <p> 引導。',
      '提示 2：深入講解時使用 <h2> 次標題，條列重點使用 <ul> 清單，搭配具備 alt 說明的 <img> 圖像。',
    ],
    pedagogicalNotes: '標題層級不得跳級（如直接從 h1 跳到 h3），且 <img> 標籤若無 alt 屬性將無法通過檢定與無障礙稽核。',
  },
  {
    id: 'wb-04',
    levelNumber: 4,
    title: '第四關：全端教育平台首頁組裝',
    subtitle: '將全站各功能區塊組裝為專業高可用之教育官網',
    difficulty: '整合',
    targetDescription: '從頂部導引、主視覺橫幅、主題分區、互動模組至行動呼籲，組裝完整的現代學習入口頁。',
    conceptSummary: '完整網頁整合了地標（header, nav, main, footer）與內容區塊（section, h1, cta），呈現層次分明的現代網頁設計。',
    starterBlockIds: ['section-interactive', 'footer', 'header', 'nav', 'section-course', 'a-button'],
    targetBlockSequence: ['header', 'nav', 'section-course', 'section-interactive', 'a-button', 'footer'],
    blockPool: [
      WEB_BUILDER_BLOCKS['header'],
      WEB_BUILDER_BLOCKS['nav'],
      WEB_BUILDER_BLOCKS['section-course'],
      WEB_BUILDER_BLOCKS['section-interactive'],
      WEB_BUILDER_BLOCKS['a-button'],
      WEB_BUILDER_BLOCKS['footer'],
      WEB_BUILDER_BLOCKS['doctype'],
    ],
    hints: [
      '提示 1：頂部先放置 <header> 與 <nav>，接著依序展示課程專區與遊戲互動專區。',
      '提示 2：引導使用者註冊的行動呼籲 <a> 應置於內容結束處，最後由 <footer> 作為總結。',
    ],
    pedagogicalNotes: '整合關卡訓練學生全觀的資訊架構（IA）思維，在實際網頁設計檢定中，此種由上而下、由外而內的模組化構建方式能有效避免標籤未閉合與版面破裂錯誤。',
  },
];
