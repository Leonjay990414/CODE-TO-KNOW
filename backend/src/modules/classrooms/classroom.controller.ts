import { Request, Response, NextFunction } from 'express';
import { classroomService } from './classroom.service.js';
import { requireActor } from '../../utils/ownership.js';

export class ClassroomController {
  async createClassroom(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classroom = await classroomService.createClassroom(
        actor.id,
        req.body,
        req.ip,
        req.get('user-agent')
      );
      return res.status(201).json({
        success: true,
        message: '班級建立成功',
        data: { classroom },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyTeachingClassrooms(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classrooms = await classroomService.getMyTeachingClassrooms(actor.id);
      return res.status(200).json({
        success: true,
        data: { classrooms },
      });
    } catch (error) {
      return next(error);
    }
  }

  async getMyEnrolledClassrooms(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const enrolled = await classroomService.getMyEnrolledClassrooms(actor.id);
      return res.status(200).json({
        success: true,
        data: { enrolled },
      });
    } catch (error) {
      return next(error);
    }
  }

  async joinClassroom(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const result = await classroomService.joinClassroom(
        actor.id,
        req.body,
        req.ip,
        req.get('user-agent')
      );
      return res.status(200).json({
        success: true,
        message: '成功加入班級！',
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getClassroomMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classId = req.params.id as string;
      const result = await classroomService.getClassroomMembers(actor.id, actor.roles, classId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classId = req.params.id as string;
      const studentId = req.params.studentId as string;
      const result = await classroomService.removeMember(
        actor.id,
        actor.roles,
        classId,
        studentId,
        req.ip,
        req.get('user-agent')
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async getClassroomAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classId = req.params.id as string;
      const result = await classroomService.getClassroomAnalytics(actor.id, actor.roles, classId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getStudentClassroomProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const actor = requireActor(req);
      const classId = req.params.id as string;
      const studentId = req.params.studentId as string;
      const result = await classroomService.getStudentClassroomProgress(
        actor.id,
        actor.roles,
        classId,
        studentId
      );
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export const classroomController = new ClassroomController();
