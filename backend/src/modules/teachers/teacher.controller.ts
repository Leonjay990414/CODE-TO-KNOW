import { Request, Response, NextFunction } from 'express';
import { teacherService } from './teacher.service.js';

export class TeacherController {
  async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await teacherService.submitApplication(
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(201).json({
        success: true,
        data: {
          application,
          message: '教師身分申請已送出，管理員將於 1-3 個工作天內完成審核',
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const application = await teacherService.getMyApplication(req.user!.id);

      return res.status(200).json({
        success: true,
        data: { application },
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const teacherController = new TeacherController();
