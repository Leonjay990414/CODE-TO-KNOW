import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Trash2,
  Clock,
  BookOpen,
  Trophy,
  Users,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  InAppNotification,
  NotificationCategory,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearReadNotifications,
} from '../utils/notificationStorage';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onNavigate?: (route: string) => void;
  onNotificationsUpdated?: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userId,
  onNavigate,
  onNotificationsUpdated,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const modalRef = useRef<HTMLDivElement>(null);

  const refreshList = () => {
    const list = getNotifications(userId);
    setNotifications(list);
    if (onNotificationsUpdated) {
      onNotificationsUpdated();
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, userId]);

  // Accessibility: Escape key handling
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

  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter((n) => n.category === activeCategory);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkOne = (id: string) => {
    const updated = markAsRead(userId, id);
    setNotifications(updated);
    if (onNotificationsUpdated) onNotificationsUpdated();
  };

  const handleMarkAll = () => {
    const updated = markAllAsRead(userId);
    setNotifications(updated);
    if (onNotificationsUpdated) onNotificationsUpdated();
  };

  const handleClearRead = () => {
    const updated = clearReadNotifications(userId);
    setNotifications(updated);
    if (onNotificationsUpdated) onNotificationsUpdated();
  };

  const handleAction = (item: InAppNotification) => {
    handleMarkOne(item.id);
    if (item.actionRoute && onNavigate) {
      onClose();
      onNavigate(item.actionRoute);
    }
  };

  const formatTime = (ts: number) => {
    const diffMin = Math.round((Date.now() - ts) / 60000);
    if (diffMin < 1) return '剛剛';
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `${diffHours} 小時前`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} 天前`;
  };

  const getCategoryBadge = (cat: NotificationCategory) => {
    switch (cat) {
      case 'system':
        return {
          label: '系統公告',
          icon: <Info size={13} />,
          bg: '#EAF0F6',
          color: '#2B4C6F',
        };
      case 'exam':
        return {
          label: '測驗提醒',
          icon: <Clock size={13} />,
          bg: '#FDF3E7',
          color: '#9C6218',
        };
      case 'classroom':
        return {
          label: '班級通知',
          icon: <Users size={13} />,
          bg: '#EBF6EE',
          color: '#246B3E',
        };
      case 'achievement':
        return {
          label: '學習成就',
          icon: <Trophy size={13} />,
          bg: '#FBF0E4',
          color: '#A06E28',
        };
      default:
        return {
          label: '一般',
          icon: <BookOpen size={13} />,
          bg: '#F5F2EA',
          color: '#555',
        };
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 35, 43, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="站內通知中心"
      ref={modalRef}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF8F5',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          border: '1px solid #E5DFD5',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #EAE5DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#F5F2EA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-brand-gold-text, #7C663D)',
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2D3748' }}>
                  站內通知中心
                </h3>
                {unreadCount > 0 && (
                  <span
                    style={{
                      backgroundColor: '#BDA77E',
                      color: 'var(--color-brand-charcoal, #26343D)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {unreadCount} 未讀
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>
                掌握最新考題動態、班級通知與成就解鎖進度
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉通知中心"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#718096',
              padding: '10px',
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #EAE5DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {(
              [
                { id: 'all', label: '全部' },
                { id: 'system', label: '系統公告' },
                { id: 'exam', label: '測驗提醒' },
                { id: 'classroom', label: '班級通知' },
                { id: 'achievement', label: '學習成就' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '8px 14px',
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: activeCategory === cat.id ? 700 : 500,
                  border: activeCategory === cat.id ? '1px solid #BDA77E' : '1px solid #E2E8F0',
                  backgroundColor: activeCategory === cat.id ? '#F5F2EA' : 'transparent',
                  color: activeCategory === cat.id ? '#6B542C' : '#4A5568',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B542C',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  padding: '4px 8px',
                }}
                title="將所有通知標為已讀"
              >
                <CheckCircle2 size={14} />
                <span>全部已讀</span>
              </button>
            )}
            {notifications.some((n) => n.isRead) && (
              <button
                type="button"
                onClick={handleClearRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A0AEC0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                }}
                title="清除所有已讀通知"
              >
                <Trash2 size={14} />
                <span>清除已讀</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List Body */}
        <div
          style={{
            padding: '16px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: '#A0AEC0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Bell size={40} strokeWidth={1.5} color="#CBD5E0" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: '#4A5568' }}>
                  目前沒有此分類的通知
                </div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                  當有最新考卷指派、系統公告或成就達成時，將在此處顯示
                </div>
              </div>
            </div>
          ) : (
            filtered.map((item) => {
              const badge = getCategoryBadge(item.category);
              return (
                <div
                  key={item.id}
                  onClick={() => !item.isRead && handleMarkOne(item.id)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    backgroundColor: item.isRead ? '#FFFFFF' : '#F9F8F5',
                    border: item.isRead ? '1px solid #EDE8E1' : '1px solid #BDA77E',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    cursor: item.isRead ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span style={{ fontSize: '12px', color: '#A0AEC0' }}>
                        {formatTime(item.timestamp)}
                      </span>
                    </div>

                    {!item.isRead && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#BDA77E',
                          display: 'inline-block',
                        }}
                        title="未讀通知"
                      />
                    )}
                  </div>

                  <div>
                    <h4
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: item.isRead ? 600 : 700,
                        color: '#2D3748',
                      }}
                    >
                      {item.title}
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: '#4A5568',
                        lineHeight: 1.5,
                      }}
                    >
                      {item.content}
                    </p>
                  </div>

                  {item.actionRoute && (
                    <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-start' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(item);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#F5F2EA',
                          border: '1px solid #BDA77E',
                          color: '#6B542C',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{item.actionLabel || '查看詳情'}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #EAE5DC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#718096',
          }}
        >
          <span>通知紀錄保存於當前瀏覽器本機</span>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            style={{ fontSize: '12px', padding: '4px 12px' }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
