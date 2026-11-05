import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { OFFICIAL_CERTIFICATION_SOURCES } from '../../data/officialSourcesRegistry';
import { UNIFIED_QUESTION_BANK, UNIFIED_PRACTICAL_TASKS } from '../../data/unifiedQuestionBankData';
import { SourceBadge } from '../../components/SourceBadge';

interface QuestionBankImportSystemPageProps {
  onOpenTeacherApply?: () => void;
}

export const QuestionBankImportSystemPage: React.FC<QuestionBankImportSystemPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToTheoryPractice } = useNavigation();

  // Active view tab ('sources' | 'questions' | 'practical' | 'legal')
  const [activeTab, setActiveTab] = useState<'sources' | 'questions' | 'practical' | 'legal'>('sources');
  const [selectedCertFilter, setSelectedCertFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filtered Questions
  const filteredQuestions = UNIFIED_QUESTION_BANK.filter((q) => {
    const matchesCert = selectedCertFilter === 'all' || q.certificationId === selectedCertFilter;
    const matchesSearch =
      searchQuery === '' ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.sourceName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCert && matchesSearch;
  });

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>官方證照題庫匯入與解析管理系統</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">官方題庫管理引擎</span>
                  <span className="badge badge-neutral">多證照模組化 · 嚴格來源校驗</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  官方證照題庫 PDF 蒐集與 AI 解析中心
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => goToTheoryPractice('web-design-c')}
                >
                  前往線上練習模組
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Source Principle Banner */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <ShieldCheck size={18} color="#2E7D32" />
            <span>
              <strong>官方資料嚴格規範：</strong>全站堅持使用公開合法官方來源，嚴格標記「官方題目」、「官方考綱整理」與「AI 練習題」三種來源識別；非官方來源絕不偽稱為官方試題，未獲正式授權之原始 PDF 絕不對外提供下載。
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
              style={{ fontSize: '13px' }}
            >
              1. 官方來源與 PDF 取得狀態
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'questions' ? 'active' : ''}`}
              onClick={() => setActiveTab('questions')}
              style={{ fontSize: '13px' }}
            >
              2. 已解析學科題庫檢索 ({UNIFIED_QUESTION_BANK.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'practical' ? 'active' : ''}`}
              onClick={() => setActiveTab('practical')}
              style={{ fontSize: '13px' }}
            >
              3. 術科題組結構資料 ({UNIFIED_PRACTICAL_TASKS.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${activeTab === 'legal' ? 'active' : ''}`}
              onClick={() => setActiveTab('legal')}
              style={{ fontSize: '13px' }}
            >
              4. 授權與法規合規宣告
            </button>
          </div>

          {/* TAB 1: 官方來源與 PDF 取得狀態 */}
          {activeTab === 'sources' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                  官方證照檔案取得盤點總覽
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  依據勞動部技檢中心、臺灣師範大學 APCS 官方與 Certiport 國際考綱進行之合法下載與待補清單：
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {OFFICIAL_CERTIFICATION_SOURCES.map((src) => {
                    return (
                      <div
                        key={src.id}
                        style={{
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                          padding: '20px',
                          backgroundColor: 'var(--surface-base)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                                【{src.officialCode}】
                              </span>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                                {src.name}
                              </h4>
                              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                                {src.level}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              主管審定機關：{src.issuingAuthority}
                            </div>
                          </div>

                          <div>
                            {src.acquisitionStatus === 'fully_acquired' && (
                              <span className="badge" style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)', color: '#2E7D32', fontSize: '12px' }}>
                                ✓ 官方 PDF 完整取得
                              </span>
                            )}
                            {src.acquisitionStatus === 'partially_acquired' && (
                              <span className="badge badge-gold" style={{ fontSize: '12px' }}>
                                ⚠ 部分檔案取得 / 考綱已解析
                              </span>
                            )}
                            {src.acquisitionStatus === 'pending_acquisition' && (
                              <span className="badge" style={{ backgroundColor: 'rgba(230, 81, 0, 0.1)', color: '#E65100', fontSize: '12px' }}>
                                ⏳ 待官方查詢系統下載
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PDF Files List */}
                        <div style={{ backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '12px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '8px' }}>
                            官方參考文件清單：
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {src.officialPdfs.map((pdf, pIdx) => (
                              <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FileText size={14} color="var(--color-brand-deep-slate)" />
                                  <strong>{pdf.filename}</strong>
                                  <span style={{ color: 'var(--text-muted)' }}>- {pdf.version}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: 'var(--text-secondary)' }}>{pdf.notes}</span>
                                  {pdf.isDownloaded ? (
                                    <span style={{ color: '#2E7D32', fontWeight: 700 }}>[已保存]</span>
                                  ) : (
                                    <span style={{ color: '#E65100', fontWeight: 700 }}>[待補下載]</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Legal and Portal Link */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            <strong>官方查詢系統：</strong>
                            <a href={src.officialQueryUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-brand-deep-slate)', textDecoration: 'underline' }}>
                              {src.officialQueryUrl}
                            </a>
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>
                            {src.legalLicenseNotes}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 已解析學科題庫檢索 */}
          {activeTab === 'questions' && (
            <div>
              {/* Filter & Search Bar */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>依證照過濾：</span>
                  <select
                    value={selectedCertFilter}
                    onChange={(e) => setSelectedCertFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                      backgroundColor: 'var(--surface-base)',
                    }}
                  >
                    <option value="all">全部證照與共同科目</option>
                    <option value="web-design-c">17300 網頁設計丙級</option>
                    <option value="software-design-c">11900 電腦軟體設計丙級</option>
                    <option value="apcs-test">APCS 大學程式設計先修檢測</option>
                    <option value="its-python">ITS Python 科技專家</option>
                    <option value="common-subjects">全國技能檢定 90011 共同科目</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} color="var(--text-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋題幹關鍵字或主題..."
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      fontSize: '13px',
                      width: '240px',
                    }}
                  />
                </div>
              </div>

              {/* Questions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredQuestions.map((q) => (
                  <div key={q.questionId} className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                          {q.questionId}
                        </span>
                        <SourceBadge sourceType={q.sourceType} />
                        <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                          {q.topic}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        出處：{q.sourceName} (適用：{q.sourceVersion}) · 原始頁碼 P.{q.sourcePage}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '15px', lineHeight: 1.7, marginBottom: '16px', fontWeight: 600 }}>
                      {q.question}
                    </h4>

                    {q.codeSnippet && (
                      <pre style={{ backgroundColor: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '4px', fontSize: '12px', fontFamily: 'Consolas, monospace', marginBottom: '14px', overflowX: 'auto' }}>
                        <code>{q.codeSnippet}</code>
                      </pre>
                    )}

                    {/* Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '4px',
                            border: opt.key === q.answer ? '1px solid #2E7D32' : '1px solid var(--border-subtle)',
                            backgroundColor: opt.key === q.answer ? 'rgba(46, 125, 50, 0.06)' : 'var(--surface-sunken)',
                            fontSize: '13px',
                          }}
                        >
                          <strong style={{ color: opt.key === q.answer ? '#2E7D32' : 'var(--text-primary)', marginRight: '6px' }}>
                            ({opt.key})
                          </strong>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Explanation */}
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, backgroundColor: '#FAF9F5', padding: '10px 14px', borderRadius: '4px', borderLeft: '3px solid var(--color-brand-gold)' }}>
                      <strong>【官方解析】：</strong>{q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 術科題組結構資料 */}
          {activeTab === 'practical' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
                  已解析之官方術科題組資料庫
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  收錄勞動部技能檢定中心官方測試參考資料中已解析之 17300 網頁設計丙級與 11900 電腦軟體設計丙級完整試題要求：
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {UNIFIED_PRACTICAL_TASKS.map((task) => (
                    <div
                      key={task.taskCode}
                      style={{
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        padding: '24px',
                        backgroundColor: 'var(--surface-base)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                              {task.taskCode}
                            </span>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                              {task.title}
                            </h4>
                            <span className="badge badge-slate" style={{ fontSize: '11px' }}>
                              建議時限：{task.estimatedMinutes} 分鐘
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            出處：{task.sourceName} · 原始頁碼 P.{task.sourcePage} (適用：{task.sourceVersion})
                          </div>
                        </div>
                        <SourceBadge sourceType={task.sourceType} />
                      </div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-brand-charcoal)', marginBottom: '8px' }}>
                        官方題目操作要求：
                      </div>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                        {task.taskRequirements.map((req, rIdx) => (
                          <li key={rIdx}>{req}</li>
                        ))}
                      </ul>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#C62828', marginBottom: '6px' }}>
                        0 分致命陷阱防呆清單：
                      </div>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '12px', color: '#C62828', lineHeight: 1.6 }}>
                        {task.disqualificationTraps.map((trap, tIdx) => (
                          <li key={tIdx}>{trap}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 授權與法規合規宣告 */}
          {activeTab === 'legal' && (
            <div className="card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShieldCheck size={24} color="#2E7D32" />
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  CODE TO KNOW 著作權與檢定試題合規指引
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                <div>
                  <strong style={{ color: 'var(--color-brand-charcoal)' }}>一、勞動部技能檢定試題規範：</strong><br />
                  依據勞動部技術士技能檢定測試參考資料公開規定，檢定試題公開發布之目的在於提供應檢人考前充實技能研習使用。本平台基於非營利之教育科技輔導，僅於線上提供結構化題目作答、錯題分析與防呆引導，未確認正式個別授權前，<strong>嚴格不將官方原始 PDF 檔案公開提供下載</strong>。
                </div>

                <div>
                  <strong style={{ color: 'var(--color-brand-charcoal)' }}>二、教育部及師範大學 APCS 規範：</strong><br />
                  APCS 由國立臺灣師範大學主辦，官方僅正式公開官方題本範例；其餘歷屆檢測因維持題目信效度未全數開放。本系統收錄官方範例題，其餘題目皆由系統依據官方考綱獨立生成，並<strong>嚴格標示為「AI 考綱練習題」</strong>，杜絕任何以假亂真。
                </div>

                <div>
                  <strong style={{ color: 'var(--color-brand-charcoal)' }}>三、Certiport / Pearson VUE 國際考綱規範：</strong><br />
                  ITS Python 認證為 Certiport 之全球商業認證，官方從未公開試題庫。本平台完全尊重其智慧財產權，依據 Certiport 官方公開發布之 Exam Objectives（考綱代號 ITS_OD_303）進行知識點對齊，所產生之題目全數標註為「AI 練習題」，絕不聲稱或冒充為 Certiport 官方考古題。
                </div>

                <div>
                  <strong style={{ color: 'var(--color-brand-charcoal)' }}>四、級別隔離原則：</strong><br />
                  本平台嚴格落實「各級別試題完全獨立」。網頁設計丙級（17300）與乙級（17300-B）之考綱、題型與後端資料庫要求截然不同，絕不將丙級題庫套用至乙級，維護技術公信力。
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
