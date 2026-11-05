/**
 * CODE TO KNOW (碼上學) Frontend API Client
 * Configured with HTTP-only session cookies and CSRF protection.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
  login: (data: { email: string; password: string }) =>
    request<{ user: User; csrfToken: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { email: string; password: string; displayName: string }) =>
    request<{ user: User; message: string; verificationToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me', {
      method: 'GET',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const teacherApi = {
  submitApplication: (data: { schoolName: string; subject: string; reason: string; proofUrl?: string }) =>
    request<{ application: TeacherApplication; message: string }>('/teachers/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyApplication: () =>
    request<{ application: TeacherApplication | null }>('/teachers/my-application', {
      method: 'GET',
    }),
};
