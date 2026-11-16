import { Router } from 'express';
import { classroomController } from './classroom.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRoles } from '../../middleware/authorize.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import {
  createClassroomSchema,
  joinClassroomSchema,
  classroomIdParamSchema,
  removeMemberParamSchema,
} from './classroom.schema.js';
import { rejectForgedOwnerFields } from '../../utils/ownership.js';

const router = Router();

// All classroom endpoints require an authenticated user
router.use(authenticate);

// 1. Teacher create classroom
router.post(
  '/',
  requireRoles(['TEACHER', 'ADMIN']),
  csrfProtection,
  rejectForgedOwnerFields(['creatorId'], { resourceName: '班級創建' }),
  validateBody(createClassroomSchema),
  (req, res, next) => classroomController.createClassroom(req, res, next)
);

// 2. Teacher query owned classrooms
router.get(
  '/my-teaching',
  requireRoles(['TEACHER', 'ADMIN']),
  (req, res, next) => classroomController.getMyTeachingClassrooms(req, res, next)
);

// 3. Student query enrolled classrooms
router.get(
  '/my-enrolled',
  requireRoles(['STUDENT', 'ADMIN']),
  (req, res, next) => classroomController.getMyEnrolledClassrooms(req, res, next)
);

// 4. Student join classroom via join code
router.post(
  '/join',
  requireRoles(['STUDENT', 'ADMIN']),
  csrfProtection,
  rejectForgedOwnerFields(['studentId'], { resourceName: '班級加入' }),
  validateBody(joinClassroomSchema),
  (req, res, next) => classroomController.joinClassroom(req, res, next)
);

// 5. Teacher query classroom student roster (Scoped by ownership)
router.get(
  '/:id/members',
  requireRoles(['TEACHER', 'ADMIN']),
  validateParams(classroomIdParamSchema),
  (req, res, next) => classroomController.getClassroomMembers(req, res, next)
);

// 6. Teacher remove student from classroom (Scoped by ownership)
router.delete(
  '/:id/members/:studentId',
  requireRoles(['TEACHER', 'ADMIN']),
  csrfProtection,
  validateParams(removeMemberParamSchema),
  (req, res, next) => classroomController.removeMember(req, res, next)
);

export const classroomRoutes = router;
