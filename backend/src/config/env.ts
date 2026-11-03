import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().default('postgresql://codetoknow:codetoknow_secret@127.0.0.1:5432/code_to_know?schema=public'),
  SESSION_SECRET: z.string().min(16).default('dev-insecure-session-secret-must-be-changed-in-production-min32'),
  COOKIE_SECRET: z.string().min(16).default('dev-insecure-cookie-secret-must-be-changed-in-production-min32'),
  JWT_SECRET: z.string().min(16).default('dev-insecure-jwt-secret-must-be-changed-in-production-min32'),
  BCRYPT_ROUNDS: z.string().default('12').transform((val) => parseInt(val, 10)),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),
  EMAIL_FROM: z.string().default('noreply@codetoknow.edu'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
