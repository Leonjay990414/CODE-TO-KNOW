import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { logSafeError } from './utils/redaction.js';

export const server = app.listen(env.PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 CODE TO KNOW (碼上學) 後端 API 服務啟動`);
  console.log(`📡 監聽通訊埠: http://localhost:${env.PORT}`);
  console.log(`🌍 環境模式: ${env.NODE_ENV}`);
  console.log(`🔒 CORS 來源允許: ${env.CORS_ORIGIN}`);
  console.log(`===============================================`);
});

/**
 * Disconnects Prisma safely and logs shutdown failures without exposing raw credentials.
 */
export async function disconnectDatabaseOnShutdown(): Promise<boolean> {
  try {
    await prisma.$disconnect();
    console.log('PostgreSQL 資料庫連線已安全斷開。');
    return true;
  } catch (err) {
    logSafeError('關閉資料庫連線時發生錯誤:', err);
    return false;
  }
}

// Graceful shutdown handlers
export async function gracefulShutdown(signal: string) {
  console.log(`\n收到 ${signal} 訊號，正在優雅關閉伺服器...`);
  server.close(async () => {
    const ok = await disconnectDatabaseOnShutdown();
    process.exit(ok ? 0 : 1);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    console.error('強制終止逾時，伺服器緊急結束。');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
