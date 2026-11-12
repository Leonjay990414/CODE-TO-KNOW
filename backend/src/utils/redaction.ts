export const MAX_AUDIT_SANITIZE_DEPTH = 6;
export const MAX_AUDIT_COLLECTION_ITEMS = 100;
export const MAX_AUDIT_STRING_LENGTH = 4096;

export const REDACTION_FALLBACK_JSON = '{"redactionFallback":"[REDACTION_ERROR]"}';

const URL_ENCODED_BOUNDARY_L1 =
  '(?:(?<=^)|(?<=[^a-z0-9_-])|(?<=%(?:20|22|26|27|2b|2c|2f|3a|3b|3d|3f|5b|7b|7c)))';

const URL_ENCODED_BOUNDARY_L2 =
  '(?:(?<=^)|(?<=[^a-z0-9_-])|(?<=%25(?:20|22|26|27|2b|2c|2f|3a|3b|3d|3f|5b|7b|7c)))';

const PLAIN_BOUNDARY = '(?:(?<=^)|(?<=[^a-z0-9_-]))';

function buildInlineSecretKeyBody(encodedPercent = ''): string {
  const sep = encodedPercent ? `(?:[-_]|${encodedPercent}5f|${encodedPercent}2d)` : '(?:[-_]|%5f|%2d)';
  return (
    `(?:[a-z0-9_-]|${encodedPercent ? `${encodedPercent}5f|${encodedPercent}2d` : '%5f|%2d'})*?` +
    '(?:' +
    'pass(?:word|wd|phrase|code)?' +
    '|token' +
    '|secret' +
    `|api${sep}?key` +
    `|private${sep}?key` +
    '|credential' +
    '|cookie' +
    `|session${sep}?(?:token|secret|key|cookie|credential|auth(?:orization)?|data|value)` +
    '|authorization' +
    `|auth${sep}?(?:header|token|secret|key|code|credential)` +
    '|auth' +
    '|pass' +
    ')'
  );
}

const INLINE_SECRET_KEY_BODY_L0 = buildInlineSecretKeyBody('');
const INLINE_SECRET_KEY_BODY_L1 = buildInlineSecretKeyBody('%');
const INLINE_SECRET_KEY_BODY_L2 = buildInlineSecretKeyBody('%25');

export const SENSITIVE_KEY_PATTERN =
  /^(?:pass|auth|session)$|pass(?:word|wd|phrase|code)|(?:^|[-_])pass$|token|secret|api[-_]?key|private[-_]?key|credential|cookie|session[-_]?(?:token|secret|key|cookie|credential|auth(?:orization)?|data|value|hash)|authorization|(?:^|[-_])auth$|auth[-_]?(?:header|token|secret|key|code|credential|cookie)|hash/i;

const DSN_CREDENTIAL_PATTERN =
  /((?:postgres(?:ql)?|rediss?|mysql|mongodb(?:\+srv)?|amqps?|https?):\/\/[^:/?\s/@"'`<>]*:)([^/?@\s"'`<>]+)(@)/gi;

const ENCODED_DSN_CREDENTIAL_L1 =
  /((?:postgres(?:ql)?|rediss?|mysql|mongodb(?:\+srv)?|amqps?|https?)%3A%2F%2F(?:(?!%2F|%3F|%3A|%40)[^/\s:@"'`<>])*%3A)((?:(?!%2F|%3F|%40)[^/\s@"'`<>])+)(%40)/gi;

const ENCODED_DSN_CREDENTIAL_L2 =
  /((?:postgres(?:ql)?|rediss?|mysql|mongodb(?:\+srv)?|amqps?|https?)%253A%252F%252F(?:(?!%252F|%253F|%253A|%2540)[^/\s:@"'`<>])*%253A)((?:(?!%252F|%253F|%2540)[^/\s@"'`<>])+)(%2540)/gi;

const AUTH_SCHEME_PATTERN =
  /(\b(?:Bearer|Basic)(?:\s+|%20|%2520))((?:(?!%2526|%2523|%253B|%26|%23|%3B)[A-Za-z0-9\-._~+/%])+={0,2})/gi;

// Double-encoded (%253D / %253A) query/kv parameters inside nested URLs
const SENSITIVE_KV_ENCODED_L2_PATTERN = new RegExp(
  `${URL_ENCODED_BOUNDARY_L2}(${INLINE_SECRET_KEY_BODY_L2}(?:\\b|(?=%253D|%253A))\\s*(?:%253D|%253A)\\s*)(?!(?:%2522|%2527|["'\\[\\s]))((?:(?!(?:%2526|%2523|%253B|%2520|%26|%23|%3B|[\\s,"'}\\]&#;])).)+)`,
  'gi'
);

// Single-encoded (%3D / %3A) query/kv parameters; stops only at %26/%23/%3B/%20 or raw delimiters
const SENSITIVE_KV_ENCODED_L1_PATTERN = new RegExp(
  `${URL_ENCODED_BOUNDARY_L1}(${INLINE_SECRET_KEY_BODY_L1}(?:\\b|(?=%3D|%3A))\\s*(?:%3D|%3A)\\s*)(?!(?:%22|%27|["'\\[\\s]))((?:(?!(?:%26|%23|%3B|%20|[\\s,"'}\\]&#;])).)+)`,
  'gi'
);

const SENSITIVE_KV_QUOTED_PATTERN = new RegExp(
  `${PLAIN_BOUNDARY}(${INLINE_SECRET_KEY_BODY_L0}\\b\\s*[:=]\\s*)(["'])(?:\\\\.|(?!\\2)[^\\r\\n])*\\2`,
  'gi'
);

// Plain (unencoded `=`/`:`) query/kv parameters: %26/%23/%3B/%20 stay inside the secret value and do NOT terminate early
const SENSITIVE_KV_UNQUOTED_PATTERN = new RegExp(
  `${PLAIN_BOUNDARY}(${INLINE_SECRET_KEY_BODY_L0}(?:\\b|(?=[:=]))\\s*[:=]\\s*)(?!["'\\[\\s])([^\\s,"'}\\]&#;]+)`,
  'gi'
);

let activeSafeErrorDepth = 0;

/**
 * Redacts DSN credentials, Bearer/Basic headers, inline secrets, and query parameters.
 */
export function redactStringSecrets(value: string): string {
  try {
    const redacted = value
      .replace(DSN_CREDENTIAL_PATTERN, '$1[REDACTED]$3')
      .replace(ENCODED_DSN_CREDENTIAL_L2, '$1[REDACTED]$3')
      .replace(ENCODED_DSN_CREDENTIAL_L1, '$1[REDACTED]$3')
      .replace(AUTH_SCHEME_PATTERN, '$1[REDACTED]')
      .replace(SENSITIVE_KV_QUOTED_PATTERN, '$1$2[REDACTED]$2')
      .replace(SENSITIVE_KV_ENCODED_L2_PATTERN, '$1[REDACTED]')
      .replace(SENSITIVE_KV_ENCODED_L1_PATTERN, '$1[REDACTED]')
      .replace(SENSITIVE_KV_UNQUOTED_PATTERN, '$1[REDACTED]');

    if (redacted.length > MAX_AUDIT_STRING_LENGTH) {
      return `${redacted.slice(0, MAX_AUDIT_STRING_LENGTH)}...[TRUNCATED]`;
    }
    return redacted;
  } catch {
    return '[REDACTION_ERROR]';
  }
}

function sanitizeErrorObject(
  value: Error,
  depth: number,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  const sanitizedError: Record<string, unknown> = {
    name: redactStringSecrets(typeof value.name === 'string' && value.name ? value.name : 'Error'),
    message: redactStringSecrets(typeof value.message === 'string' ? value.message : ''),
  };

  if (typeof value.stack === 'string' && value.stack.length > 0) {
    sanitizedError.stack = redactStringSecrets(value.stack);
  }

  const errRecord = value as unknown as Record<string, unknown>;
  if ('code' in errRecord && errRecord.code !== undefined) {
    sanitizedError.code = sanitizeValueInternal(errRecord.code, depth + 1, ancestors);
  }
  if ('cause' in errRecord && errRecord.cause !== undefined) {
    sanitizedError.cause = sanitizeValueInternal(errRecord.cause, depth + 1, ancestors);
  }
  if ('errors' in errRecord && Array.isArray(errRecord.errors)) {
    sanitizedError.errors = sanitizeValueInternal(errRecord.errors, depth + 1, ancestors);
  }

  const rawExtraEntries = Object.entries(errRecord).filter(
    ([key]) =>
      key !== 'name' &&
      key !== 'message' &&
      key !== 'stack' &&
      key !== 'code' &&
      key !== 'cause' &&
      key !== 'errors'
  );
  const limitedEntries = rawExtraEntries.slice(0, MAX_AUDIT_COLLECTION_ITEMS);

  for (const [key, val] of limitedEntries) {
    sanitizedError[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? '[REDACTED]'
      : sanitizeValueInternal(val, depth + 1, ancestors);
  }

  if (rawExtraEntries.length > MAX_AUDIT_COLLECTION_ITEMS) {
    sanitizedError.__truncatedKeys = rawExtraEntries.length - MAX_AUDIT_COLLECTION_ITEMS;
  }

  return sanitizedError;
}

const mapSizeGetter = Object.getOwnPropertyDescriptor(Map.prototype, 'size')?.get;
const setSizeGetter = Object.getOwnPropertyDescriptor(Set.prototype, 'size')?.get;
const urlHrefGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'href')?.get;
const urlProtocolGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'protocol')?.get;
const urlUsernameGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'username')?.get;
const urlPasswordGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'password')?.get;
const urlHostnameGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'hostname')?.get;
const urlPortGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'port')?.get;
const urlPathnameGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'pathname')?.get;
const urlHashGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'hash')?.get;
const urlSearchParamsGetter = Object.getOwnPropertyDescriptor(URL.prototype, 'searchParams')?.get;

function sanitizeMapObject(
  value: Map<unknown, unknown>,
  depth: number,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  if (!mapSizeGetter) {
    throw new Error('Map size getter unavailable');
  }
  const size = Number(mapSizeGetter.call(value));
  const entries: Array<[unknown, unknown]> = [];
  let count = 0;

  for (const [rawKey, rawVal] of Map.prototype.entries.call(value)) {
    if (count >= MAX_AUDIT_COLLECTION_ITEMS) {
      break;
    }
    const safeKey = sanitizeValueInternal(rawKey, depth + 1, ancestors);
    const safeVal =
      typeof rawKey === 'string' && SENSITIVE_KEY_PATTERN.test(rawKey)
        ? '[REDACTED]'
        : sanitizeValueInternal(rawVal, depth + 1, ancestors);
    entries.push([safeKey, safeVal]);
    count++;
  }

  return {
    type: 'Map',
    entries,
    ...(size > MAX_AUDIT_COLLECTION_ITEMS
      ? { truncatedEntries: size - MAX_AUDIT_COLLECTION_ITEMS }
      : {}),
  };
}

function sanitizeSetObject(
  value: Set<unknown>,
  depth: number,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  if (!setSizeGetter) {
    throw new Error('Set size getter unavailable');
  }
  const size = Number(setSizeGetter.call(value));
  const values: unknown[] = [];
  let count = 0;

  for (const item of Set.prototype.values.call(value)) {
    if (count >= MAX_AUDIT_COLLECTION_ITEMS) {
      break;
    }
    values.push(sanitizeValueInternal(item, depth + 1, ancestors));
    count++;
  }

  return {
    type: 'Set',
    values,
    ...(size > MAX_AUDIT_COLLECTION_ITEMS
      ? { truncatedItems: size - MAX_AUDIT_COLLECTION_ITEMS }
      : {}),
  };
}

function sanitizeURLSearchParamsObject(
  value: URLSearchParams,
  depth: number,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  let totalCount = 0;

  for (const [rawKey, rawVal] of URLSearchParams.prototype.entries.call(value)) {
    totalCount++;
    if (totalCount > MAX_AUDIT_COLLECTION_ITEMS) {
      continue;
    }

    const safeKey = redactStringSecrets(rawKey);
    const safeVal = SENSITIVE_KEY_PATTERN.test(rawKey)
      ? '[REDACTED]'
      : sanitizeValueInternal(rawVal, depth + 1, ancestors);

    if (Object.prototype.hasOwnProperty.call(params, safeKey)) {
      const existing = params[safeKey];
      if (Array.isArray(existing)) {
        existing.push(safeVal);
      } else {
        Object.defineProperty(params, safeKey, {
          value: [existing, safeVal],
          enumerable: true,
          writable: true,
          configurable: true,
        });
      }
    } else {
      Object.defineProperty(params, safeKey, {
        value: safeVal,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }

  return {
    type: 'URLSearchParams',
    params,
    ...(totalCount > MAX_AUDIT_COLLECTION_ITEMS
      ? { truncatedParams: totalCount - MAX_AUDIT_COLLECTION_ITEMS }
      : {}),
  };
}

function sanitizeURLObject(
  value: URL,
  depth: number,
  ancestors: WeakSet<object>
): Record<string, unknown> {
  if (
    !urlHrefGetter ||
    !urlProtocolGetter ||
    !urlUsernameGetter ||
    !urlPasswordGetter ||
    !urlHostnameGetter ||
    !urlPortGetter ||
    !urlPathnameGetter ||
    !urlHashGetter ||
    !urlSearchParamsGetter
  ) {
    throw new Error('URL prototype getters unavailable');
  }

  const protocol = String(urlProtocolGetter.call(value));
  const username = String(urlUsernameGetter.call(value));
  const password = String(urlPasswordGetter.call(value));
  const hostname = String(urlHostnameGetter.call(value));
  const port = String(urlPortGetter.call(value));
  const pathname = String(urlPathnameGetter.call(value));
  const hash = String(urlHashGetter.call(value));
  const searchParams = urlSearchParamsGetter.call(value) as URLSearchParams;
  let safeHrefRaw = String(urlHrefGetter.call(value));

  if (password) {
    const authPrefix = `${protocol}//${username ? `${username}:` : ':'}`;
    if (safeHrefRaw.startsWith(`${authPrefix}${password}@`)) {
      safeHrefRaw = `${authPrefix}[REDACTED]@${safeHrefRaw.slice(
        authPrefix.length + password.length + 1
      )}`;
    }
  }

  return {
    type: 'URL',
    protocol: redactStringSecrets(protocol),
    hostname: redactStringSecrets(hostname),
    ...(port ? { port: redactStringSecrets(port) } : {}),
    pathname: redactStringSecrets(pathname),
    ...(username ? { username: redactStringSecrets(username) } : {}),
    ...(password ? { password: '[REDACTED]' } : {}),
    searchParams: sanitizeValueInternal(searchParams, depth + 1, ancestors),
    ...(hash ? { hash: redactStringSecrets(hash) } : {}),
    href: redactStringSecrets(safeHrefRaw),
  };
}

function sanitizeValueInternal(
  value: unknown,
  depth: number,
  ancestors: WeakSet<object>
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return redactStringSecrets(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'symbol' || typeof value === 'function') {
    return `[${typeof value}]`;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '[INVALID_DATE]' : value.toISOString();
  }

  if (typeof value === 'object') {
    const objRef = value as object;
    if (ancestors.has(objRef)) {
      return '[CIRCULAR]';
    }

    if (depth > MAX_AUDIT_SANITIZE_DEPTH) {
      return '[MAX_DEPTH_REDACTED]';
    }

    ancestors.add(objRef);
    try {
      if (value instanceof Error) {
        return sanitizeErrorObject(value, depth, ancestors);
      }

      if (value instanceof Map) {
        return sanitizeMapObject(value, depth, ancestors);
      }

      if (value instanceof Set) {
        return sanitizeSetObject(value, depth, ancestors);
      }

      if (value instanceof URL) {
        return sanitizeURLObject(value, depth, ancestors);
      }

      if (value instanceof URLSearchParams) {
        return sanitizeURLSearchParamsObject(value, depth, ancestors);
      }

      if (Array.isArray(value)) {
        const limited = value.slice(0, MAX_AUDIT_COLLECTION_ITEMS);
        const result = limited.map((item) => sanitizeValueInternal(item, depth + 1, ancestors));
        if (value.length > MAX_AUDIT_COLLECTION_ITEMS) {
          result.push(`...[TRUNCATED_${value.length - MAX_AUDIT_COLLECTION_ITEMS}_ITEMS]`);
        }
        return result;
      }

      const entries = Object.entries(value as Record<string, unknown>);
      const sanitized: Record<string, unknown> = {};
      const limit = Math.min(entries.length, MAX_AUDIT_COLLECTION_ITEMS);

      for (let i = 0; i < limit; i++) {
        const [key, val] = entries[i];
        sanitized[key] = SENSITIVE_KEY_PATTERN.test(key)
          ? '[REDACTED]'
          : sanitizeValueInternal(val, depth + 1, ancestors);
      }

      if (entries.length > MAX_AUDIT_COLLECTION_ITEMS) {
        sanitized.__truncatedKeys = entries.length - MAX_AUDIT_COLLECTION_ITEMS;
      }

      return sanitized;
    } finally {
      ancestors.delete(objRef);
    }
  }

  return redactStringSecrets(String(value));
}

/**
 * Recursively sanitizes values with depth, collection, circular, and fail-closed guards.
 */
export function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  try {
    return sanitizeValueInternal(value, depth, new WeakSet<object>());
  } catch {
    return '[REDACTION_ERROR]';
  }
}

/**
 * Sanitizes serialized AuditLog details strings with fail-closed fallback.
 */
export function sanitizeAuditDetails(details: string | null): string | null {
  if (!details) {
    return details;
  }

  try {
    const parsed = JSON.parse(details) as unknown;
    const sanitized = sanitizeAuditValue(parsed);
    if (sanitized === '[REDACTION_ERROR]') {
      return REDACTION_FALLBACK_JSON;
    }
    return typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
  } catch {
    try {
      const redacted = redactStringSecrets(details);
      return redacted === '[REDACTION_ERROR]' ? REDACTION_FALLBACK_JSON : redacted;
    } catch {
      return REDACTION_FALLBACK_JSON;
    }
  }
}

/**
 * Safely logs application errors to stderr after fail-closed redaction, without re-entry or throwing.
 */
export function logSafeError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  if (activeSafeErrorDepth > 0) {
    return;
  }

  activeSafeErrorDepth++;
  try {
    let safeMessage: string;
    try {
      safeMessage = typeof message === 'string' ? redactStringSecrets(message) : '[INVALID_LOG_MESSAGE]';
    } catch {
      safeMessage = '[SAFE_LOG_REDACTION_ERROR]';
    }

    if (error === undefined && context === undefined) {
      try {
        console.error(safeMessage);
      } catch {
        // Logging failure must never break application flow
      }
      return;
    }

    let safePayload: unknown;
    try {
      const sanitizedError = error !== undefined ? sanitizeAuditValue(error) : undefined;
      const sanitizedContext = context !== undefined ? sanitizeAuditValue(context) : undefined;

      if (sanitizedError === '[REDACTION_ERROR]' || sanitizedContext === '[REDACTION_ERROR]') {
        safePayload = { redactionFallback: '[REDACTION_ERROR]' };
      } else if (sanitizedContext === undefined) {
        safePayload = sanitizedError;
      } else if (sanitizedError === undefined) {
        safePayload = sanitizedContext;
      } else {
        safePayload = { error: sanitizedError, context: sanitizedContext };
      }
    } catch {
      safePayload = { redactionFallback: '[REDACTION_ERROR]' };
    }

    try {
      console.error(safeMessage, safePayload);
    } catch {
      // Ignore logger sink failures so caller errors are preserved
    }
  } finally {
    activeSafeErrorDepth--;
  }
}
