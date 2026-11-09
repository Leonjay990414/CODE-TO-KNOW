import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { env } from './env.js';
import {
  validateTestDatabaseUrl,
  validateDevelopmentDatabaseUrl,
  validateCloudRuntimeDatabaseUrl,
} from './db-validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export function resolveProductionSslConfig(): pg.ConnectionConfig['ssl'] {
  const customPath = env.SUPABASE_CA_CERT_PATH || process.env.SUPABASE_CA_CERT_PATH;
  
  let caPath: string | null = null;
  if (customPath) {
    const resolved = path.resolve(process.cwd(), customPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(
        `[DATABASE SSL CONFIG ERROR] Production CA certificate not found at specified path: '${resolved}'.`
      );
    }
    caPath = resolved;
  } else {
    const candidates = [
      path.resolve(process.cwd(), 'certs/prod-supabase-ca.crt'),
      path.resolve(process.cwd(), 'backend/certs/prod-supabase-ca.crt'),
      path.resolve(__dirname, '../../../certs/prod-supabase-ca.crt'),
      path.resolve(__dirname, '../../certs/prod-supabase-ca.crt'),
    ];

    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) {
      throw new Error(
        `[DATABASE SSL CONFIG ERROR] Production CA certificate not found in candidate paths: ${candidates.join(', ')}. ` +
        `Please ensure 'prod-supabase-ca.crt' exists or SUPABASE_CA_CERT_PATH is correctly configured.`
      );
    }
    caPath = found;
  }

  const caCert = fs.readFileSync(caPath, 'utf8');

  return {
    rejectUnauthorized: true,
    ca: caCert,
  };
}

function resolveDatabaseConnectionString(): string {
  if (env.NODE_ENV === 'test') {
    if (process.env.TEST_DATABASE_URL && process.env.TEST_DATABASE_URL.trim()) {
      return validateTestDatabaseUrl(process.env.TEST_DATABASE_URL);
    }
    // In unit/smoke test mode without TEST_DATABASE_URL, route to test connection dummy URL
    return 'postgresql://codetoknow:secret@127.0.0.1:5432/code_to_know_test';
  }

  if (env.NODE_ENV === 'production') {
    return validateCloudRuntimeDatabaseUrl(env.DATABASE_URL);
  }

  // Development mode
  return validateDevelopmentDatabaseUrl(env.DATABASE_URL);
}

export function createDatabasePool(): pg.Pool {
  const connectionString = resolveDatabaseConnectionString();
  const isProduction = env.NODE_ENV === 'production';

  const poolConfig: pg.PoolConfig = {
    connectionString,
    ...(isProduction ? { ssl: resolveProductionSslConfig() } : {}),
  };

  return new pg.Pool(poolConfig);
}

const pool = createDatabasePool();
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
