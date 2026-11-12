import { prisma } from '../../config/database.js';
import { logAuditEvent } from '../../utils/audit.js';
import { BadRequestError, ConflictError } from '../../utils/errors.js';
import { ApplyTeacherInput } from './teacher.schema.js';

export class TeacherService {
  /**
   * Submit a new teacher application.
   */
  async submitApplication(userId: string, input: ApplyTeacherInput, ipAddress?: string, userAgent?: string) {
    // Check if user is already a TEACHER
    const existingRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });

    const isAlreadyTeacher = existingRoles.some((r) => r.role.name === 'TEACHER');
    if (isAlreadyTeacher) {
      throw new BadRequestError('您已經具備教師身分，無需重複申請');
    }

    // Check if user already has a pending application
    const pendingApp = await prisma.teacherApplication.findFirst({
      where: {
        userId,
        status: 'PENDING',
      },
    });

    if (pendingApp) {
      throw new ConflictError('您已有一筆待審核的教師申請，請靜候管理員審核');
    }

    const application = await prisma.teacherApplication.create({
      data: {
        userId,
        schoolName: input.schoolName,
        subject: input.subject,
        reason: input.reason,
        proofUrl: input.proofUrl || null,
        status: 'PENDING',
      },
    });

    await logAuditEvent({
      userId,
      action: 'TEACHER_APPLICATION_SUBMITTED',
      details: { applicationId: application.id, school: input.schoolName },
      ipAddress,
      userAgent,
    });

    return application;
  }

  /**
   * Get the user's latest teacher application.
   */
  async getMyApplication(userId: string) {
    const application = await prisma.teacherApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return application;
  }
}

export const teacherService = new TeacherService();
