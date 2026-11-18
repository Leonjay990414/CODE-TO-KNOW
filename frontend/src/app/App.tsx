import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { NavigationProvider, useNavigation } from '../context/NavigationContext';
import { HomePage } from '../pages/public/HomePage';
import { CertificationsPage } from '../pages/public/CertificationsPage';
import { CertificationDetailPage } from '../pages/public/CertificationDetailPage';
import { WebDesignCDemoPage } from '../pages/public/WebDesignCDemoPage';
import { TheoryPracticePage } from '../pages/public/TheoryPracticePage';
import { MockExamPage } from '../pages/public/MockExamPage';
import { PracticalLearningPage } from '../pages/public/PracticalLearningPage';
import { CodeEditorPage } from '../pages/public/CodeEditorPage';
import { AICoachPage } from '../pages/public/AICoachPage';
import { LearningProgressPage } from '../pages/public/LearningProgressPage';
import { StudentDashboardPage } from '../pages/public/StudentDashboardPage';
import { TeacherDashboardPage } from '../pages/public/TeacherDashboardPage';
import { AdminDashboardPage } from '../pages/public/AdminDashboardPage';
import { QuestionBankImportSystemPage } from '../pages/public/QuestionBankImportSystemPage';
import { StudentPracticalHubPage } from '../pages/student/practical';
import { SystemOpsDashboardPage } from '../pages/system-ops/SystemOpsDashboardPage';
import { LegalNoticePage } from '../pages/public/LegalNoticePage';
import { GameCenterPage } from '../pages/public/GameCenterPage';
import { AuthModal } from '../components/AuthModal';
import { TeacherApplyModal } from '../components/TeacherApplyModal';
import { ProtectedRoute, INTENDED_ROUTE_STORAGE_KEY } from '../components/ProtectedRoute';
import { useRouteSeo } from '../hooks/useRouteSeo';

// Lazy load 5 game pages with code-splitting
const CodePuzzlePage = lazy(() =>
  import('../pages/public/CodePuzzlePage').then((m) => ({ default: m.CodePuzzlePage }))
);
const CSSDesignerPage = lazy(() =>
  import('../pages/public/CSSDesignerPage').then((m) => ({ default: m.CSSDesignerPage }))
);
const BugHunterPage = lazy(() =>
  import('../pages/public/BugHunterPage').then((m) => ({ default: m.BugHunterPage }))
);
const QuizRushPage = lazy(() =>
  import('../pages/public/QuizRushPage').then((m) => ({ default: m.QuizRushPage }))
);
const WebBuilderPage = lazy(() =>
  import('../pages/public/WebBuilderPage').then((m) => ({ default: m.WebBuilderPage }))
);

export const GameLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="頁面與學習模組載入中"
    className="c2k-loading-screen"
    style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8, 32px) var(--space-4, 16px)',
      boxSizing: 'border-box',
      textAlign: 'center',
      backgroundColor: 'transparent',
    }}
  >
    {/* Ambient Glow & Card Container (Cream & Oat Warm Surface) */}
    <div
      className="c2k-loading-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        maxWidth: '380px',
        width: '100%',
        padding: '36px 28px',
        borderRadius: 'var(--radius-xl, 16px)',
        backgroundColor: 'var(--color-brand-cream, #FAF8F2)',
        border: '1px solid var(--color-brand-ice-slate, #D9E2EA)',
        boxShadow: '0 10px 30px -5px rgba(38, 52, 61, 0.06), 0 0 0 1px rgba(235, 229, 216, 0.6)',
        boxSizing: 'border-box',
      }}
    >
      {/* Academic Status Badge (Sage Green: #5A7D6C & #EBF2EE) */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '3px 10px',
          borderRadius: '12px',
          backgroundColor: 'var(--color-brand-sage-light, #EBF2EE)',
          color: 'var(--color-brand-sage, #5A7D6C)',
          fontSize: '11px',
          fontWeight: 600,
          marginBottom: '14px',
          border: '1px solid rgba(90, 125, 108, 0.2)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#5A7D6C',
          }}
        />
        智慧學習環境連線中
      </div>

      {/* Brand Logo with Warm Ivory & Oat Ambient Box */}
      <div
        className="c2k-loading-logo-box"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-brand-ivory, #F5F2EA)',
          border: '1px solid var(--color-brand-oat, #EBE5D8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 4px 14px rgba(189, 167, 126, 0.15)',
        }}
      >
        <div style={{ width: '36px', height: '36px' }}>
          <svg viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="碼上學 Logo">
            <path fill="#526B7B" d="M 140 48 C 84 48 40 84 40 128 C 40 172 84 208 140 208 C 149 208 156 201 156 192 C 156 183 149 176 140 176 C 102 176 70 154 70 128 C 70 102 102 80 140 80 C 149 80 156 73 156 64 C 156 55 149 48 140 48 Z"/>
            <path fill="#8FA9B8" d="M 130 126 C 135 121 143 121 148 126 L 194 172 C 200 178 200 186 194 192 C 188 198 180 198 174 192 L 130 148 C 124 142 124 132 130 126 Z"/>
            <path fill="#BDA77E" d="M 126 114 L 176 64 C 181 59 189 59 194 64 C 199 69 199 77 194 82 L 144 132 C 139 137 131 137 126 132 C 121 127 121 119 126 114 Z"/>
            <path fill="#BDA77E" d="M 200 38 C 200 48 194 54 184 56 C 194 58 200 64 200 74 C 200 64 206 58 216 56 C 206 54 200 48 200 38 Z"/>
          </svg>
        </div>
      </div>

      {/* Brand Title Lockup */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#26343D', letterSpacing: '0.02em', lineHeight: 1.2 }}>
          碼上學
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '2.5px', color: '#526B7B', marginTop: '3px' }}>
          CODE TO KNOW
        </div>
      </div>

      {/* Dynamic Brand Dual-Ring Loading Spinner */}
      <div style={{ position: 'relative', width: '48px', height: '48px', marginBottom: '18px' }}>
        {/* Outer Ring Background Track */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(217, 226, 234, 0.45)',
          }}
        />
        {/* Spinning Foreground Ring */}
        <div
          className="c2k-spinner-head"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid transparent',
            borderTopColor: '#BDA77E',
            borderRightColor: '#8FA9B8',
          }}
        />
        {/* Center Pulsing Ambient Dot */}
        <div
          className="c2k-spinner-center"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '8px',
            height: '8px',
            marginTop: '-4px',
            marginLeft: '-4px',
            borderRadius: '50%',
            backgroundColor: '#BDA77E',
          }}
        />
      </div>

      {/* Subtle Shimmer Hairline Progress */}
      <div
        style={{
          width: '140px',
          height: '2px',
          backgroundColor: 'rgba(143, 169, 184, 0.2)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '16px',
          position: 'relative',
        }}
      >
        <div
          className="c2k-shimmer-bar"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: '60px',
            background: 'linear-gradient(90deg, transparent, #BDA77E, transparent)',
          }}
        />
      </div>

      {/* Informative Status Message (High Contrast Deep Neutrals for WCAG AA) */}
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#26343D', marginBottom: '6px' }}>
        模組載入中，正在準備智慧學習環境...
      </div>
      <div style={{ fontSize: '11px', fontWeight: 500, color: '#526B7B', letterSpacing: '0.04em' }}>
        碼上學，學無止境。｜Learn Beyond Limits.
      </div>
    </div>

    {/* Dedicated Scoped CSS Animations */}
    <style>{`
      @keyframes c2k-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes c2k-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes c2k-shimmer {
        0% { transform: translateX(-60px); }
        100% { transform: translateX(140px); }
      }
      @keyframes c2k-center-pulse {
        0%, 100% { transform: scale(0.85); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      .c2k-loading-screen {
        animation: c2k-fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .c2k-spinner-head {
        animation: c2k-spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      .c2k-spinner-center {
        animation: c2k-center-pulse 1.8s ease-in-out infinite;
      }
      .c2k-shimmer-bar {
        animation: c2k-shimmer 1.5s ease-in-out infinite;
      }

      /* Accessibility: Honor reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        .c2k-loading-screen,
        .c2k-spinner-head,
        .c2k-spinner-center,
        .c2k-shimmer-bar {
          animation: none !important;
          transform: none !important;
        }
        .c2k-spinner-head {
          border-color: #BDA77E !important;
        }
        .c2k-shimmer-bar {
          display: none !important;
        }
      }

      /* Mobile responsiveness below 380px */
      @media (max-width: 380px) {
        .c2k-loading-card {
          padding: 24px 16px !important;
        }
      }
    `}</style>
  </div>
);

export const AppContent: React.FC = () => {
  const { route, navigate } = useNavigation();
  const { authModalOpen, authModalMode, openAuth, closeAuth, refreshUser } = useAuth();
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);

  // Sync dynamic SEO title and meta description
  useRouteSeo(route.page);

  const handleOpenTeacherApply = () => {
    setTeacherModalOpen(true);
  };

  const renderCurrentPage = () => {
    switch (route.page) {
      case 'certifications':
        return <CertificationsPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'certification-detail':
        return (
          <CertificationDetailPage
            certId={route.certId}
            onOpenTeacherApply={handleOpenTeacherApply}
          />
        );
      case 'web-design-demo':
        return <WebDesignCDemoPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'theory-practice':
        return <TheoryPracticePage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'mock-exam':
        return <MockExamPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'practical-learning':
        return <PracticalLearningPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'student-practical':
        return (
          <ProtectedRoute
            pageTitle="學生五大術科實作工作區 (Student Practical Hub)"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <StudentPracticalHubPage
              initialTaskId={route.taskId}
              initialView={route.practicalView}
              initialStep={route.taskStep}
              onOpenTeacherApply={handleOpenTeacherApply}
            />
          </ProtectedRoute>
        );
      case 'code-editor':
        return <CodeEditorPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'ai-coach':
        return <AICoachPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'learning-progress':
        return (
          <ProtectedRoute
            pageTitle="個人學習歷程與數據儀表板"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <LearningProgressPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'student-dashboard':
        return (
          <ProtectedRoute
            pageTitle="學生中心 (Student Hub)"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <StudentDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'teacher-dashboard':
        return (
          <ProtectedRoute
            requiredRoles={['TEACHER', 'ADMIN']}
            pageTitle="教師教學管理中心 (Educator Dashboard)"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <TeacherDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'admin-dashboard':
        return (
          <ProtectedRoute
            requiredRoles={['ADMIN']}
            pageTitle="平台管理員與系統營運後台 (Admin Console)"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <AdminDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'system-ops':
        return (
          <ProtectedRoute
            requiredRoles={['ADMIN']}
            pageTitle="系統營運與維運後台 (System Ops Console)"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <SystemOpsDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'import-system':
        return (
          <ProtectedRoute
            requiredRoles={['ADMIN']}
            pageTitle="官方證照題庫匯入與解析管理系統"
            onOpenTeacherApply={handleOpenTeacherApply}
          >
            <QuestionBankImportSystemPage onOpenTeacherApply={handleOpenTeacherApply} />
          </ProtectedRoute>
        );
      case 'legal':
        return (
          <LegalNoticePage
            initialTab={route.legalTab || 'privacy'}
            onOpenTeacherApply={handleOpenTeacherApply}
          />
        );
      case 'game-center':
        return <GameCenterPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'code-puzzle':
        return (
          <Suspense fallback={<GameLoadingFallback />}>
            <CodePuzzlePage onOpenTeacherApply={handleOpenTeacherApply} />
          </Suspense>
        );
      case 'css-designer':
        return (
          <Suspense fallback={<GameLoadingFallback />}>
            <CSSDesignerPage onOpenTeacherApply={handleOpenTeacherApply} />
          </Suspense>
        );
      case 'bug-hunter':
        return (
          <Suspense fallback={<GameLoadingFallback />}>
            <BugHunterPage onOpenTeacherApply={handleOpenTeacherApply} />
          </Suspense>
        );
      case 'quiz-rush':
        return (
          <Suspense fallback={<GameLoadingFallback />}>
            <QuizRushPage onOpenTeacherApply={handleOpenTeacherApply} />
          </Suspense>
        );
      case 'web-builder':
        return (
          <Suspense fallback={<GameLoadingFallback />}>
            <WebBuilderPage />
          </Suspense>
        );
      case 'home':
      default:
        return <HomePage onOpenTeacherApply={handleOpenTeacherApply} />;
    }
  };

  return (
    <>
      {renderCurrentPage()}

      {/* Global Central Authentication Modal (Login / Register / Forgot Password / Reset Password) */}
      <AuthModal
        isOpen={authModalOpen}
        mode={authModalMode}
        onClose={closeAuth}
        onSuccess={() => {
          refreshUser();
          try {
            const intended = sessionStorage.getItem(INTENDED_ROUTE_STORAGE_KEY);
            if (intended) {
              sessionStorage.removeItem(INTENDED_ROUTE_STORAGE_KEY);
              navigate(intended);
            }
          } catch {
            // Ignore storage access error
          }
        }}
      />

      {/* Global Teacher Accreditation Modal */}
      <TeacherApplyModal
        isOpen={teacherModalOpen}
        onClose={() => setTeacherModalOpen(false)}
        onOpenAuth={openAuth}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
};

export default App;
