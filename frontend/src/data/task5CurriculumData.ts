/**
 * CODE TO KNOW (碼上學) - 題組五：書曼的旅遊相簿 (17300-104305) 官方教材與雙版本資料庫
 * 依據勞動部技能檢定中心 173003B12 試題規範及 173003B13 素材資料夾（25 份已核實檔案）
 */

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
  category: 'music' | 'menu_button' | 'portrait' | 'frame' | 'scenic' | 'album' | 'animation_sample';
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

/**
 * 25 個已核實官方素材檔案索引清冊
 */
export const TASK_5_ASSETS_INDEX: MaterialAssetIndexItem[] = [
  {
    filename: '0501.mp3',
    extension: '.mp3',
    purpose: '網站背景音樂，要求進入網站後自動播放並循環播放',
    associatedStep: 3,
    category: 'music',
    verifiedExists: true,
    bytesLength: 474349,
  },
  {
    filename: '0501b.gif',
    extension: '.gif',
    purpose: '金門逍遙遊選單預設藍色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2532,
  },
  {
    filename: '0501r.gif',
    extension: '.gif',
    purpose: '金門逍遙遊選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2516,
  },
  {
    filename: '0502b.gif',
    extension: '.gif',
    purpose: '卡蹓到馬祖選單預設藍色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2317,
  },
  {
    filename: '0502r.gif',
    extension: '.gif',
    purpose: '卡蹓到馬祖選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2306,
  },
  {
    filename: '0503b.gif',
    extension: '.gif',
    purpose: '踏浪澎湖行選單預設藍色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2590,
  },
  {
    filename: '0503r.gif',
    extension: '.gif',
    purpose: '踏浪澎湖行選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2582,
  },
  {
    filename: '0504b.gif',
    extension: '.gif',
    purpose: '綠島唱夜曲選單預設藍色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2452,
  },
  {
    filename: '0504r.gif',
    extension: '.gif',
    purpose: '綠島唱夜曲選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2444,
  },
  {
    filename: '0505b.gif',
    extension: '.gif',
    purpose: '蘭嶼賞魚去選單預設藍色按鈕圖片（超連結開啟 album5 電子相簿）',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2517,
  },
  {
    filename: '0505r.gif',
    extension: '.gif',
    purpose: '蘭嶼賞魚去選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2505,
  },
  {
    filename: '0506b.gif',
    extension: '.gif',
    purpose: '回首頁選單預設藍色按鈕圖片（超連結回 index.html）',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2472,
  },
  {
    filename: '0506r.gif',
    extension: '.gif',
    purpose: '回首頁選單滑鼠懸停紅色按鈕圖片',
    associatedStep: 5,
    category: 'menu_button',
    verifiedExists: true,
    bytesLength: 2458,
  },
  {
    filename: '0507.jpg',
    extension: '.jpg',
    purpose: '書曼個人生活照，置於選單標題下方第二列',
    associatedStep: 4,
    category: 'portrait',
    verifiedExists: true,
    bytesLength: 42113,
  },
  {
    filename: '0509.jpg',
    extension: '.jpg',
    purpose: '景點相框素材圖片，用於影像處理軟體合成 0510a.gif',
    associatedStep: 9,
    category: 'frame',
    verifiedExists: true,
    bytesLength: 13041,
  },
  {
    filename: '0511.jpg',
    extension: '.jpg',
    purpose: '金門景點代表照片，用於影像合成排版',
    associatedStep: 9,
    category: 'scenic',
    verifiedExists: true,
    bytesLength: 27300,
  },
  {
    filename: '0521.jpg',
    extension: '.jpg',
    purpose: '馬祖景點代表照片，用於影像合成排版',
    associatedStep: 9,
    category: 'scenic',
    verifiedExists: true,
    bytesLength: 37937,
  },
  {
    filename: '0531.jpg',
    extension: '.jpg',
    purpose: '澎湖景點代表照片，用於影像合成排版',
    associatedStep: 9,
    category: 'scenic',
    verifiedExists: true,
    bytesLength: 116763,
  },
  {
    filename: '0541.jpg',
    extension: '.jpg',
    purpose: '綠島景點代表照片，用於影像合成排版',
    associatedStep: 9,
    category: 'scenic',
    verifiedExists: true,
    bytesLength: 55440,
  },
  {
    filename: '0551.jpg',
    extension: '.jpg',
    purpose: '蘭嶼景點照片1，album5.html 大圖與縮圖切換來源',
    associatedStep: 8,
    category: 'album',
    verifiedExists: true,
    bytesLength: 63175,
  },
  {
    filename: '0552.jpg',
    extension: '.jpg',
    purpose: '蘭嶼景點照片2，album5.html 大圖與縮圖切換來源',
    associatedStep: 8,
    category: 'album',
    verifiedExists: true,
    bytesLength: 73385,
  },
  {
    filename: '0553.jpg',
    extension: '.jpg',
    purpose: '蘭嶼景點照片3，album5.html 大圖與縮圖切換來源',
    associatedStep: 8,
    category: 'album',
    verifiedExists: true,
    bytesLength: 51394,
  },
  {
    filename: '0554.jpg',
    extension: '.jpg',
    purpose: '蘭嶼景點照片4，album5.html 大圖與縮圖切換來源',
    associatedStep: 8,
    category: 'album',
    verifiedExists: true,
    bytesLength: 34019,
  },
  {
    filename: '0555.jpg',
    extension: '.jpg',
    purpose: '蘭嶼景點照片5，album5.html 大圖與縮圖切換來源',
    associatedStep: 8,
    category: 'album',
    verifiedExists: true,
    bytesLength: 58234,
  },
  {
    filename: '範例0508.gif',
    extension: '.gif',
    purpose: '官方提供之「書曼的旅遊相簿」多色變換動態輪替標題範例圖檔',
    associatedStep: 4,
    category: 'animation_sample',
    verifiedExists: true,
    bytesLength: 5556,
  },
];

/**
 * Version A：官方素材延伸版 (以勞動部 173003B12 試題規範及本機素材為基礎)
 */
export const VERSION_A_CURRICULUM: CurriculumVersionData = {
  versionId: 'A',
  name: 'Version A：官方素材延伸版',
  subtitle: '嚴格對齊勞動部 173003B12 試題手冊與 25 份核實官方素材',
  sourceDescription: '依據本機 173003B13 素材資料庫與試題評分標準解構。完整覆蓋考場 120 分鐘實作規範。',
  isVerified: true,
  steps: [
    {
      stepNumber: 1,
      title: '專案根目錄與主版面架構 (1024×768 水平居中)',
      purpose: '建立全站外層包裹結構，確保在各種視窗解析度下均穩定水平置中於螢幕正中央。',
      htmlExplanation: '使用語意化容器 `<div class="layout-container">` 或 `<table>`，外圍背景為 #333333，主內容背景為 #FFFFCC。',
      cssExplanation: '宣告 `width: 1024px; min-height: 768px; margin: 0 auto; background-color: #FFFFCC;`。body 設定 `background-color: #333333;`。',
      pathUsage: '首頁檔案命名為 index.html (或 index.htm)，建立 images、music 及 album5 子資料夾。',
      commonMistakes: '未設定 body 外圍深灰色 #333333，或忘記設定水平置中 margin: 0 auto。',
      troubleshooting: '檢查 CSS 外層容器 width 是否固定為 1024px，若為 100% 則無法產生水平居中效果。',
      verificationPoint: '瀏覽器視窗縮放時，1024px 版面始終穩定置中，外圍背景為 #333333。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '頂端跑馬燈公告區 (1024×50 紅色字體捲動)',
      purpose: '依題意呈現「歡迎來到書曼的旅遊相簿，本網站有我的旅遊影像紀錄介紹耶！」文字滾動。',
      htmlExplanation: '使用 `<marquee>` 標籤或 CSS 關鍵影格動畫，文字完整無錯漏字。',
      cssExplanation: '容器尺寸 `height: 50px; line-height: 50px; text-align: center; color: #FF0000; font-size: 24px; font-weight: bold; font-family: "標楷體";`。',
      pathUsage: '文字內容直接寫入 HTML，不需引用外部文字檔。',
      commonMistakes: '文字出現錯字或漏字（官方評分標準：錯漏一字扣 1 分）；字體顏色未設為紅色。',
      troubleshooting: '逐字核對官方試題手冊文字，確認文字最後的驚嘆號與贅字完全相符。',
      verificationPoint: '跑馬燈自右向左平滑滾動，文字為標楷體 24px 紅色粗體。',
      associatedAssets: [],
    },
    {
      stepNumber: 3,
      title: '背景音樂自動循環播放 (0501.mp3)',
      purpose: '達成載入網頁時自動啟動背景音樂並無限循環播放之檢定規範。',
      htmlExplanation: '使用 `<audio src="music/0501.mp3" autoplay loop style="display:none;"></audio>` 或 `<bgsound>`。',
      cssExplanation: 'audio 元件設為隱藏或放置於版面底層，不破壞 1024×768 視覺佈局。',
      pathUsage: '素材目錄：`music/0501.mp3`（音訊檔案大小 474,349 bytes）。',
      commonMistakes: '音訊路徑錯誤導致無法發聲（考場直接判定為致命扣分項）；未加上 loop 循環播放。',
      troubleshooting: '現代瀏覽器若因安全策略限制自動發聲，需確認考場檢定環境與本機沙盒 audio 屬性完整填寫。',
      verificationPoint: '確認音訊標籤包含 `autoplay` 與 `loop` 屬性，路徑指向 music/0501.mp3。',
      associatedAssets: ['0501.mp3'],
    },
    {
      stepNumber: 4,
      title: '左側選單佈局、書曼照片與動態標題 (0508.gif、0507.jpg)',
      purpose: '建構左側 150px 導覽欄，展示動態變色標題與書曼生活照片。',
      htmlExplanation: '使用 `<aside>` 或表格 `width: 150px;`，第 1 列置入 `0508.gif`，第 2 列置入 `0507.jpg`。',
      cssExplanation: '選單欄 `width: 150px; vertical-align: top; text-align: center;`，書曼照片置中。',
      pathUsage: '圖片路徑：`images/0508.gif`（或使用官方範例 `範例0508.gif`）與 `images/0507.jpg`。',
      commonMistakes: '標題圖片未置入或字體變色循環停頓；書曼照片變形。',
      troubleshooting: '若考場要求現場製作 0508.gif，請依規定使用 PhotoCap 或 GIMP 產生 3 種顏色輪替循環。',
      verificationPoint: '左側導覽寬度為 150px，最上方為動態標題，接著為書曼個人照片。',
      associatedAssets: ['0507.jpg', '範例0508.gif'],
    },
    {
      stepNumber: 5,
      title: '五大景點與回首頁動態翻轉按鈕 (*b.gif ↔ *r.gif)',
      purpose: '達成滑鼠游標移入時呈現紅色圖片 (*r.gif)，移出時恢復藍色圖片 (*b.gif) 之互動特效。',
      htmlExplanation: '為各景點按鈕標籤加入 `onmouseover="this.src=\'images/0501r.gif\'"` 與 `onmouseout="this.src=\'images/0501b.gif\'"`。',
      cssExplanation: '按鈕區塊宣告 `cursor: pointer; display: block; margin: 4px auto;`。',
      pathUsage: '依序包含 0501b/r (金門)、0502b/r (馬祖)、0503b/r (澎湖)、0504b/r (綠島)、0505b/r (蘭嶼)、0506b/r (回首頁)。',
      commonMistakes: '滑鼠懸停圖片路徑大小寫打錯導致破圖；忘記綁定 onmouseout 恢復事件。',
      troubleshooting: '逐一在瀏覽器中將滑鼠劃過 6 組按鈕，確認每一顆都能順暢翻轉紅藍且不破圖。',
      verificationPoint: '金門、馬祖、澎湖、綠島、蘭嶼及回首頁共 6 組按鈕，懸停時皆平滑由藍變紅。',
      associatedAssets: [
        '0501b.gif', '0501r.gif', '0502b.gif', '0502r.gif',
        '0503b.gif', '0503r.gif', '0504b.gif', '0504r.gif',
        '0505b.gif', '0505r.gif', '0506b.gif', '0506r.gif'
      ],
    },
    {
      stepNumber: 6,
      title: '選單第十列：網頁更新日期與維護人員資訊',
      purpose: '依試題規定於選單第十列標註更新日期與受測者姓名座號。',
      htmlExplanation: '撰寫 `<div class="date-info">日期：yyyy/mm/dd<br>維護：01碼上學</div>`。',
      cssExplanation: '文字設定 `font-size: 12px; color: #000000; text-align: center; line-height: 1.5; padding: 6px 0;`。',
      pathUsage: '純文字展示，依照當天檢定日期與準考證資訊填寫。',
      commonMistakes: '維護者姓名或座號填錯；格式未換行；日期格式不符。',
      troubleshooting: '檢查試題規定之日期格式（通常為西元年月日以斜線分隔），確認與考場指示一致。',
      verificationPoint: '日期資訊正確位於選單第十列（景點按鈕下方、回首頁按鈕上方）。',
      associatedAssets: [],
    },
    {
      stepNumber: 7,
      title: '右側內容區框架連動架構 (874px 寬 iframe/內容區)',
      purpose: '建立主內容展示區，讓點擊蘭嶼按鈕時能在指定框架無刷新載入相簿。',
      htmlExplanation: '右側主內容區嵌入 `<iframe name="content" src="album5/album5.html" frameborder="0" width="100%" height="100%"></iframe>`。',
      cssExplanation: '寬度設為 `874px`（1024px - 150px），內距 padding 至少 36px。',
      pathUsage: '蘭嶼賞魚去按鈕外層包覆 `<a href="album5/album5.html" target="content">`。',
      commonMistakes: '超連結 target 與 iframe name 大小寫不一致，導致點擊後另開全頁分頁。',
      troubleshooting: '檢查 `target="content"` 與 `<iframe name="content">` 的名稱是否逐字元吻合。',
      verificationPoint: '點選蘭嶼賞魚去按鈕後，右側內容框架內成功切換為 album5 相簿內容。',
      associatedAssets: [],
    },
    {
      stepNumber: 8,
      title: 'album5 蘭嶼賞魚去相簿實作 (點選 5 張縮圖切換 400×300 大圖)',
      purpose: '在 album5 子目錄中建立相簿網頁，點選縮圖即時置換上方大圖與邊框顏色。',
      htmlExplanation: '大圖 `<img id="main-photo" src="0551.jpg" width="400" height="300">`，下方橫排 5 張小圖，點擊事件更新大圖 src。',
      cssExplanation: '縮圖預設框線顏色，懸停時 cursor: pointer 且邊框切換為 #00FFFF。',
      pathUsage: '檔案位置：`album5/album5.html`，圖片檔案包含 `0551.jpg` 至 `0555.jpg`。',
      commonMistakes: '未建立 album5 子資料夾而直接放在根目錄；大圖未設定固定 400×300 尺寸。',
      troubleshooting: '確認 album5/album5.html 與 5 張照片的路徑為同層引用，縮圖具備手指指標特效。',
      verificationPoint: '點擊任一張縮圖，上方大圖立即更新，大圖尺寸精確為 400×300。',
      associatedAssets: ['0551.jpg', '0552.jpg', '0553.jpg', '0554.jpg', '0555.jpg'],
    },
    {
      stepNumber: 9,
      title: '影像相框合成 0510a.gif (0509.jpg 與 5 景點相片合成)',
      purpose: '使用影像處理軟體將相框素材 0509.jpg 與 5 張景點縮圖合成一張綜合展現圖。',
      htmlExplanation: '合成圖命名為 `0510a.gif`，置於 images 目錄中。',
      cssExplanation: '在首頁內容預設畫面中以 `<img>` 載入展示，置中呈現。',
      pathUsage: '素材包含相框 `images/0509.jpg` 與景點照片 `0511.jpg`、`0521.jpg`、`0531.jpg`、`0541.jpg`。',
      commonMistakes: '相框邊界裁切粗糙或圖片變形；未存檔為指定檔名 0510a.gif。',
      troubleshooting: '在影像軟體中開啟 0509 相框，以圖層模式分別貼上金門、馬祖、澎湖、綠島縮圖後匯出。',
      verificationPoint: '0510a.gif 合成圖清晰且比例正確，相框邊界平整無殘留背景。',
      associatedAssets: ['0509.jpg', '0511.jpg', '0521.jpg', '0531.jpg', '0541.jpg'],
    },
    {
      stepNumber: 10,
      title: '全真考場防呆驗收與最終檢查',
      purpose: '逐一核對試題評分標準，杜絕扣分地雷，確保 100% 滿分通過檢定。',
      htmlExplanation: '檢查全站所有標籤完整閉合，路徑無本機磁碟絕對路徑 (如 C:\\)。',
      cssExplanation: '確認無任何捲軸橫向溢位，所有顏色代碼符合標準十六進位規範。',
      pathUsage: '全站所有超連結與資源均使用相對路徑。',
      commonMistakes: '超連結寫成絕對路徑，在評審評分電腦上導致破圖判定 0 分。',
      troubleshooting: '將完成的專案目錄複製到乾淨環境或無網路環境測試，確認音樂與圖片皆正常。',
      verificationPoint: '通過自我查核表全數項目，首頁、相簿、音樂與互動按鈕全數正常運作。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '全站版面 1024×768px 置中，外圍背景為 #333333，主版面背景為 #FFFFCC。',
    '頂端跑馬燈 1024×50px，紅色 24px 粗體標楷體，無錯漏字由右向左捲動。',
    '背景音樂 0501.mp3 於進入頁面時自動啟動並循環播放。',
    '左側導覽欄寬度 150px，最上方為動態輪替標題，接著為書曼個人照 0507.jpg。',
    '五大景點與回首頁共 6 組按鈕，懸停時正確由藍色 (*b.gif) 翻轉為紅色 (*r.gif)。',
    '選單第十列正確標記西元年月日與考生維護資訊。',
    '點選蘭嶼賞魚去按鈕，右側框架正確載入 album5/album5.html。',
    'album5 相簿點選 5 張小圖時，上方即時更新 400×300 大圖並切換邊框色彩。',
    '相框合成圖 0510a.gif 正式完成並正確嵌入顯示。',
    '全站資源皆使用正確相對路徑，無破圖或死連結。',
  ],
};

/**
 * Version B：影片學習版 (對應 YouTube 檢定教學影音教材骨架)
 */
export const VERSION_B_CURRICULUM: CurriculumVersionData = {
  versionId: 'B',
  name: 'Version B：影片實戰解析版',
  subtitle: '影音示範思維拆解與實機操作演練流程（以官方考證解題影片為參考架構）',
  sourceDescription: '依據 YouTube 官方考題示範播放清單與參考影片梳理。註：因目前未聯網播放串流，步驟標記為架構示範。',
  playlistUrl: 'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D',
  videoUrl: 'https://www.youtube.com/watch?v=TZ5EJatWres',
  isVerified: false,
  steps: [
    {
      stepNumber: 1,
      title: '【影片章節 01】考場解題環境與素材解壓佈署',
      purpose: '影片第一段示範考場開機後的安全解題目錄建立與素材歸位。',
      htmlExplanation: '建立 web05 主目錄，建立 images、music、album5 子資料夾（待核實影片秒數）。',
      cssExplanation: '建立 style.css 統一管理全域色彩與置中規範。',
      pathUsage: '將檢定抽中素材拷貝至工作目錄。',
      commonMistakes: '解壓路徑層級過多造成引用路徑層級混淆。',
      troubleshooting: '依影片示範確認素材資料夾層級結構單純。',
      verificationPoint: '目錄結構與影片示範結構完全一致。',
      associatedAssets: [],
    },
    {
      stepNumber: 2,
      title: '【影片章節 02】首頁表格骨架與顏色切分技巧',
      purpose: '影片第二段示範如何快速以表格切出 1024×768 版面與顏色分配。',
      htmlExplanation: '利用表格切出頂端 50px 跑馬燈與中間左側 150px、右側 874px（待核實影片秒數）。',
      cssExplanation: '外圍 #333333 與內容 #FFFFCC 快速著色。',
      pathUsage: 'index.html 根目錄儲存。',
      commonMistakes: '表格 border 未設為 0 導致考場出現灰色框線。',
      troubleshooting: '設定 `border="0" cellpadding="0" cellspacing="0"`。',
      verificationPoint: '版面框線乾淨無多餘表格預設邊距。',
      associatedAssets: [],
    },
    {
      stepNumber: 3,
      title: '【影片章節 03】多媒體背景音樂嵌入防呆技巧',
      purpose: '影片第三段說明不同瀏覽器版本下的背景音樂自動播放相容語法。',
      htmlExplanation: '示範 `<audio>` 與 `<bgsound>` 雙重相容寫法（待核實影片秒數）。',
      cssExplanation: '零尺寸或 hidden 屬性設定。',
      pathUsage: '引用 music/0501.mp3。',
      commonMistakes: '缺少 loop 屬性導致播放一次後即停止。',
      troubleshooting: '核對影片示範中之雙標籤容錯寫法。',
      verificationPoint: '進入頁面立即聽見輕快背景音樂。',
      associatedAssets: ['0501.mp3'],
    },
    {
      stepNumber: 4,
      title: '【影片章節 04】滑鼠懸停圖片互換的快速撰寫訣竅',
      purpose: '影片第四段展示如何在 3 分鐘內快速完成 6 組按鈕圖片置換。',
      htmlExplanation: '使用統一的 this.src 替換字串技巧（待核實影片秒數）。',
      cssExplanation: '游標樣式 cursor: pointer 一致化。',
      pathUsage: '按鈕圖檔名批次核對技巧。',
      commonMistakes: '忘記把 0505 蘭嶼賞魚去加上超連結。',
      troubleshooting: '點擊按鈕檢查是否正確切換藍紅兩色。',
      verificationPoint: '6 組按鈕翻轉動畫順暢無頓挫。',
      associatedAssets: ['0501b.gif', '0501r.gif', '0505b.gif', '0505r.gif'],
    },
    {
      stepNumber: 5,
      title: '【影片章節 05】PhotoCap / GIMP 影像相框合成全流程',
      purpose: '影片第五段示範如何在免費影像軟體中 5 分鐘完成 0510a.gif 相框合成。',
      htmlExplanation: '影像軟體圖層排列：0509 相框置頂，景點照置底（待核實影片秒數）。',
      cssExplanation: '合成圖尺寸固定與居中。',
      pathUsage: '儲存至 images/0510a.gif。',
      commonMistakes: '存成 JPG 格式而未依規定存為 GIF。',
      troubleshooting: '匯出時確認副檔名為 .gif。',
      verificationPoint: '0510a.gif 在首頁能正常展示。',
      associatedAssets: ['0509.jpg', '0511.jpg', '0521.jpg'],
    },
    {
      stepNumber: 6,
      title: '【影片章節 06】album5 相簿點擊切換大圖 JS 實戰',
      purpose: '影片第六段剖析如何用最簡單的 3 行 JavaScript 達成縮圖換大圖。',
      htmlExplanation: '函數 function changePhoto(src) { document.getElementById("main").src = src; }。',
      cssExplanation: '大圖 400×300 與小縮圖 hover 框線 #00FFFF。',
      pathUsage: '檔案置於 album5/album5.html。',
      commonMistakes: '大圖尺寸跑版變形。',
      troubleshooting: '大圖強制設定 width="400" height="300"。',
      verificationPoint: '點擊任一小圖，大圖流暢更新。',
      associatedAssets: ['0551.jpg', '0552.jpg', '0553.jpg', '0554.jpg', '0555.jpg'],
    },
    {
      stepNumber: 7,
      title: '【影片章節 07】考場交卷前 5 分鐘終極自我檢查法',
      purpose: '影片結尾總結監評委員扣分熱點與最後 5 分鐘自我防漏。',
      htmlExplanation: '檢查所有檔案大小寫、副檔名與相對路徑。',
      cssExplanation: '檢查視窗縮小時無橫向溢位破版。',
      pathUsage: '全站路徑相對化確認。',
      commonMistakes: '忘記存檔或未於指定伺服器上傳。',
      troubleshooting: '重新整理首頁，確認所有功能一次到位。',
      verificationPoint: '符合所有評分項，安心交卷。',
      associatedAssets: [],
    },
  ],
  selfChecklist: [
    '【影片架構查驗】已理解題組五七大實作章節之解題脈絡。',
    '【影片架構查驗】已掌握 0508.gif 與 0510a.gif 的軟體快速合成秘訣。',
    '【影片架構查驗】已確認背景音樂與按鈕翻轉之防呆寫法。',
    '【影片架構查驗】已完成 album5 相簿大圖替換之 JavaScript 邏輯演練。',
    '【影片架構查驗】考場 120 分鐘實操節奏分配清晰，預留 15 分鐘核對時間。',
  ],
};
