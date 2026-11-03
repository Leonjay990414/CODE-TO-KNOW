import { Router } from 'express';
import { teacherController } from './teacher.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { validateBody } from '../../middleware/validate.js';
import { applyTeacherSchema } from './teacher.schema.js';

const router = Router();

router.use(authenticate);

router.post(
  '/applications',
  csrfProtection,
  validateBody(applyTeacherSchema),
  (req, res, next) => teacherController.submitApplication(req, res, next)
);

router.get('/my-application', (req, res, next) =>
  teacherController.getMyApplication(req, res, next)
);

export const teacherRoutes = router;
