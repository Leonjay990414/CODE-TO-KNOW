import fs from 'node:fs';
import pg from 'pg';

const password = fs.readFileSync('C:/Users/user/Documents/CODE-TO-KNOW_SECRETS/pg17_restore_user_password.txt', 'utf8').trim();
const pool = new pg.Pool({
  host: '127.0.0.1',
  port: 5433,
  user: 'codetoknow_restore',
  password: password,
  database: 'ctk_core01_db001_scratch'
});

async function check() {
  const r1 = await pool.query('SELECT current_database(), inet_server_addr(), inet_server_port(), version()');
  console.log('Target DB Check:', r1.rows[0]);
  const counts = await pool.query(`
    SELECT 
      (SELECT count(*) FROM "Certification") as certs,
      (SELECT count(*) FROM "Subject") as subjects,
      (SELECT count(*) FROM "Question") as questions,
      (SELECT count(*) FROM "QuestionOption") as options,
      (SELECT count(*) FROM "ExamPaper") as papers,
      (SELECT count(*) FROM "ExamAttempt") as attempts,
      (SELECT count(*) FROM "ExamAnswerSnapshot") as snapshots,
      (SELECT count(*) FROM "WrongQuestionRecord") as wrong_records,
      (SELECT count(*) FROM "PracticalTask") as practical_tasks,
      (SELECT count(*) FROM "PracticalStep") as practical_steps,
      (SELECT count(*) FROM "PracticalProgress") as practical_progress,
      (SELECT count(*) FROM "User") as users,
      (SELECT count(*) FROM "Role") as roles,
      (SELECT count(*) FROM "Class") as classes,
      (SELECT count(*) FROM "ClassEnrollment") as enrollments,
      (SELECT count(*) FROM "TeacherApplication") as teacher_apps,
      (SELECT count(*) FROM "AuditLog") as audit_logs
  `);
  console.log('Current DB Counts:', counts.rows[0]);
  await pool.end();
}

check().catch(console.error);
