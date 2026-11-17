import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Laptop,
  Maximize2,
  RefreshCw,
  FileCode,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import {
  VirtualProject,
  VirtualFile,
  getStudentProject,
  saveStudentProject,
  resetStudentProjectToStandard,
  compileMultiPagePreview,
} from '../../../utils/practicalSandboxEngine';

interface PracticalSandboxPageProps {
  initialTaskId?: number;
  onBackToHome?: () => void;
  onBackToDetail?: (taskId: number) => void;
}

export const PracticalSandboxPage: React.FC<PracticalSandboxPageProps> = ({
  initialTaskId = 1,
  onBackToHome,
  onBackToDetail,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<number>(initialTaskId);
  const [project, setProject] = useState<VirtualProject>(() => getStudentProject(selectedTaskId));

  // Current active file in Editor
  const [activeFilePath, setActiveFilePath] = useState<string>(() => project.defaultEntryPath);

  // Current active page in Preview
  const [previewPath, setPreviewPath] = useState<string>(() => project.defaultEntryPath);

  // Viewport mode
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile' | 'full'>('desktop');

  // Mobile pane tab ('editor' | 'preview')
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');

  const [copied, setCopied] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Reset or switch task
  useEffect(() => {
    const loaded = getStudentProject(selectedTaskId);
    setProject(loaded);
    setActiveFilePath(loaded.defaultEntryPath);
    setPreviewPath(loaded.defaultEntryPath);
    setRefreshKey((k) => k + 1);
  }, [selectedTaskId]);

  // Handle postMessage navigation from within sandboxed iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'C2K_SANDBOX_NAVIGATION') {
        const { href, target } = event.data;
        if (!href) return;

        // Clean href
        const targetClean = href.split('?')[0].split('#')[0];

        // Find if matches any virtual file
        const matchedKey = Object.keys(project.files).find(
          (k) => k === targetClean || k.endsWith('/' + targetClean) || targetClean.endsWith(k)
        );

        if (matchedKey) {
          if (target === '_top' || target === '_self') {
            setPreviewPath(matchedKey);
          } else {
            // Target is an inner iframe (e.g. name="myFrame") or new window
            // Direct the preview or update target
            setPreviewPath(matchedKey);
          }
          setRefreshKey((k) => k + 1);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [project.files]);

  // Current file in editor
  const activeFile: VirtualFile = project.files[activeFilePath] || project.files[project.defaultEntryPath];

  // Update file content
  const handleCodeChange = (newContent: string) => {
    if (!activeFile) return;
    const updatedFiles = {
      ...project.files,
      [activeFilePath]: {
        ...activeFile,
        content: newContent,
      },
    };
    const updatedProject = { ...project, files: updatedFiles };
    setProject(updatedProject);
    saveStudentProject(updatedProject);
  };

  // Run / refresh preview
  const handleRun = () => {
    setRefreshKey((k) => k + 1);
  };

  // Reset to official standard
  const handleResetToStandard = () => {
    if (window.confirm('確定要將工作區還原至官方標準骨架嗎？您目前的修改將被重設。')) {
      const standard = resetStudentProjectToStandard(selectedTaskId);
      setProject(standard);
      setActiveFilePath(standard.defaultEntryPath);
      setPreviewPath(standard.defaultEntryPath);
      setRefreshKey((k) => k + 1);
    }
  };

  // Copy active code
  const handleCopyCode = () => {
    if (navigator?.clipboard && activeFile) {
      navigator.clipboard.writeText(activeFile.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Compiled HTML srcDoc for iframe
  const compiledSrcDoc = useMemo(() => {
    return compileMultiPagePreview(project, previewPath);
  }, [project, previewPath, refreshKey]);

  // Viewport width styling
  const previewWidthStyle = useMemo(() => {
    switch (viewportMode) {
      case 'desktop':
        return '1024px';
      case 'tablet':
        return '768px';
      case 'mobile':
        return '375px';
      case 'full':
      default:
        return '100%';
    }
  }, [viewportMode]);

  const fileList = Object.keys(project.files);

  return (
    <div className="practical-sandbox-root" style={{ padding: '16px 0 40px' }}>
      {/* 頂部功能列 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onBackToDetail ? (
            <button
              onClick={() => onBackToDetail(selectedTaskId)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#26343D',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>返回教材</span>
            </button>
          ) : onBackToHome ? (
            <button
              onClick={onBackToHome}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                fontSize: '13px',
                color: '#26343D',
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>題組總覽</span>
            </button>
          ) : null}

          {/* 題組切換下拉選單 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#5A7D6C' }}>題組切換：</span>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E0',
                backgroundColor: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 600,
                color: '#26343D',
                cursor: 'pointer',
              }}
            >
              <option value={1}>題組一：校園社團介紹網 (104301)</option>
              <option value={2}>題組二：運動廣場連結網 (104302)</option>
              <option value={3}>題組三：國家公園介紹網 (104303)</option>
              <option value={4}>題組四：網路行銷購物網 (104304)</option>
              <option value={5}>題組五：書曼的旅遊相簿 (104305)</option>
            </select>
          </div>
        </div>

        {/* 隔離防護標章 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2E7D32', backgroundColor: '#EBF2EE', padding: '4px 10px', borderRadius: '12px', border: '1px solid #C6E0D0' }}>
          <ShieldCheck size={14} />
          <span>學生工作區物理隔離・標準答案保護生效中</span>
        </div>
      </div>

      {/* 手機版雙視圖切換列 */}
      <div className="mobile-pane-switcher" style={{ display: 'none', marginBottom: '12px' }}>
        <div style={{ display: 'flex', width: '100%', backgroundColor: '#E2E8F0', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setMobilePane('editor')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: mobilePane === 'editor' ? '#FFFFFF' : 'transparent',
              fontWeight: mobilePane === 'editor' ? 700 : 500,
              color: '#26343D',
              cursor: 'pointer',
            }}
          >
            程式碼編輯
          </button>
          <button
            onClick={() => setMobilePane('preview')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: mobilePane === 'preview' ? '#FFFFFF' : 'transparent',
              fontWeight: mobilePane === 'preview' ? 700 : 500,
              color: '#26343D',
              cursor: 'pointer',
            }}
          >
            即時網站預覽
          </button>
        </div>
      </div>

      {/* 主雙欄工作區 (桌面左右等高，手機依 mobilePane 切換) */}
      <div
        className="sandbox-dual-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 1fr) minmax(460px, 1.2fr)',
          gap: '16px',
          height: '750px',
        }}
      >
        {/* ================= 左欄：多檔案程式碼編輯器 ================= */}
        <div
          className={`sandbox-editor-panel ${mobilePane === 'preview' ? 'mobile-hidden' : ''}`}
          style={{
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            border: '1px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          }}
        >
          {/* 檔案頁籤標籤列 */}
          <div
            style={{
              backgroundColor: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              overflowX: 'auto',
              borderBottom: '1px solid #334155',
            }}
          >
            {fileList.map((fPath) => {
              const isActive = activeFilePath === fPath;
              return (
                <button
                  key={fPath}
                  onClick={() => setActiveFilePath(fPath)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    backgroundColor: isActive ? '#1E293B' : 'transparent',
                    color: isActive ? '#F8FAFC' : '#94A3B8',
                    border: 'none',
                    borderTop: isActive ? '2px solid #5A7D6C' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <FileCode size={13} color={isActive ? '#BDA77E' : '#64748B'} />
                  <span>{fPath}</span>
                </button>
              );
            })}
          </div>

          {/* 編輯器工具條 */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: '#1E293B',
              borderBottom: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>
              編輯中：<strong style={{ color: '#BDA77E' }}>{activeFilePath}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCopyCode}
                title="複製此檔案內容"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                {copied ? <Check size={13} color="#4ADE80" /> : <Copy size={13} />}
                <span>{copied ? '已複製' : '複製'}</span>
              </button>

              <button
                onClick={handleResetToStandard}
                title="重設回官方標準骨架"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 10px',
                  backgroundColor: '#334155',
                  color: '#F8FAFC',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>重設</span>
              </button>

              <button
                onClick={handleRun}
                title="手動刷新預覽"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  backgroundColor: '#5A7D6C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Play size={13} />
                <span>執行</span>
              </button>
            </div>
          </div>

          {/* 程式碼文字輸入區 */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={activeFile?.content || ''}
              onChange={(e) => handleCodeChange(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#1E293B',
                color: '#F8FAFC',
                border: 'none',
                outline: 'none',
                resize: 'none',
                padding: '16px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* ================= 右欄：真實多頁網站即時預覽 ================= */}
        <div
          className={`sandbox-preview-panel ${mobilePane === 'editor' ? 'mobile-hidden' : ''}`}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #D9E2EA',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* 模擬瀏覽器網址列與視窗寬度切換 */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            {/* 網址列 */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: '#26343D',
              }}
            >
              <span style={{ color: '#2E7D32', fontWeight: 700 }}>🌐 http://localhost:webXX/</span>
              {/* 頁面切換下拉選單 */}
              <select
                value={previewPath}
                onChange={(e) => {
                  setPreviewPath(e.target.value);
                  setRefreshKey((k) => k + 1);
                }}
                style={{
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#2D4E5E',
                  cursor: 'pointer',
                  flex: 1,
                }}
              >
                {fileList.filter((f) => f.endsWith('.html')).map((htmlFile) => (
                  <option key={htmlFile} value={htmlFile}>
                    {htmlFile} {htmlFile === project.defaultEntryPath ? '(首頁主框架)' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setRefreshKey((k) => k + 1)}
                title="重新整理預覽"
                style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748B' }}
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {/* 視窗寬度切換器 */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setViewportMode('desktop')}
                title="桌面模式 (1024px)"
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: viewportMode === 'desktop' ? '#5A7D6C' : '#E2E8F0',
                  backgroundColor: viewportMode === 'desktop' ? '#EBF2EE' : '#FFFFFF',
                  color: viewportMode === 'desktop' ? '#5A7D6C' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                <Laptop size={14} />
              </button>
              <button
                onClick={() => setViewportMode('tablet')}
                title="平板模式 (768px)"
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: viewportMode === 'tablet' ? '#5A7D6C' : '#E2E8F0',
                  backgroundColor: viewportMode === 'tablet' ? '#EBF2EE' : '#FFFFFF',
                  color: viewportMode === 'tablet' ? '#5A7D6C' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                <Tablet size={14} />
              </button>
              <button
                onClick={() => setViewportMode('mobile')}
                title="手機模式 (375px)"
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: viewportMode === 'mobile' ? '#5A7D6C' : '#E2E8F0',
                  backgroundColor: viewportMode === 'mobile' ? '#EBF2EE' : '#FFFFFF',
                  color: viewportMode === 'mobile' ? '#5A7D6C' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={14} />
              </button>
              <button
                onClick={() => setViewportMode('full')}
                title="滿版模式 (100%)"
                style={{
                  padding: '5px',
                  borderRadius: '4px',
                  border: '1px solid',
                  borderColor: viewportMode === 'full' ? '#5A7D6C' : '#E2E8F0',
                  backgroundColor: viewportMode === 'full' ? '#EBF2EE' : '#FFFFFF',
                  color: viewportMode === 'full' ? '#5A7D6C' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* 預覽 iframe 畫布容器 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#CBD5E1',
              overflow: 'auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '12px',
            }}
          >
            <div
              style={{
                width: previewWidthStyle,
                maxWidth: '100%',
                height: '100%',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                transition: 'width 0.2s ease',
              }}
            >
              {/* 安全隔離沙盒 Iframe */}
              <iframe
                key={refreshKey}
                srcDoc={compiledSrcDoc}
                title="CODE TO KNOW Practical Multi-Page Sandbox"
                sandbox="allow-scripts allow-forms"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 專用響應式樣式 */}
      <style>{`
        @media (max-width: 900px) {
          .sandbox-dual-container {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .mobile-pane-switcher {
            display: block !important;
          }
          .mobile-hidden {
            display: none !important;
          }
          .sandbox-editor-panel {
            height: 480px !important;
          }
          .sandbox-preview-panel {
            height: 520px !important;
          }
        }
      `}</style>
    </div>
  );
};
