import { Request, Response, NextFunction } from 'express';
import { generateSecureToken, safeCompare } from '../utils/tokens.js';
import { ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';

export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'x-csrf-token';

export function setCsrfCookie(res: Response): string {
  const token = generateSecureToken(24);
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Frontend JS reads this to send in x-csrf-token header
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    domain: env.COOKIE_DOMAIN || undefined,
  });
  return token;
}

export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // If no CSRF cookie exists, set one automatically
  if (!req.cookies?.[CSRF_COOKIE_NAME]) {
    setCsrfCookie(res);
  }

  // Safe HTTP methods do not mutate state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt paths if needed (e.g., initial webhook or testing mock override)
  if (process.env.NODE_ENV === 'test' && req.headers['x-skip-csrf'] === 'true') {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    return next(new ForbiddenError('無效或缺少 CSRF 防護憑證，請重新整理頁面後再試', 'CSRF_VALIDATION_FAILED'));
  }

  return next();
}
