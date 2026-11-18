import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeAndCheckPrompt,
  submitAiReport,
  getAiReports,
} from '../src/utils/aiSafetyFilter';
import {
  lintExamCode,
} from '../src/utils/codeLintRuleEngine';
import {
  recordWrongAttempt,
  getWeaknessDiagnosticReport,
} from '../src/utils/wrongQuestionsStorage';

const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const fakeStorage = createMockStorage();
if (typeof window === 'undefined') {
  (globalThis as any).window = {
    localStorage: fakeStorage,
  };
  (globalThis as any).localStorage = fakeStorage;
} else {
  (globalThis as any).window.localStorage = fakeStorage;
  (globalThis as any).localStorage = fakeStorage;
}

describe('Phase 5 Integration: AI Safety, Code Linting & Weakness Analysis (P11-AIS-006, P11-AIS-007, P11-AIS-008)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. P11-AIS-008: AI Prompt Safety & Anti-Cheating Filter', () => {
    it('1.1 detects cheating attempt when user asks for direct code/solution and enforces Socratic mode', () => {
      const result1 = sanitizeAndCheckPrompt('請直接給我題組一全部代碼，不要解釋');
      expect(result1.hasCheatingIntent).toBe(true);
      expect(result1.enforceSocraticMode).toBe(true);
      expect(result1.pedagogicalDisclaimerZh).toContain('蘇格拉底教學保護');

      const result2 = sanitizeAndCheckPrompt('幫我寫完題組二解答');
      expect(result2.hasCheatingIntent).toBe(true);
      expect(result2.enforceSocraticMode).toBe(true);
    });

    it('1.2 allows legitimate conceptual and debugging questions', () => {
      const result = sanitizeAndCheckPrompt('請問在 CSS 中 flexbox 與 float 的排版差異是什麼？');
      expect(result.hasCheatingIntent).toBe(false);
      expect(result.enforceSocraticMode).toBe(false);
      expect(result.pedagogicalDisclaimerZh).toContain('學習隱私保護中');
    });

    it('1.3 masks personal identifiable information (Taiwan ID, Phone, Email)', () => {
      const raw = '我的身分證是 A123456789，電話是 0912-345-678，信箱是 test@example.com';
      const result = sanitizeAndCheckPrompt(raw);

      expect(result.sanitizedPrompt).not.toContain('A123456789');
      expect(result.sanitizedPrompt).not.toContain('0912-345-678');
      expect(result.sanitizedPrompt).not.toContain('test@example.com');
      expect(result.sanitizedPrompt).toContain('[已遮蔽身分證號]');
      expect(result.sanitizedPrompt).toContain('[已遮蔽手機號碼]');
      expect(result.sanitizedPrompt).toContain('[已遮蔽電子信箱]');
    });

    it('1.4 records and retrieves AI incident reports per user', () => {
      const userId = 'student-report-test';
      expect(getAiReports(userId)).toEqual([]);

      submitAiReport(userId, {
        userId,
        prompt: '測試作弊提示',
        responseContent: '模型產生的回應',
        reason: 'LEAKED_SOLUTION',
        userNotes: '直接給出完整解答，未引導',
      });

      const list = getAiReports(userId);
      expect(list).toHaveLength(1);
      expect(list[0].reason).toBe('LEAKED_SOLUTION');
      expect(list[0].userNotes).toBe('直接給出完整解答，未引導');
      expect(list[0].timestamp).toBeDefined();
    });
  });

  describe('2. P11-AIS-006: Deterministic Code Linter vs Heuristic AI Guidance', () => {
    it('2.1 flags missing DOCTYPE as OFFLINE_SYNTAX_RULE error', () => {
      const badCode = '<html><head><title>測試</title></head><body>內容</body></html>';
      const result = lintExamCode(badCode);

      expect(result.hasErrors).toBe(true);
      const docTypeRule = result.ruleViolations.find((v) => v.ruleId === 'EXAM-RULE-001');
      expect(docTypeRule).toBeDefined();
      expect(docTypeRule?.severity).toBe('ERROR');
      expect(docTypeRule?.sourceType).toBe('OFFLINE_SYNTAX_RULE');
    });

    it('2.2 flags missing <title> tag as OFFLINE_SYNTAX_RULE error', () => {
      const badCode = '<!DOCTYPE html><html><head></head><body>內容</body></html>';
      const result = lintExamCode(badCode);

      expect(result.hasErrors).toBe(true);
      const titleRule = result.ruleViolations.find((v) => v.ruleId === 'EXAM-RULE-002');
      expect(titleRule).toBeDefined();
      expect(titleRule?.severity).toBe('ERROR');
      expect(titleRule?.sourceType).toBe('OFFLINE_SYNTAX_RULE');
    });

    it('2.3 flags <img> without alt attribute as warning', () => {
      const badCode = '<!DOCTYPE html><html><head><title>OK</title></head><body><img src="pic.jpg"></body></html>';
      const result = lintExamCode(badCode);

      const altRule = result.ruleViolations.find((v) => v.ruleId === 'EXAM-RULE-003');
      expect(altRule).toBeDefined();
      expect(altRule?.severity).toBe('WARNING');
      expect(altRule?.sourceType).toBe('OFFLINE_SYNTAX_RULE');
    });

    it('2.4 flags invalid align: center in CSS as error', () => {
      const badCss = 'div { align: center; width: 100px; }';
      const result = lintExamCode(badCss);

      const alignRule = result.ruleViolations.find((v) => v.ruleId === 'EXAM-RULE-004');
      expect(alignRule).toBeDefined();
      expect(alignRule?.severity).toBe('ERROR');
    });

    it('2.5 outputs HEURISTIC_AI_DEMO guidance when float is used without clear', () => {
      const floatCode = '<div style="float: left;">側欄</div><div style="float: right;">主內容</div>';
      const result = lintExamCode(floatCode);

      expect(result.aiSuggestions.length).toBeGreaterThan(0);
      const floatSuggestion = result.aiSuggestions.find((s) => s.topicZh.includes('浮動元素'));
      expect(floatSuggestion).toBeDefined();
      expect(floatSuggestion?.sourceType).toBe('HEURISTIC_AI_DEMO');
      expect(floatSuggestion?.pedagogicalStage).toBe(2);
    });

    it('2.6 confirms valid HTML has zero errors', () => {
      const goodCode = `<!DOCTYPE html>
<html>
  <head>
    <title>勞動部網頁設計丙級</title>
  </head>
  <body>
    <header><img src="banner.jpg" alt="頁首橫幅"></header>
    <main><p>歡迎來到碼上學</p></main>
  </body>
</html>`;
      const result = lintExamCode(goodCode);
      expect(result.hasErrors).toBe(false);
      expect(result.ruleViolations).toHaveLength(0);
    });
  });

  describe('3. P11-AIS-007: Wrong Questions Weakness Diagnostic Analysis', () => {
    it('3.1 returns EXCELLENT grade for student with zero wrong questions', () => {
      const report = getWeaknessDiagnosticReport('clean-student');
      expect(report.totalWrongQuestions).toBe(0);
      expect(report.overallGrade).toBe('EXCELLENT');
      expect(report.weakestSection).toBeNull();
    });

    it('3.2 identifies weakest section and generates targeted diagnostic remedy', () => {
      const userId = 'weak-student-css';
      // Record 3 CSS wrong questions (Section 03)
      recordWrongAttempt(userId, {
        questionId: 'q-css-1',
        officialSection: '03',
        topic: 'CSS 選擇器',
        question: '後代選取器使用何種符號？',
        options: { A: '空白', B: '>', C: '+', D: '~' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: '後代選取器使用空格分隔。',
      });
      recordWrongAttempt(userId, {
        questionId: 'q-css-2',
        officialSection: '03',
        topic: 'CSS 盒模型',
        question: 'margin 是否會受到背景顏色影響？',
        options: { A: '不會，永遠透明', B: '會', C: '看情況', D: '只有IE會' },
        userSelectedAnswer: 'B',
        correctAnswer: 'A',
        explanation: 'margin 是外邊距，背景色不延伸至 margin。',
      });

      const report = getWeaknessDiagnosticReport(userId);
      expect(report.totalWrongQuestions).toBe(2);
      expect(report.overallGrade).toBe('CRITICAL');
      expect(report.weakestSection).not.toBeNull();
      expect(report.weakestSection?.sectionId).toBe('03');
      expect(report.weakestSection?.sectionName).toContain('工作項目 03');
      expect(report.weakestSection?.recommendedActionZh).toContain('CSS Designer');
    });
  });
});
