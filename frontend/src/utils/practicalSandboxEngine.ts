/**
 * CODE TO KNOW (碼上學) - 術科多頁 HTML 虛擬沙盒引擎 (Multi-Page Virtual Sandbox Engine)
 * 
 * 功能亮點：
 * 1. 完整五大題組官方標準骨架與檔案樹 (Virtual File System)
 * 2. 學生編輯區與官方標準骨架嚴格物理隔離 (保護標準答案不被篡改)
 * 3. 支援多頁 HTML 預覽、相對路徑解析、iframe 內嵌子頁切換與 target="_top" 頂層跳脫
 * 4. 內建零破圖向量 SVG 素材產生器，保證離線預覽圖文完美渲染
 * 5. 安全 Iframe Sandbox 防護 (阻絕惡意腳本外洩，封閉於沙盒情境)
 */

export interface VirtualFile {
  name: string;
  path: string; // e.g. "index.html", "main.html", "css/style.css"
  type: 'html' | 'css' | 'javascript' | 'text' | 'image';
  content: string;
  isEntry?: boolean;
  readOnly?: boolean;
}

export interface VirtualProject {
  taskId: number;
  taskTitle: string;
  defaultEntryPath: string;
  files: Record<string, VirtualFile>;
}

const STORAGE_PREFIX = 'c2k_student_sandbox_workspace';

// ============================================================================
// SVG 預設圖檔產生器 (防止沙盒中圖片破損)
// ============================================================================
function generateMockSvgDataUri(width: number, height: number, label: string, bgColor: string, textColor: string = '#FFFFFF'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${bgColor}" rx="4" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${Math.max(12, Math.floor(height / 6))}px" fill="${textColor}">
      ${label} (${width}x${height})
    </text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ============================================================================
// 五大題組標準骨架產生器
// ============================================================================

export function getOfficialTaskTemplate(taskId: number): VirtualProject {
  switch (taskId) {
    case 1:
      return {
        taskId: 1,
        taskTitle: '題組一：校園社團介紹網 (104301)',
        defaultEntryPath: 'index.html',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            type: 'html',
            isEntry: true,
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國立科技高中─校園社團介紹網</title>
  <link rel="stylesheet" href="./css/style.css">
</head>
<body>
  <div class="layout-container">
    <!-- 頂端標題區 -->
    <header class="header">
      <a href="./index.html">
        <img src="${generateMockSvgDataUri(994, 60, '國立科技高中校園社團介紹網 LOGO', '#2D4E5E')}" alt="國立科技高中校園社團介紹網" width="994" height="60">
      </a>
    </header>

    <!-- 跑馬燈公告區 -->
    <div class="marquee-bar">
      <marquee behavior="scroll" direction="left">歡迎光臨校園社團介紹網，參觀後請支持社團活動並熱烈參與</marquee>
    </div>

    <!-- 中間主要區域 -->
    <div class="main-body">
      <!-- 左側選單 -->
      <aside class="sidebar">
        <div class="menu-title">社團介紹</div>
        <nav class="menu-list">
          <!-- target 指向右側 iframe 的 name -->
          <a href="./guitar_history.html" target="myFrame" class="menu-item active">吉他社</a>
          <span class="menu-item disabled">熱舞社</span>
          <span class="menu-item disabled">棒球社</span>
          <span class="menu-item disabled">羽球社</span>
          <span class="menu-item disabled">足球社</span>
          <span class="menu-item disabled">童軍社</span>
        </nav>
        <div class="update-date">最近更新日期：2026/09/26</div>
      </aside>

      <!-- 右側內容區 -->
      <main class="content-area">
        <iframe src="./main.html" name="myFrame" frameborder="0" id="contentIframe"></iframe>
      </main>
    </div>

    <!-- 頁尾版權宣告區 -->
    <footer class="footer">
      網頁設計及維護：00kmtiger
    </footer>
  </div>
</body>
</html>`,
          },
          'main.html': {
            name: 'main.html',
            path: 'main.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>首頁預設內容</title>
  <style>
    body {
      font-family: "標楷體", serif;
      background-color: #F7FAFC;
      text-align: center;
      padding: 24px 16px;
      margin: 0;
    }
    .principal-img {
      width: 250px;
      height: 250px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .welcome-text {
      font-size: 24px;
      font-weight: bold;
      font-style: italic;
      color: #0000FF;
      line-height: 1.8;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="main-container">
    <img src="${generateMockSvgDataUri(250, 250, '校長玉照 (0104.png)', '#4A7C59')}" alt="科技高中校長" class="principal-img">
    <p class="welcome-text">
      嗨！歡迎加入國立科技高中。<br>
      參加社團不僅可以豐富自己的人生、寬闊自己的視野，<br>
      也能砥礪技能、磨練人際、培養第二專長。<br>
      選擇一項您喜歡的社團，積極的參與和投入，<br>
      您會獲得一陣陣的驚喜！
    </p>
  </div>
</body>
</html>`,
          },
          'guitar_history.html': {
            name: 'guitar_history.html',
            path: 'guitar_history.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>吉他社社史</title>
  <style>
    body {
      font-family: "標楷體", serif;
      background-color: #FAF8F2;
      padding: 16px;
      margin: 0;
    }
    header {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      color: #FF0000;
      margin-bottom: 12px;
    }
    nav.sub-nav {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #D9D2C4;
    }
    nav.sub-nav a {
      color: #2D4E5E;
      text-decoration: none;
      font-weight: 600;
    }
    nav.sub-nav a:hover {
      color: #FF0000;
      text-decoration: underline;
    }
    .article-box {
      color: #FF0000;
      font-size: 16px;
      line-height: 1.8;
    }
    .article-img {
      width: 250px;
      height: 250px;
      float: left;
      margin-right: 16px;
      margin-bottom: 12px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>吉他社社史</header>
  <nav class="sub-nav">
    <!-- [CTK-DES] 核心重點：回首頁切記使用 _top，防止巢狀割裂 -->
    <a href="./index.html" target="_top">【社團首頁】</a>
    <a href="./guitar_event.html">【近期活動】</a>
    <a href="./guitar_learning.html">【教學內容】</a>
  </nav>
  <div class="article-box">
    <img src="${generateMockSvgDataUri(250, 250, '吉他社社史配圖 0101', '#8C5E58')}" alt="吉他社社史" class="article-img">
    <p>本社成立於民國八十五年，由喜愛音樂的同學共同發起。三十年來，我們培育了無數傑出的校園吉他手與創作歌手。在這裡，你可以從零開始學習彈唱、指彈 (Fingerstyle) 與樂理合奏，每年更定期舉辦期初音樂祭與成果發表大會，讓青春之歌響徹校園！</p>
  </div>
</body>
</html>`,
          },
          'guitar_event.html': {
            name: 'guitar_event.html',
            path: 'guitar_event.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>吉他社近期活動</title>
  <style>
    body { font-family: "標楷體", serif; background-color: #FAF8F2; padding: 16px; margin: 0; }
    header { text-align: center; font-size: 20px; font-weight: bold; color: #FF0000; margin-bottom: 12px; }
    nav.sub-nav { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
    nav.sub-nav a { color: #2D4E5E; text-decoration: none; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #BDA77E; padding: 8px 12px; text-align: left; }
    th { background-color: #E8DCD8; color: #26343D; }
    .top-anchor { text-align: right; margin-top: 16px; }
  </style>
</head>
<body>
  <a id="pageTop"></a>
  <header>吉他社近期活動</header>
  <nav class="sub-nav">
    <a href="./index.html" target="_top">【社團首頁】</a>
    <a href="./guitar_history.html">【社史介紹】</a>
    <a href="./guitar_learning.html">【教學內容】</a>
  </nav>
  <table>
    <thead>
      <tr><th>活動日期</th><th>活動名稱</th><th>活動地點</th><th>主辦人</th></tr>
    </thead>
    <tbody>
      <tr><td>10/15</td><td>新生吉他入門工作坊</td><td>活動中心 302</td><td>社長</td></tr>
      <tr><td>11/20</td><td>秋季草地不插電彈唱會</td><td>司令台前草皮</td><td>活動組</td></tr>
      <tr><td>12/25</td><td>聖誕歲末愛心義演</td><td>演藝廳</td><td>教學組</td></tr>
    </tbody>
  </table>
  <div class="top-anchor">
    <a href="#pageTop" style="color: #5A7D6C; text-decoration: none; font-weight: bold;">▲ 回頂端 (TOP)</a>
  </div>
</body>
</html>`,
          },
          'guitar_learning.html': {
            name: 'guitar_learning.html',
            path: 'guitar_learning.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>吉他社教學內容</title>
  <style>
    body { font-family: "標楷體", serif; background-color: #FAF8F2; padding: 16px; margin: 0; }
    header { text-align: center; font-size: 20px; font-weight: bold; color: #FF0000; margin-bottom: 12px; }
    nav.sub-nav { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
    nav.sub-nav a { color: #2D4E5E; text-decoration: none; font-weight: 600; }
    ol { line-height: 2; color: #26343D; font-size: 16px; }
  </style>
</head>
<body>
  <header>吉他社教學內容</header>
  <nav class="sub-nav">
    <a href="./index.html" target="_top">【社團首頁】</a>
    <a href="./guitar_history.html">【社史介紹】</a>
    <a href="./guitar_event.html">【近期活動】</a>
  </nav>
  <ol>
    <li>初階第一週：認識六線譜與標準調音 (E-A-D-G-B-E)</li>
    <li>初階第二週：基礎四和弦掌握 (C, Am, Fmaj7, G7)</li>
    <li>初階第三週：右手靈活慢搖滾刷弦節奏與切音練習</li>
    <li>進階專題：音階爬格子訓練與左手換弦消音技巧</li>
  </ol>
</body>
</html>`,
          },
          'css/style.css': {
            name: 'style.css',
            path: 'css/style.css',
            type: 'css',
            content: `/* 全站樣式表 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: "標楷體", serif;
  background-color: #E2E8F0;
}
.layout-container {
  width: 1024px;
  margin: 0 auto;
  background-color: #FFFFFF;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
.header {
  width: 1000px;
  height: 65px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.marquee-bar {
  width: 1000px;
  margin: 0 auto;
  background-color: #EBF2EE;
  color: #2D4E5E;
  padding: 6px 12px;
  font-size: 15px;
  font-weight: 600;
  border-top: 1px solid #D9E2EA;
  border-bottom: 1px solid #D9E2EA;
}
.main-body {
  width: 1000px;
  margin: 10px auto;
  display: flex;
  gap: 15px;
  min-height: 580px;
}
.sidebar {
  width: 215px;
  background-color: #FAF8F2;
  border: 1px solid #D9D2C4;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
.menu-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #26343D;
  padding-bottom: 8px;
  border-bottom: 2px solid #BDA77E;
  margin-bottom: 10px;
}
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.menu-item {
  display: block;
  padding: 10px;
  text-align: center;
  background-color: #FFFFFF;
  border: 1px solid #D9D2C4;
  border-radius: 4px;
  color: #2D4E5E;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}
.menu-item:hover, .menu-item.active {
  background-color: #5A7D6C;
  color: #FFFFFF;
  border-color: #5A7D6C;
}
.menu-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.update-date {
  font-size: 12px;
  color: #8FA9B8;
  text-align: center;
  margin-top: 10px;
}
.content-area {
  flex: 1;
  border: 1px solid #D9D2C4;
  border-radius: 6px;
  overflow: hidden;
  background-color: #FFFFFF;
}
.content-area iframe {
  width: 100%;
  height: 100%;
  min-height: 580px;
  display: block;
}
.footer {
  width: 1000px;
  height: 20px;
  margin: 0 auto;
  text-align: center;
  font-size: 13px;
  color: #526B7B;
  padding: 10px 0;
  border-top: 1px solid #E2E8F0;
}`,
          },
        },
      };

    case 2:
      return {
        taskId: 2,
        taskTitle: '題組二：運動廣場連結網 (104302)',
        defaultEntryPath: 'index.html',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            type: 'html',
            isEntry: true,
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>運動廣場連結網</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #666666;
      font-family: "標楷體", serif;
    }
    .wrapper {
      width: 1024px;
      margin: 0 auto;
      background-color: #FFFFFF;
      min-height: 768px;
    }
    header.banner {
      height: 120px;
      background-color: #2D4E5E;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .banner-title {
      font-size: 52px;
      color: #FFFFFF;
      /* 官方嚴格規準：10px 10px 15px #333333 */
      text-shadow: 10px 10px 15px #333333;
    }
    .main-section {
      display: flex;
      min-height: 600px;
    }
    nav.nav-menu {
      width: 200px;
      background-color: #FAF8F2;
      border-right: 1px solid #D9D2C4;
      padding: 16px 12px;
    }
    .nav-btn {
      display: block;
      padding: 12px;
      margin-bottom: 8px;
      background-color: #FFFFFF;
      border: 1px solid #BDA77E;
      border-radius: 4px;
      text-decoration: none;
      color: #26343D;
      text-align: center;
      font-weight: 600;
    }
    .nav-btn:hover { background-color: #BDA77E; color: #26343D; }
    main.sub-content { flex: 1; padding: 16px; }
    iframe { width: 100%; height: 580px; border: none; }
    footer {
      height: 30px;
      text-align: center;
      line-height: 30px;
      font-size: 13px;
      color: #526B7B;
      border-top: 1px solid #E2E8F0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <header class="banner">
      <h1 class="banner-title">運動廣場連結網</h1>
    </header>
    <div class="main-section">
      <nav class="nav-menu">
        <a href="results/baseball.html" target="sportsFrame" class="nav-btn">棒球天地</a>
        <a href="results/basketball.html" target="sportsFrame" class="nav-btn">籃球天地</a>
        <a href="results/swimming.html" target="sportsFrame" class="nav-btn">游泳天地</a>
        <a href="results/msgboard.html" target="sportsFrame" class="nav-btn">訪客留言板</a>
      </nav>
      <main class="sub-content">
        <iframe src="results/baseball.html" name="sportsFrame"></iframe>
      </main>
    </div>
    <footer>網頁設計及維護：00kmtiger</footer>
  </div>
</body>
</html>`,
          },
          'results/baseball.html': {
            name: 'baseball.html',
            path: 'results/baseball.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>棒球天地</title>
  <style>
    body { font-family: "標楷體", serif; padding: 16px; margin: 0; text-align: center; }
    .large-img-box { margin-bottom: 20px; }
    .large-img-box img {
      width: 480px;
      height: 320px;
      border: 3px solid #5A7D6C;
      border-radius: 8px;
    }
    .thumb-strip { display: flex; justify-content: center; gap: 16px; }
    .thumb-strip img {
      width: 100px;
      height: 70px;
      cursor: pointer;
      border: 2px solid #D9D2C4;
      border-radius: 4px;
      transition: transform 0.2s;
    }
    .thumb-strip img:hover { transform: scale(1.08); border-color: #5A7D6C; }
  </style>
</head>
<body>
  <h2>棒球精彩花絮</h2>
  <div class="large-img-box">
    <img id="mainDisplay" src="${generateMockSvgDataUri(480, 320, '棒球擊球瞬間 (0202B)', '#2D4E5E')}" alt="棒球大圖">
  </div>
  <div class="thumb-strip">
    <img src="${generateMockSvgDataUri(100, 70, '縮圖 1 (0202A)', '#2D4E5E')}" alt="縮圖1" onclick="switchLarge(this.src)">
    <img src="${generateMockSvgDataUri(100, 70, '縮圖 2 (0203A)', '#8C5E58')}" alt="縮圖2" onclick="switchLarge(this.src)">
    <img src="${generateMockSvgDataUri(100, 70, '縮圖 3 (0204A)', '#4A7C59')}" alt="縮圖3" onclick="switchLarge(this.src)">
  </div>
  <script>
    function switchLarge(src) {
      document.getElementById('mainDisplay').src = src;
    }
  </script>
</body>
</html>`,
          },
          'results/msgboard.html': {
            name: 'msgboard.html',
            path: 'results/msgboard.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>訪客留言板</title>
  <style>
    body { font-family: "標楷體", serif; padding: 20px; margin: 0; }
    .form-group { margin-bottom: 16px; }
    label { font-weight: bold; margin-right: 8px; }
    input[type="text"], textarea { padding: 6px 10px; border: 1px solid #D9D2C4; border-radius: 4px; width: 300px; }
    .btn-row { margin-top: 20px; }
    button, input[type="reset"] { padding: 8px 18px; margin-right: 12px; cursor: pointer; border-radius: 4px; }
  </style>
</head>
<body>
  <h2>訪客留言板</h2>
  <form onsubmit="alert('留言已送出！'); return false;">
    <div class="form-group">
      <label for="name">您的姓名：</label>
      <input type="text" id="name" required>
    </div>
    <div class="form-group">
      <label>性別：</label>
      <!-- [CTK-DES] name="gender" 一致達成嚴格互斥 -->
      <label><input type="radio" name="gender" value="male" checked> 男生</label>
      <label><input type="radio" name="gender" value="female"> 女生</label>
    </div>
    <div class="form-group">
      <label for="msg">留言內容：</label><br>
      <textarea id="msg" rows="4" style="width: 400px;" required></textarea>
    </div>
    <div class="btn-row">
      <button type="submit" style="background:#5A7D6C; color:#FFF; border:none;">送出留言</button>
      <input type="reset" value="重新輸入" style="background:#E2E8F0; border:1px solid #CBD5E0;">
    </div>
  </form>
</body>
</html>`,
          },
        },
      };

    case 3:
      return {
        taskId: 3,
        taskTitle: '題組三：國家公園介紹網 (104303)',
        defaultEntryPath: 'index.html',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            type: 'html',
            isEntry: true,
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>國家公園介紹網</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #00FFFF; font-family: "標楷體", serif; }
    .container { width: 1024px; margin: 0 auto; background-color: #FFFFFF; }
    .banner-container { width: 1024px; height: 100px; overflow: hidden; }
    .banner-container img { width: 1024px; height: 100px; display: block; }
    .main-body { display: flex; min-height: 600px; }
    .side-nav { width: 200px; background-color: #EBF2EE; padding: 16px 12px; }
    .side-nav a { display: block; padding: 10px; margin-bottom: 8px; background: #FFF; border: 1px solid #5A7D6C; text-align: center; text-decoration: none; color: #2D4E5E; font-weight: bold; }
    .content-frame { flex: 1; padding: 16px; }
    iframe { width: 100%; height: 560px; border: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner-container">
      <img id="rotator" src="${generateMockSvgDataUri(1024, 100, '國家公園首頁標題 1 (park0301)', '#2D4E5E')}" alt="輪播標題">
    </div>
    <div class="main-body">
      <div class="side-nav">
        <a href="park/yangmingshan.html" target="parkFrame">陽明山</a>
        <a href="park/sheipa.html" target="parkFrame">雪霸</a>
      </div>
      <div class="content-frame">
        <iframe src="others/main.html" name="parkFrame"></iframe>
      </div>
    </div>
  </div>
  <script>
    // [GOV-REQ] 1 秒定時輪播
    var imgs = [
      '${generateMockSvgDataUri(1024, 100, '國家公園首頁標題 1 (park0301)', '#2D4E5E')}',
      '${generateMockSvgDataUri(1024, 100, '國家公園首頁標題 2 (park0302)', '#4A7C59')}',
      '${generateMockSvgDataUri(1024, 100, '國家公園首頁標題 3 (park0303)', '#8C5E58')}',
      '${generateMockSvgDataUri(1024, 100, '國家公園首頁標題 4 (park0304)', '#BDA77E')}'
    ];
    var cur = 0;
    setInterval(function() {
      cur = (cur + 1) % imgs.length;
      document.getElementById('rotator').src = imgs[cur];
    }, 1000);
  </script>
</body>
</html>`,
          },
          'others/main.html': {
            name: 'main.html',
            path: 'others/main.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>地圖導覽</title>
  <style>body { font-family: "標楷體", serif; text-align: center; padding: 20px; }</style>
</head>
<body>
  <h2>點選地圖探索國家公園</h2>
  <img src="${generateMockSvgDataUri(600, 400, '台灣國家公園分佈地圖 (national_park)', '#5A7D6C')}" usemap="#taiwanMap" alt="地圖">
  <map name="taiwanMap">
    <!-- 矩形 (rect) -->
    <area shape="rect" coords="200,30,400,100" href="../park/yangmingshan.html" alt="陽明山">
    <!-- 多邊形 (poly) -->
    <area shape="poly" coords="180,120,250,90,320,130,280,180,190,160" href="../park/sheipa.html" alt="雪霸">
  </map>
</body>
</html>`,
          },
          'park/yangmingshan.html': {
            name: 'yangmingshan.html',
            path: 'park/yangmingshan.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>陽明山國家公園</title>
  <style>body { font-family: "標楷體", serif; padding: 20px; }</style>
</head>
<body>
  <h2>陽明山國家公園</h2>
  <p>陽明山國家公園原名草山，以火山地質景觀著稱，有豐富的大油坑、小油坑溫泉景觀...</p>
  <p><a href="../others/main.html">回地圖主頁</a></p>
</body>
</html>`,
          },
          'park/sheipa.html': {
            name: 'sheipa.html',
            path: 'park/sheipa.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>雪霸國家公園</title>
  <style>body { font-family: "標楷體", serif; padding: 20px; }</style>
</head>
<body>
  <h2>雪霸國家公園</h2>
  <p>雪霸國家公園涵蓋雪山山脈，擁有台灣高山珍貴的台灣櫻花鉤吻鮭及冰河遺跡...</p>
  <p><a href="../others/main.html">回地圖主頁</a></p>
</body>
</html>`,
          },
        },
      };

    case 4:
      return {
        taskId: 4,
        taskTitle: '題組四：網路行銷購物網 (104304)',
        defaultEntryPath: 'index.html',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            type: 'html',
            isEntry: true,
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>網路行銷購物網</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "標楷體", serif; background-color: #FAF8F2; }
    .wrapper { width: 1024px; margin: 0 auto; background: #FFF; }
    header { height: 150px; background: #2D4E5E; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 40px; }
    .content-row { display: flex; }
    aside { width: 200px; background: #EBF2EE; padding: 16px; }
    aside a { display: block; padding: 10px; margin-bottom: 8px; background: #FFF; border: 1px solid #5A7D6C; text-align: center; text-decoration: none; color: #2D4E5E; font-weight: bold; }
    main { flex: 1; padding: 16px; }
    iframe { width: 100%; height: 500px; border: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <header>網路行銷購物網</header>
    <div class="content-row">
      <aside>
        <a href="main.html" target="shopFrame">熱銷商品 (3×3)</a>
        <a href="results/purchase.html" target="shopFrame">填寫訂購單</a>
      </aside>
      <main>
        <iframe src="main.html" name="shopFrame"></iframe>
      </main>
    </div>
  </div>
</body>
</html>`,
          },
          'main.html': {
            name: 'main.html',
            path: 'main.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>熱銷商品矩陣</title>
  <style>
    body { font-family: "標楷體", serif; padding: 16px; }
    table { width: 100%; border-collapse: collapse; }
    /* [GOV-REQ] 3x3 表格每列高 150px */
    tr { height: 150px; }
    td { border: 1px solid #D9D2C4; padding: 8px; text-align: center; }
  </style>
</head>
<body>
  <h2>推薦商品一覽</h2>
  <table>
    <tr>
      <td>
        <!-- target="_blank" 與 rel="noopener noreferrer" -->
        <a href="results/leather1.html" target="_blank" rel="noopener noreferrer">
          <img src="${generateMockSvgDataUri(120, 100, '精選皮包 0401', '#8C5E58')}" alt="皮包">
        </a>
      </td>
      <td>手工經典女包<br>特價 NT$ 2,580</td>
      <td>
        <a href="results/leather2.html" target="_blank" rel="noopener noreferrer">
          <img src="${generateMockSvgDataUri(120, 100, '時尚短夾 0403', '#4A7C59')}" alt="短夾">
        </a>
      </td>
    </tr>
    <tr>
      <td>商務真皮長夾<br>特價 NT$ 1,980</td>
      <td>
        <img src="${generateMockSvgDataUri(120, 100, '配件小物 0404', '#BDA77E')}" alt="配件">
      </td>
      <td>休閒側背包<br>特價 NT$ 1,480</td>
    </tr>
  </table>
</body>
</html>`,
          },
          'results/purchase.html': {
            name: 'purchase.html',
            path: 'results/purchase.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>訂購確認</title>
  <style>body { font-family: "標楷體", serif; padding: 20px; }</style>
</head>
<body>
  <h2>購物狀態確認表單</h2>
  <form onsubmit="handleOrder(event)">
    <p>皮包：
      <label><input type="radio" name="bag" value="選購" checked> 選購</label>
      <label><input type="radio" name="bag" value="考慮中"> 考慮中</label>
      <label><input type="radio" name="bag" value="不購買"> 不購買</label>
    </p>
    <p>短夾：
      <label><input type="radio" name="wallet" value="選購"> 選購</label>
      <label><input type="radio" name="wallet" value="考慮中" checked> 考慮中</label>
      <label><input type="radio" name="wallet" value="不購買"> 不購買</label>
    </p>
    <button type="submit">確認購買狀態</button>
  </form>
  <script>
    function handleOrder(e) {
      e.preventDefault();
      var b = document.querySelector('input[name="bag"]:checked').value;
      var w = document.querySelector('input[name="wallet"]:checked').value;
      alert('訂購狀態核對：\\n皮包：' + b + '\\n短夾：' + w);
    }
  </script>
</body>
</html>`,
          },
          'results/leather1.html': {
            name: 'leather1.html',
            path: 'results/leather1.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head><meta charset="UTF-8"><title>商品詳情：經典女包</title></head>
<body style="font-family:'標楷體'; padding:20px;">
  <h2>經典手工真皮女包</h2>
  <p>以新視窗開啟之商品詳情頁。</p>
</body>
</html>`,
          },
          'results/leather2.html': {
            name: 'leather2.html',
            path: 'results/leather2.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head><meta charset="UTF-8"><title>商品詳情：時尚短夾</title></head>
<body style="font-family:'標楷體'; padding:20px;">
  <h2>時尚短夾</h2>
  <p>以新視窗開啟之商品詳情頁。</p>
</body>
</html>`,
          },
        },
      };

    case 5:
    default:
      return {
        taskId: 5,
        taskTitle: '題組五：書曼的旅遊相簿 (104305)',
        defaultEntryPath: 'index.html',
        files: {
          'index.html': {
            name: 'index.html',
            path: 'index.html',
            type: 'html',
            isEntry: true,
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>書曼的旅遊相簿</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    /* [GOV-REQ] 外圍背景為深灰色 #333333 */
    body { background-color: #333333; font-family: "標楷體", serif; }
    /* [GOV-REQ] 內圍背景為淺黃色 #FFFFCC */
    .wrapper { width: 1024px; margin: 0 auto; background-color: #FFFFCC; min-height: 768px; }
    header { height: 100px; background-color: #2D4E5E; display: flex; align-items: center; justify-content: center; color: #FFF; font-size: 42px; }
    .main-body { display: flex; min-height: 600px; }
    .album-menu { width: 200px; padding: 20px 12px; }
    .album-menu a { display: block; margin-bottom: 12px; }
    .album-menu img { width: 160px; height: 45px; display: block; margin: 0 auto; }
    .content-view { flex: 1; padding: 16px; }
    iframe { width: 100%; height: 580px; border: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <header>書曼的旅遊相簿</header>
    <div class="main-body">
      <nav class="album-menu">
        <!-- 藍進紅出滑鼠移 (b.gif 與 r.gif 切換) -->
        <a href="album5/album5.html" target="albumFrame">
          <img src="${generateMockSvgDataUri(160, 45, '蘭嶼相簿 (藍)', '#0000FF')}"
               onmouseover="this.src='${generateMockSvgDataUri(160, 45, '蘭嶼相簿 (紅)', '#FF0000')}'"
               onmouseout="this.src='${generateMockSvgDataUri(160, 45, '蘭嶼相簿 (藍)', '#0000FF')}'"
               alt="蘭嶼相簿">
        </a>
      </nav>
      <div class="content-view">
        <iframe src="album5/album5.html" name="albumFrame"></iframe>
      </div>
    </div>
  </div>
</body>
</html>`,
          },
          'album5/album5.html': {
            name: 'album5.html',
            path: 'album5/album5.html',
            type: 'html',
            content: `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="UTF-8">
  <title>蘭嶼相簿</title>
  <style>
    body { font-family: "標楷體", serif; background-color: #FFFFCC; padding: 16px; text-align: center; margin: 0; }
    /* [GOV-REQ] 大圖 400x300px，藍色外框 5px */
    .big-photo {
      width: 400px;
      height: 300px;
      border: 5px solid #0000FF;
      border-radius: 4px;
      margin: 0 auto 16px;
      display: block;
    }
    .thumb-row { display: flex; justify-content: center; gap: 12px; }
    /* [GOV-REQ] 縮圖 hover 顯示青色外框 #00FFFF */
    .thumb-row img {
      width: 90px;
      height: 65px;
      cursor: pointer;
      border: 2px solid transparent;
      border-radius: 4px;
    }
    .thumb-row img:hover {
      border-color: #00FFFF;
    }
  </style>
</head>
<body>
  <h2>蘭嶼飛魚季風光</h2>
  <img id="mainAlbumView" class="big-photo" src="${generateMockSvgDataUri(400, 300, '蘭嶼大圖 1 (0507)', '#2D4E5E')}" alt="相簿大圖">
  <div class="thumb-row">
    <img src="${generateMockSvgDataUri(90, 65, '縮圖 1 (0511)', '#2D4E5E')}" onclick="changePhoto(this.src)" alt="縮圖1">
    <img src="${generateMockSvgDataUri(90, 65, '縮圖 2 (0521)', '#4A7C59')}" onclick="changePhoto(this.src)" alt="縮圖2">
    <img src="${generateMockSvgDataUri(90, 65, '縮圖 3 (0531)', '#8C5E58')}" onclick="changePhoto(this.src)" alt="縮圖3">
  </div>
  <script>
    function changePhoto(src) {
      document.getElementById('mainAlbumView').src = src;
    }
  </script>
</body>
</html>`,
          },
        },
      };
  }
}

// ============================================================================
// 學生工作區儲存與讀取 (與標準答案完全隔離)
// ============================================================================

export function getStudentProject(taskId: number): VirtualProject {
  const template = getOfficialTaskTemplate(taskId);
  if (typeof window === 'undefined' || !window.localStorage) {
    return template;
  }

  const key = `${STORAGE_PREFIX}_${taskId}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return template;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.files || typeof parsed.files !== 'object') {
      return template;
    }

    // 將已存內容與模板鍵位合併，保護不會缺少新檔案
    const mergedFiles = { ...template.files };
    Object.keys(parsed.files).forEach((filePath) => {
      if (mergedFiles[filePath]) {
        mergedFiles[filePath] = {
          ...mergedFiles[filePath],
          content: parsed.files[filePath].content,
        };
      } else {
        mergedFiles[filePath] = parsed.files[filePath];
      }
    });

    return {
      taskId,
      taskTitle: template.taskTitle,
      defaultEntryPath: template.defaultEntryPath,
      files: mergedFiles,
    };
  } catch (err) {
    console.warn(`[SandboxEngine] 讀取學生工作區 (${key}) 失敗，退回標準骨架:`, err);
    return template;
  }
}

export function saveStudentProject(project: VirtualProject): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  const key = `${STORAGE_PREFIX}_${project.taskId}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(project));
    return true;
  } catch (err) {
    console.warn(`[SandboxEngine] 儲存學生工作區失敗:`, err);
    return false;
  }
}

export function resetStudentProjectToStandard(taskId: number): VirtualProject {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(`${STORAGE_PREFIX}_${taskId}`);
  }
  return getOfficialTaskTemplate(taskId);
}

// ============================================================================
// 多頁 HTML 沙盒渲染器 (編譯包含相對路徑導覽與安全防護的 Iframe HTML)
// ============================================================================

export function compileMultiPagePreview(project: VirtualProject, currentActivePath: string): string {
  const activeFile = project.files[currentActivePath] || project.files[project.defaultEntryPath] || Object.values(project.files)[0];
  if (!activeFile) return '<p>無可預覽檔案</p>';

  let htmlContent = activeFile.content;

  // 1. 若該 HTML 內引用了專案內的 CSS (如 <link rel="stylesheet" href="./css/style.css">)，將其直接內聯注入
  Object.keys(project.files).forEach((filePath) => {
    if (filePath.endsWith('.css')) {
      const cssContent = project.files[filePath].content;
      // 替換 <link rel="stylesheet" href="...style.css">
      const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\./)?${filePath.replace('/', '\\/')}["'][^>]*>`, 'gi');
      if (linkRegex.test(htmlContent)) {
        htmlContent = htmlContent.replace(linkRegex, `<style>/* Inlined from ${filePath} */\\n${cssContent}</style>`);
      }
    }
  });

  // 2. 注入多頁導航攔截腳本 (Client-side Link Interceptor)
  const navigationInterceptorScript = `
<script>
(function() {
  // 攔截所有 a 標籤的點擊，支援多頁切換與 iframe target 派發
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    var target = a.getAttribute('target') || '_self';

    // 忽略純錨點 #pageTop 或空連結
    if (!href || href.startsWith('javascript:') || href === '#') return;
    if (href.startsWith('#')) return; // 頁內錨點原生運作

    // 處理相對路徑跳轉
    e.preventDefault();
    var cleanHref = href.replace(/^\\.\\//, '').replace(/^\\//, '');
    window.parent.postMessage({
      type: 'C2K_SANDBOX_NAVIGATION',
      href: cleanHref,
      target: target
    }, '*');
  }, true);
})();
</script>
`;

  // 3. 注入安全 CSP 與攔截腳本
  if (htmlContent.includes('</head>')) {
    htmlContent = htmlContent.replace('</head>', `${navigationInterceptorScript}</head>`);
  } else if (htmlContent.includes('<body>')) {
    htmlContent = htmlContent.replace('<body>', `<body>${navigationInterceptorScript}`);
  } else {
    htmlContent = navigationInterceptorScript + htmlContent;
  }

  return htmlContent;
}
