/**
 * CODE TO KNOW (碼上學) - 網頁設計丙級 (17300) 術科五大題組統一教材資料庫
 * 嚴格依據勞動部技能檢定中心 173003B12 試題規範與 173003B13 官方素材檔案
 * 涵蓋題組 1 至題組 5 之：官方素材索引、Version A (官方延伸教學) / Version B (影音串流)、
 * 逐步操作指引、考場評分扣分防呆檢核點與自我查核清單。
 */

import {
  VERSION_A_CURRICULUM as TASK_5_VERSION_A,
  VERSION_B_CURRICULUM as TASK_5_VERSION_B,
  TASK_5_ASSETS_INDEX,
} from './task5CurriculumData';

export interface TaskStep {
  stepNumber: number;
  title: string;
  purpose: string;
  htmlExplanation: string;
  cssExplanation: string;
  pathUsage: string;
  commonMistakes: string;
  troubleshooting: string;
  verificationPoint: string;
  associatedAssets: string[];
}

export interface MaterialAssetIndexItem {
  filename: string;
  extension: string;
  purpose: string;
  associatedStep: number;
  category: string;
  verifiedExists: boolean;
  bytesLength: number;
}

export interface CurriculumVersionData {
  versionId: 'A' | 'B';
  name: string;
  subtitle: string;
  sourceDescription: string;
  playlistUrl?: string;
  videoUrl?: string;
  isVerified: boolean;
  steps: TaskStep[];
  selfChecklist: string[];
}

export interface UnifiedTaskCurriculum {
  taskId: number;
  code: string;
  title: string;
  officialDocReference: string;
  totalAssetsCount: number;
  assetsIndex: MaterialAssetIndexItem[];
  versionA: CurriculumVersionData;
  versionB: CurriculumVersionData;
}

// =========================================================================
// 題組一：校園社團介紹網 (17300-104301)
// 素材數量：11 個官方檔案
// =========================================================================

export const TASK_1_ASSETS_INDEX: MaterialAssetIndexItem[] = [
  { filename: '0101.jpg', extension: '.jpg', purpose: '吉他社社史配圖', associatedStep: 6, category: 'photo', verifiedExists: true, bytesLength: 946 },
  { filename: '0101.txt', extension: '.txt', purpose: '吉他社社史內文文字', associatedStep: 6, category: 'text', verifiedExists: true, bytesLength: 870 },
  { filename: '0102.jpg', extension: '.jpg', purpose: '近期活動公告配圖', associatedStep: 7, category: 'photo', verifiedExists: true, bytesLength: 19006 },
  { filename: '0102.txt', extension: '.txt', purpose: '近期活動公告內文文字', associatedStep: 7, category: 'text', verifiedExists: true, bytesLength: 778 },
  { filename: '0103.jpg', extension: '.jpg', purpose: '教學內容配圖', associatedStep: 8, category: 'photo', verifiedExists: true, bytesLength: 59884 },
  { filename: '0103.txt', extension: '.txt', purpose: '教學內容內文文字', associatedStep: 8, category: 'text', verifiedExists: true, bytesLength: 126 },
  { filename: 'logo1.png', extension: '.png', purpose: '首頁網站標題候選圖一', associatedStep: 3, category: 'logo', verifiedExists: true, bytesLength: 98176 },
  { filename: 'logo2.png', extension: '.png', purpose: '首頁網站標題候選圖二', associatedStep: 3, category: 'logo', verifiedExists: true, bytesLength: 67892 },
  { filename: 'logo3.jpg', extension: '.jpg', purpose: '首頁網站標題候選圖三', associatedStep: 3, category: 'logo', verifiedExists: true, bytesLength: 118332 },
  { filename: 'menu1.png', extension: '.png', purpose: '社團介紹選單背景按鈕', associatedStep: 4, category: 'menu', verifiedExists: true, bytesLength: 72210 },
  { filename: 'menu2.png', extension: '.png', purpose: '社團介紹選單按鈕樣式二', associatedStep: 4, category: 'menu', verifiedExists: true, bytesLength: 74532 },
];

export const TASK_1_VERSION_A: CurriculumVersionData = {
  versionId: 'A',
  name: '官方 173003B12 完整標準指引版',
  subtitle: '純 HTML5 / CSS3 語意框架與 iframe 內嵌架構',
  sourceDescription: '依據 173003B12 試題規範第 23-32 頁完整 68 項 (＊/◎) 必評項目整理。',
  isVerified: true,
  steps: [
    {
      stepNumber: 1,
      title: '環境建置與 webXX 目錄規範',
      purpose: '於 C: 磁碟建立網站根目錄 webXX (XX 為考場工作崗位號碼)，並建立 images 資料夾',
      htmlExplanation: '考場硬性規定主目錄為 C:\\webXX，所有圖片素材必須集中於 images/ 資料夾。',
      cssExplanation: '設定通用重設樣式：* { box-sizing: border-box; margin: 0; padding: 0; }',
      pathUsage: '所有相對路徑以 index.html 所在根目錄為基準 (例如 images/logo.png)。',
      commonMistakes: '若將圖片放在根目錄而非 images/，該項評分不予給分。',
      troubleshooting: '檢查資料夾名稱是否全為小寫，確認 XX 崗位號碼是否補零兩位數。',
      verificationPoint: 'C:\\webXX 與 C:\\webXX\\images 是否正確建立。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '首頁 1024×768 版面七大區塊佈局',
      purpose: '建立整體置中版面與 header(65px)、marquee(29px)、menu(215px)、content(770px)、footer(20px) 等區塊',
      htmlExplanation: '利用 <div class="main"> 包含 top, marquee, menu, content, update, footer。',
      cssExplanation: '.main { width: 1024px; height: 768px; margin: 0 auto; position: relative; }',
      pathUsage: 'index.html 為網站唯一主要入口檔案。',
      commonMistakes: '版面未水平置中扣大分；區塊尺寸超出 1024x768 出現水平滾動條。',
      troubleshooting: '以瀏覽器 F12 檢驗 body 是否水平置中無溢位。',
      verificationPoint: '尺寸精準 1024x768，無水平或垂直異常捲軸。',
      associatedAssets: [],
    },
    {
      stepNumber: 3,
      title: '網站標題區 (top) 與 圖片替換連結',
      purpose: '插入標題圖 logo.png (994x60px)，替代文字設定為「國立科技高中校園社團介紹網」，點按回首頁',
      htmlExplanation: '<a href="index.html"><img src="images/logo.png" alt="國立科技高中校園社團介紹網" width="994" height="60"></a>',
      cssExplanation: '置中於 65px 高度區塊內，超連結無外框。',
      pathUsage: 'images/logo.png (可自 logo1.png/logo2.png 挑選或轉存)。',
      commonMistakes: '忘記 alt 替代文字扣分；點按圖片未連結回 index.html。',
      troubleshooting: '滑鼠懸停圖片確認工具提示與點擊跳轉行為。',
      verificationPoint: '尺寸 994x60，alt 文字無錯別字。',
      associatedAssets: ['logo1.png', 'logo2.png', 'logo3.jpg'],
    },
    {
      stepNumber: 4,
      title: '跑馬燈廣告區 (marquee) 動態文字',
      purpose: '高度 29px、寬度 770px，標楷體 24px，文字由右向左捲動「歡迎光臨校園社團介紹網」',
      htmlExplanation: '<marquee behavior="scroll" direction="left">歡迎光臨校園社團介紹網</marquee>',
      cssExplanation: 'font-family: "標楷體", DFKai-SB; font-size: 24px; line-height: 29px;',
      pathUsage: '放置於首頁中段廣告區域。',
      commonMistakes: '文字出現錯別字、全半型錯誤每字扣分。',
      troubleshooting: '確保跑馬燈連續平順滾動，字型為標楷體。',
      verificationPoint: '標楷體 24px，文字正確無誤。',
      associatedAssets: [],
    },
    {
      stepNumber: 5,
      title: '選單區 (menu) 與 iframe 內容區連動',
      purpose: '寬 215px，社團介紹按鈕，超連結 target 指定於 iframe content 中顯示子網頁',
      htmlExplanation: '<a href="guitar_history.html" target="content">吉他社</a>',
      cssExplanation: 'display: block; text-decoration: none; color: #000000; font-size: 16px;',
      pathUsage: '超連結連動 guitar_history.html, guitar_event.html, guitar_learning.html。',
      commonMistakes: 'target 屬性未指定或寫錯，導致整頁跳轉或在新分頁開啟。',
      troubleshooting: '點擊選單按鈕確認僅 iframe 內部變換內容。',
      verificationPoint: '點擊社團按鈕於內容區載入子頁面。',
      associatedAssets: ['menu1.png', 'menu2.png'],
    },
    {
      stepNumber: 6,
      title: '吉他社社史網頁 (guitar_history.html)',
      purpose: '置頂「吉他社社史」標楷體 18px，1x3 表格導航，「回社團介紹首頁」需 target="_top"',
      htmlExplanation: '<a href="index.html" target="_top">回社團介紹首頁</a>，下方插入 0101.txt 內文與 0101.jpg。',
      cssExplanation: '表格 border: 0; 水平置中，字型大小 16px 標楷體。',
      pathUsage: '0101.txt 與 images/0101.jpg。',
      commonMistakes: '「回社團介紹首頁」未設定 target="_top"，導致 iframe 內嵌整個首頁形成巢狀分割。',
      troubleshooting: '點擊「回首頁」確認整頁跳轉，絕無頁中頁情況。',
      verificationPoint: 'target="_top" 絕對符合考場防呆規定。',
      associatedAssets: ['0101.jpg', '0101.txt'],
    },
    {
      stepNumber: 7,
      title: '吉他社近期活動公告 (guitar_event.html)',
      purpose: '置頂標題，1x3 導航表與 5x2 活動表格，文字匯入 0102.txt 與 0102.jpg',
      htmlExplanation: '利用表格呈現活動日期、活動內容，排版無錯位。',
      cssExplanation: 'table { border-collapse: collapse; } td { padding: 4px; }',
      pathUsage: 'images/0102.jpg 與 0102.txt。',
      commonMistakes: '活動日期與內容貼錯欄位；漏掉返回按鈕。',
      troubleshooting: '比對官方試題評分表表格欄位字元。',
      verificationPoint: '5x2 活動公告表格工整清晰。',
      associatedAssets: ['0102.jpg', '0102.txt'],
    },
    {
      stepNumber: 8,
      title: '吉他社教學內容 (guitar_learning.html)',
      purpose: '教學內容頁面，匯入 0103.txt 與 0103.jpg，提供課程與指法教學',
      htmlExplanation: '1x3 導航表格連動 guitar_history 與 guitar_event。',
      cssExplanation: '段落行高適中，圖片具有適當邊界。',
      pathUsage: 'images/0103.jpg 與 0103.txt。',
      commonMistakes: '導航連結指向錯誤網頁。',
      troubleshooting: '依序驗證「社史」、「公告」、「教學」三個按鈕在所有頁面均能正確互通。',
      verificationPoint: '子頁面三向互導航無死路。',
      associatedAssets: ['0103.jpg', '0103.txt'],
    },
    {
      stepNumber: 9,
      title: '日期更新區 (update) 與 最新更新日期',
      purpose: '文字顯示「最近更新日期：yyyy/mm/dd」，字型大小 16px 標楷體',
      htmlExplanation: '<span class="update-text">最近更新日期：2026/01/01</span>',
      cssExplanation: 'font-size: 16px; font-family: "標楷體"; text-align: right;',
      pathUsage: '置於首頁選單下方或指定 update 區塊。',
      commonMistakes: '格式非 yyyy/mm/dd；字元缺漏。',
      troubleshooting: '檢查年月日分隔號為半型斜線 /。',
      verificationPoint: '更新日期格式無誤。',
      associatedAssets: [],
    },
    {
      stepNumber: 10,
      title: '頁尾版權區 (footer) 與 最終備份檢驗',
      purpose: '「網頁設計：XX○○○ 國立科技高中版權所有」，將 webXX 壓縮備份至試務磁區',
      htmlExplanation: '<footer>網頁設計：01王大明 國立科技高中版權所有</footer>',
      cssExplanation: 'height: 20px; font-size: 16px; text-align: center;',
      pathUsage: '完成後全站備份至 C:\\webXX 之外的評分指定位置。',
      commonMistakes: '考生姓名或崗位號碼寫錯；未按規定做最後存檔。',
      troubleshooting: '重新整理 index.html，清除快取逐一確認所有連結正常。',
      verificationPoint: '全站功能完全通過 17300 網頁設計丙級第 1 題評審標準。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '網站根目錄 C:\\webXX 與 images 資料夾結構建立無誤',
    '全站版面 1024×768 且頁面水平置中',
    '網站標題 logo.png 尺寸 994×60 且點擊回首頁',
    '跑馬燈文字為標楷體 24px 且平順向左滾動',
    '選單區按鈕超連結目標 target="content" 正確連動 iframe',
    '吉他社社史 (guitar_history.html) 返回首頁設定 target="_top"',
    '近期活動公告 (guitar_event.html) 表格排版工整無缺字',
    '教學內容網頁 (guitar_learning.html) 圖片與文字正確呈現',
    '最近更新日期格式符合 yyyy/mm/dd 規範',
    '頁尾版權區清楚標示應檢人崗位號碼與姓名',
  ],
};

export const TASK_1_VERSION_B: CurriculumVersionData = {
  versionId: 'B',
  name: '影音串流解說引導架構版',
  subtitle: '外部影音逐步操作與重點考點對照 (待連網串流驗證)',
  sourceDescription: '彙整外部影音平台題組一完整操作教學結構，影片時間戳記待連網驗證。',
  isVerified: false,
  playlistUrl: 'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D',
  steps: [
    {
      stepNumber: 1,
      title: '考場環境快速設定與檔案準備 (影音區段 1)',
      purpose: '觀摩快速建立資料夾與軟體環境',
      htmlExplanation: '參照示範影片建立 webXX 與 images 資料夾。',
      cssExplanation: '設定基本頁面樣式。',
      pathUsage: 'C:\\webXX',
      commonMistakes: '檔名大小寫混淆。',
      troubleshooting: '檢查路徑階層。',
      verificationPoint: '【待連網驗證】影片 00:00-05:00 區段操作核對。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '主版面表格／Div 切版與置中 (影音區段 2)',
      purpose: '置中佈局實務技巧',
      htmlExplanation: '表格框架或 CSS 置中技巧示範。',
      cssExplanation: 'margin: 0 auto 實務應用。',
      pathUsage: 'index.html',
      commonMistakes: '置中屬性失效。',
      troubleshooting: '檢查父容器寬度。',
      verificationPoint: '【待連網驗證】影片 05:01-12:30 版面切分。',
      associatedAssets: [],
    },
    {
      stepNumber: 3,
      title: 'iframe 框架超連結 targets 避坑秘笈 (影音區段 3)',
      purpose: '重點掌握 target="_top" 避免嵌套失分',
      htmlExplanation: '詳細示範 target="content" 與 target="_top" 的差異。',
      cssExplanation: '無邊框 iframe 樣式。',
      pathUsage: 'guitar_history.html',
      commonMistakes: '巢狀 iframe 扣大分。',
      troubleshooting: '點擊回首頁檢驗是否跳出 iframe。',
      verificationPoint: '【待連網驗證】影片 12:31-22:00 導航連動。',
      associatedAssets: ['menu1.png', 'menu2.png'],
    },
    {
      stepNumber: 4,
      title: '三大子頁面內容快速灌入技巧 (影音區段 4)',
      purpose: '快速將 txt 與 jpg 貼入各子頁面',
      htmlExplanation: '社史、活動、教學三頁排版。',
      cssExplanation: '表格間距與字型大小設定。',
      pathUsage: '0101.txt, 0102.txt, 0103.txt',
      commonMistakes: '文字亂碼或全半形錯誤。',
      troubleshooting: '使用 UTF-8 儲存文件。',
      verificationPoint: '【待連網驗證】影片 22:01-35:00 內文排版。',
      associatedAssets: ['0101.jpg', '0102.jpg', '0103.jpg'],
    },
    {
      stepNumber: 5,
      title: '跑馬燈與更新日期快速收尾 (影音區段 5)',
      purpose: '確認跑馬燈字型大小與日期格式',
      htmlExplanation: 'marquee 標籤與 span 樣式。',
      cssExplanation: '標楷體設定。',
      pathUsage: 'index.html',
      commonMistakes: '忘記設定標楷體。',
      troubleshooting: '檢查 font-family。',
      verificationPoint: '【待連網驗證】影片 35:01-42:00 細節補正。',
      associatedAssets: [],
    },
    {
      stepNumber: 6,
      title: '考前 10 分鐘全功能自我檢查 (影音區段 6)',
      purpose: '考場監評評分標準逐項自檢',
      htmlExplanation: '逐一驗證各超連結與圖片。',
      cssExplanation: '檢驗無水平滾動條。',
      pathUsage: '全站',
      commonMistakes: '忽略評分表中微小錯字。',
      troubleshooting: '以評分表逐行對照。',
      verificationPoint: '【待連網驗證】影片 42:01-50:00 總驗收。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '觀摩環境設定與檔案建立實務流程',
    '確認版面置中與七大區塊尺寸計算',
    '理解 iframe target="_top" 核心防呆重點',
    '練習三大子頁面快速表格圖文排版',
    '完成跑馬燈、日期與頁尾版權收尾',
    '比對 173003B12 評審表逐項通過檢查',
  ],
};

// =========================================================================
// 題組二：運動廣場連結網 (17300-104302)
// 素材數量：21 個官方檔案 (含 jquery-2.1.4.min.js)
// =========================================================================

export const TASK_2_ASSETS_INDEX: MaterialAssetIndexItem[] = [
  { filename: '0201.png', extension: '.png', purpose: '背景小圖紋理', associatedStep: 2, category: 'texture', verifiedExists: true, bytesLength: 322 },
  { filename: '0201.txt', extension: '.txt', purpose: '運動廣場簡介說明內文', associatedStep: 3, category: 'text', verifiedExists: true, bytesLength: 206 },
  { filename: '0202.txt', extension: '.txt', purpose: '健康天地說明文字', associatedStep: 4, category: 'text', verifiedExists: true, bytesLength: 88 },
  { filename: '0202A.png', extension: '.png', purpose: '籃球大圖', associatedStep: 5, category: 'photo_large', verifiedExists: true, bytesLength: 11605204 },
  { filename: '0202B.png', extension: '.png', purpose: '籃球縮圖按鈕', associatedStep: 5, category: 'photo_thumb', verifiedExists: true, bytesLength: 29311 },
  { filename: '0203.txt', extension: '.txt', purpose: '籃球介紹內文', associatedStep: 5, category: 'text', verifiedExists: true, bytesLength: 10455 },
  { filename: '0203A.png', extension: '.png', purpose: '棒球大圖', associatedStep: 6, category: 'photo_large', verifiedExists: true, bytesLength: 5867907 },
  { filename: '0203B.png', extension: '.png', purpose: '棒球縮圖按鈕', associatedStep: 6, category: 'photo_thumb', verifiedExists: true, bytesLength: 22765 },
  { filename: '0204.txt', extension: '.txt', purpose: '棒球介紹內文', associatedStep: 6, category: 'text', verifiedExists: true, bytesLength: 1439 },
  { filename: '0204A.png', extension: '.png', purpose: '游泳大圖', associatedStep: 7, category: 'photo_large', verifiedExists: true, bytesLength: 1203368 },
  { filename: '0204B.png', extension: '.png', purpose: '游泳縮圖按鈕', associatedStep: 7, category: 'photo_thumb', verifiedExists: true, bytesLength: 32900 },
  { filename: '0205.txt', extension: '.txt', purpose: '游泳介紹內文', associatedStep: 7, category: 'text', verifiedExists: true, bytesLength: 1114 },
  { filename: '0205A.png', extension: '.png', purpose: '田徑大圖', associatedStep: 8, category: 'photo_large', verifiedExists: true, bytesLength: 1023983 },
  { filename: '0205B.png', extension: '.png', purpose: '田徑縮圖按鈕', associatedStep: 8, category: 'photo_thumb', verifiedExists: true, bytesLength: 30138 },
  { filename: '0206.png', extension: '.png', purpose: '訪客留言區圖示', associatedStep: 9, category: 'icon', verifiedExists: true, bytesLength: 58956 },
  { filename: '0206.txt', extension: '.txt', purpose: '訪客留言說明文字', associatedStep: 9, category: 'text', verifiedExists: true, bytesLength: 1073 },
  { filename: '0207.png', extension: '.png', purpose: '資料來源圖示', associatedStep: 10, category: 'icon', verifiedExists: true, bytesLength: 284744 },
  { filename: '0207.txt', extension: '.txt', purpose: '資料來源說明文字', associatedStep: 10, category: 'text', verifiedExists: true, bytesLength: 108 },
  { filename: '0208.txt', extension: '.txt', purpose: '頁尾版權文字', associatedStep: 10, category: 'text', verifiedExists: true, bytesLength: 191 },
  { filename: 'jquery-2.1.4.min.js', extension: '.js', purpose: '官方提供之 jQuery 核心函式庫 (用於頁籤 Tab 與縮圖切換)', associatedStep: 5, category: 'library', verifiedExists: true, bytesLength: 84345 },
  { filename: 'logo.png', extension: '.png', purpose: '網站主標題圖片', associatedStep: 2, category: 'logo', verifiedExists: true, bytesLength: 24205 },
];

export const TASK_2_VERSION_A: CurriculumVersionData = {
  versionId: 'A',
  name: '官方 173003B12 標準指引版 (jQuery / 原生 JS)',
  subtitle: '運動廣場連結網、最新消息帶狀排版與 Tab 縮圖互動',
  sourceDescription: '依據 173003B12 試題規範第 33-41 頁完整 43 項 (＊/◎) 必評項目整理。',
  isVerified: true,
  steps: [
    {
      stepNumber: 1,
      title: '建立 webXX、images、results、others 資料夾',
      purpose: '依照試題規定在 webXX 下建立 images、results 與 others 三個子資料夾',
      htmlExplanation: '試題特殊要求：results 存放 main.html, health.html 等子網頁，images 放圖，others 放未指定檔案。',
      cssExplanation: '設定基本 CSS 重設。',
      pathUsage: 'C:\\webXX\\results 與 C:\\webXX\\images。',
      commonMistakes: '未建立 results 資料夾或檔案路徑混亂扣分。',
      troubleshooting: '檢查 results 資料夾名稱拼寫是否完全符合。',
      verificationPoint: '四個標準資料夾結構正確建立。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '首頁 1024×768 置中版面與 logo.png 標題',
      purpose: '置中版面設計，標題區插入 logo.png，設定文字陰影與替代文字',
      htmlExplanation: '<img src="images/logo.png" alt="運動廣場連結網" width="..." height="...">',
      cssExplanation: 'text-shadow: 2px 2px 4px #888888; 樣式應用。',
      pathUsage: 'images/logo.png',
      commonMistakes: '標題替代文字未設定或拼寫錯誤。',
      troubleshooting: '檢查圖片 alt 屬性。',
      verificationPoint: '標題區圖文呈現完整且帶有陰影效果。',
      associatedAssets: ['logo.png', '0201.png'],
    },
    {
      stepNumber: 3,
      title: '選單區與主內容區 results/main.html 串接',
      purpose: '左側選單區連動右側內容區 iframe，預設載入 results/main.html',
      htmlExplanation: '<iframe name="content" src="results/main.html"></iframe>',
      cssExplanation: 'width: 770px; height: 500px; border: none;',
      pathUsage: 'results/main.html 與 0201.txt 簡介文字。',
      commonMistakes: 'iframe 路徑寫錯導致初始畫面 404 空白。',
      troubleshooting: '確認首頁預設能夠正確顯示 main.html。',
      verificationPoint: '首頁順利載入運動廣場首頁介紹。',
      associatedAssets: ['0201.txt'],
    },
    {
      stepNumber: 4,
      title: '健康天地 (health.html) 與 表格排版',
      purpose: '製作健康天地頁面，呈現 0202.txt 內容與相關運動健康資訊',
      htmlExplanation: '利用乾淨表格排版呈現健康資訊。',
      cssExplanation: '字型 16px 標楷體，行高適當。',
      pathUsage: 'results/health.html 與 0202.txt。',
      commonMistakes: '內文格式與段落未適當斷行。',
      troubleshooting: '比對題目文字檔換行與標點符號。',
      verificationPoint: '健康天地圖文正常顯示。',
      associatedAssets: ['0202.txt'],
    },
    {
      stepNumber: 5,
      title: '籃球介紹 (basketball.html) 與 大小圖切換',
      purpose: '點擊縮圖 0202B.png 切換顯示大圖 0202A.png，載入 0203.txt 與 jQuery',
      htmlExplanation: '<script src="../images/jquery-2.1.4.min.js"></script> 實作縮圖點擊換圖。',
      cssExplanation: '縮圖加邊框游標變 pointer：cursor: pointer; border: 1px solid #ccc;',
      pathUsage: '0202A.png (大圖), 0202B.png (縮圖), 0203.txt。',
      commonMistakes: '大圖檔案極大 (11MB)，直接用 img 縮小會嚴重卡頓，需正確處理大圖顯示容器。',
      troubleshooting: '以 JS 切換 img src 或 CSS 容器展示。',
      verificationPoint: '點擊縮圖順暢切換大圖，說明文字完整。',
      associatedAssets: ['0202A.png', '0202B.png', '0203.txt', 'jquery-2.1.4.min.js'],
    },
    {
      stepNumber: 6,
      title: '棒球介紹 (baseball.html) 圖文排版',
      purpose: '比照籃球模式製作棒球介紹，切換 0203B 縮圖與 0203A 大圖，匯入 0204.txt',
      htmlExplanation: '縮圖點選即時變換主圖顯示區。',
      cssExplanation: '延用統一的縮圖展示 CSS 樣式。',
      pathUsage: '0203A.png, 0203B.png, 0204.txt。',
      commonMistakes: '複製上一頁代碼忘記更改圖片 ID 或檔案路徑。',
      troubleshooting: '點擊確認大圖為棒球比賽圖樣。',
      verificationPoint: '棒球頁面縮圖與大圖正常切換。',
      associatedAssets: ['0203A.png', '0203B.png', '0204.txt'],
    },
    {
      stepNumber: 7,
      title: '游泳介紹 (swimming.html) 圖文排版',
      purpose: '比照前述模式製作游泳介紹，切換 0204B 與 0204A，匯入 0205.txt',
      htmlExplanation: '呈現游泳競賽與技巧解說。',
      cssExplanation: '排版與籃球、棒球維持視覺風格一致。',
      pathUsage: '0204A.png, 0204B.png, 0205.txt。',
      commonMistakes: '素材檔名編號混淆 (0204A 為游泳)。',
      troubleshooting: '檢查圖片與文字是否互相吻合。',
      verificationPoint: '游泳頁面圖文切換正常。',
      associatedAssets: ['0204A.png', '0204B.png', '0205.txt'],
    },
    {
      stepNumber: 8,
      title: '田徑介紹 (track.html) 圖文排版',
      purpose: '製作田徑介紹頁面，切換 0205B 與 0205A 大圖',
      htmlExplanation: '縮圖點擊切換 0205A.png。',
      cssExplanation: '確保所有運動項目子頁面具備回首頁超連結。',
      pathUsage: '0205A.png, 0205B.png。',
      commonMistakes: '回首頁忘記設定 target="_top"。',
      troubleshooting: '測試返回首頁按鈕是否整頁返回。',
      verificationPoint: '田徑頁面各功能正確無誤。',
      associatedAssets: ['0205A.png', '0205B.png'],
    },
    {
      stepNumber: 9,
      title: '訪客留言表單 (message.html)',
      purpose: '建立姓名、電子郵件、留言內容之互動表單，搭配 0206.png 與 0206.txt',
      htmlExplanation: '<form><input type="text" name="name"><textarea name="content"></textarea><button type="reset">重設</button></form>',
      cssExplanation: '表單輸入欄位寬度與對齊設定。',
      pathUsage: '0206.png, 0206.txt。',
      commonMistakes: '表單缺少 reset 重設按鈕或按鈕功能失效。',
      troubleshooting: '點擊「重設」按鈕確認表單內容完全清空。',
      verificationPoint: '表單具備輸入與重設完整功能。',
      associatedAssets: ['0206.png', '0206.txt'],
    },
    {
      stepNumber: 10,
      title: '資料來源與頁尾版權 (footer) 最終備份',
      purpose: '資料來源頁面呈現 0207.png/0207.txt，頁尾呈現 0208.txt 考生版權資訊，完整備份',
      htmlExplanation: '<footer> 呈現應檢人崗位號碼與姓名。',
      cssExplanation: '置中顯示，字型大小 16px。',
      pathUsage: '0207.png, 0207.txt, 0208.txt。',
      commonMistakes: '資料來源頁漏做；未在根目錄備份。',
      troubleshooting: '自首頁點選所有 6 大選單項目逐一驗收。',
      verificationPoint: '題組二全部功能通過 173003B12 評分標準。',
      associatedAssets: ['0207.png', '0207.txt', '0208.txt'],
    },
  ],
  selfChecklist: [
    '正確建立 webXX、images、results 與 others 四個目錄',
    '版面 1024×768 水平置中且帶有文字陰影效果',
    '選單點擊於 iframe 正確載入 results/ 各子網頁',
    '使用 jQuery 或原生 JS 順暢實現大圖/縮圖切換',
    '四大運動項目 (籃球、棒球、游泳、田徑) 圖文完全相符',
    '訪客留言表單具備文字輸入欄位與重設清除功能',
    '資料來源與頁尾版權標明崗位號碼與應檢人姓名',
    '返回首頁設定 target="_top" 避免畫面多重嵌套',
  ],
};

export const TASK_2_VERSION_B: CurriculumVersionData = {
  versionId: 'B',
  name: '影音串流解說引導架構版',
  subtitle: '運動廣場大圖切換與表單排版影音指引 (待連網串流驗證)',
  sourceDescription: '彙整外部影音平台題組二完整操作教學結構，影片時間戳記待連網驗證。',
  isVerified: false,
  playlistUrl: 'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D',
  steps: [
    { stepNumber: 1, title: '題組二專屬目錄架構建置 (影音 1)', purpose: 'results 與 images 資料夾劃分', htmlExplanation: '建立標準目錄結構。', cssExplanation: '基本樣式。', pathUsage: 'C:\\webXX', commonMistakes: '路徑錯誤。', troubleshooting: '檢查資料夾。', verificationPoint: '【待連網驗證】00:00-06:00', associatedAssets: [] },
    { stepNumber: 2, title: '主頁面陰影與版面佈局 (影音 2)', purpose: '文字陰影 CSS3 撰寫', htmlExplanation: '主結構切版。', cssExplanation: 'text-shadow 屬性示範。', pathUsage: 'index.html', commonMistakes: '陰影參數混淆。', troubleshooting: '檢查 CSS。', verificationPoint: '【待連網驗證】06:01-14:00', associatedAssets: ['logo.png'] },
    { stepNumber: 3, title: 'jQuery 縮圖點選切換大圖 (影音 3)', purpose: '核心切圖 JS 寫法', htmlExplanation: '點擊事件監聽與圖片替換。', cssExplanation: '游標樣式。', pathUsage: 'jquery-2.1.4.min.js', commonMistakes: '大圖過重延遲。', troubleshooting: '檢查 JS 控制邏輯。', verificationPoint: '【待連網驗證】14:01-28:00', associatedAssets: ['jquery-2.1.4.min.js'] },
    { stepNumber: 4, title: '訪客留言表單元件製作 (影音 4)', purpose: '表單各輸入項與重設按鈕', htmlExplanation: 'form 標籤設定。', cssExplanation: '表單對齊。', pathUsage: 'results/message.html', commonMistakes: 'reset 失效。', troubleshooting: '測試重設按鈕。', verificationPoint: '【待連網驗證】28:01-38:00', associatedAssets: ['0206.png'] },
    { stepNumber: 5, title: '全站連結與考場防呆測試 (影音 5)', purpose: '監評評分標準逐項驗證', htmlExplanation: '確認無破圖。', cssExplanation: '檢驗無水平滾動條。', pathUsage: '全站', commonMistakes: '未備份。', troubleshooting: '全功能巡檢。', verificationPoint: '【待連網驗證】38:01-46:00', associatedAssets: [] },
  ],
  selfChecklist: [
    '觀摩 results/ 資料夾特殊目錄架構',
    '掌握 jQuery 縮圖換大圖核心操作',
    '完成訪客留言表單與重設功能',
    '比對 173003B12 評分標準通過測試',
  ],
};

// =========================================================================
// 題組三：國家公園介紹網 (17300-104303)
// 素材數量：16 個官方檔案 (含 park.mp3 與 影像地圖素材)
// =========================================================================

export const TASK_3_ASSETS_INDEX: MaterialAssetIndexItem[] = [
  { filename: '0301.txt', extension: '.txt', purpose: '國家公園介紹引言文字', associatedStep: 3, category: 'text', verifiedExists: true, bytesLength: 712 },
  { filename: 'national_park.jpg', extension: '.jpg', purpose: '首頁主視覺大圖 (用於影像地圖 Image Map)', associatedStep: 4, category: 'map_image', verifiedExists: true, bytesLength: 63678 },
  { filename: 'park.mp3', extension: '.mp3', purpose: '背景音樂與音效下載檔案', associatedStep: 2, category: 'music', verifiedExists: true, bytesLength: 517645 },
  { filename: 'park0301.jpg', extension: '.jpg', purpose: '陽明山國家公園景觀大圖', associatedStep: 5, category: 'park_photo', verifiedExists: true, bytesLength: 49486 },
  { filename: 'park0302.jpg', extension: '.jpg', purpose: '雪霸國家公園景觀大圖', associatedStep: 6, category: 'park_photo', verifiedExists: true, bytesLength: 6300 },
  { filename: 'park0303.jpg', extension: '.jpg', purpose: '太魯閣國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 3709 },
  { filename: 'park0304.jpg', extension: '.jpg', purpose: '玉山國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 10803 },
  { filename: 'park0305.jpg', extension: '.jpg', purpose: '墾丁國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 4982 },
  { filename: 'park0306.jpg', extension: '.jpg', purpose: '金門國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 23895 },
  { filename: 'park0307.jpg', extension: '.jpg', purpose: '東沙環礁國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 22115 },
  { filename: 'park0308.jpg', extension: '.jpg', purpose: '台江國家公園景觀大圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 29811 },
  { filename: 'park0309.jpg', extension: '.jpg', purpose: '澎湖南方四島景觀圖', associatedStep: 7, category: 'park_photo', verifiedExists: true, bytesLength: 24299 },
  { filename: 'park0310.jpg', extension: '.jpg', purpose: '國家公園地圖定位標記圖', associatedStep: 4, category: 'marker', verifiedExists: true, bytesLength: 18535 },
  { filename: 'park0311.jpg', extension: '.jpg', purpose: '園區生態觀察圖一', associatedStep: 5, category: 'nature', verifiedExists: true, bytesLength: 18420 },
  { filename: 'park0312.jpg', extension: '.jpg', purpose: '園區生態觀察圖二', associatedStep: 6, category: 'nature', verifiedExists: true, bytesLength: 28600 },
  { filename: 'park0313.jpg', extension: '.jpg', purpose: '園區生態觀察圖三', associatedStep: 6, category: 'nature', verifiedExists: true, bytesLength: 7427 },
];

export const TASK_3_VERSION_A: CurriculumVersionData = {
  versionId: 'A',
  name: '官方 173003B12 標準指引版 (影像地圖 & 音樂自動播放)',
  subtitle: '國家公園介紹網、多邊形影像地圖 (Image Map) 與多媒體音訊',
  sourceDescription: '依據 173003B12 試題規範第 42-46 頁完整 34 項 (＊/◎) 必評項目整理。',
  isVerified: true,
  steps: [
    {
      stepNumber: 1,
      title: '建立 webXX、images、park、others 目錄',
      purpose: '依照試題規範建立 park 目錄存放國家公園子頁面，images 存放圖片，music 存放音效',
      htmlExplanation: 'C:\\webXX\\park 資料夾放置 yangmingshan.html 與 sheipa.html。',
      cssExplanation: '設定標準重設樣式。',
      pathUsage: 'C:\\webXX\\park',
      commonMistakes: '子頁面未放入 park/ 資料夾直接扣分。',
      troubleshooting: '檢查子網頁實體存放路徑。',
      verificationPoint: '目錄結構包含 park 資料夾且命名正確。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '首頁 1024×768 版面與 背景音樂 park.mp3',
      purpose: '置中版面佈局，載入 park.mp3 設定自動播放與循環播放',
      htmlExplanation: '<audio src="park.mp3" autoplay loop controls></audio>',
      cssExplanation: 'audio 元件可依考場規定設為隱藏或固定於指定播放列。',
      pathUsage: 'park.mp3',
      commonMistakes: '音訊未設定 loop 循環播放；或路徑錯誤無聲音。',
      troubleshooting: '載入頁面確認揚聲器立即播放國家公園背景音樂。',
      verificationPoint: '音訊進入網頁自動播放且循環不中斷。',
      associatedAssets: ['park.mp3'],
    },
    {
      stepNumber: 3,
      title: '跑馬燈廣告與 0301.txt 引言呈現',
      purpose: '跑馬燈呈現歡迎詞，左側選單區連動右側內容區呈現 0301.txt 國家公園簡介',
      htmlExplanation: '<marquee>歡迎光臨國家公園介紹網...</marquee>',
      cssExplanation: '字型標楷體 24px，文字清晰無鋸齒。',
      pathUsage: '0301.txt',
      commonMistakes: '跑馬燈出現錯別字。',
      troubleshooting: '檢查文字全半型符號。',
      verificationPoint: '跑馬燈滾動平順，引言文字排版工整。',
      associatedAssets: ['0301.txt'],
    },
    {
      stepNumber: 4,
      title: '核心重點：national_park.jpg 影像地圖 (Image Map)',
      purpose: '在台灣地圖圖片上劃分陽明山 (矩形 rect) 與雪霸 (多邊形 poly) 點擊感應熱區',
      htmlExplanation: '<img src="images/national_park.jpg" usemap="#parkmap"><map name="parkmap"><area shape="rect" coords="..." href="park/yangmingshan.html" target="content"><area shape="poly" coords="..." href="park/sheipa.html" target="content"></map>',
      cssExplanation: 'img 需設定 border: 0 避免預設超連結藍色外框。',
      pathUsage: 'images/national_park.jpg, park0310.jpg。',
      commonMistakes: '熱區 coords 座標偏差過大；未指定 target="content"。',
      troubleshooting: '滑鼠在地圖台灣北部與中部移動確認游標變更為手形。',
      verificationPoint: '矩形與多邊形熱區點擊能精準跳轉對應國家公園。',
      associatedAssets: ['national_park.jpg', 'park0310.jpg'],
    },
    {
      stepNumber: 5,
      title: '陽明山國家公園 (yangmingshan.html) 圖文排版',
      purpose: '呈現 park0301.jpg 主圖與 park0311.jpg 生態圖，提供公園介紹',
      htmlExplanation: '表格排版展示地理位置、地質景觀與動植物生態。',
      cssExplanation: '圖片添加適度間距與陰影樣式。',
      pathUsage: 'park/yangmingshan.html, park0301.jpg, park0311.jpg。',
      commonMistakes: '圖片替代文字遺漏。',
      troubleshooting: '檢查 alt 標籤。',
      verificationPoint: '陽明山圖文排版工整清晰。',
      associatedAssets: ['park0301.jpg', 'park0311.jpg'],
    },
    {
      stepNumber: 6,
      title: '雪霸國家公園 (sheipa.html) 圖文與生態圖',
      purpose: '呈現 park0302.jpg 與 park0312/0313 生態圖，包含登山步道指南',
      htmlExplanation: '利用多欄表格呈現雪霸國家公園特色。',
      cssExplanation: '與陽明山頁面維持相同字型規範。',
      pathUsage: 'park/sheipa.html, park0302.jpg, park0312.jpg, park0313.jpg。',
      commonMistakes: '忘記提供「回首頁」或回地圖按鈕。',
      troubleshooting: '確認返回首頁設定 target="_top"。',
      verificationPoint: '雪霸介紹內容完整，導航順暢。',
      associatedAssets: ['park0302.jpg', 'park0312.jpg', 'park0313.jpg'],
    },
    {
      stepNumber: 7,
      title: '頁尾版權與全站驗證備份',
      purpose: '標記應檢人崗位號碼與姓名，完整測試所有熱區點擊並進行備份',
      htmlExplanation: '<footer>網頁設計：XX○○○ 國家公園介紹網版權所有</footer>',
      cssExplanation: '水平置中，字型大小 16px。',
      pathUsage: '全站',
      commonMistakes: '音訊在部分瀏覽器未能自動發聲。',
      troubleshooting: '檢查音效自動播放策略，確保評分當下聲音可正常傳送。',
      verificationPoint: '題組三全項目符合 173003B12 評審規範。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '建立 webXX、images、park 與 others 目錄無誤',
    '背景音樂 park.mp3 於進入網頁後自動循環播放',
    '首頁 1024×768 置中，跑馬燈文字無錯漏',
    'national_park.jpg 影像地圖 rect/poly 熱區座標點選精確',
    '熱區超連結 target="content" 正確載入 park/ 子網頁',
    '陽明山與雪霸子網頁圖文豐富且具備返回首頁 target="_top"',
    '頁尾版權資訊齊全且無溢位滾動條',
  ],
};

export const TASK_3_VERSION_B: CurriculumVersionData = {
  versionId: 'B',
  name: '影音串流解說引導架構版',
  subtitle: '國家公園影像地圖座標抓取與多媒體影音指引 (待連網串流驗證)',
  sourceDescription: '彙整外部影音平台題組三完整操作教學結構，影片時間戳記待連網驗證。',
  isVerified: false,
  playlistUrl: 'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D',
  steps: [
    { stepNumber: 1, title: '音樂標籤與目錄架構實務 (影音 1)', purpose: 'audio 自動播放語法技巧', htmlExplanation: 'audio autoplay loop 設定。', cssExplanation: '基本樣式。', pathUsage: 'park.mp3', commonMistakes: '音訊失效。', troubleshooting: '檢查路徑。', verificationPoint: '【待連網驗證】00:00-08:00', associatedAssets: ['park.mp3'] },
    { stepNumber: 2, title: '影像地圖 (Image Map) 座標快速抓取 (影音 2)', purpose: 'rect 與 poly 座標提取工具', htmlExplanation: 'map/area 語法。', cssExplanation: '地圖定位。', pathUsage: 'images/national_park.jpg', commonMistakes: '座標算錯。', troubleshooting: '檢視選取區。', verificationPoint: '【待連網驗證】08:01-20:00', associatedAssets: ['national_park.jpg'] },
    { stepNumber: 3, title: '子頁面 park 目錄架構切換 (影音 3)', purpose: '陽明山與雪霸內容置入', htmlExplanation: '子網頁排版。', cssExplanation: '表格樣式。', pathUsage: 'park/yangmingshan.html', commonMistakes: '路徑層級錯亂。', troubleshooting: '檢查 ../ 相對路徑。', verificationPoint: '【待連網驗證】20:01-32:00', associatedAssets: ['park0301.jpg', 'park0302.jpg'] },
    { stepNumber: 4, title: '考前除錯與熱區驗證 (影音 4)', purpose: '確認點選地圖即時連動', htmlExplanation: '全面點擊測試。', cssExplanation: '版面檢核。', pathUsage: '全站', commonMistakes: '忘記備份。', troubleshooting: '逐頁巡檢。', verificationPoint: '【待連網驗證】32:01-40:00', associatedAssets: [] },
  ],
  selfChecklist: [
    '觀摩音訊自動播放與考場相容性處理',
    '精確學會影像地圖多邊形與矩形熱區設定',
    '確認 park/ 子目錄所有相對路徑正確無誤',
    '完成所有評分規準檢驗',
  ],
};

// =========================================================================
// 題組四：網路行銷購物網 (17300-104304)
// 素材數量：12 個官方檔案 (含 0401.mp3 與 精品皮包商品照片)
// =========================================================================

export const TASK_4_ASSETS_INDEX: MaterialAssetIndexItem[] = [
  { filename: '0401.jpg', extension: '.jpg', purpose: '購物網站標誌圖 (logo)', associatedStep: 2, category: 'logo', verifiedExists: true, bytesLength: 2265 },
  { filename: '0401.mp3', extension: '.mp3', purpose: '網站精品背景音樂', associatedStep: 2, category: 'music', verifiedExists: true, bytesLength: 517645 },
  { filename: '0401.txt', extension: '.txt', purpose: '精品購物網簡介文字', associatedStep: 3, category: 'text', verifiedExists: true, bytesLength: 231 },
  { filename: '0402.jpg', extension: '.jpg', purpose: '商品特惠廣告小圖', associatedStep: 3, category: 'ad_banner', verifiedExists: true, bytesLength: 1288 },
  { filename: '0402.txt', extension: '.txt', purpose: '購物說明與退換貨條款文字', associatedStep: 4, category: 'text', verifiedExists: true, bytesLength: 204 },
  { filename: '0403.jpg', extension: '.jpg', purpose: '男用真皮皮夾照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 87704 },
  { filename: '0404.jpg', extension: '.jpg', purpose: '女用時尚手提包照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 55178 },
  { filename: '0405.jpg', extension: '.jpg', purpose: '商務公事包照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 79756 },
  { filename: '0406.jpg', extension: '.jpg', purpose: '休閒後背包照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 69762 },
  { filename: '0407.jpg', extension: '.jpg', purpose: '旅行多功能側背包照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 33564 },
  { filename: '0408.jpg', extension: '.jpg', purpose: '經典零錢包照片', associatedStep: 5, category: 'product', verifiedExists: true, bytesLength: 35040 },
  { filename: '0409.jpg', extension: '.jpg', purpose: '購買成功感謝確認小圖', associatedStep: 6, category: 'confirm_icon', verifiedExists: true, bytesLength: 2046 },
];

export const TASK_4_VERSION_A: CurriculumVersionData = {
  versionId: 'A',
  name: '官方 173003B12 標準指引版 (3×3 精品展示 & 新視窗超連結)',
  subtitle: '網路行銷購物網、表格九宮格精品排版與 target="_blank" 視窗連動',
  sourceDescription: '依據 173003B12 試題規範第 47-56 頁完整 48 項 (＊/◎) 必評項目整理。',
  isVerified: true,
  steps: [
    {
      stepNumber: 1,
      title: '建立 webXX、images、music、results 目錄',
      purpose: '依照試題規範建立標準四層資料夾，music 放音效，results 放商品詳細頁',
      htmlExplanation: 'C:\\webXX\\results 放置 leather1.html 與 leather2.html。',
      cssExplanation: '基本重設 CSS 樣式。',
      pathUsage: 'C:\\webXX\\results 與 C:\\webXX\\music。',
      commonMistakes: 'music 或 results 資料夾名稱拼寫錯誤扣分。',
      troubleshooting: '檢查子資料夾拼寫無誤。',
      verificationPoint: '目錄完整包含 images, music, results。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '首頁 1024×768 置中版面與 背景音樂 0401.mp3',
      purpose: '置中版面設計，標題區置入 0401.jpg，背景音樂自動播放並循環播放',
      htmlExplanation: '<audio src="music/0401.mp3" autoplay loop controls></audio>',
      cssExplanation: '寬度 1024px，水平置中 margin: 0 auto;',
      pathUsage: 'music/0401.mp3, images/0401.jpg。',
      commonMistakes: '音樂未設定 loop 循環；logo 圖替代文字遺漏。',
      troubleshooting: '檢查音樂自動循環，確認 logo 圖 alt 屬性。',
      verificationPoint: '精品音樂自動循環播放且版面水平置中。',
      associatedAssets: ['0401.jpg', '0401.mp3'],
    },
    {
      stepNumber: 3,
      title: '跑馬燈廣告與 0401.txt 購物網簡介',
      purpose: '跑馬燈呈現促銷好康訊息，內容區載入 0401.txt 與 0402.jpg 促銷橫幅',
      htmlExplanation: '<marquee>超值精品下殺特惠中...</marquee>',
      cssExplanation: '標楷體 24px，line-height 與高度匹配。',
      pathUsage: '0401.txt, images/0402.jpg。',
      commonMistakes: '文字出現錯字；跑馬燈方向未依試題向左滾動。',
      troubleshooting: '比對文字檔確保字字精確。',
      verificationPoint: '跑馬燈與簡介文字完整呈現。',
      associatedAssets: ['0401.txt', '0402.jpg'],
    },
    {
      stepNumber: 4,
      title: '購物須知 (purchase.html) 與 條款說明',
      purpose: '製作購物須知網頁，呈現 0402.txt 付款方式、出貨時間與退換貨說明',
      htmlExplanation: '工整表格排版呈現購買須知與購物車引導。',
      cssExplanation: '字型大小 16px 標楷體，顏色符合考場規定。',
      pathUsage: 'results/purchase.html, 0402.txt。',
      commonMistakes: '未設定返回首頁 target="_top"。',
      troubleshooting: '點擊返回按鈕確認整頁跳轉。',
      verificationPoint: '購物須知內容完備且導航通暢。',
      associatedAssets: ['0402.txt'],
    },
    {
      stepNumber: 5,
      title: '3×3 表格九宮格精品圖文商品展示',
      purpose: '使用 3×3 表格展示 0403.jpg～0408.jpg 六款精品皮包照片、商品名稱與價格',
      htmlExplanation: '表格每欄放置商品圖片、名稱、價格與「立即購買」按鈕。',
      cssExplanation: 'table { width: 100%; border: 0; } td { text-align: center; }',
      pathUsage: 'images/0403.jpg 至 0408.jpg。',
      commonMistakes: '商品價格與圖片對應錯誤；表格外框未依規定隱藏。',
      troubleshooting: '檢查每款商品標價與試題配圖一一吻合。',
      verificationPoint: '六款精品皮包整齊排版無跑版。',
      associatedAssets: ['0403.jpg', '0404.jpg', '0405.jpg', '0406.jpg', '0407.jpg', '0408.jpg'],
    },
    {
      stepNumber: 6,
      title: '重點考點：真皮皮包與短夾 超連結 target="_blank"',
      purpose: '試題硬性規定：特定商品點擊後必須在全新視窗 target="_blank" 開啟詳細頁',
      htmlExplanation: '<a href="results/leather1.html" target="_blank"><img src="images/0403.jpg"></a>',
      cssExplanation: '超連結圖片無外框：a img { border: none; }',
      pathUsage: 'results/leather1.html, results/leather2.html。',
      commonMistakes: '忘記設定 target="_blank" 扣大分（考場必查防呆點）。',
      troubleshooting: '點擊商品圖片確認瀏覽器確實開啟新分頁/新視窗。',
      verificationPoint: '點選特定皮包在新視窗彈出商品詳細頁面。',
      associatedAssets: ['0403.jpg', '0404.jpg'],
    },
    {
      stepNumber: 7,
      title: '購買確認對話框 (message.html) 與 0409.jpg',
      purpose: '點擊立即購買按鈕彈出購買確認提示，或跳轉 message.html 呈現 0409.jpg',
      htmlExplanation: '<script>function buyConfirm() { alert("感謝您的訂購，我們將盡快為您安排出貨！"); }</script>',
      cssExplanation: '按鈕具有明確 hover 效果。',
      pathUsage: 'images/0409.jpg, results/message.html。',
      commonMistakes: '按鈕點擊無反應或 JS 報錯。',
      troubleshooting: '點擊購買按鈕確認彈跳視窗或跳轉確認頁。',
      verificationPoint: '購買互動流暢無阻礙。',
      associatedAssets: ['0409.jpg'],
    },
    {
      stepNumber: 8,
      title: '頁尾版權 (footer) 與 最終全站評審備份',
      purpose: '標記應檢人崗位號碼與姓名，完整巡檢所有新視窗連結並存檔備份',
      htmlExplanation: '<footer>網頁設計：XX○○○ 網路行銷購物網版權所有</footer>',
      cssExplanation: '高度適中，水平置中對齊。',
      pathUsage: '全站',
      commonMistakes: '未備份至指定磁區。',
      troubleshooting: '清除快取重新自 index.html 進行全流程走測。',
      verificationPoint: '題組四全項目符合 173003B12 評審規範。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '建立 webXX、images、music 與 results 目錄無誤',
    '精品背景音樂 0401.mp3 進入網站後自動循環播放',
    '3×3 表格九宮格精品商品圖文價格排版整齊',
    '真皮皮包商品超連結精確設定 target="_blank" 開啟新視窗',
    '購物須知 purchase.html 內容完備且返回設定 target="_top"',
    '購買按鈕點擊具有明確互動確認回應',
    '頁尾版權標明崗位號碼與應檢人姓名',
  ],
};

export const TASK_4_VERSION_B: CurriculumVersionData = {
  versionId: 'B',
  name: '影音串流解說引導架構版',
  subtitle: '網路行銷購物網九宮格與新視窗彈跳影音指引 (待連網串流驗證)',
  sourceDescription: '彙整外部影音平台題組四完整操作教學結構，影片時間戳記待連網驗證。',
  isVerified: false,
  playlistUrl: 'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D',
  steps: [
    { stepNumber: 1, title: '購物網特殊目錄與音訊配置 (影音 1)', purpose: 'music 與 results 資料夾配置', htmlExplanation: '建立標準目錄結構。', cssExplanation: '基本樣式。', pathUsage: 'music/0401.mp3', commonMistakes: '音樂未循環。', troubleshooting: '檢查 audio 標籤。', verificationPoint: '【待連網驗證】00:00-07:00', associatedAssets: ['0401.mp3'] },
    { stepNumber: 2, title: '3×3 表格九宮格圖文排版技巧 (影音 2)', purpose: '快速對齊 6 大精品照片與價格', htmlExplanation: '3x3 表格建構。', cssExplanation: '置中與行高設定。', pathUsage: 'images/0403.jpg-0408.jpg', commonMistakes: '價格對錯圖。', troubleshooting: '逐欄核對。', verificationPoint: '【待連網驗證】07:01-18:00', associatedAssets: ['0403.jpg', '0404.jpg'] },
    { stepNumber: 3, title: 'target="_blank" 新視窗超連結實務 (影音 3)', purpose: '避免考場失分之關鍵屬性', htmlExplanation: 'target="_blank" 示範。', cssExplanation: '無邊框連結。', pathUsage: 'results/leather1.html', commonMistakes: '漏寫 target 屬性。', troubleshooting: '點擊確認新視窗。', verificationPoint: '【待連網驗證】18:01-26:00', associatedAssets: [] },
    { stepNumber: 4, title: '購買確認互動與全站收尾檢查 (影音 4)', purpose: '購買彈窗與評分自檢', htmlExplanation: '確認購買對話框。', cssExplanation: '頁尾樣式。', pathUsage: '全站', commonMistakes: '忘記備份。', troubleshooting: '全流程巡檢。', verificationPoint: '【待連網驗證】26:01-35:00', associatedAssets: ['0409.jpg'] },
  ],
  selfChecklist: [
    '掌握 0401.mp3 背景音效自動播放配置',
    '精確切出 3×3 九宮格精品商品展示表格',
    '徹底落實 target="_blank" 新視窗超連結防呆',
    '比對 173003B12 評審表確認零扣分',
  ],
};

// =========================================================================
// 五大題組統一彙整對照表
// =========================================================================

export const UNIFIED_PRACTICAL_CURRICULUM_MAP: Record<number, UnifiedTaskCurriculum> = {
  1: {
    taskId: 1,
    code: '17300-104301',
    title: '校園社團介紹網',
    officialDocReference: '173003B12 第 23-32 頁（68 項嚴格必評規準）',
    totalAssetsCount: 11,
    assetsIndex: TASK_1_ASSETS_INDEX,
    versionA: TASK_1_VERSION_A,
    versionB: TASK_1_VERSION_B,
  },
  2: {
    taskId: 2,
    code: '17300-104302',
    title: '運動廣場連結網',
    officialDocReference: '173003B12 第 33-41 頁（43 項嚴格必評規準）',
    totalAssetsCount: 21,
    assetsIndex: TASK_2_ASSETS_INDEX,
    versionA: TASK_2_VERSION_A,
    versionB: TASK_2_VERSION_B,
  },
  3: {
    taskId: 3,
    code: '17300-104303',
    title: '國家公園介紹網',
    officialDocReference: '173003B12 第 42-46 頁（34 項嚴格必評規準）',
    totalAssetsCount: 16,
    assetsIndex: TASK_3_ASSETS_INDEX,
    versionA: TASK_3_VERSION_A,
    versionB: TASK_3_VERSION_B,
  },
  4: {
    taskId: 4,
    code: '17300-104304',
    title: '網路行銷購物網',
    officialDocReference: '173003B12 第 47-56 頁（48 項嚴格必評規準）',
    totalAssetsCount: 12,
    assetsIndex: TASK_4_ASSETS_INDEX,
    versionA: TASK_4_VERSION_A,
    versionB: TASK_4_VERSION_B,
  },
  5: {
    taskId: 5,
    code: '17300-104305',
    title: '書曼的旅遊相簿',
    officialDocReference: '173003B12 第 57-66 頁（26 項嚴格必評規準）',
    totalAssetsCount: 25,
    assetsIndex: TASK_5_ASSETS_INDEX,
    versionA: TASK_5_VERSION_A,
    versionB: TASK_5_VERSION_B,
  },
};

/**
 * 取得指定題組之雙版本教材資料（預設題組五）
 */
export function getTaskCurriculum(taskId: number): UnifiedTaskCurriculum {
  return UNIFIED_PRACTICAL_CURRICULUM_MAP[taskId] || UNIFIED_PRACTICAL_CURRICULUM_MAP[5];
}
