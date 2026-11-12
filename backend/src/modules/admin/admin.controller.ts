import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service.js';

function parseValidatedPositiveInt(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 1) {
    return raw;
  }
  if (typeof raw === 'string' && /^\d+$/.test(raw)) {
    const parsed = parseInt(raw, 10);
    if (parsed >= 1) {
      return parsed;
    }
  }
  return fallback;
}

export class AdminController {
  async listTeacherApplications(req: Request, res: Response, next: NextFunction) {
    try {
      const status = req.query.status as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
      const page = parseValidatedPositiveInt(req.query.page, 1);
      const limit = parseValidatedPositiveInt(req.query.limit, 20);

      const result = await adminService.listTeacherApplications(status, page, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async approveTeacherApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await adminService.approveTeacherApplication(
        id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(200).json({
        success: true,
        data: {
          application: updated,
          message: '教師身分審核已核准，該使用者已獲得 TEACHER 權限',
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async rejectTeacherApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await adminService.rejectTeacherApplication(
        id,
        req.user!.id,
        req.body,
        req.ip,
        req.headers['user-agent']
      );

      return res.status(200).json({
        success: true,
        data: {
          application: updated,
          message: '教師身分審核已退回',
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  async listAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseValidatedPositiveInt(req.query.page, 1);
      const limit = parseValidatedPositiveInt(req.query.limit, 50);

      const result = await adminService.listAuditLogs(page, limit);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const adminController = new AdminController();
