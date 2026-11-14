import { useEffect } from 'react';

export interface RouteSeoConfig {
  title: string;
  description: string;
}

export const ROUTE_SEO_MAP: Record<string, RouteSeoConfig> = {
  'home': {
    title: '首頁｜碼上學 CODE TO KNOW — AI 智慧學習與教育科技平台',
    description: '結合理論建構、題庫實戰、AI 4 階分階段引導與個人化學習歷程，打造最前瞻的教育科技學習平台。',
  },
  'certifications': {
    title: '證照智慧學習中心｜碼上學 CODE TO KNOW',
    description: '收錄國家技術士技能檢定、APCS 與國際權威認證，提供題庫刷題、術科五大題組版型實作指引。',
  },
  'theory-practice': {
    title: '學科章節題庫練習｜碼上學 CODE TO KNOW',
    description: '涵蓋勞動部勞動力發展署 17300 網頁設計丙級 605 題官方最新學科題庫，精準解析與錯題本複習。',
  },
  'mock-exam': {
    title: '國家檢定全真模擬考｜碼上學 CODE TO KNOW',
    description: '嚴格比照勞動部官方檢定規範，80 題單選題、100 分鐘正式倒數計時與即時成績診斷評析。',
  },
  'practical': {
    title: '術科五大題組版型導引｜碼上學 CODE TO KNOW',
    description: '收錄 17300 網頁設計丙級 104301~104305 五大題組，提供官方素材解析與分步實作教學。',
  },
  'code-editor': {
    title: '網頁實務程式碼沙盒編輯器｜碼上學 CODE TO KNOW',
    description: '免安裝環境即可直接於瀏覽器進行 HTML5 與 CSS3 安全沙盒即時預覽與 RWD 響應測試。',
  },
  'learning-progress': {
    title: '個人化學習歷程與研讀分析｜碼上學 CODE TO KNOW',
    description: '全面追蹤各考科章節掌握度、刷題時數成長與弱點題型複習建議。',
  },
  'teacher-dashboard': {
    title: '教師教學主控台與班級管理｜碼上學 CODE TO KNOW',
    description: '掌握全班模擬考成績落點分析、預估檢定及格率與重點關懷學員追蹤。',
  },
  'games': {
    title: '程式互動遊戲學習中心｜碼上學 CODE TO KNOW',
    description: '透過程式拼圖、CSS 設計師、除錯獵人、快問快答與切版大師，寓教於樂熟練前端技術。',
  },
};

export const useRouteSeo = (currentRoute: string) => {
  useEffect(() => {
    const config = ROUTE_SEO_MAP[currentRoute] || ROUTE_SEO_MAP['home'];
    document.title = config.title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', config.description);
    }
  }, [currentRoute]);
};
