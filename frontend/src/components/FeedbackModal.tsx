import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MessageSquarePlus,
  Star,
  CheckCircle2,
  AlertCircle,
  Send,
  HelpCircle,
  Bug,
  FileQuestion,
  Lightbulb,
} from 'lucide-react';
import {
  FeedbackCategory,
  submitFeedback,
  FeedbackItem,
} from '../utils/feedbackStorage';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userRole?: string;
  onSubmitted?: (item: FeedbackItem) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  userId,
  userRole,
  onSubmitted,
}) => {
  const [category, setCategory] = useState<FeedbackCategory>('general');
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsSubmitted(false);
      setErrorMsg('');
      setTitle('');
      setContent('');
      setCategory('general');
      setRating(5);
    }
  }, [isOpen]);

  // Accessibility: Escape key handling
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('請填寫回饋標題');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('請填寫回饋內容說明');
      return;
    }

    try {
      const item = submitFeedback({
        userId,
        userRole,
        category,
        rating,
        title,
        content,
        contactEmail: contactEmail.trim() || undefined,
      });

      setIsSubmitted(true);
      if (onSubmitted) {
        onSubmitted(item);
      }
    } catch {
      setErrorMsg('提交回饋時發生問題，請稍候再試。');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(38, 52, 61, 0.45)',
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
        role="dialog"
        aria-label="使用者回饋與問題回報"
        aria-modal="true"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          boxShadow: '0 20px 40px rgba(38, 52, 61, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #ECE7DE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FAF8F5',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#F5F2EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#BDA77E',
              }}
            >
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#26343D',
                  margin: 0,
                }}
              >
                使用者回饋與意見反應
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: '#8FA9B8',
                  margin: '2px 0 0 0',
                }}
              >
                碼上學學習平台持續進化，感謝您的寶貴建議
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="關閉回饋彈窗"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#8FA9B8',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {isSubmitted ? (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '28px',
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#26343D',
                  margin: '4px 0 0 0',
                }}
              >
                回饋已成功送出！
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#526B7B',
                  maxWidth: '380px',
                  lineHeight: '1.6',
                  margin: 0,
                }}
              >
                感謝您協助我們完善碼上學平台。本回饋已收錄至本機緩衝清單，我們將持續優化教學體驗。
              </p>
              <button
                onClick={onClose}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: '#BDA77E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                完成並關閉
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#FFEBEE',
                    color: '#C62828',
                    padding: '10px 14px',
                    borderRadius: '8px',
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

              {/* Category Selector */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#26343D',
                    marginBottom: '8px',
                  }}
                >
                  回饋類型
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                    gap: '8px',
                  }}
                >
                  {[
                    { id: 'general', label: '一般意見', icon: HelpCircle },
                    { id: 'exam', label: '測驗題庫', icon: FileQuestion },
                    { id: 'feature', label: '功能建議', icon: Lightbulb },
                    { id: 'bug', label: '問題回報', icon: Bug },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as FeedbackCategory)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #BDA77E' : '1px solid #ECE7DE',
                          backgroundColor: isSelected ? '#FAF8F5' : '#FFFFFF',
                          color: isSelected ? '#BDA77E' : '#526B7B',
                          fontWeight: isSelected ? 600 : 400,
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Icon size={14} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#26343D',
                    marginBottom: '6px',
                  }}
                >
                  整體滿意度評分
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      aria-label={`${star} 顆星`}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: star <= rating ? '#BDA77E' : '#D9D2C4',
                        transition: 'transform 0.1s ease',
                      }}
                    >
                      <Star size={24} fill={star <= rating ? '#BDA77E' : 'none'} />
                    </button>
                  ))}
                  <span style={{ fontSize: '13px', color: '#8FA9B8', marginLeft: '6px' }}>
                    {rating} / 5 分
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label
                  htmlFor="feedback-title"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#26343D',
                    marginBottom: '6px',
                  }}
                >
                  主旨摘要 <span style={{ color: '#E53935' }}>*</span>
                </label>
                <input
                  id="feedback-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例：模擬考交卷後未顯示雷達圖"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ECE7DE',
                    fontSize: '14px',
                    color: '#26343D',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <label
                  htmlFor="feedback-content"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#26343D',
                    marginBottom: '6px',
                  }}
                >
                  詳細說明 <span style={{ color: '#E53935' }}>*</span>
                </label>
                <textarea
                  id="feedback-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="請盡可能詳述您所遇到的狀況、操作步驟或改進建議..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ECE7DE',
                    fontSize: '14px',
                    color: '#26343D',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Contact Email (Optional) */}
              <div>
                <label
                  htmlFor="feedback-email"
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#26343D',
                    marginBottom: '6px',
                  }}
                >
                  聯絡信箱（選填，便於後續回覆處理進度）
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ECE7DE',
                    fontSize: '14px',
                    color: '#26343D',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '8px',
                }}
              >
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #ECE7DE',
                    backgroundColor: '#FFFFFF',
                    color: '#526B7B',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#BDA77E',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(189, 167, 126, 0.25)',
                  }}
                >
                  <Send size={15} />
                  <span>送出回饋</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
