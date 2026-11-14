import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Laptop,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '../../context/NavigationContext';
import { OFFICIAL_PRACTICAL_TASKS, PracticalTaskDetail } from '../../data/practicalTasksData';

interface CodeEditorPageProps {
  onOpenTeacherApply?: () => void;
}

export const CodeEditorPage: React.FC<CodeEditorPageProps> = ({ onOpenTeacherApply }) => {
  const { openAuth } = useAuth();
  const { route, goToHome, goToCertifications, goToPracticalLearning } = useNavigation();

  // Selected task id from route or default to 1
  const initialTaskId = route.taskId || 1;
  const [selectedTaskId, setSelectedTaskId] = useState<number>(initialTaskId);
  const [activeTab, setActiveTab] = useState<'html' | 'css'>('html');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [mobilePane, setMobilePane] = useState<'code' | 'preview'>('code');

  const currentTask: PracticalTaskDetail =
    OFFICIAL_PRACTICAL_TASKS.find((t) => t.id === selectedTaskId) || OFFICIAL_PRACTICAL_TASKS[0];

  const [htmlCode, setHtmlCode] = useState<string>(currentTask.defaultHtmlCode);
  const [cssCode, setCssCode] = useState<string>(currentTask.defaultCssCode);
  const [previewKey, setPreviewKey] = useState<number>(0);

  // When task changes, update codes
  useEffect(() => {
    const t = OFFICIAL_PRACTICAL_TASKS.find((item) => item.id === selectedTaskId) || OFFICIAL_PRACTICAL_TASKS[0];
    setHtmlCode(t.defaultHtmlCode);
    setCssCode(t.defaultCssCode);
    setPreviewKey((k) => k + 1);
  }, [selectedTaskId]);

  const handleReset = () => {
    setHtmlCode(currentTask.defaultHtmlCode);
    setCssCode(currentTask.defaultCssCode);
    setPreviewKey((k) => k + 1);
  };

  const handleRun = () => {
    setPreviewKey((k) => k + 1);
  };

  // Compile combined HTML document with safe isolated styles
  // Inject CSP into iframe head to strictly isolate from parent environment
  const combinedSrcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Safe Sandbox CSP: Prohibit outbound network calls and parent access -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:; connect-src 'none';">
  <style>
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode.replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*?<\/html>/i, '')}
</body>
</html>`;
  }, [htmlCode, cssCode]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Breadcrumb Header */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '8px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#certifications" onClick={(e) => { e.preventDefault(); goToCertifications(); }}>證照中心</a>
              <span>/</span>
              <a href="#practical" onClick={(e) => { e.preventDefault(); goToPracticalLearning(); }}>術科工作區</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>HTML/CSS 安全程式沙盒</span>
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-gold">安全隔離沙盒</span>
                  <span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} color="#2E7D32" />
                    <span>Iframe Sandbox 嚴格隔離防護</span>
                  </span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '24px' }}>
                  網頁設計丙級 · 線上雙欄即時程式碼編輯器
                </h1>
              </div>

              {/* Task Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  選擇題組骨架：
                </span>
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--surface-base)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-brand-deep-slate)',
                  }}
                >
                  {OFFICIAL_PRACTICAL_TASKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Security Isolation Notice */}
        <div className="container" style={{ marginTop: '16px' }}>
          <div className="demo-banner">
            <Sparkles size={16} />
            <span>
              <strong>安全隔離說明：</strong>本程式碼編輯器採用 W3C 規格之 <code style={{ background: '#EFECE3', padding: '2px 4px', borderRadius: '3px' }}>iframe sandbox="allow-scripts"</code> 與內容安全政策（CSP），有效隔絕外部惡意腳本存取 Cookie 或父層環境，保障系統與使用者資料安全。
            </span>
          </div>
        </div>

        {/* Dual-Pane Code Sandbox Workspace */}
        <div className="container" style={{ marginTop: '16px' }}>
          {/* Toolbar */}
          <div
            style={{
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-default)',
              borderBottom: 'none',
              borderTopLeftRadius: 'var(--radius-md)',
              borderTopRightRadius: 'var(--radius-md)',
              padding: '10px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Left: Code Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('html')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: activeTab === 'html' ? '#526B7B' : 'transparent',
                  color: activeTab === 'html' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>HTML 骨架標籤</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('css')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-xs)',
                  border: 'none',
                  backgroundColor: activeTab === 'css' ? '#526B7B' : 'transparent',
                  color: activeTab === 'css' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>CSS 樣式表</span>
              </button>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Viewport Width Switcher */}
              <div style={{ display: 'flex', background: 'var(--surface-base)', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  title="1024px 考場標準寬度"
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '2px',
                    backgroundColor: viewMode === 'desktop' ? '#D9E2EA' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Laptop size={14} />
                  <span>1024px 桌機</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  title="手機響應式測試"
                  style={{
                    padding: '4px 8px',
                    border: 'none',
                    borderRadius: '2px',
                    backgroundColor: viewMode === 'mobile' ? '#D9E2EA' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  <Smartphone size={14} />
                  <span>RWD 響應</span>
                </button>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleReset}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={13} />
                <span>重設骨架</span>
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleRun}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Play size={13} />
                <span>執行預覽</span>
              </button>
            </div>
          </div>

          {/* Mobile Pane Switcher (visible only on screens <= 767px) */}
          <div
            className="editor-mobile-switcher"
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              borderLeft: '1px solid var(--border-default)',
              borderRight: '1px solid var(--border-default)',
              borderBottom: '1px solid var(--border-subtle)',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>行動端檢視切換：</span>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-base)', padding: '2px', borderRadius: '4px' }}>
              <button
                type="button"
                onClick={() => setMobilePane('code')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: mobilePane === 'code' ? 'var(--color-brand-deep-slate)' : 'transparent',
                  color: mobilePane === 'code' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                程式碼編輯區
              </button>
              <button
                type="button"
                onClick={() => setMobilePane('preview')}
                style={{
                  padding: '4px 10px',
                  border: 'none',
                  borderRadius: '3px',
                  backgroundColor: mobilePane === 'preview' ? 'var(--color-brand-gold)' : 'transparent',
                  color: mobilePane === 'preview' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                即時預覽區
              </button>
            </div>
          </div>

          {/* Dual Column Workspace Container */}
          <div
            className={`editor-dual-grid ${mobilePane === 'code' ? 'show-editor-only' : 'show-preview-only'}`}
          >
            {/* Left Column: Code Editor */}
            <div className="editor-pane-code" style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-default)', height: '100%', minHeight: '380px' }}>
              <div style={{ backgroundColor: '#26343D', color: '#D9E2EA', padding: '8px 16px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {activeTab === 'html' ? 'HTML Editor (可即時編輯)' : 'CSS Editor (可即時編輯)'}
              </div>

              {activeTab === 'html' ? (
                <textarea
                  value={htmlCode}
                  onChange={(e) => setHtmlCode(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    backgroundColor: '#FAF9F5',
                    color: '#26343D',
                  }}
                  spellCheck={false}
                  aria-label="HTML 編輯區"
                />
              ) : (
                <textarea
                  value={cssCode}
                  onChange={(e) => setCssCode(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    backgroundColor: '#FAF9F5',
                    color: '#26343D',
                  }}
                  spellCheck={false}
                  aria-label="CSS 編輯區"
                />
              )}
            </div>

            {/* Right Column: Isolated Preview Canvas */}
            <div className="editor-pane-preview" style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#EFECE3', height: '100%', minHeight: '380px' }}>
              <div style={{ backgroundColor: '#FAF9F5', borderBottom: '1px solid var(--border-subtle)', padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-deep-slate)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>即時預覽畫布（安全沙盒隔離）</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {viewMode === 'desktop' ? '標準 1024px 模式' : '自適應視窗模式'}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  padding: '16px',
                  overflow: 'auto',
                }}
              >
                {/* 
                  Security Note:
                  sandbox="allow-scripts" ensures scripts inside can execute without accessing parent DOM,
                  localStorage, or cookies (allow-same-origin is deliberately NOT set).
                */}
                <iframe
                  key={previewKey}
                  sandbox="allow-scripts"
                  srcDoc={combinedSrcDoc}
                  title="網頁設計丙級術科安全預覽"
                  style={{
                    width: viewMode === 'desktop' ? '1024px' : '100%',
                    height: '100%',
                    minHeight: '520px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9E2EA',
                    borderRadius: '4px',
                    boxShadow: 'var(--shadow-sm)',
                    transform: viewMode === 'desktop' ? 'scale(0.85)' : 'none',
                    transformOrigin: 'top center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
