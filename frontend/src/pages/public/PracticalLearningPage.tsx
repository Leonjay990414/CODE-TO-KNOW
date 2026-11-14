import React, { useState, useEffect } from 'react';
import {
  Code2,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  FolderOpen,
  BookOpen,
  Video,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { OFFICIAL_PRACTICAL_TASKS, PracticalTaskDetail } from '../../data/practicalTasksData';
import {
  UNIFIED_PRACTICAL_CURRICULUM_MAP,
  UnifiedTaskCurriculum,
  CurriculumVersionData,
  TaskStep,
} from '../../data/unifiedPracticalCurriculumData';
import {
  getPracticalProgress,
  toggleStepCompletion,
  toggleChecklistItem,
  resetPracticalProgress,
  PracticalTaskProgress,
} from '../../utils/learningStorage';

interface PracticalLearningPageProps {
  onOpenTeacherApply?: () => void;
}

export const PracticalLearningPage: React.FC<PracticalLearningPageProps> = ({ onOpenTeacherApply }) => {
  const { user, openAuth } = useAuth();
  const { goToHome, goToCertifications, goToCodeEditor } = useNavigation();

  // Active Task Tab (1..5)
  const [activeTaskId, setActiveTaskId] = useState<number>(1);
  const currentTask: PracticalTaskDetail =
    OFFICIAL_PRACTICAL_TASKS.find((t) => t.id === activeTaskId) || OFFICIAL_PRACTICAL_TASKS[0];

  // Version selection for Task 5 ('A' | 'B')
  const [selectedVersion, setSelectedVersion] = useState<'A' | 'B'>('A');
  const [showAssetTable, setShowAssetTable] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);

  // User ID identifier (Demo/Guest fallback to 'guest-anonymous')
  const userId = user?.id || 'guest-anonymous';

  // Task 5 progress state
  const [progress, setProgress] = useState<PracticalTaskProgress>(() => {
    return getPracticalProgress(userId, activeTaskId, selectedVersion);
  });

  // Re-read progress whenever active task, version or user changes
  useEffect(() => {
    setProgress(getPracticalProgress(userId, activeTaskId, selectedVersion));
    setActiveStepTab(1);
  }, [userId, activeTaskId, selectedVersion]);

  // Current curriculum version data for active task
  const currentCurriculumConfig: UnifiedTaskCurriculum =
    UNIFIED_PRACTICAL_CURRICULUM_MAP[activeTaskId] || UNIFIED_PRACTICAL_CURRICULUM_MAP[5];
  const activeCurriculum: CurriculumVersionData =
    selectedVersion === 'A' ? currentCurriculumConfig.versionA : currentCurriculumConfig.versionB;

  const handleToggleStep = (stepNumber: number) => {
    const updated = toggleStepCompletion(userId, activeTaskId, selectedVersion, stepNumber);
    setProgress(updated);
  };

  const handleToggleChecklist = (itemText: string) => {
    const updated = toggleChecklistItem(userId, activeTaskId, selectedVersion, itemText);
    setProgress(updated);
  };

  const handleResetProgress = () => {
    if (window.confirm(`確定要重設【${activeCurriculum.name}】的學習進度與查核表紀錄嗎？`)) {
      const reset = resetPracticalProgress(userId, activeTaskId, selectedVersion);
      setProgress(reset);
    }
  };

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
                  <span className="badge badge-slate">術科官方 5 大題組</span>
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
              <strong>官方考綱核實保證：</strong>依據勞動部技能檢定中心 173003B12 規範，丙級術科實作試題共 5 大題組（題組一至題組五，現場抽測 1 組）。題組五已完成 25 份官方素材精確索引，並提供 Version A (官方延伸版) 與 Version B (影片實戰版) 雙版本進度隔離追蹤。
            </span>
          </div>
        </div>

        {/* 5 Tasks Selector Tabs */}
        <div className="container" style={{ marginTop: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '28px' }} className="task-pill-grid">
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
                  <div style={{ fontSize: '11px', marginTop: '6px', fontWeight: 600, color: task.id === activeTaskId ? '#2E7D32' : '#B8860B' }}>
                    {task.id === 5
                      ? '◐ 教材整理中（雙版架構就緒）'
                      : '◐ 官方步驟與素材已就緒'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Task Detail Layout */}
          <div className="practical-detail-grid">
            {/* Left Column: Requirements & Guide */}
            <div>
              {/* Task Overview Card */}
              <div className="card" style={{ padding: '28px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-gold">題目概要</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentTask.theme}</span>
                </div>

                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-brand-charcoal)' }}>
                  {currentTask.title}
                </h2>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <span className="badge badge-slate" style={{ fontSize: '11px' }}>
                    {currentTask.materialStatusText}
                  </span>
                  <span className="badge badge-gold" style={{ fontSize: '11px' }}>
                    {currentTask.teachingStatusText}
                  </span>
                </div>

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

                {/* Unified All 5 Tasks: Dual-Version Switching & Stepped Curriculum */}
                <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
                  {/* Version Selector Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                        選擇教材學習版本：
                      </span>
                      <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedVersion('A')}
                          style={{
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: selectedVersion === 'A' ? 700 : 500,
                            backgroundColor: selectedVersion === 'A' ? 'var(--color-brand-deep-slate)' : 'var(--surface-base)',
                            color: selectedVersion === 'A' ? '#FFFFFF' : 'var(--text-primary)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <BookOpen size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          Version A 官方素材延伸版
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVersion('B')}
                          style={{
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: selectedVersion === 'B' ? 700 : 500,
                            backgroundColor: selectedVersion === 'B' ? 'var(--color-brand-deep-slate)' : 'var(--surface-base)',
                            color: selectedVersion === 'B' ? '#FFFFFF' : 'var(--text-primary)',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Video size={14} style={{ display: 'inline', marginRight: '6px' }} />
                          Version B 影片實戰解析版
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleResetProgress}
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      title="清除本版本本機進度"
                    >
                      <RotateCcw size={12} />
                      重設進度
                    </button>
                  </div>

                  {/* Version Banner */}
                  <div style={{ padding: '14px 18px', backgroundColor: selectedVersion === 'A' ? '#F4F7F9' : '#FFFDF5', borderRadius: '8px', border: selectedVersion === 'A' ? '1px solid #D9E2EA' : '1px solid #F1E5C8', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--color-brand-charcoal)' }}>
                        {activeCurriculum.name}
                      </strong>
                      <span className={`badge ${activeCurriculum.isVerified ? 'badge-slate' : 'badge-gold'}`} style={{ fontSize: '10px' }}>
                        {activeCurriculum.isVerified ? '官方素材全量核實' : '影片示範架構（待連網串流驗證）'}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
                      {activeCurriculum.sourceDescription}
                    </p>
                  </div>

                  {/* Stepped Curriculum View */}
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--color-brand-charcoal)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>依序分步學習導引（共 {activeCurriculum.steps.length} 步驟，已完成 {progress.completedSteps.length} 步）</span>
                  </h3>

                  {/* Step Tabs Selector */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '16px' }}>
                    {activeCurriculum.steps.map((st) => {
                      const isDone = progress.completedSteps.includes(st.stepNumber);
                      const isCurrent = activeStepTab === st.stepNumber;
                      return (
                        <button
                          key={st.stepNumber}
                          type="button"
                          onClick={() => setActiveStepTab(st.stepNumber)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: isCurrent ? 700 : 500,
                            backgroundColor: isCurrent ? 'var(--color-brand-gold)' : isDone ? '#E8F5E9' : 'var(--surface-sunken)',
                            color: isCurrent ? '#FFFFFF' : isDone ? '#2E7D32' : 'var(--text-primary)',
                            border: '1px solid var(--border-default)',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {isDone && <Check size={12} />}
                          步驟 0{st.stepNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Step Detailed Content Card */}
                  {(() => {
                    const st: TaskStep = activeCurriculum.steps[activeStepTab - 1] || activeCurriculum.steps[0];
                    if (!st) return null;
                    const isDone = progress.completedSteps.includes(st.stepNumber);
                    return (
                      <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-gold)' }}>
                              STEP {st.stepNumber} / {activeCurriculum.steps.length}
                            </span>
                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-brand-charcoal)', margin: '4px 0' }}>
                              {st.title}
                            </h4>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleStep(st.stepNumber)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 600,
                              backgroundColor: isDone ? '#2E7D32' : 'var(--surface-base)',
                              color: isDone ? '#FFFFFF' : 'var(--text-primary)',
                              border: isDone ? 'none' : '1px solid var(--border-default)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <CheckCircle2 size={14} />
                            {isDone ? '標記已完成' : '標記此步驟完成'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                          <div><strong>操作目的：</strong>{st.purpose}</div>
                          <div><strong>HTML 標籤結構：</strong><code>{st.htmlExplanation}</code></div>
                          <div><strong>CSS 規範與版面：</strong>{st.cssExplanation}</div>
                          <div><strong>檔案路徑與命名：</strong><code>{st.pathUsage}</code></div>
                          <div style={{ color: '#C62828' }}><strong>常見考場陷阱：</strong>{st.commonMistakes}</div>
                          <div><strong>排查排錯要領：</strong>{st.troubleshooting}</div>
                          <div style={{ color: '#2E7D32' }}><strong>步驟驗收合格標準：</strong>{st.verificationPoint}</div>
                        </div>

                        {st.associatedAssets && st.associatedAssets.length > 0 && (
                          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>本步驟使用素材：</span>
                            {st.associatedAssets.map((asset) => (
                              <span key={asset} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--surface-base)', border: '1px solid var(--border-default)', fontFamily: 'monospace' }}>
                                {asset}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Official Material Asset Index Collapsible Section */}
                  <div style={{ marginBottom: '24px' }}>
                    <button
                      type="button"
                      onClick={() => setShowAssetTable(!showAssetTable)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--surface-base)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        color: 'var(--color-brand-charcoal)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FolderOpen size={16} color="var(--color-brand-deep-slate)" />
                        官方 {currentCurriculumConfig.totalAssetsCount} 份原始素材詳細索引清冊（已核實）
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--color-brand-gold)' }}>
                        {showAssetTable ? '收合清單 ▲' : `展開檢視 (${currentCurriculumConfig.totalAssetsCount} 個檔案) ▼`}
                      </span>
                    </button>

                    {showAssetTable && (
                      <div style={{ marginTop: '12px', overflowX: 'auto', border: '1px solid var(--border-default)', borderRadius: '6px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-default)' }}>
                              <th style={{ padding: '8px 12px' }}>檔名</th>
                              <th style={{ padding: '8px 12px' }}>類型</th>
                              <th style={{ padding: '8px 12px' }}>大小</th>
                              <th style={{ padding: '8px 12px' }}>主要用途與考點</th>
                              <th style={{ padding: '8px 12px' }}>對應步驟</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCurriculumConfig.assetsIndex.map((asset) => (
                              <tr key={asset.filename} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600 }}>{asset.filename}</td>
                                <td style={{ padding: '8px 12px' }}>
                                  <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: asset.category === 'music' ? '#E1F5FE' : asset.category === 'menu_button' ? '#FFF8E1' : '#F5F5F5' }}>
                                    {asset.category}
                                  </span>
                                </td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>{(asset.bytesLength / 1024).toFixed(1)} KB</td>
                                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{asset.purpose}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600 }}>步驟 {asset.associatedStep}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

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

              {/* Scoring Checklist with LocalStorage interactive toggle for Task 5 */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileCheck size={18} color="var(--color-brand-gold)" />
                    <span>高分通過關鍵查驗表</span>
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    完成 {progress.completedChecklist.length} / {activeCurriculum.selfChecklist.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {activeCurriculum.selfChecklist.map((item, i) => {
                    const isChecked = progress.completedChecklist.includes(item);
                    return (
                      <div
                        key={i}
                        onClick={() => handleToggleChecklist(item)}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '13px',
                          lineHeight: 1.6,
                          color: isChecked ? '#2E7D32' : 'var(--text-primary)',
                          cursor: 'pointer',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          backgroundColor: isChecked ? '#E8F5E9' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          style={{ marginTop: '4px', cursor: 'pointer' }}
                        />
                        <span style={{ textDecoration: isChecked ? 'line-through' : 'none' }}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
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
