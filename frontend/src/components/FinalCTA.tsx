import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FinalCTA: React.FC = () => {
  const { openAuth } = useAuth();

  return (
    <section className="section-padding" style={{ backgroundColor: 'var(--surface-base)', position: 'relative' }}>
      <div className="container">
        <div
          style={{
            backgroundColor: 'var(--color-brand-charcoal)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-16) var(--space-8)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
          }}
          className="cta-banner"
        >
          {/* Subtle Golden Ambient Light */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '600px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(189, 167, 126, 0.25) 0%, rgba(38, 52, 61, 0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
              <Sparkles size={14} color="var(--color-brand-gold)" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-gold)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                LEARN BEYOND LIMITS // 學無止境
              </span>
            </div>

            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3, marginBottom: 'var(--space-4)', letterSpacing: '-0.02em' }}>
              開啟通往真知的學習旅程
            </h2>

            <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-brand-sand)', lineHeight: 1.8, marginBottom: 'var(--space-8)' }}>
              從第一道基礎觀念題目，到前沿演算法的實踐突破。讓「碼上學」與你一同建立嚴謹的工程思維與持續探索的勇氣。
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-gold btn-lg btn-mobile-full"
                onClick={() => openAuth('register')}
              >
                <span>立即免費開始學習</span>
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="btn btn-outline btn-lg btn-mobile-full"
                style={{ borderColor: 'rgba(217, 210, 196, 0.4)', color: '#FFFFFF' }}
                onClick={() => openAuth('register')}
              >
                <span>預約教師/機構演示</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 639px) {
          .cta-banner {
            padding: var(--space-10) var(--space-4) !important;
          }
        }
      `}</style>
    </section>
  );
};
