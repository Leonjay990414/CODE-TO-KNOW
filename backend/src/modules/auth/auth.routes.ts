import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateBody } from '../../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authRateLimiter } from '../../middleware/rate-limiter.js';
import { csrfProtection } from '../../middleware/csrf.js';

const router = Router();

// CSRF token provider
router.get('/csrf-token', (req, res) => authController.getCsrfToken(req, res));

// Public Auth endpoints
router.post(
  '/register',
  authRateLimiter,
  csrfProtection,
  validateBody(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

router.post(
  '/login',
  authRateLimiter,
  csrfProtection,
  validateBody(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

router.post(
  '/verify-email',
  authRateLimiter,
  csrfProtection,
  validateBody(verifyEmailSchema),
  (req, res, next) => authController.verifyEmail(req, res, next)
);

router.post(
  '/forgot-password',
  authRateLimiter,
  csrfProtection,
  validateBody(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

router.post(
  '/reset-password',
  authRateLimiter,
  csrfProtection,
  validateBody(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

// Protected Auth endpoints
router.post('/logout', authenticate, csrfProtection, (req, res, next) =>
  authController.logout(req, res, next)
);

router.get('/me', authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export const authRoutes = router;
