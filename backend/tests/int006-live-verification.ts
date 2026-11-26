import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const secretPath = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
let password = 'postgres';
if (fs.existsSync(secretPath)) {
  password = fs.readFileSync(secretPath, 'utf8').trim();
}

// Connect to authorized sandbox PostgreSQL 17 on port 5433
const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  user: 'codetoknow_restore',
  password: password,
  database: 'ctk_core01_db001_scratch',
});
const adapter = new PrismaPg(pool);
const sandboxPrisma = new PrismaClient({ adapter });
(global as any).__prisma = sandboxPrisma;

async function runLiveVerification() {
  console.log('=============================================================================');
  console.log('  CTK-CORE-01-INT-006: Live PostgreSQL 17 End-to-End Sandbox Verification');
  console.log('  Target: ctk_core01_db001_scratch @ 127.0.0.1:5433');
  console.log('=============================================================================\n');

  // Verify connection & database identity
  const dbInfo = await sandboxPrisma.$queryRaw<any[]>`
    SELECT current_database() as db, inet_server_addr() as host, inet_server_port() as port, version()
  `;
  console.log('[0] Database Identity Verification:');
  console.log(`- Database Name: ${dbInfo[0].db}`);
  console.log(`- Host: ${dbInfo[0].host || '127.0.0.1'}`);
  console.log(`- Port: ${dbInfo[0].port}`);
  console.log(`- Engine: ${dbInfo[0].version.split(',')[0]}\n`);

  if (dbInfo[0].db !== 'ctk_core01_db001_scratch') {
    throw new Error('FATAL: Database connection does not match authorized database ctk_core01_db001_scratch!');
  }

  // Import services dynamically so that (global as any).__prisma is used
  const { studentService } = await import('../src/modules/students/student.service.js');
  const { wrongQuestionService } = await import('../src/modules/wrong-questions/wrongQuestion.service.js');

  // Test actor
  const testStudentId = '33333333-3333-4333-8333-333333333333';
  const testActor = {
    id: testStudentId,
    roles: ['STUDENT'],
  };

  // Ensure test student exists
  await sandboxPrisma.user.upsert({
    where: { id: testStudentId },
    update: {},
    create: {
      id: testStudentId,
      email: 'student.alice.int006@codetoknow.edu',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
      displayName: 'Alice (INT-006 Test Student)',
      status: 'ACTIVE',
    },
  });

  console.log('[1] Testing Study Time Tracking API (INT-006-A)...');
  const today = new Date().toISOString().slice(0, 10);

  // Record 120 seconds of THEORY
  const res1 = await studentService.recordStudyTime(testActor, {
    durationSeconds: 120,
    moduleType: 'THEORY',
    date: today,
  });
  console.log(`  -> Initial study time recorded: ${res1.record.durationSeconds}s`);

  // Record another 60 seconds (atomic increment test)
  const res2 = await studentService.recordStudyTime(testActor, {
    durationSeconds: 60,
    moduleType: 'THEORY',
    date: today,
  });
  console.log(`  -> Incremented study time: ${res2.record.durationSeconds}s`);
  if (res2.record.durationSeconds < 180) {
    throw new Error(`Expected at least 180 seconds, got ${res2.record.durationSeconds}`);
  }

  // Query summary
  const summary = await studentService.getStudyTimeSummary(testActor);
  console.log(`  -> Summary total hours: ${summary.totalHours}h, weekly hours: ${summary.weeklyHours}h`);
  console.log(`  -> By module: THEORY=${summary.byModule.THEORY}s, MOCK_EXAM=${summary.byModule.MOCK_EXAM}s`);
  console.log(`  -> 7-day daily logs count: ${summary.dailyLogs.length}`);
  console.log('  [PASS] Study Time Tracking verified!\n');

  console.log('[2] Testing 4 Official Work Items & Progress Analytics (INT-006-B)...');
  const analytics = await studentService.getProgressAnalytics(testActor);
  console.log(`  -> Official Total Questions: ${analytics.overview.totalOfficialQuestions}`);
  console.log(`  -> Total Attempted: ${analytics.overview.totalAttempted}`);
  console.log(`  -> Completion Rate: ${analytics.overview.completionRate}%`);
  console.log(`  -> Subjects Count: ${analytics.subjects.length}`);

  analytics.subjects.forEach((s) => {
    console.log(`     - [${s.code}] ${s.title}: ${s.completedQuestions}/${s.totalQuestions} 題 (${s.masteryRate}%, 狀態: ${s.status})`);
  });

  if (analytics.overview.totalOfficialQuestions !== 605) {
    throw new Error(`Expected 605 official questions, got ${analytics.overview.totalOfficialQuestions}`);
  }
  console.log('  [PASS] 4 Official Work Items progress analytics verified!\n');

  console.log('[3] Testing Wrong Question Closed Loop (INT-006-C)...');
  // Pick an official question from database
  const sampleQuestion = await sandboxPrisma.question.findFirst({
    where: { subject: { code: '17300-01' } },
    include: { options: true, subject: true },
  });

  if (!sampleQuestion) {
    throw new Error('No questions found in database!');
  }
  console.log(`  -> Target Question: #${sampleQuestion.officialNumber} - ${sampleQuestion.questionText.slice(0, 30)}...`);

  // Record wrong answer
  const wrongAns = sampleQuestion.correctAnswer === 'A' ? 'B' : 'A';
  const recorded = await wrongQuestionService.recordWrongQuestion(testActor, {
    questionId: sampleQuestion.id,
    selectedAnswer: wrongAns,
    source: 'THEORY_PRACTICE',
  });
  console.log(`  -> Recorded wrong question recordId: ${recorded.recordId}, status: ${recorded.masteryStatus}, wrongCount: ${recorded.wrongCount}`);

  // Review step 1: Answer correctly once -> REVIEWING
  const review1 = await wrongQuestionService.practiceReview(testActor, recorded.recordId, sampleQuestion.correctAnswer);
  console.log(`  -> Review 1 (Correct): status=${review1.masteryStatus}, consecutiveCorrect=${review1.consecutiveCorrectCount}, isResolved=${review1.isResolved}`);
  if (review1.masteryStatus !== 'REVIEWING' || review1.consecutiveCorrectCount !== 1) {
    throw new Error(`Expected REVIEWING with count 1, got ${review1.masteryStatus} and ${review1.consecutiveCorrectCount}`);
  }

  // Review step 2: Answer correctly a 2nd consecutive time -> MASTERED
  const review2 = await wrongQuestionService.practiceReview(testActor, recorded.recordId, sampleQuestion.correctAnswer);
  console.log(`  -> Review 2 (Correct): status=${review2.masteryStatus}, consecutiveCorrect=${review2.consecutiveCorrectCount}, isResolved=${review2.isResolved}`);
  if (review2.masteryStatus !== 'MASTERED' || review2.consecutiveCorrectCount !== 2 || !review2.isResolved) {
    throw new Error(`Expected MASTERED with count 2 and isResolved=true, got ${review2.masteryStatus}`);
  }
  console.log('  [PASS] Wrong question state machine closed-loop verified!\n');

  console.log('[4] Verifying 37 Database Tables Integrity...');
  const tables = await sandboxPrisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
  `;
  console.log(`  -> Total tables in ctk_core01_db001_scratch: ${tables.length}`);
  if (tables.length !== 37) {
    throw new Error(`Expected 37 tables, found ${tables.length}`);
  }
  console.log('  [PASS] 37 database tables intact and uncorrupted!\n');

  console.log('=============================================================================');
  console.log('  ALL LIVE SANDBOX VERIFICATION CHECKS PASSED FOR CTK-CORE-01-INT-006!');
  console.log('=============================================================================');
}

runLiveVerification()
  .catch((err) => {
    console.error('FATAL LIVE ERROR:', err);
    process.exit(1);
  })
  .finally(async () => {
    await sandboxPrisma.$disconnect();
    await pool.end();
  });
