import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { hashToken } from '../utils/tokens.js';
import { UnauthorizedError } from '../utils/errors.js';

export const SESSION_COOKIE_NAME = 'code_to_know_session';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      sessionId?: string;
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!rawToken || typeof rawToken !== 'string') {
      return next(new UnauthorizedError('尚未登入，請先進行登入', 'UNAUTHENTICATED'));
    }

    const tokenHash = hashToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return next(new UnauthorizedError('無效的登入 Session', 'INVALID_SESSION'));
    }

    if (session.revokedAt !== null) {
      return next(new UnauthorizedError('此登入階段已被登出或撤銷', 'SESSION_REVOKED'));
    }

    if (new Date() > session.expiresAt) {
      return next(new UnauthorizedError('登入已逾期，請重新登入', 'SESSION_EXPIRED'));
    }

    if (session.user.deletedAt !== null || session.user.status === 'SUSPENDED' || session.user.status === 'DISABLED') {
      return next(new UnauthorizedError('帳號已被停用或刪除', 'ACCOUNT_DISABLED'));
    }

    const roleNames = session.user.roles.map((r) => r.role.name);

    req.user = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      roles: roleNames,
    };
    req.sessionId = session.id;

    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Optional authentication middleware: if session exists and is valid, attaches user; does not reject if absent.
 */
export async function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (!rawToken) {
    return next();
  }

  try {
    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (session && !session.revokedAt && new Date() <= session.expiresAt && !session.user.deletedAt) {
      req.user = {
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.displayName,
        roles: session.user.roles.map((r) => r.role.name),
      };
      req.sessionId = session.id;
    }
  } catch {
    // Ignore errors for optional auth
  }

  return next();
}
