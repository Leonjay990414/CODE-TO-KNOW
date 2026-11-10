/**
 * CODE TO KNOW (碼上學) Frontend API Client
 * Configured with HTTP-only session cookies and CSRF protection.
 * Supports static GitHub Pages Preview Demo Mode via VITE_DEMO_MODE=true.
 */

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

const API_BASE_URL = isDemoMode
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');

export const DEMO_STORAGE_KEY = 'ctk_demo_user';
export const DEMO_TEACHER_APP_STORAGE_KEY = 'ctk_demo_teacher_app';

export const DEMO_STUDENT_USER: User = {
  id: 'demo-student',
  email: 'student.demo@codetoknow.edu',
  displayName: '訪客示範學員',
  roles: ['STUDENT'],
  status: 'ACTIVE',
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
};

export const DEMO_TEACHER_USER: User = {
  id: 'demo-teacher',
  email: 'teacher.demo@codetoknow.edu',
  displayName: '示範認證教師',
  roles: ['TEACHER'],
  status: 'ACTIVE',
  emailVerifiedAt: '2026-01-01T00:00:00.000Z',
};

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  avatarUrl?: string | null;
  status?: string;
  emailVerifiedAt?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

let cachedCsrfToken: string | null = null;

/**
 * Fetch and refresh the CSRF token from backend
 */
export async function getCsrfToken(): Promise<string> {
  if (isDemoMode) {
    return 'demo-csrf-token';
  }

  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  // Also check if cookie already contains XSRF-TOKEN
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  if (match) {
    cachedCsrfToken = decodeURIComponent(match[1]);
    return cachedCsrfToken;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    });
    const data: ApiResponse<{ csrfToken: string }> = await res.json();
    if (data.success && data.data?.csrfToken) {
      cachedCsrfToken = data.data.csrfToken;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err);
  }

  return '';
}

/**
 * Core HTTP Request Wrapper
 */
async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (isDemoMode) {
    return {
      success: false,
      error: {
        code: 'DEMO_MODE_NOTICE',
        message: '展示模式已啟用，所有操作皆為前端純靜態模擬，不發送外部網路請求。',
      },
    };
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // For mutating HTTP requests, attach CSRF token header
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Transmit session cookie
    });

    const body: ApiResponse<T> = await response.json();

    // If CSRF error occurred, invalidate cache
    if (!response.ok && body.error?.code === 'CSRF_VALIDATION_FAILED') {
      cachedCsrfToken = null;
    }

    // Keep token refreshed if returned in data
    if (body.data && typeof body.data === 'object' && 'csrfToken' in body.data) {
      cachedCsrfToken = (body.data as { csrfToken: string }).csrfToken;
    }

    return body;
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: '無法連線至伺服器，請檢查網路連線或後端服務狀態',
        details: error,
      },
    };
  }
}

export interface TeacherApplication {
  id: string;
  userId: string;
  schoolName: string;
  subject: string;
  reason: string;
  proofUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    if (isDemoMode) {
      const isTeacher = data.email.toLowerCase().includes('teacher');
      const demoUser: User = isTeacher
        ? { ...DEMO_TEACHER_USER, email: data.email || DEMO_TEACHER_USER.email }
        : { ...DEMO_STUDENT_USER, email: data.email || DEMO_STUDENT_USER.email };
      try {
        sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      } catch {
        // Ignore sessionStorage quota error
      }
      return {
        success: true,
        data: {
          user: demoUser,
          csrfToken: 'demo-csrf-token',
          message: '展示模式模擬登入成功',
        },
      };
    }

    return request<{ user: User; csrfToken: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  register: async (data: { email: string; password: string; displayName: string }) => {
    if (isDemoMode) {
      const demoUser: User = {
        id: 'demo-registered-' + Date.now(),
        email: data.email,
        displayName: data.displayName || '訪客示範學員',
        roles: ['STUDENT'],
        status: 'ACTIVE',
        emailVerifiedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
      } catch {
        // Ignore sessionStorage quota error
      }
      return {
        success: true,
        message: '展示模式模擬註冊成功（展示版不儲存真實帳號資料）',
        data: {
          user: demoUser,
          message: '展示模式模擬註冊成功',
        },
      };
    }

    return request<{ user: User; message: string; verificationToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async () => {
    if (isDemoMode) {
      try {
        sessionStorage.removeItem(DEMO_STORAGE_KEY);
      } catch {
        // Ignore sessionStorage error
      }
      return {
        success: true,
        data: {
          message: '展示模式已登出',
        },
      };
    }

    return request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async () => {
    if (isDemoMode) {
      try {
        const stored = sessionStorage.getItem(DEMO_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          return {
            success: true,
            data: { user: parsed },
          };
        }
      } catch {
        // Ignore sessionStorage error
      }
      return {
        success: true,
        data: { user: null as unknown as User },
      };
    }

    return request<{ user: User }>('/auth/me', {
      method: 'GET',
    });
  },

  forgotPassword: async (email: string) => {
    if (isDemoMode) {
      return {
        success: true,
        message: '【展示模式模擬】已模擬寄出密碼重設信（展示環境不發送真實郵件）。',
      };
    }

    return request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (data: { token: string; newPassword: string }) => {
    if (isDemoMode) {
      return {
        success: true,
        message: '【展示模式模擬】密碼重設模擬成功。',
      };
    }

    return request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const teacherApi = {
  submitApplication: async (data: { schoolName: string; subject: string; reason: string; proofUrl?: string }) => {
    if (isDemoMode) {
      const mockApp: TeacherApplication = {
        id: 'demo-app-' + Date.now(),
        userId: 'demo-user-id',
        schoolName: data.schoolName,
        subject: data.subject,
        reason: data.reason,
        proofUrl: data.proofUrl || null,
        status: 'PENDING',
        reviewNote: '【展示模式】申請資料已模擬記錄，管理員審核模擬中。',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(DEMO_TEACHER_APP_STORAGE_KEY, JSON.stringify(mockApp));
      } catch {
        // Ignore sessionStorage error
      }
      return {
        success: true,
        data: {
          application: mockApp,
          message: '教育者資格申請已成功送出！（展示模式模擬）',
        },
      };
    }

    return request<{ application: TeacherApplication; message: string }>('/teachers/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyApplication: async () => {
    if (isDemoMode) {
      try {
        const stored = sessionStorage.getItem(DEMO_TEACHER_APP_STORAGE_KEY);
        if (stored) {
          const app = JSON.parse(stored) as TeacherApplication;
          return {
            success: true,
            data: { application: app },
          };
        }
      } catch {
        // Ignore sessionStorage error
      }
      return {
        success: true,
        data: { application: null },
      };
    }

    return request<{ application: TeacherApplication | null }>('/teachers/my-application', {
      method: 'GET',
    });
  },
};

