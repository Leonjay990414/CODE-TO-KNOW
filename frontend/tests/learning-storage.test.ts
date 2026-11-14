import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStorageKey,
  getPracticalProgress,
  toggleStepCompletion,
  toggleChecklistItem,
  resetPracticalProgress,
} from '../src/utils/learningStorage';

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

describe('Learning Progress Local Storage & Version Isolation (P13-STU-007, P13-STU-008)', () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it('generates consistent storage keys with user, task, and version isolation', () => {
    const keyA = getStorageKey('student1', 5, 'A');
    const keyB = getStorageKey('student1', 5, 'B');
    const keyGuest = getStorageKey('', 5, 'A');
    const keyDemo = getStorageKey('demo-student', 5, 'A');

    expect(keyA).toBe('ctk_practical_progress:student1:5:A');
    expect(keyB).toBe('ctk_practical_progress:student1:5:B');
    expect(keyGuest).toBe('ctk_practical_progress:guest-anonymous:5:A');
    expect(keyDemo).toBe('ctk_practical_progress:demo-student:5:A');
  });

  it('strictly isolates progress between Version A and Version B for the same task and user', () => {
    // Step 1 completed in Version A
    toggleStepCompletion('user_test', 5, 'A', 1);
    toggleStepCompletion('user_test', 5, 'A', 2);

    // Version A should have steps [1, 2]
    const progA = getPracticalProgress('user_test', 5, 'A');
    expect(progA.completedSteps).toEqual([1, 2]);

    // Version B should remain empty
    const progB = getPracticalProgress('user_test', 5, 'B');
    expect(progB.completedSteps).toEqual([]);

    // Now complete step 3 in Version B
    toggleStepCompletion('user_test', 5, 'B', 3);
    const progBUpdated = getPracticalProgress('user_test', 5, 'B');
    expect(progBUpdated.completedSteps).toEqual([3]);

    // Version A remains [1, 2]
    const progARecheck = getPracticalProgress('user_test', 5, 'A');
    expect(progARecheck.completedSteps).toEqual([1, 2]);
  });

  it('toggles step completion on and off correctly', () => {
    // Toggle on step 4
    const afterOn = toggleStepCompletion('u1', 5, 'A', 4);
    expect(afterOn.completedSteps).toContain(4);

    // Toggle off step 4
    const afterOff = toggleStepCompletion('u1', 5, 'A', 4);
    expect(afterOff.completedSteps).not.toContain(4);
  });

  it('toggles checklist items on and off correctly', () => {
    const item = '全站版面 1024x768 水平置中';
    const afterOn = toggleChecklistItem('u1', 5, 'A', item);
    expect(afterOn.completedChecklist).toContain(item);

    const afterOff = toggleChecklistItem('u1', 5, 'A', item);
    expect(afterOff.completedChecklist).not.toContain(item);
  });

  it('handles corrupted or invalid JSON in localStorage safely without throwing errors', () => {
    const key = getStorageKey('corrupt_user', 5, 'A');
    mockStorage.setItem(key, '{ invalid json: broken syntax ... ');

    const fallback = getPracticalProgress('corrupt_user', 5, 'A');
    expect(fallback).toBeDefined();
    expect(fallback.completedSteps).toEqual([]);
    expect(fallback.schemaVersion).toBe(1);
  });

  it('resets progress cleanly for a specific task and version', () => {
    toggleStepCompletion('u2', 5, 'A', 1);
    toggleChecklistItem('u2', 5, 'A', 'check 1');

    resetPracticalProgress('u2', 5, 'A');
    const afterReset = getPracticalProgress('u2', 5, 'A');
    expect(afterReset.completedSteps).toEqual([]);
    expect(afterReset.completedChecklist).toEqual([]);
  });
});
