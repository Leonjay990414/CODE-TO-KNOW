import React from 'react';
import {
  Award,
  BookOpen,
  Code2,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { getCertificationById, CERTIFICATIONS_DATA } from '../../data/certificationsData';

interface CertificationDetailPageProps {
  certId?: string;
  onOpenTeacherApply?: () => void;
}

export const CertificationDetailPage: React.FC<CertificationDetailPageProps> = ({
  certId = 'web-design-c',
  onOpenTeacherApply,
}) => {
  const { openAuth } = useAuth();
  const {
    goToHome,
    goToCertifications,
    goToWebDesignDemo,
    goToTheoryPractice,
    goToPracticalLearning,
    goToMockExam,
  } = useNavigation();

  // Find certification data
  const cert = getCertificationById(certId) || CERTIFICATIONS_DATA[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      {/* Top Navbar */}
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1 }}>
        {/* Header & Breadcrumbs Section */}
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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {cert.name} ({cert.code})
              </span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {cert.isComingSoon ? (
                    <span className="badge badge-coming-soon">COMING SOON</span>
                  ) : (
                    <span className="badge badge-gold">{cert.badgeText}</span>
                  )}
                  <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-brand-deep-slate)' }}>
                    檢定代碼：{cert.code}
                  </span>
                  <span className="badge badge-slate">{cert.level}</span>
                </div>
                <h1 className="text-h1" style={{ fontSize: '32px', marginBottom: '4px' }}>
                  {cert.name}
                </h1>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontStyle: 'italic', marginBottom: '10px', fontWeight: 500 }}>
                  {cert.englishName}
                </div>
                <p className="text-lead" style={{ fontSize: '15px', maxWidth: '720px' }}>
                  {cert.detailedDesc}
                </p>
              </div>

              {/* Action Buttons Top Bar */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goToCertifications}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} />
                  <span>返回證照總覽</span>
                </button>

                {cert.id === 'web-design-c' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={goToWebDesignDemo}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>進入網頁設計丙級示範頁</span>
                    <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="section-padding" style={{ backgroundColor: 'var(--surface-base)' }}>
          <div className="container">
            {/* Status Notice Banner */}
            {cert.isComingSoon ? (
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'rgba(143, 169, 184, 0.12)',
                  border: '1px solid rgba(143, 169, 184, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={18} color="var(--color-brand-deep-slate)" />
                  <div style={{ fontSize: '13px', color: 'var(--color-brand-charcoal)', lineHeight: 1.5 }}>
                    <strong>證照功能籌備中公告</strong>：本證照目前處於考綱研製與題庫數位化校審階段，線上練習、術科沙盒與全真模擬測驗<strong>尚未開放</strong>。以下為官方考核規章、能力範疇與未來預計開放之學習系統規劃。
                  </div>
                </div>
                <span className="badge badge-coming-soon">COMING SOON</span>
              </div>
            ) : (
              <div className="demo-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--color-brand-gold-text)" />
                  <span>
                    <strong>示範環境說明</strong>：本詳細頁展示「網頁設計丙級 (17300)」全真題庫大綱與實作示範。可點擊右側按鈕進行學科刷題與術科演練。
                  </span>
                </div>
                <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                  ✦ 正式示範中
                </span>
              </div>
            )}

            {/* 2-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1.1fr', gap: 'var(--space-8)' }} className="cert-detail-grid">
              {/* Left Column: Chapters & Practical Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* 1. Exam Information Box */}
                <div className="card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Award size={20} color="var(--color-brand-deep-slate)" />
                    <h3 className="text-h3" style={{ fontSize: '18px' }}>官方考試與評量資訊</h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
                    <div style={{ padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>測驗時長規範</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>{cert.examInfo.duration}</div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>試題題數配置</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>{cert.examInfo.questionCount}</div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>及格通過標準</div>
                      <div style={{ fontWeight: 600, color: 'var(--status-success)' }}>{cert.examInfo.passingScore}</div>
                    </div>

                    <div style={{ padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>主辦主管機關</div>
                      <div style={{ fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>{cert.examInfo.organ}</div>
                    </div>
                  </div>
                </div>

                {/* 2. Theory Chapters / Syllabus Outline */}
                <div className="card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <BookOpen size={20} color="var(--color-brand-deep-slate)" />
                      <h3 className="text-h3" style={{ fontSize: '18px' }}>
                        {cert.isComingSoon ? '官方考綱核心範疇與工作項目' : '學科考點章節分佈'}
                      </h3>
                    </div>
                    {cert.isComingSoon ? (
                      <span className="badge badge-coming-soon">考綱規劃中</span>
                    ) : (
                      <span className="badge badge-slate">共 {cert.subjectsCount} 題全真題庫</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cert.theoryChapters.map((chap) => (
                      <div
                        key={chap.chapterId}
                        style={{
                          padding: '14px 16px',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {chap.title}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            考點重點：{chap.focus}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {chap.questionCount ? (
                            <span className="badge badge-subtle">{chap.questionCount} 題</span>
                          ) : (
                            <span className="badge badge-slate">✦ 考綱範疇</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Practical Tasks Overview */}
                <div className="card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Code2 size={20} color="var(--color-brand-deep-slate)" />
                      <h3 className="text-h3" style={{ fontSize: '18px' }}>術科題組實作規範</h3>
                    </div>
                    {cert.isComingSoon ? (
                      <span className="badge badge-slate">共 {cert.practicalTasks.length} 題組規劃</span>
                    ) : (
                      <span className="badge badge-gold">共 {cert.practicalsCount} 大題組</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cert.practicalTasks.map((task) => (
                      <div
                        key={task.taskId}
                        style={{
                          padding: '16px',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                            {task.name}
                          </div>
                          <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                            {task.category}
                          </span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                          {task.description}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {task.keyPoints.map((kp) => (
                            <span
                              key={kp}
                              style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                backgroundColor: 'var(--surface-sunken)',
                                borderRadius: 'var(--radius-xs)',
                                color: 'var(--color-brand-deep-slate)',
                              }}
                            >
                              ✓ {kp}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Progress, CTA & Resources */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {cert.isComingSoon ? (
                  /* Coming Soon Status Box - No Fictitious Question Counts, Scores or Progress */
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--color-brand-charcoal)' }}>
                        學習系統籌備狀態
                      </h4>
                      <span className="badge badge-coming-soon">COMING SOON</span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                      CODE TO KNOW 堅持提供經官方驗證的高品質題庫與線上沙盒，本認證目前處於考綱研製與題庫數位化校審階段，<strong>線上練習與模擬測驗尚未開放</strong>。
                    </p>

                    {/* Planned Features List */}
                    <div
                      style={{
                        backgroundColor: 'var(--surface-sunken)',
                        border: '1px dashed var(--border-strong)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px',
                        marginBottom: '20px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={14} color="var(--color-brand-gold-text)" />
                        <span>未來預計開放學習功能：</span>
                      </div>
                      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {cert.plannedFeatures.map((feat, idx) => (
                          <li key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.45 }}>
                            <span style={{ color: 'var(--color-brand-gold-text)', fontWeight: 700, flexShrink: 0 }}>✦</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Clear Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-mobile-full"
                        disabled
                        style={{
                          opacity: 0.65,
                          cursor: 'not-allowed',
                          backgroundColor: 'var(--surface-sunken)',
                          color: 'var(--text-muted)',
                          borderColor: 'var(--border-default)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '10px 16px',
                        }}
                      >
                        <Lock size={14} />
                        <span>線上練習尚未開放（籌備中）</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-mobile-full"
                        onClick={goToCertifications}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                      >
                        <ArrowLeft size={14} />
                        <span>返回證照總覽</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Active Demonstration Card (Web Design C) */
                  <div className="card" style={{ padding: '24px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>學習準備度概覽</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>示範學習完成度</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cert.progress}%</span>
                    </div>
                    <div className="progress-track" style={{ marginBottom: '16px' }}>
                      <div className="progress-bar" style={{ width: `${cert.progress}%` }}></div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} color="var(--status-success)" />
                        <span>學科題庫：官方題庫收錄 {cert.subjectsCount} 題</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={15} color="var(--status-success)" />
                        <span>術科練習：官方五大題組全真示範</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={15} color="var(--color-brand-gold)" />
                        <span>即時演練：支援線上 HTML/CSS 編輯器</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-mobile-full"
                        onClick={() => goToTheoryPractice('web-design-c')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <BookOpen size={14} />
                        <span>開始學科刷題練習</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-mobile-full"
                        onClick={() => goToPracticalLearning('web-design-c')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <Code2 size={14} />
                        <span>進入術科實作工作區</span>
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-mobile-full"
                        onClick={() => goToMockExam('web-design-c')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <span>參加全真模擬考試</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Related Learning Resources Card */}
                <div className="card" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-brand-charcoal)' }}>
                    官方規範與學習資源
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cert.resources.map((res) => (
                      <div
                        key={res.title}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--surface-sunken)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {res.title}
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          [{res.type}] · {res.note}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Assistant Help */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    backgroundColor: 'rgba(189, 167, 126, 0.12)',
                    border: '1px solid rgba(189, 167, 126, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={16} color="var(--color-brand-gold-text)" />
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-gold-text)' }}>
                      4 階 AI 思考鷹架助推規劃
                    </h4>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: cert.id === 'web-design-c' ? '14px' : '0' }}>
                    在實作題組或刷學科題庫卡關時，碼上學 AI 思考鷹架將依序提供「觀念聚焦 → 破題思路 → 邊界提點 → 架構解構」，引導您獨立解出考題。
                  </p>
                  {cert.id === 'web-design-c' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-mobile-full"
                      onClick={goToWebDesignDemo}
                      style={{ backgroundColor: '#FFFFFF', fontSize: '12px' }}
                    >
                      在示範頁體驗 AI 助推
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 900px) {
          .cert-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
