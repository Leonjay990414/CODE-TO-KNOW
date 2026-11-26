import { Request, Response, NextFunction } from 'express';
import { questionService } from './question.service.js';
import { GetQuestionsQuery } from './question.schema.js';

export class QuestionController {
  async getCertifications(_req: Request, res: Response, next: NextFunction) {
    try {
      const certifications = await questionService.getCertifications();
      return res.status(200).json({
        success: true,
        data: certifications,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as unknown as GetQuestionsQuery;
      const result = await questionService.getQuestions(query);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQuestionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const question = await questionService.getQuestionById(id);
      return res.status(200).json({
        success: true,
        data: question,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const questionController = new QuestionController();
