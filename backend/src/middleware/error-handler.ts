import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { logSafeError, redactStringSecrets } from '../utils/redaction.js';

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
