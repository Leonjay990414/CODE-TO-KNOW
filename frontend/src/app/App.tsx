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

const AppContent: React.FC = () => {
  const { route } = useNavigation();
  const { authModalOpen, authModalMode, openAuth, closeAuth } = useAuth();
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
        return <LearningProgressPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'student-dashboard':
        return <StudentDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'teacher-dashboard':
        return <TeacherDashboardPage onOpenTeacherApply={handleOpenTeacherApply} />;
      case 'import-system':
        return <QuestionBankImportSystemPage onOpenTeacherApply={handleOpenTeacherApply} />;
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
