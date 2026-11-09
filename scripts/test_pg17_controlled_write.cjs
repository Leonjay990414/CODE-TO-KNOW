/**
 * CODE TO KNOW (碼上學)
 * PHASE 3C-4F-R6: PG17 Controlled Write Integration Test & Transaction Integrity Runner
 * 
 * Inherits and enforces the Four-Layer Guard Architecture:
 * - Guard 1: Entry Environment Hard-Locking (NODE_ENV=test, clean ambient URLs)
 * - Guard 2: Pre-connection Target Whitelist Validation (Host, Port 5433, DB, User)
 * - Guard 3: Post-connection SQL Identity Handshake (Engine PostgreSQL 17.x, DB, User)
 * - Guard 4: Prisma Instance Identity Assertion (appPrisma === testPrisma)
 * 
 * Strict Scope:
 * - Target: ONLY 127.0.0.1:5433 (code_to_know_cloud_restore_test)
 * - Preserves: R1 baseline (3 users, 3 roles, 3 sessions, 10 audit logs, 2 migration history)
 * - Preserves: PG16 baseline untouched (5432, 4 users, 9 audit logs)
 * - Operates: R6 tagged test data ONLY (prefix: R6_PG17_20261109)
 * - Cleans up: Reverse dependency exact ID deletion, verify zero residue
 */

const fs = require('fs');
const path = require('path');

// =============================================================================
// GUARD 1: ENTRY ENVIRONMENT HARD-LOCKING
// =============================================================================
process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL;
delete process.env.DIRECT_URL;
delete process.env.MIGRATION_DATABASE_URL;

const APPROVED_TARGET = {
  host: '127.0.0.1',
  port: 5433,
  database: 'code_to_know_cloud_restore_test',
  user: 'codetoknow_restore',
};

// =============================================================================
// GUARD 2: PRE-CONNECTION TARGET WHITELIST VALIDATOR
// =============================================================================
function validateTargetAgainstWhitelist(options) {
  if (!options) {
    throw new Error('[GUARD 2 REJECTED] Connection options missing.');
  }
  if (options.host !== APPROVED_TARGET.host) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed host: '${options.host}'. Approved: '${APPROVED_TARGET.host}'.`);
  }
  if (Number(options.port) !== APPROVED_TARGET.port) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed port: '${options.port}'. Refusing connection to prevent PG16 or Cloud write. Approved port: ${APPROVED_TARGET.port}.`);
  }
  if (options.database !== APPROVED_TARGET.database) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed database: '${options.database}'. Approved: '${APPROVED_TARGET.database}'.`);
  }
  if (options.user !== APPROVED_TARGET.user) {
    throw new Error(`[GUARD 2 REJECTED] Disallowed user: '${options.user}'. Approved: '${APPROVED_TARGET.user}'.`);
  }
  if (!options.password || !options.password.trim()) {
    throw new Error('[GUARD 2 REJECTED] Missing database authentication password.');
  }
  return true;
}

// =============================================================================
// GUARD 3: POST-CONNECTION SQL IDENTITY HANDSHAKE
// =============================================================================
async function assertPostConnectIdentity(pool) {
  const probe = await pool.query('SELECT version(), current_database(), current_user, inet_server_port();');
  const row = probe.rows[0];

  const clientPort = pool.options.port;
  const dbName = row.current_database;
  const dbUser = row.current_user;
  const isPg17 = row.version.includes('PostgreSQL 17');

  if (clientPort !== APPROVED_TARGET.port || dbName !== APPROVED_TARGET.database || dbUser !== APPROVED_TARGET.user || !isPg17) {
    throw new Error('[GUARD 3 REJECTED] Connected target identity verification failed! Target is NOT confirmed PG17 restore sandbox.');
  }

  return {
    verified: true,
    database: dbName,
    user: dbUser,
    clientPort,
    version: row.version.split(',')[0],
  };
}

// =============================================================================
// INITIALIZE CONTROLLED WRITE ENVIRONMENT
// =============================================================================
async function initControlledWriteEnv() {
  const passwordFile = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
  if (!fs.existsSync(passwordFile)) {
    throw new Error(`[INIT ERROR] Password file not found at ${passwordFile}`);
  }
  const password = fs.readFileSync(passwordFile, 'utf8').trim();

  const targetOptions = {
    host: APPROVED_TARGET.host,
    port: APPROVED_TARGET.port,
    database: APPROVED_TARGET.database,
    user: APPROVED_TARGET.user,
    password,
  };

  validateTargetAgainstWhitelist(targetOptions);

  const rootDir = path.resolve(__dirname, '..');
  const backendDir = path.join(rootDir, 'backend');
  const pg = require(path.join(backendDir, 'node_modules/pg'));
  const { PrismaClient } = require(path.join(backendDir, 'node_modules/@prisma/client'));
  const { PrismaPg } = require(path.join(backendDir, 'node_modules/@prisma/adapter-pg'));

  const pool = new pg.Pool({
    host: targetOptions.host,
    port: targetOptions.port,
    user: targetOptions.user,
    password: targetOptions.password,
    database: targetOptions.database,
    ssl: false,
    connectionTimeoutMillis: 5000,
  });

  const identity = await assertPostConnectIdentity(pool);

  const adapter = new PrismaPg(pool);
  const testPrisma = new PrismaClient({
    adapter,
    log: ['error'],
  });

  // Inject into global.__prisma BEFORE requiring backend app modules
  global.__prisma = testPrisma;

  const { prisma: appPrisma } = require(path.join(backendDir, 'dist/config/database.js'));

  // GUARD 4: Assert Instance Identity
  if (appPrisma !== testPrisma) {
    await testPrisma.$disconnect();
    await pool.end();
    throw new Error('[GUARD 4 REJECTED] Prisma instance identity mismatch! appPrisma !== testPrisma.');
  }

  return {
    pool,
    prisma: testPrisma,
    identity,
    async shutdown() {
      await testPrisma.$disconnect();
      await pool.end();
    },
  };
}

// =============================================================================
// R6 CONTROLLED WRITE INTEGRATION TEST SUITE
// =============================================================================
async function runR6TestSuite() {
  console.log('=== PHASE 3C-4F-R6: PG17 CONTROLLED WRITE INTEGRATION & TRANSACTION INTEGRITY ===\n');

  const env = await initControlledWriteEnv();
  const prisma = env.prisma;
  const pool = env.pool;

  console.log('[1. Guard Verification & Identity Handshake]');
  console.log('- Guard 1 (Env Hard-Lock): PASS');
  console.log('- Guard 2 (Whitelist Check): PASS');
  console.log(`- Guard 3 (SQL Handshake): PASS -> ${env.identity.database} (${env.identity.version})`);
  console.log('- Guard 4 (Pointer Identity): PASS -> appPrisma === testPrisma\n');

  // Track created R6 entities for 100% verified exact cleanup
  const createdR6 = {
    users: [],
    profiles: [],
    userRoles: [],
    teacherApps: [],
    auditLogs: [],
  };

  const results = [];

  try {
    // -------------------------------------------------------------------------
    // Baseline & Isolation Pre-Check
    // -------------------------------------------------------------------------
    console.log('[2. Pre-Test Baseline Verification]');
    const initialUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    console.log(`- Initial PG17 Users count: ${initialUsers.length} (Expected: 3)`);
    if (initialUsers.length !== 3) {
      throw new Error(`Unexpected initial user count: ${initialUsers.length}. Aborting.`);
    }

    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    console.log(`- Available Roles: ${roles.map(r => r.name).join(', ')}`);
    const studentRole = roles.find(r => r.name === 'STUDENT');
    if (!studentRole) {
      throw new Error('Required STUDENT role not found.');
    }

    // Ensure R6 identifiers do not exist before creation
    const r6Email1 = 'r6_test_student_20261109@codetoknow.test.invalid';
    const r6Email2 = 'r6_test_tx_commit_20261109@codetoknow.test.invalid';
    const r6Email3 = 'r6_test_tx_rollback_20261109@codetoknow.test.invalid';

    const conflictCheck = await prisma.user.findMany({
      where: { email: { in: [r6Email1, r6Email2, r6Email3] } },
    });
    if (conflictCheck.length > 0) {
      throw new Error(`Pre-existing R6 emails detected (${conflictCheck.length}). Aborting.`);
    }
    console.log('- Pre-check confirms zero conflicting R6 test entities exist.\n');

    // -------------------------------------------------------------------------
    // TEST A: Basic Write (Insert User, UserProfile, UserRole, verify relations)
    // -------------------------------------------------------------------------
    console.log('[3. Test A: Basic Controlled Write]');
    const userA = await prisma.user.create({
      data: {
        email: r6Email1,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$R6SaltPlaceholderHashValue001',
        displayName: 'R6 Test Student 20261109',
        status: 'ACTIVE',
        profile: {
          create: {
            nickname: 'R6 Student A',
            timezone: 'Asia/Taipei',
            language: 'zh-TW',
            educationLevel: 'HIGHER_EDUCATION',
            bio: 'R6 controlled write integration test profile',
          },
        },
        roles: {
          create: {
            roleId: studentRole.id,
          },
        },
      },
      include: {
        profile: true,
        roles: { include: { role: true } },
      },
    });

    createdR6.users.push(userA.id);
    if (userA.profile) createdR6.profiles.push(userA.profile.id);
    if (userA.roles && userA.roles[0]) createdR6.userRoles.push(userA.roles[0].id);

    console.log(`- Created User A: ${userA.id} (${userA.email})`);
    console.log(`- Profile created: ${userA.profile?.id}, Nickname: ${userA.profile?.nickname}`);
    console.log(`- Role mapped: ${userA.roles[0]?.role?.name}`);

    // Re-query to verify persistence and field integrity
    const queriedUserA = await prisma.user.findUnique({
      where: { id: userA.id },
      include: { profile: true, roles: { include: { role: true } } },
    });

    if (
      queriedUserA &&
      queriedUserA.email === r6Email1 &&
      queriedUserA.profile?.nickname === 'R6 Student A' &&
      queriedUserA.roles[0]?.role?.name === 'STUDENT'
    ) {
      console.log('- Test A (Basic Write & Relation Verification): PASS\n');
      results.push({ test: 'Test A: Basic Write', status: 'PASS' });
    } else {
      throw new Error('Test A verification failed: Queried user fields do not match.');
    }

    // -------------------------------------------------------------------------
    // TEST B: Update Test (Update created test data, verify changes and isolation)
    // -------------------------------------------------------------------------
    console.log('[4. Test B: Update Test]');
    const updatedUserA = await prisma.user.update({
      where: { id: userA.id },
      data: {
        displayName: 'R6 Test Student 20261109 Updated',
        profile: {
          update: {
            nickname: 'R6 Student A Renamed',
            bio: 'Updated bio during R6 test',
          },
        },
      },
      include: { profile: true },
    });

    if (
      updatedUserA.displayName === 'R6 Test Student 20261109 Updated' &&
      updatedUserA.profile?.nickname === 'R6 Student A Renamed'
    ) {
      console.log(`- Updated displayName: ${updatedUserA.displayName}`);
      console.log(`- Updated nickname: ${updatedUserA.profile?.nickname}`);
      console.log('- Test B (Update & Isolation Verification): PASS\n');
      results.push({ test: 'Test B: Update Test', status: 'PASS' });
    } else {
      throw new Error('Test B verification failed: Update did not apply as expected.');
    }

    // -------------------------------------------------------------------------
    // TEST C: Unique Constraint Rejection
    // -------------------------------------------------------------------------
    console.log('[5. Test C: Unique Constraint Rejection]');
    let uniqueRejected = false;
    let uniqueErrorCode = null;

    try {
      await prisma.user.create({
        data: {
          email: r6Email1, // Duplicate email!
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$DuplicateHash',
          displayName: 'R6 Duplicate Attempt',
          status: 'ACTIVE',
        },
      });
    } catch (err) {
      uniqueRejected = true;
      uniqueErrorCode = err.code || err.name;
      console.log(`- Rejection caught as expected: Code = ${uniqueErrorCode} (${err.message.split('\n').pop()})`);
    }

    // Verify UserProfile unique userId constraint rejection as well
    let profileUniqueRejected = false;
    try {
      await prisma.userProfile.create({
        data: {
          userId: userA.id, // Duplicate profile for same user!
          nickname: 'Duplicate Profile Attempt',
        },
      });
    } catch (err) {
      profileUniqueRejected = true;
      console.log(`- UserProfile unique constraint rejection caught: Code = ${err.code}`);
    }

    if (uniqueRejected && profileUniqueRejected) {
      console.log('- Test C (Unique Constraint Rejection): PASS\n');
      results.push({ test: 'Test C: Unique Constraint', status: 'PASS' });
    } else {
      throw new Error('Test C failed: Expected unique constraint violation was not triggered.');
    }

    // -------------------------------------------------------------------------
    // TEST D: Foreign Key Verification (Valid FK + Invalid FK Rejection)
    // -------------------------------------------------------------------------
    console.log('[6. Test D: Foreign Key Verification]');
    // Valid FK creation
    const teacherApp = await prisma.teacherApplication.create({
      data: {
        userId: userA.id,
        schoolName: 'Taipei Tech High School',
        subject: 'Computer Science',
        reason: 'R6 controlled write integration test teacher application',
        status: 'PENDING',
      },
    });
    createdR6.teacherApps.push(teacherApp.id);
    console.log(`- Valid FK TeacherApplication created: ${teacherApp.id} (userId: ${teacherApp.userId})`);

    // Invalid FK creation (non-existent userId)
    let fkRejected = false;
    let fkErrorCode = null;
    const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

    try {
      await prisma.teacherApplication.create({
        data: {
          userId: nonExistentUserId,
          schoolName: 'Invalid School',
          subject: 'Math',
          reason: 'This should fail foreign key check',
          status: 'PENDING',
        },
      });
    } catch (err) {
      fkRejected = true;
      fkErrorCode = err.code || err.name;
      console.log(`- Invalid FK rejection caught as expected: Code = ${fkErrorCode} (${err.message.split('\n').pop()})`);
    }

    if (teacherApp.id && fkRejected) {
      console.log('- Test D (Foreign Key Valid & Rejection): PASS\n');
      results.push({ test: 'Test D: Foreign Key', status: 'PASS' });
    } else {
      throw new Error('Test D failed: Foreign key verification did not behave as expected.');
    }

    // -------------------------------------------------------------------------
    // TEST E: Transaction Commit
    // -------------------------------------------------------------------------
    console.log('[7. Test E: Transaction Commit]');
    const txCommitResult = await prisma.$transaction(async (tx) => {
      const userE = await tx.user.create({
        data: {
          email: r6Email2,
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$R6TxCommitHash002',
          displayName: 'R6 Tx Commit User',
          status: 'ACTIVE',
          profile: {
            create: {
              nickname: 'Tx Commit Nickname',
              bio: 'Created inside transaction commit test',
            },
          },
        },
        include: { profile: true },
      });

      const auditE = await tx.auditLog.create({
        data: {
          userId: userE.id,
          action: 'R6_TX_COMMIT_TEST',
          details: JSON.stringify({ phase: 'R6', type: 'TRANSACTION_COMMIT_VERIFIED' }),
          ipAddress: '127.0.0.1',
          userAgent: 'R6-Controlled-Write-Runner/1.0',
        },
      });

      return { user: userE, audit: auditE };
    });

    createdR6.users.push(txCommitResult.user.id);
    if (txCommitResult.user.profile) createdR6.profiles.push(txCommitResult.user.profile.id);
    createdR6.auditLogs.push(txCommitResult.audit.id);

    // Verify from outside transaction
    const queryTxUser = await prisma.user.findUnique({
      where: { id: txCommitResult.user.id },
      include: { profile: true },
    });
    const queryTxAudit = await prisma.auditLog.findUnique({
      where: { id: txCommitResult.audit.id },
    });

    if (
      queryTxUser &&
      queryTxUser.email === r6Email2 &&
      queryTxAudit &&
      queryTxAudit.action === 'R6_TX_COMMIT_TEST'
    ) {
      console.log(`- Transaction committed successfully: User ${queryTxUser.id}, AuditLog ${queryTxAudit.id}`);
      console.log('- Test E (Transaction Commit): PASS\n');
      results.push({ test: 'Test E: Transaction Commit', status: 'PASS' });
    } else {
      throw new Error('Test E failed: Transaction records not found outside transaction.');
    }

    // -------------------------------------------------------------------------
    // TEST F: Transaction Rollback
    // -------------------------------------------------------------------------
    console.log('[8. Test F: Transaction Rollback]');
    let rollbackTriggered = false;
    let rollbackErrorMsg = '';

    try {
      await prisma.$transaction(async (tx) => {
        const userF = await tx.user.create({
          data: {
            email: r6Email3,
            passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$R6TxRollbackHash003',
            displayName: 'R6 Tx Rollback User',
            status: 'ACTIVE',
            profile: {
              create: {
                nickname: 'Rollback Ghost Profile',
              },
            },
          },
        });

        await tx.auditLog.create({
          data: {
            userId: userF.id,
            action: 'R6_TX_ROLLBACK_TEST',
            details: 'This record must be rolled back',
            ipAddress: '127.0.0.1',
          },
        });

        // Intentional controlled abort
        throw new Error('[R6_CONTROLLED_ROLLBACK] Intentional transaction abort for verification');
      });
    } catch (err) {
      if (err.message.includes('[R6_CONTROLLED_ROLLBACK]')) {
        rollbackTriggered = true;
        rollbackErrorMsg = err.message;
        console.log(`- Intentional transaction failure caught: ${rollbackErrorMsg}`);
      } else {
        throw err;
      }
    }

    // Verify outside transaction that userF and rollback audit do NOT exist
    const ghostUser = await prisma.user.findUnique({ where: { email: r6Email3 } });
    const ghostAudit = await prisma.auditLog.findMany({ where: { action: 'R6_TX_ROLLBACK_TEST' } });

    if (rollbackTriggered && ghostUser === null && ghostAudit.length === 0) {
      console.log('- Verified: Ghost user is null and rollback audit logs count is 0.');
      console.log('- Test F (Transaction Rollback): PASS\n');
      results.push({ test: 'Test F: Transaction Rollback', status: 'PASS' });
    } else {
      throw new Error('Test F failed: Rolled back transaction data was found in database!');
    }

    // -------------------------------------------------------------------------
    // STAGE 5: DATA INTEGRITY ACCEPTANCE (Pre-Cleanup Snapshot)
    // -------------------------------------------------------------------------
    console.log('[9. Stage 5: Data Integrity Acceptance (Pre-Cleanup)]');
    console.log(`- Tracked R6 Users for cleanup: ${createdR6.users.length}`);
    console.log(`- Tracked R6 Profiles for cleanup: ${createdR6.profiles.length}`);
    console.log(`- Tracked R6 UserRoles for cleanup: ${createdR6.userRoles.length}`);
    console.log(`- Tracked R6 TeacherApps for cleanup: ${createdR6.teacherApps.length}`);
    console.log(`- Tracked R6 AuditLogs for cleanup: ${createdR6.auditLogs.length}`);

    // Verify R1 users remain intact
    const r1Users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'test_student_20261109@codetoknow.test.invalid',
            'test_teacher_applicant_20261109@codetoknow.test.invalid',
            'test_admin_20261109@codetoknow.test.invalid',
          ],
        },
      },
    });
    console.log(`- Verified R1 preserved users count: ${r1Users.length} (Expected: 3)`);
    if (r1Users.length !== 3) {
      throw new Error(`R1 user count corrupted! Expected 3, found ${r1Users.length}`);
    }

    // -------------------------------------------------------------------------
    // STAGE 6: PRECISE CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n[10. Stage 6: Precise Controlled Cleanup]');
    // Reverse dependency cleanup plan:
    // 1. AuditLog -> 2. TeacherApplication -> 3. UserRole -> 4. UserProfile -> 5. User

    // Step 1: Clean AuditLog
    const preAuditCount = await prisma.auditLog.count();
    const deletedAudits = await prisma.auditLog.deleteMany({
      where: { id: { in: createdR6.auditLogs } },
    });
    const postAuditCount = await prisma.auditLog.count();
    console.log(`- AuditLog deleted: ${deletedAudits.count} (Table count: ${preAuditCount} -> ${postAuditCount})`);

    // Step 2: Clean TeacherApplication
    const preTeacherAppCount = await prisma.teacherApplication.count();
    const deletedTeacherApps = await prisma.teacherApplication.deleteMany({
      where: { id: { in: createdR6.teacherApps } },
    });
    const postTeacherAppCount = await prisma.teacherApplication.count();
    console.log(`- TeacherApplication deleted: ${deletedTeacherApps.count} (Table count: ${preTeacherAppCount} -> ${postTeacherAppCount})`);

    // Step 3: Clean UserRole
    const preUserRoleCount = await prisma.userRole.count();
    const deletedUserRoles = await prisma.userRole.deleteMany({
      where: { id: { in: createdR6.userRoles } },
    });
    const postUserRoleCount = await prisma.userRole.count();
    console.log(`- UserRole deleted: ${deletedUserRoles.count} (Table count: ${preUserRoleCount} -> ${postUserRoleCount})`);

    // Step 4: Clean UserProfile
    const preProfileCount = await prisma.userProfile.count();
    const deletedProfiles = await prisma.userProfile.deleteMany({
      where: { id: { in: createdR6.profiles } },
    });
    const postProfileCount = await prisma.userProfile.count();
    console.log(`- UserProfile deleted: ${deletedProfiles.count} (Table count: ${preProfileCount} -> ${postProfileCount})`);

    // Step 5: Clean User
    const preUserCount = await prisma.user.count();
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: createdR6.users } },
    });
    const postUserCount = await prisma.user.count();
    console.log(`- User deleted: ${deletedUsers.count} (Table count: ${preUserCount} -> ${postUserCount})`);

    // Verify zero residual R6 entities
    const residueUsers = await prisma.user.findMany({
      where: { email: { in: [r6Email1, r6Email2, r6Email3] } },
    });
    if (residueUsers.length > 0) {
      throw new Error(`Cleanup incomplete: ${residueUsers.length} R6 users still exist!`);
    }
    console.log('- Zero residual R6 test entities confirmed.\n');
    results.push({ test: 'Stage 6: Precise Cleanup', status: 'PASS' });

    // -------------------------------------------------------------------------
    // SUMMARY REPORT
    // -------------------------------------------------------------------------
    console.log('=== TEST SUITE RESULTS ===');
    console.table(results);

    return {
      success: true,
      createdR6,
      results,
    };
  } finally {
    await env.shutdown();
    console.log('Environment gracefully shutdown.\n');
  }
}

if (require.main === module) {
  runR6TestSuite().catch((err) => {
    console.error('[TEST SUITE FATAL ERROR]', err);
    process.exit(1);
  });
}

module.exports = {
  initControlledWriteEnv,
  runR6TestSuite,
};
