import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppPage =
  | 'home'
  | 'certifications'
  | 'certification-detail'
  | 'web-design-demo'
  | 'theory-practice'
  | 'mock-exam'
  | 'practical-learning'
  | 'student-practical'
  | 'code-editor'
  | 'ai-coach'
  | 'learning-progress'
  | 'student-dashboard'
  | 'teacher-dashboard'
  | 'admin-dashboard'
  | 'system-ops'
  | 'import-system'
  | 'legal'
  | 'game-center'
  | 'code-puzzle'
  | 'css-designer'
  | 'bug-hunter'
  | 'quiz-rush'
  | 'web-builder';

export interface RouteState {
  page: AppPage;
  certId?: string;
  taskId?: number;
  taskStep?: number;
  practicalView?: 'home' | 'detail' | 'lesson' | 'sandbox';
  legalTab?: 'privacy' | 'terms' | 'ethics';
  hash: string;
}

interface NavigationContextType {
  route: RouteState;
  navigate: (targetHash: string) => void;
  goToHome: (sectionId?: string) => void;
  goToCertifications: () => void;
  goToCertificationDetail: (certId: string) => void;
  goToWebDesignDemo: () => void;
  goToTheoryPractice: (certId?: string) => void;
  goToMockExam: (certId?: string) => void;
  goToPracticalLearning: (certId?: string) => void;
  goToStudentPractical: (taskId?: number, view?: 'home' | 'detail' | 'lesson' | 'sandbox', step?: number) => void;
  goToCodeEditor: (taskId?: number) => void;
  goToAICoach: () => void;
  goToLearningProgress: () => void;
  goToStudentDashboard: () => void;
  goToTeacherDashboard: () => void;
  goToAdminDashboard: () => void;
  goToSystemOps: () => void;
  goToImportSystem: () => void;
  goToLegalNotice: (tab?: 'privacy' | 'terms' | 'ethics') => void;
  goToGameCenter: () => void;
  goToCodePuzzle: () => void;
  goToCSSDesigner: () => void;
  goToBugHunter: () => void;
  goToQuizRush: () => void;
  goToWebBuilder: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function parseHash(rawHash: string): RouteState {
  const hash = rawHash.replace(/^#\/?/, '').trim();

  if (!hash || ['hero', 'story', 'experience', 'ai-learning', 'dual-audience'].includes(hash)) {
    return { page: 'home', hash: rawHash };
  }

  // Route: Legal notices (#privacy, #terms, #legal, #ethics)
  if (hash === 'privacy' || hash === 'legal/privacy') {
    return { page: 'legal', legalTab: 'privacy', hash: rawHash };
  }
  if (hash === 'terms' || hash === 'legal/terms' || hash === 'tos') {
    return { page: 'legal', legalTab: 'terms', hash: rawHash };
  }
  if (hash === 'legal' || hash === 'ethics' || hash === 'legal/ethics' || hash === 'ai-ethics') {
    return { page: 'legal', legalTab: 'ethics', hash: rawHash };
  }

  // Route: certifications/web-design-c/demo
  if (hash === 'certifications/web-design-c/demo' || hash === 'web-design-demo') {
    return { page: 'web-design-demo', certId: 'web-design-c', hash: rawHash };
  }

  // Route: theory practice
  if (hash === 'theory' || hash === 'theory-learning' || hash.includes('/theory')) {
    return { page: 'theory-practice', certId: 'web-design-c', hash: rawHash };
  }

  // Route: mock exam
  if (hash === 'mock-exam' || hash.includes('/mock-exam')) {
    return { page: 'mock-exam', certId: 'web-design-c', hash: rawHash };
  }

  // Route: student practical interactive hub (Protected Level 2)
  if (hash.startsWith('student/practical') || hash.startsWith('student-practical')) {
    let practicalView: 'home' | 'detail' | 'lesson' | 'sandbox' = 'home';
    let taskId = 1;
    let taskStep: number | undefined = undefined;

    if (hash.includes('/detail')) {
      practicalView = 'detail';
    } else if (hash.includes('/lesson')) {
      practicalView = 'lesson';
    } else if (hash.includes('/sandbox')) {
      practicalView = 'sandbox';
    }

    const matchTask = hash.match(/[?&]task=(\d+)/);
    if (matchTask) {
      taskId = parseInt(matchTask[1], 10);
      if (practicalView === 'home') practicalView = 'detail';
    }

    const matchStep = hash.match(/[?&]step=(\d+)/);
    if (matchStep) {
      taskStep = parseInt(matchStep[1], 10);
      practicalView = 'lesson';
    }

    return {
      page: 'student-practical',
      certId: 'web-design-c',
      taskId,
      practicalView,
      taskStep,
      hash: rawHash,
    };
  }

  // Route: practical learning (Public Level 1 & Spec Overview)
  if (hash === 'practical' || hash === 'practical-learning' || hash.includes('/practical')) {
    return { page: 'practical-learning', certId: 'web-design-c', hash: rawHash };
  }

  // Route: code editor
  if (hash.startsWith('code-editor') || hash.startsWith('editor')) {
    const parts = hash.split('?task=');
    const taskId = parts[1] ? parseInt(parts[1], 10) : 1;
    return { page: 'code-editor', certId: 'web-design-c', taskId, hash: rawHash };
  }

  // Route: AI coach
  if (hash === 'ai-coach' || hash === 'coach') {
    return { page: 'ai-coach', hash: rawHash };
  }

  // Route: learning progress
  if (hash === 'progress' || hash === 'learning-progress') {
    return { page: 'learning-progress', hash: rawHash };
  }

  // Route: student center
  if (hash === 'student' || hash === 'student-dashboard') {
    return { page: 'student-dashboard', hash: rawHash };
  }

  // Route: teacher center
  if (hash === 'teacher' || hash === 'teacher-dashboard') {
    return { page: 'teacher-dashboard', hash: rawHash };
  }

  // Route: admin center
  if (hash === 'admin' || hash === 'admin-dashboard') {
    return { page: 'admin-dashboard', hash: rawHash };
  }

  // Route: system operations & telemetry (L5 Ops Console)
  if (hash === 'ops' || hash === 'system-ops' || hash === 'system-operations') {
    return { page: 'system-ops', hash: rawHash };
  }

  // Route: certifications/:id
  if (hash.startsWith('certifications/')) {
    const certId = hash.replace('certifications/', '').split('?')[0];
    if (certId === 'web-design-c/demo') {
      return { page: 'web-design-demo', certId: 'web-design-c', hash: rawHash };
    }
    return { page: 'certification-detail', certId, hash: rawHash };
  }

  // Route: interactive game center & code puzzle
  if (hash === 'games' || hash === 'game-center' || hash === 'games-center') {
    return { page: 'game-center', hash: rawHash };
  }
  if (hash === 'games/code-puzzle' || hash === 'code-puzzle') {
    return { page: 'code-puzzle', hash: rawHash };
  }
  if (hash === 'games/css-designer' || hash === 'css-designer') {
    return { page: 'css-designer', hash: rawHash };
  }
  if (hash === 'games/bug-hunter' || hash === 'bug-hunter') {
    return { page: 'bug-hunter', hash: rawHash };
  }
  if (hash === 'games/quiz-rush' || hash === 'quiz-rush') {
    return { page: 'quiz-rush', hash: rawHash };
  }
  if (hash === 'games/web-builder' || hash === 'web-builder') {
    return { page: 'web-builder', hash: rawHash };
  }

  // Route: certifications overview
  if (hash === 'certifications') {
    return { page: 'certifications', hash: rawHash };
  }

  // Route: question bank import & sources system
  if (hash === 'sources' || hash === 'import-system' || hash === 'question-bank') {
    return { page: 'import-system', hash: rawHash };
  }

  return { page: 'home', hash: rawHash };
}

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteState>(() => parseHash(window.location.hash));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash(window.location.hash));
      // Scroll to top when changing full pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (targetHash: string) => {
    const normalized = targetHash.startsWith('#') ? targetHash : `#${targetHash}`;
    window.location.hash = normalized;
  };

  const goToHome = (sectionId?: string) => {
    if (sectionId) {
      navigate(`#${sectionId}`);
    } else {
      navigate('#hero');
    }
  };

  const goToCertifications = () => {
    navigate('#certifications');
  };

  const goToCertificationDetail = (certId: string) => {
    navigate(`#certifications/${certId}`);
  };

  const goToWebDesignDemo = () => {
    navigate('#certifications/web-design-c/demo');
  };

  const goToTheoryPractice = (certId: string = 'web-design-c') => {
    navigate(`#certifications/${certId}/theory`);
  };

  const goToMockExam = (certId: string = 'web-design-c') => {
    navigate(`#certifications/${certId}/mock-exam`);
  };

  const goToPracticalLearning = (certId: string = 'web-design-c') => {
    navigate(`#certifications/${certId}/practical`);
  };

  const goToStudentPractical = (
    taskId: number = 1,
    view: 'home' | 'detail' | 'lesson' | 'sandbox' = 'home',
    step?: number
  ) => {
    if (view === 'lesson' && step) {
      navigate(`#student/practical/lesson?task=${taskId}&step=${step}`);
    } else if (view === 'sandbox') {
      navigate(`#student/practical/sandbox?task=${taskId}`);
    } else if (view === 'detail') {
      navigate(`#student/practical/detail?task=${taskId}`);
    } else {
      navigate('#student/practical');
    }
  };

  const goToCodeEditor = (taskId: number = 1) => {
    navigate(`#code-editor?task=${taskId}`);
  };

  const goToAICoach = () => {
    navigate('#ai-coach');
  };

  const goToLearningProgress = () => {
    navigate('#progress');
  };

  const goToStudentDashboard = () => {
    navigate('#student');
  };

  const goToTeacherDashboard = () => {
    navigate('#teacher');
  };

  const goToAdminDashboard = () => {
    navigate('#admin');
  };

  const goToSystemOps = () => {
    navigate('#ops');
  };

  const goToImportSystem = () => {
    navigate('#sources');
  };

  const goToLegalNotice = (tab: 'privacy' | 'terms' | 'ethics' = 'privacy') => {
    if (tab === 'terms') {
      navigate('#terms');
    } else if (tab === 'ethics') {
      navigate('#legal');
    } else {
      navigate('#privacy');
    }
  };

  const goToGameCenter = () => {
    navigate('#games');
  };

  const goToCodePuzzle = () => {
    navigate('#games/code-puzzle');
  };

  const goToCSSDesigner = () => {
    navigate('#games/css-designer');
  };

  const goToBugHunter = () => {
    navigate('#games/bug-hunter');
  };

  const goToQuizRush = () => {
    navigate('#games/quiz-rush');
  };

  const goToWebBuilder = () => {
    navigate('#games/web-builder');
  };

  return (
    <NavigationContext.Provider
      value={{
        route,
        navigate,
        goToHome,
        goToCertifications,
        goToCertificationDetail,
        goToWebDesignDemo,
        goToTheoryPractice,
        goToMockExam,
        goToPracticalLearning,
        goToStudentPractical,
        goToCodeEditor,
        goToAICoach,
        goToLearningProgress,
        goToStudentDashboard,
        goToTeacherDashboard,
        goToAdminDashboard,
        goToSystemOps,
        goToImportSystem,
        goToLegalNotice,
        goToGameCenter,
        goToCodePuzzle,
        goToCSSDesigner,
        goToBugHunter,
        goToQuizRush,
        goToWebBuilder,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
