import { describe, it, expect } from 'vitest';
import {
  VERSION_A_CURRICULUM,
  VERSION_B_CURRICULUM,
  TASK_5_ASSETS_INDEX,
} from '../src/data/task5CurriculumData';
import { OFFICIAL_PRACTICAL_TASKS } from '../src/data/practicalTasksData';

describe('Practical Task 5 ("書曼的旅遊相簿", 104305) Curriculum & Assets (P13-STU-007, P13-STU-008)', () => {
  it('includes Task 5 in OFFICIAL_PRACTICAL_TASKS with code 17300-104305', () => {
    const task5 = OFFICIAL_PRACTICAL_TASKS.find((t) => t.id === 5);
    expect(task5).toBeDefined();
    expect(task5?.code).toBe('17300-104305');
    expect(task5?.title).toContain('書曼的旅遊相簿');
    expect(task5?.canvasSpec.width).toBe('1024px');
  });

  it('contains exactly 25 official verified asset items in the index', () => {
    expect(TASK_5_ASSETS_INDEX.length).toBe(25);
    // Every asset should be marked verifiedExists: true
    TASK_5_ASSETS_INDEX.forEach((asset) => {
      expect(asset.verifiedExists).toBe(true);
      expect(asset.bytesLength).toBeGreaterThan(0);
      expect(asset.purpose).toBeTruthy();
    });
  });

  it('correctly indexes key critical assets (music, buttons, portrait, frame, album photos, animation sample)', () => {
    const filenames = TASK_5_ASSETS_INDEX.map((a) => a.filename);
    expect(filenames).toContain('0501.mp3'); // Background music
    expect(filenames).toContain('0507.jpg'); // Portrait
    expect(filenames).toContain('0509.jpg'); // Photo frame
    expect(filenames).toContain('0551.jpg'); // Album photo 1
    expect(filenames).toContain('0555.jpg'); // Album photo 5
    expect(filenames).toContain('範例0508.gif'); // Animation sample
    expect(filenames).toContain('0501b.gif'); // Kinmen default
    expect(filenames).toContain('0501r.gif'); // Kinmen hover
  });

  it('verifies Version A (Official Extended Material) contains 10 comprehensive steps and checklist', () => {
    expect(VERSION_A_CURRICULUM.versionId).toBe('A');
    expect(VERSION_A_CURRICULUM.isVerified).toBe(true);
    expect(VERSION_A_CURRICULUM.steps.length).toBe(10);
    expect(VERSION_A_CURRICULUM.selfChecklist.length).toBe(10);

    // Each step must contain explanations and purpose
    VERSION_A_CURRICULUM.steps.forEach((st, idx) => {
      expect(st.stepNumber).toBe(idx + 1);
      expect(st.title).toBeTruthy();
      expect(st.purpose).toBeTruthy();
      expect(st.htmlExplanation).toBeTruthy();
      expect(st.cssExplanation).toBeTruthy();
      expect(st.troubleshooting).toBeTruthy();
    });
  });

  it('verifies Version B (Video Walkthrough Framework) includes playlist and reference video links', () => {
    expect(VERSION_B_CURRICULUM.versionId).toBe('B');
    expect(VERSION_B_CURRICULUM.isVerified).toBe(false); // Honestly unverified streaming
    expect(VERSION_B_CURRICULUM.playlistUrl).toBe(
      'https://www.youtube.com/playlist?list=PLvb3m203I-S9Taljh638W8AddxiHS9h1D'
    );
    expect(VERSION_B_CURRICULUM.videoUrl).toBe('https://www.youtube.com/watch?v=TZ5EJatWres');
    expect(VERSION_B_CURRICULUM.steps.length).toBe(7);
  });
});
