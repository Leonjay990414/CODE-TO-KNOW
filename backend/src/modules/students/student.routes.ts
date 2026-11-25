import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { updateStudentProfileSchema } from './student.schema.js';
import { rejectForgedOwnerFields } from '../../utils/ownership.js';

const router = Router();

// All student endpoints require authentication
router.use(authenticate);

// 1. Get comprehensive student learning dashboard & progress
router.get('/dashboard', (req, res, next) => studentController.getDashboard(req, res, next));

// 2. Update authorized student profile (cannot forge roles, id, or email)
router.patch(
  '/profile',
  rejectForgedOwnerFields(['id', 'userId', 'role', 'roles', 'email', 'status', 'password', 'passwordHash'], {
    resourceName: '學生個人資料',
  }),
  validateBody(updateStudentProfileSchema),
  (req, res, next) => studentController.updateProfile(req, res, next)
);

export const studentRoutes = router;
