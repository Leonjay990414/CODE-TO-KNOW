/**
 * CODE TO KNOW (碼上學) — 前端資料庫介接契約與型別規格書
 * Document: DATABASE_CONTRACTS (Pre-Database Implementation)
 * 供未來正式資料庫建置完成後，前端 API Service 與各層頁面串接之統一契約。
 */

// ==========================================
// 1. 通用 API 回應與分頁契約 (Universal Envelopes)
// ==========================================

export interface ApiSuccessEnvelope<T = unknown> {
  success: true;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp?: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  timestamp: string;
}

export type ApiResponseContract<T = unknown> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortingParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchFilterParams extends PaginationParams, SortingParams {
  query?: string;
  category?: string;
  status?: string;
}

/**
 * 前端資料視圖狀態機 (Data View State Machine)
 * 規範所有資料串接元件必須妥善處理之 5 大狀態
 */
export type DataViewState = 'loading' | 'empty' | 'ready' | 'error' | 'forbidden';

// ==========================================
// 2. Layer 1：使用者帳號與個人檔案契約 (Auth & Profile)
// ==========================================

export type UserRoleType = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'SYSTEM_OPERATOR';

export interface DatabaseUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  status: 'ACTIVE' | 'PENDING_VERIFY' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  roles: UserRoleType[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfileData {
  userId: string;
  nickname?: string;
  targetCertId?: string;
  targetExamDate?: string;
  dailyGoalMinutes?: number;
  schoolName?: string;
  grade?: string;
}

// ==========================================
// 3. Layer 2：學生學習與題庫測驗契約 (Student Learning)
// ==========================================

export interface DatabaseCertification {
  id: string;
  code: string;
  name: string;
  englishName?: string | null;
  category: 'web' | 'software' | 'algorithm' | 'application';
  level: 'C' | 'B' | 'A' | 'SPECIAL';
  passingScore: number;
  timeLimitMinutes: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'ARCHIVED';
}

export interface DatabaseQuestionOption {
  id: string;
  questionId: string;
  optionKey: string;
  optionText: string;
  isCorrect?: boolean; // 在學生作答時後端通常遮蔽，交卷後始回傳
}

export interface DatabaseQuestion {
  id: string;
  subjectId: string;
  questionNumber: number;
  questionText: string;
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  explanation?: string | null;
  sourceRef?: string | null;
  options: DatabaseQuestionOption[];
}

export interface ExamAttemptSummary {
  id: string;
  userId: string;
  certId: string;
  mode: 'MOCK_EXAM' | 'PRACTICE' | 'ASSIGNED_HOMEWORK';
  score?: number | null;
  isPassed?: boolean | null;
  totalQuestions: number;
  correctQuestions: number;
  startedAt: string;
  submittedAt?: string | null;
  durationSeconds?: number | null;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMEOUT' | 'ABANDONED';
}

export interface StudentProgressSummary {
  overallProgressPercent: number;
  totalPracticedQuestions: number;
  totalQuestionBank: number;
  mockExamAverageScore: number;
  estimatedPassProbability: 'LOW' | 'MEDIUM' | 'HIGH';
  weakSubjectAreas: {
    subjectCode: string;
    subjectName: string;
    accuracyRate: number;
  }[];
}

export interface WrongQuestionItem {
  id: string;
  questionId: string;
  questionText: string;
  failCount: number;
  lastFailedAt: string;
  isMastered: boolean;
  correctAnswer: string;
  explanation?: string | null;
}

export interface BookmarkItem {
  id: string;
  questionId: string;
  questionText: string;
  createdAt: string;
  tag?: string;
}

export interface LearningNoteItem {
  id: string;
  questionId?: string;
  taskId?: string;
  content: string;
  updatedAt: string;
}

// ==========================================
// 4. Layer 3：教師教學與班級名冊契約 (Teacher Platform)
// ==========================================

export interface TeacherClassSummary {
  classId: string;
  name: string;
  code: string;
  inviteCode: string;
  schoolYear: string;
  studentCount: number;
  roleInClass: 'HEAD_TEACHER' | 'SUBJECT_TEACHER' | 'TEACHING_ASSISTANT';
  activeAssignedExamsCount: number;
  createdAt: string;
}

export interface ClassStudentItem {
  studentId: string;
  seatNumber?: number | null;
  displayName: string;
  maskedEmail: string;
  progressPercent: number;
  latestMockScore?: number | null;
  riskStatus: 'SAFE' | 'WARNING' | 'DANGER';
  lastActiveAt: string;
}

export interface TeacherAssignedExam {
  id: string;
  classId: string;
  certId: string;
  title: string;
  dueAt: string;
  maxAttempts: number;
  passingScore: number;
  submittedCount: number;
  totalStudents: number;
}

// ==========================================
// 5. Layer 4：平台管理審核契約 (Platform Administration)
// ==========================================

export interface AdminTeacherApplication {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  schoolName: string;
  subject: string;
  reason: string;
  proofUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
}

export interface AdminAuditLogItem {
  id: string;
  operatorId?: string | null;
  operatorName?: string | null;
  targetType: string;
  targetId: string;
  action: string;
  ipAddress: string;
  createdAt: string;
}

// ==========================================
// 6. Layer 5：系統營運與監控契約 (Operations Telemetry)
// ==========================================

export interface SystemHealthMetrics {
  status: 'healthy' | 'degraded';
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number | null;
  };
  memoryUsageMb?: number;
}

export interface AIUsageSummary {
  totalCalls: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostUsd: number;
  averageLatencyMs: number;
}

// ==========================================
// 7. 跨層服務：公告、通知與郵件傳遞契約 (Announcements & Notifications)
// ==========================================

export type AnnouncementCategory = 'PLATFORM' | 'EDUCATIONAL';

export type PlatformAnnouncementType =
  | 'FEATURE_UPDATE'
  | 'NEW_CERTIFICATION'
  | 'NEW_FEATURE'
  | 'PLATFORM_EVENT'
  | 'PLATFORM_POLICY'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_INCIDENT'
  | 'RELEASE_NOTE';

export type EducationalAnnouncementType =
  | 'CLASS'
  | 'PERSONAL'
  | 'EXAM'
  | 'ASSIGNMENT'
  | 'LEARNING_SHARE'
  | 'DISCUSSION';

export type AnnouncementType = PlatformAnnouncementType | EducationalAnnouncementType;

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type AnnouncementStatus = 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'WITHDRAWN' | 'ARCHIVED';

export type AnnouncementTargetType = 'ALL' | 'ROLE' | 'CLASS' | 'USER';

export interface AnnouncementAttachmentContract {
  id: string;
  announcementId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface AnnouncementContract {
  id: string;
  category: AnnouncementCategory;
  type: AnnouncementType;
  title: string;
  summary?: string | null;
  content: string;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  authorId: string;
  authorName?: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  isPinned: boolean;
  pinnedUntil?: string | null;
  sendEmail: boolean;
  viewCount: number;
  isRead?: boolean;
  attachments?: AnnouncementAttachmentContract[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementTargetContract {
  id: string;
  announcementId: string;
  targetType: AnnouncementTargetType;
  targetValue: string;
}

export interface AnnouncementReadContract {
  id: string;
  announcementId: string;
  userId: string;
  firstReadAt: string;
  lastReadAt: string;
}

export interface NotificationContract {
  id: string;
  userId: string;
  type: 'ANNOUNCEMENT' | 'EXAM_ASSIGNED' | 'EXAM_GRADED' | 'SYSTEM';
  title: string;
  message: string;
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface EmailQueueStatusContract {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  templateKey: string;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  retryCount: number;
  lastError?: string | null;
  scheduledAt: string;
  processedAt?: string | null;
  createdAt: string;
}
