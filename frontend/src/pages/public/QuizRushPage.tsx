import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  RotateCcw,
  CheckCircle2,
  Star,
  Trophy,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Timer,
  Flame,
  BookOpen,
  HelpCircle,
  Play,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  TheoryQuestionModel,
} from '../../data/questionBankAdapter';
import {
  QuizRushMode,
  SectionFilter,
  QuestionAnswerRecord,
  drawQuizQuestions,
  calculateQuestionPoints,
  calculateRoundStars,
  WORK_SECTION_NAMES,
} from '../../utils/quizRushEngine';
import {
  getUserGameRecord,
  saveLevelCompletion,
  markGameSessionSettled,
  UserGameRecord,
} from '../../utils/gameStorage';
import {
  recordWrongAttempt,
  recordCorrectAttempt,
} from '../../utils/wrongQuestionsStorage';
import { GameBriefingModal } from '../../components/GameBriefingModal';
import { GAME_BRIEFING_CONFIGS } from '../../data/gameBriefingConfigs';

interface QuizRushPageProps {
  onOpenTeacherApply?: () => void;
}

export const QuizRushPage: React.FC<QuizRushPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard, goToLearningProgress } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [gameRecord, setGameRecord] = useState<UserGameRecord>(() =>
    getUserGameRecord(userId, 'quiz-rush')
  );

  // Round Configuration State
  const [selectedMode, setSelectedMode] = useState<QuizRushMode>('timed-blitz');
  const [selectedSection, setSelectedSection] = useState<SectionFilter>('all');
  const [selectedCount, setSelectedCount] = useState<number>(10);

  // Game Status: 'config' | 'playing' | 'summary'
  const [gameState, setGameState] = useState<'config' | 'playing' | 'summary'>('config');
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);

  // Active Round State
  const [roundQuestions, setRoundQuestions] = useState<TheoryQuestionModel[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [answersLog, setAnswersLog] = useState<QuestionAnswerRecord[]>([]);

  // Current Question Answering State
  const [selectedChoice, setSelectedChoice] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15);

  // Timer reference & Wall-clock target
  const timerEndTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<any>(null);

  // Idempotent processed question tracking for this round
  const processedQuestionsRef = useRef<Set<string>>(new Set());
  const roundSessionIdRef = useRef<string>('');
  const isRoundSettledRef = useRef<boolean>(false);

  // Sync storage on user switch
  useEffect(() => {
    setGameRecord(getUserGameRecord(userId, 'quiz-rush'));
  }, [userId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const getSecondsForMode = (mode: QuizRushMode): number => {
    if (mode === 'timed-blitz') return 15;
    if (mode === 'combo-challenge') return 20;
    return 0; // Untimed
  };

  // Start Countdown Timer using reliable wall-clock difference
  const startTimer = (seconds: number) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (seconds <= 0) return;

    setRemainingSeconds(seconds);
    timerEndTimeRef.current = Date.now() + seconds * 1000;

    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, Math.ceil((timerEndTimeRef.current - now) / 1000));
      setRemainingSeconds(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(timerIntervalRef.current);
        handleTimeout();
      }
    }, 250);
  };

  const handleStartRound = () => {
    const questions = drawQuizQuestions(selectedSection, selectedCount);
    if (questions.length === 0) return;

    setRoundQuestions(questions);
    setCurrentQuestionIndex(0);
    setCurrentScore(0);
    setCurrentCombo(0);
    setMaxCombo(0);
    setAnswersLog([]);
    setSelectedChoice(null);
    setIsAnswerRevealed(false);
    processedQuestionsRef.current = new Set();

    setGameState('playing');
    roundSessionIdRef.current = `quiz-round-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    isRoundSettledRef.current = false;

    const sec = getSecondsForMode(selectedMode);
    startTimer(sec);
  };

  // Timeout Handler
  const handleTimeout = () => {
    if (isAnswerRevealed) return;
    processAnswer('TIMEOUT', false, 0);
  };

  // User Choice Handler
  const handleSelectChoice = (choice: 'A' | 'B' | 'C' | 'D') => {
    if (isAnswerRevealed) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    const q = roundQuestions[currentQuestionIndex];
    const isCorrect = choice === q.correctAnswer;
    setSelectedChoice(choice);

    const timeSpent = getSecondsForMode(selectedMode) > 0
      ? Math.max(1, getSecondsForMode(selectedMode) - remainingSeconds)
      : 0;

    processAnswer(choice, isCorrect, timeSpent);
  };

  const processAnswer = (
    choice: 'A' | 'B' | 'C' | 'D' | 'TIMEOUT',
    isCorrect: boolean,
    timeSpent: number
  ) => {
    const q = roundQuestions[currentQuestionIndex];
    if (!q) return;

    setIsAnswerRevealed(true);

    // Sync to wrong questions storage (Idempotent per round)
    if (!processedQuestionsRef.current.has(q.id)) {
      processedQuestionsRef.current.add(q.id);

      const optionsDict = {
        A: q.options[0]?.text || '',
        B: q.options[1]?.text || '',
        C: q.options[2]?.text || '',
        D: q.options[3]?.text || '',
      };

      if (!isCorrect) {
        recordWrongAttempt(userId, {
          questionId: q.id,
          certificationId: 'web-design-c',
          officialSection: q.officialSection,
          officialNumber: q.officialNumber,
          officialPage: q.officialPage,
          topic: q.sectionName,
          question: q.question,
          options: optionsDict,
          userSelectedAnswer: choice === 'TIMEOUT' ? '超時未作答' : choice,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          source: 'theory_practice',
        });
      } else {
        // If correct, increase mastery on previously failed questions
        recordCorrectAttempt(userId, q.id);
      }
    }

    // Update Combo & Score
    let nextCombo = isCorrect ? currentCombo + 1 : 0;
    setCurrentCombo(nextCombo);
    if (nextCombo > maxCombo) {
      setMaxCombo(nextCombo);
    }

    const points = calculateQuestionPoints(isCorrect, nextCombo, selectedMode);
    setCurrentScore((prev) => prev + points);

    // Record answer log
    const answerRecord: QuestionAnswerRecord = {
      question: q,
      userAnswer: choice,
      isCorrect,
      timeSpentSeconds: timeSpent,
      pointsEarned: points,
      comboAtAnswer: nextCombo,
    };

    setAnswersLog((prev) => [...prev, answerRecord]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < roundQuestions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedChoice(null);
      setIsAnswerRevealed(false);

      const sec = getSecondsForMode(selectedMode);
      startTimer(sec);
    } else {
      // Round Complete
      finishRound();
    }
  };

  const finishRound = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (isRoundSettledRef.current) return;
    isRoundSettledRef.current = true;

    const total = roundQuestions.length;
    const correct = answersLog.filter((a) => a.isCorrect).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const stars = calculateRoundStars(accuracy);

    // Map level ID for game storage:
    // Level 1: Timed 10Q, Level 2: Timed 20Q, Level 3: Combo, Level 4: Category
    let levelId = 1;
    if (selectedMode === 'timed-blitz') {
      levelId = selectedCount >= 20 ? 2 : 1;
    } else if (selectedMode === 'combo-challenge') {
      levelId = 3;
    } else {
      levelId = 4;
    }

    if (roundSessionIdRef.current) {
      markGameSessionSettled(userId, roundSessionIdRef.current);
    }

    const updatedRecord = saveLevelCompletion(
      userId,
      'quiz-rush',
      levelId,
      stars,
      currentScore,
      0, // hints not used
      0
    );
    setGameRecord(updatedRecord);

    setGameState('summary');
  };

  const q = roundQuestions[currentQuestionIndex];
  const correctCount = answersLog.filter((a) => a.isCorrect).length;
  const accuracyPercent = roundQuestions.length > 0
    ? Math.round((correctCount / roundQuestions.length) * 100)
    : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '12px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#student" onClick={(e) => { e.preventDefault(); goToStudentDashboard(); }}>學生中心</a>
              <span>/</span>
              <a href="#games" onClick={(e) => { e.preventDefault(); window.location.hash = '#games'; }}>遊戲中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Quiz Rush (證照疾速快答)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <Zap size={28} color="#D97706" />
                  <h1 style={{ fontSize: '26px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Quiz Rush｜證照疾速快答
                  </h1>
                  <span className="badge badge-gold">P14-GAM-007</span>
                  <button
                    onClick={() => setIsBriefingOpen(true)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#FEF3C7',
                      border: '1px solid #FCD34D',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#92400E',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <HelpCircle size={14} />
                    <span>玩法與計分說明</span>
                  </button>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  全量 605 題官方有效題庫高壓實力試煉！連鎖 Combo 加分，錯題無縫同步錯題本。
                </p>
              </div>

              {/* Progress Summary Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} color="var(--color-brand-gold)" fill="var(--color-brand-gold)" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {gameRecord.totalStars} 顆星
                  </span>
                </div>
                <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-default)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={18} color="#D97706" />
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>
                    {gameRecord.totalScore} 分
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container" style={{ marginTop: '24px' }}>
          {/* SCREEN 1: Round Configuration Setup */}
          {gameState === 'config' && (
            <div
              style={{
                maxWidth: '760px',
                margin: '0 auto',
                backgroundColor: 'var(--surface-sunken)',
                padding: '32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Sparkles size={24} color="#D97706" />
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
                  設定您的快答挑戰回合
                </h2>
              </div>

              {/* Step 1: Game Mode Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  1. 選擇遊戲模式：
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  {[
                    {
                      id: 'timed-blitz',
                      title: '模式 A：限時快答',
                      desc: '每題限時 15 秒倒數，高壓訓練考場瞬時反應力。',
                      icon: <Timer size={20} color="#D97706" />,
                    },
                    {
                      id: 'combo-challenge',
                      title: '模式 B：連擊挑戰',
                      desc: '連續答對累積 Combo 加分 (+15~60分)，答錯中斷。',
                      icon: <Flame size={20} color="#EA580C" />,
                    },
                    {
                      id: 'category-mastery',
                      title: '模式 C：分類精熟',
                      desc: '無時間限制，專注於特定工作項目的深度理解與複習。',
                      icon: <BookOpen size={20} color="#2563EB" />,
                    },
                  ].map((m) => {
                    const isSelected = selectedMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMode(m.id as QuizRushMode)}
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid #D97706' : '1px solid var(--border-default)',
                          backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.08)' : 'var(--surface-base)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '14px', color: isSelected ? '#D97706' : 'var(--text-primary)' }}>
                          {m.icon}
                          <span>{m.title}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {m.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Work Section Category Selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  2. 選擇題庫工作項目：
                </label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value as SectionFilter)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-base)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">{WORK_SECTION_NAMES.all}</option>
                  <option value="01">{WORK_SECTION_NAMES['01']}</option>
                  <option value="02">{WORK_SECTION_NAMES['02']}</option>
                  <option value="03">{WORK_SECTION_NAMES['03']}</option>
                  <option value="04">{WORK_SECTION_NAMES['04']}</option>
                </select>
              </div>

              {/* Step 3: Question Count Selection */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  3. 選擇回合題數：
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[10, 20, 30].map((cnt) => {
                    const isSelected = selectedCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setSelectedCount(cnt)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '2px solid #D97706' : '1px solid var(--border-default)',
                          backgroundColor: isSelected ? 'rgba(217, 119, 6, 0.08)' : 'var(--surface-base)',
                          color: isSelected ? '#D97706' : 'var(--text-primary)',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        {cnt} 題 ({cnt === 10 ? '熱身' : cnt === 20 ? '標準' : '挑戰'})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartRound}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  backgroundColor: '#D97706',
                  borderColor: '#D97706',
                }}
              >
                <Play size={20} />
                <span>開始疾速快答！</span>
              </button>
            </div>
          )}

          {/* SCREEN 2: Active Round Playing Screen */}
          {gameState === 'playing' && q && (
            <div style={{ maxWidth: '840px', margin: '0 auto' }}>
              {/* HUD Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '14px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '13px' }}>
                    題號 {currentQuestionIndex + 1} / {roundQuestions.length}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    (官方題號 #{q.officialNumber})
                  </span>
                </div>

                {/* Combo & Score */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {currentCombo > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#FFEDD5',
                        border: '1px solid #FDBA74',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        color: '#C2410C',
                        fontWeight: 800,
                        fontSize: '13px',
                      }}
                    >
                      <Flame size={16} color="#EA580C" />
                      <span>{currentCombo} 連擊 Combo!</span>
                    </div>
                  )}

                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    得分：<span style={{ color: '#D97706' }}>{currentScore}</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                {selectedMode !== 'category-mastery' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: remainingSeconds <= 5 ? '#FEE2E2' : 'var(--surface-base)',
                      border: `1px solid ${remainingSeconds <= 5 ? '#F87171' : 'var(--border-default)'}`,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      color: remainingSeconds <= 5 ? '#B91C1C' : 'var(--text-primary)',
                      fontWeight: 800,
                      fontSize: '14px',
                    }}
                  >
                    <Timer size={18} color={remainingSeconds <= 5 ? '#B91C1C' : '#D97706'} />
                    <span>{remainingSeconds}s</span>
                  </div>
                )}
              </div>

              {/* Question Card */}
              <div
                style={{
                  backgroundColor: 'var(--surface-sunken)',
                  padding: '28px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-neutral">{q.sectionName}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    官方試題本第 {q.officialPage} 頁
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                    margin: '0 0 24px 0',
                  }}
                >
                  {q.question}
                </h3>

                {/* 4 Options Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {q.options.map((opt) => {
                    const isSelected = selectedChoice === opt.key;
                    const isCorrectAnswer = opt.key === q.correctAnswer;

                    let btnBg = 'var(--surface-base)';
                    let btnBorder = 'var(--border-default)';
                    let btnColor = 'var(--text-primary)';

                    if (isAnswerRevealed) {
                      if (isCorrectAnswer) {
                        btnBg = '#ECFDF5';
                        btnBorder = '#10B981';
                        btnColor = '#065F46';
                      } else if (isSelected) {
                        btnBg = '#FFF1F2';
                        btnBorder = '#F43F5E';
                        btnColor = '#9F1239';
                      }
                    } else if (isSelected) {
                      btnBorder = '#D97706';
                      btnBg = 'rgba(217, 119, 6, 0.08)';
                    }

                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleSelectChoice(opt.key)}
                        disabled={isAnswerRevealed}
                        style={{
                          padding: '14px 18px',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${btnBorder}`,
                          backgroundColor: btnBg,
                          color: btnColor,
                          cursor: isAnswerRevealed ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          fontSize: '14.5px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: isAnswerRevealed && isCorrectAnswer ? '#10B981' : 'var(--surface-sunken)',
                            color: isAnswerRevealed && isCorrectAnswer ? '#FFFFFF' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '13px',
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {opt.key}
                        </span>
                        <span style={{ flex: 1, lineHeight: 1.4 }}>{opt.text}</span>
                        {isAnswerRevealed && isCorrectAnswer && (
                          <CheckCircle2 size={20} color="#10B981" style={{ flexShrink: 0 }} />
                        )}
                        {isAnswerRevealed && isSelected && !isCorrectAnswer && (
                          <AlertCircle size={20} color="#F43F5E" style={{ flexShrink: 0 }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback and Explanation Drawer (Revealed after answering) */}
              {isAnswerRevealed && (
                <div
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    marginBottom: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    {selectedChoice === q.correctAnswer ? (
                      <>
                        <CheckCircle2 size={24} color="#10B981" />
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#065F46' }}>
                          回答正確！+
                          {calculateQuestionPoints(true, currentCombo, selectedMode)} 分
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={24} color="#E11D48" />
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#9F1239' }}>
                          {selectedChoice === null || selectedChoice === undefined
                            ? '超時未作答！'
                            : '回答錯誤！'} 正確解答為 ({q.correctAnswer})
                        </span>
                      </>
                    )}
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 18px 0' }}>
                    {q.explanation}
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNextQuestion}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 28px',
                      fontSize: '15px',
                      backgroundColor: '#D97706',
                      borderColor: '#D97706',
                    }}
                  >
                    <span>
                      {currentQuestionIndex < roundQuestions.length - 1 ? '進入下一題' : '查看回合總結算'}
                    </span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCREEN 3: Round Summary Report */}
          {gameState === 'summary' && (
            <div
              style={{
                maxWidth: '760px',
                margin: '0 auto',
                backgroundColor: 'var(--surface-sunken)',
                padding: '32px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ fontSize: '36px', color: 'var(--color-brand-gold)', marginBottom: '8px' }}>
                  {'★'.repeat(calculateRoundStars(accuracyPercent))}
                  {'☆'.repeat(3 - calculateRoundStars(accuracyPercent))}
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {accuracyPercent >= 90
                    ? '太不可思議了！疾速快答大師！'
                    : accuracyPercent >= 70
                    ? '表現優秀！成績達合格標準！'
                    : '順利完賽！再接再厲突破極限！'}
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  本回合測驗已順利結算，成績與星星已保存至您的學習紀錄。
                </p>
              </div>

              {/* Round Stats Metric Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                  marginBottom: '28px',
                }}
              >
                <div style={{ backgroundColor: 'var(--surface-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>本局得分</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#D97706' }}>{currentScore}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    歷史最佳：{gameRecord.totalScore} 分
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>正確率</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: accuracyPercent >= 70 ? '#10B981' : '#E11D48' }}>
                    {accuracyPercent}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    累積星星：{gameRecord.totalStars} 顆
                  </div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>最高連擊</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#EA580C' }}>{maxCombo}</div>
                </div>
                <div style={{ backgroundColor: 'var(--surface-base)', padding: '16px', borderRadius: 'var(--radius-sm)', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>答對 / 總題數</div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {correctCount} / {roundQuestions.length}
                  </div>
                </div>
              </div>

              {/* Sync Notice Banner */}
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  marginBottom: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <BookOpen size={24} color="#10B981" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong>錯題本同步通知：</strong>已自動將本局作答錯誤或超時題目收錄至您的「本機錯題本」。答對之既有錯題亦已更新掌握度（連續答對 2 次可攻克標記）。
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartRound}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    backgroundColor: '#D97706',
                    borderColor: '#D97706',
                  }}
                >
                  <RotateCcw size={18} />
                  <span>再玩一局</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={goToLearningProgress}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  <BookOpen size={18} />
                  <span>前往錯題本複習</span>
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => { window.location.hash = '#games'; }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                >
                  <span>返回遊戲中心</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <GameBriefingModal
        isOpen={isBriefingOpen}
        onClose={() => setIsBriefingOpen(false)}
        config={GAME_BRIEFING_CONFIGS['quiz-rush']}
      />

      <Footer />
    </div>
  );
};
