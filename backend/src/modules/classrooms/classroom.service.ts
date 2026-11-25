import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../../utils/audit.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/errors.js';
import { generateSecureJoinCode, normalizeJoinCode } from '../../utils/joinCode.js';
import { hasAdminOverrideRole } from '../../utils/ownership.js';
import { CreateClassroomInput, JoinClassroomInput } from './classroom.schema.js';

export class ClassroomService {
  /**
   * 教師建立新班級並自動生成唯一 8 碼加入邀請碼
   */
  async createClassroom(
    teacherId: string,
    input: CreateClassroomInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    let joinCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      joinCode = generateSecureJoinCode();
      const existing = await prisma.class.findUnique({
        where: { joinCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('無法生成唯一班級加入碼，請重試');
    }

    const classroom = await prisma.class.create({
      data: {
        name: input.name,
        description: input.description || null,
        certificationId: input.certificationId,
        creatorId: teacherId,
        joinCode,
        status: 'ACTIVE',
      },
    });

    await logAuditEvent({
      userId: teacherId,
      action: 'CLASSROOM_CREATED',
      details: { classId: classroom.id, className: classroom.name, joinCode },
      ipAddress,
      userAgent,
    });

    return classroom;
  }

  /**
   * 查詢教師自己建立的班級列表（含學生人數統計）
   */
  async getMyTeachingClassrooms(teacherId: string) {
    const classrooms = await prisma.class.findMany({
      where: {
        creatorId: teacherId,
      },
      include: {
        certification: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return classrooms.map((c) => ({
      ...c,
      memberCount: c._count.enrollments,
    }));
  }

  /**
   * 學生查詢自己已加入的有效班級列表
   */
  async getMyEnrolledClassrooms(studentId: string) {
    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        studentId,
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

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      seatNumber: e.seatNumber,
      joinedAt: e.joinedAt,
      class: e.class,
    }));
  }

  /**
   * 學生憑 8 碼加入碼加入班級（後端嚴格防重複與驗證）
   */
  async joinClassroom(
    studentId: string,
    input: JoinClassroomInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const normalizedCode = normalizeJoinCode(input.joinCode);

    const targetClass = await prisma.class.findUnique({
      where: { joinCode: normalizedCode },
      include: {
        creator: {
          select: { id: true, displayName: true },
        },
      },
    });

    if (!targetClass || targetClass.status !== 'ACTIVE') {
      throw new NotFoundError('找不到該班級邀請碼，或該班級已關閉加入');
    }

    if (targetClass.creatorId === studentId) {
      throw new BadRequestError('教師無法以學生身分加入自己創建的班級');
    }

    const existingEnrollment = await prisma.classEnrollment.findFirst({
      where: {
        classId: targetClass.id,
        studentId,
        status: 'JOINED',
      },
    });

    if (existingEnrollment) {
      throw new ConflictError('您已經是該班級成員，無需重複加入');
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        classId: targetClass.id,
        studentId,
        seatNumber: input.seatNumber || null,
        status: 'JOINED',
      },
    });

    await logAuditEvent({
      userId: studentId,
      action: 'CLASSROOM_JOINED',
      details: {
        classId: targetClass.id,
        className: targetClass.name,
        joinCode: normalizedCode,
      },
      ipAddress,
      userAgent,
    });

    return {
      enrollmentId: enrollment.id,
      classId: targetClass.id,
      className: targetClass.name,
      teacherName: targetClass.creator.displayName,
      joinedAt: enrollment.joinedAt,
    };
  }

  /**
   * 教師或管理員查詢指定班級學生名冊（嚴格實施所有權隔離）
   */
  async getClassroomMembers(actorId: string, actorRoles: string[], classId: string) {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!targetClass) {
      throw new NotFoundError('指定的班級不存在');
    }

    const isOwner = targetClass.creatorId === actorId;
    const isAdmin = hasAdminOverrideRole(actorRoles);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('權限不足：您只能查閱自己管理的班級名冊');
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'JOINED',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return {
      class: {
        id: targetClass.id,
        name: targetClass.name,
        joinCode: targetClass.joinCode,
        status: targetClass.status,
      },
      members: enrollments.map((e) => ({
        enrollmentId: e.id,
        studentId: e.student.id,
        displayName: e.student.displayName,
        email: e.student.email,
        seatNumber: e.seatNumber,
        joinedAt: e.joinedAt,
      })),
    };
  }

  /**
   * 教師將學生從班級中移除（越權防護）
   */
  async removeMember(
    actorId: string,
    actorRoles: string[],
    classId: string,
    studentId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!targetClass) {
      throw new NotFoundError('指定的班級不存在');
    }

    const isOwner = targetClass.creatorId === actorId;
    const isAdmin = hasAdminOverrideRole(actorRoles);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('權限不足：您只能管理自己班級的成員');
    }

    const deleteResult = await prisma.classEnrollment.deleteMany({
      where: {
        classId,
        studentId,
      },
    });

    if (deleteResult.count === 0) {
      throw new NotFoundError('該學生不在指定的班級名冊中');
    }

    await logAuditEvent({
      userId: actorId,
      action: 'CLASSROOM_MEMBER_REMOVED',
      details: { classId, studentId, className: targetClass.name },
      ipAddress,
      userAgent,
    });

    return { success: true, message: '已成功將該學員自班級移除' };
  }

  /**
   * 教師查詢所轄班級總體學習分析數據（僅能查閱自己班級，防 IDOR）
   * 統計由實際資料計算，無資料時提供乾淨空狀態，無假數據
   */
  async getClassroomAnalytics(actorId: string, actorRoles: string[], classId: string) {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        certification: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!targetClass) {
      throw new NotFoundError('指定的班級不存在');
    }

    const isOwner = targetClass.creatorId === actorId;
    const isAdmin = hasAdminOverrideRole(actorRoles);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('權限不足：您只能查閱自己管理的班級學習分析');
    }

    const enrollments = await prisma.classEnrollment.findMany({
      where: {
        classId,
        status: 'JOINED',
      },
      select: { studentId: true },
    });

    const studentIds = enrollments.map((e) => e.studentId);
    const totalStudents = studentIds.length;

    if (totalStudents === 0) {
      return {
        classId: targetClass.id,
        className: targetClass.name,
        certificationName: targetClass.certification.name,
        totalStudents: 0,
        activeStudentsCount: 0,
        examStats: {
          totalExamsTaken: 0,
          passedExamsCount: 0,
          passRate: 0,
          averageScore: null,
          highestScore: null,
          lowestScore: null,
        },
        practicalStats: {
          averageCompletedStepsVA: 0,
          averageCompletedStepsVB: 0,
          studentsWithPracticalRecords: 0,
        },
        wrongQuestionStats: {
          totalUnresolved: 0,
          totalMastered: 0,
        },
      };
    }

    // 1. Exam attempts for enrolled students
    const examAttempts = await prisma.examAttempt.findMany({
      where: {
        userId: { in: studentIds },
        submittedAt: { not: null },
        score: { not: null },
      },
      select: {
        userId: true,
        score: true,
        isPassed: true,
      },
    });

    const totalExamsTaken = examAttempts.length;
    const passedExamsCount = examAttempts.filter((e) => e.isPassed).length;
    let averageScore: number | null = null;
    let highestScore: number | null = null;
    let lowestScore: number | null = null;
    let passRate = 0;

    if (totalExamsTaken > 0) {
      const scores = examAttempts.map((e) => Number(e.score));
      averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / totalExamsTaken) * 100) / 100;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passRate = Math.round((passedExamsCount / totalExamsTaken) * 100);
    }

    // 2. Practical progress for enrolled students
    const practicalProgress = await prisma.practicalProgress.findMany({
      where: {
        userId: { in: studentIds },
      },
      include: {
        stepProgresses: {
          where: { isCompleted: true },
          select: { id: true },
        },
      },
    });

    const vARecords = practicalProgress.filter((p) => p.version === 'VERSION_A');
    const vBRecords = practicalProgress.filter((p) => p.version === 'VERSION_B');

    const totalStepsVA = vARecords.reduce((sum, p) => sum + (p.stepProgresses?.length || 0), 0);
    const totalStepsVB = vBRecords.reduce((sum, p) => sum + (p.stepProgresses?.length || 0), 0);

    const practicalStudents = new Set(practicalProgress.map((p) => p.userId));
    const averageCompletedStepsVA = totalStudents > 0 ? Math.round((totalStepsVA / totalStudents) * 10) / 10 : 0;
    const averageCompletedStepsVB = totalStudents > 0 ? Math.round((totalStepsVB / totalStudents) * 10) / 10 : 0;

    // 3. Wrong questions for enrolled students
    const wrongQuestions = await prisma.wrongQuestionRecord.findMany({
      where: {
        userId: { in: studentIds },
      },
      select: { masteryStatus: true },
    });

    const totalUnresolved = wrongQuestions.filter((q) => q.masteryStatus === 'UNRESOLVED').length;
    const totalMastered = wrongQuestions.filter((q) => q.masteryStatus === 'MASTERED').length;

    // 4. Distinct Active Students
    const activeStudentIds = new Set([
      ...examAttempts.map((e) => e.userId),
      ...practicalProgress.map((p) => p.userId),
    ]);

    return {
      classId: targetClass.id,
      className: targetClass.name,
      certificationName: targetClass.certification.name,
      totalStudents,
      activeStudentsCount: activeStudentIds.size,
      examStats: {
        totalExamsTaken,
        passedExamsCount,
        passRate,
        averageScore,
        highestScore,
        lowestScore,
      },
      practicalStats: {
        averageCompletedStepsVA,
        averageCompletedStepsVB,
        studentsWithPracticalRecords: practicalStudents.size,
      },
      wrongQuestionStats: {
        totalUnresolved,
        totalMastered,
      },
    };
  }

  /**
   * 教師查閱所轄班級中特定學生的學習歷程
   * 嚴格防禦：必須為該班級目前已加入之學員，禁止越權查看班級以外的學員資料
   */
  async getStudentClassroomProgress(
    actorId: string,
    actorRoles: string[],
    classId: string,
    studentId: string
  ) {
    const targetClass = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!targetClass) {
      throw new NotFoundError('指定的班級不存在');
    }

    const isOwner = targetClass.creatorId === actorId;
    const isAdmin = hasAdminOverrideRole(actorRoles);

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError('權限不足：您只能查閱自己管理的班級學員學習進度');
    }

    // Verify student is actually enrolled in this class
    const enrollment = await prisma.classEnrollment.findFirst({
      where: {
        classId,
        studentId,
        status: 'JOINED',
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenError('權限不足：該學生並未加入此班級，禁止跨班級查閱學員資料');
    }

    // Query this student's exam attempts
    const examAttempts = await prisma.examAttempt.findMany({
      where: { userId: studentId, submittedAt: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        score: true,
        isPassed: true,
        correctCount: true,
        wrongCount: true,
        durationSeconds: true,
        submittedAt: true,
        examPaper: { select: { title: true } },
      },
    });

    // Query this student's practical progress
    const practicalProgress = await prisma.practicalProgress.findMany({
      where: { userId: studentId },
      include: {
        task: { select: { taskNumber: true, taskCode: true, title: true } },
        stepProgresses: { where: { isCompleted: true } },
      },
    });

    // Query this student's wrong questions summary
    const wrongCount = await prisma.wrongQuestionRecord.count({
      where: { userId: studentId },
    });
    const unresolvedCount = await prisma.wrongQuestionRecord.count({
      where: { userId: studentId, masteryStatus: 'UNRESOLVED' },
    });

    return {
      student: {
        id: enrollment.student.id,
        email: enrollment.student.email,
        displayName: enrollment.student.displayName,
        seatNumber: enrollment.seatNumber,
        joinedAt: enrollment.joinedAt.toISOString(),
      },
      class: {
        id: targetClass.id,
        name: targetClass.name,
      },
      exams: {
        totalTaken: examAttempts.length,
        history: examAttempts.map((e) => ({
          id: e.id,
          paperTitle: e.examPaper.title,
          score: e.score !== null ? Number(e.score) : null,
          isPassed: e.isPassed,
          correctCount: e.correctCount,
          wrongCount: e.wrongCount,
          submittedAt: e.submittedAt?.toISOString() || null,
        })),
      },
      practicals: practicalProgress.map((p) => ({
        taskId: p.taskId,
        taskNumber: p.task.taskNumber,
        taskTitle: p.task.title,
        version: p.version,
        completedStepsCount: p.stepProgresses.length,
        hasSavedCode: Boolean(p.savedHtmlCode || p.savedCssCode || p.savedJsCode),
        lastPracticedAt: p.lastPracticedAt?.toISOString() || null,
      })),
      wrongQuestions: {
        total: wrongCount,
        unresolved: unresolvedCount,
      },
    };
  }
}

export const classroomService = new ClassroomService();
