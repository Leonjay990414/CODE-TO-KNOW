import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  DATABASE_URL: z.string().min(1).default(
    'postgresql://codetoknow:codetoknow_secret@127.0.0.1:5432/code_to_know?schema=public'
  ),

  SESSION_SECRET: z.string().min(16).default(
    'dev-insecure-session-secret-must-be-changed-in-production-min32'
  ),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  FRONTEND_URL: z.string().default('http://localhost:3000'),

  COOKIE_DOMAIN: z.string().optional(),

  EMAIL_FROM: z.string().email().default('noreply@codetoknow.edu'),

  SUPABASE_CA_CERT_PATH: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

const config = parsed.data;

if (config.NODE_ENV === 'production') {
  const requiredVariables = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'CORS_ORIGIN',
    'FRONTEND_URL',
  ];

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim()
  );

  if (missingVariables.length > 0) {
    console.error(
      `Missing required production environment variables: ${missingVariables.join(', ')}`
    );
    process.exit(1);
  }

  if (
    config.SESSION_SECRET.length < 32 ||
    config.SESSION_SECRET.includes('dev-insecure')
  ) {
    console.error('Production SESSION_SECRET must be a secure secret of at least 32 characters.');
    process.exit(1);
  }

  try {
    const databaseUrl = new URL(config.DATABASE_URL);

    if (
      !['postgres:', 'postgresql:'].includes(databaseUrl.protocol) ||
      ['localhost', '127.0.0.1', '::1'].includes(databaseUrl.hostname)
    ) {
      throw new Error('Invalid production database URL');
    }

    for (const [name, value] of [
      ['CORS_ORIGIN', config.CORS_ORIGIN],
      ['FRONTEND_URL', config.FRONTEND_URL],
    ] as const) {
      const url = new URL(value);

      if (url.protocol !== 'https:') {
        throw new Error(`${name} must use HTTPS in production`);
      }

      if (name === 'CORS_ORIGIN' && url.origin !== value) {
        throw new Error('CORS_ORIGIN must contain only an origin, without a path.');
      }
    }
  } catch (error) {
    console.error(
      'Invalid production environment configuration:',
      error instanceof Error ? error.message : 'Unknown configuration error'
    );
    process.exit(1);
  }
}

export const env = config;
