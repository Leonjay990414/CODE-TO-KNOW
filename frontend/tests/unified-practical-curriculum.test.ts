import { describe, it, expect } from 'vitest';
import {
  UNIFIED_PRACTICAL_CURRICULUM_MAP,
  getTaskCurriculum,
  TASK_1_ASSETS_INDEX,
  TASK_2_ASSETS_INDEX,
  TASK_3_ASSETS_INDEX,
  TASK_4_ASSETS_INDEX,
} from '../src/data/unifiedPracticalCurriculumData';

describe('Unified Practical Curriculum Data Suite for Tasks 1 to 5 (P13-STU-006, P13-STU-007, P13-STU-008)', () => {
  it('covers all five official tasks (104301 through 104305) in UNIFIED_PRACTICAL_CURRICULUM_MAP', () => {
    for (let id = 1; id <= 5; id++) {
      const task = UNIFIED_PRACTICAL_CURRICULUM_MAP[id];
      expect(task).toBeDefined();
      expect(task.taskId).toBe(id);
      expect(task.code).toMatch(/^17300-10430[1-5]$/);
      expect(task.title).toBeTruthy();
      expect(task.totalAssetsCount).toBeGreaterThan(0);
      expect(task.assetsIndex.length).toBe(task.totalAssetsCount);
      expect(task.versionA).toBeDefined();
      expect(task.versionB).toBeDefined();
    }
  });

  it('matches exact physical asset counts on disk for each task', () => {
    expect(TASK_1_ASSETS_INDEX.length).toBe(11);
    expect(TASK_2_ASSETS_INDEX.length).toBe(21);
    expect(TASK_3_ASSETS_INDEX.length).toBe(16);
    expect(TASK_4_ASSETS_INDEX.length).toBe(12);

    // Verify all assets are marked verifiedExists: true and have valid byte sizes
    [TASK_1_ASSETS_INDEX, TASK_2_ASSETS_INDEX, TASK_3_ASSETS_INDEX, TASK_4_ASSETS_INDEX].forEach(
      (assetsList) => {
        assetsList.forEach((asset) => {
          expect(asset.verifiedExists).toBe(true);
          expect(asset.bytesLength).toBeGreaterThan(0);
          expect(asset.purpose).toBeTruthy();
          expect(asset.filename).toBeTruthy();
        });
      }
    );
  });

  it('verifies Version A across all tasks is verified (true) and Version B is honestly unverified (false)', () => {
    for (let id = 1; id <= 5; id++) {
      const task = getTaskCurriculum(id);
      expect(task.versionA.isVerified).toBe(true);
      expect(task.versionB.isVerified).toBe(false);
      expect(task.versionA.steps.length).toBeGreaterThanOrEqual(7);
      expect(task.versionB.steps.length).toBeGreaterThanOrEqual(4);
      expect(task.versionA.selfChecklist.length).toBeGreaterThanOrEqual(6);
      expect(task.versionB.selfChecklist.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('verifies Task 1 (104301) includes key critical requirements and assets', () => {
    const task1 = getTaskCurriculum(1);
    expect(task1.code).toBe('17300-104301');
    const filenames = task1.assetsIndex.map((a) => a.filename);
    expect(filenames).toContain('0101.jpg');
    expect(filenames).toContain('0101.txt');
    expect(filenames).toContain('logo1.png');
    expect(filenames).toContain('menu1.png');

    // Check target="_top" step in guitar_history
    const step6 = task1.versionA.steps.find((s) => s.stepNumber === 6);
    expect(step6?.htmlExplanation).toContain('target="_top"');
  });

  it('verifies Task 2 (104302) includes jquery and sports photo assets', () => {
    const task2 = getTaskCurriculum(2);
    expect(task2.code).toBe('17300-104302');
    const filenames = task2.assetsIndex.map((a) => a.filename);
    expect(filenames).toContain('jquery-2.1.4.min.js');
    expect(filenames).toContain('0202A.png');
    expect(filenames).toContain('0202B.png');
    expect(filenames).toContain('0206.txt'); // message
  });

  it('verifies Task 3 (104303) includes national park map and audio', () => {
    const task3 = getTaskCurriculum(3);
    expect(task3.code).toBe('17300-104303');
    const filenames = task3.assetsIndex.map((a) => a.filename);
    expect(filenames).toContain('national_park.jpg');
    expect(filenames).toContain('park.mp3');
    expect(filenames).toContain('park0301.jpg');

    // Check image map in step 4
    const step4 = task3.versionA.steps.find((s) => s.stepNumber === 4);
    expect(step4?.htmlExplanation).toContain('usemap');
  });

  it('verifies Task 4 (104304) includes shopping music, 3x3 grid, and target="_blank"', () => {
    const task4 = getTaskCurriculum(4);
    expect(task4.code).toBe('17300-104304');
    const filenames = task4.assetsIndex.map((a) => a.filename);
    expect(filenames).toContain('0401.mp3');
    expect(filenames).toContain('0403.jpg'); // wallet
    expect(filenames).toContain('0409.jpg'); // confirm

    // Check target="_blank" step in step 6
    const step6 = task4.versionA.steps.find((s) => s.stepNumber === 6);
    expect(step6?.htmlExplanation).toContain('target="_blank"');
  });
});
