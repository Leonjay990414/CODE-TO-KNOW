import { Request, Response, NextFunction } from 'express';
import { practicalService } from './practical.service.js';
import { resolveExamActor } from '../exams/exam.controller.js';

export class PracticalController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const result = await practicalService.getTasks(actor);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getTaskDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { taskId } = req.params;
      const { version } = req.query;
      const result = await practicalService.getTaskDetails(actor, taskId, version as string);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async saveProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { taskId } = req.params;
      const result = await practicalService.saveProgress(actor, taskId, req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getSavedCode(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { taskId } = req.params;
      const { version } = req.query;
      const result = await practicalService.getSavedCode(actor, taskId, version as string);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const practicalController = new PracticalController();
