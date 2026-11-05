import React, { useState } from 'react';
import {
  Code2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { OFFICIAL_PRACTICAL_TASKS, PracticalTaskDetail } from '../../data/practicalTasksData';

interface PracticalLearningPageProps {
  onOpenTeacherApply?: () => void;
}

export const PracticalLearningPage: React.FC<PracticalLearningPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { goToHome, goToCertifications, goToCodeEditor } = useNavigation();

  // Active Task Tab (1..4)
  const [activeTaskId, setActiveTaskId] = useState<number>(1);
  const currentTask: PracticalTaskDetail = OFFICIAL_PRACTICAL_TASKS.find((t) => t.id === activeTaskId) || OFFICIAL_PRACTICAL_TASKS[0];

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
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>術科實作工作區 (17300 網頁設計丙級)</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="badge badge-slate">術科官方 4 大題組</span>
                  <span className="badge badge-neutral">考場限時 120 分鐘 · 現場抽測 1 組</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '28px' }}>
                  術科題組深度解構與規範查核
                </h1>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => goToCodeEditor(activeTaskId)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Code2 size={16} />
                <span>在線上程式沙盒實作此題組</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Demo Mode Notice */}
        <div className="container" style={{ marginTop: '20px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>官方考綱核實保證：</strong>依據勞動部技能檢定中心 173003B12 規範，丙級術科實作試題共 4 大題組（題組一至題組四）。本系統提供 4 大題組全真規範、防呆檢核點與安全代碼沙盒。
            </span>
          </div>
        </div>

        {/* 4 Tasks Selector Tabs */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }} className="task-pill-grid">
            {OFFICIAL_PRACTICAL_TASKS.map((task) => {
              const isActive = task.id === activeTaskId;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? '2px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                    backgroundColor: isActive ? 'var(--surface-sunken)' : 'var(--surface-base)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                      {task.code}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      難度 {task.difficulty}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    建議時限 {task.estimatedMinutes} 分鐘
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Task Detail Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', alignItems: 'start' }} className="practical-detail-grid">
            {/* Left Column: Requirements & Guide */}
            <div>
              {/* Task Overview Card */}
              <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-gold">題目概要</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentTask.theme}</span>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-brand-charcoal)' }}>
                  {currentTask.title}
                </h2>

                <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  {currentTask.overview}
                </p>

                {/* Canvas Wireframe Specs */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={16} color="var(--color-brand-deep-slate)" />
                  <span>官方版面尺寸標準與結構規範</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>基準寬度與對齊</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentTask.canvasSpec.width} · {currentTask.canvasSpec.centering}</div>
                  </div>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>頁首形象區 (Header)</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentTask.canvasSpec.header}</div>
                  </div>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>導覽選單區 (Menu)</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentTask.canvasSpec.menu}</div>
                  </div>
                  <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>頁尾聲明區 (Footer)</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentTask.canvasSpec.footer}</div>
                  </div>
                </div>

                {/* Required Assets */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderOpen size={16} color="var(--color-brand-deep-slate)" />
                  <span>試題隨附素材清單（位於素材題組資料夾）</span>
                </h3>
                <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
                  {currentTask.requiredAssets.map((asset, i) => (
                    <li key={i}>{asset}</li>
                  ))}
                </ul>

                {/* CTA Jump to Editor */}
                <div style={{ padding: '16px 20px', backgroundColor: '#FAF9F5', border: '1px solid #D9D2C4', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                      立即在安全沙盒編寫此題組程式碼
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      預載官方骨架 HTML/CSS，支援即時雙欄安全隔離預覽
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => goToCodeEditor(currentTask.id)}
                  >
                    開啟程式編輯器
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Scoring Checklist & Disqualification Warnings */}
            <aside>
              {/* Disqualification Zero Trap Alert */}
              <div
                className="card"
                style={{
                  padding: '24px',
                  marginBottom: '20px',
                  borderTop: '4px solid #C62828',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#C62828', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} />
                  <span>考場致命 0 分防呆檢核</span>
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  在技術士檢定中，以下失誤將導致該大項被直接判定為 0 分，實作時請務必逐一核驗：
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentTask.disqualificationTraps.map((trap, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px', lineHeight: 1.6, color: '#4A5B66' }}>
                      <span style={{ color: '#C62828', fontWeight: 700 }}>✕</span>
                      <span>{trap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scoring Checklist */}
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileCheck size={18} color="var(--color-brand-gold)" />
                  <span>高分通過關鍵查驗表 (Checklist)</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentTask.scoringChecklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                      <CheckCircle2 size={16} color="var(--color-brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                  <strong>考場提醒：</strong>{currentTask.officialReferenceTips}
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
