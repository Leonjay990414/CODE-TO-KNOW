import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '../src/middleware/csrf.js';

describe('API Endpoints & Middleware', () => {
  const app = createApp();

  describe('Health Check Endpoint', () => {
    it('GET /api/health probes database and returns actual system status', async () => {
      const res = await request(app).get('/api/health');

      expect([200, 503]).toContain(res.status);
      expect(['healthy', 'degraded']).toContain(res.body.status);
      expect(res.body.service).toBe('CODE TO KNOW API');
      expect(res.body.timestamp).toBeDefined();
      expect(res.body.database).toBeDefined();
      expect(['connected', 'disconnected']).toContain(res.body.database.status);
    });
  });

  describe('CSRF Protection', () => {
    it('GET /api/auth/csrf-token issues an XSRF-TOKEN cookie and returns token in JSON', async () => {
      const res = await request(app).get('/api/auth/csrf-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.csrfToken).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.includes(CSRF_COOKIE_NAME))).toBe(true);
    });

    it('rejects mutating POST requests without CSRF token with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
    });

    it('allows mutating requests when matching CSRF cookie and header are supplied', async () => {
      // 1. Get token
      const tokenRes = await request(app).get('/api/auth/csrf-token');
      const token = tokenRes.body.data.csrfToken;
      const setCookie = tokenRes.headers['set-cookie'];

      // 2. Perform POST with cookie and matching header (intentionally invalid credentials to test past CSRF)
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', setCookie)
        .set(CSRF_HEADER_NAME, token)
        .send({ email: 'invalid_user@example.com', password: 'Password123' });

      // Should bypass CSRF check and proceed to auth logic (returns 401 or 500 depending on DB, not 403 CSRF)
      expect(res.status).not.toBe(403);
      if (res.body.error) {
        expect(res.body.error.code).not.toBe('CSRF_VALIDATION_FAILED');
      }
    });
  });

  describe('404 Not Found Handler', () => {
    it('returns 404 with standardized error JSON for non-existent routes', async () => {
      const res = await request(app).get('/api/non-existent-route');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
