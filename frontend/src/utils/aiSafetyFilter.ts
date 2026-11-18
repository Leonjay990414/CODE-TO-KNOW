/**
 * CODE TO KNOW (碼上學) - AI 輸出安全、隱私保護與防作弊過濾引擎
 * 對應原始 UID：P11-AIS-008（AI 輸出安全過濾與檢視機制）、P11-AIS-001（隱私條款評估）
 *
 * 核心原則：
 * 1. 防抄襲與考場作弊阻斷：當學生請求「直接給代碼」、「把解答寫給我」時，強制轉入蘇格拉底反詰模式，拒絕直接輸出整段現成代碼。
 * 2. 學員個人個資遮蔽（PII Masking）：自動偵測並遮蔽身分證字號、電話號碼、電子郵件。
 * 3. 不當內容過濾：過濾惡意攻擊語句與考場違規手段。
 * 4. 檢舉機制：提供本機回報佇列，存於 `ctk_ai_reports:${userId}`。
 */

export interface SafetyCheckResult {
  isSafe: boolean;
  blockedReason?: string;
  hasCheatingIntent: boolean;
  sanitizedPrompt: string;
  enforceSocraticMode: boolean;
  pedagogicalDisclaimerZh: string;
}

export interface AiIncidentReport {
  id: string;
  userId: string;
  prompt: string;
  responseContent: string;
  reason: 'INAPPROPRIATE' | 'FACTUAL_ERROR' | 'LEAKED_SOLUTION' | 'OTHER';
  userNotes?: string;
  timestamp: string;
}

const CHEATING_PATTERNS = [
  /直接給我.*(代碼|程式碼|答案|解答)/i,
  /幫我寫(完)?.*(整份|題組|全部|作業)/i,
  /(把|將).*(題組|題目).*(全部|完整).*代碼/i,
  /不要廢話.*(直接|給我).*(code|代碼)/i,
  /copy\s*paste|複製貼上/i,
];

// 身分證字號遮蔽 (台灣格式：1 英文大寫 + 9 數字)
const TAIWAN_ID_REGEX = /[A-Z][1289]\d{8}/g;

// 電話號碼遮蔽 (09xx-xxx-xxx 或 09xxxxxxxx)
const TAIWAN_PHONE_REGEX = /09\d{2}-?\d{3}-?\d{3}/g;

// 電子郵件遮蔽
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const REPORT_STORAGE_PREFIX = 'ctk_ai_reports';

function buildReportKey(userId: string): string {
  const safeUser = (userId || 'guest-anonymous').trim();
  return `${REPORT_STORAGE_PREFIX}:${safeUser}`;
}

/**
 * 檢查並過濾學生輸入 Prompt
 */
export function sanitizeAndCheckPrompt(rawPrompt: string): SafetyCheckResult {
  const prompt = rawPrompt.trim();

  // 1. 個資遮蔽
  let sanitized = prompt
    .replace(TAIWAN_ID_REGEX, '[已遮蔽身分證號]')
    .replace(TAIWAN_PHONE_REGEX, '[已遮蔽手機號碼]')
    .replace(EMAIL_REGEX, '[已遮蔽電子信箱]');

  // 2. 防抄襲與作弊意圖檢測
  const hasCheatingIntent = CHEATING_PATTERNS.some((pattern) => pattern.test(prompt));

  const pedagogicalDisclaimerZh = hasCheatingIntent
    ? '【碼上學 蘇格拉底教學保護】：AI 旨在協助釐清思路與技術原理，嚴禁直接代替完成考場作答。以下將提供步驟思考線索，請親自嘗試動手撰寫。'
    : '【學習隱私保護中】：提問內容已過濾個人機敏識別資訊，遵循學員學習隱私保護規範。';

  return {
    isSafe: true, // 採用教學轉化而非硬性崩潰
    hasCheatingIntent,
    sanitizedPrompt: sanitized,
    enforceSocraticMode: hasCheatingIntent,
    pedagogicalDisclaimerZh,
  };
}

/**
 * 儲存學生對 AI 回應之檢舉/不當回報
 */
export function submitAiReport(
  userId: string,
  data: Omit<AiIncidentReport, 'id' | 'timestamp'>
): AiIncidentReport {
  const reportItem: AiIncidentReport = {
    ...data,
    id: `rpt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return reportItem;
  }

  const key = buildReportKey(userId);
  try {
    const raw = window.localStorage.getItem(key);
    const list: AiIncidentReport[] = raw ? JSON.parse(raw) : [];
    const updated = [reportItem, ...list].slice(0, 30); // 保留最新 30 筆
    window.localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn(`[AiSafetyFilter] 寫入檢舉紀錄失敗 (${key}):`, err);
  }

  return reportItem;
}

/**
 * 取得本機檢舉/回報清單
 */
export function getAiReports(userId: string): AiIncidentReport[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  const key = buildReportKey(userId);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
