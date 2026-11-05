import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { SAMPLE_THEORY_QUESTIONS, TheoryQuestion } from '../../data/theoryQuestionsData';

interface MockExamPageProps {
  onOpenTeacherApply?: () => void;
}

export const MockExamPage: React.FC<MockExamPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToTheoryPractice } = useNavigation();

  // Exam States
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600); // 60 mins
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Use the sample questions for the mock exam pool
  const examQuestions: TheoryQuestion[] = SAMPLE_THEORY_QUESTIONS;

  // Countdown timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (examStarted && !examSubmitted && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer!);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examStarted, examSubmitted, secondsRemaining]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    setExamStarted(true);
    setExamSubmitted(false);
    setSecondsRemaining(3600);
    setAnswers({});
    setActiveQuestionIdx(0);
  };

  const handleSelectOption = (qId: string, opt: 'A' | 'B' | 'C' | 'D') => {
    if (examSubmitted) return;
    setAnswers({ ...answers, [qId]: opt });
  };

  const handleSubmitExam = () => {
    setShowConfirmModal(false);
    setExamSubmitted(true);
  };

  // Score Calculation
  const totalQuestions = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  let correctCount = 0;
  examQuestions.forEach((q) => {
    if (answers[q.id] === q.correctAnswer) {
      correctCount += 1;
    }
  });

  const finalScore = Math.round((correctCount / totalQuestions) * 100);
  const isPassed = finalScore >= 60;
  const currentQ = examQuestions[activeQuestionIdx];

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>全真模擬考試 (17300 網頁設計丙級)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">全真模擬測驗</span>
                  <span className="badge badge-neutral">考場限時 60 分鐘 · 及格標準 60 分</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  17300 網頁設計丙級 · 學科模擬測驗
                </h1>
              </div>

              {examStarted && !examSubmitted && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: secondsRemaining < 300 ? 'rgba(198, 40, 40, 0.1)' : 'var(--surface-sunken)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: secondsRemaining < 300 ? '1px solid #C62828' : '1px solid var(--border-subtle)',
                      fontWeight: 700,
                      color: secondsRemaining < 300 ? '#C62828' : 'var(--color-brand-deep-slate)',
                    }}
                  >
                    <Clock size={16} />
                    <span>剩餘時間：{formatTime(secondsRemaining)}</span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <FileCheck size={15} />
                    <span>交卷結算</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Demo Mode Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>示範考場環境：</strong>正式檢定學科考題為隨機抽測 80 題單選題。本示範考場提供高擬真計時、答題卡跳轉與即時成績分析演示。
            </span>
          </div>
        </div>

        {/* Pre-Exam Welcome Screen */}
        {!examStarted && !examSubmitted && (
          <div className="container" style={{ marginTop: '32px' }}>
            <div className="card" style={{ maxWidth: '680px', margin: '0 auto', padding: '40px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--surface-sunken)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px auto',
                  color: 'var(--color-brand-deep-slate)',
                }}
              >
                <Award size={32} />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                準備好開始學科模擬測驗了嗎？
              </h2>

              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
                本測驗完全模擬國家技術士檢定考場規格。測驗時間共 <strong>60 分鐘</strong>，及格標準為 <strong>60 分（含）以上</strong>。測驗過程中不可跳轉外部搜尋解答，交卷後將立即呈現落點分析與錯題詳細解析。
              </p>

              <div style={{ background: 'var(--surface-sunken)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '32px', textAlign: 'left', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                <strong>✦ 應試須知：</strong><br />
                1. 每題均為單選題，請選出最符合 W3C 或官方規章之單一解答。<br />
                2. 您可透過右側題目導覽卡隨時往返檢查未作答題目。<br />
                3. 時間倒數結束時系統將自動收卷結算。
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleStartExam}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <span>開始模擬考</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={() => goToTheoryPractice('web-design-c')}
                >
                  <BookOpen size={16} />
                  <span>先去章節刷題練習</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Exam In-Progress Screen */}
        {examStarted && !examSubmitted && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '24px', alignItems: 'start' }} className="exam-grid">
              {/* Left Column: Current Question */}
              <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="badge badge-slate" style={{ fontSize: '12px' }}>
                    第 {activeQuestionIdx + 1} 題 / 共 {totalQuestions} 題
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {currentQ.chapterName}
                  </span>
                </div>

                <h3 style={{ fontSize: '18px', lineHeight: 1.7, marginBottom: '20px', fontWeight: 600 }}>
                  {currentQ.question}
                </h3>

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

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {currentQ.options.map((opt) => {
                    const isSelected = answers[currentQ.id] === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectOption(currentQ.id, opt.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          padding: '14px 18px',
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

                {/* Question Navigation Prev / Next */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={activeQuestionIdx === 0}
                    onClick={() => setActiveQuestionIdx(activeQuestionIdx - 1)}
                    style={{ opacity: activeQuestionIdx === 0 ? 0.4 : 1 }}
                  >
                    上一題
                  </button>

                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    已作答：{answeredCount} / {totalQuestions}
                  </span>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={activeQuestionIdx === totalQuestions - 1}
                    onClick={() => setActiveQuestionIdx(activeQuestionIdx + 1)}
                    style={{ opacity: activeQuestionIdx === totalQuestions - 1 ? 0.4 : 1 }}
                  >
                    下一題
                  </button>
                </div>
              </div>

              {/* Right Column: Question Navigator Jump Sheet */}
              <div className="card" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>
                  答題進度卡
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {examQuestions.map((q, idx) => {
                    const isAnswered = !!answers[q.id];
                    const isCurrent = idx === activeQuestionIdx;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setActiveQuestionIdx(idx)}
                        style={{
                          padding: '10px 0',
                          textAlign: 'center',
                          borderRadius: 'var(--radius-xs)',
                          border: isCurrent ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-subtle)',
                          backgroundColor: isAnswered ? 'var(--color-brand-deep-slate)' : 'var(--surface-sunken)',
                          color: isAnswered ? '#FFFFFF' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8, borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--color-brand-deep-slate)', borderRadius: '2px' }} />
                    <span>深色：已完成作答</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-subtle)', borderRadius: '2px' }} />
                    <span>淺色：尚未作答</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowConfirmModal(true)}
                  style={{ width: '100%', marginTop: '20px' }}
                >
                  確認送出交卷
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-Exam Scorecard Screen */}
        {examSubmitted && (
          <div className="container" style={{ marginTop: '24px' }}>
            <div className="card" style={{ padding: '36px', maxWidth: '800px', margin: '0 auto' }}>
              {/* Scorecard Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    backgroundColor: isPassed ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
                    color: isPassed ? '#2E7D32' : '#C62828',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px auto',
                  }}
                >
                  {isPassed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>
                  {isPassed ? '恭喜通過！達到國家丙級及格標準' : '本次測驗未達 60 分及格門檻，請再接再厲！'}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  勞動部 17300 網頁設計丙級學科全真模擬考成績單
                </p>
              </div>

              {/* Score Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>測驗總成績</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: isPassed ? '#2E7D32' : '#C62828' }}>
                    {finalScore} <span style={{ fontSize: '14px', fontWeight: 500 }}>分</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    及格門檻：60 分
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>答對題數</div>
                  <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-brand-deep-slate)' }}>
                    {correctCount} <span style={{ fontSize: '14px', fontWeight: 500 }}>/ {totalQuestions}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    作答率：{Math.round((answeredCount / totalQuestions) * 100)}%
                  </div>
                </div>

                <div style={{ background: 'var(--surface-sunken)', padding: '20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>花費時間</div>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-brand-charcoal)', marginTop: '4px' }}>
                    {formatTime(3600 - secondsRemaining)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    規定時限：60:00
                  </div>
                </div>
              </div>

              {/* Question By Question Review */}
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                題目作答複盤與解析
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
                {examQuestions.map((q, idx) => {
                  const userAnswer = answers[q.id];
                  const isQCorrect = userAnswer === q.correctAnswer;
                  return (
                    <div
                      key={q.id}
                      style={{
                        padding: '16px',
                        borderRadius: 'var(--radius-sm)',
                        border: isQCorrect ? '1px solid #D9E2EA' : '1px solid rgba(198, 40, 40, 0.4)',
                        backgroundColor: isQCorrect ? 'var(--surface-base)' : 'rgba(198, 40, 40, 0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>
                          第 {idx + 1} 題（#{q.officialNumber}）：{isQCorrect ? <span style={{ color: '#2E7D32' }}>✓ 答對</span> : <span style={{ color: '#C62828' }}>✗ 答錯</span>}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          您的選擇：<strong>{userAnswer || '未作答'}</strong> ｜ 標準答案：<strong style={{ color: '#2E7D32' }}>{q.correctAnswer}</strong>
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {q.question}
                      </p>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '4px' }}>
                        <strong>解析：</strong>{q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartExam}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={16} />
                  <span>重新測驗一次</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => goToTheoryPractice('web-design-c')}
                >
                  <BookOpen size={16} />
                  <span>返回學科章節複習</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation Modal */}
        {showConfirmModal && (
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
            <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
                確認送出交卷？
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                您已作答 <strong>{answeredCount}</strong> 題，尚有 <strong>{totalQuestions - answeredCount}</strong> 題未作答。交卷後將立即計算成績且無法返回修改。
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
                  確定交卷
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
