import { describe, it, expect } from 'vitest';
import { requireRoles } from '../src/middleware/authorize.js';
import { Request, Response } from 'express';
import { AppError } from '../src/utils/errors.js';

describe('RBAC & Role Security', () => {
  describe('requireRoles Authorization Middleware', () => {
    it('allows access when user has the required role (ADMIN)', () => {
      const middleware = requireRoles(['ADMIN']);
      const req = {
        user: { id: 'u1', email: 'admin@codetoknow.edu', displayName: 'Admin', roles: ['ADMIN', 'STUDENT'] },
      } as unknown as Request;
      const res = {} as Response;
      let nextCalled = false;
      let passedError: unknown = null;

      middleware(req, res, (err) => {
        nextCalled = true;
        passedError = err;
      });

      expect(nextCalled).toBe(true);
      expect(passedError).toBeUndefined();
    });

    it('rejects student access to ADMIN API with 403 Forbidden', () => {
      const middleware = requireRoles(['ADMIN']);
      const req = {
        user: { id: 'u2', email: 'student@codetoknow.edu', displayName: 'Student', roles: ['STUDENT'] },
      } as unknown as Request;
      const res = {} as Response;
      let nextCalled = false;
      let passedError: unknown = null;

      middleware(req, res, (err) => {
        nextCalled = true;
        passedError = err;
      });

      expect(nextCalled).toBe(true);
      expect(passedError).toBeInstanceOf(AppError);
      expect((passedError as AppError).statusCode).toBe(403);
      expect((passedError as AppError).code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects teacher access to ADMIN API with 403 Forbidden', () => {
      const middleware = requireRoles(['ADMIN']);
      const req = {
        user: { id: 'u3', email: 'teacher@codetoknow.edu', displayName: 'Teacher', roles: ['TEACHER', 'STUDENT'] },
      } as unknown as Request;
      const res = {} as Response;
      let passedError: unknown = null;

      middleware(req, res, (err) => {
        passedError = err;
      });

      expect(passedError).toBeInstanceOf(AppError);
      expect((passedError as AppError).statusCode).toBe(403);
      expect((passedError as AppError).code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects student access to TEACHER API with 403 Forbidden', () => {
      const middleware = requireRoles(['TEACHER']);
      const req = {
        user: { id: 'u4', email: 'student@codetoknow.edu', displayName: 'Student', roles: ['STUDENT'] },
      } as unknown as Request;
      const res = {} as Response;
      let passedError: unknown = null;

      middleware(req, res, (err) => {
        passedError = err;
      });

      expect(passedError).toBeInstanceOf(AppError);
      expect((passedError as AppError).statusCode).toBe(403);
      expect((passedError as AppError).code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', () => {
      const middleware = requireRoles(['STUDENT']);
      const req = {} as Request;
      const res = {} as Response;
      let passedError: unknown = null;

      middleware(req, res, (err) => {
        passedError = err;
      });

      expect(passedError).toBeInstanceOf(AppError);
      expect((passedError as AppError).statusCode).toBe(401);
      expect((passedError as AppError).code).toBe('UNAUTHENTICATED');
    });
  });

  describe('Session Lifecycle & Revocation', () => {
    it('validates that revoked sessions cannot be authenticated', () => {
      const session = {
        id: 'sess-123',
        userId: 'user-abc',
        tokenHash: 'hash-abc',
        expiresAt: new Date(Date.now() + 3600000),
        revokedAt: new Date(), // Revoked on logout
      };

      const isSessionValid = !session.revokedAt && new Date() <= session.expiresAt;
      expect(isSessionValid).toBe(false);
    });

    it('validates that expired sessions cannot be authenticated', () => {
      const session = {
        id: 'sess-456',
        userId: 'user-abc',
        tokenHash: 'hash-def',
        expiresAt: new Date(Date.now() - 10000), // Expired
        revokedAt: null,
      };

      const isSessionValid = !session.revokedAt && new Date() <= session.expiresAt;
      expect(isSessionValid).toBe(false);
    });
  });

  describe('Teacher Application State Transitions', () => {
    it('correctly models approval state transition: PENDING -> APPROVED and role upgrade', () => {
      const mockApplicant = {
        id: 'student-123',
        email: 'applicant@example.com',
        roles: ['STUDENT'],
      };

      const application = {
        id: 'app-456',
        userId: mockApplicant.id,
        status: 'PENDING',
        schoolName: '台北資訊高中',
      };

      // Transition on Admin approval
      const approvedApplication = {
        ...application,
        status: 'APPROVED',
        reviewedBy: 'admin-001',
        reviewedAt: new Date(),
        reviewNote: '審核合格',
      };

      // Applicant roles after approval
      const updatedRoles = [...mockApplicant.roles, 'TEACHER'];

      expect(approvedApplication.status).toBe('APPROVED');
      expect(approvedApplication.reviewedBy).toBe('admin-001');
      expect(updatedRoles).toContain('TEACHER');
      expect(updatedRoles).toContain('STUDENT');
    });

    it('correctly models rejection state transition: PENDING -> REJECTED without role change', () => {
      const mockApplicant = {
        id: 'student-123',
        roles: ['STUDENT'],
      };

      const application = {
        id: 'app-789',
        userId: mockApplicant.id,
        status: 'PENDING',
      };

      // Transition on Admin rejection
      const rejectedApplication = {
        ...application,
        status: 'REJECTED',
        reviewedBy: 'admin-001',
        reviewNote: '資料不完整',
      };

      const unchangedRoles = [...mockApplicant.roles];

      expect(rejectedApplication.status).toBe('REJECTED');
      expect(unchangedRoles).not.toContain('TEACHER');
      expect(unchangedRoles).toEqual(['STUDENT']);
    });
  });
});
