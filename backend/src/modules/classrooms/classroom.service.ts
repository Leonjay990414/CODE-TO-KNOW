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
}

export const classroomService = new ClassroomService();
