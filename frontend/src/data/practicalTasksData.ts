/**
 * CODE TO KNOW (碼上學) - 網頁設計丙級 (17300) 術科官方題組規格資料庫
 * 依據勞動部勞動力發展署技能檢定中心 173003B12 術科試題規範：
 * 術科檢定共有 5 大正式題組（17300-104301 至 17300-104305），現場由考場抽出其中 1 組進行 120 分鐘限時實作。
 * 平台提供 5 大題組完整規格解構、考場防呆檢核點，與安全雙欄沙盒預載骨架。
 */

export interface PracticalTaskDetail {
  id: number;
  code: string;
  examCode: string;
  title: string;
  theme: string;
  difficulty: '★☆☆' | '★★☆' | '★★★';
  estimatedMinutes: number;
  materialPath: string;
  status: 'available' | 'partially_completed' | 'in_preparation';
  materialStatusText: string;
  teachingStatusText: string;
  canvasSpec: {
    width: string;
    centering: string;
    header: string;
    menu: string;
    content: string;
    footer: string;
  };
  overview: string;
  requiredAssets: string[];
  disqualificationTraps: string[]; // 扣分地雷與防呆點
  scoringChecklist: string[];      // 評分關鍵查核項目
  defaultHtmlCode: string;         // 沙盒預載骨架
  defaultCssCode: string;
  officialReferenceTips: string;
}

export const OFFICIAL_PRACTICAL_TASKS: PracticalTaskDetail[] = [
  {
    id: 1,
    code: '17300-104301',
    examCode: '17300-104301',
    title: '題組一：校園社團介紹網',
    materialPath: '173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104301',
    status: 'available',
    materialStatusText: '已核實官方原始素材（11 個檔案完整）',
    teachingStatusText: '完整版型解構與沙盒骨架就緒',
    theme: '頁框佈局結構、跑馬燈廣告、選單超連結 target 連動與影像合成',
    difficulty: '★☆☆',
    estimatedMinutes: 90,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1000px × 65px（標誌 logo.png 與校園社團主標題）',
      menu: '寬度 215px（選單區 menu1/menu2 動態懸停）',
      content: '寬度 770px（網頁內容區，預設 main.html，切換社史、活動、教學）',
      footer: '1000px × 20px（網頁設計及維護：XX○○○）',
    },
    overview: '本試題評量「校園社團介紹網」網頁設計能力。全站版面尺寸 1024×768px 水平置中，包含網站標題區、跑馬燈廣告區、選單區、日期更新區、網頁內容區與頁尾版權區。需完成 logo 合成、校長照片合成，以及點選吉他社子頁面的超連結目標框架連動。',
    requiredAssets: [
      '文書檔：0101.txt、0102.txt、0103.txt',
      '圖形檔：logo1.png、logo2.png、logo3.jpg（合成 logo.png）',
      '圖形檔：0101.jpg、0102.jpg、0103.jpg（合成 0104.jpg）、menu1.png、menu2.png',
      '音樂檔：無（官方試題規定無音樂檔）',
    ],
    disqualificationTraps: [
      '首頁未依規定命名為 index.html (或 index.htm)。',
      '未依規定建立 webXX 主目錄及 images 資料夾。',
      '吉他社子頁面超連結目標 target 未設為 content 區塊，導致跳出全頁。',
      '「回社團介紹首頁」未設定在 _top 開啟，導致頁面巢狀割裂。',
      '跑馬燈文字錯字、漏字（每一字扣 1 分）。',
    ],
    scoringChecklist: [
      '全站寬度 1024px 且在不同視窗寬度下維持居中。',
      '跑馬燈文字由右向左平滑捲動，文字內容無錯漏字。',
      '點選吉他社社史、近期活動、教學內容，右側內容區流暢切換。',
      '影像合成圖檔（logo.png 與 0104.jpg）尺寸與位置精確相符。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國立科技高中─校園社團介紹網</title>
</head>
<body>
  <div class="layout-container">
    <!-- 頂端標題區 -->
    <header class="site-header">
      <img src="images/logo.png" alt="國立科技高中校園社團介紹網" class="site-logo">
    </header>

    <!-- 跑馬燈公告區 -->
    <div class="marquee-bar">
      <span>歡迎光臨校園社團介紹網，參觀後請支持社團活動並熱烈參與</span>
    </div>

    <!-- 中間主要區域 -->
    <div class="main-body">
      <!-- 左側選單與更新區 -->
      <aside class="sidebar">
        <nav class="side-menu">
          <div class="menu-title">社團介紹</div>
          <a href="guitar_history.html" target="content" class="menu-item">吉他社</a>
          <a href="#" class="menu-item">熱舞社</a>
          <a href="#" class="menu-item">棒球社</a>
          <a href="#" class="menu-item">羽球社</a>
          <a href="#" class="menu-item">足球社</a>
          <a href="#" class="menu-item">童軍社</a>
        </nav>
        <div class="date-update">
          最近更新日期：2026/11/06
        </div>
      </aside>

      <!-- 右側網頁內容區 -->
      <main class="content-frame">
        <iframe name="content" src="main.html" frameborder="0" width="100%" height="100%"></iframe>
      </main>
    </div>

    <!-- 頁尾版權區 -->
    <footer class="site-footer">
      <p>網頁設計及維護：01碼上學</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `/* 題組一：校園社團介紹網樣式設定 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: "標楷體", -apple-system, sans-serif;
  color: #26343D;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  margin: 0 auto;
}

.site-header {
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.site-logo {
  width: 994px;
  height: 60px;
}

.marquee-bar {
  height: 29px;
  background-color: #EFECE3;
  color: #0000FF;
  font-size: 24px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.main-body {
  display: flex;
  min-height: 600px;
}

.sidebar {
  width: 215px;
  background-color: #FAF9F5;
  border-right: 1px solid #D9E2EA;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu-title {
  font-size: 24px;
  color: #FF00FF;
  text-decoration: underline;
  text-align: center;
  margin-bottom: 12px;
}

.menu-item {
  display: block;
  padding: 8px 12px;
  font-size: 16px;
  color: #000000;
  text-decoration: none;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  margin-bottom: 6px;
  text-align: center;
}

.menu-item:hover {
  background-color: #526B7B;
  color: #FFFFFF;
}

.date-update {
  font-size: 16px;
  color: #000000;
  text-align: center;
  padding: 8px 0;
}

.content-frame {
  flex: 1;
  padding: 16px;
}

.site-footer {
  height: 20px;
  background-color: #26343D;
  color: #D9E2EA;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
    officialReferenceTips: '考場關鍵：請嚴格遵守 1024×768px 水平置中規範，超連結回首頁請務必加上 target="_top"，避免 iframe 重複嵌套。',
  },
  {
    id: 2,
    code: '17300-104302',
    examCode: '17300-104302',
    title: '題組二：運動廣場連結網',
    materialPath: '173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104302',
    status: 'partially_completed',
    materialStatusText: '已核實官方原始素材（21 個檔案完整含 jQuery）',
    teachingStatusText: '題組規格與骨架已就緒 · 操作分步擴充中',
    theme: '文字陰影、最新消息帶狀排版、縮圖切換原圖、標籤頁 Tab 與訪客留言表單',
    difficulty: '★★☆',
    estimatedMinutes: 95,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 90px（標識 logo.png 180×90 與陰影橫幅文字）',
      menu: '1024px × 25px（七大選單平均分布）',
      content: '1024px × 460px（padding 至少 20px，最新消息與圖片切換）',
      footer: '1024px × 45px（背景 #CCCCCC，網頁維護與更新日期）',
    },
    overview: '本試題評量「運動廣場連結網」網頁製作能力。首頁標題為「勞動部勞動力發展署─運動廣場連結網」，背景 #FFFFFF，外圍背景 #42413C。包含七大選單（首頁、健康天地、籃球介紹、棒球介紹、游泳介紹、訪客留言、資料來源）。網頁內容區包含最新消息與縮圖切換原圖展示，並需製作 jQuery 標籤頁與 6×2 訪客留言表單。',
    requiredAssets: [
      '文書檔：0201.txt 至 0208.txt',
      '圖形檔：logo.png、0201.png、0202A.png~0205A.png、0202B.png~0205B.png、0206.png、0207.png',
      '函式庫：jquery-2.1.4.min.js',
      '音樂檔：無',
    ],
    disqualificationTraps: [
      '未建立 results 資料夾存放 health、basketball、baseball、swimming、msgboard、reference 等子檔案。',
      '點按圖片展示區縮圖未即時切換上方對應原圖。',
      '訪客留言表單單選鈕性別未設相同 name 群組，導致男女性別可複選。',
      '留言表單送出/重寫按鈕功能異常，未彈出指定回覆確認對話框。',
      '健康天地標籤頁 (Tab) 切換失效或超出範圍未出現垂直捲軸。',
    ],
    scoringChecklist: [
      '橫幅文字具備 CSS 陰影效果（#333333、偏移 10px、模糊 15px）。',
      '點選縮圖時上方及時呈現對應原圖且無裁切現象。',
      '訪客留言表單各欄位限制與彈出對話框功能完全正常。',
      '籃球、棒球、游泳介紹網頁之路徑導覽列完整無誤。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>勞動部勞動力發展署─運動廣場連結網</title>
</head>
<body>
  <div class="layout-container">
    <!-- 網站標題區 1024x90 -->
    <header class="site-header">
      <a href="index.html"><img src="images/logo.png" alt="運動廣場連結網-回首頁" class="header-logo"></a>
      <h1 class="header-title">運動廣場連結網</h1>
    </header>

    <!-- 選單區 1024x25 -->
    <nav class="site-menu">
      <a href="results/main.html" target="content" class="nav-item">首頁</a>
      <a href="results/health.html" target="content" class="nav-item">健康天地</a>
      <a href="results/basketball.html" target="content" class="nav-item">籃球介紹</a>
      <a href="results/baseball.html" target="content" class="nav-item">棒球介紹</a>
      <a href="results/swimming.html" target="content" class="nav-item">游泳介紹</a>
      <a href="results/msgboard.html" target="content" class="nav-item">訪客留言</a>
      <a href="results/reference.html" target="content" class="nav-item">資料來源</a>
    </nav>

    <!-- 網頁內容區 1024x460 -->
    <main class="site-content">
      <iframe name="content" src="results/main.html" frameborder="0" width="100%" height="460"></iframe>
    </main>

    <!-- 頁尾版權區 1024x45 -->
    <footer class="site-footer">
      <p>網頁設計及維護：01碼上學</p>
      <p>最近更新日期：2026/11/06</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `/* 題組二：運動廣場連結網樣式設定 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #42413C;
  font-family: "標楷體", sans-serif;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
}

.site-header {
  height: 90px;
  background-color: #00B0F0;
  display: flex;
  align-items: center;
}

.header-logo {
  width: 180px;
  height: 90px;
}

.header-title {
  flex: 1;
  text-align: center;
  color: #FFFFFF;
  font-size: 52px;
  text-shadow: 10px 10px 15px #333333;
}

.site-menu {
  height: 25px;
  display: flex;
}

.nav-item {
  flex: 1;
  text-align: center;
  line-height: 25px;
  background-color: #EEEEEE;
  color: #000000;
  text-decoration: none;
  font-size: 13px;
}

.nav-item:hover {
  background-color: #FFFF00;
  color: #FF0000;
  font-weight: bold;
  font-size: 14px;
}

.site-content {
  height: 460px;
  padding: 20px;
  background-color: #FFFFFF;
}

.site-footer {
  height: 45px;
  background-color: #CCCCCC;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #FFFFFF;
}`,
    officialReferenceTips: '考場關鍵：需使用 jQuery 實作縮圖切換原圖與 Tab 標籤頁切換，注意圖片展示區縮圖與原圖比例無裁切。',
  },
  {
    id: 3,
    code: '17300-104303',
    examCode: '17300-104303',
    title: '題組三：國家公園介紹網',
    materialPath: '173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104303',
    status: 'partially_completed',
    materialStatusText: '已核實官方原始素材（16 個檔案完整含 park.mp3）',
    teachingStatusText: '題組規格與骨架已就緒 · 影像地圖教學擴充中',
    theme: '標題圖片定時輪播、矩形與多邊形影像地圖 (Image Map)、音效下載與多欄表格',
    difficulty: '★★☆',
    estimatedMinutes: 95,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1000px × 65px（背景 #0000FF，四張圖片定時 1 秒輪播）',
      menu: '寬度 200px（背景 #00FFFF，七列一欄表格選單）',
      content: '寬度 800px（背景 park0301.jpg，地圖與超連結）',
      footer: '1000px × 20px（網頁設計及維護與更新日期）',
    },
    overview: '本試題評量「國家公園介紹網」網頁建置能力。首頁標題為「國家公園介紹網」，包含網站標題區（從 park0307~0313 選 4 張圖片以 1 秒輪播）、跑馬燈廣告區、選單區、網頁內容區與頁尾版權區。內容區需在 national_park.jpg 上設定矩形與黃色多邊形影像地圖，分別連結陽明山與雪霸國家公園，並提供 park.mp3 檔案下載。',
    requiredAssets: [
      '文書檔：0301.txt',
      '圖形檔：national_park.jpg、park0301.jpg 至 park0313.jpg',
      '音訊檔：park.mp3（檔案下載用途）',
      '函式庫：無',
    ],
    disqualificationTraps: [
      '標題圖片未依間隔 1 秒輪播，或輪播圖片尺寸不一產生毛邊。',
      '影像地圖 (Image Map) 座標設定不精確，超出邊框或無法點擊。',
      '檔案下載未正確觸發 park.mp3 下載對話框。',
      '未建立 park 資料夾存放 yangmingshan.html 與 sheipa.html。',
      '子網頁缺乏「回首頁」超連結。',
    ],
    scoringChecklist: [
      '標題輪播圖片平滑切換且無裁切或毛邊現象。',
      '地圖上陽明山與雪霸國家公園影像地圖精準感應跳轉。',
      '選單區滑鼠移過圖片呈現不同顏色動態效果。',
      '點擊檔案下載能成功彈出下載視窗。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國家公園介紹網</title>
</head>
<body>
  <div class="layout-container">
    <!-- 標題輪播區 1000x65 -->
    <header class="site-header">
      <div class="carousel-container">
        <img id="banner-img" src="images/park0307.jpg" alt="國家公園介紹網首頁">
      </div>
    </header>

    <!-- 跑馬燈區 -->
    <div class="marquee-bar">
      <span>歡迎進入國家公園介紹網，本網站有詳細的國家公園介紹哦！</span>
    </div>

    <!-- 主體內容區 -->
    <div class="main-body">
      <!-- 左側選單區 200px -->
      <aside class="sidebar">
        <table class="menu-table">
          <tr><td><a href="park/yangmingshan.html" target="content"><img src="images/park0302.jpg" alt="陽明山國家公園"></a></td></tr>
          <tr><td></td></tr>
          <tr><td><a href="park/sheipa.html" target="content"><img src="images/park0303.jpg" alt="雪霸國家公園"></a></td></tr>
          <tr><td></td></tr>
          <tr><td><img src="images/park0304.jpg" alt="太魯閣國家公園"></td></tr>
          <tr><td></td></tr>
          <tr><td><img src="images/park0305.jpg" alt="玉山國家公園"></td></tr>
        </table>
        <div class="download-link">
          <a href="park.mp3" download>檔案下載</a>
        </div>
      </aside>

      <!-- 右側內容區 -->
      <main class="content-area">
        <iframe name="content" src="national_park.jpg" frameborder="0" width="100%" height="100%"></iframe>
      </main>
    </div>

    <!-- 頁尾版權區 -->
    <footer class="site-footer">
      <p>網頁設計及維護：01碼上學、最近更新日期：2026/11/06</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `/* 題組三：國家公園介紹網樣式設定 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: "標楷體", sans-serif;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
}

.site-header {
  height: 65px;
  background-color: #0000FF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.marquee-bar {
  height: 29px;
  display: flex;
  align-items: center;
  background-color: #EFECE3;
  color: #0000FF;
  font-size: 16px;
}

.main-body {
  display: flex;
  min-height: 600px;
}

.sidebar {
  width: 200px;
  background-color: #00FFFF;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-table {
  width: 100%;
  border-collapse: collapse;
}

.download-link {
  margin-top: 20px;
  text-align: center;
}

.content-area {
  flex: 1;
  background-image: url('images/park0301.jpg');
}

.site-footer {
  height: 20px;
  background-color: #26343D;
  color: #FFFFFF;
  font-size: 16px;
  text-align: center;
}`,
    officialReferenceTips: '考場關鍵：注意雪霸國家公園影像地圖為多邊形邊界，需細緻設定座標；park.mp3 下載需設置 download 屬性。',
  },
  {
    id: 4,
    code: '17300-104304',
    examCode: '17300-104304',
    title: '題組四：網路行銷購物網',
    materialPath: '173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104304',
    status: 'partially_completed',
    materialStatusText: '已核實官方原始素材（12 個檔案完整含 0401.mp3）',
    teachingStatusText: '題組規格與骨架已就緒 · 購物確認對話框教學擴充中',
    theme: '精品購物網站、3×3 表格圖文展示、背景音樂自動播放、購買狀態對話框與新視窗超連結',
    difficulty: '★★★',
    estimatedMinutes: 100,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 120px（背景 0401.jpg，流行精品購物網站橫幅）',
      menu: '跑馬燈 1024px × 30px（特價拍賣跑馬燈文字）',
      content: '3×3 表格圖文區（共用背景 0402.jpg，列高 150px）',
      footer: '1024px × 78px（背景 #666600，訪客留言版連結與版權）',
    },
    overview: '本試題評量「網路行銷購物網」網頁製作能力。首頁標題為「網路行銷購物網」，需自動循環播放背景音樂 0401.mp3。版面分為網站標題區、跑馬燈廣告區、網頁內容區與頁尾版權區。內容區需設置 3×3 表格展示皮件、鞋區與飾品，點選圖片以新視窗開啟 leather1/leather2 詳細介紹，並實作 purchase.html 購物確認與 message.html 留言意見表單。',
    requiredAssets: [
      '文書檔：0401.txt、0402.txt',
      '圖形檔：0401.jpg 至 0409.jpg',
      '音訊檔：0401.mp3（背景音樂）',
      '函式庫：無',
    ],
    disqualificationTraps: [
      '背景音樂 0401.mp3 未自動播放或未設定循環 loop。',
      '點選皮包與短夾圖片未在全新視窗 (target="_blank") 中開啟。',
      '未建立 results 資料夾存放 leather1、leather2、message、purchase 等檔案。',
      '購物確認表單單選鈕未依規定設定「購買/不購買/考慮中」之預設值。',
      '留言意見表單送出後未出現指定提示對話框。',
    ],
    scoringChecklist: [
      '背景音樂自動且持續循環播放。',
      '3×3 商品展示表格各欄寬度（200px / 300px / 300px）與列高 150px 精確無誤。',
      '點選真皮皮包與短夾能順暢在新分頁開啟獨立詳情頁並提供回頂端功能。',
      '購物確認與訪客留言表單之重設按鈕確實清空所有欄位。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>網路行銷購物網</title>
</head>
<body>
  <!-- 背景音樂 0401.mp3 -->
  <audio src="music/0401.mp3" autoplay loop style="display: none;"></audio>

  <div class="layout-container">
    <!-- 網站標題區 1024x120 -->
    <header class="site-header">
      <h1 class="header-title">流行精品購物網站</h1>
    </header>

    <!-- 跑馬燈區 1024x30 -->
    <div class="marquee-bar">
      <span>大家來購物網！精品商品特價大拍賣！要買要快！</span>
    </div>

    <!-- 網頁內容區 3x3 表格 -->
    <main class="site-content">
      <table class="product-table">
        <tr>
          <td class="cat-cell"><a href="results/purchase.html" target="content">流行皮件</a></td>
          <td class="img-cell"><a href="results/leather1.html" target="_blank"><img src="images/0403.jpg" alt="真皮皮包"></a></td>
          <td class="img-cell"><a href="results/leather2.html" target="_blank"><img src="images/0404.jpg" alt="真皮短夾"></a></td>
        </tr>
        <tr>
          <td class="cat-cell">流行鞋區</td>
          <td class="img-cell"><img src="images/0405.jpg" alt="流行鞋一"></td>
          <td class="img-cell"><img src="images/0406.jpg" alt="流行鞋二"></td>
        </tr>
        <tr>
          <td class="cat-cell">流行飾品</td>
          <td class="img-cell"><img src="images/0407.jpg" alt="流行飾品一"></td>
          <td class="img-cell"><img src="images/0408.jpg" alt="流行飾品二"></td>
        </tr>
      </table>
    </main>

    <!-- 頁尾版權區 1024x78 -->
    <footer class="site-footer">
      <p><a href="results/message.html" target="content">訪客留言版</a></p>
      <p>網頁設計及維護：01碼上學、最近更新日期：2026/11/06</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `/* 題組四：網路行銷購物網樣式設定 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: "標楷體", sans-serif;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
}

.site-header {
  height: 120px;
  background-image: url('images/0401.jpg');
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  color: #FFFFFF;
  font-size: 52px;
  text-shadow: 10px 10px 15px #333333;
}

.marquee-bar {
  height: 30px;
  line-height: 30px;
  color: #0000FF;
  font-size: 19px;
  background-image: url('images/0402.jpg');
}

.site-content {
  background-image: url('images/0402.jpg');
  padding: 20px;
  display: flex;
  justify-content: center;
}

.product-table {
  border-collapse: collapse;
}

.product-table td {
  height: 150px;
  text-align: center;
  vertical-align: middle;
}

.cat-cell {
  width: 200px;
  font-size: 20px;
}

.img-cell {
  width: 300px;
}

.img-cell img {
  height: 150px;
}

.site-footer {
  height: 78px;
  background-color: #666600;
  color: #FFFFFF;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-left: 20px;
  line-height: 2;
}

.site-footer a {
  color: #FFFFFF;
  text-decoration: none;
}`,
    officialReferenceTips: '考場關鍵：真皮皮包與短夾的超連結必須設定在全新視窗 target="_blank" 開啟，且音訊需自動循環播放。',
  },
  {
    id: 5,
    code: '17300-104305',
    examCode: '17300-104305',
    title: '題組五：書曼的旅遊相簿',
    materialPath: '173003B13/17300網頁設計丙級檢定用檔案-(應檢人參考用)/素材/17300-104305',
    status: 'in_preparation',
    materialStatusText: '已核實官方原始素材（25 個檔案完整含相框與動態 GIF）',
    teachingStatusText: '教材整理中 · 題組入口與版型規範已建立',
    theme: '動態 GIF 標題製作、滑鼠懸停圖片互換效果、影像相框合成與互動電子相簿 (album5)',
    difficulty: '★★★',
    estimatedMinutes: 105,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '跑馬燈 1024px × 50px（歡迎來到書曼的旅遊相簿）',
      menu: '150px 寬（12×1 表格，0508.gif、0507.jpg 與動態翻轉按鈕）',
      content: '874px 寬（padding 至少 36px，0510a.gif 合成圖與 album5 電子相簿）',
      footer: '整合於選單第十列（日期：yyyy/mm/dd 維護：XX○○○）',
    },
    overview: '本試題評量「書曼的旅遊相簿」網頁設計能力。全站版面 1024×768px 水平置中，背景 #FFFFCC，外圍背景 #333333，自動播放背景音樂 0501.mp3。左側選單包含動態外框字 0508.gif，以及五個景點按鈕（金門、馬祖、澎湖、綠島、蘭嶼），滑鼠移入時由藍色 b.gif 切換為紅色 r.gif。右側內容區透過 0509 相框合成多景點照片，並實作 album5 縮圖切換 400×300 大圖之互動電子相簿。',
    requiredAssets: [
      '圖形檔：0501b.gif~0506r.gif（選單互換圖標）',
      '圖形檔：0507.jpg（書曼照）、範例0508.gif、0509.jpg（相框）',
      '圖形檔：0511.jpg、0521.jpg、0531.jpg、0541.jpg、0551.jpg~0555.jpg',
      '音樂檔：0501.mp3（背景音樂）',
      '文書檔與函式庫：無',
    ],
    disqualificationTraps: [
      '背景音樂 0501.mp3 未自動播放。',
      '選單項目滑鼠懸停時未正確切換至紅色版圖檔 (*r.gif)。',
      '點選蘭嶼賞魚去未正確進入 album5 電子相簿內容。',
      '電子相簿縮圖滑鼠懸停未呈現手指游標與 #00FFFF 框線。',
      '未建立 album5 資料夾存放相簿網頁檔案。',
    ],
    scoringChecklist: [
      '0508.gif 動態輪替字體顏色正確循環（或正確使用範例 0508.gif）。',
      '選單五大景點之滑鼠 hover 圖片切換平滑無破圖。',
      '影像合成圖 0510a.gif 包含五張景點相框並正確排版。',
      '電子相簿點選 5 張小圖時，上方即時更新 400×300 原圖且邊框顏色正確切換。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>書曼的旅遊相簿</title>
</head>
<body>
  <!-- 背景音樂 0501.mp3 -->
  <audio src="music/0501.mp3" autoplay loop style="display: none;"></audio>

  <div class="layout-container">
    <!-- 頂端跑馬燈區 1024x50 -->
    <div class="marquee-bar">
      <span>歡迎來到書曼的旅遊相簿，本網站有我的旅遊影像紀錄介紹耶！</span>
    </div>

    <!-- 主要內容區 -->
    <div class="main-body">
      <!-- 左側選單區 150px -->
      <aside class="sidebar-menu">
        <div class="menu-item"><img src="images/0508.gif" alt="書曼的旅遊相簿"></div>
        <div class="menu-item"><img src="images/0507.jpg" alt="書曼" class="shuman-photo"></div>
        <div class="menu-item nav-btn"><img src="images/0501b.gif" alt="金門逍遙遊" onmouseover="this.src='images/0501r.gif'" onmouseout="this.src='images/0501b.gif'"></div>
        <div class="menu-item nav-btn"><img src="images/0502b.gif" alt="卡蹓到馬祖" onmouseover="this.src='images/0502r.gif'" onmouseout="this.src='images/0502b.gif'"></div>
        <div class="menu-item nav-btn"><img src="images/0503b.gif" alt="踏浪澎湖行" onmouseover="this.src='images/0503r.gif'" onmouseout="this.src='images/0503b.gif'"></div>
        <div class="menu-item nav-btn"><img src="images/0504b.gif" alt="綠島唱夜曲" onmouseover="this.src='images/0504r.gif'" onmouseout="this.src='images/0504b.gif'"></div>
        <div class="menu-item nav-btn"><a href="album5/album5.html" target="content"><img src="images/0505b.gif" alt="蘭嶼賞魚去" onmouseover="this.src='images/0505r.gif'" onmouseout="this.src='images/0505b.gif'"></a></div>
        <div class="date-info">
          日期：2026/11/06<br>維護：01碼上學
        </div>
        <div class="menu-item nav-btn"><a href="index.html"><img src="images/0506b.gif" alt="回首頁" onmouseover="this.src='images/0506r.gif'" onmouseout="this.src='images/0506b.gif'"></a></div>
      </aside>

      <!-- 右側相簿展示內容區 -->
      <main class="content-frame">
        <iframe name="content" src="album5/album5.html" frameborder="0" width="100%" height="100%"></iframe>
      </main>
    </div>
  </div>
</body>
</html>`,
    defaultCssCode: `/* 題組五：書曼的旅遊相簿樣式設定 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #333333;
  font-family: "標楷體", sans-serif;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFCC;
  min-height: 768px;
}

.marquee-bar {
  height: 50px;
  line-height: 50px;
  background-color: #FFFFCC;
  color: #FF0000;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  overflow: hidden;
}

.main-body {
  display: flex;
  min-height: 718px;
}

.sidebar-menu {
  width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.shuman-photo {
  width: 120px;
  height: 120px;
}

.nav-btn img {
  cursor: pointer;
}

.date-info {
  font-family: "新細明體", sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: #FF0000;
  text-align: center;
  line-height: 1.5;
  margin: 8px 0;
}

.content-frame {
  flex: 1;
  padding: 36px;
}`,
    officialReferenceTips: '考場關鍵：五大景點按鈕懸停交換紅色圖片需確保路徑正確；電子相簿點選縮圖放大圖切換需確保框線樣式完全符合規定。',
  },
];

/**
 * 非官方歷史延伸/自訂練習題組（移出正式檢定題組清單，標示為待確認）
 * 不得冒充國家技能檢定正式題庫內容。
 */
export const NON_OFFICIAL_ARCHIVED_TASKS = [
  {
    archivedId: 'custom-taiwan-food',
    title: '台灣美食精緻巡禮',
    status: 'non_official_pending_confirmation',
    note: '此題組非勞動部 17300 技能檢定官方術科試題（官方僅 104301 至 104305 五大題組）。原始自訂示範內容暫予封存供一般網頁切版教學參考，不列入官方檢定模擬考試。',
    theme: '多欄圖文排版與自訂浮水印背景教學練習',
  },
];

/**
 * 依據題組代碼或 ID 安全查詢題組資料（防呆相容）
 */
export const getTaskByCode = (codeOrId: string | number): PracticalTaskDetail | undefined => {
  return OFFICIAL_PRACTICAL_TASKS.find(
    (t) => t.code === codeOrId || t.examCode === codeOrId || String(t.id) === String(codeOrId)
  );
};
