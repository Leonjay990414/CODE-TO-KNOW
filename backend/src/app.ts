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

  // Basic security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed per frontend deployment or API specification
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-skip-csrf'],
      exposedHeaders: ['set-cookie'],
    })
  );

  // Body & Cookie Parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser(env.SESSION_SECRET));

  // Global rate limiter
  app.use(generalRateLimiter);

  // Health check endpoint (probes real database connectivity)
  app.get('/api/health', async (_req: Request, res: Response) => {
    let dbStatus = 'disconnected';
    let dbLatencyMs: number | null = null;
    let dbError: string | null = null;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = 'disconnected';
      dbError = '無法連線至 PostgreSQL 資料庫，請確認 Docker 容器是否已啟動';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'CODE TO KNOW API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        ...(dbError ? { message: dbError } : {}),
      },
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/teachers', teacherRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 Handler
  app.use((_req: Request, _res: Response, next) => {
    next(new NotFoundError('找不到所請求的 API 路徑'));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
