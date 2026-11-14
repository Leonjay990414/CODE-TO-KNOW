import React from 'react';
import { useNavigation } from '../context/NavigationContext';

export const Footer: React.FC = () => {
  const { goToLegalNotice } = useNavigation();

  return (
    <footer style={{ backgroundColor: 'var(--color-brand-charcoal)', color: 'var(--color-brand-sand)', paddingTop: 'var(--space-16)', paddingBottom: 'var(--space-12)', borderTop: '1px solid rgba(82, 107, 123, 0.2)' }}>
      <div className="container">

        {/* Main Footer 4-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 'var(--space-8)', marginBottom: 'var(--space-12)' }} className="footer-grid">

          {/* Col 1: Brand Introduction */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                <svg viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="碼上學 Logo">
                  <path fill="#D9E2EA" d="M 140 48 C 84 48 40 84 40 128 C 40 172 84 208 140 208 C 149 208 156 201 156 192 C 156 183 149 176 140 176 C 102 176 70 154 70 128 C 70 102 102 80 140 80 C 149 80 156 73 156 64 C 156 55 149 48 140 48 Z"/>
                  <path fill="#8FA9B8" d="M 130 126 C 135 121 143 121 148 126 L 194 172 C 200 178 200 186 194 192 C 188 198 180 198 174 192 L 130 148 C 124 142 124 132 130 126 Z"/>
                  <path fill="#BDA77E" d="M 126 114 L 176 64 C 181 59 189 59 194 64 C 199 69 199 77 194 82 L 144 132 C 139 137 131 137 126 132 C 121 127 121 119 126 114 Z"/>
                  <path fill="#BDA77E" d="M 200 38 C 200 48 194 54 184 56 C 194 58 200 64 200 74 C 200 64 206 58 216 56 C 206 54 200 48 200 38 Z"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.1 }}>碼上學</div>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2px', color: 'var(--color-brand-gold)' }}>CODE TO KNOW</div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-brand-slate)', lineHeight: 1.8, marginBottom: '16px', maxWidth: '320px' }}>
              碼上學 AI 智慧學習與教育科技平台。致力於將工程思維與前瞻教育科技結合，引領學習者在科技時代掌握獨立思考與理解的核心能力。
            </p>
            <div style={{ fontSize: '12px', color: 'var(--color-brand-gold)', fontStyle: 'italic' }}>
              碼上學，學無止境。｜Learn Beyond Limits.
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', letterSpacing: '0.05em' }}>
              平台核心
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><a href="#hero" style={{ color: 'var(--color-brand-sand)', textDecoration: 'none' }}>首頁總覽</a></li>
              <li><a href="#story" style={{ color: 'var(--color-brand-sand)', textDecoration: 'none' }}>品牌教育理念</a></li>
              <li><a href="#experience" style={{ color: 'var(--color-brand-sand)', textDecoration: 'none' }}>學習體驗系統</a></li>
              <li><a href="#ai-learning" style={{ color: 'var(--color-brand-sand)', textDecoration: 'none' }}>AI 分階段引導</a></li>
              <li><a href="#dual-audience" style={{ color: 'var(--color-brand-sand)', textDecoration: 'none' }}>師生雙端架構</a></li>
            </ul>
          </div>

          {/* Col 3: Educational Services */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', letterSpacing: '0.05em' }}>
              學習與教學服務
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <li><span style={{ color: 'var(--color-brand-sand)' }}>學科題庫與模擬考（規劃中）</span></li>
              <li><span style={{ color: 'var(--color-brand-sand)' }}>程式實戰工作區（規劃中）</span></li>
              <li><span style={{ color: 'var(--color-brand-sand)' }}>教師班級數據後台（規劃中）</span></li>
              <li><span style={{ color: 'var(--color-brand-sand)' }}>學習分析與弱點雷達（規劃中）</span></li>
              <li><span style={{ color: 'var(--color-brand-sand)' }}>教育遊戲闖關中心（規劃中）</span></li>
            </ul>
          </div>

          {/* Col 4: Trust & Contact */}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px', letterSpacing: '0.05em' }}>
              諮詢與政策
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-brand-slate)', lineHeight: 1.7, marginBottom: '12px' }}>
              歡迎學校、培訓單位或教育合作夥伴洽詢教學解決方案。
            </p>
            <div style={{ fontSize: '13px', color: 'var(--color-brand-sand)', marginBottom: '8px' }}>
              聯絡信箱：contact@codetoknow.edu (預留)
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-brand-slate)', marginTop: '16px' }}>
              符合 WCAG 2.1 AA 無障礙標準
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Legal Notice */}
        <div style={{ paddingTop: 'var(--space-8)', borderTop: '1px solid rgba(82, 107, 123, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: 'var(--color-brand-slate)' }}>
          <div>
            © {new Date().getFullYear()} 碼上學 AI 智慧學習與教育科技平台 (CODE TO KNOW). All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a
              href="#privacy"
              onClick={(e) => {
                e.preventDefault();
                goToLegalNotice('privacy');
              }}
              className="footer-legal-link"
              style={{
                color: 'var(--color-brand-sand)',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
            >
              隱私權政策
            </a>
            <a
              href="#terms"
              onClick={(e) => {
                e.preventDefault();
                goToLegalNotice('terms');
              }}
              className="footer-legal-link"
              style={{
                color: 'var(--color-brand-sand)',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
            >
              服務條款
            </a>
            <a
              href="#legal"
              onClick={(e) => {
                e.preventDefault();
                goToLegalNotice('ethics');
              }}
              className="footer-legal-link"
              style={{
                color: 'var(--color-brand-sand)',
                textDecoration: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: '4px',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
            >
              AI 使用倫理聲明
            </a>
          </div>
        </div>

      </div>

      <style>{`
        .footer-legal-link:hover {
          color: #FFFFFF !important;
          text-decoration: underline !important;
        }
        .footer-legal-link:focus-visible {
          outline: 2px solid var(--color-brand-gold, #BDA77E);
          outline-offset: 2px;
        }
        @media (max-width: 840px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: var(--space-6) !important;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
};
