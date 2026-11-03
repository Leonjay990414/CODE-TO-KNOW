import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRoles } from '../../middleware/authorize.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import { reviewApplicationSchema, listApplicationsQuerySchema } from './admin.schema.js';

const router = Router();

// All admin endpoints require authentication and ADMIN role
router.use(authenticate, requireRoles(['ADMIN']));

// Teacher application management
router.get(
  '/teacher-applications',
  validateQuery(listApplicationsQuerySchema),
  (req, res, next) => adminController.listTeacherApplications(req, res, next)
);

router.post(
  '/teacher-applications/:id/approve',
  csrfProtection,
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.approveTeacherApplication(req, res, next)
);

router.post(
  '/teacher-applications/:id/reject',
  csrfProtection,
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.rejectTeacherApplication(req, res, next)
);

// Security audit logs
router.get('/audit-logs', (req, res, next) =>
  adminController.listAuditLogs(req, res, next)
);

export const adminRoutes = router;
