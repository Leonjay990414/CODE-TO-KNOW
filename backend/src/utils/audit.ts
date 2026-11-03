import { Request } from 'express';
import { prisma } from '../config/database.js';

export async function logAuditEvent(
  req: Request | null,
  action: string,
  userId?: string | null,
  details?: Record<string, unknown> | string
): Promise<void> {
  try {
    const ipAddress = req
      ? (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || null
      : null;
    const userAgent = req ? req.headers['user-agent'] || null : null;

    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details: detailsStr,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to record audit log:', action, error);
  }
}
