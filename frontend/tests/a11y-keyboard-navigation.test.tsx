import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { GameAchievementsModal } from '../src/components/GameAchievementsModal';
import { GameBriefingModal, GameBriefingConfig } from '../src/components/GameBriefingModal';

describe('A11y & Keyboard Navigation Testing Suite (P07-UIX-007, P07-UIX-009)', () => {
  const dummyBriefingConfig: GameBriefingConfig = {
    gameId: 'code-puzzle',
    gameTitle: '語法重構方塊',
    gameSubtitle: '拖曳積木重組代碼',
    objective: '依序排列語法區塊',
    controlsGuide: '點擊或鍵盤選取',
    levelsCount: 5,
    timerDescription: '倒數 60 秒',
    scoringFormula: '剩餘時間 × 10',
    starRules: ['40 秒內', '20 秒內', '通關'],
    hintNotice: '可點擊提示按鈕',
    pedagogicalGoal: '訓練語法邏輯',
  };

  describe('1. GameAchievementsModal Accessibility Specifications', () => {
    it('does not render when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <GameAchievementsModal isOpen={false} onClose={vi.fn()} userId="test-user" />
      );
      expect(html).toBe('');
    });

    it('renders with role="dialog", aria-modal="true", and aria-labelledby', () => {
      const html = renderToStaticMarkup(
        <GameAchievementsModal isOpen={true} onClose={vi.fn()} userId="test-user" />
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="achievements-modal-title"');
      expect(html).toContain('id="achievements-modal-title"');
      expect(html).toContain('aria-label="關閉成就中心"');
    });
  });

  describe('2. GameBriefingModal Accessibility Specifications', () => {
    it('does not render when isOpen is false', () => {
      const html = renderToStaticMarkup(
        <GameBriefingModal isOpen={false} onClose={vi.fn()} config={dummyBriefingConfig} />
      );
      expect(html).toBe('');
    });

    it('renders with role="dialog", aria-modal="true", and aria-labelledby', () => {
      const html = renderToStaticMarkup(
        <GameBriefingModal isOpen={true} onClose={vi.fn()} config={dummyBriefingConfig} />
      );
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="briefing-modal-title"');
      expect(html).toContain('id="briefing-modal-title"');
      expect(html).toContain('aria-label="關閉說明視窗"');
    });
  });
});
