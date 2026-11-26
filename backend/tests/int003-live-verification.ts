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
  const { practicalService } = await import('../src/modules/practicals/practical.service.js');

  console.log('=== CTK-CORE-01-INT-003 Live Sandbox Verification ===');
  console.log('Database: ctk_core01_db001_scratch @ 127.0.0.1:5433');

  // Ensure test users exist in database for foreign key constraint
  await sandboxPrisma.user.upsert({
    where: { id: 'demo-student' },
    update: {},
    create: {
      id: 'demo-student',
      email: 'student@example.com',
      passwordHash: 'dummy_hash',
      displayName: '展示學生',
      status: 'ACTIVE',
    },
  });

  await sandboxPrisma.user.upsert({
    where: { id: 'demo-student-02' },
    update: {},
    create: {
      id: 'demo-student-02',
      email: 'student2@example.com',
      passwordHash: 'dummy_hash',
      displayName: '測試學生二號',
      status: 'ACTIVE',
    },
  });

  const studentA = {
    id: 'demo-student',
    roles: ['STUDENT'],
  };

  const studentB = {
    id: 'demo-student-02',
    roles: ['STUDENT'],
  };

  // 1. Verify 5 Official Practical Tasks
  console.log('\n[1] Verifying Official 5 Tasks in Database...');
  const taskCount = await sandboxPrisma.practicalTask.count();
  console.log(`- Total Practical Tasks: ${taskCount}`);
  if (taskCount !== 5) {
    throw new Error(`Expected exactly 5 practical tasks, got ${taskCount}`);
  }

  const tasks = await sandboxPrisma.practicalTask.findMany({
    orderBy: { taskNumber: 'asc' },
  });
  const expectedCodes = [
    '17300-104301',
    '17300-104302',
    '17300-104303',
    '17300-104304',
    '17300-104305',
  ];
  tasks.forEach((t, i) => {
    console.log(`  Task ${t.taskNumber}: [${t.taskCode}] ${t.title} (${t.canvasWidth})`);
    if (t.taskCode !== expectedCodes[i]) {
      throw new Error(`Expected taskCode ${expectedCodes[i]}, got ${t.taskCode}`);
    }
  });

  // Verify NO 6th task exists
  const invalidTask = await sandboxPrisma.practicalTask.findFirst({
    where: {
      OR: [
        { taskNumber: 6 },
        { title: { contains: '台灣美食' } },
        { taskCode: { contains: '104306' } },
      ],
    },
  });
  if (invalidTask) {
    throw new Error(`STRICT COMPLIANCE VIOLATION: Non-official 6th task found: ${invalidTask.title}`);
  }
  console.log('- Strict Compliance: PASS (0 unauthorized 6th task)');

  // 2. Verify Step Hierarchy and Version A/B counts
  console.log('\n[2] Verifying Steps and Version A/B Distribution...');
  const totalSteps = await sandboxPrisma.practicalStep.count();
  const vASteps = await sandboxPrisma.practicalStep.count({ where: { version: 'VERSION_A' } });
  const vBSteps = await sandboxPrisma.practicalStep.count({ where: { version: 'VERSION_B' } });

  console.log(`- Total Steps: ${totalSteps}`);
  console.log(`- Version A (Official Material) Steps: ${vASteps}`);
  console.log(`- Version B (Video Curriculum) Steps: ${vBSteps}`);

  if (totalSteps !== 71 || vASteps !== 45 || vBSteps !== 26) {
    throw new Error(`Step count mismatch: expected 71 total (45 vA, 26 vB), got ${totalSteps} (${vASteps} vA, ${vBSteps} vB)`);
  }

  // 3. Test practicalService.getTasks
  console.log('\n[3] Testing practicalService.getTasks()...');
  const taskList = await practicalService.getTasks(studentA);
  if (taskList.length !== 5) {
    throw new Error(`Expected 5 task summaries, got ${taskList.length}`);
  }
  console.log(`- Returned ${taskList.length} tasks successfully with progress metrics`);

  // 4. Test Code Saving with Version Isolation
  console.log('\n[4] Testing Code Saving and Version Isolation for Student A...');
  const vACode = {
    html: '<!-- Task 1 vA HTML -->\n<div class="main">Task 1 Version A</div>',
    css: '/* Task 1 vA CSS */\n.main { color: #526B7B; }',
    js: '// Task 1 vA JS\nconsole.log("Running Version A");',
  };
  const vBCode = {
    html: '<!-- Task 1 vB HTML -->\n<div class="video-layout">Task 1 Version B</div>',
    css: '/* Task 1 vB CSS */\n.video-layout { display: flex; }',
    js: '// Task 1 vB JS\nconsole.log("Running Version B");',
  };

  // Save Version A
  await practicalService.saveProgress(studentA, 1, {
    version: 'VERSION_A',
    savedHtmlCode: vACode.html,
    savedCssCode: vACode.css,
    savedJsCode: vACode.js,
    status: 'IN_PROGRESS',
  });

  // Save Version B
  await practicalService.saveProgress(studentA, 1, {
    version: 'VERSION_B',
    savedHtmlCode: vBCode.html,
    savedCssCode: vBCode.css,
    savedJsCode: vBCode.js,
    status: 'IN_PROGRESS',
  });

  // Retrieve Version A and verify
  const loadedVA = await practicalService.getSavedCode(studentA, 1, 'VERSION_A');
  if (loadedVA.savedHtmlCode !== vACode.html || loadedVA.savedCssCode !== vACode.css || loadedVA.savedJsCode !== vACode.js) {
    throw new Error('Version A saved code mismatch!');
  }
  console.log('- Version A Code Retrieval: PASS (exact match)');

  // Retrieve Version B and verify
  const loadedVB = await practicalService.getSavedCode(studentA, 1, 'VERSION_B');
  if (loadedVB.savedHtmlCode !== vBCode.html || loadedVB.savedCssCode !== vBCode.css || loadedVB.savedJsCode !== vBCode.js) {
    throw new Error('Version B saved code mismatch!');
  }
  console.log('- Version B Code Retrieval: PASS (exact match)');

  // Cross-version integrity verification
  if (loadedVA.savedHtmlCode === loadedVB.savedHtmlCode) {
    throw new Error('Version isolation failure: Version A and Version B code collided!');
  }
  console.log('- Strict Version Isolation: PASS (Version A ≠ Version B)');

  // 5. Test Step Completion Tracking
  console.log('\n[5] Testing Step Completion and Progress Tracking...');
  // Mark step 1 in Task 1 Version A as completed
  const firstStepVA = await sandboxPrisma.practicalStep.findFirst({
    where: { task: { taskNumber: 1 }, version: 'VERSION_A', stepNumber: 1 },
  });
  if (!firstStepVA) throw new Error('Task 1 Step 1 not found');

  await practicalService.saveProgress(studentA, 1, {
    version: 'VERSION_A',
    stepId: firstStepVA.id,
    isStepCompleted: true,
  });

  const task1DetailsVA = await practicalService.getTaskDetails(studentA, 1, 'VERSION_A');
  console.log(`- Task 1 Version A Progress: ${task1DetailsVA.progress.completedStepsCount} / ${task1DetailsVA.progress.totalStepsCount} steps`);
  if (task1DetailsVA.progress.completedStepsCount !== 1) {
    throw new Error(`Expected 1 completed step in Version A, got ${task1DetailsVA.progress.completedStepsCount}`);
  }

  // Ensure Version B step completion was untouched
  const task1DetailsVB = await practicalService.getTaskDetails(studentA, 1, 'VERSION_B');
  console.log(`- Task 1 Version B Progress: ${task1DetailsVB.progress.completedStepsCount} / ${task1DetailsVB.progress.totalStepsCount} steps`);
  if (task1DetailsVB.progress.completedStepsCount !== 0) {
    throw new Error(`Expected 0 completed steps in Version B, got ${task1DetailsVB.progress.completedStepsCount}`);
  }
  console.log('- Step Progress Isolation: PASS (Version A completed step does not leak into Version B)');

  // 6. Multi-User IDOR Security Verification
  console.log('\n[6] Testing Multi-User IDOR Security Isolation...');
  const studentBCode = await practicalService.getSavedCode(studentB, 1, 'VERSION_A');
  console.log(`- Student B hasSavedCode: ${studentBCode.hasSavedCode}`);
  if (studentBCode.hasSavedCode) {
    throw new Error('IDOR SECURITY VIOLATION: Student B saw existing saved code from Student A!');
  }
  if (studentBCode.savedHtmlCode === vACode.html) {
    throw new Error('IDOR SECURITY VIOLATION: Student B obtained Student A private HTML code!');
  }
  console.log('- IDOR Cross-User Defense: PASS (Student B cannot access Student A code/progress)');

  // 7. Verify Database Row Integrity
  console.log('\n[7] Database Row Verification...');
  const progressRows = await sandboxPrisma.practicalProgress.findMany({
    where: { taskId: tasks[0].id },
  });
  console.log(`- Total PracticalProgress rows for Task 1: ${progressRows.length}`);
  progressRows.forEach((r) => {
    console.log(`  Row ID: ${r.id} | User: ${r.userId} | Version: ${r.version} | Status: ${r.status}`);
  });

  console.log('\n=== ALL 7 LIVE VERIFICATION CHECKS PASSED SUCCESSFULLY ===\n');
}

runLiveVerification()
  .catch((err) => {
    console.error('VERIFICATION FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    await sandboxPrisma.$disconnect();
    await pool.end();
  });
