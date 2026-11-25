import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRoles } from '../../middleware/authorize.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import {
  reviewApplicationSchema,
  listApplicationsQuerySchema,
  listAuditLogsQuerySchema,
  applicationIdParamSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
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
  validateParams(applicationIdParamSchema),
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.approveTeacherApplication(req, res, next)
);

router.post(
  '/teacher-applications/:id/reject',
  validateParams(applicationIdParamSchema),
  validateBody(reviewApplicationSchema),
  (req, res, next) => adminController.rejectTeacherApplication(req, res, next)
);

// Platform overview statistics
router.get(
  '/overview',
  (req, res, next) => adminController.getPlatformOverview(req, res, next)
);

// User management
router.get(
  '/users',
  validateQuery(listUsersQuerySchema),
  (req, res, next) => adminController.listUsers(req, res, next)
);

router.patch(
  '/users/:id/status',
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  (req, res, next) => adminController.updateUserStatus(req, res, next)
);

router.patch(
  '/users/:id/role',
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  (req, res, next) => adminController.updateUserRole(req, res, next)
);

// Security audit logs
router.get(
  '/audit-logs',
  validateQuery(listAuditLogsQuerySchema),
  (req, res, next) => adminController.listAuditLogs(req, res, next)
);

export const adminRoutes = router;
