import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { logAuditEvent, sanitizeAuditDetails } from '../../utils/audit.js';
import { MAX_ADMIN_PAGE_LIMIT, ReviewApplicationInput } from './admin.schema.js';

function normalizePagination(page: number, limit: number, defaultLimit: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
  const safeLimit =
    Number.isInteger(limit) && limit >= 1
      ? Math.min(limit, MAX_ADMIN_PAGE_LIMIT)
      : defaultLimit;
  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}

export class AdminService {
  /**
   * List teacher applications with pagination and status filter.
   */
  async listTeacherApplications(status?: 'PENDING' | 'APPROVED' | 'REJECTED', page = 1, limit = 20) {
    const pagination = normalizePagination(page, limit, 20);
    const skip = pagination.skip;

    const where = status ? { status } : {};

    const [applications, total] = await Promise.all([
      prisma.teacherApplication.findMany({
        where,
        skip,
        take: pagination.limit,
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
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
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

    if (
      !application.user ||
      application.user.deletedAt != null ||
      application.user.status === 'SUSPENDED' ||
      application.user.status === 'DISABLED'
    ) {
      throw new BadRequestError('申請人帳號已停用、凍結或刪除，無法處理教師資格申請');
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
      logAuditEvent({
        userId: adminId,
        action: 'TEACHER_APPLICATION_APPROVED',
        details: {
          applicationId,
          applicantUserId: application.userId,
          applicantEmail: application.user.email,
          note: input.reviewNote,
        },
        ipAddress,
        userAgent,
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

    if (
      !application.user ||
      application.user.deletedAt != null ||
      application.user.status === 'SUSPENDED' ||
      application.user.status === 'DISABLED'
    ) {
      throw new BadRequestError('申請人帳號已停用、凍結或刪除，無法處理教師資格申請');
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
      logAuditEvent({
        userId: adminId,
        action: 'TEACHER_APPLICATION_REJECTED',
        details: {
          applicationId,
          applicantUserId: application.userId,
          applicantEmail: application.user.email,
          note: input.reviewNote,
        },
        ipAddress,
        userAgent,
      }),
    ]);

    return updatedApp;
  }

  /**
   * List platform audit logs.
   */
  async listAuditLogs(page = 1, limit = 50) {
    const pagination = normalizePagination(page, limit, 50);

    const [rawLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userId: true,
          action: true,
          details: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: { id: true, email: true, displayName: true },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    const logs = rawLogs.map((entry) => ({
      ...entry,
      details: sanitizeAuditDetails(entry.details),
    }));

    return {
      logs,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }
}

export const adminService = new AdminService();
