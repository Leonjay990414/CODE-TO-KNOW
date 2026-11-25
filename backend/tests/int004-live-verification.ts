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
  console.log('=============================================================================');
  console.log('  CTK-CORE-01-INT-004: Live PostgreSQL 17 End-to-End Sandbox Verification');
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
  const { classroomService } = await import('../src/modules/classrooms/classroom.service.js');
  const { adminService } = await import('../src/modules/admin/admin.service.js');

  // 1. Ensure Roles exist
  console.log('[1] Ensuring Roles in Sandbox DB...');
  const roleNames = ['STUDENT', 'TEACHER', 'ADMIN', 'SYSTEM_OPERATOR'];
  const rolesMap: Record<string, string> = {};
  for (const name of roleNames) {
    const r = await sandboxPrisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `Role ${name}` },
    });
    rolesMap[name] = r.id;
  }
  console.log(`- Roles verified: ${Object.keys(rolesMap).join(', ')}`);

  // 2. Ensure Test Users
  console.log('\n[2] Seeding / Ensuring Test Actors in Sandbox DB...');
  const testUsers = [
    { id: 'int004-student-01', email: 'int004.student1@example.com', name: '王小明 (學員)', role: 'STUDENT' },
    { id: 'int004-student-02', email: 'int004.student2@example.com', name: '李大同 (外部學員)', role: 'STUDENT' },
    { id: 'int004-teacher-01', email: 'int004.teacher1@example.com', name: '陳老師 (授課教師)', role: 'TEACHER' },
    { id: 'int004-teacher-02', email: 'int004.teacher2@example.com', name: '林老師 (隔壁班教師)', role: 'TEACHER' },
    { id: 'int004-admin-01', email: 'int004.admin1@example.com', name: '系統管理員 (ADMIN)', role: 'ADMIN' },
  ];

  for (const u of testUsers) {
    await sandboxPrisma.user.upsert({
      where: { id: u.id },
      update: { status: 'ACTIVE' },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: 'dummy_hash_for_test',
        displayName: u.name,
        status: 'ACTIVE',
      },
    });

    // Ensure role relation
    await sandboxPrisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: u.id,
          roleId: rolesMap[u.role],
        },
      },
      update: {},
      create: {
        userId: u.id,
        roleId: rolesMap[u.role],
      },
    });
  }
  console.log(`- 5 Test Users seeded and roles assigned.`);

  // Ensure test certification exists for class creation
  const cert = await sandboxPrisma.certification.findFirst();
  const certId = cert ? cert.id : 'web-design-c';

  // Ensure test class owned by teacher 1
  const testClass = await sandboxPrisma.class.upsert({
    where: { id: 'int004-class-alpha' },
    update: { creatorId: 'int004-teacher-01' },
    create: {
      id: 'int004-class-alpha',
      name: '17300 網頁設計衝刺甲班',
      joinCode: 'TEST9999',
      description: 'INT-004 測試專用班級',
      certificationId: certId,
      creatorId: 'int004-teacher-01',
      status: 'ACTIVE',
    },
  });

  // Enroll student 1 into test class
  await sandboxPrisma.classEnrollment.upsert({
    where: {
      classId_studentId: {
        classId: testClass.id,
        studentId: 'int004-student-01',
      },
    },
    update: { status: 'JOINED' },
    create: {
      classId: testClass.id,
      studentId: 'int004-student-01',
      seatNumber: '01',
      status: 'JOINED',
    },
  });
  console.log(`- Test class [${testClass.name}] created and Student 1 enrolled.`);

  // ==========================================================================
  // 3. Student Domain Live Tests
  // ==========================================================================
  console.log('\n[3] Testing Student Domain APIs...');
  const studentActor = { id: 'int004-student-01', roles: ['STUDENT'] };

  const dashboard = await studentService.getDashboard(studentActor);
  console.log(`- GET /api/student/dashboard response:`);
  console.log(`  * Student: ${dashboard.student.displayName} (${dashboard.student.email})`);
  console.log(`  * Overview Exams Taken: ${dashboard.overview.totalExamsTaken}`);
  console.log(`  * Overview Wrong Questions: ${dashboard.overview.wrongQuestionsTotal}`);
  console.log(`  * Enrolled Classes Count: ${dashboard.enrolledClasses.length}`);
  if (dashboard.enrolledClasses.length < 1) {
    throw new Error('FAIL: Student dashboard should include enrolled class');
  }

  // Update student profile
  const profileUpdateResult = await studentService.updateProfile(studentActor, {
    displayName: '王小明 (已修訂個人檔案)',
    bio: '積極準備 17300 網頁設計丙級術科考試！',
  });
  console.log(`- PATCH /api/student/profile response:`);
  console.log(`  * Updated Display Name: ${profileUpdateResult.displayName}`);
  console.log(`  * Bio: ${profileUpdateResult.bio}`);

  // ==========================================================================
  // 4. Teacher Domain Live Tests
  // ==========================================================================
  console.log('\n[4] Testing Teacher Domain Analytics & Roster Progress...');
  const teacher1Actor = { id: 'int004-teacher-01', roles: ['TEACHER'] };
  const teacher2Actor = { id: 'int004-teacher-02', roles: ['TEACHER'] };

  // Teacher 1 gets analytics for their own class
  const classAnalytics = await classroomService.getClassroomAnalytics(
    teacher1Actor.id,
    teacher1Actor.roles,
    testClass.id
  );
  console.log(`- GET /api/classrooms/:id/analytics response:`);
  console.log(`  * Class: ${classAnalytics.className}`);
  console.log(`  * Total Students: ${classAnalytics.totalStudents}`);
  console.log(`  * Pass Rate: ${classAnalytics.examStats.passRate}%`);
  console.log(`  * Practical records: ${classAnalytics.practicalStats.studentsWithPracticalRecords}`);

  // Cross-teacher isolation check: Teacher 2 attempts to get analytics of Teacher 1's class
  let teacherIsolationPassed = false;
  try {
    await classroomService.getClassroomAnalytics(teacher2Actor.id, teacher2Actor.roles, testClass.id);
  } catch (err: any) {
    if (err.statusCode === 403) {
      teacherIsolationPassed = true;
      console.log(`  * Cross-teacher class access correctly REJECTED with 403 Forbidden.`);
    }
  }
  if (!teacherIsolationPassed) {
    throw new Error('FAIL: Teacher 2 should NOT be allowed to access Teacher 1 classroom analytics');
  }

  // Teacher 1 inspects enrolled student's progress
  const studentProgress = await classroomService.getStudentClassroomProgress(
    teacher1Actor.id,
    teacher1Actor.roles,
    testClass.id,
    'int004-student-01'
  );
  console.log(`- GET /api/classrooms/:id/students/:studentId/progress response:`);
  console.log(`  * Inspected Student: ${studentProgress.student.displayName}`);
  console.log(`  * Total Exams Taken: ${studentProgress.exams.totalTaken}`);
  console.log(`  * Practical Records: ${studentProgress.practicals.length}`);

  // Cross-class student boundary check: Teacher 1 tries to inspect student 2 (not enrolled in class)
  let studentBoundaryPassed = false;
  try {
    await classroomService.getStudentClassroomProgress(
      teacher1Actor.id,
      teacher1Actor.roles,
      testClass.id,
      'int004-student-02'
    );
  } catch (err: any) {
    if (err.statusCode === 403) {
      studentBoundaryPassed = true;
      console.log(`  * Cross-class student inspection correctly REJECTED with 403 Forbidden.`);
    }
  }
  if (!studentBoundaryPassed) {
    throw new Error('FAIL: Inspecting non-enrolled student should be rejected');
  }

  // ==========================================================================
  // 5. Admin Domain Live Tests
  // ==========================================================================
  console.log('\n[5] Testing Admin Domain Overview & User Governance...');
  const adminActor = { id: 'int004-admin-01', roles: ['ADMIN'] };

  // Platform Overview
  const platformOverview = await adminService.getPlatformOverview();
  console.log(`- GET /api/admin/overview dynamic DB counts:`);
  console.log(`  * Total Users: ${platformOverview.users.total}`);
  console.log(`  * Total Classrooms: ${platformOverview.classrooms.total}`);
  console.log(`  * Total Official Questions: ${platformOverview.content.officialQuestionsCount}`);
  console.log(`  * Total Exam Attempts: ${platformOverview.content.examAttemptsTaken}`);
  console.log(`  * Total Practical Practices: ${platformOverview.content.practicalPracticesCount}`);
  console.log(`  * Total Audit Logs: ${platformOverview.governance.totalAuditLogs}`);

  // List Users
  const userListResult = await adminService.listUsers({ page: 1, limit: 10 });
  console.log(`- GET /api/admin/users response:`);
  console.log(`  * Total Users in DB: ${userListResult.pagination.total}`);
  console.log(`  * Page 1 Users Returned: ${userListResult.users.length}`);

  // User Status Toggle (Suspend student)
  console.log(`- Testing User Status Suspension & Self-Lockout Defense:`);
  let selfLockoutBlocked = false;
  try {
    await adminService.updateUserStatus(adminActor.id, adminActor.id, { status: 'SUSPENDED' });
  } catch (err: any) {
    if (err.statusCode === 400) {
      selfLockoutBlocked = true;
      console.log(`  * Self-suspension correctly BLOCKED with 400 Bad Request.`);
    }
  }
  if (!selfLockoutBlocked) {
    throw new Error('FAIL: Admin self-suspension must be blocked');
  }

  // Suspend student 1
  const suspendResult = await adminService.updateUserStatus(adminActor.id, 'int004-student-01', {
    status: 'SUSPENDED',
    reason: 'Live Sandbox Governance Test',
  });
  console.log(`  * Student 1 Status changed to: ${suspendResult.status}`);
  if (suspendResult.status !== 'SUSPENDED') {
    throw new Error('FAIL: User status should be SUSPENDED');
  }

  // Restore student 1
  const restoreResult = await adminService.updateUserStatus(adminActor.id, 'int004-student-01', {
    status: 'ACTIVE',
    reason: 'Restoring to active state',
  });
  console.log(`  * Student 1 Status restored to: ${restoreResult.status}`);

  // User Role Management (Grant & Revoke)
  console.log(`- Testing Role Grant/Revocation & Self-Demotion Defense:`);
  let selfDemotionBlocked = false;
  try {
    await adminService.updateUserRole(adminActor.id, adminActor.id, {
      role: 'ADMIN',
      action: 'revoke',
    });
  } catch (err: any) {
    if (err.statusCode === 400) {
      selfDemotionBlocked = true;
      console.log(`  * Self-demotion correctly BLOCKED with 400 Bad Request.`);
    }
  }
  if (!selfDemotionBlocked) {
    throw new Error('FAIL: Admin self-demotion must be blocked');
  }

  // Grant TEACHER role to student 1
  const grantRoleResult = await adminService.updateUserRole(adminActor.id, 'int004-student-01', {
    role: 'TEACHER',
    action: 'grant',
  });
  console.log(`  * Student 1 Roles after grant: ${grantRoleResult.roles.join(', ')}`);
  if (!grantRoleResult.roles.includes('TEACHER')) {
    throw new Error('FAIL: TEACHER role should be granted to Student 1');
  }

  // Revoke TEACHER role from student 1
  const revokeRoleResult = await adminService.updateUserRole(adminActor.id, 'int004-student-01', {
    role: 'TEACHER',
    action: 'revoke',
  });
  console.log(`  * Student 1 Roles after revoke: ${revokeRoleResult.roles.join(', ')}`);
  if (revokeRoleResult.roles.includes('TEACHER')) {
    throw new Error('FAIL: TEACHER role should be revoked from Student 1');
  }

  // Check Audit Logs generated
  const auditLogs = await sandboxPrisma.auditLog.findMany({
    where: { userId: 'int004-admin-01' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log(`\n[6] Audit Log Verification:`);
  console.log(`- Found ${auditLogs.length} audit logs created by Admin:`);
  for (const log of auditLogs) {
    console.log(`  * Action: [${log.action}] at ${log.createdAt.toISOString()}`);
  }

  console.log('\n=============================================================================');
  console.log('  CTK-CORE-01-INT-004 Live Sandbox Verification: ALL TESTS PASSED (PASS)');
  console.log('=============================================================================');
}

runLiveVerification()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ Live Verification Failed:', err);
    await pool.end();
    process.exit(1);
  });
