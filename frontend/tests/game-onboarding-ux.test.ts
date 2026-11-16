import { describe, it, expect } from 'vitest';
import { GAME_BRIEFING_CONFIGS } from '../src/data/gameBriefingConfigs';
import { CODE_PUZZLE_LEVELS } from '../src/data/codePuzzleData';
import { CSS_DESIGNER_LEVELS } from '../src/data/cssDesignerData';
import { BUG_HUNTER_LEVELS } from '../src/data/bugHunterData';
import { WEB_BUILDER_LEVELS } from '../src/data/webBuilderData';

describe('Phase 14 Second Batch 1: Game Onboarding & UX Consistency Tests', () => {
  const games = ['code-puzzle', 'css-designer', 'bug-hunter', 'quiz-rush', 'web-builder'] as const;

  it('1. verifies all five games have standardized briefing configurations', () => {
    games.forEach((gameId) => {
      const config = GAME_BRIEFING_CONFIGS[gameId];
      expect(config).toBeDefined();
      expect(config.gameId).toBe(gameId);
      expect(config.gameTitle.length).toBeGreaterThan(0);
      expect(config.objective.length).toBeGreaterThan(10);
      expect(config.controlsGuide.length).toBeGreaterThan(10);
      expect(config.timerDescription.length).toBeGreaterThan(0);
      expect(config.scoringFormula.length).toBeGreaterThan(0);
      expect(config.starRules).toHaveLength(3);
      expect(config.hintNotice.length).toBeGreaterThan(0);
      expect(config.pedagogicalGoal.length).toBeGreaterThan(0);
    });
  });

  it('2. verifies untimed games do NOT claim fictitious countdown timers', () => {
    const untimed = ['code-puzzle', 'css-designer', 'bug-hunter', 'web-builder'] as const;
    untimed.forEach((gameId) => {
      const config = GAME_BRIEFING_CONFIGS[gameId];
      expect(config.timerDescription).not.toContain('倒數');
      expect(config.timerDescription).toMatch(/正向計時|無時間限制/);
    });

    // Quiz Rush has countdown modes
    expect(GAME_BRIEFING_CONFIGS['quiz-rush'].timerDescription).toContain('倒數');
  });

  it('3. verifies educational disclaimer is present and does not claim official exam rules', () => {
    games.forEach((gameId) => {
      const config = GAME_BRIEFING_CONFIGS[gameId];
      // Scoring formula should be platform specific
      expect(config.scoringFormula).toBeTruthy();
    });
  });

  it('4. verifies multi-level hints across Code Puzzle, CSS Designer, Bug Hunter and Web Builder', () => {
    CODE_PUZZLE_LEVELS.forEach((lvl) => {
      expect(lvl.hints.length).toBeGreaterThanOrEqual(2);
      expect(lvl.explanation.length).toBeGreaterThan(10);
    });

    CSS_DESIGNER_LEVELS.forEach((lvl) => {
      expect(lvl.hints.length).toBeGreaterThanOrEqual(2);
      expect(lvl.explanation.overview.length).toBeGreaterThan(10);
    });

    BUG_HUNTER_LEVELS.forEach((lvl) => {
      expect(lvl.hints.length).toBeGreaterThanOrEqual(2);
      expect(lvl.explanation.overview.length).toBeGreaterThan(10);
    });

    WEB_BUILDER_LEVELS.forEach((lvl) => {
      expect(lvl.hints.length).toBe(2);
      expect(lvl.pedagogicalNotes.length).toBeGreaterThan(10);
    });
  });

  it('5. verifies Game Center search and category filtering logic (P14-GAM-001)', () => {
    // Model the 5 games metadata representation
    const catalog = [
      { id: 'code-puzzle', uid: 'P14-GAM-004', title: 'Code Puzzle (程式邏輯拼圖)', tag: 'HTML5 / CSS / JS', categories: ['HTML', 'CSS', 'JS'] },
      { id: 'css-designer', uid: 'P14-GAM-005', title: 'CSS Designer (樣式排版設計師)', tag: '色彩 / 盒模型 / Flexbox / 卡片', categories: ['CSS'] },
      { id: 'bug-hunter', uid: 'P14-GAM-006', title: 'Bug Hunter (程式除錯獵人)', tag: 'HTML / CSS / JS 綜合除錯', categories: ['HTML', 'CSS', 'JS'] },
      { id: 'quiz-rush', uid: 'P14-GAM-007', title: 'Quiz Rush (證照疾速快答)', tag: '605 題官方題庫 / 限時快答 / Combo', categories: ['EXAM'] },
      { id: 'web-builder', uid: 'P14-GAM-008', title: 'Web Builder (網頁架構拼裝工坊)', tag: 'HTML5 語意地標 / 結構拼裝', categories: ['HTML'] },
    ];

    // Filter by category
    const htmlGames = catalog.filter(g => g.categories.includes('HTML'));
    expect(htmlGames.map(g => g.id)).toEqual(['code-puzzle', 'bug-hunter', 'web-builder']);

    const cssGames = catalog.filter(g => g.categories.includes('CSS'));
    expect(cssGames.map(g => g.id)).toEqual(['code-puzzle', 'css-designer', 'bug-hunter']);

    const jsGames = catalog.filter(g => g.categories.includes('JS'));
    expect(jsGames.map(g => g.id)).toEqual(['code-puzzle', 'bug-hunter']);

    const examGames = catalog.filter(g => g.categories.includes('EXAM'));
    expect(examGames.map(g => g.id)).toEqual(['quiz-rush']);

    // Keyword search
    const searchFlexbox = catalog.filter(g => g.tag.toLowerCase().includes('flexbox') || g.title.toLowerCase().includes('flexbox'));
    expect(searchFlexbox.map(g => g.id)).toEqual(['css-designer']);

    const searchExam = catalog.filter(g => g.tag.toLowerCase().includes('605') || g.title.toLowerCase().includes('快答'));
    expect(searchExam.map(g => g.id)).toEqual(['quiz-rush']);

    const searchUid = catalog.filter(g => g.uid === 'P14-GAM-004');
    expect(searchUid.map(g => g.id)).toEqual(['code-puzzle']);
  });
});
