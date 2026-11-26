import { Router } from 'express';
import { wrongQuestionController } from './wrongQuestion.controller.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { optionalAuthenticate } from '../../middleware/authenticate.js';
import {
  GetWrongQuestionsQuerySchema,
  PracticeWrongQuestionInputSchema,
  WrongQuestionIdParamSchema,
  RecordWrongQuestionInputSchema,
} from './wrongQuestion.schema.js';
import { rejectForgedOwnerFields } from '../../utils/ownership.js';

export const wrongQuestionRoutes = Router();

// Apply optional authentication across all wrong-question routes
wrongQuestionRoutes.use(optionalAuthenticate);

// List paginated wrong questions with stats
wrongQuestionRoutes.get(
  '/',
  validateQuery(GetWrongQuestionsQuerySchema),
  (req, res, next) => wrongQuestionController.getWrongQuestions(req, res, next)
);

// Record a wrong question from practice or exams
wrongQuestionRoutes.post(
  '/record',
  rejectForgedOwnerFields(['id', 'userId', 'user'], { resourceName: '錯題紀錄' }),
  validateBody(RecordWrongQuestionInputSchema),
  (req, res, next) => wrongQuestionController.recordWrongQuestion(req, res, next)
);

// Practice/review a wrong question and update mastery state machine
wrongQuestionRoutes.post(
  '/:id/practice',
  validateParams(WrongQuestionIdParamSchema),
  validateBody(PracticeWrongQuestionInputSchema),
  (req, res, next) => wrongQuestionController.practiceReview(req, res, next)
);
