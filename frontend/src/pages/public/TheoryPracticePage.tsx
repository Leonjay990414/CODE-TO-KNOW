import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lightbulb,
  FileCheck,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  SAMPLE_THEORY_QUESTIONS,
  OFFICIAL_THEORY_TOTAL_QUESTIONS,
  TheoryQuestion,
} from '../../data/theoryQuestionsData';
import { SourceBadge } from '../../components/SourceBadge';

interface TheoryPracticePageProps {
  onOpenTeacherApply?: () => void;
}

export const TheoryPracticePage: React.FC<TheoryPracticePageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToMockExam } = useNavigation();

  // Filter States
  const [selectedChapter, setSelectedChapter] = useState<number>(0); // 0 = all
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [expandedAiStep, setExpandedAiStep] = useState<number>(0); // 0 = closed, 1..4 = active

  // Filter questions based on chapter
  const filteredQuestions: TheoryQuestion[] = selectedChapter === 0
    ? SAMPLE_THEORY_QUESTIONS
    : SAMPLE_THEORY_QUESTIONS.filter((q) => q.chapterId === selectedChapter);

  const safeIdx = Math.min(currentIdx, Math.max(0, filteredQuestions.length - 1));
  const currentQ = filteredQuestions[safeIdx] || SAMPLE_THEORY_QUESTIONS[0];

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (submittedQuestions[currentQ.id]) return; // already submitted
    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: key });
  };

  const handleSubmitAnswer = () => {
    if (!selectedAnswers[currentQ.id]) return;
    setSubmittedQuestions({ ...submittedQuestions, [currentQ.id]: true });
  };

  const toggleBookmark = (id: string) => {
    const next = new Set(bookmarkedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setBookmarkedIds(next);
  };

  const handlePrev = () => {
    if (safeIdx > 0) {
      setCurrentIdx(safeIdx - 1);
      setExpandedAiStep(0);
    }
  };

  const handleNext = () => {
    if (safeIdx < filteredQuestions.length - 1) {
      setCurrentIdx(safeIdx + 1);
      setExpandedAiStep(0);
    }
  };

  // Stats
  const answeredCount = Object.keys(submittedQuestions).length;
  const correctCount = Object.entries(submittedQuestions).filter(([qId]) => {
    const q = SAMPLE_THEORY_QUESTIONS.find((item) => item.id === qId);
    return q && selectedAnswers[qId] === q.correctAnswer;
  }).length;

  const currentAnswer = selectedAnswers[currentQ.id];
  const isSubmitted = submittedQuestions[currentQ.id];
  const isCorrect = isSubmitted && currentAnswer === currentQ.correctAnswer;
  const isBookmarked = bookmarkedIds.has(currentQ.id);

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>學科全真題庫練習 (17300 網頁設計丙級)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">學科核心題庫</span>
                  <span className="badge badge-neutral">官方題庫約 {OFFICIAL_THEORY_TOTAL_QUESTIONS} 題（示範模式）</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  學科章節練習與即時解析
                </h1>
              </div>

              {/* Action Jump to Mock Exam */}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => goToMockExam('web-design-c')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileCheck size={15} />
                <span>切換至全真模擬考模式</span>
              </button>
            </div>
          </div>
        </section>

        {/* Demo Mode Notice Banner */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>示範資料模式提醒：</strong>依據勞動部 173003A17 官方題庫標準，學科全真題庫共約 611 題。本頁面提供代表性章節精選試題、作答回饋與獨家 4 階 AI 啟發引導展示。
            </span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }} className="theory-grid">
            {/* Left Column: Chapter Filter & Study Stats */}
            <aside>
              {/* Progress Summary Card */}
              <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} color="var(--color-brand-deep-slate)" />
                  <span>本次練習統計</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已作答題數</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                      {answeredCount} <span style={{ fontSize: '12px', fontWeight: 400 }}>/ {filteredQuestions.length}</span>
                    </div>
                  </div>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>正確答對率</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: answeredCount > 0 ? 'var(--color-brand-gold)' : 'var(--text-muted)' }}>
                      {answeredCount > 0 ? `${Math.round((correctCount / answeredCount) * 100)}%` : '--'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookmarkCheck size={14} color="var(--color-brand-gold)" />
                  <span>已收藏錯題：<strong>{bookmarkedIds.size}</strong> 題</span>
                </div>
              </div>

              {/* Chapter Selector */}
              <div className="card" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                  官方工作項目分類
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { id: 0, label: '全部章節試題', count: SAMPLE_THEORY_QUESTIONS.length },
                    { id: 1, label: '項目 01：法規與資訊倫理', count: 1 },
                    { id: 2, label: '項目 02：HTML 結構與語意', count: 1 },
                    { id: 3, label: '項目 03：CSS 排版與樣式', count: 2 },
                    { id: 4, label: '項目 04：資訊安全與多媒體', count: 1 },
                  ].map((chap) => {
                    const isSelected = selectedChapter === chap.id;
                    return (
                      <button
                        key={chap.id}
                        type="button"
                        onClick={() => {
                          setSelectedChapter(chap.id);
                          setCurrentIdx(0);
                          setExpandedAiStep(0);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--color-brand-gold)' : '1px solid var(--border-subtle)',
                          backgroundColor: isSelected ? 'var(--surface-sunken)' : 'transparent',
                          color: isSelected ? 'var(--color-brand-deep-slate)' : 'var(--text-primary)',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '13px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{chap.label}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({chap.count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* Right Column: Question Card & Answering Area */}
            <div>
              <div className="card" style={{ padding: '32px' }}>
                {/* Question Header Meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="badge badge-slate" style={{ fontSize: '12px' }}>
                      第 {safeIdx + 1} 題（官方編號 #{currentQ.officialNumber}）
                    </span>
                    <SourceBadge
                      sourceType="official_verified"
                      sourceName="勞動部 173003A17"
                      sourceVersion="113/114 現行版"
                      sourcePage={currentQ.officialNumber > 100 ? 25 : 6}
                    />
                    <span className="badge badge-subtle" style={{ fontSize: '11px' }}>
                      {currentQ.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(currentQ.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: isBookmarked ? 'var(--color-brand-gold)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    <span>{isBookmarked ? '已收藏至錯題本' : '收藏此題'}</span>
                  </button>
                </div>

                {/* Question Stem */}
                <h2 style={{ fontSize: '18px', lineHeight: 1.7, marginBottom: '20px', color: 'var(--color-brand-charcoal)', fontWeight: 600 }}>
                  {currentQ.question}
                </h2>

                {/* Optional Code Snippet */}
                {currentQ.codeSnippet && (
                  <pre
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: '13px',
                      color: 'var(--color-brand-deep-slate)',
                      border: '1px solid var(--border-subtle)',
                      marginBottom: '24px',
                      overflowX: 'auto',
                    }}
                  >
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                )}

                {/* Option List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {currentQ.options.map((opt) => {
                    const isChosen = currentAnswer === opt.key;
                    let optionStyle: React.CSSProperties = {
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-base)',
                      cursor: isSubmitted ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'left',
                    };

                    if (isChosen && !isSubmitted) {
                      optionStyle.borderColor = 'var(--color-brand-deep-slate)';
                      optionStyle.backgroundColor = 'var(--surface-sunken)';
                    } else if (isSubmitted) {
                      if (opt.key === currentQ.correctAnswer) {
                        optionStyle.borderColor = '#2E7D32';
                        optionStyle.backgroundColor = 'rgba(46, 125, 50, 0.08)';
                      } else if (isChosen && opt.key !== currentQ.correctAnswer) {
                        optionStyle.borderColor = '#C62828';
                        optionStyle.backgroundColor = 'rgba(198, 40, 40, 0.08)';
                      }
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(opt.key)}
                        style={optionStyle}
                      >
                        <span
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            flexShrink: 0,
                            backgroundColor: isChosen ? 'var(--color-brand-deep-slate)' : 'var(--surface-sunken)',
                            color: isChosen ? '#FFFFFF' : 'var(--text-secondary)',
                          }}
                        >
                          {opt.key}
                        </span>
                        <span style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                          {opt.text}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Confirmation / Next Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handlePrev}
                      disabled={safeIdx === 0}
                      style={{ opacity: safeIdx === 0 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={16} />
                      <span>上一題</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleNext}
                      disabled={safeIdx === filteredQuestions.length - 1}
                      style={{ opacity: safeIdx === filteredQuestions.length - 1 ? 0.4 : 1 }}
                    >
                      <span>下一題</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  {!isSubmitted ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmitAnswer}
                      disabled={!currentAnswer}
                      style={{ opacity: currentAnswer ? 1 : 0.5 }}
                    >
                      <span>確認送出答案</span>
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCorrect ? (
                        <span style={{ color: '#2E7D32', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                          <CheckCircle2 size={18} />
                          回答正確！
                        </span>
                      ) : (
                        <span style={{ color: '#C62828', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                          <XCircle size={18} />
                          回答錯誤（標準答案：{currentQ.correctAnswer}）
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Official Explanation Box */}
                {isSubmitted && (
                  <div
                    style={{
                      marginTop: '24px',
                      padding: '20px',
                      backgroundColor: 'var(--surface-sunken)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '4px solid var(--color-brand-gold)',
                    }}
                  >
                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lightbulb size={16} color="var(--color-brand-gold)" />
                      <span>官方標準解析與規範要點</span>
                    </h4>
                    <p style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {currentQ.explanation}
                    </p>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>
                      關鍵規章：{currentQ.keyRule}
                    </div>
                  </div>
                )}

                {/* 4-Tier AI Scaffolding Hints */}
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                      <Sparkles size={16} color="var(--color-brand-gold)" />
                      <span>遇到盲點？呼叫 CODE TO KNOW 4 階 AI 思考鷹架</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>循序引導不直接破梗</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { step: 1, label: '第 1 階：觀念聚焦' },
                      { step: 2, label: '第 2 階：思考破題' },
                      { step: 3, label: '第 3 階：邊界提點' },
                      { step: 4, label: '第 4 階：完整解構' },
                    ].map((s) => (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => setExpandedAiStep(expandedAiStep === s.step ? 0 : s.step)}
                        style={{
                          padding: '8px 4px',
                          fontSize: '12px',
                          fontWeight: 600,
                          borderRadius: 'var(--radius-xs)',
                          border: expandedAiStep === s.step ? '1px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                          backgroundColor: expandedAiStep === s.step ? 'var(--color-brand-gold)' : 'var(--surface-base)',
                          color: expandedAiStep === s.step ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {expandedAiStep > 0 && (
                    <div
                      style={{
                        padding: '16px',
                        backgroundColor: '#FAF9F5',
                        border: '1px solid #EFECE3',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        lineHeight: 1.7,
                        color: 'var(--color-brand-charcoal)',
                      }}
                    >
                      {expandedAiStep === 1 && (
                        <div>
                          <strong>【第 1 階 · 觀念聚焦】</strong>
                          <p style={{ marginTop: '4px' }}>{currentQ.aiHints.level1Focus}</p>
                        </div>
                      )}
                      {expandedAiStep === 2 && (
                        <div>
                          <strong>【第 2 階 · 思考破題】</strong>
                          <p style={{ marginTop: '4px' }}>{currentQ.aiHints.level2Strategy}</p>
                        </div>
                      )}
                      {expandedAiStep === 3 && (
                        <div>
                          <strong>【第 3 階 · 邊界提點】</strong>
                          <p style={{ marginTop: '4px' }}>{currentQ.aiHints.level3Boundary}</p>
                        </div>
                      )}
                      {expandedAiStep === 4 && (
                        <div>
                          <strong>【第 4 階 · 完整解構】</strong>
                          <p style={{ marginTop: '4px' }}>{currentQ.aiHints.level4Breakdown}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
