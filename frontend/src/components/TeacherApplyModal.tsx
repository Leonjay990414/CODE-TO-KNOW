import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  School,
  Building2,
  BookOpen,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { teacherApi, TeacherApplication } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TeacherApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (mode: 'login' | 'register') => void;
}

export const TeacherApplyModal: React.FC<TeacherApplyModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
}) => {
  const { user, openAuth: contextOpenAuth } = useAuth();

  // Form Fields
  const [schoolName, setSchoolName] = useState('');
  const [subject, setSubject] = useState('');
  const [reason, setReason] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  // Status & Data
  const [existingApp, setExistingApp] = useState<TeacherApplication | null>(null);
  const [fetchingExisting, setFetchingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFormAnyway, setShowFormAnyway] = useState(false);

  // Accessibility Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  // Load existing application when modal opens
  const fetchMyApplication = async () => {
    if (!user) return;
    setFetchingExisting(true);
    setErrorMessage(null);
    try {
      const res = await teacherApi.getMyApplication();
      if (res.success && res.data?.application) {
        setExistingApp(res.data.application);
        // Pre-fill fields in case user wants to re-submit or view
        setSchoolName(res.data.application.schoolName || '');
        setSubject(res.data.application.subject || '');
        setReason(res.data.application.reason || '');
        setProofUrl(res.data.application.proofUrl || '');
      } else {
        setExistingApp(null);
      }
    } catch {
      // Silently ignore or show friendly message
    } finally {
      setFetchingExisting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setShowFormAnyway(false);
      triggerElementRef.current = document.activeElement as HTMLElement | null;

      if (user) {
        fetchMyApplication();
      }
    }
  }, [isOpen, user]);

  // Focus Trap & Keyboard Handling
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (!modalRef.current) return;
      const focusables = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length > 0) {
        const firstInput = Array.from(focusables).find(
          (el) => el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
        );
        (firstInput || focusables[0]).focus();
      }
    }, 60);

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
  }, [isOpen, existingApp, showFormAnyway]);

  const handleClose = () => {
    onClose();
    if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
      setTimeout(() => {
        triggerElementRef.current?.focus();
      }, 50);
    }
  };

  const handleGoToLogin = () => {
    handleClose();
    if (onOpenAuth) {
      onOpenAuth('login');
    } else {
      contextOpenAuth('login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedSchool = schoolName.trim();
    const trimmedSubject = subject.trim();
    const trimmedReason = reason.trim();
    const trimmedProof = proofUrl.trim();

    if (trimmedSchool.length < 2 || trimmedSchool.length > 100) {
      setErrorMessage('學校或教育機構名稱長度需介於 2 至 100 個字元');
      return;
    }

    if (trimmedSubject.length < 2 || trimmedSubject.length > 100) {
      setErrorMessage('任教科目領域長度需介於 2 至 100 個字元');
      return;
    }

    if (trimmedReason.length < 10 || trimmedReason.length > 1000) {
      setErrorMessage('申請原因與教學規劃至少需填寫 10 個字元（最多 1000 字元）');
      return;
    }

    if (trimmedProof) {
      try {
        new URL(trimmedProof);
      } catch {
        setErrorMessage('經歷證明若有填寫，必須為有效的 HTTP/HTTPS 網址格式');
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await teacherApi.submitApplication({
        schoolName: trimmedSchool,
        subject: trimmedSubject,
        reason: trimmedReason,
        proofUrl: trimmedProof || undefined,
      });

      if (res.success) {
        setSuccessMessage('教育者資格申請已成功送出！管理員將盡快為您完成審核。');
        setShowFormAnyway(false);
        fetchMyApplication();
      } else {
        setErrorMessage(res.error?.message || '申請送出失敗，請確認資料後再試');
      }
    } catch {
      setErrorMessage('連線至伺服器失敗，請確認網路或後端狀態');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isTeacherOrAdmin = user && (user.roles.includes('TEACHER') || user.roles.includes('ADMIN'));

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
        aria-labelledby="teacher-apply-modal-title"
        className="card"
        style={{
          width: '100%',
          maxWidth: '560px',
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
          aria-label="關閉教育者申請對話框"
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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <School size={16} color="var(--color-brand-deep-slate)" />
            <span className="badge badge-gold">認證教育者申請</span>
          </div>

          <h2
            id="teacher-apply-modal-title"
            className="text-h3"
            style={{ fontSize: '22px', marginBottom: '6px', color: 'var(--color-brand-charcoal)' }}
          >
            加入「碼上學」教學先導計畫
          </h2>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: '440px', margin: '0 auto' }}>
            認證教師可享有全班歷程儀表板、出題組卷中心、即時學習卡點熱區圖與 AI 助教自訂派送權限。
          </p>
        </div>

        {/* Error Alert */}
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

        {/* Success Alert */}
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

        {/* ============================================================ */}
        {/* CASE 1: User Not Logged In                                   */}
        {/* ============================================================ */}
        {!user && (
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              border: '1px solid var(--border-default)',
            }}
          >
            <LogIn size={32} color="var(--color-brand-deep-slate)" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              請先登入或註冊會員
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.6 }}>
              為確保教育資料安全性與教學數據歸屬，教師資格審核需綁定已開通的學員帳號。請先登入後再進行申請。
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGoToLogin}
              style={{ padding: '0 24px', height: '42px', fontSize: '14px', fontWeight: 600 }}
            >
              前往登入 / 註冊帳號
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 2: User Already Has Teacher or Admin Role               */}
        {/* ============================================================ */}
        {user && isTeacherOrAdmin && (
          <div
            style={{
              padding: '24px',
              backgroundColor: '#F0FDF4',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #86EFAC',
              textAlign: 'center',
            }}
          >
            <CheckCircle2 size={36} color="#166534" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>
              您已具備認證教育者權限
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              您的帳號已包含{' '}
              <strong style={{ color: 'var(--color-brand-deep-slate)' }}>
                {user.roles.includes('ADMIN') ? '系統管理員 (ADMIN)' : '認證教師 (TEACHER)'}
              </strong>{' '}
              權限，無需重複申請。教學中心所有班級數據與組卷功能已全部為您就緒！
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              style={{ height: '40px', padding: '0 20px', fontSize: '13px' }}
            >
              我知道了
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 3: Existing Application Found (Pending / Rejected)       */}
        {/* ============================================================ */}
        {user && !isTeacherOrAdmin && existingApp && !showFormAnyway && (
          <div
            style={{
              padding: '20px',
              backgroundColor: 'var(--surface-sunken)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--color-brand-gold)" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  申請審核狀態
                </span>
              </div>
              <span
                className={`badge ${
                  existingApp.status === 'APPROVED'
                    ? 'badge-success'
                    : existingApp.status === 'PENDING'
                    ? 'badge-gold'
                    : 'badge-neutral'
                }`}
              >
                {existingApp.status === 'PENDING' && '審核中 (PENDING)'}
                {existingApp.status === 'APPROVED' && '已核准 (APPROVED)'}
                {existingApp.status === 'REJECTED' && '未通過 (REJECTED)'}
              </span>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '16px' }}>
              <div><strong>任教單位：</strong>{existingApp.schoolName}</div>
              <div><strong>主要科目：</strong>{existingApp.subject}</div>
              <div><strong>申請時間：</strong>{new Date(existingApp.createdAt).toLocaleString('zh-TW')}</div>
              {existingApp.reviewNote && (
                <div style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <strong>審核意見：</strong>{existingApp.reviewNote}
                </div>
              )}
            </div>

            {existingApp.status === 'PENDING' && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                ✦ 管理員通常於 1 至 2 個工作天內完成資格查核。審核完成後，您登入時將自動解鎖教師中心功能。
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchMyApplication}
                disabled={fetchingExisting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={13} className={fetchingExisting ? 'animate-spin' : ''} />
                <span>重新整理狀態</span>
              </button>

              {existingApp.status === 'REJECTED' && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowFormAnyway(true)}
                >
                  重新編輯並送出申請
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CASE 4: Fresh Application Form (or Re-submitting)             */}
        {/* ============================================================ */}
        {user && !isTeacherOrAdmin && (!existingApp || showFormAnyway) && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* School / Institution Field */}
            <div>
              <label
                htmlFor="teacher-school-name"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                任教學校或教育機構名稱 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="teacher-school-name"
                  type="text"
                  placeholder="例如：國立臺灣大學資訊工程學系 / 碼上學線上學堂"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
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
                <Building2
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Subject Field */}
            <div>
              <label
                htmlFor="teacher-subject"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                主要任教學科或研究領域 <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="teacher-subject"
                  type="text"
                  placeholder="例如：資料結構與演算法、APCS 程式設計、Python 專案開發"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
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
                <BookOpen
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Reason & Teaching Goals Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label
                  htmlFor="teacher-reason"
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                  }}
                >
                  申請原因與教學運用規劃 (至少 10 字) <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <span style={{ fontSize: '11px', color: reason.trim().length >= 10 ? 'var(--status-success)' : 'var(--text-muted)' }}>
                  {reason.trim().length} / 1000 字
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  id="teacher-reason"
                  rows={4}
                  placeholder="請簡述您預計如何運用「碼上學」進行班級教學、學生作業派送或診斷學習卡點..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Teaching Proof Link Field (Optional) */}
            <div>
              <label
                htmlFor="teacher-proof-url"
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                }}
              >
                任教經歷公開證明連結 (選填)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="teacher-proof-url"
                  type="url"
                  placeholder="例如：學校教師專頁、LinkedIn、個人教學網站或證書連結 (https://...)"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
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
                <LinkIcon
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '12px', top: '13px', pointerEvents: 'none' }}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                ✦ 提供公開機構連結有助於加快管理員審核進度。
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                width: '100%',
                height: '44px',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.75 : 1,
              }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              <span>送出教育者資格申請</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
