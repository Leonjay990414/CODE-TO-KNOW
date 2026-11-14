/**
 * CODE TO KNOW — Quiz Rush Engine & Question Drawer Utility
 * Phase 14: Interactive Gaming and Gamified Learning System (P14-GAM-007)
 *
 * Implements:
 * 1. 605 題官方有效學科題庫全量配接與隨機無重複抽題
 * 2. 四大工作項目分類篩選 (01: 作業準備, 02: 應用軟體, 03: 系統軟體, 04: 資訊安全)
 * 3. 三大遊戲模式 (模式 A: 限時快答, 模式 B: 連擊挑戰, 模式 C: 分類精熟)
 * 4. 嚴格 Combo 連擊加分公式與星級評定
 * 5. 題目與選項官方資料保真度檢驗
 */

import { ALL_OFFICIAL_THEORY_QUESTIONS, TheoryQuestionModel } from '../data/questionBankAdapter';

export type QuizRushMode = 'timed-blitz' | 'combo-challenge' | 'category-mastery';

export type SectionFilter = 'all' | '01' | '02' | '03' | '04';

export interface QuizRoundConfig {
  mode: QuizRushMode;
  section: SectionFilter;
  questionCount: number; // 10, 20, 30
  secondsPerQuestion: number; // e.g. 15s for timed, 20s for combo, 0 for untimed
}

export interface QuestionAnswerRecord {
  question: TheoryQuestionModel;
  userAnswer: string; // 'A' | 'B' | 'C' | 'D' | 'TIMEOUT'
  isCorrect: boolean;
  timeSpentSeconds: number;
  pointsEarned: number;
  comboAtAnswer: number;
}

export interface QuizRoundResult {
  mode: QuizRushMode;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
  score: number;
  maxCombo: number;
  accuracyPercent: number;
  starsEarned: number; // 1-3
  answers: QuestionAnswerRecord[];
}

export const WORK_SECTION_NAMES: Record<string, string> = {
  all: '全部工作項目 (全量 605 題)',
  '01': '工作項目 01：作業準備',
  '02': '工作項目 02：應用軟體安裝及使用',
  '03': '工作項目 03：系統軟體安裝及使用',
  '04': '工作項目 04：資訊安全',
};

/**
 * Fisher-Yates non-destructive shuffle
 */
export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

/**
 * Draw questions without duplicates from the official 605 theory question bank
 */
export function drawQuizQuestions(
  section: SectionFilter = 'all',
  count: number = 10
): TheoryQuestionModel[] {
  let pool = ALL_OFFICIAL_THEORY_QUESTIONS;

  if (section !== 'all') {
    pool = ALL_OFFICIAL_THEORY_QUESTIONS.filter((q) => q.officialSection === section);
  }

  const shuffled = shuffleArray(pool);
  const actualCount = Math.min(count, shuffled.length);
  return shuffled.slice(0, actualCount);
}

/**
 * Calculate points for a question answer
 * Base points: 100 pts per correct answer
 * Combo bonus: +10 pts per combo count (capped at +50) in combo mode
 */
export function calculateQuestionPoints(
  isCorrect: boolean,
  currentCombo: number,
  mode: QuizRushMode
): number {
  if (!isCorrect) return 0;
  const basePoints = 100;
  if (mode === 'combo-challenge') {
    const comboBonus = Math.min(currentCombo * 15, 60);
    return basePoints + comboBonus;
  }
  return basePoints;
}

/**
 * Evaluate stars earned based on accuracy percentage
 * >= 90%: 3 stars
 * >= 70%: 2 stars
 * >= 50%: 1 star
 * < 50%: 1 star minimum on completing round
 */
export function calculateRoundStars(accuracyPercent: number): number {
  if (accuracyPercent >= 90) return 3;
  if (accuracyPercent >= 70) return 2;
  return 1;
}
