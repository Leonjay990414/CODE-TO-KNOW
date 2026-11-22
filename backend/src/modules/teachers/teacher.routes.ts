import { Router } from 'express';
import { teacherController } from './teacher.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validateBody } from '../../middleware/validate.js';
import { applyTeacherSchema } from './teacher.schema.js';
import { rejectForgedOwnerFields } from '../../utils/ownership.js';

const router = Router();

router.use(authenticate);

router.post(
  '/applications',
  rejectForgedOwnerFields(['userId'], { resourceName: '教師身分申請' }),
  validateBody(applyTeacherSchema),
  (req, res, next) => teacherController.submitApplication(req, res, next)
);

router.get(
  '/my-application',
  rejectForgedOwnerFields(['userId'], { resourceName: '教師身分申請' }),
  (req, res, next) => teacherController.getMyApplication(req, res, next)
);

export const teacherRoutes = router;
