import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError, ConflictError, NotFoundError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { logSafeError, redactStringSecrets } from '../utils/redaction.js';

export function isPrismaKnownRequestError(err: unknown): err is Prisma.PrismaClientKnownRequestError {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return true;
  }
  // Structural check for test mocks / cross-realm objects matching Prisma's signature
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: unknown }).name === 'PrismaClientKnownRequestError' &&
    typeof (err as { code?: unknown }).code === 'string' &&
    (err as { code: string }).code.startsWith('P') &&
    typeof (err as { clientVersion?: unknown }).clientVersion === 'string'
  ) {
    return true;
  }
  return false;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: '輸入欄位格式不符合規範',
        details: err.flatten().fieldErrors,
      },
    });
  }

  // SyntaxError from malformed JSON in request body
  if (err instanceof SyntaxError && 'status' in err && (err as { status: unknown }).status === 400) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: '請求格式不是合法的 JSON',
      },
    });
  }

  // Prisma Known Database Request Errors
  if (isPrismaKnownRequestError(err)) {
    // P2002: Unique constraint violation (e.g. duplicate email registration under race conditions)
    if (err.code === 'P2002') {
      const conflictError = new ConflictError('資源已存在或資料衝突，請確認後重試');
      return res.status(conflictError.statusCode).json({
        success: false,
        error: {
          code: conflictError.code,
          message: conflictError.message,
        },
      });
    }

    // P2025: Record to update/delete/find not found in database
    if (err.code === 'P2025') {
      const notFoundError = new NotFoundError('找不到指定的資源或該紀錄已被移除');
      return res.status(notFoundError.statusCode).json({
        success: false,
        error: {
          code: notFoundError.code,
          message: notFoundError.message,
        },
      });
    }

    // Other Prisma errors fall through to safe 500 handling
  }

  logSafeError('Unhandled server error:', err, {
    method: _req.method,
    path: _req.path,
  });

  const response: {
    success: boolean;
    error: {
      code: string;
      message: string;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '系統發生非預期錯誤，請稍後再試',
    },
  };

  if (env.NODE_ENV === 'development') {
    response.error.stack = err.stack ? redactStringSecrets(err.stack) : undefined;
  }

  return res.status(500).json(response);
}
