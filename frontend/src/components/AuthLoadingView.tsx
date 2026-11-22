import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, RefreshCw } from 'lucide-react';
import { AuthModalMode } from '../context/AuthContext';

interface AuthLoadingViewProps {
  mode: AuthModalMode;
  onCancel?: () => void;
  onRetry?: () => void;
  timeoutMs?: number;
}

export const AuthLoadingView: React.FC<AuthLoadingViewProps> = ({
  mode,
  onCancel,
  onRetry,
  timeoutMs = 10000,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isTimedOut, setIsTimedOut] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot-password';
  const isReset = mode === 'reset-password';

  // Realistic progressive status steps based on mode
  const steps = isRegister
    ? [
        '正在準備註冊學習帳號...',
        '正在確認註冊資料與欄位...',
        '正在連線至帳號認證中心...',
        '正在建立學習者檔案與環境...',
      ]
    : isForgot
    ? [
        '正在確認電子郵件格式...',
        '正在連線至帳號安全性服務...',
        '正在產生密碼重設安全金鑰...',
      ]
    : isReset
    ? [
        '正在確認重設代碼有效性...',
        '正在驗證新密碼安全強度...',
        '正在更新資料庫安全憑證...',
      ]
    : [
        '正在準備登入...',
        '正在確認帳號與密碼資訊...',
        '正在連線至伺服器認證中心...',
        '正在驗證登入安全憑證...',
      ];

  useEffect(() => {
    // Stage 1: Step 1 (immediate 0ms)
    setCurrentStep(0);
    setIsTimedOut(false);

    // Stage 2: Step 2 after 350ms
    const t1 = setTimeout(() => {
      setCurrentStep(1);
    }, 350);

    // Stage 3: Step 3 after 800ms
    const t2 = setTimeout(() => {
      setCurrentStep(2);
    }, 800);

    // Stage 4: Step 4 after 1400ms (if available)
    const t3 = setTimeout(() => {
      if (steps.length > 3) {
        setCurrentStep(3);
      }
    }, 1400);

    // Timeout safety fallback (default 10s)
    timerRef.current = setTimeout(() => {
      setIsTimedOut(true);
    }, timeoutMs);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [mode, timeoutMs, steps.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="認證資訊驗證處理中"
      className="auth-loading-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        minHeight: '320px',
        boxSizing: 'border-box',
        position: 'relative',
        animation: 'authFadeIn 240ms var(--ease-standard) forwards',
      }}
    >
      {/* Brand Monogram Logo Box */}
      <div
        className="auth-loading-logo-box"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--color-brand-cream, #FAF8F2)',
          border: '1px solid var(--color-brand-oat, #EBE5D8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 16px rgba(189, 167, 126, 0.16)',
          position: 'relative',
        }}
      >
        <div style={{ width: '34px', height: '34px' }}>
          <svg viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="碼上學 Logo">
            <path fill="#526B7B" d="M 140 48 C 84 48 40 84 40 128 C 40 172 84 208 140 208 C 149 208 156 201 156 192 C 156 183 149 176 140 176 C 102 176 70 154 70 128 C 70 102 102 80 140 80 C 149 80 156 73 156 64 C 156 55 149 48 140 48 Z"/>
            <path fill="#8FA9B8" d="M 130 126 C 135 121 143 121 148 126 L 194 172 C 200 178 200 186 194 192 C 188 198 180 198 174 192 L 130 148 C 124 142 124 132 130 126 Z"/>
            <path fill="#BDA77E" d="M 126 114 L 176 64 C 181 59 189 59 194 64 C 199 69 199 77 194 82 L 144 132 C 139 137 131 137 126 132 C 121 127 121 119 126 114 Z"/>
            <path fill="#BDA77E" d="M 200 38 C 200 48 194 54 184 56 C 194 58 200 64 200 74 C 200 64 206 58 216 56 C 206 54 200 48 200 38 Z"/>
          </svg>
        </div>
      </div>

      {!isTimedOut ? (
        <>
          {/* Smooth Dual-Color Orbital Spinner */}
          <div
            className="auth-loading-spinner-wrap"
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              marginBottom: '20px',
            }}
          >
            {/* Outer Track */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px solid rgba(217, 226, 234, 0.45)',
              }}
            />
            {/* Rotating Head (Sage Green & Gold) */}
            <div
              className="auth-spinner-head"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '3px solid transparent',
                borderTopColor: 'var(--color-brand-sage, #5A7D6C)',
                borderRightColor: 'var(--color-brand-gold, #BDA77E)',
                animation: 'authSpinOrbit 1.4s cubic-bezier(0.5, 0.1, 0.5, 0.9) infinite',
              }}
            />
            {/* Center Pulsing Dot */}
            <div
              className="auth-spinner-center"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-gold, #BDA77E)',
                animation: 'authCenterPulse 1.8s ease-in-out infinite alternate',
              }}
            />
          </div>

          {/* Stepper Status Text */}
          <div style={{ marginBottom: '14px', minHeight: '44px' }}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--color-brand-charcoal, #26343D)',
                marginBottom: '4px',
                transition: 'opacity var(--dur-fast) var(--ease-standard)',
              }}
            >
              {steps[currentStep]}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted, #6C7F8C)' }}>
              碼上學 安全認證服務處理中
            </div>
          </div>

          {/* Flowing Shimmer Bar */}
          <div
            style={{
              width: '180px',
              height: '3px',
              borderRadius: '2px',
              backgroundColor: 'rgba(217, 226, 234, 0.5)',
              overflow: 'hidden',
              position: 'relative',
              marginBottom: '24px',
            }}
          >
            <div
              className="auth-shimmer-bar"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(90deg, transparent, var(--color-brand-sage, #5A7D6C) 40%, var(--color-brand-gold, #BDA77E) 70%, transparent)',
                animation: 'authShimmerFlow 1.6s ease-in-out infinite',
              }}
            />
          </div>

          {/* Cancel Button */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="隨時取消本次連線"
            >
              <X size={14} />
              <span>取消操作</span>
            </button>
          )}
        </>
      ) : (
        /* Timeout Fallback View */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '320px',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: 'var(--status-warning-bg, #FAF5EB)',
              color: 'var(--status-warning, #B38634)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={22} />
          </div>

          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            連線回應逾時
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            伺服器連線已超過 10 秒未回應。這可能是因為本地後端尚未啟動或網路品質不穩定。
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', width: '100%' }}>
            {onRetry && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onRetry}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} />
                <span>重新嘗試</span>
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
                style={{ flex: 1 }}
              >
                返回表單
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scoped CSS Keyframes & Reduced Motion */}
      <style>{`
        @keyframes authFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes authSpinOrbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes authCenterPulse {
          0% { transform: translate(-50%, -50%) scale(0.85); opacity: 0.7; }
          100% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        }
        @keyframes authShimmerFlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-spinner-head,
          .auth-spinner-center,
          .auth-shimmer-bar,
          .auth-loading-container {
            animation: none !important;
            transform: none !important;
          }
          .auth-spinner-head {
            border-color: var(--color-brand-sage) !important;
          }
        }
      `}</style>
    </div>
  );
};
