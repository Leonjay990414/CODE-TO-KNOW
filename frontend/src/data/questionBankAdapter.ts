/**
 * CODE TO KNOW (碼上學) - 官方全量學科題庫資料配接器 (Question Bank Adapter)
 * 將 officialTheoryQuestionBank.json (605 題官方有效題) 與既有 SAMPLE_THEORY_QUESTIONS (5 題深度解題)
 * 平滑整合為統一前端資料模型，支援依四大官方工作項目分類、即時搜尋、題號跳轉與錯題本無縫對接。
 */

import officialBankJson from './officialTheoryQuestionBank.json';
import { SAMPLE_THEORY_QUESTIONS, TheoryQuestion, QuestionOption } from './theoryQuestionsData';

export interface TheoryQuestionModel {
  id: string;
  officialNumber: number;
  officialSection: '01' | '02' | '03' | '04';
  sectionName: string;
  category: string;
  question: string;
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  officialPage: number;
  isVerified: boolean;
  hasDetailedExplanation: boolean;
  codeSnippet?: string;
  keyRule?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  aiHints?: {
    level1Focus: string;
    level2Strategy: string;
    level3Boundary: string;
    level4Breakdown: string;
  };
}

// 建立 5 題核心題的快速索引（以官方題號和章節匹配）
const sampleMap = new Map<number, TheoryQuestion>();
SAMPLE_THEORY_QUESTIONS.forEach((q) => {
  sampleMap.set(q.officialNumber, q);
});

/**
 * 完整轉換後的 605 題官方學科試題集
 */
export const ALL_OFFICIAL_THEORY_QUESTIONS: TheoryQuestionModel[] = (
  officialBankJson.questions as Array<{
    id: string;
    officialSection: string;
    sectionName: string;
    category: string;
    questionNumber: number;
    question: string;
    options: { A: string; B: string; C: string; D: string };
    correctAnswer: string;
    officialPage: number;
    isVerified: boolean;
  }>
).map((raw) => {
  const sample = sampleMap.get(raw.questionNumber);

  const opts: QuestionOption[] = [
    { key: 'A', text: raw.options.A },
    { key: 'B', text: raw.options.B },
    { key: 'C', text: raw.options.C },
    { key: 'D', text: raw.options.D },
  ];

  const ans = (['A', 'B', 'C', 'D'].includes(raw.correctAnswer) ? raw.correctAnswer : 'A') as 'A' | 'B' | 'C' | 'D';

  const defaultExplanation = `依據勞動部技能檢定 173003A17 官方規範，本題正確解答為 (${ans}) ${raw.options[ans]}（對應官方試題本第 ${raw.officialPage} 頁）。`;

  return {
    id: raw.id,
    officialNumber: raw.questionNumber,
    officialSection: raw.officialSection as '01' | '02' | '03' | '04',
    sectionName: raw.sectionName,
    category: raw.category,
    question: raw.question,
    options: opts,
    correctAnswer: ans,
    explanation: sample ? sample.explanation : defaultExplanation,
    officialPage: raw.officialPage,
    isVerified: raw.isVerified,
    hasDetailedExplanation: !!sample,
    codeSnippet: sample?.codeSnippet,
    keyRule: sample?.keyRule,
    difficulty: sample?.difficulty || 'medium',
    aiHints: sample?.aiHints,
  };
});

/**
 * 官方四大工作項目清單與各科題數統計
 */
export const OFFICIAL_SECTIONS_LIST = [
  { id: 'all', code: '00', label: '全部官方學科試題', count: ALL_OFFICIAL_THEORY_QUESTIONS.length },
  { id: '01', code: '01', label: '工作項目 01：作業準備', count: 236 },
  { id: '02', code: '02', label: '工作項目 02：應用軟體安裝及使用', count: 233 },
  { id: '03', code: '03', label: '工作項目 03：系統軟體安裝及使用', count: 71 },
  { id: '04', code: '04', label: '工作項目 04：資訊及安全', count: 65 },
];
