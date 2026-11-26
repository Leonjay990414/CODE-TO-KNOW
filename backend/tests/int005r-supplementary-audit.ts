import fs from 'node:fs';
import pg from 'pg';

async function runReadOnlyAudit() {
  const secretPath = 'C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt';
  let password = 'postgres';
  if (fs.existsSync(secretPath)) {
    password = fs.readFileSync(secretPath, 'utf8').trim();
  }

  const scratchPool = new pg.Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'codetoknow_restore',
    password: password,
    database: 'ctk_core01_db001_scratch',
  });

  const restorePool = new pg.Pool({
    host: '127.0.0.1',
    port: 5433,
    user: 'codetoknow_restore',
    password: password,
    database: 'ctk_core01_int005_restore_verify',
  });

  console.log('Connected to both databases successfully in READ-ONLY mode.');

  // 1. Tables count & list
  const scratchTables = await scratchPool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const restoreTables = await restorePool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  // 2. Migration records
  const scratchMigrations = await scratchPool.query(`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY finished_at;
  `);
  const restoreMigrations = await restorePool.query(`
    SELECT migration_name, finished_at, rolled_back_at FROM "_prisma_migrations" ORDER BY finished_at;
  `);

  // 3. Question bank counts
  const scratchCert = await scratchPool.query(`SELECT count(*)::int as c FROM "Certification";`);
  const scratchSubj = await scratchPool.query(`SELECT count(*)::int as c FROM "Subject";`);
  const scratchQ = await scratchPool.query(`SELECT count(*)::int as c FROM "Question";`);
  const scratchOpt = await scratchPool.query(`SELECT count(*)::int as c FROM "QuestionOption";`);

  // 4. Practical tasks counts
  const scratchTasks = await scratchPool.query(`SELECT count(*)::int as c FROM "PracticalTask";`);
  const scratchSteps = await scratchPool.query(`SELECT count(*)::int as c FROM "PracticalStep";`);
  const scratchStepsByVer = await scratchPool.query(`
    SELECT "version", count(*)::int as c FROM "PracticalStep" GROUP BY "version" ORDER BY "version";
  `);

  // 5. Indexes count
  const scratchIndexes = await scratchPool.query(`
    SELECT count(*)::int as c FROM pg_indexes WHERE schemaname = 'public';
  `);
  const restoreIndexes = await restorePool.query(`
    SELECT count(*)::int as c FROM pg_indexes WHERE schemaname = 'public';
  `);

  // 6. Foreign key orphan checks on scratch
  const orphanChecks = {
    optWithoutQ: await scratchPool.query(`SELECT count(*)::int as c FROM "QuestionOption" o LEFT JOIN "Question" q ON o."questionId" = q.id WHERE q.id IS NULL;`),
    qWithoutSubj: await scratchPool.query(`SELECT count(*)::int as c FROM "Question" q LEFT JOIN "Subject" s ON q."subjectId" = s.id WHERE s.id IS NULL;`),
    subjWithoutCert: await scratchPool.query(`SELECT count(*)::int as c FROM "Subject" s LEFT JOIN "Certification" c ON s."certificationId" = c.id WHERE c.id IS NULL;`),
    stepWithoutTask: await scratchPool.query(`SELECT count(*)::int as c FROM "PracticalStep" s LEFT JOIN "PracticalTask" t ON s."taskId" = t.id WHERE t.id IS NULL;`),
    progressWithoutTask: await scratchPool.query(`SELECT count(*)::int as c FROM "PracticalProgress" p LEFT JOIN "PracticalTask" t ON p."taskId" = t.id WHERE t.id IS NULL;`),
    snapshotWithoutAttempt: await scratchPool.query(`SELECT count(*)::int as c FROM "ExamAnswerSnapshot" s LEFT JOIN "ExamAttempt" a ON s."attemptId" = a.id WHERE a.id IS NULL;`),
    wrongWithoutQ: await scratchPool.query(`SELECT count(*)::int as c FROM "WrongQuestionRecord" w LEFT JOIN "Question" q ON w."questionId" = q.id WHERE q.id IS NULL;`)
  };

  // 7. Check Permissions & RLS on Restore DB
  const restoreRls = await restorePool.query(`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, u.usename as owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_user u ON u.usesysid = c.relowner
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname;
  `);

  const restorePrivileges = await restorePool.query(`
    SELECT grantee, table_name, privilege_type 
    FROM information_schema.table_privileges 
    WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
  `);

  const publicPrivileges = await restorePool.query(`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema = 'public' AND grantee = 'PUBLIC';
  `);

  const databasePrivileges = await restorePool.query(`
    SELECT datname, datacl::text FROM pg_database WHERE datname IN ('ctk_core01_db001_scratch', 'ctk_core01_int005_restore_verify');
  `);

  // 8. RLS and permissions on scratch DB for _prisma_migrations
  const scratchRlsPrisma = await scratchPool.query(`
    SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity, u.usename as owner
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_user u ON u.usesysid = c.relowner
    WHERE n.nspname = 'public' AND c.relname = '_prisma_migrations';
  `);

  const scratchPrivileges = await scratchPool.query(`
    SELECT grantee, table_name, privilege_type 
    FROM information_schema.table_privileges 
    WHERE table_schema = 'public' AND table_name = '_prisma_migrations';
  `);

  console.log('AUDIT_RESULT_START');
  console.log(JSON.stringify({
    scratchTablesCount: scratchTables.rowCount,
    restoreTablesCount: restoreTables.rowCount,
    scratchMigrations: scratchMigrations.rows,
    restoreMigrations: restoreMigrations.rows,
    scratchCert: scratchCert.rows[0].c,
    scratchSubj: scratchSubj.rows[0].c,
    scratchQ: scratchQ.rows[0].c,
    scratchOpt: scratchOpt.rows[0].c,
    scratchTasks: scratchTasks.rows[0].c,
    scratchSteps: scratchSteps.rows[0].c,
    scratchStepsByVer: scratchStepsByVer.rows,
    scratchIndexes: scratchIndexes.rows[0].c,
    restoreIndexes: restoreIndexes.rows[0].c,
    orphans: {
      optWithoutQ: orphanChecks.optWithoutQ.rows[0].c,
      qWithoutSubj: orphanChecks.qWithoutSubj.rows[0].c,
      subjWithoutCert: orphanChecks.subjWithoutCert.rows[0].c,
      stepWithoutTask: orphanChecks.stepWithoutTask.rows[0].c,
      progressWithoutTask: orphanChecks.progressWithoutTask.rows[0].c,
      snapshotWithoutAttempt: orphanChecks.snapshotWithoutAttempt.rows[0].c,
      wrongWithoutQ: orphanChecks.wrongWithoutQ.rows[0].c
    },
    scratchRlsPrisma: scratchRlsPrisma.rows,
    scratchPrivileges: scratchPrivileges.rows,
    restoreRlsCount: restoreRls.rows.length,
    restoreRlsPrisma: restoreRls.rows.filter(r => r.relname === '_prisma_migrations'),
    restorePrivileges: restorePrivileges.rows,
    publicPrivilegesCount: publicPrivileges.rowCount,
    publicPrivilegesSample: publicPrivileges.rows.slice(0, 10),
    databasePrivileges: databasePrivileges.rows
  }, null, 2));
  console.log('AUDIT_RESULT_END');

  await scratchPool.end();
  await restorePool.end();
}

runReadOnlyAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
