import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const secretPath = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
let password = 'postgres';
if (fs.existsSync(secretPath)) {
  password = fs.readFileSync(secretPath, 'utf8').trim();
}

// Set up sandbox connection to port 5433 before any other module imports
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
  const { examService } = await import('../src/modules/exams/exam.service.js');
  const { wrongQuestionService } = await import('../src/modules/wrong-questions/wrongQuestion.service.js');

  console.log('=== CTK-CORE-01-INT-002 Live Database Verification ===');

  const actor = {
    id: 'demo-student',
    roles: ['STUDENT'],
  };

  // 1. Verify DB connectivity & question count
  const questionCount = await sandboxPrisma.question.count();
  console.log(`[1] Total active questions in DB: ${questionCount}`);
  if (questionCount !== 605) {
    throw new Error(`Expected 605 questions, got ${questionCount}`);
  }

  // 2. Generate 80-question mock exam
  console.log('[2] Generating 80-question stratified mock exam...');
  const exam = await examService.generateExam(actor, {
    mode: 'official_100',
    strategy: 'stratified',
    certificationCode: '17300',
  });
  console.log(`- Attempt ID: ${exam.attemptId}`);
  console.log(`- Total Questions: ${exam.totalQuestions}`);
  console.log(`- Paper Title: ${exam.paperTitle}`);

  if (exam.questions.length !== 80) {
    throw new Error(`Expected 80 questions, got ${exam.questions.length}`);
  }

  // Check anti-cheating: no correctAnswer or explanation leaked
  const leakedAnswer = exam.questions.find((q: any) => (q as any).correctAnswer || (q as any).explanation);
  if (leakedAnswer) {
    throw new Error('ANTI-CHEAT VIOLATION: correctAnswer or explanation leaked to client!');
  }
  console.log('- Anti-cheat verification: PASS (0 answers/explanations leaked)');

  // 3. Submit exam: 60 correct, 20 wrong
  console.log('[3] Submitting exam answers to server scoring engine...');
  const attempt = await sandboxPrisma.examAttempt.findUnique({
    where: { id: exam.attemptId },
  });
  const assignedIds: string[] = JSON.parse(attempt?.assignedQuestionIds || '[]');
  const dbQuestions = await sandboxPrisma.question.findMany({
    where: { id: { in: assignedIds } },
  });
  const dbQMap = new Map(dbQuestions.map((q) => [q.id, q.correctAnswer]));

  const answers: Record<string, string> = {};
  assignedIds.forEach((id, idx) => {
    const realAns = dbQMap.get(id) || 'B';
    if (idx < 60) {
      answers[id] = realAns; // Correct
    } else {
      answers[id] = realAns === 'A' ? 'B' : 'A'; // Intentionally wrong
    }
  });

  const submitResult = await examService.submitExam(actor, exam.attemptId, {
    answers,
    durationSeconds: 1800,
  });

  console.log(`- Score: ${submitResult.score} / 100.00`);
  console.log(`- Correct Count: ${submitResult.correctCount}`);
  console.log(`- Wrong Count: ${submitResult.wrongCount}`);
  console.log(`- Is Passed: ${submitResult.isPassed}`);
  console.log(`- Snapshots Recorded: ${submitResult.snapshots.length}`);
  console.log(`- Section Breakdown Items: ${submitResult.sectionBreakdown.length}`);

  if (submitResult.score !== 75.0) {
    throw new Error(`Expected score 75.0, got ${submitResult.score}`);
  }
  if (!submitResult.isPassed) {
    throw new Error('Expected isPassed to be true for 75 points');
  }

  // 4. Verify Snapshots in DB
  const snapshotCount = await sandboxPrisma.examAnswerSnapshot.count({
    where: { attemptId: exam.attemptId },
  });
  console.log(`[4] DB Snapshots verified: ${snapshotCount} / 80`);
  if (snapshotCount !== 80) {
    throw new Error(`Expected 80 snapshots in DB, got ${snapshotCount}`);
  }

  // 5. Verify Wrong Question Notebook
  console.log('[5] Checking Wrong Question Notebook in DB...');
  const wrongList = await wrongQuestionService.getWrongQuestions(actor, {
    status: 'ALL',
    limit: 50,
  });
  console.log(`- Total Wrong Recorded: ${wrongList.stats.totalRecorded}`);
  console.log(`- Unresolved Count: ${wrongList.stats.unresolvedCount}`);
  console.log(`- Reviewing Count: ${wrongList.stats.reviewingCount}`);
  console.log(`- Mastered Count: ${wrongList.stats.masteredCount}`);

  if (wrongList.stats.totalRecorded < 20) {
    throw new Error(`Expected at least 20 wrong questions, got ${wrongList.stats.totalRecorded}`);
  }

  // 6. Test Practice State Machine: UNRESOLVED -> REVIEWING -> MASTERED
  const firstWrong = wrongList.items[0];
  console.log(`[6] Testing state machine on record: ${firstWrong.id} (Question: ${firstWrong.questionId})`);
  console.log(`- Initial Mastery Status: ${firstWrong.masteryStatus}, Consecutive: ${firstWrong.consecutiveCorrectCount}`);

  // Practice 1: Answer Correctly -> should transition to REVIEWING
  console.log('- Practice Step 1: Answering correctly...');
  const review1 = await wrongQuestionService.practiceReview(actor, firstWrong.id, firstWrong.correctAnswer);
  console.log(`  -> Status: ${review1.masteryStatus}, Consecutive: ${review1.consecutiveCorrectCount}, Resolved: ${review1.isResolved}`);
  if (review1.masteryStatus !== 'REVIEWING' || review1.consecutiveCorrectCount !== 1) {
    throw new Error('Expected status REVIEWING with consecutive 1');
  }

  // Practice 2: Answer Correctly again -> should transition to MASTERED
  console.log('- Practice Step 2: Answering correctly 2nd consecutive time...');
  const review2 = await wrongQuestionService.practiceReview(actor, firstWrong.id, firstWrong.correctAnswer);
  console.log(`  -> Status: ${review2.masteryStatus}, Consecutive: ${review2.consecutiveCorrectCount}, Resolved: ${review2.isResolved}`);
  if (review2.masteryStatus !== 'MASTERED' || review2.consecutiveCorrectCount !== 2 || !review2.isResolved) {
    throw new Error('Expected status MASTERED with consecutive 2 and isResolved true');
  }

  // Practice 3: Answer Wrongly -> should reset to UNRESOLVED, consecutive 0
  console.log('- Practice Step 3: Answering wrongly...');
  const wrongAns = firstWrong.correctAnswer === 'A' ? 'B' : 'A';
  const review3 = await wrongQuestionService.practiceReview(actor, firstWrong.id, wrongAns);
  console.log(`  -> Status: ${review3.masteryStatus}, Consecutive: ${review3.consecutiveCorrectCount}, Resolved: ${review3.isResolved}`);
  if (review3.masteryStatus !== 'UNRESOLVED' || review3.consecutiveCorrectCount !== 0 || review3.isResolved) {
    throw new Error('Expected status UNRESOLVED with consecutive 0 and isResolved false');
  }

  console.log('=== ALL LIVE VERIFICATION CHECKS PASSED ===');
}

runLiveVerification()
  .catch((err) => {
    console.error('LIVE VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await sandboxPrisma.$disconnect();
    await pool.end();
  });
