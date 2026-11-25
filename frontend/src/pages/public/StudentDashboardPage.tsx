import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Award,
  BookOpen,
  Code2,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Bell,
  Gamepad2,
  Users,
  Bookmark,
  Edit3,
  Database,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { StudentClassJoinModal, getEnrolledClasses, EnrolledClass } from '../../components/StudentClassJoinModal';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { studentApi, StudentDashboardResponse } from '../../services/api';
import { getWrongQuestionsStats } from '../../utils/wrongQuestionsStorage';
import { getMockExamHistory, MockExamSession } from '../../utils/mockExamStorage';
import { getPracticalProgress } from '../../utils/learningStorage';
import { getQuestionBookmarks, getAllQuestionNotes } from '../../utils/studentStudyToolsStorage';

interface StudentDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToTheoryPractice, goToStudentPractical, goToMockExam, goToLearningProgress, goToGameCenter } = useNavigation();

  const userId = user?.id || 'guest-anonymous';
  const [dashboardData, setDashboardData] = useState<StudentDashboardResponse | null>(null);

  const [wrongStats, setWrongStats] = useState(() => getWrongQuestionsStats(userId));
  const [mockExamHistory, setMockExamHistory] = useState<MockExamSession[]>(() => getMockExamHistory(userId));
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>(() => getEnrolledClasses(userId));
  const [bookmarksCount, setBookmarksCount] = useState<number>(() => getQuestionBookmarks(userId).size);
  const [notesCount, setNotesCount] = useState<number>(() => Object.keys(getAllQuestionNotes(userId)).length);
  const [isJoinClassOpen, setIsJoinClassOpen] = useState(false);

  // Fetch real database records from studentApi
  useEffect(() => {
    let isMounted = true;

    studentApi
      .getDashboard()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setDashboardData(res.data);
        } else {
          // Graceful fallback to local storage
          refreshLocalDashboardData();
        }
      })
      .catch(() => {
        if (!isMounted) return;
        refreshLocalDashboardData();
      });

    return () => {
      isMounted = false;
    };
  }, [userId, isJoinClassOpen]);

  const refreshLocalDashboardData = () => {
    setWrongStats(getWrongQuestionsStats(userId));
    setMockExamHistory(getMockExamHistory(userId));
    setEnrolledClasses(getEnrolledClasses(userId));
    setBookmarksCount(getQuestionBookmarks(userId).size);
    setNotesCount(Object.keys(getAllQuestionNotes(userId)).length);
  };

  // 計算已進行實作題組數量
  const practicalStartedCount = dashboardData
    ? dashboardData.overview.startedPracticalTasksCount
    : [1, 2, 3, 4, 5].filter((taskId) => {
        const pA = getPracticalProgress(userId, taskId, 'A');
        const pB = getPracticalProgress(userId, taskId, 'B');
        return (pA.completedSteps && pA.completedSteps.length > 0) || (pB.completedSteps && pB.completedSteps.length > 0);
      }).length;

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>學生中心 (Student Hub)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-deep-slate)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 700,
                  }}
                >
                  <UserIcon size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      {dashboardData ? dashboardData.student.displayName : user ? user.displayName : '學員示範帳號'}
                    </h1>
                    <span className="badge badge-gold">
                      {dashboardData?.student.roles.includes('TEACHER')
                        ? '認證教師'
                        : dashboardData?.student.roles.includes('ADMIN')
                        ? '平台管理員'
                        : '一般學員'}
                    </span>
                    {dashboardData ? (
                      <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Database size={12} />
                        <span>PostgreSQL 17 連線正常</span>
                      </span>
                    ) : (
                      <span className="badge badge-neutral">離線示範模式</span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    登入信箱：{dashboardData ? dashboardData.student.email : user ? user.email : 'student.demo@codetoknow.edu'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsJoinClassOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={14} />
                  <span>我的班級／加入班級</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={goToLearningProgress}
                >
                  檢視詳細學習數據
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Real Database Connection Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          {dashboardData ? (
            <div className="demo-banner" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
              <Database size={16} color="#15803D" />
              <span style={{ color: '#166534' }}>
                <strong>已連線 PostgreSQL 17 資料庫：</strong>目前呈現您個人的真實學習數據。模擬考 80 題歷程、錯題本掌握度及五大官方術科進度皆由後端伺服器安全持久化。
              </span>
            </div>
          ) : (
            <div className="demo-banner">
              <Sparkles size={16} />
              <span>
                <strong>學生中心示範模式：</strong>在此管理您目前準備中的技能檢定、各項作業評分與模擬考歷程。於登入後將自動同步您的個人專屬進度。
              </span>
            </div>
          )}
        </div>

        {/* Main Dashboard Grid */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }} className="student-grid">
            {/* Left Column: Current Target Cert & Actions */}
            <div>
              {/* Primary Target Certificate Card */}
              <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="badge badge-slate" style={{ fontSize: '11px', marginBottom: '6px' }}>目標檢定項目</span>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                      17300 網頁設計丙級技術士
                    </h2>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>距離正式檢定</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-gold-text)' }}>剩餘 28 天</div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>整體準備進度</span>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>
                      {dashboardData
                        ? `${Math.round(
                            ((dashboardData.overview.startedPracticalTasksCount / 5) * 50) +
                            (dashboardData.overview.totalExamsTaken > 0 ? 50 : 0)
                          )}%`
                        : '45%'}
                    </strong>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-bar"
                      style={{
                        width: dashboardData
                          ? `${Math.round(
                              ((dashboardData.overview.startedPracticalTasksCount / 5) * 50) +
                              (dashboardData.overview.totalExamsTaken > 0 ? 50 : 0)
                            )}%`
                          : '45%',
                      }}
                    />
                  </div>
                </div>

                {/* 4 Action Shortcuts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => goToTheoryPractice('web-design-c')}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <BookOpen size={20} color="var(--color-brand-deep-slate)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>繼續學科練習</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        已作答 275 / 605 題
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToStudentPractical(1, 'home')}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Code2 size={20} color="var(--color-brand-gold)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>術科題組實作</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        已演練 {practicalStartedCount} / 5 題組
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToMockExam('web-design-c')}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <FileCheck size={20} color="#2E7D32" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>參加全真模擬考</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {dashboardData && dashboardData.overview.totalExamsTaken > 0
                          ? `累計 ${dashboardData.overview.totalExamsTaken} 次測驗（最高 ${dashboardData.overview.highestScore ?? 0} 分）`
                          : '限時 60 分鐘驗收'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={goToLearningProgress}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Award size={20} color="var(--color-brand-deep-slate)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>錯題本與弱點複習</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        待複習 {dashboardData ? dashboardData.wrongStats.unresolved : wrongStats.unresolvedCount} 題 ｜ 已攻克 {dashboardData ? dashboardData.wrongStats.mastered : wrongStats.resolvedCount} 題
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToTheoryPractice('web-design-c')}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Bookmark size={20} color="var(--color-brand-gold)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>收藏題目與學習筆記</span>
                        <Edit3 size={12} color="var(--text-muted)" />
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        已收藏 {bookmarksCount} 題 ｜ 已記錄 {notesCount} 則筆記
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={goToGameCenter}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <Gamepad2 size={20} color="var(--color-brand-gold)" />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>互動遊戲與 Code Puzzle</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>寓教於樂邏輯挑戰</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mock Exam History Table */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                    近期全真模擬考成績紀錄
                  </h3>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => goToMockExam('web-design-c')}
                  >
                    參加模擬測驗
                  </button>
                </div>

                {/* Mock Exam History Rendering */}
                {(!dashboardData && mockExamHistory.length === 0) || (dashboardData && dashboardData.examHistory.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)' }}>
                    <FileCheck size={36} color="var(--color-brand-gold)" style={{ margin: '0 auto 10px', opacity: 0.7 }} />
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '6px' }}>
                      尚無全真模擬考成績紀錄
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '380px', margin: '0 auto 16px', lineHeight: 1.6 }}>
                      隨機抽取 80 題官方試題，60 分鐘真實倒數計時與及格判定，立即驗收您的學科實力！
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => goToMockExam('web-design-c')}
                    >
                      立即開始全真模擬測驗
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '10px 8px' }}>測驗日期</th>
                          <th style={{ padding: '10px 8px' }}>測驗科目</th>
                          <th style={{ padding: '10px 8px' }}>耗時</th>
                          <th style={{ padding: '10px 8px' }}>得分</th>
                          <th style={{ padding: '10px 8px' }}>判定結果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData
                          ? dashboardData.examHistory.slice(0, 5).map((exam) => {
                              const dateStr = exam.submittedAt
                                ? new Date(exam.submittedAt).toLocaleDateString('zh-TW')
                                : '-';
                              const durationStr = exam.durationSeconds
                                ? `${Math.ceil(exam.durationSeconds / 60)} 分鐘`
                                : '60 分鐘';
                              const scoreVal = exam.score ?? 0;
                              const isPassed = exam.isPassed;

                              return (
                                <tr key={exam.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '12px 8px' }}>{dateStr}</td>
                                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                                    {exam.paperTitle || '17300 網頁設計丙級 (80題全真)'}
                                  </td>
                                  <td style={{ padding: '12px 8px' }}>{durationStr}</td>
                                  <td style={{ padding: '12px 8px', fontWeight: 700, color: isPassed ? '#2E7D32' : '#C62828' }}>
                                    {scoreVal} 分
                                  </td>
                                  <td style={{ padding: '12px 8px' }}>
                                    <span style={{ color: isPassed ? '#2E7D32' : '#C62828', fontWeight: 700 }}>
                                      {isPassed ? '✓ 及格' : '✕ 未及格'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          : mockExamHistory.slice(0, 5).map((exam) => {
                              const dateStr = exam.submittedAt
                                ? new Date(exam.submittedAt).toLocaleDateString('zh-TW')
                                : (exam.startedAt ? new Date(exam.startedAt).toLocaleDateString('zh-TW') : '-');
                              const durationStr = exam.durationMinutes ? `${exam.durationMinutes} 分鐘` : '60 分鐘';
                              const scoreVal = exam.score ?? 0;
                              const isPassed = exam.isPassed ?? (scoreVal >= 60);

                              return (
                                <tr key={exam.sessionId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                  <td style={{ padding: '12px 8px' }}>{dateStr}</td>
                                  <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                                    {exam.mode === 'official_100' ? '17300 網頁設計丙級 (100題)' : '17300 網頁設計丙級 (80題全真)'}
                                  </td>
                                  <td style={{ padding: '12px 8px' }}>{durationStr}</td>
                                  <td style={{ padding: '12px 8px', fontWeight: 700, color: isPassed ? '#2E7D32' : '#C62828' }}>
                                    {scoreVal} 分
                                  </td>
                                  <td style={{ padding: '12px 8px' }}>
                                    <span style={{ color: isPassed ? '#2E7D32' : '#C62828', fontWeight: 700 }}>
                                      {isPassed ? '✓ 及格' : '✕ 未及格'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Teacher Notifications & Next Recommended Actions */}
            <aside>
              {/* Enrolled Classes Card */}
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={16} color="var(--color-brand-deep-slate)" />
                    <span>
                      已加入班級 ({dashboardData ? dashboardData.enrolledClasses.length : enrolledClasses.length})
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsJoinClassOpen(true)}
                    style={{ color: 'var(--color-brand-gold-text)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, minHeight: '44px', padding: '10px 14px', display: 'inline-flex', alignItems: 'center' }}
                  >
                    管理 / 加入 →
                  </button>
                </div>

                {(!dashboardData && enrolledClasses.length === 0) || (dashboardData && dashboardData.enrolledClasses.length === 0) ? (
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '14px', borderRadius: '4px', fontSize: '12px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    尚未加入任何教學班級。點擊「管理 / 加入」輸入教師提供的 6 位代碼即可綁定班級並接收專屬公告。
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {dashboardData
                      ? dashboardData.enrolledClasses.map((item) => (
                          <div
                            key={item.enrollmentId}
                            style={{
                              backgroundColor: 'var(--surface-sunken)',
                              padding: '12px 14px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-brand-deep-slate)' }}>
                                {item.class.name}
                              </span>
                              <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                                {item.class.joinCode}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>指導教師：{item.class.teacherName || '任課教師'}</span>
                              <span>加入時間：{new Date(item.joinedAt).toLocaleDateString('zh-TW')}</span>
                            </div>
                          </div>
                        ))
                      : enrolledClasses.map((cls) => (
                          <div
                            key={cls.id}
                            style={{
                              backgroundColor: 'var(--surface-sunken)',
                              padding: '12px 14px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-brand-deep-slate)' }}>
                                {cls.name}
                              </span>
                              <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                                {cls.code}
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>指導教師：{cls.teacherName || '任課教師'}</span>
                              <span>{cls.semester || '本學期'}</span>
                            </div>
                          </div>
                        ))}
                  </div>
                )}
              </div>

              {/* Teacher Messages Card */}
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} color="var(--color-brand-gold)" />
                  <span>指導教師回饋與通知</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: '4px', fontSize: '12px', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                      【題組一實作作業已批核】
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      黃老師：「你的跑馬燈與置中排版很標準，但記得在考場檢查圖片 alt 屬性是否有遺漏，這項每漏一張會扣 5 分喔！」
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>2 小時前</div>
                  </div>

                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: '4px', fontSize: '12px', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                      【班級模擬考公告】
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      本週六將進行全班「網頁設計丙級第二次聯合模考」，請提前完成工作項目 03 複習。
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>昨天</div>
                  </div>
                </div>
              </div>

              {/* Study Streak & Motivation */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  今日推薦學習任務
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#2E7D32" />
                    <span>完成 10 題 CSS 盒模型錯題複習</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid var(--border-default)' }} />
                    <span>在沙盒演練題組二「運動廣場圖文切換」</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        <StudentClassJoinModal
          isOpen={isJoinClassOpen}
          onClose={() => setIsJoinClassOpen(false)}
          userId={userId}
        />
      </main>

      <Footer />
    </div>
  );
};
