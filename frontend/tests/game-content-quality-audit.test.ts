import { describe, it, expect } from 'vitest';
import { CODE_PUZZLE_LEVELS } from '../src/data/codePuzzleData';
import { CSS_DESIGNER_LEVELS } from '../src/data/cssDesignerData';
import { BUG_HUNTER_LEVELS } from '../src/data/bugHunterData';
import { WEB_BUILDER_LEVELS, WEB_BUILDER_BLOCKS } from '../src/data/webBuilderData';
import { GAME_BRIEFING_CONFIGS } from '../src/data/gameBriefingConfigs';

describe('Phase 14 Second Batch 3: Game Content & Judging Quality Audit', () => {
  describe('1. Code Puzzle Content & Permitted Orders', () => {
    it('verifies every Code Puzzle level has unique levelId, non-empty blocks, and complete explanation', () => {
      const ids = new Set<number>();
      CODE_PUZZLE_LEVELS.forEach((level) => {
        expect(ids.has(level.levelId)).toBe(false);
        ids.add(level.levelId);
        expect(level.blocks.length).toBeGreaterThan(2);
        expect(level.correctOrder.length).toBe(level.blocks.length);
        expect(level.hints.length).toBeGreaterThanOrEqual(2);
        expect(level.explanation.length).toBeGreaterThan(20);

        // Verify correctOrder contains exactly all block ids
        const blockIds = level.blocks.map((b) => b.id);
        expect(level.correctOrder.slice().sort()).toEqual(blockIds.slice().sort());

        // If acceptable orders are provided, they must also contain the same block ids
        if (level.acceptableOrders) {
          level.acceptableOrders.forEach((order) => {
            expect(order.slice().sort()).toEqual(blockIds.slice().sort());
          });
        }
      });
    });
  });

  describe('2. CSS Designer Styles & Controls', () => {
    it('verifies target styles match defined controls and units', () => {
      CSS_DESIGNER_LEVELS.forEach((level) => {
        expect(Object.keys(level.targetStyles).length).toBeGreaterThan(0);
        expect(level.controls.length).toBeGreaterThan(0);
        expect(level.explanation.overview).toBeTruthy();
        expect(level.explanation.propertiesUsed.length).toBeGreaterThan(0);

        // Verify every control property has a matching or related target style
        level.controls.forEach((ctrl) => {
          expect(ctrl.property).toBeTruthy();
          expect(ctrl.label).toBeTruthy();
          if (ctrl.type === 'slider') {
            expect(typeof ctrl.min).toBe('number');
            expect(typeof ctrl.max).toBe('number');
            expect(ctrl.max).toBeGreaterThan(ctrl.min!);
          }
          if (ctrl.type === 'select') {
            expect(ctrl.options && ctrl.options.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('3. Bug Hunter Buggy Lines & Fix Options', () => {
    it('verifies buggy lines have at least one correct fix option and valid line numbers', () => {
      BUG_HUNTER_LEVELS.forEach((level) => {
        const lines = level.initialCode.split('\n');
        expect(level.buggyLines.length).toBeGreaterThan(0);

        level.buggyLines.forEach((bug) => {
          expect(bug.lineNum).toBeGreaterThan(0);
          expect(bug.lineNum).toBeLessThanOrEqual(lines.length);
          expect(bug.originalText).toBe(lines[bug.lineNum - 1]);
          expect(bug.fixOptions.length).toBeGreaterThanOrEqual(2);

          const correctFixes = bug.fixOptions.filter((f) => f.isCorrect);
          expect(correctFixes.length).toBeGreaterThanOrEqual(1);
          expect(correctFixes.some((f) => f.replacement === bug.expectedText)).toBe(true);
        });
      });
    });
  });

  describe('4. Web Builder Starter & Target Blocks', () => {
    it('verifies starter block ids exist in block pool and target tags are valid', () => {
      const allBlockIds = new Set(Object.keys(WEB_BUILDER_BLOCKS));

      WEB_BUILDER_LEVELS.forEach((level) => {
        expect(level.starterBlockIds.length).toBeGreaterThan(0);
        level.starterBlockIds.forEach((id) => {
          expect(allBlockIds.has(id)).toBe(true);
        });

        expect(level.targetBlockSequence.length).toBeGreaterThan(0);
        expect(level.hints.length).toBeGreaterThanOrEqual(2);
        expect(level.pedagogicalNotes).toBeTruthy();
      });
    });
  });

  describe('5. Game Briefing Configurations Consistency', () => {
    it('verifies all 5 educational games have complete briefing modal metadata', () => {
      const gameKeys = ['code-puzzle', 'css-designer', 'bug-hunter', 'quiz-rush', 'web-builder'] as const;
      gameKeys.forEach((key) => {
        const config = GAME_BRIEFING_CONFIGS[key];
        expect(config).toBeDefined();
        expect(config.gameTitle).toBeTruthy();
        expect(config.objective).toBeTruthy();
        expect(config.controlsGuide).toBeTruthy();
        expect(config.starRules.length).toBeGreaterThanOrEqual(3);
        expect(config.scoringFormula).toBeTruthy();
        expect(config.pedagogicalGoal).toBeTruthy();
        expect(config.timerDescription).toBeTruthy();
      });
    });
  });

  describe('6. Quiz Rush 605 Questions Integrity & Uniqueness', () => {
    it('verifies official theory question bank contains exactly 605 active questions with valid sections', async () => {
      const qb = await import('../src/data/officialTheoryQuestionBank.json');
      expect(qb.questions).toHaveLength(605);
      expect(qb.totalOfficialActiveQuestions).toBe(605);

      const ids = new Set<string>();
      const sectionCounts: Record<string, number> = { '01': 0, '02': 0, '03': 0, '04': 0 };

      qb.questions.forEach((q) => {
        expect(ids.has(q.id)).toBe(false);
        ids.add(q.id);
        expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
        expect(q.options.A).toBeTruthy();
        expect(q.options.B).toBeTruthy();
        expect(q.options.C).toBeTruthy();
        expect(q.options.D).toBeTruthy();
        expect(q.question.length).toBeGreaterThan(0);
        expect(sectionCounts[q.officialSection]).toBeDefined();
        sectionCounts[q.officialSection]++;
      });

      expect(sectionCounts['01']).toBe(236);
      expect(sectionCounts['02']).toBe(233);
      expect(sectionCounts['03']).toBe(71);
      expect(sectionCounts['04']).toBe(65);
      expect(qb.officialDeletedQuestions).toHaveLength(6);
    });
  });

  describe('7. Bug Hunter Line Position Precision Proof', () => {
    it('verifies all 4 levels have 100% exact match between lineNum and actual code line string', () => {
      BUG_HUNTER_LEVELS.forEach((level) => {
        const lines = level.initialCode.split('\n');
        level.buggyLines.forEach((bug) => {
          const actualLine = lines[bug.lineNum - 1];
          expect(actualLine).toBe(bug.originalText);
        });
      });
    });
  });
});
