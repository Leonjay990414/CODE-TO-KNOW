import { Request, Response, NextFunction } from 'express';
import { examService } from './exam.service.js';
import { OwnershipActor } from '../../utils/ownership.js';

export function resolveExamActor(req: Request): OwnershipActor {
  if (req.user) {
    return { id: req.user.id, roles: req.user.roles };
  }
  const customUserId = req.headers['x-user-id'];
  const actorId = typeof customUserId === 'string' && customUserId.trim() ? customUserId.trim() : 'demo-student';
  return {
    id: actorId,
    roles: ['STUDENT'],
  };
}

export class ExamController {
  async generateExam(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const result = await examService.generateExam(actor, req.body);
      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async submitExam(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { id } = req.params;
      const result = await examService.submitExam(actor, id, req.body);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getScoreReport(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { id } = req.params;
      const result = await examService.getScoreReport(actor, id);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getExamHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const result = await examService.getExamHistory(actor);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const examController = new ExamController();
