import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('尚未登入，請先進行登入', 'UNAUTHENTICATED'));
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return next(
        new ForbiddenError(
          `權限不足：需要具有 [${allowedRoles.join(', ')}] 權限才能存取此功能`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    return next();
  };
}
