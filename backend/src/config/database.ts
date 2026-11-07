import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.js';
import { validateTestDatabaseUrl } from './db-validation.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function resolveDatabaseConnectionString(): string {
  if (env.NODE_ENV === 'test') {
    if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL.trim()) {
      return validateTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    }
  }
  return env.DATABASE_URL;
}

const pool = new pg.Pool({ connectionString: resolveDatabaseConnectionString() });
const adapter = new PrismaPg(pool);

export const prisma =
  global.__prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
