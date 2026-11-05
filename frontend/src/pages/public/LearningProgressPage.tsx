import React from 'react';
import {
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  Sparkles,
  BookmarkCheck,
  Calendar,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface LearningProgressPageProps {
  onOpenTeacherApply?: () => void;
}

export const LearningProgressPage: React.FC<LearningProgressPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToTheoryPractice, goToMockExam } = useNavigation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-8) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '12px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#certifications" onClick={(e) => { e.preventDefault(); goToCertifications(); }}>證照中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>個人學習歷程與數據儀表板</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">學習歷程分析</span>
                  <span className="badge badge-neutral">艾賓浩斯遺忘曲線 · 智慧弱點追蹤</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  學習進度與弱點診斷報告
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => goToMockExam('web-design-c')}
                >
                  前往全真模考驗收
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Mode Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>展示用數據模式：</strong>目前畫面呈現典型考生之學習曲線示範數據。假日完成 PostgreSQL / Prisma 與 UserProgress 資料庫整合後，將自動同步您個人的真實刷題與模擬考歷程。
            </span>
          </div>
        </div>

        {/* Overview Stat Cards */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }} className="stats-row">
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>累計研讀時數</span>
                <Clock size={16} color="var(--color-brand-deep-slate)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-charcoal)' }}>
                38.5 <span style={{ fontSize: '13px', fontWeight: 500 }}>小時</span>
              </div>
              <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                ↑ 本週研讀成長 4.2 小時
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>學科題庫完成率</span>
                <BookOpen size={16} color="var(--color-brand-gold)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-deep-slate)' }}>
                45% <span style={{ fontSize: '13px', fontWeight: 500 }}>/ 611 題</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                已完成 275 題精選題目
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>模擬考最高成績</span>
                <Award size={16} color="#2E7D32" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#2E7D32' }}>
                88 <span style={{ fontSize: '13px', fontWeight: 500 }}>分</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                及格標準：60 分（安全達標）
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>術科題組完成度</span>
                <CheckCircle2 size={16} color="var(--color-brand-gold)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-charcoal)' }}>
                3 <span style={{ fontSize: '13px', fontWeight: 500 }}>/ 4 題組</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                題組一至三已完成沙盒檢核
              </div>
            </div>
          </div>

          {/* Chapter Mastery Breakdown & Review Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }} className="progress-dual-grid">
            {/* Left: Chapter Mastery Progress Bars */}
            <div className="card" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="var(--color-brand-deep-slate)" />
                <span>各考科章節掌握度分析</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>工作項目 01：作業準備與智慧財產權法規</span>
                    <span style={{ fontWeight: 700, color: '#2E7D32' }}>92% 掌握（熟練）</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: '92%', backgroundColor: '#2E7D32' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>工作項目 02：HTML5 結構與語意標籤規範</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-brand-gold)' }}>78% 掌握（良好）</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: '78%', backgroundColor: 'var(--color-brand-gold)' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>工作項目 03：CSS3 盒模型與排版佈局 (高頻失分區)</span>
                    <span style={{ fontWeight: 700, color: '#C62828' }}>54% 掌握（需加強）</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: '54%', backgroundColor: '#C62828' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600 }}>工作項目 04：資訊安全與多媒體色彩原理</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>85% 掌握（熟練）</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: '85%', backgroundColor: 'var(--color-brand-deep-slate)' }} />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  系統建議優先複習：<strong>工作項目 03（CSS 盒模型排版）</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => goToTheoryPractice('web-design-c')}
                >
                  立即強化此章節
                </button>
              </div>
            </div>

            {/* Right: Spaced Repetition & Wrong Notebook */}
            <aside>
              {/* Spaced Repetition Card */}
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="var(--color-brand-gold)" />
                  <span>艾賓浩斯遺忘曲線 · 今日複習推播</span>
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                  系統根據您在 3 天前做錯的題目計算，今日有 <strong>8 題</strong> 即將進入記憶衰退期，建議在 24 小時內完成複習以鞏固長期記憶。
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => goToTheoryPractice('web-design-c')}
                  style={{ width: '100%' }}
                >
                  開始遺忘曲線複習 (8 題)
                </button>
              </div>

              {/* Wrong Questions Notebook */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookmarkCheck size={16} color="var(--color-brand-deep-slate)" />
                    <span>錯題收藏本 (5 題)</span>
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>高頻複習</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '4px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      #058 box-sizing: border-box 計算
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>CSS 盒模型 · 錯誤次數：2 次</div>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '4px', fontSize: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                      #305 1024px 水平置中語法
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>CSS 排版 · 錯誤次數：1 次</div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
