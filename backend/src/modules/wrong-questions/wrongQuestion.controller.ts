import { Request, Response, NextFunction } from 'express';
import { wrongQuestionService } from './wrongQuestion.service.js';
import { resolveExamActor } from '../exams/exam.controller.js';

export class WrongQuestionController {
  async getWrongQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const query = req.query as any;
      const result = await wrongQuestionService.getWrongQuestions(actor, query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async practiceReview(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = resolveExamActor(req);
      const { id } = req.params;
      const { answer } = req.body;
      const result = await wrongQuestionService.practiceReview(actor, id, answer);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const wrongQuestionController = new WrongQuestionController();
