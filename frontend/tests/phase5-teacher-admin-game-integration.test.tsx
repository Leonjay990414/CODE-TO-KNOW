import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getAssignedGameTasks,
  assignGameTask,
  updateGameTask,
  revokeGameTask,
  hasTeacherAssignmentPermission,
  GAME_TYPE_METADATA,
} from '../src/utils/teacherGameTaskManager';
import {
  getAllGameSettings,
  updateGameSetting,
  resetAllGameSettings,
  hasAdminConfigPermission,
  DEFAULT_ADMIN_GAME_SETTINGS,
} from '../src/utils/adminGameConfigManager';
import { TeacherDashboardPage } from '../src/pages/public/TeacherDashboardPage';
import { AdminDashboardPage } from '../src/pages/public/AdminDashboardPage';
import { NavigationProvider } from '../src/context/NavigationContext';

// Mock in-memory localStorage for Node testing environment
const createMockStorage = () => {
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

const fakeStorage = createMockStorage();
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    localStorage: fakeStorage,
    location: { hash: '' },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
} else {
  (globalThis as any).window.localStorage = fakeStorage;
}

let mockAuthState: any = {
  user: { id: 'teacher-01', roles: ['TEACHER'], displayName: '王老師' },
  authStatus: 'authenticated',
  openAuth: vi.fn(),
};

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('../src/services/api', () => ({
  teacherApi: {
    getMyApplication: vi.fn().mockResolvedValue({
      success: true,
      data: {
        application: {
          id: 'app-01',
          schoolName: '測試技術高中',
          subject: '資訊科',
          status: 'APPROVED',
          reason: '教學需要',
          createdAt: '2026-11-01',
        },
      },
    }),
  },
  classroomApi: {
    getMyTeachingClassrooms: vi.fn().mockResolvedValue({
      success: true,
      data: {
        classrooms: [
          { id: 'class-01', name: '資訊一甲', joinCode: 'ABC12345', memberCount: 35 },
          { id: 'class-02', name: '資訊一乙', joinCode: 'XYZ98765', memberCount: 30 },
        ],
      },
    }),
    getClassroomMembers: vi.fn().mockResolvedValue({
      success: true,
      data: { members: [] },
    }),
  },
  adminApi: {
    listTeacherApplications: vi.fn().mockResolvedValue({
      success: true,
      data: { applications: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } },
    }),
    getAuditLogs: vi.fn().mockResolvedValue({
      success: true,
      data: { logs: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } },
    }),
    getHealth: vi.fn().mockResolvedValue({
      success: true,
      data: { status: 'healthy', database: 'connected', latencyMs: 12 },
    }),
  },
  clearApiCache: vi.fn(),
}));

describe('Phase 5 Integration: Teacher & Admin Game Governance (P14-GAM-014, P14-GAM-015)', () => {
  beforeEach(() => {
    fakeStorage.clear();
    vi.clearAllMocks();
    mockAuthState = {
      user: { id: 'teacher-01', roles: ['TEACHER'], displayName: '王老師' },
      authStatus: 'authenticated',
      openAuth: vi.fn(),
    };
  });

  describe('1. P14-GAM-014: Teacher Game Task Assignment Engine', () => {
    it('1.1 returns empty array when classroom has no assigned tasks', () => {
      const tasks = getAssignedGameTasks('class-test-01', 'teacher-01');
      expect(tasks).toEqual([]);
    });

    it('1.2 teacher creates a new game assignment with metadata and defaults', () => {
      const task = assignGameTask('class-test-01', {
        gameType: 'puzzle',
        levelId: 2,
        targetStars: 3,
        description: '請在週五前完成第二關卡組裝',
        teacherId: 'teacher-01',
      });

      expect(task.id).toBeDefined();
      expect(task.classroomId).toBe('class-test-01');
      expect(task.teacherId).toBe('teacher-01');
      expect(task.gameType).toBe('puzzle');
      expect(task.gameTitle).toBe(GAME_TYPE_METADATA.puzzle.name);
      expect(task.levelId).toBe(2);
      expect(task.targetStars).toBe(3);
      expect(task.isActive).toBe(true);
    });

    it('1.3 teacher reads previously created assignments', () => {
      assignGameTask('class-test-01', { gameType: 'puzzle', levelId: 1, teacherId: 'teacher-01' });
      assignGameTask('class-test-01', { gameType: 'css', levelId: 2, teacherId: 'teacher-01' });

      const list = getAssignedGameTasks('class-test-01', 'teacher-01');
      expect(list.length).toBe(2);
      expect(list[0].gameType).toBe('css');
      expect(list[1].gameType).toBe('puzzle');
    });

    it('1.4 teacher edits/updates an existing assignment', () => {
      const task = assignGameTask('class-test-01', {
        gameType: 'bug-hunter',
        levelId: 1,
        targetStars: 1,
        description: '初次指派',
        teacherId: 'teacher-01',
      });

      const updated = updateGameTask(
        'class-test-01',
        task.id,
        {
          targetStars: 3,
          description: '調整目標為三星',
          dueDate: '2026-12-01',
        },
        'teacher-01'
      );

      expect(updated).not.toBeNull();
      expect(updated?.targetStars).toBe(3);
      expect(updated?.description).toBe('調整目標為三星');
      expect(updated?.dueDate).toBe('2026-12-01');
      expect(updated?.updatedAt).toBeDefined();

      const refetched = getAssignedGameTasks('class-test-01', 'teacher-01');
      expect(refetched[0].targetStars).toBe(3);
    });

    it('1.5 teacher revokes an existing assignment', () => {
      const task1 = assignGameTask('class-test-01', { gameType: 'puzzle', levelId: 1, teacherId: 'teacher-01' });
      const task2 = assignGameTask('class-test-01', { gameType: 'css', levelId: 1, teacherId: 'teacher-01' });

      expect(getAssignedGameTasks('class-test-01', 'teacher-01').length).toBe(2);

      const revoked = revokeGameTask('class-test-01', task1.id, 'teacher-01');
      expect(revoked).toBe(true);

      const remaining = getAssignedGameTasks('class-test-01', 'teacher-01');
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(task2.id);
    });

    it('1.6 enforces strict data isolation between different teachers', () => {
      assignGameTask('class-shared', {
        gameType: 'puzzle',
        levelId: 1,
        teacherId: 'teacher-alice',
      });

      // Teacher Bob in the same classroom should not see Teacher Alice's tasks
      const bobTasks = getAssignedGameTasks('class-shared', 'teacher-bob');
      expect(bobTasks).toEqual([]);

      const aliceTasks = getAssignedGameTasks('class-shared', 'teacher-alice');
      expect(aliceTasks.length).toBe(1);
    });

    it('1.7 enforces strict data isolation between different classrooms', () => {
      assignGameTask('class-A', { gameType: 'puzzle', levelId: 1, teacherId: 'teacher-01' });
      assignGameTask('class-B', { gameType: 'quiz-rush', levelId: 3, teacherId: 'teacher-01' });

      const tasksA = getAssignedGameTasks('class-A', 'teacher-01');
      const tasksB = getAssignedGameTasks('class-B', 'teacher-01');

      expect(tasksA.length).toBe(1);
      expect(tasksA[0].gameType).toBe('puzzle');

      expect(tasksB.length).toBe(1);
      expect(tasksB[0].gameType).toBe('quiz-rush');
    });

    it('1.8 maintains backward compatibility with legacy single-key storage without teacherId', () => {
      const legacyData = [
        {
          id: 'legacy-task-99',
          classroomId: 'class-legacy',
          gameType: 'puzzle',
          gameTitle: 'Code Puzzle 程式邏輯拼圖',
          levelId: 2,
          targetStars: 2,
          assignedAt: '2026-11-01T00:00:00.000Z',
          dueDate: '2026-11-10',
          isActive: true,
        },
      ];
      fakeStorage.setItem('ctk_teacher_game_tasks:class-legacy', JSON.stringify(legacyData));

      // Reading with teacherId should fallback seamlessly to legacy key
      const tasks = getAssignedGameTasks('class-legacy', 'teacher-new');
      expect(tasks.length).toBe(1);
      expect(tasks[0].id).toBe('legacy-task-99');
      expect(tasks[0].gameTitle).toBe('Code Puzzle 程式邏輯拼圖');
    });

    it('1.9 checks teacher assignment permission strictly', () => {
      expect(hasTeacherAssignmentPermission('ADMIN')).toBe(true);
      expect(hasTeacherAssignmentPermission('PLATFORM_ADMIN')).toBe(true);
      expect(hasTeacherAssignmentPermission('TEACHER', 'APPROVED')).toBe(true);
      expect(hasTeacherAssignmentPermission('TEACHER', 'PENDING')).toBe(false);
      expect(hasTeacherAssignmentPermission('STUDENT')).toBe(false);
      expect(hasTeacherAssignmentPermission(undefined)).toBe(false);
    });

    it('1.10 safely recovers from corrupted JSON without crashing', () => {
      fakeStorage.setItem('ctk_teacher_game_tasks:teacher-01:class-corrupt', 'MALFORMED{NOT_VALID_JSON');
      const tasks = getAssignedGameTasks('class-corrupt', 'teacher-01');
      expect(tasks).toEqual([]);
    });
  });

  describe('2. P14-GAM-015: Admin Game Configuration Engine', () => {
    it('2.1 returns default game settings when no custom configs exist in storage', () => {
      const settings = getAllGameSettings();
      expect(settings.puzzle.isEnabled).toBe(true);
      expect(settings['quiz-rush'].timeLimitSeconds).toBe(10);
      expect(settings.css.tolerancePercentage).toBe(5);
      expect(settings.puzzle.scoreMultiplier).toBe(1.0);
    });

    it('2.2 admin updates game parameters within safe parameters', () => {
      const updated = updateGameSetting(
        'quiz-rush',
        {
          timeLimitSeconds: 15,
          scoreMultiplier: 1.5,
          isEnabled: true,
        },
        'ADMIN'
      );

      expect(updated.timeLimitSeconds).toBe(15);
      expect(updated.scoreMultiplier).toBe(1.5);

      const current = getAllGameSettings();
      expect(current['quiz-rush'].timeLimitSeconds).toBe(15);
      expect(current['quiz-rush'].scoreMultiplier).toBe(1.5);
    });

    it('2.3 clamps out-of-bound parameters to safe ranges', () => {
      const updated = updateGameSetting(
        'css',
        {
          timeLimitSeconds: 9999, // max 300
          tolerancePercentage: 888, // max 50
          scoreMultiplier: 99, // max 3.0
        },
        'ADMIN'
      );

      expect(updated.timeLimitSeconds).toBe(300);
      expect(updated.tolerancePercentage).toBe(50);
      expect(updated.scoreMultiplier).toBe(3.0);
    });

    it('2.4 clamps negative parameters to safe minimums', () => {
      const updated = updateGameSetting(
        'web-builder',
        {
          timeLimitSeconds: -10, // min 0
          tolerancePercentage: -5, // min 0
          scoreMultiplier: -1, // min 0.5
        },
        'ADMIN'
      );

      expect(updated.timeLimitSeconds).toBe(0);
      expect(updated.tolerancePercentage).toBe(0);
      expect(updated.scoreMultiplier).toBe(0.5);
    });

    it('2.5 rejects non-admin users from updating game settings', () => {
      expect(() => {
        updateGameSetting('puzzle', { isEnabled: false }, 'STUDENT');
      }).toThrowError('權限不足：僅有平台管理員可變更遊戲參數設定');

      expect(() => {
        updateGameSetting('puzzle', { isEnabled: false }, 'TEACHER');
      }).toThrowError('權限不足：僅有平台管理員可變更遊戲參數設定');
    });

    it('2.6 rejects non-admin users from resetting game settings', () => {
      expect(() => {
        resetAllGameSettings('STUDENT');
      }).toThrowError('權限不足：僅有平台管理員可重設遊戲參數');
    });

    it('2.7 admin resets all settings back to official defaults', () => {
      updateGameSetting('puzzle', { isEnabled: false }, 'ADMIN');
      expect(getAllGameSettings().puzzle.isEnabled).toBe(false);

      resetAllGameSettings('ADMIN');
      expect(getAllGameSettings().puzzle.isEnabled).toBe(true);
    });

    it('2.8 gracefully handles malformed JSON in admin storage with default fallback', () => {
      fakeStorage.setItem('ctk_admin_game_configs', 'INVALID_JSON_CORRUPTED');
      const settings = getAllGameSettings();
      expect(settings.puzzle.isEnabled).toBe(true);
      expect(settings['quiz-rush'].timeLimitSeconds).toBe(10);
    });

    it('2.9 validates admin config permission strictly', () => {
      expect(hasAdminConfigPermission('ADMIN')).toBe(true);
      expect(hasAdminConfigPermission('PLATFORM_ADMIN')).toBe(true);
      expect(hasAdminConfigPermission('admin')).toBe(true);
      expect(hasAdminConfigPermission('TEACHER')).toBe(false);
      expect(hasAdminConfigPermission('STUDENT')).toBe(false);
      expect(hasAdminConfigPermission(undefined)).toBe(false);
    });
  });

  describe('3. Page UI Integration Verification', () => {
    it('3.1 TeacherDashboardPage renders the game assignment prototype tab button and elements', () => {
      mockAuthState = {
        user: { id: 'teacher-01', roles: ['TEACHER'], displayName: '王老師' },
        authStatus: 'authenticated',
        openAuth: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <NavigationProvider>
          <TeacherDashboardPage />
        </NavigationProvider>
      );

      expect(html).toContain('遊戲化作業指派 (P14-GAM-014 展示原型)');
    });

    it('3.2 AdminDashboardPage renders the game configuration prototype tab button and elements', () => {
      mockAuthState = {
        user: { id: 'admin-01', roles: ['ADMIN'], role: 'ADMIN', displayName: '管理員' },
        authStatus: 'authenticated',
        openAuth: vi.fn(),
      };

      const html = renderToStaticMarkup(
        <NavigationProvider>
          <AdminDashboardPage />
        </NavigationProvider>
      );

      expect(html).toContain('遊戲化參數設定 (P14-GAM-015 本機原型)');
    });
  });
});
