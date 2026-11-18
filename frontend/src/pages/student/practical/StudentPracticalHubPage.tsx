import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { useAuth } from '../../../context/AuthContext';
import { useNavigation } from '../../../context/NavigationContext';
import {
  PracticalHomePage,
  PracticalDetailPage,
  PracticalLessonPage,
  PracticalSandboxPage,
} from './index';

interface StudentPracticalHubPageProps {
  initialTaskId?: number;
  initialView?: 'home' | 'detail' | 'lesson' | 'sandbox';
  initialStep?: number;
  onOpenTeacherApply?: () => void;
}

export const StudentPracticalHubPage: React.FC<StudentPracticalHubPageProps> = ({
  initialTaskId = 1,
  initialView = 'home',
  initialStep = 1,
  onOpenTeacherApply,
}) => {
  const { openAuth, user } = useAuth();
  const { goToHome, goToStudentDashboard, goToPracticalLearning, navigate } = useNavigation();

  const [activeTaskId, setActiveTaskId] = useState<number>(initialTaskId);
  const [subView, setSubView] = useState<'home' | 'detail' | 'lesson' | 'sandbox'>(initialView);
  const [lessonStepNumber, setLessonStepNumber] = useState<number>(initialStep);

  // Sync props when hash navigation updates parameters
  useEffect(() => {
    if (initialTaskId) setActiveTaskId(initialTaskId);
    if (initialView) setSubView(initialView);
    if (initialStep) setLessonStepNumber(initialStep);
  }, [initialTaskId, initialView, initialStep]);

  const updateSubView = (
    view: 'home' | 'detail' | 'lesson' | 'sandbox',
    taskId: number = activeTaskId,
    step: number = 1
  ) => {
    setActiveTaskId(taskId);
    setSubView(view);
    setLessonStepNumber(step);

    if (view === 'lesson') {
      navigate(`#student/practical/lesson?task=${taskId}&step=${step}`);
    } else if (view === 'sandbox') {
      navigate(`#student/practical/sandbox?task=${taskId}`);
    } else if (view === 'detail') {
      navigate(`#student/practical/detail?task=${taskId}`);
    } else {
      navigate('#student/practical');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--surface-base)' }}>
      <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

      <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
        {/* Header Breadcrumbs */}
        <section style={{ backgroundColor: 'var(--surface-base)', borderBottom: '1px solid var(--border-subtle)', padding: 'var(--space-6) 0' }}>
          <div className="container">
            <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '10px' }}>
              <a href="#hero" onClick={(e) => { e.preventDefault(); goToHome(); }}>首頁</a>
              <span>/</span>
              <a href="#student" onClick={(e) => { e.preventDefault(); goToStudentDashboard(); }}>學生中心</a>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>五大術科互動教學與沙箱</span>
              {subView !== 'home' && (
                <>
                  <span>/</span>
                  <span style={{ color: 'var(--color-brand-deep-slate)' }}>
                    題組 {activeTaskId} ({subView === 'detail' ? '模組解構' : subView === 'lesson' ? `第 ${lessonStepNumber} 步教學` : '多頁沙箱'})
                  </span>
                </>
              )}
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <span className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} color="#7C663D" />
                    <span>學生專屬實作環境 (Level 2)</span>
                  </span>
                  <span className="badge badge-neutral">已登入學生：{user?.displayName || '示範學員'}</span>
                  <span className="badge badge-neutral">17300 網頁設計丙級</span>
                </div>
                <h1 className="text-h2" style={{ fontSize: '24px', margin: 0 }}>
                  五大術科標準教學與多頁面編輯沙箱
                </h1>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {subView !== 'home' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => updateSubView('home')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ArrowLeft size={14} />
                    <span>返回題組清單</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => goToPracticalLearning()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <BookOpen size={14} />
                  <span>檢視官方規範與查核清冊</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content View Switching */}
        <div className="container" style={{ marginTop: '20px' }}>
          {subView === 'home' && (
            <PracticalHomePage
              onSelectTaskDetail={(id) => updateSubView('detail', id)}
              onOpenSandbox={(id) => updateSubView('sandbox', id)}
              onOpenLesson={(id, step) => updateSubView('lesson', id, step || 1)}
            />
          )}

          {subView === 'detail' && (
            <PracticalDetailPage
              taskId={activeTaskId}
              onBackToHome={() => updateSubView('home')}
              onOpenLesson={(id, step) => updateSubView('lesson', id, step || 1)}
              onOpenSandbox={(id) => updateSubView('sandbox', id)}
            />
          )}

          {subView === 'lesson' && (
            <PracticalLessonPage
              taskId={activeTaskId}
              initialStepNumber={lessonStepNumber}
              onBackToDetail={() => updateSubView('detail', activeTaskId)}
              onOpenSandbox={(id) => updateSubView('sandbox', id)}
            />
          )}

          {subView === 'sandbox' && (
            <PracticalSandboxPage
              initialTaskId={activeTaskId}
              onBackToHome={() => updateSubView('home')}
              onBackToDetail={(id) => updateSubView('detail', id)}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
