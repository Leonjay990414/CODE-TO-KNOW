import React, { useState } from 'react';
import {
  Trophy,
  X,
  Compass,
  Puzzle,
  Palette,
  Bug,
  Zap,
  Layout,
  Star,
  Sparkles,
  Award,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  getDetailedAchievements,
} from '../utils/gameAchievementEngine';

interface GameAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const GameAchievementsModal: React.FC<GameAchievementsModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  if (!isOpen) return null;

  const data = getDetailedAchievements(userId);

  const filteredAchievements = data.achievements.filter((ach) => {
    if (filter === 'unlocked') return ach.isUnlocked;
    if (filter === 'locked') return !ach.isUnlocked;
    return true;
  });

  const renderBadgeIcon = (iconName: string, color: string, isUnlocked: boolean) => {
    const size = 24;
    const effectiveColor = isUnlocked ? color : '#94A3B8';

    switch (iconName) {
      case 'Compass':
        return <Compass size={size} color={effectiveColor} />;
      case 'Puzzle':
        return <Puzzle size={size} color={effectiveColor} />;
      case 'Palette':
        return <Palette size={size} color={effectiveColor} />;
      case 'Bug':
        return <Bug size={size} color={effectiveColor} />;
      case 'Zap':
        return <Zap size={size} color={effectiveColor} />;
      case 'Layout':
        return <Layout size={size} color={effectiveColor} />;
      case 'Star':
        return <Star size={size} color={effectiveColor} fill={isUnlocked ? color : 'none'} />;
      case 'Sparkles':
        return <Sparkles size={size} color={effectiveColor} />;
      case 'Award':
        return <Award size={size} color={effectiveColor} />;
      case 'Trophy':
      default:
        return <Trophy size={size} color={effectiveColor} />;
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
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '720px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                遊戲成就與榮譽徽章館
              </h2>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>
                透過五大互動遊戲挑戰解鎖專屬徽章，紀錄你的全方位程式學習歷程。
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              成就解鎖進度：{data.unlockedCount} / {data.totalCount} ({data.unlockedPercentage}%)
            </span>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>
              {data.unlockedCount === data.totalCount ? '🎉 全成就達成！' : `尚有 ${data.totalCount - data.unlockedCount} 項待探索`}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#E2E8F0',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${data.unlockedPercentage}%`,
                height: '100%',
                backgroundColor: '#2563EB',
                borderRadius: '9999px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            {(['all', 'unlocked', 'locked'] as const).map((tab) => {
              const active = filter === tab;
              const labels = {
                all: `全部 (${data.totalCount})`,
                unlocked: `已解鎖 (${data.unlockedCount})`,
                locked: `尚未達成 (${data.totalCount - data.unlockedCount})`,
              };
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid #2563EB' : '1px solid #E2E8F0',
                    backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                    color: active ? '#2563EB' : '#64748B',
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Badges List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {filteredAchievements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
              <Lock size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <div style={{ fontSize: '14px', fontWeight: 600 }}>暫無符合條件的成就</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>前往各遊戲進行挑戰，即可點亮專屬徽章！</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
                gap: '12px',
              }}
            >
              {filteredAchievements.map((ach) => (
                <div
                  key={ach.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: ach.isUnlocked ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                    backgroundColor: ach.isUnlocked ? '#FFFFFF' : '#F8FAFC',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    position: 'relative',
                    boxShadow: ach.isUnlocked ? '0 2px 4px rgba(37,99,235,0.06)' : 'none',
                  }}
                >
                  {/* Badge Icon circle */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      backgroundColor: ach.isUnlocked ? `${ach.badgeColor}15` : '#E2E8F0',
                      border: ach.isUnlocked ? `2px solid ${ach.badgeColor}` : '2px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {renderBadgeIcon(ach.badgeIcon, ach.badgeColor, ach.isUnlocked)}
                  </div>

                  {/* Badge Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: ach.isUnlocked ? '#0F172A' : '#64748B',
                        }}
                      >
                        {ach.title}
                      </span>
                      {ach.isUnlocked ? (
                        <CheckCircle2 size={14} color="#16A34A" />
                      ) : (
                        <Lock size={12} color="#94A3B8" />
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '6px' }}>
                      {ach.subtitle}
                    </div>

                    <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px', lineHeight: 1.5 }}>
                      {ach.description}
                    </p>

                    <div
                      style={{
                        padding: '4px 8px',
                        backgroundColor: ach.isUnlocked ? '#F0FDF4' : '#F1F5F9',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: ach.isUnlocked ? '#166534' : '#64748B',
                        display: 'inline-block',
                      }}
                    >
                      {ach.isUnlocked
                        ? `✓ 已達成：${ach.requirementDescription}`
                        : `條件：${ach.requirementDescription}`}
                    </div>

                    {ach.isUnlocked && ach.unlockedAt && (
                      <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                        解鎖時間：{new Date(ach.unlockedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#0F172A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
