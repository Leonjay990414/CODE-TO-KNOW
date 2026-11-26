import React from 'react';
import { Sparkles, Target, Compass, BookOpen, Award, ArrowRight } from 'lucide-react';
import { ActionType, WeaknessStatus, SuggestedActionPayload } from '../../services/api';

interface AdaptiveActionCardProps {
  primaryFocus: {
    id: string;
    code: string;
    name: string;
    status: WeaknessStatus;
    weaknessIndex: number;
    suggestedAction: SuggestedActionPayload | null;
  } | null;
  onActionClick?: (subjectCode: string) => void;
}

export const AdaptiveActionCard: React.FC<AdaptiveActionCardProps> = ({
  primaryFocus,
  onActionClick,
}) => {
  if (!primaryFocus || !primaryFocus.suggestedAction) {
    return (
      <div
        className="card"
        style={{
          padding: '24px',
          backgroundColor: 'var(--surface-raised)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={18} color="var(--color-brand-gold)" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>智慧個人化學習推薦</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          目前尚無明確弱點警示，請維持日常測驗練習以持續更新能力模型。
        </p>
      </div>
    );
  }

  const action = primaryFocus.suggestedAction;

  const getActionBadge = (actionType: ActionType) => {
    switch (actionType) {
      case 'TARGETED_PRACTICE':
        return {
          label: '專項弱點突圍',
          icon: Target,
          bg: '#FEF2F2',
          text: '#991B1B',
          border: '#F87171',
        };
      case 'EXPLORE_CHAPTER':
        return {
          label: '新章節探索',
          icon: Compass,
          bg: '#EFF6FF',
          text: '#1E40AF',
          border: '#93C5FD',
        };
      case 'GENERAL_REVIEW':
        return {
          label: '定期防遺忘抽測',
          icon: BookOpen,
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FBBF24',
        };
      case 'MOCK_EXAM_SPRINT':
        return {
          label: '全真模擬考衝刺',
          icon: Award,
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#34D399',
        };
      default:
        return {
          label: '學習建議',
          icon: Sparkles,
          bg: 'var(--surface-sunken)',
          text: 'var(--text-primary)',
          border: 'var(--border-default)',
        };
    }
  };

  const badge = getActionBadge(action.actionType);
  const ActionIcon = badge.icon;

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        border: '1.5px solid var(--color-brand-gold)',
        boxShadow: '0 4px 16px rgba(189, 167, 126, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div>
        {/* Header: Title and Type Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--color-brand-gold)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              AI 智慧推薦攻克閉環
            </h3>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
            }}
          >
            <ActionIcon size={12} />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Target Subject Focus */}
        <div
          style={{
            backgroundColor: 'var(--surface-sunken)',
            padding: '12px 14px',
            borderRadius: '6px',
            marginBottom: '14px',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
            首要推薦加強項目
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
              {primaryFocus.code} {primaryFocus.name}
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: primaryFocus.weaknessIndex >= 65 ? '#DC2626' : 'var(--text-muted)',
              }}
            >
              WI: {primaryFocus.weaknessIndex.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Rationale & Objective */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
            <strong>診斷依據：</strong>
            {action.rationaleZh}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
            <strong>攻克目標：</strong>
            {action.objectiveZh}（建議完成 <strong>{action.targetQuestionCount} 題</strong>）
          </div>
        </div>
      </div>

      {/* CTA Button */}
      {onActionClick && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => onActionClick(primaryFocus.code)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
            fontWeight: 700,
          }}
        >
          <span>立即啟動專項閉環練習 ({action.targetQuestionCount} 題)</span>
          <ArrowRight size={15} />
        </button>
      )}
    </div>
  );
};
