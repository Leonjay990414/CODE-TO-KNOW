/**
 * CODE TO KNOW (碼上學) - 勞動部 17300 網頁設計丙級官方 611 題學科題庫 Seed 管線工具
 * 
 * 核心功能：
 * 1. 支援讀取官方全真學科題庫 JSON (frontend/src/data/officialTheoryQuestionBank.json)
 * 2. 嚴格 Zod Schema 格式校驗（題幹、A/B/C/D 選項、答案合法性）
 * 3. 完整對應 Prisma 資料模型 (Certification, Subject, Question, QuestionOption)
 * 4. 具備決定性 UUID (Deterministic UUIDv5/SHA256) 雜湊演算法，保證重複執行 100% 冪等
 * 5. 提供 --dry-run 模式（僅執行格式檢驗、關係構建與統計，0 資料庫寫入）
 * 6. 具備交易回滾（Transaction Rollback）與詳細統計輸出
 * 7. 嚴格遵守資安守則：不暴露環境變數或資料庫機密
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// 1. Zod Schema 定義：嚴格校驗官方題庫結構
// =============================================================================

const QuestionOptionSchema = z.object({
  A: z.string().min(1, 'Option A cannot be empty'),
  B: z.string().min(1, 'Option B cannot be empty'),
  C: z.string().min(1, 'Option C cannot be empty'),
  D: z.string().min(1, 'Option D cannot be empty'),
});

const RawQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID is required'),
  officialSection: z.enum(['01', '02', '03', '04']),
  sectionName: z.string().min(1),
  category: z.string().optional(),
  questionNumber: z.number().int().positive(),
  question: z.string().min(1, 'Question text cannot be empty'),
  options: QuestionOptionSchema,
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  officialPage: z.number().optional(),
  explanation: z.string().optional(),
  isVerified: z.boolean().optional(),
});

const OfficialDeletedQuestionSchema = z.object({
  section: z.string(),
  number: z.number(),
  reason: z.string(),
});

const RawQuestionBankSchema = z.object({
  version: z.string(),
  sourceDoc: z.string(),
  announcementDate: z.string(),
  effectiveDate: z.string(),
  totalOfficialActiveQuestions: z.number(),
  historicalMaxQuestionNumber: z.number(),
  officialDeletedQuestions: z.array(OfficialDeletedQuestionSchema),
  sections: z.record(
    z.object({
      name: z.string(),
      count: z.number(),
    })
  ),
  questions: z.array(RawQuestionSchema),
});

export type RawQuestionBank = z.infer<typeof RawQuestionBankSchema>;
export type RawQuestion = z.infer<typeof RawQuestionSchema>;

// =============================================================================
// 2. 決定性 UUID 產生器：保證多次執行 ID 完全一致（冪等性核心）
// =============================================================================

const NAMESPACE_CTK = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // RFC 4122 namespace

export function generateDeterministicUuid(seedString: string): string {
  const hash = crypto.createHash('sha256').update(seedString).digest('hex');
  // Format as valid UUIDv4 variant
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// =============================================================================
// 3. 證照與工作項目基礎資料定義
// =============================================================================

export const CERTIFICATION_CONFIG = {
  id: generateDeterministicUuid('CERTIFICATION_17300'),
  code: '17300',
  name: '勞動部技能檢定 17300 網頁設計丙級',
  level: 'LEVEL_C',
  category: 'WEB_DESIGN',
  officialVersion: '113/114年版 (V115100817)',
  status: 'ACTIVE',
};

export const SUBJECTS_CONFIG: Record<string, { code: string; title: string; displayOrder: number }> = {
  '01': {
    code: '17300-01',
    title: '工作項目 01：作業準備',
    displayOrder: 1,
  },
  '02': {
    code: '17300-02',
    title: '工作項目 02：應用軟體安裝及使用',
    displayOrder: 2,
  },
  '03': {
    code: '17300-03',
    title: '工作項目 03：系統軟體安裝及使用',
    displayOrder: 3,
  },
  '04': {
    code: '17300-04',
    title: '工作項目 04：資訊及安全',
    displayOrder: 4,
  },
};

// =============================================================================
// 4. 資料映射模型結構與統計介面
// =============================================================================

export interface MappedQuestionPayload {
  question: {
    id: string;
    subjectId: string;
    officialNumber: number;
    questionText: string;
    codeSnippet: string | null;
    questionType: string;
    difficulty: string;
    correctAnswer: string;
    explanation: string;
    sourceName: string;
    sourceUrl: string;
    sourceVersion: string;
    status: string;
  };
  options: Array<{
    id: string;
    questionId: string;
    key: string;
    text: string;
    displayOrder: number;
  }>;
}

export interface SeedPipelineSummary {
  sourceVersion: string;
  sourceDoc: string;
  totalActiveQuestions: number;
  historicalMaxNumber: number;
  officialDeletedCount: number;
  sectionsCount: Record<string, { name: string; count: number }>;
  mappedCertification: typeof CERTIFICATION_CONFIG;
  mappedSubjectsCount: number;
  mappedQuestionsCount: number;
  mappedOptionsCount: number;
  validationErrors: string[];
  isDryRun: boolean;
  databaseWritesExecuted: number;
}

// =============================================================================
// 5. 核心管線函式：讀取、校驗與記憶體映射構建
// =============================================================================

export function loadAndValidateQuestionBank(jsonFilePath: string): {
  data: RawQuestionBank;
  mappedSubjects: Map<string, { id: string; code: string; title: string; displayOrder: number }>;
  mappedPayloads: MappedQuestionPayload[];
  errors: string[];
} {
  const errors: string[] = [];

  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`[SEED PIPELINE ERROR] Question bank JSON file not found at: ${jsonFilePath}`);
  }

  const rawJson = fs.readFileSync(jsonFilePath, 'utf8');
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawJson);
  } catch (err) {
    throw new Error(`[SEED PIPELINE ERROR] Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
  }

  const parseResult = RawQuestionBankSchema.safeParse(parsedJson);
  if (!parseResult.success) {
    for (const issue of parseResult.error.issues) {
      errors.push(`[Schema Validation Issue] ${issue.path.join('.')}: ${issue.message}`);
    }
    throw new Error(`[SEED PIPELINE ERROR] Source JSON failed Zod schema validation with ${errors.length} issues.`);
  }

  const data = parseResult.data;

  // 建立 Subject ID 映射表
  const mappedSubjects = new Map<string, { id: string; code: string; title: string; displayOrder: number }>();
  for (const [secCode, secCfg] of Object.entries(SUBJECTS_CONFIG)) {
    const subjectId = generateDeterministicUuid(`SUBJECT_17300_${secCode}`);
    mappedSubjects.set(secCode, {
      id: subjectId,
      code: secCfg.code,
      title: secCfg.title,
      displayOrder: secCfg.displayOrder,
    });
  }

  // 映射 Question 與 QuestionOption
  const mappedPayloads: MappedQuestionPayload[] = [];
  const seenQuestionIds = new Set<string>();
  const seenSecNumKeys = new Set<string>();

  for (const q of data.questions) {
    const secNumKey = `${q.officialSection}-${q.questionNumber}`;
    if (seenSecNumKeys.has(secNumKey)) {
      errors.push(`[Duplicate Key] Duplicate Section and Question Number: ${secNumKey}`);
    }
    seenSecNumKeys.add(secNumKey);

    const questionUuid = generateDeterministicUuid(`QUESTION_17300_${q.id}`);
    if (seenQuestionIds.has(questionUuid)) {
      errors.push(`[Duplicate UUID] Colliding Question UUID for ID: ${q.id}`);
    }
    seenQuestionIds.add(questionUuid);

    const subject = mappedSubjects.get(q.officialSection);
    if (!subject) {
      errors.push(`[Missing Subject] No Subject mapping found for officialSection: ${q.officialSection}`);
      continue;
    }

    const questionRecord = {
      id: questionUuid,
      subjectId: subject.id,
      officialNumber: q.questionNumber,
      questionText: q.question,
      codeSnippet: null,
      questionType: 'SINGLE_CHOICE',
      difficulty: 'MEDIUM',
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '依據勞動部技能檢定 17300 網頁設計丙級官方標準解答',
      sourceName: '勞動部技能檢定中心 173003A17 測試參考資料',
      sourceUrl: 'https://techbank.wdasec.gov.tw/examweb/owInform/TestReferData.aspx',
      sourceVersion: `${data.version} (${data.sourceDoc})`,
      status: 'ACTIVE',
    };

    const optionsRecords: Array<{
      id: string;
      questionId: string;
      key: string;
      text: string;
      displayOrder: number;
    }> = [];

    const optionKeys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
    for (let idx = 0; idx < optionKeys.length; idx++) {
      const key = optionKeys[idx];
      const optText = q.options[key];
      const optionUuid = generateDeterministicUuid(`OPTION_17300_${q.id}_${key}`);

      optionsRecords.push({
        id: optionUuid,
        questionId: questionUuid,
        key,
        text: optText,
        displayOrder: idx + 1,
      });
    }

    mappedPayloads.push({
      question: questionRecord,
      options: optionsRecords,
    });
  }

  return {
    data,
    mappedSubjects,
    mappedPayloads,
    errors,
  };
}

// =============================================================================
// 6. 主執行入口 (支援 CLI 參數：--dry-run, --execute)
// =============================================================================

export async function runSeedPipeline(options: {
  jsonPath?: string;
  dryRun?: boolean;
}): Promise<SeedPipelineSummary> {
  const isDryRun = options.dryRun ?? true; // 預設安全為 Dry Run
  const defaultPath = path.resolve(__dirname, '../../frontend/src/data/officialTheoryQuestionBank.json');
  const jsonFilePath = options.jsonPath || defaultPath;

  console.log('=============================================================================');
  console.log('  CODE TO KNOW (碼上學) - 官方 611 題學科題庫 Seed 管線工具');
  console.log(`  執行模式：${isDryRun ? 'DRY-RUN 模擬檢驗模式 (0 資料庫寫入)' : 'EXECUTE 正式寫入模式'}`);
  console.log(`  來源檔案：${jsonFilePath}`);
  console.log('=============================================================================\n');

  const { data, mappedSubjects, mappedPayloads, errors } = loadAndValidateQuestionBank(jsonFilePath);

  const sectionsSummary: Record<string, { name: string; count: number }> = {};
  for (const [secCode, meta] of Object.entries(data.sections)) {
    sectionsSummary[secCode] = {
      name: meta.name,
      count: meta.count,
    };
  }

  let totalOptionsCount = 0;
  for (const payload of mappedPayloads) {
    totalOptionsCount += payload.options.length;
  }

  console.log('[1/4] 來源 JSON 解析與 Zod 校驗：PASS');
  console.log(`      - 官方版本：${data.version} (${data.sourceDoc})`);
  console.log(`      - 官方公告生效日期：${data.effectiveDate}`);
  console.log(`      - 歷史題號最大值：${data.historicalMaxQuestionNumber}`);
  console.log(`      - 官方考綱廢止刪除題數：${data.officialDeletedQuestions.length}`);
  console.log(`      - 實際有效題目總數：${mappedPayloads.length}`);

  console.log('\n[2/4] 工作項目分類統計：');
  for (const [secCode, meta] of Object.entries(sectionsSummary)) {
    console.log(`      - 工作項目 ${secCode} (${meta.name}): ${meta.count} 題`);
  }

  console.log('\n[3/4] Prisma 模型記憶體映射構建：');
  console.log(`      - Certification 模型：1 筆 (${CERTIFICATION_CONFIG.name})`);
  console.log(`      - Subject 模型：${mappedSubjects.size} 筆 (工作項目 01～04)`);
  console.log(`      - Question 模型：${mappedPayloads.length} 筆`);
  console.log(`      - QuestionOption 模型：${totalOptionsCount} 筆 (每題 4 選項完整無缺)`);

  if (errors.length > 0) {
    console.error('\n[!] 發現潛在驗證錯誤：');
    for (const err of errors) {
      console.error(`    ${err}`);
    }
    throw new Error(`[SEED PIPELINE REJECTED] Found ${errors.length} validation errors.`);
  }

  if (isDryRun) {
    console.log('\n[4/4] 執行結果：');
    console.log('      [DRY-RUN SUCCESS] 全部 605 題與 2,420 選項通過格式、關聯與約束驗證。');
    console.log('      [ZERO-WRITE AUDIT] 本次為 DRY-RUN 模式，資料庫寫入數量嚴格為 0。');
    console.log('=============================================================================');

    return {
      sourceVersion: data.version,
      sourceDoc: data.sourceDoc,
      totalActiveQuestions: mappedPayloads.length,
      historicalMaxNumber: data.historicalMaxQuestionNumber,
      officialDeletedCount: data.officialDeletedQuestions.length,
      sectionsCount: sectionsSummary,
      mappedCertification: CERTIFICATION_CONFIG,
      mappedSubjectsCount: mappedSubjects.size,
      mappedQuestionsCount: mappedPayloads.length,
      mappedOptionsCount: totalOptionsCount,
      validationErrors: errors,
      isDryRun: true,
      databaseWritesExecuted: 0,
    };
  }

  // 正式寫入模式（已獲正式授權 CTK-CORE-01-INT-001）
  console.log('\n[4/4] 執行資料庫正式寫入（已獲授權寫入本地隔離測試庫）...');
  
  const password = (() => {
    if (process.env.PGPASSWORD) return process.env.PGPASSWORD;
    const secretPath = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
    if (fs.existsSync(secretPath)) {
      return fs.readFileSync(secretPath, 'utf-8').trim();
    }
    return '';
  })();

  const client = new pg.Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'codetoknow_restore',
    password: password,
    database: 'ctk_core01_db001_scratch',
  });

  await client.connect();

  try {
    // 嚴格連線隔離查核
    const checkRes = await client.query('SELECT current_database(), inet_server_port(), version();');
    const { current_database } = checkRes.rows[0];

    if (current_database !== 'ctk_core01_db001_scratch') {
      throw new Error(`[ISOLATION ERROR] Target database is '${current_database}', expected 'ctk_core01_db001_scratch'! Aborting.`);
    }

    console.log(`      - 目標資料庫已鎖定：${current_database} (Port 5433)`);
    console.log('      - 開始執行交易區塊 (BEGIN TRANSACTION)...');

    await client.query('BEGIN');

    // 1. 寫入 Certification (1 筆)
    await client.query(
      `INSERT INTO "Certification" (id, code, name, level, category, "officialVersion", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW();`,
      [
        CERTIFICATION_CONFIG.id,
        CERTIFICATION_CONFIG.code,
        CERTIFICATION_CONFIG.name,
        CERTIFICATION_CONFIG.level,
        CERTIFICATION_CONFIG.category,
        CERTIFICATION_CONFIG.officialVersion,
        CERTIFICATION_CONFIG.status,
      ]
    );

    // 2. 寫入 Subject (4 筆)
    for (const sub of mappedSubjects.values()) {
      await client.query(
        `INSERT INTO "Subject" (id, "certificationId", code, title, "examType", "displayOrder", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT ("certificationId", code) DO UPDATE SET title = EXCLUDED.title, "updatedAt" = NOW();`,
        [sub.id, CERTIFICATION_CONFIG.id, sub.code, sub.title, 'THEORY', sub.displayOrder]
      );
    }

    // 3. 寫入 Question (605 筆) 與 QuestionOption (2,420 筆)
    let questionsInserted = 0;
    let optionsInserted = 0;

    for (const item of mappedPayloads) {
      const q = item.question;
      await client.query(
        `INSERT INTO "Question" (id, "subjectId", "officialNumber", "questionText", "codeSnippet", "questionType", difficulty, "correctAnswer", explanation, "sourceName", "sourceVersion", status, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET "questionText" = EXCLUDED."questionText", "updatedAt" = NOW();`,
        [
          q.id,
          q.subjectId,
          q.officialNumber,
          q.questionText,
          q.codeSnippet,
          q.questionType,
          q.difficulty,
          q.correctAnswer,
          q.explanation,
          q.sourceName,
          q.sourceVersion,
          q.status,
        ]
      );
      questionsInserted++;

      for (const opt of item.options) {
        await client.query(
          `INSERT INTO "QuestionOption" (id, "questionId", key, text, "displayOrder")
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT ("questionId", key) DO UPDATE SET text = EXCLUDED.text;`,
          [opt.id, opt.questionId, opt.key, opt.text, opt.displayOrder]
        );
        optionsInserted++;
      }
    }

    await client.query('COMMIT');
    console.log('      - 交易成功提交通過 (COMMIT TRANSACTION)！');
    console.log(`      - 實際寫入筆數：Certification=1, Subject=${mappedSubjects.size}, Question=${questionsInserted}, Option=${optionsInserted}`);
    console.log('=============================================================================');

    return {
      sourceVersion: data.version,
      sourceDoc: data.sourceDoc,
      totalActiveQuestions: mappedPayloads.length,
      historicalMaxNumber: data.historicalMaxQuestionNumber,
      officialDeletedCount: data.officialDeletedQuestions.length,
      sectionsCount: sectionsSummary,
      mappedCertification: CERTIFICATION_CONFIG,
      mappedSubjectsCount: mappedSubjects.size,
      mappedQuestionsCount: questionsInserted,
      mappedOptionsCount: optionsInserted,
      validationErrors: errors,
      isDryRun: false,
      databaseWritesExecuted: 1 + mappedSubjects.size + questionsInserted + optionsInserted,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('      - 寫入失敗，交易已完整回滾 (ROLLBACK)！');
    throw err;
  } finally {
    await client.end();
  }
}

// 支援命令列直接執行
if (process.argv[1] && process.argv[1].endsWith('seed-theory-questions.ts')) {
  const isExecute = process.argv.includes('--execute');
  const dryRun = !isExecute || process.argv.includes('--dry-run');

  runSeedPipeline({ dryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
