import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { assertResourceOwnership, OwnershipActor } from '../../utils/ownership.js';
import { GetWrongQuestionsQuery, RecordWrongQuestionInput } from './wrongQuestion.schema.js';

export const MASTERY_CONSECUTIVE_THRESHOLD = 2;

export class WrongQuestionService {
  /**
   * Retrieves paginated wrong question records for the current user,
   * along with section statistics and mastery status aggregations.
   */
  async getWrongQuestions(actor: OwnershipActor, query: GetWrongQuestionsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    // Fetch all user records for statistical aggregation
    const allUserRecords = await prisma.wrongQuestionRecord.findMany({
      where: { userId: actor.id },
      include: {
        question: {
          include: { subject: true },
        },
      },
    });

    let unresolvedCount = 0;
    let reviewingCount = 0;
    let masteredCount = 0;

    const bySection: Record<string, { total: number; unresolved: number; mastered: number }> = {
      '01': { total: 0, unresolved: 0, mastered: 0 },
      '02': { total: 0, unresolved: 0, mastered: 0 },
      '03': { total: 0, unresolved: 0, mastered: 0 },
      '04': { total: 0, unresolved: 0, mastered: 0 },
    };

    allUserRecords.forEach((rec) => {
      if (rec.masteryStatus === 'MASTERED') {
        masteredCount++;
      } else if (rec.masteryStatus === 'REVIEWING') {
        reviewingCount++;
      } else {
        unresolvedCount++;
      }

      const secCode = rec.question?.subject?.code?.split('-')?.[1];
      if (secCode && bySection[secCode]) {
        bySection[secCode].total++;
        if (rec.masteryStatus === 'MASTERED') {
          bySection[secCode].mastered++;
        } else {
          bySection[secCode].unresolved++;
        }
      }
    });

    // Build query filters for pagination
    const where: any = { userId: actor.id };

    if (query.status && query.status !== 'ALL') {
      where.masteryStatus = query.status;
    }

    if (query.section) {
      where.question = {
        subject: {
          code: { endsWith: `-${query.section}` },
        },
      };
    }

    const [total, items] = await Promise.all([
      prisma.wrongQuestionRecord.count({ where }),
      prisma.wrongQuestionRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastAttemptAt: 'desc' },
        include: {
          question: {
            include: {
              options: { orderBy: { displayOrder: 'asc' } },
              subject: true,
            },
          },
        },
      }),
    ]);

    const formattedItems = items.map((item) => ({
      id: item.id,
      questionId: item.questionId,
      officialNumber: item.question.officialNumber,
      sectionCode: item.question.subject.code.split('-')[1] || '01',
      sectionTitle: item.question.subject.title,
      questionText: item.question.questionText,
      codeSnippet: item.question.codeSnippet,
      options: item.question.options.map((o) => ({
        key: o.key,
        text: o.text,
      })),
      correctAnswer: item.question.correctAnswer,
      explanation: item.question.explanation,
      lastUserAnswer: item.lastUserAnswer,
      wrongCount: item.wrongCount,
      consecutiveCorrectCount: item.consecutiveCorrectCount,
      masteryStatus: item.masteryStatus,
      isResolved: item.isResolved,
      firstWrongAt: item.firstWrongAt.toISOString(),
      lastAttemptAt: item.lastAttemptAt.toISOString(),
      resolvedAt: item.resolvedAt?.toISOString() || null,
    }));

    return {
      stats: {
        totalRecorded: allUserRecords.length,
        unresolvedCount,
        reviewingCount,
        masteredCount,
        bySection,
      },
      items: formattedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Reviews and tests a wrong question. Updates state machine based on user answer:
   * - Correct: increment consecutiveCorrectCount; if >= 2 -> MASTERED & resolved; else -> REVIEWING.
   * - Wrong: reset consecutiveCorrectCount to 0, status -> UNRESOLVED, increment wrongCount.
   * Enforces strict IDOR ownership verification.
   */
  async practiceReview(actor: OwnershipActor, recordId: string, answer: string) {
    const record = await prisma.wrongQuestionRecord.findUnique({
      where: { id: recordId },
      include: {
        question: {
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
            subject: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundError('找不到該錯題紀錄');
    }

    // IDOR Protection: verify user ownership
    assertResourceOwnership(actor, record.userId, { resourceName: '錯題本紀錄' });

    const normalizedUserAns = answer.trim().toUpperCase();
    const normalizedCorrectAns = record.question.correctAnswer.trim().toUpperCase();
    const isCorrect = normalizedUserAns === normalizedCorrectAns;
    const now = new Date();

    let newConsecutive = record.consecutiveCorrectCount;
    let newStatus = record.masteryStatus;
    let newIsResolved = record.isResolved;
    let newResolvedAt = record.resolvedAt;

    if (isCorrect) {
      newConsecutive += 1;
      if (newConsecutive >= MASTERY_CONSECUTIVE_THRESHOLD) {
        newStatus = 'MASTERED';
        newIsResolved = true;
        newResolvedAt = now;
      } else {
        newStatus = 'REVIEWING';
        newIsResolved = false;
      }
    } else {
      newConsecutive = 0;
      newStatus = 'UNRESOLVED';
      newIsResolved = false;
      newResolvedAt = null;
    }

    const updated = await prisma.wrongQuestionRecord.update({
      where: { id: record.id },
      data: {
        lastUserAnswer: normalizedUserAns,
        wrongCount: isCorrect ? record.wrongCount : record.wrongCount + 1,
        consecutiveCorrectCount: newConsecutive,
        masteryStatus: newStatus,
        isResolved: newIsResolved,
        resolvedAt: newResolvedAt,
        lastAttemptAt: now,
      },
      include: {
        question: {
          include: {
            options: { orderBy: { displayOrder: 'asc' } },
            subject: true,
          },
        },
      },
    });

    return {
      recordId: updated.id,
      questionId: updated.questionId,
      isCorrect,
      userAnswer: normalizedUserAns,
      correctAnswer: updated.question.correctAnswer,
      explanation: updated.question.explanation,
      consecutiveCorrectCount: updated.consecutiveCorrectCount,
      masteryStatus: updated.masteryStatus,
      isResolved: updated.isResolved,
      resolvedAt: updated.resolvedAt?.toISOString() || null,
      wrongCount: updated.wrongCount,
      lastAttemptAt: updated.lastAttemptAt.toISOString(),
    };
  }

  /**
   * Directly records a wrong question from theory practice, mock exam, or manual review.
   * If record exists for (userId, questionId), increments wrongCount, resets consecutiveCorrectCount to 0,
   * sets status to UNRESOLVED, isResolved to false, and updates lastUserAnswer.
   * If new, creates record with initial count 1 and status UNRESOLVED.
   */
  async recordWrongQuestion(actor: OwnershipActor, input: RecordWrongQuestionInput) {
    const question = await prisma.question.findUnique({
      where: { id: input.questionId },
      include: {
        subject: true,
        options: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!question) {
      throw new NotFoundError('找不到指定的考題');
    }

    const now = new Date();
    const normalizedAnswer = input.selectedAnswer ? input.selectedAnswer.trim().toUpperCase() : '';

    const record = await prisma.wrongQuestionRecord.upsert({
      where: {
        userId_questionId: {
          userId: actor.id,
          questionId: question.id,
        },
      },
      update: {
        wrongCount: { increment: 1 },
        consecutiveCorrectCount: 0,
        masteryStatus: 'UNRESOLVED',
        isResolved: false,
        resolvedAt: null,
        lastUserAnswer: normalizedAnswer,
        lastAttemptAt: now,
      },
      create: {
        userId: actor.id,
        questionId: question.id,
        wrongCount: 1,
        consecutiveCorrectCount: 0,
        masteryStatus: 'UNRESOLVED',
        isResolved: false,
        lastUserAnswer: normalizedAnswer,
        firstWrongAt: now,
        lastAttemptAt: now,
      },
    });

    // Also update UnitProgress for this subject to record activity
    try {
      await prisma.unitProgress.upsert({
        where: {
          userId_subjectId: {
            userId: actor.id,
            subjectId: question.subjectId,
          },
        },
        update: {
          lastStudiedAt: now,
        },
        create: {
          userId: actor.id,
          subjectId: question.subjectId,
          status: 'IN_PROGRESS',
          completedQuestions: 1,
          accuracyRate: 0.0,
          lastStudiedAt: now,
        },
      });
    } catch {
      // Non-blocking for unit progress sync
    }

    return {
      recordId: record.id,
      questionId: record.questionId,
      officialNumber: question.officialNumber,
      sectionCode: question.subject.code.split('-')[1] || '01',
      sectionTitle: question.subject.title,
      questionText: question.questionText,
      wrongCount: record.wrongCount,
      consecutiveCorrectCount: record.consecutiveCorrectCount,
      masteryStatus: record.masteryStatus,
      isResolved: record.isResolved,
      lastUserAnswer: record.lastUserAnswer,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      lastAttemptAt: record.lastAttemptAt.toISOString(),
    };
  }
}

export const wrongQuestionService = new WrongQuestionService();
