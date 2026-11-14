import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  AlertCircle,
  Flag,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  TrendingUp,
  LayoutDashboard,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  MockExamSession,
  createMockExamSession,
  getActiveMockExam,
  saveActiveMockExam,
  evaluateMockExam,
  calculateRemainingSeconds,
  syncMockExamWrongQuestions,
  clearActiveMockExam,
  getMockExamHistory,
} from '../../utils/mockExamStorage';

interface MockExamPageProps {
  onOpenTeacherApply?: () => void;
}

export const MockExamPage: React.FC<MockExamPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToCertifications, goToTheoryPractice, goToStudentDashboard, goToLearningProgress } = useNavigation();

  const userId = user?.id || 'guest-anonymous';

  // Config options for pre-exam
  const [selectedDuration, setSelectedDuration] = useState<'official_100' | 'practice_60'>('official_100');
  const [selectedStrategy, setSelectedStrategy] = useState<'stratified' | 'random'>('stratified');

  // Exam session state
  const [session, setSession] = useState<MockExamSession | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(6000);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'unanswered'>('all');
  const [syncedWrongCount, setSyncedWrongCount] = useState<number | null>(null);

  // Initialize or restore active session on mount or userId change
  useEffect(() => {
    const active = getActiveMockExam(userId);
    if (active) {
      setSession(active);
      if (!active.isSubmitted) {
        const remaining = calculateRemainingSeconds(active);
        setSecondsRemaining(remaining);
      }
    } else {
      setSession(null);
    }
  }, [userId]);

  // Countdown timer based on actual expiry time
  useEffect(() => {
    if (!session || session.isSubmitted) return;

    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(session);
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Time is up: auto-submit
        const evaluated = evaluateMockExam(session);
        setSession(evaluated);
        const synced = syncMockExamWrongQuestions(userId, evaluated);
        setSyncedWrongCount(synced);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session, userId]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    const newSession = createMockExamSession(userId, selectedDuration, selectedStrategy);
    setSession(newSession);
    setActiveQuestionIdx(0);
    setSecondsRemaining(calculateRemainingSeconds(newSession));
    setShowConfirmModal(false);
    setSyncedWrongCount(null);
  };

  const handleSelectOption = (questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    if (!session || session.isSubmitted) return;
    const updatedAnswers = { ...session.answers, [questionId]: option };
    const updatedSession: MockExamSession = {
      ...session,
      answers: updatedAnswers,
    };
    setSession(updatedSession);
    saveActiveMockExam(updatedSession);
  };

  const handleToggleMarkReview = (questionId: string) => {
    if (!session || session.isSubmitted) return;
    const currentMarked = !!session.markedForReview[questionId];
    const updatedMarked = { ...session.markedForReview, [questionId]: !currentMarked };
    const updatedSession: MockExamSession = {
      ...session,
      markedForReview: updatedMarked,
    };
    setSession(updatedSession);
    saveActiveMockExam(updatedSession);
  };

  const handleSubmitExam = useCallback(() => {
    if (!session) return;
    setShowConfirmModal(false);
    const evaluated = evaluateMockExam(session);
    setSession(evaluated);
    const synced = syncMockExamWrongQuestions(userId, evaluated);
    setSyncedWrongCount(synced);
  }, [session, userId]);

  const handleResetExam = () => {
    clearActiveMockExam(userId);
    setSession(null);
    setActiveQuestionIdx(0);
    setSyncedWrongCount(null);
  };

  // Metrics calculation
  const totalQuestions = session?.questions.length || 80;
  const answeredCount = session ? Object.keys(session.answers).length : 0;
  const currentQ = session?.questions[activeQuestionIdx];
  const isCurrentMarked = currentQ ? !!session?.markedForReview[currentQ.id] : false;

  // Review filtered list
  const filteredReviewQuestions = useMemo(() => {
    if (!session || !session.isSubmitted) return [];
    return session.questions.filter((q) => {
      const userAns = session.answers[q.id];
      if (reviewFilter === 'wrong') {
        return userAns && userAns !== q.correctAnswer;
      }
      if (reviewFilter === 'unanswered') {
        return !userAns;
      }
      return true;
    });
  }, [session, reviewFilter]);

  // Exam history count
  const examHistory = useMemo(() => getMockExamHistory(userId), [userId, session?.isSubmitted]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs & Status Bar */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '8px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#certifications" onClick={(e) => { e.preventDefault(); goToCertifications(); }}>證照中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>17300 網頁設計丙級 · 全真模擬測驗</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-gold">官方考綱 605 題全庫模擬</span>
                  <span className="badge badge-neutral">正式規格 80 題單選 · 每題 1.25 分 · 及格 60 分</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '24px', margin: 0 }}>
                  17300 網頁設計丙級 · 學科全真模擬考場
                </h1>
              </div>

              {/* In-exam Header Timer & Action */}
              {session && !session.isSubmitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: secondsRemaining < 300 ? 'rgba(198, 40, 40, 0.12)' : 'var(--surface-sunken)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: secondsRemaining < 300 ? '1px solid #C62828' : '1px solid var(--border-default)',
                      fontWeight: 700,
                      color: secondsRemaining < 300 ? '#C62828' : 'var(--color-brand-deep-slate)',
                      fontSize: '15px',
                    }}
                  >
                    <Clock size={18} />
                    <span>倒數計時：{formatTime(secondsRemaining)}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowConfirmModal(true)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FileCheck size={16} />
                    <span>交卷結算 ({answeredCount}/{totalQuestions})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Demo Mode & Official Notice Banner */}
        <div className="container" style={{ marginTop: '16px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>勞動部技能檢定中心官方考綱查證說明：</strong>正式檢定測試時間為 100 分鐘、共 80 題單選題、及格標準為 60 分。本考場題目全數源自 <code>173003A17.pdf</code> 605 題有效題庫，抽題比例採依工作項目題目權重分層抽樣（非官方公告之絕對固定配額，屬模擬考配置）。
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: Pre-Exam Welcome Screen                                            */}
        {/* ========================================================================= */}
        {!session && (
          <div className="container" style={{ marginTop: '28px' }}>
            <div className="card" style={{ maxWidth: '760px', margin: '0 auto', padding: '36px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-sunken)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: 'var(--color-brand-deep-slate)',
                }}
              >
                <Award size={32} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', textAlign: 'center' }}>
                開始 17300 網頁設計丙級 學科全真模擬測驗
              </h2>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px', textAlign: 'center' }}>
                本系統將從勞動部官方最新有效題庫（605 題）中隨機抽取 <strong>80 題單選題</strong>。測驗中無答案提示與 AI 解說，時間截止自動收卷，嚴格模擬國家考場情境。
              </p>

              {/* Exam Specs Table */}
              <div style={{ backgroundColor: 'var(--surface-sunken)', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px', fontSize: '13px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-brand-deep-slate)' }}>
                  【官方檢定考場規格對照表】
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                  <div>• 總題數：<strong>80 題單選</strong></div>
                  <div>• 滿分計分：<strong>100 分</strong> (每題 1.25 分)</div>
                  <div>• 及格標準：<strong>60.00 分</strong> (答對 48 題)</div>
                  <div>• 倒扣規則：<strong>答錯不倒扣</strong></div>
                </div>
              </div>

              {/* Mode & Strategy Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                <div style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    1. 測驗時限配置：
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === 'official_100'}
                        onChange={() => setSelectedDuration('official_100')}
                      />
                      <span><strong>100 分鐘</strong>（官方標準檢定時限）</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === 'practice_60'}
                        onChange={() => setSelectedDuration('practice_60')}
                      />
                      <span><strong>60 分鐘</strong>（高效自修速測模式）</span>
                    </label>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    2. 抽題演算法策略：
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="strategy"
                        checked={selectedStrategy === 'stratified'}
                        onChange={() => setSelectedStrategy('stratified')}
                      />
                      <span><strong>分層權重抽樣</strong>（依 4 大工作項目比例抽測）</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="strategy"
                        checked={selectedStrategy === 'random'}
                        onChange={() => setSelectedStrategy('random')}
                      />
                      <span><strong>全庫 605 題隨機</strong>（無固定項目配額）</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleStartExam}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>抽取試卷並開始考試</span>
                  <ArrowRight size={18} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => goToTheoryPractice('web-design-c')}
                >
                  <BookOpen size={18} />
                  <span>前往章節練習</span>
                </button>
              </div>

              {/* Past history quick summary */}
              {examHistory.length > 0 && (
                <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} />
                    <span>本機過往測驗紀錄 (最近 {examHistory.length} 場)</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {examHistory.slice(0, 3).map((item, idx) => (
                      <div
                        key={item.sessionId || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 14px',
                          backgroundColor: 'var(--surface-sunken)',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <div>
                          <strong>{new Date(item.startedAt).toLocaleDateString()} {new Date(item.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                          <span style={{ marginLeft: '8px', color: 'var(--text-muted)' }}>
                            ({item.mode === 'official_100' ? '100分鐘' : '60分鐘'} · {item.strategy === 'stratified' ? '分層' : '隨機'})
                          </span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 700, color: item.isPassed ? '#2E7D32' : '#C62828', fontSize: '14px', marginRight: '12px' }}>
                            {item.score} 分
                          </span>
                          <span className={`badge ${item.isPassed ? 'badge-primary' : 'badge-neutral'}`} style={{ fontSize: '11px' }}>
                            {item.isPassed ? '及格' : '未達標'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: In-Progress Exam Room Screen                                      */}
        {/* ========================================================================= */}
        {session && !session.isSubmitted && currentQ && (
          <div className="container" style={{ marginTop: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: '24px', alignItems: 'start' }} className="exam-grid">
              {/* Left Column: Active Question Workspace */}
              <div className="card" style={{ padding: '28px' }}>
                {/* Question Info Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-slate" style={{ fontSize: '13px', fontWeight: 700 }}>
                      第 {activeQuestionIdx + 1} 題 / 共 {totalQuestions} 題
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      【{currentQ.sectionName}】(官方第 {currentQ.officialPage} 頁)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleMarkReview(currentQ.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: isCurrentMarked ? '#E65100' : 'var(--text-muted)',
                      fontWeight: isCurrentMarked ? 700 : 500,
                    }}
                  >
                    <Flag size={15} fill={isCurrentMarked ? '#E65100' : 'none'} />
                    <span>{isCurrentMarked ? '已標記待複查' : '標記此題待查'}</span>
                  </button>
                </div>

                {/* Question Text */}
                <h2 style={{ fontSize: '17px', lineHeight: 1.7, marginBottom: '20px', fontWeight: 600, color: 'var(--color-brand-charcoal)' }}>
                  {currentQ.question}
                </h2>

                {/* Optional Code Snippet */}
                {currentQ.codeSnippet && (
                  <pre
                    style={{
                      backgroundColor: 'var(--surface-sunken)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '13px',
                      marginBottom: '20px',
                      overflowX: 'auto',
                    }}
                  >
                    <code>{currentQ.codeSnippet}</code>
                  </pre>
                )}

                {/* Answer Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = session.answers[currentQ.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
                          backgroundColor: isSelected ? 'var(--surface-sunken)' : 'var(--surface-base)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 700,
                            backgroundColor: isSelected ? 'var(--color-brand-deep-slate)' : 'var(--surface-sunken)',
                            color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
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

                {/* Navigation Prev / Next */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                    style={{ opacity: activeQuestionIdx === 0 ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ChevronLeft size={16} />
                    <span>上一題</span>
                  </button>

                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    已作答：<strong>{answeredCount}</strong> / {totalQuestions}
                  </span>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={activeQuestionIdx === totalQuestions - 1}
                    onClick={() => setActiveQuestionIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    style={{ opacity: activeQuestionIdx === totalQuestions - 1 ? 0.4 : 1, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>下一題</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Right Column: 80 Questions Jump Navigator Card */}
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                    答題進度卡 (80題)
                  </h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    點擊題號快速跳轉
                  </span>
                </div>

                {/* Grid with 8 columns */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '4px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    padding: '4px',
                    marginBottom: '12px',
                    backgroundColor: 'var(--surface-sunken)',
                    borderRadius: '6px',
                  }}
                >
                  {session.questions.map((q, idx) => {
                    const isAnswered = !!session.answers[q.id];
                    const isCurrent = idx === activeQuestionIdx;
                    const isMarked = !!session.markedForReview[q.id];

                    let bg = 'var(--surface-base)';
                    let color = 'var(--text-primary)';
                    let border = '1px solid var(--border-subtle)';

                    if (isAnswered) {
                      bg = 'var(--color-brand-deep-slate)';
                      color = '#FFFFFF';
                    }
                    if (isCurrent) {
                      border = '2px solid var(--color-brand-gold)';
                    } else if (isMarked) {
                      border = '2px solid #E65100';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveQuestionIdx(idx)}
                        title={`第 ${idx + 1} 題 ${isAnswered ? '(已作答)' : '(未作答)'}${isMarked ? ' [待複查]' : ''}`}
                        style={{
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '3px',
                          backgroundColor: bg,
                          color,
                          border,
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: 0,
                          position: 'relative',
                        }}
                      >
                        {idx + 1}
                        {isMarked && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '1px',
                              right: '1px',
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: '#E65100',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.8, borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-brand-deep-slate)', borderRadius: '2px' }} />
                    <span>深色：已作答 ({answeredCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }} />
                    <span>淺色：尚未作答 ({totalQuestions - answeredCount})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', border: '2px solid #E65100', borderRadius: '2px' }} />
                    <span>橘框：標記待複查</span>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowConfirmModal(true)}
                  style={{ width: '100%' }}
                >
                  確認送出交卷
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: Post-Exam Scorecard & Detailed Review Screen                       */}
        {/* ========================================================================= */}
        {session && session.isSubmitted && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '36px', maxWidth: '880px', margin: '0 auto' }}>
              {/* Scorecard Header */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: session.isPassed ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                    color: session.isPassed ? '#2E7D32' : '#C62828',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  {session.isPassed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                  {session.isPassed ? '恭喜通過！達到國家檢定 60 分及格標準' : '本次測驗未達 60 分及格門檻，請再接再厲！'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  勞動部 17300 網頁設計丙級學科全真模擬考成績單 ｜ 測驗時間：{session.submittedAt ? new Date(session.submittedAt).toLocaleString() : ''}
                </p>
              </div>

              {/* Score Metrics 3-card grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>測驗總成績</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: session.isPassed ? '#2E7D32' : '#C62828' }}>
                    {session.score} <span style={{ fontSize: '14px', fontWeight: 500 }}>分</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    及格標準：60.00 分
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>答題表現</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-deep-slate)', marginTop: '4px' }}>
                    {session.correctCount} <span style={{ fontSize: '13px', fontWeight: 500 }}>答對 / {session.wrongCount} 答錯</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    未作答：{session.unansweredCount} 題 ｜ 正確率：{session.correctCount !== undefined ? Math.round((session.correctCount / totalQuestions) * 100) : 0}%
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>工作項目分層</div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-charcoal)', marginTop: '4px' }}>
                    4 大項
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    抽題模式：{session.strategy === 'stratified' ? '權重分層 (31/31/9/9)' : '全庫隨機抽樣'}
                  </div>
                </div>
              </div>

              {/* Section Breakdown Radar/Bar */}
              {session.sectionBreakdown && (
                <div style={{ marginBottom: '28px', padding: '16px 20px', backgroundColor: 'var(--surface-sunken)', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BarChart2 size={16} />
                    <span>各工作項目落點與答對率分析</span>
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {Object.values(session.sectionBreakdown).map((sec) => (
                      <div key={sec.sectionId} style={{ backgroundColor: 'var(--surface-base)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                          項目 {sec.sectionId}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          答對 {sec.correct} / {sec.total} 題
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--surface-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${sec.percentage}%`,
                              height: '100%',
                              backgroundColor: sec.percentage >= 60 ? '#2E7D32' : '#C62828',
                            }}
                          />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, marginTop: '4px', color: sec.percentage >= 60 ? '#2E7D32' : '#C62828' }}>
                          {sec.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wrong sync notice */}
              {syncedWrongCount !== null && (
                <div style={{ marginBottom: '24px', padding: '12px 16px', backgroundColor: 'rgba(230, 81, 0, 0.08)', borderRadius: '6px', border: '1px solid rgba(230, 81, 0, 0.3)', fontSize: '13px', color: '#E65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>
                    已為您自動同步 <strong>{syncedWrongCount}</strong> 題答錯/未作答題目至「本機錯題本」，切換帳號或刷新頁面將持續保留。
                  </span>
                </div>
              )}

              {/* Review Filter Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  題目作答複盤與核對 (共 {filteredReviewQuestions.length} 題)
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn btn-xs ${reviewFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReviewFilter('all')}
                  >
                    全部試題 ({session.questions.length})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${reviewFilter === 'wrong' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReviewFilter('wrong')}
                  >
                    僅看答錯 ({session.wrongCount || 0})
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${reviewFilter === 'unanswered' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReviewFilter('unanswered')}
                  >
                    未作答 ({session.unansweredCount || 0})
                  </button>
                </div>
              </div>

              {/* Question By Question List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                {filteredReviewQuestions.map((q, idx) => {
                  const userAnswer = session.answers[q.id];
                  const isCorrect = userAnswer === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        border: isCorrect ? '1px solid #D9E2EA' : '1px solid rgba(198, 40, 40, 0.4)',
                        backgroundColor: isCorrect ? 'var(--surface-base)' : 'rgba(198, 40, 40, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                          #{idx + 1} 官方題號 {q.officialNumber} ｜ {isCorrect ? <span style={{ color: '#2E7D32' }}>✓ 答對</span> : <span style={{ color: '#C62828' }}>✗ 答錯/未答</span>}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          您的選擇：<strong style={{ color: isCorrect ? '#2E7D32' : '#C62828' }}>{userAnswer || '未作答'}</strong> ｜ 標準答案：<strong style={{ color: '#2E7D32' }}>{q.correctAnswer}</strong>
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: 1.6 }}>
                        {q.question}
                      </p>

                      {/* Options preview */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px', marginBottom: '10px', fontSize: '12px' }}>
                        {q.options.map((opt) => {
                          const isStd = opt.key === q.correctAnswer;
                          const isUser = opt.key === userAnswer;
                          return (
                            <div
                              key={opt.key}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '4px',
                                border: isStd ? '1px solid #2E7D32' : isUser ? '1px solid #C62828' : '1px solid var(--border-subtle)',
                                backgroundColor: isStd ? 'rgba(46, 125, 50, 0.08)' : isUser ? 'rgba(198, 40, 40, 0.08)' : 'var(--surface-sunken)',
                                color: isStd ? '#2E7D32' : isUser ? '#C62828' : 'var(--text-primary)',
                              }}
                            >
                              <strong>({opt.key})</strong> {opt.text}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '4px', lineHeight: 1.6 }}>
                        <strong>核實解析：</strong>{q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleResetExam}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={16} />
                  <span>再抽取一次新試卷測驗</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => goToTheoryPractice('web-design-c')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={16} />
                  <span>前往錯題本精熟複習</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goToStudentDashboard}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} />
                  <span>返回學生儀表板</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goToLearningProgress}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <TrendingUp size={16} />
                  <span>檢視完整學習進度</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmModal && session && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(38, 52, 61, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div className="card" style={{ maxWidth: '460px', width: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                確認送出交卷？
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                您已完成 <strong>{answeredCount}</strong> 題作答，尚有 <strong style={{ color: totalQuestions - answeredCount > 0 ? '#C62828' : 'inherit' }}>{totalQuestions - answeredCount}</strong> 題未作答。
                {Object.values(session.markedForReview).filter(Boolean).length > 0 && (
                  <span style={{ display: 'block', marginTop: '6px', color: '#E65100' }}>
                    提示：您尚有 {Object.values(session.markedForReview).filter(Boolean).length} 題標記待複查。
                  </span>
                )}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowConfirmModal(false)}
                >
                  繼續作答
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSubmitExam}
                >
                  確認結算成績
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
