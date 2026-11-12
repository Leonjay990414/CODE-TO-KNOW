import { prisma } from '../../config/database.js';
import { emailProvider } from '../../services/email.provider.js';
import { logAuditEvent } from '../../utils/audit.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateSecureToken, hashToken } from '../../utils/tokens.js';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors.js';
import {
  RegisterInput,
  LoginInput,
  ResetPasswordInput,
} from './auth.schema.js';

export class AuthService {
  /**
   * Register a new user. Always assigns the STUDENT role, regardless of any user input.
   */
  async register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictError('此電子郵件已被註冊');
    }

    // Ensure STUDENT role exists in the database
    let studentRole = await prisma.role.findUnique({
      where: { name: 'STUDENT' },
    });

    if (!studentRole) {
      studentRole = await prisma.role.create({
        data: {
          name: 'STUDENT',
          description: '學生：可參與課程、題庫練習、模擬測驗及 AI 學習助教',
        },
      });
    }

    const passwordHash = await hashPassword(input.password);
    const rawVerificationToken = generateSecureToken(32);
    const hashedVerificationToken = hashToken(rawVerificationToken);

    // Create user with transactional integrity
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: input.displayName.trim(),
        status: 'ACTIVE',
        roles: {
          create: {
            roleId: studentRole.id,
          },
        },
        profile: {
          create: {
            nickname: input.displayName.trim(),
          },
        },
        emailVerificationTokens: {
          create: {
            tokenHash: hashedVerificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        },
      },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // Record audit event
    await logAuditEvent({
      userId: user.id,
      action: 'USER_REGISTER',
      details: { email: user.email, roles: ['STUDENT'] },
      ipAddress,
      userAgent,
    });

    // Send verification email via provider (console in dev, SMTP in production)
    await emailProvider.sendVerificationEmail(user.email, rawVerificationToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles.map((r) => r.role.name),
        status: user.status,
      },
      verificationToken: rawVerificationToken,
    };
  }

  /**
   * Authenticate user with email and password, creating an active Session record.
   */
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        roles: {
          include: { role: true },
        },
      },
    });

    // Safe error message to avoid email enumeration
    if (!user) {
      throw new UnauthorizedError('帳號或密碼錯誤');
    }

    if (user.deletedAt !== null || user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      throw new UnauthorizedError('此帳號已停用或凍結，請聯繫管理員');
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      await logAuditEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        details: { reason: 'Invalid password' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedError('帳號或密碼錯誤');
    }

    // Generate session token (raw sent to cookie, hashed stored in DB)
    const rawSessionToken = generateSecureToken(32);
    const tokenHash = hashToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    // Record audit log
    await logAuditEvent({
      userId: user.id,
      action: 'USER_LOGIN',
      details: { sessionId: session.id },
      ipAddress,
      userAgent,
    });

    return {
      sessionToken: rawSessionToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles: user.roles.map((r) => r.role.name),
        avatarUrl: user.avatarUrl,
        emailVerifiedAt: user.emailVerifiedAt,
      },
    };
  }

  /**
   * Revoke current session.
   */
  async logout(sessionId?: string, userId?: string, ipAddress?: string, userAgent?: string) {
    if (sessionId) {
      await prisma.session.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await logAuditEvent({
        userId,
        action: 'USER_LOGOUT',
        details: { sessionId },
        ipAddress,
        userAgent,
      });
    }
  }

  /**
   * Get current authenticated user profile.
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: { role: true },
        },
        profile: true,
        teacherApplications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new NotFoundError('找不到使用者資料');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      roles: user.roles.map((r) => r.role.name),
      profile: user.profile,
      latestTeacherApplication: user.teacherApplications[0] || null,
      createdAt: user.createdAt,
    };
  }

  private assertAccountPermitsTokenAction(
    user: { id: string; deletedAt: Date | null; status: string } | null | undefined,
    action: 'VERIFY_EMAIL' | 'RESET_PASSWORD'
  ): { id: string; status: string } {
    if (!user || user.deletedAt !== null) {
      throw new ForbiddenError('此帳號不存在或已刪除，無法執行此操作', 'ACCOUNT_DISABLED');
    }

    if (user.status === 'SUSPENDED' || user.status === 'DISABLED') {
      throw new ForbiddenError('此帳號已停用或凍結，無法執行此操作', 'ACCOUNT_DISABLED');
    }

    const allowedStatuses =
      action === 'VERIFY_EMAIL' ? ['ACTIVE', 'PENDING_VERIFICATION'] : ['ACTIVE'];

    if (!allowedStatuses.includes(user.status)) {
      throw new ForbiddenError('此帳號目前狀態不允許執行此操作', 'ACCOUNT_STATUS_INVALID');
    }

    return { id: user.id, status: user.status };
  }

  /**
   * Verify email via token.
   */
  async verifyEmail(rawToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = hashToken(rawToken);

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt !== null) {
      throw new BadRequestError('無效或已使用過的驗證憑證');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestError('此驗證憑證已逾期，請重新申請驗證信');
    }

    const account = this.assertAccountPermitsTokenAction(record.user, 'VERIFY_EMAIL');
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const tokenClaim = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (tokenClaim.count !== 1) {
        throw new BadRequestError('無效或已使用過的驗證憑證');
      }

      await tx.user.update({
        where: { id: account.id },
        data: {
          emailVerifiedAt: now,
          ...(account.status === 'PENDING_VERIFICATION' ? { status: 'ACTIVE' } : {}),
        },
      });

      await logAuditEvent(
        {
          userId: account.id,
          action: 'EMAIL_VERIFIED',
          details: { userId: account.id, verifiedAt: now.toISOString() },
          ipAddress,
          userAgent,
        },
        tx
      );
    });

    return { success: true, message: '電子郵件驗證成功' };
  }

  /**
   * Create password reset token.
   */
  async requestPasswordReset(email: string, ipAddress?: string, userAgent?: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return generic success message to prevent email or account-status enumeration
    if (
      !user ||
      user.deletedAt !== null ||
      user.status === 'SUSPENDED' ||
      user.status === 'DISABLED'
    ) {
      return { success: true, message: '若帳號存在，且郵件服務已啟用，系統才會寄送密碼重設郵件。' };
    }

    const rawToken = generateSecureToken(32);
    const hashedToken = hashToken(rawToken);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await logAuditEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      details: { userId: user.id },
      ipAddress,
      userAgent,
    });

    // Send reset email via provider
    await emailProvider.sendPasswordResetEmail(user.email, rawToken);

    return {
      success: true,
      message: '若帳號存在，且郵件服務已啟用，系統才會寄送密碼重設郵件。',
    };
  }

  /**
   * Reset password with valid token.
   */
  async resetPassword(input: ResetPasswordInput, ipAddress?: string, userAgent?: string) {
    const tokenHash = hashToken(input.token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt !== null) {
      throw new BadRequestError('無效或已使用過的重設憑證');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestError('重設憑證已逾期，請重新申請重設密碼');
    }

    const account = this.assertAccountPermitsTokenAction(record.user, 'RESET_PASSWORD');
    const passwordHash = await hashPassword(input.newPassword);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      const tokenClaim = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: now },
      });
      if (tokenClaim.count !== 1) {
        throw new BadRequestError('無效或已使用過的重設憑證');
      }

      await tx.user.update({
        where: { id: account.id },
        data: { passwordHash },
      });

      // Revoke all existing sessions upon password reset
      await tx.session.updateMany({
        where: { userId: account.id, revokedAt: null },
        data: { revokedAt: now },
      });

      await logAuditEvent(
        {
          userId: account.id,
          action: 'PASSWORD_RESET_COMPLETED',
          details: { userId: account.id, revokedExistingSessions: true },
          ipAddress,
          userAgent,
        },
        tx
      );
    });

    return { success: true, message: '密碼已成功更新，請使用新密碼登入' };
  }
}

export const authService = new AuthService();
