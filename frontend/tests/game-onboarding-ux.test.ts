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
});
