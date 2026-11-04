import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';
import { SESSION_COOKIE_NAME } from '../../middleware/authenticate.js';
import { setCsrfCookie } from '../../middleware/csrf.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(201).json({
        success: true,
        data: {
          user: result.user,
          message: env.NODE_ENV === 'production'
            ? '帳號已建立；目前電子郵件驗證服務尚未啟用，暫時無法寄送驗證信。'
            : '帳號已建立；目前使用本機測試模式，未實際寄送驗證信。',
          // In development/test mode, expose verification token for ease of testing
          ...(env.NODE_ENV !== 'production' ? { verificationToken: result.verificationToken } : {}),
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      // Set httpOnly session cookie
      res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: result.expiresAt,
        domain: env.COOKIE_DOMAIN || undefined,
      });

      // Also refresh CSRF token cookie on login
      const csrfToken = setCsrfCookie(res);

      return res.status(200).json({
        success: true,
        data: {
          user: result.user,
          csrfToken,
          message: '登入成功',
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(
        req.sessionId,
        req.user?.id,
        req.ip,
        req.headers['user-agent']
      );

      // Clear session cookie
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: env.COOKIE_DOMAIN || undefined,
      });

      return res.status(200).json({
        success: true,
        data: {
          message: '已成功登出',
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHENTICATED', message: '尚未登入' },
        });
      }

      const user = await authService.getCurrentUser(req.user.id);

      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getCsrfToken(_req: Request, res: Response) {
    const csrfToken = setCsrfCookie(res);
    return res.status(200).json({
      success: true,
      data: { csrfToken },
    });
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyEmail(
        req.body.token,
        req.ip,
        req.headers['user-agent']
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.requestPasswordReset(
        req.body.email,
        req.ip,
        req.headers['user-agent']
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(
        req.body,
        req.ip,
        req.headers['user-agent']
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

export const authController = new AuthController();
