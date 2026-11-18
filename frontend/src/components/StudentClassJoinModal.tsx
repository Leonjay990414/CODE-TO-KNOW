import React, { useState, useEffect, useRef } from 'react';
import { X, Users, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';
import { classroomApi } from '../services/api';

export interface EnrolledClass {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  semester: string;
  enrolledAt: string;
  announcementsCount: number;
}

interface StudentClassJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onClassJoined?: (newClass: EnrolledClass) => void;
}

const STORAGE_KEY_PREFIX = 'ctk_enrolled_classes:';

export const getEnrolledClasses = (userId: string): EnrolledClass[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveEnrolledClasses = (userId: string, classes: EnrolledClass[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(classes));
  } catch (err) {
    console.error('Failed to save enrolled classes', err);
  }
};

export const StudentClassJoinModal: React.FC<StudentClassJoinModalProps> = ({
  isOpen,
  onClose,
  userId,
  onClassJoined,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [enrolledList, setEnrolledList] = useState<EnrolledClass[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setEnrolledList(getEnrolledClasses(userId));
      setJoinCode('');
      setErrorMsg('');
      setSuccessMsg('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, userId]);

  // Keyboard navigation & Esc handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanCode = joinCode.trim().toUpperCase();

    // 1. Length & Charset validation
    if (cleanCode.length !== 8) {
      setErrorMsg('班級邀請碼必須為 8 碼大寫英數字');
      return;
    }

    // Exclude ambiguous characters (0, O, 1, I, L)
    if (/[01OIL]/.test(cleanCode)) {
      setErrorMsg('邀請碼不包含數字 0、1 或字母 O、I、L，請重新確認');
      return;
    }

    // 2. Check if already enrolled in local list
    const exists = enrolledList.some((c) => c.code === cleanCode);
    if (exists) {
      setErrorMsg('您已加入此班級，無須重複加入！');
      return;
    }

    // 3. Call classroom API with offline / demo fallback
    try {
      const res = await classroomApi.joinClassroom({ joinCode: cleanCode });
      if (res.success && res.data) {
        const newClass: EnrolledClass = {
          id: res.data.classId,
          name: res.data.className,
          code: cleanCode,
          teacherName: res.data.teacherName || '任課教師',
          semester: '113學年度第一學期',
          enrolledAt: new Date().toLocaleDateString('zh-TW'),
          announcementsCount: 1,
        };

        const updated = [newClass, ...enrolledList.filter((c) => c.id !== newClass.id)];
        setEnrolledList(updated);
        saveEnrolledClasses(userId, updated);
        setSuccessMsg(res.message || `成功加入班級：「${newClass.name}」！`);
        setJoinCode('');
        onClassJoined?.(newClass);
      } else {
        setErrorMsg(res.error?.message || '加入班級失敗，請確認邀請碼正確性');
      }
    } catch {
      setErrorMsg('加入班級時發生連線錯誤，請稍後再試');
    }
  };

  const handleLeaveClass = (classId: string) => {
    const updated = enrolledList.filter((c) => c.id !== classId);
    setEnrolledList(updated);
    saveEnrolledClasses(userId, updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="class-join-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--surface-sunken)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Users size={20} color="var(--color-brand-gold)" />
            <h2 id="class-join-title" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
              加入教學班級 (Join Classroom)
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#FEF3C7',
                color: '#92400E',
                fontWeight: 600,
              }}
            >
              本機展示模擬
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉對話框"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '10px',
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleJoin} style={{ marginBottom: '24px' }}>
            <label
              htmlFor="join-code-input"
              style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}
            >
              請輸入指導教師提供的 8 碼班級邀請碼：
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                id="join-code-input"
                type="text"
                maxLength={8}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="例如：7K9M3X2P"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-default)',
                  fontSize: '16px',
                  fontFamily: 'monospace',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0 20px', fontWeight: 700 }}
              >
                確認加入
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
              💡 提示：邀請碼不分大小寫，系統已自動剔除易混淆字元（0, O, 1, I, L）。
            </p>
            <p style={{ fontSize: '11px', color: '#92400E', margin: '6px 0 0 0', backgroundColor: '#FEF3C7', padding: '6px 10px', borderRadius: '4px', lineHeight: 1.5 }}>
              ⚠️ 模式說明：目前為展示體驗模式，班級加入記錄暫存於本機瀏覽器（Local Mock），待正式雲端資料庫與 API 授權啟用後將進行伺服器連線。
            </p>

            {errorMsg && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '4px',
                  color: '#B91C1C',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '4px',
                  color: '#15803D',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}
          </form>

          {/* Current Enrolled Classes */}
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              已加入的班級清單 ({enrolledList.length})
            </h3>
            {enrolledList.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  textAlign: 'center',
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                目前尚未加入任何班級。請向指導教師索取 8 碼邀請碼加入。
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {enrolledList.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-default)',
                      backgroundColor: 'var(--surface-sunken)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {c.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        授課教師：{c.teacherName} · {c.semester}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLeaveClass(c.id)}
                      title="退出班級"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#DC2626',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <LogOut size={14} />
                      <span>退班</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'right',
            backgroundColor: 'var(--surface-sunken)',
          }}
        >
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
