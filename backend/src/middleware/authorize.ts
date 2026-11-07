import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';

/**
 * 角色映射過渡相容擴展 (RBAC Transitional Compatibility)：
 * 1. 舊版 'ADMIN' 僅可相容 'PLATFORM_ADMIN'，兩者在過渡期互通以支援漸進式遷移。
 * 2. 舊版 'ADMIN' 絕對不得自動取得 'SYSTEM_OPERATOR'。
 * 3. 'SYSTEM_OPERATOR' 與 'PLATFORM_ADMIN' 嚴格職責分離 (SoD)，彼此互不相容。
 * 4. 正式移除條件：當資料庫角色名冊全面完成 Seed 規範化，且前端 Route Guard 徹底淘汰 'ADMIN' 字串後移除。
 */
export function expandCompatibleRoles(roles: string[]): string[] {
  const expanded = new Set(roles);
  if (roles.includes('ADMIN')) {
    expanded.add('PLATFORM_ADMIN');
  }
  if (roles.includes('PLATFORM_ADMIN')) {
    expanded.add('ADMIN');
  }
  return Array.from(expanded);
}

export function requireRoles(allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('尚未登入，請先進行登入', 'UNAUTHENTICATED'));
    }

    const effectiveUserRoles = expandCompatibleRoles(req.user.roles);
    const hasRole = effectiveUserRoles.some((role) => allowedRoles.includes(role));

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
