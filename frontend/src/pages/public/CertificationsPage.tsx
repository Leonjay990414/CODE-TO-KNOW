import React, { useState, useMemo } from 'react';
import {
  Search,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Layers,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { CERTIFICATIONS_DATA, Certification } from '../../data/certificationsData';

interface CertificationsPageProps {
  onOpenTeacherApply?: () => void;
}

export const CertificationsPage: React.FC<CertificationsPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertificationDetail, goToWebDesignDemo } = useNavigation();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');

  const categories = [
    { id: 'all', label: '全部領域' },
    { id: 'web', label: '網頁技術 (Web)' },
    { id: 'software', label: '軟體開發 (Software)' },
    { id: 'algorithm', label: '演算法檢測 (APCS)' },
    { id: 'application', label: '數位應用 (Apps)' },
  ];

  const disciplines = [
    { id: 'all', label: '全部考科' },
    { id: 'theory', label: '含學科題庫' },
    { id: 'practical', label: '含術科實作' },
    { id: 'comprehensive', label: '雙軌綜合檢定' },
  ];

  // Filter Logic
  const filteredCertifications = useMemo(() => {
    return CERTIFICATIONS_DATA.filter((cert: Certification) => {
      // Category match
      const matchesCategory = selectedCategory === 'all' || cert.category === selectedCategory;

      // Discipline match
      let matchesDiscipline = true;
      if (selectedDiscipline === 'theory') {
        matchesDiscipline = cert.disciplineType === 'theory' || cert.disciplineType === 'comprehensive';
      } else if (selectedDiscipline === 'practical') {
        matchesDiscipline = cert.disciplineType === 'practical' || cert.disciplineType === 'comprehensive';
      } else if (selectedDiscipline === 'comprehensive') {
        matchesDiscipline = cert.disciplineType === 'comprehensive';
      }

      // Keyword match
      const query = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (query) {
        const inName = cert.name.toLowerCase().includes(query);
        const inEnglish = (cert.englishName || '').toLowerCase().includes(query);
        const inCode = cert.code.toLowerCase().includes(query);
        const inDesc = cert.shortDesc.toLowerCase().includes(query);
        const inTags = cert.tags.some((t) => t.toLowerCase().includes(query));
        matchesSearch = inName || inEnglish || inCode || inDesc || inTags;
      }

      return matchesCategory && matchesDiscipline && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedDiscipline]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDiscipline('all');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      {/* Top Navbar */}
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1 }}>
        {/* Header Section */}
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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>證照智慧學習中心</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Award size={16} color="var(--color-brand-gold)" />
                  <span className="badge badge-gold">國家標準檢定 × 國際權威認證</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>✦ 前端展示示範資料庫 (Demo Data)</span>
                </div>
                <h1 className="text-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>
                  證照智慧學習中心
                </h1>
                <p className="text-lead" style={{ fontSize: '16px', maxWidth: '720px' }}>
                  收錄國家技術士技能檢定、APCS 大學程式先修與國際原廠認證。提供學科錯題複習、術科五大題組版型實作指引與 4 階 AI 思考鷹架。
                </p>
              </div>

              {/* Total Certs Counter Badge */}
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-default)',
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-subtle)',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>目前收錄檢定項目</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                  {filteredCertifications.length}{' '}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    / {CERTIFICATIONS_DATA.length} 項
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search & Filter Control Bar */}
        <section style={{ backgroundColor: 'var(--surface-base)', padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Row 1: Search Input & Disciplines */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                {/* Search Bar */}
                <div className="search-input-wrap" style={{ maxWidth: '440px' }}>
                  <Search size={18} color="var(--text-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋證照名稱、代碼 (如 17300) 或關鍵字..."
                    aria-label="搜尋證照"
                  />
                </div>

                {/* Discipline Filter Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>考核面向：</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {disciplines.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`filter-pill ${selectedDiscipline === d.id ? 'active' : ''}`}
                        onClick={() => setSelectedDiscipline(d.id)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Category Filter Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>專業領域：</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`filter-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications Grid Section */}
        <section className="section-padding" style={{ backgroundColor: 'var(--surface-base)' }}>
          <div className="container">
            {/* Demo Notice Banner */}
            <div className="demo-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--color-brand-gold-text)" />
                <span>
                  <strong>示範環境說明</strong>：本專區目前展示「網頁設計丙級 (17300)」完整實作示範與題庫大綱。所有數值與章節為
                  <strong>展示用資料 (Demo Data)</strong>，正式版即將連動雲端測驗沙盒。
                </span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={goToWebDesignDemo}
                style={{ backgroundColor: '#FFFFFF', fontSize: '12px' }}
              >
                直接進入網頁設計丙級示範頁 →
              </button>
            </div>

            {/* If Results Found: Render Cards Grid */}
            {filteredCertifications.length > 0 ? (
              <div className="cert-grid">
                {filteredCertifications.map((cert) => {
                  if (cert.isComingSoon) {
                    return (
                      <div key={cert.id} className="cert-card is-coming-soon">
                        <div>
                          {/* Top Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span className="badge badge-coming-soon">
                              COMING SOON
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', fontFamily: 'var(--font-mono)' }}>
                              {cert.code}
                            </span>
                          </div>

                          {/* Title & English Name */}
                          <h3 className="text-h3" style={{ fontSize: '18px', marginBottom: '3px', color: 'var(--color-brand-charcoal)' }}>
                            {cert.name}
                          </h3>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', marginBottom: '8px', fontWeight: 500 }}>
                            {cert.englishName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            等級：{cert.level} · {cert.categoryName}
                          </div>

                          {/* Description */}
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                            {cert.shortDesc}
                          </p>

                          {/* Tags */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                            {cert.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 8px',
                                  backgroundColor: 'var(--surface-sunken)',
                                  borderRadius: 'var(--radius-xs)',
                                  color: 'var(--color-brand-deep-slate)',
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Future Planned Learning Functions Box */}
                        <div>
                          <div className="cert-planned-box">
                            <div className="cert-planned-title">
                              <Sparkles size={13} color="var(--color-brand-gold-text)" />
                              <span>未來預計開放學習功能</span>
                            </div>
                            <ul className="cert-planned-list">
                              {cert.plannedFeatures.slice(0, 3).map((feat, idx) => (
                                <li key={idx} className="cert-planned-item">
                                  <span style={{ color: 'var(--color-brand-gold-text)', flexShrink: 0, fontWeight: 700 }}>✦</span>
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Actions: Navigate to Introduction Page without entering empty practice */}
                          <div>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => goToCertificationDetail(cert.id)}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px' }}
                            >
                              <span>查看證照介紹與大綱</span>
                              <ArrowRight size={13} />
                            </button>
                            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                              ✦ 線上練習與測驗籌備中 · 尚未開放
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Active Demonstration Certification (Web Design C)
                  return (
                    <div key={cert.id} className="cert-card featured">
                      <div>
                        {/* Top Badges */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                            {cert.badgeText}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', fontFamily: 'var(--font-mono)' }}>
                            {cert.code}
                          </span>
                        </div>

                        {/* Title & English Name */}
                        <h3 className="text-h3" style={{ fontSize: '18px', marginBottom: '3px', color: 'var(--color-brand-charcoal)' }}>
                          {cert.name}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', marginBottom: '8px', fontWeight: 500 }}>
                          {cert.englishName}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          等級：{cert.level} · {cert.categoryName}
                        </div>

                        {/* Description */}
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '14px' }}>
                          {cert.shortDesc}
                        </p>

                        {/* Tags */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
                          {cert.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                backgroundColor: 'var(--surface-sunken)',
                                borderRadius: 'var(--radius-xs)',
                                color: 'var(--color-brand-deep-slate)',
                              }}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Real Verified Stats & Progress Box */}
                      <div>
                        <div className="cert-stats-box">
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>學科全真題庫</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                              {cert.subjectsCount} 題 (173003A17)
                            </div>
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-muted)' }}>術科五大題組</div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                              {cert.practicalsCount} 題組完整拆解
                            </div>
                          </div>
                        </div>

                        {/* Learning Progress Indicator */}
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            <span>示範學習完成度</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.progress}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-bar" style={{ width: `${cert.progress}%` }}></div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => goToCertificationDetail(cert.id)}
                            style={{ fontSize: '12px' }}
                          >
                            檢定大綱
                          </button>

                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={goToWebDesignDemo}
                            style={{ fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                          >
                            <span>進入示範</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Future Certification Teaser Card */}
                <div
                  className="cert-card"
                  style={{
                    border: '2px dashed var(--border-strong)',
                    backgroundColor: 'var(--surface-sunken)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '36px 24px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-brand-ice-slate)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                      color: 'var(--color-brand-deep-slate)',
                    }}
                  >
                    <Layers size={22} />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-brand-charcoal)' }}>
                    陸續新增國家級與國際檢定
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.6, maxWidth: '280px' }}>
                    包含電腦硬體裝修丙級、Linux LPI 認證、TQC+ 程式設計與資安工程師題庫整合中。
                  </p>
                  <span className="badge badge-subtle" style={{ fontSize: '11px' }}>
                    ✦ 即將推出 · Demo
                  </span>
                </div>
              </div>
            ) : (
              /* Empty Search Results State */
              <EmptyState
                icon={Search}
                title="查無相符的證照檢定項目"
                description={`沒有找到與關鍵字「${searchQuery}」相符的證照。建議您放寬搜尋字詞，或清除分類篩選條件。`}
                actionLabel="清除篩選並重設"
                onAction={handleResetFilters}
                actionIcon={RotateCcw}
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
