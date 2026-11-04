import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { generalRateLimiter } from './middleware/rate-limiter.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { teacherRoutes } from './modules/teachers/teacher.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { prisma } from './config/database.js';
import { NotFoundError } from './utils/errors.js';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(
    helmet({
      // This API does not serve the frontend HTML.
      // Configure the frontend Content Security Policy at its hosting layer.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
    })
  );

  // Body & Cookie Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.SESSION_SECRET));

  // Global rate limiter
  app.use(generalRateLimiter);

  // Public health check with minimal information disclosure
  app.get('/api/health', async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    let dbLatencyMs: number | null = null;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch {
      console.error('[HEALTH CHECK] Database connectivity check failed.');
    }

    const isHealthy = dbStatus === 'connected';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'CODE TO KNOW API',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 Handler
  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('API endpoint not found.'));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();