import { prisma } from '../../config/database.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { logAuditEvent, sanitizeAuditDetails } from '../../utils/audit.js';
import {
  MAX_ADMIN_PAGE_LIMIT,
  ReviewApplicationInput,
  ListUsersQuery,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from './admin.schema.js';

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

  /**
   * Retrieves real database platform metrics (users, roles, questions, attempts, practicals, apps).
   * All metrics are computed dynamically from actual DB records (strictly NO hardcoded numbers).
   */
  async getPlatformOverview() {
    const [
      totalUsers,
      activeUsers,
      studentCount,
      teacherCount,
      adminCount,
      totalClassrooms,
      activeClassrooms,
      totalQuestions,
      totalExamsTaken,
      totalPracticalPractices,
      pendingTeacherApplications,
      totalAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { status: 'ACTIVE', deletedAt: null } }),
      prisma.userRole.count({ where: { role: { name: 'STUDENT' } } }),
      prisma.userRole.count({ where: { role: { name: 'TEACHER' } } }),
      prisma.userRole.count({ where: { role: { name: 'ADMIN' } } }),
      prisma.class.count(),
      prisma.class.count({ where: { status: 'ACTIVE' } }),
      prisma.question.count(),
      prisma.examAttempt.count({ where: { submittedAt: { not: null } } }),
      prisma.practicalProgress.count(),
      prisma.teacherApplication.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.count(),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        students: studentCount,
        teachers: teacherCount,
        admins: adminCount,
      },
      classrooms: {
        total: totalClassrooms,
        active: activeClassrooms,
      },
      content: {
        officialQuestionsCount: totalQuestions,
        examAttemptsTaken: totalExamsTaken,
        practicalPracticesCount: totalPracticalPractices,
      },
      governance: {
        pendingTeacherApplications,
        totalAuditLogs,
      },
    };
  }

  /**
   * Lists users with search (email/displayName), role filter, status filter, and pagination.
   */
  async listUsers(query: ListUsersQuery) {
    const pagination = normalizePagination(query.page || 1, query.limit || 20, 20);
    const skip = pagination.skip;

    const where: any = {
      deletedAt: null,
    };

    if (query.search && query.search.trim() !== '') {
      const q = query.search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { displayName: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.roles = {
        some: {
          role: { name: query.role },
        },
      };
    }

    if (query.status) {
      where.status = query.status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          status: true,
          createdAt: true,
          roles: {
            select: {
              role: { select: { name: true } },
            },
          },
          _count: {
            select: {
              examAttempts: true,
              practicalProgresses: true,
              classEnrollments: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        roles: u.roles.map((r) => r.role.name),
        activityCounts: {
          exams: u._count.examAttempts,
          practicals: u._count.practicalProgresses,
          enrolledClasses: u._count.classEnrollments,
        },
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Updates user status (ACTIVE, SUSPENDED, DISABLED).
   * Prevents admin from locking themselves out.
   */
  async updateUserStatus(
    adminId: string,
    targetUserId: string,
    input: UpdateUserStatusInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (adminId === targetUserId) {
      throw new BadRequestError('安全防護：管理員無法修改自己的帳號狀態');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('找不到指定的使用者帳號');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { status: input.status },
        select: { id: true, email: true, displayName: true, status: true },
      });

      await logAuditEvent({
        userId: adminId,
        action: 'USER_STATUS_UPDATED',
        details: {
          targetUserId,
          targetUserEmail: u.email,
          previousStatus: targetUser.status,
          newStatus: input.status,
        },
        ipAddress,
        userAgent,
      });

      return u;
    });

    return updated;
  }

  /**
   * Grants or revokes user roles (STUDENT, TEACHER, ADMIN).
   * Prevents admin from revoking their own ADMIN role.
   */
  async updateUserRole(
    adminId: string,
    targetUserId: string,
    input: UpdateUserRoleInput,
    ipAddress?: string,
    userAgent?: string
  ) {
    if (adminId === targetUserId && input.role === 'ADMIN' && input.action === 'revoke') {
      throw new BadRequestError('安全防護：管理員無法撤銷自己的管理員權限');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundError('找不到指定的使用者帳號');
    }

    let role = await prisma.role.findUnique({
      where: { name: input.role },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: input.role,
          description: input.role === 'ADMIN' ? '平台管理員' : input.role === 'TEACHER' ? '教師' : '一般學員',
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      if (input.action === 'grant') {
        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: targetUserId,
              roleId: role.id,
            },
          },
          create: {
            userId: targetUserId,
            roleId: role.id,
          },
          update: {},
        });
      } else {
        await tx.userRole.deleteMany({
          where: {
            userId: targetUserId,
            roleId: role.id,
          },
        });
      }

      await logAuditEvent({
        userId: adminId,
        action: input.action === 'grant' ? 'USER_ROLE_GRANTED' : 'USER_ROLE_REVOKED',
        details: {
          targetUserId,
          targetUserEmail: targetUser.email,
          role: input.role,
        },
        ipAddress,
        userAgent,
      });
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        roles: {
          select: { role: { select: { name: true } } },
        },
      },
    });

    return {
      id: refreshedUser?.id,
      email: refreshedUser?.email,
      displayName: refreshedUser?.displayName,
      status: refreshedUser?.status,
      roles: refreshedUser?.roles.map((r) => r.role.name) || [],
    };
  }
}

export const adminService = new AdminService();
