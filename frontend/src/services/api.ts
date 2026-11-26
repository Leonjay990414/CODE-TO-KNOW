/**
 * CODE TO KNOW (碼上學) Frontend API Client
 * Configured with HTTP-only session cookies and CSRF protection.
 * Supports static GitHub Pages Preview Demo Mode via VITE_DEMO_MODE=true.
 */

export interface ApiConfigOptions {
  isDemo?: boolean;
  isProd?: boolean;
  envApiUrl?: string;
}

export function resolveApiConfiguration(options?: ApiConfigOptions) {
  const isDemo = options?.isDemo ?? (import.meta.env.VITE_DEMO_MODE === 'true');
  const isProd = options?.isProd ?? Boolean(import.meta.env.PROD);
  const rawUrl = (options?.envApiUrl ?? import.meta.env.VITE_API_URL ?? '').trim();

  const isMissing = isProd && !isDemo && !rawUrl;
  const baseUrl = isDemo
    ? ''
    : rawUrl
      ? rawUrl
      : isProd
        ? ''
        : 'http://localhost:4000/api';

  const mode = isDemo ? 'demo' : isProd ? 'production' : 'development';

  return {
    mode: mode as 'demo' | 'production' | 'development',
    baseUrl,
    isDemoMode: isDemo,
    isProduction: isProd,
    isProductionApiMissing: isMissing,
    configured: isDemo || (!isMissing && !!baseUrl),
  };
}

const currentConfig = resolveApiConfiguration();

export const isDemoMode = currentConfig.isDemoMode;
export const isProduction = currentConfig.isProduction;
export const isProductionApiMissing = currentConfig.isProductionApiMissing;
export const API_BASE_URL: string = currentConfig.baseUrl;

export function getApiConfigurationStatus() {
  return resolveApiConfiguration();
}

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
const inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();

export function clearApiCache(): void {
  inFlightRequests.clear();
  cachedCsrfToken = null;
}

/**
 * Fetch and refresh the CSRF token from backend
 */
export async function getCsrfToken(): Promise<string> {
  if (isDemoMode) {
    return 'demo-csrf-token';
  }

  if (isProductionApiMissing || !API_BASE_URL) {
    return '';
  }

  if (cachedCsrfToken) {
    return cachedCsrfToken;
  }

  // Also check if cookie already contains XSRF-TOKEN
  const cookieStr = typeof document !== 'undefined' ? document.cookie : '';
  const match = cookieStr.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
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

  if (isProductionApiMissing) {
    return {
      success: false,
      error: {
        code: 'PRODUCTION_API_NOT_CONFIGURED',
        message:
          '正式環境尚未設定後端 API 伺服器位址 (VITE_API_URL)。若為預覽站台，請開啟展示模式 (VITE_DEMO_MODE=true) 或聯絡系統管理員配置 API 端點。',
      },
    };
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  // In-flight request deduplication for idempotent GET requests
  const cacheKey = `${method}:${url}`;
  if (method === 'GET' && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)! as Promise<ApiResponse<T>>;
  }

  const executeRequest = async (): Promise<ApiResponse<T>> => {
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
  };

  const promise = executeRequest();

  if (method === 'GET') {
    inFlightRequests.set(cacheKey, promise);
    promise.finally(() => {
      inFlightRequests.delete(cacheKey);
    });
  }

  return promise;
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
    clearApiCache();
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
    clearApiCache();
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

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  } | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminTeacherApplicationWithUser extends TeacherApplication {
  user?: {
    id: string;
    email: string;
    displayName: string;
    status: string;
    createdAt: string;
  };
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded';
  service: string;
  timestamp: string;
  database: {
    status: string;
    latencyMs: number | null;
  };
}

const DEMO_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'demo-audit-001',
    userId: 'demo-admin-01',
    action: 'TEACHER_APPLICATION_APPROVED',
    details: { applicationId: 'demo-app-101', school: '國立示範高級中學', note: '資格文件審核通過' },
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    user: { id: 'demo-admin-01', email: 'admin@codetoknow.edu', displayName: '平台管理員' },
  },
  {
    id: 'demo-audit-002',
    userId: 'demo-teacher-01',
    action: 'TEACHER_APPLICATION_SUBMITTED',
    details: { school: '市立科技技術中學', subject: '網頁設計' },
    ipAddress: '192.168.1.55',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    user: { id: 'demo-teacher-01', email: 'teacher.wang@school.edu', displayName: '王老師' },
  },
  {
    id: 'demo-audit-003',
    userId: 'demo-student-01',
    action: 'EXAM_SUBMITTED',
    details: { examCode: '17300-MOCK-01', score: 85, durationSeconds: 2400 },
    ipAddress: '192.168.2.14',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    user: { id: 'demo-student-01', email: 'student.lin@school.edu', displayName: '林同學' },
  },
  {
    id: 'demo-audit-004',
    userId: 'demo-user-09',
    action: 'USER_REGISTERED',
    details: { email: 'newbie@school.edu' },
    ipAddress: '192.168.2.88',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    user: { id: 'demo-user-09', email: 'newbie@school.edu', displayName: '新學員' },
  },
];

export const adminApi = {
  listTeacherApplications: async (
    status?: 'PENDING' | 'APPROVED' | 'REJECTED',
    page = 1,
    limit = 20
  ) => {
    if (isDemoMode) {
      let apps: AdminTeacherApplicationWithUser[] = [
        {
          id: 'demo-app-pending-01',
          userId: 'demo-user-01',
          schoolName: '國立示範高級中學',
          subject: '資訊科技 / 網頁設計',
          reason: '高中部實習處資訊課程授課教師，需掌握班級學生 17300 丙級證照模擬考練習歷程。',
          proofUrl: 'https://example.edu.tw/proof/cert-01.pdf',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          user: {
            id: 'demo-user-01',
            email: 'teacher.chang@demo.edu.tw',
            displayName: '張志豪老師',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          },
        },
        {
          id: 'demo-app-approved-02',
          userId: 'demo-user-02',
          schoolName: '市立大安高級工業職業學校',
          subject: '電子商務 / 程式設計',
          reason: '資訊科專任教師，輔導三年級學生考取 17300 網頁設計丙級。',
          proofUrl: null,
          status: 'APPROVED',
          reviewNote: '審核通過，已開通教師教學主控台權限',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          user: {
            id: 'demo-user-02',
            email: 'teacher.chen@taipei.edu.tw',
            displayName: '陳美玲老師',
            status: 'ACTIVE',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
        },
      ];

      if (status) {
        apps = apps.filter((a) => a.status === status);
      }

      return {
        success: true,
        data: {
          applications: apps,
          pagination: {
            page,
            limit,
            total: apps.length,
            totalPages: Math.ceil(apps.length / limit) || 1,
          },
        },
      };
    }

    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);
    queryParams.set('page', String(page));
    queryParams.set('limit', String(limit));

    return request<{
      applications: AdminTeacherApplicationWithUser[];
      pagination: PaginationMeta;
    }>(`/admin/teacher-applications?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  approveTeacherApplication: async (id: string, reviewNote?: string): Promise<ApiResponse<{ application?: TeacherApplication; message: string }>> => {
    if (isDemoMode) {
      return {
        success: true,
        data: {
          message: '【展示模式】教師身分審核已模擬核准，該使用者已獲得 TEACHER 權限',
        },
      };
    }

    return request<{
      application?: TeacherApplication;
      message: string;
    }>(`/admin/teacher-applications/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote }),
    });
  },

  rejectTeacherApplication: async (id: string, reviewNote?: string): Promise<ApiResponse<{ application?: TeacherApplication; message: string }>> => {
    if (isDemoMode) {
      return {
        success: true,
        data: {
          message: '【展示模式】教師身分審核已模擬退回',
        },
      };
    }

    return request<{
      application?: TeacherApplication;
      message: string;
    }>(`/admin/teacher-applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reviewNote }),
    });
  },

  listAuditLogs: async (page = 1, limit = 50) => {
    if (isDemoMode) {
      return {
        success: true,
        data: {
          logs: DEMO_AUDIT_LOGS,
          pagination: {
            page,
            limit,
            total: DEMO_AUDIT_LOGS.length,
            totalPages: 1,
          },
        },
      };
    }

    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    return request<{
      logs: AuditLogEntry[];
      pagination: PaginationMeta;
    }>(`/admin/audit-logs?${queryParams.toString()}`, {
      method: 'GET',
    });
  },

  getHealth: async () => {
    if (isDemoMode) {
      return {
        success: true,
        data: {
          status: 'healthy' as const,
          service: 'CODE TO KNOW API (GitHub Pages Preview)',
          timestamp: new Date().toISOString(),
          database: {
            status: 'connected',
            latencyMs: 8,
          },
        },
      };
    }

    if (isProductionApiMissing || !API_BASE_URL) {
      return {
        success: false,
        error: {
          code: 'PRODUCTION_API_NOT_CONFIGURED',
          message: '正式環境尚未設定後端 API 伺服器位址，無法執行系統健康檢查',
        },
      };
    }

    try {
      const healthEndpoint = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.slice(0, -4)}/api/health`
        : `${API_BASE_URL}/health`;
      const res = await fetch(healthEndpoint, {
        method: 'GET',
      });
      const data: SystemHealthData = await res.json();
      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: '無法連線至後端健康檢查端點',
          details: err,
        },
      };
    }
  },

  getOverview: async () => {
    return request<PlatformOverviewResponse>('/admin/overview', {
      method: 'GET',
    });
  },

  listUsers: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.role) queryParams.set('role', params.role);
    if (params?.status) queryParams.set('status', params.status);

    const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return request<AdminUsersListResponse>(`/admin/users${queryStr}`, {
      method: 'GET',
    });
  },

  updateUserStatus: async (userId: string, status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED') => {
    return request<{ message: string; data: AdminUserItem }>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  updateUserRole: async (userId: string, role: 'STUDENT' | 'TEACHER' | 'ADMIN', action: 'grant' | 'revoke') => {
    return request<{ message: string; data: AdminUserItem }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, action }),
    });
  },
};

export interface PlatformOverviewResponse {
  users: {
    total: number;
    active: number;
    students: number;
    teachers: number;
    admins: number;
  };
  classrooms: {
    total: number;
    active: number;
  };
  content: {
    officialQuestionsCount: number;
    examAttemptsTaken: number;
    practicalPracticesCount: number;
  };
  governance: {
    pendingTeacherApplications: number;
    totalAuditLogs: number;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  status: string;
  createdAt: string;
  roles: string[];
  activityCounts?: {
    exams: number;
    practicals: number;
    enrolledClasses: number;
  };
}

export interface AdminUsersListResponse {
  users: AdminUserItem[];
  pagination: PaginationMeta;
}

export interface ClassroomItem {
  id: string;
  name: string;
  joinCode: string;
  description?: string | null;
  certificationId: string;
  creatorId: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  memberCount?: number;
  certification?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface EnrolledClassItem {
  enrollmentId: string;
  seatNumber?: string | null;
  joinedAt: string;
  class: ClassroomItem & {
    creator?: {
      id: string;
      displayName: string;
      email: string;
    };
  };
}

export interface ClassroomMemberItem {
  enrollmentId: string;
  studentId: string;
  displayName: string;
  email: string;
  seatNumber?: string | null;
  joinedAt: string;
}

export const DEMO_CLASSROOMS_STORAGE_KEY = 'ctk_demo_classrooms';
export const DEMO_ENROLLMENTS_STORAGE_KEY = 'ctk_demo_enrolled_classrooms';

export const classroomApi = {
  createClassroom: async (data: { name: string; description?: string; certificationId: string }) => {
    if (isDemoMode) {
      const stored = sessionStorage.getItem(DEMO_CLASSROOMS_STORAGE_KEY);
      const classes: ClassroomItem[] = stored ? JSON.parse(stored) : [];
      const newClass: ClassroomItem = {
        id: `demo-class-${Date.now()}`,
        name: data.name,
        description: data.description || null,
        certificationId: data.certificationId,
        creatorId: 'demo-teacher',
        joinCode: '23456789'.slice(0, 8),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        memberCount: 0,
      };
      classes.unshift(newClass);
      sessionStorage.setItem(DEMO_CLASSROOMS_STORAGE_KEY, JSON.stringify(classes));
      return { success: true, data: { classroom: newClass } };
    }
    return request<{ classroom: ClassroomItem }>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getMyTeachingClassrooms: async () => {
    if (isDemoMode) {
      const stored = sessionStorage.getItem(DEMO_CLASSROOMS_STORAGE_KEY);
      const classes: ClassroomItem[] = stored
        ? JSON.parse(stored)
        : [
            {
              id: 'demo-class-1',
              name: '高一資訊科技甲班',
              description: '104300 網頁設計丙級術科輔導',
              certificationId: 'web-design-c',
              creatorId: 'demo-teacher',
              joinCode: '8K9MN2PX',
              status: 'ACTIVE' as const,
              createdAt: '2026-10-01T08:00:00.000Z',
              memberCount: 28,
            },
          ];
      return { success: true, data: { classrooms: classes } };
    }
    return request<{ classrooms: ClassroomItem[] }>('/classrooms/my-teaching', {
      method: 'GET',
    });
  },

  getMyEnrolledClassrooms: async () => {
    if (isDemoMode) {
      const stored = sessionStorage.getItem(DEMO_ENROLLMENTS_STORAGE_KEY);
      const enrolled: EnrolledClassItem[] = stored
        ? JSON.parse(stored)
        : [
            {
              enrollmentId: 'demo-enroll-1',
              seatNumber: '12',
              joinedAt: '2026-10-02T09:00:00.000Z',
              class: {
                id: 'demo-class-1',
                name: '高一資訊科技甲班',
                description: '104300 網頁設計丙級術科輔導',
                certificationId: 'web-design-c',
                creatorId: 'demo-teacher',
                joinCode: '8K9MN2PX',
                status: 'ACTIVE' as const,
                createdAt: '2026-10-01T08:00:00.000Z',
                creator: {
                  id: 'demo-teacher',
                  displayName: '示範認證教師',
                  email: 'teacher.demo@codetoknow.edu',
                },
              },
            },
          ];
      return { success: true, data: { enrolled } };
    }
    return request<{ enrolled: EnrolledClassItem[] }>('/classrooms/my-enrolled', {
      method: 'GET',
    });
  },

  joinClassroom: async (data: { joinCode: string; seatNumber?: string }) => {
    if (isDemoMode) {
      const code = data.joinCode.trim().toUpperCase();
      const stored = sessionStorage.getItem(DEMO_ENROLLMENTS_STORAGE_KEY);
      const enrolled: EnrolledClassItem[] = stored ? JSON.parse(stored) : [];
      const newEnroll: EnrolledClassItem = {
        enrollmentId: `demo-enroll-${Date.now()}`,
        seatNumber: data.seatNumber || null,
        joinedAt: new Date().toISOString(),
        class: {
          id: `demo-class-${code}`,
          name: '高一資訊科技甲班',
          description: '104300 網頁設計丙級術科輔導',
          certificationId: 'web-design-c',
          creatorId: 'demo-teacher',
          joinCode: code,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          creator: {
            id: 'demo-teacher',
            displayName: '示範認證教師',
            email: 'teacher.demo@codetoknow.edu',
          },
        },
      };
      enrolled.unshift(newEnroll);
      sessionStorage.setItem(DEMO_ENROLLMENTS_STORAGE_KEY, JSON.stringify(enrolled));
      return {
        success: true,
        message: '成功加入班級！',
        data: {
          enrollmentId: newEnroll.enrollmentId,
          classId: newEnroll.class.id,
          className: newEnroll.class.name,
          teacherName: '示範認證教師',
          joinedAt: newEnroll.joinedAt,
        },
      };
    }
    return request<{
      enrollmentId: string;
      classId: string;
      className: string;
      teacherName: string;
      joinedAt: string;
    }>('/classrooms/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getClassroomMembers: async (classId: string) => {
    if (isDemoMode) {
      return {
        success: true,
        data: {
          class: {
            id: classId,
            name: '高一資訊科技甲班',
            joinCode: '8K9MN2PX',
            status: 'ACTIVE',
          },
          members: [
            {
              enrollmentId: 'mem-1',
              studentId: 'demo-student',
              displayName: '訪客示範學員',
              email: 'student.demo@codetoknow.edu',
              seatNumber: '12',
              joinedAt: '2026-10-02T09:00:00.000Z',
            },
          ],
        },
      };
    }
    return request<{
      class: { id: string; name: string; joinCode: string; status: string };
      members: ClassroomMemberItem[];
    }>(`/classrooms/${classId}/members`, {
      method: 'GET',
    });
  },

  removeMember: async (classId: string, studentId: string) => {
    if (isDemoMode) {
      return { success: true, message: '已成功將該學員自班級移除' };
    }
    return request<{ success: boolean; message: string }>(`/classrooms/${classId}/members/${studentId}`, {
      method: 'DELETE',
    });
  },

  getClassroomAnalytics: async (classId: string) => {
    return request<ClassroomAnalyticsResponse>(`/classrooms/${classId}/analytics`, {
      method: 'GET',
    });
  },

  getStudentClassroomProgress: async (classId: string, studentId: string) => {
    return request<StudentClassroomProgressResponse>(`/classrooms/${classId}/students/${studentId}/progress`, {
      method: 'GET',
    });
  },
};

export interface ClassroomAnalyticsResponse {
  classId: string;
  className: string;
  certificationName: string;
  totalStudents: number;
  activeStudentsCount: number;
  examStats: {
    totalExamsTaken: number;
    passedExamsCount: number;
    passRate: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
  };
  practicalStats: {
    averageCompletedStepsVA: number;
    averageCompletedStepsVB: number;
    studentsWithPracticalRecords: number;
  };
  wrongQuestionStats: {
    totalUnresolved: number;
    totalMastered: number;
  };
}

export interface StudentClassroomProgressResponse {
  student: {
    id: string;
    email: string;
    displayName: string;
    seatNumber?: string | null;
    joinedAt: string;
  };
  class: {
    id: string;
    name: string;
  };
  exams: {
    totalTaken: number;
    history: Array<{
      id: string;
      paperTitle: string;
      score: number | null;
      isPassed: boolean;
      correctCount: number;
      wrongCount: number;
      submittedAt: string | null;
    }>;
  };
  practicals: Array<{
    taskId: string;
    taskNumber: number;
    taskTitle: string;
    version: string;
    completedStepsCount: number;
    hasSavedCode: boolean;
    lastPracticedAt: string | null;
  }>;
  wrongQuestions: {
    total: number;
    unresolved: number;
  };
}

// ============================================================================
// Question & Certification API
// ============================================================================

export interface QueryQuestionsParams {
  certificationCode?: string;
  subjectCode?: string;
  workItem?: '01' | '02' | '03' | '04';
  questionType?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  search?: string;
  page?: number;
  limit?: number;
  random?: boolean;
}

export interface QuestionOptionItem {
  key: string;
  text: string;
}

export interface ApiQuestionItem {
  id: string;
  officialNumber: number;
  officialSection: '01' | '02' | '03' | '04';
  sectionName: string;
  question: string;
  codeSnippet?: string | null;
  questionType: string;
  difficulty: 'easy' | 'medium' | 'hard';
  correctAnswer: string;
  explanation: string;
  sourceName: string;
  sourceVersion: string;
  options: QuestionOptionItem[];
}

export interface QuestionListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  questions: ApiQuestionItem[];
}

export const questionApi = {
  getCertifications: async () => {
    return request<Array<{
      id: string;
      code: string;
      name: string;
      level: string;
      category: string;
      officialVersion: string;
      subjects: Array<{
        id: string;
        code: string;
        title: string;
        examType: string;
        questionCount: number;
      }>;
    }>>('/certifications', { method: 'GET' });
  },

  getQuestions: async (params?: QueryQuestionsParams) => {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.certificationCode) searchParams.append('certificationCode', params.certificationCode);
      if (params.subjectCode) searchParams.append('subjectCode', params.subjectCode);
      if (params.workItem) searchParams.append('workItem', params.workItem);
      if (params.questionType) searchParams.append('questionType', params.questionType);
      if (params.search) searchParams.append('search', params.search);
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.random !== undefined) searchParams.append('random', String(params.random));
    }
    const queryStr = searchParams.toString();
    const endpoint = `/questions${queryStr ? `?${queryStr}` : ''}`;
    return request<QuestionListResponse>(endpoint, { method: 'GET' });
  },

  getQuestionById: async (id: string) => {
    return request<ApiQuestionItem>(`/questions/${id}`, { method: 'GET' });
  },
};

export interface ApiExamQuestionItem {
  order: number;
  id: string;
  officialNumber: number;
  questionText: string;
  codeSnippet?: string | null;
  questionType: string;
  difficulty: string;
  subject: {
    code: string;
    title: string;
  };
  options: Array<{
    key: string;
    text: string;
  }>;
}

export interface GeneratedExamResponse {
  attemptId: string;
  examPaperId: string;
  paperTitle: string;
  timeLimitMinutes: number;
  totalQuestions: number;
  startedAt: string;
  questions: ApiExamQuestionItem[];
}

export interface ExamSnapshotItem {
  order: number;
  questionId: string;
  questionText: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  userAnswer?: string | null;
  isCorrect: boolean;
  explanation?: string | null;
  scoreObtained: number;
}

export interface ExamSectionBreakdown {
  sectionCode: string;
  sectionTitle: string;
  total: number;
  correct: number;
  percentage: number;
}

export interface ExamSubmitResponse {
  attemptId: string;
  status: string;
  score: number;
  isPassed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  durationSeconds: number;
  submittedAt: string;
  sectionBreakdown: ExamSectionBreakdown[];
  snapshots: ExamSnapshotItem[];
}

export interface WrongQuestionRecordItem {
  id: string;
  questionId: string;
  officialNumber?: number;
  sectionCode: string;
  sectionTitle: string;
  questionText: string;
  codeSnippet?: string | null;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  explanation: string;
  lastUserAnswer: string;
  wrongCount: number;
  consecutiveCorrectCount: number;
  masteryStatus: 'UNRESOLVED' | 'REVIEWING' | 'MASTERED';
  isResolved: boolean;
  firstWrongAt: string;
  lastAttemptAt: string;
  resolvedAt?: string | null;
}

export interface WrongQuestionsListResponse {
  stats: {
    totalRecorded: number;
    unresolvedCount: number;
    reviewingCount: number;
    masteredCount: number;
    bySection: Record<string, { total: number; unresolved: number; mastered: number }>;
  };
  items: WrongQuestionRecordItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PracticeReviewResult {
  recordId: string;
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  consecutiveCorrectCount: number;
  masteryStatus: 'UNRESOLVED' | 'REVIEWING' | 'MASTERED';
  isResolved: boolean;
  resolvedAt?: string | null;
  wrongCount: number;
  lastAttemptAt: string;
}

export const examApi = {
  generateExam: async (data?: {
    mode?: 'official_100' | 'practice_60';
    strategy?: 'stratified' | 'random';
    certificationCode?: string;
  }) => {
    return request<GeneratedExamResponse>('/exams/generate', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  submitExam: async (
    attemptId: string,
    data: { answers: Record<string, string>; durationSeconds?: number }
  ) => {
    return request<ExamSubmitResponse>(`/exams/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getScoreReport: async (attemptId: string) => {
    return request<ExamSubmitResponse>(`/exams/${attemptId}/report`, {
      method: 'GET',
    });
  },

  getHistory: async () => {
    return request<
      Array<{
        id: string;
        paperTitle: string;
        score: number;
        isPassed: boolean;
        correctCount: number;
        wrongCount: number;
        durationSeconds: number;
        submittedAt: string;
      }>
    >('/exams/history', { method: 'GET' });
  },
};

export const wrongQuestionApi = {
  getWrongQuestions: async (params?: {
    status?: string;
    section?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.section) searchParams.append('section', params.section);
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    const queryStr = searchParams.toString();
    return request<WrongQuestionsListResponse>(
      `/wrong-questions${queryStr ? `?${queryStr}` : ''}`,
      { method: 'GET' }
    );
  },

  practiceReview: async (recordId: string, answer: string) => {
    return request<PracticeReviewResult>(`/wrong-questions/${recordId}/practice`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  recordWrongQuestion: async (data: {
    questionId: string;
    selectedAnswer?: string;
    source?: 'THEORY_PRACTICE' | 'MOCK_EXAM' | 'MANUAL';
  }) => {
    return request<WrongQuestionRecordItem>('/wrong-questions/record', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export interface PracticalTaskSummaryItem {
  id: string;
  taskNumber: number;
  taskCode: string;
  title: string;
  theme: string;
  canvasWidth: string;
  estimatedMinutes: number;
  materialPath: string;
  status: string;
  progress: {
    versionA: {
      version: string;
      status: string;
      completedSteps: number;
      totalSteps: number;
      isCompleted: boolean;
      lastPracticedAt?: string | null;
    };
    versionB: {
      version: string;
      status: string;
      completedSteps: number;
      totalSteps: number;
      isCompleted: boolean;
      lastPracticedAt?: string | null;
    };
  };
}

export interface PracticalTaskStepItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  videoUrl?: string | null;
  videoStartSeconds?: number | null;
  pitfallWarning?: string | null;
  isCompleted: boolean;
}

export interface PracticalTaskDetailResponse {
  task: {
    id: string;
    taskNumber: number;
    taskCode: string;
    title: string;
    theme: string;
    canvasWidth: string;
    estimatedMinutes: number;
    materialPath: string;
    defaultHtmlCode: string;
    defaultCssCode: string;
    defaultJsCode: string;
  };
  version: 'VERSION_A' | 'VERSION_B';
  progress: {
    status: string;
    practiceCount: number;
    completedStepsCount: number;
    totalStepsCount: number;
    isCompleted: boolean;
    lastPracticedAt?: string | null;
    savedHtmlCode: string;
    savedCssCode: string;
    savedJsCode: string;
  };
  steps: PracticalTaskStepItem[];
}

export interface PracticalSavedCodeResponse {
  taskId: string;
  taskCode: string;
  version: string;
  hasSavedCode: boolean;
  savedHtmlCode: string;
  savedCssCode: string;
  savedJsCode: string;
  defaultHtmlCode: string;
  defaultCssCode: string;
  defaultJsCode: string;
  lastPracticedAt?: string | null;
}

export interface SavePracticalProgressBody {
  version?: 'VERSION_A' | 'VERSION_B' | 'A' | 'B';
  stepId?: string;
  isStepCompleted?: boolean;
  completedStepNumbers?: number[];
  savedHtmlCode?: string;
  savedCssCode?: string;
  savedJsCode?: string;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface SavePracticalProgressResponse {
  progressId: string;
  taskId: string;
  version: string;
  status: string;
  completedStepsCount: number;
  totalStepsCount: number;
  isCompleted: boolean;
  lastPracticedAt: string;
}

export const practicalApi = {
  getTasks: async () => {
    return request<PracticalTaskSummaryItem[]>('/practical-tasks', { method: 'GET' });
  },

  getTaskDetails: async (taskId: string | number, version?: string) => {
    const query = version ? `?version=${version}` : '';
    return request<PracticalTaskDetailResponse>(`/practical-tasks/${taskId}${query}`, {
      method: 'GET',
    });
  },

  saveProgress: async (taskId: string | number, data: SavePracticalProgressBody) => {
    return request<SavePracticalProgressResponse>(`/practical-tasks/${taskId}/progress`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSavedCode: async (taskId: string | number, version?: string) => {
    const query = version ? `?version=${version}` : '';
    return request<PracticalSavedCodeResponse>(`/practical-tasks/${taskId}/code${query}`, {
      method: 'GET',
    });
  },
};

// ============================================================================
// Student API
// ============================================================================

export interface StudentDashboardResponse {
  student: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    status: string;
    bio?: string | null;
    educationLevel?: string | null;
    roles: string[];
    createdAt: string;
  };
  overview: {
    totalExamsTaken: number;
    passedExamsCount: number;
    averageScore: number | null;
    highestScore: number | null;
    lowestScore: number | null;
    recentScore: number | null;
    recentExamTitle: string | null;
    recentExamDate: string | null;
    wrongQuestionsTotal: number;
    wrongQuestionsUnresolved: number;
    wrongQuestionsMastered: number;
    startedPracticalTasksCount: number;
    totalPracticalStepsCompletedVA: number;
    totalPracticalStepsCompletedVB: number;
    enrolledClassesCount: number;
  };
  examHistory: Array<{
    id: string;
    paperTitle: string;
    score: number | null;
    isPassed: boolean;
    correctCount: number;
    wrongCount: number;
    durationSeconds: number;
    submittedAt: string | null;
  }>;
  wrongStats: {
    total: number;
    unresolved: number;
    reviewing: number;
    mastered: number;
  };
  practicalTasks: Array<{
    taskId: string;
    taskNumber: number;
    taskCode: string;
    title: string;
    versionA: {
      status: string;
      completedSteps: number;
      totalSteps: number;
      hasSavedCode: boolean;
      lastPracticedAt: string | null;
    };
    versionB: {
      status: string;
      completedSteps: number;
      totalSteps: number;
      hasSavedCode: boolean;
      lastPracticedAt: string | null;
    };
  }>;
  enrolledClasses: Array<{
    enrollmentId: string;
    seatNumber?: string | null;
    joinedAt: string;
    class: {
      id: string;
      name: string;
      joinCode: string;
      description?: string | null;
      status: string;
      teacherName: string;
      teacherEmail: string;
      certificationName: string;
    };
  }>;
  recentActivities: Array<{
    type: 'EXAM_SUBMISSION' | 'PRACTICAL_PRACTICE' | 'CLASS_JOINED';
    title: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
}

export interface UpdateStudentProfileBody {
  displayName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface StudyTimeSummaryResponse {
  totalSeconds: number;
  totalHours: number;
  weeklySeconds: number;
  weeklyHours: number;
  byModule: Record<string, number>;
  dailyLogs: Array<{
    date: string;
    seconds: number;
    minutes: number;
  }>;
}

export interface StudyTimeRecordResponse {
  record: {
    id: string;
    studyDate: string;
    moduleType: string;
    durationSeconds: number;
  };
  summary: StudyTimeSummaryResponse;
}

export interface SubjectAnalyticsItem {
  id: string;
  code: string;
  workNumber: string;
  title: string;
  totalQuestions: number;
  completedQuestions: number;
  correctCount: number;
  wrongCount: number;
  accuracyRate: number;
  masteryRate: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED' | string;
  lastStudiedAt: string | null;
}

export interface StudentProgressAnalyticsResponse {
  overview: {
    totalOfficialQuestions: number;
    totalAttempted: number;
    completionRate: number;
    overallAccuracy: number | null;
    totalStudyHours: number;
    weeklyStudyHours: number;
    highestExamScore: number | null;
    recentScore: number | null;
    totalExamsTaken: number;
    passedExamsCount: number;
    practicalTasksCompletedVA: number;
    practicalTasksCompletedVB: number;
  };
  subjects: SubjectAnalyticsItem[];
  studyTime: StudyTimeSummaryResponse;
  wrongStats: {
    total: number;
    unresolved: number;
    reviewing: number;
    mastered: number;
  };
  recommendedFocus: {
    subjectId: string;
    subjectCode: string;
    subjectTitle: string;
    workNumber: string;
    reason: string;
  } | null;
}

export const studentApi = {
  getDashboard: async () => {
    return request<StudentDashboardResponse>('/student/dashboard', {
      method: 'GET',
    });
  },

  updateProfile: async (data: UpdateStudentProfileBody) => {
    return request<{ id: string; email: string; displayName: string; avatarUrl?: string | null }>('/student/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  recordStudyTime: async (data: {
    durationSeconds: number;
    moduleType?: 'THEORY' | 'PRACTICAL' | 'MOCK_EXAM' | 'AI_COACH';
    date?: string;
  }) => {
    return request<StudyTimeRecordResponse>('/student/study-time', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getStudyTime: async () => {
    return request<StudyTimeSummaryResponse>('/student/study-time', {
      method: 'GET',
    });
  },

  getProgressAnalytics: async () => {
    return request<StudentProgressAnalyticsResponse>('/student/progress-analytics', {
      method: 'GET',
    });
  },
};
