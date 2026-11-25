import { Router } from 'express';
import { practicalController } from './practical.controller.js';
import { validateBody, validateParams, validateQuery } from '../../middleware/validate.js';
import { optionalAuthenticate } from '../../middleware/authenticate.js';
import {
  GetPracticalTaskParamsSchema,
  GetPracticalTaskQuerySchema,
  SavePracticalProgressBodySchema,
} from './practical.schema.js';

export const practicalRoutes = Router();

// Apply optional authentication across practical routes
practicalRoutes.use(optionalAuthenticate);

// List 5 official practical tasks with progress summary
practicalRoutes.get('/', (req, res, next) =>
  practicalController.getTasks(req, res, next)
);

// Get task details, steps and user's saved code for a given version
practicalRoutes.get(
  '/:taskId',
  validateParams(GetPracticalTaskParamsSchema),
  validateQuery(GetPracticalTaskQuerySchema),
  (req, res, next) => practicalController.getTaskDetails(req, res, next)
);

// Save code or update step completion status
practicalRoutes.post(
  '/:taskId/progress',
  validateParams(GetPracticalTaskParamsSchema),
  validateBody(SavePracticalProgressBodySchema),
  (req, res, next) => practicalController.saveProgress(req, res, next)
);

// Get saved code specifically
practicalRoutes.get(
  '/:taskId/code',
  validateParams(GetPracticalTaskParamsSchema),
  validateQuery(GetPracticalTaskQuerySchema),
  (req, res, next) => practicalController.getSavedCode(req, res, next)
);
