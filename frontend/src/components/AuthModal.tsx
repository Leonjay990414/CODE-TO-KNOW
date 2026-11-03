import React, { useState, useEffect } from 'react';
import { X, Sparkles, GraduationCap, School, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { authApi, User } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, mode: initialMode, onClose, onSuccess }) => {
  const [currentMode, setCurrentMode] = useState<'login' | 'register'>(initialMode);
  const [selectedRoleType, setSelectedRoleType] = useState<'student' | 'teacher'>('student');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
          setSuccessMessage('登入成功！正在為您載入學習進度...');
          if (onSuccess) onSuccess(response.data.user);
          setTimeout(() => {
            onClose();
          }, 1000);
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
          setSuccessMessage('註冊成功！已為您開通學習帳號，現在為您自動登入...');
          // Automatically log in after registration
          const loginRes = await authApi.login({ email, password });
          if (loginRes.success && loginRes.data?.user && onSuccess) {
            onSuccess(loginRes.data.user);
          }
          setTimeout(() => {
            onClose();
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
      onClick={onClose}
    >
      <div
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
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉視窗"
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
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Sparkles size={14} color="var(--color-brand-gold)" />
            <span className="badge badge-gold">
              {currentMode === 'login' ? '會員登入' : '註冊加入碼上學'}
            </span>
          </div>
          <h3 className="text-h3" style={{ fontSize: '22px', marginBottom: '6px' }}>
            {currentMode === 'login' ? '歡迎回到碼上學' : '開啟您的自主學習新篇章'}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            {currentMode === 'login' ? '登入帳號以同步您的測驗題庫與 AI 助教紀錄' : '完成註冊即可享有完整的沉浸式程式題庫與 AI 解題引導'}
          </p>
        </div>

        {/* Role Type Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setSelectedRoleType('student')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: selectedRoleType === 'student' ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
              backgroundColor: selectedRoleType === 'student' ? 'var(--color-brand-ice-slate)' : '#FFFFFF',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <GraduationCap
              size={22}
              color={selectedRoleType === 'student' ? 'var(--color-brand-deep-slate)' : 'var(--text-muted)'}
              style={{ margin: '0 auto 6px auto' }}
            />
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>我是學習者</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>探索課程、題庫與 AI 助教</div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRoleType('teacher')}
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: selectedRoleType === 'teacher' ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
              backgroundColor: selectedRoleType === 'teacher' ? 'var(--color-brand-ice-slate)' : '#FFFFFF',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            <School
              size={22}
              color={selectedRoleType === 'teacher' ? 'var(--color-brand-deep-slate)' : 'var(--text-muted)'}
              style={{ margin: '0 auto 6px auto' }}
            />
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>我是教育者</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>班級管理、出題與學習分析</div>
          </button>
        </div>

        {/* Educator Role Notice (if teacher selected) */}
        {selectedRoleType === 'teacher' && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(189, 167, 126, 0.15)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              color: '#6F562E',
              marginBottom: '16px',
              lineHeight: 1.5,
              border: '1px solid rgba(189, 167, 126, 0.3)',
            }}
          >
            ✦ <strong>教育者帳號說明</strong>：為保障教學品質與班級安全，教育者帳號採審核制。請先登入或註冊會員後，至「教師專區」填寫任教資料申請審核開通！
          </div>
        )}

        {/* Error / Success Feedback Alerts */}
        {errorMessage && (
          <div
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
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
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
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentMode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                您的姓名或暱稱 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <input
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              電子郵件 <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              密碼 <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="至少 8 碼，包含英文與數字"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            <span>{currentMode === 'login' ? '立即登入' : '確認建立帳號'}</span>
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          {currentMode === 'login' ? (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              還沒有碼上學帳號？{' '}
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('register');
                  setErrorMessage(null);
                }}
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
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              已經是碼上學學員？{' '}
              <button
                type="button"
                onClick={() => {
                  setCurrentMode('login');
                  setErrorMessage(null);
                }}
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
        </div>
      </div>
    </div>
  );
};
