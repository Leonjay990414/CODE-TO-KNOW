import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRoles } from '../../middleware/authorize.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import {
  reviewApplicationSchema,
  listApplicationsQuerySchema,
  listAuditLogsQuerySchema,
  applicationIdParamSchema,
} from './admin.schema.js';

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
  validateParams(applicationIdParamSchema),
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.approveTeacherApplication(req, res, next)
);

router.post(
  '/teacher-applications/:id/reject',
  csrfProtection,
  validateParams(applicationIdParamSchema),
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.rejectTeacherApplication(req, res, next)
);

// Security audit logs
router.get(
  '/audit-logs',
  validateQuery(listAuditLogsQuerySchema),
  (req, res, next) => adminController.listAuditLogs(req, res, next)
);

export const adminRoutes = router;
