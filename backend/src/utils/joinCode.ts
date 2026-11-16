import crypto from 'crypto';

/**
 * 班級邀請碼（Join Code）字元集規範：
 * 排除容易混淆的字元：0 (數字零), O (英文大寫歐), 1 (數字一), I (英文大寫哀), L (英文大寫艾)
 * 有效字元數：31 個字元
 */
export const JOIN_CODE_CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DEFAULT_JOIN_CODE_LENGTH = 8;

/**
 * 產生安全且高辨識度的班級邀請碼
 * 使用 CSPRNG (crypto.randomBytes) 避免偽隨機序列可預測性
 *
 * @param length 邀請碼長度，預設 8 碼
 * @returns 8 位大寫英數字字串
 */
export function generateSecureJoinCode(length: number = DEFAULT_JOIN_CODE_LENGTH): string {
  if (length <= 0) {
    throw new Error('Join code length must be greater than 0');
  }

  const bytes = crypto.randomBytes(length);
  let code = '';
  const charsetLength = JOIN_CODE_CHARSET.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = bytes[i] % charsetLength;
    code += JOIN_CODE_CHARSET[randomIndex];
  }

  return code;
}

/**
 * 正規化前端輸入之班級邀請碼（去除首尾空白、自動轉為大寫）
 *
 * @param input 原始使用者輸入
 * @returns 正規化後的邀請碼
 */
export function normalizeJoinCode(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.trim().toUpperCase();
}

/**
 * 驗證邀請碼格式是否合規
 * 1. 長度必須為 8 碼（或指定長度）
 * 2. 僅能包含 JOIN_CODE_CHARSET 中的字元
 *
 * @param code 待校驗之邀請碼
 * @param length 預期長度，預設 8 碼
 * @returns 布林值
 */
export function validateJoinCodeFormat(code: unknown, length: number = DEFAULT_JOIN_CODE_LENGTH): boolean {
  if (typeof code !== 'string') {
    return false;
  }

  const normalized = normalizeJoinCode(code);
  if (normalized.length !== length) {
    return false;
  }

  const regex = new RegExp(`^[${JOIN_CODE_CHARSET}]{${length}}$`);
  return regex.test(normalized);
}
