import { prisma } from '../../config/database.js';
import { emailProvider } from '../../services/email.provider.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { generateSecureToken, hashToken } from '../../utils/tokens.js';
import {
  BadRequestError,
  ConflictError,
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
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTER',
        details: JSON.stringify({ email: user.email, roles: ['STUDENT'] }),
        ipAddress,
        userAgent,
      },
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
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          details: JSON.stringify({ reason: 'Invalid password' }),
          ipAddress,
          userAgent,
        },
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
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        details: JSON.stringify({ sessionId: session.id }),
        ipAddress,
        userAgent,
      },
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
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'USER_LOGOUT',
          details: JSON.stringify({ sessionId }),
          ipAddress,
          userAgent,
        },
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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: record.userId,
          action: 'EMAIL_VERIFIED',
          ipAddress,
          userAgent,
        },
      }),
    ]);

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

    // Always return generic success message to prevent email enumeration
    if (!user || user.deletedAt !== null) {
      return { success: true, message: '若帳號存在，密碼重設信件已寄出' };
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

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        ipAddress,
        userAgent,
      },
    });

    // Send reset email via provider
    await emailProvider.sendPasswordResetEmail(user.email, rawToken);

    return {
      success: true,
      message: '若帳號存在，密碼重設信件已寄出',
      resetToken: rawToken, // For development logging / testing
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

    const passwordHash = await hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all existing sessions upon password reset
      prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: record.userId,
          action: 'PASSWORD_RESET_COMPLETED',
          ipAddress,
          userAgent,
        },
      }),
    ]);

    return { success: true, message: '密碼已成功更新，請使用新密碼登入' };
  }
}

export const authService = new AuthService();
