import React, { useState } from 'react';
import { ArrowRight, Sparkles, BookOpen, CheckCircle2, ChevronRight, Terminal, Award } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

export const Hero: React.FC = () => {
  const [activeHintStep, setActiveHintStep] = useState<number>(1);
  const { goToCertifications } = useNavigation();

  const scaffoldingSteps = [
    {
      step: 1,
      title: '觀念聚焦',
      tag: '概念引導',
      content: '檢驗括弧閉合問題，本質上是處理「最近開啟的括弧必須最先被閉合」。哪種資料結構具備「後進先出（LIFO）」的特性？',
      spark: '💡 提示：回想堆疊（Stack）的操作原理。',
    },
    {
      step: 2,
      title: '解題策略',
      tag: '思路拆解',
      content: '遍歷字串時，當遇到左括弧 `(`、`[`、`{`，將其存入堆疊；當遇到對應右括弧時，從堆疊頂部彈出檢查是否配對。',
      spark: '🔍 思考：若字串遍歷完畢但堆疊仍非空，代表什麼狀況？',
    },
    {
      step: 3,
      title: '核心骨架',
      tag: '代碼結構',
      content: '建立一個字典記錄映射關係：`mapping = {")": "(", "}": "{", "]": "["}`。若遇到右括弧且頂部不相符，立即判定無效。',
      spark: '⚡ 關鍵：以 O(N) 時間複雜度與 O(N) 空間複雜度達成最優解。',
    },
  ];

  return (
    <section id="hero" style={{ position: 'relative', overflow: 'hidden', paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-20)' }}>
      {/* Background Decorative Soft Gradients */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(189, 167, 126, 0.12) 0%, rgba(245, 242, 234, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(143, 169, 184, 0.15) 0%, rgba(245, 242, 234, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 'var(--space-12)', alignItems: 'center' }} className="hero-grid">

          {/* Left Column: Brand Copy & CTAs */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <span className="badge badge-gold">
                <Sparkles size={12} color="#7C663D" />
                <span>AI 智慧學習與教育科技平台</span>
              </span>
              <span className="badge badge-neutral">Learn Beyond Limits</span>
            </div>

            <h1 className="text-h1" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', marginBottom: 'var(--space-4)', letterSpacing: '-0.03em' }}>
              讓每一次學習，<br />
              都更接近真正的<span style={{ color: 'var(--color-brand-deep-slate)', borderBottom: '3px solid var(--color-brand-gold)' }}>理解</span>。
            </h1>

            <p className="text-body" style={{ fontSize: 'var(--font-size-md)', lineHeight: 1.8, marginBottom: 'var(--space-8)', maxWidth: '540px' }}>
              碼上學（CODE TO KNOW）結合理論建構、題庫實戰、AI 分階段鷹架引導與個人化學習歷程分析。我們不給予廉價的現成解答，而是引領你親手推導出知識的本質。
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: 'var(--space-10)' }}>
              <a
                href="#experience"
                className="btn btn-primary btn-lg btn-mobile-full"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#experience')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>開始探索平台</span>
                <ArrowRight size={16} />
              </a>

              <a
                href="#certifications"
                className="btn btn-outline btn-lg btn-mobile-full"
                onClick={(e) => {
                  e.preventDefault();
                  goToCertifications();
                }}
                style={{ borderColor: 'var(--color-brand-gold)', color: 'var(--color-brand-deep-slate)' }}
              >
                <Award size={16} color="var(--color-brand-gold)" />
                <span>證照智慧學習中心</span>
              </a>

              <a
                href="#story"
                className="btn btn-ghost btn-lg btn-mobile-full"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('#story')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <BookOpen size={16} />
                <span>認識碼上學</span>
              </a>
            </div>

            {/* Trust Metrics / Micro Badges */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-charcoal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="var(--color-brand-gold)" />
                  4 階啟發式提示
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>循序引導不破壞思考</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-charcoal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="var(--color-brand-gold)" />
                  理論與實務雙軌
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>課堂知識化作程式力</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-charcoal)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="var(--color-brand-gold)" />
                  師生雙端協同
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>數據驅動的教學儀表板</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive AI Scaffolding Demo Card */}
          <div style={{ position: 'relative' }}>
            <div className="card glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(255, 255, 255, 0.8)' }}>

              {/* Card Header: Simulated Learning Workspace */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#E8DCD8', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#D9E2EA', display: 'inline-block' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8FA9B8', display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand-deep-slate)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                    DEMO // 括弧有效性演算法
                  </span>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                  互動展示原型
                </span>
              </div>

              {/* Problem Definition */}
              <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} color="var(--color-brand-deep-slate)" />
                  題目：驗證輸入字串中的括弧是否合法閉合
                </div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-brand-deep-slate)' }}>
                  輸入範例：s = &quot;&#123;[()]&#125;&quot; ➔ 預期輸出：True
                </div>
              </div>

              {/* Scaffolding Steps Selector */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  體驗 AI 分階段引導（點擊階梯切換提示深淺）：
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {scaffoldingSteps.map((item) => (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => setActiveHintStep(item.step)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: activeHintStep === item.step ? 700 : 500,
                        backgroundColor: activeHintStep === item.step ? 'var(--color-brand-deep-slate)' : 'var(--color-brand-ice-slate)',
                        color: activeHintStep === item.step ? 'var(--color-brand-ivory)' : 'var(--color-brand-charcoal)',
                        border: '1px solid transparent',
                        transition: 'all var(--duration-fast) var(--ease-out)',
                      }}
                    >
                      階梯 {item.step}：{item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Step Content Output */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', minHeight: '140px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-gold)', letterSpacing: '0.05em' }}>
                    ✦ AI 學習助教第 {activeHintStep} 階梯啟發
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                    {scaffoldingSteps[activeHintStep - 1].tag}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '10px' }}>
                  {scaffoldingSteps[activeHintStep - 1].content}
                </p>
                <div style={{ fontSize: '12px', color: '#968159', backgroundColor: 'rgba(189, 167, 126, 0.1)', padding: '8px 12px', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {scaffoldingSteps[activeHintStep - 1].spark}
                </div>
              </div>

              {/* Interactive Footer */}
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>AI 協助釐清思考，非直接貼上代碼</span>
                <span style={{ color: 'var(--color-brand-deep-slate)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                  即時思考鷹架 <ChevronRight size={14} />
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: var(--space-10) !important;
          }
        }
      `}</style>
    </section>
  );
};
