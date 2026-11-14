import React, { useEffect, useRef } from 'react';
import {
  HelpCircle,
  X,
  Target,
  MousePointer,
  Star,
  Clock,
  Lightbulb,
  AlertCircle,
  Play,
} from 'lucide-react';

export interface GameBriefingConfig {
  gameId: string;
  gameTitle: string;
  gameSubtitle: string;
  objective: string;
  controlsGuide: string;
  levelsCount: number | string;
  timerDescription: string;
  scoringFormula: string;
  starRules: [string, string, string]; // 3-star, 2-star, 1-star
  hintNotice: string;
  pedagogicalGoal: string;
}

interface GameBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GameBriefingConfig;
}

export const GameBriefingModal: React.FC<GameBriefingModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const actionButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary action button when modal opens
    actionButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        zIndex: 1100,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {config.gameTitle}｜新手導引與計分規則
              </h2>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{config.gameSubtitle}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="關閉說明視窗"
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', fontSize: '13px', lineHeight: 1.6 }}>
          {/* Objective */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              <Target size={16} color="#2563EB" />
              <span>挑戰目標</span>
            </div>
            <p style={{ margin: 0, color: '#475569' }}>{config.objective}</p>
          </div>

          {/* Controls */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              <MousePointer size={16} color="#059669" />
              <span>操作方式</span>
            </div>
            <p style={{ margin: 0, color: '#475569' }}>{config.controlsGuide}</p>
          </div>

          {/* Time & Levels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>
                <Clock size={12} />
                <span>計時規格</span>
              </div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>{config.timerDescription}</div>
            </div>
            <div style={{ padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>關卡規模</div>
              <div style={{ fontWeight: 600, color: '#0F172A' }}>共 {config.levelsCount} 關 / 回合</div>
            </div>
          </div>

          {/* Scoring & Star Rules */}
          <div style={{ marginBottom: '16px', padding: '12px 14px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>
              <Star size={16} fill="#F59E0B" color="#F59E0B" />
              <span>星級評定標準</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#78350F' }}>
              <div>★★★ 三星卓越：{config.starRules[0]}</div>
              <div>★★☆ 二星良好：{config.starRules[1]}</div>
              <div>★☆☆ 一星通關：{config.starRules[2]}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#B45309', marginTop: '6px' }}>
              積分公式：{config.scoringFormula}
            </div>
          </div>

          {/* Hints & Pedagogical */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>
              <Lightbulb size={16} color="#D97706" />
              <span>漸進提示與學習引導</span>
            </div>
            <p style={{ margin: 0, color: '#475569' }}>{config.hintNotice}</p>
          </div>

          {/* Official Disclaimer Banner */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: '#EFF6FF',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              fontSize: '11px',
              color: '#1E40AF',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: 1.5,
            }}
          >
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>教育平台說明：</strong>本遊戲之計時、Combo、星級與積分為「碼上學」平台專屬之自主學習引導機制，並非勞動部技術士技能檢定正式評分規則。正式檢定學科為 80 題單選題、總分 100 分、60 分及格。
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            ref={actionButtonRef}
            onClick={onClose}
            className="btn-nowrap"
            style={{
              padding: '8px 20px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Play size={14} />
            <span>我瞭解了，開始挑戰</span>
          </button>
        </div>
      </div>
    </div>
  );
};
