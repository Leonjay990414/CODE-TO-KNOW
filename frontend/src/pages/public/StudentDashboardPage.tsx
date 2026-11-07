import React from 'react';
import {
  User as UserIcon,
  Award,
  BookOpen,
  Code2,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Bell,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface StudentDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToTheoryPractice, goToPracticalLearning, goToMockExam, goToLearningProgress } = useNavigation();

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
                      {user ? user.displayName : '學員示範帳號'}
                    </h1>
                    <span className="badge badge-gold">一般學員</span>
                    <span className="badge badge-neutral">已連續學習 12 天</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    登入信箱：{user ? user.email : 'student.demo@codetoknow.edu'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
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

        {/* Demo Mode Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>學生中心示範模式：</strong>在此管理您目前準備中的技能檢定、各項作業評分與模擬考歷程。假日完成資料庫整合後，將自動連結您的個人專屬進度。
            </span>
          </div>
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
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-brand-gold)' }}>剩餘 28 天</div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span>整體準備進度</span>
                    <strong style={{ color: 'var(--color-brand-deep-slate)' }}>45%</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-bar" style={{ width: '45%' }} />
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已作答 275 / 611 題</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => goToPracticalLearning('web-design-c')}
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>已完成 3 / 5 題組</div>
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>限時 60 分鐘驗收</div>
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
                      <div style={{ fontSize: '14px', fontWeight: 700 }}>錯題本與分析</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>高頻失分點追蹤</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Mock Exam History Table */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
                  近期全真模擬考成績紀錄
                </h3>
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
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 8px' }}>2026/11/04</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>17300 學科模擬試卷 A</td>
                        <td style={{ padding: '12px 8px' }}>38 分鐘</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#2E7D32' }}>88 分</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: '#2E7D32', fontWeight: 700 }}>✓ 及格</span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 8px' }}>2026/10/28</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>17300 學科模擬試卷 B</td>
                        <td style={{ padding: '12px 8px' }}>42 分鐘</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#2E7D32' }}>75 分</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: '#2E7D32', fontWeight: 700 }}>✓ 及格</span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '12px 8px' }}>2026/10/15</td>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>17300 學科前測診斷</td>
                        <td style={{ padding: '12px 8px' }}>50 分鐘</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: '#C62828' }}>52 分</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: '#C62828', fontWeight: 700 }}>✕ 未及格</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Teacher Notifications & Next Recommended Actions */}
            <aside>
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
      </main>

      <Footer />
    </div>
  );
};
