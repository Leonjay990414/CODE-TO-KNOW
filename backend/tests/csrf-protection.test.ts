import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import { createApp } from '../src/app.js';
import {
  csrfProtection,
  setCsrfCookie,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '../src/middleware/csrf.js';
import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';

describe('P05-SEC-003: Double Submit Cookie CSRF Defense & Global Protection Suite', () => {
  const app = createApp();
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    (env as any).NODE_ENV = originalNodeEnv;
    vi.restoreAllMocks();
  });

  describe('1. Standard CSRF Token Issuance & Verification on Application Pipeline', () => {
    it('1. GET /api/auth/csrf-token issues an XSRF-TOKEN cookie and returns token in JSON', async () => {
      const res = await request(app).get('/api/auth/csrf-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.csrfToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes(CSRF_COOKIE_NAME))).toBe(true);
    });

    it('2. rejects mutating POST request without CSRF token with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'student@codetoknow.edu', password: 'Password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
      expect(res.body.error.message).toContain('CSRF');
    });

    it('3. allows mutating requests when matching CSRF cookie and header are supplied', async () => {
      // 1. Fetch token
      const tokenRes = await request(app).get('/api/auth/csrf-token');
      const token = tokenRes.body.data.csrfToken;
      const setCookie = tokenRes.headers['set-cookie'];

      // 2. Perform POST with matching cookie and header
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', setCookie)
        .set(CSRF_HEADER_NAME, token)
        .send({ email: 'student@codetoknow.edu', password: 'Password123' });

      // Passes CSRF validation (response is NOT 403 CSRF_VALIDATION_FAILED)
      expect(res.status).not.toBe(403);
      if (res.body?.error) {
        expect(res.body.error.code).not.toBe('CSRF_VALIDATION_FAILED');
      }
    });

    it('4. rejects mutating request when Cookie Token and Header Token do not match (mismatch)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`${CSRF_COOKIE_NAME}=token-alpha-12345`])
        .set(CSRF_HEADER_NAME, 'token-beta-99999')
        .send({ email: 'student@codetoknow.edu', password: 'Password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('5. rejects mutating request when header is present but cookie is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set(CSRF_HEADER_NAME, 'valid-looking-token')
        .send({ email: 'student@codetoknow.edu', password: 'Password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('6. rejects mutating request when cookie is present but header is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`${CSRF_COOKIE_NAME}=token-alpha-12345`])
        .send({ email: 'student@codetoknow.edu', password: 'Password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });
  });

  describe('2. Safe HTTP Methods & Health Check Exemption', () => {
    it('7. GET requests are not blocked by CSRF middleware without token', async () => {
      const res = await request(app).get('/api/auth/csrf-token');
      expect(res.status).toBe(200);
    });

    it('8. HEAD requests are safely permitted without CSRF token', async () => {
      const res = await request(app).head('/api/health');
      expect([200, 503]).toContain(res.status);
    });

    it('9. OPTIONS requests (CORS Preflight) are permitted without CSRF token', async () => {
      const res = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST');

      expect([200, 204]).toContain(res.status);
    });

    it('10. /api/health probes system health normally without CSRF interference', async () => {
      const res = await request(app).get('/api/health');
      expect([200, 503]).toContain(res.status);
      expect(res.body.service).toBe('CODE TO KNOW API');
    });
  });

  describe('3. Production Security & Test Bypass Hardening', () => {
    it('11. Production environment STRICTLY rejects x-skip-csrf header bypass', async () => {
      // Simulate production environment
      (env as any).NODE_ENV = 'production';

      const res = await request(app)
        .post('/api/auth/login')
        .set('x-skip-csrf', 'true')
        .send({ email: 'attacker@example.com', password: 'Password123' });

      // In production, x-skip-csrf must be ignored and request must be rejected with 403
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('12. Test environment allows x-skip-csrf header for trusted isolated testing', async () => {
      (env as any).NODE_ENV = 'test';

      const res = await request(app)
        .post('/api/auth/login')
        .set('x-skip-csrf', 'true')
        .send({ email: 'test@example.com', password: 'Password123' });

      // Bypasses CSRF check in test environment and proceeds to controller/service logic
      expect(res.status).not.toBe(403);
    });
  });

  describe('4. Business Logic Isolation & Response Format Verification', () => {
    it('13. CSRF failure response matches project unified error schema', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: '無效或缺少 CSRF 防護憑證，請重新整理頁面後再試',
        },
      });
    });

    it('14. guarantees underlying business logic is NEVER executed when CSRF validation fails', async () => {
      const testApp = express();
      testApp.use(cookieParser('test-secret'));
      testApp.use(csrfProtection);

      const sensitiveActionSpy = vi.fn();

      testApp.post('/api/sensitive-transfer', (req: Request, res: Response) => {
        sensitiveActionSpy();
        res.status(200).json({ success: true, message: 'Transfer completed' });
      });

      testApp.use(errorHandler);

      const res = await request(testApp)
        .post('/api/sensitive-transfer')
        .send({ amount: 1000000 });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
      // Crucial verification: the handler was never invoked
      expect(sensitiveActionSpy).not.toHaveBeenCalled();
    });
  });
});
