import React, { useState } from 'react';
import { GraduationCap, School, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface StudentTeacherDualProps {
  onOpenTeacherApply?: () => void;
}

export const StudentTeacherDual: React.FC<StudentTeacherDualProps> = ({ onOpenTeacherApply }) => {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const { user, openAuth } = useAuth();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveRole((prev) => (prev === 'student' ? 'teacher' : 'student'));
    }
  };

  const handleTeacherClick = () => {
    if (user) {
      if (onOpenTeacherApply) {
        onOpenTeacherApply();
      }
    } else {
      openAuth('login');
    }
  };

  return (
    <section id="dual-audience" className="section-padding" style={{ backgroundColor: 'var(--surface-base)' }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-10) auto' }}>
          <span className="text-caption" style={{ color: 'var(--color-brand-deep-slate)', display: 'block', marginBottom: 'var(--space-2)' }}>
            DUAL AUDIENCE ECOSYSTEM // 師生雙端生態
          </span>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>
            為自主學習者賦能，為前線教育者提效
          </h2>
          <p className="text-body" style={{ fontSize: 'var(--font-size-md)' }}>
            「碼上學」不只是自學工具，更是學校課堂、線上培訓與教育機構的完整教學輔助作業系統。
          </p>

          {/* Role Toggle Tabs */}
          <div
            role="tablist"
            aria-label="學生與教師雙端生態切換"
            onKeyDown={handleKeyDown}
            style={{
              display: 'inline-flex',
              padding: '4px',
              backgroundColor: 'var(--color-brand-ice-slate)',
              borderRadius: 'var(--radius-full)',
              marginTop: 'var(--space-6)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              type="button"
              role="tab"
              id="tab-role-student"
              aria-selected={activeRole === 'student'}
              aria-controls="panel-role-student"
              tabIndex={activeRole === 'student' ? 0 : -1}
              onClick={() => setActiveRole('student')}
              className={`role-toggle-tab ${activeRole === 'student' ? 'active' : ''}`}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                fontSize: '14px',
                fontWeight: activeRole === 'student' ? 700 : 500,
                backgroundColor: activeRole === 'student' ? 'var(--color-brand-deep-slate)' : 'transparent',
                color: activeRole === 'student' ? '#FFFFFF' : 'var(--color-brand-deep-slate)',
                boxShadow: activeRole === 'student' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--duration-fast) var(--ease-out)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <GraduationCap size={16} color={activeRole === 'student' ? 'var(--color-brand-gold)' : 'var(--color-brand-deep-slate)'} />
              <span>學生端學習體驗</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-role-teacher"
              aria-selected={activeRole === 'teacher'}
              aria-controls="panel-role-teacher"
              tabIndex={activeRole === 'teacher' ? 0 : -1}
              onClick={() => setActiveRole('teacher')}
              className={`role-toggle-tab ${activeRole === 'teacher' ? 'active' : ''}`}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                fontSize: '14px',
                fontWeight: activeRole === 'teacher' ? 700 : 500,
                backgroundColor: activeRole === 'teacher' ? 'var(--color-brand-deep-slate)' : 'transparent',
                color: activeRole === 'teacher' ? '#FFFFFF' : 'var(--color-brand-deep-slate)',
                boxShadow: activeRole === 'teacher' ? 'var(--shadow-sm)' : 'none',
                transition: 'all var(--duration-fast) var(--ease-out)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <School size={16} color={activeRole === 'teacher' ? 'var(--color-brand-gold)' : 'var(--color-brand-deep-slate)'} />
              <span>教師端教學中心</span>
            </button>
          </div>
        </div>

        {/* Content Showcase */}
        {activeRole === 'student' ? (
          <div
            id="panel-role-student"
            role="tabpanel"
            aria-labelledby="tab-role-student"
            className="card"
            style={{ padding: 'var(--space-10)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)', alignItems: 'center' }} className="dual-grid">
              <div>
                <span className="badge badge-gold" style={{ marginBottom: 'var(--space-2)' }}>自主探索 × 個性化</span>
                <h3 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>
                  陪伴每一步思考的個人專屬智慧導師
                </h3>
                <p className="text-body" style={{ lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>
                  為學習者打造專注無干擾的工作台，消除面對複雜題目的焦慮感。透過分階段提示、闖關測驗與歷程雷達，把每一次犯錯都化為最扎實的成長資產。
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>沉浸式題庫工作區</strong>：支援語法高亮、即時測試與邊界用例驗證</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>4 階 AI 智能鷹架</strong>：按需啟發，嚴禁直接劇透答案</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>個人錯題複習本</strong>：根據遺忘曲線智慧推薦最需複習之節點</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-mobile-full"
                  onClick={() => openAuth('register')}
                >
                  <span>以學生身分開始探索</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Student Workflow Visual Mockup */}
              <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-brand-deep-slate)' }}>
                  學生端工作區介面預覽
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>資料結構：單向鏈結串列的反轉</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>今日目標 · 已完成 80%</div>
                    </div>
                    <span className="badge badge-success">進行中</span>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>演算法思考：雙指針法與滑動窗口</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI 助教已就緒 · 4 階提示待啟用</div>
                    </div>
                    <span className="badge badge-gold">可領取微光</span>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>期中模擬測驗：計算機架構全真模擬</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>限時 60 分鐘 · 倒數防作弊模式</div>
                    </div>
                    <span className="badge badge-neutral">待排程</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            id="panel-role-teacher"
            role="tabpanel"
            aria-labelledby="tab-role-teacher"
            className="card"
            style={{ padding: 'var(--space-10)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-10)', alignItems: 'center' }} className="dual-grid">
              <div>
                <span className="badge badge-gold" style={{ marginBottom: 'var(--space-2)' }}>數據賦能 × 高效教學</span>
                <h3 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>
                  掌握全班學習盲點的教育科技指揮中心
                </h3>
                <p className="text-body" style={{ lineHeight: 1.8, marginBottom: 'var(--space-6)' }}>
                  讓教學決策從憑感覺轉變為有據可循。教師儀表板即時彙整學生卡點時長、題目答錯分佈與常見邏輯誤區，助你精準施教，解放批改重複勞動。
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-8)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>班級學力即時診斷</strong>：熱區圖標示題目普遍卡點與高頻錯誤率</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>智慧題庫組卷引擎</strong>：自訂標籤、難度係數與自動評分標準</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)', flexShrink: 0 }}>
                      <Check size={14} />
                    </span>
                    <span><strong>分層作業派送</strong>：根據學生能力層次智慧匹配不同挑戰任務</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-mobile-full"
                  onClick={handleTeacherClick}
                >
                  <span>申請教師專區演示</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Teacher Analytics Visual Mockup */}
              <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '14px', color: 'var(--color-brand-deep-slate)' }}>
                  教師端班級數據概覽預覽
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>全班及格率</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>89.2%</div>
                  </div>
                  <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>平均作業時長</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>38 分鐘</div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>高頻錯題診斷提醒</div>
                  <div style={{ fontSize: '12px', color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠ 題號 #42「指標記憶體位址存取」答錯率高達 46%，建議課堂專題覆盤。</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <style>{`
        @media (max-width: 1023px) {
          .dual-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .role-toggle-tab:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.45) !important;
          color: var(--color-brand-charcoal) !important;
        }
        .role-toggle-tab:focus-visible {
          outline: 2px solid var(--color-brand-deep-slate) !important;
          outline-offset: 2px;
        }
      `}</style>
    </section>
  );
};
