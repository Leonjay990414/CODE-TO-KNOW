import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Clock,
  BookOpen,
  Award,
  CheckCircle2,
  Sparkles,
  BookmarkCheck,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StatCard } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  studentApi,
  wrongQuestionApi,
  StudentProgressAnalyticsResponse,
  WrongQuestionRecordItem,
  isDemoMode,
} from '../../services/api';
import {
  getWrongQuestionsStats,
  getWrongQuestionsList,
  WrongQuestionItem as LocalWrongQuestionItem,
} from '../../utils/wrongQuestionsStorage';

interface LearningProgressPageProps {
  onOpenTeacherApply?: () => void;
}

export const LearningProgressPage: React.FC<LearningProgressPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToStudentDashboard, goToCertifications, goToTheoryPractice, goToMockExam } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const isGuestOrDemo = !user || user.id === 'demo-student' || isDemoMode;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudentProgressAnalyticsResponse | null>(null);

  // Wrong questions state
  const [backendWrongItems, setBackendWrongItems] = useState<WrongQuestionRecordItem[]>([]);
  const [localWrongStats, setLocalWrongStats] = useState(() => getWrongQuestionsStats(userId));
  const [localUnresolved, setLocalUnresolved] = useState<LocalWrongQuestionItem[]>(() =>
    getWrongQuestionsList(userId, true)
  );

  // Review modal state for in-place quick practice
  const [activeReviewItem, setActiveReviewItem] = useState<WrongQuestionRecordItem | null>(null);
  const [reviewAnswer, setReviewAnswer] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewResult, setReviewResult] = useState<{
    isCorrect: boolean;
    explanation: string;
    masteryStatus: string;
    consecutiveCorrectCount: number;
  } | null>(null);

  const fetchProgressData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // If guest or demo mode, provide standard sample baseline
    if (isGuestOrDemo) {
      setLocalWrongStats(getWrongQuestionsStats(userId));
      setLocalUnresolved(getWrongQuestionsList(userId, true));
      setLoading(false);
      return;
    }

    try {
      const [analyticsRes, wrongRes] = await Promise.all([
        studentApi.getProgressAnalytics(),
        wrongQuestionApi.getWrongQuestions({ status: 'UNRESOLVED', limit: 5 }),
      ]);

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      } else {
        throw new Error(analyticsRes.error?.message || '無法載入學習數據');
      }

      if (wrongRes.success && wrongRes.data) {
        setBackendWrongItems(wrongRes.data.items);
      }
    } catch (err: any) {
      console.error('載入學習歷程數據失敗：', err);
      setError(err?.message || '伺服器連線異常，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [isGuestOrDemo, userId]);

  useEffect(() => {
    void fetchProgressData();
  }, [fetchProgressData]);

  // Handle wrong question quick review submission
  const handleReviewSubmit = async () => {
    if (!activeReviewItem || !reviewAnswer) return;
    setReviewSubmitting(true);

    try {
      const res = await wrongQuestionApi.practiceReview(activeReviewItem.id, reviewAnswer);
      if (res.success && res.data) {
        setReviewResult({
          isCorrect: res.data.isCorrect,
          explanation: res.data.explanation,
          masteryStatus: res.data.masteryStatus,
          consecutiveCorrectCount: res.data.consecutiveCorrectCount,
        });

        // If mastered, remove from unresolved list
        if (res.data.isResolved) {
          setBackendWrongItems((prev) => prev.filter((it) => it.id !== activeReviewItem.id));
        }
      }
    } catch (err: any) {
      alert(err?.message || '作答失敗，請重試');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const closeReviewModal = () => {
    setActiveReviewItem(null);
    setReviewAnswer('');
    setReviewResult(null);
    void fetchProgressData();
  };

  // Aggregated display numbers
  const totalStudyHours = analytics
    ? analytics.overview.totalStudyHours
    : isGuestOrDemo
      ? 0
      : 0;

  const weeklyStudyHours = analytics
    ? analytics.overview.weeklyStudyHours
    : isGuestOrDemo
      ? 0
      : 0;

  const totalAttempted = analytics
    ? analytics.overview.totalAttempted
    : 0;

  const totalOfficialQuestions = analytics
    ? analytics.overview.totalOfficialQuestions
    : 605;

  const completionRate = analytics
    ? analytics.overview.completionRate
    : 0;

  const highestExamScore = analytics?.overview.highestExamScore ?? null;
  const practicalTasksVA = analytics?.overview.practicalTasksCompletedVA ?? 0;

  const wrongCountUnresolved = analytics
    ? analytics.wrongStats.unresolved
    : localWrongStats.unresolvedCount;

  const wrongCountTotal = analytics
    ? analytics.wrongStats.total
    : localWrongStats.totalRecorded;

  const wrongCountMastered = analytics
    ? analytics.wrongStats.mastered
    : localWrongStats.resolvedCount;

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
              <a href="#student" onClick={(e) => { e.preventDefault(); goToStudentDashboard(); }}>學生中心</a>
              <span>/</span>
              <a href="#certifications" onClick={(e) => { e.preventDefault(); goToCertifications(); }}>證照中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>個人學習歷程與數據儀表板</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-gold">官方 17300 網頁設計丙級</span>
                  <span className="badge badge-neutral">艾賓浩斯遺忘曲線 · 伺服器動態核算</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  個人學習歷程與真實數據中心
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={fetchProgressData}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>整理數據</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={goToStudentDashboard}
                >
                  返回學生中心
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => goToMockExam('web-design-c')}
                >
                  前往模考驗收
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Mode Notice Banner (Only shown in demo mode or when unauthenticated) */}
        {isGuestOrDemo && (
          <div className="container" style={{ marginTop: '20px' }}>
            <div className="demo-banner">
              <Sparkles size={16} />
              <span>
                <strong>示範訪客模式：</strong>目前您尚未登入或處於示範環境。請登入您的正式學員帳號，系統將即時同步您在 PostgreSQL 雲端資料庫的真實研讀時長、四大工作項目刷題紀錄與個人錯題本。
              </span>
            </div>
          </div>
        )}

        {/* Error Alert with Retry */}
        {error && (
          <div className="container" style={{ marginTop: '20px' }}>
            <div
              style={{
                backgroundColor: 'rgba(198, 40, 40, 0.08)',
                border: '1px solid rgba(198, 40, 40, 0.3)',
                padding: '16px 20px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#C62828',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={fetchProgressData}
                style={{ borderColor: '#C62828', color: '#C62828' }}
              >
                重試
              </button>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="container" style={{ marginTop: '30px', textAlign: 'center', padding: '60px 0' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 16px', color: 'var(--color-brand-deep-slate)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>正在自資料庫同步最新學習數據與考題分析...</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Overview Stat Cards */}
            <div className="container" style={{ marginTop: '24px' }}>
              <div className="stats-row">
                <StatCard
                  label="累計研讀時數"
                  value={totalStudyHours.toFixed(1)}
                  unit="小時"
                  icon={Clock}
                  iconColor="var(--color-brand-deep-slate)"
                  trendText={`近 7 天累計 ${weeklyStudyHours.toFixed(1)} 小時`}
                  trendType="positive"
                />

                <StatCard
                  label="官方學科完成率"
                  value={`${completionRate}%`}
                  unit={`/ ${totalOfficialQuestions} 題`}
                  icon={BookOpen}
                  iconColor="var(--color-brand-gold)"
                  subText={`已練習 ${totalAttempted} 題 (${totalOfficialQuestions - totalAttempted} 題待練習)`}
                />

                <StatCard
                  label="模擬考最高成績"
                  value={highestExamScore !== null ? String(highestExamScore) : '--'}
                  unit={highestExamScore !== null ? '分' : '無紀錄'}
                  icon={Award}
                  iconColor={highestExamScore !== null && highestExamScore >= 60 ? '#2E7D32' : 'var(--color-brand-deep-slate)'}
                  trendText={
                    highestExamScore !== null
                      ? highestExamScore >= 60
                        ? '達及格標準 60 分（安全達標）'
                        : '尚未達 60 分及格標準，請持續衝刺'
                      : '尚未參加模擬考'
                  }
                  trendType={highestExamScore !== null && highestExamScore >= 60 ? 'positive' : 'neutral'}
                />

                <StatCard
                  label="術科題組完成度"
                  value={String(practicalTasksVA)}
                  unit="/ 5 題組"
                  icon={CheckCircle2}
                  iconColor="var(--color-brand-gold)"
                  subText="涵蓋官方題組一至五實作驗證"
                />
              </div>

              {/* Chapter Mastery Breakdown & Review Recommendations */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }} className="progress-dual-grid">
                {/* Left: Chapter Mastery Progress Bars */}
                <div className="card" style={{ padding: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={18} color="var(--color-brand-deep-slate)" />
                      <span>官方四大工作項目掌握度分析 (真實數據)</span>
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      共 605 題官方全量考題
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                    {analytics?.subjects.map((sub) => {
                      const pct = Math.min(100, Math.max(0, sub.masteryRate));
                      let barColor = 'var(--color-brand-deep-slate)';
                      let statusText = '未開始';

                      if (sub.status === 'MASTERED' || pct >= 80) {
                        barColor = '#2E7D32';
                        statusText = '熟練掌握';
                      } else if (sub.status === 'IN_PROGRESS' && pct >= 50) {
                        barColor = 'var(--color-brand-gold)';
                        statusText = '良好進展';
                      } else if (sub.status === 'IN_PROGRESS') {
                        barColor = '#E65100';
                        statusText = '需加強練習';
                      }

                      return (
                        <div key={sub.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>
                              {sub.title} ({sub.completedQuestions}/{sub.totalQuestions} 題)
                            </span>
                            <span style={{ fontWeight: 700, color: barColor }}>
                              {pct.toFixed(1)}% ({statusText})
                            </span>
                          </div>
                          <div className="progress-track" style={{ height: '8px', backgroundColor: 'var(--surface-sunken)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: barColor,
                                height: '100%',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}

                    {(!analytics?.subjects || analytics.subjects.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                        暫無考科進度紀錄，請前往學科刷題開始練習！
                      </div>
                    )}
                  </div>

                  {/* Recommendation Action Bar */}
                  {analytics?.recommendedFocus && (
                    <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        系統建議強化：<strong>{analytics.recommendedFocus.subjectTitle}</strong>（{analytics.recommendedFocus.reason}）
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => goToTheoryPractice('web-design-c')}
                      >
                        立即前往練習
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Spaced Repetition & Real Wrong Questions Notebook */}
                <aside>
                  {/* Spaced Repetition Card */}
                  <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--color-brand-gold)" />
                      <span>艾賓浩斯遺忘曲線 · 今日複習推播</span>
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                      根據您在練習中答錯的題目動態推算，當前有 <strong>{wrongCountUnresolved} 題</strong> 待攻克。連續 2 次在複習中答對即可升級為「已掌握」。
                    </p>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => goToTheoryPractice('web-design-c')}
                      style={{ width: '100%' }}
                    >
                      開始複習錯題 ({wrongCountUnresolved} 題)
                    </button>
                  </div>

                  {/* Real Server Wrong Questions Notebook */}
                  <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <BookmarkCheck size={16} color="var(--color-brand-deep-slate)" />
                        <span>個人錯題本 ({wrongCountUnresolved} 題待攻克)</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => goToTheoryPractice('web-design-c')}
                        style={{ fontSize: '13px', color: 'var(--color-brand-gold-text)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, minHeight: '44px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center' }}
                      >
                        進入錯題庫 →
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-sunken)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>累計收錄</div>
                        <div style={{ fontSize: '18px', fontWeight: 700 }}>{wrongCountTotal} 題</div>
                      </div>
                      <div style={{ flex: 1, padding: '10px', backgroundColor: 'var(--surface-sunken)', borderRadius: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', color: '#2E7D32' }}>已成功攻克</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#2E7D32' }}>{wrongCountMastered} 題</div>
                      </div>
                    </div>

                    {/* Unresolved wrong questions list */}
                    {backendWrongItems.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {backendWrongItems.map((item) => (
                          <div
                            key={item.id}
                            style={{
                              background: 'var(--surface-sunken)',
                              padding: '12px',
                              borderRadius: '6px',
                              fontSize: '13px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: 'var(--text-primary)',
                                  marginBottom: '3px',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {item.officialNumber ? `第 ${item.officialNumber} 題：` : ''}
                                {item.questionText}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                <span>{item.sectionTitle}</span>
                                <span style={{ color: '#C62828' }}>錯誤 {item.wrongCount || 1} 次</span>
                                {item.consecutiveCorrectCount > 0 && (
                                  <span style={{ color: '#2E7D32' }}>連續答對 {item.consecutiveCorrectCount} 次</span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={() => {
                                setActiveReviewItem(item);
                                setReviewAnswer('');
                                setReviewResult(null);
                              }}
                              style={{ whiteSpace: 'nowrap', padding: '4px 8px', fontSize: '12px' }}
                            >
                              複習此題
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : localUnresolved.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {localUnresolved.slice(0, 3).map((item) => (
                          <div key={item.questionId} style={{ background: 'var(--surface-sunken)', padding: '10px 12px', borderRadius: '4px', fontSize: '12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.question}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '11px' }}>
                              <span>{item.topic}</span>
                              <span style={{ color: '#C62828' }}>錯誤 {item.wrongCount} 次</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                        <CheckCircle size={28} color="#2E7D32" style={{ margin: '0 auto 8px', display: 'block' }} />
                        目前無待攻克錯題，太棒了！
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </>
        )}

        {/* Quick Review Modal */}
        {activeReviewItem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={closeReviewModal}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={20} />
              </button>

              <div style={{ marginBottom: '16px' }}>
                <span className="badge badge-gold" style={{ marginRight: '8px' }}>
                  {activeReviewItem.sectionTitle}
                </span>
                <span className="badge badge-neutral">
                  錯誤累計：{activeReviewItem.wrongCount} 次
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', lineHeight: 1.6 }}>
                {activeReviewItem.officialNumber ? `第 ${activeReviewItem.officialNumber} 題：` : ''}
                {activeReviewItem.questionText}
              </h3>

              {activeReviewItem.codeSnippet && (
                <pre
                  style={{
                    backgroundColor: 'var(--surface-sunken)',
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    marginBottom: '16px',
                    overflowX: 'auto',
                  }}
                >
                  <code>{activeReviewItem.codeSnippet}</code>
                </pre>
              )}

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {activeReviewItem.options.map((opt) => {
                  const isSelected = reviewAnswer === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={reviewResult !== null}
                      onClick={() => setReviewAnswer(opt.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'rgba(189, 167, 126, 0.1)' : 'var(--surface-base)',
                        cursor: reviewResult !== null ? 'default' : 'pointer',
                        textAlign: 'left',
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--color-brand-gold)' : 'var(--surface-sunken)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                          fontSize: '12px',
                        }}
                      >
                        {opt.key}
                      </span>
                      <span style={{ flex: 1 }}>{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Review Result Feedback */}
              {reviewResult && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    backgroundColor: reviewResult.isCorrect ? 'rgba(46, 125, 50, 0.08)' : 'rgba(198, 40, 40, 0.08)',
                    border: `1px solid ${reviewResult.isCorrect ? 'rgba(46, 125, 50, 0.3)' : 'rgba(198, 40, 40, 0.3)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    {reviewResult.isCorrect ? (
                      <CheckCircle2 size={18} color="#2E7D32" />
                    ) : (
                      <AlertCircle size={18} color="#C62828" />
                    )}
                    <span style={{ fontWeight: 700, color: reviewResult.isCorrect ? '#2E7D32' : '#C62828' }}>
                      {reviewResult.isCorrect ? '回答正確！' : '回答錯誤！'}
                    </span>
                    <span className="badge badge-neutral" style={{ marginLeft: 'auto' }}>
                      狀態：{reviewResult.masteryStatus === 'MASTERED' ? '已掌握 (攻克)' : reviewResult.masteryStatus === 'REVIEWING' ? '複習中 (1/2次)' : '待加強'}
                    </span>
                  </div>

                  {reviewResult.explanation && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      <strong>官方解析：</strong>{reviewResult.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {reviewResult === null ? (
                  <>
                    <button type="button" className="btn btn-outline btn-sm" onClick={closeReviewModal}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleReviewSubmit}
                      disabled={!reviewAnswer || reviewSubmitting}
                    >
                      {reviewSubmitting ? '核分中...' : '確認提交答案'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={closeReviewModal}>
                    完成並關閉
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
