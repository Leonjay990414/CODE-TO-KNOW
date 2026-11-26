import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadAndValidateQuestionBank,
  generateDeterministicUuid,
  runSeedPipeline,
  CERTIFICATION_CONFIG,
  SUBJECTS_CONFIG,
} from '../prisma/seed-theory-questions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../../frontend/src/data/officialTheoryQuestionBank.json');

describe('CTK-CORE-01-DB-002: Official 611 Theory Questions Seed Pipeline Test Suite', () => {
  // =========================================================================
  // 1. JSON 解析與基本元數據檢查
  // =========================================================================
  it('should successfully parse official JSON and verify official header metadata', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    expect(data.version).toBe('V115100817');
    expect(data.sourceDoc).toBe('173003A17.pdf');
    expect(data.effectiveDate).toBe('115年01月01日');
    expect(data.totalOfficialActiveQuestions).toBe(605);
    expect(data.historicalMaxQuestionNumber).toBe(611);
    expect(data.officialDeletedQuestions).toHaveLength(6);

    // 驗證 6 題官方刪除題號
    const deletedNumbers = data.officialDeletedQuestions.map((d) => `${d.section}-${d.number}`);
    expect(deletedNumbers).toEqual([
      '01-94',
      '01-102',
      '01-166',
      '01-197',
      '01-232',
      '02-191',
    ]);
  });

  // =========================================================================
  // 2. 題目數量與完整性檢查
  // =========================================================================
  it('should contain exactly 605 active questions with non-empty text', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    expect(data.questions).toHaveLength(605);

    for (const q of data.questions) {
      expect(q.id).toBeDefined();
      expect(q.id.trim().length).toBeGreaterThan(0);
      expect(q.question).toBeDefined();
      expect(q.question.trim().length).toBeGreaterThan(0);
      expect(q.questionNumber).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // 3. 重複題號與唯一識別碼檢查
  // =========================================================================
  it('should have zero duplicate IDs and zero duplicate (section, questionNumber) pairs', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    const idSet = new Set<string>();
    const secNumSet = new Set<string>();

    for (const q of data.questions) {
      expect(idSet.has(q.id)).toBe(false);
      idSet.add(q.id);

      const secNumKey = `${q.officialSection}-${q.questionNumber}`;
      expect(secNumSet.has(secNumKey)).toBe(false);
      secNumSet.add(secNumKey);
    }

    expect(idSet.size).toBe(605);
    expect(secNumSet.size).toBe(605);
  });

  // =========================================================================
  // 4. 選項完整性與鍵值檢查
  // =========================================================================
  it('should have exactly 4 non-empty options (A, B, C, D) for every question', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    for (const q of data.questions) {
      expect(q.options).toBeDefined();
      expect(typeof q.options.A).toBe('string');
      expect(typeof q.options.B).toBe('string');
      expect(typeof q.options.C).toBe('string');
      expect(typeof q.options.D).toBe('string');

      expect(q.options.A.trim().length).toBeGreaterThan(0);
      expect(q.options.B.trim().length).toBeGreaterThan(0);
      expect(q.options.C.trim().length).toBeGreaterThan(0);
      expect(q.options.D.trim().length).toBeGreaterThan(0);
    }
  });

  // =========================================================================
  // 5. 正確答案格式檢查
  // =========================================================================
  it('should have single valid uppercase correctAnswer in A, B, C, D matching an existing option', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    const validAnswers = new Set(['A', 'B', 'C', 'D']);
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    for (const q of data.questions) {
      expect(validAnswers.has(q.correctAnswer)).toBe(true);
      expect(q.options[q.correctAnswer]).toBeDefined();
      counts[q.correctAnswer]++;
    }

    expect(counts.A).toBe(144);
    expect(counts.B).toBe(156);
    expect(counts.C).toBe(159);
    expect(counts.D).toBe(146);
    expect(counts.A + counts.B + counts.C + counts.D).toBe(605);
  });

  // =========================================================================
  // 6. 工作項目分類與數量核算
  // =========================================================================
  it('should correctly partition questions into 4 official sections matching header specification', () => {
    const { data } = loadAndValidateQuestionBank(jsonPath);

    const sectionCounts: Record<string, number> = { '01': 0, '02': 0, '03': 0, '04': 0 };

    for (const q of data.questions) {
      sectionCounts[q.officialSection]++;
    }

    expect(sectionCounts['01']).toBe(236);
    expect(sectionCounts['02']).toBe(233);
    expect(sectionCounts['03']).toBe(71);
    expect(sectionCounts['04']).toBe(65);

    expect(data.sections['01'].count).toBe(236);
    expect(data.sections['02'].count).toBe(233);
    expect(data.sections['03'].count).toBe(71);
    expect(data.sections['04'].count).toBe(65);
  });

  // =========================================================================
  // 7. Prisma Model 欄位與結構映射檢查
  // =========================================================================
  it('should construct valid in-memory Prisma payloads for Certification, Subject, Question, and QuestionOption', () => {
    const { mappedSubjects, mappedPayloads, errors } = loadAndValidateQuestionBank(jsonPath);

    expect(errors).toHaveLength(0);
    expect(CERTIFICATION_CONFIG.code).toBe('17300');
    expect(mappedSubjects.size).toBe(4);
    expect(mappedPayloads).toHaveLength(605);

    let totalOptions = 0;
    for (const payload of mappedPayloads) {
      const q = payload.question;
      expect(q.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(q.subjectId).toBeDefined();
      expect(q.officialNumber).toBeGreaterThan(0);
      expect(q.questionType).toBe('SINGLE_CHOICE');
      expect(q.status).toBe('ACTIVE');

      expect(payload.options).toHaveLength(4);
      totalOptions += payload.options.length;

      const keys = payload.options.map((o) => o.key);
      expect(keys).toEqual(['A', 'B', 'C', 'D']);

      const orders = payload.options.map((o) => o.displayOrder);
      expect(orders).toEqual([1, 2, 3, 4]);
    }

    expect(totalOptions).toBe(2420);
  });

  // =========================================================================
  // 8. 決定性 UUID 與冪等性演算法檢查
  // =========================================================================
  it('should generate consistent and deterministic UUIDs across multiple invocations', () => {
    const uuid1 = generateDeterministicUuid('QUESTION_17300_q17300-01-001');
    const uuid2 = generateDeterministicUuid('QUESTION_17300_q17300-01-001');
    const uuidOther = generateDeterministicUuid('QUESTION_17300_q17300-01-002');

    expect(uuid1).toBe(uuid2);
    expect(uuid1).not.toBe(uuidOther);
    expect(uuid1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  // =========================================================================
  // 9. 異常資料與錯誤攔截防護測試
  // =========================================================================
  it('should throw an error and list issues when validating invalid question payloads', () => {
    const invalidJson = JSON.stringify({
      version: 'INVALID',
      sourceDoc: 'none',
      announcementDate: '',
      effectiveDate: '',
      totalOfficialActiveQuestions: 1,
      historicalMaxQuestionNumber: 1,
      officialDeletedQuestions: [],
      sections: {},
      questions: [
        {
          id: 'q-bad',
          officialSection: '09', // 非法工作項目
          sectionName: 'Unknown',
          questionNumber: 1,
          question: '', // 空白題幹
          options: { A: '1', B: '2', C: '3' }, // 缺少選項 D
          correctAnswer: 'Z', // 非法答案
        },
      ],
    });

    const tempPath = path.resolve(__dirname, '../../scratch/temp_invalid_questions.json');
    const fs = require('fs');
    fs.writeFileSync(tempPath, invalidJson, 'utf8');

    try {
      expect(() => loadAndValidateQuestionBank(tempPath)).toThrow(/SEED PIPELINE ERROR/);
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  });

  // =========================================================================
  // 10. Dry Run 模式確認與 0 資料庫寫入
  // =========================================================================
  it('should run Dry Run successfully with 0 database writes', async () => {
    const summary = await runSeedPipeline({ jsonPath, dryRun: true });

    expect(summary.isDryRun).toBe(true);
    expect(summary.databaseWritesExecuted).toBe(0);
    expect(summary.mappedQuestionsCount).toBe(605);
    expect(summary.mappedOptionsCount).toBe(2420);
    expect(summary.mappedSubjectsCount).toBe(4);
    expect(summary.validationErrors).toHaveLength(0);
  });
});
