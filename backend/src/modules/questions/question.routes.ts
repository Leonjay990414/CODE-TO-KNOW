import { Router } from 'express';
import { questionController } from './question.controller.js';
import { validateQuery, validateParams } from '../../middleware/validate.js';
import { GetQuestionsQuerySchema, QuestionIdParamSchema } from './question.schema.js';

export const questionRoutes = Router();
export const certificationRoutes = Router();

// /api/certifications
certificationRoutes.get('/', (req, res, next) => questionController.getCertifications(req, res, next));

// /api/questions
questionRoutes.get('/', validateQuery(GetQuestionsQuerySchema), (req, res, next) =>
  questionController.getQuestions(req, res, next)
);

questionRoutes.get('/:id', validateParams(QuestionIdParamSchema), (req, res, next) =>
  questionController.getQuestionById(req, res, next)
);
