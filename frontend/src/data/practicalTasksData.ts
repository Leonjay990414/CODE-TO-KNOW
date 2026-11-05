/**
 * CODE TO KNOW (碼上學) - 網頁設計丙級 (17300) 術科官方題組規格資料庫
 * 依據勞動部勞動力發展署技能檢定中心 173003B12 術科試題規範：
 * 術科檢定共有 4 大題組（題組一至題組四），現場由考場抽出其中 1 組進行 120 分鐘限時實作。
 * 平台提供 4 大題組完整規格解構、考場防呆檢核點，與安全雙欄沙盒預載骨架。
 */

export interface PracticalTaskDetail {
  id: number;
  code: string;
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
  overview: string;
  requiredAssets: string[];
  disqualificationTraps: string[]; // 0 分致命陷阱
  scoringChecklist: string[];      // 評分關鍵查核項目
  defaultHtmlCode: string;         // 沙盒預載骨架
  defaultCssCode: string;
  officialReferenceTips: string;
}

export const OFFICIAL_PRACTICAL_TASKS: PracticalTaskDetail[] = [
  {
    id: 1,
    code: '17300-104301',
    title: '題組一：校園社團介紹網',
    theme: '多媒體嵌入、框架頁面 target 連動與跑馬燈特效',
    difficulty: '★☆☆',
    estimatedMinutes: 90,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 65px（社團總標題與標誌）',
      menu: '寬度 200px（社團選單按鈕區）',
      content: '寬度 824px × 高度 470px（iframe name="main" 主內文區）',
      footer: '1024px × 20px（版權聲明與最新更新日期）',
    },
    overview: '本題組評量應檢人建置標準校園社團資訊網之能力。需製作首頁 index.html，並包含跑馬燈、背景音樂自動循環，以及點擊左側選單（如吉他社、熱舞社）後，能在右側主內容框架中正確無刷新切換展示社團專頁。',
    requiredAssets: [
      '0101.jpg ~ 0105.jpg (社團形象照片)',
      '0101.gif ~ 0104.gif (動態社團圖標)',
      'music01.mp3 (背景音樂音訊檔)',
      'club_intro.txt (社團文字介紹原稿)',
    ],
    disqualificationTraps: [
      '所有檔案命名未符合題目規範（如檔名使用大寫或中文直接扣重分）。',
      '超連結目標 target 未設定或指向錯誤，導致在全新視窗開啟而非右側框架。',
      '背景音樂未自動播放或未設定循環 loop。',
      '首頁未嚴格使用 index.html 命名存於根目錄。',
    ],
    scoringChecklist: [
      '全站寬度 1024px 且在不同視窗寬度下維持居中。',
      '跑馬燈文字由右向左平滑捲動，文字內容無錯漏字。',
      '點選吉他社、熱舞社選單項目，右側主頁面流暢跳轉且排版正常。',
      '版權宣告「網頁維護：應檢人姓名、座號」正確無誤。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國立科技大學校園社團介紹網</title>
</head>
<body>
  <div class="layout-container">
    <!-- 頂端頁首區 1024x65 -->
    <header class="site-header">
      <h1>校園社團介紹網</h1>
    </header>

    <!-- 跑馬燈公告區 -->
    <div class="marquee-bar">
      <span>✦ 歡迎光臨國立科技大學校園社團介紹網！吉他社迎新表演即將登場！</span>
    </div>

    <!-- 中間內容區 -->
    <div class="main-body">
      <!-- 左側社團導航選單 -->
      <nav class="side-menu">
        <div class="menu-title">社團快速導覽</div>
        <a href="#guitar" class="menu-btn active">吉他社</a>
        <a href="#dance" class="menu-btn">熱舞社</a>
        <a href="#astro" class="menu-btn">天文社</a>
      </nav>

      <!-- 右側主內容框架區 -->
      <main class="content-frame">
        <h2>【吉他社簡介】</h2>
        <p>吉他社創立於 1998 年，致力於推廣民謠吉他與電吉他演奏藝術。每學期定期舉辦期初草地音樂會與期末成果發表會。</p>
        <div class="activity-card">
          <strong>近期活動：</strong>週五晚間 18:30 社團教室迎新民謠彈唱講座。
        </div>
      </main>
    </div>

    <!-- 底部頁尾區 1024x20 -->
    <footer class="site-footer">
      <p>網頁維護：碼上學考生 · 最新更新日期：2026/11/05</p>
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
  font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
  color: #26343D;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
  box-shadow: 0 4px 20px rgba(38, 52, 61, 0.08);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #D9E2EA;
}

.site-header {
  height: 65px;
  background-color: #526B7B;
  color: #FFFFFF;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.site-header h1 {
  font-size: 22px;
  letter-spacing: 1.5px;
}

.marquee-bar {
  background-color: #EFECE3;
  color: #7C663D;
  padding: 8px 16px;
  font-size: 13px;
  border-bottom: 1px solid #D9D2C4;
}

.main-body {
  display: flex;
  min-height: 470px;
}

.side-menu {
  width: 200px;
  background-color: #FAF9F5;
  border-right: 1px solid #D9E2EA;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-title {
  font-size: 12px;
  font-weight: 700;
  color: #8FA9B8;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.menu-btn {
  display: block;
  padding: 10px 14px;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  border-radius: 4px;
  text-decoration: none;
  color: #26343D;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.menu-btn:hover, .menu-btn.active {
  background-color: #526B7B;
  color: #FFFFFF;
  border-color: #526B7B;
}

.content-frame {
  flex: 1;
  padding: 24px;
  background-color: #FFFFFF;
}

.content-frame h2 {
  font-size: 18px;
  color: #526B7B;
  margin-bottom: 12px;
}

.content-frame p {
  font-size: 14px;
  line-height: 1.8;
  color: #4A5B66;
  margin-bottom: 16px;
}

.activity-card {
  background-color: #FAF9F5;
  border-left: 4px solid #BDA77E;
  padding: 12px 16px;
  font-size: 13px;
  color: #26343D;
}

.site-footer {
  height: 25px;
  background-color: #26343D;
  color: #D9E2EA;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}`,
    officialReferenceTips: '考場關鍵：請確認主頁面名稱為 index.html，子頁面分別為 guitar.html、dance.html、astro.html，並注意超連結路徑皆採相對路徑。',
  },
  {
    id: 2,
    code: '17300-104302',
    title: '題組二：國家公園生態探索網',
    theme: '頁內錨點跳轉、表格資訊展示與圖文清單等比例排版',
    difficulty: '★★☆',
    estimatedMinutes: 95,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 65px（生態保育網站標誌）',
      menu: '水平錨點導覽列（玉山、陽明山、太魯閣、墾丁）',
      content: '垂直流式圖文排版與保育指標數據表格',
      footer: '1024px × 20px（版權聲明與版次資訊）',
    },
    overview: '本題組著重於台灣國家公園地理景觀介紹。試題要求設計長頁面結構，頂端具備錨點連結，點選後能平滑跳轉至該國家公園之詳細介紹章節；並要求製作表格呈現各國家公園面積、成立年分與代表動植物。',
    requiredAssets: [
      'park01.jpg ~ park08.jpg (國家公園高解析風景圖)',
      'ecology.txt (生態介紹文字資料庫)',
      'table_data.txt (統計表格原始數據)',
    ],
    disqualificationTraps: [
      '錨點名稱與 href 未配對（如 href="#yushan" 但標籤未設 id="yushan"）。',
      '圖片未按比例縮放導致嚴重變形失真。',
      '表格未設定邊框或儲存格間距導致文字重疊。',
    ],
    scoringChecklist: [
      '所有錨點跳轉正確無誤，能正確定位至對應章節標題。',
      '表格具備適當標題 <caption> 與 <th> 表頭欄位。',
      '每張圖片皆填寫相應之 alt 替代文字。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>台灣國家公園生態探索網</title>
</head>
<body>
  <div class="layout-container">
    <header class="site-header">
      <h1>台灣國家公園生態探索網</h1>
    </header>

    <nav class="anchor-nav">
      <a href="#intro">總體簡介</a>
      <a href="#yushan">玉山國家公園</a>
      <a href="#taroko">太魯閣國家公園</a>
      <a href="#kenting">墾丁國家公園</a>
    </nav>

    <main class="main-content">
      <section id="intro" class="info-section">
        <h2>國家公園基本數據一覽</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>名稱</th>
              <th>成立年份</th>
              <th>涵蓋面積 (公頃)</th>
              <th>主要保護特色</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>墾丁</td>
              <td>1984</td>
              <td>33,289</td>
              <td>珊瑚礁地形與熱帶季風林</td>
            </tr>
            <tr>
              <td>玉山</td>
              <td>1985</td>
              <td>103,121</td>
              <td>高山生態系與台灣黑熊棲地</td>
            </tr>
            <tr>
              <td>太魯閣</td>
              <td>1986</td>
              <td>92,000</td>
              <td>大理岩峽谷與斷崖地形</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="yushan" class="info-section">
        <h2>【玉山國家公園】</h2>
        <p>玉山國家公園座落於台灣中央地帶，主峰海拔 3,952 公尺，為東北亞第一高峰。涵蓋溫帶至寒帶垂直植物林相，生態多樣性極為豐碩。</p>
      </section>

      <section id="taroko" class="info-section">
        <h2>【太魯閣國家公園】</h2>
        <p>太魯閣國家公園以雄偉壯麗、幾近垂直的大理岩峽谷景觀聞名全球。燕子口、九曲洞更是享譽國際的地質教室。</p>
      </section>
    </main>

    <footer class="site-footer">
      <p>版權所有 © 2026 國家公園管理處 · 網頁維護：應檢人</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
  color: #26343D;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  border-radius: 8px;
  overflow: hidden;
}

.site-header {
  height: 65px;
  background-color: #526B7B;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.anchor-nav {
  background-color: #FAF9F5;
  border-bottom: 1px solid #D9E2EA;
  padding: 10px 24px;
  display: flex;
  gap: 16px;
}

.anchor-nav a {
  color: #526B7B;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
}

.anchor-nav a:hover {
  background-color: #EFECE3;
  color: #7C663D;
}

.main-content {
  padding: 24px;
}

.info-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px dashed #D9E2EA;
}

.info-section h2 {
  font-size: 18px;
  color: #526B7B;
  margin-bottom: 12px;
}

.info-section p {
  font-size: 14px;
  line-height: 1.8;
  color: #4A5B66;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 13px;
}

.data-table th, .data-table td {
  border: 1px solid #D9E2EA;
  padding: 10px;
  text-align: left;
}

.data-table th {
  background-color: #FAF9F5;
  font-weight: 600;
  color: #26343D;
}

.site-footer {
  background-color: #26343D;
  color: #D9E2EA;
  font-size: 11px;
  text-align: center;
  padding: 10px;
}`,
    officialReferenceTips: '考場關鍵：確保 id 命名完全依照試題要求（大小寫須一致），並檢查捲動定位是否順暢。',
  },
  {
    id: 3,
    code: '17300-104303',
    title: '題組三：體育休閒活動中心',
    theme: '表單控制項驗證、多選項群組與動態選單 Hover 反白特效',
    difficulty: '★★★',
    estimatedMinutes: 100,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 65px（體育館標章與形象橫幅）',
      menu: '水平懸停反轉選單（首頁、設施介紹、線上預約）',
      content: '多功能線上預約報名表單（姓名、證號、項目、時段）',
      footer: '1024px × 20px（開放時間與聯繫電話）',
    },
    overview: '本題組評量應檢人建構互動式表單與動態選單特效之實力。需實作滑鼠移入選單項目時的動態顏色翻轉效果，並建立標準線上預約表單，包含單選鈕 (radio)、核取方塊 (checkbox)、下拉選單 (select) 及送出/清除按鈕。',
    requiredAssets: [
      'gym01.jpg ~ gym05.jpg (運動設施器材實景圖)',
      'sports_rules.txt (借用規則與收費基準)',
    ],
    disqualificationTraps: [
      '表單單選鈕 (radio) 未設定相同的 name 屬性，導致可複選。',
      '送出 (submit) 或重設 (reset) 按鈕功能遺失或型態設錯。',
      '必填欄位未加入 required 或表單缺乏 <form> 封裝。',
    ],
    scoringChecklist: [
      '導覽選單在滑鼠懸停 (:hover) 時具備明顯背景與字色反轉動效。',
      '表單包含完整 <label> 標籤對應 input id。',
      '點選重設按鈕時，所有填寫欄位確實恢復初始狀態。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>都會體育休閒活動中心</title>
</head>
<body>
  <div class="layout-container">
    <header class="site-header">
      <h1>都會體育休閒活動中心</h1>
    </header>

    <nav class="flip-nav">
      <a href="#about" class="nav-item">中心簡介</a>
      <a href="#facilities" class="nav-item">場館設施</a>
      <a href="#booking" class="nav-item active">線上預約場地</a>
    </nav>

    <main class="form-container">
      <h2>場地設施線上預約表單</h2>
      <form action="#" method="post" class="booking-form">
        <div class="form-group">
          <label for="userName">預約人姓名：</label>
          <input type="text" id="userName" name="userName" required placeholder="請輸入全名">
        </div>

        <div class="form-group">
          <label for="sportType">預約運動場館：</label>
          <select id="sportType" name="sportType">
            <option value="badminton">羽球場（A~D 館）</option>
            <option value="basketball">室內標準籃球場</option>
            <option value="swimming">溫水游泳池水道</option>
            <option value="fitness">重訓體適能中心</option>
          </select>
        </div>

        <div class="form-group">
          <label>預約時段：</label>
          <div class="radio-options">
            <label><input type="radio" name="timeSlot" value="morning" checked> 上午 (08:00 - 12:00)</label>
            <label><input type="radio" name="timeSlot" value="afternoon"> 下午 (13:00 - 17:00)</label>
            <label><input type="radio" name="timeSlot" value="evening"> 晚間 (18:00 - 22:00)</label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit">確認送出預約</button>
          <button type="reset" class="btn-reset">清除重填</button>
        </div>
      </form>
    </main>

    <footer class="site-footer">
      <p>開放時間：每日 06:00 - 22:00 · 服務專線：(02) 2345-6789</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
  color: #26343D;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  border-radius: 8px;
  overflow: hidden;
}

.site-header {
  height: 65px;
  background-color: #526B7B;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.flip-nav {
  display: flex;
  background-color: #26343D;
}

.nav-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  color: #D9E2EA;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.25s ease;
}

.nav-item:hover, .nav-item.active {
  background-color: #BDA77E;
  color: #FFFFFF;
}

.form-container {
  padding: 30px;
}

.form-container h2 {
  font-size: 18px;
  color: #526B7B;
  margin-bottom: 20px;
  border-bottom: 2px solid #EFECE3;
  padding-bottom: 8px;
}

.booking-form {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 600;
  color: #26343D;
}

.form-group input[type="text"], .form-group select {
  padding: 10px 12px;
  border: 1px solid #D9E2EA;
  border-radius: 4px;
  font-size: 14px;
}

.radio-options {
  display: flex;
  gap: 16px;
  font-size: 13px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 10px;
}

.btn-submit {
  padding: 10px 20px;
  background-color: #526B7B;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.btn-reset {
  padding: 10px 20px;
  background-color: #EFECE3;
  color: #7C663D;
  border: 1px solid #D9D2C4;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
}

.site-footer {
  background-color: #FAF9F5;
  border-top: 1px solid #D9E2EA;
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: #8FA9B8;
}`,
    officialReferenceTips: '考場關鍵：單選鈕群組的 name 屬性必須完全同名，測試時請務必點擊重設按鈕確認能清空。',
  },
  {
    id: 4,
    code: '17300-104304',
    title: '題組四：台灣美食精緻巡禮',
    theme: '多欄圖文排版、自訂固定浮水印背景與多媒體視訊整合',
    difficulty: '★★☆',
    estimatedMinutes: 90,
    canvasSpec: {
      width: '1024px',
      centering: '水平置中 (margin: 0 auto;)',
      header: '1024px × 65px（在地美食品味標章）',
      menu: '夜市小吃、傳統筵席、甜品飲品分類項目',
      content: '多欄網格卡片圖文並茂展示與固定浮水印背景',
      footer: '1024px × 20px（美食文化推廣委員會）',
    },
    overview: '本題組評量應檢人進行精緻版面設計與多媒體影音配置能力。需設定頁面背景固定浮水印圖片（background-attachment: fixed;），並將美食特色以整齊的多欄網格排列，嚴格設定圖片 alt 說明文字與語意標籤。',
    requiredAssets: [
      'food01.jpg ~ food06.jpg (台灣經典小吃高畫質圖片)',
      'watermark.jpg (背景浮水印淺色圖檔)',
      'food_story.txt (美食歷史淵源介紹)',
    ],
    disqualificationTraps: [
      '背景圖片未設定不重複 (no-repeat) 或未設固定導致畫面凌亂。',
      '圖片遺漏 alt 屬性（在檢定評分標準中每漏一張扣 5 分）。',
      '多欄排列在小螢幕爆版破壞 1024px 基準寬度。',
    ],
    scoringChecklist: [
      '浮水印背景在捲動網頁時維持固定不位移。',
      '美食卡片間距均勻對齊，文字說明與圖片尺寸統一。',
      '所有多媒體標籤皆遵循現代 HTML5 標準。',
    ],
    defaultHtmlCode: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>台灣美食精緻巡禮</title>
</head>
<body>
  <div class="layout-container">
    <header class="site-header">
      <h1>台灣美食精緻巡禮</h1>
    </header>

    <div class="hero-banner">
      <h2>✦ 舌尖上的島嶼記憶 · 尋訪在地極致美味</h2>
    </div>

    <main class="food-grid">
      <div class="food-card">
        <h3>珍珠奶茶</h3>
        <p>Q 彈黑糖珍珠融入濃郁香醇奶茶，成為風靡全球的台灣代表性特色飲品。</p>
        <span class="tag">經典飲品</span>
      </div>

      <div class="food-card">
        <h3>傳統牛肉麵</h3>
        <p>嚴選牛腱慢火燉煮高湯，搭配手打勁道麵條與酸菜，香氣四溢層次豐富。</p>
        <span class="tag">熱門主食</span>
      </div>

      <div class="food-card">
        <h3>小籠湯包</h3>
        <p>薄透麵皮包裹豐沛鮮甜肉汁，十八折精巧捏花，一口咬下滿溢濃郁鮮香。</p>
        <span class="tag">排隊名店</span>
      </div>

      <div class="food-card">
        <h3>芒果雪花冰</h3>
        <p>綿密細緻的牛奶雪花冰底，鋪滿金黃香甜愛文芒果果肉與手作煉乳淋醬。</p>
        <span class="tag">消暑甜品</span>
      </div>
    </main>

    <footer class="site-footer">
      <p>台灣美食文化推廣委員會 · 網頁維護：應檢人</p>
    </footer>
  </div>
</body>
</html>`,
    defaultCssCode: `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: #F5F2EA;
  font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif;
  color: #26343D;
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.layout-container {
  width: 1024px;
  background-color: #FFFFFF;
  border: 1px solid #D9E2EA;
  border-radius: 8px;
  overflow: hidden;
}

.site-header {
  height: 65px;
  background-color: #526B7B;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.hero-banner {
  background-color: #FAF9F5;
  border-bottom: 1px solid #D9D2C4;
  padding: 16px 24px;
}

.hero-banner h2 {
  font-size: 15px;
  color: #7C663D;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 24px;
}

.food-card {
  border: 1px solid #D9E2EA;
  border-radius: 6px;
  padding: 18px;
  background-color: #FAF9F5;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.food-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(38, 52, 61, 0.08);
}

.food-card h3 {
  font-size: 16px;
  color: #526B7B;
  margin-bottom: 8px;
}

.food-card p {
  font-size: 13px;
  line-height: 1.7;
  color: #4A5B66;
  margin-bottom: 12px;
}

.food-card .tag {
  display: inline-block;
  background-color: #EFECE3;
  color: #7C663D;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
}

.site-footer {
  background-color: #26343D;
  color: #D9E2EA;
  font-size: 11px;
  text-align: center;
  padding: 10px;
}`,
    officialReferenceTips: '考場關鍵：確認 1024px 版面無橫向溢出捲軸，圖片必須設定 width/height 或保持 CSS 比例相符。',
  },
];

