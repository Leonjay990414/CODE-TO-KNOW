import React, { useState } from 'react';
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
import { QuestionBankImportSystemPage } from '../pages/public/QuestionBankImportSystemPage';
import { AuthModal } from '../components/AuthModal';
import { TeacherApplyModal } from '../components/TeacherApplyModal';
import { ProtectedRoute, INTENDED_ROUTE_STORAGE_KEY } from '../components/ProtectedRoute';

export const AppContent: React.FC = () => {
  const { route, navigate } = useNavigation();
  const { authModalOpen, authModalMode, openAuth, closeAuth, refreshUser } = useAuth();
  const [teacherModalOpen, setTeacherModalOpen] = useState(false);

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
