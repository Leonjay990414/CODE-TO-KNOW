import { Router } from 'express';
import { examController } from './exam.controller.js';
import { validateBody, validateParams } from '../../middleware/validate.js';
import { optionalAuthenticate } from '../../middleware/authenticate.js';
import {
  GenerateExamInputSchema,
  SubmitExamInputSchema,
  ExamAttemptIdParamSchema,
} from './exam.schema.js';

export const examRoutes = Router();

// Apply optional authentication across all exam routes
examRoutes.use(optionalAuthenticate);

// Generate 80-question mock exam
examRoutes.post(
  '/generate',
  validateBody(GenerateExamInputSchema),
  (req, res, next) => examController.generateExam(req, res, next)
);

// Get user's exam history
examRoutes.get('/history', (req, res, next) =>
  examController.getExamHistory(req, res, next)
);

// Submit answers and evaluate exam
examRoutes.post(
  '/:id/submit',
  validateParams(ExamAttemptIdParamSchema),
  validateBody(SubmitExamInputSchema),
  (req, res, next) => examController.submitExam(req, res, next)
);

// Retrieve score report and snapshots
examRoutes.get(
  '/:id/report',
  validateParams(ExamAttemptIdParamSchema),
  (req, res, next) => examController.getScoreReport(req, res, next)
);
