import { describe, it, expect, beforeEach } from 'vitest';
import {
  ALL_PRACTICAL_TEACHING_MODULES,
  getTaskTeachingModule,
  TeachingModuleData,
} from '../src/data/practicalTeachingModules';
import {
  getOfficialTaskTemplate,
  getStudentProject,
  saveStudentProject,
  resetStudentProjectToStandard,
  compileMultiPagePreview,
} from '../src/utils/practicalSandboxEngine';

// Setup Mock LocalStorage for Node test environment
const createMockLocalStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => {
      store[key] = String(val);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof window === 'undefined') {
  (globalThis as any).window = globalThis;
}
const mockStorage = createMockLocalStorage();
(globalThis as any).localStorage = mockStorage;
(globalThis as any).window.localStorage = mockStorage;

describe('Practical Interactive Teaching System & Multi-Page Sandbox Suite (P13-PRAC-001 ~ 005)', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe('1. 13-Module Curriculum Coverage for All 5 Official Question Sets', () => {
    it('covers all five official tasks (104301 through 104305) with non-null 13 modules', () => {
      const validCodes = [
        '17300-104301',
        '17300-104302',
        '17300-104303',
        '17300-104304',
        '17300-104305',
      ];

      for (let taskId = 1; taskId <= 5; taskId++) {
        const mod: TeachingModuleData = ALL_PRACTICAL_TEACHING_MODULES[taskId];
        expect(mod).toBeDefined();
        expect(mod.taskId).toBe(taskId);
        expect(validCodes).toContain(mod.taskCode);
        expect(mod.title).toBeTruthy();
        expect(mod.difficulty).toMatch(/^★{1,3}☆{0,2}$/);
        expect(mod.estimatedMinutes).toBeGreaterThanOrEqual(60);

        // Module 1: Introduction
        expect(mod.module1_Introduction.overview).toBeTruthy();
        expect(mod.module1_Introduction.requirements.length).toBeGreaterThanOrEqual(3);

        // Module 2: Learning Goals
        expect(mod.module2_LearningGoals.length).toBeGreaterThanOrEqual(4);

        // Module 3: Site Architecture
        expect(mod.module3_SiteArchitecture.fileTree.length).toBeGreaterThanOrEqual(4);

        // Module 4: Preparation
        expect(mod.module4_Preparation.directorySpec).toContain('webXX');
        expect(mod.module4_Preparation.assets.length).toBeGreaterThanOrEqual(4);

        // Module 5: Step by Step Guide
        expect(mod.module5_StepByStepGuide.length).toBeGreaterThanOrEqual(2);

        // Module 6: HTML Deep Dive
        expect(mod.module6_HtmlDeepDive.content).toBeTruthy();
        expect(mod.module6_HtmlDeepDive.codeExamples.length).toBeGreaterThan(0);

        // Module 7: CSS Deep Dive
        expect(mod.module7_CssDeepDive.rules.length).toBeGreaterThan(0);

        // Module 8: JS Interactive
        expect(mod.module8_JsInteractive.title).toBeTruthy();

        // Module 9: PDF Knowledge Gaps
        expect(mod.module9_PdfGaps.length).toBeGreaterThan(0);
        expect(mod.module9_PdfGaps[0].topic).toBeTruthy();
        expect(mod.module9_PdfGaps[0].modernStandard).toBeTruthy();

        // Module 10: Video Insights
        expect(mod.module10_VideoInsights.length).toBeGreaterThanOrEqual(2);

        // Module 11: Traps & Troubleshooting
        expect(mod.module11_TrapsAndTroubleshooting.length).toBeGreaterThan(0);

        // Module 12: Quizzes & Checklist
        expect(mod.module12_QuizzesAndChecklist.checklist.length).toBeGreaterThanOrEqual(4);
        expect(mod.module12_QuizzesAndChecklist.quizzes.length).toBeGreaterThan(0);

        // Module 13: Final Preview & Audit
        expect(mod.module13_FinalPreviewAndAudit.completionChecklist.length).toBeGreaterThan(0);
      }
    });

    it('ensures each step in Module 5 contains all 12 mandatory educational components', () => {
      for (let taskId = 1; taskId <= 5; taskId++) {
        const mod = getTaskTeachingModule(taskId);
        mod.module5_StepByStepGuide.forEach((step) => {
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.title).toBeTruthy();
          expect(['GOV-REQ', 'PDF-SUM', 'VID-INS', 'STD-DOC', 'CTK-DES']).toContain(step.tag);
          expect(step.learningGoal).toBeTruthy();
          expect(step.prerequisites).toBeTruthy();
          expect(step.detailedProcess.length).toBeGreaterThanOrEqual(2);
          expect(step.criticalSettings.length).toBeGreaterThanOrEqual(1);
          expect(step.codeSnippet).toBeTruthy();
          expect(step.codeExplanation.length).toBeGreaterThanOrEqual(1);
          expect(step.expectedResult).toBeTruthy();
          expect(step.commonMistakes.length).toBeGreaterThanOrEqual(1);
          expect(step.troubleshooting.length).toBeGreaterThanOrEqual(1);
          expect(step.extendedKnowledge).toBeTruthy();

          // Quiz check
          expect(step.checkQuiz.question).toBeTruthy();
          expect(step.checkQuiz.options.length).toBe(4);
          expect(step.checkQuiz.correctIndex).toBeGreaterThanOrEqual(0);
          expect(step.checkQuiz.correctIndex).toBeLessThanOrEqual(3);
          expect(step.checkQuiz.explanation).toBeTruthy();
        });
      }
    });
  });

  describe('2. Multi-Page Virtual Sandbox Engine & File System', () => {
    it('generates multi-file project template for each task including HTML, CSS and subpages', () => {
      // Task 1: School Clubs
      const task1Proj = getOfficialTaskTemplate(1);
      expect(task1Proj.defaultEntryPath).toBe('index.html');
      expect(task1Proj.files['index.html']).toBeDefined();
      expect(task1Proj.files['main.html']).toBeDefined();
      expect(task1Proj.files['guitar_history.html']).toBeDefined();
      expect(task1Proj.files['guitar_event.html']).toBeDefined();
      expect(task1Proj.files['guitar_learning.html']).toBeDefined();
      expect(task1Proj.files['css/style.css']).toBeDefined();

      // Task 2: Sports Plaza
      const task2Proj = getOfficialTaskTemplate(2);
      expect(task2Proj.files['index.html']).toBeDefined();
      expect(task2Proj.files['results/baseball.html']).toBeDefined();
      expect(task2Proj.files['results/msgboard.html']).toBeDefined();

      // Task 3: National Park
      const task3Proj = getOfficialTaskTemplate(3);
      expect(task3Proj.files['index.html']).toBeDefined();
      expect(task3Proj.files['others/main.html']).toBeDefined();
      expect(task3Proj.files['park/yangmingshan.html']).toBeDefined();

      // Task 4: Online Shopping
      const task4Proj = getOfficialTaskTemplate(4);
      expect(task4Proj.files['index.html']).toBeDefined();
      expect(task4Proj.files['main.html']).toBeDefined();
      expect(task4Proj.files['results/purchase.html']).toBeDefined();

      // Task 5: Shuman Travel Album
      const task5Proj = getOfficialTaskTemplate(5);
      expect(task5Proj.files['index.html']).toBeDefined();
      expect(task5Proj.files['album5/album5.html']).toBeDefined();
    });

    it('isolates student modifications from standard answer template and supports save/reset', () => {
      const initialProject = getStudentProject(1);
      const originalIndexContent = initialProject.files['index.html'].content;

      // Student modifies index.html
      const modifiedProject = {
        ...initialProject,
        files: {
          ...initialProject.files,
          'index.html': {
            ...initialProject.files['index.html'],
            content: '<!-- Modified by Student --><h1>Custom Title</h1>',
          },
        },
      };

      // Save to localStorage
      saveStudentProject(modifiedProject);

      // Re-read student project: should return student modified version
      const reloaded = getStudentProject(1);
      expect(reloaded.files['index.html'].content).toContain('Custom Title');

      // Official standard template must remain pristine
      const pristineTemplate = getOfficialTaskTemplate(1);
      expect(pristineTemplate.files['index.html'].content).toBe(originalIndexContent);
      expect(pristineTemplate.files['index.html'].content).not.toContain('Custom Title');

      // Reset to standard
      const resetResult = resetStudentProjectToStandard(1);
      expect(resetResult.files['index.html'].content).toBe(originalIndexContent);

      const afterReset = getStudentProject(1);
      expect(afterReset.files['index.html'].content).toBe(originalIndexContent);
    });

    it('compiles multi-page preview with inlined CSS and link interceptor script', () => {
      const project = getOfficialTaskTemplate(1);
      const compiled = compileMultiPagePreview(project, 'index.html');

      // Must contain navigation interceptor script
      expect(compiled).toContain('C2K_SANDBOX_NAVIGATION');
      expect(compiled).toContain('document.addEventListener(\'click\'');

      // Must inline css/style.css
      expect(compiled).toContain('Inlined from css/style.css');
      expect(compiled).toContain('.layout-container');
    });

    it('resolves subpage compilation for standalone preview', () => {
      const project = getOfficialTaskTemplate(1);
      const subpageCompiled = compileMultiPagePreview(project, 'guitar_history.html');

      expect(subpageCompiled).toContain('吉他社社史');
      expect(subpageCompiled).toContain('target="_top"');
      expect(subpageCompiled).toContain('C2K_SANDBOX_NAVIGATION');
    });
  });
});
