import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  GraduationCap,
  School,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
  ArrowLeft,
  Mail,
  Lock,
} from 'lucide-react';
import { authApi, User } from '../services/api';
import { AuthModalMode, useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode: initialMode,
  onClose,
  onSuccess,
}) => {
  const { isDemoMode, loginAsDemo } = useAuth();
  const [currentMode, setCurrentMode] = useState<AuthModalMode>(initialMode);
  const [selectedRoleType, setSelectedRoleType] = useState<'student' | 'teacher'>('student');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for Accessibility & Focus Management
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize initial mode when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      // Store currently active element to restore focus on close
      triggerElementRef.current = document.activeElement as HTMLElement | null;
    } else {
      // Clear timers when closed
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [initialMode, isOpen]);

  // Clean up timers on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Modal Focus Trap & Keyboard Handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus first focusable element inside modal
    const focusFirst = () => {
      if (!modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        // Prefer first input if available, else first focusable
        const firstInput = Array.from(focusables).find((el) => el.tagName === 'INPUT');
        (firstInput || focusables[0]).focus();
      }
    };

    const timer = setTimeout(focusFirst, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusables = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentMode]);

  const handleClose = () => {
    onClose();
    // Return focus to trigger element for accessibility
    if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
      setTimeout(() => {
        triggerElementRef.current?.focus();
      }, 50);
    }
  };

  const switchMode = (newMode: AuthModalMode) => {
    setCurrentMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // ==========================================
    // 1. Forgot Password Mode
    // ==========================================
    if (currentMode === 'forgot-password') {
      if (!email || !email.includes('@')) {
        setErrorMessage('請輸入有效格式的電子郵件地址');
        return;
      }

      setLoading(true);
      try {
        const response = await authApi.forgotPassword(email);
        if (response.success) {
          setSuccessMessage(
            response.message ||
            '若帳號存在，系統已寄出密碼重設郵件。若您已取得重設代碼，請點擊下方直接輸入代碼重設。'
          );
        } else {
          setErrorMessage(response.error?.message || '發送失敗，請稍後再試');
        }
      } catch {
        setErrorMessage('連線至伺服器失敗，請確認網路或後端狀態');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ==========================================
    // 2. Reset Password Mode
    // ==========================================
    if (currentMode === 'reset-password') {
      if (!resetToken.trim()) {
        setErrorMessage('請輸入重設代碼');
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        setErrorMessage('新密碼長度至少需 8 個字元，並包含英文與數字');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('兩次輸入的新密碼不一致');
        return;
      }

      setLoading(true);
      try {
        const response = await authApi.resetPassword({
          token: resetToken.trim(),
          newPassword,
        });

        if (response.success) {
          setSuccessMessage('密碼已成功更新！即將為您切換至登入畫面...');
          timerRef.current = setTimeout(() => {
            switchMode('login');
            setPassword('');
            setResetToken('');
            setNewPassword('');
            setConfirmPassword('');
          }, 1500);
        } else {
          setErrorMessage(response.error?.message || '重設密碼失敗，代碼可能已逾期或無效');
        }
      } catch {
        setErrorMessage('連線至伺服器失敗，請確認網路或後端狀態');
      } finally {
        setLoading(false);
      }
      return;
    }

    // ==========================================
    // 3. Login & Register Modes
    // ==========================================
    if (!email || !email.includes('@')) {
      setErrorMessage('請輸入正確格式的電子郵件');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('密碼長度至少需 8 個字元，並包含英數');
      return;
    }

    if (currentMode === 'register' && (!displayName.trim() || displayName.trim().length < 2)) {
      setErrorMessage('請填寫至少 2 個字元的顯示名稱');
      return;
    }

    setLoading(true);

    try {
      if (currentMode === 'login') {
        const response = await authApi.login({ email, password });
        if (response.success && response.data?.user) {
          setSuccessMessage('登入成功！正在為您同步學習進度...');
          if (onSuccess) onSuccess(response.data.user);
          timerRef.current = setTimeout(() => {
            handleClose();
          }, 900);
        } else {
          setErrorMessage(response.error?.message || '登入失敗，請確認帳號與密碼');
        }
      } else {
        const response = await authApi.register({
          email,
          password,
          displayName: displayName.trim(),
        });
        if (response.success && response.data?.user) {
          setSuccessMessage('註冊成功！已為您開通學習帳號，正在自動登入...');
          const loginRes = await authApi.login({ email, password });
          if (loginRes.success && loginRes.data?.user && onSuccess) {
            onSuccess(loginRes.data.user);
          }
          timerRef.current = setTimeout(() => {
            handleClose();
          }, 1200);
        } else {
          setErrorMessage(response.error?.message || '註冊失敗，請稍後再試');
        }
      }
    } catch {
      setErrorMessage('系統連線異常，請確認後端服務是否已啟動');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(38, 52, 61, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 'var(--z-index-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
      aria-hidden="false"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#FFFFFF',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="關閉對話框"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--surface-sunken)',
            cursor: 'pointer',
            border: 'none',
            transition: 'background-color var(--duration-fast) var(--ease-out)',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="var(--color-brand-gold)" />
            <span className="badge badge-gold">
              {currentMode === 'login' && '會員登入'}
              {currentMode === 'register' && '註冊加入碼上學'}
              {currentMode === 'forgot-password' && '密碼求助'}
              {currentMode === 'reset-password' && '安全重設'}
            </span>
          </div>

          <h2
            id="auth-modal-title"
            className="text-h3"
            style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--color-brand-charcoal)' }}
          >
            {currentMode === 'login' && '歡迎回到碼上學'}
            {currentMode === 'register' && '開啟您的自主學習新篇章'}
            {currentMode === 'forgot-password' && '找回您的帳號密碼'}
            {currentMode === 'reset-password' && '設定新的安全密碼'}
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {currentMode === 'login' && '登入帳號以同步您的測驗題庫、歷程紀錄與 AI 思考鷹架'}
            {currentMode === 'register' && '完成註冊即可享有完整的沉浸式程式題庫與 AI 解題引導'}
            {currentMode === 'forgot-password' && '請輸入您註冊的電子郵件，我們將協助您恢復帳號存取'}
            {currentMode === 'reset-password' && '請輸入系統寄送的重設代碼與欲更新的新密碼'}
          </p>
        </div>

        {/* Demo Mode Notice & Quick Switch */}
        {isDemoMode && (
          <div
            style={{
              backgroundColor: 'rgba(189, 167, 126, 0.12)',
              border: '1px solid var(--border-gold)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--color-brand-champagne-gold)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                GitHub Pages 公開展示模式
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
              本系統目前為前端靜態展示版，無後端伺服器與資料庫連線。請勿輸入真實個人密碼。您可以點擊下方按鈕以示範帳號即時體驗：
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  loginAsDemo('STUDENT');
                  handleClose();
                }}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  fontSize: '12px',
                  padding: '8px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <GraduationCap size={15} />
                一鍵示範學員登入
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  loginAsDemo('TEACHER');
                  handleClose();
                }}
                style={{
                  flex: 1,
                  minWidth: '130px',
                  fontSize: '12px',
                  padding: '8px 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <School size={15} />
                一鍵示範教師登入
              </button>
            </div>
          </div>
        )}

        {/* Role Type Tabs (only visible on login and register) */}
        {(currentMode === 'login' || currentMode === 'register') && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setSelectedRoleType('student')}
              aria-pressed={selectedRoleType === 'student'}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border:
                  selectedRoleType === 'student'
                    ? '2px solid var(--color-brand-deep-slate)'
                    : '1px solid var(--border-default)',
                backgroundColor: selectedRoleType === 'student' ? 'var(--color-brand-ice-slate)' : '#FFFFFF',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              <GraduationCap
                size={20}
                color={selectedRoleType === 'student' ? 'var(--color-brand-deep-slate)' : 'var(--text-muted)'}
                style={{ margin: '0 auto 4px auto' }}
              />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>我是學習者</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>探索題庫與 AI 助教</div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleType('teacher')}
              aria-pressed={selectedRoleType === 'teacher'}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border:
                  selectedRoleType === 'teacher'
                    ? '2px solid var(--color-brand-deep-slate)'
                    : '1px solid var(--border-default)',
                backgroundColor: selectedRoleType === 'teacher' ? 'var(--color-brand-ice-slate)' : '#FFFFFF',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-out)',
              }}
            >
              <School
                size={20}
                color={selectedRoleType === 'teacher' ? 'var(--color-brand-deep-slate)' : 'var(--text-muted)'}
                style={{ margin: '0 auto 4px auto' }}
              />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>我是教育者</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>班級管理與教學分析</div>
            </button>
          </div>
        )}

        {/* Educator Role Notice */}
        {selectedRoleType === 'teacher' && (currentMode === 'login' || currentMode === 'register') && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(189, 167, 126, 0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: 'var(--color-brand-gold-text)',
              marginBottom: '16px',
              lineHeight: 1.5,
              border: '1px solid rgba(189, 167, 126, 0.35)',
            }}
          >
            ✦ <strong>教育者帳號說明</strong>：為保障教學品質與班級安全，教育者採審核制。請先註冊/登入一般帳號後，至「教師專區」填寫申請資料由管理員核准！
          </div>
        )}

        {/* Error Feedback Alert */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#FDF2F2',
              color: '#991B1B',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #FCA5A5',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Feedback Alert */}
        {successMessage && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#F0FDF4',
              color: '#166534',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              marginBottom: '16px',
              border: '1px solid #86EFAC',
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* ========================================================== */}
          {/* 1. Register Mode: Display Name Input                       */}
          {/* ========================================================== */}
          {currentMode === 'register' && (
            <div>
              <label
                htmlFor="auth-display-name"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                您的姓名或暱稱 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
                id="auth-display-name"
                type="text"
                placeholder="例如：王小明"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '42px',
                  padding: '0 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* ========================================================== */}
          {/* 2. Login / Register / Forgot Password: Email Input         */}
          {/* ========================================================== */}
          {currentMode !== 'reset-password' && (
            <div>
              <label
                htmlFor="auth-email"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                電子郵件 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 14px 0 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                />
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 3. Login / Register: Password Input + Visibility Toggle    */}
          {/* ========================================================== */}
          {(currentMode === 'login' || currentMode === 'register') && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <label
                  htmlFor="auth-password"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  密碼 <span style={{ color: '#DC2626' }}>*</span>
                </label>
                {currentMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '12px',
                      color: 'var(--color-brand-deep-slate)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
                  >
                    忘記密碼？
                  </button>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="至少 8 碼，包含英文與數字"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 40px 0 38px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* 4. Reset Password: Token & New Passwords                   */}
          {/* ========================================================== */}
          {currentMode === 'reset-password' && (
            <>
              <div>
                <label
                  htmlFor="auth-reset-token"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  重設代碼 (Token) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-reset-token"
                    type="text"
                    placeholder="請貼上您在信件或系統中收到的重設代碼"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 14px 0 38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                  <KeyRound
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-new-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  新密碼 <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="至少 8 碼，包含英文與數字"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 40px 0 38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <Lock
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? '隱藏新密碼' : '顯示新密碼'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '11px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-confirm-password"
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '4px',
                  }}
                >
                  再次確認新密碼 <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="請再次輸入相同的新密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 40px 0 38px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <Lock
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '11px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            <span>
              {currentMode === 'login' && '立即登入'}
              {currentMode === 'register' && '確認建立帳號'}
              {currentMode === 'forgot-password' && '發送重設密碼說明'}
              {currentMode === 'reset-password' && '確認更新密碼'}
            </span>
          </button>
        </form>

        {/* Footer Navigation Links */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          {currentMode === 'login' && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              還沒有碼上學帳號？{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-deep-slate)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                立即免費註冊
              </button>
            </p>
          )}

          {currentMode === 'register' && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              已經是碼上學學員？{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-deep-slate)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                直接登入帳號
              </button>
            </p>
          )}

          {currentMode === 'forgot-password' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => switchMode('reset-password')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-brand-deep-slate)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                我已收到重設代碼？前往重設密碼
              </button>

              <button
                type="button"
                onClick={() => switchMode('login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} />
                <span>返回登入</span>
              </button>
            </div>
          )}

          {currentMode === 'reset-password' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-brand-deep-slate)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeft size={14} />
              <span>返回登入</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
