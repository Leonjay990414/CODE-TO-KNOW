import { prisma } from '../../config/database.js';
import { GetQuestionsQuery } from './question.schema.js';
import { NotFoundError } from '../../utils/errors.js';

export class QuestionService {
  constructor(private client?: any) {}

  private get db() {
    return this.client || (global as any).__customPrisma || prisma;
  }

  /**
   * Retrieves active certifications with their subjects
   */
  async getCertifications() {
    const certifications = await this.db.certification.findMany({
      where: { status: 'ACTIVE' },
      include: {
        subjects: {
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            code: true,
            title: true,
            examType: true,
            displayOrder: true,
            _count: {
              select: { questions: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return certifications.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      level: c.level,
      category: c.category,
      officialVersion: c.officialVersion,
      subjects: c.subjects.map((s) => ({
        id: s.id,
        code: s.code,
        title: s.title,
        examType: s.examType,
        questionCount: s._count.questions,
      })),
    }));
  }

  /**
   * Queries theory questions with optional filters, pagination, or random sampling
   */
  async getQuestions(query: GetQuestionsQuery) {
    const { certificationCode, subjectCode, workItem, questionType, search, page: rawPage, limit: rawLimit, random } = query;

    // Build Prisma where clause
    const where: any = {
      status: 'ACTIVE',
    };

    const certCode = certificationCode || '17300';
    where.subject = {
      certification: {
        code: certCode,
      },
    };

    const targetSection = workItem || query.section;
    if (subjectCode) {
      where.subject = {
        ...where.subject,
        code: subjectCode,
      };
    } else if (targetSection) {
      // Map workItem / section '01' to subject code e.g. '17300-01'
      where.subject = {
        ...where.subject,
        code: `${certCode}-${targetSection}`,
      };
    }

    if (questionType) {
      where.questionType = questionType;
    }

    if (search && search.trim()) {
      where.questionText = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const page = Number(query.page) >= 1 ? Number(query.page) : 1;
    const limit = Number(query.limit) >= 1 ? Number(query.limit) : 50;

    const total = await this.db.question.count({ where });

    let questions: any[];

    if (random) {
      // Random sample using database query or fetch all IDs and sample
      // For question bank with ~605 questions, taking random is fast and memory efficient
      const allMatching = await this.db.question.findMany({
        where,
        select: {
          id: true,
          officialNumber: true,
          questionText: true,
          codeSnippet: true,
          questionType: true,
          difficulty: true,
          correctAnswer: true,
          explanation: true,
          sourceName: true,
          sourceVersion: true,
          subject: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          options: {
            orderBy: { key: 'asc' },
            select: {
              id: true,
              key: true,
              text: true,
            },
          },
        },
      });

      // Fisher-Yates shuffle
      for (let i = allMatching.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allMatching[i], allMatching[j]] = [allMatching[j], allMatching[i]];
      }

      questions = allMatching.slice(0, limit);
    } else {
      const skip = (page - 1) * limit;
      questions = await this.db.question.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ officialNumber: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          officialNumber: true,
          questionText: true,
          codeSnippet: true,
          questionType: true,
          difficulty: true,
          correctAnswer: true,
          explanation: true,
          sourceName: true,
          sourceVersion: true,
          subject: {
            select: {
              id: true,
              code: true,
              title: true,
            },
          },
          options: {
            orderBy: { key: 'asc' },
            select: {
              id: true,
              key: true,
              text: true,
            },
          },
        },
      });
    }

    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      questions: questions.map((q) => {
        // Extract section code '01', '02', etc. from subject code '17300-01'
        const sectionCode = q.subject.code.split('-')[1] || '01';
        return {
          id: q.id,
          officialNumber: q.officialNumber,
          officialSection: sectionCode,
          sectionName: q.subject.title,
          question: q.questionText,
          codeSnippet: q.codeSnippet,
          questionType: q.questionType,
          difficulty: q.difficulty.toLowerCase(),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          sourceName: q.sourceName,
          sourceVersion: q.sourceVersion,
          options: q.options.map((opt: any) => ({
            key: opt.key,
            text: opt.text,
          })),
        };
      }),
    };
  }

  /**
   * Retrieves a single question by its UUID
   */
  async getQuestionById(id: string) {
    const question = await this.db.question.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            title: true,
            certification: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        options: {
          orderBy: { key: 'asc' },
        },
      },
    });

    if (!question || question.status !== 'ACTIVE') {
      throw new NotFoundError('Question not found or is no longer active.');
    }

    const sectionCode = question.subject.code.split('-')[1] || '01';

    return {
      id: question.id,
      officialNumber: question.officialNumber,
      officialSection: sectionCode,
      sectionName: question.subject.title,
      question: question.questionText,
      codeSnippet: question.codeSnippet,
      questionType: question.questionType,
      difficulty: question.difficulty.toLowerCase(),
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      sourceName: question.sourceName,
      sourceVersion: question.sourceVersion,
      certification: question.subject.certification,
      options: question.options.map((opt) => ({
        key: opt.key,
        text: opt.text,
      })),
    };
  }
}

export const questionService = new QuestionService();
