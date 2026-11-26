import { useEffect, useRef, useState, useCallback } from 'react';
import { studentApi, isDemoMode } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface UseStudyTimerOptions {
  moduleType?: 'THEORY' | 'PRACTICAL' | 'MOCK_EXAM' | 'AI_COACH';
  reportIntervalSeconds?: number; // default 60 seconds
  enabled?: boolean;
}

export function useStudyTimer(options: UseStudyTimerOptions = {}) {
  const { moduleType = 'THEORY', reportIntervalSeconds = 60, enabled = true } = options;
  const { user } = useAuth();
  const [activeSeconds, setActiveSeconds] = useState<number>(0);
  const pendingSecondsRef = useRef<number>(0);
  const isTabActiveRef = useRef<boolean>(true);
  const isReportingRef = useRef<boolean>(false);
  const tabInstanceIdRef = useRef<string>(Math.random().toString(36).slice(2, 10));

  const reportTime = useCallback(
    async (secondsToReport: number) => {
      if (secondsToReport <= 0) return;
      if (!user || user.id === 'demo-student' || isDemoMode) {
        // In demo mode or unauthenticated, we don't send to backend but keep local timer
        return;
      }

      if (isReportingRef.current) {
        pendingSecondsRef.current += secondsToReport;
        return;
      }

      isReportingRef.current = true;
      try {
        await studentApi.recordStudyTime({
          durationSeconds: secondsToReport,
          moduleType,
        });
      } catch (err) {
        // If reporting fails, re-add seconds to pending so they can be tried again next flush
        pendingSecondsRef.current += secondsToReport;
        console.warn('研讀時長回報暫存：', err);
      } finally {
        isReportingRef.current = false;
      }
    },
    [user, moduleType]
  );

  const flush = useCallback(async () => {
    const toReport = pendingSecondsRef.current;
    if (toReport > 0) {
      pendingSecondsRef.current = 0;
      await reportTime(toReport);
    }
  }, [reportTime]);

  useEffect(() => {
    if (!enabled) return;

    // Visibility and focus handlers to track active study only
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      isTabActiveRef.current = visible;
      if (!visible) {
        // Tab hidden -> flush pending time
        void flush();
      } else {
        // Tab became visible -> claim active tab
        try {
          localStorage.setItem('ctk_active_timer_tab', JSON.stringify({ tabId: tabInstanceIdRef.current, ts: Date.now() }));
        } catch {
          // ignore
        }
      }
    };

    const handleFocus = () => {
      isTabActiveRef.current = true;
      try {
        localStorage.setItem('ctk_active_timer_tab', JSON.stringify({ tabId: tabInstanceIdRef.current, ts: Date.now() }));
      } catch {
        // ignore
      }
    };

    const handleBlur = () => {
      isTabActiveRef.current = false;
    };

    const handleBeforeUnload = () => {
      const remaining = pendingSecondsRef.current;
      if (remaining > 0 && user && !isDemoMode) {
        const payload = JSON.stringify({
          durationSeconds: remaining,
          moduleType,
        });

        // Try fetch with keepalive first (supports credentials and headers)
        try {
          void fetch('/api/student/study-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            keepalive: true,
            body: payload,
          });
        } catch {
          // Fallback to sendBeacon with Blob
          try {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/student/study-time', blob);
          } catch {
            // ignore
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial claim
    if (document.visibilityState === 'visible') {
      try {
        localStorage.setItem('ctk_active_timer_tab', JSON.stringify({ tabId: tabInstanceIdRef.current, ts: Date.now() }));
      } catch {
        // ignore
      }
    }

    const timer = setInterval(() => {
      // Check if document is visible and tab is active
      if (isTabActiveRef.current && document.visibilityState === 'visible') {
        // Multi-tab check: verify if another tab recently claimed active focus within last 3 seconds
        let isCurrentTabOwner = true;
        try {
          const raw = localStorage.getItem('ctk_active_timer_tab');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.tabId && parsed.tabId !== tabInstanceIdRef.current && Date.now() - parsed.ts < 3000) {
              isCurrentTabOwner = false;
            }
          }
        } catch {
          // ignore localStorage access errors
        }

        if (isCurrentTabOwner) {
          setActiveSeconds((prev) => prev + 1);
          pendingSecondsRef.current += 1;

          if (pendingSecondsRef.current >= reportIntervalSeconds) {
            void flush();
          }
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void flush();
    };
  }, [enabled, reportIntervalSeconds, flush, user, moduleType]);

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return {
    activeSeconds,
    formattedTime: formatTime(activeSeconds),
    flush,
  };
}
