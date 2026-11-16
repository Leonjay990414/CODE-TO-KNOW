/**
 * CODE TO KNOW (碼上學) Learning Analytics & Telemetry Collector
 * (P20-OPS-006: 追蹤產品指標、學習成效、留存與功能使用情況)
 *
 * NOTE: This is client-side event buffering and local telemetry aggregator.
 * It is NOT an external cloud analytics service (e.g. Google Analytics / Mixpanel).
 */

export type TelemetryEventType =
  | 'PAGE_VIEW'
  | 'EXAM_START'
  | 'EXAM_SUBMIT'
  | 'GAME_START'
  | 'GAME_COMPLETE'
  | 'AI_HINT_REQUEST'
  | 'WRONG_QUESTION_REVIEW';

export interface TelemetryEvent {
  id: string;
  type: TelemetryEventType;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, string | number | boolean>;
}

export const TELEMETRY_STORAGE_KEY = 'ctk_telemetry_events';
const MAX_BUFFERED_EVENTS = 200;

let memoryBuffer: TelemetryEvent[] = [];

/**
 * Record a learning or interaction event
 */
export function trackEvent(
  type: TelemetryEventType,
  metadata?: Record<string, string | number | boolean>,
  userId?: string
): TelemetryEvent {
  // PII safety: Never record passwords, tokens, or emails inside metadata
  const sanitizedMeta: Record<string, string | number | boolean> = {};
  if (metadata) {
    for (const [key, val] of Object.entries(metadata)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('pass') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('auth') ||
        lowerKey.includes('credit')
      ) {
        continue; // drop sensitive fields
      }
      sanitizedMeta[key] = val;
    }
  }

  const event: TelemetryEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous',
    metadata: sanitizedMeta,
  };

  memoryBuffer.unshift(event);
  if (memoryBuffer.length > MAX_BUFFERED_EVENTS) {
    memoryBuffer = memoryBuffer.slice(0, MAX_BUFFERED_EVENTS);
  }

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(memoryBuffer.slice(0, 50)));
    } catch {
      // Ignore sessionStorage errors
    }
  }

  return event;
}

/**
 * Get in-memory or buffered telemetry events
 */
export function getBufferedEvents(): TelemetryEvent[] {
  return [...memoryBuffer];
}

/**
 * Filter buffered events by type
 */
export function getEventsByType(type: TelemetryEventType): TelemetryEvent[] {
  return memoryBuffer.filter((ev) => ev.type === type);
}

/**
 * Clear buffered telemetry events
 */
export function clearTelemetryEvents(): void {
  memoryBuffer = [];
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      sessionStorage.removeItem(TELEMETRY_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }
}
