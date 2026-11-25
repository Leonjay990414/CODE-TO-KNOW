import { prisma } from '../../config/database.js';
import { OwnershipActor } from '../../utils/ownership.js';
import { NotFoundError } from '../../utils/errors.js';
import { logAuditEvent } from '../../utils/audit.js';
import { UpdateStudentProfileInput } from './student.schema.js';

export class StudentService {
  /**
   * Retrieves complete student learning profile & journey aggregated from real database records.
   * Strictly isolates data by actor.id (IDOR defense).
   * Empty states return null/0/empty arrays without fake or hardcoded numbers.
   */
  async getDashboard(actor: OwnershipActor) {
    const student = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            educationLevel: true,
          },
        },
        roles: {
          select: {
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundError('找不到學生帳號資料');
    }

    // 1. Mock Exam Records & Performance
    const examAttempts = await prisma.examAttempt.findMany({
      where: { userId: actor.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        isPassed: true,
        correctCount: true,
        wrongCount: true,
        durationSeconds: true,
        submittedAt: true,
        createdAt: true,
        examPaper: {
          select: { title: true, totalQuestions: true },
        },
      },
    });

    const completedExams = examAttempts.filter((e) => e.submittedAt !== null && e.score !== null);
    const totalExamsTaken = completedExams.length;
    const passedExamsCount = completedExams.filter((e) => e.isPassed).length;

    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;

    if (totalExamsTaken > 0) {
      const scores = completedExams.map((e) => Number(e.score));
      const totalScore = scores.reduce((sum, s) => sum + s, 0);
      averageScore = Math.round((totalScore / totalExamsTaken) * 100) / 100;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    const recentExam = completedExams.length > 0 ? completedExams[0] : null;

    // 2. Wrong Question Records & Mastery State
    const wrongQuestions = await prisma.wrongQuestionRecord.findMany({
      where: { userId: actor.id },
      select: {
        id: true,
        masteryStatus: true,
        wrongCount: true,
        consecutiveCorrectCount: true,
        lastAttemptAt: true,
      },
    });

    const wrongStats = {
      total: wrongQuestions.length,
      unresolved: wrongQuestions.filter((q) => q.masteryStatus === 'UNRESOLVED').length,
      reviewing: wrongQuestions.filter((q) => q.masteryStatus === 'REVIEWING').length,
      mastered: wrongQuestions.filter((q) => q.masteryStatus === 'MASTERED').length,
    };

    // 3. Five Official Practical Tasks Progress (Version A and Version B)
    const practicalTasks = await prisma.practicalTask.findMany({
      orderBy: { taskNumber: 'asc' },
      include: {
        steps: {
          select: { id: true, version: true, stepNumber: true },
        },
      },
    });

    const practicalProgressRecords = await prisma.practicalProgress.findMany({
      where: { userId: actor.id },
      include: {
        stepProgresses: {
          select: { stepId: true, isCompleted: true },
        },
      },
    });

    const progressMap = new Map<string, (typeof practicalProgressRecords)[0]>();
    practicalProgressRecords.forEach((p) => {
      progressMap.set(`${p.taskId}:${p.version}`, p);
    });

    const taskSummaries = practicalTasks.map((t) => {
      const vASteps = t.steps.filter((s) => s.version === 'VERSION_A');
      const vBSteps = t.steps.filter((s) => s.version === 'VERSION_B');

      const pA = progressMap.get(`${t.id}:VERSION_A`);
      const pB = progressMap.get(`${t.id}:VERSION_B`);

      const vACompletedCount = pA ? pA.stepProgresses.filter((sp) => sp.isCompleted).length : 0;
      const vBCompletedCount = pB ? pB.stepProgresses.filter((sp) => sp.isCompleted).length : 0;

      return {
        taskId: t.id,
        taskNumber: t.taskNumber,
        taskCode: t.taskCode,
        title: t.title,
        versionA: {
          status: pA?.status || 'NOT_STARTED',
          completedSteps: vACompletedCount,
          totalSteps: vASteps.length,
          hasSavedCode: Boolean(pA?.savedHtmlCode || pA?.savedCssCode || pA?.savedJsCode),
          lastPracticedAt: pA?.lastPracticedAt?.toISOString() || null,
        },
        versionB: {
          status: pB?.status || 'NOT_STARTED',
          completedSteps: vBCompletedCount,
          totalSteps: vBSteps.length,
          hasSavedCode: Boolean(pB?.savedHtmlCode || pB?.savedCssCode || pB?.savedJsCode),
          lastPracticedAt: pB?.lastPracticedAt?.toISOString() || null,
        },
      };
    });

    const totalPracticalStepsCompletedVA = taskSummaries.reduce((sum, t) => sum + t.versionA.completedSteps, 0);
    const totalPracticalStepsCompletedVB = taskSummaries.reduce((sum, t) => sum + t.versionB.completedSteps, 0);
    const startedPracticalTasksCount = taskSummaries.filter(
      (t) => t.versionA.completedSteps > 0 || t.versionB.completedSteps > 0 || t.versionA.hasSavedCode || t.versionB.hasSavedCode
    ).length;

    // 4. Enrolled Classrooms
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId: actor.id,
        status: 'JOINED',
      },
      include: {
        class: {
          include: {
            creator: {
              select: { id: true, displayName: true, email: true },
            },
            certification: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const enrolledClasses = enrollments.map((e) => ({
      enrollmentId: e.id,
      seatNumber: e.seatNumber,
      joinedAt: e.joinedAt.toISOString(),
      class: {
        id: e.class.id,
        name: e.class.name,
        joinCode: e.class.joinCode,
        description: e.class.description,
        status: e.class.status,
        teacherName: e.class.creator.displayName,
        teacherEmail: e.class.creator.email,
        certificationName: e.class.certification.name,
      },
    }));

    // 5. Recent Chronological Activities
    const recentActivities: Array<{
      type: 'EXAM_SUBMISSION' | 'PRACTICAL_PRACTICE' | 'CLASS_JOINED';
      title: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }> = [];

    completedExams.slice(0, 5).forEach((e) => {
      recentActivities.push({
        type: 'EXAM_SUBMISSION',
        title: `完成模擬考：${e.examPaper?.title || '全真模擬試卷'}（成績：${e.score}分）`,
        timestamp: (e.submittedAt || e.createdAt).toISOString(),
        details: { score: e.score, isPassed: e.isPassed },
      });
    });

    practicalProgressRecords
      .filter((p) => p.lastPracticedAt !== null)
      .sort((a, b) => (b.lastPracticedAt?.getTime() || 0) - (a.lastPracticedAt?.getTime() || 0))
      .slice(0, 5)
      .forEach((p) => {
        const task = practicalTasks.find((t) => t.id === p.taskId);
        recentActivities.push({
          type: 'PRACTICAL_PRACTICE',
          title: `練習術科題組：${task?.title || p.taskId} (${p.version === 'VERSION_A' ? '版本A' : '版本B'})`,
          timestamp: (p.lastPracticedAt || p.createdAt).toISOString(),
          details: { taskId: p.taskId, version: p.version, status: p.status },
        });
      });

    enrollments.slice(0, 3).forEach((e) => {
      recentActivities.push({
        type: 'CLASS_JOINED',
        title: `加入班級：${e.class.name}`,
        timestamp: e.joinedAt.toISOString(),
        details: { classId: e.class.id, className: e.class.name },
      });
    });

    recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      student: {
        id: student.id,
        email: student.email,
        displayName: student.displayName,
        avatarUrl: student.avatarUrl,
        status: student.status,
        bio: student.profile?.bio || null,
        educationLevel: student.profile?.educationLevel || null,
        roles: student.roles.map((r) => r.role.name),
        createdAt: student.createdAt.toISOString(),
      },
      overview: {
        totalExamsTaken,
        passedExamsCount,
        averageScore,
        highestScore,
        lowestScore,
        recentScore: recentExam ? Number(recentExam.score) : null,
        recentExamTitle: recentExam ? recentExam.examPaper.title : null,
        recentExamDate: recentExam ? (recentExam.submittedAt || recentExam.createdAt).toISOString() : null,
        wrongQuestionsTotal: wrongStats.total,
        wrongQuestionsUnresolved: wrongStats.unresolved,
        wrongQuestionsMastered: wrongStats.mastered,
        startedPracticalTasksCount,
        totalPracticalStepsCompletedVA,
        totalPracticalStepsCompletedVB,
        enrolledClassesCount: enrolledClasses.length,
      },
      examHistory: completedExams.slice(0, 10).map((e) => ({
        id: e.id,
        paperTitle: e.examPaper.title,
        score: e.score !== null ? Number(e.score) : null,
        isPassed: e.isPassed,
        correctCount: e.correctCount,
        wrongCount: e.wrongCount,
        durationSeconds: e.durationSeconds,
        submittedAt: e.submittedAt?.toISOString() || null,
      })),
      wrongStats,
      practicalTasks: taskSummaries,
      enrolledClasses,
      recentActivities: recentActivities.slice(0, 10),
    };
  }

  /**
   * Updates student authorized profile fields (displayName, avatarUrl, bio).
   * Strict protection: cannot modify roles, email, or passwords.
   */
  async updateProfile(
    actor: OwnershipActor,
    input: UpdateStudentProfileInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: actor.id },
        data: {
          ...(input.displayName ? { displayName: input.displayName } : {}),
          ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      });

      if (input.bio !== undefined) {
        await tx.userProfile.upsert({
          where: { userId: actor.id },
          create: {
            userId: actor.id,
            bio: input.bio,
          },
          update: {
            bio: input.bio,
          },
        });
      }

      await logAuditEvent({
        userId: actor.id,
        action: 'USER_PROFILE_UPDATED',
        details: {
          updatedFields: Object.keys(input),
        },
        ipAddress,
        userAgent,
      });

      return user;
    });

    return updatedUser;
  }
}

export const studentService = new StudentService();
