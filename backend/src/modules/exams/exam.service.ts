import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { assertResourceOwnership, OwnershipActor } from '../../utils/ownership.js';
import { GenerateExamInput, SubmitExamInput } from './exam.schema.js';

function shuffleArray<T>(array: readonly T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export class ExamService {
  /**
   * Generates a 80-question mock exam paper attempt.
   * Strips correct answers and explanations to prevent client-side inspection.
   */
  async generateExam(actor: OwnershipActor, input: GenerateExamInput) {
    const certCode = input.certificationCode || '17300';
    const certification = await prisma.certification.findUnique({
      where: { code: certCode },
      include: { subjects: true },
    });

    if (!certification) {
      throw new NotFoundError(`找不到證照代碼為 ${certCode} 的資料`);
    }

    // Ensure ExamPaper exists for this certification
    let examPaper = await prisma.examPaper.findFirst({
      where: { certificationId: certification.id, status: 'ACTIVE' },
    });

    if (!examPaper) {
      examPaper = await prisma.examPaper.create({
        data: {
          title: `${certification.name} 學科全真模擬試卷`,
          certificationId: certification.id,
          timeLimitMinutes: input.mode === 'practice_60' ? 60 : 100,
          totalQuestions: 80,
          passingScore: 60,
          version: certification.officialVersion || '113/114年版',
          status: 'ACTIVE',
        },
      });
    }

    let selectedQuestions: any[] = [];

    if (input.strategy === 'stratified') {
      // Stratified抽題: 4 大工作項目 (01: 31, 02: 31, 03: 9, 04: 9 = 80 題)
      const sec01Subject = certification.subjects.find((s) => s.code.endsWith('-01'));
      const sec02Subject = certification.subjects.find((s) => s.code.endsWith('-02'));
      const sec03Subject = certification.subjects.find((s) => s.code.endsWith('-03'));
      const sec04Subject = certification.subjects.find((s) => s.code.endsWith('-04'));

      const [q01, q02, q03, q04] = await Promise.all([
        sec01Subject
          ? prisma.question.findMany({
              where: { subjectId: sec01Subject.id, status: 'ACTIVE' },
              include: { options: { orderBy: { displayOrder: 'asc' } }, subject: true },
            })
          : [],
        sec02Subject
          ? prisma.question.findMany({
              where: { subjectId: sec02Subject.id, status: 'ACTIVE' },
              include: { options: { orderBy: { displayOrder: 'asc' } }, subject: true },
            })
          : [],
        sec03Subject
          ? prisma.question.findMany({
              where: { subjectId: sec03Subject.id, status: 'ACTIVE' },
              include: { options: { orderBy: { displayOrder: 'asc' } }, subject: true },
            })
          : [],
        sec04Subject
          ? prisma.question.findMany({
              where: { subjectId: sec04Subject.id, status: 'ACTIVE' },
              include: { options: { orderBy: { displayOrder: 'asc' } }, subject: true },
            })
          : [],
      ]);

      if (q01.length >= 31 && q02.length >= 31 && q03.length >= 9 && q04.length >= 9) {
        const picked01 = shuffleArray(q01).slice(0, 31);
        const picked02 = shuffleArray(q02).slice(0, 31);
        const picked03 = shuffleArray(q03).slice(0, 9);
        const picked04 = shuffleArray(q04).slice(0, 9);
        selectedQuestions = shuffleArray([...picked01, ...picked02, ...picked03, ...picked04]);
      }
    }

    // Fallback if stratified draws failed or strategy is random
    if (selectedQuestions.length !== 80) {
      const allActive = await prisma.question.findMany({
        where: { subject: { certificationId: certification.id }, status: 'ACTIVE' },
        include: { options: { orderBy: { displayOrder: 'asc' } }, subject: true },
      });

      if (allActive.length < 80) {
        throw new BadRequestError(`題庫總題數不足 80 題 (目前僅 ${allActive.length} 題)，無法建立模擬試卷`);
      }

      selectedQuestions = shuffleArray(allActive).slice(0, 80);
    }

    const assignedIds = selectedQuestions.map((q) => q.id);

    // Persist ExamAttempt in database
    const attempt = await prisma.examAttempt.create({
      data: {
        userId: actor.id,
        examPaperId: examPaper.id,
        assignedQuestionIds: JSON.stringify(assignedIds),
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    // Anti-cheat: strip correctAnswer and explanation before returning to client
    const sanitizedQuestions = selectedQuestions.map((q, idx) => ({
      order: idx + 1,
      id: q.id,
      officialNumber: q.officialNumber,
      questionText: q.questionText,
      codeSnippet: q.codeSnippet,
      questionType: q.questionType,
      difficulty: q.difficulty,
      subject: {
        code: q.subject.code,
        title: q.subject.title,
      },
      options: q.options.map((opt: any) => ({
        key: opt.key,
        text: opt.text,
      })),
    }));

    return {
      attemptId: attempt.id,
      examPaperId: examPaper.id,
      paperTitle: examPaper.title,
      timeLimitMinutes: input.mode === 'practice_60' ? 60 : examPaper.timeLimitMinutes,
      totalQuestions: sanitizedQuestions.length,
      startedAt: attempt.startedAt.toISOString(),
      questions: sanitizedQuestions,
    };
  }

  /**
   * Evaluates submitted answers on the server, creates snapshots, updates wrong question notebook.
   * Strict anti-cheating, ownership verification, and idempotency protection.
   */
  async submitExam(actor: OwnershipActor, attemptId: string, input: SubmitExamInput) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: { examPaper: true },
    });

    if (!attempt) {
      throw new NotFoundError('找不到該模擬測驗作答紀錄');
    }

    // IDOR Protection: verify user ownership
    assertResourceOwnership(actor, attempt.userId, { resourceName: '模擬測驗紀錄' });

    // Idempotency: prevent double scoring or answer alteration
    if (attempt.status === 'SUBMITTED') {
      throw new BadRequestError('此測驗已完成交卷核分，不得重複提交或更動答案', 'EXAM_ALREADY_SUBMITTED');
    }

    const assignedIds: string[] = JSON.parse(attempt.assignedQuestionIds || '[]');
    if (!assignedIds.length) {
      throw new BadRequestError('測驗題目資訊異常，找不到已抽取的題目記錄');
    }

    // Fetch the assigned questions with actual answers and subjects
    const questions = await prisma.question.findMany({
      where: { id: { in: assignedIds } },
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        subject: true,
      },
    });

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const sectionStatsMap: Record<
      string,
      { sectionCode: string; sectionTitle: string; total: number; correct: number; percentage: number }
    > = {};

    const snapshotsToCreate: any[] = [];
    const wrongQuestionUpserts: any[] = [];

    // Evaluate each question strictly according to the original assigned order
    assignedIds.forEach((qId, index) => {
      const q = questionMap.get(qId);
      if (!q) return;

      const order = index + 1;
      const rawUserAns = input.answers[q.id];
      const normalizedUserAns = rawUserAns ? String(rawUserAns).trim().toUpperCase() : null;
      const normalizedCorrectAns = q.correctAnswer ? q.correctAnswer.trim().toUpperCase() : '';

      const isAnswered = normalizedUserAns !== null && normalizedUserAns !== '';
      const isCorrect = isAnswered && normalizedUserAns === normalizedCorrectAns;
      const scoreWeight = 1.25;
      const scoreObtained = isCorrect ? scoreWeight : 0.0;

      if (isCorrect) {
        correctCount++;
      } else {
        wrongCount++;
        if (!isAnswered) {
          unansweredCount++;
        }
        // Prepare wrong question record
        wrongQuestionUpserts.push({
          questionId: q.id,
          userAnswer: normalizedUserAns || '未作答',
        });
      }

      // Track Work Item (Section) breakdown
      const secCode = q.subject?.code?.split('-')?.[1] || '01';
      const secTitle = q.subject?.title || '作業準備';
      if (!sectionStatsMap[secCode]) {
        sectionStatsMap[secCode] = {
          sectionCode: secCode,
          sectionTitle: secTitle,
          total: 0,
          correct: 0,
          percentage: 0,
        };
      }
      sectionStatsMap[secCode].total++;
      if (isCorrect) {
        sectionStatsMap[secCode].correct++;
      }

      snapshotsToCreate.push({
        attemptId: attempt.id,
        questionId: q.id,
        questionOrder: order,
        questionTypeSnapshot: q.questionType,
        questionTextSnapshot: q.questionText,
        optionsSnapshot: JSON.stringify(q.options.map((o) => ({ key: o.key, text: o.text }))),
        correctAnswerSnapshot: q.correctAnswer,
        explanationSnapshot: q.explanation,
        userAnswer: normalizedUserAns,
        isCorrect,
        scoreWeight,
        scoreObtained,
        timeSpentSeconds: 0,
      });
    });

    // Calculate section percentages
    Object.values(sectionStatsMap).forEach((sec) => {
      sec.percentage = sec.total > 0 ? Number(((sec.correct / sec.total) * 100).toFixed(1)) : 0;
    });

    const totalScore = Number((correctCount * 1.25).toFixed(2));
    const isPassed = totalScore >= 60;
    const durationSeconds =
      input.durationSeconds ?? Math.max(0, Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000));
    const submittedAt = new Date();

    // Execute atomic transaction: update attempt, insert snapshots, upsert wrong questions
    await prisma.$transaction(async (tx) => {
      // 1. Update attempt
      await tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
          score: totalScore,
          isPassed,
          correctCount,
          wrongCount,
          durationSeconds,
          status: 'SUBMITTED',
          submittedAt,
        },
      });

      // 2. Insert answer snapshots
      await tx.examAnswerSnapshot.createMany({
        data: snapshotsToCreate,
      });

      // 3. Upsert wrong question records
      for (const w of wrongQuestionUpserts) {
        await tx.wrongQuestionRecord.upsert({
          where: {
            userId_questionId: {
              userId: actor.id,
              questionId: w.questionId,
            },
          },
          update: {
            wrongCount: { increment: 1 },
            consecutiveCorrectCount: 0,
            masteryStatus: 'UNRESOLVED',
            isResolved: false,
            resolvedAt: null,
            lastUserAnswer: w.userAnswer,
            lastAttemptAt: submittedAt,
          },
          create: {
            userId: actor.id,
            questionId: w.questionId,
            wrongCount: 1,
            consecutiveCorrectCount: 0,
            masteryStatus: 'UNRESOLVED',
            isResolved: false,
            lastUserAnswer: w.userAnswer,
            firstWrongAt: submittedAt,
            lastAttemptAt: submittedAt,
          },
        });
      }
    });

    return {
      attemptId: attempt.id,
      status: 'SUBMITTED',
      score: totalScore,
      isPassed,
      correctCount,
      wrongCount,
      unansweredCount,
      durationSeconds,
      submittedAt: submittedAt.toISOString(),
      sectionBreakdown: Object.values(sectionStatsMap),
      snapshots: snapshotsToCreate.map((s) => ({
        order: s.questionOrder,
        questionId: s.questionId,
        questionText: s.questionTextSnapshot,
        options: JSON.parse(s.optionsSnapshot),
        correctAnswer: s.correctAnswerSnapshot,
        userAnswer: s.userAnswer,
        isCorrect: s.isCorrect,
        explanation: s.explanationSnapshot,
        scoreObtained: s.scoreObtained,
      })),
    };
  }

  /**
   * Retrieves score report for a submitted attempt with snapshots and section breakdown.
   */
  async getScoreReport(actor: OwnershipActor, attemptId: string) {
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: attemptId },
      include: {
        examPaper: true,
        answerSnapshots: {
          orderBy: { questionOrder: 'asc' },
          include: {
            question: {
              include: { subject: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError('找不到該模擬測驗紀錄');
    }

    assertResourceOwnership(actor, attempt.userId, { resourceName: '模擬測驗紀錄' });

    if (attempt.status !== 'SUBMITTED') {
      throw new BadRequestError('此測驗尚未交卷，無法查看核分報告');
    }

    const sectionStatsMap: Record<
      string,
      { sectionCode: string; sectionTitle: string; total: number; correct: number; percentage: number }
    > = {};

    attempt.answerSnapshots.forEach((snap) => {
      const secCode = snap.question?.subject?.code?.split('-')?.[1] || '01';
      const secTitle = snap.question?.subject?.title || '作業準備';
      if (!sectionStatsMap[secCode]) {
        sectionStatsMap[secCode] = {
          sectionCode: secCode,
          sectionTitle: secTitle,
          total: 0,
          correct: 0,
          percentage: 0,
        };
      }
      sectionStatsMap[secCode].total++;
      if (snap.isCorrect) {
        sectionStatsMap[secCode].correct++;
      }
    });

    Object.values(sectionStatsMap).forEach((sec) => {
      sec.percentage = sec.total > 0 ? Number(((sec.correct / sec.total) * 100).toFixed(1)) : 0;
    });

    return {
      attemptId: attempt.id,
      paperTitle: attempt.examPaper.title,
      score: attempt.score,
      isPassed: attempt.isPassed,
      correctCount: attempt.correctCount,
      wrongCount: attempt.wrongCount,
      unansweredCount: Math.max(0, 80 - ((attempt.correctCount || 0) + (attempt.wrongCount || 0))),
      durationSeconds: attempt.durationSeconds,
      submittedAt: attempt.submittedAt?.toISOString(),
      sectionBreakdown: Object.values(sectionStatsMap),
      snapshots: attempt.answerSnapshots.map((s) => ({
        order: s.questionOrder,
        questionId: s.questionId,
        questionText: s.questionTextSnapshot,
        options: JSON.parse(s.optionsSnapshot || '[]'),
        correctAnswer: s.correctAnswerSnapshot,
        userAnswer: s.userAnswer,
        isCorrect: s.isCorrect,
        explanation: s.explanationSnapshot,
        scoreObtained: s.scoreObtained,
      })),
    };
  }

  /**
   * Retrieves past submitted attempts for the current user.
   */
  async getExamHistory(actor: OwnershipActor) {
    const attempts = await prisma.examAttempt.findMany({
      where: {
        userId: actor.id,
        status: 'SUBMITTED',
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
      include: {
        examPaper: {
          select: { title: true },
        },
      },
    });

    return attempts.map((a) => ({
      id: a.id,
      paperTitle: a.examPaper.title,
      score: a.score,
      isPassed: a.isPassed,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      durationSeconds: a.durationSeconds,
      submittedAt: a.submittedAt?.toISOString(),
    }));
  }
}

export const examService = new ExamService();
