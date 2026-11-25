import { Request, Response, NextFunction } from 'express';
import { studentService } from './student.service.js';
import { OwnershipActor } from '../../utils/ownership.js';

export class StudentController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const actor: OwnershipActor = {
        id: req.user!.id,
        roles: (req.user as any).roles || [],
      };

      const data = await studentService.getDashboard(actor);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const actor: OwnershipActor = {
        id: req.user!.id,
        roles: (req.user as any).roles || [],
      };

      const updated = await studentService.updateProfile(
        actor,
        req.body,
        req.ip,
        req.get('user-agent')
      );

      return res.status(200).json({
        success: true,
        data: updated,
        message: '個人資料已成功更新',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const studentController = new StudentController();
