import { describe, it, expect } from 'vitest';
import officialQuestionBank from '../src/data/officialTheoryQuestionBank.json';

describe('Official Theory Question Bank (173003A17) Offline Extraction Suite (P13-STU-003, P13-STU-004)', () => {
  it('loads valid metadata matching official 173003A17 standard', () => {
    expect(officialQuestionBank.version).toBe('V115100817');
    expect(officialQuestionBank.sourceDoc).toBe('173003A17.pdf');
    expect(officialQuestionBank.totalOfficialActiveQuestions).toBe(605);
    expect(officialQuestionBank.historicalMaxQuestionNumber).toBe(611);
    expect(officialQuestionBank.officialDeletedQuestions.length).toBe(6);
  });

  it('contains exactly 605 active, non-empty, fully parsed questions', () => {
    expect(officialQuestionBank.questions.length).toBe(605);

    officialQuestionBank.questions.forEach((q) => {
      // ID format
      expect(q.id).toMatch(/^q17300-0[1-4]-\d{3}$/);
      expect(q.questionNumber).toBeGreaterThan(0);
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(['A', 'B', 'C', 'D']).toContain(q.correctAnswer);
      expect(q.officialPage).toBeGreaterThanOrEqual(2);
      expect(q.officialPage).toBeLessThanOrEqual(39);
      expect(q.isVerified).toBe(true);

      // Options
      expect(q.options.A.trim().length).toBeGreaterThan(0);
      expect(q.options.B.trim().length).toBeGreaterThan(0);
      expect(q.options.C.trim().length).toBeGreaterThan(0);
      expect(q.options.D.trim().length).toBeGreaterThan(0);
    });
  });

  it('correctly maps to the four official syllabus sections without missing any section', () => {
    const sec1 = officialQuestionBank.questions.filter((q) => q.officialSection === '01');
    const sec2 = officialQuestionBank.questions.filter((q) => q.officialSection === '02');
    const sec3 = officialQuestionBank.questions.filter((q) => q.officialSection === '03');
    const sec4 = officialQuestionBank.questions.filter((q) => q.officialSection === '04');

    expect(sec1.length).toBe(236);
    expect(sec2.length).toBe(233);
    expect(sec3.length).toBe(71);
    expect(sec4.length).toBe(65);

    expect(sec1.length + sec2.length + sec3.length + sec4.length).toBe(605);
  });

  it('accurately accounts for the 6 historically deleted question slots', () => {
    const deletedList = officialQuestionBank.officialDeletedQuestions;
    expect(deletedList).toEqual([
      { section: '01', number: 94, reason: '官方考綱修訂刪除' },
      { section: '01', number: 102, reason: '官方考綱修訂刪除' },
      { section: '01', number: 166, reason: '官方考綱修訂刪除' },
      { section: '01', number: 197, reason: '官方考綱修訂刪除' },
      { section: '01', number: 232, reason: '官方考綱修訂刪除' },
      { section: '02', number: 191, reason: '官方考綱修訂刪除' },
    ]);

    // Check that deleted question numbers do not appear in the active question list
    deletedList.forEach((del) => {
      const found = officialQuestionBank.questions.find(
        (q) => q.officialSection === del.section && q.questionNumber === del.number
      );
      expect(found).toBeUndefined();
    });
  });

  it('validates critical question content (e.g. Question 1 WWW, Question 2 HTTP)', () => {
    const q1 = officialQuestionBank.questions.find((q) => q.id === 'q17300-01-001');
    expect(q1).toBeDefined();
    expect(q1?.question).toContain('全球資訊網');
    expect(q1?.correctAnswer).toBe('A');
    expect(q1?.options.A).toContain('World Wide Web');

    const q2 = officialQuestionBank.questions.find((q) => q.id === 'q17300-01-002');
    expect(q2).toBeDefined();
    expect(q2?.question).toContain('超文字傳輸協定');
    expect(q2?.correctAnswer).toBe('A');
    expect(q2?.options.A).toContain('HTTP');
  });
});
