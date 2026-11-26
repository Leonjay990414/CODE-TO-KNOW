import { Router } from 'express';
import { studentController } from './student.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { updateStudentProfileSchema, recordStudyTimeSchema } from './student.schema.js';
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

// 3. Record active study time with duration validation and atomic upsert
router.post(
  '/study-time',
  rejectForgedOwnerFields(['id', 'userId', 'user'], { resourceName: '研讀時長紀錄' }),
  validateBody(recordStudyTimeSchema),
  (req, res, next) => studentController.recordStudyTime(req, res, next)
);

// 4. Get aggregated study time statistics
router.get('/study-time', (req, res, next) => studentController.getStudyTime(req, res, next));

// 5. Get dynamic learning progress & analytics across 4 work items
router.get('/progress-analytics', (req, res, next) => studentController.getProgressAnalytics(req, res, next));

export const studentRoutes = router;
