import React from 'react';
import {
  School,
  Users,
  Award,
  AlertCircle,
  TrendingUp,
  Download,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';

interface TeacherDashboardPageProps {
  onOpenTeacherApply?: () => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome } = useNavigation();

  // Mock student roster data
  const students = [
    { id: 'st1', name: '陳品睿', email: 'chen.pr@school.edu', progress: 85, latestMock: 92, status: 'safe', lastActive: '10 分鐘前' },
    { id: 'st2', name: '林子翔', email: 'lin.tx@school.edu', progress: 78, latestMock: 84, status: 'safe', lastActive: '1 小時前' },
    { id: 'st3', name: '黃怡君', email: 'huang.yj@school.edu', progress: 62, latestMock: 70, status: 'warning', lastActive: '昨天' },
    { id: 'st4', name: '張維哲', email: 'chang.wz@school.edu', progress: 41, latestMock: 52, status: 'danger', lastActive: '3 天前' },
    { id: 'st5', name: '李若萱', email: 'lee.rx@school.edu', progress: 90, latestMock: 96, status: 'safe', lastActive: '剛剛' },
  ];

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>教師教學管理中心 (Educator Dashboard)</span>
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
                  <School size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      {user && user.roles.includes('TEACHER') ? user.displayName : '認證教師教學主控台'}
                    </h1>
                    <span className="badge badge-gold">認證教師資格</span>
                    <span className="badge badge-neutral">管理班級：資訊一甲 (38 人)</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    負責檢定科目：17300 網頁設計丙級 · 11900 軟體設計丙級
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusCircle size={15} />
                  <span>指派班級模擬測驗</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={15} />
                  <span>匯出學生成績報表</span>
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
              <strong>教師管理示範模式：</strong>教師端主控台提供全班考試合格率預測、易錯題目熱點分析與學員沙盒代碼檢視。於後續後端資料庫整合完成後，將能真實指派作業並審核班級申請。
            </span>
          </div>
        </div>

        {/* Class Overview Statistics */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }} className="stats-row">
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>班級總受訓人數</span>
                <Users size={16} color="var(--color-brand-deep-slate)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-charcoal)' }}>
                38 <span style={{ fontSize: '13px', fontWeight: 500 }}>人</span>
              </div>
              <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                全數已註冊完成認證
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>全班平均模擬考成績</span>
                <Award size={16} color="var(--color-brand-gold)" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-brand-deep-slate)' }}>
                78.4 <span style={{ fontSize: '13px', fontWeight: 500 }}>分</span>
              </div>
              <div style={{ fontSize: '11px', color: '#2E7D32', marginTop: '4px' }}>
                ↑ 較前次模考提升 +6.2 分
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>預估丙級通過率</span>
                <TrendingUp size={16} color="#2E7D32" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#2E7D32' }}>
                89.5%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                34 人處於安全達標區間
              </div>
            </div>

            <div className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>需特別關懷補強</span>
                <AlertCircle size={16} color="#C62828" />
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#C62828' }}>
                4 <span style={{ fontSize: '13px', fontWeight: 500 }}>人</span>
              </div>
              <div style={{ fontSize: '11px', color: '#C62828', marginTop: '4px' }}>
                模擬考成績低於 60 分
              </div>
            </div>
          </div>

          {/* Student Roster Table & Error Hotspots */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '24px', alignItems: 'start' }} className="teacher-grid">
            {/* Left: Student Roster Table */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                  班級學員學習進度監控表
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>共 38 名學員</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px 8px' }}>學生姓名</th>
                      <th style={{ padding: '10px 8px' }}>題庫完成率</th>
                      <th style={{ padding: '10px 8px' }}>最新模考</th>
                      <th style={{ padding: '10px 8px' }}>達標狀態</th>
                      <th style={{ padding: '10px 8px' }}>最後活躍</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>
                          <div>{st.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>{st.email}</div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="progress-track" style={{ width: '60px', height: '6px' }}>
                              <div className="progress-bar" style={{ width: `${st.progress}%` }} />
                            </div>
                            <span>{st.progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px', fontWeight: 700 }}>
                          {st.latestMock} 分
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {st.status === 'safe' && <span className="badge badge-neutral" style={{ color: '#2E7D32', fontSize: '11px' }}>穩健達標</span>}
                          {st.status === 'warning' && <span className="badge badge-gold" style={{ fontSize: '11px' }}>邊緣及格</span>}
                          {st.status === 'danger' && <span className="badge" style={{ backgroundColor: 'rgba(198, 40, 40, 0.1)', color: '#C62828', fontSize: '11px' }}>需補救教學</span>}
                        </td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>
                          {st.lastActive}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            檢視代碼
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Error Hotspots Analysis */}
            <aside>
              <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} color="#C62828" />
                  <span>全班最常失分題組熱區</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '14px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                      <span>#058 box-sizing 盒模型計算</span>
                      <span style={{ color: '#C62828' }}>錯誤率 47%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      學生常將 padding 與 border 重複向外加，混淆了 border-box 與 content-box 的差異。
                    </p>
                  </div>

                  <div style={{ background: 'var(--surface-sunken)', padding: '14px', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '4px' }}>
                      <span>#305 1024px 水平置中宣告</span>
                      <span style={{ color: '#C62828' }}>錯誤率 36%</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      多數學生誤填 text-align: center 或 float: center，需再強調區塊元素與 margin: 0 auto 原理。
                    </p>
                  </div>
                </div>
              </div>

              {/* Teaching Resource Download */}
              <div className="card" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>
                  考場評分規章與教材
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>173003B12 術科評分要點 PDF</span>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>下載</button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>173003A17 學科 611 題解答對照表</span>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>下載</button>
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
