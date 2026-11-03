import React from 'react';
import { Compass, Code2, Brain } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section id="story" className="section-padding" style={{ backgroundColor: 'var(--surface-sunken)', position: 'relative' }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-16) auto' }}>
          <span className="text-caption" style={{ color: 'var(--color-brand-deep-slate)', display: 'block', marginBottom: 'var(--space-2)' }}>
            BRAND PHILOSOPHY // 品牌理念
          </span>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>
            從代碼的嚴謹邏輯，通往知識的真正自由
          </h2>
          <p className="text-body" style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-secondary)' }}>
            在生成式人工智慧普及的時代，直接獲取「答案」變得無比廉價，但獨立思考與融會貫通的能力卻更顯珍貴。「碼上學」以此為原點誕生。
          </p>
        </div>

        {/* CODE & KNOW Dual Column Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-8)', marginBottom: 'var(--space-16)' }} className="story-dual-grid">

          {/* Column 1: CODE */}
          <div className="card" style={{ padding: 'var(--space-8)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '64px', fontWeight: 900, color: 'rgba(82, 107, 123, 0.06)', fontFamily: 'var(--font-sans-en)', lineHeight: 1 }}>
              CODE
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-brand-ice-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <Code2 size={24} color="var(--color-brand-deep-slate)" />
            </div>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>
              CODE：科技、實作與創造力
            </h3>
            <p className="text-body" style={{ lineHeight: 1.8 }}>
              程式不僅是一門專業技術，更是一套將抽象問題具象化、進行結構拆解與邏輯驗證的現代思維語言。透過程式碼的親手撰寫與實作訓練，學習者能體會嚴謹架構的創造之美。
            </p>
          </div>

          {/* Column 2: KNOW */}
          <div className="card" style={{ padding: 'var(--space-8)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '20px', fontSize: '64px', fontWeight: 900, color: 'rgba(189, 167, 126, 0.1)', fontFamily: 'var(--font-sans-en)', lineHeight: 1 }}>
              KNOW
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(189, 167, 126, 0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <Brain size={24} color="#7C663D" />
            </div>
            <h3 className="text-h3" style={{ marginBottom: 'var(--space-3)' }}>
              KNOW：知識、理解與思想成果
            </h3>
            <p className="text-body" style={{ lineHeight: 1.8 }}>
              理解是終極的目的地。真正的理解不是背誦標準答案，而是明白「為什麼這樣行得通」以及「背後的根本原理是什麼」。唯有經過深層推敲的知識，才能轉化為面對未知挑戰的定力。
            </p>
          </div>

        </div>

        {/* The Core Thesis Banner */}
        <div
          className="card thesis-card"
          style={{
            backgroundColor: 'var(--color-brand-charcoal)',
            color: 'var(--color-brand-ivory)',
            padding: 'var(--space-10)',
            borderRadius: 'var(--radius-lg)',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 'var(--space-8)',
            alignItems: 'center',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(189, 167, 126, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Compass size={32} color="var(--color-brand-gold)" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-gold)', marginBottom: '6px' }}>
              ✦ OUR COMMITMENT // 我們的教育承諾
            </div>
            <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '8px' }}>
              AI 應協助獨立思考，而非取代它
            </h4>
            <p style={{ fontSize: '15px', color: 'var(--color-brand-sand)', lineHeight: 1.7, margin: 0 }}>
              碼上學嚴格反對「一鍵生成答案、繞過大腦推理」的浮躁模式。我們的 AI 被設計為循循善誘的對話者：提出關鍵反問、提供概念階梯、指出邊界漏洞，激發你內心探尋真理的火花。
            </p>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .story-dual-grid {
            grid-template-columns: 1fr !important;
          }
          .thesis-card {
            grid-template-columns: 1fr !important;
            gap: var(--space-4) !important;
            padding: var(--space-6) !important;
          }
        }
      `}</style>
    </section>
  );
};
