import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileCheck,
  AlertCircle,
  Trash2,
  RotateCcw,
  Play,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  ALL_OFFICIAL_THEORY_QUESTIONS,
  OFFICIAL_SECTIONS_LIST,
  TheoryQuestionModel,
} from '../../data/questionBankAdapter';
import {
  OFFICIAL_THEORY_TOTAL_QUESTIONS,
  THEORY_QUESTIONS_NOTE,
} from '../../data/theoryQuestionsData';
import { SourceBadge } from '../../components/SourceBadge';
import {
  recordWrongAttempt,
  recordCorrectAttempt,
  getWrongQuestionsList,
  getWrongQuestionsStats,
  removeWrongQuestion,
  clearAllWrongQuestions,
  drawReviewQuestions,
  WrongQuestionItem,
} from '../../utils/wrongQuestionsStorage';

interface TheoryPracticePageProps {
  onOpenTeacherApply?: () => void;
}

export const TheoryPracticePage: React.FC<TheoryPracticePageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToCertifications, goToMockExam } = useNavigation();

  const userId = user?.id || 'guest-anonymous';

  // Mode: 'chapter' (all questions/chapters) | 'wrong_notebook' (review wrong questions)
  const [viewMode, setViewMode] = useState<'chapter' | 'wrong_notebook'>('chapter');

  // Filter States: section 'all' | '01' | '02' | '03' | '04'
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [jumpInput, setJumpInput] = useState<string>('');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [expandedAiStep, setExpandedAiStep] = useState<number>(0); // 0 = closed, 1..4 = active

  // Wrong questions filter & sorting state
  const [wrongFilterStatus, setWrongFilterStatus] = useState<'all' | 'unresolved' | 'unmastered' | 'reviewing' | 'mastered'>('unresolved');
  const [wrongFilterSection, setWrongFilterSection] = useState<string>('all');
  const [wrongSortBy, setWrongSortBy] = useState<'lastAttemptAt' | 'wrongCount' | 'officialNumber'>('lastAttemptAt');
  const [wrongSortOrder, setWrongSortOrder] = useState<'desc' | 'asc'>('desc');

  // In-place single question retry states
  const [inPlaceAnswers, setInPlaceAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [inPlaceSubmitted, setInPlaceSubmitted] = useState<Record<string, boolean>>({});
  const [inPlaceActiveId, setInPlaceActiveId] = useState<string | null>(null);

  // Dedicated Review Quiz Mode states
  const [isReviewQuizActive, setIsReviewQuizActive] = useState<boolean>(false);
  const [reviewQuizQuestions, setReviewQuizQuestions] = useState<WrongQuestionItem[]>([]);
  const [reviewQuizIdx, setReviewQuizIdx] = useState<number>(0);
  const [reviewQuizAnswers, setReviewQuizAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [reviewQuizSubmitted, setReviewQuizSubmitted] = useState<Record<string, boolean>>({});
  const [reviewQuizSummary, setReviewQuizSummary] = useState<{ total: number; correct: number; mastered: number } | null>(null);

  // Wrong questions state
  const [wrongStats, setWrongStats] = useState(() => getWrongQuestionsStats(userId));
  const [wrongList, setWrongList] = useState<WrongQuestionItem[]>(() =>
    getWrongQuestionsList(userId, { status: 'unresolved', section: 'all', sortBy: 'lastAttemptAt', sortOrder: 'desc' })
  );

  const refreshWrongData = () => {
    setWrongStats(getWrongQuestionsStats(userId));
    setWrongList(
      getWrongQuestionsList(userId, {
        status: wrongFilterStatus,
        section: wrongFilterSection,
        sortBy: wrongSortBy,
        sortOrder: wrongSortOrder,
      })
    );
  };

  useEffect(() => {
    refreshWrongData();
  }, [userId, wrongFilterStatus, wrongFilterSection, wrongSortBy, wrongSortOrder]);

  // Filter questions based on official section
  const filteredQuestions: TheoryQuestionModel[] = selectedSection === 'all'
    ? ALL_OFFICIAL_THEORY_QUESTIONS
    : ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === selectedSection);

  const safeIdx = Math.min(currentIdx, Math.max(0, filteredQuestions.length - 1));
  const currentQ: TheoryQuestionModel = filteredQuestions[safeIdx] || ALL_OFFICIAL_THEORY_QUESTIONS[0];

  const handleSelectOption = (key: 'A' | 'B' | 'C' | 'D') => {
    if (submittedQuestions[currentQ.id]) return; // already submitted
    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: key });
  };

  const handleSubmitAnswer = () => {
    const selected = selectedAnswers[currentQ.id];
    if (!selected) return;

    setSubmittedQuestions({ ...submittedQuestions, [currentQ.id]: true });

    // 整合本機錯題本儲存
    const isAnsCorrect = selected === currentQ.correctAnswer;
    if (isAnsCorrect) {
      recordCorrectAttempt(userId, currentQ.id);
    } else {
      const optMap: { A: string; B: string; C: string; D: string } = {
        A: currentQ.options.find((o) => o.key === 'A')?.text || '',
        B: currentQ.options.find((o) => o.key === 'B')?.text || '',
        C: currentQ.options.find((o) => o.key === 'C')?.text || '',
        D: currentQ.options.find((o) => o.key === 'D')?.text || '',
      };
      recordWrongAttempt(userId, {
        questionId: currentQ.id,
        certificationId: 'web-design-c',
        officialSection: currentQ.officialSection,
        officialNumber: currentQ.officialNumber,
        officialPage: currentQ.officialPage,
        chapterId: parseInt(currentQ.officialSection, 10),
        topic: currentQ.category || currentQ.sectionName,
        question: currentQ.question,
        options: optMap,
        userSelectedAnswer: selected,
        correctAnswer: currentQ.correctAnswer,
        explanation: currentQ.explanation,
        source: 'theory_practice',
      });
    }
    refreshWrongData();
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

  const handleRemoveWrongItem = (qId: string) => {
    removeWrongQuestion(userId, qId);
    refreshWrongData();
  };

  const handleClearAllWrong = () => {
    if (window.confirm('確定要清空本機全部錯題紀錄嗎？此操作不可逆。')) {
      clearAllWrongQuestions(userId);
      refreshWrongData();
    }
  };

  // 單題卡片立即重測
  const handleInPlaceSelect = (qId: string, opt: 'A' | 'B' | 'C' | 'D') => {
    if (inPlaceSubmitted[qId]) return;
    setInPlaceAnswers({ ...inPlaceAnswers, [qId]: opt });
  };

  const handleInPlaceSubmit = (item: WrongQuestionItem) => {
    const chosen = inPlaceAnswers[item.questionId];
    if (!chosen) return;

    const isAnsCorrect = chosen === item.correctAnswer;
    if (isAnsCorrect) {
      recordCorrectAttempt(userId, item.questionId);
    } else {
      recordWrongAttempt(userId, {
        questionId: item.questionId,
        certificationId: item.certificationId,
        officialSection: item.officialSection,
        officialNumber: item.officialNumber,
        officialPage: item.officialPage,
        chapterId: item.chapterId,
        topic: item.topic,
        question: item.question,
        options: item.options,
        userSelectedAnswer: chosen,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        source: 'manual_review',
      });
    }

    setInPlaceSubmitted({ ...inPlaceSubmitted, [item.questionId]: true });
    refreshWrongData();
  };

  // 獨立抽題複習模式
  const handleStartReviewQuiz = (onlyUnmastered: boolean = false) => {
    const questions = drawReviewQuestions(userId, 10, wrongFilterSection, onlyUnmastered);
    if (questions.length === 0) {
      alert('目前篩選條件下沒有可複習的錯題！');
      return;
    }
    setReviewQuizQuestions(questions);
    setReviewQuizIdx(0);
    setReviewQuizAnswers({});
    setReviewQuizSubmitted({});
    setReviewQuizSummary(null);
    setIsReviewQuizActive(true);
  };

  const handleReviewQuizSubmit = () => {
    const currentReviewQ = reviewQuizQuestions[reviewQuizIdx];
    if (!currentReviewQ) return;
    const chosen = reviewQuizAnswers[currentReviewQ.questionId];
    if (!chosen) return;

    setReviewQuizSubmitted({ ...reviewQuizSubmitted, [currentReviewQ.questionId]: true });

    if (chosen === currentReviewQ.correctAnswer) {
      recordCorrectAttempt(userId, currentReviewQ.questionId);
    } else {
      recordWrongAttempt(userId, {
        questionId: currentReviewQ.questionId,
        certificationId: currentReviewQ.certificationId,
        officialSection: currentReviewQ.officialSection,
        officialNumber: currentReviewQ.officialNumber,
        officialPage: currentReviewQ.officialPage,
        chapterId: currentReviewQ.chapterId,
        topic: currentReviewQ.topic,
        question: currentReviewQ.question,
        options: currentReviewQ.options,
        userSelectedAnswer: chosen,
        correctAnswer: currentReviewQ.correctAnswer,
        explanation: currentReviewQ.explanation,
        source: 'manual_review',
      });
    }

    refreshWrongData();
  };

  const handleFinishReviewQuiz = () => {
    let correct = 0;
    reviewQuizQuestions.forEach((q) => {
      if (reviewQuizAnswers[q.questionId] === q.correctAnswer) {
        correct += 1;
      }
    });

    setReviewQuizSummary({
      total: reviewQuizQuestions.length,
      correct,
      mastered: 0,
    });
  };

  // Stats
  const answeredCount = Object.keys(submittedQuestions).length;
  const correctCount = Object.entries(submittedQuestions).filter(([qId]) => {
    const q = ALL_OFFICIAL_THEORY_QUESTIONS.find((item) => item.id === qId);
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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>學科理論題庫 (17300 網頁設計丙級)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">學科核心題庫</span>
                  <span className="badge badge-neutral">官方題庫約 {OFFICIAL_THEORY_TOTAL_QUESTIONS} 題（示範模式）</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  {viewMode === 'wrong_notebook' ? '個人專屬錯題本與弱點複習' : '學科章節練習與即時解析'}
                </h1>
              </div>

              {/* Action Switch Mode */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'wrong_notebook' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setViewMode(viewMode === 'wrong_notebook' ? 'chapter' : 'wrong_notebook')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <AlertCircle size={15} />
                  <span>{viewMode === 'wrong_notebook' ? '返回章節練習' : `我的錯題本 (${wrongStats.unresolvedCount} 待複習)`}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => goToMockExam('web-design-c')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FileCheck size={15} />
                  <span>全真模擬考模式</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Mode Notice Banner */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>示範資料與錯題本功能：</strong>答錯題目將自動收錄於本機專屬錯題本（LocalStorage），支援錯誤次數累計與再測答對攻克標記。
            </span>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="container" style={{ marginTop: '24px' }}>
          {viewMode === 'wrong_notebook' ? (
            /* Wrong Questions Notebook & Personalized Review System */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top 4 Mastery Metric Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '16px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-default)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>累計收錄錯題</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-brand-deep-slate)' }}>
                    {wrongStats.totalRecorded} <span style={{ fontSize: '12px', fontWeight: 500 }}>題</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    學科練習與模擬考失分
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid rgba(198, 40, 40, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#C62828', marginBottom: '4px' }}>尚未掌握 (需加強)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#C62828' }}>
                    {wrongStats.unmasteredCount} <span style={{ fontSize: '12px', fontWeight: 500 }}>題</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    連續答對 0 次
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid rgba(230, 81, 0, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#E65100', marginBottom: '4px' }}>複習中 (已答對1次)</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#E65100' }}>
                    {wrongStats.reviewingCount} <span style={{ fontSize: '12px', fontWeight: 500 }}>題</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    再連續答對 1 次即攻克
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid rgba(46, 125, 50, 0.3)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#2E7D32', marginBottom: '4px' }}>已攻克掌握</div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#2E7D32' }}>
                    {wrongStats.masteredCount} <span style={{ fontSize: '12px', fontWeight: 500 }}>題</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    達成連續答對 2 次門檻
                  </div>
                </div>
              </div>

              {/* Interactive Review Quiz Sub-View */}
              {isReviewQuizActive && reviewQuizQuestions.length > 0 ? (
                <div className="card" style={{ padding: '32px', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
                  {reviewQuizSummary ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <CheckCircle2 size={48} color="#2E7D32" style={{ margin: '0 auto 16px auto' }} />
                      <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>
                        錯題複習測驗完成！
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        本次練習共 <strong>{reviewQuizSummary.total}</strong> 題，答對 <strong>{reviewQuizSummary.correct}</strong> 題（答對率 {Math.round((reviewQuizSummary.correct / reviewQuizSummary.total) * 100)}%）。
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => {
                          setIsReviewQuizActive(false);
                          setReviewQuizSummary(null);
                        }}
                      >
                        返回錯題本清單
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Quiz Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-gold">錯題抽測模式</span>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>
                            第 {reviewQuizIdx + 1} 題 / 共 {reviewQuizQuestions.length} 題
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => setIsReviewQuizActive(false)}
                        >
                          結束複習
                        </button>
                      </div>

                      {/* Current Quiz Question */}
                      {(() => {
                        const q = reviewQuizQuestions[reviewQuizIdx];
                        const chosen = reviewQuizAnswers[q.questionId];
                        const isSub = reviewQuizSubmitted[q.questionId];
                        const isQCorrect = chosen === q.correctAnswer;

                        return (
                          <div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                              【{q.topic}】(官方第 {q.officialPage} 頁)
                            </div>
                            <h3 style={{ fontSize: '16px', fontWeight: 600, lineHeight: 1.6, marginBottom: '20px' }}>
                              {q.question}
                            </h3>

                            {/* Options */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                                const optText = q.options[optKey];
                                const isSelected = chosen === optKey;
                                let border = isSelected ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)';
                                let bg = isSelected ? 'var(--surface-sunken)' : 'var(--surface-base)';

                                if (isSub) {
                                  if (optKey === q.correctAnswer) {
                                    border = '2px solid #2E7D32';
                                    bg = 'rgba(46, 125, 50, 0.08)';
                                  } else if (isSelected && !isQCorrect) {
                                    border = '2px solid #C62828';
                                    bg = 'rgba(198, 40, 40, 0.08)';
                                  }
                                }

                                return (
                                  <button
                                    key={optKey}
                                    type="button"
                                    disabled={isSub}
                                    onClick={() => setReviewQuizAnswers({ ...reviewQuizAnswers, [q.questionId]: optKey })}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: '10px',
                                      padding: '12px 14px',
                                      borderRadius: '6px',
                                      border,
                                      backgroundColor: bg,
                                      cursor: isSub ? 'default' : 'pointer',
                                      textAlign: 'left',
                                    }}
                                  >
                                    <strong style={{ width: '20px', color: 'var(--color-brand-deep-slate)' }}>{optKey}.</strong>
                                    <span style={{ fontSize: '13px', lineHeight: 1.5 }}>{optText}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Feedback & Actions */}
                            {isSub ? (
                              <div>
                                <div style={{ padding: '12px 16px', borderRadius: '6px', backgroundColor: isQCorrect ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)', border: isQCorrect ? '1px solid #2E7D32' : '1px solid #C62828', marginBottom: '16px', fontSize: '13px' }}>
                                  <strong>{isQCorrect ? '✓ 答對了！' : '✗ 答錯了！'}</strong>{' '}
                                  {isQCorrect ? '連續答對次數 +1，距離攻克更進一步！' : '錯誤次數累計，連續答對已重置為 0。'}
                                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>解析：</strong>{q.explanation}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                  {reviewQuizIdx < reviewQuizQuestions.length - 1 ? (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => setReviewQuizIdx(reviewQuizIdx + 1)}
                                    >
                                      下一題 →
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={handleFinishReviewQuiz}
                                    >
                                      查看本次複習總結
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  disabled={!chosen}
                                  onClick={handleReviewQuizSubmit}
                                >
                                  送出答案並核對
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Wrong Questions List & Filtering Controls */
                <div>
                  {/* Filter & Action Toolbar */}
                  <div style={{ padding: '16px 20px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-default)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      {/* Status Filter Tabs */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className={`btn btn-xs ${wrongFilterStatus === 'unresolved' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setWrongFilterStatus('unresolved')}
                        >
                          待攻克全部 ({wrongStats.unresolvedCount})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${wrongFilterStatus === 'unmastered' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setWrongFilterStatus('unmastered')}
                        >
                          尚未掌握 ({wrongStats.unmasteredCount})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${wrongFilterStatus === 'reviewing' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setWrongFilterStatus('reviewing')}
                        >
                          複習中 ({wrongStats.reviewingCount})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${wrongFilterStatus === 'mastered' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setWrongFilterStatus('mastered')}
                        >
                          已攻克掌握 ({wrongStats.masteredCount})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-xs ${wrongFilterStatus === 'all' ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setWrongFilterStatus('all')}
                        >
                          全部錯題 ({wrongStats.totalRecorded})
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-xs"
                          disabled={wrongStats.unresolvedCount === 0}
                          onClick={() => handleStartReviewQuiz(false)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Play size={12} />
                          <span>開始錯題抽測 (10題)</span>
                        </button>
                        {wrongList.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllWrong}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid #C62828',
                              backgroundColor: 'transparent',
                              color: '#C62828',
                              cursor: 'pointer',
                              fontSize: '11px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Trash2 size={12} />
                            <span>清空紀錄</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Secondary Filters: Work Item & Sorting */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontSize: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>工作項目分類：</span>
                        <select
                          value={wrongFilterSection}
                          onChange={(e) => setWrongFilterSection(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: '12px' }}
                        >
                          <option value="all">全部工作項目</option>
                          <option value="01">項目 01：作業準備</option>
                          <option value="02">項目 02：應用軟體使用</option>
                          <option value="03">項目 03：系統軟體使用</option>
                          <option value="04">項目 04：資訊及安全</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>排序方式：</span>
                        <select
                          value={wrongSortBy}
                          onChange={(e) => setWrongSortBy(e.target.value as any)}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default)', fontSize: '12px' }}
                        >
                          <option value="lastAttemptAt">最後作答時間</option>
                          <option value="wrongCount">錯誤次數（高到低）</option>
                          <option value="officialNumber">官方題號</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setWrongSortOrder(wrongSortOrder === 'desc' ? 'asc' : 'desc')}
                          style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--border-default)', background: 'var(--surface-base)', cursor: 'pointer' }}
                        >
                          {wrongSortOrder === 'desc' ? '降冪 ↓' : '升冪 ↑'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Empty state */}
                  {wrongList.length === 0 ? (
                    <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={40} color="#2E7D32" style={{ margin: '0 auto 16px auto' }} />
                      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '8px' }}>
                        目前篩選分類下沒有錯題紀錄！
                      </h3>
                      <p style={{ fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                        凡是在學科章節練習或全真模擬考中答錯或未答的題目，都會自動彙整於此供你反覆複習與鞏固觀念。
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setViewMode('chapter')}
                      >
                        前往章節練習
                      </button>
                    </div>
                  ) : (
                    /* Wrong items card list */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {wrongList.map((item, idx) => {
                        const isInPlaceActive = inPlaceActiveId === item.questionId;
                        const inPlaceSelected = inPlaceAnswers[item.questionId];
                        const inPlaceDone = inPlaceSubmitted[item.questionId];

                        return (
                          <div
                            key={item.questionId}
                            className="card"
                            style={{
                              padding: '20px 24px',
                              borderLeft:
                                item.masteryStatus === 'mastered'
                                  ? '4px solid #2E7D32'
                                  : item.masteryStatus === 'reviewing'
                                  ? '4px solid #E65100'
                                  : '4px solid #C62828',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {/* Mastery status badge */}
                                {item.masteryStatus === 'mastered' ? (
                                  <span className="badge badge-slate" style={{ fontSize: '11px', color: '#2E7D32', border: '1px solid #2E7D32' }}>
                                    ● 已掌握 (連續答對 {item.consecutiveCorrect} 次)
                                  </span>
                                ) : item.masteryStatus === 'reviewing' ? (
                                  <span className="badge badge-gold" style={{ fontSize: '11px', color: '#E65100', border: '1px solid #E65100' }}>
                                    ★ 複習中 (已答對 1 次 · 還差 1 次攻克)
                                  </span>
                                ) : (
                                  <span className="badge badge-neutral" style={{ fontSize: '11px', color: '#C62828', border: '1px solid #C62828' }}>
                                    ▲ 尚未掌握 (累計錯 {item.wrongCount} 次)
                                  </span>
                                )}

                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  【{item.topic}】官方第 {item.officialPage || 1} 頁
                                </span>
                                <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                                  {item.source === 'mock_exam' ? '來源：模擬測驗' : '來源：學科練習'}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  最後作答：{new Date(item.lastAttemptAt).toLocaleDateString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveWrongItem(item.questionId)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                  }}
                                  title="從錯題本移除"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-brand-charcoal)', marginBottom: '14px', lineHeight: 1.6 }}>
                              #{idx + 1} 官方題號 {item.officialNumber}：{item.question}
                            </h4>

                            {/* Options with past user answer highlight */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                              {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                                const text = item.options[optKey];
                                const isCorrectOpt = optKey === item.correctAnswer;
                                const isUserSelected = optKey === item.userSelectedAnswer;
                                return (
                                  <div
                                    key={optKey}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: isCorrectOpt ? 'rgba(46, 125, 50, 0.08)' : isUserSelected ? 'rgba(198, 40, 40, 0.08)' : 'var(--surface-sunken)',
                                      border: isCorrectOpt ? '1px solid #2E7D32' : isUserSelected ? '1px solid #C62828' : '1px solid var(--border-subtle)',
                                      color: isCorrectOpt ? '#2E7D32' : isUserSelected ? '#C62828' : 'var(--text-primary)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}
                                  >
                                    <strong style={{ width: '18px' }}>{optKey}.</strong>
                                    <span>{text}</span>
                                    {isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700 }}>[標準答案]</span>}
                                    {isUserSelected && !isCorrectOpt && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700 }}>[上次誤選]</span>}
                                  </div>
                                );
                              })}
                            </div>

                            {item.userSelectedAnswer === '未作答' && (
                              <div style={{ fontSize: '12px', color: '#E65100', marginBottom: '10px' }}>
                                提示：上次於模擬考中未作答，需特別加強！
                              </div>
                            )}

                            {/* Single Question In-Place Retry Module */}
                            <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px', marginTop: '12px' }}>
                              {!isInPlaceActive ? (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>詳解核對：</strong>{item.explanation}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-xs"
                                    onClick={() => setInPlaceActiveId(item.questionId)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', marginLeft: '12px' }}
                                  >
                                    <RotateCcw size={12} />
                                    <span>立即重測此題</span>
                                  </button>
                                </div>
                              ) : (
                                <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: '6px' }}>
                                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>【單題即時重測】請選擇正確答案：</span>
                                    <button
                                      type="button"
                                      onClick={() => setInPlaceActiveId(null)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--text-muted)' }}
                                    >
                                      收起
                                    </button>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    {(['A', 'B', 'C', 'D'] as const).map((key) => (
                                      <button
                                        key={key}
                                        type="button"
                                        disabled={inPlaceDone}
                                        onClick={() => handleInPlaceSelect(item.questionId, key)}
                                        style={{
                                          flex: 1,
                                          padding: '6px 0',
                                          textAlign: 'center',
                                          borderRadius: '4px',
                                          border: inPlaceSelected === key ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
                                          backgroundColor: inPlaceSelected === key ? 'var(--color-brand-deep-slate)' : '#FFFFFF',
                                          color: inPlaceSelected === key ? '#FFFFFF' : 'var(--text-primary)',
                                          fontWeight: 700,
                                          cursor: inPlaceDone ? 'default' : 'pointer',
                                          fontSize: '13px',
                                        }}
                                      >
                                        {key}
                                      </button>
                                    ))}
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '12px' }}>
                                      {inPlaceDone && (
                                        inPlaceSelected === item.correctAnswer ? (
                                          <span style={{ color: '#2E7D32', fontWeight: 700 }}>✓ 恭喜答對！連續答對次數已累計。</span>
                                        ) : (
                                          <span style={{ color: '#C62828', fontWeight: 700 }}>✗ 答錯了，請再確認考點。</span>
                                        )
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-xs"
                                      disabled={!inPlaceSelected || inPlaceDone}
                                      onClick={() => handleInPlaceSubmit(item)}
                                    >
                                      送出核對
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Chapter Practice Standard View */
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

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>待複習錯題：<strong style={{ color: '#C62828' }}>{wrongStats.unresolvedCount}</strong> 題</span>
                    <button
                      type="button"
                      onClick={() => setViewMode('wrong_notebook')}
                      style={{ color: 'var(--color-brand-gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}
                    >
                      開啟複習 →
                    </button>
                  </div>
                </div>

                {/* Chapter / Official Section Selector */}
                <div className="card" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
                    官方工作項目分類（共 {OFFICIAL_THEORY_TOTAL_QUESTIONS} 題）
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {OFFICIAL_SECTIONS_LIST.map((sec) => {
                      const isSelected = selectedSection === sec.id;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => {
                            setSelectedSection(sec.id);
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
                          <span>{sec.label}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({sec.count})</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, borderTop: '1px dashed var(--border-subtle)', paddingTop: '12px' }}>
                    {THEORY_QUESTIONS_NOTE}
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
                        sourceVersion="V115100817 現行版"
                        sourcePage={currentQ.officialPage}
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
                      <span>{isBookmarked ? '已收藏' : '收藏此題'}</span>
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
                              backgroundColor: isChosen ? 'var(--color-brand-deep-slate)' : 'var(--surface-sunken)',
                              color: isChosen ? '#FFFFFF' : 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                              flexShrink: 0,
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

                  {/* Answer Feedback & Submission CTA */}
                  {!isSubmitted ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSubmitAnswer}
                        disabled={!currentAnswer}
                        style={{ opacity: currentAnswer ? 1 : 0.5, cursor: currentAnswer ? 'pointer' : 'not-allowed' }}
                      >
                        確認送出此題答案
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '16px',
                          color: isCorrect ? '#2E7D32' : '#C62828',
                          fontWeight: 700,
                          fontSize: '16px',
                        }}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={22} color="#2E7D32" />
                            <span>回答正確！概念掌握完整。</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={22} color="#C62828" />
                            <span>
                              回答不正確，正確解答為（{currentQ.correctAnswer}）。已自動收錄於本機錯題本。
                            </span>
                          </>
                        )}
                      </div>

                      {/* Official Explanation */}
                      <div
                        style={{
                          backgroundColor: 'var(--surface-sunken)',
                          padding: '16px 20px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '13px',
                          lineHeight: 1.8,
                          color: 'var(--text-secondary)',
                          marginBottom: '20px',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                          官方試題解析說明：
                        </div>
                        {currentQ.explanation}
                      </div>

                      {/* 4-Step Socratic AI Guidance Accordion (Only for questions with detailed pedagogical hints) */}
                      {currentQ.aiHints && (
                        <div style={{ marginTop: '16px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={15} color="var(--color-brand-gold)" />
                            <span>AI 4 階認知鷹架解析（點擊階梯深入探討）</span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                            {[
                              { step: 1, label: '1. 觀念聚焦' },
                              { step: 2, label: '2. 思考破題' },
                              { step: 3, label: '3. 邊界提點' },
                              { step: 4, label: '4. 完整解構' },
                            ].map((s) => (
                              <button
                                key={s.step}
                                type="button"
                                onClick={() => setExpandedAiStep(expandedAiStep === s.step ? 0 : s.step)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '4px',
                                  border: expandedAiStep === s.step ? '1px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                                  backgroundColor: expandedAiStep === s.step ? 'var(--color-brand-deep-slate)' : 'var(--surface-base)',
                                  color: expandedAiStep === s.step ? '#FFFFFF' : 'var(--text-primary)',
                                  fontSize: '12px',
                                  fontWeight: expandedAiStep === s.step ? 700 : 500,
                                  cursor: 'pointer',
                                }}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>

                          {expandedAiStep > 0 && (
                            <div style={{ padding: '14px 18px', backgroundColor: '#F8F9FA', borderRadius: '6px', border: '1px solid #E9ECEF', fontSize: '13px', lineHeight: 1.7, color: '#334155' }}>
                              <div style={{ fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                                {expandedAiStep === 1 && '【第 1 階 · 觀念聚焦】核心原理：'}
                                {expandedAiStep === 2 && '【第 2 階 · 思考破題】思考脈絡：'}
                                {expandedAiStep === 3 && '【第 3 階 · 邊界提點】常見易錯細節：'}
                                {expandedAiStep === 4 && '【第 4 階 · 完整解構】考場規範總結：'}
                              </div>
                              {expandedAiStep === 1 && currentQ.aiHints.level1Focus}
                              {expandedAiStep === 2 && currentQ.aiHints.level2Strategy}
                              {expandedAiStep === 3 && currentQ.aiHints.level3Boundary}
                              {expandedAiStep === 4 && currentQ.aiHints.level4Breakdown}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Navigation Prev / Next */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handlePrev}
                      disabled={safeIdx === 0}
                      style={{ opacity: safeIdx === 0 ? 0.4 : 1, cursor: safeIdx === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      <ChevronLeft size={16} />
                      <span>上一題</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        第 {safeIdx + 1} / {filteredQuestions.length} 題
                      </span>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                        <input
                          type="number"
                          min={1}
                          max={filteredQuestions.length}
                          placeholder="題號"
                          value={jumpInput}
                          onChange={(e) => setJumpInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const target = parseInt(jumpInput, 10);
                              if (!isNaN(target) && target >= 1 && target <= filteredQuestions.length) {
                                setCurrentIdx(target - 1);
                                setExpandedAiStep(0);
                                setJumpInput('');
                              }
                            }
                          }}
                          style={{
                            width: '56px',
                            padding: '3px 6px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-default)',
                            textAlign: 'center',
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => {
                            const target = parseInt(jumpInput, 10);
                            if (!isNaN(target) && target >= 1 && target <= filteredQuestions.length) {
                              setCurrentIdx(target - 1);
                              setExpandedAiStep(0);
                              setJumpInput('');
                            }
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
                        >
                          跳題
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={handleNext}
                      disabled={safeIdx >= filteredQuestions.length - 1}
                      style={{ opacity: safeIdx >= filteredQuestions.length - 1 ? 0.4 : 1, cursor: safeIdx >= filteredQuestions.length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <span>下一題</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
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
