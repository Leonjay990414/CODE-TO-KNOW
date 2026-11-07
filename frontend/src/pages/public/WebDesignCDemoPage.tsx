import React, { useState } from 'react';
import {
  Code2,
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Play,
  RotateCcw,
  FileCheck,
  Laptop,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface WebDesignCDemoPageProps {
  onOpenTeacherApply?: () => void;
}

export const WebDesignCDemoPage: React.FC<WebDesignCDemoPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToCertificationDetail } = useNavigation();

  // Active Main Hub Tab ('practical' | 'theory' | 'ai-coach' | 'resources')
  const [activeTab, setActiveTab] = useState<'practical' | 'theory' | 'ai-coach' | 'resources'>('practical');

  // Practical Tasks Tab (Task 1 to 5)
  const [selectedTask, setSelectedTask] = useState<number>(1);

  // Interactive Live Code Sandbox
  const defaultHtmlSnippet = `<div style="padding: 16px; font-family: sans-serif; background: #FAF9F5; border-radius: 8px;">
  <header style="background: #526B7B; color: white; padding: 12px; text-align: center; border-radius: 6px; font-weight: 700;">
    校園社團介紹網（題組一實作預覽）
  </header>
  <div style="background: #EFECE3; padding: 6px 12px; font-size: 13px; color: #7C663D; margin: 10px 0; border-radius: 4px;">
    ✦ 歡迎光臨國立科技大學校園社團介紹網！
  </div>
  <div style="display: flex; gap: 10px; margin-top: 10px;">
    <div style="width: 140px; background: white; border: 1px solid #D9E2EA; padding: 10px; border-radius: 4px; font-size: 13px;">
      <strong>社團總覽</strong><br>
      • 吉他社<br>
      • 熱舞社<br>
      • 天文社
    </div>
    <div style="flex: 1; background: white; border: 1px solid #D9E2EA; padding: 12px; border-radius: 4px; font-size: 13px; line-height: 1.6;">
      <strong>吉他社公告：</strong><br>
      每週三晚間於活動中心進行期中成果發表會，歡迎所有喜愛民謠與木吉他的同學蒞臨觀摩！
    </div>
  </div>
</div>`;

  const [sandboxCode, setSandboxCode] = useState<string>(defaultHtmlSnippet);
  const [renderedCode, setRenderedCode] = useState<string>(defaultHtmlSnippet);

  // Interactive Theory Question State
  const [selectedTheoryChoice, setSelectedTheoryChoice] = useState<string | null>(null);
  const [showTheoryResult, setShowTheoryResult] = useState<boolean>(false);
  const [showAiHint, setShowAiHint] = useState<boolean>(false);

  // AI Scaffolding Demo State
  const [scaffoldingStep, setScaffoldingStep] = useState<number>(1);

  const practicalTaskDefinitions = [
    {
      id: 1,
      title: '題組一：校園社團介紹網',
      category: '多媒體與框架佈局',
      focus: '1024px 水平置中、iframe 目標框架 target 連動、跑馬燈速度與背景音樂自動循環',
      wireframe: {
        header: 'Header 標題區 (1000px × 65px) 社團識別標誌 logo.png',
        marquee: '跑馬燈區塊：歡迎光臨校園社團介紹網 (770px × 29px)',
        left: '選單區 (215px) 社團介紹 (吉他社/熱舞社/棒球社等)',
        main: '主內容區 (iframe name="content") 載入 main.html / guitar_history.html',
        footer: 'Footer 版權宣告與最近更新日期 (1000px × 20px)',
      },
      pitfalls: [
        '圖片忘記加上 alt 替代文字（扣 5 分）',
        '超連結 target 未指定為 content 導致跳出新視窗（扣 10 分）',
        '回首頁超連結未設定 target="_top" 造成框架巢狀分割',
      ],
    },
    {
      id: 2,
      title: '題組二：運動廣場連結網',
      category: '圖文切換與表單留言',
      focus: 'CSS 橫幅陰影、最新消息帶狀排版、點按縮圖及時切換原圖、Tab 標籤頁與 6×2 訪客留言表單',
      wireframe: {
        header: '標識圖片 logo.png (180px × 90px) + 陰影橫幅文字「運動廣場連結網」',
        marquee: '選單區 (1024px × 25px)：首頁、健康天地、籃球、棒球、游泳、留言、資料來源',
        left: '最新消息帶狀列表 (0201.txt, #3399FF 標題列)',
        main: '圖片展示區 (0202A~0205A 原圖與縮圖及時切換，背景 #333333)',
        footer: 'Footer (1024px × 45px) 背景 #CCCCCC：網頁維護與更新日期',
      },
      pitfalls: [
        '點按縮圖未即時切換上方對應原圖，或出現裁切',
        '訪客留言表單單選鈕 radio 未設相同群組導致可複選',
        '健康天地 Tab 標籤頁切換失效或超出範圍未出現垂直捲軸',
      ],
    },
    {
      id: 3,
      title: '題組三：國家公園介紹網',
      category: '標題輪播與影像地圖',
      focus: '標題圖片 1 秒定時輪播無毛邊、矩形與多邊形影像地圖 (Image Map)、音訊檔案下載',
      wireframe: {
        header: '標題區 (1000px × 65px) 背景 #0000FF，四張園區風景圖定時 1 秒輪播',
        marquee: '跑馬燈區：歡迎進入國家公園介紹網，本網站有詳細的國家公園介紹哦！',
        left: '選單區 (200px) 表格按鈕、park0302~0305 懸停變色動態、park.mp3 下載',
        main: '內容區：national_park.jpg 設置陽明山矩形與雪霸多邊形影像地圖',
        footer: 'Footer (1000px × 20px)：網頁設計及維護與最近更新日期',
      },
      pitfalls: [
        '標題輪播未間隔 1 秒或圖片尺寸不一產生毛邊',
        '雪霸國家公園多邊形影像地圖座標設定不精確超出邊框',
        'park.mp3 檔案下載未正確彈出下載視窗',
      ],
    },
    {
      id: 4,
      title: '題組四：網路行銷購物網',
      category: '商品展示與購物表單',
      focus: '0401.mp3 背景音樂自動循環、3×3 表格圖文商品排列、新分頁開啟與購買確認表單',
      wireframe: {
        header: '網站標題區 (1024px × 120px) 背景 0401.jpg 流行精品購物網站',
        marquee: '跑馬燈區 (30px)：大家來購物網！精品商品特價大拍賣！要買要快！',
        left: '流行皮件 / 流行鞋區 / 流行飾品 分類標題欄 (200px 寬)',
        main: '3×3 表格：leather1.html / leather2.html 新視窗開啟、purchase 購物確認',
        footer: 'Footer (1024px × 78px) 背景 #666600：訪客留言版連結與版權',
      },
      pitfalls: [
        '背景音樂 0401.mp3 未自動循環播放',
        '點按真皮皮包或短夾未在新視窗 (target="_blank") 中開啟',
        '商品購買狀態表單未設定指定預設值或重置功能失效',
      ],
    },
    {
      id: 5,
      title: '題組五：書曼的旅遊相簿',
      category: '動態標題與互動電子相簿',
      focus: '0508.gif 動態文字顏色輪替、選單懸停紅藍圖片互換、0510a.gif 相框影像合成、album5 電子相簿',
      wireframe: {
        header: '跑馬燈區 (1024px × 50px)：歡迎來到書曼的旅遊相簿...',
        marquee: '首頁版面背景 #FFFFCC，外圍背景 #333333，自動播放 0501.mp3',
        left: '選單區 (150px 寬)：0508.gif、0507.jpg 書曼照、五大景點 hover 圖片互換',
        main: '內容區：0510a.gif 影像地圖進入 album5，5 張縮圖切換 400×300 大圖',
        footer: '整合於選單第十列：日期與維護人員資訊',
      },
      pitfalls: [
        '背景音樂 0501.mp3 未自動播放',
        '選單項目滑鼠懸停未切換成紅色版圖片 (*r.gif)',
        '電子相簿縮圖點選未即時更換上方 400×300 原圖',
      ],
    },
  ];

  const currentTaskDef = practicalTaskDefinitions.find((t) => t.id === selectedTask) || practicalTaskDefinitions[0];

  const handleRunCode = () => {
    setRenderedCode(sandboxCode);
  };

  const handleResetCode = () => {
    setSandboxCode(defaultHtmlSnippet);
    setRenderedCode(defaultHtmlSnippet);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      {/* Top Navbar */}
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1 }}>
        {/* Header & Breadcrumb Section */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-10) 0 var(--space-8) 0' }}>
          <div className="container">
            {/* Breadcrumb Navigation */}
            <nav className="breadcrumb-nav" aria-label="導覽路徑">
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  goToHome();
                }}
              >
                首頁
              </a>
              <span>/</span>
              <a
                href="#certifications"
                onClick={(e) => {
                  e.preventDefault();
                  goToCertifications();
                }}
              >
                證照智慧學習中心
              </a>
              <span>/</span>
              <a
                href="#certifications/web-design-c"
                onClick={(e) => {
                  e.preventDefault();
                  goToCertificationDetail('web-design-c');
                }}
              >
                網頁設計丙級 (17300)
              </a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>實作示範專區 (Demo Hub)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">✦ 示範核心專區</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand-deep-slate)' }}>
                    檢定代碼：17300
                  </span>
                  <span className="badge badge-slate">示範資料 (Demo Data)</span>
                </div>
                <h1 className="text-h1" style={{ fontSize: '30px', marginBottom: '8px' }}>
                  網頁設計丙級技術士 實作示範專區
                </h1>
                <p className="text-lead" style={{ fontSize: '15px', maxWidth: '720px' }}>
                  體驗學科即時單選題檢驗、術科五大題組版型拆解、線上雙欄代碼即時預覽與 4 階 AI 思考鷹架助推。
                </p>
              </div>

              {/* Back Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => goToCertificationDetail('web-design-c')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>返回檢定大綱</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Four Entrances Main Navigation Bar */}
        <section style={{ backgroundColor: 'var(--surface-base)', padding: '16px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`filter-pill ${activeTab === 'practical' ? 'active' : ''}`}
                onClick={() => setActiveTab('practical')}
                style={{ fontSize: '14px', padding: '10px 20px' }}
              >
                <Code2 size={16} />
                <span>1. 術科題組實作工作台</span>
              </button>

              <button
                type="button"
                className={`filter-pill ${activeTab === 'theory' ? 'active' : ''}`}
                onClick={() => setActiveTab('theory')}
                style={{ fontSize: '14px', padding: '10px 20px' }}
              >
                <BookOpen size={16} />
                <span>2. 學科全真刷題示範</span>
              </button>

              <button
                type="button"
                className={`filter-pill ${activeTab === 'ai-coach' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai-coach')}
                style={{ fontSize: '14px', padding: '10px 20px' }}
              >
                <Sparkles size={16} />
                <span>3. 4 階 AI 學習教練</span>
              </button>

              <button
                type="button"
                className={`filter-pill ${activeTab === 'resources' ? 'active' : ''}`}
                onClick={() => setActiveTab('resources')}
                style={{ fontSize: '14px', padding: '10px 20px' }}
              >
                <FileCheck size={16} />
                <span>4. 考場禁忌與學習資源</span>
              </button>
            </div>
          </div>
        </section>

        {/* Content Body Based on Active Tab */}
        <section className="section-padding" style={{ backgroundColor: 'var(--surface-base)' }}>
          <div className="container">
            {/* Demo Notice Banner */}
            <div className="demo-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--color-brand-gold-text)" />
                <span>
                  <strong>示範專區標示 (Demo Data)</strong>：本頁面為前端實機原型示範專區。題庫、題組數據與編譯預覽目前使用純前端沙盒技術，尚未接入正式雲端後端題庫。
                </span>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                前端示範中
              </span>
            </div>

            {/* ============================================================== */}
            {/* ENTRANCE 1: 術科五大題組實作工作台                             */}
            {/* ============================================================== */}
            {activeTab === 'practical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
                {/* 5-Task Selector Pills */}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    選擇術科題組分類（國家檢定考試 5 題隨機抽 1 題）：
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {practicalTaskDefinitions.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`filter-pill ${selectedTask === t.id ? 'active' : ''}`}
                        onClick={() => setSelectedTask(t.id)}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Task Details & Wireframe Mockup */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-6)' }} className="practical-grid">
                  {/* Task Specification Card */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="badge badge-gold">題組重點剖析</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{currentTaskDef.category}</span>
                    </div>

                    <h3 className="text-h3" style={{ fontSize: '20px', marginBottom: '8px' }}>
                      {currentTaskDef.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                      <strong>核心要求：</strong>{currentTaskDef.focus}
                    </p>

                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-brand-charcoal)' }}>
                      考場最常扣分地雷核對清單：
                    </h4>
                    <ul style={{ fontSize: '12px', color: 'var(--status-error)', display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'disc', paddingLeft: '18px', marginBottom: '16px' }}>
                      {currentTaskDef.pitfalls.map((pf) => (
                        <li key={pf}>{pf}</li>
                      ))}
                    </ul>

                    <div style={{ padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ✦ 提示：下方為即時雙欄代碼沙盒，您可以在左側修改 HTML/CSS，並點擊「執行預覽」立即查看切版成效！
                    </div>
                  </div>

                  {/* Wireframe Diagram */}
                  <div className="card" style={{ padding: '24px', backgroundColor: 'var(--surface-sunken)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-brand-deep-slate)' }}>
                      版型線框架構示意圖 (1024px Grid)
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                      <div style={{ padding: '10px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', fontWeight: 700 }}>
                        {currentTaskDef.wireframe.header}
                      </div>
                      <div style={{ padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', color: 'var(--color-brand-deep-slate)' }}>
                        {currentTaskDef.wireframe.marquee}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '6px', minHeight: '120px' }}>
                        <div style={{ padding: '10px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {currentTaskDef.wireframe.left}
                        </div>
                        <div style={{ padding: '10px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                          {currentTaskDef.wireframe.main}
                        </div>
                      </div>
                      <div style={{ padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xs)' }}>
                        {currentTaskDef.wireframe.footer}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Built-in Dual-Column Live Code Sandbox */}
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Laptop size={18} color="var(--color-brand-deep-slate)" />
                      <h4 style={{ fontSize: '16px', fontWeight: 700 }}>
                        線上即時雙欄代碼工作沙盒 (HTML/CSS Live Sandbox)
                      </h4>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleResetCode}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <RotateCcw size={13} />
                        <span>重設代碼</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleRunCode}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Play size={13} />
                        <span>執行即時預覽</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Editor / Live View */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '380px' }} className="sandbox-grid">
                    {/* Left: Input Textarea */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        代碼編輯區 (index.html)
                      </div>
                      <textarea
                        value={sandboxCode}
                        onChange={(e) => setSandboxCode(e.target.value)}
                        style={{
                          width: '100%',
                          flex: 1,
                          minHeight: '320px',
                          padding: '14px',
                          backgroundColor: 'var(--color-brand-charcoal)',
                          color: '#E6EDF3',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          lineHeight: 1.6,
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-default)',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                        spellCheck="false"
                        aria-label="HTML/CSS 代碼輸入區"
                      />
                    </div>

                    {/* Right: Live Rendered Output */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                        即時預覽畫面 (Rendered Output)
                      </div>
                      <div
                        style={{
                          flex: 1,
                          minHeight: '320px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-default)',
                          overflow: 'hidden',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                        }}
                      >
                        <iframe
                          sandbox="allow-scripts"
                          srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:; connect-src 'none';"></head><body style="margin:0;padding:12px;font-family:sans-serif;">${renderedCode}</body></html>`}
                          title="安全隔離預覽"
                          style={{ width: '100%', height: '100%', minHeight: '320px', border: 'none' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ENTRANCE 2: 學科全真刷題示範                                   */}
            {/* ============================================================== */}
            {activeTab === 'theory' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', fontFamily: 'var(--font-mono)' }}>
                      學科示範題 QUESTION #024（官方題庫共約 611 題 · 示範題組）
                    </span>
                    <span className="badge badge-gold">難度：中等 · Demo</span>
                  </div>

                  <h3 className="text-h3" style={{ fontSize: '18px', lineHeight: 1.6, marginBottom: '20px' }}>
                    在 HTML5 規範中，若網頁中存在一個具有自主獨立性、可被個別分發或引用的完整內容區塊（例如一篇部落格文章、論壇貼文或新聞報導），最適當的語意標籤是下列何者？
                  </h3>

                  {/* 4 Radio Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                    {[
                      { key: 'A', text: '(A) <section> 標籤' },
                      { key: 'B', text: '(B) <article> 標籤' },
                      { key: 'C', text: '(C) <div> 標籤' },
                      { key: 'D', text: '(D) <aside> 標籤' },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          border:
                            showTheoryResult && opt.key === 'B'
                              ? '2px solid var(--status-success)'
                              : selectedTheoryChoice === opt.key
                              ? '2px solid var(--color-brand-deep-slate)'
                              : '1px solid var(--border-default)',
                          backgroundColor:
                            showTheoryResult && opt.key === 'B'
                              ? 'var(--status-success-bg)'
                              : selectedTheoryChoice === opt.key
                              ? 'var(--color-brand-ice-slate)'
                              : '#FFFFFF',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        <input
                          type="radio"
                          name="theory_demo"
                          value={opt.key}
                          checked={selectedTheoryChoice === opt.key}
                          onChange={() => {
                            setSelectedTheoryChoice(opt.key);
                            setShowTheoryResult(false);
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{opt.text}</span>
                      </label>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowAiHint(!showAiHint)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={14} color="var(--color-brand-gold-text)" />
                      <span>{showAiHint ? '收起 AI 提示' : '💡 4 階 AI 思考提示'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (!selectedTheoryChoice) {
                          alert('請先選擇一個選項再送出檢驗！');
                          return;
                        }
                        setShowTheoryResult(true);
                      }}
                    >
                      送出檢驗答案
                    </button>
                  </div>

                  {/* AI Hint Pop */}
                  {showAiHint && (
                    <div style={{ marginTop: '16px', padding: '14px 18px', backgroundColor: 'rgba(189, 167, 126, 0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(189, 167, 126, 0.35)', fontSize: '13px', color: 'var(--color-brand-gold-text)', lineHeight: 1.6 }}>
                      ✦ <strong>AI 觀念聚焦提示</strong>：先思考「單一文章獨立引用」與「一般頁面章節分區」的語意差別。如果這篇文章被 RSS 閱讀器單獨抓取，哪一個標籤能自成一個完整實體？
                    </div>
                  )}

                  {/* Explanation Box */}
                  {showTheoryResult && (
                    <div style={{ marginTop: '20px', padding: '16px 20px', backgroundColor: 'var(--status-success-bg)', border: '1px solid rgba(62, 123, 98, 0.3)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)', fontWeight: 700, marginBottom: '6px' }}>
                        <CheckCircle2 size={16} />
                        <span>標準解答：(B) &lt;article&gt; 標籤</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                        <strong>考點詳解：</strong>依據 W3C HTML5 標準規範，<code>&lt;article&gt;</code> 標籤專門用於代表文件中完整且可獨立分發引用的內容塊。而 <code>&lt;section&gt;</code> 則代表通用文件章節，<code>&lt;aside&gt;</code> 用於側欄或次要附屬內容。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ENTRANCE 3: 4 階 AI 學習教練                                   */}
            {/* ============================================================== */}
            {activeTab === 'ai-coach' && (
              <div style={{ maxWidth: '840px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span className="badge badge-gold" style={{ marginBottom: '8px' }}>✦ 思考鷹架互動模組</span>
                    <h3 className="text-h3" style={{ fontSize: '22px', marginBottom: '6px' }}>
                      遇卡點不劇透答案，四階循序點亮思路
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      點選下方四個思考階段，體驗「碼上學」AI 如何引導解題。
                    </p>
                  </div>

                  {/* 4 Steps Selector */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '24px' }} className="scaffolding-demo-grid">
                    {[
                      { step: 1, name: '觀念聚焦', focus: '底層原理與定位' },
                      { step: 2, name: '思考破題', focus: '切版流程偽代碼' },
                      { step: 3, name: '邊界提點', focus: '考場最常見陷阱' },
                      { step: 4, name: '完整解構', focus: '語意規範與最優解' },
                    ].map((s) => (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setScaffoldingStep(s.step)}
                        style={{
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: scaffoldingStep === s.step ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
                          backgroundColor: scaffoldingStep === s.step ? 'var(--color-brand-ice-slate)' : '#FFFFFF',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all var(--duration-fast)',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-gold-text)' }}>
                          STEP 0{s.step}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                          {s.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.focus}</div>
                      </button>
                    ))}
                  </div>

                  {/* Dialogue Simulation */}
                  <div style={{ padding: '20px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                    {/* Student Bubble */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-brand-deep-slate)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        學
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: '4px 14px 14px 14px', fontSize: '13px', color: 'var(--text-primary)', border: '1px solid var(--border-default)', maxWidth: '85%' }}>
                        題組一的 1024px 版面，我寫了 <code>width: 1024px;</code> 為什麼還是沒有在螢幕中間？
                      </div>
                    </div>

                    {/* AI Bubble */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-brand-gold)', color: 'var(--color-brand-charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                        AI
                      </div>
                      <div style={{ backgroundColor: '#FFFFFF', padding: '14px 18px', borderRadius: '4px 14px 14px 14px', fontSize: '13px', color: 'var(--text-primary)', border: '1px solid var(--border-default)', maxWidth: '85%', lineHeight: 1.7 }}>
                        {scaffoldingStep === 1 && (
                          <>
                            <div style={{ fontWeight: 700, color: 'var(--color-brand-gold-text)', marginBottom: '4px' }}>✦ 階段一：觀念聚焦</div>
                            區塊元素（Block element）預設會從最左側開始排版。光給予固定寬度，瀏覽器並不知道剩餘的水平空間該如何分配。思考看看：控制元素「外部空白邊界」的 CSS 屬性是哪一個？
                          </>
                        )}
                        {scaffoldingStep === 2 && (
                          <>
                            <div style={{ fontWeight: 700, color: 'var(--color-brand-gold-text)', marginBottom: '4px' }}>✦ 階段二：思考破題</div>
                            你可以對主容器使用 <code>margin-left: auto;</code> 與 <code>margin-right: auto;</code>，或者簡寫成 <code>margin: 0 auto;</code>。這會命令瀏覽器將左右剩餘空間平均分配，達成天然水平置中！
                          </>
                        )}
                        {scaffoldingStep === 3 && (
                          <>
                            <div style={{ fontWeight: 700, color: 'var(--color-brand-gold-text)', marginBottom: '4px' }}>✦ 階段三：邊界提點</div>
                            考場常見陷阱：如果父層元素被設為了 <code>float: left;</code> 或者你忘了加上 <code>display: block;</code>，<code>margin: auto</code> 將會失效！請確認你的容器為標準區塊流。
                          </>
                        )}
                        {scaffoldingStep === 4 && (
                          <>
                            <div style={{ fontWeight: 700, color: 'var(--color-brand-gold-text)', marginBottom: '4px' }}>✦ 階段四：完整解構</div>
                            在現代 CSS 中，除了 <code>margin: 0 auto;</code> 之外，亦可在外層父容器宣告 <code>display: flex; justify-content: center;</code>。理解兩者的佈局邏輯差異，能讓你在術科實作中游刃有餘。
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* ENTRANCE 4: 考場禁忌與學習資源                                 */}
            {/* ============================================================== */}
            {activeTab === 'resources' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FileCheck size={20} color="var(--color-brand-deep-slate)" />
                    <h3 className="text-h3" style={{ fontSize: '18px' }}>考場重要規範與評分審查要點</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ padding: '14px', backgroundColor: 'var(--status-error-bg)', borderLeft: '4px solid var(--status-error)', borderRadius: 'var(--radius-xs)', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--status-error)' }}>致命扣分項目（嚴重者直接不予計分）：</strong>
                      <ul style={{ marginTop: '6px', paddingLeft: '18px', listStyle: 'disc', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <li>HTML 檔名大小寫錯誤（必須全部小寫，例如 <code>index.html</code>，不得為 <code>Index.html</code>）。</li>
                        <li>忘記宣告字元編碼 <code>&lt;meta charset="UTF-8"&gt;</code> 導致評審電腦開啟呈現亂碼。</li>
                        <li>素材檔案未依照規定存放於指定的資料夾路徑。</li>
                      </ul>
                    </div>

                    <div style={{ padding: '14px', backgroundColor: 'var(--status-warning-bg)', borderLeft: '4px solid var(--status-warning)', borderRadius: 'var(--radius-xs)', fontSize: '13px' }}>
                      <strong style={{ color: 'var(--status-warning)' }}>細節扣分警訊（每項扣 3~5 分）：</strong>
                      <ul style={{ marginTop: '6px', paddingLeft: '18px', listStyle: 'disc', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                        <li>所有 <code>&lt;img&gt;</code> 標籤漏寫 <code>alt</code> 替代文字說明。</li>
                        <li>背景音樂未設置自動循環播放 <code>loop</code> 屬性。</li>
                        <li>選單超連結未設置正確的 <code>target="main"</code> 框架名稱。</li>
                      </ul>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px' }}>官方規範文件與輔助檔案</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ padding: '10px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>勞動部官方 17300 網頁設計丙級技能檢定規範 (PDF)</span>
                      <span className="badge badge-subtle">官方公開</span>
                    </div>
                    <div style={{ padding: '10px 14px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>術科實作測試題組應檢參考資料及評審表</span>
                      <span className="badge badge-subtle">標準範本</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .practical-grid, .sandbox-grid {
            grid-template-columns: 1fr !important;
          }
          .scaffolding-demo-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};
