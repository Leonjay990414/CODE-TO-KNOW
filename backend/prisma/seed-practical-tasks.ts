/**
 * CODE TO KNOW (碼上學) - 勞動部 17300 網頁設計丙級官方五大術科題組 Seed 管線工具
 *
 * 核心功能：
 * 1. 嚴格對齊官方 173003B12 試題規範與 173003B13 素材資料庫
 * 2. 完整收錄官方正式五大題組（104301 至 104305），嚴格禁止任何第六題組（如美食巡禮）
 * 3. 完整對應 Prisma 資料模型 (PracticalTask, PracticalStep)
 * 4. 嚴格區分 Version A (官方教材指引版) 與 Version B (影音串流教學版)
 * 5. 具備決定性識別碼，保證重複執行 100% 冪等
 * 6. 提供 --dry-run 模擬模式與 --execute 真實入庫模式
 * 7. 支援交易原子性（BEGIN / COMMIT / ROLLBACK）
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { OFFICIAL_PRACTICAL_TASKS } from '../../frontend/src/data/practicalTasksData.js';
import { UNIFIED_PRACTICAL_CURRICULUM_MAP } from '../../frontend/src/data/unifiedPracticalCurriculumData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 官方五大題組白名單
export const OFFICIAL_TASK_CODES = [
  '17300-104301',
  '17300-104302',
  '17300-104303',
  '17300-104304',
  '17300-104305',
] as const;

export const OFFICIAL_TASK_TITLES = {
  '17300-104301': '題組一：校園社團介紹網',
  '17300-104302': '題組二：運動廣場連結網',
  '17300-104303': '題組三：國家公園介紹網',
  '17300-104304': '題組四：網路行銷購物網',
  '17300-104305': '題組五：書曼的旅遊相簿',
} as const;

export interface PracticalSeedData {
  tasks: Array<{
    id: string;
    taskCode: string;
    taskNumber: number;
    title: string;
    theme: string;
    canvasWidth: string;
    estimatedMinutes: number;
    materialPath: string;
    defaultHtmlCode: string;
    defaultCssCode: string;
    defaultJsCode: string;
    status: string;
  }>;
  steps: Array<{
    id: string;
    taskId: string;
    version: 'VERSION_A' | 'VERSION_B';
    stepNumber: number;
    title: string;
    description: string;
    videoUrl: string | null;
    videoStartSeconds: number | null;
    pitfallWarning: string | null;
  }>;
}

export function buildPracticalSeedData(): PracticalSeedData {
  // 1. 嚴格驗證題組數量與內容
  if (OFFICIAL_PRACTICAL_TASKS.length !== 5) {
    throw new Error(`[SECURITY] 官方題組數量異常：預期 5 組，實際 ${OFFICIAL_PRACTICAL_TASKS.length} 組`);
  }

  const tasks: PracticalSeedData['tasks'] = [];
  const steps: PracticalSeedData['steps'] = [];

  for (const t of OFFICIAL_PRACTICAL_TASKS) {
    // 檢查非法題組（如：台灣美食精緻巡禮）
    if (!OFFICIAL_TASK_CODES.includes(t.code as any)) {
      throw new Error(`[SECURITY VIOLATION] 偵測到非官方核可之題組代碼：${t.code} (${t.title})，拒絕執行！`);
    }

    if (t.title.includes('美食') || t.theme.includes('美食')) {
      throw new Error(`[SECURITY VIOLATION] 偵測到非官方五大題組內容 (美食相關)，拒絕執行！`);
    }

    const taskId = `task-${t.id}`;
    tasks.push({
      id: taskId,
      taskCode: t.code,
      taskNumber: t.id,
      title: t.title,
      theme: t.theme,
      canvasWidth: t.canvasSpec?.width || '1024px',
      estimatedMinutes: t.estimatedMinutes || 90,
      materialPath: t.materialPath,
      defaultHtmlCode: t.defaultHtmlCode || '',
      defaultCssCode: t.defaultCssCode || '',
      defaultJsCode: '',
      status: 'AVAILABLE',
    });

    const curriculum = UNIFIED_PRACTICAL_CURRICULUM_MAP[t.id];
    if (!curriculum) {
      throw new Error(`[DATA ERROR] 找不到題組 ${t.id} 之教材課程資料！`);
    }

    // Version A: 官方教材指引版
    curriculum.versionA.steps.forEach((s) => {
      const stepId = `step-task${t.id}-a-${s.stepNumber}`;
      const descParts = [s.purpose, s.htmlExplanation, s.cssExplanation, s.pathUsage].filter(Boolean);
      steps.push({
        id: stepId,
        taskId,
        version: 'VERSION_A',
        stepNumber: s.stepNumber,
        title: s.title,
        description: descParts.join('\n\n'),
        videoUrl: null,
        videoStartSeconds: null,
        pitfallWarning: s.commonMistakes || s.troubleshooting || s.verificationPoint || null,
      });
    });

    // Version B: 影音串流解說版
    curriculum.versionB.steps.forEach((s) => {
      const stepId = `step-task${t.id}-b-${s.stepNumber}`;
      const descParts = [s.purpose, s.htmlExplanation, s.cssExplanation].filter(Boolean);
      steps.push({
        id: stepId,
        taskId,
        version: 'VERSION_B',
        stepNumber: s.stepNumber,
        title: s.title,
        description: descParts.join('\n\n'),
        videoUrl: 'https://www.youtube.com/watch?v=TZ5EJatWres',
        videoStartSeconds: 0,
        pitfallWarning: s.commonMistakes || s.troubleshooting || '待連網串流驗證',
      });
    });
  }

  return { tasks, steps };
}

export async function runPracticalSeed(options: { execute?: boolean } = {}) {
  const isExecute = Boolean(options.execute);
  console.log('=============================================================================');
  console.log('  CODE TO KNOW (碼上學) - 官方五大術科題組與步驟 Seed 管線工具');
  console.log(`  執行模式：${isExecute ? 'EXECUTE (正式寫入資料庫)' : 'DRY-RUN 模擬檢驗模式 (0 資料庫寫入)'}`);
  console.log('=============================================================================');

  const seedData = buildPracticalSeedData();

  console.log(`[1/3] 官方題組規格檢驗：PASS`);
  console.log(`      - 官方五大題組全數確認，無越權非法題組：`);
  seedData.tasks.forEach((t) => {
    console.log(`        * [${t.taskCode}] ${t.title} (${t.canvasWidth}, ${t.estimatedMinutes} 分鐘)`);
  });

  const versionASteps = seedData.steps.filter((s) => s.version === 'VERSION_A');
  const versionBSteps = seedData.steps.filter((s) => s.version === 'VERSION_B');

  console.log(`[2/3] 雙版本步驟映射構建：PASS`);
  console.log(`      - 總步驟數：${seedData.steps.length} 步`);
  console.log(`      - Version A (官方標準指引)：${versionASteps.length} 步`);
  console.log(`      - Version B (影音串流指引)：${versionBSteps.length} 步`);

  if (!isExecute) {
    console.log('\n[3/3] 執行結果：');
    console.log('      [DRY-RUN SUCCESS] 全部驗證通過，未執行資料庫寫入。');
    console.log('      若需正式寫入目標資料庫，請加入 --execute 參數。');
    return seedData;
  }

  // 執行正式寫入
  console.log('\n[3/3] 執行正式資料庫寫入流程：');
  const secretPath = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
  let password = 'postgres';
  if (fs.existsSync(secretPath)) {
    password = fs.readFileSync(secretPath, 'utf8').trim();
  }

  const client = new pg.Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'codetoknow_restore',
    password: password,
    database: 'ctk_core01_db001_scratch',
  });

  try {
    await client.connect();
    const dbRes = await client.query('SELECT current_database(), inet_server_addr(), inet_server_port()');
    const { current_database } = dbRes.rows[0];

    if (current_database !== 'ctk_core01_db001_scratch') {
      throw new Error(`[ISOLATION ERROR] 目標資料庫為 '${current_database}'，非授權沙盒庫！立即中止。`);
    }

    console.log(`      - 目標資料庫已鎖定：${current_database} (Port 5433)`);
    console.log('      - 開始執行交易區塊 (BEGIN TRANSACTION)...');
    await client.query('BEGIN');

    // 1. 寫入 PracticalTask
    for (const task of seedData.tasks) {
      await client.query(
        `INSERT INTO "PracticalTask" (
          "id", "taskCode", "taskNumber", "title", "theme", "canvasWidth",
          "estimatedMinutes", "materialPath", "defaultHtmlCode", "defaultCssCode",
          "defaultJsCode", "status", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "theme" = EXCLUDED."theme",
          "canvasWidth" = EXCLUDED."canvasWidth",
          "estimatedMinutes" = EXCLUDED."estimatedMinutes",
          "materialPath" = EXCLUDED."materialPath",
          "defaultHtmlCode" = EXCLUDED."defaultHtmlCode",
          "defaultCssCode" = EXCLUDED."defaultCssCode",
          "defaultJsCode" = EXCLUDED."defaultJsCode",
          "status" = EXCLUDED."status",
          "updatedAt" = CURRENT_TIMESTAMP;`,
        [
          task.id,
          task.taskCode,
          task.taskNumber,
          task.title,
          task.theme,
          task.canvasWidth,
          task.estimatedMinutes,
          task.materialPath,
          task.defaultHtmlCode,
          task.defaultCssCode,
          task.defaultJsCode,
          task.status,
        ]
      );
    }
    console.log(`      - PracticalTask 寫入完成：${seedData.tasks.length} 筆`);

    // 2. 寫入 PracticalStep
    for (const step of seedData.steps) {
      await client.query(
        `INSERT INTO "PracticalStep" (
          "id", "taskId", "version", "stepNumber", "title", "description",
          "videoUrl", "videoStartSeconds", "pitfallWarning", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("taskId", "version", "stepNumber") DO UPDATE SET
          "title" = EXCLUDED."title",
          "description" = EXCLUDED."description",
          "videoUrl" = EXCLUDED."videoUrl",
          "videoStartSeconds" = EXCLUDED."videoStartSeconds",
          "pitfallWarning" = EXCLUDED."pitfallWarning",
          "updatedAt" = CURRENT_TIMESTAMP;`,
        [
          step.id,
          step.taskId,
          step.version,
          step.stepNumber,
          step.title,
          step.description,
          step.videoUrl,
          step.videoStartSeconds,
          step.pitfallWarning,
        ]
      );
    }
    console.log(`      - PracticalStep 寫入完成：${seedData.steps.length} 筆`);

    await client.query('COMMIT');
    console.log('      - 交易成功提交 (COMMIT SUCCESS)');
    return seedData;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('      [DATABASE SEED ERROR] 交易失敗並已回滾：', err);
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

// 支援命令列直接執行
const isDirectExecution = process.argv[1] && process.argv[1].endsWith('seed-practical-tasks.ts');
if (isDirectExecution) {
  const shouldExecute = process.argv.includes('--execute');
  runPracticalSeed({ execute: shouldExecute })
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
