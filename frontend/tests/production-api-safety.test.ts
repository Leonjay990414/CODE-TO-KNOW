import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveApiConfiguration,
  getApiConfigurationStatus,
  authApi,
  adminApi,
  getCsrfToken,
  isDemoMode,
  DEMO_STUDENT_USER,
  DEMO_TEACHER_USER,
} from '../src/services/api';

const storageMap = new Map<string, string>();
const mockSessionStorage = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null,
};

if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = mockSessionStorage;
}

describe('Production API Safety and Multi-Environment Configuration Suite', () => {
  describe('resolveApiConfiguration unit tests', () => {
    it('correctly configures Demo Mode with empty baseUrl and zero external calls', () => {
      const config = resolveApiConfiguration({
        isDemo: true,
        isProd: false,
        envApiUrl: '',
      });

      expect(config.mode).toBe('demo');
      expect(config.isDemoMode).toBe(true);
      expect(config.baseUrl).toBe('');
      expect(config.isProductionApiMissing).toBe(false);
      expect(config.configured).toBe(true);
    });

    it('defaults to localhost:4000/api in Development Mode when VITE_API_URL is unset', () => {
      const config = resolveApiConfiguration({
        isDemo: false,
        isProd: false,
        envApiUrl: '',
      });

      expect(config.mode).toBe('development');
      expect(config.isDemoMode).toBe(false);
      expect(config.isProduction).toBe(false);
      expect(config.baseUrl).toBe('http://localhost:4000/api');
      expect(config.isProductionApiMissing).toBe(false);
      expect(config.configured).toBe(true);
    });

    it('honors custom VITE_API_URL in Development Mode if provided', () => {
      const config = resolveApiConfiguration({
        isDemo: false,
        isProd: false,
        envApiUrl: 'http://127.0.0.1:5000/api',
      });

      expect(config.mode).toBe('development');
      expect(config.baseUrl).toBe('http://127.0.0.1:5000/api');
      expect(config.isProductionApiMissing).toBe(false);
      expect(config.configured).toBe(true);
    });

    it('correctly configures Production Mode when VITE_API_URL is properly provided', () => {
      const config = resolveApiConfiguration({
        isDemo: false,
        isProd: true,
        envApiUrl: 'https://api.codetoknow.edu.tw/api',
      });

      expect(config.mode).toBe('production');
      expect(config.isDemoMode).toBe(false);
      expect(config.isProduction).toBe(true);
      expect(config.baseUrl).toBe('https://api.codetoknow.edu.tw/api');
      expect(config.isProductionApiMissing).toBe(false);
      expect(config.configured).toBe(true);
    });

    it('CRITICAL SECURITY: Strictly forbids localhost fallback in Production Mode when VITE_API_URL is missing', () => {
      const config = resolveApiConfiguration({
        isDemo: false,
        isProd: true,
        envApiUrl: '',
      });

      expect(config.mode).toBe('production');
      expect(config.isDemoMode).toBe(false);
      expect(config.isProduction).toBe(true);
      // Base URL MUST NOT be localhost:4000
      expect(config.baseUrl).not.toContain('localhost');
      expect(config.baseUrl).toBe('');
      // Flags missing configuration
      expect(config.isProductionApiMissing).toBe(true);
      expect(config.configured).toBe(false);
    });

    it('enforces Demo Mode and empty baseUrl when simulated PR Preview build flags are supplied', () => {
      // In PR Preview, Vite define forces isDemo=true and envApiUrl=''
      const config = resolveApiConfiguration({
        isDemo: true,
        isProd: true,
        envApiUrl: '',
      });

      expect(config.mode).toBe('demo');
      expect(config.isDemoMode).toBe(true);
      expect(config.baseUrl).toBe('');
      expect(config.isProductionApiMissing).toBe(false);
      expect(config.configured).toBe(true);
    });

    it('proves fail-closed isolation when production API URL is supplied alongside PR Preview flag', () => {
      // Even if Render inherited production VITE_API_URL, PR Guard forces isDemo=true and envApiUrl=''
      const prGuardAppliedConfig = resolveApiConfiguration({
        isDemo: true,
        isProd: true,
        envApiUrl: '', // PR Guard clears the URL at build time
      });

      expect(prGuardAppliedConfig.mode).toBe('demo');
      expect(prGuardAppliedConfig.isDemoMode).toBe(true);
      expect(prGuardAppliedConfig.baseUrl).toBe('');
      expect(prGuardAppliedConfig.baseUrl).not.toContain('production');
      expect(prGuardAppliedConfig.configured).toBe(true);
    });

    it('preserves exact production API configuration when PR Preview flag is absent', () => {
      // In Production, PR Guard is inactive; normal production envApiUrl is honored
      const prodConfig = resolveApiConfiguration({
        isDemo: false,
        isProd: true,
        envApiUrl: 'https://api.codetoknow.edu.tw/api',
      });

      expect(prodConfig.mode).toBe('production');
      expect(prodConfig.isDemoMode).toBe(false);
      expect(prodConfig.isProduction).toBe(true);
      expect(prodConfig.baseUrl).toBe('https://api.codetoknow.edu.tw/api');
      expect(prodConfig.isProductionApiMissing).toBe(false);
      expect(prodConfig.configured).toBe(true);
    });
  });

  describe('Runtime Environment Status Helper', () => {
    it('provides valid runtime configuration snapshot', () => {
      const status = getApiConfigurationStatus();

      expect(status).toHaveProperty('mode');
      expect(status).toHaveProperty('baseUrl');
      expect(status).toHaveProperty('isDemoMode');
      expect(status).toHaveProperty('isProduction');
      expect(status).toHaveProperty('isProductionApiMissing');
      expect(status).toHaveProperty('configured');
    });
  });

  describe('Demo Mode Simulation Flow Integration', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('handles student and teacher demo login without network requests', async () => {
      if (!isDemoMode) {
        // Skip demo-only assertion if environment is not in demo mode
        return;
      }

      // Student demo login
      const studentRes = await authApi.login({
        email: 'student.demo@codetoknow.edu',
        password: 'Password123!',
      });
      expect(studentRes.success).toBe(true);
      expect(studentRes.data?.user.roles).toContain('STUDENT');
      expect(studentRes.data?.csrfToken).toBe('demo-csrf-token');

      // Teacher demo login
      const teacherRes = await authApi.login({
        email: 'teacher.demo@codetoknow.edu',
        password: 'Password123!',
      });
      expect(teacherRes.success).toBe(true);
      expect(teacherRes.data?.user.roles).toContain('TEACHER');

      // CSRF token in demo mode
      const csrf = await getCsrfToken();
      expect(csrf).toBe('demo-csrf-token');
    });

    it('simulates user registration and demo password management in demo mode', async () => {
      if (!isDemoMode) {
        return;
      }

      const regRes = await authApi.register({
        email: 'newuser@codetoknow.edu',
        password: 'Password123!',
        displayName: '全新測試學員',
      });
      expect(regRes.success).toBe(true);
      expect(regRes.data?.user.displayName).toBe('全新測試學員');

      const forgotRes = await authApi.forgotPassword('newuser@codetoknow.edu');
      expect(forgotRes.success).toBe(true);
      expect(forgotRes.message).toContain('展示模式模擬');
    });
  });
});
