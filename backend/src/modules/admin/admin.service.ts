import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { ReviewApplicationInput } from './admin.schema.js';

export class AdminService {
  /**
   * List teacher applications with pagination and status filter.
   */
  async listTeacherApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED', page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [applications, total] = await Promise.all([
      prisma.teacherApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              status: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.teacherApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Approve teacher application and grant TEACHER role.
   */
  async approveTeacherApplication(
    applicationId: string,
    adminId: string,
    input: ReviewApplicationInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const application = await prisma.teacherApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundError('找不到指定的教師身分申請記錄');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestError(`該申請目前狀態為 ${application.status}，無法重複審核`);
    }

    // Ensure TEACHER role exists
    let teacherRole = await prisma.role.findUnique({
      where: { name: 'TEACHER' },
    });

    if (!teacherRole) {
      teacherRole = await prisma.role.create({
        data: {
          name: 'TEACHER',
          description: '教師：可管理班級、建立作業、發布測驗與檢視學習分析',
        },
      });
    }

    // Run in transaction: update application status & grant TEACHER role to applicant
    const [updatedApp] = await prisma.$transaction([
      prisma.teacherApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote || '審核通過，已開通教師權限',
        },
      }),
      prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: application.userId,
            roleId: teacherRole.id,
          },
        },
        create: {
          userId: application.userId,
          roleId: teacherRole.id,
        },
        update: {},
      }),
      prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'TEACHER_APPLICATION_APPROVED',
          details: JSON.stringify({
            applicationId,
            applicantUserId: application.userId,
            applicantEmail: application.user.email,
            note: input.reviewNote,
          }),
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return updatedApp;
  }

  /**
   * Reject teacher application.
   */
  async rejectTeacherApplication(
    applicationId: string,
    adminId: string,
    input: ReviewApplicationInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    const application = await prisma.teacherApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundError('找不到指定的教師身分申請記錄');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestError(`該申請目前狀態為 ${application.status}，無法重複審核`);
    }

    const [updatedApp] = await prisma.$transaction([
      prisma.teacherApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          reviewNote: input.reviewNote || '審核未通過',
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'TEACHER_APPLICATION_REJECTED',
          details: JSON.stringify({
            applicationId,
            applicantUserId: application.userId,
            applicantEmail: application.user.email,
            note: input.reviewNote,
          }),
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return updatedApp;
  }

  /**
   * List platform audit logs.
   */
  async listAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, displayName: true },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const adminService = new AdminService();
