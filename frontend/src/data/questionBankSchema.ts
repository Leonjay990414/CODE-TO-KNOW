/**
 * CODE TO KNOW (碼上學) - 官方證照題庫資料匯入與結構化規格
 * 依據專案「官方證照題庫 PDF 蒐集與 AI 解析規範」建構。
 * 支援多證照模組化、嚴格來源鑑別、法規授權控管與審核狀態。
 */

export type QuestionSourceType =
  | 'official_verified'       // 官方題目（由官方公布之公開題庫經核對解析）
  | 'official_curated'        // 官方參考資料整理（依官方指引或範例題整理）
  | 'ai_practice'             // AI 練習題（由 AI 依據官方考綱產生，嚴格禁止標為官方）
  | 'pending_verification';   // 待人工確認（解析存在歧義或待專家審查）

export type VerificationStatus =
  | 'official_verified'       // 官方標準答案已確認
  | 'pending_verification'   // 答案或解析待人工核實
  | 'needs_review';           // 存在異議或版本變更需重新審核

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

/**
 * 學科題目統一資料結構
 */
export interface StructuredQuestion {
  certificationId: string;    // 例如 'web-design-c', 'software-design-c', 'apcs-test', 'its-python'
  subjectId: string;          // 例如 '17300-theory', '11900-theory', 'apcs-reading'
  examType: 'theory';         // 學科測驗
  questionId: string;         // 全域唯一 ID，例如 'q17300-3A-024'
  officialNumber?: number;    // 官方題號
  question: string;           // 題目內容
  options: QuestionOption[];  // 四個選項 A, B, C, D
  answer: 'A' | 'B' | 'C' | 'D'; // 正確答案
  explanation: string;        // 詳盡解析
  topic: string;              // 考科工作項目或領域主題
  difficulty: 'easy' | 'medium' | 'hard';
  sourceName: string;         // 來源名稱（例如「勞動部技能檢定中心 173003A17」）
  sourceUrl: string;          // 來源官方網址或查詢系統路徑
  sourceVersion: string;      // 適用版本（例如「113/114 年現行版」）
  sourcePage: number;         // 原始 PDF 出處頁碼
  verificationStatus: VerificationStatus; // 審核狀態
  sourceType: QuestionSourceType;         // 來源標籤
  codeSnippet?: string;       // 程式碼片段（若題目包含）
  imageUri?: string;          // 關聯圖片 URI（若題目包含圖表）
}

/**
 * 術科實作題目統一資料結構
 */
export interface StructuredPracticalTask {
  certificationId: string;
  taskId: string | number;
  taskCode: string;           // 官方題號，例如 '17300-104301' 或 '11900-940301'
  title: string;              // 題組名稱
  theme: string;              // 核心主題
  difficulty: '★☆☆' | '★★☆' | '★★★';
  estimatedMinutes: number;   // 官方測驗建議時限
  taskRequirements: string[]; // 題目官方要求
  operatingSteps: string[];   // 操作步驟指引
  gradingCriteria: string[];  // 評分標準與要點
  disqualificationTraps: string[]; // 0 分致命陷阱
  assetRequirements: string[];     // 所需素材清單
  completionConditions: string[];  // 完成條件檢驗項
  sourceName: string;         // 官方規範出處
  sourceUrl: string;          // 官方網址
  sourceVersion: string;      // 適用版本
  sourcePage: number;         // 原始 PDF 出處頁碼
  verificationStatus: VerificationStatus;
  sourceType: QuestionSourceType;
  defaultHtmlSkeleton?: string;
  defaultCssSkeleton?: string;
}

/**
 * 官方證照來源註冊表結構
 */
export interface OfficialCertificationSource {
  id: string;
  officialCode: string;
  name: string;
  level: string;
  issuingAuthority: string;
  officialPortalUrl: string;
  officialQueryUrl: string;
  acquisitionStatus: 'fully_acquired' | 'partially_acquired' | 'pending_acquisition';
  officialPdfs: {
    filename: string;
    fileRole: 'theory' | 'practical' | 'syllabus' | 'common_subject';
    version: string;
    isDownloaded: boolean;
    pageCountEstimate?: number;
    notes: string;
  }[];
  legalLicenseNotes: string;
  syllabusOverview: string[];
}

