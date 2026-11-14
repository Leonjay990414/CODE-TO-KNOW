import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface AICoachPageProps {
  onOpenTeacherApply?: () => void;
}

interface CoachScenario {
  id: string;
  topic: string;
  studentQuery: string;
  stage1: string; // 觀念聚焦
  stage2: string; // 思考破題
  stage3: string; // 邊界提點
  stage4: string; // 完整解構
}

const COACH_SCENARIOS: CoachScenario[] = [
  {
    id: 's1',
    topic: '版面水平置中失效',
    studentQuery: '我在寫題組一外層容器時，設定了 width: 1024px，但畫面卻一直靠左對齊，沒有水平置中，為什麼？',
    stage1: '在 CSS 中，要讓一個「區塊元素（Block-level element）」在可用視窗中水平居中，必須讓瀏覽器自動分配左右邊界。你現在的外距（margin）是怎麼宣告的呢？',
    stage2: '許多初學者常誤用 `text-align: center;`，但那只能讓「行內文字」置中。若要讓 1024px 區塊本身置中，需要利用 `margin-left: auto;` 與 `margin-right: auto;`。',
    stage3: '【考場邊界細節】：若外層容器沒有設定固定寬度（width）或寬度設為 100%，則 `margin: 0 auto;` 將無法產生任何置中效果；同時請檢查是否有 float 屬性未清除干擾了排版流。',
    stage4: '【完整規範】：為外層包裹容器（如 `.layout-container`）設定 `width: 1024px; margin: 0 auto;`，便能完美符合丙級技術士檢定在各種螢幕解析度下的水平置中標準。',
  },
  {
    id: 's2',
    topic: 'CSS Float 導致父容器高度塌陷',
    studentQuery: '我在左右兩欄排版時對選單設定了 float: left，結果外層父容器的高度瞬間變成 0，背景色都不見了！',
    stage1: '當元素被設定為 `float: left;` 後，它就脫離了正常的「文件排版流 (Document Flow)」。此時父容器便無法「感知」浮動子元素的高度，因此發生高度塌陷。',
    stage2: '思考解決方向：我們需要告訴父容器「必須重新包裹住浮動的子元素」。傳統作法是使用清除浮動（Clearfix），或者觸發 BFC（Block Formatting Context）。',
    stage3: '【考場常見解法】：最簡潔且相容現代考場瀏覽器的方法，是在父容器加上 `overflow: hidden;`，或者在浮動元素後方加入 `<div style="clear: both;"></div>`。',
    stage4: '【現代化替代】：在 HTML5 檢定中，亦推薦直接將父容器改為 `display: flex;`，完全不需要使用 float 即可輕鬆達成左右並排，且天然具備等高自適應特性。',
  },
  {
    id: 's3',
    topic: '超連結 target 開啟錯誤',
    studentQuery: '點選左側選單的吉他社連結時，它都在全新的瀏覽器分頁開啟，沒有在右邊的主內容框顯示，扣分很重嗎？',
    stage1: '在考場評分標準中，「超連結未於指定框架開啟」會被判定為功能不符直接扣分。超連結預設的開啟方式是 `_self`，而全新視窗是 `_blank`。',
    stage2: '回想題目要求：右側的主內容區是一個 iframe，它具備 `name="main"` 屬性。你的 `<a>` 標籤的 `target` 屬性填寫了什麼？',
    stage3: '【關鍵對應】：超連結的 `target` 屬性值必須完全對應到右側 iframe 的 `name` 屬性值（區分大小寫）。例如 `target="main"` 對應 `<iframe name="main">`。',
    stage4: '【標準寫法】：撰寫 `<a href="guitar.html" target="main">吉他社</a>`，點擊後頁面便能精準在右側主框架中載入，不破壞首頁整體版面！',
  },
];

export const AICoachPage: React.FC<AICoachPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToTheoryPractice } = useNavigation();

  const [selectedScenario, setSelectedScenario] = useState<CoachScenario>(COACH_SCENARIOS[0]);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; stage?: number }>>([
    { role: 'user', text: COACH_SCENARIOS[0].studentQuery },
    { role: 'ai', text: COACH_SCENARIOS[0].stage1, stage: 1 },
  ]);

  const handleSelectScenario = (sc: CoachScenario) => {
    setSelectedScenario(sc);
    setCurrentStage(1);
    setMessages([
      { role: 'user', text: sc.studentQuery },
      { role: 'ai', text: sc.stage1, stage: 1 },
    ]);
  };

  const handleNextStage = () => {
    if (currentStage >= 4) return;
    const nextStage = currentStage + 1;
    setCurrentStage(nextStage);

    let text = '';
    if (nextStage === 2) text = selectedScenario.stage2;
    else if (nextStage === 3) text = selectedScenario.stage3;
    else if (nextStage === 4) text = selectedScenario.stage4;

    setMessages((prev) => [...prev, { role: 'ai', text, stage: nextStage }]);
  };

  const handleSendCustomQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    const userText = customQuery;
    setCustomQuery('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userText },
      {
        role: 'ai',
        text: `【觀念引導示範】：針對「${userText}」，先停下來回想核心概念：在 HTML5 語意化與 CSS 盒模型標準中，這個問題涉及到哪一條基礎原則？試著檢查標籤屬性、盒模型邊界或父子階層關係。`,
        stage: 1,
      },
    ]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Breadcrumb Header */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-8) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '12px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#certifications" onClick={(e) => { e.preventDefault(); goToCertifications(); }}>證照中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>4 階 AI 學習教練 (Scaffolding Coach)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">
                    <Sparkles size={12} color="#7C663D" />
                    <span>啟發式引導教練</span>
                  </span>
                  <span className="badge badge-neutral">不直接劇透答案 · 培養推導思維</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  CODE TO KNOW 4 階 AI 學習鷹架
                </h1>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => goToTheoryPractice('web-design-c')}
              >
                <BookOpen size={15} />
                <span>回學科刷題應用</span>
              </button>
            </div>
          </div>
        </section>

        {/* Philosophy & Transparency Banner */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} />
              <strong>教育核心精神：AI 不應取代學生的獨立思考</strong>
            </div>
            <span style={{ fontSize: '13px', lineHeight: 1.6 }}>
              CODE TO KNOW AI 學習教練依循「觀念聚焦 → 思考破題 → 邊界提點 → 完整解構」四階鷹架，陪伴你親自寫出正確解法。
              <span style={{ display: 'block', marginTop: '4px', color: 'var(--color-brand-deep-slate)', fontWeight: 600 }}>
                〔功能透明度告知〕本頁目前採用本地題庫與四階引導規則展示教學邏輯（展示模式），尚未串接即時商業 LLM API。
              </span>
            </span>
          </div>
        </div>

        {/* Coach Interactive Interface */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }} className="coach-grid">
            {/* Left Column: Common Scenarios Selector */}
            <aside>
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>
                  考場常見盲點題組
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {COACH_SCENARIOS.map((sc) => {
                    const isSelected = selectedScenario.id === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => handleSelectScenario(sc)}
                        style={{
                          textAlign: 'left',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--color-brand-gold)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'var(--surface-sunken)' : 'transparent',
                          color: isSelected ? 'var(--color-brand-deep-slate)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: 'var(--color-brand-gold)', fontWeight: 700, marginBottom: '2px' }}>
                          高頻疑難
                        </div>
                        <div>{sc.topic}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scaffolding Stage Explanation */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                  4 階鷹架階段說明
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', lineHeight: 1.6 }}>
                  <div>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>1. 觀念聚焦：</strong>喚醒核心原理，點出檢定本質。
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>2. 思考破題：</strong>拆解問題步驟，掃除常見迷思。
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>3. 邊界提點：</strong>考場失分防呆，注意例外條件。
                  </div>
                  <div>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>4. 完整解構：</strong>推導完整語法，融會貫通。
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Column: Chat Dialog & Step Controller */}
            <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', minHeight: '580px' }}>
              {/* Stepper Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                  當前引導進度：第 {currentStage} 階 / 共 4 階
                </div>

                {currentStage < 4 ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleNextStage}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'var(--color-brand-gold)', color: 'var(--color-brand-deep-slate)' }}
                  >
                    <span>進一步深入：解鎖第 {currentStage + 1} 階提示</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <span style={{ fontSize: '12px', color: '#2E7D32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={16} />
                    已完整解構此概念！
                  </span>
                )}
              </div>

              {/* Message Stream */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', marginBottom: '20px' }}>
                {messages.map((m, idx) => {
                  const isAi = m.role === 'ai';
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        flexDirection: isAi ? 'row' : 'row-reverse',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isAi ? 'var(--color-brand-deep-slate)' : '#D9D2C4',
                          color: isAi ? '#FFFFFF' : 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {isAi ? <Sparkles size={18} color="#BDA77E" /> : '學員'}
                      </div>

                      {/* Bubble */}
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: isAi ? 'var(--surface-sunken)' : 'var(--color-brand-deep-slate)',
                          color: isAi ? 'var(--text-primary)' : '#FFFFFF',
                          fontSize: '13px',
                          lineHeight: 1.8,
                          border: isAi ? '1px solid var(--border-subtle)' : 'none',
                        }}
                      >
                        {isAi && m.stage && (
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-gold)', marginBottom: '4px' }}>
                            {m.stage === 1 && '【第 1 階 · 觀念聚焦】'}
                            {m.stage === 2 && '【第 2 階 · 思考破題】'}
                            {m.stage === 3 && '【第 3 階 · 邊界提點】'}
                            {m.stage === 4 && '【第 4 階 · 完整解構】'}
                          </div>
                        )}
                        <div>{m.text}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Form for custom question */}
              <form onSubmit={handleSendCustomQuery} style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  placeholder="輸入你在網頁設計檢定遇到的疑問或盲點..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-base)',
                    fontSize: '13px',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={15} />
                  <span>向 AI 教練提問</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
